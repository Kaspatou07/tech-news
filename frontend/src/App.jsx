import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header/Header';
import ArticleGrid from './components/ArticleGrid/ArticleGrid';
import ArticleDetail from './components/ArticleDetail/ArticleDetail';
import LoginForm from './components/LoginForm/LoginForm';
import SignupForm from './components/SignupForm/SignupForm';
import AdminPanel from './Pages/AdminPanel/AdminPanel';
import AddArticle from './components/AddArticle/AddArticle';
import ManageArticle from './components/ManageArticle/ManageArticle';
import Profile from './Pages/Profile/Profile';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import Footer from './components/Footer/Footer';
import Page404 from './Pages/Page404/Page404';
import './App.css';

function App() {
  // État pour gérer les catégories (pour ArticleGrid)
  const [selectedCategories, setSelectedCategories] = useState([]);

  const handleCategoryFilter = (categories) => {
    setSelectedCategories(categories);
  };

  return (
    <Router>
      <Header onCategoryFilter={handleCategoryFilter} />
      <div className="app-container">
        <Routes>
          <Route path="/" element={<ArticleGrid filterCategories={selectedCategories} />} />
          <Route path="/article/:id" element={<ArticleDetail />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<SignupForm />} />
          <Route path="/404" element={<Page404 />} />
          <Route path="*" element={<Page404 />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminPanel />
              </ProtectedRoute>
            }
          >
            {/* Par défaut, affiche un message de bienvenue */}
            <Route path="manage" element={<ManageArticle />} />
            <Route path="add" element={<AddArticle />} />
          </Route>
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
