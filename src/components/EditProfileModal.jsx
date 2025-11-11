import React, { useState, useRef, useEffect } from "react";
import { showToast } from "../utils/toast";

const EditProfileModal = ({ currentUser, onUpdate, onClose, currentLanguage }) => {
  const [formData, setFormData] = useState({
    name: currentUser?.name || "",
    username: currentUser?.username || "",
    email: currentUser?.email || "",
    password: "",
  });

  const [avatarPreview, setAvatarPreview] = useState(
    currentUser?.avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        currentUser?.username || "User"
      )}&background=0D8ABC&color=fff&rounded=true&size=128`
  );

  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const avatarInputRef = useRef(null);

  useEffect(() => setVisible(true), []);

  const handleAvatarClick = () => avatarInputRef.current?.click();

  const handleInputChange = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // ✅ Kiểm tra loại file và dung lượng
    if (!file.type.startsWith("image/")) {
      showToast(
        currentLanguage === "vi" ? "Vui lòng chọn file ảnh!" : "Please select an image file!",
        "warning"
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast(
        currentLanguage === "vi"
          ? "Kích thước ảnh không được vượt quá 5MB!"
          : "Image size should not exceed 5MB!",
        "error"
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);

    setFormData((prev) => ({ ...prev, avatarFile: file }));
  };

  const handleSubmit = async () => {
    if (!formData.username.trim() || !formData.email.trim()) {
      showToast(
        currentLanguage === "vi"
          ? "Vui lòng điền đầy đủ username và email!"
          : "Please fill in both username and email!",
        "warning"
      );
      return;
    }

    setLoading(true);

    try {
      const submitData = new FormData();
      submitData.append("name", formData.name.trim());
      submitData.append("username", formData.username.trim());
      submitData.append("email", formData.email.trim());

      if (formData.password.trim()) {
        submitData.append("password", formData.password.trim());
      }

      if (formData.avatarFile) {
        submitData.append("avatar", formData.avatarFile);
      }

      console.log("🔄 Đang gửi dữ liệu cập nhật...");
      const success = await onUpdate(currentUser.id, submitData);

      if (success) {
        showToast(
          currentLanguage === "vi"
            ? "Cập nhật thông tin thành công!"
            : "Profile updated successfully!",
          "success"
        );
        handleClose();
      }
    } catch (error) {
      console.error("❌ Lỗi khi submit:", error);
      showToast(
        currentLanguage === "vi"
          ? "Có lỗi xảy ra khi cập nhật thông tin!"
          : "An error occurred while updating profile!",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => onClose(), 200);
  };

  // ✅ Kiểm tra người dùng hợp lệ
  if (!currentUser) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1050,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(5px)",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.2s ease",
        }}
      />

      {/* Modal */}
      <div
        style={{
          background: "#fff",
          borderRadius: "1.5rem",
          padding: "2rem",
          width: "100%",
          maxWidth: "480px",
          boxShadow: "0 0 30px rgba(0,0,0,0.2)",
          position: "relative",
          zIndex: 1060,
          transform: visible ? "scale(1)" : "scale(0.8)",
          opacity: visible ? 1 : 0,
          transition: "transform 0.2s ease, opacity 0.2s ease",
        }}
      >
        {/* Nút đóng */}
        <button
          type="button"
          onClick={handleClose}
          disabled={loading}
          style={{
            position: "absolute",
            top: "1.2rem",
            right: "1.2rem",
            background: "transparent",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.3 : 0.6,
            transition: "all 0.2s ease",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1 1L11 11M11 1L1 11"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* Tiêu đề */}
        <h4
          className="mb-4 text-primary text-center"
          style={{ fontSize: "1.3rem", fontWeight: "600" }}
        >
          {loading
            ? currentLanguage === "vi"
              ? "Đang cập nhật..."
              : "Updating..."
            : currentLanguage === "vi"
            ? "Cập nhật thông tin"
            : "Update Information"}
        </h4>

        {/* Avatar */}
        <div
          className="mb-4 text-center position-relative"
          style={{ width: 120, margin: "0 auto" }}
        >
          <img
            src={avatarPreview}
            alt="Avatar"
            className="rounded-circle"
            width={120}
            height={120}
            style={{
              objectFit: "cover",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              border: "3px solid #f8f9fa",
            }}
            onClick={loading ? undefined : handleAvatarClick}
          />
          {!loading && (
            <div
              onClick={handleAvatarClick}
              style={{
                position: "absolute",
                bottom: 8,
                right: 8,
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "#fff",
                border: "2px solid #0D8ABC",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: "0.8rem",
                color: "#0D8ABC",
                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
              }}
            >
              <i className="bi bi-camera-fill" style={{ pointerEvents: "none" }} />
            </div>
          )}
        </div>

        <input
          type="file"
          accept="image/*"
          ref={avatarInputRef}
          className="d-none"
          onChange={handleAvatarChange}
          disabled={loading}
        />

        {/* Form */}
        <div className="mb-3">
          <label className="form-label fw-semibold">
            {currentLanguage === "vi" ? "Họ và tên" : "Full Name"}
          </label>
          <input
            type="text"
            className="form-control rounded-pill"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            placeholder={
              currentLanguage === "vi" ? "Nhập họ và tên" : "Enter full name"
            }
            disabled={loading}
          />
        </div>

        <div className="mb-3">
          <label className="form-label fw-semibold">Username</label>
          <input
            type="text"
            className="form-control rounded-pill"
            value={formData.username}
            onChange={(e) => handleInputChange("username", e.target.value)}
            placeholder={
              currentLanguage === "vi" ? "Nhập username" : "Enter username"
            }
            disabled={loading}
          />
        </div>

        <div className="mb-3">
          <label className="form-label fw-semibold">Email</label>
          <input
            type="email"
            className="form-control rounded-pill"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            placeholder={currentLanguage === "vi" ? "Nhập email" : "Enter email"}
            disabled={loading}
          />
        </div>

        <div className="mb-4">
          <label className="form-label fw-semibold">
            {currentLanguage === "vi" ? "Mật khẩu mới" : "New Password"}
          </label>
          <input
            type="password"
            className="form-control rounded-pill"
            value={formData.password}
            onChange={(e) => handleInputChange("password", e.target.value)}
            placeholder={
              currentLanguage === "vi"
                ? "Để trống nếu không đổi"
                : "Leave blank if not changing"
            }
            disabled={loading}
          />
        </div>

        {/* Nút */}
        <div className="d-flex justify-content-end gap-3">
          <button
            className="btn btn-outline-secondary rounded-pill"
            onClick={handleClose}
            disabled={loading}
          >
            {currentLanguage === "vi" ? "Hủy" : "Cancel"}
          </button>
          <button
            className="btn btn-primary rounded-pill"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                {currentLanguage === "vi"
                  ? "Đang xử lý..."
                  : "Processing..."}
              </>
            ) : currentLanguage === "vi" ? (
              "Lưu thay đổi"
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;
