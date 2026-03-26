import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { authApi } from '../services/authApi';
import type { LoginRequest } from '../types';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

// 背景图配置 - 添加更多背景图到 src/public/backgrounds/ 目录
const BACKGROUNDS = [
  '/backgrounds/wallhaven-1qdz5w.png',
  '/backgrounds/wallhaven-9o2w9k.png',
  '/backgrounds/wallhaven-powv93.jpg',
  '/backgrounds/wallhaven-vpo8k8.jpg',
];

// 获取随机背景图索引，存储在 sessionStorage 中确保每次登录会话内一致
const getRandomBackgroundIndex = (): number => {
  const storedIndex = sessionStorage.getItem('login_background_index');
  if (storedIndex !== null) {
    return parseInt(storedIndex, 10);
  }
  
  // 生成新的随机索引
  const randomIndex = Math.floor(Math.random() * BACKGROUNDS.length);
  sessionStorage.setItem('login_background_index', randomIndex.toString());
  return randomIndex;
};

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [bgLoaded, setBgLoaded] = useState(false);

  // 随机选择背景图
  const backgroundIndex = useMemo(() => getRandomBackgroundIndex(), []);
  const backgroundUrl = BACKGROUNDS[backgroundIndex];

  // 预加载背景图
  useEffect(() => {
    const img = new Image();
    img.onload = () => setBgLoaded(true);
    img.src = backgroundUrl;
  }, [backgroundUrl]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      setError('Please enter username and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await authApi.login({ username: username.trim(), password });

      if (result.code === 0) {
        // Clear background index after successful login, next login will switch to new background
        sessionStorage.removeItem('login_background_index');
        onLoginSuccess();
      } else {
        setError(result.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error, please try again later');
    } finally {
      setLoading(false);
    }
  }, [username, password, onLoginSuccess]);

  return (
    <div style={styles.container}>
      {/* 左侧背景区域 */}
      <div style={styles.leftPanel}>
        {/* 背景图 */}
        <div 
          style={{
            ...styles.backgroundImage,
            backgroundImage: bgLoaded ? `url(${backgroundUrl})` : undefined,
            opacity: bgLoaded ? 1 : 0,
          }}
        />
        {/* 渐变遮罩 */}
        <div style={styles.overlay} />
        
        {/* Left Content */}
        <div style={styles.leftContent}>
          <div style={styles.brandIcon}>
            <i className="fa-solid fa-cube" />
          </div>
          <h1 style={styles.brandTitle}>Cockpit</h1>
          <p style={styles.brandSubtitle}>Modern Server Operations Management Platform</p>
          <div style={styles.features}>
            <div style={styles.featureItem}>
              <i className="fa-solid fa-terminal" style={{...styles.featureIcon, color: '#3b82f6'}} />
              <span>SSH Terminal Management</span>
            </div>
            <div style={styles.featureItem}>
              <i className="fa-solid fa-folder-open" style={{...styles.featureIcon, color: '#8b5cf6'}} />
              <span>SFTP File Transfer</span>
            </div>
            <div style={styles.featureItem}>
              <i className="fa-solid fa-chart-line" style={{...styles.featureIcon, color: '#10b981'}} />
              <span>System Monitoring Dashboard</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Login Area */}
      <div style={styles.rightPanel}>
        <div style={styles.loginContainer}>
          {/* Header */}
          <div style={styles.header}>
            <h2 style={styles.title}>Welcome Back</h2>
            <p style={styles.subtitle}>Please sign in to your account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Error Message */}
            {error && (
              <div style={styles.errorBanner}>
                <i className="fa-solid fa-circle-exclamation" style={styles.errorIcon} />
                <span>{error}</span>
              </div>
            )}

            {/* Username */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Username</label>
              <div style={styles.inputWrapper}>
                <i className="fa-solid fa-user" style={{...styles.inputIcon, color: '#6366f1'}} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  style={styles.input}
                  disabled={loading}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <div style={styles.inputWrapper}>
                <i className="fa-solid fa-lock" style={{...styles.inputIcon, color: '#8b5cf6'}} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={{ ...styles.input, ...styles.passwordInput }}
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.passwordToggle}
                  tabIndex={-1}
                >
                  <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} style={{ color: '#94a3b8' }} />
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              style={{
                ...styles.submitButton,
                ...(loading ? styles.submitButtonDisabled : {}),
              }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-spinner" style={styles.loadingIcon} />
                  Signing in...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-right-to-bracket" style={styles.buttonIcon} />
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    width: '100%',
  },
  // 左侧面板
  leftPanel: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    minWidth: '400px',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    transition: 'opacity 0.5s ease-in-out',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.7) 0%, rgba(30, 41, 59, 0.6) 100%)',
  },
  leftContent: {
    position: 'relative',
    zIndex: 1,
    textAlign: 'center',
    color: 'white',
    padding: '40px',
  },
  brandIcon: {
    width: '80px',
    height: '80px',
    margin: '0 auto 24px',
    borderRadius: '20px',
    background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '40px',
    border: '1px solid rgba(255,255,255,0.2)',
  },
  brandTitle: {
    fontSize: '36px',
    fontWeight: 700,
    margin: '0 0 12px',
    textShadow: '0 2px 10px rgba(0,0,0,0.3)',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
  },
  brandSubtitle: {
    fontSize: '16px',
    opacity: 0.9,
    margin: '0 0 48px',
    fontWeight: 400,
  },
  features: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    alignItems: 'center',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 24px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '12px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.1)',
    fontSize: '14px',
    fontWeight: 500,
    minWidth: '200px',
  },
  featureIcon: {
    fontSize: '18px',
    opacity: 0.9,
  },
  // 右侧面板
  rightPanel: {
    width: '480px',
    minWidth: '400px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    backgroundColor: '#f8fafc',
    position: 'relative',
  },
  loginContainer: {
    width: '100%',
    maxWidth: '360px',
  },
  header: {
    marginBottom: '32px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#0f172a',
    margin: '0 0 8px',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
  },
  subtitle: {
    fontSize: '15px',
    color: '#64748b',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px 16px',
    borderRadius: '10px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#dc2626',
    fontSize: '14px',
  },
  errorIcon: {
    fontSize: '16px',
    flexShrink: 0,
    color: '#ef4444',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#334155',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '14px',
    fontSize: '16px',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '14px 16px 14px 44px',
    fontSize: '15px',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    backgroundColor: 'white',
    color: '#1e293b',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
  },
  passwordInput: {
    paddingRight: '48px',
  },
  passwordToggle: {
    position: 'absolute',
    right: '14px',
    padding: '4px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.2s ease',
  },
  submitButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    padding: '14px 24px',
    fontSize: '15px',
    fontWeight: 600,
    color: 'white',
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
    marginTop: '8px',
  },
  submitButtonDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },
  buttonIcon: {
    fontSize: '16px',
  },
  loadingIcon: {
    fontSize: '16px',
    animation: 'spin 1s linear infinite',
  },
};

// Add CSS animations and hover effects
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  input:focus {
    border-color: #6366f1 !important;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15) !important;
  }
  
  button[type="submit"]:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(99, 102, 241, 0.45) !important;
  }
  
  button[type="submit"]:active:not(:disabled) {
    transform: translateY(0);
  }
  
  .password-toggle:hover {
    color: #64748b !important;
  }
  
  .version-container:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
  }
  
  @media (max-width: 900px) {
    .login-left-panel {
      display: none !important;
    }
    .login-right-panel {
      width: 100% !important;
      min-width: unset !important;
    }
  }
`;
document.head.appendChild(styleSheet);

export default LoginPage;