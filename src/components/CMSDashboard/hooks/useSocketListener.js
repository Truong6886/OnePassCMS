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

  useEffect(() => {
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
 const handleForceLogout = (msg) => {
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
       
        localStorage.clear();
        window.location.href = "/login"; 
      });
    };

    socket.on("force_logout", handleForceLogout);
    const handleConnect = () => {
       if (currentUser?.id) {
          socket.emit("register_user", currentUser.id);
       }
    };
    const handleDisconnect = (reason) =>
      console.log("🔴 Socket disconnected. Reason:", reason);
    const handleError = (error) => console.error("❌ Socket error:", error);
    const handleReconnectAttempt = (attempt) =>
      console.log(`🔄 Reconnect attempt #${attempt}...`);
    const handleReconnect = (attempt) =>
      console.log(`✅ Reconnected successfully after ${attempt} attempts.`);

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
