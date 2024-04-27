document.getElementById('cameraInput').onchange = function (event) {
	const files = event.target.files;
	if (files.length > 0) {
		const img = document.getElementById('photo');
		img.onload = () => decodeQRCode(img);
		img.src = URL.createObjectURL(files[0]);
	}
};

function decodeQRCode(image) {
	const canvas = document.createElement('canvas');
	const context = canvas.getContext('2d');
	// Adjust canvas size to the natural size of the image to capture all details
	canvas.width = image.naturalWidth;
	canvas.height = image.naturalHeight;
	context.drawImage(image, 0, 0, canvas.width, canvas.height);
	const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
	const code = jsQR(imageData.data, imageData.width, imageData.height, {
		inversionAttempts: 'dontInvert',
	});

	if (code) {
		document.getElementById('qrContent').textContent =
			'QR Code Data: ' + code.data;
	} else {
		document.getElementById('qrContent').textContent = 'QR Code Data: None';
		console.log('No QR code detected');
	}
}
