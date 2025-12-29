import React from "react";

const NotificationPanel = ({
  showNotification,
  setShowNotification,
  notifications,
  currentLanguage,
}) => {
  if (!showNotification) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "39px",
        right: "90px",
        background: "white",
        borderRadius: "10px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        width: "300px",
        padding: "15px",
        zIndex: 3000,
        animation: "fadeInUp 0.3s ease",
        border: "1px solid #e5e7eb",
        maxHeight: "250px",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          fontWeight: "600",
          color: "#2563eb",
          marginBottom: "10px",
          fontSize: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span>🔔 {currentLanguage === "vi" ? "Thông báo mới" : currentLanguage === "ko" ? "새 알림" : "New Notifications"}</span>
        <button
          onClick={() => setShowNotification(false)}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "#9ca3af",
            fontSize: "14px",
          }}
        >
          ✕
        </button>
      </div>

      {notifications.length === 0 ? (
        <div style={{ fontSize: "14px", color: "#6b7280" }}>
          {currentLanguage === "vi" ? "Chưa có thông báo" : currentLanguage === "ko" ? "알림이 없습니다" : "No notifications"}
        </div>
      ) : (
        notifications.map((n, i) => (
          <div
            key={i}
            style={{
              padding: "8px 0",
              borderBottom: "1px solid #f3f4f6",
              cursor: "pointer",
            }}
            onClick={() => setShowNotification(false)}
          >
            <div style={{ fontSize: "14px", color: "#374151" }}>{n.message}</div>
            <div
              style={{
                fontSize: "12px",
                color: "#6b7280",
                marginTop: "4px",
                fontStyle: "italic",
              }}
            >
              {n.time}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default NotificationPanel;
