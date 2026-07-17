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

  // Check and apply UI hiding
  applyUIHiding();
  // Also apply after a short delay to catch React-rendered elements
  setTimeout(applyUIHiding, 100);
  setTimeout(applyUIHiding, 500);

  // Use MutationObserver to watch for breadcrumbs
  const observer = new MutationObserver(() => {
    applyUIHiding();
  });
  observer.observe(document.body, { childList: true, subtree: true });
});

// Function to toggle hiding of dock and error button
window.toggleUIHiding = function() {
  const hideUI = localStorage.getItem('hideUI') === 'true';
  localStorage.setItem('hideUI', !hideUI);
  applyUIHiding();
  // Dispatch custom event for React components
  window.dispatchEvent(new CustomEvent('uiToggle'));
};

// Function to apply hiding based on localStorage
function applyUIHiding() {
  const hideUI = localStorage.getItem('hideUI') === 'true';
  const dock = document.querySelector('.dock');
  const errorButton = document.querySelector('.button'); // The error report button
  const breadcrumbs = document.querySelector('ul.breadcrumbs'); // The breadcrumbs component

  if (dock) {
    dock.style.display = hideUI ? 'none' : '';
  }
  if (errorButton) {
    errorButton.style.display = hideUI ? 'none' : '';
  }
  if (breadcrumbs) {
    breadcrumbs.style.display = hideUI ? 'none' : '';
  }
}
