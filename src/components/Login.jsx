import React, { useState } from "react";
import heroBanner from "../assets/herobanner-1.png";

const API_BASE = "https://onepasscms-backend.onrender.com/api";

export default function Login({ setCurrentUser }) {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentLanguage, setCurrentLanguage] = useState("vi");

  const onLanguageChange = (lang) => setCurrentLanguage(lang);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.message || "Đăng nhập thất bại");
      setCurrentUser(result.user);
    } catch (err) {
      console.error("❌ Lỗi đăng nhập:", err);
      setError(err.message || "Đăng nhập thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="container-fluid vh-100 d-flex align-items-center justify-content-center"
      style={{
        backgroundImage: `url(${heroBanner})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div
        className="card shadow border-0 position-relative"
        style={{
          width: "100%",
          maxWidth: "440px",
          background: "rgba(255,255,255,0.9)",
          backdropFilter: "blur(12px)",
          borderRadius: "14px",
          border: "1px solid rgba(255,255,255,0.25)",
        }}
      >
        {/* Nút chọn ngôn ngữ */}
        <div className="position-absolute top-0 end-0 p-3">
          <div className="d-flex align-items-center" style={{ gap: "10px" }}>
            {["vi", "en"].map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => onLanguageChange(lang)}
                style={{
                  width: "26px",
                  height: "26px",
                  borderRadius: "50%",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  boxShadow:
                    currentLanguage === lang
                      ? "0 0 6px rgba(0,0,0,0.3)"
                      : "0 1px 4px rgba(0,0,0,0.2)",
                  transform: currentLanguage === lang ? "scale(1.1)" : "scale(1)",
                  transition: "all 0.3s ease",
                  padding: 0,
                }}
              >
                <img
                  src={
                    lang === "vi"
                      ? "https://flagcdn.com/w80/vn.png"
                      : "https://flagcdn.com/w80/gb.png"
                  }
                  alt={lang}
                  style={{
                    width: "26px",
                    height: "26px",
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="card-body p-5">
          {/* Tiêu đề */}
          <div className="text-center mb-4">
            <h4 className="fw-bold text-primary mb-2">
              {currentLanguage === "vi" ? "Đăng nhập hệ thống" : "System Login"}
            </h4>
            <p className="text-muted" style={{ fontSize: "13px" }}>
              {currentLanguage === "vi"
                ? "Quản lý yêu cầu khách hàng"
                : "Customer Request Management"}
            </p>
          </div>

          {/* Thông báo lỗi */}
          {error && (
            <div
              className="alert alert-danger py-2 px-3 mb-4 text-center"
              style={{ fontSize: "13.5px" }}
            >
              {error}
            </div>
          )}

          {/* Form đăng nhập */}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label
                htmlFor="username"
                className="form-label fw-semibold text-secondary"
                style={{ fontSize: "13px" }}
              >
                {currentLanguage === "vi" ? "Tên đăng nhập" : "Username"}
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                disabled={loading}
                placeholder={
                  currentLanguage === "vi" ? "Nhập tên đăng nhập" : "Enter username"
                }
                className="form-control"
                style={{
                  fontSize: "14px",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                }}
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="password"
                className="form-label fw-semibold text-secondary"
                style={{ fontSize: "13px" }}
              >
                {currentLanguage === "vi" ? "Mật khẩu" : "Password"}
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                disabled={loading}
                placeholder={
                  currentLanguage === "vi" ? "Nhập mật khẩu" : "Enter password"
                }
                className="form-control"
                style={{
                  fontSize: "14px",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 fw-semibold"
              disabled={loading}
              style={{
                fontSize: "15px",
                padding: "10px",
                borderRadius: "8px",
                transition: "background 0.3s",
              }}
            >
              {loading
                ? currentLanguage === "vi"
                  ? "Đang đăng nhập..."
                  : "Signing in..."
                : currentLanguage === "vi"
                ? "Đăng nhập"
                : "Login"}
            </button>
          </form>
