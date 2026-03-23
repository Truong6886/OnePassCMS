import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import useSocketListener from "./CMSDashboard/hooks/useSocketListener";
import NotificationPanel from "./CMSDashboard/NotificationPanel";
import EditProfileModal from "./EditProfileModal";
import RegisterB2BModal from "./RegisterB2BModal";
import AddServiceModalB2B from "./AddServiceModalB2B";
import { showToast } from "../utils/toast";
import { Save, Trash2, XCircle, Check, FileText, Edit, Eye, EyeOff, Plus, X, ChevronDown, Paperclip, Pin, Settings2 } from "lucide-react";
// Danh sách cột cấu hình cho popup
const COLUMN_CONFIGS = [
  { key: "stt", label: "STT" },
  { key: "company", label: "Khách Hàng" },
  { key: "soDKKD", label: "Số ĐKKD" },
  { key: "hoSo", label: "Hồ Sơ" },
  { key: "diaChiNhan", label: "Địa Chỉ Nhận" },
  { key: "noiTiepNhan", label: "Nơi Tiếp Nhận Hồ Sơ" },
  { key: "loaiDichVu", label: "Loại Dịch Vụ" },
  { key: "tenDichVu", label: "Tên Dịch Vụ" },
  { key: "maDichVu", label: "Mã Dịch Vụ" },
  { key: "ghiChu", label: "Ghi Chú DV" },
  { key: "nguoiPhuTrach", label: "Người Phụ Trách" },
  { key: "ngayTao", label: "Ngày Tạo" },
  { key: "ngayBatDau", label: "Ngày Bắt Đầu" },
  { key: "ngayHen", label: "Ngày Hẹn" },
  { key: "ngayKetThuc", label: "Ngày Kết Thúc" },
  { key: "goi", label: "Gói" },
  { key: "invoiceYN", label: "Invoice Y/N" },
  { key: "invoice", label: "Invoice" },
  { key: "trangThai", label: "Trạng thái" },
  { key: "doanhThuTruoc", label: "Doanh Thu Trước Chiết Khấu" },
  { key: "mucChietKhau", label: "Mức Chiết Khấu" },
  { key: "soTienChietKhau", label: "Số Tiền Chiết Khấu" },
  { key: "doanhThuSau", label: "Doanh Thu Sau Chiết Khấu" },
  { key: "tongDoanhThu", label: "Tổng Doanh Thu" },
  { key: "hanhDong", label: "Hành Động" },
];
const REVENUE_COLUMN_KEYS = ["doanhThuTruoc", "mucChietKhau", "soTienChietKhau", "doanhThuSau", "tongDoanhThu"];
// Popup cấu hình cột
function ColumnConfigPopup({ show, onClose, columns, onChange, columnConfigs = [] }) {
  if (!show) return null;
  return (
    <div style={{
      position: 'absolute',
      top: 50,
      right: 0,
      zIndex: 9999,
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: 12,
      boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
      minWidth: 260,
      maxHeight: 400,
      overflowY: 'auto',
      padding: 18
    }}>
      <div style={{ fontWeight: 700, marginBottom: 10 }}>Cấu hình cột:</div>
      {columnConfigs.map(col => (
        <div key={col.key} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <input
            type="checkbox"
            checked={columns.includes(col.key)}
            onChange={() => onChange(col.key)}
            style={{ marginRight: 8 }}
            id={"col-cfg-"+col.key}
          />
          <label htmlFor={"col-cfg-"+col.key} style={{ cursor: 'pointer', userSelect: 'none' }}>{col.label}</label>
        </div>
      ))}
      <button className="btn btn-light mt-2 w-100" onClick={onClose}>Đóng</button>
    </div>
  );
}
import Swal from "sweetalert2";
import { authenticatedFetch } from "../utils/api";
import withReactContent from "sweetalert2-react-content";
const MySwal = withReactContent(Swal);

const parseServices = (sourceStr) => {
  if (!sourceStr) return [];


  let temp = sourceStr
    .replace(/Hộ chiếu,\s*Hộ tịch/gi, "TOKEN_HO_CHIEU_HO_TICH")
    .replace(/Khai sinh,\s*khai tử/gi, "TOKEN_KHAI_SINH_KHAI_TU");


  const list = temp.split(',');


  return list.map(item => {
    let s = item.trim();
    if (s.includes("TOKEN_HO_CHIEU_HO_TICH")) return "Hộ chiếu, Hộ tịch";
    if (s.includes("TOKEN_KHAI_SINH_KHAI_TU")) return "Khai sinh, khai tử";
    return s;
  }).filter(Boolean);
};
function Pagination({ current = 1, total = 0, pageSize = 20, onChange, currentLanguage = "vi" }) {
  const totalPages = Math.ceil(total / pageSize) || 1;
  const currentPage = Math.min(Math.max(current, 1), totalPages);

  const goTo = (page) => {
    if (page < 1 || page > totalPages) return;
    onChange?.(page);
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)
  );

  return (
    <div className="d-flex justify-content-between align-items-center px-3 py-2 border-top bg-light">
      <div className="text-muted small">
        {currentLanguage === "vi"
          ? `Hiển thị ${Math.min(total, currentPage * pageSize)} / ${total} hàng (trang ${currentPage}/${totalPages})`
          : `Showing ${Math.min(total, currentPage * pageSize)} / ${total} rows (page ${currentPage}/${totalPages})`}
      </div>
      <div className="d-flex justify-content-center align-items-center">
        <nav>
          <ul className="pagination pagination-sm mb-0 shadow-sm">
            <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
              <button className="page-link" onClick={() => goTo(currentPage - 1)}>&laquo;</button>
            </li>
            {pages.map((p, idx, arr) => (
              <React.Fragment key={p}>
                {idx > 0 && arr[idx - 1] !== p - 1 && (
                  <li className="page-item disabled"><span className="page-link">…</span></li>
                )}
                <li className={`page-item ${currentPage === p ? "active" : ""}`}>
                  <button className="page-link" onClick={() => goTo(p)}>{p}</button>
                </li>
              </React.Fragment>
            ))}
            <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
              <button className="page-link" onClick={() => goTo(currentPage + 1)}>&raquo;</button>
            </li>
          </ul>
        </nav>
        <div className="ms-3 text-muted small">
          {currentLanguage === "vi" ? `Trang ${currentPage}/${totalPages}` : `Page ${currentPage}/${totalPages}`}
        </div>
      </div>
    </div>
  );
}

const formatDateTime = (isoString) => {
  if (!isoString) return "";
  try {
    const date = new Date(isoString.endsWith("Z") ? isoString : isoString + "Z");
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: false
    }).format(date);
  } catch (error) { return isoString; }
};

const formatDateTimeReject = (isoString) => {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Ho_Chi_Minh"
    }).format(date);
  } catch (error) { return isoString; }
};

const formatNumber = (value) => (!value ? "0" : value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."));
const unformatNumber = (value) => (value ? value.toString().replace(/\./g, "") : "");

const isLocalNetworkHost = (host) =>
  ["localhost", "127.0.0.1", "::1"].includes(host) ||
  /^10\./.test(host) ||
  /^192\.168\./.test(host) ||
  /^172\.(1[6-9]|2\d|3[0-1])\./.test(host);

const API_BASE = isLocalNetworkHost(window.location.hostname)
  ? "http://localhost:5000/api"
  : "https://onepasscms-backend-tvdy.onrender.com/api";
const PAGE_SIZE = 20;

const mapToUnifiedB2BServiceType = (value) => {
  const cleanValue = String(value || "").trim().toLowerCase();
  if (!cleanValue) return "";

  if (cleanValue === "khác" || cleanValue === "dịch" || cleanValue === "xác minh" || cleanValue === "dịch thuật") {
    return "Dịch thuật";
  }

  return String(value || "").trim();
};
const parseMoney = (str) => {
  if (!str) return 0;
  return parseFloat(str.toString().replace(/\./g, "")) || 0;
};

const calculateRecordRevenueAfterTax = (record) => {
  if (!record) return 0;

  const details = record.ChiTietDichVu || {};
  const walletUsage = parseMoney(record.walletUsage || record.Vi || 0);

  if (Array.isArray(details.services) && details.services.length > 0) {
    let total = 0;

    details.services.forEach((service) => {
      const quantity = Number(service?.soluong) || 1;
      const unitPrice = parseMoney(service?.dongia);
      const taxRate = Number(service?.thue) || 0;
      const discountRate = Number(service?.chietkhau) || 0;

      const subtotal = quantity * unitPrice;
      const taxAmount = subtotal * (taxRate / 100);
      const discountAmount = subtotal * (discountRate / 100);

      total += subtotal + taxAmount - discountAmount;
    });

    return Math.max(0, total - walletUsage);
  }

  const revenueAfter = parseMoney(record.revenueAfter || record.DoanhThuSauChietKhau || 0);
  if (revenueAfter > 0) {
    return Math.max(0, revenueAfter - walletUsage);
  }

  const revenueBefore = parseMoney(record.revenueBefore || record.DoanhThuTruocChietKhau || 0);
  const discountRate = Number(record.discountRate || record.MucChietKhau || 0);
  const discountAmount = revenueBefore * (discountRate / 100);

  return Math.max(0, revenueBefore - discountAmount - walletUsage);
};

const hasB2BApprovePermission = (user) =>
  Boolean(user?.is_admin || user?.is_director || user?.is_accountant || user?.perm_approve_b2b);

const hasRevenueViewPermission = (user) =>
  Boolean(user?.is_admin || user?.is_director || user?.is_accountant || user?.perm_view_revenue);

const isPendingServiceStatus = (statusValue) => {
  const normalized = String(statusValue || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  return (
    normalized.includes("cho") ||
    normalized.includes("pending") ||
    normalized.includes("dang ky moi")
  );
};

const normalizeStatusText = (value) =>
  String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const isCompletedStatus = (value) => normalizeStatusText(value) === "hoan thanh";

const toDateOnly = (value) => {
  if (!value) return "";
  const text = String(value).trim();
  const match = text.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }
  return "";
};

const toServiceCodeDatePart = (value, fallback = "") => {
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

  return fallback;
};

const dateFromServiceCode = (serviceCode) => {
  const match = String(serviceCode || "").trim().match(/^[^-]+-(\d{6})-[YNyn]-\d{3}$/);
  if (!match) return "";
  const datePart = match[1];
  const yy = Number(datePart.slice(0, 2));
  const mm = datePart.slice(2, 4);
  const dd = datePart.slice(4, 6);
  const fullYear = yy >= 70 ? `19${String(yy).padStart(2, "0")}` : `20${String(yy).padStart(2, "0")}`;
  return `${fullYear}-${mm}-${dd}`;
};

const normalizeB2BCodeBySubmissionDate = (item) => {
  const currentCode = String(item?.MaDichVu || "").trim();
  const match = currentCode.match(/^([^-]+)-(\d{6})-([YNyn])-([0-9]{3})$/);
  if (!match) return currentCode;

  const expectedDate = toServiceCodeDatePart(
    item?.NgayHen || item?.NgayBatDau || item?.NgayThucHien || item?.NgayTao || item?.CreatedAt,
    match[2]
  );
  const expectedInvoiceCode = ["yes", "có", "true", "y"].includes(
    String(item?.YeuCauHoaDon || "").toLowerCase()
  )
    ? "Y"
    : "N";

  return `${match[1]}-${expectedDate}-${expectedInvoiceCode}-${match[4]}`;
};

const normalizePackageLabel = (value) => {
  const normalized = String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (!normalized) return "";
  if (normalized === "thuong" || normalized === "thong thuong") return "Thường";
  if (normalized === "gap 1" || normalized === "cap toc") return "Gấp 1";
  if (normalized === "gap 0") return "Gấp 0";
  return String(value || "").trim();
};

// Hàm chuẩn hóa dữ liệu doanh nghiệp (đồng bộ field giữa các môi trường)
const normalizeApprovedCompanyRecord = (item = {}) => ({
  ...item,
  ID: item.ID || item.id || item.DoanhNghiepID || item.companyId || "",
  TenDoanhNghiep: item.TenDoanhNghiep || item.tenDoanhNghiep || item.CompanyName || item.companyName || "",
  SoDKKD: item.SoDKKD || item.soDKKD || item.BusinessRegistrationNumber || item.businessRegNo || "",
  NguoiDaiDien: item.NguoiDaiDien || item.nguoiDaiDien || item.NguoiDaiDienPhapLuat || item.legalRepresentative || "",
  NganhNgheChinh: item.NganhNgheChinh || item.nganhNgheChinh || item.NganhNghe || item.nganhNghe || item.mainBusiness || "",
  DiaChi: item.DiaChi || item.diaChi || item.DiaChiTruSo || item.Address || item.address || "",
  MaVung: item.MaVung || item.maVung || item.areaCode || "",
  SoDienThoai:
    item.SoDienThoai ||
    item.soDienThoai ||
    item.SoDienThoaiLienHe ||
    item.phone ||
    item.phoneNumber ||
    "",
  Email: item.Email || item.email || ""
});

// Hàm chuẩn hóa dữ liệu dịch vụ (đồng bộ field giữa các môi trường)
const normalizeServiceRecord = (item = {}, index = 0) => {
  let parsedChiTietDichVu = { main: {}, sub: [] };
  if (item.ChiTietDichVu) {
    if (typeof item.ChiTietDichVu === "string") {
      try {
        parsedChiTietDichVu = JSON.parse(item.ChiTietDichVu) || { main: {}, sub: [] };
      } catch (error) {
        parsedChiTietDichVu = { main: {}, sub: [] };
      }
    } else {
      parsedChiTietDichVu = item.ChiTietDichVu;
    }
  }
  return {
    ...item,
    id: item.ID || item.id || item.ServiceID || `temp_${index}_${Date.now()}`,
    uiId: item.ID ? `server_${item.ID}` : `temp_${index}_${Date.now()}`,
    companyId: item.DoanhNghiepID || item.companyId || item.CompanyID || "",
    companyName: item.TenDoanhNghiep || item.tenDoanhNghiep || item.CompanyName || item.companyName || "",
    soDKKD: item.SoDKKD || item.soDKKD || item.BusinessRegistrationNumber || item.businessRegNo || "",
    phoneNumber: item.SoDienThoai || item.PhoneNumber || item.phoneNumber || item.phone || "",
    email: item.Email || item.email || "",
    serviceType: item.LoaiDichVu || item.serviceType || "",
    serviceName: item.TenDichVu || item.serviceName || "",
    NoiTiepNhanHoSo: parsedChiTietDichVu?.meta?.NoiTiepNhanHoSo || item.NoiTiepNhanHoSo || "",
    DiaChiNhan: item.DiaChiNhan || item.diaChiNhan || "",
    package: normalizePackageLabel(item.GoiDichVu || item.package),
    invoiceYN: item.YeuCauHoaDon || item.invoiceYN,
    invoiceUrl: item.InvoiceUrl || item.invoiceUrl,
    picId: item.NguoiPhuTrachId || item.picId,
    picName: item.NguoiPhuTrach ? (item.NguoiPhuTrach.username || item.NguoiPhuTrach.name) : (item.picName || ""),
    code: !isPendingServiceStatus(item.TrangThai || item.status) ? normalizeB2BCodeBySubmissionDate(item) : "",
    createdDate: toDateOnly(item.NgayTao) || toDateOnly(item.createdAt) || toDateOnly(item.CreatedAt) || toDateOnly(item.NgayDangKy) || toDateOnly(item.NgayDangKyB2B) || toDateOnly(item.NgayBatDau) || toDateOnly(item.NgayThucHien),
    startDate: toDateOnly(item.NgayBatDau) || toDateOnly(item.NgayThucHien),
    appointmentDate: toDateOnly(item.NgayHen) || dateFromServiceCode(item.MaDichVu || item.ServiceID),
    completionDate: toDateOnly(item.NgayHoanThanh),
    revenueBefore: item.DoanhThuTruocChietKhau || item.revenueBefore,
    discountRate: item.MucChietKhau || item.discountRate,
    discountAmount: item.SoTienChietKhau || item.discountAmount,
    revenueAfter: item.DoanhThuSauChietKhau || item.revenueAfter,
    ChiTietDichVu: parsedChiTietDichVu,
    totalRevenue: item.TongDoanhThuTichLuy || item.totalRevenue,
    walletUsage: item.Vi || item.walletUsage,
    status: item.TrangThai || item.status,
    isNew: false
  };
};

const formatCompanyPhoneNumber = (item = {}) => {
  const rawPhone = String(item?.SoDienThoai || "").trim();
  const maVung = String(item?.MaVung || "").trim();

  if (!rawPhone) return "";
  if (rawPhone.startsWith("+")) {
    if (!maVung) return rawPhone;
    const parsed = rawPhone.match(/^(\+\d{1,4})\s*(.*)$/);
    if (!parsed) return rawPhone;
    const normalizedCode = maVung.startsWith("+") ? maVung : `+${maVung}`;
    const local = String(parsed[2] || "").trim();
    return `${normalizedCode} ${local}`.trim();
  }
  if (!maVung) return rawPhone;

  const normalizedCode = maVung.startsWith("+") ? maVung : `+${maVung}`;
  return `${normalizedCode} ${rawPhone}`.trim();
};

const splitPhoneForEditForm = (item = {}) => {
  const rawPhone = String(item?.SoDienThoai || "").trim();
  const rawAreaCode = String(item?.MaVung || "").trim();
  const parsed = rawPhone.match(/^(\+\d{1,4})\s*(.*)$/);

  const parsedCode = parsed ? parsed[1] : "";
  const localNumber = parsed ? String(parsed[2] || "").trim() : rawPhone;
  const areaCode = rawAreaCode || parsedCode || "+82";

  return {
    MaVung: areaCode,
    SoDienThoai: localNumber,
  };
};


export default function B2BPage() {
  // State cho popup cấu hình cột
  const [showColumnConfig, setShowColumnConfig] = useState(false);
  // State cho các cột hiển thị
  const [visibleColumns, setVisibleColumns] = useState(COLUMN_CONFIGS.map(c => c.key));

  const [expandedRowId, setExpandedRowId] = useState(null);
  const [showRegisterB2BModal, setShowRegisterB2BModal] = useState(false);

  const toggleExpand = (id) => {
    setExpandedRowId(prev => prev === id ? null : id);
  };

  const [availableServices, setAvailableServices] = useState([]);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [editingServiceData, setEditingServiceData] = useState(null);
  const [serviceModalMode, setServiceModalMode] = useState("create");
  const [showSidebar, setShowSidebar] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [userList, setUserList] = useState([]);
  const [currentLanguage, setCurrentLanguage] = useState(localStorage.getItem("language") || "vi");
  const [loading, setLoading] = useState(false);
  const [showExtras, setShowExtras] = useState(false);
  const [extraServices, setExtraServices] = useState([
    { name: "", revenue: "", discount: "" }
  ]);
  const handleChangeExtra = (index, field, value) => {
    const newArr = [...extraServices];
    if (!newArr[index]) newArr[index] = { name: "", revenue: "", discount: "" };

    // Nếu là revenue thì format hiển thị
    if (field === "revenue") {
      const raw = unformatNumber(value);
      newArr[index][field] = formatNumber(raw);
    } else {
      newArr[index][field] = value;
    }
    setExtraServices(newArr);
  };

  const handleAddRow = () => {
    if (extraServices.length < 5) {
      setExtraServices([...extraServices, { name: "", revenue: "", discount: "" }]);
    } else {
      showToast("Chỉ được thêm tối đa 5 dịch vụ bổ sung", "warning");
    }
  };
  // [SỬA] Hàm xóa dòng
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
  const [newServiceForm, setNewServiceForm] = useState({
    id: null,
    DoanhNghiepID: "",
    SoDKKD: "",
    LoaiDichVu: "",
    TenDichVu: "",
    NgayBatDau: new Date().toISOString().split('T')[0],
    NgayHoanThanh: "",
    ThuTucCapToc: "No",
    YeuCauHoaDon: "No",
    DoanhThu: "",
    Vi: "",
    MucChietKhau: "",
    GhiChu: "",
    NguoiPhuTrachId: "",
    ConfirmPassword: "",
    DiaChiNhan: ""
  });

  useEffect(() => {
    fetchUsers();
    fetchDichVuList();
  }, []);

  const fetchUsers = async () => {
    try {

      const res = await authenticatedFetch(`${API_BASE}/User`);
      if (!res) return;

      const json = await res.json();
      if (json.success) setUserList(json.data);
    } catch (e) { console.error("Lỗi lấy user list", e); }
  };

  const [dichvuList, setDichvuList] = useState([]);

  const fetchDichVuList = async () => {
    try {
      const res = await fetch(`${API_BASE}/dichvu`);
      if (!res.ok) return;
      const json = await res.json();
      if (json.success) setDichvuList(json.data || []);
    } catch (e) { console.error("Lỗi tải danh sách dịch vụ B2B:", e); }
  };



  const handleEditService = (rec, mode = "edit") => {
    // Truyền toàn bộ service record cho modal
    setEditingServiceData(rec);
    setServiceModalMode(mode);
    setShowAddServiceModal(true);
  };

  const handleOpenAddServiceModal = () => {
    setEditingServiceData(null); // Reset editing state
    setServiceModalMode("create");
    
    // Load danh sách khách hàng đang hoạt động nếu chưa có
    if (approvedList.length === 0) {
      loadApprovedListAll();
    }

    // Tải lại danh sách dịch vụ mới nhất từ DB (để hiển thị dịch vụ vừa thêm)
    fetchDichVuList();

    setShowAddServiceModal(true);
  };

  const handleViewServiceDetail = (rec) => {
    setEditingServiceData(rec);
    setServiceModalMode("view");
    setShowAddServiceModal(true);
  };
  
  const handleModalChange = (e) => {
    const { name, value } = e.target;

    if (name === "DoanhNghiepID") {
      const selectedCompany = approvedList.find(c => String(c.ID) === String(value));
      let services = [];
      if (selectedCompany) {

        if (selectedCompany.DichVu) services.push(...parseServices(selectedCompany.DichVu));
        if (selectedCompany.DichVuKhac) services.push(...parseServices(selectedCompany.DichVuKhac));
      }
      const uniqueServices = [...new Set(services)].filter(Boolean);
      setAvailableServices(uniqueServices);

      setNewServiceForm(prev => ({
        ...prev,
        [name]: value,
        SoDKKD: selectedCompany ? selectedCompany.SoDKKD : "",
        LoaiDichVu: "",
        DanhMuc: ""
      }));
    }
    else if (name === "LoaiDichVu") {
      setNewServiceForm(prev => ({
        ...prev,
        [name]: value,
        DanhMuc: ""
      }));
    }
    else if (name === "DoanhThu" || name === "Vi") {
      const rawValue = unformatNumber(value);
      if (!isNaN(rawValue)) {
        setNewServiceForm(prev => ({ ...prev, [name]: formatNumber(rawValue) }));
      }
    }
    else {
      setNewServiceForm(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handler for AddServiceModalB2B
  const handleAddServiceModalB2B = async (payload) => {
    try {
      setLoading(true);

      // Verify password
      const verifyRes = await authenticatedFetch(`${API_BASE}/verify-password`, {
        method: "POST",
        body: JSON.stringify({
          username: currentUser.username,
          password: payload.ConfirmPassword
        })
      });

      if (!verifyRes) {
        console.error("Verify password request failed");
        showToast("Lỗi xác thực mật khẩu - vui lòng thử lại", "error");
        return false;
      }

      const verifyJson = await verifyRes.json();
      if (!verifyJson.success) {
        showToast("Mật khẩu xác nhận không chính xác!", "error");
        return false;
      }

      const canApproveB2B = hasB2BApprovePermission(currentUser);
      let approveAction = null;

      if (serviceModalMode === "create" && canApproveB2B) {
        approveAction = "accountant_approve";
      }

      if (
        serviceModalMode === "edit" &&
        canApproveB2B &&
        isPendingServiceStatus(editingServiceData?.status || editingServiceData?.TrangThai)
      ) {
        approveAction = "accountant_approve";
      }

      const savePayload = {
        ...payload,
        approveAction,
        userId: currentUser?.id
      };

      let url = `${API_BASE}/b2b/services`;
      let method = "POST";

      if (serviceModalMode === "edit" && editingServiceData?.id) {
        url = `${API_BASE}/b2b/services/update/${editingServiceData.id}`;
        method = "PUT";
      }

      const saveRes = await authenticatedFetch(url, {
        method,
        body: JSON.stringify(savePayload)
      });

      if (!saveRes) {
        showToast("Không thể lưu dịch vụ - vui lòng thử lại", "error");
        return false;
      }

      const saveJson = await saveRes.json();
      if (!saveJson.success) {
        showToast(saveJson.message || "Lưu dịch vụ thất bại", "error");
        return false;
      }

      const serviceCode = String(
        saveJson.newCode ||
        saveJson.code ||
        saveJson.MaDichVu ||
        saveJson.data?.MaDichVu ||
        saveJson.data?.ServiceID ||
        "CHUA_CAP_MA"
      ).trim();

      showToast(
        serviceModalMode === "edit"
          ? `CHỈNH SỬA / CẬP NHẬT DỊCH VỤ THÀNH CÔNG - Mã dịch vụ: ${serviceCode}`
          : `ĐĂNG KÝ DỊCH VỤ THÀNH CÔNG - Đã cấp mã: ${serviceCode}`,
        "success"
      );

      const targetPage = serviceModalMode === "create" ? 1 : (currentPage.services || 1);
      if (serviceModalMode === "create" && currentPage.services !== 1) {
        setCurrentPage((prev) => ({ ...prev, services: 1 }));
      }

      loadServices(targetPage);
      return true;
    } catch (err) {
      console.error("Detailed error:", err);
      console.error("Error message:", err.message);
      console.error("Error stack:", err.stack);
      showToast(`Lỗi: ${err.message || "Kết nối server thất bại"}`, "error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleModalSubmit = async () => {

    if (!newServiceForm.DoanhNghiepID || !newServiceForm.LoaiDichVu) {
      return showToast("Vui lòng chọn Doanh nghiệp và Loại dịch vụ", "warning");
    }
    if (!newServiceForm.ConfirmPassword) {
      return showToast("Vui lòng nhập mật khẩu của bạn để xác nhận!", "warning");
    }

    try {
      setLoading(true);

      const verifyRes = await authenticatedFetch(`${API_BASE}/verify-password`, {
        method: "POST",
        body: JSON.stringify({
          username: currentUser.username,
          password: newServiceForm.ConfirmPassword
        })
      });

      if (!verifyRes) return;

      const verifyJson = await verifyRes.json();
      if (!verifyJson.success) {
        return showToast("Mật khẩu xác nhận không chính xác!", "error");
      }

      const canApproveB2B = hasB2BApprovePermission(currentUser);
      let approveAction = null;

      if (!newServiceForm.id && canApproveB2B) {
        approveAction = "accountant_approve";
      }

      if (newServiceForm.id && canApproveB2B && newServiceForm.status === "Chờ Kế toán duyệt") {
        approveAction = "accountant_approve";
      }

      const mainRevenue = newServiceForm.DoanhThu
        ? parseFloat(unformatNumber(newServiceForm.DoanhThu))
        : 0;

      const mainDiscountRate = newServiceForm.MucChietKhau
        ? parseFloat(newServiceForm.MucChietKhau)
        : 0;


      const validExtras = extraServices.filter(
        s => s.name && s.name.trim() !== ""
      );

      let finalDanhMuc = newServiceForm.DanhMuc;
      let extraNames = [];
      let subDetails = [];

      if (validExtras.length > 0) {
        validExtras.forEach(ex => {
          extraNames.push(ex.name.trim());

          subDetails.push({
            name: ex.name.trim(),
            revenue: ex.revenue
              ? parseFloat(unformatNumber(ex.revenue))
              : 0,
            discount: ex.discount
              ? parseFloat(ex.discount)
              : 0
          });
        });

        finalDanhMuc = `${newServiceForm.DanhMuc} + ${extraNames.join(" + ")}`;
      }


      const chiTietDichVuPayload = {
        main: {
          revenue: mainRevenue,
          discount: mainDiscountRate
        },
        sub: subDetails
      };


      const rawVi = newServiceForm.Vi
        ? parseFloat(unformatNumber(newServiceForm.Vi))
        : 0;

      const payload = {
        DoanhNghiepID: newServiceForm.DoanhNghiepID,
        LoaiDichVu: newServiceForm.LoaiDichVu,
        DanhMuc: finalDanhMuc,
        TenDichVu: newServiceForm.TenDichVu || "",
        DiaChiNhan: newServiceForm.DiaChiNhan || "",
        NgayThucHien: newServiceForm.NgayBatDau,
        NgayHoanThanh: newServiceForm.NgayHoanThanh || null,
        ThuTucCapToc: newServiceForm.ThuTucCapToc,
        YeuCauHoaDon: newServiceForm.YeuCauHoaDon,
        GhiChu: newServiceForm.GhiChu || "",
        NguoiPhuTrachId: newServiceForm.NguoiPhuTrachId,

        TrangThai: newServiceForm.TrangThai,
        DoanhThuTruocChietKhau: mainRevenue,
        MucChietKhau: mainDiscountRate,
        Vi: rawVi,
        ChiTietDichVu: chiTietDichVuPayload,
        approveAction,
        userId: currentUser?.id
      };

      let url = `${API_BASE}/b2b/services`;
      let method = "POST";
      if (newServiceForm.id) {
        url = `${API_BASE}/b2b/services/update/${newServiceForm.id}`;
        method = "PUT";
      }

      const res = await authenticatedFetch(url, {
        method,
        body: JSON.stringify(payload)
      });

      if (!res) return;

      const json = await res.json();

      if (json.success) {
        const serviceCode = String(
          json.newCode ||
          json.code ||
          json.MaDichVu ||
          json.data?.MaDichVu ||
          json.data?.code ||
          newServiceForm.MaDichVu ||
          "CHUA_CAP_MA"
        ).trim();

        showToast(
          newServiceForm.id
            ? `CHỈNH SỬA / CẬP NHẬT DỊCH VỤ THÀNH CÔNG - Mã dịch vụ: ${serviceCode}`
            : `ĐĂNG KÝ DỊCH VỤ THÀNH CÔNG - Đã cấp mã: ${serviceCode}`,
          "success"
        );

        setShowAddServiceModal(false);
        loadServices(currentPage.services || 1);
      } else {
        showToast(json.message, "error");
      }

    } catch (err) {
      console.error(err);
      showToast("Lỗi kết nối server", "error");
    } finally {
      setLoading(false);
    }
  };

  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  const [pendingList, setPendingList] = useState([]);
  const [approvedList, setApprovedList] = useState([]);
  const [rejectedList, setRejectedList] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingData, setPendingData] = useState([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [approvedData, setApprovedData] = useState([]);
  const [approvedTotal, setApprovedTotal] = useState(0);
  const [rejectedData, setRejectedData] = useState([]);
  const [rejectedTotal, setRejectedTotal] = useState(0);
  const [serviceData, setServiceData] = useState([]);
  const [serviceTotal, setServiceTotal] = useState(0);
  const [serviceCompanyRevenueMap, setServiceCompanyRevenueMap] = useState({});
  const [overallB2BRevenue, setOverallB2BRevenue] = useState(0);
  const B2B_SERVICE_MAPPING_HARDCODED = {
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
    "Hợp pháp hóa, công chứng": [
      "Hợp pháp hoá lãnh sự/Chứng nhận lãnh sự",
      "Công chứng, chứng thực hợp đồng giao dịch",
      "Hợp đồng ủy quyền",
      "Ủy quyền",
      "Ủy quyền đưa con về nước",
      "Chứng thực chữ ký",
      "Sao y bản chính"
    ],
    "Dịch thuật": [
      "Xác minh",
      "Dịch Việt - Hàn",
      "Dịch Hàn - Việt",
      "Dịch BLX"
    ]
  };

  // Chỉ lấy loại dịch vụ và dịch vụ từ API quản lý dịch vụ
  const B2B_SERVICE_MAPPING = React.useMemo(() => {
    const mapping = {};
    if (dichvuList && dichvuList.length > 0) {
      dichvuList.forEach((dv) => {
        const cat = mapToUnifiedB2BServiceType(dv.LoaiDichVu);
        const name = dv.TenDichVu;
        if (!cat || !name || !name.trim()) return;
        if (!mapping[cat]) mapping[cat] = [];
        if (!mapping[cat].includes(name)) mapping[cat].push(name);
      });
    }
    return mapping;
  }, [dichvuList]);

  const getDanhMucOptions = (serviceType) => {
    if (!serviceType) return [];
    const normalized = mapToUnifiedB2BServiceType(serviceType).trim().toLowerCase();
    const match = Object.entries(B2B_SERVICE_MAPPING).find(([key]) => key.trim().toLowerCase() === normalized);
    return match ? match[1] : [];
  };
  const [currentPage, setCurrentPage] = useState({
    pending: 1, approved: 1, rejected: 1, services: 1
  });
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [hasNewRequest, setHasNewRequest] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEditCompanyModal, setShowEditCompanyModal] = useState(false);
  const [editingApprovedCompany, setEditingApprovedCompany] = useState(null);
  const [editCompanyForm, setEditCompanyForm] = useState({
    TenDoanhNghiep: "",
    SoDKKD: "",
    NguoiDaiDien: "",
    NganhNgheChinh: "",
    SoDienThoai: "",
    Email: "",
    MaVung: "",
    DiaChi: ""
  });

  // Vẫn giữ editingRows cho pending/approved
  const [editingRows, setEditingRows] = useState({
    pending: {}, approved: {}, services: {}
  });
  const discountOptions = [

    { value: 5, label: "5%" },
    { value: 10, label: "10%" },
    { value: 12, label: "12%" },
    { value: 15, label: "15%" }, // (Bổ sung mức Silver theo server)
    { value: 17, label: "17%" },
    { value: 20, label: "20%" },
    { value: 30, label: "30%" }  // (Bổ sung mức Diamond theo server)
  ];
  const translations = {
    vi: {
      pendingTab: "Danh sách chờ duyệt",
      approvedTab: "Danh sách đã duyệt",
      rejectedTab: "Danh sách từ chối",
      servicesTab: "Danh sách dịch vụ",
      addServiceBtn: "+ Thêm dịch vụ",
      dangKyDichVuMoi: "Đăng ký dịch vụ mới",
      stt: "STT",
      tenDN: "Tên Doanh Nghiệp",
      soDKKD: "Số ĐKKD",
      nguoiDaiDien: "Người Đại Diện Pháp Luật",
      ngayDangKy: "Ngày Đăng Ký",
      tongDoanhThu: "Tổng Doanh Thu",
      lyDoTuChoi: "Lý Do Từ Chối",
      dichVu: "Dịch Vụ",
      giayPhep: "Giấy Phép ĐKKD",
      email: "Email",
      hoSo: "Hồ Sơ",
      soDienThoai: "Số Điện Thoại",
      nganhNgheChinh: "Ngành Nghề Chính",
      diaChi: "Địa Chỉ",
      chonDN: "Doanh Nghiệp",
      loaiDichVu: "Loại Dịch Vụ",
      tenDichVu: "Tên Dịch Vụ",
      maDichVu: "Mã Dịch Vụ",
      ghiChuDichVu: "Ghi Chú DV",
      danhMuc: "Danh Mục",
      nguoiPhuTrach: "Người Phụ Trách",
      goi: "Gói",
      invoiceYN: "Invoice Y/N",
      invoice: "Invoice",
      ngayTao: "Ngày Tạo",
      ngayBatDau: "Ngày Bắt Đầu",
      ngayHen: "Ngày Hẹn",
      ngayKetThuc: "Ngày Kết Thúc",
      doanhThuTruoc: "Doanh Thu\nTrước Chiết Khấu",
      mucChietKhau: "Mức\nChiết Khấu",
      soTienChietKhau: "Số Tiền\nChiết Khấu",
      doanhThuSau: "Doanh Thu\nSau Chiết Khấu",
      suDungVi: "Sử Dụng\nVí",
      tongDoanhThuTichLuy: "Tổng Doanh Thu",
      hanhDong: "Hành Động",
      msgWalletLimit: "Số tiền ví không được quá 2.000.000",
      noiTiepNhanHoSo: "Nơi Tiếp Nhận Hồ Sơ",
      diaChiNhan: "Địa Chỉ Nhận",
      diaChiNhanPlaceholder: "Nhập Địa Chỉ Nhận Hồ Sơ"
    },
    en: {
      pendingTab: "Pending List",
      approvedTab: "Approved List",
      rejectedTab: "Rejected List",
      servicesTab: "Services List",
      addServiceBtn: "+ Add Service",
      dangKyDichVuMoi: "Register New Service",
      stt: "No.",
      hoSo: "File",
      tenDN: "Company Name",
      soDKKD: "Business Reg. No.",
      nguoiDaiDien: "Legal Representative",
      email: "Email",
      soDienThoai: "Phone Number",
      ngayDangKy: "Registration Date",
      tongDoanhThu: "Total Revenue",
      lyDoTuChoi: "Rejection Reason",
      dichVu: "Services",
      giayPhep: "Business License",
      nganhNgheChinh: "Main Business Lines",
      diaChi: "Address",
      chonDN: "Company",
      loaiDichVu: "Service Type",
      tenDichVu: "Service Name",
      maDichVu: "Service ID",
      ghiChuDichVu: "Service Note",
      danhMuc: "Category",
      nguoiPhuTrach: "Assignee",
      goi: "Package",
      invoiceYN: "Invoice Y/N",
      invoice: "Invoice",
      ngayTao: "Created Date",
      ngayBatDau: "Start Date",
      ngayHen: "Appointment Date",
      ngayKetThuc: "End Date",
      doanhThuTruoc: "Revenue Before Discount",
      mucChietKhau: "Discount Rate",
      soTienChietKhau: "Discount Amount",
      doanhThuSau: "Revenue After Discount",
      tongDoanhThuTichLuy: "Total Revenue",
      suDungVi: "Wallet Usage",
      hanhDong: "Actions",
      msgWalletLimit: "Wallet usage cannot exceed 2,000,000",
      noiTiepNhanHoSo: "Receiving Office",
      diaChiNhan: "Receiving Address",
      diaChiNhanPlaceholder: "Enter receiving address"
    },
    ko: {
      pendingTab: "승인 대기 목록",
      approvedTab: "승인된 목록",
      rejectedTab: "거절된 목록",
      servicesTab: "서비스 목록",
      addServiceBtn: "+ 서비스 추가",
      dangKyDichVuMoi: "새 서비스 등록",
      stt: "번호",
      tenDN: "기업명",
      soDKKD: "사업자등록번호",
      nguoiDaiDien: "법정 대표자",
      ngayDangKy: "등록일",
      tongDoanhThu: "총 매출",
      lyDoTuChoi: "거절 사유",
      dichVu: "서비스",
      giayPhep: "사업자 등록증",
      email: "이메일",
      soDienThoai: "전화번호",
      nganhNgheChinh: "주요 업종",
      diaChi: "주소",
      chonDN: "기업 선택",
      loaiDichVu: "서비스 유형",
      tenDichVu: "서비스 이름",
      maDichVu: "서비스 코드",
      ghiChuDichVu: "서비스 비고",
      danhMuc: "카테고리",
      nguoiPhuTrach: "담당자",
      goi: "패키지",
      invoiceYN: "인보이스 Y/N",
      invoice: "인보이스",
      ngayTao: "생성일",
      ngayBatDau: "시작일",
      ngayHen: "예약일",
      ngayKetThuc: "종료일",
      doanhThuTruoc: "할인 전 매출",
      mucChietKhau: "할인율",
      soTienChietKhau: "할인 금액",
      doanhThuSau: "할인 후 매출",
      suDungVi: "지갑 사용",
      hoSo: "서류",
      tongDoanhThuTichLuy: "총 매출",
      hanhDong: "작업",
      msgWalletLimit: "지갑 사용 금액은 2,000,000을 초과할 수 없습니다",
      noiTiepNhanHoSo: "접수 기관",
      diaChiNhan: "수령 주소",
      diaChiNhanPlaceholder: "수령 주소를 입력하세요"
    }
  };

  const t = translations[currentLanguage] || translations.en;

  const [pinnedColumns, setPinnedColumns] = useState({
    pending: [],
    approved: [],
    rejected: [],
    services: []
  });

  const togglePinnedColumn = (tableKey, columnKey) => {
    setPinnedColumns((prev) => {
      const current = prev[tableKey] || [];
      const next = current.includes(columnKey)
        ? current.filter((key) => key !== columnKey)
        : [...current, columnKey];
      return { ...prev, [tableKey]: next };
    });
  };

  const isColumnPinned = (tableKey, columnKey) =>
    (pinnedColumns[tableKey] || []).includes(columnKey);

  const getPinnedLeftOffset = (tableKey, columnKey, orderedColumns) => {
    const pinnedSet = new Set(pinnedColumns[tableKey] || []);
    let left = 0;

    for (const col of orderedColumns) {
      if (col.key === columnKey) break;
      if (pinnedSet.has(col.key)) left += Number(col.width) || 0;
    }

    return left;
  };

  const getPinnedStyle = ({ tableKey, columnKey, orderedColumns, backgroundColor, zIndex = 12 }) => {
    if (!isColumnPinned(tableKey, columnKey)) return {};

    return {
      position: "sticky",
      left: `${getPinnedLeftOffset(tableKey, columnKey, orderedColumns)}px`,
      zIndex,
      backgroundColor,
      boxShadow: "2px 0 6px rgba(15, 23, 42, 0.12)",
      borderRight: "1px solid #cbd5e1"
    };
  };

  const renderPinButton = (tableKey, columnKey) => {
    const pinned = isColumnPinned(tableKey, columnKey);

    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          togglePinnedColumn(tableKey, columnKey);
        }}
        title={pinned ? "Bỏ ghim cột" : "Ghim cột"}
        className="btn btn-link p-0 border-0 d-inline-flex align-items-center"
        style={{ color: "#ffffff", opacity: pinned ? 1 : 0.65, lineHeight: 1 }}
      >
        <Pin size={12} fill={pinned ? "currentColor" : "none"} />
      </button>
    );
  };

  useSocketListener({ currentLanguage, setNotifications, setHasNewRequest, setShowNotification, currentUser: currentUser });

  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
    loadData();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    if (activeTab === "pending") loadPending(currentPage.pending);
    if (activeTab === "approved") {
      loadApproved(currentPage.approved);
      loadApprovedListAll();
    }
    if (activeTab === "rejected") loadRejected(currentPage.rejected);
    if (activeTab === "services") loadServices(currentPage.services);
  }, [activeTab, currentPage, currentUser]);

  const handlePageChange = (tab, page) => {
    setCurrentPage(prev => ({ ...prev, [tab]: page }));
  };


  const loadData = async () => {
    setLoading(true);
    try {

      const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
        authenticatedFetch(`${API_BASE}/b2b/pending`),
        authenticatedFetch(`${API_BASE}/b2b/approved?all=true`),
        authenticatedFetch(`${API_BASE}/b2b/reject`)
      ]);


      if (!pendingRes || !approvedRes || !rejectedRes) return;

      const p = await pendingRes.json();
      const a = await approvedRes.json();
      const r = await rejectedRes.json();

      setPendingList((p.data || []).map(item => ({ ...normalizeApprovedCompanyRecord(item), rejectionReason: "" })));
      setApprovedList((a.data || []).map(normalizeApprovedCompanyRecord));
      setRejectedList((r.data || []).map(normalizeApprovedCompanyRecord));

      loadServices(1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadApprovedListAll = async () => {
    try {
      const res = await authenticatedFetch(`${API_BASE}/b2b/approved?all=true`);
      if (!res) return;

      const json = await res.json();
      if (json.success) {
        setApprovedList((json.data || []).map(normalizeApprovedCompanyRecord));
      }
    } catch (error) {
      console.error("Lỗi tải danh sách doanh nghiệp đã duyệt (all)", error);
    }
  };


  const loadPending = async (page = 1) => {
    const res = await authenticatedFetch(`${API_BASE}/b2b/pending?page=${page}&limit=${PAGE_SIZE}`);
    if (!res) return;

    const json = await res.json();
    if (json.success) { setPendingData((json.data || []).map(normalizeApprovedCompanyRecord)); setPendingTotal(json.total); }
  };

  const loadApproved = async (page = 1) => {
    const res = await authenticatedFetch(`${API_BASE}/b2b/approved?page=${page}&limit=${PAGE_SIZE}`);
    if (!res) return;

    const json = await res.json();
    if (json.success) { 
      const normalizedApprovedData = (json.data || []).map(normalizeApprovedCompanyRecord);
      setApprovedData(normalizedApprovedData);
      setApprovedTotal(json.total); 
    }
  };

  const loadRejected = async (page = 1) => {
    const res = await authenticatedFetch(`${API_BASE}/b2b/reject?page=${page}&limit=${PAGE_SIZE}`);
    if (!res) return;

    const json = await res.json();
    if (json.success) { setRejectedData((json.data || []).map(normalizeApprovedCompanyRecord)); setRejectedTotal(json.total); }
  };

  // 3. Load Services
  const loadServices = async (page = 1) => {
    try {
      setLoading(true);
      const res = await authenticatedFetch(`${API_BASE}/b2b/services?page=${page}&limit=${PAGE_SIZE}`);

      if (!res) return;

      const json = await res.json();
      if (json.success) {
        const formattedData = (json.data || []).map((item, index) => normalizeServiceRecord(item, index));
        setServiceData(formattedData);
        setServiceTotal(json.total);
        setServiceCompanyRevenueMap(json.companyRevenueMap || {});
        setOverallB2BRevenue(parseMoney(json.overallRevenue));
      } else {
        setServiceData([]);
        setServiceCompanyRevenueMap({});
        setOverallB2BRevenue(0);
      }
    } catch (error) {
      console.error("Load services failed", error);
      setServiceData([]);
      setServiceCompanyRevenueMap({});
      setOverallB2BRevenue(0);
    } finally {
      setLoading(false);
    }
  };

  const calculateCompanyTotalRevenue = (companyId) => {
    if (!serviceData || serviceData.length === 0) return 0;

    return serviceData
      .filter(r => String(r.companyId) === String(companyId))
      .reduce((sum, r) => {
        // Tính trực tiếp theo chi tiết dịch vụ để luôn lấy doanh thu sau thuế.
        const total = calculateRecordRevenueAfterTax(r);
        return sum + (Number.isFinite(total) ? total : 0);
      }, 0);
  };

  const startEditing = (tab, idOrUiId) => {
    setEditingRows(prev => ({ ...prev, [tab]: { ...prev[tab], [idOrUiId]: true } }));
  };

  const cancelEditing = (tab, idOrUiId) => {
    setEditingRows(prev => ({ ...prev, [tab]: { ...prev[tab], [idOrUiId]: false } }));
  };

  const handlePendingChange = (id, field, value) => {
    setPendingData(prev => prev.map(item => item.ID === id ? { ...item, [field]: value } : item));
  };
  const handleApprovedChange = (id, field, value) => {
    setApprovedData(prev => prev.map(item => item.ID === id ? { ...item, [field]: value } : item));
  };

  const handleApprove = (service) => {
    const company = approvedList.find(c => String(c.ID) === String(service.companyId));

    // --- [SỬA ĐOẠN NÀY] Load JSON ---
    const details = service.ChiTietDichVu || { main: {}, sub: [] };

    let mainRevenueStr = "";
    let mainDiscountStr = "";
    let currentExtras = [];

    // 1. Dịch vụ chính
    if (details.main && details.main.revenue !== undefined) {
      mainRevenueStr = formatNumber(details.main.revenue);
      mainDiscountStr = details.main.discount || "";
    } else {
      mainRevenueStr = service.revenueBefore ? formatNumber(service.revenueBefore) : "";
      mainDiscountStr = service.discountRate || "";
    }

    // 2. Dịch vụ phụ
    if (details.sub && details.sub.length > 0) {
      currentExtras = details.sub.map(s => ({
        name: s.name,
        revenue: s.revenue ? formatNumber(s.revenue) : "",
        discount: s.discount || ""
      }));
    } else {
      const fullDanhMuc = service.DanhMuc || "";
      const parts = fullDanhMuc.split(" + ");
      if (parts.length > 1) {
        currentExtras = parts.slice(1).map(item => ({
          name: item.trim(),
          revenue: "",
          discount: ""
        }));
      }
    }

    if (currentExtras.length > 0) {
      setExtraServices(currentExtras);
      setShowExtras(true);
    } else {
      setExtraServices([{ name: "", revenue: "", discount: "" }]);
      setShowExtras(false);
    }


    const mainCat = (service.DanhMuc || "").split(" + ")[0];

    setSelectedService({
      ...service,
      LoaiDichVu: service.serviceType,
      TenDichVu: service.serviceName,
      DanhMuc: mainCat,
      DiaChiNhan: service.DiaChiNhan || "",

      NgayBatDau: service.startDate,
      NgayHen: service.appointmentDate || service.NgayHen || "",
      NgayHoanThanh: service.endDate,

      DoanhThu: mainRevenueStr,
      MucChietKhau: mainDiscountStr,

      Vi: service.walletUsage ? formatNumber(service.walletUsage) : "",
      GhiChu: service.GhiChu || "",
      NguoiPhuTrachId: service.picId || "",
      ConfirmPassword: "",
      GoiDichVu: service.package || "thường",
      YeuCauHoaDon: service.invoiceYN || "No"
    });

    setApproveModalOpen(true);
  };

  const handleApproveSubmit = async () => {
    if (!selectedService.confirmPassword) {
      return showToast("Vui lòng nhập mật khẩu để duyệt!", "warning");
    }

    try {
      setLoading(true);


      const verifyRes = await authenticatedFetch(`${API_BASE}/verify-password`, {
        method: "POST",
        body: JSON.stringify({
          username: currentUser.username,
          password: selectedService.confirmPassword
        })
      });
      if (!verifyRes) { setLoading(false); return; }
      const validExtras = extraServices.filter(s => s.name && s.name.trim() !== "");

      let finalDanhMuc = selectedService.DanhMuc;


      if (validExtras.length > 0) {
        const extraNames = validExtras.map(ex => ex.name.trim());
        finalDanhMuc = `${selectedService.DanhMuc} + ${extraNames.join(" + ")}`;
      }
      const verifyJson = await verifyRes.json();
      if (!verifyJson.success) {
        setLoading(false);
        return showToast("Mật khẩu không chính xác!", "error");
      }

      const rawDoanhThu = selectedService.DoanhThu ? parseFloat(unformatNumber(selectedService.DoanhThu)) : 0;
      const rawVi = selectedService.Vi ? parseFloat(unformatNumber(selectedService.Vi)) : 0;
      const currentStatusText = String(selectedService.TrangThai || selectedService.status || "");
      const isPendingStatus = /chờ|cho|pending/i.test(currentStatusText);
      const finalApprovedStatus = isPendingStatus || !currentStatusText ? "Đã duyệt" : currentStatusText;

      const payload = {
        LoaiDichVu: selectedService.LoaiDichVu || selectedService.serviceType,
        TenDichVu: selectedService.TenDichVu || selectedService.serviceName,
        NgayThucHien: selectedService.NgayBatDau || selectedService.startDate,
        NgayKetThuc: selectedService.NgayHen || selectedService.appointmentDate || selectedService.endDate || null,
        NgayHen: selectedService.NgayHen || selectedService.appointmentDate || selectedService.endDate || null,
        DiaChiNhan: selectedService.DiaChiNhan || "",
        TrangThai: finalApprovedStatus,
        NgayHoanThanh: selectedService.NgayHoanThanh || selectedService.endDate,
        GoiDichVu: selectedService.GoiDichVu || "thường",
        YeuCauHoaDon: selectedService.YeuCauHoaDon,
        GhiChu: selectedService.GhiChu || "",
        NguoiPhuTrachId: selectedService.NguoiPhuTrachId || selectedService.picId,
        DoanhThuTruocChietKhau: rawDoanhThu,
        Vi: rawVi,
        DanhMuc: finalDanhMuc,
        approveAction: "accountant_approve",
        userId: currentUser?.id
      };


      const res = await authenticatedFetch(`${API_BASE}/b2b/services/update/${selectedService.id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      if (!res) { setLoading(false); return; }

      const json = await res.json();
      if (json.success) {
        const serviceCode = String(
          json.newCode ||
          json.code ||
          json.MaDichVu ||
          json.data?.MaDichVu ||
          selectedService.code ||
          selectedService.MaDichVu ||
          "CHUA_CAP_MA"
        ).trim();

        showToast(`CHỈNH SỬA / CẬP NHẬT DỊCH VỤ THÀNH CÔNG - Mã dịch vụ: ${serviceCode}`, "success");

        setApproveModalOpen(false);
        setLoading(false);
        loadServices(currentPage.services);
      } else {
        setLoading(false);
        showToast(json.message, "error");
      }

    } catch (err) {
      console.log(err);
      setLoading(false);
      showToast("Lỗi server", "error");
    }
  };

  const saveApprovedRow = async (item) => {
    if (!item.TenDoanhNghiep || !item.SoDKKD) return showToast("Thiếu thông tin", "warning");
    try {
      const res = await authenticatedFetch(`${API_BASE}/b2b/approved/${item.ID}`, {
        method: "PUT",
        body: JSON.stringify({
          TenDoanhNghiep: item.TenDoanhNghiep, SoDKKD: item.SoDKKD,
          NguoiDaiDien: item.NguoiDaiDien,
          NganhNgheChinh: item.NganhNgheChinh,
          SoDienThoai: item.SoDienThoai,
          Email: item.Email,
          MaVung: item.MaVung,
          DiaChi: item.DiaChi
        })
      });
      if (!res) return;

      const json = await res.json();
      if (json.success) {
        showToast("Cập nhật thành công!", "success");
        cancelEditing("approved", item.ID);
        loadServices(currentPage.services);
      } else { showToast(json.message, "error"); }
    } catch (e) { showToast("Lỗi server", "error"); }
  };

  const openEditApprovedCompanyModal = (item) => {
    if (!item) return;
    const phoneParts = splitPhoneForEditForm(item);
    setEditingApprovedCompany(item);
    setEditCompanyForm({
      TenDoanhNghiep: item.TenDoanhNghiep || "",
      SoDKKD: item.SoDKKD || "",
      NguoiDaiDien: item.NguoiDaiDien || "",
      NganhNgheChinh: item.NganhNgheChinh || "",
      SoDienThoai: phoneParts.SoDienThoai,
      Email: item.Email || "",
      MaVung: phoneParts.MaVung,
      DiaChi: item.DiaChi || ""
    });
    setShowEditCompanyModal(true);
  };

  const closeEditApprovedCompanyModal = () => {
    setShowEditCompanyModal(false);
    setEditingApprovedCompany(null);
    setEditCompanyForm({
      TenDoanhNghiep: "",
      SoDKKD: "",
      NguoiDaiDien: "",
      NganhNgheChinh: "",
      SoDienThoai: "",
      Email: "",
      MaVung: "",
      DiaChi: ""
    });
  };

  const handleEditCompanyFormChange = (e) => {
    const { name, value } = e.target;
    setEditCompanyForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitEditApprovedCompany = async () => {
    if (!editingApprovedCompany?.ID) return;

    const normalizedAreaCode = String(editCompanyForm.MaVung || "").trim();
    const normalizedPhone = String(editCompanyForm.SoDienThoai || "").trim();
    const combinedPhone = [normalizedAreaCode, normalizedPhone].filter(Boolean).join(" ").trim();

    const payload = {
      TenDoanhNghiep: String(editCompanyForm.TenDoanhNghiep || "").trim(),
      SoDKKD: String(editCompanyForm.SoDKKD || "").trim(),
      NguoiDaiDien: String(editCompanyForm.NguoiDaiDien || "").trim(),
      NganhNgheChinh: String(editCompanyForm.NganhNgheChinh || "").trim(),
      SoDienThoai: combinedPhone,
      Email: String(editCompanyForm.Email || "").trim(),
      MaVung: normalizedAreaCode,
      DiaChi: String(editCompanyForm.DiaChi || "").trim()
    };

    if (!payload.TenDoanhNghiep || !payload.SoDKKD) {
      showToast("Vui lòng nhập Tên doanh nghiệp và Số ĐKKD", "warning");
      return;
    }
    if (payload.Email && !payload.Email.includes("@")) {
      showToast("Email không hợp lệ", "warning");
      return;
    }

    try {
      setLoading(true);

      const res = await authenticatedFetch(`${API_BASE}/b2b/approved/${editingApprovedCompany.ID}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      if (!res) return;

      const json = await res.json();
      if (json.success) {
        const updatedCompany = {
          ...(editingApprovedCompany || {}),
          ...payload,
          ...(json.data || {})
        };

        setApprovedData((prev) =>
          prev.map((row) =>
            row.ID === editingApprovedCompany.ID ? { ...row, ...updatedCompany } : row
          )
        );
        setApprovedList((prev) =>
          prev.map((row) =>
            row.ID === editingApprovedCompany.ID ? { ...row, ...updatedCompany } : row
          )
        );

        showToast("Cập nhật doanh nghiệp thành công!", "success");
        closeEditApprovedCompanyModal();
        loadApproved(currentPage.approved || 1);
        loadServices(currentPage.services || 1);
      } else {
        showToast(json.message || "Cập nhật thất bại", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Lỗi server", "error");
    } finally {
      setLoading(false);
    }
  };

  const isApprover = currentUser?.is_admin || currentUser?.is_director || currentUser?.is_accountant;

  const approve = async (id) => {
    const result = await MySwal.fire({
      title: "Xác nhận", text: "Xác nhận duyệt doanh nghiệp này?", icon: "question", showCancelButton: true, confirmButtonColor: "#22c55e", cancelButtonColor: "#ef4444", confirmButtonText: "Duyệt", cancelButtonText: "Hủy"
    });
    if (!result.isConfirmed) return;
    try {
      const res = await authenticatedFetch(`${API_BASE}/b2b/approve/${id}`, { method: "POST" });
      if (!res) return;

      const json = await res.json();
      if (json.success) { showToast("Duyệt thành công", "success"); loadData(); } else { showToast(json.message, "error"); }
    } catch (e) { showToast("Lỗi server", "error"); }
  };

  const reject = async (item) => {
    const { value: reason } = await MySwal.fire({
      title: "Từ chối doanh nghiệp",
      input: "textarea",
      inputLabel: `Nhập lý do từ chối cho: ${item.TenDoanhNghiep}`,
      inputPlaceholder: "Ví dụ: Sai thông tin ĐKKD, hồ sơ mờ...",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Xác nhận từ chối",
      cancelButtonText: "Hủy",
      inputValidator: (value) => {
        if (!value || value.trim() === "") {
          return "Bạn bắt buộc phải nhập lý do!";
        }
        if (value.trim().length > 20) {
          return "Lý do tối đa 20 ký tự";
        }
      }
    });

    if (!reason) return;

    const trimmedReason = reason.trim();
    if (trimmedReason.length > 20) {
      showToast("Lý do tối đa 20 ký tự", "error");
      return;
    }

    try {
      const res = await authenticatedFetch(`${API_BASE}/b2b/pending/${item.ID}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason: trimmedReason })
      });
      if (!res) return;

      const json = await res.json();

      if (json.success) {
        showToast("Đã từ chối doanh nghiệp", "success");
        setPendingData(prev => prev.filter(i => i.ID !== item.ID));
        loadRejected(1);
      } else {
        showToast(json.message || "Lỗi khi từ chối", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Lỗi kết nối server", "error");
    }
  };


  const deleteRow = async (id) => {
    const result = await MySwal.fire({
      title: "CẢNH BÁO", text: "Xóa doanh nghiệp này sẽ xóa cả dịch vụ liên quan.", icon: "warning", showCancelButton: true, confirmButtonColor: "#ef4444", cancelButtonColor: "#2563eb", confirmButtonText: "Xóa", cancelButtonText: "Hủy"
    });
    if (!result.isConfirmed) return;
    try {
      const res = await authenticatedFetch(`${API_BASE}/b2b/approved/${id}`, { method: "DELETE" });
      if (!res) return;

      const json = await res.json();
      if (json.success) {
        showToast("Xóa thành công", "success");
        setApprovedData(prev => prev.filter(item => item.ID !== id));
        setApprovedList(prev => prev.filter(item => item.ID !== id));
      } else { showToast(json.message, "error"); }
    } catch (e) { showToast("Lỗi server", "error"); }
  };


  const deleteServiceRow = async (id, isNew, serviceCode = "") => {
    if (isNew) {
      setServiceData(prev => prev.filter(r => r.id !== id));
      setServiceTotal(prev => prev - 1);
      const localDeletedCode = String(serviceCode || "CHUA_CAP_MA").trim();
      showToast(`XÓA DỊCH VỤ THÀNH CÔNG - Mã dịch vụ: ${localDeletedCode}`, "success");
      return;
    }

    const result = await MySwal.fire({
      title: "Xác nhận", text: "Xóa dịch vụ này?", icon: "warning", showCancelButton: true, confirmButtonColor: "#ef4444", cancelButtonColor: "#2563eb", confirmButtonText: "Xóa", cancelButtonText: "Hủy"
    });

    if (!result.isConfirmed) return;

    try {
      const res = await authenticatedFetch(`${API_BASE}/b2b/services/${id}`, { method: "DELETE" });
      if (!res) return;

      const json = await res.json();
      if (json.success) {
        const deletedCode = String(
          json.code ||
          json.MaDichVu ||
          json.data?.MaDichVu ||
          serviceCode ||
          "CHUA_CAP_MA"
        ).trim();
        showToast(`XÓA DỊCH VỤ THÀNH CÔNG - Mã dịch vụ: ${deletedCode}`, "success");
        setServiceData(prev => prev.filter(r => r.id !== id));
        setServiceTotal(prev => prev - 1);
      } else { showToast("Lỗi xóa", "error"); }
    } catch (e) { showToast("Lỗi server", "error"); }
  };

  const getFilteredList = (list) => {
    if (!list) return [];
    return list.filter(item => Object.values(item).join(" ").toLowerCase().includes(searchTerm.toLowerCase()));
  };

  const baseCellStyle = { width: "100%", height: "100%", border: "none", outline: "none", backgroundColor: "transparent", padding: "2px 4px", fontSize: "12px", margin: 0, boxShadow: "none", borderRadius: 0 };

  const renderTabContent = () => {
    switch (activeTab) {
      case "services": return renderServicesTab();
      case "rejected": return renderRejectedTab();
      default: return renderPendingApprovedTab();
    }
  };

  const renderServicesTab = () => {
    const canApproveB2B = hasB2BApprovePermission(currentUser);
    const canViewRevenue = hasRevenueViewPermission(currentUser);
    const serviceColumnConfigs = COLUMN_CONFIGS.filter(
      (col) => canViewRevenue || !REVENUE_COLUMN_KEYS.includes(col.key)
    );
    const getColumnVisibilityStyle = (columnKey) =>
      visibleColumns.includes(columnKey) ? {} : { display: "none" };

    const tableKey = "services";
    const servicesColumns = [
      { key: "stt", width: 52 },
      { key: "company", width: 120 },
      { key: "soDKKD", width: 90 },
      { key: "hoSo", width: 219 },
      { key: "noiTiepNhan", width: 180 },
      { key: "diaChiNhan", width: 180 },
      { key: "loaiDichVu", width: 100 },
      { key: "tenDichVu", width: 140 },
      { key: "maDichVu", width: 160 },
      { key: "ghiChu", width: 180 },
      { key: "nguoiPhuTrach", width: 110 },
      { key: "ngayTao", width: 90 },
      { key: "ngayBatDau", width: 90 },
      { key: "ngayHen", width: 90 },
      { key: "ngayKetThuc", width: 90 },
      { key: "goi", width: 100 },
      { key: "invoiceYN", width: 70 },
      { key: "invoice", width: 60 },
      { key: "trangThai", width: 120 }
    ];

    if (canViewRevenue) {
      servicesColumns.push(
        { key: "doanhThuTruoc", width: 100 },
        { key: "mucChietKhau", width: 60 },
        { key: "soTienChietKhau", width: 80 },
        { key: "doanhThuSau", width: 100 },
        { key: "tongDoanhThu", width: 100 }
      );
    }

    const serviceHeaderStyle = (columnKey, width) => ({
      width: `${width}px`,
      whiteSpace: "pre-wrap",
      paddingTop: "2px",
      paddingBottom: "2px",
      paddingLeft: columnKey === "stt" ? "8px" : undefined,
      paddingRight: columnKey === "stt" ? "8px" : undefined,
      lineHeight: 1.05,
      ...getPinnedStyle({
        tableKey,
        columnKey,
        orderedColumns: servicesColumns,
        backgroundColor: "#1e3a8a",
        zIndex: 40
      })
    });

    const serviceCellPinStyle = (columnKey, rowBg, zIndex = 12) =>
      getPinnedStyle({
        tableKey,
        columnKey,
        orderedColumns: servicesColumns,
        backgroundColor: rowBg,
        zIndex
      });

    const getSubRowCount = (rec) => {
      if (!rec) return 1;
      const details = rec.ChiTietDichVu || {};
      // Cấu trúc MỚI: đếm services array
      if (details.services && Array.isArray(details.services)) {
        const totalRows = details.services.reduce((count, service) => {
          const rawName = String(service?.name || "");
          const normalized = rawName
            .replace(/\r\n?/g, "\n")
            .replace(/\s*[+＋﹢➕;；]\s*/g, "\n");
          const items = normalized
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean);
          return count + Math.max(1, items.length);
        }, 0);
        return Math.max(1, totalRows);
      }
      // Cấu trúc CŨ: đếm từ DanhMuc string
      const danhMucStr = rec.DanhMuc || "";
      if (danhMucStr) return danhMucStr.split(/\s*[+＋﹢➕;；]\s*/).filter(Boolean).length || 1;

      // Fallback: tách trực tiếp từ tên dịch vụ nếu dữ liệu cũ không có DanhMuc.
      const serviceNameStr = String(rec.serviceName || rec.TenDichVu || "");
      return serviceNameStr.split(/\s*[+＋﹢➕;；]\s*/).filter(Boolean).length || 1;
    };

    const getRowBeforeDiscount = (rec, subIdx) => {
      const details = rec.ChiTietDichVu || { main: {}, sub: [] };
      
      // Cấu trúc MỚI: {services: [], totals: {}}
      if (details.services && Array.isArray(details.services)) {
        const service = details.services[subIdx];
        if (service) {
          const soluong = parseFloat(service.soluong) || 1;
          const dongia = parseFloat(service.dongia) || 0;
          const thue = parseFloat(service.thue) || 0;
          const subtotal = soluong * dongia;
          const taxAmount = subtotal * (thue / 100);
          return subtotal + taxAmount; // Doanh thu trước chiết khấu
        }
        return 0;
      }
      
      // Cấu trúc CŨ: {main: {}, sub: []}
      if (details.main && details.main.revenue !== undefined) {
        if (subIdx === 0) return Number(details.main.revenue) || 0;
        const subItem = details.sub && details.sub[subIdx - 1];
        return subItem ? (Number(subItem.revenue) || 0) : 0;
      }
      if (subIdx === 0) return rec.revenueBefore ? parseFloat(String(rec.revenueBefore).replace(/\./g, "")) : 0;
      return 0;
    };

    const getRowDiscountRate = (rec, subIdx) => {
      const details = rec.ChiTietDichVu || { main: {}, sub: [] };
      
      // Cấu trúc MỚI: {services: [], totals: {}}
      if (details.services && Array.isArray(details.services)) {
        const service = details.services[subIdx];
        return service ? (parseFloat(service.chietkhau) || 0) : 0;
      }
      
      // Cấu trúc CŨ: {main: {}, sub: []}
      if (details.main && details.main.revenue !== undefined) {
        if (subIdx === 0) return Number(details.main.discount) || 0;
        const subItem = details.sub && details.sub[subIdx - 1];
        return subItem ? (Number(subItem.discount) || 0) : 0;
      }
      if (subIdx === 0) return rec.discountRate ? parseFloat(rec.discountRate) : 0;
      return 0;
    };

    const getRowRevenue = (rec, subIdx) => {
      const details = rec.ChiTietDichVu || { main: {}, sub: [] };
      
      // Cấu trúc MỚI: {services: [], totals: {}}
      if (details.services && Array.isArray(details.services)) {
        const service = details.services[subIdx];
        if (service) {
          const soluong = parseFloat(service.soluong) || 1;
          const dongia = parseFloat(service.dongia) || 0;
          const thue = parseFloat(service.thue) || 0;
          const chietkhau = parseFloat(service.chietkhau) || 0;
          const subtotal = soluong * dongia;
          const taxAmount = subtotal * (thue / 100);
          const discountAmount = subtotal * (chietkhau / 100);
          return subtotal + taxAmount - discountAmount; // Doanh thu sau chiết khấu
        }
        return 0;
      }
      
      // Cấu trúc CŨ: {main: {}, sub: []}
      if (details.main && details.main.revenue !== undefined) {
        if (subIdx === 0) {
          const mainRev = Number(details.main.revenue) || 0;
          const mainDisc = Number(details.main.discount) || 0;
          return mainRev - (mainRev * mainDisc / 100);
        } else {
          const subItem = details.sub && details.sub[subIdx - 1];
          if (subItem) {
            const subRev = Number(subItem.revenue) || 0;
            const subDisc = Number(subItem.discount) || 0;
            return subRev - (subRev * subDisc / 100);
          }
          return 0;
        }
      }
      if (subIdx === 0) {
        const rev = rec.revenueBefore ? parseFloat(String(rec.revenueBefore).replace(/\./g, "")) : 0;
        const discRate = rec.discountRate ? parseFloat(rec.discountRate) : 0;
        return rev - (rev * discRate / 100);
      }
      return 0;
    };

    const getRowDiscountAmount = (rec, subIdx) => {
      const before = getRowBeforeDiscount(rec, subIdx);
      const rate = getRowDiscountRate(rec, subIdx);
      return before * (rate / 100);
    };

    const getTotalRecordAfterDiscount = (rec) => {
      const details = rec.ChiTietDichVu || { main: {}, sub: [] };
      const wallet = rec.walletUsage ? parseFloat(String(rec.walletUsage).replace(/\./g, "")) : 0;
      
      // Cấu trúc MỚI: {services: [], totals: {}}
      if (details.services && Array.isArray(details.services)) {
        let total = 0;
        details.services.forEach(service => {
          const soluong = parseFloat(service.soluong) || 1;
          const dongia = parseFloat(service.dongia) || 0;
          const thue = parseFloat(service.thue) || 0;
          const chietkhau = parseFloat(service.chietkhau) || 0;
          const subtotal = soluong * dongia;
          const taxAmount = subtotal * (thue / 100);
          const discountAmount = subtotal * (chietkhau / 100);
          total += (subtotal + taxAmount - discountAmount);
        });
        return Math.max(0, total - wallet);
      }
      
      // Cấu trúc CŨ: {main: {}, sub: []}
      if (details.main && (details.main.revenue !== undefined)) {
        const mainRev = Number(details.main.revenue) || 0;
        const mainDisc = Number(details.main.discount) || 0;
        let total = mainRev - (mainRev * mainDisc / 100);
        if (Array.isArray(details.sub)) {
          details.sub.forEach(s => {
            const sRev = Number(s.revenue) || 0;
            const sDisc = Number(s.discount) || 0;
            total += (sRev - (sRev * sDisc / 100));
          });
        }
        return Math.max(0, total - wallet);
      }
      const rev = rec.revenueBefore ? parseFloat(String(rec.revenueBefore).replace(/\./g, "")) : 0;
      const discRate = rec.discountRate ? parseFloat(rec.discountRate) : 0;
      const discAmount = rev * (discRate / 100);
      return Math.max(0, rev - discAmount - wallet);
    };

    const displayData = [...(serviceData || [])].sort((a, b) => {
      const timeA = new Date(a.NgayTao || a.CreatedAt || a.createdAt || "").getTime();
      const timeB = new Date(b.NgayTao || b.CreatedAt || b.createdAt || "").getTime();
      const hasTimeA = Number.isFinite(timeA) && timeA > 0;
      const hasTimeB = Number.isFinite(timeB) && timeB > 0;

      if (hasTimeA && hasTimeB && timeA !== timeB) {
        // Dịch vụ nhập trước hiển thị trước.
        return timeA - timeB;
      }

      return (a.id || 0) - (b.id || 0);
    });

    const normalizedKeyword = String(searchTerm || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

    const filteredDisplayData = !normalizedKeyword
      ? displayData
      : displayData.filter((rec) => {
          const details = rec?.ChiTietDichVu || {};
          const detailNames = Array.isArray(details.services)
            ? details.services.map((s) => `${s?.name || ""} ${s?.note || s?.ghiChu || s?.serviceNote || ""}`).join(" ")
            : "";

          const rawText = [
            rec.companyName,
            rec.soDKKD,
            rec.serviceType,
            rec.serviceName,
            rec.code,
            rec.picName,
            rec.status,
            rec.email,
            rec.phoneNumber,
            rec.NoiTiepNhanHoSo,
            rec.DiaChiNhan,
            rec.GhiChu,
            rec.DanhMuc,
            detailNames,
          ]
            .filter(Boolean)
            .join(" ");

          const normalizedText = rawText
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();

          return normalizedText.includes(normalizedKeyword);
        });

    return (
      <div>
        <div
          className="d-flex justify-content-between align-items-end mb-4"
          style={{ paddingTop: 8, paddingBottom: 8 }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 22, color: '#222', lineHeight: 1.2 }}>
              Danh Sách Dịch Vụ B2B
            </div>
            <div style={{ color: '#6b7280', fontSize: 13, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Thông tin đăng ký dịch vụ trên hệ thống của ONE PASS
            </div>
          </div>
          <div className="d-flex align-items-center position-relative" style={{ gap: 12, minWidth: 0 }}>
            <input
              type="text"
              className="form-control"
              placeholder="Tìm theo tên, email, tên dịch vụ, người..."
              style={{
                width: 270,
                fontSize: 15,
                borderRadius: 12,
                height: 42,
                marginRight: 8,
                background: '#fff',
                border: '1px solid #d1d5db',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                outline: 'none',
                paddingLeft: 16,
                paddingRight: 16
              }}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <button
              className="btn btn-light border"
              style={{
                fontSize: 15,
                borderRadius: 12,
                height: 42,
                fontWeight: 500,
                color: '#444',
                background: '#f3f4f6',
                borderColor: '#e5e7eb',
                marginRight: 8,
                padding: '0 22px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
              }}
              onClick={() => loadData()}
            >Bộ lọc</button>
            <button
              className="d-flex align-items-center gap-2 shadow-sm"
              onClick={handleOpenAddServiceModal}
              style={{
                background: '#19924a',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 700,
                padding: '0 22px',
                height: 42,
                boxShadow: '0 2px 8px rgba(25,146,74,0.08)',
                transition: 'background 0.2s, box-shadow 0.2s',
                cursor: 'pointer',
                outline: 'none',
                whiteSpace: 'nowrap',
                marginRight: 8
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#15703a';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(25,146,74,0.16)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#19924a';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(25,146,74,0.08)';
              }}
            >
              <Plus size={18} />
              {t.dangKyDichVuMoi}
            </button>
            {/* Nút cấu hình cột đặt bên phải nút đăng ký dịch vụ mới */}
            <button
              className="btn btn-light border d-flex align-items-center justify-content-center"
              style={{ height: 42, width: 42, borderRadius: 12, padding: 0 }}
              onClick={() => setShowColumnConfig(s => !s)}
              title="Cấu hình cột"
              type="button"
            >
              <Settings2 size={22} />
            </button>
            <ColumnConfigPopup
              show={showColumnConfig}
              onClose={() => setShowColumnConfig(false)}
              columns={visibleColumns}
              columnConfigs={serviceColumnConfigs}
              onChange={key => {
                setVisibleColumns(cols =>
                  cols.includes(key)
                    ? cols.filter(c => c !== key)
                    : [...cols, key]
                );
              }}
            />
          </div>
        </div>

        {/* Tổng doanh thu tích lũy chuyển lên đây */}
        {canViewRevenue && (
          <div className="d-flex justify-content-end align-items-center mt-3 mb-2"
            style={{
              fontSize: "17px",
              fontWeight: 600,
              padding: "8px 0 8px 0",
              minHeight: 36
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 17, marginRight: 8 }}>Tổng doanh thu tích lũy:</span>
            <span style={{ fontWeight: 700, fontSize: 20, color: '#2563eb' }}>{formatNumber(overallB2BRevenue)} đ</span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-2 text-muted" style={{ fontSize: "12px" }}>
              Bấm biểu tượng ghim ở tiêu đề để cố định cột. Có thể ghim nhiều cột cùng lúc.
            </div>
            <div className="table-responsive shadow-sm rounded">
              <table className="table table-bordered table-sm mb-0 align-middle" style={{ fontSize: "12px", borderCollapse: "separate", borderSpacing: 0, tableLayout: "fixed" }}>
                <thead className="text-white text-center align-middle" style={{ backgroundColor: "#1e3a8a" }}>
                  <tr>
                    <th className="py-0 border" style={{ ...serviceHeaderStyle("stt", 52), ...getColumnVisibilityStyle("stt") }}><div className="d-flex align-items-center justify-content-center gap-1" style={{ padding: "0 8px" }}><span>{t.stt}</span>{renderPinButton(tableKey, "stt")}</div></th>
                    <th className="py-0 border" style={{ ...serviceHeaderStyle("company", 120), ...getColumnVisibilityStyle("company") }}><div className="d-flex align-items-center justify-content-center gap-1"><span>{t.chonDN}</span>{renderPinButton(tableKey, "company")}</div></th>
                    <th className="py-0 border" style={{ ...serviceHeaderStyle("soDKKD", 90), ...getColumnVisibilityStyle("soDKKD") }}><div className="d-flex align-items-center justify-content-center gap-1"><span>Số ĐKKD</span>{renderPinButton(tableKey, "soDKKD")}</div></th>
                    <th className="py-0 border" style={{ ...serviceHeaderStyle("hoSo", 219), ...getColumnVisibilityStyle("hoSo") }}><div className="d-flex align-items-center justify-content-center gap-1"><span>{t.hoSo}</span>{renderPinButton(tableKey, "hoSo")}</div></th>
                    <th className="py-0 border" style={{ ...serviceHeaderStyle("noiTiepNhan", 180), ...getColumnVisibilityStyle("noiTiepNhan") }}><div className="d-flex align-items-center justify-content-center gap-1"><span>{t.noiTiepNhanHoSo}</span>{renderPinButton(tableKey, "noiTiepNhan")}</div></th>
                    <th className="py-0 border" style={{ ...serviceHeaderStyle("diaChiNhan", 180), ...getColumnVisibilityStyle("diaChiNhan") }}><div className="d-flex align-items-center justify-content-center gap-1"><span>{t.diaChiNhan}</span>{renderPinButton(tableKey, "diaChiNhan")}</div></th>
                    <th className="py-0 border" style={{ ...serviceHeaderStyle("loaiDichVu", 100), ...getColumnVisibilityStyle("loaiDichVu") }}><div className="d-flex align-items-center justify-content-center gap-1"><span>{t.loaiDichVu}</span>{renderPinButton(tableKey, "loaiDichVu")}</div></th>
                    <th className="py-0 border" style={{ ...serviceHeaderStyle("tenDichVu", 140), ...getColumnVisibilityStyle("tenDichVu") }}><div className="d-flex align-items-center justify-content-center gap-1"><span>{t.tenDichVu}</span>{renderPinButton(tableKey, "tenDichVu")}</div></th>
                    <th className="py-0 border" style={{ ...serviceHeaderStyle("maDichVu", 160), ...getColumnVisibilityStyle("maDichVu") }}><div className="d-flex align-items-center justify-content-center gap-1"><span>{t.maDichVu}</span>{renderPinButton(tableKey, "maDichVu")}</div></th>
                    <th className="py-0 border" style={{ ...serviceHeaderStyle("ghiChu", 180), ...getColumnVisibilityStyle("ghiChu") }}><div className="d-flex align-items-center justify-content-center gap-1"><span>{t.ghiChuDichVu}</span>{renderPinButton(tableKey, "ghiChu")}</div></th>
                    <th className="py-0 border" style={{ ...serviceHeaderStyle("nguoiPhuTrach", 110), ...getColumnVisibilityStyle("nguoiPhuTrach") }}><div className="d-flex align-items-center justify-content-center gap-1"><span>{t.nguoiPhuTrach}</span>{renderPinButton(tableKey, "nguoiPhuTrach")}</div></th>
                    <th className="py-0 border" style={{ ...serviceHeaderStyle("ngayTao", 90), ...getColumnVisibilityStyle("ngayTao") }}><div className="d-flex align-items-center justify-content-center gap-1"><span>{t.ngayTao}</span>{renderPinButton(tableKey, "ngayTao")}</div></th>
                    <th className="py-0 border" style={{ ...serviceHeaderStyle("ngayBatDau", 90), ...getColumnVisibilityStyle("ngayBatDau") }}><div className="d-flex align-items-center justify-content-center gap-1"><span>{t.ngayBatDau}</span>{renderPinButton(tableKey, "ngayBatDau")}</div></th>
                    <th className="py-0 border" style={{ ...serviceHeaderStyle("ngayHen", 90), ...getColumnVisibilityStyle("ngayHen") }}><div className="d-flex align-items-center justify-content-center gap-1"><span>{t.ngayHen}</span>{renderPinButton(tableKey, "ngayHen")}</div></th>
                    <th className="py-0 border" style={{ ...serviceHeaderStyle("ngayKetThuc", 90), ...getColumnVisibilityStyle("ngayKetThuc") }}><div className="d-flex align-items-center justify-content-center gap-1"><span>{t.ngayKetThuc}</span>{renderPinButton(tableKey, "ngayKetThuc")}</div></th>
                    <th className="py-0 border" style={{ ...serviceHeaderStyle("goi", 100), ...getColumnVisibilityStyle("goi") }}><div className="d-flex align-items-center justify-content-center gap-1"><span>Gói</span>{renderPinButton(tableKey, "goi")}</div></th>
                    <th className="py-0 border" style={{ ...serviceHeaderStyle("invoiceYN", 70), ...getColumnVisibilityStyle("invoiceYN") }}><div className="d-flex align-items-center justify-content-center gap-1"><span>Invoice Y/N</span>{renderPinButton(tableKey, "invoiceYN")}</div></th>
                    <th className="py-0 border" style={{ ...serviceHeaderStyle("invoice", 60), ...getColumnVisibilityStyle("invoice") }}><div className="d-flex align-items-center justify-content-center gap-1"><span>Invoice</span>{renderPinButton(tableKey, "invoice")}</div></th>
                    <th className="py-0 border" style={{ ...serviceHeaderStyle("trangThai", 120), ...getColumnVisibilityStyle("trangThai") }}><div className="d-flex align-items-center justify-content-center gap-1"><span>Trạng thái</span>{renderPinButton(tableKey, "trangThai")}</div></th>

                    {canViewRevenue && (
                      <>
                        <th className="py-0 border" style={{ ...serviceHeaderStyle("doanhThuTruoc", 100), ...getColumnVisibilityStyle("doanhThuTruoc") }}><div className="d-flex align-items-center justify-content-center gap-1"><span>{t.doanhThuTruoc}</span>{renderPinButton(tableKey, "doanhThuTruoc")}</div></th>
                        <th className="py-0 border" style={{ ...serviceHeaderStyle("mucChietKhau", 60), ...getColumnVisibilityStyle("mucChietKhau") }}><div className="d-flex align-items-center justify-content-center gap-1"><span>{t.mucChietKhau}</span>{renderPinButton(tableKey, "mucChietKhau")}</div></th>
                        <th className="py-0 border" style={{ ...serviceHeaderStyle("soTienChietKhau", 80), ...getColumnVisibilityStyle("soTienChietKhau") }}><div className="d-flex align-items-center justify-content-center gap-1"><span>{t.soTienChietKhau}</span>{renderPinButton(tableKey, "soTienChietKhau")}</div></th>
                        <th className="py-0 border" style={{ ...serviceHeaderStyle("doanhThuSau", 100), ...getColumnVisibilityStyle("doanhThuSau") }}><div className="d-flex align-items-center justify-content-center gap-1"><span>{t.doanhThuSau}</span>{renderPinButton(tableKey, "doanhThuSau")}</div></th>
                        <th className="py-0 border" style={{ ...serviceHeaderStyle("tongDoanhThu", 100), ...getColumnVisibilityStyle("tongDoanhThu") }}><div className="d-flex align-items-center justify-content-center gap-1"><span>{t.tongDoanhThuTichLuy}</span>{renderPinButton(tableKey, "tongDoanhThu")}</div></th>
                      </>
                    )}
                    <th
                      className="py-0 border"
                      style={{
                        width: "100px",
                        minWidth: "100px",
                        maxWidth: "100px",
                        whiteSpace: "pre-wrap",
                        position: "sticky",
                        right: 0,
                        zIndex: 30,
                        backgroundColor: "#1e3a8a",
                        boxShadow: "-2px 0 6px rgba(0,0,0,0.12)",
                        borderLeft: "1px solid #2e4fa3",
                        ...getColumnVisibilityStyle("hanhDong")
                      }}
                    >
                      {t.hanhDong}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDisplayData && filteredDisplayData.length > 0 ? (
                    filteredDisplayData.map((rec, idx) => {
                      const globalIndex = idx + 1 + (currentPage.services - 1) * PAGE_SIZE;
                      const subRowsCount = getSubRowCount(rec);
                      
                      // Lấy danh sách service names từ ChiTietDichVu
                      const details = rec.ChiTietDichVu || {};
                      let serviceRows = [];
                      if (details.services && Array.isArray(details.services)) {
                        // Cấu trúc MỚI: tách 1 dòng/1 ô/1 dịch vụ.
                        serviceRows = details.services.flatMap((s, sourceIndex) => {
                          const rawName = String(s?.name || "");
                          const normalized = rawName
                            .replace(/\r\n?/g, "\n")
                            .replace(/\s*[+＋﹢➕;；]\s*/g, "\n");

                          const items = normalized
                            .split("\n")
                            .map((item) => item.trim())
                            .filter(Boolean);

                          const noteValue = String(s?.note || s?.ghiChu || s?.serviceNote || "").trim();

                          if (items.length === 0) {
                            return [{ name: rawName, note: noteValue, sourceIndex }];
                          }

                          return items.map((item) => ({
                            name: item,
                            note: noteValue,
                            sourceIndex
                          }));
                        });
                      } else {
                        // Cấu trúc CŨ: lấy từ DanhMuc string
                        const legacySource = String(rec.DanhMuc || rec.serviceName || rec.TenDichVu || "");
                        serviceRows = legacySource
                          .split(/\s*[+＋﹢➕;；]\s*/)
                          .map((name) => ({ name: String(name || "").trim(), note: "" }))
                          .filter((s) => s.name);
                      }

                      if (serviceRows.length === 0) {
                        const fallbackName = String(rec.serviceName || rec.TenDichVu || "").trim();
                        serviceRows = fallbackName ? [{ name: fallbackName, note: "" }] : [{ name: "", note: "" }];
                      }
                      const servicesList = serviceRows.map((s) => s.name || "");
                      
                      const currentCompanyId = String(rec.companyId || rec.DoanhNghiepID || "");
                      const prevCompanyId = idx > 0 ? String(filteredDisplayData[idx - 1].companyId || filteredDisplayData[idx - 1].DoanhNghiepID || "") : null;

                      let shouldRenderCompanyCell = false;
                      let companyRowSpan = 0;
                      const groupTotalRevenue = calculateCompanyTotalRevenue(currentCompanyId);

                      if (!currentCompanyId || currentCompanyId !== prevCompanyId) {
                        shouldRenderCompanyCell = true;
                        for (let i = idx; i < filteredDisplayData.length; i++) {
                          const nextRec = filteredDisplayData[i];
                          if (String(nextRec.companyId || nextRec.DoanhNghiepID || "") !== currentCompanyId) break;
                          companyRowSpan += getSubRowCount(nextRec);
                        }
                      }

                      const rowBg = rec.isNew ? "#dcfce7" : "#fff";

                      const mergedStyle = {
                        backgroundColor: rowBg,
                        verticalAlign: "middle",
                        position: "relative",
                        zIndex: 1,
                        padding: "10px 8px",
                        fontSize: "12px",
                        textAlign: "center",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        overflow: "visible",
                        textOverflow: "unset",
                        maxWidth: "300px"
                      };

                      const danhMucStyle = {
                        backgroundColor: rowBg,
                        verticalAlign: "middle",
                        padding: "4px 8px",
                        fontSize: "12px",
                        textAlign: "left"
                      };

                      return servicesList.map((_, subIdx) => {
                        const isFirstSubRow = subIdx === 0;
                        const serviceRow = serviceRows[subIdx] || {};
                        const financialSubIdx = Number.isInteger(serviceRow.sourceIndex) ? serviceRow.sourceIndex : subIdx;

                        return (
                          <tr key={`${rec.uiId}_${subIdx}`} className={rec.isNew ? "" : "bg-white hover:bg-gray-50"}>
                            {isFirstSubRow && <td className="border" rowSpan={subRowsCount} style={{ ...mergedStyle, ...serviceCellPinStyle("stt", rowBg, 14), ...getColumnVisibilityStyle("stt") }}>{globalIndex}</td>}
                            {isFirstSubRow && shouldRenderCompanyCell && (
                              <>
                                <td className="border" rowSpan={companyRowSpan} style={{ ...mergedStyle, ...serviceCellPinStyle("company", rowBg, 13), ...getColumnVisibilityStyle("company") }} title={rec.companyName}>{rec.companyName || ""}</td>
                                <td className="border" rowSpan={companyRowSpan} style={{ ...mergedStyle, ...serviceCellPinStyle("soDKKD", rowBg, 13), ...getColumnVisibilityStyle("soDKKD") }} title={rec.soDKKD}>{rec.soDKKD || ""}</td>
                              </>
                            )}
                            {isFirstSubRow && (
                              <>

                                <td className="border" rowSpan={subRowsCount} style={{ ...mergedStyle, maxWidth: '240px', textAlign: 'left', padding: '8px', ...serviceCellPinStyle("hoSo", rowBg, 13), ...getColumnVisibilityStyle("hoSo") }}>
                                  {rec.ChiTietDichVu?.files?.length > 0 ? (
                                    <div className="d-flex flex-column gap-1">
                                      {rec.ChiTietDichVu.files.map((f, i) => (
                                        <a key={i} href={f.url} target="_blank" rel="noreferrer" className="d-flex align-items-center gap-1 text-decoration-none text-primary" title={f.name}>
                                          <Paperclip size={12} style={{ flexShrink: 0 }} />
                                          <span style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                                        </a>
                                      ))}
                                    </div>
                                  ) : <div className="text-center text-muted">-</div>}
                                </td>

                                <td className="border" rowSpan={subRowsCount} style={{ ...mergedStyle, textAlign: 'left', ...serviceCellPinStyle("noiTiepNhan", rowBg, 13), ...getColumnVisibilityStyle("noiTiepNhan") }} title={rec.NoiTiepNhanHoSo || "--"}>{rec.NoiTiepNhanHoSo || "--"}</td>
                                <td
                                  className="border"
                                  rowSpan={subRowsCount}
                                  style={{
                                    ...mergedStyle,
                                    textAlign: 'left',
                                    padding: '12px 14px', // padding đều các phía
                                    ...serviceCellPinStyle("diaChiNhan", rowBg, 13),
                                    ...getColumnVisibilityStyle("diaChiNhan")
                                  }}
                                  title={rec.DiaChiNhan || "--"}
                                >
                                  {rec.DiaChiNhan || "--"}
                                </td>
                                <td className="border" rowSpan={subRowsCount} style={{ ...mergedStyle, ...serviceCellPinStyle("loaiDichVu", rowBg, 13), ...getColumnVisibilityStyle("loaiDichVu") }} title={rec.serviceType}>{rec.serviceType}</td>
                              </>
                            )}

                            <td className="border" style={{ ...mergedStyle, whiteSpace: 'normal', lineHeight: '1.5', overflow: 'visible', maxWidth: 'none', textAlign: 'center', ...serviceCellPinStyle("tenDichVu", rowBg, 13), ...getColumnVisibilityStyle("tenDichVu") }} title={serviceRow.name || rec.serviceName || ""}>
                              {serviceRow.name || rec.serviceName || ""}
                            </td>

                            {isFirstSubRow && (
                              <>
                                <td className="border" rowSpan={subRowsCount} style={{ ...mergedStyle, width: 170, ...serviceCellPinStyle("maDichVu", rowBg, 12), ...getColumnVisibilityStyle("maDichVu") }}>
                                  {rec.code ? (
                                    <button
                                      type="button"
                                      onClick={() => handleViewServiceDetail(rec)}
                                      style={{
                                        border: "none",
                                        background: "transparent",
                                        color: "#1d4ed8",
                                        fontWeight: 700,
                                        textDecoration: "underline",
                                        cursor: "pointer",
                                        padding: 0
                                      }}
                                      title="Xem chi tiết"
                                    >
                                      {rec.code}
                                    </button>
                                  ) : (
                                    <span className="fw-bold text-dark">{rec.code}</span>
                                  )}
                                </td>
                              </>
                            )}

                            <td className="border" style={{ ...danhMucStyle, minWidth: 140, maxWidth: 220, ...serviceCellPinStyle("ghiChu", rowBg, 12), ...getColumnVisibilityStyle("ghiChu") }}>
                              <div className="px-1" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                                {serviceRow.note || serviceRow.name || ""}
                              </div>
                            </td>

                            {isFirstSubRow && (
                              <>
                                <td className="border" rowSpan={subRowsCount} style={{ ...mergedStyle, ...serviceCellPinStyle("nguoiPhuTrach", rowBg, 12), ...getColumnVisibilityStyle("nguoiPhuTrach") }} title={rec.picName}>{rec.picName}</td>
                                <td className="border" rowSpan={subRowsCount} style={{ ...mergedStyle, ...serviceCellPinStyle("ngayTao", rowBg, 12), ...getColumnVisibilityStyle("ngayTao") }}>{rec.createdDate}</td>
                                <td className="border" rowSpan={subRowsCount} style={{ ...mergedStyle, ...serviceCellPinStyle("ngayBatDau", rowBg, 12), ...getColumnVisibilityStyle("ngayBatDau") }}>{rec.startDate}</td>
                                <td className="border" rowSpan={subRowsCount} style={{ ...mergedStyle, ...serviceCellPinStyle("ngayHen", rowBg, 12), ...getColumnVisibilityStyle("ngayHen") }}>{rec.appointmentDate}</td>
                                <td className="border" rowSpan={subRowsCount} style={{ ...mergedStyle, ...serviceCellPinStyle("ngayKetThuc", rowBg, 12), ...getColumnVisibilityStyle("ngayKetThuc") }}>{rec.completionDate}</td>
                                <td className="border" rowSpan={subRowsCount} style={{ ...mergedStyle, ...serviceCellPinStyle("goi", rowBg, 12), ...getColumnVisibilityStyle("goi") }}><span className={String(rec.package || "").startsWith("Gấp") ? "text-danger fw-bold" : ""}>{rec.package}</span></td>
                                <td className="border" rowSpan={subRowsCount} style={{ ...mergedStyle, ...serviceCellPinStyle("invoiceYN", rowBg, 12), ...getColumnVisibilityStyle("invoiceYN") }}>{rec.invoiceYN}</td>
                                <td className="border" rowSpan={subRowsCount} style={{ ...mergedStyle, ...serviceCellPinStyle("invoice", rowBg, 12), ...getColumnVisibilityStyle("invoice") }}>{rec.invoiceUrl ? (<a href={rec.invoiceUrl} target="_blank" rel="noreferrer" className="text-primary d-inline-block"><FileText size={16} /></a>) : ""}</td>
                                <td className="border" rowSpan={subRowsCount} style={{ ...mergedStyle, ...serviceCellPinStyle("trangThai", rowBg, 12), ...getColumnVisibilityStyle("trangThai") }}>
                                  {rec.status}
                                </td>
                              </>
                            )}

                            {canViewRevenue && (
                              <>
                                <td className="border text-center pe-2" style={{ verticalAlign: "middle", ...serviceCellPinStyle("doanhThuTruoc", rowBg, 12), ...getColumnVisibilityStyle("doanhThuTruoc") }}>{formatNumber(getRowBeforeDiscount(rec, financialSubIdx))}</td>
                                <td className="border text-center" style={{ verticalAlign: "middle", ...serviceCellPinStyle("mucChietKhau", rowBg, 12), ...getColumnVisibilityStyle("mucChietKhau") }}>{getRowDiscountRate(rec, financialSubIdx) ? getRowDiscountRate(rec, financialSubIdx) + "%" : "0%"}</td>
                                <td className="border text-center pe-2" style={{ verticalAlign: "middle", ...serviceCellPinStyle("soTienChietKhau", rowBg, 12), ...getColumnVisibilityStyle("soTienChietKhau") }}>{formatNumber(getRowDiscountAmount(rec, financialSubIdx))}</td>
                                {isFirstSubRow && (
                                  <td
                                    className="border text-center pe-2"
                                    rowSpan={subRowsCount}
                                    style={{ ...mergedStyle, ...serviceCellPinStyle("doanhThuSau", rowBg, 12), ...getColumnVisibilityStyle("doanhThuSau") }}
                                  >
                                    {formatNumber(getTotalRecordAfterDiscount(rec))}
                                  </td>
                                )}
                                {shouldRenderCompanyCell && isFirstSubRow && (<td className="border fw-bold text-primary text-center pe-2" rowSpan={companyRowSpan} style={{ ...mergedStyle, ...serviceCellPinStyle("tongDoanhThu", rowBg, 12), ...getColumnVisibilityStyle("tongDoanhThu") }}>{formatNumber(groupTotalRevenue)}</td>)}
                              </>
                            )}

                            {isFirstSubRow && (
                              <td
                                className="border"
                                rowSpan={subRowsCount}
                                style={{
                                  ...mergedStyle,
                                  width: "100px",
                                  minWidth: "100px",
                                  maxWidth: "100px",
                                  position: "sticky",
                                  right: 0,
                                  zIndex: 20,
                                  backgroundColor: rec.isNew ? "#dcfce7" : "#fff",
                                  boxShadow: "-2px 0 6px rgba(0,0,0,0.08)",
                                  borderLeft: "1px solid #dee2e6",
                                  ...getColumnVisibilityStyle("hanhDong")
                                }}
                              >
                                <div className="d-flex justify-content-center gap-1">
                                  {(canApproveB2B && (!rec.code || String(rec.status || "").toLowerCase().includes("chờ") || String(rec.status || "").toLowerCase().includes("cho") || String(rec.status || "").toLowerCase().includes("pending"))) ? (
                                    <button className="btn btn-sm shadow-sm p-0 d-flex align-items-center justify-content-center" style={{ backgroundColor: "#06b6d4", color: "#fff", width: 28, height: 28 }} onClick={() => handleEditService(rec, "approve")}><Check size={16} /></button>
                                  ) : (
                                    <button className="btn btn-sm shadow-sm p-0 d-flex align-items-center justify-content-center" style={{ backgroundColor: "#f59e0b", color: "#fff", width: 28, height: 28 }} onClick={() => handleEditService(rec)}><Edit size={14} /></button>
                                  )}
                                  <button className="btn btn-sm shadow-sm p-0 d-flex align-items-center justify-content-center" style={{ backgroundColor: "#ef4444", color: "#fff", width: 28, height: 28 }} onClick={() => deleteServiceRow(rec.id, rec.isNew, rec.code || rec.MaDichVu)}><Trash2 size={14} /></button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      });
                    })
                  ) : (<tr><td colSpan="100%" className="text-center text-muted py-4">{normalizedKeyword ? "Không tìm thấy kết quả" : "Chưa có dữ liệu"}</td></tr>)}
                </tbody>
              </table>
            </div>
            <Pagination current={currentPage.services} total={serviceTotal} pageSize={PAGE_SIZE} currentLanguage={currentLanguage} onChange={(page) => handlePageChange("services", page)} />
          </>
        )}
      </div>
    );
  };

  const renderRejectedTab = () => {
    const tableKey = "rejected";
    const rejectedColumns = [
      { key: "stt", width: 52 },
      { key: "tenDN", width: 150 },
      { key: "soDKKD", width: 100 },
      { key: "email", width: 150 },
      { key: "soDienThoai", width: 120 },
      { key: "nguoiDaiDien", width: 130 },
      { key: "nganhNgheChinh", width: 160 },
      { key: "lyDoTuChoi", width: 220 },
      { key: "ngayDangKy", width: 120 }
    ];

    const rejectedHeaderStyle = (columnKey, width) => ({
      width: `${width}px`,
      minWidth: `${width}px`,
      paddingTop: "2px",
      paddingBottom: "2px",
      paddingLeft: columnKey === "stt" ? "8px" : undefined,
      paddingRight: columnKey === "stt" ? "8px" : undefined,
      lineHeight: 1.05,
      ...getPinnedStyle({
        tableKey,
        columnKey,
        orderedColumns: rejectedColumns,
        backgroundColor: "#1e3a8a",
        zIndex: 40
      })
    });

    const rejectedCellPinStyle = (columnKey, rowBg = "#fff", zIndex = 12) =>
      getPinnedStyle({
        tableKey,
        columnKey,
        orderedColumns: rejectedColumns,
        backgroundColor: rowBg,
        zIndex
      });

    return (
      <>
        <div className="mb-2 text-muted" style={{ fontSize: "12px" }}>
          Bấm biểu tượng ghim ở tiêu đề để cố định cột. Có thể ghim nhiều cột cùng lúc.
        </div>
        <div className="table-responsive shadow-sm rounded" style={{ overflowX: "auto", overflowY: "visible" }}>
          <table className="table table-bordered table-sm mb-0 align-middle" style={{ fontSize: "12px", tableLayout: "fixed" }}>
            <thead className="text-white text-center align-middle" style={{ backgroundColor: "#1e3a8a", fontSize: "12px" }}>
              <tr>
                <th className="py-0 border" style={rejectedHeaderStyle("stt", 52)}><div className="d-flex align-items-center justify-content-center gap-1" style={{ padding: "0 8px" }}><span>{t.stt}</span>{renderPinButton(tableKey, "stt")}</div></th>
                <th className="py-0 border" style={rejectedHeaderStyle("tenDN", 150)}><div className="d-flex align-items-center justify-content-center gap-1"><span>{t.tenDN}</span>{renderPinButton(tableKey, "tenDN")}</div></th>
                <th className="py-0 border" style={rejectedHeaderStyle("soDKKD", 100)}><div className="d-flex align-items-center justify-content-center gap-1"><span>{t.soDKKD}</span>{renderPinButton(tableKey, "soDKKD")}</div></th>
                <th className="py-0 border" style={rejectedHeaderStyle("email", 150)}><div className="d-flex align-items-center justify-content-center gap-1"><span>{t.email}</span>{renderPinButton(tableKey, "email")}</div></th>
                <th className="py-0 border" style={rejectedHeaderStyle("soDienThoai", 120)}><div className="d-flex align-items-center justify-content-center gap-1"><span>{t.soDienThoai}</span>{renderPinButton(tableKey, "soDienThoai")}</div></th>
                <th className="py-0 border" style={rejectedHeaderStyle("nguoiDaiDien", 130)}><div className="d-flex align-items-center justify-content-center gap-1"><span>{t.nguoiDaiDien}</span>{renderPinButton(tableKey, "nguoiDaiDien")}</div></th>
                <th className="py-0 border" style={rejectedHeaderStyle("nganhNgheChinh", 160)}><div className="d-flex align-items-center justify-content-center gap-1"><span>{t.nganhNgheChinh}</span>{renderPinButton(tableKey, "nganhNgheChinh")}</div></th>
                <th className="py-0 border" style={rejectedHeaderStyle("lyDoTuChoi", 220)}><div className="d-flex align-items-center justify-content-center gap-1"><span>{t.lyDoTuChoi}</span>{renderPinButton(tableKey, "lyDoTuChoi")}</div></th>
                <th className="py-0 border" style={rejectedHeaderStyle("ngayDangKy", 120)}><div className="d-flex align-items-center justify-content-center gap-1"><span>{t.ngayDangKy}</span>{renderPinButton(tableKey, "ngayDangKy")}</div></th>
              </tr>
            </thead>
            <tbody>
              {rejectedData.map((item, idx) => (
                <tr key={item.ID} className="bg-white hover:bg-gray-50">
                  <td className="text-center border align-middle" style={{ height: "30px", ...rejectedCellPinStyle("stt", "#fff", 14) }}>{idx + 1 + (currentPage.rejected - 1) * PAGE_SIZE}</td>
                  <td className="border align-middle" style={rejectedCellPinStyle("tenDN", "#fff", 13)}><div className="text-center" style={baseCellStyle}>{item.TenDoanhNghiep || ""}</div></td>
                  <td className="border align-middle" style={rejectedCellPinStyle("soDKKD", "#fff", 13)}><div className="text-center" style={baseCellStyle}>{item.SoDKKD || ""}</div></td>
                  <td className="border align-middle" style={rejectedCellPinStyle("email", "#fff", 12)}><div className="text-center" style={baseCellStyle}>{item.Email || ""}</div></td>
                  <td className="border align-middle" style={rejectedCellPinStyle("soDienThoai", "#fff", 12)}><div className="text-center" style={baseCellStyle}>{item.SoDienThoai || ""}</div></td>
                  <td className="border align-middle" style={rejectedCellPinStyle("nguoiDaiDien", "#fff", 12)}><div className="text-center" style={baseCellStyle}>{item.NguoiDaiDien || ""}</div></td>
                  <td className="border align-middle" style={rejectedCellPinStyle("nganhNgheChinh", "#fff", 12)}><div className="text-center" style={baseCellStyle}>{item.NganhNgheChinh || ""}</div></td>
                  <td className="border align-middle" style={rejectedCellPinStyle("lyDoTuChoi", "#fff", 12)}><div className="text-center" style={baseCellStyle}>{item.LyDoTuChoi || ""}</div></td>
                  <td className="text-center border align-middle" style={rejectedCellPinStyle("ngayDangKy", "#fff", 12)}>{formatDateTimeReject(item.NgayTao)}</td>
                </tr>
              ))}
              {rejectedData.length === 0 && (<tr><td colSpan="9" className="text-center py-3 text-muted">{currentLanguage === "vi" ? "Không có dữ liệu" : currentLanguage === "ko" ? "데이터가 없습니다" : "No data"}</td></tr>)}
            </tbody>
          </table>
          <Pagination currentLanguage={currentLanguage} current={currentPage.rejected} total={rejectedTotal} pageSize={PAGE_SIZE} onChange={(page) => handlePageChange("rejected", page)} />
        </div>
      </>
    );
  };

  const saveEditing = (item, tab) => {
    if (tab === "pending") return savePendingRow(item);
    if (tab === "approved") return saveApprovedRow(item);
    showToast("Không xác định được tab để lưu!", "error");
  };

  const handleCellEdit = (field, item, e) => {
    if (activeTab === 'pending') handlePendingChange(item.ID, field, e.target.value);
    if (activeTab === 'approved') handleApprovedChange(item.ID, field, e.target.value);
  }


  const renderPendingApprovedTab = () => {


    const isApprovedTab = activeTab === "approved";
    const tableKey = activeTab;
    const pendingApprovedColumns = [
      { key: "stt", width: 52 },
      { key: "tenDN", width: 160 },
      { key: "soDKKD", width: 90 },
      { key: "nguoiDaiDien", width: 110 }
    ];

    if (activeTab === "pending") {
      pendingApprovedColumns.push({ key: "dichVu", width: 100 }, { key: "giayPhep", width: 70 });
    }

    if (isApprovedTab) {
      pendingApprovedColumns.push(
        { key: "soDienThoai", width: 110 },
        { key: "email", width: 170 },
        { key: "nganhNghe", width: 150 },
        { key: "diaChi", width: 170 }
      );
    }

    pendingApprovedColumns.push({ key: "ngayDangKy", width: 90 });

    if (isApprovedTab) {
      pendingApprovedColumns.push({ key: "tongDoanhThu", width: 100 });
    }
    const totalColumns = pendingApprovedColumns.length + 1;

    const paHeaderStyle = (columnKey, width) => ({
      width: `${width}px`,
      paddingTop: "2px",
      paddingBottom: "2px",
      paddingLeft: columnKey === "stt" ? "8px" : undefined,
      paddingRight: columnKey === "stt" ? "8px" : undefined,
      lineHeight: 1.05,
      ...getPinnedStyle({
        tableKey,
        columnKey,
        orderedColumns: pendingApprovedColumns,
        backgroundColor: "#1e3a8a",
        zIndex: 40
      })
    });

    const paCellPinStyle = (columnKey, rowBg, zIndex = 12) =>
      getPinnedStyle({
        tableKey,
        columnKey,
        orderedColumns: pendingApprovedColumns,
        backgroundColor: rowBg,
        zIndex
      });
    
    // Check permission to approve B2B
    const canApproveB2B = hasB2BApprovePermission(currentUser);

    return (
      <>
        {activeTab === "approved" && (
          <div className="d-flex justify-content-end mb-2 gap-2" style={{ height: 40, marginRight: 10 }}>
            {!canApproveB2B ? (
              <div className="alert alert-warning alert-sm mb-0 d-flex align-items-center gap-2" style={{ fontSize: "12px", padding: "8px 12px" }}>
                <span>⚠️ Bạn không có quyền đăng ký doanh nghiệp</span>
              </div>
            ) : (
              <button
                className="btn btn-primary btn-sm d-flex align-items-center gap-2 shadow-sm"
                onClick={() => setShowRegisterB2BModal(true)}
                style={{ fontSize: "13px", fontWeight: "600" }}
              >
                <Plus size={16} />
                Đăng ký doanh nghiệp
              </button>
            )}
          </div>
        )}
        <div className="mb-2 text-muted" style={{ fontSize: "12px" }}>
          Bấm biểu tượng ghim ở tiêu đề để cố định cột. Có thể ghim nhiều cột cùng lúc.
        </div>
        <div className="table-responsive shadow-sm rounded" style={{ overflowX: "auto", overflowY: "visible" }}>
        <table
          className="table table-bordered table-sm mb-0 align-middle"
          style={{ fontSize: "12px", tableLayout: "fixed", width: "100%", borderCollapse: "separate", borderSpacing: 0 }}
        >
          <thead
            className="text-white text-center align-middle"
            style={{ backgroundColor: "#1e3a8a", fontSize: "12px" }}
          >
            <tr>
              <th style={paHeaderStyle("stt", 52)}><div className="d-flex align-items-center justify-content-center gap-1" style={{ padding: "0 8px" }}><span>{t.stt}</span>{renderPinButton(tableKey, "stt")}</div></th>
              <th style={paHeaderStyle("tenDN", 160)}><div className="d-flex align-items-center justify-content-center gap-1"><span>{t.tenDN}</span>{renderPinButton(tableKey, "tenDN")}</div></th>
              <th style={paHeaderStyle("soDKKD", 90)}><div className="d-flex align-items-center justify-content-center gap-1"><span>{t.soDKKD}</span>{renderPinButton(tableKey, "soDKKD")}</div></th>
              <th style={paHeaderStyle("nguoiDaiDien", 110)}><div className="d-flex align-items-center justify-content-center gap-1"><span>{t.nguoiDaiDien}</span>{renderPinButton(tableKey, "nguoiDaiDien")}</div></th>

              {activeTab === "pending" && (
                <>
                  <th style={paHeaderStyle("dichVu", 100)}><div className="d-flex align-items-center justify-content-center gap-1"><span>{t.dichVu}</span>{renderPinButton(tableKey, "dichVu")}</div></th>
                  <th style={paHeaderStyle("giayPhep", 70)}><div className="d-flex align-items-center justify-content-center gap-1"><span>{t.giayPhep}</span>{renderPinButton(tableKey, "giayPhep")}</div></th>
                </>
              )}

              {isApprovedTab && (
                <>
                  <th style={paHeaderStyle("soDienThoai", 110)}><div className="d-flex align-items-center justify-content-center gap-1"><span>{t.soDienThoai}</span>{renderPinButton(tableKey, "soDienThoai")}</div></th>
                  <th style={paHeaderStyle("email", 170)}><div className="d-flex align-items-center justify-content-center gap-1"><span>{t.email}</span>{renderPinButton(tableKey, "email")}</div></th>
                  <th style={paHeaderStyle("nganhNghe", 120)}><div className="d-flex align-items-center justify-content-center gap-1"><span>{t.nganhNgheChinh}</span>{renderPinButton(tableKey, "nganhNghe")}</div></th>
                  <th style={paHeaderStyle("diaChi", 150)}><div className="d-flex align-items-center justify-content-center gap-1"><span>{t.diaChi}</span>{renderPinButton(tableKey, "diaChi")}</div></th>
                </>
              )}

              <th style={paHeaderStyle("ngayDangKy", 90)}><div className="d-flex align-items-center justify-content-center gap-1"><span>{t.ngayDangKy}</span>{renderPinButton(tableKey, "ngayDangKy")}</div></th>
              {isApprovedTab && (
                <th style={paHeaderStyle("tongDoanhThu", 100)}><div className="d-flex align-items-center justify-content-center gap-1"><span>{t.tongDoanhThuTichLuy}</span>{renderPinButton(tableKey, "tongDoanhThu")}</div></th>
              )}
              <th
                style={{
                  width: "90px",
                  minWidth: "90px",
                  maxWidth: "90px",
                  paddingTop: "2px",
                  paddingBottom: "2px",
                  position: "sticky",
                  right: 0,
                  zIndex: 30,
                  backgroundColor: "#1e3a8a",
                  boxShadow: "-2px 0 6px rgba(0,0,0,0.12)",
                  borderLeft: "1px solid #2e4fa3"
                }}
              >
                {t.hanhDong}
              </th>
            </tr>
          </thead>

          <tbody>
            {(activeTab === "pending" ? pendingData : approvedData).map(
              (item, idx) => {
                const globalIndex = idx + 1 + (currentPage[activeTab] - 1) * PAGE_SIZE;
                const isEditing = editingRows[activeTab][item.ID];
                const isExpanded = expandedRowId === item.ID;

                const rowStyle = isEditing ? { backgroundColor: "#fff9c4" } : {};
                const rowBg = isEditing ? "#fff9c4" : "#fff";

                // Style cho input và view mode
                const viewStyle = { fontSize: "12px", height: "30px", lineHeight: "30px", textAlign: "center", padding: "0 4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
                const inputStyle = { width: "100%", height: "100%", border: "none", outline: "none", textAlign: "center", background: "transparent", fontSize: "12px" };

                return (
                  <React.Fragment key={item.ID}>
                    {/* DÒNG DỮ LIỆU CHÍNH */}
                    <tr style={{ height: "30px", ...rowStyle }} className={`bg-white hover:bg-gray-50 ${isExpanded ? "border-bottom-0" : ""}`}>
                      <td className="text-center border" style={paCellPinStyle("stt", rowBg, 14)}>{globalIndex}</td>
                      <td className="border" style={paCellPinStyle("tenDN", rowBg, 13)}>{isEditing ? <input style={inputStyle} value={item.TenDoanhNghiep} onChange={(e) => handleCellEdit("TenDoanhNghiep", item, e)} /> : <div style={viewStyle} title={item.TenDoanhNghiep}>{item.TenDoanhNghiep}</div>}</td>
                      <td className="border" style={paCellPinStyle("soDKKD", rowBg, 13)}>{isEditing ? <input style={inputStyle} value={item.SoDKKD} onChange={(e) => handleCellEdit("SoDKKD", item, e)} /> : <div style={viewStyle}>{item.SoDKKD}</div>}</td>
                      <td className="border" style={paCellPinStyle("nguoiDaiDien", rowBg, 13)}>{isEditing ? <input style={inputStyle} value={item.NguoiDaiDien} onChange={(e) => handleCellEdit("NguoiDaiDien", item, e)} /> : <div style={viewStyle}>{item.NguoiDaiDien}</div>}</td>

                      {/* Cột riêng cho Pending */}
                      {activeTab === "pending" && (
                        <>
                          <td className="border" style={paCellPinStyle("dichVu", rowBg, 12)}>
                            {isEditing ? (
                              <input
                                style={inputStyle}
                                value={item.DichVu || ""}
                                onChange={(e) => handlePendingChange(item.ID, "DichVu", e.target.value)}
                              />
                            ) : (
                              <div
                                style={{
                                  ...viewStyle,
                                  whiteSpace: "normal",
                                  overflow: "visible",
                                  textOverflow: "clip",
                                  height: "auto",
                                  lineHeight: "1.4",
                                  padding: "4px"
                                }}
                              >
                                {item.DichVu || ""}
                              </div>
                            )}
                          </td>

                          {/* [SỬA 2] Cột Giấy Phép: Nút Mắt để mở rộng */}
                          <td className="border text-center p-0 align-middle" style={paCellPinStyle("giayPhep", rowBg, 12)}>
                            {item.PdfPath ? (
                              <div className="d-flex justify-content-center align-items-center gap-2 h-100">
                                {/* Nút xem nhanh (Expand) */}
                                <button
                                  className="btn btn-sm p-0 border-0"
                                  onClick={() => toggleExpand(item.ID)}
                                  title={isExpanded ? "Đóng xem trước" : "Xem nhanh giấy phép"}
                                  style={{ color: isExpanded ? "#ef4444" : "#2563eb", display: "flex", alignItems: "center", cursor: "pointer" }}
                                >
                                  {isExpanded ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>

                                {/* Link mở tab mới (nếu cần) */}
                                <a href={item.PdfPath} target="_blank" rel="noreferrer" className="text-secondary" title="Mở trong tab mới">
                                  <FileText size={16} />
                                </a>
                              </div>
                            ) : (
                              <span style={{ fontSize: "11px", color: "#999" }}>—</span>
                            )}
                          </td>
                        </>
                      )}

                      {/* Cột riêng cho Approved */}
                      {isApprovedTab && (
                        <>
                          <td className="border" style={paCellPinStyle("soDienThoai", rowBg, 12)}>
                            <div style={viewStyle} title={formatCompanyPhoneNumber(item)}>{formatCompanyPhoneNumber(item)}</div>
                          </td>
                          <td className="border" style={paCellPinStyle("email", rowBg, 12)}>
                            <div style={viewStyle} title={item.Email || ""}>{item.Email || ""}</div>
                          </td>
                          <td className="border" style={paCellPinStyle("nganhNghe", rowBg, 12)}>{isEditing ? <input style={inputStyle} value={item.NganhNgheChinh || ""} onChange={(e) => handleApprovedChange(item.ID, "NganhNgheChinh", e.target.value)} /> : <div style={viewStyle} title={item.NganhNgheChinh || ""}>{item.NganhNgheChinh || ""}</div>}</td>
                          <td className="border" style={paCellPinStyle("diaChi", rowBg, 12)}>{isEditing ? <input style={inputStyle} value={item.DiaChi || ""} onChange={(e) => handleApprovedChange(item.ID, "DiaChi", e.target.value)} /> : <div style={viewStyle} title={item.DiaChi || ""}>{item.DiaChi || ""}</div>}</td>
                        </>
                      )}

                      <td className="text-center border" style={paCellPinStyle("ngayDangKy", rowBg, 12)}>{formatDateTime(item.NgayTao || item.NgayDangKyB2B)}</td>
                      {isApprovedTab && <td className="text-center border fw-bold text-primary" style={paCellPinStyle("tongDoanhThu", rowBg, 12)}>{formatNumber(calculateCompanyTotalRevenue(item.ID))}</td>}

                      {/* Cột Hành Động */}
                      <td
                        className="text-center border"
                        style={{
                          width: "90px",
                          minWidth: "90px",
                          maxWidth: "90px",
                          position: "sticky",
                          right: 0,
                          zIndex: 20,
                          backgroundColor: isEditing ? "#fff9c4" : "#fff",
                          boxShadow: "-2px 0 6px rgba(0,0,0,0.08)",
                          borderLeft: "1px solid #dee2e6"
                        }}
                      >
                        <div className="d-flex gap-1 justify-content-center">
                          {isEditing ? (
                            <>
                              <button className="btn btn-sm p-1" style={{ backgroundColor: "#2563eb", color: "#fff" }} onClick={() => saveEditing(item, activeTab)}><Save size={14} /></button>
                              <button className="btn btn-sm p-1" style={{ backgroundColor: "#6b7280", color: "#fff" }} onClick={() => cancelEditing(activeTab, item.ID)}><XCircle size={14} /></button>
                            </>
                          ) : (
                            <>
                              <button
                                className="btn btn-sm p-1"
                                style={{ backgroundColor: "#f59e0b", color: "#fff" }}
                                onClick={() =>
                                  activeTab === "approved"
                                    ? openEditApprovedCompanyModal(item)
                                    : startEditing(activeTab, item.ID)
                                }
                              >
                                <Edit size={14} />
                              </button>
                              {activeTab === "pending" ? (
                                <>
                                  <button className="btn btn-sm p-1" style={{ backgroundColor: "#22c55e", color: "#fff" }} onClick={() => approve(item.ID)}><Check size={14} /></button>
                                  <button className="btn btn-sm p-1" style={{ backgroundColor: "#ef4444", color: "#fff" }} onClick={() => reject(item)}><XCircle size={14} /></button>
                                </>
                              ) : (
                                <button className="btn btn-sm p-1" style={{ backgroundColor: "#ef4444", color: "#fff" }} onClick={() => deleteRow(item.ID)}><Trash2 size={14} /></button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* [SỬA 3] DÒNG MỞ RỘNG (EXPAND ROW) HIỂN THỊ PDF */}
                    {activeTab === "pending" && isExpanded && item.PdfPath && (
                      <tr className="bg-white">
                        <td colSpan={totalColumns} className="border p-0">
                          <div className="p-3 bg-light border-bottom position-relative">
                            {/* Nút đóng X ở góc */}
                            <button
                              onClick={() => toggleExpand(item.ID)}
                              className="position-absolute top-0 end-0 m-2 btn btn-sm btn-light border"
                              style={{ zIndex: 10 }}
                            >
                              <X size={16} /> Đóng
                            </button>

                            <div className="d-flex flex-column align-items-center">
                              <div className="mb-2 fw-bold text-primary">
                                Giấy phép ĐKKD: {item.TenDoanhNghiep}
                              </div>
                              <div style={{ width: "100%", height: "600px", border: "1px solid #ccc", borderRadius: "4px", backgroundColor: "#525659" }}>
                                <iframe
                                  src={`${item.PdfPath}#toolbar=0&navpanes=0&scrollbar=0`}
                                  title="Document Viewer"
                                  width="100%"
                                  height="100%"
                                  style={{ border: "none" }}
                                />
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              }
            )}

            {(activeTab === "pending" ? pendingData : approvedData).length === 0 && (
              <tr><td colSpan={totalColumns} className="text-center py-3 text-muted">Không có dữ liệu</td></tr>
            )}
          </tbody>
        </table>

        <Pagination
          current={currentPage[activeTab]}
          total={activeTab === "pending" ? pendingTotal : approvedTotal}
          pageSize={PAGE_SIZE}
          currentLanguage={currentLanguage}
          onChange={(page) => handlePageChange(activeTab, page)}
        />
        </div>
      </>
    );
  };


  return (
    <div className="flex">
      <div className="fixed left-0 top-0 h-full z-40"><Sidebar collapsed={!showSidebar} user={currentUser} /></div>
      <div className="flex-1 transition-all duration-300" style={{ paddingLeft: showSidebar ? 260 : 80, marginTop: 70 }}>
        <Header currentUser={currentUser} onToggleSidebar={() => setShowSidebar(!showSidebar)} showSidebar={showSidebar} onOpenEditModal={() => setShowEditModal(true)} hasNewRequest={hasNewRequest} onBellClick={() => { setShowNotification(!showNotification); setHasNewRequest(false); }} currentLanguage={currentLanguage} onLanguageChange={setCurrentLanguage} />
        <NotificationPanel showNotification={showNotification} setShowNotification={setShowNotification} notifications={notifications} currentLanguage={currentLanguage} />
        {showEditModal && <EditProfileModal currentUser={currentUser} onUpdate={u => setCurrentUser(u)} onClose={() => setShowEditModal(false)} currentLanguage={currentLanguage} />}
        <div className="d-flex border-bottom mb-3 gap-4 mt-3 px-4">
          {["pending", "approved", "rejected", "services"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-2 border-0 bg-transparent fw-bold ${activeTab === tab ? "text-primary border-bottom border-primary border-2" : "text-muted"}`}>
              {tab === "pending" ? t.pendingTab : tab === "approved" ? t.approvedTab : tab === "rejected" ? t.rejectedTab : t.servicesTab}
            </button>
          ))}
        </div>
        <div className="px-4 pb-5">{renderTabContent()}</div>
      </div>

      {showEditCompanyModal && editingApprovedCompany && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{ backgroundColor: "rgba(0,0,0,0.45)", zIndex: 1060 }}
        >
          <div
            className="bg-white rounded-4 p-4 shadow"
            style={{ width: "680px", maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto" }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0 fw-bold">Sửa doanh nghiệp đã duyệt</h5>
              <button
                type="button"
                className="btn btn-sm btn-light border"
                onClick={closeEditApprovedCompanyModal}
              >
                <X size={16} />
              </button>
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Tên doanh nghiệp</label>
                <input
                  type="text"
                  name="TenDoanhNghiep"
                  className="form-control"
                  value={editCompanyForm.TenDoanhNghiep}
                  onChange={handleEditCompanyFormChange}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Số ĐKKD</label>
                <input
                  type="text"
                  name="SoDKKD"
                  className="form-control"
                  value={editCompanyForm.SoDKKD}
                  onChange={handleEditCompanyFormChange}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Người đại diện pháp luật</label>
                <input
                  type="text"
                  name="NguoiDaiDien"
                  className="form-control"
                  value={editCompanyForm.NguoiDaiDien}
                  onChange={handleEditCompanyFormChange}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Ngành nghề chính</label>
                <input
                  type="text"
                  name="NganhNgheChinh"
                  className="form-control"
                  value={editCompanyForm.NganhNgheChinh}
                  onChange={handleEditCompanyFormChange}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Số điện thoại</label>
                <div className="input-group">
                  <select
                    name="MaVung"
                    className="form-select"
                    style={{ maxWidth: "96px" }}
                    value={editCompanyForm.MaVung || "+82"}
                    onChange={handleEditCompanyFormChange}
                  >
                    {!(["+82", "+24"].includes(editCompanyForm.MaVung)) && editCompanyForm.MaVung ? (
                      <option value={editCompanyForm.MaVung}>{editCompanyForm.MaVung}</option>
                    ) : null}
                    <option value="+82">+82</option>
                    <option value="+24">+24</option>
                  </select>
                  <input
                    type="text"
                    name="SoDienThoai"
                    className="form-control"
                    value={editCompanyForm.SoDienThoai}
                    onChange={handleEditCompanyFormChange}
                    placeholder="Nhập số điện thoại"
                  />
                </div>
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Email</label>
                <input
                  type="email"
                  name="Email"
                  className="form-control"
                  value={editCompanyForm.Email}
                  onChange={handleEditCompanyFormChange}
                />
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold">Địa chỉ</label>
                <textarea
                  name="DiaChi"
                  className="form-control"
                  rows={3}
                  value={editCompanyForm.DiaChi}
                  onChange={handleEditCompanyFormChange}
                />
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={closeEditApprovedCompanyModal}
                disabled={loading}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={submitEditApprovedCompany}
                disabled={loading}
              >
                {loading ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {approveModalOpen && selectedService && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1050, backdropFilter: "blur(2px)" }}>
          <div
            className="bg-white p-4 scrollbar-hide position-relative"
            style={{
              width: "600px",
              maxWidth: "90%",
              maxHeight: "100vh",
              overflowY: "auto",
              borderRadius: "20px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
            }}
          >
            {/* Nút đóng */}
            <button
              onClick={() => setApproveModalOpen(false)}
              className="position-absolute d-flex align-items-center justify-content-center border-0 bg-light rounded-circle text-muted hover-text-dark transition-all"
              style={{
                top: "15px",
                right: "15px",
                width: "32px",
                height: "32px",
                cursor: "pointer",
                zIndex: 10
              }}
              title="Đóng"
            >
              <X size={20} />
            </button>

            {/* Header Modal */}
            <div className="text-center mb-4 mt-2">
              <h3 className="fw-bold m-0" style={{ color: "#333", fontSize: "20px" }}>
                Cập nhật dịch vụ (B2B)
              </h3>
              <p className="text-muted small mt-1 mb-0">Chỉnh sửa thông tin dịch vụ</p>
            </div>

            <div className="row g-3 px-2">
              {/* Custom Style cho Input */}
              {(() => {
                const inputStyle = {
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "2px solid #E5E7EB",
                  fontSize: "13px",
                  color: "#374151",
                  backgroundColor: "#F9FAFB",
                  outline: "none",
                  transition: "border-color 0.2s",
                };

                const arrowSvg = `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3e%3cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3e%3c/svg%3e")`;

                const selectStyle = {
                  ...inputStyle,
                  appearance: "none",
                  WebkitAppearance: "none",
                  MozAppearance: "none",
                  backgroundImage: arrowSvg,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 12px center",
                  backgroundSize: "16px",
                  paddingRight: "35px",
                  cursor: "pointer"
                };

                const labelStyle = {
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "#1F2937",
                  marginBottom: "4px",
                  display: "block",
                };

                const helperTextStyle = {
                  fontSize: "10px",
                  color: "#3B82F6",
                  marginTop: "3px",
                  fontStyle: "normal",
                };

                const company = approvedList.find(c => String(c.ID) === String(selectedService.companyId));
                const CUSTOM_B2B_SERVICE_TYPE_VALUE = "__ADD_CUSTOM_B2B_SERVICE_TYPE__";


                let availableServices = [];
                if (company) {

                  if (company.DichVu) availableServices.push(...parseServices(company.DichVu));
                  if (company.DichVuKhac) availableServices.push(...parseServices(company.DichVuKhac));
                  availableServices = [...new Set(availableServices.map(mapToUnifiedB2BServiceType))].filter(Boolean);
                }
                const currentServiceType = mapToUnifiedB2BServiceType(selectedService.serviceType || selectedService.LoaiDichVu || "");
                const hasCurrentServiceTypeInList = availableServices.some(
                  (svc) => String(svc || "").trim().toLowerCase() === currentServiceType.toLowerCase()
                );
                const isCustomServiceTypeMode =
                  Boolean(selectedService._customServiceTypeMode) ||
                  (Boolean(currentServiceType) && !hasCurrentServiceTypeInList);
                const serviceTypeSelectValue = isCustomServiceTypeMode
                  ? CUSTOM_B2B_SERVICE_TYPE_VALUE
                  : currentServiceType;
                const serviceTypeOptions = [
                  ...availableServices.map((svc) => ({ value: svc, label: svc })),
                  { value: CUSTOM_B2B_SERVICE_TYPE_VALUE, label: "Thêm loại dịch vụ" },
                ];
                // Component ToggleButton
                const ToggleButton = ({ name, value, onChange }) => (
                  <div className="d-flex gap-2 w-100">
                    {["Yes", "No"].map((option) => (
                      <label
                        key={option}
                        className="flex-grow-1 cursor-pointer"
                        style={{ position: "relative" }}
                      >
                        <input
                          type="radio"
                          name={name}
                          value={option}
                          checked={value === option}
                          onChange={onChange}
                          className="d-none"
                        />
                        <div
                          className="text-center py-2"
                          style={{
                            ...inputStyle,
                            backgroundColor: value === option ? "#F3F4F6" : "#fff",
                            borderColor: value === option ? "#9CA3AF" : "#E5E7EB",
                            color: value === option ? "#000" : "#9CA3AF",
                            fontWeight: value === option ? "bold" : "normal",
                            cursor: "pointer",
                            padding: "8px 0",
                          }}
                        >
                          {option}
                        </div>
                      </label>
                    ))}
                  </div>
                );

                // Component ModernSelect
                // Cập nhật Component ModernSelect để hỗ trợ Footer (nút cộng)
                const ModernSelect = ({ name, value, options, onChange, placeholder, disabled, twoColumns = false, footer, onFooterClick }) => {
                  const [isOpen, setIsOpen] = React.useState(false);
                  const containerRef = React.useRef(null);

                  const selectedOption = options.find(opt => String(opt.value) === String(value));
                  const displayLabel = selectedOption ? selectedOption.label : placeholder;

                  React.useEffect(() => {
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
                      {/* Box hiển thị chính */}
                      <div
                        onClick={() => !disabled && setIsOpen(!isOpen)}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: "10px",
                          border: "2px solid #E5E7EB",
                          fontSize: "13px",
                          color: "#374151",
                          backgroundColor: disabled ? "#F3F4F6" : "#F9FAFB",
                          outline: "none",
                          transition: "border-color 0.2s",
                          cursor: disabled ? "not-allowed" : "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          userSelect: "none",
                          height: "45px"
                        }}
                      >
                        <span style={{ color: value ? "#374151" : "#9CA3AF" }}>
                          {displayLabel}
                        </span>
                        <ChevronDown size={16} color="#6B7280" />
                      </div>

                      {/* Dropdown Menu */}
                      {isOpen && !disabled && (
                        <div
                          className="position-absolute w-100 bg-white shadow-sm rounded-bottom border"
                          style={{
                            top: "48px",
                            left: 0,
                            zIndex: 1000,
                            maxHeight: "300px", // Tăng chiều cao để chứa thêm footer
                            overflowY: "auto",
                            borderRadius: "8px",
                            padding: "8px 0", // Padding dọc 0 để footer dính sát nếu cần
                            display: "flex",
                            flexDirection: "column"
                          }}
                        >
                          {/* Vùng danh sách Options */}
                          <div style={{
                            display: twoColumns ? "grid" : "block",
                            gridTemplateColumns: twoColumns ? "1fr 1fr" : "none",
                            gap: twoColumns ? "8px" : "0",
                            padding: "0 8px" // Padding ngang cho nội dung
                          }}>
                            {options.length > 0 ? (
                              options.map((opt, idx) => (
                                <div
                                  key={idx}
                                  onClick={() => handleSelect(opt.value)}
                                  className={`px-3 py-2 transition-all ${twoColumns ? 'rounded' : ''}`}
                                  style={{
                                    cursor: "pointer",
                                    fontSize: "12px",
                                    color: String(opt.value) === String(value) ? "#2563eb" : "#374151",
                                    backgroundColor: String(opt.value) === String(value) ? "#EFF6FF" : (twoColumns ? "#F9FAFB" : "transparent"),
                                    borderBottom: !twoColumns && idx !== options.length - 1 ? "1px solid #f3f4f6" : "none",
                                    border: twoColumns ? "1px solid #E5E7EB" : undefined,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis"
                                  }}
                                  title={opt.label}
                                  onMouseEnter={(e) => {
                                    if (String(opt.value) !== String(value)) e.target.style.backgroundColor = twoColumns ? "#E5E7EB" : "#F3F4F6";
                                  }}
                                  onMouseLeave={(e) => {
                                    if (String(opt.value) !== String(value)) e.target.style.backgroundColor = twoColumns ? "#F9FAFB" : "transparent";
                                  }}
                                >
                                  {opt.label}
                                </div>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-muted small text-center">
                                Không có dữ liệu
                              </div>
                            )}
                          </div>

                          {/* Vùng Footer (Nút cộng) */}
                          {footer && (
                            <div
                              className="border-top mt-2 pt-1"
                              style={{ backgroundColor: "#fdfdfd" }}
                            >
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onFooterClick) onFooterClick();
                                  setIsOpen(false); // Đóng dropdown sau khi chọn
                                }}
                                className="px-3 py-2 d-flex align-items-center gap-2 text-primary fw-bold"
                                style={{ cursor: "pointer", fontSize: "12px" }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#EFF6FF"}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                              >
                                {footer}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                };

                // Hàm xử lý thay đổi
                const handleApproveModalChange = (e) => {
                  const { name, value } = e.target;

                  if (name === "DoanhThu" || name === "Vi") {
                    const rawValue = unformatNumber(value);
                    if (!isNaN(rawValue)) {
                      setSelectedService(prev => ({ ...prev, [name]: formatNumber(rawValue) }));
                    }
                  }
                  else if (name === "LoaiDichVu") {
                    if (value === CUSTOM_B2B_SERVICE_TYPE_VALUE) {
                      setSelectedService((prev) => ({
                        ...prev,
                        _customServiceTypeMode: true,
                      }));
                      return;
                    }
                    setSelectedService(prev => ({
                      ...prev,
                      [name]: value,
                      serviceType: value, // Cập nhật cả serviceType
                      _customServiceTypeMode: false,
                    }));
                  }
                  else if (name === "CustomLoaiDichVu") {
                    setSelectedService((prev) => ({
                      ...prev,
                      LoaiDichVu: value,
                      serviceType: value,
                      _customServiceTypeMode: true,
                    }));
                  }
                  else {
                    setSelectedService(prev => {
                      if (name === "NgayBatDau") {
                        return {
                          ...prev,
                          NgayBatDau: value,
                          startDate: value,
                        };
                      }

                      if (name === "NgayHen") {
                        return {
                          ...prev,
                          NgayHen: value,
                          appointmentDate: value,
                          endDate: value,
                        };
                      }

                      if (name === "NgayHoanThanh") {
                        return {
                          ...prev,
                          NgayHoanThanh: value,
                          endDate: value,
                        };
                      }

                      return { ...prev, [name]: value };
                    });
                  }
                };

                return (
                  <>
                    {/* Tên Doanh Nghiệp (readonly) */}
                    <div className="col-md-6">
                      <label style={labelStyle}>
                        Tên doanh nghiệp
                      </label>
                      <input
                        type="text"
                        value={company?.TenDoanhNghiep || "--"}
                        readOnly
                        style={{ ...inputStyle, backgroundColor: "#F3F4F6", color: "#9CA3AF" }}
                      />
                    </div>

                    {/* Số ĐKKD (readonly) */}
                    <div className="col-md-6">
                      <label style={labelStyle}>Số đăng ký kinh doanh</label>
                      <input
                        type="text"
                        value={selectedService.soDKKD || company?.SoDKKD || "--"}
                        readOnly
                        style={{ ...inputStyle, backgroundColor: "#F3F4F6", color: "#9CA3AF" }}
                      />
                    </div>

                    {/* Loại dịch vụ (có thể sửa) */}
                    <div className="col-md-6">
                      <label style={labelStyle}>
                        Loại dịch vụ <span className="text-danger">*</span>
                      </label>
                      <ModernSelect
                        name="LoaiDichVu"
                        value={serviceTypeSelectValue}
                        onChange={handleApproveModalChange}
                        placeholder="-- Chọn loại dịch vụ --"
                        options={serviceTypeOptions}
                      />
                      {isCustomServiceTypeMode ? (
                        <input
                          type="text"
                          name="CustomLoaiDichVu"
                          placeholder="Nhập loại dịch vụ mới"
                          value={selectedService.LoaiDichVu || selectedService.serviceType || ""}
                          onChange={handleApproveModalChange}
                          style={{ ...inputStyle, marginTop: "8px" }}
                        />
                      ) : null}
                    </div>

                    {/* Tên dịch vụ chi tiết (có thể sửa) */}
                    <div className="col-md-6">
                      <label style={labelStyle}>Tên dịch vụ chi tiết <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        name="TenDichVu"
                        placeholder="Cấp lại hộ chiếu..."
                        value={selectedService.serviceName || selectedService.TenDichVu || ""}
                        onChange={handleApproveModalChange}
                        style={inputStyle}
                      />
                    </div>

                    <div className="col-md-12">
                      <label style={labelStyle}>
                        Danh mục <span className="text-danger">*</span>
                      </label>
                      <ModernSelect
                        name="DanhMuc"
                        value={selectedService.DanhMuc}
                        onChange={(e) => setSelectedService(prev => ({ ...prev, DanhMuc: e.target.value }))}
                        placeholder="Chọn danh mục chính"
                        options={getDanhMucOptions(selectedService.serviceType).map(dm => ({ value: dm, label: dm }))}
                        footerAction={{
                          label: showExtras ? "Ẩn dịch vụ bổ sung" : "Thêm dịch vụ bổ sung (+5)",
                          icon: showExtras ? <EyeOff size={14} /> : <Plus size={14} />,
                          onClick: () => setShowExtras(!showExtras)
                        }}
                      />
                      {showExtras && (
                        <div className="mt-2 p-3 bg-light rounded border animate__animated animate__fadeIn">
                          <div style={{ fontSize: "11px", color: "#666", marginBottom: "8px", fontStyle: "italic" }}>
                            * Nhập tên dịch vụ và thông tin tài chính (nếu có).<br />
                            * Nhấn nút <b>(+)</b> màu xanh để thêm tối đa 5 dòng.
                          </div>

                          <div className="d-flex flex-column gap-2">
                            {extraServices.map((service, index) => (
                              <div key={index} className="d-flex align-items-center gap-2" style={{ width: "100%" }}>

                                {/* 1. Tên dịch vụ bổ sung */}
                                <div style={{ flex: 2 }}>
                                  <input
                                    type="text"
                                    placeholder={`Tên dịch vụ phụ ${index + 1}`}
                                    value={service.name}
                                    onChange={(e) => handleChangeExtra(index, "name", e.target.value)}
                                    className="form-control form-control-sm"
                                  />
                                </div>

                                {/* 2. Doanh thu riêng (cho phép nhập tiền) */}
                                <div style={{ flex: 1 }}>
                                  <input
                                    type="text"
                                    placeholder="Doanh thu"
                                    value={service.revenue}
                                    onChange={(e) => handleChangeExtra(index, "revenue", e.target.value)}
                                    className="form-control form-control-sm text-center"
                                  />
                                </div>

                                {/* 3. Mức chiết khấu riêng (%) */}
                                <div style={{ flex: 0.6 }}>
                                  <select
                                    className="form-select form-select-sm text-center"
                                    value={service.discount || ""}
                                    onChange={(e) => handleChangeExtra(index, "discount", e.target.value)}
                                    style={{ fontSize: "12px", padding: "4px 2px", height: "31px" }}
                                  >
                                    <option value="">%</option>
                                    <option value="5">5%</option>
                                    <option value="10">10%</option>
                                    <option value="12">12%</option>
                                    <option value="15">15%</option>
                                    <option value="17">17%</option>
                                    <option value="30">30%</option>
                                  </select>
                                </div>

                                {/* Nút Xóa dòng */}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveRow(index)}
                                  className="btn btn-outline-danger d-flex align-items-center justify-content-center"
                                  style={{
                                    width: "34px",
                                    height: "34px",
                                    padding: 0,
                                    borderRadius: "6px",
                                    flexShrink: 0
                                  }}
                                  title="Xóa dòng này"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            ))}

                            {/* Nút Thêm dòng (Chỉ hiện khi chưa đủ 5 dòng) */}
                            {extraServices.length < 5 && (
                              <button
                                type="button"
                                onClick={handleAddRow}
                                className="btn btn-sm btn-success mt-1 d-flex align-items-center gap-1"
                                style={{ width: "fit-content" }}
                              >
                                <Plus size={14} /> Thêm dòng
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Ngày bắt đầu (có thể sửa) */}
                    <div className="col-md-6">
                      <label style={labelStyle}>Ngày bắt đầu <span className="text-danger">*</span></label>
                      <input
                        type="date"
                        name="NgayBatDau"
                        value={selectedService.NgayBatDau || selectedService.startDate || ""}
                        onChange={handleApproveModalChange}
                        style={inputStyle}
                      />
                    </div>

                    {/* Ngày hoàn thành (có thể sửa) */}
                    <div className="col-md-6">
                      <label style={labelStyle}>Ngày hẹn</label>
                      <input
                        type="date"
                        name="NgayHen"
                        value={selectedService.NgayHen || selectedService.appointmentDate || selectedService.endDate || ""}
                        onChange={handleApproveModalChange}
                        style={inputStyle}
                      />
                      <div style={helperTextStyle}>
                        Ngày hẹn trả kết quả dùng để đồng bộ với mã dịch vụ.
                      </div>
                    </div>

                    {/* Gói dịch vụ (có thể sửa) */}
                    <div className="col-md-6">
                      <label style={labelStyle}>Gói dịch vụ</label>
                      <ToggleButton
                        name="GoiDichVu"
                        value={selectedService.package || "thường"}
                        onChange={handleApproveModalChange}
                      />
                      <ModernSelect
                        name="GoiDichVu"
                        value={selectedService.package || selectedService.GoiDichVu || "thường"}
                        onChange={handleApproveModalChange}
                        placeholder="Chọn gói"
                        options={[
                          { value: "thường", label: "Thường" },
                          { value: "gấp 1", label: "Gấp 1" },
                          { value: "gấp 0", label: "Gấp 0" }
                        ]}
                      />
                      <div style={helperTextStyle}>
                        {selectedService.package === "gấp 1" || selectedService.package === "gấp 0"
                          ? "Thời gian xử lý nhanh hơn"
                          : "Thời gian xử lý tiêu chuẩn"}
                      </div>
                    </div>

                    {/* Yêu cầu xuất hóa đơn (có thể sửa) */}
                    <div className="col-md-6">
                      <label style={labelStyle}>Yêu cầu xuất hóa đơn</label>
                      <ToggleButton
                        name="YeuCauHoaDon"
                        value={selectedService.invoiceYN || "No"}
                        onChange={handleApproveModalChange}
                      />
                      <div style={helperTextStyle}>
                        Hóa đơn sẽ được gửi về email đăng ký.
                      </div>
                    </div>


                    {(currentUser?.is_admin || currentUser?.is_director || currentUser?.is_accountant || currentUser?.perm_approve_b2b) && (
                      <div className="col-12">
                        <div className="d-flex gap-2">

                          {/* 1. Cột Doanh Thu */}
                          <div style={{ flex: 1 }}>
                            <label style={labelStyle}>Doanh thu <span className="text-danger">*</span></label>
                            <input
                              type="text"
                              name="DoanhThu"
                              value={selectedService.DoanhThu || ""}
                              onChange={handleApproveModalChange}
                              placeholder="Tổng tiền"
                              style={{ ...inputStyle, textAlign: "center" }}
                            />
                          </div>

                          {/* 2. Cột Mức Chiết Khấu */}
                          <div style={{ flex: 1 }}>
                            <label style={labelStyle}>Mức chiết khấu</label>
                            <ModernSelect
                              name="MucChietKhau"
                              value={selectedService.MucChietKhau || 0}
                              onChange={handleApproveModalChange}
                              placeholder="%"
                              options={discountOptions}
                            />
                            <div style={helperTextStyle}>% giảm giá</div>
                          </div>

                          {/* 3. Cột Ví */}
                          <div style={{ flex: 1 }}>
                            <label style={labelStyle}>Ví</label>
                            <input
                              type="text"
                              name="Vi"
                              value={selectedService.Vi || ""}
                              onChange={handleApproveModalChange}
                              placeholder="0"
                              style={{ ...inputStyle, textAlign: "center" }}
                            />
                            <div style={helperTextStyle}>Trừ ví (VND)</div>
                          </div>
                        </div>
                      </div>
                    )}


                    {!(currentUser?.is_staff && !currentUser?.is_admin && !currentUser?.is_director && !currentUser?.is_accountant) && (
                      <div className="col-12">
                        <label style={labelStyle}>
                          Chọn người phụ trách <span className="text-danger">*</span>
                        </label>
                        <ModernSelect
                          name="NguoiPhuTrachId"
                          value={selectedService.NguoiPhuTrachId}
                          onChange={handleApproveModalChange}
                          placeholder="Chọn trong danh sách nhân viên"
                          twoColumns={true}
                          options={userList.map(u => ({
                            value: u.id,
                            label: `${u.name} (${u.username})`
                          }))}
                        />
                      </div>
                    )}
                    <div className="col-12">
                      <label style={labelStyle}>Cập nhật trạng thái</label>
                      <input
                        type="text"
                        name="TrangThai"
                        value={selectedService.TrangThai || selectedService.status || ""}
                        onChange={handleApproveModalChange}
                        placeholder="Nhập trạng thái (VD: Đã duyệt, Đang chờ bổ sung...)"
                        style={inputStyle}
                      />
                      <div style={helperTextStyle}>Trạng thái sau khi lưu (Mặc định: Đã duyệt)</div>
                    </div>
                    {/* Ghi chú (có thể sửa) */}
                    <div className="col-12">
                      <label style={labelStyle}>Ghi chú</label>
                      <input
                        type="text"
                        name="GhiChu"
                        placeholder="Nhập ghi chú"
                        value={selectedService.GhiChu || ""}
                        onChange={handleApproveModalChange}
                        style={inputStyle}
                      />
                    </div>

                    {/* Mật khẩu xác nhận */}
                    <div className="col-12">
                      <label style={labelStyle}>Nhập mật khẩu để duyệt <span className="text-danger">*</span></label>
                      <div className="position-relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="******"
                          name="ConfirmPassword"
                          value={selectedService.confirmPassword || ""}
                          onChange={(e) =>
                            setSelectedService(prev => ({
                              ...prev,
                              confirmPassword: e.target.value
                            }))
                          }
                          autoComplete="new-password"
                          style={{ ...inputStyle, paddingRight: "40px" }}
                        />
                        <span
                          className="position-absolute top-50 translate-middle-y end-0 me-3 cursor-pointer"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          style={{ color: "#6B7280" }}
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </span>
                      </div>
                      <div style={helperTextStyle}>Mật khẩu tài khoản admin hiện tại</div>
                    </div>

                    {/* Nút Submit */}
                    <div className="col-12 mt-3 pt-2">
                      <button
                        className="btn w-100 fw-bold shadow-sm"
                        onClick={handleApproveSubmit}
                        disabled={loading}
                        style={{
                          backgroundColor: loading ? "#94a3b8" : "#0ea5e9",
                          color: "white",
                          padding: "12px",
                          borderRadius: "10px",
                          fontSize: "15px",
                          border: "none",
                          boxShadow: "0 4px 6px -1px rgba(14, 165, 233, 0.4)"
                        }}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Đang xử lý...
                          </>
                        ) : (
                          "Duyệt & Cấp mã dịch vụ"
                        )}
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}


      {/* Modal Đăng ký dịch vụ mới (B2B) - Modern */}
      <AddServiceModalB2B
        isOpen={showAddServiceModal}
        onClose={() => { 
          setShowAddServiceModal(false);
          setEditingServiceData(null);
          setServiceModalMode("create");
        }}
        onSave={handleAddServiceModalB2B}
        currentUser={currentUser}
        currentLanguage={currentLanguage}
        companiesList={approvedList}
        b2bServiceMapping={B2B_SERVICE_MAPPING}
        editingService={editingServiceData}
        actionMode={serviceModalMode}
      />
      
      {/* Modal Đăng ký doanh nghiệp */}
      <RegisterB2BModal 
        isOpen={showRegisterB2BModal}
        onClose={() => setShowRegisterB2BModal(false)}
        onSuccess={() => {
          loadData();
        }}
        currentUser={currentUser}
      />
    </div>

  );
}