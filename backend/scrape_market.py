#!/usr/bin/env python3
"""
Script Standalone de Scraping y Análisis de Mercado Inmobiliario
"""
import os
import sys
import json
import argparse
from pathlib import Path
from datetime import datetime

# ========================================
# AGREGAR LA CARPETA LOGIC AL PATH
# ========================================
backend_dir = os.path.dirname(os.path.abspath(__file__))
logic_dir = os.path.join(backend_dir, 'logic')

if logic_dir not in sys.path:
    sys.path.insert(0, logic_dir)

# ========================================
# IMPORTAR CONSTANTES CENTRALIZADAS
# ========================================
try:
    from constants import (
        BARRIOS_VALIDOS,
        BARRIOS_DISPLAY,
        UBICACIONES_EXCLUIDAS,
        BARRIOS_URL_MAP
    )
    print("Constantes cargadas correctamente en scrape_market")
except ImportError as e:
    print(f"Error importando constants: {e}")
    # Fallback manual
    BARRIOS_VALIDOS = ['belgrano', 'palermo', 'recoleta', 'microcentro', 'puerto madero']
    BARRIOS_DISPLAY = {}
    UBICACIONES_EXCLUIDAS = []
    BARRIOS_URL_MAP = {}

def run_scraper(zone: str, operation: str = "venta", 
                property_type: str = "departamento",
                output_file: str = "scraping.json") -> dict:
    """
    Ejecuta el scraping de mercado inmobiliario y guarda los resultados.
    """
    print("=" * 70)
    print("SCRAPER DE MERCADO INMOBILIARIO - DANTE PROPIEDADES")
    print("=" * 70)
    print(f"[ZONA] Zona: {zone}")
    print(f"[DINERO] Operacion: {operation}")
    print(f"[CASA] Tipo de propiedad: {property_type}")
    print(f"[ARCHIVO] Archivo de salida: {output_file}")
    print("=" * 70)
    
    # Importar el gestor de scraping
    try:
        import importlib.util
        logic_path = os.path.join(os.path.dirname(__file__), 'logic', 'market_scraper.py')
        spec = importlib.util.spec_from_file_location("market_scraper", logic_path)
        market_scraper = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(market_scraper)
        ScrapingManager = market_scraper.ScrapingManager
        print("[OK] Modulo de scraping importado correctamente")
    except Exception as e:
        print(f"[ERROR] Error importando modulo de scraping: {e}")
        return {
            "success": False,
            "error": f"Error importando módulo de scraping: {e}"
        }
    
    # Inicializar el gestor de scraping
    try:
        manager = ScrapingManager()
        print("[OK] ScrapingManager inicializado")
    except Exception as e:
        print(f"[ERROR] Error inicializando ScrapingManager: {e}")
        return {
            "success": False,
            "error": f"Error inicializando ScrapingManager: {e}"
        }
    
    # Ejecutar el scraping
    print("\n[INICIO] Iniciando scraping de portales inmobiliarios...")
    print("[INFO] Este proceso puede tomar varios minutos debido a los delays anti-bloqueo\n")
    
    try:
        result = manager.scrape_market(zone, operation, property_type)
    except Exception as e:
        print(f"[ERROR] Error durante el scraping: {e}")
        return {
            "success": False,
            "error": f"Error durante el scraping: {e}"
        }
    
    # Formatear el resultado final
    final_result = {
        "success": result.get('sample_size', 0) > 0,
        "message": f"Analizadas {result.get('sample_size', 0)} propiedades de {result.get('raw_properties_count', 0)} extraídas",
        "zone": zone,
        "operation": operation,
        "property_type": property_type,
        "scraping_timestamp": datetime.now().isoformat(),
        "data": result,
        "errors": result.get('errors', [])
    }
    
    # Guardar en archivo JSON
    print(f"\n[GUARDANDO] Guardando resultados en: {output_file}")
    
    try:
        output_dir = os.path.dirname(os.path.abspath(output_file))
        if output_dir and not os.path.exists(output_dir):
            os.makedirs(output_dir, exist_ok=True)
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(final_result, f, ensure_ascii=False, indent=2)
        
        print(f"[OK] Archivo guardado exitosamente: {output_file}")
        
    except Exception as e:
        print(f"[ERROR] Error guardando archivo: {e}")
        final_result["file_error"] = str(e)
    
    # Mostrar resumen en consola
    print("\n" + "=" * 70)
    print("[ESTADISTICAS] RESUMEN DEL ANALISIS DE MERCADO")
    print("=" * 70)
    
    if final_result["success"]:
        stats = result.get('statistics', {})
        print(f"[OK] Muestra analizada: {result.get('sample_size', 0)} propiedades")
        print(f"[SUBE] Precio m2 promedio: ${stats.get('average_price_per_m2', 0):,.2f}")
        print(f"[BAJA] Precio m2 mediano: ${stats.get('median_price_per_m2', 0):,.2f}")
        print(f"[RANGO] Rango de precios: {stats.get('price_range_total', 'N/A')}")
        print(f"\n[SOURCES] Fuentes consultadas:")
        for source, count in result.get('source_breakdown', {}).items():
            print(f"   - {source}: {count} propiedades")
        print(f"\n[MONEDA] Distribucion por moneda:")
        for currency, count in result.get('currency_distribution', {}).items():
            print(f"   - {currency}: {count} propiedades")
    else:
        print("[WARNING] No se pudieron obtener datos del mercado")
        if final_result.get('errors'):
            print("\nErrores encontrados:")
            for error in final_result['errors']:
                print(f"   - {error}")
    
    print("=" * 70)
    print(f"[OK] Proceso completado en: {datetime.now().isoformat()}")
    print("=" * 70)
    
    return final_result


def main():
    parser = argparse.ArgumentParser(
        description="Script de Scraping y Análisis de Mercado Inmobiliario"
    )
    
    parser.add_argument(
        '--zona', '-z',
        type=str,
        required=True,
        help='Zona o barrio a analizar (requerido)'
    )
    
    parser.add_argument(
        '--operacion', '-o',
        type=str,
        default='venta',
        choices=['venta', 'alquiler'],
        help='Tipo de operacion (default: venta)'
    )
    
    parser.add_argument(
        '--tipo', '-t',
        type=str,
        default='departamento',
        help='Tipo de propiedad (default: departamento)'
    )
    
    parser.add_argument(
        '--output', '-f',
        type=str,
        default='scraping.json',
        help='Ruta del archivo JSON de salida (default: scraping.json)'
    )
    
    args = parser.parse_args()
    
    result = run_scraper(
        zone=args.zona,
        operation=args.operacion,
        property_type=args.tipo,
        output_file=args.output
    )
    
    sys.exit(0 if result.get("success", False) else 1)


if __name__ == "__main__":
    main()