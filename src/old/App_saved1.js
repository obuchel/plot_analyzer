import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell } from 'recharts';
import * as Papa from 'papaparse';
import _ from 'lodash';
import nlp from 'compromise';
import './styles.css';
import * as tf from '@tensorflow/tfjs';

// Enhanced emotion categories and their impact on narrative tension with updated weights
const EMOTION_WEIGHTS = {
  "fear": 1.5,      // strong positive influence on tension
  "tension": 1.7,   // strongest positive influence (added)
  "danger": 1.8,    // strongest positive influence (added)
  "anger": 0.8,     // moderate positive influence
  "surprise": 0.6,  // moderate positive influence
  "sadness": 0.3,   // mild positive influence
  "relief": -1.2,   // strong negative influence (added)
  "joy": -0.7,      // moderate negative influence
  "disgust": 1.2    // strong positive influence (original)
};

// Colors for emotion visualization
const EMOTION_COLORS = {
  'fear': '#4e79a7',
  'anger': '#e15759',
  'joy': '#59a14f',
  'sadness': '#79706e',
  'surprise': '#edc948',
  'disgust': '#b07aa1',
  'tension': '#8c564b',
  'danger': '#d62728',
  'relief': '#2ca02c'
};

// EmoRoBERTa emotion labels mapping
// Mapping between emotion labels from the model and our application
const EMO_ROBERTA_MAPPING = {
  "anger": "anger",
  "fear": "fear",
  "joy": "joy",
  "sadness": "sadness",
  "surprise": "surprise",
  "disgust": "disgust",
  "neutral": null,
  "tension": "tension", // Added
  "danger": "danger",   // Added
  "relief": "relief"    // Added
};

// Narrative arc structure
const DEFAULT_ARC_STRUCTURE = {
  "exposition": {
    "position": 0.0,
    "tension_weight": 0.5
  },
  "inciting_incident": {
    "position": 0.12,
    "tension_weight": 0.8
  },
  "rising_action": {
    "position": 0.4,
    "tension_weight": 1.2
  },
  "climax": {
    "position": 0.75,
    "tension_weight": 2.0
  },
  "falling_action": {
    "position": 0.87,
    "tension_weight": 1.2
  },
  "resolution": {
    "position": 1.0,
    "tension_weight": 0.6
  }
};

// Common English stopwords
const STOP_WORDS = new Set(['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'by', 'in', 'of', 'is', 'was', 'were', 'be', 'been', 'being', 'am', 'are', 'with', 'this', 'that', 'these', 'those', 'they', 'them', 'their', 'it', 'its', 'from', 'as', 'if', 'then', 'than', 'when', 'where', 'which', 'who', 'whom', 'what', 'how', 'why', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'some', 'such', 'no', 'own', 'so', 'than', 'too', 'very', 'can', 'will', 'just', 'should', 'now', 'about', 'also', 'only', 'over', 'under', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'she', 'her', 'he', 'him', 'his', 'had', 'did', 'said', 'would', 'there', 'down', 'out']);

// Character and danger terms for proximity analysis
const CHARACTER_INDICATORS = [
  'he', 'she', 'they', 'him', 'her', 'them', 'his', 'hers', 'their', 'theirs',
  'man', 'woman', 'boy', 'girl', 'person', 'child', 'children', 'people', 'character',
  'protagonist', 'antagonist', 'hero', 'heroine', 'villain'
];

const DANGER_INDICATORS = [
  'danger', 'threat', 'risk', 'peril', 'hazard', 'lethal', 'deadly', 'fatal',
  'mortal', 'doom', 'death', 'die', 'kill', 'attack', 'harm', 'hurt', 'damage',
  'injure', 'wound', 'trap', 'ambush', 'betrayal', 'chase', 'escape', 'fight',
  'battle', 'war', 'weapon', 'gun', 'knife', 'blade', 'sword', 'bomb', 'explosion',
  'fire', 'burn', 'crash', 'fall', 'drown', 'suffocate', 'poison', 'toxic'
];

// Intensifier words for linguistic analysis
const INTENSIFIERS = [
  'very', 'extremely', 'incredibly', 'absolutely', 'completely', 'totally',
  'utterly', 'entirely', 'thoroughly', 'quite', 'rather', 'somewhat', 'especially',
  'particularly', 'exceptionally', 'tremendously', 'immensely', 'vastly', 'highly',
  'really', 'so', 'too', 'such', 'quite'
];

// Action verbs for pace analysis
const ACTION_VERBS = [
  'run', 'dash', 'sprint', 'race', 'chase', 'flee', 'escape', 'jump', 'leap',
  'dive', 'plunge', 'fall', 'drop', 'throw', 'toss', 'hurl', 'fling', 'shoot',
  'fire', 'blast', 'explode', 'burst', 'shatter', 'break', 'smash', 'crash',
  'hit', 'strike', 'bash', 'punch', 'kick', 'slam', 'fight', 'struggle', 'battle',
  'attack', 'charge', 'rush', 'storm', 'grab', 'seize', 'snatch', 'yank', 'push',
  'shove', 'pull', 'drag', 'rip', 'tear', 'slash', 'stab', 'cut', 'slice', 'chop'
];

// Rhetorical devices patterns for detection
const RHETORICAL_PATTERNS = {
  // Simplistic pattern detection - in a full implementation these would be more sophisticated
  hyperbole: ['never', 'always', 'every', 'all', 'none', 'ever', 'most', 'best', 'worst', 'greatest', 'tiniest'],
  simile: [' like ', ' as ', 'resembled', 'similar to'],
  metaphor: ['is a', 'was a', 'are a', 'were a']
};

function App() {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [numSegments, setNumSegments] = useState(6);
  const [segments, setSegments] = useState([]);
  const [emotionProfiles, setEmotionProfiles] = useState([]);
  const [narrativeTension, setNarrativeTension] = useState([]);
  const [actionPace, setActionPace] = useState([]);
  const [storySpecificTerms, setStorySpecificTerms] = useState({});
  const [storySpecificInput, setStorySpecificInput] = useState('');
  const [segmentationMethod, setSegmentationMethod] = useState('auto');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isCustomSegmentation, setIsCustomSegmentation] = useState(false);
  const [customSegments, setCustomSegments] = useState([{ name: 'exposition', content: '' }]);
  const [showHelp, setShowHelp] = useState(false);
  const [useCustomTerms, setUseCustomTerms] = useState(false);
  const [visualizationType, setVisualizationType] = useState('stacked');
  const [emotionChangeThreshold, setEmotionChangeThreshold] = useState(3.0);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [useStopWordRemoval, setUseStopWordRemoval] = useState(true);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [modelName, setModelName] = useState('emoroberta-base');
  const [multiFactorSegmentation, setMultiFactorSegmentation] = useState(true);
  const [factorWeights, setFactorWeights] = useState({
    emotion: 1.0,
    tension: 0.8,
    pace: 0.6,
    linguistic: 0.7, // New weight for linguistic features
    character_danger: 0.9 // New weight for character-danger proximity
  });
  const [showModelSettings, setShowModelSettings] = useState(false);
  const [tokenizer, setTokenizer] = useState(null);
  const [model, setModel] = useState(null);
  const [tensionDetectionModel, setTensionDetectionModel] = useState(null);
  const [modelEnabled, setModelEnabled] = useState(true);
  const [useContentBasedStages, setUseContentBasedStages] = useState(false);
  const [linguisticAnalysisEnabled, setLinguisticAnalysisEnabled] = useState(true); // New setting
  const [characterDangerAnalysisEnabled, setCharacterDangerAnalysisEnabled] = useState(true); // New setting
  const [linguisticFeatures, setLinguisticFeatures] = useState([]); // Store linguistic analysis results
  const [characterDangerProximity, setCharacterDangerProximity] = useState([]); // Store character-danger analysis
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(false); // Toggle for advanced features

  // Function to initialize the EmoRoBERTa model
  const initializeModel = async () => {
    if (!modelEnabled) return;
    try {
      setIsModelLoading(true);
      // In a real implementation, we would load from HuggingFace using transformers.js
      // For this demonstration, we'll simulate model loading
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log("Model initialized successfully");
      setModelLoaded(true);
      setIsModelLoading(false);
    } catch (error) {
      console.error("Error loading emotion model:", error);
      setErrorMessage("Failed to load emotion analysis model. Check console for details.");
      setIsModelLoading(false);
    };
  };

  // Run emotion analysis using the local model
  const runEmotionAnalysis = async (text) => {
    if (!modelEnabled || !text.trim()) {
      // Fallback to rule-based analysis if model isn't enabled
      return generateRuleBasedEmotions(text);
    }

    try {
      // In a real implementation, we would:
      // 1. Tokenize the text using the tokenizer
      // 2. Run the model on the tokenized input
      // 3. Process the model output
      // For demonstration, we'll simulate a model response with a delay
      await new Promise(resolve => setTimeout(resolve, Math.min(300, text.length / 10)));
      return generateMockedModelEmotions(text);
    } catch (error) {
      console.error("Error running emotion analysis:", error);
      // Fallback to rule-based approach if the model fails
      return generateRuleBasedEmotions(text);
    }
  };

  // Generate mocked emotion scores to simulate model output
  const generateMockedModelEmotions = (text) => {
    // This is a simplified algorithm to assign "random but consistent" emotion scores
    // based on the text content, just to demonstrate the UI
    const emotions = {};
    const emotionKeys = Object.keys(EMOTION_WEIGHTS);
    const textSignature = text.length + text.split(/\s+/).length;

    // Basic emotion indicators for simple pattern matching
    const emotionIndicators = {
      "fear": ["fear", "scared", "afraid", "terrified", "worried", "panic", "dread"],
      "anger": ["anger", "angry", "mad", "furious", "outraged", "rage", "hate"],
      "joy": ["joy", "happy", "excited", "thrilled", "delighted", "wonderful", "celebrate"],
      "sadness": ["sad", "unhappy", "depressed", "sorrow", "grief", "miserable", "cry"],
      "surprise": ["surprise", "shocked", "astonished", "amazed", "startled", "unexpected"],
      "tension": ["tense", "stress", "pressure", "urgent", "anxious", "nervous"], // Added
      "danger": ["danger", "threat", "risk", "peril", "hazard", "deadly", "fatal"], // Added
      "relief": ["relief", "relax", "calm", "peaceful", "ease", "comfort", "safe"], // Added
      "disgust": ["disgust", "repulsed", "revolted", "disgusted", "gross", "sickening"]
    };

    // Process text with more sophisticated approach to mimic a ML model
    // First create a base model using deterministic "random" values
    emotionKeys.forEach(emotion => {
      const seed = (textSignature * (emotionKeys.indexOf(emotion) + 1)) % 100;
      const base = seed / 20; // Range 0-5
      emotions[emotion] = base;
    });

    // Then apply a more sophisticated text analysis
    const lowerText = text.toLowerCase();

    // Adjust for presence of emotional keywords with context
    for (const [emotion, keywords] of Object.entries(emotionIndicators)) {
      let totalImpact = 0;
      keywords.forEach(term => {
        const regex = new RegExp(`\\b${term}\\b`, 'gi');
        const matches = lowerText.match(regex);
        if (matches) {
          // Get +/- 5 words around each match to analyze context
          const contextImpact = matches.reduce((acc, match) => {
            const idx = lowerText.indexOf(match);
            const start = Math.max(0, lowerText.lastIndexOf('.', idx) + 1);
            const end = lowerText.indexOf('.', idx + match.length);
            const context = lowerText.substring(start, end !== -1 ? end : lowerText.length);

            // Analyze context - check for negation and intensifiers
            const negationWords = ['not', 'never', 'no'];
            const intensifiers = INTENSIFIERS;
            let impact = 1.5; // Base impact

            // Check for negation
            if (negationWords.some(word => context.includes(`${word}`))) {
              impact *= -0.5; // Reduce or reverse impact
            }

            // Check for intensifiers
            intensifiers.forEach(intensifier => {
              if (context.includes(`${intensifier} ${term}`)) {
                impact *= 1.5; // Increase impact
              }
            });

            return acc + impact;
          }, 0);
          totalImpact += contextImpact;
        }
      });

      // Apply sophisticated impact to emotion score
      emotions[emotion] += totalImpact;
    }

    // Final normalization and adjustments
    // Normalize to 0-10 scale
    for (const emotion in emotions) {
      emotions[emotion] = Math.max(0, Math.min(10, emotions[emotion]));
    }

    // Ensure one dominant emotion is present if text is long enough
    if (text.length > 100) {
      const emotionEntries = Object.entries(emotions);
      if (Math.max(...emotionEntries.map(e => e[1])) < 5) {
        // If no strong emotion, strengthen the relatively strongest one
        const maxEmotion = emotionEntries.reduce((max, curr) => curr[1] > max[1] ? curr : max, ['', 0])[0];
        if (maxEmotion) {
          emotions[maxEmotion] = Math.min(10, emotions[maxEmotion] + 2);
        }
      }
    }

    // Add calculated tension specifically based on narrative elements
    emotions.tension = calculateNarrativeTensionScore(text);
    
    return emotions;
  };

  // Generate rule-based emotion scores (fallback)
  const generateRuleBasedEmotions = (text) => {
    const emotions = {};
    const emotionKeys = Object.keys(EMOTION_WEIGHTS);
    const lowerText = text.toLowerCase();

    // Simple emotion lexicons
    const emotionLexicon = {
      "fear": ["fear", "scared", "afraid", "terrified", "worried", "panic", "dread"],
      "anger": ["anger", "angry", "mad", "furious", "outraged", "rage", "hate"],
      "joy": ["joy", "happy", "excited", "thrilled", "delighted", "wonderful", "celebrate"],
      "sadness": ["sad", "unhappy", "depressed", "sorrow", "grief", "miserable", "cry"],
      "surprise": ["surprise", "shocked", "astonished", "amazed", "startled", "unexpected"],
      "tension": ["tense", "stress", "pressure", "urgent", "anxious", "nervous"], // Added
      "danger": ["danger", "threat", "risk", "peril", "hazard", "deadly", "fatal"], // Added
      "relief": ["relief", "relax", "calm", "peaceful", "ease", "comfort", "safe"], // Added
      "disgust": ["disgust", "repulsed", "revolted", "disgusted", "gross", "sickening"]
    };

    // Count keyword occurrences
    emotionKeys.forEach(emotion => {
      if (emotionLexicon[emotion]) {
        let count = 0;
        emotionLexicon[emotion].forEach(keyword => {
          const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
          const matches = lowerText.match(regex);
          if (matches) count += matches.length;
        });
        // Convert count to score (0-10)
        emotions[emotion] = Math.min(10, count * 2);
      } else {
        emotions[emotion] = 0;
      }
    });

    // Ensure at least some emotion is present
    if (Object.values(emotions).reduce((sum, val) => sum + val, 0) < 3) {
      // If very little emotion detected, add some based on text statistics
      emotions.tension = Math.min(10, (lowerText.split(/[!?]/).length - 1) * 1.5);
      emotions.surprise = Math.min(10, lowerText.length / 500);
    }

    // Add calculated tension score
    emotions.tension = Math.max(emotions.tension || 0, calculateNarrativeTensionScore(text));

    return emotions;
  };

  // Calculate narrative tension based on narrative elements
  const calculateNarrativeTensionScore = (text) => {
    const lowerText = text.toLowerCase();
    let tensionScore = 0;

    // Keywords indicating tension
    const tensionIndicators = [
      { words: ["conflict", "fight", "battle", "struggle", "confrontation"], weight: 1.5 },
      { words: ["problem", "challenge", "obstacle", "difficulty"], weight: 1.0 },
      { words: ["danger", "threat", "risk", "peril"], weight: 2.0 },
      { words: ["time", "deadline", "hurry", "quick"], weight: 0.8 },
      { words: ["but", "however", "although", "despite", "though"], weight: 0.3 },
    ];

    // Check for presence of tension indicators
    tensionIndicators.forEach(indicator => {
      indicator.words.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = lowerText.match(regex);
        if (matches) {
          tensionScore += matches.length * indicator.weight;
        }
      });
    });

    // Check for markers of high tension in writing style
    const exclamationCount = (lowerText.match(/!/g) || []).length;
    const questionCount = (lowerText.match(/\?/g) || []).length;
    const ellipsisCount = (lowerText.match(/\.\.\./g) || []).length;
    tensionScore += exclamationCount * 0.5;
    tensionScore += questionCount * 0.3;
    tensionScore += ellipsisCount * 0.2;

    // Normalize to 0-10 scale
    return Math.min(10, tensionScore);
  };

  // NEW: Analyze linguistic features of text
  const analyzeLinguisticFeatures = (text) => {
    if (!linguisticAnalysisEnabled || !text.trim()) {
      return {
        sentenceLength: 0,
        clauseComplexity: 0,
        questions: 0,
        imperatives: 0,
        emphasis: 0,
        intensifiers: 0,
        repetition: 0,
        rhetorical: 0
      };
    }

    try {
      const sentences = sentenceTokenize(text);
      const lowerText = text.toLowerCase();
      const words = text.split(/\s+/).filter(w => w.trim().length > 0);
      
      // 1. Sentence structure analysis
      const avgSentenceLength = sentences.length > 0 ? 
        words.length / sentences.length : 0;
      
      // Estimate clause complexity by counting commas and conjunctions
      const commaCount = (text.match(/,/g) || []).length;
      const conjunctions = ['and', 'but', 'or', 'nor', 'for', 'yet', 'so', 'because', 'although', 'since', 'unless', 'while'];
      let conjunctionCount = 0;
      conjunctions.forEach(conj => {
        const regex = new RegExp(`\\b${conj}\\b`, 'gi');
        const matches = text.match(regex);
        if (matches) conjunctionCount += matches.length;
      });
      
      const clauseComplexity = sentences.length > 0 ? 
        (commaCount + conjunctionCount) / sentences.length : 0;
      
      // Question and imperative detection
      const questionCount = sentences.filter(s => s.trim().endsWith('?')).length;
      
      // Simple imperative detection - sentences starting with verbs
      const doc = nlp(text);
      const potentialImperatives = sentences.filter(s => {
        const firstWord = s.trim().split(/\s+/)[0].toLowerCase();
        const firstWordDoc = nlp(firstWord);
        return firstWordDoc.verbs().length > 0;
      });
      const imperativeCount = potentialImperatives.length;
      
      // 2. Stylistic element identification
      const emphasisMarkers = (text.match(/[*_]{1,2}[^*_]+[*_]{1,2}/g) || []).length; // Markdown style emphasis
      const heavyPunctuation = (text.match(/[!?]{2,}/g) || []).length;
      
      // Count intensifiers
      let intensifierCount = 0;
      INTENSIFIERS.forEach(intensifier => {
        const regex = new RegExp(`\\b${intensifier}\\b`, 'gi');
        const matches = text.match(regex);
        if (matches) intensifierCount += matches.length;
      });
      
      // Detect repetition patterns
      // Simple repetition detection - repeated words or phrases
      const words3 = text.toLowerCase().split(/\s+/).map(w => w.replace(/[^\w]/g, ''));
      let repetitionCount = 0;
      for (let i = 0; i < words3.length - 1; i++) {
        if (words3[i] && words3[i] === words3[i+1]) {
          repetitionCount++;
        }
      }
      
      // 3. Rhetorical device recognition
      let rhetoricalCount = 0;
      
      // Check for hyperbole
      RHETORICAL_PATTERNS.hyperbole.forEach(term => {
        const regex = new RegExp(`\\b${term}\\b`, 'gi');
        const matches = text.match(regex);
        if (matches) rhetoricalCount += matches.length * 0.5;
      });
      
      // Check for similes and metaphors
      RHETORICAL_PATTERNS.simile.forEach(pattern => {
        rhetoricalCount += (text.toLowerCase().split(pattern).length - 1) * 0.8;
      });
      
      RHETORICAL_PATTERNS.metaphor.forEach(pattern => {
        rhetoricalCount += (text.toLowerCase().split(pattern).length - 1) * 0.8;
      });
      
      // Normalize all values to 0-10 scale
      const normalizedFeatures = {
        sentenceLength: Math.min(10, avgSentenceLength / 3),
        clauseComplexity: Math.min(10, clauseComplexity * 3),
        questions: Math.min(10, (questionCount / sentences.length) * 20),
        imperatives: Math.min(10, (imperativeCount / sentences.length) * 20),
        emphasis: Math.min(10, (emphasisMarkers + heavyPunctuation) / (sentences.length / 2)),
        intensifiers: Math.min(10, intensifierCount / (words.length / 50) * 2),
        repetition: Math.min(10, repetitionCount * 2),
        rhetorical: Math.min(10, rhetoricalCount)
      };
      
      return normalizedFeatures;
    } catch (error) {
      console.error("Error analyzing linguistic features:", error);
      return {
        sentenceLength: 0,
        clauseComplexity: 0,
        questions: 0,
        imperatives: 0,
        emphasis: 0,
        intensifiers: 0,
        repetition: 0,
        rhetorical: 0
      };
    }
  };

  // NEW: Calculate character-danger proximity
  const calculateCharacterDangerProximity = (text) => {
    if (!characterDangerAnalysisEnabled || !text.trim()) {
      return 0;
    }

    try {
      const sentences = sentenceTokenize(text);
      const lowerText = text.toLowerCase();
      let proximityScore = 0;
      
      // Specific character names from the text or custom inputs
      const customCharacterNames = storySpecificInput
        .split(',')
        .map(term => term.trim().toLowerCase())
        .filter(term => term.length > 0);
      
      const allCharacterTerms = [...CHARACTER_INDICATORS, ...customCharacterNames];
      
      // 1. Find sentences containing both character references and danger terms
      sentences.forEach(sentence => {
        const lowerSentence = sentence.toLowerCase();
        
        // Check if sentence contains both character and danger terms
        const hasCharacter = allCharacterTerms.some(term => 
          new RegExp(`\\b${term}\\b`, 'i').test(lowerSentence));
          
        const hasDanger = DANGER_INDICATORS.some(term => 
          new RegExp(`\\b${term}\\b`, 'i').test(lowerSentence));
          
        if (hasCharacter && hasDanger) {
          // Basic proximity - they appear in the same sentence
          proximityScore += 1;
          
          // Advanced: check character as subject of danger
          // This is a simplified approach - ideally would use proper NLP parsing
          const doc = nlp(sentence);
          const subjects = doc.match('#Noun').before('#Verb').out('array');
          const objects = doc.match('#Noun').after('#Verb').out('array');
          
          // Check if any character term is in subject position
          const characterIsSubject = subjects.some(subject => 
            allCharacterTerms.some(term => 
              subject.toLowerCase().includes(term)));
              
          // If character is subject of danger action, higher score
          if (characterIsSubject) proximityScore += 0.5;
          
          // Check for direct danger to character (character as object)
          const characterIsObject = objects.some(object => 
            allCharacterTerms.some(term => 
              object.toLowerCase().includes(term)));
              
          // If character is object of danger action, highest score
          if (characterIsObject) proximityScore += 1;
        }
      });
      
      // Normalize to 0-10 scale based on text length
      return Math.min(10, (proximityScore / sentences.length) * 25);
    } catch (error) {
      console.error("Error calculating character-danger proximity:", error);
      return 0;
    }
  };

  // Function to split text into sentences
  const sentenceTokenize = (text) => {
    // Handle common abbreviations and edge cases
    const preparedText = text
      .replace(/([.?!])\s*(?=[A-Z])/g, "$1|")
      .replace(/(\b[A-Z][a-z]{1,2})\./g, "$1|") // Handle abbreviations like Mr. Dr. etc.
      .replace(/\.\.\./g, "…"); // Handle ellipsis
    return preparedText.split(/[|]/).filter(sentence => sentence.trim().length > 0);
  };

  // NEW: Enhanced action pace calculation with linguistic features
  const calculateActionPace = (text) => {
    try {
      const doc = nlp(text);
      
      // Get all verbs
      const verbs = doc.verbs().out('array');
      
      // Get total words excluding punctuation and whitespace
      const totalWords = text.split(/\s+/).filter(w => w.trim().length > 0).length;
      if (totalWords === 0) return 0;
      
      // Focus on action verbs by checking verb properties in Compromise
      const actionVerbs = doc.verbs().if('#PresentTense').out('array');
      
      // Enhanced: Specifically look for verbs in our action verb list
      let highImpactActionCount = 0;
      ACTION_VERBS.forEach(actionVerb => {
        const regex = new RegExp(`\\b${actionVerb}\\b`, 'gi');
        const matches = text.match(regex);
        if (matches) highImpactActionCount += matches.length;
      });
      
      // Calculate verb density with NLP tagging (more accurate than simple word lists)
      // Calculate verb density with NLP tagging (more accurate than simple word lists)
      const verbDensity = (verbs.length / totalWords) * 100;
      const actionVerbDensity = (actionVerbs.length / totalWords) * 100;
      
      // Calculate high-impact action verb density
      const highImpactDensity = (highImpactActionCount / totalWords) * 100;
      
      // Sentence structure analysis for pace
      const sentences = sentenceTokenize(text);
      const avgSentenceLength = totalWords / sentences.length;
      
      // Short sentences often indicate faster pace
      const shortSentenceFactor = Math.max(0, 20 - avgSentenceLength) / 10;
      
      // Check for dialog density - often increases perceived pace
      const dialogLines = (text.match(/["'][^"']+["']/g) || []).length;
      const dialogDensity = dialogLines / sentences.length;
      
      // Count sentence fragments (ends with ... or -) which can indicate urgency/pace
      const fragments = sentences.filter(s => 
        s.trim().endsWith('...') || 
        s.trim().endsWith('-') || 
        s.trim().length < 8).length;
      const fragmentRatio = fragments / sentences.length;
      
      // Count exclamation marks - indicate excitement/urgency
      const exclamations = (text.match(/!/g) || []).length;
      const exclamationDensity = exclamations / sentences.length;
      
      // Combine all factors with weights
      const paceScore = (
        (verbDensity * 0.3) + 
        (actionVerbDensity * 0.4) + 
        (highImpactDensity * 0.6) + 
        (shortSentenceFactor * 0.5) + 
        (dialogDensity * 0.3) + 
        (fragmentRatio * 0.4) + 
        (exclamationDensity * 0.5)
      );
      
      // Normalize to 0-10 scale
      return Math.min(10, paceScore);
    } catch (error) {
      console.error("Error calculating action pace:", error);
      return 0; // Default to no pace on error
    }
  };

  // NEW: Enhanced segmentation algorithm that uses multiple factors
  const segmentTextByMultipleFactors = (text, numSegments) => {
    try {
      // 1. First analyze the whole text
      const sentences = sentenceTokenize(text);
      if (sentences.length < numSegments) {
        // If we have fewer sentences than desired segments, fall back to simple division
        return segmentTextByLength(text, numSegments);
      }
      
      // 2. Calculate various metrics for each sentence
      const sentenceData = sentences.map((sentence, idx) => {
        // This is a simplification - ideally we'd perform deeper analysis on each sentence
        const emotions = generateMockedModelEmotions(sentence);
        const tension = calculateNarrativeTensionScore(sentence);
        const pace = calculateActionPace(sentence);
        const linguistic = linguisticAnalysisEnabled ? 
          analyzeLinguisticFeatures(sentence) : null;
        const characterDanger = characterDangerAnalysisEnabled ? 
          calculateCharacterDangerProximity(sentence) : 0;
        
        return {
          index: idx,
          text: sentence,
          emotions,
          tension,
          pace,
          linguistic,
          characterDanger
        };
      });
      
      // 3. Identify potential breakpoints using a change-point detection algorithm
      // Based on weighted combination of all factors
      const changePoints = [];
      const factorWeightsCopy = { ...factorWeights };
      
      // For each pair of adjacent sentences, calculate change score
      for (let i = 1; i < sentenceData.length; i++) {
        const prev = sentenceData[i-1];
        const curr = sentenceData[i];
        
        // Calculate emotion change
        let emotionChangeScore = 0;
        Object.keys(EMOTION_WEIGHTS).forEach(emotion => {
          if (prev.emotions[emotion] !== undefined && curr.emotions[emotion] !== undefined) {
            emotionChangeScore += Math.abs(curr.emotions[emotion] - prev.emotions[emotion]);
          }
        });
        emotionChangeScore = emotionChangeScore / Object.keys(EMOTION_WEIGHTS).length;
        
        // Calculate tension change
        const tensionChange = Math.abs(curr.tension - prev.tension);
        
        // Calculate pace change
        const paceChange = Math.abs(curr.pace - prev.pace);
        
        // Calculate linguistic feature changes
        let linguisticChange = 0;
        if (linguisticAnalysisEnabled && curr.linguistic && prev.linguistic) {
          const lingFeatures = ['sentenceLength', 'clauseComplexity', 'emphasis', 'rhetorical'];
          lingFeatures.forEach(feature => {
            linguisticChange += Math.abs(curr.linguistic[feature] - prev.linguistic[feature]);
          });
          linguisticChange = linguisticChange / lingFeatures.length;
        }
        
        // Calculate character-danger proximity change
        const characterDangerChange = Math.abs(curr.characterDanger - prev.characterDanger);
        
        // Weight each factor and combine
        const weightedChangeScore = 
          (emotionChangeScore * factorWeightsCopy.emotion) +
          (tensionChange * factorWeightsCopy.tension) +
          (paceChange * factorWeightsCopy.pace) +
          (linguisticChange * factorWeightsCopy.linguistic) +
          (characterDangerChange * factorWeightsCopy.character_danger);
          
        changePoints.push({
          index: i,
          score: weightedChangeScore,
          emotionScore: emotionChangeScore,
          tensionScore: tensionChange,
          paceScore: paceChange,
          linguisticScore: linguisticChange,
          characterDangerScore: characterDangerChange
        });
      }
      
      // 4. Sort change points by score and select top numSegments-1 breakpoints
      changePoints.sort((a, b) => b.score - a.score);
      const topBreakpoints = changePoints
        .slice(0, numSegments - 1)
        .sort((a, b) => a.index - b.index);
      
      // 5. Create segments using breakpoints
      const segments = [];
      let startIndex = 0;
      
      topBreakpoints.forEach(breakpoint => {
        const segmentSentences = sentences.slice(startIndex, breakpoint.index);
        segments.push(segmentSentences.join(' '));
        startIndex = breakpoint.index;
      });
      
      // Add the final segment
      const finalSegmentSentences = sentences.slice(startIndex);
      segments.push(finalSegmentSentences.join(' '));
      
      return segments;
    } catch (error) {
      console.error("Error in multi-factor segmentation:", error);
      // Fallback to simple length-based segmentation
      return segmentTextByLength(text, numSegments);
    }
  };

  // Simple segmentation by text length
  const segmentTextByLength = (text, numSegments) => {
    const segmentSize = Math.ceil(text.length / numSegments);
    const segments = [];
    
    // Try to segment at sentence boundaries where possible
    const sentences = sentenceTokenize(text);
    let currentSegment = '';
    let currentSentences = [];
    
    sentences.forEach(sentence => {
      if ((currentSegment + sentence).length > segmentSize && currentSegment.length > 0) {
        segments.push(currentSegment);
        currentSegment = sentence;
        currentSentences = [sentence];
      } else {
        currentSegment += (currentSegment ? ' ' : '') + sentence;
        currentSentences.push(sentence);
      }
    });
    
    // Add the last segment
    if (currentSegment) {
      segments.push(currentSegment);
    }
    
    // Ensure we have exactly numSegments
    while (segments.length < numSegments) {
      // Find longest segment and split it
      let longestIdx = 0;
      let maxLength = 0;
      
      segments.forEach((segment, idx) => {
        if (segment.length > maxLength) {
          maxLength = segment.length;
          longestIdx = idx;
        }
      });
      
      const toSplit = segments[longestIdx];
      const splitSentences = sentenceTokenize(toSplit);
      
      if (splitSentences.length <= 1) {
        // Can't split by sentence, split by length
        const midpoint = Math.floor(toSplit.length / 2);
        // Try to split at word boundary
        let splitPoint = toSplit.lastIndexOf(' ', midpoint);
        if (splitPoint === -1) splitPoint = midpoint;
        
        const firstHalf = toSplit.substring(0, splitPoint).trim();
        const secondHalf = toSplit.substring(splitPoint).trim();
        
        segments[longestIdx] = firstHalf;
        segments.splice(longestIdx + 1, 0, secondHalf);
      } else {
        // Split at sentence boundary
        const midIdx = Math.floor(splitSentences.length / 2);
        const firstHalf = splitSentences.slice(0, midIdx).join(' ');
        const secondHalf = splitSentences.slice(midIdx).join(' ');
        
        segments[longestIdx] = firstHalf;
        segments.splice(longestIdx + 1, 0, secondHalf);
      }
    }
    
    // If we have too many segments, merge the shortest ones
    while (segments.length > numSegments) {
      let shortestIdx = 0;
      let nextShortestIdx = 1;
      let minLength = segments[0].length + segments[1].length;
      
      for (let i = 0; i < segments.length - 1; i++) {
        const combinedLength = segments[i].length + segments[i + 1].length;
        if (combinedLength < minLength) {
          minLength = combinedLength;
          shortestIdx = i;
          nextShortestIdx = i + 1;
        }
      }
      
      // Merge the two shortest adjacent segments
      segments[shortestIdx] = segments[shortestIdx] + ' ' + segments[nextShortestIdx];
      segments.splice(nextShortestIdx, 1);
    }
    
    return segments;
  };
  
  // Content-based segmentation using naive Bayes approach
  const segmentTextByContent = (text) => {
    try {
      // This would ideally use a trained model to identify narrative stages
      // For this demo, we'll use a simplified approach based on content hints
      const segments = {};
      const lowerText = text.toLowerCase();
      const sentences = sentenceTokenize(text);
      
      // Stage indicators (simplified)
      const stageIndicators = {
        "exposition": [
          "once upon a time", "in the beginning", "long ago", "it all started", 
          "introduction", "setting", "background", "initial", "first", "opened with"
        ],
        "inciting_incident": [
          "suddenly", "but then", "until one day", "everything changed", "discovered",
          "realized", "learned", "unexpected", "surprised", "shocking"
        ],
        "rising_action": [
          "began to", "started to", "increasingly", "more and more", "growing",
          "developing", "building", "escalating", "intensifying", "challenge"
        ],
        "climax": [
          "finally", "at last", "ultimate", "climactic", "turning point", "decisive",
          "critical moment", "breaking point", "confrontation", "face to face"
        ],
        "falling_action": [
          "aftermath", "after the", "following", "consequence", "result", "outcome",
          "subsiding", "calming", "winding down", "resolving"
        ],
        "resolution": [
          "eventually", "in the end", "finally", "at last", "concluded", "resolved",
          "ending", "closure", "wrapped up", "settled", "epilogue"
        ]
      };
      
      // Assign each sentence to a stage
      const sentenceStages = sentences.map(sentence => {
        const lowerSentence = sentence.toLowerCase();
        const stageScores = {};
        
        // Calculate score for each stage
        Object.entries(stageIndicators).forEach(([stage, indicators]) => {
          let score = 0;
          indicators.forEach(indicator => {
            if (lowerSentence.includes(indicator)) {
              score += 1;
            }
          });
          stageScores[stage] = score;
        });
        
        // Add position bias - earlier sentences more likely exposition, etc.
        const sentenceIndex = sentences.indexOf(sentence);
        const normalizedPosition = sentenceIndex / sentences.length;
        
        Object.entries(DEFAULT_ARC_STRUCTURE).forEach(([stage, config]) => {
          // Position influence diminishes as we move from ideal position
          const positionDiff = Math.abs(normalizedPosition - config.position);
          const positionInfluence = Math.max(0, 1 - (positionDiff * 2));
          stageScores[stage] += positionInfluence;
        });
        
        // Find stage with highest score
        let maxScore = -1;
        let assignedStage = "exposition"; // Default
        
        Object.entries(stageScores).forEach(([stage, score]) => {
          if (score > maxScore) {
            maxScore = score;
            assignedStage = stage;
          }
        });
        
        return {
          text: sentence,
          stage: assignedStage
        };
      });
      
      // Group sentences by stage
      Object.keys(stageIndicators).forEach(stage => {
        const stageContent = sentenceStages
          .filter(item => item.stage === stage)
          .map(item => item.text)
          .join(' ');
          
        segments[stage] = stageContent;
      });
      
      // Make sure we have content for each stage
      // If a stage is empty, borrow from adjacent stages
      const orderedStages = Object.keys(DEFAULT_ARC_STRUCTURE);
      
      orderedStages.forEach((stage, index) => {
        if (!segments[stage] || segments[stage].length === 0) {
          // Find nearest non-empty stage
          let nearestContent = '';
          let distance = 1;
          
          while (distance <= orderedStages.length && !nearestContent) {
            // Check preceding stage
            if (index - distance >= 0) {
              const prevStage = orderedStages[index - distance];
              if (segments[prevStage] && segments[prevStage].length > 0) {
                nearestContent = segments[prevStage];
              }
            }
            
            // Check following stage
            if (!nearestContent && index + distance < orderedStages.length) {
              const nextStage = orderedStages[index + distance];
              if (segments[nextStage] && segments[nextStage].length > 0) {
                nearestContent = segments[nextStage];
              }
            }
            
            distance++;
          }
          
          // If we found content, set default for this stage
          if (nearestContent) {
            segments[stage] = "Default content for " + stage.replace('_', ' ');
          } else {
            // Last resort
            segments[stage] = "Default content for " + stage.replace('_', ' ');
          }
        }
      });
      
      // Return segments in order
      return orderedStages.map(stage => segments[stage]);
    } catch (error) {
      console.error("Error in content-based segmentation:", error);
      // Fallback to simple length-based segmentation
      return segmentTextByLength(text, 6);
    }
  };

  // Function to analyze text and calculate various metrics
  const analyzeText = async () => {
    try {
      setIsAnalyzing(true);
      setErrorMessage('');
      
      // If the text is empty, show an error
      if (!text.trim()) {
        setErrorMessage('Please enter a text to analyze.');
        setIsAnalyzing(false);
        return;
      }
      
      // Determine segments based on chosen method
      let textSegments = [];
      
      if (isCustomSegmentation) {
        // Use user-defined segments
        textSegments = customSegments.map(segment => segment.content);
      } else if (useContentBasedStages) {
        // Use content-based stages
        textSegments = segmentTextByContent(text);
      } else if (multiFactorSegmentation) {
        // Use multi-factor segmentation
        textSegments = segmentTextByMultipleFactors(text, numSegments);
      } else {
        // Use simple length-based segmentation
        textSegments = segmentTextByLength(text, numSegments);
      }
      
      // Calculate emotion profiles for each segment
      const profiles = await Promise.all(textSegments.map(async segment => {
        return await runEmotionAnalysis(segment);
      }));
      
      // Calculate narrative tension for each segment
      const tensions = textSegments.map((segment, index) => {
        // Base tension on emotion profile
        const emotions = profiles[index];
        let tensionScore = 0;
        
        // Calculate tension based on weighted emotion values
        Object.entries(EMOTION_WEIGHTS).forEach(([emotion, weight]) => {
          if (emotions[emotion] !== undefined) {
            tensionScore += emotions[emotion] * weight;
          }
        });
        
        // Normalize to 0-10 scale
        return {
          segment: index,
          tension: Math.min(10, Math.max(0, tensionScore / 5))
        };
      });
      
      // Calculate action pace for each segment
      const paces = textSegments.map((segment, index) => {
        return {
          segment: index,
          pace: calculateActionPace(segment)
        };
      });
      
      // Calculate linguistic features for each segment if enabled
      let linguisticData = [];
      if (linguisticAnalysisEnabled) {
        linguisticData = textSegments.map((segment, index) => {
          return {
            segment: index,
            features: analyzeLinguisticFeatures(segment)
          };
        });
      }
      
      // Calculate character-danger proximity for each segment if enabled
      let proximityData = [];
      if (characterDangerAnalysisEnabled) {
        proximityData = textSegments.map((segment, index) => {
          return {
            segment: index,
            proximity: calculateCharacterDangerProximity(segment)
          };
        });
      }
      
      // Analyze story-specific terms if enabled
      let storyTerms = {};
      if (useCustomTerms && storySpecificInput.trim()) {
        const terms = storySpecificInput.split(',').map(term => term.trim());
        
        storyTerms = terms.reduce((acc, term) => {
          if (term) {
            const termFrequency = textSegments.map((segment, index) => {
              const regex = new RegExp(`\\b${term}\\b`, 'gi');
              const matches = segment.match(regex) || [];
              return {
                segment: index,
                frequency: matches.length,
                normalizedFrequency: segment.length > 0 ? 
                  (matches.length / segment.split(/\s+/).length) * 1000 : 0
              };
            });
            
            acc[term] = termFrequency;
          }
          return acc;
        }, {});
      }
      
      // Update state with all analysis results
      setSegments(textSegments);
      setEmotionProfiles(profiles);
      setNarrativeTension(tensions);
      setActionPace(paces);
      setStorySpecificTerms(storyTerms);
      setLinguisticFeatures(linguisticData);
      setCharacterDangerProximity(proximityData);
      
      setIsAnalyzing(false);
    } catch (error) {
      console.error("Error analyzing text:", error);
      setErrorMessage('An error occurred during analysis. Please try again.');
      setIsAnalyzing(false);
    }
  };

  // Initialize model on component mount
  useEffect(() => {
    initializeModel();
  }, []);

  // Reset error message when text changes
  useEffect(() => {
    setErrorMessage('');
  }, [text]);

  // Prepare data for tension chart
  const prepareTensionChartData = () => {
    return narrativeTension.map((item, index) => ({
      name: `Segment ${index + 1}`,
      tension: item.tension
    }));
  };

  // Prepare data for emotion stacked chart
  const prepareEmotionChartData = () => {
    const data = [];
    
    for (let i = 0; i < segments.length; i++) {
      const item = { name: `Segment ${i + 1}` };
      
      if (emotionProfiles[i]) {
        Object.entries(emotionProfiles[i]).forEach(([emotion, value]) => {
          if (Object.keys(EMOTION_WEIGHTS).includes(emotion)) {
            item[emotion] = value;
          }
        });
      }
      
      data.push(item);
    }
    
    return data;
  };

  // Prepare data for pace chart
  const preparePaceChartData = () => {
    return actionPace.map((item, index) => ({
      name: `Segment ${index + 1}`,
      pace: item.pace
    }));
  };

  // Prepare data for linguistic features chart
  const prepareLinguisticChartData = () => {
    if (!linguisticAnalysisEnabled || linguisticFeatures.length === 0) return [];
    
    return linguisticFeatures.map((item, index) => {
      const data = { name: `Segment ${index + 1}` };
      if (item.features) {
        Object.entries(item.features).forEach(([feature, value]) => {
          data[feature] = value;
        });
      }
      return data;
    });
  };

  // Prepare data for character-danger proximity chart
  const prepareProximityChartData = () => {
    if (!characterDangerAnalysisEnabled || characterDangerProximity.length === 0) return [];
    
    return characterDangerProximity.map((item, index) => ({
      name: `Segment ${index + 1}`,
      proximity: item.proximity
    }));
  };

  // Function to detect significant emotion changes
  const detectEmotionChanges = () => {
    if (emotionProfiles.length < 2) return [];
    
    const changes = [];
    for (let i = 1; i < emotionProfiles.length; i++) {
      const prevEmotions = emotionProfiles[i-1];
      const currEmotions = emotionProfiles[i];
      
      const emotionChanges = {};
      let totalChange = 0;
      
      Object.keys(EMOTION_WEIGHTS).forEach(emotion => {
        if (prevEmotions[emotion] !== undefined && currEmotions[emotion] !== undefined) {
          const change = currEmotions[emotion] - prevEmotions[emotion];
          emotionChanges[emotion] = change;
          totalChange += Math.abs(change);
        }
      });
      
      // Find the emotion with the largest change
      let largestEmotion = '';
      let largestChange = 0;
      
      Object.entries(emotionChanges).forEach(([emotion, change]) => {
        if (Math.abs(change) > Math.abs(largestChange)) {
          largestEmotion = emotion;
          largestChange = change;
        }
      });
      
      // Only add significant changes
      if (totalChange >= emotionChangeThreshold) {
        changes.push({
          segment: i,
          totalChange,
          largestEmotion,
          largestChange,
          details: emotionChanges
        });
      }
    }
    
    return changes;
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setText(e.target.result);
    };
    reader.readAsText(file);
  };

  // Handle segment customization
  const handleAddSegment = () => {
    setCustomSegments([...customSegments, { name: 'new_segment', content: '' }]);
  };

  const handleRemoveSegment = (index) => {
    const newSegments = [...customSegments];
    newSegments.splice(index, 1);
    setCustomSegments(newSegments);
  };

  const handleSegmentChange = (index, field, value) => {
    const newSegments = [...customSegments];
    newSegments[index][field] = value;
    setCustomSegments(newSegments);
  };

  //return;
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Advanced Narrative Analysis Tool</h1>
        <p className="version">Version 2.1 - Enhanced Linguistic Features</p>
      </header>
      
      <div className="control-panel">
        <div className="input-section">
          <div className="title-input">
            <label htmlFor="title">Story Title:</label>
            <input 
              type="text" 
              id="title" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="Enter story title" 
            />
          </div>
          
          <div className="text-input">
            <label htmlFor="text">Enter your narrative text:</label>
            <textarea 
              id="text" 
              value={text} 
              onChange={e => setText(e.target.value)} 
              placeholder="Paste your narrative text here..."
              rows={10}
            />
          </div>
          
          <div className="file-upload">
            <label>Or upload a text file:</label>
            <input type="file" accept=".txt" onChange={handleFileUpload} />
          </div>
        </div>
        
        <div className="settings-section">
          <div className="segmentation-settings">
            <h3>Segmentation Settings</h3>
            
            <div className="setting-group">
              <label>
                <input 
                  type="radio" 
                  checked={!isCustomSegmentation && !useContentBasedStages} 
                  onChange={() => {
                    setIsCustomSegmentation(false);
                    setUseContentBasedStages(false);
                  }} 
                />
                Automatic Segmentation
              </label>
              
              {!isCustomSegmentation && !useContentBasedStages && (
                <div className="sub-settings">
                  <div className="setting-item">
                    <label htmlFor="num-segments">Number of segments:</label>
                    <input 
                      type="number" 
                      id="num-segments" 
                      min="2" 
                      max="20" 
                      value={numSegments} 
                      onChange={e => setNumSegments(parseInt(e.target.value))} 
                    />
                  </div>
                  
                  <div className="setting-item">
                    <label>
                      <input 
                        type="checkbox" 
                        checked={multiFactorSegmentation} 
                        onChange={e => setMultiFactorSegmentation(e.target.checked)} 
                      />
                      Use multi-factor segmentation
                    </label>
                  </div>
                </div>
              )}
              
              <label>
                <input 
                  type="radio" 
                  checked={useContentBasedStages} 
                  onChange={() => {
                    setIsCustomSegmentation(false);
                    setUseContentBasedStages(true);
                  }} 
                />
                Content-based Stages
              </label>
              
              <label>
                <input 
                  type="radio" 
                  checked={isCustomSegmentation} 
                  onChange={() => {
                    setIsCustomSegmentation(true);
                    setUseContentBasedStages(false);
                  }} 
                />
                Custom Segmentation
              </label>
              
              {isCustomSegmentation && (
                <div className="custom-segments">
                  {customSegments.map((segment, index) => (
                    <div key={index} className="custom-segment">
                      <input
                        type="text"
                        value={segment.name}
                        onChange={e => handleSegmentChange(index, 'name', e.target.value)}
                        placeholder="Segment name"
                      />
                      <textarea
                        value={segment.content}
                        onChange={e => handleSegmentChange(index, 'content', e.target.value)}
                        placeholder="Segment text"
                        rows={3}
                      />
                      <button onClick={() => handleRemoveSegment(index)}>Remove</button>
                    </div>
                  ))}
                  <button onClick={handleAddSegment}>Add Segment</button>
                </div>
              )}
            </div>
          </div>
          
          <div className="analysis-settings">
            <h3>Analysis Settings</h3>
            
            <div className="setting-group">
              <div className="setting-item">
                <label>
                  <input 
                    type="checkbox" 
                    checked={useCustomTerms} 
                    onChange={e => setUseCustomTerms(e.target.checked)} 
                  />
                  Use custom story-specific terms
                </label>
              </div>
              
              {useCustomTerms && (
                <div className="sub-settings">
                  <div className="setting-item">
                    <label htmlFor="custom-terms">Custom terms (comma-separated):</label>
                    <input 
                      type="text" 
                      id="custom-terms" 
                      value={storySpecificInput} 
                      onChange={e => setStorySpecificInput(e.target.value)} 
                      placeholder="character names, places, objects" 
                    />
                  </div>
                </div>
              )}
              
              <div className="setting-item">
                <label>
                  <input 
                    type="checkbox" 
                    checked={modelEnabled} 
                    onChange={e => setModelEnabled(e.target.checked)} 
                  />
                  Use emotion model
                </label>
              </div>
              
              <div className="setting-item">
                <label>
                  <input 
                    type="checkbox" 
                    checked={linguisticAnalysisEnabled} 
                    onChange={e => setLinguisticAnalysisEnabled(e.target.checked)} 
                  />
                  Enable linguistic analysis
                </label>
              </div>
              
              <div className="setting-item">
                <label>
                  <input 
                    type="checkbox" 
                    checked={characterDangerAnalysisEnabled} 
                    onChange={e => setCharacterDangerAnalysisEnabled(e.target.checked)} 
                  />
                  Enable character-danger analysis
                </label>
              </div>
              
              <div className="setting-item">
                <button onClick={() => setShowAdvancedFeatures(!showAdvancedFeatures)}>
                  {showAdvancedFeatures ? 'Hide Advanced Features' : 'Show Advanced Features'}
                </button>
              </div>
              
              {showAdvancedFeatures && (
                <div className="advanced-settings">
                  <h4>Factor Weights</h4>
                  
                  <div className="setting-item">
                  <label>Emotion Weight:</label>
                    <input
                      type="number"
                      step="0.1"
                      value={factorWeights.emotion}
                      onChange={e => setFactorWeights({...factorWeights, emotion: parseFloat(e.target.value)})}
                      min="0"
                      max="2"
                    />
                  </div>

                  <div className="setting-item">
                    <label>Tension Weight:</label>
                    <input
                      type="number"
                      step="0.1"
                      value={factorWeights.tension}
                      onChange={e => setFactorWeights({...factorWeights, tension: parseFloat(e.target.value)})}
                      min="0"
                      max="2"
                    />
                  </div>

                  <div className="setting-item">
                    <label>Pace Weight:</label>
                    <input
                      type="number"
                      step="0.1"
                      value={factorWeights.pace}
                      onChange={e => setFactorWeights({...factorWeights, pace: parseFloat(e.target.value)})}
                      min="0"
                      max="2"
                    />
                  </div>

                  <div className="setting-item">
                    <label>Linguistic Weight:</label>
                    <input
                      type="number"
                      step="0.1"
                      value={factorWeights.linguistic}
                      onChange={e => setFactorWeights({...factorWeights, linguistic: parseFloat(e.target.value)})}
                      min="0"
                      max="2"
                    />
                  </div>

                  <div className="setting-item">
                    <label>Character-Danger Weight:</label>
                    <input
                      type="number"
                      step="0.1"
                      value={factorWeights.character_danger}
                      onChange={e => setFactorWeights({...factorWeights, character_danger: parseFloat(e.target.value)})}
                      min="0"
                      max="2"
                    />
                  </div>

                  <h4>Advanced Parameters</h4>
                  
                  <div className="setting-item">
                    <label>Emotion Change Threshold:</label>
                    <input
                      type="number"
                      step="0.1"
                      value={emotionChangeThreshold}
                      onChange={e => setEmotionChangeThreshold(parseFloat(e.target.value))}
                      min="0"
                      max="10"
                    />
                  </div>

                  <div className="setting-item">
                    <label>Visualization Type:</label>
                    <select
                      value={visualizationType}
                      onChange={e => setVisualizationType(e.target.value)}
                    >
                      <option value="stacked">Stacked Area</option>
                      <option value="line">Line Chart</option>
                      <option value="bar">Bar Chart</option>
                    </select>
                  </div>

                  <div className="setting-item">
                    <button onClick={() => setShowModelSettings(!showModelSettings)}>
                      {showModelSettings ? 'Hide Model Settings' : 'Show Model Settings'}
                    </button>
                  </div>

                  {showModelSettings && (
                    <div className="model-settings">
                      <h4>Model Settings</h4>
                      <div className="setting-item">
                        <label>
                          <input
                            type="checkbox"
                            checked={useStopWordRemoval}
                            onChange={e => setUseStopWordRemoval(e.target.checked)}
                          />
                          Enable Stop Word Removal
                        </label>
                      </div>
                      <div className="setting-item">
                        <label>Model Name:</label>
                        <input
                          type="text"
                          value={modelName}
                          onChange={e => setModelName(e.target.value)}
                          disabled
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="action-section">
          <button 
            onClick={analyzeText} 
            disabled={isAnalyzing}
            className="analyze-button"
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze Narrative'}
          </button>
          {isModelLoading && <div className="loading">Loading Model...</div>}
          {errorMessage && <div className="error">{errorMessage}</div>}
        </div>
      </div>

      {segments.length > 0 && (
        <div className="results-section">
          <h2>Analysis Results: {title}</h2>

          <div className="chart-container">
            <h3>Narrative Tension</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={prepareTensionChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="tension" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-container">
            <h3>Emotion Profile</h3>
            <ResponsiveContainer width="100%" height={400}>
              {visualizationType === 'stacked' ? (
                <AreaChart data={prepareEmotionChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Legend />
                  {Object.keys(EMOTION_COLORS).map(emotion => (
                    <Area
                      key={emotion}
                      type="monotone"
                      dataKey={emotion}
                      stackId="1"
                      stroke={EMOTION_COLORS[emotion]}
                      fill={EMOTION_COLORS[emotion]}
                    />
                  ))}
                </AreaChart>
              ) : visualizationType === 'line' ? (
                <LineChart data={prepareEmotionChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Legend />
                  {Object.keys(EMOTION_COLORS).map(emotion => (
                    <Line
                      key={emotion}
                      type="monotone"
                      dataKey={emotion}
                      stroke={EMOTION_COLORS[emotion]}
                    />
                  ))}
                </LineChart>
              ) : (
                <BarChart data={prepareEmotionChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Legend />
                  {Object.keys(EMOTION_COLORS).map(emotion => (
                    <Bar
                      key={emotion}
                      dataKey={emotion}
                      fill={EMOTION_COLORS[emotion]}
                    />
                  ))}
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          <div className="insights-section">
            <h3>Key Insights</h3>
            <div className="insights-grid">
              <div className="insight-card">
                <h4>Significant Emotion Changes</h4>
                <ul>
                  {detectEmotionChanges().map((change, index) => (
                    <li key={index}>
                      Segment {change.segment + 1}: {change.largestEmotion} changed by {change.largestChange.toFixed(1)}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="insight-card">
                <h4>Action Pace Analysis</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={preparePaceChartData()}>
                    <Bar dataKey="pace" fill="#82ca9d" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {linguisticAnalysisEnabled && (
                <div className="insight-card">
                  <h4>Linguistic Features</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={prepareLinguisticChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 10]} />
                      <Tooltip />
                      <Legend />
                      {linguisticFeatures[0]?.features && Object.keys(linguisticFeatures[0].features).map(feature => (
                        <Line
                          key={feature}
                          type="monotone"
                          dataKey={feature}
                          stroke={`#${Math.floor(Math.random()*16777215).toString(16)}`}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;