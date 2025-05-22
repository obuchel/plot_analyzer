import { useState, useEffect } from 'react';
import * as ort from 'onnxruntime-web';
import * as VOCAB from '../vocab.json';

// Constants
const EMOTION_LABELS = ['anger', 'disgust', 'fear', 'joy', 'neutral', 'sadness', 'surprise'];
const MODEL_URL = 'https://huggingface.co/obuchel1/quantized_emotion_model1/resolve/main/emotion_model.onnx';

// Configure WASM paths to avoid MIME type issues
if (ort.env) {
  ort.env.wasm = {
    numThreads: 1,
    simd: false,
    wasmPaths: {
      'ort-wasm.wasm': 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.14.0/dist/ort-wasm.wasm',
      'ort-wasm-simd.wasm': 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.14.0/dist/ort-wasm-simd.wasm',
      'ort-wasm-threaded.wasm': 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.14.0/dist/ort-wasm-threaded.wasm'
    }
  };
}

const EMOTION_COLORS = {
  'anger': '#e53935',    // Red
  'disgust': '#8bc34a',  // Green
  'fear': '#9c27b0',     // Purple
  'joy': '#ffc107',      // Yellow
  'neutral': '#78909c',  // Blue-gray
  'sadness': '#3f51b5',  // Indigo
  'surprise': '#ff9800'  // Orange
};

// EmotionAnalyzer class (Python-like implementation)
class EmotionAnalyzer {
  constructor() {
    this.session = null;
    this.isInitialized = false;
    this.neutralWeight = 0.7;
    this.vocab = VOCAB;
    
    // Generate BPE merges from vocabulary for Python-like tokenization
    this.mergesPairs = this.generateBPEMerges();
  }

  // Log function - for debugging
  log(message) {
    console.log(`[EmotionAnalyzer] ${message}`);
  }

  // Generate BPE merges from vocabulary (similar to Python implementation)
  generateBPEMerges() {
    this.log('Generating BPE merges from vocabulary...');
    
    const mergesPairs = {};
    let rank = 0;
    
    // Tokens for BPE merges
    const bpeTokens = [];
    for (const token of Object.keys(this.vocab)) {
      if (token.startsWith('<') || token.length > 10) continue;
      bpeTokens.push(token);
    }
    
    // Sort tokens by length
    bpeTokens.sort((a, b) => a.length - b.length);
    
    // Define common BPE merges that are likely to exist
    const commonPairs = [
      'r+b', 'W+W', 'V+M', 'G+e', 'P+r', 'S+Y', 
      ' +(', 'B+F', 'f+o', 'G+I', ' +/', 'O+F',
      'G+Y', 'L+M', 'C+I', ')+(', 'K+O', ' +t', ' +a', ' +i'
    ];
    
    // Add common pairs first with highest priority
    for (const pairStr of commonPairs) {
      const [first, second] = pairStr.split('+');
      const pair = first + second;
      mergesPairs[pair] = rank++;
    }
    
    // Infer merges from vocabulary
    for (let i = 0; i < bpeTokens.length; i++) {
      const token = bpeTokens[i];
      
      // Skip single character tokens
      if (token.length <= 1) continue;
      
      // Try to find potential merges
      for (let j = 1; j < token.length; j++) {
        const first = token.substring(0, j);
        const second = token.substring(j);
        
        // If both parts are in the vocabulary, this could be a merge
        if (this.vocab[first] !== undefined && this.vocab[second] !== undefined) {
          // Check if this pair is already in our merges
          if (mergesPairs[first + second] === undefined) {
            mergesPairs[first + second] = rank++;
          }
        }
      }
      
      // Limit the number of inferred merges
      if (rank > 1000) break;
    }
    
    this.log(`Generated ${Object.keys(mergesPairs).length} BPE merges`);
    return mergesPairs;
  }

  // Initialize and load model
  async initialize() {
    if (this.isInitialized) return true;
    
    this.log('Initializing ONNX Runtime...');
    
    this.log(`Loading model from ${MODEL_URL}...`);
    
    try {
      // Fetch the model with explicit headers to request binary data
      const response = await fetch(MODEL_URL, {
        method: 'GET',
        headers: {
          'Accept': 'application/octet-stream'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch model: ${response.status} ${response.statusText}`);
      }
      
      const modelArrayBuffer = await response.arrayBuffer();
      this.log(`Model fetched, size: ${modelArrayBuffer.byteLength} bytes`);
      
      // Create session
      const sessionOptions = {
        executionProviders: ['wasm']
      };
      
      this.session = await ort.InferenceSession.create(modelArrayBuffer, sessionOptions);
      this.log(`Model loaded successfully`);
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      this.log(`Initialization error: ${error.message}`);
      throw error;
    }
  }

  // Apply BPE to a single word (Python-like)
  applyBPE(word) {
    // If the word is already in vocabulary, return it as a single token
    if (this.vocab[word] !== undefined) {
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
        if (this.mergesPairs[pair] !== undefined && this.mergesPairs[pair] < bestRank) {
          bestPair = pair;
          bestRank = this.mergesPairs[pair];
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
      if (this.vocab[subword] !== undefined) {
        tokens.push(subword);
      } else {
        // Handle unknown tokens
        let charTokenized = false;
        for (const char of subword) {
          if (this.vocab[char] !== undefined) {
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
  }

  // Tokenize text python-style (more like the HTML example)
  tokenizePythonStyle(text) {
    this.log(`Tokenizing with Python-compatible method: "${text}"`);
    
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
          const wordTokens = this.applyBPE(word);
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
      const wordTokens = this.applyBPE(word);
      tokens.push(...wordTokens);
    }
    
    // Convert tokens to token IDs
    const tokenIds = [];
    for (const token of tokens) {
      if (this.vocab[token] !== undefined) {
        tokenIds.push(this.vocab[token]);
      } else {
        tokenIds.push(3); // unknown token ID
      }
    }
    
    return tokenIds;
  }

  // Tokenize text for emotion analysis
  tokenizeText(inputText) {
    this.log(`Tokenizing text: "${inputText}"`);
    
    // Use Python-style tokenization for better compatibility
    const tokenIds = this.tokenizePythonStyle(inputText);
    
    // Add BOS and EOS tokens (required by the model)
    let inputIds = [0, ...tokenIds, 2]; // BOS=0, EOS=2
    let attentionMask = Array(inputIds.length).fill(1);
    
    // Ensure we don't exceed maximum length
    const maxLength = 128;
    if (inputIds.length > maxLength) {
      inputIds = inputIds.slice(0, maxLength - 1);
      inputIds.push(2); // Make sure we end with EOS token
      attentionMask = attentionMask.slice(0, maxLength);
    }
    
    this.log(`Final token IDs: [${inputIds.join(', ')}]`);
    
    return { 
      inputIds, 
      attentionMask,
      words: inputText.split(/\s+/)
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
    this.log(`Set neutral weight to ${this.neutralWeight}`);
  }

  // Main analyze function
  async analyzeEmotion(inputText, options = {}) {
    try {
      // Make sure the analyzer is initialized
      if (!this.isInitialized) {
        await this.initialize();
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
      const feeds = {};
      if (this.session.inputNames.includes('input_ids')) {
        feeds['input_ids'] = inputIdsTensor;
      }
      if (this.session.inputNames.includes('attention_mask')) {
        feeds['attention_mask'] = attentionMaskTensor;
      }
      
      // If different input names are used, try to adapt
      if (Object.keys(feeds).length === 0) {
        if (this.session.inputNames.length >= 2) {
          feeds[this.session.inputNames[0]] = inputIdsTensor;
          feeds[this.session.inputNames[1]] = attentionMaskTensor;
        } else {
          feeds[this.session.inputNames[0]] = inputIdsTensor;
        }
      }
      
      this.log('Running inference...');
      
      // Run inference
      const results = await this.session.run(feeds);
      
      // Get the logits (check common output names)
      let outputTensor;
      if (results.logits) {
        outputTensor = results.logits;
      } else if (results.output) {
        outputTensor = results.output;
      } else if (results[this.session.outputNames[0]]) {
        outputTensor = results[this.session.outputNames[0]];
      } else {
        outputTensor = Object.values(results)[0];
      }
      
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
      
      // Create emotion results with probabilities
      const emotionResults = EMOTION_LABELS.map((label, index) => ({
        label,
        probability: probabilities[index],
        color: EMOTION_COLORS[label]
      }));
      
      // Sort by probability (highest first)
      emotionResults.sort((a, b) => b.probability - a.probability);
      
      // The dominant emotion is the first after sorting
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
      throw error;
    }
  }
}

// Create the singleton instance
const analyzer = new EmotionAnalyzer();

// React component
function EmotionAnalyzerComponent() {
  const [text, setText] = useState('I feel really happy today!');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [neutralWeight, setNeutralWeight] = useState(0.7);
  const [showTokens, setShowTokens] = useState(false);

  // Initialize the analyzer when component mounts
  useEffect(() => {
    async function initAnalyzer() {
      setLoading(true);
      setError(null);
      try {
        await analyzer.initialize();
        setModelLoaded(true);
      } catch (error) {
        console.error("Failed to initialize analyzer:", error);
        setError(`Failed to initialize analyzer: ${error.message}`);
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
    setError(null);
    
    try {
      // Analyze the text
      const analysisResult = await analyzer.analyzeEmotion(text, { neutralWeight });
      setResult(analysisResult);
    } catch (error) {
      console.error("Analysis failed:", error);
      setError(`Analysis failed: ${error.message}`);
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
        {!modelLoaded && !error && <p className="text-sm text-gray-500 mt-2">Loading model...</p>}
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 rounded-lg text-red-700">
          <h3 className="text-xl font-bold mb-2">Error</h3>
          <p>{error}</p>
        </div>
      )}
      
      {result && (
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
    </div>
  );
}

// Create a standalone version of analyzeEmotion
const analyzeEmotion = async (inputText, options = {}) => {
  // Make sure the analyzer is initialized
  if (!analyzer.isInitialized) {
    await analyzer.initialize();
  }
  
  // Analyze the text and return the result
  return await analyzer.analyzeEmotion(inputText, options);
};

// Export 
export { 
  analyzer as EmotionAnalyzer, 
  EMOTION_LABELS, 
  EMOTION_COLORS, 
  analyzeEmotion 
};

// Default export
export default EmotionAnalyzerComponent;