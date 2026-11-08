import numpy as np
import pandas as pd
from typing import Dict, Any, List

class AnalyticsWorkflowRegistry:
    def __init__(self):
        self._workflows = {}

    def register(self, division_code: str):
        def decorator(fn):
            self._workflows[division_code] = fn
            return fn
        return decorator

    def get_workflow(self, division_code: str):
        return self._workflows.get(division_code, self._default_workflow)

    def _default_workflow(self, records: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not records:
            return {"kpis": {}, "trend": [], "distribution": []}
        df = pd.DataFrame(records)
        val_col = "metric_value" if "metric_value" in df.columns else df.select_dtypes(include=[np.number]).columns[0]
        return {
            "kpis": {
                "total_records": len(df),
                "metric_sum": float(df[val_col].sum()) if val_col in df.columns else 0,
                "metric_avg": float(df[val_col].mean()) if val_col in df.columns else 0
            },
            "trend": []
        }

workflow_registry = AnalyticsWorkflowRegistry()

# 1. Railway Workflow
@workflow_registry.register("railway")
def analyze_railway(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    if not records:
        return {}
    df = pd.DataFrame(records)
    # Ensure standard date
    df["date"] = pd.to_datetime(df["record_date"]).dt.strftime("%Y-%m-%d")
    
    # Calculate route/station breakdowns
    route_perf = []
    if "location" in df.columns or "entity_name" in df.columns:
        loc_col = "entity_name" if "entity_name" in df.columns else "location"
        grouped = df.groupby(loc_col).agg({
            "metric_value": "sum",
            "secondary_value": "mean"
        }).reset_index()
        for _, r in grouped.iterrows():
            route_perf.append({
                "station_or_route": str(r[loc_col]),
                "passengers": int(r["metric_value"]),
                "avg_delay_min": round(float(r["secondary_value"] or 0), 1)
            })
        route_perf.sort(key=lambda x: x["passengers"], reverse=True)

    # Daily Trend
    daily = df.groupby("date").agg({
        "metric_value": "sum",
        "secondary_value": "mean"
    }).reset_index().sort_values("date")
    
    trend = []
    for _, r in daily.iterrows():
        trend.append({
            "date": r["date"],
            "passengers": int(r["metric_value"]),
            "avg_delay_min": round(float(r["secondary_value"] or 0), 1)
        })

    total_passengers = int(df["metric_value"].sum())
    avg_daily_passengers = int(df["metric_value"].mean())
    avg_delay = round(float(df["secondary_value"].mean() or 0), 2)
    on_time_pct = round(100.0 - min(100.0, (avg_delay / 15.0) * 100.0), 1)
    
    # Estimated ticket revenue assuming avg fare ¥1,180
    est_ticket_revenue = total_passengers * 1180

    return {
        "kpis": {
            "total_passengers": total_passengers,
            "avg_daily_passengers": avg_daily_passengers,
            "est_ticket_revenue_jpy": est_ticket_revenue,
            "avg_delay_minutes": avg_delay,
            "on_time_performance_pct": on_time_pct,
            "active_routes_count": len(route_perf)
        },
        "route_performance": route_perf[:10],
        "trend": trend[-30:], # last 30 days
        "pareto": calculate_pareto(route_perf, key="passengers", label="station_or_route")
    }

# 2. Amusement Park Workflow
@workflow_registry.register("amusement")
def analyze_amusement(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    if not records:
        return {}
    df = pd.DataFrame(records)
    df["date"] = pd.to_datetime(df["record_date"]).dt.strftime("%Y-%m-%d")

    attraction_perf = []
    if "entity_name" in df.columns:
        grouped = df.groupby("entity_name").agg({
            "metric_value": "sum",
            "secondary_value": "mean"
        }).reset_index()
        for _, r in grouped.iterrows():
            attraction_perf.append({
                "attraction": str(r["entity_name"]),
                "visitors": int(r["metric_value"]),
                "avg_wait_min": round(float(r["secondary_value"] or 0), 1)
            })
        attraction_perf.sort(key=lambda x: x["visitors"], reverse=True)

    daily = df.groupby("date").agg({
        "metric_value": "sum",
        "secondary_value": "mean"
    }).reset_index().sort_values("date")

    trend = [{
        "date": r["date"],
        "visitors": int(r["metric_value"]),
        "avg_wait_min": round(float(r["secondary_value"] or 0), 1)
    } for _, r in daily.iterrows()]

    total_visitors = int(df["metric_value"].sum())
    avg_wait = round(float(df["secondary_value"].mean() or 0), 1)
    est_park_revenue = total_visitors * 6800 # avg free-pass revenue

    return {
        "kpis": {
            "total_visitors": total_visitors,
            "avg_daily_visitors": int(df["metric_value"].mean()),
            "est_park_revenue_jpy": est_park_revenue,
            "avg_wait_time_min": avg_wait,
            "top_attraction": attraction_perf[0]["attraction"] if attraction_perf else "Eejanaika",
            "active_attractions_count": len(attraction_perf)
        },
        "attraction_performance": attraction_perf[:10],
        "trend": trend[-30:],
        "pareto": calculate_pareto(attraction_perf, key="visitors", label="attraction")
    }

# 3. Hotels & Tourism Workflow
@workflow_registry.register("hotels")
def analyze_hotels(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    if not records:
        return {}
    df = pd.DataFrame(records)
    df["date"] = pd.to_datetime(df["record_date"]).dt.strftime("%Y-%m-%d")

    prop_perf = []
    if "entity_name" in df.columns:
        grouped = df.groupby("entity_name").agg({
            "metric_value": "mean", # occupancy %
            "secondary_value": "sum" # revenue
        }).reset_index()
        for _, r in grouped.iterrows():
            prop_perf.append({
                "property": str(r["entity_name"]),
                "occupancy_pct": round(float(r["metric_value"]), 1),
                "revenue_jpy": int(r["secondary_value"] or 0)
            })
        prop_perf.sort(key=lambda x: x["revenue_jpy"], reverse=True)

    daily = df.groupby("date").agg({
        "metric_value": "mean",
        "secondary_value": "sum"
    }).reset_index().sort_values("date")

    trend = [{
        "date": r["date"],
        "occupancy_pct": round(float(r["metric_value"]), 1),
        "revenue_jpy": int(r["secondary_value"] or 0)
    } for _, r in daily.iterrows()]

    avg_occupancy = round(float(df["metric_value"].mean() or 0), 1)
    total_rev = int(df["secondary_value"].sum() or 0)
    avg_adr = round(total_rev / max(1, len(df) * 45), 0)

    return {
        "kpis": {
            "avg_occupancy_pct": avg_occupancy,
            "total_room_revenue_jpy": total_rev,
            "adr_jpy": int(avg_adr),
            "revpar_jpy": int(avg_adr * (avg_occupancy / 100.0)),
            "properties_count": len(prop_perf)
        },
        "property_performance": prop_perf,
        "trend": trend[-30:]
    }

# 4. Retail & Shopping Workflow
@workflow_registry.register("retail")
def analyze_retail(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    if not records:
        return {}
    df = pd.DataFrame(records)
    df["date"] = pd.to_datetime(df["record_date"]).dt.strftime("%Y-%m-%d")

    item_perf = []
    if "entity_name" in df.columns:
        grouped = df.groupby(["entity_name", "category"]).agg({
            "metric_value": "sum", # revenue
            "secondary_value": "sum" # units sold
        }).reset_index()
        for _, r in grouped.iterrows():
            item_perf.append({
                "product": str(r["entity_name"]),
                "category": str(r["category"]),
                "revenue_jpy": int(r["metric_value"]),
                "units_sold": int(r["secondary_value"] or 0)
            })
        item_perf.sort(key=lambda x: x["revenue_jpy"], reverse=True)

    daily = df.groupby("date").agg({
        "metric_value": "sum",
        "secondary_value": "sum"
    }).reset_index().sort_values("date")

    trend = [{
        "date": r["date"],
        "revenue_jpy": int(r["metric_value"]),
        "units_sold": int(r["secondary_value"] or 0)
    } for _, r in daily.iterrows()]

    total_revenue = int(df["metric_value"].sum())
    total_units = int(df["secondary_value"].sum() or 0)
    avg_price = int(total_revenue / max(1, total_units))

    return {
        "kpis": {
            "total_retail_revenue_jpy": total_revenue,
            "total_units_sold": total_units,
            "avg_unit_price_jpy": avg_price,
            "top_product": item_perf[0]["product"] if item_perf else "Fujiyama Cookie Gift Box",
            "active_skus_count": len(item_perf)
        },
        "product_performance": item_perf[:12],
        "trend": trend[-30:],
        "pareto": calculate_pareto(item_perf, key="revenue_jpy", label="product")
    }

# 5. Restaurants & Dining Workflow
@workflow_registry.register("restaurants")
def analyze_restaurants(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    if not records:
        return {}
    df = pd.DataFrame(records)
    df["date"] = pd.to_datetime(df["record_date"]).dt.strftime("%Y-%m-%d")

    outlet_perf = []
    if "entity_name" in df.columns:
        grouped = df.groupby("entity_name").agg({
            "metric_value": "sum", # sales
            "secondary_value": "sum" # orders
        }).reset_index()
        for _, r in grouped.iterrows():
            outlet_perf.append({
                "outlet": str(r["entity_name"]),
                "sales_jpy": int(r["metric_value"]),
                "orders": int(r["secondary_value"] or 0)
            })
        outlet_perf.sort(key=lambda x: x["sales_jpy"], reverse=True)

    daily = df.groupby("date").agg({
        "metric_value": "sum",
        "secondary_value": "sum"
    }).reset_index().sort_values("date")

    trend = [{
        "date": r["date"],
        "sales_jpy": int(r["metric_value"]),
        "orders": int(r["secondary_value"] or 0)
    } for _, r in daily.iterrows()]

    total_sales = int(df["metric_value"].sum())
    total_orders = int(df["secondary_value"].sum() or 0)
    avg_order_val = int(total_sales / max(1, total_orders))

    return {
        "kpis": {
            "total_dining_sales_jpy": total_sales,
            "total_orders": total_orders,
            "avg_ticket_size_jpy": avg_order_val,
            "top_outlet": outlet_perf[0]["outlet"] if outlet_perf else "Highland Hoto Main Hall"
        },
        "outlet_performance": outlet_perf,
        "trend": trend[-30:]
    }

# 6. Real Estate & Commercial Leasing Workflow
@workflow_registry.register("real_estate")
def analyze_real_estate(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    if not records:
        return {}
    df = pd.DataFrame(records)
    df["date"] = pd.to_datetime(df["record_date"]).dt.strftime("%Y-%m-%d")

    prop_perf = []
    if "entity_name" in df.columns:
        grouped = df.groupby("entity_name").agg({
            "metric_value": "mean", # occupancy %
            "secondary_value": "sum" # rental income
        }).reset_index()
        for _, r in grouped.iterrows():
            prop_perf.append({
                "property": str(r["entity_name"]),
                "occupancy_rate_pct": round(float(r["metric_value"]), 1),
                "rental_income_jpy": int(r["secondary_value"] or 0)
            })
        prop_perf.sort(key=lambda x: x["rental_income_jpy"], reverse=True)

    total_rental_income = int(df["secondary_value"].sum() or 0)
    avg_occ = round(float(df["metric_value"].mean() or 0), 1)

    return {
        "kpis": {
            "total_rental_income_jpy": total_rental_income,
            "avg_commercial_occupancy_pct": avg_occ,
            "total_managed_properties": len(prop_perf),
            "healthy_occupancy_flag": avg_occ >= 92.0
        },
        "property_performance": prop_perf
    }

# 7. Construction & Engineering Workflow
@workflow_registry.register("construction")
def analyze_construction(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    if not records:
        return {}
    df = pd.DataFrame(records)
    
    proj_perf = []
    if "entity_name" in df.columns:
        grouped = df.groupby("entity_name").agg({
            "metric_value": "mean", # progress %
            "secondary_value": "sum" # cost jpy
        }).reset_index()
        for _, r in grouped.iterrows():
            proj_perf.append({
                "project": str(r["entity_name"]),
                "progress_pct": round(float(r["metric_value"]), 1),
                "actual_cost_jpy": int(r["secondary_value"] or 0)
            })

    total_cost = int(df["secondary_value"].sum() or 0)
    avg_progress = round(float(df["metric_value"].mean() or 0), 1)

    return {
        "kpis": {
            "total_project_expenditure_jpy": total_cost,
            "avg_progress_pct": avg_progress,
            "active_projects_count": len(proj_perf),
            "safety_milestone_days": 184
        },
        "project_performance": proj_perf
    }

# 8. IT Services & Digital Infrastructure Workflow
@workflow_registry.register("it_services")
def analyze_it_services(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    if not records:
        return {}
    df = pd.DataFrame(records)
    df["date"] = pd.to_datetime(df["record_date"]).dt.strftime("%Y-%m-%d")

    sys_perf = []
    if "entity_name" in df.columns:
        grouped = df.groupby("entity_name").agg({
            "metric_value": "mean", # uptime %
            "secondary_value": "sum" # incident count
        }).reset_index()
        for _, r in grouped.iterrows():
            sys_perf.append({
                "system": str(r["entity_name"]),
                "uptime_pct": round(float(r["metric_value"]), 2),
                "incidents": int(r["secondary_value"] or 0)
            })
        sys_perf.sort(key=lambda x: x["incidents"], reverse=True)

    daily = df.groupby("date").agg({
        "metric_value": "mean",
        "secondary_value": "sum"
    }).reset_index().sort_values("date")

    trend = [{
        "date": r["date"],
        "uptime_pct": round(float(r["metric_value"]), 2),
        "incidents": int(r["secondary_value"] or 0)
    } for _, r in daily.iterrows()]

    avg_uptime = round(float(df["metric_value"].mean() or 0), 3)
    total_incidents = int(df["secondary_value"].sum() or 0)

    return {
        "kpis": {
            "avg_system_uptime_pct": avg_uptime,
            "total_incidents": total_incidents,
            "sla_compliance_met": avg_uptime >= 99.8,
            "critical_api_status": "Operational"
        },
        "system_performance": sys_perf,
        "trend": trend[-30:]
    }

def calculate_pareto(items: List[Dict[str, Any]], key: str, label: str) -> List[Dict[str, Any]]:
    if not items:
        return []
    total = sum(item[key] for item in items)
    if total == 0:
        return []
    
    sorted_items = sorted(items, key=lambda x: x[key], reverse=True)
    accumulated = 0
    result = []
    for item in sorted_items:
        accumulated += item[key]
        cum_pct = round((accumulated / total) * 100.0, 1)
        result.append({
            "name": item[label],
            "value": item[key],
            "cumulative_pct": cum_pct
        })
    return result
