# pip install -r requirements.txt

import sys
import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from openpyxl import Workbook, load_workbook
from datetime import datetime

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": ["null", "http://dantepropiedades.com.ar", "http://dantepropiedades.com", "https://danterealestate-github-io.onrender.com"]}})

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
        if not data:
            return jsonify({'success': False, 'message': 'No data received'}), 400
        
        nombre = data.get('nombre', '').strip()
        firma = data.get('firma', '').strip()
        telefono = data.get('telefono', '').strip()
        propiedad = data.get('propiedad', 'DESTACADA0')
        
        if not nombre or not telefono:
            return jsonify({'success': False, 'message': 'Name and phone are required'}), 400
        
        try:
            wb = load_workbook(EXCEL_FILE)
            ws = wb.active
            next_row = ws.max_row + 1
            ws[f'A{next_row}'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            ws[f'B{next_row}'] = nombre
            ws[f'C{next_row}'] = firma if firma else '-'
            ws[f'D{next_row}'] = telefono
            ws[f'E{next_row}'] = propiedad
            wb.save(EXCEL_FILE)
            safe_print(f"SUCCESS: Contact saved: {nombre} - {telefono}")
            return jsonify({'success': True, 'message': 'Data saved correctly in Excel'})
            
        except Exception as e:
            safe_print(f"ERROR saving to Excel: {str(e)}")
            return jsonify({'success': False, 'message': 'Error saving data'}), 500
            
    except Exception as e:
        safe_print(f"ERROR in server: {str(e)}")
        return jsonify({'success': False, 'message': 'Server error occurred'}), 500

# --- End of Excel Contact Logic ---

@app.route("/api/properties/search", methods=["GET"])
def search_properties():
    safe_print("--- Nueva Búsqueda ---")
    try:
        with open('propiedades.json', 'r', encoding='utf-8') as f:
            properties = json.load(f)
    except FileNotFoundError:
        return jsonify({"error": "El archivo propiedades.json no fue encontrado."}), 404
    except json.JSONDecodeError:
        return jsonify({"error": "El archivo propiedades.json no tiene un formato JSON válido."}), 500

    ope = request.args.get("ope")
    tipo = request.args.get("tipo")
    loc = request.args.get("loc")
    cod = request.args.get("cod")

    safe_print(f"Parámetros recibidos: ope={ope}, tipo={tipo}, loc={loc}, cod={cod}")

    operation_map = {
        "V": "venta",
        "A": "alquiler",
        "T": "alquiler temporal"
    }
    
    if ope in operation_map:
        ope = operation_map[ope]

    filtered_properties = []
    for prop in properties:
        # Match operation
        if ope and (prop.get('operacion') is None or prop.get('operacion').lower() != ope.lower()):
            continue
        
        # Match property type
        if tipo and (prop.get('tipo') is None or prop.get('tipo').lower() != tipo.lower()):
            continue

        # Match neighborhood (loc)
        if loc and (prop.get('barrio') is None or prop.get('barrio').lower() != loc.lower()):
            continue

        # Match code
        if cod and (prop.get('id_temporal') is None or str(prop.get('id_temporal')) != cod):
            continue

        filtered_properties.append(prop)
    
    safe_print(f"Propiedades encontradas: {len(filtered_properties)}")
    return jsonify(filtered_properties)

@app.route("/")
def index():
    return "Welcome to the Property Search API. Use /api/properties/search to query."

if __name__ == '__main__':
    init_excel()  # Initialize Excel file
    safe_print("INFO: Iniciando servidor Flask...")
    safe_print("INFO: Excel inicializado")
    safe_print("INFO: Servidor corriendo en: http://127.0.0.1:5000")
    app.run(host='0.0.0.0', port=5000)
