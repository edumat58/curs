import React from "react";
import { evaluate, parse } from 'mathjs/number';
import * as math from "mathjs";

const gridColor = "black";

function generatePoints(expr, minX, maxX, step = 0.1) {
  const node = math.parse(expr);
  const f = node.compile();
  const points = [];
  for (let x = minX; x <= maxX; x += step) {
    const y = f.evaluate({ x });
    if (isFinite(y)) points.push({ x, y });
  }
  return points;
}

function scaleX(x, minX, maxX, width) {
  return ((x - minX) / (maxX - minX)) * width;
}

function scaleY(y, minY, maxY, height) {
  return height - ((y - minY) / (maxY - minY)) * height;
}

function FunctionPlotter({ code, width = 320, height = 320 }) {
  const lines = code.trim().split("\n");
  const funcLine = lines.find(line => line.startsWith("f(x)"));
  const pointLines = lines.filter(line => /^[A-Z]\(/.test(line));

  const funcExpr = funcLine.split("=")[1].trim();
  const points = pointLines.map(line => {
    const name = line[0];
    const coords = line.match(/\(([^)]+)\)/)[1].split(",").map(Number);
    return { name, x: coords[0], y: coords[1] };
  });

  const allX = [...points.map(p => p.x), -4, 4];
  const allY = [...points.map(p => p.y), -4, 4];
  const minX = Math.floor(Math.min(...allX));
  const maxX = Math.ceil(Math.max(...allX));
  const minY = Math.floor(Math.min(...allY));
  const maxY = Math.ceil(Math.max(...allY));

  const plotPoints = generatePoints(funcExpr, minX, maxX);

  const svgPoints = plotPoints.map(p => {
    const sx = scaleX(p.x, minX, maxX, width);
    const sy = scaleY(p.y, minY, maxY, height);
    return `${sx},${sy}`;
  }).join(" ");

  const centerX = scaleX(0, minX, maxX, width);
  const centerY = scaleY(0, minY, maxY, height);

  return (
    <svg width={width} height={height} style={{ border: "1px solid black" }}>
      {/* Grid */}
      <g stroke={gridColor} strokeOpacity="0.12">
        {Array.from({ length: maxX - minX + 1 }, (_, i) => {
          const xVal = minX + i;
          const x = scaleX(xVal, minX, maxX, width);
          return <line key={`vx-${i}`} x1={x} y1={0} x2={x} y2={height} />;
        })}
        {Array.from({ length: maxY - minY + 1 }, (_, i) => {
          const yVal = minY + i;
          const y = scaleY(yVal, minY, maxY, height);
          return <line key={`hy-${i}`} x1={0} y1={y} x2={width} y2={y} />;
        })}
      </g>

      {/* Axes */}
      <line x1={centerX} y1={0} x2={centerX} y2={height} stroke="black" strokeWidth={2} />
      <line x1={0} y1={centerY} x2={width} y2={centerY} stroke="black" strokeWidth={2} />

      {/* Axis labels */}
      <g fontSize="12" fontFamily="Arial" fill="black">
        {Array.from({ length: maxX - minX + 1 }, (_, i) => {
          const xVal = minX + i;
          const x = scaleX(xVal, minX, maxX, width);
          if (xVal !== 0) {
          return (
            <text key={`xlabel-${i}`} x={x} y={centerY + 14} textAnchor="middle">
              {xVal}
            </text>
          );
        }
        })}
        {Array.from({ length: maxY - minY + 1 }, (_, i) => {
          const yVal = minY + i;
          const y = scaleY(yVal, minY, maxY, height);
          if (yVal !== 0) {
            return (
              <text key={`ylabel-${i}`} x={centerX + 4} y={y + 4}>
                {yVal}
              </text>
            );
          } else {
            return (
                <text
                  key={`ylabel-${i}`}
                  x={centerX + 6}
                  y={yVal === 0 ? y + 14 : y + 4}
                  textAnchor="start"
                >
                  {yVal}
                </text>
              );
              
          }
        })}
      </g>

      {/* Function line */}
      <polyline fill="none" stroke="blue" strokeWidth={2} points={svgPoints} />

      {/* Points + dashed lines */}
      {points.map((p, i) => {
        const cx = scaleX(p.x, minX, maxX, width);
        const cy = scaleY(p.y, minY, maxY, height);
        return (
          <g key={`p-${i}`}>            
            <line x1={cx} y1={cy} x2={cx} y2={centerY} stroke="gray" strokeDasharray="4,2" />
            <line x1={cx} y1={cy} x2={centerX} y2={cy} stroke="gray" strokeDasharray="4,2" />
            <circle cx={cx} cy={cy} r={4} fill="red" />
            <text x={cx + 5} y={cy - 5} fontSize="14" fontFamily="Arial">{p.name}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default FunctionPlotter;