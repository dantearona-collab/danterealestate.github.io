#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de prueba del sistema completo
Dante Propiedades - Verificación de funcionamiento
"""

import requests
import time
import json
from datetime import datetime

def test_servidor():
    """Prueba que el servidor esté funcionando"""
    try:
        response = requests.get('http://localhost:5000/health')
        if response.status_code == 200:
            print("✅ Servidor funcionando correctamente")
            return True
        else:
            print(f"❌ Error en servidor: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ No se puede conectar al servidor. ¿Está corriendo?")
        return False

def test_formulario():
    """Prueba enviando datos de formulario"""
    print("\n🧪 Enviando datos de prueba...")
    
    datos_prueba = {
        'nombre': 'Test Automatizado',
        'email': 'test@ejemplo.com',
        'telefono': '11-1234-5678',
        'interes': 'Apartamento 2 ambientes',
        'presupuesto': '$100,000 - $150,000',
        'mensaje': 'Mensaje de prueba del sistema automatizado',
        'pagina_origen': 'http://localhost:5000/formulario'
    }
    
    try:
        response = requests.post(
            'http://localhost:5000/api/guardar-contacto',
            json=datos_prueba,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print("✅ Datos guardados exitosamente")
                print(f"   Nombre: {result['datos_guardados']['nombre']}")
                print(f"   Email: {result['datos_guardados']['email']}")
                print(f"   Fecha: {result['datos_guardados']['fecha']}")
                return True
            else:
                print(f"❌ Error al guardar: {result.get('message')}")
                return False
        else:
            print(f"❌ Error HTTP: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error en prueba: {str(e)}")
        return False

def test_estadisticas():
    """Prueba el endpoint de estadísticas"""
    try:
        response = requests.get('http://localhost:5000/api/estadisticas')
        if response.status_code == 200:
            stats = response.json()
            print(f"\n📊 Estadísticas del sistema:")
            print(f"   Total contactos: {stats['total_contactos']}")
            print(f"   Contactos hoy: {stats['contactos_hoy']}")
            print(f"   Archivo: {stats['archivo_excel']}")
            
            if stats.get('tipos_interes'):
                print("   Tipos de interés más populares:")
                for tipo, cantidad in stats['tipos_interes'].items():
                    if tipo:  # Evitar valores vacíos
                        print(f"     - {tipo}: {cantidad}")
            
            if stats.get('ultimo_contacto'):
                print(f"   Último contacto: {stats['ultimo_contacto']}")
            
            return True
        else:
            print(f"❌ Error al obtener estadísticas: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error en estadísticas: {str(e)}")
        return False

def test_paginas():
    """Prueba que las páginas web estén disponibles"""
    paginas = [
        ('/', 'Página principal'),
        ('/formulario', 'Formulario'),
        ('/formulario.html', 'Formulario (.html)'),
        ('/notas-legales', 'Notas legales'),
        ('/notas-legales.html', 'Notas legales (.html)')
    ]
    
    print("\n🌐 Verificando páginas web...")
    
    for url, descripcion in paginas:
        try:
            response = requests.get(f'http://localhost:5000{url}')
            if response.status_code == 200:
                print(f"   ✅ {descripcion}: {url}")
            else:
                print(f"   ❌ {descripcion}: {url} (HTTP {response.status_code})")
        except Exception as e:
            print(f"   ❌ {descripcion}: {url} - Error: {str(e)}")

def main():
    """Ejecuta todas las pruebas"""
    print("🏢 Dante Propiedades - Prueba del Sistema Completo")
    print("=" * 60)
    print(f"🕐 Hora de prueba: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Prueba servidor
    if not test_servidor():
        print("\n❌ El servidor no está disponible. Inicia el servidor primero con:")
        print("   python servidor_excel.py")
        return
    
    # Prueba páginas web
    test_paginas()
    
    # Prueba formulario
    if test_formulario():
        test_estadisticas()
    
    print("\n" + "=" * 60)
    print("🎯 Instrucciones para uso manual:")
    print("1. Abre tu navegador en: http://localhost:5000/formulario")
    print("2. Llena el formulario con datos reales")
    print("3. Revisa el archivo: contactos_dante_propiedades.xlsx")
    print("4. Descarga el Excel desde: http://localhost:5000/contactos_dante_propiedades.xlsx")
    print("\n✅ ¡Sistema de automatización Excel funcionando!")

if __name__ == '__main__':
    main()