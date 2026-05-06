from http.server import HTTPServer, SimpleHTTPRequestHandler
import json
import os
import subprocess
import sys
from threading import Thread
from urllib.parse import urlparse, parse_qs
from datetime import datetime
from pdf_generator import generate_market_report
from logic.database import save_market_stats, get_historical_stats, verificar_y_reparar_bd

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
    from logic.constants import BARRIOS_VALIDOS, BARRIOS_FALLBACK
    print(f"✅ Constantes cargadas: {len(BARRIOS_VALIDOS)} barrios")
except ImportError as e:
    print(f"❌ Error crítico: No se pudo importar de logic.constants: {e}")
    sys.exit(1) # Si no hay constantes, el servidor no debe seguir con datos inconsistentes

# ========================================
# VERIFICACIÓN DE ARCHIVOS Y BASE DE DATOS
# ========================================
verificar_y_reparar_bd()
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
        
        # Endpoint: exportar PDF
        elif path == "/api/export-pdf":
            self.handle_export_pdf()
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
                    # ✅ GUARDAR EN HISTORIAL
                    try:
                        with open(SCRAPING_JSON, 'r', encoding='utf-8') as f:
                            s_data = json.load(f)
                            stats = s_data.get('data', {}).get('statistics', {})
                            save_market_stats({
                                'zona': zona,
                                'operacion': operacion,
                                'tipo_propiedad': tipo,
                                'precio_promedio': stats.get('median_total_price') or stats.get('average_total_price'),
                                'precio_m2_promedio': stats.get('median_price_per_m2') or stats.get('average_price_per_m2'),
                                'cantidad_muestra': s_data.get('data', {}).get('sample_size'),
                                'moneda': 'USD' if tipo.lower() in ['terreno', 'terrenos'] or operacion.lower() == 'venta' else 'ARS'
                            })
                            print(f"💾 Historial guardado para {zona}")
                    except Exception as ex:
                        print(f"⚠️ Error al guardar historial: {ex}")
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
        """Retorna la lista de barrios válidos directamente desde constants.py"""
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*') # Asegurar CORS
        self.end_headers()
        
        response = {
            "success": True,
            "barrios": BARRIOS_FALLBACK,
            "total": len(BARRIOS_VALIDOS)
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
            
            # Devolver los datos tal cual están en el archivo
            self.wfile.write(json.dumps(data, ensure_ascii=False).encode())
        except Exception as e:
            self.wfile.write(json.dumps({
                "success": False,
                "error": str(e)
            }).encode())

    def handle_export_pdf(self):
        """Generar y retornar el reporte PDF"""
        print("pdf")
        if not os.path.exists(SCRAPING_JSON):
            self.send_response(404)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": "No hay datos de scraping disponibles"}).encode())
            return
        
        try:
            with open(SCRAPING_JSON, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # ✅ OBTENER HISTÓRICO PARA COMPARATIVA
            operation = data.get('operation', 'venta')
            prop_type = data.get('property_type', 'departamento')
            currency = 'USD' if prop_type.lower() in ['terreno', 'terrenos'] or operation.lower() == 'venta' else 'ARS'
            
            history = get_historical_stats(operation, prop_type, currency)
            data['history'] = history # Pasar al generador
            
            pdf_bytes = generate_market_report(data)
            
            # Formatear nombre del archivo
            zona = data.get('zone', 'mercado').replace(' ', '_')
            filename = f"Informe_Mercado_{zona}_{datetime.now().strftime('%Y%m%d')}.pdf"
            
            self.send_response(200)
            self.send_header('Content-type', 'application/pdf')
            self.send_header('Content-Disposition', f'attachment; filename="{filename}"')
            self.send_header('Content-Length', len(pdf_bytes))
            self.end_headers()
            
            self.wfile.write(pdf_bytes)
            print(f"✅ PDF generado correctamente: {filename}")
            
        except Exception as e:
            print(f"❌ Error generando PDF: {e}")
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

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