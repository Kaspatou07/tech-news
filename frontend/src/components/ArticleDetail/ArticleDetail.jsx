import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { QuillDeltaToHtmlConverter } from 'quill-delta-to-html';
import parse from 'html-react-parser';
import './ArticleDetail.css';
import 'quill/dist/quill.snow.css';

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
  const [htmlContent, setHtmlContent] = useState('');

  useEffect(() => {
    axios.get(`https://tech-news-2wdt.onrender.com/articles/${id}`)
      .then(response => {
        setArticle(response.data);
        if (response.data.content) {
          let convertedHtml = "";
          // Si le contenu commence par une balise (<), on considère qu'il s'agit déjà de HTML
          if (response.data.content.trim().startsWith("<")) {
            convertedHtml = response.data.content;
          } else {
            try {
              // Tenter de parser le contenu comme un Delta JSON
              const delta = JSON.parse(response.data.content);
              const converter = new QuillDeltaToHtmlConverter(delta.ops, {});
              convertedHtml = converter.convert();
            } catch (error) {
              console.error("Erreur lors de la conversion du Delta, utilisation du HTML direct :", error);
              convertedHtml = response.data.content;
            }
          }
          setHtmlContent(convertedHtml);
        }
      })
      .catch(error => {
        if (error.response && error.response.status === 404) {
          navigate('/404');
        } else {
          console.error("Erreur lors de la récupération de l'article :", error);
        }
      });
  }, [id, navigate]);

  if (!article) return <div>Chargement...</div>;

  // Définir la date et le libellé d'affichage
  const articleDate = article.updatedAt ? article.updatedAt : article.createdAt;
  const dateLabel = article.updatedAt ? 'Modifié' : 'Publié';

  const formattedDate = new Date(articleDate).toLocaleDateString('fr-FR', {
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
      <p className="detail-date">{dateLabel} le {formattedDate}</p>
      {article.category && (
        <p className={`detail-category ${getCategoryClass(article.category)}`}>
          Catégorie : {article.category}
        </p>
      )}
      <div className="detail-content">
        {htmlContent ? parse(htmlContent) : "Contenu vide"}
      </div>
    </div>
  );
};

export default ArticleDetail;
