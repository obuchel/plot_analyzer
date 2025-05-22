import React, { useState, useRef, useEffect } from 'react';
import { analyzeEmotion, EMOTION_COLORS, EMOTION_LABELS } from './EmotionAnalyzer';

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

const UnifiedTextInput = ({ onAnalysisComplete }) => {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [analyzerReady, setAnalyzerReady] = useState(false);
  const textareaRef = useRef(null);
  
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
  
  // Mock function to perform narrative analysis
  const performAnalysis = async (text, title) => {
    // Reset progress
    setProgress(0);
    
    // Split text into paragraphs
    const paragraphs = segmentIntoParagraphs(text);
    setProgress(10);
    
    // Simulated processing delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Sample emotion analysis
    const emotionResults = {
      paragraphs: await Promise.all(paragraphs.map(async (paragraph, index) => {
        try {
          const analysis = await analyzeEmotion(paragraph);
          return {
            text: paragraph,
            index,
            emotions: analysis.emotions || [],
            dominant: analysis.predictedEmotion || 'neutral',
            probability: analysis.probability || 0
          };
        } catch (error) {
          console.error("Error analyzing paragraph:", error);
          return {
            text: paragraph,
            index,
            emotions: [{ label: 'neutral', prob: 1 }],
            dominant: 'neutral',
            probability: 1
          };
        }
      })),
    };
    setProgress(50);
    
    // Create emotion totals
    const emotionTotals = {};
    EMOTION_LABELS.forEach(label => { emotionTotals[label] = 0 });
    
    // Add to totals for overall emotion calculation
    emotionResults.paragraphs.forEach(paragraph => {
      paragraph.emotions.forEach(emotion => {
        emotionTotals[emotion.label] = (emotionTotals[emotion.label] || 0) + emotion.prob;
      });
    });
    
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
    
    // Create emotional arc
    emotionResults.emotionalArc = emotionResults.paragraphs.map((result, index) => {
      // Find the most intense non-neutral emotion
      const nonNeutral = result.emotions
        .filter(e => e.label !== 'neutral')
        .sort((a, b) => b.prob - a.prob)[0] || { label: 'neutral', prob: 0 };
      
      return {
        index,
        emotion: nonNeutral.label,
        value: nonNeutral.prob,
        position: index / (emotionResults.paragraphs.length - 1 || 1)
      };
    });
    
    // Create segments for visualization
    const segments = [];
    let currentSegment = {
      startIndex: 0,
      dominantEmotion: emotionResults.paragraphs[0]?.dominant || 'neutral',
      paragraphs: [emotionResults.paragraphs[0]]
    };
    
    for (let i = 1; i < emotionResults.paragraphs.length; i++) {
      const prev = emotionResults.paragraphs[i-1];
      const curr = emotionResults.paragraphs[i];
      
      // If emotion changes significantly or after 3-5 paragraphs, create a new segment
      if (curr.dominant !== prev.dominant || 
          curr.dominant !== currentSegment.dominantEmotion ||
          currentSegment.paragraphs.length >= 4) {
        
        // Finalize current segment
        segments.push({
          startIndex: currentSegment.startIndex,
          endIndex: i - 1,
          dominantEmotion: currentSegment.dominantEmotion,
          text: currentSegment.paragraphs.map(p => p.text).join('\n\n'),
          score: currentSegment.paragraphs.reduce((sum, p) => 
            sum + (p.emotions.find(e => e.label === currentSegment.dominantEmotion)?.prob || 0), 0) / 
            currentSegment.paragraphs.length,
          percentage: (i - currentSegment.startIndex) / emotionResults.paragraphs.length * 100
        });
        
        // Start new segment
        currentSegment = {
          startIndex: i,
          dominantEmotion: curr.dominant,
          paragraphs: [curr]
        };
      } else {
        // Continue current segment
        currentSegment.paragraphs.push(curr);
      }
    }
    
    // Add the last segment
    if (currentSegment.paragraphs.length > 0) {
      segments.push({
        startIndex: currentSegment.startIndex,
        endIndex: emotionResults.paragraphs.length - 1,
        dominantEmotion: currentSegment.dominantEmotion,
        text: currentSegment.paragraphs.map(p => p.text).join('\n\n'),
        score: currentSegment.paragraphs.reduce((sum, p) => 
          sum + (p.emotions.find(e => e.label === currentSegment.dominantEmotion)?.prob || 0), 0) / 
          currentSegment.paragraphs.length,
        percentage: (emotionResults.paragraphs.length - currentSegment.startIndex) / emotionResults.paragraphs.length * 100
      });
    }
    
    emotionResults.segments = segments;
    setProgress(60);
    
    // Simulate narrative tension calculation
    const tensionData = {
      tensionByParagraph: emotionResults.paragraphs.map(paragraph => {
        // Calculate tension score based on emotion probabilities
        const tensionMap = {
          'fear': 0.9,
          'anger': 0.8,
          'surprise': 0.7,
          'sadness': 0.5,
          'disgust': 0.4,
          'joy': 0.2,
          'neutral': 0.1
        };
        
        let tensionScore = 0;
        paragraph.emotions.forEach(emotion => {
          tensionScore += (tensionMap[emotion.label] || 0) * emotion.prob;
        });
        
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
    
    // Create tension arc
    tensionData.tensionArc = tensionData.tensionByParagraph.map((item, index) => ({
      index,
      value: item.tension,
      position: index / (tensionData.tensionByParagraph.length - 1 || 1)
    }));
    
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
    
    setProgress(70);
    
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
    
    // Create action highlights
    paceData.actionHighlights = paceData.paceSegments
      .filter(p => p.pace === 'rapid' || p.pace === 'fast')
      .slice(0, 3)
      .map(p => ({
        text: p.text,
        pace: p.pace,
        analysis: `High action ${p.pace === 'rapid' ? 'scene' : 'sequence'} with ${p.pace === 'rapid' ? 'intense' : 'significant'} movement.`
      }));
    
    setProgress(80);
    
    // Simulate story structure
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
      
      // Calculate segment boundaries
      const setupEndIndex = Math.floor(totalParagraphs * 0.2);
      const risingActionEndIndex = climaxIndex - 1;
      const fallingActionStartIndex = climaxIndex + 1;
      const resolutionStartIndex = Math.floor(totalParagraphs * 0.85);
      
      // Calculate percentages
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
    
    // Simulate character danger analysis
    const characterDanger = {
      characters: {},
      dangerHotspots: []
    };
    
    // Find character names using simple heuristic (capitalized words)
    const nameRegex = /\b[A-Z][a-z]+\b/g;
    const potentialNames = {};
    
    paragraphs.forEach(paragraph => {
      const matches = paragraph.match(nameRegex) || [];
      matches.forEach(name => {
        // Filter out common words that might be capitalized
        const commonWords = ['The', 'A', 'An', 'But', 'And', 'Or', 'I', 'You', 'He', 'She', 'They', 'We', 'It'];
        if (!commonWords.includes(name)) {
          potentialNames[name] = (potentialNames[name] || 0) + 1;
        }
      });
    });
    
    // Filter to likely character names (appearing multiple times)
    const characterNames = Object.entries(potentialNames)
      .filter(([_, count]) => count >= 1)
      .map(([name]) => name)
      .slice(0, 5); // Limit to 5 major characters
    
    // For testing purposes, add a default character if none found
    if (characterNames.length === 0) {
      characterNames.push('Character');
    }
    
    // Create character data
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
      
      // Calculate danger score
      const dangerScore = appearances.reduce((sum, app) => sum + app.tension, 0) / 
        Math.max(appearances.length, 1);
      
      // Get danger moments
      const dangerMoments = appearances
        .sort((a, b) => b.tension - a.tension)
        .slice(0, 2);
      
      // Determine dominant emotion
      const emotionCounts = {};
      appearances.forEach(app => {
        emotionCounts[app.emotion] = (emotionCounts[app.emotion] || 0) + 1;
      });
      
      const dominantEmotion = Object.entries(emotionCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([emotion]) => emotion)[0] || 'neutral';
      
      // Create character entry
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
    
    // Create danger hotspots
    characterDanger.dangerHotspots = Object.values(characterDanger.characters)
      .filter(char => char.dangerLevel === 'high' || char.dangerMoments.length > 0)
      .flatMap(char => char.dangerMoments)
      .sort((a, b) => b.tension - a.tension)
      .slice(0, 3);
    
    setProgress(90);
    
    // Simulate linguistic analysis
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
    
    // Calculate average sentence length
    linguisticData.avgSentenceLength = linguisticData.totalWords / Math.max(linguisticData.totalSentences, 1);
    
    // Calculate readability
    linguisticData.readabilityScore = 206.835 - (1.015 * linguisticData.avgSentenceLength) - (84.6 * (linguisticData.totalWords * 1.5 / linguisticData.totalWords));
    
    // Determine readability level
    if (linguisticData.readabilityScore > 90) linguisticData.readabilityLevel = 'very_easy';
    else if (linguisticData.readabilityScore > 80) linguisticData.readabilityLevel = 'easy';
    else if (linguisticData.readabilityScore > 70) linguisticData.readabilityLevel = 'fairly_easy';
    else if (linguisticData.readabilityScore > 60) linguisticData.readabilityLevel = 'standard';
    else if (linguisticData.readabilityScore > 50) linguisticData.readabilityLevel = 'fairly_difficult';
    else if (linguisticData.readabilityScore > 30) linguisticData.readabilityLevel = 'difficult';
    else linguisticData.readabilityLevel = 'very_difficult';
    
    setProgress(95);
    
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
      timestamp: new Date().toISOString()
    };
    
    setProgress(100);
    
    // Return the analysis results
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
      `}</style>
    </div>
  );
};

export default UnifiedTextInput;