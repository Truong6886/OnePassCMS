import { useState, useEffect } from "react";
import Login from "./components/Login";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import '../src/components/CMSDashboard.css';
import CMSDashboard from "./components/CMSDashboard";
import 'bootstrap/dist/css/bootstrap.min.css';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [loadingUser, setLoadingUser] = useState(true);

  // Load user từ localStorage khi component mount
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

  // Xử lý set current user và đồng bộ với localStorage
  const handleSetCurrentUser = (user) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem("currentUser", JSON.stringify(user));
    } else {
      localStorage.removeItem("currentUser");
    }
  };

  // Xử lý logout
  const handleLogout = () => {
    handleSetCurrentUser(null);
  };

  // Xử lý toggle sidebar
  const toggleSidebar = () => {
    setShowSidebar(prev => !prev);
  };

  // Hiển thị loading
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
          {/* Route chính - Dashboard */}
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

          {/* Route login */}
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

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
