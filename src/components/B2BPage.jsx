import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import useSocketListener from "./CMSDashboard/hooks/useSocketListener";
import NotificationPanel from "./CMSDashboard/NotificationPanel";
import EditProfileModal from "./EditProfileModal";
import { showToast } from "../utils/toast";
import { Save, Trash2, XCircle, Check, FileText } from "lucide-react";


const formatDateTime = (isoString) => {
  if (!isoString) return "—";
  try {
    const date = new Date(isoString.endsWith("Z") ? isoString : isoString + "Z");
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    }).format(date);
  } catch { return isoString; }
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

  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage] = useState(10);
  const [currentPages, setCurrentPages] = useState({ pending: 1, approved: 1, services: 1 });
  

  const [hasNewRequest, setHasNewRequest] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

const translations = {
  vi: {
    pendingTab: "Danh sách chờ duyệt",
    approvedTab: "Danh sách đã duyệt",
    servicesTab: "Danh sách dịch vụ đã thực hiện",
    addServiceBtn: "+ Thêm dịch vụ",

    // Cột chung
    stt: "STT",
    tenDN: "Tên Doanh Nghiệp",
    soDKKD: "Số ĐKKD",
    nguoiDaiDien: "Người Đại Diện Pháp Luật",
    ngayDangKy: "Ngày Đăng Ký",
    tongDoanhThu: "Tổng Doanh Thu",
    lyDoTuChoi: "Lý do từ chối",

    // Pending
    dichVu: "Dịch Vụ",
    giayPhep: "Giấy Phép ĐKKD",

    // Approved
    nganhNgheChinh: "Ngành Nghề Chính",
    diaChi: "Địa Chỉ",

    // Services
    chonDN: "Chọn Doanh Nghiệp",
    loaiDichVu: "Loại Dịch Vụ",
    tenDichVu: "Tên Dịch Vụ",
    maDichVu: "Mã Dịch Vụ",
    ngayBatDau: "Ngày Bắt Đầu",
    ngayKetThuc: "Ngày Kết Thúc",
    doanhThuTruoc: "Doanh Thu Trước Chiết Khấu",
    mucChietKhau: "Mức Chiết Khấu",
    soTienChietKhau: "Số Tiền Chiết Khấu",
    doanhThuSau: "Doanh Thu Sau Chiết Khấu",
    tongDoanhThuTichLuy: "Tổng Doanh Thu",
    hanhDong: "Hành động",
  },
  en: {
    pendingTab: "Pending List",
    approvedTab: "Approved List",
    servicesTab: "Performed Services",
    addServiceBtn: "+ Add Service",

    // Cột chung
    stt: "No.",
    tenDN: "Company Name",
    soDKKD: "Business Reg. No.",
    nguoiDaiDien: "Legal Representative",
    ngayDangKy: "Registration Date",
    tongDoanhThu: "Total Revenue",
    lyDoTuChoi: "Rejection Reason",

    // Pending
    dichVu: "Services",
    giayPhep: "Business License",

    // Approved
    nganhNgheChinh: "Main Business Lines",
    diaChi: "Address",

    // Services
    chonDN: "Select Company",
    loaiDichVu: "Service Type",
    tenDichVu: "Service Name",
    maDichVu: "Service ID",
    ngayBatDau: "Start Date",
    ngayKetThuc: "End Date",
    doanhThuTruoc: "Revenue Before Discount",
    mucChietKhau: "Discount Rate",
    soTienChietKhau: "Discount Amount",
    doanhThuSau: "Revenue After Discount",
    tongDoanhThuTichLuy: "Total Revenue",
    hanhDong: "Actions",
  }
};


  const t = translations[currentLanguage] || translations["vi"];


  useSocketListener({ currentLanguage, setNotifications, setHasNewRequest, setShowNotification });

  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pendingRes, approvedRes] = await Promise.all([
        fetch(`${API_BASE}/b2b/pending`),
        fetch(`${API_BASE}/b2b/approved`),
      ]);
      const p = await pendingRes.json();
      const a = await approvedRes.json();
      
      const formattedPending = (p.data || []).map(item => ({
          ...item,
          rejectionReason: "" 
      }));

      setPendingList(formattedPending);
      setApprovedList(a.data || []);

      const approvedData = a.data || [];
      if (approvedData.length > 0) {
        const servicesPromises = approvedData.map(async (company) => {
            try {
                const res = await fetch(`${API_BASE}/b2b/services?DoanhNghiepID=${company.ID}`);
                const json = await res.json();
                if (json.success && Array.isArray(json.data)) {
                    return json.data.map(s => ({
                        ...s,
                        companyId: company.ID,
                        TenDoanhNghiep: company.TenDoanhNghiep 
                    }));
                }
                return [];
            } catch (e) { return []; }
        });
        const allServicesArrays = await Promise.all(servicesPromises);
        const flatServices = allServicesArrays.flat();
        const formatted = flatServices.map(r => ({
            id: r.ID, 
            companyId: r.companyId,
            serviceType: r.LoaiDichVu || "",
            serviceName: r.TenDichVu || "",
            code: r.MaDichVu || r.ServiceID || "",
            startDate: r.NgayThucHien?.split("T")[0] || "",
            endDate: r.NgayHoanThanh?.split("T")[0] || "",
            revenueBefore: r.DoanhThuTruocChietKhau?.toString() || "",
            discountRate: r.MucChietKhau?.toString() || "",
            discountAmount: r.SoTienChietKhau?.toString() || "0",
            revenueAfter: r.DoanhThuSauChietKhau?.toString() || "0",
            totalRevenue: r.TongDoanhThuTichLuy?.toString() || "0",
            isNew: false
        }));
        formatted.sort((a, b) => {
            if (a.companyId !== b.companyId) return a.companyId - b.companyId;
            return a.id - b.id;
        });
        setServiceRecords(formatted); 
      } else {
        setServiceRecords([]);
      }
    } catch (err) { showToast("Lỗi tải dữ liệu", "error"); } 
    finally { setLoading(false); }
  };

  const calculateCompanyTotalRevenue = (companyId) => {
    return serviceRecords
      .filter(r => r.companyId === companyId)
      .reduce((sum, r) => sum + (parseFloat(r.revenueAfter) || 0), 0);
  };

  // --- XỬ LÝ TAB PENDING & APPROVED ---

  // 1. Handle input change (Pending)
  const handlePendingChange = (id, field, value) => {
    setPendingList(prev => prev.map(item => 
        item.ID === id ? { ...item, [field]: value } : item
    ));
  };

  // 2. Handle input change (Approved)
  const handleApprovedChange = (id, field, value) => {
    setApprovedList(prev => prev.map(item => 
        item.ID === id ? { ...item, [field]: value } : item
    ));
  };

  // 3. Save Row (Pending)
  const savePendingRow = async (item) => {
      if (!item.TenDoanhNghiep || !item.SoDKKD) {
          return showToast("Tên doanh nghiệp và Số ĐKKD không được để trống!", "warning");
      }
      try {
          const res = await fetch(`${API_BASE}/b2b/pending/${item.ID}`, { 
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                  TenDoanhNghiep: item.TenDoanhNghiep,
                  SoDKKD: item.SoDKKD,
                  NguoiDaiDien: item.NguoiDaiDien,
                  DichVu: item.DichVu,
                  PdfPath: item.PdfPath
              })
          });

          const json = await res.json();

          if (json.success) {
              showToast("Đã lưu thông tin chỉnh sửa!", "success");
              setPendingList(prev => prev.map(p => 
                  p.ID === item.ID ? { ...p, ...json.data } : p
              ));
          } else {
              showToast(json.message || "Lỗi khi lưu", "error");
          }
      } catch (error) {
          console.error(error);
          showToast("Lỗi server khi lưu thông tin", "error");
      }
  };

  // 4. Save Row (Approved)
  const saveApprovedRow = async (item) => {
      if (!item.TenDoanhNghiep || !item.SoDKKD) {
          return showToast("Tên doanh nghiệp và Số ĐKKD không được để trống", "warning");
      }
      try {
          const res = await fetch(`${API_BASE}/b2b/approved/${item.ID}`, { 
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                  TenDoanhNghiep: item.TenDoanhNghiep,
                  SoDKKD: item.SoDKKD,
                  NguoiDaiDien: item.NguoiDaiDien,
                  NganhNgheChinh: item.NganhNgheChinh,
                  DiaChi: item.DiaChi 
              })
          });
          const json = await res.json();
          if (json.success) {
              showToast("Cập nhật thành công!", "success");
              setServiceRecords(prev => prev.map(svc => 
                  svc.companyId === item.ID ? { ...svc, TenDoanhNghiep: item.TenDoanhNghiep } : svc
              ));
          } else {
              showToast(json.message || "Lỗi cập nhật", "error");
          }
      } catch (error) {
          console.error(error);
          showToast("Lỗi server khi lưu", "error");
      }
  };

  const approve = async (id) => {
    if (!window.confirm("Xác nhận duyệt doanh nghiệp này?")) return;
    try {
      const res = await fetch(`${API_BASE}/b2b/approve/${id}`, { method: "POST" }).then(r => r.json());
      if (res.success) {
        showToast("Duyệt thành công", "success");
        loadData();
      } else { showToast(res.message, "error"); }
    } catch (err) { showToast("Lỗi server", "error"); }
  };

  const reject = async (item) => {
    if (!item.rejectionReason || item.rejectionReason.trim() === "") {
        return showToast("Vui lòng nhập lý do từ chối!", "warning");
    }
    if (!window.confirm(`Từ chối doanh nghiệp ${item.TenDoanhNghiep}?`)) return;

    try {
        const res = await fetch(`${API_BASE}/b2b/reject/${item.ID}`, { 
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reason: item.rejectionReason })
        }).then(r => r.json());

        if (res.success) {
            showToast("Đã từ chối doanh nghiệp", "success");
            loadData();
        } else {
            showToast("Chức năng từ chối đang phát triển (API Mock)", "info");
            setPendingList(prev => prev.filter(i => i.ID !== item.ID));
        }
    } catch (err) { showToast("Lỗi server", "error"); }
  };

  const deleteRow = async (id) => {
    if (!window.confirm("CẢNH BÁO: Bạn có chắc chắn muốn xóa doanh nghiệp này?\nTất cả dịch vụ liên quan cũng sẽ bị xóa.")) return;
    try {
      const res = await fetch(`${API_BASE}/b2b/approved/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        showToast("Xóa doanh nghiệp thành công", "success");
        setApprovedList(prev => prev.filter(item => item.ID !== id));
        setServiceRecords(prev => prev.filter(svc => svc.companyId !== id));
      } else { 
        showToast(json.message || "Lỗi xóa", "error"); 
      }
    } catch (error) { 
        console.error(error);
        showToast("Lỗi server khi xóa", "error"); 
    }
  };

  // --- XỬ LÝ TAB SERVICES ---
  const handleRecordChange = (id, field, value) => {
    setServiceRecords(prev => prev.map(record => {
      if (record.id !== id) return record;
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
    setServiceRecords(prev => [
      ...prev,
      {
        id: newId,
        companyId: "", serviceType: "", serviceName: "", code: "", startDate: "", endDate: "",
        revenueBefore: "", discountRate: "0", discountAmount: "0", revenueAfter: "0", totalRevenue: "0",
        isNew: true,
      },
    ]);
  };

  const saveServiceRow = async (rec) => {
    if (!rec.companyId) return showToast("Vui lòng chọn doanh nghiệp!", "warning");
    if (!rec.serviceType) return showToast("Vui lòng chọn loại dịch vụ!", "warning");
    try {
      const payload = {
        DoanhNghiepID: rec.companyId,
        LoaiDichVu: rec.serviceType,
        TenDichVu: rec.serviceName,
        MaDichVu: rec.code,
        NgayThucHien: rec.startDate ? `${rec.startDate}T00:00:00.000Z` : null,
        NgayHoanThanh: rec.endDate ? `${rec.endDate}T00:00:00.000Z` : null,
        DoanhThuTruocChietKhau: parseFloat(rec.revenueBefore) || 0,
        MucChietKhau: parseFloat(rec.discountRate) || 0,
        SoTienChietKhau: parseFloat(rec.discountAmount) || 0,
        DoanhThuSauChietKhau: parseFloat(rec.revenueAfter) || 0,
        TongDoanhThuTichLuy: parseFloat(rec.totalRevenue) || 0,
      };
      let url = `${API_BASE}/b2b/services/${rec.id}`;
      let method = "PUT";
      if (rec.isNew) {
        url = `${API_BASE}/b2b/services`;
        method = "POST";
      }
      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        showToast("Lưu thành công!", "success");
        loadData(); 
      } else { showToast("Lỗi: " + json.message, "error"); }
    } catch (error) { showToast("Lỗi server", "error"); }
  };

  const deleteServiceRow = async (id, isNew) => {
    if (isNew) {
      setServiceRecords(prev => prev.filter(r => r.id !== id));
      return;
    }
    if (!window.confirm("Bạn xóa dịch vụ này?")) return;
    try {
      const res = await fetch(`${API_BASE}/b2b/services/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        showToast("Xóa thành công", "success");
        setServiceRecords(prev => prev.filter(r => r.id !== id));
      } else { showToast("Lỗi xóa", "error"); }
    } catch (error) { showToast("Lỗi server", "error"); }
  };

  const getFilteredList = (list) => {
    if (!list) return [];
    return list.filter(item => Object.values(item).join(" ").toLowerCase().includes(searchTerm.toLowerCase()));
  };
  const getPaginatedList = (list, tabName) => {
    const filtered = getFilteredList(list);
    const startIndex = (currentPages[tabName] - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  };
  const Pagination = ({ totalItems, tabName }) => { 
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const currentPage = currentPages[tabName];
    if (totalPages <= 1) return null;
    return (
      <div className="d-flex justify-content-end py-2">
        <nav>
          <ul className="pagination pagination-sm mb-0">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <li key={p} className={`page-item ${currentPage === p ? "active" : ""}`}>
                <button className="page-link" onClick={() => setCurrentPages(prev => ({ ...prev, [tabName]: p }))}>{p}</button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    );
  };

  // --- STYLE ---
  const baseCellStyle = {
    width: "100%",
    height: "100%",
    border: "none",
    outline: "none",
    backgroundColor: "transparent",
    padding: "2px 4px",
    fontSize: "12px",
    margin: 0,
    boxShadow: "none",
    borderRadius: 0
  };

  const savedSelectStyle = {
    ...baseCellStyle,
    appearance: "none",
    WebkitAppearance: "none",
    MozAppearance: "none",
    cursor: "pointer"
  };

  const newSelectStyle = {
    ...baseCellStyle,
  };

  return (
    <div className="flex">
      <div className="fixed left-0 top-0 h-full z-40">
        <Sidebar collapsed={!showSidebar} user={currentUser} />
      </div>
      <div className="flex-1 transition-all duration-300" style={{ paddingLeft: showSidebar ? 260 : 80, marginTop: 70 }}>
        <Header
          currentUser={currentUser}
          onToggleSidebar={() => setShowSidebar(!showSidebar)}
          showSidebar={showSidebar}
          onOpenEditModal={() => setShowEditModal(true)}
          hasNewRequest={hasNewRequest}
          onBellClick={() => { setShowNotification(!showNotification); setHasNewRequest(false); }}
          currentLanguage={currentLanguage}
          onLanguageChange={setCurrentLanguage}
        />
        
        <NotificationPanel showNotification={showNotification} setShowNotification={setShowNotification} notifications={notifications} currentLanguage={currentLanguage} />
        {showEditModal && <EditProfileModal currentUser={currentUser} onUpdate={u => setCurrentUser(u)} onClose={() => setShowEditModal(false)} currentLanguage={currentLanguage} />}

        <div className="d-flex border-bottom mb-3 gap-4 mt-3 px-4">
          {/* --- CẬP NHẬT HIỂN THỊ NGÔN NGỮ CHO TAB --- */}
          {["pending", "approved", "services"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 border-0 bg-transparent fw-bold ${activeTab === tab ? "text-primary border-bottom border-primary border-2" : "text-muted"}`}
            >
              {tab === "pending" 
                ? t.pendingTab 
                : tab === "approved" 
                  ? t.approvedTab 
                  : t.servicesTab}
            </button>
          ))}
        </div>

        <div className="px-4 pb-5">
          {activeTab === "services" ? (
            <div>
              <div className="d-flex justify-content-end mb-2" style={{height: 40,marginRight: 10}}>

                <button className="btn btn-primary btn-sm" onClick={handleAddNewRow} style={{ fontSize: '12px' }}>
                  {t.addServiceBtn}
                </button>
              </div>
              
              <div className="table-responsive shadow-sm rounded overflow-hidden">
                <table className="table table-bordered table-sm mb-0 align-middle" style={{ fontSize: '12px', tableLayout: 'auto' }}>
                  <thead className="text-white text-center align-middle" style={{ backgroundColor: "#1e3a8a", fontSize: "12px" }}>
                    <tr>
                      <th className="py-2 border" style={{ width: '35px' }}>{t.stt}</th>
                      <th className="py-2 border" style={{ minWidth: "120px" }}>{t.chonDN}</th>
                      <th className="py-2 border" style={{ width: '140px' }}>{t.loaiDichVu}</th>
                      <th className="py-2 border" style={{ width: '140px' }}>{t.tenDichVu}</th>
                      <th className="py-2 border" style={{ width: '60px' }}>{t.maDichVu}</th>
                      <th className="py-2 border" style={{ width: '85px' }}>{t.ngayBatDau}</th>
                      <th className="py-2 border" style={{ width: '85px' }}>{t.ngayKetThuc}</th>
                      <th className="py-2 border" style={{ width: '100px' }}>{t.doanhThuTruoc}</th>
                      <th className="py-2 border" style={{ width: '60px' }}>{t.mucChietKhau}</th>
                      <th className="py-2 border" style={{ width: '80px' }}>{t.soTienChietKhau}</th>
                      <th className="py-2 border" style={{ width: '100px' }}>{t.doanhThuSau}</th>
                      <th className="py-2 border" style={{ width: '90px' }}>{t.tongDoanhThuTichLuy}</th>
                      <th className="py-2 border" style={{ width: '100px' }}>{t.hanhDong}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getPaginatedList(serviceRecords, "services").map((rec, idx, arr) => {
                      const globalIndex = idx + 1 + (currentPages.services - 1) * itemsPerPage;
                      const selectedCompany = approvedList.find(c => c.ID == rec.companyId);
                      const availableServices = selectedCompany && selectedCompany.DichVu 
                        ? selectedCompany.DichVu.split(',').map(s => s.trim()).filter(s => s) 
                        : [];

                      const isFirstOccurrence = idx === 0 || rec.companyId !== arr[idx - 1].companyId;
                      let rowSpan = 0;
                      if (isFirstOccurrence) {
                        rowSpan = 1;
                        for (let i = idx + 1; i < arr.length; i++) {
                          if (arr[i].companyId === rec.companyId) rowSpan++; else break;
                        }
                      }

                      return (
                        <tr key={rec.id} className="bg-white hover:bg-gray-50" style={{ height: '30px' }}>
                          <td className="text-center border p-0 align-middle">{globalIndex}</td>
                          <td className="border p-0 align-middle">
                            <select 
                              className="form-select form-select-sm shadow-none"
                              style={{ ...baseCellStyle, width: "100%", minWidth: "120px" }}
                              value={rec.companyId || ""}
                              onChange={(e) => handleRecordChange(rec.id, "companyId", e.target.value)}
                            >
                              <option value="">-- Chọn DN --</option>
                              {approvedList.map(c => (<option key={c.ID} value={c.ID}>{c.TenDoanhNghiep}</option>))}
                            </select>
                          </td>
                          <td className="border p-0 align-middle">
                            <select 
                                className="form-select form-select-sm shadow-none"
                                style={{...rec.isNew ? newSelectStyle : savedSelectStyle,width: 162}}
                                value={rec.serviceType || ""}
                                onChange={(e) => handleRecordChange(rec.id, "serviceType", e.target.value)}
                                disabled={!rec.companyId}
                            >
                                <option value="">-- Loại --</option>
                                {availableServices.map((svc, i) => (<option key={i} value={svc}>{svc}</option>))}
                                {rec.serviceType && !availableServices.includes(rec.serviceType) && (<option value={rec.serviceType}>{rec.serviceType}</option>)}
                            </select>
                          </td>
                          <td className="border p-0 align-middle" style={{width:160}}>
                            <input type="text" className="form-control form-control-sm shadow-none" style={baseCellStyle} value={rec.serviceName} onChange={(e) => handleRecordChange(rec.id, "serviceName", e.target.value)} placeholder="Nhập Tên Dịch Vụ"/>
                          </td>
                          <td className="border p-0 align-middle">
                            <input type="text" className="form-control form-control-sm text-center shadow-none" style={baseCellStyle} value={rec.code} onChange={(e) => handleRecordChange(rec.id, "code", e.target.value)}/>
                          </td>
                          <td className="border p-0 align-middle">
                            <input type="date" className="form-control form-control-sm text-center shadow-none" style={{...baseCellStyle, padding: '0 1px', fontSize: '12px'}} value={rec.startDate} onChange={(e) => handleRecordChange(rec.id, "startDate", e.target.value)}/>
                          </td>
                          <td className="border p-0 align-middle">
                            <input type="date" className="form-control form-control-sm text-center shadow-none" style={{...baseCellStyle, padding: '0 1px', fontSize: '12px'}} value={rec.endDate} onChange={(e) => handleRecordChange(rec.id, "endDate", e.target.value)}/>
                          </td>
                          <td className="border p-0 align-middle">
                            <input type="text" className="form-control form-control-sm text-center shadow-none" style={{...baseCellStyle, textAlign: 'center'}} value={formatNumber(rec.revenueBefore)} onChange={(e) => handleRecordChange(rec.id, "revenueBefore", e.target.value)}/>
                          </td>
                          <td className="border p-0 align-middle">
                            <select className="form-select form-select-sm text-center shadow-none" style={{...baseCellStyle, padding: '0'}} value={rec.discountRate} onChange={(e) => handleRecordChange(rec.id, "discountRate", e.target.value)}>
                              <option value="">%</option><option value="5">5%</option><option value="10">10%</option><option value="15">15%</option><option value="20">20%</option>
                            </select>
                          </td>
                          <td className="text-center align-middle border px-2 bg-light" style={{ fontSize: '12px', padding: '2px 4px' }}>{formatNumber(rec.discountAmount)}</td>
                          <td className="text-center align-middle fw-bold border px-2 bg-light" style={{ fontSize: '12px', padding: '2px 4px' }}>{formatNumber(rec.revenueAfter)}</td>
                          {isFirstOccurrence && (
                            <td className="text-center align-middle fw-bold border px-2 text-primary bg-white" rowSpan={rowSpan} style={{ fontSize: '12px', padding: '2px 4px'}}>
                                {formatNumber(calculateCompanyTotalRevenue(rec.companyId))}
                            </td>
                          )}
                          <td className="text-center border p-1 align-middle">
                            <div className="d-flex gap-1 justify-content-center">
                              <button className="btn btn-sm" style={{ backgroundColor: "#2563eb", color: "#fff", width: 36, height: 36, borderRadius: 6, }} onClick={() => saveServiceRow(rec)} > <Save size={17} strokeWidth={2.3} /> </button> 
                               <button className="btn btn-sm" style={{ backgroundColor: "#ef4444", color: "#fff", width: 36, height: 36, borderRadius: 6, }} onClick={() => deleteServiceRow(rec.id, rec.isNew)} > <Trash2 size={17} strokeWidth={2.3} /> </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {serviceRecords.length === 0 && (<tr><td colSpan="13" className="text-center py-4 text-muted border">Chưa có dữ liệu dịch vụ</td></tr>)}
                  </tbody>
                </table>
              </div>
              <Pagination totalItems={getFilteredList(serviceRecords).length} tabName="services" />
            </div>
          ) : (
       
            <div className="table-responsive shadow-sm rounded overflow-hidden">
              <table className="table table-bordered table-sm mb-0 align-middle" style={{ fontSize: '12px', tableLayout: 'auto' }}>
                <thead className="text-white text-center align-middle" style={{ backgroundColor: "#1e3a8a", fontSize: "12px" }}>
                  <tr>
                    <th className="py-2 border">{t.stt}</th>
                    <th className="py-2 border" style={{ minWidth: '150px' }}>{t.tenDN}</th>
                    <th className="py-2 border">{t.soDKKD}</th>
                    <th className="py-2 border">{t.nguoiDaiDien}</th>
                    
                    {activeTab === "pending" && <th className="py-2 border" style={{ minWidth: '120px' }}>{t.dichVu}</th>}
                    {activeTab === "pending" && <th className="py-2 border" style={{ minWidth: '100px' }}>{t.giayPhep}</th>}
                    
                  {activeTab === "approved" && <th className="py-2 border" style={{ minWidth: '150px' }}>{t.nganhNgheChinh}</th>}
                    
                    {activeTab === "approved" && <th className="py-2 border" style={{ minWidth: '180px' }}>{t.diaChi}</th>}

                    <th className="py-2 border" style={{ minWidth: '110px' }}>{t.ngayDangKy}</th>

                    {activeTab === "approved" && <th className="py-2 border" style={{ minWidth: '120px' }}>{t.tongDoanhThuTichLuy}</th>}
                    
                    {activeTab === "pending" && <th className="py-2 border" style={{ minWidth: '150px' }}>{t.lyDoTuChoi}</th>}
                    <th className="py-2 border" style={{ width: '120px' }}>{t.hanhDong}</th>
                  </tr>
                </thead>
                <tbody>
                  {getPaginatedList(activeTab === "pending" ? pendingList : approvedList, activeTab).map((item, idx) => {
                      const globalIndex = idx + 1 + (currentPages[activeTab] - 1) * itemsPerPage;
                      return (
                        <tr key={item.ID} className="bg-white hover:bg-gray-50" style={{ height: '30px' }}>
                          <td className="text-center border p-0 align-middle">{globalIndex}</td>
                          
                          {/* Tên Doanh Nghiệp */}
                          <td className="border p-0 align-middle">
                            <input type="text" className="form-control form-control-sm text-center shadow-none" style={{...baseCellStyle, textAlign: 'center'}} value={item.TenDoanhNghiep}
                                onChange={(e) => { if(activeTab === "pending") handlePendingChange(item.ID, "TenDoanhNghiep", e.target.value); else handleApprovedChange(item.ID, "TenDoanhNghiep", e.target.value); }}
                            />
                          </td>

                          {/* Số ĐKKD */}
                          <td className="border p-0 align-middle">
                            <input type="text" className="form-control form-control-sm text-center shadow-none" style={{...baseCellStyle, textAlign: 'center'}} value={item.SoDKKD}
                                onChange={(e) => { if(activeTab === "pending") handlePendingChange(item.ID, "SoDKKD", e.target.value); else handleApprovedChange(item.ID, "SoDKKD", e.target.value); }}
                            />
                          </td>

                          {/* Người Đại Diện (Giám đốc) */}
                          <td className="border p-0 align-middle">
                            <input type="text" className="form-control form-control-sm text-center shadow-none" style={{...baseCellStyle, textAlign: 'center'}} value={item.NguoiDaiDien}
                                onChange={(e) => { if(activeTab === "pending") handlePendingChange(item.ID, "NguoiDaiDien", e.target.value); else handleApprovedChange(item.ID, "NguoiDaiDien", e.target.value); }}
                            />
                          </td>

                          {/* --- CỘT MỚI CHO TAB PENDING --- */}
                          {activeTab === "pending" && (
                              <>
                                {/* Cột Dịch Vụ - Editable */}
                                <td className="border p-0 align-middle"  style={{ minWidth: '180px' }}>
                                    <input 
                                        type="text" className="form-control form-control-sm text-center shadow-none"
                                        style={{...baseCellStyle, textAlign: 'center'}}
                                        value={item.DichVu || ""}
                                        onChange={(e) => handlePendingChange(item.ID, "DichVu", e.target.value)}
                                    />
                                </td>
                                
                                {/* Cột Giấy Phép - Read-only (Link) */}
                                <td className="border p-0 align-middle text-center">
                                   {item.PdfPath ? (
                                      <a href={item.PdfPath} target="_blank" rel="noreferrer" className="text-primary" title="Xem PDF">
                                          <FileText size={18} />
                                      </a>
                                   ) : (
                                      <span className="text-muted" style={{fontSize: '11px'}}>—</span>
                                   )}
                                </td>
                              </>
                          )}

               
                          {activeTab === "approved" && (
                              <>
                                {/* Ngành Nghề Chính */}
                                <td className="border p-0 align-middle">
                                    <input type="text" className="form-control form-control-sm text-center shadow-none" style={{...baseCellStyle, textAlign: 'center'}} value={item.NganhNgheChinh || ""} onChange={(e) => handleApprovedChange(item.ID, "NganhNgheChinh", e.target.value)} />
                                </td>
                                {/* Địa Chỉ - Mới */}
                                <td className="border p-0 align-middle">
                                    <input type="text" className="form-control form-control-sm text-center shadow-none" style={{...baseCellStyle, textAlign: 'center'}} value={item.DiaChi || ""} onChange={(e) => handleApprovedChange(item.ID, "DiaChi", e.target.value)} placeholder="Nhập địa chỉ..." />
                                </td>
                              </>
                          )}


                          <td className="text-center border align-middle px-2">
                            {formatDateTime(item.NgayTao || item.NgayDangKyB2B)}
                          </td>

                           {/* Tổng Doanh Thu - Read-only (Approved Tab) */}
                           {activeTab === "approved" && (
                               <td className="text-center border align-middle fw-bold text-primary px-2">
                                   {formatNumber(item.TongDoanhThu || calculateCompanyTotalRevenue(item.ID))}
                               </td>
                           )}

                          {activeTab === "pending" && (
                              <td className="border p-0 align-middle">
                                  <input type="text" className="form-control form-control-sm shadow-none" style={{...baseCellStyle, padding: '2px 8px'}} placeholder="Nhập lý do..." value={item.rejectionReason || ""} onChange={(e) => handlePendingChange(item.ID, "rejectionReason", e.target.value)} />
                              </td>
                          )}

                          <td className="text-center border p-1 align-middle">
                             <div className="d-flex gap-1 justify-content-center">
                                {activeTab === "pending" && (
                                    <>
                                        <button className="btn btn-sm" style={{ backgroundColor: "#2563eb", color: "#fff", width: 32, height: 32, borderRadius: 6 }} onClick={() => savePendingRow(item)} title="Lưu chỉnh sửa"> <Save size={16} strokeWidth={2.3} /> </button>
                                        <button className="btn btn-sm" style={{ backgroundColor: "#22c55e", color: "#fff", width: 32, height: 32, borderRadius: 6 }} onClick={() => approve(item.ID)} title="Duyệt"> <Check size={16} strokeWidth={2.3} /> </button>
                                        <button className="btn btn-sm" style={{ backgroundColor: "#ef4444", color: "#fff", width: 32, height: 32, borderRadius: 6 }} onClick={() => reject(item)} title="Không duyệt"> <XCircle size={16} strokeWidth={2.3} /> </button>
                                    </>
                                )}
                                {activeTab === "approved" && (
                                    <>
                                        <button className="btn btn-sm" style={{ backgroundColor: "#2563eb", color: "#fff", width: 32, height: 32, borderRadius: 6 }} onClick={() => saveApprovedRow(item)} title="Lưu thay đổi"> <Save size={16} strokeWidth={2.3} /> </button>
                                        <button className="btn btn-sm" style={{ backgroundColor: "#ef4444", color: "#fff", width: 32, height: 32, borderRadius: 6 }} onClick={() => deleteRow(item.ID)} title="Xóa"> <Trash2 size={16} strokeWidth={2.3} /> </button>
                                    </>
                                )}
                             </div>
                          </td>
                        </tr>
                    );
                  })}
                  {getPaginatedList(activeTab === "pending" ? pendingList : approvedList, activeTab).length === 0 && (<tr><td colSpan={activeTab === "pending" ? 9 : 10} className="text-center py-3 text-muted">Không có dữ liệu</td></tr>)}
                </tbody>
              </table>
              <Pagination totalItems={getFilteredList(activeTab === "pending" ? pendingList : approvedList).length} tabName={activeTab} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}