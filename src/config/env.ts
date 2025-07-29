// Environment configuration and validation
// Ensures all required environment variables are properly set

interface EnvironmentConfig {
  supabase: {
    url: string;
    anonKey: string;
  };
  googleAI: {
    apiKey: string;
  };
  app: {
    nodeEnv: string;
    isDevelopment: boolean;
    isProduction: boolean;
  };
  deployment?: {
    wifProvider?: string;
    wifServiceAccount?: string;
  };
}

// Validate required environment variables
const validateEnvVar = (name: string, value: string | undefined): string => {
  if (!value || value.trim() === '') {
    throw new Error(
      `Missing required environment variable: ${name}\n` +
      `Please check your .env file and ensure ${name} is set.\n` +
      `See .env.example for reference.`
    );
  }
  return value.trim();
};

// Get optional environment variable
const getOptionalEnvVar = (name: string): string | undefined => {
  const value = import.meta.env[name] || process.env[name];
  return value && value.trim() !== '' ? value.trim() : undefined;
};

// Create and validate environment configuration
const createEnvironmentConfig = (): EnvironmentConfig => {
  try {
    // Required variables
    const supabaseUrl = validateEnvVar('VITE_SUPABASE_URL', 
      import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL
    );
    
    const supabaseAnonKey = validateEnvVar('VITE_SUPABASE_ANON_KEY', 
      import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
    );

    // Google AI API key is required for edge functions but may not be available in client
    const googleAIApiKey = getOptionalEnvVar('GOOGLE_AI_API_KEY') || 'not-available-in-client';

    const nodeEnv = import.meta.env.MODE || process.env.NODE_ENV || 'development';

    // Optional deployment variables
    const wifProvider = getOptionalEnvVar('WIF_PROVIDER');
    const wifServiceAccount = getOptionalEnvVar('WIF_SERVICE_ACCOUNT');

    return {
      supabase: {
        url: supabaseUrl,
        anonKey: supabaseAnonKey,
      },
      googleAI: {
        apiKey: googleAIApiKey,
      },
      app: {
        nodeEnv,
        isDevelopment: nodeEnv === 'development',
        isProduction: nodeEnv === 'production',
      },
      deployment: wifProvider && wifServiceAccount ? {
        wifProvider,
        wifServiceAccount,
      } : undefined,
    };
  } catch (error) {
    console.error('❌ Environment Configuration Error:', error);
    
    // In development, show helpful error message
    if (import.meta.env.MODE === 'development' || process.env.NODE_ENV === 'development') {
      console.error('\n🔧 Development Setup Help:');
      console.error('1. Copy .env.example to .env');
      console.error('2. Fill in your Supabase credentials');
      console.error('3. Add your Google AI API key');
      console.error('4. Restart the development server\n');
    }
    
    throw error;
  }
};

// Export the validated configuration
export const env = createEnvironmentConfig();

// Export individual configs for convenience
export const supabaseConfig = env.supabase;
export const googleAIConfig = env.googleAI;
export const appConfig = env.app;
export const deploymentConfig = env.deployment;

// Helper function to check if all deployment variables are available
export const isDeploymentConfigured = (): boolean => {
  return Boolean(env.deployment?.wifProvider && env.deployment?.wifServiceAccount);
};

// Helper function to get environment info for debugging
export const getEnvironmentInfo = () => {
  return {
    nodeEnv: env.app.nodeEnv,
    isDevelopment: env.app.isDevelopment,
    isProduction: env.app.isProduction,
    hasSupabaseConfig: Boolean(env.supabase.url && env.supabase.anonKey),
    hasGoogleAIConfig: Boolean(env.googleAI.apiKey && env.googleAI.apiKey !== 'not-available-in-client'),
    hasDeploymentConfig: isDeploymentConfigured(),
    supabaseUrl: env.supabase.url ? `${env.supabase.url.substring(0, 20)}...` : 'Not set',
  };
};

// Log environment info in development
if (env.app.isDevelopment) {
  console.log('🔧 Environment Configuration:', getEnvironmentInfo());
}

export default env;
