import './style.css';
import { OBSWebSocket } from 'obs-websocket-js';
import Lenis from 'lenis'

const obs = new OBSWebSocket();

async function main() {
    try {
        await obs.connect('ws://127.0.0.1:4455', 'elouan10032004'); // Mot de passe si nécessaire
        console.log('Connecté à OBS');

        // Liste toutes les scènes pour vérifier la connexion
        const scenes = await obs.call('GetSceneList');
        console.log('Liste des scènes disponibles :', scenes);

    } catch (error) {
        console.error('Échec de la connexion à OBS :', error);
    }
}

async function switchScene(sceneName) {
    try {
        await obs.call('SetCurrentProgramScene', { sceneName });
        console.log(`Transition vers la scène ${sceneName}`);
    } catch (error) {
        console.error(`Erreur lors de la transition vers la scène ${sceneName}:`, error);
    }
}

// Ajout d'écouteurs d'événements pour les boutons
document.getElementById('toggleOverlay1').addEventListener('click', () => switchScene('MAIN'));
document.getElementById('toggleOverlay2').addEventListener('click', () => switchScene('PAUSE'));
document.getElementById('toggleOverlay3').addEventListener('click', () => switchScene('DEBUT'));
document.getElementById('toggleOverlay4').addEventListener('click', () => switchScene('FIN'));


main();

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

// activer uniquement sur ordinateur
if (window.innerWidth > 768) {
    // Initialize Lenis
    const lenis = new Lenis();

// Use requestAnimationFrame to continuously update the scroll
    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

}

function showSnackbar() {
    const snackbar = document.getElementById('snackbar');
    snackbar.classList.remove('opacity-0'); // Affiche la snackbar
    snackbar.classList.add('opacity-100');  // Transition d'opacité

    // Cache la snackbar après 3 secondes
    setTimeout(() => {
        snackbar.classList.remove('opacity-100');
        snackbar.classList.add('opacity-0');
    }, 3000);
}

// Fonction pour gérer l'affichage unique du badge "Activer"
function activateBadge(button) {
    // Supprime tous les badges des autres boutons
    document.querySelectorAll('.obs-btn .badge').forEach(badge => badge.remove());

    // Ajoute le badge uniquement au bouton spécifié
    let badge = document.createElement('span');
    badge.classList.add('inline-flex', 'items-center', 'justify-center', 'rounded-full', 'bg-red-100', 'px-2', 'py-0.2', 'text-red-700', 'badge', 'absolute', 'top-0', 'right-0', 'mr-4', 'mt-4');
    badge.innerHTML = '<p class="whitespace-nowrap text-xs flex items-center">' +
        '<img class="w-5 h-5" src="https://cdn3.emoji.gg/emojis/9123_red_circle.png" alt=""/>' +
    'LIVE</p>';
    button.querySelector('span').appendChild(badge);
}

// Applique l'écouteur d'événement à tous les boutons de la classe `obs-btn`
document.querySelectorAll('.obs-btn').forEach(button => {
    button.addEventListener('click', () => {
        const sceneName = button.getAttribute('data-scene');
        switchScene(sceneName);  // Change de scène
        showSnackbar(`Transition vers la scène ${sceneName}`);
        activateBadge(button);   // Affiche le badge "Activer" uniquement sur ce bouton
    });
});
