import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './ArticleDetail.css';

// Fonction pour retourner une classe CSS en fonction de la catégorie
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

const ArticleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);

  useEffect(() => {
    axios.get(`http://localhost:5000/articles/${id}`)
      .then(response => setArticle(response.data))
      .catch(error => {
        if (error.response && error.response.status === 404) {
          navigate('/404');
        } else {
          console.error('Erreur lors de la récupération de l\'article:', error);
        }
      });
  }, [id, navigate]);

  if (!article) return <div>Chargement...</div>;

  const formattedDate = new Date(article.createdAt).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="article-detail">
      <button className="back-button" onClick={handleBack} title="Retour à l'accueil">
        ← Retour
      </button>
      <img src={article.image} alt={article.title} className="detail-image" />
      <h2>{article.title}</h2>
      <p className="detail-date">Publié le {formattedDate}</p>
      {article.category && (
        <p className={`detail-category ${getCategoryClass(article.category)}`}>
          Catégorie : {article.category}
        </p>
      )}
      <div className="detail-content">
        {article.content.split('\n').map((para, idx) => (
          <p key={idx}>{para}</p>
        ))}
      </div>
    </div>
  );
};

export default ArticleDetail;
