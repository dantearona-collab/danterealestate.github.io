import json
import os
from typing import Any, Dict, List, Optional


def _normalize_barrio_key(name: str) -> str:
    if not name:
        return ""
    return name.strip().lower()


def _safe_list(value: Any) -> List[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(item) for item in value if item is not None]
    if isinstance(value, str):
        return [value] if value.strip() else []
    return [str(value)]


def _extract_market_context(barrio: str, property_data: Dict[str, Any], market_map: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    market_context = {
        "avg_m2_barrio": None,
        "muestra": None,
        "currency": "USD",
        "precio_vs_promedio": "No disponible",
        "last_update": None,
    }

    if not market_map:
        return market_context

    barrio_key = _normalize_barrio_key(barrio)
    barrio_data = market_map.get(barrio_key)
    if not barrio_data:
        return market_context

    operation = property_data.get("operacion", "venta").lower()
    property_type = property_data.get("tipo", "departamento").lower()

    bucket = barrio_data.get(operation) or barrio_data.get("venta") or barrio_data.get("alquiler")
    if not bucket:
        return market_context

    type_data = bucket.get(property_type) or bucket.get("departamento")
    if not type_data:
        return market_context

    market_context["avg_m2_barrio"] = type_data.get("avg_m2")
    market_context["muestra"] = type_data.get("muestra")
    market_context["currency"] = type_data.get("currency", "USD")
    market_context["last_update"] = type_data.get("last_update")

    precio = property_data.get("precio")
    metros = property_data.get("metros_cuadrados")
    if precio and metros and market_context["avg_m2_barrio"]:
        precio_m2_propiedad = float(precio) / float(metros)
        valor_promedio = float(market_context["avg_m2_barrio"])
        if precio_m2_propiedad > valor_promedio * 1.15:
            market_context["precio_vs_promedio"] = "por encima del promedio del barrio"
        elif precio_m2_propiedad < valor_promedio * 0.85:
            market_context["precio_vs_promedio"] = "por debajo del promedio del barrio"
        else:
            market_context["precio_vs_promedio"] = "en línea con el promedio del barrio"

    return market_context


def _build_barrio_summary(barrio_data: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    if not barrio_data:
        return {
            "resumen_publico": "Información del barrio no disponible.",
            "aspectos_clave": {
                "transporte": "No disponible",
                "servicios": "No disponible",
                "gastronomia": "No disponible",
                "seguridad": "No disponible",
            },
        }

    summary = {
        "resumen_publico": barrio_data.get("descripcion_general") or "Barrio con un perfil urbano y residencial equilibrado.",
        "aspectos_clave": {
            "transporte": ", ".join(_safe_list(barrio_data.get("transporte")))[:200] or "Transporte disponible en la zona.",
            "servicios": ", ".join(_safe_list(barrio_data.get("comercio")))[:200] or "Servicios locales cercanos.",
            "gastronomia": ", ".join(_safe_list(barrio_data.get("gastronomia")))[:200] or "Opciones gastronómicas cercanas.",
            "seguridad": ", ".join(_safe_list(barrio_data.get("seguridad")))[:200] or "Zona en general con buen tránsito y vida vecinal.",
        },
    }
    return summary


def _build_photo_metadata(fotos: Optional[List[str]]) -> List[Dict[str, str]]:
    if not fotos:
        return []

    normalized = []
    for index, path in enumerate(fotos[:5]):
        if not path:
            continue
        photo_type = "fachada"
        if index == 1:
            photo_type = "living"
        elif index == 2:
            photo_type = "dormitorio"
        elif index == 3:
            photo_type = "cocina"
        elif index == 4:
            photo_type = "exterior"
        normalized.append({"ruta": path, "tipo": photo_type})
    return normalized


def build_property_public_context(property_data: Dict[str, Any], barrio_data: Optional[Dict[str, Any]], market_map: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """Genera un contexto público compacto y útil para que la IA responda al público."""
    barrio_name = property_data.get("barrio") or "Sin barrio"
    description = property_data.get("descripcion") or property_data.get("titulo") or "Propiedad disponible."

    normalized = {
        "property_id": property_data.get("id_temporal"),
        "titulo": property_data.get("titulo"),
        "barrio": barrio_name,
        "operacion": property_data.get("operacion", "venta"),
        "tipo": property_data.get("tipo", "departamento"),
        "precio": property_data.get("precio"),
        "moneda": property_data.get("moneda_precio") or "USD",
        "metros_cuadrados": property_data.get("metros_cuadrados"),
        "ambientes": property_data.get("ambientes"),
        "direccion": property_data.get("direccion") or property_data.get("direccion_completa"),
        "descripcion_publica": description,
        "caracteristicas_publicas": [
            item.strip() for item in str(property_data.get("amenities") or "").split(",") if item.strip()
        ],
        "fotos_publicas": _build_photo_metadata(property_data.get("fotos")),
        "market_context": _extract_market_context(barrio_name, property_data, market_map),
        "barrio_context": _build_barrio_summary(barrio_data),
    }

    if not normalized["caracteristicas_publicas"]:
        normalized["caracteristicas_publicas"] = [
            property_data.get("cochera") or "Cochera",
            property_data.get("balcon") or "Balcón",
            property_data.get("pileta") or "Pileta",
            property_data.get("aire_acondicionado") or "Aire acondicionado",
        ]

    normalized["caracteristicas_publicas"] = [
        item for item in normalized["caracteristicas_publicas"] if item
    ]

    return normalized


def build_public_prompt(context: Dict[str, Any]) -> str:
    """Crea un prompt útil para un agente de IA orientado a público."""
    barrio = context.get("barrio", "barrio")
    titulo = context.get("titulo", "Propiedad")
    precio = context.get("precio")
    moneda = context.get("moneda", "USD")
    metros = context.get("metros_cuadrados")
    ambientes = context.get("ambientes")
    tipo = context.get("tipo", "propiedad")
    operacion = context.get("operacion", "venta")
    descripcion = context.get("descripcion_publica", "")
    market = context.get("market_context", {})
    barrio_ctx = context.get("barrio_context", {})

    prompt = f"""
Eres un asesor inmobiliario para público general.

INFORMACIÓN DE LA PROPIEDAD:
- Título: {titulo}
- Barrio: {barrio}
- Operación: {operacion}
- Tipo: {tipo}
- Precio: {precio} {moneda}
- Superficie: {metros} m²
- Ambientes: {ambientes}
- Descripción: {descripcion}

CONTEXTO DEL BARRIO:
- Resumen: {barrio_ctx.get('resumen_publico', 'Barrio con buena vida urbana y servicios locales.')}
- Transporte: {barrio_ctx.get('aspectos_clave', {}).get('transporte', 'Transporte disponible en la zona.')}
- Servicios: {barrio_ctx.get('aspectos_clave', {}).get('servicios', 'Servicios cercanos.')}
- Gastronomía: {barrio_ctx.get('aspectos_clave', {}).get('gastronomia', 'Opciones gastronómicas cercanas.')}

MERCADO:
- Valor promedio del m² en el barrio: {market.get('avg_m2_barrio')} {market.get('currency', 'USD')}
- Estimación: {market.get('precio_vs_promedio', 'No disponible')}

INSTRUCCIONES:
Responde al público de forma clara, útil y honesta.
Explica breve y útilmente por qué la propiedad puede interesar.
Menciona fortalezas del barrio y la propiedad.
Si el precio está arriba o abajo del promedio, aclarálo sin inventar datos.
No uses lenguaje técnico innecesario.
"""
    return prompt.strip()


def build_public_ai_context_from_files(props_path: str = "propiedades.json", barrio_path: str = "entorno.json", market_map_path: str = "backend/market_valuation_map.json") -> Dict[str, Any]:
    """Combina propiedades + barrio + mercado para generar un contexto listo para la IA."""
    with open(props_path, "r", encoding="utf-8") as f:
        propiedades = json.load(f)

    barrio_data = {}
    if os.path.exists(barrio_path):
        with open(barrio_path, "r", encoding="utf-8") as f:
            barrio_data = json.load(f)

    market_map = {}
    if os.path.exists(market_map_path):
        with open(market_map_path, "r", encoding="utf-8") as f:
            market_map = json.load(f)

    if isinstance(propiedades, dict):
        propiedades = list(propiedades.values())

    output = []
    for prop in propiedades:
        barrio_name = prop.get("barrio")
        barrio_info = barrio_data.get(barrio_name) if isinstance(barrio_data, dict) else None
        output.append(build_property_public_context(prop, barrio_info, market_map))

    return {"properties": output, "count": len(output)}
