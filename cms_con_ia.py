"""
CMS Dante Propiedades - Gestión de Barrios
Usa entorno.json como base de datos
Compatible con dantepropiedades.com.ar

Usage:
    python cms_con_ia.py
"""

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os
import json
from datetime import datetime
from typing import Dict, Optional

# ================================================================
# CONFIGURACIÓN
# ================================================================

# API Keys (opcional - para generar datos con IA)
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

# Ruta del archivo entorno.json (en la raíz del proyecto)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# Buscar backend/ primero para los archivos del frontend
BACKEND_DIR = SCRIPT_DIR
if os.path.exists(os.path.join(SCRIPT_DIR, "backend")):
    BACKEND_DIR = os.path.join(SCRIPT_DIR, "backend")

ENTORNO_FILE = os.path.join(SCRIPT_DIR, "entorno.json")
BACKUP_FILE = os.path.join(SCRIPT_DIR, "entorno_backup.json")
PROPIEDADES_FILE = os.path.join(SCRIPT_DIR, "propiedades.json")

app = FastAPI(
    title="CMS Dante Propiedades",
    description="Gestión de datos de barrios",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================================================================
# FUNCIONES DE ARCHIVO JSON
# ================================================================

def load_entorno() -> dict:
    """Carga el archivo entorno.json"""
    try:
        with open(ENTORNO_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return {}

def save_entorno(data: dict) -> bool:
    """Guarda el archivo entorno.json"""
    try:
        # Crear backup antes de guardar
        if os.path.exists(ENTORNO_FILE):
            import shutil
            shutil.copy(ENTORNO_FILE, BACKUP_FILE)
        
        with open(ENTORNO_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"Error guardando entorno.json: {e}")
        return False

def get_barrio_from_entorno(nombre: str) -> Optional[dict]:
    """Obtiene un barrio del archivo entorno.json y lo convierte al formato del frontend"""
    data = load_entorno()
    key = nombre.lower().strip()
    
    # Buscar coincidencia exacta o parcial
    for k, v in data.items():
        if k.lower() == key:
            # Convertir formato entorno.json al formato que espera el frontend
            barrio_convertido = convertir_a_formato_frontend(v)
            return {"nombre": k, "data": barrio_convertido}
    
    return None

def calcular_puntuacion(items: list) -> int:
    """Calcula una puntuación basada en la cantidad y calidad de items"""
    if not items:
        return 30  # Muy poca información
    
    count = len(items)
    
    # Base puntuación según cantidad
    if count <= 2:
        base = 40
    elif count <= 4:
        base = 55
    elif count <= 6:
        base = 65
    elif count <= 8:
        base = 75
    else:
        base = 85
    
    # Ajustar por longitud del contenido
    total_chars = sum(len(str(item)) for item in items)
    avg_length = total_chars / count if count > 0 else 0
    
    if avg_length > 100:
        bonus = 10
    elif avg_length > 50:
        bonus = 5
    else:
        bonus = 0
    
    return min(95, base + bonus)


def convertir_a_formato_frontend(entorno_data: dict) -> dict:
    """Convierte datos del formato entorno.json al formato del frontend CMS"""
    
    # Construir categorias con campos individuales (no arrays)
    categorias = {}
    
    # Mapeo de rubros
    rubro_campos = {
        "transporte": ["estaciones", "colectivos"],
        "comercio": ["supermercados", "centros"],
        "seguridad": ["comisaria", "rating"],
        "educacion": ["escuelas", "universidades"],
        "salud": ["hospitales", "centros_salud"],
        "espacios_verdes": ["parques"],
        "contaminacion": ["nivel_ruido", "fuente"],
        "vida_barrio": ["bares", "cultura"],
        "gastronomia": ["restaurantes", "zonas"],
        "servicios_financieros": ["bancos", "cajeros"],
        "recreacion": []
    }
    
    # Generar categorias
    for rubro, campos_extra in rubro_campos.items():
        if rubro in entorno_data and isinstance(entorno_data[rubro], list):
            items = entorno_data[rubro]
            puntuacion = calcular_puntuacion(items)
            descripcion_completa = "; ".join(items) if items else ""
            
            categoria = {
                "puntuacion": puntuacion,
                "descripcion": descripcion_completa
            }
            
            # Extraer campos específicos basados en el contenido
            if rubro == "transporte":
                categoria["estaciones"] = ", ".join([i for i in items if "Estación" in i or "Línea" in i or "Subte" in i][:3])
                categoria["colectivos"] = ", ".join([i for i in items if "colectivo" in i.lower() or "línea" in i.lower()][:3])
            elif rubro == "educacion":
                categoria["escuelas"] = ", ".join([i for i in items if "Escuela" in i or "Colegio" in i or "Instituto" in i][:3])
                categoria["universidades"] = ", ".join([i for i in items if "Universidad" in i][:2])
            elif rubro == "salud":
                categoria["hospitales"] = ", ".join([i for i in items if "Hospital" in i][:2])
                categoria["centros_salud"] = ", ".join([i for i in items if "Centro" in i or "Clínica" in i][:2])
            elif rubro == "gastronomia":
                categoria["restaurantes"] = ", ".join([i for i in items if "Restaurante" in i or "Café" in i or "Bar" in i][:3])
                categoria["zonas"] = "Florida, Corrientes"
            elif rubro == "servicios_financieros":
                categoria["bancos"] = ", ".join([i for i in items if "Banco" in i][:5])
                categoria["cajeros"] = "Banelco, Link"
            elif rubro == "seguridad":
                categoria["comisaria"] = items[0] if items else ""
                categoria["rating"] = "4"
            elif rubro == "espacios_verdes":
                categoria["parques"] = ", ".join([i for i in items if "Plaza" in i or "Parque" in i][:2])
            elif rubro == "contaminacion":
                categoria["nivel_ruido"] = "Medio"
                categoria["fuente"] = items[0] if items else ""
            elif rubro == "vida_barrio":
                categoria["bares"] = ", ".join([i for i in items if "Bar" in i][:2])
                categoria["cultura"] = ", ".join([i for i in items if "Teatro" in i or "Cultural" in i or "Museo" in i][:2])
            
            categorias[rubro] = categoria
        else:
            categorias[rubro] = {
                "puntuacion": 30,
                "descripcion": "",
                "estaciones": "",
                "colectivos": ""
            }
    
    # Calcular puntuación general como promedio
    puntuaciones = [cat.get("puntuacion", 50) for cat in categorias.values()]
    puntuacion_general = sum(puntuaciones) // len(puntuaciones) if puntuaciones else 50
    
    # Construir respuesta
    return {
        "nombre": entorno_data.get("nombre", ""),
        "resumen": entorno_data.get("descripcion_general", ""),
        "conclusion": entorno_data.get("conclusion", ""),
        "categorias": categorias,
        "puntuacion_general": puntuacion_general,
        "existe": True,
        "fecha_actualizacion": entorno_data.get("fecha_actualizacion", "")
    }

def convertir_a_formato_entorno(frontend_data: dict) -> dict:
    """Convierte datos del formato frontend al formato entorno.json"""
    
    # Extraer campos base
    resultado = {
        "nombre": frontend_data.get("nombre", ""),
        "descripcion_general": frontend_data.get("resumen", ""),
        "conclusion": frontend_data.get("conclusion", ""),
        "fecha_actualizacion": datetime.now().strftime("%Y-%m-%d")
    }
    
    # Convertir categorias a arrays
    categorias = frontend_data.get("categorias", {})
    for rubro, datos in categorias.items():
        if isinstance(datos, dict) and "items" in datos:
            resultado[rubro] = datos["items"]
        elif isinstance(datos, dict):
            # Si no tiene items, crear array desde descripcion o laissé vacío
            descripcion = datos.get("descripcion", "")
            resultado[rubro] = [descripcion] if descripcion else []
        else:
            resultado[rubro] = []
    
    return resultado

def list_barrios() -> list:
    """Lista todos los barrios"""
    data = load_entorno()
    return list(data.keys())

# ================================================================
# API ENDPOINTS
# ================================================================

@app.on_event("startup")
async def startup():
    """Verificar que existe entorno.json"""
    if not os.path.exists(ENTORNO_FILE):
        print(f"⚠️ No existe {ENTORNO_FILE}. Se creará vacío.")
        save_entorno({})
    print(f"✅ CMS cargado: {ENTORNO_FILE}")
    print("🌐 Servidor: http://localhost:8001")
    print(f"📁 Frontend: {BACKEND_DIR}")

@app.get("/")
async def root():
    """Servir el frontend del CMS"""
    index_path = os.path.join(BACKEND_DIR, "analisis-barrio.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    # Fallback a index.html
    index_path = os.path.join(BACKEND_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    raise HTTPException(status_code=404, detail="Frontend no encontrado")

@app.get("/api/barrios")
async def listar_barrios():
    """Lista todos los barrios"""
    barrios = list_barrios()
    return {"success": True, "barrios": barrios, "total": len(barrios)}

@app.get("/api/barrios/{nombre}")
async def obtener_barrio(nombre: str):
    """Obtiene un barrio específico"""
    result = get_barrio_from_entorno(nombre)
    if result:
        return {
            "success": True,
            "nombre": result["nombre"],
            "data": result["data"]
        }
    raise HTTPException(status_code=404, detail=f"Barrio '{nombre}' no encontrado")

@app.post("/api/barrios")
async def crear_barrio(request: Request):
    """
    Crea un nuevo barrio. Si generar_ia es True, intenta generar datos con IA.
    Si falla o generar_ia es False, crea el barrio con datos vacíos.
    """
    data = await request.json()
    nombre = data.get('nombre', '').strip()
    generar_ia = data.get('generar_ia', False)
    
    if not nombre:
        raise HTTPException(status_code=400, detail="El nombre del barrio es obligatorio")
    
    nombre_lower = nombre.lower()
    
    # Verificar si ya existe
    existing = get_barrio_from_entorno(nombre_lower)
    if existing:
        raise HTTPException(status_code=400, detail=f"'{existing['nombre']}' ya existe")
    
    # Crear datos básicos del barrio
    barrio_data = {
        "nombre": nombre.title(),
        "descripcion_general": data.get('descripcion_general', '') or data.get('perfil_barrio', ''),
        "conclusion": data.get('conclusion', ''),
        "fecha_actualizacion": datetime.now().strftime("%Y-%m-%d"),
        "transporte": [],
        "educacion": [],
        "salud": [],
        "comercio": [],
        "gastronomia": [],
        "recreacion": [],
        "servicios_financieros": [],
        "seguridad": [],
        "espacios_verdes": [],
        "contaminacion": [],
        "vida_barrio": [],
        "generado_por_ia": False
    }
    
    # Si se solicita generación con IA y hay API key disponible
    if generar_ia and (OPENAI_API_KEY or GEMINI_API_KEY):
        try:
            # Intentar generar con IA
            from backend.logic.environment_analyzer import EnvironmentAnalyzer
            
            analyzer = EnvironmentAnalyzer()
            ai_data = analyzer.generate_analysis(nombre)
            
            if ai_data and not ai_data.get('error'):
                # Usar datos generados por IA
                barrio_data.update({
                    "descripcion_general": ai_data.get('descripcion_general', ''),
                    "transporte": ai_data.get('transporte', []),
                    "educacion": ai_data.get('educacion', []),
                    "salud": ai_data.get('salud', []),
                    "comercio": ai_data.get('comercio', []),
                    "gastronomia": ai_data.get('gastronomia', []),
                    "servicios_financieros": ai_data.get('servicios_financieros', []),
                    "seguridad": ai_data.get('seguridad', []),
                    "espacios_verdes": ai_data.get('espacios_verdes', []),
                    "contaminacion": ai_data.get('contaminacion', []),
                    "vida_barrio": ai_data.get('vida_barrio', []),
                    "generado_por_ia": True
                })
        except Exception as e:
            print(f"⚠️ Error generando con IA: {e}")
            # Continuar con datos vacíos
    
    # Guardar en entorno.json
    entorno = load_entorno()
    entorno[nombre_lower] = barrio_data
    save_entorno(entorno)
    
    return {
        "success": True,
        "message": f"Barrio '{nombre}' creado",
        "nombre": nombre_lower,
        "data": barrio_data,
        "generado_por_ia": barrio_data.get('generado_por_ia', False)
    }

@app.post("/api/barrios/manual")
async def crear_barrio_manual(request: Request):
    """
    Crea un nuevo barrio manualmente sin usar IA.
    Recibe todos los datos del barrio en el cuerpo de la petición.
    """
    data = await request.json()
    nombre = data.get('nombre', '').strip()
    
    if not nombre:
        raise HTTPException(status_code=400, detail="El nombre del barrio es obligatorio")
    
    nombre_lower = nombre.lower()
    
    # Verificar si ya existe
    existing = get_barrio_from_entorno(nombre_lower)
    if existing:
        raise HTTPException(status_code=400, detail=f"'{existing['nombre']}' ya existe")
    
    # Crear barrio con datos proporcionados o datos vacíos
    barrio_data = {
        "nombre": nombre.title(),
        "descripcion_general": data.get('perfil_barrio', '') or data.get('descripcion_general', ''),
        "conclusion": data.get('conclusion', ''),
        "fecha_actualizacion": datetime.now().strftime("%Y-%m-%d"),
        "transporte": data.get('transporte', []),
        "educacion": data.get('educacion', []),
        "salud": data.get('salud', []),
        "comercio": data.get('comercio', []),
        "gastronomia": data.get('gastronomia', []),
        "recreacion": data.get('recreacion', []),
        "servicios_financieros": data.get('servicios_financieros', []),
        "seguridad": data.get('seguridad', []),
        "espacios_verdes": data.get('espacios_verdes', []),
        "contaminacion": data.get('contaminacion', []),
        "vida_barrio": data.get('vida_barrio', []),
        "generado_por_ia": False,
        "actualizado_por": "admin"
    }
    
    # Guardar en entorno.json
    entorno = load_entorno()
    entorno[nombre_lower] = barrio_data
    save_entorno(entorno)
    
    return {
        "success": True,
        "message": f"Barrio '{nombre}' creado manualmente",
        "nombre": nombre_lower,
        "data": barrio_data
    }

@app.put("/api/barrios/{nombre}")
async def actualizar_barrio(nombre: str, request: Request):
    """Actualiza un barrio existente"""
    nombre_lower = nombre.lower().strip()
    
    # Verificar que existe
    existing = get_barrio_from_entorno(nombre_lower)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Barrio '{nombre}' no encontrado")
    
    new_data = await request.json()
    
    # Obtener datos anidados
    data = new_data.get("data", new_data)
    
    # Convertir al formato entorno.json
    barrio_convertido = convertir_a_formato_entorno(data)
    
    # Actualizar en el entorno
    entorno = load_entorno()
    entorno[nombre_lower] = barrio_convertido
    save_entorno(entorno)
    
    return {
        "success": True,
        "message": f"Barrio '{nombre}' actualizado",
        "data": barrio_convertido
    }

@app.delete("/api/barrios/{nombre}")
async def eliminar_barrio(nombre: str):
    """Elimina un barrio"""
    nombre_lower = nombre.lower().strip()
    
    entorno = load_entorno()
    
    if nombre_lower not in entorno:
        raise HTTPException(status_code=404, detail=f"Barrio '{nombre}' no encontrado")
    
    del entorno[nombre_lower]
    save_entorno(entorno)
    
    return {
        "success": True,
        "message": f"Barrio '{nombre}' eliminado"
    }

@app.get("/api/entorno/metadata")
async def obtener_metadata():
    """Retorna metadatos para formularios dinámicos"""
    return {
        "version": "1.0",
        "rubros": {
            "transporte": {"nombre": "Transporte", "icono": "bus"},
            "educacion": {"nombre": "Educación", "icono": "graduation-cap"},
            "salud": {"nombre": "Salud", "icono": "hospital"},
            "comercio": {"nombre": "Comercio", "icono": "shopping-cart"},
            "gastronomia": {"nombre": "Gastronomía", "icono": "utensils"},
            "recreacion": {"nombre": "Recreación", "icono": "futbol"},
            "servicios_financieros": {"nombre": "Servicios Financieros", "icono": "university"},
            "seguridad": {"nombre": "Seguridad", "icono": "shield-alt"},
            "espacios_verdes": {"nombre": "Espacios Verdes", "icono": "tree"},
            "contaminacion": {"nombre": "Contaminación", "icono": "smog"},
            "vida_barrio": {"nombre": "Vida del Barrio", "icono": "users"}
        },
        "campos_base": ["nombre", "descripcion_general", "conclusion"],
        "categorias_ordenadas": ["transporte", "educacion", "salud", "comercio", "gastronomia", "recreacion", "servicios_financieros", "seguridad", "espacios_verdes", "contaminacion", "vida_barrio"]
    }

@app.get("/api/entorno/download")
async def descargar_entorno():
    """Genera y permite descargar entorno.json actualizado"""
    entorno = load_entorno()
    
    return JSONResponse(
        content=entorno,
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename=entorno.json"}
    )

@app.get("/health")
async def health():
    """Health check"""
    return {
        "status": "healthy",
        "service": "cms-dante",
        "entorno_file": ENTORNO_FILE,
        "barrios_count": len(list_barrios())
    }

# ================================================================
# ARCHIVOS ESTÁTICOS
# ================================================================

# Servir archivos estáticos desde backend/
if os.path.exists(BACKEND_DIR):
    app.mount("/static", StaticFiles(directory=BACKEND_DIR), name="static")

# ================================================================
# INTEGRACIÓN DE ESTADÍSTICAS DE MERCADO
# ================================================================

def integrate_market_stats(app):
    """Integra el módulo de estadísticas de mercado con el CMS"""
    try:
        # Importar el analizador de mercado
        from backend.logic.market_analyzer import LocalMarketAnalyzer, integrate_with_cms as integrate_stats
        
        # Integrar endpoints de estadísticas
        integrate_stats(app)
        print("✅ Módulo de Estadísticas de Mercado integrado")
        return True
    except ImportError as e:
        print(f"⚠️ No se pudo integrar módulo de estadísticas: {e}")
        return False
    except Exception as e:
        print(f"❌ Error integrando módulo de estadísticas: {e}")
        return False

# Ejecutar integración de estadísticas ANTES del catch-all route
integrate_market_stats(app)

# ================================================================
# CATCH-ALL ROUTE (AL FINAL DE LAS RUTAS)
# ================================================================

@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    """Serve frontend files - Only for non-API paths"""
    # Las rutas API deben ser manejadas por otras funciones
    if full_path.startswith("api/"):
        # Si llegamos aquí, es porque no existe la ruta API
        raise HTTPException(status_code=404, detail="API route not found")
    
    # Verificar si es un archivo que existe
    requested_path = os.path.join(BACKEND_DIR, full_path)
    if os.path.exists(requested_path) and os.path.isfile(requested_path):
        return FileResponse(requested_path)
    
    # Servir index.html para SPA (solo si no es API)
    index_path = os.path.join(BACKEND_DIR, "analisis-barrio.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    
    raise HTTPException(status_code=404, detail="Archivo no encontrado")

# ================================================================
# EJECUCIÓN
# ================================================================

if __name__ == "__main__":
    import uvicorn
    
    print("=" * 50)
    print("CMS Dante Propiedades - Gestión de Barrios")
    print("=" * 50)
    print(f"📁 Entorno: {ENTORNO_FILE}")
    print(f"📁 Frontend: {BACKEND_DIR}")
    print(f"🌐 Servidor: http://localhost:8001")
    print("=" * 50)
    
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=False)
