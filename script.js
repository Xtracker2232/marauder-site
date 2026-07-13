const API_URL = '/api/search';

async function performSearch(query) {
    const searchInput = document.getElementById('searchInput');
    const resultsContainer = document.getElementById('results');
    const queryText = query || searchInput.value.trim();

    if (!queryText) {
        resultsContainer.innerHTML = '<p class="error">Veuillez entrer un terme de recherche.</p>';
        return;
    }

    resultsContainer.innerHTML = '<div class="loading">🔍 Recherche en cours...</div>';

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: queryText })
        });

        const data = await response.json();

        if (!response.ok || data.error) {
            resultsContainer.innerHTML = `<p class="error">Erreur : ${data.error || 'Erreur inconnue'}</p>`;
            return;
        }

        displayResults(data);

    } catch (error) {
        console.error('Erreur réseau :', error);
        resultsContainer.innerHTML = '<p class="error">Erreur de connexion au serveur.</p>';
    }
}

function displayResults(data) {
    const resultsContainer = document.getElementById('results');
    
    // Adapter selon la réponse de BrixHub
    const results = data.data?.results || data.results || [];

    if (results.length === 0) {
        resultsContainer.innerHTML = '<p class="no-results">Aucun résultat trouvé.</p>';
        return;
    }

    let html = '';
    results.forEach(person => {
        const name = `${person.prenom || ''} ${person.nom_famille || ''}`.trim() || 'Profil inconnu';
        const confidence = person._confidence || '?';
        
        html += `
            <div class="result-item">
                <h3>${name}</h3>
                ${person.email ? `<p>📧 ${person.email}</p>` : ''}
                ${person.telephone ? `<p>📱 ${person.telephone}</p>` : ''}
                ${person.ville ? `<p>📍 ${person.ville}</p>` : ''}
                ${person.adresse ? `<p>🏠 ${person.adresse}</p>` : ''}
                ${person.code_postal ? `<p>📮 ${person.code_postal}</p>` : ''}
                <p class="confidence">🎯 Confiance : ${confidence}%</p>
                ${person._sources ? `<p style="font-size:12px;color:#666;">Sources : ${person._sources.join(', ')}</p>` : ''}
            </div>
        `;
    });
    
    resultsContainer.innerHTML = html;
}

// Gestionnaires d'événements
document.addEventListener('DOMContentLoaded', () => {
    const searchButton = document.getElementById('searchButton');
    const searchInput = document.getElementById('searchInput');

    searchButton.addEventListener('click', () => performSearch());
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
});