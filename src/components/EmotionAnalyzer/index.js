import { EmotionAnalyzer, analyzeEmotion, EMOTION_LABELS, EMOTION_COLORS } from '../../EmotionAnalyzer';
import EmotionalProfileDisplay from '../EmotionalProfileDisplay';

// Re-export everything
export { EmotionAnalyzer, analyzeEmotion, EMOTION_LABELS, EMOTION_COLORS };

// Export the display component as default export (this is what App.js is looking for)
export default EmotionalProfileDisplay;