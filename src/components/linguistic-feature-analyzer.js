import React, { useState, useEffect } from 'react';

/**
 * LinguisticFeatureAnalyzer - Analyzes linguistic features of text
 */
const LinguisticFeatureAnalyzer = ({ text }) => {
  const [features, setFeatures] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Analyze features when text changes
  useEffect(() => {
    if (text && text.trim()) {
      analyzeFeatures(text);
    }
  }, [text]);
  
  // Analyze linguistic features
  const analyzeFeatures = (textToAnalyze) => {
    if (!textToAnalyze || !textToAnalyze.trim()) {
      return;
    }
    
    setIsAnalyzing(true);
    
    try {
      const sentences = textToAnalyze.split(/[.!?]+/g).filter(s => s.trim().length > 0);
      const words = textToAnalyze.split(/\s+/).filter(w => w.trim().length > 0);
      
      // 1. Sentence structure analysis
      const avgSentenceLength = sentences.length > 0 ? 
        words.length / sentences.length : 0;
      
      // Estimate clause complexity by counting commas and conjunctions
      const commaCount = (textToAnalyze.match(/,/g) || []).length;
      const conjunctions = ['and', 'but', 'or', 'nor', 'for', 'yet', 'so', 'because', 'although', 'since', 'unless', 'while'];
      let conjunctionCount = 0;
      
      conjunctions.forEach(conj => {
        const regex = new RegExp(`\\b${conj}\\b`, 'gi');
        const matches = textToAnalyze.match(regex);
        if (matches) conjunctionCount += matches.length;
      });
      
      const clauseComplexity = sentences.length > 0 ? 
        (commaCount + conjunctionCount) / sentences.length : 0;
      
      // Question and imperative detection
      const questionCount = sentences.filter(s => s.trim().endsWith('?')).length;
      
      // Simple imperative detection
      let imperativeCount = 0;
      
      // Fallback simple detection
      imperativeCount = sentences.filter(s => {
        const firstWord = s.trim().split(/\s+/)[0].toLowerCase();
        const imperativeVerbs = ['go', 'come', 'look', 'wait', 'stop', 'get', 'make', 'take', 
                                'run', 'tell', 'listen', 'stand', 'stay', 'move', 'let', 'try'];
        return imperativeVerbs.includes(firstWord);
      }).length;
      
      // 2. Stylistic element identification
      const emphasisMarkers = (textToAnalyze.match(/[*_]{1,2}[^*_]+[*_]{1,2}/g) || []).length +
                             (textToAnalyze.match(/[!]{2,}/g) || []).length;
      
      // Count intensifiers
      const intensifiers = ['very', 'extremely', 'incredibly', 'absolutely', 'completely', 'totally',
                          'utterly', 'entirely', 'thoroughly', 'quite', 'rather', 'somewhat'];
                          
      let intensifierCount = 0;
      intensifiers.forEach(intensifier => {
        const regex = new RegExp(`\\b${intensifier}\\b`, 'gi');
        const matches = textToAnalyze.match(regex);
        if (matches) intensifierCount += matches.length;
      });
      
      // Detect repetition patterns
      const wordsLower = words.map(w => w.toLowerCase());
      let repetitionCount = 0;
      
      for (let i = 0; i < wordsLower.length - 1; i++) {
        if (wordsLower[i] && wordsLower[i] === wordsLower[i+1]) {
          repetitionCount++;
        }
      }
      
      // 3. Rhetorical device recognition
      let rhetoricalCount = 0;
      
      // Check for hyperbole
      const hyperboleTerms = ['never', 'always', 'every', 'all', 'none', 'ever', 'most', 'best', 'worst'];
      hyperboleTerms.forEach(term => {
        const regex = new RegExp(`\\b${term}\\b`, 'gi');
        const matches = textToAnalyze.match(regex);
        if (matches) rhetoricalCount += matches.length * 0.5;
      });
      
      // Check for similes and metaphors
      const similePatterns = [' like ', ' as ', 'resembled', 'similar to'];
      similePatterns.forEach(pattern => {
        rhetoricalCount += (textToAnalyze.toLowerCase().split(pattern).length - 1) * 0.8;
      });
      
      const metaphorPatterns = ['is a', 'was a', 'are a', 'were a'];
      metaphorPatterns.forEach(pattern => {
        rhetoricalCount += (textToAnalyze.toLowerCase().split(pattern).length - 1) * 0.8;
      });
      
      // 4. Analyze reading level
      const wordLengths = words.map(word => word.length);
      const avgWordLength = wordLengths.reduce((sum, length) => sum + length, 0) / Math.max(1, words.length);
      
      // Approximate syllable count (very basic)
      let syllableCount = 0;
      words.forEach(word => {
        const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
        let wordSyllables = 0;
        
        // Count vowel groups
        const vowelGroups = cleanWord.split(/[^aeiouy]+/).filter(Boolean);
        wordSyllables = vowelGroups.length;
        
        // Handle common exceptions
        if (cleanWord.length > 3 && cleanWord.endsWith('e')) {
          // Silent 'e' at the end
          wordSyllables--;
        }
        
        // Every word has at least one syllable
        syllableCount += Math.max(1, wordSyllables);
      });
      
      // Calculate Flesch-Kincaid Grade Level (approximate)
      const fleschKincaidGrade = 0.39 * (words.length / Math.max(1, sentences.length)) +
                                11.8 * (syllableCount / Math.max(1, words.length)) - 15.59;
      
      // Calculate Flesch Reading Ease (approximate)
      const fleschReadingEase = 206.835 - 1.015 * (words.length / Math.max(1, sentences.length)) -
                               84.6 * (syllableCount / Math.max(1, words.length));
      
      // Normalize all values to 0-10 scale
      const normalizedFeatures = {
        sentenceLength: Math.min(10, avgSentenceLength / 3),
        clauseComplexity: Math.min(10, clauseComplexity * 3),
        questions: Math.min(10, (questionCount / Math.max(1, sentences.length)) * 20),
        imperatives: Math.min(10, (imperativeCount / Math.max(1, sentences.length)) * 20),
        emphasis: Math.min(10, (emphasisMarkers) / (Math.max(1, sentences.length) / 2)),
        intensifiers: Math.min(10, intensifierCount / (Math.max(1, words.length) / 50) * 2),
        repetition: Math.min(10, repetitionCount * 2),
        rhetorical: Math.min(10, rhetoricalCount),
        readingLevel: Math.min(10, fleschKincaidGrade / 1.5),
        readability: Math.min(10, (100 - Math.max(0, Math.min(100, fleschReadingEase))) / 10)
      };
      
      // Set features
      setFeatures({
        ...normalizedFeatures,
        rawData: {
          sentenceCount: sentences.length,
          wordCount: words.length,
          avgSentenceLength,
          commaCount,
          conjunctionCount,
          questionCount,
          imperativeCount,
          emphasisMarkers,
          intensifierCount,
          repetitionCount,
          rhetoricalCount,
          avgWordLength,
          fleschKincaidGrade,
          fleschReadingEase
        }
      });
    } catch (error) {
      console.error("Error analyzing linguistic features:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Feature descriptions for tooltips
  const featureDescriptions = {
    sentenceLength: "Average length of sentences; higher values indicate longer, more complex sentences",
    clauseComplexity: "Complexity based on commas and conjunctions; higher values indicate more compound/complex sentences",
    questions: "Proportion of sentences that are questions; higher values indicate uncertainty or dialogue",
    imperatives: "Proportion of imperative sentences; higher values indicate commands or instructions",
    emphasis: "Use of emphasis markers and exclamations; higher values indicate emotional intensity",
    intensifiers: "Use of intensifier words; higher values indicate stronger emotional expression",
    repetition: "Repeated words or patterns; higher values indicate stylistic repetition or emphasis",
    rhetorical: "Use of rhetorical devices like hyperbole, simile, and metaphor; higher values indicate more figurative language",
    readingLevel: "Estimated reading difficulty level; higher values indicate more advanced vocabulary and sentence structure",
    readability: "Text complexity for readers; higher values indicate more difficult to read text"
  };
  
  // Get bar color based on feature value
  const getFeatureColor = (feature, value) => {
    // Different color schemes for different feature types
    if (['sentenceLength', 'clauseComplexity', 'readingLevel', 'readability'].includes(feature)) {
      // Blue-to-red spectrum for complexity features (blue = simple, red = complex)
      return `hsl(${Math.max(0, 210 - (value * 21))}, 70%, 50%)`;
    } else if (['questions', 'imperatives'].includes(feature)) {
      // Purple spectrum for dialogue/command features
      return `hsl(${280 + value * 8}, 70%, ${Math.max(40, 65 - value * 2)}%)`;
    } else {
      // Green-to-orange spectrum for stylistic features
      return `hsl(${Math.max(20, 120 - (value * 10))}, 70%, 50%)`;
    }
  };
  
  // Determine writing style based on features
  const determineWritingStyle = (features) => {
    // Extract key style indicators
    const { 
      sentenceLength, 
      clauseComplexity, 
      questions, 
      imperatives, 
      emphasis, 
      intensifiers, 
      repetition, 
      rhetorical,
      readingLevel,
      readability
    } = features;
    
    // Calculate style metrics
    const complexity = (sentenceLength + clauseComplexity + readingLevel) / 3;
    const emotionality = (emphasis + intensifiers) / 2;
    const formality = readingLevel - (questions + imperatives) / 2;
    const creativity = (rhetorical + repetition) / 2;
    
    // Determine primary style
    let primaryStyle = "";
    let styleDescription = "";
    
    if (complexity > 7) {
      primaryStyle = "Academic";
      styleDescription = "This text uses complex sentence structures and advanced vocabulary typical of academic or scholarly writing. ";
    } else if (complexity > 5) {
      primaryStyle = "Professional";
      styleDescription = "This text is moderately complex with careful structure, suitable for professional contexts. ";
    } else {
      primaryStyle = "Conversational";
      styleDescription = "This text uses simpler sentence structures and vocabulary, making it accessible and conversational. ";
    }
    
    // Add emotionality description
    if (emotionality > 6) {
      styleDescription += "The writing is highly emotive with strong emphasis and intensity. ";
    } else if (emotionality > 3) {
      styleDescription += "The writing contains moderate emotional elements. ";
    } else {
      styleDescription += "The writing is emotionally restrained and measured. ";
    }
    
    // Add creativity description
    if (creativity > 6) {
      styleDescription += "There is significant use of figurative language and rhetorical devices. ";
    } else if (creativity > 3) {
      styleDescription += "The text includes some creative elements and rhetorical devices. ";
    } else {
      styleDescription += "The text is primarily straightforward with minimal figurative language. ";
    }
    
    // Add special style notes
    if (questions > 6) {
      styleDescription += "Frequent questions suggest a dialogic or inquiry-based approach. ";
    }
    
    if (imperatives > 6) {
      styleDescription += "The frequent use of commands indicates instructional or directive content. ";
    }
    
    if (repetition > 6) {
      styleDescription += "Repetitive patterns suggest emphasis or rhetorical technique. ";
    }
    
    return (
      <div>
        <p><strong>Primary Style:</strong> {primaryStyle}</p>
        <p>{styleDescription}</p>
        <p><strong>Reading Level:</strong> Grade {features.rawData.fleschKincaidGrade.toFixed(1)} (Flesch-Kincaid)</p>
      </div>
    );
  };
  
  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>Linguistic Feature Analysis</h3>
      
      {isAnalyzing ? (
        <div style={styles.analyzing}>Analyzing linguistic features...</div>
      ) : features ? (
        <div style={styles.featureResults}>
          <div style={styles.summarySection}>
            <h4 style={styles.summaryHeading}>Text Summary</h4>
            <div style={styles.summaryGrid}>
              <div style={styles.summaryItem}>
                <div style={styles.summaryLabel}>Words</div>
                <div style={styles.summaryValue}>{features.rawData.wordCount}</div>
              </div>
              <div style={styles.summaryItem}>
                <div style={styles.summaryLabel}>Sentences</div>
                <div style={styles.summaryValue}>{features.rawData.sentenceCount}</div>
              </div>
              <div style={styles.summaryItem}>
                <div style={styles.summaryLabel}>Reading Level</div>
                <div style={styles.summaryValue}>
                  {features.rawData.fleschKincaidGrade.toFixed(1)}
                </div>
              </div>
              <div style={styles.summaryItem}>
                <div style={styles.summaryLabel}>Avg. Sentence</div>
                <div style={styles.summaryValue}>
                  {features.rawData.avgSentenceLength.toFixed(1)} words
                </div>
              </div>
            </div>
          </div>
          
          <div style={styles.featureBars}>
            {Object.entries(features)
              .filter(([key]) => key !== 'rawData')
              .map(([feature, value]) => (
                <div key={feature} style={styles.featureBarContainer}>
                  <span style={styles.featureLabel} title={featureDescriptions[feature]}>
                    {feature.charAt(0).toUpperCase() + feature.slice(1).replace(/([A-Z])/g, ' $1')}
                  </span>
                  <div style={styles.barContainer}>
                    <div 
                      style={{ 
                        ...styles.featureBar,
                        width: `${value * 10}%`, 
                        backgroundColor: getFeatureColor(feature, value)
                      }}
                    />
                  </div>
                  <span style={styles.featureValue}>{value.toFixed(1)}</span>
                </div>
              ))}
          </div>
          
          <div style={styles.styleProfile}>
            <h4 style={styles.styleHeading}>Writing Style Profile</h4>
            <div style={styles.styleDescription}>
              {determineWritingStyle(features)}
            </div>
          </div>
          
          <div style={styles.featureExplanation}>
            <h4 style={styles.explanationHeading}>Feature Descriptions</h4>
            <div style={styles.explanationList}>
              {Object.entries(featureDescriptions).map(([feature, description]) => (
                <div key={feature} style={styles.explanationItem}>
                  <strong style={styles.explanationFeature}>
                    {feature.charAt(0).toUpperCase() + feature.slice(1).replace(/([A-Z])/g, ' $1')}
                  </strong>
                  <span style={styles.explanationText}>{description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={styles.noAnalysis}>
          <p>Enter text to analyze linguistic features.</p>
        </div>
      )}
    </div>
  );
};

// Styles
const styles = {
  container: {
    fontFamily: 'Arial, sans-serif',
    maxWidth: '800px',
    margin: '0 auto',
    padding: '15px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  heading: {
    color: '#2c3e50',
    borderBottom: '1px solid #eee',
    paddingBottom: '10px',
    marginTop: '0'
  },
  analyzing: {
    padding: '20px',
    textAlign: 'center',
    color: '#666',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px'
  },
  featureResults: {
    marginTop: '15px'
  },
  summarySection: {
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
    padding: '15px',
    marginBottom: '20px'
  },
  summaryHeading: {
    margin: '0 0 15px 0',
    color: '#333',
    fontSize: '16px'
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '15px'
  },
  summaryItem: {
    backgroundColor: '#fff',
    padding: '10px',
    borderRadius: '4px',
    textAlign: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  summaryLabel: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '5px'
  },
  summaryValue: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333'
  },
  featureBars: {
    marginBottom: '25px'
  },
  featureBarContainer: {
    display: 'flex',
    alignItems: 'center',
    margin: '10px 0',
    fontSize: '14px'
  },
  featureLabel: {
    width: '150px',
    textAlign: 'right',
    paddingRight: '10px',
    color: '#555',
    cursor: 'help'
  },
  barContainer: {
    flex: '1',
    height: '15px',
    backgroundColor: '#f0f0f0',
    borderRadius: '10px',
    overflow: 'hidden',
    margin: '0 10px'
  },
  featureBar: {
    height: '100%',
    transition: 'width 0.5s ease-out'
  },
  featureValue: {
    width: '30px',
    textAlign: 'right',
    color: '#666'
  },
  styleProfile: {
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
    padding: '15px',
    marginBottom: '20px'
  },
  styleHeading: {
    margin: '0 0 15px 0',
    color: '#333',
    fontSize: '16px'
  },
  styleDescription: {
    fontSize: '14px',
    lineHeight: '1.5',
    color: '#333'
  },
  featureExplanation: {
    padding: '15px',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px'
  },
  explanationHeading: {
    margin: '0 0 15px 0',
    color: '#333',
    fontSize: '16px'
  },
  explanationList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '10px'
  },
  explanationItem: {
    margin: '5px 0',
    fontSize: '14px'
  },
  explanationFeature: {
    display: 'block',
    marginBottom: '3px',
    color: '#333'
  },
  explanationText: {
    color: '#666'
  },
  noAnalysis: {
    padding: '30px',
    textAlign: 'center',
    color: '#666',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px'
  }
};

export default LinguisticFeatureAnalyzer;