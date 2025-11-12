import React, { useState, useEffect } from "react";
import { showToast } from "../utils/toast";

const AddRequestModal = ({ dichvuList, users, data = [], onClose, onSave, currentLanguage }) => {
  const [formData, setFormData] = useState({
    TenDichVu: "",
    TenHinhThuc: "",
    CoSoTuVan: "",
    HoTen: "",
    Email: "",
    MaVung: "+84",
    SoDienThoai: "",
    TieuDe: "",
    NoiDung: "",
    ChonNgay: "",
    Gio: "",
    TrangThai: "Tư vấn",
    NguoiPhuTrachId: "",
    GhiChu: "",
  });

  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => setVisible(true), []);

  const handleInputChange = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    // ✅ Validate dữ liệu
    if (!formData.TenDichVu.trim()) {
      showToast(currentLanguage === "vi" ? "Vui lòng chọn dịch vụ!" : "Please select a service!", "warning");
      return;
    }

    if (!formData.TenHinhThuc.trim()) {
      showToast(currentLanguage === "vi" ? "Vui lòng chọn hình thức!" : "Please select a format!", "warning");
      return;
    }

    if (!formData.HoTen.trim()) {
      showToast(currentLanguage === "vi" ? "Vui lòng nhập họ tên!" : "Please enter full name!", "warning");
      return;
    }

    if (!formData.Email.trim()) {
      showToast(currentLanguage === "vi" ? "Vui lòng nhập email!" : "Please enter email!", "warning");
      return;
    }

    if (!formData.SoDienThoai.trim()) {
      showToast(currentLanguage === "vi" ? "Vui lòng nhập số điện thoại!" : "Please enter phone number!", "warning");
      return;
    }

    // ✅ Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.Email)) {
      showToast(currentLanguage === "vi" ? "Email không hợp lệ!" : "Invalid email!", "error");
      return;
    }

    setLoading(true);

    try {
      const newItem = {
        ...formData,
        Gio: formData.Gio?.trim() ? formData.Gio : null,
        ChonNgay: formData.ChonNgay?.trim() ? formData.ChonNgay : null,
        NgayTao: new Date().toISOString(),
      };

      console.log("🔄 Đang gửi yêu cầu mới...", newItem);

      const res = await fetch("https://onepasscms-backend.onrender.com/api/yeucau", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });

      const result = await res.json();
      console.log("📨 Kết quả thêm yêu cầu:", result);

      if (result.success) {
        onSave(result.data);
        showToast(
          currentLanguage === "vi"
            ? "Thêm yêu cầu mới thành công!"
            : "New request added successfully!",
          "success"
        );
        handleClose();
      } else {
        showToast(
          `${currentLanguage === "vi" ? "Lỗi khi thêm yêu cầu:" : "Error adding request:"} ${result.message || "Unknown error"}`,
          "error"
        );
      }
    } catch (err) {
      console.error("❌ Lỗi thêm yêu cầu:", err);
      showToast(
        currentLanguage === "vi" ? "Lỗi kết nối máy chủ!" : "Server connection error!",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setVisible(false);
    setTimeout(() => onClose(), 200);
  };

  // Các danh sách dịch vụ và hình thức
  const serviceOptions =
    currentLanguage === "vi"
      ? [
          "Chứng thực",
          "Kết hôn",
          "Khai sinh, khai tử",
          "Xuất nhập cảnh",
          "Giấy tờ tuỳ thân",
          "Nhận nuôi",
          "Thị thực",
          "Tư vấn pháp lý",
          "Dịch vụ B2B",
          "Khác",
        ]
      : [
          "Authentication",
          "Marriage",
          "Birth/Death Certificate",
          "Immigration",
          "ID Documents",
          "Adoption",
          "Visa",
          "Legal Consultation",
          "B2B Services",
          "Other",
        ];

  const formatOptions =
    currentLanguage === "vi"
      ? ["Trực tiếp", "Gọi điện", "Email"]
      : ["In-person", "Phone Call", "Email"];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1050,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(8px)",
          transition: "opacity 0.3s ease",
          opacity: visible ? 1 : 0,
          cursor: loading ? "not-allowed" : "pointer",
        }}
      />

      {/* Modal */}
      <div
        style={{
          background: "white",
          borderRadius: "14px",
          padding: "1.5rem 2rem",
          width: "800px",
          maxWidth: "90vw",
          boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
          position: "relative",
          zIndex: 1060,
          transform: visible ? "scale(1)" : "scale(0.95)",
          opacity: visible ? 1 : 0,
          transition: "transform 0.3s ease, opacity 0.3s ease",
        }}
      >
        {/* Close */}
        <button
          onClick={handleClose}
          disabled={loading}
          style={{
            position: "absolute",
            top: "0.8rem",
            right: "1rem",
            border: "none",
            background: "transparent",
            fontSize: "1.3rem",
            opacity: loading ? 0.3 : 0.5,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          ×
        </button>

        {/* Header */}
        <h5
          style={{
            color: "#2563eb",
            fontWeight: 700,
            textAlign: "center",
            marginBottom: "1.25rem",
          }}
        >
          {loading
            ? currentLanguage === "vi"
              ? "Đang thêm yêu cầu..."
              : "Adding request..."
            : currentLanguage === "vi"
            ? "Thêm yêu cầu mới"
            : "Add New Request"}
        </h5>

        {/* Form chính */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem 1.5rem",
            opacity: loading ? 0.7 : 1,
            pointerEvents: loading ? "none" : "auto",
          }}
        >
          {/* Dịch vụ */}
          <div>
            <label className="form-label small text-secondary fw-semibold">
              {currentLanguage === "vi" ? "Dịch vụ *" : "Service *"}
            </label>
            <select
              className="form-select form-select-sm rounded-3"
              value={formData.TenDichVu}
              onChange={(e) => handleInputChange("TenDichVu", e.target.value)}
              disabled={loading}
            >
              <option value="">
                {currentLanguage === "vi"
                  ? "--Chọn dịch vụ--"
                  : "--Select service--"}
              </option>
              {serviceOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Hình thức */}
          <div>
            <label className="form-label small text-secondary fw-semibold">
              {currentLanguage === "vi" ? "Hình thức *" : "Format *"}
            </label>
            <select
              className="form-select form-select-sm rounded-3"
              value={formData.TenHinhThuc}
              onChange={(e) => handleInputChange("TenHinhThuc", e.target.value)}
              disabled={loading}
            >
              <option value="">
                {currentLanguage === "vi"
                  ? "--Chọn hình thức--"
                  : "--Select format--"}
              </option>
              {formatOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Họ tên */}
          <div>
            <label className="form-label small fw-semibold text-secondary">
              {currentLanguage === "vi" ? "Họ tên *" : "Full Name *"}
            </label>
            <input
              type="text"
              className="form-control form-control-sm rounded-3 shadow-sm border-light"
              value={formData.HoTen}
              onChange={(e) => handleInputChange("HoTen", e.target.value)}
              disabled={loading}
              placeholder={
                currentLanguage === "vi" ? "Nhập họ tên" : "Enter full name"
              }
            />
          </div>

          {/* Email */}
          <div>
            <label className="form-label small text-secondary fw-semibold">
              {currentLanguage === "vi" ? "Email *" : "Email *"}
            </label>
            <input
              type="email"
              className="form-control form-control-sm rounded-3"
              value={formData.Email}
              onChange={(e) => handleInputChange("Email", e.target.value)}
              disabled={loading}
              placeholder={
                currentLanguage === "vi" ? "Nhập email" : "Enter email"
              }
            />
          </div>
        </div>

        {/* Footer */}
        <div className="d-flex justify-content-center gap-3 mt-4">
          <button
            className="btn btn-light border rounded-pill px-4"
            onClick={handleClose}
            disabled={loading}
          >
            {currentLanguage === "vi" ? "Hủy" : "Cancel"}
          </button>
          <button
            className="btn rounded-pill px-4"
            style={{
              backgroundColor: "#2563eb",
              border: "none",
              color: "white",
              fontWeight: 600,
            }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                {currentLanguage === "vi" ? "Đang thêm..." : "Adding..."}
              </>
            ) : currentLanguage === "vi" ? (
              "Thêm yêu cầu"
            ) : (
              "Add Request"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddRequestModal;
