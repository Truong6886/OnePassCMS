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
import DashboardList from './CMSDashboard/DashboardList';
import NotificationPanel from "./CMSDashboard/NotificationPanel";
import useSocketListener from "./CMSDashboard/hooks/useSocketListener";
import DashboardHeader from "./CMSDashboard/DashboardHeader";
import useDashboardData from './CMSDashboard/hooks/useDashboardData';
import translateService from "../utils/translateService";
window.bootstrap = bootstrap;









export default function CMSDashboard() {

  const {
    currentUser,
    showSidebar,
    setShowSidebar,
    viewMode,
    setViewMode,
    showEditModal,
    setShowEditModal,
    showAddModal,
    setShowAddModal,


    data,
    filteredData,
    users,
    dichvuList,


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

    subViewMode,
    setSubViewMode,
    filterRegion,
    setFilterRegion,
    filterMode,
    setFilterMode,
    timeRange,
    setTimeRange,
  } = useDashboardData();

 
  const [loading, setLoading] = useState(false);

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

  const [fromChart, setFromChart] = useState(false);

 

  const [showRequestList, setShowRequestList] = useState(false);
  const [filterType, setFilterType] = useState("status"); 



  const [hasNewRequest, setHasNewRequest] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(
    localStorage.getItem("language") || "vi"
  );

  useEffect(() => {
    const saved = localStorage.getItem("language");
    if (saved) setCurrentLanguage(saved);
  }, []);

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




  const toastContainerRef = useRef(null);

  const handleToggleSidebar = () => setShowSidebar(prev => !prev);

useEffect(() => {
  const askPermission = () => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then((perm) => {
        console.log("Quyền thông báo:", perm);
        if (perm === "granted") {
          new Notification("Bật thông báo thành công", {
            body: "Bạn sẽ nhận được thông báo khi có yêu cầu mới!",
            icon: "/favicon_logo.png",
          });
        } else {
          alert("Vui lòng cho phép trình duyệt gửi thông báo để nhận yêu cầu mới!");
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


useSocketListener({
  currentLanguage,
  setNotifications,
  setHasNewRequest,
  setShowNotification,
});



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
 

  // // Fetch dịch vụ từ API
  // useEffect(() => {
  //   (async () => {
  //     try {
  //       const res = await fetch("https://onepasscms-backend.onrender.com/api/dichvu");
  //       const result = await res.json();
  //       if (result.success) setDichvuList(result.data);
  //       else setDichvuList([]);
  //     } catch (err) {
  //       console.error(err);
  //       setDichvuList([]);
  //     }
  //   })();
  // }, []);


useEffect(() => {
  fetchData(currentPage);
}, [currentPage, rowsPerPage]);



  const handleBellClick = () => {
    setShowNotification(prev => !prev);
    setHasNewRequest(false); 
  };

// 🟦 Hàm cho ADMIN thêm yêu cầu mới (chỉ thêm hàng + toast)





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
      <NotificationPanel
        showNotification={showNotification}
        setShowNotification={setShowNotification}
        notifications={notifications}
        currentLanguage={currentLanguage}
      />
    <Sidebar collapsed={!showSidebar}  user={currentUser} />


      <div
        style={{
          marginTop: 60,
          padding: 20,
          marginLeft: showSidebar ? 250 : 60,
          transition: "margin-left 0.3s",
        }}
      >

        <DashboardHeader
          currentUser={currentUser}
          currentLanguage={currentLanguage}
          viewMode={viewMode}
          setViewMode={setViewMode}
          fromChart={fromChart}
          setFromChart={setFromChart}
          setFilterType={setFilterType}
          setFilterDichVu={setFilterDichVu}
          setFilterStatus={setFilterStatus}
        />

      {currentUser?.is_admin && viewMode === "summary" && (
        <DashboardSummary
          data={filteredData}
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
     <DashboardList
      subViewMode={subViewMode}
      setSubViewMode={setSubViewMode}
      data={filteredData}
      emailList={emailList}
      setEmailList={setEmailList}
      currentLanguage={currentLanguage}
      currentUser={currentUser}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      setShowAddModal={setShowAddModal}
      tableHeaders={tableHeaders}
      dichvuList={dichvuList}
      users={users}
      handleStatusChange={handleStatusChange}
      handleSave={handleSave}
      tableContainerRef={tableContainerRef}
      currentPage={currentPage}
      totalPages={totalPages}
      setCurrentPage={setCurrentPage}
    />

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
          onSave={handleAddRequest} 
          currentLanguage={currentLanguage}
        />
      )}


      <div ref={toastContainerRef} id="toast-container"></div>
    </div>
  );
}
