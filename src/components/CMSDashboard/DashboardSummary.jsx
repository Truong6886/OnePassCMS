import React, { useState, useEffect } from "react";
import translateService from "../../utils/translateService";
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

const DashboardSummary = ({
  currentLanguage,
  serviceColorMap,
  filterDichVu,
  setFilterDichVu,
  timeRange,
  setTimeRange,
  filterStatus,
  setFilterStatus,
  allServices,
}) => {
  const [activeTab, setActiveTab] = useState("individual");
  const [b2bServices, setB2bServices] = useState([]);
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [b2bLoading, setB2bLoading] = useState(false);
  const [filterRegion, setFilterRegion] = useState("");
  const [filterMode, setFilterMode] = useState("");
  const [b2bTimeRange, setB2bTimeRange] = useState(7);
  const { currentPage, setCurrentPage, rowsPerPage } = useDashboardData();
  const [selectedTimeCompanyId, setSelectedTimeCompanyId] = useState("");

  // --- STATE MỚI CHO PHÂN TRANG B2B ---
  const [b2bCurrentPage, setB2bCurrentPage] = useState(1);
  const b2bRowsPerPage = 20;

  const filteredData = allData.filter((r) => {
    const matchService = filterDichVu
      ? translateService(r.LoaiDichVu) === filterDichVu
      : true;

    const regionMap = { "+84": "Việt Nam", "+82": "Hàn Quốc" };
    const region = regionMap[r.MaVung] || r.MaVung || "Không xác định";
    const matchRegion = filterRegion ? region === filterRegion : true;

    const matchMode = filterMode ? r.TenHinhThuc === filterMode : true;

    const matchStatus = filterStatus ? r.TrangThai === filterStatus : true;

    return matchService && matchRegion && matchStatus && matchMode;
  });
// Thay thế hàm toVNDateString cũ bằng hàm này
const toVNDateString = (dateInput) => {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null; // Kiểm tra ngày không hợp lệ

  // Ép định dạng YYYY-MM-DD theo giờ Việt Nam
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(d);
  } catch (error) {
    return d.toISOString().split('T')[0]; // Fallback nếu lỗi
  }
};
  // 2. Tạo danh sách ngày cho trục X (dựa trên timeRange)
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

  // Lấy danh sách ngày chuẩn
  const allDates = getLastNDays(timeRange);

  // 3. Map dữ liệu vào biểu đồ
// Thay thế đoạn code chartDataByTime cũ bằng đoạn này
const chartDataByTime = allDates.map((dateStr) => {
  const dayData = { date: dateStr };
  
  // Kiểm tra an toàn cho allServices
  const servicesToMap = allServices && allServices.length > 0 ? allServices : [];

  servicesToMap.forEach((service) => {
    // Tìm số lượng record khớp ngày và tên dịch vụ
    const count = filteredData.filter((r) => {
      // 1. Kiểm tra có ngày tạo không
      if (!r.NgayTao) return false;

      // 2. Chuẩn hóa ngày (YYYY-MM-DD)
      const rDate = toVNDateString(r.NgayTao);
      
      // 3. Chuẩn hóa tên dịch vụ (Quan trọng: Trim khoảng trắng thừa nếu có)
      const rServiceRaw = translateService(r.LoaiDichVu);
      const rService = rServiceRaw ? rServiceRaw.trim() : "";
      const targetService = service ? service.trim() : "";

      // 4. So sánh
      return rDate === dateStr && rService === targetService;
    }).length;

    dayData[service] = count;
  });
  return dayData;
});
 
    

  const groupedByStatus = filteredData.reduce((acc, cur) => {
    const status = cur.TrangThai || "Không xác định";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  const totalStatus = Object.values(groupedByStatus).reduce(
    (sum, v) => sum + v,
    0
  );
  const totalPages = Math.ceil(filteredData.length / rowsPerPage) || 1;
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentTableRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);

  const [selectedCompanyId, setSelectedCompanyId] = useState("");
 const fetchAllData = async () => {
    setLoading(true);
    try {
      // Thay fetch bằng authenticatedFetch
      const res = await authenticatedFetch(
        `https://onepasscms-backend.onrender.com/api/yeucau?limit=1000`
      );
      
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
  }, [filterDichVu, filterRegion, filterMode, filterStatus, rowsPerPage]);

  // Reset trang B2B về 1 khi đổi bộ lọc công ty
  useEffect(() => {
    setB2bCurrentPage(1);
  }, [selectedCompanyId]);

 const fetchB2BData = async () => {
    setB2bLoading(true);
    try {
      // 1. Fetch Services (Thay fetch bằng authenticatedFetch)
      const serviceRes = await authenticatedFetch(
        "https://onepasscms-backend.onrender.com/api/b2b/services?limit=1000"
      );
      const serviceJson = await serviceRes.json();
      const rawServices = serviceJson.success ? serviceJson.data : [];

      // 2. Fetch Companies (Thay fetch bằng authenticatedFetch)
      const companyRes = await authenticatedFetch(
        "https://onepasscms-backend.onrender.com/api/b2b/approved"
      );
      const companyJson = await companyRes.json();
      const rawCompanies = companyJson.success ? companyJson.data : [];

      // 3. Merge Data (Giữ nguyên logic cũ)
      const merged = rawServices.map((service) => {
        const company =
          rawCompanies.find((c) => c.ID === service.DoanhNghiepID) || {};

        return {
          ...service,
          TenDoanhNghiep: company.TenDoanhNghiep || service.TenDoanhNghiep,
          SoDienThoai: company.SoDienThoai || service.SoDienThoai,
          Email: company.Email || service.Email,
          NguoiDaiDien: company.NguoiDaiDien || service.NguoiDaiDien,
          LoaiDichVu: service.LoaiDichVu,
          TenDichVu: service.TenDichVu,
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

  // 2. Lọc danh sách dịch vụ dựa trên selectedCompanyId
  const filteredB2BServices = selectedCompanyId
    ? b2bServices.filter(
        (s) => String(s.DoanhNghiepID) === String(selectedCompanyId)
      )
    : b2bServices;

  const b2bTotal = filteredB2BServices.length;

  const b2bPieData = selectedCompanyId
    ? Object.entries(
        filteredB2BServices.reduce((acc, cur) => {
          const name = cur.LoaiDichVu || cur.serviceName || "Không xác định";
          acc[name] = (acc[name] || 0) + 1;
          return acc;
        }, {})
      ).map(([name, value]) => ({ name, value }))
    : Object.entries(
        filteredB2BServices.reduce((acc, cur) => {
          const companyName = cur.TenDoanhNghiep || "Không xác định";
          acc[companyName] = (acc[companyName] || 0) + 1;
          return acc;
        }, {})
      ).map(([name, value]) => ({ name, value }));
  const filteredB2BTimeChart = selectedTimeCompanyId
    ? b2bServices.filter(
        (s) => String(s.DoanhNghiepID) === String(selectedTimeCompanyId)
      )
    : b2bServices;
  const b2bFilteredForChart = filteredB2BServices.filter((r) => {
    if (!r.NgayTao) return false;
    const date = new Date(r.NgayTao);
    const now = new Date();
    const diffDays = (now - date) / (1000 * 60 * 60 * 24);
    return diffDays <= b2bTimeRange;
  });

  const b2bDates = Array.from(
    new Set(
      b2bFilteredForChart.map((r) =>
        new Date(r.NgayTao).toISOString().slice(0, 10)
      )
    )
  ).sort();

  // Get all unique service types for the stack
  const b2bUniqueServiceTypes = Array.from(
    new Set(b2bServices.map((s) => s.LoaiDichVu || s.serviceName || "Khác"))
  );

  const b2bChartData = b2bDates.map((date) => {
    const dayData = { date };
    b2bUniqueServiceTypes.forEach((serviceType) => {
      dayData[serviceType] = b2bFilteredForChart.filter(
        (r) =>
          new Date(r.NgayTao).toISOString().slice(0, 10) === date &&
          (r.LoaiDichVu || r.serviceName) === serviceType
      ).length;
    });
    return dayData;
  });

  const customerTabs = [
    { key: "individual", labelVi: "Khách Hàng Cá Nhân", labelEn: "Individual" },
    { key: "b2b", labelVi: "Khách Hàng Doanh Nghiệp", labelEn: "B2B" },
  ];

  // --- LOGIC PHÂN TRANG B2B ---
  // 1. Sắp xếp dữ liệu trước (để đảm bảo nhóm được gom lại nếu bị chia cắt bởi trang, nhưng tốt nhất là sắp xếp toàn bộ trước)
  const sortedB2BData = [...filteredB2BServices].sort((a, b) => {
    const nameA = (a.TenDoanhNghiep || a.companyName || "").toLowerCase();
    const nameB = (b.TenDoanhNghiep || b.companyName || "").toLowerCase();
    return nameA.localeCompare(nameB);
  });

  // 2. Tính toán slice cho trang hiện tại
  const b2bIndexOfLastRow = b2bCurrentPage * b2bRowsPerPage;
  const b2bIndexOfFirstRow = b2bIndexOfLastRow - b2bRowsPerPage;
  const currentB2BRows = sortedB2BData.slice(
    b2bIndexOfFirstRow,
    b2bIndexOfLastRow
  );
  const totalB2BPages = Math.ceil(sortedB2BData.length / b2bRowsPerPage) || 1;

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
        {customerTabs.map((tab) => (
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
            {currentLanguage === "vi" ? tab.labelVi : tab.labelEn}
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
        <div style={{ flex: "1 1 48%", display: "flex", flexDirection: "column", gap: "2rem" }}>
      
          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              padding: "20px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              cursor: "pointer",
            }}
            onClick={() => {
              setFilterDichVu(""); 
              showToast(currentLanguage === "vi" ? "Hiển thị toàn bộ danh sách yêu cầu" : "Showing all requests", "info");
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.01)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <h5 className="fw-semibold mb-3 text-primary">
              {currentLanguage === "vi" ? "Tổng quan số lượng dịch vụ" : "Service Overview"}
            </h5>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "2rem" }}>
              <div style={{ flex: "1 1 50%", minWidth: 280, height: 320, position: "relative" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      dataKey="value"
                      data={Object.entries(
                        filteredData.reduce((acc, cur) => {
                          const name = translateService(cur.LoaiDichVu || "Không xác định");
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
                          const name = translateService(cur.LoaiDichVu || "Không xác định");
                          acc[name] = (acc[name] || 0) + 1;
                          return acc;
                        }, {})
                      ).map(([name], i) => (
                        <Cell
                          key={i}
                          fill={serviceColorMap[name] || "#60a5fa"}
                          cursor="pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            const newFilter = name === filterDichVu ? "" : name;
                            setFilterDichVu(newFilter);
                            showToast(
                              currentLanguage === "vi"
                                ? newFilter ? `Đang lọc danh sách theo dịch vụ: ${name}` : "Hiển thị toàn bộ danh sách yêu cầu"
                                : newFilter ? `Filtering requests for: ${name}` : "Showing all requests",
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
                  {currentLanguage === "vi" ? "Tổng quan số lượng dịch vụ" : "Service Summary"}
                </h6> 
                {(() => {
                  const grouped = filteredData.reduce((acc, cur) => {
                    const name = translateService(cur.LoaiDichVu || "Không xác định");
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
                            showToast(
                              currentLanguage === "vi"
                                ? newFilter 
                                  ? `Đang lọc danh sách theo dịch vụ: ${name}` 
                                  : "Hiển thị toàn bộ danh sách yêu cầu"
                                : newFilter 
                                  ? `Filtering requests for: ${name}` 
                                  : "Showing all requests",
                              "info"
                            );
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
                        <span>{currentLanguage === "vi" ? "Tổng cộng" : "Total"}</span>
                        <span>
                          {total} <span style={{ color: "#6b7280" }}>{currentLanguage === "vi" ? "yêu cầu" : "requests"}</span>
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* --- BAR CHART --- */}
          <div style={{ background: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-semibold text-primary mb-0">
                {currentLanguage === "vi" ? "Số lượng dịch vụ theo thời gian" : "Service Count Over Time"}
              </h5>
              <select
                className="form-select form-select-sm"
                style={{ width: 160 }}
                value={timeRange}
                onChange={(e) => setTimeRange(Number(e.target.value))}
              >
                <option value={7}>7 ngày gần nhất</option>
                <option value={30}>30 ngày gần nhất</option>
                <option value={90}>90 ngày gần nhất</option>
                <option value={180}>6 tháng gần nhất</option>
              </select>
            </div>

            {chartDataByTime.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartDataByTime}>
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} angle={-30} textAnchor="end" height={60} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {allServices.map((service, i) => (
                    <Bar
                      key={i}
                      dataKey={service}
                      stackId="a"
                      fill={serviceColorMap[service] || "#9ca3af"}
                      cursor="pointer"
                      opacity={filterDichVu && filterDichVu !== service ? 0.4 : 1}
                      onClick={() => {
                        setFilterDichVu(prev => (prev === service ? "" : service));
                        showToast(currentLanguage === "vi" ? (filterDichVu === service ? "Hiển thị toàn bộ dịch vụ" : `Đang lọc theo dịch vụ: ${service}`) : "Info", "info");
                      }}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-muted py-5">
                {currentLanguage === "vi" ? "Không có dữ liệu trong khoảng thời gian đã chọn" : "No data available for selected period"}
              </div>
            )}
          </div>

          {/* --- KHU VỰC --- */}
          <div style={{ background: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
            <h5 className="fw-semibold mb-3 text-primary">
              {currentLanguage === "vi" ? "Số lượng dịch vụ theo khu vực" : "Service Count by Region"}
            </h5>
            {(() => {
              const regionMap = { "+84": "Việt Nam", "+82": "Hàn Quốc" };
              const grouped = filteredData.reduce((acc, cur) => {
                const region = regionMap[cur.MaVung] || cur.MaVung || "Không xác định";
                acc[region] = (acc[region] || 0) + 1;
                return acc;
              }, {});
              const total = Object.values(grouped).reduce((s, v) => s + v, 0);
              const colors = ["#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899", "#f97316"];

              return (
                <>
                  {Object.entries(grouped).map(([region, count], i) => {
                    const percent = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                    return (
                      <div
                        key={i}
                        onClick={() => {
                          setFilterRegion(region === filterRegion ? "" : region);
                          showToast(currentLanguage === "vi" ? (region === filterRegion ? "Hiển thị tất cả khu vực" : `Lọc theo khu vực: ${region}`) : "Info", "info");
                        }}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, gap: 12, cursor: "pointer",
                          background: filterRegion === region ? "rgba(37,99,235,0.08)" : "transparent",
                          borderRadius: 8, padding: "4px 8px", transition: "background 0.2s ease",
                        }}
                      >
                        <div style={{ width: 100, fontWeight: 500 }}>{region}</div>
                        <div style={{ flex: 1, background: "#f3f4f6", borderRadius: 8, height: 10, overflow: "hidden" }}>
                          <div style={{ width: `${percent}%`, background: colors[i % colors.length], height: "100%", borderRadius: 8, transition: "width 0.3s ease" }}></div>
                        </div>
                        <div style={{ width: 90, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 6 }}>
                          <strong style={{ color: "#2563eb" }}>{count}</strong>
                          <span style={{ color: "#6b7280" }}>{percent}%</span>
                        </div>
                      </div>
                    );
                  })}
                  <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top" style={{ fontWeight: "600", color: "#1f2937" }}>
                    <span>Tổng cộng</span>
                    <span>{total} <span style={{ color: "#6b7280" }}>{currentLanguage === "vi" ? "yêu cầu" : "requests"}</span></span>
                  </div>
                </>
              );
            })()}
          </div>

          {/* --- KÊNH LIÊN HỆ --- */}
          <div style={{ background: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
            <h5 className="fw-semibold mb-3 text-primary">
              {currentLanguage === "vi" ? "Số lượng dịch vụ theo kênh liên hệ" : "Service Count by Contact Channel"}
            </h5>
            {(() => {
              const grouped = filteredData.reduce((acc, cur) => {
                const type = cur.TenHinhThuc || "Không xác định";
                acc[type] = (acc[type] || 0) + 1;
                return acc;
              }, {});
              const total = Object.values(grouped).reduce((s, v) => s + v, 0);
              const colorMap = { "Trực tiếp": "#3b82f6", "Gọi điện": "#22c55e", "Email": "#f59e0b", "Tin nhắn": "#9ca3af" };

              return (
                <>
                  {Object.entries(grouped).map(([type, count], i) => {
                    const percent = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                    return (
                      <div
                        key={i}
                        onClick={() => {
                          setFilterMode(type === filterMode ? "" : type);
                          showToast(currentLanguage === "vi" ? (type === filterMode ? "Hiển thị tất cả kênh liên hệ" : `Lọc theo kênh liên hệ: ${type}`) : "Info", "info");
                        }}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, gap: 12, cursor: "pointer",
                          background: filterMode === type ? "rgba(37,99,235,0.08)" : "transparent",
                          borderRadius: 8, padding: "4px 8px", transition: "background 0.2s ease",
                        }}
                      >
                        <div style={{ width: 160, fontWeight: 500 }}>{type}</div>
                        <div style={{ flex: 1, background: "#f3f4f6", borderRadius: 8, height: 10 }}>
                          <div style={{ width: `${percent}%`, background: colorMap[type] || "#9ca3af", height: "100%", borderRadius: 8, transition: "width 0.3s ease" }}></div>
                        </div>
                        <div style={{ width: 90, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 6 }}>
                          <strong style={{ color: "#2563eb" }}>{count}</strong>
                          <span style={{ color: "#6b7280" }}>{percent}%</span>
                        </div>
                      </div>
                    );
                  })}
                  <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top" style={{ fontWeight: "600", color: "#1f2937" }}>
                    <span>{currentLanguage === "vi" ? "Tổng cộng" : "Total"}</span>
                    <span>{total} <span style={{ color: "#6b7280" }}>{currentLanguage === "vi" ? "yêu cầu" : "requests"}</span></span>
                  </div>
                </>
              );
            })()}
          </div>

          {/* --- TRẠNG THÁI --- */}
          <div style={{ background: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", marginTop: "2rem" }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-semibold text-primary mb-0">
                {currentLanguage === "vi" ? "Số lượng dịch vụ theo trạng thái thực hiện" : "Service Count by Status"}
              </h5>
              <div className="d-flex align-items-center">
                <select
                  className="form-select form-select-sm"
                  style={{ width: 200 }}
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">{currentLanguage === "vi" ? "Tất cả trạng thái" : "All statuses"}</option>
                  <option value="Tư vấn">{currentLanguage === "vi" ? "Tư vấn" : "Consulting"}</option>
                  <option value="Đang xử lý">{currentLanguage === "vi" ? "Đang xử lý" : "Processing"}</option>
                  <option value="Đang nộp hồ sơ">{currentLanguage === "vi" ? "Đang nộp hồ sơ" : "Submitting"}</option>
                  <option value="Hoàn thành">{currentLanguage === "vi" ? "Hoàn thành" : "Completed"}</option>
                </select>
                {filterStatus && (
                  <button className="btn btn-outline-secondary btn-sm ms-2" onClick={() => setFilterStatus("")}>
                    {currentLanguage === "vi" ? "Xóa lọc" : "Reset"}
                  </button>
                )}
              </div>
            </div>

            <div>
              {Object.entries(groupedByStatus).map(([status, count], i) => {
                const percent = totalStatus > 0 ? ((count / totalStatus) * 100).toFixed(1) : 0;
                const color = statusColorMap[status] || "#60a5fa";
                return (
                  <div key={i} className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <strong>{status}</strong>
                      <span style={{ fontWeight: 500, color: color }}>{count} ({percent}%)</span>
                    </div>
                    <div style={{ height: "8px", borderRadius: "6px", background: "#e5e7eb", overflow: "hidden" }}>
                      <div style={{ width: `${percent}%`, background: color, height: "100%", borderRadius: "6px", transition: "width 0.5s ease" }}></div>
                    </div>
                  </div>
                );
              })}
              <div className="d-flex justify-content-end align-items-center mt-3 pt-2 border-top" style={{ fontWeight: 600, color: "#374151" }}>
                <span>{totalStatus} <span style={{ color: "#6b7280" }}>{currentLanguage === "vi" ? "yêu cầu" : "requests"}</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* --- BẢNG DANH SÁCH YÊU CẦU --- */}
        <div style={{ flex: "1 1 48%", background: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", overflowY: "auto", maxHeight: "1000px" }}>
          <div className="d-flex justify-content-between align-items-center mb-3" style={{ gap: "1rem" }}>
            <h5 className="fw-semibold mb-0 text-primary">
              {currentLanguage === "vi"
                ? filterRegion
                  ? `Danh sách yêu cầu (${filterRegion}${filterDichVu ? " - " + filterDichVu : ""})`
                  : filterDichVu ? `Danh sách yêu cầu (${filterDichVu})` : "Danh sách yêu cầu"
                : filterRegion
                  ? `Request List (${filterRegion}${filterDichVu ? " - " + filterDichVu : ""})`
                  : filterDichVu ? `Request List (${filterDichVu})` : "Request List"}
            </h5>

              {(filterRegion || filterDichVu || filterMode || filterStatus) && (
                <button
                  className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                  onClick={() => {
                    setFilterRegion("");
                    setFilterDichVu("");
                    setFilterMode(""); 
                    setFilterStatus(""); 
                    
                    showToast(
                      currentLanguage === "vi"
                        ? "Đã xóa toàn bộ bộ lọc, hiển thị tất cả yêu cầu"
                        : "All filters cleared, showing all requests",
                      "info"
                    );
                  }}
                  title={currentLanguage === "vi" ? "Xóa toàn bộ bộ lọc" : "Clear all filters"}
                  style={{ fontWeight: 500, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <FilterX size={16} strokeWidth={2} />
                </button>
              )}
          </div>

          {loading ? (
            <p className="text-center text-muted py-4">
              {currentLanguage === "vi" ? "Đang tải dữ liệu..." : "Loading..."}
            </p>
          ) : (
            <div>
              <table className="table table-hover table-bordered align-middle">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>{currentLanguage === "vi" ? "Họ tên" : "Name"}</th>
                    <th>{currentLanguage === "vi" ? "Mã vùng" : "Region Code"}</th>
                    <th>{currentLanguage === "vi" ? "Số điện thoại" : "Phone"}</th>
                    <th>Email</th>
                    <th>{currentLanguage === "vi" ? "Dịch vụ" : "Service"}</th>
                    <th>{currentLanguage === "vi" ? "Trạng thái" : "Status"}</th>
                    <th>{currentLanguage === "vi" ? "Hình thức" : "Contact Channel"}</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTableRows.length > 0 ? (
                    currentTableRows.map((r) => (
                      <tr key={r.YeuCauID}>
                        <td style={{textAlign:"center"}}>{r.YeuCauID}</td>
                        <td style={{textAlign:"center"}}>{r.HoTen}</td>
                        <td style={{textAlign:"center"}}>{r.MaVung}</td>
                        <td style={{textAlign:"center"}}>{r.SoDienThoai || ""}</td>
                        <td style={{textAlign:"center"}}>{r.Email || ""}</td>
                        <td style={{textAlign:"center"}}>{translateService(r.LoaiDichVu)}</td>
                        <td style={{textAlign:"center"}}>{r.TrangThai}</td>
                        <td style={{textAlign:"center"}}>{r.TenHinhThuc || ""}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center text-muted py-3">
                        {currentLanguage === "vi" ? "Không có yêu cầu nào" : "No requests found"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* --- PHÂN TRANG --- */}
              <div className="d-flex justify-content-between align-items-center px-3 py-2 border-top bg-light" style={{ marginTop: "0", borderTop: "1px solid #dee2e6" }}>
                <div className="text-muted small">
                  {currentLanguage === "vi"
                    ? `Hiển thị ${currentTableRows.length} / ${filteredData.length} hàng (trang ${currentPage}/${totalPages})`
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
                  {currentLanguage === "vi" ? `Trang ${currentPage}/${totalPages}` : `Page ${currentPage}/${totalPages}`}
                </div>
              </div>
            </div>
          )}
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
          {/* LEFT: B2B CHARTs */}
          <div
            style={{
              flex: "1 1 40%",
              display: "flex",
              flexDirection: "column",
              gap: "2rem",
            }}
          >
            {/* 1. B2B OVERVIEW (Pie) */}
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
                  {currentLanguage === "vi"
                    ? "Tổng quan dịch vụ Doanh nghiệp"
                    : "B2B Service Overview"}
                </h5>
              </div>
              <div className="mb-3">
                <select
                  className="form-select form-select-sm"
                  style={{ width: "100%" }}
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  disabled={b2bLoading}
                >
                  <option value="">
                    {currentLanguage === "vi"
                      ? "Tất cả công ty"
                      : "All Companies"}
                  </option>
                  {uniqueCompanies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name.substring(0, 50)}
                    </option>
                  ))}
                </select>
              </div>

              {b2bLoading ? (
                <div className="text-center py-5 text-muted">Loading...</div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: "1rem",
                  }}
                >
                  {/* Pie Chart */}
                  <div
                    style={{
                      flex: "1 1 50%",
                      minWidth: 200,
                      height: 320,
                      position: "relative",
                    }}
                  >
                    {b2bPieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={b2bPieData}
                            dataKey="value"
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={2}
                          >
                            {b2bPieData.map((entry, i) => {
                            const colors =[
                          "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD",
                          "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9", "#F8C471", "#82E0AA",
                          "#F1948A", "#D7BDE2", "#F9E79F", "#A9DFBF", "#F5B7B1", "#AED6F1",
                          "#E8DAEF", "#FAD7A0", "#ABEBC6", "#F5CBA7", "#D2B4DE", "#FCF3CF",
                          "#A3E4D7", "#7FB3D5", "#C39BD3", "#76D7C4", "#F0B27A", "#7DCEA0",
                          "#73C6B6", "#E59866", "#5499C7", "#AF7AC5", "#F4D03F", "#48C9B0",
                          "#DC7633", "#229954", "#8E44AD", "#F1C40F", "#16A085", "#D35400",
                          "#2E86C1", "#9B59B6", "#F39C12", "#138D75", "#BA4A00", "#1F618D",
                          "#884EA0", "#E67E22", "#117A65", "#A04000", "#2874A6", "#7D3C98",
                        ];
                              const color = colors[i % colors.length];
                              return <Cell key={i} fill={color} />;
                            })}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                        {currentLanguage === "vi"
                          ? "Không có dịch vụ"
                          : "No services"}
                      </div>
                    )}
                    <div
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%,-50%)",
                        textAlign: "center",
                      }}
                    >
                      <h4
                        style={{
                          fontSize: "1.8rem",
                          fontWeight: 700,
                          color: "#2563eb",
                          margin: 0,
                        }}
                      >
                        {b2bTotal}
                      </h4>
                      <span className="text-muted small">
                        {currentLanguage === "vi" ? "Dịch vụ" : "Services"}
                      </span>
                    </div>
                  </div>

           
                  <div
                    style={{
                      flex: "1 1 45%",
                      minWidth: 200,
                      overflow: "hidden", 
                    }}
                  >
                    <h6 className="fw-semibold mb-3 text-secondary">
                    {currentLanguage === "vi"
                      ? selectedCompanyId
                        ? "Tổng quan theo dịch vụ"
                        : "Tổng quan theo công ty"
                      : selectedCompanyId
                        ? "Overview by Service"
                        : "Overview by Company"}
                  </h6>

                    <div
                      style={{
                        maxHeight: "300px",
                        overflowY: "auto",
                        overflowX: "hidden", 
                        paddingRight: "4px", 
                      }}
                    >
                      {b2bPieData.map((item, i) => {
                        const percent =
                          b2bTotal > 0
                            ? ((item.value / b2bTotal) * 100).toFixed(1)
                            : 0;

                        const colors =[
                          "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD",
                          "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9", "#F8C471", "#82E0AA",
                          "#F1948A", "#D7BDE2", "#F9E79F", "#A9DFBF", "#F5B7B1", "#AED6F1",
                          "#E8DAEF", "#FAD7A0", "#ABEBC6", "#F5CBA7", "#D2B4DE", "#FCF3CF",
                          "#A3E4D7", "#7FB3D5", "#C39BD3", "#76D7C4", "#F0B27A", "#7DCEA0",
                          "#73C6B6", "#E59866", "#5499C7", "#AF7AC5", "#F4D03F", "#48C9B0",
                          "#DC7633", "#229954", "#8E44AD", "#F1C40F", "#16A085", "#D35400",
                          "#2E86C1", "#9B59B6", "#F39C12", "#138D75", "#BA4A00", "#1F618D",
                          "#884EA0", "#E67E22", "#117A65", "#A04000", "#2874A6", "#7D3C98",
                        ];
                        const color = colors[i % colors.length];

                        return (
                          <div
                            key={i}
                            className="d-flex justify-content-between align-items-center mb-2"
                            style={{
                              padding: "6px 8px",
                              borderRadius: "6px",
                              background: "rgba(255, 255, 255, 0.7)",
                              borderLeft: `4px solid ${color}`,
                              transition: "all 0.2s ease",
                              minWidth: 0, // Quan trọng: cho phép thu nhỏ
                              wordWrap: "break-word", // Ngắt từ nếu cần
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background =
                                "rgba(37, 99, 235, 0.05)";
                              e.currentTarget.style.transform = "translateX(4px)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background =
                                "rgba(255, 255, 255, 0.7)";
                              e.currentTarget.style.transform = "translateX(0)";
                            }}
                          >
                            <div
                              className="d-flex align-items-center"
                              style={{ minWidth: 0, flex: 1 }}
                            >
                              <span
                                style={{
                                  fontWeight: 500,
                                  color: "#374151",
                                  fontSize: "0.9rem",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                                title={item.name}
                              >
                                {item.name}
                              </span>
                            </div>
                            <strong
                              style={{
                                fontSize: "0.9rem",
                                flexShrink: 0,
                                marginLeft: "8px",
                              }}
                            >
                              {item.value}{" "}
                              <span style={{ color: "#6b7280", fontWeight: 400 }}>
                                ({percent}%)
                              </span>
                            </strong>
                          </div>
                        );
                      })}
                    </div>
                    <div
                      className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top"
                      style={{ fontWeight: "700", color: "#1f2937" }}
                    >
                      <span>
                        {currentLanguage === "vi" ? "Tổng cộng" : "Total"}
                      </span>
                      <span>
                        {b2bTotal}{" "}
                        <span style={{ color: "#6b7280", fontWeight: 400 }}>
                          {currentLanguage === "vi" ? "dịch vụ" : "services"}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              flex: "1 1 55%",
              background: "#fff",
              borderRadius: 12,
              padding: 20,
              boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
              maxHeight: 900,
              overflowY: "auto",
            }}
          >
         <h5 className="fw-semibold mb-3 text-primary">
            {currentLanguage === "vi"
              ? "Danh Sách Dịch Vụ Khách Hàng Doanh Nghiệp"
              : "B2B Service List"}
          </h5>

            <table className="table table-bordered align-middle small">
              <thead className="table-light">
                <tr>
                  <th style={{ width: 40 }} className="text-center border">
                    #
                  </th>
                  <th className="border">
                    {currentLanguage === "vi" ? "Tên doanh nghiệp" : "Company Name"}
                  </th>
                  <th className="border">
                    {currentLanguage === "vi" ? "Loại dịch vụ" : "Service Type"}
                  </th>
                  <th className="border">
                    {currentLanguage === "vi" ? "Tên dịch vụ" : "Service Name"}
                  </th>
                  <th className="border">
                    {currentLanguage === "vi" ? "Số điện thoại" : "Phone"}
                  </th>
                  <th className="border">Email</th>
                  <th className="border">
                    {currentLanguage === "vi" ? "Người đại diện" : "Representative"}
                  </th>
                </tr>
              </thead>
              <tbody>

                {currentB2BRows.length > 0 ? (
                  (() => {
          
                    const groupedData = [];
                    let currentGroup = [];

                    currentB2BRows.forEach((item, index) => {
                      const companyName = item.TenDoanhNghiep || item.companyName || "—";
                      const prevCompanyName =
                        index > 0
                          ? currentB2BRows[index - 1].TenDoanhNghiep ||
                            currentB2BRows[index - 1].companyName ||
                            ""
                          : "";

                    
                      if (
                        companyName !== prevCompanyName &&
                        currentGroup.length > 0
                      ) {
                        groupedData.push(currentGroup);
                        currentGroup = [];
                      }
                      currentGroup.push(item);
                    });

                    if (currentGroup.length > 0) {
                      groupedData.push(currentGroup);
                    }

          
                    let globalIndex = (b2bCurrentPage - 1) * b2bRowsPerPage;

                    return groupedData
                      .map((group, groupIndex) => {
                        const companyName =
                          group[0].TenDoanhNghiep || group[0].companyName || "—";
                        const rowCount = group.length;

                        // Style chung cho các ô được gộp
                        const groupedCellStyle = {
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
                          maxWidth: "150px",
                        };

                        return group.map((r, itemIndex) => {
                          const isFirstRow = itemIndex === 0;
                          globalIndex++;

                          return (
                            <tr key={`${groupIndex}-${itemIndex}`}>
                              {/* Cột STT */}
                              <td className="text-center border">{globalIndex}</td>

                              {/* Cột Tên Doanh Nghiệp (GỘP) */}
                              {isFirstRow && (
                                <td
                                  rowSpan={rowCount}
                                  className="fw-medium border"
                                  style={groupedCellStyle}
                                  title={companyName}
                                >
                                  {companyName}
                                </td>
                              )}

                              <td className="border text-center">
                                <span className="badge bg-light text-dark border">
                                  {r.LoaiDichVu || r.serviceType || "—"}
                                </span>
                              </td>

                        
                              <td className="text-center fw-medium border" style={{ fontSize: "11px" }}>
                                {r.TenDichVu || r.serviceName || ""}
                                
                              </td>

                         
                              {isFirstRow && (
                                <td
                                  rowSpan={rowCount}
                                  className="border"
                                  style={groupedCellStyle}
                                >
                                  {r.SoDienThoai || r.phone || ""}
                                </td>
                              )}

                    
                              {isFirstRow && (
                                <td
                                  rowSpan={rowCount}
                                  className="border"
                                  style={groupedCellStyle}
                                  title={r.Email || r.email}
                                >
                                  {r.Email || r.email || "—"}
                                </td>
                              )}

                      
                              {isFirstRow && (
                                <td
                                  rowSpan={rowCount}
                                  className="border"
                                  style={groupedCellStyle}
                                >
                                  {r.NguoiDaiDien || r.contactName || "—"}
                                </td>
                              )}
                            </tr>
                          );
                        });
                      })
                      .flat();
                  })()
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center text-muted py-4 border">
                      {currentLanguage === "vi"
                        ? "Không có dữ liệu doanh nghiệp"
                        : "No B2B data found"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* --- UI PHÂN TRANG B2B --- */}
            <div
              className="d-flex justify-content-between align-items-center px-3 py-2 border-top bg-light"
              style={{ marginTop: "0", borderTop: "1px solid #dee2e6" }}
            >
              <div className="text-muted small">
                {currentLanguage === "vi"
                  ? `Hiển thị ${currentB2BRows.length} / ${sortedB2BData.length} hàng (trang ${b2bCurrentPage}/${totalB2BPages})`
                  : `Showing ${currentB2BRows.length} / ${sortedB2BData.length} rows (page ${b2bCurrentPage}/${totalB2BPages})`}
              </div>

              <div className="d-flex justify-content-center align-items-center">
                <nav>
                  <ul className="pagination pagination-sm mb-0 shadow-sm">
                    {/* Nút Prev */}
                    <li
                      className={`page-item ${
                        b2bCurrentPage === 1 ? "disabled" : ""
                      }`}
                    >
                      <button
                        className="page-link"
                        onClick={() => {
                          if (b2bCurrentPage > 1)
                            setB2bCurrentPage((p) => p - 1);
                        }}
                      >
                        &laquo;
                      </button>
                    </li>

                    {/* Danh sách các trang */}
                    {Array.from({ length: totalB2BPages }, (_, i) => i + 1)
                      .filter(
                        (p) =>
                          p === 1 ||
                          p === totalB2BPages ||
                          (p >= b2bCurrentPage - 1 && p <= b2bCurrentPage + 1)
                      )
                      .map((p, idx, arr) => (
                        <React.Fragment key={p}>
                          {idx > 0 && arr[idx - 1] !== p - 1 && (
                            <li className="page-item disabled">
                              <span className="page-link">…</span>
                            </li>
                          )}
                          <li
                            className={`page-item ${
                              b2bCurrentPage === p ? "active" : ""
                            }`}
                          >
                            <button
                              className="page-link"
                              onClick={() => {
                                if (p !== b2bCurrentPage) setB2bCurrentPage(p);
                              }}
                            >
                              {p}
                            </button>
                          </li>
                        </React.Fragment>
                      ))}

                    {/* Nút Next */}
                    <li
                      className={`page-item ${
                        b2bCurrentPage === totalB2BPages ? "disabled" : ""
                      }`}
                    >
                      <button
                        className="page-link"
                        onClick={() => {
                          if (b2bCurrentPage < totalB2BPages)
                            setB2bCurrentPage((p) => p + 1);
                        }}
                      >
                        &raquo;
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
              <div className="ms-3 text-muted small">
                {currentLanguage === "vi"
                  ? `Trang ${b2bCurrentPage}/${totalB2BPages}`
                  : `Page ${b2bCurrentPage}/${totalB2BPages}`}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardSummary;