"""
Dante Propiedades API - VERSIÓN COMPLETA CON TODOS LOS PASOS
"""

import os
import json
import re
import time
import sqlite3
import subprocess
import sys



from threading import Thread
from pathlib import Path
from datetime import datetime
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from backend.logic.gemini_client import call_gemini_with_rotation, build_prompt
from backend.logic.database import query_properties, get_historial_canal, log_conversation
from backend.logic.filters import detect_filters
from backend.logic.filter_data import BARRIOS, OPERACIONES, TIPOS
from backend.logic.environ_database import (
    init_environ_analysis_db, get_environ_analysis, save_environ_analysis,
    is_environ_analysis_expired, log_environ_analysis_request
)
from logic.barrio_data import get_gastronomy_info, get_financial_info
from logic.gemini_client import call_gemini_with_rotation

# ============================================
# CONFIGURACIÓN
# ============================================

BARRIOS_DB_PATH = 'instance/barrios_data.db'

def get_barrios_db_connection():
    Path(os.path.dirname(BARRIOS_DB_PATH)).mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(BARRIOS_DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

# ============================================
# MODELOS DE DATOS
# ============================================

class BarrioCreateRequest(BaseModel):
    nombre: str
    generar_ia: bool = False

class BarrioUpdateRequest(BaseModel):
    data: dict
    actualizado_por: str = "admin"

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
    moneda_precio: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    channel: str = "web"
    filters: Optional[dict] = None
    contexto_anterior: Optional[dict] = None
    es_seguimiento: bool = False

class ChatResponse(BaseModel):
    response: str
    results_count: Optional[int] = None
    search_performed: bool
    propiedades: Optional[List[PropertyResponse]] = None

# ============================================
# 🆕 MODELOS PARA ANÁLISIS DE MERCADO (AGREGAR ESTOS)
# ============================================

class MarketAnalysisRequest(BaseModel):
    barrio: str
    search_results: Optional[List[dict]] = None

class PropertyComparisonRequest(BaseModel):
    propiedad_id: Optional[str] = None
    propiedad: Optional[dict] = None

class ValuationRequest(BaseModel):
    barrio: str
    tipo: str
    ambientes: int
    estado: str
    operacion: str = "venta"

    
# ============================================
# FUNCIÓN PARA EXPORTAR JSON
# ============================================

# En main-ai.py - IMPORTAR LOS DATOS DE barrio_data.py
from logic.barrio_data import (
    GASTRONOMY_DATA, 
    FINANCIAL_DATA, 
    LOCATION_SPECIFIC_DATA,
    get_gastronomy_info,
    get_financial_info,
    get_location_specific_info
)

def generar_entorno_json():
    """
    Genera entorno.json PRIORIZANDO los datos editados en el CMS
    - Usa valores de la BD si existen (lo que editó el usuario)
    - Usa valores de barrio_data.py SOLO como respaldo
    - Todas las puntuaciones son modificables manualmente
    """
    try:
        conn = get_barrios_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT nombre, data FROM barrios_data ORDER BY nombre')
        rows = cursor.fetchall()
        conn.close()
        
        data = {}
        
        for row in rows:
            nombre = row['nombre']
            try:
                datos_bd = json.loads(row['data'])
            except:
                datos_bd = {}
            
            nombre_display = nombre.title()
            
            # ========================================
            # DATOS DE LA BD (LO QUE EDITÓ EL USUARIO)
            # ========================================
            resumen_general = datos_bd.get('resumen_general', '')
            conclusion = datos_bd.get('conclusion', '')
            categorias_bd = datos_bd.get('categorias', {})
            
            # ========================================
            # DATOS DE RESPALDO (desde barrio_data.py)
            # ========================================
            gastronomia_respaldo = get_gastronomy_info(nombre)
            financiero_respaldo = get_financial_info(nombre)
            
            # ========================================
            # 1. GASTRONOMÍA - Prioridad BD, respaldo si no existe
            # ========================================
            # Gastronomía - CORREGIDO para aceptar ambos nombres de campo
            gastronomia = {}
            if 'gastronomia' in categorias_bd:
                cat = categorias_bd['gastronomia']
                
                # Obtener restaurantes (puede venir como 'restaurantes' o 'restaurantes_destacados')
                restaurantes = []
                if 'restaurantes' in cat and cat['restaurantes']:
                    restaurantes = cat['restaurantes']
                elif 'restaurantes_destacados' in cat and cat['restaurantes_destacados']:
                    restaurantes = cat['restaurantes_destacados']
                
                # Obtener zonas (puede venir como 'zonas' o 'zonas_gastronomicas')
                zonas = []
                if 'zonas' in cat and cat['zonas']:
                    zonas = cat['zonas']
                elif 'zonas_gastronomicas' in cat and cat['zonas_gastronomicas']:
                    zonas = cat['zonas_gastronomicas']
                
                gastronomia = {
                    'puntuacion': cat.get('puntuacion', 50),
                    'descripcion': cat.get('descripcion', ''),
                    'restaurantes_destacados': restaurantes,
                    'zonas_gastronomicas': zonas
                }
                print(f"🍽️ {nombre}: Gastronomía mapeada - restaurantes: {restaurantes}")
            else:
                # Usar datos de respaldo
                gastronomia = {
                    'puntuacion': gastronomia_respaldo.get('puntuacion', 50),
                    'descripcion': gastronomia_respaldo.get('descripcion', ''),
                    'restaurantes_destacados': gastronomia_respaldo.get('restaurantes_destacados', [])[:5],
                    'zonas_gastronomicas': gastronomia_respaldo.get('zonas_gastronomicas', [])[:3]
                }
                print(f"🍽️ {nombre}: Usando gastronomía de RESPALDO (puntuación: {gastronomia['puntuacion']})")
            
            # ========================================
            # 2. SERVICIOS FINANCIEROS - Prioridad BD, respaldo si no existe
            # ========================================
            servicios_financieros = {}
            if 'servicios_financieros' in categorias_bd and categorias_bd['servicios_financieros'].get('puntuacion'):
                # Usar datos editados en CMS
                cat = categorias_bd['servicios_financieros']
                servicios_financieros = {
                    'puntuacion': cat.get('puntuacion', 50),
                    'descripcion': cat.get('descripcion', ''),
                    'bancos': cat.get('bancos', []),
                    'cajeros_automaticos': cat.get('cajeros_automaticos', []),
                    'sucursales_bancarias': cat.get('sucursales_bancarias', []),
                    'otros_servicios': cat.get('otros_servicios', [])
                }
                print(f"🏦 {nombre}: Usando finanzas EDITADAS (puntuación: {servicios_financieros['puntuacion']})")
            else:
                # Usar datos de respaldo
                servicios_financieros = {
                    'puntuacion': financiero_respaldo.get('puntuacion', 50),
                    'descripcion': financiero_respaldo.get('descripcion', 
                        f"{nombre_display} cuenta con servicios bancarios."),
                    'bancos': financiero_respaldo.get('bancos', [])[:5],
                    'cajeros_automaticos': financiero_respaldo.get('cajeros_automaticos', [])[:3],
                    'sucursales_bancarias': financiero_respaldo.get('sucursales_bancarias', [])[:3],
                    'otros_servicios': financiero_respaldo.get('otros_servicios', [])[:3]
                }
                print(f"🏦 {nombre}: Usando finanzas de RESPALDO (puntuación: {servicios_financieros['puntuacion']})")
            
            # ========================================
            # 3. TRANSPORTE
            # ========================================
            transporte = {}
            if 'transporte' in categorias_bd:
                cat = categorias_bd['transporte']
                transporte = {
                    'puntuacion': cat.get('puntuacion', 50),
                    'descripcion': cat.get('descripcion', ''),
                    'estaciones': cat.get('estaciones', []),
                    'colectivos': cat.get('colectivos', [])
                }
            else:
                transporte = {
                    'puntuacion': 50,
                    'descripcion': f"Información de transporte en actualización para {nombre_display}.",
                    'estaciones': [],
                    'colectivos': []
                }
            
            # ========================================
            # 4. COMERCIO
            # ========================================
            comercio = {}
            if 'comercio' in categorias_bd:
                cat = categorias_bd['comercio']
                comercio = {
                    'puntuacion': cat.get('puntuacion', 50),
                    'descripcion': cat.get('descripcion', ''),
                    'supermercados': cat.get('supermercados', []),
                    'centros_comerciales': cat.get('centros_comerciales', [])
                }
            else:
                comercio = {
                    'puntuacion': 50,
                    'descripcion': f"Comercios y servicios en {nombre_display}.",
                    'supermercados': [],
                    'centros_comerciales': []
                }
            
            # ========================================
            # 5. SEGURIDAD
            # ========================================
            seguridad = {}
            if 'seguridad' in categorias_bd:
                cat = categorias_bd['seguridad']
                seguridad = {
                    'puntuacion': cat.get('puntuacion', 50),
                    'descripcion': cat.get('descripcion', ''),
                    'comisaria': cat.get('comisaria', '')
                }
            else:
                seguridad = {
                    'puntuacion': 50,
                    'descripcion': f"Información de seguridad para {nombre_display}.",
                    'comisaria': ''
                }
            
            # ========================================
            # 6. EDUCACIÓN
            # ========================================
            educacion = {}
            if 'educacion' in categorias_bd:
                cat = categorias_bd['educacion']
                educacion = {
                    'puntuacion': cat.get('puntuacion', 50),
                    'descripcion': cat.get('descripcion', ''),
                    'escuelas': cat.get('escuelas', []),
                    'universidades': cat.get('universidades', [])
                }
            else:
                educacion = {
                    'puntuacion': 50,
                    'descripcion': f"Instituciones educativas en {nombre_display}.",
                    'escuelas': [],
                    'universidades': []
                }
            
            # ========================================
            # 7. SALUD
            # ========================================
            salud = {}
            if 'salud' in categorias_bd:
                cat = categorias_bd['salud']
                salud = {
                    'puntuacion': cat.get('puntuacion', 50),
                    'descripcion': cat.get('descripcion', ''),
                    'hospitales': cat.get('hospitales', []),
                    'centros_salud': cat.get('centros_salud', [])
                }
            else:
                salud = {
                    'puntuacion': 50,
                    'descripcion': f"Centros de salud en {nombre_display}.",
                    'hospitales': [],
                    'centros_salud': []
                }
            
            # ========================================
            # 8. ESPACIOS VERDES
            # ========================================
            espacios_verdes = {}
            if 'espacios_verdes' in categorias_bd:
                cat = categorias_bd['espacios_verdes']
                espacios_verdes = {
                    'puntuacion': cat.get('puntuacion', 50),
                    'descripcion': cat.get('descripcion', ''),
                    'parques': cat.get('parques', [])
                }
            else:
                espacios_verdes = {
                    'puntuacion': 50,
                    'descripcion': f"Parques y plazas en {nombre_display}.",
                    'parques': []
                }
            
            # ========================================
            # 9. CONTAMINACIÓN
            # ========================================
            contaminacion = {}
            if 'contaminacion' in categorias_bd:
                cat = categorias_bd['contaminacion']
                contaminacion = {
                    'puntuacion': cat.get('puntuacion', 50),
                    'descripcion': cat.get('descripcion', ''),
                    'nivel_ruido': cat.get('nivel_ruido', 'Medio'),
                    'fuente': cat.get('fuente', '')
                }
            else:
                contaminacion = {
                    'puntuacion': 50,
                    'descripcion': f"Niveles de contaminación en {nombre_display}.",
                    'nivel_ruido': 'Medio',
                    'fuente': ''
                }
            
            # ========================================
            # 10. VIDA DEL BARRIO
            # ========================================
            vida_barrio = {}
            if 'vida_barrio' in categorias_bd:
                cat = categorias_bd['vida_barrio']
                vida_barrio = {
                    'puntuacion': cat.get('puntuacion', 50),
                    'descripcion': cat.get('descripcion', ''),
                    'bares': cat.get('bares', []),
                    'cultura': cat.get('cultura', [])
                }
            else:
                vida_barrio = {
                    'puntuacion': 50,
                    'descripcion': f"Vida cultural y social en {nombre_display}.",
                    'bares': [],
                    'cultura': []
                }
            
            # ========================================
            # CALCULAR PUNTUACIÓN GENERAL (promedio de TODAS las categorías)
            # ========================================
            puntuaciones = [
                gastronomia['puntuacion'],
                servicios_financieros['puntuacion'],
                transporte['puntuacion'],
                comercio['puntuacion'],
                seguridad['puntuacion'],
                educacion['puntuacion'],
                salud['puntuacion'],
                espacios_verdes['puntuacion'],
                contaminacion['puntuacion'],
                vida_barrio['puntuacion']
            ]
            
            # Filtrar valores None o 0
            puntuaciones_validas = [p for p in puntuaciones if p and p > 0]
            puntuacion_general = round(sum(puntuaciones_validas) / len(puntuaciones_validas)) if puntuaciones_validas else 50
            
            # ========================================
            # CONSTRUIR OBJETO FINAL DEL BARRIO
            # ========================================
            barrio_data = {
                'nombre': nombre_display,
                'descripcion_general': resumen_general or f"{nombre_display} es un barrio de Buenos Aires.",
                'conclusion': conclusion or f"{nombre_display} presenta opciones para vivir e invertir.",
                'puntuacion_general': puntuacion_general,
                'gastronomia': gastronomia,
                'servicios_financieros': servicios_financieros,
                'transporte': transporte,
                'comercio': comercio,
                'seguridad': seguridad,
                'educacion': educacion,
                'salud': salud,
                'espacios_verdes': espacios_verdes,
                'contaminacion': contaminacion,
                'vida_barrio': vida_barrio
            }
            
            data[nombre] = barrio_data
            print(f"✅ {nombre}: Puntuación general calculada: {puntuacion_general}")
        
        print(f"\n🎯 Total barrios procesados: {len(data)}")
        return {"success": True, "data": data, "total": len(data)}
        
    except Exception as e:
        print(f"❌ Error generando entorno.json: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e), "data": {}}
    
# FUNCIONES AUXILIARES
# ============================================

def generar_datos_barrio_vacios(nombre: str) -> dict:
    nombre_display = nombre.strip().title()
    return {
        "resumen_general": f"{nombre_display} es un barrio de Buenos Aires.",
        "puntuacion_general": 50,
        "categorias": {},
        "conclusion": f"{nombre_display} presenta una opción viable para vivir e invertir."
    }

def generar_datos_barrio_ai(nombre: str) -> dict:
    """Genera datos de barrio usando IA con prompt mejorado y parseo robusto"""
    print(f"🤖 Generando datos con IA para: {nombre}")
    
    prompt = f"""Genera un análisis completo del barrio '{nombre}' en Buenos Aires en formato JSON PURO.
    NO incluyas markdown (```json ... ```), solo el objeto JSON raw.
    
    Estructura requerida:
    {{
        "resumen_general": "Breve descripción...",
        "puntuacion_general": 75,
        "categorias": {{
            "transporte": {{"puntuacion": 70, "descripcion": "...", "estaciones": ["Estación A"], "colectivos": ["10", "12"]}},
            "comercio": {{"puntuacion": 70, "descripcion": "...", "supermercados": ["Sup A"], "centros_comerciales": []}},
            "seguridad": {{"puntuacion": 70, "descripcion": "...", "comisaria": "Comisaría X"}},
            "educacion": {{"puntuacion": 70, "descripcion": "...", "escuelas": ["Escuela 1"], "universidades": []}},
            "salud": {{"puntuacion": 70, "descripcion": "...", "hospitales": ["Hospital Z"], "centros_salud": []}},
            "espacios_verdes": {{"puntuacion": 70, "descripcion": "...", "parques": ["Plaza Y"]}},
            "contaminacion": {{"puntuacion": 70, "descripcion": "...", "nivel_ruido": "Medio", "fuente": "Tráfico"}},
            "vida_barrio": {{"puntuacion": 70, "descripcion": "...", "bares": ["Bar 1"], "cultura": []}},
            "gastronomia": {{"puntuacion": 70, "descripcion": "...", "restaurantes": ["Restaurante 1"], "zonas": []}},
            "servicios_financieros": {{"puntuacion": 70, "descripcion": "...", "bancos": ["Banco A"], "cajeros": []}}
        }},
        "conclusion": "Conclusión para inversores"
    }}
    
    Usa datos REALES de {nombre}. Asegúrate de que sea un JSON válido."""
    
    try:
        print(f"📤 Enviando prompt a Gemini...")
        response = call_gemini_with_rotation(prompt)
        print(f"📥 Respuesta recibida (primeros 100 chars): {response[:100]}...")
        
        # Limpieza y extracción de JSON
        response_text = response.strip()
        
        # Intentar encontrar JSON con regex si hay texto extra
        json_match = re.search(r'(\{.*\})', response_text, re.DOTALL)
        if json_match:
            json_str = json_match.group(1)
        else:
            json_str = response_text
            
        # Limpiar bloques de código markdown si quedaron
        json_str = json_str.replace('```json', '').replace('```', '').strip()
        
        try:
            data = json.loads(json_str)
            print(f"✅ JSON parseado correctamente")
            
            # Asegurar estructura mínima
            if "categorias" not in data:
                data["categorias"] = {}
                
            return data
            
        except json.JSONDecodeError as je:
            print(f"❌ Error decodificando JSON: {je}")
            print(f"📄 Respuesta raw problemática: {response_text}")
            
    except Exception as e:
        print(f"❌ Error critico en IA: {e}")
        import traceback
        traceback.print_exc()
    
    print(f"⚠️ Usando datos vacíos para {nombre} debido a error")
    return generar_datos_barrio_vacios(nombre)


# ============================================
# APP PRINCIPAL
# ============================================

app = FastAPI(title="Dante Propiedades API", version="1.5.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# 🎯 ENDPOINT PARA EXPORTAR JSON
# ============================================

@app.get("/api/barrios/generate-json")
def exportar_json():
    print("🎯🎯🎯 ENDPOINT /api/barrios/generate-json LLAMADO 🎯🎯🎯")
    return generar_entorno_json()

# ============================================
# ENDPOINTS DE BARRIOS
# ============================================

@app.get("/api/barrios")
def listar_barrios():
    conn = get_barrios_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('SELECT nombre FROM barrios_data ORDER BY nombre')
        rows = cursor.fetchall()
        barrios = [{'nombre': row[0], 'puntuacion_general': 50, 'generado_por_ia': False} for row in rows]
        return {"success": True, "total": len(barrios), "barrios": barrios}
    finally:
        conn.close()

@app.get("/api/barrios/{nombre}")
def obtener_barrio(nombre: str):
    conn = get_barrios_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('SELECT nombre, data FROM barrios_data WHERE LOWER(nombre) = LOWER(?)', (nombre.strip(),))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Barrio no encontrado")
        data = json.loads(row['data'])
        return {"success": True, "nombre": row['nombre'], "data": data}
    finally:
        conn.close()

@app.post("/api/barrios")
def crear_barrio(request: BarrioCreateRequest):
    nombre = request.nombre.strip().lower()
    nombre_display = request.nombre.strip()
    
    conn = get_barrios_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT nombre FROM barrios_data WHERE LOWER(nombre) = LOWER(?)', (nombre,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail=f"El barrio '{nombre_display}' ya existe")
    
    try:
        if request.generar_ia:
            data = generar_datos_barrio_ai(nombre_display)
        else:
            data = generar_datos_barrio_vacios(nombre_display)
        cursor.execute(
            'INSERT INTO barrios_data (nombre, data, actualizado_por) VALUES (?, ?, ?)',
            (nombre, json.dumps(data), 'admin')
        )
        conn.commit()
        
        return {
            "success": True,
            "message": f"Barrio '{nombre_display}' creado exitosamente",
            "data": data
        }
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error al crear barrio: {str(e)}")
    finally:
        conn.close()

@app.put("/api/barrios/{nombre}")
def actualizar_barrio(nombre: str, request: BarrioUpdateRequest):
    nombre_db = nombre.strip().lower()
    
    conn = get_barrios_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT nombre FROM barrios_data WHERE LOWER(nombre) = LOWER(?)', (nombre_db,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Barrio no encontrado")
    
    try:
        cursor.execute(
            'UPDATE barrios_data SET data = ?, actualizado_por = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE LOWER(nombre) = LOWER(?)',
            (json.dumps(request.data), request.actualizado_por, nombre_db)
        )
        conn.commit()
        
        return {"success": True, "message": "Barrio actualizado exitosamente"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error al actualizar: {str(e)}")
    finally:
        conn.close()

@app.delete("/api/barrios/{nombre}")
def eliminar_barrio(nombre: str):
    nombre_db = nombre.strip().lower()
    
    conn = get_barrios_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM barrios_data WHERE LOWER(nombre) = LOWER(?)', (nombre_db,))
    deleted = cursor.rowcount
    conn.commit()
    conn.close()
    
    if deleted == 0:
        raise HTTPException(status_code=404, detail="Barrio no encontrado")
    
    return {"success": True, "message": f"Barrio '{nombre}' eliminado exitosamente"}

@app.post("/api/barrios/{nombre}/regenerate")
def regenerar_barrio_ai(nombre: str):
    nombre_display = nombre.strip()
    nombre_db = nombre.strip().lower()
    
    conn = get_barrios_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT nombre FROM barrios_data WHERE LOWER(nombre) = LOWER(?)', (nombre_db,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Barrio no encontrado")
    
    try:
        data = generar_datos_barrio_ai(nombre_display)
        cursor.execute(
            'UPDATE barrios_data SET data = ?, actualizado_por = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE LOWER(nombre) = LOWER(?)',
            (json.dumps(data), 'ai', nombre_db)
        )
        conn.commit()
        
        return {
            "success": True,
            "message": f"Barrio '{nombre_display}' regenerado con IA",
            "data": data,
            "generado_por_ia": True,
            "fecha_actualizacion": datetime.now().isoformat()
        }
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error al regenerar: {str(e)}")
    finally:
        conn.close()

# ============================================
# ENDPOINT DE CHAT CON IA
# ============================================

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    start_time = time.time()
    
    try:
        filters = request.filters or {}
        detected_filters = detect_filters(request.message.lower())
        filters.update(detected_filters)
        
        results = None
        search_performed = False
        
        if filters:
            search_performed = True
            results = query_properties(filters)
        
        es_saludo = any(p in request.message.lower() for p in ['hola', 'hi', 'hello', 'buenas']) and not request.contexto_anterior
        
        if es_saludo:
            answer = """¡Hola! 👋 Soy tu asistente de Dante Propiedades. 

Te ayudo a encontrar la propiedad ideal. Podés:
• Usar los filtros a la izquierda para búsquedas específicas
• Contarme directamente qué estás buscando
• Preguntarme sobre propiedades que veas

¿En qué tipo de propiedad estás interesado hoy?"""
        else:
            historial = get_historial_canal(request.channel)
            contexto = f"Barrios: {', '.join(BARRIOS[:10])}... Tipos: {', '.join(TIPOS)}. Operaciones: {', '.join(OPERACIONES)}."
            prompt = build_prompt(request.message, results, filters, request.channel, contexto)
            answer = call_gemini_with_rotation(prompt)
            
            if results and len(results) > 0:
                lines = answer.split('\n')
                clean_lines = [line for line in lines if not any(emoji in line for emoji in ['🏠', '📍', '💰', '📋'])]
                answer = '\n'.join(clean_lines).strip()
                if not answer or len(answer) < 20:
                    answer = f"✅ Encontré {len(results)} propiedades que coinciden con tu búsqueda."
        
        response_time = time.time() - start_time
        log_conversation(request.message, answer, request.channel, response_time, search_performed, len(results) if results else 0)
        
        return ChatResponse(
            response=answer,
            results_count=len(results) if results else None,
            search_performed=search_performed,
            propiedades=results
        )
        
    except Exception as e:
        print(f"❌ Error en chat: {e}")
        raise HTTPException(status_code=500, detail="Error procesando la consulta")

# ============================================
# ENDPOINTS DE FILTROS
# ============================================

@app.get("/filters")
@app.get("/properties/filter-options")
def get_filters():
    return {
        "operaciones": OPERACIONES,
        "tipos": TIPOS,
        "barrios": BARRIOS,
        "estado": ["A Estrenar", "Excelente", "Muy Bueno", "Bueno", "Regular"],
        "orientacion": ["Norte", "Sur", "Este", "Oeste"],
        "moneda": ["USD", "ARS"]
    }

@app.get("/properties")
def get_properties(
    neighborhood: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_rooms: Optional[int] = None,
    operacion: Optional[str] = None,
    tipo: Optional[str] = None,
    min_sqm: Optional[float] = None,
    max_sqm: Optional[float] = None,
    limit: int = 20
):
    filters = {k: v for k, v in locals().items() if v is not None and k not in ['limit']}
    results = query_properties(filters)
    return results[:limit]

# ============================================
# ENDPOINT DE ANÁLISIS DE ENTORNO CON IA
# ============================================

# ============================================
# FUNCIONES AUXILIARES (FUERA DEL ENDPOINT)
# ============================================

def generate_sample_data(zone):
    """Genera datos de ejemplo cuando Gemini falla"""
    import random
    return {
        "resumen_general": f"{zone.title()} es un barrio de Buenos Aires con características únicas.",
        "puntuacion_general": random.randint(65, 90),
        "categorias": {
            "transporte": {"puntuacion": random.randint(60, 90), "descripcion": f"Transporte público en {zone.title()}"},
            "comercio": {"puntuacion": random.randint(60, 90), "descripcion": f"Comercios locales en {zone.title()}"},
            "seguridad": {"puntuacion": random.randint(50, 80), "descripcion": f"Seguridad en {zone.title()}"},
            "educacion": {"puntuacion": random.randint(60, 85), "descripcion": f"Educación en {zone.title()}"},
            "salud": {"puntuacion": random.randint(60, 85), "descripcion": f"Salud en {zone.title()}"},
            "espacios_verdes": {"puntuacion": random.randint(50, 80), "descripcion": f"Espacios verdes en {zone.title()}"},
            "contaminacion": {"puntuacion": random.randint(40, 70), "descripcion": f"Contaminación en {zone.title()}"},
            "vida_barrio": {"puntuacion": random.randint(60, 90), "descripcion": f"Vida de barrio en {zone.title()}"},
            "gastronomia": {"puntuacion": random.randint(60, 90), "descripcion": f"Gastronomía en {zone.title()}"},
            "servicios_financieros": {"puntuacion": random.randint(60, 85), "descripcion": f"Servicios financieros en {zone.title()}"}
        },
        "conclusion": f"{zone.title()} presenta una opción atractiva para residir o invertir."
    }

def generate_fallback_data(zone):
    """Genera datos de respaldo cuando todo falla"""
    return {
        "success": False,
        "data": generate_sample_data(zone),
        "generado_por_ia": False,
        "fecha_actualizacion": datetime.now().isoformat()
    }
# ============================================
# ENDPOINTS DE ENTORNO
# ============================================

@app.get("/api/entorno/metadata")
def obtener_metadata_entorno():
    return {
        "success": True,
        "version": "1.0.0",
        "rubros": {
            "transporte": {"titulo": "Transporte", "icono": "🚌", "orden": 1},
            "comercio": {"titulo": "Comercio", "icono": "🛒", "orden": 2},
            "seguridad": {"titulo": "Seguridad", "icono": "🛡️", "orden": 3},
            "educacion": {"titulo": "Educación", "icono": "🎓", "orden": 4},
            "salud": {"titulo": "Salud", "icono": "🏥", "orden": 5},
            "espacios_verdes": {"titulo": "Espacios Verdes", "icono": "🌳", "orden": 6},
            "contaminacion": {"titulo": "Contaminación", "icono": "🌫️", "orden": 7},
            "vida_barrio": {"titulo": "Vida del Barrio", "icono": "🎭", "orden": 8},
            "gastronomia": {"titulo": "Gastronomía", "icono": "🍽️", "orden": 9},
            "servicios_financieros": {"titulo": "Servicios Financieros", "icono": "🏦", "orden": 10}
        },
        "categorias_ordenadas": [
            "transporte", "comercio", "seguridad", "educacion", "salud",
            "espacios_verdes", "contaminacion", "vida_barrio", "gastronomia", "servicios_financieros"
        ]
    }
    
    
    
    
    # ============================================
# 🆕 ENDPOINTS DE ESTADO Y SALUD
# ============================================

@app.get("/health")
@app.get("/status")
def health_check():
    """Health check del servidor"""
    return {
        "status": "healthy",
        "service": "Dante Propiedades API",
        "version": "2.0.0",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/status")
def api_status():
    """Estado detallado de la API"""
    return {
        "status": "activo",
        "version": "2.0.0",
        "endpoints_disponibles": [
            "/api/barrios",
            "/api/barrios/{nombre}",
            "/api/barrios/generate-json",
            "/api/entorno/metadata",
            "/chat",
            "/health",
            "/api/status"
        ],
        "total_barrios": 48,
        "timestamp": datetime.now().isoformat()
    }
    
    





# ============================================
# 🆕 PASO 6: ENDPOINTS DE SCRAPING COMPLETOS
# ============================================

@app.get("/api/market/run-scrape")
def run_scraper_endpoint(
    zona: str = Query(..., description="Zona o barrio a analizar"),
    operacion: str = Query("venta", description="Tipo de operación"),
    tipo: str = Query("departamento", description="Tipo de propiedad")
):
    """
    Ejecuta el script de scraping en segundo plano
    """
    scraper_script = os.path.join(os.path.dirname(os.path.abspath(__file__)), "scrape_market.py")
    output_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "scraping.json")
    
    if not os.path.exists(scraper_script):
        raise HTTPException(status_code=500, detail="Script de scraping no encontrado")
    
    def execute_scraper():
        try:
            result = subprocess.run(
                [sys.executable, scraper_script, "--zona", zona, "--operacion", operacion, "--tipo", tipo, "--output", output_file],
                capture_output=True,
                text=True,
                timeout=180
            )
            if result.returncode != 0:
                print(f"❌ Error en scraper: {result.stderr}")
            else:
                print(f"✅ Scraping completado para {zona}")
        except subprocess.TimeoutExpired:
            print("⏰ Timeout en scraper")
        except Exception as e:
            print(f"❌ Excepción en scraper: {e}")
    
    # Ejecutar en segundo plano
    thread = Thread(target=execute_scraper)
    thread.daemon = True
    thread.start()
    
    return {
        "success": True,
        "message": "Scraping iniciado en segundo plano",
        "zone": zona,
        "operation": operacion,
        "property_type": tipo
    }

@app.get("/api/market/scraping-data")
def get_scraping_data():
    """
    Obtiene los datos del último scraping realizado
    """
    scraping_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "scraping.json")
    
    if not os.path.exists(scraping_file):
        return {
            "success": False,
            "message": "No hay datos de scraping disponibles. Ejecuta primero el scraper."
        }
    
    try:
        with open(scraping_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error leyendo datos de scraping: {str(e)}")

# ============================================
# 🆕 PASO 6 (continuación): ENDPOINTS DE ANÁLISIS DE MERCADO
# ============================================

@app.post("/market/analysis")
def market_analysis(request: MarketAnalysisRequest):
    """
    Analiza el mercado inmobiliario de un barrio específico
    """
    # Obtener propiedades del barrio
    propiedades = query_properties({"barrio": request.barrio})[:10]
    
    if not propiedades:
        return {"success": False, "message": "No hay suficientes datos para el análisis"}
    
    # Calcular estadísticas básicas
    precios_m2 = []
    for p in propiedades:
        if p.get('metros_cuadrados', 0) > 0:
            precio = p.get('precio', 0)
            if p.get('moneda_precio') == 'USD':
                precio *= 1000  # Conversión aproximada USD a ARS
            precios_m2.append(precio / p['metros_cuadrados'])
    
    return {
        "success": True,
        "barrio": request.barrio,
        "analysis": {
            "precio_m2_promedio": sum(precios_m2) / len(precios_m2) if precios_m2 else None,
            "precio_m2_min": min(precios_m2) if precios_m2 else None,
            "precio_m2_max": max(precios_m2) if precios_m2 else None,
            "rango_precios_propiedades": f"{min(p.get('precio', 0) for p in propiedades)} - {max(p.get('precio', 0) for p in propiedades)}",
            "caracteristicas_zona": [request.barrio],
            "tendencias": {"direccion": "estable", "descripcion": "Datos del mercado local"},
            "fuentes_procesadas": len(propiedades)
        }
    }

@app.post("/market/comparison")
def property_comparison(request: PropertyComparisonRequest):
    """
    Compara una propiedad con el mercado de su barrio
    """
    # Obtener propiedad
    if request.propiedad_id:
        propiedades = query_properties({"id_temporal": request.propiedad_id})
        if not propiedades:
            raise HTTPException(status_code=404, detail="Propiedad no encontrada")
        propiedad = propiedades[0]
    elif request.propiedad:
        propiedad = request.propiedad
    else:
        raise HTTPException(status_code=400, detail="Se requiere propiedad_id o propiedad")
    
    barrio = propiedad.get('barrio', '')
    propiedades_barrio = query_properties({"barrio": barrio})
    
    # Calcular precio por m² de la propiedad
    precio = propiedad.get('precio', 0)
    metros = propiedad.get('metros_cuadrados', 1)
    precio_m2 = precio / max(metros, 1)
    if propiedad.get('moneda_precio') == 'USD':
        precio_m2 *= 1000
    
    # Calcular precio promedio del barrio
    precios_m2_barrio = []
    for p in propiedades_barrio:
        if p.get('metros_cuadrados', 0) > 0:
            p_precio = p.get('precio', 0)
            if p.get('moneda_precio') == 'USD':
                p_precio *= 1000
            precios_m2_barrio.append(p_precio / p['metros_cuadrados'])
    
    precio_promedio_barrio = sum(precios_m2_barrio) / len(precios_m2_barrio) if precios_m2_barrio else None
    
    # Generar virtudes
    virtudes = []
    if precio_promedio_barrio and precio_m2 < precio_promedio_barrio * 0.9:
        virtudes.append({
            "tipo": "precio",
            "icono": "💰",
            "titulo": "Precio por debajo del mercado",
            "dato_objetivo": f"{int((1 - precio_m2 / precio_promedio_barrio) * 100)}% más económico",
            "beneficio_emocional": "Ahorrás desde el primer día",
            "persuasion_score": 9
        })
    
    return {
        "success": True,
        "propiedad": {
            "id": propiedad.get('id_temporal'),
            "direccion": propiedad.get('direccion'),
            "barrio": propiedad.get('barrio'),
            "precio": propiedad.get('precio'),
            "metros": propiedad.get('metros_cuadrados')
        },
        "comparacion": {
            "virtudes": virtudes[:3],
            "score_oportunidad": 8 if virtudes else 5,
            "texto_persuasivo": "Esta propiedad presenta características atractivas en relación al mercado.",
            "llamada_accion": "Contactanos para conocer más detalles"
        }
    }



# ============================================
# 🆕 ENDPOINTS DE ANÁLISIS DE MERCADO
# ============================================

@app.post("/market/analysis")
def market_analysis(request: MarketAnalysisRequest):
    """
    Analiza el mercado inmobiliario de un barrio
    """
    # Obtener propiedades del barrio
    propiedades = query_properties({"barrio": request.barrio})[:10]
    
    if not propiedades:
        return {
            "success": False,
            "message": f"No hay suficientes datos para analizar {request.barrio}"
        }
    
    # Calcular estadísticas básicas
    precios = [p.get('precio', 0) for p in propiedades]
    metros = [p.get('metros_cuadrados', 1) for p in propiedades]
    
    precios_m2 = []
    for i, p in enumerate(propiedades):
        if metros[i] > 0:
            precio = precios[i]
            if p.get('moneda_precio') == 'USD':
                precio *= 1000  # Conversión aproximada
            precios_m2.append(precio / metros[i])
    
    return {
        "success": True,
        "barrio": request.barrio,
        "analysis": {
            "precio_promedio": sum(precios) / len(precios),
            "precio_min": min(precios),
            "precio_max": max(precios),
            "precio_m2_promedio": sum(precios_m2) / len(precios_m2) if precios_m2 else None,
            "metros_promedio": sum(metros) / len(metros),
            "muestra": len(propiedades),
            "tendencias": "Datos basados en propiedades disponibles"
        }
    }

@app.post("/api/valoracion")
def property_valuation(request: ValuationRequest):
    """
    Calcula una valoración estimada para una propiedad con lógica de fallback
    """
    try:
        is_fallback = False
        fallback_reason = None
        
        # 1. Intentar obtener datos del barrio solicitado
        operacion = request.operacion.lower()
        propiedades = query_properties({"barrio": request.barrio, "operacion": operacion})
        
        # 2. Si no hay datos en ese barrio, buscar promedios generales de la base de datos
        if not propiedades:
            is_fallback = True
            fallback_reason = f"No hay suficientes datos comparativos de {operacion} en {request.barrio}."
            print(f"⚠️ Fallback: No hay datos de {operacion} para {request.barrio}. Buscando promedio general...")
            propiedades = query_properties({"operacion": operacion})
            
        # 3. Calcular precios m2 y fuentes
        precios_m2 = []
        fuentes = set()
        for p in propiedades:
            m2 = p.get('metros_cuadrados', 0)
            if m2 > 5:
                precio = p.get('precio', 0)
                if p.get('moneda_precio') == 'ARS':
                    precio = precio / 1050
                precios_m2.append(precio / m2)
                
                # Guardar fuente si existe
                fuente = p.get('source', '') or p.get('fuente', '')
                if fuente:
                    fuentes.add(fuente.capitalize())
        
        # 4. Si aún no hay datos (base vacía), usar promedio hardcoded de CABA (USD 2150)
        if not precios_m2:
            is_fallback = True
            fallback_reason = "Base de datos de mercado vacía."
            if operacion == "alquiler":
                avg_precio_m2 = 8500.0  # Promedio referencial CABA Alquiler ARS/m2
                moneda = "ARS"
            else:
                avg_precio_m2 = 2150.0  # Promedio referencial CABA Venta USD/m2
                moneda = "USD"
            print(f"⚠️ Fallback Crítico: Usando promedio referencial de CABA ({moneda})")
            fuentes = {"Referencia de mercado"}
        else:
            avg_precio_m2 = sum(precios_m2) / len(precios_m2)
            moneda = "USD" if operacion == "venta" else "ARS"
        
        # 5. Aplicar coeficientes de ajuste
        coef_estado = {
            "Excelente": 1.10,
            "Muy bueno": 1.05,
            "Bueno": 1.00,
            "Regular": 0.85,
            "A refaccionar": 0.70
        }.get(request.estado, 1.0)
        
        coef_tipo = {
            "Casa": 0.95,
            "PH": 1.05,
            "Departamento": 1.00,
            "Terreno": 0.50
        }.get(request.tipo, 1.0)
        
        m2_por_ambiente = request.m2 / max(request.ambientes, 1)
        coef_densidad = 1.0
        if m2_por_ambiente < 20: coef_densidad = 0.95
        elif m2_por_ambiente > 45: coef_densidad = 1.05
        
        # 6. Cálculo final
        valor_estimado = avg_precio_m2 * request.m2 * coef_estado * coef_tipo * coef_densidad
        
        return {
            "success": True,
            "valor_estimado": round(valor_estimado, -2),
            "precio_m2_referencia": round(avg_precio_m2, 2),
            "moneda": moneda,
            "operacion": operacion,
            "is_fallback": is_fallback,
            "fallback_reason": fallback_reason,
            "fuentes": list(fuentes),
            "muestra_size": len(precios_m2),
            "detalles": {
                "barrio": request.barrio,
                "metros": request.m2,
                "ajuste_estado": coef_estado,
                "ajuste_tipo": coef_tipo,
                "muestra_size": len(precios_m2) if not (is_fallback and not precios_m2) else 0
            }
        }
    except Exception as e:
        print(f"Error en valoración: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# ENDPOINT PARA REGENERAR CON IA
# ============================================

@app.api_route("/ai/regenerate-analysis", methods=["GET", "POST"])
async def regenerate_with_ai(
    zone: str = Query(..., description="Barrio a regenerar"),
    force_refresh: bool = Query(False, description="Forzar regeneración")
):
    """
    Endpoint mejorado para regenerar datos de un barrio usando IA con datos reales
    """
    print(f"🌍 Recibida solicitud para regenerar: {zone}")
    
    try:
        # Verificar que el barrio existe
        conn = get_barrios_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT nombre FROM barrios_data WHERE LOWER(nombre) = LOWER(?)', (zone.strip(),))
        if not cursor.fetchone():
            conn.close()
            return {"success": False, "error": "Barrio no encontrado"}
        conn.close()
        
        # Llamar a Gemini con un prompt mejorado
        from logic.gemini_client import call_gemini_with_rotation
        
        prompt = f"""Eres un experto analista inmobiliario y urbanista especializado en Buenos Aires, Argentina.

Tu tarea es generar un análisis COMPLETO y DETALLADO del barrio **{zone}** con datos REALES y verificables.
IMPORTANTE: RESPONDE ÚNICAMENTE CON UN OBJETO JSON VÁLIDO. NO ESCRIBAS TEXTO ANTES NI DESPUÉS DEL JSON.

## REQUISITO PRINCIPAL:
**Las descripciones deben ser informativas y específicas**, NO genéricas.

## EJEMPLO DE FORMATO JSON ESPERADO (NO INCLUYAS MARKDOWN):
{{
    "resumen_general": "Descripción completa del barrio...",
    "puntuacion_general": 85,
    "categorias": {{
        "transporte": {{"puntuacion": 80, "descripcion": "...", "estaciones": ["Estación A", "Estación B"], "colectivos": ["10", "12", "15"]}},
        "comercio": {{"puntuacion": 80, "descripcion": "...", "supermercados": ["Coto", "Jumbo"], "centros_comerciales": ["Shopping Abasto"]}},
        "seguridad": {{"puntuacion": 70, "descripcion": "...", "comisaria": "Comisaría 12"}},
        "educacion": {{"puntuacion": 75, "descripcion": "...", "escuelas": ["Escuela Normal 1"], "universidades": ["UBA Facultad X"]}},
        "salud": {{"puntuacion": 70, "descripcion": "...", "hospitales": ["Hospital Italiano"], "centros_salud": ["CeSAC 3"]}},
        "espacios_verdes": {{"puntuacion": 65, "descripcion": "...", "parques": ["Parque Centenario"]}},
        "contaminacion": {{"puntuacion": 60, "descripcion": "...", "nivel_ruido": "Medio", "fuente": "Avenidas principales"}},
        "vida_barrio": {{"puntuacion": 85, "descripcion": "...", "bares": ["Café San Bernardo"], "cultura": ["Teatro Ciego"]}},
        "gastronomia": {{"puntuacion": 80, "descripcion": "...", "restaurantes": ["Sarkis"], "zonas": ["Villa Crespo"]}},
        "servicios_financieros": {{"puntuacion": 75, "descripcion": "...", "bancos": ["Banco Nación", "Santander"], "cajeros": ["Red Link"]}}
    }},
    "conclusion": "Resumen ejecutivo para inversores inmobiliarios"
}}

AHORA GENERA EL ANÁLISIS PARA: {zone}
"""
        
        print(f"📤 Enviando prompt mejorado a Gemini para {zone}")
        response_text = call_gemini_with_rotation(prompt)
        
        if not response_text:
            print("⚠️ Gemini no devolvió respuesta, usando datos de ejemplo")
            return generate_enhanced_sample_data(zone)
        print(f"📥 Respuesta de Gemini recibida ({len(response_text)} caracteres)")

        # Limpieza robusta para extraer solo el JSON
        cleaned_text = response_text.strip()
        
        # 1. Eliminar bloques de código markdown si existen
        if "```" in cleaned_text:
            cleaned_text = re.sub(r'```(?:json)?', '', cleaned_text).strip()
            
        # 2. Buscar el primer '{' y el último '}'
        start_idx = cleaned_text.find('{')
        end_idx = cleaned_text.rfind('}')
        
        if start_idx != -1 and end_idx != -1:
            json_str = cleaned_text[start_idx:end_idx+1]
        else:
            json_str = cleaned_text
            
        print(f"🔍 JSON extraído: {json_str[:200]}...")

        # Variables para control de flujo
        data = None
        fuente_datos = "desconocida"

        # ========================================
        # LIMPIEZA AGRESIVA DEL JSON
        # ========================================
        # 1. Eliminar comas antes de } y ]
        json_str = re.sub(r',\s*}', '}', json_str)
        json_str = re.sub(r',\s*]', ']', json_str)
        
        # 2. Eliminar caracteres de control y espacios extras
        json_str = re.sub(r'[\n\r\t]', ' ', json_str)
        json_str = re.sub(r'\s+', ' ', json_str)
            
        # 3. Intento 1: Parseo directo
        try:
            data = json.loads(json_str)
            print("✅ JSON parseado correctamente (directo)")
            fuente_datos = "ia_completa"
        except json.JSONDecodeError as e:
            print(f"⚠️ Error en JSON directo: {e}")
            
            # 4. Intento 2: Parseo con corrección de errores comunes
            try:
                # Intentar reparar comillas escapadas
                json_str = json_str.replace('\\"', '"')
                json_str = json_str.replace('"{', '{').replace('}"', '}')
                
                data = json.loads(json_str)
                print("✅ JSON parseado después de limpieza básica")
                fuente_datos = "ia_completa"
            except:
                # 5. Intento 3: Usar ast.literal_eval como último recurso
                try:
                    import ast
                    # Convertir a dict de Python y luego a JSON
                    python_dict = ast.literal_eval(json_str)
                    data = python_dict
                    print("✅ JSON parseado con ast.literal_eval")
                    fuente_datos = "ia_completa"
                except:
                    print("❌ Todos los intentos de parseo fallaron")
                    data = None

        if data and isinstance(data, dict) and fuente_datos == "ia_completa":
            print("✅✅✅ DATOS GENERADOS POR IA EXITOSAMENTE (JSON válido)")
            
            print("🔄 Verificando estructura de datos...")
            
            # Asegurar que tenga categorías
            if 'categorias' not in data:
                print("⚠️ No hay categorías, creando estructura vacía")
                data['categorias'] = {}
    
            # Definir la estructura esperada para cada categoría
            estructura_categorias = {
                'transporte': ['puntuacion', 'descripcion', 'estaciones', 'colectivos'],
                'comercio': ['puntuacion', 'descripcion', 'supermercados', 'centros_comerciales'],
                'seguridad': ['puntuacion', 'descripcion', 'comisaria'],
                'educacion': ['puntuacion', 'descripcion', 'escuelas', 'universidades'],
                'salud': ['puntuacion', 'descripcion', 'hospitales', 'centros_salud'],
                'espacios_verdes': ['puntuacion', 'descripcion', 'parques'],
                'contaminacion': ['puntuacion', 'descripcion', 'nivel_ruido', 'fuente'],
                'vida_barrio': ['puntuacion', 'descripcion', 'bares', 'cultura'],
                'gastronomia': ['puntuacion', 'descripcion', 'restaurantes', 'zonas'],
                'servicios_financieros': ['puntuacion', 'descripcion', 'bancos', 'cajeros']
            }
            
            categorias_normalizadas = {}
            
            for cat_nombre, campos_requeridos in estructura_categorias.items():
                # Obtener datos de la categoría (si existe)
                cat_data = data['categorias'].get(cat_nombre, {})
                
                # Crear objeto normalizado
                cat_normalizada = {}
                
                for campo in campos_requeridos:
                    valor = cat_data.get(campo)
                    
                    # Valores por defecto según el tipo de campo
                    if valor is None:
                        if campo == 'puntuacion':
                            valor = 50
                        elif campo == 'descripcion':
                            valor = f"Información de {cat_nombre} en {zone}"
                        elif campo in ['estaciones', 'colectivos', 'supermercados', 'centros_comerciales', 
                                    'escuelas', 'universidades', 'hospitales', 'centros_salud', 
                                    'parques', 'bares', 'cultura', 'restaurantes', 'zonas', 
                                    'bancos', 'cajeros']:
                            valor = []
                        elif campo == 'comisaria':
                            valor = ""
                        elif campo == 'nivel_ruido':
                            valor = "Medio"
                        elif campo == 'fuente':
                            valor = ""
                    
                    cat_normalizada[campo] = valor
                
                categorias_normalizadas[cat_nombre] = cat_normalizada
                print(f"  📍 {cat_nombre}: puntuación={cat_normalizada.get('puntuacion')}")
            
            # Reemplazar categorías con versión normalizada
            data['categorias'] = categorias_normalizadas
            
            # Verificar puntuación general
            if 'puntuacion_general' not in data or not data['puntuacion_general']:
                # Calcular promedio de todas las categorías
                puntuaciones = [cat.get('puntuacion', 50) for cat in data['categorias'].values()]
                data['puntuacion_general'] = round(sum(puntuaciones) / len(puntuaciones))
                print(f"📊 Puntuación general calculada: {data['puntuacion_general']}")
            
            print(f"✅ Datos normalizados correctamente")

        # ========================================
        # SI NO HAY DATOS COMPLETOS, INTENTAR EXTRACCIÓN PARCIAL
        # ========================================
        if not data and response_text:
            print("⚠️ No se pudo parsear JSON completo, intentando extraer datos de la respuesta...")
            
            # Buscar patrones de puntuaciones con regex
            puntuaciones = {}
            categorias_detectadas = []
            
            categorias_buscar = ['transporte', 'comercio', 'seguridad', 'educacion', 'salud', 
                               'espacios_verdes', 'contaminacion', 'vida_barrio', 'gastronomia', 'servicios_financieros']
            
            for cat in categorias_buscar:
                patron = rf'"{cat}":\s*{{\s*"puntuacion":\s*(\d+)'
                match = re.search(patron, response_text, re.IGNORECASE)
                if match:
                    puntuaciones[cat] = int(match.group(1))
                    categorias_detectadas.append(cat)
                    print(f"  ✅ Encontrada puntuación para {cat}: {puntuaciones[cat]}")
            
            if puntuaciones:
                print(f"✅ Se encontraron {len(puntuaciones)} categorías en la respuesta de IA")
                fuente_datos = "ia_parcial"
                
                # Extraer resumen si existe
                resumen_match = re.search(r'"resumen_general":\s*"([^"]+)"', response_text)
                resumen = resumen_match.group(1) if resumen_match else f"Análisis de {zone}"
                
                # Extraer conclusión si existe
                conclusion_match = re.search(r'"conclusion":\s*"([^"]+)"', response_text)
                conclusion = conclusion_match.group(1) if conclusion_match else f"{zone} presenta opciones para invertir."
                
                # Construir data con puntuaciones de IA
                data = {
                    "resumen_general": resumen,
                    "puntuacion_general": 75,
                    "categorias": {},
                    "conclusion": conclusion
                }
                
                # Para cada categoría
                for cat in categorias_buscar:
                    if cat in puntuaciones:
                        data['categorias'][cat] = {
                            "puntuacion": puntuaciones[cat],
                            "descripcion": f"Información de {cat} en {zone}",
                        }
                        # Campos específicos con indicador de datos parciales
                        if cat == 'transporte':
                            data['categorias'][cat]['estaciones'] = ["⚠️ Datos no disponibles en respuesta"]
                            data['categorias'][cat]['colectivos'] = ["⚠️ Datos no disponibles en respuesta"]
                        elif cat == 'comercio':
                            data['categorias'][cat]['supermercados'] = ["⚠️ Datos no disponibles"]
                            data['categorias'][cat]['centros_comerciales'] = ["⚠️ Datos no disponibles"]
                        elif cat == 'seguridad':
                            data['categorias'][cat]['comisaria'] = "⚠️ Datos no disponibles"
                        elif cat == 'educacion':
                            data['categorias'][cat]['escuelas'] = ["⚠️ Datos no disponibles"]
                            data['categorias'][cat]['universidades'] = ["⚠️ Datos no disponibles"]
                        elif cat == 'salud':
                            data['categorias'][cat]['hospitales'] = ["⚠️ Datos no disponibles"]
                            data['categorias'][cat]['centros_salud'] = ["⚠️ Datos no disponibles"]
                        elif cat == 'espacios_verdes':
                            data['categorias'][cat]['parques'] = ["⚠️ Datos no disponibles"]
                        elif cat == 'contaminacion':
                            data['categorias'][cat]['nivel_ruido'] = "Medio"
                            data['categorias'][cat]['fuente'] = "⚠️ Datos no disponibles"
                        elif cat == 'vida_barrio':
                            data['categorias'][cat]['bares'] = ["⚠️ Datos no disponibles"]
                            data['categorias'][cat]['cultura'] = ["⚠️ Datos no disponibles"]
                        elif cat == 'gastronomia':
                            data['categorias'][cat]['restaurantes'] = ["⚠️ Datos no disponibles"]
                            data['categorias'][cat]['zonas'] = ["⚠️ Datos no disponibles"]
                        elif cat == 'servicios_financieros':
                            data['categorias'][cat]['bancos'] = ["⚠️ Datos no disponibles"]
                            data['categorias'][cat]['cajeros'] = ["⚠️ Datos no disponibles"]
                    else:
                        data['categorias'][cat] = {
                            "puntuacion": 50,
                            "descripcion": f"❌ Sin datos de IA para {cat}",
                        }
                        # Arrays vacíos
                        if cat == 'transporte':
                            data['categorias'][cat]['estaciones'] = []
                            data['categorias'][cat]['colectivos'] = []
                        elif cat == 'comercio':
                            data['categorias'][cat]['supermercados'] = []
                            data['categorias'][cat]['centros_comerciales'] = []
                        elif cat == 'seguridad':
                            data['categorias'][cat]['comisaria'] = ""
                        elif cat == 'educacion':
                            data['categorias'][cat]['escuelas'] = []
                            data['categorias'][cat]['universidades'] = []
                        elif cat == 'salud':
                            data['categorias'][cat]['hospitales'] = []
                            data['categorias'][cat]['centros_salud'] = []
                        elif cat == 'espacios_verdes':
                            data['categorias'][cat]['parques'] = []
                        elif cat == 'contaminacion':
                            data['categorias'][cat]['nivel_ruido'] = "Medio"
                            data['categorias'][cat]['fuente'] = ""
                        elif cat == 'vida_barrio':
                            data['categorias'][cat]['bares'] = []
                            data['categorias'][cat]['cultura'] = []
                        elif cat == 'gastronomia':
                            data['categorias'][cat]['restaurantes'] = []
                            data['categorias'][cat]['zonas'] = []
                        elif cat == 'servicios_financieros':
                            data['categorias'][cat]['bancos'] = []
                            data['categorias'][cat]['cajeros'] = []
                
                print(f"⚠️⚠️⚠️ DATOS PARCIALES DE IA (extracción con regex)")
                print(f"✅ Datos construidos con {len(puntuaciones)} puntuaciones de IA")
            else:
                print("❌ No se pudo extraer NINGÚN dato de la respuesta de IA")
                fuente_datos = "ninguna"

        # ========================================
        # SI NO HAY DATOS DE IA, USAR BACKUP
        # ========================================
        if not data:
            print("🔴🔴🔴 DATOS DE RESPALDO - IA NO DISPONIBLE")
            print("   ⚠️  Posibles motivos:")
            print("   - API keys de Gemini agotadas (límite de cuota)")
            print("   - Error de conexión con Gemini")
            print("   - Respuesta de IA mal formada o vacía")
            fuente_datos = "backup"
            
            data = {
                "resumen_general": f"{zone.title()} es un barrio de Buenos Aires con características únicas.",
                "puntuacion_general": 75,
                "categorias": {
                    "transporte": {
                        "puntuacion": 70,
                        "descripcion": f"Transporte público en {zone.title()}",
                        "estaciones": ["Estación Central", "Subte Línea A"],
                        "colectivos": ["15", "29", "57", "111"]
                    },
                    "comercio": {
                        "puntuacion": 72,
                        "descripcion": f"Comercios locales en {zone.title()}",
                        "supermercados": ["Coto", "Día", "Carrefour"],
                        "centros_comerciales": ["Shopping"]
                    },
                    "seguridad": {
                        "puntuacion": 68,
                        "descripcion": f"Seguridad en {zone.title()}",
                        "comisaria": "Comisaría de la zona"
                    },
                    "educacion": {
                        "puntuacion": 70,
                        "descripcion": f"Educación en {zone.title()}",
                        "escuelas": ["Escuela primaria", "Colegio secundario"],
                        "universidades": ["Universidad cercana"]
                    },
                    "salud": {
                        "puntuacion": 69,
                        "descripcion": f"Salud en {zone.title()}",
                        "hospitales": ["Hospital público"],
                        "centros_salud": ["Centro de salud"]
                    },
                    "espacios_verdes": {
                        "puntuacion": 65,
                        "descripcion": f"Espacios verdes en {zone.title()}",
                        "parques": ["Plaza principal"]
                    },
                    "contaminacion": {
                        "puntuacion": 55,
                        "descripcion": f"Contaminación en {zone.title()}",
                        "nivel_ruido": "Medio",
                        "fuente": "Tráfico vehicular"
                    },
                    "vida_barrio": {
                        "puntuacion": 75,
                        "descripcion": f"Vida de barrio en {zone.title()}",
                        "bares": ["Bar local", "Cervecería"],
                        "cultura": ["Centro cultural"]
                    },
                    "gastronomia": {
                        "puntuacion": 73,
                        "descripcion": f"Gastronomía en {zone.title()}",
                        "restaurantes": ["Restaurante típico", "Parrilla"],
                        "zonas": ["Zona gastronómica"]
                    },
                    "servicios_financieros": {
                        "puntuacion": 70,
                        "descripcion": f"Servicios financieros en {zone.title()}",
                        "bancos": ["Banco Nación", "Banco Provincia"],
                        "cajeros": ["Red Link", "Banelco"]
                    }
                },
                "conclusion": f"{zone.title()} presenta una opción atractiva para residir o invertir."
            }

        # ========================================
        # AGREGAR INDICADORES DE FUENTE
        # ========================================
        from_backup = (fuente_datos == "backup")
        extraccion_parcial = (fuente_datos == "ia_parcial")
        ia_exitosa = (fuente_datos == "ia_completa")

        # ========================================
        # VERIFICACIONES FINALES
        # ========================================
        if not isinstance(data, dict):
            data = {}
        if 'categorias' not in data:
            data['categorias'] = {}

        print(f"🔍 DATA FINAL - Tipo: {type(data)}")
        print(f"📦 Keys: {list(data.keys())}")
        if 'categorias' in data:
            print(f"📊 Categorías: {list(data['categorias'].keys())}")
        print(f"📌 Fuente: {fuente_datos}")

        # Guardar en base de datos
        conn = get_barrios_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            'UPDATE barrios_data SET data = ?, actualizado_por = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE LOWER(nombre) = LOWER(?)',
            (json.dumps(data, ensure_ascii=False), 'ai', zone.strip().lower())
        )
        conn.commit()
        conn.close()
        
        return {
            "success": True,
            "data": data,
            "generado_por_ia": ia_exitosa,
            "extraccion_parcial": extraccion_parcial,
            "from_backup": from_backup,
            "fecha_actualizacion": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"❌ Error en regenerate_with_ai: {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e)
        }

def generate_enhanced_sample_data(zone):
    """Genera datos de ejemplo MEJORADOS cuando Gemini falla"""
    import random
    
    # Datos de ejemplo mejorados (más realistas)
    zone_title = zone.title()
    
    # Listas de lugares comunes según el barrio (simulados)
    colectivos_comunes = ["15", "29", "57", "111", "152", "168", "184", "194"]
    random.shuffle(colectivos_comunes)
    
    restaurantes_genericos = ["Parrilla El Porteño", "Café del Barrio", "Restaurante Buenos Aires", "Pizzería La Familia"]
    bares_genericos = ["Bar El Viejo", "Cervecería Artesanal", "Pub Local", "Café Notable"]
    
    return {
        "resumen_general": f"{zone_title} es un barrio de Buenos Aires con características únicas que combina tradición y modernidad. Su arquitectura mezcla lo antiguo con lo nuevo, ofreciendo una experiencia urbana auténtica.",
        "puntuacion_general": random.randint(70, 90),
        "categorias": {
            "transporte": {
                "puntuacion": random.randint(70, 90),
                "descripcion": f"Buen acceso a transporte público en {zone_title} con múltiples líneas de colectivo que conectan con el centro y otros barrios.",
                "estaciones": ["Subte (línea cercana)", "Estación de tren (consultar)"],
                "colectivos": colectivos_comunes[:5]
            },
            "comercio": {
                "puntuacion": random.randint(65, 85),
                "descripcion": f"Variedad de comercios locales, supermercados y tiendas de cercanía en {zone_title}.",
                "supermercados": ["Coto", "Día", "Carrefour Express"],
                "centros_comerciales": ["Shopping cercano"]
            },
            "seguridad": {
                "puntuacion": random.randint(55, 75),
                "descripcion": f"Nivel de seguridad estándar para {zone_title}, con presencia policial en principales avenidas.",
                "comisaria": "Comisaría de la zona"
            },
            "educacion": {
                "puntuacion": random.randint(65, 85),
                "descripcion": f"Instituciones educativas públicas y privadas en {zone_title} y zonas aledañas.",
                "escuelas": ["Escuela primaria", "Colegio secundario"],
                "universidades": ["Universidad cercana"]
            },
            "salud": {
                "puntuacion": random.randint(60, 80),
                "descripcion": f"Centros de salud públicos y privados accesibles en {zone_title}.",
                "hospitales": ["Hospital zonal"],
                "centros_salud": ["CeSAC", "Clínica privada"]
            },
            "espacios_verdes": {
                "puntuacion": random.randint(50, 80),
                "descripcion": f"Plazas y espacios verdes para recreación en {zone_title}.",
                "parques": ["Plaza principal", "Parque cercano"]
            },
            "contaminacion": {
                "puntuacion": random.randint(45, 70),
                "descripcion": f"Nivel de contaminación moderado en {zone_title}, típico de zonas urbanas.",
                "nivel_ruido": random.choice(["Bajo", "Medio", "Alto"]),
                "fuente": "Tráfico vehicular"
            },
            "vida_barrio": {
                "puntuacion": random.randint(65, 90),
                "descripcion": f"Vida de barrio activa con opciones culturales y de entretenimiento en {zone_title}.",
                "bares": random.sample(bares_genericos, 2),
                "cultura": ["Centro cultural", "Teatro local"]
            },
            "gastronomia": {
                "puntuacion": random.randint(65, 90),
                "descripcion": f"Oferta gastronómica variada en {zone_title} con restaurantes para todos los gustos.",
                "restaurantes": random.sample(restaurantes_genericos, 2),
                "zonas": ["Zona gastronómica local"]
            },
            "servicios_financieros": {
                "puntuacion": random.randint(60, 80),
                "descripcion": f"Servicios bancarios disponibles en {zone_title} con sucursales de los principales bancos.",
                "bancos": ["Banco Nación", "Banco Provincia", "Banco Galicia"],
                "cajeros": ["Red Link", "Banelco"]
            }
        },
        "conclusion": f"{zone_title} presenta una opción atractiva para residir o invertir, con buena infraestructura y servicios. Su perfil residencial-comercial lo hace apto para familias y profesionales. El mercado inmobiliario muestra valores acordes a la zona."
    }




# ============================================
# ARCHIVOS ESTÁTICOS
# ============================================

backend_path = os.path.dirname(os.path.abspath(__file__))
print(f"📁 Sirviendo archivos estáticos desde: {backend_path}")
app.mount("/", StaticFiles(directory=backend_path, html=True), name="static")

@app.get("/analisis-barrio")
@app.get("/analisis-barrio.html")
def analisis_barrio_page():
    return FileResponse(os.path.join(backend_path, "analisis-barrio.html"))

@app.get("/analisis-barrio.css")
def analisis_barrio_css():
    return FileResponse(os.path.join(backend_path, "analisis-barrio.css"))

@app.get("/analisis-barrio.js")
def analisis_barrio_js():
    return FileResponse(os.path.join(backend_path, "analisis-barrio.js"))



# ============================================
# ENTRY POINT
# ============================================

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run("main_ai:app", host="0.0.0.0", port=port, reload=False)