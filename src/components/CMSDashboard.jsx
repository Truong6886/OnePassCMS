import React, { useState, useEffect, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../components/CMSDashboard.css';
import Sidebar from '../components/Sidebar'; 
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { io } from "socket.io-client";
import { Filter } from "lucide-react"; 
import { motion, AnimatePresence } from "framer-motion";
import { Bell } from "lucide-react";
import { Save, Trash2 } from "lucide-react";
import * as bootstrap from 'bootstrap';
window.bootstrap = bootstrap;
// ✅ Hàm tiện ích hiện thông báo nhỏ dạng popup
const showToast = (message, type = "info") => {
  const colors = {
    success: "#4caf50",
    error: "#f44336",
    warning: "#ff9800",
    info: "#2196f3",
  };
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style.position = "fixed";
  toast.style.bottom = "20px";
  toast.style.right = "20px";
  toast.style.padding = "12px 20px";
  toast.style.background = colors[type] || colors.info;
  toast.style.color = "white";
  toast.style.borderRadius = "8px";
  toast.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
  toast.style.zIndex = "9999";
  toast.style.fontSize = "14px";
  toast.style.transition = "opacity 0.5s ease";
  document.body.appendChild(toast);
  setTimeout(() => (toast.style.opacity = "0"), 2500);
  setTimeout(() => toast.remove(), 3000);
};

// ================= Header =================
const Header = ({ currentUser, onToggleSidebar, showSidebar, onOpenEditModal, onBellClick, hasNewRequest, currentLanguage, onLanguageChange }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const languageDropdownRef = useRef(null);

  // Click ngoài dropdown để tắt
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target)) {
        setLanguageDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    window.location.href = "/login";
  };

  // ✅ THÊM: Hàm xử lý click dropdown item
  const handleDropdownItemClick = (action) => {
    setDropdownOpen(false); // Đóng dropdown trước
    if (action === 'edit') {
      onOpenEditModal();
    } else if (action === 'logout') {
      handleLogout();
    }
  };

  // Hàm xử lý chuyển đổi ngôn ngữ
  const handleLanguageChange = (lang) => {
    setLanguageDropdownOpen(false);
    onLanguageChange(lang);
  };

  return (
    <header
      className="d-flex align-items-center justify-content-between p-2"
      style={{
        background: "#FFFFFF",
        color: "#111",
        height: "60px",
        position: "fixed",
        top: 0,
        left: showSidebar ? "250px" : "60px",
        right: 0,
        zIndex: 999,
        borderBottom: "1px solid #E5E7EB",
        paddingLeft: 20,
        paddingRight: 20,
        transition: "left 0.3s ease-in-out"
      }}
    >
      <div className="d-flex align-items-center">
        <button
          onClick={onToggleSidebar}
          style={{
            background: "transparent",
            color: "#2c4d9e",
            border: "none",
            borderRadius: "6px",
            padding: "6px 10px",
            fontSize: "20px",
            lineHeight: "1",
            cursor: "pointer",
            transition: "transform 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.2)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          ☰
        </button>
      </div>

      {/* Bell + Language + Avatar Section */}
      <div className="d-flex align-items-center me-3" style={{ gap: "14px" }}>
  

        {/* 🔔 Bell Notification */}
        <div className="position-relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBellClick();
            }}
            className="btn position-relative d-flex align-items-center justify-content-center"
            style={{
              width: "46px",
              height: "46px",
              border: "none",
              background: "transparent",
              borderRadius: "50%",
              cursor: "pointer",
              transition: "transform 0.25s ease-in-out, filter 0.25s ease-in-out",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.1)";
              e.currentTarget.style.filter = "drop-shadow(0 2px 4px rgba(44,77,158,0.4))";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.filter = "none";
            }}
          >
            {/* 🔔 Bell icon với gradient nhẹ */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              fill="url(#bellGradient)"
              viewBox="0 0 24 24"
              className={hasNewRequest ? "bell-shake" : ""}
            >
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9z"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              <defs>
                <linearGradient id="bellGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3d5cb8" />
                  <stop offset="100%" stopColor="#2c4d9e" />
                </linearGradient>
              </defs>
            </svg>

            {/* 🔴 Red badge */}
            {hasNewRequest && (
              <span
                style={{
                  position: "absolute",
                  top: "5px",
                  right: "7px",
                  width: "9px",
                  height: "9px",
                  backgroundColor: "#ef4444",
                  borderRadius: "50%",
                  boxShadow: "0 0 8px rgba(239,68,68,0.5)",
                }}
              ></span>
            )}
          </button>
        </div>
        <div className="d-flex align-items-center" style={{ gap: "12px" }}>
          {/* 🇻🇳 Vietnamese */}
          <button
            type="button"
            onClick={() => onLanguageChange("vi")}
            style={{
              width: "25px",
              height: "25px",
              borderRadius: "50%",
              overflow: "hidden",
              border: "none",
              boxShadow:
                currentLanguage === "vi"
                  ? "0 0 8px rgba(0,0,0,0.2), 0 0 10px rgba(255,255,255,0.4)"
                  : "0 2px 6px rgba(0,0,0,0.2)",
              background: "transparent",
              cursor: "pointer",
              padding: 0,
              transition: "all 0.3s ease",
              transform: currentLanguage === "vi" ? "scale(1.1)" : "scale(1)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.15)")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.transform =
                currentLanguage === "vi" ? "scale(1.1)" : "scale(1)")
            }
          >
            <img
              src="https://flagcdn.com/w80/vn.png"
              alt="Vietnamese"
              style={{
                width: "25px",
                height: "25px",
                objectFit: "cover",
                display: "block",
                borderRadius: "50%",
                filter: "drop-shadow(0 0 2px rgba(0,0,0,0.2))",
              }}
            />
          </button>

          {/* 🇬🇧 English */}
          <button
            type="button"
            onClick={() => onLanguageChange("en")}
            style={{
              width: "25px",
              height: "25px",
              borderRadius: "50%",
              overflow: "hidden",
              border: "none",
              boxShadow:
                currentLanguage === "en"
                  ? "0 0 8px rgba(0,0,0,0.2), 0 0 10px rgba(255,255,255,0.4)"
                  : "0 2px 6px rgba(0,0,0,0.2)",
              background: "transparent",
              cursor: "pointer",
              padding: 0,
              transition: "all 0.3s ease",
              transform: currentLanguage === "en" ? "scale(1.1)" : "scale(1)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.15)")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.transform =
                currentLanguage === "en" ? "scale(1.1)" : "scale(1)")
            }
          >
            <img
              src="https://flagcdn.com/w80/gb.png"
              alt="English"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                borderRadius: "50%",
                filter: "drop-shadow(0 0 2px rgba(0,0,0,0.2))",
              }}
            />
          </button>
        </div>




        {/* 🧑‍💼 Avatar Dropdown */}
        <div className="position-relative" ref={dropdownRef}>
          <div
            onClick={(e) => {
              e.stopPropagation(); // ✅ NGĂN SỰ KIỆN LAN RA NGOÀI
              setDropdownOpen(!dropdownOpen);
            }}
            className="d-flex align-items-center justify-content-center rounded-circle"
            style={{
              width: "44px",
              height: "44px",
              cursor: "pointer",
              backgroundColor: dropdownOpen ? "#eef5ff" : "white",
              border: "1px solid #cfe2ff",
              transition: "all 0.2s ease-in-out",
              boxShadow: dropdownOpen
                ? "0 2px 8px rgba(0,0,0,0.15)"
                : "0 1px 4px rgba(0,0,0,0.08)",
            }}
          >
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                currentUser?.username || "User"
              )}&background=0D8ABC&color=fff&rounded=true&size=128`}
              alt="avatar"
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                border: "2px solid transparent",
                backgroundImage:
                  "linear-gradient(white, white), linear-gradient(135deg, #007bff, #00b4d8)",
                backgroundOrigin: "border-box",
                backgroundClip: "content-box, border-box",
                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                transition: "transform 0.2s ease-in-out",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "scale(1.07)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "scale(1)")
              }
            />
          </div>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div
              className="position-absolute shadow-lg"
              style={{
                top: "43px",
                right: "0",
                width: "250px",
                zIndex: 1050,
                background: "white",
                borderRadius: "16px",
                overflow: "hidden",
                border: "1px solid rgba(0,0,0,0.05)",
                backdropFilter: "blur(8px)",
                animation: "fadeInUp 0.25s ease-out",
                boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
              }}
            >
              {/* Header user info */}
              <div
                className="d-flex align-items-center gap-3 px-3 py-3"
                style={{
                  background: "linear-gradient(135deg, #007bff, #00b4d8)",
                  color: "white",
                }}
              >
                <img
                  src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    currentUser?.username || "User"
                  )}&background=0D8ABC&color=fff&rounded=true&size=128`}
                  alt="avatar"
                  style={{
                    width: "46px",
                    height: "46px",
                    borderRadius: "50%",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    objectFit: "cover",
                    border: "2px solid rgba(255,255,255,0.3)"
                  }}
                />
                <div>
                  <div className="fw-bold" style={{ fontSize: "15px" }}>
                    {currentUser?.username || "User"}
                  </div>
                  <div style={{ fontSize: "13px", opacity: 0.9 }}>
                    {currentUser?.email}
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="d-flex flex-column py-2">
                <button
                  className="d-flex align-items-center px-3 py-2 border-0 bg-transparent text-start w-100"
                  style={{ fontSize: "14px", transition: "background 0.2s, color 0.2s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f8ff")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDropdownItemClick('edit');
                  }}
                >
                  <i className="bi bi-person-gear me-2 text-primary"></i>
                  <span>{currentLanguage === 'vi' ? 'Sửa thông tin' : 'Edit Profile'}</span>
                </button>

                <div className="border-top my-1"></div>

                <button
                  className="d-flex align-items-center px-3 py-2 border-0 bg-transparent text-start w-100 text-danger fw-semibold"
                  style={{
                    fontSize: "14px",
                    transition: "background 0.2s, color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#ffecec")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDropdownItemClick('logout');
                  }}
                >
                  <i className="bi bi-box-arrow-right me-2"></i>
                  <span>{currentLanguage === 'vi' ? 'Đăng xuất' : 'Logout'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

// ================= TableRow =================
const TableRow = ({ item, dichvuList, users, currentUser, data, onStatusChange, onSave, onDelete, currentLanguage }) => {
  const [localData, setLocalData] = useState(item);
  const handleInputChange = (field, value) => setLocalData(prev => ({ ...prev, [field]: value }));
  const gioVN = localData.Gio ? new Date(localData.Gio).toLocaleTimeString('vi-VN', { hour12: false, hour: '2-digit', minute:'2-digit' }) : '';
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

  const handleSave = () => onSave(localData.YeuCauID);
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
          value={localData.TenDichVu}
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

                  const resAll = await fetch(`/api/yeucau`);
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
                  const res = await fetch(`/api/yeucau/${localData.YeuCauID}`, {
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
              else if (newStatus === "Tư vấn" && localData.MaHoSo) {
                try {
                  handleInputChange("MaHoSo", "");
                  showToast(
                    currentLanguage === "vi"
                      ? "Đã xóa mã hồ sơ."
                      : "Record code has been reset.",
                    "info"
                  );

                  const res = await fetch(`/api/yeucau/${localData.YeuCauID}`, {
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
            style={{width: 100}}
            value={localData.NguoiPhuTrachId || ""}
            onChange={(e) => handleInputChange("NguoiPhuTrachId", e.target.value)}
          >
            <option value="">{currentLanguage === 'vi' ? '--Chọn--' : '--Select--'}</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
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
      const res = await fetch(`https://onepasscms-backend.onrender.com/api/yeucau/${localData.YeuCauID}`, {
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

      const res = await fetch("/api/yeucau", {
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

  const [searchTerm, setSearchTerm] = useState('');
  const toastContainerRef = useRef(null);
  const [dichvuList, setDichvuList] = useState([]);
  
  const handleToggleSidebar = () => setShowSidebar(prev => !prev);

  // Socket connection
useEffect(() => {
  const socket = io("https://onepasscms-backend.onrender.com", {
    transports: ["websocket", "polling"],
    withCredentials: false,
  });

  socket.on("connect", () => console.log("✅ Socket connected:", socket.id));

  // 🟢 KH gửi form → có thông báo + chuông
  socket.on("new_request", (newRequestData) => {
    console.log("📨 Nhận yêu cầu mới từ KH:", newRequestData);

    setData(prev => {
      const exists = prev.some(r => r.YeuCauID === newRequestData.YeuCauID);
      return exists ? prev : [...prev, newRequestData];
    });

    // 🔔 Thông báo + chuông
    const newNotification = {
      id: Date.now(),
      message:
        currentLanguage === "vi"
          ? `Yêu cầu mới từ: ${newRequestData.HoTen || "Khách hàng"}`
          : `New request from: ${newRequestData.HoTen || "Customer"}`,
      time: new Date().toLocaleTimeString("vi-VN"),
      requestId: newRequestData.YeuCauID,
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev.slice(0, 9)];
      localStorage.setItem("notifications", JSON.stringify(updated));
      return updated;
    });

    setHasNewRequest(true);
    setShowNotification(true);
    showToast(
      currentLanguage === "vi"
        ? `🎉 Có yêu cầu mới từ ${newRequestData.HoTen}`
        : `🎉 New request from ${newRequestData.HoTen}`,
      "success"
    );
  });

  socket.on("disconnect", () => console.log("❌ Socket disconnected"));
  socket.on("error", (error) => console.error("Socket error:", error));

  return () => {
    socket.disconnect();
  };
}, [currentLanguage]);




  const handleProfileUpdate = async (userId, formData) => {
    try {
      console.log("🔄 Đang cập nhật profile...", { userId, formData });
      
      const res = await fetch(`/api/User/${userId}`, { 
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
        showToast(currentLanguage === 'vi' ? "✅ Cập nhật profile thành công!" : "✅ Profile updated successfully!");
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
      showToast(currentLanguage === 'vi' ? "❌ Lỗi máy chủ!" : "❌ Server error!", "danger");
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
        const res = await fetch("/api/dichvu");
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
    if(savedUser) {
      try { 
        setCurrentUser(JSON.parse(savedUser)); 
      } catch(err){ 
        console.error(err); 
      }
    }

    // Fetch data
    (async () => {
      try {
        const res1 = await fetch('https://onepasscms-backend.onrender.com/api/yeucau');
        const result1 = await res1.json();
        if(result1.success) setData(result1.data);
        
        const res2 = await fetch('https://onepasscms-backend.onrender.com/api/User');
        const result2 = await res2.json();
        if(result2.success) setUsers(result2.data);
      } catch(err) { 
        showToast(currentLanguage === 'vi' ? '❌ Lỗi tải dữ liệu!' : '❌ Error loading data!', 'danger'); 
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



  const handleStatusChange = (id, status) => {
    setData(prev => prev.map(item => 
      item.YeuCauID === id ? {...item, TrangThai: status} : item
    ));
  };

  const handleSaveRow = async (id) => {
    const item = data.find(r => r.YeuCauID === id);
    if(!item) return;
    try {
      const res = await fetch(`https://onepasscms-backend.onrender.com/api/yeucau/${id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(item)
      });
      const result = await res.json();
      if(result.success) showToast(currentLanguage === 'vi' ? '✅ Cập nhật thành công!' : '✅ Update successful!');
      else showToast(currentLanguage === 'vi' ? '❌ Lỗi khi lưu dữ liệu!' : '❌ Error saving data!', 'danger');
    } catch(err) { 
      showToast(currentLanguage === 'vi' ? '❌ Lỗi máy chủ!' : '❌ Server error!', 'danger'); 
    }
  };

  const showToast = (msg, type = 'success') => {
    if (!toastContainerRef.current) return;
    
    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center text-bg-${type} border-0`;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');
    toastEl.innerHTML = `<div class="d-flex"><div class="toast-body">${msg}</div></div>`;
    toastContainerRef.current.appendChild(toastEl);
    
    const bsToast = new window.bootstrap.Toast(toastEl, { delay: 3000 });
    bsToast.show();
    
    toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
  };
useEffect(() => {
  setCurrentPage(1);
}, [filterStatus, searchTerm]);

const filteredData = data.filter(item => {
  const s = searchTerm.toLowerCase();
  const matchSearch =
    item.HoTen?.toLowerCase().includes(s) ||
    item.Email?.toLowerCase().includes(s) ||
    item.SoDienThoai?.toLowerCase().includes(s);

  const matchStatus = filterStatus ? item.TrangThai === filterStatus : true;

  return matchSearch && matchStatus;
});


  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  // Dịch các header của table theo ngôn ngữ
  const tableHeaders = currentLanguage === 'vi' 
    ? [
        'ID', 'Mã hồ sơ', 'Dịch vụ', 'Hình thức', 'Họ tên', 'Email', 'Mã Vùng', 
        'SĐT', 'Tiêu đề', 'Nội dung', 'Chọn ngày', 'Giờ', 'Ngày tạo', 'Trạng thái',
        ...(currentUser.is_admin ? ['Người phụ trách'] : []),
        'Ghi chú', 'Hành động'
      ]
    : [
        'ID', 'Record ID', 'Service', 'Format', 'Full Name', 'Email', 'Area Code', 
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

      <Sidebar collapsed={!showSidebar} onSelect={() => {}} active="list" />

      <div style={{
        marginTop: 60, 
        padding: 20, 
        marginLeft: showSidebar ? 250 : 60, 
        transition: 'margin-left 0.3s'
      }}>
      <div className="mb-4">
  {/* Dòng tiêu đề */}
  <h4 className="fw-bold mb-3">
    {currentLanguage === 'vi' ? 'Danh sách yêu cầu khách hàng' : 'Customer Request List'}
  </h4>

  {/* Dòng tìm kiếm + nút thêm */}
  <div className="d-flex justify-content-between align-items-center">
    <input
      type="text"
      className="form-control shadow-sm"
      placeholder={
        currentLanguage === 'vi'
          ? '🔍  Tìm kiếm Họ tên, Email, SĐT...'
          : '🔍  Search Name, Email, Phone...'
      }
      style={{
        width: 300,
        borderRadius: '30px',
        paddingLeft: '18px',
        transition: 'all 0.3s ease',
      }}
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      onFocus={(e) => (e.target.style.boxShadow = '0 0 8px rgba(37,99,235,0.3)')}
      onBlur={(e) => (e.target.style.boxShadow = 'none')}
    />
        <button
      className="btn btn-success shadow-sm"
      style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        fontSize: 28,
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.25s ease',
        padding: 0,
        lineHeight: 0, // ✅ loại bỏ độ lệch dọc
      }}
      onClick={() => setShowAddModal(true)}
      onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
    >
      <span style={{ transform: 'translateY(-1px)' }}>+</span> {/* ✅ căn chính giữa tuyệt đối */}
    </button>


        </div>
      </div>
  
  <div className="filter-wrapper">
    {/* Nút Filter */}
    <button
      className="filter-btn"
      type="button"
      onClick={() => setShowFilterMenu(!showFilterMenu)}
    >
      <Filter size={18} />
      <span>
        {filterStatus
          ? currentLanguage === "vi"
            ? `Trạng thái: ${filterStatus}`
            : `Status: ${filterStatus}`
          : currentLanguage === "vi"
          ? "Lọc theo trạng thái"
          : "Filter by Status"}
      </span>
    </button>

    {/* Dropdown hiện đại */}
        <AnimatePresence>
        {showFilterMenu && (
          <motion.div
            ref={filterMenuRef}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="filter-dropdown"
          >
            <div className="dropdown-arrow" />

            {["Tư vấn", "Đang xử lý", "Đang nộp hồ sơ", "Hoàn thành"].map(
              (status) => (
                <div
                  key={status}
                  className={`dropdown-item-modern ${
                    filterStatus === status ? "active" : ""
                  }`}
                  onClick={() => {
                    setFilterStatus(status);
                    setShowFilterMenu(false);
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
          </motion.div>
        )}
      </AnimatePresence>

  </div>



        <div className="table-responsive" ref={tableContainerRef}>
          <table className="table table-bordered table-hover align-middle">
           <thead>
            <tr>
              {tableHeaders.map((header, index) => (
                <th
                  key={index}
                  className={
                    header === (currentLanguage === 'vi' ? 'Họ tên' : 'Full Name')
                      ? 'sticky-col'
                      : ''
                  }
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

            <tbody>
             {currentRows.length > 0 ? currentRows.map(item => (
              <TableRow 
                key={item.YeuCauID} 
                item={item} 
                dichvuList={dichvuList || []} 
                users={users} 
                currentUser={currentUser} 
                onStatusChange={handleStatusChange} 
                onSave={handleSaveRow} 
                data={data} 
                currentLanguage={currentLanguage}
                onDelete={(id) => setData(prev => prev.filter(r => r.YeuCauID !== id))}
              />
            )) : (
              <tr>
                <td colSpan={tableHeaders.length} className="text-center py-4 text-muted">
                  {currentLanguage === 'vi' ? 'Không có dữ liệu' : 'No data available'}
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
