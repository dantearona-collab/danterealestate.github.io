#!/usr/bin/env python3
"""
Configuracion centralizada del proyecto Dante Propiedades.
"""
import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.resolve()
DATA_DIR = PROJECT_ROOT / "data"
DB_PATH = DATA_DIR / "production.db"

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

SERVER_HOST = os.environ.get("SERVER_HOST", "0.0.0.0")
SERVER_PORT = int(os.environ.get("SERVER_PORT", "8001"))


def get_db_connection():
    import sqlite3
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_database():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    c.execute("""
        CREATE TABLE IF NOT EXISTS barrios_data (
            nombre TEXT PRIMARY KEY,
            data TEXT NOT NULL,
            fecha_actualizacion TEXT,
            generado_por_ia INTEGER DEFAULT 0
        )
    """)
    
    c.execute("""
        CREATE TABLE IF NOT EXISTS barrios_reference (
            nombre TEXT PRIMARY KEY,
            data TEXT NOT NULL
        )
    """)
    
    conn.commit()
    conn.close()
    print(f"Base de datos inicializada: {DB_PATH}")


if __name__ == "__main__":
    print("Configuracion del proyecto:")
    print(f"  PROJECT_ROOT: {PROJECT_ROOT}")
    print(f"  DATA_DIR: {DATA_DIR}")
    print(f"  DB_PATH: {DB_PATH}")
    print()
    init_database()
