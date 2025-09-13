import React from 'react';

const NumberLine = ({ spec }) => {
  if (!spec) return null;

  const { canvas, axis, ticks, labels, emphasis, anchors, rows, points, segments, segment, interval, arcs, annotation } = spec;
  const width = canvas?.width || 820;
  const height = canvas?.height || 120;
  const margin = canvas?.margin || 24;

  const renderAxis = () => {
    const y = axis?.y || 60;
    const x1 = axis?.x1 || 12;
    const x2 = axis?.x2 || (width - margin);
    const arrowHeads = axis?.arrowHeads || 'both';

    return (
      <line
        x1={x1}
        y1={y}
        x2={x2}
        y2={y}
        stroke="currentColor"
        strokeWidth="2"
        markerEnd={arrowHeads === 'both' || arrowHeads === 'end' ? 'url(#arrR)' : ''}
      />
    );
  };

  const renderTicks = () => {
    if (!ticks) return null;
    const stepPx = ticks.stepPx || 60;
    const lengthPx = ticks.lengthPx || 14;
    const labels = ticks.labels ? ticks.labels.split(',') : [];
    const labelDy = ticks.labelDy || 26;
    const y = axis?.y || 60;
    const x1 = axis?.x1 || 12;

    return labels.map((label, i) => {
      const x = x1 + i * stepPx;
      return (
        <g key={i} transform={`translate(${x},${y})`}>
          <line y1={-lengthPx/2} y2={lengthPx/2} stroke="currentColor" />
          <text y={labelDy} textAnchor="middle" fontSize="12">{label}</text>
        </g>
      );
    });
  };

  const renderLabels = () => {
    if (!labels) return null;
    return labels.map((label, i) => {
      let x = label.xPx;
      let y = label.yPx;
      if (label.xAt) {
        x = resolveAnchor(label.xAt);
      }
      return (
        <text
          key={i}
          x={x}
          y={y}
          textAnchor={label.align || 'center'}
          fontSize="12"
        >
          {label.text}
        </text>
      );
    });
  };

  const renderEmphasis = () => {
    if (!emphasis) return null;
    // Implement emphasis rendering
    return null;
  };

  const resolveAnchor = (anchorKey) => {
    if (!anchors) return 0;
    const anchor = anchors[anchorKey];
    if (typeof anchor === 'object' && anchor.xRel !== undefined) {
      return margin + anchor.xRel * (width - 2 * margin);
    }
    return 0;
  };

  const renderRows = () => {
    if (!rows) return null;
    return rows.map((row, i) => {
      const y = row.y;
      let element = null;

      if (row.interval) {
        const interval = row.interval;
        const fromX = resolveAnchor(interval.from);
        const toX = resolveAnchor(interval.to);
        const thickness = interval.thickness || 6;
        const capStart = interval.capStart === 'closed' ? 'circle' : 'none';
        const capEnd = interval.capEnd === 'closed' ? 'circle' : 'none';

        element = (
          <g>
            <line
              x1={fromX}
              y1={y}
              x2={toX}
              y2={y}
              stroke="currentColor"
              strokeWidth={thickness}
            />
            {capStart === 'circle' && (
              <circle cx={fromX} cy={y} r={thickness/2} fill="currentColor" />
            )}
            {capEnd === 'circle' && (
              <circle cx={toX} cy={y} r={thickness/2} fill="currentColor" />
            )}
          </g>
        );
      } else if (row.ray) {
        const ray = row.ray;
        const fromX = resolveAnchor(ray.from);
        const direction = ray.direction;
        const thickness = ray.thickness || 6;
        const capAtFrom = ray.capAtFrom === 'closed' ? 'circle' : 'none';

        let toX;
        if (direction === 'left') {
          toX = margin;
        } else if (direction === 'right') {
          toX = width - margin;
        }

        element = (
          <g>
            <line
              x1={fromX}
              y1={y}
              x2={toX}
              y2={y}
              stroke="currentColor"
              strokeWidth={thickness}
              markerEnd={direction === 'right' ? 'url(#arrR)' : ''}
              markerStart={direction === 'left' ? 'url(#arrL)' : ''}
            />
            {capAtFrom === 'circle' && (
              <circle cx={fromX} cy={y} r={thickness/2} fill="currentColor" />
            )}
          </g>
        );
      }

      return (
        <g key={i}>
          {element}
          {row.label && (
            <text
              x={row.interval ? (resolveAnchor(row.interval.from) + resolveAnchor(row.interval.to)) / 2 : resolveAnchor(row.ray.from)}
              y={row.label.above ? y - 10 : y + 20}
              textAnchor="middle"
              fontSize="12"
            >
              {row.label.text}
            </text>
          )}
          {row.note && (
            <text
              x={resolveAnchor(row.interval ? row.interval.from : row.ray.from)}
              y={y + row.note.dy}
              textAnchor="middle"
              fontSize="10"
            >
              {row.note.text}
            </text>
          )}
        </g>
      );
    });
  };

  const renderPoints = () => {
    if (!points) return null;
    return points.map((point, i) => {
      const x = resolveAnchor(point.xAt);
      const y = point.y;
      return (
        <g key={i}>
          <circle cx={x} cy={y} r="3" fill={point.color || "currentColor"} />
          <text x={x} y={y + (point.dy || 28)} textAnchor="middle" fontSize="12" fill={point.color || "currentColor"}>{point.label}</text>
        </g>
      );
    });
  };

  const renderSegments = () => {
    if (!segments && !segment) return null;
    const segs = segments || [segment];
    return segs.map((seg, i) => {
      const fromX = resolveAnchor(seg.from);
      const toX = resolveAnchor(seg.to);
      const y = (axis?.y || 60) + (seg.yOffset || 0);
      const thickness = seg.thickness || 4;
      return (
        <g key={i}>
          <line
            x1={fromX}
            y1={y}
            x2={toX}
            y2={y}
            stroke="currentColor"
            strokeWidth={thickness}
          />
          {seg.label && (
            <text
              x={(fromX + toX) / 2}
              y={seg.labelPos === 'center-above' ? y - 10 : y + 20}
              textAnchor="middle"
              fontSize="12"
            >
              {seg.label}
            </text>
          )}
        </g>
      );
    });
  };

  const renderInterval = () => {
    if (!interval) return null;
    const fromX = resolveAnchor(interval.from);
    const toX = resolveAnchor(interval.to);
    const y = interval.y || 80;
    const thickness = interval.thickness || 6;
    const capStart = interval.capStart === 'closed' ? 'circle' : 'none';
    const capEnd = interval.capEnd === 'closed' ? 'circle' : 'none';

    return (
      <g>
        <line
          x1={fromX}
          y1={y}
          x2={toX}
          y2={y}
          stroke="currentColor"
          strokeWidth={thickness}
        />
        {capStart === 'circle' && (
          <circle cx={fromX} cy={y} r={thickness/2} fill="currentColor" />
        )}
        {capEnd === 'circle' && (
          <circle cx={toX} cy={y} r={thickness/2} fill="currentColor" />
        )}
      </g>
    );
  };

  const renderArcs = () => {
    if (!arcs) return null;
    return arcs.map((arc, i) => {
      const fromX = resolveAnchor(arc.from);
      const toX = resolveAnchor(arc.to);
      const centerX = resolveAnchor('a'); // assuming 'a' is the center
      const y = arc.above ? (axis?.y || 60) - 20 : (axis?.y || 60) + 20;
      const radius = Math.abs(toX - centerX);

      return (
        <g key={i}>
          <path
            d={`M ${fromX} ${y} A ${radius} ${radius} 0 0 ${arc.above ? 0 : 1} ${toX} ${y}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          {arc.label && (
            <text
              x={centerX}
              y={arc.above ? y - radius - 10 : y + radius + 10}
              textAnchor="middle"
              fontSize="12"
            >
              {arc.label}
            </text>
          )}
        </g>
      );
    });
  };

  const renderAnnotation = () => {
    if (!annotation) return null;
    const x = annotation.xRel ? margin + annotation.xRel * (width - 2 * margin) : width / 2;
    const y = annotation.yPx || 24;
    return (
      <text
        x={x}
        y={y}
        textAnchor={annotation.align || 'center'}
        fontSize="12"
      >
        {annotation.text}
      </text>
    );
  };

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" role="img" aria-label="Number Line">
      <defs>
        <marker id="arrR" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" />
        </marker>
        <marker id="arrL" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 10 0 L 0 5 L 10 10 z" />
        </marker>
      </defs>
      {renderAxis()}
      {renderTicks()}
      {renderLabels()}
      {renderEmphasis()}
      {renderRows()}
      {renderPoints()}
      {renderSegments()}
      {renderInterval()}
      {renderArcs()}
      {renderAnnotation()}
    </svg>
  );
};

export default NumberLine;