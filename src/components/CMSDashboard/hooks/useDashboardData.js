import { useState, useEffect, useRef } from "react";
import { showToast } from "../../../utils/toast";
import translateService from "../../../utils/translateService";
export default function useDashboardData() {

  const [subViewMode, setSubViewMode] = useState("request");
  const [showSidebar, setShowSidebar] = useState(true);
  const [viewMode, setViewMode] = useState("summary");


  const [filterStatus, setFilterStatus] = useState("");
  const [filterDichVu, setFilterDichVu] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [filterRegion, setFilterRegion] = useState("");
  const [filterMode, setFilterMode] = useState("");

  const [timeRange, setTimeRange] = useState(30);
  const [searchTerm, setSearchTerm] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");


  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const [data, setData] = useState([]);
  const [users, setUsers] = useState([]);
  const [dichvuList, setDichvuList] = useState([]);


  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20;
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("currentUser");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    const saved = localStorage.getItem("currentUser");
    if (saved) setCurrentUser(JSON.parse(saved));
  }, []);


  const tableContainerRef = useRef(null);



  const fetchData = async (page = 1) => {
  try {
    const user = JSON.parse(localStorage.getItem("currentUser"));
    setLoading(true);

    // Xác định xem có phải admin hoặc director
    const isAdminOrDirector = user?.is_admin || user?.role === "director";

    const queryParams = new URLSearchParams({
      page,
      limit: rowsPerPage,
      is_admin: user?.is_admin || false,
    });
    if (!isAdminOrDirector) {
      queryParams.append("userId", user?.id || "");
    }

    const res1 = await fetch(
      `https://onepasscms-backend.onrender.com/api/yeucau?${queryParams.toString()}`
    );
    const result1 = await res1.json();

    if (result1.success) {
      setData(result1.data);
      setTotalPages(result1.totalPages || 1);
      setCurrentPage(result1.currentPage || 1);
    }

    const res2 = await fetch("https://onepasscms-backend.onrender.com/api/User");
    const result2 = await res2.json();

    if (result2.success) setUsers(result2.data);
  } catch (err) {
    console.error("❌ Lỗi fetch:", err);
    showToast("Lỗi tải dữ liệu!", "danger");
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage]);


  const handleSave = async (updatedItem) => {
    try {
      const res = await fetch(
        `https://onepasscms-backend.onrender.com/api/yeucau/${updatedItem.YeuCauID}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedItem),
        }
      );

      const result = await res.json();

      if (result.success) {
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
    setData((prev) => {
      if (prev.some((i) => i.YeuCauID === newItem.YeuCauID)) return prev;
      return [...prev, newItem];
    });
  };

  const handleStatusChange = (id, status) => {
    setData((prev) =>
      prev.map((item) =>
        item.YeuCauID === id ? { ...item, TrangThai: status } : item
      )
    );
  };

  const normalize = (str) =>
    typeof str === "string"
      ? str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      : "";

  const filteredData = data.filter((item) => {
    const matchSearch =
      item.HoTen?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.Email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.SoDienThoai?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = filterStatus ? item.TrangThai === filterStatus : true;

    const matchService = filterDichVu
      ? normalize(translateService(item.TenDichVu)).includes(
          normalize(filterDichVu)
        )
      : true;

    const itemDate = new Date(item.NgayTao);
    const matchDate =
      (!startDate || itemDate >= new Date(startDate)) &&
      (!endDate || itemDate <= new Date(endDate));

    let matchUser = true;
    if (filterUser && filterUser !== "--Chọn--")
      matchUser =
        String(item.NguoiPhuTrachId) === String(filterUser);

    return (
      matchSearch && matchStatus && matchService && matchDate && matchUser
    );
  });
const handleDelete = async (id) => {
    try {
      const res = await fetch(
        `https://onepasscms-backend.onrender.com/api/yeucau/${id}`,
        {
          method: "DELETE",
        }
      );
      const result = await res.json();

      if (result.success) {
        // Cập nhật lại state data sau khi xóa thành công trên server
        setData((prev) => prev.filter((item) => item.YeuCauID !== id));
        showToast("Xóa thành công!", "success");
      } else {
        showToast(result.message || "Lỗi khi xóa!", "danger");
      }
    } catch (err) {
      console.error(err);
      showToast("Lỗi kết nối server!", "danger");
    }
  };

  const tableHeaders = [
    "ID",
    "Mã hồ sơ",
    "Dịch vụ",
    "Hình thức",
    "Cơ sở tư vấn",
    "Họ tên",
    "Email",
    "Mã Vùng",
    "SĐT",
    "Tiêu đề",
    "Nội dung",
    "Chọn ngày",
    "Giờ",
    "Ngày tạo",
    "Trạng thái",
    ...(currentUser?.is_admin ? ["Người phụ trách"] : []),
    "Ghi chú",
    "Hành động",
  ];

 return {

    data,
    setData, 
    filteredData,
    users,
    dichvuList,
    handleDelete,
    currentUser,

    showSidebar,
    setShowSidebar,

    viewMode,
    setViewMode,

    subViewMode,
    setSubViewMode,

    showEditModal,
    setShowEditModal,

    showAddModal,
    setShowAddModal,

    filterStatus,
    setFilterStatus,
    filterDichVu,
    setFilterDichVu,
    filterUser,
    setFilterUser,
    searchTerm,
    setSearchTerm,
    startDate,
    setStartDate,
    endDate,
    setEndDate,

    timeRange,          
    setTimeRange,   

    currentPage,
    setCurrentPage,
    rowsPerPage,
    totalPages,

    tableContainerRef,
    tableHeaders,

    fetchData,
    handleAddRequest,
    handleSave,
    handleStatusChange,
    currentUser,
    setCurrentUser,
};

}
