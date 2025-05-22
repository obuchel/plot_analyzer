import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const D3TensionPlot = ({ data }) => {
  //console.log("data", data);
  const svgRef = useRef();
  const containerRef = useRef();

  // Sample data if none provided
  const defaultData = data;

  const tensionData = data?.tensionArc || defaultData;

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const container = containerRef.current;
    
    // Clear previous content
    svg.selectAll("*").remove();
    
    // Set up dimensions
    const margin = { top: 30, right: 30, bottom: 60, left: 60 };
    const containerWidth = container.clientWidth || 800;
    const containerHeight = 200;
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;
    
    svg
      .attr("width", containerWidth)
      .attr("height", containerHeight);
    
    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Set up scales
    const xScale = d3.scaleLinear()
      .domain([0, 1])
      .range([0, width]);
    
    const yScale = d3.scaleLinear()
      .domain([0, 1])
      .range([height, 0]);
    
    // Create gradient for the area under the curve
    const gradient = svg.append("defs")
      .append("linearGradient")
      .attr("id", "tension-gradient")
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", 0).attr("y1", height)
      .attr("x2", 0).attr("y2", 0);
    
    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#ff6b6b")
      .attr("stop-opacity", 0.1);
    
    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#ff6b6b")
      .attr("stop-opacity", 0.4);
    
    // Create smooth line generator with curve interpolation
    const line = d3.line()
      .x(d => xScale(d.position))
      .y(d => yScale(d.value))
      .curve(d3.curveCatmullRom.alpha(0.5)); // Smooth curve
    
    // Create area generator for fill
    const area = d3.area()
      .x(d => xScale(d.position))
      .y0(height)
      .y1(d => yScale(d.value))
      .curve(d3.curveCatmullRom.alpha(0.5));
    
    // Add grid lines
    const xGrid = g.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale)
        .tickSize(-height)
        .tickFormat("")
        .ticks(8)
      );
    
    const yGrid = g.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(yScale)
        .tickSize(-width)
        .tickFormat("")
        .ticks(6)
      );
    
    // Style grid lines
    svg.selectAll(".grid line")
      .attr("stroke", "#e0e0e0")
      .attr("stroke-width", 1)
      .attr("opacity", 0.7);
    
    svg.selectAll(".grid path")
      .attr("stroke-width", 0);
    
    // Add area under curve
    g.append("path")
      .datum(tensionData)
      .attr("class", "tension-area")
      .attr("d", area)
      .attr("fill", "url(#tension-gradient)");
    
    // Add the tension line with animation
    const path = g.append("path")
      .datum(tensionData)
      .attr("class", "tension-line")
      .attr("d", line)
      .attr("fill", "none")
      .attr("stroke", "#ff4757")
      .attr("stroke-width", 3)
      .attr("stroke-linecap", "round")
      .attr("stroke-linejoin", "round");
    
    // Animate the line drawing
    const totalLength = path.node().getTotalLength();
    path
      .attr("stroke-dasharray", totalLength + " " + totalLength)
      .attr("stroke-dashoffset", totalLength)
      .transition()
      .duration(2000)
      .ease(d3.easeLinear)
      .attr("stroke-dashoffset", 0);
    
    // Add data points with animation
    const dots = g.selectAll(".tension-dot")
      .data(tensionData)
      .enter().append("circle")
      .attr("class", "tension-dot")
      .attr("cx", d => xScale(d.position))
      .attr("cy", d => yScale(d.value))
      .attr("r", 0)
      .attr("fill", "#ff4757")
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);
    
    // Animate dots appearing
    dots.transition()
      .delay((d, i) => i * 200 + 500)
      .duration(300)
      .attr("r", 6);
    
    // Add hover effects to dots
    dots.on("mouseover", function(event, d) {
      d3.select(this)
        .transition()
        .duration(150)
        .attr("r", 8);
      
      // Show tooltip
      const tooltip = d3.select("body").append("div")
        .attr("class", "d3-tooltip")
        .style("position", "absolute")
        .style("background", "rgba(0, 0, 0, 0.8)")
        .style("color", "white")
        .style("padding", "8px 12px")
        .style("border-radius", "4px")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .style("opacity", 0);
      
      tooltip.html(`
        <strong>${d.label || 'Point'}</strong><br/>
        Position: ${Math.round(d.position * 100)}%<br/>
        Tension: ${Math.round(d.value * 100)}%
      `)
      .style("left", (event.pageX + 10) + "px")
      .style("top", (event.pageY - 10) + "px")
      .transition()
      .duration(200)
      .style("opacity", 1);
      
    }).on("mouseout", function() {
      d3.select(this)
        .transition()
        .duration(150)
        .attr("r", 6);
      
      d3.selectAll(".d3-tooltip").remove();
    });
    
    // Add axes
    const xAxis = g.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale)
        .tickFormat(d => `${Math.round(d * 100)}%`)
        .ticks(8)
      );
    
    const yAxis = g.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(yScale)
        .tickFormat(d => `${Math.round(d * 100)}%`)
        .ticks(6)
      );
    
    // Style axes
    svg.selectAll(".x-axis text, .y-axis text")
      .attr("font-size", "12px")
      .attr("fill", "#666");
    
    svg.selectAll(".x-axis path, .y-axis path")
      .attr("stroke", "#333")
      .attr("stroke-width", 1);
    
    svg.selectAll(".x-axis line, .y-axis line")
      .attr("stroke", "#333")
      .attr("stroke-width", 1);
    
    // Add axis labels
    g.append("text")
      .attr("class", "x-label")
      .attr("text-anchor", "middle")
      .attr("x", width / 2)
      .attr("y", height + 45)
      .attr("fill", "#333")
      .attr("font-size", "14px")
      .attr("font-weight", "500")
      .text("Narrative Progress");
    
    g.append("text")
      .attr("class", "y-label")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -40)
      .attr("fill", "#333")
      .attr("font-size", "14px")
      .attr("font-weight", "500")
      .text("Tension Level");
    
    // Add title
    svg.append("text")
      .attr("class", "chart-title")
      .attr("text-anchor", "middle")
      .attr("x", containerWidth / 2)
      .attr("y", 20)
      .attr("fill", "#333")
      .attr("font-size", "16px")
      .attr("font-weight", "600")
      .text("Narrative Tension Arc");
    
    // Add peak indicator
    const peakPoint = tensionData.reduce((max, point) => 
      point.value > max.value ? point : max
    );
    
    if (peakPoint.value > 0.5) {
      g.append("line")
        .attr("x1", xScale(peakPoint.position))
        .attr("y1", yScale(peakPoint.value))
        .attr("x2", xScale(peakPoint.position))
        .attr("y2", height)
        .attr("stroke", "#ff4757")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "3,3")
        .attr("opacity", 0.6);
      
      g.append("text")
        .attr("x", xScale(peakPoint.position))
        .attr("y", yScale(peakPoint.value) - 15)
        .attr("text-anchor", "middle")
        .attr("fill", "#ff4757")
        .attr("font-size", "12px")
        .attr("font-weight", "600")
        .text("Peak");
    }
    
    // Handle window resize
    const handleResize = () => {
      const newWidth = container.clientWidth || 800;
      if (Math.abs(newWidth - containerWidth) > 50) {
        // Redraw if significant size change
        setTimeout(() => {
          svg.selectAll("*").remove();
          // The effect will re-run due to the dependency array
        }, 100);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
    
  }, [data]);

  return (
    <div className="d3-plot-container">
      <div 
        ref={containerRef} 
        className="plot-wrapper"
        style={{
          width: '97%',
          minHeight: '170px',
          background: '#fafafa',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}
      >
        <svg ref={svgRef}></svg>
      </div>
      
      <div className="plot-info">
        <div className="info-card">
          <h4>📈 Tension Analysis</h4>
          <p>This smooth curve shows how narrative tension builds and releases throughout your story. The peak represents the climax, while valleys indicate moments of relief or setup.</p>
        </div>
        
        <div className="info-card">
          <h4>🎯 Interactive Features</h4>
          <p>Hover over the data points to see detailed tension values and narrative positions. The animated line drawing visualizes the tension flow.</p>
        </div>
      </div>
      
      <style jsx>{`
        .d3-plot-container {
          width: 100%;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .plot-wrapper {
          overflow: hidden;
        }
        
        .plot-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-top: 1rem;
        }
        
        .info-card {
          background: white;
          padding: 1rem;
          border-radius: 6px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .info-card h4 {
          margin: 0 0 0.5rem 0;
          color: #333;
          font-size: 14px;
        }
        
        .info-card p {
          margin: 0;
          color: #666;
          font-size: 13px;
          line-height: 1.4;
        }
        
        @media (max-width: 768px) {
          .plot-info {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default D3TensionPlot;