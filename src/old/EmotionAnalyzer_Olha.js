
// EmotionAnalyzer.jsx
import React, { useState } from 'react';

function EmotionAnalyzer() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyzeEmotion = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error analyzing emotion:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="emotion-analyzer">
      <h2>Emotion Analysis</h2>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text to analyze..."
        rows={4}
        cols={50}
      />
      <button onClick={analyzeEmotion} disabled={loading || !text}>
        {loading ? 'Analyzing...' : 'Analyze Emotion'}
      </button>
      
      {result && (
        <div className="result">
          <h3>Result: {result.predicted_emotion}</h3>
          <h4>Probabilities:</h4>
          <ul>
            {Object.entries(result.probabilities).map(([emotion, prob]) => (
              <li key={emotion}>
                {emotion}: {(prob * 100).toFixed(2)}%
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default EmotionAnalyzer;
