/**
 * Sensa Brand Color System
 * Unique color palette designed to evoke memory, growth, and personal development
 * Avoids overused blue-green combinations for a distinctive brand presence
 */

export const sensaBrandColors = {
  // Primary Colors - Memory & Mind
  primary: {
    // Deep Amethyst - represents depth of memory and wisdom
    amethyst: {
      hex: '#6B46C1',
      rgb: 'rgb(107, 70, 193)',
      description: 'Deep amethyst evokes the precious nature of memories and the depth of personal wisdom'
    },
    // Warm Coral - represents growth and emotional connection
    coral: {
      hex: '#F97316',
      rgb: 'rgb(249, 115, 22)',
      description: 'Warm coral symbolizes emotional warmth, personal growth, and the spark of learning'
    },
    // Rich Plum - represents sophistication and transformation
    plum: {
      hex: '#7C2D92',
      rgb: 'rgb(124, 45, 146)',
      description: 'Rich plum conveys transformation, sophistication, and the evolution of understanding'
    }
  },

  // Secondary Colors - Support & Harmony
  secondary: {
    // Golden Amber - represents illumination and insight
    amber: {
      hex: '#F59E0B',
      rgb: 'rgb(245, 158, 11)',
      description: 'Golden amber symbolizes illumination, insight, and the "aha!" moments of learning'
    },
    // Soft Rose - represents nurturing and emotional safety
    rose: {
      hex: '#EC4899',
      rgb: 'rgb(236, 72, 153)',
      description: 'Soft rose conveys emotional safety, nurturing, and the gentle nature of memory sharing'
    },
    // Sage Green - represents growth and natural development
    sage: {
      hex: '#10B981',
      rgb: 'rgb(16, 185, 129)',
      description: 'Sage green represents organic growth, natural development, and flourishing potential'
    }
  },

  // Gradient Combinations
  gradients: {
    // Primary brand gradient - Memory to Learning
    memoryToLearning: {
      css: 'linear-gradient(135deg, #6B46C1 0%, #F97316 100%)',
      description: 'From deep amethyst to warm coral - represents the journey from memory to learning'
    },
    // Wisdom gradient - Deep understanding
    wisdom: {
      css: 'linear-gradient(135deg, #7C2D92 0%, #6B46C1 50%, #EC4899 100%)',
      description: 'Plum to amethyst to rose - represents deepening wisdom and emotional connection'
    },
    // Growth gradient - Personal development
    growth: {
      css: 'linear-gradient(135deg, #F59E0B 0%, #10B981 100%)',
      description: 'Amber to sage - represents illumination leading to growth'
    },
    // Transformation gradient - Complete journey
    transformation: {
      css: 'linear-gradient(135deg, #7C2D92 0%, #6B46C1 25%, #F97316 75%, #F59E0B 100%)',
      description: 'Full spectrum - represents complete transformation through memory-powered learning'
    },
    // Subtle background gradient
    background: {
      css: 'linear-gradient(135deg, #FAF5FF 0%, #FFF7ED 50%, #FDF2F8 100%)',
      description: 'Soft background gradient using tinted whites of primary colors'
    }
  },

  // Neutral Colors
  neutrals: {
    // Warm grays with slight purple undertones
    warmGray: {
      50: { hex: '#FAFAFA', rgb: 'rgb(250, 250, 250)' },
      100: { hex: '#F5F5F5', rgb: 'rgb(245, 245, 245)' },
      200: { hex: '#E5E5E5', rgb: 'rgb(229, 229, 229)' },
      300: { hex: '#D4D4D4', rgb: 'rgb(212, 212, 212)' },
      400: { hex: '#A3A3A3', rgb: 'rgb(163, 163, 163)' },
      500: { hex: '#737373', rgb: 'rgb(115, 115, 115)' },
      600: { hex: '#525252', rgb: 'rgb(82, 82, 82)' },
      700: { hex: '#404040', rgb: 'rgb(64, 64, 64)' },
      800: { hex: '#262626', rgb: 'rgb(38, 38, 38)' },
      900: { hex: '#171717', rgb: 'rgb(23, 23, 23)' }
    }
  }
};

// Brand taglines and messaging
export const sensaBrandMessaging = {
  // Primary tagline - evolution of "Your Memories, Your Learning"
  primaryTagline: "Your memories unlock any course",
  
  // Alternative taglines
  alternativeTaglines: [
    "Where memories meet mastery",
    "Personal stories, powerful learning",
    "Your past illuminates your future",
    "Memory-powered course intelligence"
  ],
  
  // Extended messaging
  extendedTaglines: [
    "Your memories unlock any course - Sensa transforms personal experiences into personalized learning pathways",
    "Where childhood memories meet course mastery - AI-powered education that speaks to you",
    "Your stories, any subject - Sensa bridges the gap between who you are and what you want to learn"
  ],
  
  // Brand voice attributes
  voiceAttributes: [
    "Personal & Intimate",
    "Intelligent & Sophisticated", 
    "Warm & Nurturing",
    "Transformative & Empowering",
    "Trustworthy & Secure"
  ]
};

// Color psychology and rationale
export const colorRationale = {
  amethyst: {
    psychology: "Associated with wisdom, spirituality, and transformation",
    brandConnection: "Represents the precious nature of memories and the depth of personal insight",
    differentiator: "Moves away from typical corporate blues to something more personal and meaningful"
  },
  coral: {
    psychology: "Evokes warmth, enthusiasm, and emotional connection", 
    brandConnection: "Symbolizes the spark of learning and emotional engagement with education",
    differentiator: "Warmer and more approachable than traditional orange, more energetic than typical educational colors"
  },
  plum: {
    psychology: "Conveys sophistication, creativity, and transformation",
    brandConnection: "Represents the sophisticated AI technology and the transformation of learning",
    differentiator: "More sophisticated than purple, less corporate than traditional tech colors"
  },
  amber: {
    psychology: "Associated with illumination, clarity, and insight",
    brandConnection: "Represents the 'lightbulb moments' and insights gained through personalized learning",
    differentiator: "More sophisticated than yellow, warmer than gold"
  },
  rose: {
    psychology: "Evokes nurturing, emotional safety, and gentle strength",
    brandConnection: "Represents the safe space needed for sharing personal memories",
    differentiator: "More mature than pink, less aggressive than red"
  },
  sage: {
    psychology: "Associated with growth, balance, and natural development",
    brandConnection: "Represents organic learning growth and the flourishing of potential",
    differentiator: "More sophisticated than bright green, more calming than typical success colors"
  }
};

export default sensaBrandColors;