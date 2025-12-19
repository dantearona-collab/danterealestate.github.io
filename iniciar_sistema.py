#!/usr/bin/env python3
"""
Script de inicio para Dante Propiedades - Sistema de Contactos
Ejecuta automáticamente el servidor y abre el navegador
"""

import subprocess
import sys
import time
import webbrowser
import os
from pathlib import Path

def print_banner():
    """Muestra el banner de inicio"""
    print("=" * 60)
    print("🏢 DANTE PROPIEDADES - SISTEMA DE CONTACTOS")
    print("=" * 60)
    print("📊 Sistema que guarda automáticamente los datos del formulario")
    print("📱 Envía consultas a WhatsApp y registra todo en Excel")
    print("=" * 60)

def verificar_dependencias():
    """Verifica que las dependencias estén instaladas"""
    print("🔍 Verificando dependencias...")
    
    try:
        import flask
        import pandas
        import openpyxl
        print("✅ Todas las dependencias están instaladas")
        return True
    except ImportError as e:
        print(f"❌ Dependencia faltante: {e}")
        print("💡 Ejecuta: uv add flask pandas openpyxl flask-cors")
        return False

def iniciar_servidor():
    """Inicia el servidor Flask"""
    print("🚀 Iniciando servidor Flask...")
    print("📍 Servidor disponible en: http://localhost:5000")
    print("📋 API Endpoints:")
    print("   POST /api/guardar-contacto - Guardar contacto")
    print("   GET  /api/estadisticas     - Ver estadísticas")
    print("   GET  /health              - Estado del servidor")
    print("=" * 60)
    
    try:
        # Ejecutar servidor
        subprocess.run([sys.executable, "servidor_excel.py"])
    except KeyboardInterrupt:
        print("\n🛑 Servidor detenido por el usuario")
    except Exception as e:
        print(f"❌ Error al iniciar servidor: {e}")

def main():
    """Función principal"""
    print_banner()
    
    if not verificar_dependencias():
        input("\nPresiona Enter para salir...")
        return
    
    print("\n🌐 ¿Deseas abrir el navegador automáticamente? (s/n): ", end="")
    respuesta = input().lower().strip()
    
    if respuesta in ['s', 'si', 'sí', 'y', 'yes']:
        print("🌐 Abriendo navegador...")
        time.sleep(2)
        webbrowser.open("http://localhost:5000")
    
    print("\n💡 Presiona Ctrl+C para detener el servidor")
    print("=" * 60)
    
    # Verificar que existe el archivo del servidor
    if not Path("servidor_excel.py").exists():
        print("❌ Error: No se encuentra 'servidor_excel.py'")
        input("Presiona Enter para salir...")
        return
    
    iniciar_servidor()

if __name__ == "__main__":
    main()