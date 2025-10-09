# Multi-Port Development Setup

## For Team Members Using Port 3000 (Default)

```bash
# Use the default port 3000
npm run dev:user

# Or explicitly set port 3000
PORT=3000 npm run dev:user
```

## For Team Members Using Port 3001

```bash
# Set port 3001
PORT=3001 npm run dev:user
```

## Fixing NextAuth JWT Errors

If you see JWT decryption errors, it's likely due to old tokens in your browser. Here's how to fix:

### Option 1: Clear Browser Storage (Recommended)

1. Open browser DevTools (F12)
2. Go to Console tab
3. Copy and paste the contents of `clear-auth-storage.js`
4. Press Enter
5. Refresh the page (Ctrl+Shift+R for hard refresh)

### Option 2: Manual Browser Cleanup

1. Open DevTools (F12)
2. Go to Application tab
3. Under Storage, clear:
   - Local Storage (any nextauth entries)
   - Session Storage (any nextauth entries)
   - Cookies (any nextauth entries)
4. Refresh the page

### Option 3: Incognito/Private Window

Open the app in a private/incognito window to test with clean storage.

## Environment Variables

The app automatically detects the port and configures NextAuth accordingly:

- **NEXTAUTH_URL**: Dynamically set based on PORT environment variable
- **NEXTAUTH_SECRET**: Shared secret for JWT encryption/decryption
- **Database and other services**: Shared across all ports

## Troubleshooting

If you still see JWT errors:

1. Ensure you're using the latest `.env.local` file
2. Clear browser storage completely
3. Restart your development server
4. Try a hard refresh (Ctrl+Shift+R)

## Port Usage

- **Port 3000**: Default for most team members
- **Port 3001**: Alternative port (e.g., when 3000 is busy)
- Both ports share the same database and authentication system



