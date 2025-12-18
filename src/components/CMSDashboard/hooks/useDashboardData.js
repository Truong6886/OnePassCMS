import { useState, useEffect, useRef } from "react";
import { showToast } from "../../../utils/toast";
import translateService from "../../../utils/translateService";
import { authenticatedFetch } from "../../../utils/api";

export default function useDashboardData() {
  const [subViewMode, setSubViewMode] = useState("request");
  const [showSidebar, setShowSidebar] = useState(true);
  const [viewMode, setViewMode] = useState("summary");

  // Các state bộ lọc
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDichVu, setFilterDichVu] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Data & Pagination
  const [data, setData] = useState([]);
  const [users, setUsers] = useState([]);
  const [dichvuList, setDichvuList] = useState([]);

  // --- [SỬA] Đặt mặc định 20 hàng/trang giống B2C Page ---
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20; 
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("currentUser");
    return saved ? JSON.parse(saved) : null;
  });

  const tableContainerRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("currentUser");
    if (saved) setCurrentUser(JSON.parse(saved));
  }, []);

  // --- Fetch Data từ Server (Phân trang Server-side) ---
  const fetchData = async (page = 1) => {
    try {
      const user = JSON.parse(localStorage.getItem("currentUser"));
      setLoading(true);

      const isAdminDirectorOrAccountant =
        user?.is_admin || user?.is_director || user?.is_accountant;

      // URL Params giống logic B2C Page
      const queryParams = new URLSearchParams({
        page: page,
        limit: rowsPerPage, // Luôn lấy 20 dòng
      });

      // Phân quyền: Nếu là Admin/GĐ/KT thì xem hết (is_admin=true), ngược lại lọc theo userId
      if (isAdminDirectorOrAccountant) {
          queryParams.append("is_admin", "true");
      } else {
          queryParams.append("userId", user?.id || "");
      }

      // 1. Gọi API lấy danh sách yêu cầu
      const res1 = await authenticatedFetch(
        `https://onepasscms-backend.onrender.com/api/yeucau?${queryParams.toString()}`
      );
      const result1 = await res1.json();

      if (result1.success) {
        setData(result1.data); // Data này chỉ chứa 20 dòng của trang hiện tại
        setTotalPages(result1.totalPages || 1);
        // Không set lại CurrentPage ở đây để tránh vòng lặp, UI tự quản lý page request
      } else {
        setData([]);
      }

      // 2. Gọi API lấy danh sách User (để lọc)
      const res2 = await authenticatedFetch(
        "https://onepasscms-backend.onrender.com/api/User"
      );
      const result2 = await res2.json();
      if (result2.success) setUsers(result2.data);

    } catch (err) {
      console.error("❌ Lỗi fetch:", err);
      showToast("Lỗi tải dữ liệu!", "danger");
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch khi đổi trang
  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage]);

  // --- Xử lý Lưu/Sửa/Xóa ---
  const handleSave = async (updatedItem) => {
    try {
      const res = await authenticatedFetch(
        `https://onepasscms-backend.onrender.com/api/yeucau/${updatedItem.YeuCauID}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedItem),
        }
      );

      const result = await res.json();

      if (result.success) {
        // Cập nhật lại item trong danh sách hiện tại (client-side update để nhanh hơn)
        setData((prev) =>
          prev.map((item) =>
            item.YeuCauID === result.data.YeuCauID ? result.data : item
          )
        );
        showToast("Lưu thành công!", "success");
      } else {
        showToast(result.message || "Lỗi khi lưu!", "danger");
      }
    } catch (err) {
      showToast("Lỗi kết nối server!", "danger");
    }
  };

  const handleAddRequest = (newItem) => {
    // Nếu thêm mới, thường ta sẽ fetch lại trang 1 để thấy dữ liệu mới nhất
    fetchData(1);
    setCurrentPage(1);
  };

  const handleDelete = async (id) => {
    try {
      const res = await authenticatedFetch(
        `https://onepasscms-backend.onrender.com/api/yeucau/${id}`,
        { method: "DELETE" }
      );
      const result = await res.json();

      if (result.success) {
        showToast("Xóa thành công!", "success");
        fetchData(currentPage); // Load lại trang hiện tại
      } else {
        showToast(result.message || "Lỗi khi xóa!", "danger");
      }
    } catch (err) {
      console.error(err);
      showToast("Lỗi kết nối server!", "danger");
    }
  };

  // --- Lọc dữ liệu (Client-side filtering trên trang hiện tại) ---
  // Lưu ý: Vì ta đang phân trang Server (chỉ tải 20 dòng), việc lọc này chỉ tác dụng trên 20 dòng đó.
  // Đây là hành vi giống B2C Page hiện tại.
  const normalize = (str) =>
    typeof str === "string"
      ? str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      : "";

  const filteredData = data.filter((item) => {
    const matchSearch =
      (item.HoTen || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.Email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.SoDienThoai || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.MaHoSo || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = filterStatus ? item.TrangThai === filterStatus : true;

    const normalizedFilter = normalize(filterDichVu);
    const matchService = filterDichVu
      ? normalize(item.LoaiDichVu).includes(normalizedFilter) ||
        normalize(translateService(item.TenDichVu)).includes(normalizedFilter)
      : true;
    
    // Check filter User
    let matchUser = true;
    if (filterUser && filterUser !== "" && filterUser !== "--Chọn--") {
         // So sánh ID hoặc Tên tùy thuộc vào value của option
         matchUser = String(item.NguoiPhuTrachId) === String(filterUser) || item.NguoiPhuTrach?.name === filterUser;
    }

    // Check filter Date
    const itemDate = new Date(item.NgayTao);
    const matchDate =
      (!startDate || itemDate >= new Date(startDate)) &&
      (!endDate || itemDate <= new Date(endDate));

    return matchSearch && matchStatus && matchService && matchDate && matchUser;
  });

  const tableHeaders = [
    "#", "Mã hồ sơ", "Dịch vụ", "Hình thức", "Cơ sở tư vấn", "Họ tên",
    "Email", "Mã Vùng", "SĐT", "Tiêu đề", "Nội dung", "Chọn ngày", "Giờ",
    "Ngày tạo", "Trạng thái",
    ...(currentUser?.is_admin || currentUser?.is_director || currentUser?.is_accountant ? ["Người phụ trách"] : []),
    "Ghi chú", "Hành động",
  ];

  return {
    data,              // Dữ liệu gốc (20 dòng)
    setData,
    filteredData,      // Dữ liệu sau khi search/filter client-side (trên 20 dòng đó)
    users,
    dichvuList,
    handleDelete,
    currentUser,
    setCurrentUser,

    showSidebar, setShowSidebar,
    viewMode, setViewMode,
    subViewMode, setSubViewMode,

    showEditModal, setShowEditModal,
    showAddModal, setShowAddModal,

    // Filter states
    filterStatus, setFilterStatus,
    filterDichVu, setFilterDichVu,
    filterUser, setFilterUser,
    searchTerm, setSearchTerm,
    startDate, setStartDate,
    endDate, setEndDate,

    
    currentPage, setCurrentPage,
    rowsPerPage, 
    totalPages,  
    loading, setLoading,
 
    tableContainerRef,
    tableHeaders,

    fetchData,
    handleAddRequest,
    handleSave,
  };
}