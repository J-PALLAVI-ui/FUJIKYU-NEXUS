import re
import datetime
from typing import Dict, Any, List, Tuple
import pandas as pd
import numpy as np

APPROVED_SCHEMAS = {
    "railway": {
        "required_fields": ["record_date", "route_or_station", "passenger_count", "ticket_revenue_jpy"],
        "field_aliases": {
            "record_date": ["date", "timestamp", "datetime", "ride_date", "day"],
            "route_or_station": ["station", "route", "station_name", "line", "station_id", "stop"],
            "passenger_count": ["passengers", "passenger_count", "riders", "boarding", "count", "volume"],
            "ticket_revenue_jpy": ["revenue", "sales", "fare_yen", "ticket_sales", "income_jpy", "fare_amount"],
            "delay_minutes": ["delay", "delay_min", "lateness", "delay_minutes", "lost_time"]
        }
    },
    "amusement": {
        "required_fields": ["record_date", "attraction_or_park", "visitor_count", "revenue_jpy"],
        "field_aliases": {
            "record_date": ["date", "timestamp", "visit_date", "day"],
            "attraction_or_park": ["attraction", "ride_name", "ride", "facility", "attraction_name", "park_zone"],
            "visitor_count": ["visitors", "attendance", "guest_count", "riders", "entry_count"],
            "revenue_jpy": ["revenue", "ticket_revenue", "gate_sales", "income", "jpy_total"],
            "wait_time_minutes": ["wait_time", "queue_time", "wait_min", "avg_wait", "queue_minutes"],
            "downtime_minutes": ["downtime", "maintenance_time", "down_min", "outage_minutes"]
        }
    },
    "hotels": {
        "required_fields": ["record_date", "property_name", "room_occupancy_pct", "revenue_jpy"],
        "field_aliases": {
            "record_date": ["date", "stay_date", "night_of", "day"],
            "property_name": ["hotel", "hotel_name", "property", "facility", "resort_name"],
            "room_occupancy_pct": ["occupancy", "occ_rate", "occupancy_pct", "room_occupancy", "booked_rate"],
            "revenue_jpy": ["revenue", "room_revenue", "revpar", "total_revenue", "sales_jpy"],
            "adr_jpy": ["adr", "avg_daily_rate", "rate_per_room", "room_price"],
            "cancellations": ["cancellations", "canceled_rooms", "cancel_count"]
        }
    },
    "retail": {
        "required_fields": ["record_date", "product_name", "sales_quantity", "revenue_jpy"],
        "field_aliases": {
            "record_date": ["date", "transaction_date", "sale_date", "day"],
            "product_name": ["product", "item_name", "sku_name", "merchandise", "item"],
            "sales_quantity": ["quantity", "qty", "units_sold", "volume", "sales_count"],
            "revenue_jpy": ["revenue", "sales_amount", "total_yen", "sales", "total_price_jpy"],
            "category": ["category", "dept", "product_type", "genre"],
            "inventory_level": ["stock", "inventory", "stock_qty", "on_hand"]
        }
    },
    "restaurants": {
        "required_fields": ["record_date", "restaurant_name", "order_count", "sales_jpy"],
        "field_aliases": {
            "record_date": ["date", "order_date", "business_date", "day"],
            "restaurant_name": ["restaurant", "outlet", "shop_name", "venue", "dining_spot"],
            "order_count": ["orders", "covers", "guest_count", "customer_count", "bills"],
            "sales_jpy": ["sales", "revenue", "daily_sales", "total_sales_jpy", "turnover"],
            "menu_category": ["category", "dish_type", "cuisine", "section"]
        }
    },
    "real_estate": {
        "required_fields": ["record_date", "property_name", "occupancy_rate", "rental_income_jpy"],
        "field_aliases": {
            "record_date": ["date", "month", "billing_date", "period"],
            "property_name": ["property", "building", "facility", "asset_name", "complex"],
            "occupancy_rate": ["occupancy", "leased_pct", "occupancy_rate", "tenant_rate"],
            "rental_income_jpy": ["rent_income", "rental_revenue", "lease_income", "revenue_jpy"],
            "maintenance_cost_jpy": ["maintenance_cost", "expenses", "repairs", "opex_jpy"]
        }
    },
    "construction": {
        "required_fields": ["record_date", "project_name", "progress_pct", "actual_cost_jpy"],
        "field_aliases": {
            "record_date": ["date", "reporting_date", "status_date", "month"],
            "project_name": ["project", "site", "work_order", "job_name", "site_name"],
            "progress_pct": ["progress", "completion_rate", "pct_complete", "progress_pct"],
            "budget_jpy": ["budget", "allocated_budget", "planned_cost_jpy"],
            "actual_cost_jpy": ["actual_cost", "spend", "expenses_jpy", "incurred_cost"],
            "delay_days": ["delay_days", "schedule_variance", "days_behind"]
        }
    },
    "it_services": {
        "required_fields": ["record_date", "system_name", "uptime_pct", "incident_count"],
        "field_aliases": {
            "record_date": ["date", "timestamp", "log_date", "day"],
            "system_name": ["service", "system", "app_name", "platform", "component"],
            "uptime_pct": ["uptime", "availability", "sla_pct", "uptime_percentage"],
            "incident_count": ["incidents", "alerts", "errors", "tickets", "issues"],
            "latency_ms": ["latency", "response_time_ms", "avg_latency", "ping_ms"],
            "api_requests": ["requests", "api_calls", "traffic_volume", "hits"]
        }
    }
}

DIVISION_KEYWORDS = {
    "railway": ["passenger", "station", "train", "route", "ticket", "delay", "fare", "fujikyu", "line", "boarding", "conductor"],
    "amusement": ["attraction", "coaster", "visitor", "wait_time", "downtime", "fuji_q", "highland", "ride", "guest", "theme_park"],
    "hotels": ["room", "hotel", "occupancy", "adr", "revpar", "stay", "guest", "resort", "booking", "checkin", "checkout"],
    "retail": ["sku", "product", "sales_quantity", "stock", "souvenir", "bazaar", "merchandise", "inventory", "store"],
    "restaurants": ["menu", "order", "dining", "hoto", "dish", "food", "chef", "table", "covers", "meal"],
    "real_estate": ["tenant", "property", "lease", "rent", "sqm", "building", "commercial", "space", "occupancy_rate"],
    "construction": ["project", "civil", "track", "progress", "budget", "contractor", "engineering", "maintenance_work"],
    "it_services": ["uptime", "incident", "latency", "system", "api", "ticket_engine", "server", "iot", "cloud"]
}

class SelfAdaptiveCleaner:
    @staticmethod
    def infer_division(columns: List[str], sample_text: str = "") -> Tuple[str, float]:
        col_str = " ".join([c.lower().replace("_", " ") for c in columns]) + " " + sample_text.lower()
        scores = {}
        for div, kws in DIVISION_KEYWORDS.items():
            matched = sum(1 for kw in kws if kw in col_str)
            scores[div] = matched

        best_div = max(scores, key=scores.get)
        total_matches = sum(scores.values())
        confidence = (scores[best_div] / max(total_matches, 1)) if total_matches > 0 else 0.5
        if scores[best_div] == 0:
            best_div = "railway" # safe fallback
            confidence = 0.4
        return best_div, min(1.0, max(0.4, confidence))

    @staticmethod
    def profile_dataframe(df: pd.DataFrame) -> Dict[str, Any]:
        columns_profile = []
        detected_types = {}
        date_cols = []
        numeric_cols = []
        cat_cols = []

        for col in df.columns:
            series = df[col]
            non_null_count = int(series.count())
            null_count = int(series.isna().sum())
            unique_count = int(series.nunique())
            sample_vals = series.dropna().astype(str).head(3).tolist()

            # Check if date
            is_date = False
            col_lower = str(col).lower()
            if any(k in col_lower for k in ["date", "time", "day", "month", "year"]):
                try:
                    pd.to_datetime(series.dropna().head(10))
                    is_date = True
                except Exception:
                    pass

            # Type detection
            if is_date:
                col_type = "datetime"
                date_cols.append(col)
            elif pd.api.types.is_numeric_dtype(series):
                col_type = "numeric"
                numeric_cols.append(col)
            else:
                col_type = "categorical"
                cat_cols.append(col)

            detected_types[col] = col_type
            columns_profile.append({
                "name": col,
                "type": col_type,
                "non_null_count": non_null_count,
                "null_count": null_count,
                "unique_count": unique_count,
                "sample_values": sample_vals
            })

        return {
            "columns": columns_profile,
            "detected_types": detected_types,
            "date_columns": date_cols,
            "numeric_columns": numeric_cols,
            "categorical_columns": cat_cols,
            "total_rows": len(df),
            "total_cols": len(df.columns)
        }

    @staticmethod
    def auto_map_columns(df: pd.DataFrame, division_code: str) -> Dict[str, str]:
        schema = APPROVED_SCHEMAS.get(division_code, APPROVED_SCHEMAS["railway"])
        mappings = {}
        df_cols_lower = {str(c).lower().replace(" ", "_"): c for c in df.columns}

        for canonical_field, aliases in schema["field_aliases"].items():
            for alias in aliases:
                matched_col = None
                for lower_name, actual_col in df_cols_lower.items():
                    if alias == lower_name or alias in lower_name:
                        matched_col = actual_col
                        break
                if matched_col and matched_col not in mappings.values():
                    mappings[canonical_field] = matched_col
                    break

        return mappings

    @staticmethod
    def clean_and_validate(df: pd.DataFrame, division_code: str, custom_mappings: Dict[str, str] = None) -> Dict[str, Any]:
        total_incoming = len(df)
        raw_df = df.copy()

        # 1. Detect duplicates
        duplicate_mask = raw_df.duplicated()
        duplicate_count = int(duplicate_mask.sum())
        df_dedup = raw_df.drop_duplicates().copy()

        # 2. Apply column mapping
        mappings = custom_mappings if custom_mappings else SelfAdaptiveCleaner.auto_map_columns(df_dedup, division_code)
        reverse_map = {v: k for k, v in mappings.items()}

        # 3. Check missing values
        missing_count = int(df_dedup.isna().sum().sum())

        # 4. Perform quality checks & separate rejected records
        rejected_records = []
        valid_rows = []
        checks_detail = []

        # Find date column
        date_col = mappings.get("record_date")
        if not date_col:
            # Fallback to any date column detected
            for c in df_dedup.columns:
                if any(k in str(c).lower() for k in ["date", "time", "day"]):
                    date_col = c
                    break

        checks_detail.append({
            "check": "Date Column Identification",
            "status": "PASSED" if date_col else "WARNING",
            "message": f"Mapped date column: {date_col}" if date_col else "No explicit date column mapped; using current timestamp."
        })

        # Process each row with robust validation rules
        for idx, row in df_dedup.iterrows():
            row_dict = row.to_dict()
            reasons = []

            # Check date validity
            row_date = None
            if date_col and pd.notna(row[date_col]):
                try:
                    row_date = pd.to_datetime(row[date_col])
                    # Reject dates in future > 30 days
                    if row_date > datetime.datetime.now() + datetime.timedelta(days=30):
                        reasons.append("Date is unreasonably far in the future.")
                except Exception:
                    reasons.append("Invalid date format.")
            elif date_col and pd.isna(row[date_col]):
                reasons.append("Missing required date field.")
            else:
                row_date = datetime.datetime.utcnow()

            # Check numeric constraints
            for col_name, val in row_dict.items():
                if pd.api.types.is_numeric_dtype(type(val)) or isinstance(val, (int, float)):
                    if pd.notna(val):
                        # Revenue, passenger, visitor should never be negative
                        if any(k in str(col_name).lower() for k in ["revenue", "sales", "passenger", "visitor", "price", "count", "income", "occupancy"]):
                            if float(val) < 0:
                                reasons.append(f"Negative value ({val}) in non-negative metric column '{col_name}'.")
                        # Occupancy pct should not exceed 100
                        if "occupancy" in str(col_name).lower() and float(val) > 100.0:
                            reasons.append(f"Occupancy rate ({val}%) exceeds 100%.")

            if reasons:
                rejected_records.append({
                    "row_index": int(idx),
                    "data": {str(k): (None if pd.isna(v) else str(v)) for k, v in row_dict.items()},
                    "rejection_reasons": reasons
                })
            else:
                # Clean row and add standardized attributes
                cleaned_row = {}
                for col_name, val in row_dict.items():
                    if pd.isna(val):
                        cleaned_row[col_name] = 0.0 if pd.api.types.is_numeric_dtype(df_dedup[col_name]) else "Unspecified"
                    else:
                        cleaned_row[col_name] = val
                cleaned_row["_standard_date"] = row_date if row_date else datetime.datetime.utcnow()
                valid_rows.append(cleaned_row)

        valid_count = len(valid_rows)
        invalid_count = len(rejected_records)

        # Quality Score Calculation (0 to 100)
        # Deduct for duplicates, missing values, and rejected invalid records
        dup_penalty = min(20.0, (duplicate_count / max(total_incoming, 1)) * 30.0)
        invalid_penalty = min(40.0, (invalid_count / max(total_incoming, 1)) * 50.0)
        missing_penalty = min(20.0, (missing_count / max(total_incoming * len(df.columns), 1)) * 30.0)
        quality_score = max(5.0, round(100.0 - (dup_penalty + invalid_penalty + missing_penalty), 1))

        checks_detail.append({
            "check": "Completeness & Missing Value Ratio",
            "status": "PASSED" if missing_penalty < 5.0 else "WARNING",
            "message": f"{missing_count} missing cells identified across {len(df.columns)} columns."
        })
        checks_detail.append({
            "check": "Duplicate Record Filtering",
            "status": "PASSED" if duplicate_count == 0 else "WARNING",
            "message": f"{duplicate_count} duplicate rows filtered out."
        })
        checks_detail.append({
            "check": "Range & Domain Integrity",
            "status": "PASSED" if invalid_count == 0 else "WARNING",
            "message": f"{invalid_count} records rejected due to business constraint violations."
        })

        return {
            "total_incoming": total_incoming,
            "valid_count": valid_count,
            "invalid_count": invalid_count,
            "duplicate_count": duplicate_count,
            "missing_values_count": missing_count,
            "quality_score": quality_score,
            "mappings": mappings,
            "valid_rows": valid_rows,
            "rejected_records": rejected_records[:50], # first 50 rejected for inspection
            "checks_detail": checks_detail
        }
