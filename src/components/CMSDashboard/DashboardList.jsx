import React, { useState, useEffect, useRef } from "react";
import TableRow from "../TableRow";
import { showToast } from "../../utils/toast";
import "../../styles/DashboardList.css";
import * as XLSX from "xlsx";
import EmailList from "./EmailList";
import { LayoutGrid } from "lucide-react"; // Import icon
import { exportRequestsToExcel } from "../../utils/exportExcel";

const DashboardList = ({
  subViewMode,
  setSubViewMode,
  data,
  setData,
  emailList,
  setEmailList,
  currentLanguage,
  currentUser,
  searchTerm,
  setSearchTerm,
  setShowAddModal,
  tableHeaders,
  dichvuList,
  users,
  handleStatusChange,
  handleSave,
  handleDelete,
  tableContainerRef,
  currentPage,
  totalPages,
  setCurrentPage,
}) => {
  
  // --- CẤU HÌNH CỘT ---
  // Định nghĩa key cho từng cột theo đúng thứ tự hiển thị trong TableRow
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
    { key: "nguoiPhuTrach", label: "Người phụ trách" }, // Chỉ hiện nếu admin
    { key: "ghiChu", label: "Ghi chú" },
    { key: "hanhDong", label: "Hành động" },
  ];

  // State lưu các cột đang hiển thị (mặc định hiện tất cả)
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const initial = {};
    initialColumnKeys.forEach(col => initial[col.key] = true);
    return initial;
  });

  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const columnMenuRef = useRef(null);

  // Đóng menu khi click ra ngoài
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

  // --- END CẤU HÌNH CỘT ---

  const handleExportExcel = () => {
    const ok = exportRequestsToExcel(data, currentLanguage);
    if (!ok) showToast("Không có dữ liệu để xuất", "warning");
  };

  return (
   <div className="mb-4">
  <div
    className="d-flex border-bottom mb-3"
    style={{
      gap: "1.5rem",
      fontSize: "15px",
      fontWeight: 500,
    }}
  >
    {[
      { key: "request", labelVi: "Danh sách yêu cầu", labelEn: "Request List" },
      { key: "email", labelVi: "Danh sách email", labelEn: "Email List" },
    ].map((tab) => (
      <div
        key={tab.key}
        onClick={() => setSubViewMode(tab.key)}
        style={{
          cursor: "pointer",
          paddingBottom: "6px",
          borderBottom:
            subViewMode === tab.key
              ? "2px solid #2563eb"
              : "2px solid transparent",
          color: subViewMode === tab.key ? "#2563eb" : "#6b7280",
          fontWeight: subViewMode === tab.key ? "600" : "500",
          transition: "all 0.2s ease",
        }}
      >
        {currentLanguage === "vi" ? tab.labelVi : tab.labelEn}
      </div>
    ))}
  </div>



      {subViewMode === "request" && (
        <>
          <h5 className="fw-semibold mb-3 text-primary">
            {currentLanguage === "vi"
              ? "Danh sách yêu cầu khách hàng"
              : "Customer Request List"}
          </h5>

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
                {/* Nút thêm "+" */}
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
                    marginBottom: "10px",
                    padding: 0,
                  }}
                  onClick={() => setShowAddModal(true)}
                >
                  <span style={{ transform: "translateY(-1px)" }}>+</span>
                </button>

                {/* Nút Export Excel */}
                <div style={{ textAlign: "right", marginTop: "10px" }}>
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
                      marginBottom: "20px",
                      marginLeft: "10px",
                    }}
                  >
                    <i className="bi bi-file-earmark-excel"></i>
                    {currentLanguage === "vi" ? "Tải Danh Sách Yêu Cầu" : "Download Request List"}
                  </button>
                </div>

                {/* --- NÚT TÙY CHỈNH CỘT (LAYOUT GRID) --- */}
                <div className="position-relative" style={{ marginTop: "10px", marginBottom: "20px", marginRight: "20px" }} ref={columnMenuRef}>
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
                      <div className="fw-bold mb-2 px-1" style={{fontSize: '14px'}}>
                        {currentLanguage === "vi" ? "Hiển thị cột:" : "Visible Columns:"}
                      </div>
                      {initialColumnKeys.map((col) => {
                        // Ẩn option "Người phụ trách" nếu không phải admin
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
                {/* --- END NÚT TÙY CHỈNH CỘT --- */}

              </div>
            )}
          </div>

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
                   
                      let keyIndex = i;
                   
                      if (!currentUser?.is_admin && i >= 15) { 
                
                      }

                      const actualKeys = initialColumnKeys.filter(k => 
                        (k.key === 'nguoiPhuTrach') ? currentUser?.is_admin : true
                      );
                      
                      const currentKey = actualKeys[i]?.key;

                  
                      if (currentKey && !visibleColumns[currentKey]) return null;

                      return (
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
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {data.length > 0 ? (
                    data.map((item) => (
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
                        visibleColumns={visibleColumns} // Truyền prop này xuống
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

            {/* --- PHÂN TRANG --- */}
            <div
              className="d-flex justify-content-between align-items-center px-3 py-2 border-top bg-light"
              style={{
                marginTop: "0",
                borderTop: "1px solid #dee2e6",
              }}
            >
              <div className="text-muted small">
                {currentLanguage === "vi"
                  ? `Hiển thị ${data.length} / 20 hàng (trang ${currentPage}/${totalPages})`
                  : `Showing ${data.length} / 20 rows (page ${currentPage}/${totalPages})`}
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
        </>
      )}

      {subViewMode === "email" && (
        <EmailList
          emailList={emailList}
          setEmailList={setEmailList}
          currentLanguage={currentLanguage}
          tableContainerRef={tableContainerRef}
        />
      )}
    </div>
  );
};

export default DashboardList;