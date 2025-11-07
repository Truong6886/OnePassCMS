import React, { useState, useEffect, useRef } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart,XAxis,YAxis,Bar, LabelList} from "recharts";
import { Filter, ChevronRight } from "lucide-react";
import { FilterX } from "lucide-react";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../components/CMSDashboard.css';
import Header from "./Header";
import Sidebar from '../components/Sidebar'; 
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { Bell } from "lucide-react";
import { Save, Trash2 } from "lucide-react";
import * as bootstrap from 'bootstrap';
window.bootstrap = bootstrap;
const showToast = (message, type = "info") => {
  const colors = {
    success: "#4CAF50",
    error: "#F44336",
    warning: "#FF9800",
    info: "#2196F3",
  };

  // 🧱 Tạo container nếu chưa có (đặt ở góc phải dưới)
  let container = document.querySelector("#toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.style.position = "fixed";
    container.style.bottom = "20px";
    container.style.right = "20px";
    container.style.display = "flex";
    container.style.flexDirection = "column-reverse"; // toast mới lên trên
    container.style.gap = "10px";
    container.style.zIndex = "9999";
    document.body.appendChild(container);
  }

  // 🧩 Tạo toast
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style.padding = "14px 22px";
  toast.style.background = colors[type] || colors.info;
  toast.style.color = "#fff";
  toast.style.borderRadius = "10px";
  toast.style.boxShadow = "0 4px 10px rgba(0,0,0,0.15)";
  toast.style.fontSize = "15px";
  toast.style.fontWeight = "500";
  toast.style.opacity = "0";
  toast.style.transform = "translateY(20px)";
  toast.style.transition = "all 0.4s ease";
  toast.style.maxWidth = "320px";
  toast.style.wordBreak = "break-word";

  container.appendChild(toast);


  setTimeout(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  }, 50);


setTimeout(() => {
  toast.style.opacity = "0";
  toast.style.transform = "translateY(20px)";
}, 4800); 


setTimeout(() => toast.remove(), 5500);

};



// ================= TableRow =================
const TableRow = ({ item, dichvuList, users, currentUser, data, onStatusChange, onSave, onDelete, currentLanguage }) => {
  const [localData, setLocalData] = useState(item);
  const handleInputChange = (field, value) => {
    setLocalData((prev) => {
      const updated = { ...prev, [field]: value };

      // ✅ Khi chọn người phụ trách, gán luôn tên nv vào data
      if (field === "NguoiPhuTrachId") {
        const selectedUser = users.find((u) => String(u.id) === String(value));
        updated.NguoiPhuTrach = selectedUser ? selectedUser.name : "";
      }

      return updated;
    });
  };



  const gioVN = localData.Gio ? new Date(localData.Gio).toLocaleTimeString('vi-VN', { hour12: false, hour: '2-digit', minute:'2-digit' }) : '';
  const translateService = (serviceName) => {
  const map = {
    "인증 센터":"Chứng thực",
    "결혼 이민": "Kết hôn",
    "출생신고 대행":"Khai sinh, khai tử",
    "출입국 행정 대행": "Xuất nhập cảnh",
    "신분증명 서류 대행":"Giấy tờ tuỳ thân ",
    "입양 절차 대행":"Nhận nuôi",
    "비자 대행":"Thị thực",
    "법률 컨설팅":"Tư vấn pháp lý",
    "B2B 서비스":"Dịch vụ B2B",
    "기타":"Khác",
  };


  return map[serviceName] || serviceName;
};
  useEffect(() => {
      const table = document.querySelector('table.table');
      if (!table || !table.parentElement) return;

      const container = table.parentElement;
      const stickyCols = table.querySelectorAll('.sticky-col');

      const handleScroll = () => {
        const scrollLeft = container.scrollLeft;
        stickyCols.forEach(col => {
          if (scrollLeft > 0) col.classList.add('sticky');
          else col.classList.remove('sticky');
        });
      };

      container.addEventListener('scroll', handleScroll);

      // ✅ cleanup an toàn
      return () => {
        if (container) container.removeEventListener('scroll', handleScroll);
      };
    }, []);

  const handleSave = () => onSave(localData);
  const displayMaHoSo = localData.TrangThai === 'Tư vấn' ? '' : (localData.MaHoSo || '-');

  // Dịch các label theo ngôn ngữ
  const statusOptions = currentLanguage === 'vi' 
    ? [
        { value: "Tư vấn", label: "Tư vấn" },
        { value: "Đang xử lý", label: "Đang xử lý" },
        { value: "Đang nộp hồ sơ", label: "Đang nộp hồ sơ" },
        { value: "Hoàn thành", label: "Hoàn thành" }
      ]
    : [
        { value: "Tư vấn", label: "Consulting" },
        { value: "Đang xử lý", label: "Processing" },
        { value: "Đang nộp hồ sơ", label: "Submitting" },
        { value: "Hoàn thành", label: "Completed" }
      ];

  return (
    <tr>
      <td className="text-center fw-semibold">{localData.YeuCauID}</td>
      <td className="text-center">{displayMaHoSo}</td>
    <td>
        <input
          type="text"
          className="form-control form-control-sm"
          style={{ width: 110 }}
          value={translateService(localData.TenDichVu)}
          onChange={e => handleInputChange('TenDichVu', e.target.value)}
          placeholder={currentLanguage === 'vi' ? "Nhập dịch vụ" : "Enter service"}
        />
      </td>

      <td>{localData.TenHinhThuc}</td>
      <td className="sticky-col">
        <input
          type="text"
          className="form-control form-control-sm"
          style={{ width: 90 }}
          value={item.HoTen}
          onChange={e => handleInputChange('HoTen', e.target.value)}
        />
      </td>
      <td><input type="email" style={{ width: 130}}  className="form-control form-control-sm" value={localData.Email} onChange={e => handleInputChange('Email', e.target.value)} /></td>
      <td><input type="text" style={{ width: 40}} className="form-control form-control-sm" value={localData.MaVung} onChange={e => handleInputChange('MaVung', e.target.value)}/></td>
      <td><input type="text"  style={{ width: 90 }}  className="form-control form-control-sm" value={localData.SoDienThoai} onChange={e => handleInputChange('SoDienThoai', e.target.value)}/></td>
      <td><input style={{width: 100}} type="text" className="form-control form-control-sm" value={localData.TieuDe} onChange={e => handleInputChange('TieuDe', e.target.value)} /></td>
      <td><textarea  style={{width: 150}} className="form-control form-control-sm" rows={2} value={localData.NoiDung} onChange={e => handleInputChange('NoiDung', e.target.value)} /></td>
      <td>
        <input
          type="date"
          className="form-control form-control-sm"
          style={{ width: "100px" }}
          value={localData.ChonNgay ? new Date(localData.ChonNgay).toISOString().split("T")[0] : ""}
          onChange={(e) => handleInputChange("ChonNgay", e.target.value)}
        />
         </td>
        <td>
        <input
          type="time"
          className="form-control form-control-sm"
          style={{ width: "80px" }}
          value={gioVN}
          onChange={(e) => handleInputChange("Gio", e.target.value)}
        />
      </td>


    <td className="text-nowrap text-center">
      {localData.NgayTao ? (
        <>
          {new Date(localData.NgayTao).toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
          <br />
          {new Date(localData.NgayTao).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })}
        </>
      ) : (
        ""
      )}
    </td>

      <td>
      <select
            className="form-select form-select-sm"
            style={{ width: 130 }}
            value={localData.TrangThai}
            onChange={async (e) => {
              const newStatus = e.target.value;
              handleInputChange("TrangThai", newStatus);

              // ✅ Bảng map mã theo dịch vụ
              const serviceCodeMap = {
                "Chứng thực": "CT",
                "Kết hôn": "KH",
                "Khai sinh, khai tử": "KS",
                "Xuất nhập cảnh": "XNC",
                "Giấy tờ tuỳ thân": "GT",
                "Nhận nuôi": "NN",
                "Thị thực": "TT",
                "Tư vấn pháp lý": "TV",
                "Dịch vụ B2B": "B2B",
                "Khác": "KHAC",
              };

              // ✅ Nếu chuyển sang “Đang xử lý” mà chưa có mã hồ sơ
              if (newStatus === "Đang xử lý" && !localData.MaHoSo) {
                try {
                  const prefix =
                    serviceCodeMap[localData.TenDichVu?.trim()] ||
                    (localData.TenDichVu
                      ? localData.TenDichVu.replace(/\s+/g, "")
                          .substring(0, 3)
                          .toUpperCase()
                      : "HS");

                  const resAll = await fetch(`https://op-backend-60ti.onrender.com/api/yeucau`);
                  const resultAll = await resAll.json();
                  if (!resultAll.success) throw new Error("Không thể tải danh sách hồ sơ");

                  const related = resultAll.data.filter(
                    (r) =>
                      r.TenDichVu &&
                      r.TenDichVu.trim().toLowerCase() ===
                        (localData.TenDichVu || "").trim().toLowerCase() &&
                      r.MaHoSo &&
                      r.MaHoSo.startsWith(prefix)
                  );

                  let maxNum = 0;
                  related.forEach((r) => {
                    const numPart = parseInt(r.MaHoSo.split("-")[1], 10);
                    if (!isNaN(numPart) && numPart > maxNum) maxNum = numPart;
                  });

                  const nextNum = (maxNum + 1).toString().padStart(3, "0");
                  const generatedCode = `${prefix}-${nextNum}`;

                  handleInputChange("MaHoSo", generatedCode);
                  showToast(
                    `${currentLanguage === "vi" ? "Đã tạo mã hồ sơ:" : "Generated file code:"} ${generatedCode}`,
                    "success"
                  );

                  // ✅ Lưu lên server
                  const res = await fetch(`https://op-backend-60ti.onrender.com/api/yeucau/${localData.YeuCauID}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ TrangThai: newStatus, MaHoSo: generatedCode }),
                  });
                  const result = await res.json();
                  if (!result.success) throw new Error(result.message || "Update failed");
                } catch (err) {
                  console.error("❌ Lỗi tạo mã hồ sơ:", err);
                  showToast(
                    currentLanguage === "vi"
                      ? "Lỗi khi tạo mã hồ sơ!"
                      : "Error generating record code!",
                    "error"
                  );
                }
              } 
              // ✅ Nếu chuyển ngược về “Tư vấn” → reset mã hồ sơ
          else if (
            newStatus === "Tư vấn" &&
            ["Đang xử lý", "Đang nộp hồ sơ", "Hoàn thành"].includes(localData.TrangThai)
          ) {
            try {
              handleInputChange("MaHoSo", "");
              showToast(
                currentLanguage === "vi"
                  ? "Đã xóa mã hồ sơ (chuyển sang Tư vấn)."
                  : "Record code cleared when returning to Consulting.",
                "info"
              );

              const res = await fetch(`https://op-backend-60ti.onrender.com/api/yeucau/${localData.YeuCauID}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ TrangThai: newStatus, MaHoSo: null }),
              });
              const result = await res.json();
              if (!result.success) throw new Error(result.message || "Update failed");
            } catch (err) {
              console.error("❌ Lỗi reset mã hồ sơ:", err);
              showToast(
                currentLanguage === "vi"
                  ? "Lỗi khi reset mã hồ sơ!"
                  : "Error resetting record code!",
                "error"
              );
            }
          }

              // ✅ Trường hợp đổi trạng thái khác
              else {
                onStatusChange(localData.YeuCauID, newStatus);
              }
            }}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>



      </td>
   {currentUser.is_admin && (
  <td>
      <select
      className="form-select form-select-sm"
      style={{ width: 100 }}
      value={localData.NguoiPhuTrachId ? String(localData.NguoiPhuTrachId) : ""}
      onChange={(e) => handleInputChange("NguoiPhuTrachId", e.target.value)}
    >
      <option value="">--Chọn--</option>
      {users.length > 0 ? (
        users.map((u) => (
          <option key={u.id} value={String(u.id)}>
            {u.name}
          </option>
        ))
      ) : (
        <option disabled>Đang tải...</option>
      )}
    </select>


  </td>
)}


      <td><textarea  style={{width: 150}} className="form-control form-control-sm" rows={2} value={localData.GhiChu || ''} onChange={e => handleInputChange('GhiChu', e.target.value)} /></td>
   <td className="text-center">
  <div className="d-flex justify-content-center align-items-center gap-2">
    {/* Nút Save */}
    <button
      className="btn btn-sm d-flex align-items-center justify-content-center"
      style={{
        backgroundColor: "#2563eb",
        border: "none",
        color: "white",
        width: 36,
        height: 36,
        padding: 0,
        borderRadius: 6,
        transition: "all 0.2s ease",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={handleSave}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1e40af")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#2563eb")}
    >
      <Save size={17} strokeWidth={2.3} />
    </button>

    {/* Nút Delete */}
    <button
      className="btn btn-sm d-flex align-items-center justify-content-center"
      style={{
        backgroundColor: "#ef4444",
        border: "none",
        color: "white",
        width: 36,
        height: 36,
        padding: 0,
        borderRadius: 6,
        transition: "all 0.2s ease",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={() => {
  // 🩵 Tạo hộp xác nhận xóa hiện đại
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    animation: fadeIn 0.25s ease;
  `;

  const modal = document.createElement("div");
  modal.style.cssText = `
    background: white;
    padding: 28px 24px;
    border-radius: 16px;
    text-align: center;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    max-width: 320px;
    width: 90%;
    transform: translateY(-20px);
    opacity: 0;
    transition: all 0.25s ease;
    font-family: 'Inter', sans-serif;
  `;

  modal.innerHTML = `
    <h5 style="margin-bottom: 12px; font-weight: 600; color:#111;">
      ${currentLanguage === "vi" ? "Xóa yêu cầu này?" : "Delete this request?"}
    </h5>
    <p style="font-size: 13px; color:#6b7280; margin-bottom: 20px;">
      ${currentLanguage === "vi"
        ? "Thao tác này sẽ không thể hoàn tác."
        : "This action cannot be undone."}
    </p>
    <div style="display: flex; justify-content: center; gap: 10px;">
      <button id="cancelBtn" style="
        background: #e5e7eb;
        border: none;
        padding: 8px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
      ">${currentLanguage === "vi" ? "Hủy" : "Cancel"}</button>
      <button id="confirmBtn" style="
        background: linear-gradient(135deg, #ef4444, #dc2626);
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
      ">${currentLanguage === "vi" ? "Xóa" : "Delete"}</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Hiệu ứng fade-in nhẹ
  setTimeout(() => {
    modal.style.opacity = "1";
    modal.style.transform = "translateY(0)";
  }, 10);

  // Thêm animation CSS
  const style = document.createElement("style");
  style.innerHTML = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  // Đóng khi click ngoài modal
  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove();
  };

  // Xử lý nút
  modal.querySelector("#cancelBtn").onclick = () => overlay.remove();
  modal.querySelector("#confirmBtn").onclick = async () => {
    overlay.remove();
    try {
      const res = await fetch(`https://op-backend-60ti.onrender.com/api/yeucau/${localData.YeuCauID}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Server error");

      if (result.success) {
        showToast(currentLanguage === "vi" ? "Đã xóa yêu cầu" : "Request deleted", "success");
        if (typeof onDelete === "function") onDelete(localData.YeuCauID);
      } else {
        showToast(result.message || "❌ Lỗi khi xóa!", "error");
      }
    } catch (err) {
      console.error("❌ Delete error:", err);
      showToast(err.message || "Server error!", "error");
    }
  };
}}

      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#b91c1c")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ef4444")}
    >
      <Trash2 size={17} strokeWidth={2.3} />
    </button>
  </div>
</td>


    </tr>
  );
};

// ================= EditProfileModal =================

const EditProfileModal = ({ currentUser, onUpdate, onClose, currentLanguage }) => {
  const [formData, setFormData] = useState({
    name: currentUser?.name || "",
    username: currentUser?.username || "",
    email: currentUser?.email || "",
    password: "",
  });

  const [avatarPreview, setAvatarPreview] = useState(
    currentUser?.avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        currentUser?.username || "User"
      )}&background=0D8ABC&color=fff&rounded=true&size=128`
  );

  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const avatarInputRef = useRef(null);

  useEffect(() => {
    setVisible(true);
  }, []);

  const handleAvatarClick = () => avatarInputRef.current?.click();

  const handleInputChange = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      alert(currentLanguage === 'vi' ? 'Vui lòng chọn file ảnh!' : 'Please select an image file!');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      alert(currentLanguage === 'vi' ? 'Kích thước ảnh không được vượt quá 5MB!' : 'Image size should not exceed 5MB!');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);

    setFormData((prev) => ({ ...prev, avatarFile: file }));
  };

  const handleSubmit = async () => {
    if (!formData.username.trim() || !formData.email.trim()) {
      alert(currentLanguage === 'vi' ? "Vui lòng điền đầy đủ username và email!" : "Please fill in both username and email!");
      return;
    }

    setLoading(true);
    
    try {
      const submitData = new FormData();
      submitData.append("name", formData.name.trim());
      submitData.append("username", formData.username.trim());
      submitData.append("email", formData.email.trim());
      
      if (formData.password && formData.password.trim() !== "") {
        submitData.append("password", formData.password);
      }
      
      if (formData.avatarFile) {
        submitData.append("avatar", formData.avatarFile);
      }

      console.log("🔄 Đang gửi dữ liệu cập nhật...");
      const success = await onUpdate(currentUser.id, submitData);
      
      if (success) {
        handleClose();
      }
    } catch (error) {
      console.error("❌ Lỗi khi submit:", error);
      alert(currentLanguage === 'vi' ? "Có lỗi xảy ra khi cập nhật thông tin!" : "An error occurred while updating information!");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => onClose(), 200);
  };

  // ✅ Thêm kiểm tra currentUser tồn tại
  if (!currentUser) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1050,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(5px)",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.2s ease",
        }}
      ></div>

      {/* Modal content */}
      <div
        style={{
          background: "#fff",
          borderRadius: "1.5rem",
          padding: "2rem",
          width: "100%",
          maxWidth: "480px",
          boxShadow: "0 0 30px rgba(0,0,0,0.2)",
          position: "relative",
          zIndex: 1060,
          transform: visible ? "scale(1)" : "scale(0.8)",
          opacity: visible ? 1 : 0,
          transition: "transform 0.2s ease, opacity 0.2s ease",
        }}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={handleClose}
          disabled={loading}
          style={{
            position: "absolute",
            top: "1.2rem",
            right: "1.2rem",
            width: "1.5rem",
            height: "1.5rem",
            background: "transparent",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.3 : 0.6,
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.transform = "scale(1.1)";
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.opacity = "0.6";
              e.currentTarget.style.transform = "scale(1)";
            }
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1 1L11 11M11 1L1 11"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* Title */}
        <h4 className="mb-4 text-primary text-center" style={{ fontSize: "1.3rem", fontWeight: "600" }}>
          {loading 
            ? (currentLanguage === 'vi' ? "Đang cập nhật..." : "Updating...") 
            : (currentLanguage === 'vi' ? "Cập nhật thông tin" : "Update Information")
          }
        </h4>

        {/* Avatar + camera */}
        <div className="mb-4 text-center position-relative" style={{ width: 120, margin: "0 auto" }}>
          <img
            src={avatarPreview}
            alt="Avatar"
            className="rounded-circle"
            width={120}
            height={120}
            style={{ 
              objectFit: "cover", 
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)", 
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              border: "3px solid #f8f9fa"
            }}
            onClick={loading ? undefined : handleAvatarClick}
          />
          {!loading && (
            <div
              onClick={handleAvatarClick}
              style={{
                position: "absolute",
                bottom: 8,
                right: 8,
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "#fff",
                border: "2px solid #0D8ABC",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: "0.8rem",
                color: "#0D8ABC",
                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
              }}
            >
              <i className="bi bi-camera-fill" style={{ pointerEvents: "none" }}></i>
            </div>
          )}
        </div>

        <input
          type="file"
          accept="image/*"
          ref={avatarInputRef}
          className="d-none"
          onChange={handleAvatarChange}
          disabled={loading}
        />
          <div className="mb-3">
            <label className="form-label fw-semibold" style={{ fontSize: "1rem" }}>
              {currentLanguage === 'vi' ? 'Họ và tên' : 'Full Name'}
            </label>
            <input
              type="text"
              className="form-control rounded-pill"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder={currentLanguage === 'vi' ? "Nhập họ và tên" : "Enter full name"}
              style={{ fontSize: "1rem", padding: "0.75rem 1.25rem" }}
              disabled={loading}
            />
          </div>
        {/* Inputs */}
        <div className="mb-3">
          <label className="form-label fw-semibold" style={{ fontSize: "1rem" }}>
            {currentLanguage === 'vi' ? 'Username' : 'Username'}
          </label>
          <input
            type="text"
            className="form-control rounded-pill"
            value={formData.username}
            onChange={(e) => handleInputChange("username", e.target.value)}
            placeholder={currentLanguage === 'vi' ? "Nhập username" : "Enter username"}
            style={{ fontSize: "1rem", padding: "0.75rem 1.25rem" }}
            disabled={loading}
          />
        </div>

        <div className="mb-3">
          <label className="form-label fw-semibold" style={{ fontSize: "1rem" }}>
            {currentLanguage === 'vi' ? 'Email' : 'Email'}
          </label>
          <input
            type="email"
            className="form-control rounded-pill"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            placeholder={currentLanguage === 'vi' ? "Nhập email" : "Enter email"}
            style={{ fontSize: "1rem", padding: "0.75rem 1.25rem" }}
            disabled={loading}
          />
        </div>

        <div className="mb-4">
          <label className="form-label fw-semibold" style={{ fontSize: "1rem" }}>
            {currentLanguage === 'vi' ? 'Mật khẩu mới' : 'New Password'}
          </label>
          <input
            type="password"
            className="form-control rounded-pill"
            value={formData.password}
            onChange={(e) => handleInputChange("password", e.target.value)}
            placeholder={currentLanguage === 'vi' ? "Để trống nếu không đổi" : "Leave blank if not changing"}
            style={{ fontSize: "1rem", padding: "0.75rem 1.25rem" }}
            disabled={loading}
          />
        </div>

        {/* Buttons */}
        <div className="d-flex justify-content-end gap-3">
          <button
            className="btn btn-outline-secondary rounded-pill"
            onClick={handleClose}
            disabled={loading}
            style={{ 
              fontSize: "0.95rem", 
              padding: "0.6rem 1.5rem",
              opacity: loading ? 0.6 : 1
            }}
          >
            {currentLanguage === 'vi' ? 'Hủy' : 'Cancel'}
          </button>
          <button
            className="btn btn-primary rounded-pill"
            onClick={handleSubmit}
            disabled={loading}
            style={{ 
              fontSize: "0.95rem", 
              padding: "0.6rem 1.5rem",
              position: "relative"
            }}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                {currentLanguage === 'vi' ? 'Đang xử lý...' : 'Processing...'}
              </>
            ) : (
              currentLanguage === 'vi' ? 'Lưu thay đổi' : 'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const AddRequestModal = ({ dichvuList, users, data = [], onClose, onSave, currentLanguage }) => {
  const [formData, setFormData] = useState({
    TenDichVu: "",
    TenHinhThuc: "",
    HoTen: "",
    Email: "",
    MaVung: "+84",
    SoDienThoai: "",
    TieuDe: "",
    NoiDung: "",
    ChonNgay: "",
    Gio: "",
    TrangThai: "Tư vấn",
    NguoiPhuTrachId: "",
    GhiChu: ""
  });

  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => setVisible(true), []);

  const handleInputChange = (field, value) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    // ✅ Validate dữ liệu tốt hơn
    if (!formData.TenDichVu.trim()) {
      alert(currentLanguage === 'vi' ? "Vui lòng chọn dịch vụ!" : "Please select a service!");
      return;
    }

    if (!formData.TenHinhThuc.trim()) {
      alert(currentLanguage === 'vi' ? "Vui lòng chọn hình thức!" : "Please select a format!");
      return;
    }

    if (!formData.HoTen.trim()) {
      alert(currentLanguage === 'vi' ? "Vui lòng nhập họ tên!" : "Please enter full name!");
      return;
    }

    if (!formData.Email.trim()) {
      alert(currentLanguage === 'vi' ? "Vui lòng nhập email!" : "Please enter email!");
      return;
    }

    if (!formData.SoDienThoai.trim()) {
      alert(currentLanguage === 'vi' ? "Vui lòng nhập số điện thoại!" : "Please enter phone number!");
      return;
    }

    // ✅ Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.Email)) {
      alert(currentLanguage === 'vi' ? "Email không hợp lệ!" : "Invalid email!");
      return;
    }

    setLoading(true);

    try {
      // ✅ KHÔNG tự tạo ID - để server tự generate
    const newItem = {
        ...formData,
        Gio: formData.Gio?.trim() ? formData.Gio : null,
        ChonNgay: formData.ChonNgay?.trim() ? formData.ChonNgay : null,
        NgayTao: new Date().toISOString()
      };


      console.log("🔄 Đang gửi yêu cầu mới...", newItem);

      const res = await fetch("https://op-backend-60ti.onrender.com/api/yeucau", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem)
      });
      
      const result = await res.json();
      console.log("📨 Kết quả thêm yêu cầu:", result);
      
      if (result.success) {
        onSave(result.data); 
        showToast(
          currentLanguage === "vi"
            ? "Thêm yêu cầu mới thành công!"
            : " New request added successfully!",
          "success"
        );
        handleClose();
      } else {
        alert(`❌ ${currentLanguage === 'vi' ? 'Lỗi khi thêm yêu cầu:' : 'Error adding request:'} ${result.message || "Unknown error"}`);
      }
    } catch (err) {
      console.error("❌ Lỗi thêm yêu cầu:", err);
      alert(`❌ ${currentLanguage === 'vi' ? 'Lỗi kết nối máy chủ!' : 'Server connection error!'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return; // ✅ Không cho đóng khi đang loading
    setVisible(false);
    setTimeout(() => onClose(), 200);
  };

  // Dịch các label theo ngôn ngữ
  const serviceOptions = currentLanguage === 'vi' 
    ? [
        "Chứng thực", "Kết hôn", "Khai sinh, khai tử", "Xuất nhập cảnh",
        "Giấy tờ tuỳ thân", "Nhận nuôi", "Thị thực", "Tư vấn pháp lý",
        "Dịch vụ B2B", "Khác"
      ]
    : [
        "Authentication", "Marriage", "Birth/Death Certificate", "Immigration",
        "ID Documents", "Adoption", "Visa", "Legal Consultation",
        "B2B Services", "Other"
      ];

  const formatOptions = currentLanguage === 'vi' 
    ? ["Trực tiếp", "Gọi điện", "Email"]
    : ["In-person", "Phone Call", "Email"];

  const statusOptions = currentLanguage === 'vi' 
    ? ["Tư vấn", "Đang xử lý", "Đang nộp hồ sơ", "Hoàn thành"]
    : ["Consulting", "Processing", "Submitting", "Completed"];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1050,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(8px)",
          transition: "opacity 0.3s ease",
          opacity: visible ? 1 : 0,
          cursor: loading ? "not-allowed" : "pointer"
        }}
      />

      {/* Modal */}
      <div
        style={{
          background: "white",
          borderRadius: "14px",
          padding: "1.5rem 2rem",
          width: "800px",
          maxWidth: "90vw",
          boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
          position: "relative",
          zIndex: 1060,
          transform: visible ? "scale(1)" : "scale(0.95)",
          opacity: visible ? 1 : 0,
          transition: "transform 0.3s ease, opacity 0.3s ease",
        }}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          disabled={loading}
          style={{
            position: "absolute",
            top: "0.8rem",
            right: "1rem",
            border: "none",
            background: "transparent",
            fontSize: "1.3rem",
            opacity: loading ? 0.3 : 0.5,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          ×
        </button>

        {/* Header */}
        <h5
          style={{
            color: "#2563eb",
            fontWeight: 700,
            textAlign: "center",
            marginBottom: "1.25rem",
          }}
        >
          {loading 
            ? (currentLanguage === 'vi' ? "Đang thêm yêu cầu..." : "Adding request...") 
            : (currentLanguage === 'vi' ? "Thêm yêu cầu mới" : "Add New Request")
          }
        </h5>

        {/* Form chính */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem 1.5rem",
            opacity: loading ? 0.7 : 1,
            pointerEvents: loading ? "none" : "auto"
          }}
        >
          {/* Dịch vụ */}
          <div>
            <label className="form-label small text-secondary fw-semibold">
              {currentLanguage === 'vi' ? 'Dịch vụ *' : 'Service *'}
            </label>
            <select
              className="form-select form-select-sm rounded-3"
              value={formData.TenDichVu}
              onChange={(e) => handleInputChange("TenDichVu", e.target.value)}
              disabled={loading}
            >
              <option value="">{currentLanguage === 'vi' ? '--Chọn dịch vụ--' : '--Select service--'}</option>
              {serviceOptions.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Hình thức */}
          <div>
            <label className="form-label small text-secondary fw-semibold">
              {currentLanguage === 'vi' ? 'Hình thức *' : 'Format *'}
            </label>
            <select
              className="form-select form-select-sm rounded-3"
              value={formData.TenHinhThuc}
              onChange={(e) => handleInputChange("TenHinhThuc", e.target.value)}
              disabled={loading}
            >
              <option value="">{currentLanguage === 'vi' ? '--Chọn hình thức--' : '--Select format--'}</option>
              {formatOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

         {/* Họ tên */}
        <div className="mb-3">
          <label className="form-label small fw-semibold text-secondary">
            {currentLanguage === 'vi' ? 'Họ tên *' : 'Full Name *'}
          </label>
          <input
            type="text"
            className="form-control form-control-sm rounded-3 shadow-sm border border-1 border-light"
            style={{
              transition: 'all 0.2s ease-in-out',
            }}
            value={formData.HoTen}
            onChange={(e) => handleInputChange('HoTen', e.target.value)}
            disabled={loading}
            placeholder={currentLanguage === 'vi' ? 'Nhập họ tên' : 'Enter full name'}
            onFocus={(e) => (e.target.style.boxShadow = '0 0 0 3px rgba(44,77,158,0.2)')}
            onBlur={(e) => (e.target.style.boxShadow = 'none')}
          />
        </div>


          {/* Email */}
          <div>
            <label className="form-label small text-secondary fw-semibold">
              {currentLanguage === 'vi' ? 'Email *' : 'Email *'}
            </label>
            <input
              type="email"
              className="form-control form-control-sm rounded-3"
              value={formData.Email}
              onChange={(e) => handleInputChange("Email", e.target.value)}
              disabled={loading}
              placeholder={currentLanguage === 'vi' ? "Nhập email" : "Enter email"}
            />
          </div>

          {/* Mã vùng + SĐT */}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <div style={{ flex: "0 0 100px" }}>
              <label className="form-label small text-secondary fw-semibold">
                {currentLanguage === 'vi' ? 'Mã vùng' : 'Area Code'}
              </label>
              <select
                className="form-select form-select-sm rounded-3"
                value={formData.MaVung}
                onChange={(e) => handleInputChange("MaVung", e.target.value)}
                disabled={loading}
              >
                <option value="+84">+84</option>
                <option value="+82">+82</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label className="form-label small text-secondary fw-semibold">
                {currentLanguage === 'vi' ? 'SĐT *' : 'Phone *'}
              </label>
              <input
                className="form-control form-control-sm rounded-3"
                value={formData.SoDienThoai}
                onChange={(e) => handleInputChange("SoDienThoai", e.target.value)}
                disabled={loading}
                placeholder={currentLanguage === 'vi' ? "Nhập số điện thoại" : "Enter phone number"}
              />
            </div>
          </div>

          {/* Tiêu đề */}
          <div>
            <label className="form-label small text-secondary fw-semibold">
              {currentLanguage === 'vi' ? 'Tiêu đề' : 'Title'}
            </label>
            <input
              className="form-control form-control-sm rounded-3"
              value={formData.TieuDe}
              onChange={(e) => handleInputChange("TieuDe", e.target.value)}
              disabled={loading}
              placeholder={currentLanguage === 'vi' ? "Nhập tiêu đề" : "Enter title"}
            />
          </div>

          {/* Ngày */}
          <div>
            <label className="form-label small text-secondary fw-semibold">
              {currentLanguage === 'vi' ? 'Ngày' : 'Date'}
            </label>
            <input
              type="date"
              className="form-control form-control-sm rounded-3"
              value={formData.ChonNgay}
              onChange={(e) => handleInputChange("ChonNgay", e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Giờ */}
          <div>
            <label className="form-label small text-secondary fw-semibold">
              {currentLanguage === 'vi' ? 'Giờ' : 'Time'}
            </label>
            <input
              type="time"
              className="form-control form-control-sm rounded-3"
              value={formData.Gio}
              onChange={(e) => handleInputChange("Gio", e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Nội dung - Ghi chú */}
          <div>
            <label className="form-label small text-secondary fw-semibold">
              {currentLanguage === 'vi' ? 'Nội dung' : 'Content'}
            </label>
            <textarea
              rows={2}
              className="form-control rounded-3"
              value={formData.NoiDung}
              onChange={(e) => handleInputChange("NoiDung", e.target.value)}
              disabled={loading}
              placeholder={currentLanguage === 'vi' ? "Nhập nội dung" : "Enter content"}
            />
          </div>

          <div>
            <label className="form-label small text-secondary fw-semibold">
              {currentLanguage === 'vi' ? 'Ghi chú' : 'Note'}
            </label>
            <textarea
              rows={2}
              className="form-control rounded-3"
              value={formData.GhiChu}
              onChange={(e) => handleInputChange("GhiChu", e.target.value)}
              disabled={loading}
              placeholder={currentLanguage === 'vi' ? "Nhập ghi chú" : "Enter note"}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="d-flex justify-content-center gap-3 mt-4">
          <button 
            className="btn btn-light border rounded-pill px-4" 
            onClick={handleClose}
            disabled={loading}
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            {currentLanguage === 'vi' ? 'Hủy' : 'Cancel'}
          </button>
          <button
            className="btn rounded-pill px-4"
            style={{
              backgroundColor: "#2563eb",
              border: "none",
              color: "white",
              fontWeight: 600,
              position: "relative"
            }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                {currentLanguage === 'vi' ? 'Đang thêm...' : 'Adding...'}
              </>
            ) : (
              currentLanguage === 'vi' ? 'Thêm yêu cầu' : 'Add Request'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};


// ================= CMSDashboard =================
const CMSDashboard = () => {
  
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20;
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const filterMenuRef = useRef(null);

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target)) {
        setShowFilterMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [showSidebar, setShowSidebar] = useState(true);
  const [viewMode, setViewMode] = useState("summary");
  const [fromChart, setFromChart] = useState(false);
  const [filterDichVu, setFilterDichVu] = useState("");
  const [timeRange, setTimeRange] = useState(30); // mặc định 30 ngày
  const [filterUser, setFilterUser] =useState("")
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showRequestList, setShowRequestList] = useState(false);
  const [filterRegion, setFilterRegion] = useState("");
  const [filterType, setFilterType] = useState("status"); 
  const [data, setData] = useState([]);
  const [users, setUsers] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const tableContainerRef = useRef(null);
  const [hasNewRequest, setHasNewRequest] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('vi'); // 'vi' or 'en'
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem("notifications");
    return saved ? JSON.parse(saved) : [];
  });


  const handleOpenEditModal = () => {
    console.log("📝 Mở modal chỉnh sửa profile");
    setShowEditModal(true);
  };

  const handleLogout = () => {
    console.log("🚪 Đang đăng xuất...");
    localStorage.removeItem("currentUser");
    window.location.href = "/login";
  };

  const [currentUser, setCurrentUser] = useState({
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    avatar: null,
    is_admin: true
  });
  const [filterMode, setFilterMode] = useState("");
  const [searchTerm, setSearchTerm] = useState('');
  const toastContainerRef = useRef(null);
  const [dichvuList, setDichvuList] = useState([]);
  
  const handleToggleSidebar = () => setShowSidebar(prev => !prev);

useEffect(() => {
  const askPermission = () => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then((perm) => {
        console.log("🔔 Quyền thông báo:", perm);
        if (perm === "granted") {
          new Notification("✅ Bật thông báo thành công", {
            body: "Bạn sẽ nhận được thông báo khi có yêu cầu mới!",
            icon: "/logo192x192.png",
          });
        } else {
          alert("⚠️ Vui lòng cho phép trình duyệt gửi thông báo để nhận yêu cầu mới!");
        }
      });
    }
  };


  window.addEventListener("click", askPermission, { once: true });


  if ("Notification" in window && Notification.permission === "granted") {
    console.log("🔔 Notification đã được cấp quyền sẵn");
  }

  return () => window.removeEventListener("click", askPermission);
}, []);


useEffect(() => {
  const socket = io("https://op-backend-60ti.onrender.com", {
    transports: ["websocket", "polling"],
    withCredentials: false,
  });

  socket.on("connect", () => console.log("✅ Socket connected:", socket.id));

  // 🟢 Nhận sự kiện yêu cầu mới từ khách hàng
  socket.on("new_request", (newRequestData) => {
    console.log("📨 Nhận yêu cầu mới từ KH:", newRequestData);

    // ✅ Thêm yêu cầu vào danh sách nếu chưa có
    setData((prev) => {
      const exists = prev.some((r) => r.YeuCauID === newRequestData.YeuCauID);
      return exists ? prev : [...prev, newRequestData];
    });

    // ✅ Tạo thông báo trong hệ thống dashboard
    const newNotification = {
      id: Date.now(),
      message:
        currentLanguage === "vi"
          ? `Yêu cầu mới từ: ${newRequestData.HoTen || "Khách hàng"}`
          : `New request from: ${newRequestData.HoTen || "Customer"}`,
      time: new Date().toLocaleTimeString("vi-VN"),
      requestId: newRequestData.YeuCauID,
    };

    setNotifications((prev) => {
      const updated = [newNotification, ...prev.slice(0, 9)];
      localStorage.setItem("notifications", JSON.stringify(updated));
      return updated;
    });

    // ✅ Hiện toast nội bộ trong dashboard
    showToast(
      currentLanguage === "vi"
        ? `Có yêu cầu mới từ ${newRequestData.HoTen}`
        : `New request from ${newRequestData.HoTen}`,
      "success"
    );

    setHasNewRequest(true);
    setShowNotification(true);

   
    if ("Notification" in window && Notification.permission === "granted") {
    try {
      const translatedService = translateService(newRequestData.TenDichVu);

      new Notification("Yêu cầu khách hàng mới", {
        body: `${newRequestData.HoTen || "Khách hàng"} - ${
          translatedService || "Dịch vụ"
        }`,
        icon: "logo192x192.png",
        badge: "logo192x192.png",
        requireInteraction: true,
        silent: false,
      });
    } catch (error) {
      console.error("❌ Lỗi hiển thị Notification:", error);
    }
      } else {
        console.warn("⚠️ Trình duyệt chưa cho phép Notification hoặc không hỗ trợ.");
      }
  });

  socket.on("disconnect", () => console.log("❌ Socket disconnected"));
  socket.on("error", (error) => console.error("Socket error:", error));

  return () => socket.disconnect();
}, [currentLanguage]);



  const handleProfileUpdate = async (userId, formData) => {
    try {
      console.log("🔄 Đang cập nhật profile...", { userId, formData });
      
      const res = await fetch(`https://op-backend-60ti.onrender.com/api/User/${userId}`, { 
        method: "PUT", 
        body: formData 
      });
      
      const result = await res.json();
      console.log("📨 Kết quả cập nhật:", result);
      
      if(result.success){
        const updatedUser = {
          ...currentUser,
          username: formData.get("username") || currentUser.username,
          email: formData.get("email") || currentUser.email,
          avatar: result.data?.[0]?.avatar || currentUser.avatar
        };
        
        setCurrentUser(updatedUser);
        localStorage.setItem("currentUser", JSON.stringify(updatedUser));
        showToast(currentLanguage === 'vi' ? "Cập nhật profile thành công!" : "Profile updated successfully!"),"success";
        return true;
      } else {
        showToast(
          currentLanguage === 'vi' 
            ? `❌ Cập nhật thất bại: ${result.message || result.error}`
            : `❌ Update failed: ${result.message || result.error}`, 
          "danger"
        );
        return false;
      }
    } catch(err){
      console.error("❌ Lỗi cập nhật profile:", err);
      showToast(currentLanguage === 'vi' ? "Lỗi máy chủ!" : "Server error!", "danger");
      return false;
    }
  };

  // Sửa useEffect cho sticky columns
  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;

    const stickyCols = container.querySelectorAll('.sticky-col');
    const handleScroll = () => {
      stickyCols.forEach(col => {
        if(container.scrollLeft > 0) col.classList.add('sticky');
        else col.classList.remove('sticky');
      });
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [data]);

  // Fetch dịch vụ từ API
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("https://op-backend-60ti.onrender.com/api/dichvu");
        const result = await res.json();
        if (result.success) setDichvuList(result.data);
        else setDichvuList([]);
      } catch (err) {
        console.error(err);
        setDichvuList([]);
      }
    })();
  }, []);

  // Fetch data ban đầu
useEffect(() => {
  const savedUser = localStorage.getItem("currentUser");
  if (savedUser) {
    try {
      setCurrentUser(JSON.parse(savedUser));
    } catch (err) {
      console.error(err);
    }
  }

  // Fetch data
  (async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem("currentUser"));

 
      const res1 = await fetch(
        `https://op-backend-60ti.onrender.com/api/yeucau?userId=${currentUser?.id || ""}&is_admin=${currentUser?.is_admin || false}`
      );
      const result1 = await res1.json();
      if (result1.success) setData(result1.data);

    
      const res2 = await fetch("https://op-backend-60ti.onrender.com/api/User");
      const result2 = await res2.json();
      if (result2.success) setUsers(result2.data);
    } catch (err) {
      console.error("❌ Lỗi khi tải dữ liệu:", err);
      showToast(
        currentLanguage === "vi"
          ? "Lỗi tải dữ liệu!"
          : "Error loading data!",
        "danger"
      );
    }
  })();
}, []);


  const handleBellClick = () => {
    setShowNotification(prev => !prev);
    setHasNewRequest(false); 
  };

// 🟦 Hàm cho ADMIN thêm yêu cầu mới (chỉ thêm hàng + toast)
const handleAddRequest = (newItem) => {
  setData(prev => {
    const exists = prev.some(item => item.YeuCauID === newItem.YeuCauID);
    if (exists) return prev;
    return [...prev, newItem]; // thêm cuối bảng
  });

  // showToast(
  //   currentLanguage === "vi"
  //     ? "Thêm yêu cầu mới thành công!"
  //     : "New request added successfully!",
  //   "success"
  // );
};

const handleSave = async (updatedItem) => {
  try {
    const res = await fetch(`https://op-backend-60ti.onrender.com/api/yeucau/${updatedItem.YeuCauID}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedItem),
    });
    const result = await res.json();

    if (result.success) {
      setData((prevData) =>
        prevData.map((item) =>
          item.YeuCauID === result.data.YeuCauID ? result.data : item
        )
      );
      showToast("Lưu thành công!", "success");
    } else {
      showToast(result.message || "Lỗi khi lưu!", "error");
    }
  } catch (err) {
    console.error(err);
    showToast("Lỗi kết nối máy chủ!", "error");
  }
};



  const handleStatusChange = (id, status) => {
    setData(prev => prev.map(item => 
      item.YeuCauID === id ? {...item, TrangThai: status} : item
    ));
  };

  // const handleSaveRow = async (id) => {
  //   const item = data.find(r => r.YeuCauID === id);
  //   if(!item) return;
  //   try {
  //     const res = await fetch(`https://op-backend-60ti.onrender.com/api/yeucau/${id}`, {
  //       method: 'PUT',
  //       headers: {'Content-Type': 'application/json'},
  //       body: JSON.stringify(item)
  //     });
  //     const result = await res.json();
  //     if(result.success) showToast(currentLanguage === 'vi' ? '✅ Cập nhật thành công!' : '✅ Update successful!');
  //     else showToast(currentLanguage === 'vi' ? '❌ Lỗi khi lưu dữ liệu!' : '❌ Error saving data!', 'danger');
  //   } catch(err) { 
  //     showToast(currentLanguage === 'vi' ? '❌ Lỗi máy chủ!' : '❌ Server error!', 'danger'); 
  //   }
  // };

// 🧃 Hàm hiển thị toast thông báo (duy nhất)

// ✅ Khi thay đổi bộ lọc hoặc tìm kiếm, quay về trang đầu
useEffect(() => {
  setCurrentPage(1);
}, [filterStatus, filterDichVu, filterUser, startDate, endDate, searchTerm]);

 const statusColors = {
    "Tư vấn": "#f59e0b",
    "Đang xử lý": "#3b82f6",
    "Đang nộp hồ sơ": "#06b6d4",
    "Hoàn thành": "#22c55e",
    "": "#2563eb", // default (xanh lam)
  };


// ✅ Hàm dịch TenDichVu từ tiếng Hàn sang tiếng Việt
const translateService = (serviceName) => {
  const map = {
    "인증 센터": "Chứng thực",
    "결혼 이민": "Kết hôn",
    "출생신고 대행": "Khai sinh, khai tử",
    "출입국 행정 대행": "Xuất nhập cảnh",
    "신분증명 서류 대행": "Giấy tờ tùy thân",
    "입양 절차 대행": "Nhận nuôi",
    "비자 대행": "Thị thực",
    "법률 컨설팅": "Tư vấn pháp lý",
    "B2B 서비스": "Dịch vụ B2B",
    "기타": "Khác",
  };
  return map[serviceName] || serviceName;
};
  const statusFilteredData = data.filter(
      (item) => !filterStatus || item.TrangThai === filterStatus
    );

    // 🔹 Gom nhóm dịch vụ
  const groupedByService =  statusFilteredData.reduce((acc, item) => {
    const service = translateService(item.TenDichVu || "Không xác định");
    acc[service] = (acc[service] || 0) + 1;
    return acc;
  }, {});

  const total = Object.values(groupedByService).reduce((a, b) => a + b, 0);
    // 🔹 Dữ liệu biểu đồ
    const statusChartData = Object.entries(groupedByService).map(
      ([service, count]) => ({
        service,
        count,
      })
    );

const chartFilteredData = data.filter((item) => {
  if (!item.NgayTao) return false;
  const date = new Date(item.NgayTao);
  const now = new Date();
  const diffDays = (now - date) / (1000 * 60 * 60 * 24);
  return diffDays <= timeRange;
});


// Gom dữ liệu theo ngày và dịch vụ
const chartData = Object.values(
  chartFilteredData.reduce((acc, cur) => {
    const date = new Date(cur.NgayTao).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const service = translateService(cur.TenDichVu || "Không xác định");
    if (!acc[date]) acc[date] = { date };
    acc[date][service] = (acc[date][service] || 0) + 1;
    return acc;
  }, {})
);

const allServices = [
  ...new Set(
    chartFilteredData.map((d) =>
      translateService(d.TenDichVu || "Không xác định")
    )
  ),
];



const normalize = (str) =>
  typeof str === "string"
    ? str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    : "";

const filteredData = data.filter((item) => {
  const matchSearch =
    item.HoTen?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.Email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.SoDienThoai?.toLowerCase().includes(searchTerm.toLowerCase());

  const matchStatus = filterStatus ? item.TrangThai === filterStatus : true;

  const matchService = filterDichVu
    ? normalize(translateService(item.TenDichVu)).includes(normalize(filterDichVu))
    : true;

  const itemDate = new Date(item.NgayTao);
  const matchDate =
    (!startDate || itemDate >= new Date(startDate)) &&
    (!endDate || itemDate <= new Date(endDate));

  // ✅ SỬA LẠI: Lọc theo nhân viên phụ trách - so sánh ID
  let matchUser = true;
  if (filterUser && filterUser !== "" && filterUser !== "--Chọn--") {
    // So sánh trực tiếp ID của nhân viên phụ trách
    matchUser = String(item.NguoiPhuTrachId) === String(filterUser);
  }

  return matchSearch && matchStatus && matchService && matchDate && matchUser;
});


  const pieData = [
    {
      name: currentLanguage === "vi" ? "Tư vấn" : "Consulting",
      value: data.filter((d) => d.TrangThai === "Tư vấn").length,
      TrangThai: "Tư vấn",
    },
    {
      name: currentLanguage === "vi" ? "Đang xử lý" : "Processing",
      value: data.filter((d) => d.TrangThai === "Đang xử lý").length,
      TrangThai: "Đang xử lý",
    },
    {
      name: currentLanguage === "vi" ? "Đang nộp hồ sơ" : "Submitting",
      value: data.filter((d) => d.TrangThai === "Đang nộp hồ sơ").length,
      TrangThai: "Đang nộp hồ sơ",
    },
    {
      name: currentLanguage === "vi" ? "Hoàn thành" : "Completed",
      value: data.filter((d) => d.TrangThai === "Hoàn thành").length,
      TrangThai: "Hoàn thành",
    },
  ];
// 🔹 Bảng màu thống nhất toàn dashboard
const serviceColorMap = {
  "Chứng thực": "#3b82f6",      // Xanh lam
  "Kết hôn": "#ec4899",         // Hồng đậm
  "Dịch vụ B2B": "#06b6d4",     // Xanh ngọc
  "Tư vấn pháp lý": "#84cc16",  // Xanh lá sáng
  "Khai sinh, khai tử": "#f59e0b",
  "Xuất nhập cảnh": "#6366f1",
  "Giấy tờ tùy thân": "#10b981",
  "Nhận nuôi": "#8b5cf6",
  "Thị thực": "#f97316",
  "Khác": "#9ca3af",
};

// const pieColors = ["#60a5fa", "#facc15", "#fb923c", "#34d399"];
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const currentRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);



  // Dịch các header của table theo ngôn ngữ
  const tableHeaders = currentLanguage === 'vi' 
    ? [
        'ID', 'Mã hồ sơ', 'Dịch vụ', 'Hình thức', 'Họ tên', 'Email', 'Mã Vùng', 
        'SĐT', 'Tiêu đề', 'Nội dung', 'Chọn ngày', 'Giờ', 'Ngày tạo', 'Trạng thái',
        ...(currentUser.is_admin ? ['Người phụ trách'] : []),
        'Ghi chú', 'Hành động'
      ]
    : [
        'ID', 'Record ID', 'Service', 'Mode', 'Full Name', 'Email', 'Area Code', 
        'Phone', 'Title', 'Content', 'Select Date', 'Time', 'Created Date', 'Status',
        ...(currentUser.is_admin ? ['Assignee'] : []),
        'Note', 'Action'
      ];

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
      {showNotification && (
        <div
          style={{
            position: "fixed",
            top: "39px",
            right: "90px",
            background: "white",
            borderRadius: "10px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            width: "300px",
            padding: "15px",
            zIndex: 3000,
            animation: "fadeInUp 0.3s ease",
            border: "1px solid #e5e7eb",
            maxHeight: "250px",
            overflowY: "auto"
          }}
        >
          <div
            style={{
              fontWeight: "600",
              color: "#2563eb",
              marginBottom: "10px",
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              justifyContent: "space-between"
            }}
          >
            <span>🔔 {currentLanguage === 'vi' ? 'Thông báo mới' : 'New Notifications'}</span>
            <button
              onClick={() => setShowNotification(false)}
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: "#9ca3af",
                fontSize: "14px"
              }}
            >
              ✕
            </button>
          </div>

          {notifications.length === 0 ? (
            <div style={{ fontSize: "14px", color: "#6b7280" }}>
              {currentLanguage === 'vi' ? 'Chưa có thông báo' : 'No notifications'}
            </div>
          ) : (
            notifications.map((n, i) => (
              <div
                key={i}
                style={{
                  padding: "8px 0",
                  borderBottom: "1px solid #f3f4f6",
                  cursor: "pointer"
                }}
                onClick={() => setShowNotification(false)}
              >
                <div style={{ fontSize: "14px", color: "#374151" }}>{n.message}</div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    marginTop: "4px",
                    fontStyle: "italic"
                  }}
                >
                  {n.time}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    {/* <Header
        currentUser={currentUser}
        onToggleSidebar={handleToggleSidebar}
        showSidebar={showSidebar}
        onOpenEditModal={handleOpenEditModal}
        hasNewRequest={hasNewRequest}
        onBellClick={handleBellClick}
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
      /> */}

    <Sidebar collapsed={!showSidebar}  user={currentUser} />


      <div
        style={{
          marginTop: 60,
          padding: 20,
          marginLeft: showSidebar ? 250 : 60,
          transition: "margin-left 0.3s",
        }}
      >
        {/* 🟦 Thanh tab điều hướng — chỉ hiển thị với admin */}
        {currentUser?.is_admin && (
          <div
            className="d-flex border-bottom mb-4"
            style={{
              gap: "2rem",
              borderColor: "#e0e0e0",
              fontWeight: 500,
              fontSize: "1rem",
            }}
          >
            {[
               { key: "summary", labelVi: "Tổng quan", labelEn: "Summary" },
                { key: "list", labelVi: "Danh sách", labelEn: "List" },
              ].map((tab) => (
                <div
                  key={tab.key}
                  onClick={() => {
                    if (tab.key === "list") {
                      if (!fromChart) {
                        // 🟢 Nếu KHÔNG đến từ biểu đồ, reset filter về mặc định
                        setFilterType(null);
                        setFilterDichVu(null);
                        setFilterStatus(null);
                      }
                    }
                    setFromChart(false);
                    setViewMode(tab.key);
                  }}
                  style={{
                    cursor: "pointer",
                    paddingBottom: "6px",
                    borderBottom:
                      viewMode === tab.key
                        ? "3px solid #2563eb"
                        : "3px solid transparent",
                    color: viewMode === tab.key ? "#2563eb" : "#6b7280",
                    fontWeight: viewMode === tab.key ? "600" : "500",
                    transition: "all 0.2s ease",
                  }}
                >
                  {currentLanguage === "vi" ? tab.labelVi : tab.labelEn}
              </div>

            ))}
          </div>
          
        )}

   {currentUser?.is_admin && viewMode === "summary" && (
      <div className="mb-4">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "2rem",
            flexWrap: "wrap",
          }}
        >
   
      <div style={{ flex: "1 1 48%", display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "20px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          cursor: "pointer",
        }}
        onClick={() => {
          setFilterDichVu(""); 
          showToast(
            currentLanguage === "vi"
              ? "Hiển thị toàn bộ danh sách yêu cầu"
              : "Showing all requests",
            "info"
          );
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.01)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        <h5 className="fw-semibold mb-3 text-primary">
          {currentLanguage === "vi"
            ? "Tổng quan số lượng dịch vụ"
            : "Service Overview"}
        </h5>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "2rem",
          }}
        >
          <div
            style={{
              flex: "1 1 50%",
              minWidth: 280,
              height: 320,
              position: "relative",
            }}
          >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                dataKey="value"
                data={Object.entries(
                  data.reduce((acc, cur) => {
                    const name = translateService(cur.TenDichVu || "Không xác định");
                    acc[name] = (acc[name] || 0) + 1;
                    return acc;
                  }, {})
                ).map(([name, count]) => ({ name, value: count }))}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                labelLine={false}
              >
                {Object.entries(
                  data.reduce((acc, cur) => {
                    const name = translateService(cur.TenDichVu || "Không xác định");
                    acc[name] = (acc[name] || 0) + 1;
                    return acc;
                  }, {})
                ).map(([name], i) => (
                  <Cell
                    key={i}
                    fill={serviceColorMap[name] || "#60a5fa"} 
                    cursor="pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFilterDichVu(name);
                      showToast(
                        currentLanguage === "vi"
                          ? `Đang lọc danh sách theo dịch vụ: ${name}`
                          : `Filtering requests for: ${name}`,
                        "info"
                      );
                    }}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>



            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                textAlign: "center",
              }}
            >
              <h4
                style={{
                  fontSize: "1.8rem",
                  fontWeight: "700",
                  color: "#2563eb",
                  marginBottom: "0.25rem",
                }}
              >
                {
                  Object.values(
                    data.reduce((acc, cur) => {
                      const name = translateService(cur.TenDichVu || "Không xác định");
                      acc[name] = (acc[name] || 0) + 1;
                      return acc;
                    }, {})
                  ).reduce((sum, val) => sum + val, 0)
                }
              </h4>
              {/* <span style={{ color: "#6b7280", fontSize: "0.9rem" }}>
                {currentLanguage === "vi" ? "Tổng" : "Total"}
              </span> */}
            </div>
          </div>


          <div style={{ flex: "1 1 45%", minWidth: 240 }}>
            <h6 className="fw-semibold mb-3 text-secondary">
              {currentLanguage === "vi"
                ? "Tổng quan số lượng dịch vụ"
                : "Service Summary"}
            </h6>
            {(() => {
              const grouped = data.reduce((acc, cur) => {
                const name = translateService(cur.TenDichVu || "Không xác định");
                acc[name] = (acc[name] || 0) + 1;
                return acc;
              }, {});
              const total = Object.values(grouped).reduce((sum, v) => sum + v, 0);
              return (
                <>
                  {Object.entries(grouped).map(([name, count], i) => {
                    const percent = ((count / total) * 100).toFixed(1);
                    return (
                      <div
                        key={i}
                        className="d-flex justify-content-between align-items-center mb-2"
                        style={{
                          cursor: "pointer",
                          background:
                            filterDichVu === name
                              ? "rgba(37,99,235,0.1)"
                              : "transparent",
                          borderRadius: 6,
                          padding: "4px 8px",
                        }}
                        onClick={() => {
                          setFilterDichVu(name);
                          showToast(
                            currentLanguage === "vi"
                              ? `Đang lọc danh sách theo dịch vụ: ${name}`
                              : `Filtering requests for: ${name}`,
                            "info"
                          );
                        }}
                      >
                        <span>{name}</span>
                        <strong>
                          {count}{" "}
                          <span style={{ color: "#6b7280" }}>({percent}%)</span>
                        </strong>
                      </div>
                    );
                  })}
                  <div
                    className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top"
                    style={{ fontWeight: "600", color: "#1f2937" }}
                  >
                    <span>{currentLanguage === "vi" ? "Tổng cộng" : "Total"}</span>
                    <span>
                      {total}{" "}
                      <span style={{ color: "#6b7280" }}>
                        {currentLanguage === "vi" ? "yêu cầu" : "requests"}
                      </span>
                    </span>
                  </div>
                </>
              );
            })()}
        </div>
      </div>
    </div>
    
    <div
      style={{
        background: "#fff",
        borderRadius: "12px",
        padding: "20px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
      }}
    >
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-semibold text-primary mb-0">
          {currentLanguage === "vi"
            ? "Số lượng dịch vụ theo thời gian"
            : "Service Count Over Time"}
        </h5>

        {/* Bộ lọc thời gian */}
        <select
          className="form-select form-select-sm"
          style={{ width: 160 }}
          value={timeRange}
          onChange={(e) => setTimeRange(Number(e.target.value))}
        >
          <option value={7}>7 ngày gần nhất</option>
          <option value={30}>30 ngày gần nhất</option>
          <option value={90}>90 ngày gần nhất</option>
          <option value={180}>6 tháng gần nhất</option>
        </select>
      </div>

      {chartData.length > 0 ? (
       <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData}>
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          angle={-30}
          textAnchor="end"
          height={60}
        />
        <YAxis />
        <Tooltip />
        <Legend />

        {allServices.map((service, i) => (
          <Bar
            key={i}
            dataKey={service}
            stackId="a"
            fill={serviceColorMap[service] || "#9ca3af"}
            cursor="pointer"
            opacity={filterDichVu && filterDichVu !== service ? 0.4 : 1}
            onClick={() => {
              setFilterDichVu((prev) =>
                prev === service ? "" : service
              );
              showToast(
                currentLanguage === "vi"
                  ? filterDichVu === service
                    ? "Hiển thị toàn bộ dịch vụ"
                    : `Đang lọc theo dịch vụ: ${service}`
                  : filterDichVu === service
                  ? "Showing all services"
                  : `Filtering by service: ${service}`,
                "info"
              );
            }}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>

      ) : (
        <div className="text-center text-muted py-5">
          {currentLanguage === "vi"
            ? "Không có dữ liệu trong khoảng thời gian đã chọn"
            : "No data available for selected period"}
        </div>
      )}
    </div>



    <div
      style={{
        background: "#fff",
        borderRadius: "12px",
        padding: "20px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
      }}
    >
      <h5 className="fw-semibold mb-3 text-primary">
        {currentLanguage === "vi"
          ? "Số lượng dịch vụ theo khu vực"
          : "Service Count by Region"}
      </h5>

      {(() => {
        const regionMap = { "+84": "Việt Nam", "+82": "Hàn Quốc" };
        const grouped = data.reduce((acc, cur) => {
          const region = regionMap[cur.MaVung] || cur.MaVung || "Không xác định";
          acc[region] = (acc[region] || 0) + 1;
          return acc;
        }, {});
        const total = Object.values(grouped).reduce((s, v) => s + v, 0);
        const colors = ["#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899", "#f97316"];

        return (
          <>
            {Object.entries(grouped).map(([region, count], i) => {
              const percent = ((count / total) * 100).toFixed(1);
              return (
                <div
                  key={i}
                  onClick={() => {
                    // Khi bấm vào vùng
                    setFilterRegion(region === filterRegion ? "" : region);
                    showToast(
                      region === filterRegion
                        ? currentLanguage === "vi"
                          ? "Hiển thị tất cả khu vực"
                          : "Showing all regions"
                        : currentLanguage === "vi"
                        ? `Lọc theo khu vực: ${region}`
                        : `Filtering by region: ${region}`,
                      "info"
                    );
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                    gap: 12,
                    cursor: "pointer",
                    background:
                      filterRegion === region ? "rgba(37,99,235,0.08)" : "transparent",
                    borderRadius: 8,
                    padding: "4px 8px",
                    transition: "background 0.2s ease",
                  }}
                >
                  <div style={{ width: 100, fontWeight: 500 }}>{region}</div>

                  <div
                    style={{
                      flex: 1,
                      background: "#f3f4f6",
                      borderRadius: 8,
                      height: 10,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${percent}%`,
                        background: colors[i % colors.length],
                        height: "100%",
                        borderRadius: 8,
                        transition: "width 0.3s ease",
                      }}
                    ></div>
                  </div>

                  <div
                    style={{
                      width: 90,
                      display: "flex",
                      justifyContent: "flex-end",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <strong style={{ color: "#2563eb" }}>{count}</strong>
                    <span style={{ color: "#6b7280" }}>{percent}%</span>
                  </div>
                </div>
              );
            })}

            {/* Tổng cộng */}
            <div
              className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top"
              style={{ fontWeight: "600", color: "#1f2937" }}
            >
              <span>{currentLanguage === "vi" ? "Tổng cộng" : "Total"}</span>
              <span>
                {total}{" "}
                <span style={{ color: "#6b7280" }}>
                  {currentLanguage === "vi" ? "yêu cầu" : "requests"}
                </span>
              </span>
            </div>
          </>
        );
      })()}
    </div>
      <div
  style={{
    background: "#fff",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
  }}
>
  <h5 className="fw-semibold mb-3 text-primary">
    {currentLanguage === "vi"
      ? "Số lượng dịch vụ theo kênh liên hệ"
      : "Service Count by Contact Channel"}
  </h5>

  {(() => {
    const grouped = data.reduce((acc, cur) => {
      const type = cur.TenHinhThuc || "Không xác định";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    const total = Object.values(grouped).reduce((s, v) => s + v, 0);
    const colorMap = {
      "Trực tiếp": "#3b82f6",
      "Gọi điện": "#22c55e",
      "Email": "#f59e0b",
      "Tin nhắn": "#9ca3af",
    };

    return (
      <>
        {Object.entries(grouped).map(([type, count], i) => {
          const percent = ((count / total) * 100).toFixed(1);
          return (
            <div
              key={i}
              onClick={() => {
                setFilterMode(type === filterMode ? "" : type);
                showToast(
                  type === filterMode
                    ? currentLanguage === "vi"
                      ? "Hiển thị tất cả kênh liên hệ"
                      : "Showing all contact channels"
                    : currentLanguage === "vi"
                    ? `Lọc theo kênh liên hệ: ${type}`
                    : `Filtering by contact channel: ${type}`,
                  "info"
                );
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
                gap: 12,
                cursor: "pointer",
                background:
                  filterMode === type
                    ? "rgba(37,99,235,0.08)"
                    : "transparent",
                borderRadius: 8,
                padding: "4px 8px",
                transition: "background 0.2s ease",
              }}
            >
              <div style={{ width: 160, fontWeight: 500 }}>{type}</div>
              <div
                style={{
                  flex: 1,
                  background: "#f3f4f6",
                  borderRadius: 8,
                  height: 10,
                }}
              >
                <div
                  style={{
                    width: `${percent}%`,
                    background: colorMap[type] || "#9ca3af",
                    height: "100%",
                    borderRadius: 8,
                    transition: "width 0.3s ease",
                  }}
                ></div>
              </div>
              <div
                style={{
                  width: 90,
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <strong style={{ color: "#2563eb" }}>{count}</strong>
                <span style={{ color: "#6b7280" }}>{percent}%</span>
              </div>
            </div>
          );
        })}

        {/* Tổng cộng */}
        <div
          className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top"
          style={{ fontWeight: "600", color: "#1f2937" }}
        >
          <span>
            {currentLanguage === "vi" ? "Tổng cộng" : "Total"}
          </span>
          <span>
            {total}{" "}
            <span style={{ color: "#6b7280" }}>
              {currentLanguage === "vi" ? "yêu cầu" : "requests"}
            </span>
          </span>
        </div>
      </>
    );
  })()}
</div>

    <div
      style={{
        background: "#fff",
        borderRadius: "12px",
        padding: "20px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        marginTop: "2rem",
      }}
    >
      {/* 🔹 Tiêu đề + Dropdown */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-semibold text-primary mb-0">
          {currentLanguage === "vi"
            ? "Số lượng dịch vụ theo trạng thái thực hiện"
            : "Service Count by Status"}
        </h5>

        <div className="d-flex align-items-center">
          <select
            className="form-select form-select-sm"
            style={{ width: 200 }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">
              {currentLanguage === "vi" ? "Tất cả trạng thái" : "All statuses"}
            </option>
            <option value="Tư vấn">
              {currentLanguage === "vi" ? "Tư vấn" : "Consulting"}
            </option>
            <option value="Đang xử lý">
              {currentLanguage === "vi" ? "Đang xử lý" : "Processing"}
            </option>
            <option value="Đang nộp hồ sơ">
              {currentLanguage === "vi" ? "Đang nộp hồ sơ" : "Submitting"}
            </option>
            <option value="Hoàn thành">
              {currentLanguage === "vi" ? "Hoàn thành" : "Completed"}
            </option>
          </select>

          {filterStatus && (
            <button
              className="btn btn-outline-secondary btn-sm ms-2"
              onClick={() => setFilterStatus("")}
            >
              {currentLanguage === "vi" ? "Xóa lọc" : "Reset"}
            </button>
          )}
        </div>
      </div>

      {/* 🔹 Hiển thị thanh progress cho từng dịch vụ */}
      <div>
        {Object.entries(groupedByService).map(([service, count], i) => {
          const percent = ((count / total) * 100).toFixed(1);
          const color = serviceColorMap[service] || "#60a5fa";

          return (
            <div key={i} className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <strong>{service}</strong>
                <span style={{ fontWeight: 500, color: color }}>
                  {count} ({percent}%)
                </span>
              </div>

              {/* Thanh progress */}
              <div
                style={{
                  height: "8px",
                  borderRadius: "6px",
                  background: "#e5e7eb",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${percent}%`,
                    background: color,
                    height: "100%",
                    borderRadius: "6px",
                    transition: "width 0.5s ease",
                  }}
                ></div>
              </div>
            </div>
          );
        })}

        {/* 🔹 Tổng cộng */}
        <div
          className="d-flex justify-content-end align-items-center mt-3 pt-2 border-top"
          style={{ fontWeight: 600, color: "#374151" }}
        >
          <span>
            {total}{" "}
            <span style={{ color: "#6b7280" }}>
              {currentLanguage === "vi" ? "yêu cầu" : "requests"}
            </span>
          </span>
        </div>
      </div>
    </div>


  </div>

      <div
      style={{
        flex: "1 1 48%",
        background: "#fff",
        borderRadius: "12px",
        padding: "20px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        overflowY: "auto",
        maxHeight: "1000px",
      }}
    >
  
        <div
          className="d-flex justify-content-between align-items-center mb-3"
          style={{ gap: "1rem" }}
        >
          <h5 className="fw-semibold mb-0 text-primary">
            {currentLanguage === "vi"
              ? filterRegion
                ? `Danh sách yêu cầu (${filterRegion}${
                    filterDichVu ? " - " + filterDichVu : ""
                  })`
                : filterDichVu
                ? `Danh sách yêu cầu (${filterDichVu})`
                : "Danh sách yêu cầu"
              : filterRegion
              ? `Request List (${filterRegion}${
                  filterDichVu ? " - " + filterDichVu : ""
                })`
              : filterDichVu
              ? `Request List (${filterDichVu})`
              : "Request List"}
          </h5>

         {(filterRegion || filterDichVu) && (
        <button
          className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
          onClick={() => {
            setFilterRegion("");
            setFilterDichVu("");
            showToast(
              currentLanguage === "vi"
                ? "Đã xóa toàn bộ bộ lọc, hiển thị tất cả yêu cầu"
                : "All filters cleared, showing all requests",
              "info"
            );
          }}
          title={
            currentLanguage === "vi"
              ? "Xóa toàn bộ bộ lọc"
              : "Clear all filters"
          }
          style={{
            fontWeight: 500,
            whiteSpace: "nowrap",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <FilterX size={16} strokeWidth={2} />
        </button>
      )}

        </div>

        {/* 📋 Bảng dữ liệu yêu cầu */}
        <table className="table table-hover table-bordered align-middle">
          <thead className="table-light">
            <tr>
              <th>ID</th>
              <th>{currentLanguage === "vi" ? "Họ tên" : "Name"}</th>
              <th>{currentLanguage === "vi" ? "Mã vùng" : "Region Code"}</th>
              <th>{currentLanguage === "vi" ? "Số điện thoại" : "Phone"}</th>
              <th>Email</th>
              <th>{currentLanguage === "vi" ? "Dịch vụ" : "Service"}</th>
              <th>{currentLanguage === "vi" ? "Trạng thái" : "Status"}</th>
            </tr>
          </thead>

          <tbody>
            {data
              .filter((r) => {
                // 🔸 Lọc theo dịch vụ
                const matchService = filterDichVu
                  ? translateService(r.TenDichVu) === filterDichVu
                  : true;

                // 🔸 Lọc theo khu vực
                const regionMap = { "+84": "Việt Nam", "+82": "Hàn Quốc" };
                const region = regionMap[r.MaVung] || r.MaVung || "Không xác định";
                const matchRegion = filterRegion ? region === filterRegion : true;

                return matchService && matchRegion;
              })
              .map((r) => (
                <tr key={r.YeuCauID}>
                  <td>{r.YeuCauID}</td>
                  <td>{r.HoTen}</td>
                  <td>{r.MaVung}</td>
                  <td>{r.SoDienThoai || "—"}</td>
                  <td>{r.Email || "—"}</td>
                  <td>{translateService(r.TenDichVu)}</td>
                  <td>{r.TrangThai}</td>
                </tr>
              ))}
          </tbody>
        </table>

          {data.filter((r) => {
          const date = new Date(r.NgayTao);
          const now = new Date();
          const diffDays = (now - date) / (1000 * 60 * 60 * 24);
          const matchTime = diffDays <= timeRange;

          const matchService = filterDichVu
            ? translateService(r.TenDichVu) === filterDichVu
            : true;

          const regionMap = { "+84": "Việt Nam", "+82": "Hàn Quốc" };
          const region = regionMap[r.MaVung] || r.MaVung || "Không xác định";
          const matchRegion = filterRegion ? region === filterRegion : true;

          return matchTime && matchService && matchRegion;
        }).length === 0 && (
          <tr>
            <td colSpan="7" className="text-center text-muted py-3">
              {currentLanguage === "vi"
                ? "Không có yêu cầu nào trong khoảng thời gian hoặc bộ lọc đã chọn"
                : "No requests found for selected filters"}
            </td>
          </tr>
        )}

          </div>
        </div>
      </div>
    )}



    {/* 🟨 List mode — Hiển thị danh sách khách hàng */}
    {(!currentUser?.is_admin || viewMode === "list") && (
      <>
        <div className="mb-4">
          <h5 className="fw-semibold mb-3 text-primary">
          {currentLanguage === "vi"
            ? "Danh sách yêu cầu khách hàng"
            : "Customer Request List"}
        </h5>


          {/* 🔍 Thanh tìm kiếm + ➕ nút thêm */}
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
                (e.target.style.boxShadow =
                  "0 0 8px rgba(37,99,235,0.3)")
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
        </div>

    <div className="filter-wrapper mb-3">
  <button
    className="filter-btn d-flex align-items-center gap-2 position-relative"
    type="button"
    onClick={() => setShowFilterMenu(!showFilterMenu)}
    style={{
      borderRadius: "30px",
      padding: "6px 14px",
      fontSize: "14px",
      border: "1px solid #d1d5db",
      background: "#fff",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      transition: "all 0.2s ease",
    }}
  >
    <Filter size={18} />

    <span>
      {/* ✅ Ưu tiên hiển thị loại lọc hiện tại */}
      {filterType === "status" && filterStatus ? (
        currentLanguage === "vi" ? (
          `Trạng thái: ${filterStatus}`
        ) : (
          `Status: ${filterStatus}`
        )
      ) : filterType === "time" && (startDate || endDate) ? (
        currentLanguage === "vi" ? (
          `Thời gian: ${startDate || "?"} → ${endDate || "?"}`
        ) : (
          `Time: ${startDate || "?"} → ${endDate || "?"}`
        )
      ) : filterType === "staff" && filterUser ? (
        currentLanguage === "vi" ? (
          `Nhân viên: ${
            users.find((u) => u.id === filterUser)?.name || "Không xác định"
          }`
        ) : (
          `Staff: ${users.find((u) => u.id === filterUser)?.name || "Unknown"}`
        )
      ) : currentLanguage === "vi" ? (
        "Lọc dữ liệu"
      ) : (
        "Filter data"
      )}
    </span>

    {/* ✅ Nút xoá bộ lọc - chỉ hiển thị khi có bộ lọc */}
      {(filterStatus || startDate || endDate || filterUser) && (
    <FilterX
      size={17}
      color="#9ca3af"
      style={{
        marginLeft: "6px",
        cursor: "pointer",
        transition: "color 0.2s ease",
      }}
      onClick={(e) => {
        e.stopPropagation(); // tránh click vào button gốc
        setFilterStatus("");
        setFilterUser("");
        setStartDate("");
        setEndDate("");
        showToast(
          currentLanguage === "vi"
            ? "Đã xoá bộ lọc"
            : "Filter cleared",
          "info"
        );
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
    />
  )}
</button>

  <AnimatePresence>
    {showFilterMenu && (
      <motion.div
        ref={filterMenuRef}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className="filter-dropdown shadow-sm"
        style={{
          position: "absolute",
          top: "45px",
          left: "0",
          background: "#fff",
          borderRadius: "10px",
          padding: "10px",
          width: "240px",
          border: "1px solid #e5e7eb",
          zIndex: 1000,
        }}
      >
        <div
          className="fw-semibold text-muted small mb-2"
          style={{ paddingLeft: "6px" }}
        >
          {currentLanguage === "vi" ? "Lọc theo" : "Filter by"}
        </div>

        {[
          { key: "status", vi: "Trạng thái thực hiện", en: "Status" },
          { key: "time", vi: "Thời gian", en: "Time" },
          { key: "staff", vi: "Nhân viên phụ trách", en: "Staff" },
        ].map((item) => (
          <div
            key={item.key}
            className={`dropdown-item-modern position-relative ${
              filterType === item.key ? "active" : ""
            }`}
            onMouseEnter={() => setFilterType(item.key)}
            style={{
              fontWeight: filterType === item.key ? "600" : "500",
              background:
                filterType === item.key
                  ? "rgba(37,99,235,0.08)"
                  : "transparent",
              cursor: "pointer",
              paddingRight: "28px",
              position: "relative",
            }}
          >
            {currentLanguage === "vi" ? item.vi : item.en}
            <ChevronRight
              size={16}
              style={{
                position: "absolute",
                right: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#9ca3af",
              }}
            />

            {/* Menu con hiển thị khi hover */}
            {filterType === item.key && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="submenu shadow-sm"
                style={{
                  position: "absolute",
                  top: "0",
                  left: "100%",
                  marginLeft: "8px",
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  width: "220px",
                  padding: "10px",
                  zIndex: 1100,
                }}
              >
                {/* --- Lọc theo trạng thái --- */}
                {item.key === "status" &&
                  ["Tư vấn", "Đang xử lý", "Đang nộp hồ sơ", "Hoàn thành"].map(
                    (status) => (
                      <div
                        key={status}
                        className={`dropdown-item-modern ${
                          filterStatus === status ? "active" : ""
                        }`}
                        onClick={() => {
                          setFilterStatus(status);
                          setShowFilterMenu(false);
                          showToast(
                            currentLanguage === "vi"
                              ? `Đã lọc theo trạng thái: ${status}`
                              : `Filtered by status: ${status}`,
                            "info"
                          );
                        }}
                      >
                        {currentLanguage === "vi"
                          ? status
                          : status === "Tư vấn"
                          ? "Consulting"
                          : status === "Đang xử lý"
                          ? "Processing"
                          : status === "Đang nộp hồ sơ"
                          ? "Submitting"
                          : "Completed"}
                      </div>
                    )
                  )}

                {/* --- Lọc theo thời gian --- */}
                {item.key === "time" && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <label className="small text-muted">
                      {currentLanguage === "vi" ? "Từ ngày:" : "From:"}
                    </label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                    <label className="small text-muted">
                      {currentLanguage === "vi" ? "Đến ngày:" : "To:"}
                    </label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                    <button
                      className="btn btn-sm btn-primary mt-2"
                      onClick={() => {
                        setFilterType("time");
                        setShowFilterMenu(false);
                        showToast(
                          currentLanguage === "vi"
                            ? "Đã áp dụng bộ lọc thời gian"
                            : "Time filter applied",
                          "success"
                        );
                      }}
                    >
                      {currentLanguage === "vi" ? "Áp dụng" : "Apply"}
                    </button>
                  </div>
                )}

                {/* --- Lọc theo nhân viên --- */}
                {item.key === "staff" &&
                  users.map((u) => (
                    <div
                      key={u.id}
                      className={`dropdown-item-modern ${
                        filterUser === u.id ? "active" : ""
                      }`}
                      onClick={() => {
                        setFilterUser(u.id);
                        setShowFilterMenu(false);
                        showToast(
                          currentLanguage === "vi"
                            ? `Đã lọc theo nhân viên: ${u.name}`
                            : `Filtered by staff: ${u.name}`,
                          "info"
                        );
                      }}
                    >
                      {u.name}
                    </div>
                  ))}
              </motion.div>
            )}
          </div>
        ))}
      </motion.div>
    )}
  </AnimatePresence>

      </div>

      <div className="table-responsive" ref={tableContainerRef}>
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
            {currentRows.length > 0 ? (
              currentRows.map((item) => (
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
 <div className="d-flex justify-content-between align-items-center mt-3 px-2">

          <div className="text-muted small">
            {currentLanguage === 'vi'
              ? `Hiển thị ${currentRows.length} / ${filteredData.length} hàng`
              : `Showing ${currentRows.length} / ${filteredData.length} rows`}
          </div>

          {/* 👉 Phân trang */}
          <div className="d-flex justify-content-center align-items-center">
            <nav>
              <ul className="pagination pagination-sm mb-0 shadow-sm">
                <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                  <button className="page-link" onClick={() => setCurrentPage(p => p - 1)}>
                    &laquo;
                  </button>
                </li>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1))
                  .map((p, idx, arr) => (
                    <React.Fragment key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <li className="page-item disabled"><span className="page-link">…</span></li>
                      )}
                      <li className={`page-item ${currentPage === p ? "active" : ""}`}>
                        <button className="page-link" onClick={() => setCurrentPage(p)}>
                          {p}
                        </button>
                      </li>
                    </React.Fragment>
                  ))}

                <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                  <button className="page-link" onClick={() => setCurrentPage(p => p + 1)}>
                    &raquo;
                  </button>
                </li>
              </ul>
            </nav>

            <div className="ms-3 text-muted small">
              {currentLanguage === 'vi'
                ? `Trang ${currentPage}/${totalPages}`
                : `Page ${currentPage}/${totalPages}`}
            </div>
          </div>
        </div>

    </>
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
          onSave={handleAddRequest} // ✅ Gọi hàm riêng này
          currentLanguage={currentLanguage}
        />
      )}


      <div ref={toastContainerRef} id="toast-container"></div>
    </div>
  );
};

export default CMSDashboard;
