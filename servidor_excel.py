#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Servidor Flask para guardar contactos del formulario en Excel
Dante Propiedades - Sistema de Registro Automático
"""

from flask import Flask, request, jsonify, send_from_directory, send_file
import pandas as pd
from datetime import datetime
import os
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Permitir requests desde el frontend

# Configuración
EXCEL_FILE = 'contactos_dante_propiedades.xlsx'
LOG_FILE = 'registro_contactos.log'

def log_contacto(mensaje):
    """Registra actividad en archivo de log"""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    with open(LOG_FILE, 'a', encoding='utf-8') as f:
        f.write(f"[{timestamp}] {mensaje}\n")

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
            df = pd.read_excel(EXCEL_FILE)
            df_nuevo = pd.DataFrame([nuevo_registro])
            df_completo = pd.concat([df, df_nuevo], ignore_index=True)
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

@app.route('/api/estadisticas', methods=['GET'])
def obtener_estadisticas():
    """
    Endpoint para obtener estadísticas de contactos
    """
    try:
        if not os.path.exists(EXCEL_FILE):
            return jsonify({
                'total_contactos': 0,
                'mensaje': 'No hay datos registrados aún'
            })
        
        df = pd.read_excel(EXCEL_FILE)
        
        # Estadísticas básicas
        total = len(df)
        hoy = datetime.now().date()
        contactos_hoy = len(df[df['Fecha'].str.startswith(str(hoy))])
        
        # Contar por tipo de interés
        intereses = df['Interés'].value_counts().to_dict()
        
        # Últimos 5 contactos
        ultimos_contactos = []
        if total > 0:
            ultimos = df.tail(5)
            for _, row in ultimos.iterrows():
                ultimos_contactos.append({
                    'fecha': row['Fecha'],
                    'nombre': row['Nombre'],
                    'email': row['Email'],
                    'telefono': row['Teléfono'],
                    'interes': row['Interés'],
                    'mensaje': row['Mensaje'][:50] + '...' if len(str(row['Mensaje'])) > 50 else row['Mensaje']
                })
        
        return jsonify({
            'total_contactos': total,
            'contactos_hoy': contactos_hoy,
            'tipos_interes': intereses,
            'ultimo_contacto': df['Fecha'].iloc[-1] if total > 0 else None,
            'ultimos_contactos': ultimos_contactos,
            'archivo_excel': EXCEL_FILE
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

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
        
        # Leer el archivo Excel
        df = pd.read_excel(EXCEL_FILE)
        
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
            contacto = {
                'nombre': str(row.get('Nombre', 'N/A')),
                'email': str(row.get('Email', 'N/A')),
                'telefono': str(row.get('Teléfono', 'N/A')),
                'mensaje': str(row.get('Mensaje', 'N/A')),
                'fecha': str(row.get('Fecha', 'N/A'))
            }
            contactos.append(contacto)
        
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

@app.route('/admin')
def admin_panel():
    """
    Panel de administración embebido directamente en el código
    """
    html_admin = """
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Panel de Administración - Dante Propiedades</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            color: white;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .header p {
            font-size: 1.1em;
            opacity: 0.9;
        }
        
        .panel {
            background: white;
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
        }
        
        .stat-number {
            font-size: 2.5em;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .stat-label {
            font-size: 1.1em;
            opacity: 0.9;
        }
        
        .actions {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .btn {
            background: #667eea;
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 25px;
            font-size: 1.1em;
            cursor: pointer;
            margin: 0 10px;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
        }
        
        .btn:hover {
            background: #5a6fd8;
            transform: translateY(-2px);
        }
        
        .btn-secondary {
            background: #28a745;
        }
        
        .btn-secondary:hover {
            background: #218838;
        }
        
        .table-container {
            background: white;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            overflow-x: auto;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        
        th {
            background: #f8f9fa;
            font-weight: bold;
            color: #333;
        }
        
        tr:hover {
            background: #f5f5f5;
        }
        
        .no-data {
            text-align: center;
            padding: 40px;
            color: #666;
            font-size: 1.1em;
        }
        
        .loading {
            text-align: center;
            padding: 20px;
            color: #667eea;
        }
        
        .status-indicator {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            display: inline-block;
            margin-right: 8px;
        }
        
        .status-online { background: #28a745; }
        .status-offline { background: #dc3545; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏢 Panel de Administración</h1>
            <p>Dante Propiedades - Gestión de Contactos</p>
            <div style="margin-top: 20px;">
                <span class="status-indicator status-online"></span>
                <span style="color: white;">Sistema Activo</span>
            </div>
        </div>
        
        <div class="panel">
            <div class="stats-grid" id="statsContainer">
                <div class="stat-card">
                    <div class="stat-number" id="totalContactos">-</div>
                    <div class="stat-label">Total Contactos</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="contactosHoy">-</div>
                    <div class="stat-label">Hoy</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="ultimoContacto">-</div>
                    <div class="stat-label">Última Actividad</div>
                </div>
            </div>
        </div>
        
        <div class="actions">
            <button class="btn btn-secondary" onclick="actualizarDatos()">
                🔄 Actualizar Datos
            </button>
            <a href="/api/descargar-excel" class="btn">
                📊 Descargar Excel
            </a>
            <a href="/" class="btn">
                🏠 Volver al Sitio
            </a>
        </div>
        
        <div class="table-container">
            <h2>📋 Últimos Contactos</h2>
            <div id="contactosContainer">
                <div class="loading">Cargando contactos...</div>
            </div>
        </div>
    </div>
    
    <script>
        function cargarEstadisticas() {
            fetch('/api/estadisticas')
                .then(response => response.json())
                .then(data => {
                    document.getElementById('totalContactos').textContent = data.total_contactos || 0;
                    document.getElementById('contactosHoy').textContent = data.contactos_hoy || 0;
                    
                    if (data.ultimo_contacto) {
                        const fecha = new Date(data.ultimo_contacto);
                        document.getElementById('ultimoContacto').textContent = 
                            fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
                    } else {
                        document.getElementById('ultimoContacto').textContent = 'Sin datos';
                    }
                })
                .catch(error => {
                    console.error('Error cargando estadísticas:', error);
                });
        }
        
        function cargarContactos() {
            fetch('/api/guardar-contacto')
                .then(response => response.json())
                .then(data => {
                    const container = document.getElementById('contactosContainer');
                    
                    if (data.contactos.length === 0) {
                        container.innerHTML = `
                            <div class="no-data">
                                📭 No hay contactos registrados aún
                            </div>
                        `;
                        return;
                    }
                    
                    let html = `
                        <table>
                            <thead>
                                <tr>
                                    <th>📅 Fecha</th>
                                    <th>👤 Nombre</th>
                                    <th>📧 Email</th>
                                    <th>📱 Teléfono</th>
                                    <th>💬 Mensaje</th>
                                </tr>
                            </thead>
                            <tbody>
                    `;
                    
                    data.contactos.slice(-10).reverse().forEach(contacto => {
                        html += `
                            <tr>
                                <td>${contacto.fecha}</td>
                                <td>${contacto.nombre}</td>
                                <td>${contacto.email}</td>
                                <td>${contacto.telefono}</td>
                                <td>${contacto.mensaje.substring(0, 50)}${contacto.mensaje.length > 50 ? '...' : ''}</td>
                            </tr>
                        `;
                    });
                    
                    html += `
                            </tbody>
                        </table>
                    `;
                    
                    container.innerHTML = html;
                })
                .catch(error => {
                    console.error('Error cargando contactos:', error);
                    document.getElementById('contactosContainer').innerHTML = `
                        <div class="no-data">
                            ❌ Error cargando contactos
                        </div>
                    `;
                });
        }
        
        function actualizarDatos() {
            document.getElementById('contactosContainer').innerHTML = 
                '<div class="loading">Actualizando datos...</div>';
            cargarEstadisticas();
            cargarContactos();
        }
        
        // Cargar datos al iniciar
        document.addEventListener('DOMContentLoaded', function() {
            cargarEstadisticas();
            cargarContactos();
            
            // Actualizar cada 30 segundos
            setInterval(actualizarDatos, 30000);
        });
    </script>
</body>
</html>
    """
    return html_admin

@app.route('/health', methods=['GET'])
def health_check():
    """Endpoint de salud del servidor"""
    return jsonify({
        'status': 'OK',
        'timestamp': datetime.now().isoformat(),
        'excel_file_exists': os.path.exists(EXCEL_FILE)
    })

@app.route('/debug-archivos', methods=['GET'])
def debug_archivos():
    """Ruta de diagnóstico para ver archivos disponibles"""
    try:
        directorio_actual = os.getcwd()
        archivos_disponibles = os.listdir('.') if os.path.exists('.') else []
        
        admin_html_existe = os.path.exists('admin.html')
        excel_existe = os.path.exists(EXCEL_FILE)
        
        return jsonify({
            'directorio_actual': directorio_actual,
            'archivos_disponibles': archivos_disponibles,
            'admin_html_existe': admin_html_existe,
            'excel_file_exists': excel_existe,
            'archivo_excel': EXCEL_FILE,
            'log_file': LOG_FILE
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Rutas para servir archivos HTML
@app.route('/', methods=['GET'])
def index():
    """Página principal"""
    return send_file('index.html')

@app.route('/formulario', methods=['GET'])
def formulario():
    """Página del formulario"""
    return send_file('formulario.html')

@app.route('/formulario.html', methods=['GET'])
def formulario_html():
    """Página del formulario (con extensión .html)"""
    return send_file('formulario.html')

@app.route('/notas-legales', methods=['GET'])
def notas_legales():
    """Página de notas legales"""
    return send_file('notas-legales.html')

@app.route('/notas-legales.html', methods=['GET'])
def notas_legales_html():
    """Página de notas legales (con extensión .html)"""
    return send_file('notas-legales.html')

@app.route('/contactos_dante_propiedades.xlsx', methods=['GET'])
def descargar_excel():
    """Permitir descargar el archivo Excel de contactos"""
    if os.path.exists(EXCEL_FILE):
        return send_file(EXCEL_FILE, as_attachment=True, download_name='contactos_dante_propiedades.xlsx')
    else:
        return jsonify({'error': 'Archivo no encontrado'}), 404

@app.route('/api/descargar-excel', methods=['GET'])
def api_descargar_excel():
    """API para descargar archivo Excel"""
    return descargar_excel()

if __name__ == '__main__':
    print("🏢 Dante Propiedades - Servidor de Contactos")
    print("=" * 50)
    print(f"📁 Archivo Excel: {EXCEL_FILE}")
    print(f"📋 Archivo Log: {LOG_FILE}")
    print("🚀 Iniciando servidor...")
    
    log_contacto("🎉 Servidor iniciado correctamente")
    
    # Crear archivo Excel inicial si no existe
    if not os.path.exists(EXCEL_FILE):
        df_inicial = pd.DataFrame(columns=[
            'Fecha', 'Nombre', 'Email', 'Teléfono', 'Interés', 
            'Presupuesto', 'Mensaje', 'Página_Origen', 'IP_Cliente', 'User_Agent'
        ])
        df_inicial.to_excel(EXCEL_FILE, index=False, engine='openpyxl')
        print("📄 Archivo Excel inicializado")
    
    # Configuración para Render (puerto dinámico)
    port = int(os.environ.get('PORT', 5000))
    print(f"🌐 Servidor corriendo en puerto: {port}")
    print("📄 Páginas web disponibles:")
    print("   / - Página principal")
    print("   /formulario - Formulario de contacto")
    print("   /notas-legales - Términos legales")
    print("   /admin - Panel de administración")
    print("   /contactos_dante_propiedades.xlsx - Descargar Excel")
    print()
    print("📡 APIs disponibles:")
    print("   POST /api/guardar-contacto - Guardar nuevo contacto")
    print("   GET  /api/estadisticas - Ver estadísticas")
    print("   GET  /health - Estado del servidor")
    print("   GET  /api/descargar-excel - Descargar archivo Excel")
    print("   GET  /debug-archivos - Diagnóstico del sistema")
    print("=" * 50)
    
    # Configuración para Render (sin debug en producción)
    debug_mode = os.environ.get('FLASK_ENV') != 'production'
    app.run(debug=debug_mode, host='0.0.0.0', port=port)
