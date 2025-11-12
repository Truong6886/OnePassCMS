import { useEffect } from "react";
import { io } from "socket.io-client";
import { showToast } from "../../../utils/toast";

export default function useSocketListener({
  currentLanguage,
  translateService,
  setData,
  setNotifications,
  setHasNewRequest,
  setShowNotification,
}) {
  useEffect(() => {
    const socket = io("https://onepasscms-backend.onrender.com", {
      transports: ["websocket", "polling"],
      withCredentials: false,
    });

    socket.on("new_request", (newRequestData) => {
      setData((prev) => {
        const exists = prev.some((r) => r.YeuCauID === newRequestData.YeuCauID);
        return exists ? prev : [...prev, newRequestData];
      });

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
    });

    return () => socket.disconnect();
  }, [currentLanguage]);
}
