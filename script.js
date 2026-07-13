const API_URL = '/api/search';
let currentResults = [];

// ===== RECHERCHE =====
async function performSearch() {
    const resultsContainer = document.getElementById('results');
    
    const fields = {
        nom: document.getElementById('nom').value.trim(),
        prenom: document.getElementById('prenom').value.trim(),
        ville: document.getElementById('ville').value.trim(),
        code_postal: document.getElementById('code_postal').value.trim(),
        adresse: document.getElementById('adresse').value.trim(),
        email: document.getElementById('email').value.trim(),
        telephone: document.getElementById('telephone').value.trim(),
        date_naissance: document.getElementById('date_naissance').value.trim(),
        nom_naissance: document.getElementById('nom_naissance').value.trim(),
        genre: document.getElementById('genre').value.trim(),
        nir: document.getElementById('nir').value.trim(),
        iban: document.getElementById('iban').value.trim(),
        siret: document.getElementById('siret').value.trim()
    };

    const hasValue = Object.values(fields).some(v => v !== '');
    if (!hasValue) {
        resultsContainer.innerHTML = '<p class="error">Veuillez remplir au moins un champ.</p>';
        return;
    }

    resultsContainer.innerHTML = '<div class="loading">RECHERCHE EN COURS</div>';

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fields })
        });

        const data = await response.json();

        if (!response.ok || data.error) {
            resultsContainer.innerHTML = `<p class="error">${data.error || 'Erreur inconnue'}</p>`;
            return;
        }

        currentResults = data.data?.results || data.results || [];
        displayResults(currentResults);

    } catch (error) {
        console.error('Erreur réseau :', error);
        resultsContainer.innerHTML = '<p class="error">Erreur de connexion au serveur.</p>';
    }
}

// ===== AFFICHAGE =====
function displayResults(results) {
    const resultsContainer = document.getElementById('results');

    if (!results || results.length === 0) {
        resultsContainer.innerHTML = '<p class="no-results">AUCUN RÉSULTAT</p>';
        return;
    }

    let html = `
        <div class="results-header">
            <span class="results-count">${results.length} RÉSULTATS</span>
            <div class="results-actions">
                <button onclick="copyAllResults()">COPIER TOUT</button>
            </div>
        </div>
    `;

    results.forEach((person, index) => {
        const name = `${person.prenom || ''} ${person.nom_famille || ''}`.trim() || 'PROFIL INCONNU';
        const confidence = person._confidence || '?';
        const sources = person._sources || [];

        const ignore = ['_confidence', '_sources', '_source_db', '_es_ids', '_score'];
        const allFields = Object.keys(person).filter(k => !ignore.includes(k) && person[k] && person[k] !== 'undefined' && person[k] !== null && person[k] !== '');

        html += `
            <div class="result-item">
                <div class="result-header">
                    <h3>${name}</h3>
                    <div class="actions">
                        <button onclick="copySingleResult(${index})">📋 COPIER</button>
                        <span class="confidence-badge">CONFIANCE ${confidence}%</span>
                    </div>
                </div>
                
                <div class="result-grid">
                    ${allFields.map(k => `
                        <div class="field">
                            <span class="label">${k.toUpperCase().replace(/_/g, ' ')}</span>
                            <span class="value">${person[k]}</span>
                        </div>
                    `).join('')}
                </div>
                
                ${sources.length ? `<div class="sources-line">SOURCES: ${sources.join(' | ')}</div>` : ''}
            </div>
        `;
    });

    resultsContainer.innerHTML = html;
}

// ===== COPIER UN SEUL RÉSULTAT =====
function copySingleResult(index) {
    const person = currentResults[index];
    if (!person) {
        showToast('Erreur : résultat introuvable.');
        return;
    }

    const ignore = ['_confidence', '_sources', '_source_db', '_es_ids', '_score'];
    const allFields = Object.keys(person).filter(k => !ignore.includes(k) && person[k] && person[k] !== 'undefined' && person[k] !== null && person[k] !== '');

    let text = '═'.repeat(50) + '\n';
    text += '  MARAUDER - PROFIL\n';
    text += '═'.repeat(50) + '\n\n';
    
    allFields.forEach(k => {
        const label = k.toUpperCase().replace(/_/g, ' ');
        text += `${label} : ${person[k]}\n`;
    });

    if (person._sources && person._sources.length) {
        text += `\nSOURCES : ${person._sources.join(', ')}\n`;
    }
    text += `\nCONFIANCE : ${person._confidence || '?'}%\n`;
    text += '\n═'.repeat(50);

    navigator.clipboard.writeText(text).then(() => {
        showToast('Profil copié !');
    }).catch(() => {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('Profil copié !');
    });
}

// ===== COPIER TOUS LES RÉSULTATS =====
function copyAllResults() {
    if (!currentResults || currentResults.length === 0) {
        showToast('Aucun résultat à copier.');
        return;
    }

    let text = '═'.repeat(50) + '\n';
    text += '  MARAUDER - RÉSULTATS\n';
    text += '═'.repeat(50) + '\n\n';

    currentResults.forEach((person, i) => {
        const name = `${person.prenom || ''} ${person.nom_famille || ''}`.trim() || 'PROFIL INCONNU';
        text += `┌─ PROFIL ${i+1} : ${name}\n`;

        const ignore = ['_confidence', '_sources', '_source_db', '_es_ids', '_score'];
        const allFields = Object.keys(person).filter(k => !ignore.includes(k) && person[k] && person[k] !== 'undefined' && person[k] !== null && person[k] !== '');

        allFields.forEach(k => {
            const label = k.toUpperCase().replace(/_/g, ' ');
            text += `├─ ${label} : ${person[k]}\n`;
        });

        if (person._sources && person._sources.length) {
            text += `└─ SOURCES : ${person._sources.join(', ')}\n`;
        }
        text += `   CONFIANCE : ${person._confidence || '?'}%\n\n`;
    });

    text += '═'.repeat(50) + '\n';
    text += `${currentResults.length} RÉSULTATS\n`;

    navigator.clipboard.writeText(text).then(() => {
        showToast(`${currentResults.length} résultats copiés !`);
    }).catch(() => {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast(`${currentResults.length} résultats copiés !`);
    });
}

// ===== EFFACER =====
function clearAll() {
    const fields = ['nom', 'prenom', 'ville', 'code_postal', 'adresse', 'email', 'telephone', 'date_naissance', 'nom_naissance', 'genre', 'nir', 'iban', 'siret'];
    fields.forEach(id => {
        document.getElementById(id).value = '';
    });
    document.getElementById('results').innerHTML = '';
    currentResults = [];
    showToast('Champs effacés');
}

// ===== TOAST =====
function showToast(message) {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => toast.classList.remove('show'), 2500);
}

// ===== ÉVÉNEMENTS =====
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('searchButton').addEventListener('click', performSearch);
    document.getElementById('clearButton').addEventListener('click', clearAll);

    document.querySelectorAll('.form-group input').forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performSearch();
        });
    });
});