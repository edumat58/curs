import React, { useState } from "react";

function scaleCoord(x, y, size, padding = 0) {
  return {
    x: padding + (x / 32) * size,
    y: size - ((y / 32) * size) + padding,
  };
}

function parseLabelPlacement(name, allPoints) {
  const p = allPoints[name];
  const margin = 12;
  let dx = margin, dy = -margin;

  const others = Object.values(allPoints).filter(q => q.name !== name);
  for (const q of others) {
    const dist = Math.hypot(q.x - p.x, q.y - p.y);
    if (dist < 2.5) {
      if (q.x > p.x) dx = -margin;
      if (q.y > p.y) dy = margin;
    }
  }
  return { dx, dy };
}

function SingleGeometry({ code }) {
  const [hoverCoord, setHoverCoord] = useState(null);

  const lines = code.trim().split("\n").filter(l => l.length);
  const segmentLine = lines.find(line => /^[A-Z]{2}/.test(line));
  const pointLines = lines.filter(line => /\(/.test(line) && !line.startsWith("label"));
  const labelLines = lines.filter(line => line.startsWith("label"));

  const segments = segmentLine ? segmentLine.split(";").map(seg => seg.trim()) : [];
  const points = {};
  const hiddenPoints = new Set();
  const customLabels = [];

  pointLines.forEach(line => {
    const name = line[0];
    const [x, y] = line.match(/\(([^)]+)\)/)[1].split(",").map(Number);
    if (line.includes("{hide}")) hiddenPoints.add(name);
    points[name] = { name, x, y };
  });

  labelLines.forEach(line => {
    const match = line.match(/label\{\'(.*?)\';\(([^,]+),([^\)]+)\)\}/);
    if (match) {
      const [, text, xStr, yStr] = match;
      customLabels.push({ text, x: Number(xStr), y: Number(yStr) });
    }
  });

  return (
    <div style={{ position: "relative" }}>
      {hoverCoord && (
        <div style={{
          position: "absolute",
          top: 5,
          left: 5,
          background: "rgba(0,0,0,0.75)",
          color: "white",
          padding: "2px 6px",
          fontSize: "12px",
          borderRadius: "4px",
          pointerEvents: "none"
        }}>
          ({hoverCoord.x.toFixed(1)}, {hoverCoord.y.toFixed(1)})
        </div>
      )}

      <svg
        viewBox="0 0 320 320"
        preserveAspectRatio="xMidYMid meet"
        style={{ width: "100%", height: "auto", border: "1px solid black" }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 32;
          const y = 32 - ((e.clientY - rect.top) / rect.height) * 32;
          setHoverCoord({ x, y });
        }}
        onMouseLeave={() => setHoverCoord(null)}
      >
        <g stroke="black" strokeOpacity="0.1">
          {Array.from({ length: 33 }, (_, i) => {
            const pos = (i / 32) * 320;
            return <line key={`v-${i}`} x1={pos} y1={0} x2={pos} y2={320} />;
          })}
          {Array.from({ length: 33 }, (_, i) => {
            const pos = (i / 32) * 320;
            return <line key={`h-${i}`} x1={0} y1={pos} x2={320} y2={pos} />;
          })}
        </g>

        {segments.map((seg, i) => {
          const dashed = seg.includes("{dash}");
          const [a, b] = seg.replace(/\{.*\}/g, "").split("");
          if (!points[a] || !points[b]) return null;
          const pa = scaleCoord(points[a].x, points[a].y, 320);
          const pb = scaleCoord(points[b].x, points[b].y, 320);
          return (
            <line
              key={`s-${i}`}
              x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
              stroke="blue"
              strokeWidth={2}
              strokeDasharray={dashed ? "4,3" : "none"}
            />
          );
        })}

        {Object.values(points).map((p, i) => {
          if (hiddenPoints.has(p.name)) return null;
          const { x, y } = scaleCoord(p.x, p.y, 320);
          const { dx, dy } = parseLabelPlacement(p.name, points);
          return (
            <g key={`p-${i}`}>
              <circle cx={x} cy={y} r={4} fill="red" />
              <text x={x + dx} y={y + dy} fontSize="12" fontFamily="Arial">
                {p.name}
              </text>
            </g>
          );
        })}

        {customLabels.map((lbl, i) => {
          const { x, y } = scaleCoord(lbl.x, lbl.y, 320);
          return (
            <text key={`label-${i}`} x={x} y={y} fontSize="12" fontFamily="Arial" fill="black">
              {lbl.text}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export default function GeometryDraw({ code }) {
  const inlineMatch = code.match(/inline:\s*(\d+)/);
  const labelMatch = code.match(/flabel:\s*['"](.*?)['"]/);
  const maxsizeMatch = code.match(/maxsize:\s*(\d+px)/);
  const alignMatch = code.match(/align:\s*(left|right|center)/);

  const count = inlineMatch ? parseInt(inlineMatch[1]) : 1;
  const flabel = labelMatch ? labelMatch[1] : null;
  const maxWidth = maxsizeMatch ? maxsizeMatch[1] : "100%";
  const align = alignMatch ? alignMatch[1] : "center";

  const blocks = code
    .split(/\[|\]/)
    .map(c => c.trim())
    .filter(c => c && !c.startsWith("inline") && !c.startsWith("flabel") && !c.startsWith("maxsize") && !c.startsWith("align"));

  const isResponsive = !!inlineMatch;
  const isMobile = typeof navigator !== "undefined" && /Mobi|Android/i.test(navigator.userAgent);


  const justifyMap = {
    left: "flex-start",
    center: "center",
    right: "flex-end"
  };

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        flexDirection: isResponsive && isMobile ? "column" : "row",
        gap: "1rem",
        justifyContent: justifyMap[align] || "center"
      }}
    >
      {blocks.map((block, i) => (
        <div
          key={i}
          style={{
            flex: isResponsive ? `1 1 calc(${100 / count}% - 1rem)` : "unset",
            maxWidth: isResponsive ? "100%" : maxWidth,
            margin: align === "center" ? "0 auto" : "0",
            marginBottom: "5rem"
          }}
        >
          <SingleGeometry code={block} />
          {flabel && <div style={{ textAlign: align, fontWeight: "bold", marginTop: "0.5rem" }}>{flabel}</div>}
        </div>
      ))}
    </div>
  );
}