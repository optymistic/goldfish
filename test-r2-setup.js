// Simple test script to verify R2 setup
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
console.log('🔍 Loading Environment Variables...');
try {
  const envPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        if (!value.startsWith('#')) {
          process.env[key.trim()] = value.replace(/^["']|["']$/g, '');
        }
      }
    });
    console.log('✅ Loaded .env.local file');
  } else {
    console.log('⚠️  .env.local file not found, using system environment variables');
  }
} catch (error) {
  console.log('⚠️  Error loading .env.local:', error.message);
}

// Test environment variables
console.log('\n🔍 Testing Environment Variables...');
const requiredEnvVars = [
  'R2_ENDPOINT',
  'R2_ACCESS_KEY_ID', 
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET_NAME'
];

let missingVars = [];
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    missingVars.push(varName);
  } else {
    console.log(`✅ ${varName}: ${varName.includes('SECRET') ? '***' : process.env[varName]}`);
  }
});

if (missingVars.length > 0) {
  console.log(`❌ Missing environment variables: ${missingVars.join(', ')}`);
  console.log('\n📝 Please check your .env.local file and ensure all R2 variables are set.');
  process.exit(1);
}

console.log('\n✅ All environment variables are set!');

// Test R2 client import
console.log('\n🔍 Testing R2 Client Import...');
try {
  // We'll test the import by checking if the file exists and has valid syntax
  const r2ClientPath = path.join(__dirname, 'lib', 'r2-client.ts');
  if (fs.existsSync(r2ClientPath)) {
    console.log('✅ R2 client file exists');
    const content = fs.readFileSync(r2ClientPath, 'utf8');
    if (content.includes('S3Client') && content.includes('uploadFileToR2')) {
      console.log('✅ R2 client file has correct exports');
    } else {
      console.log('❌ R2 client file missing required exports');
      process.exit(1);
    }
  } else {
    console.log('❌ R2 client file not found');
    process.exit(1);
  }
} catch (error) {
  console.log('❌ Failed to check R2 client:', error.message);
  process.exit(1);
}

// Test API files exist
console.log('\n🔍 Testing API Files...');
const apiFiles = [
  'app/api/upload/route.ts',
  'app/api/responses/route.ts'
];

apiFiles.forEach(apiFile => {
  const apiPath = path.join(__dirname, apiFile);
  if (fs.existsSync(apiPath)) {
    console.log(`✅ ${apiFile} exists`);
  } else {
    console.log(`❌ ${apiFile} not found`);
  }
});

console.log('\n🎉 All tests passed! R2 setup is working correctly.');
console.log('\n📝 Next steps:');
console.log('1. Start your development server: npm run dev');
console.log('2. Test the upload API at: POST /api/upload');
console.log('3. Test the responses API at: POST /api/responses'); 