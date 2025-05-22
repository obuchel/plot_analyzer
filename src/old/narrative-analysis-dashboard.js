import React, { useState, useEffect, useCallback } from 'react';
import { 
  EmotionAnalyzer, 
  NarrativeTensionVisualizer, 
  StorySegmenter, 
  CharacterDangerProximityAnalyzer, 
  LinguisticFeatureAnalyzer 
} from './emotion-analysis-components';
import '../styles/emotion-analysis-styles.css';

// Example narrative texts for testing
const EXAMPLE_TEXTS = {
  fear: `The forest grew darker with each step. John's heart pounded as branches reached out like skeletal hands in the dim light. A twig snapped somewhere behind him. He froze, straining to hear over his own ragged breathing. Another sound—closer now. Whatever had been following him for the last mile was closing in. He should never have come here alone.`,
  
  tension: `Sarah stared at the ticking bomb. Two minutes left. Her hands trembled as she examined the wires. Red? Blue? Yellow? One wrong move and everything would end. Sweat dripped onto the circuit board. A car door slammed outside—the others were returning. She had to decide. Now.`,
  
  action: `Glass shattered as Tom dove through the window. He rolled across concrete, bullets peppering the ground behind him. Running now, zigzagging between cars. The helicopter spotlight tracked him, sirens wailing closer. He sprinted toward the river. His only chance. Jump or surrender? Three seconds to decide.`,
  
  joy: `Emma couldn't stop smiling as she held the letter. After years of hard work and rejection, she'd finally been accepted. The sunlight seemed brighter through her apartment window, the air sweeter. She danced across the kitchen, laughing, and called her mother with the wonderful news. Everything was about to change.`,
  
  climax: `The villain's sword clashed against the hero's shield, sending sparks flying. "You can't win!" he snarled. Blood trickled down the hero's face as they circled each other on the narrow bridge. Below, lava bubbled and churned. One final battle. One last chance to save everything. The hero lunged forward with a mighty cry.`,
  
  resolution: `The storm had passed. Villagers emerged from their homes to survey the damage. Though trees had fallen and some roofs were damaged, everyone had survived. Children began clearing debris while elders prepared a community meal. Together, they would rebuild. The air felt clean, renewed—like a fresh chapter beginning.`
};

/**
 * Enhanced Narrative Analysis Dashboard
 * Integrates all emotion analysis components
 */
const NarrativeAnalysisDashboard = ({ 
  text = '', 
  title = '',
  onAnalysisComplete = null,
  initialSegments = null
}) => {
  // State for text and analysis results
  const [storyText, setStoryText] = useState(text);
  const [storyTitle, setStoryTitle] = useState(title);
  const [segments, setSegments] = useState(initialSegments || []);
  const [emotionProfiles, setEmotionProfiles] = useState([]);
  const [tensionScores, setTensionScores] = useState([]);
  const [narrativeStages, setNarrativeStages] = useState([]);
  const [customTerms, setCustomTerms] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('emotions');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Analyze the full story when text changes
  useEffect(() => {
    if (storyText && storyText.trim()) {
      handleFullAnalysis();
    }
  }, [storyText]);
  
  // Handle text input change
  const handleTextChange = (e) => {
    setStoryText(e.target.value);
  };
  
  // Handle title input change
  const handleTitleChange = (e) => {
    setStoryTitle(e.target.value);
  };
  
  // Handle custom terms input change
  const handleCustomTermsChange = (e) => {
    setCustomTerms(e.target.value);
  };
  
  // Full analysis function
  const handleFullAnalysis = useCallback(async () => {
    if (!storyText || !storyText.trim()) {
      setErrorMessage("Please enter some text to analyze");
      return;
    }
    
    setIsAnalyzing(true);
    setErrorMessage("");
    
    try {
      // If we don't have segments yet, perform auto-segmentation
      if (!segments || segments.length === 0) {
        handleSegmentation();
      } else {
        // Analyze emotions for each segment
        const profiles = [];
        const tensions = [];
        const stages = [];
        
        for (let i = 0; i < segments.length; i++) {
          // This is where we'll use our emotion analyzer
          const segment = segments[i];
          const emotionResult = await analyzeSegmentEmotions(segment);
          
          profiles.push(emotionResult.emotions);
          tensions.push(emotionResult.tension);
          
          // Detect narrative stage
          const stage = detectNarrativeStage(i, segments.length, emotionResult.tension);
          stages.push(stage);
        }
        
        setEmotionProfiles(profiles);
        setTensionScores(tensions);
        setNarrativeStages(stages);
        
        // Notify parent of analysis results
        if (onAnalysisComplete) {
          onAnalysisComplete({
            segments,
            emotionProfiles: profiles,
            tensionScores: tensions,
            narrativeStages: stages
          });
        }
      }
    } catch (error) {
      console.error("Error in full analysis:", error);
      setErrorMessage("Analysis error: " + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  }, [storyText, segments, customTerms]);
  
  // Handle segmentation
  const handleSegmentation = useCallback(async () => {
    if (!storyText || !storyText.trim()) {
      setErrorMessage("Please enter some text to analyze");
      return;
    }
    
    setIsAnalyzing(true);
    
    try {
      // Perform auto-segmentation
      // We'll use the StorySegmenter component, but need to extract its functionality
      // This is a simplified version of the segmentation logic
      const segmentedText = segmentByEmotion(storyText, 6); // Default to 6 segments
      
      setSegments(segmentedText);
      
      // Now analyze each segment
      const profiles = [];
      const tensions = [];
      const stages = [];
      
      for (let i = 0; i < segmentedText.length; i++) {
        const segment = segmentedText[i];
        const emotionResult = await analyzeSegmentEmotions(segment);
        
        profiles.push(emotionResult.emotions);
        tensions.push(emotionResult.tension);
        
        // Detect narrative stage
        const stage = detectNarrativeStage(i, segmentedText.length, emotionResult.tension);
        stages.push(stage);
      }
      
      setEmotionProfiles(profiles);
      setTensionScores(tensions);
      setNarrativeStages(stages);
    } catch (error) {
      console.error("Error in segmentation:", error);
      setErrorMessage("Segmentation error: " + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  }, [storyText, customTerms]);
  
  // Analyze a single segment's emotions
  const analyzeSegmentEmotions = async (segmentText) => {
    // Create an instance of the emotion analyzer
    // This is a simplified version that would normally use our useEnhancedEmotionAnalysis hook
    
    // Basic emotion detection function (from enhanced-emotion-analyzer.js)
    const analyzeEmotions = (text) => {
      // Similar to the code in useEnhancedEmotionAnalysis
      const emotions = {
        fear: 0,
        anger: 0,
        joy: 0, 
        sadness: 0,
        surprise: 0,
        disgust: 0,
        tension: 0,
        danger: 0,
        relief: 0
      };
      
      // Simple keyword-based analysis (this would be much more sophisticated in real implementation)
      const emotionIndicators = {
        "fear": ["fear", "scared", "afraid", "terrified", "worried", "panic", "dread", "frightened"],
        "anger": ["anger", "angry", "mad", "furious", "outraged", "rage", "hate", "irate"],
        "joy": ["joy", "happy", "excited", "thrilled", "delighted", "wonderful", "celebrate", "pleased"],
        "sadness": ["sad", "unhappy", "depressed", "sorrow", "grief", "miserable", "cry", "melancholy"],
        "surprise": ["surprise", "shocked", "astonished", "amazed", "startled", "unexpected", "stunned"],
        "tension": ["tense", "stress", "pressure", "urgent", "anxious", "nervous", "on edge", "agitated"],
        "danger": ["danger", "threat", "risk", "peril", "hazard", "deadly", "fatal", "unsafe"],
        "relief": ["relief", "relax", "calm", "peaceful", "ease", "comfort", "safe", "soothed"],
        "disgust": ["disgust", "repulsed", "revolted", "disgusted", "gross", "sickening", "nauseated"]
      };
      
      const lowerText = text.toLowerCase();
      
      // Count emotion keywords
      Object.keys(emotionIndicators).forEach(emotion => {
        let score = 0;
        emotionIndicators[emotion].forEach(term => {
          const regex = new RegExp(`\\b${term}\\b`, 'gi');
          const matches = lowerText.match(regex);
          if (matches) score += matches.length;
        });
        
        // Normalize score to 0-10
        emotions[emotion] = Math.min(10, score * 2);
      });
      
      // Calculate structural tension indicators
      const exclamationCount = (lowerText.match(/!/g) || []).length;
      const questionCount = (lowerText.match(/\?/g) || []).length;
      const ellipsisCount = (lowerText.match(/\.{3,}|…/g) || []).length;
      
      // Add structural tension
      emotions.tension += exclamationCount * 0.5;
      emotions.tension += questionCount * 0.3;
      emotions.tension += ellipsisCount * 0.2;
      
      // Normalize tension
      emotions.tension = Math.min(10, emotions.tension);
      
      // Ensure some emotion is detected
      if (Object.values(emotions).reduce((sum, val) => sum + val, 0) < 2) {
        // Default to mild tension if no emotions detected
        emotions.tension = Math.max(emotions.tension, 3);
      }
      
      return emotions;
    };
    
    // Calculate tension score from emotions
    const calculateTension = (emotions) => {
      // Emotion weights for tension calculation
      const weights = {
        "fear": 1.5,
        "tension": 1.7,
        "danger": 1.8,
        "anger": 0.8,
        "surprise": 0.6,
        "sadness": 0.3,
        "relief": -1.2,
        "joy": -0.7,
        "disgust": 1.2
      };
      
      let tensionScore = 0;
      
      // Apply weights
      Object.keys(weights).forEach(emotion => {
        if (emotions[emotion] !== undefined) {
          tensionScore += emotions[emotion] * weights[emotion];
        }
      });
      
      // Normalize to 0-10
      tensionScore = Math.max(0, Math.min(10, (tensionScore + 10) / 2));
      
      return tensionScore;
    };
    
    // Analyze the segment text
    const emotions = analyzeEmotions(segmentText);
    const tension = calculateTension(emotions);
    
    return {
      emotions,
      tension,
      dominantEmotion: getDominantEmotion(emotions)
    };
  };
  
  // Get the dominant emotion from results
  const getDominantEmotion = (emotions) => {
    if (!emotions) return null;
    
    const sortedEmotions = Object.entries(emotions)
      .sort(([, valueA], [, valueB]) => valueB - valueA);
      
    return sortedEmotions.length > 0 ? sortedEmotions[0][0] : null;
  };
  
  // Detect narrative stage based on position and tension
  const detectNarrativeStage = (segmentIndex, totalSegments, tensionScore) => {
    // Narrative arc stages
    const arcStages = [
      "exposition",
      "inciting_incident",
      "rising_action",
      "climax",
      "falling_action",
      "resolution"
    ];
    
    // Position-based stage detection
    const position = segmentIndex / (totalSegments - 1);
    
    // Default position-based mapping
    let stageIndex = Math.min(
      arcStages.length - 1,
      Math.floor(position * arcStages.length)
    );
    
    // Tension-based adjustments
    if (tensionScore > 8 && position > 0.3 && position < 0.8) {
      return "climax"; // High tension in middle sections suggests climax
    } else if (tensionScore > 6 && position < 0.3) {
      return "inciting_incident"; // High tension early suggests inciting incident
    } else if (tensionScore < 3 && position > 0.7) {
      return "resolution"; // Low tension late suggests resolution
    } else if (tensionScore < 3 && position < 0.2) {
      return "exposition"; // Low tension early suggests exposition
    }
    
    return arcStages[stageIndex];
  };
  
  // Segment by emotion (simplified version)
  const segmentByEmotion = (text, numParts = 6) => {
    // Get sentences
    const sentences = text.split(/[.!?]+/g).filter(s => s.trim().length > 0);
    
    if (sentences.length <= numParts) {
      return sentences;
    }
    
    // For simplicity, use equal length segmentation
    const segmentSize = Math.ceil(sentences.length / numParts);
    const segments = [];
    
    for (let i = 0; i < sentences.length; i += segmentSize) {
      const segment = sentences.slice(i, i + segmentSize).join('. ');
      segments.push(segment);
    }
    
    return segments;
  };
  
  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  // Load example text
  const handleExampleLoad = (exampleKey) => {
    setStoryText(EXAMPLE_TEXTS[exampleKey]);
  };
  
  // Split custom terms into array
  const getCustomTermsArray = () => {
    return customTerms
      .split(',')
      .map(term => term.trim())
      .filter(term => term.length > 0);
  };
  
  return (
    <div className="narrative-analysis-dashboard">
      <div className="analysis-header">
        <h2>{storyTitle || 'Narrative Analysis'}</h2>
        
        <div className="analysis-controls">
          <button 
            onClick={handleFullAnalysis}
            disabled={isAnalyzing || !storyText.trim()}
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze Story'}
          </button>
          
          <button 
            onClick={handleSegmentation}
            disabled={isAnalyzing || !storyText.trim()}
          >
            Re-segment Story
          </button>
        </div>
      </div>
      
      <div className="input-fields">
        <div className="input-group">
          <label htmlFor="story-title">Story Title:</label>
          <input
            id="story-title"
            type="text"
            value={storyTitle}
            onChange={handleTitleChange}
            placeholder="Enter story title"
          />
        </div>
        
        <div className="input-group">
          <label htmlFor="story-text">Story Text:</label>
          <textarea
            id="story-text"
            rows="8"
            value={storyText}
            onChange={handleTextChange}
            placeholder="Enter or paste your story text here..."
          />
        </div>
        
        <div className="input-group">
          <label htmlFor="custom-terms">
            Custom Terms for Analysis (comma-separated):
          </label>
          <input
            id="custom-terms"
            type="text"
            value={customTerms}
            onChange={handleCustomTermsChange}
            placeholder="E.g., dragon, wizard, sword, kingdom"
          />
        </div>
      </div>
      
      {errorMessage && (
        <div className="error-message">
          {errorMessage}
        </div>
      )}
      
      <div className="example-texts">
        <h4>Try with Example Text:</h4>
        <div className="example-buttons">
          <button 
            className="example-button"
            onClick={() => handleExampleLoad('fear')}
          >
            Fear Example
          </button>
          <button 
            className="example-button"
            onClick={() => handleExampleLoad('tension')}
          >
            Tension Example
          </button>
          <button 
            className="example-button"
            onClick={() => handleExampleLoad('action')}
          >
            Action Example
          </button>
          <button 
            className="example-button"
            onClick={() => handleExampleLoad('joy')}
          >
            Joy Example
          </button>
          <button 
            className="example-button"
            onClick={() => handleExampleLoad('climax')}
          >
            Climax Example
          </button>
          <button 
            className="example-button"
            onClick={() => handleExampleLoad('resolution')}
          >
            Resolution Example
          </button>
        </div>
      </div>
      
      {segments.length > 0 && (
        <div className="analysis-results">
          <div className="analysis-tab-container">
            <div className="analysis-tabs">
              <div 
                className={`analysis-tab ${activeTab === 'emotions' ? 'active' : ''}`}
                onClick={() => handleTabChange('emotions')}
              >
                Emotions
              </div>
              <div 
                className={`analysis-tab ${activeTab === 'tension' ? 'active' : ''}`}
                onClick={() => handleTabChange('tension')}
              >
                Narrative Tension
              </div>
              <div 
                className={`analysis-tab ${activeTab === 'linguistic' ? 'active' : ''}`}
                onClick={() => handleTabChange('linguistic')}
              >
                Linguistic Features
              </div>
              <div 
                className={`analysis-tab ${activeTab === 'proximity' ? 'active' : ''}`}
                onClick={() => handleTabChange('proximity')}
              >
                Character-Danger
              </div>
              <div 
                className={`analysis-tab ${activeTab === 'segments' ? 'active' : ''}`}
                onClick={() => handleTabChange('segments')}
              >
                Segments
              </div>
            </div>
            
            <div className={`analysis-panel ${activeTab === 'emotions' ? 'active' : ''}`}>
              {/* For each segment, show emotion analysis */}
              {segments.map((segment, index) => (
                <div key={`emotion-${index}`} className="segment-emotion-analysis">
                  <h4>Segment {index + 1} Emotions</h4>
                  <EmotionAnalyzer 
                    text={segment}
                    customTerms={getCustomTermsArray()}
                  />
                </div>
              ))}
            </div>
            
            <div className={`analysis-panel ${activeTab === 'tension' ? 'active' : ''}`}>
              <NarrativeTensionVisualizer 
                segments={segments}
                tensionScores={tensionScores}
                narrativeStages={narrativeStages}
              />
            </div>
            
            <div className={`analysis-panel ${activeTab === 'linguistic' ? 'active' : ''}`}>
              {/* Full story linguistic analysis */}
              <LinguisticFeatureAnalyzer text={storyText} />
              
              {/* For each segment, show linguistic analysis */}
              {segments.map((segment, index) => (
                <div key={`linguistic-${index}`} className="segment-linguistic-analysis">
                  <h4>Segment {index + 1} Linguistic Features</h4>
                  <LinguisticFeatureAnalyzer text={segment} />
                </div>
              ))}
            </div>
            
            <div className={`analysis-panel ${activeTab === 'proximity' ? 'active' : ''}`}>
              <CharacterDangerProximityAnalyzer 
                text={storyText}
                customCharacters={getCustomTermsArray()}
              />
            </div>
            
            <div className={`analysis-panel ${activeTab === 'segments' ? 'active' : ''}`}>
              <StorySegmenter 
                text={storyText}
                onSegmentationComplete={(result) => {
                  setSegments(result.segments);
                  setEmotionProfiles(result.emotionAnalysis.map(item => item.emotions));
                  setTensionScores(result.emotionAnalysis.map(item => item.tension));
                }}
                customTerms={getCustomTermsArray()}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NarrativeAnalysisDashboard;