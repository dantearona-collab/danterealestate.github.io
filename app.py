from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=[
    "https://www.dantepropiedades.com.ar",
    "https://danterealestate.github.io"
])

@app.route("/api/properties/search")
def search_properties():
    ope = request.args.get("ope")
    tipo = request.args.get("tipo")
    barrio = request.args.get("barrio")
    cod = request.args.get("cod")

    # Simulación de propiedades
    
    
    
    propiedades = [
    {
        "tipo": "departamento",
        "barrio": "palermo",
        "precio": 120000,
        "codigo": "DP001",
        "operacion": "venta"
    },
    {
        "tipo": "casa",
        "barrio": "belgrano",
        "precio": 250000,
        "codigo": "CS002",
        "operacion": "alquiler"
    }
]

    # Filtro básico
    filtradas = [p for p in propiedades if
        (not ope or p.get("operacion") == ope) and
        (not tipo or p.get("tipo") == tipo) and
        (not barrio or barrio.lower() in p.get("barrio", "").lower()) and
        (not cod or str(p.get("codigo")) == cod)
    ]

    return jsonify(filtradas)