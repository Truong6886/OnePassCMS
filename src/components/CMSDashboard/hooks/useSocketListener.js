import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { showToast } from "../../../utils/toast";

export default function useSocketListener({
  currentLanguage,
  setNotifications,
  setHasNewRequest,
  setShowNotification,
}) {
  const socketRef = useRef(null);

  useEffect(() => {
    //

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

    const handleConnect = () => console.log("🟢 Socket connected:", socket.id);
    const handleDisconnect = (reason) => console.log("🔴 Socket disconnected. Reason:", reason);
    const handleError = (error) => console.error("❌ Socket error:", error);
    const handleReconnectAttempt = (attempt) => console.log(`🔄 Reconnect attempt #${attempt}...`);
    const handleReconnect = (attempt) => console.log(`✅ Reconnected successfully after ${attempt} attempts.`);

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleError);
    socket.on("reconnect_attempt", handleReconnectAttempt);
    socket.on("reconnect", handleReconnect);


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

    return () => {
      socket.off("new_request", handleNewRequest);
      
  
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleError);
      socket.off("reconnect_attempt", handleReconnectAttempt);
      socket.off("reconnect", handleReconnect);
      
     
    };
  }, [currentLanguage, setNotifications, setHasNewRequest, setShowNotification]);
}