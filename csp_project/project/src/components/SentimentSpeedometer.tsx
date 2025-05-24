// src/components/SentimentSpeedometer.tsx
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface SentimentSpeedometerProps {
  value: number;
  size?: number;
  timestamp?: string;
}

const SentimentSpeedometer: React.FC<SentimentSpeedometerProps> = ({ value, size = 150, timestamp }) => {
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

    const backgroundArc = d3.arc()
      .innerRadius(radius - 20)
      .outerRadius(radius)
      .startAngle(-Math.PI / 2)
      .endAngle(Math.PI / 2);

    const valueArc = d3.arc()
      .innerRadius(radius - 20)
      .outerRadius(radius)
      .startAngle(-Math.PI / 2)
      .endAngle(scale(value));

    const colorScale = d3.scaleLinear<string>()
      .domain([0, 50, 100])
      .range(['#ef4444', '#eab308', '#22c55e']);

    // Add background arc
    svg.append('path')
      .datum({ endAngle: Math.PI / 2 })
      .style('fill', '#e5e7eb')
      .attr('transform', `translate(${center},${center})`)
      .attr('d', backgroundArc as any);

    // Add value arc
    svg.append('path')
      .datum({ endAngle: scale(value) })
      .style('fill', colorScale(value))
      .attr('transform', `translate(${center},${center})`)
      .attr('d', valueArc as any);

    // Add value text inside the arc
    svg.append('text')
      .attr('x', center)
      .attr('y', center + 10)
      .attr('text-anchor', 'middle')
      .style('font-size', '28px')
      .style('font-weight', 'bold')
      .style('fill', colorScale(value))
      .text(Math.round(value));

    // Add label inside the arc
    svg.append('text')
      .attr('x', center)
      .attr('y', center - 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
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

  }, [value, size, timestamp]);

  return (
    <svg ref={svgRef} width={size} height={size} className="mx-auto" />
  );
};

export default SentimentSpeedometer;
