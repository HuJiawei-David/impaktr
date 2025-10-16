// Clear session cookies script
// Run this in your browser console to clear NextAuth session

console.log('Clearing NextAuth session cookies...');

// Clear all cookies for localhost
document.cookie.split(";").forEach((c) => {
  document.cookie = c
    .replace(/^ +/, "")
    .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});

// Clear localStorage
localStorage.clear();

// Clear sessionStorage
sessionStorage.clear();

console.log('✓ Session cleared! Please refresh the page and log in again.');


