function openCamera() {
	const cameraInput = document.getElementById('cameraInput');
	cameraInput.click(); // Simulate click on the file input

	cameraInput.onchange = function () {
		if (this.files && this.files[0]) {
			const formData = new FormData();
			formData.append('file', this.files[0]);

			fetch('/upload', {
				method: 'POST',
				body: formData,
			})
				.then((response) => response.json())
				.then((data) => {
					if (data.image) {
						const imageElement = document.getElementById('processedImage');
						imageElement.src = 'data:image/jpeg;base64,' + data.image;
						imageElement.style.display = 'block';
					}
					if (data.decoded_data.error) {
						alert('Error processing vCard: ' + data.decoded_data.error);
					} else {
						document.getElementById('name').textContent =
							data.decoded_data.FirstName;
						document.getElementById('phone').textContent =
							data.decoded_data.LastName;
						document.getElementById('organization').textContent =
							data.decoded_data.Organization;
					}
				})
				.catch((error) => console.error('Error:', error));
		}
	};
}
