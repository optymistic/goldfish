// Simple R2 test
const fs = require('fs');
const path = require('path');

// Load environment variables
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
}

console.log('🔍 R2 Configuration Test');
console.log('R2_ENDPOINT:', process.env.R2_ENDPOINT);
console.log('R2_BUCKET_NAME:', process.env.R2_BUCKET_NAME);
console.log('R2_ACCESS_KEY_ID:', process.env.R2_ACCESS_KEY_ID ? '***' : 'MISSING');
console.log('R2_SECRET_ACCESS_KEY:', process.env.R2_SECRET_ACCESS_KEY ? '***' : 'MISSING');

// Check if account ID can be extracted
const accountId = process.env.R2_ENDPOINT?.match(/([a-f0-9]{32})/)?.[1];
console.log('Account ID extracted:', accountId);

if (!accountId) {
  console.log('❌ Could not extract account ID from endpoint');
  console.log('💡 Make sure your R2_ENDPOINT is in the format: https://[account-id].r2.cloudflarestorage.com');
}

console.log('\n💡 To fix upload issues:');
console.log('1. Go to your Cloudflare R2 dashboard');
console.log('2. Make sure your bucket is set to "Public"');
console.log('3. Check that your API token has Object Read/Write permissions');
console.log('4. Verify the bucket name matches exactly'); 