window.addEventListener('load', function () {
	fetchLectures();
	fetchHistory();
});

function toggleMenu() {
	var menuContent = document.getElementById('menuContent');
	if (menuContent.style.display === 'none') {
		menuContent.style.display = 'block';
	} else {
		menuContent.style.display = 'none';
	}
}

function showSection(sectionId) {
	const sections = document.querySelectorAll('.content');
	sections.forEach((section) => {
		if (section.id === sectionId) {
			section.style.display = 'block';
		} else {
			section.style.display = 'none';
		}
	});
	toggleMenu(); // Close the menu after selection
}

function submitQRCode() {
	const fileInput = document.getElementById('cameraInput');
	const action = document.getElementById('actionSelector').value;
	const lectureId = document.getElementById('lectureSelector').value;

	if (fileInput.files.length > 0) {
		const formData = new FormData();
		formData.append('file', fileInput.files[0]);
		formData.append('action', action);
		formData.append('lecture_id', lectureId);

		fetch('/scan', {
			method: 'POST',
			body: formData,
		})
			.then((response) => response.json())
			.then((data) => {
				console.log('Submission successful:', data);
				document.getElementById('cameraForm').reset();
				fetchHistory(); // Refresh history after submission
			})
			.catch((error) => {
				console.error('Error:', error);
				alert('Failed to submit QR code.');
			});
	} else {
		alert('Please select a file first.');
	}
}

function fetchHistory() {
	const lectureId = document.getElementById('lectureFilter').value;
	fetch(`/history?lecture_id=${lectureId}`)
		.then((response) => response.json())
		.then((data) => {
			const tableBody = document
				.getElementById('historyList')
				.querySelector('tbody');
			tableBody.innerHTML = ''; // Clear previous entries
			data.forEach((record) => {
				const checkInTime = record.check_in_time
					? new Date(record.check_in_time)
					: null;
				const formattedCheckInTime =
					checkInTime && !isNaN(checkInTime.getTime())
						? checkInTime.toLocaleString('pt-BR', {
								year: 'numeric',
								month: '2-digit',
								day: '2-digit',
								hour: '2-digit',
								minute: '2-digit',
								second: '2-digit',
						  })
						: '';

				const checkOutTime = record.check_out_time
					? new Date(record.check_out_time)
					: null;
				const formattedCheckOutTime =
					checkOutTime && !isNaN(checkOutTime.getTime())
						? checkOutTime.toLocaleString('pt-BR', {
								year: 'numeric',
								month: '2-digit',
								day: '2-digit',
								hour: '2-digit',
								minute: '2-digit',
								second: '2-digit',
						  })
						: '';

				const row = tableBody.insertRow();
				row.innerHTML = `
                <td data-label="Name:">${record.first_name} ${record.last_name}</td>
                <td data-label="Organization:">${record.organization}</td>
                <td data-label="Lecture:">${record.lecture_name}</td>
                <td data-label="Check-In Time:">${formattedCheckInTime}</td>
                <td data-label="Check-Out Time:">${formattedCheckOutTime}</td>
            `;
			});
		})
		.catch((error) => console.error('Error loading history:', error));
}

function isValidDate(dateStr) {
	return dateStr && !isNaN(new Date(dateStr).getTime());
}

function fetchLectures() {
	fetch('/lectures')
		.then((response) => response.json())
		.then((lectures) => {
			lectures.sort((a, b) => a.name.localeCompare(b.name));

			const lectureSelector = document.getElementById('lectureSelector');
			const lectureFilter = document.getElementById('lectureFilter');
			const lecturesList = document
				.getElementById('lecturesList')
				.querySelector('tbody');

			lectureSelector.innerHTML = '';
			lectureFilter.innerHTML = '<option value="">All Lectures</option>';
			lecturesList.innerHTML = ''; // Clear existing table rows

			lectures.forEach((lecture) => {
				const option = new Option(lecture.name, lecture.id);
				lectureSelector.add(option);
				lectureFilter.add(option.cloneNode(true));

				const row = lecturesList.insertRow();
				row.innerHTML = `
                <td data-label="Lecture Name:">${lecture.name}</td>
                <td data-label="Lecturer:">${lecture.lecturer}</td>
                <td data-label="Start Time:">${new Date(
									lecture.start_time
								).toLocaleString('pt-BR')}</td>
                <td data-label="End Time:">${new Date(
									lecture.end_time
								).toLocaleString('pt-BR')}</td>
            `;
			});
		})
		.catch((error) => console.error('Error loading lectures:', error));
}

function updateLectureList(lecture) {
	const lectureList = document.getElementById('registeredLectures');
	const entry = document.createElement('div');
	entry.textContent = lecture.name + ' (ID: ' + lecture.id + ')';
	lectureList.appendChild(entry);
}

function registerLecture() {
	const lectureName = document.getElementById('newLectureName').value;
	const lecturerName = document.getElementById('lecturerName').value;
	const startTime = document.getElementById('startTime').value;
	theEndTime = document.getElementById('endTime').value;

	fetch('/register_lecture', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			name: lectureName,
			lecturer: lecturerName,
			start_time: startTime,
			end_time: endTime,
		}),
	})
		.then((response) => response.json())
		.then((data) => {
			if (data.error) {
				alert('Error registering lecture: ' + data.error);
			} else {
				alert('Lecture registered: ' + data.name);
				fetchLectures(); // Refresh lecture list
				document.getElementById('lectureForm').reset();
			}
		})
		.catch((error) => {
			console.error('Error registering lecture:', error);
			alert('Failed to register lecture.');
		});
}

// FROM NEW FRONTEND
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
				contentArea.innerHTML = '<div>Lectures Content will go here</div>';
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
});

document
	.getElementById('triggerCamera')
	.addEventListener('click', function (event) {
		event.preventDefault(); // Prevent the default action of the click event
		document.getElementById('cameraInput').click();
	});
