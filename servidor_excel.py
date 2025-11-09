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
    Página de administración para ver y gestionar contactos
    """
    try:
        return send_from_directory('.', 'admin.html')
    except Exception as e:
        return f"Error cargando panel de administración: {str(e)}", 500

@app.route('/health', methods=['GET'])
def health_check():
    """Endpoint de salud del servidor"""
    return jsonify({
        'status': 'OK',
        'timestamp': datetime.now().isoformat(),
        'excel_file_exists': os.path.exists(EXCEL_FILE)
    })

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
    print("   /contactos_dante_propiedades.xlsx - Descargar Excel")
    print()
    print("📡 APIs disponibles:")
    print("   POST /api/guardar-contacto - Guardar nuevo contacto")
    print("   GET  /api/estadisticas - Ver estadísticas")
    print("   GET  /health - Estado del servidor")
    print("   GET  /api/descargar-excel - Descargar archivo Excel")
    print("=" * 50)
    
    # Configuración para Render (sin debug en producción)
    debug_mode = os.environ.get('FLASK_ENV') != 'production'
    app.run(debug=debug_mode, host='0.0.0.0', port=port)