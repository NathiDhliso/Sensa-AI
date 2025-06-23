const testMindMapGeneration = async () => {
  const url = 'https://okvdirskoukqnjzqsowb.supabase.co/functions/v1/adk-agents';
  
  const payload = {
    task: 'generate_ai_mind_map',
    agent_type: 'orchestrator',
    subject: 'Machine Learning',
    content: 'Machine Learning fundamentals and applications',
    memories: [],
    payload: {}
  };

  try {
    console.log('🧪 Testing ADK agents mind map generation...');
    console.log('📤 Payload:', JSON.stringify(payload, null, 2));
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rdmRpcnNrb3VrcW5qenFzb3diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ3NTY1NjUsImV4cCI6MjA1MDMzMjU2NX0.U69n_cCKBZ_F-sKaRU67TacCpxEqvHzMBTDhsJhBYCw',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response ok:', response.ok);
    
    const responseText = await response.text();
    console.log('📄 Response body:', responseText);
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('✅ Success:', data);
    } else {
      console.log('❌ Error response:', responseText);
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error);
  }
};

testMindMapGeneration(); 