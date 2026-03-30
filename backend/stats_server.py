from http.server import HTTPServer, SimpleHTTPRequestHandler
import json
import os
import subprocess
import argparse
import sys
from threading import Thread
from urllib.parse import urlparse, parse_qs
from datetime import datetime

PORT = 8005
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SCRAPER_SCRIPT = os.path.join(BASE_DIR, "scrape_market.py")
SCRAPING_JSON = os.path.join(BASE_DIR, "scraping.json")

class StatsHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)
    
    def log_message(self, format, *args):
        """Personalizar mensajes de log"""
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {args[0]}")
    
    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)
        
        print(f"📥 GET: {path}")
        
        # Endpoint: estado del servidor
        if path == "/api/status":
            self.handle_status()
            return
        
        # Endpoint: ejecutar scraping
        elif path == "/api/run-scrape":
            self.handle_run_scrape(query)
            return
        
        # Endpoint: obtener datos de scraping
        elif path == "/api/scraping-data":
            self.handle_scraping_data()
            return

        # Endpoint: obtener overview (para gráficos)
        elif path == "/api/stats/overview":
            self.handle_overview()
            return

        # Servir archivos estáticos
        else:
            super().do_GET()
    
    def handle_status(self):
        """Retornar estado del servidor"""
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        response = {
            "status": "active",
            "server": "stats-completo",
            "port": PORT,
            "scraper_available": os.path.exists(SCRAPER_SCRIPT),
            "scraping_file_exists": os.path.exists(SCRAPING_JSON),
            "endpoints": {
                "/api/run-scrape": "Ejecuta scraping (params: zona, operacion, tipo)",
                "/api/scraping-data": "Lee los datos del scraping.json",
                "/api/stats/overview": "Retorna overview para gráficos",
                "/api/status": "Estado del servidor"
            }
        }
        self.wfile.write(json.dumps(response, ensure_ascii=False).encode())
    
    def handle_run_scrape(self, query):
        """Ejecutar el script de scraping"""
        zona = query.get('zona', [''])[0]
        operacion = query.get('operacion', ['venta'])[0]
        tipo = query.get('tipo', ['departamento'])[0]
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        if not zona:
            self.wfile.write(json.dumps({"error": "Falta zona"}).encode())
            return
        
        print(f"📊 Solicitando scraping para: {zona} ({operacion}, {tipo})")
        
        def ejecutar_scraper():
            try:
                result = subprocess.run(
                    [
                        sys.executable,
                        SCRAPER_SCRIPT,
                        zona,  # ⚠️ IMPORTANTE: SIN --zona
                        "--operation", operacion,
                        "--type", tipo
                    ],
                    capture_output=True,
                    text=True,
                    timeout=180
                )

                if result.returncode == 0:
                    print(f"✅ Scraping completado para {zona}")
                    print("STDOUT:", result.stdout)
                else:
                    print("❌ Error en scraper")
                    print("STDOUT:", result.stdout)
                    print("STDERR:", result.stderr)

            except Exception as e:
                print(f"❌ Excepción ejecutando scraper: {e}")
        
        Thread(target=ejecutar_scraper).start()
        
        self.wfile.write(json.dumps({
            "success": True,
            "message": f"Scraping iniciado para {zona}",
            "zone": zona,
            "waiting": True
        }).encode())
        
        
    
    def handle_scraping_data(self):

        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()

        try:
            path = SCRAPING_JSON  # ya lo tenés definido arriba

            if not os.path.exists(path):
                self.wfile.write(json.dumps({"success": False}).encode())
                return

            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)

            self.wfile.write(json.dumps({
                "success": True,
                "data": data,
                "zone": data.get("zone"),
                "operation": data.get("operation"),
                "message": "Scraping listo"
            }).encode())

        except Exception as e:
            self.wfile.write(json.dumps({
                "success": False,
                "error": str(e)
            }).encode())
    
    def handle_overview(self):
        """Retornar overview para los gráficos del frontend"""
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        if not os.path.exists(SCRAPING_JSON):
            self.wfile.write(json.dumps({
                "success": False,
                "message": "No hay datos de scraping"
            }).encode())
            return
        
        try:
            with open(SCRAPING_JSON, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            if data.get('success') and data.get('data'):
                scraperData = data['data']
                properties_sample = scraperData.get('properties_sample', [])
                count = len(properties_sample)
                
                # Calcular distribuciones para gráficos
                distribucion_precios = {
                    '0-100k': 0,
                    '100k-200k': 0,
                    '200k-350k': 0,
                    '350k-500k': 0,
                    '500k+': 0
                }
                
                for p in properties_sample:
                    price = p.get('price', 0)
                    if price < 100000:
                        distribucion_precios['0-100k'] += 1
                    elif price < 200000:
                        distribucion_precios['100k-200k'] += 1
                    elif price < 350000:
                        distribucion_precios['200k-350k'] += 1
                    elif price < 500000:
                        distribucion_precios['350k-500k'] += 1
                    else:
                        distribucion_precios['500k+'] += 1
                
                overview = {
                    'total_propiedades': count,
                    'barrios_analizados': 1,
                    'precio_promedio_general': scraperData.get('statistics', {}).get('average_total_price', 0),
                    'precio_m2_promedio_general': scraperData.get('statistics', {}).get('average_price_per_m2', 0),
                    'distribucion_precios': distribucion_precios,
                    'distribucion_fuentes': scraperData.get('source_breakdown', {}),
                    'distribucion_moneda': scraperData.get('currency_distribution', {}),
                    'timestamp': scraperData.get('analysis_timestamp', datetime.now().isoformat())
                }
                
                # Datos para gráfico de dispersión
                scatter_data = []
                for p in properties_sample:
                    if p.get('surface', 0) > 0 and p.get('price', 0) > 0:
                        scatter_data.append({
                            'x': p.get('surface', 0),
                            'y': p.get('price', 0),
                            'operacion': p.get('operation_type', 'venta'),
                            'titulo': p.get('title', '')[:30]
                        })
                
                response = {
                    'success': True,
                    'zone': scraperData.get('zone', ''),
                    'sample_size': count,
                    'overview': overview,
                    'scatter_data': scatter_data,
                    'barrios': [{
                        'nombre': scraperData.get('zone', ''),
                        'precio_promedio': scraperData.get('statistics', {}).get('average_total_price', 0),
                        'cantidad_propiedades': count,
                        'propiedades': properties_sample
                    }]
                }
                
                self.wfile.write(json.dumps(response, ensure_ascii=False).encode())
            else:
                self.wfile.write(json.dumps({
                    "success": False,
                    "message": data.get('message', 'Error en datos')
                }).encode())
        except Exception as e:
            self.wfile.write(json.dumps({
                "success": False,
                "error": str(e)
            }).encode())

print("=" * 50)
print(f"🚀 Servidor COMPLETO de estadísticas (TODAS las funcionalidades)")
print(f"📍 Puerto: {PORT}")
print(f"📁 Directorio: {BASE_DIR}")
print("=" * 50)

try:
    server = HTTPServer(('0.0.0.0', PORT), StatsHandler)
    print(f"\n✅ Servidor iniciado en puerto {PORT}")
    print("Presiona Ctrl+C para detener")
    server.serve_forever()
except Exception as e:
    print(f"\n❌ Error: {e}")