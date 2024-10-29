import './style.css';
import { OBSWebSocket } from 'obs-websocket-js';

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
