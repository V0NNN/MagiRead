import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from './context/AuthContext';
import { MangaCacheProvider } from './context/MangaCacheContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <MangaCacheProvider>
        <App />
      </MangaCacheProvider>
    </AuthProvider>
  </React.StrictMode>
);