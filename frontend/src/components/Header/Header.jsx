import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { FaSun, FaMoon } from 'react-icons/fa';
import logo from '../assets/LogoTechNews.webp'; 
import './Header.css';

// Fonction utilitaire pour retourner une classe CSS associée à une catégorie
const getCategoryClass = (category) => {
  if (!category) return '';
  switch (category.toLowerCase()) {
    case 'informatique':
      return 'category-informatique';
    case 'mobile':
      return 'category-mobile';
    case 'innovation':
      return 'category-innovation';
    case 'gadgets':
      return 'category-gadgets';
    case 'jeux':
      return 'category-jeux';
    default:
      return '';
  }
};

const Header = ({ onCategoryFilter }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  let isAdmin = false;
  if (token) {
    try {
      const decoded = jwtDecode(token);
      isAdmin = decoded.role === 'admin';
    } catch (error) {
      console.error('Erreur de décodage du token', error);
    }
  }

  // État pour le mode sombre
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode === 'true';
  });

  // État pour les catégories sélectionnées (tableau)
  const [selectedCategories, setSelectedCategories] = useState([]);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const handleToggleDarkMode = () => {
    setDarkMode(prevMode => !prevMode);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Lorsqu'un bouton de filtre est cliqué : on bascule la présence de la catégorie dans le tableau
  const handleCategoryFilterClick = (category) => {
    let updatedFilters;
    if (selectedCategories.includes(category)) {
      updatedFilters = selectedCategories.filter(cat => cat !== category);
    } else {
      updatedFilters = [...selectedCategories, category];
    }
    setSelectedCategories(updatedFilters);
    if (onCategoryFilter) {
      onCategoryFilter(updatedFilters);
    }
  };

  return (
    <header className="header">
      <div className="header-wrapper">
        {/* Logo */}
        <div className="header-left">
          <Link to="/">
            <img src={logo} alt="Logo Tech News" className="header-logo" />
          </Link>
        </div>

        {/* Menu principal */}
        <nav className="header-middle">
          <ul className="nav-menu">
            <li className="nav-item">
            <Link to="/"><span>Actualités</span></Link>
              <ul className="dropdown-menu">
                <li>
                  <button 
                    type="button" 
                    onClick={() => handleCategoryFilterClick('informatique')}
                    className={selectedCategories.includes('informatique') ? `active-filter ${getCategoryClass('informatique')}` : ''}
                  >
                    Informatique
                  </button>
                </li>
                <li>
                  <button 
                    type="button" 
                    onClick={() => handleCategoryFilterClick('mobile')}
                    className={selectedCategories.includes('mobile') ? `active-filter ${getCategoryClass('mobile')}` : ''}
                  >
                    Mobile
                  </button>
                </li>
                <li>
                  <button 
                    type="button" 
                    onClick={() => handleCategoryFilterClick('innovation')}
                    className={selectedCategories.includes('innovation') ? `active-filter ${getCategoryClass('innovation')}` : ''}
                  >
                    Innovation
                  </button>
                </li>
                <li>
                  <button 
                    type="button" 
                    onClick={() => handleCategoryFilterClick('gadgets')}
                    className={selectedCategories.includes('gadgets') ? `active-filter ${getCategoryClass('gadgets')}` : ''}
                  >
                    Gadgets
                  </button>
                </li>
                <li>
                  <button 
                    type="button" 
                    onClick={() => handleCategoryFilterClick('jeux')}
                    className={selectedCategories.includes('jeux') ? `active-filter ${getCategoryClass('jeux')}` : ''}
                  >
                    Jeux
                  </button>
                </li>
              </ul>
            </li>
            <li className="nav-item">
              <Link to="/guide">Guide</Link>
            </li>
            <li className="nav-item">
              <Link to="/dossiers">Dossiers</Link>
            </li>
          </ul>
        </nav>

        {/* Zone droite : Dark mode, profil etc */}
        <div className="header-right">
          <button onClick={handleToggleDarkMode} className="dark-mode-btn">
            {darkMode ? <FaSun title="Mode Jour" /> : <FaMoon title="Mode Nuit" />}
          </button>
          {token ? (
            <>
              <Link to="/profile" className="header-link">Profil</Link>
              {isAdmin && <Link to="/admin" className="header-link">Panel Admin</Link>}
              <button onClick={handleLogout} className="logout-btn">Se déconnecter</button>
            </>
          ) : (
            <button onClick={() => navigate('/login')} className="login-btn">
              Se connecter
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
