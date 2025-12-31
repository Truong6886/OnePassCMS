import React, { useState } from 'react';
import heroBanner from '../assets/herobanner-1.png';
import { useNavigate, useLocation } from 'react-router-dom';

const API_BASE = "https://onepasscms-backend-tvdy.onrender.com/api";

// CSS để ẩn con mắt mặc định của trình duyệt (Edge/Chrome)
const hideBrowserEyeStyles = `
  input[type="password"]::-ms-reveal,
  input[type="password"]::-ms-clear {
    display: none;
  }
`;

const Login = ({ setCurrentUser }) => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState('vi');
  
  // State quản lý ẩn hiện mật khẩu
  const [showPassword, setShowPassword] = useState(false);

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

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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
      {/* Inject Style để ẩn mắt trình duyệt */}
      <style>{hideBrowserEyeStyles}</style>

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
             {/* 🇻🇳 Vietnamese */}
            <button
              type="button"
              onClick={() => onLanguageChange('vi')}
              style={{
                width: '25px', height: '25px', borderRadius: '50%', overflow: 'hidden', border: 'none',
                boxShadow: currentLanguage === 'vi' ? '0 0 8px rgba(0,0,0,0.2), 0 0 10px rgba(255,255,255,0.4)' : '0 2px 6px rgba(0,0,0,0.2)',
                background: 'transparent', cursor: 'pointer', padding: 0, transition: 'all 0.3s ease',
                transform: currentLanguage === 'vi' ? 'scale(1.1)' : 'scale(1)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.15)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = currentLanguage === 'vi' ? 'scale(1.1)' : 'scale(1)')}
            >
              <img src="https://flagcdn.com/w80/vn.png" alt="Vietnamese" style={{ width: '25px', height: '25px', objectFit: 'cover', display: 'block', borderRadius: '50%', filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.2))' }} />
            </button>

             {/* 🇬🇧 English */}
            <button
              type="button"
              onClick={() => onLanguageChange('en')}
              style={{
                width: '25px', height: '25px', borderRadius: '50%', overflow: 'hidden', border: 'none',
                boxShadow: currentLanguage === 'en' ? '0 0 8px rgba(0,0,0,0.2), 0 0 10px rgba(255,255,255,0.4)' : '0 2px 6px rgba(0,0,0,0.2)',
                background: 'transparent', cursor: 'pointer', padding: 0, transition: 'all 0.3s ease',
                transform: currentLanguage === 'en' ? 'scale(1.1)' : 'scale(1)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.15)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = currentLanguage === 'en' ? 'scale(1.1)' : 'scale(1)')}
            >
              <img src="https://flagcdn.com/w80/gb.png" alt="English" style={{ width: '25px', height: '25px', objectFit: 'cover', display: 'block', borderRadius: '50%', filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.2))' }} />
            </button>

            {/* 🇰🇷 Korean */}
            <button
              type="button"
              onClick={() => onLanguageChange('ko')}
              style={{
                width: '25px', height: '25px', borderRadius: '50%', overflow: 'hidden', border: 'none',
                boxShadow: currentLanguage === 'ko' ? '0 0 8px rgba(0,0,0,0.2), 0 0 10px rgba(255,255,255,0.4)' : '0 2px 6px rgba(0,0,0,0.2)',
                background: 'transparent', cursor: 'pointer', padding: 0, transition: 'all 0.3s ease',
                transform: currentLanguage === 'ko' ? 'scale(1.1)' : 'scale(1)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.15)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = currentLanguage === 'ko' ? 'scale(1.1)' : 'scale(1)')}
            >
              <img src="https://flagcdn.com/w80/kr.png" alt="Korean" style={{ width: '25px', height: '25px', objectFit: 'cover', display: 'block', borderRadius: '50%', filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.2))' }} />
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
              
              {/* === BẮT ĐẦU PHẦN CHỈNH SỬA INPUT PASSWORD === */}
              <div className="position-relative">
                <input
                  type={showPassword ? "text" : "password"} // Thay đổi type dựa trên state
                  className="form-control form-control-lg pe-5" // Thêm pe-5 để chữ không đè lên icon
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                  placeholder={currentLanguage === 'vi' ? 'Nhập mật khẩu' : currentLanguage === 'ko' ? '비밀번호 입력' : 'Enter password'}
                />
                
                {/* Button Icon Mắt */}
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="btn position-absolute top-50 end-0 translate-middle-y text-secondary border-0 bg-transparent p-0 me-3"
                  style={{ zIndex: 10, outline: 'none', boxShadow: 'none' }}
                >
                  {showPassword ? (
                    // Icon Eye (Hiện mật khẩu)
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-eye" viewBox="0 0 16 16">
                      <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                      <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
                    </svg>
                  ) : (
                    // Icon Eye Slash (Ẩn mật khẩu)
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-eye-slash" viewBox="0 0 16 16">
                      <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z"/>
                      <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z"/>
                      <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z"/>
                    </svg>
                  )}
                </button>
              </div>
              {/* === KẾT THÚC PHẦN CHỈNH SỬA INPUT PASSWORD === */}

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