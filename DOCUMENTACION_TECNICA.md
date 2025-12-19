# 📘 Documentación Técnica del Proyecto Inmobiliario

Este documento detalla la arquitectura, estructura de archivos y flujo de datos de la aplicación web de Dante Propiedades.

## 🏗️ Arquitectura del Sistema

El sistema opera con una arquitectura Cliente-Servidor híbrida:

1.  **Frontend (Cliente)**:
    *   Desarrollado en **HTML5, CSS3 y JavaScript Vanilla** (sin frameworks pesados).
    *   Maneja la visualización de propiedades y el widget de chat.
    *   Archivo principal: `index.html`.

2.  **Backend (Servidor)**:
    *   Desarrollado en **Python con Flask**.
    *   **API de Chat (`main.py`)**: Gestiona la lógica conversacional, integración con Gemini AI y búsqueda de propiedades.
    *   **Base de Datos (Chat)**: Utiliza **SQLite** (`logic/database.py`) para búsquedas rápidas de propiedades y contexto del chat.
    *   **API Administrador (`app.py`)**: (Separado) Gestiona contactos y panel de administración, conectado a PostgreSQL.

---

## 📂 Estructura de Directorios y Archivos

A continuación se detalla la organización de los archivos clave del proyecto:

```text
/ (Raíz del Proyecto)
│
├── 📄 index.html           # [FRONTEND] Página principal. Contiene la UI web y el widget de chat.
│                           # Lógica clave: mostrarPropiedadesEnInterfaz(), toggleChatWidget()
│
├── 📄 index-ai.html        # [FRONTEND] Versión alternativa/experimental con enfoque en IA.
│
├── 📂 imgs/                # [RECURSOS] Imágenes de propiedades e interfaz.
│   └── 📂 360/             # [RECURSOS] Imágenes panorámicas para recorridos virtuales.
│
├── 🎨 css/                 # [ESTILOS] Hojas de estilo
│   └── ...
│
├── ☕ app.js               # [FRONTEND] Lógica de propiedades (Cards, Galerías, Filtros, Mapas).
│                           # Funciones clave: createPropertyCard(), loadProperties()
│
├── 🐍 main.py              # [BACKEND - CHAT] Punto de entrada para la API del Chat y Búsqueda.
│                           # Endpoints: /api/chat, /api/properties/search
│
├── � backend/             # [BACKEND ALTERNATIVO]
│   └── 🐍 main-ai.py       # Versión alternativa del backend de IA.
│
├── 🐍 app.py               # [BACKEND - ADMIN] Servidor para panel admin y gestión de contactos.
│
├── ⚙️ logic/               # [LÓGICA DE NEGOCIO] Módulos de Python para el backend
│   ├── 🐍 database.py      # Gestor de BD SQLite. Carga propiedades.json y maneja queries.
│   │                       # MODIFICADO: Incluye soporte para 'imagenes_360'
│   ├── 🐍 gemini_client.py # Cliente para comunicarse con Google Gemini (IA).
│   └── 🐍 filters.py       # Lógica para interpretar filtros desde texto natural.
│
├── 🗄️ propiedades.json     # [DATOS] Fuente de verdad de las propiedades.
│                           # Se carga en la BD SQLite al iniciar la aplicación.
│
├── 📄 Procfile             # Configuración de despliegue (Render/Heroku).
└── 📄 requirements.txt     # Dependencias de Python.
```

---

## ⚙️ Componentes y Flujos Clave

### 1. Sistema de Chat con IA (`main.py` + `logic/`)

El flujo de una consulta en el chat es el siguiente:

1.  **Usuario**: Envía mensaje desde el widget en `index.html`.
2.  **Frontend**: Envía POST a `/api/chat` en `main.py`.
3.  **Backend (`main.py`)**:
    *   Detecta filtros en el mensaje con `filters.py`.
    *   Consulta `logic/database.py` para buscar propiedades que coincidan (SQL).
    *   Construye un prompt con los resultados y el historial.
    *   Envía el prompt a **Gemini AI** (`gemini_client.py`).
4.  **Respuesta**:
    *   Recibe la respuesta de texto de la IA.
    *   Devuelve al frontend el texto + JSON de propiedades encontradas.
5.  **Frontend (`index.html`)**:
    *   Muestra el mensaje del bot.
    *   Ejecuta `mostrarPropiedadesEnInterfaz()` para renderizar las cartas visuales en la página principal.

### 2. Base de Datos SQLite (`logic/database.py`)

Este módulo actúa como una capa de caché inteligente sobre `propiedades.json`.
*   **Startup**: Al iniciar la app, lee `propiedades.json` y crea una base de datos SQLite en memoria (o archivo temporal).
*   **Estructura**: Tabla `properties` con columnas para cada atributo (precio, barrio, ambientes, **imagenes_360**, etc.).
*   **Búsqueda**: Permite consultas SQL complejas (rangos de precios, coincidencia de texto) que serían lentas de hacer sobre el JSON crudo.

### 3. Visualización de Recorrido 360

*   **Datos**: Se almacenan en el campo `imagenes_360` en `propiedades.json`.
*   **Backend**: `database.py` procesa este campo y lo expone en la API.
*   **Frontend**: `index.html` detecta si la propiedad tiene imágenes 360 y renderiza el botón "🔄 Ver recorrido 360".

---

## 🚀 Guía para Desarrolladores

Si necesitas modificar el sistema:

*   **Para cambiar estilos visuales**: Edita `index.html` (CSS inline o bloques style) o los archivos en `css/`.
*   **Para cambiar la lógica de tarjetas de propiedad**:
    *   Principal: `app.js` (`createPropertyCard`).
    *   Chat/Fallback: `index.html` (`renderFallbackCard`).
*   **Para ajustar la "personalidad" de la IA**: Modifica el prompt del sistema en `logic/gemini_client.py`.
*   **Para agregar nuevos campos a propiedades**:
    1.  Agrégalo en `propiedades.json`.
    2.  Actualiza la definición de tabla y el `INSERT` en `logic/database.py`.
    3.  Actualiza el frontend (`app.js` e `index.html`) para mostrarlo.
