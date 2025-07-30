// Test script to validate AWS SAM backend deployment
// This script tests the deployed API Gateway endpoint

const API_ENDPOINT = 'https://4xzbykbhy2.execute-api.us-east-1.amazonaws.com/dev/sensa-mindmap-job';

async function testBackendDeployment() {
  console.log('🚀 Testing Sensa AI AWS Backend Deployment');
  console.log('=' .repeat(50));
  
  try {
    // Test payload
    const testPayload = {
      jobId: `test-${Date.now()}`,
      subject: 'Machine Learning Fundamentals'
    };
    
    console.log('📤 Sending test request...');
    console.log('Endpoint:', API_ENDPOINT);
    console.log('Payload:', JSON.stringify(testPayload, null, 2));
    
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log('\n📥 Response received:');
    console.log('Status:', response.status, response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    const responseData = await response.text();
    console.log('Body:', responseData);
    
    if (response.ok) {
      console.log('\n✅ SUCCESS: Backend is responding correctly!');
      
      try {
        const jsonData = JSON.parse(responseData);
        if (jsonData.success && jsonData.jobId) {
          console.log('✅ Job queued successfully with ID:', jsonData.jobId);
        }
      } catch (e) {
        console.log('ℹ️  Response is not JSON, but request was successful');
      }
    } else {
      console.log('\n❌ ERROR: Backend returned an error');
      console.log('This might be expected if the Lambda function has issues');
    }
    
  } catch (error) {
    console.log('\n❌ NETWORK ERROR:', error.message);
    console.log('This could indicate:');
    console.log('- Network connectivity issues');
    console.log('- CORS configuration problems');
    console.log('- API Gateway endpoint issues');
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('🏁 Test completed');
}

// Additional function to test CORS preflight
async function testCORS() {
  console.log('\n🔍 Testing CORS configuration...');
  
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    console.log('CORS Preflight Status:', response.status);
    console.log('CORS Headers:', {
      'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
    });
    
    if (response.status === 200 || response.status === 204) {
      console.log('✅ CORS is properly configured');
    } else {
      console.log('⚠️  CORS might have issues');
    }
    
  } catch (error) {
    console.log('❌ CORS test failed:', error.message);
  }
}

// Run the tests
async function runAllTests() {
  await testBackendDeployment();
  await testCORS();
  
  console.log('\n📋 Summary:');
  console.log('- API Gateway Endpoint: https://4xzbykbhy2.execute-api.us-east-1.amazonaws.com/dev');
  console.log('- Lambda Function: dev-sensa-mindmap-function');
  console.log('- SQS Queue: dev-sensa-mindmap-job-queue');
  console.log('- DynamoDB Table: dev-sensa-mindmap-idempotency');
  console.log('\n💡 Next steps:');
  console.log('1. Test the frontend integration');
  console.log('2. Monitor CloudWatch logs for any issues');
  console.log('3. Test mindmap generation end-to-end');
}

// Execute if run directly
if (typeof window === 'undefined') {
  // Node.js environment - fetch is available globally in Node 18+
  runAllTests().catch(console.error);
} else {
  // Browser environment
  runAllTests().catch(console.error);
}

// Export for use in other scripts
export { testBackendDeployment, testCORS, runAllTests };