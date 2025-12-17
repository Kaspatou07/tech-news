import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

const redirect = sessionStorage.redirect;
if (redirect) {
  sessionStorage.removeItem("redirect");
  window.history.replaceState(null, "", redirect);
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
