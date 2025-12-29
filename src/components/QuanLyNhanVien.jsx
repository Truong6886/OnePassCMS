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
  const [directorPassword, setDirectorPassword] = useState(""); 
  const [showDirectorPassword, setShowDirectorPassword] = useState(false);
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

  // Translations
  const translations = {
    vi: {
      stt: "STT", tenNhanVien: "Tên nhân viên", chucDanh: "Chức danh", phongBan: "Phòng ban", email: "Email",
      maVung: "Mã vùng", soDienThoai: "Số điện thoại", ngayVaoLam: "Ngày vào làm", loaiHopDong: "Loại hợp đồng",
      phanQuyen: "Phân quyền", cv: "CV", doanhThu: "Doanh thu", hanhDong: "Hành động",
      themNhanVien: "Thêm nhân viên", hoTen: "Họ tên", taiKhoan: "Tài khoản", matKhau: "Mật khẩu",
      vaiTro: "Vai trò", taiCV: "Tải CV", luu: "Lưu", huy: "Hủy", xoa: "Xóa",
      xemCV: "Xem CV", donViTinh: "đ", duyetB2B: "Duyệt B2B", duyetB2C: "Duyệt B2C",
      xemDoanhThu: "Xem Doanh thu", phanQuyenNangCao: "Phân quyền nâng cao",
      chonLoaiHopDong: "Chọn loại hợp đồng", thuViec: "Thử việc", chinhThuc12: "Chính thức 12 tháng",
      chinhThuc24: "Chính thức 24 tháng", voThoiHan: "Vô thời hạn", congTacVien: "Cộng tác viên",
      ngayBatDauLam: "Ngày bắt đầu làm việc", tieuDeTrang: "Danh sách nhân viên",
      moTaTrang: "Danh sách nhân viên, cộng tác viên của OnePass"
    },
    en: {
      stt: "No.", tenNhanVien: "Employee Name", chucDanh: "Position", phongBan: "Department", email: "Email",
      maVung: "Area Code", soDienThoai: "Phone Number", ngayVaoLam: "Start Date", loaiHopDong: "Contract Type",
      phanQuyen: "Permissions", cv: "CV", doanhThu: "Revenue", hanhDong: "Actions",
      themNhanVien: "Add Employee", hoTen: "Full Name", taiKhoan: "Account", matKhau: "Password",
      vaiTro: "Role", taiCV: "Upload CV", luu: "Save", huy: "Cancel", xoa: "Delete",
      xemCV: "View CV", donViTinh: "₫", duyetB2B: "Approve B2B", duyetB2C: "Approve B2C",
      xemDoanhThu: "View Revenue", phanQuyenNangCao: "Advanced Permissions",
      chonLoaiHopDong: "Select contract type", thuViec: "Probation", chinhThuc12: "Official 12 months",
      chinhThuc24: "Official 24 months", voThoiHan: "Indefinite", congTacVien: "Collaborator",
      ngayBatDauLam: "Start Date", tieuDeTrang: "Employee List",
      moTaTrang: "List of OnePass employees and collaborators"
    },
    ko: {
      stt: "번호", tenNhanVien: "직원명", chucDanh: "직책", phongBan: "부서", email: "이메일",
      maVung: "지역번호", soDienThoai: "전화번호", ngayVaoLam: "입사일", loaiHopDong: "계약 유형",
      phanQuyen: "권한", cv: "이력서", doanhThu: "매출", hanhDong: "작업",
      themNhanVien: "직원 추가", hoTen: "성명", taiKhoan: "계정", matKhau: "비밀번호",
      vaiTro: "역할", taiCV: "이력서 업로드", luu: "저장", huy: "취소", xoa: "삭제",
      xemCV: "이력서 보기", donViTinh: "₫", duyetB2B: "B2B 승인", duyetB2C: "B2C 승인",
      xemDoanhThu: "매출 보기", phanQuyenNangCao: "고급 권한",
      chonLoaiHopDong: "계약 유형 선택", thuViec: "수습", chinhThuc12: "정규직 12개월",
      chinhThuc24: "정규직 24개월", voThoiHan: "무기한", congTacVien: "협력자",
      ngayBatDauLam: "근무 시작일", tieuDeTrang: "직원 목록",
      moTaTrang: "OnePass 직원 및 협력자 목록"
    }
  };
  const t = translations[currentLanguage === "vi" ? "vi" : currentLanguage === "ko" ? "ko" : "en"];

  // Helper function to translate contract type
  const translateContractType = (contractType) => {
    if (!contractType) return "";
    const contractMap = {
      "Thử việc": { vi: "Thử việc", en: "Probation", ko: "수습" },
      "Chính thức 12 tháng": { vi: "Chính thức 12 tháng", en: "Official 12 months", ko: "정규직 12개월" },
      "Chính thức 24 tháng": { vi: "Chính thức 24 tháng", en: "Official 24 months", ko: "정규직 24개월" },
      "Vô thời hạn": { vi: "Vô thời hạn", en: "Indefinite", ko: "무기한" },
      "Cộng tác viên": { vi: "Cộng tác viên", en: "Collaborator", ko: "협력자" }
    };
    const lang = currentLanguage === "vi" ? "vi" : currentLanguage === "ko" ? "ko" : "en";
    return contractMap[contractType] ? contractMap[contractType][lang] : contractType;
  };

  useEffect(() => {
    const saved = localStorage.getItem("language");
    if (saved) setCurrentLanguage(saved);
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await authenticatedFetch("https://onepasscms-backend-tvdy.onrender.com/api/User");
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
    setDirectorPassword(""); 
    setFormData({
      username: "", name: "", email: "", password: "", role: "", 
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


const handleConfirmDelete = async () => {
    if (!directorPassword) { 
        showToast("Vui lòng nhập mật khẩu giám đốc để xác nhận", "warning");
        return;
    }

    try {
 
        const verifyRes = await fetch("https://onepasscms-backend-tvdy.onrender.com/api/verify-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                username: currentUser.username, 
                password: directorPassword // Mật khẩu giám đốc
            })
        });
        const verifyData = await verifyRes.json();

        if (!verifyData.success) {
            showToast("Mật khẩu giám đốc không đúng!", "error");
            return;
        }

        // Nếu đúng mật khẩu thì mới xóa
        const res = await authenticatedFetch(`https://onepasscms-backend-tvdy.onrender.com/api/User/${editingUserId}`, { method: "DELETE" });
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
      const res = await authenticatedFetch("https://onepasscms-backend-tvdy.onrender.com/api/upload-cv", { 
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

    
    if (!isEditing && !formData.password) {
        return showToast("Vui lòng tạo mật khẩu cho nhân viên mới", "warning");
    }
    

    if (!directorPassword) {
        return showToast("Vui lòng nhập mật khẩu GIÁM ĐỐC để xác thực", "warning");
    }


    try {
        const verifyRes = await fetch("https://onepasscms-backend-tvdy.onrender.com/api/verify-password", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                username: currentUser.username, 
                password: directorPassword // Mật khẩu giám đốc
            })
        });
        const verifyData = await verifyRes.json();
        if (!verifyData.success) return showToast("Mật khẩu Giám đốc không đúng!", "error");
    } catch (err) { return showToast("Lỗi xác thực", "error"); }

    // 4. Tiến hành Lưu/Sửa
    const url = isEditing
      ? `https://onepasscms-backend-tvdy.onrender.com/api/User/${editingUserId}`
      : "https://onepasscms-backend-tvdy.onrender.com/api/User";
    const method = isEditing ? "PUT" : "POST";

    let roleFlags = {
       is_admin: formData.role === "admin",
       is_director: formData.role === "director",
       is_accountant: formData.role === "accountant",
       is_staff: formData.role === "user"
    };

    const payload = { ...formData, ...roleFlags };
    delete payload.role;


    if (isEditing && !formData.password) {
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
    if (user.perm_approve_b2b || user.is_director) perms.push({ label: t.duyetB2B, color: "bg-primary" });
    if (user.perm_approve_b2c || user.is_director) perms.push({ label: t.duyetB2C, color: "bg-success" });
    if (user.perm_view_revenue || user.is_accountant || user.is_director) perms.push({ label: t.xemDoanhThu, color: "bg-warning text-dark" });
    if (user.perm_view_staff || user.is_director) perms.push({ label: t.xemCV, color: "bg-info text-dark" }); 
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
                <h3 className="fw-bold text-dark mb-1">{t.tieuDeTrang}</h3>
                <h6 style={{ color: "#9CA3AF", fontSize: "14px", fontWeight: "400", margin: 0 }}>
                  {t.moTaTrang}
                </h6>
            </div>
            {canManageStaff && (
              <button className="btn btn-primary shadow-sm" onClick={handleOpenAdd} style={{borderRadius: "8px", padding: "10px 20px"}}>
                <i className="bi bi-plus-lg me-2"></i>
                {t.themNhanVien}
              </button>
            )}
          </div>

          <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
            <div className="table-responsive">
              <table className="table table-bordered table-hover align-middle mb-0" style={{ fontSize: "14px" }}>
              <thead style={{ backgroundColor: "#2c4d9e", color: "white" }}>
                  <tr>
                    <th className="py-3 ps-3 text-center">{t.stt}</th>
                    <th className="py-3 text-center">{t.tenNhanVien}</th>
                    <th className="py-3 text-center">{t.chucDanh}</th>
                    <th className="py-3 text-center">{t.phongBan}</th>
                    <th className="py-3 text-center">{t.email}</th>
                    <th className="py-3 text-center">{t.maVung}</th>
                    <th className="py-3 text-center">{t.soDienThoai}</th>
                    <th className="py-3 text-center">{t.ngayVaoLam}</th>
                    <th className="py-3 text-center">{t.loaiHopDong}</th>
                    {canViewPermissions && <th className="py-3 text-center" style={{ width: "200px" }}>{t.phanQuyen}</th>}
                    {canViewCV && <th className="py-3 text-center" style={{ width: "90px" }}>{t.cv}</th>}
                    {canViewRevenue && <th className="py-3 text-center">{t.doanhThu}</th>}
                    {canManageStaff && <th className="py-3 text-center">{t.hanhDong}</th>}
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
                          <td className="text-center">{translateContractType(u.LoaiHopDong) || ""}</td>
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
                        <label style={labelStyle}>{t.ngayBatDauLam} <span className="text-danger">*</span></label>
                        <input type="date" style={inputStyle} value={formData.NgayVaoLam} disabled={isDeleting} onChange={e => setFormData({...formData, NgayVaoLam: e.target.value})} />
                    </div>
                    <div className="col-md-6">
                        <label style={labelStyle}>{t.loaiHopDong} <span className="text-danger">*</span></label>
                        <select style={inputStyle} value={formData.LoaiHopDong} disabled={isDeleting} onChange={e => setFormData({...formData, LoaiHopDong: e.target.value})}>
                            <option value="">{t.chonLoaiHopDong}</option>
                            <option value="Thử việc">{t.thuViec}</option>
                            <option value="Chính thức 12 tháng">{t.chinhThuc12}</option>
                            <option value="Chính thức 24 tháng">{t.chinhThuc24}</option>
                            <option value="Vô thời hạn">{t.voThoiHan}</option>
                            <option value="Cộng tác viên">{t.congTacVien}</option>
                        </select>
                    </div>

                    {/* Phân quyền chỉ hiện khi không phải mode Xóa */}
                    {!isDeleting && (
                    <div className="col-12 mt-2">
                        <div className="card bg-light border-0 p-3">
                            <label className="form-label small fw-bold text-primary mb-2">{t.phanQuyenNangCao}</label>
                            <div className="d-flex gap-4">
                                <div className="form-check"><input className="form-check-input" type="checkbox" id="permB2B" checked={formData.perm_approve_b2b} onChange={e => setFormData({...formData, perm_approve_b2b: e.target.checked})} /><label className="form-check-label small cursor-pointer" htmlFor="permB2B">{t.duyetB2B}</label></div>
                                <div className="form-check"><input className="form-check-input" type="checkbox" id="permB2C" checked={formData.perm_approve_b2c} onChange={e => setFormData({...formData, perm_approve_b2c: e.target.checked})} /><label className="form-check-label small cursor-pointer" htmlFor="permB2C">{t.duyetB2C}</label></div>
                                <div className="form-check"><input className="form-check-input" type="checkbox" id="permRev" checked={formData.perm_view_revenue} onChange={e => setFormData({...formData, perm_view_revenue: e.target.checked})} /><label className="form-check-label small cursor-pointer" htmlFor="permRev">{t.xemDoanhThu}</label></div>
                                <div className="form-check"><input className="form-check-input" type="checkbox" id="permStaff" checked={formData.perm_view_staff} onChange={e => setFormData({...formData, perm_view_staff: e.target.checked})} /><label className="form-check-label small cursor-pointer" htmlFor="permStaff">{t.xemCV}</label></div>
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

                    {/* --- VAI TRÒ HỆ THỐNG --- */}
                    <div className="col-md-12">
                        <label style={labelStyle}>{t.vaiTro} <span className="text-danger">*</span></label>
                        <select 
                            style={inputStyle} 
                            value={formData.role} 
                            disabled={isDeleting} 
                            onChange={e => setFormData({...formData, role: e.target.value})}
                        >
                            <option value="user">Nhân viên (Staff)</option>
                            <option value="accountant">Kế toán (Accountant)</option>
                            <option value="director">Giám đốc (Director)</option>
                            <option value="admin">Quản trị viên (Admin)</option>
                        </select>
                    </div>

                    {/* --- MẬT KHẨU GIÁM ĐỐC --- */}
                    <div className="col-12 mt-1 pt-1">
                        <label style={{...labelStyle}}>
                            Mật khẩu Giám Đốc<span className="text-danger"> * </span>
                        </label>
                        <div style={{ position: "relative" }}>
                            <input 
                                type={showDirectorPassword ? "text" : "password"} 
                                style={{...inputStyle, paddingRight: "40px"}} 
                                placeholder="Nhập mật khẩu để xác nhận" 
                                value={directorPassword}
                                onChange={e => setDirectorPassword(e.target.value)}
                            />
                            <div onClick={() => setShowDirectorPassword(!showDirectorPassword)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", cursor: "pointer" }}>
                                {showDirectorPassword ? <EyeOff size={20} color="#6B7280"/> : <Eye size={20} color="#6B7280"/>}
                            </div>
                        </div>
                        <div style={helperTextStyle}>Bắt buộc nhập để thực hiện hành động này.</div>
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
