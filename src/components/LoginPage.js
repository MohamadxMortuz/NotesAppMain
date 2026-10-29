// src/components/LoginPage.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import Icon from './Icon';
import './LoginPage.css';

function LoginPage({ setLoading }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Keep the theme the user picked inside the app.
  useEffect(() => {
    document.documentElement.setAttribute(
      'data-theme',
      localStorage.getItem('theme') || 'light'
    );
  }, []);

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const response = await axios.post(`${API_URL}${endpoint}`, {
        username: username.trim(),
        password,
      });
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('username', response.data.username);
        navigate('/main');
      } else {
        // Registration succeeded -> send them to the login form.
        setSuccess(response.data.message || 'Account created. You can log in now.');
        setIsLogin(true);
        setPassword('');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Could not reach the server. It may be waking up — please try again in a few seconds.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <section className="auth-aside">
          <div className="aside-brand">
            <span className="aside-logo">
              <Icon name="pencil" size={20} />
            </span>
            <span className="aside-name">
              NOTE<span className="tld">.me</span>
            </span>
          </div>

          <div className="aside-copy">
            <h1>Keep life simple.</h1>
            <p>
              Store all your notes in one calm, intuitive place so you can focus
              on what matters most.
            </p>
          </div>

          <div className="aside-stage">
            <img
              src={`${process.env.PUBLIC_URL}/login-illustration.png`}
              alt=""
              className="stage-img"
            />
            <div className="float-note fn1" aria-hidden="true">
              <Icon name="check" size={14} /> Buy coffee beans
            </div>
            <div className="float-note fn2" aria-hidden="true">
              Call Dad on Sunday
            </div>
          </div>
        </section>

        <section className="auth-main">
          <h2 className="auth-title">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="auth-sub">
            {isLogin
              ? 'Log in to see your notes.'
              : 'It only takes a few seconds.'}
          </p>

          {error && <div className="alert alert-error" role="alert">{error}</div>}
          {success && <div className="alert alert-success" role="status">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. mortuz"
                autoComplete="username"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="password-wrap">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} />
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit">
              {isLogin ? 'Log in' : 'Create account'}
            </button>
          </form>

          <p className="auth-switch">
            {isLogin ? 'New here?' : 'Already have an account?'}{' '}
            <button type="button" onClick={switchMode}>
              {isLogin ? 'Create an account' : 'Log in'}
            </button>
          </p>
        </section>
      </div>
    </div>
  );
}

export default LoginPage;
