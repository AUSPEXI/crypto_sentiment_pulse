// src/components/SentimentSpeedometer.tsx
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface SentimentSpeedometerProps {
  value: number;
  size?: number;
  timestamp?: string;
}

const SentimentSpeedometer: React.FC<SentimentSpeedometerProps> = ({ value, size = 200, timestamp }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = 10;
    const radius = (size - margin * 2) / 2;
    const center = size / 2;

    const scale = d3.scaleLinear()
      .domain([0, 100])
      .range([-Math.PI / 2, Math.PI / 2]);

    const arc = d3.arc()
      .innerRadius(radius - 20)
      .outerRadius(radius)
      .startAngle(-Math.PI / 2)
      .endAngle(Math.PI / 2);

    const colorScale = d3.scaleLinear<string>()
      .domain([0, 50, 100])
      .range(['#ef4444', '#eab308', '#22c55e']);

    // Add background arc
    svg.append('path')
      .datum({ endAngle: Math.PI / 2 })
      .style('fill', '#e5e7eb')
      .attr('transform', `translate(${center},${center})`)
      .attr('d', arc as any);

    // Add value arc
    const valueArc = d3.arc()
      .innerRadius(radius - 20)
      .outerRadius(radius)
      .startAngle(-Math.PI / 2)
      .endAngle(scale(value));

    svg.append('path')
      .style('fill', colorScale(value))
      .attr('transform', `translate(${center},${center})`)
      .attr('d', valueArc as any);

    // Add value text
    svg.append('text')
      .attr('x', center)
      .attr('y', center + 10)
      .attr('text-anchor', 'middle')
      .style('font-size', '24px')
      .style('font-weight', 'bold')
      .style('fill', colorScale(value))
      .text(Math.round(value));

    // Add label
    svg.append('text')
      .attr('x', center)
      .attr('y', center - 30)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#6b7280')
      .text('Sentiment Score');

    // Add timestamp
    if (timestamp) {
      svg.append('text')
        .attr('x', center)
        .attr('y', center + 40)
        .attr('text-anchor', 'middle')
        .style('font-size', '10px')
        .style('fill', '#6b7280')
        .text(`Last updated: ${new Date(timestamp).toLocaleString()}`);
    }

    // Add positive/negative/neutral percentages below
    const positive = value > 50 ? (value - 50) * 2 : 0;
    const negative = value < 50 ? (50 - value) * 2 : 0;
    const neutral = Math.abs(50 - value) === 50 ? 100 : 0;

    svg.append('text')
      .attr('x', center - 40)
      .attr('y', center + 60)
      .attr('text-anchor', 'start')
      .style('font-size', '12px')
      .style('fill', '#22c55e')
      .text(`Positive: ${positive.toFixed(2)}%`);
    svg.append('text')
      .attr('x', center - 40)
      .attr('y', center + 75)
      .attr('text-anchor', 'start')
      .style('font-size', '12px')
      .style('fill', '#ef4444')
      .text(`Negative: ${negative.toFixed(2)}%`);
    svg.append('text')
      .attr('x', center - 40)
      .attr('y', center + 90)
      .attr('text-anchor', 'start')
      .style('font-size', '12px')
      .style('fill', '#6b7280')
      .text(`Neutral: ${neutral.toFixed(2)}%`);

  }, [value, size, timestamp]);

  return (
    <svg ref={svgRef} width={size} height={size + 100} className="mx-auto" /> // Increased height for text
  );
};

export default SentimentSpeedometer;
