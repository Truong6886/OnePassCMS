import React, { useEffect, useState, useRef } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Save, Trash2, Plus, FileText, Upload, Edit, Filter, ChevronRight, Check, LayoutGrid, FilterX, X } from "lucide-react"; 
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import translateService from "../utils/translateService";
import EditProfileModal from "./EditProfileModal";
import useDashboardData from "./CMSDashboard/hooks/useDashboardData";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";

const formatCurrency = (num) => {
  if (num == null || num === "") return "0";
  const n = parseFloat(num);
  if (isNaN(n)) return "0";
  return n.toLocaleString("vi-VN");
};

const parseCurrency = (str) => {
    if (!str) return 0;
    if (typeof str === 'number') return str;
    return parseFloat(str.toString().replace(/\./g, "").replace(/,/g, "")) || 0;
};

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF", "#FF4560", "#775DD0"];

const translations = {
  vi: {
    title: "Tổng Doanh Thu",
    personalTab: "Doanh Thu Khách Hàng Cá Nhân",
    companyTab: "Doanh Thu Khách Hàng Doanh nghiệp",
    chartTitle: "Biểu đồ Tổng Doanh Thu",
    chartPersonal: "(Cá nhân)",
    chartBusiness: "(Doanh nghiệp)",
    allServices: "Tất cả dịch vụ",
    allStaff: "Tất cả nhân viên",
    filter: "Lọc",
    noData: "Không có dữ liệu",
    loadingChart: "Đang tải biểu đồ...",
    revenue: "Doanh thu Trước Chiết Khấu",
    time: "Thời gian",
    revenueUnit: "VNĐ",
    companyName: "Tên Doanh Nghiệp",
    transactionCount: "Số lượng DV",
    revenueBefore: "Tổng Doanh Thu Trước Chiết Khấu",
    rank: "Hạng",
    excel: "Tải Danh Sách Doanh Thu",
    discountRate: "Mức Chiết khấu",
    revenueAfter: "Tổng Doanh Thu Sau Chiết Khấu",
    totalRevenue: "Tổng Doanh Thu",
    proportion: "Tỷ Trọng Doanh Thu Doanh Nghiệp",
    other: "Khác",
    filterStaff: "Phụ trách",
    filterInvoice: "Hóa đơn",
    filterDiscount: "Chiết khấu",
    invoiceYes: "Có hóa đơn",
    invoiceNo: "Không hóa đơn",
    toggleColumns: "Ẩn/Hiện cột",
    clearFilter: "Xóa bộ lọc"
  },
  en: {
    title: "Total Revenue",
    personalTab: "Individual Customer Revenue",
    companyTab: "Business Customer Revenue",
    chartTitle: "Total Revenue Chart",
    chartPersonal: "(Individual)",
    chartBusiness: "(Business)",
    allServices: "All Services",
    allStaff: "All Staff",
    filter: "Filter",
    noData: "No Data Available",
    loadingChart: "Loading Chart...",
    revenue: "Revenue",
    time: "Time",
    revenueUnit: "VND",
    companyName: "Business Name",
    transactionCount: "Service Count",
    revenueBefore: "Total Revenue Before Discount",
    rank: "Rank",
    excel: "Download Revenue Report",
    discountRate: "Discount Rate",
    revenueAfter: "Total Revenue After Discount",
    totalRevenue: "Total Revenue",
    proportion: "Corporate Revenue Business", 
    other: "Other", 
    filterStaff: "Person in charge",
    filterInvoice: "Invoice",
    filterDiscount: "Discount Rate",
    invoiceYes: "With Invoice",
    invoiceNo: "No Invoice",
    toggleColumns: "Toggle Columns",
    clearFilter: "Clear Filter"
  },
};

export default function DoanhThu() {
  const [collapsed, setCollapsed] = useState(false);
  const {
    showEditModal,
    setShowEditModal,
    currentPage,
    setCurrentPage,
    rowsPerPage,
  } = useDashboardData();

  const [activeTab, setActiveTab] = useState("personal"); 
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("thang");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentLanguage, setCurrentLanguage] = useState(localStorage.getItem("language") || "vi");

  const t = translations[currentLanguage];
  const savedUser = localStorage.getItem("currentUser");
  const currentUser = savedUser ? JSON.parse(savedUser) : null;

  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [savingRow, setSavingRow] = useState(null);
  
  const [selectedService, setSelectedService] = useState("tatca");
  const [selectedStaff, setSelectedStaff] = useState("tatca");

  const [tableSelectedStaff, setTableSelectedStaff] = useState("tatca");
  const [tableSelectedInvoice, setTableSelectedInvoice] = useState("tatca");
  const [tableSelectedDiscount, setTableSelectedDiscount] = useState("tatca");
  
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const filterMenuRef = useRef(null);
  const [staffList, setStaffList] = useState([]); 

  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const columnMenuRef = useRef(null);

  const [visibleColumns, setVisibleColumns] = useState({
      stt: true,
      khachHang: true, // Used for Company Name in B2B tab
      loaiDichVu: true,
      tenDichVu: true,
      nguoiPhuTrach: true,
      invoiceYN: true,
      invoiceFile: true,
      dtTruoc: true,
      mucCK: true,
      tienCK: true,
      dtSau: true,
      hanhDong: true
  });

  const columnLabels = {
      stt: "STT",
      khachHang: activeTab === "personal" ? "Khách Hàng" : "Doanh Nghiệp",
      loaiDichVu: "Loại Dịch Vụ",
      tenDichVu: "Tên dịch vụ",
      nguoiPhuTrach: "Người Phụ Trách",
      invoiceYN: "Invoice Y/N",
      invoiceFile: "Invoice",
      dtTruoc: "Doanh Thu Trước Chiết Khấu",
      mucCK: "Mức Chiết khấu",
      tienCK: "Số Tiền Chiết Khấu",
      dtSau: "Doanh Thu Sau Chiết Khấu",
      hanhDong: "Hành động"
  };

  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const [approvedCompanies, setApprovedCompanies] = useState([]); 
  const [companyRecords, setCompanyRecords] = useState([]); 
  const [filteredCompanyRecords, setFilteredCompanyRecords] = useState([]); 
  const [aggregatedCompanyData, setAggregatedCompanyData] = useState([]); 
  const [companySearchTerm, setCompanySearchTerm] = useState("");
  const [companyCurrentPage, setCompanyCurrentPage] = useState(1);
  const [companyTotalPages, setCompanyTotalPages] = useState(1);
  const [companyLineChartData, setCompanyLineChartData] = useState([]);
  const [companyPieChartData, setCompanyPieChartData] = useState([]);

  if (!currentUser?.is_director && !currentUser?.is_accountant && !currentUser?.perm_view_revenue) {
    return (
      <div className="d-flex min-vh-100 bg-light align-items-center justify-content-center flex-column text-primary text-center fw-bold fs-5">
        <p>Bạn không có quyền truy cập trang “Doanh Thu”.</p>
        <p>Vui lòng quay lại trang chủ.</p>
      </div>
    );
  }
  
  useEffect(() => {
    function handleClickOutside(event) {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target)) {
        setIsFilterMenuOpen(false);
      }
      if (columnMenuRef.current && !columnMenuRef.current.contains(event.target)) {
        setIsColumnMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [filterMenuRef, columnMenuRef]);

  const fetchStaffList = async () => {
    try {
        const res = await fetch("http://localhost:5000/api/User");
        const json = await res.json();
        if (json.success) {
            setStaffList(json.data || []);
        }
    } catch (error) {
        console.error("Lỗi tải danh sách nhân viên:", error);
    }
  };

  useEffect(() => {
    fetchStaffList();
  }, []);

  const toggleColumn = (key) => {
      setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const aggregateCompanyData = (services, companies) => {
    if (!companies || companies.length === 0) return [];
    
    const aggregated = companies.map(company => {
      let myServices = services.filter(s => String(s.DoanhNghiepID) === String(company.ID));
      const totalBefore = myServices.reduce((sum, s) => sum + (parseFloat(s.DoanhThuTruocChietKhau) || 0), 0);
      const totalAfter = myServices.reduce((sum, s) => sum + (parseFloat(s.DoanhThuSauChietKhau) || 0), 0); 
      myServices.sort((a, b) => (b.ID || 0) - (a.ID || 0));
      const latestService = myServices.length > 0 ? myServices[0] : {};
      const currentRank = latestService.Hang || "New-bie"; 
      const currentDiscount = latestService.MucChietKhau || 0;

      return {
        TenDoanhNghiep: company.TenDoanhNghiep,
        ID: company.ID,
        Count: myServices.length,
        TotalRevenueBefore: totalBefore, 
        TotalRevenueAfter: totalAfter,  
        Rank: currentRank,
        DiscountRate: currentDiscount
      };
    });
    return aggregated.sort((a, b) => b.TotalRevenueAfter - a.TotalRevenueAfter);
  };

  const fetchPersonalData = async (page = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/yeucau?page=${page}&limit=${rowsPerPage}`);
      const result = await res.json();
      if (result.success) {
        setRecords(result.data);
        setFilteredRecords(result.data);
        prepareChartData(result.data, viewMode, "personal");
        setTotalPages(result.totalPages || 1);
      } else {
        toast.error("Không thể tải danh sách cá nhân!");
      }
    } catch (err) {
      toast.error("Lỗi kết nối server!");
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyData = async () => {
    setLoading(true);
    try {
      const [resApproved, resServices] = await Promise.all([
         fetch(`http://localhost:5000/api/b2b/approved?limit=1000`),
         fetch(`http://localhost:5000/api/b2b/services?limit=1000`)
      ]);
      const jsonApproved = await resApproved.json();
      const jsonServices = await resServices.json();

      if (jsonApproved.success && jsonServices.success) {
        const companies = jsonApproved.data || [];
        setApprovedCompanies(companies);
        const mappedServices = (jsonServices.data || []).map((item) => ({
             ...item,
             NgayTao: item.NgayThucHien || item.NgayTao, 
             DoanhThuTruocChietKhau: parseCurrency(item.DoanhThuTruocChietKhau),
             DoanhThuSauChietKhau: parseCurrency(item.DoanhThuSauChietKhau),
             DoanhThu: parseCurrency(item.DoanhThuSauChietKhau),
             TenDichVu: item.TenDichVu,
             DoanhNghiepID: item.DoanhNghiepID,
             TenDoanhNghiep: item.TenDoanhNghiep,
             Hang: item.Hang, 
             MucChietKhau: item.MucChietKhau,
             Invoice: item.YeuCauHoaDon,
             NguoiPhuTrachName: item.NguoiPhuTrach ? (item.NguoiPhuTrach.name || item.NguoiPhuTrach.username) : ""
        }));

        mappedServices.sort((a, b) => (a.TenDoanhNghiep || "").localeCompare(b.TenDoanhNghiep || ""));
        setCompanyRecords(mappedServices);
        setFilteredCompanyRecords(mappedServices);
        
        const aggregated = aggregateCompanyData(mappedServices, companies);
        setAggregatedCompanyData(aggregated);
        
        setCompanyTotalPages(Math.ceil(mappedServices.length / 20));
        
        prepareChartData(mappedServices, viewMode, "company");
        preparePieChartData(aggregated);
      } else {
        toast.error("Không thể tải dữ liệu doanh nghiệp!");
      }
    } catch (err) {
      toast.error("Lỗi kết nối server!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "personal") fetchPersonalData(currentPage);
    else fetchCompanyData();
  }, [activeTab, currentPage, rowsPerPage]);

  const prepareChartData = (data, mode, type) => {
    if (!data || data.length === 0) {
      type === "personal" ? setChartData([]) : setCompanyLineChartData([]);
      return;
    }
    const group = {};
    data.forEach((r) => {
      const date = new Date(r.NgayTao || Date.now());
      let key = "";
      switch (mode) {
        case "ngay": key = date.toLocaleDateString("vi-VN"); break;
        case "tuan": key = `Tuần ${Math.ceil(date.getDate() / 7)}/${date.getMonth() + 1}`; break;
        case "thang": key = `${date.getMonth() + 1}/${date.getFullYear()}`; break;
        case "nam": key = `${date.getFullYear()}`; break;
        default: key = date.toLocaleDateString("vi-VN");
      }
      if (!group[key]) group[key] = { name: key, doanhthu: 0 };
      const val = parseFloat(type === "personal" ? (r.DoanhThuSauChietKhau || r.DoanhThu || 0) : (r.DoanhThu || 0));
      group[key].doanhthu += isNaN(val) ? 0 : val;
    });
    const result = Object.values(group);
    type === "personal" ? setChartData(result) : setCompanyLineChartData(result);
  };

  const preparePieChartData = (aggregatedData) => {
    if (!aggregatedData || aggregatedData.length === 0) { setCompanyPieChartData([]); return; }
    const top5 = aggregatedData.slice(0, 5);
    const others = aggregatedData.slice(5);
    const othersTotal = others.reduce((sum, item) => sum + item.TotalRevenueAfter, 0);
    const pieData = top5.map(item => ({ name: item.TenDoanhNghiep, value: item.TotalRevenueAfter }));
    if (othersTotal > 0) pieData.push({ name: t.other, value: othersTotal });
    setCompanyPieChartData(pieData);
  };

  useEffect(() => {
    const timeOutId = setTimeout(() => handleFilter(), 300);
    return () => clearTimeout(timeOutId);
  }, [searchTerm, companySearchTerm, tableSelectedStaff, tableSelectedInvoice, tableSelectedDiscount]);

  // ================== FILTER ==================
  const handleFilter = () => {
    const isPersonal = activeTab === "personal";
    let filtered = isPersonal ? records : companyRecords;
    const term = isPersonal ? searchTerm : companySearchTerm;

    // 1. Search (Text)
    if (term.trim() !== "") {
      const keyword = term.toLowerCase();
      filtered = filtered.filter((r) => {
        if (isPersonal) {
          return (r.HoTen?.toLowerCase() || "").includes(keyword) || (r.Email?.toLowerCase() || "").includes(keyword) || (r.SoDienThoai?.toLowerCase() || "").includes(keyword);
        } else {
           const company = approvedCompanies.find(c => String(c.ID) === String(r.DoanhNghiepID));
           return (company ? company.TenDoanhNghiep.toLowerCase() : "").includes(keyword);
        }
      });
    }

    // 2. Date Filter
    if (startDate || endDate) {
      filtered = filtered.filter((r) => {
        const date = new Date(r.NgayTao);
        const s = startDate ? new Date(startDate) : null;
        const e = endDate ? new Date(endDate) : null;
        if(s) s.setHours(0,0,0,0);
        if(e) e.setHours(23,59,59,999);
        return (!s || date >= s) && (!e || date <= e);
      });
    }

    // 3. Dropdown Service & Staff (Top Bar - only for Personal currently)
    if (isPersonal) {
      if (selectedService !== "tatca") filtered = filtered.filter(r => translateService(typeof r.TenDichVu === "object" ? r.TenDichVu?.name : r.TenDichVu) === selectedService);
      if (selectedStaff !== "tatca") {
          filtered = filtered.filter(r => {
              const staffName = typeof r.NguoiPhuTrach === "object" ? r.NguoiPhuTrach?.username : r.NguoiPhuTrach;
              return staffName === selectedStaff;
          });
      }
    }

    // 4. Advanced Filters (From Menu: Staff, Invoice, Discount) - Applies to BOTH Tabs
    if (tableSelectedStaff !== "tatca") {
        filtered = filtered.filter(r => {
             // Logic for personal: r.NguoiPhuTrach (object or string)
             // Logic for company: r.NguoiPhuTrachName (string) or r.NguoiPhuTrach (object)
             let staffName = "";
             if (isPersonal) {
                staffName = typeof r.NguoiPhuTrach === "object" ? r.NguoiPhuTrach?.username : r.NguoiPhuTrach;
             } else {
                staffName = r.NguoiPhuTrachName || (typeof r.NguoiPhuTrach === "object" ? r.NguoiPhuTrach?.username : "");
             }
             return staffName === tableSelectedStaff;
        });
    }
    if (tableSelectedInvoice !== "tatca") {
        filtered = filtered.filter(r => {
           // Personal: r.Invoice. Company: r.YeuCauHoaDon or r.Invoice
           const invVal = isPersonal ? r.Invoice : (r.YeuCauHoaDon || r.Invoice);
           const hasInvoice = ["Yes", "yes", "true", "1", "có", "y"].includes(String(invVal).toLowerCase());
           return tableSelectedInvoice === "yes" ? hasInvoice : !hasInvoice;
        });
    }
    if (tableSelectedDiscount !== "tatca") {
         filtered = filtered.filter(r => String(r.MucChietKhau || 0) === String(tableSelectedDiscount));
    }

    // Set Data
    if (isPersonal) {
      setFilteredRecords(filtered);
      prepareChartData(filtered, viewMode, "personal");
      setCurrentPage(1);
    } else {
      setFilteredCompanyRecords(filtered); 
      prepareChartData(filtered, viewMode, "company");
      const aggregated = aggregateCompanyData(filtered, approvedCompanies);
      setAggregatedCompanyData(aggregated);
      preparePieChartData(aggregated);
      setCompanyCurrentPage(1);
      setCompanyTotalPages(Math.ceil(filtered.length / 20));
    }
  };

  // --- SAVE & DELETE for PERSONAL ---
  const handleSavePersonalRow = async (id, updatedData) => {
    setSavingRow(id);
    try {
      const dt = parseCurrency(updatedData.DoanhThuTruocChietKhau);
      const ck = parseFloat(updatedData.MucChietKhau) || 0;
      const tienCK = (dt * ck) / 100;
      const sauCK = dt - tienCK;

      const payload = {
          DoanhThuTruocChietKhau: dt,
          MucChietKhau: ck,
          SoTienChietKhau: tienCK,
          DoanhThuSauChietKhau: sauCK,
          Invoice: updatedData.Invoice,
          InvoiceUrl: updatedData.InvoiceUrl
      };

      const res = await fetch(`https://onepasscms-backend.onrender.com/api/yeucau/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (result.success) {
        toast.success(`Cập nhật thành công!`);
        fetchPersonalData(currentPage);
      } else {
        toast.error("Lỗi khi cập nhật!");
      }
    } catch (err) {
      toast.error("Không thể kết nối server!");
    } finally {
      setSavingRow(null);
    }
  };

  const handleDeleteRow = async (id) => {
    Swal.fire({
        title: "Bạn chắc chắn xoá?",
        text: "Hành động này không thể hoàn tác!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        confirmButtonText: "Xoá",
        cancelButtonText: "Huỷ"
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const res = await fetch(`https://onepasscms-backend.onrender.com/api/yeucau/${id}`, { method: "DELETE" });
                const json = await res.json();
                if (json.success) { 
                    toast.success("Đã xoá thành công"); 
                    fetchPersonalData(currentPage); 
                } else { 
                    toast.error("Không thể xoá"); 
                }
            } catch { toast.error("Lỗi kết nối"); }
        }
    });
  };

  // --- SAVE & DELETE for COMPANY (B2B) ---
  const handleSaveCompanyRow = async (id, updatedData) => {
    setSavingRow(id);
    try {
      const dt = parseCurrency(updatedData.DoanhThuTruocChietKhau);
      const ck = parseFloat(updatedData.MucChietKhau) || 0;
      const tienCK = (dt * ck) / 100;
      const sauCK = dt - tienCK;

      // Note: Endpoint uses STT as ID for B2B services
      const payload = {
          DoanhThuTruocChietKhau: dt,
          MucChietKhau: ck,
          SoTienChietKhau: tienCK,
          DoanhThuSauChietKhau: sauCK,
          YeuCauHoaDon: updatedData.Invoice,
          InvoiceUrl: updatedData.InvoiceUrl
      };

      const res = await fetch(`https://onepasscms-backend.onrender.com/api/b2b/services/update/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (result.success) {
        toast.success(`Cập nhật doanh nghiệp thành công!`);
        fetchCompanyData();
      } else {
        toast.error("Lỗi khi cập nhật!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Không thể kết nối server!");
    } finally {
      setSavingRow(null);
    }
  };

  const handleDeleteCompanyRow = async (id) => {
    Swal.fire({
        title: "Bạn chắc chắn xoá dịch vụ này?",
        text: "Hành động này không thể hoàn tác!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        confirmButtonText: "Xoá",
        cancelButtonText: "Huỷ"
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const res = await fetch(`https://onepasscms-backend.onrender.com/api/b2b/services/${id}`, { method: "DELETE" });
                const json = await res.json();
                if (json.success) { 
                    toast.success("Đã xoá thành công"); 
                    fetchCompanyData(); 
                } else { 
                    toast.error("Không thể xoá"); 
                }
            } catch { toast.error("Lỗi kết nối"); }
        }
    });
  };

  const handleExportExcel = () => {
    const isPersonal = activeTab === "personal";
    if (isPersonal) {
        if (!filteredRecords.length) return toast.warning("Không có dữ liệu!");
        const exportData = filteredRecords.map((r) => ({
            ID: r.YeuCauID, "Họ tên": r.HoTen, "Email": r.Email, "SĐT": r.SoDienThoai,
            "Dịch vụ": translateService(typeof r.TenDichVu === 'object' ? r.TenDichVu?.name : r.TenDichVu),
            "Doanh thu trước CK": r.DoanhThuTruocChietKhau || 0,
            "Chiết khấu": (r.MucChietKhau || 0) + "%",
            "Sau CK": r.DoanhThuSauChietKhau || 0,
            "Invoice": ["Yes", "yes", "true", "1"].includes(String(r.Invoice)) ? "Có" : "Không",
        }));
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "CaNhan");
        XLSX.writeFile(workbook, "DoanhThu_CaNhan.xlsx");
    } else {
        if (!filteredCompanyRecords.length) return toast.warning("Không có dữ liệu!");
        // Export detail B2B list instead of aggregated if filters are applied, or both
        const exportData = filteredCompanyRecords.map((r) => ({
             "Tên Doanh Nghiệp": r.TenDoanhNghiep, 
             "Dịch Vụ": r.TenDichVu,
             "Doanh Thu Trước CK": r.DoanhThuTruocChietKhau || 0,
             "Chiết khấu": (r.MucChietKhau || 0) + "%",
             "Doanh Thu Sau CK": r.DoanhThuSauChietKhau || 0,
             "Invoice": ["Yes", "yes", "true", "1"].includes(String(r.Invoice || r.YeuCauHoaDon)) ? "Có" : "Không",
        }));
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "DoanhNghiep_ChiTiet");
        XLSX.writeFile(workbook, "DoanhThu_DoanhNghiep.xlsx");
    }
  };

 const currentTotalRevenue = activeTab === "personal"
    ? filteredRecords.reduce((sum, item) => sum + (parseFloat(item.DoanhThuSauChietKhau) || parseFloat(item.DoanhThu) || 0), 0)
    : filteredCompanyRecords.reduce((sum, item) => sum + (parseFloat(item.DoanhThuSauChietKhau) || 0), 0); 

  const serviceOptions = ["tatca", ...new Set(records.map((r) => translateService(typeof r.LoaiDichVu==='object'?r.LoaiDichVu.name:r.LoaiDichVu)).filter(Boolean))];
  const fixedDiscounts = [5, 10, 12, 15, 17, 30];

  return (
    <div style={{ display: "flex", background: "#f8fafc", minHeight: "100vh" }}>
      <Sidebar collapsed={collapsed} user={currentUser} />
      <div style={{ flex: 1, marginLeft: collapsed ? "60px" : "250px", display: "flex", flexDirection: "column", height: "100vh" }}>
        <Header currentUser={currentUser} showSidebar={!collapsed} onToggleSidebar={() => setCollapsed((s) => !s)} onOpenEditModal={() => setShowEditModal(true)} hasNewRequest={false} currentLanguage={currentLanguage} onLanguageChange={(lang) => { setCurrentLanguage(lang); localStorage.setItem("language", lang); }} />
        {showEditModal && <EditProfileModal currentUser={currentUser} onUpdate={(u) => localStorage.setItem("currentUser", JSON.stringify(u))} onClose={() => setShowEditModal(false)} currentLanguage={currentLanguage} />}
        
        <div style={{ flex: 1, overflowY: "auto", marginTop: "70px", background: "#f9fafb", padding: "32px 48px" }}>
          <h3 style={{ color: "#1e3a8a", fontWeight: 700, marginBottom: "20px" }}>{t.title}</h3>

          {/* TABS */}
          <div className="d-flex gap-2 mb-4 border-bottom">
            <button onClick={() => setActiveTab("personal")} style={{ padding: "10px 20px", border: "none", background: "transparent", borderBottom: activeTab === "personal" ? "3px solid #2563eb" : "3px solid transparent", color: activeTab === "personal" ? "#2563eb" : "#64748b", fontWeight: 600, cursor: "pointer" }}>{t.personalTab}</button>
            <button onClick={() => setActiveTab("company")} style={{ padding: "10px 20px", border: "none", background: "transparent", borderBottom: activeTab === "company" ? "3px solid #2563eb" : "3px solid transparent", color: activeTab === "company" ? "#2563eb" : "#64748b", fontWeight: 600, cursor: "pointer" }}>{t.companyTab}</button>
          </div>

          {/* TOP FILTER (CHART FILTER) */}
          <div className="d-flex flex-wrap gap-2 justify-content-between mb-4">
             <div className="d-flex gap-2 align-items-center">
              <input type="date" className="form-control" style={{width: 140}} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <span>→</span>
              <input type="date" className="form-control" style={{width: 140}} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              <select className="form-select" style={{width: 100}} value={viewMode} onChange={(e) => { setViewMode(e.target.value); activeTab === "personal" ? prepareChartData(filteredRecords, e.target.value, "personal") : prepareChartData(filteredCompanyRecords, e.target.value, "company"); }}>
                <option value="ngay">Ngày</option><option value="tuan">Tuần</option><option value="thang">Tháng</option><option value="nam">Năm</option>
              </select>
              {activeTab === "personal" && (
                <>
                  <select className="form-select" style={{width: 150}} value={selectedService} onChange={(e) => setSelectedService(e.target.value)}>{serviceOptions.map((s, i) => <option key={i} value={s}>{s === "tatca" ? t.allServices : s}</option>)}</select>
                  
                  <select className="form-select" style={{width: 170}} value={selectedStaff} onChange={(e) => setSelectedStaff(e.target.value)}>
                      <option value="tatca">{t.allStaff}</option>
                      {staffList.map((u) => (
                          <option key={u.id} value={u.username}>{u.username}</option>
                      ))}
                  </select>
                </>
              )}
              <button onClick={handleFilter} className="btn btn-primary">{t.filter}</button>
            </div>
          </div>

          <div className="bg-white rounded-3 p-4 shadow-sm mb-4" style={{ minHeight: "360px" }}>
            <h5 className="text-primary fw-bold mb-3">{t.chartTitle} {activeTab === "personal" ? t.chartPersonal : t.chartBusiness}</h5>
            {loading ? <p>{t.loadingChart}</p> : (
              activeTab === "personal" ? (
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(v) => formatCurrency(v)} width={100} />
                      <Tooltip labelFormatter={(label) => `${t.time}: ${label}`} formatter={(v) => [formatCurrency(v) + " " + t.revenueUnit, t.revenue]} />
                      <Legend />
                      <Line type="monotone" dataKey="doanhthu" stroke="#2563eb" strokeWidth={2} name={t.revenue} />
                    </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="row">
                    <div className="col-md-8">
                         <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={companyLineChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis tickFormatter={(v) => formatCurrency(v)} width={90} />
                                <Tooltip labelFormatter={(label) => `${t.time}: ${label}`} formatter={(v) => [formatCurrency(v) + " " + t.revenueUnit, t.revenue]} />
                                <Legend />
                                <Line type="monotone" dataKey="doanhthu" stroke="#16a34a" strokeWidth={2} name={t.revenue} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="col-md-4">
                         <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={companyPieChartData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name" label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                                    {companyPieChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(v) => formatCurrency(v) + " " + t.revenueUnit} />
                                <Legend layout="vertical" verticalAlign="middle" align="right" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
              )
            )}
          </div>
          
          {/* SEARCH & MENU FILTER & REVENUE */}
          <div className="d-flex justify-content-between align-items-end mb-3 flex-wrap">
             <div className="d-flex gap-2 align-items-center flex-wrap">
                 <input 
                    type="text" className="form-control" style={{ width: 250, height: "42px" }} 
                    placeholder={activeTab === "personal" ? "Tìm theo tên, email..." : "Tìm tên công ty..."} 
                    value={activeTab === "personal" ? searchTerm : companySearchTerm} 
                    onChange={(e) => activeTab === "personal" ? setSearchTerm(e.target.value) : setCompanySearchTerm(e.target.value)} 
                 />
                 
                 {/* BỘ LỌC MENU ĐA CẤP (HIỆN CHO CẢ 2 TAB) */}
                    <div className="position-relative" ref={filterMenuRef}>
                        <button 
                            className="btn btn-primary d-flex align-items-center gap-2" 
                            style={{height: "42px", fontWeight: "500"}}
                            onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                        >
                            <Filter size={16} />
                        </button>

                        {/* Dropdown Menu Chính */}
                        {isFilterMenuOpen && (
                            <div className="dropdown-menu show shadow-lg p-0" style={{ position: "absolute", top: "100%", left: 0, width: "220px", marginTop: "8px", border: "1px solid #cbd5e1", borderRadius: "8px", zIndex: 100 }}>
                                <ul className="list-unstyled mb-0 py-2">
                                    {/* 1. Người phụ trách */}
                                    <li className="px-3 py-2 d-flex justify-content-between align-items-center position-relative hover-bg-light cursor-pointer group-item">
                                        <span>{t.filterStaff}</span>
                                        <ChevronRight size={16} className="text-muted" />
                                        
                                        {/* Submenu Người phụ trách */}
                                        <div className="submenu shadow-lg rounded-2 border" style={{ position: "absolute", left: "100%", top: 0, width: "240px", background: "white", maxHeight: "300px", overflowY: "auto", display: "none" }}>
                                            <div className="p-2">
                                                <div 
                                                    className={`p-2 rounded cursor-pointer ${tableSelectedStaff === "tatca" ? "bg-primary text-white" : "hover-bg-light"}`}
                                                    onClick={() => { setTableSelectedStaff("tatca"); setIsFilterMenuOpen(false); }}
                                                >
                                                    Tất cả
                                                </div>
                                                {staffList.map((user) => (
                                                    <div 
                                                        key={user._id || user.id} 
                                                        className={`p-2 rounded cursor-pointer d-flex justify-content-between ${tableSelectedStaff === user.username ? "bg-primary text-white" : "hover-bg-light"}`}
                                                        onClick={() => { setTableSelectedStaff(user.username); setIsFilterMenuOpen(false); }}
                                                    >
                                                        <span>{user.username}</span>
                                                        {tableSelectedStaff === user.username && <Check size={16} />}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </li>

                                    {/* 2. Hóa đơn */}
                                    <li className="px-3 py-2 d-flex justify-content-between align-items-center position-relative hover-bg-light cursor-pointer group-item">
                                        <span>{t.filterInvoice}</span>
                                        <ChevronRight size={16} className="text-muted" />

                                        {/* Submenu Hóa đơn */}
                                        <div className="submenu shadow-lg rounded-2 border" style={{ position: "absolute", left: "100%", top: 0, width: "200px", background: "white", display: "none" }}>
                                            <div className="p-2">
                                                <div className={`p-2 rounded cursor-pointer ${tableSelectedInvoice === "tatca" ? "bg-primary text-white" : "hover-bg-light"}`} onClick={() => { setTableSelectedInvoice("tatca"); setIsFilterMenuOpen(false); }}>Tất cả</div>
                                                <div className={`p-2 rounded cursor-pointer ${tableSelectedInvoice === "yes" ? "bg-primary text-white" : "hover-bg-light"}`} onClick={() => { setTableSelectedInvoice("yes"); setIsFilterMenuOpen(false); }}>{t.invoiceYes}</div>
                                                <div className={`p-2 rounded cursor-pointer ${tableSelectedInvoice === "no" ? "bg-primary text-white" : "hover-bg-light"}`} onClick={() => { setTableSelectedInvoice("no"); setIsFilterMenuOpen(false); }}>{t.invoiceNo}</div>
                                            </div>
                                        </div>
                                    </li>

                                    {/* 3. Chiết khấu */}
                                    <li className="px-3 py-2 d-flex justify-content-between align-items-center position-relative hover-bg-light cursor-pointer group-item">
                                        <span>{t.filterDiscount}</span>
                                        <ChevronRight size={16} className="text-muted" />

                                        {/* Submenu Chiết khấu */}
                                        <div className="submenu shadow-lg rounded-2 border" style={{ position: "absolute", left: "100%", top: 0, width: "180px", background: "white", display: "none" }}>
                                            <div className="p-2">
                                                <div className={`p-2 rounded cursor-pointer ${tableSelectedDiscount === "tatca" ? "bg-primary text-white" : "hover-bg-light"}`} onClick={() => { setTableSelectedDiscount("tatca"); setIsFilterMenuOpen(false); }}>Tất cả</div>
                                                {fixedDiscounts.map((d) => (
                                                    <div 
                                                        key={d} 
                                                        className={`p-2 rounded cursor-pointer d-flex justify-content-between ${String(tableSelectedDiscount) === String(d) ? "bg-primary text-white" : "hover-bg-light"}`} 
                                                        onClick={() => { setTableSelectedDiscount(d); setIsFilterMenuOpen(false); }}
                                                    >
                                                        <span>{d}%</span>
                                                        {String(tableSelectedDiscount) === String(d) && <Check size={16} />}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* HIỂN THỊ CÁC TAG ĐANG LỌC */}
                    <div className="d-flex gap-2 align-items-center">
                        {tableSelectedStaff !== "tatca" && (
                            <div className="badge bg-white text-dark border d-flex align-items-center px-2 py-2" style={{fontSize: "13px", fontWeight: "500"}}>
                                <span className="text-secondary me-1">{t.filterStaff}:</span> {tableSelectedStaff}
                                <X size={14} className="ms-2 cursor-pointer text-muted hover-text-danger" onClick={() => setTableSelectedStaff("tatca")} />
                            </div>
                        )}
                        {tableSelectedInvoice !== "tatca" && (
                            <div className="badge bg-white text-dark border d-flex align-items-center px-2 py-2" style={{fontSize: "13px", fontWeight: "500"}}>
                                <span className="text-secondary me-1">{t.filterInvoice}:</span> 
                                {tableSelectedInvoice === "yes" ? t.invoiceYes : t.invoiceNo}
                                <X size={14} className="ms-2 cursor-pointer text-muted hover-text-danger" onClick={() => setTableSelectedInvoice("tatca")} />
                            </div>
                        )}
                        {tableSelectedDiscount !== "tatca" && (
                            <div className="badge bg-white text-dark border d-flex align-items-center px-2 py-2" style={{fontSize: "13px", fontWeight: "500"}}>
                                <span className="text-secondary me-1">{t.filterDiscount}:</span> {tableSelectedDiscount}%
                                <X size={14} className="ms-2 cursor-pointer text-muted hover-text-danger" onClick={() => setTableSelectedDiscount("tatca")} />
                            </div>
                        )}
                    </div>
             </div>

             <div className="d-flex flex-column align-items-end gap-2">
              
                <div className="text-end bg-white px-3 py-2 rounded border border-primary shadow-sm" style={{minWidth: 200, marginRight: 10}}>
                    <div className="text-muted text-uppercase small fw-bold mb-0" style={{fontSize: "11px"}}>{t.totalRevenue}:</div>
                    <div className="fw-bold text-primary" style={{fontSize: "18px", lineHeight: "1.2"}}>{formatCurrency(currentTotalRevenue)} {t.revenueUnit}</div>
                </div>
       
                <div className="d-flex align-items-center gap-2" style={{marginRight: 10}}>
                     {/* Nút Ẩn/Hiện Cột */}
                        <div className="position-relative" ref={columnMenuRef}>
                            <button 
                                className="btn btn-light border btn-sm shadow-sm px-3 py-2 text-secondary"
                                onClick={() => setIsColumnMenuOpen(!isColumnMenuOpen)}
                                title={t.toggleColumns}
                            >
                                <LayoutGrid size={18} />
                            </button>
                            {isColumnMenuOpen && (
                                <div className="dropdown-menu show shadow-lg p-2" style={{ position: "absolute", top: "100%", right: 0, width: "220px", marginTop: "8px", border: "1px solid #cbd5e1", borderRadius: "8px", zIndex: 100 }}>
                                    {Object.keys(columnLabels).map((key) => (
                                        <div 
                                            key={key} 
                                            className="d-flex align-items-center justify-content-between p-2 rounded hover-bg-light cursor-pointer"
                                            onClick={() => toggleColumn(key)}
                                        >
                                            <span style={{fontSize: "13px"}}>{columnLabels[key]}</span>
                                            {visibleColumns[key] && <Check size={16} className="text-success" />}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                     {/* Nút Xuất Excel */}
                     <button onClick={handleExportExcel} className="btn btn-success btn-sm d-flex align-items-center gap-2 shadow-sm px-3 py-2">
                        <i className="bi bi-file-earmark-excel"></i> {t.excel}
                    </button>
                </div>
             </div>
          </div>

          {/* TABLES */}
          {activeTab === "personal" ? (
            <PersonalTable
              loading={loading}
              data={filteredRecords}
              handleSaveRow={handleSavePersonalRow}
              handleDeleteRow={handleDeleteRow}
              savingRow={savingRow}
              totalPages={totalPages}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              currentLanguage={currentLanguage}
              visibleColumns={visibleColumns} 
            />
          ) : (
            <CompanyTable 
              loading={loading} 
              data={filteredCompanyRecords} 
              currentPage={companyCurrentPage} 
              setCurrentPage={setCompanyCurrentPage} 
              totalPages={companyTotalPages} 
              currentLanguage={currentLanguage} 
              visibleColumns={visibleColumns}
              handleSaveRow={handleSaveCompanyRow}
              handleDeleteRow={handleDeleteCompanyRow}
              savingRow={savingRow}
              t={t}
            />
          )}
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={2000} />
      <style>{`
        .table-custom th { background-color: #2c4d9e !important; color: white !important; vertical-align: middle; text-align: center; font-size: 13px; border: 1px solid #4a6fdc;}
        .table-custom td { vertical-align: middle; font-size: 13px; border: 1px solid #dee2e6; }
        .inp-edit { width: 100%; border: 1px solid transparent; background: transparent; text-align: right; font-weight: 500; outline: none; }
        .inp-edit:focus { border: 1px solid #3b82f6; background: #fff; border-radius: 4px; padding: 2px 4px; }
        
        /* CSS cho Menu bộ lọc */
        .group-item:hover { background-color: #f1f5f9; }
        .group-item:hover .submenu { display: block !important; }
        .hover-bg-light:hover { background-color: #f1f5f9; }
        .cursor-pointer { cursor: pointer; }
        .hover-text-danger:hover { color: #dc3545 !important; }
      `}</style>
    </div>
  );
}

const PersonalRow = ({ item, index, onSave, onDelete, savingRow, visibleColumns }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    // ... (Giữ nguyên phần state formData và useEffect)
    const [formData, setFormData] = useState({
        DoanhThuTruocChietKhau: formatCurrency(item.DoanhThuTruocChietKhau || item.DoanhThu || 0),
        MucChietKhau: item.MucChietKhau || 0,
        Invoice: ["Yes", "yes", "true", "1"].includes(String(item.Invoice)) ? "Yes" : "No",
        InvoiceUrl: item.InvoiceUrl || ""
    });

    useEffect(() => {
        setFormData({
            DoanhThuTruocChietKhau: formatCurrency(item.DoanhThuTruocChietKhau || item.DoanhThu || 0),
            MucChietKhau: item.MucChietKhau || 0,
            Invoice: ["Yes", "yes", "true", "1"].includes(String(item.Invoice)) ? "Yes" : "No",
            InvoiceUrl: item.InvoiceUrl || ""
        });
        setSelectedFile(null);
    }, [item]);
    // ...

    const handleChange = (field, val) => setFormData(prev => ({ ...prev, [field]: val }));

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleSaveClick = async () => {
        let finalUrl = formData.InvoiceUrl;
        if (selectedFile) {
            setUploading(true);
            try {
                const formUpload = new FormData();
                formUpload.append("file", selectedFile);
                const res = await fetch("https://onepasscms-backend.onrender.com/api/upload-invoice", {
                    method: "POST",
                    body: formUpload
                });
                const data = await res.json();
                if (data.success) {
                    finalUrl = data.url;
                    // Cập nhật state ngay lập tức để hiển thị
                    setFormData(prev => ({ ...prev, InvoiceUrl: finalUrl, Invoice: "Yes" }));
                } else {
                    toast.error("Lỗi upload: " + data.message);
                    setUploading(false);
                    return;
                }
            } catch (err) {
                toast.error("Lỗi kết nối upload");
                setUploading(false);
                return;
            }
            setUploading(false);
        }
        await onSave(item.YeuCauID, { ...formData, InvoiceUrl: finalUrl });
        setIsEditing(false);
        setSelectedFile(null);
    };

    const handleCancelClick = () => {
        setIsEditing(false);
        setSelectedFile(null);
        setFormData({
            DoanhThuTruocChietKhau: formatCurrency(item.DoanhThuTruocChietKhau || item.DoanhThu || 0),
            MucChietKhau: item.MucChietKhau || 0,
            Invoice: ["Yes", "yes", "true", "1"].includes(String(item.Invoice)) ? "Yes" : "No",
            InvoiceUrl: item.InvoiceUrl || ""
        });
    };
    
    // ... (Giữ nguyên logic tính toán tiền)
    const dtTruoc = parseCurrency(formData.DoanhThuTruocChietKhau);
    const ck = parseFloat(formData.MucChietKhau) || 0;
    const tienCK = (dtTruoc * ck) / 100;
    const dtSau = dtTruoc - tienCK;

    const editBgColor = "#fff9c4"; 
    const editBorderColor = "#fff9c4"; 
    const rowBackgroundColor = isEditing ? editBgColor : (index % 2 === 0 ? "#f9fafb" : "white");

    const cellStyle = {
        verticalAlign: "middle",
        backgroundColor: "transparent", 
        borderBottom: "1px solid #dee2e6"
    };
    const inputStyle = {
        width: "100%", height: "100%", 
        border: `1px solid ${editBorderColor}`,
        background: "#fff", 
        textAlign: "center", outline: "none", fontWeight: "bold", 
        display: "block", margin: 0, fontSize: "13px",
        color: "#000", borderRadius: "4px", padding: "4px"
    };
    const tdEditPadding = { ...cellStyle, padding: "4px", height: "40px" };

    return (
        <tr style={{ backgroundColor: rowBackgroundColor }}>
            {visibleColumns.stt && <td className="text-center" style={cellStyle}>{item.YeuCauID}</td>}
            {visibleColumns.khachHang && <td className="text-center fw-semibold" style={cellStyle}>{item.HoTen}</td>}
            {visibleColumns.loaiDichVu && (
                <td className="text-center text-truncate" style={{ maxWidth: 100, ...cellStyle }}>
                    {translateService(typeof item.LoaiDichVu === 'object' ? item.LoaiDichVu?.name : item.LoaiDichVu)}
                </td>
            )}
            {visibleColumns.tenDichVu && <td style={cellStyle}>{item.TenDichVu}</td>}
            {visibleColumns.nguoiPhuTrach && <td className="text-center" style={cellStyle}>{typeof item.NguoiPhuTrach === 'object' ? item.NguoiPhuTrach?.name : item.NguoiPhuTrach}</td>}

            {visibleColumns.invoiceYN && (
                <td className="text-center" style={isEditing ? tdEditPadding : cellStyle}>
                    {isEditing ? (
                        <select
                            value={formData.Invoice}
                            onChange={(e) => handleChange("Invoice", e.target.value)}
                            style={{ ...inputStyle, cursor: "pointer", color: formData.Invoice === "Yes" ? "green" : "gray" }}
                        >
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                        </select>
                    ) : (
                        <span>{formData.Invoice === "Yes" ? "Yes" : "No"}</span>
                    )}
                </td>
            )}

            {/* --- CỘT INVOICE ĐƯỢC SỬA ĐỔI --- */}
            {visibleColumns.invoiceFile && (
                <td className="text-center" style={cellStyle}>
                    <div className="d-flex align-items-center justify-content-center gap-2">
                        {/* 1. Luôn hiển thị link cũ nếu có (cả khi đang Edit) */}
                        {formData.InvoiceUrl && (
                            <a 
                                href={formData.InvoiceUrl} target="_blank" rel="noreferrer" 
                                className="btn btn-sm btn-outline-primary border p-0 d-flex align-items-center justify-content-center"
                                style={{ width: 30, height: 30 }}
                                title="Xem file hiện tại"
                            >
                                <FileText size={16} />
                            </a>
                        )}

                        {/* 2. Khi đang Edit: Hiện thêm nút Upload */}
                        {isEditing && (
                            <div className="position-relative">
                                <input 
                                    type="file" id={`file-upload-${item.YeuCauID}`} style={{ display: "none" }} 
                                    onChange={handleFileChange} accept=".pdf,.jpg,.png,.doc,.docx"
                                />
                                <label 
                                    htmlFor={`file-upload-${item.YeuCauID}`} 
                                    className={`btn btn-sm ${selectedFile ? 'btn-success' : 'btn-light border'} p-0 d-flex align-items-center justify-content-center`}
                                    style={{ 
                                        width: 30, height: 30, cursor: "pointer", 
                                        color: selectedFile ? "#fff" : "#0d6efd"
                                    }}
                                    title={selectedFile ? "Đã chọn file" : "Tải file mới lên"}
                                >
                                    {selectedFile ? <Check size={16} /> : <Upload size={16} />}
                                </label>
                            </div>
                        )}
                        
                        {/* 3. Nếu không có file và không edit */}
                        {!isEditing && !formData.InvoiceUrl && <span className="text-muted small">-</span>}
                    </div>
                </td>
            )}

            {visibleColumns.dtTruoc && (
                <td style={isEditing ? tdEditPadding : { ...cellStyle, textAlign: "center" }}>
                    {isEditing ? (
                        <input type="text" value={formData.DoanhThuTruocChietKhau}
                            onChange={(e) => { const val = e.target.value.replace(/\D/g, ""); handleChange("DoanhThuTruocChietKhau", formatCurrency(val)); }}
                            style={inputStyle}
                        />
                    ) : <span>{formData.DoanhThuTruocChietKhau}</span>}
                </td>
            )}

            {/* ... Các cột còn lại giữ nguyên ... */}
            {visibleColumns.mucCK && (
                <td className="text-center" style={isEditing ? tdEditPadding : cellStyle}>
                    {isEditing ? (
                        <select value={formData.MucChietKhau} onChange={(e) => handleChange("MucChietKhau", e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                            <option value="0">0%</option><option value="5">5%</option><option value="10">10%</option><option value="12">12%</option><option value="15">15%</option><option value="17">17%</option><option value="30">30%</option>
                        </select>
                    ) : <span>{formData.MucChietKhau}%</span>}
                </td>
            )}

            {visibleColumns.tienCK && <td className="text-center text-muted" style={cellStyle}>{formatCurrency(tienCK)}</td>}
            {visibleColumns.dtSau && <td className="text-center fw-bold text-primary" style={cellStyle}>{formatCurrency(dtSau)}</td>}

            {visibleColumns.hanhDong && (
                <td className="text-center" style={cellStyle}>
                    <div className="d-flex justify-content-center gap-2">
                        {isEditing ? (
                            <>
                                <button onClick={handleSaveClick} disabled={savingRow === item.YeuCauID || uploading} className="btn btn-sm btn-success text-white p-0 d-flex align-items-center justify-content-center" style={{ width: 30, height: 30 }}>
                                    {(savingRow === item.YeuCauID || uploading) ? <span className="spinner-border spinner-border-sm" style={{width: "1rem", height: "1rem"}}></span> : <Save size={16} />}
                                </button>
                                <button onClick={handleCancelClick} disabled={uploading} className="btn btn-sm btn-secondary text-white p-0 d-flex align-items-center justify-content-center" style={{ width: 30, height: 30 }}>
                                    <span style={{ fontWeight: "bold", fontSize: "14px" }}>X</span>
                                </button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => setIsEditing(true)} className="btn btn-sm btn-light border text-primary p-0 d-flex align-items-center justify-content-center" style={{ width: 30, height: 30, background: "white" }}>
                                    <Edit size={16} />
                                </button>
                                <button onClick={() => onDelete(item.YeuCauID)} className="btn btn-sm btn-light border text-danger p-0 d-flex align-items-center justify-content-center" style={{ width: 30, height: 30, background: "white" }}>
                                    <Trash2 size={16} />
                                </button>
                            </>
                        )}
                    </div>
                </td>
            )}
        </tr>
    );
};

const PersonalTable = ({ loading, data, handleSaveRow, handleDeleteRow, savingRow, totalPages, currentPage, setCurrentPage, currentLanguage, visibleColumns }) => (
  <div className="bg-white rounded-3 shadow-sm p-0 overflow-hidden">
    <div className="table-responsive">
      {loading ? <div className="p-4 text-center">Đang tải dữ liệu...</div> : (
        <table className="table table-custom mb-0" style={{ minWidth: "1200px" }}>
          <thead>
            <tr>
              {visibleColumns.stt && <th style={{width: "50px"}}>STT</th>}
              {visibleColumns.khachHang && <th style={{width: "150px"}}>Khách Hàng</th>}
              {visibleColumns.loaiDichVu && <th style={{width: "120px"}}>Loại Dịch Vụ</th>}
              {visibleColumns.tenDichVu && <th>Tên dịch vụ</th>}
              {visibleColumns.nguoiPhuTrach && <th style={{width: "120px"}}>Người Phụ Trách</th>}
              {visibleColumns.invoiceYN && <th style={{width: "80px"}}>Invoice<br/>Y/N</th>}
              {visibleColumns.invoiceFile && <th style={{width: "60px"}}>Invoice</th>}
              {visibleColumns.dtTruoc && <th style={{width: "130px"}}>Doanh thu Trước Chiết Khấu</th>}
              {visibleColumns.mucCK && <th style={{width: "90px"}}> Mức Chiết khấu</th>}
              {visibleColumns.tienCK && <th style={{width: "130px"}}>Số tiền<br/>chiết khấu</th>}
              {visibleColumns.dtSau && <th style={{width: "130px"}}>Doanh thu<br/>Sau Chiết Khấu</th>}
              {visibleColumns.hanhDong && <th style={{width: "100px"}}>Hành động</th>}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan="12" className="p-4 text-center text-muted">Không có dữ liệu</td></tr>
            ) : (
              data.map((r, i) => (
                <PersonalRow 
                    key={r.YeuCauID} 
                    item={r} 
                    index={i} 
                    onSave={handleSaveRow} 
                    onDelete={handleDeleteRow}
                    savingRow={savingRow} 
                    visibleColumns={visibleColumns}
                />
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
     <PaginationControls currentPage={currentPage} totalPages={totalPages} setCurrentPage={setCurrentPage} totalItems={data.length} currentLanguage={currentLanguage} />
  </div>
);

const CompanyRow = ({ item, index, isFirstRow, rowCount, globalIndex, onSave, onDelete, savingRow, visibleColumns }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        DoanhThuTruocChietKhau: formatCurrency(item.DoanhThuTruocChietKhau || 0),
        MucChietKhau: item.MucChietKhau || 0,
        Invoice: ["Yes", "yes", "true", "1"].includes(String(item.YeuCauHoaDon || item.Invoice)) ? "Yes" : "No",
        InvoiceUrl: item.InvoiceUrl || ""
    });

    useEffect(() => {
        setFormData({
            DoanhThuTruocChietKhau: formatCurrency(item.DoanhThuTruocChietKhau || 0),
            MucChietKhau: item.MucChietKhau || 0,
            Invoice: ["Yes", "yes", "true", "1"].includes(String(item.YeuCauHoaDon || item.Invoice)) ? "Yes" : "No",
            InvoiceUrl: item.InvoiceUrl || ""
        });
        setSelectedFile(null);
    }, [item]);

    const handleChange = (field, val) => setFormData(prev => ({ ...prev, [field]: val }));

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleSaveClick = async () => {
        let finalUrl = formData.InvoiceUrl;
        if (selectedFile) {
            setUploading(true);
            try {
                const formUpload = new FormData();
                formUpload.append("file", selectedFile);
                const res = await fetch("https://onepasscms-backend.onrender.com/api/upload-invoice", {
                    method: "POST",
                    body: formUpload
                });
                const data = await res.json();
                if (data.success) {
                    finalUrl = data.url;
                    setFormData(prev => ({ ...prev, InvoiceUrl: finalUrl, Invoice: "Yes" }));
                } else {
                    toast.error("Lỗi upload: " + data.message);
                    setUploading(false);
                    return;
                }
            } catch (err) {
                toast.error("Lỗi kết nối upload");
                setUploading(false);
                return;
            }
            setUploading(false);
        }
        await onSave(item.ID, { ...formData, InvoiceUrl: finalUrl });
        setIsEditing(false);
        setSelectedFile(null);
    };

    const handleCancelClick = () => {
        setIsEditing(false);
        setSelectedFile(null);
        setFormData({
            DoanhThuTruocChietKhau: formatCurrency(item.DoanhThuTruocChietKhau || 0),
            MucChietKhau: item.MucChietKhau || 0,
            Invoice: ["Yes", "yes", "true", "1"].includes(String(item.YeuCauHoaDon || item.Invoice)) ? "Yes" : "No",
            InvoiceUrl: item.InvoiceUrl || ""
        });
    };

    // ... (Giữ nguyên logic tính toán tiền)
    const dtTruoc = parseCurrency(formData.DoanhThuTruocChietKhau);
    const ck = parseFloat(formData.MucChietKhau) || 0;
    const tienCK = (dtTruoc * ck) / 100;
    const dtSau = dtTruoc - tienCK;

    const editBgColor = "#fff9c4";
    const editBorderColor = "#fff9c4";
    const rowBackgroundColor = isEditing ? editBgColor : "white";

    const cellStyle = {
        verticalAlign: "middle",
        backgroundColor: isEditing ? editBgColor : "transparent",
        borderBottom: "1px solid #dee2e6"
    };
    const inputStyle = {
        width: "100%", height: "100%", 
        border: `1px solid ${editBorderColor}`,
        background: "#fff", 
        textAlign: "center", outline: "none", fontWeight: "bold", 
        display: "block", margin: 0, fontSize: "13px",
        color: "#000", borderRadius: "4px", padding: "4px"
    };
    const tdEditPadding = { ...cellStyle, padding: "4px", height: "40px" };

    return (
        <tr style={{ backgroundColor: rowBackgroundColor }}>
            {/* STT - Row Span */}
            {isFirstRow && visibleColumns.stt && (
                <td rowSpan={rowCount} className="text-center align-middle border bg-white" style={{ verticalAlign: "middle" , padding: "2px 4px", position: "relative", zIndex: 1, backgroundClip: "padding-box"}}>
                    {globalIndex}
                </td>
            )}

            {/* Company Name - Row Span */}
            {isFirstRow && visibleColumns.khachHang && (
                <td rowSpan={rowCount} className="fw-bold text-center ps-3 align-middle border bg-white"
                    style={{
                        color: "#1e40af", verticalAlign: "middle", padding: "2px 4px",
                        position: "relative", zIndex: 1, backgroundClip: "padding-box"
                    }}>
                    {item.TenDoanhNghiep || "—"}
                </td>
            )}

            {visibleColumns.loaiDichVu && <td style={{...cellStyle, textAlign:"center"}}>{translateService(item.LoaiDichVu)}</td>}
            {visibleColumns.tenDichVu && <td style={{...cellStyle, textAlign:"center"}}>{item.TenDichVu}</td>}
            {visibleColumns.nguoiPhuTrach && <td className="text-center" style={cellStyle}>{item.NguoiPhuTrachName || "-"}</td>}

            {visibleColumns.invoiceYN && (
                 <td className="text-center" style={isEditing ? tdEditPadding : cellStyle}>
                    {isEditing ? (
                        <select
                            value={formData.Invoice}
                            onChange={(e) => handleChange("Invoice", e.target.value)}
                            style={{ ...inputStyle, cursor: "pointer", color: formData.Invoice === "Yes" ? "green" : "gray" }}
                        >
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                        </select>
                    ) : (
                        <span>{formData.Invoice === "Yes" ? "Yes" : "No"}</span>
                    )}
                </td>
            )}

            {/* --- CỘT INVOICE ĐƯỢC SỬA ĐỔI CHO DOANH NGHIỆP --- */}
            {visibleColumns.invoiceFile && (
                <td className="text-center" style={cellStyle}>
                     <div className="d-flex align-items-center justify-content-center gap-2">
                        {/* 1. Luôn hiển thị link cũ nếu có */}
                        {formData.InvoiceUrl && (
                            <a 
                                href={formData.InvoiceUrl} target="_blank" rel="noreferrer" 
                                className="btn btn-sm btn-outline-primary border p-0 d-flex align-items-center justify-content-center"
                                style={{ width: 30, height: 30 }}
                                title="Xem file hiện tại"
                            >
                                <FileText size={16} />
                            </a>
                        )}

                        {/* 2. Khi đang Edit: Hiện thêm nút Upload */}
                        {isEditing && (
                            <div className="position-relative">
                                <input 
                                    type="file" id={`file-upload-b2b-${item.ID}`} style={{ display: "none" }} 
                                    onChange={handleFileChange} accept=".pdf,.jpg,.png,.doc,.docx"
                                />
                                <label 
                                    htmlFor={`file-upload-b2b-${item.ID}`} 
                                    className={`btn btn-sm ${selectedFile ? 'btn-success' : 'btn-light border'} p-0 d-flex align-items-center justify-content-center`}
                                    style={{ 
                                        width: 30, height: 30, cursor: "pointer", 
                                        color: selectedFile ? "#fff" : "#0d6efd"
                                    }}
                                    title={selectedFile ? "Đã chọn file" : "Tải file mới lên"}
                                >
                                    {selectedFile ? <Check size={16} /> : <Upload size={16} />}
                                </label>
                            </div>
                        )}

                         {/* 3. Nếu không có file và không edit */}
                         {!isEditing && !formData.InvoiceUrl && <span className="text-muted small">-</span>}
                    </div>
                </td>
            )}

            {visibleColumns.dtTruoc && (
                 <td style={isEditing ? tdEditPadding : { ...cellStyle, textAlign: "center" }}>
                    {isEditing ? (
                        <input type="text" value={formData.DoanhThuTruocChietKhau}
                            onChange={(e) => { const val = e.target.value.replace(/\D/g, ""); handleChange("DoanhThuTruocChietKhau", formatCurrency(val)); }}
                            style={inputStyle}
                        />
                    ) : <span>{formData.DoanhThuTruocChietKhau}</span>}
                </td>
            )}

            {visibleColumns.mucCK && (
                <td className="text-center" style={isEditing ? tdEditPadding : cellStyle}>
                     {isEditing ? (
                        <select value={formData.MucChietKhau} onChange={(e) => handleChange("MucChietKhau", e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                            <option value="0">0%</option><option value="5">5%</option><option value="10">10%</option><option value="12">12%</option><option value="15">15%</option><option value="17">17%</option><option value="30">30%</option>
                        </select>
                    ) : <span>{formData.MucChietKhau}%</span>}
                </td>
            )}

            {visibleColumns.tienCK && <td className="text-center align-middle text-muted" style={cellStyle}>{formatCurrency(tienCK)}</td>}
            {visibleColumns.dtSau && <td className="text-center pe-3 align-middle fw-bold text-primary" style={cellStyle}>{formatCurrency(dtSau)}</td>}

            {visibleColumns.hanhDong && (
                <td className="text-center align-middle" style={cellStyle}>
                    <div className="d-flex justify-content-center gap-2">
                        {isEditing ? (
                             <>
                                <button onClick={handleSaveClick} disabled={savingRow === item.ID || uploading} className="btn btn-sm btn-success text-white p-0 d-flex align-items-center justify-content-center" style={{ width: 30, height: 30 }}>
                                    {(savingRow === item.ID || uploading) ? <span className="spinner-border spinner-border-sm" style={{width: "1rem", height: "1rem"}}></span> : <Save size={16} />}
                                </button>
                                <button onClick={handleCancelClick} disabled={uploading} className="btn btn-sm btn-secondary text-white p-0 d-flex align-items-center justify-content-center" style={{ width: 30, height: 30 }}>
                                    <span style={{ fontWeight: "bold", fontSize: "14px" }}>X</span>
                                </button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => setIsEditing(true)} className="btn btn-sm btn-light border text-primary p-0 d-flex align-items-center justify-content-center" style={{ width: 30, height: 30, background: "white" }}>
                                    <Edit size={16} />
                                </button>
                                <button onClick={() => onDelete(item.ID)} className="btn btn-sm btn-light border text-danger p-0 d-flex align-items-center justify-content-center" style={{ width: 30, height: 30, background: "white" }}>
                                    <Trash2 size={16} />
                                </button>
                            </>
                        )}
                    </div>
                </td>
            )}
        </tr>
    );
};
const CompanyTable = ({ 
  loading, 
  data, 
  currentPage, 
  setCurrentPage, 
  totalPages, 
  currentLanguage, 
  visibleColumns, 
  handleSaveRow, 
  handleDeleteRow, 
  savingRow, 
  t 
}) => {
    const rowsPerPage = 20;
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = data.slice(indexOfFirstRow, indexOfLastRow);

    const uniqueCompanies = [...new Set(data.map(item => item.TenDoanhNghiep))];

    const groupedData = [];
    let currentGroup = [];

    currentRows.forEach((item, index) => {
        const companyName = item.TenDoanhNghiep || "—";
        const prevCompanyName = index > 0 ? currentRows[index - 1].TenDoanhNghiep || "" : "";
        if (companyName !== prevCompanyName && currentGroup.length > 0) {
            groupedData.push(currentGroup);
            currentGroup = [];
        }
        currentGroup.push(item);
    });
    if (currentGroup.length > 0) {
        groupedData.push(currentGroup);
    }

    return (
      <div className="bg-white rounded-3 shadow-sm p-0 overflow-hidden">
        <div className="table-responsive">
            {loading ? <p className="p-4 text-center">Đang tải dữ liệu...</p> : (
            <table className="table table-custom mb-0" style={{minWidth: "1300px"}}>
                <thead>
                <tr>
                    {visibleColumns.stt && <th style={{width: "50px"}}>STT</th>}
                    {visibleColumns.khachHang && <th className="text-center ps-3" style={{width: "200px"}}>Doanh Nghiệp</th>}
                    {visibleColumns.loaiDichVu && <th style={{width: "150px"}}>Loại Dịch Vụ</th>}
                    {visibleColumns.tenDichVu && <th>Tên dịch vụ</th>}
                    {visibleColumns.nguoiPhuTrach && <th style={{width: "140px"}}>Người Phụ Trách</th>}
                    {visibleColumns.invoiceYN && <th style={{width: "90px"}}>Invoice<br/>Y/N</th>}
                    {visibleColumns.invoiceFile && <th style={{width: "70px"}}>Invoice</th>}
                    {visibleColumns.dtTruoc && <th style={{width: "130px"}}>Doanh thu Trước Chiết Khấu</th>}
                    {visibleColumns.mucCK && <th style={{width: "100px"}}>Mức Chiết khấu</th>}
                    {visibleColumns.tienCK && <th style={{width: "130px"}}>Số Tiền<br/>Chiết khấu</th>}
                    {visibleColumns.dtSau && <th style={{width: "130px"}}>Doanh Thu<br/>Sau Chiết Khấu</th>}
                    {visibleColumns.hanhDong && <th style={{width: "100px"}}>Hành động</th>}
                </tr>
                </thead>
                <tbody>
                {currentRows.length === 0 ? (
                    <tr><td colSpan="12" className="p-3 text-muted text-center">{t.noData}</td></tr>
                ) : (
                    groupedData.map((group, groupIndex) => {
                        const rowCount = group.length;
                        const companyName = group[0].TenDoanhNghiep;
                        
                        // [LOGIC STT MỚI] Lấy số thứ tự dựa trên danh sách công ty duy nhất
                        // +1 để bắt đầu từ 1 thay vì 0
                        const companyStt = uniqueCompanies.indexOf(companyName) + 1;

                        return group.map((r, itemIndex) => {
                            const isFirstRow = itemIndex === 0;
                            return (
                                <CompanyRow
                                    key={r.ID || `${groupIndex}-${itemIndex}`}
                                    item={r}
                                    index={itemIndex}
                                    isFirstRow={isFirstRow}
                                    rowCount={rowCount}
                                    globalIndex={companyStt}
                                    
                                    onSave={handleSaveRow}
                                    onDelete={handleDeleteRow}
                                    savingRow={savingRow}
                                    visibleColumns={visibleColumns}
                                />
                            );
                        });
                    })
                )}
                </tbody>
            </table>
            )}
        </div>
        <PaginationControls 
            currentPage={currentPage} 
            totalPages={totalPages} 
            setCurrentPage={setCurrentPage} 
            totalItems={data.length} 
            currentLanguage={currentLanguage} 
        />
      </div>
    );
}
const PaginationControls = ({ currentPage, totalPages, setCurrentPage, totalItems, currentLanguage }) => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)
  );

  const goTo = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <div className="d-flex justify-content-between align-items-center px-3 py-2 border-top bg-white" style={{ marginTop: "0", borderTop: "1px solid #dee2e6" }}>
      <div className="text-muted small">
        {currentLanguage === "vi" 
          ? `Hiển thị ${totalItems} kết quả (trang ${currentPage}/${totalPages})` 
          : `Showing ${totalItems} results (page ${currentPage}/${totalPages})`}
      </div>

      <div className="d-flex justify-content-center align-items-center">
        <nav>
          <ul className="pagination pagination-sm mb-0 shadow-sm">
            <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
              <button className="page-link" onClick={() => goTo(currentPage - 1)}>&laquo;</button>
            </li>
            {pages.map((p, idx, arr) => (
              <React.Fragment key={p}>
                {idx > 0 && arr[idx - 1] !== p - 1 && (
                  <li className="page-item disabled"><span className="page-link">…</span></li>
                )}
                <li className={`page-item ${currentPage === p ? "active" : ""}`}>
                  <button className="page-link" onClick={() => goTo(p)}>{p}</button>
                </li>
              </React.Fragment>
            ))}
            <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
              <button className="page-link" onClick={() => goTo(currentPage + 1)}>&raquo;</button>
            </li>
          </ul>
        </nav>
        <div className="ms-3 text-muted small">
          {currentLanguage === "vi" ? `Trang ${currentPage}/${totalPages}` : `Page ${currentPage}/${totalPages}`}
        </div>
      </div>
    </div>
  );
};