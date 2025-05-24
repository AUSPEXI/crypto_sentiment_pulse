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

    // Scale for the arc (0 to 100 maps to 0 to 180 degrees)
    const scale = d3.scaleLinear()
      .domain([0, 100])
      .range([0, Math.PI]); // 0 to 180 degrees

    // Arc generator for the background
    const backgroundArc = d3.arc()
      .innerRadius(radius - 20)
      .outerRadius(radius)
      .startAngle(0)
      .endAngle(Math.PI);

    // Arc generator for the value
    const valueArc = d3.arc()
      .innerRadius(radius - 20)
      .outerRadius(radius)
      .startAngle(0)
      .endAngle(scale(value));

    // Color scale based on sentiment
    const colorScale = d3.scaleLinear<string>()
      .domain([0, 50, 100])
      .range(['#ef4444', '#eab308', '#22c55e']);

    // Add background arc
    svg.append('path')
      .datum({ endAngle: Math.PI })
      .style('fill', '#e5e7eb')
      .attr('transform', `translate(${center},${center})`)
      .attr('d', backgroundArc as any);

    // Add value arc
    svg.append('path')
      .datum({ endAngle: scale(value) })
      .style('fill', colorScale(value))
      .attr('transform', `translate(${center},${center})`)
      .attr('d', valueArc as any);

    // Add needle
    const needleLength = radius - 30;
    const needleAngle = scale(value) - Math.PI / 2; // Convert to Cartesian angle
    svg.append('line')
      .attr('x1', center)
      .attr('y1', center)
      .attr('x2', center + needleLength * Math.cos(needleAngle))
      .attr('y2', center + needleLength * Math.sin(needleAngle))
      .attr('stroke', '#374151')
      .attr('stroke-width', 2)
      .attr('transform', `rotate(${needleAngle * 180 / Math.PI}, ${center}, ${center})`);

    // Add value text
    svg.append('text')
      .attr('x', center)
      .attr('y', center + 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '24px')
      .style('font-weight', 'bold')
      .style('fill', colorScale(value))
      .text(Math.round(value));

    // Add label
    svg.append('text')
      .attr('x', center)
      .attr('y', center - 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#6b7280')
      .text('Sentiment Score');

    // Add timestamp if provided
    if (timestamp) {
      svg.append('text')
        .attr('x', center)
        .attr('y', center + 40)
        .attr('text-anchor', 'middle')
        .style('font-size', '10px')
        .style('fill', '#6b7280')
        .text(`Last updated: ${new Date(timestamp).toLocaleString()}`);
    }

  }, [value, size, timestamp]);

  return (
    <svg ref={svgRef} width={size} height={size} className="mx-auto" />
  );
};

export default SentimentSpeedometer;
