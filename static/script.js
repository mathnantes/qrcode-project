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
				// Check and format check-in time if valid
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

				// Check and format check-out time if valid
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
			lectures.sort((a, b) => a.name.localeCompare(b.name)); // Sort lectures alphabetically

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
                    <td>${lecture.name}</td>
                    <td>${lecture.lecturer}</td>
                    <td>${new Date(lecture.start_time).toLocaleString(
											'pt-BR'
										)}</td>
                    <td>${new Date(lecture.end_time).toLocaleString(
											'pt-BR'
										)}</td>
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
	const endTime = document.getElementById('endTime').value;

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
