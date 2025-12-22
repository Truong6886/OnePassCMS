import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import Sidebar from "./Sidebar";
import Header from "./Header";
import EditProfileModal from "./EditProfileModal";
import useDashboardData from "./CMSDashboard/hooks/useDashboardData";
import NotificationPanel from "./CMSDashboard/NotificationPanel";
import { showToast } from "../utils/toast"; 
import useSocketListener from "./CMSDashboard/hooks/useSocketListener";
import { authenticatedFetch } from "../utils/api";
import { UploadCloud, Eye, EyeOff, X, FileText, Edit, Trash2 } from "lucide-react";

export default function QuanLyNhanVien() {
  const { showEditModal, setShowEditModal } = useDashboardData();
  const [currentUser, setCurrentUser] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState(localStorage.getItem("language") || "vi");
  const [notifications, setNotifications] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const [users, setUsers] = useState([]);

  // --- STATE CHO MODAL ---
  const [showUserModal, setShowUserModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false); 
  
  const [editingUserId, setEditingUserId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [uploadingCV, setUploadingCV] = useState(false);
  
  // State mở rộng hàng để xem CV
  const [expandedUserId, setExpandedUserId] = useState(null);

  const [formData, setFormData] = useState({
    username: "", name: "", email: "", password: "", role: "user", 
    perm_approve_b2b: false, perm_approve_b2c: false, perm_view_revenue: false, perm_view_staff: false,
    ChucDanh: "", PhongBan: "", MaVung: "+84", SoDienThoai: "", NgayVaoLam: "", LoaiHopDong: "", CV: ""
  });

  const isDirector = currentUser?.is_director === true || currentUser?.is_director === "1";
  const isAccountant = currentUser?.is_accountant === true || currentUser?.is_accountant === "1";
  const canViewRevenue = isDirector || isAccountant || currentUser?.perm_view_revenue;
  const canManageStaff = isDirector || currentUser?.perm_view_staff;
  const canViewCV = isDirector;
  const canViewPermissions = isDirector;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  useEffect(() => {
    const saved = localStorage.getItem("language");
    if (saved) setCurrentLanguage(saved);
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await authenticatedFetch("http://localhost:5000/api/User");
      if (!res) return;
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) setUsers(result.data);
    } catch (err) {
      console.error("❌ Lỗi lấy danh sách User:", err);
    }
  };

  useSocketListener({ currentLanguage, setNotifications, setShowNotification, currentUser: currentUser});
  useEffect(() => { fetchUsers(); }, []);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setIsDeleting(false);
    setFormData({
      username: "", name: "", email: "", password: "", role: "user",
      perm_approve_b2b: false, perm_approve_b2c: false, perm_view_revenue: false, perm_view_staff: false,
      ChucDanh: "", PhongBan: "", MaVung: "+84", SoDienThoai: "", NgayVaoLam: "", LoaiHopDong: "", CV: ""
    });
    setShowUserModal(true);
  };

  const fillFormData = (user) => {
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
      perm_approve_b2b: user.perm_approve_b2b || false,
      perm_approve_b2c: user.perm_approve_b2c || false,
      perm_view_revenue: user.perm_view_revenue || false,
      perm_view_staff: user.perm_view_staff || false,
      ChucDanh: user.ChucDanh || "",
      PhongBan: user.PhongBan || "",
      MaVung: user.MaVung || "+84",
      SoDienThoai: user.SoDienThoai || "",
      NgayVaoLam: user.NgayVaoLam || "",
      LoaiHopDong: user.LoaiHopDong || "",
      CV: user.CV || ""
    });
  };

  const handleOpenEdit = (user) => {
    setIsEditing(true);
    setIsDeleting(false);
    setEditingUserId(user.id);
    fillFormData(user);
    setShowUserModal(true);
  };

  const handleOpenDelete = (user) => {
    setIsEditing(false);
    setIsDeleting(true);
    setEditingUserId(user.id);
    fillFormData(user);
    setShowUserModal(true);
  };

  // Hàm xác nhận xóa (Check pass -> Xóa)
  const handleConfirmDelete = async () => {
    if (!formData.password) {
        showToast("Vui lòng nhập mật khẩu xác nhận", "warning");
        return;
    }

    try {
        // 1. Xác thực mật khẩu giám đốc
        const verifyRes = await fetch("http://localhost:5000/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: currentUser.username, password: formData.password })
        });
        const verifyData = await verifyRes.json();

        if (!verifyData.success) {
            showToast("Mật khẩu xác nhận không đúng!", "error");
            return;
        }

        // 2. Xóa
        const res = await fetch(`http://localhost:5000/api/User/${editingUserId}`, { method: "DELETE" });
        const json = await res.json();
        
        if (json.success) {
            showToast("Đã xóa nhân viên thành công!", "success");
            setShowUserModal(false);
            fetchUsers();
        } else {
            showToast(json.message, "error");
        }

    } catch (err) {
        showToast("Lỗi kết nối server", "error");
    }
  };

  const toggleExpandUser = (userId) => {
    setExpandedUserId(prev => prev === userId ? null : userId);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingCV(true);
    const formDataUpload = new FormData();
    formDataUpload.append("file", file);

    try {
      const res = await authenticatedFetch("http://localhost:5000/api/upload-cv", { 
          method: "POST", body: formDataUpload 
      });
      if (!res) return;
      const data = await res.json();
      if (data.success) {
         
          setFormData(prev => ({ ...prev, CV: data.url })); 
          
      } else {
          showToast("Upload thất bại: " + data.message, "error");
      }
    } catch (err) {
        showToast("Lỗi kết nối server khi upload", "error");
    } finally {
        setUploadingCV(false);
    }
  };

  const handleSaveUser = async () => {
    if (!formData.name?.trim()) return showToast("Vui lòng nhập tên nhân viên", "warning");
    if (!formData.SoDienThoai?.trim()) return showToast("Vui lòng nhập số điện thoại", "warning");
    
    // [MODIFIED] Logic xác thực mật khẩu
    if (isEditing) {
        // Nếu là Sửa: Mật khẩu này là của Giám đốc để xác nhận
        if (!formData.password) return showToast("Vui lòng nhập mật khẩu giám đốc để xác nhận cập nhật", "warning");
        
        // Xác thực mật khẩu giám đốc
        try {
            const verifyRes = await fetch("http://localhost:5000/api/login", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: currentUser.username, password: formData.password })
            });
            const verifyData = await verifyRes.json();
            if (!verifyData.success) return showToast("Mật khẩu giám đốc không đúng!", "error");
        } catch (err) { return showToast("Lỗi xác thực", "error"); }

    } else {
        // Nếu là Thêm mới: Mật khẩu này là cho nhân viên mới
        if (!formData.password) return showToast("Vui lòng nhập mật khẩu cho nhân viên mới", "warning");
    }

    const payloadUsername = formData.username || formData.SoDienThoai;
    const url = isEditing
      ? `http://localhost:5000/api/User/${editingUserId}`
      : "http://localhost:5000/api/User";
    const method = isEditing ? "PUT" : "POST";

    let roleFlags = {
       is_admin: formData.role === "admin",
       is_director: formData.role === "director",
       is_accountant: formData.role === "accountant",
       is_staff: formData.role === "user"
    };

    const payload = { ...formData, username: payloadUsername, ...roleFlags };
    delete payload.role;
    
    // [MODIFIED] Nếu đang sửa, không gửi password lên (vì pass trong form là pass của giám đốc)
    if (isEditing) {
        delete payload.password;
    }

    try {
      const res = await authenticatedFetch(url, { method: method, body: JSON.stringify(payload) });
      const result = await res.json();
      if (result.success) {
        showToast(isEditing ? "Cập nhật thành công!" : "Thêm mới thành công!", "success");
        setShowUserModal(false);
        fetchUsers();
      } else {
        showToast(result.message, "error");
      }
    } catch (err) {
      showToast("Lỗi kết nối", "error");
    }
  };

  const renderPermissions = (user) => {
    const perms = [];
    if (user.perm_approve_b2b || user.is_director) perms.push({ label: "Duyệt B2B", color: "bg-primary" });
    if (user.perm_approve_b2c || user.is_director) perms.push({ label: "Duyệt B2C", color: "bg-success" });
    if (user.perm_view_revenue || user.is_accountant || user.is_director) perms.push({ label: "Xem Doanh thu", color: "bg-warning text-dark" });
    if (user.perm_view_staff || user.is_director) perms.push({ label: "Xem CV", color: "bg-info text-dark" }); 
    return (
      <div className="d-flex flex-wrap justify-content-center gap-1">
        {perms.map((p, idx) => (
          <span key={idx} className={`badge ${p.color}`} style={{fontSize: "11px"}}>{p.label}</span>
        ))}
      </div>
    );
  };

  // STYLE
  const inputStyle = {
      backgroundColor: isDeleting ? "#F3F4F6" : "#fff", 
      border: "1px solid #E5E7EB", 
      borderRadius: "8px", 
      padding: "7px 10px", // Giữ kích thước nhỏ gọn
      fontSize: "13px",
      color: isDeleting ? "#9CA3AF" : "#374151", 
      width: "100%",
      outline: "none",
      cursor: isDeleting ? "not-allowed" : "text"
  };
  
  const labelStyle = { fontWeight: "700", fontSize: "13px", color: "#111827", marginBottom: "6px", display: "block" };
  const helperTextStyle = { fontSize: "11px", color: "#3B82F6", marginTop: "4px", fontStyle: "italic" };

  return (
    <div className="d-flex h-100" style={{ background: "#f9fafb" }}>
      <div style={{ width: showSidebar ? "250px" : "70px", transition: "0.3s", zIndex: 100 }}>
        <Sidebar collapsed={!showSidebar} user={currentUser} />
      </div>

      <div className="flex-grow-1" style={{ height: "100vh", overflowY: "auto", padding: "20px" }}>
        <Header currentUser={currentUser} showSidebar={showSidebar} onToggleSidebar={() => setShowSidebar(!showSidebar)}
          currentLanguage={currentLanguage} onLanguageChange={setCurrentLanguage} onBellClick={() => setShowNotification(!showNotification)}
          onOpenEditModal={() => setShowEditModal(true)}
        />
        <NotificationPanel showNotification={showNotification} setShowNotification={setShowNotification} notifications={notifications} currentLanguage={currentLanguage} />
        {showEditModal && <EditProfileModal currentUser={currentUser} onClose={() => setShowEditModal(false)} />}

        {/* CONTENT */}
       <div style={{ marginTop: "80px" }}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h3 className="fw-bold text-dark mb-1">{currentLanguage === "vi" ? "Danh sách nhân viên" : "Employee List"}</h3>
                <h6 style={{ color: "#9CA3AF", fontSize: "14px", fontWeight: "400", margin: 0 }}>
                  {currentLanguage === "vi" ? "Danh sách nhân viên, cộng tác viên của OnePass" : "List of OnePass employees and collaborators"}
                </h6>
            </div>
            {canManageStaff && (
              <button className="btn btn-primary shadow-sm" onClick={handleOpenAdd} style={{borderRadius: "8px", padding: "10px 20px"}}>
                <i className="bi bi-plus-lg me-2"></i>
                {currentLanguage === "vi" ? "Thêm nhân viên" : "Add Employee"}
              </button>
            )}
          </div>

          <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
            <div className="table-responsive">
              <table className="table table-bordered table-hover align-middle mb-0" style={{ fontSize: "14px" }}>
              <thead style={{ backgroundColor: "#2c4d9e", color: "white" }}>
                  <tr>
                    <th className="py-3 ps-3 text-center">STT</th>
                    <th className="py-3 text-center">Tên nhân viên</th>
                    <th className="py-3 text-center">Chức danh</th>
                    <th className="py-3 text-center">Phòng ban</th>
                    <th className="py-3 text-center">Email</th>
                    <th className="py-3 text-center">Mã vùng</th>
                    <th className="py-3 text-center">Số điện thoại</th>
                    <th className="py-3 text-center">Ngày vào làm</th>
                    <th className="py-3 text-center">Loại hợp đồng</th>
                    {canViewPermissions && <th className="py-3 text-center" style={{ width: "200px" }}>Phân quyền</th>}
                    {canViewCV && <th className="py-3 text-center" style={{ width: "90px" }}>CV</th>}
                    {canViewRevenue && <th className="py-3 text-center">Doanh thu</th>}
                    {canManageStaff && <th className="py-3 text-center">Hành động</th>}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => {
                    const isExpanded = expandedUserId === u.id;
                    let totalCols = 9; 
                    if (canViewPermissions) totalCols++;
                    if (canViewCV) totalCols++;
                    if (canViewRevenue) totalCols++;
                    if (canManageStaff) totalCols++;

                    return (
                      <React.Fragment key={u.id}>
                        <tr className="bg-white hover:bg-gray-50 align-middle">
                          <td className="ps-3 fw-bold text-secondary text-center">{i + 1}</td>
                          <td className="fw-semibold text-dark text-center">{u.name || u.username}</td>
                          <td className="text-center">{u.ChucDanh || "-"}</td>
                          <td className="text-center">{u.PhongBan || "-"}</td>
                          <td className="text-muted text-center">{u.email}</td>
                          <td className="text-center">{u.MaVung}</td>
                          <td style={{width:70}} className="text-center">{u.SoDienThoai}</td>
                          <td className="text-center">{u.NgayVaoLam ? new Date(u.NgayVaoLam).toLocaleDateString('vi-VN') : "-"}</td>
                          <td className="text-center">{u.LoaiHopDong || ""}</td>
                          {canViewPermissions && (<td className="text-center">{renderPermissions(u)}</td>)}
                          {canViewCV && (
                            <td className="text-center">
                              {u.CV ? (
                                <div className="d-flex justify-content-center align-items-center gap-2">
                                  <button className="btn btn-sm p-0 border-0" onClick={() => toggleExpandUser(u.id)}
                                    style={{color: isExpanded ? "#ef4444" : "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: 'transparent', width: '24px', height: '24px'}}>
                                    {isExpanded ? <EyeOff size={18} /> : <Eye size={18} />}
                                  </button>
                                  <a href={u.CV} target="_blank" rel="noreferrer" className="text-secondary" style={{ display: "flex", alignItems: "center", justifyContent: "center", textDecoration: 'none', width: '24px', height: '24px' }}>
                                    <FileText size={16} />
                                  </a>
                                </div>
                              ) : <span className="text-muted">-</span>}
                            </td>
                          )}
                          {canViewRevenue && (<td className="text-center fw-bold text-primary">{formatCurrency(u.DoanhThu)}</td>)}
                          {canManageStaff && (
                            <td className="text-center">
                              <div className="d-flex justify-content-center align-items-center gap-2">
                                <button className="btn btn-sm btn-primary d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }} onClick={() => handleOpenEdit(u)} title="Sửa">
                                  <Edit size={16} />
                                </button>
                                <button 
                                    className="btn btn-sm btn-danger d-flex align-items-center justify-content-center" 
                                    style={{ width: 32, height: 32 }} 
                                    onClick={() => handleOpenDelete(u)} 
                                    title="Xóa"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                        {isExpanded && u.CV && (
                          <tr className="bg-white"><td colSpan={totalCols} className="border p-0"><div className="p-3 bg-light border-bottom position-relative"><button onClick={() => toggleExpandUser(u.id)} className="position-absolute top-0 end-0 m-2 btn btn-sm btn-light border" style={{ zIndex: 10, display: "flex", alignItems: "center", gap: "4px" }}><X size={16} /> Đóng</button><div className="d-flex flex-column align-items-center"><div className="mb-2 fw-bold text-primary">CV Nhân viên: {u.name}</div><div style={{ width: "100%", height: "600px", border: "1px solid #ccc", borderRadius: "4px", backgroundColor: "#525659" }}><iframe src={`${u.CV}#toolbar=0&navpanes=0&scrollbar=0`} title="CV Viewer" width="100%" height="100%" style={{ border: "none" }} /></div></div></div></td></tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODAL CHUNG CHO THÊM / SỬA / XÓA --- */}
      {showUserModal && (
        <div className="modal d-block fade show" style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1050, backdropFilter: "blur(4px)" }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "600px" }}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "20px", padding: "15px" }}>
              
              <div className="text-center mb-3 pt-2 position-relative">
                <h4 className="fw-bold m-0" style={{ fontSize: "20px", color: "#1F2937" }}>
                    {isDeleting 
                        ? "Xóa nhân viên khỏi danh sách" 
                        : (isEditing ? "Cập nhật nhân viên" : "Thêm nhân viên mới")
                    }
                </h4>
                <p className="text-muted small m-0 mt-1">Hệ thống quản lý dịch vụ dành riêng cho OnePass</p>
                <button onClick={() => setShowUserModal(false)} style={{ position: "absolute", top: 0, right: 0, background: "none", border: "none", cursor: "pointer" }}><X size={20} color="#9CA3AF" /></button>
              </div>

              <div className="modal-body px-3 pb-2">
                <div className="row g-3">
                    <div className="col-md-12">
                        <label style={labelStyle}>Tên nhân viên <span className="text-danger">*</span></label>
                        <input type="text" style={inputStyle} placeholder="Nhập tên nhân viên" 
                            value={formData.name} 
                            disabled={isDeleting}
                            onChange={e => setFormData({...formData, name: e.target.value})} 
                        />
                    </div>
                    {/* Ẩn upload CV khi Xóa cho gọn */}
                    {!isDeleting && (
                    <div className="col-md-12">
                        <label style={labelStyle}>Tải lên CV nhân viên <span className="text-danger">*</span></label>
                        <div style={{ position: "relative" }}>
                            <input type="text" style={{...inputStyle, paddingRight: "40px", cursor: "pointer"}} placeholder={formData.CV ? "Đã có file CV" : "Tải lên CV"} value={formData.CV} readOnly onClick={() => document.getElementById('fileCV').click()} />
                            <div style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>{uploadingCV ? <span className="spinner-border spinner-border-sm text-secondary"></span> : <UploadCloud size={20} color="#6B7280" />}</div>
                            <input id="fileCV" type="file" hidden onChange={handleFileUpload} accept=".pdf,.doc,.docx" />
                        </div>
                    </div>
                    )}

                    <div className="col-md-6">
                        <label style={labelStyle}>Phòng Ban <span className="text-danger">*</span></label>
                        <select style={inputStyle} value={formData.PhongBan} disabled={isDeleting} onChange={e => setFormData({...formData, PhongBan: e.target.value})}>
                            <option value="">Chọn phòng ban</option>
                            <option value="BOD">Ban Giám Đốc (BOD)</option>
                            <option value="Planning Dept">Planning Dept</option>
                            <option value="General Affairs">General Affairs</option>
                            <option value="Accounting">Accounting</option>
                            <option value="Sale">Sale Team</option>
                            <option value="IT">IT & Tech</option>
                            <option value="Khác">Khác</option>
                        </select>
                       
                    </div>
                    <div className="col-md-6">
                        <label style={labelStyle}>Chức danh <span className="text-danger">*</span></label>
                        <input type="text" style={inputStyle} placeholder="Nhập chức danh" value={formData.ChucDanh} disabled={isDeleting} onChange={e => setFormData({...formData, ChucDanh: e.target.value})} />
                        
                    </div>

                    <div className="col-md-6">
                        <label style={labelStyle}>Email <span className="text-danger">*</span></label>
                        <input type="email" style={inputStyle} placeholder="Nhập email" value={formData.email} disabled={isDeleting} onChange={e => setFormData({...formData, email: e.target.value})} />
                
                    </div>
                    <div className="col-md-6">
                        <label style={labelStyle}>Số điện thoại <span className="text-danger">*</span></label>
                        <div className="d-flex gap-2">
                            <select style={{...inputStyle, width: "35%"}} value={formData.MaVung} disabled={isDeleting} onChange={e => setFormData({...formData, MaVung: e.target.value})}>
                                <option value="+84">+84</option>
                                <option value="+82">+82</option>
                            </select>
                            <input type="text" style={{...inputStyle, width: "65%"}} placeholder="number" value={formData.SoDienThoai} disabled={isDeleting} onChange={e => setFormData({...formData, SoDienThoai: e.target.value})} />
                        </div>
                    </div>

                    <div className="col-md-6">
                        <label style={labelStyle}>Ngày bắt đầu làm việc <span className="text-danger">*</span></label>
                        <input type="date" style={inputStyle} value={formData.NgayVaoLam} disabled={isDeleting} onChange={e => setFormData({...formData, NgayVaoLam: e.target.value})} />
                    </div>
                    <div className="col-md-6">
                        <label style={labelStyle}>Loại hợp đồng <span className="text-danger">*</span></label>
                        <select style={inputStyle} value={formData.LoaiHopDong} disabled={isDeleting} onChange={e => setFormData({...formData, LoaiHopDong: e.target.value})}>
                            <option value="">Chọn loại hợp đồng</option>
                            <option value="Thử việc">Thử việc</option>
                            <option value="Chính thức 12 tháng">Chính thức 12 tháng</option>
                            <option value="Chính thức 24 tháng">Chính thức 24 tháng</option>
                            <option value="Vô thời hạn">Vô thời hạn</option>
                            <option value="Cộng tác viên">Cộng tác viên</option>
                        </select>
                    </div>

                    {/* Phân quyền chỉ hiện khi không phải mode Xóa */}
                    {!isDeleting && (
                    <div className="col-12 mt-2">
                        <div className="card bg-light border-0 p-3">
                            <label className="form-label small fw-bold text-primary mb-2">Phân quyền nâng cao</label>
                            <div className="d-flex gap-4">
                                <div className="form-check"><input className="form-check-input" type="checkbox" id="permB2B" checked={formData.perm_approve_b2b} onChange={e => setFormData({...formData, perm_approve_b2b: e.target.checked})} /><label className="form-check-label small cursor-pointer" htmlFor="permB2B">Duyệt B2B</label></div>
                                <div className="form-check"><input className="form-check-input" type="checkbox" id="permB2C" checked={formData.perm_approve_b2c} onChange={e => setFormData({...formData, perm_approve_b2c: e.target.checked})} /><label className="form-check-label small cursor-pointer" htmlFor="permB2C">Duyệt B2C</label></div>
                                <div className="form-check"><input className="form-check-input" type="checkbox" id="permRev" checked={formData.perm_view_revenue} onChange={e => setFormData({...formData, perm_view_revenue: e.target.checked})} /><label className="form-check-label small cursor-pointer" htmlFor="permRev">Xem Doanh thu</label></div>
                                <div className="form-check"><input className="form-check-input" type="checkbox" id="permStaff" checked={formData.perm_view_staff} onChange={e => setFormData({...formData, perm_view_staff: e.target.checked})} /><label className="form-check-label small cursor-pointer" htmlFor="permStaff">Xem CV</label></div>
                            </div>
                        </div>
                    </div>
                    )}

                    {/* [MODIFIED] Ô mật khẩu luôn hiển thị */}
                    <div className="col-12">
                        <label style={labelStyle}>
                            {/* Đổi label tùy theo mode */}
                            {isDeleting ? "Nhập mật khẩu để xác nhận xóa" 
                             : isEditing ? "Nhập mật khẩu giám đốc để xác nhận cập nhật" 
                             : "Mật khẩu cho nhân viên mới"} 
                             <span className="text-danger">*</span>
                        </label>
                        <div style={{ position: "relative" }}>
                            <input 
                                type={showPassword ? "text" : "password"} 
                                // Style cho ô password: Nếu là xóa thì nền hơi xám
                                style={{...inputStyle, paddingRight: "40px", backgroundColor: "#fff", cursor: "text", color: "#374151"}} 
                                placeholder="Nhập mật khẩu" 
                                value={formData.password}
                                onChange={e => setFormData({...formData, password: e.target.value})}
                            />
                            <div onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", cursor: "pointer" }}>
                                {showPassword ? <EyeOff size={20} color="#6B7280"/> : <Eye size={20} color="#6B7280"/>}
                            </div>
                        </div>
                        <div style={helperTextStyle}>
                            {/* Đổi helper text */}
                            {(isDeleting || isEditing) ? "Mật khẩu tài khoản giám đốc." : "Mật khẩu tài khoản giám đốc."}
                        </div>
                    </div>
                </div>
              </div>

              <div className="mt-4 pt-2 text-center pb-2">
                {isDeleting ? (
                    <button 
                        onClick={handleConfirmDelete}
                        className="btn fw-bold w-100 shadow-sm" 
                        style={{ 
                            backgroundColor: "#FF5252", 
                            color: "white", 
                            height: "48px", 
                            borderRadius: "12px",
                            fontSize: "16px",
                            border: "none"
                        }}
                    >
                        Bạn có chắc muốn xóa nhân viên này?
                    </button>
                ) : (
                    <button 
                        onClick={handleSaveUser}
                        className="btn fw-bold w-100 shadow-sm" 
                        style={{ 
                            backgroundColor: "#10B981", 
                            color: "white", 
                            height: "48px", 
                            borderRadius: "12px",
                            fontSize: "16px"
                        }}
                    >
                        {isEditing ? "Cập nhật nhân viên" : "Thêm nhân viên"}
                    </button>
                )}
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
}