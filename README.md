# Sensa AI - Memoir Learning Platform

A revolutionary AI-powered learning platform that transforms how students engage with educational content through personalized memory-driven insights and epistemic drivers.

## 🚀 Features

### 📱 Mobile-Optimized Epistemic Driver
- **Responsive Design**: Seamlessly adapts to all screen sizes (desktop, tablet, mobile)
- **Touch-Friendly Interface**: Optimized for mobile interactions
- **History Management**: Save and load study maps with user-specific data storage
- **AI-Powered Analysis**: Generate personalized learning insights

### 🧠 Core Learning Features
- **Memory Bank**: Store and connect personal learning experiences
- **Study Map Generation**: AI-powered visual learning maps
- **Integrated Learning Hub**: Unified course discovery and analysis
- **Dialogue System**: Interactive AI conversations for deeper understanding

### 🔧 Technical Features
- **TypeScript**: Full type safety and developer experience
- **React 18**: Modern React with hooks and concurrent features
- **Vite**: Lightning-fast development and build tooling
- **Supabase**: Real-time database and authentication
- **Tailwind CSS**: Utility-first styling with custom design system

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/NathiDhliso/Sensa-AI.git
   cd Sensa-AI
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # Required: Supabase Configuration
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Required: Google AI Configuration
   GOOGLE_AI_API_KEY=your_google_ai_api_key
   
   # Optional: Google Cloud Deployment
   WIF_PROVIDER=your_workload_identity_provider
   WIF_SERVICE_ACCOUNT=your_service_account_email
   ```

4. **Database Setup**
   
   Create the epistemic driver history table in your Supabase dashboard:
   ```sql
   -- Run this in Supabase SQL Editor
   CREATE TABLE IF NOT EXISTS epistemic_driver_history (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
     title text NOT NULL,
     subject text NOT NULL,
     objectives text NOT NULL,
     study_map_data jsonb NOT NULL,
     is_favorite boolean DEFAULT false,
     tags text[] DEFAULT '{}',
     notes text,
     created_at timestamptz DEFAULT now(),
     updated_at timestamptz DEFAULT now()
   );
   
   -- Enable Row Level Security
   ALTER TABLE epistemic_driver_history ENABLE ROW LEVEL SECURITY;
   
   -- Create policies for user access
   CREATE POLICY "Users can manage their own history"
     ON epistemic_driver_history
     FOR ALL
     TO authenticated
     USING (auth.uid() = user_id)
     WITH CHECK (auth.uid() = user_id);
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5173`

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests in watch mode
- `npm run test:run` - Run tests once
- `npm run type-check` - Run TypeScript compiler check

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React contexts (Theme, Auth)
├── features/           # Feature-based modules
│   ├── Auth/          # Authentication system
│   ├── Dashboard/     # Main dashboard
│   ├── EpistemicDriver/ # Core learning feature
│   ├── Memory/        # Memory management
│   └── ...
├── hooks/             # Custom React hooks
├── lib/               # Third-party library configurations
├── services/          # API and external services
├── stores/            # State management
├── styles/            # Global styles and themes
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
```

## 🚀 Deployment

### Automatic Deployment (Current)

The application is deployed using **AWS Amplify** with automatic deployment from GitHub:

- **Live URL**: https://sensalearn.co.za
- **Auto-deploy**: Every push to `main` branch triggers deployment
- **Build & Test**: GitHub Actions runs tests and builds on every push
- **Hosting**: AWS Amplify handles hosting and CDN distribution

### Manual Deployment (Alternative)

If you need to deploy elsewhere:

```bash
# Build the application
npm run build

# The dist/ folder contains the production build
# Deploy to any static hosting service
```

### Current Status

✅ **Build & Test**: GitHub Actions workflow
✅ **Auto Deploy**: AWS Amplify from GitHub
✅ **Live Site**: https://sensalearn.co.za
✅ **Custom Domain**: Configured with nameservers

## 🔐 Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `GOOGLE_AI_API_KEY` | Google AI API key for Gemini | `AIzaSyC...` |

### Optional Variables (for deployment)

| Variable | Description |
|----------|-------------|
| `WIF_PROVIDER` | Google Cloud Workload Identity Federation provider |
| `WIF_SERVICE_ACCOUNT` | Google Cloud service account email |

## 🧪 Testing

The project uses Vitest for testing:

```bash
# Run tests in watch mode
npm run test

# Run tests once
npm run test:run

# Run tests with coverage
npm run test:coverage
```

## 📱 Mobile Optimization

The application is fully optimized for mobile devices:

- **Responsive Breakpoints**: 768px (tablet), 480px (mobile)
- **Touch-Friendly**: Optimized button sizes and spacing
- **Mobile-First**: Progressive enhancement approach
- **Performance**: Optimized loading and rendering

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the [documentation](docs/)
- Review the [FAQ](docs/FAQ.md)

---

**Built with ❤️ by the Sensa AI Team**
