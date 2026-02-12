import React, { useState, useEffect } from "react";
import translateService, { getServiceKey } from "../../utils/translateService";
import {
  ResponsiveContainer,
  PieChart,
  BarChart,
  XAxis,
  YAxis,
  Legend,
  Bar,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { FilterX } from "lucide-react";
import { showToast } from "../../utils/toast";
import useDashboardData from "./hooks/useDashboardData";
import { authenticatedFetch } from "../../utils/api";

const statusColorMap = {
  "Tư vấn": "#3b82f6",
  "Đang xử lý": "#f59e0b",
  "Đang nộp hồ sơ": "#10b981",
  "Hoàn thành": "#8b5cf6",
  "Không xác định": "#9ca3af",
};

const statusTranslations = {
  "Tư vấn": { vi: "Tư vấn", en: "Consulting", ko: "상담" },
  "Đang xử lý": { vi: "Đang xử lý", en: "Processing", ko: "처리 중" },
  "Đang nộp hồ sơ": { vi: "Đang nộp hồ sơ", en: "Submitting", ko: "서류 제출 중" },
  "Hoàn thành": { vi: "Hoàn thành", en: "Completed", ko: "완료" },
  "Không xác định": { vi: "Không xác định", en: "Unknown", ko: "미확인" },
};

const contactModeTranslations = {
  "Trực tiếp": { vi: "Trực tiếp", en: "In Person", ko: "방문" },
  "Gọi điện": { vi: "Gọi điện", en: "Phone", ko: "전화" },
  "Email": { vi: "Email", en: "Email", ko: "이메일" },
  "Tin nhắn": { vi: "Tin nhắn", en: "Message", ko: "메시지" },
};

// Helper function để lấy màu từ translated service name
const getServiceColor = (translatedName, colorMap) => {
  // Chuyển đổi translated name về Korean key
  const koreanKey = getServiceKey(translatedName);
  // Translate Korean key sang Vietnamese để match với colorMap
  const vietnameseName = translateService(koreanKey, "vi");
  return colorMap[vietnameseName] || colorMap[koreanKey] || "#60a5fa";
};

const DashboardSummary = ({
  currentLanguage,
  serviceColorMap,
  filterDichVu,
  setFilterDichVu,
  filterStatus,
  setFilterStatus,
  allServices
}) => {
  const [timeRange, setTimeRange] = useState(7);
  const [activeTab, setActiveTab] = useState("individual");
  const [b2bServices, setB2bServices] = useState([]);
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [b2bLoading, setB2bLoading] = useState(false);
  const [filterRegion, setFilterRegion] = useState("");
  const [filterMode, setFilterMode] = useState("");
  const [filterStaff, setFilterStaff] = useState(""); 
  const { currentPage, setCurrentPage, rowsPerPage } = useDashboardData();
  const [selectedTimeCompanyId, setSelectedTimeCompanyId] = useState("");

  const [b2bCurrentPage, setB2bCurrentPage] = useState(1);
  const b2bRowsPerPage = 20;
  const [selectedCompanyId, setSelectedCompanyId] = useState("");

  const getStaffName = (r) => {
    if (!r.NguoiPhuTrach) {
      return currentLanguage === "vi" ? "Chưa phân công" : currentLanguage === "ko" ? "미배정" : "Unassigned";
    }
    if (typeof r.NguoiPhuTrach === 'object') return r.NguoiPhuTrach.name || r.NguoiPhuTrach.username || (currentLanguage === "vi" ? "Chưa phân công" : currentLanguage === "ko" ? "미배정" : "Unassigned");
    return r.NguoiPhuTrach;
  };

  const parseServiceDetails = (details) => {
    if (!details) return { main: {}, sub: [] };
    if (typeof details === "string") {
      try {
        return JSON.parse(details);
      } catch (e) {
        return { main: {}, sub: [] };
      }
    }
    return details || { main: {}, sub: [] };
  };

  const getRevenueAfterDiscount = (record) => {
    const details = parseServiceDetails(record.ChiTietDichVu);
    const rows = [];

    const mainRevenue = details.main && details.main.revenue !== undefined
      ? details.main.revenue
      : record.DoanhThuTruocChietKhau;
    const mainDiscount = details.main && details.main.discount !== undefined
      ? details.main.discount
      : record.MucChietKhau;
    rows.push({ revenue: mainRevenue, discount: mainDiscount });

    if (details.sub && details.sub.length > 0) {
      details.sub.forEach((sub) => {
        rows.push({ revenue: sub.revenue, discount: sub.discount });
      });
    }

    return rows.reduce((sum, row) => {
      const rev = Number(row.revenue) || 0;
      const disc = Number(row.discount) || 0;
      const discAmount = rev * (disc / 100);
      return sum + (rev - discAmount);
    }, 0);
  };

  const formatCurrency = (value) => {
    const num = Number(value) || 0;
    return num.toLocaleString("vi-VN");
  };

  // --- LOGIC LỌC DỮ LIỆU ---
  const filteredData = allData.filter((r) => {
    const matchService = filterDichVu
      ? translateService(r.LoaiDichVu, currentLanguage) === filterDichVu
      : true;

    const regionMapVi = { "+84": "Việt Nam", "+82": "Hàn Quốc" };
    const regionMapEn = { "+84": "Vietnam", "+82": "South Korea" };
    const regionMapKo = { "+84": "베트남", "+82": "한국" };
    const regionMap = currentLanguage === "ko" ? regionMapKo : currentLanguage === "en" ? regionMapEn : regionMapVi;
    const region = regionMap[r.MaVung] || r.MaVung || (currentLanguage === "vi" ? "Không xác định" : currentLanguage === "ko" ? "미확인" : "Unknown");
    const matchRegion = filterRegion ? region === filterRegion : true;

    const matchMode = filterMode ? r.TenHinhThuc === filterMode : true;

    const matchStatus = filterStatus ? r.TrangThai === filterStatus : true;

    const staffName = getStaffName(r);
    const matchStaff = filterStaff ? staffName === filterStaff : true;

    return matchService && matchRegion && matchStatus && matchMode && matchStaff;
  });

  const b2bGrouped = b2bServices.reduce((acc, svc) => {
    const name = svc.TenDoanhNghiep || svc.companyName || svc.CompanyName || (currentLanguage === "vi" ? "Không xác định" : currentLanguage === "ko" ? "미확인" : "Unknown");
    if (!acc[name]) {
      acc[name] = { name, count: 0, revenue: 0 };
    }
    acc[name].count += 1;
    acc[name].revenue += getRevenueAfterDiscount(svc);
    return acc;
  }, {});

  const b2bStats = Object.values(b2bGrouped).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return b.revenue - a.revenue;
  });

  const b2bTotalRevenue = b2bStats.reduce((sum, item) => sum + (Number(item.revenue) || 0), 0);

  const b2cGrouped = filteredData.reduce((acc, rec) => {
    const name = rec.HoTen || rec.TenKhachHang || rec.CustomerName || (currentLanguage === "vi" ? "Không xác định" : currentLanguage === "ko" ? "미확인" : "Unknown");
    if (!acc[name]) {
      acc[name] = { name, count: 0, revenue: 0 };
    }
    acc[name].count += 1;
    acc[name].revenue += getRevenueAfterDiscount(rec);
    return acc;
  }, {});

  const b2cStats = Object.values(b2cGrouped).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return b.revenue - a.revenue;
  });

  const b2cTotalRevenue = b2cStats.reduce((sum, item) => sum + (Number(item.revenue) || 0), 0);


  const dataForChart = allData.filter((r) => {

    const regionMap = { "+84": "Việt Nam", "+82": "Hàn Quốc" };
    const region = regionMap[r.MaVung] || r.MaVung || "Không xác định";
    const matchRegion = filterRegion ? region === filterRegion : true;

    const matchMode = filterMode ? r.TenHinhThuc === filterMode : true;

    const matchStatus = filterStatus ? r.TrangThai === filterStatus : true;

    const staffName = getStaffName(r);
    const matchStaff = filterStaff ? staffName === filterStaff : true;

    return matchRegion && matchStatus && matchMode && matchStaff;
  });
  // --------------------------------------------------------------------------

  const toVNDateString = (dateInput) => {
    if (!dateInput) return null;
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return null;
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(d);
    } catch (error) {
      return d.toISOString().split('T')[0];
    }
  };

  const getLastNDays = (days) => {
    const arr = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now); 
      d.setDate(d.getDate() - i);
      arr.push(toVNDateString(d));
    }
    return arr;
  };

  const allDates = getLastNDays(timeRange);
const b2cServices = Array.from(
  new Set(
    allData
      .map(r => translateService(r.LoaiDichVu, currentLanguage))
      .filter(Boolean)
  )
);
const chartDataByTime = allDates.map((dateStr) => {
  const dayData = { date: dateStr };

  b2cServices.forEach((service) => {
    const count = dataForChart.filter((r) => {
      if (!r.NgayBatDau) return false;

      const rDate = toVNDateString(r.NgayBatDau);
      const rService = translateService(r.LoaiDichVu, currentLanguage)?.trim();

      return rDate === dateStr && rService === service;
    }).length;

    dayData[service] = count;
  });

  return dayData;
});


  // Check if there is any data to display
  const hasChartData = chartDataByTime.some(d => 
    Object.keys(d).length > 1 && Object.values(d).some(v => typeof v === 'number' && v > 0)
  );
  // ------------------------------------------------

  const groupedByStatus = filteredData.reduce((acc, cur) => {
    const status = cur.TrangThai || "Không xác định";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  
  const totalStatus = Object.values(groupedByStatus).reduce(
    (sum, v) => sum + v,
    0
  );
  
  const [filterB2BServiceType, setFilterB2BServiceType] = useState("");
  const [filterB2BStaff, setFilterB2BStaff] = useState("");
  const totalPages = Math.ceil(filteredData.length / rowsPerPage) || 1;
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentTableRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);
  
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("currentUser"));
      let url = `https://onepasscms-backend-tvdy.onrender.com/api/yeucau?limit=1000`;
      if (user?.id) {
        url += `&userId=${user.id}`;
        url += `&is_admin=${user.is_admin || false}`;
        url += `&is_director=${user.is_director || false}`;
        url += `&is_accountant=${user.is_accountant || false}`;
        url += `&is_staff=${user.is_staff || false}`;
      }
      const res = await authenticatedFetch(url);
      const result = await res.json();
      if (result.success) setAllData(result.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterDichVu, filterRegion, filterMode, filterStatus, filterStaff, rowsPerPage]);

  useEffect(() => {
    setB2bCurrentPage(1);
  }, [selectedCompanyId]);

  const fetchB2BData = async () => {
    setB2bLoading(true);
    try {
      const serviceRes = await authenticatedFetch(
        "https://onepasscms-backend-tvdy.onrender.com/api/b2b/services?limit=1000"
      );
      const serviceJson = await serviceRes.json();
      const rawServices = serviceJson.success ? serviceJson.data : [];

      const companyRes = await authenticatedFetch(
        "https://onepasscms-backend-tvdy.onrender.com/api/b2b/approved"
      );
      const companyJson = await companyRes.json();
      const rawCompanies = companyJson.success ? companyJson.data : [];

      const merged = rawServices.map((service) => {
        const company = rawCompanies.find((c) => c.ID === service.DoanhNghiepID) || {};

        return {
          ...service,
          companyId: service.DoanhNghiepID,
          TenDoanhNghiep: company.TenDoanhNghiep || service.TenDoanhNghiep,
          SoDienThoai: company.SoDienThoai || service.SoDienThoai,
          Email: company.Email || service.Email,
          NguoiDaiDien: company.NguoiDaiDien || service.NguoiDaiDien,
          
          LoaiDichVu: service.LoaiDichVu,
          TenDichVu: service.TenDichVu,
          DanhMuc: service.DanhMuc,
          ChiTietDichVu: (typeof service.ChiTietDichVu === "string" 
            ? JSON.parse(service.ChiTietDichVu) 
            : service.ChiTietDichVu) || { main: {}, sub: [] },
          picName: service.NguoiPhuTrach ? (service.NguoiPhuTrach.username || service.NguoiPhuTrach.name) : "", 
          startDate: service.NgayThucHien?.split("T")[0],
          endDate: service.NgayHoanThanh?.split("T")[0],
          package: service.GoiDichVu,
        };
      });

      setB2bServices(merged);
    } catch (err) {
      console.error("B2B load error", err);
    } finally {
      setB2bLoading(false);
    }
  };
  useEffect(() => {
    fetchB2BData();
  }, []);

  const uniqueCompanies = Array.from(
    new Map(
      b2bServices.map((item) => [item.DoanhNghiepID, item.TenDoanhNghiep])
    ).entries()
  )
    .map(([id, name]) => ({ id, name }))
    .filter((c) => c.id && c.name !== "Chưa xác định");

  const baseB2BData = selectedCompanyId
    ? b2bServices.filter((s) => String(s.DoanhNghiepID) === String(selectedCompanyId))
    : b2bServices;

  const filteredB2BServices = baseB2BData.filter(s => {
      const matchService = filterB2BServiceType ? (s.LoaiDichVu || (currentLanguage === "vi" ? "Không xác định" : currentLanguage === "ko" ? "미확인" : "Unknown")) === filterB2BServiceType : true;
      const unassignedLabel = currentLanguage === "vi" ? "Chưa phân công" : currentLanguage === "ko" ? "미배정" : "Unassigned";
      const matchStaff = filterB2BStaff ? (s.picName || unassignedLabel) === filterB2BStaff : true;
      return matchService && matchStaff;
  });

  const sortedB2BData = [...filteredB2BServices].sort((a, b) => {
    const compA = String(a.companyId || a.DoanhNghiepID || "");
    const compB = String(b.companyId || b.DoanhNghiepID || "");
    if (compA !== "" && compB === "") return -1;
    if (compA === "" && compB !== "") return 1;
    if (compA !== "" && compB !== "") return compA.localeCompare(compB);
    return (a.id || 0) - (b.id || 0);
  });

  const b2bIndexOfLastRow = b2bCurrentPage * b2bRowsPerPage;
  const b2bIndexOfFirstRow = b2bIndexOfLastRow - b2bRowsPerPage;
  const currentB2BRows = sortedB2BData.slice(
    b2bIndexOfFirstRow,
    b2bIndexOfLastRow
  );
  const totalB2BPages = Math.ceil(sortedB2BData.length / b2bRowsPerPage) || 1;

  const headerStyle = {
    backgroundColor: "#2c4d9e", 
    color: "#ffffff",
    borderRight: "1px solid #4a6fdc", 
    textAlign: "center",
    verticalAlign: "middle",
    whiteSpace: "nowrap",
    padding: "8px 4px",
    position: "sticky", 
    top: 0,
    zIndex: 20 
  };

  return (
    <div className="mb-4">
      {/* TABS */}
      <div
        className="d-flex border-bottom mb-4"
        style={{
          gap: "2rem",
          borderColor: "#e0e0e0",
          fontWeight: 500,
          fontSize: "1rem",
        }}
      >
        {[
          { key: "individual", labelVi: "Khách Hàng Cá Nhân", labelEn: "Individual", labelKo: "개인 고객" },
          { key: "b2b", labelVi: "Khách Hàng Doanh Nghiệp", labelEn: "B2B", labelKo: "기업 고객" },
        ].map((tab) => (
          <div
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              cursor: "pointer",
              paddingBottom: "6px",
              borderBottom:
                activeTab === tab.key
                  ? "3px solid #2563eb"
                  : "3px solid transparent",
              color: activeTab === tab.key ? "#2563eb" : "#6b7280",
              fontWeight: activeTab === tab.key ? "600" : "500",
              transition: "all 0.2s ease",
            }}
          >
            {currentLanguage === "vi" ? tab.labelVi : currentLanguage === "ko" ? tab.labelKo : tab.labelEn}
          </div>
        ))}
      </div>

      {activeTab === "individual" && (
        <div className="mb-4">
           <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "2rem",
          flexWrap: "wrap",
        }}
      >
        {/* LEFT: Charts */}
        <div style={{ flex: "1 1 48%", display: "flex", flexDirection: "column", gap: "2rem" }}>
      
          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              padding: "20px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
              cursor: "pointer",
            }}
            onClick={() => {
              setFilterDichVu(""); 
              showToast(currentLanguage === "vi" ? "Hiển thị toàn bộ danh sách yêu cầu" : currentLanguage === "ko" ? "모든 요청 표시" : "Showing all requests", "info");
            }}
          >
            <h5 className="fw-semibold mb-3 text-primary">
              {currentLanguage === "vi" ? "Tổng quan số lượng dịch vụ" : currentLanguage === "ko" ? "서비스 요약" : "Service Overview"}
            </h5>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "2rem" }}>
              <div style={{ flex: "1 1 50%", minWidth: 280, height: 320, position: "relative" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      dataKey="value"
                      data={Object.entries(
                        filteredData.reduce((acc, cur) => {
                          const name = translateService(cur.LoaiDichVu || "Không xác định", currentLanguage);
                          acc[name] = (acc[name] || 0) + 1;
                          return acc;
                        }, {})
                      ).map(([name, count]) => ({ name, value: count }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      labelLine={false}
                    >
                      {Object.entries(
                        filteredData.reduce((acc, cur) => {
                          const name = translateService(cur.LoaiDichVu || "Không xác định", currentLanguage);
                          acc[name] = (acc[name] || 0) + 1;
                          return acc;
                        }, {})
                      ).map(([name], i) => (
                        <Cell
                          key={i}
                          fill={getServiceColor(name, serviceColorMap)}
                          cursor="pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            const newFilter = name === filterDichVu ? "" : name;
                            setFilterDichVu(newFilter);
                            showToast(
                              currentLanguage === "vi"
                                ? newFilter ? `Đang lọc danh sách theo dịch vụ: ${name}` : "Hiển thị toàn bộ danh sách yêu cầu"
                                : newFilter ? (currentLanguage === "vi" ? `Lọc theo: ${name}` : currentLanguage === "ko" ? `필터링: ${name}` : `Filtering requests for: ${name}`) : (currentLanguage === "vi" ? "Hiển thị tất cả yêu cầu" : currentLanguage === "ko" ? "모든 요청 표시" : "Showing all requests"),
                              "info"
                            );
                          }}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>

                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
                  <h4 style={{ fontSize: "1.8rem", fontWeight: "700", color: "#2563eb", marginBottom: "0.25rem" }}>
                    {filteredData.length}
                  </h4>
                </div>
              </div>

              {/* Legend */}
              <div style={{ flex: "1 1 45%", minWidth: 240 }}>
                <h6 className="fw-semibold mb-3 text-secondary">
                  {currentLanguage === "vi" ? "Tổng quan số lượng dịch vụ" : currentLanguage === "ko" ? "서비스 요약" : "Service Summary"}
                </h6> 
                {(() => {
                  const grouped = filteredData.reduce((acc, cur) => {
                    const name = translateService(cur.LoaiDichVu || "Không xác định", currentLanguage);
                    acc[name] = (acc[name] || 0) + 1;
                    return acc;
                  }, {});
                  const total = Object.values(grouped).reduce((sum, v) => sum + v, 0);
                  return (
                    <>
                      {Object.entries(grouped).map(([name, count], i) => {
                        const percent = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                        return (
                         <div
                          key={i}
                          className="d-flex justify-content-between align-items-center mb-2"
                          style={{
                            cursor: "pointer",
                            background: filterDichVu === name ? "rgba(37,99,235,0.1)" : "transparent",
                            borderRadius: 6,
                            padding: "4px 8px",
                          }}
                          onClick={(e) => {
                            e.stopPropagation(); 
                            const newFilter = filterDichVu === name ? "" : name;
                            setFilterDichVu(newFilter);
                          }}
                        >
                          <span>{name}</span>
                          <strong>
                            {count} <span style={{ color: "#6b7280" }}>({percent}%)</span>
                          </strong>
                        </div>
                        );
                      })}
                      <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top" style={{ fontWeight: "600", color: "#1f2937" }}>
                        <span>{currentLanguage === "vi" ? "Tổng cộng" : currentLanguage === "ko" ? "합계" : "Total"}</span>
                        <span>
                          {total} <span style={{ color: "#6b7280" }}>{currentLanguage === "vi" ? "yêu cầu" : currentLanguage === "ko" ? "요청" : "requests"}</span>
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
          
          <div style={{ background: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
            <h5 className="fw-semibold mb-3 text-primary">
              {currentLanguage === "vi" ? "Số lượng dịch vụ theo nhân viên" : currentLanguage === "ko" ? "직원별 서비스 수" : "Service Count by Staff"}
            </h5>
            
            {(() => {
              const grouped = filteredData.reduce((acc, cur) => {
                const staff = getStaffName(cur);
                acc[staff] = (acc[staff] || 0) + 1;
                return acc;
              }, {});
              
              const total = Object.values(grouped).reduce((s, v) => s + v, 0);
              const staffData = Object.entries(grouped).map(([name, value]) => ({ name, value }));
              const colors = ["#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899", "#f97316", "#06b6d4", "#84cc16"];

              return (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                  
                
                  <div style={{ flex: "1 1 40%", minWidth: 200, height: 260, position: "relative" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={staffData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                        >
                          {staffData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={colors[index % colors.length]} 
                              cursor="pointer"
                              stroke="none"
                              
                              onClick={(e) => {
                                e.stopPropagation();
                                setFilterStaff(filterStaff === entry.name ? "" : entry.name);
                                showToast(currentLanguage === "vi" ? (filterStaff === entry.name ? "Hiển thị tất cả nhân viên" : `Lọc theo nhân viên: ${entry.name}`) : "Info", "info");
                              }}
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [value, currentLanguage === "vi" ? "Yêu cầu" : currentLanguage === "ko" ? "요청" : "Requests"]} />
                      </PieChart>
                    </ResponsiveContainer>
                    
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none" }}>
                      <h4 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#2563eb", marginBottom: "0" }}>
                        {filteredData.length}
                      </h4>
                    </div>
                  </div>

                  <div style={{ flex: "1 1 50%", minWidth: 200 }}>
                    <div style={{ maxHeight: "260px", overflowY: "auto", paddingRight: "5px" }}>
                      {staffData.map((item, i) => {
                        const percent = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
                        const color = colors[i % colors.length];
                        const isActive = filterStaff === item.name;

                        return (
                          <div
                            key={i}
                            onClick={() => {
                              setFilterStaff(isActive ? "" : item.name);
                              showToast(currentLanguage === "vi" ? (isActive ? "Hiển thị tất cả nhân viên" : `Lọc theo nhân viên: ${item.name}`) : "Info", "info");
                            }}
                            style={{
                              display: "flex", 
                              alignItems: "center", 
                              justifyContent: "space-between", 
                              marginBottom: 8, 
                              gap: 10, 
                              cursor: "pointer",
                              background: isActive ? "rgba(37,99,235,0.1)" : "transparent",
                              border: isActive ? `1px solid ${color}` : "1px solid transparent",
                              borderRadius: 6, 
                              padding: "6px 8px", 
                              transition: "all 0.2s ease",
                            }}
                          >
                            <div className="d-flex align-items-center" style={{ gap: "8px", overflow: "hidden" }}>
                              <div style={{ width: 12, height: 12, borderRadius: "50%", background: color, flexShrink: 0 }}></div>
                              <div style={{ fontWeight: 500, fontSize: "0.9rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "150px" }} title={item.name}>
                                {item.name}
                              </div>
                            </div>
                            
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <strong style={{ color: "#2563eb", fontSize: "0.9rem" }}>{item.value}</strong>
                              <span style={{ color: "#6b7280", fontSize: "0.85rem" }}>({percent}%)</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top" style={{ fontWeight: "600", color: "#1f2937", fontSize: "0.9rem" }}>
                      <span>{currentLanguage === "vi" ? "Tổng cộng" : currentLanguage === "ko" ? "합계" : "Total"}</span>
                      <span>{total} <span style={{ color: "#6b7280" }}>{currentLanguage === "vi" ? "yêu cầu" : currentLanguage === "ko" ? "요청" : "requests"}</span></span>
                    </div>
                  </div>

                </div>
              );
            })()}
          </div>
          
        </div>
        
        {/* --- BẢNG DANH SÁCH YÊU CẦU (BÊN PHẢI) --- */}
        <div style={{ 
            flex: "1 1 48%", 
            background: "#fff", 
            borderRadius: "12px", 
            padding: "20px", 
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
            display: "flex", 
            flexDirection: "column",
           
            maxHeight: "1000px",
            overflow: "hidden" 
        }}>
          {/* HEADER CỐ ĐỊNH */}
          <div className="d-flex justify-content-between align-items-center mb-3 flex-shrink-0" style={{ gap: "1rem" }}>
            <h5 className="fw-semibold mb-0 text-primary">
              {(() => {
                if (currentLanguage === "ko") {
                  if (filterRegion) return `요청 목록 (${filterRegion}${filterDichVu ? " - " + filterDichVu : ""})`;
                  if (filterDichVu) return `요청 목록 (${filterDichVu})`;
                  return "요청 목록";
                } else if (currentLanguage === "vi") {
                  if (filterRegion) return `Danh sách yêu cầu (${filterRegion}${filterDichVu ? " - " + filterDichVu : ""})`;
                  if (filterDichVu) return `Danh sách yêu cầu (${filterDichVu})`;
                  return "Danh sách yêu cầu";
                } else {
                  if (filterRegion) return `Request List (${filterRegion}${filterDichVu ? " - " + filterDichVu : ""})`;
                  if (filterDichVu) return `Request List (${filterDichVu})`;
                  return "Request List";
                }
              })()}
            </h5>

             {(filterRegion || filterDichVu || filterMode || filterStatus || filterStaff) && (
                <button
                  className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                  onClick={() => {
                    setFilterRegion("");
                    setFilterDichVu("");
                    setFilterMode(""); 
                    setFilterStatus(""); 
                    setFilterStaff(""); 
                    
                    showToast(
                      currentLanguage === "vi"
                        ? "Đã xóa toàn bộ bộ lọc, hiển thị tất cả yêu cầu"
                        : currentLanguage === "ko"
                        ? "모든 필터 삭제, 모든 요청 표시"
                        : "All filters cleared, showing all requests",
                      "info"
                    );
                  }}
                  title={currentLanguage === "vi" ? "Xóa toàn bộ bộ lọc" : currentLanguage === "ko" ? "모든 필터 삭제" : "Clear all filters"}
                  style={{ fontWeight: 500, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <FilterX size={16} strokeWidth={2} />
                </button>
              )}
          </div>

          {/* TABLE SCROLLABLE CONTAINER */}
          {loading ? (
            <p className="text-center text-muted py-4">
              {currentLanguage === "vi" ? "Đang tải dữ liệu..." : currentLanguage === "ko" ? "데이터 로딩 중..." : "Loading..."}
            </p>
          ) : (
            <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div className="table-responsive" style={{ flex: 1, overflow: "auto" }}>
                <table className="table table-bordered align-middle table-sm" style={{fontSize: "13px"}}>
                  <thead>
                  <tr className="text-center">
                    <th style={{width: "40px", ...headerStyle}}>#</th>
                    <th style={{minWidth: "120px", ...headerStyle}}>
                      {currentLanguage === "vi" ? "Khách hàng" : currentLanguage === "ko" ? "고객" : "Customer"}
                    </th>
                    <th style={{width: "100px", ...headerStyle}}>
                      {currentLanguage === "vi" ? "Loại dịch vụ" : currentLanguage === "ko" ? "서비스 유형" : "Service Type"}
                    </th>
                    <th style={{minWidth: "120px", ...headerStyle}}>
                      {currentLanguage === "vi" ? "Tên dịch vụ" : currentLanguage === "ko" ? "서비스명" : "Service Name"}
                    </th>
                    <th style={{minWidth: "100px", ...headerStyle}}>
                      {currentLanguage === "vi" ? "Mã dịch vụ" : currentLanguage === "ko" ? "서비스 코드" : "Service Code"}
                    </th>
                    <th style={{minWidth: "150px", ...headerStyle}}>
                      {currentLanguage === "vi" ? "Danh mục" : currentLanguage === "ko" ? "카테고리" : "Category"}
                    </th>
                    <th style={{width: "120px", ...headerStyle}}>
                      {currentLanguage === "vi" ? "Người phụ trách" : currentLanguage === "ko" ? "담당자" : "Assignee"}
                    </th>
                    <th style={{width: "90px", ...headerStyle}}>
                      {currentLanguage === "vi" ? "Ngày hẹn" : currentLanguage === "ko" ? "약속일" : "Appointment Date"}
                    </th>
          
                    <th style={{width: "100px", ...headerStyle}}>
                      {currentLanguage === "vi" ? "Ngày bắt đầu" : currentLanguage === "ko" ? "시작 날짜" : "Start Date"}
                    </th>
                    <th style={{width: "100px", ...headerStyle}}>
                      {currentLanguage === "vi" ? "Ngày kết thúc" : currentLanguage === "ko" ? "종료 날짜" : "End Date"}
                    </th>

                    <th style={{width: "100px", ...headerStyle}}>
                      {currentLanguage === "vi" ? "Trạng thái" : currentLanguage === "ko" ? "상태" : "Status"}
                    </th>
                    <th style={{width: "90px", ...headerStyle}}>
                      {currentLanguage === "vi" ? "Hình thức" : currentLanguage === "ko" ? "방법" : "Method"}
                    </th>
                  </tr>
                </thead>
                  <tbody>
                    {currentTableRows.length > 0 ? (
                      currentTableRows.map((r, index) => {
                         const details = typeof r.ChiTietDichVu === 'string'
                              ? JSON.parse(r.ChiTietDichVu)
                              : (r.ChiTietDichVu || { main: {}, sub: [] });
                          
                          let displayRows = [];
                          displayRows.push({
                              name: r.DanhMuc ? r.DanhMuc.split(" + ")[0] : (r.TenDichVu || ""),
                              isMain: true
                          });
                          if (details.sub && details.sub.length > 0) {
                              details.sub.forEach(sub => {
                                  displayRows.push({ name: sub.name, isMain: false });
                              });
                          } else {
                              const parts = (r.DanhMuc || "").split(" + ");
                              if (parts.length > 1) {
                                  parts.slice(1).forEach(p => displayRows.push({ name: p, isMain: false }));
                              }
                          }

                          const rowSpan = displayRows.length;
                          const mergedStyle = { verticalAlign: "middle" };

                          return displayRows.map((row, rIdx) => {
                              const isFirst = rIdx === 0;
                              return (
                                  <tr key={`${r.YeuCauID}-${rIdx}`}>
                                      {/* 1. STT (Shared) */}
                                      {isFirst && (
                                          <td rowSpan={rowSpan} className="text-center" style={{...mergedStyle, left: 0, zIndex: 5}}>
                                              {r.YeuCauID}
                                          </td>
                                      )}

                                      {/* 2. Khách hàng (Shared) */}
                                      {isFirst && (
                                          <td rowSpan={rowSpan} className="text-center" style={{...mergedStyle, left: "40px", zIndex: 5}}>
                                              {r.HoTen}
                                          </td>
                                      )}

                                      {/* 3. Loại dịch vụ (Shared) */}
                                      {isFirst && (
                                          <td rowSpan={rowSpan} className="text-center" style={{verticalAlign: "middle"}}>
                                              <span className="text-center">
                                                  {translateService(r.LoaiDichVu, currentLanguage)}
                                              </span>
                                          </td>
                                      )}

                                      {/* 4. Tên dịch vụ (Shared - User Input) */}
                                      {isFirst && (
                                          <td rowSpan={rowSpan} style={{verticalAlign: "middle"}}>
                                              {r.TenDichVu}
                                          </td>
                                      )}
                                      {isFirst && (
                                          <td rowSpan={rowSpan} style={{verticalAlign: "middle", textAlign: "center"}}>
                                              {r.MaHoSo || ""}
                                          </td>
                                      )}
                                      {/* 5. Danh mục (SPLIT ROWS) */}
                                      <td style={{
                                          color: row.isMain ? "#000" : "#000",
                                          paddingLeft: "8px", 
                                          textAlign: "center",
                                          whiteSpace: "normal"
                                      }}>
                                          {row.name}
                                      </td>

                                      {/* 6. Người phụ trách (Shared) */}
                                      {isFirst && (
                                          <td rowSpan={rowSpan} className="text-center" style={{verticalAlign: "middle"}}>
                                              {r.NguoiPhuTrach?.name || r.NguoiPhuTrach || ""}
                                          </td>
                                      )}

                                      {/* 7. Ngày hẹn (Shared) */}
                                      {isFirst && (
                                          <td rowSpan={rowSpan} className="text-center" style={{verticalAlign: "middle"}}>
                                              {r.ChonNgay ? new Date(r.ChonNgay).toLocaleDateString("vi-VN") : ""}
                                          </td>
                                      )}
                                    <td className="text-center">
                                      {r.NgayBatDau
                                        ? new Date(r.NgayBatDau).toLocaleDateString("vi-VN")
                                        : "-"}
                                    </td>

                                    <td className="text-center">
                                      {r.NgayKetThuc
                                        ? new Date(r.NgayKetThuc).toLocaleDateString("vi-VN")
                                        : "-"}
                                    </td>
                                      {/* 8. Trạng thái (Shared) */}
                                      {isFirst && (
                                          <td rowSpan={rowSpan} className="text-center" style={{verticalAlign: "middle"}}>
                                              <span>
                                                  {r.TrangThai}
                                              </span>
                                          </td>
                                      )}

                                      {/* 9. Hình thức (Shared) */}
                                      {isFirst && (
                                          <td rowSpan={rowSpan} className="text-center" style={{verticalAlign: "middle"}}>
                                              {r.TenHinhThuc}
                                          </td>
                                      )}
                                  </tr>
                              );
                          });
                      })
                    ) : (
                      <tr>
                        <td colSpan="9" className="text-center text-muted py-3">
                          {currentLanguage === "vi" ? "Không có yêu cầu nào" : currentLanguage === "ko" ? "요청이 없습니다" : "No requests found"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* --- PHÂN TRANG --- */}
              <div className="d-flex justify-content-between align-items-center px-3 py-2 border-top bg-light flex-shrink-0" style={{ marginTop: "0", borderTop: "1px solid #dee2e6" }}>
                <div className="text-muted small">
                  {currentLanguage === "vi"
                    ? `Hiển thị ${currentTableRows.length} / ${filteredData.length} hàng (trang ${currentPage}/${totalPages})`
                    : currentLanguage === "ko"
                    ? `${currentTableRows.length} / ${filteredData.length} 행 표시 (페이지 ${currentPage}/${totalPages})`
                    : `Showing ${currentTableRows.length} / ${filteredData.length} rows (page ${currentPage}/${totalPages})`}
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
                            {idx > 0 && arr[idx - 1] !== p - 1 && (
                              <li className="page-item disabled"><span className="page-link">…</span></li>
                            )}
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
                </div>
                <div className="ms-3 text-muted small">
                  {currentLanguage === "vi" ? `Trang ${currentPage}/${totalPages}` : currentLanguage === "ko" ? `페이지 ${currentPage}/${totalPages}` : `Page ${currentPage}/${totalPages}`}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem", marginTop: "2rem" }}>
        {/* --- DỮ LIỆU LỢC --- */}
        <div style={{ background: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
          <h5 className="fw-semibold text-primary mb-4" style={{ lineHeight: 1.4, paddingTop: 2 }}>
            {currentLanguage === "vi" ? "Dữ liệu lọc" : currentLanguage === "ko" ? "데이터 요약" : "Data Overview"}
          </h5>

          <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 1fr", gap: "1rem", alignItems: "start" }}>
            {/* Donut Chart - Left Side */}
            <div style={{ height: 220, position: "relative" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={Object.entries(
                      filteredData.reduce((acc, cur) => {
                        const key = cur.LoaiDichVu || (currentLanguage === "vi" ? "Không xác định" : "Unknown");
                        acc[key] = (acc[key] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([name, count]) => ({ name, value: count }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    labelLine={false}
                  >
                    {Object.entries(
                      filteredData.reduce((acc, cur) => {
                        const key = cur.LoaiDichVu || (currentLanguage === "vi" ? "Không xác định" : "Unknown");
                        acc[key] = (acc[key] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([name], i) => (
                      <Cell key={i} fill={getServiceColor(name, serviceColorMap)} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none" }}>
                <h4 style={{ fontSize: "1.6rem", fontWeight: "700", color: "#2563eb", marginBottom: "0" }}>
                  {filteredData.length}
                </h4>
              </div>
            </div>

            {/* B2B Table */}
            <div>
              <div style={{ backgroundColor: "#3b82f6", color: "#fff", padding: "8px 12px", borderRadius: "6px 6px 0 0", fontWeight: 600, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>B2B</span>
                <span style={{ fontWeight: 700, fontSize: "12px" }}>{formatCurrency(b2bTotalRevenue)}</span>
              </div>
              <table style={{ width: "100%", fontSize: "11px", borderCollapse: "collapse", backgroundColor: "#f9fafb" }}>
                <thead style={{ backgroundColor: "#1e3a8a", color: "#fff" }}>
                  <tr>
                    <th style={{ padding: "6px 4px", textAlign: "center", fontWeight: 600, borderRight: "1px solid #d1d5db" }}>STT</th>
                    <th style={{ padding: "6px 4px", textAlign: "left", fontWeight: 600, borderRight: "1px solid #d1d5db" }}>{currentLanguage === "vi" ? "Khách hàng B2B" : "Customer"}</th>
                    <th style={{ padding: "6px 4px", textAlign: "center", fontWeight: 600, borderRight: "1px solid #d1d5db" }}>{currentLanguage === "vi" ? "Số lượng dịch vụ" : "Count"}</th>
                    <th style={{ padding: "6px 4px", textAlign: "right", fontWeight: 600 }}>{currentLanguage === "vi" ? "Doanh thu" : "Revenue"}</th>
                  </tr>
                </thead>
                <tbody>
                  {b2bStats.slice(0, 5).map((company, idx) => {
                    const revenue = formatCurrency(company.revenue);
                    return (
                      <tr key={idx} style={{ borderBottom: "1px solid #e5e7eb" }}>
                        <td style={{ padding: "5px 4px", textAlign: "center", fontSize: "11px" }}>{idx + 1}</td>
                        <td style={{ padding: "5px 4px", textAlign: "left", fontSize: "11px", maxWidth: "80px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{company.name ? company.name.substring(0, 12) : "N/A"}</td>
                        <td style={{ padding: "5px 4px", textAlign: "center", fontSize: "11px" }}>{String(company.count).padStart(2, "0")}</td>
                        <td style={{ padding: "5px 4px", textAlign: "right", fontSize: "10px" }}>{revenue}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* B2C Table */}
            <div>
              <div style={{ backgroundColor: "#d4a574", color: "#fff", padding: "8px 12px", borderRadius: "6px 6px 0 0", fontWeight: 600, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>B2C</span>
                <span style={{ fontWeight: 700, fontSize: "12px" }}>{formatCurrency(b2cTotalRevenue)}</span>
              </div>
              <table style={{ width: "100%", fontSize: "11px", borderCollapse: "collapse", backgroundColor: "#f9fafb" }}>
                <thead style={{ backgroundColor: "#78350f", color: "#fff" }}>
                  <tr>
                    <th style={{ padding: "6px 4px", textAlign: "center", fontWeight: 600, borderRight: "1px solid #d1d5db" }}>STT</th>
                    <th style={{ padding: "6px 4px", textAlign: "left", fontWeight: 600, borderRight: "1px solid #d1d5db" }}>{currentLanguage === "vi" ? "Khách hàng B2C" : "Customer"}</th>
                    <th style={{ padding: "6px 4px", textAlign: "center", fontWeight: 600, borderRight: "1px solid #d1d5db" }}>{currentLanguage === "vi" ? "Số lượng dịch vụ" : "Count"}</th>
                    <th style={{ padding: "6px 4px", textAlign: "right", fontWeight: 600 }}>{currentLanguage === "vi" ? "Doanh thu" : "Revenue"}</th>
                  </tr>
                </thead>
                <tbody>
                  {b2cStats.slice(0, 5).map((customer, idx) => {
                    const revenue = formatCurrency(customer.revenue);
                    return (
                      <tr key={idx} style={{ borderBottom: "1px solid #e5e7eb" }}>
                        <td style={{ padding: "5px 4px", textAlign: "center", fontSize: "11px" }}>{idx + 1}</td>
                        <td style={{ padding: "5px 4px", textAlign: "left", fontSize: "11px", maxWidth: "80px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{customer.name ? customer.name.substring(0, 12) : "N/A"}</td>
                        <td style={{ padding: "5px 4px", textAlign: "center", fontSize: "11px" }}>{String(customer.count).padStart(2, "0")}</td>
                        <td style={{ padding: "5px 4px", textAlign: "right", fontSize: "10px" }}>{revenue}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {/* --- KHU VỰC - THEO KHÁCH HÀNG DOANH NGHIỆP --- */}
        <div style={{ background: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", gap: "2rem", alignItems: "stretch" }}>
            {/* Left Section - Chart */}
            <div style={{ flex: "0 0 500px", paddingRight: "1rem", borderRight: "1px solid #e5e7eb" }}>
              <h5 className="fw-semibold mb-4 text-dark">
                {currentLanguage === "vi" ? "Theo khách hàng doanh nghiệp" : currentLanguage === "ko" ? "기업 고객별" : "By Business Customer"}
              </h5>
              
              <select 
                className="form-select form-select-sm mb-4"
                style={{ maxWidth: "100%" }}
                value={filterRegion}
                onChange={(e) => setFilterRegion(e.target.value)}
              >
                <option value="">{currentLanguage === "vi" ? "Tất cả công ty" : currentLanguage === "ko" ? "모든 회사" : "All Companies"}</option>
                {(() => {
                  const companies = [...new Set(filteredData.map(d => d.CompanyName || d.HoTen).filter(Boolean))];
                  return companies.map((company, idx) => (
                    <option key={idx} value={company}>{company}</option>
                  ));
                })()}
              </select>

              <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                {/* Pie Chart */}
                <div style={{ flex: "0 0 150px", height: 150, position: "relative" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={(() => {
                          const companyData = filteredData.reduce((acc, cur) => {
                            const company = cur.CompanyName || cur.HoTen || (currentLanguage === "vi" ? "Khác" : currentLanguage === "ko" ? "기타" : "Other");
                            acc[company] = (acc[company] || 0) + 1;
                            return acc;
                          }, {});
                          return Object.entries(companyData).slice(0, 7).map(([name, value]) => ({ name, value }));
                        })()}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={60}
                        labelLine={false}
                      >
                        {(() => {
                          const colors = ["#ef4444", "#f87171", "#14b8a6", "#2dd4bf", "#fbbf24", "#fcd34d", "#60a5fa"];
                          return colors.map((color, i) => <Cell key={i} fill={color} />);
                        })()}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
                    <h4 style={{ fontSize: "1.4rem", fontWeight: "700", color: "#1f2937", marginBottom: "0px" }}>
                      {filteredData.length}
                    </h4>
                    <small style={{ color: "#6b7280", fontSize: "0.65rem" }}>
                      {currentLanguage === "vi" ? "Dịch vụ" : currentLanguage === "ko" ? "서비스" : "Services"}
                    </small>
                  </div>
                </div>

                {/* Legend */}
                <div style={{ flex: 1 }}>
                  <h6 className="fw-semibold mb-3 text-secondary" style={{ fontSize: "0.85rem" }}>
                    {currentLanguage === "vi" ? "Tổng quan theo công ty" : "Overview"}
                  </h6>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {(() => {
                      const companyData = filteredData.reduce((acc, cur) => {
                        const company = cur.CompanyName || cur.HoTen || (currentLanguage === "vi" ? "Khác" : "Other");
                        acc[company] = (acc[company] || 0) + 1;
                        return acc;
                      }, {});
                      
                      const sortedCompanies = Object.entries(companyData)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 5);
                      
                      const total = Object.values(companyData).reduce((s, v) => s + v, 0);
                      const colors = ["#ef4444", "#14b8a6", "#fbbf24"];

                      return sortedCompanies.map(([company, count], idx) => {
                        const percent = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                        const displayCompany = company.length > 18 ? company.substring(0, 15) + "..." : company;
                        return (
                          <div key={idx} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem" }}>
                            <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: colors[idx % colors.length], flexShrink: 0 }}></div>
                            <span style={{ color: "#4b5563", flex: 1 }}>{displayCompany}</span>
                            <span style={{ fontWeight: "600", color: "#1f2937" }}>{count}</span>
                            <span style={{ color: "#9ca3af", minWidth: "30px", textAlign: "right" }}>({percent}%)</span>
                          </div>
                        );
                      });
                    })()}
                  </div>

                  <div className="mt-2 pt-2 border-top" style={{ borderColor: "#e5e7eb", paddingTop: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", fontWeight: "600" }}>
                      <span>{currentLanguage === "vi" ? "Tổng cộng" : "Total"}</span>
                      <span style={{ color: "#2563eb" }}>{filteredData.length} {currentLanguage === "vi" ? "dịch vụ" : "services"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section - Data Tables */}
            <div style={{ flex: 1, paddingLeft: "1rem" }}>
              <h5 className="fw-semibold mb-4 text-dark">
                {currentLanguage === "vi" ? "Dữ liệu lọc" : currentLanguage === "ko" ? "필터링된 데이터" : "Filtered Data"}
              </h5>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
                {(() => {
                  // Group data by company and calculate totals
                  const companyGroups = filteredData.reduce((acc, cur) => {
                    const company = cur.CompanyName || cur.HoTen || (currentLanguage === "vi" ? "Không xác định" : "Unknown");
                    if (!acc[company]) {
                      acc[company] = { services: [], totalRevenue: 0 };
                    }
                    acc[company].services.push(cur);
                    const revenue = parseFloat(cur.DoanhThu) || parseFloat(cur.PhiDichVu) || 0;
                    acc[company].totalRevenue += revenue;
                    return acc;
                  }, {});

                  // Get top 3 companies by service count
                  const topCompanies = Object.entries(companyGroups)
                    .sort((a, b) => b[1].services.length - a[1].services.length)
                    .slice(0, 3);

                  const companyColors = ["#6b7280", "#06b6d4", "#d4a574"];
                  const companyLabels = ["Công ty A", "Công ty B", "Công ty C"];

                  return topCompanies.map(([companyName, data], idx) => (
                    <div key={idx}>
                      <div style={{ 
                        backgroundColor: companyColors[idx], 
                        color: "#fff", 
                        padding: "6px 12px", 
                        borderRadius: "6px 6px 0 0", 
                        fontWeight: 600,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: "0.85rem"
                      }}>
                        <span>{companyLabels[idx]}</span>
                        <span style={{ fontWeight: 700, fontSize: "0.8rem" }}>
                          {data.services.length}
                        </span>
                      </div>
                      
                      <table style={{ 
                        width: "100%", 
                        fontSize: "0.75rem", 
                        borderCollapse: "collapse", 
                        backgroundColor: "#f9fafb"
                      }}>
                        <thead style={{ backgroundColor: companyColors[idx], color: "#fff", opacity: 0.85 }}>
                          <tr>
                            <th style={{ padding: "4px 6px", textAlign: "center", fontWeight: 600, borderRight: "1px solid #d1d5db" }}>
                              STT
                            </th>
                            <th style={{ padding: "4px 6px", textAlign: "left", fontWeight: 600, borderRight: "1px solid #d1d5db" }}>
                              {currentLanguage === "vi" ? "Tên dịch vụ" : "Service"}
                            </th>
                            <th style={{ padding: "4px 6px", textAlign: "right", fontWeight: 600 }}>
                              {currentLanguage === "vi" ? "Doanh thu" : "Revenue"}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.services.slice(0, 5).map((service, sIdx) => {
                            const revenue = parseFloat(service.DoanhThu) || parseFloat(service.PhiDichVu) || 0;
                            const serviceName = service.TenDichVu || service.LoaiDichVu || (currentLanguage === "vi" ? "Giấy đủ điều kiện" : "Service");
                            return (
                              <tr key={sIdx} style={{ borderBottom: "1px solid #e5e7eb" }}>
                                <td style={{ padding: "4px 6px", textAlign: "center", borderRight: "1px solid #e5e7eb", fontWeight: 500, color: "#374151" }}>
                                  {sIdx + 1}
                                </td>
                                <td style={{ padding: "4px 6px", textAlign: "left", borderRight: "1px solid #e5e7eb", color: "#4b5563", maxWidth: "0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {serviceName.length > 15 ? serviceName.substring(0, 15) + "..." : serviceName}
                                </td>
                                <td style={{ padding: "4px 6px", textAlign: "right", fontWeight: 600, color: "#1f2937" }}>
                                  {revenue === 0 ? "0" : formatCurrency(revenue)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* --- TRẠNG THÁI THỰC HIỆN --- */}
        <div style={{ background: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
          <h5 className="fw-semibold mb-4 text-dark">
            {currentLanguage === "vi" ? "Theo trạng thái thực hiện" : currentLanguage === "ko" ? "실행 상태별" : "By Implementation Status"}
          </h5>
          
          {(() => {
            // Group theo TrangThaiThucHien (trạng thái thực hiện)
            const grouped = filteredData.reduce((acc, cur) => {
              const status = cur.TrangThaiThucHien || "Không xác định";
              acc[status] = (acc[status] || 0) + 1;
              return acc;
            }, {});
            const total = Object.values(grouped).reduce((s, v) => s + v, 0);
            
            // Màu sắc cho từng trạng thái
            const statusColorMap = { 
              "Tư vấn": "#60a5fa",           // Blue
              "Đang xử lý": "#34d399",       // Green
              "Đang nộp hồ sơ": "#fbbf24",   // Yellow
              "Hoàn thành": "#10b981",        // Green darker
              "Không xác định": "#9ca3af"    // Gray
            };

            // Helper để lấy màu cho status
            const getStatusColor = (status) => {
              return statusColorMap[status] || "#9ca3af";
            };

            // Tạo dữ liệu cho pie chart
            const pieData = Object.entries(grouped).map(([status, value]) => ({
              name: statusTranslations[status]?.[currentLanguage] || status,
              value,
              originalStatus: status
            }));

            return (
              <div style={{ display: "flex", gap: "2rem", alignItems: "stretch" }}>
                {/* Cột trái: Pie chart */}
                <div style={{ flex: "0 0 250px" }}>
                  <div style={{ height: 250, position: "relative" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                          labelLine={false}
                        >
                          {pieData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={getStatusColor(entry.originalStatus)}
                              cursor="pointer"
                              onClick={() => {
                                setFilterStatus(entry.originalStatus === filterStatus ? "" : entry.originalStatus);
                                const actionText = entry.originalStatus === filterStatus 
                                  ? (currentLanguage === "vi" ? "Hiển thị tất cả trạng thái" : currentLanguage === "ko" ? "모든 상태 표시" : "Show all statuses") 
                                  : (currentLanguage === "vi" ? `Lọc theo trạng thái: ${entry.name}` : currentLanguage === "ko" ? `상태로 필터링: ${entry.name}` : `Filter by: ${entry.name}`);
                                showToast(actionText, "info");
                              }}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none" }}>
                      <h4 style={{ fontSize: "2rem", fontWeight: "700", color: "#2563eb", marginBottom: "0" }}>
                        {total}
                      </h4>
                    </div>
                  </div>
                </div>

                {/* Cột phải: Hai bảng */}
                <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  {/* Bảng 1: Đang tư vấn */}
                  <div>
                    <div style={{ backgroundColor: "#60a5fa", color: "#fff", padding: "8px 12px", borderRadius: "6px 6px 0 0", fontWeight: 600, textAlign: "center" }}>
                      {currentLanguage === "vi" ? "Đang tư vấn" : currentLanguage === "ko" ? "상담 중" : "Consulting"}
                    </div>
                    <table style={{ width: "100%", fontSize: "11px", borderCollapse: "collapse", backgroundColor: "#f9fafb" }}>
                      <thead style={{ backgroundColor: "#1e40af", color: "#fff" }}>
                        <tr>
                          <th style={{ padding: "6px 4px", textAlign: "center", fontWeight: 600, borderRight: "1px solid #d1d5db" }}>STT</th>
                          <th style={{ padding: "6px 4px", textAlign: "left", fontWeight: 600, borderRight: "1px solid #d1d5db" }}>
                            {currentLanguage === "vi" ? "Khách hàng" : currentLanguage === "ko" ? "고객" : "Customer"}
                          </th>
                          <th style={{ padding: "6px 4px", textAlign: "left", fontWeight: 600, borderRight: "1px solid #d1d5db" }}>
                            {currentLanguage === "vi" ? "Tên dịch vụ" : currentLanguage === "ko" ? "서비스명" : "Service"}
                          </th>
                          <th style={{ padding: "6px 4px", textAlign: "right", fontWeight: 600 }}>
                            {currentLanguage === "vi" ? "Doanh thu" : currentLanguage === "ko" ? "매출" : "Revenue"}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.filter(r => r.TrangThaiThucHien === "Tư vấn").slice(0, 5).map((row, idx) => (
                          <tr key={idx} style={{ borderBottom: "1px solid #e5e7eb" }}>
                            <td style={{ padding: "6px 4px", textAlign: "center", borderRight: "1px solid #e5e7eb" }}>{idx + 1}</td>
                            <td style={{ padding: "6px 4px", borderRight: "1px solid #e5e7eb" }}>{row.TenKhachHang || row.CompanyName || "-"}</td>
                            <td style={{ padding: "6px 4px", borderRight: "1px solid #e5e7eb" }}>{row.TenDichVu || "-"}</td>
                            <td style={{ padding: "6px 4px", textAlign: "right", fontWeight: 600, color: "#2563eb" }}>
                              {formatCurrency(row.DoanhThu || row.PhiDichVu || 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Bảng 2: Đã tạo đơn */}
                  <div>
                    <div style={{ backgroundColor: "#34d399", color: "#fff", padding: "8px 12px", borderRadius: "6px 6px 0 0", fontWeight: 600, textAlign: "center" }}>
                      {currentLanguage === "vi" ? "Đã tạo đơn" : currentLanguage === "ko" ? "주문 생성됨" : "Orders Created"}
                    </div>
                    <table style={{ width: "100%", fontSize: "11px", borderCollapse: "collapse", backgroundColor: "#f9fafb" }}>
                      <thead style={{ backgroundColor: "#047857", color: "#fff" }}>
                        <tr>
                          <th style={{ padding: "6px 4px", textAlign: "center", fontWeight: 600, borderRight: "1px solid #d1d5db" }}>STT</th>
                          <th style={{ padding: "6px 4px", textAlign: "left", fontWeight: 600, borderRight: "1px solid #d1d5db" }}>
                            {currentLanguage === "vi" ? "Khách hàng" : currentLanguage === "ko" ? "고객" : "Customer"}
                          </th>
                          <th style={{ padding: "6px 4px", textAlign: "left", fontWeight: 600, borderRight: "1px solid #d1d5db" }}>
                            {currentLanguage === "vi" ? "Tên dịch vụ" : currentLanguage === "ko" ? "서비스명" : "Service"}
                          </th>
                          <th style={{ padding: "6px 4px", textAlign: "right", fontWeight: 600 }}>
                            {currentLanguage === "vi" ? "Doanh thu" : currentLanguage === "ko" ? "매출" : "Revenue"}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.filter(r => r.TrangThaiThucHien === "Đang xử lý" || r.TrangThaiThucHien === "Đang nộp hồ sơ").slice(0, 5).map((row, idx) => (
                          <tr key={idx} style={{ borderBottom: "1px solid #e5e7eb" }}>
                            <td style={{ padding: "6px 4px", textAlign: "center", borderRight: "1px solid #e5e7eb" }}>{idx + 1}</td>
                            <td style={{ padding: "6px 4px", borderRight: "1px solid #e5e7eb" }}>{row.TenKhachHang || row.CompanyName || "-"}</td>
                            <td style={{ padding: "6px 4px", borderRight: "1px solid #e5e7eb" }}>{row.TenDichVu || "-"}</td>
                            <td style={{ padding: "6px 4px", textAlign: "right", fontWeight: 600, color: "#2563eb" }}>
                              {formatCurrency(row.DoanhThu || row.PhiDichVu || 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* --- TRẠNG THÁI --- */}
        <div style={{ background: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", marginTop: "0rem" }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-semibold text-primary mb-0">
              {currentLanguage === "vi" ? "Dữ liệu lọc" : currentLanguage === "ko" ? "데이터 필터" : "Filtered Data"}
            </h5>
          </div>

          <h6 className="fw-semibold mb-3" style={{ color: "#374151" }}>
            {currentLanguage === "vi" ? "Theo nhân viên phụ trách" : currentLanguage === "ko" ? "담당 직원별" : "By Staff in Charge"}
          </h6>

          <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start" }}>
            {/* Donut Chart on the left */}
            <div style={{ flex: "0 0 200px" }}>
              <div style={{ height: 200, position: "relative" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={Object.entries(
                        filteredData.reduce((acc, cur) => {
                          const staff = cur.NguoiPhuTrach || cur.nguoiPhuTrach || "Chưa phân công";
                          acc[staff] = (acc[staff] || 0) + 1;
                          return acc;
                        }, {})
                      ).map(([name, count]) => ({ name, value: count }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      labelLine={false}
                    >
                      {Object.entries(
                        filteredData.reduce((acc, cur) => {
                          const staff = cur.NguoiPhuTrach || cur.nguoiPhuTrach || "Chưa phân công";
                          acc[staff] = (acc[staff] || 0) + 1;
                          return acc;
                        }, {})
                      ).map((entry, index) => (
                        <Cell key={index} fill={["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"][index % 6]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
                  <h4 style={{ fontSize: "2rem", fontWeight: "700", color: "#2563eb", marginBottom: "0" }}>
                    {filteredData.length}
                  </h4>
                </div>
              </div>
            </div>

            {/* Staff columns on the right */}
            <div style={{ flex: 1, display: "flex", gap: "1rem", overflowX: "auto" }}>
              {(() => {
                const staffWithOrders = Object.entries(
                  filteredData.reduce((acc, cur) => {
                    const staff = cur.NguoiPhuTrach || cur.nguoiPhuTrach || "Chưa phân công";
                    if (!acc[staff]) acc[staff] = [];
                    acc[staff].push(cur);
                    return acc;
                  }, {})
                )
                .filter(([staffName, records]) => records.length > 0 && staffName !== "Chưa phân công")
                .sort((a, b) => b[1].length - a[1].length)
                .slice(0, 3);

                if (staffWithOrders.length === 0) {
                  return (
                    <div style={{ 
                      flex: 1, 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center", 
                      padding: "40px 20px",
                      backgroundColor: "#f9fafb",
                      borderRadius: "8px",
                      border: "1px dashed #d1d5db"
                    }}>
                      <div style={{ textAlign: "center", color: "#6b7280" }}>
                        <div style={{ fontSize: "48px", marginBottom: "12px" }}>📋</div>
                        <div style={{ fontSize: "14px", fontWeight: 500 }}>
                          {currentLanguage === "vi" 
                            ? "Chưa có nhân viên nào được phân công đơn hàng" 
                            : currentLanguage === "ko" 
                            ? "아직 배정된 주문이 없습니다"
                            : "No staff assigned to orders yet"}
                        </div>
                      </div>
                    </div>
                  );
                }

                return staffWithOrders.map(([staffName, records], idx) => {
                  const totalRevenue = records.reduce((sum, r) => {
                    const revenue = parseFloat(r.DoanhThu || r.doanhThu || r.PhiDichVu || 0);
                    return sum + revenue;
                  }, 0);
                  const colors = ["#6b7280", "#06b6d4", "#d4a574"];
                  const headerColors = ["#374151", "#0e7490", "#92400e"];
                  
                  return (
                    <div key={idx} style={{ flex: "1 1 300px", minWidth: "280px", maxWidth: "350px" }}>
                      <div style={{ 
                        backgroundColor: colors[idx % 3], 
                        color: "#fff", 
                        padding: "10px 16px", 
                        borderRadius: "8px 8px 0 0", 
                        fontWeight: 600,
                        textAlign: "center",
                        fontSize: "14px"
                      }}>
                        {String(staffName)}
                        <div style={{ fontSize: "13px", fontWeight: 700, marginTop: "4px" }}>
                          {formatCurrency(totalRevenue)}
                        </div>
                      </div>
                      
                      <table style={{ 
                        width: "100%", 
                        fontSize: "12px", 
                        borderCollapse: "collapse",
                        backgroundColor: "#f9fafb",
                        border: "1px solid #e5e7eb"
                      }}>
                        <thead style={{ backgroundColor: headerColors[idx % 3], color: "#fff" }}>
                          <tr>
                            <th style={{ padding: "8px 6px", textAlign: "center", fontWeight: 600, borderRight: "1px solid rgba(255,255,255,0.2)", width: "40px" }}>
                              STT
                            </th>
                            <th style={{ padding: "8px 6px", textAlign: "left", fontWeight: 600, borderRight: "1px solid rgba(255,255,255,0.2)" }}>
                              {currentLanguage === "vi" ? "Tên dịch vụ" : currentLanguage === "ko" ? "서비스명" : "Service"}
                            </th>
                            <th style={{ padding: "8px 6px", textAlign: "right", fontWeight: 600, width: "100px" }}>
                              {currentLanguage === "vi" ? "Doanh thu" : currentLanguage === "ko" ? "수익" : "Revenue"}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {records.slice(0, 5).map((rec, i) => {
                            const revenue = parseFloat(rec.DoanhThu || rec.doanhThu || rec.PhiDichVu || 0);
                            return (
                              <tr key={i} style={{ borderBottom: "1px solid #e5e7eb" }}>
                                <td style={{ padding: "8px 6px", textAlign: "center", borderRight: "1px solid #e5e7eb", backgroundColor: "#fff" }}>
                                  {i + 1}
                                </td>
                                <td style={{ padding: "8px 6px", textAlign: "left", borderRight: "1px solid #e5e7eb", backgroundColor: "#fff" }}>
                                  {rec.TenDichVu || rec.tenDichVu || rec.ServiceName || "N/A"}
                                </td>
                                <td style={{ padding: "8px 6px", textAlign: "right", backgroundColor: "#fff", fontWeight: 500 }}>
                                  {formatCurrency(revenue)}
                                </td>
                              </tr>
                            );
                          })}
                          {records.length > 5 && (
                            <tr style={{ backgroundColor: "#f3f4f6" }}>
                              <td colSpan="3" style={{ padding: "6px", textAlign: "center", fontSize: "11px", color: "#6b7280", fontStyle: "italic" }}>
                                +{records.length - 5} {currentLanguage === "vi" ? "dịch vụ khác" : currentLanguage === "ko" ? "기타 서비스" : "more services"}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      </div>
        </div>
      )}

 {activeTab === "b2b" && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "2rem",
            flexWrap: "wrap",
          }}
        >
          {/* LEFT: B2B CHARTS COLUMN */}
          <div
            style={{
              flex: "1 1 40%",
              display: "flex",
              flexDirection: "column",
              gap: "2rem",
            }}
          >
            {/* --- Filter Công Ty --- */}
            <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
               <div className="mb-2 fw-bold text-primary">Bộ lọc doanh nghiệp</div>
               <select
                  className="form-select form-select-sm"
                  style={{ width: "100%" }}
                  value={selectedCompanyId}
                  onChange={(e) => {
                      setSelectedCompanyId(e.target.value);
                      setFilterB2BServiceType(""); // Reset filter con khi đổi công ty
                      setFilterB2BStaff("");
                  }}
                  disabled={b2bLoading}
                >
                  <option value="">
                    {currentLanguage === "vi" ? "Tất cả công ty" : currentLanguage === "ko" ? "모든 기업" : "All Companies"}
                  </option>
                  {uniqueCompanies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name.substring(0, 50)}
                    </option>
                  ))}
                </select>
            </div>

            {/* --- KHỞI TẠO BẢNG MÀU ĐỒNG NHẤT CHO B2B --- */}
            {(() => {
                // 1. Lấy danh sách tất cả loại dịch vụ hiện có - dùng Korean key (để cố định màu)
                const allB2BTypes = [...new Set(baseB2BData.map(s => {
                  const serviceName = s.LoaiDichVu || "Không xác định";
                  // Normalize về Korean key
                  return getServiceKey(serviceName);
                }))].sort();
                
                // 2. Định nghĩa bảng màu cố định (Palette)
                const b2bPalette = [
                  "#3b82f6", // Xanh dương
                  "#f59e0b", // Vàng
                  "#10b981", // Xanh lá
                  "#8b5cf6", // Tím
                  "#ec4899", // Hồng
                  "#f97316", // Cam
                  "#06b6d4", // Cyan
                  "#ef4444", // Đỏ
                  "#84cc16", // Lime
                  "#6366f1"  // Indigo
                ];

                // 3. Map từng dịch vụ (Korean key) với một màu cụ thể
                const b2bColorMap = {};
                allB2BTypes.forEach((type, index) => {
                    b2bColorMap[type] = b2bPalette[index % b2bPalette.length];
                });
                
                // 4. Helper để lấy màu từ translated name
                const getB2BColor = (translatedName) => {
                  const koreanKey = getServiceKey(translatedName);
                  return b2bColorMap[koreanKey] || "#9ca3af";
                };

                return (
                  <>
                    {/* 1. TỔNG QUAN SỐ LƯỢNG DỊCH VỤ (PIE CHART) */}
                    <div
                      style={{
                        background: "#fff",
                        borderRadius: 12,
                        padding: 20,
                        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                      }}
                    >
                      <h5 className="fw-semibold mb-3 text-primary">
                        {currentLanguage === "vi" ? "Tổng quan số lượng dịch vụ" : currentLanguage === "ko" ? "서비스 요약" : "Service Overview"}
                      </h5>
                     
                      
                      {(() => {
                        // SỬA: Dùng filteredB2BServices thay vì baseB2BData để biểu đồ phản ánh đúng dữ liệu đang lọc
                        const stats = Object.entries(
                          filteredB2BServices.reduce((acc, cur) => {
                            const name = cur.LoaiDichVu || "Không xác định";
                            acc[name] = (acc[name] || 0) + 1;
                            return acc;
                          }, {})
                        ).map(([name, value]) => ({ name, value }));
                        
                        const total = filteredB2BServices.length;

                        return (
                           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                              <div style={{ flex: "1 1 50%", minWidth: 200, height: 260, position: "relative" }}>
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie
                                      data={stats}
                                      dataKey="value"
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={50}
                                      outerRadius={80}
                                      paddingAngle={2}
                                    >
                                      {stats.map((entry, index) => {
                                        const isActive = filterB2BServiceType === entry.name;
                                        // Màu từ map đã tạo - dùng helper để handle translated name
                                        const color = getB2BColor(entry.name);

                                        return (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill={color} 
                                                cursor="pointer"
                                                stroke="none"
                                                onClick={() => {
                                                    const newVal = isActive ? "" : entry.name;
                                                    setFilterB2BServiceType(newVal);
                                                    showToast(newVal ? `Đang lọc: ${entry.name}` : "Đã bỏ lọc dịch vụ", "info");
                                                }}
                                            />
                                        );
                                      })}
                                    </Pie>
                                    <Tooltip />
                                  </PieChart>
                                </ResponsiveContainer>
                                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none" }}>
                                  {/* SỬA: Chỉ hiện con số tổng (filtered), bỏ phần /total */}
                                  <h4 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#2563eb", marginBottom: "0" }}>
                                    {filteredB2BServices.length}
                                  </h4>
                                </div>
                              </div>
                              
                              {/* Legend Interactive */}
                              <div style={{ flex: "1 1 45%", minWidth: 200, maxHeight: 260, overflowY: "auto" }}>
                                {stats.map((item, i) => {
                                   const isActive = filterB2BServiceType === item.name;
                                   const color = getB2BColor(item.name);

                                   return (
                                     <div 
                                        key={i} 
                                        className="d-flex justify-content-between align-items-center mb-2 p-1 rounded" 
                                        style={{ 
                                            fontSize: "0.9rem", 
                                            cursor: "pointer",
                                            backgroundColor: isActive ? "rgba(59, 130, 246, 0.1)" : "transparent",
                                            border: isActive ? "1px solid #3b82f6" : "1px solid transparent"
                                        }}
                                        onClick={() => setFilterB2BServiceType(isActive ? "" : item.name)}
                                     >
                                        <div className="d-flex align-items-center gap-2">
                                          <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }}></div>
                                          <span className="text-truncate" style={{ maxWidth: 120 }} title={item.name}>{item.name}</span>
                                        </div>
                                        <span className="fw-bold">{item.value}</span>
                                     </div>
                                   )
                                })}
                              </div>
                           </div>
                        );
                      })()}
                    </div>

                    {/* 2. SỐ LƯỢNG DỊCH VỤ THEO NHÂN VIÊN (PIE CHART) */}
                    <div
                      style={{
                        background: "#fff",
                        borderRadius: 12,
                        padding: 20,
                        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                      }}
                    >
                      <h5 className="fw-semibold mb-3 text-primary">
                        {currentLanguage === "vi" ? "Số lượng dịch vụ theo nhân viên" : currentLanguage === "ko" ? "직원별 서비스 수" : "Service Count by Staff"}
                      </h5>
                      
                      {(() => {
                        // SỬA: Dùng filteredB2BServices để đồng bộ với bộ lọc hiện tại
                        const unassignedLabel = currentLanguage === "vi" ? "Chưa phân công" : currentLanguage === "ko" ? "미배정" : "Unassigned";
                        const stats = Object.entries(
                          filteredB2BServices.reduce((acc, cur) => {
                            const name = cur.picName || unassignedLabel;
                            acc[name] = (acc[name] || 0) + 1;
                            return acc;
                          }, {})
                        ).map(([name, value]) => ({ name, value }));
                        
                        const total = filteredB2BServices.length;
                        const staffColors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD"];

                        return (
                           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                              <div style={{ flex: "1 1 50%", minWidth: 200, height: 260, position: "relative" }}>
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie
                                      data={stats}
                                      dataKey="value"
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={50}
                                      outerRadius={80}
                                      paddingAngle={2}
                                    >
                                      {stats.map((entry, index) => {
                                        const isActive = filterB2BStaff === entry.name;
                                        return (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill={staffColors[index % staffColors.length]} 
                                                cursor="pointer"
                                                stroke={isActive ? "#000" : "none"}
                                                strokeWidth={isActive ? 2 : 0}
                                                onClick={() => {
                                                    const newVal = isActive ? "" : entry.name;
                                                    setFilterB2BStaff(newVal);
                                                    showToast(newVal ? `Lọc theo nhân viên: ${entry.name}` : "Đã bỏ lọc nhân viên", "info");
                                                }}
                                            />
                                        );
                                      })}
                                    </Pie>
                                    <Tooltip />
                                  </PieChart>
                                </ResponsiveContainer>
                                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none" }}>
                                  {/* SỬA: Chỉ hiện con số tổng (filtered), bỏ phần /total */}
                                  <h4 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#2563eb", marginBottom: "0" }}>
                                    {filteredB2BServices.length}
                                  </h4>
                                </div>
                              </div>
                              
                              {/* Legend Interactive */}
                              <div style={{ flex: "1 1 45%", minWidth: 200, maxHeight: 260, overflowY: "auto" }}>
                                {stats.map((item, i) => {
                                   const isActive = filterB2BStaff === item.name;
                                   return (
                                     <div 
                                        key={i} 
                                        className="d-flex justify-content-between align-items-center mb-2 p-1 rounded" 
                                        style={{ 
                                            fontSize: "0.9rem", 
                                            cursor: "pointer",
                                            backgroundColor: isActive ? "rgba(255, 107, 107, 0.1)" : "transparent",
                                            border: isActive ? "1px solid #FF6B6B" : "1px solid transparent"
                                        }}
                                        onClick={() => setFilterB2BStaff(isActive ? "" : item.name)}
                                     >
                                        <div className="d-flex align-items-center gap-2">
                                          <div style={{ width: 10, height: 10, borderRadius: "50%", background: staffColors[i % staffColors.length] }}></div>
                                          <span className="text-truncate" style={{ maxWidth: 120 }} title={item.name}>{item.name}</span>
                                        </div>
                                        <span className="fw-bold">{item.value}</span>
                                     </div>
                                   )
                                })}
                              </div>
                           </div>
                        );
                      })()}
                    </div>

                    {/* 3. SỐ LƯỢNG DỊCH VỤ THEO THỜI GIAN BẮT ĐẦU (BAR CHART) */}
                    <div
                      style={{
                        background: "#fff",
                        borderRadius: 12,
                        padding: 20,
                        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                      }}
                    >
                       <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="fw-semibold text-primary mb-0">
                          {currentLanguage === "vi" ? "Số lượng theo thời gian bắt đầu" : currentLanguage === "ko" ? "시작 날짜별 수량" : "Count by Start Date"}
                        </h5>
                        <select
                          className="form-select form-select-sm"
                          style={{ width: 140 }}
                          value={timeRange}
                          onChange={(e) => setTimeRange(Number(e.target.value))}
                        >
                          <option value={7}>7 ngày</option>
                          <option value={30}>30 ngày</option>
                          <option value={90}>90 ngày</option>
                          <option value={180}>6 tháng</option>
                        </select>
                      </div>

                      {(() => {
                         const chartData = allDates.map((dateStr) => {
                            const dayData = { date: dateStr };
                            allB2BTypes.forEach(svc => {
                                dayData[svc] = baseB2BData.filter(r => r.startDate === dateStr && r.LoaiDichVu === svc).length;
                            });
                            return dayData;
                         });
                         
                         const hasData = chartData.some(d => Object.keys(d).length > 1 && Object.values(d).some(v => typeof v === 'number' && v > 0));

                         return hasData ? (
                            <ResponsiveContainer width="100%" height={300}>
                              <BarChart data={chartData}>
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={50} />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Legend wrapperStyle={{ fontSize: '11px' }} />
                                {allB2BTypes.map((svc, i) => (
                                   <Bar 
                                     key={i} 
                                     dataKey={svc} 
                                     stackId="a" 
                                     fill={getB2BColor(svc)} 
                                     opacity={filterB2BServiceType && filterB2BServiceType !== svc ? 0.2 : 1}
                                     cursor="pointer"
                                     onClick={() => {
                                        setFilterB2BServiceType(filterB2BServiceType === svc ? "" : svc);
                                        showToast(filterB2BServiceType === svc ? "Đã bỏ lọc dịch vụ" : `Đang lọc: ${svc}`, "info");
                                     }}
                                   />
                                ))}
                              </BarChart>
                            </ResponsiveContainer>
                         ) : (
                            <div className="text-center text-muted py-5 small">
                               {currentLanguage === "vi" ? "Không có dữ liệu trong khoảng thời gian này" : currentLanguage === "ko" ? "이 기간에 데이터가 없습니다" : "No data in this period"}
                            </div>
                         );
                      })()}
                    </div>
                  </>
                );
            })()}
          </div>

          {/* RIGHT: B2B TABLE */}
          <div
            style={{
              flex: "1 1 55%",
              background: "#fff",
              borderRadius: 12,
              padding: "20px 0 0 0", 
              boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
              height: "auto",        
              minHeight: "300px",    
              maxHeight: "900px",   
              display: "flex",          
              flexDirection: "column",  
              overflow: "hidden"    
            }}
          >
            <div className="px-4 mb-3 d-flex justify-content-between align-items-center flex-shrink-0"> 
              <h5 className="fw-semibold mb-0 text-primary">
                {currentLanguage === "vi"
                  ? filterB2BServiceType 
                        ? `Danh sách (${filterB2BServiceType})` 
                        : filterB2BStaff ? `Danh sách (NV: ${filterB2BStaff})` : "Danh Sách Dịch Vụ Khách Hàng Doanh Nghiệp"
                  : "B2B Service List"}
              </h5>
              
              {/* NÚT XÓA BỘ LỌC */}
              {(selectedCompanyId || filterB2BServiceType || filterB2BStaff) && (
                <button 
                    className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                    onClick={() => {
                        setSelectedCompanyId("");
                        setFilterB2BServiceType("");
                        setFilterB2BStaff("");
                        showToast("Đã xóa toàn bộ bộ lọc", "info");
                    }}
                >
                    <FilterX size={16} /> Xóa lọc
                </button>
              )}
            </div>

            {/* WRAPPER BẢNG */}
            <div style={{ 
                flex: "1 1 auto", 
                overflowY: "auto",
                overflowX: "auto",
                padding: "0 20px"  
            }}>
              <table className="table table-bordered align-middle small" style={{ width: "100%", minWidth: "1000px", marginBottom: 0 }}> 
                <thead className="table-light">
                  <tr className="text-center">
                    <th style={{ width: 40, ...headerStyle, position: "sticky", top: 0, zIndex: 10 }}>#</th>
                    <th style={{ ...headerStyle, position: "sticky", top: 0, zIndex: 10 }}>
                      {currentLanguage === "vi" ? "Doanh nghiệp" : currentLanguage === "ko" ? "기업" : "Company"}
                    </th>
                    <th style={{ ...headerStyle, position: "sticky", top: 0, zIndex: 10 }}>
                      {currentLanguage === "vi" ? "Loại dịch vụ" : currentLanguage === "ko" ? "서비스 유형" : "Service Type"}
                    </th>
                    <th style={{ ...headerStyle, position: "sticky", top: 0, zIndex: 10 }}>
                      {currentLanguage === "vi" ? "Tên dịch vụ" : currentLanguage === "ko" ? "서비스명" : "Service Name"}
                    </th>
                    <th style={{ ...headerStyle, position: "sticky", top: 0, zIndex: 10 }}>
                      {currentLanguage === "vi" ? "Mã dịch vụ" : currentLanguage === "ko" ? "서비스 코드" : "Service Code"}
                    </th>
                    <th style={{ ...headerStyle, position: "sticky", top: 0, zIndex: 10 }}>
                      {currentLanguage === "vi" ? "Danh mục" : currentLanguage === "ko" ? "카테고리" : "Category"}
                    </th>
                    <th style={{ ...headerStyle, position: "sticky", top: 0, zIndex: 10 }}>
                      {currentLanguage === "vi" ? "Người phụ trách" : currentLanguage === "ko" ? "담당자" : "PIC"}
                    </th>
                    <th style={{ ...headerStyle, position: "sticky", top: 0, zIndex: 10 }}>
                      {currentLanguage === "vi" ? "Ngày bắt đầu" : currentLanguage === "ko" ? "시작 날짜" : "Start Date"}
                    </th>
                    <th style={{ ...headerStyle, position: "sticky", top: 0, zIndex: 10 }}>
                      {currentLanguage === "vi" ? "Ngày kết thúc" : currentLanguage === "ko" ? "종료 날짜" : "End Date"}
                    </th>
                    <th style={{ ...headerStyle, position: "sticky", top: 0, zIndex: 10 }}>
                      {currentLanguage === "vi" ? "Gói" : currentLanguage === "ko" ? "패키지" : "Package"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentB2BRows.length > 0 ? (
                    currentB2BRows.map((rec, idx) => {
                      const globalIndex = idx + 1 + (b2bCurrentPage - 1) * b2bRowsPerPage;
                      
                      let servicesList = (rec.DanhMuc || "").split(" + ").map(s => s.trim()).filter(s => s !== "");
                      if (servicesList.length === 0) servicesList = [""]; 
                      
                      const subRowsCount = servicesList.length;

                      const currentCompanyId = String(rec.companyId || rec.DoanhNghiepID || "");
                      const prevCompanyId = idx > 0 ? String(currentB2BRows[idx - 1].companyId || currentB2BRows[idx - 1].DoanhNghiepID || "") : null;

                      let shouldRenderCompanyCell = false;
                      let companyRowSpan = 0;

                      if (!currentCompanyId || currentCompanyId !== prevCompanyId) {
                        shouldRenderCompanyCell = true;
                        for (let i = idx; i < currentB2BRows.length; i++) {
                          const nextRec = currentB2BRows[i];
                          if (String(nextRec.companyId || nextRec.DoanhNghiepID || "") !== currentCompanyId) break;
                          
                          const nextServicesList = (nextRec.DanhMuc || "").split(" + ").map(s => s.trim()).filter(s => s !== "");
                          const nextCount = nextServicesList.length > 0 ? nextServicesList.length : 1;
                          
                          companyRowSpan += nextCount;
                        }
                      }

                      const mergedStyle = {
                        backgroundColor: "#fff",
                        verticalAlign: "middle",
                        position: "relative",
                        zIndex: 1,
                        padding: "4px",
                        fontSize: "12px",
                        textAlign: "center",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: "150px"
                      };

                      const danhMucStyle = {
                        backgroundColor: "white",
                        verticalAlign: "middle",
                        padding: "4px 8px",
                        fontSize: "12px",
                        textAlign: "left"
                      };

                      return servicesList.map((svcName, subIdx) => {
                        const isFirstSubRow = subIdx === 0;

                        return (
                          <tr key={`${rec.id || idx}_${subIdx}`} className="bg-white hover:bg-gray-50">
                            {isFirstSubRow && (
                              <td className="border" rowSpan={subRowsCount} style={mergedStyle}>
                                {globalIndex}
                              </td>
                            )}

                            {isFirstSubRow && shouldRenderCompanyCell && (
                              <td className="border fw-bold" rowSpan={companyRowSpan} style={mergedStyle} title={rec.TenDoanhNghiep}>
                                {rec.TenDoanhNghiep || "--"}
                              </td>
                            )}

                            {isFirstSubRow && (
                              <>
                                <td className="border" rowSpan={subRowsCount} style={mergedStyle} title={rec.LoaiDichVu}>
                                  {rec.LoaiDichVu}
                                </td>
                                <td className="border" rowSpan={subRowsCount} style={{...mergedStyle,width:160}} title={rec.TenDichVu}>
                                  {rec.TenDichVu}
                                </td>
                                <td className="border" rowSpan={subRowsCount} style={{...mergedStyle,width:160}}>
                                  {rec.MaDichVu || ""}
                                </td>
                              </>
                            )}

                            <td className="border" style={danhMucStyle}>
                              <div className="px-1" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word",width:150 }}>
                                {svcName}
                              </div>
                            </td>

                            {isFirstSubRow && (
                              <>
                                <td className="border" rowSpan={subRowsCount} style={mergedStyle} title={rec.picName}>
                                  {rec.picName || "—"}
                                </td>
                                <td className="border" rowSpan={subRowsCount} style={mergedStyle}>
                                  {rec.startDate}
                                </td>
                                <td className="border" rowSpan={subRowsCount} style={mergedStyle}>
                                  {rec.endDate}
                                </td>
                                <td className="border" rowSpan={subRowsCount} style={mergedStyle}>
                                  <span className={rec.package === "Cấp tốc" ? "text-danger fw-bold" : ""}>
                                    {rec.package === "Yes" ? "Cấp tốc" : (rec.package === "No" ? "Thường" : rec.package)}
                                  </span>
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      });
                    })
                  ) : (
                    <tr>
                      <td colSpan="9" className="text-center text-muted py-4 border">
                        {currentLanguage === "vi" ? "Không tìm thấy dữ liệu phù hợp" : currentLanguage === "ko" ? "일치하는 데이터를 찾을 수 없습니다" : "No matching B2B data found"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div
              className="d-flex justify-content-between align-items-center px-4 py-3 border-top bg-light flex-shrink-0"
              style={{ marginTop: "auto", zIndex: 20 }}
            >
              <div className="text-muted small">
                {currentLanguage === "vi"
                  ? `Hiển thị ${currentB2BRows.length} / ${sortedB2BData.length} hàng (trang ${b2bCurrentPage}/${totalB2BPages})`
                  : `Showing ${currentB2BRows.length} / ${sortedB2BData.length} rows (page ${b2bCurrentPage}/${totalB2BPages})`}
              </div>

              <div className="d-flex justify-content-center align-items-center">
                <nav>
                  <ul className="pagination pagination-sm mb-0 shadow-sm">
                    <li className={`page-item ${b2bCurrentPage === 1 ? "disabled" : ""}`}>
                      <button className="page-link" onClick={() => { if (b2bCurrentPage > 1) setB2bCurrentPage((p) => p - 1); }}>&laquo;</button>
                    </li>
                    {Array.from({ length: totalB2BPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalB2BPages || (p >= b2bCurrentPage - 1 && p <= b2bCurrentPage + 1))
                      .map((p, idx, arr) => (
                        <React.Fragment key={p}>
                          {idx > 0 && arr[idx - 1] !== p - 1 && (<li className="page-item disabled"><span className="page-link">…</span></li>)}
                          <li className={`page-item ${b2bCurrentPage === p ? "active" : ""}`}>
                            <button className="page-link" onClick={() => { if (p !== b2bCurrentPage) setB2bCurrentPage(p); }}>{p}</button>
                          </li>
                        </React.Fragment>
                      ))}
                    <li className={`page-item ${b2bCurrentPage === totalB2BPages ? "disabled" : ""}`}>
                      <button className="page-link" onClick={() => { if (b2bCurrentPage < totalB2BPages) setB2bCurrentPage((p) => p + 1); }}>&raquo;</button>
                    </li>
                  </ul>
                </nav>
              </div>
              <div className="ms-3 text-muted small">
                {currentLanguage === "vi" ? `Trang ${b2bCurrentPage}/${totalB2BPages}` : `Page ${b2bCurrentPage}/${totalB2BPages}`}
              </div>
            </div>
          </div>
        </div>
      )}
      <style>{`
 
         .table-bordered { border: 1px solid #dee2e6 !important; }
         .table-bordered th, .table-bordered td { border: 1px solid #dee2e6 !important; }
      
      `}</style>
    </div>
  );
};

export default DashboardSummary;