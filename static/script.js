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
				break;
			case 'history-btn':
				contentArea.innerHTML = '<div>History Content will go here</div>';
				break;
			case 'lectures-btn':
				contentArea.innerHTML = `
                    <div class="lectures-page">
                        <form id="lecture-form" class="lecture-form">
                            <h1> Nova Palestra </h1>
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
                    </div>
                `;
				break;
			case 'settings-btn':
				contentArea.innerHTML = '<div>Settings Content will go here</div>';
				break;
		}
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
				// Here you can add the logic to send data to your server
				console.log('Lecture registered!');
				// Implement AJAX call to server here if necessary
			}
		});

	document
		.getElementById('triggerCamera')
		.addEventListener('click', function (event) {
			event.preventDefault(); // Prevent the default action of the click event
			document.getElementById('cameraInput').click();
		});
});
