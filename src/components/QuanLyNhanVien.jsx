import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function QuanLyNhanVien() {
  const [currentUser, setCurrentUser] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState(
    localStorage.getItem("language") || "vi"
  );

  useEffect(() => {
    const saved = localStorage.getItem("language");
    if (saved) setCurrentLanguage(saved);
  }, []);

  const [users, setUsers] = useState([]);
  const [yeuCauList, setYeuCauList] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedUserForService, setSelectedUserForService] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("currentUser");
    if (saved) setCurrentUser(JSON.parse(saved));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("https://onepasscms-backend.onrender.com/api/User");
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) setUsers(result.data);
      } catch (err) {
        console.error("❌ Lỗi lấy danh sách User:", err);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("https://onepasscms-backend.onrender.com/api/yeucau");
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) setYeuCauList(result.data);
      } catch (err) {
        console.error("❌ Lỗi lấy danh sách Yêu cầu:", err);
      }
    })();
  }, []);

  const translateService = (serviceName) => {
    const map = {
      "인증 센터": "Chứng thực",
      "결혼 이민": "Kết hôn",
      "출생신고 대행": "Khai sinh, khai tử",
      "출입국 행정 대행": "Xuất nhập cảnh",
      "신분증명 서류 대행": "Giấy tờ tuỳ thân",
      "입양 절차 대행": "Nhận nuôi",
      "비자 대행": "Thị thực",
      "법률 컨설팅": "Tư vấn pháp lý",
      "B2B 서비스": "Dịch vụ B2B",
      "기타": "Khác",
    };
    return map[serviceName] || serviceName;
  };

  const statusOptions =
    currentLanguage === "vi"
      ? [
          { value: "Tư vấn", label: "Tư vấn" },
          { value: "Đang xử lý", label: "Đang xử lý" },
          { value: "Đang nộp hồ sơ", label: "Đang nộp hồ sơ" },
          { value: "Hoàn thành", label: "Hoàn thành" },
        ]
      : [
          { value: "Tư vấn", label: "Consulting" },
          { value: "Đang xử lý", label: "Processing" },
          { value: "Đang nộp hồ sơ", label: "Submitting" },
          { value: "Hoàn thành", label: "Completed" },
        ];

  const colors = [
    "#3b82f6", "#ec4899", "#f59e0b", "#6366f1", "#10b981",
    "#8b5cf6", "#f97316", "#84cc16", "#06b6d4", "#9ca3af",
  ];

  const getServiceCountByTypeForUser = (userIdOrName) => {
    const selectedUserObj = users.find(
      (u) => String(u.id) === String(userIdOrName) || u.name === userIdOrName
    );
    const filtered = yeuCauList.filter(
      (y) =>
        String(y.NguoiPhuTrachId) === String(userIdOrName) ||
        String(y.NguoiPhuTrach) === selectedUserObj?.name
    );

    const grouped = {};
    filtered.forEach((y) => {
      const key =
        typeof y.TenDichVu === "object"
          ? y.TenDichVu?.name || y.TenDichVu?.ten || "Khác"
          : y.TenDichVu || "Khác";
      const translated = translateService(key);
      grouped[translated] = (grouped[translated] || 0) + 1;
    });
    return Object.entries(grouped).map(([name, count]) => ({ name, count }));
  };

  const filteredYeuCau = selectedUser
    ? yeuCauList.filter(
        (y) =>
          String(y.NguoiPhuTrachId) === String(selectedUser) ||
          String(y.NguoiPhuTrach) === String(selectedUser)
      )
    : yeuCauList;

  const serviceCountByStatus = statusOptions.map((opt) => {
    const count = filteredYeuCau.filter((y) => y.TrangThai === opt.value).length;
    return { status: opt.label, count };
  });

  const totalStatus = serviceCountByStatus.reduce((sum, s) => sum + s.count, 0);

  return (
    <div>
      <Header
        currentUser={currentUser}
        showSidebar={showSidebar}
        onToggleSidebar={() => setShowSidebar((s) => !s)}
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
      />

      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar collapsed={!showSidebar} user={currentUser} />

        <div
          style={{
            marginLeft: showSidebar ? "250px" : "60px",
            flex: 1,
            padding: "80px 20px 40px",
            background: "#f9fafb",
            transition: "margin-left 0.3s ease",
          }}
        >
          <h3 className="fw-bold mb-4">
            {currentLanguage === "vi" ? "Quản lý nhân viên" : "Employee Management"}
          </h3>

          {/* --- Phần nội dung thống kê --- */}
          <div className="d-flex flex-wrap gap-4 mb-4" style={{ justifyContent: "space-between" }}>
            {/* Theo Dịch Vụ */}
            <div
              className="card shadow-sm p-4 flex-grow-1"
              style={{
                borderRadius: "12px",
                border: "none",
                minWidth: "48%",
                flex: "1 1 48%",
              }}
            >
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-semibold mb-0">
                  {currentLanguage === "vi" ? "Theo Dịch Vụ" : "By Services"}
                </h5>

                <select
                  className="form-select form-select-sm"
                  style={{ width: 220 }}
                  value={selectedUserForService}
                  onChange={(e) => setSelectedUserForService(e.target.value)}
                >
                  <option value="">
                    {currentLanguage === "vi" ? "Chọn nhân viên" : "Select Employee"}
                  </option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name || u.username}
                    </option>
                  ))}
                </select>
              </div>

              {!selectedUserForService ? (
                <div className="text-center text-muted py-4">
                  {currentLanguage === "vi"
                    ? "Vui lòng chọn một nhân viên để xem chi tiết dịch vụ."
                    : "Please select an employee to view service details."}
                </div>
              ) : (
                (() => {
                  const stats = getServiceCountByTypeForUser(selectedUserForService);
                  const total = stats.reduce((sum, s) => sum + s.count, 0);

                  return (
                    <>
                      {stats.length === 0 ? (
                        <p className="text-muted">
                          {currentLanguage === "vi"
                            ? "Nhân viên này chưa có dịch vụ nào."
                            : "This employee has no services yet."}
                        </p>
                      ) : (
                        stats.map((s, i) => {
                          const percent = total ? Math.round((s.count / total) * 100) : 0;
                          return (
                            <div key={i} className="mb-3">
                              <div className="d-flex justify-content-between">
                                <span>{s.name}</span>
                                <div>
                                  <span className="me-2 text-muted">{percent}%</span>
                                  <span className="fw-semibold text-primary">{s.count}</span>
                                </div>
                              </div>
                              <div
                                style={{
                                  height: "8px",
                                  background: "#E5E7EB",
                                  borderRadius: "6px",
                                  overflow: "hidden",
                                }}
                              >
                                <div
                                  style={{
                                    width: `${percent}%`,
                                    background: colors[i % colors.length],
                                    height: "100%",
                                    transition: "width 0.5s ease",
                                  }}
                                ></div>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <hr className="mt-4 mb-2" style={{ borderColor: "#E5E7EB" }} />
                      <p className="text-end fw-semibold text-secondary" style={{ fontSize: "15px" }}>
                        {currentLanguage === "vi"
                          ? `Tổng: ${total} dịch vụ`
                          : `Total: ${total} services`}
                      </p>
                    </>
                  );
                })()
              )}
            </div>

            {/* Theo Trạng Thái */}
            <div
              className="card shadow-sm p-4 flex-grow-1"
              style={{
                borderRadius: "12px",
                border: "none",
                minWidth: "48%",
                flex: "1 1 48%",
              }}
            >
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-semibold mb-0">
                  {currentLanguage === "vi" ? "Theo Trạng Thái" : "By Status"}
                </h5>

                <select
                  className="form-select form-select-sm"
                  style={{ width: 200 }}
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                >
                  <option value="">
                    {currentLanguage === "vi" ? "Chọn nhân viên" : "Select Employee"}
                  </option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name || u.username}
                    </option>
                  ))}
                </select>
              </div>

              {serviceCountByStatus.map((s, i) => {
                const percent = totalStatus ? ((s.count / totalStatus) * 100).toFixed(0) : 0;
                return (
                  <div key={i} className="mb-3">
                    <div className="d-flex justify-content-between">
                      <span>{s.status}</span>
                      <div>
                        <span className="me-2 text-muted">{percent}%</span>
                        <span className="fw-semibold text-primary">{s.count}</span>
                      </div>
                    </div>
                    <div
                      style={{
                        height: "8px",
                        background: "#E5E7EB",
                        borderRadius: "6px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${percent}%`,
                          background: colors[i % colors.length],
                          height: "100%",
                          transition: "width 0.5s ease",
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
              <hr className="mt-4 mb-2" style={{ borderColor: "#E5E7EB" }} />
              <p className="text-end fw-semibold text-secondary" style={{ fontSize: "15px" }}>
                {currentLanguage === "vi"
                  ? `Tổng: ${totalStatus} trạng thái`
                  : `Total: ${totalStatus} status`}
              </p>
            </div>
          </div>

          {/* Danh sách nhân viên */}
          <div className="card shadow-sm p-3" style={{ borderRadius: "12px" }}>
            <h5 className="fw-semibold mb-3">
              {currentLanguage === "vi" ? "Danh sách nhân viên" : "Employee List"}
            </h5>

            <div className="table-responsive">
              <table className="table table-hover align-middle text-center mb-0">
                <thead style={{ backgroundColor: "#0d47a1", color: "white" }}>
                  <tr>
                    <th>#</th>
                    <th>Tên</th>
                    <th>Email</th>
                    <th>Vai trò</th>
                    <th>Tổng dịch vụ phụ trách</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => {
                    const total = yeuCauList.filter(
                      (y) => String(y.NguoiPhuTrachId) === String(u.id)
                    ).length;

                    return (
                      <tr key={u.id}>
                        <td>{i + 1}</td>
                        <td>{u.name || u.username}</td>
                        <td>{u.email}</td>
                        <td>
                          {u.is_admin
                            ? "Admin"
                            : u.is_director
                            ? "Giám đốc"
                            : u.is_accountant
                            ? "Kế toán"
                            : "Nhân viên"}
                        </td>
                        <td>{total}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
