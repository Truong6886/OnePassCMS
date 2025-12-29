import React, { useState } from 'react';
import heroBanner from '../assets/herobanner-1.png';
// 1. Import thêm 2 hook này từ react-router-dom
import { useNavigate, useLocation } from 'react-router-dom';

const API_BASE = "https://onepasscms-backend.onrender.com/api";

const Login = ({ setCurrentUser }) => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState('vi');


  const navigate = useNavigate();
  const location = useLocation();


  const from = location.state?.from?.pathname || "/";

  const onLanguageChange = (lang) => {
    setCurrentLanguage(lang);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

 const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.message || 'Đăng nhập thất bại');
      
      setCurrentUser(result.user);


      localStorage.setItem("currentUser", JSON.stringify(result.user));


      if (result.token) {
          localStorage.setItem("sessionToken", result.token);
      }

      console.log("✅ Đăng nhập thành công & đã lưu Session Token");

      navigate(from, { replace: true });

    } catch (err) {
      console.error('Lỗi đăng nhập:', err);
      setError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };  

  return (
    <div 
      className="container-fluid vh-100 d-flex align-items-center justify-content-center"
      style={{
        backgroundImage: `url(${heroBanner})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div 
        className="card shadow border-0 position-relative" 
        style={{ 
          width: '100%', 
          maxWidth: '480px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}
      >
    
        <div className="position-absolute top-0 end-0 p-3">
          <div className="d-flex align-items-center" style={{ gap: '12px' }}>
          
            <button
              type="button"
              onClick={() => onLanguageChange('vi')}
              style={{
                width: '25px',
                height: '25px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: 'none',
                boxShadow:
                  currentLanguage === 'vi'
                    ? '0 0 8px rgba(0,0,0,0.2), 0 0 10px rgba(255,255,255,0.4)'
                    : '0 2px 6px rgba(0,0,0,0.2)',
                background: 'transparent',
                cursor: 'pointer',
                padding: 0,
                transition: 'all 0.3s ease',
                transform: currentLanguage === 'vi' ? 'scale(1.1)' : 'scale(1)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.15)')}
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform =
                  currentLanguage === 'vi' ? 'scale(1.1)' : 'scale(1)')
              }
            >
              <img
                src="https://flagcdn.com/w80/vn.png"
                alt="Vietnamese"
                style={{
                  width: '25px',
                  height: '25px',
                  objectFit: 'cover',
                  display: 'block',
                  borderRadius: '50%',
                  filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.2))',
                }}
              />
            </button>

          
            <button
              type="button"
              onClick={() => onLanguageChange('en')}
              style={{
                width: '25px',
                height: '25px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: 'none',
                boxShadow:
                  currentLanguage === 'en'
                    ? '0 0 8px rgba(0,0,0,0.2), 0 0 10px rgba(255,255,255,0.4)'
                    : '0 2px 6px rgba(0,0,0,0.2)',
                background: 'transparent',
                cursor: 'pointer',
                padding: 0,
                transition: 'all 0.3s ease',
                transform: currentLanguage === 'en' ? 'scale(1.1)' : 'scale(1)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.15)')}
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform =
                  currentLanguage === 'en' ? 'scale(1.1)' : 'scale(1)')
              }
            >
              <img
                src="https://flagcdn.com/w80/gb.png"
                alt="English"
                style={{
                  width: '25px',
                  height: '25px',
                  objectFit: 'cover',
                  display: 'block',
                  borderRadius: '50%',
                  filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.2))',
                }}
              />
            </button>

            {/* 🇰🇷 Korean */}
            <button
              type="button"
              onClick={() => onLanguageChange('ko')}
              style={{
                width: '25px',
                height: '25px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: 'none',
                boxShadow:
                  currentLanguage === 'ko'
                    ? '0 0 8px rgba(0,0,0,0.2), 0 0 10px rgba(255,255,255,0.4)'
                    : '0 2px 6px rgba(0,0,0,0.2)',
                background: 'transparent',
                cursor: 'pointer',
                padding: 0,
                transition: 'all 0.3s ease',
                transform: currentLanguage === 'ko' ? 'scale(1.1)' : 'scale(1)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.15)')}
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform =
                  currentLanguage === 'ko' ? 'scale(1.1)' : 'scale(1)')
              }
            >
              <img
                src="https://flagcdn.com/w80/kr.png"
                alt="Korean"
                style={{
                  width: '25px',
                  height: '25px',
                  objectFit: 'cover',
                  display: 'block',
                  borderRadius: '50%',
                  filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.2))',
                }}
              />
            </button>
          </div>
        </div>

        <div className="card-body p-5">
          <div className="text-center mb-5">
            <h3 className="text-primary fw-bold mb-3">
              {currentLanguage === 'vi' ? 'Đăng nhập hệ thống' : currentLanguage === 'ko' ? '시스템 로그인' : 'System Login'}
            </h3>
            <p className="text-muted mb-0 fs-5">
              {currentLanguage === 'vi' ? 'Quản lý yêu cầu khách hàng' : currentLanguage === 'ko' ? '고객 요청 관리' : 'Customer Request Management'}
            </p>
          </div>

          {error && (
            <div className="alert alert-danger py-3 mb-4" role="alert">
              <span className="fw-semibold fs-6">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="username" className="form-label fw-semibold text-secondary fs-6">
                {currentLanguage === 'vi' ? 'Tên đăng nhập' : currentLanguage === 'ko' ? '사용자명' : 'Username'}
              </label>
              <input
                type="text"
                className="form-control form-control-lg"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                disabled={loading}
                placeholder={currentLanguage === 'vi' ? 'Nhập tên đăng nhập' : currentLanguage === 'ko' ? '사용자명 입력' : 'Enter username'}
              />
            </div>

            <div className="mb-5">
              <label htmlFor="password" className="form-label fw-semibold text-secondary fs-6">
                {currentLanguage === 'vi' ? 'Mật khẩu' : currentLanguage === 'ko' ? '비밀번호' : 'Password'}
              </label>
              <input
                type="password"
                className="form-control form-control-lg"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                disabled={loading}
                placeholder={currentLanguage === 'vi' ? 'Nhập mật khẩu' : currentLanguage === 'ko' ? '비밀번호 입력' : 'Enter password'}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary w-100 py-3 fw-semibold"
              disabled={loading}
              style={{ fontSize: '1.1rem' }}
            >
              {loading
                ? currentLanguage === 'vi'
                  ? 'Đang đăng nhập...'
                  : currentLanguage === 'ko'
                  ? '로그인 중...'
                  : 'Logging in...'
                : currentLanguage === 'vi'
                ? 'Đăng nhập'
                : currentLanguage === 'ko'
                ? '로그인'
                : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
