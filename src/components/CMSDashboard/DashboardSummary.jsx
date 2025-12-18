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
  const [filterStaff, setFilterStaff] = useState(""); 
  const { currentPage, setCurrentPage, rowsPerPage } = useDashboardData();
  const [selectedTimeCompanyId, setSelectedTimeCompanyId] = useState("");

  const [b2bCurrentPage, setB2bCurrentPage] = useState(1);
  const b2bRowsPerPage = 20;
  const [selectedCompanyId, setSelectedCompanyId] = useState("");

  const getStaffName = (r) => {
    if (!r.NguoiPhuTrach) return "Chưa phân công";
    if (typeof r.NguoiPhuTrach === 'object') return r.NguoiPhuTrach.name || r.NguoiPhuTrach.username || "Chưa phân công";
    return r.NguoiPhuTrach;
  };

  // --- LOGIC LỌC DỮ LIỆU ---
  const filteredData = allData.filter((r) => {
    const matchService = filterDichVu
      ? translateService(r.LoaiDichVu) === filterDichVu
      : true;

    const regionMap = { "+84": "Việt Nam", "+82": "Hàn Quốc" };
    const region = regionMap[r.MaVung] || r.MaVung || "Không xác định";
    const matchRegion = filterRegion ? region === filterRegion : true;

    const matchMode = filterMode ? r.TenHinhThuc === filterMode : true;

    const matchStatus = filterStatus ? r.TrangThai === filterStatus : true;

    const staffName = getStaffName(r);
    const matchStaff = filterStaff ? staffName === filterStaff : true;

    return matchService && matchRegion && matchStatus && matchMode && matchStaff;
  });

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

  const chartDataByTime = allDates.map((dateStr) => {
    const dayData = { date: dateStr };
    const servicesToMap = allServices && allServices.length > 0 ? allServices : [];

    servicesToMap.forEach((service) => {
      const count = filteredData.filter((r) => {
        if (!r.NgayTao) return false;
        const rDate = toVNDateString(r.NgayTao);
        const rServiceRaw = translateService(r.LoaiDichVu);
        const rService = rServiceRaw ? rServiceRaw.trim() : "";
        const targetService = service ? service.trim() : "";
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
    let url = `https://onepasscms-backend.onrender.com/api/yeucau?limit=1000`;
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
        "https://onepasscms-backend.onrender.com/api/b2b/services?limit=1000"
      );
      const serviceJson = await serviceRes.json();
      const rawServices = serviceJson.success ? serviceJson.data : [];

      const companyRes = await authenticatedFetch(
        "https://onepasscms-backend.onrender.com/api/b2b/approved"
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
          
          // Các trường cho bảng chi tiết B2B
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
      const matchService = filterB2BServiceType ? (s.LoaiDichVu || "Không xác định") === filterB2BServiceType : true;
      const matchStaff = filterB2BStaff ? (s.picName || "Chưa phân công") === filterB2BStaff : true;
      return matchService && matchStaff;
  });
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

  // Sắp xếp dữ liệu để gom nhóm theo công ty
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

  // --- STYLE HEADER BẢNG GIỐNG B2C ---
  const headerStyle = {
    backgroundColor: "#2c4d9e", // Màu xanh B2CPage
    color: "#ffffff",
    borderRight: "1px solid #4a6fdc", // Đường kẻ ngăn cách mờ
    textAlign: "center",
    verticalAlign: "middle",
    whiteSpace: "nowrap",
    padding: "8px 4px",
    position: "sticky", // Quan trọng cho sticky top
    top: 0,
    zIndex: 20 // Cao hơn cột sticky bên trái
  };

  // Helper để đếm sub-rows trong danh mục (phục vụ merge cell Company)
  const getSubRowCount = (danhMucStr) => {
    if (!danhMucStr) return 1;
    return danhMucStr.split(" + ").length;
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
          { key: "individual", labelVi: "Khách Hàng Cá Nhân", labelEn: "Individual" },
          { key: "b2b", labelVi: "Khách Hàng Doanh Nghiệp", labelEn: "B2B" },
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
              showToast(currentLanguage === "vi" ? "Hiển thị toàn bộ danh sách yêu cầu" : "Showing all requests", "info");
            }}
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
   <div style={{ background: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
            <h5 className="fw-semibold mb-3 text-primary">
              {currentLanguage === "vi" ? "Số lượng dịch vụ theo nhân viên" : "Service Count by Staff"}
            </h5>
            
            {(() => {
              // 1. Tính toán dữ liệu
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
                        <Tooltip formatter={(value) => [value, currentLanguage === "vi" ? "Yêu cầu" : "Requests"]} />
                      </PieChart>
                    </ResponsiveContainer>
                    
                    {/* Số tổng ở giữa biểu đồ */}
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none" }}>
                      <h4 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#2563eb", marginBottom: "0" }}>
                        {filteredData.length}
                      </h4>
                    </div>
                  </div>

                  {/* PHẦN CHÚ THÍCH / LEGEND (PHẢI) */}
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
                      <span>{currentLanguage === "vi" ? "Tổng cộng" : "Total"}</span>
                      <span>{total} <span style={{ color: "#6b7280" }}>{currentLanguage === "vi" ? "yêu cầu" : "requests"}</span></span>
                    </div>
                  </div>

                </div>
              );
            })()}
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
          <div style={{ background: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", marginTop: "0rem" }}>
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
              {currentLanguage === "vi"
                ? filterRegion
                  ? `Danh sách yêu cầu (${filterRegion}${filterDichVu ? " - " + filterDichVu : ""})`
                  : filterDichVu ? `Danh sách yêu cầu (${filterDichVu})` : "Danh sách yêu cầu"
                : filterRegion
                  ? `Request List (${filterRegion}${filterDichVu ? " - " + filterDichVu : ""})`
                  : filterDichVu ? `Request List (${filterDichVu})` : "Request List"}
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

          {/* TABLE SCROLLABLE CONTAINER */}
          {loading ? (
            <p className="text-center text-muted py-4">
              {currentLanguage === "vi" ? "Đang tải dữ liệu..." : "Loading..."}
            </p>
          ) : (
            <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div className="table-responsive" style={{ flex: 1, overflow: "auto" }}>
                <table className="table table-bordered align-middle table-sm" style={{fontSize: "13px"}}>
                  <thead>
                    <tr className="text-center">
                      <th style={{width: "40px", ...headerStyle}}>#</th>
                      <th style={{minWidth: "120px", ...headerStyle}}>Khách hàng</th>
                      <th style={{width: "100px", ...headerStyle}}>Loại dịch vụ</th>
                      <th style={{minWidth: "120px", ...headerStyle}}>Tên dịch vụ</th>
                      <th style={{minWidth: "100px", ...headerStyle}}>Mã dịch vụ</th>
                      <th style={{minWidth: "150px", ...headerStyle}}>Danh mục</th>
                      <th style={{width: "120px", ...headerStyle}}>Người phụ trách</th>

                      <th style={{width: "90px", ...headerStyle}}>Ngày hẹn</th>
                      <th style={{width: "100px", ...headerStyle}}>Trạng thái</th>
                      <th style={{width: "90px", ...headerStyle}}>Hình thức</th>
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
                                                  {translateService(r.LoaiDichVu)}
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
                          {currentLanguage === "vi" ? "Không có yêu cầu nào" : "No requests found"}
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
                    {currentLanguage === "vi" ? "Tất cả công ty" : "All Companies"}
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
                // 1. Lấy danh sách tất cả loại dịch vụ hiện có (để cố định màu)
                const allB2BTypes = [...new Set(baseB2BData.map(s => s.LoaiDichVu || "Không xác định"))].sort();
                
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

                // 3. Map từng dịch vụ với một màu cụ thể
                const b2bColorMap = {};
                allB2BTypes.forEach((type, index) => {
                    b2bColorMap[type] = b2bPalette[index % b2bPalette.length];
                });

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
                        {currentLanguage === "vi" ? "Tổng quan số lượng dịch vụ" : "Service Overview"}
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
                                        // Màu từ map đã tạo
                                        const color = b2bColorMap[entry.name] || "#9ca3af";

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
                                   const color = b2bColorMap[item.name] || "#9ca3af";

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
                        {currentLanguage === "vi" ? "Số lượng dịch vụ theo nhân viên" : "Service Count by Staff"}
                      </h5>
                      
                      {(() => {
                        // SỬA: Dùng filteredB2BServices để đồng bộ với bộ lọc hiện tại
                        const stats = Object.entries(
                          filteredB2BServices.reduce((acc, cur) => {
                            const name = cur.picName || "Chưa phân công";
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
                          {currentLanguage === "vi" ? "Số lượng theo thời gian bắt đầu" : "Count by Start Date"}
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
                                     fill={b2bColorMap[svc] || "#9ca3af"} 
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
                               {currentLanguage === "vi" ? "Không có dữ liệu trong khoảng thời gian này" : "No data in this period"}
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
                      {currentLanguage === "vi" ? "Doanh nghiệp" : "Company"}
                    </th>
                    <th style={{ ...headerStyle, position: "sticky", top: 0, zIndex: 10 }}>
                      {currentLanguage === "vi" ? "Loại dịch vụ" : "Service Type"}
                    </th>
                    <th style={{ ...headerStyle, position: "sticky", top: 0, zIndex: 10 }}>
                      {currentLanguage === "vi" ? "Tên dịch vụ" : "Service Name"}
                    </th>
                    <th style={{ ...headerStyle, position: "sticky", top: 0, zIndex: 10 }}>
                      {currentLanguage === "vi" ? "Mã dịch vụ" : "Service Code"}
                    </th>
                    <th style={{ ...headerStyle, position: "sticky", top: 0, zIndex: 10 }}>
                      {currentLanguage === "vi" ? "Danh mục" : "Category"}
                    </th>
                    <th style={{ ...headerStyle, position: "sticky", top: 0, zIndex: 10 }}>
                      {currentLanguage === "vi" ? "Người phụ trách" : "PIC"}
                    </th>
                    <th style={{ ...headerStyle, position: "sticky", top: 0, zIndex: 10 }}>
                      {currentLanguage === "vi" ? "Ngày bắt đầu" : "Start Date"}
                    </th>
                    <th style={{ ...headerStyle, position: "sticky", top: 0, zIndex: 10 }}>
                      {currentLanguage === "vi" ? "Ngày kết thúc" : "End Date"}
                    </th>
                    <th style={{ ...headerStyle, position: "sticky", top: 0, zIndex: 10 }}>
                      {currentLanguage === "vi" ? "Gói" : "Package"}
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
                        {currentLanguage === "vi" ? "Không tìm thấy dữ liệu phù hợp" : "No matching B2B data found"}
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