window.addEventListener('DOMContentLoaded', () => {
  const el = document.getElementById('site-status');
  if (!el) return;

  const status = el.dataset.status || 'warning';

  const styleMap = {
    warning: {
      bg: '#fff3cd',
      border: '#ffecb5',
      fill: '#f08c00',
      label: 'Avertisment',
    },
    stable: {
      bg: '#d4edda',
      border: '#c3e6cb',
      fill: '#28a745',
      label: 'Stabil',
    },
    unstable: {
      bg: '#f8d7da',
      border: '#f5c6cb',
      fill: '#dc3545',
      label: 'Instabil',
    },
  };

  const style = styleMap[status] || styleMap.warning;

  // Aplică stilurile pe container
  el.style.backgroundColor = style.bg;
  el.style.borderLeftColor = style.border;

  // Setează culoarea SVG-ului (dacă există)
  const svg = el.querySelector('svg');
  if (svg) {
    svg.setAttribute('fill', style.fill);
  }

  // Modifică textul, dacă vrei și titlul să se schimbe automat
  const span = el.querySelector('span');
  if (span) {
    span.textContent = style.label;
  }
});
