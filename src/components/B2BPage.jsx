import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import useSocketListener from "./CMSDashboard/hooks/useSocketListener";
import NotificationPanel from "./CMSDashboard/NotificationPanel";
import EditProfileModal from "./EditProfileModal";
import { showToast } from "../utils/toast";
import { Save, Trash2, XCircle, Check, FileText, Edit } from "lucide-react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
const MySwal = withReactContent(Swal);

function Pagination({ current = 1, total = 0, pageSize = 20, onChange, language = "vi" }) {
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
        {language === "vi"
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
          {language === "vi" ? `Trang ${currentPage}/${totalPages}` : `Page ${currentPage}/${totalPages}`}
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

const calculateServiceValues = (revenueBefore, discountRate) => {
  const revenue = parseFloat(revenueBefore) || 0;
  const rate = parseFloat(discountRate) || 0;
  const discountAmount = Math.round((revenue * rate) / 100);
  const revenueAfter = Math.round(revenue - discountAmount);
  return { discountAmount, revenueAfter, totalRevenue: revenueAfter };
};

const API_BASE = "https://onepasscms-backend.onrender.com/api";

export default function B2BPage() {
  const [showSidebar, setShowSidebar] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentLanguage, setCurrentLanguage] = useState(localStorage.getItem("language") || "vi");
  const [loading, setLoading] = useState(false);

  const [pendingList, setPendingList] = useState([]);
  const [approvedList, setApprovedList] = useState([]);
  const [serviceRecords, setServiceRecords] = useState([]);
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

  const [currentPage, setCurrentPage] = useState({
    pending: 1, approved: 1, rejected: 1, services: 1
  });

  const [hasNewRequest, setHasNewRequest] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [editingRows, setEditingRows] = useState({
    pending: {}, approved: {}, services: {}
  });

  const translations = {
    vi: {
      pendingTab: "Danh sách chờ duyệt", approvedTab: "Danh sách đã duyệt", rejectedTab: "Danh sách từ chối", servicesTab: "Danh sách dịch vụ", addServiceBtn: "+ Thêm dịch vụ",
      stt: "STT", tenDN: "Tên Doanh Nghiệp", soDKKD: "Số ĐKKD", nguoiDaiDien: "Người Đại Diện Pháp Luật", ngayDangKy: "Ngày Đăng Ký", tongDoanhThu: "Tổng Doanh Thu", lyDoTuChoi: "Lý do từ chối",
      dichVu: "Dịch Vụ", giayPhep: "Giấy Phép ĐKKD", email: "Email", soDienThoai: "Số Điện Thoai", nganhNgheChinh: "Ngành Nghề Chính", diaChi: "Địa Chỉ",
      chonDN: "Chọn Doanh Nghiệp", loaiDichVu: "Loại Dịch Vụ", tenDichVu: "Tên Dịch Vụ", maDichVu: "Mã Dịch Vụ", ngayBatDau: "Ngày Bắt Đầu", ngayKetThuc: "Ngày Kết Thúc",
      doanhThuTruoc: "Doanh Thu Trước Chiết Khấu", mucChietKhau: "Mức Chiết Khấu", soTienChietKhau: "Số Tiền Chiết Khấu", doanhThuSau: "Doanh Thu Sau Chiết Khấu", tongDoanhThuTichLuy: "Tổng Doanh Thu", hanhDong: "Hành động"
    },
    en: {
      pendingTab: "Pending List", approvedTab: "Approved List", rejectedTab: "Rejected List", servicesTab: "Services List", addServiceBtn: "+ Add Service",
      stt: "No.", tenDN: "Company Name", soDKKD: "Business Reg. No.", nguoiDaiDien: "Legal Representative", email: "Email", soDienThoai: "Phone Number", ngayDangKy: "Registration Date", tongDoanhThu: "Total Revenue", lyDoTuChoi: "Rejection Reason",
      dichVu: "Services", giayPhep: "Business License", nganhNgheChinh: "Main Business Lines", diaChi: "Address",
      chonDN: "Select Company", loaiDichVu: "Service Type", tenDichVu: "Service Name", maDichVu: "Service ID", ngayBatDau: "Start Date", ngayKetThuc: "End Date",
      doanhThuTruoc: "Revenue Before Discount", mucChietKhau: "Discount Rate", soTienChietKhau: "Discount Amount", doanhThuSau: "Revenue After Discount", tongDoanhThuTichLuy: "Total Revenue", hanhDong: "Actions"
    }
  };

  const t = translations[currentLanguage] || translations["vi"];

  useSocketListener({ currentLanguage, setNotifications, setHasNewRequest, setShowNotification });

  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
    loadData();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    if (activeTab === "pending") loadPending(currentPage.pending);
    if (activeTab === "approved") loadApproved(currentPage.approved);
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
        fetch(`${API_BASE}/b2b/pending`),
        fetch(`${API_BASE}/b2b/approved`),
        fetch(`${API_BASE}/b2b/reject`)
      ]);

      const p = await pendingRes.json();
      const a = await approvedRes.json();
      const r = await rejectedRes.json();

      setPendingList((p.data || []).map(item => ({ ...item, rejectionReason: "" })));
      setApprovedList(a.data || []);
      setRejectedList(r.data || []);
      
      loadServices(1); 
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const loadPending = async (page = 1) => {
    const res = await fetch(`${API_BASE}/b2b/pending?page=${page}&limit=20`);
    const json = await res.json();
    if (json.success) { setPendingData(json.data); setPendingTotal(json.total); }
  };

  const loadApproved = async (page = 1) => {
    const res = await fetch(`${API_BASE}/b2b/approved?page=${page}&limit=20`);
    const json = await res.json();
    if (json.success) { setApprovedData(json.data); setApprovedTotal(json.total); }
  };

  const loadRejected = async (page = 1) => {
    const res = await fetch(`${API_BASE}/b2b/reject?page=${page}&limit=20`);
    const json = await res.json();
    if (json.success) { setRejectedData(json.data); setRejectedTotal(json.total); }
  };

  const loadServices = async (page = 1) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/b2b/services?page=${page}&limit=20`);
      const json = await res.json();
      if (json.success) {
        const formattedData = (json.data || []).map((item, index) => ({
          ...item,
          id: item.ID,
          // Quan trọng: Gán uiId để phân biệt
          uiId: item.ID ? `server_${item.ID}` : `temp_${index}_${Date.now()}`,
          companyId: item.DoanhNghiepID,
          serviceType: item.LoaiDichVu,
          serviceName: item.TenDichVu,
          code: item.MaDichVu,
          startDate: item.NgayThucHien?.split("T")[0],
          endDate: item.NgayHoanThanh?.split("T")[0],
          revenueBefore: item.DoanhThuTruocChietKhau,
          discountRate: item.MucChietKhau,
          discountAmount: item.SoTienChietKhau,
          revenueAfter: item.DoanhThuSauChietKhau,
          totalRevenue: item.TongDoanhThuTichLuy,
          isNew: false 
        }));
        setServiceData(formattedData);
        setServiceTotal(json.total);
      } else {
        setServiceData([]);
      }
    } catch (error) {
      console.error("Lỗi load services:", error);
      setServiceData([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateCompanyTotalRevenue = (companyId) => {
    if (!serviceRecords || serviceRecords.length === 0) return 0;
    return serviceRecords
      .filter(r => String(r.companyId || r.DoanhNghiepID) === String(companyId))
      .reduce((sum, r) => {
        const val = r.revenueAfter || r.DoanhThuSauChietKhau;
        if (!val) return sum;
        try {
          const cleanStr = String(val).replace(/\./g, '');
          const num = parseFloat(cleanStr);
          return sum + (isNaN(num) ? 0 : num);
        } catch (e) { return sum; }
      }, 0);
  };

  const startEditing = (tab, idOrUiId) => {
    setEditingRows(prev => ({ ...prev, [tab]: { ...prev[tab], [idOrUiId]: true } }));
  };

  const cancelEditing = (tab, idOrUiId) => {
    setEditingRows(prev => ({ ...prev, [tab]: { ...prev[tab], [idOrUiId]: false } }));
    if (tab === "services") loadServices(currentPage.services); // Reload để hủy thay đổi
  };

  const handlePendingChange = (id, field, value) => {
    setPendingData(prev => prev.map(item => item.ID === id ? { ...item, [field]: value } : item));
  };
  const handleApprovedChange = (id, field, value) => {
    setApprovedData(prev => prev.map(item => item.ID === id ? { ...item, [field]: value } : item));
  };
  const savePendingRow = async (item) => {
    if (!item.TenDoanhNghiep || !item.SoDKKD) return showToast("Thiếu thông tin!", "warning");
    try {
      const res = await fetch(`${API_BASE}/b2b/pending/${item.ID}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          TenDoanhNghiep: item.TenDoanhNghiep, SoDKKD: item.SoDKKD, NguoiDaiDien: item.NguoiDaiDien,
          DichVu: item.DichVu, DichVuKhac: item.DichVuKhac, PdfPath: item.PdfPath
        })
      });
      const json = await res.json();
      if (json.success) {
        showToast("Lưu thành công!", "success");
        setPendingData(prev => prev.map(p => p.ID === item.ID ? { ...p, ...json.data } : p));
        cancelEditing("pending", item.ID);
      } else { showToast(json.message, "error"); }
    } catch (e) { showToast("Lỗi server", "error"); }
  };

  const saveApprovedRow = async (item) => {
    if (!item.TenDoanhNghiep || !item.SoDKKD) return showToast("Thiếu thông tin", "warning");
    try {
      const res = await fetch(`${API_BASE}/b2b/approved/${item.ID}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          TenDoanhNghiep: item.TenDoanhNghiep, SoDKKD: item.SoDKKD,
          NguoiDaiDien: item.NguoiDaiDien, NganhNgheChinh: item.NganhNgheChinh, DiaChi: item.DiaChi
        })
      });
      const json = await res.json();
      if (json.success) {
        showToast("Cập nhật thành công!", "success");
        setServiceRecords(prev => prev.map(svc => svc.companyId === item.ID ? { ...svc, TenDoanhNghiep: item.TenDoanhNghiep } : svc));
        cancelEditing("approved", item.ID);
      } else { showToast(json.message, "error"); }
    } catch (e) { showToast("Lỗi server", "error"); }
  };

  const approve = async (id) => {
    const result = await MySwal.fire({
      title: "Xác nhận", text: "Xác nhận duyệt doanh nghiệp này?", icon: "question", showCancelButton: true, confirmButtonColor: "#22c55e", cancelButtonColor: "#ef4444", confirmButtonText: "Duyệt", cancelButtonText: "Hủy"
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`${API_BASE}/b2b/approve/${id}`, { method: "POST" });
      const json = await res.json();
      if (json.success) { showToast("Duyệt thành công", "success"); loadData(); } else { showToast(json.message, "error"); }
    } catch (e) { showToast("Lỗi server", "error"); }
  };

  const reject = async (item) => {
    if (!item.rejectionReason?.trim()) return showToast("Nhập lý do từ chối!", "warning");
    const result = await MySwal.fire({
      title: "Xác nhận", text: `Từ chối ${item.TenDoanhNghiep}?`, icon: "warning", showCancelButton: true, confirmButtonColor: "#ef4444", cancelButtonColor: "#2563eb", confirmButtonText: "Từ chối", cancelButtonText: "Hủy"
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`${API_BASE}/b2b/pending/${item.ID}/reject`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: item.rejectionReason })
      });
      const json = await res.json();
      if (json.success) {
        showToast("Đã từ chối", "success"); setPendingData(prev => prev.filter(i => i.ID !== item.ID));
      } else { showToast(json.message, "error"); }
    } catch (e) { showToast("Lỗi server", "error"); }
  };

  const deleteRow = async (id) => {
    const result = await MySwal.fire({
      title: "CẢNH BÁO", text: "Xóa doanh nghiệp này sẽ xóa cả dịch vụ liên quan.", icon: "warning", showCancelButton: true, confirmButtonColor: "#ef4444", cancelButtonColor: "#2563eb", confirmButtonText: "Xóa", cancelButtonText: "Hủy"
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`${API_BASE}/b2b/approved/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        showToast("Xóa thành công", "success");
        setApprovedData(prev => prev.filter(item => item.ID !== id));
        setServiceRecords(prev => prev.filter(svc => svc.companyId !== id));
      } else { showToast(json.message, "error"); }
    } catch (e) { showToast("Lỗi server", "error"); }
  };

  const handleRecordChange = (uiId, field, value) => {
    setServiceData(prev => prev.map(record => {
      if (record.uiId !== uiId) return record;
      const updated = { ...record };
      if (field === "revenueBefore") {
        const raw = unformatNumber(value);
        updated.revenueBefore = raw;
        const calc = calculateServiceValues(raw, record.discountRate);
        updated.discountAmount = calc.discountAmount;
        updated.revenueAfter = calc.revenueAfter;
        updated.totalRevenue = calc.totalRevenue;
      } else if (field === "discountRate") {
        updated.discountRate = value;
        const calc = calculateServiceValues(record.revenueBefore, value);
        updated.discountAmount = calc.discountAmount;
        updated.revenueAfter = calc.revenueAfter;
        updated.totalRevenue = calc.totalRevenue;
      } else {
        updated[field] = value;
      }
      return updated;
    }));
  };

  const handleAddNewRow = () => {
    const newId = Date.now();
    const uiId = `new_${newId}`; 
    const newRecord = {
      id: newId, 
      uiId: uiId,
      companyId: "", serviceType: "", serviceName: "", code: "", startDate: "", endDate: "",
      revenueBefore: "", discountRate: "0", discountAmount: "0", revenueAfter: "0", totalRevenue: "0",
      isNew: true,
    };
    setServiceData(prev => [...prev, newRecord]);
    setServiceTotal(prev => prev + 1);
    startEditing("services", uiId);
  };

  const saveServiceRow = async (rec) => {
    if (!rec.companyId) return showToast("Chọn doanh nghiệp!", "warning");
    if (!rec.serviceType) return showToast("Chọn loại dịch vụ!", "warning");

    try {
      const parseNum = (val) => {
        if (!val) return 0;
        if (typeof val === 'number') return val;
        return parseFloat(String(val).replace(/\./g, "")) || 0;
      };

      const revenueBefore = parseNum(rec.revenueBefore);
      const discountRate = parseNum(rec.discountRate);
      
      const payload = {
        DoanhNghiepID: parseInt(rec.companyId),
        LoaiDichVu: rec.serviceType,
        TenDichVu: rec.serviceName,
        MaDichVu: rec.code,
        NgayThucHien: rec.startDate ? rec.startDate : null, 
        NgayHoanThanh: rec.endDate ? rec.endDate : null,
        DoanhThuTruocChietKhau: revenueBefore, 
        DoanhThuTruocCK: revenueBefore, 
        MucChietKhau: discountRate,
        SoTienChietKhau: parseNum(rec.discountAmount),
        DoanhThuSauChietKhau: parseNum(rec.revenueAfter),
        TongDoanhThuTichLuy: parseNum(rec.totalRevenue),
      };

      let url;
      let method;

      if (rec.isNew) {
        url = `${API_BASE}/b2b/services`;
        method = "POST";
      } else {
        url = `${API_BASE}/b2b/services/update/${rec.id}`;
        method = "PUT";
      }

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const json = await res.json();

      if (json.success) {
        showToast("Lưu thành công!", "success");
        cancelEditing("services", rec.uiId);
        loadServices(currentPage.services); 
      } else {
        showToast("Lỗi: " + json.message, "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Lỗi server", "error");
    }
  };

  const deleteServiceRow = async (id, isNew) => {
    if (isNew) {
      setServiceData(prev => prev.filter(r => r.id !== id));
      setServiceTotal(prev => prev - 1);
      return;
    }

    const result = await MySwal.fire({
      title: "Xác nhận", text: "Xóa dịch vụ này?", icon: "warning", showCancelButton: true, confirmButtonColor: "#ef4444", cancelButtonColor: "#2563eb", confirmButtonText: "Xóa", cancelButtonText: "Hủy"
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`${API_BASE}/b2b/services/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        showToast("Xóa thành công", "success");
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
  const safeParse = (val) => {
      if (!val) return 0;
      try { return isNaN(parseFloat(String(val).replace(/\./g, ""))) ? 0 : parseFloat(String(val).replace(/\./g, "")); } catch (e) { return 0; }
  };

  const displayData = [...(serviceData || [])].sort((a, b) => {
    const compA = String(a.companyId || a.DoanhNghiepID || "");
    const compB = String(b.companyId || b.DoanhNghiepID || "");
    if (compA !== "" && compB === "") return -1;
    if (compA === "" && compB !== "") return 1;
    if (compA !== "" && compB !== "") return compA.localeCompare(compB);
    return (a.id || 0) - (b.id || 0);
  });

  return (
    <div>
      <div className="d-flex justify-content-end mb-2" style={{ height: 40, marginRight: 10 }}>
        <button className="btn btn-primary btn-sm" onClick={handleAddNewRow} style={{ fontSize: "12px" }}>{t.addServiceBtn}</button>
      </div>
      {loading ? (
        <div className="text-center py-4"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>
      ) : (
        <>
          <div className="table-responsive shadow-sm rounded overflow-hidden">
            <table className="table table-bordered table-sm mb-0 align-middle" style={{ fontSize: "12px", tableLayout: "auto", borderCollapse: "collapse", border: "1px solid #dee2e6" }}>
              <thead className="text-white text-center align-middle" style={{ backgroundColor: "#1e3a8a", fontSize: "12px" }}>
                <tr>
                  <th className="py-2 border" style={{ width: "35px" }}>{t.stt}</th>
                  <th className="py-2 border" style={{ minWidth: "120px" }}>{t.chonDN}</th>
                  <th className="py-2 border" style={{ width: "140px" }}>{t.loaiDichVu}</th>
                  <th className="py-2 border" style={{ width: "140px" }}>{t.tenDichVu}</th>
                  <th className="py-2 border" style={{ width: "60px" }}>{t.maDichVu}</th>
                  <th className="py-2 border" style={{ width: "85px" }}>{t.ngayBatDau}</th>
                  <th className="py-2 border" style={{ width: "85px" }}>{t.ngayKetThuc}</th>
                  <th className="py-2 border" style={{ width: "100px" }}>{t.doanhThuTruoc}</th>
                  <th className="py-2 border" style={{ width: "60px" }}>{t.mucChietKhau}</th>
                  <th className="py-2 border" style={{ width: "80px" }}>{t.soTienChietKhau}</th>
                  <th className="py-2 border" style={{ width: "100px" }}>{t.doanhThuSau}</th>
                  <th className="py-2 border" style={{ width: "110px" }}>{t.tongDoanhThuTichLuy}</th>
                  <th className="py-2 border" style={{ width: "100px" }}>{t.hanhDong}</th>
                </tr>
              </thead>
              <tbody>
                {displayData && displayData.length > 0 ? (
                  displayData.map((rec, idx) => {
                    const globalIndex = idx + 1 + (currentPage.services - 1) * 20;
                    const currentRowKey = rec.uiId;
                    const isEditing = editingRows.services[currentRowKey];
                    const rowStyle = isEditing ? { backgroundColor: "#fff9c4" } : {};

                    const currentCompanyId = String(rec.companyId || rec.DoanhNghiepID || "");
                    const prevCompanyId = idx > 0 ? String(displayData[idx - 1].companyId || displayData[idx - 1].DoanhNghiepID || "") : null;
                    const nextCompanyId = idx < displayData.length - 1 ? String(displayData[idx + 1].companyId || displayData[idx + 1].DoanhNghiepID || "") : null;
                    
                    const isLastRowOfGroup = currentCompanyId !== nextCompanyId;
                    
                    let shouldRenderTotalCell = false;
                    let rowSpan = 1;
                    let groupTotalRevenue = 0;

                    if (!currentCompanyId || currentCompanyId === "") {
                      shouldRenderTotalCell = true; 
                      rowSpan = 1; 
                      groupTotalRevenue = safeParse(rec.revenueAfter || rec.DoanhThuSauChietKhau);
                    } else {
                      const isFirstOfGroup = idx === 0 || currentCompanyId !== prevCompanyId;
                      if (isFirstOfGroup) {
                        shouldRenderTotalCell = true;
                        groupTotalRevenue = safeParse(rec.revenueAfter || rec.DoanhThuSauChietKhau);
                        for (let i = idx + 1; i < displayData.length; i++) {
                          const nextRec = displayData[i];
                          if (String(nextRec.companyId || nextRec.DoanhNghiepID || "") !== currentCompanyId) break;
                          rowSpan++; 
                          groupTotalRevenue += safeParse(nextRec.revenueAfter || nextRec.DoanhThuSauChietKhau);
                        }
                      }
                    }

                    const selectedCompany = approvedList.find((c) => String(c.ID) === currentCompanyId);
                    let serviceOptions = [];
                    if (selectedCompany) {
                      if (selectedCompany.DichVu) serviceOptions.push(...selectedCompany.DichVu.split(",").map(s => s.trim()));
                      if (selectedCompany.DichVuKhac) serviceOptions.push(...selectedCompany.DichVuKhac.split(",").map(s => s.trim()));
                    }
                    serviceOptions = [...new Set(serviceOptions)].filter(Boolean);

                    return (
                      <tr key={currentRowKey} className="bg-white hover:bg-gray-50" style={{ height: "30px", ...rowStyle }}>
                        <td className="text-center border p-0 align-middle">{globalIndex}</td>
                        <td className="border p-0 align-middle">
                          {isEditing ? (
                            <select className="form-select form-select-sm shadow-none" style={{ ...baseCellStyle, width: "100%", minWidth: "120px" }}
                              value={rec.companyId || ""}
                              onChange={(e) => handleRecordChange(currentRowKey, "companyId", e.target.value)}
                            >
                              <option value="">-- Chọn DN --</option>
                              {approvedList.map((c) => (<option key={c.ID} value={c.ID}>{c.TenDoanhNghiep}</option>))}
                            </select>
                          ) : (
                            <div className="text-center" style={baseCellStyle}>{approvedList.find(c => String(c.ID) === currentCompanyId)?.TenDoanhNghiep || "--"}</div>
                          )}
                        </td>
                        <td className="border p-0 align-middle">
                          {isEditing ? (
                            <select className="form-select form-select-sm shadow-none" style={{ ...baseCellStyle, width: 150 }}
                              value={rec.serviceType || ""}
                              onChange={(e) => handleRecordChange(currentRowKey, "serviceType", e.target.value)}
                              disabled={!currentCompanyId}
                            >
                              <option value="">-- Chọn dịch vụ --</option>
                              {serviceOptions.map((svc, i) => <option key={i} value={svc}>{svc}</option>)}
                            </select>
                          ) : (
                            <div className="text-center" style={baseCellStyle}>{rec.serviceType || "--"}</div>
                          )}
                        </td>
                        <td className="border p-0 align-middle" style={{ width: 160 }}>
                          {isEditing ? (
                            <input type="text" className="form-control form-control-sm shadow-none" style={baseCellStyle}
                              value={rec.serviceName || ""}
                              onChange={(e) => handleRecordChange(currentRowKey, "serviceName", e.target.value)} placeholder="Nhập Tên Dịch Vụ"
                            />
                          ) : (
                            <div className="text-center" style={baseCellStyle}>{rec.serviceName || "--"}</div>
                          )}
                        </td>
                        <td className="border p-0 align-middle">
                          {isEditing ? (
                            <input type="text" className="form-control form-control-sm text-center shadow-none" style={baseCellStyle}
                              value={rec.code || ""} onChange={(e) => handleRecordChange(currentRowKey, "code", e.target.value)}
                            />
                          ) : (
                            <div className="text-center" style={baseCellStyle}>{rec.code || "--"}</div>
                          )}
                        </td>
                        <td className="border p-0 align-middle">
                          {isEditing ? (
                            <input type="date" className="form-control form-control-sm text-center shadow-none" style={{ ...baseCellStyle, padding: "0 1px", fontSize: "12px" }}
                              value={rec.startDate || ""} onChange={(e) => handleRecordChange(currentRowKey, "startDate", e.target.value)}
                            />
                          ) : (
                            <div className="text-center" style={baseCellStyle}>{rec.startDate || "--"}</div>
                          )}
                        </td>
                        <td className="border p-0 align-middle">
                          {isEditing ? (
                            <input type="date" className="form-control form-control-sm text-center shadow-none" style={{ ...baseCellStyle, padding: "0 1px", fontSize: "12px" }}
                              value={rec.endDate || ""} onChange={(e) => handleRecordChange(currentRowKey, "endDate", e.target.value)}
                            />
                          ) : (
                            <div className="text-center" style={baseCellStyle}>{rec.endDate || "--"}</div>
                          )}
                        </td>
                        <td className="border p-0 align-middle">
                          {isEditing ? (
                            <input type="text" className="form-control form-control-sm text-center shadow-none" style={{ ...baseCellStyle, textAlign: "center" }}
                              value={rec.revenueBefore === "" ? "" : formatNumber(rec.revenueBefore)} onChange={(e) => handleRecordChange(currentRowKey, "revenueBefore", e.target.value)}
                            />
                          ) : (
                            <div className="text-center" style={baseCellStyle}>{formatNumber(rec.revenueBefore || "")}</div>
                          )}
                        </td>
                        <td className="border p-0 align-middle">
                          {isEditing ? (
                            <select className="form-select form-select-sm text-center shadow-none" style={{ ...baseCellStyle, padding: "0" }}
                              value={rec.discountRate || ""} onChange={(e) => handleRecordChange(currentRowKey, "discountRate", e.target.value)}
                            >
                              <option value="">%</option><option value="5">5%</option><option value="10">10%</option><option value="15">15%</option><option value="20">20%</option>
                            </select>
                          ) : (
                            <div className="text-center" style={baseCellStyle}>{rec.discountRate ? `${rec.discountRate}%` : "--"}</div>
                          )}
                        </td>
                        <td className="text-center align-middle border px-2 bg-light" style={{ fontSize: "12px", padding: "2px 4px" }}>
                          {formatNumber(rec.discountAmount || "0")}
                        </td>
                        <td className="text-center align-middle fw-bold border px-2 bg-light" style={{ fontSize: "12px", padding: "2px 4px" }}>
                          {formatNumber(rec.revenueAfter || "0")}
                        </td>
                        {shouldRenderTotalCell && (
                        <td
                          rowSpan={rowSpan}
          
                          className="text-center align-middle fw-bold border"
                          style={{
                            fontSize: "12px",
                            padding: "2px 4px",
                            backgroundColor: "#fff",
                            verticalAlign: "middle",
                            position: "relative",
                            zIndex: 1, 
                            backgroundClip: "padding-box",
                            borderColor: "#dee2e6"
                          }}
                        >
                          {formatNumber(groupTotalRevenue)}
                        </td>
                      )}
                        <td className="text-center border p-1 align-middle">
                          <div className="d-flex gap-1 justify-content-center">
                            {isEditing ? (
                              <>
                                <button className="btn btn-sm" style={{ backgroundColor: "#2563eb", color: "#fff", width: 36, height: 36, borderRadius: 6 }} onClick={() => saveServiceRow(rec)}><Save size={17} strokeWidth={2.3} /></button>
                                <button className="btn btn-sm" style={{ backgroundColor: "#6b7280", color: "#fff", width: 36, height: 36, borderRadius: 6 }} onClick={() => cancelEditing("services", currentRowKey)}><XCircle size={17} strokeWidth={2.3} /></button>
                              </>
                            ) : (
                              <>
                                <button className="btn btn-sm" style={{ backgroundColor: "#f59e0b", color: "#fff", width: 36, height: 36, borderRadius: 6 }} onClick={() => startEditing("services", currentRowKey)}><Edit size={17} strokeWidth={2.3} /></button>
                                <button className="btn btn-sm" style={{ backgroundColor: "#ef4444", color: "#fff", width: 36, height: 36, borderRadius: 6 }} onClick={() => deleteServiceRow(rec.id || rec.ID, rec.isNew)}><Trash2 size={17} strokeWidth={2.3} /></button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan="13" className="text-center py-4 text-muted border">Chưa có dữ liệu dịch vụ</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination current={currentPage.services} total={serviceTotal} pageSize={20} onChange={(page) => handlePageChange("services", page)} />
        </>
      )}
    </div>
  );
};
  const renderRejectedTab = () => (
    <div className="table-responsive shadow-sm rounded overflow-hidden">
      <table className="table table-bordered table-sm mb-0 align-middle" style={{ fontSize: '12px', tableLayout: 'auto' }}>
        <thead className="text-white text-center align-middle" style={{ backgroundColor: "#1e3a8a", fontSize: "12px" }}>
          <tr>
            <th className="py-2 border">{t.stt}</th><th className="py-2 border" style={{ minWidth: '150px' }}>{t.tenDN}</th><th className="py-2 border">{t.soDKKD}</th><th className="py-2 border">{t.email}</th><th className="py-2 border">{t.soDienThoai}</th><th className="py-2 border">{t.nguoiDaiDien}</th><th className="py-2 border">{t.nganhNgheChinh}</th><th className="py-2 border" style={{ minWidth: '200px' }}>{t.lyDoTuChoi}</th><th className="py-2 border">{t.ngayDangKy}</th>
          </tr>
        </thead>
        <tbody>
          {rejectedData.map((item, idx) => (
            <tr key={item.ID} className="bg-white hover:bg-gray-50">
              <td className="text-center border align-middle" style={{ height: '30px' }}>{idx + 1 + (currentPage.rejected - 1) * 20}</td>
              <td className="border align-middle"><div className="text-center" style={baseCellStyle}>{item.TenDoanhNghiep || ""}</div></td>
              <td className="border align-middle"><div className="text-center" style={baseCellStyle}>{item.SoDKKD || ""}</div></td>
              <td className="border align-middle"><div className="text-center" style={baseCellStyle}>{item.Email || ""}</div></td>
              <td className="border align-middle"><div className="text-center" style={baseCellStyle}>{item.SoDienThoai || ""}</div></td>
              <td className="border align-middle"><div className="text-center" style={baseCellStyle}>{item.NguoiDaiDien || ""}</div></td>
              <td className="border align-middle"><div className="text-center" style={baseCellStyle}>{item.NganhNgheChinh || ""}</div></td>
              <td className="border align-middle"><div className="text-center" style={baseCellStyle}>{item.LyDoTuChoi || ""}</div></td>
              <td className="text-center border align-middle">{formatDateTimeReject(item.NgayTao)}</td>
            </tr>
          ))}
          {rejectedData.length === 0 && (<tr><td colSpan="9" className="text-center py-3 text-muted">{currentLanguage === "vi" ? "Không có dữ liệu" : "No data"}</td></tr>)}
        </tbody>
      </table>
      <Pagination current={currentPage.rejected} total={rejectedTotal} pageSize={20} onChange={(page) => handlePageChange("rejected", page)} />
    </div>
  );

  const renderPendingApprovedTab = () => (
    <div className="table-responsive shadow-sm rounded overflow-hidden">
      <table className="table table-bordered table-sm mb-0 align-middle" style={{ fontSize: '12px', tableLayout: 'auto' }}>
        <thead className="text-white text-center align-middle" style={{ backgroundColor: "#1e3a8a", fontSize: "12px" }}>
          <tr>
            <th className="py-2 border">{t.stt}</th><th className="py-2 border" style={{ minWidth: '150px' }}>{t.tenDN}</th><th className="py-2 border">{t.soDKKD}</th><th className="py-2 border">{t.nguoiDaiDien}</th>
            {activeTab === "pending" && <><th className="py-2 border" style={{ minWidth: '120px' }}>{t.dichVu}</th><th className="py-2 border" style={{ minWidth: '100px' }}>{t.giayPhep}</th></>}
            {activeTab === "approved" && <><th className="py-2 border" style={{ minWidth: '150px' }}>{t.nganhNgheChinh}</th><th className="py-2 border" style={{ minWidth: '180px' }}>{t.diaChi}</th></>}
            <th className="py-2 border" style={{ minWidth: '110px' }}>{t.ngayDangKy}</th>
            {activeTab === "approved" && <th className="py-2 border" style={{ minWidth: '120px' }}>{t.tongDoanhThuTichLuy}</th>}
            {activeTab === "pending" && <th className="py-2 border" style={{ minWidth: '150px' }}>{t.lyDoTuChoi}</th>}
            <th className="py-2 border" style={{ width: '120px' }}>{t.hanhDong}</th>
          </tr>
        </thead>
        <tbody>
          {(activeTab === "pending" ? pendingData : approvedData).map((item, idx) => {
            const globalIndex = idx + 1 + (currentPage[activeTab] - 1) * 20;
            const isEditing = editingRows[activeTab][item.ID];
            const rowStyle = isEditing ? { backgroundColor: "#fff9c4" } : {};
            return (
              <tr key={item.ID} className="bg-white hover:bg-gray-50" style={{ height: '30px', ...rowStyle }}>
                <td className="text-center border p-0 align-middle">{globalIndex}</td>
                <td className="border p-0 align-middle">{isEditing ? <input type="text" className="form-control form-control-sm text-center shadow-none" style={{...baseCellStyle, textAlign: 'center'}} value={item.TenDoanhNghiep} onChange={(e) => activeTab === "pending" ? handlePendingChange(item.ID, "TenDoanhNghiep", e.target.value) : handleApprovedChange(item.ID, "TenDoanhNghiep", e.target.value)} /> : <div className="text-center" style={baseCellStyle}>{item.TenDoanhNghiep}</div>}</td>
                <td className="border p-0 align-middle">{isEditing ? <input type="text" className="form-control form-control-sm text-center shadow-none" style={{...baseCellStyle, textAlign: 'center'}} value={item.SoDKKD} onChange={(e) => activeTab === "pending" ? handlePendingChange(item.ID, "SoDKKD", e.target.value) : handleApprovedChange(item.ID, "SoDKKD", e.target.value)} /> : <div className="text-center" style={baseCellStyle}>{item.SoDKKD}</div>}</td>
                <td className="border p-0 align-middle">{isEditing ? <input type="text" className="form-control form-control-sm text-center shadow-none" style={{...baseCellStyle, textAlign: 'center'}} value={item.NguoiDaiDien} onChange={(e) => activeTab === "pending" ? handlePendingChange(item.ID, "NguoiDaiDien", e.target.value) : handleApprovedChange(item.ID, "NguoiDaiDien", e.target.value)} /> : <div className="text-center" style={baseCellStyle}>{item.NguoiDaiDien}</div>}</td>
                {activeTab === "pending" && (
                  <>
                    <td className="border p-0 align-middle" style={{ minWidth: '180px' }}>{isEditing ? <input type="text" className="form-control form-control-sm text-center shadow-none" style={{...baseCellStyle, textAlign: 'center'}} value={item.DichVu || ""} onChange={(e) => handlePendingChange(item.ID, "DichVu", e.target.value)} /> : <div className="text-center" style={baseCellStyle}>{item.DichVu || ""}</div>}</td>
                    <td className="border p-0 align-middle text-center">{item.PdfPath ? <a href={item.PdfPath} target="_blank" rel="noreferrer" className="text-primary"><FileText size={18} /></a> : <span className="text-muted" style={{fontSize: '11px'}}>—</span>}</td>
                  </>
                )}
                {activeTab === "approved" && (
                  <>
                    <td className="border p-0 align-middle">{isEditing ? <input type="text" className="form-control form-control-sm text-center shadow-none" style={{...baseCellStyle, textAlign: 'center'}} value={item.NganhNgheChinh || ""} onChange={(e) => handleApprovedChange(item.ID, "NganhNgheChinh", e.target.value)} /> : <div className="text-center" style={baseCellStyle}>{item.NganhNgheChinh || ""}</div>}</td>
                    <td className="border p-0 align-middle">{isEditing ? <input type="text" className="form-control form-control-sm text-center shadow-none" style={{...baseCellStyle, textAlign: 'center'}} value={item.DiaChi || ""} onChange={(e) => handleApprovedChange(item.ID, "DiaChi", e.target.value)} placeholder="Nhập địa chỉ..." /> : <div className="text-center" style={baseCellStyle}>{item.DiaChi || ""}</div>}</td>
                  </>
                )}
                <td className="text-center border align-middle px-2">{formatDateTime(item.NgayTao || item.NgayDangKyB2B)}</td>
                {activeTab === "approved" && <td className="text-center border align-middle fw-bold text-primary px-2">{formatNumber(calculateCompanyTotalRevenue(item.ID))}</td>}
                {activeTab === "pending" && (
                  <td className="border p-0 align-middle">{isEditing ? <input type="text" className="form-control form-control-sm shadow-none" style={{...baseCellStyle, padding: '2px 8px'}} placeholder="Nhập lý do..." value={item.rejectionReason || ""} onChange={(e) => handlePendingChange(item.ID, "rejectionReason", e.target.value)} /> : <div className="text-center" style={baseCellStyle}>{item.rejectionReason || ""}</div>}</td>
                )}
                <td className="text-center border p-1 align-middle">
                  <div className="d-flex gap-1 justify-content-center">
                    {isEditing ? (
                      <><button className="btn btn-sm" style={{ backgroundColor: "#2563eb", color: "#fff", width: 32, height: 32, borderRadius: 6 }} onClick={() => activeTab === "pending" ? savePendingRow(item) : saveApprovedRow(item)}><Save size={16} strokeWidth={2.3} /></button>
                      <button className="btn btn-sm" style={{ backgroundColor: "#6b7280", color: "#fff", width: 32, height: 32, borderRadius: 6 }} onClick={() => cancelEditing(activeTab, item.ID)}><XCircle size={16} strokeWidth={2.3} /></button></>
                    ) : (
                      <><button className="btn btn-sm" style={{ backgroundColor: "#f59e0b", color: "#fff", width: 32, height: 32, borderRadius: 6 }} onClick={() => startEditing(activeTab, item.ID)}><Edit size={16} strokeWidth={2.3} /></button>
                      {activeTab === "pending" ? <><button className="btn btn-sm" style={{ backgroundColor: "#22c55e", color: "#fff", width: 32, height: 32, borderRadius: 6 }} onClick={() => approve(item.ID)}><Check size={16} strokeWidth={2.3} /></button><button className="btn btn-sm" style={{ backgroundColor: "#ef4444", color: "#fff", width: 32, height: 32, borderRadius: 6 }} onClick={() => reject(item)}><XCircle size={16} strokeWidth={2.3} /></button></> : <button className="btn btn-sm" style={{ backgroundColor: "#ef4444", color: "#fff", width: 32, height: 32, borderRadius: 6 }} onClick={() => deleteRow(item.ID)}><Trash2 size={16} strokeWidth={2.3} /></button>}</>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
          {(activeTab === "pending" ? pendingData : approvedData).length === 0 && (<tr><td colSpan={activeTab === "pending" ? 10 : 11} className="text-center py-3 text-muted">Không có dữ liệu</td></tr>)}
        </tbody>
      </table>
      <Pagination current={currentPage[activeTab]} total={activeTab === "pending" ? pendingTotal : approvedTotal} pageSize={20} onChange={(page) => handlePageChange(activeTab, page)} />
    </div>
  );

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
    </div>
  );
}