import React from 'react';
import Katex from './Katex';

 export const TriunghiIsoscel = () => (
  <svg
    width="420"
    height="240"
    viewBox="0 200 420 240"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* === Laturi triunghiului === */}
    <line x1="80"    y1="380" x2="339.81" y2="380" stroke="black" strokeWidth="3" />
    <line x1="80"    y1="380" x2="80"     y2="230"  stroke="black" strokeWidth="3" />
    <line x1="339.81" y1="380" x2="80"    y2="230"  stroke="black" strokeWidth="3" />

    {/* === Vârfuri === */}
    <text x="70"  y="400" fontSize="16">A</text>
    <text x="345" y="400" fontSize="16">B</text>
    <text x="70"  y="220" fontSize="16">C</text>

    {/* === Unghiul drept la A === */}
    <rect x="80" y="360" width="20" height="20" fill="none" stroke="black" strokeWidth="3" />
    <text x="105" y="360" fontSize="16">90°</text>

    {/* === 30° la B === */}
    <path
      d="
        M 319.81,380          <!-- plecăm cu 20px la stânga lui B -->
        A 20,20 0 0,1 322.49,370  <!-- sweep‑flag=1 → interiorul unghiului -->
      "
      fill="none"
      stroke="black"
      strokeWidth="2"
    />
    <text x="270" y="374" fontSize="16">30°</text>

    {/* === 60° la C === */}
    <path
      d="
        M 80,250             <!-- plecăm cu 20px sub C -->
        A 20,20 0 0,0 97.32,240  <!-- sweep‑flag=0 → interiorul unghiului -->
      "
      fill="none"
      stroke="black"
      strokeWidth="2"
    />
    <text x="90" y="270" fontSize="16">60°</text>
  </svg>
 );

 export const TriunghiDreptunghic = () => (
  <svg
    width="420"
    height="240"
    viewBox="0 200 420 240"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* === Laturi triunghiului === */}
    <line x1="80" y1="380" x2="339.81" y2="380" stroke="black" strokeWidth="3" />
    <line x1="80" y1="380" x2="80" y2="230" stroke="black" strokeWidth="3" />
    <line x1="339.81" y1="380" x2="80" y2="230" stroke="black" strokeWidth="3" />

    {/* === Vârfuri === */}
    <text x="70"  y="400" fontSize="16">A</text>
    <text x="345" y="400" fontSize="16">B</text>
    <text x="70"  y="220" fontSize="16">C</text>
    <text x="185" y="285" fontSize="16">D</text>

    {/* === Unghiul drept la A === */}
    <rect x="80" y="360" width="20" height="20" fill="none" stroke="black" strokeWidth="3" />

    {/* === 30° la B === */}
    <path
      d="M319.81,380 A20,20 0 0,1 322.49,370"
      fill="none"
      stroke="black"
      strokeWidth="2"
    />
    <text x="270" y="374" fontSize="16">30°</text>

    {/* === 60° la C === */}
    <path
      d="M80,250 A20,20 0 0,0 97.32,240"
      fill="none"
      stroke="black"
      strokeWidth="2"
    />
    <text x="90" y="270" fontSize="16">60°</text>

    {/* === Bisectoarea unghiului drept (45°/45°) === */}
    <line
      x1="80"
      y1="380"
      x2="180"
      y2="285"
      stroke="black"
      strokeWidth="2"
      strokeDasharray="5,5"
    />
    <text x="110" y="370" fontSize="14">45°</text>
    <text x="85"  y="345" fontSize="14">45°</text>

    {/* === Semne de unghi la D: 105° și 75° === */}
    {/* 105° între BD și AD */}
    <path
      d="M197.19,295.22 A20,20 0 0,1 165.50,298.77"
      fill="none"
      stroke="black"
      strokeWidth="2"
    />
    <text x="165" y="325" fontSize="14">105°</text>

    {/* 75° între AD și DC — arc spre interior */}
    <path
      d="M165.50,298.77 A20,20 0 0,1 162.48,275.36"
      fill="none"
      stroke="black"
      strokeWidth="2"
    />
    <text x="130" y="295" fontSize="14">75°</text>
  </svg>
)

export const PatratDiagonala = () => (
  <svg width="200" height="200" viewBox="0 0 200 200">
    <rect x="40" y="40" width="120" height="120" stroke="black" fill="none" strokeWidth="2" />
    <line x1="40" y1="40" x2="160" y2="160" stroke="black" strokeWidth="2" />
    <text x="30" y="40" fontSize="12">A</text>
    <text x="165" y="40" fontSize="12">B</text>
    <text x="30" y="170" fontSize="12">D</text>
    <text x="165" y="170" fontSize="12">C</text>
    <text x="90" y="105" fontSize="12">l√2</text>
  </svg>
);
export const UnitMas = () => (
<svg
  width="400"
  height="260"
  viewBox="0 0 400 260"
  xmlns="http://www.w3.org/2000/svg"
  preserveAspectRatio="xMidYMid meet"
>

  <g transform="translate(50, 30)">

    <path d="M0,150 H30 V130"   fill="none" stroke="#4682b4" stroke-width="2"/>
    <path d="M30,130 H60 V110"  fill="none" stroke="#4682b4" stroke-width="2"/>
    <path d="M60,110 H90 V90"   fill="none" stroke="#4682b4" stroke-width="2"/>
    <path d="M90,90  H120 V70"  fill="none" stroke="#4682b4" stroke-width="2"/>
    <path d="M120,70 H150 V50"  fill="none" stroke="#4682b4" stroke-width="2"/>
    <path d="M150,50 H180 V30"  fill="none" stroke="#4682b4" stroke-width="2"/>
    <path d="M180,30 H210 V10"  fill="none" stroke="#4682b4" stroke-width="2"/>

  
    <path d="M0,150   H90"   fill="none" stroke="#4682b4" stroke-width="1" stroke-dasharray="5,5"/>
    <path d="M90,150  V90"   fill="none" stroke="#4682b4" stroke-width="1" stroke-dasharray="5,5"/>
    <path d="M120,150  V90"   fill="none" stroke="#4682b4" stroke-width="1" stroke-dasharray="5,5"/>
    <path d="M120,150  H210"  fill="none" stroke="#4682b4" stroke-width="1" stroke-dasharray="5,5"/>
    <path d="M210,150 V30"   fill="none" stroke="#4682b4" stroke-width="1" stroke-dasharray="5,5"/>


    <text x="45"  y="180" fill="#FF6347" font-size="16" text-anchor="middle">submultipli</text>
    <text x="165" y="180" fill="#FF6347" font-size="16" text-anchor="middle">multipli</text>
    <text x="12" y="145" fill="#228B22" font-size="14" text-anchor="middle">mm</text>
    <text x="42" y="125" fill="#228B22" font-size="14" text-anchor="middle">cm</text>
    <text x="72" y="105" fill="#228B22" font-size="14" text-anchor="middle">dm</text>
    <text x="102" y="85" fill="#228B22" font-size="14" text-anchor="middle">m</text>
    <text x="132" y="65" fill="#228B22" font-size="14" text-anchor="middle">dam</text>
    <text x="162" y="45" fill="#228B22" font-size="14" text-anchor="middle">hm</text>
    <text x="192" y="25" fill="#228B22" font-size="14" text-anchor="middle">km</text>
  </g>
</svg>

);

export const UnitMasKg = () => (
  <svg
    width="400"
    height="260"
    viewBox="0 0 400 260"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid meet"
  >
    <g transform="translate(50, 30)">
      <path d="M0,150 H30 V130"   fill="none" stroke="#4682b4" strokeWidth="2"/>
      <path d="M30,130 H60 V110"  fill="none" stroke="#4682b4" strokeWidth="2"/>
      <path d="M60,110 H90 V90"   fill="none" stroke="#4682b4" strokeWidth="2"/>
      <path d="M90,90  H120 V70"  fill="none" stroke="#4682b4" strokeWidth="2"/>
      <path d="M120,70 H150 V50"  fill="none" stroke="#4682b4" strokeWidth="2"/>
      <path d="M150,50 H180 V30"  fill="none" stroke="#4682b4" strokeWidth="2"/>
      <path d="M180,30 H210 V10"  fill="none" stroke="#4682b4" strokeWidth="2"/>
  
      <path d="M0,150   H90"   fill="none" stroke="#4682b4" strokeWidth="1" strokeDasharray="5,5"/>
      <path d="M90,150  V90"   fill="none" stroke="#4682b4" strokeWidth="1" strokeDasharray="5,5"/>
      <path d="M120,150  V90"  fill="none" stroke="#4682b4" strokeWidth="1" strokeDasharray="5,5"/>
      <path d="M120,150  H210" fill="none" stroke="#4682b4" strokeWidth="1" strokeDasharray="5,5"/>
      <path d="M210,150 V30"   fill="none" stroke="#4682b4" strokeWidth="1" strokeDasharray="5,5"/>
  
      <text x="45"  y="180" fill="#FF6347" fontSize="16" textAnchor="middle">submultipli</text>
      <text x="165" y="180" fill="#FF6347" fontSize="16" textAnchor="middle">multipli</text>
      <text x="12" y="145" fill="#228B22" fontSize="14" textAnchor="middle">mg</text>
      <text x="42" y="125" fill="#228B22" fontSize="14" textAnchor="middle">cg</text>
      <text x="72" y="105" fill="#228B22" fontSize="14" textAnchor="middle">dg</text>
      <text x="102" y="85"  fill="#228B22" fontSize="14" textAnchor="middle">g</text>
      <text x="132" y="65"  fill="#228B22" fontSize="14" textAnchor="middle">dag</text>
      <text x="162" y="45"  fill="#228B22" fontSize="14" textAnchor="middle">hg</text>
      <text x="192" y="25"  fill="#228B22" fontSize="14" textAnchor="middle">kg</text>
    </g>
  </svg>
  );
  


export const CerculTrigonom = () => {
    const center = 300;
    const radius = 250;
    const degToRad = deg => (deg * Math.PI) / 180;
  
    const points = [
      { angle: 0, coord: '(1, 0)' },
      { angle: 30, label: '30°', coord: '(√3/2, 1/2)' },
      { angle: 45, label: '45°', coord: '(√2/2, √2/2)' },
      { angle: 60, label: '60°', coord: '(1/2, √3/2)' },
      { angle: 90, coord: '(0, 1)' }
    ];
  
    // Hasurare în cadranele II, III, IV (de la 90° la 360°)
    const hachureAngles = [];
    for (let a = 91; a <= 360; a += 2) {
      hachureAngles.push(a);
    }
  
    return (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <svg width="600" height="600" viewBox="0 0 600 600">
          {/* Hasurare cadrane II, III, IV */}
          {hachureAngles.map((angle, idx) => {
            const rad = degToRad(angle);
            const x = center + radius * Math.cos(rad);
            const y = center - radius * Math.sin(rad);
            return (
              <line
                key={idx}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="red"
                strokeWidth="0.5"
              />
            );
          })}
  
          {/* Cercul și axe */}
          <circle cx={center} cy={center} r={radius} stroke="black" fill="none" strokeWidth="2" />
          <line x1={center} y1={center - radius} x2={center} y2={center + radius} stroke="gray" strokeWidth="1" />
          <line x1={center - radius} y1={center} x2={center + radius} y2={center} stroke="gray" strokeWidth="1" />
  
          {/* Axe principale */}
          <text x={center} y={center - radius - 10} fontSize="16" textAnchor="middle" fontWeight="bold">90°</text>
          <text x={center} y={center + radius + 20} fontSize="16" textAnchor="middle" fontWeight="bold">270°</text>
          <text x={center + radius + 10} y={center + 5} fontSize="16" textAnchor="start" fontWeight="bold">0°</text>
          <text x={center - radius - 10} y={center + 5} fontSize="16" textAnchor="end" fontWeight="bold">180°</text>
          <text x={center - 10} y={center - 10} fontSize="16" fontWeight="bold">O</text>

  
          {/* Puncte cadran I și axă 0–90 */}
        {points.map(({ angle, label, coord }) => {
            const rad = degToRad(angle);
            const x = center + radius * Math.cos(rad);
            const y = center - radius * Math.sin(rad);

            let labelX = x + 1;
            let labelY = y - 10;
            let coordX = x + 12;
            let coordY = y + 8;

            // Ajustare poziții speciale
            if (angle === 0) {
                labelX = x - 60;
                labelY = y + 5;
                coordX = x + 10;
                coordY = y + 20;
            } else if (angle === 90) {
                labelX = x - 40;
                labelY = y - 15;
                coordX = x + 20;
                coordY = y - 12;
            }

            return (
                <g key={angle}>
                {/* DOAR dacă NU e 0 sau 90 desenăm linia întreruptă */}
                {angle !== 0 && angle !== 90 && (
                    <line x1={center} y1={center} x2={x} y2={y} stroke="black" strokeDasharray="4" />
                )}
                <circle cx={x} cy={y} r={5} fill="black" />
                <text x={labelX} y={labelY} fontSize="14" fontWeight="bold">{label}</text>
                <text x={coordX} y={coordY} fontSize="14" fontWeight="bold">{coord}</text>
                </g>
            );
            })}

        </svg>
      </div>
    );
  };

  export const GeoGebraSvg = () => (
      <svg
        width="300"
        height="300"
        viewBox="0 0 300 300"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Square ABCD */}
        <rect
          x="50"
          y="50"
          width="200"
          height="200"
          fill="none"
          stroke="black"
          strokeWidth="2"
        />
    
        {/* Diagonal AC */}
        <line
          x1="50"
          y1="50"
          x2="250"
          y2="250"
          stroke="black"
          strokeWidth="2"
        />
    
        {/* Right‑angle marker at A */}
        <rect
          x="50"
          y="230"
          width="20"
          height="20"
          fill="none"
          stroke="black"
          strokeWidth="2"
        />
        <text
          x="75"
          y="230"
          fontSize="16"
          fill="black"
        >
          90°
        </text>
    
        {/* Vertex labels */}
        <text x="40"  y="45"  fontSize="16" fill="black">D</text>
        <text x="255" y="45"  fontSize="16" fill="black">C</text>
        <text x="255" y="265" fontSize="16" fill="black">B</text>
        <text x="40"  y="265" fontSize="16" fill="black">A</text>
      </svg>
    );
  

  
  
