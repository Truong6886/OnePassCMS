import React, { useState, useEffect, useRef, useMemo } from "react";
import { showToast } from "../../utils/toast";
import "../../styles/DashboardList.css";
import EmailList from "./EmailList";
import { LayoutGrid, Pin, PinOff, Filter, ChevronRight, Check, X, FileText } from "lucide-react"; 
import { exportRequestsToExcel } from "../../utils/exportExcel";
import { authenticatedFetch } from "../../utils/api";
import translateService from "../../utils/translateService";

// --- 1. B2C Request Row (Đã cập nhật đầy đủ logic tài chính) ---
const B2CRequestRow = ({ item, visibleColumns, pinnedColumns, currentUser, currentLanguage }) => {
  const isVisible = (key) => (visibleColumns ? visibleColumns[key] : true);
  const isPinned = (key) => pinnedColumns.includes(key);
  const getStickyClass = (key) => isPinned(key) ? "sticky-col" : "";

  const canViewFinance = currentUser?.is_accountant || currentUser?.is_director;
  const canViewAssignee = currentUser?.is_admin || currentUser?.is_director || currentUser?.is_accountant;

  const translateBranch = (branch) => {
    const map = { "서울": "Seoul", "부산": "Busan" };
    return map[branch] || branch || "";
  };

  const displayMaHoSo = item.MaHoSo && item.MaHoSo.length > 5 ? item.MaHoSo : "";
  const formatNumber = (value) => (!value ? "0" : value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."));

  // --- Logic Tách Dòng (Main/Sub) ---
  const details = typeof item.ChiTietDichVu === 'string' 
      ? JSON.parse(item.ChiTietDichVu) 
      : (item.ChiTietDichVu || { main: {}, sub: [] });

  let rowsToRender = [];

  // 1. Dòng chính
  const mainData = {
      isMain: true,
      name: item.DanhMuc ? item.DanhMuc.split(" + ")[0] : "", 
      revenue: (details.main && details.main.revenue !== undefined) ? details.main.revenue : item.DoanhThuTruocChietKhau,
      discount: (details.main && details.main.discount !== undefined) ? details.main.discount : item.MucChietKhau,
  };
  rowsToRender.push(mainData);

  // 2. Dòng phụ
  if (details.sub && details.sub.length > 0) {
      details.sub.forEach(sub => {
          rowsToRender.push({
              isMain: false,
              name: sub.name,
              revenue: sub.revenue,
              discount: sub.discount
          });
      });
  } else {
      // Fallback
      const parts = (item.DanhMuc || "").split(" + ");
      if (parts.length > 1) {
          parts.slice(1).forEach(subName => {
              rowsToRender.push({
                  isMain: false,
                  name: subName,
                  revenue: 0, 
                  discount: 0
              });
          });
      }
  }
  
  const rowSpanCount = rowsToRender.length;
  
  // Tính tổng doanh thu sau chiết khấu của cả cụm (để hiển thị cột Tổng Doanh Thu Tích Luỹ)
  const totalRevenueAfterDiscount = rowsToRender.reduce((sum, row) => {
      const rev = Number(row.revenue) || 0;
      const disc = Number(row.discount) || 0;
      const discAmount = rev * (disc / 100);
      return sum + (rev - discAmount);
  }, 0);

  const mergedStyle = { verticalAlign: "middle", backgroundColor: "#fff", borderBottom: "1px solid #dee2e6" };

  return (
    <>
      {rowsToRender.map((row, idx) => {
        const isFirst = idx === 0;
        
        // Tính toán tài chính từng dòng
        const rev = Number(row.revenue) || 0;
        const disc = Number(row.discount) || 0;
        const discAmount = rev * (disc / 100);
        const after = rev - discAmount;

        return (
          <tr key={`${item.YeuCauID}_${idx}`} className="hover-bg-gray">
             {/* STT */}
             {isVisible("id") && isFirst && <td rowSpan={rowSpanCount} className={`text-center fw-semibold border-target ${getStickyClass("id")}`} style={mergedStyle}>{item.YeuCauID}</td>}
             
             {/* Khách hàng */}
             {isVisible("hoTen") && isFirst && <td rowSpan={rowSpanCount} className={`text-center fw-semibold ${getStickyClass("hoTen")}`} style={{...mergedStyle, minWidth: "120px"}}>{item.HoTen}</td>}
             
             {/* Thông tin liên hệ */}
             {isVisible("maVung") && isFirst && <td rowSpan={rowSpanCount} className={`text-center ${getStickyClass("maVung")}`} style={mergedStyle}>{item.MaVung}</td>}
             {isVisible("sdt") && isFirst && <td rowSpan={rowSpanCount} style={{ maxWidth: "150px", width: "110px", textAlign: "center", ...mergedStyle }} className={getStickyClass("sdt")}>{item.SoDienThoai}</td>}
             {isVisible("email") && isFirst && <td rowSpan={rowSpanCount} style={{ maxWidth: "162px",width: 100, ...mergedStyle }} className={`text-center text-truncate ${getStickyClass("email")}`} title={item.Email}>{item.Email}</td>}
             
             {/* Thông tin dịch vụ */}
             {isVisible("hinhThuc") && isFirst && <td rowSpan={rowSpanCount} className={`text-center border-target ${getStickyClass("hinhThuc")}`} style={mergedStyle}>{item.TenHinhThuc}</td>}
             {isVisible("coSo") && isFirst && <td rowSpan={rowSpanCount} className={`text-center border-target ${getStickyClass("coSo")}`} style={mergedStyle}>{translateBranch(item.CoSoTuVan)}</td>}
             
             {/* Loại dịch vụ (Gộp) */}
             {isVisible("loaiDichVu") && isFirst && (
                <td rowSpan={rowSpanCount} style={{ maxWidth: "150px", ...mergedStyle }} className={`text-center text-truncate ${getStickyClass("loaiDichVu")}`} title={translateService(item.LoaiDichVu, currentLanguage)}>
                    {translateService(item.LoaiDichVu, currentLanguage)}
                </td>
             )}

             {/* Tên dịch vụ (Gộp) */}
             {isVisible("tenDichVu") && isFirst && <td rowSpan={rowSpanCount} className={`text-center ${getStickyClass("tenDichVu")}`} style={mergedStyle}>{item.TenDichVu || ""}</td>}

             {/* DANH MỤC (KHÔNG GỘP - Render từng dòng) */}
             {isVisible("danhMuc") && (
                <td className={`text-start ${getStickyClass("danhMuc")}`} style={{ minWidth: "200px", verticalAlign: "middle", borderBottom: "1px solid #dee2e6" }}>
                    <div style={{ 
                        fontWeight: row.isMain ? "400" : "400", 
                        color: row.isMain ? "#000" : "#000",
                        paddingLeft: row.isMain ? "4px" : "4px",
                        whiteSpace: "normal"
                    }}>
                        {row.isMain ? "" : ""}{row.name}
                    </div>
                </td>
             )}

             {/* Mã hồ sơ */}
             {isVisible("maDichVu") && isFirst && <td rowSpan={rowSpanCount} style={{ width: "140px", ...mergedStyle }} className={`text-center border-target ${getStickyClass("maDichVu")}`}>{displayMaHoSo}</td>}

             {/* Người phụ trách */}
             {canViewAssignee && isVisible("nguoiPhuTrach") && isFirst && (
                <td rowSpan={rowSpanCount} style={{ width: "110px", maxWidth: "110px", ...mergedStyle }} className={`text-center text-truncate ${getStickyClass("nguoiPhuTrach")}`} title={item.NguoiPhuTrach?.name}>
                  {item.NguoiPhuTrach?.name || <span className="text-muted fst-italic"></span>}
                </td>
             )}

             {/* Thông tin khác */}
             {isVisible("ngayHen") && isFirst && <td rowSpan={rowSpanCount} className={`text-center ${getStickyClass("ngayHen")}`} style={mergedStyle}>{item.ChonNgay ? new Date(item.ChonNgay).toLocaleDateString("vi-VN") : ""}</td>}
             {isVisible("trangThai") && isFirst && <td rowSpan={rowSpanCount} className={`text-center ${getStickyClass("trangThai")}`} style={mergedStyle}>{item.TrangThai}</td>}
             {isVisible("goiDichVu") && isFirst && <td rowSpan={rowSpanCount} style={{width:100, ...mergedStyle}} className={`text-center ${getStickyClass("goiDichVu")}`}>{item.GoiDichVu || ""}</td>}
             
             {isVisible("invoice") && isFirst && (
                <td rowSpan={rowSpanCount} className={`text-center ${getStickyClass("invoice")}`} style={mergedStyle}>
                   {["Yes", "yes", "true", "1"].includes(String(item.Invoice)) ? <span className="text-success fw-bold">Có</span> : <span className="text-muted"></span>}
                </td>
             )}
             
             {canViewFinance && isVisible("invoiceUrl") && isFirst && (
                <td rowSpan={rowSpanCount} style={{ maxWidth: "120px", ...mergedStyle }} className={getStickyClass("invoiceUrl")}>
                  {item.InvoiceUrl ? <a href={item.InvoiceUrl} target="_blank" rel="noreferrer" className="text-decoration-none text-primary d-block text-truncate">Link</a> : "-"}
                </td>
             )}

             {isVisible("gio") && isFirst && (
                <td rowSpan={rowSpanCount} className={`text-center ${getStickyClass("gio")}`} style={mergedStyle}>
                  {item.Gio ? (item.Gio.includes("T") ? new Date(item.Gio).toLocaleTimeString("vi-VN", { hour12: false, hour: "2-digit", minute: "2-digit" }) : item.Gio.substring(0, 5)) : ""}
                </td>
             )}

             {isVisible("noiDung") && isFirst && (
                <td rowSpan={rowSpanCount} style={{ minWidth: "200px", maxWidth: "260px", ...mergedStyle }} className={`${getStickyClass("noiDung")}`}>
                   <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", textAlign: "left", overflowWrap: "anywhere", paddingLeft: "5px" }}>{item.NoiDung}</div>
                </td>
             )}

             {isVisible("ghiChu") && isFirst && (
                <td rowSpan={rowSpanCount} style={{ minWidth: "150px", maxWidth: "250px", ...mergedStyle }} className={`${getStickyClass("ghiChu")}`}>
                   <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", textAlign: "left", overflowWrap: "anywhere", paddingLeft: "5px" }}>{item.GhiChu}</div>
                </td>
             )}

             {isVisible("ngayTao") && isFirst && (
                <td rowSpan={rowSpanCount} className={`text-center text-nowrap border-target ${getStickyClass("ngayTao")}`} style={{fontSize: "0.8rem", ...mergedStyle}}>
                  {item.NgayTao && (
                    <>{new Date(item.NgayTao).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}<br />{new Date(item.NgayTao).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false })}</>
                  )}
                </td>
             )}

            {/* === CÁC CỘT TÀI CHÍNH === */}
            {canViewFinance && isVisible("doanhThuTruoc") && (
                <td className="text-center" style={{borderBottom: "1px solid #dee2e6"}}>{formatNumber(rev)}</td>
            )}
            {canViewFinance && isVisible("mucChietKhau") && (
                <td className="text-center" style={{borderBottom: "1px solid #dee2e6"}}>{disc}%</td>
            )}
            {canViewFinance && isVisible("soTienChietKhau") && (
                <td className="text-center" style={{borderBottom: "1px solid #dee2e6"}}>{formatNumber(discAmount)}</td>
            )}
            {canViewFinance && isVisible("doanhThuSau") && (
                <td className="text-center fw-bold text-primary" style={{borderBottom: "1px solid #dee2e6"}}>{formatNumber(after)}</td>
            )}
            
            {canViewFinance && isVisible("tongDoanhThuTichLuy") && isFirst && (
                <td rowSpan={rowSpanCount} className="text-center fw-bold text-success" style={mergedStyle}>
                    {formatNumber(totalRevenueAfterDiscount)}
                </td>
            )}

          </tr>
        );
      })}
    </>
  );
};

// --- 2. DashboardList Component ---
const DashboardList = ({
  subViewMode,
  setSubViewMode,
  data, 
  totalPages,   
  currentPage, 
  setCurrentPage, 
  emailList,
  setEmailList,
  currentLanguage,
  currentUser,
  searchTerm,
  setSearchTerm,
  tableContainerRef,
}) => {
  
  // ... (State và cấu hình cột giữ nguyên như cũ) ...
  const [filterService, setFilterService] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPackage, setFilterPackage] = useState("");
  const [allStaff, setAllStaff] = useState([]);
  
  const [b2bData, setB2bData] = useState([]);
  const [b2bLoading, setB2bLoading] = useState(false);
  const [b2bPage, setB2bPage] = useState(1);
  const [b2bTotal, setB2bTotal] = useState(0);

  const itemsPerPage = 20;

  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const filterMenuRef = useRef(null);

  const canViewFinance = currentUser?.is_accountant || currentUser?.is_director;
  const canViewAssignee = currentUser?.is_admin || currentUser?.is_director || currentUser?.is_accountant;

  const initialColumnKeys = [
    "id", "hoTen", "maVung", "sdt", "email", "hinhThuc", "coSo", "loaiDichVu", "tenDichVu", "danhMuc", "maDichVu",
    ...(canViewAssignee ? ["nguoiPhuTrach"] : []),
    "ngayHen", "trangThai", "goiDichVu", "invoice",
    ...(canViewFinance ? ["invoiceUrl"] : []),
    "gio", "noiDung", "ghiChu", "ngayTao",
    ...(canViewFinance ? ["doanhThuTruoc", "mucChietKhau", "soTienChietKhau", "doanhThuSau", "tongDoanhThuTichLuy"] : [])
  ];

  const columnLabels = {
    vi: {
      id: "STT", hoTen: "Khách hàng", maVung: "Mã vùng", sdt: "Số Điện Thoại", 
      email: "Email", hinhThuc: "Hình thức", coSo: "Cơ sở", loaiDichVu: "Loại Dịch Vụ",
      tenDichVu: "Tên Dịch Vụ", danhMuc: "Danh Mục", maDichVu: "Mã Dịch Vụ",
      nguoiPhuTrach: "Người phụ trách", ngayHen: "Ngày hẹn", trangThai: "Trạng thái",
      goiDichVu: "Gói Dịch Vụ", invoice: "Invoice Y/N", invoiceUrl: "Invoice",
      gio: "Giờ", noiDung: "Nội dung", ghiChu: "Ghi chú", ngayTao: "Ngày tạo",
      doanhThuTruoc: "Doanh Thu Trước CK", mucChietKhau: "% CK", soTienChietKhau: "Tiền Chiết Khấu",
      doanhThuSau: "Doanh Thu Sau CK", tongDoanhThuTichLuy: "Tổng Doanh Thu Sau CK"
    },
    en: {
      id: "No.", hoTen: "Customer", maVung: "Region Code", sdt: "Phone", 
      email: "Email", hinhThuc: "Method", coSo: "Branch", loaiDichVu: "Service Type",
      tenDichVu: "Service Name", danhMuc: "Category", maDichVu: "Service Code",
      nguoiPhuTrach: "Assignee", ngayHen: "Appointment Date", trangThai: "Status",
      goiDichVu: "Package", invoice: "Invoice Y/N", invoiceUrl: "Invoice",
      gio: "Time", noiDung: "Content", ghiChu: "Notes", ngayTao: "Created Date",
      doanhThuTruoc: "Revenue Before Discount", mucChietKhau: "Discount %", soTienChietKhau: "Discount Amount",
      doanhThuSau: "Revenue After Discount", tongDoanhThuTichLuy: "Total Revenue After Discount"
    },
    ko: {
      id: "번호", hoTen: "고객", maVung: "지역코드", sdt: "전화", 
      email: "이메일", hinhThuc: "방법", coSo: "지점", loaiDichVu: "서비스 유형",
      tenDichVu: "서비스명", danhMuc: "카테고리", maDichVu: "서비스 코드",
      nguoiPhuTrach: "담당자", ngayHen: "약속일", trangThai: "상태",
      goiDichVu: "패키지", invoice: "송장 Y/N", invoiceUrl: "송장",
      gio: "시간", noiDung: "내용", ghiChu: "메모", ngayTao: "생성일",
      doanhThuTruoc: "할인 전 매출", mucChietKhau: "할인 %", soTienChietKhau: "할인액",
      doanhThuSau: "할인 후 매출", tongDoanhThuTichLuy: "누적 할인 후 매출"
    }
  };

  const getColumnLabel = (key) => {
    return columnLabels[currentLanguage]?.[key] || columnLabels.vi[key] || key;
  };

  const visibleColumnLabels = columnLabels[currentLanguage] || columnLabels.vi;
  const columnOptions = [
    { key: "id", label: getColumnLabel("id") },
    { key: "hoTen", label: getColumnLabel("hoTen") },
    { key: "maVung", label: getColumnLabel("maVung") },
    { key: "sdt", label: getColumnLabel("sdt") },
    { key: "email", label: getColumnLabel("email") },
    { key: "hinhThuc", label: getColumnLabel("hinhThuc") },
    { key: "coSo", label: getColumnLabel("coSo") },
    { key: "loaiDichVu", label: getColumnLabel("loaiDichVu") },
    { key: "tenDichVu", label: getColumnLabel("tenDichVu") },
    { key: "danhMuc", label: getColumnLabel("danhMuc") },
    { key: "maDichVu", label: getColumnLabel("maDichVu") },
    ...(canViewAssignee ? [{ key: "nguoiPhuTrach", label: getColumnLabel("nguoiPhuTrach") }] : []),
    { key: "ngayHen", label: getColumnLabel("ngayHen") },
    { key: "trangThai", label: getColumnLabel("trangThai") },
    { key: "goiDichVu", label: getColumnLabel("goiDichVu") },
    { key: "invoice", label: getColumnLabel("invoice") },
    ...(canViewFinance ? [{ key: "invoiceUrl", label: getColumnLabel("invoiceUrl") }] : []),
    { key: "gio", label: getColumnLabel("gio") },
    { key: "noiDung", label: getColumnLabel("noiDung") },
    { key: "ghiChu", label: getColumnLabel("ghiChu") },
    { key: "ngayTao", label: getColumnLabel("ngayTao") },
    ...(canViewFinance ? [
      { key: "doanhThuTruoc", label: getColumnLabel("doanhThuTruoc") },
      { key: "mucChietKhau", label: getColumnLabel("mucChietKhau") },
      { key: "soTienChietKhau", label: getColumnLabel("soTienChietKhau") },
      { key: "doanhThuSau", label: getColumnLabel("doanhThuSau") },
      { key: "tongDoanhThuTichLuy", label: getColumnLabel("tongDoanhThuTichLuy") },
    ] : [])
  ];

  const tableHeaders = useMemo(() => [
    getColumnLabel("id"), getColumnLabel("hoTen"), getColumnLabel("maVung"), getColumnLabel("sdt"), getColumnLabel("email"), 
    getColumnLabel("hinhThuc"), getColumnLabel("coSo"), getColumnLabel("loaiDichVu"), getColumnLabel("tenDichVu"), getColumnLabel("danhMuc"), getColumnLabel("maDichVu"),
    ...(canViewAssignee ? [getColumnLabel("nguoiPhuTrach")] : []),
    getColumnLabel("ngayHen"), getColumnLabel("trangThai"), getColumnLabel("goiDichVu"), getColumnLabel("invoice"),
    ...(canViewFinance ? [getColumnLabel("invoiceUrl")] : []),
    getColumnLabel("gio"), getColumnLabel("noiDung"), getColumnLabel("ghiChu"), getColumnLabel("ngayTao"),

    ...(canViewFinance ? [
       <div key="dt" className="d-flex flex-column align-items-center"><span>{getColumnLabel("doanhThuTruoc")}</span></div>,
       getColumnLabel("mucChietKhau"),
       <div key="tck" className="d-flex flex-column align-items-center"><span>{getColumnLabel("soTienChietKhau")}</span></div>,
       <div key="dts" className="d-flex flex-column align-items-center"><span>{getColumnLabel("doanhThuSau")}</span></div>,
       <div key="tdttl" className="d-flex flex-column align-items-center"><span>{getColumnLabel("tongDoanhThuTichLuy")}</span></div>
    ] : []),
  ], [currentLanguage, canViewAssignee, canViewFinance]);

  const [visibleColumns, setVisibleColumns] = useState(() => {
    const initial = {};
      initialColumnKeys.forEach(col => initial[col] = true);
    return initial;
  });

  const [pinnedColumns, setPinnedColumns] = useState([]);
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const columnMenuRef = useRef(null);

  const isVisible = (key) => visibleColumns[key];
  const isPinned = (key) => pinnedColumns.includes(key);

  // ... (Các useEffect và function khác giữ nguyên) ...
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await authenticatedFetch("https://onepasscms-backend-tvdy.onrender.com/api/User");
        const json = await res.json();
        if (json.success) setAllStaff(json.data);
      } catch (err) { console.error(err); }
    };
    if (canViewAssignee) fetchStaff();
  }, [canViewAssignee]);

  const fetchB2BData = async (page = 1) => {
    setB2bLoading(true);
    try {
        const res = await authenticatedFetch(`https://onepasscms-backend-tvdy.onrender.com/api/b2b/services?page=${page}&limit=${itemsPerPage}`);
        const json = await res.json();
        if (json.success) {
            setB2bData(json.data || []);
            setB2bTotal(json.total || 0);
        }
    } catch (e) {
        console.error("B2B Fetch Error", e);
    } finally {
        setB2bLoading(false);
    }
  };

  useEffect(() => {
    if (subViewMode === "b2b") {
        fetchB2BData(b2bPage);
    }
  }, [subViewMode, b2bPage]);
  
  // ... (Xử lý cột, export, filter - giữ nguyên) ...
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (columnMenuRef.current && !columnMenuRef.current.contains(event.target)) {
        setShowColumnMenu(false);
      }
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target)) {
        setShowFilterMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleColumn = (key) => {
    setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const togglePinColumn = (key) => {
    setPinnedColumns(prev => {
      if (prev.includes(key)) { return prev.filter(col => col !== key); } 
      else { return [...prev, key]; }
    });
  };

  const SERVICE_OPTIONS = ["Chứng thực", "Kết hôn", "Khai sinh, khai tử", "Xuất nhập cảnh", "Giấy tờ tuỳ thân", "Nhận nuôi", "Thị thực", "Tư vấn pháp lý", "Dịch vụ B2B", "Khác"];
  const STATUS_OPTIONS = ["Tư vấn", "Đang xử lý", "Đang nộp hồ sơ", "Hoàn thành"];
  const PACKAGE_OPTIONS = ["Thông thường", "Cấp tốc"];

  const filteredData = useMemo(() => {
    console.log("🔍 DashboardList - Raw data:", data);
    console.log("🔍 DashboardList - Data length:", data?.length);
    
    if (!data || !Array.isArray(data)) {
      console.warn("⚠️ DashboardList - Data is not an array or is undefined");
      return [];
    }
    
    return data.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      const matchSearch = 
        (item.HoTen || "").toLowerCase().includes(searchLower) ||
        (item.Email || "").toLowerCase().includes(searchLower) ||
        (item.SoDienThoai || "").toLowerCase().includes(searchLower) ||
        (item.MaHoSo || "").toLowerCase().includes(searchLower);

      if (!matchSearch) return false;
      if (filterService && translateService(item.LoaiDichVu, currentLanguage) !== filterService) return false;
      if (filterAssignee && item.NguoiPhuTrach?.name !== filterAssignee) return false;
      if (filterStatus && item.TrangThai !== filterStatus) return false;
      if (filterPackage && item.GoiDichVu !== filterPackage) return false;

      return true;
    });
  }, [data, searchTerm, filterService, filterAssignee, filterStatus, filterPackage, currentLanguage]);

  const currentTableRows = filteredData; 

  console.log("📊 DashboardList - currentTableRows:", currentTableRows);
  console.log("📊 DashboardList - currentTableRows length:", currentTableRows?.length);

  const handleExportExcel = () => {
    const ok = exportRequestsToExcel(filteredData, currentLanguage);
    if (!ok) showToast("Không có dữ liệu để xuất", "warning");
  };

  const hasActiveFilters = filterService || filterAssignee || filterStatus || filterPackage;


  // --- RENDER B2B TABLE (ĐÃ CHỈNH SỬA STT GỘP) ---
  const renderB2BTable = () => {
     const sortedB2BData = [...b2bData].sort((a, b) => {
        const compA = String(a.DoanhNghiepID || "");
        const compB = String(b.DoanhNghiepID || "");
        if (compA !== "" && compB === "") return -1;
        if (compA === "" && compB !== "") return 1;
        if (compA !== "" && compB !== "") return compA.localeCompare(compB);
        return (a.ID || 0) - (b.ID || 0);
    });

    const getSubRowCount = (danhMucStr) => {
        if (!danhMucStr) return 1;
        return danhMucStr.split(" + ").length;
    };

    const b2bTotalPages = Math.ceil(b2bTotal / 50) || 1; 
    const b2bHeaderStyle = { backgroundColor: "#1e3a8a", color: "#fff", textAlign: "center", verticalAlign: "middle", whiteSpace: "pre-wrap" };
    
    // --- [MỚI] Biến đếm số thứ tự Doanh nghiệp ---
    let companySttCounter = 0;

    return (
        <div>
             <div className="table-responsive shadow-sm rounded">
                <table className="table table-bordered table-sm mb-0 align-middle" style={{ fontSize: "12px", borderCollapse: "collapse", tableLayout: "fixed" }}>
                   <thead className="text-white text-center align-middle" style={{ backgroundColor: "#1e3a8a" }}>
                    <tr>
                        <th className="py-2 border" style={{ width: "40px", ...b2bHeaderStyle }}>
                          {currentLanguage === "vi" ? "STT" : currentLanguage === "ko" ? "번호" : "No."}
                        </th>
                        <th className="py-2 border" style={{ width: "120px", ...b2bHeaderStyle }}>
                          {currentLanguage === "vi" ? "Doanh Nghiệp" : currentLanguage === "ko" ? "기업" : "Company"}
                        </th>
                        <th className="py-2 border" style={{ width: "90px", ...b2bHeaderStyle }}>
                          {currentLanguage === "vi" ? "Số ĐKKD" : currentLanguage === "ko" ? "사업자등록번호" : "Business No."}
                        </th>
                        <th className="py-2 border" style={{ width: "100px", ...b2bHeaderStyle }}>
                          {currentLanguage === "vi" ? "Loại dịch vụ" : currentLanguage === "ko" ? "서비스 유형" : "Service Type"}
                        </th>
                        <th className="py-2 border" style={{ width: "140px", ...b2bHeaderStyle }}>
                          {currentLanguage === "vi" ? "Tên dịch vụ" : currentLanguage === "ko" ? "서비스명" : "Service Name"}
                        </th>
                        <th className="py-2 border" style={{ width: "180px", ...b2bHeaderStyle }}>
                          {currentLanguage === "vi" ? "Danh mục" : currentLanguage === "ko" ? "카테고리" : "Category"}
                        </th>
                        <th className="py-2 border" style={{ width: "160px", ...b2bHeaderStyle }}>
                          {currentLanguage === "vi" ? "Mã Dịch Vụ" : currentLanguage === "ko" ? "서비스 코드" : "Service Code"}
                        </th>
                        <th className="py-2 border" style={{ width: "110px", ...b2bHeaderStyle }}>
                          {currentLanguage === "vi" ? "Người Phụ Trách" : currentLanguage === "ko" ? "담당자" : "Assignee"}
                        </th>
                        <th className="py-2 border" style={{ width: "90px", ...b2bHeaderStyle }}>
                          {currentLanguage === "vi" ? "Ngày Bắt Đầu" : currentLanguage === "ko" ? "시작 날짜" : "Start Date"}
                        </th>
                        <th className="py-2 border" style={{ width: "90px", ...b2bHeaderStyle }}>
                          {currentLanguage === "vi" ? "Ngày Kết Thúc" : currentLanguage === "ko" ? "종료 날짜" : "End Date"}
                        </th>
                        <th className="py-2 border" style={{ width: "100px", ...b2bHeaderStyle }}>
                          {currentLanguage === "vi" ? "Gói" : currentLanguage === "ko" ? "패키지" : "Package"}
                        </th>
                       
                    </tr>
                   </thead>
                   <tbody>
                      {b2bLoading ? (
                           <tr><td colSpan="13" className="text-center py-4">
                             {currentLanguage === "vi" ? "Đang tải dữ liệu..." : currentLanguage === "ko" ? "데이터 로드 중..." : "Loading data..."}
                           </td></tr>
                      ) : sortedB2BData.length > 0 ? (
                        sortedB2BData.map((rec, idx) => {
                            const servicesList = (rec.DanhMuc || "").split(" + ");
                            const subRowsCount = servicesList.length;

                            const currentCompanyId = String(rec.DoanhNghiepID || "");
                            const prevCompanyId = idx > 0 ? String(sortedB2BData[idx - 1].DoanhNghiepID || "") : null;

                            let shouldRenderCompanyCell = false;
                            let companyRowSpan = 0;

                            if (!currentCompanyId || currentCompanyId !== prevCompanyId) {
                                shouldRenderCompanyCell = true;
                                // --- [MỚI] Tăng biến đếm khi gặp doanh nghiệp mới ---
                                companySttCounter++;

                                for (let i = idx; i < sortedB2BData.length; i++) {
                                    const nextRec = sortedB2BData[i];
                                    if (String(nextRec.DoanhNghiepID || "") !== currentCompanyId) break;
                                    companyRowSpan += getSubRowCount(nextRec.DanhMuc);
                                }
                            }
                            
                            // --- [MỚI] Tính STT hiển thị cho doanh nghiệp ---
                            // Offset theo trang (giả sử mỗi trang 50 item dịch vụ, STT này tương đối)
                            const displayCompanyIndex = companySttCounter + (b2bPage - 1) * 50;

                            const mergedStyle = { backgroundColor: "#fff", verticalAlign: "middle", padding: "4px", fontSize: "12px", textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
                            const danhMucStyle = { backgroundColor: "white", verticalAlign: "middle", padding: "4px 8px", fontSize: "12px", textAlign: "left" };

                            return servicesList.map((svcName, subIdx) => {
                                const isFirstSubRow = subIdx === 0;
                                return (
                                    <tr key={`${rec.ID}_${subIdx}`} className="bg-white hover:bg-gray-50">
                                        
                                        {/* --- [MỚI] GỘP CỘT STT VÀO NHÓM DOANH NGHIỆP --- */}
                                        {isFirstSubRow && shouldRenderCompanyCell && (
                                            <>
                                                <td className="border" rowSpan={companyRowSpan} style={{...mergedStyle, verticalAlign: "middle", padding: "2px 4px", position: "relative",zIndex: 1, backgroundClip: "padding-box"}}>
                                                    {displayCompanyIndex}
                                                </td>
                                                <td className="border" rowSpan={companyRowSpan} style={{...mergedStyle, maxWidth: "120px",  verticalAlign: "middle", padding: "2px 4px", position: "relative",zIndex: 1, backgroundClip: "padding-box"}} title={rec.TenDoanhNghiep}>
                                                    {rec.TenDoanhNghiep || ""}
                                                </td>
                                                <td className="border" rowSpan={companyRowSpan} style={{...mergedStyle, verticalAlign: "middle", padding: "2px 4px", position: "relative",zIndex: 1, backgroundClip: "padding-box"}}>
                                                    {rec.SoDKKD || ""}
                                                </td>
                                            </>
                                        )}
                                        {/* ----------------------------------------------- */}

                                        {isFirstSubRow && (
                                            <>
                                                <td className="border" rowSpan={subRowsCount} style={{...mergedStyle, maxWidth: "100px"}} title={rec.LoaiDichVu}>{rec.LoaiDichVu}</td>
                                                <td className="border" rowSpan={subRowsCount} style={{...mergedStyle, maxWidth: "140px"}} title={rec.TenDichVu}>{rec.TenDichVu}</td>
                                            </>
                                        )}
                                        <td className="border" style={danhMucStyle}><div className="px-1" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{svcName}</div></td>
                                        {isFirstSubRow && (
                                            <>
                                                <td className="border" rowSpan={subRowsCount} style={mergedStyle}><span className="fw-bold text-dark">{rec.MaDichVu}</span></td>
                                                <td className="border" rowSpan={subRowsCount} style={{...mergedStyle, maxWidth: "110px"}} title={rec.NguoiPhuTrach?.name}>{rec.NguoiPhuTrach?.name || ""}</td>
                                                <td className="border" rowSpan={subRowsCount} style={mergedStyle}>{rec.NgayThucHien ? rec.NgayThucHien.split("T")[0] : ""}</td>
                                                <td className="border" rowSpan={subRowsCount} style={mergedStyle}>{rec.NgayHoanThanh ? rec.NgayHoanThanh.split("T")[0] : ""}</td>
                                                <td className="border" rowSpan={subRowsCount} style={mergedStyle}>{rec.GoiDichVu}</td>

                                            </>
                                        )}
                                    </tr>
                                );
                            });
                        })
                      ) : ( <tr><td colSpan="13" className="text-center py-4">Chưa có dữ liệu</td></tr> )}
                   </tbody>
                </table>
             </div>
             
             {/* Pagination Logic (Giữ nguyên) */}
             <div className="d-flex justify-content-between align-items-center px-3 py-2 border-top bg-white" style={{ marginTop: "0", borderTop: "1px solid #dee2e6" }}>
                  <div className="text-muted small">
                    {currentLanguage === "vi" ? `Hiển thị ${sortedB2BData.length} / ${b2bTotal} hàng` : currentLanguage === "ko" ? `${sortedB2BData.length} / ${b2bTotal}행 표시` : `Showing ${sortedB2BData.length} / ${b2bTotal} rows`}
                  </div>
                  <div className="d-flex justify-content-center align-items-center">
                    <nav>
                      <ul className="pagination pagination-sm mb-0 shadow-sm">
                        <li className={`page-item ${b2bPage === 1 ? "disabled" : ""}`}>
                          <button className="page-link" onClick={() => { if (b2bPage > 1) setB2bPage((p) => p - 1); }}>&laquo;</button>
                        </li>
                         <li className={`page-item active`}><button className="page-link">{b2bPage}</button></li>
                        <li className={`page-item ${b2bPage === b2bTotalPages ? "disabled" : ""}`}>
                          <button className="page-link" onClick={() => { if (b2bPage < b2bTotalPages) setB2bPage((p) => p + 1); }}>&raquo;</button>
                        </li>
                      </ul>
                    </nav>
                  </div>
            </div>
        </div>
    );
  };

  return (
   <div className="mb-4">
      <div className="d-flex border-bottom mb-3" style={{ gap: "1.5rem", fontSize: "15px", fontWeight: 500 }}>
        {[
          { key: "request", labelVi: "Danh sách dịch vụ", labelEn: "Service List", labelKo: "서비스 목록" },
          { key: "b2b", labelVi: "Danh sách B2B", labelEn: "B2B List", labelKo: "B2B 목록" },
          { key: "email", labelVi: "Danh sách email", labelEn: "Email List", labelKo: "이메일 목록" },
        ].map((tab) => (
          <div key={tab.key} onClick={() => setSubViewMode(tab.key)}
            style={{
              cursor: "pointer", paddingBottom: "6px",
              borderBottom: subViewMode === tab.key ? "2px solid #2563eb" : "2px solid transparent",
              color: subViewMode === tab.key ? "#2563eb" : "#6b7280",
              fontWeight: subViewMode === tab.key ? "600" : "500", transition: "all 0.2s ease",
            }}
          >
            {currentLanguage === "vi" ? tab.labelVi : currentLanguage === "ko" ? tab.labelKo : tab.labelEn}
          </div>
        ))}
      </div>

      {subViewMode === "request" && (
        <>
          <div className="d-flex justify-content-between align-items-center mt-3 mb-3">
             <div className="d-flex align-items-center gap-3">
                <input type="text" className="form-control shadow-sm"
                    placeholder={currentLanguage === "vi" ? "Tìm kiếm..." : currentLanguage === "ko" ? "검색..." : "Search..."}
                    style={{ width: 250, borderRadius: "20px", fontSize: "14px" }}
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>

             <div className="d-flex align-items-center gap-2">
                <button onClick={handleExportExcel}
                    style={{
                        background: "#16a34a", color: "white", border: "none", borderRadius: "8px",
                        padding: "8px 12px", cursor: "pointer", fontWeight: 500, display: "flex",
                        alignItems: "center", gap: "6px", height: "40px"
                    }}
                >
                    <i className="bi bi-file-earmark-excel"></i>
                    {currentLanguage === "vi" ? "Tải danh sách dịch vụ" : currentLanguage === "ko" ? "서비스 목록 다운로드" : "Download Service List"}
                </button>

                <div className="position-relative" ref={columnMenuRef}>
                    <button className="btn btn-light border shadow-sm d-flex align-items-center justify-content-center"
                        style={{ width: 40, height: 40, borderRadius: "8px", backgroundColor: "#fff" }}
                        onClick={() => setShowColumnMenu(!showColumnMenu)} title={currentLanguage === "vi" ? "Ẩn/Hiện cột" : currentLanguage === "ko" ? "열 숨기기/표시" : "Toggle Columns"}
                    >
                        <LayoutGrid size={20} color="#4b5563" />
                    </button>
                    {showColumnMenu && (
                        <div className="position-absolute bg-white shadow rounded border p-2"
                            style={{ top: "100%", right: 0, zIndex: 1000, width: "280px", maxHeight: "400px", overflowY: "auto" }}
                        >
                            <div className="fw-bold mb-2 px-1" style={{fontSize: '14px'}}>{currentLanguage === "vi" ? "Cấu hình cột:" : currentLanguage === "ko" ? "열 설정:" : "Column Config:"}</div>
                            {initialColumnKeys.map((col) => {
                                if (col.key === "nguoiPhuTrach" && !canViewAssignee) return null;
                                return (
                                    <div key={col.key} className="form-check px-1 py-1 m-1">
                                        <input className="form-check-input" type="checkbox" id={`col-${col.key}`}
                                            checked={visibleColumns[col.key]} onChange={() => toggleColumn(col.key)} style={{ cursor: "pointer" }}
                                        />
                                        <label className="form-check-label ms-2" htmlFor={`col-${col.key}`} style={{ cursor: "pointer", fontSize: "13px" }}>{col.label}</label>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
             </div>
          </div>

          <div className="d-flex align-items-center gap-3 mb-3 flex-wrap">
              {/* FILTER BUTTONS (Giữ nguyên như cũ) */}
             <div className="position-relative" ref={filterMenuRef}>
                <button className={`btn d-flex align-items-center gap-2 shadow-sm ${hasActiveFilters ? "btn-primary" : "btn-white border"}`}
                    onClick={() => setShowFilterMenu(!showFilterMenu)} style={{ height: "40px", borderRadius: "8px", fontWeight: 500 }}
                >
                    <Filter size={16} />
                </button>
                {showFilterMenu && (
                    <div className="dropdown-menu show shadow-lg border-0 p-0 rounded-3 mt-1" 
                         style={{ position: "absolute", zIndex: 1050, minWidth: "220px", overflow: "visible" }}>
                        <div className="dropdown-group position-relative border-bottom">
                            <div className="dropdown-item d-flex justify-content-between align-items-center py-2 px-3 fw-medium" style={{cursor:"pointer", fontSize:"14px"}}>
                                <span>{currentLanguage === "vi" ? "Loại dịch vụ" : currentLanguage === "ko" ? "서비스 유형" : "Service Type"}</span>
                                <ChevronRight size={14} className="text-muted"/>
                            </div>
                            <div className="submenu shadow-lg rounded-3 border bg-white py-1">
                                {SERVICE_OPTIONS.map((opt) => (
                                    <div key={opt} className="submenu-item px-3 py-2 d-flex justify-content-between align-items-center"
                                         onClick={() => { setFilterService(opt); setShowFilterMenu(false); }}>
                                        {opt}
                                        {filterService === opt && <Check size={14} className="text-primary"/>}
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* Các filter khác tương tự... */}
                         <div className="dropdown-group position-relative border-bottom">
                            <div className="dropdown-item d-flex justify-content-between align-items-center py-2 px-3 fw-medium" style={{cursor:"pointer", fontSize:"14px"}}>
                                <span>{currentLanguage === "vi" ? "Trạng thái" : currentLanguage === "ko" ? "상태" : "Status"}</span>
                                <ChevronRight size={14} className="text-muted"/>
                            </div>
                            <div className="submenu shadow-lg rounded-3 border bg-white py-1">
                                {STATUS_OPTIONS.map((opt) => (
                                    <div key={opt} className="submenu-item px-3 py-2 d-flex justify-content-between align-items-center"
                                         onClick={() => { setFilterStatus(opt); setShowFilterMenu(false); }}>
                                        {opt}
                                        {filterStatus === opt && <Check size={14} className="text-primary"/>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {filterService && <div className="badge bg-light text-dark border px-2 py-2 d-flex align-items-center gap-2"><span className="text-muted small">DV:</span> {filterService} <X size={14} className="cursor-pointer text-danger" onClick={() => setFilterService("")}/></div>}
            {filterStatus && <div className="badge bg-light text-dark border px-2 py-2 d-flex align-items-center gap-2"><span className="text-muted small">TT:</span> {filterStatus} <X size={14} className="cursor-pointer text-danger" onClick={() => setFilterStatus("")}/></div>}
          </div>

          <div className="table-wrapper mt-3">
            <div className="table-responsive" style={{ paddingLeft: "0px", maxHeight: "calc(100vh - 350px)", overflow: "auto" }} ref={tableContainerRef}>
              <table className="table table-bordered align-middle mb-0">
                <thead>
                  <tr>
                    {tableHeaders.map((header, i) => {
                        const availableKeys = initialColumnKeys.filter(k => {
                            if (k.key === 'nguoiPhuTrach' && !canViewAssignee) return false;
                            if (k.key === 'invoiceUrl' && !canViewFinance) return false;
                            // Check finance cols
                            const financeKeys = ['doanhThuTruoc','mucChietKhau','soTienChietKhau','doanhThuSau','tongDoanhThuTichLuy'];
                            if (financeKeys.includes(k.key) && !canViewFinance) return false;

                            return true;
                        });
                        const currentKey = availableKeys[i]?.key;
                        const allowedPinKeys = ["id", "hoTen", "maVung", "sdt", "email"];

                        if (currentKey && !isVisible(currentKey)) return null;

                       return (
                        <th key={i} className={isPinned(currentKey) ? "sticky-col" : ""}
                            style={{ 
                                position: "sticky", 
                                top: 0, 
                                left: isPinned(currentKey) ? "0" : "auto", 
                                zIndex: isPinned(currentKey) ? 20 : 10, 
                                backgroundColor: "#2c4d9e",
                                color: "#ffffff",
                                borderRight: "1px solid #4a6fdc", 
                                textAlign: "center",
                                verticalAlign: "middle",
                                whiteSpace: "nowrap"
                            }}
                        >
                             <div className="d-flex justify-content-center align-items-center position-relative w-100" style={{ minHeight: "24px", paddingRight: allowedPinKeys.includes(currentKey) ? "24px" : "0" }}>
                              <span>{header}</span>
                              {allowedPinKeys.includes(currentKey) && (
                              <button 
                                className={`btn btn-sm d-flex align-items-center justify-content-center text-white ${isPinned(currentKey) ? "btn-danger" : ""}`} 
                                style={{ width: 24, height: 24, padding: 0, borderRadius: "3px", position: "absolute", right: "0px", top: "50%", transform: "translateY(-50%)", opacity: isPinned(currentKey) ? 1 : 0.5 }} 
                                onClick={() => togglePinColumn(currentKey)}
                              >
                              {isPinned(currentKey) ? (<PinOff size={12} color="#ffffff" />) : (<Pin size={12} color="#ffffff" />)}
                              </button>
                              )}
                            </div>
                        </th>
                       );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {currentTableRows.length > 0 ? (
                    currentTableRows.map((item) => (
                      <B2CRequestRow
                        key={item.YeuCauID}
                        item={item}
                        visibleColumns={visibleColumns}
                        pinnedColumns={pinnedColumns}
                        currentLanguage={currentLanguage}
                        currentUser={currentUser}
                      />
                    ))
                  ) : (
                    <tr>
                      <td colSpan={tableHeaders.length} className="text-center py-4 text-muted">
                        {currentLanguage === "vi" ? "Không có dữ liệu phù hợp" : currentLanguage === "ko" ? "일치하는 데이터가 없습니다" : "No matching data found"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* === PHẦN CHÂN TRANG (PAGINATION) === */}
            <div className="d-flex justify-content-between align-items-center px-3 py-2 border-top bg-white" style={{ marginTop: "0", borderTop: "1px solid #dee2e6" }}>
              
              {/* Góc trái - Hiển thị chi tiết */}
              <div className="text-muted small">
                 {currentLanguage === "vi" 
                    ? `Hiển thị ${currentTableRows.length} / ${itemsPerPage} hàng (trang ${currentPage}/${totalPages})` 
                    : currentLanguage === "ko"
                    ? `${currentTableRows.length} / ${itemsPerPage} 행 표시 (페이지 ${currentPage}/${totalPages})`
                    : `Showing ${currentTableRows.length} / ${itemsPerPage} rows (page ${currentPage}/${totalPages})`}
              </div>

              {/* Góc phải - Phân trang + Text trang */}
              <div className="d-flex justify-content-center align-items-center">
                <nav>
                  <ul className="pagination pagination-sm mb-0 shadow-sm">
                    <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                      <button className="page-link" onClick={() => { if (currentPage > 1) setCurrentPage((p) => p - 1); }}>&laquo;</button>
                    </li>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1))
                      .map((p, idx, arr) => (
                        <React.Fragment key={p}>
                          {idx > 0 && arr[idx - 1] !== p - 1 && (<li className="page-item disabled"><span className="page-link">…</span></li>)}
                          <li className={`page-item ${currentPage === p ? "active" : ""}`}>
                            <button className="page-link" onClick={() => { if (p !== currentPage) setCurrentPage(p); }}>{p}</button>
                          </li>
                        </React.Fragment>
                      ))}
                    <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                      <button className="page-link" onClick={() => { if (currentPage < totalPages) setCurrentPage((p) => p + 1); }}>&raquo;</button>
                    </li>
                  </ul>
                </nav>
                
                <div className="ms-3 text-muted small">
                  {currentLanguage === "vi" ? `Trang ${currentPage}/${totalPages}` : currentLanguage === "ko" ? `페이지 ${currentPage}/${totalPages}` : `Page ${currentPage}/${totalPages}`}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* --- TAB B2B (RENDER TABLE GIỐNG B2B Page) --- */}
      {subViewMode === "b2b" && renderB2BTable()}

      {subViewMode === "email" && (
        <EmailList
          emailList={emailList}
          setEmailList={setEmailList}
          currentLanguage={currentLanguage}
          tableContainerRef={tableContainerRef}
        />
      )}
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }
        .table-bordered { border: 1px solid #dee2e6 !important; }
        .table-bordered th, .table-bordered td { border: 1px solid #dee2e6 !important; }
       
        
        td.sticky-col { 
            position: sticky !important; 
            left: 0; 
            z-index: 5 !important; 
            background-color: #ffffff !important; 
            border-right: 2px solid #2563eb !important; 
        }
        
        .table-responsive { scroll-behavior: smooth; }

        .dropdown-group:hover {
            background-color: #f8f9fa;
        }
        
        .submenu {
            display: none;
            position: absolute;
            left: 100%;
            top: 0;
            min-width: 200px;
            z-index: 1055;
        }

        .dropdown-group:hover .submenu {
            display: block;
        }

        .submenu-item {
            cursor: pointer;
            font-size: 13px;
            transition: all 0.2s;
        }
        .submenu-item:hover {
            background-color: #EFF6FF;
            color: #2563eb;
        }
      `}</style>
    </div>
  );
};

export default DashboardList;