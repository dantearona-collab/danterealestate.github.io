"""
Backend para Dante Propiedades - Asistente Inmobiliario con IA
"""
import os
import re
import json
import time
from functools import lru_cache
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.openapi.utils import get_openapi
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

# Importar lógica de negocio
from logic.database import (
    initialize_databases,
    verificar_y_reparar_bd,
    query_properties,
    get_historial_canal,
    get_last_bot_response,
    log_conversation,
    DB_PATH,
    LOG_PATH
)
from logic.filters import detect_filters
from logic.gemini_client import call_gemini_with_rotation, build_prompt
from logic.filter_data import BARRIOS, OPERACIONES, TIPOS

# Importar módulo de scraping de mercado
try:
    from logic.scraper import ScrapingManager, MarketAnalyzer
    SCRAPER_AVAILABLE = True
    print("✅ Módulo de scraping disponible")
except ImportError as e:
    SCRAPER_AVAILABLE = False
    print(f"⚠️ Módulo de scraping no disponible: {e}")

# ✅ INICIALIZACIÓN Y CONFIGURACIÓN
verificar_y_reparar_bd()
CACHE_DURATION = 300  # 5 minutos para cache

class Metrics:
    def __init__(self):
        self.requests_count = 0
        self.successful_requests = 0
        self.failed_requests = 0
        self.gemini_calls = 0
        self.search_queries = 0
        self.start_time = time.time()
    
    def increment_requests(self): self.requests_count += 1
    def increment_success(self): self.successful_requests += 1
    def increment_failures(self): self.failed_requests += 1
    def increment_gemini_calls(self): self.gemini_calls += 1
    def increment_searches(self): self.search_queries += 1
    def get_uptime(self): return time.time() - self.start_time

metrics = Metrics()

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🔄 Iniciando ciclo de vida de la aplicación...")
    initialize_databases()
    yield
    print("✅ Finalizando ciclo de vida de la aplicación.")

# ✅ APP PRINCIPAL
app = FastAPI(
    lifespan=lifespan,
    title="Dante Propiedades API",
    description="Backend para procesamiento de consultas y filtros de propiedades con IA.",
    version="1.1.0"
)

# Definir los orígenes permitidos para CORS
origins = [
    # Orígenes de desarrollo
    "http://localhost",
    "http://localhost:8000",
    "http://127.0.0.1",
    "http://127.0.0.1:8000",
    # Orígenes de producción
    "https://artarona.github.io",
    "https://dantepropiedades.com.ar",
    "https://www.dantepropiedades.com.ar",
    "http://dantepropiedades.com.ar",
    "http://www.dantepropiedades.com.ar",
    "https://pagina-web-g82d.onrender.com",
    "https://*.onrender.com",
    # Permitir cualquier origen para desarrollo (temporal)
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Servir archivos estáticos de la carpeta 'imgs' (solo si existe)
import os as _os
if _os.path.exists("imgs"):
    app.mount("/imgs", StaticFiles(directory="imgs"), name="images")

# ✅ CACHE
query_cache = {}

def get_cache_key(filters: Dict[str, Any]) -> str:
    return json.dumps(filters, sort_keys=True)

def cache_query_results(filters: Dict[str, Any], results: List[Dict]):
    cache_key = get_cache_key(filters)
    query_cache[cache_key] = {'results': results, 'timestamp': time.time()}

def get_cached_results(filters: Dict[str, Any]) -> Optional[List[Dict]]:
    cache_key = get_cache_key(filters)
    cached = query_cache.get(cache_key)
    if cached and (time.time() - cached['timestamp']) < CACHE_DURATION:
        return cached['results']
    return None

@lru_cache(maxsize=100)
def query_properties_cached(filters_json: str):
    filters = json.loads(filters_json) if filters_json else {}
    return query_properties(filters)

# ✅ MODELOS DE DATOS
class PropertyResponse(BaseModel):
    id_temporal: str
    titulo: str
    barrio: str
    precio: float
    ambientes: int
    metros_cuadrados: float
    descripcion: str
    operacion: str
    tipo: str
    direccion: Optional[str] = None
    antiguedad: Optional[int] = None
    estado: Optional[str] = None
    orientacion: Optional[str] = None
    expensas: Optional[float] = None
    amenities: Optional[str] = None
    cochera: Optional[str] = None
    balcon: Optional[str] = None
    pileta: Optional[str] = None
    acepta_mascotas: Optional[str] = None
    aire_acondicionado: Optional[str] = None
    info_multimedia: Optional[str] = None
    documentos: Optional[List[str]] = None
    videos: Optional[List[str]] = None
    fotos: Optional[List[str]] = None
    moneda_precio: Optional[str] = None
    moneda_expensas: Optional[str] = None
    fecha_procesamiento: Optional[str] = None

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    channel: str = Field(default="web")
    filters: Optional[Dict[str, Any]] = None
    contexto_anterior: Optional[Dict[str, Any]] = None
    es_seguimiento: Optional[bool] = False

class ChatResponse(BaseModel):
    response: str
    results_count: Optional[int] = None
    search_performed: bool
    propiedades: Optional[List[PropertyResponse]] = None

# ========================================
# MODELOS PARA ANÁLISIS DE MERCADO
# ========================================

class MarketAnalysisRequest(BaseModel):
    barrio: str = Field(..., min_length=1, max_length=100)
    search_results: Optional[List[Dict[str, Any]]] = None

class PropertyComparisonRequest(BaseModel):
    propiedad_id: Optional[str] = None
    propiedad: Optional[Dict[str, Any]] = None

class MarketAnalysisResponse(BaseModel):
    precio_m2_promedio: Optional[float] = None
    precio_m2_min: Optional[float] = None
    precio_m2_max: Optional[float] = None
    rango_precios_propiedades: Optional[str] = None
    caracteristicas_zona: List[str] = []
    tendencias: Dict[str, Any] = {}
    conectividad: Dict[str, Any] = {}
    amenities_proximos: List[str] = []
    analisis_oportunidad: Dict[str, Any] = {}
    nota_analista: str = ""
    fuentes_procesadas: int = 0
    barrio: str = ""

class PropertyComparisonResponse(BaseModel):
    virtudes: List[Dict[str, Any]] = []
    score_oportunidad: int = 0
    texto_persuasivo: str = ""
    llamada_accion: str = ""

# ========================================
# PROMPTS ESPECIALIZADOS PARA ANÁLISIS
# ========================================

MARKET_ANALYSIS_PROMPT = """
Eres un experto analista inmobiliario argentino. Vas a analizar datos del mercado inmobiliario de una zona específica.

## TAREA
Procesa los siguientes resultados de búsqueda sobre propiedades en {barrio} y extrae información estructurada y precisa.

## RESULTADOS DE BÚSQUEDA
{search_results}

## INSTRUCCIONES
1. Extrae SOLO información que aparezca explícitamente en los textos
2. Si no encuentras un dato, usa null
3. Todos los precios deben ser en PESOS ARGENTINOS por metro cuadrado (ARS/m²)
4. Convierte cualquier precio expresado en USD a ARS usando tasa aproximada de 1000 ARS = 1 USD

## FORMATO DE RESPUESTA (JSON EXACTO, SIN TEXTO EXTRA)

{{
    "precio_m2_promedio": NUMERO_O_NULL,
    "precio_m2_min": NUMERO_O_NULL,
    "precio_m2_max": NUMERO_O_NULL,
    "rango_precios_propiedades": "string descriptivo o null",
    "caracteristicas_zona": ["caracteristica1", "caracteristica2"],
    "tendencias": {{
        "direccion": "subiendo|bajando|estable|null",
        "descripcion": "texto explicativo o null"
    }},
    "conectividad": {{
        "transporte": "string o null",
        "accesibilidad": "string o null"
    }},
    "amenities_proximos": ["amenity1", "amenity2"],
    "analisis_oportunidad": {{
        "es_oportunidad": true/false,
        "factores": ["factor1", "factor2"],
        "recomendacion": "texto breve"
    }},
    "nota_analista": "texto explicando cómo se obtuvo cada dato",
    "fuentes_procesadas": NUMERO
}}

## REGLAS ESTRICTAS
- No inventes datos que no estén en los textos
- Si un precio es "aproximado", usa el valor dado
- Las características deben ser verificables en los textos
- La recomendación debe ser objetiva basada en los datos
"""

PROPERTY_COMPARISON_PROMPT = """
Eres un experto en ventas inmobiliarias. Genera un análisis persuasivo comparando una propiedad específica con el mercado.

## DATOS DE LA PROPIEDAD
{datos_propiedad}

## DATOS DEL MERCADO
{datos_mercado}

## TAREA
Genera un análisis que destaque las virtudes de la propiedad comparado con el mercado real.

## FORMATO DE RESPUESTA (JSON EXACTO)

{{
    "virtudes": [
        {{
            "tipo": "precio|espacio|ubicacion|estado|zona",
            "icono": "emoji_representativo",
            "titulo": "título corto y atractivo",
            "dato_objetivo": "dato numérico o porcentual",
            "beneficio_emocional": "texto que conecte el dato con la vida del comprador",
            "persuasion_score": NUMERO_1_A_10
        }}
    ],
    "score_oportunidad": NUMERO_1_A_10,
    "texto_persuasivo": "párrafo de 2-3 oraciones que resuma por qué esta propiedad es una buena oportunidad",
    "llamada_accion": "oración que motive al comprador a actuar"
}}

## REGLAS
- Las virtudes deben estar respaldadas por datos objetivos
- El beneficio emocional debe ser realista y alcanzable
- El score debe reflejar genuinamente la oportunidad
- No exagerar ni hacer promesas falsas
"""

# ========================================
# FUNCIONES DE ANÁLISIS DE MERCADO
# ========================================

def analizar_mercado_inmobiliario(barrio: str, search_results: List[Dict]) -> Dict[str, Any]:
    """
    Analiza datos del mercado inmobiliario usando Gemini AI
    """
    print(f"📊 Analizando mercado para: {barrio}")
    print(f"📄 Procesando {len(search_results)} resultados de búsqueda...")
    
    # Combinar todos los textos de resultados
    combined_text = ""
    for i, result in enumerate(search_results, 1):
        combined_text += f"\n--- RESULTADO {i} ---\n"
        combined_text += f"URL: {result.get('url', 'N/A')}\n"
        combined_text += f"TITULO: {result.get('title', 'N/A')}\n"
        if result.get('content'):
            contenido = result['content'][:2000] if len(result.get('content', '')) > 2000 else result['content']
            combined_text += f"CONTENIDO: {contenido}\n"
    
    # Construir prompt
    prompt = MARKET_ANALYSIS_PROMPT.format(
        barrio=barrio,
        search_results=combined_text
    )
    
    print("🤖 Enviando a Gemini para análisis de mercado...")
    
    # Llamar a Gemini
    response = call_gemini_with_rotation(prompt)
    
    # Parsear respuesta JSON
    try:
        clean_response = response.strip()
        if clean_response.startswith('```json'):
            clean_response = clean_response[7:]
        if clean_response.startswith('```'):
            clean_response = clean_response[3:]
        if clean_response.endswith('```'):
            clean_response = clean_response[:-3]
        
        analisis = json.loads(clean_response)
        analisis['fuentes_procesadas'] = len(search_results)
        analisis['barrio'] = barrio
        
        print(f"✅ Análisis de mercado completado")
        
        return {
            'success': True,
            'data': analisis,
            'raw_response': response
        }
        
    except json.JSONDecodeError as e:
        print(f"❌ Error parseando JSON: {e}")
        return {
            'success': False,
            'error': 'Error al procesar respuesta de IA',
            'details': str(e)
        }


def generar_comparacion_propiedad(propiedad: Dict, mercado: Dict) -> Dict[str, Any]:
    """
    Genera análisis comparativo persuasivo de una propiedad vs el mercado
    """
    print(f"📈 Generando comparación para: {propiedad.get('direccion', 'Unknown')}")
    
    # Preparar datos de la propiedad
    precio = propiedad.get('precio', 0)
    metros = propiedad.get('metros_cuadrados', 1)
    precio_m2 = precio / max(metros, 1)
    
    datos_propiedad = {
        'direccion': propiedad.get('direccion', ''),
        'barrio': propiedad.get('barrio', ''),
        'tipo': propiedad.get('tipo', ''),
        'precio': precio,
        'metros_cuadrados': metros,
        'precio_m2': round(precio_m2, 2),
        'ambientes': propiedad.get('ambientes', 0),
        'estado': propiedad.get('estado', ''),
        'moneda': propiedad.get('moneda_precio', 'ARS')
    }
    
    datos_mercado = {
        'precio_m2_promedio': mercado.get('precio_m2_promedio'),
        'precio_m2_min': mercado.get('precio_m2_min'),
        'precio_m2_max': mercado.get('precio_m2_max'),
        'caracteristicas_zona': mercado.get('caracteristicas_zona', []),
        'tendencias': mercado.get('tendencias', {}),
        'amenities_proximos': mercado.get('amenities_proximos', [])
    }
    
    # Construir prompt
    prompt = PROPERTY_COMPARISON_PROMPT.format(
        datos_propiedad=json.dumps(datos_propiedad, indent=2, ensure_ascii=False),
        datos_mercado=json.dumps(datos_mercado, indent=2, ensure_ascii=False)
    )
    
    print("🤖 Generando comparación con Gemini...")
    
    # Llamar a Gemini
    response = call_gemini_with_rotation(prompt)
    
    # Parsear respuesta
    try:
        clean_response = response.strip()
        if clean_response.startswith('```json'):
            clean_response = clean_response[7:]
        if clean_response.startswith('```'):
            clean_response = clean_response[3:]
        if clean_response.endswith('```'):
            clean_response = clean_response[:-3]
        
        comparacion = json.loads(clean_response)
        
        print(f"✅ Comparación generada: {len(comparacion.get('virtudes', []))} virtudes identificadas")
        
        return {
            'success': True,
            'data': comparacion,
            'raw_response': response
        }
        
    except json.JSONDecodeError as e:
        print(f"❌ Error parseando comparación: {e}")
        return {
            'success': False,
            'error': 'Error al generar comparacion',
            'details': str(e)
        }

# ✅ ENDPOINTS
@app.get("/")
def root():
    return FileResponse("index.html")

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    start_time = time.time()
    metrics.increment_requests()
    
    try:
        user_text = request.message.strip()
        if not user_text:
            raise HTTPException(status_code=400, detail="El mensaje no puede estar vacío")

        channel = request.channel.strip()
        filters_from_frontend = request.filters or {}
        contexto_anterior = request.contexto_anterior
        es_seguimiento = request.es_seguimiento

        text_lower = user_text.lower()
        filters = filters_from_frontend.copy()
        detected_filters = detect_filters(text_lower)
        filters.update(detected_filters)

        # ✅ AGREGAR DIAGNÓSTICO AQUÍ
        print(f"🎯 CONSULTA USUARIO: '{user_text}'")
        print(f"🔍 FILTROS DETECTADOS: {detected_filters}")
        print(f"🔍 FILTROS FRONTEND: {filters_from_frontend}")
        print(f"🔍 FILTROS COMBINADOS: {filters}")

        results = None
        search_performed = False
        
        if filters:
            search_performed = True
            metrics.increment_searches()
            results = query_properties(filters)
            print(f"📊 RESULTADOS OBTENIDOS: {len(results) if results else 0} propiedades")

        historial = get_historial_canal(channel)
        contexto_historial = "\nHistorial reciente:\n" + "\n".join(f"- {m}" for m in historial) if historial else ""
        
        contexto_dinamico = (
            f"Barrios disponibles: {', '.join(BARRIOS)}.\n"
            f"Tipos de propiedad: {', '.join(TIPOS)}.\n"
            f"Operaciones disponibles: {', '.join(OPERACIONES)}."
        )

        style_hint = "Respondé de forma breve, directa y cálida como si fuera un mensaje de WhatsApp." if channel == "whatsapp" else "Respondé de forma explicativa, profesional y cálida como si fuera una consulta web."
        
        # ✅ EVITAR DOBLE BIENVENIDA - Detectar si es un saludo inicial
        palabras_bienvenida = ['hola', 'hi', 'hello', 'buenas', 'empezar', 'inicio', 'ayuda']
        es_saludo_inicial = any(palabra in text_lower for palabra in palabras_bienvenida) and not contexto_anterior

        if es_saludo_inicial:
            print("🎯 DETECTADO: Saludo inicial - enviando bienvenida mejorada")
            answer = """¡Hola! 👋 Soy tu asistente de Dante Propiedades. 

        Te ayudo a encontrar la propiedad ideal. Podés:
        • Usar los filtros a la izquierda para búsquedas específicas
        • Contarme directamente qué estás buscando
        • Preguntarme sobre propiedades que veas

        ¿En qué tipo de propiedad estás interesado hoy?"""
        else:
            # Procesamiento normal con IA
            prompt = build_prompt(user_text, results, filters, channel, f"{style_hint}\n{contexto_dinamico}\n{contexto_historial}")
            metrics.increment_gemini_calls()
            answer = call_gemini_with_rotation(prompt)
            
            # ✅ NUEVA MODIFICACIÓN: Limpiar respuesta cuando hay resultados
            if results and len(results) > 0:
                print("🎯 DETECTADO: Hay resultados - limpiando duplicación en respuesta")
                
                # Eliminar listados numerados de propiedades del texto
                lines = answer.split('\n')
                clean_lines = []
                skip_next_lines = False
                
                for i, line in enumerate(lines):
                    line_stripped = line.strip()
                    
                    # Detectar inicio de listado (líneas que empiezan con número)
                    if (line_stripped and 
                        (line_stripped[0].isdigit() and 
                         ('.' in line_stripped or ')' in line_stripped or '🏠' in line_stripped or '📍' in line_stripped))):
                        skip_next_lines = True
                        continue
                    
                    # Detectar líneas con emojis de propiedades que deben omitirse
                    if any(emoji in line for emoji in ['🏠', '📍', '💰', '📋', '💬']):
                        continue
                        
                    # Si estamos en modo salto, buscar dónde termina el listado
                    if skip_next_lines:
                        if line_stripped == "" or i == len(lines) - 1:
                            skip_next_lines = False
                        continue
                    
                    clean_lines.append(line)
                
                # Reconstruir la respuesta
                answer = '\n'.join(clean_lines).strip()
                
                # Si la respuesta quedó muy corta, usar un mensaje genérico
                if not answer or len(answer) < 20:
                    answer = f"✅ Encontré {len(results)} propiedades que coinciden con tu búsqueda. Te las muestro abajo:"
                else:
                    # Asegurar que termine con indicación de ver propiedades
                    if "propiedad" not in answer.lower() and "encontré" not in answer.lower():
                        answer += f"\n\n📊 **Encontré {len(results)} propiedades** - Te las muestro en detalle abajo 👇"
        
        response_time = time.time() - start_time
        log_conversation(user_text, answer, channel, response_time, search_performed, len(results) if results else 0)
        metrics.increment_success()
        
        # ✅ AGREGAR DIAGNÓSTICO DE RESPUESTA AQUÍ
        response_data = ChatResponse(
            response=answer,
            results_count=len(results) if results is not None else None,
            search_performed=search_performed,
            propiedades=results
        )
        
        print(f"📤 ENVIANDO RESPUESTA AL FRONTEND:")
        print(f"   📝 Respuesta: {answer[:100]}...")
        print(f"   📊 Resultados: {len(results) if results else 0} propiedades")
        print(f"   🔍 Búsqueda realizada: {search_performed}")
        if results:
            for i, prop in enumerate(results[:2]):
                print(f"   🏠 Prop {i+1}: {prop['titulo']} - {prop['operacion']}")
        
        return response_data
    
    except Exception as e:
        metrics.increment_failures()
        print(f"❌ ERROR en endpoint /chat: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail="Ocurrió un error procesando tu consulta.")

@app.get("/filters")
def get_all_filters():
    """Endpoint para obtener filtros estáticos desde filter_data."""
    return {
        "operaciones": OPERACIONES,
        "tipos": TIPOS,
        "barrios": BARRIOS
    }

@app.get("/properties/filter-options")
def get_filter_options():
    """Endpoint para obtener opciones de filtros (alias de /filters para compatibilidad)."""
    return {
        "operaciones": OPERACIONES,
        "tipos": TIPOS,
        "barrios": BARRIOS,
        "estado": ["A Estrenar", "Excelente", "Muy Bueno", "Bueno", "Regular"],
        "orientacion": ["Norte", "Sur", "Este", "Oeste", "Noreste", "Noroeste", "Sureste", "Suroeste"],
        "moneda": ["USD", "ARS"]
    }

@app.get("/properties", response_model=List[PropertyResponse])
def get_properties_endpoint(
    neighborhood: Optional[str] = None, min_price: Optional[float] = None, max_price: Optional[float] = None,
    min_rooms: Optional[int] = None, operacion: Optional[str] = None, tipo: Optional[str] = None,
    min_sqm: Optional[float] = None, max_sqm: Optional[float] = None, limit: int = 20
):
    filters = {k: v for k, v in locals().items() if v is not None and k != 'limit'}
    results = query_properties(filters)
    print(f"📊 RESULTADOS OBTENIDOS: {len(results) if results else 0} propiedades")
    return results[:limit]

@app.get("/status")
def status():
    return {
        "status": "activo",
        "uptime_seconds": metrics.get_uptime(),
        "total_requests": metrics.requests_count,
        "gemini_calls": metrics.gemini_calls,
        "search_queries": metrics.search_queries
    }


@app.get("/debug-images")
def debug_images():
    """Endpoint para verificar qué imágenes están disponibles"""
    import os
    try:
        if os.path.exists("imgs"):
            image_files = os.listdir("imgs")
            return {
                "message": "Carpeta imgs encontrada",
                "path_absoluto": os.path.abspath("imgs"),
                "total_images": len(image_files),
                "images": sorted(image_files)[:20]  # Primeras 20 imágenes ordenadas
            }
        else:
            return {"error": "Carpeta 'imgs' no encontrada en el servidor"}
    except Exception as e:
        return {"error": f"Error al leer carpeta: {str(e)}"}


# ========================================
# ENDPOINTS DE ANÁLISIS DE MERCADO
# ========================================

@app.post("/market/analysis")
def market_analysis(request: MarketAnalysisRequest):
    """
    Analiza el mercado inmobiliario de un barrio específico.
    
    Uso:
    - Envía el nombre del barrio
    - Opcionalmente envía resultados de búsqueda web para contexto
    """
    print(f"📊 Endpoint: Análisis de mercado para {request.barrio}")
    
    # Si no hay resultados de búsqueda, usar datos de la base de datos local
    if not request.search_results:
        # Obtener propiedades del barrio para análisis básico
        propiedades = query_properties({"barrio": request.barrio})
        
        # Generar contexto básico desde propiedades locales
        search_results = []
        for prop in propiedades[:10]:  # Usar hasta 10 propiedades
            search_results.append({
                "url": f"propiedad/{prop.get('id_temporal', '')}",
                "title": f"{prop.get('tipo', '')} en {prop.get('direccion', '')}",
                "content": f"""
                Precio: {prop.get('precio', 0)} {prop.get('moneda_precio', 'ARS')}
                Metros cuadrados: {prop.get('metros_cuadrados', 0)} m²
                Tipo: {prop.get('tipo', '')}
                Operación: {prop.get('operacion', '')}
                Barrio: {prop.get('barrio', '')}
                Ambientes: {prop.get('ambientes', 0)}
                Estado: {prop.get('estado', '')}
                Descripción: {prop.get('descripcion', '')}
                """
            })
        
        print(f"📊 Usando {len(search_results)} propiedades locales para análisis")
    
    # Si hay search_results del frontend, usarlos directamente
    elif isinstance(request.search_results, list):
        search_results = request.search_results
        print(f"📊 Usando {len(search_results)} resultados de búsqueda del frontend")
    
    else:
        search_results = []
    
    # Realizar análisis
    resultado = analizar_mercado_inmobiliario(request.barrio, search_results)
    
    if resultado['success']:
        return {
            "success": True,
            "barrio": request.barrio,
            "analysis": resultado['data']
        }
    else:
        raise HTTPException(status_code=500, detail=resultado.get('error', 'Error en análisis'))


@app.post("/market/comparison")
def property_comparison(request: PropertyComparisonRequest):
    """
    Genera análisis comparativo de una propiedad vs el mercado.
    
    Uso:
    - Envía el ID de una propiedad O los datos directamente
    - El sistema analiza la propiedad vs el mercado de su barrio
    """
    # Obtener datos de la propiedad
    if request.propiedad_id:
        # Buscar en la base de datos
        propiedades = query_properties({"id_temporal": request.propiedad_id})
        if not propiedades:
            raise HTTPException(status_code=404, detail="Propiedad no encontrada")
        propiedad = propiedades[0]
    elif request.propiedad:
        propiedad = request.propiedad
    else:
        raise HTTPException(status_code=400, detail="Se requiere propiedad_id o propiedad")
    
    barrio = propiedad.get('barrio', '')
    
    # Primero obtener análisis del mercado del barrio
    propiedades_barrio = query_properties({"barrio": barrio})
    
    # Generar contexto del mercado desde propiedades locales
    mercado_data = {
        "precio_m2_promedio": None,
        "precio_m2_min": None,
        "precio_m2_max": None,
        "caracteristicas_zona": [barrio],
        "tendencias": {"direccion": "estable", "descripcion": "Datos del mercado local"},
        "amenities_proximos": []
    }
    
    if propiedades_barrio:
        precios_m2 = []
        for prop in propiedades_barrio:
            precio = prop.get('precio', 0)
            metros = prop.get('metros_cuadrados', 1)
            if metros > 0:
                precio_m2 = precio / metros
                precios_m2.append(precio_m2)
        
        if precios_m2:
            mercado_data["precio_m2_promedio"] = sum(precios_m2) / len(precios_m2)
            mercado_data["precio_m2_min"] = min(precios_m2)
            mercado_data["precio_m2_max"] = max(precios_m2)
    
    # Generar comparación
    resultado = generar_comparacion_propiedad(propiedad, mercado_data)
    
    if resultado['success']:
        return {
            "success": True,
            "propiedad": {
                "id": propiedad.get('id_temporal'),
                "direccion": propiedad.get('direccion'),
                "barrio": propiedad.get('barrio'),
                "precio": propiedad.get('precio'),
                "metros": propiedad.get('metros_cuadrados')
            },
            "comparacion": resultado['data']
        }
    else:
        raise HTTPException(status_code=500, detail=resultado.get('error', 'Error en comparación'))


# ========================================
# ENDPOINTS DE SCRAPING DE MERCADO
# ========================================

@app.get("/market/scraping")
def scrape_market_data(
    zone: str = Query(..., description="Barrio o zona a analizar (ej: palermo, microcentro)"),
    operation: str = Query("venta", description="Tipo de operación: venta o alquiler"),
    property_type: str = Query("departamento", description="Tipo de propiedad")
):
    """
    Obtiene datos del mercado inmobiliario mediante scraping de portales (Zonaprop, Argenprop)
    
    Uso:
    - GET /market/scraping?zone=palermo
    - GET /market/scraping?zone=belgrano&operation=venta&property_type=casa
    
    Este endpoint extrae propiedades reales de portales inmobiliarios argentinos
    y calcula estadísticas del mercado.
    """
    if not SCRAPER_AVAILABLE:
        raise HTTPException(
            status_code=503, 
            detail="Módulo de scraping no disponible. Verificar instalación de dependencias."
        )
    
    print(f"📊 Solicitud de scraping: zone={zone}, op={operation}, type={property_type}")
    
    try:
        scraping_manager = ScrapingManager()
        result = scraping_manager.scrape_market(zone, operation, property_type)
        
        if result.get('sample_size', 0) == 0:
            return {
                "success": False,
                "message": "No se pudieron obtener datos del mercado",
                "zone": zone,
                "errors": result.get('errors', [])
            }
        
        return {
            "success": True,
            "message": f"Analizadas {result['sample_size']} propiedades de {result.get('source_breakdown', {})}",
            "zone": zone,
            "data": result
        }
        
    except Exception as e:
        print(f"❌ Error en scraping: {e}")
        raise HTTPException(status_code=500, detail=f"Error en scraping: {str(e)}")


@app.get("/market/stats/{zone}")
def get_market_stats(
    zone: str,
    operation: str = "venta",
    property_type: str = "departamento"
):
    """
    Obtiene estadísticas resumidas del mercado para una zona
    
    Uso:
    - GET /market/stats/palermo
    - GET /market/stats/belgrano?operation=alquiler&property_type=casa
    """
    if not SCRAPER_AVAILABLE:
        raise HTTPException(status_code=503, detail="Módulo de scraping no disponible")
    
    try:
        scraping_manager = ScrapingManager()
        result = scraping_manager.scrape_market(zone, operation, property_type)
        
        # Resumen condensado
        return {
            "zone": zone,
            "sample_size": result['sample_size'],
            "statistics": {
                "average_price_m2": result['statistics']['average_price_per_m2'],
                "median_price_m2": result['statistics']['median_price_per_m2'],
                "min_price_m2": result['statistics']['min_price_per_m2'],
                "max_price_m2": result['statistics']['max_price_per_m2'],
                "price_range_total": result['statistics']['price_range_total']
            },
            "sources": result['source_breakdown'],
            "currencies": result['currency_distribution'],
            "analysis_timestamp": result.get('analysis_timestamp', '')
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/market/comparative/{zone}")
def get_comparative_analysis(zone: str):
    """
    Obtiene análisis comparativo completo del mercado para una zona
    
    Combina scraping de portales con análisis de IA
    """
    if not SCRAPER_AVAILABLE:
        raise HTTPException(status_code=503, detail="Módulo de scraping no disponible")
    
    try:
        scraping_manager = ScrapingManager()
        result = scraping_manager.scrape_market(zone, "venta", "departamento")
        
        if result.get('sample_size', 0) == 0:
            return {
                "success": False,
                "message": "No hay datos disponibles para esta zona"
            }
        
        # Generar análisis con IA si hay suficientes datos
        analysis = {}
        if result['sample_size'] >= 5:
            try:
                # Preparar datos para IA
                market_summary = f"""
                Zona: {zone}
                Muestra: {result['sample_size']} propiedades
                Precio m² promedio: {result['statistics']['average_price_per_m2']}
                Precio m² mediana: {result['statistics']['median_price_per_m2']}
                Rango de precios: {result['statistics']['price_range_total']}
                Fuentes: {result['source_breakdown']}
                """
                
                prompt = f"""
                Eres un analista inmobiliario argentino. Genera un breve análisis del mercado basado en estos datos:

                {market_summary}

                Tu análisis debe incluir:
                1. Breve resumen de la situación del mercado
                2. Una observación sobre el precio por m²
                3. Recomendación general para compradores

                Responde en formato JSON con keys: summary, price_obs, recommendation
                """
                
                ai_response = call_gemini_with_rotation(prompt)
                
                # Intentar parsear respuesta
                try:
                    import re
                    json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
                    if json_match:
                        analysis = json.loads(json_match.group())
                except:
                    analysis = {"raw_analysis": ai_response[:500]}
                    
            except Exception as ai_error:
                print(f"⚠️ Error generando análisis IA: {ai_error}")
        
        return {
            "success": True,
            "zone": zone,
            "market_data": result,
            "ai_analysis": analysis
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ✅ INICIO
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main-ai:app", host="0.0.0.0", port=port, reload=False)  # reload=False en producción