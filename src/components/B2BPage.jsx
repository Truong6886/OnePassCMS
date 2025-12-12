import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import useSocketListener from "./CMSDashboard/hooks/useSocketListener";
import NotificationPanel from "./CMSDashboard/NotificationPanel";
import EditProfileModal from "./EditProfileModal";
import { showToast } from "../utils/toast";
import { Save, Trash2, XCircle, Check, FileText, Edit, Eye, EyeOff, Plus, X, ChevronDown } from "lucide-react";
import Swal from "sweetalert2";
import { authenticatedFetch } from "../utils/api";
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

const API_BASE = "https://onepasscms-backend.onrender.com/api";

export default function B2BPage() {
  const [expandedRowId, setExpandedRowId] = useState(null);
  // Hàm tách chuỗi dịch vụ thông minh (Không tách cụm có dấu phẩy đặc biệt)
  const parseServicesString = (str) => {
    if (!str) return [];
    // 1. Thay thế dấu phẩy trong các cụm từ đặc biệt bằng ký tự tạm (ví dụ dấu |)
    let temp = str.replace(/Hộ chiếu, Hộ tịch/gi, "Hộ chiếu| Hộ tịch")
                  .replace(/Khai sinh, khai tử/gi, "Khai sinh| khai tử");
    
    // 2. Tách chuỗi bằng dấu phẩy
    const parts = temp.split(',');

    // 3. Hoàn tác ký tự tạm và xóa khoảng trắng thừa
    return parts.map(s => s.trim().replace(/\|/g, ",")).filter(Boolean);
  };
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
  const [extraServices, setExtraServices] = useState([]); 
const handleChangeExtra = (index, value) => {
    const newArr = [...extraServices];
    newArr[index] = value;
    setExtraServices(newArr);
};
  const [showExtras, setShowExtras] = useState(false);
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
  const handleRemoveExtra = (index) => {
    const newArr = [...extraServices];
    newArr.splice(index, 1);
    setExtraServices(newArr);
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
    GhiChu: "",
    NguoiPhuTrachId: "",
    ConfirmPassword: ""
  });

  useEffect(() => {
    fetchUsers();
  }, []);

const fetchUsers = async () => {
  try {
   
    const res = await authenticatedFetch(`${API_BASE}/User`);
    if (!res) return;

    const json = await res.json();
    if (json.success) setUserList(json.data);
  } catch (e) { console.error("Lỗi lấy user list", e  ); }
};



  // Mở modal để chỉnh sửa (Nút Edit - Pencil)
  const handleEditService = (rec) => {
    // Tìm doanh nghiệp để lấy số ĐKKD và danh sách dịch vụ
    const company = approvedList.find(c => String(c.ID) === String(rec.companyId));
    const fullDanhMuc = rec.DanhMuc || "";
    const parts = fullDanhMuc.split(" + ");
    const mainCat = parts[0] || ""; 
    const extras = parts.slice(1);
    
if (extras.length > 0) {
    setExtraServices(extras);
    setShowExtras(true);
} else {
    setExtraServices([""]);
    setShowExtras(false);
}
    setNewServiceForm({ 
      id: rec.id, // ID dịch vụ để update
      DoanhNghiepID: rec.companyId,
      SoDKKD: company ? company.SoDKKD : (rec.soDKKD || ""),
      LoaiDichVu: rec.serviceType,
      TenDichVu: rec.serviceName,
      DanhMuc: rec.DanhMuc || "",
      NgayBatDau: rec.startDate ? rec.startDate : "",
      DanhMuc: mainCat,
      NgayHoanThanh: rec.endDate ? rec.endDate : "",
      ThuTucCapToc: (rec.package === "Cấp tốc" || rec.package === "Yes") ? "Yes" : "No",
      YeuCauHoaDon: rec.invoiceYN || "No",
      DoanhThu: rec.revenueBefore ? formatNumber(rec.revenueBefore) : "",
      Vi: rec.walletUsage ? formatNumber(rec.walletUsage) : "",
      GhiChu: rec.GhiChu || "", 
      NguoiPhuTrachId: rec.picId || "",
      ConfirmPassword: "",
      status: rec.TrangThai || rec.status || "Chờ Giám đốc duyệt"
    });

    // Populate dropdown loại dịch vụ
    if (company) {
      let services = [];
      if (company.DichVu) services.push(...company.DichVu.split(',').map(s => s.trim()));
      if (company.DichVuKhac) services.push(...company.DichVuKhac.split(',').map(s => s.trim()));
      setAvailableServices([...new Set(services)].filter(Boolean));
    } else {
        setAvailableServices([]);
    }

    setShowAddServiceModal(true);
  };

const handleOpenAddServiceModal = () => {
    const isStaff = currentUser?.is_staff && !currentUser?.is_director && !currentUser?.is_accountant && !currentUser?.is_admin;

    setExtraServices([""]);
    setShowExtras(false);
    setNewServiceForm({
      id: null,
      DoanhNghiepID: "",
      SoDKKD: "",
      LoaiDichVu: "",
      DanhMuc: "",
      TenDichVu: "",
      NgayBatDau: new Date().toISOString().split('T')[0],
      NgayHoanThanh: "",
      ThuTucCapToc: "No",
      YeuCauHoaDon: "No",
      DoanhThu: "",
      Vi: "",
      GhiChu: "",
      NguoiPhuTrachId: isStaff ? currentUser.id : "", 
      ConfirmPassword: ""
    });
    setAvailableServices([]);
    setShowAddServiceModal(true);
};
  const handleModalChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "DoanhNghiepID") {
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
    
   
    if (!verifyRes) { 
        setLoading(false); 
        return; 
    }

    const verifyJson = await verifyRes.json();
    if (!verifyJson.success) {
      setLoading(false);
      return showToast("Mật khẩu xác nhận không chính xác!", "error");
    }

   
    const canApproveB2B = currentUser?.is_director || currentUser?.perm_approve_b2b;


    const rawDoanhThu = newServiceForm.DoanhThu ? parseFloat(unformatNumber(newServiceForm.DoanhThu)) : 0;
    const rawVi = newServiceForm.Vi ? parseFloat(unformatNumber(newServiceForm.Vi)) : 0;


    let approveAction = null;

    if (newServiceForm.id) {
      const currentStatus = newServiceForm.status;
      if (canApproveB2B && currentStatus === "Chờ Kế toán duyệt") {
        approveAction = "accountant_approve";
      }
    }
  const validExtras = extraServices.filter(s => s && s.trim() !== "");
  let finalDanhMuc = newServiceForm.DanhMuc;
  if (validExtras.length > 0) {
        finalDanhMuc = `${newServiceForm.DanhMuc} + ${validExtras.join(" + ")}`;
    }
    const payload = {
      DoanhNghiepID: newServiceForm.DoanhNghiepID,
      LoaiDichVu: newServiceForm.LoaiDichVu,
      DanhMuc: finalDanhMuc,
      TenDichVu: newServiceForm.TenDichVu || "",
      DanhMuc: newServiceForm.DanhMuc,
      NgayThucHien: newServiceForm.NgayBatDau,
      NgayHoanThanh: newServiceForm.NgayHoanThanh || null,
      ThuTucCapToc: newServiceForm.ThuTucCapToc,
      YeuCauHoaDon: newServiceForm.YeuCauHoaDon,
      GhiChu: newServiceForm.GhiChu || "",
      NguoiPhuTrachId: newServiceForm.NguoiPhuTrachId,
      DoanhThuTruocChietKhau: rawDoanhThu,
      Vi: rawVi,
      approveAction: approveAction,
      userId: currentUser?.id 
    };

    // URL + METHOD
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

    if (!res) { 
        setLoading(false); 
        return; 
    }

    const json = await res.json();

    if (json.success) {
      const newCode = json.data?.ServiceID || json.newCode;

      // Hiển thị thông báo
      if (approveAction === "accountant_approve" && newCode) {
        await MySwal.fire({
          icon: "success",
          title: "Đã duyệt & Cấp mã!",
          html: `Dịch vụ đã được kích hoạt.<br/>Mã hệ thống: <b>${newCode}</b>`,
          confirmButtonColor: "#22c55e"
        });
        newServiceForm.status = "Đã duyệt";
      } 
      else {
        showToast(newServiceForm.id ? "Cập nhật thành công!" : "Đã gửi yêu cầu đăng ký!", "success");
      }

      setShowAddServiceModal(false);
      loadServices(currentPage.services || 1);
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
const B2B_SERVICE_MAPPING = {
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
  const [currentPage, setCurrentPage] = useState({
    pending: 1, approved: 1, rejected: 1, services: 1
  });
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [hasNewRequest, setHasNewRequest] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Vẫn giữ editingRows cho pending/approved
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
      chonDN: "Doanh Nghiệp",
      loaiDichVu: "Loại Dịch Vụ",
      tenDichVu: "Tên Dịch Vụ",
      maDichVu: "Mã Dịch Vụ",
      ngayBatDau: "Ngày Bắt Đầu",
      ngayKetThuc: "Ngày Kết Thúc",
      doanhThuTruoc: "Doanh Thu\nTrước Chiết Khấu",
      mucChietKhau: "Mức\nChiết Khấu",
      soTienChietKhau: "Số Tiền\nChiết Khấu",
      doanhThuSau: "Doanh Thu\nSau Chiết Khấu",
      suDungVi: "Sử dụng\nví",
      tongDoanhThuTichLuy: "Tổng Doanh Thu",
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
      chonDN: "Company",
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

  useSocketListener({ currentLanguage, setNotifications, setHasNewRequest, setShowNotification , currentUser: currentUser});

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
        authenticatedFetch(`${API_BASE}/b2b/pending`),
        authenticatedFetch(`${API_BASE}/b2b/approved`),
        authenticatedFetch(`${API_BASE}/b2b/reject`)
      ]);

 
      if (!pendingRes || !approvedRes || !rejectedRes) return;

      const p = await pendingRes.json();
      const a = await approvedRes.json();
      const r = await rejectedRes.json();

      setPendingList((p.data || []).map(item => ({ ...item, rejectionReason: "" })));
      setApprovedList(a.data || []);
      setRejectedList(r.data || []);

      loadServices(1); 
    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  };


  const loadPending = async (page = 1) => {
    const res = await authenticatedFetch(`${API_BASE}/b2b/pending?page=${page}&limit=20`);
    if (!res) return;

    const json = await res.json();
    if (json.success) { setPendingData(json.data); setPendingTotal(json.total); }
  };

  const loadApproved = async (page = 1) => {
    const res = await authenticatedFetch(`${API_BASE}/b2b/approved?page=${page}&limit=20`);
    if (!res) return; 

    const json = await res.json();
    if (json.success) { setApprovedData(json.data); setApprovedTotal(json.total); }
  };

  const loadRejected = async (page = 1) => {
    const res = await authenticatedFetch(`${API_BASE}/b2b/reject?page=${page}&limit=20`);
    if (!res) return; 

    const json = await res.json();
    if (json.success) { setRejectedData(json.data); setRejectedTotal(json.total); }
  };

  // 3. Load Services
  const loadServices = async (page = 1) => {
    try {
      setLoading(true);
      const res = await authenticatedFetch(`${API_BASE}/b2b/services?page=${page}&limit=20`);
      
      if (!res) return;

      const json = await res.json();
      if (json.success) {
        const formattedData = (json.data || []).map((item, index) => ({
          ...item,
          id: item.ID,
          uiId: item.ID ? `server_${item.ID}` : `temp_${index}_${Date.now()}`,
          companyId: item.DoanhNghiepID,
          companyName: item.TenDoanhNghiep,
          soDKKD: item.SoDKKD,
          serviceType: item.LoaiDichVu,
          serviceName: item.TenDichVu,
          package: item.GoiDichVu, 
          invoiceYN: item.YeuCauHoaDon, 
          invoiceUrl: item.InvoiceUrl, 
          picId: item.NguoiPhuTrachId, 
          picName: item.NguoiPhuTrach ? (item.NguoiPhuTrach.username || item.NguoiPhuTrach.name) : "", 
          code: item.MaDichVu,
          startDate: item.NgayThucHien?.split("T")[0],
          endDate: item.NgayHoanThanh?.split("T")[0],
          revenueBefore: item.DoanhThuTruocChietKhau,
          discountRate: item.MucChietKhau,
          discountAmount: item.SoTienChietKhau,
          revenueAfter: item.DoanhThuSauChietKhau,
          totalRevenue: item.TongDoanhThuTichLuy,
          walletUsage: item.Vi,
          status: item.TrangThai,
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
  };

  const handlePendingChange = (id, field, value) => {
    setPendingData(prev => prev.map(item => item.ID === id ? { ...item, [field]: value } : item));
  };
  const handleApprovedChange = (id, field, value) => {
    setApprovedData(prev => prev.map(item => item.ID === id ? { ...item, [field]: value } : item));
  };

const handleApprove = (service) => {
  // Tìm doanh nghiệp để lấy thông tin đầy đủ
  const company = approvedList.find(c => String(c.ID) === String(service.companyId));
  
  // Lấy danh sách dịch vụ từ doanh nghiệp
  let availableServices = [];
  if (company) {
    if (company.DichVu) availableServices.push(...company.DichVu.split(',').map(s => s.trim()));
    if (company.DichVuKhac) availableServices.push(...company.DichVuKhac.split(',').map(s => s.trim()));
    availableServices = [...new Set(availableServices)].filter(Boolean);
  }
  
  setSelectedService({
    ...service,
    LoaiDichVu: service.serviceType,
    TenDichVu: service.serviceName,
    NgayBatDau: service.startDate,
    NgayHoanThanh: service.endDate,
    DoanhThu: service.revenueBefore ? formatNumber(service.revenueBefore) : "",
    Vi: service.walletUsage ? formatNumber(service.walletUsage) : "",
    GhiChu: service.GhiChu || "",
    NguoiPhuTrachId: service.picId || "",
    ConfirmPassword: "",
    GoiDichVu: service.package === "Cấp tốc" ? "Yes" : "No",
    YeuCauHoaDon: service.invoiceYN || "No"
  });
  
  setAvailableServices(availableServices);
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

      const verifyJson = await verifyRes.json();
      if (!verifyJson.success) {
        setLoading(false);
        return showToast("Mật khẩu không chính xác!", "error");
      }

      const rawDoanhThu = selectedService.DoanhThu ? parseFloat(unformatNumber(selectedService.DoanhThu)) : 0;
      const rawVi = selectedService.Vi ? parseFloat(unformatNumber(selectedService.Vi)) : 0;

      const payload = {
        LoaiDichVu: selectedService.LoaiDichVu || selectedService.serviceType,
        TenDichVu: selectedService.TenDichVu || selectedService.serviceName,
        NgayThucHien: selectedService.NgayBatDau || selectedService.startDate,
        NgayHoanThanh: selectedService.NgayHoanThanh || selectedService.endDate,
        GoiDichVu: selectedService.GoiDichVu === "Yes" ? "Cấp tốc" : "Thông thường",
        YeuCauHoaDon: selectedService.YeuCauHoaDon,
        GhiChu: selectedService.GhiChu || "",
        NguoiPhuTrachId: selectedService.NguoiPhuTrachId || selectedService.picId,
        DoanhThuTruocChietKhau: rawDoanhThu,
        Vi: rawVi,
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
        await MySwal.fire({
          icon: "success",
          title: "Duyệt thành công!",
          html: `Mã dịch vụ được cấp: <b>${json.newCode || json.code}</b>`,
          confirmButtonColor: "#22c55e"
        });

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
          NguoiDaiDien: item.NguoiDaiDien, NganhNgheChinh: item.NganhNgheChinh, DiaChi: item.DiaChi
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
      }
    });

    if (!reason) return;

    try {
      const res = await authenticatedFetch(`${API_BASE}/b2b/pending/${item.ID}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason: reason }) 
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
      } else { showToast(json.message, "error"); }
    } catch (e) { showToast("Lỗi server", "error"); }
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
      const res = await authenticatedFetch(`${API_BASE}/b2b/services/${id}`, { method: "DELETE" });
      if (!res) return;

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

  // --- RENDER SERVICES TAB (MODIFIED) ---
const renderServicesTab = () => {
    const canApproveB2B = currentUser?.is_director || currentUser?.perm_approve_b2b;
    const canViewRevenue = currentUser?.is_director || currentUser?.is_accountant || currentUser?.perm_view_revenue;
    
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

    return (
      <div>
        <div className="d-flex justify-content-end mb-2" style={{ height: 40, marginRight: 10 }}>
          <button
            className="btn btn-success btn-sm d-flex align-items-center gap-2 shadow-sm"
            onClick={handleOpenAddServiceModal} 
            style={{ fontSize: "13px", fontWeight: "600" }}
          >
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
            <div className="table-responsive shadow-sm rounded">
              <table
                className="table table-bordered table-sm mb-0 align-middle"
                style={{
                  fontSize: "12px",
                  tableLayout: "fixed",
                 
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

                      <th
                        className="py-2 border"
                        style={{
                          width: canViewRevenue ? "138px" : "10%", 
                          minWidth: "100px"
                        }}
                      >
                        {t.chonDN}
                      </th>
                      <th className="py-2 border" style={{ width: "90px" }}>Số ĐKKD</th>
                      <th className="py-2 border" style={{ width: "120px" }}>{t.loaiDichVu}</th>

                      <th
                        className="py-2 border"
                        style={{
                          width: canViewRevenue ? "150px" : "10%"
                        }}
                      >
                        {t.tenDichVu}
                      </th>

                      <th className="py-2 border" style={{ width: "130px" }}>{t.maDichVu}</th>
                      
                      <th className="py-2 border" style={{ width: "118px" }}>Người Phụ Trách</th>  
                      <th className="py-2 border" style={{ width: "100px" }}>{t.ngayBatDau}</th>
                      <th className="py-2 border" style={{ width: "110px" }}>{t.ngayKetThuc}</th>
                        <th className="py-2 border" style={{ width: "100px" }}>Gói</th>
                      <th className="py-2 border" style={{ width: "90px" }}>Invoice Y/N</th>
                      <th className="py-2 border" style={{ width: "90px" }} title="Link Invoice">Invoice</th>

                      {canViewRevenue && (
                        <>
                          {/* --- CẬP NHẬT CÁC CỘT DƯỚI ĐÂY (Thêm whiteSpace: "pre-wrap") --- */}
                          <th className="py-2 border" style={{ width: "110px", whiteSpace: "pre-wrap", lineHeight: "1.2" }}>{t.doanhThuTruoc}</th>
                          <th className="py-2 border" style={{ width: "90px", whiteSpace: "pre-wrap", lineHeight: "1.2" }}>{t.suDungVi}</th>
                          <th className="py-2 border" style={{ width: "70px", whiteSpace: "pre-wrap", lineHeight: "1.2" }}>{t.mucChietKhau}</th>
                          <th className="py-2 border" style={{ width: "80px", whiteSpace: "pre-wrap", lineHeight: "1.2" }}>{t.soTienChietKhau}</th>
                          <th className="py-2 border" style={{ width: "100px", whiteSpace: "pre-wrap", lineHeight: "1.2" }}>{t.doanhThuSau}</th>
                          {/* --------------------------------------------------------------- */}
                          
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
                      const hasCode = rec.code && rec.code.trim() !== "";
                      
                      const revenueBeforeNum = safeParse(rec.revenueBefore || 0);
                      const discountRateNum = safeParse(rec.discountRate || 0);
                      const walletUsageNum = safeParse(rec.walletUsage || 0);
                      const calculatedDiscountAmount = revenueBeforeNum * (discountRateNum / 100);
                      const realRevenueAfter = Math.max(0, revenueBeforeNum - calculatedDiscountAmount - walletUsageNum);

                      const rowBackgroundColor = rec.isNew ? "#dcfce7" : "transparent";

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

                      let shouldRenderTotalCell = false;
                      let rowSpan = 1;
                      let groupTotalRevenue = 0;

                      if (!currentCompanyId || currentCompanyId === "") {
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

                      return (
                        <tr key={currentRowKey} className={rec.isNew ? "" : "bg-white hover:bg-gray-50"}>
                          <td className="text-center border p-0 align-middle">{globalIndex}</td>
                          {shouldRenderTotalCell && (
                            <td
                              className="border p-0 align-middle"
                              rowSpan={rowSpan}
                              style={{
                                ...cellStyle,
                                padding: "2px 4px",
                                backgroundColor: rec.isNew ? "#dcfce7" : "#fff",
                                position: "relative",
                                zIndex: 1,
                                backgroundClip: "padding-box"
                              }}
                            >
                                {/* [SỬA] Dùng trực tiếp rec.companyName thay vì tìm trong approvedList */}
                                <div className="text-center" style={{ fontSize: "12px", whiteSpace: "normal", wordBreak: "break-word" }}>
                                  {rec.companyName || "--"}
                                </div>
                            </td>
                          )}
                          {shouldRenderTotalCell && (
                             <td className="border p-0 align-middle" rowSpan={rowSpan} style={{
                                ...cellStyle,
                                padding: "2px 4px",
                                backgroundColor: rec.isNew ? "#dcfce7" : "#fff",
                                position: "relative",
                                zIndex: 1,
                                backgroundClip: "padding-box"
                              }}>
                                {/* [SỬA] Dùng trực tiếp rec.soDKKD thay vì tìm trong approvedList */}
                                <div className="text-center" style={{ fontSize: "12px" }}>
                                   {rec.soDKKD || "--"}
                                </div>
                             </td>
                          )}
                          <td className="border" style={cellStyle}>
                              <div className="text-center" style={{ fontSize: "12px" }}>{rec.serviceType || ""}</div>
                          </td>

                          <td className="border" style={cellStyle}>
                              <div className="text-center" style={{ fontSize: "12px" }}>{rec.serviceName || ""}</div>
                          </td>

                          <td className="border" style={cellStyle}>
                              <div className="text-center" style={{ fontSize: "12px" }}>
                                  {rec.code ? (
                                      <span className="fw-bold text-dark">{rec.code}</span>
                                  ) : (
                                    ""
                                  )}
                              </div>
                          </td>
                          <td className="border" style={cellStyle}>
                                <div className="text-center" style={{ fontSize: "12px", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={rec.picName}>
                                   {rec.picName || ""}
                                </div>
                          </td>
                          <td className="border" style={cellStyle}>
                              <div className="text-center" style={{ fontSize: "12px" }}>{rec.startDate || ""}</div>
                          </td>

                          <td className="border" style={cellStyle}>
                              <div className="text-center" style={{ fontSize: "12px" }}>{rec.endDate || ""}</div>
                          </td>
                          
                          <td className="border" style={cellStyle}>
                                <div className={`text-center ${rec.package === "Cấp tốc" ? "text-danger fw-bold" : ""}`} style={{ fontSize: "12px" }}>
                                  {rec.package || ""}
                                </div>
                          </td>

                          <td className="border" style={cellStyle}>
                                <div className={`text-center ${rec.invoiceYN === "Yes" ? "text-primary fw-bold" : "text-muted"}`} style={{ fontSize: "12px" }}>
                                   {rec.invoiceYN || ""}
                                </div>
                          </td>

                          <td className="border text-center" style={cellStyle}>
                                {rec.invoiceUrl ? (
                                   <a href={rec.invoiceUrl} target="_blank" rel="noreferrer" className="text-primary" title="Xem hóa đơn">
                                      <FileText size={16} /> 
                                   </a>
                                ) : <span className="text-muted" style={{fontSize: '10px'}}>-</span>}
                          </td>
                          
                          {canViewRevenue && (
                            <>
                              <td className="border" style={{ ...cellStyle, width: "100px" }}>
                                  <div className="text-center" style={{ fontSize: "12px" }}>{formatNumber(rec.revenueBefore || "")}</div>
                              </td>

                              <td className="border" style={cellStyle}>
                                  <div className="text-center" style={{ fontSize: "12px", color: rec.walletUsage ? "red" : "inherit", fontWeight: 500 }}>
                                    {formatNumber(rec.walletUsage || 0)}
                                  </div>
                              </td>

                              <td className="border" style={cellStyle}>
                                  <div className="text-center" style={{ fontSize: "12px" }}>{rec.discountRate ? `${rec.discountRate}%` : "--"}</div>
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
                                    backgroundColor: rec.isNew ? "#dcfce7" : "#fff",
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

                  
                       <td className="text-center align-middle">
                          <div className="d-flex justify-content-center gap-1">
                            
                            {!rec.code && (currentUser?.is_accountant || currentUser?.is_director) ? (
                              // --- NÚT DUYỆT (MÀU XANH CYAN - GIỐNG ẢNH MẪU) ---
                              <button
                                className="btn btn-sm shadow-sm"
                                title="Duyệt dịch vụ"
                                onClick={() => handleApprove(rec)}
                                style={{
                                  backgroundColor: "#06b6d4", // Cyan-500
                                  borderColor: "#06b6d4",
                                  color: "#ffffff",
                                  width: "32px",
                                  height: "32px",
                                  padding: 0,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  borderRadius: "6px",
                                  transition: "all 0.2s"
                                }}
                              >
                                <Check size={18} strokeWidth={3} />
                              </button>
                            ) : (
                              // --- NÚT SỬA (Màu vàng) ---
                              <button
                                className="btn btn-sm shadow-sm"
                                title="Sửa dịch vụ"
                                onClick={() => handleEditService(rec)}
                                style={{
                                  backgroundColor: "#f59e0b", // Amber-500
                                  borderColor: "#f59e0b",
                                  color: "#ffffff",
                                  width: "32px",
                                  height: "32px",
                                  padding: 0,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  borderRadius: "6px",
                                  transition: "all 0.2s"
                                }}
                              >
                                <Edit size={16} strokeWidth={2.5} />
                              </button>
                            )}

                            {/* --- NÚT XÓA (Màu đỏ) --- */}
                            <button
                              className="btn btn-sm shadow-sm"
                              title="Xóa dịch vụ"
                              onClick={() => deleteServiceRow(rec.id, rec.isNew)}
                              style={{
                                backgroundColor: "#ef4444", // Red-500
                                borderColor: "#ef4444",
                                color: "#ffffff",
                                width: "32px",
                                height: "32px",
                                padding: 0,
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: "6px",
                                transition: "all 0.2s"
                              }}
                            >
                              <Trash2 size={16} strokeWidth={2.5} />
                            </button>
                          </div>
                        </td>

                          </tr>
                        );
                      })
                    ) : (
                      <tr>
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

  const handleCellEdit = (field, item, e) => {
     if(activeTab === 'pending') handlePendingChange(item.ID, field, e.target.value);
     if(activeTab === 'approved') handleApprovedChange(item.ID, field, e.target.value);
  }

 
  const renderPendingApprovedTab = () => {
    

    const totalColumns = activeTab === "pending" ? 8 : 9;

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
                
                // Style cho input và view mode
                const viewStyle = { fontSize: "12px", height: "30px", lineHeight: "30px", textAlign: "center", padding: "0 4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
                const inputStyle = { width: "100%", height: "100%", border: "none", outline: "none", textAlign: "center", background: "transparent", fontSize: "12px" };

                return (
                  <React.Fragment key={item.ID}>
                    {/* DÒNG DỮ LIỆU CHÍNH */}
                    <tr style={{ height: "30px", ...rowStyle }} className={`bg-white hover:bg-gray-50 ${isExpanded ? "border-bottom-0" : ""}`}>
                      <td className="text-center border">{globalIndex}</td>
                      <td className="border">{isEditing ? <input style={inputStyle} value={item.TenDoanhNghiep} onChange={(e) => handleCellEdit("TenDoanhNghiep", item, e)} /> : <div style={viewStyle} title={item.TenDoanhNghiep}>{item.TenDoanhNghiep}</div>}</td>
                      <td className="border">{isEditing ? <input style={inputStyle} value={item.SoDKKD} onChange={(e) => handleCellEdit("SoDKKD", item, e)} /> : <div style={viewStyle}>{item.SoDKKD}</div>}</td>
                      <td className="border">{isEditing ? <input style={inputStyle} value={item.NguoiDaiDien} onChange={(e) => handleCellEdit("NguoiDaiDien", item, e)} /> : <div style={viewStyle}>{item.NguoiDaiDien}</div>}</td>

                      {/* Cột riêng cho Pending */}
                      {activeTab === "pending" && (
                        <>
                          <td className="border">
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
                          <td className="border text-center p-0 align-middle">
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
                      {activeTab === "approved" && (
                        <>
                          <td className="border">{isEditing ? <input style={inputStyle} value={item.NganhNgheChinh || ""} onChange={(e) => handleApprovedChange(item.ID, "NganhNgheChinh", e.target.value)} /> : <div style={viewStyle}>{item.NganhNgheChinh || ""}</div>}</td>
                          <td className="border">{isEditing ? <input style={inputStyle} value={item.DiaChi || ""} onChange={(e) => handleApprovedChange(item.ID, "DiaChi", e.target.value)} /> : <div style={viewStyle}>{item.DiaChi || ""}</div>}</td>
                        </>
                      )}

                      <td className="text-center border">{formatDateTime(item.NgayTao || item.NgayDangKyB2B)}</td>
                      {activeTab === "approved" && <td className="text-center border fw-bold text-primary">{formatNumber(calculateCompanyTotalRevenue(item.ID))}</td>}
                      
                      {/* Cột Hành Động */}
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
                                <X size={16}/> Đóng
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
          Duyệt dịch vụ (B2B)
        </h3>
        <p className="text-muted small mt-1 mb-0">Chỉnh sửa thông tin trước khi duyệt</p>
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

          // Tìm doanh nghiệp để lấy danh sách dịch vụ
          const company = approvedList.find(c => String(c.ID) === String(selectedService.companyId));
          
          // Lấy danh sách dịch vụ từ doanh nghiệp
          let availableServices = [];
          if (company) {
            if (company.DichVu) availableServices.push(...company.DichVu.split(',').map(s => s.trim()));
            if (company.DichVuKhac) availableServices.push(...company.DichVuKhac.split(',').map(s => s.trim()));
            availableServices = [...new Set(availableServices)].filter(Boolean);
          }

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
                     if(String(opt.value) !== String(value)) e.target.style.backgroundColor = twoColumns ? "#E5E7EB" : "#F3F4F6";
                  }}
                  onMouseLeave={(e) => {
                     if(String(opt.value) !== String(value)) e.target.style.backgroundColor = twoColumns ? "#F9FAFB" : "transparent";
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
              setSelectedService(prev => ({ 
                ...prev, 
                [name]: value,
                serviceType: value // Cập nhật cả serviceType
              }));
            }
            else {
              setSelectedService(prev => ({ ...prev, [name]: value }));
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
                  style={{...inputStyle, backgroundColor: "#F3F4F6", color: "#9CA3AF"}} 
                />
              </div>
              
              {/* Số ĐKKD (readonly) */}
              <div className="col-md-6">
                <label style={labelStyle}>Số đăng ký kinh doanh</label>
                <input 
                  type="text" 
                  value={selectedService.soDKKD || company?.SoDKKD || "--"} 
                  readOnly 
                  style={{...inputStyle, backgroundColor: "#F3F4F6", color: "#9CA3AF"}} 
                />
              </div>

              {/* Loại dịch vụ (có thể sửa) */}
              <div className="col-md-6">
                <label style={labelStyle}>
                  Loại dịch vụ <span className="text-danger">*</span>
                </label>
                <ModernSelect
                  name="LoaiDichVu"
                  value={selectedService.serviceType || selectedService.LoaiDichVu || ""}
                  onChange={handleApproveModalChange}
                  placeholder="-- Chọn loại dịch vụ --"
                  options={availableServices.map(svc => ({ value: svc, label: svc }))}
                />
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

              {/* Ngày bắt đầu (có thể sửa) */}
              <div className="col-md-6">
                <label style={labelStyle}>Ngày bắt đầu <span className="text-danger">*</span></label>
                <input 
                  type="date" 
                  name="NgayBatDau"
                  value={selectedService.startDate || ""} 
                  onChange={handleApproveModalChange}
                  style={inputStyle}
                />
              </div>

              {/* Ngày hoàn thành (có thể sửa) */}
              <div className="col-md-6">
                <label style={labelStyle}>Ngày hoàn thành mong muốn</label>
                <input 
                  type="date" 
                  name="NgayHoanThanh"
                  value={selectedService.endDate || ""} 
                  onChange={handleApproveModalChange}
                  style={inputStyle}
                />
                <div style={helperTextStyle}>
                  Ngày hoàn thành dịch vụ có thể sai khác tuỳ thuộc vào thực tế hồ sơ.
                </div>
              </div>

              {/* Gói dịch vụ (có thể sửa) */}
              <div className="col-md-6">
                <label style={labelStyle}>Gói dịch vụ</label>
                <ToggleButton 
                  name="GoiDichVu" 
                  value={selectedService.package === "Cấp tốc" || selectedService.package === "Yes" ? "Yes" : "No"} 
                  onChange={handleApproveModalChange} 
                />
                <div style={helperTextStyle}>
                  {selectedService.package === "Cấp tốc" || selectedService.package === "Yes" 
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

              {/* Doanh thu (có thể sửa nếu có quyền) */}
              {(currentUser?.is_director || currentUser?.is_accountant) && (
                <div className="col-12">
                  <label style={labelStyle}>Doanh thu <span className="text-danger">*</span></label>
                  <div className="d-flex gap-3">
                    <div style={{ flex: 1 }}>
                      <input 
                        type="text" 
                        name="DoanhThu"
                        value={selectedService.DoanhThu || formatNumber(selectedService.revenueBefore || "")} 
                        onChange={handleApproveModalChange}
                        placeholder="1.000.000" 
                        style={{...inputStyle, textAlign: "center"}}
                      />
                      <div style={helperTextStyle}>Doanh thu trước chiết khấu</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <input 
                        type="text" 
                        name="Vi"
                        value={selectedService.Vi || formatNumber(selectedService.walletUsage || "")} 
                        onChange={handleApproveModalChange}
                        placeholder="Trừ ví (VND)..." 
                        style={{...inputStyle, textAlign: "center"}}
                      />
                      <div style={helperTextStyle}>Số tiền trừ ví</div>
                    </div>
                  </div>
                </div>
              )}

             
          {!(currentUser?.is_staff && !currentUser?.is_director && !currentUser?.is_accountant) && (
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
                    style={{...inputStyle, paddingRight: "40px"}}
                  />
                  <span 
                    className="position-absolute top-50 translate-middle-y end-0 me-3 cursor-pointer" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ color: "#6B7280" }}
                  >
                    {showConfirmPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
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


      {showAddServiceModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1050, backdropFilter: "blur(2px)" }}>
          <div 
            className="bg-white p-3 scrollbar-hide position-relative" 
            style={{ 
              width: "600px", 
              maxWidth: "80%", 
              maxHeight: "99vh",
              display: "flex",          
              flexDirection: "column",   
              overflow: "hidden",        
              overflowY: "auto", 
              borderRadius: "20px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
            }}
          >
            {/* --- NÚT ĐÓNG (CLOSE BUTTON) --- */}
            <button 
              onClick={() => setShowAddServiceModal(false)}
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
            <div className="text-center mb-1 mt-1">
              <h3 className="fw-bold m-0" style={{ color: "#333", fontSize: "20px" }}>
                {newServiceForm.id ? "Cập nhật dịch vụ (B2B)" : "Đăng ký dịch vụ mới (B2B)"}
              </h3>
              <p className="text-muted small mt-1 mb-0">Hệ thống quản lý dịch vụ của One Pass</p>
            </div>

            <div className="row g-3 px-2">
              {/* === Custom Style cho Input === */}
              {(() => {
                  // 1. Style chung cho Input
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

                  // 2. Định nghĩa hình mũi tên (Chevron Down - màu xám #6B7280)
                  const arrowSvg = `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3e%3cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3e%3c/svg%3e")`;

                  // 3. Style riêng cho Select (Kế thừa inputStyle + Custom mũi tên)
                  const selectStyle = {
                    ...inputStyle,
                    appearance: "none",        // Ẩn mũi tên mặc định (CSS chuẩn)
                    WebkitAppearance: "none",  // Ẩn mũi tên mặc định (Safari/Chrome)
                    MozAppearance: "none",     // Ẩn mũi tên mặc định (Firefox)
                    backgroundImage: arrowSvg, // Thêm mũi tên SVG mới
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 12px center", // Căn phải
                    backgroundSize: "16px",    // Kích thước mũi tên
                    paddingRight: "35px",      // Tạo khoảng trống bên phải để chữ không đè lên mũi tên
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
                    marginTop: "2px",
                    fontStyle: "normal",
                  };

                  // Component ToggleButton (Giữ nguyên)
                  const ToggleButton = ({ name, value, onChange }) => (
                    <div className="d-flex gap-4 w-100">
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

              const ModernSelect = ({ name, value, options, onChange, placeholder, disabled, twoColumns = false, footerAction }) => {
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
                      <span style={{ color: value ? "#374151" : "#9CA3AF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
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
                          maxHeight: "250px",
                          overflowY: "auto",
                          borderRadius: "8px",
                          padding: "8px",
                          display: "flex",
                          flexDirection: "column"
                        }}
                      >
                        <div style={{
                          display: twoColumns ? "grid" : "block",
                          gridTemplateColumns: twoColumns ? "1fr 1fr" : "none",
                          gap: twoColumns ? "8px" : "0"
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
                                  backgroundColor: String(opt.value) === String(value) ? "#EFF6FF" : "transparent",
                                  borderBottom: !twoColumns && idx !== options.length - 1 ? "1px solid #f3f4f6" : "none",
                                  border: twoColumns ? "1px solid #E5E7EB" : undefined,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis"
                                }}
                                onMouseEnter={(e) => {
                                  if(String(opt.value) !== String(value)) e.target.style.backgroundColor = twoColumns ? "#E5E7EB" : "#F3F4F6";
                                }}
                                onMouseLeave={(e) => {
                                  if(String(opt.value) !== String(value)) e.target.style.backgroundColor = "transparent";
                                }}
                                title={opt.label}
                              >
                                {opt.label}
                              </div>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-muted small text-center">Không có dữ liệu</div>
                          )}
                        </div>

                        {/* [NEW] Phần Footer Action (Nút cộng) */}
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
                              className="px-3 py-2 text-primary d-flex align-items-center gap-2 rounded transition-all"
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
                return (
                  <>
                  
                    {/* Tên Doanh Nghiệp */}
                    <div className="col-md-6">
                      <label style={labelStyle}>
                        Tên doanh nghiệp <span className="text-danger">*</span>
                      </label>
                      <ModernSelect
                        name="DoanhNghiepID"
                        value={newServiceForm.DoanhNghiepID}
                        onChange={handleModalChange}
                        placeholder="Chọn doanh nghiệp"
                        options={approvedList.map(c => ({ value: c.ID, label: c.TenDoanhNghiep }))}
                      />
                    </div>
                    {/* Số ĐKKD */}
                    <div className="col-md-6">
                      <label style={labelStyle}>Số đăng ký kinh doanh <span className="text-danger">*</span></label>
                      <input 
                        type="text" 
                        value={newServiceForm.SoDKKD} 
                        readOnly 
                        style={{...inputStyle, backgroundColor: "#F3F4F6", color: "#9CA3AF"}} 
                      />
                    </div>

                    
      
                  <div className="col-md-6">
                      <label style={labelStyle}>
                        Loại dịch vụ <span className="text-danger">*</span>
                      </label>
                      <ModernSelect
                        name="LoaiDichVu"
                        value={newServiceForm.LoaiDichVu}
                        onChange={handleModalChange}
                        placeholder="Chọn loại dịch vụ"
                        disabled={!newServiceForm.DoanhNghiepID} 
                        
                        options={availableServices.map(svc => ({ value: svc, label: svc }))}
                      />
                    </div>

             
                   
                    {/* Tên dịch vụ chi tiết */}
                    <div className="col-md-6">
                      <label style={labelStyle}>Tên dịch vụ chi tiết <span className="text-danger">*</span></label>
                      <input 
                        type="text" 
                        name="TenDichVu" 
                        placeholder="Cấp lại hộ chiếu..." 
                        value={newServiceForm.TenDichVu} 
                        onChange={handleModalChange} 
                        style={inputStyle}
                      />
                    </div>

  <div className="col-md-12">
    <label style={labelStyle}>
      Danh mục <span className="text-danger">*</span>
    </label>
    
    <ModernSelect
      name="DanhMuc"
      value={newServiceForm.DanhMuc}
      onChange={handleModalChange}
      placeholder={newServiceForm.LoaiDichVu ? "Chọn danh mục chính" : "Vui lòng chọn Loại dịch vụ trước"}
      disabled={!newServiceForm.LoaiDichVu}
      options={
        (B2B_SERVICE_MAPPING[newServiceForm.LoaiDichVu] || []).map(dm => ({
          value: dm,
          label: dm
        }))
      }
     
      footerAction={{
        label: showExtras ? "Ẩn dịch vụ bổ sung" : "Thêm dịch vụ bổ sung (+5)",
        icon: showExtras ? <EyeOff size={14}/> : <Plus size={14}/>,
        onClick: () => {
             // Nếu đang đóng mà mở ra thì reset về 1 dòng rỗng nếu chưa có gì
             if (!showExtras && extraServices.length === 0) setExtraServices([""]); 
             setShowExtras(!showExtras);
        }
      }}
    />


    {showExtras && (
        <div className="mt-2 p-3 bg-light rounded border animate__animated animate__fadeIn">
            <div style={{ fontSize: "11px", color: "#666", marginBottom: "8px", fontStyle: "italic" }}>
                * Nhập tên dịch vụ phụ (Ví dụ: Dịch thuật, Công chứng...). <br/>
                * Nhấn nút <b>(+)</b> màu xanh để thêm dòng mới.
            </div>
            
            <div className="d-flex flex-column gap-2">
                {extraServices.map((service, index) => (
                    <div key={index} className="d-flex align-items-center gap-2" style={{ width: "100%" }}>
                        {/* A. Ô NHẬP LIỆU */}
                        <input
                            type="text"
                            placeholder={`Dịch vụ bổ sung ${index + 1}`}
                            value={service}
                            onChange={(e) => handleChangeExtra(index, e.target.value)}
                            style={{
                                flex: 1, // Tự động giãn full chiều rộng
                                padding: "8px 10px",
                                borderRadius: "6px",
                                border: "1px solid #ddd",
                                fontSize: "13px",
                                outline: "none",
                                minWidth: 0 
                            }}
                        />

                        {/* B. NÚT XÓA (X) - LUÔN HIỆN */}
                        <button
                            type="button"
                            onClick={() => handleRemoveRow(index)}
                            className="btn btn-outline-danger d-flex align-items-center justify-content-center"
                            style={{ 
                                width: "38px", 
                                height: "38px", 
                                padding: 0,
                                borderRadius: "6px",
                                flexShrink: 0
                            }}
                            title="Xóa dòng này"
                        >
                            <X size={18} />
                        </button>

                 
                        {index === extraServices.length - 1 && extraServices.length < 5 && (
                            <button
                                type="button"
                                onClick={handleAddRow}
                                className="btn btn-primary d-flex align-items-center justify-content-center"
                                style={{ 
                                    width: "38px", 
                                    height: "38px", 
                                    padding: 0,
                                    borderRadius: "6px",
                                    flexShrink: 0,
                                    backgroundColor: "#22c55e", // Màu xanh lá
                                    borderColor: "#22c55e",
                                    color: "white"
                                }}
                                title="Thêm dòng mới"
                            >
                                <Plus size={18} />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )}
</div>

                    {/* Ngày bắt đầu */}
                    <div className="col-md-6">
                      <label style={labelStyle}>Ngày bắt đầu <span className="text-danger">*</span></label>
                      <input 
                        type="date" 
                        name="NgayBatDau" 
                        value={newServiceForm.NgayBatDau} 
                        onChange={handleModalChange} 
                        style={inputStyle}
                      />
                    </div>
                      
                    {/* Ngày hoàn thành */}
                    <div className="col-md-6">
                      <label style={labelStyle}>Ngày hoàn thành mong muốn <span className="text-danger">*</span></label>
                      <input 
                        type="date" 
                        name="NgayHoanThanh" 
                        value={newServiceForm.NgayHoanThanh} 
                        onChange={handleModalChange} 
                        style={inputStyle}
                      />
                      <div style={helperTextStyle}>
                        Ngày hoàn thành dịch vụ có thể sai khác tuỳ thuộc vào thực tế hồ sơ và tình hình xử lý hồ sơ tại cơ quan.
                      </div>
                    </div>

                    {/* Thủ tục cấp tốc */}
                    <div className="col-md-6">
                      <label style={labelStyle}>Yêu cầu thủ tục cấp tốc <span className="text-danger">*</span></label>
                      <ToggleButton name="ThuTucCapToc" value={newServiceForm.ThuTucCapToc} onChange={handleModalChange} />
                      <div style={helperTextStyle}>
                        Thời gian cấp tốc đối với từng dịch vụ sẽ được hướng dẫn thông qua người phụ trách.
                      </div>
                    </div>

                    {/* Xuất hóa đơn */}
                    <div className="col-md-6">
                      <label style={labelStyle}>Yêu cầu xuất hóa đơn <span className="text-danger">*</span></label>
                      <ToggleButton name="YeuCauHoaDon" value={newServiceForm.YeuCauHoaDon} onChange={handleModalChange} />
                      <div style={helperTextStyle}>
                        Hóa đơn sẽ được gửi về email đăng ký khi đăng ký doanh nghiệp trên hệ thống.
                      </div>
                    </div>
                    <div className="col-md-12">
                        <label style={labelStyle}>
                          Chọn người phụ trách <span className="text-danger">*</span>
                        </label>
                        <ModernSelect
                          name="NguoiPhuTrachId"
                          value={newServiceForm.NguoiPhuTrachId}
                          onChange={handleModalChange}
                          placeholder="Chọn trong danh sách nhân viên"
                          
                          twoColumns={true}  
                          
                          options={userList.map(u => ({ 
                            value: u.id, 
                            label: `${u.name} (${u.username})` 
                          }))}
                        />
                      </div>

                    {/* Doanh thu & Chiết khấu/Ví */}
                    {(currentUser?.is_director || currentUser?.is_accountant) && (
                      <div className="col-12">
                        <label style={labelStyle}>Doanh thu <span className="text-danger">*</span></label>
                        <div className="d-flex gap-3">
                          <div style={{ flex: 1 }}>
                            <input 
                              type="text" 
                              name="DoanhThu" 
                              value={newServiceForm.DoanhThu} 
                              onChange={handleModalChange} 
                              placeholder="1.000.000" 
                              style={{...inputStyle, textAlign: "center"}}
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <input 
                              type="text" 
                              name="Vi" 
                              value={newServiceForm.Vi} 
                              onChange={handleModalChange} 
                              placeholder="Trừ ví (VND)..." 
                              style={{...inputStyle, textAlign: "center"}}
                            />
                          </div>
                        </div>
                         <div style={helperTextStyle}>
                            Nhập doanh thu tổng và số tiền trừ ví (nếu có).
                          </div>
                      </div>
                    )}

                    {/* Ghi chú */}
                    <div className="col-12">
                      <label style={labelStyle}>Ghi chú </label>
                      <textarea
                        type="text" 
                        name="GhiChu" 
                        placeholder="Nhập ghi chú" 
                        value={newServiceForm.GhiChu} 
                        onChange={handleModalChange} 
                        style={inputStyle}
                      />
                    </div>

                   
                    

                    {/* Mật khẩu xác nhận */}
                    <div className="col-12">
                       <label style={labelStyle}>Nhập mật khẩu để đăng ký <span className="text-danger">*</span></label>
                       <div className="position-relative">
                          <input 
                            type={showConfirmPassword ? "text" : "password"} 
                            placeholder="******" 
                            name="ConfirmPassword"
                            value={newServiceForm.ConfirmPassword}
                            onChange={handleModalChange}
                            autoComplete="new-password"
                            style={{...inputStyle, paddingRight: "40px"}}
                          />
                          <span 
                            className="position-absolute top-50 translate-middle-y end-0 me-3 cursor-pointer" 
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            style={{ color: "#6B7280" }}
                          >
                            {showConfirmPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                          </span>
                       </div>
                       <div style={helperTextStyle}>Mật khẩu tài khoản admin hiện tại</div>
                    </div>

                    {/* Nút Submit */}
                   {/* ... Trong phần render Modal ... */}

          <div className="col-12 mt-2 pt-2">
            <button 
              className="btn w-100 fw-bold shadow-sm" 
              onClick={handleModalSubmit}
              style={{
                // Đổi màu nút thành xanh nếu là hành động duyệt
                backgroundColor: (currentUser?.is_accountant && newServiceForm.status === "Chờ Kế toán duyệt") ? "#0ea5e9" : "#22C55E", 
                color: "white",
                padding: "12px", 
                borderRadius: "10px",
                fontSize: "15px",
                border: "none",
                boxShadow: "0 4px 6px -1px rgba(34, 197, 94, 0.4)"
              }}
            >
              {/* Logic hiển thị Text của nút */}
              {newServiceForm.id 
                ? (currentUser?.is_accountant && newServiceForm.status === "Chờ Kế toán duyệt" 
                    ? "Duyệt & Cấp mã dịch vụ" // Text khi kế toán duyệt
                    : "Cập nhật dịch vụ")      // Text khi sửa bình thường
                : "Đăng ký dịch vụ mới"}
            </button>
          </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
    
  );
}