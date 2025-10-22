#!/bin/bash

echo "🚀 Impakter Database Quick Setup"
echo "================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo ""
    echo "Please create a .env file with your database connection:"
    echo ""
    echo "DATABASE_URL=\"postgresql://username:password@localhost:5432/impakter_db?schema=public\""
    echo "NEXTAUTH_URL=\"http://localhost:3000\""
    echo "NEXTAUTH_SECRET=\"generate-a-random-32-char-secret-key\""
    echo "NODE_ENV=\"development\""
    echo ""
    echo "See DATABASE_SETUP_GUIDE.md for detailed instructions"
    exit 1
else
    echo "✅ .env file found"
fi

# Check if DATABASE_URL is set
if ! grep -q "DATABASE_URL" .env; then
    echo "❌ DATABASE_URL not found in .env file"
    exit 1
else
    echo "✅ DATABASE_URL is configured"
fi

echo ""
echo "📊 Checking database connection..."
node check-database.js

echo ""
echo "Would you like to create the test user org@test.com? (y/n)"
read -r response

if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo ""
    echo "Creating test user..."
    node add-test-user.js
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Run: npm run dev"
echo "2. Visit: http://localhost:3000/signin"
echo "3. Login with: org@test.com / password123"

