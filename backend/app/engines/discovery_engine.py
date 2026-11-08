import datetime
from typing import List, Dict, Any

class AutonomousBusinessDiscoveryEngine:
    @staticmethod
    def scan_for_business_insights(
        division_code: str,
        analytics: Dict[str, Any],
        anomalies: List[Dict[str, Any]],
        historical_baseline: Dict[str, Any] = None
    ) -> List[Dict[str, Any]]:
        insights = []
        now = datetime.datetime.utcnow().strftime("%Y-%m-%d")

        # 1. Check for severe anomalies
        critical_anomalies = [a for a in anomalies if a.get("severity") in ["critical", "high"]]
        for anom in critical_anomalies:
            is_spike = anom["deviation_pct"] > 0
            direction_text = "surge" if is_spike else "sharp contraction"
            
            # Formulate structured insight
            if division_code == "railway":
                title = f"Railway Operational Alert: {direction_text.capitalize()} in Daily Passenger Flow"
                impact_yen = round(abs(anom["actual"] - anom["expected"]) * 1180, 0)
                factors = [
                    "Confirmed Evidence: Passenger count showed a deviation of " + f"{anom['deviation_pct']:+}% from the 30-day moving average.",
                    "Hypothesis (Unconfirmed): Potential correlation with major event or ride opening at Fuji-Q Highland.",
                    "Hypothesis (Unconfirmed): Extreme weather disruption or track speed restrictions along Otsuki - Kawaguchiko line."
                ]
                inv = "Cross-reference Otsuki gateway turnstile logs against automated train control (ATC) speed log records."
                rec = "Deploy dynamic rolling train car schedules during peak passenger surge windows."
            elif division_code == "amusement":
                title = f"Amusement Park Attraction Efficiency Gap: Wait-Time Anomaly ({direction_text})"
                impact_yen = round(abs(anom["actual"] - anom["expected"]) * 4200, 0)
                factors = [
                    "Confirmed Evidence: Visitor load recorded a " + f"{anom['deviation_pct']:+}% variation against planned capacity.",
                    "Hypothesis (Unconfirmed): Technical sensor reset on Eejanaika or Fujiyama coaster causing express queue bottleneck.",
                    "Hypothesis (Unconfirmed): Sudden weather shift (wind shear exceeding 15m/s) altering ride dispatch intervals."
                ]
                inv = "Audit ride dispatch telemetry logs and priority Smart-Pass queue scan ratios."
                rec = "Implement automated smart-queue load balancer via official Fuji-Q mobile app."
            elif division_code == "hotels":
                title = f"Hospitality Yield Discrepancy: Weekend Occupancy Deviation"
                impact_yen = round(abs(anom["actual"] - anom["expected"]) * 28500, 0)
                factors = [
                    "Confirmed Evidence: Occupancy rate shifted by " + f"{anom['deviation_pct']:+}% relative to seasonal median.",
                    "Hypothesis (Unconfirmed): Last-minute OTA (Online Travel Agency) cancellation spike.",
                    "Hypothesis (Unconfirmed): Regional conference or domestic tourism package shift."
                ]
                inv = "Examine OTA channel manager API cancellation timestamps and inbound group tour manifests."
                rec = "Activate dynamic automated non-refundable rate fencing 72 hours prior to arrival."
            elif division_code == "retail":
                title = f"Retail Inventory Bottleneck: High Velocity SKU Disruption"
                impact_yen = round(abs(anom["actual"] - anom["expected"]) * 1650, 0)
                factors = [
                    "Confirmed Evidence: Product transaction volume diverged by " + f"{anom['deviation_pct']:+}% from baseline.",
                    "Hypothesis (Unconfirmed): Stockout of popular Mt. Fuji souvenir packaging boxes at Fujiyama Bazaar.",
                    "Hypothesis (Unconfirmed): Shift in tour bus arrival timetables at main gift terminal."
                ]
                inv = "Perform immediate physical cycle count on top-quartile revenue SKUs."
                rec = "Deploy automated IoT safety-stock reorder triggers integrated with central ERP."
            else:
                title = f"Operational Discrepancy Detected in {division_code.replace('_', ' ').title()}"
                impact_yen = 850000.0
                factors = [
                    f"Confirmed Evidence: Metric anomaly detected on {anom['date']} with {anom['deviation_pct']:+}% deviation.",
                    "Hypothesis (Unconfirmed): External seasonal variation or delayed batch synchronization."
                ]
                inv = "Review operational ledger and source ingestion timestamps."
                rec = "Schedule automated cross-departmental reconciliation review."

            insights.append({
                "title": title,
                "division_code": division_code,
                "detection_date": anom["date"],
                "severity": anom["severity"],
                "supporting_data": anom,
                "historical_comparison": f"Observed: {anom['actual']:,} vs Benchmark Expected: {anom['expected']:,} (Deviation: {anom['deviation_pct']:+}%)",
                "possible_factors": factors,
                "business_impact_yen": impact_yen,
                "confidence_level": 0.89 if anom["severity"] == "critical" else 0.82,
                "suggested_investigation": inv,
                "recommended_improvement": rec,
                "is_hypothesis": True
            })

        # 2. Check for Pareto / Concentration risk
        pareto = analytics.get("pareto", [])
        if pareto and len(pareto) >= 3:
            top_item = pareto[0]
            if top_item.get("cumulative_pct", 0) > 45.0:
                insights.append({
                    "title": f"High Revenue Concentration Risk on Single Asset ({top_item['name']})",
                    "division_code": division_code,
                    "detection_date": now,
                    "severity": "medium",
                    "supporting_data": {"top_asset": top_item["name"], "contribution_pct": top_item["cumulative_pct"]},
                    "historical_comparison": f"The top single entity generates {top_item['cumulative_pct']}% of total division volume.",
                    "possible_factors": [
                        f"Confirmed Evidence: {top_item['name']} accounts for over 45% of total recorded activity.",
                        "Hypothesis (Unconfirmed): Marketing and visitor preference heavily concentrated on flagship attractions/items without cross-merchandising."
                    ],
                    "business_impact_yen": 2400000.0,
                    "confidence_level": 0.94,
                    "suggested_investigation": "Conduct portfolio sensitivity analysis to evaluate revenue vulnerability if this asset experiences downtime.",
                    "recommended_improvement": "Diversify secondary product offerings and introduce bundled promotional passes to redistribute demand.",
                    "is_hypothesis": False
                })

        return insights
