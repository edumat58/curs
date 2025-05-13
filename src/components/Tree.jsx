import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';

const parseTree = (source) => {
  const lines = source.trim().split('\n');
  const stack = [];
  let root = null;

  lines.forEach(line => {
    const indent = line.search(/\S/);
    const content = line.trim();

    const [parentLabel, childrenStr] = content.split('->').map(s => s.trim());
    const children = childrenStr ? childrenStr.split(/\s+/) : [];

    const node = { label: parentLabel, children: [], depth: indent };
    children.forEach(c => node.children.push({ label: c, children: [], depth: indent + 2 }));

    while (stack.length && stack[stack.length - 1].depth >= indent) {
      stack.pop();
    }

    if (stack.length) {
      stack[stack.length - 1].children.push(node);
    } else {
      root = node;
    }

    stack.push(node);
    if (childrenStr) {
      children.forEach(child => stack.push({ label: child, children: [], depth: indent + 2 }));
    }
  });

  return root;
};

const layoutTree = (node, depth = 0, xOffset = 0) => {
  const levelGap = 60;
  const siblingGap = 80;

  if (!node.children.length) {
    node.x = xOffset;
    node.y = depth * levelGap;
    return { width: siblingGap, center: xOffset };
  }

  let width = 0;
  const centers = [];

  node.children.forEach(child => {
    const res = layoutTree(child, depth + 1, xOffset + width);
    width += res.width;
    centers.push(res.center);
  });

  node.x = (Math.min(...centers) + Math.max(...centers)) / 2;
  node.y = depth * levelGap;
  return { width, center: node.x };
};

const drawEdges = (node) => {
  let edges = [];
  for (const child of node.children) {
    edges.push({ x1: node.x, y1: node.y, x2: child.x, y2: child.y });
    edges = edges.concat(drawEdges(child));
  }
  return edges;
};

const drawNodes = (node) => {
  let nodes = [{ x: node.x, y: node.y, label: node.label }];
  for (const child of node.children) {
    nodes = nodes.concat(drawNodes(child));
  }
  return nodes;
};

const RenderLabel = ({ label }) => {
  const safeLabel = label.trim().replace(/^\$\$|\$\$$/g, '');
  return (
    <foreignObject x={-40} y={-10} width="80" height="30">
      <div style={{ textAlign: 'center', fontSize: 14 }}>
        <InlineMath math={safeLabel} />
      </div>
    </foreignObject>
  );
};



export default function Tree({ source }) {
  if (!source) return null;

  const root = parseTree(source);
  layoutTree(root);

  const nodes = drawNodes(root);
  const edges = drawEdges(root);

  const minX = Math.min(...nodes.map(n => n.x));
  const maxX = Math.max(...nodes.map(n => n.x));
  const minY = Math.min(...nodes.map(n => n.y));
  const maxY = Math.max(...nodes.map(n => n.y));

  const paddingX = 40;
  const paddingY = 40;

  const width = maxX - minX + 2 * paddingX;
  const height = maxY - minY + 2 * paddingY;

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`${minX - paddingX} ${minY - paddingY} ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {edges.map((e, i) => (
        <line
          key={i}
          x1={e.x1}
          y1={e.y1 + 15}
          x2={e.x2}
          y2={e.y2 - 15}
          stroke="black"
        />
      ))}
      {nodes.map((n, i) => (
        <g key={i} transform={`translate(${n.x},${n.y})`}>
          <circle r="15" fill="white" stroke="black" />
          <RenderLabel label={n.label} />
        </g>
      ))}
    </svg>
  );
}
