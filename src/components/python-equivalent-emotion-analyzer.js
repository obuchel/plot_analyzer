import React, { useState, useEffect, useRef } from 'react';
import * as ort from 'onnxruntime-web';

const EMOTION_LABELS = ['anger', 'disgust', 'fear', 'joy', 'neutral', 'sadness', 'surprise'];

const EMOTION_COLORS = {
  'anger': '#e53935',    // Red
  'disgust': '#8bc34a',  // Green
  'fear': '#9c27b0',     // Purple
  'joy': '#ffc107',      // Yellow
  'neutral': '#78909c',  // Blue-gray
  'sadness': '#3f51b5',  // Indigo
  'surprise': '#ff9800'  // Orange
};

const EXAMPLE_TEXTS = {
  'joy': 'The news about their promotion filled them with joy and excitement.',
  'anger': 'The betrayal left him feeling angry and bitter towards his former friend.',
  'surprise': 'She was surprised to find her birthday party waiting when she opened the door.',
  'disgust': 'The sight of the moldy food made her feel disgusted.',
  'fear': 'The dark shadows in the abandoned house made the children fearful.',
  'sadness': 'He felt a deep sadness remembering his childhood home was now gone.',
  'neutral': 'The weather report indicated clear skies for the weekend.'
};

const PythonEquivalentEmotionAnalyzer = () => {
  // State variables
  const [inputText, setInputText] = useState('he could hardly hold his tears');
  const [result, setResult] = useState({ message: 'Please load vocabulary and model files to begin.' });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [neutralWeight, setNeutralWeight] = useState(0.7);
  const [showTokens, setShowTokens] = useState(false);
  const [debugOutput, setDebugOutput] = useState([]);
  const [tokenInfo, setTokenInfo] = useState(null);
  
  // Model and vocab state
  const [modelFile, setModelFile] = useState(null);
  const [vocabFile, setVocabFile] = useState(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [vocabLoaded, setVocabLoaded] = useState(false);
  
  // Refs for model and tokenizer
  const sessionRef = useRef(null);
  const vocabMapRef = useRef(null);
  const mergesPairsRef = useRef({});

  // Add a log message
  const log = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugOutput(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(message);
  };

  // Set example text
  const setText = (text) => {
    setInputText(text);
  };

  // Generate BPE merges from vocabulary
  const generateBPEMerges = () => {
    log('Generating BPE merges from vocabulary...');
    
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
      log(`Added common BPE merge: ${first} + ${second} -> ${pair}`);
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
            log(`Inferred BPE merge: ${first} + ${second} -> ${first + second}`);
          }
        }
      }
      
      // Limit the number of inferred merges
      if (rank > 1000) break;
    }
    
    mergesPairsRef.current = mergesPairs;
    log(`Generated ${Object.keys(mergesPairs).length} BPE merges`);
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
    log(`Tokenizing with Python-compatible method: "${text}"`);
    
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
            log(`Unknown token: "${token}"`);
          }
        }
        
        // Store tokenization info if requested
        if (showTokens) {
          setTokenInfo({
            tokens: tokens,
            tokenIds: tokenIds
          });
        } else {
          setTokenInfo(null);
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
  
  // Handle file upload for vocabulary
  const handleVocabUpload = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;
      
      setVocabFile(file);
      log(`Loading vocabulary file: ${file.name}`);
      
      const text = await file.text();
      vocabMapRef.current = JSON.parse(text);
      
      log(`Loaded vocabulary with ${Object.keys(vocabMapRef.current).length} tokens`);
      
      // Generate BPE merges
      generateBPEMerges();
      
      // Signal vocab loaded
      setVocabLoaded(true);
      
    } catch (error) {
      log(`Error loading vocabulary: ${error.message}`);
      setVocabLoaded(false);
    }
  };
  
  // Handle file upload for model
  const handleModelUpload = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;
      
      setModelFile(file);
      log(`Loading model file: ${file.name}`);
      
      // Check if ONNX runtime is available
      if (typeof ort === 'undefined') {
        throw new Error('ONNX Runtime is not available');
      }
      
      const arrayBuffer = await file.arrayBuffer();
      
      try {
        sessionRef.current = await ort.InferenceSession.create(arrayBuffer);
      } catch (err) {
        log(`Basic settings failed: ${err.message}. Trying wasm backend...`);
        sessionRef.current = await ort.InferenceSession.create(arrayBuffer, {
          executionProviders: ['wasm']
        });
      }
      
      log('ONNX model loaded successfully');
      log(`Model inputs: ${sessionRef.current.inputNames.join(', ')}`);
      log(`Model outputs: ${sessionRef.current.outputNames.join(', ')}`);
      
      // Signal model loaded
      setModelLoaded(true);
      
    } catch (error) {
      log(`Error loading model: ${error.message}`);
      setModelLoaded(false);
    }
  };
  
  // Analyze emotion
  const analyzeEmotion = async () => {
    try {
      if (!sessionRef.current || !vocabLoaded) {
        setResult({ message: "Please load vocabulary and model files first" });
        return;
      }
      
      setIsAnalyzing(true);
      
      const textToAnalyze = inputText.trim();
      if (!textToAnalyze) {
        setResult({ message: 'Please enter some text to analyze.' });
        setIsAnalyzing(false);
        return;
      }
      
      log(`Analyzing text: "${textToAnalyze}"`);
      
      // Create tokenizer if needed
      const tokenizer = createTokenizer();
      
      // Tokenize text
      const encoded = tokenizer.encode(textToAnalyze);
      
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
      log('Running model inference...');
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
      log(`Raw logits: [${logits.slice(0, EMOTION_LABELS.length).map(l => l.toFixed(3)).join(', ')}]`);
      
      // Apply neutral weight
      const weightedLogits = [...logits];
      
      const neutralIndex = EMOTION_LABELS.indexOf('neutral');
      if (neutralIndex >= 0) {
        weightedLogits[neutralIndex] *= neutralWeight;
        log(`Applied neutral weight ${neutralWeight} (before: ${logits[neutralIndex].toFixed(3)}, after: ${weightedLogits[neutralIndex].toFixed(3)})`);
      }
      
      // Convert to probabilities
      const probabilities = softmax(weightedLogits.slice(0, EMOTION_LABELS.length));
      
      // Get predicted emotion
      const predictedIndex = probabilities.indexOf(Math.max(...probabilities));
      const predictedEmotion = EMOTION_LABELS[predictedIndex];
      
      // Sort emotions by probability
      const sortedEmotions = EMOTION_LABELS
        .map((label, index) => ({ label, prob: probabilities[index] }))
        .sort((a, b) => b.prob - a.prob);
      
      // Set result
      setResult({
        predictedEmotion,
        probability: probabilities[predictedIndex],
        emotions: sortedEmotions,
        rawLogits: logits.slice(0, EMOTION_LABELS.length),
        weightedLogits: weightedLogits.slice(0, EMOTION_LABELS.length)
      });
      
      log('Analysis complete');
      
    } catch (error) {
      log(`Error in analysis: ${error.message}`);
      setResult({ message: `Error: ${error.message}` });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Create result component
  const ResultDisplay = () => {
    if (result.message) {
      return <div>{result.message}</div>;
    }

    const { predictedEmotion, probability, emotions, rawLogits, weightedLogits } = result;

    return (
      <div>
        <h3 style={{ color: EMOTION_COLORS[predictedEmotion] }}>
          Top emotion: {predictedEmotion} ({(probability * 100).toFixed(2)}%)
        </h3>
        
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
          <thead>
            <tr>
              <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd', backgroundColor: '#f2f2f2' }}>Emotion</th>
              <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd', backgroundColor: '#f2f2f2' }}>Probability</th>
              <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd', backgroundColor: '#f2f2f2' }}>Visualization</th>
            </tr>
          </thead>
          <tbody>
            {emotions.map(({ label, prob }) => (
              <tr key={label}>
                <td style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>
                  {label === predictedEmotion ? <strong>{label}</strong> : label}
                </td>
                <td style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>
                  {(prob * 100).toFixed(2)}%
                </td>
                <td style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>
                  <div style={{ width: '100%', backgroundColor: '#f0f0f0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        height: '20px', 
                        width: `${Math.max(prob * 100, 1)}%`, 
                        backgroundColor: EMOTION_COLORS[label] 
                      }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#e8f4f8', borderRadius: '5px', fontSize: '14px' }}>
          <div><strong>Model Configuration:</strong></div>
          <div>Neutral Weight: {neutralWeight}</div>
          <div>Raw Logits: [{rawLogits.map(l => l.toFixed(3)).join(', ')}]</div>
          <div>Weighted Logits: [{weightedLogits.map(l => l.toFixed(3)).join(', ')}]</div>
        </div>
      </div>
    );
  };

  // Check if analysis can be performed
  const canAnalyze = modelLoaded && vocabLoaded && inputText.trim();

  // CSS styles
  const styles = {
    container: {
      fontFamily: 'Arial, sans-serif',
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
    },
    header: {
      color: '#2c3e50',
    },
    setupSection: {
      border: '1px solid #ddd',
      padding: '15px',
      borderRadius: '5px',
      marginBottom: '20px',
      backgroundColor: '#f9f9f9',
    },
    fileInputs: {
      marginBottom: '10px',
    },
    statusIndicator: {
      display: 'inline-block',
      width: '10px',
      height: '10px',
      borderRadius: '50%',
      marginRight: '8px',
    },
    statusLoaded: {
      backgroundColor: '#4CAF50',
    },
    statusNotLoaded: {
      backgroundColor: '#f44336',
    },
    textarea: {
      padding: '10px',
      borderRadius: '5px',
      border: '1px solid #ccc',
      fontSize: '14px',
      width: '100%',
      marginTop: '15px',
    },
    button: {
      padding: '10px 15px',
      backgroundColor: '#4CAF50',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      marginRight: '5px',
      marginBottom: '5px',
    },
    buttonDisabled: {
      backgroundColor: '#cccccc',
      cursor: 'not-allowed',
    },
    exampleTexts: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '5px',
      marginTop: '15px',
      marginBottom: '15px',
    },
    settings: {
      marginTop: '15px',
      paddingTop: '15px',
      borderTop: '1px solid #ddd',
    },
    neutralWeight: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginTop: '10px',
    },
    resultContainer: {
      marginTop: '20px',
      padding: '15px',
      border: '1px solid #ddd',
      borderRadius: '5px',
      backgroundColor: '#f9f9f9',
    },
    tokenDisplay: {
      marginTop: '10px',
      padding: '10px',
      backgroundColor: '#f5f5f5',
      borderRadius: '5px',
      fontFamily: 'monospace',
      fontSize: '12px',
      maxHeight: '120px',
      overflowY: 'auto',
    },
    debugOutput: {
      marginTop: '20px',
      padding: '10px',
      border: '1px solid #ccc',
      whiteSpace: 'pre',
      fontFamily: 'monospace',
      backgroundColor: '#f5f5f5',
      maxHeight: '300px',
      overflowY: 'auto',
      fontSize: '12px',
    },
    analyzeButtonContainer: {
      marginTop: '15px',
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Python-Equivalent Emotion Analysis</h2>
      
      <div style={styles.setupSection}>
        <h3>Step 1: Load Files</h3>
        
        <div style={styles.fileInputs}>
          <label htmlFor="vocab-file">Vocabulary File (JSON):</label>
          <input 
            type="file" 
            id="vocab-file" 
            accept=".json"
            onChange={handleVocabUpload}
          />
          <div>
            <span 
              style={{
                ...styles.statusIndicator, 
                ...(vocabLoaded ? styles.statusLoaded : styles.statusNotLoaded)
              }}
            ></span>
            {vocabLoaded 
              ? `Loaded: ${vocabFile?.name}` 
              : 'Not loaded'}
          </div>
        </div>
        
        <div style={styles.fileInputs}>
          <label htmlFor="model-file">Model File (ONNX):</label>
          <input 
            type="file" 
            id="model-file" 
            accept=".onnx"
            onChange={handleModelUpload}
          />
          <div>
            <span 
              style={{
                ...styles.statusIndicator, 
                ...(modelLoaded ? styles.statusLoaded : styles.statusNotLoaded)
              }}
            ></span>
            {modelLoaded 
              ? `Loaded: ${modelFile?.name}` 
              : 'Not loaded'}
          </div>
        </div>
      </div>
      
      <div style={styles.setupSection}>
        <h3>Step 2: Configure & Test</h3>
        
        <div style={styles.settings}>
          <div>
            <input 
              type="checkbox" 
              id="show-tokens" 
              checked={showTokens}
              onChange={(e) => setShowTokens(e.target.checked)}
            /> 
            <label htmlFor="show-tokens">Show tokenization details</label>
          </div>
          
          <div style={styles.neutralWeight}>
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
        
        {showTokens && tokenInfo && (
          <div style={styles.tokenDisplay}>
            <div><strong>Tokens:</strong> {tokenInfo.tokens.join(', ')}</div>
            <div><strong>Token IDs:</strong> {tokenInfo.tokenIds.join(', ')}</div>
          </div>
        )}
        
        <textarea 
          style={styles.textarea}
          rows="4" 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Enter text to analyze emotions..."
        />
        
        <div style={styles.exampleTexts}>
          {Object.entries(EXAMPLE_TEXTS).map(([emotion, text]) => (
            <button 
              key={emotion}
              style={{
                ...styles.button,
                backgroundColor: EMOTION_COLORS[emotion]
              }}
              onClick={() => setText(text)}
            >
              {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
            </button>
          ))}
        </div>
        
        <div style={styles.analyzeButtonContainer}>
          <button 
            style={{
              ...styles.button,
              ...(canAnalyze ? {} : styles.buttonDisabled)
            }}
            onClick={analyzeEmotion}
            disabled={!canAnalyze || isAnalyzing}
          >
            {isAnalyzing ? "Analyzing..." : "Analyze Emotion"}
          </button>
        </div>
      </div>
      
      <div style={styles.resultContainer}>
        {isAnalyzing ? (
          <div>Analyzing...</div>
        ) : (
          <ResultDisplay />
        )}
      </div>
      
      <div style={styles.debugOutput}>
        {debugOutput.map((message, index) => (
          <div key={index}>{message}</div>
        ))}
      </div>
    </div>
  );
};

export default PythonEquivalentEmotionAnalyzer;