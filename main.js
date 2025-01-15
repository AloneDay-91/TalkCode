import './style.css';
import { OBSWebSocket } from 'obs-websocket-js';
import Lenis from 'lenis';

const obs = new OBSWebSocket();


async function connectToOBS(ip, port, password) {
    try {
        const address = `ws://${ip}:${port}`;
        await obs.connect(address, password);
        console.log('Connecté à OBS');
        document.getElementById('block-content').classList.remove('hidden');
        document.getElementById('block-login').classList.add('hidden');
        document.getElementById('logoutButton').classList.remove('hidden');
        showSnackbar('Connexion réussie à OBS !');

        // Stocker les informations de connexion dans sessionStorage
        sessionStorage.setItem('obsSession', JSON.stringify({ ip, port, password }));
    } catch (error) {
        console.error('Échec de la connexion à OBS :', error);
        showAlert('Erreur de connexion à OBS. Vérifiez vos paramètres.');
    }
}


window.addEventListener('DOMContentLoaded', () => {
    const sessionData = sessionStorage.getItem('obsSession');
    if (sessionData) {
        const { ip, port, password } = JSON.parse(sessionData);
        console.log('Session trouvée : Tentative de reconnexion...');
        connectToOBS(ip, port, password);
    }
});


document.getElementById('logoutButton').addEventListener('click', () => {
    // Supprimer la session du stockage
    sessionStorage.removeItem('obsSession');
    localStorage.removeItem('obsSession');

    // Réinitialiser l'interface utilisateur
    document.getElementById('logoutButton').classList.remove('hidden');
    document.getElementById('block-content').classList.add('hidden');
    document.getElementById('block-login').classList.remove('hidden');

    showSnackbar('Déconnecté avec succès.');
});



document.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault(); // Empêche le rechargement de la page

    // Récupération des valeurs des champs
    const ip = document.getElementById('ip').value.trim();
    const port = document.getElementById('port').value.trim();
    const password = document.getElementById('mdp').value.trim();

    // Validation des entrées
    if (!ip || !port || !password) {
        showAlert('Veuillez remplir tous les champs.');
        return;
    }

    // Ajoute un délai avant d'afficher l'alerte
    setTimeout(() => {
        showAlert('Impossible de se connecter à OBS. Vérifiez vos paramètres.');
    }, 2000);

    connectToOBS(ip, port, password);
});


// Reste de votre logique

async function switchScene(sceneName) {
    try {
        await obs.call('SetCurrentProgramScene', { sceneName });
        console.log(`Transition vers la scène ${sceneName}`);
    } catch (error) {
        console.error(`Erreur lors de la transition vers la scène ${sceneName}:`, error);
    }
}

// Ajout d'écouteurs d'événements pour les boutons de scène
document.querySelectorAll('.obs-btn').forEach(button => {
    button.addEventListener('click', () => {
        const sceneName = button.getAttribute('data-scene');
        switchScene(sceneName);  // Change de scène
        showSnackbar(`Transition vers la scène ${sceneName}`);
        activateBadge(button);   // Affiche le badge "Activer" uniquement sur ce bouton
    });
});

document.querySelectorAll('.overlay-btn').forEach(button => {
    button.addEventListener('click', () => {
        const sourceName = button.getAttribute('data-source');
        const sceneName = "MAIN"; // Remplacez par le nom de votre scène contenant les alertes
        toggleSourceVisibility(sceneName, sourceName);
    });
});

// Fonction pour afficher ou masquer une source dans une scène
async function toggleSourceVisibility(sceneName, sourceName) {
    try {
        const { sceneItems } = await obs.call('GetSceneItemList', { sceneName });
        const source = sceneItems.find(item => item.sourceName === sourceName);

        if (!source) {
            console.error(`La source ${sourceName} n'a pas été trouvée dans la scène ${sceneName}`);
            return;
        }

        const newVisibility = !source.sceneItemEnabled;

        // Met à jour la visibilité de la source
        await obs.call('SetSceneItemEnabled', {
            sceneName: sceneName,
            sceneItemId: source.sceneItemId,
            sceneItemEnabled: newVisibility
        });

        console.log(`La visibilité de la source ${sourceName} a été définie sur ${newVisibility}`);
        showSnackbar(`La source ${sourceName} est maintenant ${newVisibility ? 'visible' : 'cachée'}`);
    } catch (error) {
        console.error(`Erreur lors de la modification de la visibilité de la source ${sourceName}:`, error);
        showAlert(`Impossible de modifier la visibilité de ${sourceName}.`);
    }
}

// Écouter la fin de lecture des médias
obs.on('MediaInputPlaybackEnded', async (data) => {
    try {
        const { inputName } = data; // Nom de la source qui a terminé la lecture

        console.log(`Lecture terminée pour ${inputName}`);

        // Récupère la scène contenant cette source
        const sceneName = "MAIN"; // Remplacez par le nom de votre scène
        const { sceneItems } = await obs.call('GetSceneItemList', { sceneName });
        const source = sceneItems.find(item => item.sourceName === inputName);

        if (!source) {
            console.error(`La source ${inputName} n'a pas été trouvée dans la scène ${sceneName}`);
            return;
        }

        // Cache automatiquement la source
        await obs.call('SetSceneItemEnabled', {
            sceneName: sceneName,
            sceneItemId: source.sceneItemId,
            sceneItemEnabled: false
        });

        console.log(`La source ${inputName} a été automatiquement masquée après la fin de sa lecture.`);
    } catch (error) {
        console.error(`Erreur lors de la gestion de la fin de lecture pour la source ${data.inputName}:`, error);
    }
});

// Affichage de la snackbar
function showSnackbar(message) {
    const snackbar = document.getElementById('snackbar');
    snackbar.classList.remove('opacity-0'); // Affiche la snackbar
    snackbar.classList.add('opacity-100');  // Transition d'opacité
    snackbar.querySelector('p').textContent = message;

    // Cache la snackbar après 3 secondes
    setTimeout(() => {
        snackbar.classList.remove('opacity-100');
        snackbar.classList.add('opacity-0');
    }, 3000);
}

function showAlert(message) {
    const alert = document.getElementById('alertError');
    alert.classList.remove('opacity-0'); // Affiche l'alerte
    alert.classList.add(
        'p-4',
        'mb-4',
        'text-sm',
        'text-red-800',
        'rounded-lg',
        'bg-red-50',
        'opacity-100'
    );
    alert.querySelector('p').textContent = message;
}



// Badge pour le bouton actif
function activateBadge(button) {
    document.querySelectorAll('.obs-btn .badge').forEach(badge => badge.remove());

    let badge = document.createElement('span');
    badge.classList.add('inline-flex', 'items-center', 'justify-center', 'rounded-full', 'bg-red-100', 'px-2', 'py-0.2', 'text-red-700', 'badge', 'absolute', 'top-0', 'right-0', 'mr-4', 'mt-4');
    badge.innerHTML = '<p class="whitespace-nowrap text-xs flex items-center">' +
        '<img class="w-5 h-5" src="https://cdn3.emoji.gg/emojis/9123_red_circle.png" alt=""/>' +
        'LIVE</p>';
    button.querySelector('span').appendChild(badge);
}

window.addEventListener('scroll', function() {
    const header = document.getElementById('header');
    if (window.scrollY > 50) {
        header.classList.add('header-appear');
        header.classList.remove('header-disappear');
    } else {
        header.classList.add('header-disappear');
        header.classList.remove('header-appear');
    }
});

// Scroll behavior et Lenis (inchangé)
if (window.innerWidth > 768) {
    const lenis = new Lenis();
    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
}
