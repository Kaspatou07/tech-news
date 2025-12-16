import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './LoginForm.css';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    axios
      .post('https://tech-news-2wdt.onrender.com/auth/login', { email, password }) 
      .then(response => {
        localStorage.setItem('token', response.data.token);
        navigate('/profile');
      })
      .catch(err => {
        const errorMessage =
          err.response && err.response.data && err.response.data.error
            ? err.response.data.error
            : 'Erreur de connexion';
        setError(errorMessage);
        console.error(err);
      });
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <h2>Connexion</h2>
      {error && <p className="error">{error}</p>}
      <div className="form-group">
        <label>Email :</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
      </div>
      <div className="form-group">
        <label>Mot de passe :</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
      </div>
      <button type="submit">Se connecter</button>
      <button
        type="button"
        className="redirect-btn"
        onClick={() => navigate('/register')}
      >
        Créer un compte
      </button>
    </form>
  );
};

export default LoginForm;
