import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSmartNavigation } from '../hooks/useAuth';
import { 
  ArrowLeft, 
  Shield, 
  Eye, 
  Lock, 
  Download, 
  Trash2, 
  Settings,
  CheckCircle,
  Info,
  Brain,
  Heart
} from 'lucide-react';

const PrivacyCenter: React.FC = () => {
  const navigate = useNavigate();
  const { goBack } = useSmartNavigation();
  const [dataSettings, setDataSettings] = useState({
    memoryAnalysis: true,
    coursePersonalization: true,
    memoryStorage: true,
    analyticsOptOut: false
  });

  const privacyFeatures = [
    {
      icon: <Lock className="w-6 h-6 text-green-500" />,
      title: 'Memory Encryption',
      description: 'All your childhood memories are encrypted with military-grade security in Sensa',
      status: 'Active'
    },
    {
      icon: <Eye className="w-6 h-6 text-blue-500" />,
      title: 'Data Minimization',
      description: 'Sensa only processes memories and course data - nothing else',
      status: 'Active'
    },
    {
      icon: <Shield className="w-6 h-6 text-purple-500" />,
      title: 'Privacy by Design',
      description: 'Memory protection built into every Sensa feature from the ground up',
      status: 'Active'
    }
  ];

  const handleDataSettingToggle = (setting: keyof typeof dataSettings) => {
    // Don't toggle required settings that are enabled
    if ((setting === 'memoryAnalysis' || setting === 'coursePersonalization') && dataSettings[setting]) {
      return;
    }
    
    setDataSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleDownloadData = () => {
    // Simulate download action
    const mockData = {
      memories: [
        { id: 1, category: 'Childhood Memory', content: 'Sample memory content', date: new Date().toISOString() }
      ],
      courses: [
        { id: 1, title: 'Sample Course', analysis: 'Sample analysis', date: new Date().toISOString() }
      ],
      profile: {
        learningStyle: 'Visual-Kinesthetic',
        preferences: ['Hands-on learning', 'Visual demonstrations']
      }
    };
    
    const dataStr = JSON.stringify(mockData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sensa-data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDeleteData = () => {
    // Show confirmation dialog
    if (window.confirm('Are you sure you want to delete all your Sensa data? This action cannot be undone.')) {
      // Simulate deletion action
      alert('Your data has been deleted successfully.');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header with Sensa Branding */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10"
      >
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
                              onClick={() => goBack('/dashboard')}
              className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-2 rounded-xl">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-800">Sensa Privacy Center</h1>
                <p className="text-xs text-gray-500">Your memories, your control</p>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Privacy Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-200/50"
        >
          <div className="flex items-start space-x-4 mb-6">
            <div className="bg-gradient-to-br from-green-400 to-emerald-500 p-3 rounded-xl">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-medium text-gray-800 mb-2">Your Memories Are Sacred to Sensa</h2>
              <p className="text-gray-600">
                We understand that childhood memories are deeply personal. Your privacy and data security are Sensa's highest priorities for both memory storage and course analysis.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {privacyFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="bg-white/60 rounded-xl p-4 border border-gray-200/50"
              >
                <div className="flex items-center space-x-3 mb-2">
                  {feature.icon}
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
                <h3 className="font-medium text-gray-800 text-sm mb-1">{feature.title}</h3>
                <p className="text-xs text-gray-600 mb-2">{feature.description}</p>
                <span className="text-xs text-green-600 font-medium">{feature.status}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Core Feature Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-200/50"
        >
          <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
            <Settings className="w-5 h-5 text-blue-500 mr-2" />
            Sensa Core Feature Controls
          </h3>

          <div className="space-y-4">
            <DataToggle
              icon={<Heart className="w-5 h-5 text-rose-500" />}
              title="Memory Analysis"
              description="Allow Sensa AI to analyze your childhood memories for personalized learning insights"
              enabled={dataSettings.memoryAnalysis}
              onToggle={() => handleDataSettingToggle('memoryAnalysis')}
              required={true}
            />
            
            <DataToggle
              icon={<Brain className="w-5 h-5 text-indigo-500" />}
              title="Course Personalization"
              description="Use your memory insights to personalize Sensa course analysis and create learning pathways"
              enabled={dataSettings.coursePersonalization}
              onToggle={() => handleDataSettingToggle('coursePersonalization')}
              required={true}
            />
            
            <DataToggle
              icon={<Lock className="w-5 h-5 text-green-500" />}
              title="Memory Storage"
              description="Securely store your memories in Sensa to improve future course analyses"
              enabled={dataSettings.memoryStorage}
              onToggle={() => handleDataSettingToggle('memoryStorage')}
              required={false}
            />
            
            <DataToggle
              icon={<Eye className="w-5 h-5 text-gray-500" />}
              title="Opt Out of Analytics"
              description="Disable anonymous usage analytics (Sensa course analysis quality may be reduced)"
              enabled={dataSettings.analyticsOptOut}
              onToggle={() => handleDataSettingToggle('analyticsOptOut')}
              required={false}
            />
          </div>
        </motion.div>

        {/* Data Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-200/50"
        >
          <h3 className="text-lg font-medium text-gray-800 mb-4">Sensa Data Management</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ActionButton
              icon={<Download className="w-5 h-5 text-blue-500" />}
              title="Download Your Sensa Data"
              description="Get a copy of all your memories and course analyses from Sensa"
              onClick={handleDownloadData}
            />
            
            <ActionButton
              icon={<Trash2 className="w-5 h-5 text-red-500" />}
              title="Delete All Sensa Data"
              description="Permanently remove all memories and course data from Sensa"
              onClick={handleDeleteData}
              danger={true}
            />
          </div>
        </motion.div>

        {/* Important Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-amber-50 rounded-2xl p-6 border border-amber-200"
        >
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-amber-800 mb-2">Sensa Privacy Commitment</h4>
              <ul className="space-y-1 text-sm text-amber-700">
                <li>• Your memories are never shared with third parties or used for advertising</li>
                <li>• Sensa AI processing happens in secure, encrypted environments with no human access</li>
                <li>• You can modify or delete any memory or course analysis at any time</li>
                <li>• Sensa only uses your data for the two core features: memory analysis and course personalization</li>
                <li>• All data processing complies with GDPR, CCPA, and international privacy standards</li>
                <li>• Your course searches and analyses remain completely private within Sensa</li>
                <li>• Sensa operates under sensalearn.co.za domain with full South African data protection compliance</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const DataToggle: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  required: boolean;
}> = ({ icon, title, description, enabled, onToggle, required }) => (
  <div className="flex items-start justify-between p-4 bg-white/60 rounded-xl border border-gray-200/50">
    <div className="flex items-start space-x-3 flex-1">
      {icon}
      <div>
        <div className="flex items-center space-x-2 mb-1">
          <h4 className="font-medium text-gray-800">{title}</h4>
          {required && (
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
              Required
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
    
    <motion.button
      onClick={onToggle}
      disabled={required && enabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        enabled ? 'bg-blue-600' : 'bg-gray-200'
      } ${required && enabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      whileTap={{ scale: required && enabled ? 1 : 0.95 }}
    >
      <motion.span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
        layout
      />
    </motion.button>
  </div>
);

const ActionButton: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  danger?: boolean;
}> = ({ icon, title, description, onClick, danger = false }) => (
  <motion.button
    onClick={onClick}
    className={`p-4 rounded-xl border-2 transition-all duration-300 text-left w-full ${
      danger 
        ? 'border-red-200 bg-red-50/50 hover:bg-red-50 hover:border-red-300' 
        : 'border-gray-200 bg-white/60 hover:bg-white/80 hover:border-gray-300'
    }`}
    whileHover={{ y: -2, scale: 1.02 }}
  >
    <div className="flex items-start space-x-3">
      {icon}
      <div>
        <h4 className={`font-medium mb-1 ${danger ? 'text-red-800' : 'text-gray-800'}`}>
          {title}
        </h4>
        <p className={`text-sm ${danger ? 'text-red-600' : 'text-gray-600'}`}>
          {description}
        </p>
      </div>
    </div>
  </motion.button>
);

export default PrivacyCenter;