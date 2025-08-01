import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './features/Auth';
import { LandingPage } from './features/LandingPage';
import LoginPage from './pages/LoginPage';
import UpdatePasswordPage from './pages/UpdatePasswordPage';
import { OnboardingFlow } from './features/Onboarding';
import { Dashboard } from './features/Dashboard';
import { MemoryElicitation } from './features/Memory';
import { PrivacyCenter } from './features/Privacy';
import { MemoryBank } from './features/Memory';
import { SensaDialogue } from './features/Dialogue';
import { StudyMaterialUpload } from './features/StudyMaterialUpload';
import { EnhancedStudyMap } from './features/IntegratedLearning';
import { NotificationSystem } from './features/NotificationSystem';
import { PrimeMePage } from './features/PrimeMe';
import { StudyGuideGenerator } from './features/StudyGuide';
import { EpistemicDriver } from './features/EpistemicDriver';
import { BusinessLens } from './features/BusinessLens';
import { CollaborationPage } from './pages/CollaborationPage';
import { SettingsPage } from './pages/SettingsPage';

function App() {
  return (
    <ThemeProvider>
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-orange-50 to-pink-50">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/update-password" element={<UpdatePasswordPage />} />
          <Route path="/onboarding" element={<OnboardingFlow />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/memories" element={
            <ProtectedRoute>
              <MemoryElicitation />
            </ProtectedRoute>
          } />
          <Route path="/memory-elicitation" element={
            <ProtectedRoute>
              <MemoryElicitation />
            </ProtectedRoute>
          } />
          <Route path="/privacy" element={
            <ProtectedRoute>
              <PrivacyCenter />
            </ProtectedRoute>
          } />
          <Route path="/memory-bank" element={
            <ProtectedRoute>
              <MemoryBank />
            </ProtectedRoute>
          } />
          <Route path="/integrated-learning" element={
            <ProtectedRoute>
              <EnhancedStudyMap />
            </ProtectedRoute>
          } />
          <Route path="/dialogue" element={
            <ProtectedRoute>
              <SensaDialogue />
            </ProtectedRoute>
          } />
          <Route path="/study-upload" element={
            <ProtectedRoute>
              <StudyMaterialUpload />
            </ProtectedRoute>
          } />

                      <Route path="/prime-me" element={<PrimeMePage />} />
            <Route path="/study-guide-generator" element={<StudyGuideGenerator />} />
            <Route path="/epistemic-driver" element={
              <ProtectedRoute>
                <EpistemicDriver />
              </ProtectedRoute>
            } />
            <Route path="/business-lens" element={
              <ProtectedRoute>
                <BusinessLens />
              </ProtectedRoute>
            } />
            <Route path="/collaborate" element={
              <ProtectedRoute>
                <CollaborationPage />
              </ProtectedRoute>
            } />
            <Route path="/collaborate/:sessionId" element={
              <ProtectedRoute>
                <CollaborationPage />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            } />
          {/* Legacy routes redirecting to integrated learning hub */}
          <Route path="/course-analyzer" element={
            <ProtectedRoute>
              <EnhancedStudyMap />
            </ProtectedRoute>
          } />
          <Route path="/mermaid-map" element={
            <ProtectedRoute>
              <EnhancedStudyMap />
            </ProtectedRoute>
          } />
          <Route path="/study-guide-generator" element={
            <ProtectedRoute>
              <EnhancedStudyMap />
            </ProtectedRoute>
          } />
          <Route path="/enhanced-study-map" element={
            <ProtectedRoute>
              <EnhancedStudyMap />
            </ProtectedRoute>
          } />
        </Routes>
        
        {/* Global Notification System */}
        <NotificationSystem />
      </div>
    </Router>
    </ThemeProvider>
  );
}

export default App;