const CACHE_NAME = 'presenca-cache-v1';
const urlsToCache = [
	'/',
	'/static/css/styles.css',
	'/static/js/script.js',
	'/static/images/qr-border.png',
	'/static/images/home-icon.png',
	'/static/images/history-icon.png',
	'/static/images/lectures-icon.png',
	'/static/images/settings-icon.png',
	'/static/images/icon-192x192.png',
	'/static/images/icon-512x512.png',
];

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			console.log('Opened cache');
			return cache.addAll(urlsToCache);
		})
	);
});

self.addEventListener('fetch', (event) => {
	event.respondWith(
		caches.match(event.request).then((response) => {
			if (response) {
				return response;
			}
			return fetch(event.request);
		})
	);
});
