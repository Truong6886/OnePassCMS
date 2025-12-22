import { useState, useEffect } from "react";
import Login from "./components/Login";
import CMSDashboard from "./components/CMSDashboard";
import TraCuuHoSo from "./components/TraCuuHoSo";
import QuanLyNhanVien from "./components/QuanLyNhanVien";
import B2BPage from "./components/B2BPage";
import B2CPage from "./components/B2CPage";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../src/styles/CMSDashboard.css";
import DoanhThu from "./components/DoanhThu";
import Vendor from "./components/Vendor"
import NewsPage from "./components/NewsPage";


const AuthGuard = ({ children, user, roles = [] }) => {
  const location = useLocation();

  
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles.length > 0) {
    const hasPermission = roles.some((role) => user[role]);
    if (!hasPermission) {
      return <Navigate to="/" replace />;
    }
  }

  // Hợp lệ -> Cho vào nhà
  return children;
};

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

  const handleLogout = () => {
    handleSetCurrentUser(null);
  };

  const toggleSidebar = () => {
    setShowSidebar((prev) => !prev);
  };

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

          <Route
            path="/"
            element={
              <AuthGuard user={currentUser}>
                <CMSDashboard
                  currentUser={currentUser}
                  showSidebar={showSidebar}
                  onToggleSidebar={toggleSidebar}
                  onLogout={handleLogout}
                />
              </AuthGuard>
            }
          />


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

          <Route path="/hoso" element={<TraCuuHoSo />} />


          <Route
            path="/nhanvien"
            element={
              <AuthGuard user={currentUser}>
                <QuanLyNhanVien
                  currentUser={currentUser}
                  showSidebar={showSidebar}
                  onToggleSidebar={toggleSidebar}
                />
              </AuthGuard>
            }
          />

         
         <Route
          path="/doanhthu"
          element={
            // ✅ Thêm "perm_view_revenue" vào mảng roles
            <AuthGuard user={currentUser} roles={["is_director", "is_accountant", "perm_view_revenue"]}>
              <DoanhThu
                currentUser={currentUser}
                showSidebar={showSidebar}
                onToggleSidebar={toggleSidebar}
              />
            </AuthGuard>
          }
        />
         
         <Route
            path="/b2c"
            element={
           
              <AuthGuard user={currentUser}>
                <B2CPage
                  currentUser={currentUser}
                  showSidebar={showSidebar}
                  onToggleSidebar={toggleSidebar}
                />
              </AuthGuard>
            }
          />

      
          <Route
            path="/b2b"
            element={
       
              <AuthGuard user={currentUser}>
                <B2BPage
                  currentUser={currentUser}
                  showSidebar={showSidebar}
                  onToggleSidebar={toggleSidebar}
                />
              </AuthGuard>
            }
          />
          <Route
          path="/vendor"
          element={
         
            <AuthGuard user={currentUser} roles={["is_director", "is_accountant", "is_admin"]}>
              <Vendor
                currentUser={currentUser}
                showSidebar={showSidebar}
                onToggleSidebar={toggleSidebar}
              />
            </AuthGuard>
          }
        />

          <Route
            path="/news"
            element={
              <AuthGuard user={currentUser}>
                <NewsPage />
              </AuthGuard>
            }
          />
         
          {/* Route mặc định */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}