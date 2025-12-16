import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import './AddArticle.css';

const AddArticle = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [message, setMessage] = useState('');
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  const editorRef = useRef(null);
  const quillRef = useRef(null);

  const imageHandler = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();
    input.onchange = async () => {
      const file = input.files[0];
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        try {
          const response = await axios.post('https://tech-news-2wdt.onrender.com/quill-upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${token}`,
            },
          });
          const imageUrl = response.data.location;
          const range = quillRef.current.getSelection();
          quillRef.current.insertEmbed(range.index, 'image', imageUrl);
        } catch (err) {
          console.error("Erreur d'upload d'image via toolbar : ", err);
        }
      }
    };
  }, [token]);

  useEffect(() => {
    if (editorRef.current && !quillRef.current) {
      const options = {
        theme: 'snow',
        placeholder: 'Composez votre texte...',
        modules: {
          toolbar: {
            container: [
              [{ 'font': [] }],
              [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
              [{ 'size': ['small', false, 'large', 'huge'] }],
              ['bold', 'italic', 'underline', 'strike'],
              [{ 'color': [] }, { 'background': [] }],
              [{ 'script': 'sub' }, { 'script': 'super' }],
              [{ 'list': 'ordered' }, { 'list': 'bullet' }],
              [{ 'indent': '-1' }, { 'indent': '+1' }],
              [{ 'direction': 'rtl' }],
              [{ 'align': [] }],
              ['link', 'image', 'video'],
              ['clean']
            ],
            handlers: {
              image: imageHandler,
            },
          },
        },
      };

      quillRef.current = new Quill(editorRef.current, options);

      // Intercepter le collage d'images pour éviter l'insertion d'images en base64
      quillRef.current.root.addEventListener('paste', async (e) => {
        const clipboardData = e.clipboardData || window.clipboardData;
        if (clipboardData && clipboardData.items) {
          const items = clipboardData.items;
          for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") !== -1) {
              e.preventDefault();
              const file = items[i].getAsFile();
              if (file) {
                const formData = new FormData();
                formData.append('file', file);
                try {
                  const response = await axios.post('https://tech-news-2wdt.onrender.com/quill-upload', formData, {
                    headers: {
                      'Content-Type': 'multipart/form-data',
                      'Authorization': `Bearer ${token}`,
                    },
                  });
                  const imageUrl = response.data.location;
                  const range = quillRef.current.getSelection();
                  quillRef.current.insertEmbed(range.index, 'image', imageUrl);
                } catch (err) {
                  console.error("Erreur d'upload d'image collée : ", err);
                }
              }
              break;
            }
          }
        }
      });

      // Enregistrer le Delta sous forme de JSON
      quillRef.current.on('text-change', () => {
        const delta = quillRef.current.getContents();
        setContent(JSON.stringify(delta));
      });
    }
  }, [token, imageHandler]);

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

    axios.post('https://tech-news-2wdt.onrender.com/articles', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(response => {
        setMessage('Article ajouté avec succès !');
        setTitle('');
        setContent('');
        setCategory('');
        setImageFile(null);
        setPreviewUrl(null);
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
          <div id="editor" ref={editorRef} className="quill-editor"></div>
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
