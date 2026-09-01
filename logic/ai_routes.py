from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
from logic.ai_client import generate_market_analysis, estimate_property_valuation, compare_properties

router = APIRouter(prefix="/api/ai", tags=["AI"])

class MarketAnalysisRequest(BaseModel):
    barrio: str
    search_results: Optional[List[dict]] = None

class ValuationRequest(BaseModel):
    barrio: str
    tipo: str
    ambientes: int
    estado: str
    operacion: str = "venta"

class PropertyComparisonRequest(BaseModel):
    propiedad_id: Optional[str] = None
    propiedad: Optional[dict] = None

@router.post("/market-analysis")
async def market_analysis(req: MarketAnalysisRequest):
    try:
        result = generate_market_analysis(req.barrio)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/property-valuation")
async def property_valuation(req: ValuationRequest):
    try:
        details = req.dict()
        result = estimate_property_valuation(details)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/compare-properties")
async def compare_properties_endpoint(req: PropertyComparisonRequest):
    try:
        data = req.dict()
        result = compare_properties(data)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
