// Test Local Signup
const testLocalSignup = async () => {
  console.log('🧪 Testing Local Signup API...\n');
  
  const testData = {
    name: 'Test NGO Organization',
    email: `test${Date.now()}@testngo.com`,
    password: 'testpassword123',
    userType: 'NGO'
  };
  
  console.log('📤 Sending signup request...');
  console.log('Email:', testData.email);
  console.log('Name:', testData.name);
  console.log('Type:', testData.userType);
  console.log('');
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });
    
    const data = await response.json();
    
    console.log('📥 Response Status:', response.status);
    console.log('📥 Response:', JSON.stringify(data, null, 2));
    console.log('');
    
    if (response.ok) {
      console.log('✅ SUCCESS! Signup API is working!');
      console.log('');
      console.log('Next steps:');
      console.log('1. Open: http://localhost:3000/signup?type=ngo');
      console.log('2. Fill in the form');
      console.log('3. Click "Create Account"');
      console.log('4. You should be redirected to profile setup');
    } else {
      console.log('❌ ERROR! Signup failed.');
      console.log('Error message:', data.message);
      console.log('');
      console.log('Troubleshooting:');
      console.log('- Check if dev server is running (npm run dev)');
      console.log('- Check database connection');
      console.log('- Look at terminal logs for errors');
    }
  } catch (error) {
    console.log('❌ NETWORK ERROR!');
    console.log('Error:', error.message);
    console.log('');
    console.log('Make sure:');
    console.log('1. Dev server is running: npm run dev');
    console.log('2. Server is on http://localhost:3000');
  }
};

// Run the test
testLocalSignup();


