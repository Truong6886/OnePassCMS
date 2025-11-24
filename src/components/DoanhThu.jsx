import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Save } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart, // ✅ Thêm BarChart
  Bar,      // ✅ Thêm Bar
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
  if (num == null || num === "") return "";
  const n = parseFloat(num);
  if (isNaN(n)) return num;
  return n.toLocaleString("vi-VN");
};

// ✅ Dịch ngôn ngữ
const translations = {
  vi: {
    title: "Tổng Doanh Thu",
    personalTab: "Doanh Thu Khách Hàng Cá Nhân",
    companyTab: "Doanh Thu Khách Hàng Doanh nghiệp",
    chartTitle: "Biểu đồ Tổng Doanh Thu",
    allServices: "Tất cả dịch vụ",
    allStaff: "Tất cả nhân viên",
    filter: "Lọc",
    noData: "Không có dữ liệu",
    loadingChart: "Đang tải biểu đồ...",
    revenue: "Doanh thu",
    time: "Thời gian",
    revenueUnit: "VNĐ",
    companyName: "Tên Doanh Nghiệp",
    transactionCount: "Số lượng Dịch Vụ",
    totalRevenue: "Tổng Doanh Thu",
  },
  en: {
    title: "Total Revenue",
    personalTab: "Individual Revenue",
    companyTab: "Company Revenue",
    chartTitle: "Total Revenue Chart",
    allServices: "All Services",
    allStaff: "All Staff",
    filter: "Filter",
    noData: "No data available",
    loadingChart: "Loading chart...",
    revenue: "Revenue",
    time: "Time",
    revenueUnit: "VND",
    companyName: "Company Name",
    transactionCount: "Transactions",
    totalRevenue: "Total Revenue",
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
  const [currentLanguage, setCurrentLanguage] = useState(
    localStorage.getItem("language") || "vi"
  );

  const t = translations[currentLanguage];
  const savedUser = localStorage.getItem("currentUser");
  const currentUser = savedUser ? JSON.parse(savedUser) : null;


  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [savingRow, setSavingRow] = useState(null);
  const [selectedService, setSelectedService] = useState("tatca");
  const [selectedStaff, setSelectedStaff] = useState("tatca");
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  
  const [approvedCompanies, setApprovedCompanies] = useState([]); 
  const [companyRecords, setCompanyRecords] = useState([]); 
  const [filteredCompanyRecords, setFilteredCompanyRecords] = useState([]); 
  const [aggregatedCompanyData, setAggregatedCompanyData] = useState([]); 
  const [companySearchTerm, setCompanySearchTerm] = useState("");
  const [companyCurrentPage, setCompanyCurrentPage] = useState(1);
  const [companyTotalPages, setCompanyTotalPages] = useState(1);


  if (!currentUser?.is_director && !currentUser?.is_accountant) {
    return (
      <div className="d-flex min-vh-100 bg-light align-items-center justify-content-center flex-column text-primary text-center fw-bold fs-5">
        <p>Bạn không có quyền truy cập trang “Doanh Thu”.</p>
        <p>Vui lòng quay lại trang chủ.</p>
      </div>
    );
  }

  
  const aggregateCompanyData = (services, companies) => {
    if (!companies || companies.length === 0) return [];
    
    const aggregated = companies.map(company => {
      const myServices = services.filter(s => 
        String(s.DoanhNghiepID) === String(company.ID)
      );
      
      const total = myServices.reduce((sum, s) => sum + (s.DoanhThu || 0), 0);
      
      return {
        TenDoanhNghiep: company.TenDoanhNghiep,
        ID: company.ID,
        Count: myServices.length,
        TotalRevenue: total
      };
    });

    // Sắp xếp theo doanh thu giảm dần
    return aggregated.sort((a, b) => b.TotalRevenue - a.TotalRevenue);
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
           let rawRevenue = item.DoanhThuSauChietKhau || "0";
           if (typeof rawRevenue === 'string') {
             rawRevenue = rawRevenue.replace(/\./g, '');
           }
           const revenue = parseFloat(rawRevenue) || 0;

           return {
             ...item,
             NgayTao: item.NgayThucHien || item.NgayTao, 
             DoanhThu: revenue,
             TenDichVu: item.TenDichVu,
             DoanhNghiepID: item.DoanhNghiepID,
             TenDoanhNghiep: item.TenDoanhNghiep 
           };
        });

        setCompanyRecords(mappedServices);
        setFilteredCompanyRecords(mappedServices);
        
        // Tính toán dữ liệu cho biểu đồ cột và bảng
        const aggregated = aggregateCompanyData(mappedServices, companies);
        setAggregatedCompanyData(aggregated);

        setCompanyTotalPages(Math.ceil(aggregated.length / 20)); 
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

  // ================== XỬ LÝ BIỂU ĐỒ CÁ NHÂN (Line Chart) ==================
  const prepareChartData = (data, mode, type) => {
    if (type === "company") return; // Doanh nghiệp dùng logic khác

    if (!data || data.length === 0) {
      setChartData([]);
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

    setChartData(Object.values(group));
  };

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
      

      const aggregated = aggregateCompanyData(filtered, approvedCompanies);
      
      let finalAggregated = aggregated;
      if (companySearchTerm.trim() !== "") {
          const k = companySearchTerm.toLowerCase();
          finalAggregated = finalAggregated.filter(c => c.TenDoanhNghiep.toLowerCase().includes(k));
      }

      setAggregatedCompanyData(finalAggregated);
      setCompanyCurrentPage(1);
      setCompanyTotalPages(Math.ceil(finalAggregated.length / 20));
    }
  };

  const handleSavePersonalRow = async (id, value) => {
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
            "Số Lượng Giao Dịch": r.Count,
            "Tổng Doanh Thu": r.TotalRevenue || 0,
        }));
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "DoanhNghiepTongHop");
        XLSX.writeFile(workbook, "DoanhThu_DoanhNghiep_TongHop.xlsx");
    }
  };

  // Options cho Select (Cá nhân)
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

          {/* --- TABS NAVIGATION --- */}
          <div className="d-flex gap-2 mb-4 border-bottom">
            <button
              onClick={() => setActiveTab("personal")}
              style={{
                padding: "10px 20px",
                border: "none",
                background: "transparent",
                borderBottom: activeTab === "personal" ? "3px solid #2563eb" : "3px solid transparent",
                color: activeTab === "personal" ? "#2563eb" : "#64748b",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {t.personalTab}
            </button>
            <button
              onClick={() => setActiveTab("company")}
              style={{
                padding: "10px 20px",
                border: "none",
                background: "transparent",
                borderBottom: activeTab === "company" ? "3px solid #2563eb" : "3px solid transparent",
                color: activeTab === "company" ? "#2563eb" : "#64748b",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {t.companyTab}
            </button>
          </div>


          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
             <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <span>→</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />

           
              {activeTab === "personal" && (
                <select
                  value={viewMode}
                  onChange={(e) => {
                    setViewMode(e.target.value);
                    prepareChartData(activeTab === "personal" ? filteredRecords : filteredCompanyRecords, e.target.value, activeTab);
                  }}
                >
                  <option value="ngay">Ngày</option>
                  <option value="tuan">Tuần</option>
                  <option value="thang">Tháng</option>
                  <option value="nam">Năm</option>
                </select>
              )}

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

       
          <div style={{ background: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", minHeight: "360px", marginBottom: "30px" }}>
            <h5 style={{ color: "#2563eb", fontWeight: 600, marginBottom: "10px" }}>
               {activeTab === "personal" ? t.chartTitle + " (Cá nhân)" : t.chartTitle + " (Doanh nghiệp)"}
            </h5>
            {loading ? (
              <p>{t.loadingChart}</p>
            ) : (
              (activeTab === "personal" ? chartData : aggregatedCompanyData).length === 0 ? (
                <p>{t.noData}</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  {activeTab === "personal" ? (
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(v) => formatCurrency(v)} width={100} />
                      <Tooltip labelFormatter={(label) => `${t.time}: ${label}`} formatter={(v) => [formatCurrency(v) + " " + t.revenueUnit, t.revenue]} />
                      <Legend />
                      <Line type="monotone" dataKey="doanhthu" stroke="#2563eb" strokeWidth={2} name={t.revenue} />
                    </LineChart>
                  ) : (
                    <BarChart data={aggregatedCompanyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="TenDoanhNghiep" angle={-10} textAnchor="end" height={60} interval={0} fontSize={12} />
                      <YAxis tickFormatter={(v) => formatCurrency(v)} width={100} />
                      <Tooltip formatter={(v) => [formatCurrency(v) + " " + t.revenueUnit, t.totalRevenue]} />
                      <Legend />
                      <Bar dataKey="TotalRevenue" name={t.totalRevenue} fill="#2563eb " barSize={50} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              )
            )}
          </div>

          {/* --- SEARCH & EXPORT --- */}
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <input
              type="text"
              placeholder={activeTab === "personal" ? "Tìm theo tên, email..." : "Tìm tên công ty..."}
              value={activeTab === "personal" ? searchTerm : companySearchTerm}
              onChange={(e) => activeTab === "personal" ? setSearchTerm(e.target.value) : setCompanySearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleFilter()}
              style={{ width: "320px", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: "8px" }}
            />

            <button
              onClick={handleExportExcel}
              style={{
                background: "#16a34a", color: "white", border: "none", borderRadius: "8px", padding: "8px 16px", cursor: "pointer", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px",
              }}
            >
              <i className="bi bi-file-earmark-excel"></i>
              Download Excel
            </button>
          </div>

          {/* --- BẢNG DỮ LIỆU --- */}
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
                <th>{t.transactionCount}</th>
                <th className="text-end pe-4">{t.totalRevenue} (VNĐ)</th>
              </tr>
            </thead>
            <tbody>
              {currentRows.length === 0 ? (
                 <tr><td colSpan="4" className="p-3 text-muted">{t.noData}</td></tr>
              ) : (
                currentRows.map((r, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#f9fafb" : "white" }}>
                    <td>{indexOfFirstRow + i + 1}</td>
                    <td className="fw text-start ps-4">{r.TenDoanhNghiep}</td>
                    <td>{r.Count}</td>
                    <td className="fw text-end pe-4 text-primary">{formatCurrency(r.TotalRevenue)}</td>
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