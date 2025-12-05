import React, { useState, useEffect, useRef } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import NotificationPanel from "./CMSDashboard/NotificationPanel";
import EditProfileModal from "./EditProfileModal";
import { showToast } from "../utils/toast";
import useDashboardData from "./CMSDashboard/hooks/useDashboardData";
import { LayoutGrid, Edit, Trash2, X, Pin, PinOff, PlusCircle,CheckCircle } from "lucide-react";
import Swal from "sweetalert2";
import "../styles/DashboardList.css";

import { ChevronDown, Eye, EyeOff } from "lucide-react";


const ModernSelect = ({ name, value, options, onChange, placeholder, disabled, twoColumns = false, height = "36px" }) => {
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
          width: "100%", padding: "0 10px", borderRadius: "8px", // Giảm radius cho gọn
          border: "1px solid #d1d5db", fontSize: "13px", color: "#374151", // Viền mỏng hơn
          backgroundColor: disabled ? "#F3F4F6" : "#ffffff",
          cursor: disabled ? "not-allowed" : "pointer",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          userSelect: "none", height: height, // Sử dụng height dynamic
          transition: "all 0.2s"
        }}
      >
        <span className="text-truncate" style={{ color: value ? "#374151" : "#9CA3AF" }}>{displayLabel}</span>
        <ChevronDown size={14} color="#6B7280" />
      </div>

      {isOpen && !disabled && (
        <div className="position-absolute w-100 bg-white shadow rounded border"
          style={{
            top: "100%", left: 0, marginTop: "4px", zIndex: 1000, maxHeight: "200px", overflowY: "auto",
            borderRadius: "8px", padding: "4px",
            display: twoColumns ? "grid" : "block",
            gridTemplateColumns: twoColumns ? "1fr 1fr" : "none", gap: twoColumns ? "4px" : "0"
          }}
        >
          {options.map((opt, idx) => (
            <div key={idx} onClick={() => handleSelect(opt.value)}
              className={`px-2 py-2 transition-all ${twoColumns ? 'rounded' : 'rounded'}`}
              style={{
                cursor: "pointer", fontSize: "12px",
                color: String(opt.value) === String(value) ? "#2563eb" : "#374151",
                backgroundColor: String(opt.value) === String(value) ? "#EFF6FF" : "transparent",
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

  const translations = {
    vi: {
      title: isNew ? "Đăng ký dịch vụ mới (B2C)" : `Cập nhật yêu cầu #${request?.YeuCauID || ""}`,
      subtitle: "Nhập thông tin khách hàng và dịch vụ",
      customer: "Khách Hàng", areaCode: "Mã", phone: "Số Điện Thoại", email: "Email",
      serviceType: "Loại Dịch Vụ", // Label cho Dropdown danh mục
      serviceName: "Tên Dịch Vụ",  // Label cho Input nhập tên cụ thể
      package: "Gói Dịch Vụ", form: "Kênh Liên Hệ", branch: "Cơ Sở Tư Vấn",
      appointmentDate: "Ngày Hẹn", appointmentTime: "Giờ Hẹn", content: "Nội Dung",
      note: "Ghi Chú", assignee: "Người Phụ Trách", status: "Trạng thái",
      confirmPassword: "Mật khẩu xác nhận", passwordHelper: "Mật khẩu của bạn",
      save: isNew ? "Đăng ký dịch vụ mới" : "Lưu thay đổi", processing: "Đang xử lý...",
      selectServiceType: "Chọn Loại Dịch Vụ", 
      enterServiceName: "Nhập Tên Dịch Vụ Cụ Thể",
      selectPackage: "Chọn Gói Dịch Vụ",
      selectForm: "Chọn Hình Thức", selectBranch: "Chọn Cơ Sở", selectAssignee: "Chọn nhân viên",
      enterName: "Nhập Tên Khách Hàng", enterPhone: "Nhập Số Điện Thoại", enterEmail: "Nhập Email",
      selectNguoiPT: "Chọn Người Phụ Trách",
      enterContent: "Nhập Nội Dung",
      enterNote: "Nhập Ghi Chú"
    },
    en: {
      title: isNew ? "Register New Service (B2C)" : `Update Request #${request?.YeuCauID || ""}`,
      subtitle: "Enter customer and service information",
      customer: "Customer", areaCode: "Code", phone: "Phone Number", email: "Email",
      serviceType: "Service Type",
      serviceName: "Service Name",
      package: "Package", form: "Contact Channel", branch: "Branch",
      appointmentDate: "Date", appointmentTime: "Time", content: "Content",
      note: "Note", assignee: "Assignee", status: "Status",
      confirmPassword: "Confirm Password", passwordHelper: "Your password",
      save: isNew ? "Register New Service" : "Save Changes", processing: "Processing...",
      selectServiceType: "Select Service Type", 
      enterServiceName: "Enter Specific Service Name",
      selectPackage: "Select Service Package",
      selectForm: "Select Form", selectBranch: "Select Branch", selectAssignee: "Select Staff",
      enterName: "Customer Name", enterPhone: "Enter Phone Number", enterEmail: "Enter Email",
      selectNguoiPT: "Select Assignee", 
      enterContent: "Enter Content",
      enterNote: "Enter Note"
    }
  };
  const t = translations[currentLanguage === "vi" ? "vi" : "en"];

  const [formData, setFormData] = useState(
    isNew
      ? {
          HoTen: "", MaVung: "+84", SoDienThoai: "", Email: "",
          NoiDung: "", GhiChu: "", TenHinhThuc: "",
          CoSoTuVan: "", Gio: "", ChonNgay: "",
          LoaiDichVu: "", // Cột cũ (Dropdown danh mục)
          TenDichVu: "",  // Cột mới (Input text)
          MaHoSo: "", NguoiPhuTrachId: "",
          TrangThai: "Tư vấn", GoiDichVu: "",
          Invoice: "No", InvoiceUrl: "", ConfirmPassword: "" 
        }
      : { 
          ...request,
          MaVung: request.MaVung || "+84",
          TenHinhThuc: request.TenHinhThuc || "Trực tiếp",
          CoSoTuVan: request.CoSoTuVan || "Seoul",
          GoiDichVu: request.GoiDichVu || "Thông thường",
          Invoice: request.Invoice || "No",
          MaHoSo: request.MaHoSo || "",
          TrangThai: request.TrangThai || "Tư vấn",
          LoaiDichVu: request.LoaiDichVu || "", 
          TenDichVu: request.TenDichVu || ""  
        }
  );

  // STYLE CHUNG
  const inputHeight = "38px"; 
  const labelStyle = { fontSize: "11px", fontWeight: "600", color: "#4B5563", marginBottom: "4px", display: "block" };
  const inputStyle = {
    width: "100%", height: inputHeight, padding: "0 10px", borderRadius: "6px",
    border: "1px solid #d1d5db", fontSize: "13px", color: "#111827",
    backgroundColor: "#ffffff", outline: "none", transition: "border-color 0.2s"
  };

  // --- DATA ---
  const areaCodes = [{ value: "+82", label: "+82" }, { value: "+84", label: "+84" }];
  
  // Danh sách này bây giờ là LOẠI DỊCH VỤ
  const serviceTypeList = currentLanguage === "vi" ? [
    "Chứng thực", "Kết hôn", "Khai sinh, khai tử", "Xuất nhập cảnh",
    "Giấy tờ tuỳ thân", "Nhận nuôi", "Thị thực", "Tư vấn pháp lý", "Dịch vụ B2B", "Khác"
  ] : [
    "Certification", "Marriage", "Birth/Death Registration", "Immigration",
    "ID Documents", "Adoption", "Visa", "Legal Consultation", "B2B Service", "Other"
  ];
  
  const serviceTypeMapping = { "Certification": "Chứng thực", "Marriage": "Kết hôn", "Birth/Death Registration": "Khai sinh, khai tử", "Immigration": "Xuất nhập cảnh", "ID Documents": "Giấy tờ tuỳ thân", "Adoption": "Nhận nuôi", "Visa": "Thị thực", "Legal Consultation": "Tư vấn pháp lý", "B2B Service": "Dịch vụ B2B", "Other": "Khác" };
  const reverseServiceTypeMapping = Object.fromEntries(Object.entries(serviceTypeMapping).map(([en, vi]) => [vi, en]));
  
  const formOptions = currentLanguage === "vi" ? ["Messenger","Kakao Talk", "Zalo","Naver Talk", "Email", "Gọi điện","Trực tiếp"] : ["Messenger","Kakao Talk", "Zalo","Naver Talk", "Email", "Phone", "Direct"];
  const formMapping = { "Direct": "Trực tiếp", "Online": "Online", "Email": "Email", "Phone": "Gọi điện" };
  const branchOptions = [{ value: "Seoul", label: "Seoul" }, { value: "Busan", label: "Busan" }];
  const statusOptions = currentLanguage === "vi" ? ["Tư vấn", "Đang xử lý", "Đang nộp hồ sơ", "Hoàn thành"] : ["Consultation", "Processing", "Submitting Documents", "Completed"];
  const statusMapping = { "Consultation": "Tư vấn", "Processing": "Đang xử lý", "Submitting Documents": "Đang nộp hồ sơ", "Completed": "Hoàn thành" };
  const packageOptions = currentLanguage === "vi" ? [{ value: "Thông thường", label: "Thông thường" }, { value: "Cấp tốc", label: "Cấp tốc" }] : [{ value: "Thông thường", label: "Standard" }, { value: "Cấp tốc", label: "Express" }];

  const handleInputChange = (eOrName, value) => {
    let name, val;
    if (typeof eOrName === 'string') { name = eOrName; val = value; } 
    else { name = eOrName.target.name; val = eOrName.target.value; }

    let valueToSave = val;
    // Map Loại Dịch Vụ
    if (name === "LoaiDichVu" && currentLanguage === "en") valueToSave = serviceTypeMapping[val] || val;
    if (name === "TenHinhThuc" && currentLanguage === "en") valueToSave = formMapping[val] || val;
    if (name === "TrangThai" && currentLanguage === "en") valueToSave = statusMapping[val] || val;

    setFormData((prev) => ({ ...prev, [name]: valueToSave }));
  };

  const formatTimeForInput = (val) => {
    if (!val) return "";
    if (val.includes("T")) {
      const date = new Date(val);
      if (isNaN(date.getTime())) return "";
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }
    return val.substring(0, 5);
  };

  const handleSave = async () => {
    if (!formData.HoTen || !formData.SoDienThoai) {
        showToast(currentLanguage === "vi" ? "Thiếu tên hoặc SĐT" : "Missing Name/Phone", "warning");
        return;
    }
    if (isNew) {
      if (!formData.ConfirmPassword) {
        showToast(currentLanguage === "vi" ? "Nhập mật khẩu xác nhận!" : "Enter password!", "warning");
        return;
      }
      try {
        setLoading(true);
        const verifyRes = await fetch(`https://onepasscms-backend.onrender.com/api/login`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: currentUser.username, password: formData.ConfirmPassword })
        });
        const verifyJson = await verifyRes.json();
        if (!verifyJson.success) {
          setLoading(false);
          showToast(currentLanguage === "vi" ? "Sai mật khẩu!" : "Wrong password!", "error");
          return;
        }
      } catch (err) { setLoading(false); return; }
    }
    const payload = { ...formData };
    delete payload.ConfirmPassword;
    setLoading(true);
    await onSave(payload);
    setLoading(false);
  };

  const getDisplayValue = (field, vietnameseValue) => {
    if (currentLanguage === "vi") return vietnameseValue;
    if (field === "LoaiDichVu") return reverseServiceTypeMapping[vietnameseValue] || vietnameseValue; // Map loại
    if (field === "TenHinhThuc") return Object.keys(formMapping).find(key => formMapping[key] === vietnameseValue) || vietnameseValue;
    if (field === "TrangThai") return Object.keys(statusMapping).find(key => statusMapping[key] === vietnameseValue) || vietnameseValue;
    if (field === "GoiDichVu") return vietnameseValue === "Thông thường" ? "Standard" : vietnameseValue === "Cấp tốc" ? "Express" : vietnameseValue;
    return vietnameseValue;
  };

  return (
    <div className="modal-overlay" style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050, backdropFilter: "blur(3px)",
      display: "flex", justifyContent: "center", alignItems: "center"
    }}>
      <div className="bg-white p-4 position-relative" 
          style={{ 
            width: "800px",
            maxWidth: "95%", 
            borderRadius: "12px", 
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" 
          }}
      >
        <button onClick={onClose} className="position-absolute d-flex align-items-center justify-content-center border-0 bg-light rounded-circle"
            style={{ top: "12px", right: "12px", width: "30px", height: "30px", cursor: "pointer", zIndex: 10 }}>
            <X size={16} />
        </button>

        <div className="text-center mb-4">
          <h3 className="fw-bold m-0" style={{ fontSize: "20px", color: "#111827" }}>{t.title}</h3>
          <p className="text-muted m-0 mt-1" style={{ fontSize: "13px" }}>{t.subtitle}</p>
        </div>

        {/* LAYOUT 3-3-2-2 */}
        <div className="row g-3">
          
          {/* --- HÀNG 1 (3 Cột): Tên | SĐT (có mã vùng gọn) | Email --- */}
          <div className="col-md-4">
            <label style={labelStyle}>{t.customer} <span className="text-danger">*</span></label>
            <input type="text" name="HoTen" style={inputStyle} value={formData.HoTen} onChange={handleInputChange} placeholder={t.enterName} />
          </div>

          <div className="col-md-4">
            <label style={labelStyle}>{t.phone} <span className="text-danger">*</span></label>
            <div className="d-flex">
              <select 
                name="MaVung" 
                value={formData.MaVung} 
                onChange={handleInputChange} 
                style={{
                  ...inputStyle, width: "70px", borderTopRightRadius: 0, borderBottomRightRadius: 0,
                  padding: "0 5px", textAlign: "center", backgroundColor: "#f9fafb", cursor: "pointer", appearance: "auto"
                }}
              >
                {areaCodes.map(c => <option key={c.value} value={c.value}>{c.value}</option>)}
              </select>
              <input type="text" name="SoDienThoai" style={{ ...inputStyle, flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderLeft: "none" }} 
                value={formData.SoDienThoai} onChange={handleInputChange} placeholder={t.enterPhone} 
              />
            </div>
          </div>

          <div className="col-md-4">
            <label style={labelStyle}>{t.email}</label>
            <input type="email" name="Email" style={inputStyle} value={formData.Email} onChange={handleInputChange} placeholder={t.enterEmail} />
          </div>

          {/* --- HÀNG 2 (3 Cột): LOẠI DỊCH VỤ (Dropdown) | TÊN DỊCH VỤ (Input) | Gói --- */}
          <div className="col-md-4">
            <label style={labelStyle}>{t.serviceType} <span className="text-danger">*</span></label>
            {/* Sử dụng LoaiDichVu cho Dropdown danh mục */}
            <ModernSelect 
                name="LoaiDichVu" 
                height={inputHeight} 
                value={getDisplayValue("LoaiDichVu", formData.LoaiDichVu)} 
                placeholder={t.selectServiceType} 
                options={serviceTypeList.map(s => ({ value: s, label: s }))} 
                onChange={handleInputChange} 
            />
          </div>

          <div className="col-md-4">
            <label style={labelStyle}>{t.serviceName}</label>
            {/* Sử dụng TenDichVu cho Input nhập tên cụ thể */}
             <input type="text" name="TenDichVu" style={inputStyle} value={formData.TenDichVu} onChange={handleInputChange} placeholder={t.enterServiceName} />
          </div>

          <div className="col-md-4">
            <label style={labelStyle}>{t.package}</label>
            <ModernSelect name="GoiDichVu" height={inputHeight} value={getDisplayValue("GoiDichVu", formData.GoiDichVu)} placeholder={t.selectPackage} options={packageOptions} onChange={handleInputChange} />
          </div>

          {/* --- HÀNG 3 (3 Cột): Hình thức | Cơ sở | Người phụ trách/Trạng thái --- */}
          <div className="col-md-4">
            <label style={labelStyle}>{t.form}</label>
            <ModernSelect name="TenHinhThuc" height={inputHeight} value={getDisplayValue("TenHinhThuc", formData.TenHinhThuc)} placeholder={t.selectForm} options={formOptions.map(v => ({ value: v, label: v }))} onChange={handleInputChange} />
          </div>

          <div className="col-md-4">
            <label style={labelStyle}>{t.branch}</label>
            <ModernSelect name="CoSoTuVan" height={inputHeight} value={formData.CoSoTuVan} placeholder={t.selectBranch} options={branchOptions} onChange={handleInputChange} />
          </div>
          <div className="col-md-4">
             {currentUser?.is_admin ? (
                <>
                <label style={labelStyle}>{t.assignee}</label>
                <ModernSelect name="NguoiPhuTrachId" height={inputHeight} value={formData.NguoiPhuTrachId} placeholder={t.selectNguoiPT} options={users.map(u => ({ value: String(u.id), label: u.name }))} onChange={handleInputChange} />
                </>
             ) : (
                <>
                 <label style={labelStyle}>{t.status}</label>
                 <div style={{...inputStyle, backgroundColor: "#f3f4f6", display: "flex", alignItems: "center", color: "#6b7280"}}>{formData.TrangThai}</div>
                </>
             )}
          </div>

          {/* --- HÀNG 4 (2 Cột): Ngày hẹn | Giờ hẹn --- */}
          <div className="col-md-6">
            <label style={labelStyle}>{t.appointmentDate}</label>
            <input type="date" name="ChonNgay" style={inputStyle} value={formData.ChonNgay ? new Date(formData.ChonNgay).toISOString().split("T")[0] : ""} onChange={handleInputChange} />
          </div>
          <div className="col-md-6">
            <label style={labelStyle}>{t.appointmentTime}</label>
            <input type="time" name="Gio" style={inputStyle} value={formatTimeForInput(formData.Gio)} onChange={handleInputChange} />
          </div>

          {/* --- CÁC PHẦN DƯỚI (Full Width) --- */}
          <div className="col-12">
            <label style={labelStyle}>{t.content}</label>
            <textarea rows={2} type="text" name="NoiDung" style={inputStyle} value={formData.NoiDung} onChange={handleInputChange} placeholder={t.enterContent} />
          </div>

          <div className="col-12">
            <label style={labelStyle}>{t.note}</label>
            <textarea 
              rows={2}
              type="text" 
              name="GhiChu" 
              style={inputStyle} 
              value={formData.GhiChu} 
              onChange={handleInputChange} 
              placeholder={t.enterNote} 
            />
          </div>

          {/* FOOTER */}
          <div className="col-12 mt-2">
            {isNew ? (
                <div className="d-flex flex-column gap-3">
                    <div>
                        <label style={labelStyle}>{t.confirmPassword} <span className="text-danger">*</span></label>
                        <div className="position-relative">
                            <input 
                            type={showConfirmPassword ? "text" : "password"} 
                            placeholder="******" 
                            value={formData.ConfirmPassword}
                            onChange={handleInputChange}
                            name="ConfirmPassword"
                            style={inputStyle}
                            />
                            <span className="position-absolute top-50 translate-middle-y end-0 me-2 cursor-pointer" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                            {showConfirmPassword ? <EyeOff size={14}/> : <Eye size={14}/>}
                            </span>
                        </div>
                    </div>
                    <div>
                        <button className="btn fw-bold w-100 shadow-sm" onClick={handleSave} disabled={loading}
                        style={{ backgroundColor: "#10b981", color: "white", height: "42px", borderRadius: "6px", fontSize: "14px" }}>
                        {loading ? <span className="spinner-border spinner-border-sm"></span> : t.save}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="col-12">
                    <button className="btn fw-bold w-100 shadow-sm" onClick={handleSave} disabled={loading}
                    style={{ backgroundColor: "#2563eb", color: "white", height: "42px", borderRadius: "6px", textTransform: "uppercase" }}>
                    {loading ? <span className="spinner-border spinner-border-sm"></span> : t.save}
                    </button>
                </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};


const RowItem = ({
  item,
  currentUser,
  onEdit,
  onDelete,
  onApprove,
  currentLanguage,
  visibleColumns,
  pinnedColumns,
}) => {
  const canApprove = currentUser?.is_director || currentUser?.perm_approve_b2c;
  const canViewFinance = currentUser?.is_accountant || currentUser?.is_director;
  const hasServiceCode = item.MaHoSo && item.MaHoSo.length > 5;
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


  const displayMaHoSo = item.MaHoSo && item.MaHoSo.length > 5 ? item.MaHoSo : "";
  
  const isVisible = (key) => (visibleColumns ? visibleColumns[key] : true);
  const isPinned = (key) => pinnedColumns.includes(key);

  const formatNumber = (value) => (!value ? "0" : value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."));
  const unformatNumber = (value) => (value ? value.toString().replace(/\./g, "") : "");
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
    {isVisible("loaiDichVu") && (
        <td style={{ maxWidth: "150px" }} className={`text-center text-truncate ${isPinned("loaiDichVu") ? "sticky-col" : ""}`} title={translateService(item.LoaiDichVu)}>
          {translateService(item.LoaiDichVu)}
        </td>
      )}
      {/* Cột 2: Tên Dịch Vụ (Cột mới, hiển thị text từ TenDichVu) */}
      {isVisible("tenDichVu") && (
        <td className={`text-center ${isPinned("tenDichVu") ? "sticky-col" : ""}`}>
          {item.TenDichVu || ""}
        </td>
      )}
      {isVisible("maDichVu") && (
        <td className={`text-center border-target ${isPinned("maDichVu") ? "sticky-col" : ""}`}>
          {displayMaHoSo}
        </td>
      )}
     {currentUser?.is_admin && isVisible("nguoiPhuTrach") && (
        <td className={isPinned("nguoiPhuTrach") ? "sticky-col" : ""}>
          {/* SỬA THÀNH: item.NguoiPhuTrach?.name */}
          {item.NguoiPhuTrach?.name || <span className="text-muted fst-italic"></span>}
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
      
      {canViewFinance && isVisible("doanhThuTruoc") && (
        <td className="text-center">{formatNumber(item.DoanhThuTruocChietKhau)}</td>
      )}
      {canViewFinance && isVisible("mucChietKhau") && (
        <td className="text-center">{item.MucChietKhau ? `${item.MucChietKhau}%` : "-"}</td>
      )}
      {canViewFinance && isVisible("soTienChietKhau") && (
        <td className="text-center">{formatNumber(item.SoTienChietKhau)}</td>
      )}
      {canViewFinance && isVisible("doanhThuSau") && (
         <td className="text-center fw-bold text-primary">{formatNumber(item.DoanhThuSauChietKhau)}</td>
      )}
      {isVisible("hanhDong") && (
        <td className={`text-center ${isPinned("hanhDong") ? "sticky-col" : ""}`}>
          <div className="d-flex justify-content-center align-items-center gap-2">
            
          
            {!hasServiceCode && canApprove && (
              <button 
                className="btn btn-sm btn-success d-flex align-items-center justify-content-center" 
                style={{ width: 32, height: 32, backgroundColor: "#10b981", borderColor: "#10b981" }} 
                onClick={() => onApprove(item)} 
                title={currentLanguage === "vi" ? "Duyệt & Cấp mã" : "Approve"}
              >
                <CheckCircle size={16} />
              </button>
            )}

          
            {(hasServiceCode || !canApprove) && (
                <button 
                    className="btn btn-sm btn-primary d-flex align-items-center justify-content-center" 
                    style={{ width: 32, height: 32 }} 
                    onClick={() => onEdit(item)} 
                    title={currentLanguage === "vi" ? "Sửa thông tin" : "Edit"}
                >
                <Edit size={16} />
                </button>
            )}

            {/* NÚT XÓA (LUÔN HIỆN) */}
            <button 
                className="btn btn-sm btn-danger d-flex align-items-center justify-content-center" 
                style={{ width: 32, height: 32 }} 
                onClick={handleDeleteClick} 
                title={currentLanguage === "vi" ? "Xóa" : "Delete"}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </td>
      )}
    </tr>
  );
};

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
  const [approveModalItem, setApproveModalItem] = useState(null);
  const formatNumber = (value) => (!value ? "0" : value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."));
  const unformatNumber = (value) => (value ? value.toString().replace(/\./g, "") : "");
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
    { key: "loaiDichVu", label: "Loại Dịch Vụ" },
    { key: "tenDichVu", label: "Tên Dịch Vụ" },
    { key: "dichVu", label: "Dịch vụ" },
 
    { key: "maDichVu", label: "Mã Dịch Vụ" },
    ...(currentUser?.is_admin ? [{ key: "nguoiPhuTrach", label: "Người phụ trách" }] : []),
    { key: "ngayHen", label: "Ngày hẹn" },
    { key: "trangThai", label: "Trạng thái" },
    { key: "goiDichVu", label: "Gói Dịch Vụ" },
    { key: "invoice", label: "Invoice Y/N" },
    ...(canViewFinance ? [{ key: "invoiceUrl", label: "Invoice" }] : []),
...(canViewFinance ? [
  { key: "doanhThuTruoc", label: (<span>Doanh Thu<br/>Trước CK</span>) },
  { key: "mucChietKhau", label: (<span>%<br/>CK</span>) },
  { key: "soTienChietKhau", label: (<span>Tiền<br/>Chiết Khấu</span>) },
  { key: "doanhThuSau", label: (<span>Doanh Thu<br/>Sau CK</span>) },
] : []),

    { key: "hanhDong", label: "Hành động" },
  ];
const handleApproveClick = (item) => {
    
    const canApprove = currentUser?.is_director || currentUser?.perm_approve_b2c;
    if (!canApprove) return showToast("Không có quyền duyệt", "error");
    
  
    setApproveModalItem(item);
  };


 const handleConfirmApprove = async (id, fullFormData) => {
    try {
        const res = await fetch(`https://onepasscms-backend.onrender.com/api/yeucau/approve/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                userId: currentUser.id,
                ...fullFormData // Gửi tất cả thông tin form + tài chính
            }),
        });
        const json = await res.json();
        
        if (json.success) {
            showToast("Duyệt hồ sơ thành công!", "success");
            setApproveModalItem(null); 
            fetchData(); // Load lại bảng để thấy trạng thái mới
        } else {
            showToast(json.message || "Lỗi khi duyệt", "error");
        }
    } catch (err) {
        showToast("Lỗi kết nối server", "error");
    }
  };
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
    "Hình thức", "Cơ sở", "Giờ", "Ngày tạo", "Loại Dịch Vụ", "Tên Dịch Vụ", "Mã Dịch Vụ",
    ...(currentUser?.is_admin ? ["Người phụ trách"] : []),
    "Ngày hẹn", "Trạng thái", "Gói Dịch Vụ", "Invoice Y/N",
    ...(canViewFinance ? ["Invoice"] : []),
    
    // --- SỬA ĐOẠN NÀY: Dùng thẻ <div> để xuống dòng ---
    ...(canViewFinance ? [
       <div key="dt" className="d-flex flex-column align-items-center">
          <span>Doanh Thu</span>
          <span>Trước Chiết Khấu</span>
       </div>,
       
       "Chiết khấu %",
       
       <div key="tck" className="d-flex flex-column align-items-center">
          <span>Số Tiền</span>
          <span>Chiết Khấu</span>
       </div>,
       
       <div key="dts" className="d-flex flex-column align-items-center">
          <span>Doanh Thu</span>
          <span>Sau Chiết Khấu</span>
       </div>
    ] : []),
    // --------------------------------------------------
    
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
      if (currentUser?.is_admin || currentUser?.is_director||currentUser?.is_accountant) { 
          url += `&is_admin=true`; 
      } else { 
          url += `&userId=${currentUser?.id}`; 
      }
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
const handleApprove = async (id) => {
    // Kiểm tra quyền trên giao diện trước khi gọi
    const canApprove = currentUser?.is_director || currentUser?.perm_approve_b2c;
    if (!canApprove) {
      showToast(currentLanguage === "vi" ? "Bạn không có quyền duyệt!" : "No permission", "error");
      return;
    }

    Swal.fire({
      title: currentLanguage === "vi" ? "Duyệt hồ sơ này?" : "Approve this request?",
      text: currentLanguage === "vi" ? "Hệ thống sẽ sinh mã hồ sơ và chuyển trạng thái sang Đang xử lý." : "Generate code and update status to Processing.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981", // Màu xanh lá
      cancelButtonColor: "#6b7280",
      confirmButtonText: currentLanguage === "vi" ? "Duyệt ngay" : "Approve",
      cancelButtonText: currentLanguage === "vi" ? "Hủy" : "Cancel",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`http://localhost:5000/api/yeucau/approve/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: currentUser.id }),
          });
          const json = await res.json();
          if (json.success) {
            showToast(currentLanguage === "vi" ? "Đã duyệt thành công!" : "Approved successfully!", "success");
            fetchData(); // Tải lại dữ liệu
          } else {
            showToast(json.message || "Lỗi khi duyệt", "error");
          }
        } catch (err) {
          showToast("Lỗi kết nối", "error");
        }
      }
    });
  };
  const ApproveModal = ({ request, onClose, onConfirm, currentLanguage }) => {
    // 1. Khởi tạo State (Tự động điền từ request)
    const [formData, setFormData] = useState({
      // --- Thông tin khách hàng & Dịch vụ ---
      HoTen: request.HoTen || "",
      MaVung: request.MaVung || "",
      SoDienThoai: request.SoDienThoai || "",
      Email: request.Email || "",
      LoaiDichVu: request.LoaiDichVu || "",
      TenDichVu: request.TenDichVu || "",
      GoiDichVu: request.GoiDichVu || "",
      TenHinhThuc: request.TenHinhThuc || "",
      CoSoTuVan: request.CoSoTuVan || "",
      // Format ngày giờ
      ChonNgay: request.ChonNgay ? new Date(request.ChonNgay).toISOString().split("T")[0] : "",
      Gio: request.Gio ? (request.Gio.includes("T") ? new Date(request.Gio).toTimeString().substring(0,5) : request.Gio.substring(0,5)) : "",
      NoiDung: request.NoiDung || "",
      GhiChu: request.GhiChu || "",
      
      // --- Thông tin Tài chính ---
      DoanhThuTruocChietKhau: request.DoanhThuTruocChietKhau || 0,
      MucChietKhau: request.MucChietKhau || 0,
      Vi: request.Vi || 0
    });

    // Tính toán tài chính real-time
    const calculateFinance = () => {
      const dt = parseFloat(String(formData.DoanhThuTruocChietKhau).replace(/\./g, "")) || 0;
      const ck = parseFloat(formData.MucChietKhau) || 0;
      const vi = parseFloat(String(formData.Vi).replace(/\./g, "")) || 0;
      
      const tienCK = Math.round((dt * ck) / 100);
      const thucThu = Math.max(0, dt - tienCK - vi);
      return { dt, tienCK, thucThu, vi };
    };

    const { dt, tienCK, thucThu, vi } = calculateFinance();

    const handleChange = (eOrName, value) => {
      let name, val;
      if (typeof eOrName === 'string') { name = eOrName; val = value; } 
      else { name = eOrName.target.name; val = eOrName.target.value; }

      if (name === "DoanhThuTruocChietKhau" || name === "Vi") {
          const raw = val.toString().replace(/\./g, "");
          if (!isNaN(raw)) setFormData(prev => ({ ...prev, [name]: raw }));
      } else {
          setFormData(prev => ({ ...prev, [name]: val }));
      }
    };

    const handleSave = () => {
      onConfirm(request.YeuCauID, formData);
    };

    // --- STYLE TỐI ƯU (COMPACT) ---
    const formatNumber = (num) => num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "0";
    const inputHeight = "32px"; // Giảm chiều cao từ 42px xuống 32px
    const labelStyle = { fontSize: "11px", fontWeight: "600", color: "#4B5563", marginBottom: "2px", display: "block" }; // Font nhỏ hơn, margin ít hơn
    const inputStyle = { width: "100%", height: inputHeight, padding: "0 8px", borderRadius: "6px", border: "1px solid #D1D5DB", fontSize: "13px", outline: "none", color: "#111827", transition: "border-color 0.2s" };

    // Data Options
    const serviceTypeList = ["Chứng thực", "Kết hôn", "Khai sinh, khai tử", "Xuất nhập cảnh", "Giấy tờ tuỳ thân", "Nhận nuôi", "Thị thực", "Tư vấn pháp lý", "Dịch vụ B2B", "Khác"];
    const packageOptions = [{ value: "Thông thường", label: "Thông thường" }, { value: "Cấp tốc", label: "Cấp tốc" }];
    const branchOptions = [{ value: "Seoul", label: "Seoul" }, { value: "Busan", label: "Busan" }];
    const formOptions = ["Trực tiếp", "Online", "Email", "Gọi điện", "Messenger", "Kakao Talk", "Zalo"];
    const areaCodes = [{ value: "+82", label: "+82" }, { value: "+84", label: "+84" }];

    return (
      <div className="modal-overlay" style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1100, backdropFilter: "blur(2px)", // Blur nhẹ hơn
        display: "flex", justifyContent: "center", alignItems: "center"
      }}>
        <div className="bg-white position-relative d-flex flex-column" 
            style={{ width: "950px", maxWidth: "95%", maxHeight: "98vh", borderRadius: "12px", boxShadow: "0 15px 30px rgba(0, 0, 0, 0.2)" }}>
          
          {/* HEADER */}
          <div className="d-flex justify-content-between align-items-center px-4 py-2 border-bottom">
              <div>
                  <h5 className="fw-bold m-0 text-primary" style={{ fontSize: "18px" }}>
                      {currentLanguage === "vi" ? "Duyệt Hồ Sơ (B2C)" : "Approve Request (B2C)"}
                  </h5>
                  <small className="text-muted" style={{ fontSize: "12px" }}>
                      {currentLanguage === "vi" ? "Kiểm tra thông tin & nhập doanh thu" : "Verify info & enter revenue"}
                  </small>
              </div>
              <button onClick={onClose} className="border-0 bg-light rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: "30px", height: "30px", cursor: "pointer" }}>
                  <X size={18} color="#6B7280" />
              </button>
          </div>

          {/* BODY - Giảm padding xuống px-3 py-2 */}
          <div className="px-4 py-3 overflow-auto custom-scrollbar" style={{ flex: 1 }}>
              
              {/* === PHẦN 1: FORM THÔNG TIN (Sử dụng g-2 để thu hẹp khoảng cách) === */}
              <div className="row g-2 mb-2">
                  {/* Hàng 1 */}
                  <div className="col-md-4">
                      <label style={labelStyle}>Khách Hàng <span className="text-danger">*</span></label>
                      <input type="text" name="HoTen" style={inputStyle} value={formData.HoTen} onChange={handleChange} placeholder="Tên khách hàng" />
                  </div>
                  <div className="col-md-4">
                      <label style={labelStyle}>Số Điện Thoại <span className="text-danger">*</span></label>
                      <div className="d-flex">
                          <select 
                              name="MaVung" 
                              value={formData.MaVung} 
                              onChange={handleChange} 
                              style={{...inputStyle, width: "70px", borderRadius: "6px 0 0 6px", borderRight: "none", backgroundColor: "#F9FAFB", cursor: "pointer"}}
                          >
                              {areaCodes.map(c => <option key={c.value} value={c.value}>{c.value}</option>)}
                          </select>
                          <input type="text" name="SoDienThoai" style={{...inputStyle, borderRadius: "0 6px 6px 0"}} value={formData.SoDienThoai} onChange={handleChange} placeholder="SĐT" />
                      </div>
                  </div>
                  <div className="col-md-4">
                      <label style={labelStyle}>Email</label>
                      <input type="text" name="Email" style={inputStyle} value={formData.Email} onChange={handleChange} placeholder="Email" />
                  </div>

                  {/* Hàng 2 */}
                  <div className="col-md-4">
                      <label style={labelStyle}>Loại Dịch Vụ <span className="text-danger">*</span></label>
                      <ModernSelect name="LoaiDichVu" height={inputHeight} value={formData.LoaiDichVu} options={serviceTypeList.map(s => ({ value: s, label: s }))} onChange={handleChange} placeholder="Chọn loại" />
                  </div>
                  <div className="col-md-4">
                      <label style={labelStyle}>Tên Dịch Vụ</label>
                      <input type="text" name="TenDichVu" style={inputStyle} value={formData.TenDichVu} onChange={handleChange} placeholder="Tên dịch vụ cụ thể" />
                  </div>
                  <div className="col-md-4">
                      <label style={labelStyle}>Gói Dịch Vụ</label>
                      <ModernSelect name="GoiDichVu" height={inputHeight} value={formData.GoiDichVu} options={packageOptions} onChange={handleChange} placeholder="Chọn gói" />
                  </div>

                  {/* Hàng 3 */}
                  <div className="col-md-4">
                      <label style={labelStyle}>Kênh Liên Hệ</label>
                      <ModernSelect name="TenHinhThuc" height={inputHeight} value={formData.TenHinhThuc} options={formOptions.map(v => ({ value: v, label: v }))} onChange={handleChange} placeholder="Chọn kênh" />
                  </div>
                  <div className="col-md-4">
                      <label style={labelStyle}>Cơ Sở Tư Vấn</label>
                      <ModernSelect name="CoSoTuVan" height={inputHeight} value={formData.CoSoTuVan} options={branchOptions} onChange={handleChange} placeholder="Chọn cơ sở" />
                  </div>
                  <div className="col-md-4">
                      <label style={labelStyle}>Trạng thái</label>
                      <div style={{...inputStyle, backgroundColor: "#F3F4F6", color: "#6B7280", display: "flex", alignItems: "center"}}>
                          Đang xử lý
                      </div>
                  </div>

                  {/* Hàng 4 */}
                  <div className="col-md-6">
                      <label style={labelStyle}>Ngày Hẹn</label>
                      <input type="date" name="ChonNgay" style={inputStyle} value={formData.ChonNgay} onChange={handleChange} />
                  </div>
                  <div className="col-md-6">
                      <label style={labelStyle}>Giờ Hẹn</label>
                      <input type="time" name="Gio" style={inputStyle} value={formData.Gio} onChange={handleChange} />
                  </div>

                  {/* Hàng 5, 6 */}
                  <div className="col-12">
                      <label style={labelStyle}>Nội Dung</label>
                      <textarea rows={1} name="NoiDung" style={{...inputStyle, height: "32px", resize:"none", paddingTop: "6px"}} value={formData.NoiDung} onChange={handleChange} placeholder="Nội dung tư vấn" />
                  </div>
                  <div className="col-12">
                      <label style={labelStyle}>Ghi Chú</label>
                      <textarea rows={1} name="GhiChu" style={{...inputStyle, height: "32px", resize:"none", paddingTop: "6px"}} value={formData.GhiChu} onChange={handleChange} placeholder="Ghi chú thêm" />
                  </div>
              </div>

              {/* === PHẦN 2: TÀI CHÍNH (Thu gọn) === */}
              <div className="mt-2 pt-2 border-top">
                  <h6 className="fw-bold text-dark mb-2" style={{fontSize: "13px"}}>THÔNG TIN TÀI CHÍNH</h6>
                  
                  <div className="row g-2 align-items-end">
                      {/* Doanh thu (Thu nhỏ lại) */}
                      <div className="col-md-4">
                          <label style={labelStyle}>Doanh thu (VNĐ) <span className="text-danger">*</span></label>
                          <div className="position-relative">
                              <input 
                                  type="text" 
                                  name="DoanhThuTruocChietKhau" 
                                  value={formatNumber(formData.DoanhThuTruocChietKhau)} 
                                  onChange={handleChange} 
                                  style={{
                                      ...inputStyle, 
                                      height: "36px", // Giảm từ 55px
                                      fontSize: "14px", // Giảm từ 18px
                                      fontWeight: "600",
                                      backgroundColor: "#F8F9FA",
                                      color: "#2563eb"
                                  }} 
                                  placeholder="0"
                              />
                          </div>
                      </div>

                      {/* Chiết khấu */}
                      <div className="col-md-3">
                          <label style={labelStyle}>Chiết khấu (%)</label>
                          <div className="position-relative">
                              <input 
                                  type="number" 
                                  name="MucChietKhau" 
                                  value={formData.MucChietKhau} 
                                  onChange={handleChange} 
                                  style={{
                                      ...inputStyle, 
                                      height: "36px", 
                                      fontSize: "14px", 
                                      backgroundColor: "#F8F9FA",
                                  }} 
                                  placeholder="0"
                              />
                          </div>
                      </div>

                      {/* Trừ ví / Cọc */}
                      <div className="col-md-5">
                          <label style={labelStyle}>Trừ Ví / Đã Cọc</label>
                          <div className="position-relative">
                              <input 
                                  type="text" 
                                  name="Vi" 
                                  value={formatNumber(formData.Vi)} 
                                  onChange={handleChange} 
                                  style={{
                                      ...inputStyle, 
                                      height: "36px", 
                                      fontSize: "14px", 
                                      backgroundColor: "#F8F9FA",
                                  }} 
                                  placeholder="0"
                              />
                          </div>
                      </div>

                      <div className="col-12">
                          <small className="text-muted fst-italic" style={{fontSize: "11px"}}>
                              * Thời gian cấp tốc sẽ được hướng dẫn qua người phụ trách.
                          </small>
                      </div>

                      {/* Tổng kết tiền (Compact) */}
                      <div className="col-12 mt-1">
                          <div className="d-flex justify-content-between align-items-center p-2 rounded" style={{backgroundColor: "#ECFDF5", border: "1px solid #10B981"}}>
                              <div className="d-flex gap-3 text-secondary" style={{fontSize: "12px"}}>
                                  <span>CK: <b>{formatNumber(tienCK)}</b></span>
                                  <span>Trừ: <b className="text-danger">-{formatNumber(vi)}</b></span>
                              </div>
                              <div className="d-flex align-items-center gap-2">
                                  <span className="text-success fw-bold text-uppercase" style={{fontSize: "11px"}}>Thực thu:</span>
                                  <span className="text-success fw-bold" style={{fontSize: "16px"}}>{formatNumber(thucThu)} ₫</span>
                              </div>
                          </div>
                      </div>

                  </div>
              </div>
          </div>

          {/* FOOTER */}
          <div className="px-4 py-3 border-top bg-white d-flex justify-content-end gap-2" style={{borderRadius: "0 0 12px 12px"}}>
              <button onClick={onClose} className="btn btn-sm btn-secondary fw-semibold" style={{height: "36px", padding: "0 20px"}}>
                  {currentLanguage === "vi" ? "Hủy Bỏ" : "Cancel"}
              </button>
              <button onClick={handleSave} className="btn btn-sm btn-success fw-bold shadow-sm d-flex align-items-center" 
                  style={{height: "36px", padding: "0 20px", backgroundColor: "#10B981", border: "none"}}>
                  <CheckCircle size={16} className="me-2"/>
                  {currentLanguage === "vi" ? "Duyệt & Cấp mã" : "Approve & Generate Code"}
              </button>
          </div>

        </div>
      </div>
    );
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
{approveModalItem && (
          <ApproveModal 
            request={approveModalItem}
            currentLanguage={currentLanguage}
            onClose={() => setApproveModalItem(null)}
            onConfirm={handleConfirmApprove}
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

        <div style={{marginTop:100}}></div>

        <div className="mb-4">
          <div className="p-0">
            <div className="d-flex justify-content-between align-items-end mb-3 mt-4">
              <input
                type="text"
                className="form-control shadow-sm"
                placeholder={currentLanguage === "vi" ? "Tìm kiếm Họ tên, Email, SĐT..." : "Search Name, Email, Phone..."}
                style={{ width: 300, marginLeft:60, borderRadius: "30px", paddingLeft: "18px", transition: "all 0.3s ease", fontSize: "14px" }}
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

            <div className="table-wrapper mt-3" style={{marginLeft:55}}>
              <div className="table-responsive" style={{ paddingLeft: "0px", position: "relative", maxHeight: "calc(100vh - 300px)", overflow: "auto" }} ref={tableContainerRef}>
                <table  className="table table-bordered table-hover align-middle mb-0">
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
                          onApprove={handleApproveClick}
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
                {canViewFinance && (
                  <div className="mt-2 fw-bold text-end">
                    Tổng doanh thu sau chiết khấu:{" "}
                    {data.reduce((sum, i) => sum + (i.DoanhThuSauChietKhau || 0), 0).toLocaleString("vi-VN")} đ
                  </div>
                )}

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