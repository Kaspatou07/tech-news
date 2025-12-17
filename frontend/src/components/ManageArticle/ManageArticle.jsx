// ManageArticle.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import './ManageArticle.css';

const ManageArticle = () => {
  // États pour la liste, la recherche, la pagination et les messages
  const [articles, setArticles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [message, setMessage] = useState('');
  const articlesPerPage = 5;
  const token = localStorage.getItem('token');

  // États pour l'édition inline
  const [editingArticle, setEditingArticle] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editImageFile, setEditImageFile] = useState(null);
  const [editPreviewUrl, setEditPreviewUrl] = useState(null);
  const [editFileInputKey, setEditFileInputKey] = useState(Date.now());

  // Références pour l'éditeur Quill en mode édition
  const editEditorRef = useRef(null);
  const editQuillRef = useRef(null);

  // Récupération des articles
  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = () => {
    axios.get('https://tech-news-2wdt.onrender.com/articles')
      .then(response => setArticles(response.data.reverse()))
      .catch(error => console.error('Erreur lors de la récupération des articles:', error));
  };

  const handleDelete = (id) => {
    axios.delete(`https://tech-news-2wdt.onrender.com/articles/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(response => {
        setMessage('Article supprimé avec succès !');
        fetchArticles();
      })
      .catch(error => {
        setMessage("Erreur lors de la suppression de l'article.");
        console.error(error);
      });
  };

  // --- Gestion de l'édition inline ---

  // Démarrer l'édition pour un article sélectionné
  const startEditArticle = (article) => {
    setEditingArticle(article);
    setEditTitle(article.title);
    setEditContent(article.content); // Conserver le contenu original
    setEditCategory(article.category || '');
    setEditImageFile(null);
    setEditPreviewUrl(article.image || null);
    setEditFileInputKey(Date.now());
  };

  const cancelEdit = () => {
    setEditingArticle(null);
    setEditTitle('');
    setEditContent('');
    setEditCategory('');
    setEditImageFile(null);
    setEditPreviewUrl(null);
    setEditFileInputKey(Date.now());
    if (editQuillRef.current) {
      editQuillRef.current = null;
    }
  };

  const handleEditFileChange = (e) => {
    const file = e.target.files[0];
    setEditImageFile(file);
    setEditPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', editTitle);
    formData.append('content', editContent);
    formData.append('category', editCategory);
    // Ajout de la date de modification
    formData.append('updatedAt', new Date().toISOString());
    if (editImageFile) {
      formData.append('imageFile', editImageFile);
    }

    axios.patch(`https://tech-news-2wdt.onrender.com/articles/${editingArticle.id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      }
    })
      .then(response => {
        setMessage('Article modifié avec succès !');
        cancelEdit();
        fetchArticles();
      })
      .catch(error => {
        setMessage("Erreur lors de la modification de l'article.");
        console.error(error);
      });
  };

  // Initialisation de l'éditeur Quill pour l'édition
  useEffect(() => {
    if (editingArticle && editEditorRef.current) {
      // Réinitialiser le conteneur pour éviter la duplication
      editEditorRef.current.innerHTML = '';

      const options = {
        theme: 'snow',
        placeholder: 'Composez votre texte...',
        modules: {
          toolbar: {
            container: [
              [{ font: [] }],
              [{ header: [1, 2, 3, 4, 5, 6, false] }],
              [{ size: ['small', false, 'large', 'huge'] }],
              ['bold', 'italic', 'underline', 'strike'],
              [{ color: [] }, { background: [] }],
              [{ script: 'sub' }, { script: 'super' }],
              [{ list: 'ordered' }, { list: 'bullet' }],
              [{ indent: '-1' }, { indent: '+1' }],
              [{ direction: 'rtl' }],
              [{ align: [] }],
              ['link', 'image', 'video'],
              ['clean']
            ]
          },
        },
      };

      // Création de l'instance de Quill
      editQuillRef.current = new Quill(editEditorRef.current, options);

      // Charger le contenu initial à partir de l'article édité
      const initialContent = editingArticle.content;
      try {
        const delta = JSON.parse(initialContent);
        editQuillRef.current.setContents(delta);
      } catch (error) {
        // Si le contenu n'est pas du JSON valide, afficher le texte brut
        editQuillRef.current.setText(initialContent);
      }

      // Mettre à jour l'état editContent lors des modifications dans l'éditeur
      editQuillRef.current.on('text-change', () => {
        const delta = editQuillRef.current.getContents();
        setEditContent(JSON.stringify(delta));
      });
    }
  }, [editingArticle]); // Se déclenche uniquement lorsque l'article édité change

  // --- Fin de la gestion de l'édition inline ---

  // Filtrage des articles selon la recherche
  const filteredArticles = articles.filter(article => {
    const query = searchQuery.toLowerCase();
    return article.id.toString().includes(query) ||
           article.title.toLowerCase().includes(query);
  });

  // Pagination
  const indexOfLast = currentPage * articlesPerPage;
  const indexOfFirst = indexOfLast - articlesPerPage;
  const currentArticles = filteredArticles.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredArticles.length / articlesPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  return (
    <div className="manage-articles">
      {message && <p className="admin-message">{message}</p>}

      {/* Formulaire d'édition inline */}
      {editingArticle && (
        <div className="edit-article">
          <h4>Modifier l'article ID {editingArticle.id}</h4>
          <form onSubmit={handleEditSubmit}>
            <div className="form-group">
              <label>Titre :</label>
              <input 
                type="text" 
                value={editTitle} 
                onChange={e => setEditTitle(e.target.value)} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Contenu :</label>
              {/* Zone d'édition Quill */}
              <div id="edit-editor" ref={editEditorRef} className="quill-editor"></div>
            </div>
            <div className="form-group">
              <label>Catégorie :</label>
              <select 
                value={editCategory} 
                onChange={e => setEditCategory(e.target.value)} 
                required
              >
                <option value="" disabled>Choisir une catégorie</option>
                <option value="Informatique">Informatique</option>
                <option value="Mobile">Mobile</option>
                <option value="Innovation">Innovation</option>
                <option value="Gadgets">Gadgets</option>
                <option value="Jeux">Jeux</option>
              </select>
            </div>
            <div className="form-group">
              <label>Image :</label>
              <input 
                key={editFileInputKey}
                type="file" 
                onChange={handleEditFileChange} 
                accept="image/*" 
              />
            </div>
            {editPreviewUrl && (
              <div className="image-preview-container">
                <img src={editPreviewUrl} alt="Aperçu de l'image" className="image-preview" />
              </div>
            )}
            <button type="submit">Enregistrer les modifications</button>
            <button type="button" onClick={cancelEdit}>Annuler</button>
          </form>
        </div>
      )}

      {/* Barre de recherche */}
      <div className="search-bar">
        <input 
          type="text" 
          placeholder="Rechercher par id ou titre..." 
          value={searchQuery}
          onChange={e => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }} 
        />
      </div>

      {/* Tableau des articles */}
      {currentArticles.length > 0 ? (
        <div className="table-container">
          <table className="articles-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Titre</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentArticles.map(article => {
                // Définir le libellé selon la présence de updatedAt
                const dateLabel = article.updatedAt ? 'Modifié' : 'Publié';
                const formattedDate = article.updatedAt
                  ? new Date(article.updatedAt).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })
                  : article.createdAt
                  ? new Date(article.createdAt).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })
                  : 'N/A';
                return (
                  <tr key={article.id}>
                    <td>{article.id}</td>
                    <td>{article.title}</td>
                    <td>{dateLabel} le {formattedDate}</td>
                    <td className="action-cell">
                      <button className="edit-button" onClick={() => startEditArticle(article)}>
                        ✏️
                      </button>
                      <button className="delete-button" onClick={() => handleDelete(article.id)}>
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p>Aucun article trouvé.</p>
      )}

      {/* Pagination */}
      {filteredArticles.length > articlesPerPage && (
        <div className="pagination">
          <button onClick={handlePrevPage} disabled={currentPage === 1}>Précédent</button>
          <span>Page {currentPage} sur {totalPages}</span>
          <button onClick={handleNextPage} disabled={currentPage === totalPages}>Suivant</button>
        </div>
      )}
    </div>
  );
};

export default ManageArticle;
