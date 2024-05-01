document.addEventListener('DOMContentLoaded', function () {
	const buttons = document.querySelectorAll('.nav-button');
	const contentArea = document.getElementById('content-area');
	const defaultContentHTML = contentArea.innerHTML; // Keep the default content
	let isFirstLoad = true; // Flag to check if it's the first load

	// Function to update content based on button id
	function updateContentArea(buttonId) {
		switch (buttonId) {
			case 'home-btn':
				contentArea.innerHTML = defaultContentHTML;
				populateLectureDropdown();
				break;
			case 'history-btn':
				contentArea.innerHTML = '<div>History Content will go here</div>';
				break;
			case 'lectures-btn':
				fetchLectures();
				break;
			case 'settings-btn':
				contentArea.innerHTML = '<div>Settings Content will go here</div>';
				break;
		}
	}

	// Fetch lectures from server and update content area
	function fetchLectures() {
		fetch('/lectures')
			.then((response) => response.json())
			.then((data) => {
				let lecturesHTML = '<div class="lectures-page">';
				if (data.length) {
					lecturesHTML += data
						.map(
							(lecture) => `
                            <div class="lecture-card">
                                <div class="lecture-info">Name: ${lecture.name}</div>
                                <div class="lecture-info">Lecturer: ${lecture.lecturer}</div>
                                <div class="lecture-info">Start Time: ${lecture.start_time}</div>
                                <div class="lecture-info">End Time: ${lecture.end_time}</div>
                            </div>
                        `
						)
						.join('');
				} else {
					lecturesHTML += `
                    <div class="no-lectures">
                        <div class="no-lectures-text">No lectures available.</div>
                    </div>
                `;
				}
				lecturesHTML += '</div>'; // Close lectures-page div
				lecturesHTML += `
                <div class="add-lecture-btn" onclick="toggleLectureForm()">
                    <img src="/static/add.png" alt="Add" style="width:50px; height:50px;">
                </div>
            `;
				lecturesHTML += `
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

				contentArea.innerHTML = lecturesHTML;
			})
			.catch((error) => console.error('Error loading lectures:', error));
	}

	// Populate lectures dropdown
	function populateLectureDropdown() {
		fetch('/lectures')
			.then((response) => response.json())
			.then((lectures) => {
				const dropdown = document.getElementById('lecture-dropdown');
				dropdown.innerHTML =
					'<option disabled selected>Select Lecture</option>'; // Reset dropdown
				lectures.forEach((lecture) => {
					const option = document.createElement('option');
					option.value = lecture.id;
					option.textContent = lecture.name;
					dropdown.appendChild(option);
				});
			})
			.catch((error) => console.error('Failed to load lectures:', error));
	}

	// Initialize page without transitions
	updateContentArea('home-btn'); // Directly set initial content without transition
	document.querySelector('#home-btn').classList.add('selected');
	isFirstLoad = false; // Ensure transitions are allowed for subsequent clicks

	buttons.forEach((button) => {
		button.addEventListener('click', function () {
			// Remove selected class from all buttons and add to the clicked one
			buttons.forEach((btn) => btn.classList.remove('selected'));
			this.classList.add('selected');

			// Add transition effects
			contentArea.classList.add('fade-out');
			setTimeout(() => {
				updateContentArea(this.id);
				contentArea.classList.remove('fade-out');
				contentArea.classList.add('fade-in');
				setTimeout(() => {
					contentArea.classList.remove('fade-in');
				}, 500); // Ensure fade-in class is removed after animation
			}, 500); // Wait for fade out to complete before updating content
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
						console.log(data.message); // You can show this message in the UI
						fetchLectures(); // Refresh the list of lectures
						toggleLectureForm(); // Hide the form after registration
					})
					.catch((error) => console.error('Error registering lecture:', error));
			}
		});

	document
		.getElementById('triggerCamera')
		.addEventListener('click', function (event) {
			event.preventDefault(); // Prevent the default action of the click event
			document.getElementById('cameraInput').click();
		});
});

// Function to toggle lecture form visibility
function toggleLectureForm() {
	const form = document.querySelector('.lecture-form');
	const addButton = document.querySelector('.add-lecture-btn img');
	if (form.style.display === 'none' || !form.style.display) {
		form.style.display = 'block';
		addButton.style.opacity = '0.5';
		setTimeout(() => {
			form.style.opacity = '1';
			form.style.transform = 'translate(-50%, -50%) scale(1)';
		}, 10); // Small delay to allow CSS to apply display block before transforming
	} else {
		form.style.transform = 'translate(-50%, -50%) scale(0.1)';
		form.style.opacity = '0';
		setTimeout(() => {
			form.style.display = 'none';
			addButton.style.opacity = '1';
		}, 500); // Match timeout to transition time
	}
}
