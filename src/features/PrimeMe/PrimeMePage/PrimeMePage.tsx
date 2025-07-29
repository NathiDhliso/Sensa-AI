import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Brain,
  Sparkles,
  BookOpen,
  Compass,
  Map,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  Copy,
  Eye,
  RefreshCw,
  X
} from 'lucide-react';
import { usePageTheme, useThemeClasses } from '../../../contexts/themeUtils';
import { useUIStore } from '../../../stores';
import { callEdgeFunction } from '../../../services/edgeFunctions';
import { uploadService, uploadConfigs } from '../../../services/uploadService';
import { UnifiedUpload, BackButton } from '../../../components';

interface UploadedFile {
  id: string;
  file: File;
  status: 'uploading' | 'analyzing' | 'completed' | 'error';
  extractedContent?: string;
  error?: string;
}

interface NarrativeStage {
  title: string;
  problem: string;
  solutions: string[];
  capability: string;
  topics: string[];
}

interface PrimeNarrative {
  subject: string;
  metaphor: string;
  title: string;
  introduction: string;
  stages: NarrativeStage[];
  conclusion: string;
}

const PrimeMePage: React.FC = () => {
  const navigate = useNavigate();
  const pageTheme = usePageTheme('knowMe');
  const themeClasses = useThemeClasses();
  const { addNotification } = useUIStore();


  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [primeNarrative, setPrimeNarrative] = useState<PrimeNarrative | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeStage, setActiveStage] = useState<number | null>(null);

  // Drag and drop and file input are now handled by UnifiedUpload component

  const handleFiles = async (files: File[]) => {
    try {
      // Use the centralized upload service
      const uploadResult = await uploadService.processFiles(files, uploadConfigs.primeMe);
      
      if (uploadResult.errors.length > 0) {
        uploadResult.errors.forEach(error => {
        addNotification({
          type: 'error',
            title: 'Upload Error',
            message: error,
          duration: 5000
          });
        });
      }

      const newUploadedFiles: UploadedFile[] = uploadResult.files.map(processedFile => ({
        id: `file_${Date.now()}_${Math.random()}`,
        file: processedFile.file,
        status: processedFile.status === 'success' ? 'completed' : 'error',
        extractedContent: processedFile.extractedText,
        error: processedFile.error
      }));

      setUploadedFiles(prev => [...prev, ...newUploadedFiles]);

      // Show success notification for successful uploads
      const successfulFiles = newUploadedFiles.filter(f => f.status === 'completed');
      if (successfulFiles.length > 0) {
        addNotification({
          type: 'success',
          title: 'Files Processed',
          message: `${successfulFiles.length} file(s) processed successfully and ready for Prime Me generation.`,
          duration: 4000
        });
      }

    } catch (error) {
      console.error('File processing error:', error);
      addNotification({
        type: 'error',
        title: 'Processing Failed',
        message: `Failed to process files: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: 5000
      });
    }
  };



  const extractContentFromFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string || '');
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
      } else {
        // Mock content extraction for PDF/DOC files
        setTimeout(() => {
          resolve(`Extracted content from ${file.name}:\n\nSample past paper content with topics like calculus, linear algebra, differential equations, integration techniques, matrix operations, eigenvalues, and vector spaces.`);
        }, 2000);
      }
    });
  };

  const generatePrimeNarrative = async () => {
    if (uploadedFiles.length === 0 || !uploadedFiles.some(f => f.status === 'completed')) {
      addNotification({
        type: 'warning',
        title: 'No Files Ready',
        message: 'Please upload and process files before generating the Prime Me narrative.',
        duration: 4000
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Combine all extracted content
      const combinedContent = uploadedFiles
        .filter(f => f.status === 'completed' && f.extractedContent)
        .map(f => f.extractedContent)
        .join('\n\n');

      // Extract subject from first filename
      const firstFile = uploadedFiles[0];
      const subject = firstFile.file.name.split('.')[0].replace(/[_-]/g, ' ');

      // Call the Prime Me system with the specific prompt
      const response = await callEdgeFunction('adk-agents', {
        agent_type: 'orchestrator',
        task: 'prime_me_narrative',
        payload: {
          subject: subject,
          past_paper_content: combinedContent,
          system_prompt: `You are an expert educator and storyteller. Your goal is to transform a list of topics from a subject's past papers into a compelling, logical narrative that explains why these concepts are learned in a particular order.

Task:
1. Analyze: Identify the core, recurring topics and concepts from the past papers for the subject: ${subject}.
2. Create a Narrative Framework: Invent a central metaphor for mastering this subject and create a report titled "The Journey of [Create a Relevant Metaphor for the Subject]."
3. Structure the Journey: Organise the topics into 4 to 6 sequential stages. Each stage must represent a major phase in understanding or applying the subject matter. Give each stage a thematic title (e.g., "The Blueprint," "Construction," "Operations").
4. Develop Each Stage with a Problem-Solution Flow: For each stage in your report, you must:
   - Introduce the stage by describing the general problem, question, or challenge that a learner faces at that point.
   - Present the specific topics from the past papers as the "solutions" or "answers" to these problems.
   - Crucially, use connecting language to show how one concept creates the need for the next. Use phrases like: "This leads to the problem of...", "With that established, the next challenge is...", "To solve this, one must first understand...".
   - Conclude each stage with a one-sentence summary of the new capability the learner has achieved.

The final output should not be a list. It must be a coherent story that illustrates the intellectual journey of mastering ${subject}, with each concept building logically on the last.`
        }
      });

      // Parse the AI response into our narrative structure
      const narrative = parseAIResponse(response, subject);
      setPrimeNarrative(narrative);

      addNotification({
        type: 'success',
        title: 'Prime Me Narrative Generated!',
        message: 'Your learning journey story has been created.',
        duration: 4000
      });

    } catch (error) {
      console.error('Prime Me generation error:', error);
      addNotification({
        type: 'error',
        title: 'Generation Failed',
        message: 'Failed to generate Prime Me narrative. Please try again.',
        duration: 5000
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const parseAIResponse = (response: Record<string, unknown>, subject: string): PrimeNarrative => {
    // Mock parsing for now - in production this would parse the actual AI response
    return {
      subject: subject,
      metaphor: "Mathematical Architecture",
      title: `The Journey of ${subject}: Building Mathematical Architecture`,
      introduction: `Learning ${subject} is like constructing a magnificent architectural masterpiece. Each concept serves as a crucial building block, with earlier foundations supporting more complex structures. This journey transforms abstract mathematical principles into a coherent framework for understanding the world.`,
      stages: [
        {
          title: "The Foundation",
          problem: "Before any mathematical structure can be built, one must establish solid foundations. The challenge is understanding how numbers and basic operations interact in systematic ways.",
          solutions: ["Basic algebra", "Number theory", "Elementary functions"],
          capability: "At this point, the student can manipulate mathematical expressions with confidence and precision.",
          topics: ["Algebra", "Functions", "Basic Calculus"]
        },
        {
          title: "The Blueprint",
          problem: "With foundations laid, the next challenge is understanding how change and rates work together. This leads to the problem of describing motion, growth, and transformation mathematically.",
          solutions: ["Derivatives", "Limits", "Rate of change"],
          capability: "The learner now has the tools to analyze how quantities change over time.",
          topics: ["Differentiation", "Limits", "Applications"]
        },
        {
          title: "Construction Phase",
          problem: "Having mastered how things change, the next challenge is understanding accumulation and total effects. To solve this, one must first understand how to reverse the process of differentiation.",
          solutions: ["Integration", "Area under curves", "Fundamental theorem"],
          capability: "At this point, students can now calculate total effects and solve complex accumulation problems.",
          topics: ["Integration", "Applications", "Techniques"]
        },
        {
          title: "Advanced Architecture",
          problem: "With basic construction complete, the challenge becomes handling multiple dimensions and complex interactions. This leads to the problem of understanding how systems of equations work together.",
          solutions: ["Linear algebra", "Matrix operations", "Vector spaces"],
          capability: "The learner now has the capability to work with multi-dimensional mathematical systems.",
          topics: ["Matrices", "Vectors", "Linear Systems"]
        }
      ],
      conclusion: `This journey through ${subject} reveals how mathematical concepts build upon each other in a logical progression. From basic foundations to advanced architectural principles, each stage prepares the learner for greater complexity and deeper understanding.`
    };
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
        return <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />;
      case 'analyzing':
        return <Brain className="w-4 h-4 animate-pulse text-purple-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const copyNarrative = () => {
    if (!primeNarrative) return;
    
    let textContent = `${primeNarrative.title}\n\n${primeNarrative.introduction}\n\n`;
    
    primeNarrative.stages.forEach((stage, index) => {
      textContent += `Stage ${index + 1}: ${stage.title}\n`;
      textContent += `Problem: ${stage.problem}\n`;
      textContent += `Solutions: ${stage.solutions.join(', ')}\n`;
      textContent += `Capability: ${stage.capability}\n\n`;
    });
    
    textContent += primeNarrative.conclusion;
    
    navigator.clipboard.writeText(textContent);
    addNotification({
      type: 'success',
      title: 'Copied!',
      message: 'Prime Me narrative copied to clipboard.',
      duration: 3000
    });
  };

  return (
    <div className={`min-h-screen ${pageTheme.background}`}>
      {/* Back Button */}
      <BackButton variant="floating" />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/90 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-10"
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div 
                  className="p-2 rounded-xl shadow-lg"
                  style={{ background: pageTheme.gradients.transformation }}
                >
                  <Compass className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className={`text-lg font-bold ${themeClasses.text.primary}`}>Prime Me</h1>
                  <p className={`text-xs ${themeClasses.text.tertiary}`}>Transform topics into compelling learning journeys</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Lightbulb className="w-4 h-4" />
              <span>Educational Storytelling</span>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${pageTheme.card} rounded-2xl p-8 mb-8 border shadow-xl`}
        >
          <div className="text-center">
            <motion.div
              className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
              style={{ background: pageTheme.gradients.transformation }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <BookOpen className="w-8 h-8 text-white" />
            </motion.div>
            
            <h2 className={`text-2xl font-bold ${themeClasses.text.primary} mb-4`}>
              Prime Me: Your Learning Journey Architect
            </h2>
            
            <p className={`text-lg ${themeClasses.text.secondary} mb-6 max-w-3xl mx-auto`}>
              Upload your past papers and watch as AI transforms abstract topics into a compelling narrative that reveals 
              why concepts are learned in their specific order. Discover the intellectual journey of mastering your subject.
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className={`${pageTheme.card} rounded-2xl p-6 border shadow-xl h-fit`}>
            <h3 className={`text-xl font-semibold ${themeClasses.text.primary} mb-4`}>
              Upload Past Papers
            </h3>
            
            <UnifiedUpload
              onFileUpload={handleFiles}
              acceptedTypes={['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']}
              maxFileSize={10}
              maxFiles={3}
              showPasteOption={false}
              title="Drop past papers here"
              description="Upload PDF, DOC, DOCX, or TXT files to analyze"
              theme="default"
              className="mb-4"
            />

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
              <div className="mt-6 space-y-3">
                <h4 className={`font-medium ${themeClasses.text.primary}`}>Uploaded Files</h4>
                <AnimatePresence>
                  {uploadedFiles.map((file) => (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(file.status)}
                        <div>
                          <p className={`text-sm font-medium ${themeClasses.text.primary}`}>
                            {file.file.name}
                          </p>
                          <p className={`text-xs ${themeClasses.text.tertiary}`}>
                            {file.status.charAt(0).toUpperCase() + file.status.slice(1)}
                          </p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => removeFile(file.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Generate Button */}
            {uploadedFiles.some(f => f.status === 'completed') && (
              <motion.button
                onClick={generatePrimeNarrative}
                disabled={isGenerating}
                className="w-full mt-6 px-6 py-3 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                style={{ background: pageTheme.gradients.memoryToLearning }}
                whileHover={{ scale: isGenerating ? 1 : 1.02 }}
                whileTap={{ scale: isGenerating ? 1 : 0.98 }}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin inline" />
                    Generating Prime Me Narrative...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2 inline" />
                    Generate Prime Me Story
                  </>
                )}
              </motion.button>
            )}
          </div>

          {/* Narrative Display */}
          <div className={`${pageTheme.card} rounded-2xl p-6 border shadow-xl`}>
            {primeNarrative ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Header with Actions */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className={`text-xl font-bold ${themeClasses.text.primary}`}>
                      {primeNarrative.title}
                    </h3>
                    <p className={`text-sm ${themeClasses.text.tertiary} mt-1`}>
                      Subject: {primeNarrative.subject}
                    </p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={copyNarrative}
                      className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                      title="Copy narrative"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Introduction */}
                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                  <p className={`${themeClasses.text.secondary} leading-relaxed`}>
                    {primeNarrative.introduction}
                  </p>
                </div>

                {/* Stages */}
                <div className="space-y-4">
                  <h4 className={`font-semibold ${themeClasses.text.primary}`}>Learning Journey Stages</h4>
                  
                  {primeNarrative.stages.map((stage, index) => (
                    <motion.div
                      key={index}
                      className={`border rounded-lg overflow-hidden transition-all ${
                        activeStage === index ? 'border-purple-400' : 'border-gray-200'
                      }`}
                      whileHover={{ scale: 1.01 }}
                    >
                      <button
                        onClick={() => setActiveStage(activeStage === index ? null : index)}
                        className="w-full p-4 text-left bg-gradient-to-r from-gray-50 to-purple-50 hover:from-purple-50 hover:to-pink-50 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                              style={{ background: pageTheme.gradients.wisdom }}
                            >
                              {index + 1}
                            </div>
                            <div>
                              <h5 className={`font-semibold ${themeClasses.text.primary}`}>
                                {stage.title}
                              </h5>
                              <p className={`text-sm ${themeClasses.text.tertiary}`}>
                                {stage.topics.length} topics
                              </p>
                            </div>
                          </div>
                          <Eye className={`w-4 h-4 ${themeClasses.text.tertiary}`} />
                        </div>
                      </button>

                      <AnimatePresence>
                        {activeStage === index && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-gray-200"
                          >
                            <div className="p-4 space-y-4">
                              <div>
                                <h6 className={`font-medium ${themeClasses.text.primary} mb-2`}>
                                  Problem/Challenge:
                                </h6>
                                <p className={`text-sm ${themeClasses.text.secondary}`}>
                                  {stage.problem}
                                </p>
                              </div>

                              <div>
                                <h6 className={`font-medium ${themeClasses.text.primary} mb-2`}>
                                  Solutions:
                                </h6>
                                <div className="flex flex-wrap gap-2">
                                  {stage.solutions.map((solution, sIndex) => (
                                    <span
                                      key={sIndex}
                                      className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full"
                                    >
                                      {solution}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                                <h6 className={`font-medium text-green-800 mb-1`}>
                                  New Capability Achieved:
                                </h6>
                                <p className="text-sm text-green-700">
                                  {stage.capability}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>

                {/* Conclusion */}
                <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                  <h4 className={`font-semibold text-amber-800 mb-2`}>Journey Conclusion</h4>
                  <p className="text-amber-700 text-sm leading-relaxed">
                    {primeNarrative.conclusion}
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="text-center py-12">
                <Map className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className={`${themeClasses.text.secondary}`}>
                  Upload past papers and generate your Prime Me narrative to see the learning journey unfold.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrimeMePage;