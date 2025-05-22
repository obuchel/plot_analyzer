/**
 * LinguisticFeatureAnalyzer - Analyzes linguistic features of text
 */
export const LinguisticFeatureAnalyzer = ({ text }) => {
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
      
      // Simple imperative detection - fallback method if compromise not available
      let imperativeCount = 0;
      
      try {
        // Try to use compromise if available
        if (typeof compromise === 'function') {
          const doc = compromise(textToAnalyze);
          imperativeCount = doc.sentences().filter(s => 
            s.has('#Imperative') || (s.has('#Verb') && !s.has('(I|we|they|he|she|it)'))
          ).length;
        } else {
          // Fallback simple detection
          imperativeCount = sentences.filter(s => {
            const firstWord = s.trim().split(/\s+/)[0].toLowerCase();
            const imperativeVerbs = ['go', 'come', 'look', 'wait', 'stop', 'get', 'make', 'take', 
                                    'run', 'tell', 'listen', 'stand', 'stay', 'move', 'let', 'try'];
            return imperativeVerbs.includes(firstWord);
          }).length;
        }
      } catch (e) {
        console.error("Error with NLP detection:", e);
        // Fallback estimation
        imperativeCount = sentences.filter(s => 
          /^\s*[A-Za-z]+\s/.test(s) && !s.includes('?') && !s.includes('I ')
        ).length * 0.3;
      }
      
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
      
      // Normalize all values to 0-10 scale
      const normalizedFeatures = {
        sentenceLength: Math.min(10, avgSentenceLength / 3),
        clauseComplexity: Math.min(10, clauseComplexity * 3),
        questions: Math.min(10, (questionCount / Math.max(1, sentences.length)) * 20),
        imperatives: Math.min(10, (imperativeCount / Math.max(1, sentences.length)) * 20),
        emphasis: Math.min(10, (emphasisMarkers) / (Math.max(1, sentences.length) / 2)),
        intensifiers: Math.min(10, intensifierCount / (Math.max(1, words.length) / 50) * 2),
        repetition: Math.min(10, repetitionCount * 2),
        rhetorical: Math.min(10, rhetoricalCount)
      };
      
      setFeatures(normalizedFeatures);
    } catch (error) {
      console.error("Error analyzing linguistic features:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  return (
    <div className="linguistic-analyzer">
      <h3>Linguistic Feature Analysis</h3>
      
      {isAnalyzing ? (
        <div className="analyzing-indicator">Analyzing linguistic features...</div>
      ) : features ? (
        <div className="feature-results">
          <div className="feature-bars">
            {Object.entries(features).map(([feature, value]) => (
              <div key={feature} className="feature-bar-container">
                <span className="feature-label">
                  {feature.charAt(0).toUpperCase() + feature.slice(1).replace(/([A-Z])/g, ' $1')}
                </span>
                <div className="bar-container">
                  <div 
                    className="feature-bar" 
                    style={{ 
                      width: `${value * 10}%`, 
                      backgroundColor: `hsl(${Math.floor(value * 36)}, 70%, 50%)`
                    }}
                  />
                </div>
                <span className="feature-value">{value.toFixed(1)}</span>
              </div>
            ))}
          </div>
          
          <div className="feature-explanation">
            <h4>Feature Descriptions</h4>
            <ul>
              <li><strong>Sentence Length</strong> - Average length of sentences; higher values indicate longer, more complex sentences</li>
              <li><strong>Clause Complexity</strong> - Complexity based on commas and conjunctions; higher values indicate more compound/complex sentences</li>
              <li><strong>Questions</strong> - Proportion of sentences that are questions; higher values indicate uncertainty or dialogue</li>
              <li><strong>Imperatives</strong> - Proportion of imperative sentences; higher values indicate commands or instructions</li>
              <li><strong>Emphasis</strong> - Use of emphasis markers and exclamations; higher values indicate emotional intensity</li>
              <li><strong>Intensifiers</strong> - Use of intensifier words; higher values indicate stronger emotional expression</li>
              <li><strong>Repetition</strong> - Repeated words or patterns; higher values indicate stylistic repetition or emphasis</li>
              <li><strong>Rhetorical</strong> - Use of rhetorical devices like hyperbole, simile, and metaphor; higher values indicate more figurative language</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="no-analysis">
          <p>Enter text to analyze linguistic features.</p>
        </div>
      )}
    </div>
  );
};

/**
 * CharacterDangerProximityAnalyzer - Analyzes proximity between characters and danger elements
 */
export const CharacterDangerProximityAnalyzer = ({ text, characters, dangers }) => {
  const [proximityScore, setProximityScore] = useState(0);
  const [characterInstances, setCharacterInstances] = useState([]);
  const [dangerInstances, setDangerInstances] = useState([]);
  const [proximityInstances, setProximityInstances] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Analyze proximity when text, characters, or dangers change
  useEffect(() => {
    if (text && text.trim() && characters && characters.length && dangers && dangers.length) {
      analyzeProximity(text, characters, dangers);
    }
  }, [text, characters, dangers]);
  
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
  
  return (
    <div className="proximity-analyzer">
      <h3>Character-Danger Proximity Analysis</h3>
      
      {isAnalyzing ? (
        <div className="analyzing-indicator">Analyzing proximity...</div>
      ) : (
        <>
          <div className="proximity-score">
            <strong>Proximity Score: {proximityScore.toFixed(1)}</strong>
            <div 
              className="score-indicator"
              style={{
                width: `${proximityScore * 10}%`,
                backgroundColor: proximityScore > 7 ? '#d62728' : 
                                 proximityScore > 4 ? '#ff9800' : '#2196F3'
              }}
            />
          </div>
          
          {proximityInstances.length > 0 ? (
            <div className="proximity-instances">
              <h4>Instances of Character-Danger Proximity</h4>
              
              {proximityInstances.map((instance, index) => (
                <div key={index} className="proximity-instance">
                  <div className="instance-score">
                    Score: {instance.score.toFixed(1)}
                  </div>
                  <div className="instance-content">
                    <p>{instance.text}</p>
                  </div>
                  <div className="instance-details">
                    <div className="instance-characters">
                      <strong>Characters:</strong> {instance.characters.join(', ')}
                    </div>
                    <div className="instance-dangers">
                      <strong>Dangers:</strong> {instance.dangers.join(', ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-proximity">
              <p>No instances of characters near danger detected.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};import React, { useState, useEffect, useRef } from 'react';

/**
 * EmotionAnalyzer - Advanced emotion analysis component with support for ONNX models
 */
export const EmotionAnalyzer = ({ text }) => {
  const [emotions, setEmotions] = useState({});
  const [dominantEmotion, setDominantEmotion] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisMethod, setAnalysisMethod] = useState('keywords');
  const [modelLoaded, setModelLoaded] = useState(false);
  const [vocabLoaded, setVocabLoaded] = useState(false);
  const [neutralWeight, setNeutralWeight] = useState(0.7);
  const [showTokenization, setShowTokenization] = useState(false);
  const [tokenizationInfo, setTokenizationInfo] = useState(null);
  
  // References for model and tokenizer
  const sessionRef = useRef(null);
  const tokenizerRef = useRef(null);
  const vocabMapRef = useRef(null);
  const mergesPairsRef = useRef({});
  
  // Emotion categories and their associated keywords (for keyword-based analysis)
  const emotionKeywords = {
    joy: ['happy', 'joy', 'delighted', 'pleased', 'glad', 'cheerful', 'content', 'satisfied', 'excited', 'thrilled', 'elated', 'jubilant'],
    sadness: ['sad', 'unhappy', 'sorrowful', 'depressed', 'gloomy', 'miserable', 'dejected', 'downcast', 'heartbroken', 'melancholy', 'grief'],
    anger: ['angry', 'furious', 'enraged', 'irate', 'mad', 'annoyed', 'irritated', 'outraged', 'incensed', 'livid', 'indignant', 'resentful'],
    fear: ['afraid', 'scared', 'frightened', 'fearful', 'terrified', 'anxious', 'nervous', 'worried', 'panicked', 'horrified', 'alarmed'],
    surprise: ['surprised', 'astonished', 'amazed', 'shocked', 'startled', 'stunned', 'bewildered', 'dumbfounded', 'flabbergasted'],
    disgust: ['disgusted', 'revolted', 'repulsed', 'sickened', 'appalled', 'nauseated', 'offended', 'repelled', 'loathing'],
    neutral: ['neutral', 'indifferent', 'impartial', 'objective', 'detached', 'dispassionate', 'uninvolved', 'noncommittal']
  /**
 * StorySegmenter - Segments a narrative into functional story parts
 */
export const StorySegmenter = ({ text }) => {
  const [segments, setSegments] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Segment types and their identifying patterns
  const segmentPatterns = {
    introduction: {
      keywords: ['once upon a time', 'in the beginning', 'it all started', 'long ago', 'first', 'initially', 'at first'],
      characterIntro: /(?:named|called)\s+[A-Z][a-z]+/g,
      settingIntro: /(?:in|at)\s+(?:the|a)\s+[a-z]+/gi
    },
    rising_action: {
      keywords: ['suddenly', 'but then', 'however', 'until', 'unexpectedly', 'surprisingly', 'began to'],
      conflict: /(?:conflict|problem|challenge|difficulty|obstacle|trouble|dispute|disagreement)/gi,
      tension: /(?:worried|concerned|anxious|nervous|tense|stressed|afraid|scared)/gi
    },
    climax: {
      keywords: ['finally', 'at last', 'ultimate', 'critical', 'decisive', 'crucial', 'pinnacle', 'culmination'],
      intensity: /(?:shouted|screamed|yelled|cried|exclaimed|exploded|burst|broke|shattered|crashed)/gi,
      action: /(?:fought|battled|confronted|faced|challenged|attacked|defended|struggled)/gi
    },
    falling_action: {
      keywords: ['after that', 'following', 'subsequently', 'next', 'later', 'afterward', 'soon after'],
      resolution: /(?:solved|resolved|settled|fixed|handled|managed|addressed|dealt with)/gi,
      consequence: /(?:result|outcome|effect|consequence|aftermath|impact|reaction)/gi
    },
    conclusion: {
      keywords: ['finally', 'in the end', 'eventually', 'at last', 'ultimately', 'in conclusion', 'lastly'],
      ending: /(?:ended|finished|completed|concluded|closed|final)/gi,
      reflection: /(?:learned|realized|understood|recognized|discovered|found out)/gi
    }
  };
  
  // Analyze segments when text changes
  useEffect(() => {
    if (text && text.trim()) {
      segmentStory(text);
    }
  }, [text]);
  
  // Segment story into functional parts
  const segmentStory = (storyText) => {
    if (!storyText || !storyText.trim()) {
      return;
    }
    
    setIsAnalyzing(true);
    
    try {
      const paragraphs = storyText.split(/\n\n+/).filter(p => p.trim().length > 0);
      
      if (paragraphs.length < 3) {
        // Not enough content to meaningfully segment
        setSegments([{
          type: 'unsegmented',
          score: 10,
          content: storyText,
          position: 0
        }]);
        return;
      }
      
      // Determine the relative position of each paragraph in the narrative
      const detectedSegments = [];
      
      paragraphs.forEach((paragraph, index) => {
        const position = index / (paragraphs.length - 1); // 0 to 1
        const paragraphLower = paragraph.toLowerCase();
        
        // Score each segment type for this paragraph
        const scores = {};
        
        Object.keys(segmentPatterns).forEach(segmentType => {
          let score = 0;
          const patterns = segmentPatterns[segmentType];
          
          // Check for keywords
          patterns.keywords.forEach(keyword => {
            if (paragraphLower.includes(keyword.toLowerCase())) {
              score += 2;
            }
          });
          
          // Check for regex patterns
          Object.keys(patterns).forEach(patternName => {
            if (patternName === 'keywords') return;
            
            const regex = patterns[patternName];
            const matches = paragraphLower.match(regex) || [];
            score += matches.length * 1.5;
          });
          
          // Apply positional bias
          // Introduction likely at the beginning
          if (segmentType === 'introduction' && position < 0.2) {
            score *= 1.5;
          } 
          // Climax likely in the middle to later part
          else if (segmentType === 'climax' && position > 0.5 && position < 0.8) {
            score *= 1.5;
          }
          // Conclusion likely at the end
          else if (segmentType === 'conclusion' && position > 0.8) {
            score *= 1.5;
          }
          // Rising action typically after introduction but before climax
          else if (segmentType === 'rising_action' && position > 0.1 && position < 0.6) {
            score *= 1.2;
          }
          // Falling action typically after climax but before conclusion
          else if (segmentType === 'falling_action' && position > 0.6 && position < 0.9) {
            score *= 1.2;
          }
          
          scores[segmentType] = score;
        });
        
        // Find segment type with highest score
        let highestScore = 0;
        let dominantType = 'undefined';
        
        Object.keys(scores).forEach(segmentType => {
          if (scores[segmentType] > highestScore) {
            highestScore = scores[segmentType];
            dominantType = segmentType;
          }
        });
        
        // Only include if confidence is reasonable
        if (highestScore > 1) {
          detectedSegments.push({
            type: dominantType,
            score: highestScore,
            content: paragraph,
            position: index
          });
        } else {
          // Use position-based fallback
          let fallbackType = 'undefined';
          
          if (position < 0.2) {
            fallbackType = 'introduction';
          } else if (position < 0.4) {
            fallbackType = 'rising_action';
          } else if (position < 0.6) {
            fallbackType = 'climax';
          } else if (position < 0.8) {
            fallbackType = 'falling_action';
          } else {
            fallbackType = 'conclusion';
          }
          
          detectedSegments.push({
            type: fallbackType,
            score: 0.5,
            content: paragraph,
            position: index
          });
        }
      });
      
      // Smooth segments (avoid rapid back-and-forth between segment types)
      const smoothedSegments = [];
      let currentType = null;
      let currentSegment = null;
      
      detectedSegments.forEach((segment, index) => {
        if (currentType === null) {
          // First segment
          currentType = segment.type;
          currentSegment = { ...segment };
        } else if (segment.type === currentType) {
          // Same type, merge content
          currentSegment.content += '\n\n' + segment.content;
          currentSegment.score = Math.max(currentSegment.score, segment.score);
        } else {
          // Different type
          // Check if we should change types or keep the current one
          const isIsolatedChange = (
            (index < detectedSegments.length - 1) && 
            (detectedSegments[index + 1].type === currentType)
          );
          
          if (isIsolatedChange && segment.score < 3) {
            // Don't change for isolated low-confidence segments
            currentSegment.content += '\n\n' + segment.content;
          } else {
            // Add the current segment and start a new one
            smoothedSegments.push(currentSegment);
            currentType = segment.type;
            currentSegment = { ...segment };
          }
        }
      });
      
      // Add the last segment
      if (currentSegment) {
        smoothedSegments.push(currentSegment);
      }
      
      setSegments(smoothedSegments);
    } catch (error) {
      console.error("Error segmenting story:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Segment display names
  const segmentNames = {
    introduction: 'Introduction',
    rising_action: 'Rising Action',
    climax: 'Climax',
    falling_action: 'Falling Action',
    conclusion: 'Conclusion',
    undefined: 'Undefined',
    unsegmented: 'Complete Story'
  };
  
  return (
    <div className="story-segmenter">
      <h3>Story Structure Analysis</h3>
      
      {isAnalyzing ? (
        <div className="analyzing-indicator">Analyzing story structure...</div>
      ) : segments.length > 0 ? (
        <div className="segment-list">
          {segments.map((segment, index) => (
            <div key={index} className="segment" style={{ borderLeftColor: 
              segment.type === 'introduction' ? '#4CAF50' : 
              segment.type === 'rising_action' ? '#FF9800' :
              segment.type === 'climax' ? '#F44336' :
              segment.type === 'falling_action' ? '#2196F3' :
              segment.type === 'conclusion' ? '#9C27B0' : '#BDBDBD'
            }}>
              <div className="segment-header">
                <div className="segment-type">{segmentNames[segment.type]}</div>
                {segment.score > 0.5 && <div className="segment-confidence">Confidence: {segment.score.toFixed(1)}</div>}
              </div>
              <div className="segment-content">
                {segment.content}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-segments">
          <p>Enter a story to analyze its structure.</p>
        </div>
      )}
    </div>
  );
};

  // Emotion colors for visualization
  const emotionColors = {
    joy: '#FFDD00',
    sadness: '#3F51B5',
    anger: '#F44336',
    fear: '#9C27B0',
    surprise: '#00BCD4',
    disgust: '#8BC34A',
    neutral: '#78909C',
    anticipation: '#FF9800',
    trust: '#009688'
  };

  // Labels for model-based analysis
  const emotionLabels = ['anger', 'disgust', 'fear', 'joy', 'neutral', 'sadness', 'surprise'];
  
  // Analyze emotions when text changes
  useEffect(() => {
    if (text && text.trim()) {
      if (analysisMethod === 'keywords' || (analysisMethod === 'model' && modelLoaded && vocabLoaded)) {
        analyzeEmotions(text);
      }
    }
  }, [text, analysisMethod, modelLoaded, vocabLoaded, neutralWeight]);
  
  // Generate BPE merges from vocabulary
  const generateBPEMerges = () => {
    console.log('Generating BPE merges from vocabulary...');
    
    let rank = 0;
    const mergesPairs = {};
    
    // Tokens for BPE merges
    const bpeTokens = [];
    for (const token of Object.keys(vocabMapRef.current)) {
      if (token.startsWith('<') || token.length > 10) continue;
      bpeTokens.push(token);
    }
    
    // Sort tokens by length
    bpeTokens.sort((a, b) => a.length - b.length);
    
    // Define common BPE merges that are likely to exist
    const commonPairs = [
      'r+b', 'W+W', 'V+M', 'G+e', 'P+r', 'S+Y', 
      ' +(', 'B+F', 'f+o', 'G+I', ' +/', 'O+F',
      'G+Y', 'L+M', 'C+I', ')+(', 'K+O'
    ];
    
    // Add common pairs first with highest priority
    for (const pairStr of commonPairs) {
      const [first, second] = pairStr.split('+');
      const pair = first + second;
      mergesPairs[pair] = rank++;
    }
    
    // For each longer token, check if it could be formed by merging shorter tokens
    for (let i = 0; i < bpeTokens.length; i++) {
      const token = bpeTokens[i];
      
      // Skip single character tokens
      if (token.length <= 1) continue;
      
      // Try to find potential merges
      for (let j = 1; j < token.length; j++) {
        const first = token.substring(0, j);
        const second = token.substring(j);
        
        // If both parts are in the vocabulary, this could be a merge
        if (first in vocabMapRef.current && second in vocabMapRef.current) {
          // Check if this pair is already in our merges
          if (!(first + second in mergesPairs)) {
            mergesPairs[first + second] = rank++;
          }
        }
      }
      
      // Limit the number of inferred merges
      if (rank > 1000) break;
    }
    
    mergesPairsRef.current = mergesPairs;
    console.log(`Generated ${Object.keys(mergesPairs).length} BPE merges`);
  };
  
  // Apply BPE to a single word
  const applyBPE = (word) => {
    // If the word is already in vocabulary, return it as a single token
    if (word in vocabMapRef.current) {
      return [word];
    }
    
    // Start with the word split into characters
    let subwords = [...word].map(char => char);
    
    // Apply BPE merges until no more can be applied
    let changes = true;
    while (changes) {
      changes = false;
      
      // Find the highest priority merge
      let bestPair = null;
      let bestRank = Infinity;
      
      // Check each consecutive pair
      for (let i = 0; i < subwords.length - 1; i++) {
        const pair = subwords[i] + subwords[i + 1];
        if (pair in mergesPairsRef.current && mergesPairsRef.current[pair] < bestRank) {
          bestPair = pair;
          bestRank = mergesPairsRef.current[pair];
        }
      }
      
      // Apply the best merge if found
      if (bestPair !== null) {
        // Create a new array with merges applied
        const newSubwords = [];
        let i = 0;
        while (i < subwords.length) {
          if (i < subwords.length - 1 && subwords[i] + subwords[i + 1] === bestPair) {
            newSubwords.push(bestPair);
            i += 2;
          } else {
            newSubwords.push(subwords[i]);
            i += 1;
          }
        }
        subwords = newSubwords;
        changes = true;
      }
    }
    
    // Convert subwords to tokens
    const tokens = [];
    for (const subword of subwords) {
      if (subword in vocabMapRef.current) {
        tokens.push(subword);
      } else {
        // Unknown token handling - check character by character
        let charTokenized = false;
        for (const char of subword) {
          if (char in vocabMapRef.current) {
            tokens.push(char);
            charTokenized = true;
          }
        }
        // If characters not found, use unknown token
        if (!charTokenized) {
          tokens.push('<unk>');
        }
      }
    }
    
    return tokens;
  };
  
  // Python-compatible tokenization
  const tokenizePythonCompatible = (text) => {
    console.log(`Tokenizing with Python-compatible method: "${text}"`);
    
    // Preprocess text (RoBERTa adds a space at the beginning)
    let processedText = " " + text.trim();
    
    // Split into characters
    const chars = [...processedText];
    
    // Apply BPE using the vocabulary
    let tokens = [];
    let word = '';
    
    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      
      // Handle space token the RoBERTa way
      if (char === ' ') {
        if (word.length > 0) {
          const wordTokens = applyBPE(word);
          tokens.push(...wordTokens);
          word = '';
        }
        word = 'Ġ'; // Special RoBERTa space token
      } else {
        word += char;
      }
    }
    
    // Process the last word if any
    if (word.length > 0) {
      const wordTokens = applyBPE(word);
      tokens.push(...wordTokens);
    }
    
    return tokens;
  };
  
  // Create tokenizer
  const createTokenizer = () => {
    return {
      // Token IDs (RoBERTa standard)
      bos_token_id: 0,  // <s>
      eos_token_id: 2,  // </s>
      pad_token_id: 1,  // <pad>
      unk_token_id: 3,  // <unk>
      
      // Tokenize text
      tokenize: function(text) {
        // Get tokens using RoBERTa-like tokenization
        const tokens = tokenizePythonCompatible(text);
        
        // Convert tokens to token IDs
        const tokenIds = [];
        for (const token of tokens) {
          if (token in vocabMapRef.current) {
            tokenIds.push(vocabMapRef.current[token]);
          } else {
            tokenIds.push(this.unk_token_id);
            console.log(`Unknown token: "${token}"`);
          }
        }
        
        // Show tokenization if requested
        if (showTokenization) {
          setTokenizationInfo({
            tokens: tokens,
            tokenIds: tokenIds
          });
        } else {
          setTokenizationInfo(null);
        }
        
        return tokenIds;
      },
      
      // Encode text to model input format
      encode: function(text) {
        const tokenIds = this.tokenize(text);
        const maxLength = 128;
        
        // Add special tokens
        let inputIds = [this.bos_token_id, ...tokenIds, this.eos_token_id];
        let attentionMask = Array(inputIds.length).fill(1);
        
        // If longer than max_length, truncate
        if (inputIds.length > maxLength) {
          inputIds = inputIds.slice(0, maxLength);
          attentionMask = attentionMask.slice(0, maxLength);
        } 
        // If shorter than max_length, pad
        else if (inputIds.length < maxLength) {
          const padLength = maxLength - inputIds.length;
          inputIds = [...inputIds, ...Array(padLength).fill(this.pad_token_id)];
          attentionMask = [...attentionMask, ...Array(padLength).fill(0)];
        }
        
        return {
          inputIds: inputIds,
          attentionMask: attentionMask
        };
      }
    };
  };
  
  // Softmax function (PyTorch-like)
  const softmax = (logits) => {
    const maxLogit = Math.max(...logits);
    const expValues = logits.map(value => Math.exp(value - maxLogit));
    const sumExp = expValues.reduce((sum, value) => sum + value, 0);
    return expValues.map(value => value / sumExp);
  };
  
  // Load vocabulary file
  const handleVocabUpload = async (file) => {
    try {
      if (!file) return;
      
      console.log(`Loading vocabulary file: ${file.name}`);
      setIsAnalyzing(true);
      
      const text = await file.text();
      vocabMapRef.current = JSON.parse(text);
      
      console.log(`Loaded vocabulary with ${Object.keys(vocabMapRef.current).length} tokens`);
      
      // Generate BPE merges
      generateBPEMerges();
      
      // Create tokenizer
      tokenizerRef.current = createTokenizer();
      setVocabLoaded(true);
      
    } catch (error) {
      console.error(`Error loading vocabulary: ${error.message}`);
      alert(`Error loading vocabulary: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Load model file
  const handleModelUpload = async (file) => {
    try {
      if (!file) return;
      
      console.log(`Loading model file: ${file.name}`);
      setIsAnalyzing(true);
      
      // Check if ONNX runtime is available
      if (typeof ort === 'undefined') {
        throw new Error('ONNX Runtime is not available. Make sure to include it in your HTML.');
      }
      
      const arrayBuffer = await file.arrayBuffer();
      
      try {
        sessionRef.current = await ort.InferenceSession.create(arrayBuffer);
      } catch (err) {
        console.log(`Basic settings failed: ${err.message}. Trying wasm backend...`);
        sessionRef.current = await ort.InferenceSession.create(arrayBuffer, {
          executionProviders: ['wasm']
        });
      }
      
      console.log('ONNX model loaded successfully');
      console.log(`Model inputs: ${sessionRef.current.inputNames.join(', ')}`);
      console.log(`Model outputs: ${sessionRef.current.outputNames.join(', ')}`);
      
      setModelLoaded(true);
      
    } catch (error) {
      console.error(`Error loading model: ${error.message}`);
      alert(`Error loading model: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Analyze emotions using keywords method
  const analyzeEmotionsWithKeywords = (textToAnalyze) => {
    try {
      const textLower = textToAnalyze.toLowerCase();
      const wordCount = textToAnalyze.split(/\s+/).filter(w => w.trim().length > 0).length;
      const emotionScores = {};
      let maxScore = 0;
      let maxEmotion = null;
      
      // Calculate raw emotion scores based on keyword occurrences
      Object.keys(emotionKeywords).forEach(emotion => {
        let score = 0;
        
        emotionKeywords[emotion].forEach(keyword => {
          const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
          const matches = textLower.match(regex);
          if (matches) {
            score += matches.length;
          }
        });
        
        // Add other emotional indicators
        if (emotion === 'joy') {
          score += (textLower.match(/\b(laugh|smile|happy|yay|hurray)\b/gi) || []).length * 1.5;
          score += (textLower.match(/[!]+/g) || []).length * 0.3;
        } else if (emotion === 'anger') {
          score += (textLower.match(/\b(hate|damn|kill|destroy|fight)\b/gi) || []).length * 1.5;
          score += (textLower.match(/[!]+/g) || []).length * 0.2;
        } else if (emotion === 'fear') {
          score += (textLower.match(/\b(threat|danger|scared|escape|hide)\b/gi) || []).length * 1.5;
        } else if (emotion === 'sadness') {
          score += (textLower.match(/\b(cry|tears|weep|lost|alone|lonely)\b/gi) || []).length * 1.5;
        }
        
        // Normalize score by text length
        const normalizedScore = Math.min(10, (score / Math.max(1, wordCount)) * 100);
        emotionScores[emotion] = normalizedScore;
        
        // Track dominant emotion
        if (normalizedScore > maxScore) {
          maxScore = normalizedScore;
          maxEmotion = emotion;
        }
      });
      
      // If no strong emotions detected, set as neutral
      if (maxScore < 0.5) {
        maxEmotion = 'neutral';
        emotionScores.neutral = Math.max(1, emotionScores.neutral || 0);
      }
      
      setEmotions(emotionScores);
      setDominantEmotion(maxEmotion);
      
    } catch (error) {
      console.error("Error analyzing emotions with keywords:", error);
    }
  };
  
  // Analyze emotions using model method
  const analyzeEmotionsWithModel = async (textToAnalyze) => {
    try {
      if (!sessionRef.current || !tokenizerRef.current) {
        console.error("Model or tokenizer not loaded");
        return;
      }
      
      // Tokenize text
      const encoded = tokenizerRef.current.encode(textToAnalyze);
      
      // Create tensors
      const inputIdsTensor = new ort.Tensor('int64', new BigInt64Array(encoded.inputIds.map(n => BigInt(n))), [1, encoded.inputIds.length]);
      const attentionMaskTensor = new ort.Tensor('int64', new BigInt64Array(encoded.attentionMask.map(n => BigInt(n))), [1, encoded.attentionMask.length]);
      
      // Set up model inputs
      const feeds = {};
      if (sessionRef.current.inputNames.includes('input_ids')) {
        feeds['input_ids'] = inputIdsTensor;
      }
      if (sessionRef.current.inputNames.includes('attention_mask')) {
        feeds['attention_mask'] = attentionMaskTensor;
      }
      
      // If different input names are used, try to adapt
      if (Object.keys(feeds).length === 0) {
        if (sessionRef.current.inputNames.length >= 2) {
          feeds[sessionRef.current.inputNames[0]] = inputIdsTensor;
          feeds[sessionRef.current.inputNames[1]] = attentionMaskTensor;
        } else {
          feeds[sessionRef.current.inputNames[0]] = inputIdsTensor;
        }
      }
      
      // Run inference
      console.log('Running model inference...');
      const results = await sessionRef.current.run(feeds);
      
      // Get output tensor
      let outputTensor;
      if (results.logits) {
        outputTensor = results.logits;
      } else if (results.output) {
        outputTensor = results.output;
      } else if (results[sessionRef.current.outputNames[0]]) {
        outputTensor = results[sessionRef.current.outputNames[0]];
      } else {
        outputTensor = Object.values(results)[0];
      }
      
      // Extract logits
      const logits = Array.from(outputTensor.data);
      console.log(`Raw logits: [${logits.slice(0, emotionLabels.length).map(l => l.toFixed(3)).join(', ')}]`);
      
      // Apply neutral weight
      const weightedLogits = [...logits];
      
      const neutralIndex = emotionLabels.indexOf('neutral');
      if (neutralIndex >= 0) {
        weightedLogits[neutralIndex] *= neutralWeight;
        console.log(`Applied neutral weight ${neutralWeight} (before: ${logits[neutralIndex].toFixed(3)}, after: ${weightedLogits[neutralIndex].toFixed(3)})`);
      }
      
      // Convert to probabilities
      const probabilities = softmax(weightedLogits.slice(0, emotionLabels.length));
      
      // Get predicted emotion
      const predictedIndex = probabilities.indexOf(Math.max(...probabilities));
      const predictedEmotion = emotionLabels[predictedIndex];
      
      // Format results in the same structure as keyword-based analysis
      const emotionScores = {};
      emotionLabels.forEach((label, index) => {
        emotionScores[label] = probabilities[index] * 10;
      });
      
      setEmotions(emotionScores);
      setDominantEmotion(predictedEmotion);
      
    } catch (error) {
      console.error("Error analyzing emotions with model:", error);
    }
  };
  
  // Analyze emotional content of text
  const analyzeEmotions = (textToAnalyze) => {
    if (!textToAnalyze || !textToAnalyze.trim()) {
      return;
    }
    
    setIsAnalyzing(true);
    
    try {
      if (analysisMethod === 'keywords') {
        analyzeEmotionsWithKeywords(textToAnalyze);
      } else if (analysisMethod === 'model' && modelLoaded && vocabLoaded) {
        analyzeEmotionsWithModel(textToAnalyze);
      }
    } catch (error) {
      console.error("Error analyzing emotions:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  return (
    <div className="emotion-analyzer">
      <h3>Emotion Analysis</h3>
      
      <div className="analysis-method-toggle">
        <label>
          <input 
            type="radio" 
            value="keywords" 
            checked={analysisMethod === 'keywords'} 
            onChange={() => setAnalysisMethod('keywords')} 
          /> 
          Keyword-based Analysis
        </label>
        <label>
          <input 
            type="radio" 
            value="model" 
            checked={analysisMethod === 'model'} 
            onChange={() => setAnalysisMethod('model')} 
          /> 
          Model-based Analysis (ONNX)
        </label>
      </div>
      
      {analysisMethod === 'model' && (
        <div className="model-settings">
          <div className="file-inputs">
            <div>
              <label htmlFor="vocab-file">Vocabulary File (JSON):</label>
              <input 
                type="file" 
                id="vocab-file" 
                accept=".json"
                onChange={(e) => handleVocabUpload(e.target.files[0])} 
              />
              <div>{vocabLoaded ? 'Vocabulary loaded' : 'Not loaded'}</div>
            </div>
            
            <div>
              <label htmlFor="model-file">Model File (ONNX):</label>
              <input 
                type="file" 
                id="model-file" 
                accept=".onnx"
                onChange={(e) => handleModelUpload(e.target.files[0])} 
              />
              <div>{modelLoaded ? 'Model loaded' : 'Not loaded'}</div>
            </div>
          </div>
          
          <div className="model-options">
            <div>
              <label>
                <input 
                  type="checkbox" 
                  checked={showTokenization}
                  onChange={(e) => setShowTokenization(e.target.checked)} 
                /> 
                Show tokenization details
              </label>
            </div>
            
            <div className="neutral-weight">
              <label htmlFor="neutral-weight">Neutral weight:</label>
              <input 
                type="range" 
                id="neutral-weight" 
                min="0.1" 
                max="1.5" 
                step="0.1" 
                value={neutralWeight}
                onChange={(e) => setNeutralWeight(parseFloat(e.target.value))} 
              />
              <span>{neutralWeight}</span>
            </div>
          </div>
          
          {showTokenization && tokenizationInfo && (
            <div className="token-display">
              <div><strong>Tokens:</strong> {tokenizationInfo.tokens.join(', ')}</div>
              <div><strong>Token IDs:</strong> {tokenizationInfo.tokenIds.join(', ')}</div>
            </div>
          )}
        </div>
      )}
      
      {isAnalyzing ? (
        <div className="analyzing-indicator">Analyzing emotions...</div>
      ) : Object.keys(emotions).length > 0 ? (
        <>
          <div className="dominant-emotion">
            <h4>Dominant Emotion: <span style={{ color: emotionColors[dominantEmotion] }}>{dominantEmotion}</span></h4>
          </div>
          
          <div className="emotion-bars">
            {Object.entries(emotions).map(([emotion, value]) => (
              <div key={emotion} className="emotion-bar-container">
                <span className="emotion-label">{emotion.charAt(0).toUpperCase() + emotion.slice(1)}</span>
                <div className="bar-container">
                  <div 
                    className="emotion-bar" 
                    style={{ 
                      width: `${value * 10}%`, 
                      backgroundColor: emotionColors[emotion] 
                    }}
                  />
                </div>
                <span className="emotion-value">{value.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="no-emotions">
          <p>Enter text to analyze emotional content.</p>
        </div>
      )}
    </div>
  );
};

/**
 * NarrativeTensionVisualizer - Visualizes narrative tension in text
 */
export const NarrativeTensionVisualizer = ({ text }) => {
  const [tensionPoints, setTensionPoints] = useState([]);
  const [peakTension, setPeakTension] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Analyze tension when text changes
  useEffect(() => {
    if (text && text.trim()) {
      analyzeTension(text);
    }
  }, [text]);
  
  // Tension indicators
  const tensionKeywords = {
    high: [
      'danger', 'threat', 'crisis', 'urgent', 'critical', 'disaster', 'emergency', 'panic',
      'fear', 'terrified', 'dread', 'horror', 'terror', 'afraid', 'scared', 'frightened',
      'fight', 'battle', 'war', 'attack', 'defend', 'struggle', 'conflict', 'confrontation',
      'deadline', 'ultimatum', 'time', 'running out', 'final', 'last chance', 'too late',
      'life', 'death', 'kill', 'die', 'survive', 'escape', 'trapped', 'cornered',
      'betray', 'deceive', 'lie', 'secret', 'reveal', 'discover', 'uncover', 'truth',
      'scream', 'shout', 'cry', 'tears', 'sob', 'wail', 'yell', 'desperate'
    ],
    medium: [
      'worry', 'concern', 'trouble', 'problem', 'issue', 'difficult', 'challenge', 'obstacle',
      'uncertain', 'unsure', 'hesitate', 'doubt', 'question', 'wonder', 'confused', 'puzzled',
      'argue', 'disagree', 'dispute', 'debate', 'discuss', 'negotiate', 'compromise',
      'hurry', 'rush', 'quick', 'fast', 'speed', 'race', 'chase', 'pursue',
      'risk', 'gamble', 'chance', 'bet', 'wager', 'stake', 'opportunity', 'possibility',
      'warn', 'caution', 'alert', 'notice', 'attention', 'aware', 'conscious', 'mindful',
      'surprise', 'shock', 'startle', 'astonish', 'amaze', 'unexpected', 'unforeseen'
    ]
  };
  
  // Analyze narrative tension in text
  const analyzeTension = (textToAnalyze) => {
    if (!textToAnalyze || !textToAnalyze.trim()) {
      return;
    }
    
    setIsAnalyzing(true);
    
    try {
      const paragraphs = textToAnalyze.split(/\n\n+/).filter(p => p.trim().length > 0);
      const tensionData = [];
      let maxTension = 0;
      
      // Analyze tension by paragraph
      paragraphs.forEach((paragraph, index) => {
        const paragraphLower = paragraph.toLowerCase();
        
        // Calculate base tension score
        let tensionScore = 0;
        
        // Check for high-tension keywords
        tensionKeywords.high.forEach(keyword => {
          const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
          const matches = paragraphLower.match(regex);
          if (matches) {
            tensionScore += matches.length * 2;
          }
        });
        
        // Check for medium-tension keywords
        tensionKeywords.medium.forEach(keyword => {
          const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
          const matches = paragraphLower.match(regex);
          if (matches) {
            tensionScore += matches.length;
          }
        });
        
        // Additional tension indicators
        
        // Exclamation marks
        const exclamations = (paragraph.match(/!/g) || []).length;
        tensionScore += exclamations * 1.5;
        
        // Question marks (uncertainty)
        const questions = (paragraph.match(/\?/g) || []).length;
        tensionScore += questions * 0.7;
        
        // Short sentences (often used in tense moments)
        const sentences = paragraph.split(/[.!?]+/).filter(s => s.trim());
        const shortSentences = sentences.filter(s => s.split(/\s+/).length < 8).length;
        tensionScore += shortSentences * 0.5;
        
        // Normalize to 0-10 scale
        const paragraphLength = paragraph.split(/\s+/).length;
        const normalizedScore = Math.min(10, (tensionScore / Math.max(1, paragraphLength)) * 20);
        
        // Adjust tension curve
        let adjustedScore = normalizedScore;
        
        // Basic narrative arc adjustment
        const position = index / Math.max(1, paragraphs.length - 1);
        
        if (position > 0.7 && position < 0.9) {
          // Climax area - boost tension
          adjustedScore *= 1.2;
        } else if (position < 0.2) {
          // Introduction - slightly lower tension
          adjustedScore *= 0.9;
        }
        
        adjustedScore = Math.min(10, adjustedScore);
        
        // Update max tension
        if (adjustedScore > maxTension) {
          maxTension = adjustedScore;
        }
        
        // Add to tension data
        tensionData.push({
          position: index,
          score: adjustedScore,
          paragraph: paragraph.length > 100 ? paragraph.substring(0, 100) + '...' : paragraph
        });
      });
      
      setTensionPoints(tensionData);
      setPeakTension(maxTension);
    } catch (error) {
      console.error("Error analyzing narrative tension:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  return (
    <div className="tension-visualizer">
      <h3>Narrative Tension Analysis</h3>
      
      {isAnalyzing ? (
        <div className="analyzing-indicator">Analyzing narrative tension...</div>
      ) : tensionPoints.length > 0 ? (
        <>
          <div className="peak-tension">
            <h4>Peak Tension: {peakTension.toFixed(1)}/10</h4>
          </div>
          
          <div className="tension-chart">
            <div className="chart-y-axis">
              <div className="y-label">Tension</div>
              <div className="y-ticks">
                <div className="y-tick">10</div>
                <div className="y-tick">5</div>
                <div className="y-tick">0</div>
              </div>
            </div>
            
            <div className="chart-content">
              {tensionPoints.map((point, i) => (
                <div 
                  key={i} 
                  className="tension-point"
                  style={{
                    left: `${(i / (tensionPoints.length - 1)) * 100}%`,
                    bottom: `${point.score * 10}%`,
                    backgroundColor: `hsl(${Math.max(0, 120 - (point.score * 12))}, 100%, 50%)`
                  }}
                  title={point.paragraph}
                />
              ))}
              
              <div className="tension-line">
                {tensionPoints.map((point, i) => (
                  <React.Fragment key={i}>
                    {i < tensionPoints.length - 1 && (
                      <div 
                        className="line-segment"
                        style={{
                          left: `${(i / (tensionPoints.length - 1)) * 100}%`,
                          width: `${(1 / (tensionPoints.length - 1)) * 100}%`,
                          bottom: `${point.score * 10}%`,
                          height: `${Math.abs((tensionPoints[i+1].score - point.score) * 10)}%`,
                          transform: tensionPoints[i+1].score > point.score ? 'none' : 'scaleY(-1)',
                          transformOrigin: 'bottom',
                          backgroundColor: `hsl(${Math.max(0, 120 - ((point.score + tensionPoints[i+1].score) * 6))}, 100%, 50%)`
                        }}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
            
            <div className="chart-x-axis">
              <div className="x-label">Narrative Progress</div>
              <div className="x-ticks">
                <div className="x-tick">Beginning</div>
                <div className="x-tick">Middle</div>
                <div className="x-tick">End</div>
              </div>
            </div>
          </div>
          
          <div className="tension-details">
            <h4>Tension Points</h4>
            {tensionPoints.map((point, i) => (
              <div key={i} className="tension-point-detail">
                <div className="point-position">Point {i+1}</div>
                <div className="point-score">Tension: {point.score.toFixed(1)}</div>
                <div className="point-text">{point.paragraph}</div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="no-tension">
          <p>Enter text to analyze narrative tension.</p>
        </div>
      )}
    </div>
  );
};