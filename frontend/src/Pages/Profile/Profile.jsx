import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import './Profile.css';

const Profile = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);  
  const [role, setRole] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setRole(decoded.role);
        axios
          .get('http://localhost:5000/profile', {
            headers: { Authorization: `Bearer ${token}` }
          })
          .then(response => {
            const user = response.data.user;
            setEmail(user.email);
            setUsername(user.username);
          })
          .catch(err => {
            console.error('Erreur lors de la récupération des données utilisateur', err);
            setErrorMessage('Erreur lors de la récupération des données utilisateur');
          });
      } catch (error) {
        console.error('Erreur de décodage du token', error);
        setErrorMessage('Erreur de décodage du token');
      }
    } else {
      setErrorMessage('Vous devez être connecté');
    }
  }, []);

  const handlePasswordChange = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (newPassword !== confirmPassword) {
      setErrorMessage('Les mots de passe ne correspondent pas');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage('Le mot de passe doit avoir au moins 6 caractères');
      return;
    }

    const token = localStorage.getItem('token');
    axios
      .patch(
        'http://localhost:5000/auth/update-password',  
        { newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(response => {
        setNewPassword('');
        setConfirmPassword('');
        setSuccessMessage('Mot de passe modifié avec succès');
      })
      .catch(err => {
        setErrorMessage('Erreur lors de la modification du mot de passe');
        console.error(err);
      });
  };

  // Fonction pour afficher ou masquer le mot de passe
  const toggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };

  return (
    <div className="profile">
      <h2>Mon Profil</h2>
      <div className="profile-info">
        <div className="form-group">
          <label>Email :</label>
          <p>{email}</p>
        </div>

        <div className="form-group">
          <label>Nom d'utilisateur :</label>
          <p>{username}</p>
        </div>
      </div>

      <form onSubmit={handlePasswordChange} className="password-change-form">
        <h3>Changer le mot de passe</h3>
        <div className="form-group">
          <label>Nouveau mot de passe :</label>
          <div>
            <input 
              type={showNewPassword ? 'text' : 'password'} 
              value={newPassword} 
              onChange={e => setNewPassword(e.target.value)} 
              required 
            />
          </div>
        </div>

        <div className="form-group">
          <label>Confirmer le nouveau mot de passe :</label>
          <input 
            type={showNewPassword ? 'text' : 'password'} 
            value={confirmPassword} 
            onChange={e => setConfirmPassword(e.target.value)} 
            required 
          />
        </div>
        
        {/* Affichage/Masquage du mot de passe */}
        <button className="show-new-password-btn" type="button" onClick={toggleNewPasswordVisibility}>
          {showNewPassword ? 'Cacher' : 'Afficher'}
        </button>

        <button className="submit-password-btn" type="submit">Modifier le mot de passe</button>

        {/* Affichage des messages d'erreur et de succès sous le formulaire */}
        {errorMessage && <p className="error">{errorMessage}</p>}
        {successMessage && <p className="success">{successMessage}</p>}
      </form>

      {/* Si l'utilisateur est un administrateur, afficher un lien vers le panel admin */}
      {role === 'admin' && (
        <div className="admin-link">
          <button onClick={() => navigate('/admin')}>
            Accéder à l'espace admin
          </button>
        </div>
      )}
    </div>
  );
};

export default Profile;
