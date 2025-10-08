# pip install -r requirements.txt
# pip install -r requirements.txt

import sys
import os
from flask import Flask, request, jsonify, render_template
from database import init_db
from flask_cors import CORS
from openpyxl import Workbook, load_workbook
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Inicializar base de datos
init_db()

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

@app.route('/')
def home():
    return render_template('index.html')

@app.route("/api/dinamica")
def dinamica_properties():
    basedir = os.path.abspath(os.path.dirname(__file__))
    image_folder = os.path.join(basedir, 'DINAMICA')
    try:
        image_files = [f for f in os.listdir(image_folder) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif'))]
        properties = []
        for i, image_file in enumerate(image_files):
            properties.append({
                "property_id": f"dinamica_{i}",
                "title": "Propiedad Dinámica",
                "description": f"Imagen {i+1} de la carpeta DINAMICA",
                "images": [{"url": f"/DINAMICA/{image_file}", "description": "Imagen dinámica"}]
            })
        return jsonify(properties)
    except FileNotFoundError:
        return jsonify({"error": f"La carpeta '{image_folder}' no fue encontrada."})

if __name__ == '__main__':
    init_excel()  # Inicializar archivo Excel
    safe_print("INFO: Iniciando servidor Flask...")
    safe_print("INFO: Excel inicializado")
    safe_print("INFO: Servidor corriendo en: http://127.0.0.1:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
    # O si quieres eliminar la advertencia:
    # app.run(debug=True, host='0.0.0.0', port=5000, use_reloader=False)