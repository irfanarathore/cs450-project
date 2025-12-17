import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import './TimeTrendChart.css';

function TimeTrendChart({ data }) {
  const svgRef = useRef();
  const tooltipRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });
  const [hiddenTypes, setHiddenTypes] = useState(new Set());

  useEffect(() => {
    // Responsive sizing
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

    const margin = { top: 20, right: 120, bottom: 60, left: 60 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    // Aggregate data by year and disaster type
    const nested = d3.rollup(
      data,
      (v) => v.length,
      (d) => d.year,
      (d) => d.disaster_type
    );

    // Get all years and types
    const years = Array.from(new Set(data.map((d) => d.year))).sort();
    const types = Array.from(new Set(data.map((d) => d.disaster_type))).sort();

    // Create data structure for stacking
    const stackData = years.map((year) => {
      const obj = { year };
      types.forEach((type) => {
        obj[type] = nested.get(year)?.get(type) || 0;
      });
      return obj;
    });

    // Filter out hidden types
    const visibleTypes = types.filter((t) => !hiddenTypes.has(t));

    // Stack the data
    const stack = d3
      .stack()
      .keys(visibleTypes)
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetNone);

    const series = stack(stackData);

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr('width', dimensions.width)
      .attr('height', dimensions.height);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleLinear().domain(d3.extent(years)).range([0, width]);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(series, (s) => d3.max(s, (d) => d[1]))])
      .nice()
      .range([height, 0]);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(types);

    // Area generator
    const area = d3
      .area()
      .x((d) => xScale(d.data.year))
      .y0((d) => yScale(d[0]))
      .y1((d) => yScale(d[1]))
      .curve(d3.curveMonotoneX);

    // Draw areas
    g.selectAll('.area')
      .data(series)
      .join('path')
      .attr('class', 'area')
      .attr('d', area)
      .attr('fill', (d) => colorScale(d.key))
      .attr('opacity', 0.7)
      .on('mouseover', function (event, d) {
        d3.select(this).attr('opacity', 1);
        const tooltip = d3.select(tooltipRef.current);
        tooltip.style('display', 'block');
      })
      .on('mousemove', function (event, d) {
        const [x] = d3.pointer(event);
        const year = Math.round(xScale.invert(x));
        const yearData = stackData.find((item) => item.year === year);

        if (yearData) {
          const tooltip = d3.select(tooltipRef.current);
          tooltip
            .html(
              `<strong>${year}</strong><br/>${d.key}: ${yearData[d.key]} events`
            )
            .style('left', `${event.clientX + 10}px`)
            .style('top', `${event.clientY - 28}px`);
        }
      })
      .on('mouseout', function () {
        d3.select(this).attr('opacity', 0.7);
        d3.select(tooltipRef.current).style('display', 'none');
      });

    // Axes
    const xAxis = d3.axisBottom(xScale).tickFormat(d3.format('d'));
    const yAxis = d3.axisLeft(yScale);

    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis);

    g.append('g').attr('class', 'y-axis').call(yAxis);

    // Axis labels
    g.append('text')
      .attr('class', 'axis-label')
      .attr('x', width / 2)
      .attr('y', height + 45)
      .attr('text-anchor', 'middle')
      .text('Year');

    g.append('text')
      .attr('class', 'axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -45)
      .attr('text-anchor', 'middle')
      .text('Number of Events');
  }, [data, dimensions, hiddenTypes]);

  const toggleType = (type) => {
    setHiddenTypes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  const types = Array.from(new Set(data.map((d) => d.disaster_type))).sort();
  const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(types);

  return (
    <div className="chart-wrapper">
      <h3 className="chart-title">Disaster Frequency Over Time</h3>
      <p className="chart-subtitle">
        Stacked area chart showing trends by disaster type (2018-2024)
      </p>

      <div className="legend">
        {types.map((type) => (
          <div
            key={type}
            className={`legend-item ${hiddenTypes.has(type) ? 'hidden' : ''}`}
            onClick={() => toggleType(type)}
          >
            <div
              className="legend-color"
              style={{ backgroundColor: colorScale(type) }}
            ></div>
            <span className="legend-label">{type}</span>
          </div>
        ))}
      </div>

      <svg ref={svgRef}></svg>
      <div ref={tooltipRef} className="tooltip"></div>
    </div>
  );
}

export default TimeTrendChart;
