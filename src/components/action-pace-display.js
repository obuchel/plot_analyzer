import React from 'react';

const ActionPaceDisplay = ({ data }) => {
  // Default colors for pace visualization
  const PACE_COLORS = {
    rapid: '#f44336',    // Red
    fast: '#ff9800',     // Orange
    moderate: '#2196f3', // Blue
    slow: '#4caf50',     // Green
    very_slow: '#9e9e9e' // Gray
  };

  // If no data is provided, show a placeholder
  if (!data) {
    return (
      <div className="action-pace-empty">
        <p>No action pace data available</p>
      </div>
    );
  }

  // Extract pace data
  const paceSegments = data.paceSegments || [];
  const averagePace = data.averagePace || 'moderate';
  const paceScore = data.paceScore || 0.5;
  
  // Format a percentage for display
  const formatPercent = (value) => {
    return `${Math.round(value * 100)}%`;
  };
  
  // Get a user-friendly name for the pace
  const getPaceName = (pace) => {
    const names = {
      rapid: 'Rapid',
      fast: 'Fast',
      moderate: 'Moderate',
      slow: 'Slow',
      very_slow: 'Very Slow'
    };
    return names[pace] || pace;
  };
  
  // Get pace distribution data
  const paceDistribution = data.paceDistribution || {
    rapid: 0.1,
    fast: 0.2,
    moderate: 0.4,
    slow: 0.2,
    very_slow: 0.1
  };

  return (
    <div className="action-pace-container">
      <div className="pace-summary">
        <div 
          className="average-pace"
          style={{
            backgroundColor: PACE_COLORS[averagePace] || '#2196f3'
          }}
        >
          <h4>Average Pace</h4>
          <div className="pace-value">{getPaceName(averagePace)}</div>
          <div className="pace-score">
            Score: {formatPercent(paceScore)}
          </div>
        </div>
        
        <div className="pace-distribution">
          <h4>Pace Distribution</h4>
          {Object.entries(paceDistribution).map(([pace, value]) => (
            <div key={pace} className="pace-bar-container">
              <div className="pace-label">{getPaceName(pace)}</div>
              <div className="pace-bar-wrapper">
                <div 
                  className="pace-bar"
                  style={{
                    width: formatPercent(value),
                    backgroundColor: PACE_COLORS[pace] || '#9e9e9e'
                  }}
                ></div>
              </div>
              <div className="pace-percentage">
                {formatPercent(value)}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {paceSegments.length > 0 && (
        <div className="pace-timeline">
          <h4>Pace Timeline</h4>
          <div className="timeline-visualization">
            {paceSegments.map((segment, index) => (
              <div 
                key={index}
                className="timeline-segment"
                style={{
                  width: `${segment.percentage || (100 / paceSegments.length)}%`,
                  backgroundColor: PACE_COLORS[segment.pace] || '#9e9e9e'
                }}
                title={`${getPaceName(segment.pace)} (${segment.excerpt || ''})`}
              >
                <span className="segment-label">{getPaceName(segment.pace)}</span>
              </div>
            ))}
          </div>
          
          <div className="segment-list">
            {paceSegments.slice(0, 5).map((segment, index) => (
              <div key={index} className="segment-item">
                <div 
                  className="segment-indicator"
                  style={{
                    backgroundColor: PACE_COLORS[segment.pace] || '#9e9e9e'
                  }}
                ></div>
                <div className="segment-details">
                  <div className="segment-title">
                    {segment.title || `Segment ${index + 1}`}: {getPaceName(segment.pace)}
                  </div>
                  {segment.text && (
                    <div className="segment-excerpt">
                      "{segment.text.substring(0, 100)}{segment.text.length > 100 ? '...' : ''}"
                    </div>
                  )}
                </div>
              </div>
            ))}
            {paceSegments.length > 5 && (
              <div className="more-segments">
                + {paceSegments.length - 5} more segments analyzed
              </div>
            )}
          </div>
        </div>
      )}
      
      {data.actionHighlights && data.actionHighlights.length > 0 && (
        <div className="action-highlights">
          <h4>Action Highlights</h4>
          <div className="highlights-list">
            {data.actionHighlights.map((highlight, index) => (
              <div 
                key={index} 
                className="highlight-item"
                style={{
                  borderLeft: `4px solid ${PACE_COLORS[highlight.pace] || '#2196f3'}`
                }}
              >
                <div className="highlight-pace">{getPaceName(highlight.pace)}</div>
                <div className="highlight-text">"{highlight.text}"</div>
                {highlight.analysis && (
                  <div className="highlight-analysis">{highlight.analysis}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <style jsx>{`
        .action-pace-container {
          padding: 1rem;
          background-color: #f5f5f5;
          border-radius: 8px;
          margin-bottom: 2rem;
        }
        
        .pace-summary {
          display: flex;
          flex-wrap: wrap;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }
        
        .average-pace {
          padding: 1.5rem;
          border-radius: 8px;
          text-align: center;
          min-width: 150px;
          color: white;
        }
        
        .average-pace h4 {
          margin-top: 0;
          margin-bottom: 0.5rem;
          opacity: 0.9;
        }
        
        .pace-value {
          font-size: 1.5rem;
          font-weight: bold;
          margin-bottom: 0.25rem;
        }
        
        .pace-score {
          font-size: 1.1rem;
          opacity: 0.9;
        }
        
        .pace-distribution {
          flex: 1;
          min-width: 300px;
        }
        
        .pace-distribution h4 {
          margin-top: 0;
          margin-bottom: 1rem;
        }
        
        .pace-bar-container {
          display: flex;
          align-items: center;
          margin-bottom: 0.75rem;
        }
        
        .pace-label {
          width: 100px;
        }
        
        .pace-bar-wrapper {
          flex: 1;
          height: 12px;
          background-color: #e0e0e0;
          border-radius: 6px;
          overflow: hidden;
          margin: 0 0.75rem;
        }
        
        .pace-bar {
          height: 100%;
          border-radius: 6px;
          transition: width 0.5s ease;
        }
        
        .pace-percentage {
          width: 60px;
          text-align: right;
          font-size: 0.9rem;
        }
        
        .pace-timeline {
          margin-top: 2rem;
        }
        
        .timeline-visualization {
          display: flex;
          height: 30px;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 1rem;
        }
        
        .timeline-segment {
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
        }
        
        .segment-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-top: 1.5rem;
        }
        
        .segment-item {
          display: flex;
          align-items: flex-start;
          padding: 0.75rem;
          background-color: white;
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .segment-indicator {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          margin-right: 0.75rem;
          margin-top: 0.25rem;
        }
        
        .segment-details {
          flex: 1;
        }
        
        .segment-title {
          font-weight: bold;
          margin-bottom: 0.25rem;
        }
        
        .segment-excerpt {
          font-size: 0.9rem;
          font-style: italic;
          color: #666;
          margin-bottom: 0.5rem;
        }
        
        .more-segments {
          text-align: center;
          padding: 0.75rem;
          background-color: white;
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          color: #757575;
          font-style: italic;
        }
        
        .action-highlights {
          margin-top: 2rem;
        }
        
        .highlights-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .highlight-item {
          padding: 0.75rem;
          padding-left: 1rem;
          background-color: white;
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .highlight-pace {
          font-weight: bold;
          margin-bottom: 0.25rem;
        }
        
        .highlight-text {
          font-style: italic;
          margin-bottom: 0.5rem;
        }
        
        .highlight-analysis {
          font-size: 0.9rem;
          color: #666;
        }
        
        .action-pace-empty {
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

export default ActionPaceDisplay;