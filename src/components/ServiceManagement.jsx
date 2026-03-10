import React, { useMemo, useState } from "react";
import { Edit, Plus, Save, Search, Trash2, X } from "lucide-react";
import Sidebar from "./Sidebar";
import Header from "./Header";

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

const buildInitialServices = () => {
  const createdAt = new Date().toISOString();
  let idSeed = 1;

  return SERVICE_CATALOG.flatMap((group) =>
    group.items.map((item) => ({
      id: idSeed++,
      serviceType: group.category,
      serviceName: item.name,
      serviceCode: item.code,
      serviceNote: "",
      createdAt,
      updatedAt: createdAt,
      updatedBy: "System",
    }))
  );
};

export default function ServiceManagement() {
  const [showSidebar, setShowSidebar] = useState(true);
  const [currentUser] = useState(JSON.parse(localStorage.getItem("currentUser")) || null);
  const [currentLanguage, setCurrentLanguage] = useState(localStorage.getItem("language") || "vi");
  const [searchTerm, setSearchTerm] = useState("");
  const [services, setServices] = useState(buildInitialServices);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    serviceType: "",
    serviceName: "",
    serviceCode: "",
    serviceNote: "",
  });

  const editorName = currentUser?.name || currentUser?.username || "System";

  const filteredServices = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return services;

    return services.filter((item) => {
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
  };

  const openAddModal = () => {
    setEditingService(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (service) => {
    setEditingService(service);
    setFormData({
      serviceType: service.serviceType,
      serviceName: service.serviceName,
      serviceCode: service.serviceCode,
      serviceNote: service.serviceNote,
    });
    setShowModal(true);
  };

  const handleSubmit = () => {
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

    const now = new Date().toISOString();

    if (editingService) {
      setServices((prev) =>
        prev.map((item) =>
          item.id === editingService.id
            ? {
                ...item,
                serviceType: formData.serviceType.trim(),
                serviceName: formData.serviceName.trim(),
                serviceCode: formData.serviceCode.trim(),
                serviceNote: formData.serviceNote.trim(),
                updatedAt: now,
                updatedBy: editorName,
              }
            : item
        )
      );
    } else {
      const nextId = services.length > 0 ? Math.max(...services.map((item) => item.id)) + 1 : 1;
      setServices((prev) => [
        ...prev,
        {
          id: nextId,
          serviceType: formData.serviceType.trim(),
          serviceName: formData.serviceName.trim(),
          serviceCode: formData.serviceCode.trim(),
          serviceNote: formData.serviceNote.trim(),
          createdAt: now,
          updatedAt: now,
          updatedBy: editorName,
        },
      ]);
    }

    setShowModal(false);
    setEditingService(null);
    resetForm();
  };

  const handleDelete = (id) => {
    const confirmed = window.confirm("Bạn có chắc muốn xóa dịch vụ này?");
    if (!confirmed) return;
    setServices((prev) => prev.filter((item) => item.id !== id));
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

          <div className="table-responsive shadow-sm rounded border bg-white">
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
                {filteredServices.length > 0 ? (
                  filteredServices.map((item, index) => (
                    <tr key={item.id} style={{ backgroundColor: "#ffffff" }}>
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
              <div className="col-md-6">
                <label className="form-label fw-semibold">Loại dịch vụ</label>
                <input
                  className="form-control"
                  value={formData.serviceType}
                  onChange={(e) => setFormData((prev) => ({ ...prev, serviceType: e.target.value }))}
                  placeholder="Ví dụ: Hộ chiếu"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Mã dịch vụ</label>
                <input
                  className="form-control"
                  value={formData.serviceCode}
                  onChange={(e) => setFormData((prev) => ({ ...prev, serviceCode: e.target.value }))}
                  placeholder="Ví dụ: HCCM"
                />
              </div>
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
