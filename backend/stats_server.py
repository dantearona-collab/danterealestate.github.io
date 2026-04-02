from http.server import HTTPServer, SimpleHTTPRequestHandler
import json
import os
import subprocess
import sys
from threading import Thread
from urllib.parse import urlparse, parse_qs
from datetime import datetime

# ========================================
# CONFIGURACIÓN
# ========================================
PORT = 8005
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SCRAPER_SCRIPT = os.path.join(BASE_DIR, "scrape_market.py")
SCRAPING_JSON = os.path.join(BASE_DIR, "scraping.json")

# ========================================
# AGREGAR LA CARPETA LOGIC AL PATH
# ========================================
logic_dir = os.path.join(BASE_DIR, 'logic')
if logic_dir not in sys.path:
    sys.path.insert(0, logic_dir)

# ========================================
# IMPORTAR CONSTANTES CENTRALIZADAS
# ========================================
try:
    from logic.constants import BARRIOS_FALLBACK, BARRIOS_VALIDOS
    print("✅ Constantes cargadas correctamente")
except ImportError as e:
    print(f"⚠️ Error importando constants: {e}")
    # Fallback manual si no encuentra constants.py
    BARRIOS_VALIDOS = ['belgrano', 'palermo', 'recoleta', 'microcentro', 'puerto madero']
    BARRIOS_FALLBACK = [
        {"valor": b, "display": f"{b.capitalize()} - Capital Federal"}
        for b in BARRIOS_VALIDOS
    ]

# ========================================
# VERIFICACIÓN DE ARCHIVOS (OPCIONAL)
# ========================================
print(f"📁 Archivo scraping.json en: {SCRAPING_JSON}")
print(f"📁 ¿Existe? {os.path.exists(SCRAPING_JSON)}")




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
        
        # ✅ NUEVO: Endpoint para obtener lista de barrios
        elif path == "/api/barrios-lista":
            self.handle_barrios_lista()
            return

        # Endpoint: obtener overview (para gráficos)
        elif path == "/api/stats/overview":
            self.handle_overview()
            return
        
        # Servir archivos estáticos (sin return, super() ya envía respuesta)
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
                # ✅ CORREGIDO: Usar los argumentos correctamente
                cmd = [
                    sys.executable, "-X", "utf8", SCRAPER_SCRIPT,
                    "--zona", zona,
                    "--operacion", operacion,
                    "--tipo", tipo,
                    "--output", SCRAPING_JSON
                ]
                print(f"🔧 Ejecutando: {' '.join(cmd)}")
                
                env = os.environ.copy()
                env["PYTHONIOENCODING"] = "utf-8"

                result = subprocess.run(
                    cmd,
                    capture_output=True,
                    text=True,
                    encoding='utf-8',
                    timeout=180,
                    env=env
                )
                if result.returncode == 0:
                    print(f"✅ Scraping completado para {zona}")
                else:
                    print(f"❌ Error en scraper (Exit {result.returncode}):")
                    if result.stderr: print(f"--- STDERR ---\n{result.stderr}")
                    if result.stdout: print(f"--- STDOUT ---\n{result.stdout}")
            except Exception as e:
                print(f"❌ Excepción: {e}")
        
        Thread(target=ejecutar_scraper).start()
        
        self.wfile.write(json.dumps({
            "success": True,
            "message": f"Scraping iniciado para {zona}",
            "zone": zona,
            "waiting": True
        }).encode())
        
    def handle_barrios_lista(self):
        """Retorna la lista de barrios válidos desde constants.py"""
        try:
            import sys
            import os
            
            # Agregar la carpeta logic al path
            backend_dir = os.path.dirname(os.path.abspath(__file__))
            logic_dir = os.path.join(backend_dir, 'logic')
            if logic_dir not in sys.path:
                sys.path.insert(0, logic_dir)
            
            # Importar constantes
        
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            response = {
                "success": True,
                "barrios": BARRIOS_FALLBACK,
                "total": len(BARRIOS_VALIDOS)
            }
            
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode())
            
        except Exception as e:
            print(f"❌ Error en handle_barrios_lista: {e}")
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            # Fallback manual
            barrios_fallback = [
                {"valor": "belgrano", "display": "Belgrano - Capital Federal"},
                {"valor": "palermo", "display": "Palermo - Capital Federal"},
                {"valor": "recoleta", "display": "Recoleta - Capital Federal"},
                {"valor": "microcentro", "display": "Microcentro - Capital Federal"},
                {"valor": "puerto madero", "display": "Puerto Madero - Capital Federal"},
                {"valor": "caballito", "display": "Caballito - Capital Federal"},
                {"valor": "almagro", "display": "Almagro - Capital Federal"},
                {"valor": "boedo", "display": "Boedo - Capital Federal"},
                {"valor": "chacarita", "display": "Chacarita - Capital Federal"},
                {"valor": "villa crespo", "display": "Villa Crespo - Capital Federal"},
                {"valor": "nordelta", "display": "Nordelta - Tigre"},
                {"valor": "tigre", "display": "Tigre - Buenos Aires"},
                {"valor": "pilar", "display": "Pilar - Buenos Aires"},
                {"valor": "san isidro", "display": "San Isidro - Buenos Aires"}
            ]
            
            response = {
                "success": True,
                "barrios": barrios_fallback,
                "total": len(barrios_fallback),
                "warning": "Usando fallback del servidor"
            }
            
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode())
    
    
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