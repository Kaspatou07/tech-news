import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p>© {new Date().getFullYear()} Tech-News. Tous droits réservés.</p>
        <nav className="footer-nav">
          <a href="/contact">Contact</a>
          <a href="/about">À propos</a>
          <a href="/privacy">Politique de confidentialité</a>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
