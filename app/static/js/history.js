export function fetchHistory(callback) {
	// Fetch lectures for the dropdown to filter history by lecture
	fetch('/lectures')
		.then((response) => response.json())
		.then((lectures) => {
			let filterHTML = '<select id="history-filter">';
			filterHTML += '<option value="">Todas</option>';
			lectures.forEach((lecture) => {
				filterHTML += `<option value="${lecture.id}">${lecture.name}</option>`;
			});
			filterHTML += '</select>';

			filterHTML +=
				'<button id="export-pdf" class="export-btn">Exportar para PDF</button>';

			const contentArea = document.getElementById('content-area');
			contentArea.innerHTML =
				'<div class="filter-container">' +
				filterHTML +
				'</div><div class="history-page"></div>';

			document
				.getElementById('history-filter')
				.addEventListener('change', function () {
					loadFilteredHistory(this.value);
				});

			document
				.getElementById('export-pdf')
				.addEventListener('click', function () {
					const lectureId =
						document.getElementById('history-filter').value || '';
					const url = `/export-history?lectureId=${lectureId}`;
					downloadPDF(url);
				});

			function downloadPDF(url) {
				fetch(url)
					.then((response) => response.blob())
					.then((blob) => {
						const link = document.createElement('a');
						link.href = window.URL.createObjectURL(blob);
						link.download = url.split('/').pop();
						document.body.appendChild(link);
						link.click();
						document.body.removeChild(link);
					})
					.catch((error) => console.error('Erro ao baixar PDF:', error));
			}

			loadFilteredHistory(); // Load all history initially
			callback();
		})
		.catch((error) =>
			console.error('Falha ao carregar palestras para filtro:', error)
		);
}

function loadFilteredHistory(lectureId = '') {
	fetch(`/history?lectureId=${lectureId}`)
		.then((response) => response.json())
		.then((data) => {
			let historyHTML = '';
			if (data.length) {
				data.forEach((record) => {
					historyHTML += `
                    <div class="history-card" id="history-card-${record.id}">
                        <div class="delete-icon"></div>
                        <div class="history-info">ID: ${
													record.qr_code_data
												}</div>
                        <div class="history-info">Check-in: ${
													record.check_in_time || ''
												}</div>
                        <div class="history-info">Check-out: ${
													record.check_out_time || ''
												}</div>
                        <div class="history-info">Palestra: ${
													record.lecture_name
												}</div>
                    </div>`;
				});
			} else {
				historyHTML +=
					'<div class="no-history"><div class="no-history-text">Nenhum registro disponível.</div></div>';
			}
			historyHTML += '</div>';
			document.querySelector('.history-page').innerHTML = historyHTML;
			addHistorySwipeListeners(); // Call this function after the content is loaded into the DOM
		})
		.catch((error) => console.error('Erro ao carregar histórico:', error));
}

function addHistorySwipeListeners() {
	const historyCards = document.querySelectorAll('.history-card');

	historyCards.forEach((card) => {
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
			let historyId = card.id.split('-')[2]; // Assuming ID format is 'history-card-{id}'

			if (deltaX > threshold) {
				confirmHistoryDelete(historyId, card);
			} else {
				resetCardPosition(card);
			}
		});
	});
}
