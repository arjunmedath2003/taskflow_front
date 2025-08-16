import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App.jsx'; // This is your main app component after login
import Login from './pages/Auth/Login.jsx';

// The createRoot method is used to create a root for rendering the React application.
const root = createRoot(document.getElementById('root'));

// The render method is used to render the React application into the root.
// We wrap the components with BrowserRouter and Routes to enable routing.
root.render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/app" element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
