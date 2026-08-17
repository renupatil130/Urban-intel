import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/global.css'

// Global Error Visualizer for diagnostics
window.addEventListener('error', (event) => {
  const div = document.createElement('div');
  div.style.position = 'fixed';
  div.style.top = '0';
  div.style.left = '0';
  div.style.right = '0';
  div.style.background = '#ef4444';
  div.style.color = '#fff';
  div.style.padding = '20px';
  div.style.zIndex = '99999';
  div.style.fontFamily = 'monospace';
  div.style.whiteSpace = 'pre-wrap';
  div.innerText = `Error: ${event.message}\nAt: ${event.filename}:${event.lineno}:${event.colno}\nStack: ${event.error?.stack || 'No stack'}`;
  document.body.appendChild(div);
});

window.addEventListener('unhandledrejection', (event) => {
  const div = document.createElement('div');
  div.style.position = 'fixed';
  div.style.top = '0';
  div.style.left = '0';
  div.style.right = '0';
  div.style.background = '#f97316';
  div.style.color = '#fff';
  div.style.padding = '20px';
  div.style.zIndex = '99999';
  div.style.fontFamily = 'monospace';
  div.style.whiteSpace = 'pre-wrap';
  div.innerText = `Unhandled Promise Rejection: ${event.reason}`;
  document.body.appendChild(div);
});


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
