import React, { useState } from 'react';
import { registerUser, loginUser } from '../api/client';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg('');
    setLoading(true);

    try {
      let res;
      if (mode === 'register') {
        res = await registerUser({
          email,
          password,
          full_name: fullName
        });
      } else {
        res = await loginUser({
          email,
          password
        });
      }

      setSuccessMsg(res.message || 'Success!');
      if (onAuthSuccess) {
        onAuthSuccess(res.user, res.token);
      }
      setTimeout(() => {
        onClose();
        setError(null);
        setSuccessMsg('');
      }, 700);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        style={{
          maxWidth: '440px',
          width: '90%',
          padding: '32px',
          borderRadius: '16px',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          type="button"
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '1.2rem',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '6px'
          }}
          aria-label="Close"
        >
          ✕
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '2.2rem', marginBottom: '6px' }}>⚡</div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, marginBottom: '6px' }}>
            {mode === 'login' ? 'Welcome Back to ProjectForge' : 'Create Your Student Account'}
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
            {mode === 'login'
              ? 'Access your started projects, roadmaps, and saved blueprints.'
              : 'Save your customized profile, track active builds, and generate roadmaps.'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-input)',
            padding: '4px',
            borderRadius: '10px',
            marginBottom: '20px',
            border: '1px solid var(--border-color)'
          }}
        >
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            style={{
              flex: 1,
              padding: '8px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.88rem',
              background: mode === 'login' ? 'var(--primary)' : 'transparent',
              color: mode === 'login' ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.2s ease'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(null); }}
            style={{
              flex: 1,
              padding: '8px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.88rem',
              background: mode === 'register' ? 'var(--primary)' : 'transparent',
              color: mode === 'register' ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.2s ease'
            }}
          >
            Create Account
          </button>
        </div>

        {/* Error / Success feedback */}
        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#f87171',
              fontSize: '0.84rem',
              marginBottom: '16px'
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {successMsg && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#34d399',
              fontSize: '0.84rem',
              marginBottom: '16px'
            }}
          >
            ✓ {successMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Saurav Kumar"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="you@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={4}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '0.98rem', fontWeight: 700 }}
            disabled={loading}
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Free Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
