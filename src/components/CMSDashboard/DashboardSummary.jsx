import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  XAxis,
  YAxis,
  Bar,
  Legend,
} from "recharts";
import { FilterX } from "lucide-react";
import { showToast } from "../../utils/toast";

import useDashboardData from "./hooks/useDashboardData";
const statusColorMap = {
  "Tư vấn": "#3b82f6",
  "Đang xử lý": "#f59e0b",
  "Đang nộp hồ sơ": "#10b981",
  "Hoàn thành": "#8b5cf6",
  "Không xác định": "#9ca3af"
};
const DashboardSummary = ({
  data,
  currentLanguage,
  serviceColorMap,
  translateService,
  filterDichVu,
  setFilterDichVu,
  filterRegion,
  setFilterRegion,
  filterMode,
  setFilterMode,
  timeRange,
  setTimeRange,
  filterStatus,
  setFilterStatus,
  groupedByService,
  total,
  chartData,
  allServices,
}) => {
const [paginatedData, setPaginatedData] = useState([]);
const [totalPages, setTotalPages] = useState(1);
const [loading, setLoading] = useState(false);
const {
  currentPage,
  setCurrentPage,
  rowsPerPage,
} = useDashboardData();
const filteredByStatus = data
  .filter(r => {
    const date = new Date(r.NgayTao);
    const now = new Date();
    const diffDays = (now - date) / (1000 * 60 * 60 * 24);
    const matchTime = diffDays <= timeRange;

    const matchService = filterDichVu
      ? translateService(r.TenDichVu) === filterDichVu
      : true;

    const regionMap = { "+84": "Việt Nam", "+82": "Hàn Quốc" };
    const region = regionMap[r.MaVung] || r.MaVung || "Không xác định";
    const matchRegion = filterRegion ? region === filterRegion : true;

    const matchStatus = filterStatus ? r.TrangThai === filterStatus : true;

    return matchTime && matchService && matchRegion && matchStatus;
  });
// Nhóm theo ngày và dịch vụ dựa trên paginatedData
const filteredForChart = paginatedData.filter(r => {
  const date = new Date(r.NgayTao);
  const now = new Date();
  const diffDays = (now - date) / (1000 * 60 * 60 * 24);
  const matchTime = diffDays <= timeRange;

  const matchService = filterDichVu
    ? translateService(r.TenDichVu) === filterDichVu
    : true;

  const regionMap = { "+84": "Việt Nam", "+82": "Hàn Quốc" };
  const region = regionMap[r.MaVung] || r.MaVung || "Không xác định";
  const matchRegion = filterRegion ? region === filterRegion : true;

  return matchTime && matchService && matchRegion;
});

const allDates = Array.from(
  new Set(filteredForChart.map(r => new Date(r.NgayTao).toISOString().slice(0,10)))
).sort();

// Tạo dữ liệu chart
const chartDataByTime = allDates.map(date => {
  const dayData = { date };
  allServices.forEach(service => {
    dayData[service] = filteredForChart.filter(
      r => new Date(r.NgayTao).toISOString().slice(0,10) === date &&
           translateService(r.TenDichVu) === service
    ).length;
  });
  return dayData;
});
const groupedByStatus = paginatedData.reduce((acc, cur) => {
  const status = cur.TrangThai || "Không xác định";
  acc[status] = (acc[status] || 0) + 1;
  return acc;
}, {});

const totalStatus = Object.values(groupedByStatus).reduce((sum, v) => sum + v, 0);


const filteredChartData = chartData.map(d => {
  const filtered = paginatedData.filter(r => r.TenDichVu === d.service);
  return {
    ...d,
    value: filtered.length
  };
});
// 📡 Lấy dữ liệu yêu cầu có phân trang
const fetchPagedData = async (page = 1) => {
  setLoading(true);
  try {
    const res = await fetch(
      `https://onepasscms-backend.onrender.com/api/yeucau?page=${page}&limit=${rowsPerPage}`
    );
    const result = await res.json();
    if (result.success) {
      setPaginatedData(result.data);
      setTotalPages(result.totalPages || 1);
    }
  } catch (error) {
    console.error("❌ Lỗi khi tải dữ liệu phân trang:", error);
  } finally {
    setLoading(false);
  }
};
useEffect(() => {
  fetchPagedData(currentPage);
}, [currentPage, rowsPerPage]);

  return (
    
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
          showToast(
            currentLanguage === "vi"
              ? "Hiển thị toàn bộ danh sách yêu cầu"
              : "Showing all requests",
            "info"
          );
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.01)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        <h5 className="fw-semibold mb-3 text-primary">
          {currentLanguage === "vi"
            ? "Tổng quan số lượng dịch vụ"
            : "Service Overview"}
        </h5>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "2rem",
          }}
        >
          <div
            style={{
              flex: "1 1 50%",
              minWidth: 280,
              height: 320,
              position: "relative",
            }}
          >

          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
            dataKey="value"
              data={Object.entries(
                paginatedData.reduce((acc, cur) => {
                  const name = translateService(cur.TenDichVu || "Không xác định");
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
                paginatedData.reduce((acc, cur) => {
                  const name = translateService(cur.TenDichVu || "Không xác định");
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
                    setFilterDichVu(name);
                    showToast(
                      currentLanguage === "vi"
                        ? `Đang lọc danh sách theo dịch vụ: ${name}`
                        : `Filtering requests for: ${name}`,
                      "info"
                    );
                  }}
                />
              ))}
            </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>

        


            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                textAlign: "center",
              }}
            >
              <h4
                  style={{
                    fontSize: "1.8rem",
                    fontWeight: "700",
                    color: "#2563eb",
                    marginBottom: "0.25rem",
                  }}
                >
                  {Object.values(
                    paginatedData.reduce((acc, cur) => {
                      const name = translateService(cur.TenDichVu || "Không xác định");
                      acc[name] = (acc[name] || 0) + 1;
                      return acc;
                    }, {})
                  ).reduce((sum, val) => sum + val, 0)}
                </h4>

              {/* <span style={{ color: "#6b7280", fontSize: "0.9rem" }}>
                {currentLanguage === "vi" ? "Tổng" : "Total"}
              </span> */}
            </div>
          </div>


          <div style={{ flex: "1 1 45%", minWidth: 240 }}>
            <h6 className="fw-semibold mb-3 text-secondary">
              {currentLanguage === "vi"
                ? "Tổng quan số lượng dịch vụ"
                : "Service Summary"}
            </h6>
            {(() => {
              const grouped = paginatedData.reduce((acc, cur) => {
              const name = translateService(cur.TenDichVu || "Không xác định");
              acc[name] = (acc[name] || 0) + 1;
              return acc;
            }, {});

              const total = Object.values(grouped).reduce((sum, v) => sum + v, 0);
              return (
                <>
                  {Object.entries(grouped).map(([name, count], i) => {
                    const percent = ((count / total) * 100).toFixed(1);
                    return (
                      <div
                        key={i}
                        className="d-flex justify-content-between align-items-center mb-2"
                        style={{
                          cursor: "pointer",
                          background:
                            filterDichVu === name
                              ? "rgba(37,99,235,0.1)"
                              : "transparent",
                          borderRadius: 6,
                          padding: "4px 8px",
                        }}
                        onClick={() => {
                          setFilterDichVu(name);
                          showToast(
                            currentLanguage === "vi"
                              ? `Đang lọc danh sách theo dịch vụ: ${name}`
                              : `Filtering requests for: ${name}`,
                            "info"
                          );
                        }}
                      >
                        <span>{name}</span>
                        <strong>
                          {count}{" "}
                          <span style={{ color: "#6b7280" }}>({percent}%)</span>
                        </strong>
                      </div>
                    );
                  })}
                  <div
                    className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top"
                    style={{ fontWeight: "600", color: "#1f2937" }}
                  >
                    <span>{currentLanguage === "vi" ? "Tổng cộng" : "Total"}</span>
                    <span>
                      {total}{" "}
                      <span style={{ color: "#6b7280" }}>
                        {currentLanguage === "vi" ? "yêu cầu" : "requests"}
                      </span>
                    </span>
                  </div>
                </>
              );
            })()}
        </div>
      </div>
    </div>
    
    <div
      style={{
        background: "#fff",
        borderRadius: "12px",
        padding: "20px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
      }}
    >
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-semibold text-primary mb-0">
          {currentLanguage === "vi"
            ? "Số lượng dịch vụ theo thời gian"
            : "Service Count Over Time"}
        </h5>

        {/* Bộ lọc thời gian */}
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

      {chartData.length > 0 ? (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartDataByTime}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            angle={-30}
            textAnchor="end"
            height={60}
          />
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
                showToast(
                  currentLanguage === "vi"
                    ? filterDichVu === service
                      ? "Hiển thị toàn bộ dịch vụ"
                      : `Đang lọc theo dịch vụ: ${service}`
                    : filterDichVu === service
                    ? "Showing all services"
                    : `Filtering by service: ${service}`,
                  "info"
                );
              }}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>


      ) : (
        <div className="text-center text-muted py-5">
          {currentLanguage === "vi"
            ? "Không có dữ liệu trong khoảng thời gian đã chọn"
            : "No data available for selected period"}
        </div>
      )}
    </div>



    <div
      style={{
        background: "#fff",
        borderRadius: "12px",
        padding: "20px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
      }}
    >
      <h5 className="fw-semibold mb-3 text-primary">
        {currentLanguage === "vi"
          ? "Số lượng dịch vụ theo khu vực"
          : "Service Count by Region"}
      </h5>

      {(() => {
        const regionMap = { "+84": "Việt Nam", "+82": "Hàn Quốc" };
        const grouped =  paginatedData.reduce((acc, cur) => {
          const region = regionMap[cur.MaVung] || cur.MaVung || "Không xác định";
          acc[region] = (acc[region] || 0) + 1;
          return acc;
        }, {});
        const total = Object.values(grouped).reduce((s, v) => s + v, 0);
        const colors = ["#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899", "#f97316"];

        return (
          <>
            {Object.entries(grouped).map(([region, count], i) => {
              const percent = ((count / total) * 100).toFixed(1);
              return (
                <div
                  key={i}
                  onClick={() => {
                    // Khi bấm vào vùng
                    setFilterRegion(region === filterRegion ? "" : region);
                    showToast(
                      region === filterRegion
                        ? currentLanguage === "vi"
                          ? "Hiển thị tất cả khu vực"
                          : "Showing all regions"
                        : currentLanguage === "vi"
                        ? `Lọc theo khu vực: ${region}`
                        : `Filtering by region: ${region}`,
                      "info"
                    );
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                    gap: 12,
                    cursor: "pointer",
                    background:
                      filterRegion === region ? "rgba(37,99,235,0.08)" : "transparent",
                    borderRadius: 8,
                    padding: "4px 8px",
                    transition: "background 0.2s ease",
                  }}
                >
                  <div style={{ width: 100, fontWeight: 500 }}>{region}</div>

                  <div
                    style={{
                      flex: 1,
                      background: "#f3f4f6",
                      borderRadius: 8,
                      height: 10,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${percent}%`,
                        background: colors[i % colors.length],
                        height: "100%",
                        borderRadius: 8,
                        transition: "width 0.3s ease",
                      }}
                    ></div>
                  </div>

                  <div
                    style={{
                      width: 90,
                      display: "flex",
                      justifyContent: "flex-end",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <strong style={{ color: "#2563eb" }}>{count}</strong>
                    <span style={{ color: "#6b7280" }}>{percent}%</span>
                  </div>
                </div>
              );
            })}

            {/* Tổng cộng */}
            <div
              className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top"
              style={{ fontWeight: "600", color: "#1f2937" }}
            >
              <span>{currentLanguage === "vi" ? "Tổng cộng" : "Total"}</span>
              <span>
                {total}{" "}
                <span style={{ color: "#6b7280" }}>
                  {currentLanguage === "vi" ? "yêu cầu" : "requests"}
                </span>
              </span>
            </div>
          </>
        );
      })()}
    </div>
        <div
    style={{
      background: "#fff",
      borderRadius: "12px",
      padding: "20px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
    }}
  >
    <h5 className="fw-semibold mb-3 text-primary">
      {currentLanguage === "vi"
        ? "Số lượng dịch vụ theo kênh liên hệ"
        : "Service Count by Contact Channel"}
    </h5>

    {(() => {
      const grouped = paginatedData.reduce((acc, cur) => {
        const type = cur.TenHinhThuc || "Không xác định";
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});
      const total = Object.values(grouped).reduce((s, v) => s + v, 0);
      const colorMap = {
        "Trực tiếp": "#3b82f6",
        "Gọi điện": "#22c55e",
        "Email": "#f59e0b",
        "Tin nhắn": "#9ca3af",
      };

      return (
        <>
          {Object.entries(grouped).map(([type, count], i) => {
            const percent = ((count / total) * 100).toFixed(1);
            return (
              <div
                key={i}
                onClick={() => {
                  setFilterMode(type === filterMode ? "" : type);
                  showToast(
                    type === filterMode
                      ? currentLanguage === "vi"
                        ? "Hiển thị tất cả kênh liên hệ"
                        : "Showing all contact channels"
                      : currentLanguage === "vi"
                      ? `Lọc theo kênh liên hệ: ${type}`
                      : `Filtering by contact channel: ${type}`,
                    "info"
                  );
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                  gap: 12,
                  cursor: "pointer",
                  background:
                    filterMode === type
                      ? "rgba(37,99,235,0.08)"
                      : "transparent",
                  borderRadius: 8,
                  padding: "4px 8px",
                  transition: "background 0.2s ease",
                }}
              >
                <div style={{ width: 160, fontWeight: 500 }}>{type}</div>
                <div
                  style={{
                    flex: 1,
                    background: "#f3f4f6",
                    borderRadius: 8,
                    height: 10,
                  }}
                >
                  <div
                    style={{
                      width: `${percent}%`,
                      background: colorMap[type] || "#9ca3af",
                      height: "100%",
                      borderRadius: 8,
                      transition: "width 0.3s ease",
                    }}
                  ></div>
                </div>
                <div
                  style={{
                    width: 90,
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <strong style={{ color: "#2563eb" }}>{count}</strong>
                  <span style={{ color: "#6b7280" }}>{percent}%</span>
                </div>
              </div>
            );
          })}

          {/* Tổng cộng */}
          <div
            className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top"
            style={{ fontWeight: "600", color: "#1f2937" }}
          >
            <span>
              {currentLanguage === "vi" ? "Tổng cộng" : "Total"}
            </span>
            <span>
              {total}{" "}
              <span style={{ color: "#6b7280" }}>
                {currentLanguage === "vi" ? "yêu cầu" : "requests"}
              </span>
            </span>
          </div>
        </>
      );
    })()}
  </div>

      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "20px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          marginTop: "2rem",
        }}
      >
        {/* 🔹 Tiêu đề + Dropdown */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-semibold text-primary mb-0">
            {currentLanguage === "vi"
              ? "Số lượng dịch vụ theo trạng thái thực hiện"
              : "Service Count by Status"}
          </h5>

          <div className="d-flex align-items-center">
            <select
              className="form-select form-select-sm"
              style={{ width: 200 }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">
                {currentLanguage === "vi" ? "Tất cả trạng thái" : "All statuses"}
              </option>
              <option value="Tư vấn">
                {currentLanguage === "vi" ? "Tư vấn" : "Consulting"}
              </option>
              <option value="Đang xử lý">
                {currentLanguage === "vi" ? "Đang xử lý" : "Processing"}
              </option>
              <option value="Đang nộp hồ sơ">
                {currentLanguage === "vi" ? "Đang nộp hồ sơ" : "Submitting"}
              </option>
              <option value="Hoàn thành">
                {currentLanguage === "vi" ? "Hoàn thành" : "Completed"}
              </option>
            </select>

            {filterStatus && (
              <button
                className="btn btn-outline-secondary btn-sm ms-2"
                onClick={() => setFilterStatus("")}
              >
                {currentLanguage === "vi" ? "Xóa lọc" : "Reset"}
              </button>
            )}
          </div>
        </div>

        {/* 🔹 Hiển thị thanh progress cho từng dịch vụ */}
        <div>
            {Object.entries(groupedByStatus).map(([status, count], i) => {
              const percent = ((count / totalStatus) * 100).toFixed(1);
              const color = statusColorMap[status] || "#60a5fa";

              return (
                <div key={i} className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <strong>{status}</strong>
                    <span style={{ fontWeight: 500, color: color }}>
                      {count} ({percent}%)
                    </span>
                  </div>

                  <div style={{ height: "8px", borderRadius: "6px", background: "#e5e7eb", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${percent}%`,
                        background: color,
                        height: "100%",
                        borderRadius: "6px",
                        transition: "width 0.5s ease",
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}

          {/* 🔹 Tổng cộng */}
          <div className="d-flex justify-content-end align-items-center mt-3 pt-2 border-top" style={{ fontWeight: 600, color: "#374151" }}>
              <span>
                {totalStatus} <span style={{ color: "#6b7280" }}>{currentLanguage === "vi" ? "yêu cầu" : "requests"}</span>
              </span>
            </div>
        </div>
      </div>


    </div>

        <div
        style={{
          flex: "1 1 48%",
          background: "#fff",
          borderRadius: "12px",
          padding: "20px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          overflowY: "auto",
          maxHeight: "1000px",
        }}
      >
    
          <div
            className="d-flex justify-content-between align-items-center mb-3"
            style={{ gap: "1rem" }}
          >
            <h5 className="fw-semibold mb-0 text-primary">
              {currentLanguage === "vi"
                ? filterRegion
                  ? `Danh sách yêu cầu (${filterRegion}${
                      filterDichVu ? " - " + filterDichVu : ""
                    })`
                  : filterDichVu
                  ? `Danh sách yêu cầu (${filterDichVu})`
                  : "Danh sách yêu cầu"
                : filterRegion
                ? `Request List (${filterRegion}${
                    filterDichVu ? " - " + filterDichVu : ""
                  })`
                : filterDichVu
                ? `Request List (${filterDichVu})`
                : "Request List"}
            </h5>

          {(filterRegion || filterDichVu) && (
          <button
            className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
            onClick={() => {
              setFilterRegion("");
              setFilterDichVu("");
              showToast(
                currentLanguage === "vi"
                  ? "Đã xóa toàn bộ bộ lọc, hiển thị tất cả yêu cầu"
                  : "All filters cleared, showing all requests",
                "info"
              );
            }}
            title={
              currentLanguage === "vi"
                ? "Xóa toàn bộ bộ lọc"
                : "Clear all filters"
            }
            style={{
              fontWeight: 500,
              whiteSpace: "nowrap",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
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
          <th>ID</th>
          <th>{currentLanguage === "vi" ? "Họ tên" : "Name"}</th>
          <th>{currentLanguage === "vi" ? "Mã vùng" : "Region Code"}</th>
          <th>{currentLanguage === "vi" ? "Số điện thoại" : "Phone"}</th>
          <th>Email</th>
          <th>{currentLanguage === "vi" ? "Dịch vụ" : "Service"}</th>
          <th>{currentLanguage === "vi" ? "Trạng thái" : "Status"}</th>
        </tr>
      </thead>

      <tbody>
        {paginatedData
          .filter((r) => {
            const matchService = filterDichVu
              ? translateService(r.TenDichVu) === filterDichVu
              : true;

            const regionMap = { "+84": "Việt Nam", "+82": "Hàn Quốc" };
            const region = regionMap[r.MaVung] || r.MaVung || "Không xác định";
            const matchRegion = filterRegion ? region === filterRegion : true;

            return matchService && matchRegion;
          })
          .map((r) => (
            <tr key={r.YeuCauID}>
              <td>{r.YeuCauID}</td>
              <td>{r.HoTen}</td>
              <td>{r.MaVung}</td>
              <td>{r.SoDienThoai || "—"}</td>
              <td>{r.Email || "—"}</td>
              <td>{translateService(r.TenDichVu)}</td>
              <td>{r.TrangThai}</td>
            </tr>
          ))}

        {paginatedData.length === 0 && (
          <tr>
            <td colSpan="7" className="text-center text-muted py-3">
              {currentLanguage === "vi"
                ? "Không có yêu cầu nào"
                : "No requests found"}
            </td>
          </tr>
        )}
      </tbody>
    </table>

    {/* --- PHÂN TRANG --- */}
    <div
      className="d-flex justify-content-between align-items-center px-3 py-2 border-top bg-light"
      style={{
        marginTop: "0",
        borderTop: "1px solid #dee2e6",
      }}
    >
      <div className="text-muted small">
        {currentLanguage === "vi"
          ? `Hiển thị ${paginatedData.length} / ${rowsPerPage} hàng (trang ${currentPage}/${totalPages})`
          : `Showing ${paginatedData.length} / ${rowsPerPage} rows (page ${currentPage}/${totalPages})`}
      </div>

      <div className="d-flex justify-content-center align-items-center">
          <nav>
            <ul className="pagination pagination-sm mb-0 shadow-sm">
              <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => {
                    if (currentPage > 1) setCurrentPage((p) => p - 1);
                  }}
                >
                  &laquo;
                </button>
              </li>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === totalPages ||
                    (p >= currentPage - 1 && p <= currentPage + 1)
                )
                .map((p, idx, arr) => (
                  <React.Fragment key={p}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                      <li className="page-item disabled">
                        <span className="page-link">…</span>
                      </li>
                    )}
                    <li
                      className={`page-item ${currentPage === p ? "active" : ""}`}
                    >
                      <button
                        className="page-link"
                        onClick={() => {
                          if (p !== currentPage) setCurrentPage(p);
                        }}
                      >
                        {p}
                      </button>
                    </li>
                  </React.Fragment>
                ))}

              <li
                className={`page-item ${
                  currentPage === totalPages ? "disabled" : ""
                }`}
              >
                <button
                  className="page-link"
                  onClick={() => {
                    if (currentPage < totalPages) setCurrentPage((p) => p + 1);
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
              ? `Trang ${currentPage}/${totalPages}`
              : `Page ${currentPage}/${totalPages}`}
          </div>
      </div>
    </div>
  )}


          {data.filter((r) => {
          const date = new Date(r.NgayTao);
          const now = new Date();
          const diffDays = (now - date) / (1000 * 60 * 60 * 24);
          const matchTime = diffDays <= timeRange;

          const matchService = filterDichVu
            ? translateService(r.TenDichVu) === filterDichVu
            : true;

          const regionMap = { "+84": "Việt Nam", "+82": "Hàn Quốc" };
          const region = regionMap[r.MaVung] || r.MaVung || "Không xác định";
          const matchRegion = filterRegion ? region === filterRegion : true;

          return matchTime && matchService && matchRegion;
        }).length === 0 && (
          <tr>
            <td colSpan="7" className="text-center text-muted py-3">
              {currentLanguage === "vi"
                ? "Không có yêu cầu nào"
                : "No requests found"}
            </td>
          </tr>
        )}

          </div>
        </div>
      </div>
 );
};

export default DashboardSummary;