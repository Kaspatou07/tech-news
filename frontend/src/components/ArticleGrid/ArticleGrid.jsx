import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { LayoutGrid, List } from 'lucide-react';
import ArticleCard from '../ArticleCard/ArticleCard';
import './ArticleGrid.css';

const ArticleGrid = ({ filterCategories = [] }) => {
  const [articles, setArticles] = useState([]);
  const [articlesToShow, setArticlesToShow] = useState(9);

  // Mode d'affichage sauvegardé dans localStorage
  const [listView, setListView] = useState(() => {
    const savedMode = localStorage.getItem('listView');
    return savedMode ? JSON.parse(savedMode) : false;
  });

  useEffect(() => {
    axios.get('https://tech-news-2wdt.onrender.com/articles')
      .then(response => setArticles(response.data.reverse()))
      .catch(error => console.error(error));
  }, []);

  useEffect(() => {
    localStorage.setItem('listView', JSON.stringify(listView));
  }, [listView]);

  const handleAfficherPlus = () => setArticlesToShow(prev => prev + 9);


  // Logique pour les filtres
  // Si aucun filtre n'est actif, affiche tous les articles
  // Sinon, affiche les articles dont la catégorie correspond à l'un des filtres sélectionnés
  const filteredArticles = filterCategories.length > 0 
    ? articles.filter(article => 
        filterCategories.includes(article.category?.toLowerCase())
      )
    : articles;

  return (
    <div>
      <div className="button-container">
        <button className="toggle-btn" onClick={() => setListView(prev => !prev)}>
          {listView ? <LayoutGrid size={18} /> : <List size={18} />}
        </button>
      </div>

      <div className={`article-grid ${listView ? 'list-view' : 'grid-view'}`}>
        {filteredArticles.slice(0, articlesToShow).map(article => (
          <ArticleCard key={article.id} article={article} listView={listView} />
        ))}
      </div>

      {articlesToShow < filteredArticles.length && (
        <button className="afficher-plus-btn" onClick={handleAfficherPlus}>
          Afficher plus
        </button>
      )}
    </div>
  );  
};

export default ArticleGrid;
