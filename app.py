import os
import requests
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

# RÉCUPÉRER LA CLÉ API
BRIX_API_KEY = os.environ.get('BRIX_API_KEY')
BRIX_BASE_URL = "https://api.brixhub.is/api/v1"

# Servir la page HTML principale
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

# Servir les fichiers statiques (CSS, JS)
@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('.', path)

# Endpoint de recherche
@app.route('/api/search', methods=['POST'])
def proxy_search():
    if not BRIX_API_KEY:
        return jsonify({"error": "Clé API BrixHub non configurée."}), 500

    data = request.json
    query = data.get('query', '').strip()
    
    if not query:
        return jsonify({"error": "Requête de recherche manquante."}), 400

    headers = {
        "X-API-Key": BRIX_API_KEY,
        "Content-Type": "application/json"
    }
    
    # Construire le payload pour BrixHub
    payload = {
        "flexible": True,
        "per_page": 10
    }
    
    # Détection automatique du type de recherche
    if '@' in query:
        payload["email"] = query
    elif query.startswith('06') or query.startswith('07') or query.startswith('+33'):
        payload["telephone"] = query
    else:
        # Recherche par nom/prénom/ville
        payload["nom_famille"] = query
        payload["ville"] = query
    
    try:
        response = requests.post(f"{BRIX_BASE_URL}/search", json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        return jsonify(response.json())
    except requests.exceptions.RequestException as e:
        print(f"Erreur vers BrixHub : {e}")
        return jsonify({"error": "Erreur lors de la recherche externe."}), 500

# Point de santé pour Railway
@app.route('/health')
def health():
    return jsonify({"status": "ok"})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)