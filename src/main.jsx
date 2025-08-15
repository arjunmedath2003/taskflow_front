import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import Login from './Login.jsx'

// The createRoot method is used to create a root for rendering the React application.
const root = createRoot(document.getElementById('root'));

// The render method is used to render the React application into the root.
// We wrap the App component with BrowserRouter to enable routing capabilities.
root.render(
  <StrictMode>
    <BrowserRouter>
      <Login />
    </BrowserRouter>
  </StrictMode>
);
