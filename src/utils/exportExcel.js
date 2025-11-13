import * as XLSX from "xlsx";
import translateService from "./translateService";

export function exportRequestsToExcel(data, currentLanguage) {
  if (!data || data.length === 0) return false;

  const exportData = data.map((item) => ({
   ID: item.YeuCauID,
       "Mã hồ sơ": item.MaHoSo,
       "Tên dịch vụ": translateService(item.TenDichVu),
       "Họ tên": item.HoTen,
       "Email": item.Email,
       "Số điện thoại": item.SoDienThoai,
       "Tiêu đề": item.TieuDe,
       "Nội dung": item.NoiDung,
       "Ngày chọn": item.ChonNgay,
       "Giờ": item.Gio,
       "Ngày tạo": item.NgayTao
       ? new Date(item.NgayTao).toLocaleString("vi-VN", {
           day: "2-digit",
           month: "2-digit",
           year: "numeric",
           hour: "2-digit",
           minute: "2-digit",
         })
       : "",
       "Trạng thái": item.TrangThai,
       "Ghi chú": item.GhiChu,
  }));

  const sheet = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, "Requests");

  XLSX.writeFile(
    wb,
    currentLanguage === "vi"
      ? "Danh_sach_yeu_cau.xlsx"
      : "Request_List.xlsx"
  );

  return true;
}
