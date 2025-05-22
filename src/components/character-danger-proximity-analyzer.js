import React, { useState, useEffect } from 'react';

/**
 * CharacterDangerProximityAnalyzer - Analyzes proximity between characters and danger elements
 */
const CharacterDangerProximityAnalyzer = ({ text, characters = [], dangers = [] }) => {
  const [proximityScore, setProximityScore] = useState(0);
  const [characterInstances, setCharacterInstances] = useState([]);
  const [dangerInstances, setDangerInstances] = useState([]);
  const [proximityInstances, setProximityInstances] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [customCharacters, setCustomCharacters] = useState('');
  const [customDangers, setCustomDangers] = useState('');
  
  // Default character patterns if none provided
  const defaultCharacters = [
    "he", "she", "they", "man", "woman", "boy", "girl", 
    "father", "mother", "son", "daughter", "child", "person", 
    "protagonist", "hero", "heroine", "character", "john", "mary"
  ];
  
  // Default danger patterns if none provided
  const defaultDangers = [
    "danger", "threat", "risk", "peril", "hazard", "harm", "death",
    "weapon", "knife", "gun", "sword", "blood", "fire", "monster",
    "attack", "fight", "battle", "war", "destruction", "explosion",
    "fear", "terror", "horror", "scream", "trap", "villain", "enemy"
  ];
  
  // Analyze proximity when text, characters, or dangers change
  useEffect(() => {
    if (text && text.trim()) {
      analyzeProximity(
        text, 
        characters.length > 0 ? characters : getCustomTermsArray(customCharacters, defaultCharacters),
        dangers.length > 0 ? dangers : getCustomTermsArray(customDangers, defaultDangers)
      );
    }
  }, [text, characters, dangers, customCharacters, customDangers]);
  
  // Convert comma-separated string to array
  const getCustomTermsArray = (customTermsString, defaults) => {
    if (!customTermsString || !customTermsString.trim()) {
      return defaults;
    }
    
    return customTermsString
      .split(',')
      .map(term => term.trim())
      .filter(term => term.length > 0);
  };
  
  // Handle custom characters input change
  const handleCustomCharactersChange = (e) => {
    setCustomCharacters(e.target.value);
  };
  
  // Handle custom dangers input change
  const handleCustomDangersChange = (e) => {
    setCustomDangers(e.target.value);
  };
  
  // Analyze proximity between characters and dangers
  const analyzeProximity = (textToAnalyze, charactersToFind, dangersToFind) => {
    if (!textToAnalyze || !textToAnalyze.trim() || 
        !charactersToFind || !charactersToFind.length || 
        !dangersToFind || !dangersToFind.length) {
      return;
    }
    
    setIsAnalyzing(true);
    
    try {
      const sentences = textToAnalyze.split(/[.!?]+/g).filter(s => s.trim().length > 0);
      const characterMatches = [];
      const dangerMatches = [];
      const proximityMatches = [];
      let totalProximityScore = 0;
      
      sentences.forEach((sentence, sentenceIndex) => {
        const sentenceLower = sentence.toLowerCase();
        
        // Find character mentions in this sentence
        const charactersInSentence = charactersToFind.filter(character => 
          sentenceLower.includes(character.toLowerCase())
        );
        
        // Find danger mentions in this sentence
        const dangerInSentence = dangersToFind.filter(danger => 
          sentenceLower.includes(danger.toLowerCase())
        );
        
        // Record character instances
        charactersInSentence.forEach(character => {
          characterMatches.push({
            character,
            sentence: sentenceIndex,
            text: sentence
          });
        });
        
        // Record danger instances
        dangerInSentence.forEach(danger => {
          dangerMatches.push({
            danger,
            sentence: sentenceIndex,
            text: sentence
          });
        });
        
        // Calculate proximity score for this sentence if it contains both characters and dangers
        if (charactersInSentence.length > 0 && dangerInSentence.length > 0) {
          const words = sentence.split(/\s+/).length;
          
          const closenessScore = (words < 10) ? 2.0 : (words < 20) ? 1.0 : 0.5;
          const intensityScore = Math.min(2.0, (charactersInSentence.length + dangerInSentence.length) * 0.5);
          
          const sentenceProximityScore = closenessScore * intensityScore;
          totalProximityScore += sentenceProximityScore;
          
          proximityMatches.push({
            sentence: sentenceIndex,
            characters: charactersInSentence,
            dangers: dangerInSentence,
            text: sentence,
            score: sentenceProximityScore
          });
        }
      });
      
      // Normalize final score to 0-10 range
      const normalizedScore = Math.min(10, (totalProximityScore / Math.max(1, sentences.length)) * 20);
      
      // Update state
      setProximityScore(normalizedScore);
      setCharacterInstances(characterMatches);
      setDangerInstances(dangerMatches);
      setProximityInstances(proximityMatches);
    } catch (error) {
      console.error("Error analyzing character-danger proximity:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Get danger level category
  const getDangerLevel = (score) => {
    if (score >= 7) return "High";
    if (score >= 4) return "Medium";
    return "Low";
  };
  
  // Get color for danger level
  const getDangerColor = (score) => {
    if (score >= 7) return "#d62728"; // Red
    if (score >= 4) return "#ff9800"; // Orange
    return "#2196F3"; // Blue
  };
  
  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>Character-Danger Proximity Analysis</h3>
      
      <div style={styles.customTerms}>
        <div style={styles.customTermsField}>
          <label style={styles.customTermsLabel}>
            Characters to track (comma-separated):
          </label>
          <input
            type="text"
            value={customCharacters}
            onChange={handleCustomCharactersChange}
            placeholder="E.g., protagonist, hero, she, John"
            style={styles.customTermsInput}
          />
        </div>
        
        <div style={styles.customTermsField}>
          <label style={styles.customTermsLabel}>
            Danger terms to track (comma-separated):
          </label>
          <input
            type="text"
            value={customDangers}
            onChange={handleCustomDangersChange}
            placeholder="E.g., danger, knife, blood, monster"
            style={styles.customTermsInput}
          />
        </div>
      </div>
      
      {isAnalyzing ? (
        <div style={styles.analyzing}>Analyzing proximity...</div>
      ) : (
        <>
          <div style={styles.proximityScore}>
            <strong>Danger Proximity Score: {proximityScore.toFixed(1)}/10</strong>
            <div style={styles.dangerLevel}>
              Level: <span style={{ color: getDangerColor(proximityScore) }}>
                {getDangerLevel(proximityScore)}
              </span>
            </div>
            <div style={styles.scoreIndicatorContainer}>
              <div 
                style={{
                  ...styles.scoreIndicator,
                  width: `${proximityScore * 10}%`,
                  backgroundColor: getDangerColor(proximityScore)
                }}
              />
            </div>
          </div>
          
          {proximityInstances.length > 0 ? (
            <div style={styles.proximityInstances}>
              <h4 style={styles.instancesHeading}>Instances of Character-Danger Proximity</h4>
              
              {proximityInstances.map((instance, index) => (
                <div key={index} style={styles.proximityInstance}>
                  <div style={styles.instanceScore}>
                    Score: <strong>{instance.score.toFixed(1)}</strong>
                  </div>
                  <div style={styles.instanceContent}>
                    <p>{instance.text}</p>
                  </div>
                  <div style={styles.instanceDetails}>
                    <div style={styles.instanceCharacters}>
                      <strong>Characters:</strong> {instance.characters.join(', ')}
                    </div>
                    <div style={styles.instanceDangers}>
                      <strong>Dangers:</strong> {instance.dangers.join(', ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.noProximity}>
              <p>No instances of characters near danger detected.</p>
            </div>
          )}
          
          <div style={styles.stats}>
            <div style={styles.statColumn}>
              <h4 style={styles.statHeading}>Character Mentions ({characterInstances.length})</h4>
              {Object.entries(
                characterInstances.reduce((acc, instance) => {
                  acc[instance.character] = (acc[instance.character] || 0) + 1;
                  return acc;
                }, {})
              )
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([character, count], index) => (
                  <div key={index} style={styles.statItem}>
                    <span style={styles.statName}>{character}</span>
                    <span style={styles.statCount}>{count}</span>
                  </div>
                ))}
            </div>
            
            <div style={styles.statColumn}>
              <h4 style={styles.statHeading}>Danger Mentions ({dangerInstances.length})</h4>
              {Object.entries(
                dangerInstances.reduce((acc, instance) => {
                  acc[instance.danger] = (acc[instance.danger] || 0) + 1;
                  return acc;
                }, {})
              )
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([danger, count], index) => (
                  <div key={index} style={styles.statItem}>
                    <span style={styles.statName}>{danger}</span>
                    <span style={styles.statCount}>{count}</span>
                  </div>
                ))}
            </div>
          </div>
        </>
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
  customTerms: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '20px'
  },
  customTermsField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  customTermsLabel: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#555'
  },
  customTermsInput: {
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px'
  },
  analyzing: {
    padding: '20px',
    textAlign: 'center',
    color: '#666',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px'
  },
  proximityScore: {
    margin: '15px 0',
    padding: '15px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
    fontSize: '16px'
  },
  dangerLevel: {
    marginTop: '5px',
    fontSize: '14px'
  },
  scoreIndicatorContainer: {
    width: '100%',
    height: '20px',
    backgroundColor: '#e0e0e0',
    borderRadius: '10px',
    marginTop: '10px',
    overflow: 'hidden'
  },
  scoreIndicator: {
    height: '100%',
    transition: 'width 0.5s ease-in-out'
  },
  proximityInstances: {
    marginTop: '20px'
  },
  instancesHeading: {
    color: '#333',
    marginBottom: '15px'
  },
  proximityInstance: {
    padding: '15px',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
    marginBottom: '10px',
    borderLeft: '4px solid #ff9800'
  },
  instanceScore: {
    marginBottom: '5px',
    fontSize: '14px',
    color: '#555'
  },
  instanceContent: {
    marginBottom: '10px',
    fontSize: '15px'
  },
  instanceDetails: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    fontSize: '13px',
    color: '#666'
  },
  instanceCharacters: {
    padding: '4px 8px',
    backgroundColor: '#e3f2fd',
    borderRadius: '4px'
  },
  instanceDangers: {
    padding: '4px 8px',
    backgroundColor: '#ffebee',
    borderRadius: '4px'
  },
  noProximity: {
    padding: '20px',
    textAlign: 'center',
    color: '#666',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px'
  },
  stats: {
    display: 'flex',
    gap: '20px',
    marginTop: '30px'
  },
  statColumn: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
    padding: '15px'
  },
  statHeading: {
    margin: '0 0 10px 0',
    fontSize: '15px',
    color: '#333'
  },
  statItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '5px 0',
    borderBottom: '1px solid #e0e0e0'
  },
  statName: {
    fontWeight: 'bold'
  },
  statCount: {
    backgroundColor: '#e0e0e0',
    borderRadius: '10px',
    padding: '2px 8px',
    fontSize: '12px'
  }
};

export default CharacterDangerProximityAnalyzer;