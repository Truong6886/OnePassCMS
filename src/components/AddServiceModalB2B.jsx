import React, { useState, useEffect, useRef } from "react";
import { X, Plus, Eye, EyeOff, ChevronDown } from "lucide-react";
import ReactDOM from "react-dom";
import { showToast } from "../utils/toast";
import { authenticatedFetch } from "../utils/api";

const API_BASE = window.location.hostname === "localhost"
  ? "http://localhost:5000/api"
  : "https://onepasscms-backend-tvdy.onrender.com/api";

const ModernSelect = ({ name, value, options, onChange, placeholder, disabled, twoColumns = false, height = "38px", footerAction, width = "100%", noBorder = false, backgroundColor = "#ffffff" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const selectedOption = options.find(opt => String(opt.value) === String(value));
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  const updatePosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownPosition({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!containerRef.current?.contains(event.target) && !dropdownRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) updatePosition();
  }, [isOpen]);

  return (
    <div className="position-relative" ref={containerRef} style={{ width, position: "relative" }}>
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          width: "100%", padding: "0 14px", borderRadius: noBorder ? "0" : "10px",
          border: noBorder ? "none" : "1px solid #d1d5db", fontSize: "13px", color: "#374151",
          backgroundColor: disabled ? "#F3F4F6" : backgroundColor,
          cursor: disabled ? "not-allowed" : "pointer",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          userSelect: "none", height: height, transition: "all 0.2s"
        }}
      >
        <span className="text-truncate" style={{ color: value ? "#111827" : "#9CA3AF" }}>{displayLabel}</span>
        <ChevronDown size={16} color="#6B7280" />
      </div>

      {isOpen && !disabled && ReactDOM.createPortal(
        <div className="bg-white rounded border" ref={dropdownRef} style={{
          position: "fixed", top: `${dropdownPosition.top}px`, left: `${dropdownPosition.left}px`,
          width: `${dropdownPosition.width}px`, zIndex: 99999, maxHeight: "300px", overflowY: "auto",
          borderRadius: "8px", padding: "4px", boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
          border: "1px solid #e5e7eb", backgroundColor: "#ffffff"
        }}>
          {options.map((opt, idx) => (
            <div key={idx} onClick={() => { onChange({ target: { name, value: opt.value } }); setIsOpen(false); }}
              style={{
                cursor: "pointer", fontSize: "12px", padding: "8px 12px",
                color: String(opt.value) === String(value) ? "#2563eb" : "#374151",
                backgroundColor: String(opt.value) === String(value) ? "#EFF6FF" : "transparent",
              }}
              onMouseEnter={(e) => { if(String(opt.value) !== String(value)) e.target.style.backgroundColor = "#F3F4F6"; }}
              onMouseLeave={(e) => { if(String(opt.value) !== String(value)) e.target.style.backgroundColor = "transparent"; }}
            >
              {opt.label}
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
};

const AddServiceModalB2B = ({ isOpen, onClose, onSave, currentUser, currentLanguage, companiesList = [], b2bServiceMapping = {} }) => {
  const formatNumber = (num) => num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "0";
  const unformatMoney = (val) => val ? parseFloat(val.toString().replace(/\./g, "")) : 0;

  const allServiceOptions = React.useMemo(() => {
    const services = [];
    Object.entries(b2bServiceMapping || {}).forEach(([category, items]) => {
      if (items && Array.isArray(items)) {
        items.forEach(item => {
          services.push({ value: item, label: item, category: category });
        });
      }
    });
    return services;
  }, [b2bServiceMapping]);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userList, setUserList] = useState([]);

  useEffect(() => {
    if (isOpen) {
      // Set người phụ trách mặc định là người đang đăng nhập
      if (currentUser?.id) {
        setFormData(prev => ({ 
          ...prev, 
          NguoiPhuTrachId: String(currentUser.id) 
        }));
      }
      
      // Fetch danh sách users
      authenticatedFetch(`${API_BASE}/User`)
        .then(async (res) => {
          if (!res || !res.ok) {
            const text = await res?.text?.();
            throw new Error(`Fetch users failed: ${res?.status || "no-status"} ${text || ""}`.trim());
          }
          return res.json();
        })
        .then(data => {
          if (data?.success) setUserList(data.data || []);
        })
        .catch(err => console.error("Fetch users error:", err));
    } else {
      // Reset form khi đóng modal
      setFormData({
        DoanhNghiepID: "",
        SoDKKD: "",
        NgayDangKy: new Date().toISOString().split('T')[0],
        NgayHen: "",
        GhiChu: "",
        NguoiPhuTrachId: "",
        ConfirmPassword: "",
        YeuCauHoaDon: "No",
        DiaChiNhan: "",
        InvoiceUrl: ""
      });
      setUploadedDocs([]);
      setServiceRows([{
        name: "", donvi: "", soluong: "1", loaigoi: "",
        dongia: "", thue: "0", chietkhau: "0", thanhtien: ""
      }]);
    }
  }, [isOpen, currentUser]);

  const fileInputRef = useRef(null);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [serviceRows, setServiceRows] = useState([{
    name: "", donvi: "", soluong: "1", loaigoi: "",
    dongia: "", thue: "0", chietkhau: "0", thanhtien: ""
  }]);

  const handleAddServiceRow = () => {
    setServiceRows([...serviceRows, {
      name: "", donvi: "", soluong: "1", loaigoi: "",
      dongia: "", thue: "0", chietkhau: "0", thanhtien: ""
    }]);
  };

  const handleRemoveServiceRow = (index) => {
    const newRows = [...serviceRows];
    newRows.splice(index, 1);
    if (newRows.length === 0) {
      setServiceRows([{
        name: "", donvi: "", soluong: "1", loaigoi: "",
        dongia: "", thue: "0", chietkhau: "0", thanhtien: ""
      }]);
    } else {
      setServiceRows(newRows);
    }
  };

  const handleServiceRowChange = (index, field, value) => {
    const newRows = [...serviceRows];
    newRows[index][field] = value;

    if (field === "soluong" || field === "dongia" || field === "thue" || field === "chietkhau") {
      const soluong = parseFloat(newRows[index].soluong) || 0;
      const dongia = unformatMoney(newRows[index].dongia) || 0;
      const thue = parseFloat(newRows[index].thue) || 0;
      const chietkhau = parseFloat(newRows[index].chietkhau) || 0;
      
      const subtotal = soluong * dongia;
      const thueAmount = subtotal * (thue / 100);
      const chietkhauAmount = subtotal * (chietkhau / 100);
      const thanhtien = subtotal + thueAmount - chietkhauAmount;
      const roundedThanhtien = Math.round(thanhtien);
      
      newRows[index].thanhtien = formatNumber(Math.max(0, roundedThanhtien));
    }

    if (field === "dongia") {
      const raw = value.replace(/\./g, "");
      if (!isNaN(raw)) {
        newRows[index][field] = raw.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      }
    }

    setServiceRows(newRows);
  };

  const calculateTotals = () => {
    const subtotal = serviceRows.reduce((sum, row) => {
      const soluong = parseFloat(row.soluong) || 0;
      const dongia = unformatMoney(row.dongia) || 0;
      return sum + (soluong * dongia);
    }, 0);

    const totalThue = serviceRows.reduce((sum, row) => {
      const soluong = parseFloat(row.soluong) || 0;
      const dongia = unformatMoney(row.dongia) || 0;
      const thue = parseFloat(row.thue) || 0;
      return sum + ((soluong * dongia) * (thue / 100));
    }, 0);

    const total = serviceRows.reduce((sum, row) => {
      return sum + (unformatMoney(row.thanhtien) || 0);
    }, 0);

    return { subtotal: Math.round(subtotal), totalThue: Math.round(totalThue), total: Math.round(total) };
  };

  const totals = calculateTotals();

  const [formData, setFormData] = useState({
    DoanhNghiepID: "",
    SoDKKD: "",
    NgayDangKy: new Date().toISOString().split('T')[0],
    NgayHen: "",
    GhiChu: "",
    NguoiPhuTrachId: "",
    ConfirmPassword: "",
    YeuCauHoaDon: "No",
    DiaChiNhan: "Sở Tài Chính",
    InvoiceUrl: ""
  });

  const handleDocUpload = async (files) => {
    if (!files || files.length === 0) return;

    const uploadData = new FormData();
    Array.from(files).forEach((file) => uploadData.append("files", file));

    setUploadingDocs(true);
    try {
      const res = await authenticatedFetch(`${API_BASE}/upload-b2b-doc`, {
        method: "POST",
        body: uploadData
      });

      if (!res || !res.ok) {
        const text = await res?.text?.();
        throw new Error(text || "Upload failed");
      }

      const data = await res.json();
      if (data?.success) {
        const filesList = data.data || [];
        setUploadedDocs(filesList);
        setFormData((prev) => ({
          ...prev,
          InvoiceUrl: filesList[0]?.url || prev.InvoiceUrl
        }));
      } else {
        showToast(data?.message || "Upload thất bại", "error");
      }
    } catch (err) {
      console.error("Upload docs error:", err);
      showToast("Lỗi upload hồ sơ", "error");
    } finally {
      setUploadingDocs(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "DoanhNghiepID") {
      const selectedCompany = companiesList.find(c => String(c.ID) === String(value));
      if (selectedCompany) {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          SoDKKD: selectedCompany.SoDKKD || ""
        }));
      } else {
        setFormData(prev => ({ ...prev, [name]: value, SoDKKD: "" }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    if (!formData.DoanhNghiepID) {
      showToast("Vui lòng chọn Khách hàng", "warning");
      return;
    }

    const hasService = serviceRows.some(row => row.name && row.name.trim() !== "");
    if (!hasService) {
      showToast("Vui lòng chọn ít nhất một dịch vụ", "warning");
      return;
    }

    if (!formData.NguoiPhuTrachId) {
      showToast("Vui lòng chọn người phụ trách", "warning");
      return;
    }

    if (!formData.ConfirmPassword) {
      showToast("Vui lòng nhập mật khẩu xác nhận", "warning");
      return;
    }

    const validServices = serviceRows.filter(row => row.name && row.name.trim() !== "");
    const danhMucList = validServices.map(row => row.name).join(" + ");

    let totalRevenue = 0, totalTax = 0, totalDiscount = 0;
    
    const chiTietDichVuData = validServices.map(row => {
      const soluong = parseFloat(row.soluong) || 0;
      const dongia = unformatMoney(row.dongia) || 0;
      const thue = parseFloat(row.thue) || 0;
      const chietkhau = parseFloat(row.chietkhau) || 0;
      
      const subtotal = soluong * dongia;
      const taxAmount = subtotal * (thue / 100);
      const discountAmount = subtotal * (chietkhau / 100);
      const totalAmount = Math.round(subtotal + taxAmount - discountAmount);
      
      totalRevenue += subtotal;
      totalTax += taxAmount;
      totalDiscount += discountAmount;
      
      return { name: row.name, donvi: row.donvi, soluong, loaigoi: row.loaigoi, dongia, thue, chietkhau, thanhtien: totalAmount };
    });

    const finalRevenue = totalRevenue + totalTax - totalDiscount;
    const roundedRevenue = Math.round(totalRevenue);
    const roundedTax = Math.round(totalTax);
    const roundedDiscount = Math.round(totalDiscount);
    const roundedFinalRevenue = Math.round(finalRevenue);
    const averageDiscountPercent = totalRevenue > 0 ? (totalDiscount / totalRevenue) * 100 : 0;

    const payload = {
      DoanhNghiepID: formData.DoanhNghiepID,
      SoDKKD: formData.SoDKKD,
      NgayBatDau: formData.NgayDangKy,
      NgayKetThuc: formData.NgayHen,
      NgayHoanThanh: formData.NgayHen,
      GhiChu: formData.GhiChu || "",
      NguoiPhuTrachId: formData.NguoiPhuTrachId || currentUser?.id || "",
      ConfirmPassword: formData.ConfirmPassword,
      DanhMuc: danhMucList,
      TenDichVu: danhMucList,
      LoaiDichVu: validServices[0]?.category || "Khác",
      DoanhThuTruocChietKhau: roundedRevenue,
      DoanhThu: roundedFinalRevenue,
      MucChietKhau: Math.round(averageDiscountPercent * 100) / 100,
      SoTienChietKhau: roundedDiscount,
      DoanhThuSauChietKhau: roundedFinalRevenue,
      Vi: 0,
      ThuTucCapToc: "No",
      YeuCauHoaDon: formData.YeuCauHoaDon || "No",
      TrangThai: "Chờ duyệt",
      DiaChiNhan: formData.DiaChiNhan || "",
      InvoiceUrl: formData.InvoiceUrl || "",
      ChiTietDichVu: {
        services: chiTietDichVuData,
        totals: {
          subtotal: roundedRevenue,
          tax: roundedTax,
          discount: roundedDiscount,
          total: roundedFinalRevenue
        }
      }
    };

    setLoading(true);
    try {
      await onSave(payload);
      onClose();
    } catch (err) {
      console.error("Save error:", err);
      showToast("Lỗi khi lưu dịch vụ", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputStyle = {
    width: "100%", height: "44px", padding: "0 14px", borderRadius: "10px",
    border: "1px solid #d1d5db", fontSize: "13px", color: "#111827",
    backgroundColor: "#ffffff", outline: "none"
  };
  const labelStyle = { fontSize: "13px", fontWeight: "600", color: "#111827", marginBottom: "4px", display: "block" };

  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" 
      style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1050, backdropFilter: "blur(3px)" }}>
      <div className="bg-white position-relative" 
        style={{ width: "980px", maxWidth: "95%", borderRadius: "14px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)", maxHeight: "90vh", overflowY: "auto", padding: "32px" }}>
        <button onClick={onClose} 
          className="position-absolute d-flex align-items-center justify-content-center border-0 bg-light rounded-circle" 
          style={{ top: "15px", right: "15px", width: "32px", height: "32px", cursor: "pointer" }}>
          <X size={18} />
        </button>

        <div className="text-center mb-4">
          <h3 className="fw-bold m-0" style={{ fontSize: "20px", color: "#111827" }}>Đăng ký dịch vụ mới (B2B)</h3>
          <p className="text-muted m-0 mt-1" style={{ fontSize: "13px" }}>Nhập thông tin dịch vụ B2B</p>
        </div>

        <div className="row g-3">
          {/* THÔNG TIN KHÁCH HÀNG & NGÀY THÁNG */}
          <div className="col-md-5" style={{ paddingRight: "30px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ minWidth: "150px", flexShrink: 0 }}>
                <label style={{...labelStyle, marginBottom: "0", display: "block"}}>
                  Khách hàng <span className="text-danger">*</span>
                </label>
                <p style={{ fontSize: "11px", color: "#9ca3af", margin: "3px 0 0 0", fontStyle: "italic", lineHeight: "1.3" }}>
                  Doanh nghiệp hoặc cá nhân
                </p>
              </div>
              <div style={{ flex: 1 }}>
                <ModernSelect
                  name="DoanhNghiepID"
                  height="44px"
                  value={formData.DoanhNghiepID}
                  placeholder="Chọn Khách hàng"
                  options={companiesList.map(c => ({ value: String(c.ID), label: c.TenDoanhNghiep }))}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            {/* Số ĐKKD */}
            <input type="hidden" name="SoDKKD" value={formData.SoDKKD} />
          </div>
          
          <div className="col-md-7" style={{ paddingLeft: "30px" }}>
            <div className="row g-3">
              <div className="col-12">
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ minWidth: "110px", flexShrink: 0 }}>
                    <label style={{...labelStyle, marginBottom: "0", display: "block"}}>
                      Ngày đăng ký <span className="text-danger">*</span>
                    </label>
                    <p style={{ fontSize: "11px", color: "#9ca3af", margin: "3px 0 0 0", fontStyle: "italic", lineHeight: "1.3" }}>
                      Ngày đăng ký trên hệ thống
                    </p>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div 
                      onClick={(e) => e.currentTarget.querySelector('input').showPicker?.()}
                      style={{ cursor: "pointer" }}
                    >
                      <input 
                        type="date" 
                        name="NgayDangKy" 
                        style={{...inputStyle, height: "44px", cursor: "pointer"}}
                        value={formData.NgayDangKy}
                        onChange={handleInputChange}
                        placeholder="Chọn ngày"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12">
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ minWidth: "110px", flexShrink: 0 }}>
                    <label style={{...labelStyle, marginBottom: "0", display: "block"}}>
                      Ngày hẹn
                    </label>
                    <p style={{ fontSize: "11px", color: "#9ca3af", margin: "3px 0 0 0", fontStyle: "italic", lineHeight: "1.3" }}>
                      Ngày tháng muốn nhận hồ sơ
                    </p>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div 
                      onClick={(e) => e.currentTarget.querySelector('input').showPicker?.()}
                      style={{ cursor: "pointer" }}
                    >
                      <input 
                        type="date" 
                        name="NgayHen" 
                        style={{...inputStyle, height: "44px", cursor: "pointer"}}
                        value={formData.NgayHen}
                        onChange={handleInputChange}
                        placeholder="mm/dd/yyyy"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Service Table */}
          <div className="col-12 mt-3">
            <label style={{...labelStyle, fontSize: "14px"}}>Dịch vụ <span className="text-danger">*</span></label>
            <div style={{ border: "none", borderRadius: "10px", overflow: "visible" }}>
              <table style={{ width: "100%", fontSize: "13px", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#ffffff" }}>
                    <th style={{ width: "30px" }}></th>
                    <th style={{ padding: "12px 10px", textAlign: "left", fontWeight: "700", color: "#111827" }}>Dịch vụ</th>
                    <th style={{ padding: "12px 10px", textAlign: "center", fontWeight: "700", color: "#111827" }}>Đơn vị</th>
                    <th style={{ padding: "12px 10px", textAlign: "center", fontWeight: "700", color: "#111827" }}>Số lượng</th>
                    <th style={{ padding: "12px 10px", textAlign: "center", fontWeight: "700", color: "#111827" }}>Loại gói</th>
                    <th style={{ padding: "12px 10px", textAlign: "center", fontWeight: "700", color: "#111827" }}>Đơn giá</th>
                    <th style={{ padding: "12px 10px", textAlign: "center", fontWeight: "700", color: "#111827" }}>Thuế</th>
                    <th style={{ padding: "12px 10px", textAlign: "center", fontWeight: "700", color: "#111827" }}>Chiết khấu</th>
                    <th style={{ padding: "12px 10px", textAlign: "center", fontWeight: "700", color: "#111827" }}>Thành tiền</th>
                    <th style={{ width: "30px" }}></th>
                  </tr>
                  <tr style={{ backgroundColor: "#f3f4f6" }}>
                    <td style={{ width: "30px", padding: "10px", textAlign: "center" }}></td>
                    <td style={{ padding: "10px" }}>
                      <span style={{ fontSize: "12px", color: "#9ca3af", fontStyle: "italic" }}>Nhập nội dung</span>
                    </td>
                    <td style={{ padding: "10px" }}></td>
                    <td style={{ padding: "10px" }}></td>
                    <td style={{ padding: "10px" }}></td>
                    <td style={{ padding: "10px" }}></td>
                    <td style={{ padding: "10px" }}></td>
                    <td style={{ padding: "10px" }}></td>
                    <td style={{ padding: "10px" }}></td>
                    <td style={{ padding: "10px" }}></td>
                  </tr>
                </thead>
                <tbody>
                  {serviceRows.map((row, index) => (
                    <tr key={index} style={{ backgroundColor: "#ffffff" }}>
                      <td style={{ padding: "8px", textAlign: "center", color: "#d1d5db" }}>
                        <span style={{ fontSize: "14px", cursor: "grab" }}>⋮⋮</span>
                      </td>
                      <td style={{ padding: "8px" }}>
                        <ModernSelect
                          name={`service-${index}`}
                          height="32px"
                          value={row.name}
                          placeholder={index === 0 ? "Nhập dịch vụ" : "Chọn"}
                          noBorder={true}
                          backgroundColor="white"
                          options={[
                            { value: "", label: "Chọn dịch vụ" },
                            ...allServiceOptions
                          ]}
                          onChange={(e) => handleServiceRowChange(index, "name", e.target.value)}
                        />
                        {index === 0 && (
                          <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "4px", fontStyle: "italic" }}>Nhập ghi chú</div>
                        )}
                      </td>
                      <td style={{ padding: "8px" }}>
                        <ModernSelect
                          name={`donvi-${index}`}
                          height="32px"
                          value={row.donvi}
                          placeholder="Chọn"
                          noBorder={true}
                          backgroundColor="white"
                          options={[
                            { value: "", label: "Chọn" },
                            { value: "Hồ sơ", label: "Hồ sơ" },
                            { value: "Trang", label: "Trang" },
                            { value: "Bản", label: "Bản" }
                          ]}
                          onChange={(e) => handleServiceRowChange(index, "donvi", e.target.value)}
                        />
                      </td>
                      <td style={{ padding: "8px" }}>
                        <input
                          type="number"
                          value={row.soluong}
                          onChange={(e) => handleServiceRowChange(index, "soluong", e.target.value)}
                          style={{ width: "100%", height: "32px", textAlign: "center", padding: "4px", border: "none", borderRadius: "0", fontSize: "13px", color: "#111827", backgroundColor: "white", outline: "none" }}
                        />
                      </td>
                      <td style={{ padding: "8px" }}>
                        <ModernSelect
                          name={`loaigoi-${index}`}
                          height="32px"
                          value={row.loaigoi}
                          placeholder="Chọn"
                          noBorder={true}
                          backgroundColor="white"
                          options={[
                            { value: "", label: "Chọn" },
                            { value: "Thông thường", label: "Thông thường" },
                            { value: "Cấp tốc", label: "Cấp tốc" }
                          ]}
                          onChange={(e) => handleServiceRowChange(index, "loaigoi", e.target.value)}
                        />
                      </td>
                      <td style={{ padding: "8px" }}>
                        <input
                          type="text"
                          value={row.dongia}
                          onChange={(e) => handleServiceRowChange(index, "dongia", e.target.value)}
                          placeholder="Nhập vào"
                          style={{ width: "100%", height: "32px", textAlign: "right", padding: "4px 8px", border: "none", borderRadius: "0", fontSize: "13px", color: "#111827", backgroundColor: "white", outline: "none" }}
                        />
                      </td>
                      <td style={{ padding: "8px" }}>
                        <ModernSelect
                          name={`thue-${index}`}
                          height="32px"
                          value={row.thue}
                          placeholder="Chọn"
                          noBorder={true}
                          backgroundColor="white"
                          options={[
                            { value: "0", label: "0" },
                            { value: "5", label: "5%" },
                            { value: "10", label: "10%" }
                          ]}
                          onChange={(e) => handleServiceRowChange(index, "thue", e.target.value)}
                        />
                      </td>
                      <td style={{ padding: "8px" }}>
                        <ModernSelect
                          name={`chietkhau-${index}`}
                          height="32px"
                          value={row.chietkhau}
                          placeholder="Chọn"
                          noBorder={true}
                          backgroundColor="white"
                          options={[
                            { value: "0", label: "0" },
                            { value: "5", label: "5%" },
                            { value: "10", label: "10%" },
                            { value: "15", label: "15%" },
                            { value: "20", label: "20%" }
                          ]}
                          onChange={(e) => handleServiceRowChange(index, "chietkhau", e.target.value)}
                        />
                      </td>
                      <td style={{ padding: "8px" }}>
                        <input
                          type="text"
                          value={row.thanhtien}
                          readOnly
                          style={{ width: "100%", height: "32px", textAlign: "right", padding: "4px 8px", border: "none", borderRadius: "0", fontSize: "13px", color: "#111827", backgroundColor: "white", outline: "none" }}
                        />
                      </td>
                      <td style={{ padding: "8px", textAlign: "center" }}>
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveServiceRow(index)}
                            style={{
                              width: "20px",
                              height: "20px",
                              border: "none",
                              borderRadius: "0",
                              backgroundColor: "transparent",
                              color: "#ef4444",
                              cursor: "pointer",
                              fontSize: "14px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: "0",
                              lineHeight: "1"
                            }}
                          >
                            −
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Nút thêm dịch vụ */}
              <div style={{ padding: "10px", borderTop: "1px solid #e5e7eb", display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={handleAddServiceRow}
                  style={{
                    padding: "6px 0",
                    fontSize: "13px",
                    backgroundColor: "transparent",
                    color: "#3b82f6",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontStyle: "italic"
                  }}
                >
                  <Plus size={14} />
                  Thêm Dịch vụ
                </button>
                <button
                  type="button"
                  style={{
                    padding: "6px 0",
                    fontSize: "13px",
                    backgroundColor: "transparent",
                    color: "#3b82f6",
                    border: "none",
                    cursor: "pointer",
                    fontStyle: "italic"
                  }}
                >
                  Thêm phần
                </button>
                <button
                  type="button"
                  style={{
                    padding: "6px 0",
                    fontSize: "13px",
                    backgroundColor: "transparent",
                    color: "#3b82f6",
                    border: "none",
                    cursor: "pointer",
                    fontStyle: "italic"
                  }}
                >
                  Thêm ghi chú
                </button>
              </div>
            </div>
          </div>

          {/* Invoice + Receiving Address + Upload - Centered Layout */}
          <div className="col-12" style={{ display: "flex", flexDirection: "column", gap: "20px", alignItems: "center" }}>
            {/* Yêu cầu hóa đơn */}
            <div style={{ width: "100%", maxWidth: "800px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px", marginBottom: "8px" }}>
                <div>
                  <label style={{...labelStyle, marginBottom: "0", display: "block"}}>
                    Yêu cầu xuất hóa đơn <span className="text-danger">*</span>
                  </label>
                  <p style={{ fontSize: "11px", color: "#9ca3af", margin: "3px 0 0 0", fontStyle: "italic", lineHeight: "1.3" }}>
                    Hóa đơn sẽ được gửi qua email đăng ký khi đăng ký doanh nghiệp trên hệ thống.
                  </p>
                </div>
                <div style={{ display: "flex", gap: "12px", minWidth: "320px" }}>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, YeuCauHoaDon: "Yes" }))}
                    style={{
                      flex: 1,
                      height: "48px",
                      borderRadius: "12px",
                      border: formData.YeuCauHoaDon === "Yes" ? "2px solid #111827" : "1px solid #e5e7eb",
                      backgroundColor: formData.YeuCauHoaDon === "Yes" ? "#ffffff" : "#ffffff",
                      fontSize: "13px",
                      fontWeight: "500",
                      cursor: "pointer",
                      color: "#111827",
                      transition: "all 0.2s"
                    }}
                  >
                    Có
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, YeuCauHoaDon: "No" }))}
                    style={{
                      flex: 1,
                      height: "48px",
                      borderRadius: "12px",
                      border: formData.YeuCauHoaDon === "No" ? "2px solid #111827" : "1px solid #9ca3af",
                      backgroundColor: formData.YeuCauHoaDon === "No" ? "#f3f4f6" : "#f3f4f6",
                      fontSize: "13px",
                      fontWeight: "500",
                      cursor: "pointer",
                      color: "#111827",
                      transition: "all 0.2s"
                    }}
                  >
                    Không
                  </button>
                </div>
              </div>
            </div>

            {/* Nơi tiếp nhận hồ sơ */}
            <div style={{ width: "100%", maxWidth: "800px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "20px", marginBottom: "8px" }}>
                <div>
                  <label style={{...labelStyle, marginBottom: "0", display: "block"}}>
                    Nơi tiếp nhận hồ sơ
                  </label>
                  <p style={{ fontSize: "11px", color: "#9ca3af", margin: "3px 0 0 0", fontStyle: "italic", lineHeight: "1.3" }}>
                    Cơ quan/Quốc tế hóa tiếp nhận hồ sơ
                  </p>
                </div>
                <div style={{ display: "flex", gap: "12px", minWidth: "320px" }}>
                  <input
                    type="text"
                    value="Sở Tài Chính"
                    disabled
                    placeholder="Sở Tài Chính"
                    style={{...inputStyle, flex: 1, backgroundColor: "#f3f4f6", cursor: "not-allowed", color: "#111827", border: "1px solid #9ca3af", fontWeight: "500", borderRadius: "12px", textAlign: "center"}}
                  />
                </div>
              </div>
            </div>

            {/* Tải lên hồ sơ dịch vụ */}
            <div style={{ width: "100%", maxWidth: "800px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px", marginBottom: "8px" }}>
                <div>
                  <label style={{...labelStyle, marginBottom: "0", display: "block"}}>
                    Tải lên hồ sơ dịch vụ
                  </label>
                  <p style={{ fontSize: "11px", color: "#9ca3af", margin: "3px 0 0 0", fontStyle: "italic", lineHeight: "1.3" }}>
                    Tài liệu các hồ sơ đã nhận kiểm tra
                  </p>
                </div>
                <div style={{ display: "flex", gap: "12px", minWidth: "320px" }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={(e) => handleDocUpload(e.target.files)}
                    style={{ display: "none" }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingDocs}
                    style={{
                      flex: 1,
                      height: "48px",
                      borderRadius: "12px",
                      border: "1px solid #111827",
                      backgroundColor: "#f3f4f6",
                      fontSize: "13px",
                      fontWeight: "500",
                      cursor: uploadingDocs ? "not-allowed" : "pointer",
                      color: "#111827",
                      transition: "all 0.2s"
                    }}
                  >
                    {uploadingDocs ? "Đang tải..." : "Chọn file"}
                  </button>
                  <button
                    type="button"
                    onClick={() => formData.InvoiceUrl && window.open(formData.InvoiceUrl, "_blank")}
                    disabled={!formData.InvoiceUrl}
                    style={{
                      flex: 1,
                      height: "48px",
                      borderRadius: "12px",
                      border: "1px solid #111827",
                      backgroundColor: "#f3f4f6",
                      fontSize: "13px",
                      fontWeight: "500",
                      cursor: formData.InvoiceUrl ? "pointer" : "not-allowed",
                      color: "#111827",
                      transition: "all 0.2s"
                    }}
                  >
                    Xem hồ sơ
                  </button>
                </div>
              </div>
              {uploadedDocs.length > 0 && (
                <p style={{ fontSize: "12px", color: "#6b7280", textAlign: "right", margin: "6px 0 0 0" }}>
                  {uploadedDocs.length} file đã tải
                </p>
              )}
            </div>
          </div>

          {/* Notes + Totals */}
          <div className="col-12" style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: "30px", alignItems: "start" }}>
            <div>
              <label style={{ fontSize: "13px", fontWeight: "400", color: "#9ca3af", marginBottom: "8px", display: "block" }}>Ghi chú :</label>
              <textarea rows={3} name="GhiChu" value={formData.GhiChu} onChange={handleInputChange} placeholder="Nhập ghi chú..." 
                style={{ width: "100%", minHeight: "88px", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "13px", color: "#111827", backgroundColor: "#f9fafb", outline: "none", resize: "vertical" }} />
            </div>
            <div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ color: "#6b7280" }}>Số tiền trước thuế :</span>
                  <span style={{ color: "#111827" }}>{formatNumber(totals.subtotal)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ color: "#6b7280" }}>Thuế GTGT :</span>
                  <span style={{ color: "#111827" }}>{formatNumber(totals.totalThue)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", borderTop: "1px solid #d1d5db", paddingTop: "8px" }}>
                  <span style={{ color: "#111827", fontWeight: "700" }}>TỔNG :</span>
                  <span style={{ color: "#111827", fontWeight: "700" }}>{formatNumber(totals.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Người phụ trách */}
          <div className="col-md-6 offset-md-3">
            <label style={labelStyle}>Người phụ trách <span className="text-danger">*</span></label>
            <ModernSelect
              name="NguoiPhuTrachId"
              height="44px"
              value={formData.NguoiPhuTrachId}
              placeholder="Chọn người phụ trách"
              disabled={!(currentUser?.is_director || currentUser?.is_accountant)}
              options={
                (currentUser?.is_director || currentUser?.is_accountant)
                  ? (userList.length > 0 
                      ? userList.map(u => ({ value: String(u.id), label: `${u.name} (${u.username})` }))
                      : [])
                  : currentUser 
                    ? [{ value: String(currentUser.id), label: `${currentUser.name} (${currentUser.username})` }]
                    : []
              }
              onChange={handleInputChange}
            />
            {!(currentUser?.is_director || currentUser?.is_accountant) && (
              <p style={{ fontSize: "11px", color: "#9ca3af", margin: "3px 0 0 0", fontStyle: "italic" }}>
                Chỉ quản lý mới có thể chỉ định người khác
              </p>
            )}
          </div>

          {/* Password */}
          <div className="col-md-6 offset-md-3">
            <label style={labelStyle}>Mật khẩu xác nhận <span className="text-danger">*</span></label>
            <div className="position-relative">
              <input type={showConfirmPassword ? "text" : "password"} 
                name="ConfirmPassword" value={formData.ConfirmPassword} onChange={handleInputChange} 
                placeholder="Mật khẩu xác nhận" style={{...inputStyle, paddingRight: "35px"}} />
              <span className="position-absolute top-50 translate-middle-y end-0 me-2" style={{ cursor: "pointer" }} 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <div className="col-12 mt-3 text-center">
            <button type="button" onClick={handleSave} disabled={loading} 
              style={{ width: "220px", padding: "10px 16px", backgroundColor: "#22c55e", color: "white", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: "600", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", margin: "0 auto", boxShadow: "0 6px 16px rgba(34, 197, 94, 0.35)" }}>
              {loading ? <span className="spinner-border spinner-border-sm"></span> : "Đăng ký Dịch Vụ"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddServiceModalB2B;
