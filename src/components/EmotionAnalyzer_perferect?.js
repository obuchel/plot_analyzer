import { useState, useEffect } from 'react';
import * as ort from 'onnxruntime-web';
// Import your existing vocabulary - adjust the path as needed
import * as  VOCAB  from '../vocab.json';

// Constants
const EMOTION_LABELS = ['anger', 'disgust', 'fear', 'joy', 'neutral', 'sadness', 'surprise'];
const MODEL_URL = 'https://huggingface.co/obuchel1/quantized_emotion_model1/resolve/main/emotion_model.onnx';

const EMOTION_COLORS = {
  'anger': '#e53935',    // Red
  'disgust': '#8bc34a',  // Green
  'fear': '#9c27b0',     // Purple
  'joy': '#ffc107',      // Yellow
  'neutral': '#78909c',  // Blue-gray
  'sadness': '#3f51b5',  // Indigo
  'surprise': '#ff9800'  // Orange
};

// Emotion keywords for token generation - this helps with the simulation mode
const EMOTION_KEYWORDS = {
  fear: ['fear', 'afraid', 'scared', 'terrified', 'frightened', 'worried', 'anxious'],
  anger: ['anger', 'angry', 'mad', 'furious', 'rage', 'hate', 'hatred', 'outrage'],
  disgust: ['disgust', 'disgusted', 'gross', 'revolting', 'repulsive', 'nasty'],
  joy: ['joy', 'happy', 'happiness', 'pleased', 'delighted', 'cheerful', 'glad'],
  sadness: ['sad', 'upset', 'unhappy', 'miserable', 'depressed', 'gloomy', 'sorrow'],
  surprise: ['surprise', 'surprised', 'shocking', 'shock', 'astonished', 'amazed'],
  neutral: ['said', 'went', 'going', 'come', 'coming', 'went', 'see', 'saw', 'look']
};

// Token ID ranges for different emotion categories - for simulation and unknown word handling
const TOKEN_RANGES = {
  fear: { min: 5000, max: 5999 },
  anger: { min: 6000, max: 6999 },
  disgust: { min: 7000, max: 7999 },
  joy: { min: 8000, max: 8999 },
  sadness: { min: 9000, max: 9999 },
  surprise: { min: 10000, max: 10999 },
  neutral: { min: 11000, max: 11999 },
};

// EmotionAnalyzer class that can be used outside of React
class EmotionAnalyzer {
  constructor() {
    this.session = null;
    this.isInitialized = false;
    this.neutralWeight = 0.7;
    this.logs = [];
    this.vocab = VOCAB;
  }

  // Log function
  log(message) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    this.logs.push(logEntry);
    console.log(`[EmotionAnalyzer] ${message}`);
    return logEntry;
  }

  // Initialize and load model
  async initialize() {
    if (this.isInitialized) return true;
    
    try {
      this.log('Initializing ONNX Runtime...');
      
      // Configure ONNX runtime
      if (ort && ort.env) {
        ort.env.wasm = {
          numThreads: 1,
          simd: false
        };
        this.log('Configured ONNX Runtime with minimal settings');
      }
      
      this.log(`Loading model from ${MODEL_URL}...`);
      
      try {
        // Fetch the model
        const response = await fetch(MODEL_URL);
        if (!response.ok) {
          throw new Error(`Failed to fetch model: ${response.status} ${response.statusText}`);
        }
        
        const modelArrayBuffer = await response.arrayBuffer();
        this.log(`Model fetched, size: ${modelArrayBuffer.byteLength} bytes`);
        
        // Load the model
        const sessionOptions = {
          executionProviders: ['wasm']
        };
        
        this.session = await ort.InferenceSession.create(modelArrayBuffer, sessionOptions);
        this.log(`Model loaded successfully`);
        this.log(`Model inputs: ${this.session.inputNames.join(', ')}`);
        this.log(`Model outputs: ${this.session.outputNames.join(', ')}`);
        
        this.isInitialized = true;
        return true;
      } catch (error) {
        this.log(`Error loading model: ${error.message}`);
        
        // Fall back to a dummy session
        this.log('Falling back to simulation mode');
        this.session = this.createDummySession();
        this.isInitialized = true;
        return true;
      }
    } catch (error) {
      this.log(`Initialization error: ${error.message}`);
      return false;
    }
  }
  
  // Create a dummy session for testing
  createDummySession() {
    return {
      inputNames: ['input_ids', 'attention_mask'],
      outputNames: ['logits'],
      run: async (feeds) => {
        // Extract text from tokenized input if available
        const inputIds = feeds.input_ids.data;
        
        // Bias scores based on emotion keywords
        const emotionScores = EMOTION_LABELS.map(emotion => {
          // Start with a random base
          let score = (Math.random() * 0.5) - 0.25;
          
          // Add bias based on token IDs
          for (let i = 0; i < inputIds.length; i++) {
            const tokenId = Number(inputIds[i]);
            
            // Check token ID ranges for specific emotions
            if (tokenId >= 5000 && tokenId < 6000) score += (emotion === 'fear' ? 0.5 : -0.1);
            if (tokenId >= 6000 && tokenId < 7000) score += (emotion === 'anger' ? 0.5 : -0.1);
            if (tokenId >= 7000 && tokenId < 8000) score += (emotion === 'disgust' ? 0.5 : -0.1);
            if (tokenId >= 8000 && tokenId < 9000) score += (emotion === 'joy' ? 0.5 : -0.1);
            if (tokenId >= 9000 && tokenId < 10000) score += (emotion === 'sadness' ? 0.5 : -0.1);
            if (tokenId >= 10000 && tokenId < 11000) score += (emotion === 'surprise' ? 0.5 : -0.1);
            if (tokenId >= 11000 && tokenId < 12000) score += (emotion === 'neutral' ? 0.5 : -0.1);
          }
          
          return score;
        });
        
        return {
          logits: {
            data: new Float32Array(emotionScores),
            dims: [1, EMOTION_LABELS.length]
          }
        };
      }
    };
  }

  // Hash function for generating token IDs for words not in vocabulary
  hashWord(word) {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      const char = word.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    // Make sure it's positive and within a reasonable range (4000-65000)
    return Math.abs(hash) % 61000 + 4000;
  }

  // Find which emotion category a word belongs to (for unknown words)
  getEmotionCategory(word) {
    const lowerWord = word.toLowerCase();
    for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
      if (keywords.includes(lowerWord)) {
        return emotion;
      }
    }
    return null;
  }

  // Tokenize text for emotion analysis
  tokenizeText(inputText) {
    this.log(`Tokenizing text: "${inputText}"`);
    
    // Standard transformer model format
    const inputIds = [0]; // Start with BOS token (<s>)
    const attentionMask = [1];
    
    // Split the text into words
    const words = inputText.toLowerCase().trim().split(/\s+/);
    
    // Track which emotions are represented in the text (for debug info)
    const emotionScores = Object.fromEntries(
      EMOTION_LABELS.map(emotion => [emotion, 0])
    );
    
    // Scan the text for emotion keywords (for debug info)
    for (const emotion of EMOTION_LABELS) {
      if (EMOTION_KEYWORDS[emotion]) {
        for (const keyword of EMOTION_KEYWORDS[emotion]) {
          // Check if the keyword appears in the text
          const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
          const matches = inputText.match(regex);
          
          if (matches) {
            // Increment the score for this emotion by the number of matches
            emotionScores[emotion] += matches.length;
          }
        }
      }
    }
    
    // Log emotion keywords found
    const foundEmotions = Object.entries(emotionScores)
      .filter(([_, score]) => score > 0)
      .map(([emotion, score]) => `${emotion}(${score})`)
      .join(', ');
      
    if (foundEmotions) {
      this.log(`Emotion keywords found: ${foundEmotions}`);
    }
    
    // Process each word (up to 5)
    const wordsToProcess = words.slice(0, 5);
    
    for (const word of wordsToProcess) {
      let tokenId;
      
      // Check if word is in our vocabulary
      if (this.vocab && word in this.vocab) {
        tokenId = this.vocab[word];
        this.log(`Word "${word}" found in vocabulary: ${tokenId}`);
      } else {
        // Not in vocabulary, check if it's an emotion keyword
        const emotionCategory = this.getEmotionCategory(word);
        
        if (emotionCategory && TOKEN_RANGES[emotionCategory]) {
          // Use a token ID from the emotion's range
          const range = TOKEN_RANGES[emotionCategory];
          tokenId = range.min + (this.hashWord(word) % (range.max - range.min));
          this.log(`Word "${word}" mapped to ${emotionCategory} range: ${tokenId}`);
        } else {
          // Just hash the word
          tokenId = this.hashWord(word);
          this.log(`Word "${word}" not found, hashed to: ${tokenId}`);
        }
      }
      
      inputIds.push(tokenId);
      attentionMask.push(1);
    }
    
    // Add EOS token
    inputIds.push(2); // </s>
    attentionMask.push(1);
    
    // Pad to length 7 if needed (specific format for this model)
    while (inputIds.length < 7) {
      inputIds.push(1); // <pad>
      attentionMask.push(1);
    }
    
    this.log(`Final token IDs: [${inputIds.join(', ')}]`);
    
    return { 
      inputIds, 
      attentionMask,
      emotionScores,
      words: wordsToProcess
    };
  }

  // Softmax function to convert logits to probabilities
  softmax(logits) {
    const maxLogit = Math.max(...logits);
    const expValues = logits.map(val => Math.exp(val - maxLogit));
    const sumExp = expValues.reduce((sum, val) => sum + val, 0);
    return expValues.map(val => val / sumExp);
  }

  // Set neutral weight
  setNeutralWeight(weight) {
    this.neutralWeight = parseFloat(String(weight));
    this.log(`Neutral weight set to ${this.neutralWeight}`);
  }

  // Get logs
  getLogs() {
    return this.logs;
  }

  // Main analyze function
  async analyzeEmotion(inputText, options = {}) {
    try {
      // Make sure the analyzer is initialized
      if (!this.isInitialized) {
        const success = await this.initialize();
        if (!success) {
          return { error: 'Failed to initialize the emotion analyzer' };
        }
      }
      
      // Set neutral weight if provided
      if (options.neutralWeight !== undefined) {
        this.setNeutralWeight(options.neutralWeight);
      }
      
      this.log(`Analyzing text: "${inputText}"`);
      
      // Tokenize the text
      const tokenization = this.tokenizeText(inputText);
      const { inputIds, attentionMask } = tokenization;
      
      // Create tensors
      const inputIdsTensor = new ort.Tensor(
        'int64',
        new BigInt64Array(inputIds.map(id => BigInt(id))),
        [1, inputIds.length]
      );
      
      const attentionMaskTensor = new ort.Tensor(
        'int64',
        new BigInt64Array(attentionMask.map(mask => BigInt(mask))),
        [1, attentionMask.length]
      );
      
      // Create feeds for the model
      const feeds = {
        input_ids: inputIdsTensor,
        attention_mask: attentionMaskTensor
      };
      
      this.log('Running inference...');
      
      // Run inference
      const results = await this.session.run(feeds);
      
      // Get the logits
      const outputTensor = results.logits || Object.values(results)[0];
      const logits = Array.from(outputTensor.data);
      
      this.log(`Raw logits: [${logits.slice(0, EMOTION_LABELS.length).map(l => l.toFixed(3)).join(', ')}]`);
      
      // Apply neutral weight
      const weightedLogits = [...logits];
      const neutralIndex = EMOTION_LABELS.indexOf('neutral');
      
      if (neutralIndex >= 0) {
        weightedLogits[neutralIndex] *= this.neutralWeight;
        this.log(`Applied neutral weight ${this.neutralWeight} (before: ${logits[neutralIndex].toFixed(3)}, after: ${weightedLogits[neutralIndex].toFixed(3)})`);
      }
      
      // Convert to probabilities
      const probabilities = this.softmax(weightedLogits.slice(0, EMOTION_LABELS.length));
      
      // Get the predicted emotion
      const predictedIndex = probabilities.indexOf(Math.max(...probabilities));
      //const predictedEmotion = EMOTION_LABELS[predictedIndex];
      
      // Convert to probabilities


// Create emotion results with probabilities
const emotionResults = EMOTION_LABELS.map((label, index) => ({
  label,
  probability: probabilities[index],
  color: EMOTION_COLORS[label]
}));

// Sort by probability (highest first)
emotionResults.sort((a, b) => b.probability - a.probability);

// The dominant emotion should be the first after sorting
const predictedEmotion = emotionResults[0].label;
const confidence = emotionResults[0].probability;

// Create the final result object
const result = {
  predictedEmotion,
  confidence,
  emotions: emotionResults,
  rawLogits: logits.slice(0, EMOTION_LABELS.length),
  weightedLogits: weightedLogits.slice(0, EMOTION_LABELS.length),
  tokenization
};

this.log(`Analysis complete: ${predictedEmotion} (${(confidence * 100).toFixed(2)}%)`);
return result;
      
    } catch (error) {
      this.log(`Error in analysis: ${error.message}`);
      return { error: error.message };
    }
  }
}

// Create a singleton instance
const analyzer = new EmotionAnalyzer();

// Main React component
function EmotionAnalyzerComponent() {
  const [text, setText] = useState('I feel really happy today!');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [logs, setLogs] = useState([]);
  const [neutralWeight, setNeutralWeight] = useState(0.7);
  const [showTokens, setShowTokens] = useState(false);

  // Initialize the analyzer when component mounts
  useEffect(() => {
    async function initAnalyzer() {
      setLoading(true);
      try {
        const isInitialized = await analyzer.initialize();
        setModelLoaded(isInitialized);
        setLogs(analyzer.getLogs());
      } catch (error) {
        console.error("Failed to initialize analyzer:", error);
      } finally {
        setLoading(false);
      }
    }
    
    initAnalyzer();
  }, []);

  // Analyze emotion when the analyze button is clicked
  const handleAnalyze = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      // Set the neutral weight
      analyzer.setNeutralWeight(neutralWeight);
      
      // Analyze the text
      const analysisResult = await analyzer.analyzeEmotion(text);
      
      // Update logs and result
      setLogs(analyzer.getLogs());
      setResult(analysisResult);
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle text change
  const handleTextChange = (e) => {
    setText(e.target.value);
  };

  // Handle neutral weight change
  const handleWeightChange = (e) => {
    setNeutralWeight(parseFloat(e.target.value));
  };

  // Set example text
  const setExampleText = (exampleText) => {
    setText(exampleText);
  };

  // Example texts
  const examples = [
    { label: 'Joy', text: 'The news about their promotion filled them with joy and excitement.' },
    { label: 'Anger', text: 'The betrayal left him feeling angry and bitter towards his former friend.' },
    { label: 'Surprise', text: 'She was surprised to find her birthday party waiting when she opened the door.' },
    { label: 'Disgust', text: 'The sight of the moldy food made her feel disgusted.' },
    { label: 'Fear', text: 'The dark shadows in the abandoned house made the children fearful.' },
    { label: 'Sadness', text: 'He felt a deep sadness remembering his childhood home was now gone.' },
    { label: 'Neutral', text: 'The weather report indicated clear skies for the weekend.' }
  ];

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Emotion Analysis</h2>
      
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <input 
              type="checkbox" 
              id="show-tokens" 
              checked={showTokens} 
              onChange={() => setShowTokens(!showTokens)}
              className="mr-2"
            />
            <label htmlFor="show-tokens">Show tokenization details</label>
          </div>
          
          <div className="flex items-center mb-2">
            <label htmlFor="neutral-weight" className="mr-2">Neutral weight:</label>
            <input 
              type="range" 
              id="neutral-weight" 
              min="0.1" 
              max="1.5" 
              step="0.1" 
              value={neutralWeight} 
              onChange={handleWeightChange}
              className="mr-2"
            />
            <span>{neutralWeight}</span>
          </div>
        </div>
        
        {showTokens && result && result.tokenization && (
          <div className="mb-4 p-3 bg-gray-200 rounded text-sm font-mono overflow-auto max-h-32">
            <div><strong>Token IDs:</strong> {result.tokenization.inputIds.join(', ')}</div>
            <div><strong>Words:</strong> {result.tokenization.words.join(', ')}</div>
            <div>
              <strong>Emotion keywords:</strong> {Object.entries(result.tokenization.emotionScores)
                .filter(([_, score]) => score > 0)
                .map(([emotion, score]) => `${emotion} (${score})`)
                .join(', ') || "None detected"}
            </div>
          </div>
        )}
        
        <textarea 
          className="w-full p-2 border rounded resize-none mb-3"
          rows={4}
          value={text}
          onChange={handleTextChange}
          placeholder="Enter text to analyze emotions..."
        />
        
        <div className="flex flex-wrap gap-2 mb-3">
          {examples.map((example, index) => (
            <button 
              key={index}
              onClick={() => setExampleText(example.text)}
              className="px-2 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              {example.label}
            </button>
          ))}
        </div>
        
        <button 
          onClick={handleAnalyze}
          disabled={loading || !modelLoaded}
          className={`px-4 py-2 rounded ${loading || !modelLoaded ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'} text-white`}
        >
          {loading ? 'Analyzing...' : 'Analyze Emotion'}
        </button>
        {!modelLoaded && <p className="text-sm text-gray-500 mt-2">Loading model...</p>}
      </div>
      
      {result && !result.error && (
        <div className="mb-6 p-4 bg-gray-100 rounded-lg">
          <h3 className="text-xl font-bold mb-3" style={{ color: EMOTION_COLORS[result.predictedEmotion] }}>
            Detected emotion: {result.predictedEmotion} ({(result.confidence * 100).toFixed(2)}%)
          </h3>
          
          <table className="w-full border-collapse mb-4">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2 text-left">Emotion</th>
                <th className="border p-2 text-left">Probability</th>
                <th className="border p-2 text-left">Visualization</th>
              </tr>
            </thead>
            <tbody>
              {result.emotions.map((emotion, index) => (
                <tr key={index}>
                  <td className="border p-2">
                    {emotion.label === result.predictedEmotion ? <strong>{emotion.label}</strong> : emotion.label}
                  </td>
                  <td className="border p-2">{(emotion.probability * 100).toFixed(2)}%</td>
                  <td className="border p-2">
                    <div className="w-full bg-gray-200 rounded overflow-hidden">
                      <div 
                        className="h-5"
                        style={{ 
                          width: `${Math.max(emotion.probability * 100, 1)}%`,
                          backgroundColor: emotion.color
                        }}
                      ></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="p-3 bg-blue-50 rounded text-sm">
            <div><strong>Model Configuration:</strong></div>
            <div>Neutral Weight: {neutralWeight}</div>
            <div>Raw Logits: [{result.rawLogits.map(l => l.toFixed(3)).join(', ')}]</div>
            <div>Weighted Logits: [{result.weightedLogits.map(l => l.toFixed(3)).join(', ')}]</div>
          </div>
        </div>
      )}
      
      {result && result.error && (
        <div className="mb-6 p-4 bg-red-100 rounded-lg text-red-700">
          <h3 className="text-xl font-bold mb-2">Error</h3>
          <p>{result.error}</p>
        </div>
      )}
      
      <div className="p-3 bg-gray-100 rounded-lg font-mono text-xs max-h-60 overflow-y-auto">
        <div className="font-bold mb-2">Debug Log:</div>
        {logs.map((log, index) => (
          <div key={index}>{log}</div>
        ))}
      </div>
    </div>
  );
}

// Create a standalone version of analyzeEmotion that uses the singleton
const analyzeEmotion = async (inputText, options = {}) => {
  return await analyzer.analyzeEmotion(inputText, options);
};

// Export everything in one statement
export { 
  analyzer as EmotionAnalyzer, 
  EMOTION_LABELS, 
  EMOTION_COLORS, 
  analyzeEmotion 
};

// If you have a default export, keep it separate
export default EmotionAnalyzerComponent; 