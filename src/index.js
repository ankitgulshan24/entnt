import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// --- DEV TRAP: pin down "Object.values(null/undefined)" callers ---
if (process.env.NODE_ENV === 'development') {
  const __origValues = Object.values;
  Object.values = function (obj) {
    if (obj == null) {
      console.error('🚨 Object.values called with null/undefined:', obj);
      console.error('📍 Stack trace:');
      console.trace();
      
      // Enhanced stack analysis
      const stack = new Error().stack;
      if (stack) {
        const lines = stack.split('\n');
        console.error('📋 Call stack analysis:');
        lines.forEach((line, index) => {
          if (line.includes('src/') || line.includes('node_modules/') || line.includes('webpack://')) {
            console.error(`  ${index}: ${line.trim()}`);
          }
        });
      }
      
      // Try to identify the calling context more precisely
      console.error('🔍 Attempting to identify source file...');
      const stackLines = stack.split('\n');
      for (let i = 0; i < stackLines.length; i++) {
        const line = stackLines[i];
        if (line.includes('src/') && !line.includes('index.js')) {
          console.error(`🎯 Likely source file: ${line.trim()}`);
          break;
        }
      }
      
      // eslint-disable-next-line no-debugger
      debugger;
    }
    return __origValues.call(Object, obj);
  };
}
// -------------------------------------------------------------------

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

