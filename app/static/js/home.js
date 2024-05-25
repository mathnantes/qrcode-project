import {
	updateLastEntry,
	setLastEntryUpdateTrigger,
	clearForm,
} from './utils.js';

export function initializeHomePage() {
	initializeScanFunctionality();
	initializeSubmitFunctionality();
	updateLastEntry();
	setLastEntryUpdateTrigger();
}

function initializeScanFunctionality() {
	const cameraInput = document.getElementById('cameraInput');
	const triggerCamera = document.getElementById('triggerCamera');

	triggerCamera.addEventListener('click', function (event) {
		event.preventDefault();
		cameraInput.click(); // Trigger file input
	});

	cameraInput.addEventListener('change', function (event) {
		if (event.target.files.length > 0) {
			let selectedFile = event.target.files[0];
			const reader = new FileReader();

			reader.onload = function (e) {
				const imgElement = document.getElementById('triggerCamera');
				imgElement.src = e.target.result;
				imgElement.classList.add('scanned-img'); // Adjust the image size
			};

			reader.readAsDataURL(selectedFile); // Convert file to base64 string
		}
	});
}

function initializeSubmitFunctionality() {
	const submitButton = document.querySelector('.submit-btn');

	submitButton.addEventListener('click', function (event) {
		event.preventDefault();

		const selectedFile = document.getElementById('cameraInput').files[0];

		if (!selectedFile) {
			alert('Por favor, selecione uma imagem para escanear.');
			return;
		}

		const attendanceRadio = document.querySelector(
			'input[name="attendance"]:checked'
		);
		if (!attendanceRadio) {
			alert('Por favor, selecione check-in ou check-out.');
			return;
		}

		const lectureDropdown = document.getElementById('lecture-dropdown');
		if (lectureDropdown.selectedIndex === 0) {
			alert('Por favor, selecione uma palestra.');
			return;
		}

		const formData = new FormData();
		formData.append('file', selectedFile);
		formData.append('action', attendanceRadio.value);
		formData.append('lecture_id', lectureDropdown.value);

		fetch('/scan', {
			method: 'POST',
			body: formData,
		})
			.then((response) => response.json())
			.then((data) => {
				if (data.error) {
					alert(data.error);
				} else {
					console.log('QR Code Data:', data.decoded_data);
					alert('Registrado com sucesso!');
					clearForm(); // Clear form after submission
					updateLastEntry();
				}
			})
			.catch((error) => {
				console.error('Erro:', error);
				clearForm(); // Ensure form is cleared even on error
				updateLastEntry();
			});
	});
}
