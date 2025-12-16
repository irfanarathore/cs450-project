import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import './ResponseScatterChart.css';

function ResponseScatterChart({ data, yAxisMetric, setYAxisMetric }) {
  const svgRef = useRef();
  const tooltipRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });

  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const width = svgRef.current.parentElement.clientWidth;
        setDimensions({ width, height: 400 });
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!data || data.length === 0) return;

    // PERFORMANCE OPTIMIZATION: Sample data for scatterplot
    // For large datasets, show a representative sample to maintain performance
    const MAX_POINTS = 2000;
    let sampledData = data;
    
    if (data.length > MAX_POINTS) {
      // Systematic sampling: take every nth point to ensure representativeness
      const step = Math.floor(data.length / MAX_POINTS);
      sampledData = data.filter((_, index) => index % step === 0).slice(0, MAX_POINTS);
    }

    const margin = { top: 20, right: 120, bottom: 60, left: 80 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', dimensions.width)
      .attr('height', dimensions.height);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.response_time_hours)])
      .nice()
      .range([0, width]);

    const yValue = yAxisMetric === 'casualties' 
      ? d => d.casualties 
      : d => d.economic_loss_usd / 1000000; // Convert to millions

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, yValue)])
      .nice()
      .range([height, 0]);

    const types = Array.from(new Set(data.map(d => d.disaster_type)));
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
      .domain(types);

    const sizeScale = d3.scaleSqrt()
      .domain([0, d3.max(data, d => d.economic_loss_usd)])
      .range([3, 12]);

    // Draw circles
    g.selectAll('.dot')
      .data(sampledData)
      .join('circle')
      .attr('class', 'dot')
      .attr('cx', d => xScale(d.response_time_hours))
      .attr('cy', d => yScale(yValue(d)))
      .attr('r', d => sizeScale(d.economic_loss_usd))
      .attr('fill', d => colorScale(d.disaster_type))
      .attr('opacity', 0.6)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .on('mouseover', function(event, d) {
        d3.select(this)
          .attr('opacity', 1)
          .attr('stroke-width', 2);
        
        const tooltip = d3.select(tooltipRef.current);
        const yDisplay = yAxisMetric === 'casualties'
          ? `Casualties: ${d.casualties}`
          : `Economic Loss: $${(d.economic_loss_usd / 1000000).toFixed(2)}M`;
        
        tooltip
          .html(`
            <strong>${d.disaster_type}</strong><br/>
            ${d.country}<br/>
            ${d.date.toLocaleDateString()}<br/>
            Response Time: ${d.response_time_hours.toFixed(1)}h<br/>
            ${yDisplay}
          `)
          .style('display', 'block')
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 28}px`);
      })
      .on('mouseout', function() {
        d3.select(this)
          .attr('opacity', 0.6)
          .attr('stroke-width', 1);
        d3.select(tooltipRef.current).style('display', 'none');
      });

    // Axes
    const xAxis = d3.axisBottom(xScale).ticks(8);
    const yAxis = d3.axisLeft(yScale).ticks(8);

    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis);

    g.append('g')
      .attr('class', 'y-axis')
      .call(yAxis);

    // Axis labels
    g.append('text')
      .attr('class', 'axis-label')
      .attr('x', width / 2)
      .attr('y', height + 45)
      .attr('text-anchor', 'middle')
      .text('Response Time (hours)');

    const yLabel = yAxisMetric === 'casualties' 
      ? 'Casualties' 
      : 'Economic Loss ($M)';

    g.append('text')
      .attr('class', 'axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -60)
      .attr('text-anchor', 'middle')
      .text(yLabel);

    // Legend
    const legend = svg.append('g')
      .attr('class', 'legend-scatter')
      .attr('transform', `translate(${width + margin.left + 10},${margin.top})`);

    types.forEach((type, i) => {
      const legendRow = legend.append('g')
        .attr('transform', `translate(0,${i * 20})`);

      legendRow.append('circle')
        .attr('r', 5)
        .attr('fill', colorScale(type));

      legendRow.append('text')
        .attr('x', 10)
        .attr('y', 4)
        .attr('class', 'legend-text')
        .text(type);
    });

  }, [data, dimensions, yAxisMetric]);

  return (
    <div className="chart-wrapper">
      <h3 className="chart-title">Response Time vs. Impact</h3>
      <p className="chart-subtitle">
        Correlation between response speed and disaster impact
        {data.length > 2000 && ` (showing ${Math.min(2000, data.length).toLocaleString()} of ${data.length.toLocaleString()} points for performance)`}
      </p>
      
      <div className="controls-inline">
        <label>Y-Axis Metric:</label>
        <div className="radio-group">
          <label className="radio-label">
            <input
              type="radio"
              value="casualties"
              checked={yAxisMetric === 'casualties'}
              onChange={(e) => setYAxisMetric(e.target.value)}
            />
            Casualties
          </label>
          <label className="radio-label">
            <input
              type="radio"
              value="economic_loss_usd"
              checked={yAxisMetric === 'economic_loss_usd'}
              onChange={(e) => setYAxisMetric(e.target.value)}
            />
            Economic Loss (USD)
          </label>
        </div>
      </div>
      
      <svg ref={svgRef}></svg>
      <div ref={tooltipRef} className="tooltip"></div>
    </div>
  );
}

export default ResponseScatterChart;

