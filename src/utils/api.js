// src/utils/api.js
import Swal from 'sweetalert2';

export const authenticatedFetch = async (url, options = {}) => {
  const token = localStorage.getItem("sessionToken");
  const userStr = localStorage.getItem("currentUser");
  const user = userStr ? JSON.parse(userStr) : null;

  // Thiết lập Header mặc định (bao gồm Auth)
  // Lưu ý: Nếu body là FormData, không đặt Content-Type - để browser tự set multipart/form-data
  const defaultHeaders = {
    ...(!(options.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
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
        await Swal.fire({
          icon: 'error',
          title: 'Phiên đăng nhập hết hạn',
          text: 'Tài khoản của bạn đã được đăng nhập ở thiết bị khác!',
          confirmButtonText: 'Đăng nhập lại',
          allowOutsideClick: false,
          allowEscapeKey: false
        });

        
        localStorage.clear();
        window.location.href = "/login";
        
       
        return new Promise(() => {});
      }
    }

    return response;

  } catch (error) {
    console.error("API Error:", error);
    throw error; 
  }
};