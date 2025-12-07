# -*- coding: utf-8 -*-
"""
🚀 SISTEMA DE ALMACENAMIENTO EXCEL - BACKEND COMPLETO
================================================================

Este servidor Python recibe los datos del formulario y los almacena automáticamente
en Excel y CSV. Incluye modo offline, respaldos automáticos y manejo de errores.
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS, cross_origin
import pandas as pd
import json
import os
import sys
from datetime import datetime
import csv
import logging
import threading
import time
import glob
from pathlib import Path

# ==============================================
# DETECCIÓN AUTOMÁTICA DE ENTORNO
# ==============================================

def detectar_entorno():
    """Detecta automáticamente si estamos en producción (Render) o desarrollo (local)"""
    
    # Verificar variables de entorno de Render
    if 'RENDER' in os.environ or 'RENDER_EXTERNAL_HOSTNAME' in os.environ:
        return 'render'
    
    # Verificar si estamos en GitHub Codespaces
    if 'CODESPACES' in os.environ:
        return 'codespaces'
    
    # Verificar si hay archivos típicos de desarrollo
    desarrollo_indicadores = [
        '.git',  # Repositorio git
        'requirements.txt',  # Archivo de dependencias
        'app.py',  # Este archivo
        'formulario.html',  # Tu formulario
        'admin_excel.html'  # Tu admin
    ]
    
    for indicador in desarrollo_indicadores:
        if os.path.exists(indicador):
            return 'local'
    
    # Por defecto asumir producción
    return 'produccion'

# Configurar logging según entorno
entorno = detectar_entorno()
print(f"🌍 Entorno detectado: {entorno.upper()}")

# PRIMERO CREAR LA CARPETA DATA SI NO EXISTE
def crear_directorios_necesarios():
    """Crear directorios necesarios antes de configurar logging"""
    directorios = ['data', 'data/excel', 'data/backups', 'data/temp', 'data/uploads']
    
    for directorio in directorios:
        if not os.path.exists(directorio):
            try:
                os.makedirs(directorio, exist_ok=True)
                print(f"✅ Directorio creado: {directorio}")
            except Exception as e:
                print(f"⚠️  No se pudo crear {directorio}: {e}")

# Crear directorios
crear_directorios_necesarios()

# Configuración de logging
log_level = logging.DEBUG if entorno == 'local' else logging.INFO

# Crear handlers de logging
handlers = [logging.StreamHandler()]

# Solo agregar FileHandler si el directorio data existe
log_file_path = 'data/sistema-formularios.log'
if os.path.exists('data'):
    try:
        file_handler = logging.FileHandler(log_file_path, encoding='utf-8')
        handlers.append(file_handler)
        print(f"📝 Logging a archivo: {log_file_path}")
    except Exception as e:
        print(f"⚠️  No se pudo crear archivo de log: {e}")
else:
    print("⚠️  Directorio 'data' no existe, logging solo a consola")

logging.basicConfig(
    level=log_level,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s' if entorno == 'local' else '%(asctime)s - %(levelname)s - %(message)s',
    handlers=handlers
)

logger = logging.getLogger(__name__)

class ExcelStorageManager:
    """
    📊 Gestor completo de almacenamiento en Excel
    Maneja múltiples archivos, respaldos y exportación automática
    """
    
    def __init__(self, base_path='data'):
        self.base_path = Path(base_path)
        self.excel_path = self.base_path / 'excel' / 'consultas.xlsx'
        self.csv_path = self.base_path / 'excel' / 'consultas.csv'
        self.json_path = self.base_path / 'datos_formulario.json'  # Para admin
        self.backup_path = self.base_path / 'backups'
        self.temp_path = self.base_path / 'temp'
        self.uploads_path = self.base_path / 'uploads'
        
        # Asegurar que los directorios existan
        self._crear_estructura_directorios()
        
        # Configuración de columnas para formulario
        self.columnas_formulario = [
            'Fecha', 'Hora', 'Timestamp', 'Nombre', 'Email', 'Teléfono', 
            'Interés', 'Presupuesto', 'Mensaje', 'Página', 'IP', 'User_Agent',
            'Estado', 'Notas'
        ]
        
        # Configuración para admin Excel
        self.columnas_admin = [
            'id', 'nombre', 'email', 'telefono', 'interes', 
            'presupuesto', 'mensaje', 'estado', 'fecha_contacto'
        ]
        
        # Inicializar archivos
        self._inicializar_archivos()
        
        logger.info(f"✅ Sistema de almacenamiento inicializado en: {self.base_path}")
        logger.info(f"📁 Excel: {self.excel_path}")
        logger.info(f"📄 JSON admin: {self.json_path}")
    
    def _crear_estructura_directorios(self):
        """Crear estructura de directorios necesaria"""
        directorios = [
            self.base_path / 'excel',
            self.base_path / 'backups',
            self.temp_path,
            self.uploads_path
        ]
        
        for directorio in directorios:
            try:
                directorio.mkdir(parents=True, exist_ok=True)
                logger.debug(f"Directorio listo: {directorio}")
            except Exception as e:
                logger.error(f"Error creando directorio {directorio}: {e}")
    
    def _inicializar_archivos(self):
        """Inicializar archivos Excel, CSV y JSON"""
        # Crear JSON para admin si no existe
        if not self.json_path.exists():
            try:
                with open(self.json_path, 'w', encoding='utf-8') as f:
                    json.dump([], f, ensure_ascii=False, indent=2)
                logger.info("📝 Archivo JSON para admin creado")
            except Exception as e:
                logger.error(f"Error creando JSON: {e}")
        
        # Crear Excel formulario si no existe
        if not self.excel_path.exists():
            try:
                df_vacio = pd.DataFrame(columns=self.columnas_formulario)
                with pd.ExcelWriter(self.excel_path, engine='openpyxl') as writer:
                    df_vacio.to_excel(writer, sheet_name='Consultas', index=False)
                    df_vacio.to_excel(writer, sheet_name='Backup', index=False)
                logger.info("📊 Archivo Excel creado")
            except Exception as e:
                logger.error(f"Error creando Excel: {e}")
        
        # Crear CSV si no existe
        if not self.csv_path.exists():
            try:
                with open(self.csv_path, 'w', newline='', encoding='utf-8') as f:
                    writer = csv.writer(f)
                    writer.writerow(self.columnas_formulario)
                logger.info("📄 Archivo CSV creado")
            except Exception as e:
                logger.error(f"Error creando CSV: {e}")
    
    def añadir_consulta(self, datos_formulario):
        """
        📝 Añadir nueva consulta al sistema de almacenamiento
        Guarda en Excel, CSV y JSON para el admin
        """
        try:
            # Preparar datos completos
            timestamp = datetime.now()
            
            # Datos para Excel/CSV (formulario)
            consulta_completa = {
                'Fecha': timestamp.strftime('%d/%m/%Y'),
                'Hora': timestamp.strftime('%H:%M:%S'),
                'Timestamp': timestamp.isoformat(),
                'Nombre': datos_formulario.get('nombre', ''),
                'Email': datos_formulario.get('email', ''),
                'Teléfono': datos_formulario.get('telefono', ''),
                'Interés': datos_formulario.get('interes', ''),
                'Presupuesto': datos_formulario.get('presupuesto', ''),
                'Mensaje': datos_formulario.get('mensaje', ''),
                'Página': datos_formulario.get('pagina', 'Desconocida'),
                'IP': request.remote_addr if request else 'N/A',
                'User_Agent': request.headers.get('User-Agent', 'N/A') if request else 'N/A',
                'Estado': 'Nueva',
                'Notas': ''
            }
            
            # Guardar en Excel (sheet principal)
            self._guardar_en_excel(consulta_completa)
            
            # Guardar en CSV
            self._guardar_en_csv(consulta_completa)
            
            # Guardar también en JSON para el admin
            self._guardar_en_json_admin({
                'id': self._obtener_proximo_id(),
                'nombre': datos_formulario.get('nombre', ''),
                'email': datos_formulario.get('email', ''),
                'telefono': datos_formulario.get('telefono', ''),
                'interes': datos_formulario.get('interes', 'Consulta general'),
                'presupuesto': datos_formulario.get('presupuesto', 'No especificado'),
                'mensaje': datos_formulario.get('mensaje', ''),
                'estado': 'nuevo',
                'fecha_contacto': timestamp.strftime('%Y-%m-%d')
            })
            
            # Crear backup automático
            self._crear_backup_automatico()
            
            logger.info(f"✅ Consulta guardada: {consulta_completa['Nombre']} - {consulta_completa['Email']}")
            
            return {
                'success': True,
                'message': 'Consulta guardada correctamente en todos los sistemas',
                'timestamp': consulta_completa['Timestamp'],
                'files': {
                    'excel': str(self.excel_path),
                    'csv': str(self.csv_path),
                    'json': str(self.json_path)
                }
            }
            
        except Exception as e:
            logger.error(f"❌ Error guardando consulta: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'message': 'Error al guardar consulta'
            }
    
    def _guardar_en_excel(self, consulta):
        """💾 Guardar en archivo Excel con formato"""
        try:
            # Leer Excel existente
            df = pd.read_excel(self.excel_path, sheet_name='Consultas')
            
            # Añadir nueva fila
            df_nuevo = pd.DataFrame([consulta])
            df_completo = pd.concat([df, df_nuevo], ignore_index=True)
            
            # Guardar con formato
            with pd.ExcelWriter(self.excel_path, engine='openpyxl') as writer:
                # Sheet principal con formato
                df_completo.to_excel(writer, sheet_name='Consultas', index=False)
                
                # Sheet de backup
                df_completo.to_excel(writer, sheet_name='Backup', index=False)
                
                # Sheet de estadísticas
                stats = self._generar_estadisticas()
                stats.to_excel(writer, sheet_name='Estadísticas', index=False)
                
                # Formatear columnas
                workbook = writer.book
                worksheet = writer.sheets['Consultas']
                
                # Formatear columnas de texto
                for column in worksheet.columns:
                    max_length = 0
                    column_letter = column[0].column_letter
                    for cell in column:
                        try:
                            if len(str(cell.value)) > max_length:
                                max_length = len(str(cell.value))
                        except:
                            pass
                    adjusted_width = min(max_length + 2, 50)
                    worksheet.column_dimensions[column_letter].width = adjusted_width
            
            logger.debug("✅ Guardado en Excel completado")
            
        except Exception as e:
            logger.error(f"❌ Error guardando en Excel: {str(e)}")
            raise
    
    def _guardar_en_csv(self, consulta):
        """📄 Guardar en archivo CSV"""
        try:
            with open(self.csv_path, 'a', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=self.columnas_formulario)
                writer.writerow(consulta)
            
            logger.debug("✅ Guardado en CSV completado")
            
        except Exception as e:
            logger.error(f"❌ Error guardando en CSV: {str(e)}")
            raise
    
    def _guardar_en_json_admin(self, registro):
        """💾 Guardar registro en JSON para el admin panel"""
        try:
            # Cargar datos existentes
            if self.json_path.exists():
                with open(self.json_path, 'r', encoding='utf-8') as f:
                    datos = json.load(f)
            else:
                datos = []
            
            # Añadir nuevo registro
            datos.append(registro)
            
            # Guardar
            with open(self.json_path, 'w', encoding='utf-8') as f:
                json.dump(datos, f, ensure_ascii=False, indent=2)
            
            logger.debug(f"✅ Registro {registro['id']} guardado en JSON admin")
            
        except Exception as e:
            logger.error(f"❌ Error guardando en JSON admin: {str(e)}")
            raise
    
    def _obtener_proximo_id(self):
        """Obtener próximo ID disponible para JSON admin"""
        try:
            if self.json_path.exists():
                with open(self.json_path, 'r', encoding='utf-8') as f:
                    datos = json.load(f)
                if datos:
                    return max(item['id'] for item in datos) + 1
            return 1
        except:
            return 1
    
    def obtener_datos_admin(self):
        """📋 Obtener todos los datos para el panel admin (desde JSON)"""
        try:
            if self.json_path.exists():
                with open(self.json_path, 'r', encoding='utf-8') as f:
                    datos = json.load(f)
                
                # Calcular estadísticas
                total = len(datos)
                nuevos = sum(1 for r in datos if r.get('estado') == 'nuevo')
                contactados = sum(1 for r in datos if r.get('estado') == 'contactado')
                cotizados = sum(1 for r in datos if r.get('estado') == 'cotizado')
                cerrados = sum(1 for r in datos if r.get('estado') == 'cerrado')
                
                # Contar por interés
                intereses = {}
                for r in datos:
                    interes = r.get('interes', 'No especificado')
                    intereses[interes] = intereses.get(interes, 0) + 1
                
                return {
                    'success': True,
                    'total': total,
                    'data': datos,
                    'estadisticas': {
                        'total': total,
                        'nuevos': nuevos,
                        'contactados': contactados,
                        'cotizados': cotizados,
                        'cerrados': cerrados,
                        'intereses': intereses
                    }
                }
            return {'success': True, 'total': 0, 'data': [], 'estadisticas': {}}
            
        except Exception as e:
            logger.error(f"❌ Error obteniendo datos admin: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def actualizar_registro_admin(self, id_registro, datos_actualizados):
        """✏️ Actualizar registro en admin panel"""
        try:
            if not self.json_path.exists():
                return {'success': False, 'message': 'No hay datos'}
            
            with open(self.json_path, 'r', encoding='utf-8') as f:
                datos = json.load(f)
            
            # Buscar y actualizar
            for i, registro in enumerate(datos):
                if registro['id'] == id_registro:
                    # Actualizar campos
                    for campo, valor in datos_actualizados.items():
                        if campo in registro:
                            registro[campo] = valor
                    
                    # Guardar cambios
                    with open(self.json_path, 'w', encoding='utf-8') as f:
                        json.dump(datos, f, ensure_ascii=False, indent=2)
                    
                    logger.info(f"✅ Registro {id_registro} actualizado")
                    return {'success': True, 'data': registro}
            
            return {'success': False, 'message': 'Registro no encontrido'}
            
        except Exception as e:
            logger.error(f"❌ Error actualizando registro: {str(e)}")
            return {'success': False, 'message': str(e)}
    
    def eliminar_registro_admin(self, id_registro):
        """🗑️ Eliminar registro del admin panel"""
        try:
            if not self.json_path.exists():
                return {'success': False, 'message': 'No hay datos'}
            
            with open(self.json_path, 'r', encoding='utf-8') as f:
                datos = json.load(f)
            
            # Filtrar excluyendo el ID
            nuevos_datos = [r for r in datos if r['id'] != id_registro]
            
            if len(nuevos_datos) < len(datos):
                with open(self.json_path, 'w', encoding='utf-8') as f:
                    json.dump(nuevos_datos, f, ensure_ascii=False, indent=2)
                
                logger.info(f"✅ Registro {id_registro} eliminado")
                return {'success': True, 'message': f'Registro {id_registro} eliminado'}
            else:
                return {'success': False, 'message': 'Registro no encontrado'}
            
        except Exception as e:
            logger.error(f"❌ Error eliminando registro: {str(e)}")
            return {'success': False, 'message': str(e)}
    
    def importar_excel_admin(self, file):
        """📤 Importar datos desde Excel al admin panel"""
        try:
            if file.filename.endswith('.csv'):
                df = pd.read_csv(file)
            else:
                df = pd.read_excel(file)
            
            # Cargar datos existentes
            resultado = self.obtener_datos_admin()
            datos_existentes = resultado['data'] if resultado['success'] else []
            nuevo_id = max([r['id'] for r in datos_existentes], default=0) + 1
            
            nuevos_registros = []
            
            for _, row in df.iterrows():
                registro = {
                    'id': nuevo_id,
                    'nombre': str(row.get('nombre', row.get('Nombre', ''))).strip(),
                    'email': str(row.get('email', row.get('Email', ''))).strip(),
                    'telefono': str(row.get('telefono', row.get('Teléfono', ''))).strip(),
                    'interes': str(row.get('interes', row.get('Interés', 'Consulta general'))).strip(),
                    'presupuesto': str(row.get('presupuesto', row.get('Presupuesto', 'No especificado'))).strip(),
                    'mensaje': str(row.get('mensaje', row.get('Mensaje', ''))).strip(),
                    'estado': str(row.get('estado', row.get('Estado', 'nuevo'))).strip(),
                    'fecha_contacto': str(row.get('fecha_contacto', row.get('Fecha', datetime.now().strftime('%Y-%m-%d')))).strip()
                }
                
                nuevos_registros.append(registro)
                nuevo_id += 1
            
            # Combinar con existentes
            todos_registros = datos_existentes + nuevos_registros
            
            # Guardar
            with open(self.json_path, 'w', encoding='utf-8') as f:
                json.dump(todos_registros, f, ensure_ascii=False, indent=2)
            
            logger.info(f"✅ Importados {len(nuevos_registros)} registros desde Excel")
            
            return {
                'success': True,
                'message': f'Importados {len(nuevos_registros)} registros',
                'importados': len(nuevos_registros)
            }
            
        except Exception as e:
            logger.error(f"❌ Error importando Excel: {str(e)}")
            return {'success': False, 'message': str(e)}
    
    def generar_excel_admin(self):
        """📊 Generar Excel específico para admin panel"""
        try:
            resultado = self.obtener_datos_admin()
            
            if not resultado['success'] or not resultado['data']:
                return None
            
            datos = resultado['data']
            df = pd.DataFrame(datos)
            
            # Crear archivo temporal
            temp_path = self.temp_path / f'admin_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
            temp_path.parent.mkdir(exist_ok=True)
            
            with pd.ExcelWriter(temp_path, engine='openpyxl') as writer:
                df.to_excel(writer, sheet_name='Leads', index=False)
                
                # Añadir estadísticas
                stats = self._generar_estadisticas_admin(datos)
                stats.to_excel(writer, sheet_name='Estadísticas', index=False)
            
            logger.info(f"✅ Excel admin generado: {temp_path}")
            return temp_path
            
        except Exception as e:
            logger.error(f"❌ Error generando Excel admin: {str(e)}")
            return None
    
    def _generar_estadisticas_admin(self, datos):
        """📈 Generar estadísticas para admin panel"""
        try:
            df = pd.DataFrame(datos)
            
            stats = {
                'Total Leads': len(df),
                'Leads Nuevos': len(df[df['estado'] == 'nuevo']) if 'estado' in df.columns else 0,
                'Leads Contactados': len(df[df['estado'] == 'contactado']) if 'estado' in df.columns else 0,
                'Leads Cotizados': len(df[df['estado'] == 'cotizado']) if 'estado' in df.columns else 0,
                'Leads Cerrados': len(df[df['estado'] == 'cerrado']) if 'estado' in df.columns else 0,
                'Interés Principal': df['interes'].value_counts().head(1).to_dict() if 'interes' in df.columns and not df.empty else {},
                'Fecha Más Antigua': df['fecha_contacto'].min() if 'fecha_contacto' in df.columns and not df.empty else 'N/A',
                'Fecha Más Reciente': df['fecha_contacto'].max() if 'fecha_contacto' in df.columns and not df.empty else 'N/A'
            }
            
            return pd.DataFrame(list(stats.items()), columns=['Métrica', 'Valor'])
            
        except Exception as e:
            logger.error(f"❌ Error generando estadísticas admin: {str(e)}")
            return pd.DataFrame({'Métrica': ['Error'], 'Valor': [str(e)]})
    
    def _crear_backup_automatico(self):
        """🗂️ Crear backup automático cada 50 consultas"""
        try:
            # Contar consultas actuales
            df = pd.read_excel(self.excel_path, sheet_name='Consultas')
            total_consultas = len(df)
            
            if total_consultas > 0 and total_consultas % 50 == 0:
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                backup_file = self.backup_path / f'backup_consultas_{timestamp}.xlsx'
                
                # Copiar archivo completo
                import shutil
                shutil.copy2(self.excel_path, backup_file)
                
                logger.info(f"🗂️ Backup creado: {backup_file}")
                
        except Exception as e:
            logger.error(f"❌ Error creando backup: {str(e)}")
    
    def _generar_estadisticas(self):
        """📊 Generar estadísticas de las consultas"""
        try:
            df = pd.read_excel(self.excel_path, sheet_name='Consultas')
            
            stats = {
                'Total Consultas': len(df),
                'Consultas Hoy': len(df[df['Fecha'] == datetime.now().strftime('%d/%m/%Y')]),
                'Interés Más Común': df['Interés'].value_counts().head(1).to_dict() if not df.empty else {},
                'Presupuesto Más Común': df['Presupuesto'].value_counts().head(1).to_dict() if not df.empty else {},
                'Última Consulta': df['Fecha'].max() if not df.empty else 'N/A',
                'Consultas Esta Semana': len(df[df['Fecha'] >= (datetime.now() - pd.Timedelta(days=7)).strftime('%d/%m/%Y')]) if not df.empty else 0
            }
            
            return pd.DataFrame(list(stats.items()), columns=['Métrica', 'Valor'])
            
        except Exception as e:
            logger.error(f"❌ Error generando estadísticas: {str(e)}")
            return pd.DataFrame({'Métrica': ['Error'], 'Valor': [str(e)]})
    
    def obtener_consultas(self, limite=100):
        """📋 Obtener últimas consultas"""
        try:
            df = pd.read_excel(self.excel_path, sheet_name='Consultas')
            return df.tail(limite).to_dict('records')
        except Exception as e:
            logger.error(f"❌ Error obteniendo consultas: {str(e)}")
            return []
    
    def exportar_resumen(self):
        """📊 Exportar resumen de estadísticas"""
        try:
            df = pd.read_excel(self.excel_path, sheet_name='Consultas')
            if df.empty:
                return "No hay datos para exportar"
            
            resumen = f"""
📊 RESUMEN DE CONSULTAS - {datetime.now().strftime('%d/%m/%Y %H:%M')}

📈 ESTADÍSTICAS GENERALES:
• Total de consultas: {len(df)}
• Consultas hoy: {len(df[df['Fecha'] == datetime.now().strftime('%d/%m/%Y')])}
• Última consulta: {df['Fecha'].max()}

🎯 INTERESES MÁS CONSULTADOS:
{df['Interés'].value_counts().head(5).to_string() if not df.empty else 'No hay datos'}

💰 PRESUPUESTOS MÁS CONSULTADOS:
{df['Presupuesto'].value_counts().head(5).to_string() if not df.empty else 'No hay datos'}

📁 ARCHIVOS:
• Excel: {self.excel_path}
• CSV: {self.csv_path}
• JSON Admin: {self.json_path}
• Backups: {self.backup_path}
            """
            
            return resumen
            
        except Exception as e:
            return f"Error generando resumen: {str(e)}"

# ==============================================
# CONFIGURACIÓN CORS COMPLETA
# ==============================================

# Crear aplicación Flask con CORS completo
app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": ["*"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "Accept"],
        "supports_credentials": True
    }
})

# Configuración CORS más permisiva para todas las respuestas
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept,Origin,X-Requested-With')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    response.headers.add('Access-Control-Max-Age', '86400')  # 24 horas
    return response

# Manejar preflight OPTIONS requests
@app.route('/api/<path:path>', methods=['OPTIONS'])
@app.route('/api/admin/<path:path>', methods=['OPTIONS'])
def handle_options(path):
    return jsonify({'success': True}), 200

# ==============================================

# Inicializar gestor de almacenamiento
storage_manager = ExcelStorageManager()

# ==============================================
# ENDPOINTS DE DIAGNÓSTICO Y SALUD
# ==============================================

@app.route('/')
def home():
    """🏠 Página principal del sistema"""
    return jsonify({
        'service': 'Dante Propiedades - Sistema de Formularios',
        'version': '2.0.0',
        'environment': entorno,
        'status': 'active',
        'timestamp': datetime.now().isoformat(),
        'endpoints': {
            'formulario': '/api/guardar-contacto (POST)',
            'admin_obtener': '/api/admin/obtener-datos (GET)',
            'admin_actualizar': '/api/admin/actualizar-datos/<id> (PUT)',
            'admin_eliminar': '/api/admin/eliminar-datos/<id> (DELETE)',
            'admin_importar': '/api/admin/importar-excel (POST)',
            'admin_exportar': '/api/admin/exportar-excel (GET)',
            'health': '/health, /api/status (GET)'
        },
        'files': {
            'excel': str(storage_manager.excel_path),
            'csv': str(storage_manager.csv_path),
            'json_admin': str(storage_manager.json_path)
        }
    })

@app.route('/debug', methods=['GET'])
@app.route('/api/status', methods=['GET'])
@app.route('/health', methods=['GET'])
def health_check():
    """Endpoint para verificar que el servidor está funcionando"""
    return jsonify({
        'status': 'online',
        'service': 'Dante Propiedades - Sistema Completo',
        'environment': entorno,
        'timestamp': datetime.now().isoformat(),
        'version': '2.0',
        'server_info': {
            'python_version': sys.version,
            'flask_version': '2.3.3',
            'host': request.host if request else 'N/A',
            'client_ip': request.remote_addr if request else 'N/A'
        },
        'storage': {
            'excel_exists': os.path.exists(storage_manager.excel_path),
            'json_exists': os.path.exists(storage_manager.json_path),
            'total_records': len(storage_manager.obtener_datos_admin()['data']) if storage_manager.obtener_datos_admin()['success'] else 0
        }
    }), 200

# ==============================================
# ENDPOINTS PARA FORMULARIO HTML
# ==============================================

@app.route('/api/guardar-contacto', methods=['POST', 'OPTIONS'])
@cross_origin()
def guardar_contacto():
    """💾 Guardar nueva consulta de contacto"""
    if request.method == 'OPTIONS':
        return jsonify({'success': True}), 200
        
    try:
        # Verificar que se envió JSON
        if not request.is_json:
            return jsonify({
                'success': False,
                'error': 'Se requiere contenido JSON'
            }), 400
        
        datos = request.get_json()
        
        # Validaciones básicas
        campos_requeridos = ['nombre', 'email', 'mensaje']
        for campo in campos_requeridos:
            if not datos.get(campo, '').strip():
                return jsonify({
                    'success': False,
                    'error': f'Campo requerido faltante: {campo}'
                }), 400
        
        # Validar email
        email = datos.get('email', '')
        if '@' not in email:
            return jsonify({
                'success': False,
                'error': 'Email inválido'
            }), 400
        
        # Añadir información de contexto
        datos['pagina'] = request.headers.get('Referer', 'Formulario Web Dante')
        
        # Guardar en almacenamiento
        resultado = storage_manager.añadir_consulta(datos)
        
        if resultado['success']:
            return jsonify(resultado), 200
        else:
            return jsonify(resultado), 500
            
    except Exception as e:
        logger.error(f"❌ Error en guardar-contacto: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Error interno del servidor'
        }), 500

# ==============================================
# ENDPOINTS PARA PANEL ADMIN EXCEL (CON CORS)
# ==============================================

@app.route('/api/admin/obtener-datos', methods=['GET', 'OPTIONS'])
@cross_origin()
def obtener_datos_admin():
    """📋 Obtener todos los datos para el panel admin"""
    if request.method == 'OPTIONS':
        return jsonify({'success': True}), 200
        
    try:
        resultado = storage_manager.obtener_datos_admin()
        
        if resultado['success']:
            return jsonify(resultado), 200
        else:
            return jsonify(resultado), 500
            
    except Exception as e:
        logger.error(f"❌ Error en obtener-datos-admin: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Error interno del servidor'
        }), 500

@app.route('/api/admin/actualizar-datos/<int:id>', methods=['PUT', 'OPTIONS'])
@cross_origin()
def actualizar_datos_admin(id):
    """✏️ Actualizar registro desde panel admin"""
    if request.method == 'OPTIONS':
        return jsonify({'success': True}), 200
        
    try:
        datos_actualizados = request.get_json()
        
        if not datos_actualizados:
            return jsonify({
                'success': False,
                'message': 'No se recibieron datos para actualizar'
            }), 400
        
        resultado = storage_manager.actualizar_registro_admin(id, datos_actualizados)
        
        if resultado['success']:
            return jsonify(resultado), 200
        else:
            return jsonify(resultado), 404
            
    except Exception as e:
        logger.error(f"❌ Error en actualizar-datos-admin: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Error interno del servidor'
        }), 500

@app.route('/api/admin/eliminar-datos/<int:id>', methods=['DELETE', 'OPTIONS'])
@cross_origin()
def eliminar_datos_admin(id):
    """🗑️ Eliminar registro desde panel admin"""
    if request.method == 'OPTIONS':
        return jsonify({'success': True}), 200
        
    try:
        resultado = storage_manager.eliminar_registro_admin(id)
        
        if resultado['success']:
            return jsonify(resultado), 200
        else:
            return jsonify(resultado), 404
            
    except Exception as e:
        logger.error(f"❌ Error en eliminar-datos-admin: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Error interno del servidor'
        }), 500

@app.route('/api/admin/importar-excel', methods=['POST', 'OPTIONS'])
@cross_origin()
def importar_excel_admin():
    """📤 Importar datos desde Excel al panel admin"""
    if request.method == 'OPTIONS':
        return jsonify({'success': True}), 200
        
    try:
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'message': 'No se subió ningún archivo'
            }), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({
                'success': False,
                'message': 'No se seleccionó ningún archivo'
            }), 400
        
        resultado = storage_manager.importar_excel_admin(file)
        
        if resultado['success']:
            return jsonify(resultado), 200
        else:
            return jsonify(resultado), 400
            
    except Exception as e:
        logger.error(f"❌ Error en importar-excel-admin: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Error interno del servidor'
        }), 500

@app.route('/api/admin/exportar-excel', methods=['GET', 'OPTIONS'])
@cross_origin()
def exportar_excel_admin():
    """📊 Exportar Excel desde panel admin"""
    if request.method == 'OPTIONS':
        return jsonify({'success': True}), 200
        
    try:
        excel_path = storage_manager.generar_excel_admin()
        
        if excel_path and excel_path.exists():
            return send_file(
                excel_path,
                as_attachment=True,
                download_name=f'admin_leads_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx',
                mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
        else:
            return jsonify({
                'success': False,
                'message': 'No hay datos para exportar'
            }), 404
            
    except Exception as e:
        logger.error(f"❌ Error en exportar-excel-admin: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Error interno del servidor'
        }), 500

# ==============================================
# ENDPOINTS DE COMPATIBILIDAD (existentes)
# ==============================================

@app.route('/api/obtener-consultas', methods=['GET'])
@cross_origin()
def obtener_consultas():
    """📋 Obtener últimas consultas"""
    try:
        limite = request.args.get('limite', 100, type=int)
        consultas = storage_manager.obtener_consultas(limite)
        
        return jsonify({
            'success': True,
            'consultas': consultas,
            'total': len(consultas)
        })
        
    except Exception as e:
        logger.error(f"❌ Error en obtener-consultas: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/resumen', methods=['GET'])
@cross_origin()
def obtener_resumen():
    """📊 Obtener resumen estadístico"""
    try:
        resumen = storage_manager.exportar_resumen()
        return jsonify({
            'success': True,
            'resumen': resumen,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"❌ Error en resumen: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/exportar-excel', methods=['GET', 'OPTIONS'])
@cross_origin()
def exportar_excel():
    """📊 Exportar archivo Excel del formulario"""
    if request.method == 'OPTIONS':
        return jsonify({'success': True}), 200
        
    try:
        if not storage_manager.excel_path.exists():
            return jsonify({
                'success': False,
                'error': 'No hay datos para exportar'
            }), 404
        
        return send_file(
            storage_manager.excel_path,
            as_attachment=True,
            download_name=f'consultas_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
        )
        
    except Exception as e:
        logger.error(f"❌ Error exportando Excel: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ==============================================
# CONFIGURACIÓN DEL SERVIDOR
# ==============================================

if __name__ == '__main__':
    # Mostrar información del sistema
    print("=" * 70)
    print("🚀 SISTEMA DE FORMULARIOS DANTE PROPIEDADES")
    print("=" * 70)
    print(f"🌍 Entorno: {entorno.upper()}")
    print(f"🐍 Python: {sys.version.split()[0]}")
    print(f"📁 Directorio de trabajo: {os.getcwd()}")
    print(f"💾 Datos almacenados en: {storage_manager.base_path}")
    print("=" * 70)
    print("🌐 URLS DISPONIBLES:")
    
    if entorno == 'local':
        print(f"   📋 Formulario: http://localhost:5000/")
        print(f"   📊 Admin Panel: http://localhost:5000/admin (si existe)")
        print(f"   🔧 API: http://localhost:5000/api/...")
        print(f"   🩺 Health: http://localhost:5000/health")
        port = 5000
    elif entorno == 'render':
        print(f"   🌐 Servidor en la nube (Render)")
        print(f"   📋 Formulario: https://danterealestate-github-io.onrender.com/")
        print(f"   🔧 API: https://danterealestate-github-io.onrender.com/api/...")
        port = int(os.environ.get('PORT', 10000))
    else:
        print(f"   🔧 Servidor en entorno: {entorno}")
        port = int(os.environ.get('PORT', 5000))
    
    print("=" * 70)
    print("📊 ENDPOINTS PRINCIPALES:")
    print("   • POST /api/guardar-contacto     - Recibir datos del formulario")
    print("   • GET  /api/admin/obtener-datos  - Obtener datos para admin")
    print("   • PUT  /api/admin/actualizar-datos/:id - Actualizar registro")
    print("   • DELETE /api/admin/eliminar-datos/:id - Eliminar registro")
    print("=" * 70)
    
    # Configurar puerto automáticamente
    debug_mode = entorno == 'local'
    
    print(f"🔧 Iniciando servidor en puerto {port}...")
    print(f"🐛 Modo debug: {'ACTIVADO' if debug_mode else 'DESACTIVADO'}")
    print("=" * 70)
    
    try:
        app.run(
            host='0.0.0.0', 
            port=port, 
            debug=debug_mode,
            threaded=True
        )
    except Exception as e:
        print(f"❌ Error iniciando servidor: {e}")
        print(f"💡 Intenta con un puerto diferente: python app.py --port=5001")
        if port == 5000:
            print("🔄 Intentando con puerto 5001...")
            app.run(host='0.0.0.0', port=5001, debug=debug_mode, threaded=True)