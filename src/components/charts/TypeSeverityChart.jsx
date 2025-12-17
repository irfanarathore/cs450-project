import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import './TypeSeverityChart.css';

function TypeSeverityChart({ data }) {
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

    const margin = { top: 20, right: 20, bottom: 80, left: 80 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    // Aggregate data by disaster type
    const aggregated = d3.rollup(
      data,
      (v) => ({
        avgCasualties: d3.mean(v, (d) => d.casualties),
        avgEconomicLoss: d3.mean(v, (d) => d.economic_loss_usd),
        count: v.length,
      }),
      (d) => d.disaster_type
    );

    // Convert to array and normalize economic loss for better visualization
    const chartData = Array.from(aggregated, ([type, values]) => ({
      type,
      avgCasualties: values.avgCasualties,
      avgEconomicLoss: values.avgEconomicLoss / 1000000, // Convert to millions
      count: values.count,
    })).sort((a, b) => b.avgCasualties - a.avgCasualties);

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr('width', dimensions.width)
      .attr('height', dimensions.height);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const x0Scale = d3
      .scaleBand()
      .domain(chartData.map((d) => d.type))
      .range([0, width])
      .padding(0.2);

    const x1Scale = d3
      .scaleBand()
      .domain(['casualties', 'economic_loss'])
      .range([0, x0Scale.bandwidth()])
      .padding(0.1);

    const yScale = d3
      .scaleLinear()
      .domain([
        0,
        Math.max(
          d3.max(chartData, (d) => d.avgCasualties),
          d3.max(chartData, (d) => d.avgEconomicLoss)
        ),
      ])
      .nice()
      .range([height, 0]);

    const colorScale = d3
      .scaleOrdinal()
      .domain(['casualties', 'economic_loss'])
      .range(['#667eea', '#f093fb']);

    // Draw bars
    const groups = g
      .selectAll('.bar-group')
      .data(chartData)
      .join('g')
      .attr('class', 'bar-group')
      .attr('transform', (d) => `translate(${x0Scale(d.type)},0)`);

    // Casualties bars
    groups
      .append('rect')
      .attr('class', 'bar casualties-bar')
      .attr('x', x1Scale('casualties'))
      .attr('y', (d) => yScale(d.avgCasualties))
      .attr('width', x1Scale.bandwidth())
      .attr('height', (d) => height - yScale(d.avgCasualties))
      .attr('fill', colorScale('casualties'))
      .on('mouseover', function (event, d) {
        d3.select(this).attr('opacity', 0.7);
        const tooltip = d3.select(tooltipRef.current);
        tooltip
          .html(
            `
            <strong>${d.type}</strong><br/>
            Avg Casualties: ${d.avgCasualties.toFixed(1)}<br/>
            Events: ${d.count}
          `
          )
          .style('display', 'block')
          .style('left', `${event.clientX + 10}px`)
          .style('top', `${event.clientY - 28}px`);
      })
      .on('mouseout', function () {
        d3.select(this).attr('opacity', 1);
        d3.select(tooltipRef.current).style('display', 'none');
      });

    // Economic loss bars
    groups
      .append('rect')
      .attr('class', 'bar economic-bar')
      .attr('x', x1Scale('economic_loss'))
      .attr('y', (d) => yScale(d.avgEconomicLoss))
      .attr('width', x1Scale.bandwidth())
      .attr('height', (d) => height - yScale(d.avgEconomicLoss))
      .attr('fill', colorScale('economic_loss'))
      .on('mouseover', function (event, d) {
        d3.select(this).attr('opacity', 0.7);
        const tooltip = d3.select(tooltipRef.current);
        tooltip
          .html(
            `
            <strong>${d.type}</strong><br/>
            Avg Economic Loss: $${d.avgEconomicLoss.toFixed(2)}M<br/>
            Events: ${d.count}
          `
          )
          .style('display', 'block')
          .style('left', `${event.clientX + 10}px`)
          .style('top', `${event.clientY - 28}px`);
      })
      .on('mouseout', function () {
        d3.select(this).attr('opacity', 1);
        d3.select(tooltipRef.current).style('display', 'none');
      });

    // Axes
    const xAxis = d3.axisBottom(x0Scale);
    const yAxis = d3.axisLeft(yScale).ticks(8);

    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end');

    g.append('g').attr('class', 'y-axis').call(yAxis);

    // Axis labels
    g.append('text')
      .attr('class', 'axis-label')
      .attr('x', width / 2)
      .attr('y', height + 70)
      .attr('text-anchor', 'middle')
      .text('Disaster Type');

    g.append('text')
      .attr('class', 'axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -60)
      .attr('text-anchor', 'middle')
      .text('Average Impact');
  }, [data, dimensions]);

  return (
    <div className="chart-wrapper">
      <h3 className="chart-title">Severity by Disaster Type</h3>
      <p className="chart-subtitle">
        Average casualties and economic loss (in millions USD) per event
      </p>

      <div className="legend">
        <div className="legend-item">
          <div
            className="legend-color"
            style={{ backgroundColor: '#667eea' }}
          ></div>
          <span className="legend-label">Avg Casualties</span>
        </div>
        <div className="legend-item">
          <div
            className="legend-color"
            style={{ backgroundColor: '#f093fb' }}
          ></div>
          <span className="legend-label">Avg Economic Loss ($M)</span>
        </div>
      </div>

      <svg ref={svgRef}></svg>
      <div ref={tooltipRef} className="tooltip"></div>
    </div>
  );
}

export default TypeSeverityChart;
