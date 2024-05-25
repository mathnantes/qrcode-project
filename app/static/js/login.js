export function initializeLogin() {
	const loginForm = document.getElementById('login-form');
	const loginError = document.getElementById('login-error');
	const validUsers = {
		user: '000000',
		admin: '696969',
	};

	loginForm.addEventListener('submit', function (event) {
		event.preventDefault();
		const username = document.getElementById('username').value;
		const password = document.getElementById('password').value;

		if (validUsers[username] && validUsers[username] === password) {
			localStorage.setItem('loggedIn', 'true');
			document.getElementById('login-container').style.display = 'none';
			document.getElementById('main-content').style.display = 'block';
		} else {
			loginError.style.display = 'block';
		}
	});

	checkLogin();
}

export function checkLogin() {
	if (localStorage.getItem('loggedIn') === 'true') {
		document.getElementById('login-container').style.display = 'none';
		document.getElementById('main-content').style.display = 'block';
	} else {
		document.getElementById('login-container').style.display = 'block';
	}
}
