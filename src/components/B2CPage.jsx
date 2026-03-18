import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import NotificationPanel from "./CMSDashboard/NotificationPanel";
import EditProfileModal from "./EditProfileModal";
import { showToast } from "../utils/toast";
import useDashboardData from "./CMSDashboard/hooks/useDashboardData";
import { LayoutGrid, Edit, Trash2, X, Pin, PinOff, PlusCircle, Check, ChevronDown, Eye, EyeOff, Plus } from "lucide-react";
import Swal from "sweetalert2";
import "../styles/DashboardList.css";
import { authenticatedFetch } from "../utils/api";
import translateService from "../utils/translateService";

const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "https://onepasscms-backend-tvdy.onrender.com/api";
const CUSTOM_SERVICE_OPTION_VALUE = "__ADD_CUSTOM_SERVICE__";
const CUSTOM_SERVICE_TYPE_VALUE = "__ADD_CUSTOM_SERVICE_TYPE__";
const B2C_COLUMN_WIDTHS = {
  id: 64,
  hoTen: 140,
  maVung: 90,
  sdt: 120,
  email: 220,
  hinhThuc: 120,
  coSo: 90,
  diaChiNhan: 180,
  noiTiepNhanHoSo: 180,
  loaiDichVu: 130,
  danhMuc: 220,
  maDichVu: 200,
  ghiChuDichVu: 180,
  nguoiPhuTrach: 130,
  ngayTao: 110,
  ngayBatDau: 110,
  ngayHen: 110,
  ngayKetThuc: 110,
  trangThai: 120,
  goiDichVu: 102,
  invoice: 90,
  invoiceUrl: 90,
  ghiChu: 270,
  doanhThuTruoc: 130,
  mucChietKhau: 100,
  soTienChietKhau: 120,
  doanhThuSau: 130,
  tongDoanhThuTichLuy: 160,
  hanhDong: 132,
};

const getPrimaryServiceName = (item) => {
  const tenDichVu = String(item?.TenDichVu || "").trim();
  if (tenDichVu) return tenDichVu;

  const danhMuc = String(item?.DanhMuc || "").trim();
  if (danhMuc) {
    const firstByPlus = danhMuc.split(" + ")[0]?.trim();
    if (firstByPlus) return firstByPlus;
  }

  try {
    const details = typeof item?.ChiTietDichVu === "string"
      ? JSON.parse(item.ChiTietDichVu)
      : item?.ChiTietDichVu;

    if (Array.isArray(details?.services) && details.services.length > 0) {
      const firstName = String(details.services[0]?.name || "").trim();
      if (firstName) return firstName;
    }
    if (Array.isArray(details?.sub) && details.sub.length > 0) {
      const firstName = String(details.sub[0]?.name || "").trim();
      if (firstName) return firstName;
    }
  } catch (_) {}

  return "";
};

const normalizeServiceCodeForRow = (item) => {
  const currentCode = String(item?.MaHoSo || "").trim();
  if (!currentCode) return currentCode;

  const serviceName = getPrimaryServiceName(item);
  const expectedPrefix = B2C_SERVICE_CODE_MAP_NORMALIZED[normalizeServiceName(serviceName)];
  if (!expectedPrefix) return currentCode;

  const codeMatch = currentCode.match(/^[^-]+-(\d{6})-([YNyn])-([0-9]{3})$/);
  if (!codeMatch) return currentCode;

  const submissionRaw =
    item?.NgayBatDau ||
    item?.ChonNgay ||
    item?.NgayNopHoSo ||
    item?.CreatedAt ||
    "";

  const formatCodeDate = (value) => {
    const raw = String(value || "").trim();
    const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      const [, yyyy, mm, dd] = isoMatch;
      return `${yyyy.slice(-2)}${mm}${dd}`;
    }

    const dayFirstMatch = raw.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
    if (dayFirstMatch) {
      const [, dd, mm, yyyy] = dayFirstMatch;
      return `${String(yyyy).slice(-2)}${String(mm).padStart(2, "0")}${String(dd).padStart(2, "0")}`;
    }

    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) {
      const yy = String(parsed.getUTCFullYear()).slice(-2);
      const mm = String(parsed.getUTCMonth() + 1).padStart(2, "0");
      const dd = String(parsed.getUTCDate()).padStart(2, "0");
      return `${yy}${mm}${dd}`;
    }

    return codeMatch[1];
  };

  const expectedDate = formatCodeDate(submissionRaw);
  const expectedInvoiceCode = ["yes", "có", "true", "y"].includes(
    String(item?.Invoice ?? item?.YeuCauXuatHoaDon ?? item?.YeuCauHoaDon ?? "").toLowerCase()
  )
    ? "Y"
    : "N";

  const normalizedCode = `${expectedPrefix}-${expectedDate}-${expectedInvoiceCode}-${codeMatch[3]}`;
  return normalizedCode;
};

const buildCodeByServiceName = (baseCode, serviceName) => {
  const currentCode = String(baseCode || "").trim();
  if (!currentCode) return "";

  const expectedPrefix = B2C_SERVICE_CODE_MAP_NORMALIZED[normalizeServiceName(serviceName)];
  if (!expectedPrefix) return currentCode;

  const codeMatch = currentCode.match(/^[^-]+-(\d{6})-([YNyn])-([0-9]{3})$/);
  if (!codeMatch) return currentCode;

  return `${expectedPrefix}-${codeMatch[1]}-${codeMatch[2].toUpperCase()}-${codeMatch[3]}`;
};

const normalizeStatusText = (value) =>
  String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const isCompletedStatus = (value) => {
  const normalized = normalizeStatusText(value);
  return normalized === "hoan thanh" || normalized === "completed";
};

const getTodayDateString = () => new Date().toISOString().split("T")[0];

const extractReceivingInfoFromDetails = (detailsSource) => {
  try {
    const details = typeof detailsSource === "string" ? JSON.parse(detailsSource) : (detailsSource || {});
    const meta = details?.meta || {};

    const receivingOffice =
      meta.receivingOffice ||
      meta.NoiTiepNhanHoSo ||
      meta.noiTiepNhanHoSo ||
      meta.office ||
      "";

    const receivingAddress =
      meta.receivingAddress ||
      meta.DiaChiNhan ||
      meta.diaChiNhan ||
      meta.address ||
      "";

    return {
      receivingOffice: String(receivingOffice || "").trim(),
      receivingAddress: String(receivingAddress || "").trim(),
    };
  } catch {
    return { receivingOffice: "", receivingAddress: "" };
  }
};

const ModernSelect = ({ name, value, options, onChange, placeholder, disabled, twoColumns = false, height = "38px", footerAction, width = "100%", noBorder = false, backgroundColor = "#ffffff" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0, maxHeight: 300 });
  const selectedOption = options.find(opt => String(opt.value) === String(value));
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  const updatePosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const spacing = 8;
      const preferredHeight = 300;
      const spaceBelow = Math.max(0, viewportHeight - rect.bottom - spacing);
      const spaceAbove = Math.max(0, rect.top - spacing);
      const openUpward = spaceBelow < 220 && spaceAbove > spaceBelow;
      const maxHeight = Math.max(140, Math.min(preferredHeight, openUpward ? spaceAbove : spaceBelow));

      setDropdownPosition({
        top: openUpward ? Math.max(spacing, rect.top - maxHeight - 4) : rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        maxHeight
      });
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      const isTrigger = containerRef.current?.contains(event.target);
      const isDropdown = dropdownRef.current?.contains(event.target);
      if (!isTrigger && !isDropdown) {
        setIsOpen(false);
      }
    };
    
    const handleScroll = () => {
      if (isOpen) {
        updatePosition();
      }
    };

    const handleResize = () => {
      if (isOpen) {
        updatePosition();
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen]);

  const handleSelect = (val) => {
    if (disabled) return;
    onChange({ target: { name, value: val } });
    setIsOpen(false);
  };

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
          userSelect: "none", height: height,
          transition: "all 0.2s"
        }}
      >
        <span className="text-truncate" style={{ color: value ? "#111827" : "#9CA3AF" }}>{displayLabel}</span>
        <ChevronDown size={16} color="#6B7280" />
      </div>

      {isOpen && !disabled && ReactDOM.createPortal(
        <div className="bg-white rounded border" ref={dropdownRef}
          style={{
            position: "fixed",
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            zIndex: 99999,
            maxHeight: `${dropdownPosition.maxHeight}px`,
            overflowY: "auto",
            borderRadius: "8px",
            padding: "4px",
            display: "flex",
            flexDirection: "column",
            minWidth: "150px",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
            border: "1px solid #e5e7eb",
            backgroundColor: "#ffffff"
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
                  cursor: "pointer", fontSize: "12px", whiteSpace: "nowrap", padding: "8px 12px",
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
        </div>,
        document.body
      )}
    </div>
  );
};

const RequestEditModal = ({ request, users, currentUser, onClose, onSave, currentLanguage, dichvuList, approveMode = false, viewMode = false }) => {
  const isNew = !request || !request.YeuCauID;

  // Lấy danh sách dịch vụ từ API
  const canApprove = currentUser?.is_director || currentUser?.is_accountant || currentUser?.perm_approve_b2c;

    // Chỉ lấy đúng các loại dịch vụ đang có bản ghi thực tế từ API (giống bảng quản lý dịch vụ)
    const serviceTypeOptions = React.useMemo(() => {
      if (!Array.isArray(dichvuList)) return [];
      // Lấy tất cả LoaiDichVu duy nhất từ các bản ghi dịch vụ thực tế (không alias, không hardcode)
      const types = Array.from(new Set(
        dichvuList
          .map((dv) => (dv.LoaiDichVu || "").trim())
          .filter((v) => v)
      ));
      return types.map((type) => ({ value: type, label: type }));
    }, [dichvuList]);
// ...existing code...

  // Lấy danh sách dịch vụ theo loại dịch vụ (so sánh trực tiếp LoaiDichVu, không dùng alias)
  const getFilteredServiceOptions = (serviceType) => {
    if (!serviceType) return [];
    // Chỉ lấy dịch vụ con đúng loại dịch vụ thực tế từ API
    return (
      dichvuList
        ?.filter((dv) => (dv.LoaiDichVu || "").trim() === serviceType)
        .map((dv) => ({ value: dv.TenDichVu, label: dv.TenDichVu })) || []
    );
  };

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [serviceInlineNote, setServiceInlineNote] = useState("");

  // Helper formats
  const formatNumber = (num) => num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "0";
  const unformatMoney = (val) => val ? parseFloat(val.toString().replace(/\./g, "")) : 0;
  const normalizePackageOption = (value) => {
    if (value === "Thông thường") return "thường";
    if (value === "Cấp tốc") return "gấp 1";
    return value || "";
  };

  const normalizeServiceType = (val) => {
      if (!val) return "";
      const cleanVal = String(val).trim();
      const krMap = {
        "인증 센터": "Hợp pháp hóa, công chứng", "결혼 이민": "Kết hôn", "출생신고 대행": "Khai sinh, khai tử", "국적 대행": "Quốc tịch",
        "여권 • 호적 대행": "Hộ chiếu, Hộ tịch", "입양 절차 대행": "Nhận nuôi", "비자 대행": "Thị thực", "법률 컨설팅": "Tư vấn pháp lý",
        "B2B 서비스": "Dịch vụ B2B", "기타": "Khác", "번역 공증": "Dịch thuật",
      };
      return mapToB2CServiceType(krMap[cleanVal] || cleanVal);
  };

  const createEmptyServiceRow = () => ({
    name: "",
    isCustomService: false,
    donvi: "",
    soluong: "1",
    loaigoi: "",
    dongia: "",
    thue: "0",
    chietkhau: "0",
    thanhtien: ""
  });

  const createEmptyServiceSection = () => ({
    serviceType: "",
    note: "",
    rows: [createEmptyServiceRow()]
  });

  // --- 1. STATE DỊCH VỤ PHỤ (EXTRA SERVICES) - CẬP NHẬT ĐỂ HỖ TRỢ BẢNG DỊCH VỤ PHỨC TẠP ---
  const [serviceSections, setServiceSections] = useState(() => {
    // Ưu tiên đọc từ JSON ChiTietDichVu nếu có
    if (request && request.ChiTietDichVu) {
        let details = typeof request.ChiTietDichVu === 'string' ? JSON.parse(request.ChiTietDichVu) : request.ChiTietDichVu;
        if (details.services && Array.isArray(details.services) && details.services.length > 0) {
             // Group services theo serviceType
             const grouped = details.services.reduce((acc, s) => {
               const type = s.serviceType || normalizeServiceType(request?.LoaiDichVu) || "";
               if (!acc[type]) acc[type] = { rows: [], note: "" };
               const normalizedType = normalizeServiceType(type);
               const knownServices = dbCategoryMap[normalizedType] || B2C_CATEGORY_LIST[normalizedType] || [];
               const serviceName = s.name || "";
               const isCustomService = Boolean(
                 s.isCustomService ||
                 s.codePrefix === "ADD" ||
                 (serviceName && !knownServices.includes(serviceName))
               );
               if (!acc[type].note) {
                 acc[type].note = String(s.note || s.ghiChu || s.serviceNote || "").trim();
               }
               acc[type].rows.push({
                 name: serviceName,
                 isCustomService,
                 donvi: s.donvi || "",
                 soluong: String(s.soluong || "1"),
                 loaigoi: normalizePackageOption(s.loaigoi) || "",
                 dongia: s.dongia ? formatNumber(s.dongia) : "",
                 thue: String(s.thue || "0"),
                 chietkhau: String(s.chietkhau || "0"),
                 thanhtien: s.thanhtien ? formatNumber(s.thanhtien) : ""
               });
               return acc;
             }, {});
             
             // Convert grouped object to array of sections
             return Object.entries(grouped).map(([serviceType, group]) => ({
               serviceType,
               note: group.note || "",
               rows: group.rows
             }));
        }
        if (details.sub && details.sub.length > 0) {
             return [{
               serviceType: normalizeServiceType(request?.LoaiDichVu) || "",
               note: "",
               rows: details.sub.map(s => ({
                 name: s.name || "",
                 isCustomService: false,
                 donvi: s.donvi || "",
                 soluong: String(s.soluong || "1"),
                 loaigoi: normalizePackageOption(s.loaigoi) || "",
                 dongia: s.dongia ? formatNumber(s.dongia) : "",
                 thue: String(s.thue || "0"),
                 chietkhau: String(s.chietkhau || "0"),
                 thanhtien: s.thanhtien ? formatNumber(s.thanhtien) : ""
               }))
             }];
        }
    }
    // Fallback: tạo 1 dòng mặc định
    return [{
      serviceType: normalizeServiceType(request?.LoaiDichVu) || "",
      note: "",
      rows: [createEmptyServiceRow()]
    }];
  });

  const [extraServices, setExtraServices] = useState(() => {
    // Giữ lại state cũ cho phần dịch vụ bổ sung (nếu cần)
    if (request && request.ChiTietDichVu) {
        let details = typeof request.ChiTietDichVu === 'string' ? JSON.parse(request.ChiTietDichVu) : request.ChiTietDichVu;
        if (details.sub && details.sub.length > 0) {
             return details.sub.map(s => ({
                 name: s.name,
                 revenue: s.revenue ? formatNumber(s.revenue) : "", 
                 discount: s.discount || ""
             }));
        }
    }
    // Fallback logic cũ (split string từ DanhMuc)
    if (!request || !request.DanhMuc) return [{ name: "", revenue: "", discount: "" }];
    const parts = request.DanhMuc.split(" + ");
    if (parts.length > 1) {
        return parts.slice(1).map(name => ({ name: name, revenue: "", discount: "" }));
    }
    return [{ name: "", revenue: "", discount: "" }];
  });

  const [showExtras, setShowExtras] = useState(() => {
      if (isNew || !request.DanhMuc) return false;
      // Nếu có sub-services trong mảng extraServices (không phải mảng rỗng mặc định)
      if (request.ChiTietDichVu) {
         let details = typeof request.ChiTietDichVu === 'string' ? JSON.parse(request.ChiTietDichVu) : request.ChiTietDichVu;
         return details?.sub?.length > 0;
      }
      return request.DanhMuc.split(" + ").length > 1;
  });

  // --- CÁC HÀM XỬ LÝ BẢNG DỊCH VỤ ---
  const handleAddServiceSection = () => {
    setServiceSections((prev) => ([...prev, createEmptyServiceSection()]));
  };

  const handleAddServiceRow = (sectionIndex) => {
    setServiceSections((prev) => {
      const next = [...prev];
      next[sectionIndex] = {
        ...next[sectionIndex],
        rows: [...next[sectionIndex].rows, createEmptyServiceRow()]
      };
      return next;
    });
  };

  const handleRemoveServiceRow = (sectionIndex, rowIndex) => {
    setServiceSections((prev) => {
      const next = [...prev];
      const section = next[sectionIndex];
      const newRows = [...section.rows];
      newRows.splice(rowIndex, 1);

      if (newRows.length === 0) {
        if (next.length === 1) {
          next[sectionIndex] = { ...section, rows: [createEmptyServiceRow()] };
          return next;
        }
        next.splice(sectionIndex, 1);
        return next;
      }

      next[sectionIndex] = { ...section, rows: newRows };
      return next;
    });
  };

  const handleServiceTypeChange = (sectionIndex, value) => {
    setServiceSections((prev) => {
      const next = [...prev];
      const isCustomServiceType = value === CUSTOM_SERVICE_TYPE_VALUE;
      next[sectionIndex] = {
        ...next[sectionIndex],
        serviceType: value,
        rows: next[sectionIndex].rows.map((row) => ({
          ...row,
          name: "",
          isCustomService: isCustomServiceType
        }))
      };
      return next;
    });
  };

  const handleServiceNoteChange = (sectionIndex, value) => {
    setServiceSections((prev) => {
      const next = [...prev];
      next[sectionIndex] = { ...next[sectionIndex], note: value };
      return next;
    });
  };

  const handleServiceRowChange = (sectionIndex, rowIndex, field, value) => {
    const nextSections = [...serviceSections];
    const section = { ...nextSections[sectionIndex] };
    const rows = [...section.rows];

    const safeValue = value ?? "";

    if (field === "name") {
      if (value === CUSTOM_SERVICE_OPTION_VALUE) {
        rows[rowIndex] = {
          ...rows[rowIndex],
          name: "",
          isCustomService: true
        };
      } else {
        rows[rowIndex] = {
          ...rows[rowIndex],
          [field]: safeValue,
          isCustomService: rows[rowIndex].isCustomService
        };
      }
    } else {
      rows[rowIndex] = { ...rows[rowIndex], [field]: safeValue };
    }

    // Tự động tính thành tiền khi có đủ dữ liệu
    if (field === "soluong" || field === "dongia" || field === "thue" || field === "chietkhau") {
      const soluong = parseFloat(rows[rowIndex].soluong) || 0;
      const dongia = unformatMoney(rows[rowIndex].dongia) || 0;
      const thue = parseFloat(rows[rowIndex].thue) || 0;
      const chietkhau = parseFloat(rows[rowIndex].chietkhau) || 0;
      
      const subtotal = soluong * dongia;
      const thueAmount = subtotal * (thue / 100);
      const chietkhauAmount = subtotal * (chietkhau / 100);
      const thanhtien = subtotal + thueAmount - chietkhauAmount;
      const roundedThanhtien = Math.round(thanhtien);
      
      rows[rowIndex].thanhtien = formatNumber(Math.max(0, roundedThanhtien));
    }

    // Format số cho đơn giá
    if (field === "dongia") {
      const raw = safeValue.replace(/\./g, "");
      if (!isNaN(raw)) {
        rows[rowIndex][field] = raw.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      }
    }

    section.rows = rows;
    nextSections[sectionIndex] = section;
    setServiceSections(nextSections);
  };

  // Tính tổng các giá trị trong bảng
  const calculateTotals = () => {
    const flatRows = serviceSections.flatMap((section) => section.rows);

    const subtotal = flatRows.reduce((sum, row) => {
      const soluong = parseFloat(row.soluong) || 0;
      const dongia = unformatMoney(row.dongia) || 0;
      return sum + (soluong * dongia);
    }, 0);

    const totalThue = flatRows.reduce((sum, row) => {
      const soluong = parseFloat(row.soluong) || 0;
      const dongia = unformatMoney(row.dongia) || 0;
      const thue = parseFloat(row.thue) || 0;
      return sum + ((soluong * dongia) * (thue / 100));
    }, 0);

    const total = flatRows.reduce((sum, row) => {
      return sum + (unformatMoney(row.thanhtien) || 0);
    }, 0);

    return {
      subtotal: Math.round(subtotal),
      totalThue: Math.round(totalThue),
      total: Math.round(total)
    };
  };

  const totals = calculateTotals();

  // --- CÁC HÀM XỬ LÝ EXTRA SERVICES ---
  const handleAddRow = () => {
      if (extraServices.length < 5) {
          setExtraServices([...extraServices, { name: "", revenue: "", discount: "" }]);
      } else {
          showToast("Chỉ được thêm tối đa 5 dịch vụ bổ sung", "warning");
      }
  };

  const handleRemoveRow = (index) => {
      const newArr = [...extraServices];
      newArr.splice(index, 1);
      if (newArr.length === 0) {
          setExtraServices([{ name: "", revenue: "", discount: "" }]);
          setShowExtras(false);
      } else {
          setExtraServices(newArr);
      }
  };

  const handleChangeExtra = (index, field, value) => {
      const newArr = [...extraServices];
      if (field === "revenue") {
        const raw = value.replace(/\./g, "");
        if (!isNaN(raw)) {
            newArr[index][field] = raw.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        }
      } else {
        newArr[index][field] = value;
      }
      setExtraServices(newArr);
  };

  // --- HÀM HELPER & TRANSLATIONS ---
  const getDanhMucOptions = (serviceType) => {
    if (!serviceType) return [];
    const normalized = normalizeServiceType(serviceType).trim().toLowerCase();
    // dbCategoryMap đã bao gồm cả hardcode + DB
    const dbMatch = Object.entries(dbCategoryMap).find(([key]) => key.trim().toLowerCase() === normalized);
    if (dbMatch && dbMatch[1].length > 0) return dbMatch[1];
    // Fallback hardcode (phòng khi normalize ko khớp)
    const hardMatch = Object.entries(B2C_CATEGORY_LIST).find(([key]) => key.trim().toLowerCase() === normalized);
    return hardMatch ? hardMatch[1] : [];
  };

  const translations = {
    vi: {
      title: approveMode ? "Duyệt hồ sơ & Cấp mã" : (isNew ? "Đăng ký dịch vụ mới (B2C)" : `Cập nhật yêu cầu #${request?.YeuCauID || ""}`),
      subtitle: approveMode ? "Kiểm tra thông tin trước khi cấp duyệt" : "Nhập thông tin khách hàng và dịch vụ",
      customer: "Khách Hàng", areaCode: "Mã", phone: "Số Điện Thoại", email: "Email",
      serviceType: "Loại Dịch Vụ", category: "Danh Mục", serviceName: "Tên Dịch Vụ",
      package: "Gói", form: "Kênh Liên Hệ", branch: "Cơ Sở Tư Vấn",
      appointmentDate: "Ngày Hẹn", appointmentTime: "Giờ Hẹn", content: "Nội Dung",
      note: "Ghi Chú", assignee: "Người Phụ Trách", status: "Trạng thái",
      confirmPassword: "Mật khẩu xác nhận", 
      save: approveMode ? "DUYỆT & CẤP MÃ HỒ SƠ" : (isNew ? "Đăng ký dịch vụ mới" : "Lưu thay đổi"),
      selectServiceType: "Chọn Loại Dịch Vụ", selectCategory: "Chọn Danh Mục Chi Tiết",
      enterServiceName: "Nhập Tên Dịch Vụ Cụ Thể", selectPackage: "Chọn Gói",
      selectForm: "Chọn Hình Thức", selectBranch: "Chọn Cơ Sở", selectNguoiPT: "Chọn Người Phụ Trách", selectStatus: "Chọn Trạng Thái",
      enterName: "Nhập Tên Khách Hàng", enterPhone: "Nhập Số Điện Thoại", enterEmail: "Nhập Email", enterContent: "Nhập Nội Dung", enterNote: "Nhập Ghi Chú",
    },
    en: {
      title: approveMode ? "Approve Request" : (isNew ? "Register New Service (B2C)" : `Update Request #${request?.YeuCauID || ""}`),
      subtitle: approveMode ? "Review information before approval" : "Enter customer and service information",
      customer: "Customer", areaCode: "Code", phone: "Phone", email: "Email",
      serviceType: "Service Type", category: "Category", serviceName: "Service Name",
      package: "Package", form: "Channel", branch: "Branch",
      appointmentDate: "Date", appointmentTime: "Time", content: "Content",
      note: "Note", assignee: "Assignee", status: "Status",
      confirmPassword: "Confirm Password",
      save: approveMode ? "APPROVE & GENERATE CODE" : (isNew ? "Register New Service" : "Save Changes"),
      selectServiceType: "Select Type", selectCategory: "Select Category",
      enterServiceName: "Enter Service Name", selectPackage: "Select Package",
      selectForm: "Select Channel", selectBranch: "Select Branch", selectNguoiPT: "Select Assignee", selectStatus: "Select Status",
      enterName: "Enter Name", enterPhone: "Enter Phone", enterEmail: "Enter Email", enterContent: "Enter Content", enterNote: "Enter Note",
    },
    ko: {
      title: approveMode ? "요청 승인 및 코드 발급" : (isNew ? "새 서비스 등록 (B2C)" : `요청 #${request?.YeuCauID || ""} 업데이트`),
      subtitle: approveMode ? "승인 전에 정보를 확인하세요" : "고객 및 서비스 정보 입력",
      customer: "고객", areaCode: "코드", phone: "전화번호", email: "이메일",
      serviceType: "서비스 유형", category: "카테고리", serviceName: "서비스명",
      package: "패키지", form: "채널", branch: "지점",
      appointmentDate: "날짜", appointmentTime: "시간", content: "내용",
      note: "비고", assignee: "담당자", status: "상태",
      confirmPassword: "비밀번호 확인",
      save: approveMode ? "승인 및 코드 발급" : (isNew ? "새 서비스 등록" : "변경 사항 저장"),
      selectServiceType: "유형 선택", selectCategory: "카테고리 선택",
      enterServiceName: "서비스명 입력", selectPackage: "패키지 선택",
      selectForm: "채널 선택", selectBranch: "지점 선택", selectNguoiPT: "담당자 선택", selectStatus: "상태 선택",
      enterName: "고객명 입력", enterPhone: "전화번호 입력", enterEmail: "이메일 입력", enterContent: "내용 입력", enterNote: "비고 입력",
    }
  };
  const t = translations[currentLanguage === "vi" ? "vi" : currentLanguage === "ko" ? "ko" : "en"];
  const clickedServiceCode = String(request?.__viewServiceCode || request?.MaHoSo || "").trim();
  const requestDetailMeta = extractReceivingInfoFromDetails(request?.ChiTietDichVu);
  const modalTitle = viewMode
    ? (clickedServiceCode || (currentLanguage === "vi" ? "Chi tiết dịch vụ" : currentLanguage === "ko" ? "서비스 상세" : "Service Details"))
    : t.title;
  const modalSubtitle = viewMode
    ? (currentLanguage === "vi" ? "Thông tin đầy đủ (chỉ xem)" : currentLanguage === "ko" ? "전체 정보 (읽기 전용)" : "Full information (read-only)")
    : t.subtitle;

  // --- STATE FORM DATA ---
  const [formData, setFormData] = useState(
    isNew
      ? {
          HoTen: "", MaVung: "+84", SoDienThoai: "", Email: "",
          NoiDung: "", GhiChu: "", TenHinhThuc: "",
          NoiTiepNhanHoSo: "", DiaChiNhan: "",
          CoSoTuVan: "", Gio: "", ChonNgay: "",
          LoaiDichVu: "", DanhMuc: "", TenDichVu: "",
          MaHoSo: "", NguoiPhuTrachId: currentUser?.id || "",
          TrangThai: "Đã tạo đơn", GoiDichVu: "",
          DonViTienTe: 0,
          Invoice: "No", InvoiceUrl: "", ConfirmPassword: "",
          YeuCauXuatHoaDon: "No",
          NgayTao: "",
          NgayBatDau: "",
          NgayKetThuc: "",
          DoanhThuTruocChietKhau: "0", // String format
          MucChietKhau: 0,
        }
      : { 
          ...request,
          HoTen: request.HoTen || "",
          SoDienThoai: request.SoDienThoai || "",
          Email: request.Email || "",
          MaVung: request.MaVung || "+84",
          TenHinhThuc: request.TenHinhThuc || "Trực tiếp",
          CoSoTuVan: request.CoSoTuVan || "Seoul",
          GoiDichVu: normalizePackageOption(request.GoiDichVu) || "thường",
          Invoice: request.Invoice || "No",
          YeuCauXuatHoaDon: request.Invoice || "No",
          MaHoSo: request.MaHoSo || "",
          NguoiPhuTrachId: request.NguoiPhuTrachId || "",
          TrangThai: request.TrangThai || "Đã tạo đơn",
          ChonNgay: request.ChonNgay || "",
          Gio: request.Gio || "",
          DonViTienTe: request.DonViTienTe ?? 0,
          LoaiDichVu: normalizeServiceType(request.LoaiDichVu), 
          DanhMuc: (request.DanhMuc || "").split(",")[0],
          TenDichVu: request.TenDichVu || "",
          NoiDung: request.NoiDung || "",
          GhiChu: request.GhiChu || "",
          NoiTiepNhanHoSo: request.NoiTiepNhanHoSo || requestDetailMeta.receivingOffice || "",
          DiaChiNhan: request.DiaChiNhan || requestDetailMeta.receivingAddress || request.NoiTiepNhanHoSo || requestDetailMeta.receivingOffice || "",
          DoanhThuTruocChietKhau: formatNumber(request.DoanhThuTruocChietKhau),
          NgayTao: request.NgayTao ? new Date(request.NgayTao).toISOString().split("T")[0] : "",
          NgayBatDau: request.NgayBatDau ? new Date(request.NgayBatDau).toISOString().split("T")[0] : "",
          ChonNgay: request.ChonNgay ? new Date(request.ChonNgay).toISOString().split("T")[0] : "",
          NgayKetThuc: request.NgayKetThuc ? new Date(request.NgayKetThuc).toISOString().split("T")[0] : "",
        }
  );

  // Đã có getFilteredServiceOptions phía trên, xóa bản này để tránh trùng lặp.

  const handleInputChange = (eOrName, value) => {
    let name, val;
    if (typeof eOrName === 'string') { name = eOrName; val = value; } 
    else { name = eOrName.target.name; val = eOrName.target.value; }
    setFormData((prev) => {
      const next = { ...prev, [name]: val };
      if (name === "TrangThai" && isCompletedStatus(val) && !next.NgayKetThuc) {
        next.NgayKetThuc = getTodayDateString();
      }
      return next;
    });
  };

  // Xử lý nhập tiền (cho DoanhThu và Vi)
  const handleMoneyChange = (e) => {
    const { name, value } = e.target;
    const raw = value.toString().replace(/\./g, "");
    if (!isNaN(raw)) {
        setFormData(prev => ({ ...prev, [name]: formatNumber(raw) }));
    }
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

  // --- HÀM LƯU DỮ LIỆU ---
  const handleSave = async () => {
    // 1. Validation - Only require customer name
    if (!formData.HoTen) {
        showToast(currentLanguage === "vi" ? "Vui lòng nhập tên khách hàng" : "Please enter customer name", "warning");
        return;
    }

    // Kiểm tra ít nhất 1 dịch vụ được chọn
    const hasService = serviceSections.some((section) =>
      section.rows.some((row) => row.name && row.name.trim() !== "")
    );
    if (!hasService) {
        showToast("Vui lòng chọn ít nhất một dịch vụ", "warning");
        return;
    }

    // 2. Kiểm tra mật khẩu (nếu là mới hoặc yêu cầu xác nhận)
    if (isNew) {
      if (!formData.ConfirmPassword) {
        showToast(currentLanguage === "vi" ? "Nhập mật khẩu xác nhận!" : "Enter password!", "warning");
        return;
      }
      try {
        setLoading(true);
        const verifyRes = await fetch(`${API_BASE}/verify-password`, {
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

    // 3. XỬ LÝ DỮ LIỆU TỪ BẢNG DỊCH VỤ
    // Lọc các loại dịch vụ hợp lệ (chỉ lấy loại có trong API)
    const validServiceTypes = new Set((dichvuList || []).map(dv => (dv.LoaiDichVu || "").trim()).filter(Boolean));
    // Lọc các dịch vụ hợp lệ (chỉ lấy dịch vụ có trong API)
    const validServiceNamesByType = {};
    (dichvuList || []).forEach(dv => {
      const type = (dv.LoaiDichVu || "").trim();
      if (!type) return;
      if (!validServiceNamesByType[type]) validServiceNamesByType[type] = new Set();
      validServiceNamesByType[type].add(dv.TenDichVu);
    });

    const validServices = serviceSections.flatMap((section) => {
      // Nếu là custom service thì vẫn cho phép
      if (!section.serviceType || (!validServiceTypes.has(section.serviceType) && section.serviceType !== CUSTOM_SERVICE_TYPE_VALUE)) return [];
      return section.rows
        .filter((row) => {
          if (!row.name || !row.name.trim()) return false;
          // Nếu là custom service thì vẫn cho phép
          if (row.isCustomService || section.serviceType === CUSTOM_SERVICE_TYPE_VALUE) return true;
          // Chỉ lấy dịch vụ có trong API
          return validServiceNamesByType[section.serviceType]?.has(row.name);
        })
        .map((row) => ({ ...row, serviceType: section.serviceType || "", note: section.note || "" }));
    });
    const hasCustomService = validServices.some((row) => row.isCustomService);
    const firstSelectedServiceType = serviceSections.find((section) => section.serviceType)?.serviceType || "";
    
    // Tạo chuỗi DanhMuc (danh sách tên dịch vụ)
    const danhMucList = validServices.map(row => row.name).join(" + ");
    
    // Tính tổng doanh thu và chiết khấu từ bảng
    let totalRevenue = 0;
    let totalTax = 0;
    let totalDiscount = 0;
    
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
      
      return {
        name: row.name,
        note: row.note || "",
        isCustomService: Boolean(row.isCustomService),
        codePrefix: row.isCustomService ? "ADD" : "",
        donvi: row.donvi,
        soluong: soluong,
        loaigoi: row.loaigoi,
        dongia: dongia,
        thue: thue,
        chietkhau: chietkhau,
        thanhtien: totalAmount,
        serviceType: row.serviceType || ""
      };
    });

    // Tổng doanh thu sau thuế và chiết khấu
    const finalRevenue = totalRevenue + totalTax - totalDiscount;
    const roundedRevenue = Math.round(totalRevenue);
    const roundedTax = Math.round(totalTax);
    const roundedDiscount = Math.round(totalDiscount);
    const roundedFinalRevenue = Math.round(finalRevenue);
    const averageDiscountPercent = totalRevenue > 0 ? (totalDiscount / totalRevenue) * 100 : 0;
    const selectedPackage = normalizePackageOption(
      validServices.find((row) => String(row.loaigoi || "").trim())?.loaigoi ||
      formData.GoiDichVu ||
      "thường"
    ) || "thường";

    // 4. Tạo payload
    const payload = { 
      ...formData,
      LoaiDichVu: firstSelectedServiceType || formData.LoaiDichVu || "",
      TenDichVu: hasCustomService ? "Thêm" : (formData.TenDichVu || ""),
      GoiDichVu: selectedPackage,
      DanhMuc: danhMucList,
      DoanhThuTruocChietKhau: roundedRevenue,
      MucChietKhau: Math.round(averageDiscountPercent * 100) / 100,
      SoTienChietKhau: roundedDiscount,
      DoanhThuSauChietKhau: roundedFinalRevenue,
      ChiTietDichVu: {
        services: chiTietDichVuData,
        totals: {
          subtotal: roundedRevenue,
          tax: roundedTax,
          discount: roundedDiscount,
          total: roundedFinalRevenue
        },
        meta: {
          receivingOffice: String(formData.NoiTiepNhanHoSo || "").trim(),
          receivingAddress: String(formData.DiaChiNhan || "").trim()
        }
      }
    };

    if (isCompletedStatus(payload.TrangThai) && !payload.NgayKetThuc) {
      payload.NgayKetThuc = getTodayDateString();
    }

    delete payload.NoiTiepNhanHoSo;
    delete payload.DiaChiNhan;
    
    delete payload.ConfirmPassword;

    // 5. Upload file nếu có
    if (uploadedFile) {
      try {
        const formData = new FormData();
        formData.append("file", uploadedFile);
        
        const uploadRes = await fetch(`${API_BASE}/upload-invoice`, {
          method: "POST",
          body: formData
        });
        
        const uploadJson = await uploadRes.json();
        if (uploadJson.success) {
          payload.InvoiceUrl = uploadJson.url;
        }
      } catch (err) {
        console.error("Upload error:", err);
      }
    }

    const { DiaChiNhan: _removedDiaChiNhan, NoiTiepNhanHoSo: _removedNoiTiepNhanHoSo, ...safePayload } = payload;

    setLoading(true);
    await onSave(safePayload);
    setLoading(false);
  };

  // --- STYLES ---
  const inputStyle = {
    width: "100%", height: "44px", padding: "0 14px", borderRadius: "10px",
    border: "1px solid #d1d5db", fontSize: "13px", color: "#111827",
    backgroundColor: "#ffffff", outline: "none", transition: "border-color 0.2s"
  };
  const labelStyle = { fontSize: "13px", fontWeight: "600", color: "#111827", marginBottom: "2px", display: "block" };
  const areaCodes = [{ value: "+82", label: "+82" }, { value: "+84", label: "+84" }];
  const formOptions = currentLanguage === "vi" ? ["Messenger","Kakao Talk", "Zalo","Naver Talk", "Email", "Gọi điện","Trực tiếp"] : ["Messenger","Kakao Talk", "Zalo","Naver Talk", "Email", "Phone", "Direct"];
  const branchOptions = [
    { value: "Seoul", label: "Seoul" },
    { value: "Busan", label: "Busan" },
    { value: "Hà Nội", label: "Hà Nội" }
  ];
  const statusOptions = [
    "Đang tư vấn",
    "Đã tạo đơn",
    "Đã thanh toán",
    "Nộp hồ sơ",
    "Trả kết quả",
    "Hoàn thành"
  ];
  const currencyOptions = [{ value: 0, label: "VND" }, { value: 1, label: "KRW" }];
  const packageOptions = [
    { value: "thường", label: "Thường" },
    { value: "gấp 1", label: "Gấp 1" },
    { value: "gấp 0", label: "Gấp 0" }
  ];
  const discountOptions = [{ value: 0, label: "0%" }, { value: 5, label: "5%" }, { value: 10, label: "10%" }, { value: 12, label: "12%" }, { value: 15, label: "15%" }, { value: 17, label: "17%" }, { value: 30, label: "30%" }];
  // Luôn dùng hardcode làm base, thêm cả nhóm gộp lẫn tên loại gốc từ trang quản lý dịch vụ
  // Đã có serviceTypeOptions phía trên, xóa bản này để tránh trùng lặp.

  return (
    <div className="modal-overlay" style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050, backdropFilter: "blur(3px)",
      display: "flex", justifyContent: "center", alignItems: "center"
    }}>
      <div className="bg-white p-4 position-relative" 
          style={{ width: "1100px", maxWidth: "95%", borderRadius: "16px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)", maxHeight: "90vh", overflowY: "auto" }}
      >
        <button onClick={onClose} className="position-absolute d-flex align-items-center justify-content-center border-0 bg-light rounded-circle" style={{ top: "15px", right: "15px", width: "32px", height: "32px", cursor: "pointer", zIndex: 10 }}>
            <X size={18} />
        </button>

        <div className="text-center mb-4 mt-2">
          <h3 className="fw-bold m-0" style={{ fontSize: "20px", color: "#111827" }}>{modalTitle}</h3>
          <p className="text-muted m-0 mt-1" style={{ fontSize: "13px" }}>{modalSubtitle}</p>
        </div>

        <div className="row g-3" style={viewMode ? { pointerEvents: "none" } : undefined}>
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
                <input 
                  type="text" 
                  name="HoTen" 
                  value={formData.HoTen ?? ""} 
                  onChange={handleInputChange}
                  placeholder={t.enterName}
                  style={{...inputStyle, height: "44px"}} 
                />
              </div>
            </div>

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
                    value={formData.MaVung ?? ""}
                    placeholder="+84"
                    options={areaCodes}
                    onChange={handleInputChange}
                  />
                </div>
                <input
                  type="text"
                  name="SoDienThoai"
                  value={formData.SoDienThoai ?? ""}
                  onChange={handleInputChange}
                  placeholder={t.enterPhone}
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
                  value={formData.Email ?? ""}
                  onChange={handleInputChange}
                  placeholder={t.enterEmail}
                  style={{...inputStyle, height: "44px"}}
                />
              </div>
            </div>
          </div>
          
          <div className="col-md-7" style={{ paddingLeft: "30px" }}>
            <div className="row g-3">
              {!isNew && (
                <div className="col-12">
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ minWidth: "110px", flexShrink: 0 }}>
                      <label style={{...labelStyle, marginBottom: "0", display: "block"}}>
                        Ngày tạo
                      </label>
                      <p style={{ fontSize: "11px", color: "#9ca3af", margin: "3px 0 0 0", fontStyle: "italic", lineHeight: "1.3" }}>
                        Ngày hệ thống tạo hồ sơ
                      </p>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div 
                        onClick={(e) => e.currentTarget.querySelector('input').showPicker?.()}
                        style={{ cursor: "pointer" }}
                      >
                        <input 
                          type="date" 
                          name="NgayTao" 
                          style={{...inputStyle, height: "44px", cursor: "pointer"}}
                          value={formData.NgayTao || ""}
                          onChange={handleInputChange}
                          placeholder="Chọn ngày"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
                    <div 
                      onClick={(e) => e.currentTarget.querySelector('input').showPicker?.()}
                      style={{ cursor: "pointer" }}
                    >
                      <input 
                        type="date" 
                        name="NgayBatDau" 
                        style={{...inputStyle, height: "44px", cursor: "pointer"}}
                        value={formData.NgayBatDau || ""}
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
                    <div 
                      onClick={(e) => e.currentTarget.querySelector('input').showPicker?.()}
                      style={{ cursor: "pointer" }}
                    >
                      <input 
                        type="date" 
                        name="ChonNgay" 
                        style={{...inputStyle, height: "44px", cursor: "pointer"}}
                        value={formData.ChonNgay || ""}
                        onChange={handleInputChange}
                        placeholder="2025-01-20"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {!isNew && (
                <>
                  <div className="col-12">
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ minWidth: "110px", flexShrink: 0 }}>
                        <label style={{...labelStyle, marginBottom: "0", display: "block"}}>
                          Ngày hoàn thành
                        </label>
                        <p style={{ fontSize: "11px", color: "#9ca3af", margin: "3px 0 0 0", fontStyle: "italic", lineHeight: "1.3" }}>
                          Ngày hồ sơ hoàn thành
                        </p>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div 
                          onClick={(e) => e.currentTarget.querySelector('input').showPicker?.()}
                          style={{ cursor: "pointer" }}
                        >
                          <input 
                            type="date" 
                            name="NgayKetThuc" 
                            style={{...inputStyle, height: "44px", cursor: "pointer"}}
                            value={formData.NgayKetThuc || ""}
                            onChange={handleInputChange}
                            placeholder="Chọn ngày"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="col-12">
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ minWidth: "110px", flexShrink: 0 }}>
                    <label style={{...labelStyle, marginBottom: "0", display: "block"}}>
                      Trạng thái
                    </label>
                    <p style={{ fontSize: "11px", color: "#9ca3af", margin: "3px 0 0 0", fontStyle: "italic", lineHeight: "1.3" }}>
                      Chọn trạng thái xử lý hồ sơ
                    </p>
                  </div>
                  <div style={{ flex: 1 }}>
                    <ModernSelect
                      name="TrangThai"
                      height="44px"
                      value={formData.TrangThai ?? ""}
                      placeholder={t.selectStatus}
                      options={statusOptions.map((status) => ({ value: status, label: status }))}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* BẢNG DỊCH VỤ MỚI - THEO THIẾT KẾ TRONG ẢNH */}
          <div className="col-12 mt-3">
             <label style={{...labelStyle, fontSize: "14px", marginBottom: "10px"}}>
               Dịch vụ <span className="text-danger">*</span>
             </label>
             
             {/* Bảng dịch vụ */}
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
                     <React.Fragment key={`section-${sectionIndex}`}>
                       <tr style={{ backgroundColor: "#f3f4f6" }}>
                         <td style={{ width: "30px", padding: "10px", textAlign: "center" }}></td>
                         <td style={{ padding: "10px" }}>
                           <ModernSelect
                             name={`LoaiDichVu-${sectionIndex}`}
                             height="32px"
                             value={section.serviceType ?? ""}
                             placeholder="Chọn loại dịch vụ"
                             noBorder={true}
                             backgroundColor="#f3f4f6"
                             width="260px"
                             options={[
                               { value: "", label: "Chọn loại dịch vụ" },
                               { value: CUSTOM_SERVICE_TYPE_VALUE, label: "Dịch vụ thêm" },
                               ...serviceTypeOptions
                             ]}
                             onChange={(e) => handleServiceTypeChange(sectionIndex, e.target.value)}
                           />
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
                       {section.rows.map((row, rowIndex) => (
                         <tr key={`section-${sectionIndex}-row-${rowIndex}`} style={{ backgroundColor: "#ffffff" }}>
                           <td style={{ padding: "8px", textAlign: "center", color: "#d1d5db" }}>
                             <span style={{ fontSize: "14px", cursor: "grab" }}>⋮⋮</span>
                           </td>
                           <td style={{ padding: "8px" }}>
                             {row.isCustomService ? (
                               <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                 <input
                                   type="text"
                                   value={row.name ?? ""}
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
                                 value={row.name ?? ""}
                                 placeholder={rowIndex === 0 ? "Nhập dịch vụ" : "Chọn"}
                                 noBorder={true}
                                 backgroundColor="white"
                                 width="260px"
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
                                 value={section.note || ""}
                                 onChange={(e) => handleServiceNoteChange(sectionIndex, e.target.value)}
                                 placeholder="Nhập ghi chú"
                                 style={{
                                   width: "100%",
                                   height: "20px",
                                   marginTop: "4px",
                                   padding: "2px 4px",
                                   fontSize: "11px",
                                   color: "#374151",
                                   border: "none",
                                   borderRadius: "0",
                                   backgroundColor: "transparent",
                                   outline: "none",
                                   fontStyle: "italic"
                                 }}
                               />
                             )}
                           </td>
                           <td style={{ padding: "8px" }}>
                             <ModernSelect
                               name={`donvi-${sectionIndex}-${rowIndex}`}
                               height="32px"
                               value={row.donvi ?? ""}
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
                             <input
                               type="number"
                               value={row.soluong ?? ""}
                               onChange={(e) => handleServiceRowChange(sectionIndex, rowIndex, "soluong", e.target.value)}
                               style={{ width: "100%", height: "32px", textAlign: "center", padding: "4px", border: "none", borderRadius: "0", fontSize: "13px", color: "#111827", backgroundColor: "white", outline: "none" }}
                             />
                           </td>
                           <td style={{ padding: "8px" }}>
                             <ModernSelect
                               name={`loaigoi-${sectionIndex}-${rowIndex}`}
                               height="32px"
                               value={row.loaigoi ?? ""}
                               placeholder="Chọn"
                               noBorder={true}
                               backgroundColor="white"
                               options={[
                                 { value: "", label: "Chọn" },
                                 { value: "thường", label: "Thường" },
                                 { value: "gấp 1", label: "Gấp 1" },
                                 { value: "gấp 0", label: "Gấp 0" }
                               ]}
                               onChange={(e) => handleServiceRowChange(sectionIndex, rowIndex, "loaigoi", e.target.value)}
                             />
                           </td>
                           <td style={{ padding: "8px" }}>
                             <input
                               type="text"
                               value={row.dongia ?? ""}
                               onChange={(e) => handleServiceRowChange(sectionIndex, rowIndex, "dongia", e.target.value)}
                               placeholder="Nhập vào"
                               style={{ width: "100%", height: "32px", textAlign: "right", padding: "4px 8px", border: "none", borderRadius: "0", fontSize: "13px", color: "#111827", backgroundColor: "white", outline: "none" }}
                             />
                           </td>
                           <td style={{ padding: "8px" }}>
                             <ModernSelect
                               name={`thue-${sectionIndex}-${rowIndex}`}
                               height="32px"
                               value={row.thue ?? ""}
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
                               value={row.chietkhau ?? ""}
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
                             <input
                               type="text"
                               value={row.thanhtien ?? ""}
                               readOnly
                               style={{ width: "100%", height: "32px", textAlign: "right", padding: "4px 8px", border: "none", borderRadius: "0", fontSize: "13px", color: "#111827", backgroundColor: "white", outline: "none" }}
                             />
                           </td>
                           <td style={{ padding: "8px", textAlign: "center" }}>
                             {(rowIndex > 0 || serviceSections.length > 1) && (
                               <button
                                 type="button"
                                 onClick={() => handleRemoveServiceRow(sectionIndex, rowIndex)}
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
                                 <Trash2 size={13} />
                               </button>
                             )}
                           </td>
                         </tr>
                       ))}
                     </React.Fragment>
                   ))}
                 </tbody>
               </table>
               
               {/* Nút thêm dịch vụ */}
               <div style={{ padding: "10px", borderTop: "1px solid #e5e7eb", display: "flex", gap: "10px" }}>
                 <button
                   type="button"
                   onClick={handleAddServiceSection}
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
                   onClick={() => handleAddServiceRow(serviceSections.length - 1)}
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
                onClick={() => setFormData(prev => ({...prev, YeuCauXuatHoaDon: "Yes", Invoice: "Yes"}))}
                style={{
                  flex: 1,
                  padding: "8px 24px",
                  borderRadius: "8px",
                  border: `1px solid ${formData.YeuCauXuatHoaDon === "Yes" ? "#374151" : "#6b7280"}`,
                  backgroundColor: formData.YeuCauXuatHoaDon === "Yes" ? "#e5e7eb" : "#f3f4f6",
                  color: formData.YeuCauXuatHoaDon === "Yes" ? "#374151" : "#9ca3af",
                  fontSize: "13px",
                  fontWeight: formData.YeuCauXuatHoaDon === "Yes" ? "400" : "400",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: formData.YeuCauXuatHoaDon === "Yes" ? "0 0 0 1px #374151 inset" : "none"
                }}
              >
                Có
              </button>
              <button 
                type="button" 
                onClick={() => setFormData(prev => ({...prev, YeuCauXuatHoaDon: "No", Invoice: "No"}))}
                style={{
                  flex: 1,
                  padding: "8px 24px",
                  borderRadius: "8px",
                  border: `1px solid ${formData.YeuCauXuatHoaDon === "No" ? "#374151" : "#6b7280"}`,
                  backgroundColor: formData.YeuCauXuatHoaDon === "No" ? "#e5e7eb" : "#f3f4f6",
                  color: formData.YeuCauXuatHoaDon === "No" ? "#374151" : "#9ca3af",
                  fontSize: "13px",
                  fontWeight: formData.YeuCauXuatHoaDon === "No" ? "400" : "400",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: formData.YeuCauXuatHoaDon === "No" ? "0 0 0 1px #374151 inset" : "none"
                }}
              >
                Không
              </button>
            </div>
          </div>

          <div className="col-12" style={{ display: "flex", gap: "30px", alignItems: "center", justifyContent: "center" }}>
            <div style={{ minWidth: "320px", width: "320px", flexShrink: 0, borderBottom: "1px solid #e5e7eb", paddingBottom: "6px" }}>
              <label style={{...labelStyle, fontSize: "13px", marginBottom: "0"}}>
                Kênh liên hệ
              </label>
              <p style={{ fontSize: "11px", color: "#9ca3af", margin: "2px 0 0 0", fontStyle: "italic" }}>
                Chọn kênh tiếp nhận khách hàng
              </p>
            </div>
            <div style={{ width: "320px" }}>
              <ModernSelect
                name="TenHinhThuc"
                height="36px"
                value={formData.TenHinhThuc ?? ""}
                placeholder={t.selectForm}
                options={formOptions.map((form) => ({ value: form, label: form }))}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="col-12" style={{ display: "flex", gap: "30px", alignItems: "center", justifyContent: "center" }}>
            <div style={{ minWidth: "320px", width: "320px", flexShrink: 0, borderBottom: "1px solid #e5e7eb", paddingBottom: "6px" }}>
              <label style={{...labelStyle, fontSize: "13px", marginBottom: "0"}}>
                Cơ sở
              </label>
              <p style={{ fontSize: "11px", color: "#9ca3af", margin: "2px 0 0 0", fontStyle: "italic" }}>
                Chọn cơ sở xử lý hồ sơ
              </p>
            </div>
            <div style={{ width: "320px" }}>
              <ModernSelect
                name="CoSoTuVan"
                height="36px"
                value={formData.CoSoTuVan ?? ""}
                placeholder={t.selectBranch}
                options={branchOptions}
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
                Tài liệu các hồ sơ đã nhận viên kiểm tra
              </p>
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", width: "320px" }}>
              <label style={{
                flex: 1,
                padding: "8px 20px",
                backgroundColor: "#e5e7eb",
                border: "1px solid #374151",
                borderRadius: "8px",
                fontSize: "12px",
                cursor: "pointer",
                display: "inline-block",
                textAlign: "center",
                color: "#374151",
                fontWeight: "400",
                boxShadow: "0 0 0 1px #374151 inset",
                transition: "all 0.2s"
              }}>
                Chọn file
                <input 
                  type="file" 
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setUploadedFile(file);
                      setUploadedFileName(file.name);
                    }
                  }}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
              </label>
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: "8px 20px",
                  backgroundColor: "#e5e7eb",
                  color: "#374151",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  fontSize: "12px",
                  cursor: "pointer",
                  fontWeight: "400",
                  boxShadow: "0 0 0 1px #374151 inset",
                  transition: "all 0.2s"
                }}
              >
                Xem hồ sơ
              </button>
              {uploadedFileName && (
                <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600" }}>{uploadedFileName}</span>
              )}
            </div>
          </div>

          {/* GHI CHÚ + TỔNG KẾT */}
          <div className="col-12" style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "30px", alignItems: "start" }}>
            <div>
              <label style={{ fontSize: "13px", fontWeight: "400", color: "#9ca3af", marginBottom: "8px", display: "block" }}>
                Ghi chú :
              </label>
              <textarea 
                rows={3}
                name="GhiChu"
                value={formData.GhiChu ?? ""}
                onChange={handleInputChange}
                placeholder="Nhập ghi chú..."
                style={{
                  width: "100%",
                  minHeight: "100px",
                  padding: "12px 14px",
                  borderRadius: "16px",
                  border: "1px solid #e5e7eb",
                  fontSize: "13px",
                  color: "#111827",
                  backgroundColor: "#f3f4f6",
                  outline: "none",
                  resize: "vertical"
                }}
              />
            </div>
            <div style={{ paddingTop: "28px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", textAlign: "right" }}>
                  <span style={{ color: "#6b7280", fontWeight: "400" }}>Số tiền trước thuế :</span>
                  <span style={{ fontWeight: "400", color: "#111827", marginLeft: "12px" }}>
                    {formatNumber(totals.subtotal)}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", textAlign: "right" }}>
                  <span style={{ color: "#6b7280", fontWeight: "400" }}>Thuế GTGT :</span>
                  <span style={{ fontWeight: "400", color: "#111827", marginLeft: "12px" }}>
                    {formatNumber(totals.totalThue)}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", borderTop: "1px solid #d1d5db", paddingTop: "8px" }}>
                  <span style={{ color: "#111827", fontWeight: "700" }}>TỔNG :</span>
                  <span style={{ fontWeight: "700", color: "#111827", marginLeft: "12px" }}>
                    {formatNumber(totals.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* CHỌN NGƯỜI PHỤ TRÁCH */}
          {!viewMode && (
          <div className="col-12" style={{ display: "flex", justifyContent: "center", gap: "40px", flexWrap: "wrap" }}>
            {(currentUser?.is_admin || currentUser?.is_director || currentUser?.is_accountant) && (
              <div style={{ width: "360px" }}>
                <label style={{...labelStyle, fontSize: "13px"}}>
                  Chọn người phụ trách <span className="text-danger">*</span>
                </label>
                <ModernSelect 
                  name="NguoiPhuTrachId" 
                  height="38px" 
                  value={formData.NguoiPhuTrachId ?? ""} 
                  placeholder="Chọn tên người phụ trách" 
                  options={users.map(u => ({ value: String(u.id), label: u.name }))} 
                  onChange={handleInputChange} 
                />
                <p style={{ fontSize: "11px", color: "#2563eb", margin: "6px 0 0" }}>
                  Người phụ trách trong danh sách nhân viên công ty
                </p>
              </div>
            )}
            
            {/* NHẬP MẬT KHẨU ĐỂ XÁC NHẬN ĐĂNG KÝ */}
            <div style={{ width: "360px" }}>
              <label style={{...labelStyle, fontSize: "13px"}}>
                Nhập mật khẩu để xác nhận đăng ký <span className="text-danger">*</span>
              </label>
              <div className="position-relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="ConfirmPassword"
                  value={formData.ConfirmPassword ?? ""}
                  onChange={handleInputChange}
                  placeholder="Mật khẩu xác nhận"
                  style={{...inputStyle, paddingRight: "35px"}}
                />
                <span
                  className="position-absolute top-50 translate-middle-y end-0 me-2"
                  style={{ cursor: "pointer" }}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                </span>
              </div>
              <p style={{ fontSize: "11px", color: "#2563eb", margin: "6px 0 0" }}>
                Mật khẩu khi đăng ký doanh nghiệp
              </p>
            </div>
          </div>
          )}

          {/* NÚT XÁC NHẬN */}
          {!viewMode && (
          <div className="col-12 mt-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              style={{
                width: "280px",
                padding: "10px 16px",
                backgroundColor: "#22c55e",
                color: "white",
                border: "none",
                borderRadius: "14px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                margin: "0 auto",
                boxShadow: "0 6px 16px rgba(34, 197, 94, 0.35)"
              }}
            >
              {loading ? (
                <span className="spinner-border spinner-border-sm"></span>
              ) : (
                t.save
              )}
            </button>
          </div>
          )}

        </div>

        {viewMode && (
          <div className="mt-4" style={{ display: "flex", justifyContent: "center" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: "220px",
                padding: "10px 16px",
                backgroundColor: "#2563eb",
                color: "white",
                border: "none",
                borderRadius: "14px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              {currentLanguage === "vi" ? "Đóng" : currentLanguage === "ko" ? "닫기" : "Close"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};




const RowItem = ({
  item,
  currentUser,
  onEdit,
  onViewDetail,
  onDelete,
  onApprove,
  currentLanguage,
  visibleColumns,
  pinnedColumns,
}) => {
  const canApprove = currentUser?.is_director || currentUser?.perm_approve_b2c;
  const canViewFinance = currentUser?.is_accountant || currentUser?.is_director;
  const hasServiceCode = item.MaHoSo && item.MaHoSo.length > 5;

  // --- [ĐÃ SỬA] THÊM HÀM XỬ LÝ XÓA ---
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

  // --- Xử lý dữ liệu ChiTietDichVu (Tách dòng) ---
  const details = typeof item.ChiTietDichVu === 'string' 
      ? JSON.parse(item.ChiTietDichVu) 
      : (item.ChiTietDichVu || { main: {}, sub: [] });

  let rowsToRender = [];
  let hasCustomServiceInRecord = false;
  let hasRegularServiceInRecord = false;

  // HỖ TRỢ CẤU TRÚC MỚI: {services: [...], totals: {...}}
  if (details.services && Array.isArray(details.services) && details.services.length > 0) {
      // Lấy danh sách unique service types từ DanhMuc nếu có
      const serviceNames = (item.DanhMuc || "").split(" + ").map(s => s.trim()).filter(Boolean);
      
      details.services.forEach((service, idx) => {
          const serviceName = service.name || serviceNames[idx] || "";
          const isKnownServiceName = B2C_KNOWN_SERVICE_NAMES.has(normalizeServiceName(serviceName));
          const isCustomService = Boolean(
            service?.isCustomService ||
            String(service?.codePrefix || "").trim().toUpperCase() === "ADD" ||
            !isKnownServiceName
          );

          if (isCustomService) hasCustomServiceInRecord = true;
          else hasRegularServiceInRecord = true;

          const soluong = parseFloat(service.soluong) || 1;
          const dongia = parseFloat(service.dongia) || 0;
          const thue = parseFloat(service.thue) || 0;
          const chietkhau = parseFloat(service.chietkhau) || 0;
          
          const subtotal = soluong * dongia;
          const taxAmount = subtotal * (thue / 100);
          const discountAmount = subtotal * (chietkhau / 100);
          const revenue = subtotal + taxAmount;
          const revenueAfterDiscount = revenue - discountAmount;
          
            // Lấy serviceType từ tên dịch vụ (map với danh mục đã ghép từ backend)
          let serviceType = item.LoaiDichVu || "";
            // Tìm loại dịch vụ từ dbCategoryMap dựa trên tên
            Object.entries(dbCategoryMap).forEach(([category, items]) => {
              if (items.includes(serviceName)) {
                  serviceType = category;
              }
          });
          
          rowsToRender.push({
              isMain: idx === 0,
              name: serviceName,
              serviceType: serviceType,
              isCustomService,
              package: normalizePackageForDisplay(service.loaigoi || service.GoiDichVu || service.package),
              note: String(service.note || service.ghiChu || service.serviceNote || "").trim(),
              revenue: revenue,
              discount: chietkhau,
              revenueAfterDiscount: revenueAfterDiscount
          });
      });
  } 
  // CẤU TRÚC CŨ: {main: {...}, sub: [...]}
  else if (details.main || details.sub) {
      // Dòng chính (Main)
      const mainData = {
          isMain: true,
          name: item.DanhMuc ? item.DanhMuc.split(" + ")[0] : "",
          isCustomService: false,
          package: normalizePackageForDisplay(details?.main?.loaigoi || details?.main?.GoiDichVu || item.GoiDichVu),
          note: String(details?.main?.note || details?.main?.ghiChu || "").trim(),
          revenue: (details.main && details.main.revenue !== undefined) ? details.main.revenue : item.DoanhThuTruocChietKhau,
          discount: (details.main && details.main.discount !== undefined) ? details.main.discount : item.MucChietKhau,
      };
      rowsToRender.push(mainData);

      // Các dòng phụ (Sub)
      if (details.sub && details.sub.length > 0) {
          details.sub.forEach(sub => {
              rowsToRender.push({
                  isMain: false,
                  name: sub.name,
                  isCustomService: false,
                  package: normalizePackageForDisplay(sub.loaigoi || sub.GoiDichVu || sub.package),
                  note: String(sub.note || sub.ghiChu || "").trim(),
                  revenue: sub.revenue,
                  discount: sub.discount
              });
          });
      } else {
          // Fallback: Dữ liệu cũ từ DanhMuc
          const parts = (item.DanhMuc || "").split(" + ");
          if (parts.length > 1) {
              parts.slice(1).forEach(subName => {
                  rowsToRender.push({
                      isMain: false,
                      name: subName,
                    isCustomService: false,
                    package: "",
                    note: "",
                      revenue: 0, 
                      discount: 0
                  });
              });
          }
      }
  }
  // FALLBACK CỰC CUỐI: Không có ChiTietDichVu
  else {
      const mainData = {
          isMain: true,
          name: item.DanhMuc ? item.DanhMuc.split(" + ")[0] : "",
          isCustomService: false,
        package: normalizePackageForDisplay(item.GoiDichVu),
          note: "",
          revenue: item.DoanhThuTruocChietKhau || 0,
          discount: item.MucChietKhau || 0,
      };
      rowsToRender.push(mainData);
  }

  const shouldHideServiceCode = hasCustomServiceInRecord && hasRegularServiceInRecord;

  const rowSpanCount = rowsToRender.length;

  // Helper Functions
  const calculateRowStats = (row) => {
      const rev = Number(row.revenue) || 0;
      const disc = Number(row.discount) || 0;
      const discAmount = rev * (disc / 100);
      // Nếu row đã có revenueAfterDiscount thì dùng luôn
      const after = row.revenueAfterDiscount !== undefined ? Number(row.revenueAfterDiscount) : (rev - discAmount);
      return { rev, disc, discAmount, after };
  };
  const totalRevenueAfterDiscount = rowsToRender.reduce((sum, row) => {
      const stats = calculateRowStats(row);
      return sum + stats.after;
  }, 0);

  function normalizePackageForDisplay(value) {
      const normalized = String(value || "")
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
      if (!normalized) return "";
      if (normalized === "thong thuong" || normalized === "thuong") return "Thường";
      if (normalized === "cap toc" || normalized === "gap 1") return "Gấp 1";
      if (normalized === "gap 0") return "Gấp 0";
      return String(value || "").trim();
  }

  const formatNumber = (value) => (!value ? "0" : value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."));
  const translateBranch = (branch) => {
    const map = { 서울: "Seoul", 부산: "Busan", 하노이: "Hà Nội" };
    return map[branch] || branch || "";
  };
  const currencySymbol = Number(item.DonViTienTe) === 1 ? " ₩" : " ₫";

  const isVisible = (key) => (visibleColumns ? visibleColumns[key] : true);
  const isPinned = (key) => pinnedColumns.includes(key);
  const getStickyClass = (key) => (isPinned(key) ? `sticky-col sticky-col-${key}` : "");

  // Style cho ô gộp (Merged Cells)
  const mergedStyle = {
      verticalAlign: "middle",
      backgroundColor: "#fff", 
      borderBottom: "1px solid #dee2e6"
  };

    const actionStickyCellStyle = {
      position: "sticky",
      right: 0,
      zIndex: 12,
      width: "132px",
      minWidth: "132px",
      maxWidth: "132px",
      backgroundColor: "#fff",
      boxShadow: "-2px 0 6px rgba(0, 0, 0, 0.08)",
      borderLeft: "1px solid #dee2e6"
    };

  return (
    <>
      {rowsToRender.map((row, idx) => {
        const isFirst = idx === 0;
        const stats = calculateRowStats(row);
        const rowServiceCode = hasServiceCode ? buildCodeByServiceName(item.MaHoSo, row.name) : "";

        return (
          <tr key={`${item.YeuCauID}_${idx}`} className="hover-bg-gray">
            
            {/* === CÁC CỘT GỘP (CHỈ RENDER Ở DÒNG ĐẦU TIÊN) === */}
            
            {isVisible("id") && isFirst && (
              <td
                rowSpan={rowSpanCount}
                className={`text-center fw-semibold border-target ${getStickyClass("id")}`}
                style={{ ...mergedStyle, width: `${B2C_COLUMN_WIDTHS.id}px`, minWidth: `${B2C_COLUMN_WIDTHS.id}px`, paddingLeft: "8px", paddingRight: "8px" }}
              >
                {item.YeuCauID}
              </td>
            )}

            {isVisible("hoTen") && isFirst && (
              <td rowSpan={rowSpanCount} className={`text-center fw-semibold ${getStickyClass("hoTen")}`} style={{...mergedStyle, minWidth: "120px"}}>
                {item.HoTen}
              </td>
            )}

            {isVisible("maVung") && isFirst && <td rowSpan={rowSpanCount} className={`text-center ${getStickyClass("maVung")}`} style={mergedStyle}>{item.MaVung}</td>}
            {isVisible("sdt") && isFirst && <td rowSpan={rowSpanCount} className={`text-center ${getStickyClass("sdt")}`} style={mergedStyle}>{item.SoDienThoai}</td>}
            {isVisible("email") && isFirst && <td rowSpan={rowSpanCount} className={`text-center ${getStickyClass("email")}`} style={{...mergedStyle, minWidth: "180px", maxWidth: "240px", whiteSpace: "normal", wordBreak: "break-all"}} title={item.Email}>{item.Email}</td>}

            {isVisible("hinhThuc") && isFirst && <td rowSpan={rowSpanCount} className={`text-center ${getStickyClass("hinhThuc")}`} style={mergedStyle}>{item.TenHinhThuc}</td>}
            {isVisible("coSo") && isFirst && <td rowSpan={rowSpanCount} className={`text-center ${getStickyClass("coSo")}`} style={mergedStyle}>{translateBranch(item.CoSoTuVan)}</td>}
            {isVisible("diaChiNhan") && isFirst && (
              <td rowSpan={rowSpanCount} className={`${getStickyClass("diaChiNhan")}`} style={{ ...mergedStyle, minWidth: "150px", maxWidth: "220px", whiteSpace: "normal", wordBreak: "break-word", textAlign: "center" }}>
                {item.DiaChiNhan || item.NoiTiepNhanHoSo || details?.meta?.receivingAddress || details?.meta?.receivingOffice || ""}
              </td>
            )}
            {isVisible("noiTiepNhanHoSo") && isFirst && (
              <td rowSpan={rowSpanCount} className={`${getStickyClass("noiTiepNhanHoSo")}`} style={{ ...mergedStyle, minWidth: "150px", maxWidth: "220px", whiteSpace: "normal", wordBreak: "break-word", textAlign: "center" }}>
                {item.NoiTiepNhanHoSo || details?.meta?.receivingOffice || details?.meta?.NoiTiepNhanHoSo || ""}
              </td>
            )}
            {isVisible("loaiDichVu") && (
                <td className={`text-center text-truncate ${getStickyClass("loaiDichVu")}`} style={{ maxWidth: "150px", verticalAlign: "middle", backgroundColor: "#fff", borderBottom: "1px solid #dee2e6" }}>
                    {/* Hiển thị serviceType của từng row thay vì item.LoaiDichVu tổng hợp */}
                    {translateService(row.serviceType || item.LoaiDichVu, currentLanguage)} 
                </td>
            )}

            {isVisible("danhMuc") && (
                <td className={`text-start ${getStickyClass("danhMuc")}`} style={{ minWidth: "200px", verticalAlign: "middle" }}>
                    
                    <div style={{ fontWeight: row.isMain ? "400" : "400", color: row.isMain ? "" : "" ,paddingLeft:3, whiteSpace: "normal"}}>
                        {row.name}
                    </div>
                </td>
            )}
            {isVisible("maDichVu") && (
              <td className={`text-center ${getStickyClass("maDichVu")}`} style={{ width: 200, minWidth: 200, verticalAlign: "middle", backgroundColor: "#fff", borderBottom: "1px solid #dee2e6", whiteSpace: "nowrap" }}>
                {rowServiceCode ? (
                  <button
                    type="button"
                    onClick={() => onViewDetail(item, rowServiceCode, row)}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "#1d4ed8",
                      fontWeight: 600,
                      textDecoration: "underline",
                      cursor: "pointer",
                      padding: 0,
                      whiteSpace: "nowrap"
                    }}
                    title={currentLanguage === "vi" ? "Xem chi tiết" : "View details"}
                  >
                    {rowServiceCode}
                  </button>
                ) : ""}
              </td>
            )}
            {isVisible("ghiChuDichVu") && (
              <td className={`${getStickyClass("ghiChuDichVu")}`} style={{ minWidth: "150px", maxWidth: "220px", verticalAlign: "middle", backgroundColor: "#fff", borderBottom: "1px solid #dee2e6", whiteSpace: "normal", wordBreak: "break-word" }}>
                {row.note || (isFirst ? (item.GhiChuDichVu || item.GhiChuDV || "") : "")}
              </td>
            )}

            {(currentUser?.is_admin || currentUser?.is_director || currentUser?.is_accountant) && isVisible("nguoiPhuTrach") && isFirst && (
                <td rowSpan={rowSpanCount} className={`text-center ${getStickyClass("nguoiPhuTrach")}`} style={mergedStyle}>
                    {item.NguoiPhuTrach?.name || ""}
                </td>
            )}

            {isVisible("ngayTao") && isFirst && (
              <td rowSpan={rowSpanCount} className={`text-center ${getStickyClass("ngayTao")}`} style={mergedStyle}>
                {item.NgayTao ? new Date(item.NgayTao).toLocaleDateString("vi-VN") : ""}
              </td>
            )}
            {isVisible("ngayBatDau") && isFirst && (
                <td rowSpan={rowSpanCount} className={`text-center ${getStickyClass("ngayBatDau")}`} style={mergedStyle}>
                    {item.NgayBatDau ? new Date(item.NgayBatDau).toLocaleDateString("vi-VN") : ""}
                </td>
            )}
            {isVisible("ngayHen") && isFirst && <td rowSpan={rowSpanCount} className={`text-center ${getStickyClass("ngayHen")}`} style={mergedStyle}>{item.ChonNgay ? new Date(item.ChonNgay).toLocaleDateString("vi-VN") : ""}</td>}
            {isVisible("ngayKetThuc") && isFirst && (
                <td rowSpan={rowSpanCount} className={`text-center ${getStickyClass("ngayKetThuc")}`} style={mergedStyle}>
                    {item.NgayKetThuc ? new Date(item.NgayKetThuc).toLocaleDateString("vi-VN") : ""}
                </td>
            )}
            {isVisible("trangThai") && isFirst && <td rowSpan={rowSpanCount} className={`text-center ${getStickyClass("trangThai")}`} style={mergedStyle}>{item.TrangThai}</td>}
            {isVisible("goiDichVu") && (
              <td className={`text-center ${getStickyClass("goiDichVu")}`} style={{ width: 102, verticalAlign: "middle", backgroundColor: "#fff", borderBottom: "1px solid #dee2e6" }}>
                {row.package || (isFirst ? normalizePackageForDisplay(item.GoiDichVu) : "")}
              </td>
            )}
            {isVisible("invoice") && isFirst && <td rowSpan={rowSpanCount} className={`text-center ${getStickyClass("invoice")}`} style={mergedStyle}>{item.Invoice === "Yes" ? <span className="text-success fw-bold">Yes</span> : <span className="text-muted">No</span>}</td>}
            {canViewFinance && isVisible("invoiceUrl") && isFirst && <td rowSpan={rowSpanCount} className={`text-center ${getStickyClass("invoiceUrl")}`} style={mergedStyle}>{item.InvoiceUrl ? <a href={item.InvoiceUrl} target="_blank" rel="noreferrer">Link</a> : "-"}</td>}
            
            {/* SỬA CỘT GHI CHÚ: Bỏ text-truncate, thêm whiteSpace: "normal" */}
            {isVisible("ghiChu") && isFirst && (
                <td rowSpan={rowSpanCount} className={getStickyClass("ghiChu")} style={{...mergedStyle, maxWidth: "200px",width:270, whiteSpace: "normal", wordWrap: "break-word"}}>
                    {item.GhiChu}
                </td>
            )}
            {/* === CỘT TÀI CHÍNH (RIÊNG TỪNG DÒNG) === */}
            {canViewFinance && isVisible("doanhThuTruoc") && (
                <td className="text-center">{`${formatNumber(stats.rev)}${currencySymbol}`}</td>
            )}
            {canViewFinance && isVisible("mucChietKhau") && (
                <td className="text-center">{stats.disc}%</td>
            )}
            {canViewFinance && isVisible("soTienChietKhau") && (
                <td className="text-center">{formatNumber(stats.discAmount)}</td>
            )}
            {canViewFinance && isVisible("doanhThuSau") && (
              <td className="text-center fw-bold text-primary">{`${formatNumber(stats.after)}${currencySymbol}`}</td>
            )}

          
            {canViewFinance && isVisible("tongDoanhThuTichLuy") && isFirst && (
                <td 
                    rowSpan={rowSpanCount} 
                    className="text-center fw-bold text-success" 
                    style={mergedStyle}    
                >
                    {/* Thay item.TongDoanhThuTichLuy bằng biến mới tính */}
                    {`${formatNumber(totalRevenueAfterDiscount)}${currencySymbol}`}
                </td>
            )}
            {/* Hành động (Gộp) */}
            {isVisible("hanhDong") && isFirst && (
              <td rowSpan={rowSpanCount} className={`text-center ${getStickyClass("hanhDong")}`} style={{ ...mergedStyle, ...actionStickyCellStyle, padding: "10px 12px" }}>
                <div className="d-flex justify-content-center align-items-center gap-2">
                  <button
                    className="btn btn-sm btn-primary shadow-sm d-flex align-items-center justify-content-center"
                    style={{ width: 32, height: 32, borderRadius: "6px", padding: "6px" }}
                    onClick={() => onEdit(item)}
                    title={currentLanguage === "vi" ? "Sửa" : "Edit"}
                  >
                    <Edit size={16} />
                  </button>

                  <button
                    className="btn btn-sm btn-danger shadow-sm d-flex align-items-center justify-content-center"
                    style={{ width: 32, height: 32, borderRadius: "6px" }}
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
      })}
    </>
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
  const [totalRevenue, setTotalRevenue] = useState(0);
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
  const [viewingRequest, setViewingRequest] = useState(null);
 
  const canViewFinance = currentUser?.is_accountant || currentUser?.is_director;

  // Translations for table headers
  const tableHeadersTranslations = {
    vi: {
      stt: "STT", khachHang: "Khách Hàng", maVung: "Mã Vùng", soDienThoai: "Số Điện Thoại", email: "Email",
      kenhLienHe: "Kênh Liên Hệ", coSo: "Cơ Sở", diaChiNhan: "Địa Chỉ Nhận", noiTiepNhanHoSo: "Nơi Tiếp Nhận Hồ Sơ", loaiDichVu: "Loại Dịch Vụ", danhMuc: "Tên Dịch Vụ", tenDichVu: "Tên Dịch Vụ",
      maDichVu: "Mã Dịch Vụ", ghiChuDichVu: "Ghi Chú DV", nguoiPhuTrach: "Người Phụ Trách", ngayHen: "Ngày Hẹn Trả Kết Quả", ngayBatDau: "Ngày Nộp Hồ Sơ",
      ngayKetThuc: "Ngày Hoàn Thành", trangThai: "Trạng Thái", goi: "Gói", invoiceYN: "Invoice Y/N", invoice: "Invoice",
      gio: "Giờ", noiDung: "Nội Dung", ghiChu: "Ghi Chú", ngayTao: "Ngày Tạo",
      doanhThuTruoc: "Doanh Thu Trước CK", mucChietKhau: "% CK", soTienChietKhau: "Tiền Chiết Khấu",
      doanhThuSau: "Doanh Thu Sau CK", tongDoanhThuTichLuy: "Tổng Doanh Thu Sau CK", hanhDong: "Hành Động",
      dangKyDichVuMoi: "Đăng Ký Dịch Vụ Mới"
    },
    en: {
      stt: "No.", khachHang: "Customer", maVung: "Area Code", soDienThoai: "Phone", email: "Email",
      kenhLienHe: "Channel", coSo: "Branch", diaChiNhan: "Receiving Address", noiTiepNhanHoSo: "Receiving Office", loaiDichVu: "Service Type", danhMuc: "Service Name", tenDichVu: "Service Name",
      maDichVu: "Service Code", ghiChuDichVu: "Service Note", nguoiPhuTrach: "Assignee", ngayHen: "Result Appointment", ngayBatDau: "Submission Date",
      ngayKetThuc: "Completion Date", trangThai: "Status", goi: "Package", invoiceYN: "Invoice Y/N", invoice: "Invoice",
      gio: "Time", noiDung: "Content", ghiChu: "Note", ngayTao: "Created",
      doanhThuTruoc: "Revenue Before Discount", mucChietKhau: "Discount %", soTienChietKhau: "Discount Amount",
      doanhThuSau: "Revenue After Discount", tongDoanhThuTichLuy: "Total Revenue After Discount", hanhDong: "Actions",
      dangKyDichVuMoi: "Register New Service"
    },
    ko: {
      stt: "번호", khachHang: "고객", maVung: "지역번호", soDienThoai: "전화번호", email: "이메일",
      kenhLienHe: "채널", coSo: "지점", diaChiNhan: "수령 주소", noiTiepNhanHoSo: "접수 기관", loaiDichVu: "서비스 유형", danhMuc: "서비스명", tenDichVu: "서비스명",
      maDichVu: "서비스 코드", ghiChuDichVu: "서비스 비고", nguoiPhuTrach: "담당자", ngayHen: "결과 수령 예약일", ngayBatDau: "접수일",
      ngayKetThuc: "완료일", trangThai: "상태", goi: "패키지", invoiceYN: "청구서 Y/N", invoice: "청구서",
      gio: "시간", noiDung: "내용", ghiChu: "비고", ngayTao: "생성일",
      doanhThuTruoc: "할인 전 매출", mucChietKhau: "할인 %", soTienChietKhau: "할인 금액",
      doanhThuSau: "할인 후 매출", tongDoanhThuTichLuy: "할인 후 총 매출", hanhDong: "작업",
      dangKyDichVuMoi: "새 서비스 등록"
    }
  };
  const tHeaders = tableHeadersTranslations[currentLanguage === "vi" ? "vi" : currentLanguage === "ko" ? "ko" : "en"];

  const fetchDichVu = async () => {
    try {
      const res = await fetch(`${API_BASE}/dichvu`);
      if (!res.ok) throw new Error("Kết nối thất bại");
      const json = await res.json();
      if (json.success) {
        setDichvuList(json.data);
      }
    } catch (err) {
      console.error("❌ Lỗi tải danh mục dịch vụ:", err);
    }
  };

  useEffect(() => {
    fetchDichVu();
  }, []);

const initialColumnKeys = [
    { key: "id", label: tHeaders.stt },
    { key: "hoTen", label: tHeaders.khachHang },
    { key: "maVung", label: tHeaders.maVung },
    { key: "sdt", label: tHeaders.soDienThoai },
    { key: "email", label: tHeaders.email },
    { key: "hinhThuc", label: tHeaders.kenhLienHe },
    { key: "coSo", label: tHeaders.coSo },
    { key: "diaChiNhan", label: tHeaders.diaChiNhan },
    { key: "noiTiepNhanHoSo", label: tHeaders.noiTiepNhanHoSo },
    { key: "loaiDichVu", label: tHeaders.loaiDichVu },
    { key: "danhMuc", label: tHeaders.danhMuc },
    { key: "maDichVu", label: tHeaders.maDichVu },
    { key: "ghiChuDichVu", label: tHeaders.ghiChuDichVu },
    ...(currentUser?.is_admin || currentUser?.is_director || currentUser?.is_accountant ? [{ key: "nguoiPhuTrach", label: tHeaders.nguoiPhuTrach }] : []),
    { key: "ngayTao", label: tHeaders.ngayTao },
    { key: "ngayBatDau", label: tHeaders.ngayBatDau },
    { key: "ngayHen", label: tHeaders.ngayHen },
    { key: "ngayKetThuc", label: tHeaders.ngayKetThuc },
    { key: "trangThai", label: tHeaders.trangThai },
    { key: "goiDichVu", label: tHeaders.goi },
    { key: "invoice", label: tHeaders.invoiceYN },
    ...(canViewFinance ? [{ key: "invoiceUrl", label: tHeaders.invoice }] : []), 
    { key: "ghiChu", label: tHeaders.ghiChu },
    
   
    ...(canViewFinance ? [
      { key: "doanhThuTruoc", label: (<span>{tHeaders.doanhThuTruoc}<br/></span>) },
      { key: "mucChietKhau", label: (<span>{tHeaders.mucChietKhau}<br/></span>) },
      { key: "soTienChietKhau", label: (<span>{tHeaders.soTienChietKhau}<br/></span>) },
      { key: "doanhThuSau", label: (<span>{tHeaders.doanhThuSau}<br/></span>) },
      { key: "tongDoanhThuTichLuy", label: (<span>{tHeaders.tongDoanhThuTichLuy}<br/></span>) },
    ] : []),
    
    { key: "hanhDong", label: tHeaders.hanhDong },
  ];
const handleApproveClick = (item) => {
    
    const canApprove = currentUser?.is_director || currentUser?.perm_approve_b2c;
    if (!canApprove) return showToast("Không có quyền duyệt", "error");
    
  
    setApproveModalItem(item);
  };


 const handleConfirmApprove = async (id, fullFormData) => {
    try {
        const normalizeNullable = (value) => {
          if (value === undefined || value === null) return null;
          if (typeof value === "string" && value.trim() === "") return null;
          return value;
        };

        const normalizedPayload = {
          ...fullFormData,
          ChonNgay: normalizeNullable(fullFormData?.ChonNgay),
          Gio: normalizeNullable(fullFormData?.Gio),
          NgayBatDau: normalizeNullable(fullFormData?.NgayBatDau),
          NgayKetThuc: normalizeNullable(fullFormData?.NgayKetThuc),
        };

        const res = await fetch(`${API_BASE}/yeucau/approve/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                userId: currentUser.id,
                ...normalizedPayload // Gửi tất cả thông tin form + tài chính
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
    tHeaders.stt, tHeaders.khachHang, tHeaders.maVung, tHeaders.soDienThoai, tHeaders.email, 
  tHeaders.kenhLienHe, tHeaders.coSo, tHeaders.diaChiNhan, tHeaders.noiTiepNhanHoSo, tHeaders.loaiDichVu, tHeaders.danhMuc, tHeaders.maDichVu,
  tHeaders.ghiChuDichVu,
    ...((currentUser?.is_admin || currentUser?.is_director || currentUser?.is_accountant) ? [tHeaders.nguoiPhuTrach] : []),
    tHeaders.ngayTao, tHeaders.ngayBatDau,
    tHeaders.ngayHen, tHeaders.ngayKetThuc, tHeaders.trangThai, tHeaders.goi, tHeaders.invoiceYN,
    ...(canViewFinance ? [tHeaders.invoice] : []),
    tHeaders.ghiChu,

    // --- Giữ cột tài chính ---
    ...(canViewFinance ? [
       <div key="dt" className="d-flex flex-column align-items-center"><span>{tHeaders.doanhThuTruoc}</span></div>,
       <div key="mck" className="d-flex flex-column align-items-center"><span>{tHeaders.mucChietKhau}</span></div>,
       <div key="tck" className="d-flex flex-column align-items-center"><span>{tHeaders.soTienChietKhau}</span></div>,
       <div key="dts" className="d-flex flex-column align-items-center"><span>{tHeaders.doanhThuSau}</span></div>,
       <div key="tdttl" className="d-flex flex-column align-items-center"><span>{tHeaders.tongDoanhThuTichLuy}</span></div>
       
    ] : []),
    // -------------------------
    
    tHeaders.hanhDong,
  ];
  useEffect(() => {
    const fetchCatalogs = async () => {
      try {
        const resDV = await fetch(`${API_BASE}/dichvu`);
        const dv = await resDV.json();
        if (dv.success) setDichvuList(dv.data);
        const resUser = await fetch(`${API_BASE}/User`);
        const u = await resUser.json();
        if (u.success) setUsers(u.data);
      } catch (err) { console.error("Lỗi tải danh mục:", err); }
    };
    fetchCatalogs();
  }, []);

const fetchData = async () => {
    try {
      let url = `${API_BASE}/yeucau?page=${currentPage}&limit=${itemsPerPage}`;
      
      if (currentUser?.is_admin || currentUser?.is_director || currentUser?.is_accountant) { 
          url += `&is_admin=true`; 
      } else { 
          url += `&userId=${currentUser?.id}`; 
      }
 
      const res = await authenticatedFetch(url);
      
      if (!res) return;

      const json = await res.json();
      
      if (json.success) { 
          const normalizedRows = (json.data || []).map((row) => ({
            ...row,
            MaHoSo: normalizeServiceCodeForRow(row)
          }));
          setData(normalizedRows); 
          setTotalPages(json.totalPages || 1); 
          setTotalRevenue(json.totalRevenue || 0);
      } else { 
          showToast("Không thể tải dữ liệu", "error"); 
      }

    } catch (err) { 
        showToast("Lỗi kết nối server", "error"); 
    }
  };

  useEffect(() => { fetchData(); }, [currentPage, currentUser]);

  const handleEditClick = (item) => { setEditingRequest(item); };
  const handleViewDetailClick = (item, serviceCode, clickedRow) => {
    const receivingInfo = extractReceivingInfoFromDetails(item?.ChiTietDichVu);

    setViewingRequest({
      ...item,
      NoiTiepNhanHoSo:
        item?.NoiTiepNhanHoSo ||
        receivingInfo.receivingOffice ||
        "",
      DiaChiNhan:
        item?.DiaChiNhan ||
        receivingInfo.receivingAddress ||
        item?.NoiTiepNhanHoSo ||
        receivingInfo.receivingOffice ||
        "",
      __viewServiceCode: serviceCode || item?.MaHoSo || "",
      __viewServiceName: String(clickedRow?.name || "").trim()
    });
  };
  
  const handleCreateClick = () => {
    // Tải lại danh sách dịch vụ mới nhất từ DB (để hiển thị dịch vụ vừa thêm)
    fetchDichVu();
    setEditingRequest({});
  };

  const handleModalSave = async (formData) => {
    try {
      let url = `${API_BASE}/yeucau`;
      let method = "POST";

      if (formData.YeuCauID) {
          url = `${API_BASE}/yeucau/${formData.YeuCauID}`;
          method = "PUT";
      }

      
      const payload = { ...formData };

      let details = payload.ChiTietDichVu;
      if (typeof details === "string") {
        try {
          details = JSON.parse(details);
        } catch {
          details = {};
        }
      }
      if (!details || typeof details !== "object" || Array.isArray(details)) {
        details = {};
      }
      const hasReceivingOffice = payload.NoiTiepNhanHoSo !== undefined && payload.NoiTiepNhanHoSo !== null;
      const hasReceivingAddress = payload.DiaChiNhan !== undefined && payload.DiaChiNhan !== null;
      details.meta = {
        ...(details.meta || {}),
        ...(hasReceivingOffice ? { receivingOffice: String(payload.NoiTiepNhanHoSo || "").trim() } : {}),
        ...(hasReceivingAddress ? { receivingAddress: String(payload.DiaChiNhan || "").trim() } : {})
      };
      payload.ChiTietDichVu = details;

      delete payload.NoiTiepNhanHoSo;
      delete payload.DiaChiNhan;
      if (method === "POST") {
        payload.currentUserId = currentUser?.id;
      } else {
        delete payload.currentUserId;
      }
      delete payload.NguoiPhuTrach; 
      delete payload.User;         
      delete payload.ConfirmPassword; 
      delete payload.InvoiceFile; // Xoá file object khỏi payload (sẽ upload sau)

      // Rename YeuCauXuatHoaDon to Invoice
      if (payload.YeuCauXuatHoaDon) {
        payload.Invoice = payload.YeuCauXuatHoaDon;
        delete payload.YeuCauXuatHoaDon;
      }

      let invoiceUrl = payload.InvoiceUrl || "";

      // Nếu có file upload mới, upload lên
      if (formData.InvoiceFile && formData.InvoiceFile instanceof File) {
        try {
          const formDataUpload = new FormData();
          formDataUpload.append("file", formData.InvoiceFile);
          
          const uploadRes = await fetch(`${API_BASE}/upload-invoice`, {
            method: "POST",
            body: formDataUpload
          });

          if (uploadRes.ok) {
            const uploadJson = await uploadRes.json();
            invoiceUrl = uploadJson.url || uploadJson.invoiceUrl || "";
          }
        } catch (uploadErr) {
          console.warn("Lỗi upload file, tiếp tục mà không URL:", uploadErr);
        }
      }

      payload.InvoiceUrl = invoiceUrl;

      // Normalize currency to integer for backend
      if (payload.DonViTienTe === "VND") {
        payload.DonViTienTe = 0;
      } else if (payload.DonViTienTe === "KRW") {
        payload.DonViTienTe = 1;
      } else if (payload.DonViTienTe !== null && payload.DonViTienTe !== undefined && payload.DonViTienTe !== "") {
        const parsedCurrency = parseInt(payload.DonViTienTe, 10);
        payload.DonViTienTe = isNaN(parsedCurrency) ? null : parsedCurrency;
      } else {
        payload.DonViTienTe = null;
      }

    
      if (payload.NguoiPhuTrachId === "") {
          payload.NguoiPhuTrachId = null;
      }

      const { DiaChiNhan: _removedDiaChiNhan, NoiTiepNhanHoSo: _removedNoiTiepNhanHoSo, ...safePayload } = payload;

      const res = await fetch(url, {
        method: method, 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(safePayload), 
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("API /yeucau error", res.status, errText, safePayload);
        showToast(errText || `Lỗi server (${res.status})`, "error");
        return;
      }
      
      const json = await res.json();
      
      if (json.success) {
        let createdCode = String(json?.data?.MaHoSo || "").trim();

        // Fallback cho backend cũ: nếu vừa tạo mới mà chưa có mã thì tự cấp mã ngay.
        if (method === "POST" && !createdCode && json?.data?.YeuCauID) {
          try {
            const approveRes = await fetch(`${API_BASE}/yeucau/approve/${json.data.YeuCauID}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: currentUser.id, ...safePayload }),
            });

            if (approveRes.ok) {
              const approveJson = await approveRes.json();
              if (approveJson?.success) {
                createdCode = String(approveJson?.data?.MaHoSo || "").trim();
              }
            }
          } catch (approveErr) {
            console.warn("Fallback cấp mã tự động thất bại:", approveErr);
          }
        }

        if (method === "POST") {
          showToast(
            createdCode
              ? `Đăng ký thành công - Đã cấp mã: ${createdCode}`
              : "Đăng ký thành công (chưa lấy được mã, vui lòng F5)",
            "success"
          );
        } else {
          showToast("Cập nhật thành công", "success");
        }
        fetchData();
        setEditingRequest(null);
      } else { 
        console.error("API /yeucau returned error", json, safePayload);
        showToast(json.message || "Lỗi xử lý", "error"); 
      }
    } catch (err) { 
      console.error(err);
      showToast("Lỗi máy chủ", "error"); 
    }
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
          const res = await fetch(`${API_BASE}/yeucau/approve/${id}`, {
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
  
  // Helper formats
  const formatNumber = (num) => num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "0";
  const unformatMoney = (val) => val ? parseFloat(val.toString().replace(/\./g, "")) : 0;
  const normalizePackageOption = (value) => {
    if (value === "Thông thường") return "thường";
    if (value === "Cấp tốc") return "gấp 1";
    return value || "";
  };

  const [formData, setFormData] = useState({
    HoTen: request.HoTen || "",
    MaVung: request.MaVung || "+84",
    SoDienThoai: request.SoDienThoai || "",
    Email: request.Email || "",
    LoaiDichVu: request.LoaiDichVu || "",
    TenDichVu: request.TenDichVu || "",
    GoiDichVu: normalizePackageOption(request.GoiDichVu) || "thường",
    TenHinhThuc: request.TenHinhThuc || "",
    CoSoTuVan: request.CoSoTuVan || "",
    DanhMuc: (request.DanhMuc || "").split(" + ")[0], 
    ChonNgay: request.ChonNgay ? new Date(request.ChonNgay).toISOString().split("T")[0] : "",
    Gio: request.Gio ? (request.Gio.includes("T") ? new Date(request.Gio).toTimeString().substring(0,5) : request.Gio.substring(0,5)) : "",
    NgayBatDau: request.NgayBatDau ? new Date(request.NgayBatDau).toISOString().split("T")[0] : "", 
    NgayKetThuc: request.NgayKetThuc ? new Date(request.NgayKetThuc).toISOString().split("T")[0] : "", 
    NoiDung: request.NoiDung || "",
    GhiChu: request.GhiChu || "",
    DonViTienTe: request.DonViTienTe ?? 0,
    YeuCauXuatHoaDon: request.Invoice || "No",
    InvoiceUrl: request.InvoiceUrl || "",
    
    // Trạng thái (mặc định: Tư vấn)
    TrangThai: request.TrangThai || "Tư vấn",

    // Tài chính (Chỉ là hiển thị ban đầu, sẽ tính lại khi save)
    DoanhThuTruocChietKhau: formatNumber(request.DoanhThuTruocChietKhau),
    MucChietKhau: request.MucChietKhau || 0,
    Vi: formatNumber(request.Vi),
    ConfirmPassword: ""
  });

  const [loading, setLoading] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // --- 1. STATE DỊCH VỤ PHỤ (EXTRA SERVICES) ---
  const [extraServices, setExtraServices] = useState(() => {
        // Ưu tiên đọc từ JSON ChiTietDichVu
        if (request && request.ChiTietDichVu) {
            let details = typeof request.ChiTietDichVu === 'string' ? JSON.parse(request.ChiTietDichVu) : request.ChiTietDichVu;
            if (details.sub && details.sub.length > 0) {
                 return details.sub.map(s => ({
                     name: s.name,
                     revenue: s.revenue ? formatNumber(s.revenue) : "", 
                     discount: s.discount || ""
                 }));
            }
        }
        // Fallback: Tách từ chuỗi DanhMuc cũ
        if (!request.DanhMuc) return [{ name: "", revenue: "", discount: "" }];
        const parts = request.DanhMuc.split(" + ");
        if (parts.length > 1) {
            return parts.slice(1).map(name => ({ name: name, revenue: "", discount: "" }));
        }
        return [{ name: "", revenue: "", discount: "" }];
  });

  const [showExtras, setShowExtras] = useState(() => {
      // Logic hiển thị nút mở rộng
      if (request.ChiTietDichVu) {
           let details = typeof request.ChiTietDichVu === 'string' ? JSON.parse(request.ChiTietDichVu) : request.ChiTietDichVu;
           return details?.sub?.length > 0;
      }
      return (request.DanhMuc || "").split(" + ").length > 1;
  });

  // --- XỬ LÝ FORM ---
  const handleChange = (eOrName, value) => {
    let name, val;
    if (typeof eOrName === 'string') { name = eOrName; val = value; } 
    else { name = eOrName.target.name; val = eOrName.target.value; }

    if (name === "DoanhThuTruocChietKhau" || name === "Vi") {
        const raw = val.toString().replace(/\./g, "");
        if (!isNaN(raw)) setFormData(prev => ({ ...prev, [name]: formatNumber(raw) }));
    } else {
        setFormData(prev => {
          const next = { ...prev, [name]: val };
          if (name === "TrangThai" && isCompletedStatus(val)) {
            next.NgayKetThuc = getTodayDateString();
          }
          return next;
        });
    }
  };

  // --- XỬ LÝ DỊCH VỤ PHỤ ---
  const handleChangeExtra = (index, field, value) => {
      const newArr = [...extraServices];
      if (field === "revenue") {
        const raw = value.replace(/\./g, "");
        if (!isNaN(raw)) {
            newArr[index][field] = raw.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        }
      } else {
        newArr[index][field] = value;
      }
      setExtraServices(newArr);
  };

  const handleRemoveRow = (index) => {
      const newArr = [...extraServices];
      newArr.splice(index, 1);
      if (newArr.length === 0) {
          setExtraServices([{ name: "", revenue: "", discount: "" }]); 
          setShowExtras(false);
      } else {
          setExtraServices(newArr);
      }
  };


  const handleSave = async () => {

    if (!formData.ConfirmPassword) {
        showToast("Vui lòng nhập mật khẩu xác nhận!", "warning");
        return;
    }
    try {
        setLoading(true);
        const verifyRes = await fetch(`${API_BASE}/verify-password`, {
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


    let existingDetails = {};
    if (request?.ChiTietDichVu) {
      try {
        existingDetails = typeof request.ChiTietDichVu === "string"
          ? JSON.parse(request.ChiTietDichVu)
          : (request.ChiTietDichVu || {});
      } catch (_) {
        existingDetails = {};
      }
    }

    const mainRevenue = unformatMoney(formData.DoanhThuTruocChietKhau);
    const mainDiscount = parseFloat(formData.MucChietKhau || 0);
    const mainDiscountAmount = mainRevenue * (mainDiscount / 100);


    const validExtras = extraServices.filter(s => s.name && s.name.trim() !== "");
    let extraRevenue = 0;
    let extraDiscountAmount = 0;

    const subServicesData = validExtras.map((sub, subIndex) => {
        const r = unformatMoney(sub.revenue);
        const d = parseFloat(sub.discount || 0);
        extraRevenue += r;
        extraDiscountAmount += r * (d / 100);
        const matchedService = Array.isArray(existingDetails?.services)
          ? existingDetails.services.find((svc) => String(svc?.name || "").trim() === String(sub?.name || "").trim())
          : null;
        const matchedSub = Array.isArray(existingDetails?.sub) ? existingDetails.sub[subIndex] : null;
        return {
            name: sub.name,
            revenue: r,
            discount: d,
            note: String(
              matchedService?.note ||
              matchedService?.ghiChu ||
              matchedService?.serviceNote ||
              matchedSub?.note ||
              matchedSub?.ghiChu ||
              ""
            ).trim()
        };
    });


    const chiTietDichVu = Array.isArray(existingDetails?.services)
      ? {
          ...existingDetails,
          meta: existingDetails?.meta || {}
        }
      : {
          main: {
            revenue: mainRevenue,
            discount: mainDiscount,
            note: String(existingDetails?.main?.note || existingDetails?.main?.ghiChu || "").trim()
          },
          sub: subServicesData,
          meta: existingDetails?.meta || {}
        };


    const totalRevenue = mainRevenue + extraRevenue;
    const totalDiscountAmount = mainDiscountAmount + extraDiscountAmount;
    
  
    let averageDiscountPercent = totalRevenue > 0 ? (totalDiscountAmount / totalRevenue) * 100 : 0;
    averageDiscountPercent = Math.round(averageDiscountPercent * 100) / 100;


    let finalDanhMuc = formData.DanhMuc;
    if (validExtras.length > 0) {
        finalDanhMuc = `${formData.DanhMuc} + ${validExtras.map(e => e.name).join(" + ")}`;
    }

    
    const payload = { 
      ...formData, 
      DanhMuc: finalDanhMuc,
      DoanhThuTruocChietKhau: totalRevenue,
      MucChietKhau: averageDiscountPercent,
      SoTienChietKhau: totalDiscountAmount,
      DoanhThuSauChietKhau: totalRevenue - totalDiscountAmount,
      ChiTietDichVu: chiTietDichVu
  };

    if (isCompletedStatus(payload.TrangThai)) {
      payload.NgayKetThuc = getTodayDateString();
    }

      // Chuẩn hóa các trường rỗng về null để backend không lỗi
      ["ChonNgay","Gio","NgayBatDau","NgayKetThuc","Email","NoiDung","GhiChu","TenDichVu","MaHoSo"].forEach((key) => {
        if (payload[key] === "") payload[key] = null;
      });
      // Convert currency to integer for backend
      if (payload.DonViTienTe !== null && payload.DonViTienTe !== undefined && payload.DonViTienTe !== "") {
        const parsedCurrency = parseInt(payload.DonViTienTe, 10);
        payload.DonViTienTe = isNaN(parsedCurrency) ? null : parsedCurrency;
      } else {
        payload.DonViTienTe = null;
      }
    delete payload.ConfirmPassword;

    // Rename YeuCauXuatHoaDon to Invoice
    if (payload.YeuCauXuatHoaDon) {
      payload.Invoice = payload.YeuCauXuatHoaDon;
      delete payload.YeuCauXuatHoaDon;
    }

    // Xử lý file upload nếu có
    if (formData.InvoiceFile && formData.InvoiceFile instanceof File) {
      try {
        const formDataUpload = new FormData();
        formDataUpload.append("file", formData.InvoiceFile);
        
        const uploadRes = await fetch(`${API_BASE}/upload-invoice`, {
          method: "POST",
          body: formDataUpload
        });

        if (uploadRes.ok) {
          const uploadJson = await uploadRes.json();
          payload.InvoiceUrl = uploadJson.url || uploadJson.invoiceUrl || "";
        }
      } catch (uploadErr) {
        console.warn("Lỗi upload file, tiếp tục mà không URL:", uploadErr);
      }
    }

    delete payload.InvoiceFile; // Xoá file object khỏi payload
    
    const { DiaChiNhan: _removedDiaChiNhan, NoiTiepNhanHoSo: _removedNoiTiepNhanHoSo, ...safePayload } = payload;

    await onConfirm(request.YeuCauID, safePayload);
    setLoading(false);
  };

  const inputHeight = "38px"; 
  const labelStyle = { fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "4px", display: "block" };
  const inputStyle = {
    width: "100%", height: inputHeight, padding: "0 10px", borderRadius: "8px",
    border: "1px solid #d1d5db", fontSize: "13px", color: "#111827",
    backgroundColor: "#F9FAFB", outline: "none", transition: "border-color 0.2s"
  };

  // Đảm bảo không dùng serviceTypeList hardcode/thêm ngoài, chỉ lấy đúng các loại dịch vụ từ serviceTypeOptions
  const getDanhMucOptions = (serviceType) => {
    if (!serviceType) return [];
    const normalizedType = normalizeServiceName(mapToB2CServiceType(serviceType));
    const match = Object.entries(dbCategoryMap).find(
      ([key]) => normalizeServiceName(key) === normalizedType
    );
    return match ? match[1] : [];
  };
  const packageOptions = [
    { value: "thường", label: "Thường" },
    { value: "gấp 1", label: "Gấp 1" },
    { value: "gấp 0", label: "Gấp 0" }
  ];
  const branchOptions = [
    { value: "Seoul", label: "Seoul" },
    { value: "Busan", label: "Busan" },
    { value: "Hà Nội", label: "Hà Nội" }
  ];
  const formOptions = [
  "Messenger",
  "Kakao Talk",
  "Zalo",
  "Naver Talk",
  "Email",
  "Gọi điện",
  "Trực tiếp"
];
  const areaCodes = [{ value: "+82", label: "+82" }, { value: "+84", label: "+84" }];
  const statusOptions = currentLanguage === "vi" ? ["Tư vấn", "Tiến hành", "Hoàn thành"] : ["Consultation", "Processing", "Completed"];
  const currencyOptions = [{ value: 0, label: "VND" }, { value: 1, label: "KRW" }];
  const discountOptions = [{ value: 0, label: "0%" }, { value: 5, label: "5%" }, { value: 10, label: "10%" }, { value: 12, label: "12%" }, { value: 15, label: "15%" }, { value: 17, label: "17%" }, { value: 30, label: "30%" }];

  return (
    <div className="modal-overlay" style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1100, backdropFilter: "blur(3px)",
      display: "flex", justifyContent: "center", alignItems: "center"
    }}>
      <div className="bg-white p-4 position-relative" 
          style={{ width: "800px", maxWidth: "95%", borderRadius: "16px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)", maxHeight: "90vh", overflowY: "auto" }}
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
  
            {/* THÔNG TIN KHÁCH HÀNG */}
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

            {/* DỊCH VỤ & DANH MỤC */}
            <div className="col-md-4">
                <label style={labelStyle}>Loại Dịch Vụ <span className="text-danger">*</span></label>
                <ModernSelect name="LoaiDichVu" height={inputHeight} value={formData.LoaiDichVu} options={serviceTypeOptions} onChange={handleChange} />
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
                  options={getDanhMucOptions(formData.LoaiDichVu).map(dm => ({ value: dm, label: dm }))} 
                    onChange={handleChange}
                    footerAction={{
                        label: showExtras ? "Ẩn dịch vụ bổ sung" : "Thêm dịch vụ bổ sung (+5)",
                        icon: showExtras ? <EyeOff size={14}/> : <Plus size={14}/>,
                        onClick: () => {
                             if (!showExtras && extraServices.length === 0) setExtraServices([{ name: "", revenue: "", discount: "" }]); 
                             setShowExtras(!showExtras);
                        }
                    }}
                />
                 {showExtras && (
                    <div className="mt-2 p-3 bg-light rounded border animate__animated animate__fadeIn">
                        <div style={{ fontSize: "11px", color: "#666", marginBottom: "8px", fontStyle: "italic" }}>
                           Nhập tên dịch vụ bổ sung, doanh thu và chiết khấu (nếu có).
                        </div>
                        <div className="d-flex flex-column gap-2">
                            {extraServices.map((service, index) => (
                                <div key={index} className="d-flex align-items-center gap-2">
                                    <input type="text" placeholder={`Dịch vụ phụ ${index + 1}`} value={service.name} onChange={(e) => handleChangeExtra(index, "name", e.target.value)} style={{ ...inputStyle, flex: 2 }} />
                                    
                                    <input type="text" placeholder="Doanh thu" value={service.revenue} onChange={(e) => handleChangeExtra(index, "revenue", e.target.value)} style={{ ...inputStyle, flex: 1, textAlign: "right" }} />
                                    
                                    <select className="form-select form-select-sm" value={service.discount || ""} onChange={(e) => handleChangeExtra(index, "discount", e.target.value)} style={{ flex: 0.6, height: inputHeight, fontSize: "12px" }}>
                                        <option value="">0%</option>
                                        {discountOptions.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                                    </select>

                                    <button className="btn btn-outline-danger d-flex align-items-center justify-content-center" onClick={() => handleRemoveRow(index)} style={{ width: "38px", height: "38px", padding: 0 }}><Trash2 size={16}/></button>
                                </div>
                            ))}
                            {extraServices.length < 5 && (
                                <button className="btn btn-sm btn-primary d-flex gap-1" onClick={() => setExtraServices([...extraServices, { name: "", revenue: "", discount: "" }])} style={{width:"fit-content"}}><Plus size={14}/> Thêm dòng</button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* INFO KHÁC */}
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
                <div onClick={(e) => e.currentTarget.querySelector('input').showPicker?.()} style={{ cursor: "pointer" }}>
                  <input type="date" name="ChonNgay" style={{...inputStyle, cursor: "pointer"}} value={formData.ChonNgay} onChange={handleChange} />
                </div>
            </div>
            <div className="col-md-4">
                <label style={labelStyle}>Giờ Hẹn</label>
                <input type="time" name="Gio" style={inputStyle} value={formData.Gio} onChange={handleChange} />
            </div>
            <div className="col-md-4">
                <label style={labelStyle}>Người Phụ Trách</label>
                <ModernSelect name="NguoiPhuTrachId" height={inputHeight} value={formData.NguoiPhuTrachId} options={users.map(u => ({ value: String(u.id), label: u.name }))} onChange={handleChange} />
            </div>
            <div className="col-md-6">
                <label style={labelStyle}>Ngày Bắt Đầu</label>
                <div onClick={(e) => e.currentTarget.querySelector('input').showPicker?.()} style={{ cursor: "pointer" }}>
                  <input 
                      type="date" 
                      name="NgayBatDau" 
                      style={{...inputStyle, cursor: "pointer"}} 
                      value={formData.NgayBatDau} 
                      onChange={handleChange} 
                  />
                </div>
            </div>
            <div className="col-md-6">
                <label style={labelStyle}>Ngày Kết Thúc</label>
                <div onClick={(e) => e.currentTarget.querySelector('input').showPicker?.()} style={{ cursor: "pointer" }}>
                  <input 
                      type="date" 
                      name="NgayKetThuc" 
                      style={{...inputStyle, cursor: "pointer"}} 
                      value={formData.NgayKetThuc} 
                      onChange={handleChange} 
                  />
                </div>
            </div>
            <div className="col-12">
                <label style={labelStyle}>Nội Dung</label>
                <textarea rows={2} name="NoiDung" style={inputStyle} value={formData.NoiDung} onChange={handleChange} />
            </div>
             <div className="col-12">
                <label style={labelStyle}>Ghi Chú</label>
                <textarea rows={2} name="GhiChu" style={inputStyle} value={formData.GhiChu} onChange={handleChange} />
            </div>

            {/* === UPLOAD HÓA ĐƠN (NẾU YÊU CẦU XUẤT HÓA ĐƠN) === */}
            {formData.YeuCauXuatHoaDon === "Yes" && (
              <div className="col-12 mt-3 pt-2 border-top">
                <label style={labelStyle}>Upload Hóa Đơn</label>
                <input 
                  type="file" 
                  className="form-control" 
                  style={{...inputStyle, padding: "8px 10px"}}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setFormData(prev => ({...prev, InvoiceFile: file}));
                    }
                  }}
                  accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls"
                />
              </div>
            )}

            {/* === TÀI CHÍNH === */}
            <div className="col-12 mt-3 pt-2 border-top">
                <div className="row g-3">
                    <div className="col-md-6">
                      <label style={labelStyle}>Doanh thu (Dịch vụ chính) <span className="text-danger">*</span></label>
                      <div className="d-flex gap-2">
                        <input type="text" name="DoanhThuTruocChietKhau" value={formData.DoanhThuTruocChietKhau} onChange={handleChange} style={{...inputStyle, color: "#2563eb", fontWeight: "bold", textAlign: "center", flex: 1}} placeholder="0" />
                        <ModernSelect 
                          name="DonViTienTe" 
                          height={inputHeight} 
                          value={formData.DonViTienTe} 
                          options={currencyOptions} 
                          onChange={handleChange} 
                          placeholder="VND" 
                          width="110px"
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                        <label style={labelStyle}>Chiết khấu (%)</label>
                        <ModernSelect 
                            name="MucChietKhau" 
                            height={inputHeight} 
                            value={formData.MucChietKhau} 
                            options={discountOptions} 
                            onChange={(e) => setFormData(prev => ({...prev, MucChietKhau: e.target.value}))} 
                            placeholder="0%"
                        />
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
      const res = await fetch(`${API_BASE}/yeucau/${id}`, { method: "DELETE" });
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
    if (!key || key === "hanhDong") return;
    setPinnedColumns(prev => (
      prev.includes(key) ? prev.filter((colKey) => colKey !== key) : [...prev, key]
    ));
  };

  const isVisible = (key) => visibleColumns[key];
  const isPinned = (key) => pinnedColumns.includes(key);

  const availableColumnDefs = initialColumnKeys.filter((col) => {
    if (col.key === "nguoiPhuTrach" && !currentUser?.is_admin && !currentUser?.is_director && !currentUser?.is_accountant) return false;
    if (col.key === "invoiceUrl" && !canViewFinance) return false;
    return true;
  });

  const visibleColumnDefs = availableColumnDefs.filter((col) => isVisible(col.key));

  const pinnedLeftMap = visibleColumnDefs.reduce((acc, col) => {
    if (!pinnedColumns.includes(col.key) || col.key === "hanhDong") return acc;
    const prevWidth = acc.__runningLeft || 0;
    acc[col.key] = prevWidth;
    acc.__runningLeft = prevWidth + (B2C_COLUMN_WIDTHS[col.key] || 120);
    return acc;
  }, {});

  delete pinnedLeftMap.__runningLeft;

  const pinnedDynamicStyles = Object.entries(pinnedLeftMap)
    .map(([key, left]) => `.sticky-col-${key} { left: ${left}px !important; }`)
    .join("\n");

  const getHeaderColumnWidth = (key, isActionColumn) =>
    isActionColumn ? B2C_COLUMN_WIDTHS.hanhDong : (B2C_COLUMN_WIDTHS[key] || 120);

  // Tính chiều rộng sidebar để marginLeft cho bảng
  const sidebarWidth = showSidebar
    ? (currentUser?.is_director || currentUser?.is_accountant ? 340 : 290)
    : 70;

  return (
    <div className="d-flex h-100" style={{ background: "#ffffff" }}>
      <div style={{ 
        width: sidebarWidth, 
        transition: "0.3s", 
        zIndex: 100 
      }}>
        <Sidebar collapsed={!showSidebar} user={currentUser} />
      </div>

      <div className="flex-grow-1 p-3" style={{ height: "100vh", overflowY: "auto", marginLeft: showSidebar ? sidebarWidth - 120 : 0 }}>
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
          <RequestEditModal
            request={approveModalItem}
            users={users}
            currentUser={currentUser}
            currentLanguage={currentLanguage}
            dichvuList={dichvuList}
            approveMode={true}
            onClose={() => setApproveModalItem(null)}
            onSave={(payload) => handleConfirmApprove(approveModalItem.YeuCauID, payload)}
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
        {viewingRequest && (
          <RequestEditModal
            request={viewingRequest}
            users={users}
            currentUser={currentUser}
            currentLanguage={currentLanguage}
            dichvuList={dichvuList}
            viewMode={true}
            onClose={() => setViewingRequest(null)}
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
                style={{ width: 300, marginLeft:90, borderRadius: "30px", paddingLeft: "18px", transition: "all 0.3s ease", fontSize: "14px" }}
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
                      {tHeaders.dangKyDichVuMoi}
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

           <div className="table-wrapper mt-3" style={{marginLeft:90}}>
            <div className="table-responsive" style={{ paddingLeft: "0px", position: "relative", maxHeight: "calc(100vh - 340px)", overflow: "auto", borderBottom: "1px solid #dee2e6" }} ref={tableContainerRef}>
              <table className="table table-bordered align-middle mb-0" style={{ tableLayout: "fixed", width: "100%" }}>
                <thead>
                  <tr>
                    {tableHeaders.map((header, i) => {
                      const currentKey = availableColumnDefs[i]?.key;
                      const isActionColumn = currentKey === "hanhDong";
                      if (currentKey && !isVisible(currentKey)) return null;

                      const columnWidth = getHeaderColumnWidth(currentKey, isActionColumn);
                      const pinnedClass = isPinned(currentKey) ? `sticky-col sticky-col-${currentKey}` : "";

                      return (
                        <th key={i} className={pinnedClass}
                          style={{ 
                              
                              position: "sticky",        
                              top: 0,                    
                              left: isPinned(currentKey) ? `${pinnedLeftMap[currentKey] || 0}px` : "auto", 
                              right: isActionColumn ? 0 : "auto",
                              zIndex: isActionColumn ? 30 : (isPinned(currentKey) ? 20 : 10), 
                              width: `${columnWidth}px`,
                              minWidth: `${columnWidth}px`,
                              maxWidth: `${columnWidth}px`,
                              backgroundColor: "#2c4d9e", 
                              color: "#ffffff",           
                              borderLeft: isActionColumn ? "1px solid #4a6fdc" : "none",
                              borderRight: "1px solid #4a6fdc", 
                              textAlign: "center",
                              verticalAlign: "middle",
                              boxShadow: isActionColumn ? "-2px 0 6px rgba(0,0,0,0.2)" : "0 1px 2px rgba(0,0,0,0.2)",
                              overflow: "hidden",
                              padding: "4px 2px"
                          }}
                        >
                          <div
                            className="d-flex justify-content-center align-items-center position-relative w-100"
                            style={{
                              minHeight: "24px",
                              minWidth: 0,
                              paddingRight: currentKey === "id" ? "34px" : "28px",
                              paddingLeft: currentKey === "id" ? "8px" : "0"
                            }}
                          >
                            <span
                              style={{
                                display: "block",
                                minWidth: 0,
                                whiteSpace: currentKey === "id" ? "nowrap" : "normal",
                                overflowWrap: currentKey === "id" ? "normal" : "anywhere",
                                wordBreak: currentKey === "id" ? "normal" : "break-word",
                                lineHeight: 1.15,
                                textAlign: "center",
                                fontSize: "12px"
                              }}
                            >
                              {header}
                            </span>
                            {currentKey && !isActionColumn && (
                            <button
                              className="btn btn-sm d-flex align-items-center justify-content-center"
                              style={{
                                  width: 24,
                                  height: 24,
                                  padding: 0,
                                  borderRadius: "3px",
                                  position: "absolute",
                                  right: "2px",
                                  top: "50%",
                                  transform: "translateY(-50%)",
                                  border: "none",
                                  backgroundColor: isPinned(currentKey) ? "#2c4d9e" : "transparent",
                                  color: "#ffffff",
                                  opacity: isPinned(currentKey) ? 1 : 0.7
                              }}
                              onClick={() => togglePinColumn(currentKey)}
                            >
                            {isPinned(currentKey) ? (<PinOff size={12} color="currentColor" />) : (<Pin size={12} color="currentColor" />)}
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
                        onViewDetail={handleViewDetailClick}
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
            
       
            {canViewFinance && (
                <div className="d-flex justify-content-end align-items-center px-3 py-2 bg-light border-start border-end border-bottom">
                  <span className="me-2 text-muted fw-semibold">Tổng doanh thu tích luỹ:</span>
                  <span className="fs-6 fw-bold text-primary">
                      {totalRevenue.toLocaleString("vi-VN")} đ
                  </span>
                </div>
            )}


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
            z-index: 5 !important; 
            background-color: #ffffff !important; 
            
        }
        
        th.sticky-col { 
            position: sticky !important; 
            z-index: 15 !important; 
            background-color: #2c4d9e !important; 
            color: #ffffff !important;
          
        }

        ${pinnedDynamicStyles}
        
        .table-responsive { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
};

export default B2CPage;