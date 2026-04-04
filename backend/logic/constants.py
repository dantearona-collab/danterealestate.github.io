# backend/logic/constants.py

# ========================================
# TASA DE CAMBIO (USD / ARS)
# ========================================
USD_RATE = 1400.0

# ========================================
# BARRIOS VÁLIDOS PARA SCRAPING Y FILTROS
# ========================================
BARRIOS_VALIDOS = [
    # CABA
    'belgrano', 'palermo', 'recoleta', 'microcentro', 'puerto madero',
    'caballito', 'almagro', 'boedo', 'chacarita', 'congreso','villa crespo',
    'villa urquiza', 'colegiales', 'nuñez', 'saavedra', 'flores',
    'balvanera', 'san telmo', 'barracas', 'la boca', 'retiro',
    # Zona Norte
    'nordelta', 'tigre', 'pilar', 'san isidro'
]

# ========================================
# DISPLAY NAMES PARA FRONTEND (cómo se muestran en el select)
# ========================================
BARRIOS_DISPLAY = {
    'belgrano': 'Belgrano - Capital Federal',
    'palermo': 'Palermo - Capital Federal',
    'recoleta': 'Recoleta - Capital Federal',
    'microcentro': 'Microcentro - Capital Federal',
    'puerto madero': 'Puerto Madero - Capital Federal',
    'caballito': 'Caballito - Capital Federal',
    'congreso': 'Congreso - Capital Federal',
    'almagro': 'Almagro - Capital Federal',
    'boedo': 'Boedo - Capital Federal',
    'chacarita': 'Chacarita - Capital Federal',
    'villa crespo': 'Villa Crespo - Capital Federal',
    'villa urquiza': 'Villa Urquiza - Capital Federal',
    'colegiales': 'Colegiales - Capital Federal',
    'nuñez': 'Nuñez - Capital Federal',
    'saavedra': 'Saavedra - Capital Federal',
    'flores': 'Flores - Capital Federal',
    'balvanera': 'Balvanera - Capital Federal',
    'san telmo': 'San Telmo - Capital Federal',
    'barracas': 'Barracas - Capital Federal',
    'la boca': 'La Boca - Capital Federal',
    'retiro': 'Retiro - Capital Federal',
    'nordelta': 'Nordelta - Tigre',
    'tigre': 'Tigre - Buenos Aires',
    'pilar': 'Pilar - Buenos Aires',
    'san isidro': 'San Isidro - Buenos Aires'
}

# ========================================
# CONSTANTES PARA FALLBACK (si la API falla)
# ========================================
BARRIOS_FALLBACK = [
    {"valor": b, "display": BARRIOS_DISPLAY.get(b, b)}
    for b in BARRIOS_VALIDOS
]

# ========================================
# UBICACIONES A EXCLUIR (NO SON BARRIOS VÁLIDOS)
# ========================================
UBICACIONES_EXCLUIDAS = [
    # Variantes de Belgrano que no son CABA
    'general belgrano', 'villa general belgrano', 'manuel belgrano',
    'pueblo general belgrano', 'country club manuel belgrano',
    # Localidades del conurbano
    'ing. maschwitz', 'ingeniero maschwitz', 'escobar',
    'city bell', 'la plata', 'capilla vieja', 'amboy',
    # Provincias
    'gualeguaychú', 'buenos aires interior', 'bs.as. g.b.a. norte',
    'córdoba', 'santa fe', 'mendoza', 'entre ríos', 'san rafael',
    # Otros
    'el molino', 'los manantiales', 'tierras del sauce', 'los molles'
]

# ========================================
# MAPEO DE BARRIOS PARA URLS (normalización)
# ========================================
BARRIOS_URL_MAP = {
    "lugano": "villa-lugano",
    "villa lugano": "villa-lugano",
    "villa luganos": "villa-lugano",
    "barracas": "barracas",
    "constitucion": "constitucion",
    "once": "balvanera",
    "microcentro": "san-nicolas",
    "abasto": "almagro",
    "congreso": "congreso",
    "congreso": "balvanera"
}

# ========================================
# TIPOS DE OPERACIÓN
# ========================================
OPERACIONES = ['venta', 'alquiler']

# ========================================
# TIPOS DE PROPIEDAD
# ========================================
TIPOS_PROPIEDAD = [
    'departamento', 'casa', 'ph', 'terreno', 'local', 'oficina', 
    'cochera', 'deposito'
]