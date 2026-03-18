import React, { useMemo, useState, useEffect, useCallback } from "react";
import { Edit, Plus, Save, Search, Trash2, X } from "lucide-react";
import Sidebar from "./Sidebar";
import Header from "./Header";

const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "https://onepasscms-backend-tvdy.onrender.com/api";

const CUSTOM_SERVICE_TYPE_VALUE = "__ADD_CUSTOM_SERVICE_TYPE__";
// Danh sách loại dịch vụ sẽ lấy từ API hoặc props, ở đây giả sử lấy từ state (hoặc backend)
// Nếu muốn lấy động, cần fetch từ backend và lưu vào state, ở đây giữ nguyên biến để dễ chỉnh sửa
const PRESET_SERVICE_TYPES = [];

const SERVICE_TYPE_ALIAS_MAP = {
  "Hộ chiếu": "Hộ chiếu, Hộ tịch",
  "Hộ tịch": "Hộ chiếu, Hộ tịch",
  "Quốc tịch": "Quốc tịch",
  "Con nuôi": "Nhận nuôi",
  "Nhận cha mẹ": "Nhận nuôi",
  "Miễn thị thực": "Thị thực",
  "Khai sinh": "Khai sinh, khai tử",
  "Kết hôn": "Kết hôn",
  "Hợp pháp hóa": "Hợp pháp hóa, công chứng",
  "Công chứng, chứng thực": "Hợp pháp hóa, công chứng",
  "Xác minh": "Dịch thuật",
  "Dịch": "Dịch thuật",
};

const SERVICE_CATALOG = [
  {
    category: "Hộ chiếu",
    items: [
      { name: "Hộ chiếu cấp mới (Hợp pháp - Trẻ em)", code: "HCCM" },
      { name: "Hộ chiếu cấp đổi (Hợp pháp - Còn hạn)", code: "HCCL A1" },
      { name: "Hộ chiếu cấp đổi (Hợp pháp - Hết hạn)", code: "HCCL A2" },
      { name: "Hộ chiếu cấp đổi (Bất hợp pháp - Còn hạn)", code: "HCCL B1" },
      { name: "Hộ chiếu cấp đổi (Bất hợp pháp - Hết hạn)", code: "HCCL B2" },
      {
        name: "Hộ chiếu cấp đổi rút gọn (công tác ngắn hạn, du lịch, trục xuất)",
        code: "HCRG",
      },
      { name: "Hộ chiếu bị chú", code: "BCHC" },
      { name: "Dán ảnh trẻ em", code: "DCDA" },
    ],
  },
  {
    category: "Xác minh",
    items: [
      { name: "Xác minh", code: "XM" },
    ],
  },
  {
    category: "Quốc tịch",
    items: [
      { name: "Thôi quốc tịch Việt Nam", code: "TQT" },
      { name: "Giấy xác nhận có quốc tịch Việt Nam", code: "XNQT" },
      { name: "Cấp giấy xác nhận người gốc Việt", code: "XNQOT" },
    ],
  },
  {
    category: "Con nuôi",
    items: [{ name: "Đăng ký việc nuôi con nuôi", code: "NCN" }],
  },
  {
    category: "Miễn thị thực",
    items: [{ name: "Giấy miễn thị thực", code: "MTT" }],
  },
  {
    category: "Khai sinh",
    items: [{ name: "Đăng ký khai sinh", code: "KS" }],
  },
  {
    category: "Kết hôn",
    items: [
      { name: "Đăng ký kết hôn Việt - Việt", code: "KHV-V" },
      { name: "Giấy xác nhận tình trạng hôn nhân", code: "TTHN" },
      { name: "Giấy chứng nhận đủ điều kiện kết hôn Việt - Hàn", code: "KHV-H" },
    ],
  },
  {
    category: "Nhận cha mẹ",
    items: [
      { name: "Đăng ký việc nhận cha, mẹ, con", code: "CNC" },
      { name: "Cải chính hộ tịch", code: "CCHT" },
      { name: "Trích lục khai sinh (sao)", code: "TLKS" },
    ],
  },
  {
    category: "Hộ tịch",
    items: [
      { name: "Ghi chú kết hôn (Ghi vào sổ hộ tịch việc kết hôn)", code: "GCKH" },
      { name: "Ghi chú ly hôn", code: "GCLH" },
      { name: "Ghi chú khai sinh", code: "GCKS" },
    ],
  },
  {
    category: "Hợp pháp hóa",
    items: [{ name: "Hợp pháp hóa lãnh sự/Chứng nhận lãnh sự", code: "HPH" }],
  },
  {
    category: "Công chứng, chứng thực",
    items: [
      { name: "Công chứng, chứng thực hợp đồng giao dịch", code: "CCHD" },
      { name: "Hợp đồng ủy quyền", code: "HDUQ" },
      { name: "Ủy quyền", code: "UQ" },
      { name: "Ủy quyền đưa con về nước", code: "UQDTE" },
      { name: "Chứng thực chữ ký", code: "CTCK" },
      { name: "Sao y bản chính", code: "SYBC" },
    ],
  },
  {
    category: "Dịch",
    items: [
      { name: "Dịch Việt - Hàn", code: "DTVH" },
      { name: "Dịch Hàn - Việt", code: "DTHV" },
      { name: "Dịch BLX", code: "DTBLX" },
    ],
  },
];

const formatDateTime = (isoValue) => {
  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) return "-";

  return date
    .toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
    .replace(",", "");
};

const resolveServiceTypeForDisplay = (row) => {
  const rawType = String(row.LoaiDichVu || "").trim();
  const mappedType = SERVICE_TYPE_ALIAS_MAP[rawType] || rawType;

  const serviceName = String(row.TenDichVu || "").trim().toLowerCase();
  const serviceCode = String(row.MaDichVu || "").trim().toUpperCase();

  // Một số bản ghi cũ lưu LoaiDichVu = "Khác" cho dịch BLX, ép hiển thị về Dịch thuật.
  if (serviceCode === "DTBLX" || serviceName.includes("dịch blx")) {
    return "Dịch thuật";
  }

  return mappedType;
};

// Chuyển đổi dữ liệu từ DB sang định dạng hiển thị
const toService = (row) => ({
  id: row.DichVuID,
  serviceType: resolveServiceTypeForDisplay(row),
  serviceName: row.TenDichVu || "",
  serviceCode: row.MaDichVu || "",
  serviceNote: row.GhiChu || "",
  createdAt: row.NgayTao || row.created_at || new Date().toISOString(),
  updatedAt: row.NgayCapNhat || row.updated_at || new Date().toISOString(),
  updatedBy: row.NguoiCapNhat || "System",
});

const isPresetServiceType = (value) => PRESET_SERVICE_TYPES.includes(String(value || "").trim());
const getServiceTypeOrder = (value) => {
  const normalizedValue = String(value || "").trim();
  const index = PRESET_SERVICE_TYPES.indexOf(normalizedValue);
  return index === -1 ? PRESET_SERVICE_TYPES.length : index;
};

export default function ServiceManagement() {
  const [showSidebar, setShowSidebar] = useState(true);
  const [currentUser] = useState(JSON.parse(localStorage.getItem("currentUser")) || null);
  const [currentLanguage, setCurrentLanguage] = useState(localStorage.getItem("language") || "vi");
  const [searchTerm, setSearchTerm] = useState("");
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    serviceType: "",
    serviceName: "",
    serviceCode: "",
    serviceNote: "",
  });
  const [isCustomServiceTypeMode, setIsCustomServiceTypeMode] = useState(false);
  // Giả sử PRESET_SERVICE_TYPES sẽ được cập nhật động, ở đây dùng biến tạm
  // Nếu muốn lấy từ backend, cần fetch và set vào state
  const presetServiceTypes = PRESET_SERVICE_TYPES;

  const editorName = currentUser?.name || currentUser?.username || "System";
  const serviceTypeSelectValue = isCustomServiceTypeMode ? CUSTOM_SERVICE_TYPE_VALUE : formData.serviceType;
  // Nếu không có loại dịch vụ nào thì luôn show input
  const showCustomServiceTypeInput = isCustomServiceTypeMode || presetServiceTypes.length === 0;

  // Không còn dữ liệu gốc hardcode, chỉ lấy từ API

  // Tải dữ liệu: chỉ lấy từ backend, không còn hardcode
  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/dichvu`);
      if (!res.ok) throw new Error("Không thể tải dữ liệu dịch vụ");
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Lỗi tải dịch vụ");

      const rows = json.data || [];
      const validRows = rows.filter((r) => r.TenDichVu && r.TenDichVu.trim());
      setServices(validRows.map(toService));
    } catch (err) {
      setServices([]);
      // Có thể hiển thị thông báo lỗi nếu muốn
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const filteredServices = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    const baseServices = keyword
      ? services.filter((item) => {
          const haystack = [
            item.serviceType,
            item.serviceName,
            item.serviceCode,
            item.serviceNote,
            item.updatedBy,
          ]
            .join(" ")
            .toLowerCase();
          return haystack.includes(keyword);
        })
      : services;

    return [...baseServices].sort((left, right) => {
      const orderDiff = getServiceTypeOrder(left.serviceType) - getServiceTypeOrder(right.serviceType);
      if (orderDiff !== 0) return orderDiff;
      return left.id - right.id;
    });
  }, [searchTerm, services]);

  const serviceTypeRowSpans = useMemo(() => {
    const spans = {};
    let index = 0;

    while (index < filteredServices.length) {
      const currentType = filteredServices[index].serviceType;
      let count = 1;

      while (
        index + count < filteredServices.length &&
        filteredServices[index + count].serviceType === currentType
      ) {
        count += 1;
      }

      spans[index] = count;
      index += count;
    }

    return spans;
  }, [filteredServices]);

  const resetForm = () => {
    setFormData({
      serviceType: "",
      serviceName: "",
      serviceCode: "",
      serviceNote: "",
    });
    setIsCustomServiceTypeMode(false);
  };

  const openAddModal = () => {
    setEditingService(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (service) => {
    setEditingService(service);
    setIsCustomServiceTypeMode(!isPresetServiceType(service.serviceType));
    setFormData({
      serviceType: service.serviceType,
      serviceName: service.serviceName,
      serviceCode: service.serviceCode,
      serviceNote: service.serviceNote,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.serviceType.trim()) {
      window.alert("Vui lòng nhập Loại dịch vụ.");
      return;
    }
    if (!formData.serviceName.trim()) {
      window.alert("Vui lòng nhập Tên dịch vụ.");
      return;
    }
    if (!formData.serviceCode.trim()) {
      window.alert("Vui lòng nhập Mã dịch vụ.");
      return;
    }

    const payload = {
      LoaiDichVu: formData.serviceType.trim(),
      TenDichVu: formData.serviceName.trim(),
      MaDichVu: formData.serviceCode.trim(),
      GhiChu: formData.serviceNote.trim(),
      NguoiCapNhat: editorName,
    };

    try {
      let res;
      if (editingService) {
        // Cập nhật dịch vụ đã có
        res = await fetch(`${API_BASE}/dichvu/${editingService.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // Thêm dịch vụ mới
        res = await fetch(`${API_BASE}/dichvu`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const raw = await res.text();
      let json = null;
      try {
        json = raw ? JSON.parse(raw) : {};
      } catch (_) {
        throw new Error(`HTTP ${res.status}: ${raw || res.statusText}`);
      }
      if (!res.ok || !json.success) {
        throw new Error(json.message || `HTTP ${res.status}`);
      }

      // Tải lại danh sách từ DB để đồng bộ
      await fetchServices();
      setShowModal(false);
      setEditingService(null);
      resetForm();
    } catch (err) {
      window.alert("Lỗi lưu dịch vụ: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Bạn có chắc muốn xóa dịch vụ này?");
    if (!confirmed) return;
    try {
      const res = await fetch(`${API_BASE}/dichvu/${id}`, { method: "DELETE" });
      const raw = await res.text();
      const json = raw ? JSON.parse(raw) : {};
      if (!res.ok || !json.success) throw new Error(json.message || "Lỗi xóa dịch vụ");
      setServices((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      window.alert("Lỗi xóa dịch vụ: " + err.message);
    }
  };

  const tableHeaderCellStyle = {
    backgroundColor: "#1e3a8a",
    color: "#ffffff",
    fontWeight: 700,
    fontSize: "13px",
    padding: "8px 10px",
    border: "1px solid #8ea0ca",
    textAlign: "center",
    whiteSpace: "nowrap",
    position: "sticky",
    top: 0,
    zIndex: 5,
  };

  const tableBodyCellStyle = {
    padding: "8px 10px",
    border: "1px solid #d6deee",
    verticalAlign: "middle",
    backgroundColor: "#ffffff",
    fontSize: "13px",
  };

  return (
    <div className="d-flex">
      <div className="position-fixed h-100" style={{ zIndex: 100 }}>
        <Sidebar collapsed={!showSidebar} user={currentUser} />
      </div>

      <div className="flex-grow-1" style={{ marginLeft: showSidebar ? "250px" : "60px", padding: "20px" }}>
        <Header
          currentUser={currentUser}
          onToggleSidebar={() => setShowSidebar(!showSidebar)}
          showSidebar={showSidebar}
          currentLanguage={currentLanguage}
          onLanguageChange={setCurrentLanguage}
        />

        <div className="container-fluid" style={{ marginTop: "85px" }}>
          <div className="mb-3">
            <h4 className="fw-bold text-primary m-0">Quản lý dịch vụ</h4>
            <small className="text-muted">Danh sách dịch vụ OnePass ({filteredServices.length})</small>
          </div>

          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="position-relative" style={{ width: "420px" }}>
              <Search
                size={18}
                className="position-absolute text-muted"
                style={{ left: "12px", top: "50%", transform: "translateY(-50%)" }}
              />
              <input
                type="text"
                className="form-control shadow-sm"
                placeholder="Tìm theo loại, tên, mã, ghi chú, người chỉnh sửa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  borderRadius: "30px",
                  paddingLeft: "38px",
                  fontSize: "14px",
                  height: "40px",
                }}
              />
            </div>

            <button
              className="btn d-flex align-items-center gap-2 shadow-sm"
              onClick={openAddModal}
              style={{
                backgroundColor: "#16a34a",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "8px 16px",
                fontWeight: 500,
              }}
            >
              <Plus size={18} />
              Thêm dịch vụ
            </button>
          </div>

          <div
            className="table-responsive shadow-sm rounded border bg-white"
            style={{ maxHeight: "calc(100vh - 220px)", overflowY: "auto" }}
          >
            <table
              style={{
                width: "100%",
                marginBottom: 0,
                borderCollapse: "separate",
                borderSpacing: 0,
              }}
            >
              <thead>
                <tr>
                  <th style={{ ...tableHeaderCellStyle, width: "60px" }}>STT</th>
                  <th style={{ ...tableHeaderCellStyle, minWidth: "170px" }}>Loại dịch vụ</th>
                  <th style={{ ...tableHeaderCellStyle, minWidth: "310px" }}>Tên dịch vụ</th>
                  <th style={{ ...tableHeaderCellStyle, width: "140px" }}>Mã dịch vụ</th>
                  <th style={{ ...tableHeaderCellStyle, minWidth: "180px" }}>Ghi chú dịch vụ</th>
                  <th style={{ ...tableHeaderCellStyle, minWidth: "160px" }}>Thêm lần đầu</th>
                  <th style={{ ...tableHeaderCellStyle, minWidth: "170px" }}>Cập nhật gần nhất</th>
                  <th style={{ ...tableHeaderCellStyle, minWidth: "140px" }}>Người chỉnh sửa</th>
                  <th style={{ ...tableHeaderCellStyle, width: "110px" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-4 text-muted" style={tableBodyCellStyle}>
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : filteredServices.length > 0 ? (
                  filteredServices.map((item, index) => (                    <tr key={item.id} style={{ backgroundColor: "#ffffff" }}>
                      <td style={{ ...tableBodyCellStyle, textAlign: "center", fontWeight: 600 }}>
                        {index + 1}
                      </td>
                      {serviceTypeRowSpans[index] ? (
                        <td
                          rowSpan={serviceTypeRowSpans[index]}
                          style={{
                            ...tableBodyCellStyle,
                            textAlign: "center",
                            fontWeight: 600,
                            minWidth: "170px",
                          }}
                        >
                          {item.serviceType}
                        </td>
                      ) : null}
                      <td style={tableBodyCellStyle}>{item.serviceName}</td>
                      <td style={{ ...tableBodyCellStyle, textAlign: "center", fontWeight: 600 }}>
                        {item.serviceCode}
                      </td>
                      <td style={tableBodyCellStyle}>{item.serviceNote || "-"}</td>
                      <td style={{ ...tableBodyCellStyle, textAlign: "center" }}>
                        {formatDateTime(item.createdAt)}
                      </td>
                      <td style={{ ...tableBodyCellStyle, textAlign: "center" }}>
                        {formatDateTime(item.updatedAt)}
                      </td>
                      <td style={{ ...tableBodyCellStyle, textAlign: "center" }}>{item.updatedBy || "-"}</td>
                      <td style={{ ...tableBodyCellStyle, textAlign: "center" }}>
                        <div className="d-flex justify-content-center gap-2">
                          <button
                            className="btn btn-sm btn-outline-primary border-0"
                            onClick={() => openEditModal(item)}
                            title="Sửa"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger border-0"
                            onClick={() => handleDelete(item.id)}
                            title="Xóa"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="text-center py-4 text-muted" style={tableBodyCellStyle}>
                      Không có dữ liệu dịch vụ.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{ background: "rgba(0,0,0,0.45)", zIndex: 2000 }}
        >
          <div className="bg-white rounded-3 shadow p-4" style={{ width: "100%", maxWidth: "620px" }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="m-0 fw-bold">{editingService ? "Sửa dịch vụ" : "Thêm dịch vụ mới"}</h5>
              <button
                className="btn btn-sm btn-light border"
                onClick={() => {
                  setShowModal(false);
                  setEditingService(null);
                  resetForm();
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="row g-3">
              <div className="col-md-6 d-flex align-items-center gap-2">
                <div style={{ flex: 1 }}>
                  <label className="form-label fw-semibold">Loại dịch vụ</label>
                  {presetServiceTypes.length === 0 ? (
                    <input
                      className="form-control"
                      value={formData.serviceType}
                      onChange={(e) => setFormData((prev) => ({ ...prev, serviceType: e.target.value }))}
                      placeholder="Nhập loại dịch vụ mới"
                    />
                  ) : presetServiceTypes.length < 2 ? (
                    <input
                      className="form-control"
                      value={formData.serviceType}
                      onChange={(e) => setFormData((prev) => ({ ...prev, serviceType: e.target.value }))}
                      placeholder="Nhập loại dịch vụ mới"
                    />
                  ) : (
                    <select
                      className="form-control"
                      value={serviceTypeSelectValue}
                      onChange={(e) => {
                        const nextValue = e.target.value;
                        if (nextValue === CUSTOM_SERVICE_TYPE_VALUE) {
                          setIsCustomServiceTypeMode(true);
                          setFormData((prev) => ({ ...prev, serviceType: "" }));
                          return;
                        }
                        setIsCustomServiceTypeMode(false);
                        setFormData((prev) => ({ ...prev, serviceType: nextValue }));
                      }}
                    >
                      {presetServiceTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                      <option value={CUSTOM_SERVICE_TYPE_VALUE}>Thêm dịch vụ</option>
                    </select>
                  )}
                </div>
                {/* Nếu đang ở chế độ thêm loại dịch vụ mới và có nhiều hơn 2 loại thì mới hiện ô input bên cạnh */}
                {presetServiceTypes.length > 1 && isCustomServiceTypeMode && (
                  <div style={{ flex: 1 }}>
                    <label className="form-label fw-semibold" style={{ visibility: "hidden" }}>Loại dịch vụ mới</label>
                    <input
                      className="form-control"
                      value={formData.serviceType}
                      onChange={(e) => setFormData((prev) => ({ ...prev, serviceType: e.target.value }))}
                      placeholder="Nhập loại dịch vụ mới"
                    />
                  </div>
                )}
              </div>

                            {/* Ô mã dịch vụ chỉ xuất hiện 1 lần ở dưới */}
                            <div className="col-12">
                              <label className="form-label fw-semibold">Mã dịch vụ</label>
                              <input
                                className="form-control"
                                value={formData.serviceCode}
                                onChange={(e) => setFormData((prev) => ({ ...prev, serviceCode: e.target.value }))}
                                placeholder="Ví dụ: HCCM"
                              />
                            </div>
              {/* Đã loại bỏ ô mã dịch vụ thừa, chỉ còn 1 ô duy nhất phía dưới */}
              <div className="col-12">
                <label className="form-label fw-semibold">Tên dịch vụ</label>
                <input
                  className="form-control"
                  value={formData.serviceName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, serviceName: e.target.value }))}
                  placeholder="Nhập tên dịch vụ"
                />
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold">Ghi chú dịch vụ</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={formData.serviceNote}
                  onChange={(e) => setFormData((prev) => ({ ...prev, serviceNote: e.target.value }))}
                  placeholder="Nhập ghi chú nếu có"
                />
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button
                className="btn btn-outline-secondary"
                onClick={() => {
                  setShowModal(false);
                  setEditingService(null);
                  resetForm();
                }}
              >
                Hủy
              </button>
              <button className="btn btn-success d-flex align-items-center gap-2" onClick={handleSubmit}>
                <Save size={16} />
                {editingService ? "Cập nhật" : "Thêm mới"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
