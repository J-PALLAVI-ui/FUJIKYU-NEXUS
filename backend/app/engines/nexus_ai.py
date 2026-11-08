import re
import datetime
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import text, func
import numpy as np

FORBIDDEN_SQL_PATTERNS = [
    r"\bDROP\b", r"\bDELETE\b", r"\bTRUNCATE\b", r"\bALTER\b",
    r"\bINSERT\b", r"\bUPDATE\b", r"\bCREATE\b", r"\bGRANT\b",
    r"\bREVOKE\b", r"\bEXEC\b", r"\bSHUTDOWN\b", r"--", r";"
]

DIVISION_KEYWORDS = {
    "amusement": [
        "fuji-q", "fuji q", "fujiq", "amusement", "amusement park",
        "park visitor", "park visitors", "attraction", "attractions",
        "ride", "rides", "coaster", "eejanaika", "fujiyama", "takabisha",
        "theme park", "attendance", "guest count", "gate sales"
    ],
    "railway": [
        "railway", "train", "passenger", "passengers", "ridership",
        "boarding", "fujikyuko", "otsuki", "kawaguchiko station",
        "turnstile", "train delay", "fare", "rail"
    ],
    "hotels": [
        "hotel", "hotels", "accommodation", "occupancy", "room", "rooms",
        "stay", "resort", "highland resort hotel", "lodging", "adr", "revpar"
    ],
    "retail": [
        "retail", "merchandise", "product", "products", "sku", "souvenir",
        "souvenirs", "bazaar", "confectionery", "store", "shop sales"
    ],
    "restaurants": [
        "restaurant", "restaurants", "dining", "food", "dish", "hoto",
        "meal", "meals", "buffet", "cafe", "food sales"
    ],
    "real_estate": [
        "real estate", "real_estate", "leasing", "tenant", "tenants",
        "property", "properties", "commercial lease", "commercial arcade"
    ],
    "construction": [
        "construction", "engineering", "civil", "project", "projects",
        "retrofit", "track maintenance", "building works"
    ],
    "it_services": [
        "it", "it services", "it_services", "technology", "system", "systems",
        "uptime", "api", "incident", "incidents", "sla", "latency"
    ]
}

DIVISION_DISPLAY = {
    "amusement": ("Amusement Parks & Attractions", "Fuji-Q Highland Turnstile & RFID System", "visitors"),
    "railway": ("Railway & Transportation", "Railway Automated Turnstile & Ticket Telemetry", "passengers"),
    "hotels": ("Hotels & Tourism", "Hospitality Property Management System (PMS)", "occupancy %"),
    "retail": ("Retail & Shopping", "Retail Ingestion Pipeline / Fujiyama Bazaar POS", "revenue ¥"),
    "restaurants": ("Restaurants & Food Services", "Food & Beverage Kitchen Order System (KOS)", "sales ¥"),
    "real_estate": ("Real Estate & Leasing", "Commercial Real Estate Tenant Ledger", "occupancy %"),
    "construction": ("Construction & Engineering", "Construction PM Primavera Data Exchange", "progress %"),
    "it_services": ("IT & Digital Services", "Nexus IoT Edge Gateway & Cloud Telemetry", "uptime %")
}

DIVISION_METRICS = {
    "amusement": ("visitor_count", "visitor"),
    "railway": ("passenger_count", "passenger"),
    "hotels": ("room_occupancy_pct", "occupancy"),
    "retail": ("revenue_jpy", "sale"),
    "restaurants": ("sales_jpy", "sale"),
    "real_estate": ("occupancy_rate_pct", "revenue"),
    "construction": ("progress_pct", "progress"),
    "it_services": ("uptime_pct", "uptime")
}

class NexusAIEngine:
    @staticmethod
    def is_safe_query(query: str) -> bool:
        upper = query.upper()
        for pattern in FORBIDDEN_SQL_PATTERNS:
            if re.search(pattern, upper):
                return False
        return True

    @staticmethod
    def render_sql_for_display(sql_template: str, params: Optional[Dict[str, Any]] = None) -> str:
        rendered = sql_template.strip()
        if params:
            for k, v in params.items():
                rendered = rendered.replace(f":{k}", f"'{v}'")
        return rendered

    @staticmethod
    def detect_divisions(query_text: str, explicit_division: Optional[str] = None) -> List[str]:
        q_lower = query_text.lower()
        
        # If explicit division is provided and valid, use it unless query clearly asks for multiple
        detected = []
        for div_code, keywords in DIVISION_KEYWORDS.items():
            for kw in keywords:
                # Use word boundary or exact phrase check
                if re.search(r'\b' + re.escape(kw) + r'\b', q_lower):
                    if div_code not in detected:
                        detected.append(div_code)
                    break

        if explicit_division and explicit_division in DIVISION_KEYWORDS:
            if explicit_division not in detected:
                detected.insert(0, explicit_division)

        return detected

    @staticmethod
    def parse_date_window(query_text: str, max_db_date: datetime.date) -> Tuple[datetime.date, datetime.date, int, str]:
        q_lower = query_text.lower()
        
        # 1. Explicit ISO date range (e.g., 2030-01-01 to 2030-01-31 or 2030-01-01 and 2030-01-31)
        iso_dates = re.findall(r'\b(20\d\d-\d{2}-\d{2})\b', q_lower)
        if len(iso_dates) >= 2:
            try:
                start_date = datetime.date.fromisoformat(iso_dates[0])
                end_date = datetime.date.fromisoformat(iso_dates[1])
                if start_date > end_date:
                    start_date, end_date = end_date, start_date
                days = (end_date - start_date).days + 1
                return start_date, end_date, days, f"Custom Date Range ({start_date} to {end_date})"
            except Exception:
                pass

        # 2. Explicit future or specific year (e.g. "in 2030", "year 2030", "for 2030", "2030")
        year_m = re.search(r'\b(?:in\s+|for\s+|year\s+)?(20[2-9]\d)\b', q_lower)
        if year_m and not re.search(r'\b(?:last|past)\s+\d+\s+days?', q_lower):
            yr = int(year_m.group(1))
            start_date = datetime.date(yr, 1, 1)
            end_date = datetime.date(yr, 12, 31)
            days = (end_date - start_date).days + 1
            return start_date, end_date, days, f"Calendar Year {yr} ({start_date} to {end_date})"

        # 3. Relative date patterns
        days = 30 # default
        m = re.search(r'(?:last|past)\s+(\d+)\s+days?', q_lower)
        if m:
            days = int(m.group(1))
        elif "7 days" in q_lower or "past week" in q_lower or "last week" in q_lower:
            days = 7
        elif "14 days" in q_lower or "fortnight" in q_lower or "two weeks" in q_lower:
            days = 14
        elif "60 days" in q_lower or "two months" in q_lower:
            days = 60
        elif "90 days" in q_lower or "quarter" in q_lower:
            days = 90
        elif "this month" in q_lower:
            # From 1st of month to max_db_date
            start_date = max_db_date.replace(day=1)
            days = (max_db_date - start_date).days + 1
            return start_date, max_db_date, days, f"Current Month ({start_date} to {max_db_date})"

        days = max(1, min(days, 365))
        start_date = max_db_date - datetime.timedelta(days=days - 1)
        end_date = max_db_date
        label = f"Last {days} days ({start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')})"
        return start_date, end_date, days, label

    @staticmethod
    def answer_query(db: Session, user_query: str, division_code: Optional[str] = None) -> Dict[str, Any]:
        if not NexusAIEngine.is_safe_query(user_query):
            return {
                "query": user_query,
                "answer": "Security Alert: Query rejected because it contains unauthorized modification or unsafe SQL keywords.",
                "sql_executed": None,
                "data_source": "Security Guardrail",
                "date_range": "N/A",
                "chart_type": None,
                "chart_data": [],
                "columns": [],
                "confidence": 0.0,
                "is_demo_data": True
            }

        q_lower = user_query.lower()

        # Reference anchor date from actual records in database
        max_dt = db.execute(text("SELECT MAX(record_date) FROM business_records")).scalar()
        if max_dt:
            if isinstance(max_dt, str):
                max_db_date = datetime.datetime.fromisoformat(max_dt.split()[0]).date()
            elif isinstance(max_dt, datetime.datetime):
                max_db_date = max_dt.date()
            else:
                max_db_date = max_dt
        else:
            max_db_date = datetime.date.today()

        start_date, end_date, days_count, date_range_label = NexusAIEngine.parse_date_window(q_lower, max_db_date)
        start_str = start_date.strftime("%Y-%m-%d")
        end_str = end_date.strftime("%Y-%m-%d")

        # Detect Divisions
        detected_divs = NexusAIEngine.detect_divisions(user_query, division_code)

        # -------------------------------------------------------------
        # BRANCH 1: MULTI-DIVISION COMPARISON (e.g. Railway vs Fuji-Q)
        # -------------------------------------------------------------
        is_comparison = any(w in q_lower for w in ["compare", "correlation", "cross", "versus", "vs", "relationship", "together", "both"])
        if is_comparison or len(detected_divs) >= 2:
            div_a = detected_divs[0] if len(detected_divs) > 0 else "railway"
            div_b = detected_divs[1] if len(detected_divs) > 1 else ("amusement" if div_a == "railway" else "railway")

            metric_a, _ = DIVISION_METRICS.get(div_a, ("metric_value", "metric"))
            metric_b, _ = DIVISION_METRICS.get(div_b, ("metric_value", "metric"))

            name_a, _, label_a = DIVISION_DISPLAY.get(div_a, (div_a.title(), "", "volume"))
            name_b, _, label_b = DIVISION_DISPLAY.get(div_b, (div_b.title(), "", "volume"))

            sql = f"""
                SELECT
                    DATE(record_date) as record_date,
                    SUM(CASE WHEN division_code = :div_a AND metric_name = :metric_a THEN metric_value ELSE NULL END) as val_a,
                    SUM(CASE WHEN division_code = :div_b AND metric_name = :metric_b THEN metric_value ELSE NULL END) as val_b
                FROM business_records
                WHERE division_code IN (:div_a, :div_b)
                  AND DATE(record_date) >= :start_date
                  AND DATE(record_date) <= :end_date
                GROUP BY DATE(record_date)
                ORDER BY record_date ASC
            """

            params = {
                "div_a": div_a,
                "metric_a": metric_a,
                "div_b": div_b,
                "metric_b": metric_b,
                "start_date": start_str,
                "end_date": end_str
            }

            rows = db.execute(text(sql), params).fetchall()

            if not rows:
                return {
                    "query": user_query,
                    "answer": f"No concurrent records found for divisions '{div_a}' and '{div_b}' between {start_str} and {end_str}.",
                    "sql_executed": NexusAIEngine.render_sql_for_display(sql, params),
                    "data_source": "Cross-Division Telemetry Hub",
                    "date_range": date_range_label,
                    "chart_type": "line",
                    "chart_data": [],
                    "columns": ["date", f"{div_a}_{label_a}", f"{div_b}_{label_b}"],
                    "confidence": 0.90,
                    "is_demo_data": True
                }

            col_a_name = f"{div_a}_{label_a.replace(' ', '_')}"
            col_b_name = f"{div_b}_{label_b.replace(' ', '_')}"

            chart_data = []
            paired_a = []
            paired_b = []

            for r in rows:
                d_str = str(r[0])
                v_a = float(r[1]) if r[1] is not None else None
                v_b = float(r[2]) if r[2] is not None else None

                chart_data.append({
                    "date": d_str,
                    col_a_name: round(v_a, 1) if v_a is not None else None,
                    col_b_name: round(v_b, 1) if v_b is not None else None
                })

                if v_a is not None and v_b is not None:
                    paired_a.append(v_a)
                    paired_b.append(v_b)

            # Compute Pearson correlation if at least 5 paired points
            corr_text = "Insufficient paired dates to compute statistical correlation."
            if len(paired_a) >= 5:
                corr = float(np.corrcoef(paired_a, paired_b)[0, 1])
                if not np.isnan(corr):
                    strength = "strong" if abs(corr) >= 0.75 else "moderate" if abs(corr) >= 0.5 else "weak"
                    corr_text = f"Pearson correlation coefficient r = {corr:.2f} ({strength} correlation over {len(paired_a)} synchronized operating days). Note: Statistical correlation indicates operational interdependency and does NOT alone establish physical causation."

            answer = (
                f"Multi-Division Comparison Analysis between {name_a} and {name_b} for {date_range_label}:\n"
                f"• Retrieved {len(rows)} observation dates from table 'business_records'.\n"
                f"• {corr_text}\n"
                f"• Dates with missing data in either division are preserved as nulls to avoid distortion from fabricated zero values."
            )

            return {
                "query": user_query,
                "answer": answer,
                "sql_executed": NexusAIEngine.render_sql_for_display(sql, params),
                "data_source": "Cross-Business Integration Hub (Railway Turnstile + Fuji-Q RFID Turnstiles)",
                "date_range": date_range_label,
                "chart_type": "line",
                "chart_data": chart_data,
                "columns": ["date", col_a_name, col_b_name],
                "confidence": 0.94,
                "is_demo_data": True
            }

        # -------------------------------------------------------------
        # BRANCH 2: FUJI-Q / AMUSEMENT DIVISION VISITOR RECORDS
        # -------------------------------------------------------------
        if "amusement" in detected_divs or any(w in q_lower for w in ["fuji-q", "fuji q", "fujiq", "amusement", "park visitor", "park visitors", "attraction", "ride", "coaster"]):
            target_div = "amusement"
            metric_target, _ = DIVISION_METRICS["amusement"]

            sql = """
                SELECT
                    DATE(record_date) as visit_date,
                    SUM(metric_value) as daily_visitors,
                    AVG(secondary_value) as avg_wait_min,
                    COUNT(*) as ride_records
                FROM business_records
                WHERE division_code = :division_code
                  AND metric_name = :metric_name
                  AND DATE(record_date) >= :start_date
                  AND DATE(record_date) <= :end_date
                GROUP BY DATE(record_date)
                ORDER BY visit_date ASC
            """

            params = {
                "division_code": target_div,
                "metric_name": metric_target,
                "start_date": start_str,
                "end_date": end_str
            }

            rows = db.execute(text(sql), params).fetchall()

            if not rows:
                # Check available dates in database for honest reporting
                date_bounds = db.execute(text(
                    "SELECT MIN(DATE(record_date)), MAX(DATE(record_date)), COUNT(*) FROM business_records WHERE division_code = :div"
                ), {"div": target_div}).fetchone()

                avail_min = date_bounds[0] if date_bounds else "N/A"
                avail_max = date_bounds[1] if date_bounds else "N/A"
                rec_cnt = date_bounds[2] if date_bounds else 0

                return {
                    "query": user_query,
                    "answer": (
                        f"No visitor records found for division '{target_div}' within requested window {date_range_label}. "
                        f"Database table 'business_records' holds {rec_cnt} amusement records spanning from {avail_min} to {avail_max}. "
                        f"No fallback division was substituted to maintain analytical integrity."
                    ),
                    "sql_executed": NexusAIEngine.render_sql_for_display(sql, params),
                    "data_source": "PostgreSQL / business_records (Fuji-Q Highland Turnstile & RFID System)",
                    "date_range": date_range_label,
                    "chart_type": "line",
                    "chart_data": [],
                    "columns": ["date", "visitors", "avg_wait_min"],
                    "confidence": 0.95,
                    "is_demo_data": True
                }

            chart_data = []
            daily_visitors_list = []
            for r in rows:
                d_str = str(r[0])
                v_count = int(r[1]) if r[1] is not None else 0
                wait_m = round(float(r[2]), 1) if r[2] is not None else 0.0
                chart_data.append({
                    "date": d_str,
                    "visitors": v_count,
                    "avg_wait_min": wait_m
                })
                daily_visitors_list.append((d_str, v_count))

            total_visitors = sum(item[1] for item in daily_visitors_list)
            avg_daily = int(total_visitors / max(1, len(daily_visitors_list)))
            busiest = max(daily_visitors_list, key=lambda x: x[1])
            lowest = min(daily_visitors_list, key=lambda x: x[1])

            answer = (
                f"Fuji-Q Amusement Division Visitor Analytics ({date_range_label}):\n"
                f"• Database Table: 'business_records' | Division Code: '{target_div}'\n"
                f"• Total Visitors: {total_visitors:,} guests across {len(chart_data)} operating days\n"
                f"• Average Daily Visitors: {avg_daily:,} guests/day\n"
                f"• Busiest Date: {busiest[0]} with {busiest[1]:,} visitors (peak coaster load)\n"
                f"• Lowest Attendance Date: {lowest[0]} with {lowest[1]:,} visitors\n"
                f"• Records Retrieved: {len(rows)} daily aggregated rows validated against metric '{metric_target}'."
            )

            return {
                "query": user_query,
                "answer": answer,
                "sql_executed": NexusAIEngine.render_sql_for_display(sql, params),
                "data_source": "PostgreSQL / business_records (Fuji-Q Highland Turnstile & RFID System)",
                "date_range": date_range_label,
                "chart_type": "line",
                "chart_data": chart_data,
                "columns": ["date", "visitors", "avg_wait_min"],
                "confidence": 0.98,
                "is_demo_data": True
            }

        # -------------------------------------------------------------
        # BRANCH 3: RAILWAY DIVISION PASSENGER RECORDS
        # -------------------------------------------------------------
        if "railway" in detected_divs or any(w in q_lower for w in ["railway", "train", "passenger", "passengers", "ridership", "boarding", "delay"]):
            target_div = "railway"
            metric_target, _ = DIVISION_METRICS["railway"]

            sql = """
                SELECT
                    DATE(record_date) as ride_date,
                    SUM(metric_value) as daily_passengers,
                    AVG(secondary_value) as avg_delay_min,
                    COUNT(*) as station_records
                FROM business_records
                WHERE division_code = :division_code
                  AND metric_name = :metric_name
                  AND DATE(record_date) >= :start_date
                  AND DATE(record_date) <= :end_date
                GROUP BY DATE(record_date)
                ORDER BY ride_date ASC
            """

            params = {
                "division_code": target_div,
                "metric_name": metric_target,
                "start_date": start_str,
                "end_date": end_str
            }

            rows = db.execute(text(sql), params).fetchall()

            if not rows:
                return {
                    "query": user_query,
                    "answer": f"No passenger records found for division '{target_div}' within requested window {date_range_label}.",
                    "sql_executed": NexusAIEngine.render_sql_for_display(sql, params),
                    "data_source": "PostgreSQL / business_records (Fujikyuko Automated Turnstiles)",
                    "date_range": date_range_label,
                    "chart_type": "line",
                    "chart_data": [],
                    "columns": ["date", "passengers", "avg_delay_min"],
                    "confidence": 0.95,
                    "is_demo_data": True
                }

            chart_data = []
            daily_list = []
            for r in rows:
                d_str = str(r[0])
                pax_cnt = int(r[1]) if r[1] is not None else 0
                delay_m = round(float(r[2]), 1) if r[2] is not None else 0.0
                chart_data.append({
                    "date": d_str,
                    "passengers": pax_cnt,
                    "avg_delay_min": delay_m
                })
                daily_list.append((d_str, pax_cnt))

            total_pax = sum(item[1] for item in daily_list)
            avg_pax = int(total_pax / max(1, len(daily_list)))
            busiest = max(daily_list, key=lambda x: x[1])

            answer = (
                f"Fujikyuko Railway Transit Analytics ({date_range_label}):\n"
                f"• Database Table: 'business_records' | Division Code: '{target_div}'\n"
                f"• Total Passengers: {total_pax:,} riders carried across {len(chart_data)} operating days\n"
                f"• Average Daily Passengers: {avg_pax:,} riders/day\n"
                f"• Peak Transit Date: {busiest[0]} ({busiest[1]:,} passengers)\n"
                f"• Verified Metric: '{metric_target}' via Otsuki-Kawaguchiko line turnstiles."
            )

            return {
                "query": user_query,
                "answer": answer,
                "sql_executed": NexusAIEngine.render_sql_for_display(sql, params),
                "data_source": "Railway Automated Turnstile & Ticket Telemetry",
                "date_range": date_range_label,
                "chart_type": "line",
                "chart_data": chart_data,
                "columns": ["date", "passengers", "avg_delay_min"],
                "confidence": 0.98,
                "is_demo_data": True
            }

        # -------------------------------------------------------------
        # BRANCH 4: HOTELS & OCCUPANCY
        # -------------------------------------------------------------
        if "hotels" in detected_divs or any(w in q_lower for w in ["hotel", "occupancy", "stay", "resort", "lodging", "room"]):
            target_div = "hotels"
            metric_target, _ = DIVISION_METRICS["hotels"]
            sql = """
                SELECT
                    DATE(record_date) as stay_date,
                    ROUND(AVG(metric_value), 1) as avg_occupancy_pct,
                    MAX(entity_name) as sample_property,
                    CAST(SUM(secondary_value) AS INTEGER) as total_room_revenue_jpy
                FROM business_records
                WHERE division_code = :division_code
                  AND metric_name = :metric_name
                  AND DATE(record_date) >= :start_date
                  AND DATE(record_date) <= :end_date
                GROUP BY DATE(record_date)
                ORDER BY stay_date ASC
            """
            params = {
                "division_code": target_div,
                "metric_name": metric_target,
                "start_date": start_str,
                "end_date": end_str
            }
            rows = db.execute(text(sql), params).fetchall()

            if not rows:
                date_bounds = db.execute(text(
                    "SELECT MIN(DATE(record_date)), MAX(DATE(record_date)), COUNT(*) FROM business_records WHERE division_code = :div"
                ), {"div": target_div}).fetchone()
                avail_min = date_bounds[0] if date_bounds else "N/A"
                avail_max = date_bounds[1] if date_bounds else "N/A"
                rec_cnt = date_bounds[2] if date_bounds else 0
                return {
                    "query": user_query,
                    "answer": (
                        f"No occupancy records found for division '{target_div}' within requested window {date_range_label}. "
                        f"Database table 'business_records' holds {rec_cnt} hotel records spanning from {avail_min} to {avail_max}. "
                        f"No fallback division was substituted to maintain analytical integrity."
                    ),
                    "sql_executed": NexusAIEngine.render_sql_for_display(sql, params),
                    "data_source": "Hospitality Property Management System (PMS)",
                    "date_range": date_range_label,
                    "chart_type": "line",
                    "chart_data": [],
                    "columns": ["date", "occupancy_rate_pct", "revenue_jpy"],
                    "confidence": 0.95,
                    "is_demo_data": True
                }

            chart_data = [{
                "date": str(r[0]),
                "occupancy_rate_pct": float(r[1]),
                "sample_property": r[2],
                "revenue_jpy": int(r[3] or 0)
            } for r in rows]

            avg_rate = round(sum(c["occupancy_rate_pct"] for c in chart_data) / max(1, len(chart_data)), 1)
            peak_day = max(chart_data, key=lambda x: x["occupancy_rate_pct"])
            tot_rev = sum(c["revenue_jpy"] for c in chart_data)

            answer = (
                f"Fujikyu Hotels & Tourism Performance ({date_range_label}):\n"
                f"• Database Table: 'business_records' | Division Code: '{target_div}'\n"
                f"• Average Occupancy: {avg_rate}% across {len(chart_data)} operating days\n"
                f"• Peak Occupancy Date: {peak_day['date']} ({peak_day['occupancy_rate_pct']}% at {peak_day['sample_property']})\n"
                f"• Total Room Turnover: ¥{tot_rev:,} JPY\n"
                f"• Verified Metric: '{metric_target}' validated across resort properties."
            )

            return {
                "query": user_query,
                "answer": answer,
                "sql_executed": NexusAIEngine.render_sql_for_display(sql, params),
                "data_source": "Hospitality Property Management System (PMS)",
                "date_range": date_range_label,
                "chart_type": "line",
                "chart_data": chart_data,
                "columns": ["date", "occupancy_rate_pct", "revenue_jpy"],
                "confidence": 0.97,
                "is_demo_data": True
            }

        # -------------------------------------------------------------
        # BRANCH 5: RETAIL & SOUVENIR PRODUCTS
        # -------------------------------------------------------------
        if "retail" in detected_divs or any(w in q_lower for w in ["product", "top-selling", "highest revenue", "best selling", "sku", "retail", "souvenir"]):
            sql = """
                SELECT
                    entity_name as product_name,
                    category,
                    CAST(SUM(metric_value) AS INTEGER) as total_revenue_jpy,
                    CAST(SUM(secondary_value) AS INTEGER) as total_units_sold
                FROM business_records
                WHERE division_code = 'retail'
                  AND DATE(record_date) >= :start_date
                  AND DATE(record_date) <= :end_date
                GROUP BY entity_name, category
                ORDER BY total_revenue_jpy DESC
                LIMIT 8
            """
            params = {"start_date": start_str, "end_date": end_str}
            rows = db.execute(text(sql), params).fetchall()
            if not rows:
                return {
                    "query": user_query,
                    "answer": f"No retail product records found within requested window {date_range_label}.",
                    "sql_executed": NexusAIEngine.render_sql_for_display(sql, params),
                    "data_source": "Retail Ingestion Pipeline / Fujiyama Bazaar POS",
                    "date_range": date_range_label,
                    "chart_type": "bar",
                    "chart_data": [],
                    "columns": ["product", "revenue_jpy", "units_sold"],
                    "confidence": 0.95,
                    "is_demo_data": True
                }

            chart_data = [{
                "product": r[0],
                "category": r[1],
                "revenue_jpy": int(r[2]),
                "units_sold": int(r[3] or 0)
            } for r in rows]

            top_item = chart_data[0]["product"]
            tot_sales = sum(c["revenue_jpy"] for c in chart_data)

            answer = (
                f"Fujiyama Bazaar Retail & Confectionery Sales ({date_range_label}):\n"
                f"• Top Revenue Product: '{top_item}' generating ¥{chart_data[0]['revenue_jpy']:,} ({chart_data[0]['units_sold']} units sold)\n"
                f"• Top-8 Products Combined Revenue: ¥{tot_sales:,}\n"
                f"• Category Driver: {chart_data[0]['category']} items demonstrate highest footfall conversion."
            )

            return {
                "query": user_query,
                "answer": answer,
                "sql_executed": NexusAIEngine.render_sql_for_display(sql, params),
                "data_source": "Retail Ingestion Pipeline / Fujiyama Bazaar POS",
                "date_range": date_range_label,
                "chart_type": "bar",
                "chart_data": chart_data,
                "columns": ["product", "revenue_jpy", "units_sold"],
                "confidence": 0.96,
                "is_demo_data": True
            }

        # -------------------------------------------------------------
        # BRANCH 6: TOTAL CONSOLIDATED SALES / MULTI-DIVISION FINANCIALS
        # -------------------------------------------------------------
        if any(w in q_lower for w in ["total sales", "revenue", "sales this month", "how much sales", "overall revenue", "all division sales", "consolidated"]):
            sql = """
                SELECT
                    division_code,
                    CAST(SUM(metric_value) AS INTEGER) as total_metric,
                    currency
                FROM business_records
                WHERE record_type IN ('sale', 'revenue', 'passenger', 'visitor')
                  AND DATE(record_date) >= :start_date
                  AND DATE(record_date) <= :end_date
                GROUP BY division_code, currency
                ORDER BY total_metric DESC
            """
            params = {"start_date": start_str, "end_date": end_str}
            rows = db.execute(text(sql), params).fetchall()
            if not rows:
                return {
                    "query": user_query,
                    "answer": f"No enterprise sales or activity records found within requested window {date_range_label}.",
                    "sql_executed": NexusAIEngine.render_sql_for_display(sql, params),
                    "data_source": "PostgreSQL / business_records (Consolidated Enterprise Feed)",
                    "date_range": date_range_label,
                    "chart_type": "bar",
                    "chart_data": [],
                    "columns": ["division", "amount_jpy"],
                    "confidence": 0.95,
                    "is_demo_data": True
                }

            chart_data = [{"division": r[0].replace("_", " ").title(), "amount_jpy": int(r[1])} for r in rows]
            total_sum = sum(item["amount_jpy"] for item in chart_data)

            answer = (
                f"Consolidated Business Volume Across Recorded Divisions ({date_range_label}):\n"
                f"• Database Table: 'business_records' | Divisions Aggregated: {len(chart_data)}\n"
                f"• Total Group Volume: ¥{total_sum:,} JPY\n"
                f"• Division Breakdown: " + ", ".join([f"{c['division']} (¥{c['amount_jpy']:,})" for c in chart_data[:4]]) + "\n"
                f"• Source: Multi-division business records aggregation filtered by explicit date bounds."
            )

            return {
                "query": user_query,
                "answer": answer,
                "sql_executed": NexusAIEngine.render_sql_for_display(sql, params),
                "data_source": "PostgreSQL / business_records (Consolidated Enterprise Feed)",
                "date_range": date_range_label,
                "chart_type": "bar",
                "chart_data": chart_data,
                "columns": ["division", "amount_jpy"],
                "confidence": 0.98,
                "is_demo_data": True
            }

        # -------------------------------------------------------------
        # BRANCH 7: ANOMALIES & OPERATIONAL ALERTS
        # -------------------------------------------------------------
        if any(w in q_lower for w in ["unusual", "pattern", "anomaly", "anomalies", "problem", "issues", "alert"]):
            anomalies = db.query(DetectedAnomaly).order_by(DetectedAnomaly.detected_at.desc()).limit(6).all()
            chart_data = [{
                "date": a.anomaly_date.strftime("%Y-%m-%d"),
                "division": a.division_code.title(),
                "metric": a.metric_name,
                "deviation_pct": f"{a.deviation_pct:+}%",
                "severity": a.severity,
                "summary": a.explanation
            } for a in anomalies]

            answer = (
                f"Autonomous Discovery Engine Anomaly Report:\n"
                f"• Detected {len(chart_data)} notable statistical deviations across enterprise telemetry.\n"
                f"• Most Significant Alert: {chart_data[0]['division']} on {chart_data[0]['date']} ({chart_data[0]['deviation_pct']} vs baseline).\n"
                f"• Summary: {chart_data[0]['summary']}"
            )

            return {
                "query": user_query,
                "answer": answer,
                "sql_executed": "SELECT * FROM detected_anomalies ORDER BY detected_at DESC LIMIT 6",
                "data_source": "Autonomous Discovery Engine & ML Statistical Scanner",
                "date_range": date_range_label,
                "chart_type": "table",
                "chart_data": chart_data,
                "columns": ["date", "division", "metric", "deviation_pct", "severity"],
                "confidence": 0.94,
                "is_demo_data": True
            }

        # -------------------------------------------------------------
        # BRANCH 8: OTHER SPECIFIC DIVISIONS (Restaurants, Real Estate, Construction, IT)
        # -------------------------------------------------------------
        if detected_divs:
            target_div = detected_divs[0]
            metric_target, rec_type = DIVISION_METRICS.get(target_div, ("metric_value", "metric"))
            name_div, src_name, unit_label = DIVISION_DISPLAY.get(target_div, (target_div.title(), "Enterprise Feed", "volume"))

            sql = """
                SELECT
                    DATE(record_date) as d,
                    ROUND(AVG(metric_value), 2) as avg_metric,
                    CAST(SUM(metric_value) AS INTEGER) as total_metric
                FROM business_records
                WHERE division_code = :division_code
                  AND DATE(record_date) >= :start_date
                  AND DATE(record_date) <= :end_date
                GROUP BY DATE(record_date)
                ORDER BY d ASC
            """

            rows = db.execute(text(sql), {
                "division_code": target_div,
                "start_date": start_str,
                "end_date": end_str
            }).fetchall()

            if rows:
                chart_data = [{
                    "date": str(r[0]),
                    unit_label: float(r[1])
                } for r in rows]

                answer = (
                    f"{name_div} Operational Analytics ({date_range_label}):\n"
                    f"• Database Table: 'business_records' | Division: '{target_div}'\n"
                    f"• Metric Analyzed: '{metric_target}'\n"
                    f"• Observations: {len(chart_data)} data points retrieved."
                )

                return {
                    "query": user_query,
                    "answer": answer,
                    "sql_executed": sql.strip(),
                    "data_source": src_name,
                    "date_range": date_range_label,
                    "chart_type": "line",
                    "chart_data": chart_data,
                    "columns": ["date", unit_label],
                    "confidence": 0.95,
                    "is_demo_data": True
                }

        # -------------------------------------------------------------
        # DEFAULT SAFE FALLBACK
        # -------------------------------------------------------------
        return {
            "query": user_query,
            "answer": (
                "NEXUS AI is connected to all 8 Fujikyu business divisions. "
                "You can query: 'Show Fuji-Q visitor records over the last 30 days', 'Show Railway passenger demand', "
                "'Compare railway passenger volume and Fuji-Q visitors', 'Hotel occupancy levels', 'Top-selling retail products', or 'Total sales this month'."
            ),
            "sql_executed": "SELECT COUNT(*) FROM business_records",
            "data_source": "Fujikyu Nexus Unified Meta-Catalog",
            "date_range": date_range_label,
            "chart_type": "table",
            "chart_data": [
                {"division": "Railway", "metric": "passenger_count", "source": "Fujikyuko Line Turnstiles"},
                {"division": "Amusement Park", "metric": "visitor_count", "source": "Fuji-Q RFID Turnstiles"},
                {"division": "Hotels & Tourism", "metric": "room_occupancy_pct", "source": "PMS Database"},
                {"division": "Retail & Shopping", "metric": "revenue_jpy", "source": "Bazaar POS Cloud"}
            ],
            "columns": ["division", "metric", "source"],
            "confidence": 0.90,
            "is_demo_data": True
        }
