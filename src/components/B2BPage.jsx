import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import useSocketListener from "./CMSDashboard/hooks/useSocketListener";
import NotificationPanel from "./CMSDashboard/NotificationPanel";
import EditProfileModal from "./EditProfileModal";
import RegisterB2BModal from "./RegisterB2BModal";
import { showToast } from "../utils/toast";
import { Save, Trash2, XCircle, Check, FileText, Edit, Eye, EyeOff, Plus, X, ChevronDown, Paperclip } from "lucide-react";
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

const API_BASE = "https://onepasscms-backend-tvdy.onrender.com/api";
const parseMoney = (str) => {
  if (!str) return 0;
  return parseFloat(str.toString().replace(/\./g, "")) || 0;
};
export default function B2BPage() {
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [showRegisterB2BModal, setShowRegisterB2BModal] = useState(false);

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
  }, []);

  const fetchUsers = async () => {
    try {

      const res = await authenticatedFetch(`${API_BASE}/User`);
      if (!res) return;

      const json = await res.json();
      if (json.success) setUserList(json.data);
    } catch (e) { console.error("Lỗi lấy user list", e); }
  };



  const handleEditService = (rec) => {

    const company = approvedList.find(c => String(c.ID) === String(rec.companyId));


    const details = rec.ChiTietDichVu || { main: {}, sub: [] };

    let mainRevenueStr = "";
    let mainDiscountStr = "";
    let currentExtras = [];


    if (details.main && details.main.revenue !== undefined) {

      mainRevenueStr = formatNumber(details.main.revenue);
      mainDiscountStr = details.main.discount || "";
    } else {

      mainRevenueStr = rec.revenueBefore ? formatNumber(rec.revenueBefore) : "";
      mainDiscountStr = rec.discountRate || "";
    }


    if (details.sub && details.sub.length > 0) {

      currentExtras = details.sub.map(s => ({
        name: s.name,
        revenue: s.revenue ? formatNumber(s.revenue) : "",
        discount: s.discount || ""
      }));
    } else {

      const fullDanhMuc = rec.DanhMuc || "";
      const parts = fullDanhMuc.split(" + ");

      if (parts.length > 1) {
        currentExtras = parts.slice(1).map(name => ({
          name: name.trim(),
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


    const mainCatName = (rec.DanhMuc || "").split(" + ")[0];

    setNewServiceForm({
      id: rec.id,
      DoanhNghiepID: rec.companyId,
      SoDKKD: company ? company.SoDKKD : (rec.soDKKD || ""),
      LoaiDichVu: rec.serviceType,
      TenDichVu: rec.serviceName,
      DiaChiNhan: rec.DiaChiNhan || "",

      DanhMuc: mainCatName,
      NgayBatDau: rec.startDate ? rec.startDate : "",
      NgayHoanThanh: rec.endDate ? rec.endDate : "",
      ThuTucCapToc: (rec.package === "Cấp tốc" || rec.package === "Yes") ? "Yes" : "No",
      YeuCauHoaDon: rec.invoiceYN || "No",
      TrangThai: rec.status || rec.TrangThai,
      DoanhThu: mainRevenueStr,
      MucChietKhau: mainDiscountStr,

      Vi: rec.walletUsage ? formatNumber(rec.walletUsage) : "",
      GhiChu: rec.GhiChu || "",
      NguoiPhuTrachId: rec.picId || "",
      ConfirmPassword: "",
      status: rec.TrangThai || rec.status || "Chờ Giám đốc duyệt"
    });

    if (company) {
      let services = [];
      if (company.DichVu) services.push(...parseServices(company.DichVu));
      if (company.DichVuKhac) services.push(...parseServices(company.DichVuKhac));
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
      DiaChiNhan: "",
      NgayBatDau: new Date().toISOString().split('T')[0],
      NgayHoanThanh: "",
      ThuTucCapToc: "No",
      YeuCauHoaDon: "No",
      DoanhThu: "",
      Vi: "",
      GhiChu: "",
      MucChietKhau: "",
      TrangThai: "",
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

      const canApproveB2B = currentUser?.is_director || currentUser?.perm_approve_b2b;
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
        if (approveAction === "accountant_approve" && json.newCode) {
          await MySwal.fire({
            icon: "success",
            title: "Đã duyệt & Cấp mã!",
            html: `Mã hệ thống: <b>${json.newCode}</b>`,
            confirmButtonColor: "#22c55e"
          });
        } else {
          showToast(
            newServiceForm.id ? "Cập nhật thành công!" : "Đã gửi yêu cầu đăng ký!",
            "success"
          );
        }

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
      lyDoTuChoi: "Lý do từ chối",
      dichVu: "Dịch Vụ",
      giayPhep: "Giấy Phép ĐKKD",
      email: "Email",
      hoSo: "Hồ Sơ",
      soDienThoai: "Số Điện Thoai",
      nganhNgheChinh: "Ngành Nghề Chính",
      diaChi: "Địa Chỉ",
      chonDN: "Doanh Nghiệp",
      loaiDichVu: "Loại Dịch Vụ",
      tenDichVu: "Tên Dịch Vụ",
      maDichVu: "Mã Dịch Vụ",
      danhMuc: "Danh Mục",
      nguoiPhuTrach: "Người Phụ Trách",
      goi: "Gói",
      invoiceYN: "Invoice Y/N",
      invoice: "Invoice",
      ngayBatDau: "Ngày Bắt Đầu",
      ngayKetThuc: "Ngày Kết Thúc",
      doanhThuTruoc: "Doanh Thu\nTrước Chiết Khấu",
      mucChietKhau: "Mức\nChiết Khấu",
      soTienChietKhau: "Số Tiền\nChiết Khấu",
      doanhThuSau: "Doanh Thu\nSau Chiết Khấu",
      suDungVi: "Sử dụng\nví",
      tongDoanhThuTichLuy: "Tổng Doanh Thu",
      hanhDong: "Hành động",
      msgWalletLimit: "Số tiền ví không được quá 2.000.000",
      diaChiNhan: "Địa chỉ nhận",
      diaChiNhanPlaceholder: "Nhập địa chỉ nhận hồ sơ"
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
      danhMuc: "Category",
      nguoiPhuTrach: "Assignee",
      goi: "Package",
      invoiceYN: "Invoice Y/N",
      invoice: "Invoice",
      ngayBatDau: "Start Date",
      ngayKetThuc: "End Date",
      doanhThuTruoc: "Revenue Before Discount",
      mucChietKhau: "Discount Rate",
      soTienChietKhau: "Discount Amount",
      doanhThuSau: "Revenue After Discount",
      tongDoanhThuTichLuy: "Total Revenue",
      suDungVi: "Wallet Usage",
      hanhDong: "Actions",
      msgWalletLimit: "Wallet usage cannot exceed 2,000,000",
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
      danhMuc: "카테고리",
      nguoiPhuTrach: "담당자",
      goi: "패키지",
      invoiceYN: "인보이스 Y/N",
      invoice: "인보이스",
      ngayBatDau: "시작일",
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
      diaChiNhan: "수령 주소",
      diaChiNhanPlaceholder: "수령 주소를 입력하세요"
    }
  };

  const t = translations[currentLanguage] || translations.en;

  useSocketListener({ currentLanguage, setNotifications, setHasNewRequest, setShowNotification, currentUser: currentUser });

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
          DiaChiNhan: item.DiaChiNhan || "",
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
          ChiTietDichVu: (typeof item.ChiTietDichVu === "string"
            ? JSON.parse(item.ChiTietDichVu)
            : item.ChiTietDichVu) || { main: {}, sub: [] },
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
      console.error("Load services failed", error);
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
          // Xử lý chuỗi tiền tệ (bỏ dấu chấm) hoặc số
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
      NgayHoanThanh: service.endDate,

      DoanhThu: mainRevenueStr,
      MucChietKhau: mainDiscountStr,

      Vi: service.walletUsage ? formatNumber(service.walletUsage) : "",
      GhiChu: service.GhiChu || "",
      NguoiPhuTrachId: service.picId || "",
      ConfirmPassword: "",
      GoiDichVu: service.package === "Cấp tốc" ? "Yes" : "No",
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

      const payload = {
        LoaiDichVu: selectedService.LoaiDichVu || selectedService.serviceType,
        TenDichVu: selectedService.TenDichVu || selectedService.serviceName,
        NgayThucHien: selectedService.NgayBatDau || selectedService.startDate,
        DiaChiNhan: selectedService.DiaChiNhan || service.DiaChiNhan || "",
        TrangThai: selectedService.TrangThai,
        NgayHoanThanh: selectedService.NgayHoanThanh || selectedService.endDate,
        GoiDichVu: selectedService.GoiDichVu === "Yes" ? "Cấp tốc" : "Thông thường",
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

  const isApprover = currentUser?.is_director || currentUser?.is_accountant;

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

  const renderServicesTab = () => {
    const canApproveB2B = currentUser?.is_director || currentUser?.perm_approve_b2b;
    const canViewRevenue = currentUser?.is_director || currentUser?.is_accountant || currentUser?.perm_view_revenue;

    const getSubRowCount = (danhMucStr) => {
      if (!danhMucStr) return 1;
      return danhMucStr.split(" + ").length;
    };

    const getRowBeforeDiscount = (rec, subIdx) => {
      const details = rec.ChiTietDichVu || { main: {}, sub: [] };
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
      const compA = String(a.companyId || a.DoanhNghiepID || "");
      const compB = String(b.companyId || b.DoanhNghiepID || "");
      if (compA !== "" && compB === "") return -1;
      if (compA === "" && compB !== "") return 1;
      if (compA !== "" && compB !== "") return compA.localeCompare(compB);
      return (a.id || 0) - (b.id || 0);
    });

    return (
      <div>
        <div className="d-flex justify-content-end mb-2 gap-2" style={{ height: 40, marginRight: 10 }}>
          <button
            className="btn btn-success btn-sm d-flex align-items-center gap-2 shadow-sm"
            onClick={handleOpenAddServiceModal}
            style={{ fontSize: "13px", fontWeight: "600" }}
          >
            <Plus size={16} />
            {t.dangKyDichVuMoi}
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
              <table className="table table-bordered table-sm mb-0 align-middle" style={{ fontSize: "12px", borderCollapse: "collapse", tableLayout: "fixed" }}>
                <thead className="text-white text-center align-middle" style={{ backgroundColor: "#1e3a8a" }}>
                  <tr>
                    <th className="py-2 border" style={{ width: "40px", whiteSpace: "pre-wrap" }}>{t.stt}</th>
                    <th className="py-2 border" style={{ width: "120px", whiteSpace: "pre-wrap" }}>{t.chonDN}</th>
                    <th className="py-2 border" style={{ width: "90px", whiteSpace: "pre-wrap" }}>Số ĐKKD</th>
                    <th className="py-2 border" style={{ width: "219px", whiteSpace: "pre-wrap" }}>{t.hoSo}</th>
                    <th className="py-2 border" style={{ width: "180px", whiteSpace: "pre-wrap" }}>{t.diaChiNhan}</th>
                    <th className="py-2 border" style={{ width: "100px", whiteSpace: "pre-wrap" }}>{t.loaiDichVu}</th>
                    <th className="py-2 border" style={{ width: "140px", whiteSpace: "pre-wrap" }}>{t.tenDichVu}</th>

                    {/* --- [SỬA] MỞ RỘNG CỘT HỒ SƠ LÊN 250px --- */}


                    <th className="py-2 border" style={{ width: "180px", whiteSpace: "pre-wrap" }}>{t.danhMuc}</th>
                    <th className="py-2 border" style={{ width: "160px", whiteSpace: "pre-wrap" }}>{t.maDichVu}</th>
                    <th className="py-2 border" style={{ width: "110px", whiteSpace: "pre-wrap" }}>{t.nguoiPhuTrach}</th>
                    <th className="py-2 border" style={{ width: "90px", whiteSpace: "pre-wrap" }}>{t.ngayBatDau}</th>
                    <th className="py-2 border" style={{ width: "90px", whiteSpace: "pre-wrap" }}>{t.ngayKetThuc}</th>
                    <th className="py-2 border" style={{ width: "100px", whiteSpace: "pre-wrap" }}>Gói</th>
                    <th className="py-2 border" style={{ width: "70px", whiteSpace: "pre-wrap" }}>Invoice Y/N</th>
                    <th className="py-2 border" style={{ width: "60px", whiteSpace: "pre-wrap" }}>Invoice</th>
                    <th className="py-2 border" style={{ width: "120px", whiteSpace: "pre-wrap" }}>Trạng thái</th>

                    {canViewRevenue && (
                      <>
                        <th className="py-2 border" style={{ width: "100px", whiteSpace: "pre-wrap" }}>{t.doanhThuTruoc}</th>
                        <th className="py-2 border" style={{ width: "90px", whiteSpace: "pre-wrap" }}>{t.suDungVi}</th>
                        <th className="py-2 border" style={{ width: "60px", whiteSpace: "pre-wrap" }}>{t.mucChietKhau}</th>
                        <th className="py-2 border" style={{ width: "80px", whiteSpace: "pre-wrap" }}>{t.soTienChietKhau}</th>
                        <th className="py-2 border" style={{ width: "100px", whiteSpace: "pre-wrap" }}>{t.doanhThuSau}</th>
                        <th className="py-2 border" style={{ width: "100px", whiteSpace: "pre-wrap" }}>{t.tongDoanhThuTichLuy}</th>
                      </>
                    )}
                    <th className="py-2 border" style={{ width: "100px", whiteSpace: "pre-wrap" }}>{t.hanhDong}</th>
                  </tr>
                </thead>
                <tbody>
                  {displayData && displayData.length > 0 ? (
                    displayData.map((rec, idx) => {
                      const globalIndex = idx + 1 + (currentPage.services - 1) * 20;
                      const servicesList = (rec.DanhMuc || "").split(" + ");
                      const subRowsCount = servicesList.length;
                      const currentCompanyId = String(rec.companyId || rec.DoanhNghiepID || "");
                      const prevCompanyId = idx > 0 ? String(displayData[idx - 1].companyId || displayData[idx - 1].DoanhNghiepID || "") : null;

                      let shouldRenderCompanyCell = false;
                      let companyRowSpan = 0;
                      let groupTotalRevenue = 0;

                      if (!currentCompanyId || currentCompanyId !== prevCompanyId) {
                        shouldRenderCompanyCell = true;
                        for (let i = idx; i < displayData.length; i++) {
                          const nextRec = displayData[i];
                          if (String(nextRec.companyId || nextRec.DoanhNghiepID || "") !== currentCompanyId) break;
                          companyRowSpan += getSubRowCount(nextRec.DanhMuc);
                          groupTotalRevenue += getTotalRecordAfterDiscount(nextRec);
                        }
                      }

                      const mergedStyle = {
                        backgroundColor: rec.isNew ? "#dcfce7" : "#fff",
                        verticalAlign: "middle",
                        position: "relative",
                        zIndex: 1,
                        padding: "4px",
                        fontSize: "12px",
                        textAlign: "center",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: "150px"
                      };

                      const danhMucStyle = {
                        backgroundColor: rec.isNew ? "#dcfce7" : "white",
                        verticalAlign: "middle",
                        padding: "4px 8px",
                        fontSize: "12px",
                        textAlign: "left"
                      };

                      return servicesList.map((svcName, subIdx) => {
                        const isFirstSubRow = subIdx === 0;

                        return (
                          <tr key={`${rec.uiId}_${subIdx}`} className={rec.isNew ? "" : "bg-white hover:bg-gray-50"}>
                            {isFirstSubRow && <td className="border" rowSpan={subRowsCount} style={mergedStyle}>{globalIndex}</td>}
                            {isFirstSubRow && shouldRenderCompanyCell && (
                              <>
                                <td className="border" rowSpan={companyRowSpan} style={mergedStyle} title={rec.companyName}>{rec.companyName || ""}</td>
                                <td className="border" rowSpan={companyRowSpan} style={mergedStyle} title={rec.soDKKD}>{rec.soDKKD || ""}</td>
                              </>
                            )}
                            {isFirstSubRow && (
                              <>

                                <td className="border" rowSpan={subRowsCount} style={{ ...mergedStyle, maxWidth: '240px', textAlign: 'left', padding: '8px' }}>
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

                                <td className="border" rowSpan={subRowsCount} style={{ ...mergedStyle, textAlign: 'left' }} title={rec.DiaChiNhan || "--"}>{rec.DiaChiNhan || "--"}</td>
                                <td className="border" rowSpan={subRowsCount} style={mergedStyle} title={rec.serviceType}>{rec.serviceType}</td>
                                <td className="border" rowSpan={subRowsCount} style={mergedStyle} title={rec.serviceName}>{rec.serviceName}</td>
                              </>
                            )}

                            <td className="border" style={danhMucStyle}>
                              <div className="px-1" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{svcName}</div>
                            </td>

                            {isFirstSubRow && (
                              <>
                                <td className="border" rowSpan={subRowsCount} style={{ ...mergedStyle, width: 170 }}><span className="fw-bold text-dark">{rec.code}</span></td>
                                <td className="border" rowSpan={subRowsCount} style={mergedStyle} title={rec.picName}>{rec.picName}</td>
                                <td className="border" rowSpan={subRowsCount} style={mergedStyle}>{rec.startDate}</td>
                                <td className="border" rowSpan={subRowsCount} style={mergedStyle}>{rec.endDate}</td>
                                <td className="border" rowSpan={subRowsCount} style={mergedStyle}><span className={rec.package === "Cấp tốc" ? "text-danger fw-bold" : ""}>{rec.package}</span></td>
                                <td className="border" rowSpan={subRowsCount} style={mergedStyle}>{rec.invoiceYN}</td>
                                <td className="border" rowSpan={subRowsCount} style={mergedStyle}>{rec.invoiceUrl ? (<a href={rec.invoiceUrl} target="_blank" rel="noreferrer" className="text-primary d-inline-block"><FileText size={16} /></a>) : ""}</td>
                                <td className="border" rowSpan={subRowsCount} style={mergedStyle}>
                                  {rec.status}
                                </td>
                              </>
                            )}

                            {canViewRevenue && (
                              <>
                                <td className="border text-center pe-2" style={{ verticalAlign: "middle" }}>{formatNumber(getRowBeforeDiscount(rec, subIdx))}</td>
                                {isFirstSubRow && (<td className="border" rowSpan={subRowsCount} style={{ ...mergedStyle, color: rec.walletUsage > 0 ? "red" : "inherit" }}>{formatNumber(rec.walletUsage || 0)}</td>)}
                                <td className="border text-center" style={{ verticalAlign: "middle" }}>{getRowDiscountRate(rec, subIdx) ? getRowDiscountRate(rec, subIdx) + "%" : "0%"}</td>
                                <td className="border text-center pe-2" style={{ verticalAlign: "middle" }}>{formatNumber(getRowDiscountAmount(rec, subIdx))}</td>
                                <td className="border text-center pe-2" style={{ verticalAlign: "middle" }}>{formatNumber(getRowRevenue(rec, subIdx))}</td>
                                {shouldRenderCompanyCell && isFirstSubRow && (<td className="border fw-bold text-primary text-center pe-2" rowSpan={companyRowSpan} style={mergedStyle}>{formatNumber(groupTotalRevenue)}</td>)}
                              </>
                            )}

                            {isFirstSubRow && (
                              <td className="border" rowSpan={subRowsCount} style={mergedStyle}>
                                <div className="d-flex justify-content-center gap-1">
                                  {!rec.code && (currentUser?.is_accountant || currentUser?.is_director) ? (
                                    <button className="btn btn-sm shadow-sm p-0 d-flex align-items-center justify-content-center" style={{ backgroundColor: "#06b6d4", color: "#fff", width: 28, height: 28 }} onClick={() => handleApprove(rec)}><Check size={16} /></button>
                                  ) : (
                                    <button className="btn btn-sm shadow-sm p-0 d-flex align-items-center justify-content-center" style={{ backgroundColor: "#f59e0b", color: "#fff", width: 28, height: 28 }} onClick={() => handleEditService(rec)}><Edit size={14} /></button>
                                  )}
                                  <button className="btn btn-sm shadow-sm p-0 d-flex align-items-center justify-content-center" style={{ backgroundColor: "#ef4444", color: "#fff", width: 28, height: 28 }} onClick={() => deleteServiceRow(rec.id, rec.isNew)}><Trash2 size={14} /></button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      });
                    })
                  ) : (<tr><td colSpan="100%" className="text-center text-muted py-4">Chưa có dữ liệu</td></tr>)}
                </tbody>
              </table>
            </div>
            <Pagination current={currentPage.services} total={serviceTotal} pageSize={20} currentLanguage={currentLanguage} onChange={(page) => handlePageChange("services", page)} />
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
          {rejectedData.length === 0 && (<tr><td colSpan="9" className="text-center py-3 text-muted">{currentLanguage === "vi" ? "Không có dữ liệu" : currentLanguage === "ko" ? "데이터가 없습니다" : "No data"}</td></tr>)}
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
    if (activeTab === 'pending') handlePendingChange(item.ID, field, e.target.value);
    if (activeTab === 'approved') handleApprovedChange(item.ID, field, e.target.value);
  }


  const renderPendingApprovedTab = () => {


    const totalColumns = activeTab === "pending" ? 8 : 9;
    
    // Check permission to approve B2B
    const canApproveB2B = currentUser?.is_director || currentUser?.perm_approve_b2b;

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
          pageSize={20}
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

                const company = approvedList.find(c => String(c.ID) === String(selectedService.companyId));


                let availableServices = [];
                if (company) {

                  if (company.DichVu) availableServices.push(...parseServices(company.DichVu));
                  if (company.DichVuKhac) availableServices.push(...parseServices(company.DichVuKhac));
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

                    <div className="col-md-12">
                      <label style={labelStyle}>
                        Danh mục <span className="text-danger">*</span>
                      </label>
                      <ModernSelect
                        name="DanhMuc"
                        value={selectedService.DanhMuc}
                        onChange={(e) => setSelectedService(prev => ({ ...prev, DanhMuc: e.target.value }))}
                        placeholder="Chọn danh mục chính"
                        options={(B2B_SERVICE_MAPPING[selectedService.serviceType] || []).map(dm => ({ value: dm, label: dm }))}
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


                    {(currentUser?.is_director || currentUser?.is_accountant || currentUser?.perm_approve_b2b) && (
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
                  marginTop: "2px",
                  fontStyle: "normal",
                };


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
                                    if (String(opt.value) !== String(value)) e.target.style.backgroundColor = twoColumns ? "#E5E7EB" : "#F3F4F6";
                                  }}
                                  onMouseLeave={(e) => {
                                    if (String(opt.value) !== String(value)) e.target.style.backgroundColor = "transparent";
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
                        style={{ ...inputStyle, backgroundColor: "#F3F4F6", color: "#9CA3AF" }}
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

                    {/* Địa chỉ nhận */}
                    <div className="col-12">
                      <label style={labelStyle}>{t.diaChiNhan}</label>
                      <input
                        type="text"
                        name="DiaChiNhan"
                        placeholder={t.diaChiNhanPlaceholder}
                        value={newServiceForm.DiaChiNhan || ""}
                        onChange={handleModalChange}
                        style={inputStyle}
                      />
                    </div>

                    <div className="col-12">
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
                          icon: showExtras ? <EyeOff size={14} /> : <Plus size={14} />,
                          onClick: () => {
                            // Nếu đang đóng mà mở ra thì reset về 1 dòng rỗng nếu chưa có gì
                            if (!showExtras && extraServices.length === 0) setExtraServices([""]);
                            setShowExtras(!showExtras);
                          }
                        }}
                      />

                      {showExtras && (
                        <div className="mt-2 p-3 bg-light rounded border">

                          <div style={{ fontSize: "11px", color: "#666", marginBottom: "8px", fontStyle: "italic" }}>

                            {isApprover
                              ? "Nhập tên dịch vụ bổ sung"
                              : "Nhập tên dịch vụ bổ sung"}
                          </div>

                          {extraServices.map((service, index) => (
                            <div key={index} className="d-flex mb-2 gap-2 align-items-center">

                              <input
                                className="form-control form-control-sm"
                                placeholder="Tên dịch vụ..."
                                value={service.name}
                                onChange={(e) => handleChangeExtra(index, "name", e.target.value)}

                                style={{ flex: isApprover ? 2.5 : 1 }}
                              />


                              {isApprover && (
                                <>

                                  <input
                                    className="form-control form-control-sm text-center"
                                    placeholder="Doanh thu"
                                    value={service.revenue}
                                    onChange={(e) => handleChangeExtra(index, "revenue", e.target.value)}
                                    style={{ flex: 1 }} // <-- Đã giảm kích thước
                                  />


                                  <select
                                    className="form-select form-select-sm"
                                    value={service.discount || ""}
                                    onChange={(e) => handleChangeExtra(index, "discount", e.target.value)}
                                    style={{
                                      flex: 0.5,
                                      fontSize: "12px",
                                      height: "31px",
                                      paddingLeft: "14px",
                                      cursor: "pointer"
                                    }}
                                  >
                                    <option value="">%</option>
                                    <option value="5">5%</option>
                                    <option value="10">10%</option>
                                    <option value="12">12%</option>
                                    <option value="15">15%</option>
                                    <option value="17">17%</option>
                                    <option value="20">20%</option>
                                    <option value="30">30%</option>
                                  </select>
                                </>
                              )}

                              {/* Nút xóa */}
                              <button
                                className="btn btn-sm btn-danger p-0 d-flex align-items-center justify-content-center"
                                style={{ width: "34px", height: "34px" }}
                                onClick={() => handleRemoveRow(index)}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                          {extraServices.length < 5 && (
                            <button className="btn btn-sm btn-success mt-1" onClick={handleAddRow}>
                              <Plus size={14} /> Thêm dòng
                            </button>
                          )}
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

                    {(currentUser?.is_director || currentUser?.is_accountant || currentUser?.perm_approve_b2b) && (
                      <div className="col-12">

                        <div className="d-flex gap-2">


                          <div style={{ flex: 1 }}>
                            <label style={labelStyle}>Doanh thu <span className="text-danger">*</span></label>
                            <input
                              type="text"
                              name="DoanhThu"
                              value={newServiceForm.DoanhThu}
                              onChange={handleModalChange}
                              placeholder="Doanh Thu"
                              style={{ ...inputStyle, textAlign: "center" }}
                            />
                          </div>


                          <div style={{ flex: 1 }}>
                            <label style={labelStyle}>Mức chiết khấu</label>
                            <ModernSelect
                              name="MucChietKhau"
                              value={newServiceForm.MucChietKhau || 0}
                              onChange={handleModalChange}
                              placeholder="%"
                              options={discountOptions}
                            />

                          </div>


                          <div style={{ flex: 1 }}>
                            <label style={labelStyle}>Ví</label>
                            <input
                              type="text"
                              name="Vi"
                              value={newServiceForm.Vi}
                              onChange={handleModalChange}
                              placeholder=""
                              style={{ ...inputStyle, textAlign: "center" }}
                            />
                            <div style={helperTextStyle}>Trừ ví (VND)</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* [MỚI] Input Trạng thái cho Modal Thêm/Sửa */}
                    <div className="col-12">
                      <label style={labelStyle}>Trạng thái <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        name="TrangThai"
                        value={newServiceForm.TrangThai || ""} // Map với state
                        onChange={handleModalChange}
                        placeholder="Nhập trạng thái (VD: Chờ duyệt, Đang xử lý...)"
                        style={inputStyle}
                      />
                    </div>
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