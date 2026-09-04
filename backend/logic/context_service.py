"""Carga y selecciona contexto verificable para las respuestas de IA."""

import json
from pathlib import Path
from typing import Any, Dict, List

from .barrio_data import get_financial_info, get_gastronomy_info


class ContextService:
    """Combina fuentes locales y devuelve solo el contexto relevante."""

    def __init__(self, base_path: Path):
        self.base_path = Path(base_path)
        self.entorno_path = self.base_path / "entorno.json"
        self.market_path = self.base_path / "market_valuation_map.json"

    @staticmethod
    def _load_json(path: Path) -> Dict[str, Any]:
        try:
            with path.open("r", encoding="utf-8") as file:
                data = json.load(file)
            return data if isinstance(data, dict) else {}
        except (OSError, json.JSONDecodeError):
            return {}

    @staticmethod
    def _find_neighborhood(data: Dict[str, Any], name: str) -> Dict[str, Any]:
        normalized_name = (name or "").strip().casefold()
        for key, value in data.items():
            if str(key).strip().casefold() == normalized_name and isinstance(value, dict):
                return value
        return {}

    @staticmethod
    def _as_text(value: Any, default: str = "No disponible") -> str:
        if isinstance(value, list):
            text = ", ".join(str(item) for item in value if item is not None)
            return text or default
        if value is None or value == "":
            return default
        return str(value)

    def _market_context(self, property_data: Dict[str, Any], market_map: Dict[str, Any]) -> Dict[str, Any]:
        neighborhood = str(property_data.get("barrio") or "").strip().casefold()
        market = market_map.get(neighborhood, {})
        operation = str(property_data.get("operacion") or "venta").casefold()
        property_type = str(property_data.get("tipo") or "departamento").casefold()
        bucket = market.get(operation) or market.get("venta") or market.get("alquiler") or market
        market_data = bucket.get(property_type) or bucket.get("departamento") or {}

        average_m2 = market_data.get("avg_m2")
        price = property_data.get("precio")
        size = property_data.get("metros_cuadrados")
        comparison = "No disponible"
        if average_m2 and price and size:
            price_m2 = float(price) / float(size)
            if price_m2 < float(average_m2) * 0.85:
                comparison = "por debajo del promedio del barrio"
            elif price_m2 > float(average_m2) * 1.15:
                comparison = "por encima del promedio del barrio"
            else:
                comparison = "en línea con el promedio del barrio"

        return {
            "promedio_m2": average_m2,
            "muestra": market_data.get("muestra"),
            "moneda": market_data.get("currency", property_data.get("moneda_precio", "USD")),
            "comparacion": comparison,
            "actualizado": market_data.get("last_update"),
        }

    def build_property_context(self, property_data: Dict[str, Any]) -> Dict[str, Any]:
        entorno = self._load_json(self.entorno_path)
        market_map = self._load_json(self.market_path)
        neighborhood = str(property_data.get("barrio") or "")
        neighborhood_data = self._find_neighborhood(entorno, neighborhood)
        gastronomy = get_gastronomy_info(neighborhood)
        financial = get_financial_info(neighborhood)

        return {
            "property": {
                "id": property_data.get("id_temporal"),
                "title": property_data.get("titulo"),
                "neighborhood": neighborhood,
                "operation": property_data.get("operacion"),
                "type": property_data.get("tipo"),
                "price": property_data.get("precio"),
                "currency": property_data.get("moneda_precio") or "USD",
                "square_meters": property_data.get("metros_cuadrados"),
                "rooms": property_data.get("ambientes"),
                "description": property_data.get("descripcion"),
                "address": property_data.get("direccion") or property_data.get("direccion_completa"),
            },
            "neighborhood": {
                "summary": neighborhood_data.get("descripcion_general", "Información del barrio no disponible."),
                "transport": self._as_text(neighborhood_data.get("transporte")),
                "commerce": self._as_text(neighborhood_data.get("comercio")),
                "security": self._as_text(neighborhood_data.get("seguridad")),
                "health": self._as_text(neighborhood_data.get("salud")),
                "education": self._as_text(neighborhood_data.get("educacion")),
                "green_spaces": self._as_text(neighborhood_data.get("espacios_verdes")),
                "gastronomy": self._as_text(gastronomy.get("descripcion")),
                "gastronomy_score": gastronomy.get("puntuacion"),
                "financial_services": self._as_text(financial.get("descripcion")),
                "financial_score": financial.get("puntuacion"),
            },
            "market": self._market_context(property_data, market_map),
        }

    def build_prompt_context(self, properties: List[Dict[str, Any]], limit: int = 5) -> str:
        contexts = [self.build_property_context(item) for item in properties[:limit]]
        return json.dumps(contexts, ensure_ascii=False, indent=2)
