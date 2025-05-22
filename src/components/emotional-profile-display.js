import React from 'react';
import { EMOTION_COLORS, EMOTION_LABELS } from './EmotionAnalyzer';

const EmotionalProfileDisplay = ({ data }) => {
  // For debugging
  console.log("Emotion data received:", JSON.stringify(data));
  console.log("Emotion data received:", data);
  // Format percentage for display
  const formatPercentage = (value) => {
    // Ensure value is a number and between 0-1
    let numValue = Number(value);
    if (isNaN(numValue)) numValue = 0;
    return `${(numValue * 100).toFixed(1)}%`;
  };
  
  // Handle scenario where data hasn't loaded yet
  if (!data) {
    return (
      <div className="emotion-profile-loading">
        <p>No emotional data available</p>
      </div>
    );
  }
  
  // Get the dominant emotion from the data
  // First check if we have data.overall structure from the unified input
  const dominantEmotion = 
    (data.overall && data.overall.dominant) ? 
      data.overall.dominant : 
      // Then check if we have data.emotions array from direct analysis
      (data.emotions && data.emotions.length > 0) ? 
        data.emotions[0].label : 
        // Then check if we have direct data.predictedEmotion from ONNX model
        data.predictedEmotion || 
        // Finally check the first key in the data if it's an object of scores
        (typeof data === 'object' && Object.keys(data).length > 0) ?
          Object.keys(data)[0] :
          // Default to neutral if nothing found
          'neutral';
  
  // Get dominant probability
  const dominantProbability = 
    (data.overall && data.overall.probability) ? 
      data.overall.probability : 
      (data.emotions && data.emotions.length > 0) ? 
        data.emotions[0].probability || data.emotions[0].prob : 
        data.probability || 
        (typeof data === 'object' && dominantEmotion in data) ?
          data[dominantEmotion] : 
          0;
  
  // Get all emotions to display
  // Try different potential data structures
  let emotionsToDisplay = [];
  
  if (data.overall && data.overall.emotions) {
    // Data from unified-text-input structure
    emotionsToDisplay = data.overall.emotions;
  } else if (data.emotions) {
    // Direct analysis structure
    emotionsToDisplay = data.emotions;
  } else if (typeof data === 'object' && !Array.isArray(data)) {
    // Simple object of emotion scores
    emotionsToDisplay = Object.entries(data)
      .filter(([key]) => typeof data[key] === 'number')
      .map(([label, value]) => ({
        label,
        probability: value,
        prob: value // Support both formats
      }))
      .sort((a, b) => b.probability - a.probability);
  } else {
    // Default empty set matching expected format
    emotionsToDisplay = EMOTION_LABELS.map(label => ({
      label,
      probability: 0,
      prob: 0
    }));
  }

  return (
    <div className="emotion-profile-container">
      <div className="emotion-summary">
        <div 
          className="dominant-emotion"
          style={{
            backgroundColor: EMOTION_COLORS[dominantEmotion] || '#78909c',
            color: ['joy', 'neutral'].includes(dominantEmotion) ? '#333' : '#fff'
          }}
        >
          <h4>Dominant Emotion</h4>
          <div className="emotion-value">{dominantEmotion}</div>
          <div className="emotion-probability">
            {formatPercentage(dominantProbability)}
          </div>
        </div>
        
        <div className="emotion-distribution">
          <h4>Emotional Profile</h4>
          {emotionsToDisplay.map((emotion) => (
            <div key={emotion.label} className="emotion-bar-container">
              <div className="emotion-label">{emotion.label}</div>
              <div className="emotion-bar-wrapper">
                <div 
                  className="emotion-bar"
                  style={{
                    width: `${Math.max((emotion.prob || emotion.probability || 0) * 100, 1)}%`,
                    backgroundColor: EMOTION_COLORS[emotion.label] || '#78909c'
                  }}
                ></div>
              </div>
              <div className="emotion-value">
                {formatPercentage(emotion.prob || emotion.probability || 0)}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {data.segments && data.segments.length > 0 && (
        <div className="emotion-segments">
          <h4>Emotional Segments</h4>
          <div className="segments-timeline">
            {data.segments.map((segment, index) => (
              <div 
                key={index}
                className="segment"
                style={{
                  width: `${segment.percentage}%`,
                  backgroundColor: EMOTION_COLORS[segment.dominantEmotion] || '#78909c'
                }}
                title={`${segment.dominantEmotion} (${formatPercentage(segment.score)})`}
              >
                <span className="segment-label">{segment.dominantEmotion}</span>
              </div>
            ))}
          </div>
          <div className="segment-list">
            {data.segments.map((segment, index) => (
              <div key={index} className="segment-item">
                <div 
                  className="segment-color"
                  style={{
                    backgroundColor: EMOTION_COLORS[segment.dominantEmotion] || '#78909c'
                  }}
                ></div>
                <div className="segment-info">
                  <div className="segment-title">
                    Segment {index + 1}: {segment.dominantEmotion}
                  </div>
                  <div className="segment-excerpt">
                    {segment.text?.substring(0, 100)}
                    {segment.text?.length > 100 ? '...' : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {data.paragraphs && data.paragraphs.length > 0 && (
        <div className="paragraph-emotions">
          <h4>Paragraph Analysis</h4>
          <div className="paragraphs-list">
            {data.paragraphs.slice(0, 5).map((paragraph, index) => (
              <div key={index} className="paragraph-item">
                <div 
                  className="paragraph-emotion"
                  style={{
                    backgroundColor: EMOTION_COLORS[paragraph.dominant] || '#78909c',
                    color: ['joy', 'neutral'].includes(paragraph.dominant) ? '#333' : '#fff'
                  }}
                >
                  {paragraph.dominant}
                </div>
                <div className="paragraph-text">
                  {paragraph.text.substring(0, 100)}
                  {paragraph.text.length > 100 ? '...' : ''}
                </div>
              </div>
            ))}
            {data.paragraphs.length > 5 && (
              <div className="more-paragraphs">
                + {data.paragraphs.length - 5} more paragraphs analyzed
              </div>
            )}
          </div>
        </div>
      )}
      
      <style jsx>{`
        .emotion-profile-container {
          padding: 1rem;
          background-color: #f5f5f5;
          border-radius: 8px;
          margin-bottom: 2rem;
        }
        
        .emotion-summary {
          display: flex;
          flex-wrap: wrap;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }
        
        .dominant-emotion {
          padding: 1.5rem;
          border-radius: 8px;
          text-align: center;
          min-width: 150px;
        }
        
        .dominant-emotion h4 {
          margin-top: 0;
          margin-bottom: 0.5rem;
        }
        
        .emotion-value {
          font-size: 1.5rem;
          font-weight: bold;
          text-transform: capitalize;
          margin-bottom: 0.25rem;
        }
        
        .emotion-probability {
          font-size: 1.1rem;
        }
        
        .emotion-distribution {
          flex: 1;
          min-width: 300px;
        }
        
        .emotion-distribution h4 {
          margin-top: 0;
          margin-bottom: 1rem;
        }
        
        .emotion-bar-container {
          display: flex;
          align-items: center;
          margin-bottom: 0.75rem;
        }
        
        .emotion-label {
          width: 80px;
          text-transform: capitalize;
        }
        
        .emotion-bar-wrapper {
          flex: 1;
          height: 12px;
          background-color: #e0e0e0;
          border-radius: 6px;
          overflow: hidden;
          margin: 0 0.75rem;
        }
        
        .emotion-bar {
          height: 100%;
          min-width: 2px;
          border-radius: 6px;
          transition: width 0.5s ease;
        }
        
        .emotion-value {
          width: 60px;
          text-align: right;
          font-size: 0.9rem;
        }
        
        .emotion-segments {
          margin-top: 2rem;
        }
        
        .segments-timeline {
          display: flex;
          height: 30px;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 1rem;
        }
        
        .segment {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          overflow: hidden;
          min-width: 20px;
        }
        
        .segment-label {
          white-space: nowrap;
          font-size: 0.75rem;
          overflow: hidden;
          text-transform: capitalize;
        }
        
        .segment-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .segment-item {
          display: flex;
          align-items: flex-start;
          padding: 0.75rem;
          background-color: white;
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .segment-color {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          margin-right: 0.75rem;
          margin-top: 0.25rem;
        }
        
        .segment-info {
          flex: 1;
        }
        
        .segment-title {
          font-weight: bold;
          margin-bottom: 0.25rem;
          text-transform: capitalize;
        }
        
        .segment-excerpt {
          font-size: 0.9rem;
          color: #666;
        }
        
        .paragraph-emotions {
          margin-top: 2rem;
        }
        
        .paragraphs-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .paragraph-item {
          display: flex;
          align-items: center;
          padding: 0.75rem;
          background-color: white;
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .paragraph-emotion {
          padding: 0.3rem 0.6rem;
          border-radius: 4px;
          font-size: 0.9rem;
          text-transform: capitalize;
          margin-right: 1rem;
          min-width: 80px;
          text-align: center;
        }
        
        .paragraph-text {
          flex: 1;
          font-size: 0.9rem;
        }
        
        .more-paragraphs {
          text-align: center;
          padding: 0.75rem;
          background-color: white;
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          color: #757575;
          font-style: italic;
        }
        
        .emotion-profile-loading {
          padding: 2rem;
          text-align: center;
          background-color: #f5f5f5;
          border-radius: 8px;
          color: #757575;
        }
      `}</style>
    </div>
  );
};

export default EmotionalProfileDisplay;
