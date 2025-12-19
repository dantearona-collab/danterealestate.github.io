import pandas as pd
import json
import re
from datetime import datetime
import os

def excel_a_json(archivo_excel='propiedades.xlsx', archivo_json='propiedades.json'):
    """
    Convierte un archivo Excel de propiedades a formato JSON
    """
    
    print("🔄 Iniciando conversión de Excel a JSON...")
    print("=" * 50)
    
    # Verificar si el archivo Excel existe
    if not os.path.exists(archivo_excel):
        print(f"❌ Error: No se encuentra el archivo {archivo_excel}")
        print("💡 Asegúrate de que el archivo esté en la misma carpeta")
        return None
    
    try:
        # Leer el archivo Excel
        df = pd.read_excel(archivo_excel)
        print(f"✅ Excel leído correctamente: {len(df)} propiedades encontradas")
        print(f"📋 Columnas detectadas: {list(df.columns)}")
        
    except Exception as e:
        print(f"❌ Error leyendo el archivo Excel: {e}")
        return None
    
    # Limpiar nombres de columnas
    df.columns = [limpiar_nombre_columna(col) for col in df.columns]
    print("🔧 Nombres de columnas limpiados")
    
    propiedades = []
    
    # Procesar cada fila
    for index, row in df.iterrows():
        try:
            propiedad = procesar_fila(row)
            if propiedad:
                propiedades.append(propiedad)
                print(f"✅ Fila {index+1} procesada: {propiedad.get('id_temporal', 'Sin ID')}")
                
        except Exception as e:
            print(f"⚠️ Error procesando fila {index+1}: {e}")
            continue
    
    # Guardar el JSON
    try:
        with open(archivo_json, 'w', encoding='utf-8') as f:
            json.dump(propiedades, f, ensure_ascii=False, indent=2)
        
        print(f"\n✅ JSON guardado exitosamente: {archivo_json}")
        print(f"📊 Total de propiedades procesadas: {len(propiedades)}")
        
        # Mostrar estadísticas
        mostrar_estadisticas(propiedades)
        
        # Mostrar ejemplo de propiedad convertida
        if propiedades:
            print(f"\n📋 EJEMPLO DE PROPIEDAD CONVERTIDA:")
            ejemplo = propiedades[0]
            for key, value in list(ejemplo.items())[:8]:  # Mostrar primeros 8 campos
                print(f"   {key}: {str(value)[:50]}{'...' if len(str(value)) > 50 else ''}")
        
    except Exception as e:
        print(f"❌ Error guardando JSON: {e}")
        return None
    
    return propiedades

def limpiar_nombre_columna(nombre):
    """Limpia y estandariza nombres de columnas"""
    if pd.isna(nombre):
        return "columna_desconocida"
    
    nombre_limpio = str(nombre).lower().strip()
    nombre_limpio = re.sub(r'[^\w\s]', '_', nombre_limpio)
    nombre_limpio = re.sub(r'\s+', '_', nombre_limpio)
    return nombre_limpio

def procesar_fila(fila):
    """Procesa una fila individual del DataFrame"""
    
    propiedad = {}
    
    # Mapeo de campos básicos
    campos_basicos = {
        'id_temporal': ['id_temporal', 'id'],
        'titulo': ['titulo', 'titulo_propiedad', 'nombre'],
        'barrio': ['barrio', 'zona', 'ubicacion'],
        'precio': ['precio', 'precio_usd', 'valor'],
        'ambientes': ['ambientes', 'habitaciones', 'dormitorios'],
        'metros_cuadrados': ['metros_cuadrados', 'metros', 'superficie', 'm2'],
        'operacion': ['operacion', 'tipo_operacion'],
        'tipo': ['tipo', 'tipo_propiedad'],
        'descripcion': ['descripcion', 'descripción', 'caracteristicas'],
        'direccion': ['direccion', 'dirección', 'calle'],
        'antiguedad': ['antiguedad', 'antigüedad', 'años'],
        'estado': ['estado', 'condicion'],
        'orientacion': ['orientacion', 'orientación'],
        'piso': ['piso', 'nivel', 'planta'],
        'expensas': ['expensas', 'gastos_comunes'],
        'amenities': ['amenities', 'comodidades', 'servicios'],
        'cochera': ['cochera', 'garage', 'estacionamiento'],
        'balcon': ['balcon', 'balcón'],
        'pileta': ['pileta', 'piscina'],
        'acepta_mascotas': ['acepta_mascotas', 'mascotas', 'pet_friendly'],
        'aire_acondicionado': ['aire_acondicionado', 'aire', 'aa'],
        'info_multimedia': ['info_multimedia', 'multimedia', 'fotos_info'],
        'documentos': ['documentos', 'archivos', 'docs', 'documentacion']  # NUEVO CAMPO
    }
    
    # Procesar campos básicos
    for campo_json, posibles_campos_excel in campos_basicos.items():
        valor = obtener_valor(fila, posibles_campos_excel)
        if valor not in [None, '', 'nan']:
            propiedad[campo_json] = limpiar_valor(valor, campo_json)
    
    # Procesar fotos (campo especial)
    fotos = procesar_campo_fotos(fila)
    if fotos:
        propiedad['fotos'] = fotos
    
    # Procesar documentos (campo especial) - NUEVO
    documentos = procesar_campo_documentos(fila)
    if documentos:
        propiedad['documentos'] = documentos
    
    # Campos con valores por defecto
    propiedad['moneda_precio'] = 'USD'
    propiedad['moneda_expensas'] = 'ARS'
    
    # Metadata
    propiedad['fecha_procesamiento'] = datetime.now().isoformat()
    
    # Limpiar propiedades vacías
    propiedad = {k: v for k, v in propiedad.items() if v not in [None, '', 'nan']}
    
    return propiedad

def obtener_valor(fila, posibles_claves):
    """Obtiene el valor de la primera clave que exista en la fila"""
    for clave in posibles_claves:
        if clave in fila and pd.notna(fila[clave]) and fila[clave] != '':
            return fila[clave]
    return None

def limpiar_valor(valor, nombre_campo):
    """Limpia y convierte valores según el tipo de campo"""
    
    if pd.isna(valor) or valor == '':
        return None
    
    # Campos numéricos
    campos_numericos = ['precio', 'ambientes', 'metros_cuadrados', 'antiguedad', 'expensas']
    if any(campo in nombre_campo for campo in campos_numericos):
        return convertir_a_numero(valor)
    
    # Campos booleanos (Sí/No)
    campos_booleanos = ['cochera', 'balcon', 'pileta', 'acepta_mascotas', 'aire_acondicionado']
    if any(campo in nombre_campo for campo in campos_booleanos):
        return estandarizar_si_no(valor)
    
    # Campos de texto
    return str(valor).strip()

def convertir_a_numero(valor):
    """Convierte un valor a número"""
    if valor is None or valor == '':
        return 0
    
    if isinstance(valor, (int, float)):
        return valor
    
    if isinstance(valor, str):
        # Remover símbolos no numéricos
        valor_limpio = re.sub(r'[^\d.,]', '', valor.strip())
        
        if valor_limpio:
            try:
                # Manejar diferentes formatos de decimales
                if '.' in valor_limpio and ',' in valor_limpio:
                    # Formato 1.000,00
                    valor_limpio = valor_limpio.replace('.', '').replace(',', '.')
                elif ',' in valor_limpio:
                    # Formato 1000,00
                    valor_limpio = valor_limpio.replace(',', '.')
                
                return float(valor_limpio) if '.' in valor_limpio else int(valor_limpio)
            except ValueError:
                pass
    
    return 0

def estandarizar_si_no(valor):
    """Estandariza valores booleanos a Sí/No"""
    if not valor or valor == '':
        return "No"
    
    valor_str = str(valor).lower().strip()
    
    si_variantes = ['si', 'sí', 'yes', 'true', 'verdadero', '1', 'con', 'x']
    no_variantes = ['no', 'not', 'false', 'falso', '0', 'sin', '']
    
    if any(variante in valor_str for variante in si_variantes):
        return "Sí"
    elif any(variante in valor_str for variante in no_variantes):
        return "No"
    else:
        return "No"  # Por defecto

def procesar_campo_fotos(fila):
    """Procesa el campo de fotos, puede venir en diferentes formatos"""
    
    # Buscar en diferentes columnas posibles
    posibles_campos_fotos = ['fotos', 'imagenes', 'fotos_url', 'multimedia']
    
    for campo in posibles_campos_fotos:
        if campo in fila and pd.notna(fila[campo]) and fila[campo] != '':
            valor = fila[campo]
            
            # Si ya es una lista (raro en Excel, pero por si acaso)
            if isinstance(valor, list):
                return [str(foto).strip() for foto in valor if str(foto).strip() != '']
            
            # Si es string separado por comas
            elif isinstance(valor, str):
                fotos = [foto.strip() for foto in valor.split(',')]
                return [foto for foto in fotos if foto != '']
    
    return []

def procesar_campo_documentos(fila):
    """Procesa el campo de documentos, puede venir en diferentes formatos - NUEVA FUNCIÓN"""
    
    # Buscar en diferentes columnas posibles para documentos
    posibles_campos_documentos = ['documentos', 'archivos', 'docs', 'documentacion']
    
    for campo in posibles_campos_documentos:
        if campo in fila and pd.notna(fila[campo]) and fila[campo] != '':
            valor = fila[campo]
            
            # Si ya es una lista
            if isinstance(valor, list):
                return [str(doc).strip() for doc in valor if str(doc).strip() != '']
            
            # Si es string separado por comas
            elif isinstance(valor, str):
                documentos = [doc.strip() for doc in valor.split(',')]
                return [doc for doc in documentos if doc != '']
    
    return []

def mostrar_estadisticas(propiedades):
    """Muestra estadísticas de las propiedades procesadas"""
    
    if not propiedades:
        return
    
    print(f"\n📈 ESTADÍSTICAS DE LA CONVERSIÓN:")
    print(f"• Total propiedades: {len(propiedades)}")
    
    # Contar por operación
    operaciones = {}
    for prop in propiedades:
        op = prop.get('operacion', 'desconocido')
        operaciones[op] = operaciones.get(op, 0) + 1
    print(f"• Operaciones: {operaciones}")
    
    # Contar por tipo
    tipos = {}
    for prop in propiedades:
        tipo = prop.get('tipo', 'desconocido')
        tipos[tipo] = tipos.get(tipo, 0) + 1
    print(f"• Tipos: {tipos}")
    
    # Contar fotos totales
    total_fotos = sum(len(prop.get('fotos', [])) for prop in propiedades)
    print(f"• Total de fotos: {total_fotos}")
    
    # Contar documentos totales - NUEVO
    total_documentos = sum(len(prop.get('documentos', [])) for prop in propiedades)
    print(f"• Total de documentos: {total_documentos}")
    
    # Mostrar propiedades con documentos
    props_con_documentos = [prop for prop in propiedades if prop.get('documentos')]
    if props_con_documentos:
        print(f"• Propiedades con documentos: {len(props_con_documentos)}")
        for prop in props_con_documentos[:3]:  # Mostrar primeras 3
            print(f"  - {prop.get('id_temporal', 'Sin ID')}: {len(prop.get('documentos', []))} documentos")
    
    # Rango de precios
    precios = [prop.get('precio', 0) for prop in propiedades if prop.get('precio', 0) > 0]
    if precios:
        print(f"• Rango de precios: ${min(precios):,} - ${max(precios):,} USD")

def verificar_archivo_excel(archivo_excel):
    """Verifica la estructura del archivo Excel antes de procesar"""
    try:
        df = pd.read_excel(archivo_excel)
        print(f"\n🔍 ANALIZANDO ESTRUCTURA DEL EXCEL:")
        print(f"• Filas: {len(df)}")
        print(f"• Columnas: {len(df.columns)}")
        print(f"• Columnas encontradas: {list(df.columns)}")
        
        # Verificar campos críticos
        campos_criticos = ['titulo', 'precio', 'operacion', 'tipo']
        for campo in campos_criticos:
            columnas_relacionadas = [col for col in df.columns if campo in str(col).lower()]
            if columnas_relacionadas:
                print(f"✅ '{campo}': {columnas_relacionadas}")
            else:
                print(f"⚠️  '{campo}': No se encontraron columnas relacionadas")
        
        # Verificar campo de documentos - NUEVO
        campos_documentos = ['documentos', 'archivos', 'docs', 'documentacion']
        columnas_documentos = []
        for campo in campos_documentos:
            columnas_relacionadas = [col for col in df.columns if campo in str(col).lower()]
            columnas_documentos.extend(columnas_relacionadas)
        
        if columnas_documentos:
            print(f"✅ 'documentos': {columnas_documentos}")
        else:
            print(f"ℹ️  'documentos': No se encontraron columnas específicas para documentos")
        
        return True
        
    except Exception as e:
        print(f"❌ Error analizando Excel: {e}")
        return False

# EJECUCIÓN PRINCIPAL
if __name__ == "__main__":
    print("🏠 CONVERSOR EXCEL A JSON - DANTE PROPIEDADES")
    print("=" * 50)
    
    archivo_excel = 'propiedades.xlsx'
    archivo_json = 'propiedades.json'
    
    # Verificar archivo Excel
    if not os.path.exists(archivo_excel):
        print(f"❌ No se encuentra el archivo: {archivo_excel}")
        print("💡 Asegúrate de que el archivo esté en la misma carpeta")
        exit(1)
    
    # Analizar estructura del Excel
    verificar_archivo_excel(archivo_excel)
    
    # Realizar conversión
    print(f"\n🔄 INICIANDO CONVERSIÓN...")
    try:
        propiedades = excel_a_json(archivo_excel, archivo_json)
        
        if propiedades:
            print(f"\n🎉 ¡CONVERSIÓN COMPLETADA EXITOSAMENTE!")
            print(f"📁 Archivo JSON creado: {archivo_json}")
            print(f"📊 Total de propiedades: {len(propiedades)}")
            
            # Mostrar estadísticas de documentos - NUEVO
            total_docs = sum(len(prop.get('documentos', [])) for prop in propiedades)
            props_con_docs = len([prop for prop in propiedades if prop.get('documentos')])
            print(f"📄 Documentos procesados: {total_docs} en {props_con_docs} propiedades")
            
            # Mostrar ubicación del archivo
            ruta_absoluta = os.path.abspath(archivo_json)
            print(f"📂 Ubicación: {ruta_absoluta}")
            
            # Mostrar ejemplo con documentos si existen
            prop_con_docs = next((prop for prop in propiedades if prop.get('documentos')), None)
            if prop_con_docs:
                print(f"\n📋 EJEMPLO CON DOCUMENTOS:")
                print(f"   ID: {prop_con_docs.get('id_temporal', 'Sin ID')}")
                print(f"   Título: {prop_con_docs.get('titulo', '')}")
                print(f"   Documentos: {prop_con_docs.get('documentos', [])}")
            
        else:
            print(f"\n❌ No se pudieron procesar las propiedades")
            
    except Exception as e:
        print(f"❌ Error en la conversión: {e}")

# FUNCIÓN ADICIONAL: Para usar en otros scripts
def convertir_propiedades():
    """Función simple para usar en otros scripts"""
    return excel_a_json('propiedades.xlsx', 'propiedades.json')