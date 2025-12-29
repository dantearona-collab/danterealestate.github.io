#!/usr/bin/env python3
"""
Script de migración para datos estáticos de barrios.
Ejecuta este script para migrar los datos de barrio_data.py a la base de datos.

Uso:
    python migrate_static_data.py [--forzar]

Opciones:
    --forzar    Sobrescribe datos existentes en la base de datos
"""

import sys
import os

# Agregar el directorio backend al path para poder importar los módulos
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime
import json
import sqlite3
from pathlib import Path

# Importar datos estáticos
from logic.barrio_data import GASTRONOMY_DATA, FINANCIAL_DATA, LOCATION_SPECIFIC_DATA

# Configuración
BARRIOS_DB_PATH = 'instance/barrios_data.db'


def get_barrios_db_connection():
    """Obtiene conexión a la base de datos de barrios"""
    Path(os.path.dirname(BARRIOS_DB_PATH)).mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(BARRIOS_DB_PATH)
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


def construir_data_cms(nombre: str, gastro_data: dict, financial_data: dict, location_specific_data: dict = None) -> dict:
    """
    Construye la estructura de datos completa para el CMS
    combinando datos de gastronomía, servicios financieros y datos específicos de ubicación.
    """
    # Calcular puntuación general basada en los datos disponibles
    puntuaciones = []
    if gastro_data and gastro_data.get('puntuacion'):
        puntuaciones.append(gastro_data['puntuacion'])
    if financial_data and financial_data.get('puntuacion'):
        puntuaciones.append(financial_data['puntuacion'])
    
    puntuacion_general = int(sum(puntuaciones) / len(puntuaciones)) if puntuaciones else 50
    
    # Construir estructura de categorías
    categorias = {}
    
    # Gastronomía
    if gastro_data:
        categorias['gastronomia'] = {
            'puntuacion': gastro_data.get('puntuacion', 50),
            'descripcion': gastro_data.get('descripcion', ''),
            'restaurantes_destacados': gastro_data.get('restaurantes_destacados', []),
            'zonas_gastronomicas': gastro_data.get('zonas_gastronomicas', []),
            'tipo_comida': gastro_data.get('tipo_comida', []),
            'bares_notables': gastro_data.get('bares_notables', []),
            'cafes_especialidad': gastro_data.get('cafes_especialidad', [])
        }
    
    # Servicios Financieros
    if financial_data:
        categorias['servicios_financieros'] = {
            'puntuacion': financial_data.get('puntuacion', 50),
            'descripcion': financial_data.get('descripcion', ''),
            'bancos': financial_data.get('bancos', []),
            'cajeros_automaticos': financial_data.get('cajeros_automaticos', []),
            'sucursales_bancarias': financial_data.get('sucursales_bancarias', []),
            'otros_servicios': financial_data.get('otros_servicios', [])
        }
    
    # Datos específicos de ubicación (desde app.js)
    if location_specific_data:
        categorias['datos_especificos'] = {
            'transporte': location_specific_data.get('transporte', ''),
            'salud': location_specific_data.get('salud', ''),
            'comercio': location_specific_data.get('comercio', ''),
            'servicios': location_specific_data.get('servicios', ''),
            'gastronomia': location_specific_data.get('gastronomia', ''),
            'recreacion': location_specific_data.get('recreacion', ''),
            'servicios_financieros': location_specific_data.get('servicios_financieros', ''),
            'educacion': location_specific_data.get('educacion', '')
        }
    
    # Construir conclusión basada en los datos
    conclusiones = []
    if gastro_data:
        conclusiones.append(f"Gastronomía: {gastro_data.get('puntuacion', 'N/A')}/100")
    if financial_data:
        conclusiones.append(f"Servicios Financieros: {financial_data.get('puntuacion', 'N/A')}/100")
    
    conclusion = f"Análisis de {nombre}: " + ". ".join(conclusiones) + "."
    
    # Resumen general
    resumen = f"{nombre.title()} es un barrio de Buenos Aires con "
    if gastro_data:
        resumen += f"una propuesta gastronómica destacada ({gastro_data.get('puntuacion', 50)}/100)"
    if gastro_data and financial_data:
        resumen += " y "
    if financial_data:
        resumen += f"excelentes servicios financieros ({financial_data.get('puntuacion', 50)}/100)"
    resumen += "."
    
    return {
        'resumen_general': resumen,
        'puntuacion_general': puntuacion_general,
        'categorias': categorias,
        'conclusion': conclusion,
        '_migrado_desde': 'barrio_data.py',
        '_fecha_migracion': datetime.now().isoformat()
    }


def migrar_datos(forzar: bool = False):
    """
    Migra los datos estáticos de barrio_data.py a la base de datos.
    
    Args:
        forzar: Si True, sobrescribe datos existentes
    """
    # Verificar flag de migración ya ejecutada
    migration_flag_file = os.path.join(os.path.dirname(os.path.abspath(BARRIOS_DB_PATH)), '.migracion_estatica_completa')
    
    if os.path.exists(migration_flag_file) and not forzar:
        print("✅ Migración ya ejecutada previamente. Saltando...")
        with open(migration_flag_file, 'r') as f:
            print(f.read())
        return
    
    print("🔄 INICIANDO MIGRACIÓN DE DATOS ESTÁTICOS A BASE DE DATOS")
    print("=" * 60)
    print(f"📅 Fecha: {datetime.now().isoformat()}")
    print(f"📁 Base de datos: {os.path.abspath(BARRIOS_DB_PATH)}")
    print("=" * 60)
    
    # Inicializar base de datos
    init_barrios_db()
    
    conn = get_barrios_db_connection()
    cursor = conn.cursor()
    
    # Contadores
    migrados = 0
    existentes = 0
    errores = 0
    barrios_procesados = []
    
    # Combinar todas las claves de ambos diccionarios
    todos_barrios = set(GASTRONOMY_DATA.keys()) | set(FINANCIAL_DATA.keys()) | set(LOCATION_SPECIFIC_DATA.keys())
    
    print(f"\n📊 Barrios a procesar: {len(todos_barrios)}")
    print(f"   - De GASTRONOMY_DATA: {len(GASTRONOMY_DATA)}")
    print(f"   - De FINANCIAL_DATA: {len(FINANCIAL_DATA)}")
    print(f"   - De LOCATION_SPECIFIC_DATA: {len(LOCATION_SPECIFIC_DATA)}")
    print(f"   - Únicos: {len(todos_barrios)}")
    print()
    
    for barrio_nombre in sorted(todos_barrios):
        try:
            # Verificar si ya existe en la base de datos
            cursor.execute('SELECT nombre FROM barrios_data WHERE nombre = ?', (barrio_nombre,))
            row = cursor.fetchone()
            
            if row and not forzar:
                print(f"   ⏭️  Saltando: {barrio_nombre}")
                existentes += 1
                continue
            
            # Obtener datos de gastronomía
            gastro_data = GASTRONOMY_DATA.get(barrio_nombre, {})
            financial_data = FINANCIAL_DATA.get(barrio_nombre, {})
            location_data = LOCATION_SPECIFIC_DATA.get(barrio_nombre, {})
            
            # Si no hay datos de ninguno, skip
            if not gastro_data and not financial_data and not location_data:
                print(f"   ⚠️  Sin datos: {barrio_nombre}")
                continue
            
            # Construir estructura de datos para el CMS
            data = construir_data_cms(barrio_nombre, gastro_data, financial_data, location_data)
            
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
                print(f"   🔄 Actualizado: {barrio_nombre}")
            else:
                # Insertar nuevo
                cursor.execute('''
                    INSERT INTO barrios_data (nombre, data, actualizado_por)
                    VALUES (?, ?, ?)
                ''', (barrio_nombre, data_json, actualizado_por))
                print(f"   ✅ Nuevo: {barrio_nombre}")
            
            migrados += 1
            barrios_procesados.append(barrio_nombre)
            
        except Exception as e:
            print(f"   ❌ Error en '{barrio_nombre}': {e}")
            errores += 1
    
    conn.commit()
    
    # Verificar migración completada
    cursor.execute('SELECT COUNT(*) FROM barrios_data')
    total_db = cursor.fetchone()[0]
    
    conn.close()
    
    # Crear flag de migración completada
    flag_content = f"""MIGRACIÓN DE DATOS ESTÁTICOS COMPLETADA
=====================================
Fecha: {datetime.now().isoformat()}
Migrados: {migrados}
Existentes (saltados): {existentes}
Errores: {errores}
Total en base de datos: {total_db}
Barrios procesados: {', '.join(barrios_procesados)}
"""
    
    with open(migration_flag_file, 'w') as f:
        f.write(flag_content)
    
    print("\n" + "=" * 60)
    print("📈 RESUMEN DE MIGRACIÓN")
    print("=" * 60)
    print(f"   ✅ Nuevos insertados:    {migrados}")
    print(f"   ⏭️  Existentes (saltados): {existentes}")
    print(f"   ❌ Errores:               {errores}")
    print(f"   📊 Total en base de datos: {total_db}")
    print("=" * 60)
    print(f"✅ Migración completada exitosamente!")
    print(f"📁 Flag guardado en: {migration_flag_file}")


if __name__ == "__main__":
    # Parsear argumentos
    forzar = '--forzar' in sys.argv or '-f' in sys.argv
    
    if forzar:
        print("⚠️  MODO FORZADO: Se sobrescribirán datos existentes\n")
    
    migrar_datos(forzar=forzar)
