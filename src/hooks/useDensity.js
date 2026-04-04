import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'ls_density';

// Density values map to CSS custom properties on <html>
const DENSITIES = {
  compact:     { rowPy: '6px',  cellPx: '12px', fontSize: '12px' },
  comfortable: { rowPy: '10px', cellPx: '16px', fontSize: '13px' },
  spacious:    { rowPy: '15px', cellPx: '20px', fontSize: '14px' },
};

function applyDensity(density) {
  const vals = DENSITIES[density] || DENSITIES.comfortable;
  const root = document.documentElement;
  root.style.setProperty('--table-row-py', vals.rowPy);
  root.style.setProperty('--table-cell-px', vals.cellPx);
  root.style.setProperty('--table-font-size', vals.fontSize);
}

export function useDensity() {
  const [density, setDensityState] = useState(
    () => localStorage.getItem(STORAGE_KEY) || 'comfortable'
  );

  useEffect(() => {
    applyDensity(density);
    localStorage.setItem(STORAGE_KEY, density);
  }, [density]);

  const setDensity = useCallback((d) => setDensityState(d), []);

  return { density, setDensity, options: Object.keys(DENSITIES) };
}
