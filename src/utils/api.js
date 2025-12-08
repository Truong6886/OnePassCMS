// src/utils/api.js
import Swal from 'sweetalert2';

export const authenticatedFetch = async (url, options = {}) => {
  const token = localStorage.getItem("sessionToken");
  const userStr = localStorage.getItem("currentUser");
  const user = userStr ? JSON.parse(userStr) : null;

  // Kiểm tra nếu đã có cờ logout trong sessionStorage
  const wasLoggedOut = sessionStorage.getItem('wasLoggedOut');
  if (wasLoggedOut === 'true') {
    console.log("🔄 Phát hiện đã logout trước đó, không gửi request");
    await performAutoLogout();
    return new Promise(() => {});
  }

  // 2. Thiết lập Header mặc định (bao gồm Auth)
  const defaultHeaders = {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    ...(user?.id ? { "x-user-id": user.id } : {})
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  };

  try {
    const response = await fetch(url, config);

    if (response.status === 401) {
      const data = await response.clone().json().catch(() => ({})); 

      if (data.code === "SESSION_EXPIRED" || data.code === "SESSION_INVALID") {
        await performAutoLogout(data.message || "Tài khoản đã được đăng nhập ở thiết bị khác!");
        return new Promise(() => {});
      }
    }

    return response;

  } catch (error) {
    console.error("API Error:", error);
    throw error; 
  }
};

// Hàm tự động logout
const performAutoLogout = async (message = "Phiên đăng nhập đã hết hạn") => {
  try {
    // Kiểm tra nếu đang ở trang login thì không hiển thị
    if (window.location.pathname === '/login') return;

    // Đánh dấu đã logout
    sessionStorage.setItem('wasLoggedOut', 'true');
    sessionStorage.setItem('logoutReason', 'api_401');
    sessionStorage.setItem('logoutTime', new Date().toISOString());

    // Hiển thị thông báo
    await Swal.fire({
      icon: 'error',
      title: 'Phiên đăng nhập hết hạn',
      text: message,
      confirmButtonText: 'Đăng nhập lại',
      allowOutsideClick: false,
      allowEscapeKey: false
    });

    // Xóa dữ liệu và redirect
    localStorage.clear();
    window.location.href = "/login";
    
  } catch (err) {
    console.error("Lỗi trong quá trình auto logout:", err);
    // Fallback: xóa và redirect
    localStorage.clear();
    window.location.href = "/login";
  }
};