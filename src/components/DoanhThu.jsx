import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { Save } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function DoanhThu() {
  const [collapsed, setCollapsed] = useState(false);
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingRow, setSavingRow] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [viewMode, setViewMode] = useState("ngay"); // ngay | tuan | thang
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const rowsPerPage = 10;
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  // ====== Lấy dữ liệu từ API YeuCau ======
  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    setChartLoading(true);
    try {
      const res = await fetch("https://onepasscms-backend.onrender.com/api/yeucau");
      const result = await res.json();
      if (result.success) {
        setRecords(result.data);
        setFilteredRecords(result.data);
        prepareChartData(result.data, viewMode);
      } else {
        alert("Không thể tải danh sách hồ sơ!");
      }
    } catch (err) {
      console.error("❌ Lỗi khi tải dữ liệu:", err);
      alert("Lỗi khi tải dữ liệu!");
    } finally {
      setLoading(false);
    }
  };

  // ====== Lọc dữ liệu theo ngày ======
  const handleFilter = () => {
    if (!startDate && !endDate) {
      setFilteredRecords(records);
      prepareChartData(records, viewMode);
      return;
    }

    const filtered = records.filter((r) => {
      const date = new Date(r.NgayTao);
      const s = startDate ? new Date(startDate) : null;
      const e = endDate ? new Date(endDate) : null;
      if (s && date < s) return false;
      if (e && date > e) return false;
      return true;
    });

    setFilteredRecords(filtered);
    prepareChartData(filtered, viewMode);
    setCurrentPage(1);
  };

  // ====== Chuẩn bị dữ liệu biểu đồ ======
  const prepareChartData = (data, mode) => {
    if (!data || data.length === 0) {
      setChartData([]);
      setChartLoading(false);
      return;
    }

    const group = {};
    data.forEach((r) => {
      const date = new Date(r.NgayTao || Date.now());
      let key = "";
      if (mode === "ngay") {
        key = date.toLocaleDateString("vi-VN");
      } else if (mode === "tuan") {
        const week = Math.ceil(date.getDate() / 7);
        key = `Tuần ${week}/${date.getMonth() + 1}`;
      } else {
        key = `${date.getMonth() + 1}/${date.getFullYear()}`;
      }

      if (!group[key]) group[key] = { name: key, doanhthu: 0, tuvans: 0 };
      group[key].doanhthu += Number(r.DoanhThu || 0);
      if (r.TrangThai === "Tư vấn") group[key].tuvans += 1;
    });

    const arr = Object.values(group).sort((a, b) =>
      a.name.localeCompare(b.name, "vi")
    );
    setChartData(arr);
    setChartLoading(false);
  };

  // ====== Khi chỉnh sửa trong bảng ======
  const handleChange = (id, value) => {
    setFilteredRecords((prev) =>
      prev.map((r) => (r.YeuCauID === id ? { ...r, DoanhThu: value } : r))
    );
  };

  // ====== Lưu từng dòng ======
  const handleSaveRow = async (id, value) => {
    setSavingRow(id);
    try {
      const res = await fetch(`https://onepasscms-backend.onrender.com/api/yeucau/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ DoanhThu: value }),
      });
      const result = await res.json();
      if (result.success) {
        alert(`💾 Lưu thành công hồ sơ #${id}`);
        fetchRecords();
      } else {
        throw new Error(result.message || "Lỗi cập nhật dữ liệu!");
      }
    } catch (err) {
      console.error("❌ Lỗi khi lưu:", err);
      alert("Không thể lưu thay đổi!");
    } finally {
      setSavingRow(null);
    }
  };

  // ====== Phân trang ======
  const totalPages = Math.ceil(filteredRecords.length / rowsPerPage);
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // ====== Giao diện ======
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc" }}>
      <Sidebar collapsed={collapsed} active="doanhthu" user={currentUser} />

      <div
        style={{
          flex: 1,
          padding: "24px",
          marginLeft: collapsed ? "60px" : "250px",
          transition: "margin-left 0.3s ease",
        }}
      >
        {/* ====== Tiêu đề + Lọc ====== */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ color: "#2c4d9e", fontWeight: 700, margin: 0 }}>
            Quản lý Doanh Thu
          </h3>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                padding: "6px 10px",
                fontSize: "13px",
              }}
            />
            <span>→</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                padding: "6px 10px",
                fontSize: "13px",
              }}
            />
            <button
              onClick={handleFilter}
              style={{
                background: "#2563eb",
                color: "white",
                border: "none",
                borderRadius: "6px",
                padding: "6px 12px",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              Lọc
            </button>

            <select
              value={viewMode}
              onChange={(e) => {
                setViewMode(e.target.value);
                prepareChartData(filteredRecords, e.target.value);
              }}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid #d1d5db",
                fontSize: "13px",
              }}
            >
              <option value="ngay">Theo ngày</option>
              <option value="tuan">Theo tuần</option>
              <option value="thang">Theo tháng</option>
            </select>
          </div>
        </div>

        {/* ====== Biểu đồ ====== */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
            marginBottom: "30px",
          }}
        >
          {/* Biểu đồ doanh thu */}
          <ChartWrapper
            title={`Doanh thu (${viewMode})`}
            color="#2563eb"
            data={chartData}
            chartType="line"
          />

          {/* Biểu đồ dịch vụ tư vấn */}
          <ChartWrapper
            title={`Số dịch vụ tư vấn (${viewMode})`}
            color="#16a34a"
            data={chartData}
            chartType="bar"
          />
        </div>

        {/* ====== Bảng ====== */}
        <TableSection
          loading={loading}
          data={paginatedRecords}
          handleChange={handleChange}
          handleSaveRow={handleSaveRow}
          savingRow={savingRow}
          totalPages={totalPages}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />
      </div>
    </div>
  );
}

/* ====== Component biểu đồ gọn gàng ====== */
const ChartWrapper = ({ title, color, data, chartType }) => {
  if (!data) return <p style={{ textAlign: "center" }}>Đang tải...</p>;
  if (data.length === 0)
    return <p style={{ textAlign: "center", color: "#9ca3af" }}>Không có dữ liệu</p>;

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "12px",
        padding: "16px",
        boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
        minHeight: "320px",
      }}
    >
      <h5 style={{ color, fontWeight: 600, marginBottom: "10px" }}>{title}</h5>
      <div style={{ width: "100%", height: "260px" }}>
        {/* <ResponsiveContainer width="100%" height="100%">
          {chartType === "line" ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="doanhthu" stroke={color} strokeWidth={2} />
            </LineChart>
          ) : (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="tuvans" fill={color} radius={[6, 6, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer> */}
      </div>
    </div>
  );
};

/* ====== Component bảng ====== */
const TableSection = ({
  loading,
  data,
  handleChange,
  handleSaveRow,
  savingRow,
  totalPages,
  currentPage,
  setCurrentPage,
}) => (
  <div
    style={{
      background: "#fff",
      borderRadius: "12px",
      boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
      padding: "16px",
      overflowX: "auto",
    }}
  >
    {loading ? (
      <p style={{ textAlign: "center", color: "#6b7280" }}>Đang tải dữ liệu...</p>
    ) : (
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          textAlign: "center",
          fontSize: "14px",
        }}
      >
        <thead>
          <tr
            style={{
              background: "linear-gradient(135deg,#3b82f6,#1e40af)",
              color: "white",
              fontWeight: 600,
              height: "45px",
            }}
          >
            <th style={{ padding: "10px" }}>ID</th>
            <th style={{ padding: "10px" }}>Họ tên</th>
            <th style={{ padding: "10px" }}>Email</th>
            <th style={{ padding: "10px" }}>SĐT</th>
            <th style={{ padding: "10px", width: "180px" }}>Doanh thu (VNĐ)</th>
            <th style={{ padding: "10px", width: "90px" }}>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ color: "#6b7280", padding: "16px" }}>
                Không có dữ liệu
              </td>
            </tr>
          ) : (
            data.map((r, i) => (
              <tr
                key={r.YeuCauID}
                style={{
                  background: i % 2 === 0 ? "#f9fafb" : "white",
                  borderBottom: "1px solid #e5e7eb",
                  transition: "background 0.2s",
                }}
              >
                <td style={{ padding: "8px" }}>{r.YeuCauID}</td>
                <td style={{ padding: "8px" }}>{r.HoTen || "—"}</td>
                <td style={{ padding: "8px" }}>{r.Email || "—"}</td>
                <td style={{ padding: "8px" }}>{r.SoDienThoai || r.SDT || "—"}</td>
                <td style={{ padding: "8px" }}>
                  <input
                    type="number"
                    value={r.DoanhThu || ""}
                    onChange={(e) => handleChange(r.YeuCauID, e.target.value)}
                    style={{
                      width: "100%",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      border: "1px solid #d1d5db",
                      textAlign: "right",
                    }}
                  />
                </td>
                <td style={{ padding: "8px" }}>
                  <button
                    onClick={() => handleSaveRow(r.YeuCauID, r.DoanhThu || 0)}
                    disabled={savingRow === r.YeuCauID}
                    style={{
                      backgroundColor: savingRow === r.YeuCauID ? "#93c5fd" : "#2563eb",
                      border: "none",
                      color: "white",
                      borderRadius: "6px",
                      width: "36px",
                      height: "36px",
                      cursor: "pointer",
                    }}
                  >
                    {savingRow === r.YeuCauID ? "⏳" : <Save size={17} strokeWidth={2.3} />}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    )}

    {/* Phân trang */}
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        marginTop: "15px",
        gap: "8px",
      }}
    >
      {Array.from({ length: totalPages }, (_, i) => (
        <button
          key={i}
          onClick={() => setCurrentPage(i + 1)}
          style={{
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            padding: "6px 12px",
            fontSize: "13px",
            background: currentPage === i + 1 ? "#2563eb" : "white",
            color: currentPage === i + 1 ? "white" : "#374151",
            cursor: "pointer",
          }}
        >
          {i + 1}
        </button>
      ))}
    </div>
  </div>
);
