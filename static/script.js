document.addEventListener('DOMContentLoaded', function () {
	const buttons = document.querySelectorAll('.nav-button');
	const contentArea = document.getElementById('content-area');
	const defaultContentHTML = contentArea.innerHTML; // Keep the default content

	function updateContentArea(buttonId, callback) {
		switch (buttonId) {
			case 'home-btn':
				contentArea.innerHTML = defaultContentHTML;
				populateLectureDropdown();
				callback();
				break;
			case 'history-btn':
				fetchHistory(callback);
				break;
			case 'lectures-btn':
				fetchLectures(callback);
				break;
			case 'settings-btn':
				contentArea.innerHTML = '<div>Settings Content will go here</div>';
				callback();
				break;
		}
	}

	// Call populateLectureDropdown on initial load
	populateLectureDropdown();

	function populateLectureDropdown() {
		fetch('/lectures')
			.then((response) => response.json())
			.then((lectures) => {
				const dropdown = document.getElementById('lecture-dropdown');
				dropdown.innerHTML =
					'<option disabled selected>Select Lecture</option>';
				lectures.forEach((lecture) => {
					const option = document.createElement('option');
					option.value = lecture.id;
					option.textContent = lecture.name;
					dropdown.appendChild(option);
				});
			})
			.catch((error) => console.error('Failed to load lectures:', error));
	}

	function fetchHistory(callback) {
		fetch('/history')
			.then((response) => response.json())
			.then((data) => {
				let historyHTML = '<div class="history-page">';
				if (data.length) {
					historyHTML += data
						.map(
							(lecture) => `
                                <div class="lecture-card-container" id="lecture-container-${lecture.id}">
                                    <div class="delete-icon" onclick="deleteLecture(${lecture.id})">
                                        <img src="/static/delete.png" alt="Delete">
                                    </div>
                                    <div class="lecture-card" id="lecture-card-${lecture.id}">
                                        <div class="lecture-info">Name: ${lecture.name}</div>
                                        <div class="lecture-info">Lecturer: ${lecture.lecturer}</div>
                                        <div class="lecture-info">Start Time: ${lecture.start_time}</div>
                                        <div class="lecture-info">End Time: ${lecture.end_time}</div>
                                    </div>
                                </div>
        `
						)
						.join('');
				} else {
					historyHTML +=
						'<div class="no-history"><div class="no-history-text">No attendance records available.</div></div>';
				}
				historyHTML += '</div>';
				contentArea.innerHTML = historyHTML;
				callback();
			})
			.catch((error) => console.error('Error loading history:', error));
	}

	function fetchLectures(callback) {
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
                                    <div class="lecture-info">Name: ${lecture.name}</div>
                                    <div class="lecture-info">Lecturer: ${lecture.lecturer}</div>
                                    <div class="lecture-info">Start Time: ${lecture.start_time}</div>
                                    <div class="lecture-info">End Time: ${lecture.end_time}</div>
                                </div>
                            </div>
                        `
						)
						.join('');
				} else {
					lecturesHTML +=
						'<div class="no-lectures"><div class="no-lectures-text">No lectures available.</div></div>';
				}
				lecturesHTML += '</div>';
				contentArea.innerHTML = lecturesHTML;
				addSwipeListeners();
				appendAddLectureButton(); // Function to append the add lecture button
				callback();
			})
			.catch((error) => console.error('Error loading lectures:', error));
	}

	function appendAddLectureButton() {
		let addLectureHTML = `
        <div class="add-lecture-btn" style="position: fixed; bottom: 10%; left: 50%; transform: translateX(-50%);">
            <img src="/static/add.png" alt="Add Lecture" style="width:50px; height:50px;" onclick="toggleLectureForm()">
        </div>
        <form id="lecture-form" class="lecture-form" style="display:none;">
            <button type="button" class="close-btn" onclick="toggleLectureForm()">&#10005;</button>
            <h1>Register New Lecture</h1>
            <div class="input-group">
                <label for="lecture-name">Name:</label>
                <input type="text" id="lecture-name" class="form-input" placeholder="Enter lecture name" required>
            </div>
            <div class="input-group">
                <label for="lecturer-name">Lecturer:</label>
                <input type="text" id="lecturer-name" class="form-input" placeholder="Enter lecturer's name" required>
            </div>
            <div class="input-group">
                <label for="start-time">Start Time:</label>
                <input type="datetime-local" id="start-time" class="form-input" required>
            </div>
            <div class="input-group">
                <label for="end-time">End Time:</label>
                <input type="datetime-local" id="end-time" class="form-input" required>
            </div>
            <button type="submit" class="submit-btn">Register Lecture</button>
        </form>
    `;
		document
			.getElementById('content-area')
			.insertAdjacentHTML('beforeend', addLectureHTML);
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

	document
		.getElementById('content-area')
		.addEventListener('submit', function (event) {
			if (event.target.matches('#lecture-form')) {
				event.preventDefault();
				const formData = {
					name: document.getElementById('lecture-name').value,
					lecturer: document.getElementById('lecturer-name').value,
					start_time: document.getElementById('start-time').value,
					end_time: document.getElementById('end-time').value,
				};
				fetch('/register-lecture', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(formData),
				})
					.then((response) => response.json())
					.then((data) => {
						console.log(data.message);
						fetchLectures(() => {});
						toggleLectureForm();
					})
					.catch((error) => console.error('Error registering lecture:', error));
			}
		});

	document
		.getElementById('triggerCamera')
		.addEventListener('click', function (event) {
			event.preventDefault();
			document.getElementById('cameraInput').click();
		});

	let selectedFile = null;
	document
		.getElementById('cameraInput')
		.addEventListener('change', function (event) {
			if (event.target.files.length > 0) {
				selectedFile = event.target.files[0];
			}
		});

	function clearForm() {
		document.getElementById('cameraInput').value = '';
		document.querySelector('input[name="attendance"]:checked').checked = false;
		document.getElementById('lecture-dropdown').selectedIndex = 0;
		selectedFile = null;
	}

	document
		.querySelector('.submit-btn')
		.addEventListener('click', function (event) {
			event.preventDefault();
			if (!selectedFile) {
				alert('Please select an image to scan.');
				return;
			}
			if (!document.querySelector('input[name="attendance"]:checked')) {
				alert('Please select either check-in or check-out.');
				return;
			}
			if (document.getElementById('lecture-dropdown').selectedIndex == 0) {
				alert('Please select a lecture.');
				return;
			}
			const formData = new FormData();
			formData.append('file', selectedFile);
			formData.append(
				'action',
				document.querySelector('input[name="attendance"]:checked').value
			);
			formData.append(
				'lecture_id',
				document.getElementById('lecture-dropdown').value
			);
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
						alert('Attendance recorded successfully!');
						clearForm();
					}
				})
				.catch((error) => {
					console.error('Error:', error);
					clearForm();
				});
		});

	// Function to toggle lecture form visibility
	window.toggleLectureForm = function () {
		const form = document.querySelector('.lecture-form');
		const addButton = document.querySelector('.add-lecture-btn img');
		if (form.style.display === 'none' || !form.style.display) {
			form.style.display = 'block';
			addButton.style.opacity = '0.5';
			setTimeout(() => {
				form.style.opacity = '1';
				form.style.transform = 'translate(-50%, -50%) scale(1)';
			}, 10);
		} else {
			form.style.transform = 'translate(-50%, -50%) scale(0.1)';
			form.style.opacity = '0';
			setTimeout(() => {
				form.style.display = 'none';
				addButton.style.opacity = '1';
			}, 500);
		}
	};

	function addSwipeListeners() {
		const lectureCards = document.querySelectorAll('.lecture-card');
		lectureCards.forEach((card) => {
			let startX, currentX;

			card.addEventListener('touchstart', (e) => {
				startX = e.changedTouches[0].clientX;
				card.style.transition = ''; // Disable transition for smoother dragging
			});

			card.addEventListener('touchmove', (e) => {
				currentX = e.changedTouches[0].clientX;
				const deltaX = currentX - startX;

				// Limit the swipe distance to a maximum of 150 pixels
				if (deltaX < 0 && Math.abs(deltaX) <= 150) {
					card.style.transform = `translateX(${deltaX}px)`;
					card.querySelector('.delete-icon').style.opacity = Math.min(
						Math.abs(deltaX) / 150,
						0.5
					);
				}
			});

			card.addEventListener('touchend', (e) => {
				const endX = e.changedTouches[0].clientX;
				const threshold = 150;
				if (startX > endX + threshold) {
					// Commit to delete if swiped beyond threshold
					deleteLecture(card.id.split('-')[2]);
				} else {
					// Reset if not swiped far enough or pulled back
					card.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
					card.style.transform = 'translateX(0)';
					card.querySelector('.delete-icon').style.opacity = 0;
				}
			});
		});
	}
});

function deleteLecture(lectureId) {
	if (confirm('Are you sure you want to delete this lecture?')) {
		// User confirms deletion
		fetch(`/delete-lecture/${lectureId}`, {
			method: 'POST',
		})
			.then((response) => response.json())
			.then((data) => {
				alert(data.message);
				const lectureCard = document.getElementById(
					`lecture-card-${lectureId}`
				);
				if (lectureCard) {
					lectureCard.style.transition = 'transform 0.3s ease-in-out';
					lectureCard.style.transform = 'translateX(-100%)'; // Animate swipe out
					setTimeout(() => lectureCard.remove(), 300); // Wait for animation
				}
			})
			.catch((error) => console.error('Error deleting lecture:', error));
	} else {
		// User cancels deletion
		const lectureCard = document.getElementById(`lecture-card-${lectureId}`);
		if (lectureCard) {
			// Reset card position
			lectureCard.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
			lectureCard.style.transform = 'translateX(0)';
			lectureCard.parentNode.querySelector('.delete-icon').style.opacity = 0;
		}
	}
}
