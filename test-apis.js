import fetch from 'node-fetch';

const GOOGLE_API_KEY = 'AIzaSyDbHwWzoMKaaN9Z6WZdv-tF3tChRb5nF1I';
const SUPABASE_URL = 'https://okvdirskoukqnjzqsowb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rdmRpcnNrb3VrcW5qenFzb3diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1ODQxNjQsImV4cCI6MjA2NjE2MDE2NH0.k2q9Zb0mT53xrZIH5v5MN_to6knZIrjfhRWI-HDyZQo';

async function testGeminiAPI() {
    console.log('🔬 Testing Gemini API directly...');

    // Try different model names that might work (using correct API version)
    const modelsToTry = [
        'gemini-1.5-pro-latest',
        'gemini-1.5-pro',
        'gemini-1.5-flash-latest',
        'gemini-1.5-flash',
        'gemini-pro'
    ];

    for (const model of modelsToTry) {
        console.log(`\n🔍 Trying model: ${model}`);

        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GOOGLE_API_KEY}`;
            const payload = {
                contents: [{ parts: [{ text: 'Hello, can you respond with just "API working"?' }] }],
                generationConfig: { temperature: 0.1 }
            };
        
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            console.log('📥 Response status:', response.status);

            const responseText = await response.text();

            if (response.ok) {
                try {
                    const data = JSON.parse(responseText);
                    console.log('✅ Gemini API Success with model:', model);
                    console.log('📝 Response:', data.candidates?.[0]?.content?.parts?.[0]?.text || 'No text found');
                    return; // Success, exit the function
                } catch (parseError) {
                    console.log('❌ JSON parse error:', parseError.message);
                }
            } else {
                console.log('❌ Model failed:', response.status, responseText.substring(0, 200));
            }

        } catch (error) {
            console.log('❌ Model request failed:', error.message);
        }
    }

    console.log('❌ All Gemini models failed!');
}

async function testSupabaseHealthCheck() {
    console.log('\n🏥 Testing Supabase Function Health Check...');

    try {
        const url = `${SUPABASE_URL}/functions/v1/adk-agents`;
        const payload = {
            agent_type: 'orchestrator',
            payload: {
                action: 'health_check'
            }
        };

        console.log('📤 Request URL:', url);
        console.log('📤 Request payload:', JSON.stringify(payload, null, 2));

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify(payload)
        });

        console.log('📥 Response status:', response.status);

        const responseText = await response.text();
        console.log('📥 Raw response:', responseText);

        if (response.ok) {
            try {
                const data = JSON.parse(responseText);
                console.log('✅ Supabase Health Check Success!');
                console.log('📝 Response data:', JSON.stringify(data, null, 2));
            } catch (parseError) {
                console.log('❌ JSON parse error:', parseError.message);
            }
        } else {
            console.log('❌ Supabase Health Check Error:', response.status, responseText);
        }

    } catch (error) {
        console.log('❌ Supabase Health Check Request failed:', error.message);
    }
}

async function testSupabaseFunction() {
    console.log('\n🚀 Testing Supabase Function...');

    try {
        const url = `${SUPABASE_URL}/functions/v1/adk-agents`;
        const payload = {
            agent_type: 'orchestrator',
            task: 'epistemic_driver_generation',
            payload: {
                subject: 'Test Subject',
                objectives: 'Hello, can you respond with just "API working"?'
            }
        };
        
        console.log('📤 Request URL:', url);
        console.log('📤 Request payload:', JSON.stringify(payload, null, 2));
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify(payload)
        });
        
        console.log('📥 Response status:', response.status);
        console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));
        
        const responseText = await response.text();
        console.log('📥 Raw response:', responseText);
        
        if (response.ok) {
            try {
                const data = JSON.parse(responseText);
                console.log('✅ Supabase Function Success!');
                console.log('📝 Response data:', JSON.stringify(data, null, 2));
            } catch (parseError) {
                console.log('❌ JSON parse error:', parseError.message);
            }
        } else {
            console.log('❌ Supabase Function Error:', response.status, responseText);
        }
        
    } catch (error) {
        console.log('❌ Supabase Function Request failed:', error.message);
    }
}

async function testModelsAPI() {
    console.log('\n📋 Testing Models API...');
    
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${GOOGLE_API_KEY}`;
        
        console.log('📤 Request URL:', url);
        
        const response = await fetch(url);
        
        console.log('📥 Response status:', response.status);
        
        const responseText = await response.text();
        console.log('📥 Raw response length:', responseText.length);
        
        if (response.ok) {
            try {
                const data = JSON.parse(responseText);
                console.log('✅ Models API Success!');
                console.log('📝 Available models:', data.models?.length || 0);
                if (data.models) {
                    data.models.slice(0, 3).forEach(model => {
                        console.log(`  - ${model.name}`);
                    });
                }
            } catch (parseError) {
                console.log('❌ JSON parse error:', parseError.message);
            }
        } else {
            console.log('❌ Models API Error:', response.status, responseText);
        }
        
    } catch (error) {
        console.log('❌ Models API Request failed:', error.message);
    }
}

// Run all tests
async function runAllTests() {
    console.log('🧪 Starting API Tests...\n');

    await testGeminiAPI();
    await testSupabaseHealthCheck();
    await testSupabaseFunction();
    await testModelsAPI();

    console.log('\n✅ All tests completed!');
}

runAllTests().catch(console.error);
