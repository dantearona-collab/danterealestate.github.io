import os
from threading import Lock
from typing import List

from dotenv import load_dotenv

try:
    from google import genai
except Exception:
    genai = None

load_dotenv()


def _load_api_keys() -> List[str]:
    keys: List[str] = []
    key_names = ["GEMINI_API_KEY"]
    for index in range(1, 11):
        key_names.extend([f"GEMINI_API_KEY_{index}", f"GEMINI_KEYS_{index}"])

    for key_name in key_names:
        key_value = os.environ.get(key_name)
        if key_value and key_value.strip():
            value = key_value.strip()
            if value.startswith(("AIza", "AQ.")) and value not in keys:
                keys.append(value)
                print(f"✅ {key_name}: Clave cargada exitosamente")
    return keys


API_KEYS = _load_api_keys()
configured_models = os.environ.get("GEMINI_MODELS", "").strip()
if configured_models:
    model_names = configured_models.split(",")
else:
    model_names = [os.environ.get("WORKING_MODEL", "gemini-3.6-flash")]
MODEL_CANDIDATES = []
for model in model_names:
    model = model.strip()
    if model and model not in MODEL_CANDIDATES:
        MODEL_CANDIDATES.append(model)

_rotation_lock = Lock()
_next_key_index = 0


def get_fallback_response() -> str:
    """Respuesta de fallback cuando Gemini no funciona."""
    return (
        "🤖 **Dante Propiedades**\n\n"
        "¡Hola! La aplicación está funcionando pero hay un problema temporal con el servicio de IA.\n\n"
        "**Sistema disponible:**\n"
        "✅ Búsqueda de propiedades\n"
        "✅ Filtros por barrio, precio, tipo\n"
        "✅ Base de datos cargada\n\n"
        "⚠️ **El modo conversacional IA está temporalmente desactivado.**\n\n"
        "**Cómo usar:**\n"
        "1. Escribí tu búsqueda (ej: \"departamento en palermo\")\n"
        "2. La app encontrará propiedades relevantes\n"
        "3. Usá los filtros para refinar resultados\n\n"
        "🏠 **¡La búsqueda de propiedades funciona perfectamente!**"
    )


def call_gemini_with_rotation(prompt: str) -> str:
    """Llama a Gemini usando una clave válida o retorna un fallback."""
    global _next_key_index

    if genai is None:
        print("⚠️ google-genai no está instalado en este entorno; usando fallback.")
        return get_fallback_response()

    if not API_KEYS:
        print("⚠️ No hay API keys configuradas")
        return get_fallback_response()

    with _rotation_lock:
        start_index = _next_key_index % len(API_KEYS)
        _next_key_index = (start_index + 1) % len(API_KEYS)

    ordered_keys = API_KEYS[start_index:] + API_KEYS[:start_index]
    for offset, key in enumerate(ordered_keys):
        key_number = (start_index + offset) % len(API_KEYS) + 1
        for model in MODEL_CANDIDATES:
            try:
                client = genai.Client(api_key=key)
                response = client.models.generate_content(model=model, contents=prompt)
                text = getattr(response, "text", None)
                if not text:
                    raise ValueError("Respuesta vacía de Gemini")
                print(f"✅ Gemini respondió usando {model}")
                return text.strip()
            except Exception as e:
                print(f"❌ Error con clave {key_number}, modelo {model}: {e}")

    print("💥 Todas las claves fallaron - usando fallback")
    return get_fallback_response()


def build_prompt(user_text, results=None, filters=None, channel="web", style_hint="", property_details=None):
    whatsapp_tone = channel == "whatsapp"

    if property_details:
        property_context = f"""
📍 **PROPIEDAD ENCONTRADA:**

**📝 Descripción:** {property_details.get('descripcion', 'Sin descripción')}
**💰 Precio:** {property_details.get('precio', 'Consultar')}
**📐 Superficie:** {property_details.get('superficie', 'N/D')}m²
**🛏️ Ambientes:** {property_details.get('ambientes', 'N/D')}
**📅 Antigüedad:** {property_details.get('antiguedad', 'N/D')}
**📍 Ubicación:** {property_details.get('ubicacion', 'No especificada')}
**🏷️ Tipo:** {property_details.get('tipo', 'Propiedad')}
**📋 Características:** {', '.join(property_details.get('caracteristicas', [])) or 'Consultar'}
**✅ Estado:** {property_details.get('estado', 'Disponible')}
"""

        base_prompt = f"""
Eres Dante, un asistente experto en propiedades en Buenos Aires.

{property_context}

El usuario preguntó: "{user_text}"

Tu tarea es:
1. Responder de manera útil y natural sobre esta propiedad
2. Mencionar los detalles clave de la propiedad
3. Si es necesario, preguntar si quiere ver más propiedades similares
4. Mantener un tono profesional pero amigable

Responde de forma concisa y directa.
"""
        return base_prompt

    return build_conversational_prompt(user_text, results, filters, whatsapp_tone, style_hint)


def build_conversational_prompt(user_text: str, results=None, filters=None, whatsapp_tone=False, style_hint=""):
    """Construye el prompt conversacional."""
    property_types = {
        'departamento': ['depto', 'departamento', 'ph', 'apartamento'],
        'casa': ['casa', 'chalet', 'casaquinta', 'townhouse'],
        'terreno': ['terreno', 'lote', ' parcela', 'solar'],
        'oficina': ['oficina', 'local comercial', 'comercial', 'ph comercial'],
    }

    detected_type = 'propiedad'
    for ptype, keywords in property_types.items():
        if any(kw in user_text.lower() for kw in keywords):
            detected_type = ptype
            break

    intent = 'consulta'
    if any(kw in user_text.lower() for kw in ['alquiler', 'alquilar', 'alquilo', 'rent']):
        intent = 'alquiler'
    elif any(kw in user_text.lower() for kw in ['venta', 'vender', 'comprar']):
        intent = 'venta'
    elif any(kw in user_text.lower() for kw in ['precio', 'cuanto', 'valor', 'cuesta']):
        intent = 'precio'
    elif any(kw in user_text.lower() for kw in ['ubicación', 'donde', 'zona', 'barrio', 'dirección']):
        intent = 'ubicacion'
    elif any(kw in user_text.lower() for kw in ['características', 'caracteristicas', 'ambientes', 'metros', 'superficie']):
        intent = 'caracteristicas'

    if whatsapp_tone:
        prompt = f"""Eres Dante, un asistente especializado en propiedades en Buenos Aires.

El usuario dice: "{user_text}"

Contexto: Tipo de propiedad: {detected_type} | Intención: {intent} | Filtros: {filters or 'ninguno'}
"""
    else:
        prompt = f"""Eres Dante, un asistente especializado en propiedades en Buenos Aires.

User input: "{user_text}"

Context: Property type: {detected_type} | Intent: {intent} | Filters: {filters or 'none'}
"""

    if style_hint:
        prompt += f"\n{style_hint}\n"

    prompt += """
Si el usuario quiere coordinar o agendar una visita, solicita antes de confirmar:
nombre completo, número de celular y correo electrónico. El mensaje o comentario
adicional es opcional. Conserva los datos ya proporcionados y pregunta únicamente
por los que falten. No afirmes que la cita quedó registrada hasta tener nombre,
celular y correo.
"""

    if results is not None and results:
        prompt += f"""
📊 Hay {len(results)} propiedades que coinciden con la búsqueda.
"""

    prompt += """
Tu objetivo es:
- Entender la necesidad del usuario
- Responder de manera útil y natural
- Sugerir próximos pasos si corresponde
- Mantener un tono profesional pero amigable

Responde de forma concisa (máximo 2-3 oraciones).
"""
    return prompt

    if results is not None and results:
        prompt += f"""
📊 Hay {len(results)} propiedades que coinciden con la búsqueda.
"""

    prompt += """
Tu objetivo es:
- Entender la necesidad del usuario
- Responder de manera útil y natural
- Sugerir próximos pasos si corresponde
- Mantener un tono profesional pero amigable

Responde de forma concisa (máximo 2-3 oraciones).
"""
    return prompt