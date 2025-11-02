import { useState, useEffect } from "react";
import Login from "./components/Login";
import CMSDashboard from "./components/CMSDashboard";
import TraCuuHoSo from "./components/TraCuuHoSo"; // 👈 Thêm import trang tra cứu
import KyHoSo from "./components/KyHoSo"; // 👈 Thêm import trang tra cứu
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../src/components/CMSDashboard.css";

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [loadingUser, setLoadingUser] = useState(true);

  // ✅ Load user từ localStorage khi app mount
  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem("currentUser");
      }
    }
    setLoadingUser(false);
  }, []);

  // ✅ Cập nhật user trong state + localStorage
  const handleSetCurrentUser = (user) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem("currentUser", JSON.stringify(user));
    } else {
      localStorage.removeItem("currentUser");
    }
  };

  // ✅ Đăng xuất
  const handleLogout = () => {
    handleSetCurrentUser(null);
  };

  // ✅ Ẩn/hiện sidebar
  const toggleSidebar = () => {
    setShowSidebar((prev) => !prev);
  };

  // ✅ Loading hiển thị trong khi chờ user
  if (loadingUser) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <span className="ms-2">Đang tải...</span>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          {/* ✅ Route dashboard chính */}
          <Route
            path="/"
            element={
              currentUser ? (
                <CMSDashboard
                  currentUser={currentUser}
                  showSidebar={showSidebar}
                  onToggleSidebar={toggleSidebar}
                  onLogout={handleLogout}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* ✅ Route login */}
          <Route
            path="/login"
            element={
              currentUser ? (
                <Navigate to="/" replace />
              ) : (
                <Login setCurrentUser={handleSetCurrentUser} />
              )
            }
          />

          {/* ✅ Route tra cứu hồ sơ — KHÔNG cần đăng nhập */}
          <Route path="/hoso" element={<TraCuuHoSo />} />
          <Route path="/ky/:mahoso" element={<KyHoSo />} />

          {/* ✅ Route mặc định fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
