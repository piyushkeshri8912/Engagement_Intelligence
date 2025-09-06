import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* Use PUBLIC_URL so routing works whether deployed at root or a subpath */}
    <BrowserRouter basename={process.env.PUBLIC_URL || '/'}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
