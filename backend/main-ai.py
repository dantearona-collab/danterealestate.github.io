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
from pathlib import Path
import sqlite3
from datetime import datetime

# ✅ CARGAR VARIABLES DE ENTORNO DESDE .env
try:
    from dotenv import load_dotenv
    # Buscar archivo .env en la misma carpeta que main-ai.py
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
    if os.path.exists(env_path):
        load_dotenv(env_path)
        print("✅ Variables de entorno cargadas desde .env")
    else:
        print("⚠️ Archivo .env no encontrado, usando variables del sistema")
except ImportError:
    print("⚠️ python-dotenv no instalado, usando variables del sistema")

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
from logic.environ_database import init_environ_analysis_db, get_environ_analysis, save_environ_analysis, is_environ_analysis_expired, log_environ_analysis_request
from logic.filters import detect_filters
from logic.gemini_client import call_gemini_with_rotation, build_prompt
from logic.filter_data import BARRIOS, OPERACIONES, TIPOS
from logic.barrio_data import get_gastronomy_info, get_financial_info
from logic.environ_database import init_environ_analysis_db, get_environ_analysis, save_environ_analysis, is_environ_analysis_expired, log_environ_analysis_request

# ============================================
# INICIALIZACIÓN DE BASE DE DATOS DE BARRIOS (CMS)
# ============================================

BARRIOS_DB_PATH = os.environ.get('BARRIOS_DB_PATH', 'instance/barrios_data.db')

def get_barrios_db_connection():
    """Obtiene conexión a la base de datos de barrios"""
    Path(os.path.dirname(BARRIOS_DB_PATH)).mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(BARRIOS_DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_barrios_db():
    """Inicializa la tabla de barrios si no existe"""
    conn = get_barrios_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS barrios_data (
            nombre TEXT PRIMARY KEY,
            data TEXT NOT NULL,
            actualizado_por TEXT DEFAULT 'admin',
            fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()
    print("✅ Tabla barrios_data inicializada")

from logic.barrio_data import get_gastronomy_info, get_financial_info, GASTRONOMY_DATA, FINANCIAL_DATA, get_location_specific_info, LOCATION_SPECIFIC_DATA
from logic.environ_database import init_environ_analysis_db, get_environ_analysis, save_environ_analysis, is_environ_analysis_expired, log_environ_analysis_request

# ============================================
# FUNCIÓN DE MIGRACIÓN DE DATOS ESTÁTICOS
# ============================================

def migrar_datos_estaticos_a_db(solo_ejecutar_una_vez: bool = True, forzar: bool = False):
    """
    Migra los datos estáticos de barrio_data.py a la base de datos barrios_data.db.
    
    Esta función:
    1. Lee los datos de GASTRONOMY_DATA y FINANCIAL_DATA de barrio_data.py
    2. Los transforma al formato del CMS
    3. Los inserta en la base de datos (solo si no existen o si se fuerza)
    
    Args:
        solo_ejecutar_una_vez: Si True, solo ejecuta si no hay registros migrados previamente
        forzar: Si True, sobrescribe datos existentes
    
    Returns:
        dict con estadísticas de la migración
    """
    import os
    
    # Verificar flag de migración ya ejecutada
    migration_flag_file = os.path.join(os.path.dirname(BARRIOS_DB_PATH), '.migracion_estatica_completa')
    
    if solo_ejecutar_una_vez and os.path.exists(migration_flag_file) and not forzar:
        print("✅ Migración ya ejecutada previamente. Saltando...")
        return {
            "success": True,
            "message": "Migración ya completada anteriormente",
            "skiped": True
        }
    
    print("🔄 INICIANDO MIGRACIÓN DE DATOS ESTÁTICOS A BASE DE DATOS")
    print("=" * 60)
    
    conn = get_barrios_db_connection()
    cursor = conn.cursor()
    
    # Contadores
    migrados = 0
    existentes = 0
    errores = 0
    barrios_procesados = set()
    
    # Combinar todas las claves de ambos diccionarios
    todos_barrios = set(GASTRONOMY_DATA.keys()) | set(FINANCIAL_DATA.keys()) | set(LOCATION_SPECIFIC_DATA.keys())
    
    print(f"📊 Barrios a procesar: {len(todos_barrios)}")
    print(f"   - De GASTRONOMY_DATA: {len(GASTRONOMY_DATA)}")
    print(f"   - De FINANCIAL_DATA: {len(FINANCIAL_DATA)}")
    print(f"   - De LOCATION_SPECIFIC_DATA: {len(LOCATION_SPECIFIC_DATA)}")
    print(f"   - Únicos: {len(todos_barrios)}")
    
    for barrio_nombre in sorted(todos_barrios):
        try:
            # Verificar si ya existe en la base de datos
            cursor.execute('SELECT nombre, data FROM barrios_data WHERE nombre = ?', (barrio_nombre,))
            row = cursor.fetchone()
            
            if row and not forzar:
                print(f"   ⏭️  Saltando '{barrio_nombre}' (ya existe)")
                existentes += 1
                continue
            
            # Obtener datos de gastronomía
            gastro_data = GASTRONOMY_DATA.get(barrio_nombre, {})
            financial_data = FINANCIAL_DATA.get(barrio_nombre, {})
            location_data = LOCATION_SPECIFIC_DATA.get(barrio_nombre, {})
            
            # Si no hay datos de ninguno, skip
            if not gastro_data and not financial_data and not location_data:
                print(f"   ⚠️  Sin datos para '{barrio_nombre}'")
                continue
            
            # Construir estructura de datos para el CMS
            data = _construir_data_cms(barrio_nombre, gastro_data, financial_data, location_data)
            
            # Guardar en base de datos
            data_json = json.dumps(data, ensure_ascii=False, indent=2)
            actualizado_por = 'migracion_estatica'
            
            if row:
                # Actualizar existente
                cursor.execute('''
                    UPDATE barrios_data 
                    SET data = ?, actualizado_por = ?, fecha_actualizacion = CURRENT_TIMESTAMP
                    WHERE nombre = ?
                ''', (data_json, actualizado_por, barrio_nombre))
                print(f"   🔄 Actualizado: '{barrio_nombre}'")
            else:
                # Insertar nuevo
                cursor.execute('''
                    INSERT INTO barrios_data (nombre, data, actualizado_por)
                    VALUES (?, ?, ?)
                ''', (barrio_nombre, data_json, actualizado_por))
                print(f"   ✅ Insertado: '{barrio_nombre}'")
            
            migrados += 1
            barrios_procesados.add(barrio_nombre)
            
        except Exception as e:
            print(f"   ❌ Error procesando '{barrio_nombre}': {e}")
            errores += 1
    
    conn.commit()
    
    # Crear flag de migración completada
    if migrados > 0 or existentes > 0:
        with open(migration_flag_file, 'w') as f:
            f.write(f"Migración completada: {datetime.now().isoformat()}\n")
            f.write(f"Migrados: {migrados}\n")
            f.write(f"Existentes: {existentes}\n")
            f.write(f"Barrios: {', '.join(sorted(barrios_procesados))}\n")
    
    conn.close()
    
    print("=" * 60)
    print(f"📈 RESUMEN DE MIGRACIÓN:")
    print(f"   - Nuevos: {migrados}")
    print(f"   - Existentes (saltados): {existentes}")
    print(f"   - Errores: {errores}")
    print(f"   - Total procesados: {len(barrios_procesados)}")
    
    return {
        "success": True,
        "message": "Migración completada",
        "migrados": migrados,
        "existentes": existentes,
        "errores": errores,
        "barrios": sorted(list(barrios_procesados))
    }


def _construir_data_cms(nombre: str, gastro_data: dict, financial_data: dict, location_specific_data: dict = None) -> dict:
    """
    Construye la estructura de datos completa para el CMS
    combinando datos de gastronomía, servicios financieros y datos específicos de ubicación.
    
    La estructura generada es compatible con analisis-barrio.js:
    - categorias: {transporte, comercio, seguridad, educacion, salud, espacios_verdes, contaminacion, vida_barrio, servicios_financieros}
    
    Args:
        nombre: Nombre del barrio
        gastro_data: Datos de gastronomía (de GASTRONOMY_DATA)
        financial_data: Datos financieros (de FINANCIAL_DATA)
        location_specific_data: Datos específicos de ubicación (de LOCATION_SPECIFIC_DATA)
    """
    # Calcular puntuación general basada en los datos disponibles
    puntuaciones = []
    if gastro_data and gastro_data.get('puntuacion'):
        puntuaciones.append(gastro_data['puntuacion'])
    if financial_data and financial_data.get('puntuacion'):
        puntuaciones.append(financial_data['puntuacion'])
    
    puntuacion_general = int(sum(puntuaciones) / len(puntuaciones)) if puntuaciones else 70
    
    # Reemplazar {location} con el nombre del barrio
    location_display = nombre.title()
    
    # Construir estructura de categorías - ESTA ES LA ESTRUCTURA QUE ESPERA EL FRONTEND
    categorias = {}
    
    # TRANSPORTE - desde LOCATION_SPECIFIC_DATA
    if location_specific_data:
        categorias['transporte'] = {
            'puntuacion': 70,
            'descripcion': location_specific_data.get('transporte', '').replace('{location}', location_display),
            'estaciones': [],
            'colectivos': []
        }
    else:
        categorias['transporte'] = {
            'puntuacion': 70,
            'descripcion': f'{location_display} cuenta con acceso a transporte público local.',
            'estaciones': [],
            'colectivos': []
        }
    
    # COMERCIO - desde LOCATION_SPECIFIC_DATA
    if location_specific_data:
        categorias['comercio'] = {
            'puntuacion': 75,
            'descripcion': location_specific_data.get('comercio', '').replace('{location}', location_display),
            'supermercados': [],
            'centros_comerciales': []
        }
    else:
        categorias['comercio'] = {
            'puntuacion': 75,
            'descripcion': f'{location_display} tiene comercios locales y servicios.',
            'supermercados': [],
            'centros_comerciales': []
        }
    
    # SEGURIDAD -默认值
    categorias['seguridad'] = {
        'puntuacion': 70,
        'descripcion': f'{location_display} tiene nivel de seguridad estándar para la zona.',
        'comisaria': ''
    }
    
    # EDUCACION - desde LOCATION_SPECIFIC_DATA
    if location_specific_data:
        categorias['educacion'] = {
            'puntuacion': 75,
            'descripcion': location_specific_data.get('educacion', '').replace('{location}', location_display),
            'escuelas': [],
            'universidades': []
        }
    else:
        categorias['educacion'] = {
            'puntuacion': 75,
            'descripcion': f'{location_display} tiene acceso a instituciones educativas.',
            'escuelas': [],
            'universidades': []
        }
    
    # SALUD - desde LOCATION_SPECIFIC_DATA
    if location_specific_data:
        categorias['salud'] = {
            'puntuacion': 75,
            'descripcion': location_specific_data.get('salud', '').replace('{location}', location_display),
            'hospitales': [],
            'centros_salud': []
        }
    else:
        categorias['salud'] = {
            'puntuacion': 75,
            'descripcion': f'{location_display} cuenta con servicios de salud cercanos.',
            'hospitales': [],
            'centros_salud': []
        }
    
    # ESPACIOS VERDES -默认值
    categorias['espacios_verdes'] = {
        'puntuacion': 65,
        'descripcion': f'{location_display} tiene áreas verdes disponibles.',
        'parques': []
    }
    
    # CONTAMINACIÓN -默认值
    categorias['contaminacion'] = {
        'puntuacion': 70,
        'descripcion': f'Nivel de contaminación moderado en {location_display}.',
        'nivel_ruido': 'Medio',
        'fuente': 'Tráfico urbano'
    }
    
    # VIDA BARRIO - desde GASTRONOMY_DATA (bares y cultura)
    if gastro_data:
        categorias['vida_barrio'] = {
            'puntuacion': gastro_data.get('puntuacion', 75),
            'descripcion': gastro_data.get('descripcion', ''),
            'bares': gastro_data.get('bares_notables', [])[:3],
            'cultura': gastro_data.get('zonas_gastronomicas', [])[:2]
        }
    else:
        categorias['vida_barrio'] = {
            'puntuacion': 75,
            'descripcion': f'{location_display} tiene vida social activa.',
            'bares': [],
            'cultura': []
        }
    
    # SERVICIOS FINANCIEROS - desde FINANCIAL_DATA
    if financial_data:
        # Combinar bancos de FINANCIAL_DATA
        bancos = financial_data.get('bancos', [])[:5]
        cajeros = financial_data.get('cajeros_automaticos', [])[:2]
        
        categorias['servicios_financieros'] = {
            'puntuacion': financial_data.get('puntuacion', 80),
            'descripcion': financial_data.get('descripcion', ''),
            'bancos': ', '.join(bancos) if isinstance(bancos, list) else str(bancos),
            'cajeros': ', '.join(cajeros) if isinstance(cajeros, list) else str(cajeros)
        }
    else:
        categorias['servicios_financieros'] = {
            'puntuacion': 80,
            'descripcion': f'{location_display} tiene acceso a servicios financieros.',
            'bancos': '',
            'cajeros': ''
        }
    
    # Construir conclusión basada en los datos
    conclusiones = []
    if gastro_data:
        conclusiones.append(f"gastronomía ({gastro_data.get('puntuacion', 'N/A')}/100)")
    if financial_data:
        conclusiones.append(f"servicios financieros ({financial_data.get('puntuacion', 'N/A')}/100)")
    if location_specific_data:
        conclusiones.append("datos específicos de ubicación")
    
    if conclusiones:
        conclusion = f"{location_display} presenta: " + ", ".join(conclusiones) + ". " + \
                    "Información recopilada de fuentes especializadas."
    else:
        conclusion = f"{location_display} - Análisis básico disponible. Se recomienda completar con datos actualizados."
    
    # Resumen general
    resumen_parts = []
    if gastro_data:
        resumen_parts.append(f"gastronomía destacada ({gastro_data.get('puntuacion', 50)}/100)")
    if financial_data:
        resumen_parts.append(f"servicios financieros completos ({financial_data.get('puntuacion', 50)}/100)")
    
    if resumen_parts:
        resumen = f"{location_display} es un barrio de Buenos Aires con " + \
                  " y ".join(resumen_parts) + "."
    else:
        resumen = f"{location_display} es un barrio de Buenos Aires con características únicas."
    
    return {
        'resumen_general': resumen,
        'puntuacion_general': puntuacion_general,
        'categorias': categorias,
        'conclusion': conclusion,
        '_migrado_desde': 'barrio_data.py',
        '_fecha_migracion': datetime.now().isoformat()
    }

# Inicializar base de datos de barrios
init_barrios_db()

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
    init_environ_analysis_db()  # Inicializar BD de análisis de entorno
    yield
    print("✅ Finalizando ciclo de vida de la aplicación.")

# ✅ APP PRINCIPAL
app = FastAPI(
    lifespan=lifespan,
    title="Dante Propiedades API",
    description="Backend para procesamiento de consultas y filtros de propiedades con IA.",
    version="1.1.0"
)

# ============================================
# ENDPOINTS DE ADMINISTRACIÓN Y MIGRACIÓN
# ============================================

@app.post("/api/admin/migrate-static-data")
def ejecutar_migracion(request: dict = None):
    """
    Endpoint para ejecutar la migración de datos estáticos.
    
    POST /api/admin/migrate-static-data
    
    Body (opcional):
    {
        "forzar": false  // Si true, sobrescribe datos existentes
    }
    """
    forzar = request.get('forzar', False) if request else False
    
    resultado = migrar_datos_estaticos_a_db(
        solo_ejecutar_una_vez=True,
        forzar=forzar
    )
    
    return resultado


@app.get("/api/admin/migration-status")
def estado_migracion():
    """
    Endpoint para verificar el estado de la migración.
    """
    import os
    
    migration_flag_file = os.path.join(os.path.dirname(BARRIOS_DB_PATH), '.migracion_estatica_completa')
    
    if os.path.exists(migration_flag_file):
        with open(migration_flag_file, 'r') as f:
            contenido = f.read()
        return {
            "migracion_completada": True,
            "detalles": contenido
        }
    else:
        return {
            "migracion_completada": False,
            "mensaje": "La migración de datos estáticos no ha sido ejecutada"
        }


# ========================================
# ENDPOINTS DE DATOS ESPECÍFICOS POR UBICACIÓN
# ========================================

@app.get("/api/data/location-specific/{location_key}")
def obtener_datos_ubicacion(location_key: str):
    """
    Obtiene datos específicos para una ubicación desde la base de datos.
    
    Uso:
    - GET /api/data/location-specific/pilar
    - GET /api/data/location-specific/nordelta
    """
    try:
        conn = get_barrios_db_connection()
        cursor = conn.cursor()
        
        # Buscar coincidencia exacta
        cursor.execute("SELECT data FROM barrios_data WHERE LOWER(nombre) = LOWER(?)", (location_key.lower(),))
        result = cursor.fetchone()
        
        conn.close()
        
        if result:
            data = json.loads(result['data'])
            return {
                "success": True,
                "location": location_key,
                "data": data
            }
        else:
            # Retornar estructura vacía con las categorías
            return {
                "success": False,
                "location": location_key,
                "data": {},
                "message": "No hay datos disponibles para esta ubicación"
            }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


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

# Servir archivos de la raíz (logo.png, llave.png, etc.)
# Solo para desarrollo local, no sirve archivos sensibles
@app.get("/{file_path:path}")
async def serve_root_files(file_path: str):
    """Serve static files from root directory like logo.png, llave.png, etc."""
    # Lista de archivos permitidos en la raíz
    allowed_files = ['logo.png', 'llave.png', 'favicon.ico', 'robots.txt', 'sitemap.xml']
    
    # Extraer solo el nombre del archivo
    import os
    filename = os.path.basename(file_path)
    
    # Verificar si es un archivo permitido
    if filename in allowed_files:
        root_dir = os.path.dirname(os.path.abspath(__file__))
        file_path_abs = os.path.join(root_dir, filename)
        
        if os.path.exists(file_path_abs):
            from fastapi.responses import FileResponse
            return FileResponse(file_path_abs)
        else:
            raise HTTPException(status_code=404, detail=f"Archivo {filename} no encontrado")
    
    # Si no es un archivo permitido, retornar 404
    raise HTTPException(status_code=404, detail="Archivo no encontrado")

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
    analisis_oportunidad: Dict[str, Any] = []
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
- No exaggerar ni hacer promesas falsas
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


# ✅ RUTAS PARA ANALISIS DE BARRIOS
@app.get("/analisis-barrio")
def analisis_barrio_page():
    """Sirve la página principal del Analytics Dashboard"""
    return FileResponse("analisis-barrio.html")


@app.get("/analisis-barrio.css")
def analisis_barrio_css():
    """Sirve los estilos del Analytics Dashboard"""
    return FileResponse("analisis-barrio.css")


@app.get("/analisis-barrio.js")
def analisis_barrio_js():
    """Sirve el JavaScript del Analytics Dashboard"""
    return FileResponse("analisis-barrio.js")


# ✅ ENDPOINT DE ANÁLISIS DE ENTORNO CON IA
@app.post("/ai/environment-analysis")
async def generate_environment_analysis(
    zone: str = Query(..., description="Nombre del barrio o zona a analizar"),
    force_refresh: bool = Query(False, description="Forzar regeneración del análisis")
):
    """
    Genera análisis del entorno usando Gemini AI con caché en base de datos.
    
    Este endpoint:
    1. Verifica si existe análisis válido en caché
    2. Si no existe o está expirado, genera nuevo análisis usando Gemini AI
    3. Guarda resultados en base de datos para reutilizar
    4. Retorna el análisis completo con estructura detallada
    """
    zone_clean = zone.strip()
    
    print(f"🌍 Solicitud de análisis de entorno para: {zone_clean} (force_refresh: {force_refresh})")
    
    # Verificar caché primero si no se fuerza actualización
    if not force_refresh:
        try:
            cached = get_environ_analysis(zone_clean)
            if cached:
                print(f"✅ Análisis encontrado en caché para: {zone_clean}")
                return {
                    "success": True,
                    "source": "cache",
                    "zone": zone_clean,
                    "entorno": cached,
                    "message": "Análisis obtenido desde caché"
                }
        except Exception as e:
            print(f"⚠️ Error consultando caché: {e}")
    
    # Generar nuevo análisis con Gemini
    print(f"🔄 Generando nuevo análisis con IA para: {zone_clean}")
    
    # Prompt detallado para Gemini - Estructura mejorada
    prompt = f"""
Eres un analista inmobiliario experto en Buenos Aires, Argentina. Genera un análisis exhaustivo y profesional del barrio '{zone_clean}' con la siguiente estructura detallada:

## ESTRUCTURA REQUERIDA (JSON)

{{
    "transporte": {{
        "puntuacion": PUNTUACIÓN_0_100,
        "descripcion": "Descripción detallada del transporte público",
        "estaciones_cercanas": ["Estación 1", "Estación 2"],
        "lineas_colectivo": ["Línea 1", "Línea 2", "Línea 3"]
    }},
    "comercio": {{
        "puntuacion": PUNTUACIÓN_0_100,
        "descripcion": "Análisis del comercio y servicios",
        "supermercados": ["Supermercado 1", "Supermercado 2"],
        "centros_comerciales": ["Centro Comercial 1"]
    }},
    "seguridad": {{
        "puntuacion": PUNTUACIÓN_0_100,
        "descripcion": "Evaluación de seguridad del barrio",
        "comisaria_cercana": "Dirección de comisaría cercana",
        "rating_seguridad": "Puntuación en escala 1-10"
    }},
    "educacion": {{
        "puntuacion": PUNTUACIÓN_0_100,
        "descripcion": "Infraestructura educativa",
        "escuelas": ["Escuela 1", "Escuela 2"],
        "universidades": ["Universidad 1"]
    }},
    "salud": {{
        "puntuacion": PUNTUACIÓN_0_100,
        "descripcion": "Centros de salud y hospitales",
        "hospitales": ["Hospital 1"],
        "centros_salud": ["Centro 1", "Centro 2"]
    }},
    "espacios_verdes": {{
        "puntuacion": PUNTUACIÓN_0_100,
        "descripcion": "Parques y áreas verdes",
        "parques": ["Parque 1", "Plaza 2"]
    }},
    "contaminacion": {{
        "puntuacion": PUNTUACIÓN_0_100,
        "descripcion": "Nivel de contaminación y ruido",
        "nivel_ruido": "Nivel (Bajo/Medio/Alto)",
        "principal_fuente": "Fuente principal de contaminación"
    }},
    "vida_barrio": {{
        "puntuacion": PUNTUACIÓN_0_100,
        "descripcion": "Vida nocturna, cultura y entretenimiento",
        "bares_restaurantes": ["Lugar 1", "Lugar 2"],
        "cultura": ["Teatro 1", "Museo 2"]
    }},
    "conclusion": "Resumen ejecutivo para inversores inmobiliarios"
}}

## REGLAS ESTRICTAS
- Responde ÚNICAMENTE con JSON válido, sin markdown, sin explicaciones adicionales
- Todas las puntuaciones deben ser números del 0 al 100
- La descripción debe ser concisa pero informativa (2-3 oraciones)
- No incluyas campos vacíos o nulos
- Usa nombres de lugares reales de {zone_clean}
- La conclusión debe ser profesional y orientada a inversores
- Todos los arrays deben tener al menos 2-3 elementos si es posible
"""
    
    try:
        # Llamar a Gemini
        print(f"📤 Enviando prompt a Gemini para zona: {zone_clean}")
        ai_response = call_gemini_with_rotation(prompt)
        
        print(f"📥 Respuesta de Gemini recibida ({len(ai_response)} caracteres)")
        print("=" * 80)
        print(ai_response)
        print("=" * 80)
        
        # Limpiar markdown y extraer JSON de forma más robusta
        clean_response = ai_response.strip()
        
        # Remover bloques de markdown ```json ... ```
        if clean_response.startswith('```json'):
            clean_response = clean_response[7:]
        elif clean_response.startswith('```'):
            clean_response = clean_response[3:]
        
        if clean_response.endswith('```'):
            clean_response = clean_response[:-3]
        
        clean_response = clean_response.strip()
        
        print(f"🧹 Respuesta limpia ({len(clean_response)} caracteres):")
        print("=" * 80)
        print(clean_response)
        print("=" * 80)
        
        # Intentar parsear directamente primero
        try:
            analysis_data = json.loads(clean_response)
            print(f"✅ JSON parseado directamente")
        except json.JSONDecodeError as e:
            # Si falla, intentar corregir errores comunes
            print(f"🔧 Error de parsing: {e}")
            print(f"🔍 Intentando corregir...")
            
            # Corregir errores comunes
            corrected = clean_response
            
            # Corregir comillas simples a dobles (pero preservar contenido)
            # Reemplazar ' por " solo en claves JSON
            corrected = re.sub(r"'([^']+)':", r'"\1":', corrected)
            
            # Corregir trailing commas
            corrected = re.sub(r',\s*([}\]])', r'\1', corrected)
            
            print(f"🧹 Respuesta corregida:")
            print("=" * 80)
            print(corrected)
            print("=" * 80)
            
            try:
                analysis_data = json.loads(corrected)
                print(f"✅ JSON corregido y parseado")
            except json.JSONDecodeError as e2:
                raise ValueError(f"JSON inválido incluso después de corrección: {str(e2)}\n\nRespuesta original:\n{ai_response[:1000]}...")
        
        # Validar que tenga la estructura esperada
        if not isinstance(analysis_data, dict):
            raise ValueError("La respuesta no es un objeto JSON válido")
        
        # ✅ COMPLETAR CAMPOS VACÍOS CON DATOS DE RESPALDO
        print(f"🔍 Verificando campos vacíos para completar...")
        
        # Obtener datos de gastronomía
        gastro_info = get_gastronomy_info(zone_clean)
        if 'gastronomia' not in analysis_data or not analysis_data.get('gastronomia') or analysis_data['gastronomia'].get('puntuacion') in [None, 0, '--', '']:
            analysis_data['gastronomia'] = {
                'puntuacion': gastro_info.get('puntuacion', 50),
                'descripcion': gastro_info.get('descripcion', 'Información gastronómica no disponible'),
                'restaurantes_destacados': gastro_info.get('restaurantes_destacados', []),
                'zonas_gastronomicas': gastro_info.get('zonas_gastronomicas', []),
                'tipo_comida': gastro_info.get('tipo_comida', [])
            }
            print(f"✅ Campo 'gastronomia' completado con datos de respaldo")
        
        # Obtener datos de servicios financieros
        financial_info = get_financial_info(zone_clean)
        if 'servicios_financieros' not in analysis_data or not analysis_data.get('servicios_financieros') or analysis_data['servicios_financieros'].get('puntuacion') in [None, 0, '--', '']:
            analysis_data['servicios_financieros'] = {
                'puntuacion': financial_info.get('puntuacion', 50),
                'descripcion': financial_info.get('descripcion', 'Información de servicios financieros no disponible'),
                'bancos': financial_info.get('bancos', []),
                'cajeros_automaticos': financial_info.get('cajeros_automaticos', []),
                'sucursales': financial_info.get('sucursales_bancarias', [])
            }
            print(f"✅ Campo 'servicios_financieros' completado con datos de respaldo")
        
        # Guardar en base de datos (7 días de caché)
        save_environ_analysis(zone_clean, analysis_data, cache_days=7)
        
        # Log exitoso
        log_environ_analysis_request(zone_clean, True, analysis_json=json.dumps(analysis_data))
        
        print(f"✅ Análisis generado y guardado para: {zone_clean}")
        
        return {
            "success": True,
            "source": "ai",
            "zone": zone_clean,
            "entorno": analysis_data,
            "message": "Análisis generado exitosamente con IA"
        }
            
    except Exception as e:
        error_msg = str(e)
        print(f"❌ Error generando análisis: {error_msg}")
        print(f"📄 Respuesta completa de Gemini: {ai_response[:500]}...")
        
        # Log de error
        log_environ_analysis_request(zone_clean, False, error=error_msg)
        
        return {
            "success": False,
            "error": f"Error generando análisis: {error_msg}",
            "message": "No se pudo generar el análisis"
        }


# ========================================
# CMS DE GESTIÓN DE BARRIOS - ENDPOINTS API
# ========================================

class BarrioCreateRequest(BaseModel):
    """Request para crear un nuevo barrio"""
    nombre: str = Field(..., min_length=1, max_length=100, description="Nombre del barrio")
    generar_ia: bool = Field(default=True, description="Si es True, genera datos con IA")

class BarrioUpdateRequest(BaseModel):
    """Request para actualizar un barrio"""
    data: Dict[str, Any] = Field(..., description="Datos completos del barrio en formato JSON")
    actualizado_por: Optional[str] = Field(default="admin", description="Usuario que actualiza")

def generar_datos_barrio_ai(nombre_barrio: str) -> Dict[str, Any]:
    """
    Genera datos completos de un barrio usando Gemini AI
    """
    prompt = f"""
    Eres un experto analista inmobiliario de Buenos Aires, Argentina. Genera un análisis completo del barrio '{nombre_barrio}' en formato JSON con la siguiente estructura:

    {{
        "resumen_general": "Breve resumen del perfil del barrio (2-3 oraciones)",
        "puntuacion_general": NUMERO_0_100,
        "transporte": {{
            "puntuacion": NUMERO_0_100,
            "descripcion": "Descripción detallada del transporte público (2-3 oraciones)",
            "estaciones_cercanas": ["Estación 1", "Estación 2"],
            "lineas_colectivo": ["Línea 1", "Línea 2", "Línea 3"]
        }},
        "comercio": {{
            "puntuacion": NUMERO_0_100,
            "descripcion": "Análisis del comercio y servicios (2-3 oraciones)",
            "supermercados": ["Supermercado 1", "Supermercado 2"],
            "centros_comerciales": ["Centro Comercial 1"]
        }},
        "seguridad": {{
            "puntuacion": NUMERO_0_100,
            "descripcion": "Evaluación de seguridad del barrio (2-3 oraciones)",
            "comisaria_cercana": "Dirección de comisaría cercana",
            "rating_seguridad": "1-10"
        }},
        "educacion": {{
            "puntuacion": NUMERO_0_100,
            "descripcion": "Infraestructura educativa (2-3 oraciones)",
            "escuelas": ["Escuela 1", "Escuela 2"],
            "universidades": ["Universidad 1"]
        }},
        "salud": {{
            "puntuacion": NUMERO_0_100,
            "descripcion": "Centros de salud y hospitales (2-3 oraciones)",
            "hospitales": ["Hospital 1"],
            "centros_salud": ["Centro 1", "Centro 2"]
        }},
        "espacios_verdes": {{
            "puntuacion": NUMERO_0_100,
            "descripcion": "Parques y áreas verdes (2-3 oraciones)",
            "parques": ["Parque 1", "Plaza 2"]
        }},
        "contaminacion": {{
            "puntuacion": NUMERO_0_100,
            "descripcion": "Nivel de contaminación y ruido (2-3 oraciones)",
            "nivel_ruido": "Bajo/Medio/Alto",
            "principal_fuente": "Fuente principal de contaminación"
        }},
        "vida_barrio": {{
            "puntuacion": NUMERO_0_100,
            "descripcion": "Vida nocturna, cultura y entretenimiento (2-3 oraciones)",
            "bares_restaurantes": ["Lugar 1", "Lugar 2"],
            "cultura": ["Teatro 1", "Museo 2"]
        }},
        "servicios_financieros": {{
            "puntuacion": NUMERO_0_100,
            "descripcion": "Bancos, cajeros y servicios financieros (2-3 oraciones)",
            "bancos": ["Banco 1", "Banco 2"],
            "cajeros_automaticos": ["Ubicación 1", "Ubicación 2"]
        }},
        "conclusion": "Resumen ejecutivo orientado a inversores inmobiliarios (2-3 oraciones)"
    }}

    ## REGLAS ESTRICTAS:
    - Responde ÚNICAMENTE con JSON válido, sin markdown, sin explicaciones
    - Todas las puntuaciones deben ser números del 0 al 100
    - Usa nombres de lugares REALES de {nombre_barrio} y zonas cercanas
    - Los arrays deben tener al menos 2-3 elementos si es posible
    - La conclusión debe ser profesional e informativa
    - NO uses comillas simples dentro de las descripciones, usa comillas dobles correctamente
    """
    
    print(f"🤖 Generando datos con IA para: {nombre_barrio}")
    
    def clean_and_parse_json(response: str) -> Dict:
        """Limpia y parsea la respuesta JSON con manejo de errores avanzado"""
        
        print(f"   📄 Recibiendo respuesta de {len(response)} caracteres")
        
        # Guardar respuesta cruda para debug en la carpeta backend
        import os
        debug_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'debug_json_error.json')
        try:
            with open(debug_path, 'w', encoding='utf-8') as f:
                f.write(response)
            print(f"   💾 Debug guardado en: {debug_path}")
        except Exception as e:
            print(f"   ⚠️ No se pudo guardar debug: {e}")
        
        # Extraer el JSON entre el primer { y el último }
        first_brace = response.find('{')
        last_brace = response.rfind('}')
        
        if first_brace == -1 or last_brace == -1 or last_brace <= first_brace:
            print(f"   ❌ No se encontró estructura JSON válida")
            return None
        
        json_str = response[first_brace:last_brace + 1]
        print(f"   📋 JSON extraído ({len(json_str)} caracteres)")
        
        # Intentar parsear directamente primero
        try:
            result = json.loads(json_str)
            print(f"   ✅ JSON parseado directamente")
            return result
        except json.JSONDecodeError as e:
            print(f"   ⚠️ Error en JSON directo: {e}")
        
        # Si falla, limpiar progresivamente
        clean = json_str.strip()
        
        # Remover bloques markdown ```json ... ```
        clean = re.sub(r'```json\s*', '', clean)
        clean = re.sub(r'\s*```', '', clean)
        
        # Corrección paso a paso
        problems_found = []
        
        for iteration in range(20):
            original_clean = clean
            
            # 1. Eliminar trailing commas antes de } o ]
            clean = re.sub(r',\s*([}\]])', r'\1', clean)
            
            # 2. Eliminar trailing commas antes de , en arrays
            clean = re.sub(r',(\s*[\]\}])', r'\1', clean)
            
            # 3. Convertir comillas simples en keys
            clean = re.sub(r"'([^'\"жа]+)':", r'"\1":', clean)
            
            # 4. Convertir comillas simples en strings (cuidadosamente)
            clean = re.sub(r"'([^'\\]*)'", r'"\1"', clean)
            
            # 5. Eliminar caracteres de control problemáticos
            clean = clean.replace('\n', ' ')
            clean = clean.replace('\r', ' ')
            clean = clean.replace('\t', ' ')
            
            # 6. Eliminar múltiples espacios
            clean = re.sub(r'\s+', ' ', clean)
            
            # 7. Corregir patrones comunes problemáticos
            clean = re.sub(r'"\s*:\s*"', '": "', clean)
            clean = re.sub(r'{\s*"', '{"', clean)
            clean = re.sub(r'"\s*{', '" {', clean)
            clean = re.sub(r'}\s*"', '}"', clean)
            clean = re.sub(r'"\s*}', '" }', clean)
            clean = re.sub(r'\[\s*"', '["', clean)
            clean = re.sub(r'"\s*\]', '"]', clean)
            
            # Verificar si hubo cambios
            if clean == original_clean:
                break
                
            # Intentar parsear
            try:
                result = json.loads(clean)
                print(f"   ✅ JSON reparado en iteración {iteration + 1}")
                return result
            except json.JSONDecodeError as e:
                problems_found.append(f"Iteración {iteration + 1}: {e}")
                continue
        
        # Último recurso: buscar el objeto JSON más interno y usarlo
        print(f"   🔧 Intentando recuperación avanzada...")
        
        # Encontrar todos los objetos JSON completos
        try:
            # Buscar objetos que parezcan válidos desde el final
            for end_pos in range(len(clean), 0, -100):  # Reducir de 100 en 100
                start_estimate = max(0, end_pos - 5000)  # Máximo 5000 caracteres
                test_json = clean[start_estimate:end_pos]
                
                # Encontrar el primer { en el rango
                first = test_json.find('{')
                if first != -1:
                    test_json = test_json[first:]
                    try:
                        result = json.loads(test_json)
                        print(f"   ✅ Recuperado JSON truncando a {len(test_json)} caracteres")
                        return result
                    except:
                        continue
        except Exception as e:
            print(f"   ⚠️ Error en recuperación: {e}")
        
        # Si todo falla, informar el error
        print(f"   ❌ No se pudo parsear después de {len(problems_found)} intentos")
        print(f"   Últimos errores: {problems_found[-3:] if problems_found else 'Ninguno'}")
        
        return None
    
    try:
        ai_response = call_gemini_with_rotation(prompt)
        
        print(f"📄 Respuesta cruda ({len(ai_response)} caracteres):")
        print("=" * 80)
        print(ai_response[:500] + "..." if len(ai_response) > 500 else ai_response)
        print("=" * 80)
        
        # Parsear con la nueva función
        data = clean_and_parse_json(ai_response)
        
        # Si el parser falló, intentar una vez más con un prompt más simple
        if data is None:
            print(f"⚠️ Parser falló, intentando con formato más simple...")
            simple_prompt = '''
Genera un análisis de barrio en JSON válido para "{nombre}" en Buenos Aires.

Requisitos estrictos:
- Usa SOLO comillas dobles
- NO uses comillas simples en ningún valor
- NO uses comas finales antes de }} o ]
- NO uses saltos de línea dentro de strings

Estructura EXACTA:
{{
    "resumen_general": "Una oración describing el barrio",
    "puntuacion_general": 75,
    "transporte": {{"puntuacion": 80, "descripcion": "Descripción"}},
    "comercio": {{"puntuacion": 70, "descripcion": "Descripción"}},
    "seguridad": {{"puntuacion": 65, "descripcion": "Descripción"}},
    "educacion": {{"puntuacion": 75, "descripcion": "Descripción"}},
    "salud": {{"puntuacion": 70, "descripcion": "Descripción"}},
    "espacios_verdes": {{"puntuacion": 85, "descripcion": "Descripción"}},
    "contaminacion": {{"puntuacion": 60, "descripcion": "Descripción"}},
    "vida_barrio": {{"puntuacion": 80, "descripcion": "Descripción"}},
    "servicios_financieros": {{"puntuacion": 70, "descripcion": "Descripción"}},
    "conclusion": "Conclusión para inversores"
}}

Solo responde con el JSON, sin markdown, sin explicaciones.
'''.replace('{nombre}', nombre_barrio)
            retry_response = call_gemini_with_rotation(simple_prompt)
            data = clean_and_parse_json(retry_response)
        
        if data is None:
            print(f"⚠️ Parser falló, generando estructura con valores por defecto")
            # Generar estructura por defecto pero con datos básicos del barrio
            data = {
                "resumen_general": f"{nombre_barrio} es un barrio de Buenos Aires con características únicas.",
                "puntuacion_general": 70,
                "transporte": {"puntuacion": 70, "descripcion": "Cuenta con acceso a transporte público."},
                "comercio": {"puntuacion": 70, "descripcion": "Tiene variedad de comercios locales."},
                "seguridad": {"puntuacion": 70, "descripcion": "Nivel de seguridad estándar."},
                "educacion": {"puntuacion": 70, "descripcion": "Disponibilidad de instituciones educativas."},
                "salud": {"puntuacion": 70, "descripcion": "Acceso a centros de salud."},
                "espacios_verdes": {"puntuacion": 70, "descripcion": "Áreas verdes disponibles."},
                "contaminacion": {"puntuacion": 70, "descripcion": "Nivel de contaminación moderado."},
                "vida_barrio": {"puntuacion": 70, "descripcion": "Vida social activa."},
                "servicios_financieros": {"puntuacion": 70, "descripcion": "Acceso a servicios bancarios."},
                "conclusion": f"{nombre_barrio} presenta una opción viable para vivir e invertir en Buenos Aires."
            }
        
        print(f"✅ Datos generados para: {nombre_barrio}")
        return data
        
    except json.JSONDecodeError as e:
        print(f"❌ Error parseando JSON: {e}")
        raise ValueError(f"Error al generar datos: {str(e)}")
    except Exception as e:
        print(f"❌ Error generando datos: {e}")
        raise

@app.get("/api/barrios")
def listar_barrios():
    """
    Lista todos los barrios disponibles en el CMS
    """
    conn = get_barrios_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT nombre, data, actualizado_por, fecha_actualizacion 
        FROM barrios_data 
        ORDER BY nombre
    ''')
    
    rows = cursor.fetchall()
    conn.close()
    
    barrios = []
    for row in rows:
        try:
            data = json.loads(row['data'])
            barrios.append({
                'nombre': row['nombre'],
                'puntuacion_general': data.get('puntuacion_general') or data.get('resumen_general', {}).get('puntuacion', 50),
                'generado_por_ia': row['actualizado_por'] == 'ai',
                'fecha_actualizacion': row['fecha_actualizacion']
            })
        except:
            barrios.append({
                'nombre': row['nombre'],
                'puntuacion_general': 50,
                'generado_por_ia': row['actualizado_por'] == 'ai',
                'fecha_actualizacion': row['fecha_actualizacion']
            })
    
    return {
        "success": True,
        "total": len(barrios),
        "barrios": barrios
    }

@app.get("/api/barrios/search")
def buscar_barrios(q: str = Query(..., description="Término de búsqueda")):
    """
    Busca barrios por nombre
    """
    conn = get_barrios_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT nombre, data, actualizado_por, fecha_actualizacion 
        FROM barrios_data 
        WHERE nombre LIKE ?
        ORDER BY nombre
    ''', (f'%{q.lower()}%',))
    
    rows = cursor.fetchall()
    conn.close()
    
    barrios = []
    for row in rows:
        try:
            data = json.loads(row['data'])
            barrios.append({
                'nombre': row['nombre'],
                'puntuacion_general': data.get('puntuacion_general', 50),
                'generado_por_ia': row['actualizado_por'] == 'ai',
                'fecha_actualizacion': row['fecha_actualizacion']
            })
        except:
            barrios.append({
                'nombre': row['nombre'],
                'puntuacion_general': 50,
                'generado_por_ia': row['actualizado_por'] == 'ai',
                'fecha_actualizacion': row['fecha_actualizacion']
            })
    
    return {
        "success": True,
        "total": len(barrios),
        "barrios": barrios
    }


# ✅ ENDPOINT PARA GENERAR entorno.json
@app.get("/api/barrios/generate-json")
def generar_entorno_json():
    """
    Genera el archivo entorno.json con todos los barrios para el frontend del sitio principal.
    Este endpoint es usado por el CMS para exportar los datos.
    """
    conn = get_barrios_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT nombre, data, fecha_actualizacion FROM barrios_data ORDER BY nombre')
    rows = cursor.fetchall()
    conn.close()
    
    if not rows:
        raise HTTPException(status_code=404, detail="No hay barrios registrados")
    
    # Datos de respaldo mejorados por categoría
    FALLBACK_DATA = {
        'transporte': [
            "Estación de tren cercana con conexiones a toda la ciudad",
            "Líneas de colectivo con parada principal en la zona",
            "Acceso fácil a centro de la ciudad",
            "Parada de taxi y remise a pocas cuadras"
        ],
        'educacion': [
            "Escuela primaria pública en el barrio",
            "Instituto secundario cercano",
            "Centro de educación inicial disponible",
            "Universidad o terciario a distancia accesible"
        ],
        'salud': [
            "Centro de atención primaria a pocas cuadras",
            "Farmacia de turno disponible",
            "Consultorios médicos privados en la zona",
            "Hospital público de referencia en zona cercana"
        ],
        'comercio': [
            "Comercio local de barrio con productos frescos",
            "Supermercado mayorista y minorista en zona",
            "Locales comerciales con variedad de rubros",
            "Mercado de frutos del país cercano"
        ],
        'gastronomia': [
            "Restaurante local con comida tradicional",
            "Café y panadería de barrio",
            "Rotisería y local de comidas para llevar",
            "Bar pub con ambiente familiar"
        ],
        'recreacion': [
            "Plaza principal del barrio con juegos",
            "Area verde con jardín y bancos",
            "Club social y deportivo del barrio",
            "Ciclovía y sendero para caminar"
        ],
        'servicios_financieros': [
            "Banco con sucursal en zona",
            "Cajero automático disponible 24hs",
            "Casa de cambios y transferencia",
            "Cooperativa de ahorro y crédito"
        ],
        'seguridad': [
            "Comisaría de barrio con atención",
            "Vigilancia privada en zonas residenciales",
            "Alumbrado público en todas las calles",
            "Vecinos organizados con ronda nocturna"
        ],
        'servicios': [
            "Correo y oficina postal cercana",
            "Centro de atención municipal",
            "Gomería y servicio mecánico",
            "Lavadero y tintorería en zona"
        ]
    }
    
    # Mensajes de respaldo por categoría cuando no hay datos específicos
    FALLBACK_MESSAGES = {
        'transporte': "Transporte público disponible con fácil acceso a distintas zonas de la ciudad",
        'educacion': "Cuenta con instituciones educativas para todos los niveles en el barrio o zonas cercanas",
        'salud': "Servicios de salud accesibles con centros de atención primaria y farmacias en la zona",
        'comercio': "Variedad de comercios locales que satisfacen las necesidades cotidianas",
        'gastronomia': "Opciones gastronómicas variadas con locales de comida tradicional y modernos",
        'recreacion': "Espacios de recreación y áreas verdes para actividades al aire libre",
        'servicios_financieros': "Servicios bancarios y financieros disponibles en la zona",
        'seguridad': "Nivel de seguridad estándar con presencia policial y vigilancia comunitaria",
        'servicios': "Servicios generales y utilitarios disponibles en el barrio"
    }
    
    # Transformar datos al formato de entorno.json para el frontend
    entorno_data = {}
    
    for row in rows:
        nombre = row['nombre']
        data = json.loads(row['data'])
        fecha = row['fecha_actualizacion']
        nombre_title = nombre.title()
        
        # Mapeo de campos del backend al formato frontend
        field_mappings = {
            'transporte': ['estaciones_cercanas', 'lineas_colectivo', 'descripcion'],
            'educacion': ['escuelas', 'universidades', 'colegios'],
            'salud': ['hospitales', 'centros_salud', 'clinicas', 'farmacias'],
            'comercio': ['supermercados', 'centros_comerciales', 'tiendas'],
            'gastronomia': ['bares_restaurantes', 'restaurantes', 'cafeterias'],
            'recreacion': ['plazas', 'parques', 'espacios_verdes', 'actividades'],
            'servicios_financieros': ['bancos', 'cajeros', 'servicios'],
            'seguridad': ['comisarias', 'seguridad'],
            'servicios': ['farmacias', 'centros_servicios', 'otros_servicios']
        }
        
        # Convertir datos al formato requerido
        barrio_json = {
            'nombre': nombre_title,
            'descripcion_general': data.get('resumen_general', data.get('perfil_barrio', f"{nombre_title} es un barrio con características propias de la zona norte del Gran Buenos Aires, ofreciendo una combinación de residentialidad y servicios locales.")),
            'fecha_actualizacion': fecha
        }
        
        for cat_key, fields in field_mappings.items():
            cat_data = data.get('categorias', {}).get(cat_key, {}) if 'categorias' in data else data.get(cat_key, {})
            
            # Extraer items de los campos disponibles
            items = []
            for field_name in fields:
                if field_name in cat_data and cat_data[field_name]:
                    value = cat_data[field_name]
                    if isinstance(value, list):
                        items.extend([str(v).strip() for v in value if v])
                    elif isinstance(value, str) and value.strip():
                        parts = [p.strip() for p in value.split(',') if p.strip()]
                        items.extend(parts)
            
            # Si hay items, usarlos; si no, proporcionar fallback mejorado
            if items:
                # Filtrar duplicados manteniendo el orden
                seen = set()
                unique_items = []
                for item in items:
                    item_lower = item.lower()
                    if item_lower not in seen:
                        seen.add(item_lower)
                        unique_items.append(item)
                barrio_json[cat_key] = unique_items
            else:
                # Usar datos de respaldo específicos por categoría
                barrio_json[cat_key] = FALLBACK_DATA.get(cat_key, FALLBACK_DATA['servicios']).copy()
        
        entorno_data[nombre] = barrio_json
    
    return entorno_data


@app.get("/api/barrios/{nombre}")
def obtener_barrio(nombre: str):
    """
    Obtiene los datos de un barrio específico
    """
    conn = get_barrios_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT nombre, data, actualizado_por, fecha_actualizacion 
        FROM barrios_data 
        WHERE nombre = ?
    ''', (nombre.lower().strip(),))
    
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail=f"Barrio '{nombre}' no encontrado")
    
    data = json.loads(row['data'])
    nombre_display = row['nombre']
    
    # Transformar datos al formato esperado por el frontend
    frontend_data = transformar_a_formatofrontend(data, nombre_display)
    
    return {
        "success": True,
        "nombre": nombre_display,
        "data": frontend_data,
        "generado_por_ia": row['actualizado_por'] == 'ai',
        "actualizado_por": row['actualizado_por'],
        "fecha_actualizacion": row['fecha_actualizacion']
    }

def transformar_a_formatofrontend(data: dict, nombre: str) -> dict:
    """
    Transforma los datos del formato interno al formato esperado por el frontend.
    El frontend espera: resumen, conclusion, categorias.transporte.puntuacion, etc.

    El backend puede almacenar dos formatos:
    1. Formato flat (antiguo): transporte.puntuacion, comercio.puntuacion, etc. a nivel raíz
    2. Formato nested (nuevo): categorias.transporte.puntuacion, categorias.comercio.puntuacion, etc.
    """
    if not data:
        return {
            'nombre': nombre,
            'resumen': '',
            'conclusion': '',
            'categorias': {}
        }

    # Detectar si los datos están anidados bajo 'categorias'
    # El frontend envía datos con estructura: { categorias: { transporte: {...}, comercio: {...} } }
    if 'categorias' in data and isinstance(data['categorias'], dict):
        # Nuevo formato nested: extraer las categorías de data.categorias
        categorias_data = data['categorias']
    else:
        # Formato antiguo flat: las categorías están directamente en data
        categorias_data = data

    categorias = {}

    # Transporte
    if 'transporte' in categorias_data:
        t = categorias_data['transporte']
        categorias['transporte'] = {
            'puntuacion': t.get('puntuacion', 0),
            'descripcion': t.get('descripcion', ''),
            'estaciones': ', '.join(t.get('estaciones_cercanas', [])) if t.get('estaciones_cercanas') else t.get('estaciones', ''),
            'colectivos': ', '.join(t.get('lineas_colectivo', [])) if t.get('lineas_colectivo') else t.get('colectivos', '')
        }

    # Comercio
    if 'comercio' in categorias_data:
        c = categorias_data['comercio']
        categorias['comercio'] = {
            'puntuacion': c.get('puntuacion', 0),
            'descripcion': c.get('descripcion', ''),
            'supermercados': ', '.join(c.get('supermercados', [])) if c.get('supermercados') else c.get('supermercados', ''),
            'centros_comerciales': ', '.join(c.get('centros_comerciales', [])) if c.get('centros_comerciales') else c.get('centros', '')
        }

    # Seguridad
    if 'seguridad' in categorias_data:
        s = categorias_data['seguridad']
        categorias['seguridad'] = {
            'puntuacion': s.get('puntuacion', 0),
            'descripcion': s.get('descripcion', ''),
            'comisaria': s.get('comisaria_cercana', '') or s.get('comisaria', '')
        }

    # Educación
    if 'educacion' in categorias_data:
        e = categorias_data['educacion']
        categorias['educacion'] = {
            'puntuacion': e.get('puntuacion', 0),
            'descripcion': e.get('descripcion', ''),
            'escuelas': ', '.join(e.get('escuelas', [])) if e.get('escuelas') else e.get('escuelas', ''),
            'universidades': ', '.join(e.get('universidades', [])) if e.get('universidades') else e.get('universidades', '')
        }

    # Salud
    if 'salud' in categorias_data:
        s = categorias_data['salud']
        categorias['salud'] = {
            'puntuacion': s.get('puntuacion', 0),
            'descripcion': s.get('descripcion', ''),
            'hospitales': ', '.join(s.get('hospitales', [])) if s.get('hospitales') else s.get('hospitales', ''),
            'centros_salud': ', '.join(s.get('centros_salud', [])) if s.get('centros_salud') else s.get('centros', '')
        }

    # Espacios Verdes
    if 'espacios_verdes' in categorias_data:
        e = categorias_data['espacios_verdes']
        categorias['espacios_verdes'] = {
            'puntuacion': e.get('puntuacion', 0),
            'descripcion': e.get('descripcion', ''),
            'parques': ', '.join(e.get('parques', [])) if e.get('parques') else e.get('parques', '')
        }

    # Contaminación
    if 'contaminacion' in categorias_data:
        c = categorias_data['contaminacion']
        categorias['contaminacion'] = {
            'puntuacion': c.get('puntuacion', 0),
            'descripcion': c.get('descripcion', ''),
            'nivel_ruido': c.get('nivel_ruido', '') or c.get('ruido', ''),
            'fuente': c.get('principal_fuente', '') or c.get('fuente', '')
        }

    # Vida del Barrio
    if 'vida_barrio' in categorias_data:
        v = categorias_data['vida_barrio']
        categorias['vida_barrio'] = {
            'puntuacion': v.get('puntuacion', 0),
            'descripcion': v.get('descripcion', ''),
            'bares': ', '.join(v.get('bares_restaurantes', [])) if v.get('bares_restaurantes') else v.get('bares', ''),
            'cultura': ', '.join(v.get('cultura', [])) if v.get('cultura') else v.get('cultura', '')
        }

    # Servicios Financieros
    if 'servicios_financieros' in categorias_data:
        s = categorias_data['servicios_financieros']
        categorias['servicios_financieros'] = {
            'puntuacion': s.get('puntuacion', 0),
            'descripcion': s.get('descripcion', ''),
            'bancos': ', '.join(s.get('bancos', [])) if s.get('bancos') else s.get('bancos', ''),
            'cajeros': ', '.join(s.get('cajeros_automaticos', [])) if s.get('cajeros_automaticos') else s.get('cajeros', '')
        }

    return {
        'nombre': nombre,
        'resumen': data.get('resumen_general', '') or data.get('resumen', ''),
        'conclusion': data.get('conclusion', ''),
        'puntuacion_general': data.get('puntuacion_general', 50),
        'categorias': categorias
    }


@app.post("/api/barrios")
def crear_barrio(request: BarrioCreateRequest):
    """
    Crea un nuevo barrio. Si generar_ia=True, usa Gemini para crear los datos.
    """
    nombre = request.nombre.strip().lower()
    nombre_display = request.nombre.strip()
    
    conn = get_barrios_db_connection()
    cursor = conn.cursor()
    
    # Verificar si ya existe
    cursor.execute('SELECT nombre FROM barrios_data WHERE nombre = ?', (nombre,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail=f"El barrio '{nombre_display}' ya existe")
    
    try:
        if request.generar_ia:
            # Generar con IA
            data = generar_datos_barrio_ai(nombre_display)
        else:
            # Crear con estructura vacía
            data = {
                "resumen_general": "",
                "puntuacion_general": 50,
                "transporte": {"puntuacion": 50, "descripcion": "", "estaciones_cercanas": [], "lineas_colectivo": []},
                "comercio": {"puntuacion": 50, "descripcion": "", "supermercados": [], "centros_comerciales": []},
                "seguridad": {"puntuacion": 50, "descripcion": "", "comisaria_cercana": "", "rating_seguridad": "5"},
                "educacion": {"puntuacion": 50, "descripcion": "", "escuelas": [], "universidades": []},
                "salud": {"puntuacion": 50, "descripcion": "", "hospitales": [], "centros_salud": []},
                "espacios_verdes": {"puntuacion": 50, "descripcion": "", "parques": []},
                "contaminacion": {"puntuacion": 50, "descripcion": "", "nivel_ruido": "Medio", "principal_fuente": ""},
                "vida_barrio": {"puntuacion": 50, "descripcion": "", "bares_restaurantes": [], "cultura": []},
                "servicios_financieros": {"puntuacion": 50, "descripcion": "", "bancos": [], "cajeros_automaticos": []},
                "conclusion": ""
            }
        
        # Guardar en base de datos
        data_json = json.dumps(data, ensure_ascii=False, indent=2)
        cursor.execute('''
            INSERT INTO barrios_data (nombre, data, actualizado_por)
            VALUES (?, ?, ?)
        ''', (nombre, data_json, 'ai' if request.generar_ia else 'admin'))
        
        conn.commit()
        conn.close()
        
        # Transformar datos al formato esperado por el frontend
        frontend_data = transformar_a_formatofrontend(data, nombre_display)
        
        return {
            "success": True,
            "message": f"Barrio '{nombre_display}' creado exitosamente",
            "source": "ai" if request.generar_ia else "manual",
            "data": frontend_data,
            "generado_por_ia": request.generar_ia,
            "fecha_actualizacion": datetime.now().isoformat()
        }
        
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/barrios/{nombre}")
def actualizar_barrio(nombre: str, request: BarrioUpdateRequest):
    """
    Actualiza los datos de un barrio existente
    """
    nombre = nombre.lower().strip()
    
    conn = get_barrios_db_connection()
    cursor = conn.cursor()
    
    # Verificar que existe
    cursor.execute('SELECT nombre FROM barrios_data WHERE nombre = ?', (nombre,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail=f"Barrio no encontrado")
    
    try:
        data_json = json.dumps(request.data, ensure_ascii=False, indent=2)
        
        cursor.execute('''
            UPDATE barrios_data 
            SET data = ?, actualizado_por = ?, fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE nombre = ?
        ''', (data_json, request.actualizado_por or 'admin', nombre))
        
        conn.commit()
        conn.close()
        
        return {
            "success": True,
            "message": "Barrio actualizado exitosamente"
        }
        
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/barrios/{nombre}/regenerate")
def regenerar_barrio_ai(nombre: str):
    """
    Regenera los datos de un barrio usando Gemini AI
    """
    nombre_display = nombre.strip()
    nombre_db = nombre.strip().lower()
    
    conn = get_barrios_db_connection()
    cursor = conn.cursor()
    
    # Verificar que existe
    cursor.execute('SELECT nombre FROM barrios_data WHERE nombre = ?', (nombre_db,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail=f"Barrio no encontrado")
    
    try:
        # Generar nuevos datos con IA
        data = generar_datos_barrio_ai(nombre_display)
        
        # Actualizar en base de datos
        data_json = json.dumps(data, ensure_ascii=False, indent=2)
        cursor.execute('''
            UPDATE barrios_data 
            SET data = ?, actualizado_por = 'ai', fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE nombre = ?
        ''', (data_json, nombre_db))
        
        conn.commit()
        conn.close()
        
        # Transformar datos al formato esperado por el frontend
        frontend_data = transformar_a_formatofrontend(data, nombre_display)
        
        return {
            "success": True,
            "message": f"Barrio '{nombre_display}' regenerado con IA",
            "data": frontend_data,
            "generado_por_ia": True,
            "fecha_actualizacion": datetime.now().isoformat()
        }
        
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/barrios/{nombre}")
def eliminar_barrio(nombre: str):
    """
    Elimina un barrio de la base de datos
    """
    nombre = nombre.lower().strip()
    
    conn = get_barrios_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM barrios_data WHERE nombre = ?', (nombre,))
    deleted = cursor.rowcount
    conn.commit()
    conn.close()
    
    if deleted == 0:
        raise HTTPException(status_code=404, detail=f"Barrio no encontrado")
    
    return {
        "success": True,
        "message": f"Barrio '{nombre}' eliminado exitosamente"
    }

@app.get("/api/barrios/{nombre}/exists")
def verificar_barrio_existe(nombre: str):
    """
    Verifica si un barrio existe en la base de datos
    """
    nombre = nombre.lower().strip()
    
    conn = get_barrios_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT nombre, fecha_actualizacion FROM barrios_data WHERE nombre = ?', (nombre,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return {
            "exists": True,
            "nombre": row['nombre'],
            "fecha_actualizacion": row['fecha_actualizacion']
        }
    else:
        return {
            "exists": False,
            "message": "El barrio no existe. Puede crearlo con IA."
        }


# ✅ INICIO
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main-ai:app", host="0.0.0.0", port=port, reload=False)  # reload=False en producción


# ========================================
# METADATOS DE CAMPOS POR RUBRO (PARA CMS Y FRONTEND)
# ========================================

# Definición de los campos específicos que existen en el CMS para cada rubro.
# Esta estructura es usada por:
# 1. El CMS (analisis-barrio.js) para generar formularios dinámicos
# 2. El frontend principal (dantepropiedades.com.ar) para mostrar datos estructurados
# 3. El endpoint /api/entorno/metadata para integración externa

RUBRO_METADATA = {
    "transporte": {
        "titulo": "Transporte",
        "icono": "🚌",
        "descripcion": "Acceso a transporte público y conectividad",
        "orden": 1,
        "campos": {
            "descripcion": {
                "tipo": "textarea",
                "label": "Descripción del transporte",
                "placeholder": "Describe la cobertura de transporte público en la zona...",
                "orden": 1
            },
            "estaciones": {
                "tipo": "input",
                "label": "Estaciones de tren/subte",
                "placeholder": "Ej: Estación Tigre, Estación Bartolomé Mitre",
                "orden": 2
            },
            "colectivos": {
                "tipo": "input",
                "label": "Líneas de colectivo",
                "placeholder": "Ej: 15, 28, 57, 71, 130",
                "orden": 3
            }
        }
    },
    "comercio": {
        "titulo": "Comercio",
        "icono": "🛒",
        "descripcion": "Comercios locales, supermercados y centros comerciales",
        "orden": 2,
        "campos": {
            "descripcion": {
                "tipo": "textarea",
                "label": "Descripción del comercio",
                "placeholder": "Describe la oferta comercial de la zona...",
                "orden": 1
            },
            "supermercados": {
                "tipo": "input",
                "label": "Supermercados",
                "placeholder": "Ej: Coto, Jumbo, Día, ChangoMas",
                "orden": 2
            },
            "centros": {
                "tipo": "input",
                "label": "Centros comerciales",
                "placeholder": "Ej: Nordelta Shopping, Paseo de la Costa",
                "orden": 3
            }
        }
    },
    "salud": {
        "titulo": "Salud",
        "icono": "🏥",
        "descripcion": "Hospitales, centros de salud y farmacias",
        "orden": 3,
        "campos": {
            "descripcion": {
                "tipo": "textarea",
                "label": "Descripción de servicios de salud",
                "placeholder": "Describe la infraestructura de salud de la zona...",
                "orden": 1
            },
            "hospitales": {
                "tipo": "input",
                "label": "Hospitales",
                "placeholder": "Ej: Hospital Municipal de Tigre",
                "orden": 2
            },
            "centros_salud": {
                "tipo": "input",
                "label": "Centros de salud/CAPS",
                "placeholder": "Ej: CAPS N° 1, Centro Médico del Norte",
                "orden": 3
            },
            "farmacias": {
                "tipo": "input",
                "label": "Farmacias",
                "placeholder": "Ej: Farmacia del Puerto, Farmacia 24hs",
                "orden": 4
            }
        }
    },
    "educacion": {
        "titulo": "Educación",
        "icono": "📚",
        "descripcion": "Instituciones educativas de todos los niveles",
        "orden": 4,
        "campos": {
            "descripcion": {
                "tipo": "textarea",
                "label": "Descripción educativa",
                "placeholder": "Describe la oferta educativa de la zona...",
                "orden": 1
            },
            "nivel_inicial": {
                "tipo": "input",
                "label": "Nivel Inicial/Jardín",
                "placeholder": "Ej: Jardín Nr. 1, Jardín del Puerto",
                "orden": 2
            },
            "primario": {
                "tipo": "input",
                "label": "Escuela Primaria",
                "placeholder": "Ej: Escuela Nr. 4, Escuela del Litoral",
                "orden": 3
            },
            "secundario": {
                "tipo": "input",
                "label": "Escuela Secundaria",
                "placeholder": "Ej: Secundarias de Tigre, Instituto técnico",
                "orden": 4
            },
            "universitario": {
                "tipo": "input",
                "label": "Universidad/Terciario",
                "placeholder": "Ej: UADE, UTN, Instituto de formación docente",
                "orden": 5
            }
        }
    },
    "recreacion": {
        "titulo": "Recreación",
        "icono": "🌳",
        "descripcion": "Parques, plazas y áreas deportivas",
        "orden": 5,
        "campos": {
            "descripcion": {
                "tipo": "textarea",
                "label": "Descripción recreativa",
                "placeholder": "Describe las opciones de recreación y espacios verdes...",
                "orden": 1
            },
            "parques": {
                "tipo": "input",
                "label": "Parques",
                "placeholder": "Ej: Parque de la Costa, Parque Natural",
                "orden": 2
            },
            "plazas": {
                "tipo": "input",
                "label": "Plazas",
                "placeholder": "Ej: Plaza Mitre, Plaza San Martín",
                "orden": 3
            },
            "areas_deportivas": {
                "tipo": "input",
                "label": "Áreas deportivas",
                "placeholder": "Ej: Canchas de fútbol, Club náutico, Gimnasios",
                "orden": 4
            }
        }
    },
    "seguridad": {
        "titulo": "Seguridad",
        "icono": "🚔",
        "descripcion": "Comisarías y nivel de seguridad de la zona",
        "orden": 6,
        "campos": {
            "descripcion": {
                "tipo": "textarea",
                "label": "Descripción de seguridad",
                "placeholder": "Describe el nivel de seguridad de la zona...",
                "orden": 1
            },
            "comisaria": {
                "tipo": "input",
                "label": "Comisaría cercana",
                "placeholder": "Ej: Comisaría de Tigre 1ra",
                "orden": 2
            }
        }
    },
    "espacios_verdes": {
        "titulo": "Espacios Verdes",
        "icono": "🌲",
        "descripcion": "Áreas verdes y parques",
        "orden": 7,
        "campos": {
            "descripcion": {
                "tipo": "textarea",
                "label": "Descripción de espacios verdes",
                "placeholder": "Describe las áreas verdes disponibles...",
                "orden": 1
            },
            "parques": {
                "tipo": "input",
                "label": "Parques",
                "placeholder": "Ej: Parque Vías, Reserva natural",
                "orden": 2
            }
        }
    },
    "contaminacion": {
        "titulo": "Contaminación",
        "icono": "🌫️",
        "descripcion": "Nivel de contaminación y ruido ambiental",
        "orden": 8,
        "campos": {
            "descripcion": {
                "tipo": "textarea",
                "label": "Descripción de contaminación",
                "placeholder": "Describe el nivel de contaminación de la zona...",
                "orden": 1
            },
            "nivel_ruido": {
                "tipo": "select",
                "label": "Nivel de ruido",
                "options": ["Bajo", "Medio", "Alto"],
                "orden": 2
            },
            "fuente": {
                "tipo": "input",
                "label": "Fuente de contaminación",
                "placeholder": "Ej: Tráfico vehicular, Industria",
                "orden": 3
            }
        }
    },
    "vida_barrio": {
        "titulo": "Vida del Barrio",
        "icono": "🎭",
        "descripcion": "Bares, restaurantes, cultura y entretenimiento",
        "orden": 9,
        "campos": {
            "descripcion": {
                "tipo": "textarea",
                "label": "Descripción de vida nocturna/cultural",
                "placeholder": "Describe la vida social y cultural del barrio...",
                "orden": 1
            },
            "bares": {
                "tipo": "input",
                "label": "Bares y restaurantes",
                "placeholder": "Ej: Bar del Puerto, Restaurant Delicias",
                "orden": 2
            },
            "cultura": {
                "tipo": "input",
                "label": "Cultura (teatros, museos)",
                "placeholder": "Ej: Teatro Municipal, Museo de la ciudad",
                "orden": 3
            }
        }
    },
    "servicios_financieros": {
        "titulo": "Servicios Financieros",
        "icono": "🏦",
        "descripcion": "Bancos, cajeros y servicios bancarios",
        "orden": 10,
        "campos": {
            "descripcion": {
                "tipo": "textarea",
                "label": "Descripción de servicios financieros",
                "placeholder": "Describe los servicios bancarios disponibles...",
                "orden": 1
            },
            "bancos": {
                "tipo": "input",
                "label": "Bancos",
                "placeholder": "Ej: Banco Nación, Banco Provincia",
                "orden": 2
            },
            "cajeros": {
                "tipo": "input",
                "label": "Cajeros automáticos",
                "placeholder": "Ej: Red Link, Banelco",
                "orden": 3
            }
        }
    }
}


@app.get("/api/entorno/metadata")
def obtener_metadata_entorno():
    """
    Endpoint para obtener los metadatos de campos por rubro.
    Este endpoint es usado por:
    - El CMS (analisis-barrio.js) para generar formularios dinámicos
    - Sitios externos (dantepropiedades.com.ar) para integración
    
    Returns:
        dict con la estructura metadata incluyendo:
        - rubros: definición completa de cada rubro con sus campos
        - categorias_ordenadas: lista de rubros ordenados por importancia
    """
    # Crear lista ordenada de rubros
    rubros_ordenados = sorted(
        [{"key": k, **v} for k, v in RUBRO_METADATA.items()],
        key=lambda x: x.get("orden", 99)
    )
    
    return {
        "success": True,
        "version": "1.0.0",
        "descripcion": "Metadatos de campos para análisis de entorno por rubro",
        "rubros": RUBRO_METADATA,
        "categorias_ordenadas": [r["key"] for r in rubros_ordenados],
        "total_rubros": len(RUBRO_METADATA)
    }


@app.get("/api/entorno/generate-json")
def generar_entorno_json_con_metadata():
    """
    Genera el archivo entorno.json con metadatos incluidos.
    Este endpoint combina:
    1. Los datos de barrios almacenados en la base de datos
    2. Los metadatos de campos (RUBRO_METADATA)
    
    El resultado es un JSON completo con la estructura:
    {
        "metadata": {...},  // Definición de campos por rubro
        "data": {...}       // Datos reales de cada barrio
    }
    
    Este formato es ideal para:
    - Integración con dantepropiedades.com.ar
    - Exportación completa del sistema de análisis de entorno
    """
    conn = get_barrios_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT nombre, data, fecha_actualizacion FROM barrios_data ORDER BY nombre')
    rows = cursor.fetchall()
    conn.close()
    
    if not rows:
        raise HTTPException(status_code=404, detail="No hay barrios registrados")
    
    # Datos de respaldo mejorados por categoría
    FALLBACK_DATA = {
        'transporte': [
            "Estación de tren cercana con conexiones a toda la ciudad",
            "Líneas de colectivo con parada principal en la zona",
            "Acceso fácil a centro de la ciudad",
            "Parada de taxi y remise a pocas cuadras"
        ],
        'educacion': [
            "Escuela primaria pública en el barrio",
            "Instituto secundario cercano",
            "Centro de educación inicial disponible",
            "Universidad o terciario a distancia accesible"
        ],
        'salud': [
            "Centro de atención primaria a pocas cuadras",
            "Farmacia de turno disponible",
            "Consultorios médicos privados en la zona",
            "Hospital público de referencia en zona cercana"
        ],
        'comercio': [
            "Comercio local de barrio con productos frescos",
            "Supermercado mayorista y minorista en zona",
            "Locales comerciales con variedad de rubros",
            "Mercado de frutos del país cercano"
        ],
        'gastronomia': [
            "Restaurante local con comida tradicional",
            "Café y panadería de barrio",
            "Rotisería y local de comidas para llevar",
            "Bar pub con ambiente familiar"
        ],
        'recreacion': [
            "Plaza principal del barrio con juegos",
            "Area verde con jardín y bancos",
            "Club social y deportivo del barrio",
            "Ciclovía y sendero para caminar"
        ],
        'servicios_financieros': [
            "Banco con sucursal en zona",
            "Cajero automático disponible 24hs",
            "Casa de cambios y transferencia",
            "Cooperativa de ahorro y crédito"
        ],
        'seguridad': [
            "Comisaría de barrio con atención",
            "Vigilancia privada en zonas residenciales",
            "Alumbrado público en todas las calles",
            "Vecinos organizados con ronda nocturna"
        ],
        'servicios': [
            "Correo y oficina postal cercana",
            "Centro de atención municipal",
            "Gomería y servicio mecánico",
            "Lavadero y tintorería en zona"
        ]
    }
    
    # Mensajes de respaldo por categoría cuando no hay datos específicos
    FALLBACK_MESSAGES = {
        'transporte': "Transporte público disponible con fácil acceso a distintas zonas de la ciudad",
        'educacion': "Cuenta con instituciones educativas para todos los niveles en el barrio o zonas cercanas",
        'salud': "Servicios de salud accesibles con centros de atención primaria y farmacias en la zona",
        'comercio': "Variedad de comercios locales que satisfacen las necesidades cotidianas",
        'gastronomia': "Opciones gastronómicas variadas con locales de comida tradicional y modernos",
        'recreacion': "Espacios de recreación y áreas verdes para actividades al aire libre",
        'servicios_financieros': "Servicios bancarios y financieros disponibles en la zona",
        'seguridad': "Nivel de seguridad estándar con presencia policial y vigilancia comunitaria",
        'servicios': "Servicios generales y utilitarios disponibles en el barrio"
    }
    
    # Transformar datos al formato de entorno.json para el frontend
    entorno_data = {}
    
    for row in rows:
        nombre = row['nombre']
        data = json.loads(row['data'])
        fecha = row['fecha_actualizacion']
        nombre_title = nombre.title()
        
        # Mapeo de campos del backend al formato frontend
        field_mappings = {
            'transporte': ['estaciones_cercanas', 'lineas_colectivo', 'descripcion'],
            'educacion': ['escuelas', 'universidades', 'colegios'],
            'salud': ['hospitales', 'centros_salud', 'clinicas', 'farmacias'],
            'comercio': ['supermercados', 'centros_comerciales', 'tiendas'],
            'gastronomia': ['bares_restaurantes', 'restaurantes', 'cafeterias'],
            'recreacion': ['plazas', 'parques', 'espacios_verdes', 'actividades'],
            'servicios_financieros': ['bancos', 'cajeros', 'servicios'],
            'seguridad': ['comisarias', 'seguridad'],
            'servicios': ['farmacias', 'centros_servicios', 'otros_servicios']
        }
        
        # Convertir datos al formato requerido
        barrio_json = {
            'nombre': nombre_title,
            'descripcion_general': data.get('resumen_general', data.get('perfil_barrio', f"{nombre_title} es un barrio con características propias de la zona norte del Gran Buenos Aires, ofreciendo una combinación de residentialidad y servicios locales.")),
            'fecha_actualizacion': fecha
        }
        
        for cat_key, fields in field_mappings.items():
            cat_data = data.get('categorias', {}).get(cat_key, {}) if 'categorias' in data else data.get(cat_key, {})
            
            # Extraer items de los campos disponibles
            items = []
            for field_name in fields:
                if field_name in cat_data and cat_data[field_name]:
                    value = cat_data[field_name]
                    if isinstance(value, list):
                        items.extend([str(v).strip() for v in value if v])
                    elif isinstance(value, str) and value.strip():
                        parts = [p.strip() for p in value.split(',') if p.strip()]
                        items.extend(parts)
            
            # Si hay items, usarlos; si no, proporcionar fallback mejorado
            if items:
                # Filtrar duplicados manteniendo el orden
                seen = set()
                unique_items = []
                for item in items:
                    item_lower = item.lower()
                    if item_lower not in seen:
                        seen.add(item_lower)
                        unique_items.append(item)
                barrio_json[cat_key] = unique_items
            else:
                # Usar datos de respaldo específicos por categoría
                barrio_json[cat_key] = FALLBACK_DATA.get(cat_key, FALLBACK_DATA['servicios']).copy()
        
        entorno_data[nombre] = barrio_json
    
    # Crear respuesta completa con metadata
    response = {
        "metadata": {
            "version": "1.0.0",
            "generado_el": datetime.now().isoformat(),
            "descripcion": "Archivo completo de análisis de entorno con metadatos de campos",
            "total_barrios": len(entorno_data),
            "rubros": RUBRO_METADATA
        },
        "data": entorno_data
    }
    
    return response
