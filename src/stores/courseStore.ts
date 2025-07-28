import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Course, CourseAnalysisResult, MemoryConnection, CareerPathwayResponse, StudyMap } from '../types';

interface CourseAnalysis {
  id: string;
  courseId: string;
  analysis: CourseAnalysisResult;
  memoryConnections: MemoryConnection[];
  careerPathways: CareerPathwayResponse | null;
  studyMap: StudyMap | null;
  createdAt: Date;
}

interface CourseState {
  courses: Course[];
  analyses: CourseAnalysis[];
  selectedCourse: Course | null;
  currentAnalysis: CourseAnalysis | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  setCourses: (courses: Course[]) => void;
  setSelectedCourse: (course: Course | null) => void;
  addAnalysis: (analysis: CourseAnalysis) => void;
  setCurrentAnalysis: (analysis: CourseAnalysis | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearAnalyses: () => void;
  
  // Computed values
  getAnalysisCount: () => number;
  hasAnalyses: () => boolean;
  getAnalysisForCourse: (courseId: string) => CourseAnalysis | undefined;
}

export const useCourseStore = create<CourseState>()(
  persist(
    (set, get) => ({
      courses: [],
      analyses: [],
      selectedCourse: null,
      currentAnalysis: null,
      loading: false,
      error: null,

      setCourses: (courses) => set({ courses }),
      setSelectedCourse: (course) => set({ selectedCourse: course }),
      
      addAnalysis: (analysis) => set((state) => ({
        analyses: [...state.analyses, analysis]
      })),
      
      setCurrentAnalysis: (analysis) => set({ currentAnalysis: analysis }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      
      clearAnalyses: () => set({ 
        analyses: [], 
        currentAnalysis: null 
      }),

      // Computed values
      getAnalysisCount: () => get().analyses.length,
      hasAnalyses: () => get().analyses.length > 0,
      getAnalysisForCourse: (courseId) => get().analyses.find(a => a.courseId === courseId),
    }),
    {
      name: 'sensa-courses',
      partialize: (state) => ({ 
        courses: state.courses,
        analyses: state.analyses,
        selectedCourse: state.selectedCourse 
      }),
    }
  )
);