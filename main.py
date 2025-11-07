# pip install -r requirements.txt

import sys
import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from openpyxl import Workbook, load_workbook
from datetime import datetime

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": ["null", "http://dantepropiedades.com.ar", "http://www.dantepropiedades.com.ar", "https://dantepropiedades.com.ar", "https://www.dantepropiedades.com.ar", "http://dantepropiedades.com", "https://danterealestate-github-io.onrender.com"]}})

# --- Excel Contact Logic ---
EXCEL_FILE = 'contactos_dante_propiedades.xlsx'

def safe_print(message):
    """Función segura para imprimir sin problemas de codificación"""
    safe_message = message.encode('ascii', 'ignore').decode('ascii')
    print(safe_message)

def init_excel():
    """Initializes the Excel file if it does not exist"""
    if not os.path.exists(EXCEL_FILE):
        wb = Workbook()
        ws = wb.active
        ws.title = "Contactos"
        ws['A1'] = 'Fecha/Hora'
        ws['B1'] = 'Nombre'
        ws['C1'] = 'Firma'
        ws['D1'] = 'Teléfono'
        ws['E1'] = 'Propiedad'
        ws.column_dimensions['A'].width = 20
        ws.column_dimensions['B'].width = 25
        ws.column_dimensions['C'].width = 15
        ws.column_dimensions['D'].width = 15
        ws.column_dimensions['E'].width = 15
        wb.save(EXCEL_FILE)
        safe_print(f"SUCCESS: Archivo {EXCEL_FILE} creado exitosamente")
    else:
        safe_print(f"INFO: Archivo {EXCEL_FILE} encontrado")

@app.route('/guardar_contacto', methods=['POST', 'OPTIONS'])
def guardar_contacto_route():
    """Endpoint to save form data"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json()
        init_excel()
        
        fecha_hora = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        nombre = data.get('nombre', '').strip()
        firma = data.get('firma', '').strip()
        telefono = data.get('telefono', '').strip()
        propiedad = data.get('propiedad', '').strip()
        
        if not nombre and not telefono:
            return jsonify({'error': 'Se requiere al menos nombre o teléfono'}), 400
        
        wb = load_workbook(EXCEL_FILE)
        ws = wb.active
        next_row = ws.max_row + 1
        
        ws[f'A{next_row}'] = fecha_hora
        ws[f'B{next_row}'] = nombre
        ws[f'C{next_row}'] = firma
        ws[f'D{next_row}'] = telefono
        ws[f'E{next_row}'] = propiedad
        
        wb.save(EXCEL_FILE)
        safe_print(f"SUCCESS: Contacto guardado - {nombre} - {telefono} - {fecha_hora}")
        
        return jsonify({'message': 'Contacto guardado exitosamente'}), 200
        
    except Exception as e:
        safe_print(f"ERROR: {str(e)}")
        return jsonify({'error': f'Error interno: {str(e)}'}), 500

# --- Property Search API ---
@app.route('/api/properties/search', methods=['GET'])
def search_properties():
    """Advanced property search with filters"""
    try:
        # Load properties data
        with open('propriedades.json', 'r', encoding='utf-8') as f:
            properties = json.load(f)
        
        # Get filter parameters
        operacion = request.args.get('operacion', '').lower()
        barrio = request.args.get('barrio', '').lower()
        tipo = request.args.get('tipo', '').lower()
        precio_min = request.args.get('precio_min')
        precio_max = request.args.get('precio_max')
        ambientes = request.args.get('ambientes')
        metros = request.args.get('metros')
        search_term = request.args.get('search', '').lower()
        
        # Apply filters
        filtered_properties = properties
        
        if operacion:
            filtered_properties = [p for p in filtered_properties if 
                                 p.get('operacion', '').lower() == operacion]
        
        if barrio:
            filtered_properties = [p for p in filtered_properties if 
                                 barrio in p.get('barrio', '').lower()]
        
        if tipo:
            filtered_properties = [p for p in filtered_properties if 
                                 tipo in p.get('tipo', '').lower()]
        
        if precio_min:
            try:
                min_price = float(precio_min)
                filtered_properties = [p for p in filtered_properties 
                                     if float(p.get('precio', 0)) >= min_price]
            except ValueError:
                pass
        
        if precio_max:
            try:
                max_price = float(precio_max)
                filtered_properties = [p for p in filtered_properties 
                                     if float(p.get('precio', 0)) <= max_price]
            except ValueError:
                pass
        
        if ambientes:
            try:
                target_ambientes = int(ambientes)
                filtered_properties = [p for p in filtered_properties 
                                     if int(p.get('ambientes', 0)) == target_ambientes]
            except ValueError:
                pass
        
        if metros:
            try:
                target_metros = int(metros)
                filtered_properties = [p for p in filtered_properties 
                                     if int(p.get('metros', 0)) >= target_metros]
            except ValueError:
                pass
        
        if search_term:
            filtered_properties = [p for p in filtered_properties if 
                                 search_term in p.get('titulo', '').lower() or
                                 search_term in p.get('descripcion', '').lower() or
                                 search_term in p.get('direccion', '').lower() or
                                 search_term in p.get('barrio', '').lower()]
        
        # Return results with metadata
        return jsonify({
            'properties': filtered_properties,
            'total': len(filtered_properties),
            'filters_applied': {
                'operacion': operacion,
                'barrio': barrio,
                'tipo': tipo,
                'precio_min': precio_min,
                'precio_max': precio_max,
                'ambientes': ambientes,
                'metros': metros,
                'search': search_term
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Error searching properties: {str(e)}'}), 500

@app.route('/api/properties/filter-options', methods=['GET'])
def get_filter_options():
    """Get available filter options from data"""
    try:
        with open('propriedades.json', 'r', encoding='utf-8') as f:
            properties = json.load(f)
        
        # Extract unique values for filters
        barrios = list(set(p.get('barrio', '') for p in properties if p.get('barrio')))
        tipos = list(set(p.get('tipo', '') for p in properties if p.get('tipo')))
        operaciones = list(set(p.get('operacion', '') for p in properties if p.get('operacion')))
        
        # Get price range
        precios = [float(p.get('precio', 0)) for p in properties if p.get('precio')]
        precio_min = min(precios) if precios else 0
        precio_max = max(precios) if precios else 0
        
        # Get ambiente range
        ambientes = [int(p.get('ambientes', 0)) for p in properties if p.get('ambientes')]
        ambiente_min = min(ambientes) if ambientes else 0
        ambiente_max = max(ambientes) if ambientes else 0
        
        return jsonify({
            'barrios': sorted([b for b in barrios if b]),
            'tipos': sorted([t for t in tipos if t]),
            'operaciones': sorted([o for o in operaciones if o]),
            'precio_range': {'min': int(precio_min), 'max': int(precio_max)},
            'ambiente_range': {'min': int(ambiente_min), 'max': int(ambiente_max)}
        })
        
    except Exception as e:
        return jsonify({'error': f'Error getting filter options: {str(e)}'}), 500

@app.route('/api/properties/stats', methods=['GET'])
def get_property_stats():
    """Get property statistics"""
    try:
        with open('propriedades.json', 'r', encoding='utf-8') as f:
            properties = json.load(f)
        
        stats = {
            'total_properties': len(properties),
            'by_operacion': {},
            'by_tipo': {},
            'by_barrio': {},
            'price_stats': {},
            'ambiente_stats': {}
        }
        
        # Count by operation
        for prop in properties:
            operacion = prop.get('operacion', 'Sin especificar')
            stats['by_operacion'][operacion] = stats['by_operacion'].get(operacion, 0) + 1
            
            tipo = prop.get('tipo', 'Sin especificar')
            stats['by_tipo'][tipo] = stats['by_tipo'].get(tipo, 0) + 1
            
            barrio = prop.get('barrio', 'Sin especificar')
            stats['by_barrio'][barrio] = stats['by_barrio'].get(barrio, 0) + 1
        
        # Price statistics
        precios = [float(p.get('precio', 0)) for p in properties if p.get('precio')]
        if precios:
            stats['price_stats'] = {
                'min': min(precios),
                'max': max(precios),
                'average': sum(precios) / len(precios)
            }
        
        # Ambiente statistics
        ambientes = [int(p.get('ambientes', 0)) for p in properties if p.get('ambientes')]
        if ambientes:
            stats['ambiente_stats'] = {
                'min': min(ambientes),
                'max': max(ambientes),
                'average': sum(ambientes) / len(ambientes)
            }
        
        return jsonify(stats)
        
    except Exception as e:
        return jsonify({'error': f'Error getting statistics: {str(e)}'}), 500

@app.route('/api/properties/<int:property_id>', methods=['GET'])
def get_property(property_id):
    """Get single property by ID"""
    try:
        with open('propriedades.json', 'r', encoding='utf-8') as f:
            properties = json.load(f)
        
        # Find property by id_temporal
        property_obj = None
        for prop in properties:
            if str(prop.get('id_temporal', '')) == str(property_id):
                property_obj = prop
                break
        
        if not property_obj:
            return jsonify({'error': 'Property not found'}), 404
        
        return jsonify(property_obj)
        
    except Exception as e:
        return jsonify({'error': f'Error getting property: {str(e)}'}), 500

# --- Original Routes ---
@app.route('/')
def home():
    """Serve the main HTML file"""
    try:
        with open('index.html', 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        return f"Error loading page: {str(e)}", 500

@app.route('/<path:filename>')
def serve_static(filename):
    """Serve static files"""
    return app.send_static_file(filename)

if __name__ == '__main__':
    # Initialize Excel file
    init_excel()
    
    # Start Flask app
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)