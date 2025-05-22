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

// Cache for model sessions and analysis results
const CACHE = {
  session: null,
  modelBuffer: null,
  analysisResults: {},
  tokenizations: {}
};

// EmotionAnalyzer class with configuration options
class EmotionAnalyzer {
  constructor(config = {}) {
    // Default configuration
    this.config = {
      neutralWeight: 0.7,           // Weight applied to the neutral class
      confidenceThreshold: 0.15,    // Minimum confidence to consider an emotion valid
      softmaxTemperature: 1.0,      // Temperature for softmax (higher = smoother distribution)
      ...config                     // Override with any provided config
    };
    
    this.session = null;
    this.isInitialized = false;
    this.vocab = VOCAB;
    this.mergesPairs = this.generateBPEMerges();
  }

  // Update configuration
  updateConfig(newConfig = {}) {
    this.config = {
      ...this.config,
      ...newConfig
    };
    this.log(`Configuration updated: ${JSON.stringify(this.config)}`);
    return this.config;
  }

  // Get current configuration
  getConfig() {
    return { ...this.config };
  }

  // Log function - for debugging
  log(message) {
    console.log(`[EmotionAnalyzer] ${message}`);
  }

  // Generate BPE merges from vocabulary
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

  // Initialize and load model - MODEL ONLY
  async initialize() {
    if (this.isInitialized) return true;
    
    // Check if we already have a cached session
    if (CACHE.session) {
      this.log('Using cached session');
      this.session = CACHE.session;
      this.isInitialized = true;
      return true;
    }
    
    this.log('Initializing ONNX Runtime...');
    
    try {
      // Check if we have the model buffer cached
      if (!CACHE.modelBuffer) {
        this.log(`Fetching model from ${MODEL_URL}...`);
        
        // Fetch the model with explicit headers
        const response = await fetch(MODEL_URL, {
          method: 'GET',
          headers: {
            'Accept': 'application/octet-stream'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch model: ${response.status} ${response.statusText}`);
        }
        
        // Cache the model buffer
        CACHE.modelBuffer = await response.arrayBuffer();
        this.log(`Model fetched, size: ${CACHE.modelBuffer.byteLength} bytes`);
      } else {
        this.log('Using cached model buffer');
      }
      
      // Try to create session with cached buffer
      const sessionOptions = {
        executionProviders: ['wasm']
      };
      
      this.session = await ort.InferenceSession.create(CACHE.modelBuffer, sessionOptions);
      this.log(`Model loaded successfully`);
      this.log(`Input names: ${this.session.inputNames.join(', ')}`);
      this.log(`Output names: ${this.session.outputNames.join(', ')}`);
      
      // Cache the session
      CACHE.session = this.session;
      this.isInitialized = true;
      return true;
    } catch (error) {
      this.log(`Initialization error: ${error.message}`);
      throw new Error(`Failed to initialize ONNX model: ${error.message}`);
    }
  }

  // Apply BPE to a single word
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

  // Tokenize text python-style
  tokenizePythonStyle(text) {
    // Check cache first
    const cacheKey = `${text}_python`;
    if (CACHE.tokenizations[cacheKey]) {
      return CACHE.tokenizations[cacheKey];
    }
    
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
    
    // Cache the result
    CACHE.tokenizations[cacheKey] = tokenIds;
    return tokenIds;
  }

  // Tokenize text for emotion analysis - with caching
  tokenizeText(inputText) {
    // Check cache first
    const cacheKey = `${inputText}_full`;
    if (CACHE.tokenizations[cacheKey]) {
      return CACHE.tokenizations[cacheKey];
    }
    
    this.log(`Tokenizing text: "${inputText}"`);
    
    // Use Python-style tokenization
    const tokenIds = this.tokenizePythonStyle(inputText);
    
    // Add BOS and EOS tokens
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
    
    const result = {
      inputIds,
      attentionMask,
      words: inputText.split(/\s+/)
    };
    
    // Cache the result
    CACHE.tokenizations[cacheKey] = result;
    return result;
  }

  // Softmax function with temperature control
  softmax(logits, temperature = null) {
    // Use the configured temperature if not specified
    temperature = temperature || this.config.softmaxTemperature;
    
    // Apply temperature scaling
    const scaledLogits = logits.map(l => l / temperature);
    
    // Standard softmax
    const maxLogit = Math.max(...scaledLogits);
    const expValues = scaledLogits.map(val => Math.exp(val - maxLogit));
    const sumExp = expValues.reduce((sum, val) => sum + val, 0);
    return expValues.map(val => val / sumExp);
  }

  // Main analyze function - MODEL ONLY
  async analyzeEmotion(inputText, options = {}) {
    try {
      // Update config if options provided
      if (Object.keys(options).length > 0) {
        this.updateConfig(options);
      }
      
      // Create a cache key that includes the text and configuration
      const configStr = JSON.stringify(this.config);
      const cacheKey = `${inputText}_${configStr}`;
      
      // Check if we have a cached result
      if (CACHE.analysisResults[cacheKey]) {
        this.log(`Using cached analysis result for: "${inputText}"`);
        return CACHE.analysisResults[cacheKey];
      }
      
      // Make sure the analyzer is initialized
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      this.log(`Analyzing text: "${inputText}"`);
      
      // Tokenize the text
      const tokenization = this.tokenizeText(inputText);
      
      // Create tensors
      const inputIdsTensor = new ort.Tensor(
        'int64',
        new BigInt64Array(tokenization.inputIds.map(id => BigInt(id))),
        [1, tokenization.inputIds.length]
      );
      
      const attentionMaskTensor = new ort.Tensor(
        'int64',
        new BigInt64Array(tokenization.attentionMask.map(mask => BigInt(mask))),
        [1, tokenization.attentionMask.length]
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
        weightedLogits[neutralIndex] *= this.config.neutralWeight;
        this.log(`Applied neutral weight ${this.config.neutralWeight} (before: ${logits[neutralIndex].toFixed(3)}, after: ${weightedLogits[neutralIndex].toFixed(3)})`);
      }
      
      // Convert to probabilities with temperature
      const probabilities = this.softmax(weightedLogits.slice(0, EMOTION_LABELS.length));
      
      // Validate probabilities - make sure they're all valid numbers
      const validProbabilities = probabilities.map(prob => {
        if (isNaN(prob) || !isFinite(prob)) {
          this.log(`Warning: Invalid probability detected, replacing with 0`);
          return 0;
        }
        return prob;
      });
      
      // Normalize probabilities to sum to 1
      const probSum = validProbabilities.reduce((sum, prob) => sum + prob, 0);
      const normalizedProbabilities = probSum > 0 ? 
        validProbabilities.map(prob => prob / probSum) : 
        EMOTION_LABELS.map(() => 1 / EMOTION_LABELS.length); // Equal distribution fallback
      
      // Create emotion results with probabilities in the format expected by unified-text-input
      const emotionResults = EMOTION_LABELS.map((label, index) => ({
        label,
        prob: normalizedProbabilities[index], // Using 'prob' instead of 'probability'
        color: EMOTION_COLORS[label]
      }));
      
      // Sort by probability (highest first)
      emotionResults.sort((a, b) => b.prob - a.prob);
      
      // The dominant emotion is the first after sorting
      // Apply confidence threshold - if highest probability is below threshold, use neutral
      let predictedEmotion, confidence;
      
      if (emotionResults[0].prob < this.config.confidenceThreshold) {
        // Below threshold - find neutral in the results
        const neutralResult = emotionResults.find(e => e.label === 'neutral');
        if (neutralResult) {
          predictedEmotion = 'neutral';
          confidence = neutralResult.prob;
          this.log(`Top emotion (${emotionResults[0].label}) below threshold, using neutral instead`);
        } else {
          // Fallback to top emotion if neutral not found
          predictedEmotion = emotionResults[0].label;
          confidence = emotionResults[0].prob;
        }
      } else {
        // Above threshold - use top emotion
        predictedEmotion = emotionResults[0].label;
        confidence = emotionResults[0].prob;
      }
      
      // Create the final result object
      const result = {
        predictedEmotion,
        confidence,
        probability: confidence, // Keep both for backward compatibility
        emotions: emotionResults, // This now has 'prob' properties
        rawLogits: logits.slice(0, EMOTION_LABELS.length),
        weightedLogits: weightedLogits.slice(0, EMOTION_LABELS.length),
        tokenization,
        usedFallback: false, // This is pure model-based
        config: { ...this.config },  // Include configuration in the result
        text: inputText // Add the original text for tension calculation fallback
      };
      
      this.log(`Analysis complete: ${predictedEmotion} (${(confidence * 100).toFixed(2)}%)`);
      this.log(`Emotion probabilities: ${emotionResults.map(e => `${e.label}:${(e.prob * 100).toFixed(1)}%`).join(', ')}`);
      
      // Cache the result
      CACHE.analysisResults[cacheKey] = result;
      
      return result;
    } catch (error) {
      this.log(`Error in analysis: ${error.message}`);
      throw new Error(`Model-based analysis failed: ${error.message}`);
    }
  }
}

// Create the singleton instance
const analyzer = new EmotionAnalyzer();

// Helper function to create a new analyzer instance
function createEmotionAnalyzer(config = {}) {
  return new EmotionAnalyzer(config);
}

// Helper function for direct emotion analysis
async function analyzeEmotion(text, options = {}) {
  await analyzer.initialize();
  return analyzer.analyzeEmotion(text, options);
}

// React component with configuration options
function EmotionAnalyzerComponent({ 
  initialText = 'I feel really happy today!',
  initialConfig = {}
}) {
  // State hooks
  const [text, setText] = useState(initialText);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [error, setError] = useState(null);
  
  // Configuration state
  const [config, setConfig] = useState({
    neutralWeight: 0.7,
    confidenceThreshold: 0.15,
    softmaxTemperature: 1.0,
    ...initialConfig
  });
  
  const [showTokens, setShowTokens] = useState(false);

  // Initialize the analyzer when component mounts
  useEffect(() => {
    async function initAnalyzer() {
      setLoading(true);
      setError(null);
      
      try {
        // Update analyzer config
        analyzer.updateConfig(config);
        
        // Initialize
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

  // Handle config change
  const handleConfigChange = (key, value) => {
    setConfig({
      ...config,
      [key]: value
    });
  };

  // Analyze emotion when the analyze button is clicked
  const handleAnalyze = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    
    try {
      const analysisResult = await analyzer.analyzeEmotion(text, config);
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
        <h3 className="text-lg font-semibold mb-2">Model Settings</h3>
        
        <div className="mb-4 space-y-4">
          <div className="flex items-center">
            <label htmlFor="neutral-weight" className="w-48">Neutral Class Weight:</label>
            <input 
              type="range" 
              id="neutral-weight" 
              min="0.1" 
              max="1.5" 
              step="0.1" 
              value={config.neutralWeight} 
              onChange={(e) => handleConfigChange('neutralWeight', parseFloat(e.target.value))}
              className="flex-grow mx-2"
            />
            <span className="w-10 text-right">{config.neutralWeight}</span>
          </div>
          
          <div className="flex items-center">
            <label htmlFor="confidence-threshold" className="w-48">Min Confidence Threshold:</label>
            <input 
              type="range" 
              id="confidence-threshold" 
              min="0" 
              max="0.5" 
              step="0.01" 
              value={config.confidenceThreshold} 
              onChange={(e) => handleConfigChange('confidenceThreshold', parseFloat(e.target.value))}
              className="flex-grow mx-2"
            />
            <span className="w-10 text-right">{config.confidenceThreshold}</span>
          </div>
          
          <div className="flex items-center">
            <label htmlFor="softmax-temperature" className="w-48">Softmax Temperature:</label>
            <input 
              type="range" 
              id="softmax-temperature" 
              min="0.1" 
              max="2" 
              step="0.1" 
              value={config.softmaxTemperature} 
              onChange={(e) => handleConfigChange('softmaxTemperature', parseFloat(e.target.value))}
              className="flex-grow mx-2"
            />
            <span className="w-10 text-right">{config.softmaxTemperature}</span>
          </div>
        </div>
        
        <div className="flex items-center mb-4">
          <input 
            type="checkbox" 
            id="show-tokens" 
            checked={showTokens} 
            onChange={() => setShowTokens(!showTokens)}
            className="mr-2"
          />
          <label htmlFor="show-tokens">Show tokenization details</label>
        </div>
        
        {showTokens && result && result.tokenization && (
          <div className="mb-4 p-3 bg-gray-200 rounded text-sm font-mono overflow-x-auto">
            <div>Token IDs: [{result.tokenization.inputIds.join(', ')}]</div>
            <div>Attention Mask: [{result.tokenization.attentionMask.join(', ')}]</div>
            <div>Words: [{result.tokenization.words.join(', ')}]</div>
          </div>
        )}
      </div>
      
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Example Texts</h3>
        <div className="flex flex-wrap gap-2">
          {examples.map((example, index) => (
            <button
              key={index}
              onClick={() => setExampleText(example.text)}
              className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 rounded"
            >
              {example.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="mb-4">
        <label htmlFor="text" className="block font-semibold mb-2">
          Text to analyze:
        </label>
        <textarea
          id="text"
          value={text}
          onChange={handleTextChange}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2"
          rows="3"
          placeholder="Enter text to analyze..."
        ></textarea>
      </div>
      
      <div className="mb-6">
        <button
          onClick={handleAnalyze}
          disabled={loading || !modelLoaded}
          className={`px-4 py-2 rounded font-medium ${
            loading || !modelLoaded 
              ? 'bg-gray-300 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {loading ? 'Analyzing...' : 'Analyze Emotion'}
        </button>
        
        {!modelLoaded && !error && !loading && (
          <span className="ml-2 text-amber-600">Loading model...</span>
        )}
      </div>
      
      {error && (
        <div className="p-3 mb-4 bg-red-100 border border-red-300 text-red-800 rounded">
          {error}
        </div>
      )}
      
      {result && (
        <div className="p-4 bg-gray-100 rounded-lg">
          <h3 className="text-xl font-semibold mb-3">Analysis Result</h3>
          
          <div className="mb-4">
            <div className="text-lg">
              Predicted emotion: 
              <span 
                className="font-bold ml-2" 
                style={{ color: result.emotions.find(e => e.label === result.predictedEmotion)?.color }}
              >
                {result.predictedEmotion.toUpperCase()}
              </span>
              <span className="ml-2 text-gray-600">
                (Confidence: {(result.confidence * 100).toFixed(1)}%)
              </span>
            </div>
            
            {!result.usedFallback && (
              <div className="mt-1 text-green-600 text-sm">
                Using ONNX model-based analysis
              </div>
            )}
            
            {result.error && (
              <div className="mt-1 text-red-600 text-sm">
                Error occurred: {result.error}
              </div>
            )}
          </div>
          
          <div className="mb-4">
            <h4 className="font-semibold mb-2">Emotion Probabilities:</h4>
            <div className="space-y-2">
              {result.emotions.map(emotion => (
                <div key={emotion.label} className="flex items-center">
                  <div className="w-24">{emotion.label}</div>
                  <div className="flex-grow bg-gray-200 rounded-full h-4 mx-2">
                    <div 
                      className="h-4 rounded-full" 
                      style={{ 
                        width: `${emotion.prob * 100}%`,
                        backgroundColor: emotion.color
                      }}
                    ></div>
                  </div>
                  <div className="w-16 text-right">
                    {(emotion.prob * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {showTokens && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Raw Model Output:</h4>
              <div className="p-3 bg-gray-200 rounded text-sm font-mono overflow-x-auto">
                <div>Raw Logits: [{result.rawLogits.map(l => l.toFixed(3)).join(', ')}]</div>
                <div>Weighted Logits: [{result.weightedLogits.map(l => l.toFixed(3)).join(', ')}]</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Named exports - these must be at module level
export {
  analyzer as EmotionAnalyzer,
  EMOTION_LABELS,
  EMOTION_COLORS,
  analyzeEmotion,
  createEmotionAnalyzer
};

// Default export
export default EmotionAnalyzerComponent;