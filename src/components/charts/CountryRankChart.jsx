import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import './CountryRankChart.css';

function CountryRankChart({ data, metric, setMetric }) {
  const svgRef = useRef();
  const tooltipRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 600, height: 500 });

  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const width = svgRef.current.parentElement.clientWidth;
        setDimensions({ width, height: 500 });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!data || data.length === 0) return;

    const margin = { top: 20, right: 20, bottom: 60, left: 150 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    // Aggregate data by country
    const aggregated = d3.rollup(
      data,
      (v) => ({
        avgResponseTime: d3.mean(v, (d) => d.response_time_hours),
        avgCasualties: d3.mean(v, (d) => d.casualties),
        avgEconomicLoss: d3.mean(v, (d) => d.economic_loss_usd) / 1000000, // In millions
        count: v.length,
      }),
      (d) => d.country
    );

    // Convert to array
    let chartData = Array.from(aggregated, ([country, values]) => ({
      country,
      avgResponseTime: values.avgResponseTime,
      avgCasualties: values.avgCasualties,
      avgEconomicLoss: values.avgEconomicLoss,
      count: values.count,
    }));

    // Sort by selected metric
    const metricKey =
      metric === 'response_time_hours'
        ? 'avgResponseTime'
        : metric === 'casualties'
        ? 'avgCasualties'
        : 'avgEconomicLoss';

    chartData.sort((a, b) => b[metricKey] - a[metricKey]);

    // Limit to top 15 countries for readability
    chartData = chartData.slice(0, 15);

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr('width', dimensions.width)
      .attr('height', dimensions.height);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const yScale = d3
      .scaleBand()
      .domain(chartData.map((d) => d.country))
      .range([0, height])
      .padding(0.2);

    const xScale = d3
      .scaleLinear()
      .domain([0, d3.max(chartData, (d) => d[metricKey])])
      .nice()
      .range([0, width]);

    // Color scale based on values
    const colorScale = d3
      .scaleSequential()
      .domain([0, d3.max(chartData, (d) => d[metricKey])])
      .interpolator(d3.interpolateRdYlGn)
      .unknown('#ccc');

    // Reverse for response time (lower is better)
    const getColor =
      metric === 'response_time_hours'
        ? (value) =>
            d3.interpolateRdYlGn(
              1 - value / d3.max(chartData, (d) => d[metricKey])
            )
        : (value) => colorScale(value);

    // Draw bars
    g.selectAll('.bar')
      .data(chartData)
      .join('rect')
      .attr('class', 'bar')
      .attr('x', 0)
      .attr('y', (d) => yScale(d.country))
      .attr('width', (d) => xScale(d[metricKey]))
      .attr('height', yScale.bandwidth())
      .attr('fill', (d) => getColor(d[metricKey]))
      .on('mouseover', function (event, d) {
        d3.select(this).attr('opacity', 0.7);
        const tooltip = d3.select(tooltipRef.current);
        tooltip
          .html(
            `
            <strong>${d.country}</strong><br/>
            Events: ${d.count}<br/>
            Avg Response Time: ${d.avgResponseTime.toFixed(1)}h<br/>
            Avg Casualties: ${d.avgCasualties.toFixed(1)}<br/>
            Avg Economic Loss: $${d.avgEconomicLoss.toFixed(2)}M
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

    // Add value labels
    g.selectAll('.value-label')
      .data(chartData)
      .join('text')
      .attr('class', 'value-label')
      .attr('x', (d) => xScale(d[metricKey]) + 5)
      .attr('y', (d) => yScale(d.country) + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('font-size', '0.75rem')
      .attr('fill', '#333')
      .text((d) => d[metricKey].toFixed(1));

    // Axes
    const xAxis = d3.axisBottom(xScale).ticks(6);
    const yAxis = d3.axisLeft(yScale);

    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis);

    g.append('g').attr('class', 'y-axis').call(yAxis);

    // Axis label
    const metricLabel =
      metric === 'response_time_hours'
        ? 'Avg Response Time (hours)'
        : metric === 'casualties'
        ? 'Avg Casualties per Event'
        : 'Avg Economic Loss per Event ($M)';

    g.append('text')
      .attr('class', 'axis-label')
      .attr('x', width / 2)
      .attr('y', height + 45)
      .attr('text-anchor', 'middle')
      .text(metricLabel);
  }, [data, dimensions, metric]);

  return (
    <div className="chart-wrapper">
      <h3 className="chart-title">Country Performance Ranking</h3>
      <p className="chart-subtitle">Top 15 countries by selected metric</p>

      <div className="controls-inline">
        <label htmlFor="ranking-metric">Rank by:</label>
        <select
          id="ranking-metric"
          value={metric}
          onChange={(e) => setMetric(e.target.value)}
          className="metric-select"
        >
          <option value="response_time_hours">Avg Response Time</option>
          <option value="casualties">Avg Casualties per Event</option>
          <option value="economic_loss_usd">Avg Economic Loss per Event</option>
        </select>
      </div>

      <svg ref={svgRef}></svg>
      <div ref={tooltipRef} className="tooltip"></div>
    </div>
  );
}

export default CountryRankChart;
