import { initializeHomePage } from './home.js';
import { fetchHistory } from './history.js';
import { fetchLectures } from './lectures.js';
import { showSettings } from './settings.js';
import { updateLastEntry } from './utils.js';

export function initializeNavigation() {
	const buttons = document.querySelectorAll('.nav-button');
	const contentArea = document.getElementById('content-area');
	const defaultContentHTML = contentArea.innerHTML;

	function updateContentArea(buttonId, callback) {
		switch (buttonId) {
			case 'home-btn':
				contentArea.innerHTML = defaultContentHTML;
				initializeHomePage();
				populateLectureDropdown();
				updateLastEntry();
				callback();
				break;
			case 'history-btn':
				fetchHistory(callback);
				break;
			case 'lectures-btn':
				fetchLectures(callback);
				break;
			case 'settings-btn':
				showSettings(contentArea);
				callback();
				break;
		}
	}

	buttons.forEach((button) => {
		button.addEventListener('click', function () {
			buttons.forEach((btn) => btn.classList.remove('selected'));
			this.classList.add('selected');
			contentArea.classList.add('fade-out');
			setTimeout(() => {
				updateContentArea(this.id, () => {
					contentArea.classList.remove('fade-out');
					contentArea.classList.add('fade-in');
					setTimeout(() => {
						contentArea.classList.remove('fade-in');
					}, 500);
				});
			}, 500);
		});
	});
}
