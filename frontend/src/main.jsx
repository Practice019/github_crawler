import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { LogProvider } from './contexts/LogContext';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <LogProvider>
          <App />
        </LogProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
