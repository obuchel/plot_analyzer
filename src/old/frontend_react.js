// EmotionAnalyzer.jsx
import React, { useState } from 'react';

function EmotionAnalyzer() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyzeEmotion = async () => {
    if (!text.trim()) {
      setError('Please enter some text to analyze');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Updated to use FastAPI endpoint (note the port change from 5000 to 8000)
      const response = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Something went wrong');
      }
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error analyzing emotion:', error);
      setError(error.message || 'Failed to analyze emotion');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  // Sort emotions by probability (highest first)
  const sortedEmotions = result?.probabilities ? 
    Object.entries(result.probabilities).sort((a, b) => b[1] - a[1]) : 
    [];

  return (
    <div className="emotion-analyzer">
      <h2>Emotion Analysis</h2>
      <div className="input-container">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text to analyze..."
          rows={4}
          cols={50}
          disabled={loading}
        />
        <button 
          onClick={analyzeEmotion} 
          disabled={loading || !text.trim()}
          className="analyze-button"
        >
          {loading ? 'Analyzing...' : 'Analyze Emotion'}
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {result && (
        <div className="result">
          <h3>Result: <span className="emotion">{result.predicted_emotion}</span></h3>
          <h4>Probabilities:</h4>
          <div className="probabilities">
            {sortedEmotions.map(([emotion, prob]) => (
              <div key={emotion} className="probability-item">
                <div className="emotion-label">{emotion}</div>
                <div className="probability-bar-container">
                  <div 
                    className="probability-bar" 
                    style={{ width: `${prob * 100}%` }}
                  />
                  <span className="probability-value">{(prob * 100).toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CSS styles */}
      <style jsx>{`
        .emotion-analyzer {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          font-family: Arial, sans-serif;
        }
        
        .input-container {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 20px;
        }
        
        textarea {
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 16px;
          resize: vertical;
        }
        
        .analyze-button {
          padding: 10px 15px;
          background-color: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          transition: background-color 0.3s;
        }
        
        .analyze-button:hover:not(:disabled) {
          background-color: #45a049;
        }
        
        .analyze-button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }
        
        .error-message {
          color: #d32f2f;
          margin-bottom: 15px;
        }
        
        .result {
          background-color: #f9f9f9;
          padding: 15px;
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .emotion {
          color: #2196F3;
          text-transform: capitalize;
        }
        
        .probabilities {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .probability-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .emotion-label {
          width: 80px;
          text-transform: capitalize;
        }
        
        .probability-bar-container {
          flex: 1;
          height: 20px;
          background-color: #e0e0e0;
          border-radius: 10px;
          overflow: hidden;
          position: relative;
        }
        
        .probability-bar {
          height: 100%;
          background-color: #2196F3;
          border-radius: 10px;
        }
        
        .probability-value {
          position: absolute;
          right: 10px;
          top: 0;
          color: white;
          font-size: 12px;
          line-height: 20px;
          text-shadow: 0 0 2px rgba(0,0,0,0.5);
        }
      `}</style>
    </div>
  );
}

export default EmotionAnalyzer;
