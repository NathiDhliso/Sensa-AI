import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Serve static files (your HTML file)
app.use(express.static('.'));

// Proxy route for Gemini API
app.post('/api/gemini/*', async (req, res) => {
    try {
        const geminiPath = req.params[0];
        const apiKey = req.query.key;
        
        if (!apiKey) {
            return res.status(400).json({ error: 'API key is required' });
        }
        
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/${geminiPath}?key=${apiKey}`;
        
        console.log('Proxying request to:', geminiUrl);
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        
        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body)
        });

        console.log('Gemini API response status:', response.status);
        console.log('Gemini API response headers:', Object.fromEntries(response.headers.entries()));

        // Get response text first to handle both JSON and non-JSON responses
        const responseText = await response.text();
        console.log('Gemini API raw response:', responseText);

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Failed to parse JSON response:', parseError);
            return res.status(500).json({
                error: 'Invalid response from Gemini API',
                details: responseText,
                status: response.status
            });
        }

        if (!response.ok) {
            console.error('Gemini API error:', data);
            return res.status(response.status).json(data);
        }

        console.log('Gemini API success:', data);
        res.json(data);
        
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: 'Proxy server error', details: error.message });
    }
});

// Proxy route for listing models
app.get('/api/models', async (req, res) => {
    try {
        const apiKey = req.query.key;
        
        if (!apiKey) {
            return res.status(400).json({ error: 'API key is required' });
        }
        
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        
        console.log('Fetching models from:', geminiUrl);
        
        const response = await fetch(geminiUrl);

        console.log('Models API response status:', response.status);

        // Get response text first to handle both JSON and non-JSON responses
        const responseText = await response.text();
        console.log('Models API raw response:', responseText.substring(0, 500) + '...');

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Failed to parse JSON response:', parseError);
            return res.status(500).json({
                error: 'Invalid response from Models API',
                details: responseText,
                status: response.status
            });
        }

        if (!response.ok) {
            console.error('Models API error:', data);
            return res.status(response.status).json(data);
        }

        console.log('Models API success');
        res.json(data);
        
    } catch (error) {
        console.error('Models proxy error:', error);
        res.status(500).json({ error: 'Proxy server error', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 CORS Proxy Server running at http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${__dirname}`);
    console.log(`🔗 Open http://localhost:${PORT}/test-gemini-api.html to test`);
});
