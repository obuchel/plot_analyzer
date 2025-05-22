import { useState, useEffect } from "react";
import { analyzeEmotion, EMOTION_LABELS, EMOTION_COLORS } from "./components/EmotionAnalyzer";
import NarrativeTensionVisualizer from './components/narrative-tension-visualizer';
import StorySegmenter from './components/story-segmenter';
import CharacterDangerProximityAnalyzer from './components/character-danger-proximity-analyzer';
import LinguisticFeatureAnalyzer from './components/linguistic-feature-analyzer';

// Define narrative structure elements
const NARRATIVE_STRUCTURE = [
  { name: "exposition", position: 0.0, tensionWeight: 0.5 },
  { name: "inciting incident", position: 0.12, tensionWeight: 0.8 },
  { name: "rising action", position: 0.4, tensionWeight: 1.2 },
  { name: "climax", position: 0.75, tensionWeight: 2.0 },
  { name: "falling action", position: 0.87, tensionWeight: 1.2 },
  { name: "resolution", position: 1.0, tensionWeight: 0.6 }
];

export default function NarrativeEmotionDashboard() {
  // Text content states
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [segments, setSegments] = useState([]);
  const [segmentCount, setSegmentCount] = useState(6);
  
  // Analysis states
  const [result, setResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [neutralWeight, setNeutralWeight] = useState(0.1);
  const [useStorySpecificTerms, setUseStorySpecificTerms] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  // Visualization type
  const [visualizationType, setVisualizationType] = useState("stacked-area");
  
  // Analysis results for different components
  const [tensionAnalysis, setTensionAnalysis] = useState(null);
  const [emotionProfile, setEmotionProfile] = useState(null);
  const [actionPace, setActionPace] = useState(null);
  const [linguisticAnalysis, setLinguisticAnalysis] = useState(null);
  const [segmentAnalysis, setSegmentAnalysis] = useState(null);
  const [dangerAnalysis, setDangerAnalysis] = useState(null);

  // Example text for the application
  const exampleText = `Once upon a time there was an old mother pig who had three little pigs and not enough food to feed them. So when they were old enough, she sent them out into the world to seek their fortunes. The first little pig was very lazy. He didn't want to work at all and he built his house out of straw. The second little pig worked a little bit harder but he was somewhat lazy too and he built his house out of sticks. Then, they sang and danced and played together the rest of the day.

The third little pig worked hard all day and built his house with bricks. It was a sturdy house complete with a fine fireplace and chimney. It looked like it could withstand the strongest winds.

The next day, a wolf happened to pass by the lane where the three little pigs lived; and he saw the straw house, and he smelled the pig inside. He thought the pig would make a mighty fine meal and his mouth began to water. So he huffed and he puffed and he blew the house down! The wolf opened his jaws very wide and bit down as hard as he could, but the first little pig escaped and ran away to hide with the second little pig.

The wolf continued down the lane and he passed by the second house made of sticks; and he saw the house, and he smelled the pigs inside. His mouth began to water again thinking of the fine dinner he would have. So he huffed and he puffed and he blew the house down! The wolf chased the two little pigs and they ran away to the third pig's house.

The wolf continued down the lane and he came to the third house. He peeked inside and saw the three little pigs. His mouth began to water thinking of the fine dinner he would have. So he huffed and he puffed but the house would not fall down! The wolf was getting very angry now and very hungry. He huffed, huffed, and he puffed, puffed, but he could not blow down that brick house.

But the wolf was a sly old wolf and he climbed up on the roof to look for a way into the brick house. The little pigs saw the wolf climb up on the roof and lit a roaring fire in the fireplace and placed on it a large kettle of water. When the wolf finally found the hole in the chimney he crawled down and KERSPLASH right into that kettle of water! The wolf howled and fled away from the pigs, and he never came back.`;

  // Initialize analyzer on component mount
  useEffect(() => {
    const initialize = async () => {
      try {
        // Call analyze with an empty string to trigger initialization
        await analyzeEmotion("test", { neutralWeight });
        setIsInitialized(true);
      } catch (err) {
        setError(`Failed to initialize: ${err.message}`);
      }
    };

    initialize();
  }, []);

  // Auto-segmentation based on narrative structure
  const autoSegmentText = () => {
    if (!text) return;
    
    const paragraphs = text.split(/\n\s*\n/);
    const totalParagraphs = paragraphs.length;
    
    // Basic segmentation based on narrative positions
    const newSegments = NARRATIVE_STRUCTURE.map((section, index) => {
      const startIdx = index === 0 ? 0 : Math.floor(NARRATIVE_STRUCTURE[index-1].position * totalParagraphs);
      const endIdx = Math.floor(section.position * totalParagraphs);
      
      // Get paragraphs for this segment
      const segmentParagraphs = paragraphs.slice(startIdx, endIdx || totalParagraphs);
      const content = segmentParagraphs.join('\n\n');
      
      return {
        id: index,
        name: section.name,
        content: content,
        position: section.position,
        tensionWeight: section.tensionWeight,
        dominantEmotion: null,
        wordCount: content.split(/\s+/).filter(Boolean).length
      };
    });
    
    setSegments(newSegments);
  };
  
  // Custom segmentation based on user input
  const customSegmentText = () => {
    if (!text) return;
    
    const paragraphs = text.split(/\n\s*\n/);
    const totalParagraphs = paragraphs.length;
    const segmentsCount = parseInt(segmentCount) || 6;
    
    // Divide text into equal segments
    const newSegments = [];
    const paragraphsPerSegment = Math.max(1, Math.floor(totalParagraphs / segmentsCount));
    
    for (let i = 0; i < segmentsCount; i++) {
      const startIdx = i * paragraphsPerSegment;
      const endIdx = (i === segmentsCount - 1) ? totalParagraphs : (i + 1) * paragraphsPerSegment;
      
      // Get paragraphs for this segment
      const segmentParagraphs = paragraphs.slice(startIdx, endIdx);
      const content = segmentParagraphs.join('\n\n');
      const position = i / (segmentsCount - 1);
      
      // Find closest narrative structure element
      const closestStructure = NARRATIVE_STRUCTURE.reduce((prev, curr) => {
        return (Math.abs(curr.position - position) < Math.abs(prev.position - position))
          ? curr : prev;
      });
      
      newSegments.push({
        id: i,
        name: `Segment ${i+1}`,
        content: content,
        position: position,
        tensionWeight: closestStructure.tensionWeight,
        dominantEmotion: null,
        wordCount: content.split(/\s+/).filter(Boolean).length
      });
    }
    
    setSegments(newSegments);
  };

  // Handle analyze button click
  const handleAnalyze = async () => {
    if (!text.trim() || segments.length === 0) {
      if (!text.trim()) {
        // If no text, use automatic segmentation on the example text
        setText(exampleText);
        setTimeout(() => {
          autoSegmentText();
        }, 100);
        return;
      }
      
      // If text but no segments, segment it first
      autoSegmentText();
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      // Analyze each segment
      const analyzedSegments = await Promise.all(
        segments.map(async (segment) => {
          // Analyze emotions
          const emotionResult = await analyzeEmotion(segment.content, { 
            neutralWeight,
            includeTokens: false
          });
          
          // Check if emotionResult.emotions exists and has items before accessing
          let dominantEmotion = "neutral";
          let emotionProbability = 0;
          
          if (emotionResult && emotionResult.emotions && emotionResult.emotions.length > 0) {
            dominantEmotion = emotionResult.emotions[0].label;
            emotionProbability = emotionResult.emotions[0].prob;
          }
          
          // Safe access to emotion probabilities
          const getEmotionProb = (label) => {
            if (!emotionResult || !emotionResult.emotions) return 0;
            const emotion = emotionResult.emotions.find(e => e.label === label);
            return emotion ? emotion.prob : 0;
          };
          
          return {
            ...segment,
            dominantEmotion,
            emotionProbability,
            emotions: emotionResult?.emotions || [],
            rawEmotions: {
              fear: getEmotionProb('fear'),
              anger: getEmotionProb('anger'),
              joy: getEmotionProb('joy'),
              sadness: getEmotionProb('sadness'),
              surprise: getEmotionProb('surprise'),
              // Generate values for additional emotions
              tension: Math.random() * 0.5 + getEmotionProb('fear') * 0.5,
              danger: Math.random() * 0.3 + getEmotionProb('fear') * 0.7,
              relief: Math.random() * 0.3 + getEmotionProb('joy') * 0.7
            }
          };
        })
      );
      
      setSegments(analyzedSegments);
      
      // Generate tension analysis
      const tensionData = analyzedSegments.map(segment => {
        // Calculate tension using formula from paper:
        // T_base = (F × 1.2) + (T × 1.5) + (D × 1.8) + (A × 0.8) + (S × 0.6) - (R × 0.7) - (J × 0.5)
        const { rawEmotions } = segment;
        const tension = (rawEmotions.fear * 1.2) +
                        (rawEmotions.tension * 1.5) +
                        (rawEmotions.danger * 1.8) +
                        (rawEmotions.anger * 0.8) +
                        (rawEmotions.surprise * 0.6) -
                        (rawEmotions.relief * 0.7) -
                        (rawEmotions.joy * 0.5);
        
        // Apply narrative structure weight
        const adjustedTension = tension * segment.tensionWeight;
        
        return {
          position: segment.position,
          name: segment.name, 
          tension: Math.max(0, Math.min(1, adjustedTension)),
          normalizedPosition: analyzedSegments.indexOf(segment) / (analyzedSegments.length - 1)
        };
      });
      
      setTensionAnalysis(tensionData);
      
      // Create segment analysis (similar to the image example)
      const segmentAnalysisData = {
        segments: analyzedSegments.map(segment => {
          // Calculate normalized tension value (0-10)
          const tensionPoint = tensionData.find(t => t.name === segment.name);
          const tensionValue = tensionPoint ? Math.round(tensionPoint.tension * 10) / 10 : 0;
          
          // Set action pace based on segment name
          let actionPace = "Moderate";
          if (segment.name === "exposition" || segment.name === "resolution") {
            actionPace = "Low";
          } else if (segment.name === "climax") {
            actionPace = "High";
          }
          
          // Get the top 3 emotions or fewer if not enough emotions
          const topEmotions = [...segment.emotions]
            .sort((a, b) => b.prob - a.prob)
            .slice(0, Math.min(3, segment.emotions.length))
            .map(e => ({
              name: e.label,
              value: Math.round(e.prob * 100)
            }));
          
          return {
            name: segment.name,
            tension: tensionValue,
            actionPace,
            dominantEmotions: topEmotions,
            content: segment.content.substring(0, 100) + (segment.content.length > 100 ? "..." : ""),
            fullContent: segment.content
          };
        })
      };
      
      setSegmentAnalysis(segmentAnalysisData);
      
      // Generate action pace data
      const paceData = analyzedSegments.map(segment => {
        // Set action pace based on segment name
        let basePace;
        
        if (segment.name === "exposition") {
          basePace = "Low";
        } else if (segment.name === "inciting incident") {
          basePace = "Moderate";
        } else if (segment.name === "rising action") {
          basePace = "Moderate";
        } else if (segment.name === "climax") {
          basePace = "High";
        } else if (segment.name === "falling action") {
          basePace = "Moderate";
        } else if (segment.name === "resolution") {
          basePace = "Low";
        } else {
          // For custom segments, generate based on position
          const pos = segment.position;
          if (pos < 0.2) basePace = "Low";
          else if (pos < 0.4) basePace = "Moderate";
          else if (pos < 0.6) basePace = "Moderate";
          else if (pos < 0.8) basePace = "High";
          else basePace = "Moderate";
        }
        
        // Calculate numeric value
        const paceValue = basePace === "Low" ? 2 + Math.random() * 2 :
                          basePace === "Moderate" ? 4 + Math.random() * 2 :
                          7 + Math.random() * 3;
        
        return {
          position: segment.position,
          name: segment.name,
          pace: basePace,
          value: paceValue,
          normalizedPosition: analyzedSegments.indexOf(segment) / (analyzedSegments.length - 1)
        };
      });
      
      setActionPace(paceData);
      
      // Extract character information
      const characters = [...new Set(text.match(/\b[A-Z][a-z]+\b/g) || ["Character"])];
      
      // Generate character danger analysis
      const characterData = characters
        .filter(name => !['The', 'He', 'She', 'It', 'They', 'A', 'An', 'I'].includes(name))
        .map(name => {
          // Simplified analysis - in a real implementation this would be more sophisticated
          const characterMentions = text.match(new RegExp(`\\b${name}\\b`, 'g')) || [];
          const mentionCount = characterMentions.length;
          
          // Generate segments where this character appears
          const segmentsWithCharacter = segments.filter(segment => 
            segment.content.includes(name)
          ).map(segment => segment.name);
          
          // Calculate danger level based on narrative position
          // More danger in rising action and climax
          let dangerProfile = [];
          analyzedSegments.forEach(segment => {
            if (segment.content.includes(name)) {
              let baseDanger = 0;
              
              if (segment.name === "exposition") {
                baseDanger = 0.1 + Math.random() * 0.2;
              } else if (segment.name === "inciting incident") {
                baseDanger = 0.3 + Math.random() * 0.2;
              } else if (segment.name === "rising action") {
                baseDanger = 0.5 + Math.random() * 0.3;
              } else if (segment.name === "climax") {
                baseDanger = 0.7 + Math.random() * 0.3;
              } else if (segment.name === "falling action") {
                baseDanger = 0.4 + Math.random() * 0.3;
              } else if (segment.name === "resolution") {
                baseDanger = 0.1 + Math.random() * 0.2;
              }
              
              dangerProfile.push({
                segment: segment.name,
                danger: baseDanger
              });
            }
          });
          
          // Overall danger is weighted average of segment dangers
          const averageDanger = dangerProfile.length > 0 
            ? dangerProfile.reduce((sum, item) => sum + item.danger, 0) / dangerProfile.length
            : 0;
          
          return {
            name,
            mentionCount,
            segmentsPresent: segmentsWithCharacter,
            dangerLevel: averageDanger,
            dangerProfile
          };
        })
        .filter(char => char.mentionCount > 1) // Filter out characters with few mentions
        .sort((a, b) => b.mentionCount - a.mentionCount); // Sort by mention count
      
      setDangerAnalysis({ characters: characterData });
      
      // Simulate linguistic features data
      const linguisticData = {
        readability: {
          fleschKincaid: Math.round(80 + Math.random() * 10),
          smog: Math.round(8 + Math.random() * 3),
          automatedReadability: Math.round(7 + Math.random() * 3)
        },
        complexity: {
          averageSentenceLength: Math.round((12 + Math.random() * 3) * 10) / 10,
          averageWordLength: Math.round((4.2 + Math.random() * 0.5) * 10) / 10,
          complexWords: Math.round(text.split(/\s+/).length * 0.12)
        },
        lexicalDiversity: {
          typeTokenRatio: Math.round((0.45 + Math.random() * 0.1) * 100) / 100,
          uniqueWords: [...new Set(text.toLowerCase().match(/\b[a-z]+\b/g))].length
        },
        partsOfSpeech: {
          nouns: Math.round(text.split(/\s+/).length * (0.2 + Math.random() * 0.05)),
          verbs: Math.round(text.split(/\s+/).length * (0.15 + Math.random() * 0.05)),
          adjectives: Math.round(text.split(/\s+/).length * (0.08 + Math.random() * 0.03)),
          adverbs: Math.round(text.split(/\s+/).length * (0.05 + Math.random() * 0.02))
        }
      };
      
      setLinguisticAnalysis(linguisticData);
      
      // Generate emotion profile data for the stacked area chart
      const emotionData = {};
      
      // Initialize emotion data structure for each emotion
      EMOTION_LABELS.forEach(emotion => {
        emotionData[emotion] = [];
      });
      
      // Add synthetic emotions
      ['tension', 'danger', 'relief'].forEach(emotion => {
        emotionData[emotion] = [];
      });
      
      // Populate emotion data for each segment
      analyzedSegments.forEach(segment => {
        const { rawEmotions } = segment;
        
        Object.entries(rawEmotions).forEach(([emotion, value]) => {
          if (emotionData[emotion]) {
            emotionData[emotion].push({
              position: segment.position,
              name: segment.name,
              value: value,
              normalizedPosition: analyzedSegments.indexOf(segment) / (analyzedSegments.length - 1)
            });
          }
        });
      });
      
      setEmotionProfile(emotionData);
      
      // Show results
      setShowResults(true);
      
    } catch (err) {
      setError(`Analysis failed: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Set example text
  const setExampleText = () => {
    setText(exampleText);
    autoSegmentText();
  };

  return (
    <div className="max-w-6xl mx-auto p-4 bg-indigo-400 min-h-screen">
      <div className="flex items-center justify-between p-4 bg-indigo-500 rounded-t-lg text-white">
        <h1 className="text-2xl font-bold">Narrative Emotion Analyzer</h1>
        <p className="text-sm">Analyze emotional arcs in text narratives</p>
        <button
          onClick={() => {}}
          className="px-3 py-1 bg-white text-indigo-600 rounded-lg text-sm"
        >
          Show Help
        </button>
      </div>
      
      {!showResults ? (
        <div className="bg-white p-6 rounded-b-lg shadow-md">
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-1">Title (optional):</label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter title..."
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-1">Text to analyze:</label>
            <textarea
              className="w-full p-3 border border-gray-300 rounded h-64"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text to analyze..."
            />
          </div>
          
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Number of segments:</label>
              <div className="flex">
                <input
                  type="number"
                  min="3"
                  max="12"
                  className="w-20 p-2 border border-gray-300 rounded"
                  value={segmentCount}
                  onChange={(e) => setSegmentCount(e.target.value)}
                />
                <button
                  onClick={autoSegmentText}
                  className="ml-2 px-4 py-2 bg-blue-500 text-white rounded"
                >
                  Automatic Segmentation
                </button>
                <button
                  onClick={customSegmentText}
                  className="ml-2 px-4 py-2 bg-gray-200 text-gray-700 rounded"
                >
                  Custom Segmentation
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-600 mb-1">Visualization Type:</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setVisualizationType("stacked-area")}
                  className={`px-4 py-2 rounded ${
                    visualizationType === "stacked-area" 
                      ? "bg-blue-500 text-white" 
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  Stacked Area
                </button>
                <button
                  onClick={() => setVisualizationType("line-chart")}
                  className={`px-4 py-2 rounded ${
                    visualizationType === "line-chart" 
                      ? "bg-blue-500 text-white" 
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  Line Chart
                </button>
                <button
                  onClick={() => setVisualizationType("bar-chart")}
                  className={`px-4 py-2 rounded ${
                    visualizationType === "bar-chart" 
                      ? "bg-blue-500 text-white" 
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  Bar Chart
                </button>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="use-story-specific-terms"
                checked={useStorySpecificTerms}
                onChange={(e) => setUseStorySpecificTerms(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="use-story-specific-terms" className="text-sm text-gray-600">
                Use story-specific emotional terms
              </label>
            </div>
          </div>
          
          <div className="flex justify-between">
            <button
              onClick={setExampleText}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded"
            >
              Load Example
            </button>
            
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !isInitialized}
              className={`px-4 py-2 rounded-lg text-white ${
                isAnalyzing || !isInitialized
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isAnalyzing ? "Analyzing..." : "Analyze"}
            </button>
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white p-4 rounded-b-lg shadow-md">
          <h2 className="text-xl font-bold mb-4 text-center">
            Analysis Results for "{title || "Untitled Text"}"
          </h2>
          
          {/* Narrative Tension Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">Narrative Tension</h3>
            <div className="h-64 bg-gray-50 p-4 rounded border border-gray-200">
              <NarrativeTensionVisualizer data={tensionAnalysis} />
            </div>
          </div>
          
          {/* Action Pace Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">Action Pace</h3>
            <div className="h-64 bg-gray-50 p-4 rounded border border-gray-200">
              {actionPace && (
                <div className="h-full flex items-end justify-between">
                  {actionPace.map((item, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div className="text-xs text-gray-500 mb-1">{item.pace}</div>
                      <div 
                        className={`w-16 ${
                          item.pace === "Low" ? "bg-teal-400" :
                          item.pace === "Moderate" ? "bg-yellow-400" :
                          "bg-orange-400"
                        }`}
                        style={{ height: `${item.value * 10}px` }}
                      ></div>
                      <div className="text-xs text-gray-500 mt-1">{item.name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Emotional Profile Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">Emotional Profile</h3>
            <div className="h-64 bg-gray-50 p-4 rounded border border-gray-200">
              {emotionProfile && (
                <div className="h-full relative">
                  {/* Example stacked area chart - in a real implementation, this would use a charting library */}
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <g>
                      {/* Create a layer for each emotion with gradients */}
                      <path d="M0,100 L0,70 C20,65 40,40 60,30 C80,20 100,15 100,20 L100,100 Z" fill="rgba(156, 39, 176, 0.7)" /> {/* fear */}
                      <path d="M0,70 L0,50 C20,45 40,25 60,20 C80,15 100,10 100,15 L100,20 C100,15 80,20 60,30 C40,40 20,65 0,70 Z" fill="rgba(229, 57, 53, 0.7)" /> {/* anger */}
                      <path d="M0,50 L0,40 C20,35 40,20 60,15 C80,10 100,5 100,10 L100,15 C100,10 80,15 60,20 C40,25 20,45 0,50 Z" fill="rgba(255, 193, 7, 0.7)" /> {/* joy */}
                      <path d="M0,40 L0,30 C20,25 40,15 60,10 C80,5 100,0 100,5 L100,10 C100,5 80,10 60,15 C40,20 20,35 0,40 Z" fill="rgba(63, 81, 181, 0.7)" /> {/* sadness */}
                    
                      {/* X-axis (positions) */}
                      <line x1="0" y1="100" x2="100" y2="100" stroke="#666" strokeWidth="0.5" />
                      
                      {/* Y-axis (emotion intensity) */}
                      <line x1="0" y1="0" x2="0" y2="100" stroke="#666" strokeWidth="0.5" />
                      
                      {/* Narrative structure positions */}
                      {NARRATIVE_STRUCTURE.map((section, index) => (
                        <line 
                          key={index}
                          x1={section.position * 100} 
                          y1="98" 
                          x2={section.position * 100} 
                          y2="100" 
                          stroke="#333" 
                          strokeWidth="0.5" 
                        />
                      ))}
                    </g>
                  </svg>
                </div>
              )}
              
              {/* Legend */}
              {emotionProfile && (
                <div className="flex flex-wrap justify-center gap-4 mt-2">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-purple-500 opacity-70 mr-1"></div>
                    <span className="text-xs">Fear</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-500 opacity-70 mr-1"></div>
                    <span className="text-xs">Anger</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-yellow-500 opacity-70 mr-1"></div>
                    <span className="text-xs">Joy</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-indigo-500 opacity-70 mr-1"></div>
                    <span className="text-xs">Sadness</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-orange-500 opacity-70 mr-1"></div>
                    <span className="text-xs">Surprise</span>
                  </div>
                </div>
              )}
            </div>
          </div>
                {/* Story Segmentation Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-2 text-indigo-700">Story Segmentation</h3>
        <div className="bg-gray-50 p-4 rounded border border-gray-200">
          {segmentAnalysis && (
            <StorySegmenter 
              segments={segmentAnalysis.segments}
              emotions={EMOTION_LABELS}
              colors={EMOTION_COLORS}
            />
          )}
        </div>
      </div>

      {/* Character Danger Proximity Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-2 text-indigo-700">Character Danger Proximity</h3>
        <div className="bg-gray-50 p-4 rounded border border-gray-200">
          {dangerAnalysis && (
            <CharacterDangerProximityAnalyzer 
              characters={dangerAnalysis.characters}
              segments={segments}
            />
          )}
        </div>
      </div>

      {/* Linguistic Features Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-2 text-indigo-700">Linguistic Features</h3>
        <div className="bg-gray-50 p-4 rounded border border-gray-200">
          {linguisticAnalysis && (
            <LinguisticFeatureAnalyzer 
              data={linguisticAnalysis}
            />
          )}
        </div>
      </div>

      {/* Back Button */}
      <div className="flex justify-center mt-6">
        <button
          onClick={() => setShowResults(false)}
          className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
        >
          Back to Analysis
        </button>
      </div>
    </div>
  )}
</div>
);
}