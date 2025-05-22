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

// Narrative structure templates
const NARRATIVE_STRUCTURES = {
  'traditional': {
    name: 'Traditional 5-Act',
    segments: [
      { name: 'Exposition', expectedTensionRange: [0.1, 0.3], position: 0.0, weight: 0.5 },
      { name: 'Rising Action', expectedTensionRange: [0.3, 0.7], position: 0.25, weight: 1.0 },
      { name: 'Climax', expectedTensionRange: [0.7, 1.0], position: 0.6, weight: 2.0 },
      { name: 'Falling Action', expectedTensionRange: [0.4, 0.7], position: 0.8, weight: 1.2 },
      { name: 'Resolution', expectedTensionRange: [0.1, 0.4], position: 1.0, weight: 0.6 }
    ]
  },
  'freytag': {
    name: 'Freytag\'s Pyramid',
    segments: [
      { name: 'Exposition', expectedTensionRange: [0.1, 0.2], position: 0.0, weight: 0.3 },
      { name: 'Inciting Incident', expectedTensionRange: [0.4, 0.6], position: 0.12, weight: 0.8 },
      { name: 'Rising Action', expectedTensionRange: [0.5, 0.8], position: 0.4, weight: 1.2 },
      { name: 'Climax', expectedTensionRange: [0.8, 1.0], position: 0.75, weight: 2.0 },
      { name: 'Falling Action', expectedTensionRange: [0.3, 0.6], position: 0.87, weight: 1.2 },
      { name: 'Resolution', expectedTensionRange: [0.1, 0.3], position: 1.0, weight: 0.6 }
    ]
  },
  'three_act': {
    name: 'Three-Act Structure',
    segments: [
      { name: 'Act I - Setup', expectedTensionRange: [0.1, 0.4], position: 0.0, weight: 0.6 },
      { name: 'Act II - Confrontation', expectedTensionRange: [0.4, 0.9], position: 0.25, weight: 1.5 },
      { name: 'Act III - Resolution', expectedTensionRange: [0.2, 0.7], position: 0.75, weight: 0.8 }
    ]
  },
  'hero_journey': {
    name: 'Hero\'s Journey (8 stages)',
    segments: [
      { name: 'Ordinary World', expectedTensionRange: [0.1, 0.2], position: 0.0, weight: 0.3 },
      { name: 'Call to Adventure', expectedTensionRange: [0.3, 0.5], position: 0.125, weight: 0.7 },
      { name: 'Crossing Threshold', expectedTensionRange: [0.4, 0.6], position: 0.25, weight: 0.9 },
      { name: 'Tests & Trials', expectedTensionRange: [0.5, 0.8], position: 0.375, weight: 1.3 },
      { name: 'Ordeal', expectedTensionRange: [0.7, 1.0], position: 0.5, weight: 2.0 },
      { name: 'Reward', expectedTensionRange: [0.3, 0.6], position: 0.625, weight: 0.8 },
      { name: 'The Road Back', expectedTensionRange: [0.4, 0.7], position: 0.75, weight: 1.1 },
      { name: 'Return Transformed', expectedTensionRange: [0.1, 0.4], position: 0.875, weight: 0.5 }
    ]
  }
};

// Data-driven segmentation algorithms
class NarrativeSegmenter {
  constructor(config = {}) {
    this.config = {
      minSegmentLength: config.minSegmentLength || 50,
      tensionSensitivity: config.tensionSensitivity || 0.3,
      emotionSensitivity: config.emotionSensitivity || 0.25,
      paceChangeSensitivity: config.paceChangeSensitivity || 0.2,
      ...config
    };
  }

  calculateRollingAverage(data, windowSize = 3) {
    const result = [];
    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - Math.floor(windowSize / 2));
      const end = Math.min(data.length, i + Math.ceil(windowSize / 2));
      const window = data.slice(start, end);
      const average = window.reduce((sum, val) => sum + val, 0) / window.length;
      result.push(average);
    }
    return result;
  }

  detectSignificantChanges(values, sensitivity = 0.3) {
    const changes = [];
    const smoothedValues = this.calculateRollingAverage(values, 3);
    
    for (let i = 1; i < smoothedValues.length - 1; i++) {
      const current = smoothedValues[i];
      const prev = smoothedValues[i - 1];
      const next = smoothedValues[i + 1];
      
      const isPeak = current > prev && current > next && Math.abs(current - prev) > sensitivity;
      const isValley = current < prev && current < next && Math.abs(prev - current) > sensitivity;
      
      const prevSlope = current - prev;
      const nextSlope = next - current;
      const slopeChange = Math.abs(prevSlope - nextSlope);
      const isInflectionPoint = slopeChange > sensitivity * 2;
      
      if (isPeak || isValley || isInflectionPoint) {
        changes.push({
          index: i,
          type: isPeak ? 'peak' : isValley ? 'valley' : 'inflection',
          value: current,
          significance: Math.max(Math.abs(current - prev), Math.abs(next - current), slopeChange)
        });
      }
    }
    
    return changes;
  }

  segmentByTension(paragraphData, targetSegments = 5) {
    if (paragraphData.length < 2) {
      return this.createFallbackSegment(paragraphData);
    }
    
    const tensionValues = paragraphData.map(p => p.tension || 0);
    const changes = this.detectSignificantChanges(tensionValues, this.config.tensionSensitivity);
    
    console.log('Tension-based segmentation:', {
      tensionValues: tensionValues,
      changes: changes,
      sensitivity: this.config.tensionSensitivity
    });
    
    let significantChanges = changes
      .sort((a, b) => b.significance - a.significance)
      .slice(0, Math.min(targetSegments - 1, changes.length));
    
    // If no significant changes found, create evenly spaced segments
    if (significantChanges.length === 0 && paragraphData.length >= targetSegments) {
      console.log('No significant tension changes found, creating evenly spaced segments');
      significantChanges = [];
      for (let i = 1; i < targetSegments; i++) {
        const index = Math.floor((i * paragraphData.length) / targetSegments);
        significantChanges.push({ index, type: 'artificial', significance: 0.1 });
      }
    }
    
    const segmentBoundaries = [0, ...significantChanges.map(c => c.index), paragraphData.length - 1]
      .sort((a, b) => a - b)
      .filter((value, index, arr) => index === 0 || value !== arr[index - 1]);
    
    console.log('Tension segment boundaries:', segmentBoundaries);
    return this.createSegmentsFromBoundaries(paragraphData, segmentBoundaries, 'tension');
  }

  segmentByEmotion(paragraphData, targetSegments = 5) {
    if (paragraphData.length < 2) {
      return this.createFallbackSegment(paragraphData);
    }
    
    const emotionChanges = [];
    
    for (let i = 1; i < paragraphData.length; i++) {
      const currentEmotions = paragraphData[i].emotions || [];
      const prevEmotions = paragraphData[i - 1].emotions || [];
      
      let changeScore = 0;
      const emotionMap = {};
      
      currentEmotions.forEach(e => emotionMap[e.label] = e.prob);
      prevEmotions.forEach(e => {
        const currentProb = emotionMap[e.label] || 0;
        changeScore += Math.abs(currentProb - e.prob);
      });
      
      // Also check for dominant emotion changes
      const currentDominant = currentEmotions[0]?.label || 'neutral';
      const prevDominant = prevEmotions[0]?.label || 'neutral';
      if (currentDominant !== prevDominant) {
        changeScore += 0.3; // Boost score for dominant emotion changes
      }
      
      if (changeScore > this.config.emotionSensitivity) {
        emotionChanges.push({
          index: i,
          changeScore,
          type: 'emotion_shift'
        });
      }
    }
    
    console.log('Emotion-based segmentation:', {
      emotionChanges: emotionChanges,
      sensitivity: this.config.emotionSensitivity
    });
    
    let significantChanges = emotionChanges
      .sort((a, b) => b.changeScore - a.changeScore)
      .slice(0, Math.min(targetSegments - 1, emotionChanges.length));
    
    // If no significant emotion changes found, create evenly spaced segments
    if (significantChanges.length === 0 && paragraphData.length >= targetSegments) {
      console.log('No significant emotion changes found, creating evenly spaced segments');
      significantChanges = [];
      for (let i = 1; i < targetSegments; i++) {
        const index = Math.floor((i * paragraphData.length) / targetSegments);
        significantChanges.push({ index, changeScore: 0.1, type: 'artificial' });
      }
    }
    
    const segmentBoundaries = [0, ...significantChanges.map(c => c.index), paragraphData.length - 1]
      .sort((a, b) => a - b)
      .filter((value, index, arr) => index === 0 || value !== arr[index - 1]);
    
    console.log('Emotion segment boundaries:', segmentBoundaries);
    return this.createSegmentsFromBoundaries(paragraphData, segmentBoundaries, 'emotion');
  }

  segmentByCombinedMetrics(paragraphData, targetSegments = 5) {
    if (paragraphData.length < 2) {
      return this.createFallbackSegment(paragraphData);
    }
    
    const combinedScores = paragraphData.map((p, i) => {
      const tension = p.tension || 0;
      const emotionIntensity = (p.emotions || []).reduce((sum, e) => sum + e.prob, 0);
      const pace = p.pace || 0.5;
      
      return {
        index: i,
        combinedScore: tension * 0.4 + emotionIntensity * 0.3 + pace * 0.3,
        tension,
        emotionIntensity,
        pace
      };
    });
    
    const changes = this.detectSignificantChanges(
      combinedScores.map(s => s.combinedScore), 
      this.config.tensionSensitivity
    );
    
    console.log('Combined metrics segmentation:', {
      combinedScores: combinedScores.map((s, i) => ({ index: i, score: s.combinedScore })),
      changes: changes,
      sensitivity: this.config.tensionSensitivity
    });
    
    let significantChanges = changes
      .sort((a, b) => b.significance - a.significance)
      .slice(0, Math.min(targetSegments - 1, changes.length));
    
    // If no significant changes found, create evenly spaced segments
    if (significantChanges.length === 0 && paragraphData.length >= targetSegments) {
      console.log('No significant combined metric changes found, creating evenly spaced segments');
      significantChanges = [];
      for (let i = 1; i < targetSegments; i++) {
        const index = Math.floor((i * paragraphData.length) / targetSegments);
        significantChanges.push({ index, significance: 0.1, type: 'artificial' });
      }
    }
    
    const segmentBoundaries = [0, ...significantChanges.map(c => c.index), paragraphData.length - 1]
      .sort((a, b) => a - b)
      .filter((value, index, arr) => index === 0 || value !== arr[index - 1]);
    
    console.log('Combined segment boundaries:', segmentBoundaries);
    return this.createSegmentsFromBoundaries(paragraphData, segmentBoundaries, 'combined');
  }

  createFallbackSegment(paragraphData) {
    console.log('Creating fallback single segment');
    const avgTension = paragraphData.reduce((sum, p) => sum + (p.tension || 0), 0) / paragraphData.length;
    const dominantEmotions = this.calculateDominantEmotions(paragraphData);
    const wordCount = paragraphData.reduce((sum, p) => sum + (p.wordCount || 0), 0);
    
    return [{
      index: 0,
      name: 'Complete Text',
      startParagraph: 0,
      endParagraph: paragraphData.length - 1,
      paragraphs: paragraphData,
      avgTension,
      dominantEmotions,
      wordCount,
      position: 0,
      method: 'fallback',
      description: this.generateSegmentDescription(avgTension, dominantEmotions, 'fallback')
    }];
  }

  createSegmentsFromBoundaries(paragraphData, boundaries, method) {
    const segments = [];
    
    for (let i = 0; i < boundaries.length - 1; i++) {
      const startIdx = boundaries[i];
      const endIdx = boundaries[i + 1];
      const segmentParagraphs = paragraphData.slice(startIdx, endIdx + 1);
      
      const avgTension = segmentParagraphs.reduce((sum, p) => sum + (p.tension || 0), 0) / segmentParagraphs.length;
      const dominantEmotions = this.calculateDominantEmotions(segmentParagraphs);
      const wordCount = segmentParagraphs.reduce((sum, p) => sum + (p.wordCount || 0), 0);
      
      segments.push({
        index: i,
        name: this.inferSegmentName(i, boundaries.length - 1, avgTension, dominantEmotions),
        startParagraph: startIdx,
        endParagraph: endIdx,
        paragraphs: segmentParagraphs,
        avgTension,
        dominantEmotions,
        wordCount,
        position: startIdx / (paragraphData.length - 1),
        method,
        description: this.generateSegmentDescription(avgTension, dominantEmotions, method)
      });
    }
    
    return segments;
  }

  calculateDominantEmotions(paragraphs) {
    const emotionTotals = {};
    
    paragraphs.forEach(p => {
      (p.emotions || []).forEach(e => {
        emotionTotals[e.label] = (emotionTotals[e.label] || 0) + e.prob;
      });
    });
    
    return Object.entries(emotionTotals)
      .map(([label, total]) => ({ label, prob: total / paragraphs.length }))
      .sort((a, b) => b.prob - a.prob)
      .slice(0, 3);
  }

  inferSegmentName(index, totalSegments, avgTension, dominantEmotions) {
    const position = index / Math.max(totalSegments - 1, 1);
    
    if (totalSegments <= 3) {
      if (index === 0) return 'Beginning';
      if (index === totalSegments - 1) return 'End';
      return 'Middle';
    }
    
    if (position < 0.2) {
      return avgTension < 0.3 ? 'Exposition' : 'Inciting Incident';
    } else if (position < 0.6) {
      return avgTension > 0.6 ? 'Rising Action' : 'Development';
    } else if (position < 0.8) {
      return avgTension > 0.7 ? 'Climax' : 'Turning Point';
    } else {
      return avgTension < 0.4 ? 'Resolution' : 'Falling Action';
    }
  }

  generateSegmentDescription(avgTension, dominantEmotions, method) {
    const tensionDesc = avgTension > 0.7 ? 'high tension' : 
                       avgTension > 0.4 ? 'moderate tension' : 'low tension';
    const emotionDesc = dominantEmotions.length > 0 ? 
                       `dominated by ${dominantEmotions[0].label}` : 'emotionally neutral';
    
    return `Segment with ${tensionDesc}, ${emotionDesc} (detected via ${method} analysis)`;
  }

  segment(paragraphData, method = 'combined', targetSegments = 5) {
    if (!paragraphData || paragraphData.length === 0) {
      return [];
    }

    const maxPossibleSegments = Math.floor(paragraphData.length / (this.config.minSegmentLength / 50));
    const actualTargetSegments = Math.min(targetSegments, maxPossibleSegments, paragraphData.length);

    switch (method) {
      case 'tension':
        return this.segmentByTension(paragraphData, actualTargetSegments);
      case 'emotion':
        return this.segmentByEmotion(paragraphData, actualTargetSegments);
      case 'combined':
      default:
        return this.segmentByCombinedMetrics(paragraphData, actualTargetSegments);
    }
  }
}

// Narrative Tension Display Component
const NarrativeTensionDisplay = ({ data, segments }) => {
  if (!data) {
    return (
      <div className="tension-empty">
        <p>No narrative tension data available</p>
      </div>
    );
  }

  const { overallTension, tensionLevel, tensionArc, tensionPoints } = data;
  
  const formatPercent = (value) => {
    return `${Math.round(value * 100)}%`;
  };

  const hasValidTensionArc = tensionArc && tensionArc.length > 0 && tensionArc.some(point => point.value > 0);
  
  return (
    <div className="tension-container">
      <div className="tension-summary">
        <div className={`tension-level ${tensionLevel}`}>
          <h4>Overall Tension</h4>
          <div className="tension-value">{tensionLevel ? tensionLevel.charAt(0).toUpperCase() + tensionLevel.slice(1) : 'Unknown'}</div>
          <div className="tension-score">
            Score: {overallTension ? formatPercent(overallTension) : 'N/A'}
          </div>
        </div>
        
        <div className="tension-arc-container">
          <h4>Tension Arc</h4>
          <div className="tension-arc">
            <D3TensionPlot data={tensionArc} segments={segments} />
            
            {!hasValidTensionArc && (
              <div className="low-tension-message">
                This narrative has minimal tension fluctuations
              </div>
            )}
          </div>
        </div>
      </div>
      
      {segments && segments.length > 0 && (
        <div className="segments-display">
          <h4>Narrative Segments</h4>
          <div className="segments-grid">
            {segments.map((segment, index) => (
              <div key={index} className="segment-card">
                <div className="segment-header">
                  <h5>{segment.name}</h5>
                  <span className="segment-position">
                    {formatPercent(segment.position)} - {formatPercent((segment.endParagraph + 1) / (segments[segments.length - 1].endParagraph + 1))}
                  </span>
                </div>
                <div className="segment-stats">
                  <div className="stat">
                    <span className="stat-label">Tension:</span>
                    <span className="stat-value">{formatPercent(segment.avgTension)}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Primary Emotion:</span>
                    <span className="stat-value">{segment.dominantEmotions[0]?.label || 'neutral'}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Paragraphs:</span>
                    <span className="stat-value">{segment.paragraphs.length}</span>
                  </div>
                </div>
                <div className="segment-description">{segment.description}</div>
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
  
  const [segmentationConfig, setSegmentationConfig] = useState({
    mode: 'automatic',
    method: 'combined',
    targetSegments: 5,
    structure: 'traditional',
    minSegmentLength: 50,
    tensionSensitivity: 0.3,
    emotionSensitivity: 0.25
  });
  
  const [analyzerConfig, setAnalyzerConfig] = useState({
    neutralWeight: 0.7,
    confidenceThreshold: 0.15,
    softmaxTemperature: 1.0
  });
  
  useEffect(() => {
    try {
      const emotionAnalyzer = createEmotionAnalyzer(analyzerConfig);
      setAnalyzer(emotionAnalyzer);
    } catch (error) {
      console.error("Error initializing emotion analyzer:", error);
      setError("Failed to initialize the emotion analyzer");
    }
  }, []);
  
  useEffect(() => {
    if (analyzer) {
      try {
        analyzer.updateConfig(analyzerConfig);
      } catch (error) {
        console.error("Error updating analyzer config:", error);
      }
    }
  }, [analyzerConfig, analyzer]);
  
  const placeholder = 
    "Enter your narrative text here...\n\n" +
    "Example:\n" +
    "John's heart raced as he peered around the corner. The alley was dark, much darker than he expected. " +
    "He took a deep breath to calm his nerves. There was no turning back now - he had to find out what was " +
    "happening in that abandoned building. Clutching the mysterious note tightly, he stepped forward into the shadows.";
  
  const segmentIntoParagraphs = (text) => {
    return text
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
  };
  
  const countWords = (text) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };
  
  const handleConfigChange = (param, value) => {
    setAnalyzerConfig(prevConfig => ({
      ...prevConfig,
      [param]: value
    }));
  };

  const handleSegmentationConfigChange = (param, value) => {
    setSegmentationConfig(prevConfig => ({
      ...prevConfig,
      [param]: value
    }));
  };
  
  const calculateNarrativeTensionFromEmotions = (emotionAnalysis) => {
    if (!emotionAnalysis || !emotionAnalysis.emotions) {
      return 0;
    }  
    const emotionsObj = {};
    if (Array.isArray(emotionAnalysis.emotions)) {
      emotionAnalysis.emotions.forEach(emotion => {
        if (emotion.label && emotion.prob !== undefined && !isNaN(emotion.prob)) {
          emotionsObj[emotion.label] = emotion.prob;
        }
      });
    } else if (typeof emotionAnalysis.emotions === 'object') {
      Object.assign(emotionsObj, emotionAnalysis.emotions);
    }
    const text = emotionAnalysis.text || '';
    if (Object.keys(emotionsObj).length === 0) {
      console.log('EmotionAnalyzer returned invalid data, using advanced fallback analysis');
      return calculateAdvancedTension(text, []);
    }
    // Enhanced emotion mappings with better tension correlation
    const emotionMappings = {
      'fear': emotionsObj.fear || 0,
      'anger': emotionsObj.anger || 0,
      'joy': emotionsObj.joy || 0,
      'sadness': emotionsObj.sadness || 0,
      'surprise': emotionsObj.surprise || 0,
      'disgust': emotionsObj.disgust || 0,
      'tension': emotionsObj.tension || (emotionsObj.fear * 0.7 + emotionsObj.anger * 0.3) || 0,
      'danger': emotionsObj.danger || (emotionsObj.fear * 0.8 + emotionsObj.anger * 0.2) || 0,
      'relief': emotionsObj.relief || (emotionsObj.joy * 0.6 + (1 - (emotionsObj.fear || 0)) * 0.4) || 0
    };
    
    // Calculate base tension from emotions
    let emotionTension = 0;
    Object.entries(EMOTION_WEIGHTS).forEach(([emotion, weight]) => {
      const emotionValue = emotionMappings[emotion] || 0;
      emotionTension += emotionValue * weight;
    });
    
    // Normalize emotion tension
    emotionTension = Math.max(0, Math.min(1, emotionTension / 5));
    
    // Get advanced linguistic tension analysis
    const emotionArray = Object.entries(emotionMappings).map(([label, prob]) => ({ label, prob }));
    const linguisticTension = calculateAdvancedTension(text, emotionArray);
    
    // Combine emotion-based and linguistic-based tension
    const finalTension = Math.min(1, emotionTension * 0.6 + linguisticTension * 0.4);
    
    console.log(`Enhanced tension calculation:`, {
      emotions: emotionMappings,
      emotionTension: emotionTension,
      linguisticTension: linguisticTension,
      finalTension: finalTension,
      textPreview: text.substring(0, 50) + '...'
    });
    
    return finalTension;
  };



// Enhanced linguistic and tension analysis with WordNet-inspired semantic relations
const TENSION_SEMANTIC_NETWORK = {
  // Hypernyms (general categories) with their hyponyms (specific instances)
  stress: {
    verbs: ["stress", "strain", "pressure", "burden", "overload", "overwhelm", "exhaust"],
    weight: 0.6,
    entailments: ["tension", "anxiety", "worry"]
  },
  conflict: {
    verbs: ["fight", "battle", "struggle", "clash", "confront", "oppose", "resist", "challenge"],
    weight: 0.8,
    entailments: ["tension", "aggression", "hostility"]
  },
  urgency: {
    verbs: ["rush", "hurry", "race", "dash", "sprint", "bolt", "flee", "escape"],
    weight: 0.7,
    entailments: ["haste", "pressure", "emergency"]
  },
  emotional_intensity: {
    verbs: ["explode", "burst", "erupt", "flare", "ignite", "trigger", "provoke", "inflame"],
    weight: 0.9,
    entailments: ["intensity", "passion", "violence"]
  },
  physical_tension: {
    verbs: ["tighten", "clench", "grip", "squeeze", "constrict", "compress", "contract"],
    weight: 0.5,
    entailments: ["physical_stress", "muscular_tension"]
  },
  psychological_pressure: {
    verbs: ["worry", "fret", "agonize", "torment", "haunt", "plague", "trouble", "disturb"],
    weight: 0.6,
    entailments: ["anxiety", "fear", "unease"]
  },
  sudden_action: {
    verbs: ["snap", "crack", "break", "shatter", "collapse", "fall", "drop", "plunge"],
    weight: 0.8,
    entailments: ["suddenness", "disruption", "change"]
  },
  threatening: {
    verbs: ["threaten", "menace", "intimidate", "terrorize", "frighten", "scare", "alarm"],
    weight: 0.9,
    entailments: ["fear", "danger", "hostility"]
  },
  relief: {
    verbs: ["relax", "ease", "calm", "soothe", "comfort", "settle", "rest", "breathe"],
    weight: -0.4,
    entailments: ["peace", "comfort", "safety"]
  }
};

const RHETORICAL_DEVICES = {
  metaphor: {
    patterns: [
      /\b(like|as)\s+[\w\s]+\b/gi,  // similes
      /\b[\w]+\s+is\s+[\w\s]+\b/gi,  // metaphorical statements
    ],
    tension_modifier: 0.15
  },
  repetition: {
    patterns: [
      /\b(\w+)\s+\1\b/gi,  // immediate repetition
    ],
    tension_modifier: 0.1
  },
  alliteration: {
    patterns: [
      /\b([bcdfghjklmnpqrstvwxyz])\w*\s+\1\w*/gi,  // consonant alliteration
    ],
    tension_modifier: 0.05
  },
  rhetorical_questions: {
    patterns: [
      /\?(?=\s|$)/g,  // questions
    ],
    tension_modifier: 0.2
  },
  exclamatory: {
    patterns: [
      /!(?=\s|$)/g,  // exclamations
    ],
    tension_modifier: 0.25
  },
  ellipsis: {
    patterns: [
      /\.{3,}/g,  // ellipsis
    ],
    tension_modifier: 0.3
  },
  short_sentences: {
    // Calculated separately
    tension_modifier: 0.2
  }
};

const SEMANTIC_INTENSITY_MODIFIERS = {
  very: 1.3,
  extremely: 1.5,
  incredibly: 1.4,
  absolutely: 1.3,
  completely: 1.2,
  totally: 1.2,
  really: 1.1,
  quite: 1.05,
  rather: 1.05,
  somewhat: 0.9,
  slightly: 0.8,
  barely: 0.7,
  hardly: 0.6
};

const calculateAdvancedTension = (text, emotions = []) => {
  if (!text || typeof text !== 'string') return 0;
  
  const lowerText = text.toLowerCase();
  let tensionScore = 0;
  const analysisDetails = {
    semantic: 0,
    rhetorical: 0,
    syntactic: 0,
    emotional: 0,
    contextual: 0
  };

  // 1. Semantic Network Analysis (WordNet-inspired)
  Object.entries(TENSION_SEMANTIC_NETWORK).forEach(([category, data]) => {
    let categoryScore = 0;
    
    data.verbs.forEach(verb => {
      const verbRegex = new RegExp(`\\b${verb}\\w*\\b`, 'gi');
      const matches = lowerText.match(verbRegex) || [];
      
      if (matches.length > 0) {
        let verbScore = matches.length * data.weight;
        
        // Check for intensity modifiers near the verb
        matches.forEach(match => {
          const verbIndex = lowerText.indexOf(match.toLowerCase());
          const contextWindow = lowerText.substring(
            Math.max(0, verbIndex - 50), 
            Math.min(lowerText.length, verbIndex + match.length + 50)
          );
          
          Object.entries(SEMANTIC_INTENSITY_MODIFIERS).forEach(([modifier, multiplier]) => {
            if (contextWindow.includes(modifier)) {
              verbScore *= multiplier;
            }
          });
        });
        
        categoryScore += verbScore;
      }
    });
    
    // Apply entailment relations (semantic connections)
    if (categoryScore > 0) {
      data.entailments.forEach(entailment => {
        const entailmentRegex = new RegExp(`\\b${entailment}\\w*\\b`, 'gi');
        const entailmentMatches = lowerText.match(entailmentRegex) || [];
        categoryScore += entailmentMatches.length * 0.1;
      });
    }
    
    analysisDetails.semantic += categoryScore;
  });

  // 2. Rhetorical Device Analysis
  Object.entries(RHETORICAL_DEVICES).forEach(([device, config]) => {
    if (device === 'short_sentences') {
      // Handle short sentences separately
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const shortSentences = sentences.filter(s => s.trim().split(/\s+/).length < 6);
      const shortSentenceRatio = sentences.length > 0 ? shortSentences.length / sentences.length : 0;
      
      if (shortSentenceRatio > 0.3) {
        const deviceScore = shortSentenceRatio * config.tension_modifier;
        analysisDetails.rhetorical += deviceScore;
      }
    } else {
      config.patterns.forEach(pattern => {
        const matches = text.match(pattern) || [];
        if (matches.length > 0) {
          const deviceScore = matches.length * config.tension_modifier;
          analysisDetails.rhetorical += deviceScore;
        }
      });
    }
  });

  // 3. Syntactic Analysis
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length > 0) {
    const words = text.split(/\s+/).filter(w => w.trim().length > 0);
    const avgSentenceLength = words.length / sentences.length;
    
    // Sentence length variance indicates tension
    const sentenceLengths = sentences.map(s => s.trim().split(/\s+/).length);
    const lengthVariance = calculateVariance(sentenceLengths);
    
    // High variance in sentence length can indicate tension
    if (lengthVariance > 20) {
      analysisDetails.syntactic += Math.min(0.3, lengthVariance / 100);
    }
    
    // Fragment sentences (very short) indicate tension
    const fragments = sentences.filter(s => s.trim().split(/\s+/).length < 4);
    if (fragments.length > 0) {
      analysisDetails.syntactic += (fragments.length / sentences.length) * 0.2;
    }
  }

  // 4. Emotional Intensity from Provided Emotions
  if (emotions && emotions.length > 0) {
    const highTensionEmotions = ['fear', 'anger', 'surprise', 'disgust'];
    const lowTensionEmotions = ['joy', 'relief'];
    
    emotions.forEach(emotion => {
      if (highTensionEmotions.includes(emotion.label)) {
        analysisDetails.emotional += emotion.prob * 0.4;
      } else if (lowTensionEmotions.includes(emotion.label)) {
        analysisDetails.emotional -= emotion.prob * 0.2;
      }
    });
  }

  // 5. Contextual Analysis
  // Dialogue intensity
  const dialogueMarkers = (text.match(/["']/g) || []).length;
  if (dialogueMarkers > 2) {
    // Check for interruptions, incomplete thoughts in dialogue
    const dialogueSegments = text.split(/["']/).filter((segment, index) => index % 2 === 1);
    dialogueSegments.forEach(segment => {
      if (segment.includes('--') || segment.includes('...') || segment.length < 10) {
        analysisDetails.contextual += 0.05;
      }
    });
  }

  // Pacing indicators
  const pacingWords = ['suddenly', 'immediately', 'quickly', 'slowly', 'gradually', 'meanwhile'];
  pacingWords.forEach(word => {
    const wordRegex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = lowerText.match(wordRegex) || [];
    if (matches.length > 0) {
      const modifier = ['suddenly', 'immediately', 'quickly'].includes(word) ? 0.1 : -0.05;
      analysisDetails.contextual += matches.length * modifier;
    }
  });

  // Combine all factors
  tensionScore = analysisDetails.semantic + analysisDetails.rhetorical + 
                analysisDetails.syntactic + analysisDetails.emotional + 
                analysisDetails.contextual;

  // Add baseline for any text with content
  if (text.trim().length > 20) {
    tensionScore += 0.05;
  }

  // Normalize based on text length
  const lengthFactor = Math.min(1, text.length / 300);
  tensionScore *= lengthFactor;

  console.log('Advanced tension analysis:', {
    total: tensionScore,
    details: analysisDetails,
    text: text.substring(0, 100) + '...'
  });

  return Math.max(0, Math.min(1, tensionScore));
};

const calculateVariance = (numbers) => {
  if (numbers.length === 0) return 0;
  const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
  return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
};

const analyzeLinguisticFeatures = (text) => {
  const features = {
    readability: calculateReadabilityMetrics(text),
    rhetoric: analyzeRhetoricalDevices(text),
    syntax: analyzeSyntacticComplexity(text),
    lexical: analyzeLexicalFeatures(text),
    discourse: analyzeDiscourseMarkers(text)
  };
  
  return features;
};

const calculateReadabilityMetrics = (text) => {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.trim().length > 0);
  const syllables = words.reduce((count, word) => count + countSyllables(word), 0);
  
  const avgSentenceLength = sentences.length > 0 ? words.length / sentences.length : 0;
  const avgSyllablesPerWord = words.length > 0 ? syllables / words.length : 0;
  
  // Flesch Reading Ease
  const fleschScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
  
  // Flesch-Kincaid Grade Level
  const gradeLevel = (0.39 * avgSentenceLength) + (11.8 * avgSyllablesPerWord) - 15.59;
  
  return {
    fleschScore: Math.max(0, Math.min(100, fleschScore)),
    gradeLevel: Math.max(0, gradeLevel),
    avgSentenceLength,
    avgSyllablesPerWord,
    complexWords: words.filter(word => countSyllables(word) > 2).length,
    complexWordRatio: words.length > 0 ? words.filter(word => countSyllables(word) > 2).length / words.length : 0
  };
};

const countSyllables = (word) => {
  if (!word) return 0;
  word = word.toLowerCase();
  if (word.length <= 3) return 1;
  
  const vowelGroups = word.match(/[aeiouy]+/g) || [];
  let syllables = vowelGroups.length;
  
  // Adjust for silent e
  if (word.endsWith('e') && syllables > 1) {
    syllables--;
  }
  
  return Math.max(1, syllables);
};

const analyzeRhetoricalDevices = (text) => {
  const devices = {};
  
  // Metaphors and similes
  devices.similes = (text.match(/\b(like|as)\s+\w+/gi) || []).length;
  devices.metaphors = (text.match(/\bis\s+(a|an)?\s*\w+/gi) || []).length;
  
  // Repetition patterns
  const words = text.toLowerCase().split(/\s+/);
  const wordFreq = {};
  words.forEach(word => {
    if (word.length > 3) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });
  devices.repeatedWords = Object.values(wordFreq).filter(freq => freq > 2).length;
  
  // Alliteration
  devices.alliteration = (text.match(/\b([bcdfghjklmnpqrstvwxyz])\w*\s+\1\w*/gi) || []).length;
  
  // Rhetorical questions
  devices.rhetoricalQuestions = (text.match(/\?/g) || []).length;
  
  // Parallelism (simple detection)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  let parallelism = 0;
  for (let i = 0; i < sentences.length - 1; i++) {
    const current = sentences[i].trim().split(/\s+/);
    const next = sentences[i + 1].trim().split(/\s+/);
    
    if (current.length > 2 && next.length > 2) {
      if (current[0].toLowerCase() === next[0].toLowerCase()) {
        parallelism++;
      }
    }
  }
  devices.parallelism = parallelism;
  
  return devices;
};

const analyzeSyntacticComplexity = (text) => {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.trim().length > 0);
  
  // Sentence types
  const declarative = (text.match(/\./g) || []).length;
  const interrogative = (text.match(/\?/g) || []).length;
  const exclamatory = (text.match(/!/g) || []).length;
  
  // Complex sentence indicators
  const subordinatingConjunctions = ['because', 'although', 'while', 'since', 'if', 'when', 'where', 'unless', 'until'];
  const coordinatingConjunctions = ['and', 'but', 'or', 'nor', 'for', 'yet', 'so'];
  
  let complexSentences = 0;
  let compoundSentences = 0;
  
  sentences.forEach(sentence => {
    const lowerSentence = sentence.toLowerCase();
    
    if (subordinatingConjunctions.some(conj => lowerSentence.includes(conj))) {
      complexSentences++;
    }
    
    if (coordinatingConjunctions.some(conj => lowerSentence.includes(` ${conj} `))) {
      compoundSentences++;
    }
  });
  
  return {
    avgSentenceLength: sentences.length > 0 ? words.length / sentences.length : 0,
    sentenceTypes: {
      declarative,
      interrogative,
      exclamatory,
      declarativeRatio: sentences.length > 0 ? declarative / sentences.length : 0,
      interrogativeRatio: sentences.length > 0 ? interrogative / sentences.length : 0,
      exclamatoryRatio: sentences.length > 0 ? exclamatory / sentences.length : 0
    },
    complexity: {
      complexSentences,
      compoundSentences,
      complexRatio: sentences.length > 0 ? complexSentences / sentences.length : 0,
      compoundRatio: sentences.length > 0 ? compoundSentences / sentences.length : 0
    }
  };
};

const analyzeLexicalFeatures = (text) => {
  const words = text.toLowerCase().split(/\s+/).filter(w => w.trim().length > 0);
  const uniqueWords = new Set(words);
  
  // Lexical diversity
  const typeTokenRatio = words.length > 0 ? uniqueWords.size / words.length : 0;
  
  // Word length analysis
  const avgWordLength = words.length > 0 ? 
    words.reduce((sum, word) => sum + word.length, 0) / words.length : 0;
  
  // Content vs function words (approximation)
  const functionWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'shall'];
  const contentWords = words.filter(word => !functionWords.includes(word));
  
  return {
    totalWords: words.length,
    uniqueWords: uniqueWords.size,
    typeTokenRatio,
    avgWordLength,
    contentWordRatio: words.length > 0 ? contentWords.length / words.length : 0,
    longWords: words.filter(word => word.length > 6).length,
    longWordRatio: words.length > 0 ? words.filter(word => word.length > 6).length / words.length : 0
  };
};

const analyzeDiscourseMarkers = (text) => {
  const markers = {
    temporal: ['first', 'then', 'next', 'finally', 'meanwhile', 'before', 'after', 'during', 'while'],
    causal: ['because', 'since', 'therefore', 'thus', 'consequently', 'as a result', 'due to'],
    contrastive: ['however', 'but', 'although', 'despite', 'nevertheless', 'on the other hand', 'in contrast'],
    additive: ['and', 'also', 'furthermore', 'moreover', 'in addition', 'besides']
  };
  
  const results = {};
  
  Object.entries(markers).forEach(([type, markerList]) => {
    let count = 0;
    markerList.forEach(marker => {
      const regex = new RegExp(`\\b${marker}\\b`, 'gi');
      const matches = text.match(regex) || [];
      count += matches.length;
    });
    results[type] = count;
  });
  
  return results;
};

  const calculateFallbackTension = (text) => {
    if (!text || typeof text !== 'string') return 0;
    
    // Enhanced fallback that combines multiple approaches
    const contentTension = calculateContentBasedTension(text);
    
    // Add some randomness based on text characteristics for variety
    const textHash = text.split('').reduce((hash, char) => {
      return ((hash << 5) - hash + char.charCodeAt(0)) & 0xffffffff;
    }, 0);
    
    const variabilityFactor = 0.1 + (Math.abs(textHash) % 100) / 1000; // 0.1 to 0.2
    
    return Math.min(1, contentTension + variabilityFactor);
  };

  const performAnalysis = async (text, title) => {
    const updateProgress = async (value, delay = 150) => {
      setProgress(value);
      await new Promise(resolve => setTimeout(resolve, delay));
    };

    setProgress(0);
    await updateProgress(5);
    
    const paragraphs = segmentIntoParagraphs(text);
    await updateProgress(12);
    
    const emotionResults = {
      paragraphs: []
    };
    
    const emotionProgressStep = 33 / Math.max(paragraphs.length, 1);
    
    // Process paragraphs for emotion analysis
    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i];
      try {
        const analysis = await analyzeEmotion(paragraph, analyzerConfig);
        
        emotionResults.paragraphs.push({
          text: paragraph,
          index: i,
          emotions: analysis.emotions || [{ label: 'neutral', prob: 1 }],
          dominant: analysis.predictedEmotion || 'neutral',
          probability: analysis.probability || 0,
          fullAnalysis: analysis,
          wordCount: countWords(paragraph),
          tension: calculateNarrativeTensionFromEmotions(analysis)
        });
      } catch (error) {
        console.error("Error analyzing paragraph:", error);
        emotionResults.paragraphs.push({
          text: paragraph,
          index: i,
          emotions: [{ label: 'neutral', prob: 1 }],
          dominant: 'neutral',
          probability: 1,
          fullAnalysis: { emotions: [{ label: 'neutral', prob: 1 }] },
          wordCount: countWords(paragraph),
          tension: 0
        });
      }
      
      const currentProgress = 12 + (i + 1) * emotionProgressStep;
      await updateProgress(currentProgress);
    }
    
    await updateProgress(45);
    
    // Calculate overall emotions
    const emotionTotals = {};
    EMOTION_LABELS.forEach(label => { emotionTotals[label] = 0 });
    
    emotionResults.paragraphs.forEach(paragraph => {
      paragraph.emotions.forEach(emotion => {
        emotionTotals[emotion.label] = (emotionTotals[emotion.label] || 0) + emotion.prob;
      });
    });
    
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
    
    await updateProgress(52);

    // Initialize narrative segmenter
    const segmenter = new NarrativeSegmenter({
      minSegmentLength: segmentationConfig.minSegmentLength,
      tensionSensitivity: segmentationConfig.tensionSensitivity,
      emotionSensitivity: segmentationConfig.emotionSensitivity
    });

    let narrativeSegments = [];
    
    console.log('Starting segmentation process:', {
      mode: segmentationConfig.mode,
      paragraphCount: emotionResults.paragraphs.length,
      targetSegments: segmentationConfig.targetSegments
    });
    
    if (segmentationConfig.mode === 'automatic') {
      console.log('Performing automatic segmentation with method:', segmentationConfig.method);
      
      // Ensure we have enough paragraphs for segmentation
      if (emotionResults.paragraphs.length < 2) {
        console.warn('Not enough paragraphs for automatic segmentation, falling back to single segment');
        narrativeSegments = [{
          index: 0,
          name: 'Complete Text',
          startParagraph: 0,
          endParagraph: emotionResults.paragraphs.length - 1,
          paragraphs: emotionResults.paragraphs,
          avgTension: emotionResults.paragraphs.reduce((sum, p) => sum + (p.tension || 0), 0) / emotionResults.paragraphs.length,
          dominantEmotions: segmenter.calculateDominantEmotions(emotionResults.paragraphs),
          wordCount: emotionResults.paragraphs.reduce((sum, p) => sum + (p.wordCount || 0), 0),
          position: 0,
          method: 'automatic'
        }];
      } else {
        // Adjust target segments based on paragraph count
        const adjustedTargetSegments = Math.min(
          segmentationConfig.targetSegments, 
          Math.max(2, Math.floor(emotionResults.paragraphs.length / 2))
        );
        
        console.log('Adjusted target segments:', adjustedTargetSegments);
        
        narrativeSegments = segmenter.segment(
          emotionResults.paragraphs, 
          segmentationConfig.method, 
          adjustedTargetSegments
        );
      }
      
      await updateProgress(60);
      
    } else if (segmentationConfig.mode === 'manual') {
      const structure = NARRATIVE_STRUCTURES[segmentationConfig.structure] || NARRATIVE_STRUCTURES.traditional;
      console.log('Using manual segmentation with structure:', structure.name);
      
      // Ensure we have enough paragraphs for the chosen structure
      const minParagraphsNeeded = structure.segments.length;
      
      if (paragraphs.length < minParagraphsNeeded) {
        console.warn(`Not enough paragraphs (${paragraphs.length}) for ${structure.name} structure (needs ${minParagraphsNeeded}), adjusting...`);
        
        // Create a simplified structure if we don't have enough paragraphs
        const simplifiedSegments = Math.min(structure.segments.length, paragraphs.length);
        narrativeSegments = structure.segments.slice(0, simplifiedSegments).map((template, index) => {
          const startIdx = Math.floor(index * paragraphs.length / simplifiedSegments);
          const endIdx = Math.floor((index + 1) * paragraphs.length / simplifiedSegments) - 1;
          const actualEndIdx = index === simplifiedSegments - 1 ? paragraphs.length - 1 : endIdx;
          
          const segmentParagraphs = emotionResults.paragraphs.slice(startIdx, actualEndIdx + 1);
          
          const avgTension = segmentParagraphs.reduce((sum, p) => sum + (p.tension || 0), 0) / segmentParagraphs.length;
          const dominantEmotions = segmenter.calculateDominantEmotions(segmentParagraphs);
          const wordCount = segmentParagraphs.reduce((sum, p) => sum + (p.wordCount || 0), 0);
          
          return {
            index,
            name: template.name,
            startParagraph: startIdx,
            endParagraph: actualEndIdx,
            paragraphs: segmentParagraphs,
            avgTension,
            dominantEmotions,
            wordCount,
            position: startIdx / Math.max(paragraphs.length - 1, 1),
            method: 'manual',
            description: template.name + ': ' + segmenter.generateSegmentDescription(avgTension, dominantEmotions, 'template'),
            expectedTensionRange: template.expectedTensionRange,
            structureWeight: template.weight
          };
        });
      } else {
        // Standard manual segmentation
        const segmentSize = Math.ceil(paragraphs.length / structure.segments.length);
        
        narrativeSegments = structure.segments.map((template, index) => {
          const startIdx = index * segmentSize;
          const endIdx = Math.min((index + 1) * segmentSize - 1, paragraphs.length - 1);
          
          // Ensure the last segment includes all remaining paragraphs
          const actualEndIdx = index === structure.segments.length - 1 ? paragraphs.length - 1 : endIdx;
          
          const segmentParagraphs = emotionResults.paragraphs.slice(startIdx, actualEndIdx + 1);
          
          const avgTension = segmentParagraphs.reduce((sum, p) => sum + (p.tension || 0), 0) / segmentParagraphs.length;
          const dominantEmotions = segmenter.calculateDominantEmotions(segmentParagraphs);
          const wordCount = segmentParagraphs.reduce((sum, p) => sum + (p.wordCount || 0), 0);
          
          return {
            index,
            name: template.name,
            startParagraph: startIdx,
            endParagraph: actualEndIdx,
            paragraphs: segmentParagraphs,
            avgTension,
            dominantEmotions,
            wordCount,
            position: template.position,
            method: 'manual',
            description: template.name + ': ' + segmenter.generateSegmentDescription(avgTension, dominantEmotions, 'template'),
            expectedTensionRange: template.expectedTensionRange,
            structureWeight: template.weight
          };
        });
      }
      
      await updateProgress(60);
    }

    // Ensure we always have at least one segment
    if (narrativeSegments.length === 0) {
      console.warn('No segments created, creating fallback segment');
      narrativeSegments = [{
        index: 0,
        name: 'Complete Text',
        startParagraph: 0,
        endParagraph: emotionResults.paragraphs.length - 1,
        paragraphs: emotionResults.paragraphs,
        avgTension: emotionResults.paragraphs.reduce((sum, p) => sum + (p.tension || 0), 0) / emotionResults.paragraphs.length,
        dominantEmotions: segmenter.calculateDominantEmotions(emotionResults.paragraphs),
        wordCount: emotionResults.paragraphs.reduce((sum, p) => sum + (p.wordCount || 0), 0),
        position: 0,
        method: 'fallback'
      }];
    }

    console.log('Generated segments:', narrativeSegments);
    
    // Create emotional arc
    emotionResults.emotionalArc = narrativeSegments.map((segment, index) => {
      const dominantEmotion = segment.dominantEmotions[0]?.label || 'neutral';
      const emotionValue = segment.dominantEmotions[0]?.prob || 0;
      
      return {
        index,
        emotion: dominantEmotion,
        value: emotionValue,
        position: segment.position,
        segmentName: segment.name
      };
    });
    
    await updateProgress(65);
    
    // Calculate tension data
    const tensionData = {
      tensionBySegment: narrativeSegments.map(segment => ({
        index: segment.index,
        name: segment.name,
        text: segment.paragraphs.map(p => p.text).join(' ').substring(0, 200) + '...',
        tension: segment.avgTension,
        dominant: segment.dominantEmotions[0]?.label || 'neutral',
        wordCount: segment.wordCount,
        paragraphCount: segment.paragraphs.length
      })),
      
      tensionByParagraph: emotionResults.paragraphs.map(paragraph => ({
        index: paragraph.index,
        text: paragraph.text.substring(0, 100) + (paragraph.text.length > 100 ? '...' : ''),
        tension: paragraph.tension,
        dominant: paragraph.dominant
      })),
      
      tensionPoints: [],
      tensionArc: []
    };
    
    tensionData.overallTension = narrativeSegments.reduce((sum, segment) => sum + segment.avgTension, 0) / 
      Math.max(narrativeSegments.length, 1);
    
    tensionData.tensionLevel = 
      tensionData.overallTension > 0.7 ? 'high' :
      tensionData.overallTension > 0.4 ? 'medium' : 'low';
    
    tensionData.tensionArc = narrativeSegments.map((segment, index) => ({
      index,
      value: segment.avgTension,
      position: segment.position,
      segmentName: segment.name
    }));
    
    await updateProgress(70);
    
    // Identify tension points
    for (let i = 1; i < narrativeSegments.length - 1; i++) {
      const prev = narrativeSegments[i-1].avgTension;
      const curr = narrativeSegments[i].avgTension;
      const next = narrativeSegments[i+1].avgTension;
      
      if (curr > prev && curr > next && curr > tensionData.overallTension) {
        tensionData.tensionPoints.push({
          index: i,
          type: 'peak',
          value: curr,
          text: narrativeSegments[i].description,
          segmentName: narrativeSegments[i].name
        });
      } else if (curr < prev && curr < next && curr < tensionData.overallTension) {
        tensionData.tensionPoints.push({
          index: i,
          type: 'drop',
          value: curr,
          text: narrativeSegments[i].description,
          segmentName: narrativeSegments[i].name
        });
      }
    }
    
    tensionData.segments = narrativeSegments;
    tensionData.segmentationMethod = segmentationConfig.mode;
    tensionData.segmentationConfig = segmentationConfig;
    
    console.log('Enhanced Tension Data with Segments:', {
      overallTension: tensionData.overallTension,
      tensionLevel: tensionData.tensionLevel,
      segments: narrativeSegments.length,
      segmentationMethod: segmentationConfig.mode
    });
    
    await updateProgress(75);
    
    // Calculate pace data
    const paceData = {
      paceSegments: [],
      paceByNarrativeSegments: [],
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

    paceData.paceByNarrativeSegments = narrativeSegments.map((segment, index) => {
      const avgSentenceLength = segment.paragraphs.reduce((sum, p) => {
        const sentences = p.text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const avgLen = sentences.reduce((s, sent) => s + sent.trim().split(/\s+/).length, 0) / Math.max(sentences.length, 1);
        return sum + avgLen;
      }, 0) / segment.paragraphs.length;
      
      const paceScore = Math.max(0.1, Math.min(0.9, 1 - (avgSentenceLength - 8) / 20));
      const paceIndex = Math.floor(paceScore * 5);
      const pace = paceTypes[Math.min(4, paceIndex)];
      
      return {
        index,
        name: segment.name,
        pace,
        paceScore,
        avgSentenceLength,
        wordCount: segment.wordCount
      };
    });
    
    await updateProgress(80);
    
    // Calculate story structure
    const storyStructure = {
      structure: segmentationConfig.mode === 'manual' ? 'template-based' : 'data-driven',
      method: segmentationConfig.mode,
      template: segmentationConfig.mode === 'manual' ? segmentationConfig.structure : null,
      segments: narrativeSegments.map(segment => ({
        name: segment.name,
        startIndex: segment.startParagraph,
        endIndex: segment.endParagraph,
        percentage: (segment.wordCount / emotionResults.paragraphs.reduce((sum, p) => sum + p.wordCount, 0)) * 100,
        description: segment.description,
        dominantEmotion: segment.dominantEmotions[0]?.label || 'neutral',
        avgTension: segment.avgTension,
        position: segment.position
      }))
    };
    
    await updateProgress(85);
    
    // Calculate character danger analysis
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
              tension: emotionResults.paragraphs[index]?.tension || 0
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
    
    await updateProgress(90);
    
    // Calculate linguistic data with enhanced features
    const linguisticData = {
      totalWords: countWords(text),
      totalSentences: text.split(/[.!?]+/).filter(s => s.trim().length > 0).length,
      paragraphCount: paragraphs.length,
      segmentCount: narrativeSegments.length,
      avgSentenceLength: 0,
      readabilityScore: 0,
      readabilityLevel: 'standard',
      
      // Enhanced linguistic analysis
      linguisticFeatures: analyzeLinguisticFeatures(text),
      
      // Traditional ratios
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
        formal: 0.3,
        
        // Enhanced style metrics
        rhetoricallyRich: 0,
        syntacticallyComplex: 0,
        lexicallyDiverse: 0
      },
      
      styleSuggestions: []
    };
    
    // Calculate enhanced metrics
    linguisticData.avgSentenceLength = linguisticData.totalWords / Math.max(linguisticData.totalSentences, 1);
    
    // Use the enhanced readability calculation
    if (linguisticData.linguisticFeatures.readability) {
      linguisticData.readabilityScore = linguisticData.linguisticFeatures.readability.fleschScore;
      
      if (linguisticData.readabilityScore > 90) linguisticData.readabilityLevel = 'very_easy';
      else if (linguisticData.readabilityScore > 80) linguisticData.readabilityLevel = 'easy';
      else if (linguisticData.readabilityScore > 70) linguisticData.readabilityLevel = 'fairly_easy';
      else if (linguisticData.readabilityScore > 60) linguisticData.readabilityLevel = 'standard';
      else if (linguisticData.readabilityScore > 50) linguisticData.readabilityLevel = 'fairly_difficult';
      else if (linguisticData.readabilityScore > 30) linguisticData.readabilityLevel = 'difficult';
      else linguisticData.readabilityLevel = 'very_difficult';
    } else {
      // Fallback calculation
      linguisticData.readabilityScore = 206.835 - (1.015 * linguisticData.avgSentenceLength) - (84.6 * (linguisticData.totalWords * 1.5 / linguisticData.totalWords));
    }
    
    // Enhanced style profile calculations
    if (linguisticData.linguisticFeatures.rhetoric) {
      const rhetoric = linguisticData.linguisticFeatures.rhetoric;
      linguisticData.styleProfile.rhetoricallyRich = Math.min(1, 
        (rhetoric.similes + rhetoric.metaphors + rhetoric.alliteration + rhetoric.parallelism) / 10
      );
    }
    
    if (linguisticData.linguisticFeatures.syntax) {
      const syntax = linguisticData.linguisticFeatures.syntax;
      linguisticData.styleProfile.syntacticallyComplex = Math.min(1,
        (syntax.complexity?.complexRatio || 0) + (syntax.complexity?.compoundRatio || 0)
      );
    }
    
    if (linguisticData.linguisticFeatures.lexical) {
      const lexical = linguisticData.linguisticFeatures.lexical;
      linguisticData.styleProfile.lexicallyDiverse = lexical.typeTokenRatio || 0;
    }
    
    // Generate enhanced style suggestions
    linguisticData.styleSuggestions = [];
    
    // Readability suggestions
    if (linguisticData.readabilityScore < 50) {
      linguisticData.styleSuggestions.push({
        title: "Improve Readability",
        description: "Consider using shorter sentences and simpler vocabulary to improve readability. Current score indicates difficult reading level."
      });
    }
    
    // Rhetorical device suggestions
    if (linguisticData.styleProfile.rhetoricallyRich < 0.2) {
      linguisticData.styleSuggestions.push({
        title: "Enhance Rhetorical Impact",
        description: "Consider adding more metaphors, similes, or other rhetorical devices to strengthen the narrative's impact."
      });
    }
    
    // Sentence variety suggestions
    if (linguisticData.linguisticFeatures.syntax?.sentenceTypes) {
      const sentenceTypes = linguisticData.linguisticFeatures.syntax.sentenceTypes;
      if (sentenceTypes.interrogativeRatio < 0.05 && sentenceTypes.exclamatoryRatio < 0.05) {
        linguisticData.styleSuggestions.push({
          title: "Add Sentence Variety",
          description: "Consider incorporating more questions and exclamations to create variety and emotional impact."
        });
      }
    }
    
    // Lexical diversity suggestions
    if (linguisticData.styleProfile.lexicallyDiverse < 0.6) {
      linguisticData.styleSuggestions.push({
        title: "Increase Vocabulary Diversity",
        description: "Consider using a more varied vocabulary to avoid repetition and enhance reader engagement."
      });
    }
    
    // Tension-specific suggestions
    const avgTension = narrativeSegments.reduce((sum, segment) => sum + segment.avgTension, 0) / Math.max(narrativeSegments.length, 1);
    
    if (avgTension < 0.3) {
      linguisticData.styleSuggestions.push({
        title: "Enhance Narrative Tension",
        description: "Consider using more tension-building techniques such as shorter sentences, action verbs, and conflict-related vocabulary."
      });
    }
    
    linguisticData.styleSuggestions.push({
      title: "Segment-Based Analysis",
      description: `The narrative has been divided into ${narrativeSegments.length} ${segmentationConfig.mode} segments, revealing ${tensionData.tensionLevel} overall tension with varying emotional dynamics.`
    });
    
    // Advanced linguistic insights
    if (linguisticData.linguisticFeatures.discourse) {
      const discourse = linguisticData.linguisticFeatures.discourse;
      const totalMarkers = Object.values(discourse).reduce((sum, count) => sum + count, 0);
      
      if (totalMarkers < paragraphs.length * 0.1) {
        linguisticData.styleSuggestions.push({
          title: "Improve Text Cohesion",
          description: "Consider adding more discourse markers (transitions) to improve the flow and connectivity between ideas."
        });
      }
    }
    
    await updateProgress(95);
    
    // Compile final results
    const results = {
      title: title.trim() || `Analysis - ${new Date().toLocaleDateString()}`,
      text,
      paragraphCount: paragraphs.length,
      segmentCount: narrativeSegments.length,
      totalWordCount: linguisticData.totalWords,
      emotion: emotionResults,
      tension: tensionData,
      pace: paceData,
      storyStructure,
      characterDanger,
      linguistic: linguisticData,
      segments: narrativeSegments,
      segmentationConfig,
      timestamp: new Date().toISOString(),
      analyzerConfig
    };
    
    await updateProgress(100);
    
    return results;
  };

  const startAnalysis = async () => {
    if (!text.trim()) {
      setError('Please enter some text to analyze');
      return;
    }
    
    try {
      setIsAnalyzing(true);
      setError(null);
      setProgress(0);
      
      const results = await performAnalysis(text, title || `Analysis ${new Date().toLocaleDateString()}`);
      
      setAnalysisResults(results);
      
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
  
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);
  
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
            {progress < 20 && "Analyzing text structure..."}
            {progress >= 20 && progress < 50 && "Processing emotional patterns..."}
            {progress >= 50 && progress < 70 && "Performing narrative segmentation..."}
            {progress >= 70 && progress < 90 && "Analyzing narrative dynamics..."}
            {progress >= 90 && "Finalizing analysis..."}
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
          
          <div className="segmentation-settings">
            <h2>Narrative Segmentation Settings</h2>
            
            <div className="setting-group">
              <label htmlFor="segmentation-mode">Segmentation Mode:</label>
              <select
                id="segmentation-mode"
                value={segmentationConfig.mode}
                onChange={(e) => handleSegmentationConfigChange('mode', e.target.value)}
              >
                <option value="automatic">Automatic (Data-Driven)</option>
                <option value="manual">Manual (Template-Based)</option>
              </select>
            </div>

            {segmentationConfig.mode === 'automatic' && (
              <>
                <div className="setting-group">
                  <label htmlFor="segmentation-method">Analysis Method:</label>
                  <select
                    id="segmentation-method"
                    value={segmentationConfig.method}
                    onChange={(e) => handleSegmentationConfigChange('method', e.target.value)}
                  >
                    <option value="combined">Combined (Tension + Emotion + Pace)</option>
                    <option value="tension">Tension-Based</option>
                    <option value="emotion">Emotion-Based</option>
                  </select>
                </div>

                <div className="slider-container">
                  <label htmlFor="target-segments">Target Number of Segments:</label>
                  <div className="slider-with-value">
                    <input
                      id="target-segments"
                      type="range"
                      min="3"
                      max="10"
                      step="1"
                      value={segmentationConfig.targetSegments}
                      onChange={(e) => handleSegmentationConfigChange('targetSegments', parseInt(e.target.value))}
                    />
                    <span className="slider-value">{segmentationConfig.targetSegments}</span>
                  </div>
                </div>

                <div className="slider-container">
                  <label htmlFor="tension-sensitivity">Tension Change Sensitivity:</label>
                  <div className="slider-with-value">
                    <input
                      id="tension-sensitivity"
                      type="range"
                      min="0.1"
                      max="0.8"
                      step="0.05"
                      value={segmentationConfig.tensionSensitivity}
                      onChange={(e) => handleSegmentationConfigChange('tensionSensitivity', parseFloat(e.target.value))}
                    />
                    <span className="slider-value">{formatValue(segmentationConfig.tensionSensitivity)}</span>
                  </div>
                </div>

                <div className="slider-container">
                  <label htmlFor="emotion-sensitivity">Emotion Change Sensitivity:</label>
                  <div className="slider-with-value">
                    <input
                      id="emotion-sensitivity"
                      type="range"
                      min="0.1"
                      max="0.8"
                      step="0.05"
                      value={segmentationConfig.emotionSensitivity}
                      onChange={(e) => handleSegmentationConfigChange('emotionSensitivity', parseFloat(e.target.value))}
                    />
                    <span className="slider-value">{formatValue(segmentationConfig.emotionSensitivity)}</span>
                  </div>
                </div>
              </>
            )}

            {segmentationConfig.mode === 'manual' && (
              <div className="setting-group">
                <label htmlFor="narrative-structure">Narrative Structure Template:</label>
                <select
                  id="narrative-structure"
                  value={segmentationConfig.structure}
                  onChange={(e) => handleSegmentationConfigChange('structure', e.target.value)}
                >
                  {Object.entries(NARRATIVE_STRUCTURES).map(([key, structure]) => (
                    <option key={key} value={key}>{structure.name}</option>
                  ))}
                </select>
                <div className="structure-preview">
                  <small>
                    {NARRATIVE_STRUCTURES[segmentationConfig.structure]?.segments.map(s => s.name).join(' → ')}
                  </small>
                </div>
              </div>
            )}
          </div>
          
          <div className="model-settings">
            <h2>Emotion Analysis Settings</h2>
            
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
      
      {analysisResults && !isAnalyzing && (
        <div className="analysis-results">
          <h2>Analysis Results</h2>
          
          <div className="result-section">
            <h3>Narrative Tension Analysis</h3>
            <NarrativeTensionDisplay 
              data={analysisResults.tension} 
              segments={analysisResults.segments}
            />
          </div>
          
          <div className="result-section">
            <h3>Narrative Segmentation Summary</h3>
            <div className="segmentation-summary">
              <div className="summary-stats">
                <div className="stat-item">
                  <span className="stat-label">Method:</span>
                  <span className="stat-value">
                    {analysisResults.segmentationConfig.mode === 'automatic' 
                      ? `Automatic (${analysisResults.segmentationConfig.method})`
                      : `Manual (${NARRATIVE_STRUCTURES[analysisResults.segmentationConfig.structure]?.name})`
                    }
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Segments:</span>
                  <span className="stat-value">{analysisResults.segmentCount}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Paragraphs:</span>
                  <span className="stat-value">{analysisResults.paragraphCount}</span>
                </div>
              </div>

              <div className="segments-detailed-view">
                {analysisResults.segments.map((segment, index) => (
                  <div key={index} className="segment-detail-card">
                    <div className="segment-header">
                      <h4>{segment.name}</h4>
                      <div className="segment-metrics">
                        <span className="metric">
                          <strong>Tension:</strong> {(segment.avgTension * 100).toFixed(1)}%
                        </span>
                        <span className="metric">
                          <strong>Words:</strong> {segment.wordCount}
                        </span>
                        <span className="metric">
                          <strong>Paras:</strong> {segment.paragraphs.length}
                        </span>
                      </div>
                    </div>
                    
                    <div className="segment-emotions">
                      <strong>Primary Emotions:</strong>
                      {segment.dominantEmotions.slice(0, 3).map((emotion, idx) => (
                        <span key={idx} className={`emotion-tag emotion-${emotion.label}`}>
                          {emotion.label} ({(emotion.prob * 100).toFixed(1)}%)
                        </span>
                      ))}
                    </div>
                    
                    <div className="segment-description">
                      {segment.description}
                    </div>

                    {analysisResults.segmentationConfig.mode === 'manual' && segment.expectedTensionRange && (
                      <div className="expected-vs-actual">
                        <strong>Expected Tension Range:</strong> 
                        {(segment.expectedTensionRange[0] * 100).toFixed(0)}% - {(segment.expectedTensionRange[1] * 100).toFixed(0)}%
                        <br />
                        <strong>Actual Tension:</strong> {(segment.avgTension * 100).toFixed(1)}%
                        {segment.avgTension < segment.expectedTensionRange[0] && 
                          <span className="tension-note low"> (Lower than expected)</span>
                        }
                        {segment.avgTension > segment.expectedTensionRange[1] && 
                          <span className="tension-note high"> (Higher than expected)</span>
                        }
                        {segment.avgTension >= segment.expectedTensionRange[0] && segment.avgTension <= segment.expectedTensionRange[1] && 
                          <span className="tension-note normal"> (Within expected range)</span>
                        }
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="result-section">
            <h3>Analysis Summary</h3>
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
                <h4>Structure</h4>
                <p>{analysisResults.segmentCount} segments</p>
                <small>{analysisResults.segmentationConfig.mode} segmentation</small>
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
              <div className="summary-card">
                <h4>Highest Tension</h4>
                <p>
                  {analysisResults.segments.reduce((max, segment) => 
                    segment.avgTension > max.avgTension ? segment : max
                  ).name}
                </p>
                <small>
                  {(analysisResults.segments.reduce((max, segment) => 
                    segment.avgTension > max.avgTension ? segment : max
                  ).avgTension * 100).toFixed(1)}% tension
                </small>
              </div>
            </div>
          </div>

          {analysisResults.segmentationConfig.mode === 'manual' && (
            <div className="result-section">
              <h3>Template Comparison Analysis</h3>
              <div className="template-comparison">
                <p>
                  <strong>Template Used:</strong> {NARRATIVE_STRUCTURES[analysisResults.segmentationConfig.structure]?.name}
                </p>
                
                <div className="comparison-chart">
                  <h4>Expected vs. Actual Tension by Segment</h4>
                  <div className="comparison-bars">
                    {analysisResults.segments.map((segment, index) => (
                      <div key={index} className="comparison-bar-container">
                        <div className="segment-name">{segment.name}</div>
                        <div className="bar-pair">
                          <div className="expected-bar">
                            <div className="bar-label">Expected</div>
                            <div className="bar-visual">
                              <div 
                                className="bar-fill expected"
                                style={{ 
                                  width: `${((segment.expectedTensionRange[0] + segment.expectedTensionRange[1]) / 2) * 100}%` 
                                }}
                              ></div>
                            </div>
                            <div className="bar-value">
                              {(((segment.expectedTensionRange[0] + segment.expectedTensionRange[1]) / 2) * 100).toFixed(0)}%
                            </div>
                          </div>
                          <div className="actual-bar">
                            <div className="bar-label">Actual</div>
                            <div className="bar-visual">
                              <div 
                                className="bar-fill actual"
                                style={{ width: `${segment.avgTension * 100}%` }}
                              ></div>
                            </div>
                            <div className="bar-value">
                              {(segment.avgTension * 100).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="template-insights">
                  <h4>Template Adherence Insights</h4>
                  <ul>
                    {analysisResults.segments.map((segment, index) => {
                      const midExpected = (segment.expectedTensionRange[0] + segment.expectedTensionRange[1]) / 2;
                      const difference = segment.avgTension - midExpected;
                      const adherence = Math.abs(difference) < 0.2 ? 'good' : Math.abs(difference) < 0.4 ? 'fair' : 'poor';
                      
                      return (
                        <li key={index} className={`insight ${adherence}`}>
                          <strong>{segment.name}</strong>: 
                          {adherence === 'good' && ' Follows expected tension pattern well'}
                          {adherence === 'fair' && (difference > 0 ? ' Higher tension than typical' : ' Lower tension than typical')}
                          {adherence === 'poor' && (difference > 0 ? ' Significantly higher tension than expected' : ' Significantly lower tension than expected')}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
          )}



          <div className="result-section">
            <h3>Advanced Linguistic Analysis</h3>
            <div className="linguistic-summary">
              <div className="linguistic-stats">
                <div className="stat-group">
                  <h4>Text Statistics</h4>
                  <div className="stat-item">
                    <span className="stat-label">Total Words:</span>
                    <span className="stat-value">{analysisResults.linguistic.totalWords}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Total Sentences:</span>
                    <span className="stat-value">{analysisResults.linguistic.totalSentences}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Average Sentence Length:</span>
                    <span className="stat-value">{analysisResults.linguistic.avgSentenceLength.toFixed(1)} words</span>
                  </div>
                </div>
                
                <div className="stat-group">
                  <h4>Readability Analysis</h4>
                  <div className="stat-item">
                    <span className="stat-label">Readability Level:</span>
                    <span className="stat-value">{analysisResults.linguistic.readabilityLevel.replace('_', ' ')}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Flesch Score:</span>
                    <span className="stat-value">{analysisResults.linguistic.readabilityScore.toFixed(1)}</span>
                  </div>
                  {analysisResults.linguistic.linguisticFeatures?.readability && (
                    <>
                      <div className="stat-item">
                        <span className="stat-label">Grade Level:</span>
                        <span className="stat-value">{analysisResults.linguistic.linguisticFeatures.readability.gradeLevel.toFixed(1)}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Complex Words:</span>
                        <span className="stat-value">{analysisResults.linguistic.linguisticFeatures.readability.complexWords} ({(analysisResults.linguistic.linguisticFeatures.readability.complexWordRatio * 100).toFixed(1)}%)</span>
                      </div>
                    </>
                  )}
                </div>
                
                {analysisResults.linguistic.linguisticFeatures?.rhetoric && (
                  <div className="stat-group">
                    <h4>Rhetorical Devices</h4>
                    <div className="stat-item">
                      <span className="stat-label">Similes:</span>
                      <span className="stat-value">{analysisResults.linguistic.linguisticFeatures.rhetoric.similes}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Metaphors:</span>
                      <span className="stat-value">{analysisResults.linguistic.linguisticFeatures.rhetoric.metaphors}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Alliteration:</span>
                      <span className="stat-value">{analysisResults.linguistic.linguisticFeatures.rhetoric.alliteration}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Rhetorical Questions:</span>
                      <span className="stat-value">{analysisResults.linguistic.linguisticFeatures.rhetoric.rhetoricalQuestions}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Parallelism:</span>
                      <span className="stat-value">{analysisResults.linguistic.linguisticFeatures.rhetoric.parallelism}</span>
                    </div>
                  </div>
                )}
                
                {analysisResults.linguistic.linguisticFeatures?.syntax && (
                  <div className="stat-group">
                    <h4>Syntactic Complexity</h4>
                    <div className="stat-item">
                      <span className="stat-label">Complex Sentences:</span>
                      <span className="stat-value">{analysisResults.linguistic.linguisticFeatures.syntax.complexity.complexSentences} ({(analysisResults.linguistic.linguisticFeatures.syntax.complexity.complexRatio * 100).toFixed(1)}%)</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Compound Sentences:</span>
                      <span className="stat-value">{analysisResults.linguistic.linguisticFeatures.syntax.complexity.compoundSentences} ({(analysisResults.linguistic.linguisticFeatures.syntax.complexity.compoundRatio * 100).toFixed(1)}%)</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Questions:</span>
                      <span className="stat-value">{analysisResults.linguistic.linguisticFeatures.syntax.sentenceTypes.interrogative} ({(analysisResults.linguistic.linguisticFeatures.syntax.sentenceTypes.interrogativeRatio * 100).toFixed(1)}%)</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Exclamations:</span>
                      <span className="stat-value">{analysisResults.linguistic.linguisticFeatures.syntax.sentenceTypes.exclamatory} ({(analysisResults.linguistic.linguisticFeatures.syntax.sentenceTypes.exclamatoryRatio * 100).toFixed(1)}%)</span>
                    </div>
                  </div>
                )}
                
                {analysisResults.linguistic.linguisticFeatures?.lexical && (
                  <div className="stat-group">
                    <h4>Lexical Features</h4>
                    <div className="stat-item">
                      <span className="stat-label">Vocabulary Diversity:</span>
                      <span className="stat-value">{(analysisResults.linguistic.linguisticFeatures.lexical.typeTokenRatio * 100).toFixed(1)}%</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Average Word Length:</span>
                      <span className="stat-value">{analysisResults.linguistic.linguisticFeatures.lexical.avgWordLength.toFixed(1)} chars</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Content Word Ratio:</span>
                      <span className="stat-value">{(analysisResults.linguistic.linguisticFeatures.lexical.contentWordRatio * 100).toFixed(1)}%</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Long Words (6+ chars):</span>
                      <span className="stat-value">{analysisResults.linguistic.linguisticFeatures.lexical.longWords} ({(analysisResults.linguistic.linguisticFeatures.lexical.longWordRatio * 100).toFixed(1)}%)</span>
                    </div>
                  </div>
                )}
                
                <div className="stat-group">
                  <h4>Enhanced Style Profile</h4>
                  {Object.entries(analysisResults.linguistic.styleProfile).map(([style, score]) => (
                    <div key={style} className="stat-item">
                      <span className="stat-label">{style.replace('_', ' ')}:</span>
                      <span className="stat-value">{(score * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {analysisResults.linguistic.linguisticFeatures?.discourse && (
                <div className="discourse-analysis">
                  <h4>Discourse Markers</h4>
                  <div className="discourse-stats">
                    {Object.entries(analysisResults.linguistic.linguisticFeatures.discourse).map(([type, count]) => (
                      <div key={type} className="discourse-item">
                        <span className="discourse-label">{type.charAt(0).toUpperCase() + type.slice(1)}:</span>
                        <span className="discourse-value">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="style-suggestions">
                <h4>Style Recommendations</h4>
                {analysisResults.linguistic.styleSuggestions.map((suggestion, index) => (
                  <div key={index} className="suggestion-card">
                    <h5>{suggestion.title}</h5>
                    <p>{suggestion.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedTextInput;
