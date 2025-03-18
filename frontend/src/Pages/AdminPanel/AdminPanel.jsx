// AdminPanel.jsx
import React from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import './AdminPanel.css';

const AdminPanel = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Le bouton "Retour" s'affiche seulement si le chemin actuel n'est pas exactement '/admin'
  const showBackButton = location.pathname !== '/admin';

  return (
    <div className="admin-panel">
      {showBackButton && (
        <button className="back-button" onClick={() => navigate('/admin')}>
          ← Retour au Dashboard
        </button>
      )}
      <h2>Dashboard Admin</h2>
      <div className="admin-menu">
        <button className="menu-button">
          <Link to="/admin/manage">Gérer les articles</Link>
        </button>
        <button className="menu-button">
          <Link to="/admin/add">Ajouter un article</Link>
        </button>
      </div>
      <Outlet />
    </div>
  );
};

export default AdminPanel;
