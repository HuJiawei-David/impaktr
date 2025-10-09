// Clear NextAuth storage script
// Run this in browser console to clear old JWT tokens

console.log('🧹 Clearing NextAuth storage...');

// Clear localStorage
Object.keys(localStorage).forEach(key => {
  if (key.includes('nextauth') || key.includes('next-auth')) {
    console.log(`Removing localStorage: ${key}`);
    localStorage.removeItem(key);
  }
});

// Clear sessionStorage
Object.keys(sessionStorage).forEach(key => {
  if (key.includes('nextauth') || key.includes('next-auth')) {
    console.log(`Removing sessionStorage: ${key}`);
    sessionStorage.removeItem(key);
  }
});

// Clear cookies
document.cookie.split(";").forEach(cookie => {
  const eqPos = cookie.indexOf("=");
  const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
  if (name.includes('nextauth') || name.includes('next-auth')) {
    console.log(`Removing cookie: ${name}`);
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
  }
});

console.log('✅ NextAuth storage cleared! Please refresh the page.');
console.log('💡 If you still see JWT errors, try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)');



