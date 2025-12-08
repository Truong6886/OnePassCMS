import React, { useState, useEffect, useRef, useMemo } from "react";
import { showToast } from "../../utils/toast";
import "../../styles/DashboardList.css";
import EmailList from "./EmailList";
import { LayoutGrid, Pin, PinOff, Filter, ChevronRight, Check, X } from "lucide-react"; 
import { exportRequestsToExcel } from "../../utils/exportExcel";

// --- 1. ReadOnlyRow Component (Đã bỏ cột tài chính) ---
const ReadOnlyRow = ({ item, visibleColumns, pinnedColumns, currentUser, currentLanguage }) => {
  const isVisible = (key) => (visibleColumns ? visibleColumns[key] : true);
  const isPinned = (key) => pinnedColumns.includes(key);
  
  const canViewFinance = currentUser?.is_accountant || currentUser?.is_director;
  const canViewAssignee = currentUser?.is_admin || currentUser?.is_director || currentUser?.is_accountant;

  const translateService = (serviceName) => {
    const map = {
      "인증 센터": "Chứng thực", "결혼 이민": "Kết hôn",
      "출생신고 대행": "Khai sinh, khai tử", "출입국 행정 대행": "Xuất nhập cảnh",
      "신분증명 서류 대행": "Giấy tờ tuỳ thân", "입양 절차 대행": "Nhận nuôi",
      "비자 대행": "Thị thực", "법률 컨설팅": "Tư vấn pháp lý",
      "B2B 서비스": "Dịch vụ B2B", "기타": "Khác",
    };
    return map[serviceName] || serviceName;
  };

  const translateBranch = (branch) => {
    const map = { "서울": "Seoul", "부산": "Busan" };
    return map[branch] || branch || "";
  };

  const displayMaHoSo = item.MaHoSo && item.MaHoSo.length > 5 ? item.MaHoSo : "";

  return (
    <tr>
      {isVisible("id") && <td className={`text-center fw-semibold border-target ${isPinned("id") ? "sticky-col" : ""}`}>{item.YeuCauID}</td>}
      {isVisible("hoTen") && <td className={`text-center fw-semibold ${isPinned("hoTen") ? "sticky-col" : ""}`} style={{ minWidth: "120px" }}>{item.HoTen}</td>}
      {isVisible("maVung") && <td className={`text-center ${isPinned("maVung") ? "sticky-col" : ""}`}>{item.MaVung}</td>}
      {isVisible("sdt") && <td style={{ maxWidth: "150px", width: "110px", textAlign: "center" }} className={isPinned("sdt") ? "sticky-col" : ""}>{item.SoDienThoai}</td>}
      {isVisible("email") && <td style={{ maxWidth: "162px" }} className={`text-center text-truncate ${isPinned("email") ? "sticky-col" : ""}`} title={item.Email}>{item.Email}</td>}
      {isVisible("hinhThuc") && <td className={`text-center border-target ${isPinned("hinhThuc") ? "sticky-col" : ""}`}>{item.TenHinhThuc}</td>}
      {isVisible("coSo") && <td className={`text-center border-target ${isPinned("coSo") ? "sticky-col" : ""}`}>{translateBranch(item.CoSoTuVan)}</td>}
      {isVisible("loaiDichVu") && <td style={{ maxWidth: "150px" }} className={`text-center text-truncate ${isPinned("loaiDichVu") ? "sticky-col" : ""}`} title={translateService(item.LoaiDichVu)}>{translateService(item.LoaiDichVu)}</td>}
      {isVisible("tenDichVu") && <td className={`text-center ${isPinned("tenDichVu") ? "sticky-col" : ""}`}>{item.TenDichVu || ""}</td>}
      {isVisible("maDichVu") && <td className={`text-center border-target ${isPinned("maDichVu") ? "sticky-col" : ""}`}>{displayMaHoSo}</td>}
      
      {canViewAssignee && isVisible("nguoiPhuTrach") && (
        <td style={{ width: "110px", maxWidth: "110px" }} className={`text-center text-truncate ${isPinned("nguoiPhuTrach") ? "sticky-col" : ""}`} title={item.NguoiPhuTrach?.name}>
          {item.NguoiPhuTrach?.name || <span className="text-muted fst-italic"></span>}
        </td>
      )}

      {isVisible("ngayHen") && <td className={`text-center ${isPinned("ngayHen") ? "sticky-col" : ""}`}>{item.ChonNgay ? new Date(item.ChonNgay).toLocaleDateString("vi-VN") : ""}</td>}
      {isVisible("trangThai") && <td className={`text-center ${isPinned("trangThai") ? "sticky-col" : ""}`}>{item.TrangThai}</td>}
      {isVisible("goiDichVu") && <td style={{width:100}} className={`text-center ${isPinned("goiDichVu") ? "sticky-col" : ""}`}>{item.GoiDichVu || ""}</td>}
      
      {isVisible("invoice") && (
        <td className={`text-center ${isPinned("invoice") ? "sticky-col" : ""}`}>
           {["Yes", "yes", "true", "1"].includes(String(item.Invoice)) ? <span className="text-success fw-bold">Có</span> : <span className="text-muted"></span>}
        </td>
      )}
      
      {canViewFinance && isVisible("invoiceUrl") && (
        <td style={{ maxWidth: "120px" }} className={isPinned("invoiceUrl") ? "sticky-col" : ""}>
          {item.InvoiceUrl ? <a href={item.InvoiceUrl} target="_blank" rel="noreferrer" className="text-decoration-none text-primary d-block text-truncate">Link</a> : "-"}
        </td>
      )}

      {isVisible("gio") && (
        <td className={`text-center ${isPinned("gio") ? "sticky-col" : ""}`}>
          {item.Gio ? (item.Gio.includes("T") ? new Date(item.Gio).toLocaleTimeString("vi-VN", { hour12: false, hour: "2-digit", minute: "2-digit" }) : item.Gio.substring(0, 5)) : ""}
        </td>
      )}

      {isVisible("noiDung") && (
        <td style={{ minWidth: "200px", maxWidth: "260px" }} className={`${isPinned("noiDung") ? "sticky-col" : ""}`}>
           <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", textAlign: "left", overflowWrap: "anywhere", paddingLeft: "5px" }}>{item.NoiDung}</div>
        </td>
      )}

      {isVisible("ghiChu") && (
        <td style={{ minWidth: "150px", maxWidth: "250px" }} className={`${isPinned("ghiChu") ? "sticky-col" : ""}`}>
           <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", textAlign: "left", overflowWrap: "anywhere", paddingLeft: "5px" }}>{item.GhiChu}</div>
        </td>
      )}

      {isVisible("ngayTao") && (
        <td className={`text-center text-nowrap border-target ${isPinned("ngayTao") ? "sticky-col" : ""}`} style={{fontSize: "0.8rem"}}>
          {item.NgayTao && (
            <>{new Date(item.NgayTao).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}<br />{new Date(item.NgayTao).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false })}</>
          )}
        </td>
      )}
    </tr>
  );
};

// --- 2. DashboardList Component ---
const DashboardList = ({
  subViewMode,
  setSubViewMode,
  data,
  emailList,
  setEmailList,
  currentLanguage,
  currentUser,
  searchTerm,
  setSearchTerm,
  tableContainerRef,
}) => {
  
  const [filterService, setFilterService] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPackage, setFilterPackage] = useState("");
  const [allStaff, setAllStaff] = useState([]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const filterMenuRef = useRef(null);

  const canViewFinance = currentUser?.is_accountant || currentUser?.is_director;
  const canViewAssignee = currentUser?.is_admin || currentUser?.is_director || currentUser?.is_accountant;

  // --- Cấu hình cột (Đã bỏ cột tài chính) ---
  const initialColumnKeys = [
    { key: "id", label: "STT" },
    { key: "hoTen", label: "Khách hàng" },
    { key: "maVung", label: "Mã vùng" },
    { key: "sdt", label: "Số Điện Thoại" },
    { key: "email", label: "Email" },
    { key: "hinhThuc", label: "Hình thức" },
    { key: "coSo", label: "Cơ sở" },
    { key: "loaiDichVu", label: "Loại Dịch Vụ" },
    { key: "tenDichVu", label: "Tên Dịch Vụ" },
    { key: "maDichVu", label: "Mã Dịch Vụ" },
    ...(canViewAssignee ? [{ key: "nguoiPhuTrach", label: "Người phụ trách" }] : []),
    { key: "ngayHen", label: "Ngày hẹn" },
    { key: "trangThai", label: "Trạng thái" },
    { key: "goiDichVu", label: "Gói Dịch Vụ" },
    { key: "invoice", label: "Invoice Y/N" },
    ...(canViewFinance ? [{ key: "invoiceUrl", label: "Invoice" }] : []),
    { key: "gio", label: "Giờ" },
    { key: "noiDung", label: "Nội dung" },
    { key: "ghiChu", label: "Ghi chú" },
    { key: "ngayTao", label: "Ngày tạo" },
  ];

  const tableHeaders = [
    "STT", "Khách hàng", "Mã vùng", "Số Điện Thoại", "Email", 
    "Hình thức", "Cơ sở", "Loại Dịch Vụ", "Tên Dịch Vụ", "Mã Dịch Vụ",
    ...(canViewAssignee ? ["Người phụ trách"] : []),
    "Ngày hẹn", "Trạng thái", "Gói Dịch Vụ", "Invoice Y/N",
    ...(canViewFinance ? ["Invoice"] : []),
    "Giờ", "Nội dung", "Ghi chú", "Ngày tạo",
  ];

  const [visibleColumns, setVisibleColumns] = useState(() => {
    const initial = {};
    initialColumnKeys.forEach(col => initial[col.key] = true);
    return initial;
  });

  const [pinnedColumns, setPinnedColumns] = useState([]);
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const columnMenuRef = useRef(null);

  const isVisible = (key) => visibleColumns[key];
  const isPinned = (key) => pinnedColumns.includes(key);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await fetch("https://onepasscms-backend.onrender.com/api/User");
        const json = await res.json();
        if (json.success) setAllStaff(json.data);
      } catch (err) { console.error(err); }
    };
    if (canViewAssignee) fetchStaff();
  }, [canViewAssignee]);

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

  const translateService = (serviceName) => {
    const map = {
      "인증 센터": "Chứng thực", "결혼 이민": "Kết hôn",
      "출생신고 대행": "Khai sinh, khai tử", "출입국 행정 대행": "Xuất nhập cảnh",
      "신분증명 서류 대행": "Giấy tờ tuỳ thân", "입양 절차 대행": "Nhận nuôi",
      "비자 대행": "Thị thực", "법률 컨설팅": "Tư vấn pháp lý",
      "B2B 서비스": "Dịch vụ B2B", "기타": "Khác",
    };
    return map[serviceName] || serviceName;
  };

  const SERVICE_OPTIONS = ["Chứng thực", "Kết hôn", "Khai sinh, khai tử", "Xuất nhập cảnh", "Giấy tờ tuỳ thân", "Nhận nuôi", "Thị thực", "Tư vấn pháp lý", "Dịch vụ B2B", "Khác"];
  const STATUS_OPTIONS = ["Tư vấn", "Đang xử lý", "Đang nộp hồ sơ", "Hoàn thành"];
  const PACKAGE_OPTIONS = ["Thông thường", "Cấp tốc"];

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      const matchSearch = 
        (item.HoTen || "").toLowerCase().includes(searchLower) ||
        (item.Email || "").toLowerCase().includes(searchLower) ||
        (item.SoDienThoai || "").toLowerCase().includes(searchLower) ||
        (item.MaHoSo || "").toLowerCase().includes(searchLower);

      if (!matchSearch) return false;
      if (filterService && translateService(item.LoaiDichVu) !== filterService) return false;
      if (filterAssignee && item.NguoiPhuTrach?.name !== filterAssignee) return false;
      if (filterStatus && item.TrangThai !== filterStatus) return false;
      if (filterPackage && item.GoiDichVu !== filterPackage) return false;

      return true;
    });
  }, [data, searchTerm, filterService, filterAssignee, filterStatus, filterPackage]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterService, filterAssignee, filterStatus, filterPackage]);

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentTableRows = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const handleExportExcel = () => {
    const ok = exportRequestsToExcel(filteredData, currentLanguage);
    if (!ok) showToast("Không có dữ liệu để xuất", "warning");
  };

  const hasActiveFilters = filterService || filterAssignee || filterStatus || filterPackage;

  return (
   <div className="mb-4">
      <div className="d-flex border-bottom mb-3" style={{ gap: "1.5rem", fontSize: "15px", fontWeight: 500 }}>
        {[
          { key: "request", labelVi: "Danh sách dịch vụ", labelEn: "Service List" },
          { key: "email", labelVi: "Danh sách email", labelEn: "Email List" },
        ].map((tab) => (
          <div key={tab.key} onClick={() => setSubViewMode(tab.key)}
            style={{
              cursor: "pointer", paddingBottom: "6px",
              borderBottom: subViewMode === tab.key ? "2px solid #2563eb" : "2px solid transparent",
              color: subViewMode === tab.key ? "#2563eb" : "#6b7280",
              fontWeight: subViewMode === tab.key ? "600" : "500", transition: "all 0.2s ease",
            }}
          >
            {currentLanguage === "vi" ? tab.labelVi : tab.labelEn}
          </div>
        ))}
      </div>

      {subViewMode === "request" && (
        <>
          <div className="d-flex justify-content-between align-items-center mt-3 mb-3">
             <div className="d-flex align-items-center gap-3">
                <input type="text" className="form-control shadow-sm"
                    placeholder={currentLanguage === "vi" ? "Tìm kiếm..." : "Search..."}
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
                    {currentLanguage === "vi" ? "Tải xuống" : "Download"}
                </button>

                <div className="position-relative" ref={columnMenuRef}>
                    <button className="btn btn-light border shadow-sm d-flex align-items-center justify-content-center"
                        style={{ width: 40, height: 40, borderRadius: "8px", backgroundColor: "#fff" }}
                        onClick={() => setShowColumnMenu(!showColumnMenu)} title={currentLanguage === "vi" ? "Ẩn/Hiện cột" : "Toggle Columns"}
                    >
                        <LayoutGrid size={20} color="#4b5563" />
                    </button>
                    {showColumnMenu && (
                        <div className="position-absolute bg-white shadow rounded border p-2"
                            style={{ top: "100%", right: 0, zIndex: 1000, width: "280px", maxHeight: "400px", overflowY: "auto" }}
                        >
                            <div className="fw-bold mb-2 px-1" style={{fontSize: '14px'}}>{currentLanguage === "vi" ? "Cấu hình cột:" : "Column Config:"}</div>
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
            <div className="position-relative" ref={filterMenuRef}>
                <button className={`btn d-flex align-items-center gap-2 shadow-sm ${hasActiveFilters ? "btn-primary" : "btn-white border"}`}
                    onClick={() => setShowFilterMenu(!showFilterMenu)}
                    style={{ height: "40px", borderRadius: "8px", fontWeight: 500 }}
                >
                    <Filter size={16} /> 
                    {currentLanguage === "vi" ? "Bộ lọc" : "Filters"}
                </button>

                {showFilterMenu && (
                    <div className="dropdown-menu show shadow-lg border-0 p-0 rounded-3 mt-1" 
                         style={{ position: "absolute", zIndex: 1050, minWidth: "220px", overflow: "visible" }}>
                        
                        <div className="dropdown-group position-relative border-bottom">
                            <div className="dropdown-item d-flex justify-content-between align-items-center py-2 px-3 fw-medium" style={{cursor:"pointer", fontSize:"14px"}}>
                                <span>{currentLanguage === "vi" ? "Loại dịch vụ" : "Service Type"}</span>
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

                        {canViewAssignee && (
                            <div className="dropdown-group position-relative border-bottom">
                                <div className="dropdown-item d-flex justify-content-between align-items-center py-2 px-3 fw-medium" style={{cursor:"pointer", fontSize:"14px"}}>
                                    <span>{currentLanguage === "vi" ? "Người phụ trách" : "Assignee"}</span>
                                    <ChevronRight size={14} className="text-muted"/>
                                </div>
                                <div className="submenu shadow-lg rounded-3 border bg-white py-1" style={{maxHeight:"300px", overflowY:"auto"}}>
                                    {allStaff.map((u) => (
                                        <div key={u.id} className="submenu-item px-3 py-2 d-flex justify-content-between align-items-center"
                                             onClick={() => { setFilterAssignee(u.name); setShowFilterMenu(false); }}>
                                            {u.name}
                                            {filterAssignee === u.name && <Check size={14} className="text-primary"/>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="dropdown-group position-relative border-bottom">
                            <div className="dropdown-item d-flex justify-content-between align-items-center py-2 px-3 fw-medium" style={{cursor:"pointer", fontSize:"14px"}}>
                                <span>{currentLanguage === "vi" ? "Trạng thái" : "Status"}</span>
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

                        <div className="dropdown-group position-relative">
                            <div className="dropdown-item d-flex justify-content-between align-items-center py-2 px-3 fw-medium" style={{cursor:"pointer", fontSize:"14px"}}>
                                <span>{currentLanguage === "vi" ? "Gói dịch vụ" : "Package"}</span>
                                <ChevronRight size={14} className="text-muted"/>
                            </div>
                            <div className="submenu shadow-lg rounded-3 border bg-white py-1">
                                {PACKAGE_OPTIONS.map((opt) => (
                                    <div key={opt} className="submenu-item px-3 py-2 d-flex justify-content-between align-items-center"
                                         onClick={() => { setFilterPackage(opt); setShowFilterMenu(false); }}>
                                        {opt}
                                        {filterPackage === opt && <Check size={14} className="text-primary"/>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {filterService && (
                <div className="badge bg-light text-dark border px-2 py-2 d-flex align-items-center gap-2" style={{fontWeight: 500}}>
                    <span className="text-muted small">{currentLanguage === "vi" ? "Dịch vụ:" : "Service:"}</span>
                    {filterService}
                    <X size={14} className="cursor-pointer text-danger" onClick={() => setFilterService("")}/>
                </div>
            )}
            {filterAssignee && (
                <div className="badge bg-light text-dark border px-2 py-2 d-flex align-items-center gap-2" style={{fontWeight: 500}}>
                    <span className="text-muted small">{currentLanguage === "vi" ? "Phụ trách:" : "Assignee:"}</span>
                    {filterAssignee}
                    <X size={14} className="cursor-pointer text-danger" onClick={() => setFilterAssignee("")}/>
                </div>
            )}
            {filterStatus && (
                <div className="badge bg-light text-dark border px-2 py-2 d-flex align-items-center gap-2" style={{fontWeight: 500}}>
                    <span className="text-muted small">{currentLanguage === "vi" ? "Trạng thái:" : "Status:"}</span>
                    {filterStatus}
                    <X size={14} className="cursor-pointer text-danger" onClick={() => setFilterStatus("")}/>
                </div>
            )}
            {filterPackage && (
                <div className="badge bg-light text-dark border px-2 py-2 d-flex align-items-center gap-2" style={{fontWeight: 500}}>
                    <span className="text-muted small">{currentLanguage === "vi" ? "Gói:" : "Package:"}</span>
                    {filterPackage}
                    <X size={14} className="cursor-pointer text-danger" onClick={() => setFilterPackage("")}/>
                </div>
            )}
          </div>

          <div className="table-wrapper mt-3">
            <div className="table-responsive" style={{ paddingLeft: "0px", maxHeight: "calc(100vh - 350px)", overflow: "auto" }} ref={tableContainerRef}>
              <table className="table table-bordered table-hover align-middle mb-0">
                <thead>
                  <tr>
                    {tableHeaders.map((header, i) => {
                        const availableKeys = initialColumnKeys.filter(k => {
                            if (k.key === 'nguoiPhuTrach' && !canViewAssignee) return false;
                            if (k.key === 'invoiceUrl' && !canViewFinance) return false;
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
                                style={{ 
                                    width: 24, height: 24, padding: 0, borderRadius: "3px", 
                                    position: "absolute", right: "0px", top: "50%", transform: "translateY(-50%)",
                                    opacity: isPinned(currentKey) ? 1 : 0.5 
                                }} 
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
                      <ReadOnlyRow
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
                        {currentLanguage === "vi" ? "Không có dữ liệu phù hợp" : "No matching data found"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="d-flex justify-content-between align-items-center px-3 py-2 border-top bg-white" style={{ marginTop: "0", borderTop: "1px solid #dee2e6" }}>
              <div className="text-muted small">
                {currentLanguage === "vi"
                  ? `Hiển thị ${currentTableRows.length} / ${totalItems} hàng (trang ${currentPage}/${totalPages})`
                  : `Showing ${currentTableRows.length} / ${totalItems} rows (page ${currentPage}/${totalPages})`}
              </div>

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
                  {currentLanguage === "vi" ? `Trang ${currentPage}/${totalPages}` : `Page ${currentPage}/${totalPages}`}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

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
        .table-hover tbody tr:hover { background-color: rgba(0, 0, 0, 0.04); }
        
        td.sticky-col { 
            position: sticky !important; 
            left: 0; 
            z-index: 5 !important; 
            background-color: #ffffff !important; 
            border-right: 2px solid #2563eb !important; 
        }
        
        .table-responsive { scroll-behavior: smooth; }

        /* --- STYLES CHO NESTED DROPDOWN --- */
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
            background-color: #EFF6FF; /* Màu xanh nhạt */
            color: #2563eb;
        }
      `}</style>
    </div>
  );
};

export default DashboardList;