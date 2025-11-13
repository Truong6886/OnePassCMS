import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Save } from "lucide-react";
import {
  LineChart,
  Line,
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
    chartTitle: "Biểu đồ Tổng Doanh Thu",
    allServices: "Tất cả dịch vụ",
    allStaff: "Tất cả nhân viên",
    filter: "Lọc",
    noData: "Không có dữ liệu",
    loadingChart: "Đang tải biểu đồ...",
    revenue: "Doanh thu",
    time: "Thời gian",
    revenueUnit: "VNĐ",
  },
  en: {
    title: "Total Revenue",
    chartTitle: "Total Revenue Chart",
    allServices: "All Services",
    allStaff: "All Staff",
    filter: "Filter",
    noData: "No data available",
    loadingChart: "Loading chart...",
    revenue: "Revenue",
    time: "Time",
    revenueUnit: "VND",
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

  const [loading, setLoading] = useState(true);
  const [savingRow, setSavingRow] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [viewMode, setViewMode] = useState("thang");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedService, setSelectedService] = useState("tatca");
  const [selectedStaff, setSelectedStaff] = useState("tatca");
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [totalPages, setTotalPages] = useState(1);

  const [currentLanguage, setCurrentLanguage] = useState(
    localStorage.getItem("language") || "vi"
  );

  const t = translations[currentLanguage];

  // 🧠 Lấy user
  const savedUser = localStorage.getItem("currentUser");
  const currentUser = savedUser ? JSON.parse(savedUser) : null;

  // 🚫 Giới hạn quyền truy cập
  if (!currentUser?.is_director && !currentUser?.is_accountant) {
    return (
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          background: "#f8fafc",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          color: "#1e40af",
          textAlign: "center",
          fontWeight: 600,
          fontSize: "18px",
        }}
      >
        <p>Bạn không có quyền truy cập trang “Doanh Thu”.</p>
        <p>Vui lòng quay lại trang chủ.</p>
      </div>
    );
  }

  // 📡 Gọi API có phân trang
  const fetchData = async (page = 1) => {
    setLoading(true);
    setChartLoading(true);
    try {
      const res = await fetch(
        `https://onepasscms-backend.onrender.com/api/yeucau?page=${page}&limit=${rowsPerPage}`
      );
      const result = await res.json();
      if (result.success) {
        setRecords(result.data);
        setFilteredRecords(result.data);
        prepareChartData(result.data, viewMode);
        setTotalPages(result.totalPages || 1);
      } else {
        toast.error("Không thể tải danh sách!");
      }
    } catch (err) {
      console.error("❌ Lỗi khi tải dữ liệu:", err);
      toast.error("Lỗi kết nối server!");
    } finally {
      setLoading(false);
      setChartLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage, rowsPerPage]);

  // 🧮 Chuẩn bị dữ liệu biểu đồ
  const prepareChartData = (data, mode) => {
    if (!data || data.length === 0) {
      setChartData([]);
      return;
    }
    const group = {};
    data.forEach((r) => {
      const date = new Date(r.NgayTao || Date.now());
      let key = "";
      switch (mode) {
        case "ngay":
          key = date.toLocaleDateString("vi-VN");
          break;
        case "tuan":
          key = `Tuần ${Math.ceil(date.getDate() / 7)}/${date.getMonth() + 1}`;
          break;
        case "thang":
          key = `${date.getMonth() + 1}/${date.getFullYear()}`;
          break;
        case "nam":
          key = `${date.getFullYear()}`;
          break;
        default:
          key = date.toLocaleDateString("vi-VN");
      }
      if (!group[key]) group[key] = { name: key, doanhthu: 0 };
      group[key].doanhthu += Number(r.DoanhThu || 0);
    });
    setChartData(Object.values(group));
  };

  // 🔍 Bộ lọc
  const handleFilter = () => {
    let filtered = records;
    if (startDate || endDate) {
      filtered = filtered.filter((r) => {
        const date = new Date(r.NgayTao);
        const s = startDate ? new Date(startDate) : null;
        const e = endDate ? new Date(endDate) : null;
        if (s && date < s) return false;
        if (e && date > e) return false;
        return true;
      });
    }
    if (selectedService !== "tatca") {
      filtered = filtered.filter((r) => {
        const dv =
          typeof r.TenDichVu === "object"
            ? r.TenDichVu?.name || r.TenDichVu?.ten || ""
            : r.TenDichVu || "";
        const translated = translateService(dv);
        return translated === selectedService;
      });
    }
    if (selectedStaff !== "tatca") {
      filtered = filtered.filter((r) => {
        const nv =
          typeof r.NguoiPhuTrach === "object"
            ? r.NguoiPhuTrach?.name || r.NguoiPhuTrach?.username || ""
            : r.NguoiPhuTrach || "";
        return nv === selectedStaff;
      });
    }
    setFilteredRecords(filtered);
    prepareChartData(filtered, viewMode);
    setCurrentPage(1);
  };

  // ✏️ Sửa doanh thu
  const handleChange = (id, value) => {
    setFilteredRecords((prev) =>
      prev.map((r) => (r.YeuCauID === id ? { ...r, DoanhThu: value } : r))
    );
  };

  // 💾 Lưu doanh thu
  const handleSaveRow = async (id, value) => {
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
        toast.success(`Lưu thành công YeuCauID #${id}`);
        fetchData(currentPage);
      } else {
        toast.error("❌ Lỗi khi cập nhật dữ liệu!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Không thể kết nối server!");
    } finally {
      setSavingRow(null);
    }
  };

  // 🧾 Xuất Excel
  const handleExportExcel = () => {
    if (!filteredRecords || filteredRecords.length === 0) {
      toast.warning("Không có dữ liệu để xuất Excel!");
      return;
    }

    const exportData = filteredRecords.map((r) => ({
      ID: r.YeuCauID,
      "Họ tên": r.HoTen,
      Email: r.Email,
      "Số điện thoại": r.SoDienThoai,
      "Dịch vụ": translateService(
        typeof r.TenDichVu === "object"
          ? r.TenDichVu?.name || r.TenDichVu?.ten
          : r.TenDichVu
      ),
      "Nhân viên phụ trách":
        typeof r.NguoiPhuTrach === "object"
          ? r.NguoiPhuTrach?.name || r.NguoiPhuTrach?.username
          : r.NguoiPhuTrach,
      "Doanh thu": r.DoanhThu || 0,
      "Ngày tạo": new Date(r.NgayTao).toLocaleString("vi-VN"),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DoanhThu");
    XLSX.writeFile(workbook, "Doanh_thu.xlsx");
  };

  // Danh sách dịch vụ & nhân viên
  const serviceOptions = [
    "tatca",
    ...new Set(
      records
        .map((r) => {
          const dv =
            typeof r.TenDichVu === "object"
              ? r.TenDichVu?.name || r.TenDichVu?.ten
              : r.TenDichVu;
          return translateService(dv);
        })
        .filter(Boolean)
    ),
  ];
  const staffOptions = [
    "tatca",
    ...new Set(
      records
        .map((r) => {
          const nv = r?.NguoiPhuTrach;
          if (!nv) return null;
          if (typeof nv === "object") return nv.name || nv.username || null;
          return nv;
        })
        .filter(Boolean)
    ),
  ];

  return (
    <div style={{ display: "flex", background: "#f8fafc", minHeight: "100vh" }}>
      <Sidebar collapsed={collapsed} user={currentUser} />
      <div
        style={{
          flex: 1,
          marginLeft: collapsed ? "60px" : "250px",
          display: "flex",
          flexDirection: "column",
          height: "100vh",
        }}
      >
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
            onUpdate={(u) => {
              localStorage.setItem("currentUser", JSON.stringify(u));
            }}
            onClose={() => setShowEditModal(false)}
            currentLanguage={currentLanguage}
          />
        )}

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            marginTop: "70px",
            background: "#f9fafb",
            padding: "32px 48px",
          }}
        >
          {/* Bộ lọc */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "20px",
            }}
          >
            <h3 style={{ color: "#1e3a8a", fontWeight: 700 }}>{t.title}</h3>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <span>→</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />

              <select
                value={viewMode}
                onChange={(e) => {
                  setViewMode(e.target.value);
                  prepareChartData(filteredRecords, e.target.value);
                }}
              >
                <option value="ngay">Ngày</option>
                <option value="tuan">Tuần</option>
                <option value="thang">Tháng</option>
                <option value="nam">Năm</option>
              </select>

              <select value={selectedService} onChange={(e) => setSelectedService(e.target.value)}>
                {serviceOptions.map((s, i) => (
                  <option key={i} value={s}>
                    {s === "tatca" ? t.allServices : s}
                  </option>
                ))}
              </select>

              <select value={selectedStaff} onChange={(e) => setSelectedStaff(e.target.value)}>
                {staffOptions.map((s, i) => (
                  <option key={i} value={s}>
                    {s === "tatca" ? t.allStaff : s}
                  </option>
                ))}
              </select>

              <button
                onClick={handleFilter}
                style={{
                  background: "#2563eb",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  padding: "6px 12px",
                  cursor: "pointer",
                }}
              >
                {t.filter}
              </button>
            </div>
          </div>

          {/* Biểu đồ */}
          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              padding: "20px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              minHeight: "360px",
              marginBottom: "30px",
            }}
          >
            <h5 style={{ color: "#2563eb", fontWeight: 600, marginBottom: "10px" }}>
              {t.chartTitle}
            </h5>
            {chartLoading ? (
              <p>{t.loadingChart}</p>
            ) : chartData.length === 0 ? (
              <p>{t.noData}</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(v) => formatCurrency(v)} width={100} />
                  <Tooltip
                    labelFormatter={(label) => `${t.time}: ${label}`}
                    formatter={(v) => [formatCurrency(v) + " " + t.revenueUnit, t.revenue]}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="doanhthu" stroke="#2563eb" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Export */}
          <div style={{ textAlign: "right", marginBottom: "20px" }}>
            <button
              onClick={handleExportExcel}
              style={{
                background: "#16a34a",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "8px 16px",
                cursor: "pointer",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginLeft: "auto",
              }}
            >
              <i className="bi bi-file-earmark-excel"></i>
              {currentLanguage === "vi" ? "Tải Danh sách Doanh Thu" : "Download Revenue List"}
            </button>
          </div>

          {/* Bảng dữ liệu */}
          <TableSection
            loading={loading}
            data={filteredRecords}
            handleChange={handleChange}
            handleSaveRow={handleSaveRow}
            savingRow={savingRow}
            totalPages={totalPages}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            currentLanguage={currentLanguage}
          />
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={2500} hideProgressBar={false} />
    </div>
  );
}

/* ====== Bảng ====== */
const TableSection = ({
  loading,
  data,
  handleChange,
  handleSaveRow,
  savingRow,
  totalPages,
  currentPage,
  setCurrentPage,
  currentLanguage,
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
      <p>Đang tải dữ liệu...</p>
    ) : (
      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "center" }}>
        <thead>
          <tr
            style={{
              background: "linear-gradient(135deg,#3b82f6,#1e40af)",
              color: "white",
              fontWeight: 600,
              height: "45px",
            }}
          >
            <th>ID</th>
            <th>Họ tên</th>
            <th>Email</th>
            <th>SĐT</th>
            <th>Dịch vụ</th>
            <th>Nhân viên</th>
            <th>Doanh thu (VNĐ)</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan="8" style={{ color: "#6b7280", padding: "16px" }}>
                Không có dữ liệu
              </td>
            </tr>
          ) : (
            data.map((r, i) => {
              const rawService =
                typeof r.TenDichVu === "object"
                  ? r.TenDichVu?.name || r.TenDichVu?.ten || "—"
                  : r.TenDichVu || "—";
              const dv = translateService(rawService);
              const nv =
                typeof r.NguoiPhuTrach === "object"
                  ? r.NguoiPhuTrach?.name || r.NguoiPhuTrach?.username || "—"
                  : r.NguoiPhuTrach || "—";

              return (
                <tr key={r.YeuCauID} style={{ background: i % 2 === 0 ? "#f9fafb" : "white" }}>
                  <td>{r.YeuCauID}</td>
                  <td>{r.HoTen || "—"}</td>
                  <td>{r.Email || "—"}</td>
                  <td>{r.SoDienThoai || "—"}</td>
                  <td>{dv}</td>
                  <td>{nv}</td>
                  <td>
                    <input
                      type="text"
                      value={formatCurrency(r.DoanhThu)}
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/\D/g, "");
                        const numericValue = parseFloat(rawValue || "0");
                        handleChange(r.YeuCauID, numericValue);
                      }}
                      style={{
                        width: "100%",
                        padding: "6px 10px",
                        borderRadius: "6px",
                        border: "1px solid #d1d5db",
                        textAlign: "right",
                      }}
                    />
                  </td>
                  <td>
                    <button
                      onClick={() =>
                        handleSaveRow(r.YeuCauID, r.DoanhThu?.toString().replace(/\./g, ""))
                      }
                      disabled={savingRow === r.YeuCauID}
                      style={{
                        backgroundColor: savingRow === r.YeuCauID ? "#93c5fd" : "#2563eb",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        width: "36px",
                        height: "36px",
                        cursor: "pointer",
                      }}
                    >
                      <Save size={17} strokeWidth={2.3} />
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    )}

    {/* Phân trang */}
    <div
      className="d-flex justify-content-between align-items-center px-3 py-2 border-top bg-light"
      style={{
        marginTop: "0",
        borderTop: "1px solid #dee2e6",
      }}
    >
      <div className="text-muted small">
        {currentLanguage === "vi"
          ? `Hiển thị ${data.length} / 20 hàng (trang ${currentPage}/${totalPages})`
          : `Showing ${data.length} / 20 rows (page ${currentPage}/${totalPages})`}
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
                  <li className={`page-item ${currentPage === p ? "active" : ""}`}>
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
              className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}
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

        <div className="ms-3 text-muted small">
          {currentLanguage === "vi"
            ? `Trang ${currentPage}/${totalPages}`
            : `Page ${currentPage}/${totalPages}`}
        </div>
      </div>
    </div>
  </div>
);
