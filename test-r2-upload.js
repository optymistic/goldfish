// Test R2 upload functionality
require('dotenv').config({ path: '.env.local' });

const { r2Client, generateUniqueFilename } = require('./lib/r2-client.ts');
const { PutObjectCommand } = require('@aws-sdk/client-s3');

async function testR2Upload() {
  console.log('🔍 Testing R2 Configuration...');
  
  // Check environment variables
  console.log('R2_ENDPOINT:', process.env.R2_ENDPOINT);
  console.log('R2_BUCKET_NAME:', process.env.R2_BUCKET_NAME);
  console.log('R2_ACCESS_KEY_ID:', process.env.R2_ACCESS_KEY_ID ? '***' : 'MISSING');
  console.log('R2_SECRET_ACCESS_KEY:', process.env.R2_SECRET_ACCESS_KEY ? '***' : 'MISSING');
  
  // Test bucket access
  try {
    console.log('\n🔍 Testing bucket access...');
    const testContent = 'Hello R2!';
    const testFilename = generateUniqueFilename('test.txt');
    
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: testFilename,
      Body: testContent,
      ContentType: 'text/plain',
    });
    
    console.log('Attempting upload...');
    const result = await r2Client.send(command);
    console.log('✅ Upload successful!');
    console.log('Result:', result);
    
    // Try to construct public URL
    const accountId = process.env.R2_ENDPOINT.match(/([a-f0-9]{32})/)?.[1];
    const publicUrl = `https://${accountId}.r2.cloudflarestorage.com/${process.env.R2_BUCKET_NAME}/${testFilename}`;
    console.log('Public URL:', publicUrl);
    
  } catch (error) {
    console.log('❌ Upload failed:', error.message);
    console.log('Error details:', error);
    
    if (error.Code === 'AccessDenied') {
      console.log('\n💡 Possible solutions:');
      console.log('1. Check if your R2 bucket is set to "Public"');
      console.log('2. Verify your API token has Object Read/Write permissions');
      console.log('3. Make sure the bucket name is correct');
    }
  }
}

testR2Upload().catch(console.error); 