import React, { useState, useEffect, useRef } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import useSocketListener from "./CMSDashboard/hooks/useSocketListener";
import NotificationPanel from "./CMSDashboard/NotificationPanel";
import EditProfileModal from "./EditProfileModal";
// import { exportRequestsToExcel } from "../utils/exportExcel";
import { showToast } from "../utils/toast";

const formatDateTime = (isoString) => {
  if (!isoString) return "—";
  try {
    const date = new Date(isoString.endsWith("Z") ? isoString : isoString + "Z");
    const options = { timeZone: "Asia/Ho_Chi_Minh", hour12: false };
    const parts = new Intl.DateTimeFormat("vi-VN", {
      ...options,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).formatToParts(date);

    const hour = parts.find(p => p.type === "hour")?.value;
    const minute = parts.find(p => p.type === "minute")?.value;
    const day = parts.find(p => p.type === "day")?.value;
    const month = parts.find(p => p.type === "month")?.value;
    const year = parts.find(p => p.type === "year")?.value;

    return `${hour}:${minute} ${day}/${month}/${year}`;
  } catch {
    return isoString;
  }
};

export default function B2BPage() {
  const [editingServiceRows, setEditingServiceRows] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [pendingList, setPendingList] = useState([]);
  const [approvedList, setApprovedList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentLanguage, setCurrentLanguage] = useState(localStorage.getItem("language") || "vi");
  const [activeTab, setActiveTab] = useState("pending");
  const [approvedWithServices, setApprovedWithServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage] = useState(10);
  const [hasNewRequest, setHasNewRequest] = useState(false);
  const [editingRows, setEditingRows] = useState({});
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem("notifications");
    return saved ? JSON.parse(saved) : [];
  });
  const [showNotification, setShowNotification] = useState(false);  

  // Phân trang riêng cho từng tab
  const [currentPages, setCurrentPages] = useState({
    pending: 1,
    approved: 1,
    services: 1
  });

const handleServiceChange = (id, field, value) => {
  setEditingServiceRows(prev => {
    const currentRow = prev[id] || approvedWithServices.find(s => s.ID === id);
    
    return {
      ...prev,
      [id]: {
        ...currentRow,
        [field]: value 
      }
    };
  });
};

  const saveServiceRow = async (id) => {
    const row = editingServiceRows[id];
    if (!row) return;

    try {
      const response = await fetch(`https://onepasscms-backend.onrender.com/api/b2b/services/update/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(row)
      });

      const result = await response.json();
      
      if (result.success) {
        showToast("Cập nhật thành công!", "success");
        loadData(); // Reload data to get updated information
      } else {
        showToast("Cập nhật thất bại!", "error");
      }
    } catch (error) {
      console.error("Error updating service:", error);
      showToast("Lỗi server!", "error");
    }
  };

  useSocketListener({
    currentLanguage,
    setNotifications,
    setHasNewRequest,
    setShowNotification,
  });

  const tableContainerRef = useRef();

  const handleToggleSidebar = () => setShowSidebar(prev => !prev);

  const handleBellClick = () => {
    setShowNotification(prev => !prev);
    setHasNewRequest(false);
  };

  const handleOpenEditModal = () => {
    console.log("Mở modal chỉnh sửa profile");
    setShowEditModal(true);
  };

  const t = (vi, en) => (currentLanguage === "vi" ? vi : en);

  const columnHeaders = {
    STT: "STT",
    TenDoanhNghiep: t("Tên Doanh Nghiệp", "Company Name"),
    SoDKKD: t("Số ĐKKD", "Business Reg. No."),
    NguoiDaiDien: t("Người Đại Diện", "Representative"),
    DichVu: t("Dịch Vụ", "Service"),
    NgayTao: t("Ngày Tạo", "Created At"),
    "Giấy Phép ĐKKD": t("Giấy Phép ĐKKD", "Business License"),
    NganhNgheChinh: t("Ngành Nghề Chính", "Main Industry"),
    DiaChi: t("Địa Chỉ", "Address"),
    NgayDangKyB2B: t("Ngày Đăng Ký B2B", "B2B Registered At"),
    TongDoanhThu: t("Tổng Doanh Thu", "Total Revenue"),
    XepHang: t("Xếp Hạng", "Ranking")
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pendingRes, approvedRes, servicesRes] = await Promise.all([
        fetch("https://onepasscms-backend.onrender.com/api/b2b/pending"),
        fetch("https://onepasscms-backend.onrender.com/api/b2b/approved"),
        fetch("https://onepasscms-backend.onrender.com/api/b2b/approved-with-services"),
      ]);

      const p = await pendingRes.json();
      const a = await approvedRes.json();
      const s = await servicesRes.json();

      setPendingList(p.data || []);
      setApprovedList(a.data || []);
      
      // Transform services data to have one row per service
      const transformedServices = transformServicesData(s.data || []);
      setApprovedWithServices(transformedServices);

    } catch (err) {
      console.error(err);
      alert("Lỗi tải dữ liệu!");
    } finally {
      setLoading(false);
    }
  };

  // Function to split services string into individual services
  const splitServices = (servicesString) => {
    if (!servicesString) return [];
    
    // Split by common separators: comma, semicolon, or "và"
    return servicesString
      .split(/[,;]| và /)
      .map(service => service.trim())
      .filter(service => service.length > 0);
  };

  // Function to transform services data into individual rows
  const transformServicesData = (servicesData) => {
    const transformed = [];
    let serviceCounter = 1;
    
    servicesData.forEach(company => {
      // Get the services string from company data
      const servicesString = company.DichVu || company.TenDichVu || "";
      
      // Split services into individual service names
      const individualServices = splitServices(servicesString);
      
      if (individualServices.length > 0) {
        // Create a row for each individual service
        individualServices.forEach((serviceName, serviceIndex) => {
          transformed.push({
            ID: `${company.ID}-${serviceCounter}`, // Unique ID for each service row
            CompanyID: company.ID,
            TenDoanhNghiep: company.TenDoanhNghiep,
            SoDKKD: company.SoDKKD,
            NguoiDaiDien: company.NguoiDaiDien,
            // Service details - each service gets its own row
            TenDichVu: serviceName,
            NgayThucHien: company.NgayThucHien || company.NgayDangKyB2B,
            NgayHoanThanh: company.NgayHoanThanh,
            DoanhThuTruocCK: company.DoanhThuTruocCK || 0,
            MucChietKhau: company.MucChietKhau || 0,
            TienChietKhau: company.TienChietKhau || 0,
            DoanhThuSauCK: company.DoanhThuSauCK || 0,
            TongDoanhThuTichLuy: company.TongDoanhThuTichLuy || company.TongDoanhThu || 0,
            // Company info for reference
            companyInfo: company
          });
          serviceCounter++;
        });
      } else {
        // If no services found, create one row with default service name
        transformed.push({
          ID: company.ID,
          CompanyID: company.ID,
          TenDoanhNghiep: company.TenDoanhNghiep,
          SoDKKD: company.SoDKKD,
          NguoiDaiDien: company.NguoiDaiDien,
          TenDichVu: "—",
          NgayThucHien: company.NgayThucHien || company.NgayDangKyB2B,
          NgayHoanThanh: company.NgayHoanThanh,
          DoanhThuTruocCK: company.DoanhThuTruocCK || company.TongDoanhThu || 0,
          MucChietKhau: company.MucChietKhau || 0,
          TienChietKhau: company.TienChietKhau || 0,
          DoanhThuSauCK: company.DoanhThuSauCK || company.TongDoanhThu || 0,
          TongDoanhThuTichLuy: company.TongDoanhThuTichLuy || company.TongDoanhThu || 0,
          companyInfo: company
        });
      }
    });
    
    return transformed;
  };

  const handleChange = (id, key, value) => {
    setEditingRows(prev => ({ ...prev, [id]: { ...prev[id], [key]: value } }));
  };

  const saveRow = async (id) => {
    if (!editingRows[id]) return;
    try {
      const res = await fetch(`https://onepasscms-backend.onrender.com/api/b2b/update/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingRows[id]),
      }).then(r => r.json());

      if (res.success) {
        showToast(t("Cập nhật thành công", "Updated successfully"), "success");
        setEditingRows(prev => {
          const copy = { ...prev };
          delete copy[id];
          return copy;
        });
        loadData();
      } else {
        showToast(t("Lỗi: " + res.message, "Error: " + res.message), "error");
      }
    } catch (err) {
      console.error(err);
      showToast(t("Lỗi server!", "Server error!"), "error");
    }
  };

  const approve = async (id) => {
    if (!window.confirm(t("Duyệt doanh nghiệp này?", "Approve this company?"))) return;
    try {
      const res = await fetch(`https://onepasscms-backend.onrender.com/api/b2b/approve/${id}`, { method: "POST" }).then(r => r.json());
      if (res.success) {
        showToast(t("Duyệt thành công", "Approved successfully"), "success");
        loadData();
      } else {
        showToast(t("Lỗi: " + res.message, "Error: " + res.message), "error");
      }
    } catch (err) {
      console.error(err);
      showToast(t("Lỗi server!", "Server error!"), "error");
    }
  };

  const deleteRow = async (id) => {
    if (!window.confirm(t("Xóa doanh nghiệp này?", "Delete this company?"))) return;
    try {
      const res = await fetch(`https://onepasscms-backend.onrender.com/api/b2b/delete/${id}`, { method: "DELETE" }).then(r => r.json());
      if (res.success) {
        showToast(t("Xóa thành công", "Deleted successfully"), "success");
        loadData();
      } else {
        showToast(t("Lỗi: " + res.message, "Error: " + res.message), "error");
      }
    } catch (err) {
      console.error(err);
      showToast(t("Lỗi server!", "Server error!"), "error");
    }
  };

  // Lấy dữ liệu đã lọc theo tab hiện tại
  const getFilteredList = () => {
    const list = activeTab === "pending" ? pendingList : 
                 activeTab === "approved" ? approvedList : 
                 approvedWithServices;
    
    return list.filter(item => 
      Object.values(item).join(" ").toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Lấy dữ liệu phân trang theo tab hiện tại
  const getPaginatedList = () => {
    const filteredList = getFilteredList();
    const startIndex = (currentPages[activeTab] - 1) * itemsPerPage;
    return filteredList.slice(startIndex, startIndex + itemsPerPage);
  };

  // Tính tổng số trang theo tab hiện tại
  const getTotalPages = () => {
    const filteredList = getFilteredList();
    return Math.ceil(filteredList.length / itemsPerPage);
  };

  // Hàm xử lý chuyển trang
  const handlePageChange = (newPage) => {
    setCurrentPages(prev => ({
      ...prev,
      [activeTab]: newPage
    }));
  };

  // Reset trang về 1 khi chuyển tab
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Không reset trang về 1 khi chuyển tab để giữ trạng thái phân trang của từng tab
  };

  const columns = activeTab === "pending"
    ? ["STT", "TenDoanhNghiep", "SoDKKD", "NguoiDaiDien", "Dịch Vụ", "NgayTao", "Giấy Phép ĐKKD"]
    : ["STT", "TenDoanhNghiep", "SoDKKD", "NguoiDaiDien", "NganhNgheChinh", "DiaChi", "NgayDangKyB2B", "TongDoanhThu", "XepHang", "Dịch Vụ", "Giấy Phép ĐKKD"];

  const renderDichVu = (item) => [item.DichVu, item.DichVuKhac].filter(Boolean).join(", ") || "—";

  // Hàm để nhóm các dịch vụ theo công ty
  const groupServicesByCompany = (services) => {
    const grouped = {};
    
    services.forEach(service => {
      const companyKey = `${service.TenDoanhNghiep}_${service.SoDKKD}`;
      
      if (!grouped[companyKey]) {
        grouped[companyKey] = {
          companyInfo: {
            TenDoanhNghiep: service.TenDoanhNghiep,
            SoDKKD: service.SoDKKD,
            NguoiDaiDien: service.NguoiDaiDien,
            companyInfo: service.companyInfo
          },
          services: []
        };
      }
      
      grouped[companyKey].services.push(service);
    });
    
    return grouped;
  };

  // Component phân trang
  const Pagination = ({ data, currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 0) return null;

    return (
      <div
        className="d-flex justify-content-between align-items-center px-3 py-2 border-top bg-light"
        style={{
          marginTop: "0",
          borderTop: "1px solid #dee2e6",
        }}
      >
        <div className="text-muted small">
          {currentLanguage === "vi"
            ? `Hiển thị ${data.length} / ${itemsPerPage} hàng (trang ${currentPage}/${totalPages})`
            : `Showing ${data.length} / ${itemsPerPage} rows (page ${currentPage}/${totalPages})`}
        </div>

        <div className="d-flex justify-content-center align-items-center">
          <nav>
            <ul className="pagination pagination-sm mb-0 shadow-sm">
              <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => {
                    if (currentPage > 1) onPageChange(currentPage - 1);
                  }}
                >
                  &laquo;
                </button>
              </li>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === totalPages ||
                    (p >= currentPage - 1 && p <= currentPage + 1)
                )
                .map((p, idx, arr) => (
                  <React.Fragment key={p}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                      <li className="page-item disabled">
                        <span className="page-link">…</span>
                      </li>
                    )}
                    <li className={`page-item ${currentPage === p ? "active" : ""}`}>
                      <button
                        className="page-link"
                        onClick={() => {
                          if (p !== currentPage) onPageChange(p);
                        }}
                      >
                        {p}
                      </button>
                    </li>
                  </React.Fragment>
                ))}

              <li
                className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}
              >
                <button
                  className="page-link"
                  onClick={() => {
                    if (currentPage < totalPages) onPageChange(currentPage + 1);
                  }}
                >
                  &raquo;
                </button>
              </li>
            </ul>
          </nav>

          <div className="ms-3 text-muted small">
            {currentLanguage === "vi"
              ? `Trang ${currentPage}/${totalPages}`
              : `Page ${currentPage}/${totalPages}`}
          </div>
        </div>
      </div>
    );
  };

  const currentPage = currentPages[activeTab];
  const totalPages = getTotalPages();
  const paginatedList = getPaginatedList();
  const filteredList = getFilteredList();

  return (
    <div className="flex">
      <div className="fixed left-0 top-0 h-full z-40">
        <Sidebar collapsed={!showSidebar} user={currentUser} />
      </div>
      <div className="flex-1 transition-all duration-300" style={{ paddingLeft: showSidebar ? 260 : 80, marginTop: 70 }}>
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

        {/* Notification Panel */}
        <NotificationPanel
          showNotification={showNotification}
          setShowNotification={setShowNotification}
          notifications={notifications}
          currentLanguage={currentLanguage}
        />

        {showEditModal && (
          <EditProfileModal
            currentUser={currentUser}
            onUpdate={(u) => {
              setCurrentUser(u);
              localStorage.setItem("currentUser", JSON.stringify(u));
            }}
            onClose={() => setShowEditModal(false)}
            currentLanguage={currentLanguage}
          />
        )}

        {/* Tabs */}
        <div
          className="d-flex border-bottom mb-3 gap-4 mt-3"
          style={{ fontWeight: 500 }}
        >
          {["pending", "approved", "services"].map((tab) => {
            const label =
              tab === "pending"
                ? t("Danh sách chờ duyệt", "Pending B2B")
                : tab === "approved"
                ? t("Danh sách đã duyệt", "Approved B2B")
                : t("Dịch vụ đã thực hiện", "Services History");

            return (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className="bg-transparent border-0 pb-2"
                style={{
                  color: activeTab === tab ? "#2563eb" : "#6b7280",
                  borderBottom:
                    activeTab === tab
                      ? "2px solid #2563eb"
                      : "2px solid transparent",
                  cursor: "pointer",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Table */}
        <div className="table-wrapper">

          {/* ===========================
              TAB: SERVICES - MỖI DỊCH VỤ LÀ MỘT HÀNG RIÊNG BIỆT
          ============================ */}
          {activeTab === "services" ? (
            <div className="table-responsive">
              <table className="table table-bordered table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>STT</th>
                    <th>{t("Tên doanh nghiệp", "Company Name")}</th>
                    <th>{t("Số ĐKKD", "Business Reg. No.")}</th>
                    <th>{t("Tên dịch vụ", "Service Name")}</th>
                    <th>{t("Ngày thực hiện", "Service Date")}</th>
                    <th>{t("Ngày hoàn thành", "Completion Date")}</th>
                    <th>{t("Doanh thu trước chiết khấu", "Revenue Before Discount")}</th>
                    <th>{t("Mức chiết khấu", "Discount Rate")}</th>
                    <th>{t("Số tiền chiết khấu", "Discount Amount")}</th>
                    <th>{t("Doanh thu sau chiết khấu", "Revenue After Discount")}</th>
                    <th>{t("Tổng doanh thu tích lũy", "Total Accumulated Revenue")}</th>
                    <th>{t("Thao tác", "Actions")}</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedList.length > 0 ? (
                    (() => {
                      const groupedServices = groupServicesByCompany(paginatedList);
                      let globalIndex = 0;
                      
                      return Object.values(groupedServices).flatMap((companyGroup, companyIndex) => {
                        const shouldMerge = companyGroup.services.length > 1;
                        
                        return companyGroup.services.map((service, serviceIndex) => {
                          const isFirstService = serviceIndex === 0;
                          const edit = editingServiceRows[service.ID] || service;
                          const tienChietKhau = Math.round((edit.DoanhThuTruocCK || 0) * (edit.MucChietKhau || 0) / 100);
                          const doanhThuSauCK = (edit.DoanhThuTruocCK || 0) - tienChietKhau;
                          
                          globalIndex++;

                          return (
                            <tr key={service.ID}>
                              {/* STT */}
                              <td className="text-center align-middle">
                                {globalIndex + (currentPage - 1) * itemsPerPage}
                              </td>

                              {/* Tên doanh nghiệp - Chỉ merge khi có nhiều dịch vụ */}
                              {shouldMerge && isFirstService ? (
                                <td 
                                  className="align-middle text-center"
                                  rowSpan={companyGroup.services.length}
                                >
                                  {edit.TenDoanhNghiep}
                                </td>
                              ) : !shouldMerge ? (
                                <td className="align-middle text-center">
                                  {edit.TenDoanhNghiep}
                                </td>
                              ) : null}

                              {/* Số ĐKKD - Chỉ merge khi có nhiều dịch vụ */}
                              {shouldMerge && isFirstService ? (
                                <td 
                                  className="align-middle text-center"
                                  rowSpan={companyGroup.services.length}
                                >
                                  {edit.SoDKKD}
                                </td>
                              ) : !shouldMerge ? (
                                <td className="align-middle text-center">
                                  {edit.SoDKKD}
                                </td>
                              ) : null}

                              {/* Tên dịch vụ - Luôn hiển thị cho mỗi dịch vụ */}
                              <td className="align-middle text-center">
                                <input
                                  type="text"
                                  className="border px-1 py-0.5 text-center w-100"
                                  value={edit.TenDichVu}
                                  onChange={e => handleServiceChange(service.ID, "TenDichVu", e.target.value)}
                                />
                              </td>

                              {/* Ngày thực hiện */}
                              <td className="align-middle text-center">
                                <input
                                  type="datetime-local"
                                  className="border px-1 py-0.5 text-center"
                                  value={edit.NgayThucHien?.slice(0, 16)}
                                  onChange={e => handleServiceChange(service.ID, "NgayThucHien", e.target.value)}
                                />
                              </td>

                              {/* Ngày hoàn thành */}
                              <td className="align-middle text-center">
                                <input
                                  type="datetime-local"
                                  className="border px-1 py-0.5 text-center"
                                  value={edit.NgayHoanThanh?.slice(0, 16)}
                                  onChange={e => handleServiceChange(service.ID, "NgayHoanThanh", e.target.value)}
                                />
                              </td>

                              {/* Doanh thu trước chiết khấu */}
                    
                              <td className="align-middle text-center">
                                <input
                                  type="number"
                                  className="border px-1 py-0.5 text-center"
                                  value={edit.DoanhThuTruocCK || 0}
                                  onChange={e => handleServiceChange(service.ID, "DoanhThuTruocCK", Number(e.target.value) || 0)}
                                />
                              </td>

                              {/* Mức chiết khấu (Dropdown) */}
                              <td className="align-middle text-center">
                                <select
                                  className="border px-1 py-0.5"
                                  value={edit.MucChietKhau}
                                  onChange={e => handleServiceChange(service.ID, "MucChietKhau", Number(e.target.value))}
                                >
                                  <option value={5}>5%</option>
                                  <option value={10}>10%</option>
                                  <option value={15}>15%</option>
                                  <option value={20}>20%</option>
                                </select>
                              </td>

                              {/* Số tiền chiết khấu */}
                              <td className="align-middle text-center">{tienChietKhau.toLocaleString()}</td>

                              {/* Doanh thu sau chiết khấu */}
                              <td className="align-middle text-center">{doanhThuSauCK.toLocaleString()}</td>

                              {/* Tổng doanh thu tích lũy */}
                              <td className="align-middle text-center">{edit.TongDoanhThuTichLuy?.toLocaleString()}</td>

                              {/* Thao tác */}
                              <td className="text-center">
                                <button 
                                  className="btn btn-sm btn-primary" 
                                  onClick={() => saveServiceRow(service.ID)}
                                >
                                  {t("Lưu", "Save")}
                                </button>
                              </td>
                            </tr>
                          );
                        });
                      });
                    })()
                  ) : (
                    <tr>
                      <td colSpan="12" className="text-center text-muted py-4">
                        {t("Không có dữ liệu dịch vụ", "No service data")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* ===========================
                TAB: PENDING + APPROVED
            ============================ */
            <div className="table-responsive" ref={tableContainerRef}>
              <table className="table table-bordered table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    {columns.map(col => (
                      <th key={col}>{columnHeaders[col] || col}</th>
                    ))}
                    <th>{t("Thao tác", "Actions")}</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedList.length > 0 ? paginatedList.map((item, idx) => (
                    <tr key={item.ID}>

                      {/* ----- STT ----- */}
                      {columns.map(col => {
                        if (col === "STT")
                          return (
                            <td key={col} className="text-center align-middle">
                              {idx + 1 + (currentPage - 1) * itemsPerPage}
                            </td>
                          );

                        // ---- Dịch Vụ ----
                        if (col === "Dịch Vụ") {
                          const value = renderDichVu(item);
                          return (
                            <td key={col} className="text-center align-middle">
                              <input
                                type="text"
                                value={editingRows[item.ID]?.[col] ?? value}
                                onChange={e => handleChange(item.ID, col, e.target.value)}
                                className="border px-1 py-0.5 text-center"
                                style={{ width: 240 }}
                              />
                            </td>
                          );
                        }

                        // ---- PDF ----
                        if (col === "Giấy Phép ĐKKD") {
                          return (
                            <td key={col} className="text-center align-middle">
                              {item.PdfPath ? (
                                <a href={item.PdfPath} target="_blank" rel="noopener noreferrer">
                                  {t("Xem PDF", "View PDF")}
                                </a>
                              ) : "—"}
                            </td>
                          );
                        }

                        // ---- NGÀY ----
                        if (col === "NgayTao" || col === "NgayDangKyB2B")
                          return (
                            <td key={col} className="text-center align-middle">
                              {formatDateTime(item[col])}
                            </td>
                          );

                        // ---- Mặc định ----
                        return (
                          <td key={col} className="text-center align-middle">
                            <input
                              type="text"
                              value={editingRows[item.ID]?.[col] ?? item[col]}
                              onChange={e => handleChange(item.ID, col, e.target.value)}
                              className="border px-1 py-0.5 text-center"
                            />
                          </td>
                        );
                      })}

                      {/* ----- ACTIONS ----- */}
                      <td className="text-center align-middle">
                        <button className="btn btn-sm btn-primary me-1" onClick={() => saveRow(item.ID)}>
                          {t("Lưu", "Save")}
                        </button>

                        {activeTab === "pending" ? (
                          <button className="btn btn-sm btn-success" onClick={() => approve(item.ID)}>
                            {t("Duyệt", "Approve")}
                          </button>
                        ) : (
                          <button className="btn btn-sm btn-danger" onClick={() => deleteRow(item.ID)}>
                            {t("Xóa", "Delete")}
                          </button>
                        )}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={columns.length + 1} className="text-center text-muted py-4">
                        {t("Không có dữ liệu", "No data")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Phân trang */}
          <Pagination 
            data={paginatedList}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
}