import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './SignupForm.css';

const SignupForm = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    axios.post('http://localhost:5000/auth/register', { email, username, password })
      .then(response => {
        localStorage.setItem('token', response.data.token);
        navigate('/profile');
      })
      .catch(err => {
        if (err.response && err.response.data) {
          const errorMessage = err.response.data.error || 'Erreur inconnue';
          setError(errorMessage);
        } else {
          setError('Erreur lors de l\'inscription');
        }
        console.error(err);
      });
  };

  return (
    <form onSubmit={handleSubmit} className="signup-form">
      <h2>Inscription</h2>
      {error && <p className="error">{error}</p>}
      <div className="form-group">
        <label>Email :</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
      </div>
      <div className="form-group">
        <label>Nom d'utilisateur :</label>
        <input type="text" value={username} onChange={e => setUsername(e.target.value)} required />
      </div>
      <div className="form-group">
        <label>Mot de passe :</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
      </div>
      <div className="form-group">
        <label>Confirmer le mot de passe :</label>
        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
      </div>
      <button type="submit">S'inscrire</button>
      <button
        type="button"
        className="redirect-btn"
        onClick={() => navigate('/login')}
      >
        Se connecter
      </button>
    </form>
  );
};

export default SignupForm;
