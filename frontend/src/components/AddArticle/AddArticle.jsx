import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AddArticle.css';

const AddArticle = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [message, setMessage] = useState('');
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('category', category);
    if (imageFile) {
      formData.append('imageFile', imageFile);
    }

    axios.post('http://localhost:5000/articles', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      }
    })
      .then(response => {
        setMessage('Article ajouté avec succès !');
        // Réinitialisation du formulaire
        setTitle('');
        setContent('');
        setCategory('');
        setImageFile(null);
        setPreviewUrl(null);
        setFileInputKey(Date.now());
        navigate('/admin/manage');
      })
      .catch(error => {
        setMessage("Erreur lors de l'ajout de l'article.");
        console.error(error);
      });
  };

  return (
    <div className="add-article">
      <h3>Ajouter un Article</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Titre :</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Contenu :</label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Catégorie :</label>
          <select value={category} onChange={e => setCategory(e.target.value)} required>
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
            key={fileInputKey}
            type="file"
            onChange={handleFileChange}
            accept="image/*"
          />
        </div>
        {previewUrl && (
          <div className="image-preview-container">
            <img src={previewUrl} alt="Aperçu de l'image" className="image-preview" />
          </div>
        )}
        <button type="submit">Ajouter l'article</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default AddArticle;
