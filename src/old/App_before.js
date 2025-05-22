import React from 'react';
import EmotionAnalyzer from './components/python-equivalent-emotion-analyzer';
import NarrativeTensionVisualizer from './components/narrative-tension-visualizer';
import StorySegmenter from './components/story-segmenter';
import CharacterDangerProximityAnalyzer from './components/character-danger-proximity-analyzer';
import LinguisticFeatureAnalyzer from './components/linguistic-feature-analyzer';

/**
 * NarrativeAnalysisComponents - Main component that combines all narrative analysis components
 */
const NarrativeAnalysisComponents = () => {
  const [text, setText] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('emotion');
  
  // Handle text change
  const handleTextChange = (e) => {
    setText(e.target.value);
  };
  
  // Set example text
  const setExampleText = (type) => {
    const examples = {
      fear: `The forest grew darker with each step. John's heart pounded as branches reached out like skeletal hands in the dim light. A twig snapped somewhere behind him. He froze, straining to hear over his own ragged breathing. Another sound—closer now. Whatever had been following him for the last mile was closing in. He should never have come here alone.`,
      
      tension: `Sarah stared at the ticking bomb. Two minutes left. Her hands trembled as she examined the wires. Red? Blue? Yellow? One wrong move and everything would end. Sweat dripped onto the circuit board. A car door slammed outside—the others were returning. She had to decide. Now.`,
      
      action: `Glass shattered as Tom dove through the window. He rolled across concrete, bullets peppering the ground behind him. Running now, zigzagging between cars. The helicopter spotlight tracked him, sirens wailing closer. He sprinted toward the river. His only chance. Jump or surrender? Three seconds to decide.`,
      
      joy: `Emma couldn't stop smiling as she held the letter. After years of hard work and rejection, she'd finally been accepted. The sunlight seemed brighter through her apartment window, the air sweeter. She danced across the kitchen, laughing, and called her mother with the wonderful news. Everything was about to change.`,
      
      climax: `The villain's sword clashed against the hero's shield, sending sparks flying. "You can't win!" he snarled. Blood trickled down the hero's face as they circled each other on the narrow bridge. Below, lava bubbled and churned. One final battle. One last chance to save everything. The hero lunged forward with a mighty cry.`,
      
      resolution: `The storm had passed. Villagers emerged from their homes to survey the damage. Though trees had fallen and some roofs were damaged, everyone had survived. Children began clearing debris while elders prepared a community meal. Together, they would rebuild. The air felt clean, renewed—like a fresh chapter beginning.`
    };
    
    setText(examples[type]);
  };
  
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Narrative Analysis Tools</h1>
        <p style={styles.description}>
          A suite of components for analyzing narrative text, character dynamics, and linguistic features
        </p>
      </div>
      
      <div style={styles.inputSection}>
        <h2 style={styles.sectionTitle}>Text Input</h2>
        <textarea
          style={styles.textInput}
          value={text}
          onChange={handleTextChange}
          placeholder="Enter your story or narrative text here for analysis..."
          rows={8}
        />
        
        <div style={styles.exampleButtons}>
          <p style={styles.exampleLabel}>Try with examples:</p>
          <div style={styles.buttonGroup}>
            <button 
              style={styles.exampleButton}
              onClick={() => setExampleText('fear')}
            >
              Fear Scene
            </button>
            <button 
              style={styles.exampleButton}
              onClick={() => setExampleText('tension')}
            >
              Tension Scene
            </button>
            <button 
              style={styles.exampleButton}
              onClick={() => setExampleText('action')}
            >
              Action Scene
            </button>
            <button 
              style={styles.exampleButton}
              onClick={() => setExampleText('joy')}
            >
              Joy Scene
            </button>
            <button 
              style={styles.exampleButton}
              onClick={() => setExampleText('climax')}
            >
              Climax Scene
            </button>
            <button 
              style={styles.exampleButton}
              onClick={() => setExampleText('resolution')}
            >
              Resolution Scene
            </button>
          </div>
        </div>
      </div>
      
      <div style={styles.tabsContainer}>
        <div style={styles.tabs}>
          <button 
            style={{
              ...styles.tab,
              ...(activeTab === 'emotion' ? styles.activeTab : {})
            }}
            onClick={() => setActiveTab('emotion')}
          >
            Emotion Analysis
          </button>
          <button 
            style={{
              ...styles.tab,
              ...(activeTab === 'tension' ? styles.activeTab : {})
            }}
            onClick={() => setActiveTab('tension')}
          >
            Narrative Tension
          </button>
          <button 
            style={{
              ...styles.tab,
              ...(activeTab === 'segments' ? styles.activeTab : {})
            }}
            onClick={() => setActiveTab('segments')}
          >
            Story Segments
          </button>
          <button 
            style={{
              ...styles.tab,
              ...(activeTab === 'character' ? styles.activeTab : {})
            }}
            onClick={() => setActiveTab('character')}
          >
            Character-Danger
          </button>
          <button 
            style={{
              ...styles.tab,
              ...(activeTab === 'linguistic' ? styles.activeTab : {})
            }}
            onClick={() => setActiveTab('linguistic')}
          >
            Linguistic Features
          </button>
        </div>
        
        <div style={styles.tabContent}>
          {activeTab === 'emotion' && (
            <div>
              <EmotionAnalyzer text={text} />
            </div>
          )}
          
          {activeTab === 'tension' && (
            <div>
              <NarrativeTensionVisualizer text={text} />
            </div>
          )}
          
          {activeTab === 'segments' && (
            <div>
              <StorySegmenter text={text} />
            </div>
          )}
          
          {activeTab === 'character' && (
            <div>
              <CharacterDangerProximityAnalyzer text={text} />
            </div>
          )}
          
          {activeTab === 'linguistic' && (
            <div>
              <LinguisticFeatureAnalyzer text={text} />
            </div>
          )}
        </div>
      </div>
      
      <div style={styles.footer}>
        <p>These narrative analysis tools help writers understand and improve their storytelling techniques.</p>
      </div>
    </div>
  );
};

// Styles
const styles = {
  container: {
    fontFamily: 'Arial, sans-serif',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#fff'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  title: {
    color: '#2c3e50',
    marginBottom: '10px'
  },
  description: {
    color: '#7f8c8d',
    fontSize: '16px'
  },
  inputSection: {
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  sectionTitle: {
    color: '#2c3e50',
    marginTop: '0',
    marginBottom: '15px',
    fontSize: '20px'
  },
  textInput: {
    width: '100%',
    padding: '12px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '16px',
    resize: 'vertical'
  },
  exampleButtons: {
    marginTop: '15px'
  },
  exampleLabel: {
    margin: '0 0 10px 0',
    color: '#555',
    fontWeight: 'bold'
  },
  buttonGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px'
  },
  exampleButton: {
    padding: '8px 15px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.2s'
  },
  tabsContainer: {
    marginBottom: '30px'
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid #ddd',
    marginBottom: '20px',
    overflowX: 'auto'
  },
  tab: {
    padding: '12px 20px',
    backgroundColor: 'transparent',
    color: '#555',
    border: 'none',
    borderBottom: '3px solid transparent',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: 'bold',
    transition: 'all 0.2s',
    flexShrink: 0
  },
  activeTab: {
    color: '#3498db',
    borderBottom: '3px solid #3498db'
  },
  tabContent: {
    backgroundColor: '#fff',
    borderRadius: '4px',
    padding: '1px'
  },
  footer: {
    textAlign: 'center',
    padding: '20px 0',
    color: '#7f8c8d',
    borderTop: '1px solid #eee'
  }
};

export default NarrativeAnalysisComponents;