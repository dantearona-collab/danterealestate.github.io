#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PARCHE URGENTE - Corregir error 'Fecha' en API de estadísticas
Dante Propiedades - Solución para problema "desconectado"
"""

from flask import Flask, request, jsonify, send_file
import pandas as pd
from datetime import datetime
import os
from flask_cors import CORS



app = Flask(__name__)

# ✅ CONFIGURACIÓN CORS ESPECÍFICA PARA TU DOMINIO
CORS(app, resources={
    r"/api/*": {
        "origins": ["https://www.dantepropiedades.com.ar", "https://dantepropiedades.com.ar"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    },
    r"/debug": {
        "origins": ["https://www.dantepropiedades.com.ar", "https://dantepropiedades.com.ar"]
    }
})

# ✅ O esta configuración más simple (permite todos los orígenes):
CORS(app)  # Esto permitirá requests desde cualquier dominio


@app.after_request
def after_request(response):
    """Agregar headers CORS a todas las respuestas"""
    response.headers.add('Access-Control-Allow-Origin', 'https://www.dantepropiedades.com.ar')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response


# Configuración
EXCEL_FILE = 'contactos_dante_propiedades.xlsx'
LOG_FILE = 'registro_contactos.log'

def log_contacto(mensaje):
    """Registra actividad en archivo de log"""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    try:
        with open(LOG_FILE, 'a', encoding='utf-8') as f:
            f.write(f"[{timestamp}] {mensaje}\n")
    except:
        pass  # Si no puede escribir al log, continuar

def guardar_contacto_excel(datos):
    """
    Guarda un nuevo contacto en el archivo Excel
    """
    try:
        fecha_hora = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        # Nuevo registro
        nuevo_registro = {
            'Fecha': fecha_hora,
            'Nombre': datos.get('nombre', ''),
            'Email': datos.get('email', ''),
            'Teléfono': datos.get('telefono', ''),
            'Interés': datos.get('interes', ''),
            'Presupuesto': datos.get('presupuesto', ''),
            'Mensaje': datos.get('mensaje', ''),
            'Página_Origen': datos.get('pagina_origen', ''),
            'IP_Cliente': request.remote_addr,
            'User_Agent': request.headers.get('User-Agent', '')[:100] + '...'
        }
        
        # Verificar si el archivo existe
        if os.path.exists(EXCEL_FILE):
            # Leer archivo existente y agregar nuevo registro
            try:
                df = pd.read_excel(EXCEL_FILE)
                df_nuevo = pd.DataFrame([nuevo_registro])
                df_completo = pd.concat([df, df_nuevo], ignore_index=True)
            except Exception as e:
                # Si hay error, crear nuevo archivo
                log_contacto(f"⚠️ Error leyendo Excel: {str(e)}. Creando nuevo archivo.")
                df_completo = pd.DataFrame([nuevo_registro])
        else:
            # Crear nuevo archivo con encabezados
            df_completo = pd.DataFrame([nuevo_registro])
        
        # Guardar archivo Excel
        df_completo.to_excel(EXCEL_FILE, index=False, engine='openpyxl')
        
        log_contacto(f"✅ Contacto guardado: {datos.get('nombre', 'Sin nombre')} - {datos.get('email', 'Sin email')}")
        
        return True, f"Contacto registrado exitosamente: {nuevo_registro['Nombre']}"
        
    except Exception as e:
        error_msg = f"❌ Error al guardar contacto: {str(e)}"
        log_contacto(error_msg)
        return False, error_msg

def obtener_contactos():
    """
    Función para obtener la lista de contactos guardados
    """
    try:
        if not os.path.exists(EXCEL_FILE):
            return jsonify({
                'success': True,
                'contactos': [],
                'total': 0,
                'mensaje': 'No hay contactos registrados aún'
            })
        
        try:
            # Leer el archivo Excel
            df = pd.read_excel(EXCEL_FILE)
        except Exception as e:
            log_contacto(f"⚠️ Error leyendo Excel en obtener_contactos: {str(e)}")
            return jsonify({
                'success': True,
                'contactos': [],
                'total': 0,
                'mensaje': f'Error leyendo datos: {str(e)}'
            })
        
        if df.empty:
            return jsonify({
                'success': True,
                'contactos': [],
                'total': 0,
                'mensaje': 'No hay contactos registrados aún'
            })
        
        # Convertir DataFrame a lista de diccionarios
        contactos = []
        for _, row in df.iterrows():
            try:
                contacto = {
                    'nombre': str(row.get('Nombre', 'N/A')),
                    'email': str(row.get('Email', 'N/A')),
                    'telefono': str(row.get('Teléfono', 'N/A')),
                    'mensaje': str(row.get('Mensaje', 'N/A')),
                    'fecha': str(row.get('Fecha', 'N/A'))
                }
                contactos.append(contacto)
            except Exception as e:
                log_contacto(f"⚠️ Error procesando fila: {str(e)}")
                continue
        
        return jsonify({
            'success': True,
            'contactos': contactos,
            'total': len(contactos),
            'mensaje': f'Total de contactos: {len(contactos)}'
        })
        
    except Exception as e:
        error_msg = f"❌ Error al obtener contactos: {str(e)}"
        log_contacto(error_msg)
        return jsonify({
            'success': False,
            'error': str(e),
            'mensaje': 'Error al obtener la lista de contactos'
        }), 500

@app.route('/api/guardar-contacto', methods=['GET', 'POST'])
def guardar_contacto():
    """
    Endpoint para recibir y guardar datos del formulario (POST)
    o obtener la lista de contactos (GET)
    """
    if request.method == 'GET':
        return obtener_contactos()
    
    # POST: Guardar contacto
    try:
        # Obtener datos JSON
        datos = request.get_json()
        
        if not datos:
            return jsonify({
                'success': False,
                'message': 'No se recibieron datos'
            }), 400
        
        # Validar campos obligatorios
        campos_obligatorios = ['nombre', 'email', 'mensaje']
        for campo in campos_obligatorios:
            if not datos.get(campo, '').strip():
                return jsonify({
                    'success': False,
                    'message': f'Campo obligatorio faltante: {campo}'
                }), 400
        
        # Agregar información adicional
        datos['pagina_origen'] = request.headers.get('Origin', '')
        
        # Guardar en Excel
        exito, mensaje = guardar_contacto_excel(datos)
        
        if exito:
            return jsonify({
                'success': True,
                'message': 'Contacto guardado exitosamente',
                'datos_guardados': {
                    'nombre': datos['nombre'],
                    'email': datos['email'],
                    'fecha': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                }
            })
        else:
            return jsonify({
                'success': False,
                'message': mensaje
            }), 500
            
    except Exception as e:
        error_msg = f"Error en endpoint: {str(e)}"
        log_contacto(error_msg)
        return jsonify({
            'success': False,
            'message': 'Error interno del servidor'
        }), 500

# API ESTADÍSTICAS CORREGIDA - SIN ERROR DE 'FECHA'
@app.route('/api/estadisticas', methods=['GET'])
def obtener_estadisticas():
    """
    Endpoint para obtener estadísticas de contactos - VERSIÓN CORREGIDA
    """
    try:
        if not os.path.exists(EXCEL_FILE):
            return jsonify({
                'total_contactos': 0,
                'contactos_hoy': 0,
                'mensaje': 'No hay datos registrados aún'
            })
        
        try:
            # Leer archivo Excel
            df = pd.read_excel(EXCEL_FILE)
        except Exception as e:
            log_contacto(f"⚠️ Error leyendo Excel en estadísticas: {str(e)}")
            return jsonify({
                'total_contactos': 0,
                'contactos_hoy': 0,
                'mensaje': f'Error leyendo datos: {str(e)}'
            })
        
        if df.empty:
            return jsonify({
                'total_contactos': 0,
                'contactos_hoy': 0,
                'mensaje': 'No hay datos registrados aún'
            })
        
        # Estadísticas básicas - CON MANEJO SEGURO DE ERRORES
        total = len(df)
        hoy = datetime.now().date()
        contactos_hoy = 0
        ultimo_contacto = None
        
        try:
            # Verificar si existe la columna 'Fecha' con manejo de errores
            columnas = df.columns.tolist()
            fecha_col = None
            
            # Buscar columna de fecha con diferentes variaciones
            for col in columnas:
                if 'fecha' in col.lower() or col == 'Fecha':
                    fecha_col = col
                    break
            
            if fecha_col and fecha_col in df.columns:
                # Contar contactos de hoy
                try:
                    contactos_hoy = len(df[df[fecha_col].astype(str).str.startswith(str(hoy), na=False)])
                    ultimo_contacto = str(df[fecha_col].iloc[-1]) if len(df) > 0 else None
                except Exception as e:
                    log_contacto(f"⚠️ Error procesando fechas: {str(e)}")
                    contactos_hoy = 0
                    ultimo_contacto = None
            else:
                log_contacto(f"⚠️ No se encontró columna 'Fecha'. Columnas disponibles: {columnas}")
                contactos_hoy = 0
                ultimo_contacto = None
                
        except Exception as e:
            log_contacto(f"⚠️ Error en cálculo de estadísticas: {str(e)}")
            contactos_hoy = 0
            ultimo_contacto = None
        
        return jsonify({
            'total_contactos': total,
            'contactos_hoy': contactos_hoy,
            'ultimo_contacto': ultimo_contacto,
            'mensaje': f'Total: {total}, Hoy: {contactos_hoy}'
        })
        
    except Exception as e:
        log_contacto(f"❌ Error crítico en estadísticas: {str(e)}")
        return jsonify({
            'total_contactos': 0,
            'contactos_hoy': 0,
            'error': str(e),
            'mensaje': 'Error interno del servidor'
        }), 500

# RUTA ADMIN - VERSIÓN MEJORADA
@app.route('/admin')
def admin_panel():
    """Panel de administración embebido - VERSIÓN CORREGIDA"""
    return '''<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Panel de Administración - Dante Propiedades</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f0f0f0; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; color: #333; }
        .stats { display: flex; gap: 20px; margin-bottom: 30px; }
        .stat-card { background: white; padding: 20px; border-radius: 10px; text-align: center; flex: 1; }
        .btn { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; text-decoration: none; display: inline-block; margin: 5px; }
        .btn:hover { background: #0056b3; }
        .btn.connected { background: #28a745; }
        .btn.disconnected { background: #dc3545; }
        table { width: 100%; border-collapse: collapse; background: white; border-radius: 10px; overflow: hidden; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; }
        .loading { text-align: center; padding: 20px; color: #666; }
        .error { color: #dc3545; background: #f8d7da; padding: 10px; border-radius: 5px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏢 Panel de Administración</h1>
            <p>Dante Propiedades - Gestión de Contactos</p>
            <div id="conexionStatus" class="loading">Verificando conexión...</div>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <h3>Total Contactos</h3>
                <div id="totalContactos">-</div>
            </div>
            <div class="stat-card">
                <h3>Hoy</h3>
                <div id="contactosHoy">-</div>
            </div>
            <div class="stat-card">
                <h3>Último</h3>
                <div id="ultimoContacto">-</div>
            </div>
        </div>
        
        <div style="text-align: center; margin-bottom: 20px;">
            <a href="/api/descargar-excel" class="btn">📊 Descargar Excel</a>
            <button class="btn" onclick="actualizarDatos()">🔄 Actualizar</button>
            <a href="/" class="btn">🏠 Sitio Principal</a>
            <button class="btn" onclick="testearConexion()">🔍 Probar Conexión</button>
        </div>
        
        <div id="contactosContainer">
            <div class="loading">Cargando contactos...</div>
        </div>
    </div>
    
    <script>
        let conectado = false;
        
        function actualizarStatusConexion(status, mensaje) {
            const statusDiv = document.getElementById('conexionStatus');
            const botonProbar = document.querySelector('button[onclick="testearConexion()"]');
            
            if (status) {
                statusDiv.innerHTML = '✅ Conectado - ' + mensaje;
                statusDiv.style.color = '#28a745';
                botonProbar.className = 'btn connected';
                botonProbar.innerHTML = '✅ Conectado';
            } else {
                statusDiv.innerHTML = '❌ Desconectado - ' + mensaje;
                statusDiv.style.color = '#dc3545';
                botonProbar.className = 'btn disconnected';
                botonProbar.innerHTML = '❌ Desconectado';
            }
        }
        
        function testearConexion() {
            console.log('🔍 Probando conexión...');
            actualizarStatusConexion(false, 'Probando...');
            
            fetch('/debug')
                .then(response => response.json())
                .then(data => {
                    console.log('✅ Conexión OK:', data);
                    actualizarStatusConexion(true, 'Backend funcionando');
                    conectado = true;
                })
                .catch(error => {
                    console.error('❌ Error de conexión:', error);
                    actualizarStatusConexion(false, 'Error de conexión');
                    conectado = false;
                });
        }
        
        function cargarEstadisticas() {
            console.log('📊 Cargando estadísticas...');
            fetch('/api/estadisticas')
                .then(response => {
                    console.log('📊 Status respuesta:', response.status);
                    return response.json();
                })
                .then(data => {
                    console.log('📊 Datos recibidos:', data);
                    document.getElementById('totalContactos').textContent = data.total_contactos || 0;
                    document.getElementById('contactosHoy').textContent = data.contactos_hoy || 0;
                    if (data.ultimo_contacto && data.ultimo_contacto !== 'None') {
                        try {
                            const fecha = new Date(data.ultimo_contacto);
                            document.getElementById('ultimoContacto').textContent = 
                                fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
                        } catch (e) {
                            document.getElementById('ultimoContacto').textContent = 
                                String(data.ultimo_contacto).substring(0, 10);
                        }
                    } else {
                        document.getElementById('ultimoContacto').textContent = 'Sin datos';
                    }
                })
                .catch(error => {
                    console.error('❌ Error cargando estadísticas:', error);
                    document.getElementById('totalContactos').textContent = 'Error';
                    document.getElementById('contactosHoy').textContent = 'Error';
                    document.getElementById('ultimoContacto').textContent = 'Error';
                });
        }
        
        function cargarContactos() {
            console.log('📋 Cargando contactos...');
            fetch('/api/guardar-contacto')
                .then(response => {
                    console.log('📋 Status respuesta:', response.status);
                    return response.json();
                })
                .then(data => {
                    console.log('📋 Datos recibidos:', data);
                    const container = document.getElementById('contactosContainer');
                    
                    if (data.contactos && data.contactos.length === 0) {
                        container.innerHTML = '<div class="loading">📭 No hay contactos registrados</div>';
                        return;
                    }
                    
                    if (!data.contactos || data.contactos.length === undefined) {
                        container.innerHTML = '<div class="error">❌ Error en respuesta del servidor</div>';
                        return;
                    }
                    
                    let html = '<table><tr><th>Fecha</th><th>Nombre</th><th>Email</th><th>Teléfono</th><th>Mensaje</th></tr>';
                    
                    data.contactos.slice(-10).reverse().forEach(contacto => {
                        html += '<tr>' +
                            '<td>' + (contacto.fecha || 'N/A') + '</td>' +
                            '<td>' + (contacto.nombre || 'N/A') + '</td>' +
                            '<td>' + (contacto.email || 'N/A') + '</td>' +
                            '<td>' + (contacto.telefono || 'N/A') + '</td>' +
                            '<td>' + ((contacto.mensaje || '').substring(0, 30) + ((contacto.mensaje || '').length > 30 ? '...' : '')) + '</td>' +
                        '</tr>';
                    });
                    
                    html += '</table>';
                    container.innerHTML = html;
                })
                .catch(error => {
                    console.error('❌ Error cargando contactos:', error);
                    document.getElementById('contactosContainer').innerHTML = 
                        '<div class="error">❌ Error cargando contactos: ' + error.message + '</div>';
                });
        }
        
        function actualizarDatos() {
            document.getElementById('contactosContainer').innerHTML = '<div class="loading">Actualizando...</div>';
            testearConexion();
            setTimeout(() => {
                cargarEstadisticas();
                cargarContactos();
            }, 1000);
        }
        
        // Cargar datos al iniciar
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🚀 Inicializando admin panel...');
            testearConexion();
            setTimeout(() => {
                cargarEstadisticas();
                cargarContactos();
            }, 1000);
            
            // Actualizar cada 30 segundos
            setInterval(actualizarDatos, 30000);
        });
    </script>
</body>
</html>'''

# RUTA DEBUG - VERSIÓN MEJORADA
@app.route('/debug', methods=['GET'])
def debug():
    """Ruta de diagnóstico - VERSIÓN CORREGIDA"""
    try:
        excel_existe = os.path.exists(EXCEL_FILE)
        archivos = []
        try:
            if os.path.exists('.'):
                archivos = os.listdir('.')[:10]  # Solo primeros 10 archivos
        except:
            archivos = ['Error listando archivos']
            
        return jsonify({
            'status': 'ok',
            'message': 'Flask funcionando correctamente',
            'timestamp': datetime.now().isoformat(),
            'directorio': os.getcwd() if os.path.exists('.') else 'No accesible',
            'archivos_disponibles': archivos,
            'excel_existe': excel_existe,
            'excel_path': EXCEL_FILE if excel_existe else 'No existe'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/descargar-excel', methods=['GET'])
def api_descargar_excel():
    """API para descargar archivo Excel"""
    try:
        if os.path.exists(EXCEL_FILE):
            return send_file(EXCEL_FILE, as_attachment=True, download_name='contactos_dante_propiedades.xlsx')
        else:
            return jsonify({'error': 'Archivo no encontrado'}), 404
    except Exception as e:
        log_contacto(f"Error en descarga Excel: {str(e)}")
        return jsonify({'error': str(e)}), 500

# RUTAS PARA ARCHIVOS
@app.route('/', methods=['GET'])
def index():
    """Página principal"""
    try:
        return send_file('index.html')
    except:
        return "Página principal no disponible", 404

@app.route('/formulario', methods=['GET'])
def formulario():
    """Página del formulario"""
    try:
        return send_file('formulario.html')
    except:
        return "Formulario no disponible", 404

if __name__ == '__main__':
    print("🏢 Dante Propiedades - Servidor PARCHE CORREGIDO")
    print("=" * 60)
    print(f"📁 Archivo Excel: {EXCEL_FILE}")
    print(f"📋 Archivo Log: {LOG_FILE}")
    print("🚀 Iniciando servidor...")
    
    log_contacto("🎉 Servidor iniciado correctamente con parche de 'Fecha'")
    
    # Crear archivo Excel inicial si no existe
    if not os.path.exists(EXCEL_FILE):
        try:
            df_inicial = pd.DataFrame(columns=[
                'Fecha', 'Nombre', 'Email', 'Teléfono', 'Interés', 
                'Presupuesto', 'Mensaje', 'Página_Origen', 'IP_Cliente', 'User_Agent'
            ])
            df_inicial.to_excel(EXCEL_FILE, index=False, engine='openpyxl')
            print("📄 Archivo Excel inicializado")
            log_contacto("📄 Archivo Excel creado inicialmente")
        except Exception as e:
            print(f"⚠️ Error inicializando Excel: {str(e)}")
    
    # Configuración para Render (puerto dinámico)
    port = int(os.environ.get('PORT', 5000))
    print(f"🌐 Servidor corriendo en puerto: {port}")
    print("📄 Páginas web disponibles:")
    print("   / - Página principal")
    print("   /formulario - Formulario de contacto")
    print("   /admin - Panel de administración")
    print("   /api/descargar-excel - Descargar Excel")
    print()
    print("📡 APIs disponibles:")
    print("   POST /api/guardar-contacto - Guardar nuevo contacto")
    print("   GET  /api/estadisticas - Ver estadísticas (CORREGIDA)")
    print("   GET  /api/descargar-excel - Descargar archivo Excel")
    print("   GET  /debug - Diagnóstico del sistema (MEJORADO)")
    print("=" * 60)
    
    # Configuración para Render (sin debug en producción)
    debug_mode = os.environ.get('FLASK_ENV') != 'production'
    app.run(debug=debug_mode, host='0.0.0.0', port=port)