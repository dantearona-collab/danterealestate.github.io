"""
API de Gestión de Barrios para Dante Propiedades
CRUD completo con integración Gemini AI
"""
import os
import json
import sqlite3
import re
from datetime import datetime
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from pathlib import Path

# Importar Gemini client
from logic.gemini_client import call_gemini_with_rotation

# Paths
DB_PATH = os.environ.get('DB_PATH', 'instance/dante_properties.db')

# ============================================
# MODELOS DE DATOS
# ============================================

class BarrioCreateRequest(BaseModel):
    """Request para crear un nuevo barrio"""
    nombre: str = Field(..., min_length=1, max_length=100, description="Nombre del barrio")
    generar_ia: bool = Field(default=True, description="Si es True, genera datos con IA")

class BarrioUpdateRequest(BaseModel):
    """Request para actualizar un barrio"""
    data: Dict[str, Any] = Field(..., description="Datos completos del barrio en formato JSON")
    actualizado_por: Optional[str] = Field(default="admin", description="Usuario que actualiza")

class BarrioResponse(BaseModel):
    """Response de un barrio"""
    nombre: str
    data: Dict[str, Any]
    actualizado_por: str
    fecha_actualizacion: str

# ============================================
# UTILIDADES DE BASE DE DATOS
# ============================================

def get_db_connection():
    """Obtiene conexión a la base de datos"""
    Path(os.path.dirname(DB_PATH)).mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_barrios_db():
    """Inicializa la tabla de barrios si no existe"""
    conn = get_db_connection()
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

# ============================================
# GENERACIÓN CON GEMINI AI
# ============================================

def generar_datos_barrio_ai(nombre_barrio: str) -> Dict[str, Any]:
    """
    Genera datos completos de un barrio usando Gemini AI
    """
    prompt = f"""
Eres un experto analista inmobiliario de Buenos Aires, Argentina. Genera un análisis completo del barrio '{nombre_barrio}' en formato JSON con la siguiente estructura:

{{
    "resumen_general": "Breve resumen del perfil del barrio (2-3 oraciones)",
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
"""
    
    print(f"🤖 Generando datos con IA para: {nombre_barrio}")
    
    try:
        ai_response = call_gemini_with_rotation(prompt)
        
        # Limpiar respuesta
        clean_response = ai_response.strip()
        if clean_response.startswith('```json'):
            clean_response = clean_response[7:]
        elif clean_response.startswith('```'):
            clean_response = clean_response[3:]
        if clean_response.endswith('```'):
            clean_response = clean_response[:-3]
        
        clean_response = clean_response.strip()
        
        # Parsear JSON
        data = json.loads(clean_response)
        
        print(f"✅ Datos generados para: {nombre_barrio}")
        return data
        
    except json.JSONDecodeError as e:
        print(f"❌ Error parseando JSON: {e}")
        raise ValueError(f"Error al generar datos: {str(e)}")
    except Exception as e:
        print(f"❌ Error generando datos: {e}")
        raise

# ============================================
# API ENDPOINTS
# ============================================

# Inicializar base de datos
init_barrios_db()

# Crear sub-app para evitar conflictos con main-ai.py
barrios_app = FastAPI(
    title="Dante Propiedades - API Barrios",
    description="API para gestión de datos de barrios",
    version="1.0.0"
)

# Configuración CORS
barrios_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@barrios_app.get("/")
def root():
    """Raíz de la API"""
    return {
        "status": "ok",
        "message": "Dante Propiedades - API Barrios",
        "version": "1.0.0"
    }

@barrios_app.get("/api/barrios")
def listar_barrios():
    """
    Lista todos los barrios disponibles
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT nombre, fecha_actualizacion 
        FROM barrios_data 
        ORDER BY nombre
    ''')
    
    rows = cursor.fetchall()
    conn.close()
    
    barrios = [row['nombre'] for row in rows]
    
    return {
        "success": True,
        "total": len(barrios),
        "barrios": barrios
    }

@barrios_app.get("/api/barrios/{nombre}")
def obtener_barrio(nombre: str):
    """
    Obtiene los datos de un barrio específico
    """
    conn = get_db_connection()
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
    
    return {
        "success": True,
        "data": json.loads(row['data'])
    }

@barrios_app.post("/api/barrios")
def crear_barrio(request: BarrioCreateRequest):
    """
    Crea un nuevo barrio. Si generar_ia=True, usa Gemini para crear los datos.
    """
    nombre = request.nombre.strip().lower()
    nombre_display = request.nombre.strip()
    
    conn = get_db_connection()
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
        ''', (nombre, data_json, 'admin'))
        
        conn.commit()
        conn.close()
        
        return {
            "success": True,
            "message": f"Barrio '{nombre_display}' creado exitosamente",
            "source": "ai" if request.generar_ia else "manual",
            "data": data
        }
        
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))

@barrios_app.put("/api/barrios/{nombre}")
def actualizar_barrio(nombre: str, request: BarrioUpdateRequest):
    """
    Actualiza los datos de un barrio existente
    """
    nombre = nombre.lower().strip()
    
    conn = get_db_connection()
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

@barrios_app.post("/api/barrios/{nombre}/regenerate")
def regenerar_barrio_ai(nombre: str):
    """
    Regenera los datos de un barrio usando Gemini AI
    """
    nombre_display = nombre.strip()
    nombre_db = nombre.strip().lower()
    
    conn = get_db_connection()
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
        
        return {
            "success": True,
            "message": f"Barrio '{nombre_display}' regenerado con IA",
            "data": data
        }
        
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))

@barrios_app.delete("/api/barrios/{nombre}")
def eliminar_barrio(nombre: str):
    """
    Elimina un barrio de la base de datos
    """
    nombre = nombre.lower().strip()
    
    conn = get_db_connection()
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

@barrios_app.get("/api/barrios/{nombre}/exists")
def verificar_barrio(nombre: str):
    """
    Verifica si un barrio existe en la base de datos
    """
    nombre = nombre.lower().strip()
    
    conn = get_db_connection()
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

# ============================================
# INICIO
# ============================================

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run(barrios_app, host="0.0.0.0", port=port, reload=False)
