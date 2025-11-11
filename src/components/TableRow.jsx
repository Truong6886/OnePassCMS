import React, { useState, useEffect } from "react";
import { Save, Trash2 } from "lucide-react";
import { showToast } from "../utils/toast";

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

      // ✅ Khi chọn người phụ trách, cập nhật cả tên nhân viên
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

  useEffect(() => {
    const table = document.querySelector("table.table");
    if (!table || !table.parentElement) return;

    const container = table.parentElement;
    const stickyCols = table.querySelectorAll(".sticky-col");

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      stickyCols.forEach((col) => {
        if (scrollLeft > 0) col.classList.add("sticky");
        else col.classList.remove("sticky");
      });
    };

    container.addEventListener("scroll", handleScroll);

    return () => {
      if (container) container.removeEventListener("scroll", handleScroll);
    };
  }, []);

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

      {/* Tên dịch vụ */}
      <td>
        <input
          type="text"
          className="form-control form-control-sm"
          style={{ width: 110 }}
          value={translateService(localData.TenDichVu)}
          onChange={(e) => handleInputChange("TenDichVu", e.target.value)}
          placeholder={
            currentLanguage === "vi" ? "Nhập dịch vụ" : "Enter service"
          }
        />
      </td>

      <td>{localData.TenHinhThuc}</td>
      <td>{translateBranch(localData.CoSoTuVan)}</td>

      {/* Họ tên */}
      <td className="sticky-col">
        <input
          type="text"
          className="form-control form-control-sm"
          style={{ width: 90 }}
          value={localData.HoTen}
          onChange={(e) => handleInputChange("HoTen", e.target.value)}
        />
      </td>

      {/* Email / SĐT */}
      <td>
        <input
          type="email"
          style={{ width: 130 }}
          className="form-control form-control-sm"
          value={localData.Email}
          onChange={(e) => handleInputChange("Email", e.target.value)}
        />
      </td>
      <td>
        <input
          type="text"
          style={{ width: 40 }}
          className="form-control form-control-sm"
          value={localData.MaVung}
          onChange={(e) => handleInputChange("MaVung", e.target.value)}
        />
      </td>
      <td>
        <input
          type="text"
          style={{ width: 90 }}
          className="form-control form-control-sm"
          value={localData.SoDienThoai}
          onChange={(e) => handleInputChange("SoDienThoai", e.target.value)}
        />
      </td>

      {/* Tiêu đề / Nội dung */}
      <td>
        <input
          style={{ width: 100 }}
          type="text"
          className="form-control form-control-sm"
          value={localData.TieuDe}
          onChange={(e) => handleInputChange("TieuDe", e.target.value)}
        />
      </td>
      <td>
        <textarea
          style={{ width: 150 }}
          className="form-control form-control-sm"
          rows={2}
          value={localData.NoiDung}
          onChange={(e) => handleInputChange("NoiDung", e.target.value)}
        />
      </td>

      {/* Ngày / Giờ */}
      <td>
        <input
          type="date"
          className="form-control form-control-sm"
          style={{ width: "100px" }}
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
          style={{ width: "80px" }}
          value={gioVN}
          onChange={(e) => handleInputChange("Gio", e.target.value)}
        />
      </td>

      {/* Ngày tạo */}
      <td className="text-nowrap text-center">
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
          style={{ width: 130 }}
          value={localData.TrangThai}
          onChange={(e) =>
            handleInputChange("TrangThai", e.target.value)
          }
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </td>

      {/* Người phụ trách (admin) */}
      {currentUser?.is_admin && (
        <td>
          <select
            className="form-select form-select-sm"
            style={{ width: 100 }}
            value={
              localData.NguoiPhuTrachId
                ? String(localData.NguoiPhuTrachId)
                : ""
            }
            onChange={(e) =>
              handleInputChange("NguoiPhuTrachId", e.target.value)
            }
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

      {/* Ghi chú */}
      <td>
        <textarea
          style={{ width: 150 }}
          className="form-control form-control-sm"
          rows={2}
          value={localData.GhiChu || ""}
          onChange={(e) => handleInputChange("GhiChu", e.target.value)}
        />
      </td>

      {/* Hành động */}
      <td className="text-center">
        <div className="d-flex justify-content-center align-items-center gap-2">
          {/* Nút Lưu */}
          <button
            className="btn btn-sm d-flex align-items-center justify-content-center"
            style={{
              backgroundColor: "#2563eb",
              border: "none",
              color: "white",
              width: 36,
              height: 36,
              borderRadius: 6,
            }}
            onClick={handleSave}
          >
            <Save size={17} strokeWidth={2.3} />
          </button>

          {/* Nút Xóa */}
          <button
            className="btn btn-sm d-flex align-items-center justify-content-center"
            style={{
              backgroundColor: "#ef4444",
              border: "none",
              color: "white",
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
