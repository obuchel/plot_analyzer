import React, { useState, useEffect } from 'react';

/**
 * StorySegmenter - Segments a narrative into functional story parts
 */
const StorySegmenter = ({ text, onSegmentationComplete }) => {
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
        const singleSegment = [{
          type: 'unsegmented',
          score: 10,
          content: storyText,
          position: 0
        }];
        setSegments(singleSegment);
        
        if (onSegmentationComplete) {
          // Prepare emotion analysis (simplified)
          const emotionAnalysis = [{ 
            emotions: { neutral: 5 },
            tension: 3,
            dominantEmotion: 'neutral'
          }];
          
          onSegmentationComplete({
            segments: [storyText],
            emotionAnalysis
          });
        }
        
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
      
      // If callback provided, prepare and send the results
      if (onSegmentationComplete) {
        // Simplified emotion analysis for each segment
        const emotionAnalysis = smoothedSegments.map(segment => {
          // Calculate simplified emotional profile based on segment type
          const emotions = {};
          let dominantEmotion = 'neutral';
          let tensionScore = 5;
          
          switch (segment.type) {
            case 'introduction':
              emotions.curiosity = 7;
              emotions.neutral = 6;
              emotions.joy = 4;
              dominantEmotion = 'curiosity';
              tensionScore = 3;
              break;
            case 'rising_action':
              emotions.tension = 7;
              emotions.fear = 5;
              emotions.anticipation = 6;
              dominantEmotion = 'tension';
              tensionScore = 6;
              break;
            case 'climax':
              emotions.fear = 8;
              emotions.tension = 9;
              emotions.surprise = 7;
              dominantEmotion = 'tension';
              tensionScore = 9;
              break;
            case 'falling_action':
              emotions.relief = 6;
              emotions.sadness = 5;
              emotions.surprise = 4;
              dominantEmotion = 'relief';
              tensionScore = 4;
              break;
            case 'conclusion':
              emotions.joy = 6;
              emotions.relief = 7;
              emotions.neutral = 5;
              dominantEmotion = 'relief';
              tensionScore = 2;
              break;
            default:
              emotions.neutral = 7;
              tensionScore = 3;
          }
          
          return {
            emotions,
            tension: tensionScore,
            dominantEmotion
          };
        });
        
        onSegmentationComplete({
          segments: smoothedSegments.map(s => s.content),
          emotionAnalysis
        });
      }
      
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
  
  // Segment colors
  const segmentColors = {
    introduction: '#4CAF50',    // Green
    rising_action: '#FF9800',   // Orange
    climax: '#F44336',          // Red
    falling_action: '#2196F3',  // Blue
    conclusion: '#9C27B0',      // Purple
    undefined: '#BDBDBD',       // Gray
    unsegmented: '#607D8B'      // Blue-gray
  };
  
  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>Story Structure Analysis</h3>
      
      {isAnalyzing ? (
        <div style={styles.analyzing}>Analyzing story structure...</div>
      ) : segments.length > 0 ? (
        <div style={styles.segmentList}>
          {segments.map((segment, index) => (
            <div 
              key={index} 
              style={{
                ...styles.segment,
                borderLeftColor: segmentColors[segment.type]
              }}
            >
              <div style={styles.segmentHeader}>
                <div style={styles.segmentType}>{segmentNames[segment.type]}</div>
                {segment.score > 0.5 && (
                  <div style={styles.segmentConfidence}>
                    Confidence: {segment.score.toFixed(1)}
                  </div>
                )}
              </div>
              <div style={styles.segmentContent}>
                {segment.content}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.noSegments}>
          <p>Enter a story to analyze its structure.</p>
        </div>
      )}
      
      {segments.length > 0 && (
        <div style={styles.storyArc}>
          <h4 style={styles.arcHeading}>Story Arc Visualization</h4>
          <div style={styles.arcContainer}>
            {segments.map((segment, index) => (
              <div 
                key={index}
                style={{
                  ...styles.arcSegment,
                  width: `${100 / segments.length}%`,
                  backgroundColor: segmentColors[segment.type]
                }}
              >
                <div style={styles.arcLabel}>{segmentNames[segment.type]}</div>
                <div style={styles.arcPosition}>
                  {index + 1}/{segments.length}
                </div>
              </div>
            ))}
          </div>
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
  segmentList: {
    marginTop: '20px'
  },
  segment: {
    padding: '15px',
    marginBottom: '15px',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
    borderLeft: '5px solid #ccc'
  },
  segmentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px'
  },
  segmentType: {
    fontWeight: 'bold',
    color: '#333'
  },
  segmentConfidence: {
    fontSize: '14px',
    color: '#666'
  },
  segmentContent: {
    fontSize: '14px',
    lineHeight: '1.5',
    color: '#333'
  },
  noSegments: {
    padding: '30px',
    textAlign: 'center',
    color: '#666',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px'
  },
  storyArc: {
    marginTop: '30px',
    padding: '15px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px'
  },
  arcHeading: {
    marginTop: '0',
    marginBottom: '15px',
    color: '#333',
    textAlign: 'center'
  },
  arcContainer: {
    display: 'flex',
    height: '80px',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  arcSegment: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#fff',
    position: 'relative',
    textAlign: 'center'
  },
  arcLabel: {
    fontSize: '12px',
    fontWeight: 'bold',
    textShadow: '1px 1px 1px rgba(0,0,0,0.3)'
  },
  arcPosition: {
    fontSize: '10px',
    marginTop: '5px',
    opacity: '0.8'
  }
};

export default StorySegmenter;