import { useState, useEffect } from 'react';
import compromise from 'compromise';

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

// Keywords that signal different emotions for advanced detection
const EMOTION_INDICATORS = {
  "fear": ["fear", "scared", "afraid", "terrified", "worried", "panic", "dread", "frightened", "horror", "alarmed", "anxious", "nervous", "trepidation", "uneasy", "shaken", "trembling", "quiver", "tremble", "quaking", "fearsome", "scary", "startled", "apprehensive", "ominous", "threatening"],
  "anger": ["anger", "angry", "mad", "furious", "outraged", "rage", "hate", "irate", "irritated", "livid", "enraged", "fuming", "seething", "indignant", "infuriated", "incensed", "wrathful", "annoyed", "aggravated", "exasperated", "resentful", "bitter", "cross", "hostile", "antagonistic"],
  "joy": ["joy", "happy", "excited", "thrilled", "delighted", "wonderful", "celebrate", "pleased", "elated", "ecstatic", "jubilant", "cheerful", "gleeful", "glowing", "overjoyed", "exuberant", "blissful", "merry", "radiant", "euphoric", "uplifted", "exhilarated", "gratified", "satisfied", "triumphant"],
  "sadness": ["sad", "unhappy", "depressed", "sorrow", "grief", "miserable", "cry", "melancholy", "heartbroken", "gloomy", "dejected", "despair", "dismal", "morose", "mournful", "despondent", "forlorn", "down", "downcast", "crestfallen", "devastated", "bereft", "woeful", "disconsolate", "wretched"],
  "surprise": ["surprise", "shocked", "astonished", "amazed", "startled", "unexpected", "stunned", "astounded", "aghast", "bewildered", "dumbfounded", "flabbergasted", "thunderstruck", "taken aback", "staggered", "wonder", "awe", "disbelief", "incredulous", "dazed", "confounded", "nonplussed", "staggered"],
  "tension": ["tense", "stress", "pressure", "urgent", "anxious", "nervous", "on edge", "agitated", "uncertain", "wary", "suspicious", "restless", "strained", "rigid", "taut", "tight", "wound up", "braced", "apprehensive", "troubled", "stressful", "intensity", "suspense", "unsettled", "anticipation"], 
  "danger": ["danger", "threat", "risk", "peril", "hazard", "deadly", "fatal", "unsafe", "vulnerable", "exposed", "threatened", "in jeopardy", "precarious", "menace", "endangering", "sinister", "treacherous", "dire", "critical", "imperiled", "doomed", "dangerous", "grave", "mortal", "lethal"], 
  "relief": ["relief", "relax", "calm", "peaceful", "ease", "comfort", "safe", "soothed", "reassured", "unburdened", "alleviated", "freed", "respite", "reprieve", "release", "liberated", "mollified", "placated", "comforted", "secure", "tranquil", "serene", "rescued", "settled", "delivered"], 
  "disgust": ["disgust", "repulsed", "revolted", "disgusted", "gross", "sickening", "nauseated", "appalled", "repelled", "abhorrent", "loathsome", "repugnant", "offensive", "foul", "vile", "nasty", "distasteful", "despicable", "odious", "revulsion", "aversion", "repulsion", "objectionable", "horrid", "disdain"]
};

// Intensifier words and sentence patterns that amplify emotion
const EMOTION_INTENSIFIERS = {
  "adverbs": ["extremely", "intensely", "deeply", "profoundly", "terribly", "awfully", "remarkably", "incredibly", "exceedingly", "absolutely", "utterly", "thoroughly", "dreadfully", "desperately", "enormously", "tremendously", "unbearably", "overwhelmingly", "shockingly", "extraordinarily"],
  "phrases": ["more than ever", "like never before", "to the core", "beyond words", "to the bone", "through and through", "to the marrow", "unlike anything", "without compare", "beyond measure", "without equal", "in the extreme", "to no end", "beyond belief", "past endurance"],
  "sentence_patterns": ["never had", "never before", "for the first time", "unlike anything", "nothing could", "nothing would", "if only", "what if", "couldn't help but", "couldn't stop", "had no choice but to", "was forced to", "had to", "could only"]
};

// Additional contextual indicators (scene descriptors, weather, etc.)
const CONTEXTUAL_INDICATORS = {
  "setting_fear": ["dark", "night", "shadow", "fog", "mist", "storm", "abandoned", "empty", "silent", "deserted", "unknown", "strange", "unfamiliar", "isolated", "remote", "forest", "woods", "basement", "attic", "cave"],
  "setting_tension": ["enclosed", "confined", "trapped", "narrow", "corridor", "passage", "maze", "labyrinth", "locked", "sealed", "blocked", "barred", "restricted", "prison", "cell", "cage", "bound", "tied", "restrained", "controlled"],
  "weather_mood": {
    "storm": ["tension", "fear"],
    "rain": ["sadness", "relief"],
    "sunshine": ["joy"],
    "wind": ["tension", "unease"],
    "fog": ["mystery", "tension", "fear"],
    "snow": ["isolation", "quiet", "peaceful"],
    "heat": ["anger", "irritation", "tension"]
  },
  "time_indicators": {
    "night": ["fear", "tension"],
    "twilight": ["tension", "transition"],
    "dawn": ["hope", "relief"],
    "midnight": ["fear", "climax"],
    "dusk": ["foreboding", "tension"]
  }
};

// Action verbs for pace analysis with intensity ratings
const ACTION_VERBS_INTENSITY = {
  "high": ["sprint", "dash", "flee", "charge", "attack", "explode", "shatter", "crash", "slam", "smash", "strike", "blast", "lunge", "thrust", "leap", "plunge", "burst", "rush", "storm", "shoot", "stab", "slash", "tear", "rip"],
  "medium": ["run", "jump", "throw", "push", "pull", "break", "climb", "swing", "hit", "cut", "chase", "escape", "struggle", "fight", "grab", "seize", "shake", "pound", "knock", "beat", "battle", "clash", "tackle", "dodge"],
  "low": ["walk", "move", "turn", "step", "place", "put", "touch", "tap", "lift", "pick", "hold", "carry", "bring", "take", "reach", "pass", "hand", "shift", "slide", "roll", "lean", "rest", "stand", "sit"]
};

// Sentence and paragraph structures that heighten tension
const STRUCTURAL_TENSION_PATTERNS = {
  "short_sentences": 1.5,  // Multiplier for tension when many short sentences appear in sequence
  "fragments": 1.8,        // Sentence fragments
  "one_word_paragraphs": 2.0, // Single word on its own line
  "questions": 1.3,        // Questions increase tension
  "exclamations": 1.7,     // Exclamations heighten emotion
  "ellipsis": 1.4          // ... creates suspense
};

// Enhanced emotion analysis using balanced model techniques
export function useEnhancedEmotionAnalysis() {
  // State for emotion analysis configuration
  const [config, setConfig] = useState({
    neutralWeight: 0.7,        // Reduce neutral classifications
    temperatureScale: 1.0,     // Soften or sharpen emotion distributions
    confidenceThreshold: 0.15, // Minimum confidence needed
    contextualBoost: 0.8,      // How much contextual cues boost emotion scores
    structuralMultiplier: 0.7, // Impact of structural elements on emotion
    intensifierStrength: 1.2,  // How much intensifiers amplify emotions
    semanticWeight: 1.5,       // Impact of semantic analysis
    characterProximityWeight: 1.3 // Weight for character-danger proximity
  });
  
  // Update configuration
  const updateConfig = (newConfig) => {
    setConfig({...config, ...newConfig});
  };
  
  // Core emotion analysis function
  const analyzeEmotions = (text) => {
    if (!text || !text.trim()) {
      return generateEmptyEmotionProfile();
    }
    
    try {
      // Normalize text
      const normalizedText = text.trim().toLowerCase();
      
      // Base emotion analysis from keyword indicators
      const baseEmotions = performBaseEmotionAnalysis(normalizedText);
      
      // Enhance with contextual analysis
      const contextualEmotions = enhanceWithContextualAnalysis(normalizedText, baseEmotions);
      
      // Check for structural patterns that affect emotions
      const structuralEmotions = enhanceWithStructuralAnalysis(text, contextualEmotions);
      
      // Apply proximity analysis (characters near danger)
      const proximityEnhancedEmotions = enhanceWithProximityAnalysis(text, structuralEmotions);
      
      // Apply linguistic intensifiers
      const intensifiedEmotions = enhanceWithIntensifiers(text, proximityEnhancedEmotions);
      
      // Apply sentence-level semantic analysis
      const semanticEmotions = enhanceWithSemanticAnalysis(text, intensifiedEmotions);
      
      // Final balancing with configuration weights
      const balancedEmotions = balanceEmotionProfile(semanticEmotions);
      
      return balancedEmotions;
    } catch (error) {
      console.error("Error in enhanced emotion analysis:", error);
      return generateEmptyEmotionProfile();
    }
  };
  
  // Generate an empty emotion profile
  const generateEmptyEmotionProfile = () => {
    const profile = {};
    Object.keys(EMOTION_WEIGHTS).forEach(emotion => {
      profile[emotion] = 0;
    });
    return profile;
  };
  
  // Base emotion analysis using keyword indicators
  const performBaseEmotionAnalysis = (text) => {
    const emotions = {};
    
    // Initialize all emotions to zero
    Object.keys(EMOTION_WEIGHTS).forEach(emotion => {
      emotions[emotion] = 0;
    });
    
    // Count keyword occurrences for each emotion
    Object.keys(EMOTION_INDICATORS).forEach(emotion => {
      let score = 0;
      let wordCount = text.split(/\s+/).length || 1; // Avoid division by zero
      
      EMOTION_INDICATORS[emotion].forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = text.match(regex);
        if (matches) {
          // Score based on keyword frequency and text length
          score += (matches.length / wordCount) * 100;
        }
      });
      
      // Normalize score to 0-10 range
      emotions[emotion] = Math.min(10, score);
    });
    
    // Ensure at least some emotion is present in very short texts
    if (text.length < 50) {
      const totalEmotionScore = Object.values(emotions).reduce((sum, val) => sum + val, 0);
      if (totalEmotionScore < 3) {
        // Give a baseline score to most likely emotions based on text features
        if (text.includes('!')) emotions.surprise = Math.max(emotions.surprise, 3);
        if (text.includes('?')) emotions.tension = Math.max(emotions.tension, 2.5);
      }
    }
    
    return emotions;
  };
  
  // Enhance emotions with contextual analysis
  const enhanceWithContextualAnalysis = (text, baseEmotions) => {
    const enhancedEmotions = {...baseEmotions};
    const boost = config.contextualBoost;
    
    // Check for setting indicators
    CONTEXTUAL_INDICATORS.setting_fear.forEach(term => {
      if (new RegExp(`\\b${term}\\b`, 'gi').test(text)) {
        enhancedEmotions.fear += 0.5 * boost;
        enhancedEmotions.tension += 0.3 * boost;
      }
    });
    
    CONTEXTUAL_INDICATORS.setting_tension.forEach(term => {
      if (new RegExp(`\\b${term}\\b`, 'gi').test(text)) {
        enhancedEmotions.tension += 0.6 * boost;
        enhancedEmotions.fear += 0.2 * boost;
      }
    });
    
    // Check for weather influences
    Object.entries(CONTEXTUAL_INDICATORS.weather_mood).forEach(([weather, moods]) => {
      if (new RegExp(`\\b${weather}\\b`, 'gi').test(text)) {
        moods.forEach(mood => {
          // Find the corresponding emotion
          Object.keys(enhancedEmotions).forEach(emotion => {
            if (emotion === mood || emotion.includes(mood)) {
              enhancedEmotions[emotion] += 0.7 * boost;
            }
          });
        });
      }
    });
    
    // Check for time indicators
    Object.entries(CONTEXTUAL_INDICATORS.time_indicators).forEach(([time, moods]) => {
      if (new RegExp(`\\b${time}\\b`, 'gi').test(text)) {
        moods.forEach(mood => {
          // Find the corresponding emotion
          Object.keys(enhancedEmotions).forEach(emotion => {
            if (emotion === mood || emotion.includes(mood)) {
              enhancedEmotions[emotion] += 0.5 * boost;
            }
          });
        });
      }
    });
    
    // Normalize each emotion score to range 0-10
    Object.keys(enhancedEmotions).forEach(emotion => {
      enhancedEmotions[emotion] = Math.min(10, enhancedEmotions[emotion]);
    });
    
    return enhancedEmotions;
  };
  
  // Enhance emotions with structural analysis
  const enhanceWithStructuralAnalysis = (text, baseEmotions) => {
    const enhancedEmotions = {...baseEmotions};
    const multiplier = config.structuralMultiplier;
    
    // Split into sentences and paragraphs
    const sentences = text.split(/[.!?]+/g).filter(s => s.trim().length > 0);
    const paragraphs = text.split(/\n+/).filter(p => p.trim().length > 0);
    
    // Check for short sentences (fewer than 8 words)
    const shortSentences = sentences.filter(s => s.split(/\s+/).length < 8);
    const shortSentenceRatio = sentences.length > 0 ? shortSentences.length / sentences.length : 0;
    
    // If many sentences are short, this creates staccato rhythm, increasing tension
    if (shortSentenceRatio > 0.5 && sentences.length >= 3) {
      enhancedEmotions.tension += shortSentenceRatio * 2 * multiplier * STRUCTURAL_TENSION_PATTERNS.short_sentences;
      enhancedEmotions.fear += shortSentenceRatio * multiplier;
    }
    
    // Check for sentence fragments
    const fragments = sentences.filter(s => {
      const words = s.trim().split(/\s+/);
      return words.length < 5 && words.length > 0 && 
        !(/^[A-Z]/.test(s.trim())) && // Doesn't start with capital letter
        !(/\b(I|you|he|she|they|we|it)\b/i.test(s)); // Doesn't contain common subject pronouns
    });
    
    if (fragments.length > 0) {
      const fragmentBoost = Math.min(2, fragments.length * 0.5) * multiplier * STRUCTURAL_TENSION_PATTERNS.fragments;
      enhancedEmotions.tension += fragmentBoost;
      enhancedEmotions.fear += fragmentBoost * 0.5;
    }
    
    // Check for one-word paragraphs (high impact)
    const oneWordParagraphs = paragraphs.filter(p => p.trim().split(/\s+/).length === 1);
    if (oneWordParagraphs.length > 0) {
      const owpBoost = Math.min(3, oneWordParagraphs.length) * multiplier * STRUCTURAL_TENSION_PATTERNS.one_word_paragraphs;
      enhancedEmotions.tension += owpBoost;
      enhancedEmotions.surprise += owpBoost * 0.7;
    }
    
    // Check for questions (raise tension, uncertainty)
    const questionCount = (text.match(/\?/g) || []).length;
    if (questionCount > 0) {
      const questionBoost = Math.min(2, questionCount * 0.4) * multiplier * STRUCTURAL_TENSION_PATTERNS.questions;
      enhancedEmotions.tension += questionBoost;
      enhancedEmotions.fear += questionBoost * 0.3;
    }
    
    // Check for exclamations (heighten emotion)
    const exclamationCount = (text.match(/!/g) || []).length;
    if (exclamationCount > 0) {
      const exclamationBoost = Math.min(2.5, exclamationCount * 0.5) * multiplier * STRUCTURAL_TENSION_PATTERNS.exclamations;
      // Boost the highest existing emotion
      const highestEmotion = Object.entries(enhancedEmotions)
        .filter(([emotion]) => emotion !== 'tension') // Don't consider tension
        .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)[0];
      
      if (highestEmotion) {
        enhancedEmotions[highestEmotion[0]] += exclamationBoost;
      }
      
      // Also boost surprise and tension
      enhancedEmotions.surprise += exclamationBoost * 0.5;
      enhancedEmotions.tension += exclamationBoost * 0.3;
    }
    
    // Check for ellipsis (creates suspense)
    const ellipsisCount = (text.match(/\.{3,}|…/g) || []).length;
    if (ellipsisCount > 0) {
      const ellipsisBoost = Math.min(2, ellipsisCount * 0.6) * multiplier * STRUCTURAL_TENSION_PATTERNS.ellipsis;
      enhancedEmotions.tension += ellipsisBoost;
      enhancedEmotions.fear += ellipsisBoost * 0.4;
    }
    
    // Normalize each emotion score to range 0-10
    Object.keys(enhancedEmotions).forEach(emotion => {
      enhancedEmotions[emotion] = Math.min(10, enhancedEmotions[emotion]);
    });
    
    return enhancedEmotions;
  };
  
  // Enhance emotions with proximity analysis (characters near danger)
  const enhanceWithProximityAnalysis = (text, baseEmotions) => {
    const enhancedEmotions = {...baseEmotions};
    const proximityWeight = config.characterProximityWeight;
    
    // Character indicators (common character references)
    const characterPatterns = [
      "he", "she", "they", "him", "her", "them", "his", "hers", "their", "man", "woman", 
      "boy", "girl", "child", "person", "protagonist", "hero", "heroine", "villain"
    ];
    
    // Danger indicators
    const dangerPatterns = [
      "danger", "threat", "risk", "peril", "hazard", "harm", "hurt", "injury", "wound", 
      "damage", "attack", "fight", "battle", "weapon", "gun", "knife", "sword", "blood",
      "kill", "murder", "death", "die", "deadly", "fatal", "lethal", "trap", "ambush"
    ];
    
    // Split into sentences for proximity analysis
    const sentences = text.split(/[.!?]+/g).filter(s => s.trim().length > 0);
    let proximityScore = 0;
    
    sentences.forEach(sentence => {
      const lowerSentence = sentence.toLowerCase();
      
      // Check if sentence contains both character and danger references
      const hasCharacter = characterPatterns.some(term => 
        new RegExp(`\\b${term}\\b`, 'i').test(lowerSentence));
        
      const hasDanger = dangerPatterns.some(term => 
        new RegExp(`\\b${term}\\b`, 'i').test(lowerSentence));
        
      if (hasCharacter && hasDanger) {
        // Calculate proximity boost based on sentence length
        // Shorter sentences create tighter proximity
        const words = sentence.split(/\s+/).length;
        const proximityBoost = words < 10 ? 1.2 : (words < 20 ? 0.8 : 0.5);
        
        proximityScore += proximityBoost;
      }
    });
    
    // Apply proximity score to relevant emotions
    const totalProximityBoost = Math.min(4, proximityScore) * proximityWeight;
    
    enhancedEmotions.tension += totalProximityBoost;
    enhancedEmotions.fear += totalProximityBoost * 0.8;
    enhancedEmotions.danger += totalProximityBoost * 1.2;
    
    // Normalize each emotion score to range 0-10
    Object.keys(enhancedEmotions).forEach(emotion => {
      enhancedEmotions[emotion] = Math.min(10, enhancedEmotions[emotion]);
    });
    
    return enhancedEmotions;
  };
  
  // Enhance emotions with linguistic intensifiers
  const enhanceWithIntensifiers = (text, baseEmotions) => {
    const enhancedEmotions = {...baseEmotions};
    const intensifierStrength = config.intensifierStrength;
    
    // Check for intensifying adverbs
    const adverbBoosts = EMOTION_INTENSIFIERS.adverbs.reduce((count, adverb) => {
      const regex = new RegExp(`\\b${adverb}\\b`, 'gi');
      const matches = text.match(regex) || [];
      return count + matches.length;
    }, 0);
    
    // Check for intensifying phrases
    const phraseBoosts = EMOTION_INTENSIFIERS.phrases.reduce((count, phrase) => {
      const regex = new RegExp(phrase, 'gi');
      const matches = text.match(regex) || [];
      return count + matches.length * 1.5; // Phrases are stronger than single adverbs
    }, 0);
    
    // Check for sentence patterns that intensify emotions
    const patternBoosts = EMOTION_INTENSIFIERS.sentence_patterns.reduce((count, pattern) => {
      const regex = new RegExp(pattern, 'gi');
      const matches = text.match(regex) || [];
      return count + matches.length * 2; // These patterns have strong impact
    }, 0);
    
    // Calculate total intensification factor
    const totalIntensification = Math.min(3, (adverbBoosts + phraseBoosts + patternBoosts) * 0.3) * intensifierStrength;
    
    if (totalIntensification > 0.3) {
      // Find the dominant emotions (top 2)
      const sortedEmotions = Object.entries(enhancedEmotions)
        .sort(([, scoreA], [, scoreB]) => scoreB - scoreA);
      
      // Intensify the dominant emotions
      if (sortedEmotions.length > 0) {
        // Primary emotion gets full boost
        enhancedEmotions[sortedEmotions[0][0]] += totalIntensification;
        
        // Secondary emotion gets partial boost
        if (sortedEmotions.length > 1) {
          enhancedEmotions[sortedEmotions[1][0]] += totalIntensification * 0.6;
        }
      }
    }
    
    // Normalize each emotion score to range 0-10
    Object.keys(enhancedEmotions).forEach(emotion => {
      enhancedEmotions[emotion] = Math.min(10, enhancedEmotions[emotion]);
    });
    
    return enhancedEmotions;
  };
  
  // Enhance emotions with sentence-level semantic analysis
  const enhanceWithSemanticAnalysis = (text, baseEmotions) => {
    const enhancedEmotions = {...baseEmotions};
    const semanticWeight = config.semanticWeight;
    
    try {
      // Use compromise for basic NLP analysis if available
      if (typeof compromise === 'function') {
        const doc = compromise(text);
        
        // Analyze verbs by intensity
        try {
          const verbs = doc.verbs().out('array');
          let highIntensityVerbs = 0;
          let mediumIntensityVerbs = 0;
          
          verbs.forEach(verb => {
            const verbLower = verb.toLowerCase();
            
            // Check verb intensity categories
            if (ACTION_VERBS_INTENSITY.high.some(v => verbLower.includes(v))) {
              highIntensityVerbs++;
            } else if (ACTION_VERBS_INTENSITY.medium.some(v => verbLower.includes(v))) {
              mediumIntensityVerbs++;
            }
          });
          
          // Calculate verb intensity factor
          const verbIntensityBoost = Math.min(2.5, (highIntensityVerbs * 0.7 + mediumIntensityVerbs * 0.3) * 0.5);
          
          if (verbIntensityBoost > 0.5) {
            enhancedEmotions.tension += verbIntensityBoost * semanticWeight;
            enhancedEmotions.danger += verbIntensityBoost * 0.7 * semanticWeight;
            
            // Apply to existing dominant emotion too
            const dominantEmotion = Object.entries(enhancedEmotions)
              .filter(([emotion]) => !['tension', 'danger'].includes(emotion))
              .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)[0];
              
            if (dominantEmotion) {
              enhancedEmotions[dominantEmotion[0]] += verbIntensityBoost * 0.5 * semanticWeight;
            }
          }
        } catch (e) {
          console.error("Error analyzing verbs:", e);
          // Continue with other analyses
        }
        
        // Analyze negations (often increase tension or negative emotions)
        try {
          const negations = doc.match('not').out('array').length + 
                          doc.match('never').out('array').length +
                          doc.match('no').out('array').length;
          
          if (negations > 0) {
            const negationBoost = Math.min(2, negations * 0.4);
            
            // Boost negative emotions
            enhancedEmotions.fear += negationBoost * 0.4 * semanticWeight;
            enhancedEmotions.tension += negationBoost * 0.6 * semanticWeight;
            enhancedEmotions.sadness += negationBoost * 0.3 * semanticWeight;
            
            // Reduce positive emotions
            enhancedEmotions.joy = Math.max(0, enhancedEmotions.joy - negationBoost * 0.5);
            enhancedEmotions.relief = Math.max(0, enhancedEmotions.relief - negationBoost * 0.5);
          }
        } catch (e) {
          console.error("Error analyzing negations:", e);
          // Continue with other analyses
        }
      }
    } catch (e) {
      console.error("Error in semantic analysis:", e);
      // Continue without semantic enhancement
    }
    
    // Normalize each emotion score to range 0-10
    Object.keys(enhancedEmotions).forEach(emotion => {
      enhancedEmotions[emotion] = Math.min(10, enhancedEmotions[emotion]);
    });
    
    return enhancedEmotions;
  };
  
  // Final balancing of emotion profile based on configuration
  const balanceEmotionProfile = (emotions) => {
    const balancedEmotions = {...emotions};
    
    // Apply neutral weight adjustment
    const neutralWeight = config.neutralWeight;
    // We assume that lacking strong emotions means the text is neutral
    // Calculate total emotion intensity
    const totalIntensity = Object.values(balancedEmotions).reduce((sum, score) => sum + score, 0);
    const averageIntensity = totalIntensity / Object.keys(balancedEmotions).length;
    
    // If overall intensity is low, apply neutral adjustment
    if (averageIntensity < 3) {
      const boostFactor = 1 / (neutralWeight * 0.5 + 0.5);
      
      // Reduce all emotions proportionally
      Object.keys(balancedEmotions).forEach(emotion => {
        const currentValue = balancedEmotions[emotion];
        balancedEmotions[emotion] = currentValue * boostFactor * neutralWeight;
      });
      
      // Increase "relief" as the default neutral emotional state
      balancedEmotions.relief = Math.min(10, balancedEmotions.relief + (3 - averageIntensity) * 0.7);
    }
    
    // Apply temperature scaling to sharpen or soften emotion distribution
    const temperature = config.temperatureScale;
    if (temperature !== 1.0) {
      // Find the dominant emotion
      const dominantEmotion = Object.entries(balancedEmotions)
        .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)[0];
      
      if (dominantEmotion) {
        // Apply temperature scaling - lower temp = sharper distribution, higher = more uniform
        Object.keys(balancedEmotions).forEach(emotion => {
          if (emotion === dominantEmotion[0]) {
            // Dominant emotion gets boosted with low temperature
            balancedEmotions[emotion] = Math.min(10, balancedEmotions[emotion] * (2 - temperature));
          } else {
            // Other emotions get reduced with low temperature
            balancedEmotions[emotion] = balancedEmotions[emotion] * temperature;
          }
        });
      }
    }
    
    // Apply confidence thresholding
    const confidenceThreshold = config.confidenceThreshold;
    const maxEmotion = Object.entries(balancedEmotions)
      .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)[0];
    
    // If the strongest emotion is below threshold, boost it
    if (maxEmotion && maxEmotion[1] < confidenceThreshold * 10) {
      balancedEmotions[maxEmotion[0]] = confidenceThreshold * 10;
    }
    
    // Final normalization to 0-10
    Object.keys(balancedEmotions).forEach(emotion => {
      balancedEmotions[emotion] = Math.min(10, Math.max(0, balancedEmotions[emotion]));
    });
    
    return balancedEmotions;
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
  
  return {
    analyzeEmotions,
    calculateTension,
    config,
    updateConfig
  };
}