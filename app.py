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

# ===== ENDPOINT DE RECHERCHE CORRIGÉ =====
@app.route('/api/search', methods=['POST'])
def proxy_search():
    if not BRIX_API_KEY:
        return jsonify({"error": "Clé API BrixHub non configurée."}), 500

    data = request.json
    fields = data.get('fields', {})
    
    # Vérifier qu'au moins un champ est rempli
    has_value = any(v for v in fields.values() if v and str(v).strip())
    if not has_value:
        return jsonify({"error": "Requête de recherche manquante."}), 400

    headers = {
        "X-API-Key": BRIX_API_KEY,
        "Content-Type": "application/json"
    }
    
    # Construire le payload avec TOUS les champs
    payload = {
        "flexible": True,
        "per_page": 20
    }
    
    # Mappage des champs du formulaire vers l'API BrixHub
    field_mapping = {
        'nom': 'nom_famille',
        'prenom': 'prenom',
        'nom_naissance': 'nom_naissance',
        'email': 'email',
        'telephone': 'telephone',
        'ville': 'ville',
        'code_postal': 'code_postal',
        'adresse': 'adresse',
        'date_naissance': 'date_naissance',
        'genre': 'genre',
        'nir': 'nir',
        'iban': 'iban',
        'siret': 'siret'
    }
    
    # Ajouter les champs non vides au payload
    for form_field, api_field in field_mapping.items():
        value = fields.get(form_field, '').strip()
        if value:
            payload[api_field] = value
    
    # Ajouter les champs avancés si présents
    advanced_fields = ['nom_affichage', 'nom_utilisateur', 'mobile', 'adresse_ip', 
                       'complement_adresse', 'pays', 'region', 'departement', 
                       'annee_naissance', 'ville_naissance', 'bic', 'siren',
                       'vin_plaque', 'immatriculation', 'marque', 'modele',
                       'societe', 'profession', 'fonction']
    
    for field in advanced_fields:
        value = fields.get(field, '').strip()
        if value:
            payload[field] = value
    
    try:
        response = requests.post(f"{BRIX_BASE_URL}/search", json=payload, headers=headers, timeout=15)
        response.raise_for_status()
        return jsonify(response.json())
    except requests.exceptions.RequestException as e:
        print(f"Erreur vers BrixHub : {e}")
        return jsonify({"error": f"Erreur API: {str(e)}"}), 500

@app.route('/health')
def health():
    return jsonify({"status": "ok"})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)