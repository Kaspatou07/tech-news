import React from 'react';
import { Link } from 'react-router-dom';
import './Page404.css';

const Page404 = () => {
  return (
    <div className="page404-container">
      <h1>404</h1>
      <h2>Page non trouvée</h2>
      <p>Désolé, la page que vous recherchez n'existe pas.</p>
      <Link to="/" className="home-link">Retour à l'accueil</Link>
    </div>
  );
};

export default Page404;
