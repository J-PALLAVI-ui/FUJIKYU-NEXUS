from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.schemas.api_schemas import NaturalLanguageQueryRequest, NaturalLanguageQueryResponse
from backend.app.engines.nexus_ai import NexusAIEngine

router = APIRouter(prefix="/api/assistant", tags=["NEXUS AI Natural Language Assistant"])

@router.post("/query", response_model=NaturalLanguageQueryResponse)
def execute_natural_language_query(
    payload: NaturalLanguageQueryRequest,
    db: Session = Depends(get_db)
):
    if not payload.query or len(payload.query.strip()) < 3:
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    # Execute controlled text-to-SQL & semantic analytical retrieval
    response_data = NexusAIEngine.answer_query(db, payload.query, payload.division_code)
    
    return NaturalLanguageQueryResponse(
        query=response_data["query"],
        answer=response_data["answer"],
        sql_executed=response_data.get("sql_executed"),
        data_source=response_data.get("data_source", "PostgreSQL"),
        date_range=response_data.get("date_range", "Recent Operating Period"),
        chart_type=response_data.get("chart_type"),
        chart_data=response_data.get("chart_data", []),
        columns=response_data.get("columns", []),
        confidence=response_data.get("confidence", 0.9),
        is_demo_data=True
    )
