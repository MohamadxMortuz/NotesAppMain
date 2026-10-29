// src/App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import MainPage from './components/MainPage';
import Loader from './components/Loader';

const isLoggedIn = () => !!localStorage.getItem('token');

// These guards read the token at the moment the route is shown. The old code read it
// once when <App> first rendered, so right after a successful login it still believed
// "no token" and sent you back to the login page (you had to log in twice).
function RequireAuth({ children }) {
  return isLoggedIn() ? children : <Navigate to="/" replace />;
}

function GuestOnly({ children }) {
  return isLoggedIn() ? <Navigate to="/main" replace /> : children;
}

function App() {
  const [loading, setLoading] = useState(false);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = '/';
  };

  return (
    <Router>
      {loading && <Loader />}
      <Routes>
        <Route
          path="/"
          element={
            <GuestOnly>
              <LoginPage setLoading={setLoading} />
            </GuestOnly>
          }
        />
        <Route
          path="/main"
          element={
            <RequireAuth>
              <MainPage logout={logout} />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
