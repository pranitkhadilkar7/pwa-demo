var defferedPromt

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing Service Worker', event)
})

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating Service Worker', event)
  return self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  console.log('[Service Worker] Fetching something ....', event)
})

self.addEventListener('beforeinstallprompt', (event) => {
  console.log('beforeinstallprompt fired')
  event.preventDefault()
  defferedPromt = event
  return false
})