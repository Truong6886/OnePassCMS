import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import useSocketListener from "./CMSDashboard/hooks/useSocketListener";
import NotificationPanel from "./CMSDashboard/NotificationPanel";
import EditProfileModal from "./EditProfileModal";
import { showToast } from "../utils/toast";
import { Save, Trash2, XCircle, Check, FileText, Edit, Eye, EyeOff, Plus,X} from "lucide-react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
const MySwal = withReactContent(Swal);

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

const calculateServiceValues = (revenueBefore, discountRate, walletUsage) => {
  const revenue = parseFloat(revenueBefore) || 0;
  const rate = parseFloat(discountRate) || 0;
  const wallet = parseFloat(walletUsage) || 0;

  const discountAmount = Math.round((revenue * rate) / 100);
  

  const revenueAfterDiscount = revenue - discountAmount;
  let revenueAfter = Math.round(revenueAfterDiscount - wallet);


  if (revenueAfter < 0) revenueAfter = 0;

  return { discountAmount, revenueAfter, totalRevenue: revenueAfter };
};
const API_BASE = "http://localhost:5000/api";

export default function B2BPage() {
  const [expandedRowId, setExpandedRowId] = useState(null);


const toggleExpand = (id) => {
  setExpandedRowId(prev => prev === id ? null : id);
};
  const [availableServices, setAvailableServices] = useState([]);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [userList, setUserList] = useState([]);
  const [currentLanguage, setCurrentLanguage] = useState(localStorage.getItem("language") || "vi");
  const [loading, setLoading] = useState(false);
  const [newServiceForm, setNewServiceForm] = useState({
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
      GhiChu: "",
      NguoiPhuTrachId: "",
      ConfirmPassword: "" 
  })
    useEffect(() => {
    fetchUsers();
  }, []);
  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/User`);
      const json = await res.json();
      if (json.success) setUserList(json.data);
    } catch (e) { console.error("Lỗi lấy user list", e); }
  };

  // Hàm mở Modal và Reset form
 const handleOpenAddServiceModal = () => {
    setNewServiceForm({
      DoanhNghiepID: "",
      SoDKKD: "",
      LoaiDichVu: "",
      TenDichVu: "",
      NgayBatDau: new Date().toISOString().split('T')[0],
      NgayHoanThanh: "",
      ThuTucCapToc: "",
      YeuCauHoaDon: "",
      DoanhThu: "",
      GhiChu: "",
      NguoiPhuTrachId: "",
      ConfirmPassword: ""
    });
    setAvailableServices([]); // Reset dịch vụ
    setShowAddServiceModal(true);
  };

const handleModalChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "DoanhNghiepID") {
      // Giữ nguyên logic xử lý khi chọn doanh nghiệp
      const selectedCompany = approvedList.find(c => String(c.ID) === String(value));
      let services = [];
      if (selectedCompany) {
        if (selectedCompany.DichVu) services.push(...selectedCompany.DichVu.split(',').map(s => s.trim()));
        if (selectedCompany.DichVuKhac) services.push(...selectedCompany.DichVuKhac.split(',').map(s => s.trim()));
      }
      const uniqueServices = [...new Set(services)].filter(Boolean);
      setAvailableServices(uniqueServices);

      setNewServiceForm(prev => ({
        ...prev,
        [name]: value,
        SoDKKD: selectedCompany ? selectedCompany.SoDKKD : "",
        LoaiDichVu: "" 
      }));
    } 
    // --- BỔ SUNG ĐOẠN NÀY: Format số cho cả DoanhThu và Vi ---
    else if (name === "DoanhThu" || name === "Vi") {
      // Hàm unformatNumber và formatNumber đã có sẵn trong file của bạn
      const rawValue = unformatNumber(value);
      if (!isNaN(rawValue)) {
         setNewServiceForm(prev => ({ ...prev, [name]: formatNumber(rawValue) }));
      }
    } 
    // Các trường text bình thường
    else {
      setNewServiceForm(prev => ({ ...prev, [name]: value }));
    }
  };


const handleModalSubmit = async () => {
    // 1. Validate cơ bản
    if (!newServiceForm.DoanhNghiepID || !newServiceForm.LoaiDichVu) {
      return showToast("Vui lòng điền các trường bắt buộc (*)", "warning");
    }
    
    // [NEW] Bắt buộc nhập mật khẩu xác nhận
    if (!newServiceForm.ConfirmPassword) {
      return showToast("Vui lòng nhập mật khẩu xác nhận của bạn để duyệt!", "warning");
    }

    try {
      setLoading(true);

      // 2. [NEW] Gọi API Login để xác thực mật khẩu người dùng hiện tại
      const verifyRes = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: currentUser.username, 
          password: newServiceForm.ConfirmPassword 
        })
      });

      const verifyJson = await verifyRes.json();
      if (!verifyJson.success) {
        setLoading(false);
        return showToast("Mật khẩu xác nhận không chính xác!", "error");
      }

      // 3. Chuẩn bị dữ liệu
      const isFinance = currentUser?.is_director || currentUser?.is_accountant;
      const rawDoanhThu = isFinance && newServiceForm.DoanhThu ? parseFloat(unformatNumber(newServiceForm.DoanhThu)) : 0;
      const rawVi = isFinance && newServiceForm.Vi ? parseFloat(unformatNumber(newServiceForm.Vi)) : 0;

      const payload = {
        DoanhNghiepID: newServiceForm.DoanhNghiepID,
        LoaiDichVu: newServiceForm.LoaiDichVu,
        TenDichVu: newServiceForm.TenDichVu || "",
        NgayThucHien: newServiceForm.NgayBatDau,
        NgayHoanThanh: newServiceForm.NgayHoanThanh || null,
        ThuTucCapToc: newServiceForm.ThuTucCapToc, 
        YeuCauHoaDon: newServiceForm.YeuCauHoaDon,
        GhiChu: newServiceForm.GhiChu || "",
        NguoiPhuTrachId: newServiceForm.NguoiPhuTrachId,
        DoanhThuTruocChietKhau: rawDoanhThu,
        Vi: rawVi, 
        MaDichVu: "" // Gửi rỗng để Backend tự sinh mã
      };

      // 4. Gọi API tạo dịch vụ
      const res = await fetch(`${API_BASE}/b2b/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      
      if (json.success) {
        // [NEW] Hiển thị mã dịch vụ vừa sinh ra
        const newCode = json.data?.ServiceID || "Đã sinh mã";
        await MySwal.fire({
          icon: 'success',
          title: 'Duyệt thành công!',
          text: `Dịch vụ đã được tạo với mã: ${newCode}`,
          confirmButtonColor: '#22c55e'
        });

        setShowAddServiceModal(false);
        loadServices(1); 
      } else {
        showToast(json.message, "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Lỗi kết nối server", "error");
    } finally {
      setLoading(false);
    }
  };
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

  const [currentPage, setCurrentPage] = useState({
    pending: 1, approved: 1, rejected: 1, services: 1
  });
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [hasNewRequest, setHasNewRequest] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [editingRows, setEditingRows] = useState({
    pending: {}, approved: {}, services: {}
  });

const translations = {
  vi: {
    pendingTab: "Danh sách chờ duyệt",
    approvedTab: "Danh sách đã duyệt",
    rejectedTab: "Danh sách từ chối",
    servicesTab: "Danh sách dịch vụ",
    addServiceBtn: "+ Thêm dịch vụ",
    stt: "STT",
    tenDN: "Tên Doanh Nghiệp",
    soDKKD: "Số ĐKKD",
    nguoiDaiDien: "Người Đại Diện Pháp Luật",
    ngayDangKy: "Ngày Đăng Ký",
    tongDoanhThu: "Tổng Doanh Thu",
    lyDoTuChoi: "Lý do từ chối",
    dichVu: "Dịch Vụ",
    giayPhep: "Giấy Phép ĐKKD",
    email: "Email",
    soDienThoai: "Số Điện Thoai",
    nganhNgheChinh: "Ngành Nghề Chính",
    diaChi: "Địa Chỉ",
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
    suDungVi: "Sử dụng ví",
    hanhDong: "Hành động",
    msgWalletLimit: "Số tiền ví không được quá 2.000.000"
  },
  en: {
    pendingTab: "Pending List",
    approvedTab: "Approved List",
    rejectedTab: "Rejected List",
    servicesTab: "Services List",
    addServiceBtn: "+ Add Service",
    stt: "No.",
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
    suDungVi: "Wallet Usage",
    hanhDong: "Actions",
    msgWalletLimit: "Wallet usage cannot exceed 2,000,000"
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
          walletUsage: item.Vi,
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

    if (!serviceData || serviceData.length === 0) return 0; 
    
    return serviceData
      .filter(r => String(r.companyId) === String(companyId)) 
      .reduce((sum, r) => {
        const val = r.revenueAfter; 
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
        cancelEditing("approved", item.ID);
        loadServices(currentPage.services);
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
    // 1. Hiển thị Popup nhập lý do từ chối
    const { value: reason } = await MySwal.fire({
      title: "Từ chối doanh nghiệp",
      input: "textarea",
      inputLabel: `Nhập lý do từ chối cho: ${item.TenDoanhNghiep}`,
      inputPlaceholder: "Ví dụ: Sai thông tin ĐKKD, hồ sơ mờ...",
      inputAttributes: {
        "aria-label": "Nhập lý do từ chối"
      },
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Xác nhận từ chối",
      cancelButtonText: "Hủy",
      inputValidator: (value) => {
        if (!value || value.trim() === "") {
          return "Bạn bắt buộc phải nhập lý do!";
        }
      }
    });

    // Nếu người dùng bấm Hủy hoặc không nhập gì thì dừng
    if (!reason) return;

    try {
      // 2. Gọi API từ chối kèm theo lý do vừa nhập
      const res = await fetch(`${API_BASE}/b2b/pending/${item.ID}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason }) // Gửi lý do lấy từ popup
      });

      const json = await res.json();
      
      if (json.success) {
        showToast("Đã từ chối doanh nghiệp", "success");
        // Xóa dòng đó khỏi bảng Pending ngay lập tức
        setPendingData(prev => prev.filter(i => i.ID !== item.ID));
        
        // (Tùy chọn) Reload lại tab Rejected để cập nhật số liệu nếu cần
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

   
    const safeNum = (val) => parseFloat(String(val).replace(/\./g, "")) || 0;

    if (field === "revenueBefore") {
      const raw = unformatNumber(value);
      updated.revenueBefore = raw;
      const calc = calculateServiceValues(raw, updated.discountRate, updated.walletUsage);
      updated.discountAmount = calc.discountAmount;
      updated.revenueAfter = calc.revenueAfter;
      updated.totalRevenue = calc.totalRevenue;

    } else if (field === "discountRate") {
      updated.discountRate = value;
      const calc = calculateServiceValues(updated.revenueBefore, value, updated.walletUsage);
      updated.discountAmount = calc.discountAmount;
      updated.revenueAfter = calc.revenueAfter;
      updated.totalRevenue = calc.totalRevenue;

    } else if (field === "walletUsage") { 
      
      let rawWallet = unformatNumber(value);

     
      if (rawWallet > 2000000) {
        showToast("Giới hạn sử dụng ví tối đa là 2.000.000", "warning");
        rawWallet = 2000000;
      }

      updated.walletUsage = rawWallet;
      const calc = calculateServiceValues(updated.revenueBefore, updated.discountRate, rawWallet);
      updated.discountAmount = calc.discountAmount;
      updated.revenueAfter = calc.revenueAfter;
      updated.totalRevenue = calc.totalRevenue;

    } else {
      updated[field] = value;
    }
    return updated;
  }));
};


  //   const newId = Date.now();
  //   const uiId = `new_${newId}`; 
  //   const newRecord = {
  //     id: newId, 
  //     uiId: uiId,
  //     companyId: "", serviceType: "", serviceName: "", code: "", startDate: "", endDate: "",
  //     revenueBefore: "", discountRate: "0", discountAmount: "0", revenueAfter: "0", totalRevenue: "0",walletUsage: "",
  //     isNew: true
  //   };
  //   setServiceData(prev => [...prev, newRecord]);
  //   setServiceTotal(prev => prev + 1);
  //   startEditing("services", uiId);
  // };

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
        Vi: parseNum(rec.walletUsage)
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
    // Chỉ Giám đốc hoặc Kế toán mới được xem các cột liên quan đến tiền/doanh thu
    const canViewRevenue = currentUser?.is_director || currentUser?.is_accountant;

    const safeParse = (val) => {
      if (!val) return 0;
      try {
        return isNaN(parseFloat(String(val).replace(/\./g, ""))) ? 0 : parseFloat(String(val).replace(/\./g, ""));
      } catch (e) {
        return 0;
      }
    };

    const getRealRevenue = (revenueBefore, discountRate, walletUsage) => {
      const rBefore = safeParse(revenueBefore);
      const dRate = safeParse(discountRate);
      const wUsage = safeParse(walletUsage);

      const dAmount = rBefore * (dRate / 100);
      return Math.max(0, rBefore - dAmount - wUsage);
    };

    const displayData = [...(serviceData || [])].sort((a, b) => {
      const compA = String(a.companyId || a.DoanhNghiepID || "");
      const compB = String(b.companyId || b.DoanhNghiepID || "");
      if (compA !== "" && compB === "") return -1;
      if (compA === "" && compB !== "") return 1;
      if (compA !== "" && compB !== "") return compA.localeCompare(compB);
      return (a.id || 0) - (b.id || 0);
    });

    const transparentInputStyle = {
      backgroundColor: "transparent",
      border: "none",
      outline: "none",
      width: "100%",
      height: "100%",
      textAlign: "center",
      fontSize: "12px",
      padding: "0 4px",
      boxShadow: "none"
    };

    return (
      <div>
        <div className="d-flex justify-content-end mb-2" style={{ height: 40, marginRight: 10 }}>
          {/* SỬA NÚT NÀY: Gọi handleOpenAddServiceModal thay vì handleAddNewRow */}
          <button
            className="btn btn-success btn-sm d-flex align-items-center gap-2 shadow-sm"
            onClick={handleOpenAddServiceModal} 
            style={{ fontSize: "13px", fontWeight: "600" }}
          >
            {/* Nhớ import { Plus } from "lucide-react" ở đầu file */}
            <Plus size={16} /> 
            Đăng ký dịch vụ mới
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
                style={{
                  fontSize: "12px",
                  tableLayout: "fixed",
                  width: "100%",
                  borderCollapse: "collapse",
                  border: "1px solid #dee2e6",
                }}
              >
                <thead
                  className="text-white text-center align-middle"
                  style={{ backgroundColor: "#1e3a8a", fontSize: "12px" }}
                >
                  <tr>
                    <th className="py-2 border" style={{ width: "35px" }}>{t.stt}</th>

                    {/* Điều chỉnh width linh hoạt: Nếu ẩn cột tiền thì cột tên DN giãn ra */}
                    <th
                      className="py-2 border"
                      style={{
                        width: canViewRevenue ? "180px" : "25%", 
                        minWidth: "140px"
                      }}
                    >
                      {t.chonDN}
                    </th>

                    <th className="py-2 border" style={{ width: "80px" }}>{t.loaiDichVu}</th>

                    {/* Điều chỉnh width linh hoạt: Nếu ẩn cột tiền thì cột tên DV giãn ra */}
                    <th
                      className="py-2 border"
                      style={{
                        width: canViewRevenue ? "130px" : "20%"
                      }}
                    >
                      {t.tenDichVu}
                    </th>

                    <th className="py-2 border" style={{ width: "80px" }}>{t.maDichVu}</th>
                    <th className="py-2 border" style={{ width: "90px" }}>{t.ngayBatDau}</th>
                    <th className="py-2 border" style={{ width: "90px" }}>{t.ngayKetThuc}</th>

                    {/* Chỉ hiện các cột tài chính nếu là GĐ hoặc KT */}
                    {canViewRevenue && (
                      <>
                        <th className="py-2 border" style={{ width: "90px" }}>{t.doanhThuTruoc}</th>
                        <th className="py-2 border" style={{ width: "90px" }}>{t.suDungVi}</th>
                        <th className="py-2 border" style={{ width: "60px" }}>{t.mucChietKhau}</th>
                        <th className="py-2 border" style={{ width: "80px" }}>{t.soTienChietKhau}</th>
                        <th className="py-2 border" style={{ width: "100px" }}>{t.doanhThuSau}</th>
                        <th className="py-2 border" style={{ width: "110px" }}>{t.tongDoanhThuTichLuy}</th>
                      </>
                    )}

                    <th className="py-2 border" style={{ width: "80px" }}>{t.hanhDong}</th>
                  </tr>
                </thead>
                <tbody>
                  {displayData && displayData.length > 0 ? (
                    displayData.map((rec, idx) => {
                      const globalIndex = idx + 1 + (currentPage.services - 1) * 20;
                      const currentRowKey = rec.uiId;
                      const isEditing = editingRows.services[currentRowKey];

                      // Tính toán
                      const revenueBeforeNum = safeParse(rec.revenueBefore || 0);
                      const discountRateNum = safeParse(rec.discountRate || 0);
                      const walletUsageNum = safeParse(rec.walletUsage || 0);
                      const calculatedDiscountAmount = revenueBeforeNum * (discountRateNum / 100);
                      const realRevenueAfter = Math.max(0, revenueBeforeNum - calculatedDiscountAmount - walletUsageNum);

                      const rowBackgroundColor = rec.isNew ? "#dcfce7" : (isEditing ? "#fff9c4" : "transparent");

                      const cellStyle = {
                        backgroundColor: rowBackgroundColor,
                        height: "30px",
                        padding: 0,
                        verticalAlign: "middle"
                      };

                      const currentCompanyId = String(rec.companyId || rec.DoanhNghiepID || "");
                      const prevCompanyId = idx > 0
                        ? String(displayData[idx - 1].companyId || displayData[idx - 1].DoanhNghiepID || "")
                        : null;

                      const isGroupEditing = currentCompanyId &&
                        displayData.some((d) => String(d.companyId || d.DoanhNghiepID || "") === currentCompanyId && editingRows.services[d.uiId]);

                      let shouldRenderTotalCell = false;
                      let rowSpan = 1;
                      let groupTotalRevenue = 0;

                      // Logic gộp hàng (RowSpan)
                      if (!currentCompanyId || currentCompanyId === "" || isGroupEditing) {
                        shouldRenderTotalCell = true;
                        rowSpan = 1;
                        groupTotalRevenue = realRevenueAfter;
                      } else {
                        const isFirstOfGroup = idx === 0 || currentCompanyId !== prevCompanyId;
                        if (isFirstOfGroup) {
                          shouldRenderTotalCell = true;
                          groupTotalRevenue = realRevenueAfter;
                          for (let i = idx + 1; i < displayData.length; i++) {
                            const nextRec = displayData[i];
                            if (String(nextRec.companyId || nextRec.DoanhNghiepID || "") !== currentCompanyId) break;
                            rowSpan++;
                            const nextRevenue = getRealRevenue(
                              nextRec.revenueBefore || nextRec.DoanhThuTruocChietKhau,
                              nextRec.discountRate || nextRec.MucChietKhau,
                              nextRec.walletUsage || nextRec.Vi
                            );
                            groupTotalRevenue += nextRevenue;
                          }
                        }
                      }

                      const selectedCompany = approvedList.find((c) => String(c.ID) === currentCompanyId);
                      let serviceOptions = [];
                      if (selectedCompany) {
                        if (selectedCompany.DichVu) serviceOptions.push(...selectedCompany.DichVu.split(",").map((s) => s.trim()));
                        if (selectedCompany.DichVuKhac) serviceOptions.push(...selectedCompany.DichVuKhac.split(",").map((s) => s.trim()));
                      }
                      serviceOptions = [...new Set(serviceOptions)].filter(Boolean);

                      const handleRecordChangeWithCalc = (field, value) => {
                        let rawValue = 0;
                        if (value) {
                          rawValue = isNaN(parseFloat(String(value).replace(/\./g, "")))
                            ? 0
                            : parseFloat(String(value).replace(/\./g, ""));
                        }
                        if (field === 'walletUsage' && rawValue > 2000000) {
                          showToast(t.msgWalletLimit, "error");
                          value = 0;
                        }
                        handleRecordChange(currentRowKey, field, value);

                        if (['revenueBefore', 'discountRate', 'walletUsage'].includes(field)) {
                          const currentRec = { ...rec, [field]: value };
                          const rBefore = safeParse(currentRec.revenueBefore || 0);
                          const dRate = safeParse(currentRec.discountRate || 0);
                          const wUsage = safeParse(currentRec.walletUsage || 0);
                          const newDiscountAmt = rBefore * (dRate / 100);
                          const newRevenueAfter = Math.max(0, rBefore - newDiscountAmt - wUsage);
                          
                          handleRecordChange(currentRowKey, 'discountAmount', newDiscountAmt);
                          handleRecordChange(currentRowKey, 'revenueAfter', newRevenueAfter);
                        }
                      };

                      return (
                        <tr key={currentRowKey} className={isEditing || rec.isNew ? "" : "bg-white hover:bg-gray-50"}>
                          <td className="text-center border p-0 align-middle">{globalIndex}</td>

                          {shouldRenderTotalCell && (
                            <td
                              className="border p-0 align-middle"
                              rowSpan={rowSpan}
                              style={{
                                ...cellStyle,
                                padding: "2px 4px",
                                backgroundColor: rec.isNew ? "#dcfce7" : (isEditing ? "#fff9c4" : "#fff"),
                                position: "relative",
                                zIndex: 1,
                                backgroundClip: "padding-box"
                              }}
                            >
                              {isEditing ? (
                                <select
                                  className="form-select form-select-sm shadow-none"
                                  style={{ ...transparentInputStyle, width: "100%" }}
                                  value={rec.companyId || ""}
                                  onChange={(e) => handleRecordChange(currentRowKey, "companyId", e.target.value)}
                                >
                                  <option value="">-- Chọn DN --</option>
                                  {approvedList.map((c) => (
                                    <option key={c.ID} value={c.ID}>{c.TenDoanhNghiep}</option>
                                  ))}
                                </select>
                              ) : (
                                <div className="text-center" style={{ fontSize: "12px", whiteSpace: "normal", wordBreak: "break-word" }}>
                                  {approvedList.find((c) => String(c.ID) === currentCompanyId)?.TenDoanhNghiep || "--"}
                                </div>
                              )}
                            </td>
                          )}

                          <td className="border" style={cellStyle}>
                            {isEditing ? (
                              <select
                                className="form-select form-select-sm shadow-none"
                                style={transparentInputStyle}
                                value={rec.serviceType || ""}
                                onChange={(e) => handleRecordChange(currentRowKey, "serviceType", e.target.value)}
                                disabled={!currentCompanyId}
                              >
                                <option value="">-- Chọn dịch vụ --</option>
                                {serviceOptions.map((svc, i) => (
                                  <option key={i} value={svc}>{svc}</option>
                                ))}
                              </select>
                            ) : (
                              <div className="text-center" style={{ fontSize: "12px" }}>{rec.serviceType || ""}</div>
                            )}
                          </td>

                          <td className="border" style={cellStyle}>
                            {isEditing ? (
                              <input
                                type="text"
                                className="form-control form-control-sm shadow-none"
                                style={transparentInputStyle}
                                value={rec.serviceName || ""}
                                onChange={(e) => handleRecordChange(currentRowKey, "serviceName", e.target.value)}
                                placeholder="Nhập Tên Dịch Vụ"
                              />
                            ) : (
                              <div className="text-center" style={{ fontSize: "12px" }}>{rec.serviceName || ""}</div>
                            )}
                          </td>

                          <td className="border" style={cellStyle}>
                            {isEditing ? (
                              <input
                                type="text"
                                className="form-control form-control-sm text-center shadow-none"
                                style={transparentInputStyle}
                                value={rec.code || ""}
                                onChange={(e) => handleRecordChange(currentRowKey, "code", e.target.value)}
                              />
                            ) : (
                              <div className="text-center" style={{ fontSize: "12px" }}>{rec.code || ""}</div>
                            )}
                          </td>

                          <td className="border" style={cellStyle}>
                            {isEditing ? (
                              <input
                                type="date"
                                className="form-control form-control-sm text-center shadow-none"
                                style={transparentInputStyle}
                                value={rec.startDate || ""}
                                onChange={(e) => handleRecordChange(currentRowKey, "startDate", e.target.value)}
                              />
                            ) : (
                              <div className="text-center" style={{ fontSize: "12px" }}>{rec.startDate || ""}</div>
                            )}
                          </td>

                          <td className="border" style={cellStyle}>
                            {isEditing ? (
                              <input
                                type="date"
                                className="form-control form-control-sm text-center shadow-none"
                                style={transparentInputStyle}
                                value={rec.endDate || ""}
                                onChange={(e) => handleRecordChange(currentRowKey, "endDate", e.target.value)}
                              />
                            ) : (
                              <div className="text-center" style={{ fontSize: "12px" }}>{rec.endDate || ""}</div>
                            )}
                          </td>

                          
                          {canViewRevenue && (
                            <>
                              <td className="border" style={{ ...cellStyle, width: "100px" }}>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    className="form-control form-control-sm shadow-none"
                                    style={transparentInputStyle}
                                    value={rec.revenueBefore === "" ? "" : formatNumber(rec.revenueBefore)}
                                    onChange={(e) => handleRecordChangeWithCalc("revenueBefore", e.target.value)}
                                  />
                                ) : (
                                  <div className="text-center" style={{ fontSize: "12px" }}>{formatNumber(rec.revenueBefore || "")}</div>
                                )}
                              </td>

                              <td className="border" style={cellStyle}>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    className="form-control form-control-sm shadow-none"
                                    style={{ ...transparentInputStyle, fontWeight: "500" }}
                                    value={rec.walletUsage ? formatNumber(rec.walletUsage) : ""}
                                    onChange={(e) => handleRecordChangeWithCalc("walletUsage", e.target.value)}
                                  />
                                ) : (
                                  <div className="text-center" style={{ fontSize: "12px", color: rec.walletUsage ? "red" : "inherit", fontWeight: 500 }}>
                                    {formatNumber(rec.walletUsage || 0)}
                                  </div>
                                )}
                              </td>

                              <td className="border" style={cellStyle}>
                                {isEditing ? (
                                  <select
                                    className="form-select form-select-sm text-center shadow-none"
                                    style={{ ...transparentInputStyle, padding: 0 }}
                                    value={rec.discountRate || ""}
                                    onChange={(e) => handleRecordChangeWithCalc("discountRate", e.target.value)}
                                  >
                                    <option value="">%</option>
                                    <option value="5">5%</option>
                                    <option value="10">10%</option>
                                    <option value="12">12%</option>
                                    <option value="15">15%</option>
                                    <option value="17">17%</option>
                                    <option value="20">20%</option>
                                  </select>
                                ) : (
                                  <div className="text-center" style={{ fontSize: "12px" }}>{rec.discountRate ? `${rec.discountRate}%` : "--"}</div>
                                )}
                              </td>

                              <td className="align-middle border px-2" style={{ ...cellStyle, fontSize: "12px", textAlign: "center" }}>
                                {formatNumber(calculatedDiscountAmount)}
                              </td>

                              <td className="align-middle fw-bold border px-2 text-primary" style={{ ...cellStyle, fontSize: "12px", textAlign: "center" }}>
                                {formatNumber(realRevenueAfter)}
                              </td>

                              {shouldRenderTotalCell && (
                                <td
                                  rowSpan={rowSpan}
                                  className="text-center align-middle fw-bold border text-primary"
                                  style={{
                                    ...cellStyle,
                                    backgroundColor: rec.isNew ? "#dcfce7" : (isEditing ? "#fff9c4" : "#fff"),
                                    fontSize: "12px",
                                    position: "relative",
                                    zIndex: 1,
                                    backgroundClip: "padding-box"
                                  }}
                                >
                                  {formatNumber(groupTotalRevenue)}
                                </td>
                              )}
                            </>
                          )}

                          <td className="text-center border p-1 align-middle" style={{ backgroundColor: "white" }}>
                            <div className="d-flex gap-1 justify-content-center">
                              {isEditing ? (
                                <>
                                  <button
                                    className="btn btn-sm"
                                    style={{ backgroundColor: "#2563eb", color: "#fff", width: 36, height: 36, borderRadius: 6 }}
                                    onClick={() => saveServiceRow(rec)}
                                  >
                                    <Save size={17} strokeWidth={2.3} />
                                  </button>
                                  <button
                                    className="btn btn-sm"
                                    style={{ backgroundColor: "#6b7280", color: "#fff", width: 36, height: 36, borderRadius: 6 }}
                                    onClick={() => cancelEditing("services", currentRowKey)}
                                  >
                                    <XCircle size={17} strokeWidth={2.3} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    className="btn btn-sm"
                                    style={{ backgroundColor: "#f59e0b", color: "#fff", width: 36, height: 36, borderRadius: 6 }}
                                    onClick={() => startEditing("services", currentRowKey)}
                                  >
                                    <Edit size={17} strokeWidth={2.3} />
                                  </button>
                                  <button
                                    className="btn btn-sm"
                                    style={{ backgroundColor: "#ef4444", color: "#fff", width: 36, height: 36, borderRadius: 6 }}
                                    onClick={() => deleteServiceRow(rec.id || rec.ID, rec.isNew)}
                                  >
                                    <Trash2 size={17} strokeWidth={2.3} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      {/* Điều chỉnh colSpan chính xác: 14 nếu có full quyền, 8 nếu chỉ là admin thường */}
                      <td colSpan={canViewRevenue ? 14 : 8} className="text-center py-4 text-muted border">
                        Chưa có dữ liệu dịch vụ
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              current={currentPage.services}
              total={serviceTotal}
              pageSize={20}
              currentLanguage={currentLanguage}
              onChange={(page) => handlePageChange("services", page)}
            />
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
      <Pagination currentLanguage={currentLanguage} current={currentPage.rejected} total={rejectedTotal} pageSize={20} onChange={(page) => handlePageChange("rejected", page)} />
    </div>
  );
const saveEditing = (item, tab) => {
  if (tab === "pending") return savePendingRow(item);
  if (tab === "approved") return saveApprovedRow(item);

  showToast("Không xác định được tab để lưu!", "error");
};
const renderPendingApprovedTab = () => {

  const totalColumns = 9;

  return (
    <div className="table-responsive shadow-sm rounded overflow-hidden">
      <table
        className="table table-bordered table-sm mb-0 align-middle"
    
        style={{ fontSize: "12px", tableLayout: "fixed", width: "100%" }}
      >
        <thead
          className="text-white text-center align-middle"
          style={{ backgroundColor: "#1e3a8a", fontSize: "12px" }}
        >
          <tr>
            <th style={{ width: "40px" }}>{t.stt}</th>
            <th style={{ width: "160px" }}>{t.tenDN}</th>
            <th style={{ width: "90px" }}>{t.soDKKD}</th>
            <th style={{ width: "110px" }}>{t.nguoiDaiDien}</th>

            {activeTab === "pending" && (
              <>
                <th style={{ width: "100px" }}>{t.dichVu}</th>
                <th style={{ width: "70px" }}>{t.giayPhep}</th>
              </>
            )}

            {activeTab === "approved" && (
              <>
                <th style={{ width: "120px" }}>{t.nganhNgheChinh}</th>
                <th style={{ width: "150px" }}>{t.diaChi}</th>
              </>
            )}

            <th style={{ width: "90px" }}>{t.ngayDangKy}</th>
            {activeTab === "approved" && (
              <th style={{ width: "100px" }}>{t.tongDoanhThuTichLuy}</th>
            )}
            {/* {activeTab === "pending" && (
              <th style={{ width: "120px" }}>{t.lyDoTuChoi}</th>
            )} */}
            <th style={{ width: "90px" }}>{t.hanhDong}</th>
          </tr>
        </thead>

        <tbody>
          {(activeTab === "pending" ? pendingData : approvedData).map(
            (item, idx) => {
              const globalIndex = idx + 1 + (currentPage[activeTab] - 1) * 20;
              const isEditing = editingRows[activeTab][item.ID];
              const isExpanded = expandedRowId === item.ID;

              const rowStyle = isEditing ? { backgroundColor: "#fff9c4" } : {};
              
              // Style chung cho ô view và input
              const viewStyle = { fontSize: "12px", height: "30px", lineHeight: "30px", textAlign: "center", padding: "0 4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
              const inputStyle = { width: "100%", height: "100%", border: "none", outline: "none", textAlign: "center", background: "transparent", fontSize: "12px" };

              return (
                <React.Fragment key={item.ID}>
                  <tr style={{ height: "30px", ...rowStyle }} className={`bg-white hover:bg-gray-50 ${isExpanded ? "border-bottom-0" : ""}`}>
                    <td className="text-center border">{globalIndex}</td>
                    <td className="border">{isEditing ? <input style={inputStyle} value={item.TenDoanhNghiep} onChange={(e) => handleCellEdit("TenDoanhNghiep", item, e)} /> : <div style={viewStyle} title={item.TenDoanhNghiep}>{item.TenDoanhNghiep}</div>}</td>
                    <td className="border">{isEditing ? <input style={inputStyle} value={item.SoDKKD} onChange={(e) => handleCellEdit("SoDKKD", item, e)} /> : <div style={viewStyle}>{item.SoDKKD}</div>}</td>
                    <td className="border">{isEditing ? <input style={inputStyle} value={item.NguoiDaiDien} onChange={(e) => handleCellEdit("NguoiDaiDien", item, e)} /> : <div style={viewStyle}>{item.NguoiDaiDien}</div>}</td>

                    {activeTab === "pending" && (
                      <>
                        <td className="border">{isEditing ? <input style={inputStyle} value={item.DichVu || ""} onChange={(e) => handlePendingChange(item.ID, "DichVu", e.target.value)} /> : <div style={viewStyle}>{item.DichVu || ""}</div>}</td>
                        <td className="border text-center p-0 align-middle">
                          {item.PdfPath ? (
                            <div className="d-flex justify-content-center align-items-center gap-2 h-100">
                              <a href={item.PdfPath} target="_blank" rel="noreferrer" className="text-secondary" title="Mở tab mới">
                                <FileText size={16} />
                              </a>
                              <button 
                                className="btn btn-sm p-0 border-0" 
                                onClick={() => toggleExpand(item.ID)}
                                title={isExpanded ? "Đóng" : "Xem nhanh"}
                                style={{ color: isExpanded ? "#ef4444" : "#2563eb", display: "flex", alignItems: "center" }}
                              >
                                {isExpanded ? <EyeOff size={18} /> : <Eye size={18} />}
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: "11px" }}>—</span>
                          )}
                        </td>
                      </>
                    )}

                    {activeTab === "approved" && (
                      <>
                        <td className="border">{isEditing ? <input style={inputStyle} value={item.NganhNgheChinh || ""} onChange={(e) => handleApprovedChange(item.ID, "NganhNgheChinh", e.target.value)} /> : <div style={viewStyle}>{item.NganhNgheChinh || ""}</div>}</td>
                        <td className="border">{isEditing ? <input style={inputStyle} value={item.DiaChi || ""} onChange={(e) => handleApprovedChange(item.ID, "DiaChi", e.target.value)} /> : <div style={viewStyle}>{item.DiaChi || ""}</div>}</td>
                      </>
                    )}

                    <td className="text-center border">{formatDateTime(item.NgayTao || item.NgayDangKyB2B)}</td>
                    {activeTab === "approved" && <td className="text-center border fw-bold text-primary">{formatNumber(calculateCompanyTotalRevenue(item.ID))}</td>}
                    {/* {activeTab === "pending" && <td className="border">{isEditing ? <input style={inputStyle} value={item.rejectionReason || ""} onChange={(e) => handlePendingChange(item.ID, "rejectionReason", e.target.value)} /> : <div style={viewStyle}>{item.rejectionReason || ""}</div>}</td>} */}
                    
                    <td className="text-center border">
                      <div className="d-flex gap-1 justify-content-center">
                        {isEditing ? (
                          <>
                            <button className="btn btn-sm p-1" style={{ backgroundColor: "#2563eb", color: "#fff" }} onClick={() => saveEditing(item, activeTab)}><Save size={14} /></button>
                            <button className="btn btn-sm p-1" style={{ backgroundColor: "#6b7280", color: "#fff" }} onClick={() => cancelEditing(activeTab, item.ID)}><XCircle size={14} /></button>
                          </>
                        ) : (
                          <>
                            <button className="btn btn-sm p-1" style={{ backgroundColor: "#f59e0b", color: "#fff" }} onClick={() => startEditing(activeTab, item.ID)}><Edit size={14} /></button>
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

                  {/* DÒNG EXPAND (PDF) */}
                  {activeTab === "pending" && isExpanded && item.PdfPath && (
                    <tr className="bg-white">
                      {/* QUAN TRỌNG: colSpan={totalColumns} để khớp hoàn toàn */}
                      <td colSpan={totalColumns} className="border p-0"> 
                        <div className="p-3 bg-light border-bottom">
                           <div className="d-flex flex-column align-items-center">
                             <div className="mb-2 fw-bold text-primary">
                               Giấy phép ĐKKD: {item.TenDoanhNghiep}
                             </div>
                             <div style={{ width: "100%", height: "650px", border: "1px solid #ccc", borderRadius: "4px", backgroundColor: "#525659" }}>
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
        pageSize={20}
        currentLanguage={currentLanguage}
        onChange={(page) => handlePageChange(activeTab, page)}
      />
    </div>
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
    
      {showAddServiceModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
          <div className="bg-white rounded shadow-lg p-4" style={{ width: "650px", maxWidth: "90%", maxHeight: "90vh", overflowY: "auto" }}>
            
            {/* Header Modal */}
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
              <h5 className="fw-bold m-0 text-center flex-grow-1" style={{ color: "#333" }}>Đăng ký dịch vụ mới (B2B)</h5>
              <button className="btn btn-sm btn-light rounded-circle" onClick={() => setShowAddServiceModal(false)}>
                 <X size={20} />
              </button>
            </div>
            
            <div className="text-center text-muted small mb-4">Hệ thống quản lý dịch vụ của One Pass</div>

            <div className="row g-3">
              {/* Doanh nghiệp & Số ĐKKD */}
              <div className="col-md-6">
                <label className="form-label small fw-bold text-dark">Tên doanh nghiệp <span className="text-danger">*</span></label>
                <select className="form-select form-select-sm" name="DoanhNghiepID" value={newServiceForm.DoanhNghiepID} onChange={handleModalChange}>
                  <option value="">-- Chọn doanh nghiệp --</option>
                  {approvedList.map(c => <option key={c.ID} value={c.ID}>{c.TenDoanhNghiep}</option>)}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-bold text-dark">Số đăng ký kinh doanh <span className="text-danger">*</span></label>
                <input type="text" className="form-control form-control-sm bg-light" value={newServiceForm.SoDKKD} readOnly />
              </div>

              {/* Loại dịch vụ (Dropdown từ danh sách cty) */}
              <div className="col-md-6">
                <label className="form-label small fw-bold text-dark">Loại dịch vụ <span className="text-danger">*</span></label>
                <select 
                  className="form-select form-select-sm" 
                  name="LoaiDichVu" 
                  value={newServiceForm.LoaiDichVu} 
                  onChange={handleModalChange}
                  disabled={!newServiceForm.DoanhNghiepID} // Disable nếu chưa chọn Cty
                >
                  <option value="">-- Chọn loại dịch vụ --</option>
                  {availableServices.map((svc, idx) => (
                    <option key={idx} value={svc}>{svc}</option>
                  ))}
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-bold text-dark">Tên dịch vụ chi tiết <span className="text-danger">*</span></label>
                <input type="text" className="form-control form-control-sm" name="TenDichVu" placeholder="Cấp lại hộ chiếu..." value={newServiceForm.TenDichVu} onChange={handleModalChange} />
              </div>

              {/* Ngày tháng */}
              <div className="col-md-6">
                <label className="form-label small fw-bold text-dark">Ngày bắt đầu <span className="text-danger">*</span></label>
                <input type="date" className="form-control form-control-sm" name="NgayBatDau" value={newServiceForm.NgayBatDau} onChange={handleModalChange} />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-bold text-dark">Ngày hoàn thành mong muốn <span className="text-danger">*</span></label>
                <input type="text" className="form-control form-control-sm" name="NgayHoanThanh" placeholder="2025" value={newServiceForm.NgayHoanThanh} onChange={handleModalChange} />
                <div className="form-text text-primary fst-italic" style={{fontSize: '10px'}}>Ngày hoàn thành có thể sai khác tùy thuộc vào hồ sơ.</div>
              </div>

              {/* Lựa chọn Yes/No */}
              <div className="col-md-6">
                <label className="form-label small fw-bold text-dark">Yêu cầu thủ tục cấp tốc <span className="text-danger">*</span></label>
                <div className="btn-group w-100" role="group">
                  <input type="radio" className="btn-check" name="ThuTucCapToc" id="capTocYes" value="Yes" checked={newServiceForm.ThuTucCapToc === "Yes"} onChange={handleModalChange} />
                  <label className="btn btn-outline-secondary btn-sm" htmlFor="capTocYes">Yes</label>

                  <input type="radio" className="btn-check" name="ThuTucCapToc" id="capTocNo" value="No" checked={newServiceForm.ThuTucCapToc === "No"} onChange={handleModalChange} />
                  <label className="btn btn-outline-secondary btn-sm" htmlFor="capTocNo">No</label>
                </div>
                <div className="form-text text-primary fst-italic" style={{fontSize: '10px'}}>Thời gian cấp tốc sẽ được hướng dẫn qua người phụ trách</div>
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-bold text-dark">Yêu cầu xuất hóa đơn <span className="text-danger">*</span></label>
                 <div className="btn-group w-100" role="group">
                  <input type="radio" className="btn-check" name="YeuCauHoaDon" id="hdYes" value="Yes" checked={newServiceForm.YeuCauHoaDon === "Yes"} onChange={handleModalChange} />
                  <label className="btn btn-outline-secondary btn-sm" htmlFor="hdYes">Yes</label>

                  <input type="radio" className="btn-check" name="YeuCauHoaDon" id="hdNo" value="No" checked={newServiceForm.YeuCauHoaDon === "No"} onChange={handleModalChange} />
                  <label className="btn btn-outline-secondary btn-sm" htmlFor="hdNo">No</label>
                </div>
                <div className="form-text text-primary fst-italic" style={{fontSize: '10px'}}>Hóa đơn sẽ gửi về email khi đăng ký</div>
              </div>

              {/* Doanh thu (Chỉ hiện với GĐ/KT) */}
              {(currentUser?.is_director || currentUser?.is_accountant) && (
                <>
                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-dark">Doanh thu (VND)</label>
                    <input 
                      type="text" 
                      className="form-control form-control-sm" 
                      name="DoanhThu" 
                      value={newServiceForm.DoanhThu} 
                      onChange={handleModalChange} 
                      placeholder="0" 
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-dark">Trừ ví (VND)</label>
                    <input 
                      type="text" 
                      className="form-control form-control-sm" 
                      name="Vi" 
                      value={newServiceForm.Vi} 
                      onChange={handleModalChange} 
                      placeholder="0" 
                    />
                  </div>
                </>
              )}
              
             <div className="col-12">
                 <label className="form-label small fw-bold text-dark">Ghi chú <span className="text-danger">*</span></label>
                 <input type="text" className="form-control form-control-sm" name="GhiChu" placeholder="Chiết khấu..." value={newServiceForm.GhiChu} onChange={handleModalChange} />
              </div>

              {/* Người phụ trách */}
              <div className="col-12">
                <label className="form-label small fw-bold text-dark">Chọn người phụ trách <span className="text-danger">*</span></label>
                <select className="form-select form-select-sm" name="NguoiPhuTrachId" value={newServiceForm.NguoiPhuTrachId} onChange={handleModalChange}>
                  <option value="">Chọn trong danh sách nhân viên</option>
                  {userList.map(u => <option key={u.id} value={u.id}>{u.name} ({u.username})</option>)}
                </select>
              </div>

              {/* Mật khẩu xác nhận (Đã sửa cho phép nhập) */}
              <div className="col-12">
                 <label className="form-label small fw-bold text-dark">Nhập mật khẩu để đăng ký <span className="text-danger">*</span></label>
                 <div className="input-group input-group-sm">
                    <input 
                      type={showConfirmPassword ? "text" : "password"} 
                      className="form-control" 
                      placeholder="Nhập mật khẩu admin hiện tại..." 
                      name="ConfirmPassword"
                      value={newServiceForm.ConfirmPassword}
                      onChange={handleModalChange}
                      autoComplete="new-password"
                    />
                    <span 
                      className="input-group-text bg-white" 
                      style={{cursor: "pointer"}}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </span>
                 </div>
                 <div className="form-text text-primary fst-italic" style={{fontSize: '10px'}}>
                   Nhập mật khẩu tài khoản hiện tại ({currentUser?.username}) để xác nhận.
                 </div>
              </div>

              {/* Submit Button */}
              <div className="col-12 mt-4">
                <button className="btn btn-success w-100 fw-bold shadow-sm" onClick={handleModalSubmit}>
                  Đăng ký dịch vụ mới
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
    
  );
}