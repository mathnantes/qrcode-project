import { initializeNavigation } from './navigation.js';
import { populateLectureDropdown } from './lectures.js';
import { initializeHomePage, updateLastEntry } from './home.js';
import { checkLogin, initializeLogin } from './login.js';
import {
	isIos,
	isInStandaloneMode,
	showInstallPrompt,
	hideInstallPrompt,
} from './utils.js';

document.addEventListener('DOMContentLoaded', function () {
	initializeNavigation();
	populateLectureDropdown();
	initializeLogin();
	updateLastEntry();

	let deferredPrompt;
	const installContainer = document.getElementById('install-container');
	const installButton = document.getElementById('install-button');

	window.addEventListener('beforeinstallprompt', (e) => {
		e.preventDefault();
		deferredPrompt = e;
		if (!isInStandaloneMode() && !isIos()) {
			showInstallPrompt();
		}

		installButton.addEventListener('click', () => {
			hideInstallPrompt();
			deferredPrompt.prompt();
			deferredPrompt.userChoice.then((choiceResult) => {
				if (choiceResult.outcome === 'accepted') {
					console.log('Usuário aceitou o prompt de instalação');
				} else {
					console.log('Usuário rejeitou o prompt de instalação');
				}
				deferredPrompt = null;
			});
		});
	});

	if (isInStandaloneMode()) {
		hideInstallPrompt();
		checkLogin();
	} else if (isIos() && !isInStandaloneMode()) {
		showInstallPrompt();
		installButton.textContent = 'Instalar Aplicativo (iOS)';
		installButton.addEventListener('click', () => {
			alert(
				'Para instalar este aplicativo, toque no ícone de compartilhamento e depois em "Adicionar à Tela de Início".'
			);
		});
	} else {
		showInstallPrompt();
	}
});
