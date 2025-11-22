import React, { useState, useEffect } from "react";
import { Save, Trash2 } from "lucide-react";
import { showToast } from "../utils/toast";
import "../styles/TableRow.css";
import Swal from "sweetalert2";

const TableRow = ({
  item,
  dichvuList,
  users,
  currentUser,
  data,
  onStatusChange,
  onSave,
  onDelete,
  currentLanguage,
  columns,        // Props mới
  getStickyLeft,  // Props mới
}) => {
  const [localData, setLocalData] = useState(item);
  const textRef = React.useRef(); 
  const [value, setValue] = React.useState(localData.NoiDung || "");

  const onChangeText = (e) => {
    setValue(e.target.value);
    handleInputChange("NoiDung", e.target.value);
  };

  React.useEffect(() => {
    if (textRef.current) {
      textRef.current.style.height = "auto";
      textRef.current.style.height = textRef.current.scrollHeight + "px";
    }
  }, [value]);

  const handleDeleteClick = () => {
    Swal.fire({
      title: currentLanguage === "vi" ? "Bạn chắc chắn chứ?" : "Are you sure?",
      text: currentLanguage === "vi" ? "Hành động này không thể hoàn tác!" : "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444", 
      cancelButtonColor: "#6b7280", 
      confirmButtonText: currentLanguage === "vi" ? "Xoá" : "Delete",
      cancelButtonText: currentLanguage === "vi" ? "Hủy" : "Cancel",
      reverseButtons: false 
    }).then((result) => {
      if (result.isConfirmed) {
        onDelete(localData.YeuCauID);
      }
    });
  };

  const handleInputChange = (field, value) => {
    setLocalData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "NguoiPhuTrachId") {
        const selectedUser = users.find((u) => String(u.id) === String(value));
        updated.NguoiPhuTrach = selectedUser ? selectedUser.name : "";
      }
      return updated;
    });
  };

  const gioVN = localData.Gio
    ? new Date(localData.Gio).toLocaleTimeString("vi-VN", { hour12: false, hour: "2-digit", minute: "2-digit" })
    : "";

  const translateBranch = (branch) => {
    const map = { 서울: "Seoul", 부산: "Busan" };
    return map[branch] || branch || "";
  };

  const translateService = (serviceName) => {
    const map = {
      "인증 센터": "Chứng thực",
      "결혼 이민": "Kết hôn",
      "출생신고 대행": "Khai sinh, khai tử",
      "출입국 행정 대행": "Xuất nhập cảnh",
      "신분증명 서류 대행": "Giấy tờ tuỳ thân",
      "입양 절차 대행": "Nhận nuôi",
      "비자 대행": "Thị thực",
      "법률 컨설팅": "Tư vấn pháp lý",
      "B2B 서비스": "Dịch vụ B2B",
      기타: "Khác",
    };
    return map[serviceName] || serviceName;
  };

  const displayMaHoSo = localData.TrangThai === "Tư vấn" ? "" : localData.MaHoSo || "-";

  const statusOptions = [
    { value: "Tư vấn", label: "Tư vấn" },
    { value: "Đang xử lý", label: "Đang xử lý" },
    { value: "Đang nộp hồ sơ", label: "Đang nộp hồ sơ" },
    { value: "Hoàn thành", label: "Hoàn thành" },
  ];

  // Hàm helper để render TD với style sticky động
  const RenderTd = ({ colKey, children, className = "", style = {} }) => {
    // Tìm cấu hình cột hiện tại
    const colIndex = columns.findIndex(c => c.key === colKey);
    const colConfig = columns[colIndex];

    if (!colConfig || !colConfig.visible) return null;

    const stickyStyle = colConfig.pinned ? {
        position: "sticky",
        left: getStickyLeft(colIndex),
        zIndex: 10,
        backgroundColor: "#fff", // Nền trắng để che nội dung khi cuộn
        borderRight: "2px solid #e5e7eb" // Border phân cách phần sticky
    } : {};

    return (
        <td className={className} style={{ ...style, ...stickyStyle }}>
            {children}
        </td>
    );
  };

  return (
    <tr>
      <RenderTd colKey="id" className="text-center fw-semibold">
        {localData.YeuCauID}
      </RenderTd>

      <RenderTd colKey="code" className="text-center">
        {displayMaHoSo}
      </RenderTd>

      <RenderTd colKey="service">
        <input
          type="text"
          className="form-control form-control-sm w-130"
          value={translateService(localData.TenDichVu)}
          onChange={(e) => handleInputChange("TenDichVu", e.target.value)}
        />
      </RenderTd>

      <RenderTd colKey="type" className="text-center">
        {localData.TenHinhThuc}
      </RenderTd>

      <RenderTd colKey="branch" className="text-center">
        {translateBranch(localData.CoSoTuVan)}
      </RenderTd>

      <RenderTd colKey="name">
        <input
          type="text"
          className="form-control form-control-sm w-120"
          value={localData.HoTen}
          onChange={(e) => handleInputChange("HoTen", e.target.value)}
        />
      </RenderTd>

      <RenderTd colKey="email">
        <input
          type="email"
          className="form-control form-control-sm w-150"
          value={localData.Email}
          onChange={(e) => handleInputChange("Email", e.target.value)}
        />
      </RenderTd>

      <RenderTd colKey="region">
        <input
          type="text"
          className="form-control form-control-sm w-50"
          value={localData.MaVung}
          onChange={(e) => handleInputChange("MaVung", e.target.value)}
        />
      </RenderTd>

      <RenderTd colKey="phone">
        <input
          type="text"
          className="form-control form-control-sm w-100"
          value={localData.SoDienThoai}
          onChange={(e) => handleInputChange("SoDienThoai", e.target.value)}
        />
      </RenderTd>

      <RenderTd colKey="title">
        <input
          type="text"
          className="form-control form-control-sm w-140"
          value={localData.TieuDe}
          onChange={(e) => handleInputChange("TieuDe", e.target.value)}
        />
      </RenderTd>

      <RenderTd colKey="content">
        <textarea
          ref={textRef}
          value={value}
          onChange={onChangeText}
          className="form-control form-control-sm autosize-textarea"
        />
      </RenderTd>

      <RenderTd colKey="date">
        <input
          type="date"
          className="form-control form-control-sm w-120"
          value={localData.ChonNgay ? new Date(localData.ChonNgay).toISOString().split("T")[0] : ""}
          onChange={(e) => handleInputChange("ChonNgay", e.target.value)}
        />
      </RenderTd>

      <RenderTd colKey="time">
        <input
          type="time"
          className="form-control form-control-sm w-100"
          value={gioVN}
          onChange={(e) => handleInputChange("Gio", e.target.value)}
        />
      </RenderTd>

      <RenderTd colKey="created" className="text-center text-nowrap">
        {localData.NgayTao && (
          <> 
            {new Date(localData.NgayTao).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })} 
            <br /> 
            {new Date(localData.NgayTao).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false })} 
          </>
        )}
      </RenderTd>

      <RenderTd colKey="status">
        <select
          className="form-select form-select-sm"
          style={{width: 143}}
          value={localData.TrangThai}
          onChange={(e) => handleInputChange("TrangThai", e.target.value)}
        >
          {statusOptions.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </RenderTd>

      {/* Cột phụ trách có logic riêng kiểm tra visible trong DashboardList nên chỉ cần check key */}
      <RenderTd colKey="pic">
        <select
          className="form-select form-select-sm w-130"
          value={localData.NguoiPhuTrachId || ""}
          onChange={(e) => handleInputChange("NguoiPhuTrachId", e.target.value)}
        >
          <option value="">--Chọn--</option>
          {users.map((u) => (
            <option key={u.id} value={String(u.id)}>{u.name}</option>
          ))}
        </select>
      </RenderTd>

      <RenderTd colKey="note">
        <textarea
          className="form-control form-control-sm autosize-textarea"
          value={localData.GhiChu || ""}
          onChange={(e) => {
            handleInputChange("GhiChu", e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = e.target.scrollHeight + "px";
          }}
        />
      </RenderTd>

      <RenderTd colKey="action" className="text-center">
        <div className="d-flex justify-content-center align-items-center gap-2">
          <button className="btn btn-sm" style={{ backgroundColor: "#2563eb", color: "#fff", width: 36, height: 36, borderRadius: 6 }} onClick={() => onSave(localData)}>
            <Save size={17} strokeWidth={2.3} />
          </button>
          <button className="btn btn-sm" style={{ backgroundColor: "#ef4444", color: "#fff", width: 36, height: 36, borderRadius: 6 }} onClick={handleDeleteClick}>
            <Trash2 size={17} strokeWidth={2.3} />
          </button>
        </div>
      </RenderTd>
    </tr>
  );
};

export default TableRow;