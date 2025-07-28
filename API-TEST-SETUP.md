# Gemini API Test Setup Guide

This guide will help you resolve the CORS and authentication issues you're experiencing with your API testing.

## Issues Identified

1. **CORS Error**: Browser blocks direct requests to Google's API from local files
2. **Supabase Authentication Error**: Missing authorization header (401 Unauthorized)
3. **Models API Success**: Your Google AI API key is working correctly

## Solutions

### Option 1: Quick Fix - Use Python HTTP Server

1. **Install Python** (if not already installed)
2. **Run the batch file**:
   ```bash
   start-server.bat
   ```
3. **Open your browser** and go to: `http://localhost:8000/test-gemini-api.html`

### Option 2: Full Solution - Node.js Proxy Server

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the proxy server**:
   ```bash
   npm run proxy:start
   ```

3. **Open your browser** and go to: `http://localhost:3000/test-gemini-api.html`

## Required API Keys

### Google AI API Key
- Get from: https://makersuite.google.com/app/apikey
- Format: `AIzaSy...` (starts with AIza)
- Used for: Direct Gemini API testing

### Supabase Anon Key
- Get from your Supabase project dashboard
- Format: `eyJ...` (starts with eyJ)
- Used for: Supabase function testing
- Location: Project Settings > API > anon/public key

## Testing Steps

1. **Enter your API keys** in the form fields
2. **Test Direct Gemini API**: Click "🔬 Test Direct Gemini API"
3. **Test Supabase Function**: Click "🚀 Test Supabase Function"
4. **List Models**: Click "📋 List Available Models"

## Expected Results

### Direct Gemini API Test
- ✅ Success: Should return "API working" response
- ❌ Error: Check API key and proxy server status

### Supabase Function Test
- ✅ Success: Should return orchestrator response
- ❌ Error: Check Supabase key and function deployment

### List Models Test
- ✅ Success: Should list available Gemini models
- ❌ Error: Check API key validity

## Troubleshooting

### CORS Errors
- Make sure you're using `http://localhost` not `file://`
- Ensure proxy server is running on port 3000
- Check browser console for detailed error messages

### Authentication Errors
- Verify Supabase anon key is correct
- Check if Supabase function is deployed
- Ensure you have proper permissions

### API Key Errors
- Verify Google AI API key is active
- Check API quotas and billing
- Ensure API is enabled in Google Cloud Console

## Development Commands

```bash
# Start proxy server
npm run proxy:start

# Start with auto-reload (development)
npm run proxy:dev

# Start simple Python server
python -m http.server 8000
```

## Files Modified

- `test-gemini-api.html` - Updated to use proxy server and include Supabase auth
- `cors-proxy-server.js` - New proxy server to handle CORS
- `package.json` - Added proxy server dependencies and scripts
- `start-server.bat` - Quick Python server launcher

## Next Steps

1. Choose your preferred solution (Python server or Node.js proxy)
2. Get your API keys from the respective services
3. Test each endpoint to verify functionality
4. Use the working setup for your development needs
