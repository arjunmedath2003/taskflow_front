import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthPage from './AuthPage';

export default function Login() {
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      navigate('/app');
    }
  }, [token, navigate]);

  const handleAuthSuccess = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.token);
    navigate('/app');
  };

  if (token) return null;

  return (
    <div className="antialiased text-stone-300 bg-stone-900 min-h-screen">
      <AuthPage onAuthSuccess={handleAuthSuccess} />
    </div>
  );
}
