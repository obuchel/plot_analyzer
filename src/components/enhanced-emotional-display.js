import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import EmotionAnalyzerComponent, { 
  EMOTION_COLORS, 
  EMOTION_LABELS, 
  analyzeEmotion, 
  createEmotionAnalyzer 
} from './EmotionAnalyzer';

// Main Stacked Emotional Arc Component
const StackedEmotionalArc = ({ data, neutralWeight = 0.1 }) => {
  const svgRef = useRef(null);
  
  // Define story sections for x-axis
  const storyStages = ["inciting incident", "rising action", "climax", "falling action", "resolution"];
  
  // All emotions to show in the visualization - exact order from EmotionAnalyzer.js
  const emotions = ['anger', 'disgust', 'fear', 'joy', 'neutral', 'sadness', 'surprise'];
  
  // Check if data exists and has the expected structure
  const hasValidData = data && (data.paragraphs || data.segments);

  useEffect(() => {
    if (!svgRef.current || !hasValidData) return;
    
    // Clear any existing SVG content
    d3.select(svgRef.current).selectAll("*").remove();
    
    // SVG dimensions
    const margin = { top: 20, right: 150, bottom: 60, left: 50 };
    const width = 1200 - margin.left - margin.right;
    const height = 350 - margin.top - margin.bottom;
    
    // Create SVG with correct syntax
    const svg = d3.select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    // Background rectangle for chart area
    svg.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "#f9f9f9")
      .attr("rx", 4)
      .attr("ry", 4);
    
    // Prepare data for stacked area chart
    const paragraphs = data.paragraphs || [];
    
    // Create data structure for stacked areas
    const stackData = [];
    
    // For each paragraph position, get the emotion intensities
    // Create more points for smoother curves by interpolating
    const numPoints = Math.max(20, paragraphs.length * 3);
    
    for (let i = 0; i < numPoints; i++) {
      const position = i / (numPoints - 1);
      const dataPoint = { position };
      
      // Initialize all emotions to 0
      emotions.forEach(function(emotion) {
        dataPoint[emotion] = 0;
      });
      
      // Find the nearest paragraphs and interpolate
      if (paragraphs.length > 1) {
        const exactIdx = position * (paragraphs.length - 1);
        const lowerIdx = Math.floor(exactIdx);
        const upperIdx = Math.ceil(exactIdx);
        const weight = exactIdx - lowerIdx;
        
        if (lowerIdx === upperIdx) {
          // Exactly on a paragraph point
          const paragraph = paragraphs[lowerIdx];
          if (paragraph.emotions) {
            paragraph.emotions.forEach(function(emotion) {
              // Apply neutral weight if this is the neutral emotion
              if (emotion.label === 'neutral') {
                dataPoint[emotion.label] = emotion.prob * neutralWeight;
              } else {
                dataPoint[emotion.label] = emotion.prob;
              }
            });
          } else {
            // If no emotions array, use dominant emotion
            emotions.forEach(function(emotion) {
              if (emotion === 'neutral') {
                dataPoint[emotion] = (emotion === paragraph.dominant ? 1 : 0) * neutralWeight;
              } else {
                dataPoint[emotion] = emotion === paragraph.dominant ? 1 : 0;
              }
            });
          }
        } else {
          // Between paragraphs - interpolate
          const lowerPara = paragraphs[lowerIdx];
          const upperPara = paragraphs[upperIdx];
          
          emotions.forEach(function(emotion) {
            let lowerValue = 0;
            let upperValue = 0;
            
            // Get values from lower paragraph
            if (lowerPara.emotions) {
              const emotionObj = lowerPara.emotions.find(function(e) { 
                return e.label === emotion; 
              });
              lowerValue = emotionObj ? emotionObj.prob : 0;
              // Apply neutral weight
              if (emotion === 'neutral') {
                lowerValue = lowerValue * neutralWeight;
              }
            } else {
              lowerValue = emotion === lowerPara.dominant ? 1 : 0;
              // Apply neutral weight
              if (emotion === 'neutral') {
                lowerValue = lowerValue * neutralWeight;
              }
            }
            
            // Get values from upper paragraph
            if (upperPara.emotions) {
              const emotionObj = upperPara.emotions.find(function(e) { 
                return e.label === emotion; 
              });
              upperValue = emotionObj ? emotionObj.prob : 0;
              // Apply neutral weight
              if (emotion === 'neutral') {
                upperValue = upperValue * neutralWeight;
              }
            } else {
              upperValue = emotion === upperPara.dominant ? 1 : 0;
              // Apply neutral weight
              if (emotion === 'neutral') {
                upperValue = upperValue * neutralWeight;
              }
            }
            
            // Interpolate
            dataPoint[emotion] = lowerValue * (1 - weight) + upperValue * weight;
          });
        }
      } else if (paragraphs.length === 1) {
        // Only one paragraph
        const paragraph = paragraphs[0];
        if (paragraph.emotions) {
          paragraph.emotions.forEach(function(emotion) {
            // Apply neutral weight if this is the neutral emotion
            if (emotion.label === 'neutral') {
              dataPoint[emotion.label] = emotion.prob * neutralWeight;
            } else {
              dataPoint[emotion.label] = emotion.prob;
            }
          });
        } else {
          // If no emotions array, use dominant emotion
          emotions.forEach(function(emotion) {
            if (emotion === 'neutral') {
              dataPoint[emotion] = (emotion === paragraph.dominant ? 1 : 0) * neutralWeight;
            } else {
              dataPoint[emotion] = emotion === paragraph.dominant ? 1 : 0;
            }
          });
        }
      }
      
      stackData.push(dataPoint);
    }
    
    // X scale based on position in narrative (0 to 1)
    const x = d3.scaleLinear()
      .domain([0, 1])
      .range([0, width]);
    
    // Y scale for stacked values
    const y = d3.scaleLinear()
      .domain([0, 1.05]) // Slightly higher than 1 to give some space at top
      .range([height, 0]);
    
    // Stack generator - use normalized stacking to ensure areas sum to 1
    const stack = d3.stack()
      .keys(emotions)
      .order(d3.stackOrderDescending) // Reverse order to match reference image
      .offset(d3.stackOffsetNone);
    
    // Apply stack generator to data
    const stackedData = stack(stackData);
    
    // Area generator with smooth curves
    const area = d3.area()
      .x(function(d) { return x(d.data.position); })
      .y0(function(d) { return y(d[0]); })
      .y1(function(d) { return y(d[1]); })
      .curve(d3.curveBasis); // Use basis curve for smoother appearance
    
    // Draw stacked areas
    svg.selectAll(".emotion-area")
      .data(stackedData)
      .join("path")
      .attr("class", "emotion-area")
      .attr("d", area)
      .attr("fill", function(d) { return EMOTION_COLORS[d.key]; })
      .attr("opacity", 0.9); // Slightly transparent like in reference
    
    // Add grid lines (subtle, as in reference)
    // Horizontal grid lines
    const yTicks = y.ticks(5);
    svg.selectAll(".y-grid-line")
      .data(yTicks)
      .join("line")
      .attr("class", "y-grid-line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", function(d) { return y(d); })
      .attr("y2", function(d) { return y(d); })
      .attr("stroke", "#e0e0e0")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3,3");
    
    // Bottom axis (x-axis) with story stages
    svg.append("line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", height)
      .attr("y2", height)
      .attr("stroke", "#ccc")
      .attr("stroke-width", 1);
    
    // Add story stage labels
    storyStages.forEach(function(stage, i) {
      const xPos = (i / (storyStages.length - 1)) * width;
      
      // Tick mark
      svg.append("line")
        .attr("x1", xPos)
        .attr("x2", xPos)
        .attr("y1", height)
        .attr("y2", height + 5)
        .attr("stroke", "#999")
        .attr("stroke-width", 1);
        
      // Stage label
      svg.append("text")
        .attr("x", xPos)
        .attr("y", height + 20)
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .style("fill", "#666")
        .style("font-family", "sans-serif")
        .text(stage);
    });
    
    // Left axis (y-axis) with emotion intensity values
    svg.append("line")
      .attr("x1", 0)
      .attr("x2", 0)
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", "#ccc")
      .attr("stroke-width", 1);
    
    // Y-axis ticks and labels
    yTicks.forEach(function(tick) {
      // Tick mark
      svg.append("line")
        .attr("x1", -5)
        .attr("x2", 0)
        .attr("y1", y(tick))
        .attr("y2", y(tick))
        .attr("stroke", "#999")
        .attr("stroke-width", 1);
        
      // Value label
      svg.append("text")
        .attr("x", -10)
        .attr("y", y(tick))
        .attr("text-anchor", "end")
        .attr("dominant-baseline", "middle")
        .style("font-size", "10px")
        .style("fill", "#666")
        .style("font-family", "sans-serif")
        .text(tick);
    });
    
    // Title at top of chart (similar to reference image)
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -5)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("fill", "#333")
      .style("font-weight", "bold")
      .style("font-family", "sans-serif")
      .text("Emotional Profile (Neutral Weight: " + neutralWeight + ")");
    
    // Add legend to right side
    const legend = svg.append("g")
      .attr("transform", "translate(" + (width + 20) + ", 10)");
    
    const legendTitle = legend.append("text")
      .attr("x", 0)
      .attr("y", -5)
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .style("font-family", "sans-serif")
      .text("Emotions");
    
    // Draw legend items - order to match stack order (reversed)
    const orderedEmotions = emotions.slice().reverse();
    
    orderedEmotions.forEach(function(emotion, i) {
      const legendItem = legend.append("g")
        .attr("transform", "translate(0, " + (i * 20 + 10) + ")");
        
      // Color box
      legendItem.append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("rx", 2)
        .attr("ry", 2)
        .attr("fill", EMOTION_COLORS[emotion]);
        
      // Emotion label
      legendItem.append("text")
        .attr("x", 20)
        .attr("y", 9)
        .style("font-size", "11px")
        .style("font-family", "sans-serif")
        .style("text-transform", "capitalize")
        .text(emotion);
    });
  }, [data, hasValidData, neutralWeight]);

  return (
    <div className="emotion-visualization-container">
      <div className="chart-container">
        {hasValidData ? (
          <svg ref={svgRef}></svg>
        ) : (
          <div className="no-data-message">No emotional data available for visualization</div>
        )}
      </div>
      
      <style>
      {
        ".emotion-visualization-container {" +
        "  padding: 1rem;" +
        "  background-color: white;" +
        "  border-radius: 8px;" +
        "  margin-bottom: 2rem;" +
        "  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;" +
        "  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);" +
        "}" +
        
        "h2, h3 {" +
        "  text-align: center;" +
        "  margin-bottom: 1.5rem;" +
        "  color: #333;" +
        "}" +
        
        ".chart-container {" +
        "  display: flex;" +
        "  justify-content: center;" +
        "  overflow-x: auto;" +
        "  padding: 0.5rem;" +
        "  min-height: 350px;" +
        "}" +
        
        ".no-data-message {" +
        "  display: flex;" +
        "  align-items: center;" +
        "  justify-content: center;" +
        "  color: #757575;" +
        "  font-style: italic;" +
        "  height: 300px;" +
        "  width: 100%;" +
        "}" +
        
        "svg {" +
        "  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;" +
        "}"
      }
      </style>
    </div>
  );
};

// Example usage with different ways to set neutral weight
const ExampleUsage = () => {
  const [neutralWeight, setNeutralWeight] = React.useState(0.1);
  
  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <label>
          Neutral Weight: 
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.1"
            value={neutralWeight}
            onChange={(e) => setNeutralWeight(parseFloat(e.target.value))}
          />
          {neutralWeight}
        </label>
      </div>
      
      <StackedEmotionalArc 
        data={yourData} 
        neutralWeight={neutralWeight} 
      />
    </div>
  );
};

export default StackedEmotionalArc;