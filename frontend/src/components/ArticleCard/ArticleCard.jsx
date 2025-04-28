import React from 'react';
import { Link } from 'react-router-dom';
import './ArticleCard.css';
import 'quill/dist/quill.snow.css';

const ArticleCard = ({ article, listView }) => {
  // Définir la date et le libellé en fonction de la présence de updatedAt
  const articleDate = article.updatedAt ? article.updatedAt : article.createdAt;
  const dateLabel = article.updatedAt ? 'Modifié' : 'Publié';

  const formattedDate = new Date(articleDate).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

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

  // La vignette de catégorie (affichée si la catégorie est renseignée)
  const categoryBadge = article.category && (
    <div className={`category-badge ${getCategoryClass(article.category)}`}>
      {article.category}
    </div>
  );

  if (listView) {
    return (
      <div className="article-card list">
        <Link to={`/article/${article.id}`} aria-label={`Lire l'article : ${article.title}`} className="list-container">
          {categoryBadge}
          <img src={article.image} alt={article.title} className="article-image list" />
          <div className="content">
            <h3>{article.title}</h3>
            <p className="article-date">{dateLabel} le {formattedDate}</p>
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div className="article-card">
      <Link to={`/article/${article.id}`} aria-label={`Lire l'article : ${article.title}`}>
        {categoryBadge}
        <img src={article.image} alt={article.title} className="article-image" />
        <h3>{article.title}</h3>
        <p className="article-date">{dateLabel} le {formattedDate}</p>
      </Link>
    </div>
  );
};

export default ArticleCard;
