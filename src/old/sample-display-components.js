// EmotionalProfileDisplay.js
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { EMOTION_COLORS } from './EmotionAnalyzer';

const EmotionalProfileDisplay = ({ data }) => {
  // If there's an error or no data, show a message
  if (data?.error || !data) {
    return (
      <div className="emotional-profile-error">
        <p>{data?.error || 'No emotional data available'}</p>
      </div>
    );
  }

  // For demonstration, create a sample timeline
  // In a real implementation, you would analyze the text in segments
  const createSampleTimeline = () => {
    const emotions = data.emotions.map(emotion => emotion.label);
    const points = 20; // Number of data points in the timeline
    
    return Array.from({ length: points }, (_, i) => {
      const point = { name: i };
      
      // Add a value for each emotion
      emotions.forEach(emotion => {
        // Create a wave pattern for each emotion with different phases
        const phase = Math.random() * Math.PI * 2; // Random phase
        const amplitude = Math.random() * 0.5 + 0.2; // Random amplitude between 0.2 and 0.7
        
        // Calculate value using a sine wave with some noise
        const value = amplitude * Math.sin(i / 3 + phase) + 0.5 + Math.random() * 0.1;
        point[emotion] = Math.max(0, Math.min(1, value)); // Clamp between 0 and 1
      });
      
      return point;
    });
  };

  const timelineData = createSampleTimeline();

  return (
    <div className="emotional-profile-display">
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={timelineData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis dataKey="name" label={{ value: 'Story Timeline', position: 'bottom' }} />
            <YAxis label={{ value: 'Intensity', angle: -90, position: 'insideLeft' }} />
            <Tooltip formatter={(value) => value.toFixed(2)} />
            
            {/* Create an Area for each emotion */}
            {data.emotions.map((emotion, index) => (
              <Area
                key={emotion.label}
                type="monotone"
                dataKey={emotion.label}
                stackId="1"
                stroke={EMOTION_COLORS[emotion.label]}
                fill={EMOTION_COLORS[emotion.label]}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="emotions-summary">
        <h4>Dominant Emotions</h4>
        <ul className="emotions-list">
          {data.emotions.slice(0, 3).map(emotion => (
            <li key={emotion.label} style={{ color: EMOTION_COLORS[emotion.label] }}>
              {emotion.label}: {(emotion.prob * 100).toFixed(1)}%
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// ActionPaceDisplay.js
import React from 'react';

const ActionPaceDisplay = ({ data }) => {
  if (!data) {
    return <div>No action pace data available</div>;
  }
  
  const getPaceClass = (pace) => {
    switch (pace?.toLowerCase()) {
      case 'high': return 'high';
      case 'moderate': return 'moderate';
      case 'low': return 'low';
      default: return '';
    }
  };
  
  return (
    <div className="action-pace-display">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="metric-card">
          <div className="metric-title">{key.charAt(0).toUpperCase() + key.slice(1)}</div>
          <div className={`metric-value ${getPaceClass(value)}`}>{value}</div>
        </div>
      ))}
    </div>
  );
};

// NarrativeTensionDisplay.js
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const NarrativeTensionDisplay = ({ data }) => {
  if (!data) {
    return (
      <div className="narrative-tension-analysis">
        <p>Enter text to analyze narrative tension.</p>
      </div>
    );
  }
  
  // Create sample tension data (replace with actual data in production)
  const createSampleTensionData = () => {
    // Simulate classic narrative tension arc
    return [
      { position: 0, tension: 1 }, // Beginning
      { position: 10, tension: 2 }, // Initial incident
      { position: 20, tension: 3 },
      { position: 30, tension: 4 }, // Rising action
      { position: 40, tension: 5.5 },
      { position: 50, tension: 7 }, // Complications
      { position: 60, tension: 8 },
      { position: 70, tension: 9.5 }, // Climax
      { position: 80, tension: 6 }, // Falling action
      { position: 90, tension: 3 },
      { position: 100, tension: 1.5 } // Resolution
    ];
  };
  
  const tensionData = createSampleTensionData();
  
  return (
    <div className="narrative-tension-display">
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={tensionData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis dataKey="position" label={{ value: 'Story Position (%)', position: 'bottom' }} />
            <YAxis domain={[0, 10]} label={{ value: 'Tension', angle: -90, position: 'insideLeft' }} />
            <Tooltip formatter={(value) => value.toFixed(1)} />
            <Line 
              type="monotone" 
              dataKey="tension" 
              stroke="#e53935" 
              strokeWidth={3}
              activeDot={{ r: 8 }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// CharacterDangerDisplay.js
import React from 'react';

const CharacterDangerDisplay = ({ data }) => {
  if (!data) {
    return <div>No character danger data available</div>;
  }
  
  const { proximityScore, characters, dangerTerms } = data;
  
  return (
    <div className="character-danger-display">
      <div className="proximity-section">
        <div className="proximity-meter">
          <span className="proximity-label">Danger Proximity Score: {proximityScore.toFixed(3)}</span>
          <div className="proximity-bar">
            <div 
              className="proximity-fill" 
              style={{ width: `${proximityScore * 100}%` }}
            ></div>
          </div>
          <span className=