export function updateLastEntry() {
	fetch('/latest-history')
		.then((response) => response.json())
		.then((data) => {
			const lastEntryDiv = document.querySelector('.last-entry');
			if (Object.keys(data).length !== 0) {
				lastEntryDiv.innerHTML = `
                    <div>
                        <div class="history-info">ID: ${data.qr_code_data}</div>
                        <div class="history-info">Check-in: ${
													data.check_in_time || ''
												}</div>
                        <div class="history-info">Check-out: ${
													data.check_out_time || ''
												}</div>
                        <div class="history-info">Palestra: ${
													data.lecture_name
												}</div>
                    </div>`;
			} else {
				lastEntryDiv.innerHTML =
					'<div class="no-history-text">Nenhum registro encontrado.</div>';
			}
		})
		.catch((error) => {
			console.error('Erro ao buscar o último registro de histórico:', error);
			document.querySelector('.last-entry').innerHTML =
				'<div class="no-history-text">Erro ao carregar registro.</div>';
		});
}

export function setLastEntryUpdateTrigger() {
	const submitButton = document.querySelector('.submit-btn');
	if (submitButton) {
		submitButton.addEventListener('click', function () {
			updateLastEntry();
		});
	}
}

export function clearForm() {
	document.getElementById('cameraInput').value = '';
	document.getElementById('lecture-dropdown').selectedIndex = 0;
	selectedFile = null;

	// Reset the image source to the qr-border.png
	const imgElement = document.getElementById('triggerCamera');
	imgElement.src = '/static/images/qr-border.png'; // Make sure the path is correct
	imgElement.classList.remove('scanned-img'); // If you add a class that changes the display on scan
}

export function isIos() {
	const userAgent = window.navigator.userAgent.toLowerCase();
	return /iphone|ipad|ipod/.test(userAgent);
}

export function isInStandaloneMode() {
	return (
		window.matchMedia('(display-mode: standalone)').matches ||
		window.navigator.standalone
	);
}

export function showInstallPrompt() {
	const installContainer = document.getElementById('install-container');
	if (installContainer) {
		installContainer.style.display = 'block';
	}
}

export function hideInstallPrompt() {
	const installContainer = document.getElementById('install-container');
	if (installContainer) {
		installContainer.style.display = 'none';
	}
}

export function refreshPage() {
	window.location.reload(true); // Force reload from the server, not cache
}
