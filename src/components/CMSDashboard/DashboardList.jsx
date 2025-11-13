import React from "react";
import TableRow from "../TableRow";
import { showToast } from "../../utils/toast";
import "../../styles/DashboardList.css";
import * as XLSX from "xlsx";
import EmailList from "./EmailList";
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
  tableContainerRef,
  currentPage,
  totalPages,
  setCurrentPage, 
}) => {
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

            {currentUser?.is_admin && (
              <div className="d-flex align-items-center gap-2">
              {/* Nút thêm "+" */}
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
                    marginBottom: "10px",
                    padding: 0,
                  }}
                  onClick={() => setShowAddModal(true)}
                >
                  <span style={{ transform: "translateY(-1px)" }}>+</span>
                </button>
              )}

          
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
              marginLeft:"10px",
              marginRight: "20px"
            }}
          >
         <i className="bi bi-file-earmark-excel"></i>
      {currentLanguage === "vi" ? "Tải Danh Sách Yêu Cầu" : "Download Request List"}

          </button>
        </div>
            </div>

            )}
            
          </div>

             <div className="table-wrapper mt-3">
            <div className="table-responsive" ref={tableContainerRef}>
              <table className="table table-bordered table-hover align-middle mb-0">
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
                        dichvuList={dichvuList}
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
