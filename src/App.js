import { useState, useEffect } from "react";
import Login from "./components/Login";
import CMSDashboard from "./components/CMSDashboard";
import TraCuuHoSo from "./components/TraCuuHoSo";
import KyHoSo from "./components/KyHoSo";
import QuanLyNhanVien from "./components/QuanLyNhanVien";
import B2BPage from "./components/B2BPage";
import B2CPage from "./components/B2CPage";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../src/styles/CMSDashboard.css";
import DoanhThu from "./components/DoanhThu";

// 2. Tạo Component bảo vệ Route (Nằm ngoài App hoặc trong cùng file)
// Component này giúp lấy đường dẫn hiện tại để Login xong quay lại đúng chỗ
const AuthGuard = ({ children, user, roles = [] }) => {
  const location = useLocation();

  // Chưa đăng nhập -> Đá về Login, kèm theo "địa chỉ nhà" (state.from)
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Đã đăng nhập nhưng không đủ quyền -> Đá về trang chủ
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

          {/* ✅ Tra cứu hồ sơ (public - ai cũng vào được) */}
          <Route path="/hoso" element={<TraCuuHoSo />} />

          {/* ✅ Quản lý nhân viên - Chỉ Admin/Director */}
          <Route
            path="/nhanvien"
            element={
              <AuthGuard user={currentUser} roles={["is_admin", "is_director"]}>
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
              <AuthGuard user={currentUser} roles={["is_director", "is_accountant"]}>
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
       
              <AuthGuard user={currentUser} roles={["is_director", "is_admin", "is_accountant"]}>
                <B2BPage
                  currentUser={currentUser}
                  showSidebar={showSidebar}
                  onToggleSidebar={toggleSidebar}
                />
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