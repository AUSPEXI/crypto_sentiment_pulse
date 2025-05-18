import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface SentimentSpeedometerProps {
  value: number;
  size?: number;
}

const SentimentSpeedometer: React.FC<SentimentSpeedometerProps> = ({ value, size = 200 }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = 10;
    const radius = (size - margin * 2) / 2;
    
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
      .attr('transform', `translate(${size/2},${size/2})`)
      .attr('d', arc as any);

    // Add value arc
    const valueArc = d3.arc()
      .innerRadius(radius - 20)
      .outerRadius(radius)
      .startAngle(-Math.PI / 2)
      .endAngle(scale(value));

    svg.append('path')
      .style('fill', colorScale(value))
      .attr('transform', `translate(${size/2},${size/2})`)
      .attr('d', valueArc as any);

    // Add value text
    svg.append('text')
      .attr('x', size / 2)
      .attr('y', size / 2 + 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '24px')
      .style('font-weight', 'bold')
      .style('fill', colorScale(value))
      .text(Math.round(value));

    // Add label
    svg.append('text')
      .attr('x', size / 2)
      .attr('y', size / 2 - 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#6b7280')
      .text('Sentiment Score');

  }, [value, size]);

  return (
    <svg ref={svgRef} width={size} height={size} className="mx-auto" />
  );
};

export default SentimentSpeedometer;