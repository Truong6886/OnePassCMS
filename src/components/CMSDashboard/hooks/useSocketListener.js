import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { showToast } from "../../../utils/toast";

export default function useSocketListener({
  currentLanguage,
  setNotifications,
  setHasNewRequest,
  setShowNotification,
  currentUser
}) {
  const socketRef = useRef(null);
  

  const logoutInProgress = useRef(false);

  const handleForceLogout = (msg) => {
    if (logoutInProgress.current) return; // Tránh xử lý trùng
    
    logoutInProgress.current = true;
    console.warn("⚠️ Nhận tín hiệu force_logout:", msg);
    
    const countdownTime = 10000;

    Swal.fire({
      icon: 'warning',
      title: currentLanguage === 'vi' ? 'Phiên đăng nhập hết hạn' : 'Login Alert',
      html: currentLanguage === 'vi' 
        ? `${msg || "Tài khoản đang đăng nhập nơi khác."}<br/><br/>Hệ thống sẽ đăng xuất sau <b>10</b> giây.`
        : `${msg || "Account logged in elsewhere."}<br/><br/>Auto logout in <b>10</b> seconds.`,
      timer: countdownTime,
      timerProgressBar: true,
      allowOutsideClick: false,
      allowEscapeKey: false,
      confirmButtonText: currentLanguage === 'vi' ? 'Đăng xuất ngay' : 'Logout Now',
      didOpen: () => {
        const b = Swal.getHtmlContainer().querySelector('b');
        const timerInterval = setInterval(() => {
          if(Swal.getTimerLeft()) {
            b.textContent = Math.ceil(Swal.getTimerLeft() / 1000);
          }
        }, 1000);
        Swal.getPopup().dataset.timerInterval = timerInterval;
      },
      willClose: () => {
        clearInterval(Swal.getPopup().dataset.timerInterval);
      }
    }).then(() => {
      performLogout();
    });
  };

  const performLogout = () => {
    // 1. Gửi tín hiệu disconnect trước khi logout
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.disconnect();
    }
    
    // 2. Xóa session trong localStorage
    localStorage.clear();
    
    // 3. Đặt cờ đã logout
    sessionStorage.setItem('wasLoggedOut', 'true');
    sessionStorage.setItem('logoutReason', 'session_expired');
    sessionStorage.setItem('logoutTime', new Date().toISOString());
    
    // 4. Redirect đến login
    window.location.href = "/login";
  };

  useEffect(() => {
    // Kiểm tra nếu đã bị logout từ trước
    const wasLoggedOut = sessionStorage.getItem('wasLoggedOut');
    const logoutTime = sessionStorage.getItem('logoutTime');
    
    if (wasLoggedOut === 'true' && logoutTime) {
      const logoutDate = new Date(logoutTime);
      const now = new Date();
      const diffMinutes = (now - logoutDate) / (1000 * 60);
      
      // Nếu logout trong vòng 5 phút gần đây, redirect luôn
      if (diffMinutes < 5) {
        console.log("🔄 Phát hiện session đã bị logout trước đó, redirect đến login");
        sessionStorage.removeItem('wasLoggedOut');
        window.location.href = "/login";
        return;
      }
    }

    if (!socketRef.current) {
      socketRef.current = io("https://onepasscms-backend.onrender.com", {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      });
    }

    const socket = socketRef.current;

    // Đăng ký user với server
    const handleConnect = () => {
      if (currentUser?.id) {
        socket.emit("register_user", currentUser.id);
      }
    };

    // Các handler khác giữ nguyên...
    const handleDisconnect = (reason) => {
      console.log("🔴 Socket disconnected. Reason:", reason);
      
      // Nếu disconnect do server force (không phải do mất mạng)
      if (reason === "io server disconnect" || reason === "forced") {
        setTimeout(() => {
          if (!logoutInProgress.current && currentUser?.id) {
            console.log("🔄 Phát hiện disconnect từ server, kiểm tra session...");
            // Gọi API để kiểm tra session
            checkSessionValidity();
          }
        }, 1000);
      }
    };

    const handleError = (error) => console.error("❌ Socket error:", error);
    const handleReconnectAttempt = (attempt) =>
      console.log(`🔄 Reconnect attempt #${attempt}...`);
    const handleReconnect = (attempt) =>
      console.log(`✅ Reconnected successfully after ${attempt} attempts.`);

    // Hàm kiểm tra session thông qua API
    const checkSessionValidity = async () => {
      try {
        const token = localStorage.getItem("sessionToken");
        const userStr = localStorage.getItem("currentUser");
        const user = userStr ? JSON.parse(userStr) : null;

        if (!token || !user?.id) return;

        const response = await fetch("https://onepasscms-backend.onrender.com/api/yeucau", {
          headers: {
            "Authorization": `Bearer ${token}`,
            "x-user-id": user.id
          }
        });

        if (response.status === 401) {
          const data = await response.json().catch(() => ({}));
          if (data.code === "SESSION_EXPIRED" || data.code === "SESSION_INVALID") {
            console.log("⚠️ Phát hiện session hết hạn qua API check");
            handleForceLogout("Phiên đăng nhập đã hết hạn do đăng nhập ở thiết bị khác.");
          }
        }
      } catch (error) {
        console.error("Lỗi kiểm tra session:", error);
      }
    };

  
    let sessionCheckInterval;
    if (currentUser?.id) {
      sessionCheckInterval = setInterval(checkSessionValidity, 30000); 
    }


    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleError);
    socket.on("reconnect_attempt", handleReconnectAttempt);
    socket.on("reconnect", handleReconnect);

    // =====================================
    // 🎯 1) EVENT CŨ: "new_request"
    // =====================================
    const handleNewRequest = (newRequestData) => {
      const message =
        currentLanguage === "vi"
          ? `Yêu cầu mới từ: ${newRequestData.HoTen || "Khách hàng"}`
          : `New request from: ${newRequestData.HoTen || "Customer"}`;

      const newNotification = {
        id: Date.now(),
        message,
        time: new Date().toLocaleTimeString("vi-VN"),
        requestId: newRequestData.YeuCauID,
      };

      setNotifications((prev) => {
        const updated = [newNotification, ...prev.slice(0, 9)];
        localStorage.setItem("notifications", JSON.stringify(updated));
        return updated;
      });

      showToast(message, "success");

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("📩 " + message, {
          body:
            currentLanguage === "vi"
              ? "Có yêu cầu mới trong hệ thống CMS"
              : "A new request has arrived in CMS",
          icon: "/favicon_logo.png",
        });
      }

      setHasNewRequest(true);
      setShowNotification(true);
    };

    socket.on("new_request", handleNewRequest);

    // =====================================
    // 🎯 2) EVENT MỚI: ADMIN ĐĂNG KÝ SERVICE
    // =====================================
    const handleNewB2BService = (data) => {
      const msg =
        currentLanguage === "vi"
          ? `ADMIN đăng ký dịch vụ mới: ${data.tenDichVu || ""}`
          : `Admin created new B2B service`;

      const newNotification = {
        id: Date.now(),
        message: msg,
        time: new Date().toLocaleTimeString("vi-VN"),
        serviceId: data.serviceId,
      };

      setNotifications((prev) => {
        const updated = [newNotification, ...prev.slice(0, 9)];
        localStorage.setItem("notifications", JSON.stringify(updated));
        return updated;
      });

      showToast(msg, "info");
      setHasNewRequest(true);
      setShowNotification(true);
    };

    socket.on("b2b_new_service", handleNewB2BService);

    // =====================================
    // 🎯 3) EVENT MỚI: SERVICE ĐƯỢC DUYỆT
    // =====================================
    const handleApprovedService = (data) => {
      const msg =
        currentLanguage === "vi"
          ? `Dịch vụ '${data.tenDichVu}' đã được duyệt`
          : `Your assigned service has been approved`;

      const newNotification = {
        id: Date.now(),
        message: msg,
        time: new Date().toLocaleTimeString("vi-VN"),
        serviceId: data.serviceId,
      };

      setNotifications((prev) => {
        const updated = [newNotification, ...prev.slice(0, 9)];
        localStorage.setItem("notifications", JSON.stringify(updated));
        return updated;
      });

      showToast(msg, "success");
      setHasNewRequest(true);
      setShowNotification(true);
    };

    socket.on("b2b_service_approved", handleApprovedService);

    // CLEANUP
    return () => {
      socket.off("new_request", handleNewRequest);
      socket.off("b2b_new_service", handleNewB2BService);
      socket.off("b2b_service_approved", handleApprovedService);

      socket.off("connect", handleConnect);
      socket.off("force_logout", handleForceLogout);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleError);
      socket.off("reconnect_attempt", handleReconnectAttempt);
      socket.off("reconnect", handleReconnect);
    };
  }, [currentLanguage, setNotifications, setHasNewRequest, setShowNotification, currentUser]);
}
