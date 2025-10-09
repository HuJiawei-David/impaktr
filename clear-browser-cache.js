// Comprehensive browser cache clearing script
// Run this in browser DevTools console to clear all cached assets

console.log('🧹 Clearing all browser cache and Next.js assets...');

// Clear localStorage
Object.keys(localStorage).forEach(key => {
  if (key.includes('next') || key.includes('auth') || key.includes('cache')) {
    console.log(`Removing localStorage: ${key}`);
    localStorage.removeItem(key);
  }
});

// Clear sessionStorage
Object.keys(sessionStorage).forEach(key => {
  if (key.includes('next') || key.includes('auth') || key.includes('cache')) {
    console.log(`Removing sessionStorage: ${key}`);
    sessionStorage.removeItem(key);
  }
});

// Clear all cookies
document.cookie.split(";").forEach(cookie => {
  const eqPos = cookie.indexOf("=");
  const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
  if (name.includes('next') || name.includes('auth') || name.includes('cache')) {
    console.log(`Removing cookie: ${name}`);
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
  }
});

// Clear service worker cache if available
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      console.log('Unregistering service worker:', registration.scope);
      registration.unregister();
    });
  });
}

// Clear cache storage if available
if ('caches' in window) {
  caches.keys().then(cacheNames => {
    cacheNames.forEach(cacheName => {
      console.log('Deleting cache:', cacheName);
      caches.delete(cacheName);
    });
  });
}

console.log('✅ Browser cache cleared!');
console.log('💡 Now do a hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)');
console.log('🌐 Make sure you\'re accessing: http://localhost:3001');
