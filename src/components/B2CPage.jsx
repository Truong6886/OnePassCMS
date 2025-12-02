import React, { useState, useEffect, useRef } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import NotificationPanel from "./CMSDashboard/NotificationPanel";
import EditProfileModal from "./EditProfileModal";
import TableRow from "./TableRow";
import { showToast } from "../utils/toast";
import useDashboardData from "./CMSDashboard/hooks/useDashboardData";
import { LayoutGrid } from "lucide-react";
import { exportRequestsToExcel } from "../utils/exportExcel";
import "../styles/DashboardList.css";

const B2CPage = () => {
  const { currentUser } = useDashboardData();

  const [showSidebar, setShowSidebar] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [currentLanguage, setCurrentLanguage] = useState(
    localStorage.getItem("language") || "vi"
  );
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  // DATA
  const [data, setData] = useState([]);
  const [dichvuList, setDichvuList] = useState([]);
  const [users, setUsers] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const itemsPerPage = 20;
  const tableContainerRef = useRef(null);

  // --- CẤU HÌNH CỘT ---
  const initialColumnKeys = [
    { key: "id", label: "ID" },
    { key: "maHoSo", label: "Mã HS" },
    { key: "dichVu", label: "Dịch vụ" },
    { key: "hinhThuc", label: "Hình thức" },
    { key: "coSo", label: "Cơ sở" },
    { key: "hoTen", label: "Họ tên" },
    { key: "email", label: "Email" },
    { key: "maVung", label: "Mã vùng" },
    { key: "sdt", label: "SĐT" },
    { key: "tieuDe", label: "Tiêu đề" },
    { key: "noiDung", label: "Nội dung" },
    { key: "ngayHen", label: "Ngày hẹn" },
    { key: "gio", label: "Giờ" },
    { key: "ngayTao", label: "Ngày tạo" },
    { key: "trangThai", label: "Trạng thái" },
    { key: "nguoiPhuTrach", label: "Người phụ trách" },
    { key: "ghiChu", label: "Ghi chú" },
    { key: "hanhDong", label: "Hành động" },
  ];

  const [visibleColumns, setVisibleColumns] = useState(() => {
    const initial = {};
    initialColumnKeys.forEach(col => (initial[col.key] = true));
    return initial;
  });

  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const columnMenuRef = useRef(null);

  // --- HEADERS BẢNG ---
  const tableHeaders = [
    "ID",
    "Mã HS",
    "Dịch vụ",
    "Hình thức",
    "Cơ sở",
    "Họ tên",
    "Email",
    "Mã vùng",
    "SĐT",
    "Tiêu đề",
    "Nội dung",
    "Ngày hẹn",
    "Giờ",
    "Ngày tạo",
    "Trạng thái",
    ...(currentUser?.is_admin ? ["Người phụ trách"] : []),
    "Ghi chú",
    "Hành động",
  ];

  // ------- LẤY DỮ LIỆU DANH MỤC -------
  useEffect(() => {
    const fetchCatalogs = async () => {
      try {
        const resDV = await fetch("http://localhost:5000/api/dichvu");
        const dv = await resDV.json();
        if (dv.success) setDichvuList(dv.data);

        const resUser = await fetch("http://localhost:5000/api/User");
        const u = await resUser.json();
        if (u.success) setUsers(u.data);
      } catch (err) {
        console.error("Lỗi tải danh mục:", err);
      }
    };

    fetchCatalogs();
  }, []);

  // ------- LẤY DANH SÁCH B2C -------
  const fetchData = async () => {
    try {
      let url = `http://localhost:5000/api/yeucau?page=${currentPage}&limit=${itemsPerPage}`;
      if (currentUser?.is_admin) {
        url += `&is_admin=true`;
      } else {
        url += `&userId=${currentUser?.id}`;
      }

      const res = await fetch(url);
      const json = await res.json();

      if (json.success) {
        setData(json.data);
        setTotalPages(json.totalPages || 1);
      } else {
        showToast("Không thể tải dữ liệu", "error");
      }
    } catch (err) {
      showToast("Lỗi kết nối server", "error");
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, currentUser]);

  // ------- LƯU -------
  const handleSave = async (updatedItem) => {
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/yeucau/${updatedItem.YeuCauID}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedItem),
        }
      );

      const json = await res.json();
      if (json.success) {
        showToast("Cập nhật thành công", "success");
        setData((prev) =>
          prev.map((i) => (i.YeuCauID === updatedItem.YeuCauID ? json.data : i))
        );
      } else {
        showToast("Lỗi cập nhật", "error");
      }
    } catch {
      showToast("Lỗi máy chủ", "error");
    }
  };

  // ------- XOÁ -------
  const handleDelete = async (id) => {
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/yeucau/${id}`,
        { method: "DELETE" }
      );
      const json = await res.json();

      if (json.success) {
        showToast("Đã xoá", "success");
        fetchData();
      } else {
        showToast("Không thể xoá", "error");
      }
    } catch {
      showToast("Lỗi kết nối", "error");
    }
  };

  // ------- ĐỔI TRẠNG THÁI -------
  const handleStatusChange = async (id, status) => {
    const row = data.find((x) => x.YeuCauID === id);
    if (row) {
      await handleSave({ ...row, TrangThai: status });
    }
  };

  // ------- FILTER LOCAL -------
  const filteredData = data.filter((i) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();

    return (
      (i.HoTen || "").toLowerCase().includes(s) ||
      (i.Email || "").toLowerCase().includes(s) ||
      (i.SoDienThoai || "").toLowerCase().includes(s) ||
      (i.MaHoSo || "").toLowerCase().includes(s)
    );
  });

  // --- CỘT TÙY CHỈNH ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (columnMenuRef.current && !columnMenuRef.current.contains(event.target)) {
        setShowColumnMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleColumn = (key) => {
    setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExportExcel = () => {
    const ok = exportRequestsToExcel(data, currentLanguage);
    if (!ok) showToast("Không có dữ liệu để xuất", "warning");
  };

  // --- RENDER ---
  const isVisible = (key) => visibleColumns[key];

  return (
    <div className="d-flex h-100" style={{ background: "#f3f4f6" }}>
      {/* SIDEBAR */}
      <div
        style={{
          width: showSidebar ? "260px" : "70px",
          transition: "0.3s",
          zIndex: 100,
        }}
      >
        <Sidebar collapsed={!showSidebar} user={currentUser} />
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-grow-1 p-4" style={{ height: "100vh", overflowY: "auto" }}>
        {/* HEADER */}
        <Header
          currentUser={currentUser}
          showSidebar={showSidebar}
          onToggleSidebar={() => setShowSidebar((s) => !s)}
          currentLanguage={currentLanguage}
          onLanguageChange={setCurrentLanguage}
          onBellClick={() => setShowNotification(!showNotification)}
          onOpenEditModal={() => setShowEditModal(true)}
        />

        {/* PANEL */}
        <NotificationPanel
          showNotification={showNotification}
          setShowNotification={setShowNotification}
          notifications={notifications}
          currentLanguage={currentLanguage}
        />

        {/* EDIT PROFILE */}
        {showEditModal && (
          <EditProfileModal
            currentUser={currentUser}
            onClose={() => setShowEditModal(false)}
            currentLanguage={currentLanguage}
          />
        )}

        {/* TITLE */}
        <h3 className="fw-bold mb-3">Quản lý B2C</h3>

        {/* LIST CONTENT */}
        <div className="bg-white shadow-sm p-4 rounded-3 mb-4">
          <h5 className="fw-semibold mb-3 text-primary">
            {currentLanguage === "vi"
              ? "Danh sách yêu cầu khách hàng"
              : "Customer Request List"}
          </h5>

          {/* SEARCH AND ACTIONS */}
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

            {currentUser && (
              <div className="d-flex align-items-center gap-2">
                {/* EXPORT EXCEL BUTTON */}
                <button
                  onClick={handleExportExcel}
                  style={{
                    background: "#16a34a",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px 16px",
                    cursor: "pointer",
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginBottom: "10px",
                    marginLeft: "10px",
                  }}
                >
                  <i className="bi bi-file-earmark-excel"></i>
                  {currentLanguage === "vi" ? "Tải Danh Sách Yêu Cầu" : "Download Request List"}
                </button>

                {/* COLUMN TOGGLE BUTTON */}
                <div className="position-relative" style={{ marginBottom: "10px", marginRight: "20px" }} ref={columnMenuRef}>
                  <button
                    className="btn btn-light border shadow-sm d-flex align-items-center justify-content-center"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "8px",
                      backgroundColor: "#fff",
                    }}
                    onClick={() => setShowColumnMenu(!showColumnMenu)}
                    title={currentLanguage === "vi" ? "Ẩn/Hiện cột" : "Toggle Columns"}
                  >
                    <LayoutGrid size={20} color="#4b5563" />
                  </button>

                  {showColumnMenu && (
                    <div
                      className="position-absolute bg-white shadow rounded border p-2"
                      style={{
                        top: "100%",
                        right: 0,
                        zIndex: 1000,
                        width: "250px",
                        maxHeight: "400px",
                        overflowY: "auto",
                      }}
                    >
                      <div className="fw-bold mb-2 px-1" style={{ fontSize: '14px' }}>
                        {currentLanguage === "vi" ? "Hiển thị cột:" : "Visible Columns:"}
                      </div>
                      {initialColumnKeys.map((col) => {
                        if (col.key === "nguoiPhuTrach" && !currentUser?.is_admin) return null;
                        return (
                          <div key={col.key} className="form-check px-1 py-1 m-1">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`col-${col.key}`}
                              checked={visibleColumns[col.key]}
                              onChange={() => toggleColumn(col.key)}
                              style={{ cursor: "pointer", marginLeft: "0" }}
                            />
                            <label
                              className="form-check-label ms-2"
                              htmlFor={`col-${col.key}`}
                              style={{ cursor: "pointer", fontSize: "13px", userSelect: "none" }}
                            >
                              {col.label}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* TABLE */}
          <div className="table-wrapper mt-3">
            <div
              className="table-responsive"
              style={{ paddingLeft: "0px" }}
              ref={tableContainerRef}
            >
              <table className="table table-bordered table-hover align-middle mb-0">
                <thead>
                  <tr>
                    {tableHeaders.map((header, i) => {
                      const actualKeys = initialColumnKeys.filter(k =>
                        (k.key === 'nguoiPhuTrach') ? currentUser?.is_admin : true
                      );
                      const currentKey = actualKeys[i]?.key;

                      if (currentKey && !isVisible(currentKey)) return null;

                      return (
                        <th
                          key={i}
                          className={
                            header === (currentLanguage === "vi" ? "Họ tên" : "Full Name")
                              ? "sticky-col"
                              : ""
                          }
                        >
                          {header}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length > 0 ? (
                    filteredData.map((item) => (
                      <TableRow
                        key={item.YeuCauID}
                        item={item}
                        dichvuList={dichvuList}
                        users={users}
                        currentUser={currentUser}
                        onStatusChange={handleStatusChange}
                        onSave={handleSave}
                        data={data}
                        currentLanguage={currentLanguage}
                        onDelete={handleDelete}
                        visibleColumns={visibleColumns}
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

            {/* PAGINATION */}
            <div
              className="d-flex justify-content-between align-items-center px-3 py-2 border-top bg-light"
              style={{
                marginTop: "0",
                borderTop: "1px solid #dee2e6",
              }}
            >
              <div className="text-muted small">
                {currentLanguage === "vi"
                  ? `Hiển thị ${filteredData.length} / ${itemsPerPage} hàng (trang ${currentPage}/${totalPages})`
                  : `Showing ${filteredData.length} / ${itemsPerPage} rows (page ${currentPage}/${totalPages})`}
              </div>

              <div className="d-flex justify-content-center align-items-center">
                <nav>
                  <ul className="pagination pagination-sm mb-0 shadow-sm">
                    <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                      <button
                        className="page-link"
                        onClick={() => {
                          if (currentPage > 1) setCurrentPage((p) => p - 1);
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
                          <li
                            className={`page-item ${currentPage === p ? "active" : ""}`}
                          >
                            <button
                              className="page-link"
                              onClick={() => {
                                if (p !== currentPage) setCurrentPage(p);
                              }}
                            >
                              {p}
                            </button>
                          </li>
                        </React.Fragment>
                      ))}

                    <li
                      className={`page-item ${
                        currentPage === totalPages ? "disabled" : ""
                      }`}
                    >
                      <button
                        className="page-link"
                        onClick={() => {
                          if (currentPage < totalPages) setCurrentPage((p) => p + 1);
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default B2CPage;