export const showToast = (message, type = "info") => {
  const colors = {
    success: "#4CAF50",
    error: "#F44336",
    warning: "#FF9800",
    info: "#2196F3",
  };

  // 🔹 Kiểm tra xem container có tồn tại chưa
  let container = document.querySelector("#toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.style.position = "fixed";
    container.style.bottom = "20px";
    container.style.right = "20px";
    container.style.display = "flex";
    container.style.flexDirection = "column-reverse";
    container.style.gap = "10px";
    container.style.zIndex = "9999";
    document.body.appendChild(container);
  }

  // 🔹 Tạo toast mới
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style.padding = "14px 22px";
  toast.style.background = colors[type] || colors.info;
  toast.style.color = "#fff";
  toast.style.borderRadius = "10px";
  toast.style.boxShadow = "0 4px 10px rgba(0,0,0,0.15)";
  toast.style.fontSize = "15px";
  toast.style.fontWeight = "500";
  toast.style.opacity = "0";
  toast.style.transform = "translateY(20px)";
  toast.style.transition = "all 0.4s ease";
  toast.style.maxWidth = "320px";
  toast.style.wordBreak = "break-word";
  toast.style.lineHeight = "1.4";

  container.appendChild(toast);

  // 🔹 Hiện hiệu ứng fade-in
  setTimeout(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  }, 50);

  // 🔹 Tự động ẩn sau 4.8s
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)";
  }, 4800);

  // 🔹 Xóa khỏi DOM sau 5.5s
  setTimeout(() => toast.remove(), 5500);
};
