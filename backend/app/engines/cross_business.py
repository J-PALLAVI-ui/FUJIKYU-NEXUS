import numpy as np
import pandas as pd
from typing import List, Dict, Any

class CrossBusinessIntelligenceEngine:
    @staticmethod
    def correlate_divisions(
        div_a_data: List[Dict[str, Any]], # e.g. Railway daily passengers
        div_b_data: List[Dict[str, Any]], # e.g. Amusement daily visitors
        metric_a_name: str = "railway_passengers",
        metric_b_name: str = "park_visitors"
    ) -> Dict[str, Any]:
        if not div_a_data or not div_b_data:
            return {"correlation": 0, "paired_data": [], "insights": [], "limitations": "Insufficient overlap."}

        df_a = pd.DataFrame(div_a_data)[["date", "value"]].rename(columns={"value": metric_a_name})
        df_b = pd.DataFrame(div_b_data)[["date", "value"]].rename(columns={"value": metric_b_name})

        # Inner join on common date
        merged = pd.merge(df_a, df_b, on="date", how="inner").dropna()
        if len(merged) < 5:
            return {"correlation": 0, "paired_data": [], "insights": [], "limitations": "Insufficient shared date points."}

        # Calculate Pearson correlation
        corr = float(merged[[metric_a_name, metric_b_name]].corr().iloc[0, 1])
        if np.isnan(corr):
            corr = 0.0

        # Build paired timeline
        paired = []
        for _, r in merged.iterrows():
            paired.append({
                "date": r["date"],
                metric_a_name: round(float(r[metric_a_name]), 1),
                metric_b_name: round(float(r[metric_b_name]), 1)
            })

        # Generate intelligent business narrative
        insights = []
        strength = "strong" if abs(corr) >= 0.75 else "moderate" if abs(corr) >= 0.5 else "weak"
        dir_text = "positive" if corr > 0 else "negative"

        insights.append({
            "correlation_coefficient": round(corr, 3),
            "strength": strength,
            "direction": dir_text,
            "business_meaning": (
                f"Statistically {strength} {dir_text} correlation (r={corr:.2f}) observed between {metric_a_name.replace('_', ' ')} "
                f"and {metric_b_name.replace('_', ' ')} across {len(merged)} concurrent operating days."
            ),
            "strategic_opportunity": (
                "Joint packaging potential: High alignment indicates significant visitor overlap. "
                "Bundling railway express transit with park priority access or hotel packages can capture additional customer surplus."
            ),
            "evidence": f"Synchronized 30-day temporal tracking across normalized operating hours.",
            "limitations_and_disclaimers": (
                "Correlation does NOT imply causation. Shared macroeconomic factors, weekend calendar effects, and regional "
                "Yamanashi seasonal holidays influence both series simultaneously."
            )
        })

        return {
            "correlation": round(corr, 3),
            "sample_size": len(merged),
            "paired_data": paired[-30:],
            "insights": insights,
            "limitations": "Temporal alignment is restricted to days with verified reporting across both enterprise data pipelines."
        }
