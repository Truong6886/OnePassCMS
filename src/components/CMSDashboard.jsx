import React, { useState, useEffect, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import "../styles/CMSDashboard.css";
import Header from "./Header";
import Sidebar from './Sidebar'; 
import AddRequestModal from './AddRequestModal';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import * as bootstrap from 'bootstrap';
import EditProfileModal from "./EditProfileModal";
import DashboardSummary from "./CMSDashboard/DashboardSummary";
import DashboardList from './CMSDashboard/DashboardList';
import NotificationPanel from "./CMSDashboard/NotificationPanel";
import useSocketListener from "./CMSDashboard/hooks/useSocketListener";
import DashboardHeader from "./CMSDashboard/DashboardHeader";
import useDashboardData from './CMSDashboard/hooks/useDashboardData';
import translateService from "../utils/translateService";
import useProfile from "./CMSDashboard/hooks/useProfile";
import useEmail from "./CMSDashboard/hooks/useEmail";
import {
  statusColors,
  serviceColorMap,
  filterByStatus,
  groupByService,
  filterByTimeRange,
  groupChartData,
  getAllServices,
  buildPieData,
} from "../utils/dataProcessing.js";
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
    handleDelete,
    setTimeRange, 
    setCurrentUser,
  } = useDashboardData();
  const statusFilteredData = filterByStatus(data, filterStatus);
  const { grouped, chartData: statusChartData, total } = groupByService(statusFilteredData, translateService);
  const chartFilteredData = filterByTimeRange(data, timeRange);
  const chartData = groupChartData(chartFilteredData, translateService);
  const allServices = getAllServices(chartFilteredData, translateService);
  const [currentLanguage, setCurrentLanguage] = useState(
    localStorage.getItem("language") || "vi"
  );

  useEffect(() => {
    const saved = localStorage.getItem("language");
    if (saved) setCurrentLanguage(saved);
  }, []);
  const pieData = buildPieData(data, currentLanguage);
  const [fromChart, setFromChart] = useState(false);
  const [showRequestList, setShowRequestList] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [filterType, setFilterType] = useState("status"); 
  const [hasNewRequest, setHasNewRequest] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const filterMenuRef = useRef(null);
 
  const { handleProfileUpdate } = useProfile(
    currentUser,
    setCurrentUser,
    currentLanguage
  );
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem("notifications");
    return saved ? JSON.parse(saved) : [];
  });
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target)) {
        setShowFilterMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []); 


  const { 
    emailList, 
    setEmailList, 
    handleEmailUpdate, 
    handleEmailDelete 
  } = useEmail(subViewMode);


  const handleOpenEditModal = () => {
    console.log("Mở modal chỉnh sửa profile");
    setShowEditModal(true);
  };

  const handleLogout = () => {
    console.log("🚪 Đang đăng xuất...");
    localStorage.removeItem("currentUser");
    window.location.href = "/login";
  };
  const toastContainerRef = useRef(null);
  const handleToggleSidebar = () => setShowSidebar(prev => !prev);
  const handleBellClick = () => {
    setShowNotification(prev => !prev);
    setHasNewRequest(false); 
  };

  useSocketListener({
    currentLanguage,
    setNotifications,
    setHasNewRequest,
    setShowNotification,
    currentUser: currentUser
  });
  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage, rowsPerPage]);
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterDichVu, filterUser, startDate, endDate, searchTerm]);




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

      {viewMode === "summary" && (
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
          groupedByService={grouped}
          total={total}
          chartData={chartData}
          allServices={allServices}
        />
      )}



    {viewMode === "list" && (
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
      handleDelete={handleDelete}
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
