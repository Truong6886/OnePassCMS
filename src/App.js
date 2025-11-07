import { useState, useEffect } from "react";
import Login from "./components/Login";
import CMSDashboard from "./components/CMSDashboard";
import TraCuuHoSo from "./components/TraCuuHoSo";
import KyHoSo from "./components/KyHoSo";
import QuanLyNhanVien from "./components/QuanLyNhanVien";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../src/components/CMSDashboard.css";
import DoanhThu from "./components/DoanhThu";

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [loadingUser, setLoadingUser] = useState(true);

  
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
          {/* ✅ Dashboard chính */}
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

          {/* ✅ Trang đăng nhập */}
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

          {/* ✅ Tra cứu hồ sơ (public) */}
          <Route path="/hoso" element={<TraCuuHoSo />} />
          {/* <Route path="/ky/:mahoso" element={<KyTaiLieu />} /> */}
          <Route
            path="/nhanvien"
            element={
              (currentUser?.is_admin || currentUser?.is_director) ? (
                <QuanLyNhanVien
                  currentUser={currentUser}
                  showSidebar={showSidebar}
                  onToggleSidebar={toggleSidebar}
                />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          {/* ✅ Doanh thu – chỉ cho kế toán */}
          <Route
            path="/doanhthu"
            element={
              (currentUser?.is_director || currentUser?.is_accountant) ? (
                <DoanhThu
                  currentUser={currentUser}
                  showSidebar={showSidebar}
                  onToggleSidebar={toggleSidebar}
                />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
           <Route path="/kyhoso/:mahoso" element={<KyHoSo />} />

          {/* ✅ Route fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
