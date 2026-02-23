/*
  Everloft service worker.
  Lightweight lifecycle + fetch listener for installability support.
*/

self.addEventListener('install', function() {
	self.skipWaiting();
});

self.addEventListener('activate', function(event) {
	event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function() {
	// Keep fetch listener present for installability checks.
});
