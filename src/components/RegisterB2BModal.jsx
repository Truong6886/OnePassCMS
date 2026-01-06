import React, { useState } from "react";
import { Eye, EyeOff, X } from "lucide-react";
import { showToast } from "../utils/toast";
import { authenticatedFetch } from "../utils/api";

const API_BASE = "https://onepasscms-backend-tvdy.onrender.com/api";

export default function RegisterB2BModal({ isOpen, onClose, onSuccess, currentUser }) {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    tenDoanhNghiep: "",
    soDKKD: "",
    nguoiDaiDienPhapLuat: "",
    nganhNgheChinh: "",
    soDienThoaiLienHe: "+84 ",
    email: "",
    matKhau: "",
    xacNhanMatKhau: "",
    dichVuChinh: [],
    giayDangKyKinhDoanh: null,
    website: ""
  });

  const [showServiceDropdown, setShowServiceDropdown] = useState(false);

  const serviceOptions = [
    "Chứng thực",
    "Kết hôn",
    "Khai sinh, khai tử",
    "Quốc tịch",
    "Hộ chiếu, hộ tịch",
    "Nhận nuôi",
    "Thị thực",
    "Tư vấn pháp lý",
    "Khác"
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleServiceToggle = (service) => {
    setFormData(prev => {
      const currentServices = prev.dichVuChinh;
      if (currentServices.includes(service)) {
        return { ...prev, dichVuChinh: currentServices.filter(s => s !== service) };
      } else {
        return { ...prev, dichVuChinh: [...currentServices, service] };
      }
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Giới hạn kích thước file: 10MB
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      showToast(`File quá lớn! Tối đa 10MB. Kích thước hiện tại: ${(file.size / 1024 / 1024).toFixed(2)}MB`, "warning");
      e.target.value = "";
      return;
    }
    
    // Kiểm tra định dạng file
    const allowedFormats = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowedFormats.includes(file.type)) {
      showToast("Chỉ hỗ trợ file .jpg, .png, .pdf", "warning");
      e.target.value = "";
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      giayDangKyKinhDoanh: file
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Check permission
    const canApproveB2B = currentUser?.is_director || currentUser?.perm_approve_b2b;
    if (!canApproveB2B) {
      showToast("Bạn không có quyền đăng ký doanh nghiệp", "error");
      return;
    }
    // Validation
    if (!formData.tenDoanhNghiep.trim()) {
      return showToast("Vui lòng nhập tên doanh nghiệp", "warning");
    }
    if (!formData.soDKKD.trim()) {
      return showToast("Vui lòng nhập số ĐKKD", "warning");
    }
    if (!formData.nguoiDaiDienPhapLuat.trim()) {
      return showToast("Vui lòng nhập tên người đại diện pháp luật", "warning");
    }
    if (!formData.nganhNgheChinh.trim()) {
      return showToast("Vui lòng nhập ngành nghề chính", "warning");
    }
    if (!formData.soDienThoaiLienHe.trim() || formData.soDienThoaiLienHe === "+84 ") {
      return showToast("Vui lòng nhập số điện thoại liên hệ", "warning");
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      return showToast("Vui lòng nhập email hợp lệ", "warning");
    }
    if (!formData.matKhau.trim()) {
      return showToast("Vui lòng nhập mật khẩu", "warning");
    }
    if (formData.matKhau.length < 8) {
      return showToast("Mật khẩu phải có ít nhất 8 ký tự", "warning");
    }
    if (formData.matKhau !== formData.xacNhanMatKhau) {
      return showToast("Mật khẩu và xác nhận mật khẩu phải giống nhau", "warning");
    }
    if (formData.dichVuChinh.length === 0) {
      return showToast("Vui lòng chọn ít nhất một dịch vụ chính", "warning");
    }

    try {
      setLoading(true);

      const formDataToSend = new FormData();
      formDataToSend.append("tenDoanhNghiep", formData.tenDoanhNghiep);
      formDataToSend.append("soDKKD", formData.soDKKD);
      formDataToSend.append("nguoiDaiDienPhapLuat", formData.nguoiDaiDienPhapLuat);
      formDataToSend.append("nganhNgheChinh", formData.nganhNgheChinh);
      formDataToSend.append("soDienThoaiLienHe", formData.soDienThoaiLienHe);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("matKhau", formData.matKhau);
      formDataToSend.append("dichVuChinh", formData.dichVuChinh.join(", "));
      formDataToSend.append("website", formData.website);
      if (formData.giayDangKyKinhDoanh) {
        formDataToSend.append("giayDangKyKinhDoanh", formData.giayDangKyKinhDoanh);
      }

      const res = await authenticatedFetch(`${API_BASE}/b2b/register`, {
        method: "POST",
        body: formDataToSend
      });

      if (!res) {
        setLoading(false);
        return;
      }

      // Kiểm tra status code trước khi parse JSON
      if (!res.ok) {
        let errorMsg = `Lỗi ${res.status}: ${res.statusText}`;
        try {
          const errJson = await res.json();
          console.error("📛 Server Error Response:", errJson);
          errorMsg = errJson.message || errJson.error || errorMsg;
          if (errJson.details) {
            errorMsg += ` | ${errJson.details}`;
          }
        } catch (e) {
          const textErr = await res.text();
          console.error("📛 Server Error Text:", textErr);
        }
        setLoading(false);
        return showToast(errorMsg, "error");
      }

      const json = await res.json();
      if (json.success) {
        showToast("Đăng ký doanh nghiệp thành công!", "success");
        handleReset();
        onClose();
        if (onSuccess) onSuccess();
      } else {
        showToast(json.message || "Đăng ký thất bại", "error");
      }
    } catch (err) {
      console.error("❌ Fetch Error:", err);
      if (err instanceof SyntaxError) {
        showToast("Lỗi từ server. File có thể quá lớn hoặc định dạng sai.", "error");
      } else {
        showToast("Lỗi: " + (err.message || "Unknown error"), "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      tenDoanhNghiep: "",
      soDKKD: "",
      nguoiDaiDienPhapLuat: "",
      nganhNgheChinh: "",
      soDienThoaiLienHe: "+84 ",
      email: "",
      matKhau: "",
      xacNhanMatKhau: "",
      dichVuChinh: [],
      giayDangKyKinhDoanh: null,
      website: ""
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowServiceDropdown(false);
  };

  if (!isOpen) return null;

  const labelStyle = {
    fontWeight: "600",
    fontSize: "13px",
    marginBottom: "6px",
    color: "#374151"
  };

  const inputStyle = {
    fontSize: "13px",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
    padding: "8px 12px",
    fontFamily: "inherit"
  };

  return (
    <div
      className="modal d-block"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: isOpen ? "flex" : "none",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1050,
        padding: "20px"
      }}
      onClick={onClose}
    >
      <div
        className="modal-content"
        style={{
          maxWidth: "700px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          borderRadius: "12px",
          margin: "0 auto",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="modal-header border-bottom"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px",
            backgroundColor: "#f9fafb"
          }}
        >
          <div>
            <h5 className="modal-title" style={{ fontSize: "18px", fontWeight: "700", marginBottom: "2px" }}>
              Đăng ký dịch vụ B2B
            </h5>
            <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: 0 }}>
              Hệ thống đăng ký cho các doanh nghiệp muốn sử dụng dịch vụ
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn-close"
            style={{ cursor: "pointer", fontSize: "20px", border: "none", background: "none" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "25px" }}>
          <form onSubmit={handleSubmit}>
            <div className="row">
              {/* Tên doanh nghiệp */}
              <div className="col-md-6 mb-3">
                <label style={labelStyle}>
                  Tên doanh nghiệp <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="tenDoanhNghiep"
                  value={formData.tenDoanhNghiep}
                  onChange={handleChange}
                  placeholder="Tên doanh nghiệp"
                  style={inputStyle}
                  className="form-control form-control-sm"
                />
              </div>

              {/* Số ĐKKD */}
              <div className="col-md-6 mb-3">
                <label style={labelStyle}>
                  Số ĐKKD <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="soDKKD"
                  value={formData.soDKKD}
                  onChange={handleChange}
                  placeholder="Số ĐKKD"
                  style={inputStyle}
                  className="form-control form-control-sm"
                />
                <div style={{ fontSize: "11px", color: "#3b82f6", marginTop: "4px", fontStyle: "italic" }}>
                  Nhập chính xác mã số trên Giấy phép kinh doanh.
                </div>
              </div>

              {/* Người đại diện pháp luật */}
              <div className="col-md-6 mb-3">
                <label style={labelStyle}>
                  Người đại diện pháp luật <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="nguoiDaiDienPhapLuat"
                  value={formData.nguoiDaiDienPhapLuat}
                  onChange={handleChange}
                  placeholder="Nhập tên người đại diện pháp luật"
                  style={inputStyle}
                  className="form-control form-control-sm"
                />
              </div>

              {/* Ngành nghề chính */}
              <div className="col-md-6 mb-3">
                <label style={labelStyle}>
                  Ngành nghề chính <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="nganhNgheChinh"
                  value={formData.nganhNgheChinh}
                  onChange={handleChange}
                  placeholder="Nhập ngành nghề chính"
                  style={inputStyle}
                  className="form-control form-control-sm"
                />
                <div style={{ fontSize: "11px", color: "#3b82f6", marginTop: "4px", fontStyle: "italic" }}>
                  Ngành nghề đăng ký trên Giấy đăng ký kinh doanh
                </div>
              </div>

              {/* Số điện thoại liên hệ */}
              <div className="col-md-6 mb-3">
                <label style={labelStyle}>
                  Số điện thoại liên hệ <span className="text-danger">*</span>
                </label>
                <div className="input-group input-group-sm">
                  <select 
                    className="form-select" 
                    style={{ maxWidth: "80px", fontSize: "13px", borderRadius: "8px 0 0 8px", border: "1px solid #e5e7eb" }}
                  >
                    <option value="+84">+84</option>
                    <option value="+82">+82</option>
                  </select>
                  <input
                    type="tel"
                    name="soDienThoaiLienHe"
                    value={formData.soDienThoaiLienHe.replace("+84 ", "")}
                    onChange={(e) => handleChange({target: {name: "soDienThoaiLienHe", value: "+84 " + e.target.value}})}
                    placeholder="Nhập số"
                    style={{ ...inputStyle, borderRadius: "0 8px 8px 0", borderLeft: "none" }}
                    className="form-control form-control-sm"
                  />
                </div>
                <div style={{ fontSize: "11px", color: "#3b82f6", marginTop: "4px", fontStyle: "italic" }}>
                  Nhập theo định dạng: (VN) 01234567B, (KR) 01012345678
                </div>
              </div>

              {/* Email */}
              <div className="col-md-6 mb-3">
                <label style={labelStyle}>
                  Email <span className="text-danger">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                  style={inputStyle}
                  className="form-control form-control-sm"
                />
              </div>

              {/* Mật khẩu */}
              <div className="col-md-6 mb-3">
                <label style={labelStyle}>
                  Mật khẩu <span className="text-danger">*</span>
                </label>
                <div className="position-relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="matKhau"
                    value={formData.matKhau}
                    onChange={handleChange}
                    placeholder="Mật khẩu"
                    style={{ ...inputStyle, paddingRight: "40px" }}
                    className="form-control form-control-sm"
                  />
                  <span
                    className="position-absolute top-50 translate-middle-y end-0 me-3"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ cursor: "pointer", color: "#6b7280" }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </span>
                </div>
                <div style={{ fontSize: "11px", color: "#3b82f6", marginTop: "4px", fontStyle: "italic" }}>
                  Mật khẩu gồm tối thiểu 8 ký tự
                </div>
              </div>

              {/* Xác nhận mật khẩu */}
              <div className="col-md-6 mb-3">
                <label style={labelStyle}>
                  Xác nhận mật khẩu <span className="text-danger">*</span>
                </label>
                <div className="position-relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="xacNhanMatKhau"
                    value={formData.xacNhanMatKhau}
                    onChange={handleChange}
                    placeholder="Xác nhận mật khẩu"
                    style={{ ...inputStyle, paddingRight: "40px" }}
                    className="form-control form-control-sm"
                  />
                  <span
                    className="position-absolute top-50 translate-middle-y end-0 me-3"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ cursor: "pointer", color: "#6b7280" }}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </span>
                </div>
              </div>

              {/* Dịch vụ chính */}
              <div className="col-md-12 mb-3">
                <label style={labelStyle}>
                  Dịch vụ chính <span className="text-danger">*</span>
                </label>
                <div className="position-relative">
                  <div
                    onClick={() => setShowServiceDropdown(!showServiceDropdown)}
                    style={{
                      ...inputStyle,
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      backgroundColor: "white",
                      minHeight: "38px"
                    }}
                    className="form-control form-control-sm"
                  >
                    <span style={{ color: formData.dichVuChinh.length === 0 ? "#9ca3af" : "#000" }}>
                      {formData.dichVuChinh.length === 0 ? "Chọn dịch vụ..." : `${formData.dichVuChinh.length} dịch vụ đã chọn`}
                    </span>
                    <span style={{ fontSize: "10px" }}>▼</span>
                  </div>
                  {showServiceDropdown && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        marginTop: "4px",
                        maxHeight: "250px",
                        overflowY: "auto",
                        zIndex: 1000,
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                      }}
                    >
                      <div className="row p-3">
                        {serviceOptions.map((service, index) => (
                          <div key={index} className="col-md-6 mb-2">
                            <label
                              style={{
                                display: "flex",
                                alignItems: "center",
                                cursor: "pointer",
                                fontSize: "13px",
                                padding: "4px 0"
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={formData.dichVuChinh.includes(service)}
                                onChange={() => handleServiceToggle(service)}
                                style={{
                                  marginRight: "8px",
                                  width: "16px",
                                  height: "16px",
                                  cursor: "pointer"
                                }}
                              />
                              {service}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* File đăng ký kinh doanh */}
              <div className="col-md-12 mb-3">
                <label style={labelStyle}>
                  Tài liên Giấy Đăng ký kinh doanh <span className="text-danger">*</span>
                </label>
                <div className="position-relative">
                  <input
                    type="file"
                    id="fileInput"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileChange}
                    style={{
                      position: "absolute",
                      width: "0.1px",
                      height: "0.1px",
                      opacity: 0,
                      overflow: "hidden",
                      zIndex: -1
                    }}
                  />
                  <div style={{ display: "flex", alignItems: "center", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "8px 12px", backgroundColor: "white" }}>
                    <label 
                      htmlFor="fileInput" 
                      style={{ 
                        cursor: "pointer", 
                        padding: "4px 12px", 
                        backgroundColor: "#e5e7eb", 
                        borderRadius: "4px",
                        marginRight: "10px",
                        fontSize: "13px",
                        marginBottom: 0
                      }}
                    >
                      Choose File
                    </label>
                    <span style={{ fontSize: "13px", color: "#6b7280" }}>
                      {formData.giayDangKyKinhDoanh ? formData.giayDangKyKinhDoanh.name : "No file chosen"}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: "11px", color: "#3b82f6", marginTop: "4px", fontStyle: "italic" }}>
                  Định dạng file phải là .jpg, .png, .pdf.
                </div>
              </div>

              {/* Website / Blog / SNS */}
              <div className="col-md-12 mb-3">
                <label style={labelStyle}>Website / Blog / SNS</label>
                <div className="input-group input-group-sm">
                  <select 
                    className="form-select" 
                    style={{ maxWidth: "120px", fontSize: "13px", borderRadius: "8px 0 0 8px", border: "1px solid #e5e7eb" }}
                  >
                    <option value="Website">Website</option>
                    <option value="Blog">Blog</option>
                    <option value="SNS">SNS</option>
                  </select>
                  <input
                    type="text"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="www.onepasskr.com"
                    style={{ ...inputStyle, borderRadius: "0 8px 8px 0", borderLeft: "none" }}
                    className="form-control form-control-sm"
                  />
                </div>
                <div style={{ fontSize: "11px", color: "#3b82f6", marginTop: "4px", fontStyle: "italic" }}>
                  Không bắt buộc
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="row mt-4">
              <div className="col-12">
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "12px",
                    backgroundColor: "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "600",
                    fontSize: "14px",
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.7 : 1,
                    transition: "all 0.2s"
                  }}
                  className="btn"
                >
                  {loading ? "Đang xử lý..." : "Gửi yêu cầu đăng ký tài khoản"}
                </button>
              </div>
              <div className="col-12 mt-2">
                <p style={{ textAlign: "center", fontSize: "12px", color: "#6b7280", marginBottom: 0 }}>
                  Đã có tài khoản? <a href="/login" style={{ color: "#3b82f6", textDecoration: "none" }}>Trở về Trang Đăng nhập</a>
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
