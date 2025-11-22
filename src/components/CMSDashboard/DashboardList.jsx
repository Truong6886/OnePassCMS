import React, { useState, useRef, useEffect, useMemo } from "react";
import TableRow from "../TableRow";
import { showToast } from "../../utils/toast";
import "../../styles/DashboardList.css";
import EmailList from "./EmailList";
import { exportRequestsToExcel } from "../../utils/exportExcel";
import { LayoutGrid } from "lucide-react"; // Import Icon

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
  const [showColumnSettings, setShowColumnSettings] = useState(false);

  
  const initialColumns = useMemo(() => [
    { key: "id", labelVi: "ID", labelEn: "ID", width: 50, visible: true, pinned: false },
    { key: "code", labelVi: "Mã HS", labelEn: "Code", width: 80, visible: true, pinned: false },
    { key: "service", labelVi: "Dịch Vụ", labelEn: "Service", width: 130, visible: true, pinned: false },
    { key: "type", labelVi: "Hình thức", labelEn: "Type", width: 100, visible: true, pinned: false },
    { key: "branch", labelVi: "Cơ sở", labelEn: "Branch", width: 80, visible: true, pinned: false },
    { key: "name", labelVi: "Họ tên", labelEn: "Full Name", width: 150, visible: true, pinned: false }, // Mặc định không pinned
    { key: "email", labelVi: "Email", labelEn: "Email", width: 150, visible: true, pinned: false },
    { key: "region", labelVi: "Mã vùng", labelEn: "Region", width: 70, visible: true, pinned: false },
    { key: "phone", labelVi: "SĐT", labelEn: "Phone", width: 120, visible: true, pinned: false },
    { key: "title", labelVi: "Tiêu đề", labelEn: "Title", width: 140, visible: true, pinned: false },
    { key: "content", labelVi: "Nội dung", labelEn: "Content", width: 200, visible: true, pinned: false },
    { key: "date", labelVi: "Ngày hẹn", labelEn: "Date", width: 120, visible: true, pinned: false },
    { key: "time", labelVi: "Giờ", labelEn: "Time", width: 80, visible: true, pinned: false },
    { key: "created", labelVi: "Ngày tạo", labelEn: "Created At", width: 120, visible: true, pinned: false },
    { key: "status", labelVi: "Trạng thái", labelEn: "Status", width: 150, visible: true, pinned: false },
    { key: "pic", labelVi: "Phụ trách", labelEn: "PIC", width: 130, visible: currentUser?.is_admin, pinned: false },
    { key: "note", labelVi: "Ghi chú", labelEn: "Note", width: 200, visible: true, pinned: false },
    { key: "action", labelVi: "Hành động", labelEn: "Action", width: 100, visible: true, pinned: true }, // Hành động thường nên pinned phải
  ], [currentUser]);

  const [columns, setColumns] = useState(initialColumns);

  useEffect(() => {
    setColumns(prevCols => {
        const picCol = prevCols.find(c => c.key === 'pic');
        if (picCol && picCol.visible !== currentUser?.is_admin) {
            return prevCols.map(c => c.key === 'pic' ? {...c, visible: !!currentUser?.is_admin} : c);
        }
        return prevCols;
    });
  }, [currentUser]);

  const handleExportExcel = () => {
    const ok = exportRequestsToExcel(data, currentLanguage);
    if (!ok) showToast("Không có dữ liệu để xuất", "warning");
  };


  const toggleColumnVisibility = (key) => {
    setColumns(cols => cols.map(col => 
      col.key === key ? { ...col, visible: !col.visible } : col
    ));
  };


  const toggleColumnPinning = (key) => {
    setColumns(cols => cols.map(col => 
      col.key === key ? { ...col, pinned: !col.pinned } : col
    ));
  };

  const getStickyLeft = (index) => {
    let left = 0;
    for (let i = 0; i < index; i++) {
      if (columns[i].visible && columns[i].pinned) {
        left += columns[i].width;
      }
    }
    return left;
  };

  return (
    <div className="mb-4">
      {/* --- Tabs --- */}
      <div className="d-flex border-bottom mb-3" style={{ gap: "1.5rem", fontSize: "15px", fontWeight: 500 }}>
        {[
          { key: "request", labelVi: "Danh sách yêu cầu", labelEn: "Request List" },
          { key: "email", labelVi: "Danh sách email", labelEn: "Email List" },
        ].map((tab) => (
          <button
            key={tab.key}
            className="bg-transparent border-0 position-relative pb-2"
            style={{
              color: subViewMode === tab.key ? "#2563eb" : "#6b7280",
              borderBottom: subViewMode === tab.key ? "2px solid #2563eb" : "2px solid transparent",
              transition: "all 0.2s ease",
              cursor: "pointer",
            }}
            onClick={() => setSubViewMode(tab.key)}
          >
            {currentLanguage === "vi" ? tab.labelVi : tab.labelEn}
          </button>
        ))}
      </div>

      {subViewMode === "request" && (
        <>
          <h5 className="fw-semibold mb-3 text-primary">
            {currentLanguage === "vi" ? "Danh sách yêu cầu khách hàng" : "Customer Request List"}
          </h5>

          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <input
              type="text"
              className="form-control shadow-sm"
              placeholder={currentLanguage === "vi" ? "Tìm kiếm Họ tên, Email, SĐT..." : "Search Name, Email, Phone..."}
              style={{ width: 300, borderRadius: "30px", paddingLeft: "18px", transition: "all 0.3s ease" }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {currentUser && (
              <div className="d-flex align-items-center gap-2 position-relative">
                
               
                <div className="position-relative">
                    <button 
                        className="btn btn-light shadow-sm border"
                        style={{ borderRadius: "8px", padding: "8px 12px", display: "flex", alignItems: "center", gap: "6px" }}
                        onClick={() => setShowColumnSettings(!showColumnSettings)}
                    >
                        <LayoutGrid size={20} color="#4b5563" />
                        <span style={{fontSize: '14px', fontWeight: 500, color: "#4b5563"}}>
                            {currentLanguage === 'vi' ? 'Cột' : 'Columns'}
                        </span>
                    </button>

                    
                    {showColumnSettings && (
                        <div className="shadow-lg border bg-white rounded p-3" 
                             style={{ 
                                 position: "absolute", 
                                 top: "110%", 
                                 right: 0, 
                                 zIndex: 1000, 
                                 width: "400px",
                                 maxHeight: "400px",
                                 overflowY: "auto"
                             }}>
                            <div className="d-flex justify-content-between mb-2 border-bottom pb-2">
                                <span className="fw-bold text-primary">{currentLanguage === 'vi' ? 'Hiển thị' : 'Visibility'}</span>
                                <span className="fw-bold text-danger">{currentLanguage === 'vi' ? 'Ghim cột' : 'Pin Column'}</span>
                            </div>
                            <div className="d-flex flex-column gap-2">
                                {columns.map((col) => (
                                    <div key={col.key} className="d-flex justify-content-between align-items-center hover-bg-light p-1 rounded">
                                       
                                        <div className="form-check">
                                            <input 
                                                className="form-check-input" 
                                                type="checkbox" 
                                                id={`vis-${col.key}`} 
                                                checked={col.visible}
                                                onChange={() => toggleColumnVisibility(col.key)}
                                            />
                                            <label className="form-check-label ms-2" htmlFor={`vis-${col.key}`} style={{fontSize: '14px'}}>
                                                {currentLanguage === 'vi' ? col.labelVi : col.labelEn}
                                            </label>
                                        </div>

                                  
                                        <div className="form-check form-switch">
                                            <input 
                                                className="form-check-input" 
                                                type="checkbox" 
                                                role="switch"
                                                id={`pin-${col.key}`}
                                                checked={col.pinned}
                                                onChange={() => toggleColumnPinning(col.key)}
                                                disabled={!col.visible} 
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="text-end mt-3 border-top pt-2">
                                <button className="btn btn-sm btn-primary" onClick={() => setShowColumnSettings(false)}>
                                    {currentLanguage === 'vi' ? 'Đóng' : 'Close'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Nút thêm "+" */}
                <button
                  className="btn btn-success shadow-sm"
                  style={{ width: 40, height: 40, borderRadius: "50%", fontSize: 28, fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
                  onClick={() => setShowAddModal(true)}
                >
                  <span style={{ transform: "translateY(-1px)" }}>+</span>
                </button>

                <button
                  onClick={handleExportExcel}
                  style={{ background: "#16a34a", color: "white", border: "none", borderRadius: "8px", padding: "8px 16px", cursor: "pointer", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <i className="bi bi-file-earmark-excel"></i>
                  {currentLanguage === "vi" ? "Xuất Excel" : "Export"}
                </button>
              </div>
            )}
          </div>

          <div className="table-wrapper mt-3">
            
            <div className="table-responsive" style={{ paddingLeft: "0px", maxHeight: "70vh", overflowY: "auto", border: "1px solid #e5e7eb" }} ref={tableContainerRef}>
              <table className="table table-bordered table-hover align-middle mb-0" style={{borderCollapse: "separate", borderSpacing: 0}}>
                <thead style={{ position: "sticky", top: 0, zIndex: 20, backgroundColor: "#f8f9fa" }}>
                  <tr>
                    {columns.map((col, index) => {
                        if (!col.visible) return null;
                        const leftPos = col.pinned ? getStickyLeft(index) : undefined;
                        return (
                            <th
                                key={col.key}
                                className="text-white"
                                style={{
                                    position: col.pinned ? "sticky" : "static",
                                    left: col.pinned ? leftPos : undefined,
                                    zIndex: col.pinned ? 30 : 20, 
                                    backgroundColor: "#1e3a8a", 
                                    borderRight: col.pinned ? "2px solid #e5e7eb" : "1px solid #dee2e6",
                                    minWidth: col.width,
                                    top: 0
                                }}
                            >
                                {currentLanguage === "vi" ? col.labelVi : col.labelEn}
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
                        // Truyền props mới
                        columns={columns}
                        getStickyLeft={getStickyLeft}
                      />
                    ))
                  ) : (
                    <tr>
                      <td colSpan={columns.filter(c => c.visible).length} className="text-center py-4 text-muted">
                        {currentLanguage === "vi" ? "Không có dữ liệu" : "No data available"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* --- PHÂN TRANG --- */}
            <div className="d-flex justify-content-between align-items-center px-3 py-2 border-top bg-light" style={{ marginTop: "0", borderTop: "1px solid #dee2e6" }}>
              <div className="text-muted small">
                {currentLanguage === "vi"
                  ? `Hiển thị ${data.length} / 20 hàng`
                  : `Showing ${data.length} / 20 rows`}
              </div>
              <div className="d-flex justify-content-center align-items-center">
                <nav>
                  <ul className="pagination pagination-sm mb-0 shadow-sm">
                    <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                      <button className="page-link" onClick={() => { if (currentPage > 1) setCurrentPage((p) => p - 1); }}>&laquo;</button>
                    </li>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1))
                      .map((p, idx, arr) => (
                        <React.Fragment key={p}>
                          {idx > 0 && arr[idx - 1] !== p - 1 && (<li className="page-item disabled"><span className="page-link">…</span></li>)}
                          <li className={`page-item ${currentPage === p ? "active" : ""}`}>
                            <button className="page-link" onClick={() => { if (p !== currentPage) setCurrentPage(p); }}>{p}</button>
                          </li>
                        </React.Fragment>
                      ))}
                    <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                      <button className="page-link" onClick={() => { if (currentPage < totalPages) setCurrentPage((p) => p + 1); }}>&raquo;</button>
                    </li>
                  </ul>
                </nav>
                <div className="ms-3 text-muted small">{currentLanguage === "vi" ? `Trang ${currentPage}/${totalPages}` : `Page ${currentPage}/${totalPages}`}</div>
              </div>
            </div>
          </div>
        </>
      )}

      {subViewMode === "email" && (
        <EmailList emailList={emailList} setEmailList={setEmailList} currentLanguage={currentLanguage} tableContainerRef={tableContainerRef} />
      )}
    </div>
  );
};

export default DashboardList;