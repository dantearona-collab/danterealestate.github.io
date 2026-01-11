"""
CMS Server con IA Real para Dante Propiedades
Genera descripciones detalladas de barrios usando OpenAI/Gemini

Usage:
    python cms.py
"""

from config import DB_PATH
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os
import sqlite3
import json
from datetime import datetime
from typing import Optional, Dict

# ================================================================
# CONFIGURACIÓN DE IA
# ================================================================
# Setear tu API key antes de ejecutar:
#   set OPENAI_API_KEY=tu_key_aqui
#   set GEMINI_API_KEY=tu_key_aqui

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")


async def generar_con_ia(nombre_barrio: str) -> dict:
    """
    Genera datos completos para un barrio usando IA.
    Prioridad: OpenAI → Gemini → Fallback
    """
    nombre_formateado = nombre_barrio.title()
    
    # Obtener datos de referencia desde la base de datos
    ref = obtener_datos_referencia_barrio(nombre_barrio)
    
    # Prompt optimizado para generar datos del barrio
    prompt = f"""
Genera un análisis completo del barrio "{nombre_formateado}" de Buenos Aires, Argentina.

Estos son los DATOS DE REFERENCIA que tenés que USAR O MEJORAR (son específicos de este barrio):
{ref}

OUTPUT: JSON estricto, sin texto adicional, sin markdown, sin comentarios.

Estructura JSON requerida:

{{
  "nombre": "{nombre_barrio.lower()}",
  "resumen": "Descripción general de 150-200 caracteres",
  "conclusion": "Conclusión para inversores de 100-150 caracteres",
  "categorias": {{
    "transporte": {{
      "puntuacion": 75,
      "descripcion": "Excelente conectividad con subte y colectivos. Estación [NOMBRE] a 5 minutos a pie.",
      "estaciones": ["Nombre Estacion 1", "Nombre Estacion 2"],
      "colectivos": [" linea1", " linea2", " linea3"]
    }},
    "comercio": {{
      "puntuacion": 80,
      "descripcion": "Gran variedad de comercios locales y centros comerciales.",
      "supermercados": ["Supermercado 1", "Supermercado 2"],
      "centros_comerciales": ["Centro Comercial 1"]
    }},
    "seguridad": {{
      "puntuacion": 70,
      "descripcion": "Buen nivel de seguridad con vigilancia policial.",
      "comisaria": "Comisaría Vecinal X",
      "rating_seguridad": "4"
    }},
    "educacion": {{
      "puntuacion": 85,
      "descripcion": "Excelente oferta educativa con escuelas y universidades cercanas.",
      "escuelas": ["Escuela 1", "Escuela 2"],
      "universidades": ["Universidad 1"]
    }},
    "salud": {{
      "puntuacion": 80,
      "descripcion": "Centros de salud y hospitales cercanos.",
      "hospitales": ["Hospital 1"],
      "centros_salud": ["Centro 1"]
    }},
    "espacios_verdes": {{
      "puntuacion": 65,
      "descripcion": "Plazas y parques en la zona.",
      "parques": ["Parque 1", "Plaza 1"]
    }},
    "contaminacion": {{
      "puntuacion": 70,
      "descripcion": "Nivel de ruido moderado.",
      "nivel_ruido": "Medio",
      "fuente": "Tráfico vehicular"
    }},
    "vida_barrio": {{
      "puntuacion": 75,
      "descripcion": "Activa vida social con bares y actividades culturales.",
      "bares": ["Bar 1", "Bar 2"],
      "cultura": ["Museo 1", "Teatro 1"]
    }},
    "gastronomia": {{
      "puntuacion": 85,
      "descripcion": "Excelente oferta gastronómica.",
      "restaurantes": ["Restaurante 1", "Restaurante 2"],
      "zonas": ["Zona 1", "Zona 2"]
    }},
    "servicios_financieros": {{
      "puntuacion": 90,
      "descripcion": "Múltiples bancos y cajeros automáticos.",
      "bancos": ["Banco 1", "Banco 2"],
      "cajeros": ["Cajeros en toda la zona"]
    }}
  }},
  "puntuacion_general": 78,
  "existe": true
}}

REGLAS ESTRICTAS:
1. SI LOS DATOS DE REFERENCIA EXISTEN, USÁLOS O MEJORÁLOS - NO LOS IGNORES
2. Para "estaciones", usá las de referencia si existen
3. Para "colectivos", usá las de referencia si existen (como strings individuales, NO como array separado por comas)
4. Para "restaurantes", usá los de referencia si existen
5. Para "zonas gastronómicas", usá las de referencia si existen
6. Para "bancos", usá los de referencia si existen
7. Para "cajeros", usá los de referencia si existen
8. Para "supermercados", usá los de referencia si existen
9. Para "centros_comerciales", usá los de referencia si existen
10. Para "parques", usá los de referencia si existen
11. Para "escuelas", "universidades", "hospitales", "centros_salud", "bares", "cultura" - AGREGÁ DATOS REALES SI CONOCÉS
12. Las listas deben ser ARRAYS JSON, NO strings separados por comas
13. Puntuaciones realistas basadas en la zona (0-100)
14. Descripciones detalladas y específicas
15. JSON válido y completo
16. No incluyas texto fuera del JSON
17. No uses markdown ni backticks
"""
    
    # Intentar con OpenAI
    if OPENAI_API_KEY:
        try:
            datos = await llamar_openai(prompt, ref)
            if datos:
                print(f"✅ OpenAI: Datos generados para {nombre_barrio}")
                return datos
        except Exception as e:
            print(f"⚠️ OpenAI error: {e}")
    
    # Intentar con Gemini
    if GEMINI_API_KEY:
        try:
            datos = await llamar_gemini(prompt, ref)
            if datos:
                print(f"✅ Gemini: Datos generados para {nombre_barrio}")
                return datos
        except Exception as e:
            print(f"⚠️ Gemini error: {e}")
    
    # Fallback: datos genéricos con referencia
    print(f"⚠️ IA no disponible, usando datos de ejemplo para {nombre_barrio}")
    return generar_datos_ejemplo(nombre_barrio, ref)


# ================================================================
# FUNCIONES DE IA - OpenAI y Gemini
# ================================================================

async def llamar_openai(prompt: str, ref: Dict) -> Optional[Dict]:
    """
    Llama a la API de OpenAI para generar datos del barrio.
    """
    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=OPENAI_API_KEY)
        
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that generates JSON data about Buenos Aires neighborhoods. Always respond with valid JSON only, no markdown, no explanations."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=4000
        )
        
        if response.choices and response.choices[0].message.content:
            text = response.choices[0].message.content.strip()
            # Limpiar markdown si existe
            if text.startswith('```json'):
                text = text[7:]
            if text.startswith('```'):
                text = text[3:]
            if text.endswith('```'):
                text = text[:-3]
            
            # Parsear JSON
            datos = json.loads(text.strip())
            
            # Normalizar estructura para asegurar que coincida con el frontend
            return normalizar_estructura_barrio(datos, ref)
            
    except json.JSONDecodeError as e:
        print(f"❌ Error parseando JSON de OpenAI: {e}")
        print(f"📄 Respuesta recibida: {text[:500]}...")
    except Exception as e:
        print(f"❌ Error en llamada a OpenAI: {e}")
    
    return None


async def llamar_gemini(prompt: str, ref: Dict) -> Optional[Dict]:
    """
    Llama a la API de Google Gemini para generar datos del barrio.
    """
    try:
        import google.generativeai as genai
        
        # Configurar Gemini si no está configurado
        if GEMINI_API_KEY:
            genai.configure(api_key=GEMINI_API_KEY)
        
        # Usar modelo gemini-pro que es el más estable y disponible
        model = genai.GenerativeModel('gemini-pro')
        response = await model.generate_content_async(prompt)
        
        if response.text:
            text = response.text.strip()
            # Limpiar markdown si existe
            if text.startswith('```json'):
                text = text[7:]
            if text.startswith('```'):
                text = text[3:]
            if text.endswith('```'):
                text = text[:-3]
            
            # Parsear JSON
            datos = json.loads(text.strip())
            
            # Normalizar estructura para asegurar que coincida con el frontend
            return normalizar_estructura_barrio(datos, ref)
            
    except json.JSONDecodeError as e:
        print(f"❌ Error parseando JSON de Gemini: {e}")
        print(f"📄 Respuesta recibida: {text[:500]}...")
    except Exception as e:
        print(f"❌ Error en llamada a Gemini: {e}")
    
    return None


def normalizar_estructura_barrio(datos: Dict, ref: Dict) -> Dict:
    """
    Normaliza la estructura del barrio para asegurar que coincida
    exactamente con lo que espera el frontend (analisis-barrio.js).
    
    El frontend espera:
    {
      "nombre": "...",
      "resumen": "...",
      "conclusion": "...",
      "categorias": {
        "transporte": { "puntuacion": X, "descripcion": "...", "estaciones": [...], "colectivos": [...] },
        "comercio": { ... },
        ...
      },
      "puntuacion_general": X,
      "existe": true
    }
    """
    if not datos:
        return datos
    
    # Asegurar que exista el objeto categorias
    if 'categorias' not in datos:
        datos['categorias'] = {}
    
    # Categorías requeridas y sus campos
    categorias_requeridas = {
        'transporte': ['puntuacion', 'descripcion', 'estaciones', 'colectivos'],
        'comercio': ['puntuacion', 'descripcion', 'supermercados', 'centros_comerciales'],
        'seguridad': ['puntuacion', 'descripcion', 'comisaria', 'rating_seguridad'],
        'educacion': ['puntuacion', 'descripcion', 'escuelas', 'universidades'],
        'salud': ['puntuacion', 'descripcion', 'hospitales', 'centros_salud'],
        'espacios_verdes': ['puntuacion', 'descripcion', 'parques'],
        'contaminacion': ['puntuacion', 'descripcion', 'nivel_ruido', 'fuente'],
        'vida_barrio': ['puntuacion', 'descripcion', 'bares', 'cultura'],
        'gastronomia': ['puntuacion', 'descripcion', 'restaurantes', 'zonas'],
        'servicios_financieros': ['puntuacion', 'descripcion', 'bancos', 'cajeros']
    }
    
    # Normalizar cada categoría
    for cat_nombre, campos in categorias_requeridas.items():
        if cat_nombre not in datos['categorias']:
            datos['categorias'][cat_nombre] = {}
        
        cat_data = datos['categorias'][cat_nombre]
        
        for campo in campos:
            # Si el campo no existe, crear uno por defecto
            if campo not in cat_data:
                if campo == 'puntuacion':
                    cat_data[campo] = 50  #默认值
                elif campo == 'descripcion':
                    cat_data[campo] = 'Información no disponible'
                else:
                    cat_data[campo] = []
            
            # Reparar arrays corruptos (strings separados por comas)
            if campo in ['estaciones', 'colectivos', 'supermercados', 'centros_comerciales',
                        'escuelas', 'universidades', 'hospitales', 'centros_salud',
                        'parques', 'bares', 'cultura', 'restaurantes', 'zonas',
                        'bancos', 'cajeros']:
                value = cat_data[campo]
                if isinstance(value, str):
                    # Si es un string separado por comas, convertir a array
                    if ',' in value:
                        cat_data[campo] = [v.strip() for v in value.split(',') if v.strip()]
                    else:
                        cat_data[campo] = [value] if value else []
                elif not isinstance(value, list):
                    cat_data[campo] = []
    
    # Asegurar campos principales
    if 'nombre' not in datos:
        datos['nombre'] = ''
    if 'resumen' not in datos:
        datos['resumen'] = ''
    if 'conclusion' not in datos:
        datos['conclusion'] = ''
    if 'puntuacion_general' not in datos:
        # Calcular promedio de todas las puntuaciones
        puntuaciones = []
        for cat_data in datos['categorias'].values():
            if isinstance(cat_data, dict) and 'puntuacion' in cat_data:
                puntuaciones.append(cat_data['puntuacion'])
        datos['puntuacion_general'] = sum(puntuaciones) // len(puntuaciones) if puntuaciones else 50
    if 'existe' not in datos:
        datos['existe'] = True
    
    return datos


def generar_datos_ejemplo(nombre_barrio: str, ref: Dict = None) -> Dict:
    """
    Genera datos de ejemplo cuando la IA no está disponible.
    Usa la referencia si existe, sino genera datos genéricos.
    """
    nombre = nombre_barrio.lower().strip()
    nombre_formateado = nombre_barrio.title()
    
    # Si hay datos de referencia, usarlos directamente
    if ref:
        # ref ya contiene los datos del barrio, convertir directamente
        return convertir_ref_a_formato_frontend(nombre_barrio, ref)
    
    # Generar datos genéricos con estructura correcta
    return {
        "nombre": nombre,
        "resumen": f"{nombre_formateado} es un barrio de Buenos Aires con características propias de la zona.",
        "conclusion": f"Inversión recomendada en {nombre_formateado} por su conectividad y servicios.",
        "categorias": {
            "transporte": {
                "puntuacion": 70,
                "descripcion": "Conectividad regular con transporte público.",
                "estaciones": ["Estación cercana"],
                "colectivos": ["Líneas locales"]
            },
            "comercio": {
                "puntuacion": 65,
                "descripcion": "Comercio local disponible.",
                "supermercados": ["Supermercado del barrio"],
                "centros_comerciales": ["Centro comercial cercano"]
            },
            "seguridad": {
                "puntuacion": 70,
                "descripcion": "Nivel de seguridad aceptable.",
                "comisaria": "Comisaría vecinal",
                "rating_seguridad": "3"
            },
            "educacion": {
                "puntuacion": 75,
                "descripcion": "Instituciones educativas disponibles.",
                "escuelas": ["Escuela primaria"],
                "universidades": ["Universidad cercana"]
            },
            "salud": {
                "puntuacion": 70,
                "descripcion": "Centros de salud en la zona.",
                "hospitales": ["Hospital cercano"],
                "centros_salud": ["Centro de salud"]
            },
            "espacios_verdes": {
                "puntuacion": 60,
                "descripcion": "Plazas y áreas verdes.",
                "parques": ["Plaza del barrio"]
            },
            "contaminacion": {
                "puntuacion": 70,
                "descripcion": "Nivel de contaminación moderado.",
                "nivel_ruido": "Medio",
                "fuente": "Tráfico vehicular"
            },
            "vida_barrio": {
                "puntuacion": 70,
                "descripcion": "Vida social activa.",
                "bares": ["Bar local"],
                "cultura": ["Centro cultural"]
            },
            "gastronomia": {
                "puntuacion": 75,
                "descripcion": "Oferta gastronómica variada.",
                "restaurantes": ["Restaurante local"],
                "zonas": ["Zona gastronómica"]
            },
            "servicios_financieros": {
                "puntuacion": 80,
                "descripcion": "Servicios bancarios disponibles.",
                "bancos": ["Banco principal"],
                "cajeros": ["Cajeros automáticos"]
            }
        },
        "puntuacion_general": 71,
        "existe": True
    }


def convertir_ref_a_formato_frontend(nombre_barrio: str, ref: Dict) -> Dict:
    """
    Convierte la estructura de datos de referencia al formato exacto
    que espera el frontend (analisis-barrio.js).
    """
    nombre = nombre_barrio.lower().strip()
    nombre_formateado = nombre_barrio.title()
    
    # Obtener subcategorías de referencia
    ref_transporte = ref.get('transporte', {})
    ref_comercio = ref.get('comercio', {})
    ref_gastronomia = ref.get('gastronomia', {})
    ref_espacios_verdes = ref.get('espacios_verdes', {})
    ref_educacion = ref.get('educacion', {})
    ref_seguridad = ref.get('seguridad', {})
    ref_salud = ref.get('salud', {})
    ref_servicios_financieros = ref.get('servicios_financieros', {})
    
    # Mapear campos de referencia a la estructura del frontend
    datos = {
        "nombre": nombre,
        "resumen": f"{nombre_formateado} es un barrio de Buenos Aires con características propias de la zona.",
        "conclusion": f"{nombre_formateado} ofrece buenas oportunidades para inversión inmobiliaria.",
        "categorias": {},
        "puntuacion_general": 78,
        "existe": True
    }
    
    # Transporte
    datos['categorias']['transporte'] = {
        "puntuacion": 85,
        "descripcion": f"Excelente conectividad con {len(ref_transporte.get('estaciones', []))} estaciones de subte y múltiples líneas de colectivo.",
        "estaciones": ref_transporte.get('estaciones', []),
        "colectivos": ref_transporte.get('colectivos', [])
    }
    
    # Comercio
    ref_comercio = ref.get('comercio', {})
    if ref_comercio:
        datos['categorias']['comercio'] = {
            "puntuacion": 80,
            "descripcion": "Gran variedad de comercios locales y centros comerciales.",
            "supermercados": ref_comercio.get('supermercados', []),
            "centros_comerciales": ref_comercio.get('centros_comerciales', [])
        }
    else:
        datos['categorias']['comercio'] = {
            "puntuacion": 70,
            "descripcion": "Comercio local disponible para necesidades cotidianas.",
            "supermercados": ["Supermercados del barrio"],
            "centros_comerciales": ["Centros comerciales cercanos"]
        }
    
    # Seguridad
    if ref_seguridad:
        datos['categorias']['seguridad'] = {
            "puntuacion": ref_seguridad.get('puntuacion', 75),
            "descripcion": "Nivel de seguridad adecuado para la zona.",
            "comisaria": ref_seguridad.get('comisaria', 'Comisaría vecinal'),
            "rating_seguridad": ref_seguridad.get('rating_seguridad', '3')
        }
    else:
        datos['categorias']['seguridad'] = {
            "puntuacion": 70,
            "descripcion": "Nivel de seguridad estándar de la zona.",
            "comisaria": "Comisaría vecinal",
            "rating_seguridad": "3"
        }
    
    # Educación
    ref_educacion_data = ref.get('educacion', {})
    if ref_educacion_data:
        datos['categorias']['educacion'] = {
            "puntuacion": 80,
            "descripcion": "Oferta educativa disponible en la zona.",
            "escuelas": ref_educacion_data.get('escuelas', []),
            "universidades": ref_educacion_data.get('universidades', [])
        }
    else:
        datos['categorias']['educacion'] = {
            "puntuacion": 75,
            "descripcion": "Instituciones educativas disponibles en la zona.",
            "escuelas": ["Escuelas primarias y secundarias"],
            "universidades": ["Universidades cercanas"]
        }
    
    # Salud
    ref_salud_data = ref.get('salud', {})
    if ref_salud_data:
        datos['categorias']['salud'] = {
            "puntuacion": 80,
            "descripcion": "Centros de salud y hospitales disponibles en la zona.",
            "hospitales": ref_salud_data.get('hospitales', []),
            "centros_salud": ref_salud_data.get('centros_salud', [])
        }
    else:
        datos['categorias']['salud'] = {
            "puntuacion": 75,
            "descripcion": "Servicios de salud disponibles en la zona.",
            "hospitales": ["Hospitales cercanos"],
            "centros_salud": ["Centros de salud"]
        }
    
    # Espacios Verdes
    ref_espacios_verdes_data = ref.get('espacios_verdes', {})
    if ref_espacios_verdes_data:
        datos['categorias']['espacios_verdes'] = {
            "puntuacion": 70,
            "descripcion": "Plazas y parques disponibles en la zona.",
            "parques": ref_espacios_verdes_data.get('parques', [])
        }
    else:
        datos['categorias']['espacios_verdes'] = {
            "puntuacion": 65,
            "descripcion": "Áreas verdes y plazas en la zona.",
            "parques": ["Plazas del barrio"]
        }
    
    # Contaminación
    datos['categorias']['contaminacion'] = {
        "puntuacion": 72,
        "descripcion": "Nivel de ruido moderado, principalmente por tránsito vehicular.",
        "nivel_ruido": "Medio",
        "fuente": "Tráfico vehicular"
    }
    
    # Vida del Barrio
    ref_vida_barrio = ref.get('vida_barrio', {})
    if ref_vida_barrio:
        # Usar datos específicos del barrio si existen
        datos['categorias']['vida_barrio'] = {
            "puntuacion": 82,
            "descripcion": f"{nombre_formateado} ofrece una vida social activa con diversas opciones de entretenimiento.",
            "bares": ref_vida_barrio.get('bares', []),
            "cultura": ref_vida_barrio.get('cultura', [])
        }
    else:
        # Generar datos genéricos apropiados para el barrio
        datos['categorias']['vida_barrio'] = {
            "puntuacion": 75,
            "descripcion": f"{nombre_formateado} cuenta con una vida social activa y opciones de entretenimiento locales.",
            "bares": ["Bares y locales del barrio"],
            "cultura": ["Actividades culturales locales", "Centros culturales cercanos"]
        }
    
    # Gastronomía
    ref_gastronomia_data = ref.get('gastronomia', {})
    if ref_gastronomia_data:
        datos['categorias']['gastronomia'] = {
            "puntuacion": ref_gastronomia_data.get('puntuacion', 80),
            "descripcion": "Oferta gastronómica disponible en la zona.",
            "restaurantes": ref_gastronomia_data.get('restaurantes', []),
            "zonas": ref_gastronomia_data.get('zonas', [])
        }
    else:
        datos['categorias']['gastronomia'] = {
            "puntuacion": 75,
            "descripcion": "Opciones gastronómicas disponibles en el barrio.",
            "restaurantes": ["Restaurantes locales"],
            "zonas": ["Zonas gastronómicas del barrio"]
        }
    
    # Servicios Financieros
    ref_servicios_financieros_data = ref.get('servicios_financieros', {})
    if ref_servicios_financieros_data:
        datos['categorias']['servicios_financieros'] = {
            "puntuacion": 85,
            "descripcion": "Servicios bancarios disponibles en la zona.",
            "bancos": ref_servicios_financieros_data.get('bancos', []),
            "cajeros": ref_servicios_financieros_data.get('cajeros', [])
        }
    else:
        datos['categorias']['servicios_financieros'] = {
            "puntuacion": 80,
            "descripcion": "Servicios bancarios y cajeros automáticos disponibles.",
            "bancos": ["Bancos principales"],
            "cajeros": ["Cajeros automáticos en la zona"]
        }
    
    # Calcular puntuación general
    puntuaciones = [cat['puntuacion'] for cat in datos['categorias'].values() if isinstance(cat, dict) and 'puntuacion' in cat]
    datos['puntuacion_general'] = sum(puntuaciones) // len(puntuaciones) if puntuaciones else 78
    
    return datos


# ================================================================
# CONFIGURACIÓN DE LA APLICACIÓN FASTAPI
# ================================================================

# Usar ruta absoluta para la base de datos (asegura que funcione desde cualquier carpeta)
import os
CMS_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(CMS_DIR, "barrios.db")

app = FastAPI(
    title="CMS Dante Propiedades - Análisis de Barrios",
    description="Sistema de gestión de análisis de barrios con IA",
    version="2.0.0"
)

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Base de datos SQLite
def init_db():
    """Inicializa la base de datos"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS barrios_data (
            nombre TEXT PRIMARY KEY,
            data TEXT,
            fecha_actualizacion TEXT,
            generado_por_ia INTEGER DEFAULT 0
        )
    ''')
    conn.commit()
    conn.close()

def get_db_connection():
    """Obtiene conexión a la base de datos"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# ================================================================
# FUNCIONES DE DATOS DE REFERENCIA DESDE BASE DE DATOS
# ================================================================

def obtener_datos_referencia_barrio(nombre_barrio: str) -> Dict:
    """
    Obtiene los datos de referencia de un barrio desde la tabla barrios_reference.
    Retorna un diccionario vacío si no se encuentran datos.
    """
    try:
        conn = get_db_connection()
        c = conn.cursor()
        
        # Verificar si la tabla existe
        c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='barrios_reference'")
        if c.fetchone() is None:
            conn.close()
            return {}
        
        # Obtener datos de referencia del barrio
        c.execute("SELECT data FROM barrios_reference WHERE nombre = ?", (nombre_barrio.lower(),))
        row = c.fetchone()
        conn.close()
        
        if row and row['data']:
            # La columna es JSON, parsearla
            ref_data = row['reference_data']
            if isinstance(ref_data, str):
                return json.loads(ref_data)
            return ref_data
        
        return {}
        
    except Exception as e:
        print(f"⚠️ Error obteniendo datos de referencia para {nombre_barrio}: {e}")
        return {}

def guardar_datos_referencia_barrio(nombre_barrio: str, reference_data: Dict) -> bool:
    """
    Guarda o actualiza los datos de referencia de un barrio en la tabla barrios_reference.
    """
    try:
        conn = get_db_connection()
        c = conn.cursor()
        
        # Crear la tabla si no existe
        c.execute('''
            CREATE TABLE IF NOT EXISTS barrios_reference (
                nombre TEXT PRIMARY KEY,
                data TEXT,
                fecha_actualizacion TEXT
            )
        ''')
        conn.commit()
        
        # Insertar o actualizar datos
        json_data = json.dumps(reference_data, ensure_ascii=False)
        fecha = datetime.now().isoformat()
        
        c.execute('''
            INSERT OR REPLACE INTO barrios_reference (nombre, data, fecha_actualizacion)
            VALUES (?, ?, ?)
        ''', (nombre_barrio.lower(), json_data, fecha))
        
        conn.commit()
        conn.close()
        return True
        
    except Exception as e:
        print(f"⚠️ Error guardando datos de referencia para {nombre_barrio}: {e}")
        return False

# ================================================================
# RUTAS DE LA API
# ================================================================

@app.on_event("startup")
async def startup_event():
    """Inicializar base de datos al iniciar"""
    init_db()
    print("✅ Base de datos inicializada")
    print("🌐 Servidor CMS ejecutándose en http://localhost:8001")

@app.get("/")
async def root():
    """Servir el archivo HTML principal"""
    return FileResponse("analisis-barrio.html")

@app.get("/api/barrios")
async def listar_barrios():
    """Lista todos los barrios"""
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT nombre FROM barrios_data ORDER BY nombre")
    barrios = [row[0] for row in c.fetchall()]
    conn.close()
    return {"success": True, "barrios": barrios, "total": len(barrios)}

@app.get("/api/barrios/{nombre}")
async def obtener_barrio(nombre: str):
    """Obtiene un barrio por nombre"""
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM barrios_data WHERE nombre = ?", (nombre.lower(),))
    row = c.fetchone()
    conn.close()
    
    if row:
        try:
            data = json.loads(row['data']) if isinstance(row['data'], str) else row['data']
            return {
                "success": True,
                "nombre": row['nombre'],
                "data": data,
                "generado_por_ia": bool(row['generado_por_ia']),
                "fecha_actualizacion": row['fecha_actualizacion']
            }
        except json.JSONDecodeError:
            raise HTTPException(status_code=500, detail="Error al parsear datos del barrio")
    
    raise HTTPException(status_code=404, detail=f"Barrio '{nombre}' no encontrado")

@app.post("/api/barrios")
async def crear_barrio(request: Request):
    """Crea un nuevo barrio"""
    data = await request.json()
    nombre = data.get('nombre', '').lower().strip()
    
    if not nombre:
        raise HTTPException(status_code=400, detail="El nombre es obligatorio")
    
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT nombre FROM barrios_data WHERE nombre = ?", (nombre,))
    if c.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail=f"El barrio '{nombre}' ya existe")
    
    # Generar datos con IA si está solicitado
    generar_ia = data.get('generar_ia', False)
    barrio_data = data.get('data', {})
    
    if generar_ia and (OPENAI_API_KEY or GEMINI_API_KEY):
        try:
            datos_ia = await generar_con_ia(nombre)
            if datos_ia:
                barrio_data = datos_ia
        except Exception as e:
            print(f"⚠️ Error generando con IA: {e}")
    
    # Si no hay datos, usar ejemplo
    if not barrio_data:
        ref = obtener_datos_referencia_barrio(nombre)
        barrio_data = generar_datos_ejemplo(nombre, ref)
    
    json_data = json.dumps(barrio_data, ensure_ascii=False, indent=2)
    fecha = datetime.now().isoformat()
    
    c.execute(
        "INSERT INTO barrios_data (nombre, data, fecha_actualizacion, generado_por_ia) VALUES (?, ?, ?, ?)",
        (nombre, json_data, fecha, 1 if generar_ia else 0)
    )
    conn.commit()
    conn.close()
    
    return {
        "success": True,
        "message": f"Barrio '{nombre}' creado correctamente",
        "data": barrio_data,
        "generado_por_ia": generar_ia,
        "fecha_actualizacion": fecha
    }

@app.put("/api/barrios/{nombre}")
async def actualizar_barrio(nombre: str, request: Request):
    """Actualiza un barrio existente"""
    data = await request.json()
    nombre_lower = nombre.lower().strip()
    
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT nombre FROM barrios_data WHERE nombre = ?", (nombre_lower,))
    if not c.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail=f"Barrio '{nombre}' no encontrado")
    
    nuevo_data = data.get('data', {})
    json_data = json.dumps(nuevo_data, ensure_ascii=False, indent=2)
    fecha = datetime.now().isoformat()
    actualizado_por = data.get('actualizado_por', 'admin')
    
    c.execute(
        "UPDATE barrios_data SET data = ?, fecha_actualizacion = ?, generado_por_ia = 0 WHERE nombre = ?",
        (json_data, fecha, nombre_lower)
    )
    conn.commit()
    conn.close()
    
    return {
        "success": True,
        "message": f"Barrio '{nombre}' actualizado correctamente",
        "data": nuevo_data,
        "actualizado_por": actualizado_por,
        "fecha_actualizacion": fecha
    }

@app.delete("/api/barrios/{nombre}")
async def eliminar_barrio(nombre: str):
    """Elimina un barrio"""
    nombre_lower = nombre.lower().strip()
    
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT nombre FROM barrios_data WHERE nombre = ?", (nombre_lower,))
    if not c.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail=f"Barrio '{nombre}' no encontrado")
    
    c.execute("DELETE FROM barrios_data WHERE nombre = ?", (nombre_lower,))
    conn.commit()
    conn.close()
    
    return {
        "success": True,
        "message": f"Barrio '{nombre}' eliminado correctamente",
        "nombre": nombre_lower
    }

@app.post("/api/barrios/{nombre}/regenerate")
async def regenerar_barrio(nombre: str):
    """
    Regenera los datos de un barrio usando IA.
    Si el barrio existe, lo actualiza. Si no existe, lo crea.
    """
    nombre_lower = nombre.lower().strip()
    
    if not OPENAI_API_KEY and not GEMINI_API_KEY:
        raise HTTPException(
            status_code=503, 
            detail="IA no configurada. Setear OPENAI_API_KEY o GEMINI_API_KEY"
        )
    
    print(f"🔄 Regenerando barrio: {nombre_lower}")
    
    # Generar nuevos datos con IA
    try:
        datos_ia = await generar_con_ia(nombre_lower)
        
        if not datos_ia:
            raise HTTPException(status_code=500, detail="Error al generar datos con IA")
        
        # Normalizar estructura
        ref = obtener_datos_referencia_barrio(nombre_lower)
        datos_normalizados = normalizar_estructura_barrio(datos_ia, ref)
        
        # Guardar en base de datos
        conn = get_db_connection()
        c = conn.cursor()
        
        # Verificar si existe
        c.execute("SELECT nombre FROM barrios_data WHERE nombre = ?", (nombre_lower,))
        existe = c.fetchone() is not None
        
        json_data = json.dumps(datos_normalizados, ensure_ascii=False, indent=2)
        fecha = datetime.now().isoformat()
        
        if existe:
            c.execute(
                "UPDATE barrios_data SET data = ?, fecha_actualizacion = ?, generado_por_ia = 1 WHERE nombre = ?",
                (json_data, fecha, nombre_lower)
            )
            mensaje = f"Barrio '{nombre}' actualizado con IA"
        else:
            c.execute(
                "INSERT INTO barrios_data (nombre, data, fecha_actualizacion, generado_por_ia) VALUES (?, ?, ?, 1)",
                (nombre_lower, json_data, fecha)
            )
            mensaje = f"Barrio '{nombre}' creado con IA"
        
        conn.commit()
        conn.close()
        
        return {
            "success": True,
            "message": mensaje,
            "data": datos_normalizados,
            "generado_por_ia": True,
            "fecha_actualizacion": fecha
        }
        
    except Exception as e:
        print(f"❌ Error regenerando barrio: {e}")
        raise HTTPException(status_code=500, detail=f"Error al regenerar: {str(e)}")

@app.get("/api/entorno/metadata")
async def obtener_entorno_metadata():
    """
    Obtiene los metadatos de rubros y campos para formularios dinámicos.
    """
    metadata = {
        "version": "2.0",
        "fecha_actualizacion": datetime.now().isoformat(),
        "rubros": {
            "transporte": {
                "nombre": "Transporte",
                "icono": "bus",
                "orden": 1,
                "campos": {
                    "puntuacion": {"tipo": "number", "label": "Puntuación", "min": 0, "max": 100, "orden": 1},
                    "descripcion": {"tipo": "textarea", "label": "Descripción", "orden": 2},
                    "estaciones": {"tipo": "input", "label": "Estaciones", "placeholder": "Separar por comas", "orden": 3},
                    "colectivos": {"tipo": "input", "label": "Colectivos", "placeholder": "Separar por comas", "orden": 4}
                }
            },
            "comercio": {
                "nombre": "Comercio",
                "icono": "shop",
                "orden": 2,
                "campos": {
                    "puntuacion": {"tipo": "number", "label": "Puntuación", "min": 0, "max": 100, "orden": 1},
                    "descripcion": {"tipo": "textarea", "label": "Descripción", "orden": 2},
                    "supermercados": {"tipo": "input", "label": "Supermercados", "placeholder": "Separar por comas", "orden": 3},
                    "centros_comerciales": {"tipo": "input", "label": "Centros Comerciales", "placeholder": "Separar por comas", "orden": 4}
                }
            },
            "seguridad": {
                "nombre": "Seguridad",
                "icono": "shield",
                "orden": 3,
                "campos": {
                    "puntuacion": {"tipo": "number", "label": "Puntuación", "min": 0, "max": 100, "orden": 1},
                    "descripcion": {"tipo": "textarea", "label": "Descripción", "orden": 2},
                    "comisaria": {"tipo": "input", "label": "Comisaría", "orden": 3},
                    "rating_seguridad": {"tipo": "select", "label": "Rating", "options": ["1", "2", "3", "4", "5"], "orden": 4}
                }
            },
            "educacion": {
                "nombre": "Educación",
                "icono": "graduation",
                "orden": 4,
                "campos": {
                    "puntuacion": {"tipo": "number", "label": "Puntuación", "min": 0, "max": 100, "orden": 1},
                    "descripcion": {"tipo": "textarea", "label": "Descripción", "orden": 2},
                    "escuelas": {"tipo": "input", "label": "Escuelas", "placeholder": "Separar por comas", "orden": 3},
                    "universidades": {"tipo": "input", "label": "Universidades", "placeholder": "Separar por comas", "orden": 4}
                }
            },
            "salud": {
                "nombre": "Salud",
                "icono": "hospital",
                "orden": 5,
                "campos": {
                    "puntuacion": {"tipo": "number", "label": "Puntuación", "min": 0, "max": 100, "orden": 1},
                    "descripcion": {"tipo": "textarea", "label": "Descripción", "orden": 2},
                    "hospitales": {"tipo": "input", "label": "Hospitales", "placeholder": "Separar por comas", "orden": 3},
                    "centros_salud": {"tipo": "input", "label": "Centros de Salud", "placeholder": "Separar por comas", "orden": 4}
                }
            },
            "espacios_verdes": {
                "nombre": "Espacios Verdes",
                "icono": "tree",
                "orden": 6,
                "campos": {
                    "puntuacion": {"tipo": "number", "label": "Puntuación", "min": 0, "max": 100, "orden": 1},
                    "descripcion": {"tipo": "textarea", "label": "Descripción", "orden": 2},
                    "parques": {"tipo": "input", "label": "Parques", "placeholder": "Separar por comas", "orden": 3}
                }
            },
            "contaminacion": {
                "nombre": "Contaminación",
                "icono": "leaf",
                "orden": 7,
                "campos": {
                    "puntuacion": {"tipo": "number", "label": "Puntuación", "min": 0, "max": 100, "orden": 1},
                    "descripcion": {"tipo": "textarea", "label": "Descripción", "orden": 2},
                    "nivel_ruido": {"tipo": "select", "label": "Nivel de Ruido", "options": ["Bajo", "Medio", "Alto", "Muy Alto"], "orden": 3},
                    "fuente": {"tipo": "input", "label": "Fuente Principal", "orden": 4}
                }
            },
            "vida_barrio": {
                "nombre": "Vida del Barrio",
                "icono": "users",
                "orden": 8,
                "campos": {
                    "puntuacion": {"tipo": "number", "label": "Puntuación", "min": 0, "max": 100, "orden": 1},
                    "descripcion": {"tipo": "textarea", "label": "Descripción", "orden": 2},
                    "bares": {"tipo": "input", "label": "Bares", "placeholder": "Separar por comas", "orden": 3},
                    "cultura": {"tipo": "input", "label": "Cultura", "placeholder": "Separar por comas", "orden": 4}
                }
            },
            "gastronomia": {
                "nombre": "Gastronomía",
                "icono": "utensils",
                "orden": 9,
                "campos": {
                    "puntuacion": {"tipo": "number", "label": "Puntuación", "min": 0, "max": 100, "orden": 1},
                    "descripcion": {"tipo": "textarea", "label": "Descripción", "orden": 2},
                    "restaurantes": {"tipo": "input", "label": "Restaurantes", "placeholder": "Separar por comas", "orden": 3},
                    "zonas": {"tipo": "input", "label": "Zonas", "placeholder": "Separar por comas", "orden": 4}
                }
            },
            "servicios_financieros": {
                "nombre": "Servicios Financieros",
                "icono": "bank",
                "orden": 10,
                "campos": {
                    "puntuacion": {"tipo": "number", "label": "Puntuación", "min": 0, "max": 100, "orden": 1},
                    "descripcion": {"tipo": "textarea", "label": "Descripción", "orden": 2},
                    "bancos": {"tipo": "input", "label": "Bancos", "placeholder": "Separar por comas", "orden": 3},
                    "cajeros": {"tipo": "input", "label": "Cajeros", "placeholder": "Separar por comas", "orden": 4}
                }
            }
        },
        "categorias_ordenadas": [
            "transporte", "comercio", "seguridad", "educacion", "salud",
            "espacios_verdes", "contaminacion", "vida_barrio", "gastronomia", "servicios_financieros"
        ]
    }
    
    return metadata

@app.get("/api/entorno/generate-json")
async def generar_entorno_json():
    """
    Genera el archivo completo entorno.json con metadatos y datos.
    Este endpoint es usado para integración con dantepropiedades.com.ar
    """
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT nombre, data FROM barrios_data ORDER BY nombre")
    rows = c.fetchall()
    conn.close()
    
    data = {}
    for row in rows:
        try:
            barrio_data = json.loads(row['data']) if isinstance(row['data'], str) else row['data']
            data[row['nombre']] = barrio_data
        except json.JSONDecodeError:
            print(f"⚠️ Error parseando datos para {row['nombre']}")
    
    result = {
        "metadata": {
            "version": "2.0",
            "fecha_actualizacion": datetime.now().isoformat(),
            "total_barrios": len(data)
        },
        "data": data
    }
    
    return result

# ================================================================
# EXPORTACIÓN PARA dantepropiedades.com.ar
# ================================================================

# Configuración de exportación
EXPORT_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'json')
EXPORT_FILENAME = 'entorno_data.json'
EXPORT_FILE_PATH = os.path.join(EXPORT_FOLDER, EXPORT_FILENAME)


def ensure_export_folder():
    """Asegura que exista el directorio de exportación"""
    if not os.path.exists(EXPORT_FOLDER):
        os.makedirs(EXPORT_FOLDER, exist_ok=True)
        print(f"📁 Carpeta de exportación creada: {EXPORT_FOLDER}")


def generar_datos_exportacion() -> dict:
    """
    Genera la estructura de datos para exportación al sitio principal.
    Formato optimizado para consumo por dantepropiedades.com.ar
    """
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT nombre, data, generado_por_ia, fecha_actualizacion FROM barrios_data ORDER BY nombre")
    rows = c.fetchall()
    conn.close()
    
    data = {}
    for row in rows:
        try:
            barrio_data = json.loads(row['data']) if isinstance(row['data'], str) else row['data']
            data[row['nombre']] = barrio_data
        except json.JSONDecodeError:
            print(f"⚠️ Error parseando datos para {row['nombre']}")
    
    result = {
        "metadata": {
            "version": "2.0",
            "generado_en": datetime.now().isoformat(),
            "total_barrios": len(data),
            "fuente": "CMS Dante Propiedades - Análisis de Barrios con IA"
        },
        "data": data
    }
    
    return result


@app.get("/api/entorno/export")
async def exportar_entorno_json():
    """
    Genera y descarga el archivo entorno_data.json para integración
    con dantepropiedades.com.ar
    
    Este endpoint:
    1. Lee todos los barrios de la base de datos
    2. Genera un archivo JSON estático en /static/json/
    3. Devuelve la URL de descarga
    
    Uso desde dantepropiedades.com.ar:
    fetch('http://localhost:8001/static/json/entorno_data.json')
    """
    try:
        # Asegurar que existe la carpeta de exportación
        ensure_export_folder()
        
        # Generar los datos
        datos = generar_datos_exportacion()
        
        # Escribir archivo JSON
        with open(EXPORT_FILE_PATH, 'w', encoding='utf-8') as f:
            json.dump(datos, f, ensure_ascii=False, indent=2)
        
        # Obtener tamaño del archivo
        file_size = os.path.getsize(EXPORT_FILE_PATH)
        
        # Generar URL según el host de la petición
        # En producción, esto debería usar el dominio real del CMS
        host = "http://localhost:8001"
        file_url = f"{host}/static/json/{EXPORT_FILENAME}"
        
        return {
            "success": True,
            "message": "Archivo de entorno generado correctamente",
            "file_path": EXPORT_FILE_PATH,
            "file_url": file_url,
            "file_size": file_size,
            "total_neighborhoods": datos['metadata']['total_barrios'],
            "generated_at": datos['metadata']['generado_en'],
            "download_url": file_url,
            "usage": {
                "javascript": f"fetch('{file_url}').then(r => r.json()).then(data => window.entornoData = data.data)",
                "python": f"import requests; r = requests.get('{file_url}'); data = r.json()"
            }
        }
        
    except Exception as e:
        print(f"❌ Error exportando entorno: {e}")
        raise HTTPException(status_code=500, detail=f"Error exportando: {str(e)}")


@app.get("/static/json/{filename}")
async def servir_json_estatico(filename: str):
    """
    Sirve archivos JSON estáticos con headers CORS para
    permitir acceso desde dantepropiedades.com.ar
    """
    # Validar nombre de archivo para seguridad
    if filename not in [EXPORT_FILENAME, 'entorno_data.json']:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    
    # Asegurar que la carpeta existe
    ensure_export_folder()
    
    # Verificar que el archivo existe
    if not os.path.exists(EXPORT_FILE_PATH):
        # Si no existe, generarlo automáticamente
        datos = generar_datos_exportacion()
        with open(EXPORT_FILE_PATH, 'w', encoding='utf-8') as f:
            json.dump(datos, f, ensure_ascii=False, indent=2)
    
    # Crear respuesta con el archivo
    response = FileResponse(
        EXPORT_FILE_PATH,
        media_type='application/json',
        filename=EXPORT_FILENAME
    )
    
    # Agregar headers CORS para permitir acceso desde cualquier dominio
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    response.headers['Cache-Control'] = 'public, max-age=3600'  # Cache por 1 hora
    
    return response


@app.get("/api/entorno/status")
async def estado_exportacion():
    """
    Obtiene el estado actual de la exportación y URL de acceso
    """
    ensure_export_folder()
    
    existe = os.path.exists(EXPORT_FILE_PATH)
    ultima_exportacion = None
    tamanho = 0
    
    if existe:
        ultima_exportacion = datetime.fromtimestamp(os.path.getmtime(EXPORT_FILE_PATH)).isoformat()
        tamanho = os.path.getsize(EXPORT_FILE_PATH)
    
    host = "http://localhost:8001"
    file_url = f"{host}/static/json/{EXPORT_FILENAME}"
    
    return {
        "exported": existe,
        "last_export": ultima_exportacion,
        "file_size": tamanho,
        "download_url": file_url if existe else None,
        "integration_url": file_url if existe else None,
        "instructions": {
            "step_1": f"Download: GET {file_url}",
            "step_2": "Parse response as JSON",
            "step_3": "Use data.data as neighborhood data object",
            "step_4": "Use Object.keys(data.data) for neighborhood list"
        }
    }


@app.get("/health")
async def health_check():
    """Verificación de estado del servidor"""
    return {
        "status": "healthy",
        "service": "cms-dante-barrios",
        "version": "2.0.0"
    }

# ================================================================
# ARCHIVOS ESTÁTICOS
# ================================================================

# Servir archivos estáticos del directorio actual
import os
backend_path = os.path.dirname(os.path.abspath(__file__))
if os.path.exists(backend_path):
    app.mount("/static", StaticFiles(directory=backend_path), name="static")

# ================================================================
# RUTA CATCH-ALL PARA FRONTEND (SPA)
# ================================================================

@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    """
    Ruta catch-all para manejar enrutamiento del lado del cliente (SPA).
    Sirve index.html para cualquier ruta que no coincida con los endpoints API.
    """
    # Excluir rutas API y archivos estáticos
    if full_path.startswith("api/") or full_path.startswith("static/"):
        raise HTTPException(status_code=404, detail="Ruta no encontrada")
    
    # Buscar index.html en el directorio del backend
    index_path = os.path.join(backend_path, "index.html")
    
    if os.path.exists(index_path):
        return FileResponse(index_path)
    else:
        raise HTTPException(status_code=404, detail="Página no encontrada")

# ================================================================
# EJECUCIÓN PRINCIPAL
# ================================================================

if __name__ == "__main__":
    import uvicorn
    print("=" * 60)
    print("🚀 CMS Dante Propiedades - Análisis de Barrios con IA")
    print("=" * 60)
    print(f"📡 Servidor: http://localhost:8001")
    print(f"🌐 Frontend: http://localhost:8001/")
    print(f"🔧 API: http://localhost:8001/api")
    print(f"📊 Health: http://localhost:8001/health")
    print("-" * 60)
    print("Configuración de IA:")
    print(f"  • OpenAI: {'✅ Configurada' if OPENAI_API_KEY else '❌ No configurada'}")
    print(f"  • Gemini: {'✅ Configurada' if GEMINI_API_KEY else '❌ No configurada'}")
    print("=" * 60)
    
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=False)


