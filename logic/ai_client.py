# logic/ai_client.py
"""Utility functions that wrap Gemini calls for specific AI features.
These functions are used by the FastAPI AI endpoints.
"""

from typing import Dict
from logic.gemini_client import call_gemini_with_rotation


def generate_market_analysis(barrio: str) -> str:
    """Generate a market analysis report for a given barrio.
    Returns the raw Gemini response (string)."""
    prompt = f"""Genera un informe de análisis de mercado para el barrio '{barrio}'.
Incluye datos de precios promedio, demanda, tendencias, infraestructura y calidad de vida.
Devuelve el informe en texto plano, sin markdown.
"""
    return call_gemini_with_rotation(prompt)


def estimate_property_valuation(details: Dict) -> str:
    """Estimate property price based on provided details.
    *details* should contain keys: barrio, tipo, ambientes, estado, operacion.
    Returns a textual estimation.
    """
    prompt = f"""Estimá el precio de una propiedad con los siguientes datos:
Barrio: {details.get('barrio')}
Tipo: {details.get('tipo')}
Ambientes: {details.get('ambientes')}
Estado: {details.get('estado')}
Operación: {details.get('operacion')}
Proporcioná un rango de precios en USD y ARS, con una breve justificación.
Respuesta en texto plano, sin markdown.
"""
    return call_gemini_with_rotation(prompt)


def compare_properties(data: Dict) -> str:
    """Compare two properties using AI.
    *data* is expected to contain either 'propiedad_id' or full 'propiedad' dicts.
    Returns a comparative analysis.
    """
    prompt = f"""Compara las siguientes dos propiedades y genera un análisis comparativo.
Proporcioná ventajas, desventajas y recomendación.
Datos: {data}
Respuesta en texto plano, sin markdown.
"""
    return call_gemini_with_rotation(prompt)
