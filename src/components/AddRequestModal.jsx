import React, { useState, useEffect } from "react";
import { showToast } from "../utils/toast";

const AddRequestModal = ({ users, data = [], onClose, onSave, currentLanguage }) => {
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
      // Dữ liệu gửi đi TenDichVu và TenHinhThuc sẽ luôn là Tiếng Việt do logic ở option value bên dưới
      const newItem = {
        ...formData,
        Gio: formData.Gio?.trim() ? formData.Gio : null,
        ChonNgay: formData.ChonNgay?.trim() ? formData.ChonNgay : null,
        NgayTao: new Date().toISOString(),
      };

      console.log("Đang gửi yêu cầu mới...", newItem);

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

  
  const rawServices = [
    { vi: "Chứng thực", en: "Authentication" },
    { vi: "Kết hôn", en: "Marriage" },
    { vi: "Khai sinh, khai tử", en: "Birth/Death Certificate" },
    { vi: "Xuất nhập cảnh", en: "Immigration" },
    { vi: "Giấy tờ tuỳ thân", en: "ID Documents" },
    { vi: "Nhận nuôi", en: "Adoption" },
    { vi: "Thị thực", en: "Visa" },
    { vi: "Tư vấn pháp lý", en: "Legal Consultation" },
    { vi: "Dịch vụ B2B", en: "B2B Services" },
    { vi: "Khác", en: "Other" },
  ];

  // Danh sách hình thức
  const rawFormats = [
    { vi: "Trực tiếp", en: "In-person" },
    { vi: "Gọi điện", en: "Phone Call" },
    { vi: "Email", en: "Email" },
  ];

  // Map dữ liệu để truyền vào SelectField
  // Value: Luôn là tiếng Việt (item.vi)
  // Label: Thay đổi theo ngôn ngữ (item.vi hoặc item.en)
  const serviceOptions = rawServices.map(item => ({
    value: item.vi, 
    label: currentLanguage === "vi" ? item.vi : item.en
  }));

  const formatOptions = rawFormats.map(item => ({
    value: item.vi,
    label: currentLanguage === "vi" ? item.vi : item.en
  }));

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
          opacity: visible ? 1 : 0,
          transition: "opacity 0.3s ease",
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

        {/* Form */}
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
          <SelectField
            label={currentLanguage === "vi" ? "Dịch vụ *" : "Service *"}
            value={formData.TenDichVu}
            options={serviceOptions}
            onChange={(v) => handleInputChange("TenDichVu", v)}
            placeholder={currentLanguage === "vi" ? "--Chọn dịch vụ--" : "--Select service--"}
          />

          {/* Hình thức */}
          <SelectField
            label={currentLanguage === "vi" ? "Hình thức *" : "Format *"}
            value={formData.TenHinhThuc}
            options={formatOptions}
            onChange={(v) => handleInputChange("TenHinhThuc", v)}
            placeholder={currentLanguage === "vi" ? "--Chọn hình thức--" : "--Select format--"}
          />

          {/* Họ tên */}
          <InputField
            label={currentLanguage === "vi" ? "Họ tên *" : "Full Name *"}
            value={formData.HoTen}
            onChange={(v) => handleInputChange("HoTen", v)}
            placeholder={currentLanguage === "vi" ? "Nhập họ tên" : "Enter full name"}
          />

          {/* Email */}
          <InputField
            label="Email *"
            value={formData.Email}
            onChange={(v) => handleInputChange("Email", v)}
            placeholder={currentLanguage === "vi" ? "Nhập email" : "Enter email"}
          />

          {/* SĐT */}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <SelectField
              label={currentLanguage === "vi" ? "Mã vùng" : "Area Code"}
              value={formData.MaVung}
              options={["+84", "+82"]} // Giữ nguyên array string cho các trường hợp đơn giản
              onChange={(v) => handleInputChange("MaVung", v)}
            />
            <InputField
              label={currentLanguage === "vi" ? "SĐT *" : "Phone *"}
              value={formData.SoDienThoai}
              onChange={(v) => handleInputChange("SoDienThoai", v)}
              placeholder={currentLanguage === "vi" ? "Nhập số điện thoại" : "Enter phone number"}
            />
          </div>

          <InputField
            label={currentLanguage === "vi" ? "Tiêu đề" : "Title"}
            value={formData.TieuDe}
            onChange={(v) => handleInputChange("TieuDe", v)}
          />

          <InputField
            type="date"
            label={currentLanguage === "vi" ? "Ngày" : "Date"}
            value={formData.ChonNgay}
            onChange={(v) => handleInputChange("ChonNgay", v)}
          />

          <InputField
            type="time"
            label={currentLanguage === "vi" ? "Giờ" : "Time"}
            value={formData.Gio}
            onChange={(v) => handleInputChange("Gio", v)}
          />

          <TextAreaField
            label={currentLanguage === "vi" ? "Nội dung" : "Content"}
            value={formData.NoiDung}
            onChange={(v) => handleInputChange("NoiDung", v)}
          />

          <TextAreaField
            label={currentLanguage === "vi" ? "Ghi chú" : "Note"}
            value={formData.GhiChu}
            onChange={(v) => handleInputChange("GhiChu", v)}
          />
        </div>

        {/* Footer */}
        <div className="d-flex justify-content-center gap-3 mt-4">
          <button className="btn btn-light border rounded-pill px-4" onClick={handleClose} disabled={loading}>
            {currentLanguage === "vi" ? "Hủy" : "Cancel"}
          </button>
          <button
            className="btn rounded-pill px-4 text-white"
            style={{ backgroundColor: "#2563eb", fontWeight: 600 }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />{" "}
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


const InputField = ({ label, type = "text", value, onChange, placeholder }) => (
  <div style={{width: "100%"}}>
    <label className="form-label small text-secondary fw-semibold">{label}</label>
    <input
      type={type}
      className="form-control form-control-sm rounded-3"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  </div>
);


const SelectField = ({ label, value, options = [], onChange, placeholder }) => (
  <div style={{width: "100%"}}>
    <label className="form-label small text-secondary fw-semibold">{label}</label>
    <select
      className="form-select form-select-sm rounded-3"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt, index) => {
     
        const optionValue = typeof opt === 'object' ? opt.value : opt;
        const optionLabel = typeof opt === 'object' ? opt.label : opt;
        
        return (
          <option key={index} value={optionValue}>
            {optionLabel}
          </option>
        );
      })}
    </select>
  </div>
);

const TextAreaField = ({ label, value, onChange, placeholder }) => (
  <div style={{width: "100%"}}>
    <label className="form-label small text-secondary fw-semibold">{label}</label>
    <textarea
      rows={2}
      className="form-control rounded-3"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  </div>
);

export default AddRequestModal;