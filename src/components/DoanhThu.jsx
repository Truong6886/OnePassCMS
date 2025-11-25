import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Save } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart, // Có thể giữ hoặc bỏ nếu không dùng bar chart nữa
  Bar,      // Có thể giữ hoặc bỏ
  PieChart, // ✅ Thêm PieChart
  Pie,      // ✅ Thêm Pie
  Cell,     // ✅ Thêm Cell
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import translateService from "../utils/translateService";
import EditProfileModal from "./EditProfileModal";
import useDashboardData from "./CMSDashboard/hooks/useDashboardData";
import * as XLSX from "xlsx";

// ✅ Định dạng tiền tệ
const formatCurrency = (num) => {
  if (num == null || num === "") return "0";
  const n = parseFloat(num);
  if (isNaN(n)) return "0";
  return n.toLocaleString("vi-VN");
};

// ✅ Màu cho biểu đồ tròn
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF", "#FF4560", "#775DD0"];

// ✅ Dịch ngôn ngữ
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
    revenue: "Doanh thu",
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
  const [viewMode, setViewMode] = useState("thang"); // Dùng chung cho cả 2 tab
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentLanguage, setCurrentLanguage] = useState(
    localStorage.getItem("language") || "vi"
  );

  const t = translations[currentLanguage];
  const savedUser = localStorage.getItem("currentUser");
  const currentUser = savedUser ? JSON.parse(savedUser) : null;

  // --- DATA CÁ NHÂN ---
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [chartData, setChartData] = useState([]); // Line chart cá nhân
  const [savingRow, setSavingRow] = useState(null);
  const [selectedService, setSelectedService] = useState("tatca");
  const [selectedStaff, setSelectedStaff] = useState("tatca");
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  
  // --- DATA DOANH NGHIỆP ---
  const [approvedCompanies, setApprovedCompanies] = useState([]); 
  const [companyRecords, setCompanyRecords] = useState([]); 
  const [filteredCompanyRecords, setFilteredCompanyRecords] = useState([]); 
  const [aggregatedCompanyData, setAggregatedCompanyData] = useState([]); 
  const [companySearchTerm, setCompanySearchTerm] = useState("");
  const [companyCurrentPage, setCompanyCurrentPage] = useState(1);
  const [companyTotalPages, setCompanyTotalPages] = useState(1);
  
  // ✅ State mới cho biểu đồ doanh nghiệp
  const [companyLineChartData, setCompanyLineChartData] = useState([]);
  const [companyPieChartData, setCompanyPieChartData] = useState([]);

  if (!currentUser?.is_director && !currentUser?.is_accountant) {
    return (
      <div className="d-flex min-vh-100 bg-light align-items-center justify-content-center flex-column text-primary text-center fw-bold fs-5">
        <p>Bạn không có quyền truy cập trang “Doanh Thu”.</p>
        <p>Vui lòng quay lại trang chủ.</p>
      </div>
    );
  }
  
  // ================== HÀM TỔNG HỢP DỮ LIỆU DOANH NGHIỆP ==================
  const aggregateCompanyData = (services, companies) => {
    if (!companies || companies.length === 0) return [];
    
    const aggregated = companies.map(company => {
      let myServices = services.filter(s => 
        String(s.DoanhNghiepID) === String(company.ID)
      );

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

  // ================== API CÁ NHÂN ==================
  const fetchPersonalData = async (page = 1) => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://onepasscms-backend.onrender.com/api/yeucau?page=${page}&limit=${rowsPerPage}`
      );
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
      console.error(err);
      toast.error("Lỗi kết nối server!");
    } finally {
      setLoading(false);
    }
  };

  // ================== API DOANH NGHIỆP ==================
  const fetchCompanyData = async () => {
    setLoading(true);
    try {
      const [resApproved, resServices] = await Promise.all([
         fetch(`https://onepasscms-backend.onrender.com/api/b2b/approved?limit=1000`),
         fetch(`https://onepasscms-backend.onrender.com/api/b2b/services?limit=1000`)
      ]);

      const jsonApproved = await resApproved.json();
      const jsonServices = await resServices.json();

      if (jsonApproved.success && jsonServices.success) {
        const companies = jsonApproved.data || [];
        setApprovedCompanies(companies);

        const mappedServices = (jsonServices.data || []).map((item) => {
           const parseNum = (val) => {
             if (!val) return 0;
             if (typeof val === 'number') return val;
             return parseFloat(String(val).replace(/\./g, '')) || 0;
           };

           return {
             ...item,
             NgayTao: item.NgayThucHien || item.NgayTao, 
             DoanhThuTruocChietKhau: parseNum(item.DoanhThuTruocChietKhau),
             DoanhThuSauChietKhau: parseNum(item.DoanhThuSauChietKhau),
             DoanhThu: parseNum(item.DoanhThuSauChietKhau), // Dùng field DoanhThu để vẽ biểu đồ line
             TenDichVu: item.TenDichVu,
             DoanhNghiepID: item.DoanhNghiepID,
             TenDoanhNghiep: item.TenDoanhNghiep,
             Hang: item.Hang, 
             MucChietKhau: item.MucChietKhau
           };
        });

        setCompanyRecords(mappedServices);
        setFilteredCompanyRecords(mappedServices);
        
        // Tổng hợp bảng
        const aggregated = aggregateCompanyData(mappedServices, companies);
        setAggregatedCompanyData(aggregated);
        setCompanyTotalPages(Math.ceil(aggregated.length / 20));

        // ✅ Chuẩn bị dữ liệu biểu đồ doanh nghiệp
        prepareChartData(mappedServices, viewMode, "company");
        preparePieChartData(aggregated);

      } else {
        toast.error("Không thể tải dữ liệu doanh nghiệp!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối server!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "personal") {
      fetchPersonalData(currentPage);
    } else {
      fetchCompanyData();
    }
  }, [activeTab, currentPage, rowsPerPage]);

  // ================== XỬ LÝ BIỂU ĐỒ LINE (Dùng chung) ==================
  const prepareChartData = (data, mode, type) => {
    if (!data || data.length === 0) {
      if (type === "personal") setChartData([]);
      else setCompanyLineChartData([]);
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
      const val = parseFloat(r.DoanhThu || 0);
      group[key].doanhthu += isNaN(val) ? 0 : val;
    });

    const result = Object.values(group);
    
    if (type === "personal") {
      setChartData(result);
    } else {
      setCompanyLineChartData(result);
    }
  };

  // ✅ XỬ LÝ BIỂU ĐỒ PIE (Chỉ Doanh nghiệp)
  const preparePieChartData = (aggregatedData) => {
    if (!aggregatedData || aggregatedData.length === 0) {
      setCompanyPieChartData([]);
      return;
    }
    // Lấy top 5 doanh nghiệp doanh thu cao nhất
    const top5 = aggregatedData.slice(0, 5);
    const others = aggregatedData.slice(5);
    
    const othersTotal = others.reduce((sum, item) => sum + item.TotalRevenueAfter, 0);
    
    const pieData = top5.map(item => ({
      name: item.TenDoanhNghiep,
      value: item.TotalRevenueAfter
    }));

    if (othersTotal > 0) {
      pieData.push({ name: t.other, value: othersTotal });
    }
    setCompanyPieChartData(pieData);
  };

  useEffect(() => {
    const timeOutId = setTimeout(() => {
      handleFilter();
    }, 300);
    return () => clearTimeout(timeOutId);
  }, [searchTerm, companySearchTerm]);

  // ================== LỌC DỮ LIỆU ==================
  const handleFilter = () => {
    const isPersonal = activeTab === "personal";
    let filtered = isPersonal ? records : companyRecords;

    // 1. Lọc theo từ khóa
    const term = isPersonal ? searchTerm : companySearchTerm;
    if (term.trim() !== "") {
      const keyword = term.toLowerCase();
      filtered = filtered.filter((r) => {
        if (isPersonal) {
          const hoten = r.HoTen?.toLowerCase() || "";
          const email = r.Email?.toLowerCase() || "";
          const sdt = r.SoDienThoai?.toLowerCase() || "";
          return hoten.includes(keyword) || email.includes(keyword) || sdt.includes(keyword);
        } else {
           const company = approvedCompanies.find(c => String(c.ID) === String(r.DoanhNghiepID));
           const companyName = company ? company.TenDoanhNghiep.toLowerCase() : "";
           return companyName.includes(keyword);
        }
      });
    }

    if (startDate || endDate) {
      filtered = filtered.filter((r) => {
        const date = new Date(r.NgayTao);
        const s = startDate ? new Date(startDate) : null;
        const e = endDate ? new Date(endDate) : null;
        if(s) s.setHours(0,0,0,0);
        if(e) e.setHours(23,59,59,999);
        if (s && date < s) return false;
        if (e && date > e) return false;
        return true;
      });
    }

    if (isPersonal) {
      if (selectedService !== "tatca") {
        filtered = filtered.filter((r) => {
          const dv = typeof r.TenDichVu === "object" ? r.TenDichVu?.name : r.TenDichVu;
          return translateService(dv) === selectedService;
        });
      }
      if (selectedStaff !== "tatca") {
        filtered = filtered.filter((r) => {
          const nv = typeof r.NguoiPhuTrach === "object" ? r.NguoiPhuTrach?.name : r.NguoiPhuTrach;
          return nv === selectedStaff;
        });
      }
    }

    if (isPersonal) {
      setFilteredRecords(filtered);
      prepareChartData(filtered, viewMode, "personal");
      setCurrentPage(1);
    } else {
      setFilteredCompanyRecords(filtered); 
      // Chuẩn bị lại Line chart cho doanh nghiệp sau khi lọc
      prepareChartData(filtered, viewMode, "company");

      // Tính toán lại bảng và Pie chart
      const aggregated = aggregateCompanyData(filtered, approvedCompanies);
      let finalAggregated = aggregated;
      if (companySearchTerm.trim() !== "") {
          const k = companySearchTerm.toLowerCase();
          finalAggregated = finalAggregated.filter(c => c.TenDoanhNghiep.toLowerCase().includes(k));
      }
      setAggregatedCompanyData(finalAggregated);
      preparePieChartData(finalAggregated);
      setCompanyCurrentPage(1);
      setCompanyTotalPages(Math.ceil(finalAggregated.length / 20));
    }
  };

  const handleSavePersonalRow = async (id, value) => {
    // ... Giữ nguyên logic cũ
    setSavingRow(id);
    try {
      const numericValue = parseFloat(value) || 0;
      const res = await fetch(
        `https://onepasscms-backend.onrender.com/api/yeucau/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ DoanhThu: numericValue }),
        }
      );
      const result = await res.json();
      if (result.success) {
        toast.success(`Lưu thành công YeuCauID ${id}`);
        fetchPersonalData(currentPage);
      } else {
        toast.error("❌ Lỗi khi cập nhật dữ liệu!");
      }
    } catch (err) {
      toast.error("Không thể kết nối server!");
    } finally {
      setSavingRow(null);
    }
  };

  const handleExportExcel = () => {
    // ... Giữ nguyên logic cũ
    const isPersonal = activeTab === "personal";
    if (isPersonal) {
        if (!filteredRecords || filteredRecords.length === 0) return toast.warning("Không có dữ liệu!");
        const exportData = filteredRecords.map((r) => ({
            ID: r.YeuCauID,
            "Họ tên": r.HoTen,
            Email: r.Email,
            "SĐT": r.SoDienThoai,
            "Dịch vụ": translateService(typeof r.TenDichVu === 'object' ? r.TenDichVu?.name : r.TenDichVu),
            "Doanh thu": r.DoanhThu || 0,
            "Ngày tạo": new Date(r.NgayTao).toLocaleString("vi-VN"),
        }));
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "CaNhan");
        XLSX.writeFile(workbook, "DoanhThu_CaNhan.xlsx");
    } else {
        if (!aggregatedCompanyData || aggregatedCompanyData.length === 0) return toast.warning("Không có dữ liệu!");
        const exportData = aggregatedCompanyData.map((r) => ({
            "Tên Doanh Nghiệp": r.TenDoanhNghiep,
            "Hạng": r.Rank,
            "Số Lượng Giao Dịch": r.Count,
            "Doanh Thu Trước Chiết Khấu": r.TotalRevenueBefore || 0,
            "Mức Chiết Khấu": r.DiscountRate + "%",
            "Doanh Thu Sau Chiết Khấu": r.TotalRevenueAfter || 0,
        }));
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "DoanhNghiepTongHop");
        XLSX.writeFile(workbook, "DoanhThu_DoanhNghiep_TongHop.xlsx");
    }
  };

  const serviceOptions = [
    "tatca",
    ...new Set(records.map((r) => translateService(typeof r.TenDichVu==='object'?r.TenDichVu.name:r.TenDichVu)).filter(Boolean)),
  ];
  const staffOptions = [
    "tatca",
    ...new Set(records.map((r) => (typeof r.NguoiPhuTrach==='object'?r.NguoiPhuTrach?.name:r.NguoiPhuTrach)).filter(Boolean)),
  ];

  return (
    <div style={{ display: "flex", background: "#f8fafc", minHeight: "100vh" }}>
      <Sidebar collapsed={collapsed} user={currentUser} />
      <div style={{ flex: 1, marginLeft: collapsed ? "60px" : "250px", display: "flex", flexDirection: "column", height: "100vh" }}>
        <Header
          currentUser={currentUser}
          showSidebar={!collapsed}
          onToggleSidebar={() => setCollapsed((s) => !s)}
          onOpenEditModal={() => setShowEditModal(true)}
          hasNewRequest={false}
          currentLanguage={currentLanguage}
          onLanguageChange={(lang) => {
            setCurrentLanguage(lang);
            localStorage.setItem("language", lang);
          }}
        />
        {showEditModal && (
          <EditProfileModal
            currentUser={currentUser}
            onUpdate={(u) => localStorage.setItem("currentUser", JSON.stringify(u))}
            onClose={() => setShowEditModal(false)}
            currentLanguage={currentLanguage}
          />
        )}

        <div style={{ flex: 1, overflowY: "auto", marginTop: "70px", background: "#f9fafb", padding: "32px 48px" }}>
          <h3 style={{ color: "#1e3a8a", fontWeight: 700, marginBottom: "20px" }}>{t.title}</h3>

          <div className="d-flex gap-2 mb-4 border-bottom">
            <button onClick={() => setActiveTab("personal")} style={{ padding: "10px 20px", border: "none", background: "transparent", borderBottom: activeTab === "personal" ? "3px solid #2563eb" : "3px solid transparent", color: activeTab === "personal" ? "#2563eb" : "#64748b", fontWeight: 600, cursor: "pointer" }}>{t.personalTab}</button>
            <button onClick={() => setActiveTab("company")} style={{ padding: "10px 20px", border: "none", background: "transparent", borderBottom: activeTab === "company" ? "3px solid #2563eb" : "3px solid transparent", color: activeTab === "company" ? "#2563eb" : "#64748b", fontWeight: 600, cursor: "pointer" }}>{t.companyTab}</button>
          </div>

          {/* THANH LỌC DATA */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
             <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <span>→</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />

              {/* ✅ Hiển thị Select ViewMode cho cả 2 tab */}
              <select
                value={viewMode}
                onChange={(e) => {
                  setViewMode(e.target.value);
                  if (activeTab === "personal") {
                    prepareChartData(filteredRecords, e.target.value, "personal");
                  } else {
                    prepareChartData(filteredCompanyRecords, e.target.value, "company");
                  }
                }}
              >
                <option value="ngay">Ngày</option>
                <option value="tuan">Tuần</option>
                <option value="thang">Tháng</option>
                <option value="nam">Năm</option>
              </select>

              {activeTab === "personal" && (
                <>
                  <select value={selectedService} onChange={(e) => setSelectedService(e.target.value)}>
                    {serviceOptions.map((s, i) => <option key={i} value={s}>{s === "tatca" ? t.allServices : s}</option>)}
                  </select>
                  <select value={selectedStaff} onChange={(e) => setSelectedStaff(e.target.value)}>
                    {staffOptions.map((s, i) => <option key={i} value={s}>{s === "tatca" ? t.allStaff : s}</option>)}
                  </select>
                </>
              )}

              <button
                onClick={handleFilter}
                style={{ background: "#2563eb", color: "white", border: "none", borderRadius: "6px", padding: "6px 12px", cursor: "pointer" }}
              >
                {t.filter}
              </button>
            </div>
          </div>

          {/* KHU VỰC BIỂU ĐỒ */}
          <div style={{ background: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", minHeight: "360px", marginBottom: "30px" }}>
            <h5 style={{ color: "#2563eb", fontWeight: 600, marginBottom: "10px" }}>
                {t.chartTitle} {activeTab === "personal" ? t.chartPersonal : t.chartBusiness}
            </h5>
            
            {loading ? (
              <p>{t.loadingChart}</p>
            ) : (
              activeTab === "personal" ? (
                // --- BIỂU ĐỒ CÁ NHÂN (Giữ nguyên) ---
                chartData.length === 0 ? <p>{t.noData}</p> : (
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
                )
              ) : (
                // --- BIỂU ĐỒ DOANH NGHIỆP (Split View) ---
                <div className="row">
                    {/* Bên trái: Line Chart theo thời gian */}
                    <div className="col-md-8">
                         <h6 className="text-center text-muted mb-2">Doanh thu theo thời gian</h6>
                         {companyLineChartData.length === 0 ? <p className="text-center">{t.noData}</p> : (
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
                         )}
                    </div>
                    
                    {/* Bên phải: Pie Chart tỷ trọng */}
                    <div className="col-md-4">
                         <h6 className="text-center text-muted mb-2">{t.proportion}</h6>
                         {companyPieChartData.length === 0 ? <p className="text-center">{t.noData}</p> : (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                <Pie
                                    data={companyPieChartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    nameKey="name"
                                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                        const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                                        const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
                                        return `${(percent * 100).toFixed(0)}%`;
                                    }}
                                >
                                    {companyPieChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v) => formatCurrency(v) + " " + t.revenueUnit} />
                                <Legend layout="vertical" verticalAlign="middle" align="right" />
                                </PieChart>
                            </ResponsiveContainer>
                         )}
                    </div>
                </div>
              )
            )}
          </div>

          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <input
              type="text"
              placeholder={activeTab === "personal" ? "Tìm theo tên, email..." : "Tìm tên công ty..."}
              value={activeTab === "personal" ? searchTerm : companySearchTerm}
              onChange={(e) => activeTab === "personal" ? setSearchTerm(e.target.value) : setCompanySearchTerm(e.target.value)}
              
              style={{ width: "320px", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: "8px" }}
            />
            <button
              onClick={handleExportExcel}
              style={{
                background: "#16a34a", color: "white", border: "none", borderRadius: "8px", padding: "8px 16px", cursor: "pointer", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px",
              }}
            >
              <i className="bi bi-file-earmark-excel"></i>
             {t.excel}
            </button>
          </div>

          {activeTab === "personal" ? (
            <PersonalTable
              loading={loading}
              data={filteredRecords}
              setFilteredRecords={setFilteredRecords}
              handleSaveRow={handleSavePersonalRow}
              savingRow={savingRow}
              totalPages={totalPages}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              currentLanguage={currentLanguage}
            />
          ) : (
            <CompanyTable 
              loading={loading}
              data={aggregatedCompanyData} 
              currentPage={companyCurrentPage}
              setCurrentPage={setCompanyCurrentPage}
              totalPages={companyTotalPages}
              currentLanguage={currentLanguage}
              t={t}
            />
          )}

        </div>
      </div>
      <ToastContainer position="top-right" autoClose={2500} hideProgressBar={false} />
    </div>
  );
}

/* ====== BẢNG CÁ NHÂN ====== */
const PersonalTable = ({
  loading, data, setFilteredRecords, handleSaveRow, savingRow, totalPages, currentPage, setCurrentPage, currentLanguage,
}) => {
    const onLocalChange = (id, val) => setFilteredRecords(prev => prev.map(r => r.YeuCauID === id ? {...r, DoanhThu: val} : r));
    return (
  <div style={{ background: "#fff", borderRadius: "12px", boxShadow: "0 4px 10px rgba(0,0,0,0.05)", padding: "16px", overflowX: "auto" }}>
    {loading ? <p>Đang tải dữ liệu...</p> : (
      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "center" }}>
        <thead>
          <tr style={{ background: "linear-gradient(135deg,#3b82f6,#1e40af)", color: "white", height: "45px" }}>
            <th>ID</th><th>Họ tên</th><th>Email</th><th>SĐT</th><th>Dịch vụ</th><th>Nhân viên</th><th>Doanh thu</th><th>Lưu</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr><td colSpan="8" className="p-3 text-muted">Không có dữ liệu</td></tr>
          ) : (
            data.map((r, i) => (
                <tr key={r.YeuCauID} style={{ background: i % 2 === 0 ? "#f9fafb" : "white" }}>
                  <td>{r.YeuCauID}</td><td>{r.HoTen}</td><td>{r.Email}</td><td>{r.SoDienThoai}</td>
                  <td>{translateService(typeof r.TenDichVu==='object'?r.TenDichVu?.name:r.TenDichVu)}</td>
                  <td>{typeof r.NguoiPhuTrach==='object'?r.NguoiPhuTrach?.name:r.NguoiPhuTrach}</td>
                  <td>
                    <input
                      type="text"
                      value={formatCurrency(r.DoanhThu)}
                      onChange={(e) => { const numericValue = parseFloat(e.target.value.replace(/\D/g, "") || "0"); onLocalChange(r.YeuCauID, numericValue); }}
                      style={{ width: "100%", textAlign: "right", padding: "6px", borderRadius: "6px", border: "1px solid #ddd" }}
                    />
                  </td>
                  <td>
                    <button onClick={() => handleSaveRow(r.YeuCauID, r.DoanhThu)} disabled={savingRow === r.YeuCauID} className="btn btn-sm btn-primary">
                      <Save size={16} />
                    </button>
                  </td>
                </tr>
            ))
          )}
        </tbody>
      </table>
    )}
     <PaginationControls currentPage={currentPage} totalPages={totalPages} setCurrentPage={setCurrentPage} totalItems={data.length} currentLanguage={currentLanguage} />
  </div>
)};

/* ====== BẢNG DOANH NGHIỆP ====== */
const CompanyTable = ({
  loading, data, currentPage, setCurrentPage, totalPages, currentLanguage, t
}) => {
    const indexOfLastRow = currentPage * 20;
    const indexOfFirstRow = indexOfLastRow - 20;
    const currentRows = data.slice(indexOfFirstRow, indexOfLastRow);

    return (
      <div style={{ background: "#fff", borderRadius: "12px", boxShadow: "0 4px 10px rgba(0,0,0,0.05)", padding: "16px", overflowX: "auto" }}>
        {loading ? <p>Đang tải dữ liệu...</p> : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "center" }}>
            <thead>
              <tr style={{ background: "linear-gradient(135deg,#3b82f6,#1e40af)", color: "white", height: "45px" }}>
                <th>STT</th>
                <th className="text-start ps-4">{t.companyName}</th>
                <th>{t.rank}</th>
                <th>{t.transactionCount}</th>
                <th>{t.revenueBefore}</th>
                <th>{t.discountRate}</th>
                <th className="text-end pe-4">{t.revenueAfter}</th>
              </tr>
            </thead>
            <tbody>
              {currentRows.length === 0 ? (
                 <tr><td colSpan="7" className="p-3 text-muted">{t.noData}</td></tr>
              ) : (
                currentRows.map((r, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#f9fafb" : "white" }}>
                    <td>{indexOfFirstRow + i + 1}</td>
                    <td className="fw-bold text-start ps-4 text-secondary">{r.TenDoanhNghiep}</td>
                     <td>
                        <span className={`badge ${
                            r.Rank === 'Diamond' ? 'bg-info text-dark' : 
                            r.Rank === 'Gold' ? 'bg-warning text-dark' : 
                            r.Rank === 'Silver' ? 'bg-secondary' : 
                            r.Rank === 'Platinum' ? 'bg-dark text-white' :
                            r.Rank === 'New-bie' ? 'bg-success' : 'bg-primary'
                        }`} style={{ minWidth: '80px' }}>
                            {r.Rank}
                        </span>
                    </td>
                    <td>{r.Count}</td>
                    <td>{formatCurrency(r.TotalRevenueBefore)}</td>
                    <td>{r.DiscountRate}%</td>
                    <td className="fw-bold text-end pe-4 text-primary">{formatCurrency(r.TotalRevenueAfter)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
        <PaginationControls currentPage={currentPage} totalPages={totalPages} setCurrentPage={setCurrentPage} totalItems={data.length} currentLanguage={currentLanguage} />
      </div>
    );
}

const PaginationControls = ({ currentPage, totalPages, setCurrentPage, totalItems, currentLanguage }) => (
    <div className="d-flex justify-content-between align-items-center px-3 py-3 border-top mt-2">
      <div className="text-muted small">
        {currentLanguage === "vi" ? `Hiển thị ${Math.min(20, totalItems)} hàng (Trang ${currentPage}/${totalPages})` : `Showing rows (Page ${currentPage}/${totalPages})`}
      </div>
      <nav>
          <ul className="pagination pagination-sm mb-0">
            <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
              <button className="page-link" onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>&laquo;</button>
            </li>
            <li className="page-item active">
                <span className="page-link">{currentPage}</span>
            </li>
            <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
              <button className="page-link" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>&raquo;</button>
            </li>
          </ul>
      </nav>
    </div>
);