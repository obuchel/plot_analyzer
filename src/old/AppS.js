import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell } from 'recharts';
import * as Papa from 'papaparse';
import _ from 'lodash';
import nlp from 'compromise';
import './styles.css';


const safeToFixed = (value, digits = 2) => {
  // Check if value is a valid number first
  const numValue = Number(value);
  if (value === null || value === undefined || isNaN(numValue)) {
    return '0.00'; // Or return any default value you prefer, like 'N/A'
  }
  return numValue.toFixed(digits);
};
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
// Mapping from EmoRoBERTa's output labels to our application emotion categories
const EMO_ROBERTA_MAPPING = {
  "anger": "anger",
  "fear": "fear",
  "joy": "joy",
  "sadness": "sadness",
  "surprise": "surprise",
  "disgust": "disgust",
  "neutral": null,
  // Custom emotions we'll need to detect through other means
  "tension": "tension", 
  "danger": "danger",   
  "relief": "relief"    
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
  hyperbole: ['never', 'always', 'every', 'all', 'none', 'ever', 'most', 'best', 'worst', 'greatest', 'tiniest'],
  simile: [' like ', ' as ', 'resembled', 'similar to'],
  metaphor: ['is a', 'was a', 'are a', 'were a']
};

// Keywords that signal different emotions for advanced detection
const EMOTION_INDICATORS = {
  "fear": ["fear", "scared", "afraid", "terrified", "worried", "panic", "dread", "frightened", "horror", "alarmed", "anxious"],
  "anger": ["anger", "angry", "mad", "furious", "outraged", "rage", "hate", "irate", "irritated", "livid", "enraged", "fuming"],
  "joy": ["joy", "happy", "excited", "thrilled", "delighted", "wonderful", "celebrate", "pleased", "elated", "ecstatic", "jubilant", "cheerful"],
  "sadness": ["sad", "unhappy", "depressed", "sorrow", "grief", "miserable", "cry", "melancholy", "heartbroken", "gloomy", "dejected", "despair"],
  "surprise": ["surprise", "shocked", "astonished", "amazed", "startled", "unexpected", "stunned", "astounded", "aghast", "bewildered", "dumbfounded"],
  "tension": ["tense", "stress", "pressure", "urgent", "anxious", "nervous", "on edge", "agitated", "uncertain", "wary", "suspicious"], 
  "danger": ["danger", "threat", "risk", "peril", "hazard", "deadly", "fatal", "unsafe", "vulnerable", "exposed", "threatened", "in jeopardy"], 
  "relief": ["relief", "relax", "calm", "peaceful", "ease", "comfort", "safe", "soothed", "reassured", "unburdened", "alleviated", "freed"], 
  "disgust": ["disgust", "repulsed", "revolted", "disgusted", "gross", "sickening", "nauseated", "appalled", "repelled", "abhorrent", "loathsome"]
};

// Define tension-related terms for detection
const TENSION_TERMS = [
  "tension", "suspense", "anticipation", "uncertainty", "uneasy", "nervous", 
  "apprehension", "anxiety", "dread", "foreboding", "ominous", "impending",
  "brewing", "looming", "trepidation", "unease", "worry", "concern",
  "stressed", "pressured", "strained", "taut", "fraught", "dire"
];

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
  const [modelName, setModelName] = useState('emotion-english-distilroberta-base'); // Updated model name
  const [multiFactorSegmentation, setMultiFactorSegmentation] = useState(true);
  const [factorWeights, setFactorWeights] = useState({
    emotion: 1.0,
    tension: 0.8,
    pace: 0.6,
    linguistic: 0.7, 
    character_danger: 0.9 
  });
  const [showModelSettings, setShowModelSettings] = useState(false);
  const [modelEnabled, setModelEnabled] = useState(true);
  const [useContentBasedStages, setUseContentBasedStages] = useState(false);
  const [linguisticAnalysisEnabled, setLinguisticAnalysisEnabled] = useState(true);
  const [characterDangerAnalysisEnabled, setCharacterDangerAnalysisEnabled] = useState(true);
  const [linguisticFeatures, setLinguisticFeatures] = useState([]);
  const [characterDangerProximity, setCharacterDangerProximity] = useState([]);
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(false);
  const [maxTextLength, setMaxTextLength] = useState(500); // Max text length for model analysis
  
  // New state variables for the FastAPI connection
  const [emotionResult, setEmotionResult] = useState(null);
  const [loadingEmotion, setLoadingEmotion] = useState(false);
  const [emotionError, setEmotionError] = useState(null);
  const [apiEndpoint, setApiEndpoint] = useState('http://localhost:8000/predict');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState('unknown'); 

  useEffect(() => {
    checkApiStatus();
  }, []);

  const checkApiStatus = async () => {
    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: 'Hello' }),
        // Set a timeout to avoid waiting too long
        signal: AbortSignal.timeout(3000)
      });
      
      if (response.ok) {
        setApiStatus('online');
        //setUseClientSide(false);
      } else {
        setApiStatus('offline');
        setUseClientSide(true);
      }
    } catch (err) {
      setApiStatus('offline');
      //setUseClientSide(true);
    }
  };


  // Analyze emotions using FastAPI backend
  const analyzeEmotion = async (textToAnalyze) => {
    if (!textToAnalyze || !textToAnalyze.trim()) {
      setEmotionError('No text to analyze');
      return null;
    }
    
    setLoadingEmotion(true);
    setEmotionError(null);
    
    try {


      /*  const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text }),
            signal: AbortSignal.timeout(5000) // 5 second timeout
          });
  
          if (!response.ok) {
            throw new Error(`API responded with status ${response.status}`);
          }
  
          const data = await response.json();
          
          // Handle null response data
          if (!data) {
            throw new Error('Received null response from API');
          }
*/

      // Limit text length if needed
      const processedText = textToAnalyze.slice(0, maxTextLength);
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ processedText }),
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to analyze emotion');
      }
      
      const data = await response.json();
      console.log(data);
      setEmotionResult(data);
      setLoadingEmotion(false);
      
      // Return the emotion probabilities in our expected format
      return convertEmotionResultToFormat(data);
    } catch (error) {
      console.error('Error analyzing emotion:', error);
      setEmotionError(error.message || 'Failed to analyze emotion');
      setEmotionResult(null);
      setLoadingEmotion(false);
      
      // Fall back to rule-based analysis
      return generateRuleBasedEmotions(textToAnalyze);
    }
  };
  
  // Convert the FastAPI response to our internal emotion format
  const convertEmotionResultToFormat = (data) => {
    if (!data || !data.probabilities) {
      return generateRuleBasedEmotions(''); // Return empty emotion object as fallback
    }
    
    const emotions = {};
    
    // Map the API response to our emotion format
    Object.entries(data.probabilities).forEach(([emotion, probability]) => {
      // Scale probability to 0-10 range
      const scaledValue = probability * 10;
      
      // Map to our emotion categories
      const mappedEmotion = EMO_ROBERTA_MAPPING[emotion.toLowerCase()];
      if (mappedEmotion) {
        emotions[mappedEmotion] = scaledValue;
      }
    });
    
    // Ensure all emotions from EMOTION_WEIGHTS are present
    Object.keys(EMOTION_WEIGHTS).forEach(emotion => {
      if (emotions[emotion] === undefined) {
        // For custom emotions not in EmoRoBERTa, calculate them
        if (emotion === 'tension' || emotion === 'danger' || emotion === 'relief') {
          emotions[emotion] = estimateCustomEmotion(emotion, data.probabilities);
        } else {
          emotions[emotion] = 0;
        }
      }
    });
    
    return emotions;
  };
  
  // Estimate custom emotions based on the primary emotions
  const estimateCustomEmotion = (customEmotion, probabilities) => {
    switch(customEmotion) {
      case 'tension':
        // Tension correlates with fear and some anger
        return (probabilities.fear || 0) * 7 + (probabilities.anger || 0) * 3;
      case 'danger':
        // Danger correlates with fear and surprise
        return (probabilities.fear || 0) * 8 + (probabilities.surprise || 0) * 2;
      case 'relief':
        // Relief is inverse of fear and correlates with joy
        return (probabilities.joy || 0) * 5 - (probabilities.fear || 0) * 5 + 5;
      default:
        return 0;
    }
  };

  // Generate rule-based emotion scores (fallback)
  const generateRuleBasedEmotions = (text) => {
    const emotions = {};
    const emotionKeys = Object.keys(EMOTION_WEIGHTS);
    const lowerText = text ? text.toLowerCase() : '';

    // Count keyword occurrences using our emotion indicators
    emotionKeys.forEach(emotion => {
      if (EMOTION_INDICATORS[emotion]) {
        let count = 0;
        EMOTION_INDICATORS[emotion].forEach(keyword => {
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
    if (!text) return 0;
    
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

  // Analyze linguistic features of text
  const analyzeLinguisticFeatures = (text) => {
    if (!linguisticAnalysisEnabled || !text || !text.trim()) {
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
      let imperativeCount = 0;
      try {
        const doc = nlp(text);
        const potentialImperatives = sentences.filter(s => {
          const firstWord = s.trim().split(/\s+/)[0].toLowerCase();
          const firstWordDoc = nlp(firstWord);
          return firstWordDoc.verbs().length > 0;
        });
        imperativeCount = potentialImperatives.length;
      } catch (e) {
        console.error("Error with NLP detection:", e);
        // Fallback estimation
        imperativeCount = sentences.filter(s => 
          /^\s*[A-Za-z]+\s/.test(s) && !s.includes('?') && !s.includes('I ')
        ).length * 0.3;
      }
      
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
        questions: Math.min(10, (questionCount / Math.max(1, sentences.length)) * 20),
        imperatives: Math.min(10, (imperativeCount / Math.max(1, sentences.length)) * 20),
        emphasis: Math.min(10, (emphasisMarkers + heavyPunctuation) / (Math.max(1, sentences.length) / 2)),
        intensifiers: Math.min(10, intensifierCount / (Math.max(1, words.length) / 50) * 2),
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

  // Calculate character-danger proximity
  const calculateCharacterDangerProximity = (text) => {
    if (!characterDangerAnalysisEnabled || !text || !text.trim()) {
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
      
      // Find sentences containing both character references and danger terms
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
          try {
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
          } catch (e) {
            console.error("Error with NLP character-danger proximity:", e);
            // Just use basic score if NLP fails
            proximityScore += 0.5;
          }
        }
      });
      
      // Normalize to 0-10 scale based on text length
      return Math.min(10, (proximityScore / Math.max(1, sentences.length)) * 25);
    } catch (error) {
      console.error("Error calculating character-danger proximity:", error);
      return 0;
    }
  };

  // Function to split text into sentences
  const sentenceTokenize = (text) => {
    if (!text) return [];
    // Handle common abbreviations and edge cases
    const preparedText = text
      .replace(/([.?!])\s*(?=[A-Z])/g, "$1|")
      .replace(/(\b[A-Z][a-z]{1,2})\./g, "$1|") // Handle abbreviations like Mr. Dr. etc.
      .replace(/\.\.\./g, "…"); // Handle ellipsis
    return preparedText.split(/[|]/).filter(sentence => sentence.trim().length > 0);
  };

  // Enhanced action pace calculation with linguistic features
  const calculateActionPace = (text) => {
    if (!text || !text.trim()) return 0;
    
    try {
      let verbCount = 0;
      let actionVerbCount = 0;
      let highImpactActionCount = 0;
      
      // Get total words excluding punctuation and whitespace
      const words = text.split(/\s+/).filter(w => w.trim().length > 0);
      const totalWords = words.length;
      if (totalWords === 0) return 0;
      
      try {
        const doc = nlp(text);
        // Get all verbs
        verbCount = doc.verbs().out('array').length;
        // Focus on action verbs by checking verb properties in Compromise
        actionVerbCount = doc.verbs().if('#PresentTense').out('array').length;
      } catch (e) {
        console.error("Error with NLP verb detection:", e);
        // Fallback: estimate verb count based on word endings and common verbs
        const verbEndings = ['ing', 'ed', 's', 'es'];
        verbCount = words.filter(word => 
          verbEndings.some(ending => word.endsWith(ending))
        ).length;
        actionVerbCount = verbCount * 0.6; // Estimate
      }
      
      // Enhanced: Specifically look for verbs in our action verb list
      ACTION_VERBS.forEach(actionVerb => {
        const regex = new RegExp(`\\b${actionVerb}\\b|\\b${actionVerb}ing\\b|\\b${actionVerb}ed\\b|\\b${actionVerb}s\\b`, 'gi');
        const matches = text.match(regex);
        if (matches) {
          actionVerbCount += matches.length * 0.5; // Half weight for generic action verbs
          highImpactActionCount += matches.length * 0.8; // Higher weight for our curated list
        }
      });
      
      // Calculate sentence metrics
      const sentences = sentenceTokenize(text);
      const totalSentences = sentences.length;
      if (totalSentences === 0) return 0;
      
      // Calculate average sentence length
      const avgSentenceLength = totalWords / totalSentences;
      // Short sentences increase pace - invert the value to get higher score for shorter sentences
      const sentenceLengthPaceContribution = Math.max(0, 10 - avgSentenceLength) / 2;
      
      // Calculate punctuation impact
      const exclamationCount = (text.match(/!/g) || []).length;
      const dashCount = (text.match(/-/g) || []).length;
      const ellipsisCount = (text.match(/\.\.\./g) || []).length;
      const fragmentCount = sentences.filter(s => s.trim().length < 15).length;
      
      // Punctuation and fragments increase pace sensation
      const punctuationPaceContribution = (exclamationCount * 1.5 + dashCount * 0.5 + ellipsisCount * 0.7 + fragmentCount * 2) / Math.max(1, totalSentences) * 2;
      
      // Verb-based pace contribution
      const verbPaceContribution = (verbCount / Math.max(1, totalWords)) * 50;
      const actionVerbPaceContribution = (actionVerbCount / Math.max(1, totalWords)) * 100;
      const highImpactPaceContribution = (highImpactActionCount / Math.max(1, totalWords)) * 200;
      
      // Combined pace calculation - give higher weights to action-specific metrics
      const combinedPace = (
        verbPaceContribution * 0.2 + 
        actionVerbPaceContribution * 0.3 + 
        highImpactPaceContribution * 0.3 + 
        sentenceLengthPaceContribution * 0.1 + 
        punctuationPaceContribution * 0.1
      );
      
      // Normalize to 0-10 scale
      return Math.min(10, combinedPace);
    } catch (error) {
      console.error("Error calculating action pace:", error);
      return 0;
    }
  };

  // Calculate combined segmentation score using multiple factors
  const calculateCombinedSegmentationScore = (segment, prevSegment) => {
    if (!segment || !segment.trim()) return 0;
    
    try {
      // 1. Emotion-based factors (from model or rule-based)
      const emotions = generateRuleBasedEmotions(segment);
      const prevEmotions = prevSegment ? generateRuleBasedEmotions(prevSegment) : null;
      
      // Calculate emotion change score
      let emotionChangeScore = 0;
      if (prevEmotions) {
        const emotionDiffs = Object.keys(emotions).map(emotion => 
          Math.abs(emotions[emotion] - prevEmotions[emotion])
        );
        emotionChangeScore = emotionDiffs.reduce((sum, diff) => sum + diff, 0) / emotionDiffs.length;
      }
      
      // 2. Narrative tension (calculated from emotions and patterns)
      const tensionScore = calculateNarrativeTensionScore(segment);
      const prevTensionScore = prevSegment ? calculateNarrativeTensionScore(prevSegment) : 0;
      const tensionChangeScore = Math.abs(tensionScore - prevTensionScore);
      
      // 3. Action pace
      const paceScore = calculateActionPace(segment);
      const prevPaceScore = prevSegment ? calculateActionPace(prevSegment) : 0;
      const paceChangeScore = Math.abs(paceScore - prevPaceScore);
      
      // 4. Linguistic features (if enabled)
      let linguisticScore = 0;
      if (linguisticAnalysisEnabled) {
        const linguisticFeatures = analyzeLinguisticFeatures(segment);
        const prevLinguisticFeatures = prevSegment ? analyzeLinguisticFeatures(prevSegment) : null;
        
        // Calculate linguistic change score
        if (prevLinguisticFeatures) {
          const featureDiffs = Object.keys(linguisticFeatures).map(feature => 
            Math.abs(linguisticFeatures[feature] - prevLinguisticFeatures[feature])
          );
          linguisticScore = featureDiffs.reduce((sum, diff) => sum + diff, 0) / featureDiffs.length;
        }
      }
      
      // 5. Character-danger proximity (if enabled)
      let characterDangerScore = 0;
      if (characterDangerAnalysisEnabled) {
        characterDangerScore = calculateCharacterDangerProximity(segment);
        const prevCharacterDangerScore = prevSegment ? calculateCharacterDangerProximity(prevSegment) : 0;
        characterDangerScore = Math.abs(characterDangerScore - prevCharacterDangerScore);
      }
      
      // Final weighted combination score
      const combinedScore = (
        emotionChangeScore * factorWeights.emotion +
        tensionChangeScore * factorWeights.tension +
        paceChangeScore * factorWeights.pace +
        linguisticScore * factorWeights.linguistic +
        characterDangerScore * factorWeights.character_danger
      );
      
      return combinedScore;
    } catch (error) {
      console.error("Error calculating combined segmentation score:", error);
      return 0;
    }
  };

  // Calculate similarity between two text segments based on TF-IDF
  const calculateTextSimilarity = (text1, text2) => {
    if (!text1 || !text2 || !text1.trim() || !text2.trim()) return 0;
    
    try {
      // Tokenize
      const tokens1 = text1.toLowerCase().split(/\s+/).filter(w => 
        w.trim().length > 0 && (!useStopWordRemoval || !STOP_WORDS.has(w.toLowerCase()))
      );
      const tokens2 = text2.toLowerCase().split(/\s+/).filter(w => 
        w.trim().length > 0 && (!useStopWordRemoval || !STOP_WORDS.has(w.toLowerCase()))
      );
      
      // Count term frequencies
      const tf1 = {};
      const tf2 = {};
      
      tokens1.forEach(token => {
        tf1[token] = (tf1[token] || 0) + 1;
      });
      
      tokens2.forEach(token => {
        tf2[token] = (tf2[token] || 0) + 1;
      });
      
      // Calculate cosine similarity
      let dotProduct = 0;
      let magnitude1 = 0;
      let magnitude2 = 0;
      
      // Find all unique tokens
      const allTokens = new Set([...Object.keys(tf1), ...Object.keys(tf2)]);
      
      allTokens.forEach(token => {
        const val1 = tf1[token] || 0;
        const val2 = tf2[token] || 0;
        
        dotProduct += val1 * val2;
        magnitude1 += val1 * val1;
        magnitude2 += val2 * val2;
      });
      
      magnitude1 = Math.sqrt(magnitude1);
      magnitude2 = Math.sqrt(magnitude2);
      
      const similarity = magnitude1 > 0 && magnitude2 > 0 ? 
        dotProduct / (magnitude1 * magnitude2) : 0;
      
      return similarity;
    } catch (error) {
      console.error("Error calculating text similarity:", error);
      return 0;
    }
  };

  // Segment text into multiple parts automatically
  const autoSegmentText = (text, numParts, method = 'multi-factor') => {
    if (!text || !text.trim()) {
      return [];
    }
    
    try {
      // Get sentences
      const sentences = sentenceTokenize(text);
      if (sentences.length <= numParts) {
        return sentences; // Not enough sentences to segment
      }
      
      // Decide segmentation strategy based on method
      switch (method) {
        case 'equal-length':
          // Equal length segmentation (simplest)
          return splitIntoEqualParts(sentences, numParts);
          
        case 'content-based':
          // Content-based segmentation using narrative stages
          return contentBasedSegmentation(sentences, numParts);
          
        case 'emotion-based':
          // Emotion change detection segmentation
          return emotionBasedSegmentation(sentences, numParts);
          
        case 'multi-factor':
        default:
          // Multi-factor segmentation using all available features
          return multiFactorSegmentation ? 
            multiFactorBasedSegmentation(sentences, numParts) :
            emotionBasedSegmentation(sentences, numParts);
      }
    } catch (error) {
      console.error("Error in text segmentation:", error);
      // Fallback to equal length segmentation
      return splitIntoEqualParts(text.split(/\s+/).filter(w => w.trim().length > 0), numParts)
        .map(segment => segment.join(' '));
    }
  };

  // Split sentences into equal-sized parts
  const splitIntoEqualParts = (sentences, numParts) => {
    const segmentSize = Math.ceil(sentences.length / numParts);
    const segments = [];
    
    for (let i = 0; i < sentences.length; i += segmentSize) {
      const segment = sentences.slice(i, i + segmentSize).join(' ');
      segments.push(segment);
    }
    
    return segments;
  };

  // Find segment boundaries based on significant changes in content
  const contentBasedSegmentation = (sentences, numParts) => {
    if (sentences.length <= numParts) {
      return sentences;
    }
    
    try {
      // Identify potential boundaries based on content shifts
      const sentenceScores = [];
      
      // For each sentence, calculate how similar it is to previous context
      const contextWindowSize = 3; // Consider 3 sentences of context
      
      for (let i = contextWindowSize; i < sentences.length; i++) {
        const currentSentence = sentences[i];
        const previousContext = sentences.slice(i - contextWindowSize, i).join(' ');
        
        // Lower similarity means higher potential for boundary
        const similarity = calculateTextSimilarity(currentSentence, previousContext);
        sentenceScores.push({
          index: i,
          score: 1 - similarity // Convert similarity to boundary score
        });
      }
      
      // Sort by score descending (highest boundary potential first)
      sentenceScores.sort((a, b) => b.score - a.score);
      
      // Select top N-1 boundaries (for N segments)
      const numBoundaries = numParts - 1;
      const boundaries = sentenceScores
        .slice(0, numBoundaries)
        .map(item => item.index)
        .sort((a, b) => a - b); // Sort by position in text
      
      // Create segments using boundaries
      const segments = [];
      let startIdx = 0;
      
      boundaries.forEach(boundaryIdx => {
        segments.push(sentences.slice(startIdx, boundaryIdx).join(' '));
        startIdx = boundaryIdx;
      });
      
      // Add the final segment
      segments.push(sentences.slice(startIdx).join(' '));
      
      return segments;
    } catch (error) {
      console.error("Error in content-based segmentation:", error);
      // Fallback to equal parts
      return splitIntoEqualParts(sentences, numParts);
    }
  };

  // Find segment boundaries based on emotion changes
  const emotionBasedSegmentation = (sentences, numParts) => {
    if (sentences.length <= numParts) {
      return sentences;
    }
    
    try {
      // We need to analyze emotions in sliding windows to find changes
      const windowSize = Math.min(Math.ceil(sentences.length / 10), 5); // Adaptive window size
      const stride = Math.max(1, Math.floor(windowSize / 2)); // Overlap between windows
      
      const emotionChangeScores = [];
      
      for (let i = windowSize; i < sentences.length; i += stride) {
        const currentWindow = sentences.slice(i - windowSize, i).join(' ');
        const nextWindow = sentences.slice(i, Math.min(i + windowSize, sentences.length)).join(' ');
        
        // For each window pair, calculate emotion differences
        const currentEmotions = generateRuleBasedEmotions(currentWindow);
        const nextEmotions = generateRuleBasedEmotions(nextWindow);
        
        // Calculate total emotion change
        let totalChange = 0;
        
        Object.keys(EMOTION_WEIGHTS).forEach(emotion => {
          if (currentEmotions[emotion] !== undefined && nextEmotions[emotion] !== undefined) {
            const change = Math.abs(currentEmotions[emotion] - nextEmotions[emotion]);
            // Weight the change by the emotion's impact on tension
            totalChange += change * Math.abs(EMOTION_WEIGHTS[emotion]);
          }
        });
        
        emotionChangeScores.push({
          index: i,
          score: totalChange
        });
      }
      
      // Find highest emotion change points
      emotionChangeScores.sort((a, b) => b.score - a.score);
      
      // Select top N-1 boundaries (for N segments)
      const numBoundaries = numParts - 1;
      const boundaries = emotionChangeScores
        .slice(0, numBoundaries)
        .map(item => item.index)
        .sort((a, b) => a - b); // Sort by position in text
      
      // Create segments using boundaries
      const segments = [];
      let startIdx = 0;
      
      boundaries.forEach(boundaryIdx => {
        segments.push(sentences.slice(startIdx, boundaryIdx).join(' '));
        startIdx = boundaryIdx;
      });
      
      // Add the final segment
      segments.push(sentences.slice(startIdx).join(' '));
      
      return segments;
    } catch (error) {
      console.error("Error in emotion-based segmentation:", error);
      // Fallback to equal parts
      return splitIntoEqualParts(sentences, numParts);
    }
  };

  // Multi-factor based segmentation using combined features
  const multiFactorBasedSegmentation = (sentences, numParts) => {
    if (sentences.length <= numParts) {
      return sentences;
    }
    
    try {
      // We need to analyze with multiple factors in sliding windows
      const windowSize = Math.min(Math.ceil(sentences.length / 8), 6); // Adaptive window size
      const stride = Math.max(1, Math.floor(windowSize / 3)); // More overlap for precision
      
      const segmentationScores = [];
      
      for (let i = windowSize; i < sentences.length; i += stride) {
        const currentWindow = sentences.slice(i - windowSize, i).join(' ');
        const nextWindow = sentences.slice(i, Math.min(i + windowSize, sentences.length)).join(' ');
        
        // Calculate combined segmentation score
        const combinedScore = calculateCombinedSegmentationScore(nextWindow, currentWindow);
        
        segmentationScores.push({
          index: i,
          score: combinedScore
        });
      }
      
      // Find highest change points
      segmentationScores.sort((a, b) => b.score - a.score);
      
      // Select top N-1 boundaries (for N segments)
      const numBoundaries = numParts - 1;
      const boundaries = segmentationScores
        .slice(0, numBoundaries)
        .map(item => item.index)
        .sort((a, b) => a - b); // Sort by position in text
      
      // Create segments using boundaries
      const segments = [];
      let startIdx = 0;
      
      boundaries.forEach(boundaryIdx => {
        segments.push(sentences.slice(startIdx, boundaryIdx).join(' '));
        startIdx = boundaryIdx;
      });
      
      // Add the final segment
      segments.push(sentences.slice(startIdx).join(' '));
      
      return segments;
    } catch (error) {
      console.error("Error in multi-factor segmentation:", error);
      // Fallback to equal parts
      return splitIntoEqualParts(sentences, numParts);
    }
  };

  // Calculate narrative tension based on emotion scores
  const calculateTension = (emotions) => {
    if (!emotions || Object.keys(emotions).length === 0) {
      return 0;
    }
    
    let tensionScore = 0;
    
    // Apply emotion weights to calculate tension
    Object.keys(EMOTION_WEIGHTS).forEach(emotion => {
      if (emotions[emotion] !== undefined) {
        tensionScore += emotions[emotion] * EMOTION_WEIGHTS[emotion];
      }
    });
    
    // Normalize to 0-10 scale
    tensionScore = Math.max(0, Math.min(10, (tensionScore + 10) / 2));
    
    return tensionScore;
  };

  // Detect narrative arc stage based on content and tension patterns
  const detectNarrativeStage = (segmentIndex, totalSegments, tensionScore, content) => {
    // Position in narrative (0-1 range)
    const position = segmentIndex / (totalSegments - 1);
    
    // Approach 1: Position-based estimation
    let positionBasedStage = "";
    const arcStages = Object.keys(DEFAULT_ARC_STRUCTURE);
    
    // Find closest stage based on position
    let closestDist = 1;
    arcStages.forEach(stage => {
      const stageDist = Math.abs(DEFAULT_ARC_STRUCTURE[stage].position - position);
      if (stageDist < closestDist) {
        closestDist = stageDist;
        positionBasedStage = stage;
      }
    });
    
    // Approach 2: Content-based detection if enabled
    if (useContentBasedStages) {
      // Key phrase indicators for different narrative stages
      const stageIndicators = {
        "exposition": ["begin", "introduce", "setting", "background", "once upon a time", "long ago"],
        "inciting_incident": ["suddenly", "one day", "but then", "everything changed", "until"],
        "rising_action": ["challenge", "attempt", "try", "journey", "develop", "build"],
        "climax": ["finally", "ultimate", "showdown", "face-off", "confrontation", "decisive"],
        "falling_action": ["aftermath", "result", "consequence", "following", "after", "retreat"],
        "resolution": ["eventually", "finally", "in the end", "resolved", "conclude", "reconcile"]
      };
      
      // Check for content indicators
      const lowerContent = content.toLowerCase();
      let contentScore = {};
      
      Object.keys(stageIndicators).forEach(stage => {
        contentScore[stage] = 0;
        stageIndicators[stage].forEach(indicator => {
          if (lowerContent.includes(indicator)) {
            contentScore[stage] += 1;
          }
        });
      });
      
      // Find stage with highest content indicator score
      let maxScore = 0;
      let contentBasedStage = positionBasedStage; // Default to position-based
      
      Object.keys(contentScore).forEach(stage => {
        if (contentScore[stage] > maxScore) {
          maxScore = contentScore[stage];
          contentBasedStage = stage;
        }
      });
      
      // If content detection found significant markers, use it
      if (maxScore >= 2) {
        return contentBasedStage;
      }
    }
    
    // Approach 3: Tension-based adjustments to position estimate
    // Check if tension score strongly suggests a different stage
    const tensionThreshold = 8.5; // High tension
    const lowTensionThreshold = 3.0; // Low tension
    
    if (tensionScore > tensionThreshold) {
      // High tension points to climax or late rising action
      if (position > 0.5) {
        return "climax";
      } else {
        return "inciting_incident"; // Early high tension is usually inciting incident
      }
    } else if (tensionScore < lowTensionThreshold) {
      // Low tension points to exposition or resolution
      if (position < 0.3) {
        return "exposition";
      } else if (position > 0.7) {
        return "resolution";
      }
    }
    
    // Default to position-based estimation if no strong indicators
    return positionBasedStage;
  };

  // Calculate story-specific term frequency
  const calculateStorySpecificTerms = (segments) => {
    if (!segments || segments.length === 0 || !storySpecificInput || !storySpecificInput.trim()) {
      return {};
    }
    
    try {
      const terms = useCustomTerms ? 
        storySpecificInput.split(',').map(term => term.trim().toLowerCase()) : 
        [];
      
      if (terms.length === 0) return {};
      
      const termFrequencies = {};
      terms.forEach(term => {
        termFrequencies[term] = [];
      });
      
      // Count occurrences of each term in each segment
      segments.forEach((segment, index) => {
        const lowerSegment = segment.toLowerCase();
        
        terms.forEach(term => {
          const regex = new RegExp(`\\b${term}\\b`, 'gi');
          const matches = lowerSegment.match(regex);
          const count = matches ? matches.length : 0;
          
          // Normalize by segment length
          const words = segment.split(/\s+/).filter(w => w.trim().length > 0).length;
          const normalizedFrequency = words > 0 ? (count / words) * 1000 : 0;
          
          termFrequencies[term].push({
            segment: index,
            count: count,
            normalizedFrequency: normalizedFrequency
          });
        });
      });
      
      return termFrequencies;
    } catch (error) {
      console.error("Error calculating story-specific terms:", error);
      return {};
    }
  };

  // Enhanced calculate emotion profiles with model integration
  const calculateEmotionProfiles = async (segments) => {
    if (!segments || segments.length === 0) {
      return [];
    }
    
    try {
      const profiles = [];
      
      // Process each segment
      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        let emotionProfile;
        
        if (modelEnabled && modelLoaded) {
          // Use the model if enabled and loaded
          try {
            emotionProfile = await analyzeEmotion(segment);
          } catch (error) {
            console.error("Error using emotion model, falling back to rule-based:", error);
            emotionProfile = generateRuleBasedEmotions(segment);
          }
        } else {
          // Use rule-based approach
          emotionProfile = generateRuleBasedEmotions(segment);
        }
        
        profiles.push(emotionProfile);
      }
      
      return profiles;
    } catch (error) {
      console.error("Error calculating emotion profiles:", error);
      return segments.map(segment => generateRuleBasedEmotions(segment));
    }
  };

  // Analyze text to extract all metrics
  const analyzeText = async () => {
    if (!text || !text.trim()) {
      setErrorMessage("Please enter some text to analyze");
      return;
    }
    
    setIsAnalyzing(true);
    setErrorMessage("");
    
    try {
      // 1. Segment the text
      let segmentedText;
      
      if (isCustomSegmentation) {
        // Use custom segments provided by user
        segmentedText = customSegments.map(seg => seg.content);
      } else {
        // Auto-segment using selected method
        segmentedText = autoSegmentText(text, numSegments, segmentationMethod);
      }
      
      setSegments(segmentedText);
      
      // 2. Calculate emotion profiles for each segment
      const profiles = await calculateEmotionProfiles(segmentedText);
      setEmotionProfiles(profiles);
      
      // 3. Calculate narrative tension based on emotions
      const tension = profiles.map(profile => calculateTension(profile));
      
      // Add narrative arc labels
      const labeledTension = tension.map((tensionValue, index) => {
        const stage = detectNarrativeStage(
          index, 
          segmentedText.length, 
          tensionValue, 
          segmentedText[index]
        );
        
        return {
          segment: index,
          value: tensionValue,
          narrativeStage: stage
        };
      });
      
      setNarrativeTension(labeledTension);
      
      // 4. Calculate action pace for each segment
      const pace = segmentedText.map(segment => calculateActionPace(segment));
      setActionPace(pace.map((value, index) => ({
        segment: index,
        value: value
      })));
      
      // 5. Calculate linguistic features
      if (linguisticAnalysisEnabled) {
        const features = segmentedText.map(segment => analyzeLinguisticFeatures(segment));
        setLinguisticFeatures(features.map((feature, index) => ({
          segment: index,
          ...feature
        })));
      }
      
      // 6. Calculate character-danger proximity
      if (characterDangerAnalysisEnabled) {
        const proximity = segmentedText.map(segment => calculateCharacterDangerProximity(segment));
        setCharacterDangerProximity(proximity.map((value, index) => ({
          segment: index,
          value: value
        })));
      }
      
      // 7. Calculate story-specific terms
      const termFrequencies = calculateStorySpecificTerms(segmentedText);
      setStorySpecificTerms(termFrequencies);
      
      setIsAnalyzing(false);
    } catch (error) {
      console.error("Error analyzing text:", error);
      setErrorMessage("An error occurred during analysis: " + error.message);
      setIsAnalyzing(false);
    }
  };
  
  // Load model from FastAPI service or initialize NLP libraries
  const loadModel = async () => {
    if (!modelEnabled) {
      setModelLoaded(false);
      return;
    }
    
    setIsModelLoading(true);
    
    try {
      // Send a ping request to check if the API is responsive
      const pingResponse = await fetch(`${apiEndpoint}/ping`, {
        method: 'GET'
      });
      
      if (pingResponse.ok) {
        // API is reachable, service should be ready
        setModelLoaded(true);
        console.log("Emotion model API endpoint is reachable");
      } else {
        throw new Error("Emotion API service not responding");
      }
    } catch (error) {
      console.error("Failed to connect to emotion model API:", error);
      setModelLoaded(false);
      setErrorMessage(`Failed to load emotion model: ${error.message || "Connection error"}`);
    } finally {
      setIsModelLoading(false);
    }
  };
  
  // Load model on component mount or when model settings change
  useEffect(() => {
    loadModel();
  }, [apiEndpoint, modelName, modelEnabled]);
  
  // Handle user input changes
  const handleTextChange = (e) => {
    setText(e.target.value);
  };
  
  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };
  
  const handleNumSegmentsChange = (e) => {
    setNumSegments(parseInt(e.target.value) || 6);
  };
  
  const handleSegmentationMethodChange = (e) => {
    setSegmentationMethod(e.target.value);
  };
  
  const handleCustomSegmentChange = (index, content) => {
    const updatedSegments = [...customSegments];
    updatedSegments[index].content = content;
    setCustomSegments(updatedSegments);
  };
  
  const handleAddCustomSegment = () => {
    const lastSegment = customSegments[customSegments.length - 1];
    const newSegmentName = getNextSegmentName(lastSegment.name);
    setCustomSegments([...customSegments, { name: newSegmentName, content: '' }]);
  };
  
  const handleRemoveCustomSegment = (index) => {
    if (customSegments.length > 1) {
      const updatedSegments = [...customSegments];
      updatedSegments.splice(index, 1);
      setCustomSegments(updatedSegments);
    }
  };
  
  const getNextSegmentName = (currentName) => {
    const arcStages = Object.keys(DEFAULT_ARC_STRUCTURE);
    const currentIndex = arcStages.indexOf(currentName);
    if (currentIndex < arcStages.length - 1) {
      return arcStages[currentIndex + 1];
    }
    return "additional";
  };
  
  const handleStorySpecificInputChange = (e) => {
    setStorySpecificInput(e.target.value);
  };
  
  const toggleCustomTerms = () => {
    setUseCustomTerms(!useCustomTerms);
  };
  
  const toggleCustomSegmentation = () => {
    setIsCustomSegmentation(!isCustomSegmentation);
  };
  
  const toggleHelp = () => {
    setShowHelp(!showHelp);
  };
  
  const toggleModelSettings = () => {
    setShowModelSettings(!showModelSettings);
  };
  
  const toggleAdvancedFeatures = () => {
    setShowAdvancedFeatures(!showAdvancedFeatures);
  };
  
  const handleVisualizationTypeChange = (e) => {
    setVisualizationType(e.target.value);
  };
  
  const handleEmotionThresholdChange = (e) => {
    setEmotionChangeThreshold(parseFloat(e.target.value) || 3.0);
  };
  
  const handleModelToggle = () => {
    setModelEnabled(!modelEnabled);
  };
  
  const handleContentBasedStagesToggle = () => {
    setUseContentBasedStages(!useContentBasedStages);
  };
  
  const handleLinguisticAnalysisToggle = () => {
    setLinguisticAnalysisEnabled(!linguisticAnalysisEnabled);
  };

  const handleCharacterDangerAnalysisToggle = () => {
    setCharacterDangerAnalysisEnabled(!characterDangerAnalysisEnabled);
  };

  const handleFactorWeightChange = (factor, value) => {
    setFactorWeights({
      ...factorWeights,
      [factor]: parseFloat(value) || 0.5
    });
  };

  const handleMultiFactorToggle = () => {
    setMultiFactorSegmentation(!multiFactorSegmentation);
  };

  const handleApiEndpointChange = (e) => {
    setApiEndpoint(e.target.value);
  };

  const handleModelNameChange = (e) => {
    setModelName(e.target.value);
  };

  const handleStopWordRemovalToggle = () => {
    setUseStopWordRemoval(!useStopWordRemoval);
  };

  // Custom chart components for visualization
  const EmotionChart = ({ data }) => {
    if (!data || data.length === 0) return null;

    // Transform data for stacked or area chart
    const chartData = data.map((profile, index) => {
      const dataPoint = { segment: index };
      Object.keys(profile).forEach(emotion => {
        if (Object.keys(EMOTION_WEIGHTS).includes(emotion)) {
          dataPoint[emotion] = profile[emotion];
        }
      });
      return dataPoint;
    });

    return (
      <div className="chart-container">
        <h3>Emotion Distribution</h3>
        {visualizationType === 'stacked' ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="segment" />
              <YAxis />
              <Tooltip />
              <Legend />
              {Object.keys(EMOTION_WEIGHTS).map(emotion => (
                <Bar key={emotion} dataKey={emotion} stackId="a" fill={EMOTION_COLORS[emotion] || '#8884d8'} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="segment" />
              <YAxis />
              <Tooltip />
              <Legend />
              {Object.keys(EMOTION_WEIGHTS).map(emotion => (
                <Area 
                  key={emotion} 
                  type="monotone" 
                  dataKey={emotion} 
                  stackId="1" 
                  fill={EMOTION_COLORS[emotion] || '#8884d8'} 
                  stroke={EMOTION_COLORS[emotion] || '#8884d8'} 
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    );
  };

  const TensionChart = ({ data }) => {
    if (!data || data.length === 0) return null;

    return (
      <div className="chart-container">
        <h3>Narrative Tension</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="segment" />
            <YAxis domain={[0, 10]} />
            <Tooltip content={({ active, payload }) => {
              if (active && payload && payload.length) {
                var addK=safeToFixed(payload[0].value, 2);
                return (
                  <div className="custom-tooltip">
                    <p className="label">{`Tension: ${addK}`}</p>
                    <p className="desc">{`Stage: ${payload[0].payload.narrativeStage}`}</p>
                  </div>
                );
              }
              return null;
            }} />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#8c564b" strokeWidth={2} dot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const PaceChart = ({ data }) => {
    if (!data || data.length === 0) return null;

    return (
      <div className="chart-container">
        <h3>Action Pace</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="segment" />
            <YAxis domain={[0, 10]} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#2ca02c" strokeWidth={2} dot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const LinguisticFeaturesChart = ({ data }) => {
    if (!data || data.length === 0 || !linguisticAnalysisEnabled) return null;

    // Transform data for radar chart
    const chartData = data.map((features, index) => {
      const { segment, ...featureValues } = features;
      return {
        segment,
        ...featureValues
      };
    });

    const features = [
      'sentenceLength', 'clauseComplexity', 'questions', 
      'imperatives', 'emphasis', 'intensifiers', 'repetition', 'rhetorical'
    ];

    return (
      <div className="chart-container">
        <h3>Linguistic Features</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="segment" />
            <YAxis domain={[0, 10]} />
            <Tooltip />
            <Legend />
            {features.map((feature, index) => (
              <Line 
                key={feature} 
                type="monotone" 
                dataKey={feature} 
                stroke={`hsl(${index * 45}, 70%, 50%)`} 
                strokeWidth={1.5} 
                dot={{ r: 3 }} 
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const CharacterDangerChart = ({ data }) => {
    if (!data || data.length === 0 || !characterDangerAnalysisEnabled) return null;

    return (
      <div className="chart-container">
        <h3>Character-Danger Proximity</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="segment" />
            <YAxis domain={[0, 10]} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#d62728" strokeWidth={2} dot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const TermFrequencyChart = ({ data }) => {
    if (!data || Object.keys(data).length === 0) return null;

    // Transform term frequency data for chart
    const chartData = [];
    
    // Calculate max segments to determine the number of data points
    let maxSegments = 0;
    Object.values(data).forEach(termData => {
      if (termData.length > maxSegments) maxSegments = termData.length;
    });

    // Create data points for each segment
    for (let i = 0; i < maxSegments; i++) {
      const dataPoint = { segment: i };
      
      Object.keys(data).forEach(term => {
        const segmentData = data[term].find(item => item.segment === i);
        dataPoint[term] = segmentData ? segmentData.normalizedFrequency : 0;
      });
      
      chartData.push(dataPoint);
    }

    return (
      <div className="chart-container">
        <h3>Story-Specific Term Frequency</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="segment" />
            <YAxis />
            <Tooltip />
            <Legend />
            {Object.keys(data).map((term, index) => (
              <Line 
                key={term} 
                type="monotone" 
                dataKey={term} 
                stroke={`hsl(${index * 70}, 70%, 50%)`} 
                strokeWidth={2} 
                dot={{ r: 4 }} 
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const MainInfoPanel = () => (
    <div className="info-panel">
      <h2>Narrative Arc Analysis</h2>
      <p>Upload text to analyze its narrative structure, emotion flow, and tension patterns.</p>
      {showHelp && (
        <div className="help-content">
          <h3>How to use this tool:</h3>
          <ol>
            <li>Enter or paste your story text in the input area</li>
            <li>Set the number of segments for analysis</li>
            <li>Choose automatic or custom segmentation</li>
            <li>Run the analysis to visualize emotion, tension, and pace</li>
            <li>Optional: Add custom terms to track through your narrative</li>
            <li>Toggle advanced features for deeper linguistic analysis</li>
          </ol>
          
          <h3>Feature Descriptions:</h3>
          <ul>
            <li><strong>Emotion Analysis:</strong> Detects and visualizes emotional patterns.</li>
            <li><strong>Narrative Tension:</strong> Calculates tension based on emotions and narrative elements.</li>
            <li><strong>Action Pace:</strong> Measures the intensity and speed of action in the text.</li>
            <li><strong>Linguistic Features:</strong> Analyzes sentence structure, rhetorical devices, and language patterns.</li>
            <li><strong>Character-Danger Proximity:</strong> Tracks when characters are close to danger/threats.</li>
            <li><strong>Custom Term Tracking:</strong> Monitor specific terms relevant to your story.</li>
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <div className="app-container">
      <MainInfoPanel />
      
      <div className="control-panel">
        <div className="input-group">
          <label htmlFor="title">Story Title:</label>
          <input 
            type="text" 
            id="title" 
            value={title} 
            onChange={handleTitleChange} 
            placeholder="Enter story title" 
          />
        </div>

        <div className="input-group">
          <label htmlFor="text">Story Text:</label>
          <textarea 
            id="text" 
            value={text} 
            onChange={handleTextChange} 
            placeholder="Enter or paste your story text here..." 
            rows="10"
          />
        </div>

        <div className="segmentation-controls">
          <div className="input-group">
            <label htmlFor="segments">Number of Segments:</label>
            <input 
              type="number" 
              id="segments" 
              value={numSegments} 
              onChange={handleNumSegmentsChange} 
              min="2" 
              max="20" 
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="segmentationMethod">Segmentation Method:</label>
            <select 
              id="segmentationMethod" 
              value={segmentationMethod} 
              onChange={handleSegmentationMethodChange}
              disabled={isCustomSegmentation}
            >
              <option value="equal-length">Equal Length</option>
              <option value="content-based">Content-Based</option>
              <option value="emotion-based">Emotion-Based</option>
              <option value="multi-factor">Multi-Factor</option>
            </select>
          </div>
          
          <div className="input-group">
            <label>
              <input 
                type="checkbox" 
                checked={multiFactorSegmentation} 
                onChange={handleMultiFactorToggle}
                disabled={isCustomSegmentation || segmentationMethod !== 'multi-factor'} 
              />
              Use Multi-Factor Segmentation
            </label>
          </div>
          
          <div className="input-group">
            <label>
              <input 
                type="checkbox" 
                checked={isCustomSegmentation} 
                onChange={toggleCustomSegmentation} 
              />
              Use Custom Segmentation
            </label>
          </div>
        </div>

        {isCustomSegmentation && (
          <div className="custom-segments">
            <h3>Custom Segments</h3>
            {customSegments.map((segment, index) => (
              <div key={index} className="custom-segment">
                <label>{segment.name}:</label>
                <textarea 
                  value={segment.content} 
                  onChange={(e) => handleCustomSegmentChange(index, e.target.value)} 
                  placeholder={`Enter text for ${segment.name}...`} 
                  rows="5"
                />
                {customSegments.length > 1 && (
                  <button 
                    className="remove-segment" 
                    onClick={() => handleRemoveCustomSegment(index)}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button className="add-segment" onClick={handleAddCustomSegment}>
              Add Segment
            </button>
          </div>
        )}

        <div className="story-specific-terms">
          <div className="input-group">
            <label htmlFor="storyTerms">Story-Specific Terms (comma-separated):</label>
            <input 
              type="text" 
              id="storyTerms" 
              value={storySpecificInput} 
              onChange={handleStorySpecificInputChange} 
              placeholder="e.g., magic, hero, villain, sword" 
            />
          </div>
          
          <div className="input-group">
            <label>
              <input 
                type="checkbox" 
                checked={useCustomTerms} 
                onChange={toggleCustomTerms} 
              />
              Track Custom Terms
            </label>
          </div>
        </div>

        <div className="visualization-controls">
          <div className="input-group">
            <label htmlFor="visualizationType">Visualization Type:</label>
            <select 
              id="visualizationType" 
              value={visualizationType} 
              onChange={handleVisualizationTypeChange}
            >
              <option value="stacked">Stacked Chart</option>
              <option value="area">Area Chart</option>
            </select>
          </div>
          
          <div className="input-group">
            <label htmlFor="emotionThreshold">Emotion Change Threshold:</label>
            <input 
              type="range" 
              id="emotionThreshold" 
              min="0.5" 
              max="5.0" 
              step="0.1" 
              value={emotionChangeThreshold} 
              onChange={handleEmotionThresholdChange} 
            />
            <span>{emotionChangeThreshold}</span>
          </div>
        </div>

        <button 
          className="toggle-help" 
          onClick={toggleHelp}
        >
          {showHelp ? "Hide Help" : "Show Help"}
        </button>

        <button 
          className="toggle-advanced" 
          onClick={toggleAdvancedFeatures}
        >
          {showAdvancedFeatures ? "Hide Advanced Features" : "Show Advanced Features"}
        </button>

        {showAdvancedFeatures && (
          <div className="advanced-features">
            <h3>Advanced Features</h3>
            
            <div className="input-group">
              <label>
                <input 
                  type="checkbox" 
                  checked={useStopWordRemoval} 
                  onChange={handleStopWordRemovalToggle} 
                />
                Remove Stop Words
              </label>
            </div>
            
            <div className="input-group">
              <label>
                <input 
                  type="checkbox" 
                  checked={useContentBasedStages} 
                  onChange={handleContentBasedStagesToggle} 
                />
                Use Content-Based Stage Detection
              </label>
            </div>
            
            <div className="input-group">
              <label>
                <input 
                  type="checkbox" 
                  checked={linguisticAnalysisEnabled} 
                  onChange={handleLinguisticAnalysisToggle} 
                />
                Enable Linguistic Analysis
              </label>
            </div>
            
            <div className="input-group">
              <label>
                <input 
                  type="checkbox" 
                  checked={characterDangerAnalysisEnabled} 
                  onChange={handleCharacterDangerAnalysisToggle} 
                />
                Enable Character-Danger Analysis
              </label>
            </div>
            
            <div className="factor-weights">
              <h4>Segmentation Factor Weights:</h4>
              {Object.keys(factorWeights).map(factor => (
                <div key={factor} className="weight-slider">
                  <label htmlFor={`weight-${factor}`}>{factor.replace('_', '-')}:</label>
                  <input 
                    type="range" 
                    id={`weight-${factor}`} 
                    min="0" 
                    max="2" 
                    step="0.1" 
                    value={factorWeights[factor]} 
                    onChange={(e) => handleFactorWeightChange(factor, e.target.value)} 
                    disabled={!multiFactorSegmentation || segmentationMethod !== 'multi-factor'} 
                  />
                  <span>{factorWeights[factor]}</span>
                </div>
              ))}
            </div>
            
            <button 
              className="toggle-model-settings" 
              onClick={toggleModelSettings}
            >
              {showModelSettings ? "Hide Model Settings" : "Show Model Settings"}
            </button>
            
            {showModelSettings && (
              <div className="model-settings">
                <h4>Emotion Model Settings:</h4>
                
                <div className="input-group">
                  <label>
                    <input 
                      type="checkbox" 
                      checked={modelEnabled} 
                      onChange={handleModelToggle} 
                    />
                    Use Emotion Model
                  </label>
                </div>
                
                <div className="input-group">
                  <label htmlFor="apiEndpoint">API Endpoint:</label>
                  <input 
                    type="text" 
                    id="apiEndpoint" 
                    value={apiEndpoint} 
                    onChange={handleApiEndpointChange} 
                    disabled={!modelEnabled} 
                  />
                </div>
                
                <div className="input-group">
                  <label htmlFor="modelName">Model Name:</label>
                  <input 
                    type="text" 
                    id="modelName" 
                    value={modelName} 
                    onChange={handleModelNameChange} 
                    disabled={!modelEnabled} 
                  />
                </div>
                
                <div className="model-status">
                  Status: {isModelLoading ? "Loading..." : (modelLoaded ? "Loaded" : "Not Loaded")}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="action-buttons">
          <button 
            className="analyze-button" 
            onClick={analyzeText} 
            disabled={isAnalyzing || !text.trim()}
          >
            {isAnalyzing ? "Analyzing..." : "Analyze Text"}
          </button>
        </div>

        {errorMessage && (
          <div className="error-message">
            {errorMessage}
          </div>
        )}
      </div>

      {segments.length > 0 && (
        <div className="results-container">
          <h2>Analysis Results: {title || "Untitled Story"}</h2>
          
          <div className="chart-grid">
            <EmotionChart data={emotionProfiles} />
            <TensionChart data={narrativeTension} />
            <PaceChart data={actionPace} />
            <LinguisticFeaturesChart data={linguisticFeatures} />
            <CharacterDangerChart data={characterDangerProximity} />
            <TermFrequencyChart data={storySpecificTerms} />
          </div>
          
          <div className="segment-display">
            <h3>Story Segments and Analysis</h3>
            {segments.map((segment, index) => (
              <div key={index} className="segment-card">
                <h4>
                  Segment {index + 1}: 
                  {narrativeTension[index] && 
                    <span className="narrative-stage"> {narrativeTension[index].narrativeStage.replace('_', ' ')}</span>
                  }
                </h4>
                <div className="segment-metrics">
                  <div className="metric">
                    <span className="label">Tension: </span>
                    <span className="value">{safeToFixed(narrativeTension[index]?.value,2) || 'N/A'}</span>
                  </div>
                  <div className="metric">
                    <span className="label">Pace: </span>
                    <span className="value">{safeToFixed(actionPace[index]?.value,2) || 'N/A'}</span>
                  </div>
                  {characterDangerAnalysisEnabled && (
                    <div className="metric">
                      <span className="label">Character-Danger: </span>
                      <span className="value">{safeToFixed(characterDangerProximity[index]?.value, 2) || 'N/A'}</span>
                    </div>
                  )}
                </div>
                <div className="segment-emotions">
                  <h5>Emotions:</h5>
                  <div className="emotion-bars">
                    {emotionProfiles[index] && Object.keys(EMOTION_WEIGHTS).map(emotion => (
                      <div key={emotion} className="emotion-bar">
                        <span className="emotion-label">{emotion}</span>
                        <div className="bar-container">
                          <div 
                            className="bar" 
                            style={{ 
                              width: `${emotionProfiles[index][emotion] * 10}%`,
                              backgroundColor: EMOTION_COLORS[emotion] || '#8884d8' 
                            }}
                          />
                        </div>
                        <span className="emotion-value">
                          {safeToFixed(emotionProfiles[index][emotion],1) || '0.0'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="segment-text">
                  <p>{segment}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;