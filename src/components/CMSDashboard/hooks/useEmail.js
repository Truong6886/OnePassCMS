import { useState, useEffect } from "react";
import Swal from "sweetalert2"; // <--- Bổ sung import Swal
import { showToast } from "../../../utils/toast";
import { authenticatedFetch } from "../../../utils/api";

export default function useEmail(subViewMode) {
  const [emailList, setEmailList] = useState([]);
  const [loading, setLoading] = useState(false); // <--- Bổ sung khai báo state loading

  // Fetch email khi chuyển sang tab Email
  useEffect(() => {
    if (subViewMode === "email") {
      setLoading(true);
      authenticatedFetch("https://onepasscms-backend-tvdy.onrender.com/api/email")
        .then(async (res) => {
          const data = await res.json();
          if (data.success) {
            setEmailList(data.data);
          }
        })
        .catch((err) => {
          console.error("❌ Lỗi tải email:", err);
          showToast("Không thể tải danh sách email", "error");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [subViewMode]);

  const handleEmailUpdate = async (id, newEmail) => {
    if (!newEmail || !newEmail.includes("@")) {
      showToast("Email không hợp lệ", "warning");
      return;
    }

    try {
      const res = await authenticatedFetch(
        `https://onepasscms-backend-tvdy.onrender.com/api/email/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: newEmail }), // Lưu ý: server nhận key là 'email' hay 'Email' cần kiểm tra lại, ở đây giữ nguyên code cũ
        }
      );

      const result = await res.json();

      if (result.success) {
        showToast("Đã cập nhật email thành công", "success");
        setEmailList((prev) =>
          prev.map((e) => (e.id === id ? { ...e, Email: newEmail } : e))
        );
      } else {
        showToast(result.message || "Lỗi khi cập nhật", "error");
      }
    } catch (err) {
      console.error("Lỗi cập nhật email:", err);
      showToast("Lỗi server khi cập nhật email!", "error");
    }
  };

  const handleEmailDelete = async (item) => {
    // Nếu item truyền vào là id thì xử lý, nếu là object thì lấy id
    const id = typeof item === "object" ? item.id : item;
    const emailName = typeof item === "object" ? item.Email : "email này";

    const confirmResult = await Swal.fire({
      title: "Xác nhận xóa?",
      text: `Bạn có chắc muốn xóa ${emailName} khỏi hệ thống?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Xóa ngay",
      cancelButtonText: "Hủy",
    });

    if (!confirmResult.isConfirmed) return;

    try {
      const res = await authenticatedFetch(
        `https://onepasscms-backend-tvdy.onrender.com/api/email/${id}`,
        {
          method: "DELETE",
        }
      );

      const result = await res.json();

      if (result.success) {
        Swal.fire("Đã xóa!", "Email đã được xóa thành công.", "success");
        setEmailList((prev) => prev.filter((e) => e.id !== id));
      } else {
        showToast(result.message || "Không thể xóa email", "error");
      }
    } catch (err) {
      console.error("Lỗi xóa email:", err);
      showToast("Lỗi server khi xóa email!", "error");
    }
  };

  return {
    emailList,
    setEmailList,
    loading, // <--- Return loading để bên ngoài sử dụng nếu cần
    handleEmailUpdate,
    handleEmailDelete,
  };
}