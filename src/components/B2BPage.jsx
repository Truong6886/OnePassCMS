import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import useSocketListener from "./CMSDashboard/hooks/useSocketListener";
import NotificationPanel from "./CMSDashboard/NotificationPanel";
import EditProfileModal from "./EditProfileModal";
import { showToast } from "../utils/toast";
import { Save, Trash2, XCircle, Check, FileText } from "lucide-react";
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

  // Tạo mảng các trang hiển thị (giữ 1, total và 1 trang trước/sau current)
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)
  );

  return (
    <div className="d-flex justify-content-between align-items-center px-3 py-2 border-top bg-light">
      {/* Thông tin số hàng */}
      <div className="text-muted small">
        {language === "vi"
          ? `Hiển thị ${Math.min(total, currentPage * pageSize)} / ${total} hàng (trang ${currentPage}/${totalPages})`
          : `Showing ${Math.min(total, currentPage * pageSize)} / ${total} rows (page ${currentPage}/${totalPages})`}
      </div>

      {/* Nút phân trang */}
      <div className="d-flex justify-content-center align-items-center">
        <nav>
          <ul className="pagination pagination-sm mb-0 shadow-sm">
            {/* Prev */}
            <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
              <button className="page-link" onClick={() => goTo(currentPage - 1)}>
                &laquo;
              </button>
            </li>

            {/* Trang số */}
            {pages.map((p, idx, arr) => (
              <React.Fragment key={p}>
                {idx > 0 && arr[idx - 1] !== p - 1 && (
                  <li className="page-item disabled">
                    <span className="page-link">…</span>
                  </li>
                )}
                <li className={`page-item ${currentPage === p ? "active" : ""}`}>
                  <button className="page-link" onClick={() => goTo(p)}>
                    {p}
                  </button>
                </li>
              </React.Fragment>
            ))}

            {/* Next */}
            <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
              <button className="page-link" onClick={() => goTo(currentPage + 1)}>
                &raquo;
              </button>
            </li>
          </ul>
        </nav>

        {/* Thông tin trang */}
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
      day: "2-digit", 
      month: "2-digit", 
      year: "numeric",
      hour: "2-digit", 
      minute: "2-digit",
      hour12: false // Để hiển thị 24h format
    }).format(date);
  } catch (error) { 
    console.error("Error formatting date:", error);
    return isoString; 
  }
};
const formatDateTimeReject = (isoString) => {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);  // KHÔNG thêm "Z"

    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Ho_Chi_Minh"   // ép về giờ VN
    }).format(date);
  } catch (error) {
    console.error("Error formatting date:", error);
    return isoString;
  }
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
    pending: 1,
    approved: 1,
    rejected: 1,
    services: 1
  });
  const [hasNewRequest, setHasNewRequest] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const loadPending = async (page = 1) => {
    const res = await fetch(`${API_BASE}/b2b/pending?page=${page}&limit=20`);
    const json = await res.json();
    if (json.success) {
      setPendingData(json.data);
      setPendingTotal(json.total);
    }
  };
const loadApproved = async (page = 1) => {
  const res = await fetch(`${API_BASE}/b2b/approved?page=${page}&limit=20`);
  const json = await res.json();
  if (json.success) {
    setApprovedData(json.data);
    setApprovedTotal(json.total);
  }
};
const loadRejected = async (page = 1) => {
  const res = await fetch(`${API_BASE}/b2b/reject?page=${page}&limit=20`);
  const json = await res.json();
  if (json.success) {
    setRejectedData(json.data);
    setRejectedTotal(json.total);
  }
};
const loadServices = async (page = 1) => {
  try {
    setLoading(true);
    const res = await fetch(
      `${API_BASE}/b2b/services?page=${page}&limit=20`
    );
    const json = await res.json();
    if (json.success) {
      setServiceData(json.data);
      setServiceTotal(json.total);
    } else {
      console.error("Lỗi load services:", json.message);
      setServiceData([]);
    }
  } catch (error) {
    console.error("Lỗi load services:", error);
    setServiceData([]);
    showToast("Lỗi tải danh sách dịch vụ", "error");
  } finally {
    setLoading(false);
  }
};

  const translations = {
    vi: {
      pendingTab: "Danh sách chờ duyệt",
      approvedTab: "Danh sách đã duyệt",
      rejectedTab: "Danh sách từ chối",
      servicesTab: "Danh sách dịch vụ",
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
      email: "Email",
      soDienThoai: "Số Điện Thoai",
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
      rejectedTab: "Rejected List",
      servicesTab: "Services List",
      addServiceBtn: "+ Add Service",

      // Cột chung
      stt: "No.",
      tenDN: "Company Name",
      soDKKD: "Business Reg. No.",
      nguoiDaiDien: "Legal Representative",
      email: "Email",
      soDienThoai: "Phone Number",
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
  if (!currentUser) return;

  if (activeTab === "pending") loadPending(currentPage.pending);
  if (activeTab === "approved") loadApproved(currentPage.approved);
  if (activeTab === "rejected") loadRejected(currentPage.rejected);
  if (activeTab === "services") loadServices(currentPage.services);
}, [activeTab, currentPage, currentUser]);

const handlePageChange = (tab, page) => {
  setCurrentPage(prev => ({ ...prev, [tab]: page }));
};
  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
    loadData();
  }, []);

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
      
      const formattedPending = (p.data || []).map(item => ({
        ...item,
        rejectionReason: "" 
      }));

      setPendingList(formattedPending);
      setApprovedList(a.data || []);
      setRejectedList(r.data || []);

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
          } catch (e) { 
            console.error("Error loading services:", e);
            return []; 
          }
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
    } catch (err) { 
      console.error("Error loading data:", err);
      showToast("Lỗi tải dữ liệu", "error"); 
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
        } catch (e) {
          return sum;
        }
      }, 0);
  };
  const handlePendingChange = (id, field, value) => {
    setPendingList(prev => prev.map(item => 
      item.ID === id ? { ...item, [field]: value } : item
    ));
  };

  const handleApprovedChange = (id, field, value) => {
    setApprovedList(prev => prev.map(item => 
      item.ID === id ? { ...item, [field]: value } : item
    ));
  };

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
        DichVuKhac: item.DichVuKhac,
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
    const result = await MySwal.fire({
      title: "Xác nhận",
      text: "Xác nhận duyệt doanh nghiệp này?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#22c55e",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Duyệt",
      cancelButtonText: "Hủy"
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`${API_BASE}/b2b/approve/${id}`, { method: "POST" });
      const json = await res.json();
      
      if (json.success) {
        showToast("Duyệt thành công", "success");
        loadData();
      } else { 
        showToast(json.message, "error"); 
      }
    } catch (err) { 
      console.error(err);
      showToast("Lỗi server", "error"); 
    }
  };

const reject = async (item) => {
  if (!item.rejectionReason || item.rejectionReason.trim() === "") {
    return showToast("Vui lòng nhập lý do từ chối!", "warning");
  }

  const result = await MySwal.fire({
    title: "Xác nhận",
    text: `Từ chối doanh nghiệp ${item.TenDoanhNghiep}?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#2563eb",
    confirmButtonText: "Từ chối",
    cancelButtonText: "Hủy"
  });

  if (!result.isConfirmed) return;

  try {
    // Sử dụng endpoint mới
    const res = await fetch(`${API_BASE}/b2b/pending/${item.ID}/reject`, { 
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: item.rejectionReason })
    });

    const json = await res.json();

    if (json.success) {
      showToast("Đã từ chối doanh nghiệp", "success");
      setPendingList(prev => prev.filter(i => i.ID !== item.ID));
    } else {
      showToast(json.message || "Lỗi từ chối doanh nghiệp", "error");
    }
  } catch (err) { 
    console.error(err);
    showToast("Lỗi server", "error"); 
  }
};
  const deleteRow = async (id) => {
    const result = await MySwal.fire({
      title: "CẢNH BÁO",
      text: "Bạn có chắc chắn muốn xóa doanh nghiệp này? Tất cả dịch vụ liên quan cũng sẽ bị xóa.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#2563eb",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy"
    });

    if (!result.isConfirmed) return;

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

  const handleRecordChange = (id, field, value) => {
   setServiceData(prev => prev.map(record => {

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
const sortServicesByCompany = (data) => {
  return [...data].sort((a, b) => {
    const compA = a.companyId || "";
    const compB = b.companyId || "";
    if (compA !== compB) return compA.localeCompare(compB);

    return (a.id || a.ID) - (b.id || b.ID);
  });
};
const handleAddNewRow = () => {
  const newId = Date.now();
  const newRecord = {
    id: newId,
    companyId: "", 
    serviceType: "", 
    serviceName: "", 
    code: "", 
    startDate: "", 
    endDate: "",
    revenueBefore: "", 
    discountRate: "0", 
    discountAmount: "0", 
    revenueAfter: "0", 
    totalRevenue: "0",
    isNew: true,
  };
  
  

  setServiceData(prev => [...prev, newRecord]);
  setServiceTotal(prev => prev + 1);
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
       
       let url = `${API_BASE}/b2b/services`;
       let method = "POST";
       
       if (!rec.isNew) {
         url = `${API_BASE}/b2b/services/${rec.id}`;
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
         loadServices(currentPage.services);
         loadData();
       } else { 
         showToast("Lỗi: " + json.message, "error"); 
       }
     } catch (error) { 
       console.error(error);
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
    title: "Xác nhận",
    text: "Bạn có chắc chắn muốn xóa dịch vụ này?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#2563eb",
    confirmButtonText: "Xóa",
    cancelButtonText: "Hủy"
  });

  if (!result.isConfirmed) return;

  try {
    const res = await fetch(`${API_BASE}/b2b/services/${id}`, { method: "DELETE" });
    const json = await res.json();
    
    if (json.success) {
      showToast("Xóa thành công", "success");
      setServiceData(prev => prev.filter(r => r.id !== id && r.ID !== id));
      setServiceTotal(prev => prev - 1);
    } else {
      showToast("Lỗi xóa", "error");
    }
  } catch (error) {
    console.error(error);
    showToast("Lỗi server", "error");
  }
};
  const getFilteredList = (list) => {
    if (!list) return [];
    return list.filter(item => 
      Object.values(item).join(" ").toLowerCase().includes(searchTerm.toLowerCase())
    );
  };


  
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

  const renderTabContent = () => {
    switch (activeTab) {
      case "services":
        return renderServicesTab();
      case "rejected":
        return renderRejectedTab();
      default:
        return renderPendingApprovedTab();
    }
  };

const renderServicesTab = () => {
  // Hàm phụ: Chuyển đổi an toàn chuỗi tiền
  const safeParse = (val) => {
    if (!val) return 0;
    try {
      const cleanStr = String(val).replace(/\./g, "");
      const num = parseFloat(cleanStr);
      return isNaN(num) ? 0 : num;
    } catch (e) {
      return 0;
    }
  };

  // Sắp xếp dữ liệu theo ID doanh nghiệp để các dòng cùng cty nằm cạnh nhau
  const displayData = [...(serviceData || [])].sort((a, b) => {
    const compA = String(a.companyId || a.DoanhNghiepID || "");
    const compB = String(b.companyId || b.DoanhNghiepID || "");
    return compA.localeCompare(compB);
  });

  return (
    <div>
      <div className="d-flex justify-content-end mb-2" style={{ height: 40, marginRight: 10 }}>
        <button className="btn btn-primary btn-sm" onClick={handleAddNewRow} style={{ fontSize: "12px" }}>
          {t.addServiceBtn}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          <div className="table-responsive shadow-sm rounded overflow-hidden">
            <table
              className="table table-bordered table-sm mb-0 align-middle"
              style={{ fontSize: "12px", tableLayout: "auto", borderCollapse: "collapse" }}
            >
              <thead
                className="text-white text-center align-middle"
                style={{ backgroundColor: "#1e3a8a", fontSize: "12px" }}
              >
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

                    const currentCompanyId = String(rec.companyId || rec.DoanhNghiepID || "");
                    const prevCompanyId = idx > 0 ? String(displayData[idx - 1].companyId || displayData[idx - 1].DoanhNghiepID || "") : null;

                    // --- FIXED LOGIC: Xác định dòng cuối cùng của nhóm ---
                    // Tìm tất cả các dòng có cùng companyId
                    const sameCompanyRows = displayData.filter(row => 
                      String(row.companyId || row.DoanhNghiepID || "") === currentCompanyId
                    );
                    
                    // Lấy index của dòng hiện tại trong nhóm
                    const currentIndexInGroup = sameCompanyRows.findIndex(row => 
                      row.id === rec.id || row.ID === rec.ID
                    );
                    
                    // Nếu đây là dòng cuối cùng trong nhóm cùng companyId
                    const isLastRowOfGroup = currentIndexInGroup === sameCompanyRows.length - 1;
                    // ------------------------------------------

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
                          const nextId = String(nextRec.companyId || nextRec.DoanhNghiepID || "");
                          if (nextId !== currentCompanyId) break;
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
                      <tr 
                        key={rec.id || idx} 
                        className="bg-white hover:bg-gray-50" 
                        style={{ 
                          height: "30px",
                          // Kẻ border đậm ở dưới nếu là dòng cuối của nhóm công ty
                          borderBottom: isLastRowOfGroup ? "2px solid #6b7280" : "1px solid #e5e7eb"
                        }}
                      >
                        <td className="text-center border p-0 align-middle">{globalIndex}</td>
                        <td className="border p-0 align-middle">
                          <select
                            className="form-select form-select-sm shadow-none"
                            style={{ ...baseCellStyle, width: "100%", minWidth: "120px" }}
                            value={rec.companyId || rec.DoanhNghiepID || ""}
                            onChange={(e) => handleRecordChange(rec.id, "companyId", e.target.value)}
                          >
                            <option value="">-- Chọn DN --</option>
                            {approvedList.map((c) => (
                              <option key={c.ID} value={c.ID}>{c.TenDoanhNghiep}</option>
                            ))}
                          </select>
                        </td>
                        <td className="border p-0 align-middle">
                          <select
                            className="form-select form-select-sm shadow-none"
                            style={{ ...baseCellStyle, width: 150 }}
                            value={rec.serviceType || rec.LoaiDichVu || ""}
                            onChange={(e) => handleRecordChange(rec.id, "serviceType", e.target.value)}
                            disabled={!currentCompanyId}
                          >
                            <option value="">-- Chọn dịch vụ --</option>
                            {serviceOptions.length > 0 ? (
                              serviceOptions.map((svc, i) => <option key={i} value={svc}>{svc}</option>)
                            ) : (
                              <option value="" disabled>Không có dịch vụ</option>
                            )}
                          </select>
                        </td>
                        <td className="border p-0 align-middle" style={{ width: 160 }}>
                          <input type="text" className="form-control form-control-sm shadow-none" style={baseCellStyle} value={rec.serviceName || rec.TenDichVu || ""} onChange={(e) => handleRecordChange(rec.id, "serviceName", e.target.value)} placeholder="Nhập Tên Dịch Vụ" />
                        </td>
                        <td className="border p-0 align-middle">
                          <input type="text" className="form-control form-control-sm text-center shadow-none" style={baseCellStyle} value={rec.code || rec.MaDichVu || rec.ServiceID || ""} onChange={(e) => handleRecordChange(rec.id || rec.ID, "code", e.target.value)} />
                        </td>
                        <td className="border p-0 align-middle">
                          <input type="date" className="form-control form-control-sm text-center shadow-none" style={{ ...baseCellStyle, padding: "0 1px", fontSize: "12px" }} value={rec.startDate || rec.NgayThucHien?.split("T")[0] || ""} onChange={(e) => handleRecordChange(rec.id || rec.ID, "startDate", e.target.value)} />
                        </td>
                        <td className="border p-0 align-middle">
                          <input type="date" className="form-control form-control-sm text-center shadow-none" style={{ ...baseCellStyle, padding: "0 1px", fontSize: "12px" }} value={rec.endDate || rec.NgayHoanThanh?.split("T")[0] || ""} onChange={(e) => handleRecordChange(rec.id || rec.ID, "endDate", e.target.value)} />
                        </td>
                        <td className="border p-0 align-middle">
                          <input type="text" className="form-control form-control-sm text-center shadow-none" style={{ ...baseCellStyle, textAlign: "center" }} value={formatNumber(rec.revenueBefore || rec.DoanhThuTruocChietKhau || "")} onChange={(e) => handleRecordChange(rec.id || rec.ID, "revenueBefore", e.target.value)} />
                        </td>
                        <td className="border p-0 align-middle">
                          <select className="form-select form-select-sm text-center shadow-none" style={{ ...baseCellStyle, padding: "0" }} value={rec.discountRate || rec.MucChietKhau || ""} onChange={(e) => handleRecordChange(rec.id || rec.ID, "discountRate", e.target.value)}>
                            <option value="">%</option>
                            <option value="5">5%</option>
                            <option value="10">10%</option>
                            <option value="15">15%</option>
                            <option value="20">20%</option>
                          </select>
                        </td>
                        <td className="text-center align-middle border px-2 bg-light" style={{ fontSize: "12px", padding: "2px 4px" }}>
                          {formatNumber(rec.discountAmount || rec.SoTienChietKhau || "0")}
                        </td>
                        <td className="text-center align-middle fw-bold border px-2 bg-light" style={{ fontSize: "12px", padding: "2px 4px" }}>
                          {formatNumber(rec.revenueAfter || rec.DoanhThuSauChietKhau || "0")}
                        </td>

                        {shouldRenderTotalCell && (
                          <td
                            rowSpan={rowSpan}
                            className="text-center align-middle fw-bold px-2 text-primary border"
                            style={{
                              fontSize: "13px",
                              padding: "2px 4px",
                              backgroundColor: "#fff",
                              // Đảm bảo ô gộp (rowspan) cũng có viền đáy nếu nó kết thúc tại dòng này
                              borderBottom: isLastRowOfGroup ? "2px solid #6b7280" : undefined 
                            }}
                          >
                            {formatNumber(groupTotalRevenue)}
                          </td>
                        )}

                        <td className="text-center border p-1 align-middle">
                          <div className="d-flex gap-1 justify-content-center">
                            <button className="btn btn-sm" style={{ backgroundColor: "#2563eb", color: "#fff", width: 36, height: 36, borderRadius: 6 }} onClick={() => saveServiceRow(rec)}>
                              <Save size={17} strokeWidth={2.3} />
                            </button>
                            <button className="btn btn-sm" style={{ backgroundColor: "#ef4444", color: "#fff", width: 36, height: 36, borderRadius: 6 }} onClick={() => deleteServiceRow(rec.id || rec.ID, rec.isNew)}>
                              <Trash2 size={17} strokeWidth={2.3} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="13" className="text-center py-4 text-muted border">Chưa có dữ liệu dịch vụ</td>
                  </tr>
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
          <th className="py-2 border">{t.stt}</th>
          <th className="py-2 border" style={{ minWidth: '150px' }}>{t.tenDN}</th>
          <th className="py-2 border">{t.soDKKD}</th>
          <th className="py-2 border">{t.email}</th>
          <th className="py-2 border">{t.soDienThoai}</th>
          <th className="py-2 border">{t.nguoiDaiDien}</th>
          <th className="py-2 border">{t.nganhNgheChinh}</th>
          <th className="py-2 border" style={{ minWidth: '200px' }}>{t.lyDoTuChoi}</th>
          <th className="py-2 border">{t.ngayDangKy}</th>
        </tr>
      </thead>
      <tbody>
        {rejectedData.map((item, idx) => (
          <tr key={item.ID} className="bg-white hover:bg-gray-50">
            <td className="text-center border align-middle" style={{ height: '30px' }}>
              {idx + 1 + (currentPage.rejected - 1) * 20}
            </td>
            <td className="border align-middle" style={{ height: '30px' }}>
              <div className="text-center" style={baseCellStyle}>
                {item.TenDoanhNghiep || ""}
              </div>
            </td>
            <td className="border align-middle" style={{ height: '30px' }}>
              <div className="text-center" style={baseCellStyle}>
                {item.SoDKKD || ""}
              </div>
            </td>
            <td className="border align-middle" style={{ height: '30px' }}>
              <div className="text-center" style={baseCellStyle}>
                {item.Email || ""}
              </div>
            </td>
            <td className="border align-middle" style={{ height: '30px' }}>
              <div className="text-center" style={baseCellStyle}>
                {item.SoDienThoai || ""}
              </div>
            </td>
            <td className="border align-middle" style={{ height: '30px' }}>
              <div className="text-center" style={baseCellStyle}>
                {item.NguoiDaiDien || ""}
              </div>
            </td>
            <td className="border align-middle" style={{ height: '30px' }}>
              <div className="text-center" style={baseCellStyle}>
                {item.NganhNgheChinh || ""}
              </div>
            </td>
            <td className="border align-middle" style={{ height: '30px' }}>
              <div className="text-center" style={baseCellStyle}>
                {item.LyDoTuChoi || ""}
              </div>
            </td>
            <td className="text-center border align-middle" style={{ height: '30px' }}>
              {formatDateTimeReject(item.NgayTao)}
            </td>
          </tr>
        ))}
        {rejectedData.length === 0 && (
          <tr>
            <td colSpan="9" className="text-center py-3 text-muted">
              {currentLanguage === "vi" ? "Không có dữ liệu" : "No data"}
            </td>
          </tr>
        )}
      </tbody>
    </table>
    <Pagination
      current={currentPage.rejected}
      total={rejectedTotal}
      pageSize={20}
      onChange={(page) => handlePageChange("rejected", page)}
    />

  </div>
);

  const renderPendingApprovedTab = () => (
    <div className="table-responsive shadow-sm rounded overflow-hidden">
      <table className="table table-bordered table-sm mb-0 align-middle" style={{ fontSize: '12px', tableLayout: 'auto' }}>
        <thead className="text-white text-center align-middle" style={{ backgroundColor: "#1e3a8a", fontSize: "12px" }}>
          <tr>
            <th className="py-2 border">{t.stt}</th>
            <th className="py-2 border" style={{ minWidth: '150px' }}>{t.tenDN}</th>
            <th className="py-2 border">{t.soDKKD}</th>
            <th className="py-2 border">{t.nguoiDaiDien}</th>
            
            {activeTab === "pending" && (
              <>
                <th className="py-2 border" style={{ minWidth: '120px' }}>{t.dichVu}</th>
                <th className="py-2 border" style={{ minWidth: '100px' }}>{t.giayPhep}</th>
              </>
            )}
            
            {activeTab === "approved" && (
              <>
                <th className="py-2 border" style={{ minWidth: '150px' }}>{t.nganhNgheChinh}</th>
                <th className="py-2 border" style={{ minWidth: '180px' }}>{t.diaChi}</th>
              </>
            )}

            <th className="py-2 border" style={{ minWidth: '110px' }}>{t.ngayDangKy}</th>

            {activeTab === "approved" && (
              <th className="py-2 border" style={{ minWidth: '120px' }}>{t.tongDoanhThuTichLuy}</th>
            )}
            
            {activeTab === "pending" && (
              <th className="py-2 border" style={{ minWidth: '150px' }}>{t.lyDoTuChoi}</th>
            )}
            <th className="py-2 border" style={{ width: '120px' }}>{t.hanhDong}</th>
          </tr>
        </thead>
        <tbody>
          {(activeTab === "pending" ? pendingData : approvedData).map((item, idx) => {
            const globalIndex = idx + 1 + (currentPage[activeTab] - 1) * 20;
            return (
              <tr key={item.ID} className="bg-white hover:bg-gray-50" style={{ height: '30px' }}>
                <td className="text-center border p-0 align-middle">{globalIndex}</td>
                
                {/* Tên Doanh Nghiệp */}
                <td className="border p-0 align-middle">
                  <input 
                    type="text" 
                    className="form-control form-control-sm text-center shadow-none" 
                    style={{...baseCellStyle, textAlign: 'center'}} 
                    value={item.TenDoanhNghiep}
                    onChange={(e) => { 
                      if(activeTab === "pending") 
                        handlePendingChange(item.ID, "TenDoanhNghiep", e.target.value); 
                      else 
                        handleApprovedChange(item.ID, "TenDoanhNghiep", e.target.value); 
                    }}
                  />
                </td>

                {/* Số ĐKKD */}
                <td className="border p-0 align-middle">
                  <input 
                    type="text" 
                    className="form-control form-control-sm text-center shadow-none" 
                    style={{...baseCellStyle, textAlign: 'center'}} 
                    value={item.SoDKKD}
                    onChange={(e) => { 
                      if(activeTab === "pending") 
                        handlePendingChange(item.ID, "SoDKKD", e.target.value); 
                      else 
                        handleApprovedChange(item.ID, "SoDKKD", e.target.value); 
                    }}
                  />
                </td>

                {/* Người Đại Diện (Giám đốc) */}
                <td className="border p-0 align-middle">
                  <input 
                    type="text" 
                    className="form-control form-control-sm text-center shadow-none" 
                    style={{...baseCellStyle, textAlign: 'center'}} 
                    value={item.NguoiDaiDien}
                    onChange={(e) => { 
                      if(activeTab === "pending") 
                        handlePendingChange(item.ID, "NguoiDaiDien", e.target.value); 
                      else 
                        handleApprovedChange(item.ID, "NguoiDaiDien", e.target.value); 
                    }}
                  />
                </td>

                {/* --- CỘT CHO TAB PENDING --- */}
                {activeTab === "pending" && (
                  <>
                    {/* Cột Dịch Vụ - Editable */}
                    <td className="border p-0 align-middle" style={{ minWidth: '180px' }}>
                      <input 
                        type="text" 
                        className="form-control form-control-sm text-center shadow-none"
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

                {/* --- CỘT CHO TAB APPROVED --- */}
                {activeTab === "approved" && (
                  <>
                    {/* Ngành Nghề Chính */}
                    <td className="border p-0 align-middle">
                      <input 
                        type="text" 
                        className="form-control form-control-sm text-center shadow-none" 
                        style={{...baseCellStyle, textAlign: 'center'}} 
                        value={item.NganhNgheChinh || ""} 
                        onChange={(e) => handleApprovedChange(item.ID, "NganhNgheChinh", e.target.value)} 
                      />
                    </td>
                    {/* Địa Chỉ - Mới */}
                    <td className="border p-0 align-middle">
                      <input 
                        type="text" 
                        className="form-control form-control-sm text-center shadow-none" 
                        style={{...baseCellStyle, textAlign: 'center'}} 
                        value={item.DiaChi || ""} 
                        onChange={(e) => handleApprovedChange(item.ID, "DiaChi", e.target.value)} 
                        placeholder="Nhập địa chỉ..." 
                      />
                    </td>
                  </>
                )}

                <td className="text-center border align-middle px-2">
                  {formatDateTime(item.NgayTao || item.NgayDangKyB2B)}
                </td>
                {activeTab === "approved" && (
                  <td className="text-center border align-middle fw-bold text-primary px-2">
                    {formatNumber(calculateCompanyTotalRevenue(item.ID))}
                  </td>
                )}

                {activeTab === "pending" && (
                  <td className="border p-0 align-middle">
                    <input 
                      type="text" 
                      className="form-control form-control-sm shadow-none" 
                      style={{...baseCellStyle, padding: '2px 8px'}} 
                      placeholder="Nhập lý do..." 
                      value={item.rejectionReason || ""} 
                      onChange={(e) => handlePendingChange(item.ID, "rejectionReason", e.target.value)} 
                    />
                  </td>
                )}

                <td className="text-center border p-1 align-middle">
                  <div className="d-flex gap-1 justify-content-center">
                    {activeTab === "pending" && (
                      <>
                        <button 
                          className="btn btn-sm" 
                          style={{ backgroundColor: "#2563eb", color: "#fff", width: 32, height: 32, borderRadius: 6 }} 
                          onClick={() => savePendingRow(item)} 
                          title="Lưu chỉnh sửa"
                        >
                          <Save size={16} strokeWidth={2.3} />
                        </button>
                        <button 
                          className="btn btn-sm" 
                          style={{ backgroundColor: "#22c55e", color: "#fff", width: 32, height: 32, borderRadius: 6 }} 
                          onClick={() => approve(item.ID)} 
                          title="Duyệt"
                        >
                          <Check size={16} strokeWidth={2.3} />
                        </button>
                        <button 
                          className="btn btn-sm" 
                          style={{ backgroundColor: "#ef4444", color: "#fff", width: 32, height: 32, borderRadius: 6 }} 
                          onClick={() => reject(item)} 
                          title="Không duyệt"
                        >
                          <XCircle size={16} strokeWidth={2.3} />
                        </button>
                      </>
                    )}
                    {activeTab === "approved" && (
                      <>
                        <button 
                          className="btn btn-sm" 
                          style={{ backgroundColor: "#2563eb", color: "#fff", width: 32, height: 32, borderRadius: 6 }} 
                          onClick={() => saveApprovedRow(item)} 
                          title="Lưu thay đổi"
                        >
                          <Save size={16} strokeWidth={2.3} />
                        </button>
                        <button 
                          className="btn btn-sm" 
                          style={{ backgroundColor: "#ef4444", color: "#fff", width: 32, height: 32, borderRadius: 6 }} 
                          onClick={() => deleteRow(item.ID)} 
                          title="Xóa"
                        >
                          <Trash2 size={16} strokeWidth={2.3} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
          {(activeTab === "pending" ? pendingData : approvedData).length === 0 && (
            <tr>
              <td colSpan={activeTab === "pending" ? 10 : 11} className="text-center py-3 text-muted">
                Không có dữ liệu
              </td>
            </tr>
          )}
        </tbody>
      </table>
    <Pagination
        current={currentPage[activeTab]}
        total={activeTab === "pending" ? pendingTotal : approvedTotal}
        pageSize={20}
        onChange={(page) => handlePageChange(activeTab, page)}
    />

    </div>
  );

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
        
        <NotificationPanel 
          showNotification={showNotification} 
          setShowNotification={setShowNotification} 
          notifications={notifications} 
          currentLanguage={currentLanguage} 
        />
        
        {showEditModal && (
          <EditProfileModal 
            currentUser={currentUser} 
            onUpdate={u => setCurrentUser(u)} 
            onClose={() => setShowEditModal(false)} 
            currentLanguage={currentLanguage} 
          />
        )}

        <div className="d-flex border-bottom mb-3 gap-4 mt-3 px-4">
          {["pending", "approved", "rejected", "services"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 border-0 bg-transparent fw-bold ${activeTab === tab ? "text-primary border-bottom border-primary border-2" : "text-muted"}`}
            >
              {tab === "pending" 
                ? t.pendingTab 
                : tab === "approved" 
                  ? t.approvedTab 
                  : tab === "rejected"
                    ? t.rejectedTab
                    : t.servicesTab}
            </button>
          ))}
        </div>

        <div className="px-4 pb-5">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}