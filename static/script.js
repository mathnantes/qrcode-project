document.addEventListener('DOMContentLoaded', function () {
	const buttons = document.querySelectorAll('.nav-button');
	const contentArea = document.getElementById('content-area');
	const defaultContentHTML = contentArea.innerHTML; // Keep the default content

	function updateContentArea(buttonId, callback) {
		switch (buttonId) {
			case 'home-btn':
				contentArea.innerHTML = defaultContentHTML;
				initializeHomePage(); // Initializes all home page functionalities
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
				contentArea.innerHTML = '<div>Settings Content will go here</div>';
				callback();
				break;
		}
	}

	// Call populateLectureDropdown on initial load
	populateLectureDropdown();

	function initializeHomePage() {
		initializeScanFunctionality();
		initializeSubmitFunctionality();
		updateLastEntry(); // Ensure last entry is updated on home page setup
		setLastEntryUpdateTrigger(); // Setup the trigger for updating the last entry
	}

	function setLastEntryUpdateTrigger() {
		const submitButton = document.querySelector('.submit-btn');
		if (submitButton) {
			submitButton.addEventListener('click', function () {
				updateLastEntry(); // Update last entry on submit
			});
		}
	}

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
		// Fetch lectures for the dropdown to filter history by lecture
		fetch('/lectures')
			.then((response) => response.json())
			.then((lectures) => {
				let filterHTML = '<select id="history-filter">';
				filterHTML += '<option value="">All Lectures</option>';
				lectures.forEach((lecture) => {
					filterHTML += `<option value="${lecture.id}">${lecture.name}</option>`;
				});
				filterHTML += '</select>';
				contentArea.innerHTML =
					'<div class="filter-container">' +
					filterHTML +
					'</div><div class="history-page"></div>';

				document
					.getElementById('history-filter')
					.addEventListener('change', function () {
						loadFilteredHistory(this.value);
					});

				loadFilteredHistory(); // Load all history initially
				callback();
			})
			.catch((error) =>
				console.error('Failed to load lectures for filter:', error)
			);
	}

	function loadFilteredHistory(lectureId = '') {
		fetch(`/history?lectureId=${lectureId}`)
			.then((response) => response.json())
			.then((data) => {
				let historyHTML = '<div class="history-page">';
				if (data.length) {
					data.forEach((record) => {
						historyHTML += `
                        <div class="history-card" id="history-card-${
													record.id
												}">
                            <div class="delete-icon"></div>
                            <div class="history-info">Name: ${
															record.first_name
														} ${record.last_name}</div>
                            <div class="history-info">Organization: ${
															record.organization
														}</div>
                            <div class="history-info">Check-in: ${
															record.check_in_time || ''
														}</div>
                            <div class="history-info">Check-out: ${
															record.check_out_time || ''
														}</div>
                            <div class="history-info">Lecture: ${
															record.lecture_name
														}</div>
                        </div>
                    `;
					});
				} else {
					historyHTML +=
						'<div class="no-history"><div class="no-history-text">No attendance records available.</div></div>';
				}
				historyHTML += '</div>';
				document.querySelector('.history-page').innerHTML = historyHTML;
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
				const reader = new FileReader();

				reader.onload = function (e) {
					const imgElement = document.getElementById('triggerCamera');
					imgElement.src = e.target.result;
					imgElement.classList.add('scanned-img'); // Add the class to adjust size
				};

				reader.readAsDataURL(selectedFile); // Reads the file as a Data URL and triggers onload
			}
		});

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
						clearForm(); // Clear form after submission
						updateLastEntry(); // Update the last entry display immediately after recording the attendance
					}
				})
				.catch((error) => {
					console.error('Error:', error);
					clearForm(); // Ensure form is cleared even on error
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

	function resetCardPosition(card) {
		card.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
		card.querySelector('.delete-icon').style.transition =
			'opacity 0.3s ease-out';
		card.style.transform = 'translateX(0)';
		card.querySelector('.delete-icon').style.opacity = 0;
	}

	function confirmDelete(lectureId, card) {
		if (confirm('Are you sure you want to delete this lecture?')) {
			deleteLecture(lectureId, card);
		} else {
			resetCardPosition(card); // Reset card position if user cancels deletion
		}
	}

	function confirmHistoryDelete(historyId, card) {
		if (confirm('Are you sure you want to delete this history?')) {
			deleteHistory(historyId, card);
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
			.catch((error) => console.error('Error deleting lecture:', error));
	}

	function deleteHistory(historyId, card) {
		fetch(`/delete-history/${historyId}`, {
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
			.catch((error) => console.error('Error deleting history:', error));
	}
});

function initializeScanFunctionality() {
	const cameraInput = document.getElementById('cameraInput');
	const triggerCamera = document.getElementById('triggerCamera');

	triggerCamera.addEventListener('click', function (event) {
		event.preventDefault();
		cameraInput.click(); // Trigger file input
	});

	cameraInput.addEventListener('change', function (event) {
		if (event.target.files.length > 0) {
			selectedFile = event.target.files[0];
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

		if (!selectedFile) {
			alert('Please select an image to scan.');
			return;
		}

		const attendanceRadio = document.querySelector(
			'input[name="attendance"]:checked'
		);
		if (!attendanceRadio) {
			alert('Please select either check-in or check-out.');
			return;
		}

		const lectureDropdown = document.getElementById('lecture-dropdown');
		if (lectureDropdown.selectedIndex === 0) {
			alert('Please select a lecture.');
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
					alert('Attendance recorded successfully!');
					document.getElementById('triggerCamera').src =
						'/static/qr-border.png'; // Reset the camera icon
					clearForm(); // Clear form after submission
					updateLastEntry();
				}
			})
			.catch((error) => {
				console.error('Error:', error);
				clearForm(); // Ensure form is cleared even on error
				updateLastEntry();
			});
	});
}

function updateLastEntry() {
	fetch('/latest-history')
		.then((response) => response.json())
		.then((data) => {
			const lastEntryDiv = document.querySelector('.last-entry');
			if (Object.keys(data).length !== 0) {
				lastEntryDiv.innerHTML = `
                    <div>
                        <div class="history-info">Name: ${data.first_name} ${
					data.last_name
				}</div>
                        <div class="history-info">Organization: ${
													data.organization
												}</div>
                        <div class="history-info">Check-in: ${
													data.check_in_time || ''
												}</div>
                        <div class="history-info">Check-out: ${
													data.check_out_time || ''
												}</div>
                        <div class="history-info">Lecture: ${
													data.lecture_name
												}</div>
                    </div>
                `;
			} else {
				lastEntryDiv.innerHTML =
					'<div class="no-history-text">No entries found.</div>';
			}
		})
		.catch((error) => {
			console.error('Error fetching the latest history entry:', error);
			document.querySelector('.last-entry').innerHTML =
				'<div class="no-history-text">Error loading entry.</div>';
		});
}

document.addEventListener('DOMContentLoaded', function () {
	updateLastEntry(); // Update last entry when the page is loaded
});

function clearForm() {
	document.getElementById('cameraInput').value = '';
	document.getElementById('lecture-dropdown').selectedIndex = 0;
	selectedFile = null;

	// Reset the image source to the qr-border.png
	const imgElement = document.getElementById('triggerCamera');
	imgElement.src = '/static/qr-border.png'; // Make sure the path is correct
	imgElement.classList.remove('scanned-img'); // If you add a class that changes the display on scan
}
