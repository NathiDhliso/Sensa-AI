import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import LandingPage from './pages/LandingPage/LandingPage';
import LoginPage from './pages/LoginPage';
import UpdatePasswordPage from './pages/UpdatePasswordPage';
import OnboardingFlow from './pages/OnboardingFlow';
import Dashboard from './pages/Dashboard/Dashboard';
import MemoryElicitation from './pages/MemoryElicitation';
import PrivacyCenter from './pages/PrivacyCenter';
import MemoryBank from './pages/MemoryBank';
import SensaDialogue from './pages/SensaDialogue';
import StudyMaterialUpload from './components/StudyMaterialUpload/StudyMaterialUpload';
import EnhancedStudyMap from './pages/EnhancedStudyMap';
import NotificationSystem from './components/NotificationSystem/NotificationSystem';

function App() {
  return (
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
  );
}

export default App;