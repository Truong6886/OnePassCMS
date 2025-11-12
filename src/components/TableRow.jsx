import React, { useState, useEffect } from "react";
import { Save, Trash2 } from "lucide-react";
import { showToast } from "../utils/toast";
import "../styles/TableRow.css";
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
}) => {
  const [localData, setLocalData] = useState(item);

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
    ? new Date(localData.Gio).toLocaleTimeString("vi-VN", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const translateBranch = (branch) => {
    const map = {
      서울: "Seoul",
      부산: "Busan",
    };
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

  const handleSave = () => onSave(localData);
  const displayMaHoSo =
    localData.TrangThai === "Tư vấn" ? "" : localData.MaHoSo || "-";

  const statusOptions =
    currentLanguage === "vi"
      ? [
          { value: "Tư vấn", label: "Tư vấn" },
          { value: "Đang xử lý", label: "Đang xử lý" },
          { value: "Đang nộp hồ sơ", label: "Đang nộp hồ sơ" },
          { value: "Hoàn thành", label: "Hoàn thành" },
        ]
      : [
          { value: "Tư vấn", label: "Consulting" },
          { value: "Đang xử lý", label: "Processing" },
          { value: "Đang nộp hồ sơ", label: "Submitting" },
          { value: "Hoàn thành", label: "Completed" },
        ];

  return (
    <tr>
      <td className="text-center fw-semibold">{localData.YeuCauID}</td>
      <td className="text-center">{displayMaHoSo}</td>

      {/* Dịch vụ */}
      <td>
        <input
          type="text"
          className="form-control form-control-sm"
          style={{ width: 130 }}
          value={translateService(localData.TenDichVu)}
          onChange={(e) => handleInputChange("TenDichVu", e.target.value)}
        />
      </td>

      <td>{localData.TenHinhThuc}</td>
      <td>{translateBranch(localData.CoSoTuVan)}</td>

      {/* Họ tên */}
      <td className="sticky-col">
        <input
          type="text"
          className="form-control form-control-sm"
          style={{ width: 120 }}
          value={localData.HoTen}
          onChange={(e) => handleInputChange("HoTen", e.target.value)}
        />
      </td>

      {/* Email / SĐT */}
      <td>
        <input
          type="email"
          className="form-control form-control-sm"
          style={{ width: 150 }}
          value={localData.Email}
          onChange={(e) => handleInputChange("Email", e.target.value)}
        />
      </td>
      <td>
        <input
          type="text"
          className="form-control form-control-sm"
          style={{ width: 50 }}
          value={localData.MaVung}
          onChange={(e) => handleInputChange("MaVung", e.target.value)}
        />
      </td>
      <td>
        <input
          type="text"
          className="form-control form-control-sm"
          style={{ width: 100 }}
          value={localData.SoDienThoai}
          onChange={(e) => handleInputChange("SoDienThoai", e.target.value)}
        />
      </td>

      {/* Tiêu đề */}
      <td>
        <input
          type="text"
          className="form-control form-control-sm"
          style={{ width: 140 }}
          value={localData.TieuDe}
          onChange={(e) => handleInputChange("TieuDe", e.target.value)}
        />
      </td>

      {/* ✅ Nội dung — textarea */}
      <td>
        <textarea
          className="form-control form-control-sm"
          style={{
            width: 200,
            minHeight: "60px",
            resize: "vertical",
            lineHeight: "1.4",
          }}
          rows={2}
          value={localData.NoiDung || ""}
          onChange={(e) => handleInputChange("NoiDung", e.target.value)}
        />
      </td>

      {/* Ngày / Giờ */}
      <td>
        <input
          type="date"
          className="form-control form-control-sm"
          style={{ width: 120 }}
          value={
            localData.ChonNgay
              ? new Date(localData.ChonNgay).toISOString().split("T")[0]
              : ""
          }
          onChange={(e) => handleInputChange("ChonNgay", e.target.value)}
        />
      </td>
      <td>
        <input
          type="time"
          className="form-control form-control-sm"
          style={{ width: 100 }}
          value={gioVN}
          onChange={(e) => handleInputChange("Gio", e.target.value)}
        />
      </td>

      {/* Ngày tạo */}
      <td className="text-center text-nowrap">
        {localData.NgayTao && (
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
        )}
      </td>

      {/* Trạng thái */}
      <td>
        <select
          className="form-select form-select-sm"
          style={{ width: 140 }}
          value={localData.TrangThai}
          onChange={(e) => handleInputChange("TrangThai", e.target.value)}
        >
          {statusOptions.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </td>

      {/* Người phụ trách */}
      {currentUser?.is_admin && (
        <td>
          <select
            className="form-select form-select-sm"
            style={{ width: 130 }}
            value={localData.NguoiPhuTrachId || ""}
            onChange={(e) => handleInputChange("NguoiPhuTrachId", e.target.value)}
          >
            <option value="">--Chọn--</option>
            {users.map((u) => (
              <option key={u.id} value={String(u.id)}>
                {u.name}
              </option>
            ))}
          </select>
        </td>
      )}

      {/* ✅ Ghi chú — textarea */}
      <td>
        <textarea
          className="form-control form-control-sm"
          style={{
            width: 200,
            minHeight: "60px",
            resize: "vertical",
            lineHeight: "1.4",
          }}
          rows={2}
          value={localData.GhiChu || ""}
          onChange={(e) => handleInputChange("GhiChu", e.target.value)}
        />
      </td>

      {/* Hành động */}
      <td className="text-center">
        <div className="d-flex justify-content-center align-items-center gap-2">
          <button
            className="btn btn-sm"
            style={{
              backgroundColor: "#2563eb",
              color: "#fff",
              width: 36,
              height: 36,
              borderRadius: 6,
            }}
            onClick={handleSave}
          >
            <Save size={17} strokeWidth={2.3} />
          </button>

          <button
            className="btn btn-sm"
            style={{
              backgroundColor: "#ef4444",
              color: "#fff",
              width: 36,
              height: 36,
              borderRadius: 6,
            }}
            onClick={() => onDelete(localData.YeuCauID)}
          >
            <Trash2 size={17} strokeWidth={2.3} />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default TableRow;
