import React, { useState, useEffect, useRef } from "react";
import { X, Plus, Eye, EyeOff, ChevronDown } from "lucide-react";
import ReactDOM from "react-dom";
import { showToast } from "../utils/toast";
import { authenticatedFetch } from "../utils/api";

const API_BASE = window.location.hostname === "localhost"
  ? "http://localhost:5000/api"
  : "https://onepasscms-backend-tvdy.onrender.com/api";
const CUSTOM_SERVICE_OPTION_VALUE = "__ADD_CUSTOM_SERVICE__";
const CUSTOM_SERVICE_TYPE_VALUE = "__ADD_CUSTOM_SERVICE_TYPE__";

const normalizeStatusText = (value) =>
  String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const isCompletedStatus = (value) => normalizeStatusText(value) === "hoan thanh";

const getTodayDateString = () => new Date().toISOString().split("T")[0];

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

const AddServiceModalB2B = ({ isOpen, onClose, onSave, currentUser, currentLanguage, companiesList = [], b2bServiceMapping = {}, editingService = null, actionMode = "create" }) => {
  const formatNumber = (num) => num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "0";
  const unformatMoney = (val) => val ? parseFloat(val.toString().replace(/\./g, "")) : 0;
  const isApproveMode = actionMode === "approve";
  
  const normalizeServiceType = (val) => {
    if (!val) return "";
    const normalized = val.trim().toLowerCase();
    const match = Object.keys(b2bServiceMapping || {}).find(key => key.trim().toLowerCase() === normalized);
    return match || val;
  };

  const normalizePackageOption = (value) => {
    if (value === "Thông thường") return "thường";
    if (value === "Cấp tốc") return "gấp 1";
    return value || "";
  };

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

  const createEmptyServiceRow = () => ({
    name: "", isCustomService: false, donvi: "", soluong: "1", loaigoi: "thường",
    dongia: "", thue: "0", chietkhau: "0", thanhtien: ""
  });

  const createEmptyServiceSection = () => ({
    serviceType: "",
    note: "",
    rows: [createEmptyServiceRow()]
  });

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userList, setUserList] = useState([]);
  const [serviceSections, setServiceSections] = useState([createEmptyServiceSection()]);
  const [existingService, setExistingService] = useState(null);

  const fileInputRef = useRef(null);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState([]);

  useEffect(() => {
    if (isOpen) {
      if (currentUser?.id) {
        setFormData(prev => ({ 
          ...prev, 
          NguoiPhuTrachId: String(currentUser.id) 
        }));
      }
      
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
        
      // Parse editingService nếu đang edit
      if (editingService) {
        const details = editingService.ChiTietDichVu || { main: {}, sub: [] };
        const savedMeta = details?.meta || {};
        const defaultPackage = normalizePackageOption(editingService.package || editingService.GoiDichVu || "thường") || "thường";
        const selectedCompany = companiesList.find(c => String(c.ID) === String(editingService.companyId || editingService.DoanhNghiepID));
        const fallbackPhone = selectedCompany?.SoDienThoai || selectedCompany?.phoneNumber || selectedCompany?.PhoneNumber || "";
        const fallbackEmail = selectedCompany?.Email || selectedCompany?.email || "";
        const mergedPhone = editingService.phoneNumber || editingService.SoDienThoai || editingService.PhoneNumber || fallbackPhone;
        const mergedEmail = editingService.email || editingService.Email || fallbackEmail;
        const parsePhone = (rawPhone = "") => {
          const phone = String(rawPhone || "").trim();
          if (!phone) return { maVung: "+84", soDienThoai: "" };
          if (phone.startsWith("+84")) return { maVung: "+84", soDienThoai: phone.slice(3).trim() };
          if (phone.startsWith("+82")) return { maVung: "+82", soDienThoai: phone.slice(3).trim() };
          return { maVung: "+84", soDienThoai: phone };
        };
        const { maVung, soDienThoai } = parsePhone(mergedPhone);

        setFormData({
          DoanhNghiepID: editingService.companyId || "",
          SoDKKD: editingService.soDKKD || "",
          MaVung: maVung,
          SoDienThoai: soDienThoai,
          Email: mergedEmail,
          NgayDangKy: editingService.startDate || new Date().toISOString().split('T')[0],
          NgayHen: editingService.appointmentDate || editingService.NgayKetThuc || "",
          TrangThai: isApproveMode ? "Đã duyệt" : (editingService.status || editingService.TrangThai || "Chờ duyệt"),
          GhiChu: editingService.GhiChu || "",
          NguoiPhuTrachId: editingService.picId ? String(editingService.picId) : (currentUser?.id ? String(currentUser.id) : ""),
          ConfirmPassword: "",
          YeuCauHoaDon: editingService.invoiceYN || "No",
          TenHinhThuc: editingService.TenHinhThuc || savedMeta.TenHinhThuc || "",
          NoiTiepNhanHoSo: savedMeta.NoiTiepNhanHoSo || "",
          DiaChiNhan: editingService.DiaChiNhan || "",
          InvoiceUrl: editingService.InvoiceUrl || ""
        });

        // Parse ChiTietDichVu
        
        if (details.services && Array.isArray(details.services) && details.services.length > 0) {
          // Cấu trúc mới: Group services theo serviceType
          const grouped = details.services.reduce((acc, s) => {
            const type = s.serviceType || editingService.serviceType || "Khác";
            if (!acc[type]) acc[type] = { rows: [], note: "" };
            if (!acc[type].note) {
              acc[type].note = String(s.note || s.ghiChu || s.serviceNote || "").trim();
            }
            acc[type].rows.push({
              name: s.name || "",
              isCustomService: Boolean(s.isCustomService || (s.codePrefix && String(s.codePrefix).trim().toUpperCase() === "ADD")),
              donvi: s.donvi || "",
              soluong: String(s.soluong || "1"),
              loaigoi: normalizePackageOption(s.loaigoi) || defaultPackage,
              dongia: s.dongia ? formatNumber(s.dongia) : "",
              thue: String(s.thue || "0"),
              chietkhau: String(s.chietkhau || "0"),
              thanhtien: s.thanhtien ? formatNumber(s.thanhtien) : ""
            });
            return acc;
          }, {});
          
          setServiceSections(Object.entries(grouped).map(([serviceType, group]) => ({
            serviceType,
            note: group.note || "",
            rows: group.rows
          })));
        } else if (details.sub && details.sub.length > 0) {
          // Cấu trúc cũ: Tạo 1 section với tất cả dịch vụ
          setServiceSections([{
            serviceType: editingService.serviceType || "Khác",
            note: "",
            rows: details.sub.map(s => ({
              name: s.name || "",
              isCustomService: false,
              donvi: "",
              soluong: "1",
              loaigoi: defaultPackage,
              dongia: s.revenue ? formatNumber(s.revenue) : "",
              thue: "0",
              chietkhau: String(s.discount || "0"),
              thanhtien: ""
            }))
          }]);
        } else {
          // Fallback: Dùng DanhMuc
          const danhMuc = editingService.DanhMuc || "";
          const parts = danhMuc.split(" + ").filter(Boolean);
          if (parts.length > 0) {
            setServiceSections([{
              serviceType: editingService.serviceType || "Khác",
              note: "",
              rows: parts.map(name => ({
                name: name.trim(),
                isCustomService: false,
                donvi: "",
                soluong: "1",
                loaigoi: defaultPackage,
                dongia: "",
                thue: "0",
                chietkhau: "0",
                thanhtien: ""
              }))
            }]);
          } else {
            setServiceSections([createEmptyServiceSection()]);
          }
        }
      }
    } else {
      setFormData({
        DoanhNghiepID: "",
        SoDKKD: "",
        MaVung: "+84",
        SoDienThoai: "",
        Email: "",
        NgayDangKy: new Date().toISOString().split('T')[0],
        NgayHen: "",
        TrangThai: "Chờ duyệt",
        GhiChu: "",
        NguoiPhuTrachId: "",
        ConfirmPassword: "",
        YeuCauHoaDon: "No",
        TenHinhThuc: "",
        NoiTiepNhanHoSo: "",
        DiaChiNhan: "",
        InvoiceUrl: ""
      });
      setUploadedDocs([]);
      setServiceSections([createEmptyServiceSection()]);
      setExistingService(null);
    }
  }, [isOpen, currentUser, editingService, isApproveMode]);

  const handleAddServiceSection = () => {
    setServiceSections([...serviceSections, createEmptyServiceSection()]);
  };

  const handleAddServiceRow = (sectionIndex) => {
    const newSections = [...serviceSections];
    newSections[sectionIndex].rows.push(createEmptyServiceRow());
    setServiceSections(newSections);
  };

  const handleRemoveServiceRow = (sectionIndex, rowIndex) => {
    const newSections = [...serviceSections];
    newSections[sectionIndex].rows.splice(rowIndex, 1);
    
    if (newSections[sectionIndex].rows.length === 0) {
      newSections[sectionIndex].rows.push(createEmptyServiceRow());
    }
    
    if (newSections.length > 1 && newSections[sectionIndex].rows.length === 0) {
      newSections.splice(sectionIndex, 1);
    }
    
    setServiceSections(newSections);
  };

  const handleServiceTypeChange = (sectionIndex, value) => {
    const newSections = [...serviceSections];
    const isCustomServiceType = value === CUSTOM_SERVICE_TYPE_VALUE;
    newSections[sectionIndex].serviceType = value;
    newSections[sectionIndex].rows.forEach(row => {
      row.name = "";
      row.isCustomService = isCustomServiceType;
    });
    setServiceSections(newSections);
  };

  const handleServiceNoteChange = (sectionIndex, value) => {
    const newSections = [...serviceSections];
    newSections[sectionIndex].note = value;
    setServiceSections(newSections);
  };

  const handleServiceRowChange = (sectionIndex, rowIndex, field, value) => {
    const newSections = [...serviceSections];

    if (field === "name") {
      if (value === CUSTOM_SERVICE_OPTION_VALUE) {
        newSections[sectionIndex].rows[rowIndex].name = "";
        newSections[sectionIndex].rows[rowIndex].isCustomService = true;
      } else {
        newSections[sectionIndex].rows[rowIndex].name = value;
        newSections[sectionIndex].rows[rowIndex].isCustomService = newSections[sectionIndex].rows[rowIndex].isCustomService;
      }
    } else {
      newSections[sectionIndex].rows[rowIndex][field] = value;
    }

    if (field === "soluong" || field === "dongia" || field === "thue" || field === "chietkhau") {
      const soluong = parseFloat(newSections[sectionIndex].rows[rowIndex].soluong) || 0;
      const dongia = unformatMoney(newSections[sectionIndex].rows[rowIndex].dongia) || 0;
      const thue = parseFloat(newSections[sectionIndex].rows[rowIndex].thue) || 0;
      const chietkhau = parseFloat(newSections[sectionIndex].rows[rowIndex].chietkhau) || 0;
      
      const subtotal = soluong * dongia;
      const thueAmount = subtotal * (thue / 100);
      const chietkhauAmount = subtotal * (chietkhau / 100);
      const thanhtien = subtotal + thueAmount - chietkhauAmount;
      const roundedThanhtien = Math.round(thanhtien);
      
      newSections[sectionIndex].rows[rowIndex].thanhtien = formatNumber(Math.max(0, roundedThanhtien));
    }

    if (field === "dongia") {
      const raw = value.replace(/\./g, "");
      if (!isNaN(raw)) {
        newSections[sectionIndex].rows[rowIndex][field] = raw.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      }
    }

    setServiceSections(newSections);
  };

  const getFilteredServiceOptions = (serviceType) => {
    if (serviceType === CUSTOM_SERVICE_TYPE_VALUE) return allServiceOptions;
    if (!serviceType) return [];
    return (b2bServiceMapping[serviceType] || []).map((serviceName) => ({
      value: serviceName,
      label: serviceName
    }));
  };

  const calculateTotals = () => {
    let subtotal = 0, totalThue = 0, total = 0;

    serviceSections.forEach(section => {
      section.rows.forEach(row => {
        const soluong = parseFloat(row.soluong) || 0;
        const dongia = unformatMoney(row.dongia) || 0;
        const thue = parseFloat(row.thue) || 0;
        
        const rowSubtotal = soluong * dongia;
        const rowThue = rowSubtotal * (thue / 100);
        
        subtotal += rowSubtotal;
        totalThue += rowThue;
        total += unformatMoney(row.thanhtien) || 0;
      });
    });

    return { 
      subtotal: Math.round(subtotal), 
      totalThue: Math.round(totalThue), 
      total: Math.round(total) 
    };
  };

  const totals = calculateTotals();

  const [formData, setFormData] = useState({
    DoanhNghiepID: "",
    SoDKKD: "",
    MaVung: "+84",
    SoDienThoai: "",
    Email: "",
    NgayDangKy: new Date().toISOString().split('T')[0],
    NgayHen: "",
    TrangThai: "Chờ duyệt",
    GhiChu: "",
    NguoiPhuTrachId: "",
    ConfirmPassword: "",
    YeuCauHoaDon: "No",
    TenHinhThuc: "",
    NoiTiepNhanHoSo: "",
    DiaChiNhan: "",
    InvoiceUrl: ""
  });

  const parsePhoneWithAreaCode = (rawPhone = "") => {
    const phone = String(rawPhone || "").trim();
    if (!phone) {
      return { maVung: "+84", soDienThoai: "" };
    }

    if (phone.startsWith("+84")) {
      return { maVung: "+84", soDienThoai: phone.slice(3).trim() };
    }

    if (phone.startsWith("+82")) {
      return { maVung: "+82", soDienThoai: phone.slice(3).trim() };
    }

    return { maVung: "+84", soDienThoai: phone };
  };

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
        const companyPhone = selectedCompany.SoDienThoai || selectedCompany.phoneNumber || selectedCompany.PhoneNumber || "";
        const companyEmail = selectedCompany.Email || selectedCompany.email || "";
        const { maVung, soDienThoai } = parsePhoneWithAreaCode(companyPhone);

        setFormData(prev => ({
          ...prev,
          [name]: value,
          SoDKKD: selectedCompany.SoDKKD || "",
          MaVung: maVung,
          SoDienThoai: soDienThoai,
          Email: companyEmail
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          SoDKKD: "",
          MaVung: "+84",
          SoDienThoai: "",
          Email: ""
        }));
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

    const hasService = serviceSections.some(section => 
      section.rows.some(row => row.name && row.name.trim() !== "")
    );
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

    let totalRevenue = 0, totalTax = 0, totalDiscount = 0;
    const validServices = [];
    const danhMucList = [];

    serviceSections.forEach(section => {
      section.rows.forEach(row => {
        if (row.name && row.name.trim() !== "") {
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
          
          validServices.push({ 
            name: row.name, 
            isCustomService: Boolean(row.isCustomService),
            codePrefix: row.isCustomService ? "ADD" : "",
            donvi: row.donvi, 
            soluong, 
            loaigoi: normalizePackageOption(row.loaigoi) || "thường",
            dongia, 
            thue, 
            chietkhau, 
            thanhtien: totalAmount,
            serviceType: section.serviceType === CUSTOM_SERVICE_TYPE_VALUE ? "Khác" : (section.serviceType || ""),
            note: section.note || ""
          });
          danhMucList.push(row.name);
        }
      });
    });

    const finalRevenue = totalRevenue + totalTax - totalDiscount;
    const roundedRevenue = Math.round(totalRevenue);
    const roundedTax = Math.round(totalTax);
    const roundedDiscount = Math.round(totalDiscount);
    const roundedFinalRevenue = Math.round(finalRevenue);
    const averageDiscountPercent = totalRevenue > 0 ? (totalDiscount / totalRevenue) * 100 : 0;
    const selectedPackage = normalizePackageOption(
      validServices.find(service => service.loaigoi)?.loaigoi ||
      serviceSections[0]?.rows?.[0]?.loaigoi ||
      editingService?.package ||
      editingService?.GoiDichVu ||
      "thường"
    ) || "thường";

    const finalStatus = isApproveMode ? "Đã duyệt" : (formData.TrangThai || "Chờ duyệt");
    const previouslyCompleted = isCompletedStatus(editingService?.status || editingService?.TrangThai);
    const nowCompleted = isCompletedStatus(finalStatus);
    const existingCompletionDate =
      editingService?.completionDate ||
      editingService?.NgayHoanThanh?.split?.("T")?.[0] ||
      "";
    const completionDate = nowCompleted
      ? (previouslyCompleted && existingCompletionDate ? existingCompletionDate : getTodayDateString())
      : existingCompletionDate;
    const existingCreatedDate =
      editingService?.createdDate ||
      editingService?.NgayTao?.split?.("T")?.[0] ||
      editingService?.CreatedAt?.split?.("T")?.[0] ||
      "";
    const createdDate = existingCreatedDate || getTodayDateString();

    const payload = {
      DoanhNghiepID: formData.DoanhNghiepID,
      SoDKKD: formData.SoDKKD,
      MaVung: formData.MaVung,
      SoDienThoai: formData.SoDienThoai,
      Email: formData.Email,
      NgayTao: createdDate,
      NgayBatDau: formData.NgayDangKy,
      NgayKetThuc: formData.NgayHen,
      NgayHoanThanh: completionDate,
      GhiChu: formData.GhiChu || "",
      TenHinhThuc: formData.TenHinhThuc || "",
      NguoiPhuTrachId: formData.NguoiPhuTrachId || currentUser?.id || "",
      ConfirmPassword: formData.ConfirmPassword,
      DanhMuc: danhMucList.join(" + "),
      TenDichVu: danhMucList.join(" + "),
      LoaiDichVu: serviceSections[0]?.serviceType === CUSTOM_SERVICE_TYPE_VALUE ? "Khác" : (serviceSections[0]?.serviceType || "Khác"),
      GoiDichVu: selectedPackage,
      DoanhThuTruocChietKhau: roundedRevenue,
      DoanhThu: roundedFinalRevenue,
      MucChietKhau: Math.round(averageDiscountPercent * 100) / 100,
      SoTienChietKhau: roundedDiscount,
      DoanhThuSauChietKhau: roundedFinalRevenue,
      Vi: 0,
      ThuTucCapToc: "No",
      YeuCauHoaDon: formData.YeuCauHoaDon || "No",
      TrangThai: finalStatus,
      DiaChiNhan: formData.DiaChiNhan || "",
      InvoiceUrl: formData.InvoiceUrl || "",
      ChiTietDichVu: {
        services: validServices,
        meta: {
          TenHinhThuc: formData.TenHinhThuc || "",
          NoiTiepNhanHoSo: formData.NoiTiepNhanHoSo || "",
          DiaChiNhan: formData.DiaChiNhan || ""
        },
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
      const saved = await onSave(payload);
      if (saved) {
        onClose();
      }
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
  const areaCodes = [{ value: "+82", label: "+82" }, { value: "+84", label: "+84" }];
  const contactChannelOptions = [
    { value: "Messenger", label: "Messenger" },
    { value: "Kakao Talk", label: "Kakao Talk" },
    { value: "Zalo", label: "Zalo" },
    { value: "Naver Talk", label: "Naver Talk" },
    { value: "Email", label: "Email" },
    { value: "Gọi điện", label: "Gọi điện" },
    { value: "Trực tiếp", label: "Trực tiếp" }
  ];
  const modalTitle = isApproveMode ? "Duyệt cấp dịch vụ" : "Đăng ký dịch vụ mới (B2B)";
  const modalSubtitle = isApproveMode ? "Kiểm tra thông tin trước khi cấp duyệt" : "Nhập thông tin khách hàng và dịch vụ";
  const submitText = isApproveMode ? "Cấp duyệt" : "Đăng ký Dịch Vụ";
  const submitBg = isApproveMode ? "#0ea5e9" : "#22c55e";
  const submitShadow = isApproveMode ? "0 6px 16px rgba(14, 165, 233, 0.35)" : "0 6px 16px rgba(34, 197, 94, 0.35)";

  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" 
      style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1050, backdropFilter: "blur(3px)" }}>
      <div className="bg-white position-relative" 
        style={{ width: "1000px", maxWidth: "95%", borderRadius: "14px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)", maxHeight: "90vh", overflowY: "auto", padding: "32px" }}>
        <button onClick={onClose} 
          className="position-absolute d-flex align-items-center justify-content-center border-0 bg-light rounded-circle" 
          style={{ top: "15px", right: "15px", width: "32px", height: "32px", cursor: "pointer" }}>
          <X size={18} />
        </button>

        <div className="text-center mb-4">
          <h3 className="fw-bold m-0" style={{ fontSize: "20px", color: "#111827" }}>{modalTitle}</h3>
          <p className="text-muted m-0 mt-1" style={{ fontSize: "13px" }}>{modalSubtitle}</p>
        </div>

        <div className="row g-3">
          {/* THONG TIN KHACH HANG */}
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
            <input type="hidden" name="SoDKKD" value={formData.SoDKKD} />

            <div className="mt-3" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ minWidth: "150px", flexShrink: 0 }}>
                <label style={{...labelStyle, marginBottom: "0", display: "block"}}>
                  Số điện thoại
                </label>
                <p style={{ fontSize: "11px", color: "#9ca3af", margin: "3px 0 0 0", fontStyle: "italic", lineHeight: "1.3" }}>
                  Mã vùng + số điện thoại
                </p>
              </div>
              <div style={{ flex: 1, display: "flex", gap: "8px" }}>
                <div style={{ width: "90px", flexShrink: 0 }}>
                  <ModernSelect
                    name="MaVung"
                    height="44px"
                    value={formData.MaVung}
                    placeholder="+84"
                    options={areaCodes}
                    onChange={handleInputChange}
                  />
                </div>
                <input
                  type="text"
                  name="SoDienThoai"
                  value={formData.SoDienThoai}
                  onChange={handleInputChange}
                  placeholder="Nhập số điện thoại"
                  style={{...inputStyle, height: "44px"}}
                />
              </div>
            </div>

            <div className="mt-3" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ minWidth: "150px", flexShrink: 0 }}>
                <label style={{...labelStyle, marginBottom: "0", display: "block"}}>
                  Email
                </label>
                <p style={{ fontSize: "11px", color: "#9ca3af", margin: "3px 0 0 0", fontStyle: "italic", lineHeight: "1.3" }}>
                  Email liên hệ
                </p>
              </div>
              <div style={{ flex: 1 }}>
                <input
                  type="email"
                  name="Email"
                  value={formData.Email}
                  onChange={handleInputChange}
                  placeholder="Nhập email"
                  style={{...inputStyle, height: "44px"}}
                />
              </div>
            </div>
          </div>

          <div className="col-md-7" style={{ paddingLeft: "30px" }}>
            <div className="row g-3">
              <div className="col-12">
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ minWidth: "110px", flexShrink: 0 }}>
                    <label style={{...labelStyle, marginBottom: "0", display: "block"}}>
                      Ngày bắt đầu <span className="text-danger">*</span>
                    </label>
                    <p style={{ fontSize: "11px", color: "#9ca3af", margin: "3px 0 0 0", fontStyle: "italic", lineHeight: "1.3" }}>
                      Ngày nộp hồ sơ
                    </p>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div onClick={(e) => e.currentTarget.querySelector('input').showPicker?.()} style={{ cursor: "pointer" }}>
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
                      Ngày hẹn trả kết quả
                    </p>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div onClick={(e) => e.currentTarget.querySelector('input').showPicker?.()} style={{ cursor: "pointer" }}>
                      <input
                        type="date"
                        name="NgayHen"
                        style={{...inputStyle, height: "44px", cursor: "pointer"}}
                        value={formData.NgayHen}
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
                      Trạng thái
                    </label>
                    <p style={{ fontSize: "11px", color: "#9ca3af", margin: "3px 0 0 0", fontStyle: "italic", lineHeight: "1.3" }}>
                      Trạng thái hồ sơ dịch vụ
                    </p>
                  </div>
                  <div style={{ flex: 1 }}>
                    <ModernSelect
                      name="TrangThai"
                      height="44px"
                      value={formData.TrangThai}
                      placeholder="Chọn trạng thái"
                      options={[
                        { value: "Chờ duyệt", label: "Chờ duyệt" },
                        { value: "Đã tạo đơn", label: "Đã tạo đơn" },
                        { value: "Đã thanh toán", label: "Đã thanh toán" },
                        { value: "Nộp hồ sơ", label: "Nộp hồ sơ" },
                        { value: "Trả kết quả", label: "Trả kết quả" },
                        { value: "Hoàn thành", label: "Hoàn thành" },
                        { value: "Đang xử lý", label: "Đang xử lý" },
                        { value: "Đã duyệt", label: "Đã duyệt" },
                        { value: "Từ chối", label: "Từ chối" }
                      ]}
                      onChange={handleInputChange}
                    />
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
                </thead>
                <tbody>
                  {serviceSections.map((section, sectionIndex) => (
                    <React.Fragment key={sectionIndex}>
                      {/* Gray header row for service type */}
                      <tr style={{ backgroundColor: "#f3f4f6" }}>
                        <td style={{ padding: "8px", textAlign: "center" }}></td>
                        <td style={{ padding: "8px" }}>
                          <ModernSelect
                            name={`serviceType-${sectionIndex}`}
                            height="32px"
                            value={section.serviceType}
                            placeholder="Chọn loại dịch vụ"
                            noBorder={true}
                            backgroundColor="#f3f4f6"
                            options={[
                              { value: "", label: "Chọn loại dịch vụ" },
                              { value: CUSTOM_SERVICE_TYPE_VALUE, label: "Dịch vụ thêm" },
                              ...Object.keys(b2bServiceMapping || {}).map(key => ({ value: key, label: key }))
                            ]}
                            onChange={(e) => handleServiceTypeChange(sectionIndex, e.target.value)}
                          />
                        </td>
                        <td colSpan="8" style={{ padding: "8px" }}></td>
                      </tr>

                      {/* Service rows */}
                      {section.rows.map((row, rowIndex) => (
                        <tr key={`${sectionIndex}-${rowIndex}`} style={{ backgroundColor: "#ffffff" }}>
                          <td style={{ padding: "8px", textAlign: "center", color: "#d1d5db" }}>
                            <span style={{ fontSize: "14px", cursor: "grab" }}>⋮⋮</span>
                          </td>
                          <td style={{ padding: "8px" }}>
                            {row.isCustomService ? (
                              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                <input
                                  type="text"
                                  value={row.name}
                                  onChange={(e) => handleServiceRowChange(sectionIndex, rowIndex, "name", e.target.value)}
                                  placeholder="Gõ dịch vụ"
                                  style={{
                                    width: "100%",
                                    height: "32px",
                                    padding: "0 8px",
                                    border: "1px solid #d1d5db",
                                    borderRadius: "6px",
                                    fontSize: "13px",
                                    color: "#111827",
                                    outline: "none"
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleServiceRowChange(sectionIndex, rowIndex, "name", row.name)}
                                  style={{
                                    height: "32px",
                                    minWidth: "42px",
                                    border: "1px solid #d1d5db",
                                    borderRadius: "6px",
                                    backgroundColor: "#f9fafb",
                                    color: "#374151",
                                    fontSize: "11px",
                                    cursor: "pointer"
                                  }}
                                >
                                  Chọn
                                </button>
                              </div>
                            ) : (
                              <ModernSelect
                                name={`service-${sectionIndex}-${rowIndex}`}
                                height="32px"
                                value={row.name}
                                placeholder="Chọn"
                                noBorder={true}
                                backgroundColor="white"
                                options={[
                                  { value: "", label: "Chọn dịch vụ" },
                                  ...getFilteredServiceOptions(section.serviceType),
                                  { value: CUSTOM_SERVICE_OPTION_VALUE, label: "Thêm" }
                                ]}
                                onChange={(e) => handleServiceRowChange(sectionIndex, rowIndex, "name", e.target.value)}
                              />
                            )}
                            {rowIndex === 0 && (
                              <input
                                type="text"
                                value={section.note}
                                placeholder="Nhập ghi chú"
                                onChange={(e) => handleServiceNoteChange(sectionIndex, e.target.value)}
                                style={{ width: "100%", height: "28px", padding: "2px 4px", border: "1px solid #e5e7eb", borderRadius: "4px", fontSize: "11px", marginTop: "2px" }}
                              />
                            )}
                          </td>
                          <td style={{ padding: "8px" }}>
                            <ModernSelect
                              name={`donvi-${sectionIndex}-${rowIndex}`}
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
                              onChange={(e) => handleServiceRowChange(sectionIndex, rowIndex, "donvi", e.target.value)}
                            />
                          </td>
                          <td style={{ padding: "8px" }}>
                            <input type="number" value={row.soluong}
                              onChange={(e) => handleServiceRowChange(sectionIndex, rowIndex, "soluong", e.target.value)}
                              style={{ width: "100%", height: "32px", textAlign: "center", padding: "4px", border: "none", borderRadius: "0", fontSize: "13px", color: "#111827", backgroundColor: "white", outline: "none" }}
                            />
                          </td>
                          <td style={{ padding: "8px" }}>
                            <ModernSelect
                              name={`loaigoi-${sectionIndex}-${rowIndex}`}
                              height="32px"
                              value={row.loaigoi}
                              placeholder="Chọn"
                              noBorder={true}
                              backgroundColor="white"
                              options={[
                                { value: "", label: "Chọn" },
                                { value: "thường", label: "thường" },
                                { value: "gấp 1", label: "gấp 1" },
                                { value: "gấp 0", label: "gấp 0" }
                              ]}
                              onChange={(e) => handleServiceRowChange(sectionIndex, rowIndex, "loaigoi", e.target.value)}
                            />
                          </td>
                          <td style={{ padding: "8px" }}>
                            <input type="text" value={row.dongia}
                              onChange={(e) => handleServiceRowChange(sectionIndex, rowIndex, "dongia", e.target.value)}
                              placeholder="Nhập vào"
                              style={{ width: "100%", height: "32px", textAlign: "right", padding: "4px 8px", border: "none", borderRadius: "0", fontSize: "13px", color: "#111827", backgroundColor: "white", outline: "none" }}
                            />
                          </td>
                          <td style={{ padding: "8px" }}>
                            <ModernSelect
                              name={`thue-${sectionIndex}-${rowIndex}`}
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
                              onChange={(e) => handleServiceRowChange(sectionIndex, rowIndex, "thue", e.target.value)}
                            />
                          </td>
                          <td style={{ padding: "8px" }}>
                            <ModernSelect
                              name={`chietkhau-${sectionIndex}-${rowIndex}`}
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
                              onChange={(e) => handleServiceRowChange(sectionIndex, rowIndex, "chietkhau", e.target.value)}
                            />
                          </td>
                          <td style={{ padding: "8px" }}>
                            <input type="text" value={row.thanhtien} readOnly
                              style={{ width: "100%", height: "32px", textAlign: "right", padding: "4px 8px", border: "none", borderRadius: "0", fontSize: "13px", color: "#111827", backgroundColor: "white", outline: "none" }}
                            />
                          </td>
                          <td style={{ padding: "8px", textAlign: "center" }}>
                            {rowIndex > 0 && (
                              <button type="button" onClick={() => handleRemoveServiceRow(sectionIndex, rowIndex)}
                                style={{ width: "20px", height: "20px", border: "none", borderRadius: "0", backgroundColor: "transparent", color: "#ef4444", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", padding: "0", lineHeight: "1" }}>
                                −
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
              
              {/* Buttons */}
              <div style={{ padding: "10px", borderTop: "1px solid #e5e7eb", display: "flex", gap: "10px" }}>
                <button type="button" onClick={() => handleAddServiceRow(serviceSections.length - 1)}
                  style={{ padding: "6px 0", fontSize: "13px", backgroundColor: "transparent", color: "#3b82f6", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontStyle: "italic" }}>
                  <Plus size={14} />
                  Thêm Dịch vụ
                </button>
                <button type="button" onClick={handleAddServiceSection}
                  style={{ padding: "6px 0", fontSize: "13px", backgroundColor: "transparent", color: "#3b82f6", border: "none", cursor: "pointer", fontStyle: "italic" }}>
                  Thêm phần
                </button>
              </div>
            </div>
          </div>

          {/* YÊU CẦU XUẤT HÓA ĐƠN */}
          <div className="col-12 mt-3" style={{ display: "flex", gap: "30px", alignItems: "center", justifyContent: "center" }}>
            <div style={{ minWidth: "320px", width: "320px", flexShrink: 0, borderBottom: "1px solid #e5e7eb", paddingBottom: "6px" }}>
              <label style={{...labelStyle, fontSize: "13px", marginBottom: "0"}}>
                Yêu cầu xuất hóa đơn <span className="text-danger">*</span>
              </label>
              <p style={{ fontSize: "11px", color: "#9ca3af", margin: "2px 0 0 0", fontStyle: "italic" }}>
                Hóa đơn sẽ được gửi về email đăng ký khi đăng ký doanh nghiệp trên hệ thống.
              </p>
            </div>
            <div style={{ display: "flex", gap: "10px", width: "320px" }}>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, YeuCauHoaDon: "Yes" }))}
                style={{
                  flex: 1,
                  padding: "8px 24px",
                  borderRadius: "8px",
                  border: `1px solid ${formData.YeuCauHoaDon === "Yes" ? "#374151" : "#6b7280"}`,
                  backgroundColor: formData.YeuCauHoaDon === "Yes" ? "#e5e7eb" : "#f3f4f6",
                  color: formData.YeuCauHoaDon === "Yes" ? "#374151" : "#9ca3af",
                  fontSize: "13px",
                  fontWeight: "400",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: formData.YeuCauHoaDon === "Yes" ? "0 0 0 1px #374151 inset" : "none"
                }}
              >
                Có
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, YeuCauHoaDon: "No" }))}
                style={{
                  flex: 1,
                  padding: "8px 24px",
                  borderRadius: "8px",
                  border: `1px solid ${formData.YeuCauHoaDon === "No" ? "#374151" : "#6b7280"}`,
                  backgroundColor: formData.YeuCauHoaDon === "No" ? "#e5e7eb" : "#f3f4f6",
                  color: formData.YeuCauHoaDon === "No" ? "#374151" : "#9ca3af",
                  fontSize: "13px",
                  fontWeight: "400",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: formData.YeuCauHoaDon === "No" ? "0 0 0 1px #374151 inset" : "none"
                }}
              >
                Không
              </button>
            </div>
          </div>

          {/* KÊNH LIÊN HỆ */}
          <div className="col-12" style={{ display: "flex", gap: "30px", alignItems: "center", justifyContent: "center" }}>
            <div style={{ minWidth: "320px", width: "320px", flexShrink: 0, borderBottom: "1px solid #e5e7eb", paddingBottom: "6px" }}>
              <label style={{...labelStyle, fontSize: "13px", marginBottom: "0"}}>
                Kênh liên hệ
              </label>
              <p style={{ fontSize: "11px", color: "#9ca3af", margin: "2px 0 0 0", fontStyle: "italic" }}>
                Hình thức trao đổi với khách hàng
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "320px" }}>
              <ModernSelect
                name="TenHinhThuc"
                height="36px"
                value={formData.TenHinhThuc}
                placeholder="Chọn Hình Thức"
                options={contactChannelOptions}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* NƠI TIẾP NHẬN HỒ SƠ */}
          <div className="col-12" style={{ display: "flex", gap: "30px", alignItems: "center", justifyContent: "center" }}>
            <div style={{ minWidth: "320px", width: "320px", flexShrink: 0, borderBottom: "1px solid #e5e7eb", paddingBottom: "6px" }}>
              <label style={{...labelStyle, fontSize: "13px", marginBottom: "0"}}>
                Nơi tiếp nhận hồ sơ
              </label>
              <p style={{ fontSize: "11px", color: "#9ca3af", margin: "2px 0 0 0", fontStyle: "italic" }}>
                Cơ quan/Quốc tế hóa tiếp nhận hồ sơ
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "320px" }}>
              <input
                type="text"
                name="NoiTiepNhanHoSo"
                value={formData.NoiTiepNhanHoSo || ""}
                onChange={handleInputChange}
                placeholder="Nhập nơi tiếp nhận hồ sơ"
                style={{...inputStyle, height: "36px"}}
              />
            </div>
          </div>

          {/* ĐỊA CHỈ NHẬN */}
          <div className="col-12" style={{ display: "flex", gap: "30px", alignItems: "center", justifyContent: "center" }}>
            <div style={{ minWidth: "320px", width: "320px", flexShrink: 0, borderBottom: "1px solid #e5e7eb", paddingBottom: "6px" }}>
              <label style={{...labelStyle, fontSize: "13px", marginBottom: "0"}}>
                Địa chỉ nhận
              </label>
              <p style={{ fontSize: "11px", color: "#9ca3af", margin: "2px 0 0 0", fontStyle: "italic" }}>
                Địa chỉ nhận hồ sơ từ khách hàng
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "320px" }}>
              <input
                type="text"
                name="DiaChiNhan"
                value={formData.DiaChiNhan || ""}
                onChange={handleInputChange}
                placeholder="Nhập địa chỉ nhận"
                style={{...inputStyle, height: "36px"}}
              />
            </div>
          </div>

          {/* TẢI LÊN HỒ SƠ DỊCH VỤ */}
          <div className="col-12" style={{ display: "flex", gap: "30px", alignItems: "center", justifyContent: "center" }}>
            <div style={{ minWidth: "320px", width: "320px", flexShrink: 0, borderBottom: "1px solid #e5e7eb", paddingBottom: "6px" }}>
              <label style={{...labelStyle, fontSize: "13px", marginBottom: "0"}}>
                Tải lên hồ sơ dịch vụ
              </label>
              <p style={{ fontSize: "11px", color: "#9ca3af", margin: "2px 0 0 0", fontStyle: "italic" }}>
                Tài liệu các hồ sơ đã nhận kiểm tra
              </p>
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", width: "320px" }}>
              <label
                style={{
                  flex: 1,
                  padding: "8px 20px",
                  backgroundColor: "#e5e7eb",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  fontSize: "12px",
                  cursor: uploadingDocs ? "not-allowed" : "pointer",
                  display: "inline-block",
                  textAlign: "center",
                  color: "#374151",
                  fontWeight: "400",
                  boxShadow: "0 0 0 1px #374151 inset",
                  transition: "all 0.2s"
                }}
              >
                {uploadingDocs ? "Đang tải..." : "Chọn file"}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  style={{ display: "none" }}
                  onChange={(e) => handleDocUpload(e.target.files)}
                />
              </label>
              <button
                type="button"
                onClick={() => formData.InvoiceUrl && window.open(formData.InvoiceUrl, "_blank")}
                disabled={!formData.InvoiceUrl}
                style={{
                  flex: 1,
                  padding: "8px 20px",
                  backgroundColor: "#e5e7eb",
                  color: "#374151",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  fontSize: "12px",
                  cursor: formData.InvoiceUrl ? "pointer" : "not-allowed",
                  fontWeight: "400",
                  boxShadow: "0 0 0 1px #374151 inset",
                  transition: "all 0.2s"
                }}
              >
                Xem hồ sơ
              </button>
            </div>
          </div>

          {/* Notes + Totals */}
          <div className="col-12" style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: "30px", alignItems: "start", marginTop: "15px" }}>
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
              style={{ width: "220px", padding: "10px 16px", backgroundColor: submitBg, color: "white", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: "600", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", margin: "0 auto", boxShadow: submitShadow }}>
              {loading ? <span className="spinner-border spinner-border-sm"></span> : submitText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddServiceModalB2B;
