import fetch from 'node-fetch';

const GOOGLE_API_KEY = 'AIzaSyDbHwWzoMKaaN9Z6WZdv-tF3tChRb5nF1I';

async function testAPIKeyValidity() {
    console.log('🔑 Testing Google AI API Key validity...');
    
    // Test different endpoints to see which one works
    const endpoints = [
        // New Gemini API endpoints
        'https://generativelanguage.googleapis.com/v1beta/models',
        'https://generativelanguage.googleapis.com/v1/models',
        'https://generativelanguage.googleapis.com/v1beta1/models',
        
        // Try a simple generation request with different API versions
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
        'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent',
    ];
    
    for (const endpoint of endpoints) {
        console.log(`\n🔍 Testing endpoint: ${endpoint}`);
        
        try {
            const url = `${endpoint}?key=${GOOGLE_API_KEY}`;
            
            let response;
            if (endpoint.includes('generateContent')) {
                // POST request for generation
                response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: 'Hello' }] }]
                    })
                });
            } else {
                // GET request for models list
                response = await fetch(url);
            }
            
            console.log(`📥 Status: ${response.status}`);
            
            if (response.status === 200) {
                const responseText = await response.text();
                console.log(`✅ SUCCESS! Endpoint works`);
                console.log(`📝 Response length: ${responseText.length}`);
                
                try {
                    const data = JSON.parse(responseText);
                    if (data.models) {
                        console.log(`📋 Found ${data.models.length} models`);
                        data.models.slice(0, 3).forEach(model => {
                            console.log(`  - ${model.name}`);
                        });
                    } else if (data.candidates) {
                        console.log(`💬 Generation response: ${data.candidates[0]?.content?.parts[0]?.text}`);
                    }
                } catch (e) {
                    console.log(`📝 Raw response: ${responseText.substring(0, 200)}...`);
                }
                
                return endpoint; // Return the working endpoint
            } else if (response.status === 403) {
                console.log(`❌ 403 Forbidden - API key may be invalid or lacks permissions`);
            } else if (response.status === 404) {
                console.log(`❌ 404 Not Found - Endpoint doesn't exist`);
            } else {
                const errorText = await response.text();
                console.log(`❌ ${response.status} - ${errorText.substring(0, 100)}`);
            }
            
        } catch (error) {
            console.log(`❌ Request failed: ${error.message}`);
        }
    }
    
    console.log('\n❌ No working endpoints found!');
    return null;
}

async function testAPIKeyInfo() {
    console.log('\n🔍 Analyzing API Key...');
    
    const apiKey = GOOGLE_API_KEY;
    console.log(`📝 API Key format: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}`);
    console.log(`📏 API Key length: ${apiKey.length}`);
    console.log(`🔤 Starts with: ${apiKey.substring(0, 6)}`);
    
    // Check if it looks like a valid Google API key
    if (apiKey.startsWith('AIza') && apiKey.length === 39) {
        console.log('✅ API Key format looks correct for Google AI');
    } else {
        console.log('❌ API Key format doesn\'t match expected Google AI format');
    }
}

async function runTests() {
    console.log('🧪 Google AI API Key Validation\n');
    
    await testAPIKeyInfo();
    const workingEndpoint = await testAPIKeyValidity();
    
    if (workingEndpoint) {
        console.log(`\n✅ Working endpoint found: ${workingEndpoint}`);
        console.log('💡 You can use this endpoint in your applications');
    } else {
        console.log('\n❌ No working endpoints found');
        console.log('💡 Possible issues:');
        console.log('   - API key is invalid or expired');
        console.log('   - API key lacks necessary permissions');
        console.log('   - Google AI API structure has changed');
        console.log('   - Billing is not set up for the API key');
    }
}

runTests().catch(console.error);
