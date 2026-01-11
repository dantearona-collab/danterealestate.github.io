-- Schema generado automaticamente
-- Fecha: 2026-01-12T00:57:45.143023
-- Proyecto: Dante Propiedades

CREATE TABLE barrios_data (
            nombre TEXT PRIMARY KEY,
            data TEXT,
            fecha_actualizacion TEXT,
            generado_por_ia INTEGER DEFAULT 0
        )

CREATE TABLE barrios_reference (
            nombre TEXT PRIMARY KEY,
            data TEXT,
            fecha_actualizacion TEXT
        )