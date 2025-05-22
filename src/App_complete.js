import React, { useState } from 'react';
import './App.css';
import UnifiedTextInput from './components/unified-text-input';
import NarrativeTensionDisplay from './components/narrative-tension-visualizer';
import ActionPaceDisplay from './components/action-pace-display';
import EmotionalProfileDisplay from './components/emotional-profile-display';
import StoryStructureDisplay from './components/story-segmenter';
import CharacterDangerDisplay from './components/character-danger-proximity-analyzer';
import LinguisticFeaturesDisplay from './components/linguistic-feature-analyzer';
import EnhancedEmotionalDisplay from './components/enhanced-emotional-display';

function App() {
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isAnalysisComplete, setIsAnalysisComplete] = useState(false);
  
  // Handle the completed analysis from the unified input
  const handleAnalysisComplete = (results) => {
    setAnalysisResults(results);
    setIsAnalysisComplete(true);
    // Scroll to results
    setTimeout(() => {
      document.getElementById('analysis-results')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };
  console.log(analysisResults);
  return (
    <div className="app">
      <header className="app-header">
        <h1>Narrative Emotion Analyzer</h1>
        <p>Analyze emotional arcs in text narratives</p>
      </header>
      
      <main className="app-main">
        {/* Unified text input section */}
        <section className="text-input-section">
          <UnifiedTextInput onAnalysisComplete={handleAnalysisComplete} />
        </section>
        
        {/* Analysis results section */}
        {isAnalysisComplete && analysisResults && (
          <section id="analysis-results" className="analysis-results">
           
            
        
            

            
            {/* Emotional Profile */}
            <section className="analysis-section">
              <h3>Emotional Profile</h3>
            <EnhancedEmotionalDisplay data={analysisResults.emotion} />
          
              <EmotionalProfileDisplay data={analysisResults.emotion} />
            </section>
           
            {/* Action Pace */}
            <section className="analysis-section">
              <h3>Action Pace</h3>
              <ActionPaceDisplay data={analysisResults.pace} />
            </section>


            {/* Story Segmentation */}
            <section className="analysis-section">
              <h3>Story Segmentation</h3>
              <StoryStructureDisplay data={analysisResults.storyStructure} />
            </section>
            
            {/* Character Danger Proximity */}
            <section className="analysis-section">
              <h3>Character Danger Proximity</h3>
              <CharacterDangerDisplay data={analysisResults.characterDanger} />
            </section>
            
            {/* Linguistic Features */}
            <section className="analysis-section">
              <h3>Linguistic Features</h3>
              <LinguisticFeaturesDisplay data={analysisResults.linguistic} />
            </section>
          </section>
        )}
      </main>
      
      <footer className="app-footer">
        {isAnalysisComplete && (
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="back-to-top"
          >
            Back to Analysis
          </button>
        )}
      </footer>
    </div>
  );
}

export default App;