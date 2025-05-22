import React, { useState, useRef, useEffect } from 'react';
import EmotionAnalyzerComponent, { 
  EMOTION_COLORS, 
  EMOTION_LABELS, 
  analyzeEmotion, 
  createEmotionAnalyzer 
} from './EmotionAnalyzer';
import D3TensionPlot from './narrative-tension-visualizer';

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

// Define tension-related terms for detection
const TENSION_TERMS = [
  "tension", "suspense", "anticipation", "uncertainty", "uneasy", "nervous", 
  "apprehension", "anxiety", "dread", "foreboding", "ominous", "impending",
  "brewing", "looming", "trepidation", "unease", "worry", "concern",
  "stressed", "pressured", "strained", "taut", "fraught", "dire"
];

// Narrative Tension Display Component
const NarrativeTensionDisplay = ({ data }) => {
  // If no data is provided, show a placeholder
  if (!data) {
    return (
      <div className="tension-empty">
        <p>No narrative tension data available</p>
      </div>
    );
  }

  // Get tension data
  const { overallTension, tensionLevel, tensionArc, tensionPoints } = data;
  
  // Debug logging
  console.log('NarrativeTensionDisplay received data:', data);
  console.log('TensionArc:', tensionArc);
  
  // Format percentage for display
  const formatPercent = (value) => {
    return `${Math.round(value * 100)}%`;
  };

  // Check if the tension arc has any valid values
  const hasValidTensionArc = tensionArc && tensionArc.length > 0 && tensionArc.some(point => point.value > 0);
  
  // Create a connected line for the tension arc
  const createTensionPath = () => {
    if (!tensionArc || tensionArc.length === 0) {
      console.log('No tension arc data');
      return 'M0,90 L100,90';
    }
    
    console.log('Creating tension path with arc:', tensionArc);
    
    // If all values are zero or very low, create a flat line at 90% height
    if (!hasValidTensionArc) {
      console.log('No valid tension values, creating flat line');
      return 'M0,90 L100,90';
    }
    
    // Create SVG path - normalize to 0-100 coordinate system
    const pathCommands = tensionArc.map((point, index) => {
      // Convert position (0-1) to x coordinate (0-100)
      const x = point.position * 100;
      // Convert tension value (0-1) to y coordinate (10-90, inverted because SVG y increases downward)
      const y = 90 - (point.value * 80); // Scale to use 80% of height, leaving 10% margins
      
      console.log(`Point ${index}: position=${point.position}, value=${point.value}, x=${x}, y=${y}`);
      
      return (index === 0 ? `M${x},${y}` : `L${x},${y}`);
    });
    
    const path = pathCommands.join(' ');
    console.log('Generated SVG path:', path);
    return path;
  };
  
  // Generate some simulated tension points if none exist
  const ensureTensionPoints = () => {
    if (tensionPoints && tensionPoints.length > 0) return tensionPoints;
    
    // If no tension points, create some based on the arc
    if (tensionArc && tensionArc.length > 2) {
      const simulatedPoints = [];
      
      // Find a peak (if any)
      const peak = [...tensionArc].sort((a, b) => b.value - a.value)[0];
      if (peak && peak.value > 0.3) {
        simulatedPoints.push({
          type: 'peak',
          value: peak.value,
          text: "A moment of heightened tension in the narrative."
        });
      }
      
      // Find a drop (if any)
      const drop = [...tensionArc].sort((a, b) => a.value - b.value)[0];
      if (drop && drop.value < 0.2) {
        simulatedPoints.push({
          type: 'drop',
          value: drop.value,
          text: "A moment of reduced tension in the narrative."
        });
      }
      
      return simulatedPoints;
    }
    
    return [];
  };
  
  const displayTensionPoints = ensureTensionPoints();
  //console.log(tensionArc);
  return (
    <div className="tension-container">
      <div className="tension-summary">
        <div 
          className={`tension-level ${tensionLevel}`}
        >
          <h4>Overall Tension</h4>
          <div className="tension-value">{tensionLevel ? tensionLevel.charAt(0).toUpperCase() + tensionLevel.slice(1) : 'Unknown'}</div>
          <div className="tension-score">
            Score: {overallTension ? formatPercent(overallTension) : 'N/A'}
          </div>
        </div>
        
        <div className="tension-arc-container">
          <h4>Tension Arc</h4>
          <div className="tension-arc">
            <D3TensionPlot data={tensionArc} />
            
            {!hasValidTensionArc && (
              <div className="low-tension-message">
                This narrative has minimal tension fluctuations
              </div>
            )}
          </div>
          
          {/* Debug info */}
          <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>
            Debug: Arc points: {tensionArc ? tensionArc.length : 0}, 
            Valid: {hasValidTensionArc ? 'Yes' : 'No'}, 
            Overall: {overallTension ? overallTension.toFixed(3) : 'N/A'}
          </div>
        </div>
      </div>
      
      {displayTensionPoints.length > 0 && (
        <div className="tension-points-list">
          <h4>Key Tension Points</h4>
          <div className="points-container">
            {displayTensionPoints.map((point, index) => (
              <div key={index} className={`tension-point-card ${point.type}`}>
                <div className="point-type">{point.type.charAt(0).toUpperCase() + point.type.slice(1)}</div>
                <div className="point-text">
                  "{point.text}"
                </div>
                <div className="point-value">Tension: {formatPercent(point.value)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="tension-indicator-section">
        <h4>Tension Indicators</h4>
        <div className="tension-indicators">
          <div className="indicator">
            <div className="indicator-name">Emotion-Based Tension</div>
            <div className="indicator-value">
              {data.emotionBasedTension ? formatPercent(data.emotionBasedTension / 10) : "Not Available"}
            </div>
          </div>
          <div className="indicator">
            <div className="indicator-name">Content-Based Tension</div>
            <div className="indicator-value">
              {data.contentBasedTension ? formatPercent(data.contentBasedTension / 10) : "Not Available"}
            </div>
          </div>
          <div className="indicator">
            <div className="indicator-name">Narrative Stage</div>
            <div className="indicator-value">{data.narrativeStage || "Unknown"}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const UnifiedTextInput = ({ onAnalysisComplete }) => {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [analyzer, setAnalyzer] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const textareaRef = useRef(null);
  
  // Configuration state for emotion analysis
  const [analyzerConfig, setAnalyzerConfig] = useState({
    neutralWeight: 0.7,
    confidenceThreshold: 0.15,
    softmaxTemperature: 1.0
  });
  
  // Initialize the analyzer
  useEffect(() => {
    try {
      // Create an instance of the emotion analyzer with initial config
      const emotionAnalyzer = createEmotionAnalyzer(analyzerConfig);
      setAnalyzer(emotionAnalyzer);
    } catch (error) {
      console.error("Error initializing emotion analyzer:", error);
      setError("Failed to initialize the emotion analyzer");
    }
  }, []); // Initialize once on component mount
  
  // Update analyzer when config changes
  useEffect(() => {
    if (analyzer) {
      try {
        // Update analyzer with new config
        analyzer.updateConfig(analyzerConfig);
      } catch (error) {
        console.error("Error updating analyzer config:", error);
      }
    }
  }, [analyzerConfig, analyzer]);
  
  // Generate placeholder text for the textarea
  const placeholder = 
    "Enter your narrative text here...\n\n" +
    "Example:\n" +
    "John's heart raced as he peered around the corner. The alley was dark, much darker than he expected. " +
    "He took a deep breath to calm his nerves. There was no turning back now - he had to find out what was " +
    "happening in that abandoned building. Clutching the mysterious note tightly, he stepped forward into the shadows.";
  
  // Function to split text into paragraphs
  const segmentIntoParagraphs = (text) => {
    // Split by double line breaks or multiple line breaks
    return text
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
  };
  
  // Count words in text
  const countWords = (text) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };
  
  // Handler for config slider changes
  const handleConfigChange = (param, value) => {
    setAnalyzerConfig(prevConfig => ({
      ...prevConfig,
      [param]: value
    }));
  };
  
  // Enhanced tension calculation based on the research paper methodology
  const calculateNarrativeTensionFromEmotions = (emotionAnalysis) => {
    if (!emotionAnalysis || !emotionAnalysis.emotions) {
      return 0;
    }
    
    // Convert EmotionAnalyzer results to the format expected by tension calculation
    const emotionsObj = {};
    
    // EmotionAnalyzer returns emotions as an array of {label, prob}
    if (Array.isArray(emotionAnalysis.emotions)) {
      emotionAnalysis.emotions.forEach(emotion => {
        if (emotion.label && emotion.prob !== undefined && !isNaN(emotion.prob)) {
          emotionsObj[emotion.label] = emotion.prob;
        }
      });
    } else if (typeof emotionAnalysis.emotions === 'object') {
      // If it's already an object format
      Object.assign(emotionsObj, emotionAnalysis.emotions);
    }
    
    // If EmotionAnalyzer failed, use fallback emotion analysis
    if (Object.keys(emotionsObj).length === 0) {
      console.log('EmotionAnalyzer returned invalid data, using fallback analysis');
      // Use the text from the analysis to do simple rule-based emotion detection
      const text = emotionAnalysis.text || '';
      return calculateFallbackTension(text);
    }
    
    // Map EmotionAnalyzer labels to our tension calculation
    const emotionMappings = {
      'fear': emotionsObj.fear || 0,
      'anger': emotionsObj.anger || 0,
      'joy': emotionsObj.joy || 0,
      'sadness': emotionsObj.sadness || 0,
      'surprise': emotionsObj.surprise || 0,
      'disgust': emotionsObj.disgust || 0,
      // These might not be in the EmotionAnalyzer but we can derive them
      'tension': emotionsObj.tension || (emotionsObj.fear * 0.7 + emotionsObj.anger * 0.3) || 0,
      'danger': emotionsObj.danger || (emotionsObj.fear * 0.8 + emotionsObj.anger * 0.2) || 0,
      'relief': emotionsObj.relief || (emotionsObj.joy * 0.6 + (1 - (emotionsObj.fear || 0)) * 0.4) || 0
    };
    
    // Apply emotion weights to calculate tension (using the weights from EMOTION_WEIGHTS)
    let tensionScore = 0;
    Object.entries(EMOTION_WEIGHTS).forEach(([emotion, weight]) => {
      const emotionValue = emotionMappings[emotion] || 0;
      tensionScore += emotionValue * weight;
    });
    
    // Normalize to 0-1 scale (the paper uses 0-10, but we'll normalize for consistency)
    tensionScore = Math.max(0, Math.min(1, tensionScore / 10));
    
    console.log(`Tension calculation: emotions=${JSON.stringify(emotionMappings)}, score=${tensionScore}`);
    
    return tensionScore;
  };

  // Fallback tension calculation using simple rule-based analysis
  const calculateFallbackTension = (text) => {
    if (!text || typeof text !== 'string') return 0;
    
    const lowerText = text.toLowerCase();
    let tensionScore = 0;

    // Simple emotion indicators with weights
    const emotionIndicators = {
      fear: { words: ["fear", "scared", "afraid", "terrified", "worried", "panic", "dread"], weight: 1.5 },
      anger: { words: ["anger", "angry", "mad", "furious", "outraged", "rage", "hate"], weight: 0.8 },
      tension: { words: ["tense", "stress", "pressure", "urgent", "anxious", "nervous"], weight: 1.7 },
      danger: { words: ["danger", "threat", "risk", "peril", "hazard", "deadly", "fatal"], weight: 1.8 },
      joy: { words: ["joy", "happy", "excited", "thrilled", "delighted", "wonderful"], weight: -0.7 },
      relief: { words: ["relief", "relax", "calm", "peaceful", "ease", "comfort"], weight: -1.2 }
    };

    // Count keyword occurrences and apply weights
    Object.entries(emotionIndicators).forEach(([emotion, config]) => {
      config.words.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = lowerText.match(regex);
        if (matches) {
          tensionScore += matches.length * config.weight * 0.1; // Scale down for normalization
        }
      });
    });

    // Add punctuation-based tension indicators
    const exclamationCount = (lowerText.match(/!/g) || []).length;
    const questionCount = (lowerText.match(/\?/g) || []).length;
    const ellipsisCount = (lowerText.match(/\.\.\./g) || []).length;
    
    tensionScore += exclamationCount * 0.05;
    tensionScore += questionCount * 0.03;
    tensionScore += ellipsisCount * 0.02;

    // Normalize to 0-1 scale
    return Math.max(0, Math.min(1, tensionScore));
  };

  // Function to perform narrative analysis
  const performAnalysis = async (text, title) => {
    // Helper function to update progress with delay
    const updateProgress = async (value, delay = 150) => {
      setProgress(value);
      await new Promise(resolve => setTimeout(resolve, delay));
    };

    // Reset progress
    setProgress(0);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Split text into paragraphs
    const paragraphs = segmentIntoParagraphs(text);
    setProgress(8);
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Simulated processing delay
    setProgress(12);
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Analyze emotions in each paragraph with incremental progress
    const emotionResults = {
      paragraphs: []
    };
    
    // Process paragraphs one by one with progress updates (12% to 45%)
    const emotionProgressStep = 33 / Math.max(paragraphs.length, 1);
    
    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i];
      try {
        // Use the analyzeEmotion function from EmotionAnalyzer
        const analysis = await analyzeEmotion(paragraph, analyzerConfig);
        
        // Store the analysis results properly
        emotionResults.paragraphs.push({
          text: paragraph,
          index: i,
          emotions: analysis.emotions || [],
          dominant: analysis.predictedEmotion || 'neutral',
          probability: analysis.probability || 0,
          // Store the full analysis for tension calculation
          fullAnalysis: analysis
        });
      } catch (error) {
        console.error("Error analyzing paragraph:", error);
        emotionResults.paragraphs.push({
          text: paragraph,
          index: i,
          emotions: [{ label: 'neutral', prob: 1 }],
          dominant: 'neutral',
          probability: 1,
          fullAnalysis: { emotions: [{ label: 'neutral', prob: 1 }] }
        });
      }
      
      // Update progress for each paragraph processed
      const currentProgress = 12 + (i + 1) * emotionProgressStep;
      setProgress(currentProgress);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setProgress(45);
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Create emotion totals
    const emotionTotals = {};
    EMOTION_LABELS.forEach(label => { emotionTotals[label] = 0 });
    
    // Add to totals for overall emotion calculation
    emotionResults.paragraphs.forEach(paragraph => {
      paragraph.emotions.forEach(emotion => {
        emotionTotals[emotion.label] = (emotionTotals[emotion.label] || 0) + emotion.prob;
      });
    });
    
    setProgress(48);
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Calculate overall emotions
    const overallEmotions = Object.entries(emotionTotals)
      .map(([label, total]) => ({
        label,
        probability: total / Math.max(paragraphs.length, 1)
      }))
      .sort((a, b) => b.probability - a.probability);
    
    emotionResults.overall = {
      dominant: overallEmotions[0]?.label || 'neutral',
      probability: overallEmotions[0]?.probability || 0,
      emotions: overallEmotions
    };
    
    setProgress(52);
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Create emotional arc with proper validation
    emotionResults.emotionalArc = emotionResults.paragraphs.map((result, index) => {
      // Find the most intense non-neutral emotion
      let dominantEmotion = 'neutral';
      let emotionValue = 0;
      
      if (result.emotions && Array.isArray(result.emotions)) {
        const nonNeutral = result.emotions
          .filter(e => e.label !== 'neutral' && e.prob && !isNaN(e.prob))
          .sort((a, b) => b.prob - a.prob)[0];
          
        if (nonNeutral) {
          dominantEmotion = nonNeutral.label;
          emotionValue = nonNeutral.prob;
        }
      }
      
      return {
        index,
        emotion: dominantEmotion,
        value: emotionValue,
        position: emotionResults.paragraphs.length > 1 ? 
          index / (emotionResults.paragraphs.length - 1) : 0
      };
    });
    
    setProgress(56);
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Calculate tension data using the enhanced methodology and EmotionAnalyzer results
    const tensionData = {
      tensionByParagraph: emotionResults.paragraphs.map(paragraph => {
        // Use the full analysis from EmotionAnalyzer for tension calculation
        const tensionScore = calculateNarrativeTensionFromEmotions(paragraph.fullAnalysis);
        
        return {
          index: paragraph.index,
          text: paragraph.text.substring(0, 100) + (paragraph.text.length > 100 ? '...' : ''),
          tension: tensionScore,
          dominant: paragraph.dominant
        };
      }),
      
      tensionPoints: [],
      tensionArc: []
    };
    
    // Calculate overall tension
    tensionData.overallTension = tensionData.tensionByParagraph.reduce((sum, p) => sum + p.tension, 0) / 
      Math.max(tensionData.tensionByParagraph.length, 1);
    
    // Determine tension level
    tensionData.tensionLevel = 
      tensionData.overallTension > 0.7 ? 'high' :
      tensionData.overallTension > 0.4 ? 'medium' : 'low';
    
    // Create tension arc with proper data structure
    tensionData.tensionArc = tensionData.tensionByParagraph.map((item, index) => ({
      index,
      value: item.tension,
      position: tensionData.tensionByParagraph.length > 1 ? 
        index / (tensionData.tensionByParagraph.length - 1) : 0
    }));
    
    setProgress(65);
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Find tension peaks and drops
    for (let i = 1; i < tensionData.tensionByParagraph.length - 1; i++) {
      const prev = tensionData.tensionByParagraph[i-1].tension;
      const curr = tensionData.tensionByParagraph[i].tension;
      const next = tensionData.tensionByParagraph[i+1].tension;
      
      if (curr > prev && curr > next && curr > tensionData.overallTension) {
        tensionData.tensionPoints.push({
          index: i,
          type: 'peak',
          value: curr,
          text: tensionData.tensionByParagraph[i].text
        });
      } else if (curr < prev && curr < next && curr < tensionData.overallTension) {
        tensionData.tensionPoints.push({
          index: i,
          type: 'drop',
          value: curr,
          text: tensionData.tensionByParagraph[i].text
        });
      }
    }
    
    // Debug logging to check tension data
    console.log('Tension Data:', {
      overallTension: tensionData.overallTension,
      tensionLevel: tensionData.tensionLevel,
      tensionArc: tensionData.tensionArc,
      tensionByParagraph: tensionData.tensionByParagraph.map(p => ({ 
        index: p.index, 
        tension: p.tension,
        text: p.text.substring(0, 50) + '...'
      }))
    });
    
    setProgress(70);
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Continue with the rest of the analysis...
    // (Keep the existing pace, story structure, character danger, and linguistic analysis code)
    
    // Simulate pace data
    const paceData = {
      paceSegments: [],
      paceDistribution: {
        rapid: 0.15,
        fast: 0.25,
        moderate: 0.35,
        slow: 0.15,
        very_slow: 0.1
      },
      averagePace: 'moderate',
      paceScore: 0.55,
      actionHighlights: []
    };
    
    // Generate fake pace data
    const paceTypes = ['rapid', 'fast', 'moderate', 'slow', 'very_slow'];
    paceData.paceSegments = paragraphs.map((paragraph, index) => {
      const paceIndex = Math.min(Math.floor(Math.random() * 5), 4);
      const pace = paceTypes[paceIndex];
      
      return {
        index,
        text: paragraph.substring(0, 100) + (paragraph.length > 100 ? '...' : ''),
        pace,
        paceScore: 0.9 - (paceIndex * 0.2),
        percentage: 100 / paragraphs.length
      };
    });
    
    setProgress(78);
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Create story structure
    const storyStructure = {
      structure: paragraphs.length >= 5 ? 'detailed' : 'simple',
      segments: []
    };
    
    const totalParagraphs = paragraphs.length;
    
    if (totalParagraphs < 5) {
      // Simple structure
      storyStructure.segments = [
        {
          name: 'Beginning',
          startIndex: 0,
          endIndex: Math.floor(totalParagraphs * 0.3),
          percentage: 30,
          description: 'The opening of the narrative.',
          dominantEmotion: emotionResults.paragraphs[0]?.dominant || 'neutral',
          text: paragraphs[0]
        },
        {
          name: 'Middle',
          startIndex: Math.floor(totalParagraphs * 0.3),
          endIndex: Math.floor(totalParagraphs * 0.7),
          percentage: 40,
          description: 'The main part of the narrative.',
          dominantEmotion: emotionResults.paragraphs[Math.floor(totalParagraphs * 0.5)]?.dominant || 'neutral',
          text: paragraphs[Math.floor(totalParagraphs * 0.5)]
        },
        {
          name: 'End',
          startIndex: Math.floor(totalParagraphs * 0.7),
          endIndex: totalParagraphs - 1,
          percentage: 30,
          description: 'The conclusion of the narrative.',
          dominantEmotion: emotionResults.paragraphs[totalParagraphs - 1]?.dominant || 'neutral',
          text: paragraphs[totalParagraphs - 1]
        }
      ];
    } else {
      // Detailed structure
      let climaxIndex = Math.floor(totalParagraphs * 0.7);
      
      const setupEndIndex = Math.floor(totalParagraphs * 0.2);
      const risingActionEndIndex = climaxIndex - 1;
      const fallingActionStartIndex = climaxIndex + 1;
      const resolutionStartIndex = Math.floor(totalParagraphs * 0.85);
      
      const setupPercentage = (setupEndIndex + 1) / totalParagraphs * 100;
      const risingActionPercentage = (risingActionEndIndex - setupEndIndex) / totalParagraphs * 100;
      const climaxPercentage = 1 / totalParagraphs * 100;
      const fallingActionPercentage = (resolutionStartIndex - fallingActionStartIndex) / totalParagraphs * 100;
      const resolutionPercentage = (totalParagraphs - resolutionStartIndex) / totalParagraphs * 100;
      
      storyStructure.segments = [
        {
          name: 'Setup',
          startIndex: 0,
          endIndex: setupEndIndex,
          percentage: setupPercentage,
          description: 'Introduction of characters, setting, and initial situation.',
          dominantEmotion: emotionResults.paragraphs[0]?.dominant || 'neutral',
          text: paragraphs.slice(0, setupEndIndex + 1).join('\n\n').substring(0, 100) + '...'
        },
        {
          name: 'Rising Action',
          startIndex: setupEndIndex + 1,
          endIndex: risingActionEndIndex,
          percentage: risingActionPercentage,
          description: 'Complications and increasing tension leading to the climax.',
          dominantEmotion: emotionResults.paragraphs[Math.floor((setupEndIndex + risingActionEndIndex) / 2)]?.dominant || 'neutral',
          text: paragraphs.slice(setupEndIndex + 1, risingActionEndIndex + 1).join('\n\n').substring(0, 100) + '...'
        },
        {
          name: 'Climax',
          startIndex: climaxIndex,
          endIndex: climaxIndex,
          percentage: climaxPercentage,
          description: 'The turning point with highest tension.',
          dominantEmotion: emotionResults.paragraphs[climaxIndex]?.dominant || 'fear',
          text: paragraphs[climaxIndex]?.substring(0, 100) + '...' || ''
        },
        {
          name: 'Falling Action',
          startIndex: fallingActionStartIndex,
          endIndex: resolutionStartIndex - 1,
          percentage: fallingActionPercentage,
          description: 'Events following the climax, leading toward resolution.',
          dominantEmotion: emotionResults.paragraphs[Math.floor((fallingActionStartIndex + resolutionStartIndex) / 2)]?.dominant || 'neutral',
          text: paragraphs.slice(fallingActionStartIndex, resolutionStartIndex).join('\n\n').substring(0, 100) + '...'
        },
        {
          name: 'Resolution',
          startIndex: resolutionStartIndex,
          endIndex: totalParagraphs - 1,
          percentage: resolutionPercentage,
          description: 'Final outcome and conclusion of the narrative.',
          dominantEmotion: emotionResults.paragraphs[totalParagraphs - 1]?.dominant || 'neutral',
          text: paragraphs.slice(resolutionStartIndex).join('\n\n').substring(0, 100) + '...'
        }
      ];
    }
    
    setProgress(85);
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Character danger analysis
    const characterDanger = {
      characters: {},
      dangerHotspots: []
    };
    
    const nameRegex = /\b[A-Z][a-z]+\b/g;
    const potentialNames = {};
    
    paragraphs.forEach(paragraph => {
      const matches = paragraph.match(nameRegex) || [];
      matches.forEach(name => {
        const commonWords = ['The', 'A', 'An', 'But', 'And', 'Or', 'I', 'You', 'He', 'She', 'They', 'We', 'It'];
        if (!commonWords.includes(name)) {
          potentialNames[name] = (potentialNames[name] || 0) + 1;
        }
      });
    });
    
    const characterNames = Object.entries(potentialNames)
      .filter(([_, count]) => count >= 1)
      .map(([name]) => name)
      .slice(0, 5);
    
    if (characterNames.length === 0) {
      characterNames.push('Character');
    }
    
    characterNames.forEach(character => {
      const appearances = paragraphs
        .map((paragraph, index) => {
          if (paragraph.includes(character)) {
            return {
              paragraphIndex: index,
              text: paragraph.substring(0, 100) + (paragraph.length > 100 ? '...' : ''),
              emotion: emotionResults.paragraphs[index]?.dominant || 'neutral',
              tension: emotionResults.paragraphs[index]?.emotions
                .filter(e => ['fear', 'anger', 'surprise'].includes(e.label))
                .reduce((sum, e) => sum + e.prob, 0)
            };
          }
          return null;
        })
        .filter(Boolean);
      
      const dangerScore = appearances.reduce((sum, app) => sum + app.tension, 0) / 
        Math.max(appearances.length, 1);
      
      const dangerMoments = appearances
        .sort((a, b) => b.tension - a.tension)
        .slice(0, 2);
      
      const emotionCounts = {};
      appearances.forEach(app => {
        emotionCounts[app.emotion] = (emotionCounts[app.emotion] || 0) + 1;
      });
      
      const dominantEmotion = Object.entries(emotionCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([emotion]) => emotion)[0] || 'neutral';
      
      characterDanger.characters[character] = {
        name: character,
        dangerScore,
        dangerLevel: 
          dangerScore > 0.6 ? 'high' :
          dangerScore > 0.3 ? 'medium' : 'low',
        dominantEmotion,
        appearances: appearances.length,
        dangerMoments
      };
    });
    
    characterDanger.dangerHotspots = Object.values(characterDanger.characters)
      .filter(char => char.dangerLevel === 'high' || char.dangerMoments.length > 0)
      .flatMap(char => char.dangerMoments)
      .sort((a, b) => b.tension - a.tension)
      .slice(0, 3);
    
    setProgress(90);
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Linguistic analysis
    const linguisticData = {
      totalWords: countWords(text),
      totalSentences: text.split(/[.!?]+/).filter(s => s.trim().length > 0).length,
      paragraphCount: paragraphs.length,
      avgSentenceLength: 0,
      readabilityScore: 0,
      readabilityLevel: 'standard',
      descriptiveRatio: 0.14,
      strongVerbRatio: 0.08,
      adverbRatio: 0.05,
      statementRatio: 0.7,
      questionRatio: 0.1,
      exclamationRatio: 0.1,
      dialogueRatio: 0.1,
      styleProfile: {
        descriptive: 0.6,
        action_oriented: 0.4,
        dialogue_heavy: 0.2,
        emotionally_expressive: 0.5,
        formal: 0.3
      },
      styleSuggestions: [
        {
          title: "Enhanced Emotional Impact",
          description: "Consider using more emotion-specific language to strengthen the narrative's emotional impact."
        },
        {
          title: "Action-Dialogue Balance",
          description: "The narrative has a good balance of action and dialogue, which keeps the pacing varied and engaging."
        }
      ]
    };
    
    linguisticData.avgSentenceLength = linguisticData.totalWords / Math.max(linguisticData.totalSentences, 1);
    linguisticData.readabilityScore = 206.835 - (1.015 * linguisticData.avgSentenceLength) - (84.6 * (linguisticData.totalWords * 1.5 / linguisticData.totalWords));
    
    if (linguisticData.readabilityScore > 90) linguisticData.readabilityLevel = 'very_easy';
    else if (linguisticData.readabilityScore > 80) linguisticData.readabilityLevel = 'easy';
    else if (linguisticData.readabilityScore > 70) linguisticData.readabilityLevel = 'fairly_easy';
    else if (linguisticData.readabilityScore > 60) linguisticData.readabilityLevel = 'standard';
    else if (linguisticData.readabilityScore > 50) linguisticData.readabilityLevel = 'fairly_difficult';
    else if (linguisticData.readabilityScore > 30) linguisticData.readabilityLevel = 'difficult';
    else linguisticData.readabilityLevel = 'very_difficult';
    
    setProgress(95);
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Combine all results
    const results = {
      title: title.trim() || `Analysis - ${new Date().toLocaleDateString()}`,
      text,
      paragraphCount: paragraphs.length,
      totalWordCount: linguisticData.totalWords,
      emotion: emotionResults,
      tension: tensionData,
      pace: paceData,
      storyStructure,
      characterDanger,
      linguistic: linguisticData,
      timestamp: new Date().toISOString(),
      analyzerConfig
    };
    
    setProgress(100);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return results;
  };
  
  // Function to start the analysis
  const startAnalysis = async () => {
    if (!text.trim()) {
      setError('Please enter some text to analyze');
      return;
    }
    
    try {
      setIsAnalyzing(true);
      setError(null);
      setProgress(0);
      
      // Perform the analysis
      const results = await performAnalysis(text, title || `Analysis ${new Date().toLocaleDateString()}`);
      
      // Store results for display
      setAnalysisResults(results);
      
      // Call the callback function with the analysis results
      if (onAnalysisComplete) {
        onAnalysisComplete(results);
      }
      
    } catch (error) {
      console.error('Analysis error:', error);
      setError(`Analysis failed: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Focus the textarea on component mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);
  
  // Format value to display at most 2 decimal places
  const formatValue = (value) => {
    return Number(value).toFixed(2);
  };
  
  return (
    <div className="unified-text-input">
      {isAnalyzing ? (
        <div className="analysis-progress">
          <h3>Analyzing your narrative...</h3>
          <div className="progress-container">
            <div 
              className="progress-bar"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="progress-label">
            {progress < 30 && "Analyzing text structure..."}
            {progress >= 30 && progress < 60 && "Processing emotional patterns..."}
            {progress >= 60 && progress < 80 && "Analyzing narrative dynamics..."}
            {progress >= 80 && progress < 95 && "Identifying character relationships..."}
            {progress >= 95 && "Finalizing analysis..."}
          </div>
        </div>
      ) : (
        <div className="input-container">
          <div className="title-input">
            <label htmlFor="title-field">Analysis Title (optional)</label>
            <input
              id="title-field"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title for this analysis"
            />
          </div>
          
          <div className="model-settings">
            <h2>Model Settings</h2>
            
            <div className="slider-container">
              <label htmlFor="neutral-weight">Neutral Class Weight:</label>
              <div className="slider-with-value">
                <input
                  id="neutral-weight"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={analyzerConfig.neutralWeight}
                  onChange={(e) => handleConfigChange('neutralWeight', parseFloat(e.target.value))}
                />
                <span className="slider-value">{formatValue(analyzerConfig.neutralWeight)}</span>
              </div>
            </div>
            
            <div className="slider-container">
              <label htmlFor="confidence-threshold">Min Confidence Threshold:</label>
              <div className="slider-with-value">
                <input
                  id="confidence-threshold"
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.01"
                  value={analyzerConfig.confidenceThreshold}
                  onChange={(e) => handleConfigChange('confidenceThreshold', parseFloat(e.target.value))}
                />
                <span className="slider-value">{formatValue(analyzerConfig.confidenceThreshold)}</span>
              </div>
            </div>
            
            <div className="slider-container">
              <label htmlFor="softmax-temperature">Softmax Temperature:</label>
              <div className="slider-with-value">
                <input
                  id="softmax-temperature"
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={analyzerConfig.softmaxTemperature}
                  onChange={(e) => handleConfigChange('softmaxTemperature', parseFloat(e.target.value))}
                />
                <span className="slider-value">{formatValue(analyzerConfig.softmaxTemperature)}</span>
              </div>
            </div>
          </div>
          
          <div className="text-area">
            <label htmlFor="narrative-text">Narrative Text</label>
            <textarea
              id="narrative-text"
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={placeholder}
              rows={10}
            />
            <div className="text-stats">
              {text.trim() ? 
                `${countWords(text)} words, ${segmentIntoParagraphs(text).length} paragraphs` : 
                "Enter your text to analyze"}
            </div>
          </div>
          
          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}
          
          <div className="controls">
            <button 
              className="analyze-button"
              onClick={startAnalysis}
              disabled={!text.trim() || isAnalyzing}
            >
              Analyze Narrative
            </button>
            <button 
              className="clear-button"
              onClick={() => {
                setText('');
                setTitle('');
                setError(null);
                setAnalysisResults(null);
              }}
              disabled={isAnalyzing || (!text.trim() && !title.trim())}
            >
              Clear
            </button>
            <button 
              className="sample-button"
              onClick={() => {
                setText(`John's heart raced as he peered around the corner. The alley was dark, much darker than he expected. He took a deep breath to calm his nerves. There was no turning back now - he had to find out what was happening in that abandoned building. Clutching the mysterious note tightly, he stepped forward into the shadows.

The note had arrived three days ago, slipped under his apartment door. No envelope, no signature - just a hastily scribbled address and two words that made his blood run cold: "They know."

Sarah had warned him about getting involved. "This isn't some game, John," she'd said, her eyes filled with concern. "These people are dangerous." But how could he walk away now? After everything they had discovered?

The sound of footsteps echoed behind him. John froze, pressing himself against the cold brick wall. The footsteps grew louder, then stopped. He held his breath, counting the seconds. One. Two. Three. The footsteps started again, this time moving away. He exhaled slowly.

The address led to a rusted metal door at the end of the alley. No handle, no doorbell. John checked the note again, making sure he had the right place. As he ran his fingers along the edge of the door, he felt a small indentation. He pressed it, and the door clicked open.

"I was beginning to think you wouldn't come," said a familiar voice from within the darkness.`);
                setTitle("The Mysterious Note");
              }}
              disabled={isAnalyzing}
            >
              Load Sample
            </button>
          </div>
        </div>
      )}
      
      {/* Display analysis results including tension visualization */}
      {analysisResults && !isAnalyzing && (
        <div className="analysis-results">
          <h2>Analysis Results</h2>
          
          {/* Narrative Tension Display */}
          <div className="result-section">
            <h3>Narrative Tension Analysis</h3>
            <NarrativeTensionDisplay data={analysisResults.tension} />
          </div>
          
          {/* Additional results sections can be added here */}
          <div className="result-section">
            <h3>Summary</h3>
            <div className="summary-grid">
              <div className="summary-card">
                <h4>Overall Emotion</h4>
                <p>{analysisResults.emotion.overall.dominant}</p>
                <small>{(analysisResults.emotion.overall.probability * 100).toFixed(1)}% confidence</small>
              </div>
              <div className="summary-card">
                <h4>Tension Level</h4>
                <p>{analysisResults.tension.tensionLevel}</p>
                <small>{(analysisResults.tension.overallTension * 100).toFixed(1)}% intensity</small>
              </div>
              <div className="summary-card">
                <h4>Word Count</h4>
                <p>{analysisResults.totalWordCount}</p>
                <small>{analysisResults.paragraphCount} paragraphs</small>
              </div>
              <div className="summary-card">
                <h4>Readability</h4>
                <p>{analysisResults.linguistic.readabilityLevel.replace('_', ' ')}</p>
                <small>Score: {analysisResults.linguistic.readabilityScore.toFixed(1)}</small>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .unified-text-input {
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          padding: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .title-input {
          margin-bottom: 1rem;
        }
        
        .title-input label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: bold;
        }
        
        .title-input input {
          width: 100%;
          padding: 0.75rem;
          font-size: 1rem;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .model-settings {
          margin-bottom: 1.5rem;
          padding: 1rem;
          background-color: #f8f9fa;
          border-radius: 6px;
        }
        
        .model-settings h2 {
          margin-top: 0;
          margin-bottom: 1rem;
          font-size: 1.2rem;
          color: #333;
        }
        
        .slider-container {
          margin-bottom: 1rem;
        }
        
        .slider-container label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: bold;
          font-size: 0.9rem;
        }
        
        .slider-with-value {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .slider-with-value input[type="range"] {
          flex: 1;
        }
        
        .slider-value {
          min-width: 50px;
          font-family: monospace;
          font-weight: bold;
          color: #666;
        }
        
        .text-area {
          margin-bottom: 1.5rem;
        }
        
        .text-area label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: bold;
        }
        
        .text-area textarea {
          width: 100%;
          padding: 0.75rem;
          font-size: 1rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          resize: vertical;
          font-family: inherit;
          line-height: 1.5;
        }
        
        .text-stats {
          margin-top: 0.5rem;
          font-size: 0.9rem;
          color: #666;
          text-align: right;
        }
        
        .controls {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
        }
        
        .analyze-button {
          padding: 0.75rem 1.5rem;
          background-color: #4caf50;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          cursor: pointer;
          flex: 1;
          transition: background-color 0.2s;
        }
        
        .analyze-button:hover {
          background-color: #388e3c;
        }
        
        .analyze-button:disabled {
          background-color: #a5d6a7;
          cursor: not-allowed;
        }
        
        .clear-button {
          padding: 0.75rem 1.5rem;
          background-color: #f5f5f5;
          color: #333;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .clear-button:hover {
          background-color: #e0e0e0;
        }
        
        .clear-button:disabled {
          background-color: #f5f5f5;
          color: #bdbdbd;
          cursor: not-allowed;
        }
        
        .sample-button {
          padding: 0.75rem 1.5rem;
          background-color: #2196f3;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .sample-button:hover {
          background-color: #1976d2;
        }
        
        .sample-button:disabled {
          background-color: #bbdefb;
          cursor: not-allowed;
        }
        
        .error-message {
          margin: 1rem 0;
          padding: 0.75rem;
          background-color: #ffebee;
          color: #c62828;
          border-radius: 4px;
          border-left: 4px solid #c62828;
        }
        
        .error-message p {
          margin: 0;
        }
        
        .analysis-progress {
          text-align: center;
          padding: 2rem 1rem;
        }
        
        .analysis-progress h3 {
          margin-top: 0;
          margin-bottom: 1.5rem;
          color: #333;
        }
        
        .progress-container {
          height: 20px;
          background-color: #f5f5f5;
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 1rem;
        }
        
        .progress-bar {
          height: 100%;
          background-color: #4caf50;
          transition: width 0.3s ease;
        }
        
        .progress-label {
          font-size: 0.9rem;
          color: #666;
        }
        
        .analysis-results {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 2px solid #eee;
        }
        
        .analysis-results h2 {
          margin-top: 0;
          margin-bottom: 1.5rem;
          color: #333;
        }
        
        .result-section {
          margin-bottom: 2rem;
        }
        
        .result-section h3 {
          margin-top: 0;
          margin-bottom: 1rem;
          color: #555;
        }
        
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }
        
        .summary-card {
          background-color: #f8f9fa;
          padding: 1rem;
          border-radius: 6px;
          text-align: center;
        }
        
        .summary-card h4 {
          margin-top: 0;
          margin-bottom: 0.5rem;
          color: #666;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .summary-card p {
          margin: 0 0 0.25rem 0;
          font-size: 1.5rem;
          font-weight: bold;
          color: #333;
          text-transform: capitalize;
        }
        
        .summary-card small {
          color: #888;
          font-size: 0.8rem;
        }
        
        /* Tension visualization styles */
        .tension-container {
          padding: 1rem;
          background-color: #f5f5f5;
          border-radius: 8px;
          margin-bottom: 2rem;
        }
        
        .tension-summary {
          display: flex;
          flex-wrap: wrap;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }
        
        .tension-level {
          padding: 1.5rem;
          border-radius: 8px;
          text-align: center;
          min-width: 150px;
          color: white;
        }
        
        .tension-level.high {
          background-color: #f44336;
        }
        
        .tension-level.medium {
          background-color: #ff9800;
        }
        
        .tension-level.low {
          background-color: #4caf50;
        }
        
        .tension-level h4 {
          margin-top: 0;
          margin-bottom: 0.5rem;
          opacity: 0.9;
        }
        
        .tension-value {
          font-size: 1.5rem;
          font-weight: bold;
          margin-bottom: 0.25rem;
        }
        
        .tension-score {
          font-size: 1.1rem;
          opacity: 0.9;
        }
        
        .tension-arc-container {
          flex: 1;
          min-width: 300px;
        }
        
        .tension-arc-container h4 {
          margin-top: 0;
          margin-bottom: 1rem;
        }
        
        .tension-arc {
          height: 200px;
          background-color: white;
          border-radius: 8px;
          position: relative;
          padding: 1rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .tension-arc svg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          padding: 1rem;
          box-sizing: border-box;
        }
        
        .low-tension-message {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #666;
          text-align: center;
          font-style: italic;
          background-color: rgba(255, 255, 255, 0.8);
          padding: 0.5rem 1rem;
          border-radius: 4px;
        }
        
        .tension-points-list {
          margin-top: 2rem;
        }
        
        .tension-points-list h4 {
          margin-top: 0;
          margin-bottom: 1rem;
        }
        
        .points-container {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
        }
        
        .tension-point-card {
          flex: 1;
          min-width: 250px;
          padding: 1rem;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border-top: 4px solid #f44336;
        }
        
        .tension-point-card.peak {
          border-top-color: #f44336;
        }
        
        .tension-point-card.drop {
          border-top-color: #4caf50;
        }
        
        .point-type {
          font-weight: bold;
          margin-bottom: 0.5rem;
        }
        
        .point-text {
          font-style: italic;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
        }
        
        .point-value {
          font-size: 0.9rem;
          color: #666;
        }
        
        .tension-empty {
          padding: 2rem;
          text-align: center;
          background-color: #f5f5f5;
          border-radius: 8px;
          color: #757575;
        }
        
        .tension-indicator-section {
          margin-top: 2rem;
          background-color: white;
          border-radius: 8px;
          padding: 1rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .tension-indicator-section h4 {
          margin-top: 0;
          margin-bottom: 1rem;
        }
        
        .tension-indicators {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
        }
        
        .indicator {
          flex: 1;
          min-width: 200px;
          padding: 1rem;
          background-color: #f5f5f5;
          border-radius: 4px;
        }
        
        .indicator-name {
          font-weight: bold;
          margin-bottom: 0.5rem;
        }
        
        .indicator-value {
          font-size: 1.1rem;
        }
      `}</style>
    </div>
  );
};

export default UnifiedTextInput;