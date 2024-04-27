window.addEventListener('load', function () {
	fetchLectures();
	fetchHistory();
});

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
				const checkInTime = isValidDate(record.check_in_time)
					? new Date(record.check_in_time).toLocaleString()
					: '';
				const checkOutTime = isValidDate(record.check_out_time)
					? new Date(record.check_out_time).toLocaleString()
					: '';
				const row = tableBody.insertRow();
				row.innerHTML = `
                    <td>${record.first_name} ${record.last_name}</td>
                    <td>${record.organization}</td>
                    <td>${record.lecture_name}</td>  <!-- Updated to use lecture_name -->
                    <td>${checkInTime}</td>
                    <td>${checkOutTime}</td>
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
			const lectureSelector = document.getElementById('lectureSelector');
			const lectureFilter = document.getElementById('lectureFilter');

			// Clear existing options before adding new ones
			lectureSelector.innerHTML = '';
			lectureFilter.innerHTML = '<option value="">All Lectures</option>'; // Keep the "All Lectures" option

			lectures.forEach((lecture) => {
				const option = new Option(lecture.name, lecture.id);
				lectureSelector.add(option);
				lectureFilter.add(option.cloneNode(true)); // Also populate filter dropdown
			});
		})
		.catch((error) => console.error('Error loading lectures:', error));
}

function registerLecture() {
	const lectureName = document.getElementById('newLectureName').value;
	fetch('/register_lecture', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ name: lectureName }),
	})
		.then((response) => response.json())
		.then((data) => {
			alert('Lecture registered: ' + data.name);
			fetchLectures(); // Refresh lecture list
			document.getElementById('lectureForm').reset();
		})
		.catch((error) => console.error('Error registering lecture:', error));
}
