const API_URL = '/api/search';
let currentResults = [];

// ===== RECHERCHE =====
async function performSearch(query) {
    const searchInput = document.getElementById('searchInput');
    const resultsContainer = document.getElementById('results');
    const queryText = query || searchInput.value.trim();

    if (!queryText) {
        resultsContainer.innerHTML = '<p class="error">[ERREUR] Veuillez entrer un terme de recherche.</p>';
        return;
    }

    resultsContainer.innerHTML = '<div class="loading">[RECHERCHE EN COURS]</div>';

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: queryText })
        });

        const data = await response.json();

        if (!response.ok || data.error) {
            resultsContainer.innerHTML = `<p class="error">[ERREUR] ${data.error || 'Erreur inconnue'}</p>`;
            return;
        }

        currentResults = data.data?.results || data.results || [];
        displayResults(currentResults, queryText);

    } catch (error) {
        console.error('Erreur réseau :', error);
        resultsContainer.innerHTML = '<p class="error">[ERREUR] Connexion au serveur échouée.</p>';
    }
}

// ===== AFFICHAGE DES RÉSULTATS =====
function displayResults(results, query) {
    const resultsContainer = document.getElementById('results');

    if (!results || results.length === 0) {
        resultsContainer.innerHTML = '<p class="no-results">[AUCUN RÉSULTAT]</p>';
        return;
    }

    let html = `
        <div class="results-header-bar">
            <span class="results-count">[${results.length} RÉSULTATS]</span>
            <div class="results-actions">
                <button onclick="copyResults()">📋 COPIER</button>
            </div>
        </div>
    `;

    results.forEach((person, index) => {
        const name = `${person.prenom || ''} ${person.nom_famille || ''}`.trim() || 'PROFIL INCONNU';
        const confidence = person._confidence || '?';
        const sources = person._sources || [];

        // Champs principaux
        const mainFields = [
            { label: 'EMAIL', key: 'email' },
            { label: 'TÉLÉPHONE', key: 'telephone' },
            { label: 'VILLE', key: 'ville' },
            { label: 'ADRESSE', key: 'adresse' },
            { label: 'CODE POSTAL', key: 'code_postal' },
            { label: 'PAYS', key: 'pays' },
            { label: 'NIR', key: 'nir' },
            { label: 'IBAN', key: 'iban' },
            { label: 'BIC', key: 'bic' },
            { label: 'SIRET', key: 'siret' },
            { label: 'SIREN', key: 'siren' },
        ];

        html += `
            <div class="result-item" data-index="${index}">
                <div class="result-header">
                    <h3>▶ ${name}</h3>
                    <span class="confidence-badge">CONFIANCE ${confidence}%</span>
                </div>
                
                <div class="result-grid">
                    ${mainFields.filter(f => person[f.key]).map(f => `
                        <div class="field">
                            <span class="label">${f.label}</span>
                            <span class="value">${person[f.key]}</span>
                        </div>
                    `).join('')}
                </div>
                
                ${sources.length ? `<div class="sources-line">SOURCES: ${sources.join(' | ')}</div>` : ''}
                
                <button class="details-btn" onclick="toggleDetails(${index})">[+] PLUS DE DÉTAIL</button>
                
                <div class="details-content" id="details-${index}">
                    ${buildDetails(person)}
                </div>
            </div>
        `;
    });

    resultsContainer.innerHTML = html;
}

// ===== CONSTRUCTION DES DÉTAILS =====
function buildDetails(person) {
    const sections = [
        { title: 'IDENTITÉ', fields: ['nom_famille', 'prenom', 'nom_naissance', 'nom_affichage', 'nom_utilisateur', 'genre', 'civilite', 'date_naissance', 'annee_naissance', 'ville_naissance'] },
        { title: 'CONTACT', fields: ['email', 'telephone', 'mobile', 'adresse_ip', 'discord_id', 'steam_id', 'fivem_license'] },
        { title: 'LOCALISATION', fields: ['adresse', 'complement_adresse', 'code_postal', 'ville', 'pays', 'region', 'departement'] },
        { title: 'IDENTIFIANTS UNIQUES', fields: ['nir', 'iban', 'bic', 'siret', 'siren'] },
        { title: 'VÉHICULE', fields: ['vin_plaque', 'immatriculation', 'marque', 'modele'] },
        { title: 'PROFESSIONNEL', fields: ['societe', 'profession', 'fonction'] }
    ];

    let html = '';
    
    sections.forEach(section => {
        const hasFields = section.fields.some(f => person[f]);
        if (!hasFields) return;
        
        html += `
            <button class="section-toggle" onclick="toggleSection(this)">
                ${section.title} <span class="arrow">▶</span>
            </button>
            <div class="section-content">
                ${section.fields.filter(f => person[f]).map(f => `
                    <div class="field">
                        <span class="label">${f.toUpperCase()}</span>
                        <span class="value">${person[f]}</span>
                    </div>
                `).join('')}
            </div>
        `;
    });

    // Famille
    const family = person.famille || person.membres_famille || [];
    if (family.length) {
        html += `
            <button class="section-toggle" onclick="toggleSection(this)">
                FAMILLE (${family.length}) <span class="arrow">▶</span>
            </button>
            <div class="section-content">
                ${family.map(m => `
                    <div class="family-group">
                        <div class="pivot">PIVOT: ${m.pivot || 'TÉLÉPHONE / ADRESSE'}</div>
                        ${['nom', 'prenom', 'telephone', 'adresse', 'ville'].filter(k => m[k]).map(k => `
                            <div class="field">
                                <span class="label">${k.toUpperCase()}</span>
                                <span class="value">${m[k]}</span>
                            </div>
                        `).join('')}
                    </div>
                `).join('')}
            </div>
        `;
    }

    return html;
}

// ===== TOGGLE DÉTAILS =====
function toggleDetails(index) {
    const content = document.getElementById(`details-${index}`);
    if (!content) return;
    content.classList.toggle('open');
    const btn = content.previousElementSibling;
    if (btn && btn.classList.contains('details-btn')) {
        btn.textContent = content.classList.contains('open') ? '[-] MOINS DE DÉTAIL' : '[+] PLUS DE DÉTAIL';
    }
}

// ===== TOGGLE SECTION =====
function toggleSection(btn) {
    const content = btn.nextElementSibling;
    if (!content || !content.classList.contains('section-content')) return;
    content.classList.toggle('open');
    const arrow = btn.querySelector('.arrow');
    if (arrow) arrow.classList.toggle('open');
}

// ===== COPIER RÉSULTATS =====
function copyResults() {
    if (!currentResults || currentResults.length === 0) {
        showToast('[ERREUR] Aucun résultat à copier.');
        return;
    }

    let text = '═' .repeat(60) + '\n';
    text += '  MARAUDER - RÉSULTATS DE RECHERCHE\n';
    text += '═' .repeat(60) + '\n\n';

    currentResults.forEach((person, i) => {
        const name = `${person.prenom || ''} ${person.nom_famille || ''}`.trim() || 'PROFIL INCONNU';
        text += `┌─ PROFIL ${i+1} : ${name}\n`;
        text += `├─ CONFIANCE : ${person._confidence || '?'}%\n`;

        // Tous les champs disponibles
        const ignore = ['_confidence', '_sources', '_source_db', 'famille', 'membres_famille'];
        const fields = Object.keys(person).filter(k => !ignore.includes(k) && person[k] && person[k] !== 'undefined');
        
        if (fields.length) {
            fields.forEach(k => {
                const label = k.toUpperCase().replace(/_/g, ' ');
                text += `├─ ${label} : ${person[k]}\n`;
            });
        }

        // Sources
        if (person._sources && person._sources.length) {
            text += `└─ SOURCES : ${person._sources.join(', ')}\n`;
        }
        
        text += '\n';
    });

    text += '═' .repeat(60) + '\n';
    text += `  ${currentResults.length} RÉSULTATS • MARAUDER v3.1.0\n`;
    text += '═' .repeat(60);

    // Copier dans le presse-papier
    navigator.clipboard.writeText(text).then(() => {
        showToast('[✓] ${currentResults.length} résultats copiés !');
    }).catch(() => {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('[✓] ${currentResults.length} résultats copiés !');
    });
}

// ===== EFFACER =====
function clearAll() {
    document.getElementById('searchInput').value = '';
    document.getElementById('results').innerHTML = '';
    currentResults = [];
    showToast('[✓] Résultats effacés.');
}

// ===== TOAST NOTIFICATION =====
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
    toast._timeout = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ===== ÉVÉNEMENTS =====
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const clearButton = document.getElementById('clearButton');

    searchButton.addEventListener('click', () => performSearch());
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });
    clearButton.addEventListener('click', clearAll);
});