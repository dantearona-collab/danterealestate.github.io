import os
import google.generativeai as genai
from typing import Optional, Dict, Any, List

# ✅ API KEY DE GEMINI - CONFIGURADA
GEMINI_API_KEY = "AIzaSyC5Q_zOkU3fEWPL4lCvTNXL4Em18nJ9Zkk"

# ✅ CONFIGURACIÓN GLOBAL
print("=" * 50)
print("🔍 INICIALIZANDO GEMINI CLIENT")
print("=" * 50)

# Cargar API keys desde entorno o usar la key hardcodeada
API_KEYS = []

# Primero intentar cargar desde variables de entorno
for i in range(1, 4):
    key_name = f"GEMINI_API_KEY_{i}"
    key_value = os.environ.get(key_name)
    if key_value and key_value.strip():
        API_KEYS.append(key_value.strip())
        print(f"✅ {key_name}: Cargada desde entorno")

# Si no hay keys en entorno, usar la key hardcodeada
if not API_KEYS:
    if GEMINI_API_KEY and GEMINI_API_KEY.strip():
        API_KEYS.append(GEMINI_API_KEY.strip())
        print(f"✅ API Key: Cargada desde configuración")

MODEL = os.environ.get("WORKING_MODEL", "gemini-2.0-flash-001")

print(f"🎯 CONFIGURACIÓN FINAL: Modelo={MODEL}, Claves={len(API_KEYS)}")
print("=" * 50)

def call_gemini_with_rotation(prompt: str) -> str:
    """Función para llamar a Gemini API con rotación de claves"""
    print(f"🎯 INICIANDO ROTACIÓN DE CLAVES")
    print(f"🔧 Modelo: {MODEL}")
    print(f"🔑 Claves disponibles: {len(API_KEYS)}")
    
    if not API_KEYS:
        print("⚠️ No hay API keys configuradas, usando modo básico")
        return get_fallback_response()
    
    for i, key in enumerate(API_KEYS):
        try:
            print(f"🔄 Probando clave {i+1}/{len(API_KEYS)}...")
            
            # ✅ CONFIGURACIÓN EXPLÍCITA
            genai.configure(
                api_key=key,
                transport='rest',  # Forzar transporte REST
            )
            
            model = genai.GenerativeModel(MODEL)
            
            # ✅ LLAMADA MÁS SIMPLE PARA DIAGNÓSTICO
            print(f"   📝 Prompt length: {len(prompt)} caracteres")
            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.7,
                    max_output_tokens=1000,
                )
            )
            
            print(f"   ✅ Respuesta recibida, partes: {len(response.parts) if response.parts else 0}")
            
            if not response.parts:
                raise Exception("Respuesta vacía de Gemini")
            
            answer = response.text.strip()
            print(f"✅ Éxito con clave {i+1}")
            print(f"   📄 Respuesta: {answer[:100]}...")
            return answer

        except Exception as e:
            error_type = type(e).__name__
            error_msg = str(e)
            
            print(f"❌ ERROR Clave {i+1}:")
            print(f"   🏷️  Tipo: {error_type}")
            print(f"   📄 Mensaje: {error_msg}")
            
            # Detectar tipo de error específico
            if "429" in error_msg:
                print(f"   💡 Clave {i+1} agotada (rate limit)")
            elif "401" in error_msg or "PermissionDenied" in error_type or "API_KEY_INVALID" in error_msg:
                print(f"   💡 Clave {i+1} no autorizada/inválida")
            elif "quota" in error_msg.lower():
                print(f"   💡 Clave {i+1} sin quota")
            elif "503" in error_msg or "500" in error_msg:
                print(f"   💡 Error del servidor Gemini")
            elif "network" in error_msg.lower() or "connection" in error_msg.lower():
                print(f"   💡 Error de conexión")
            
            continue
    
    print("💥 TODAS las claves fallaron - usando modo básico")
    return get_fallback_response()

def get_fallback_response():
    """Respuesta de fallback cuando Gemini no funciona"""
    return "🤖 **Dante Propiedades**\n\n¡Hola! La aplicación está funcionando pero hay un problema temporal con el servicio de IA.\n\n**Sistema disponible:**\n✅ Búsqueda de propiedades\n✅ Filtros por barrio, precio, tipo\n✅ Base de datos cargada\n\n⚠️ **El modo conversacional IA está temporalmente desactivado.**\n\n**Cómo usar:**\n1. Escribí tu búsqueda (ej: \"departamento en palermo\")\n2. La app encontrará propiedades relevantes\n3. Usá los filtros para refinar resultados\n\n🏠 **¡La búsqueda de propiedades funciona perfectamente!**"

# ... (el resto de build_prompt permanece igual)
def build_prompt(user_text, results=None, filters=None, channel="web", style_hint="", property_details=None):
    whatsapp_tone = channel == "whatsapp"

    if property_details:
        # ... (código existente para property_details) ...
        pass
    
    if results is not None and results:
        # ✅ NUEVA VERSIÓN - SIN LISTAR PROPIEDADES EN EL TEXTO
        property_emojis = {
            'casa': '🏠',
            'departamento': '🏢', 
            'ph': '🏡',
            'terreno': '📐',
            'oficina': '💼',
            'casaquinta': '🏘️',
            'local': '🏪',
            'galpon': '🏭'
        }
        
        # Solo obtener información general para contexto, NO para mostrar
        tipos = list(set([r.get('tipo', '').title() for r in results if r.get('tipo')]))
        barrios = list(set([r.get('barrio', '') for r in results if r.get('barrio')]))
        operaciones = list(set([r.get('operacion', '').title() for r in results if r.get('operacion')]))
        
        return (
            f"El usuario busca: '{user_text}'\n\n"
            f"ENCONTRÉ {len(results)} PROPIEDADES que coinciden. "
            f"**IMPORTANTE: Las propiedades se muestran en TARJETAS VISUALES en la interfaz - NO las listes en el texto.**\n\n"
            f"INFORMACIÓN PARA CONTEXTO (NO mostrar al usuario):\n"
            f"- Total propiedades: {len(results)}\n"
            f"- Tipos: {', '.join(tipos) if tipos else 'Varios'}\n"
            f"- Barrios: {', '.join(barrios) if barrios else 'Varias zonas'}\n"
            f"- Operaciones: {', '.join(operaciones) if operaciones else 'Varias'}\n\n"
            f"INSTRUCCIONES ESPECÍFICAS:\n"
            f"1. Da un mensaje BREVE confirmando que encontraste propiedades\n"
            f"2. NO listes las propiedades individualmente\n"
            f"3. NO uses números (1., 2., 3.) ni detalles específicos\n"
            f"4. NO uses emojis de propiedades (🏠, 📍, 💰, 🏢, 📐) en el texto\n"
            f"5. Puedes mencionar patrones generales (ej: 'propiedades en venta', 'varios barrios')\n"
            f"6. Invita al usuario a ver las propiedades en las tarjetas visuales\n"
            f"7. Ofrece ayuda para refinar o preguntar sobre propiedades específicas\n"
            f"8. Mantén un tono {'breve y directo' if whatsapp_tone else 'profesional y cálido'}\n\n"
            f"EJEMPLOS DE RESPUESTAS ADECUADAS:\n"
            f"- '¡Perfecto! Encontré {len(results)} propiedades que coinciden con tu búsqueda. Te las muestro abajo 👇'\n"
            f"- 'Excelente, tengo {len(results)} opciones que podrían interesarte. Las ves en las tarjetas?'\n"
            f"- 'Encontré propiedades que coinciden con lo que buscas. ¿Te gustaría que ajuste algún filtro?'\n\n"
            f"¡RESPONDE SOLO CON UN MENSAJE BREVE SIN LISTAR PROPIEDADES!"
        )
    
    # Si no hay resultados
    elif results is not None and not results:
        return (
            f"El usuario busca: '{user_text}'\n\n"
            f"NO SE ENCONTRARON PROPIEDADES con los filtros actuales.\n\n"
            f"INSTRUCCIONES:\n"
            f"1. Informa amablemente que no hay resultados\n"
            f"2. Sugiere ajustar filtros o ampliar la búsqueda\n"
            f"3. Pregunta por preferencias más específicas\n"
            f"4. Ofrece ayuda para refinar la búsqueda\n"
            f"5. Mantén un tono positivo y útil\n\n"
            f"Filtros aplicados: {filters}\n\n"
            f"Ejemplo: 'No encontré propiedades con esos filtros. ¿Querés probar con otros barrios o precios?'"
        )
    
    # Para consultas generales sin búsqueda
    else:
        return (
            f"El usuario dice: '{user_text}'\n\n"
            f"Esta es una consulta general o conversacional.\n\n"
            f"INSTRUCCIONES:\n"
            f"1. Responde de manera natural y útil\n"
            f"2. Si es sobre tipos de propiedades, sugiere usar los filtros\n"
            f"3. Si es una pregunta específica, responde concisamente\n"
            f"4. Invita a realizar una búsqueda si es apropiado\n"
            f"5. Mantén un tono {'breve y directo' if whatsapp_tone else 'profesional y cálido'}\n\n"
            f"{style_hint}"
        )