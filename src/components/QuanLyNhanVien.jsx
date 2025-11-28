import React, { useEffect, useState } from "react";
import Swal from "sweetalert2"; // 👈 BƯỚC 2: Import SweetAlert2
import Sidebar from "./Sidebar";
import Header from "./Header";
import EditProfileModal from "./EditProfileModal";
import useDashboardData from "./CMSDashboard/hooks/useDashboardData";
import NotificationPanel from "./CMSDashboard/NotificationPanel";
import translateService from "../utils/translateService";
import { showToast } from "../utils/toast"; 
import useSocketListener from "./CMSDashboard/hooks/useSocketListener";

export default function QuanLyNhanVien() {
  const { showEditModal, setShowEditModal } = useDashboardData();
  const [currentUser, setCurrentUser] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState(
    localStorage.getItem("language") || "vi"
  );
  const [hasNewRequest, setHasNewRequest] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [users, setUsers] = useState([]);
  const [yeuCauList, setYeuCauList] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedUserForService, setSelectedUserForService] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [showNotification, setShowNotification] = useState(false);

  // --- STATE CHO MODAL THÊM/SỬA NHÂN VIÊN ---
  const [showUserModal, setShowUserModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    password: "",
    role: "user", // user, admin, director, accountant
  });

  // Kiểm tra quyền Admin hoặc Giám đốc
  const canManage =
    currentUser?.is_admin === true ||
    currentUser?.is_admin === "1" ||
    currentUser?.is_director === true ||
    currentUser?.is_director === "1";

  useEffect(() => {
    const saved = localStorage.getItem("language");
    if (saved) setCurrentLanguage(saved);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("currentUser");
    if (saved) setCurrentUser(JSON.parse(saved));
  }, []);

  // Hàm load lại user
  const fetchUsers = async () => {
    try {
      const res = await fetch("https://onepasscms-backend.onrender.com/api/User");
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) setUsers(result.data);
    } catch (err) {
      console.error("❌ Lỗi lấy danh sách User:", err);
    }
  };

  useSocketListener({
    currentLanguage,
    setNotifications,
    setHasNewRequest,
    setShowNotification,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          "https://onepasscms-backend.onrender.com/api/yeucau?limit=1000"
        );
        const result = await res.json();
        if (result.success && Array.isArray(result.data))
          setYeuCauList(result.data);
      } catch (err) {
        console.error("❌ Lỗi lấy danh sách Yêu cầu:", err);
      }
    })();
  }, []);

  const handleOpenEditModal = () => {
    setShowEditModal(true);
  };

  const handleProfileUpdate = (updatedUser) => {
    setCurrentUser(updatedUser);
    localStorage.setItem("currentUser", JSON.stringify(updatedUser));
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData({
      username: "",
      name: "",
      email: "",
      password: "",
      role: "user",
    });
    setShowUserModal(true);
  };

  const handleOpenEdit = (user) => {
    setIsEditing(true);
    setEditingUserId(user.id);

    let role = "user";
    if (user.is_admin) role = "admin";
    else if (user.is_director) role = "director";
    else if (user.is_accountant) role = "accountant";

    setFormData({
      username: user.username,
      name: user.name || "",
      email: user.email || "",
      password: "",
      role: role,
    });
    setShowUserModal(true);
  };

  // 🔄 BƯỚC 3: Xử lý Xóa bằng SweetAlert2
  const handleDelete = async (id, name) => {
    const isVietnamese = currentLanguage === "vi";

    const result = await Swal.fire({
      title: isVietnamese ? "Xác nhận Xóa" : "Confirm Deletion",
      text: isVietnamese
        ? `Bạn có chắc muốn xóa nhân viên ${name}. Thao tác này không thể hoàn tác.`
        : `Are you sure you want to delete employee ${name} This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545", // Màu đỏ (danger)
      cancelButtonColor: "#6c757d", // Màu xám (secondary)
      confirmButtonText: isVietnamese ? "Xóa" : "Yes, delete it!",
      cancelButtonText: isVietnamese ? "Hủy bỏ" : "Cancel",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      const res = await fetch(
        `https://onepasscms-backend.onrender.com/api/User/${id}`,
        {
          method: "DELETE",
        }
      );
      const deleteResult = await res.json();
      if (deleteResult.success) {
        Swal.fire({
          title: isVietnamese ? "Thành công!" : "Deleted!",
          text: isVietnamese ? `Nhân viên "${name}" đã bị xóa.` : `Employee "${name}" has been deleted.`,
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
        fetchUsers();
      } else {
        showToast((isVietnamese ? "Lỗi: " : "Error: ") + deleteResult.message);
      }
    } catch (err) {
      console.error("Lỗi xóa:", err);
      showToast(
        isVietnamese ? "Lỗi kết nối server" : "Connection error"
      );
    }
  };
  // ------------------------------------------

  // Xử lý Lưu (Thêm hoặc Sửa)
  const handleSaveUser = async () => {
    // --- VALIDATION TRƯỚC KHI GỬI ---
    if (!formData.username || !formData.username.trim()) {
      showToast(
        currentLanguage === "vi"
          ? "Vui lòng nhập Tên đăng nhập!"
          : "Please enter Username!"
      );
      return;
    }

    // // ĐÃ BẬT LẠI VALIDATION EMAIL VÀ DÙNG showToast
    // if (!formData.email || !formData.email.trim()) {
    //   showToast(
    //     currentLanguage === "vi" ? "Vui lòng nhập Email!" : "Please enter Email!"
    //   );
    //   return;
    // }
    // -------------------------------

    const url = isEditing
      ? `https://onepasscms-backend.onrender.com/api/User/${editingUserId}`
      : "https://onepasscms-backend.onrender.com/api/User";

    const method = isEditing ? "PUT" : "POST";

    const payload = { ...formData };

    payload.email = payload.email.trim();
    payload.username = payload.username.trim();

    if (isEditing && !payload.password) {
      delete payload.password;
    }

    try {
      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (result.success) {
        showToast(
          isEditing
            ? currentLanguage === "vi"
              ? "Cập nhật thành công!"
              : "Update successful!"
            : currentLanguage === "vi"
            ? "Thêm mới thành công!"
            : "Created successfully!"
        );
        setShowUserModal(false);
        fetchUsers();
      } else {
        // Hiển thị thông báo lỗi từ server (ví dụ: Email trùng)
        showToast(
          currentLanguage === "vi"
            ? `Lỗi: ${result.message}`
            : `Error: ${result.message}`
        );
      }
    } catch (err) {
      console.error("Lỗi lưu user:", err);
      showToast(
        currentLanguage === "vi"
          ? "Có lỗi xảy ra khi kết nối server"
          : "Server connection error"
      );
    }
  };

  // --- LOGIC THỐNG KÊ (GIỮ NGUYÊN) ---
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
    "#3b82f6",
    "#ec4899",
    "#f59e0b",
    "#6366f1",
    "#10b981",
    "#8b5cf6",
    "#f97316",
    "#84cc16",
    "#06b6d4",
    "#9ca3af",
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
        onBellClick={() => {
          setShowNotification(!showNotification);
          setHasNewRequest(false);
        }}
        onOpenEditModal={handleOpenEditModal}
      />
      <NotificationPanel
        showNotification={showNotification}
        setShowNotification={setShowNotification}
        notifications={notifications}
        currentLanguage={currentLanguage}
      />
      {showEditModal && (
        <EditProfileModal
          currentUser={currentUser}
          onUpdate={handleProfileUpdate}
          onClose={() => setShowEditModal(false)}
          currentLanguage={currentLanguage}
        />
      )}

      {/* --- MODAL THÊM/SỬA NHÂN VIÊN (MODERN UI) --- */}
      {showUserModal &&
        (() => {
          // 1. Định nghĩa bộ từ điển ngôn ngữ ngay trong scope modal
          const translations = {
            vi: {
              titleAdd: "Thêm nhân viên mới",
              titleEdit: "Cập nhật nhân viên",
              // Đã xóa subTitleAdd và subTitleEdit vì không dùng nữa
              username: "Tên đăng nhập",
              usernamePh: "Nhập tên đăng nhập...",
              fullname: "Họ và tên",
              fullnamePh: "Nhập họ tên đầy đủ...",
              email: "Email",
              emailPh: "example@email.com",
              password: "Mật khẩu",
              passwordHint: "Để trống nếu không đổi",
              passwordPh: "********",
              role: "Vai trò",
              roles: {
                user: "Nhân viên",
                accountant: "Kế toán",
                director: "Giám đốc",
                admin: "Quản trị viên",
              },
              close: "Đóng",
              create: "Thêm mới",
              update: "Cập nhật",
            },
            en: {
              titleAdd: "Add New Employee",
              titleEdit: "Update Employee Profile",
              username: "Username",
              usernamePh: "Enter username...",
              fullname: "Full Name",
              fullnamePh: "Enter full name...",
              email: "Email Address",
              emailPh: "example@email.com",
              password: "Password",
              passwordHint: "Leave blank to keep current",
              passwordPh: "********",
              role: "Role / Position",
              roles: {
                user: "Staff",
                accountant: "Accountant",
                director: "Director",
                admin: "Admin",
              },
              close: "Close",
              create: "Create",
              update: "Update",
            },
          };

          const t = translations[currentLanguage] || translations.vi;

          return (
            <div
              className="modal d-block fade show"
              style={{
                backgroundColor: "rgba(0,0,0,0.5)",
                backdropFilter: "blur(5px)",
                zIndex: 1050,
              }}
            >
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg rounded-4">
                  {/* HEADER */}
                  <div className="modal-header border-bottom-0 pb-0">
                    <div className="d-flex flex-column">
                      <h5 className="modal-title fw-bold text-primary fs-4">
                        {isEditing ? t.titleEdit : t.titleAdd}
                      </h5>
                      {/* ĐÃ XÓA DÒNG SUBTITLE TIẾNG ANH TẠI ĐÂY */}
                    </div>
                    <button
                      type="button"
                      className="btn-close shadow-none"
                      onClick={() => setShowUserModal(false)}
                      style={{ marginTop: "-20px" }}
                    ></button>
                  </div>

                  {/* BODY */}
                  <div className="modal-body p-4">
                    {/* Username */}
                    <div className="mb-3">
                      <label className="form-label fw-semibold text-dark">
                        {t.username}
                      </label>
                      <input
                        type="text"
                        className="form-control bg-light border-0 py-2"
                        value={formData.username}
                        onChange={(e) =>
                          setFormData({ ...formData, username: e.target.value })
                        }
                        disabled={isEditing}
                        placeholder={t.usernamePh}
                      />
                    </div>

                    {/* Full Name */}
                    <div className="mb-3">
                      <label className="form-label fw-semibold text-dark">
                        {t.fullname}
                      </label>
                      <input
                        type="text"
                        className="form-control bg-light border-0 py-2"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder={t.fullnamePh}
                      />
                    </div>

                    {/* Email */}
                    <div className="mb-3">
                      <label className="form-label fw-semibold text-dark">
                        {t.email}
                      </label>
                      <input
                        type="email"
                        className="form-control bg-light border-0 py-2"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder={t.emailPh}
                      />
                    </div>

                    {/* Password */}
                    <div className="mb-3">
                      <label className="form-label d-block mb-1">
                        <span className="fw-semibold text-dark">
                          {t.password}
                        </span>
                        {isEditing && (
                          <span className="d-block text-secondary fst-italic small">
                            ({t.passwordHint})
                          </span>
                        )}
                      </label>

                      <div className="input-group">
                        <input
                          type={showPassword ? "text" : "password"}
                          className="form-control bg-light border-0 py-2"
                          value={formData.password}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              password: e.target.value,
                            })
                          }
                          placeholder={t.passwordPh}
                        />
                        <button
                          className="btn btn-light border-0 text-secondary"
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{ zIndex: 0 }}
                        >
                          <i
                            className={`bi ${
                              showPassword ? "bi-eye-slash" : "bi-eye"
                            }`}
                          ></i>
                        </button>
                      </div>
                    </div>

                    {/* Role */}
                    <div className="mb-3">
                      <label className="form-label fw-semibold text-dark">
                        {t.role}
                      </label>
                      <select
                        className="form-select bg-light border-0 py-2"
                        value={formData.role}
                        onChange={(e) =>
                          setFormData({ ...formData, role: e.target.value })
                        }
                        style={{ cursor: "pointer" }}
                      >
                        <option value="user">{t.roles.user}</option>
                        <option value="accountant">{t.roles.accountant}</option>
                        <option value="director">{t.roles.director}</option>
                        <option value="admin">{t.roles.admin}</option>
                      </select>
                    </div>
                  </div>

                  {/* FOOTER */}
                  <div className="modal-footer border-top-0 pt-0 pb-4 px-4">
                    <button
                      type="button"
                      className="btn btn-light text-secondary fw-semibold px-4"
                      onClick={() => setShowUserModal(false)}
                    >
                      {t.close}
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary px-4 shadow-sm"
                      onClick={handleSaveUser}
                    >
                      {isEditing ? t.update : t.create}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

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
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3 className="fw-bold mb-0">
              {currentLanguage === "vi"
                ? "Quản lý nhân viên"
                : "Employee Management"}
            </h3>
          </div>

          {/* --- Phần nội dung thống kê --- */}
          <div
            className="d-flex flex-wrap gap-4 mb-4"
            style={{ justifyContent: "space-between" }}
          >
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
                    {currentLanguage === "vi"
                      ? "Chọn nhân viên"
                      : "Select Employee"}
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
                  const stats = getServiceCountByTypeForUser(
                    selectedUserForService
                  );
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
                          const percent = total
                            ? Math.round((s.count / total) * 100)
                            : 0;
                          return (
                            <div key={i} className="mb-3">
                              <div className="d-flex justify-content-between">
                                <span>{s.name}</span>
                                <div>
                                  <span className="me-2 text-muted">
                                    {percent}%
                                  </span>
                                  <span className="fw-semibold text-primary">
                                    {s.count}
                                  </span>
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
                    {currentLanguage === "vi"
                      ? "Chọn nhân viên"
                      : "Select Employee"}
                  </option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name || u.username}
                    </option>
                  ))}
                </select>
              </div>
              {serviceCountByStatus.map((s, i) => {
                const percent = totalStatus
                  ? ((s.count / totalStatus) * 100).toFixed(0)
                  : 0;
                return (
                  <div key={i} className="mb-3">
                    <div className="d-flex justify-content-between">
                      <span>{s.status}</span>
                      <div>
                        <span className="me-2 text-muted">{percent}%</span>
                        <span className="fw-semibold text-primary">
                          {s.count}
                        </span>
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
            </div>
          </div>
          <div className="d-flex justify-content-end mb-3">
            {canManage && (
              <button className="btn btn-primary" onClick={handleOpenAdd}>
                <i className="bi bi-person-plus-fill me-2"></i>
                {currentLanguage === "vi" ? "Thêm nhân viên" : "Add Employee"}
              </button>
            )}
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
                    {canManage && <th>Hành động</th>}
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
                        {canManage && (
                          <td>
                            <button
                              className="btn btn-sm btn-outline-primary me-2"
                              onClick={() => handleOpenEdit(u)}
                            >
                              <i className="bi bi-pencil-square"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() =>
                                handleDelete(u.id, u.name || u.username)
                              }
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        )}
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