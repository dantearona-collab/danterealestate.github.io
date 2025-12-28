#!/usr/bin/env python3
"""
Script para poblar la base de datos de barrios con análisis de IA
extraídos de las propiedades en propiedades.json
"""
import json
import os
import sys
import time
import requests
from datetime import datetime

# Configuration
PROPIEDADES_FILE = "propiedades.json"
BACKEND_URL = "http://localhost:8000"
# API Key from the context - you may need to update this
GEMINI_API_KEY = "AIzaSyCBNgcNb7KK50O6haqcGwinaKv4MiPsmnw"

def load_properties():
    """Carga las propiedades desde el archivo JSON"""
    if not os.path.exists(PROPIEDADES_FILE):
        print(f"❌ Error: No se encontró el archivo {PROPIEDADES_FILE}")
        return []
    
    with open(PROPIEDADES_FILE, 'r', encoding='utf-8') as f:
        properties = json.load(f)
    
    return properties

def extract_unique_neighborhoods(properties):
    """Extrae barrios únicos de las propiedades"""
    neighborhoods = set()
    for prop in properties:
        barrio = prop.get('barrio', '').strip()
        if barrio:
            neighborhoods.add(barrio)
    
    return sorted(list(neighborhoods))

def check_backend_status():
    """Verifica si el backend está corriendo"""
    try:
        response = requests.get(f"{BACKEND_URL}/status", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Backend activo: {data.get('status', 'desconocido')}")
            return True
    except requests.exceptions.ConnectionError:
        print(f"⚠️ No se pudo conectar al backend en {BACKEND_URL}")
    except Exception as e:
        print(f"⚠️ Error verificando backend: {e}")
    return False

def create_barrio_with_ai(barrio_name):
    """
    Crea un barrio en la base de datos usando IA
    """
    url = f"{BACKEND_URL}/api/barrios"
    
    payload = {
        "nombre": barrio_name,
        "generar_ia": True
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        print(f"   📤 Enviando solicitud para: {barrio_name}...")
        response = requests.post(url, json=payload, headers=headers, timeout=120)
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ {barrio_name}: Generado exitosamente")
            if 'data' in data and 'puntuacion_general' in str(data.get('data', {})):
                print(f"      └─ Puntuación general: {data.get('data', {}).get('puntuacion_general', 'N/A')}")
            return True
        elif response.status_code == 400:
            # El barrio ya existe
            error_msg = response.json().get('detail', '')
            if 'ya existe' in error_msg.lower():
                print(f"   ⏭️ {barrio_name}: Ya existe en la base de datos")
                return 'exists'
            else:
                print(f"   ❌ {barrio_name}: Error - {error_msg}")
                return False
        else:
            print(f"   ❌ {barrio_name}: Error HTTP {response.status_code}")
            print(f"      Respuesta: {response.text[:200]}...")
            return False
            
    except requests.exceptions.Timeout:
        print(f"   ⏰ {barrio_name}: Timeout (la IA tardó demasiado)")
        return False
    except requests.exceptions.ConnectionError:
        print(f"   🔌 {barrio_name}: Error de conexión")
        return False
    except Exception as e:
        print(f"   ❌ {barrio_name}: Error - {e}")
        return False

def generate_barrio_direct(barrio_name):
    """
    Genera datos directamente usando Gemini y guarda en la base de datos
    (Método alternativo si el endpoint falla)
    """
    # Este método sería útil si necesitamos llamar a Gemini directamente
    # y guardar en la base de datos manualmente
    pass

def main():
    """Función principal"""
    print("=" * 80)
    print("🏠 GENERADOR DE ANÁLISIS DE BARRIOS - DANTE PROPIEDADES")
    print("=" * 80)
    print(f"📅 Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Cargar propiedades
    print("📂 Cargando propiedades...")
    properties = load_properties()
    
    if not properties:
        print("❌ No se pudieron cargar las propiedades")
        return
    
    print(f"   📊 Total de propiedades cargadas: {len(properties)}")
    
    # Extraer barrios únicos
    neighborhoods = extract_unique_neighborhoods(properties)
    print(f"   📍 Barrios únicos encontrados: {len(neighborhoods)}")
    for i, n in enumerate(neighborhoods, 1):
        print(f"      {i}. {n}")
    print()
    
    # Verificar backend
    print("🔍 Verificando conexión con backend...")
    if not check_backend_status():
        print("\n⚠️ El backend no está corriendo. Asegúrate de ejecutar:")
        print("   cd backend && python main-ai.py")
        print("\n📝 Alternativamente, puedes usar el CMS manualmente:")
        print("   1. Abre analisis-barrio.html en tu navegador")
        print("   2. Agrega cada barrio manualmente")
        return
    
    print()
    
    # Procesar cada barrio
    print("🚀 Iniciando generación de análisis de IA...")
    print("-" * 80)
    
    results = {
        'success': [],
        'exists': [],
        'failed': []
    }
    
    for i, barrio in enumerate(neighborhoods, 1):
        print(f"\n[{i}/{len(neighborhoods)}] Procesando: {barrio}")
        result = create_barrio_with_ai(barrio)
        
        if result == True:
            results['success'].append(barrio)
        elif result == 'exists':
            results['exists'].append(barrio)
        else:
            results['failed'].append(barrio)
        
        # Esperar un poco entre solicitudes para no saturar
        if i < len(neighborhoods):
            time.sleep(1)
    
    # Resumen
    print("\n" + "=" * 80)
    print("📊 RESUMEN DE PROCESAMIENTO")
    print("=" * 80)
    print(f"   ✅ Exitosos: {len(results['success'])}")
    for b in results['success']:
        print(f"      - {b}")
    
    if results['exists']:
        print(f"\n   ⏭️ Ya existían: {len(results['exists'])}")
        for b in results['exists']:
            print(f"      - {b}")
    
    if results['failed']:
        print(f"\n   ❌ Fallidos: {len(results['failed'])}")
        for b in results['failed']:
            print(f"      - {b}")
    
    total = len(results['success']) + len(results['exists']) + len(results['failed'])
    print(f"\n   Total procesados: {total}/{len(neighborhoods)}")
    
    if results['failed']:
        print("\n⚠️ Algunos barrios no pudieron ser procesados.")
        print("   Puedes intentarlos nuevamente más tarde o procesarlos manualmente.")
    
    print("\n✅ Proceso completado!")

if __name__ == "__main__":
    main()
