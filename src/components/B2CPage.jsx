import React, { useState, useEffect, useRef } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import NotificationPanel from "./CMSDashboard/NotificationPanel";
import EditProfileModal from "./EditProfileModal";
import { showToast } from "../utils/toast";
import useDashboardData from "./CMSDashboard/hooks/useDashboardData";
import { LayoutGrid, Edit, Trash2, X, Pin, PinOff, PlusCircle, CheckCircle, ChevronDown, Eye, EyeOff, Plus } from "lucide-react";
import Swal from "sweetalert2";
import "../styles/DashboardList.css";
import { authenticatedFetch } from "../utils/api";
const B2C_CATEGORY_LIST = {
  "Hộ chiếu, Hộ tịch": [
    "Hộ chiếu cấp mới (Hợp pháp - Trẻ em)",
    "Hộ chiếu cấp đổi (Hợp pháp - Còn hạn)",
    "Hộ chiếu cấp đổi (Hợp pháp - Hết hạn)",
    "Hộ chiếu cấp đổi (Bất hợp pháp - Còn hạn)",
    "Hộ chiếu cấp đổi (Bất hợp pháp - Hết hạn)",
    "Hộ chiếu cấp đổi rút gọn (công tác ngắn hạn, du lịch, trục xuất)",
    "Hộ chiếu bị chú",
    "Dán ảnh trẻ em",
    "Cải chính hộ tịch",
    "Trích lục khai sinh (sao)",
    "Ghi chú kết hôn (Ghi vào sổ hộ tịch việc kết hôn)",
    "Ghi chú ly hôn",
    "Ghi chú khai sinh"
  ],
  "Quốc tịch": [
    "Thôi quốc tịch Việt Nam",
    "Giấy xác nhận có quốc tịch Việt Nam",
    "Cấp giấy xác nhận người gốc Việt"
  ],
  "Nhận nuôi": [
    "Đăng ký việc nuôi con nuôi",
    "Đăng ký việc nhận cha, mẹ, con"
  ],
  "Thị thực": [
    "Giấy miễn thị thực"
  ],
  "Khai sinh, khai tử": [
    "Đăng ký khai sinh"
  ],
  "Kết hôn": [
    "Đăng ký kết hôn Việt - Việt",
    "Giấy xác nhận tình trạng hôn nhân",
    "Giấy chứng nhận đủ điều kiện kết hôn Việt - Hàn"
  ],
  "Chứng thực": [
    "Hợp pháp hoá lãnh sự/Chứng nhận lãnh sự",
    "Công chứng, chứng thực hợp đồng giao dịch",
    "Hợp đồng ủy quyền",
    "Ủy quyền",
    "Ủy quyền đưa con về nước",
    "Chứng thực chữ ký",
    "Sao y bản chính"
  ],
  "Khác": [
    "Xác minh",
    "Dịch Việt - Hàn",
    "Dịch Hàn - Việt",
    "Dịch BLX"
  ]
};

const ModernSelect = ({ name, value, options, onChange, placeholder, disabled, twoColumns = false, height = "38px", footerAction }) => {
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
          width: "100%", padding: "0 10px", borderRadius: "8px",
          border: "1px solid #d1d5db", fontSize: "13px", color: "#374151",
          backgroundColor: disabled ? "#F3F4F6" : "#ffffff",
          cursor: disabled ? "not-allowed" : "pointer",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          userSelect: "none", height: height,
          transition: "all 0.2s"
        }}
      >
        <span className="text-truncate" style={{ color: value ? "#374151" : "#9CA3AF" }}>{displayLabel}</span>
        <ChevronDown size={14} color="#6B7280" />
      </div>

      {isOpen && !disabled && (
        <div className="position-absolute w-100 bg-white shadow rounded border"
          style={{
            top: "100%", left: 0, marginTop: "4px", zIndex: 1000, maxHeight: "250px", overflowY: "auto",
            borderRadius: "8px", padding: "4px",
            display: "flex", flexDirection: "column"
          }}
        >
          <div style={{
             display: twoColumns ? "grid" : "block",
             gridTemplateColumns: twoColumns ? "1fr 1fr" : "none", gap: twoColumns ? "4px" : "0"
          }}>
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

          {/* [THÊM MỚI] Footer Action (Nút +) */}
          {footerAction && (
            <div 
              className="border-top mt-1 pt-1"
              style={{ position: "sticky", bottom: 0, backgroundColor: "white" }}
            >
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  footerAction.onClick();
                }}
                className="px-2 py-2 text-primary d-flex align-items-center gap-2 rounded transition-all"
                style={{ cursor: "pointer", fontSize: "12px", fontWeight: "600" }}
                onMouseEnter={(e) => e.target.style.backgroundColor = "#EFF6FF"}
                onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
              >
                {footerAction.icon} {footerAction.label}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const RequestEditModal = ({ request, users, currentUser, onClose, onSave, currentLanguage, dichvuList }) => {
  const isNew = !request || !request.YeuCauID;

  // Lấy danh sách dịch vụ từ API
  const canApprove = currentUser?.is_director || currentUser?.is_accountant || currentUser?.perm_approve_b2c;
  const serviceTypeList = dichvuList && dichvuList.length > 0 
    ? dichvuList.map(dv => dv.LoaiDichVu) 
    : [];

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [extraServices, setExtraServices] = useState(() => {
        if (isNew || !request.DanhMuc) return [""];
        const parts = request.DanhMuc.split(" + ");
        return parts.length > 1 ? parts.slice(1) : [""];
    });
  const [showExtras, setShowExtras] = useState(() => {
      if (isNew || !request.DanhMuc) return false;
      return request.DanhMuc.split(" + ").length > 1;
  });
  const handleAddRow = () => {
      if (extraServices.length < 5) {
          setExtraServices([...extraServices, ""]);
      } else {
          showToast("Chỉ được thêm tối đa 5 dịch vụ bổ sung", "warning");
      }
  };

  const handleRemoveRow = (index) => {
      const newArr = [...extraServices];
      newArr.splice(index, 1);
      if (newArr.length === 0) {
          setExtraServices([""]);
          setShowExtras(false);
      } else {
          setExtraServices(newArr);
      }
  };

  const handleChangeExtra = (index, value) => {
      const newArr = [...extraServices];
      newArr[index] = value;
      setExtraServices(newArr);
  };
  // Hàm chuẩn hóa loại dịch vụ
  const normalizeServiceType = (val) => {
      if (!val) return "";
      const cleanVal = String(val).trim();
      const krMap = {
        "인증 센터": "Chứng thực", "결혼 이민": "Kết hôn",
        "출생신고 대행": "Khai sinh, khai tử", "국적 대행": "Quốc tịch",
        "여권 • 호적 대행": "Hộ chiếu, Hộ tịch", "입양 절차 대행": "Nhận nuôi",
        "비자 대행": "Thị thực", "법률 컨설팅": "Tư vấn pháp lý",
        "B2B 서비스": "Dịch vụ B2B", "기타": "Khác",
      };
      if (krMap[cleanVal]) return krMap[cleanVal];
      return cleanVal;
  };

  const translations = {
    vi: {
      title: isNew ? "Đăng ký dịch vụ mới (B2C)" : `Cập nhật yêu cầu #${request?.YeuCauID || ""}`,
      subtitle: "Nhập thông tin khách hàng và dịch vụ",
      customer: "Khách Hàng", areaCode: "Mã", phone: "Số Điện Thoại", email: "Email",
      serviceType: "Loại Dịch Vụ",
      category: "Danh Mục",
      serviceName: "Tên Dịch Vụ",
      package: "Gói", form: "Kênh Liên Hệ", branch: "Cơ Sở Tư Vấn",
      appointmentDate: "Ngày Hẹn", appointmentTime: "Giờ Hẹn", content: "Nội Dung",
      note: "Ghi Chú", assignee: "Người Phụ Trách", status: "Trạng thái",
      confirmPassword: "Mật khẩu xác nhận", passwordHelper: "Mật khẩu của bạn",
      save: isNew ? "Đăng ký dịch vụ mới" : "Lưu thay đổi", processing: "Đang xử lý...",
      selectServiceType: "Chọn Loại Dịch Vụ", 
      selectCategory: "Chọn Danh Mục Chi Tiết",
      enterServiceName: "Nhập Tên Dịch Vụ Cụ Thể",
      selectPackage: "Chọn Gói",
      selectForm: "Chọn Hình Thức", selectBranch: "Chọn Cơ Sở", selectAssignee: "Chọn nhân viên",
      enterName: "Nhập Tên Khách Hàng", enterPhone: "Nhập Số Điện Thoại", enterEmail: "Nhập Email",
      selectNguoiPT: "Chọn Người Phụ Trách",
      enterContent: "Nhập Nội Dung",
      enterNote: "Nhập Ghi Chú",
      selectStatus: "Chọn Trạng Thái"
    },
    en: {
      title: isNew ? "Register New Service (B2C)" : `Update Request #${request?.YeuCauID || ""}`,
      subtitle: "Enter customer and service information",
      customer: "Customer", areaCode: "Code", phone: "Phone Number", email: "Email",
      serviceType: "Service Type",
      category: "Category",
      serviceName: "Service Name",
      package: "Package", form: "Contact Channel", branch: "Branch",
      appointmentDate: "Date", appointmentTime: "Time", content: "Content",
      note: "Note", assignee: "Assignee", status: "Status",
      confirmPassword: "Confirm Password", passwordHelper: "Your password",
      save: isNew ? "Register New Service" : "Save Changes", processing: "Processing...",
      selectServiceType: "Select Service Type", 
      selectCategory: "Select Category",
      enterServiceName: "Enter Specific Service Name",
      selectPackage: "Select Service Package",
      selectForm: "Select Form", selectBranch: "Select Branch", selectAssignee: "Select Staff",
      enterName: "Customer Name", enterPhone: "Enter Phone Number", enterEmail: "Enter Email",
      selectNguoiPT: "Select Assignee", 
      enterContent: "Enter Content",
      enterNote: "Enter Note",
      selectStatus: "Select Status"
    }
  };
  const t = translations[currentLanguage === "vi" ? "vi" : "en"];

  const [formData, setFormData] = useState(
    isNew
      ? {
          HoTen: "", MaVung: "+84", SoDienThoai: "", Email: "",
          NoiDung: "", GhiChu: "", TenHinhThuc: "",
          CoSoTuVan: "", Gio: "", ChonNgay: "",
          LoaiDichVu: "",
          DanhMuc: "", TenDichVu: "",
          MaHoSo: "", NguoiPhuTrachId: currentUser?.id || "",
          TrangThai: "Tư vấn", GoiDichVu: "",
          Invoice: "No", InvoiceUrl: "", ConfirmPassword: "" ,DoanhThuTruocChietKhau: 0,
          MucChietKhau: 0,
          Vi: 0
        }
      : { 
          ...request,
          MaVung: request.MaVung || "+84",
          TenHinhThuc: request.TenHinhThuc || "Trực tiếp",
          CoSoTuVan: request.CoSoTuVan || "Seoul",
          GoiDichVu: request.GoiDichVu || "Thông thường",
          Invoice: request.Invoice || "No",
          MaHoSo: request.MaHoSo || "",
          NguoiPhuTrachId: request.NguoiPhuTrachId || "",
          TrangThai: request.TrangThai || "Tư vấn",
          LoaiDichVu: normalizeServiceType(request.LoaiDichVu), 
         DanhMuc: (request.DanhMuc || "").split(" + ")[0],
          TenDichVu: request.TenDichVu || ""  
        }
  );

  const handleServiceTypeChange = (eOrName) => {
      handleInputChange(eOrName);
      setFormData(prev => ({...prev, DanhMuc: ""}));
  };

  // --- STYLES GIỐNG B2B ---
  const inputHeight = "38px"; 
  const labelStyle = { fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "4px", display: "block" };
  const inputStyle = {
    width: "100%", height: inputHeight, padding: "0 10px", borderRadius: "8px",
    border: "1px solid #d1d5db", fontSize: "13px", color: "#111827",
    backgroundColor: "#F9FAFB", outline: "none", transition: "border-color 0.2s"
  };

  const areaCodes = [{ value: "+82", label: "+82" }, { value: "+84", label: "+84" }];
  
  const formOptions = currentLanguage === "vi" ? ["Messenger","Kakao Talk", "Zalo","Naver Talk", "Email", "Gọi điện","Trực tiếp"] : ["Messenger","Kakao Talk", "Zalo","Naver Talk", "Email", "Phone", "Direct"];
  const branchOptions = [{ value: "Seoul", label: "Seoul" }, { value: "Busan", label: "Busan" }];
  const statusOptions = currentLanguage === "vi" ? ["Tư vấn", "Đang xử lý", "Đang nộp hồ sơ", "Hoàn thành"] : ["Consultation", "Processing", "Submitting Documents", "Completed"];
  const packageOptions = currentLanguage === "vi" ? [{ value: "Thông thường", label: "Thông thường" }, { value: "Cấp tốc", label: "Cấp tốc" }] : [{ value: "Thông thường", label: "Standard" }, { value: "Cấp tốc", label: "Express" }];

  const handleInputChange = (eOrName, value) => {
    let name, val;
    if (typeof eOrName === 'string') { name = eOrName; val = value; } 
    else { name = eOrName.target.name; val = eOrName.target.value; }
    setFormData((prev) => ({ ...prev, [name]: val }));
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
const handleMoneyChange = (e) => {
    const { name, value } = e.target;
    const raw = value.toString().replace(/\./g, "");
    if (!isNaN(raw)) {
        setFormData(prev => ({ ...prev, [name]: raw }));
    }
  };
  const handleSave = async () => {
    // 1. Kiểm tra validation cơ bản
    if (!formData.HoTen || !formData.SoDienThoai) {
        showToast(currentLanguage === "vi" ? "Thiếu tên hoặc SĐT" : "Missing Name/Phone", "warning");
        return;
    }

    // 2. Kiểm tra mật khẩu nếu là tạo mới
    if (isNew) {
      if (!formData.ConfirmPassword) {
        showToast(currentLanguage === "vi" ? "Nhập mật khẩu xác nhận!" : "Enter password!", "warning");
        return;
      }
      try {
        setLoading(true);
        const verifyRes = await fetch(`https://onepasscms-backend.onrender.com/api/verify-password`, {
          method: "POST", 
          headers: { "Content-Type": "application/json" },
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


    const validExtras = extraServices.filter(s => s && s.trim() !== "");
    let finalDanhMuc = formData.DanhMuc; 
    
  
    if (validExtras.length > 0) {
        finalDanhMuc = `${formData.DanhMuc} + ${validExtras.join(" + ")}`;
    }
  


    const payload = { 
        ...formData, 
        autoApprove: isNew && canApprove,
        DanhMuc: finalDanhMuc
    };
    
    delete payload.ConfirmPassword;

    setLoading(true);
    await onSave(payload);
    setLoading(false);
  };
  const formatNumber = (num) => num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "0";
  const discountOptions = [{ value: 0, label: "0%" }, { value: 5, label: "5%" }, { value: 10, label: "10%" }, { value: 12, label: "12%" }, { value: 15, label: "15%" }, { value: 17, label: "17%" }, { value: 30, label: "30%" }];
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
            borderRadius: "16px", 
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
            maxHeight: "90vh",
            overflowY: "auto"
          }}
      >
        <button onClick={onClose} className="position-absolute d-flex align-items-center justify-content-center border-0 bg-light rounded-circle"
            style={{ top: "15px", right: "15px", width: "32px", height: "32px", cursor: "pointer", zIndex: 10 }}>
            <X size={18} />
        </button>

        <div className="text-center mb-4 mt-2">
          <h3 className="fw-bold m-0" style={{ fontSize: "20px", color: "#111827" }}>{t.title}</h3>
          <p className="text-muted m-0 mt-1" style={{ fontSize: "13px" }}>{t.subtitle}</p>
        </div>

        <div className="row g-3">
          
          {/* === HÀNG 1: THÔNG TIN KHÁCH HÀNG === */}
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
                  padding: "0 5px", textAlign: "center", backgroundColor: "#f3f4f6", cursor: "pointer", appearance: "auto"
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

       <div className="col-md-4">
            <label style={labelStyle}>{t.serviceType} <span className="text-danger">*</span></label>
            <ModernSelect 
                name="LoaiDichVu" 
                height={inputHeight} 
                value={formData.LoaiDichVu} 
                placeholder={t.selectServiceType} 
                options={serviceTypeList.map(s => ({ value: s, label: s }))} 
                onChange={handleServiceTypeChange} 
            />
          </div>
      
          <div className="col-md-4">
            <label style={labelStyle}>{t.serviceName}</label>
             <input type="text" name="TenDichVu" style={inputStyle} value={formData.TenDichVu} onChange={handleInputChange} placeholder={t.enterServiceName} />
          </div>
          <div className="col-md-4">
            <label style={labelStyle}>{t.package}</label>
            <ModernSelect name="GoiDichVu" height={inputHeight} value={formData.GoiDichVu} placeholder={t.selectPackage} options={packageOptions} onChange={handleInputChange} />
          </div>
          
          <div className="col-12">
             <label style={labelStyle}>{t.category} (Chi tiết) <span className="text-danger">*</span></label>
             <ModernSelect 
                name="DanhMuc" 
                height={inputHeight} 
                value={formData.DanhMuc} 
                placeholder={t.selectCategory} 
                options={(B2C_CATEGORY_LIST[formData.LoaiDichVu] || []).map(dm => ({ value: dm, label: dm }))} 
                onChange={handleInputChange}
                disabled={!formData.LoaiDichVu}
                // Nút + Thêm dịch vụ bổ sung
                footerAction={{
                    label: showExtras ? "Ẩn dịch vụ bổ sung" : "Thêm dịch vụ bổ sung (+5)",
                    icon: showExtras ? <EyeOff size={14}/> : <Plus size={14}/>,
                    onClick: () => {
                         if (!showExtras && extraServices.length === 0) setExtraServices([""]); 
                         setShowExtras(!showExtras);
                    }
                }}
            />
            
            {/* Vùng nhập Dịch vụ bổ sung (Hiển thị khi bật showExtras) */}
            {showExtras && (
                <div className="mt-2 p-3 bg-light rounded border animate__animated animate__fadeIn">
                    <div style={{ fontSize: "11px", color: "#666", marginBottom: "8px", fontStyle: "italic" }}>
                        * Nhập tên dịch vụ phụ (Ví dụ: Dịch thuật, Công chứng...). <br/>
                        * Nhấn nút <b>(+)</b> màu xanh để thêm dòng mới.
                    </div>
                    
                    <div className="d-flex flex-column gap-2">
                        {extraServices.map((service, index) => (
                            <div key={index} className="d-flex align-items-center gap-2" style={{ width: "100%" }}>
                                <input
                                    type="text"
                                    placeholder={`Dịch vụ bổ sung ${index + 1}`}
                                    value={service}
                                    onChange={(e) => handleChangeExtra(index, e.target.value)}
                                    style={{ ...inputStyle, flex: 1 }}
                                />
                                <button type="button" onClick={() => handleRemoveRow(index)} className="btn btn-outline-danger d-flex align-items-center justify-content-center" style={{ width: "38px", height: "38px", padding: 0, borderRadius: "6px" }} title="Xóa">
                                    <Trash2 size={16} />
                                </button>
                                {index === extraServices.length - 1 && extraServices.length < 5 && (
                                    <button type="button" onClick={handleAddRow} className="btn btn-primary d-flex align-items-center justify-content-center" style={{ width: "38px", height: "38px", padding: 0, borderRadius: "6px", backgroundColor: "#22c55e", borderColor: "#22c55e" }} title="Thêm">
                                        <Plus size={18} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
          </div>
         

          {/* === HÀNG 4: THÔNG TIN KHÁC === */}
          <div className="col-md-4">
            <label style={labelStyle}>{t.form}</label>
            <ModernSelect name="TenHinhThuc" height={inputHeight} value={formData.TenHinhThuc} placeholder={t.selectForm} options={formOptions.map(v => ({ value: v, label: v }))} onChange={handleInputChange} />
          </div>
          <div className="col-md-4">
            <label style={labelStyle}>{t.branch}</label>
            <ModernSelect name="CoSoTuVan" height={inputHeight} value={formData.CoSoTuVan} placeholder={t.selectBranch} options={branchOptions} onChange={handleInputChange} />
          </div>
          <div className="col-md-4">
             <label style={labelStyle}>{t.status}</label>
             <ModernSelect 
                name="TrangThai" 
                height={inputHeight} 
                value={formData.TrangThai} 
                placeholder={t.selectStatus} 
                options={statusOptions.map(s => ({ value: s, label: s }))} 
                onChange={handleInputChange} 
             />
          </div>

          {/* === HÀNG 5: LỊCH HẸN & NGƯỜI PHỤ TRÁCH === */}
          {(() => {
            const canAssign = currentUser?.is_admin || currentUser?.is_director || currentUser?.is_accountant;
            const colClass = canAssign ? "col-md-4" : "col-md-6";
            return (
              <>
                <div className={colClass}>
                  <label style={labelStyle}>{t.appointmentDate}</label>
                  <input type="date" name="ChonNgay" style={inputStyle} value={formData.ChonNgay ? new Date(formData.ChonNgay).toISOString().split("T")[0] : ""} onChange={handleInputChange} />
                </div>
                <div className={colClass}>
                  <label style={labelStyle}>{t.appointmentTime}</label>
                  <input type="time" name="Gio" style={inputStyle} value={formatTimeForInput(formData.Gio)} onChange={handleInputChange} />
                </div>
                {canAssign && (
                  <div className="col-md-4">
                    <label style={labelStyle}>{t.assignee}</label>
                    <ModernSelect name="NguoiPhuTrachId" height={inputHeight} value={formData.NguoiPhuTrachId} placeholder={t.selectNguoiPT} options={users.map(u => ({ value: String(u.id), label: u.name }))} onChange={handleInputChange} />
                  </div>
                )}
              </>
            );
          })()}

          {/* === HÀNG 6: NỘI DUNG & GHI CHÚ === */}
          <div className="col-12">
            <label style={labelStyle}>{t.content}</label>
            <textarea rows={2} name="NoiDung" style={inputStyle} value={formData.NoiDung} onChange={handleInputChange} placeholder={t.enterContent} />
          </div>

          <div className="col-12">
            <label style={labelStyle}>{t.note}</label>
            <textarea rows={2} name="GhiChu" style={inputStyle} value={formData.GhiChu} onChange={handleInputChange} placeholder={t.enterNote} />
          </div>
{isNew && canApprove && (
                <div className="col-12 mt-3 pt-2 border-top">
                    
                    <div className="row g-3">
                        <div className="col-md-4">
                            <label style={labelStyle}>Doanh thu (VNĐ)</label>
                            <input 
                                type="text" 
                                name="DoanhThuTruocChietKhau" 
                                value={formatNumber(formData.DoanhThuTruocChietKhau)} 
                                onChange={handleMoneyChange} 
                                style={{...inputStyle, color: "#2563eb", fontWeight: "bold"}} 
                                placeholder="0" 
                            />
                        </div>
                        <div className="col-md-4">
                            <label style={labelStyle}>Mức Chiết khấu (%)</label>
                            <ModernSelect 
                                name="MucChietKhau" 
                                height={inputHeight} 
                                value={formData.MucChietKhau} 
                                options={discountOptions} 
                                onChange={(e) => setFormData(prev => ({...prev, MucChietKhau: e.target.value}))} 
                            />
                        </div>
                       
                       
                    </div>
                </div>
            )}

          <div className="col-12 mt-2">
            {isNew ? (
                <div className="d-flex flex-column gap-3">
                    <div>
                        <label style={labelStyle}>{t.confirmPassword} <span className="text-danger">*</span></label>
                        <div className="position-relative">
                            <input type={showConfirmPassword ? "text" : "password"} placeholder="******" value={formData.ConfirmPassword} onChange={handleInputChange} name="ConfirmPassword" style={inputStyle} />
                            <span className="position-absolute top-50 translate-middle-y end-0 me-2 cursor-pointer" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                            {showConfirmPassword ? <EyeOff size={14}/> : <Eye size={14}/>}
                            </span>
                        </div>
                    </div>
                    <div>
                        <button className="btn fw-bold w-100 shadow-sm" onClick={handleSave} disabled={loading} style={{ backgroundColor: "#10b981", color: "white", height: "42px", borderRadius: "8px", fontSize: "14px" }}>
                        {loading ? <span className="spinner-border spinner-border-sm"></span> : t.save}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="col-12 mt-3">
                <button className="btn fw-bold w-100 shadow-sm" onClick={handleSave} disabled={loading} style={{ backgroundColor: "#10b981", color: "white", height: "42px", borderRadius: "8px", fontSize: "14px" }}>
                   {loading ? <span className="spinner-border spinner-border-sm"></span> : (
                       isNew && canApprove 
                       ? (currentLanguage === "vi" ? "ĐĂNG KÝ & DUYỆT LUÔN (CẤP MÃ)" : "REGISTER & AUTO APPROVE") 
                       : t.save
                   )}
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
      {/* 1. STT */}
      {isVisible("id") && (
        <td className={`text-center fw-semibold border-target ${isPinned("id") ? "sticky-col" : ""}`}>
          {item.YeuCauID}
        </td>
      )}
      {/* 2. Khách hàng */}
      {isVisible("hoTen") && (
        <td className={`text-center fw-semibold ${isPinned("hoTen") ? "sticky-col" : ""}`} style={{ minWidth: "120px" }}>
          {item.HoTen}
        </td>
      )}
      {/* 3. Mã vùng */}
      {isVisible("maVung") && (
        <td className={`text-center ${isPinned("maVung") ? "sticky-col" : ""}`}>
          {item.MaVung}
        </td>
      )}
      {/* 4. Số Điện Thoại */}
      {isVisible("sdt") && (
        <td style={{maxWidth: "150px",width: "110px", textAlign:"center"}} className={isPinned("sdt") ? "sticky-col" : ""}>
          {item.SoDienThoai}
        </td>
      )}
      {/* 5. Email */}
      {isVisible("email") && (
        <td style={{ maxWidth: "150px",width: "162px" }} className={`text-center text-truncate ${isPinned("email") ? "sticky-col" : ""}`} title={item.Email}>
          {item.Email}
        </td>
      )}
      {/* 6. Hình thức */}
      {isVisible("hinhThuc") && (
        <td className={`text-center border-target ${isPinned("hinhThuc") ? "sticky-col" : ""}`}>
          {item.TenHinhThuc}
        </td>
      )}
      {/* 7. Cơ sở */}
      {isVisible("coSo") && (
        <td className={`text-center border-target ${isPinned("coSo") ? "sticky-col" : ""}`}>
          {translateBranch(item.CoSoTuVan)}
        </td>
      )}
      {/* 8. Loại Dịch Vụ */}
      {isVisible("loaiDichVu") && (
        <td style={{ maxWidth: "150px" }} className={`text-center text-truncate ${isPinned("loaiDichVu") ? "sticky-col" : ""}`} title={translateService(item.LoaiDichVu)}>
          {translateService(item.LoaiDichVu)}
        </td>
      )}
     {isVisible("danhMuc") && (
        <td 
          className={`text-start ${isPinned("danhMuc") ? "sticky-col" : ""}`} // Đổi text-center thành text-start cho đẹp
          style={{ maxWidth: "250px", minWidth: "160px", verticalAlign: "middle" }} // verticalAlign: middle để cột Loại dịch vụ tự canh giữa
        >
          <div style={{ fontSize: "12px", lineHeight: "1.5" }}>
            {(item.DanhMuc || "").split(" + ").map((text, index) => (
                <div key={index} style={{ 
                    borderTop: index > 0 ? "1px dashed #eee" : "none", // Gạch ngang mờ phân cách
                    paddingTop: index > 0 ? "4px" : "0",
                    marginTop: index > 0 ? "4px" : "0",
                    fontWeight: index === 0 ? "600" : "400", // Dòng chính in đậm
                    color: index === 0 ? "#2563eb" : "#374151" // Dòng chính màu xanh
                }}>
                  {index > 0 && "- "} {text}
                </div>
            ))}
          </div>
        </td>
      )}
      {/* 9. Tên Dịch Vụ */}
      {isVisible("tenDichVu") && (
        <td className={`text-center ${isPinned("tenDichVu") ? "sticky-col" : ""}`}>
          {item.TenDichVu || ""}
        </td>
      )}
      {/* 10. Mã Dịch Vụ */}
      {isVisible("maDichVu") && (
        <td className={`text-center border-target ${isPinned("maDichVu") ? "sticky-col" : ""}`}>
          {displayMaHoSo}
        </td>
      )}

      {(currentUser?.is_admin || currentUser?.is_director || currentUser?.is_accountant) && isVisible("nguoiPhuTrach") && (
        <td style={{width:"110px", textAlign:"center"}}  className={isPinned("nguoiPhuTrach") ? "sticky-col" : ""}>
          {item.NguoiPhuTrach?.name || <span className="text-muted fst-italic"></span>}
        </td>
      )}
      {/* 12. Ngày hẹn */}
      {isVisible("ngayHen") && (
        <td className={`text-center ${isPinned("ngayHen") ? "sticky-col" : ""}`}>
          {item.ChonNgay ? new Date(item.ChonNgay).toLocaleDateString("vi-VN") : ""}
        </td>
      )}
      {/* 13. Trạng thái */}
      {isVisible("trangThai") && (
        <td className={`text-center ${isPinned("trangThai") ? "sticky-col" : ""}`}>
          {item.TrangThai}
        </td>
      )}
      {/* 14. Gói Dịch Vụ */}
      {isVisible("goiDichVu") && (
        <td style={{width:"102px"}} className={`text-center ${isPinned("goiDichVu") ? "sticky-col" : ""}`}>
          {item.GoiDichVu || ""}
        </td>
      )}
      {/* 15. Invoice Y/N */}
      {isVisible("invoice") && (
        <td className={`text-center ${isPinned("invoice") ? "sticky-col" : ""}`}>
           {["Yes", "yes", "true", "1"].includes(String(item.Invoice)) ? (
             <span className="text-success fw-bold">Có</span>
           ) : (
             <span className="text-muted"></span>
           )}
        </td>
      )}
      {/* Invoice Link (Kế toán) */}
      {canViewFinance && isVisible("invoiceUrl") && (
        <td style={{ maxWidth: "120px" }} className={isPinned("invoiceUrl") ? "sticky-col" : ""}>
          {item.InvoiceUrl ? (
            <a href={item.InvoiceUrl} target="_blank" rel="noreferrer" className="text-decoration-none text-primary d-block text-truncate">Link</a>
          ) : "-"}
        </td>
      )}

      {/* 16. Giờ */}
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

      {/* 17. Nội dung (Đã cập nhật style xuống dòng) */}
      {isVisible("noiDung") && (
        <td 
          style={{ minWidth: "200px", maxWidth: "260px" }} 
          className={`${isPinned("noiDung") ? "sticky-col" : ""}`}
        >
           <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", textAlign: "left", overflowWrap: "anywhere", paddingLeft: "5px" }}>
             {item.NoiDung}
           </div>
        </td>
      )}

      {/* 18. Ghi chú (Đã cập nhật style xuống dòng) */}
      {isVisible("ghiChu") && (
        <td 
          style={{ minWidth: "150px", maxWidth: "250px" }} 
          className={`${isPinned("ghiChu") ? "sticky-col" : ""}`}
        >
           <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", textAlign: "left", overflowWrap: "anywhere", paddingLeft: "5px" }}>
             {item.GhiChu}
           </div>
        </td>
      )}

      {/* 19. Ngày tạo */}
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

      {/* Các cột tài chính (Ẩn/Hiện theo quyền) */}
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

      {/* 20. Hành động */}
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


            {hasServiceCode && (
                <button 
                    className="btn btn-sm btn-primary d-flex align-items-center justify-content-center" 
                    style={{ width: 32, height: 32 }} 
                    onClick={() => onEdit(item)} 
                    title={currentLanguage === "vi" ? "Sửa thông tin" : "Edit"}
                >
                <Edit size={16} />
                </button>
            )}

          
            {hasServiceCode && (
                <button 
                    className="btn btn-sm btn-danger d-flex align-items-center justify-content-center" 
                    style={{ width: 32, height: 32 }} 
                    onClick={handleDeleteClick} 
                    title={currentLanguage === "vi" ? "Xóa" : "Delete"}
                >
                  <Trash2 size={16} />
                </button>
            )}
            
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
useEffect(() => {
    const fetchDichVu = async () => {
      try {
       
        const res = await fetch("https://onepasscms-backend.onrender.com/api/dichvu");
        
        if (!res.ok) throw new Error("Kết nối thất bại");

        const json = await res.json();

        if (json.success) {

          setDichvuList(json.data);
        }
      } catch (err) {
        console.error("❌ Lỗi tải danh mục dịch vụ:", err);
      }
    };

    fetchDichVu();
  }, []); 
const initialColumnKeys = [
    { key: "id", label: "STT" },
    { key: "hoTen", label: "Khách hàng" },
    { key: "maVung", label: "Mã vùng" },
    { key: "sdt", label: "Số Điện Thoại" },
    { key: "email", label: "Email" },
    { key: "hinhThuc", label: "Kênh Liên Hệ" },
    { key: "coSo", label: "Cơ sở" },
    { key: "loaiDichVu", label: "Loại Dịch Vụ" },
    { key: "danhMuc", label: "Danh Mục" },
    { key: "tenDichVu", label: "Tên Dịch Vụ" },
    { key: "maDichVu", label: "Mã Dịch Vụ" },
    ...(currentUser?.is_admin || currentUser?.is_director || currentUser?.is_accountant ? [{ key: "nguoiPhuTrach", label: "Người phụ trách" }] : []),
    { key: "ngayHen", label: "Ngày hẹn" },
    { key: "trangThai", label: "Trạng thái" },
    { key: "goiDichVu", label: "Gói" },
    { key: "invoice", label: "Invoice Y/N" },
    ...(canViewFinance ? [{ key: "invoiceUrl", label: "Invoice" }] : []), // Giữ Invoice Link cạnh Invoice Y/N
    { key: "gio", label: "Giờ" },
    { key: "noiDung", label: "Nội dung" },
    { key: "ghiChu", label: "Ghi chú" },
    { key: "ngayTao", label: "Ngày tạo" },
    
    // Các cột tài chính (Giữ lại để không bị mất chức năng của kế toán)
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
    "STT", "Khách hàng", "Mã vùng", "Số Điện Thoại", "Email", 
    "Kênh Liên Hệ", "Cơ sở", "Loại Dịch Vụ", "Danh Mục","Tên Dịch Vụ", "Mã Dịch Vụ",
    ...((currentUser?.is_admin || currentUser?.is_director || currentUser?.is_accountant) ? ["Người phụ trách"] : []),
    "Ngày hẹn", "Trạng thái", "Gói", "Invoice Y/N",
    ...(canViewFinance ? ["Invoice"] : []),
    "Giờ", "Nội dung", "Ghi chú", "Ngày tạo",

    // --- Giữ cột tài chính ---
    ...(canViewFinance ? [
       <div key="dt" className="d-flex flex-column align-items-center"><span>Doanh Thu</span><span>Trước Chiết Khấu</span></div>,
       "Mức Chiết khấu",
       <div key="tck" className="d-flex flex-column align-items-center"><span>Số Tiền</span><span>Chiết Khấu</span></div>,
       <div key="dts" className="d-flex flex-column align-items-center"><span>Doanh Thu</span><span>Sau Chiết Khấu</span></div>
    ] : []),
    // -------------------------
    
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
      // 1. Tạo URL (Giữ nguyên logic cũ của bạn)
      let url = `https://onepasscms-backend.onrender.com/api/yeucau?page=${currentPage}&limit=${itemsPerPage}`;
      
      if (currentUser?.is_admin || currentUser?.is_director || currentUser?.is_accountant) { 
          url += `&is_admin=true`; 
      } else { 
          url += `&userId=${currentUser?.id}`; 
      }

 
      const res = await authenticatedFetch(url);

      
      if (!res) return;

      const json = await res.json();
      
      if (json.success) { 
          setData(json.data); 
          setTotalPages(json.totalPages || 1); 
      } else { 
          showToast("Không thể tải dữ liệu", "error"); 
      }

    } catch (err) { 
        showToast("Lỗi kết nối server", "error"); 
    }
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
const ApproveModal = ({ request, onClose, onConfirm, currentLanguage, users, currentUser, dichvuList }) => {
  
  const [formData, setFormData] = useState({
    HoTen: request.HoTen || "",
    MaVung: request.MaVung || "+84",
    SoDienThoai: request.SoDienThoai || "",
    Email: request.Email || "",
    LoaiDichVu: request.LoaiDichVu || "",
    TenDichVu: request.TenDichVu || "",
    GoiDichVu: request.GoiDichVu || "Thông thường",
    TenHinhThuc: request.TenHinhThuc || "",
    CoSoTuVan: request.CoSoTuVan || "",
    DanhMuc: (request.DanhMuc || "").split(" + ")[0], 
    ChonNgay: request.ChonNgay ? new Date(request.ChonNgay).toISOString().split("T")[0] : "",
    Gio: request.Gio ? (request.Gio.includes("T") ? new Date(request.Gio).toTimeString().substring(0,5) : request.Gio.substring(0,5)) : "",
    NoiDung: request.NoiDung || "",
    GhiChu: request.GhiChu || "",
    
    // Trạng thái có thể chỉnh sửa
    TrangThai: request.TrangThai || "Đang xử lý",

    DoanhThuTruocChietKhau: request.DoanhThuTruocChietKhau || 0,
    MucChietKhau: request.MucChietKhau || 0,
    Vi: request.Vi || 0,
    ConfirmPassword: ""
  });

  const [loading, setLoading] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Xử lý danh mục phụ
  const [extraServices, setExtraServices] = useState(() => {
        if (!request.DanhMuc) return [""];
        const parts = request.DanhMuc.split(" + ");
        return parts.length > 1 ? parts.slice(1) : [""];
  });
  const [showExtras, setShowExtras] = useState(extraServices.length > 0 && extraServices[0] !== "");

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

  const handleSave = async () => {
    if (!formData.ConfirmPassword) {
        showToast("Vui lòng nhập mật khẩu xác nhận!", "warning");
        return;
    }
    try {
        setLoading(true);
        const verifyRes = await fetch(`https://onepasscms-backend.onrender.com/api/verify-password`, {
          method: "POST", 
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: currentUser.username, password: formData.ConfirmPassword })
        });
        const verifyJson = await verifyRes.json();
        if (!verifyJson.success) {
          setLoading(false);
          showToast("Mật khẩu không chính xác!", "error");
          return;
        }
    } catch (err) { setLoading(false); return; }

    const validExtras = extraServices.filter(s => s && s.trim() !== "");
    let finalDanhMuc = formData.DanhMuc;
    if (validExtras.length > 0) {
        finalDanhMuc = `${formData.DanhMuc} + ${validExtras.join(" + ")}`;
    }

    const payload = { ...formData, DanhMuc: finalDanhMuc };
    delete payload.ConfirmPassword;
    
    await onConfirm(request.YeuCauID, payload);
    setLoading(false);
  };

  const formatNumber = (num) => num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "0";

  const inputHeight = "38px"; 
  const labelStyle = { fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "4px", display: "block" };
  const inputStyle = {
    width: "100%", height: inputHeight, padding: "0 10px", borderRadius: "8px",
    border: "1px solid #d1d5db", fontSize: "13px", color: "#111827",
    backgroundColor: "#F9FAFB", outline: "none", transition: "border-color 0.2s"
  };

  const serviceTypeList = dichvuList?.map(dv => dv.LoaiDichVu) || [];
  const packageOptions = [{ value: "Thông thường", label: "Thông thường" }, { value: "Cấp tốc", label: "Cấp tốc" }];
  const branchOptions = [{ value: "Seoul", label: "Seoul" }, { value: "Busan", label: "Busan" }];
  const formOptions = ["Trực tiếp", "Online", "Email", "Gọi điện", "Messenger", "Kakao Talk", "Zalo"];
  const areaCodes = [{ value: "+82", label: "+82" }, { value: "+84", label: "+84" }];
  const statusOptions = currentLanguage === "vi" ? ["Tư vấn", "Đang xử lý", "Đang nộp hồ sơ", "Hoàn thành"] : ["Consultation", "Processing", "Submitting Documents", "Completed"];


  const discountOptions = [   
    { value: 5, label: "5%" },
    { value: 10, label: "10%" },
    { value: 12, label: "12%" },
    { value: 15, label: "15%" },
    { value: 17, label: "17%" },
    { value: 30, label: "30%" }
  ];

  return (
    <div className="modal-overlay" style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1100, backdropFilter: "blur(3px)",
      display: "flex", justifyContent: "center", alignItems: "center"
    }}>
      <div className="bg-white p-4 position-relative" 
          style={{ 
            width: "800px",
            maxWidth: "95%", 
            borderRadius: "16px", 
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
            maxHeight: "90vh",
            overflowY: "auto"
          }}
      >
        <button onClick={onClose} className="position-absolute d-flex align-items-center justify-content-center border-0 bg-light rounded-circle"
            style={{ top: "15px", right: "15px", width: "32px", height: "32px", cursor: "pointer", zIndex: 10 }}>
            <X size={18} />
        </button>

        <div className="text-center mb-4 mt-2">
          <h3 className="fw-bold m-0" style={{ fontSize: "20px", color: "#111827" }}>
             {currentLanguage === "vi" ? "Duyệt hồ sơ & Cấp mã" : "Approve Request"}
          </h3>
          <p className="text-muted m-0 mt-1" style={{ fontSize: "13px" }}>Kiểm tra thông tin và nhập doanh thu</p>
        </div>

        <div className="row g-3"> 
  
            <div className="col-md-4">
                <label style={labelStyle}>Khách Hàng <span className="text-danger">*</span></label>
                <input type="text" name="HoTen" style={inputStyle} value={formData.HoTen} onChange={handleChange} />
            </div>
            <div className="col-md-4">
                <label style={labelStyle}>Số Điện Thoại <span className="text-danger">*</span></label>
                <div className="d-flex">
                    <select name="MaVung" value={formData.MaVung} onChange={handleChange} style={{...inputStyle, width: "70px", borderTopRightRadius: 0, borderBottomRightRadius: 0, padding: "0 5px", textAlign: "center", backgroundColor: "#f3f4f6"}}>
                        {areaCodes.map(c => <option key={c.value} value={c.value}>{c.value}</option>)}
                    </select>
                    <input type="text" name="SoDienThoai" style={{...inputStyle, flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderLeft: "none"}} value={formData.SoDienThoai} onChange={handleChange} />
                </div>
            </div>
            <div className="col-md-4">
                <label style={labelStyle}>Email</label>
                <input type="text" name="Email" style={inputStyle} value={formData.Email} onChange={handleChange} />
            </div>


            <div className="col-md-4">
                <label style={labelStyle}>Loại Dịch Vụ <span className="text-danger">*</span></label>
                <ModernSelect name="LoaiDichVu" height={inputHeight} value={formData.LoaiDichVu} options={serviceTypeList.map(s => ({ value: s, label: s }))} onChange={handleChange} />
            </div>
            <div className="col-md-4">
                <label style={labelStyle}>Tên Dịch Vụ</label>
                <input type="text" name="TenDichVu" style={inputStyle} value={formData.TenDichVu} onChange={handleChange} />
            </div>
            <div className="col-md-4">
                <label style={labelStyle}>Gói Dịch Vụ</label>
                <ModernSelect name="GoiDichVu" height={inputHeight} value={formData.GoiDichVu} options={packageOptions} onChange={handleChange} />
            </div>

          
            <div className="col-12">
                <label style={labelStyle}>Danh Mục (Chi tiết) <span className="text-danger">*</span></label>
                <ModernSelect 
                    name="DanhMuc" 
                    height={inputHeight} 
                    value={formData.DanhMuc} 
                    options={(B2C_CATEGORY_LIST[formData.LoaiDichVu] || []).map(dm => ({ value: dm, label: dm }))} 
                    onChange={handleChange}
                    footerAction={{
                        label: showExtras ? "Ẩn dịch vụ bổ sung" : "Thêm dịch vụ bổ sung (+5)",
                        icon: showExtras ? <EyeOff size={14}/> : <Plus size={14}/>,
                        onClick: () => setShowExtras(!showExtras)
                    }}
                />
                 {showExtras && (
                    <div className="mt-2 p-3 bg-light rounded border">
                        {extraServices.map((service, index) => (
                            <div key={index} className="d-flex mb-2 gap-2">
                                <input className="form-control form-control-sm" value={service} onChange={(e) => {
                                    const newArr = [...extraServices]; newArr[index] = e.target.value; setExtraServices(newArr);
                                }} placeholder={`Dịch vụ phụ ${index+1}`} />
                                <button className="btn btn-sm btn-outline-danger" onClick={() => {
                                     const newArr = [...extraServices]; newArr.splice(index, 1); setExtraServices(newArr);
                                }}><Trash2 size={14}/></button>
                            </div>
                        ))}
                        <button className="btn btn-sm btn-primary" onClick={() => setExtraServices([...extraServices, ""])}><Plus size={14}/> Thêm dòng</button>
                    </div>
                )}
            </div>

 
            <div className="col-md-4">
                <label style={labelStyle}>Kênh Liên Hệ</label>
                <ModernSelect name="TenHinhThuc" height={inputHeight} value={formData.TenHinhThuc} options={formOptions.map(v => ({ value: v, label: v }))} onChange={handleChange} />
            </div>
            <div className="col-md-4">
                <label style={labelStyle}>Cơ Sở Tư Vấn</label>
                <ModernSelect name="CoSoTuVan" height={inputHeight} value={formData.CoSoTuVan} options={branchOptions} onChange={handleChange} />
            </div>
            <div className="col-md-4">
                 <label style={labelStyle}>Trạng thái</label>
                 <ModernSelect name="TrangThai" height={inputHeight} value={formData.TrangThai} options={statusOptions.map(s => ({ value: s, label: s }))} onChange={handleChange} />
            </div>

          
            <div className="col-md-4">
                <label style={labelStyle}>Ngày Hẹn</label>
                <input type="date" name="ChonNgay" style={inputStyle} value={formData.ChonNgay} onChange={handleChange} />
            </div>
            <div className="col-md-4">
                <label style={labelStyle}>Giờ Hẹn</label>
                <input type="time" name="Gio" style={inputStyle} value={formData.Gio} onChange={handleChange} />
            </div>
            <div className="col-md-4">
                <label style={labelStyle}>Người Phụ Trách</label>
                <ModernSelect name="NguoiPhuTrachId" height={inputHeight} value={formData.NguoiPhuTrachId} options={users.map(u => ({ value: String(u.id), label: u.name }))} onChange={handleChange} />
            </div>


            <div className="col-12">
                <label style={labelStyle}>Nội Dung</label>
                <textarea rows={2} name="NoiDung" style={inputStyle} value={formData.NoiDung} onChange={handleChange} />
            </div>
             <div className="col-12">
                <label style={labelStyle}>Ghi Chú</label>
                <textarea rows={2} name="GhiChu" style={inputStyle} value={formData.GhiChu} onChange={handleChange} />
            </div>

            <div className="col-12 mt-3 pt-2 border-top">
                <div className="row g-3">
                    <div className="col-md-4">
                        <label style={labelStyle}>Doanh thu (VNĐ) <span className="text-danger">*</span></label>
                        <input type="text" name="DoanhThuTruocChietKhau" value={formatNumber(formData.DoanhThuTruocChietKhau)} onChange={handleChange} style={{...inputStyle, color: "#2563eb", fontWeight: "bold"}} placeholder="0" />
                    </div>

                    <div className="col-md-4">
                        <label style={labelStyle}>Chiết khấu (%)</label>
                        <ModernSelect 
                            name="MucChietKhau" 
                            height={inputHeight} 
                            value={formData.MucChietKhau} 
                            options={discountOptions} 
                            onChange={handleChange} 
                            placeholder="0%"
                        />
                    </div>

                    <div className="col-md-4">
                        <label style={labelStyle}>Trừ Ví / Đã Cọc</label>
                        <input type="text" name="Vi" value={formatNumber(formData.Vi)} onChange={handleChange} style={inputStyle} placeholder="0" />
                    </div>
                </div>
            </div>

            {/* === MẬT KHẨU & NÚT LƯU === */}
            <div className="col-12 mt-2">
                <label style={labelStyle}>Mật khẩu xác nhận <span className="text-danger">*</span></label>
                <div className="position-relative">
                    <input type={showConfirmPassword ? "text" : "password"} placeholder="******" value={formData.ConfirmPassword} onChange={handleChange} name="ConfirmPassword" style={inputStyle} />
                    <span className="position-absolute top-50 translate-middle-y end-0 me-2 cursor-pointer" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <EyeOff size={14}/> : <Eye size={14}/>}
                    </span>
                </div>
            </div>

            <div className="col-12 mt-3">
                <button className="btn fw-bold w-100 shadow-sm" onClick={handleSave} disabled={loading} style={{ backgroundColor: "#10b981", color: "white", height: "42px", borderRadius: "8px", fontSize: "14px" }}>
                   {loading ? <span className="spinner-border spinner-border-sm"></span> : (currentLanguage === "vi" ? "DUYỆT & CẤP MÃ HỒ SƠ" : "APPROVE & GENERATE CODE")}
                </button>
            </div>

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
      <div style={{ 
        width: showSidebar 
          ? (currentUser?.is_director || currentUser?.is_accountant ? "340px" : "290px") 
          : "70px", 
        transition: "0.3s", 
        zIndex: 100 
      }}>
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
            users={users} 
            currentUser={currentUser} 
            currentLanguage={currentLanguage}
            dichvuList={dichvuList} 
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
            dichvuList={dichvuList} 
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
                          if (col.key === "nguoiPhuTrach" && !currentUser?.is_admin && !currentUser?.is_director && !currentUser?.is_accountant) return null;
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

           <div className="table-wrapper mt-3" style={{marginLeft:70}}>
            <div className="table-responsive" style={{ paddingLeft: "0px", position: "relative", maxHeight: "calc(100vh - 340px)", overflow: "auto", borderBottom: "1px solid #dee2e6" }} ref={tableContainerRef}>
              <table className="table table-bordered table-hover align-middle mb-0">
                <thead>
                  <tr>
                    {tableHeaders.map((header, i) => {
                      const availableKeys = initialColumnKeys.filter(k => {
                        if (k.key === 'nguoiPhuTrach' && !currentUser?.is_admin && !currentUser?.is_director && !currentUser?.is_accountant) return false;
                        if (k.key === 'invoiceUrl' && !canViewFinance) return false;
                        return true;
                      });
                      const currentKey = availableKeys[i]?.key;
                      const allowedPinKeys = ["id", "hoTen", "maVung", "sdt", "email"];
                      if (currentKey && !isVisible(currentKey)) return null;

                      return (
                        <th key={i} className={isPinned(currentKey) ? "sticky-col" : ""}
                          style={{ 
                              // --- CẬP NHẬT STICKY HEADER ---
                              position: "sticky",         // Luôn dính
                              top: 0,                     // Dính lên đỉnh
                              left: isPinned(currentKey) ? "0" : "auto", 
                              zIndex: isPinned(currentKey) ? 20 : 10, // Header Pin cao hơn Header thường
                              backgroundColor: "#2c4d9e", 
                              color: "#ffffff",           
                              borderRight: "1px solid #4a6fdc", 
                              textAlign: "center",
                              verticalAlign: "middle",
                              boxShadow: "0 1px 2px rgba(0,0,0,0.2)" // Thêm bóng nhẹ để tách biệt với body
                          }}
                        >
                          <div className="d-flex justify-content-center align-items-center position-relative w-100" style={{ minHeight: "24px", paddingRight: "28px" }}>
                            <span>{header}</span>
                            {allowedPinKeys.includes(currentKey) && (
                            <button 
                              className={`btn btn-sm d-flex align-items-center justify-content-center text-white ${isPinned(currentKey) ? "btn-danger" : ""}`} 
                              style={{ 
                                  width: 24, height: 24, padding: 0, borderRadius: "3px", 
                                  position: "absolute", right: "2px", top: "50%",
                                  transform: "translateY(-50%)",
                                  opacity: isPinned(currentKey) ? 1 : 0.5 
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
            </div>
            
            {/* --- DI CHUYỂN TỔNG DOANH THU RA ĐÂY (NẰM NGOÀI TABLE-RESPONSIVE) --- */}
            {canViewFinance && (
                <div className="d-flex justify-content-end align-items-center px-3 py-2 bg-light border-start border-end border-bottom">
                  <span className="me-2 text-muted fw-semibold">Tổng doanh thu sau chiết khấu:</span>
                  <span className="fs-6 fw-bold text-primary">
                      {data.reduce((sum, i) => sum + (i.DoanhThuSauChietKhau || 0), 0).toLocaleString("vi-VN")} đ
                  </span>
                </div>
            )}

            {/* Pagination giữ nguyên */}
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
        
        /* --- CSS MỚI CHO STICKY --- */
        /* Cột dữ liệu (td) khi ghim thì nền trắng */
        td.sticky-col { 
            position: sticky !important; 
            left: 0; 
            z-index: 5 !important; 
            background-color: #ffffff !important; 
            
        }
        
        th.sticky-col { 
            position: sticky !important; 
            left: 0; 
            z-index: 15 !important; 
            background-color: #2c4d9e !important; 
            color: #ffffff !important;
          
        }
        
        .table-responsive { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
};

export default B2CPage;