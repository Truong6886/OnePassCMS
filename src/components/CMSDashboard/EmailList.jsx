import React from "react";
import Swal from "sweetalert2"; // 👈 IMPORT SweetAlert2
import { showToast } from "../../utils/toast";
import { authenticatedFetch } from "../../utils/api"
const EmailList = ({
  emailList,
  setEmailList,
  currentLanguage,
  tableContainerRef,
}) => {
  // Hàm xử lý xóa bằng SweetAlert2
  const handleDeleteEmail = async (item) => {
    const isVietnamese = currentLanguage === "vi";

    const result = await Swal.fire({
      title: isVietnamese ? "Xác nhận Xóa Email" : "Confirm Email Deletion",
      text: isVietnamese
        ? `Bạn có chắc chắn muốn xóa email ${item.Email} ra khỏi hệ thống?`
        : `Are you sure you want to delete the email ${item.Email} from the system?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545", // red
      cancelButtonColor: "#6c757d", // grey
      confirmButtonText: isVietnamese ? "Xóa" : "Yes, Delete it!",
      cancelButtonText: isVietnamese ? "Hủy bỏ" : "Cancel",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      const res = await authenticatedFetch(
        `https://onepasscms-backend.onrender.com/api/email/${item.id}`,
        { method: "DELETE" }
      );
      const deleteResult = await res.json();
      if (deleteResult.success) {
        // Cập nhật state sau khi xóa thành công
        setEmailList((prev) => prev.filter((e) => e.id !== item.id));

        Swal.fire({
          title: isVietnamese ? "Thành công!" : "Success!",
          text: isVietnamese
            ? `Đã xóa email "${item.Email}".`
            : `Email "${item.Email}" deleted.`,
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        showToast(
          deleteResult.message || (isVietnamese ? "Lỗi khi xóa" : "Deletion error"),
          "error"
        );
      }
    } catch {
      showToast("Server error!", "error");
    }
  };

  return (
    <>
      <h5 className="fw-semibold mb-3 text-primary">
        {currentLanguage === "vi"
          ? "Danh sách email hệ thống"
          : "System Email List"}
      </h5>

      <div className="table-responsive" ref={tableContainerRef}>
        <table className="table table-bordered align-middle mb-0">
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

                      {/* Nút xóa đã được thay thế bằng hàm handleDeleteEmail */}
                      <button
                        className="btn btn-sm btn-danger d-flex align-items-center justify-content-center"
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "6px",
                        }}
                        onClick={() => handleDeleteEmail(item)} // 👈 GỌI HÀM SWEETALERT
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
  );
};

export default EmailList;