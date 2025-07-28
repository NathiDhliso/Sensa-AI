import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Upload, FileText, Brain, Sparkles, Download,
    Copy, CheckCircle, AlertTriangle, Target, Layers, Star, Zap, X
} from 'lucide-react';
import { SensaAPI } from '../../../services/api';
import { useAuthStore } from '../../../stores/authStore';

// --- TYPE DEFINITIONS ---

/**
 * @interface StudyGuide
 * @description Defines the complete data structure for a generated study guide.
 */
interface StudyGuide {
    id: string;
    subject: string;
    framework: {
        acronym: string;
        name: string;
        description: string;
    };
    pillars: Pillar[];
    createdAt: Date;
}

/**
 * @interface Pillar
 * @description Defines the structure for a single pillar within the study guide.
 */
interface Pillar {
    name: string;
    thematicName: string;
    studyFocus: string;
    subAcronym?: string;
    subTopics: SubTopic[];
}

/**
 * @interface SubTopic
 * @description Defines the structure for a sub-topic, including its knowledge pyramid.
 */
interface SubTopic {
    priority: string;
    conceptPair: string;
    pyramid: {
        base: string;
        middle: string;
        apex: string;
        keyTakeaway: string;
    };
}

/**
 * @interface FileWithStatus
 * @description Extends the File object to include an upload/processing status for better UI feedback.
 */
interface FileWithStatus {
    file: File;
    status: 'pending' | 'processing' | 'success' | 'error';
}

interface ThemeConfig {
    background: string;
    card: string;
    cardSubtle: string;
    button: string;
    inputBorder: string;
    text: string;
    textSecondary: string;
    accent: {
        border: string;
    };
}

interface NotificationConfig {
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
    duration: number;
}

// --- THEME CONFIGURATION ---
const defaultTheme: ThemeConfig = {
    background: 'bg-gradient-to-br from-purple-50 to-indigo-100 min-h-screen',
    card: 'bg-white shadow-lg border border-gray-200',
    cardSubtle: 'bg-gray-50 border border-gray-200',
    button: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700',
    inputBorder: 'border-gray-300',
    text: 'text-gray-900',
    textSecondary: 'text-gray-600',
    accent: {
        border: 'border-purple-400'
    }
};

// --- HELPER & MOCK FUNCTIONS ---

/**
 * @function generateMarkdown
 * @description Converts a StudyGuide object into a formatted markdown string for export.
 */
const generateMarkdown = (guide: StudyGuide): string => {
    let markdown = `# The ${guide.framework.acronym} Framework for ${guide.subject}\n\n`;
    markdown += `${guide.framework.description}\n\n`;

    guide.pillars.forEach((pillar, index) => {
        markdown += `## Pillar ${index + 1}: ${pillar.name} (${pillar.thematicName})\n\n`;
        markdown += `**Study Focus:** ${pillar.studyFocus}\n\n`;

        if (pillar.subAcronym) {
            markdown += `This pillar's sub-topics form the acronym **${pillar.subAcronym}**:\n`;
            pillar.subTopics.forEach(topic => {
                markdown += `• ${topic.conceptPair}\n`;
            });
            markdown += '\n';
        }

        pillar.subTopics.forEach(topic => {
            markdown += `---\n\n`;
            markdown += `### Sub-Topic: ${topic.priority} ${topic.conceptPair}\n\n`;
            markdown += `• **Base (The Initial Problem):** ${topic.pyramid.base}\n`;
            markdown += `• **Middle (The Standard Solution):** ${topic.pyramid.middle}\n`;
            markdown += `• **Apex (New Problem & Advanced Solution):** ${topic.pyramid.apex}\n`;
            markdown += `• **Key Takeaway:** ${topic.pyramid.keyTakeaway}\n\n`;
        });
    });
    return markdown;
};




// --- UTILITY FUNCTIONS ---

/**
 * Simple notification system using state
 */
const useNotifications = () => {
    const [notifications, setNotifications] = useState<NotificationConfig[]>([]);

    const addNotification = useCallback((notification: NotificationConfig) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { ...notification, id }]);

        setTimeout(() => {
            setNotifications(prev => prev.filter((n: { id: number }) => n.id !== id));
        }, notification.duration);
    }, []);

    return { notifications, addNotification };
};

/**
 * Simple file reading utility
 */
const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result;
            if (typeof result === 'string') {
                resolve(result);
            } else {
                reject(new Error('Failed to read file as text'));
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
};

/**
 * Real AI API call for study guide generation
 */
const generateStudyGuideAPI = async (examContent: string, subjectName: string, userId?: string): Promise<StudyGuide> => {
    try {
        // Call the real AI service
        const result = await SensaAPI.generateStudyGuide({
            examContent,
            subjectName,
            userId
        });

        return result;
    } catch (error) {
        console.error('AI study guide generation failed:', error);
        throw new Error(`Failed to generate study guide: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

// --- CHILD COMPONENTS ---

/**
 * @component PyramidDisplay
 * @description Renders the three-tiered knowledge pyramid for a single sub-topic.
 */
const PyramidDisplay: React.FC<{ topic: SubTopic; theme: ThemeConfig }> = ({ topic, theme }) => (
    <div className="space-y-3">
        <div className={`${theme.cardSubtle} p-4 rounded-lg`}>
            <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <span className="font-medium text-red-600">Base (Initial Problem)</span>
            </div>
            <p className={`${theme.textSecondary} text-sm`}>{topic.pyramid.base}</p>
        </div>
        <div className={`${theme.cardSubtle} p-4 rounded-lg`}>
            <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <span className="font-medium text-yellow-600">Middle (Standard Solution)</span>
            </div>
            <p className={`${theme.textSecondary} text-sm`}>{topic.pyramid.middle}</p>
        </div>
        <div className={`${theme.cardSubtle} p-4 rounded-lg`}>
            <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="font-medium text-green-600">Apex (Advanced Solution)</span>
            </div>
            <p className={`${theme.textSecondary} text-sm`}>{topic.pyramid.apex}</p>
        </div>
        <div className={`${theme.button} p-4 rounded-lg`}>
            <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-white" />
                <span className="font-medium text-white">Key Takeaway</span>
            </div>
            <p className="text-white text-sm font-medium">{topic.pyramid.keyTakeaway.replace(/\*\*/g, '')}</p>
        </div>
    </div>
);

/**
 * @component PillarCard
 * @description Renders a full pillar, including its header, study focus, and sub-topics.
 */
const PillarCard: React.FC<{ pillar: Pillar; index: number; theme: ThemeConfig }> = ({ pillar, index, theme }) => (
    <div className={`${theme.card} p-6 rounded-xl transition-all duration-300 hover:shadow-xl`}>
        <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg ${theme.button}`}>
                <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
                <h3 className={`text-xl font-semibold ${theme.text}`}>Pillar {index + 1}: {pillar.name}</h3>
                <p className={`${theme.textSecondary} text-sm`}>{pillar.thematicName}</p>
            </div>
        </div>
        <div className={`${theme.cardSubtle} p-4 rounded-lg mb-6`}>
            <p className={`${theme.textSecondary} leading-relaxed`}>
                <span className={`font-medium ${theme.text}`}>Study Focus:</span> {pillar.studyFocus}
            </p>
        </div>
        <div className="space-y-6">
            {pillar.subTopics.map((topic, topicIndex) => (
                <div key={topicIndex} className={`border-l-4 ${theme.accent.border} pl-6`}>
                    <h4 className={`text-lg font-medium ${theme.text} mb-4`}>
                        {topic.priority} {topic.conceptPair}
                    </h4>
                    <PyramidDisplay topic={topic} theme={theme} />
                </div>
            ))}
        </div>
    </div>
);

/**
 * @component LoadingSpinner
 * @description Animated loading component
 */
const LoadingSpinner: React.FC<{ theme: ThemeConfig }> = ({ theme }) => (
    <div className={`min-h-screen ${theme.background} flex flex-col items-center justify-center`}>
        <div className="text-center p-8">
            <div className="relative w-24 h-24 mx-auto">
                <div className={`absolute inset-0 border-4 ${theme.accent.border} rounded-full animate-spin`} />
                <div className={`absolute inset-2 border-4 ${theme.accent.border} border-t-transparent rounded-full animate-spin`} style={{ animationDirection: 'reverse' }} />
                <div className={`absolute inset-0 flex items-center justify-center ${theme.text}`}>
                    <Brain size={40} />
                </div>
            </div>
            <h2 className={`text-2xl font-bold ${theme.text} mt-8`}>Crafting Your Guide...</h2>
            <p className={`${theme.textSecondary} mt-2`}>Analyzing content and structuring knowledge.</p>
        </div>
    </div>
);

/**
 * @component GeneratedGuideDisplay
 * @description The main view for displaying the generated study guide.
 */
const GeneratedGuideDisplay: React.FC<{
    guide: StudyGuide;
    theme: ThemeConfig;
    onBack: () => void;
    onCopy: () => void;
    onDownload: () => void;
    copySuccess: boolean;
}> = ({ guide, theme, onBack, onCopy, onDownload, copySuccess }) => (
    <div className={`${theme.background}`}>
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className={`p-2 rounded-lg ${theme.button} transition-colors`}
                    >
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <div>
                        <h1 className={`text-3xl font-bold ${theme.text}`}>Study Guide: {guide.subject}</h1>
                        <p className={`text-lg ${theme.textSecondary} mt-1`}>{guide.framework.name}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={onCopy}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg ${theme.button} text-white transition-colors`}
                    >
                        {copySuccess ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copySuccess ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                        onClick={onDownload}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg ${theme.button} text-white transition-colors`}
                    >
                        <Download className="w-4 h-4" />
                        Download
                    </button>
                </div>
            </div>

            <div className={`${theme.card} p-6 rounded-xl mb-8`}>
                <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg ${theme.button}`}>
                        <Target className="w-6 h-6 text-white" />
                    </div>
                    <h2 className={`text-xl font-semibold ${theme.text}`}>The {guide.framework.acronym} Framework</h2>
                </div>
                <p className={`${theme.textSecondary} leading-relaxed`}>{guide.framework.description}</p>
            </div>

            <div className="space-y-8">
                {guide.pillars && guide.pillars.length > 0 ? (
                    guide.pillars.map((pillar, pillarIndex) => (
                        <PillarCard
                            key={pillarIndex}
                            pillar={pillar}
                            index={pillarIndex}
                            theme={theme}
                        />
                    ))
                ) : (
                    <div className={`${theme.card} p-8 rounded-xl text-center`}>
                        <p className={`${theme.textSecondary} text-lg`}>
                            No study guide content available. Please check the console for debugging information.
                        </p>
                        <p className={`${theme.textSecondary} text-sm mt-2`}>
                            Pillars: {JSON.stringify(guide.pillars)}
                        </p>
                    </div>
                )}
            </div>
        </div>
    </div>
);

/**
 * @component GuideInputForm
 * @description The form for user input, including subject name, file upload, and text paste.
 */
const GuideInputForm: React.FC<{
    theme: ThemeConfig;
    inputMethod: 'upload' | 'paste';
    setInputMethod: React.Dispatch<React.SetStateAction<'upload' | 'paste'>>;
    subjectName: string;
    setSubjectName: React.Dispatch<React.SetStateAction<string>>;
    examText: string;
    setExamText: React.Dispatch<React.SetStateAction<string>>;
    handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    uploadedFiles: FileWithStatus[];
    setUploadedFiles: React.Dispatch<React.SetStateAction<FileWithStatus[]>>;
    generateStudyGuide: () => Promise<void>;
    isGenerating: boolean;
    onBack: () => void;
}> = (props) => {
    const {
        theme, inputMethod, setInputMethod, subjectName, setSubjectName,
        examText, setExamText, handleFileUpload, uploadedFiles, setUploadedFiles,
        generateStudyGuide, isGenerating, onBack
    } = props;

    const fileInputRef = useRef<HTMLInputElement>(null);

    const removeFile = (fileName: string) => {
        setUploadedFiles((prev) => prev.filter(f => f.file.name !== fileName));
    };

    const clearAll = () => {
        setExamText('');
        setSubjectName('');
        setUploadedFiles([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={onBack}
                    className={`p-2 rounded-lg ${theme.button} transition-colors`}
                >
                    <ArrowLeft className="w-5 h-5 text-white" />
                </button>
                <div>
                    <h1 className={`text-3xl font-bold ${theme.text}`}>Universal Study Guide Generator</h1>
                    <p className={`text-lg ${theme.textSecondary} mt-1`}>Transform exam papers into comprehensive study guides</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className={`${theme.card} p-6 rounded-xl`}>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${theme.button}`}>
                                <Upload className="w-6 h-6 text-white" />
                            </div>
                            <h2 className={`text-xl font-semibold ${theme.text}`}>Upload Content</h2>
                        </div>
                        <button
                            onClick={clearAll}
                            className={`text-sm ${theme.textSecondary} hover:text-red-500 transition-colors flex items-center gap-1`}
                        >
                            <X size={14}/> Clear All
                        </button>
                    </div>

                    <div className="mb-6">
                        <label className={`block text-sm font-medium ${theme.text} mb-2`}>Subject Name *</label>
                        <input
                            type="text"
                            value={subjectName}
                            onChange={(e) => setSubjectName(e.target.value)}
                            placeholder="e.g., Constitutional Law"
                            className={`w-full px-4 py-3 rounded-lg border ${theme.inputBorder} bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors`}
                        />
                    </div>

                    <div className="flex gap-2 mb-4">
                        <button
                            onClick={() => setInputMethod('upload')}
                            className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                                inputMethod === 'upload'
                                    ? `${theme.button} text-white`
                                    : `${theme.cardSubtle} ${theme.text}`
                            }`}
                        >
                            <Upload className="w-4 h-4 inline mr-2" />Upload Files
                        </button>
                        <button
                            onClick={() => setInputMethod('paste')}
                            className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                                inputMethod === 'paste'
                                    ? `${theme.button} text-white`
                                    : `${theme.cardSubtle} ${theme.text}`
                            }`}
                        >
                            <FileText className="w-4 h-4 inline mr-2" />Paste Text
                        </button>
                    </div>

                    {inputMethod === 'upload' ? (
                        <div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept=".txt,.pdf,.doc,.docx"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed ${theme.inputBorder} rounded-lg p-8 text-center cursor-pointer hover:border-purple-400 transition-colors`}
                            >
                                <Upload className={`w-12 h-12 ${theme.textSecondary} mx-auto mb-4`} />
                                <p className={`${theme.text} font-medium mb-2`}>Click to upload exam papers</p>
                                <p className={`${theme.textSecondary} text-sm`}>PDF, DOC, DOCX, or TXT files</p>
                            </div>

                            {uploadedFiles.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    <p className={`text-sm font-medium ${theme.text} mb-2`}>Uploaded Files:</p>
                                    {uploadedFiles.map((f, index) => (
                                        <div key={index} className={`text-sm ${theme.textSecondary} flex justify-between items-center`}>
                                            <span className="truncate pr-2">{f.file.name}</span>
                                            <button
                                                onClick={() => removeFile(f.file.name)}
                                                className="hover:text-red-500 transition-colors"
                                            >
                                                <X size={14}/>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div>
              <textarea
                  value={examText}
                  onChange={(e) => setExamText(e.target.value)}
                  placeholder="Paste your exam paper content here..."
                  className={`w-full h-64 px-4 py-3 rounded-lg border ${theme.inputBorder} bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors resize-none`}
              />
                            <p className={`text-xs ${theme.textSecondary} mt-2`}>{examText.length} characters</p>
                        </div>
                    )}

                    <button
                        onClick={generateStudyGuide}
                        disabled={isGenerating || !examText.trim() || !subjectName.trim()}
                        className={`w-full mt-6 py-3 rounded-lg font-medium transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed ${theme.button} text-white hover:opacity-90`}
                    >
                        {isGenerating ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Generating...
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-2">
                                <Sparkles className="w-5 h-5" />
                                Generate Study Guide
                            </div>
                        )}
                    </button>
                </div>

                <div className={`${theme.card} p-6 rounded-xl`}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className={`p-2 rounded-lg ${theme.button}`}>
                            <Brain className="w-6 h-6 text-white" />
                        </div>
                        <h2 className={`text-xl font-semibold ${theme.text}`}>What You Get</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="p-1.5 rounded-lg bg-green-100 mt-1">
                                <Target className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                                <h3 className={`font-medium ${theme.text}`}>Master Framework</h3>
                                <p className={`text-sm ${theme.textSecondary}`}>Memorable acronyms for core subject pillars</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="p-1.5 rounded-lg bg-blue-100 mt-1">
                                <Layers className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                                <h3 className={`font-medium ${theme.text}`}>Knowledge Pyramids</h3>
                                <p className={`text-sm ${theme.textSecondary}`}>Problem-Solution-Complexity structure</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="p-1.5 rounded-lg bg-purple-100 mt-1">
                                <Star className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                                <h3 className={`font-medium ${theme.text}`}>Priority Tags</h3>
                                <p className={`text-sm ${theme.textSecondary}`}>Classifications for focused study</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="p-1.5 rounded-lg bg-orange-100 mt-1">
                                <Zap className="w-4 h-4 text-orange-600" />
                            </div>
                            <div>
                                <h3 className={`font-medium ${theme.text}`}>Key Takeaways</h3>
                                <p className={`text-sm ${theme.textSecondary}`}>Critical exam tips for each topic</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="p-1.5 rounded-lg bg-cyan-100 mt-1">
                                <Download className="w-4 h-4 text-cyan-600" />
                            </div>
                            <div>
                                <h3 className={`font-medium ${theme.text}`}>Export Options</h3>
                                <p className={`text-sm ${theme.textSecondary}`}>Download as markdown or copy text</p>
                            </div>
                        </div>
                    </div>

                    <div className={`mt-6 p-4 ${theme.cardSubtle} rounded-lg`}>
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            <span className={`text-sm font-medium ${theme.text}`}>Pro Tips</span>
                        </div>
                        <ul className={`text-xs ${theme.textSecondary} list-disc list-inside space-y-1`}>
                            <li>Upload multiple exam papers for better analysis</li>
                            <li>Include question patterns and mark allocations</li>
                            <li>More content leads to better topic identification</li>
                            <li>Clear terminology improves accuracy</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * @component WelcomeScreen
 * @description The initial welcome screen with app introduction.
 */
const WelcomeScreen: React.FC<{ theme: ThemeConfig; onGetStarted: () => void }> = ({ theme, onGetStarted }) => (
    <div className={`${theme.background}`}>
        <div className="max-w-4xl mx-auto px-4 py-16">
            <div className="text-center mb-12">
                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${theme.button} mb-6`}>
                    <Brain className="w-10 h-10 text-white" />
                </div>
                <h1 className={`text-4xl font-bold ${theme.text} mb-4`}>Universal Study Guide Generator</h1>
                <p className={`text-xl ${theme.textSecondary} max-w-2xl mx-auto`}>
                    Transform any exam paper into a comprehensive, structured study guide using AI-powered analysis and proven learning frameworks.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className={`${theme.card} p-6 rounded-xl text-center`}>
                    <div className="p-3 rounded-lg bg-purple-100 inline-block mb-4">
                        <Upload className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className={`text-lg font-semibold ${theme.text} mb-2`}>Upload Content</h3>
                    <p className={`${theme.textSecondary} text-sm`}>
                        Upload exam papers, syllabi, or paste your content directly into the system.
                    </p>
                </div>

                <div className={`${theme.card} p-6 rounded-xl text-center`}>
                    <div className="p-3 rounded-lg bg-green-100 inline-block mb-4">
                        <Brain className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className={`text-lg font-semibold ${theme.text} mb-2`}>AI Analysis</h3>
                    <p className={`${theme.textSecondary} text-sm`}>
                        Advanced AI processes your content to identify key concepts, patterns, and study priorities.
                    </p>
                </div>

                <div className={`${theme.card} p-6 rounded-xl text-center`}>
                    <div className="p-3 rounded-lg bg-blue-100 inline-block mb-4">
                        <Sparkles className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className={`text-lg font-semibold ${theme.text} mb-2`}>Structured Guide</h3>
                    <p className={`${theme.textSecondary} text-sm`}>
                        Get a comprehensive study guide with frameworks, priorities, and knowledge pyramids.
                    </p>
                </div>
            </div>

            <div className="text-center">
                <button
                    onClick={onGetStarted}
                    className={`${theme.button} text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors hover:opacity-90 inline-flex items-center gap-3`}
                >
                    <Sparkles className="w-5 h-5" />
                    Get Started
                </button>
            </div>
        </div>
    </div>
);

// --- MAIN COMPONENT ---

/**
 * @component StudyGuideGenerator
 * @description The main application component that orchestrates the entire study guide generation flow.
 */
const StudyGuideGenerator: React.FC = () => {
    const [currentScreen, setCurrentScreen] = useState<'welcome' | 'input' | 'loading' | 'guide'>('welcome');
    const [inputMethod, setInputMethod] = useState<'upload' | 'paste'>('upload');
    const [subjectName, setSubjectName] = useState<string>('');
    const [examText, setExamText] = useState<string>('');
    const [uploadedFiles, setUploadedFiles] = useState<FileWithStatus[]>([]);
    const [generatedGuide, setGeneratedGuide] = useState<StudyGuide | null>(null);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [copySuccess, setCopySuccess] = useState<boolean>(false);

    const { notifications, addNotification } = useNotifications();
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const theme = defaultTheme;

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        const newFiles: FileWithStatus[] = files.map(file => ({
            file,
            status: 'pending'
        }));

        setUploadedFiles(prev => [...prev, ...newFiles]);

        // Process files
        let combinedText = '';
        for (const fileWithStatus of newFiles) {
            try {
                const text = await readFileAsText(fileWithStatus.file);
                combinedText += text + '\n\n';
                fileWithStatus.status = 'success';
            } catch {
                fileWithStatus.status = 'error';
                addNotification({
                    type: 'error',
                    title: 'File Error',
                    message: `Failed to read ${fileWithStatus.file.name}`,
                    duration: 3000
                });
            }
        }

        setExamText(prev => prev + combinedText);
    };

    const generateStudyGuide = async () => {
        if (!examText.trim() || !subjectName.trim()) {
            addNotification({
                type: 'error',
                title: 'Missing Information',
                message: 'Please provide both subject name and exam content.',
                duration: 3000
            });
            return;
        }

        setIsGenerating(true);
        setCurrentScreen('loading');

        try {
            // Pass user ID to enable personalized AI analysis
            const guide = await generateStudyGuideAPI(examText, subjectName, user?.id);
            console.log('📚 Generated guide received:', JSON.stringify(guide, null, 2));
            console.log('🏛️ Pillars count:', guide.pillars?.length || 0);
            if (guide.pillars?.length === 0) {
                console.log('⚠️ Empty pillars detected - checking framework:', guide.framework);
            }
            setGeneratedGuide(guide);
            setCurrentScreen('guide');

            addNotification({
                type: 'success',
                title: 'Success!',
                message: user?.id
                    ? 'Your personalized study guide has been generated successfully.'
                    : 'Your study guide has been generated successfully.',
                duration: 3000
            });
        } catch (error) {
            console.error('Study guide generation error:', error);
            addNotification({
                type: 'error',
                title: 'Generation Failed',
                message: 'Failed to generate study guide. Please try again.',
                duration: 5000
            });
            setCurrentScreen('input');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = () => {
        if (generatedGuide) {
            const markdown = generateMarkdown(generatedGuide);
            navigator.clipboard.writeText(markdown);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);

            addNotification({
                type: 'success',
                title: 'Copied!',
                message: 'Study guide copied to clipboard.',
                duration: 2000
            });
        }
    };

    const handleDownload = () => {
        if (generatedGuide) {
            const markdown = generateMarkdown(generatedGuide);
            const blob = new Blob([markdown], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${generatedGuide.subject}-study-guide.md`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            addNotification({
                type: 'success',
                title: 'Downloaded!',
                message: 'Study guide saved to your device.',
                duration: 2000
            });
        }
    };

    const resetToWelcome = () => {
        setCurrentScreen('welcome');
        setSubjectName('');
        setExamText('');
        setUploadedFiles([]);
        setGeneratedGuide(null);
    };

    const goToInput = () => {
        setCurrentScreen('input');
    };

    // Render notifications
    const renderNotifications = () => (
        <div className="fixed top-4 right-4 z-50 space-y-2">
            {notifications.map((notification: { id: number; type: string; title: string; message: string }) => (
                <div
                    key={notification.id}
                    className={`p-4 rounded-lg shadow-lg max-w-sm ${
                        notification.type === 'success' ? 'bg-green-500 text-white' :
                            notification.type === 'error' ? 'bg-red-500 text-white' :
                                'bg-blue-500 text-white'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        {notification.type === 'success' && <CheckCircle className="w-4 h-4" />}
                        {notification.type === 'error' && <AlertTriangle className="w-4 h-4" />}
                        <span className="font-medium">{notification.title}</span>
                    </div>
                    <p className="text-sm mt-1">{notification.message}</p>
                </div>
            ))}
        </div>
    );

    return (
        <div className={`${theme.background} min-h-screen`}>
            {renderNotifications()}

            {currentScreen === 'welcome' && (
                <WelcomeScreen theme={theme} onGetStarted={goToInput} />
            )}

            {currentScreen === 'input' && (
                <GuideInputForm
                    theme={theme}
                    inputMethod={inputMethod}
                    setInputMethod={setInputMethod}
                    subjectName={subjectName}
                    setSubjectName={setSubjectName}
                    examText={examText}
                    setExamText={setExamText}
                    handleFileUpload={handleFileUpload}
                    uploadedFiles={uploadedFiles}
                    setUploadedFiles={setUploadedFiles}
                    generateStudyGuide={generateStudyGuide}
                    isGenerating={isGenerating}
                    onBack={resetToWelcome}
                />
            )}

            {currentScreen === 'loading' && (
                <LoadingSpinner theme={theme} />
            )}

            {currentScreen === 'guide' && generatedGuide && (
                <GeneratedGuideDisplay
                    guide={generatedGuide}
                    theme={theme}
                    onBack={() => navigate('/dashboard')}
                    onCopy={handleCopy}
                    onDownload={handleDownload}
                    copySuccess={copySuccess}
                />
            )}
        </div>
    );
};

export default StudyGuideGenerator;