import React, { useState, useEffect, useRef } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import NotificationPanel from "./CMSDashboard/NotificationPanel";
import EditProfileModal from "./EditProfileModal";
import { showToast } from "../utils/toast";
import useDashboardData from "./CMSDashboard/hooks/useDashboardData";
import { LayoutGrid, Edit, Trash2, X, Pin, PinOff, PlusCircle } from "lucide-react";
import Swal from "sweetalert2";
import "../styles/DashboardList.css";

import { ChevronDown, Eye, EyeOff } from "lucide-react";


const ModernSelect = ({ name, value, options, onChange, placeholder, disabled, twoColumns = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = options.find(opt => String(opt.value) === String(value));
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (val) => {
    if (disabled) return;
    onChange({ target: { name, value: val } });
    setIsOpen(false);
  };

  return (
    <div className="position-relative" ref={containerRef} style={{ width: "100%" }}>
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          width: "100%", padding: "10px 12px", borderRadius: "10px",
          border: "2px solid #E5E7EB", fontSize: "13px", color: "#374151",
          backgroundColor: disabled ? "#F3F4F6" : "#F9FAFB",
          cursor: disabled ? "not-allowed" : "pointer",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          userSelect: "none", height: "40px" 
        }}
      >
        <span style={{ color: value ? "#374151" : "#9CA3AF" }}>{displayLabel}</span>
        <ChevronDown size={16} color="#6B7280" />
      </div>

      {isOpen && !disabled && (
        <div className="position-absolute w-100 bg-white shadow-sm rounded-bottom border"
          style={{
            top: "48px", left: 0, zIndex: 1000, maxHeight: "250px", overflowY: "auto",
            borderRadius: "8px", padding: "8px",
            display: twoColumns ? "grid" : "block",
            gridTemplateColumns: twoColumns ? "1fr 1fr" : "none", gap: twoColumns ? "8px" : "0"
          }}
        >
          {options.map((opt, idx) => (
            <div key={idx} onClick={() => handleSelect(opt.value)}
              className={`px-3 py-2 transition-all ${twoColumns ? 'rounded' : ''}`}
              style={{
                cursor: "pointer", fontSize: "12px",
                color: String(opt.value) === String(value) ? "#2563eb" : "#374151",
                backgroundColor: String(opt.value) === String(value) ? "#EFF6FF" : "transparent",
                borderBottom: !twoColumns && idx !== options.length - 1 ? "1px solid #f3f4f6" : "none",
                border: twoColumns ? "1px solid #E5E7EB" : undefined,
              }}
              onMouseEnter={(e) => { if(String(opt.value) !== String(value)) e.target.style.backgroundColor = "#F3F4F6"; }}
              onMouseLeave={(e) => { if(String(opt.value) !== String(value)) e.target.style.backgroundColor = "transparent"; }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
const RequestEditModal = ({ request, users, currentUser, onClose, onSave, currentLanguage }) => {
  const isNew = !request || !request.YeuCauID;
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // State form
  const [formData, setFormData] = useState(
    isNew
      ? {
          HoTen: "", MaVung: "", SoDienThoai: "", Email: "",
          NoiDung: "", GhiChu: "", TenHinhThuc: "",
          CoSoTuVan: "", Gio: "", ChonNgay: "",
          TenDichVu: "", MaHoSo: "", NguoiPhuTrachId: "",
          TrangThai: "", GoiDichVu: "",
          Invoice: "No", InvoiceUrl: "",
          ConfirmPassword: "" 
        }
      : { 
          ...request,
          MaVung: request.MaVung || "",
          TenHinhThuc: request.TenHinhThuc || "Trực tiếp",
          CoSoTuVan: request.CoSoTuVan || "",
          GoiDichVu: request.GoiDichVu || "Thông thường",
          Invoice: request.Invoice || "No",
          MaHoSo: request.MaHoSo || ""
        }
  );

  // Helper styles
  const inputStyle = {
    width: "100%", padding: "10px 12px", borderRadius: "10px",
    border: "2px solid #E5E7EB", fontSize: "13px", color: "#374151",
    backgroundColor: "#F9FAFB", outline: "none", transition: "border-color 0.2s",
  };
  const labelStyle = { fontSize: "13px", fontWeight: "700", color: "#1F2937", marginBottom: "4px", display: "block" };
  const helperTextStyle = { fontSize: "10px", color: "#3B82F6", marginTop: "3px", fontStyle: "normal" };

  // Data Select
  const areaCodes = [
    { value: "+82", label: "Hàn Quốc (+82)" },
    { value: "+84", label: "Việt Nam (+84)" },
  ];

  const serviceList = [
    "Chứng thực", "Kết hôn", "Khai sinh, khai tử", "Xuất nhập cảnh",
    "Giấy tờ tuỳ thân", "Nhận nuôi", "Thị thực", "Tư vấn pháp lý",
    "Dịch vụ B2B", "Khác"
  ];

  // Logic xử lý Input
  const handleInputChange = (eOrName, value) => {
    let name, val;
    if (typeof eOrName === 'string') {
      name = eOrName; val = value;
    } else {
      name = eOrName.target.name; val = eOrName.target.value;
    }

    setFormData((prev) => {
      const updated = { ...prev, [name]: val };
      if (name === "NguoiPhuTrachId") {
        const selectedUser = users.find((u) => String(u.id) === String(val));
        updated.NguoiPhuTrach = selectedUser ? selectedUser.name : "";
      }
      return updated;
    });
  };

  const formatTimeForInput = (val) => {
    if (!val) return "";
    if (val.includes("T")) {
      const date = new Date(val);
      if (isNaN(date.getTime())) return "";
      const hh = String(date.getHours()).padStart(2, '0');
      const mm = String(date.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    }
    return val.substring(0, 5);
  };

  // Logic Submit
  const handleSave = async () => {
    // 1. Validate chung
    if (!formData.HoTen || !formData.SoDienThoai) {
        showToast(currentLanguage === "vi" ? "Vui lòng nhập Họ tên và SĐT" : "Please enter Name and Phone", "warning");
        return;
    }

    // 2. Logic riêng cho ĐĂNG KÝ MỚI (Cần nhập mật khẩu)
    if (isNew) {
      if (!formData.ConfirmPassword) {
        showToast("Vui lòng nhập mật khẩu để xác nhận đăng ký!", "warning");
        return;
      }
      
      try {
        setLoading(true);
        // Gọi API check login để xác thực mật khẩu người đang thao tác
        const verifyRes = await fetch(`https://onepasscms-backend.onrender.com/api/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: currentUser.username,
            password: formData.ConfirmPassword
          })
        });
        const verifyJson = await verifyRes.json();
        
        if (!verifyJson.success) {
          setLoading(false);
          showToast("Mật khẩu xác nhận không chính xác!", "error");
          return;
        }
      } catch (err) {
        setLoading(false);
        showToast("Lỗi kết nối khi xác thực mật khẩu", "error");
        return;
      }
    }

    // 3. Nếu OK (hoặc là Edit) thì gọi hàm save của cha
    const payload = { ...formData };
    delete payload.ConfirmPassword; // Không gửi mật khẩu lên API tạo yêu cầu
    
    setLoading(true);
    await onSave(payload); // Hàm onSave của cha sẽ handle đóng modal
    setLoading(false);
  };

if (isNew) {
  return (
    <div className="modal-overlay" style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1050, backdropFilter: "blur(2px)",
      display: "flex", justifyContent: "center", alignItems: "center"
    }}>
      <div className="bg-white p-3 scrollbar-hide position-relative" 
          style={{ 
            width: "570px", 
            maxWidth: "90%", 
            maxHeight: "90vh",
            overflowY: "auto", 
            borderRadius: "12px", 
            boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" 
          }}
      >
        <button onClick={onClose} className="position-absolute d-flex align-items-center justify-content-center border-0 bg-light rounded-circle"
            style={{ top: "10px", right: "10px", width: "28px", height: "28px", cursor: "pointer", zIndex: 10 }}>
            <X size={16} />
        </button>

        <div className="text-center mb-3 mt-1">
          <h3 className="fw-bold m-0" style={{ color: "#333", fontSize: "18px" }}>Đăng ký dịch vụ mới (B2C)</h3>
          <p className="text-muted small mt-1 mb-0" style={{ fontSize: "11px" }}>Nhập thông tin khách hàng và dịch vụ</p>
        </div>

        <div className="row g-2 px-1 align-items-stretch"> {/* Thêm align-items-stretch */}
          
          {/* Hàng 1: Họ tên & Mã vùng */}
          <div className="col-md-6 d-flex flex-column">
            <label style={{...labelStyle, fontSize: "12px"}}>Khách Hàng <span className="text-danger">*</span></label>
            <input type="text" name="HoTen" style={{
              ...inputStyle, 
              padding: "8px 10px", 
              fontSize: "12px",
              height: "40px", // Fixed height
              boxSizing: "border-box"
            }} 
              value={formData.HoTen} onChange={handleInputChange} placeholder="Nhập Tên Khách Hàng" />
          </div>
          <div className="col-md-6 d-flex flex-column">
            <label style={{...labelStyle, fontSize: "12px"}}>Mã vùng <span className="text-danger">*</span></label>
            <div style={{ flex: 1 }}> {/* Wrapper để ModernSelect chiếm full height */}
              <ModernSelect name="MaVung" value={formData.MaVung} placeholder="Chọn Mã Vùng" 
                options={areaCodes} onChange={handleInputChange} />
            </div>
          </div>

          {/* Hàng 2: SĐT & Email */}
          <div className="col-md-6 d-flex flex-column">
            <label style={{...labelStyle, fontSize: "12px"}}>Số điện thoại <span className="text-danger">*</span></label>
            <input type="text" name="SoDienThoai" style={{
              ...inputStyle, 
              padding: "8px 10px", 
              fontSize: "12px",
              height: "40px", // Fixed height
              boxSizing: "border-box"
            }} 
              value={formData.SoDienThoai} onChange={handleInputChange} placeholder="Nhập Số Điện Thoại" />
          </div>
          <div className="col-md-6 d-flex flex-column">
            <label style={{...labelStyle, fontSize: "12px"}}>Email</label>
            <input type="email" name="Email" style={{
              ...inputStyle, 
              padding: "8px 10px", 
              fontSize: "12px",
              height: "40px", // Fixed height
              boxSizing: "border-box"
            }} 
              value={formData.Email} onChange={handleInputChange} placeholder="Nhập Email" />
          </div>

          {/* Hàng 3: Dịch vụ & Gói */}
          <div className="col-md-6 d-flex flex-column">
            <label style={{...labelStyle, fontSize: "12px"}}>Dịch vụ <span className="text-danger">*</span></label>
            <div style={{ flex: 1 }}>
              <ModernSelect name="TenDichVu" value={formData.TenDichVu} placeholder="Chọn Dịch Vụ"
                options={serviceList.map(s => ({ value: s, label: s }))} onChange={handleInputChange} />
            </div>
          </div>
          <div className="col-md-6 d-flex flex-column">
            <label style={{...labelStyle, fontSize: "12px"}}>Gói Dịch Vụ</label>
            <div style={{ flex: 1 }}>
              <ModernSelect name="GoiDichVu" value={formData.GoiDichVu} placeholder="Chọn Gói Dịch Vụ"
                options={[{ value: "Thông thường", label: "Thông thường" }, { value: "Cấp tốc", label: "Cấp tốc" }]} 
                onChange={handleInputChange} />
            </div>
          </div>

          {/* Hàng 4: Hình thức & Cơ sở */}
          <div className="col-md-6 d-flex flex-column">
            <label style={{...labelStyle, fontSize: "12px"}}>Hình thức</label>
            <div style={{ flex: 1 }}>
              <ModernSelect name="TenHinhThuc" value={formData.TenHinhThuc} placeholder="Chọn Hình Thức"
                options={["Trực tiếp", "Online", "Email", "Gọi điện"].map(v => ({ value: v, label: v }))} 
                onChange={handleInputChange} />
            </div>
          </div>
          <div className="col-md-6 d-flex flex-column">
            <label style={{...labelStyle, fontSize: "12px"}}>Cơ sở tư vấn</label>
            <div style={{ flex: 1 }}>
              <ModernSelect name="CoSoTuVan" value={formData.CoSoTuVan} placeholder="Chọn Cơ Sở Tư Vấn"
                options={[{ value: "Seoul", label: "Seoul" }, { value: "Busan", label: "Busan" }]} 
                onChange={handleInputChange} />
            </div>
          </div>

          {/* Hàng 5: Ngày giờ hẹn */}
          <div className="col-md-6 d-flex flex-column">
            <label style={{...labelStyle, fontSize: "12px"}}>Ngày hẹn</label>
            <input type="date" name="ChonNgay" style={{
              ...inputStyle, 
              padding: "8px 10px", 
              fontSize: "12px",
              height: "40px", // Fixed height
              boxSizing: "border-box"
            }} 
              value={formData.ChonNgay ? new Date(formData.ChonNgay).toISOString().split("T")[0] : ""} 
              onChange={handleInputChange} />
          </div>
          <div className="col-md-6 d-flex flex-column">
            <label style={{...labelStyle, fontSize: "12px"}}>Giờ hẹn</label>
            <input type="time" name="Gio" style={{
              ...inputStyle, 
              padding: "8px 10px", 
              fontSize: "12px",
              height: "40px", // Fixed height
              boxSizing: "border-box"
            }} 
              value={formatTimeForInput(formData.Gio)} onChange={handleInputChange} />
          </div>

          {/* Nội dung & Ghi chú */}
          <div className="col-12 d-flex flex-column">
            <label style={{...labelStyle, fontSize: "12px"}}>Nội dung</label>
            <textarea rows={2} name="NoiDung" style={{
              ...inputStyle, 
              padding: "8px 10px", 
              fontSize: "12px",
              minHeight: "70px", // Fixed min-height cho textarea
              boxSizing: "border-box",
              resize: "vertical"
            }} 
              value={formData.NoiDung} onChange={handleInputChange} />
          </div>
          <div className="col-12 d-flex flex-column">
            <label style={{...labelStyle, fontSize: "12px"}}>Ghi chú</label>
            <textarea rows={2} name="GhiChu" style={{
              ...inputStyle, 
              padding: "8px 10px", 
              fontSize: "12px",
              height: "40px", // Fixed height
              boxSizing: "border-box"
            }} 
              value={formData.GhiChu} onChange={handleInputChange} />
          </div>
          
          {/* Người phụ trách (Nếu là Admin) */}
          {currentUser?.is_admin && (
            <div className="col-12 d-flex flex-column">
              <label style={{...labelStyle, fontSize: "12px"}}>Người phụ trách</label>
              <div style={{ flex: 1 }}>
                <ModernSelect name="NguoiPhuTrachId" value={formData.NguoiPhuTrachId} placeholder="Chọn nhân viên" 
                  options={users.map(u => ({ value: String(u.id), label: u.name }))} onChange={handleInputChange} />
              </div>
            </div>
          )}

          {/* CONFIRM PASSWORD (Bắt buộc) */}
          <div className="col-12 mt-2 d-flex flex-column">
            <label style={{...labelStyle, fontSize: "12px"}}>Nhập mật khẩu để xác nhận đăng ký <span className="text-danger">*</span></label>
            <div className="position-relative">
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                name="ConfirmPassword"
                placeholder="******" 
                value={formData.ConfirmPassword}
                onChange={handleInputChange}
                autoComplete="new-password"
                style={{
                  ...inputStyle, 
                  padding: "8px 10px", 
                  fontSize: "12px", 
                  paddingRight: "35px",
                  height: "40px", // Fixed height
                  boxSizing: "border-box"
                }}
              />
              <span className="position-absolute top-50 translate-middle-y end-0 me-2 cursor-pointer" 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ color: "#6B7280" }}>
                {showConfirmPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
              </span>
            </div>
            <div style={{...helperTextStyle, fontSize: "9px"}}>Mật khẩu tài khoản của bạn ({currentUser.username})</div>
          </div>

          <div className="col-12 mt-3 pt-1">
            <button className="btn w-100 fw-bold shadow-sm" onClick={handleSave} disabled={loading}
              style={{ 
                backgroundColor: "#22C55E", 
                color: "white", 
                padding: "10px", 
                fontSize: "13px",
                height: "37px", // Fixed height
                borderRadius: "8px", 
                border: "none" 
              }}>
              {loading ? "Đang xử lý..." : "Đăng ký dịch vụ mới"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
  return (
    <div className="modal-overlay" style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050,
      display: "flex", justifyContent: "center", alignItems: "center"
    }}>
      <div className="bg-white rounded-3 shadow-lg p-4" style={{ width: "900px", maxWidth: "95%", maxHeight: "90vh", overflowY: "auto" }}>
        <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
          <h5 className="fw-bold m-0 text-primary">
             {currentLanguage === "vi" ? `Cập nhật yêu cầu #${formData.YeuCauID}` : `Update Request #${formData.YeuCauID}`}
          </h5>
          <button className="btn btn-sm btn-light rounded-circle" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Form Sửa - Layout cũ */}
        <div className="row g-3">
          <div className="col-md-4">
             <label className="form-label fw-semibold text-secondary small">Họ tên</label>
             <input type="text" className="form-control" name="HoTen" value={formData.HoTen} onChange={handleInputChange} />
          </div>
          <div className="col-md-2">
             <label className="form-label fw-semibold text-secondary small">Mã vùng</label>
             {/* Vẫn dùng ModernSelect cho tiện nhưng style trong Grid Bootstrap */}
             <ModernSelect name="MaVung" value={formData.MaVung} options={areaCodes} onChange={handleInputChange} />
          </div>
          <div className="col-md-3">
             <label className="form-label fw-semibold text-secondary small">Số điện thoại</label>
             <input type="text" className="form-control" name="SoDienThoai" value={formData.SoDienThoai} onChange={handleInputChange} />
          </div>
          <div className="col-md-3">
             <label className="form-label fw-semibold text-secondary small">Email</label>
             <input type="email" className="form-control" name="Email" value={formData.Email} onChange={handleInputChange} />
          </div>

          <div className="col-md-4">
             <label className="form-label fw-semibold text-secondary small">Dịch vụ</label>
             <select className="form-select" name="TenDichVu" value={formData.TenDichVu} onChange={handleInputChange}>
                {serviceList.map(s => <option key={s} value={s}>{s}</option>)}
             </select>
          </div>
          <div className="col-md-4">
             <label className="form-label fw-semibold text-secondary small">Gói Dịch Vụ</label>
             <select className="form-select" name="GoiDichVu" value={formData.GoiDichVu} onChange={handleInputChange}>
               <option value="Thông thường">Thông thường</option><option value="Cấp tốc">Cấp tốc</option>
             </select>
          </div>
          <div className="col-md-4">
             <label className="form-label fw-semibold text-secondary small">Trạng thái</label>
             <select className="form-select" name="TrangThai" value={formData.TrangThai} onChange={handleInputChange}>
                <option value="Tư vấn">Tư vấn</option>
                <option value="Đang xử lý">Đang xử lý</option>
                <option value="Đang nộp hồ sơ">Đang nộp hồ sơ</option>
                <option value="Hoàn thành">Hoàn thành</option>
             </select>
          </div>

          {/* Các trường khác giữ nguyên layout cũ... */}
          <div className="col-md-6">
            <label className="form-label fw-semibold text-secondary small">Nội dung</label>
            <textarea className="form-control" name="NoiDung" rows={2} value={formData.NoiDung} onChange={handleInputChange} />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-semibold text-secondary small">Ghi chú</label>
            <textarea className="form-control" name="GhiChu" rows={2} value={formData.GhiChu} onChange={handleInputChange} />
          </div>
          
          {/* Không có trường mật khẩu ở đây */}

        </div>

        <div className="mt-4 d-flex justify-content-end gap-2">
          <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>Lưu thay đổi</button>
        </div>
      </div>
    </div>
  );
};
// =========================================================================
// ROW ITEM
// =========================================================================
const RowItem = ({
  item,
  currentUser,
  onEdit,
  onDelete,
  currentLanguage,
  visibleColumns,
  pinnedColumns,
}) => {
  const canViewFinance = currentUser?.is_accountant || currentUser?.is_director;

  const handleDeleteClick = () => {
    Swal.fire({
      title: currentLanguage === "vi" ? "Bạn chắc chắn chứ?" : "Are you sure?",
      text: currentLanguage === "vi" ? "Hành động này không thể hoàn tác!" : "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: currentLanguage === "vi" ? "Xoá" : "Delete",
      cancelButtonText: currentLanguage === "vi" ? "Hủy" : "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        onDelete(item.YeuCauID);
      }
    });
  };

  const translateService = (serviceName) => {
    const map = {
      "인증 센터": "Chứng thực", "결혼 이민": "Kết hôn",
      "출생신고 대행": "Khai sinh, khai tử", "출입국 행정 대행": "Xuất nhập cảnh",
      "신분증명 서류 대행": "Giấy tờ tuỳ thân", "입양 절차 대행": "Nhận nuôi",
      "비자 대행": "Thị thực", "법률 컨설팅": "Tư vấn pháp lý",
      "B2B 서비스": "Dịch vụ B2B", 기타: "Khác",
    };
    return map[serviceName] || serviceName;
  };

  const translateBranch = (branch) => {
    const map = { 서울: "Seoul", 부산: "Busan" };
    return map[branch] || branch || "";
  };
  
  const getPackageBadgeColor = (pkg) => {
      if (pkg === 'Cấp tốc') return 'bg-danger';
      return 'bg-info text-dark';
  }

  const displayMaHoSo = item.TrangThai === "Tư vấn" ? "" : item.MaHoSo || "-";
  
  const isVisible = (key) => (visibleColumns ? visibleColumns[key] : true);
  const isPinned = (key) => pinnedColumns.includes(key);

  const getStatusBadge = (status) => {
    let colorClass = "bg-secondary";
    if (status === "Hoàn thành") colorClass = "bg-success";
    if (status === "Đang xử lý") colorClass = "bg-primary";
    if (status === "Đang nộp hồ sơ") colorClass = "bg-warning text-dark";
    if (status === "Tư vấn") colorClass = "bg-info text-dark";
    return <span className={`badge ${colorClass}`}>{status}</span>
  };

  return (
    <tr>
      {/* CÁC CỘT DỮ LIỆU */}
      {isVisible("id") && (
        <td className={`text-center fw-semibold border-target ${isPinned("id") ? "sticky-col" : ""}`}>
          {item.YeuCauID}
        </td>
      )}
      {isVisible("hoTen") && (
        <td className={`text-center fw-semibold ${isPinned("hoTen") ? "sticky-col" : ""}`} style={{ minWidth: "120px" }}>
          {item.HoTen}
        </td>
      )}
      {isVisible("maVung") && (
        <td className={`text-center ${isPinned("maVung") ? "sticky-col" : ""}`}>
          {item.MaVung}
        </td>
      )}
      {isVisible("sdt") && (
        <td style={{maxWidth: "150px",width: "110px", textAlign:"center"}} className={isPinned("sdt") ? "sticky-col" : ""}>
          {item.SoDienThoai}
        </td>
      )}
      {isVisible("email") && (
        <td style={{ maxWidth: "150px",width: "162px" }} className={`text-center text-truncate ${isPinned("email") ? "sticky-col" : ""}`} title={item.Email}>
          {item.Email}
        </td>
      )}
      {isVisible("noiDung") && (
        <td 
          style={{ minWidth: "200px", maxWidth: "300px" }} 
          className={`${isPinned("noiDung") ? "sticky-col" : ""}`}
        >
           <div style={{ 
               whiteSpace: "pre-wrap",  
               wordBreak: "break-word",  
               textAlign: "left",        
               overflowWrap: "anywhere",
               paddingLeft: "5px"  
           }}>
             {item.NoiDung}
           </div>
        </td>
      )}
      {isVisible("ghiChu") && (
        <td style={{ maxWidth: "150px", width: "152px" }} className={`text-center text-truncate ${isPinned("ghiChu") ? "sticky-col" : ""}`} title={item.GhiChu}>
          {item.GhiChu}
        </td>
      )}
      {isVisible("hinhThuc") && (
        <td className={`text-center border-target ${isPinned("hinhThuc") ? "sticky-col" : ""}`}>
          {item.TenHinhThuc}
        </td>
      )}
      {isVisible("coSo") && (
        <td className={`text-center border-target ${isPinned("coSo") ? "sticky-col" : ""}`}>
          {translateBranch(item.CoSoTuVan)}
        </td>
      )}
     {isVisible("gio") && (
      <td className={`text-center ${isPinned("gio") ? "sticky-col" : ""}`}>
        {(() => {
          if (!item.Gio) return "";
          if (item.Gio.includes("T")) {
            return new Date(item.Gio).toLocaleTimeString("vi-VN", { hour12: false, hour: "2-digit", minute: "2-digit" });
          }
     
          return item.Gio.substring(0, 5);
        })()}
      </td>
    )}
      {isVisible("ngayTao") && (
        <td className={`text-center text-nowrap border-target ${isPinned("ngayTao") ? "sticky-col" : ""}`} style={{fontSize: "0.8rem"}}>
          {item.NgayTao && (
            <>
              {new Date(item.NgayTao).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
              <br />
              {new Date(item.NgayTao).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false })}
            </>
          )}
        </td>
      )}
      {isVisible("dichVu") && (
        <td style={{ maxWidth: "150px" }} className={`text-center text-truncate ${isPinned("dichVu") ? "sticky-col" : ""}`} title={translateService(item.TenDichVu)}>
          {translateService(item.TenDichVu)}
        </td>
      )}
      {isVisible("maDichVu") && (
        <td className={`text-center border-target ${isPinned("maDichVu") ? "sticky-col" : ""}`}>
          {displayMaHoSo}
        </td>
      )}
      {currentUser?.is_admin && isVisible("nguoiPhuTrach") && (
        <td className={isPinned("nguoiPhuTrach") ? "sticky-col" : ""}>
          {item.NguoiPhuTrach || <span className="text-muted fst-italic"></span>}
        </td>
      )}
      {isVisible("ngayHen") && (
        <td className={`text-center ${isPinned("ngayHen") ? "sticky-col" : ""}`}>
          {item.ChonNgay ? new Date(item.ChonNgay).toLocaleDateString("vi-VN") : ""}
        </td>
      )}
      {isVisible("trangThai") && (
      <td className={`text-center ${isPinned("trangThai") ? "sticky-col" : ""}`}>
        
        {item.TrangThai}
      </td>
    )}
        {isVisible("goiDichVu") && (
      <td className={`text-center ${isPinned("goiDichVu") ? "sticky-col" : ""}`}>
        {item.GoiDichVu || ""}
      </td>
    )}
       {isVisible("invoice") && (
        <td className={`text-center ${isPinned("invoice") ? "sticky-col" : ""}`}>
           {["Yes", "yes", "true", "1"].includes(String(item.Invoice)) ? (
             <span className="text-success fw-bold">Có</span>
           ) : (
             <span className="text-muted"></span>
           )}
        </td>
      )}
      {canViewFinance && isVisible("invoiceUrl") && (
        <td style={{ maxWidth: "120px" }} className={isPinned("invoiceUrl") ? "sticky-col" : ""}>
          {item.InvoiceUrl ? (
            <a href={item.InvoiceUrl} target="_blank" rel="noreferrer" className="text-decoration-none text-primary d-block text-truncate">Link</a>
          ) : "-"}
        </td>
      )}
      {isVisible("hanhDong") && (
        <td className={`text-center ${isPinned("hanhDong") ? "sticky-col" : ""}`}>
          <div className="d-flex justify-content-center align-items-center gap-2">
            <button className="btn btn-sm btn-primary d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }} onClick={() => onEdit(item)} title="Sửa">
              <Edit size={16} />
            </button>
            <button className="btn btn-sm btn-danger d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }} onClick={handleDeleteClick} title="Xóa">
              <Trash2 size={16} />
            </button>
          </div>
        </td>
      )}
    </tr>
  );
};

// =========================================================================
// MAIN COMPONENT: B2C PAGE
// =========================================================================
const B2CPage = () => {
  const { currentUser } = useDashboardData();
  const [showSidebar, setShowSidebar] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [currentLanguage, setCurrentLanguage] = useState(localStorage.getItem("language") || "vi");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [data, setData] = useState([]);
  const [dichvuList, setDichvuList] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;
  const tableContainerRef = useRef(null);
  
  const [editingRequest, setEditingRequest] = useState(null);

  const canViewFinance = currentUser?.is_accountant || currentUser?.is_director;

  const initialColumnKeys = [
    { key: "id", label: "STT" },
    { key: "hoTen", label: "Họ tên" },
    { key: "maVung", label: "Mã vùng" },
    { key: "sdt", label: "SĐT" },
    { key: "email", label: "Email" },
    { key: "noiDung", label: "Nội dung" },
    { key: "ghiChu", label: "Ghi chú" },
    { key: "hinhThuc", label: "Hình thức" },
    { key: "coSo", label: "Cơ sở" },
    { key: "gio", label: "Giờ" },
    { key: "ngayTao", label: "Ngày tạo" },
    { key: "dichVu", label: "Dịch vụ" },
    { key: "maDichVu", label: "Mã Dịch Vụ" },
    ...(currentUser?.is_admin ? [{ key: "nguoiPhuTrach", label: "Người phụ trách" }] : []),
    { key: "ngayHen", label: "Ngày hẹn" },
    { key: "trangThai", label: "Trạng thái" },
    { key: "goiDichVu", label: "Gói Dịch Vụ" },
    { key: "invoice", label: "Invoice Y/N" },
    ...(canViewFinance ? [{ key: "invoiceUrl", label: "Invoice" }] : []),
    { key: "hanhDong", label: "Hành động" },
  ];

  const [visibleColumns, setVisibleColumns] = useState({});
  const [pinnedColumns, setPinnedColumns] = useState([]);

  useEffect(() => {
    const initial = {};
    initialColumnKeys.forEach(col => (initial[col.key] = true));
    setVisibleColumns(initial);
  }, [currentUser, canViewFinance]);

  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const columnMenuRef = useRef(null);

  const tableHeaders = [
    "STT", "Khách hàng", "Mã vùng", "Số Điện Thoại", "Email", "Nội dung", "Ghi chú", 
    "Hình thức", "Cơ sở", "Giờ", "Ngày tạo", "Dịch vụ", "Mã Dịch Vụ",
    ...(currentUser?.is_admin ? ["Người phụ trách"] : []),
    "Ngày hẹn", "Trạng thái", "Gói Dịch Vụ", "Invoice Y/N",
    ...(canViewFinance ? ["Invoice"] : []),
    "Hành động",
  ];

  useEffect(() => {
    const fetchCatalogs = async () => {
      try {
        const resDV = await fetch("https://onepasscms-backend.onrender.com/api/dichvu");
        const dv = await resDV.json();
        if (dv.success) setDichvuList(dv.data);
        const resUser = await fetch("https://onepasscms-backend.onrender.com/api/User");
        const u = await resUser.json();
        if (u.success) setUsers(u.data);
      } catch (err) { console.error("Lỗi tải danh mục:", err); }
    };
    fetchCatalogs();
  }, []);

  const fetchData = async () => {
    try {
      let url = `https://onepasscms-backend.onrender.com/api/yeucau?page=${currentPage}&limit=${itemsPerPage}`;
      if (currentUser?.is_admin) { url += `&is_admin=true`; } else { url += `&userId=${currentUser?.id}`; }
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) { setData(json.data); setTotalPages(json.totalPages || 1); }
      else { showToast("Không thể tải dữ liệu", "error"); }
    } catch (err) { showToast("Lỗi kết nối server", "error"); }
  };

  useEffect(() => { fetchData(); }, [currentPage, currentUser]);

  const handleEditClick = (item) => { setEditingRequest(item); };
  
  const handleCreateClick = () => {
      setEditingRequest({});
  };

  const handleModalSave = async (formData) => {
    try {
      let url = "https://onepasscms-backend.onrender.com/api/yeucau";
      let method = "POST";

      if (formData.YeuCauID) {
          url = `https://onepasscms-backend.onrender.com/api/yeucau/${formData.YeuCauID}`;
          method = "PUT";
      }

      const res = await fetch(url, {
        method: method, 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      
      if (json.success) {
        showToast(method === "POST" ? "Đăng ký thành công" : "Cập nhật thành công", "success");
        fetchData();
        setEditingRequest(null);
      } else { showToast("Lỗi xử lý", "error"); }
    } catch { showToast("Lỗi máy chủ", "error"); }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`https://onepasscms-backend.onrender.com/api/yeucau/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) { showToast("Đã xoá", "success"); fetchData(); } 
      else { showToast("Không thể xoá", "error"); }
    } catch { showToast("Lỗi kết nối", "error"); }
  };

  const filteredData = data.filter((i) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return ((i.HoTen || "").toLowerCase().includes(s) || (i.Email || "").toLowerCase().includes(s) || (i.SoDienThoai || "").toLowerCase().includes(s) || (i.MaHoSo || "").toLowerCase().includes(s));
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (columnMenuRef.current && !columnMenuRef.current.contains(event.target)) { setShowColumnMenu(false); }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleColumn = (key) => { setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] })); };

  const togglePinColumn = (key) => {
    setPinnedColumns(prev => {
      if (prev.includes(key)) { return prev.filter(col => col !== key); } 
      else { return [...prev, key]; }
    });
  };

  const isVisible = (key) => visibleColumns[key];
  const isPinned = (key) => pinnedColumns.includes(key);

  return (
    <div className="d-flex h-100" style={{ background: "#ffffff" }}>
      <div style={{ width: showSidebar ? "290px" : "70px", transition: "0.3s", zIndex: 100 }}>
        <Sidebar collapsed={!showSidebar} user={currentUser} />
      </div>

      <div className="flex-grow-1 p-3" style={{ height: "100vh", overflowY: "auto" }}>
        <Header
          currentUser={currentUser}
          showSidebar={showSidebar}
          onToggleSidebar={() => setShowSidebar((s) => !s)}
          currentLanguage={currentLanguage}
          onLanguageChange={setCurrentLanguage}
          onBellClick={() => setShowNotification(!showNotification)}
          onOpenEditModal={() => setShowEditModal(true)}
        />

        <NotificationPanel
          showNotification={showNotification}
          setShowNotification={setShowNotification}
          notifications={notifications}
          currentLanguage={currentLanguage}
        />

        {showEditModal && (
          <EditProfileModal
            currentUser={currentUser}
            onClose={() => setShowEditModal(false)}
            currentLanguage={currentLanguage}
          />
        )}

        {editingRequest && (
          <RequestEditModal
            request={editingRequest}
            users={users}
            currentUser={currentUser}
            currentLanguage={currentLanguage}
            onClose={() => setEditingRequest(null)}
            onSave={handleModalSave}
          />
        )}

        <h3 className="fw-bold mb-2 fs-5">Quản lý B2C</h3>

        <div className="mb-4">
          <div className="p-0">
            <div className="d-flex justify-content-between align-items-end mb-3 mt-4">
              <input
                type="text"
                className="form-control shadow-sm"
                placeholder={currentLanguage === "vi" ? "Tìm kiếm Họ tên, Email, SĐT..." : "Search Name, Email, Phone..."}
                style={{ width: 300, borderRadius: "30px", paddingLeft: "18px", transition: "all 0.3s ease", fontSize: "14px" }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={(e) => (e.target.style.boxShadow = "0 0 8px rgba(37,99,235,0.3)")}
                onBlur={(e) => (e.target.style.boxShadow = "none")}
              />

              {currentUser && (
                <div className="d-flex align-items-center gap-2">
                  <div>
                    <button
                      onClick={handleCreateClick}
                      style={{ 
                          background: "#16a34a", 
                          color: "white", 
                          border: "none", 
                          borderRadius: "8px", 
                          padding: "8px 16px", 
                          cursor: "pointer", 
                          fontWeight: 500, 
                          display: "flex", 
                          alignItems: "center", 
                          gap: "6px" 
                      }}
                    >
                      <PlusCircle size={18} />
                      {currentLanguage === "vi" ? "Đăng ký dịch vụ mới" : "Register New Service"}
                    </button>
                  </div>

                  <div className="position-relative" ref={columnMenuRef}>
                    <button
                      className="btn btn-light border shadow-sm d-flex align-items-center justify-content-center"
                      style={{ width: 40, height: 40, borderRadius: "8px", backgroundColor: "#fff" }}
                      onClick={() => setShowColumnMenu(!showColumnMenu)}
                      title={currentLanguage === "vi" ? "Ẩn/Hiện cột" : "Toggle Columns"}
                    >
                      <LayoutGrid size={20} color="#4b5563" />
                    </button>
                    {showColumnMenu && (
                      <div className="position-absolute bg-white shadow rounded border p-2" style={{ top: "100%", right: 0, zIndex: 1000, width: "280px", maxHeight: "400px", overflowY: "auto" }}>
                        <div className="fw-bold mb-2 px-1" style={{fontSize: '14px'}}>
                          {currentLanguage === "vi" ? "Cấu hình cột:" : "Column Configuration:"}
                        </div>
                        {initialColumnKeys.map((col) => {
                          if (col.key === "nguoiPhuTrach" && !currentUser?.is_admin) return null;
                          return (
                            <div key={col.key} className="d-flex justify-content-between align-items-center px-1 py-1 m-1">
                              <div className="form-check">
                                <input className="form-check-input" type="checkbox" id={`col-${col.key}`} checked={visibleColumns[col.key]} onChange={() => toggleColumn(col.key)} style={{ cursor: "pointer", marginLeft: "0" }} />
                                <label className="form-check-label ms-2" htmlFor={`col-${col.key}`} style={{ cursor: "pointer", fontSize: "13px", userSelect: "none" }}>{col.label}</label>
                              </div>
                             
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="table-wrapper mt-3" style={{marginLeft:40}}>
              <div className="table-responsive" style={{ paddingLeft: "0px", position: "relative", maxHeight: "calc(100vh - 300px)", overflow: "auto" }} ref={tableContainerRef}>
                <table className="table table-bordered table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      {tableHeaders.map((header, i) => {
                        const availableKeys = initialColumnKeys.filter(k => {
                            if (k.key === 'nguoiPhuTrach' && !currentUser?.is_admin) return false;
                            if (k.key === 'invoiceUrl' && !canViewFinance) return false;
                            return true;
                        });
                        const currentKey = availableKeys[i]?.key;
                        const allowedPinKeys = ["id", "hoTen", "maVung", "sdt", "email", "noiDung"];
                        if (currentKey && !isVisible(currentKey)) return null;
                       
                        return (
                          <th key={i} className={isPinned(currentKey) ? "sticky-col" : ""}
                            style={{ 
                                position: isPinned(currentKey) ? "sticky" : "relative", 
                                left: isPinned(currentKey) ? "0" : "auto", 
                                zIndex: isPinned(currentKey) ? 10 : 1, 
                                backgroundColor: isPinned(currentKey) ? "#ffffff" : "#fff", 
                                borderRight: isPinned(currentKey) ? "2px solid #2563eb" : "1px solid #dee2e6",
                                textAlign: "center",
                                verticalAlign: "middle"
                            }}
                          >
                            <div className="d-flex justify-content-center align-items-center position-relative w-100" style={{ minHeight: "24px", paddingRight: "28px" }}>
                              <span>{header}</span>
                              {allowedPinKeys.includes(currentKey) && (
                              <button 
                                className={`btn btn-sm d-flex align-items-center justify-content-center text-white ${isPinned(currentKey) ? "btn-danger" : ""}`} 
                                style={{ 
                                    width: 24, 
                                    height: 24, 
                                    padding: 0, 
                                    borderRadius: "3px", 
                                    position: "absolute", 
                                    right: "2px", 
                                    top: "50%",
                                    transform: "translateY(-50%)"
                                }} 
                                onClick={() => togglePinColumn(currentKey)}
                              >
                              {isPinned(currentKey) ? (<PinOff size={12} color="#ffffff" />) : (<Pin size={12} color="#ffffff" />)}
                              </button>
                              )}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.length > 0 ? (
                      filteredData.map((item) => (
                        <RowItem
                          key={item.YeuCauID}
                          item={item}
                          currentUser={currentUser}
                          onEdit={handleEditClick}
                          onDelete={handleDelete}
                          currentLanguage={currentLanguage}
                          visibleColumns={visibleColumns}
                          pinnedColumns={pinnedColumns}
                        />
                      ))
                    ) : (
                      <tr>
                        <td colSpan={tableHeaders.length} className="text-center py-4 text-muted">
                          {currentLanguage === "vi" ? "Không có dữ liệu" : "No data available"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="d-flex justify-content-between align-items-center px-3 py-2 border-top bg-white" style={{ marginTop: "0", borderTop: "1px solid #dee2e6" }}>
                <div className="text-muted small">
                  {currentLanguage === "vi" ? `Hiển thị ${filteredData.length} / ${itemsPerPage} hàng (trang ${currentPage}/${totalPages})` : `Showing ${filteredData.length} / ${itemsPerPage} rows (page ${currentPage}/${totalPages})`}
                </div>

                <div className="d-flex justify-content-center align-items-center">
                  <nav>
                    <ul className="pagination pagination-sm mb-0 shadow-sm">
                      <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                        <button className="page-link" onClick={() => { if (currentPage > 1) setCurrentPage((p) => p - 1); }}>&laquo;</button>
                      </li>
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((p) => p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1))
                        .map((p, idx, arr) => (
                          <React.Fragment key={p}>
                            {idx > 0 && arr[idx - 1] !== p - 1 && (<li className="page-item disabled"><span className="page-link">…</span></li>)}
                            <li className={`page-item ${currentPage === p ? "active" : ""}`}>
                              <button className="page-link" onClick={() => { if (p !== currentPage) setCurrentPage(p); }}>{p}</button>
                            </li>
                          </React.Fragment>
                        ))}
                      <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                        <button className="page-link" onClick={() => { if (currentPage < totalPages) setCurrentPage((p) => p + 1); }}>&raquo;</button>
                      </li>
                    </ul>
                  </nav>
                  <div className="ms-3 text-muted small">
                    {currentLanguage === "vi" ? `Trang ${currentPage}/${totalPages}` : `Page ${currentPage}/${totalPages}`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }
        .hover-bg-gray:hover { background-color: #ffffff; }
        .table-bordered { border: 1px solid #dee2e6 !important; }
        .table-bordered th, .table-bordered td { border: 1px solid #dee2e6 !important; }
        .table-hover tbody tr:hover { background-color: rgba(0, 0, 0, 0.04); }
        .sticky-col { position: sticky !important; left: 0; z-index: 10 !important; background-color: #ffffff !important; border-right: 2px solid #2563eb !important; }
        th.sticky-col, td.sticky-col { position: sticky !important; z-index: 5 !important; }
        th.sticky-col { z-index: 15 !important; }
        .table-responsive { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
};

export default B2CPage;