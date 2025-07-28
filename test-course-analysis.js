import fetch from 'node-fetch';

const SUPABASE_URL = 'https://okvdirskoukqnjzqsowb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rdmRpcnNrb3VrcW5qenFzb3diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1ODQxNjQsImV4cCI6MjA2NjE2MDE2NH0.k2q9Zb0mT53xrZIH5v5MN_to6knZIrjfhRWI-HDyZQo';

async function testCourseAnalysis() {
    console.log('🎯 Testing Course Analysis (Fixed)...\n');
    
    try {
        const url = `${SUPABASE_URL}/functions/v1/adk-agents`;
        const payload = {
            agent_type: 'orchestrator',
            task: 'comprehensive_course_analysis',
            payload: {
                course: {
                    title: 'Introduction to Machine Learning',
                    category: 'Computer Science',
                    difficulty: 'intermediate'
                },
                memories: []
            }
        };
        
        console.log('📤 Request URL:', url);
        console.log('📤 Agent Type:', payload.agent_type);
        console.log('📤 Task:', payload.task);
        console.log('📤 Course:', payload.payload.course.title);
        console.log('📤 Starting request...\n');
        
        const startTime = Date.now();
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify(payload)
        });
        
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        
        console.log(`📥 Response received in ${duration}s`);
        console.log('📥 Response status:', response.status);
        
        const responseText = await response.text();
        console.log('📥 Response length:', responseText.length, 'characters');
        
        if (response.ok) {
            try {
                const data = JSON.parse(responseText);
                console.log('\n✅ Course Analysis Success!');
                console.log('📊 Response structure:');
                console.log('  - Success:', data.success);
                console.log('  - Request ID:', data.request_id);
                console.log('  - Processing Time:', data.metadata?.processingTime || 'N/A');
                
                if (data.data) {
                    console.log('\n📋 Analysis Content:');
                    console.log('  - Course Analysis:', !!data.data.course_analysis);
                    console.log('  - Memory Connections:', data.data.memory_connections?.length || 0);
                    console.log('  - Career Pathways:', !!data.data.career_pathways);
                    console.log('  - Learning Profile:', !!data.data.learning_profile);
                }
                
            } catch (parseError) {
                console.log('❌ JSON parse error:', parseError.message);
                console.log('📝 Raw response preview:', responseText.substring(0, 500) + '...');
            }
        } else {
            console.log('❌ Course Analysis Failed');
            console.log('📝 Error response:', responseText);
        }
        
    } catch (error) {
        console.log('❌ Request failed:', error.message);
    }
}

// Run the test
testCourseAnalysis().catch(console.error);
