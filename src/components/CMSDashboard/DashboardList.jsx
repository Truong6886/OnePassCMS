import React from "react";
import TableRow from "../TableRow";
import { showToast } from "../../utils/toast";

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
}) => {
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

      {subViewMode === "email" && (
        <>
          <h5 className="fw-semibold mb-3 text-primary">
            {currentLanguage === "vi"
              ? "Danh sách email hệ thống"
              : "System Email List"}
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
                      <td className="text-center fw-semibold">{idx + 1}</td>

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
                                el.id === item.id
                                  ? { ...el, Email: newEmail }
                                  : el
                              )
                            );
                          }}
                        />
                      </td>

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
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      Email: item.Email,
                                    }),
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
                                  showToast(
                                    result.message || "Lỗi khi lưu",
                                    "error"
                                  );
                                }
                              } catch (err) {
                                showToast("Server error!", "error");
                              }
                            }}
                          >
                            <i className="bi bi-floppy-fill fs-6"></i>
                          </button>

                     
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
                                  showToast(
                                    result.message || "Lỗi khi xóa",
                                    "error"
                                  );
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
  );
};

export default DashboardList;
