import React, { useState, useEffect, useRef } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart,XAxis,YAxis,Bar, LabelList} from "recharts";
import { Filter, ChevronRight } from "lucide-react";
import { FilterX } from "lucide-react";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../components/CMSDashboard.css';
import Header from "./Header";
import Sidebar from './Sidebar'; 
import AddRequestModal from './AddRequestModal';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { Bell } from "lucide-react";
import { Save, Trash2 } from "lucide-react";
import { showToast } from '../utils/toast';
import TableRow from './TableRow'
import * as bootstrap from 'bootstrap';
import EditProfileModal from "./EditProfileModal";
import DashboardSummary from "./CMSDashboard/DashboardSummary";
window.bootstrap = bootstrap;



// ================= EditProfileModal =================





// ================= CMSDashboard =================
const CMSDashboard = () => {
  const [subViewMode, setSubViewMode] = useState("request"); 
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const filterMenuRef = useRef(null);

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target)) {
        setShowFilterMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const [showSidebar, setShowSidebar] = useState(true);
  const [viewMode, setViewMode] = useState("summary");
  const [fromChart, setFromChart] = useState(false);
  const [filterDichVu, setFilterDichVu] = useState("");
  const [timeRange, setTimeRange] = useState(30); // mặc định 30 ngày
  const [filterUser, setFilterUser] =useState("")
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showRequestList, setShowRequestList] = useState(false);
  const [filterRegion, setFilterRegion] = useState("");
  const [filterType, setFilterType] = useState("status"); 
  const [data, setData] = useState([]);
  const [users, setUsers] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const tableContainerRef = useRef(null);
  const [hasNewRequest, setHasNewRequest] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('vi'); // 'vi' or 'en'
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem("notifications");
    return saved ? JSON.parse(saved) : [];
  });

  const [emailList, setEmailList] = useState([]);

    useEffect(() => {
      if (subViewMode === "email") {
        fetch("https://onepasscms-backend.onrender.com/api/email")
          .then(res => res.json())
          .then(data => data.success && setEmailList(data.data))
          .catch(err => console.error("❌ Lỗi tải email:", err));
      }
    }, [subViewMode]);
  const handleEmailUpdate = async (id, newEmail) => {
    const res = await fetch(`https://onepasscms-backend.onrender.com/api/email/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newEmail }),
    });
    const result = await res.json();
    if (result.success) {
      showToast("Đã cập nhật email", "success");
      setEmailList(prev => prev.map(e => e.id === id ? result.data : e));
    }
  };

  const handleEmailDelete = async (id) => {
    if (!window.confirm("Xóa email này?")) return;
    const res = await fetch(`https://onepasscms-backend.onrender.com/api/email/${id}`, { method: "DELETE" });
    const result = await res.json();
    if (result.success) {
      showToast("Đã xóa email", "success");
      setEmailList(prev => prev.filter(e => e.id !== id));
    }
  };

  const handleOpenEditModal = () => {
    console.log("📝 Mở modal chỉnh sửa profile");
    setShowEditModal(true);
  };

  const handleLogout = () => {
    console.log("🚪 Đang đăng xuất...");
    localStorage.removeItem("currentUser");
    window.location.href = "/login";
  };

  const [currentUser, setCurrentUser] = useState({
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    avatar: null,
    is_admin: true
  });
  const [filterMode, setFilterMode] = useState("");
  const [searchTerm, setSearchTerm] = useState('');
  const toastContainerRef = useRef(null);
  const [dichvuList, setDichvuList] = useState([]);
  
  const handleToggleSidebar = () => setShowSidebar(prev => !prev);

useEffect(() => {
  const askPermission = () => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then((perm) => {
        console.log("🔔 Quyền thông báo:", perm);
        if (perm === "granted") {
          new Notification("✅ Bật thông báo thành công", {
            body: "Bạn sẽ nhận được thông báo khi có yêu cầu mới!",
            icon: "/logo192x192.png",
          });
        } else {
          alert("⚠️ Vui lòng cho phép trình duyệt gửi thông báo để nhận yêu cầu mới!");
        }
      });
    }
  };


  window.addEventListener("click", askPermission, { once: true });


  if ("Notification" in window && Notification.permission === "granted") {
    console.log("🔔 Notification đã được cấp quyền sẵn");
  }

  return () => window.removeEventListener("click", askPermission);
}, []);


useEffect(() => {
  const socket = io("https://onepasscms-backend.onrender.com", {
    transports: ["websocket", "polling"],
    withCredentials: false,
  });

  socket.on("connect", () => console.log("✅ Socket connected:", socket.id));

  // 🟢 Nhận sự kiện yêu cầu mới từ khách hàng
  socket.on("new_request", (newRequestData) => {
    console.log("📨 Nhận yêu cầu mới từ KH:", newRequestData);

    // ✅ Thêm yêu cầu vào danh sách nếu chưa có
    setData((prev) => {
      const exists = prev.some((r) => r.YeuCauID === newRequestData.YeuCauID);
      return exists ? prev : [...prev, newRequestData];
    });

    // ✅ Tạo thông báo trong hệ thống dashboard
    const newNotification = {
      id: Date.now(),
      message:
        currentLanguage === "vi"
          ? `Yêu cầu mới từ: ${newRequestData.HoTen || "Khách hàng"}`
          : `New request from: ${newRequestData.HoTen || "Customer"}`,
      time: new Date().toLocaleTimeString("vi-VN"),
      requestId: newRequestData.YeuCauID,
    };

    setNotifications((prev) => {
      const updated = [newNotification, ...prev.slice(0, 9)];
      localStorage.setItem("notifications", JSON.stringify(updated));
      return updated;
    });

    // ✅ Hiện toast nội bộ trong dashboard
    showToast(
      currentLanguage === "vi"
        ? `Có yêu cầu mới từ ${newRequestData.HoTen}`
        : `New request from ${newRequestData.HoTen}`,
      "success"
    );

    setHasNewRequest(true);
    setShowNotification(true);

   
    if ("Notification" in window && Notification.permission === "granted") {
    try {
      const translatedService = translateService(newRequestData.TenDichVu);

      new Notification("Yêu cầu khách hàng mới", {
        body: `${newRequestData.HoTen || "Khách hàng"} - ${
          translatedService || "Dịch vụ"
        }`,
        icon: "logo192x192.png",
        badge: "logo192x192.png",
        requireInteraction: true,
        silent: false,
      });
    } catch (error) {
      console.error("❌ Lỗi hiển thị Notification:", error);
    }
      } else {
        console.warn("⚠️ Trình duyệt chưa cho phép Notification hoặc không hỗ trợ.");
      }
  });

  socket.on("disconnect", () => console.log("❌ Socket disconnected"));
  socket.on("error", (error) => console.error("Socket error:", error));

  return () => socket.disconnect();
}, [currentLanguage]);



  const handleProfileUpdate = async (userId, formData) => {
    try {
      console.log("🔄 Đang cập nhật profile...", { userId, formData });
      
      const res = await fetch(`https://onepasscms-backend.onrender.com/api/User/${userId}`, { 
        method: "PUT", 
        body: formData 
      });
      
      const result = await res.json();
      console.log("📨 Kết quả cập nhật:", result);
      
      if(result.success){
        const updatedUser = {
          ...currentUser,
          username: formData.get("username") || currentUser.username,
          email: formData.get("email") || currentUser.email,
          avatar: result.data?.[0]?.avatar || currentUser.avatar
        };
        
        setCurrentUser(updatedUser);
        localStorage.setItem("currentUser", JSON.stringify(updatedUser));
        showToast(currentLanguage === 'vi' ? "Cập nhật profile thành công!" : "Profile updated successfully!"),"success";
        return true;
      } else {
        showToast(
          currentLanguage === 'vi' 
            ? `❌ Cập nhật thất bại: ${result.message || result.error}`
            : `❌ Update failed: ${result.message || result.error}`, 
          "danger"
        );
        return false;
      }
    } catch(err){
      console.error("❌ Lỗi cập nhật profile:", err);
      showToast(currentLanguage === 'vi' ? "Lỗi máy chủ!" : "Server error!", "danger");
      return false;
    }
  };

  // Sửa useEffect cho sticky columns
  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;

    const stickyCols = container.querySelectorAll('.sticky-col');
    const handleScroll = () => {
      stickyCols.forEach(col => {
        if(container.scrollLeft > 0) col.classList.add('sticky');
        else col.classList.remove('sticky');
      });
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [data]);

  // Fetch dịch vụ từ API
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("https://onepasscms-backend.onrender.com/api/dichvu");
        const result = await res.json();
        if (result.success) setDichvuList(result.data);
        else setDichvuList([]);
      } catch (err) {
        console.error(err);
        setDichvuList([]);
      }
    })();
  }, []);

  // Fetch data ban đầu
useEffect(() => {
  const fetchData = async (page = 1) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem("currentUser"));
      setLoading(true);
      const res1 = await fetch(
        `https://onepasscms-backend.onrender.com/api/yeucau?page=${page}&limit=${rowsPerPage}&userId=${currentUser?.id || ""}&is_admin=${currentUser?.is_admin || false}`
      );
      const result1 = await res1.json();
      if (result1.success) {
        setData(result1.data);
        setTotalPages(result1.totalPages || 1);
        setCurrentPage(result1.currentPage || 1);
      } else {
        console.warn("⚠️ Lỗi khi tải yêu cầu:", result1.message);
      }


      const res2 = await fetch("https://onepasscms-backend.onrender.com/api/User");
      const result2 = await res2.json();
      if (result2.success) setUsers(result2.data);
    } catch (err) {
      console.error("❌ Lỗi khi tải dữ liệu:", err);
      showToast(
        currentLanguage === "vi" ? "Lỗi tải dữ liệu!" : "Error loading data!",
        "danger"
      );
    } finally {
      setLoading(false);
    }
  };

  // Gọi khi load lần đầu hoặc khi đổi trang
  fetchData(currentPage);
}, [currentPage, rowsPerPage]);



  const handleBellClick = () => {
    setShowNotification(prev => !prev);
    setHasNewRequest(false); 
  };

// 🟦 Hàm cho ADMIN thêm yêu cầu mới (chỉ thêm hàng + toast)
const handleAddRequest = (newItem) => {
  setData(prev => {
    const exists = prev.some(item => item.YeuCauID === newItem.YeuCauID);
    if (exists) return prev;
    return [...prev, newItem]; // thêm cuối bảng
  });

  // showToast(
  //   currentLanguage === "vi"
  //     ? "Thêm yêu cầu mới thành công!"
  //     : "New request added successfully!",
  //   "success"
  // );
};

const handleSave = async (updatedItem) => {
  try {
    const res = await fetch(`https://onepasscms-backend.onrender.com/api/yeucau/${updatedItem.YeuCauID}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedItem),
    });
    const result = await res.json();

    if (result.success) {
      setData((prevData) =>
        prevData.map((item) =>
          item.YeuCauID === result.data.YeuCauID ? result.data : item
        )
      );
      showToast("Lưu thành công!", "success");
    } else {
      showToast(result.message || "Lỗi khi lưu!", "error");
    }
  } catch (err) {
    console.error(err);
    showToast("Lỗi kết nối máy chủ!", "error");
  }
};



  const handleStatusChange = (id, status) => {
    setData(prev => prev.map(item => 
      item.YeuCauID === id ? {...item, TrangThai: status} : item
    ));
  };

  // const handleSaveRow = async (id) => {
  //   const item = data.find(r => r.YeuCauID === id);
  //   if(!item) return;
  //   try {
  //     const res = await fetch(`https://onepasscms-backend.onrender.comapi/yeucau/${id}`, {
  //       method: 'PUT',
  //       headers: {'Content-Type': 'application/json'},
  //       body: JSON.stringify(item)
  //     });
  //     const result = await res.json();
  //     if(result.success) showToast(currentLanguage === 'vi' ? '✅ Cập nhật thành công!' : '✅ Update successful!');
  //     else showToast(currentLanguage === 'vi' ? '❌ Lỗi khi lưu dữ liệu!' : '❌ Error saving data!', 'danger');
  //   } catch(err) { 
  //     showToast(currentLanguage === 'vi' ? '❌ Lỗi máy chủ!' : '❌ Server error!', 'danger'); 
  //   }
  // };

// 🧃 Hàm hiển thị toast thông báo (duy nhất)

// ✅ Khi thay đổi bộ lọc hoặc tìm kiếm, quay về trang đầu
useEffect(() => {
  setCurrentPage(1);
}, [filterStatus, filterDichVu, filterUser, startDate, endDate, searchTerm]);

 const statusColors = {
    "Tư vấn": "#f59e0b",
    "Đang xử lý": "#3b82f6",
    "Đang nộp hồ sơ": "#06b6d4",
    "Hoàn thành": "#22c55e",
    "": "#2563eb", // default (xanh lam)
  };


// ✅ Hàm dịch TenDichVu từ tiếng Hàn sang tiếng Việt
const translateService = (serviceName) => {
  const map = {
    "인증 센터": "Chứng thực",
    "결혼 이민": "Kết hôn",
    "출생신고 대행": "Khai sinh, khai tử",
    "출입국 행정 대행": "Xuất nhập cảnh",
    "신분증명 서류 대행": "Giấy tờ tùy thân",
    "입양 절차 대행": "Nhận nuôi",
    "비자 대행": "Thị thực",
    "법률 컨설팅": "Tư vấn pháp lý",
    "B2B 서비스": "Dịch vụ B2B",
    "기타": "Khác",
  };
  return map[serviceName] || serviceName;
};
  const statusFilteredData = data.filter(
      (item) => !filterStatus || item.TrangThai === filterStatus
    );

    // 🔹 Gom nhóm dịch vụ
  const groupedByService =  statusFilteredData.reduce((acc, item) => {
    const service = translateService(item.TenDichVu || "Không xác định");
    acc[service] = (acc[service] || 0) + 1;
    return acc;
  }, {});

  const total = Object.values(groupedByService).reduce((a, b) => a + b, 0);
    // 🔹 Dữ liệu biểu đồ
    const statusChartData = Object.entries(groupedByService).map(
      ([service, count]) => ({
        service,
        count,
      })
    );

const chartFilteredData = data.filter((item) => {
  if (!item.NgayTao) return false;
  const date = new Date(item.NgayTao);
  const now = new Date();
  const diffDays = (now - date) / (1000 * 60 * 60 * 24);
  return diffDays <= timeRange;
});


// Gom dữ liệu theo ngày và dịch vụ
const chartData = Object.values(
  chartFilteredData.reduce((acc, cur) => {
    const date = new Date(cur.NgayTao).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const service = translateService(cur.TenDichVu || "Không xác định");
    if (!acc[date]) acc[date] = { date };
    acc[date][service] = (acc[date][service] || 0) + 1;
    return acc;
  }, {})
);

const allServices = [
  ...new Set(
    chartFilteredData.map((d) =>
      translateService(d.TenDichVu || "Không xác định")
    )
  ),
];



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
    ? normalize(translateService(item.TenDichVu)).includes(normalize(filterDichVu))
    : true;

  const itemDate = new Date(item.NgayTao);
  const matchDate =
    (!startDate || itemDate >= new Date(startDate)) &&
    (!endDate || itemDate <= new Date(endDate));

  // ✅ SỬA LẠI: Lọc theo nhân viên phụ trách - so sánh ID
  let matchUser = true;
  if (filterUser && filterUser !== "" && filterUser !== "--Chọn--") {
    // So sánh trực tiếp ID của nhân viên phụ trách
    matchUser = String(item.NguoiPhuTrachId) === String(filterUser);
  }

  return matchSearch && matchStatus && matchService && matchDate && matchUser;
});


  const pieData = [
    {
      name: currentLanguage === "vi" ? "Tư vấn" : "Consulting",
      value: data.filter((d) => d.TrangThai === "Tư vấn").length,
      TrangThai: "Tư vấn",
    },
    {
      name: currentLanguage === "vi" ? "Đang xử lý" : "Processing",
      value: data.filter((d) => d.TrangThai === "Đang xử lý").length,
      TrangThai: "Đang xử lý",
    },
    {
      name: currentLanguage === "vi" ? "Đang nộp hồ sơ" : "Submitting",
      value: data.filter((d) => d.TrangThai === "Đang nộp hồ sơ").length,
      TrangThai: "Đang nộp hồ sơ",
    },
    {
      name: currentLanguage === "vi" ? "Hoàn thành" : "Completed",
      value: data.filter((d) => d.TrangThai === "Hoàn thành").length,
      TrangThai: "Hoàn thành",
    },
  ];
// 🔹 Bảng màu thống nhất toàn dashboard
const serviceColorMap = {
  "Chứng thực": "#3b82f6",      // Xanh lam
  "Kết hôn": "#ec4899",         // Hồng đậm
  "Dịch vụ B2B": "#06b6d4",     // Xanh ngọc
  "Tư vấn pháp lý": "#84cc16",  // Xanh lá sáng
  "Khai sinh, khai tử": "#f59e0b",
  "Xuất nhập cảnh": "#6366f1",
  "Giấy tờ tùy thân": "#10b981",
  "Nhận nuôi": "#8b5cf6",
  "Thị thực": "#f97316",
  "Khác": "#9ca3af",
};

// const pieColors = ["#60a5fa", "#facc15", "#fb923c", "#34d399"];



  // Dịch các header của table theo ngôn ngữ
  const tableHeaders = currentLanguage === 'vi' 
    ? [
        'ID', 'Mã hồ sơ', 'Dịch vụ', 'Hình thức','Cơ sở tư vấn','Họ tên', 'Email', 'Mã Vùng', 
        'SĐT', 'Tiêu đề', 'Nội dung', 'Chọn ngày', 'Giờ', 'Ngày tạo', 'Trạng thái',
        ...(currentUser.is_admin ? ['Người phụ trách'] : []),
        'Ghi chú', 'Hành động'
      ]
    : [
        'ID', 'Record ID', 'Service', 'Mode','Consulting Branch', 'Full Name', 'Email', 'Area Code', 
        'Phone', 'Title', 'Content', 'Select Date', 'Time', 'Created Date', 'Status',
        ...(currentUser.is_admin ? ['Assignee'] : []),
        'Note', 'Action'
      ];

  return (
    <div>
      <Header
        currentUser={currentUser}
        onToggleSidebar={handleToggleSidebar}
        showSidebar={showSidebar}
        onOpenEditModal={handleOpenEditModal}
        hasNewRequest={hasNewRequest}
        onBellClick={handleBellClick}
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
      />

      {/* Notification Dropdown */}
      {showNotification && (
        <div
          style={{
            position: "fixed",
            top: "39px",
            right: "90px",
            background: "white",
            borderRadius: "10px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            width: "300px",
            padding: "15px",
            zIndex: 3000,
            animation: "fadeInUp 0.3s ease",
            border: "1px solid #e5e7eb",
            maxHeight: "250px",
            overflowY: "auto"
          }}
        >
          <div
            style={{
              fontWeight: "600",
              color: "#2563eb",
              marginBottom: "10px",
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              justifyContent: "space-between"
            }}
          >
            <span>🔔 {currentLanguage === 'vi' ? 'Thông báo mới' : 'New Notifications'}</span>
            <button
              onClick={() => setShowNotification(false)}
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: "#9ca3af",
                fontSize: "14px"
              }}
            >
              ✕
            </button>
          </div>

          {notifications.length === 0 ? (
            <div style={{ fontSize: "14px", color: "#6b7280" }}>
              {currentLanguage === 'vi' ? 'Chưa có thông báo' : 'No notifications'}
            </div>
          ) : (
            notifications.map((n, i) => (
              <div
                key={i}
                style={{
                  padding: "8px 0",
                  borderBottom: "1px solid #f3f4f6",
                  cursor: "pointer"
                }}
                onClick={() => setShowNotification(false)}
              >
                <div style={{ fontSize: "14px", color: "#374151" }}>{n.message}</div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    marginTop: "4px",
                    fontStyle: "italic"
                  }}
                >
                  {n.time}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    {/* <Header
        currentUser={currentUser}
        onToggleSidebar={handleToggleSidebar}
        showSidebar={showSidebar}
        onOpenEditModal={handleOpenEditModal}
        hasNewRequest={hasNewRequest}
        onBellClick={handleBellClick}
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
      /> */}

    <Sidebar collapsed={!showSidebar}  user={currentUser} />


      <div
        style={{
          marginTop: 60,
          padding: 20,
          marginLeft: showSidebar ? 250 : 60,
          transition: "margin-left 0.3s",
        }}
      >
        {/* 🟦 Thanh tab điều hướng — chỉ hiển thị với admin */}
        {currentUser?.is_admin && (
          <div
            className="d-flex border-bottom mb-4"
            style={{
              gap: "2rem",
              borderColor: "#e0e0e0",
              fontWeight: 500,
              fontSize: "1rem",
            }}
          >
            {[
               { key: "summary", labelVi: "Tổng quan", labelEn: "Summary" },
                { key: "list", labelVi: "Danh sách", labelEn: "List" },
              ].map((tab) => (
                <div
                  key={tab.key}
                  onClick={() => {
                    if (tab.key === "list") {
                      if (!fromChart) {
                        // 🟢 Nếu KHÔNG đến từ biểu đồ, reset filter về mặc định
                        setFilterType(null);
                        setFilterDichVu(null);
                        setFilterStatus(null);
                      }
                    }
                    setFromChart(false);
                    setViewMode(tab.key);
                  }}
                  style={{
                    cursor: "pointer",
                    paddingBottom: "6px",
                    borderBottom:
                      viewMode === tab.key
                        ? "3px solid #2563eb"
                        : "3px solid transparent",
                    color: viewMode === tab.key ? "#2563eb" : "#6b7280",
                    fontWeight: viewMode === tab.key ? "600" : "500",
                    transition: "all 0.2s ease",
                  }}
                >
                  {currentLanguage === "vi" ? tab.labelVi : tab.labelEn}
              </div>

            ))}
          </div>
          
        )}

    {currentUser?.is_admin && viewMode === "summary" && (
      <DashboardSummary
        data={data}
        currentLanguage={currentLanguage}
        serviceColorMap={serviceColorMap}
        translateService={translateService}
        filterDichVu={filterDichVu}
        setFilterDichVu={setFilterDichVu}
        filterRegion={filterRegion}
        setFilterRegion={setFilterRegion}
        filterMode={filterMode}
        setFilterMode={setFilterMode}
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        groupedByService={groupedByService}
        total={total}
        chartData={chartData}
        allServices={allServices}
      />
    )}



 {(!currentUser?.is_admin || viewMode === "list") && (
  <>
    <div className="mb-4">
      {/* --- Tabs --- */}
      <div
        className="d-flex border-bottom mb-3"
        style={{
          gap: "1.5rem",
          fontSize: "15px",
          fontWeight: 500,
        }}
      >
        {[
          { key: "request", labelVi: "Danh sách yêu cầu", labelEn: "Requests" },
          { key: "email", labelVi: "Danh sách email", labelEn: "Emails" },
        ].map((tab) => (
          <button
            key={tab.key}
            className="bg-transparent border-0 position-relative pb-2"
            style={{
              color: subViewMode === tab.key ? "#2563eb" : "#6b7280",
              borderBottom:
                subViewMode === tab.key
                  ? "2px solid #2563eb"
                  : "2px solid transparent",
              transition: "all 0.2s ease",
              cursor: "pointer",
            }}
            onClick={() => setSubViewMode(tab.key)}
          >
            {currentLanguage === "vi" ? tab.labelVi : tab.labelEn}
          </button>
        ))}
      </div>

      {/* --- Nếu đang ở tab Danh sách yêu cầu --- */}
      {subViewMode === "request" && (
        <>
          <h5 className="fw-semibold mb-3 text-primary">
            {currentLanguage === "vi"
              ? "Danh sách yêu cầu khách hàng"
              : "Customer Request List"}
          </h5>

          {/* 🔍 Thanh tìm kiếm + ➕ nút thêm */}
          <div className="d-flex justify-content-between align-items-center">
            <input
              type="text"
              className="form-control shadow-sm"
              placeholder={
                currentLanguage === "vi"
                  ? "Tìm kiếm Họ tên, Email, SĐT..."
                  : "Search Name, Email, Phone..."
              }
              style={{
                width: 300,
                borderRadius: "30px",
                paddingLeft: "18px",
                transition: "all 0.3s ease",
              }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={(e) =>
                (e.target.style.boxShadow = "0 0 8px rgba(37,99,235,0.3)")
              }
              onBlur={(e) => (e.target.style.boxShadow = "none")}
            />

            {currentUser?.is_admin && (
              <button
                className="btn btn-success shadow-sm"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  fontSize: 28,
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.25s ease",
                  padding: 0,
                }}
                onClick={() => setShowAddModal(true)}
              >
                <span style={{ transform: "translateY(-1px)" }}>+</span>
              </button>
            )}
          </div>


          <div className="table-responsive mt-3" ref={tableContainerRef}>
            <table className="table table-bordered table-hover align-middle">
              <thead>
                <tr>
                  {tableHeaders.map((header, i) => (
                    <th
                      key={i}
                      className={
                        header ===
                        (currentLanguage === "vi" ? "Họ tên" : "Full Name")
                          ? "sticky-col"
                          : ""
                      }
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {data.length > 0 ? (
                  data.map((item) => (
                    <TableRow
                      key={item.YeuCauID}
                      item={item}
                      dichvuList={dichvuList || []}
                      users={users}
                      currentUser={currentUser}
                      onStatusChange={handleStatusChange}
                      onSave={handleSave}
                      data={data}
                      currentLanguage={currentLanguage}
                      onDelete={(id) =>
                        setData((prev) =>
                          prev.filter((r) => r.YeuCauID !== id)
                        )
                      }
                    />
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={tableHeaders.length}
                      className="text-center py-4 text-muted"
                    >
                      {currentLanguage === "vi"
                        ? "Không có dữ liệu"
                        : "No data available"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* --- Nếu đang ở tab Danh sách email --- */}
{subViewMode === "email" && (
  <>
    <h5 className="fw-semibold mb-3 text-primary">
      {currentLanguage === "vi" ? "Danh sách email hệ thống" : "System Email List"}
    </h5>

    <div className="table-responsive" ref={tableContainerRef}>
      <table className="table table-bordered table-hover align-middle mb-0">
        <thead
          style={{
            backgroundColor: "#1e3a8a",
            color: "white",
            fontWeight: 600,
            fontSize: "14px",
            textAlign: "center",
          }}
        >
          <tr>
            <th style={{ width: 60 }}>#</th>
            <th>Email</th>
            <th style={{ width: 220 }}>
              {currentLanguage === "vi" ? "Ngày tạo" : "Created At"}
            </th>
            <th style={{ width: 150 }}>
              {currentLanguage === "vi" ? "Hành động" : "Actions"}
            </th>
          </tr>
        </thead>

        <tbody>
          {emailList.length > 0 ? (
            emailList.map((item, idx) => (
              <tr key={item.id}>
                {/* ID */}
                <td className="text-center fw-semibold">{idx + 1}</td>

                {/* Ô input email */}
                <td className="text-center align-middle">
                  <input
                    type="email"
                    className="form-control form-control-sm text-center"
                    style={{
                      fontSize: "14px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "4px",
                      padding: "4px 8px",
                      width: "100%",
                      maxWidth: "320px",
                      margin: "0 auto",
                    }}
                    value={item.Email}
                    onChange={(e) => {
                      const newEmail = e.target.value;
                      setEmailList((prev) =>
                        prev.map((el) =>
                          el.id === item.id ? { ...el, Email: newEmail } : el
                        )
                      );
                    }}
                  />
                </td>

                {/* Ngày tạo */}
                <td className="text-center text-muted small align-middle">
                  {item.NgayTao
                    ? new Date(item.NgayTao).toLocaleString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-"}
                </td>

                {/* Cột hành động */}
                <td className="text-center">
                  <div className="d-flex justify-content-center align-items-center gap-2">
                    {/* Nút lưu */}
                    <button
                      className="btn btn-sm btn-primary d-flex align-items-center justify-content-center"
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "6px",
                      }}
                      onClick={async () => {
                        try {
                          const res = await fetch(
                            `https://onepasscms-backend.onrender.com/api/email/${item.id}`,
                            {
                              method: "PUT",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ Email: item.Email }),
                            }
                          );
                          const result = await res.json();
                          if (result.success) {
                            showToast(
                              currentLanguage === "vi"
                                ? "Đã lưu email thành công!"
                                : "Email saved successfully!",
                              "success"
                            );
                          } else {
                            showToast(result.message || "Lỗi khi lưu", "error");
                          }
                        } catch (err) {
                          showToast("Server error!", "error");
                        }
                      }}
                    >
                      <i className="bi bi-floppy-fill fs-6"></i>
                    </button>

                    {/* Nút xóa */}
                    <button
                      className="btn btn-sm btn-danger d-flex align-items-center justify-content-center"
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "6px",
                      }}
                      onClick={async () => {
                        if (
                          !window.confirm(
                            currentLanguage === "vi"
                              ? "Bạn có chắc muốn xóa email này?"
                              : "Are you sure to delete this email?"
                          )
                        )
                          return;
                        try {
                          const res = await fetch(
                            `https://onepasscms-backend.onrender.com/api/email/${item.id}`,
                            { method: "DELETE" }
                          );
                          const result = await res.json();
                          if (result.success) {
                            setEmailList((prev) =>
                              prev.filter((e) => e.id !== item.id)
                            );
                            showToast(
                              currentLanguage === "vi"
                                ? "Đã xóa email"
                                : "Email deleted",
                              "success"
                            );
                          } else {
                            showToast(result.message || "Lỗi khi xóa", "error");
                          }
                        } catch {
                          showToast("Server error!", "error");
                        }
                      }}
                    >
                      <i className="bi bi-trash-fill fs-6"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="text-center py-4 text-muted">
                {currentLanguage === "vi"
                  ? "Không có email nào."
                  : "No emails found."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </>
)}


    </div>
  </>
)}

</div>

      {showEditModal && (
        <EditProfileModal 
          currentUser={currentUser} 
          onUpdate={handleProfileUpdate} 
          onClose={() => setShowEditModal(false)} 
          currentLanguage={currentLanguage}
        />
      )}
      
     {showAddModal && (
        <AddRequestModal
          dichvuList={dichvuList}
          users={users}
          onClose={() => setShowAddModal(false)}
          onSave={handleAddRequest} // ✅ Gọi hàm riêng này
          currentLanguage={currentLanguage}
        />
      )}


      <div ref={toastContainerRef} id="toast-container"></div>
    </div>
  );
};

export default CMSDashboard;
