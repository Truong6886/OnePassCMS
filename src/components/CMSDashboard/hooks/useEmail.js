import { useState, useEffect } from "react";
import { showToast } from "../../../utils/toast";

export default function useEmail(subViewMode) {
  const [emailList, setEmailList] = useState([]);

  // Fetch email khi chuyển sang tab Email
  useEffect(() => {
    if (subViewMode === "email") {
      fetch("https://onepasscms-backend.onrender.com/api/email")
        .then(res => res.json())
        .then(data => {
          if (data.success) setEmailList(data.data);
        })
        .catch(err => console.error("❌ Lỗi tải email:", err));
    }
  }, [subViewMode]);

  // Update email
  const handleEmailUpdate = async (id, newEmail) => {
    try {
      const res = await fetch(`https://onepasscms-backend.onrender.com/api/email/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail }),
      });

      const result = await res.json();

      if (result.success) {
        showToast("Đã cập nhật email", "success");
        setEmailList(prev =>
          prev.map(e => (e.id === id ? result.data : e))
        );
      }
    } catch (err) {
      console.error("Lỗi cập nhật email:", err);
      showToast("Lỗi cập nhật email!", "danger");
    }
  };

  // Delete email
  const handleEmailDelete = async (id) => {
    if (!window.confirm("Xóa email này?")) return;

    try {
      const res = await fetch(`https://onepasscms-backend.onrender.com/api/email/${id}`, {
        method: "DELETE",
      });

      const result = await res.json();

      if (result.success) {
        showToast("Đã xóa email", "success");
        setEmailList(prev => prev.filter(e => e.id !== id));
      }
    } catch (err) {
      console.error("Lỗi xóa email:", err);
      showToast("Lỗi xóa email!", "danger");
    }
  };

  return {
    emailList,
    setEmailList,
    handleEmailUpdate,
    handleEmailDelete,
  };
}
