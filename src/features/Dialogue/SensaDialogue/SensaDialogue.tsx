import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Brain,
  Heart,
  MessageCircle,
  Target,
  CheckCircle,
  TrendingUp,
  Shield,
  Compass,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { usePageTheme, useThemeClasses, withPageTheme } from '../../../contexts/ThemeContext';

interface MemoryLink {
  id: string;
  concept: string;
  originalAnalogy: string;
  originalStudyTip: string;
  userMemory: string;
  courseContext: string;
  careerPath?: string;
}

interface DialogueMessage {
  id: string;
  sender: 'user' | 'sensa';
  content: string;
  type: 'explanation' | 'question' | 'validation' | 'synthesis' | 'confirmation' | 'bridge_pivot';
  timestamp: Date;
}

interface RevisedAnalysis {
  revisedAnalogy: string;
  revisedStudyTip: string;
  bridgeStrategy?: string;
  pivotOptions?: string[];
  realWorldContext?: string;
}

const SensaDialogue: React.FC = () => {
  const navigate = useNavigate();
  const pageTheme = usePageTheme('memory');
  const themeClasses = useThemeClasses();
  const [currentMemoryLink, setCurrentMemoryLink] = useState<MemoryLink | null>(null);
  const [messages, setMessages] = useState<DialogueMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [dialoguePhase, setDialoguePhase] = useState<'explanation' | 'collaboration' | 'synthesis' | 'bridge_pivot' | 'completion'>('explanation');
  const [revisedAnalysis, setRevisedAnalysis] = useState<RevisedAnalysis | null>(null);
  const [showRealWorldBarrier, setShowRealWorldBarrier] = useState(false);

  // Mock memory link for demonstration
  useEffect(() => {
    const mockMemoryLink: MemoryLink = {
      id: 'ml_001',
      concept: 'Project Management',
      originalAnalogy: 'This memory of reorganizing the library shows you have the innate skills of a Project Manager: seeing a complex problem, planning a solution, and executing it for the benefit of others.',
      originalStudyTip: 'Use your natural organizing skills to break down complex projects into manageable phases, just like you organized the library section by section.',
      userMemory: 'Our local community library was chaotic. As a teen, I volunteered and spent a month reorganizing the entire fiction section, creating a new colour-coded system that everyone found easier to use. It was a huge undertaking, but seeing people find books easily was amazing.',
      courseContext: 'Business Management - Project Management Module',
      careerPath: 'Senior Project Manager in Tech Industry'
    };

    setCurrentMemoryLink(mockMemoryLink);
    
    // Start with explanation
    const initialMessage: DialogueMessage = {
      id: 'msg_001',
      sender: 'sensa',
      content: `I focused on the element of systematic organization and problem-solving in your library memory. You demonstrated the core skills of project management: identifying a complex problem (the chaotic library), developing a structured solution (the color-coded system), and executing it successfully while considering the end users (making it easier for people to find books). This shows natural project management instincts.`,
      type: 'explanation',
      timestamp: new Date()
    };

    setMessages([initialMessage]);
  }, []);

  const handleSendMessage = async () => {
    if (!userInput.trim() || !currentMemoryLink) return;

    const userMessage: DialogueMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      content: userInput.trim(),
      type: 'question',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsProcessing(true);

    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate Sensa response based on dialogue phase and user input
    const sensaResponse = await generateSensaResponse(userInput.trim(), dialoguePhase);
    
    setMessages(prev => [...prev, sensaResponse]);
    setIsProcessing(false);
  };

  const generateSensaResponse = async (userInput: string, phase: string): Promise<DialogueMessage> => {
    // Detect if user is expressing frustration about real-world barriers
    const barrierKeywords = ['unfair', 'certification', 'requirements', 'HR', 'filter', 'piece of paper', 'experience', 'barrier'];
    const hasBarrierConcern = barrierKeywords.some(keyword => userInput.toLowerCase().includes(keyword));

    if (hasBarrierConcern && !showRealWorldBarrier) {
      setShowRealWorldBarrier(true);
      setDialoguePhase('bridge_pivot');
      
      return {
        id: `msg_${Date.now()}`,
        sender: 'sensa',
        content: `You are 100% right. It is incredibly frustrating and can feel deeply unfair when a system values a certification over proven, real-world experience like you have. Your feeling that your ability should be what matters most is completely valid.

To give you some strategic context, many large companies, especially here in Gauteng, use these certifications as a standardized benchmark. It's a way for them to quickly verify that a candidate knows a specific, industry-standard methodology. Think of it less as a measure of your talent, and more as a 'language' they expect their project managers to speak.

Now, let's go back to that library project. You didn't just reorganize the books; you created a system and got everyone to adopt it. The core of that success wasn't just tidying up; it was strategic implementation. That exact skill—the ability to understand a system and work within it to create change—is what will get you past this certification barrier.`,
        type: 'bridge_pivot',
        timestamp: new Date()
      };
    }

    if (phase === 'bridge_pivot') {
      const pivotStrategies = `So, let's use your strategic talent. We have a few ways we can pivot to get you where you want to go:

**The Internal Pivot:** Many companies will pay for an employee's PMP® certification. Let's look for a 'Project Coordinator' or 'Junior Project Administrator' role at a major tech company like Vodacom or MTN. You get in the door, use your natural organizing talent to become indispensable, and then have them fund the certification that gets you the official 'Project Manager' title.

**The Startup Pivot:** Smaller tech companies and startups in places like the Tshimologong Precinct are often more flexible. They prioritize demonstrable skill over certifications. We can tailor your CV to highlight the outcomes of your library project and other work, and target these more agile companies to build your official experience.

**The Incremental Pivot:** Instead of the full PMP®, let's start with a more accessible, entry-level certification like the Certified Associate in Project Management (CAPM)®. It's quicker, less expensive, and it's the specific 'key' that can unlock the HR filters for higher-level jobs, allowing your real talent to finally be seen.

Does one of these strategic approaches feel like the right path forward for you?`;

      setRevisedAnalysis({
        revisedAnalogy: 'Your library reorganization project demonstrates strategic system navigation - the exact skill needed to overcome certification barriers in project management.',
        revisedStudyTip: 'Use your proven ability to work within systems to strategically position yourself for project management roles, whether through internal advancement, startup opportunities, or incremental certification.',
        bridgeStrategy: 'Transform the certification barrier from an obstacle into a strategic challenge you can systematically overcome.',
        pivotOptions: ['Internal advancement with company-funded certification', 'Startup environment with skill-based hiring', 'Incremental certification approach'],
        realWorldContext: 'South African tech industry certification requirements and strategic navigation'
      });

      return {
        id: `msg_${Date.now()}`,
        sender: 'sensa',
        content: pivotStrategies,
        type: 'bridge_pivot',
        timestamp: new Date()
      };
    }

    // Regular dialogue flow
    if (phase === 'explanation') {
      setDialoguePhase('collaboration');
      return {
        id: `msg_${Date.now()}`,
        sender: 'sensa',
        content: `Thank you for sharing that perspective. What part of that library memory feels most significant to you? Was it the planning process, the satisfaction of seeing the system work, or perhaps something else entirely that made the experience meaningful?`,
        type: 'question',
        timestamp: new Date()
      };
    }

    if (phase === 'collaboration') {
      setDialoguePhase('synthesis');
      return {
        id: `msg_${Date.now()}`,
        sender: 'sensa',
        content: `That's a powerful point, and I see it now from your perspective. Taking your insight about ${userInput.toLowerCase().includes('creative') ? 'creativity' : userInput.toLowerCase().includes('people') ? 'helping people' : 'systematic thinking'}, let me suggest a refined connection: Your library project wasn't just about organization—it was about ${userInput.toLowerCase().includes('creative') ? 'creative problem-solving that made complex systems accessible to others' : userInput.toLowerCase().includes('people') ? 'understanding user needs and designing solutions that genuinely help people' : 'systematic innovation that improves how people interact with information'}. This suggests you'd excel in ${userInput.toLowerCase().includes('creative') ? 'UX-focused project management or product development roles' : userInput.toLowerCase().includes('people') ? 'stakeholder-centered project management or change management' : 'process improvement and systems optimization roles'}.`,
        type: 'synthesis',
        timestamp: new Date()
      };
    }

    if (phase === 'synthesis') {
      setDialoguePhase('completion');
      return {
        id: `msg_${Date.now()}`,
        sender: 'sensa',
        content: `Perfect! I can see how that resonates with your experience. This refined understanding of your natural talents gives us a much clearer picture of where you'll thrive. Your memory has revealed not just organizational skills, but a deeper pattern of thoughtful innovation that considers both systems and people. This insight will help us identify the most fulfilling career paths for you.`,
        type: 'confirmation',
        timestamp: new Date()
      };
    }

    // Default response
    return {
      id: `msg_${Date.now()}`,
      sender: 'sensa',
      content: `Thank you for sharing that insight. I'm learning so much about how you think and what drives you. This helps me understand your unique perspective better.`,
      type: 'validation',
      timestamp: new Date()
    };
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/90 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-10"
      >
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.1, x: -2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate('/dashboard')}
                className="p-2 text-gray-600 hover:text-gray-800 transition-colors rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
              <div className="flex items-center space-x-3">
                <div 
                  className="p-2 rounded-xl shadow-lg"
                  style={{ background: pageTheme.gradients.wisdom }}
                >
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className={`text-lg font-bold ${themeClasses.text.primary}`}>Sensa Dialogue</h1>
                  <p className={`text-xs ${themeClasses.text.tertiary}`}>Refining your memory connections together</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Brain className="w-4 h-4" />
              <span>Collaborative Exploration</span>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Memory Context */}
        {currentMemoryLink && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 mb-8 border border-indigo-200"
          >
            <h2 className="font-semibold text-indigo-800 mb-3 flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Exploring: {currentMemoryLink.concept}
            </h2>
            <div className="bg-white/60 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Your Memory:</h3>
              <p className="text-gray-600 text-sm italic">"{currentMemoryLink.userMemory}"</p>
            </div>
            <div className="bg-white/60 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Original Connection:</h3>
              <p className="text-gray-600 text-sm">{currentMemoryLink.originalAnalogy}</p>
            </div>
          </motion.div>
        )}

        {/* Dialogue Messages */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-xl">
          <div className="p-6 border-b border-gray-200/50">
            <h3 className="font-semibold text-gray-800 flex items-center">
              <Heart className="w-5 h-5 mr-2 text-rose-500" />
              Collaborative Exploration
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Let's explore this connection together until it feels true to you
            </p>
          </div>

          <div className="p-6 max-h-96 overflow-y-auto space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-3xl ${
                    message.sender === 'user' 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' 
                      : message.type === 'bridge_pivot'
                        ? 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200'
                        : 'bg-gray-100'
                  } rounded-2xl p-4`}>
                    {message.sender === 'sensa' && (
                      <div className="flex items-center space-x-2 mb-2">
                        <Brain className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm font-medium text-indigo-800">Sensa</span>
                        {message.type === 'bridge_pivot' && (
                          <div className="flex items-center space-x-1">
                            <Shield className="w-3 h-3 text-amber-600" />
                            <span className="text-xs text-amber-700">Bridge & Pivot</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className={`text-sm leading-relaxed ${
                      message.sender === 'user' ? 'text-white' : 'text-gray-700'
                    }`}>
                      {message.content.split('\n').map((line, index) => (
                        <div key={index}>
                          {line.startsWith('**') && line.endsWith('**') ? (
                            <strong className="text-amber-800">{line.slice(2, -2)}</strong>
                          ) : (
                            line
                          )}
                          {index < message.content.split('\n').length - 1 && <br />}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isProcessing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-gray-100 rounded-2xl p-4">
                  <div className="flex items-center space-x-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Brain className="w-4 h-4 text-indigo-600" />
                    </motion.div>
                    <span className="text-sm text-gray-600">Sensa is thinking...</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-6 border-t border-gray-200/50">
            <div className="flex space-x-4">
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Share your thoughts about this connection..."
                className="flex-1 p-3 border border-gray-200 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 outline-none resize-none text-gray-700 placeholder-gray-400 bg-white/90"
                rows={2}
                disabled={isProcessing || dialoguePhase === 'completion'}
              />
              <motion.button
                onClick={handleSendMessage}
                disabled={!userInput.trim() || isProcessing || dialoguePhase === 'completion'}
                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                whileHover={{ scale: userInput.trim() && !isProcessing ? 1.05 : 1 }}
                whileTap={{ scale: userInput.trim() && !isProcessing ? 0.95 : 1 }}
              >
                <span>Send</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Revised Analysis Display */}
        {revisedAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200"
          >
            <h3 className="font-semibold text-green-800 mb-4 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              Refined Understanding
            </h3>
            
            <div className="space-y-4">
              <div className="bg-white/60 rounded-lg p-4">
                <h4 className="text-sm font-medium text-green-700 mb-2">Enhanced Connection:</h4>
                <p className="text-green-600 text-sm">{revisedAnalysis.revisedAnalogy}</p>
              </div>
              
              <div className="bg-white/60 rounded-lg p-4">
                <h4 className="text-sm font-medium text-green-700 mb-2">Strategic Approach:</h4>
                <p className="text-green-600 text-sm">{revisedAnalysis.revisedStudyTip}</p>
              </div>

              {revisedAnalysis.pivotOptions && (
                <div className="bg-white/60 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-green-700 mb-2">Strategic Pathways:</h4>
                  <ul className="space-y-1">
                    {revisedAnalysis.pivotOptions.map((option, index) => (
                      <li key={index} className="text-green-600 text-sm flex items-start space-x-2">
                        <TrendingUp className="w-3 h-3 mt-1 flex-shrink-0" />
                        <span>{option}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Completion Actions */}
        {dialoguePhase === 'completion' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 text-center"
          >
            <motion.button
              onClick={() => navigate('/course-analyzer')}
              className="text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-3 mx-auto"
              style={{ background: pageTheme.gradients.memoryToLearning }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Compass className="w-5 h-5" />
              <span>Apply This Insight to Course Analysis</span>
              <Sparkles className="w-5 h-5" />
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

const SensaDialogueWithTheme = withPageTheme(SensaDialogue, 'memory');
SensaDialogueWithTheme.displayName = 'SensaDialogue';
export default SensaDialogueWithTheme;