export function fetchLectures(callback) {
	fetch('/lectures')
		.then((response) => response.json())
		.then((data) => {
			let lecturesHTML = '<div class="lectures-page">';
			if (data.length) {
				lecturesHTML += data
					.map(
						(lecture) => `
                    <div class="lecture-card" id="lecture-card-${lecture.id}">
                        <div class="delete-icon"></div>
                        <div class="lecture-card-content">
                            <div class="lecture-info">Nome: ${lecture.name}</div>
                            <div class="lecture-info">Palestrante: ${lecture.lecturer}</div>
                            <div class="lecture-info">Início: ${lecture.start_time}</div>
                            <div class="lecture-info">Fim: ${lecture.end_time}</div>
                        </div>
                    </div>
                `
					)
					.join('');
			} else {
				lecturesHTML +=
					'<div class="no-lectures"><div class="no-lectures-text">Nenhuma palestra disponível.</div></div>';
			}
			lecturesHTML += '</div>';
			document.getElementById('content-area').innerHTML = lecturesHTML;
			addSwipeListeners();
			appendAddLectureButton(); // Function to append the add lecture button
			callback();
		})
		.catch((error) => console.error('Erro ao carregar palestras:', error));
}

export function populateLectureDropdown() {
	fetch('/lectures')
		.then((response) => response.json())
		.then((lectures) => {
			const dropdown = document.getElementById('lecture-dropdown');
			dropdown.innerHTML =
				'<option disabled selected>Selecionar Palestra</option>';
			lectures.forEach((lecture) => {
				const option = document.createElement('option');
				option.value = lecture.id;
				option.textContent = lecture.name;
				dropdown.appendChild(option);
			});
		})
		.catch((error) => console.error('Falha ao carregar palestras:', error));
}

function appendAddLectureButton() {
	let addLectureHTML = `
    <div class="add-lecture-btn" style="position: fixed; top: 23%; left: 50%; transform: translateX(-50%);">
        <button class="add-lecture-btn" onclick="toggleLectureForm()">Adicionar Palestra</button>
    </div>
    <form id="lecture-form" class="lecture-form" style="display:none;">
        <button type="button" class="close-btn" onclick="toggleLectureForm()">&#10005;</button>
        <h1>Registrar nova Palestra</h1>
        <div class="input-group">
            <label for="lecture-name">Nome:</label>
            <input type="text" id="lecture-name" class="form-input" placeholder="Digite o nome da palestra" required>
        </div>
        <div class="input-group">
            <label for="lecturer-name">Palestrante:</label>
            <input type="text" id="lecturer-name" class="form-input" placeholder="Digite o nome do palestrante" required>
        </div>
        <div class="input-group">
            <label for="start-time">Início:</label>
            <input type="datetime-local" id="start-time" class="form-input" required>
        </div>
        <div class="input-group">
            <label for="end-time">Fim:</label>
            <input type="datetime-local" id="end-time" class="form-input" required>
        </div>
        <button type="submit" class="submit-btn">Registrar Palestra</button>
    </form>`;
	document
		.getElementById('content-area')
		.insertAdjacentHTML('beforeend', addLectureHTML);
}

function addSwipeListeners() {
	const lectureCards = document.querySelectorAll('.lecture-card');
	lectureCards.forEach((card) => {
		let startX;

		card.addEventListener('touchstart', (e) => {
			startX = e.changedTouches[0].clientX;
			card.style.transition = 'none'; // Remove any transition to allow for smooth movement
			card.querySelector('.delete-icon').style.transition = 'none';
		});

		card.addEventListener('touchmove', (e) => {
			let currentX = e.changedTouches[0].clientX;
			let deltaX = currentX - startX;

			if (deltaX < 0 && Math.abs(deltaX) < 150) {
				// Only allow swiping left and limit distance
				card.style.transform = `translateX(${deltaX}px)`;
				card.querySelector('.delete-icon').style.opacity = Math.min(
					1,
					Math.abs(deltaX) / 150
				);
			}
		});

		card.addEventListener('touchend', (e) => {
			const endX = e.changedTouches[0].clientX;
			const threshold = 100; // Adjust the threshold for detection
			let deltaX = startX - endX;
			let lectureId = card.id.split('-')[2]; // Assuming ID format is 'lecture-card-{id}'

			if (deltaX > threshold) {
				confirmDelete(lectureId, card);
			} else {
				resetCardPosition(card);
			}
		});
	});
}

function resetCardPosition(card) {
	card.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
	card.querySelector('.delete-icon').style.transition = 'opacity 0.3s ease-out';
	card.style.transform = 'translateX(0)';
	card.querySelector('.delete-icon').style.opacity = 0;
}

function confirmDelete(lectureId, card) {
	if (confirm('Tem certeza que quer deletar esta palestra?')) {
		deleteLecture(lectureId, card);
	} else {
		resetCardPosition(card); // Reset card position if user cancels deletion
	}
}

function deleteLecture(lectureId, card) {
	fetch(`/delete-lecture/${lectureId}`, {
		method: 'POST',
	})
		.then((response) => response.json())
		.then((data) => {
			alert(data.message);
			if (card) {
				// Animate card to slide out and fade out
				card.style.transition =
					'transform 0.5s ease-in-out, opacity 0.5s ease-in-out';
				card.style.transform = 'translateX(-100%)'; // Move card out of view to the left
				card.style.opacity = '0'; // Fade out the card
				setTimeout(() => {
					card.remove(); // Remove from the DOM after animation completes
				}, 500); // Match the timeout with the duration of the transition
			}
		})
		.catch((error) => console.error('Erro ao deletar palestra:', error));
}
