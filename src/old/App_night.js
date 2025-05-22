import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// In your App.js or main component
import { useEnhancedEmotionAnalysis } from './components/enhanced-emotion-analyzer';
import { EmotionAnalyzer, NarrativeTensionVisualizer } from './components/emotion-analysis-components';
import NarrativeAnalysisDashboard from './components/narrative-analysis-dashboard';
import './styles/emotion-analysis-styles.css';
// Sample components demonstrating integration with your existing app

/**
 * EmotionEnhancedApp - Integrate enhanced emotion analysis with your existing app
 */
const EmotionEnhancedApp = () => {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [numSegments, setNumSegments] = useState(6);
  const [segments, setSegments] = useState([]);
  const [emotionProfiles, setEmotionProfiles] = useState([]);
  const [narrativeTension, setNarrativeTension] = useState([]);
  const [actionPace, setActionPace] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showEnhancedAnalysis, setShowEnhancedAnalysis] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  
  // Get enhanced emotion analysis hook
  const { analyzeEmotions, calculateTension } = useEnhancedEmotionAnalysis();
  
  // Handle text change
  const handleTextChange = (e) => {
    setText(e.target.value);
  };
  
  // Handle title change
  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };
  
  // Handle number of segments change
  const handleNumSegmentsChange = (e) => {
    setNumSegments(parseInt(e.target.value) || 6);
  };
  
  // Analyze text using both original and enhanced methods
  const analyzeText = async () => {
    if (!text || !text.trim()) {
      setErrorMessage("Please enter some text to analyze");
      return;
    }
    
    setIsAnalyzing(true);
    setErrorMessage("");
    
    try {
      // 1. Segment the text (use the original method from your app)
      const segmentedText = autoSegmentText(text, numSegments);
      setSegments(segmentedText);
      
      // 2. Calculate emotion profiles with enhanced analysis
      const profiles = [];
      const tensionScores = [];
      
      for (const segment of segmentedText) {
        // Use enhanced emotion analysis
        const emotions = analyzeEmotions(segment);
        profiles.push(emotions);
        
        // Calculate tension score
        const tension = calculateTension(emotions);
        tensionScores.push(tension);
      }
      
      setEmotionProfiles(profiles);
      
      // Format tension data for chart
      const tensionData = tensionScores.map((value, index) => ({
        segment: index,
        value: value
      }));
      setNarrativeTension(tensionData);
      
      // 3. Calculate action pace (using your original method)
      const pace = segmentedText.map(segment => calculateActionPace(segment));
      setActionPace(pace.map((value, index) => ({
        segment: index,
        value: value
      })));
      
      // Store results for comparison
      setAnalysisResults({
        segments: segmentedText,
        emotionProfiles: profiles,
        tension: tensionScores,
        pace: pace
      });
      
      setIsAnalyzing(false);
    } catch (error) {
      console.error("Error analyzing text:", error);
      setErrorMessage("An error occurred during analysis: " + error.message);
      setIsAnalyzing(false);
    }
  };
  
  // Toggle enhanced analysis dashboard
  const toggleEnhancedAnalysis = () => {
    setShowEnhancedAnalysis(!showEnhancedAnalysis);
  };
  
  // Auto-segment text (simplified version of your original method)
  const autoSegmentText = (text, numParts) => {
    // This is a placeholder - in practice, you'd use your actual segmentation method
    const sentences = text.split(/[.!?]+/g).filter(s => s.trim().length > 0);
    
    if (sentences.length <= numParts) {
      return sentences;
    }
    
    const segmentSize = Math.ceil(sentences.length / numParts);
    const segments = [];
    
    for (let i = 0; i < sentences.length; i += segmentSize) {
      const segment = sentences.slice(i, i + segmentSize).join('. ');
      segments.push(segment);
    }
    
    return segments;
  };
  
  // Calculate action pace (simplified version of your original method)
  const calculateActionPace = (text) => {
    // This is a placeholder - in practice, you'd use your actual action pace calculation
    // Just generating a random value for demonstration purposes
    return Math.random() * 10;
  };
  
  return (
    <div className="app-container">
      <div className="main-info-panel">
        <h2>Narrative Arc Analysis with Enhanced Emotion Detection</h2>
        <p>Upload text to analyze its narrative structure, emotion flow, and tension patterns.</p>
        
        <div className="enhanced-toggle">
          <button onClick={toggleEnhancedAnalysis}>
            {showEnhancedAnalysis ? 'Hide Enhanced Analysis Dashboard' : 'Show Enhanced Analysis Dashboard'}
          </button>
        </div>
      </div>
      
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
        </div>

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
      
      {/* Show enhanced dashboard if toggled on */}
      {showEnhancedAnalysis && (
        <div className="enhanced-analysis-section">
          <NarrativeAnalysisDashboard
            text={text}
            title={title}
            initialSegments={segments.length > 0 ? segments : null}
            onAnalysisComplete={(results) => {
              console.log("Enhanced analysis complete:", results);
            }}
          />
        </div>
      )}
      
      {/* Original analysis results */}
      {segments.length > 0 && (
        <div className="results-container">
          <h2>Analysis Results: {title || "Untitled Story"}</h2>
          
          <div className="chart-grid">
            {/* Original Emotion Chart */}
            <div className="chart-container">
              <h3>Original Emotion Analysis</h3>
              {/* Your original emotion visualization */}
              <p>Your original emotion visualization would go here</p>
            </div>
            
            {/* Enhanced Emotion Chart */}
            <div className="chart-container">
              <h3>Enhanced Emotion Analysis</h3>
              <EmotionAnalyzer text={text} />
            </div>
            
            {/* Original Tension Chart */}
            <div className="chart-container">
              <h3>Original Narrative Tension</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={narrativeTension} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="segment" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="value" stroke="#8c564b" strokeWidth={2} dot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            {/* Enhanced Tension Chart */}
            <div className="chart-container">
              <h3>Enhanced Narrative Tension</h3>
              {segments && narrativeTension.length > 0 && (
                <NarrativeTensionVisualizer 
                  segments={segments}
                  tensionScores={narrativeTension.map(t => t.value)}
                  narrativeStages={segments.map((_, i) => {
                    // Simple mapping of positions to narrative stages
                    const position = i / (segments.length - 1);
                    if (position < 0.15) return "exposition";
                    if (position < 0.3) return "inciting_incident";
                    if (position < 0.6) return "rising_action";
                    if (position < 0.75) return "climax";
                    if (position < 0.9) return "falling_action";
                    return "resolution";
                  })}
                />
              )}
            </div>
            
            {/* Original Action Pace Chart */}
            <div className="chart-container">
              <h3>Action Pace</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={actionPace} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="segment" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="value" stroke="#2ca02c" strokeWidth={2} dot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="segment-display">
            <h3>Story Segments and Analysis</h3>
            {segments.map((segment, index) => (
              <div key={index} className="segment-card">
                <h4>Segment {index + 1}</h4>
                
                {/* Segment emotion comparison */}
                <div className="segment-analysis-comparison">
                  <div className="original-analysis">
                    <h5>Original Analysis</h5>
                    {/* Your original segment analysis display */}
                    <p>Original emotion analysis would go here</p>
                  </div>
                  
                  <div className="enhanced-analysis">
                    <h5>Enhanced Analysis</h5>
                    <EmotionAnalyzer text={segment} />
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
};

/**
 * EmotionAnalysisIntegration - Main app entry point demonstrating integration
 * with your existing App.js
 */
function EmotionAnalysisIntegration() {
  return (
    <div className="narrative-analysis-app">
      <h1>Narrative Arc Analysis with Enhanced Emotion Detection</h1>
      
      <div className="integration-tabs">
        <div className="tab active">Enhanced Integration</div>
        <div className="tab">Original App</div>
      </div>
      
      <p className="integration-description">
        This component demonstrates how to integrate the enhanced emotion analysis
        into your existing application. You can use the components individually
        or incorporate the full dashboard.
      </p>
      
      <EmotionEnhancedApp />
      
      <div className="integration-instructions">
        <h3>Integration Steps</h3>
        <ol>
          <li><strong>Basic Integration:</strong> Import the enhanced emotion analyzer and use it in place of your current emotion detection</li>
          <li><strong>Component-based Integration:</strong> Use individual components like EmotionAnalyzer and NarrativeTensionVisualizer</li>
          <li><strong>Full Dashboard Integration:</strong> Add the NarrativeAnalysisDashboard for comprehensive analysis</li>
          <li><strong>Custom Hook Integration:</strong> Use the useEnhancedEmotionAnalysis hook in your existing components</li>
        </ol>
        
        <h3>Key Benefits</h3>
        <ul>
          <li><strong>Improved Emotion Detection:</strong> More nuanced and accurate emotion analysis</li>
          <li><strong>Enhanced Tension Calculation:</strong> Better detection of narrative tension</li>
          <li><strong>Character-Danger Proximity:</strong> Identifies when characters are near danger</li>
          <li><strong>Linguistic Feature Analysis:</strong> Analyzes writing style and sentence structure</li>
          <li><strong>Works Offline:</strong> All analysis done in JavaScript without requiring API calls</li>
        </ul>
      </div>
    </div>
  );
}

export default EmotionAnalysisIntegration;