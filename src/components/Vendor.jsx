import React, { useState, useEffect, useRef } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { showToast } from "../utils/toast";
import { authenticatedFetch } from "../utils/api";
import { Plus, Edit, Trash2, X, Save, Eye, EyeOff, ChevronDown, LayoutGrid, Search } from "lucide-react"; // Thêm LayoutGrid, Search
import Swal from "sweetalert2";

export default function Vendor() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem("currentUser")) || null);
  const [currentLanguage, setCurrentLanguage] = useState(localStorage.getItem("language") || "vi");

  // State cho Search & Filter
  const [searchTerm, setSearchTerm] = useState("");

  // State cho Ẩn/Hiện cột
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const columnMenuRef = useRef(null);
  
  // Cấu hình các cột (Key và Label)
  const columnConfig = [
    { key: 'stt', label: 'STT' },
    { key: 'ten', label: 'Tên vendor' },
    { key: 'dkkd', label: 'Số ĐKKD' },
    { key: 'daumoi', label: 'Đầu mối' },
    { key: 'mavung', label: 'Mã vùng' },
    { key: 'sdt', label: 'Số điện thoại' },
    { key: 'email', label: 'Email' },
    { key: 'dichvu', label: 'Dịch vụ' },
    { key: 'ngaytao', label: 'Ngày tạo' },
    { key: 'ghichu', label: 'Ghi chú' },
    { key: 'thaotac', label: 'Thao tác' }
  ];

  // State lưu trạng thái hiển thị của từng cột (Mặc định hiện tất cả)
  const [visibleColumns, setVisibleColumns] = useState(
    columnConfig.reduce((acc, col) => ({ ...acc, [col.key]: true }), {})
  );

  // State cho Modal
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // State form
  const [formData, setFormData] = useState({
    id: null,
    TenVendor: "",
    SoDKKD: "",
    DiaChi: "",
    DauMoi: "",
    ChucDanh: "",
    MaVung: "+84",
    SoDienThoai: "",
    Email: "",
    Service: "",
    NgayDangKy: new Date().toISOString().split('T')[0], 
    GhiChu: "",
    ConfirmPassword: ""
  });

  useEffect(() => {
    fetchVendors();
    
    // Xử lý click outside để đóng menu cột
    const handleClickOutside = (event) => {
        if (columnMenuRef.current && !columnMenuRef.current.contains(event.target)) {
            setShowColumnMenu(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const res = await authenticatedFetch("https://onepasscms-backend-tvdy.onrender.com/api/vendors");
      const json = await res.json();
      if (json.success) {
        setVendors(json.data);
      }
    } catch (error) {
      console.error(error);
      showToast("Lỗi tải danh sách vendor", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setFormData({
      id: null, TenVendor: "", SoDKKD: "", DiaChi: "", DauMoi: "", ChucDanh: "",
      MaVung: "+84", SoDienThoai: "", Email: "", Service: "", 
      NgayDangKy: new Date().toISOString().split('T')[0],
      GhiChu: "", ConfirmPassword: ""
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const openEditModal = (vendor) => {
    setFormData({
        ...vendor,
        ChucDanh: vendor.ChucDanh || "", 
        NgayDangKy: vendor.created_at ? vendor.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
        ConfirmPassword: ""
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.TenVendor) return showToast("Tên Vendor là bắt buộc", "warning");
    if (!formData.SoDKKD) return showToast("Số ĐKKD là bắt buộc", "warning");
    if (!formData.Service) return showToast("Vui lòng nhập dịch vụ", "warning");
    
    if (!isEditing && !formData.ConfirmPassword) {
        return showToast("Vui lòng nhập mật khẩu xác nhận", "warning");
    }

    try {
      const url = isEditing 
        ? `https://onepasscms-backend-tvdy.onrender.com/api/vendors/${formData.id}`
        : "https://onepasscms-backend-tvdy.onrender.com/api/vendors";
      
      const method = isEditing ? "PUT" : "POST";
      const payload = { ...formData };
      delete payload.ConfirmPassword; 

      const res = await authenticatedFetch(url, {
        method,
        body: JSON.stringify(payload)
      });

      const json = await res.json();

      if (json.success) {
        showToast(isEditing ? "Cập nhật thành công" : "Thêm mới thành công", "success");
        setShowModal(false);
        fetchVendors();
      } else {
        showToast(json.message, "error");
      }
    } catch (error) {
      showToast("Lỗi kết nối server", "error");
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Xác nhận xóa?",
      text: "Hành động này không thể hoàn tác!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy"
    });

    if (result.isConfirmed) {
      try {
        const res = await authenticatedFetch(`https://onepasscms-backend-tvdy.onrender.com/api/vendors/${id}`, {
          method: "DELETE"
        });
        const json = await res.json();
        if (json.success) {
          showToast("Đã xóa vendor", "success");
          fetchVendors();
        } else {
          showToast(json.message, "error");
        }
      } catch (error) {
        showToast("Lỗi server", "error");
      }
    }
  };

  const toggleColumn = (key) => {
    setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // --- FILTER LOGIC ---
  const filteredVendors = vendors.filter(item => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
        (item.TenVendor || "").toLowerCase().includes(s) ||
        (item.DauMoi || "").toLowerCase().includes(s) ||
        (item.Service || "").toLowerCase().includes(s)
    );
  });

  // --- STYLES ---
  const labelStyle = { fontSize: "13px", fontWeight: "700", color: "#374151", marginBottom: "6px", display: "block" };
  const inputStyle = { backgroundColor: "#F3F4F6", border: "1px solid #E5E7EB", borderRadius: "10px", padding: "10px 12px", fontSize: "14px", color: "#111827", width: "100%", outline: "none" };

  return (
    <div className="d-flex">
      <div className="position-fixed h-100" style={{ zIndex: 100 }}>
        <Sidebar collapsed={!showSidebar} user={currentUser} />
      </div>
      <div 
        className="flex-grow-1 transition-all" 
        style={{ marginLeft: showSidebar ? "250px" : "60px", padding: "20px" }}
      >
        <Header 
            currentUser={currentUser} 
            onToggleSidebar={() => setShowSidebar(!showSidebar)} 
            showSidebar={showSidebar}
            currentLanguage={currentLanguage}
            onLanguageChange={setCurrentLanguage}
        />

        <div className="container-fluid" style={{ marginTop: "85px" }}>
            
            {/* TIÊU ĐỀ */}
            <div className="mb-3">
                <h4 className="fw-bold text-primary m-0">Danh sách Vendor</h4>
                <small className="text-muted">Danh sách Vendor của OnePass</small>
            </div>

            {/* TOOLBAR: SEARCH & ACTIONS */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                
                {/* Search Bar */}
                <div className="position-relative" style={{ width: "350px" }}>
                    <Search size={18} className="position-absolute text-muted" style={{ left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                    <input 
                        type="text" 
                        className="form-control shadow-sm"
                        placeholder="Tìm theo Tên, Đầu mối, Dịch vụ..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ 
                            borderRadius: "30px", 
                            paddingLeft: "38px", 
                            fontSize: "14px",
                            height: "40px"
                        }}
                    />
                </div>

                {/* Right Actions: Add & Column Config */}
                <div className="d-flex align-items-center gap-2">
                    
                    {/* Nút Thêm Vendor (Style giống B2C) */}
                    <button 
                        className="btn d-flex align-items-center gap-2 shadow-sm" 
                        onClick={openAddModal} 
                        style={{
                            backgroundColor: "#16a34a", // Màu xanh lá
                            color: "white",        
                            border: "none",            
                            borderRadius: "8px",
                            padding: "8px 16px",
                            fontWeight: 500
                        }}
                    >
                        <Plus size={18} /> 
                        {isEditing ? "Cập nhật" : "Thêm Vendor"}
                    </button>

                    {/* Nút Ẩn/Hiện cột */}
                    <div className="position-relative" ref={columnMenuRef}>
                        <button
                            className="btn btn-light border shadow-sm d-flex align-items-center justify-content-center"
                            style={{ width: 40, height: 40, borderRadius: "8px", backgroundColor: "#fff" }}
                            onClick={() => setShowColumnMenu(!showColumnMenu)}
                            title="Ẩn/Hiện cột"
                        >
                            <LayoutGrid size={20} color="#4b5563" />
                        </button>

                        {/* Dropdown Menu Cột */}
                        {showColumnMenu && (
                            <div className="position-absolute bg-white shadow rounded border p-2" 
                                 style={{ top: "100%", right: 0, zIndex: 1000, width: "200px", marginTop: "5px" }}>
                                <div className="fw-bold mb-2 px-1 text-muted" style={{fontSize: '12px'}}>Cấu hình cột:</div>
                                {columnConfig.map((col) => (
                                    <div key={col.key} className="d-flex align-items-center px-2 py-1 hover-bg-gray rounded" style={{cursor: "pointer"}} onClick={() => toggleColumn(col.key)}>
                                        <input 
                                            type="checkbox" 
                                            checked={visibleColumns[col.key]} 
                                            onChange={() => {}} // Handle by div click
                                            style={{ cursor: "pointer", marginRight: "8px" }} 
                                        />
                                        <span style={{ fontSize: "13px" }}>{col.label}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* BẢNG DỮ LIỆU */}
            <div className="table-responsive shadow-sm rounded border">
                <table className="table table-bordered table-hover mb-0 align-middle" style={{ fontSize: "13px" }}>
                    <thead className="text-white text-center" style={{ backgroundColor: "#1e3a8a" }}>
                        <tr>
                            {visibleColumns.stt && <th style={{width: '50px'}}>STT</th>}
                            {visibleColumns.ten && <th>Tên vendor</th>}
                            {visibleColumns.dkkd && <th>Số ĐKKD</th>}
                            {visibleColumns.daumoi && <th>Đầu mối</th>}
                            
                            {visibleColumns.mavung && <th style={{width: '90px'}}>Mã vùng</th>}
                            {visibleColumns.sdt && <th style={{width: '120px'}}>Số điện thoại</th>}
                            {visibleColumns.email && <th>Email</th>}

                            {visibleColumns.dichvu && <th>Dịch vụ</th>}
                            {visibleColumns.ngaytao && <th>Ngày tạo</th>}
                            {visibleColumns.ghichu && <th>Ghi chú</th>}
                            {visibleColumns.thaotac && <th style={{width: '100px'}}>Thao tác</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredVendors.length > 0 ? (
                            filteredVendors.map((item, index) => (
                            <tr key={item.id} className="bg-white">
                                {visibleColumns.stt && <td className="text-center fw-bold">{index + 1}</td>}
                                {visibleColumns.ten && <td className="text-center fw-semibold text-primary">{item.TenVendor}</td>}
                                {visibleColumns.dkkd && <td className="text-center">{item.SoDKKD}</td>}
                                {visibleColumns.daumoi && (
                                    <td>
                                        <div className="text-center">{item.DauMoi}</div>
                                        {item.ChucDanh && <small className="text-muted d-block text-center">{item.ChucDanh}</small>}
                                    </td>
                                )}

                                {visibleColumns.mavung && <td className="text-center">{item.MaVung}</td>}
                                {visibleColumns.sdt && <td className="text-center">{item.SoDienThoai}</td>}
                                {visibleColumns.email && <td className="text-center">{item.Email}</td>}

                                {visibleColumns.dichvu && (
                                    <td className="text-center">
                                        <span>{item.Service}</span>
                                    </td>
                                )}
                                {visibleColumns.ngaytao && <td className="text-center text-muted">{item.created_at?.split("T")[0]}</td>}
                                {visibleColumns.ghichu && <td style={{maxWidth: "200px"}} className="text-truncate">{item.GhiChu}</td>}
                                
                                {visibleColumns.thaotac && (
                                    <td className="text-center">
                                        <div className="d-flex justify-content-center gap-2">
                                            <button className="btn btn-sm btn-outline-primary border-0" onClick={() => openEditModal(item)} title="Sửa">
                                                <Edit size={16} />
                                            </button>
                                            <button className="btn btn-sm btn-outline-danger border-0" onClick={() => handleDelete(item.id)} title="Xóa">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="100%" className="text-center py-5 text-muted">
                                    {searchTerm ? "Không tìm thấy kết quả phù hợp" : "Chưa có dữ liệu vendor"}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {/* --- MODAL GIỮ NGUYÊN NHƯ CŨ --- */}
        {showModal && (
          <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" 
               style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1050, backdropFilter: "blur(2px)" }}>
            <div className="bg-white p-4 position-relative" 
                 style={{ width: "800px", maxWidth: "95%", borderRadius: "20px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
              
              <div className="text-center mb-4">
                <h4 className="fw-bold m-0" style={{color: "#333"}}>
                    {isEditing ? "Cập nhật Vendor" : "Thêm vendor"}
                </h4>
                <p className="text-muted small">Hệ thống quản lý dịch vụ dành riêng cho One Pass</p>
              </div>

              <div className="row g-3">
                    <div className="col-md-6">
                        <label style={labelStyle}>Tên vendor <span className="text-danger">*</span></label>
                        <input type="text" style={inputStyle} name="TenVendor" placeholder="Nhập tên vendor" value={formData.TenVendor} onChange={handleInputChange} />
                    </div>
                    <div className="col-md-6">
                        <label style={labelStyle}>Số đăng ký kinh doanh <span className="text-danger">*</span></label>
                        <input type="text" style={inputStyle} name="SoDKKD" placeholder="Nhập số ĐKKD" value={formData.SoDKKD} onChange={handleInputChange} />
                    </div>
                    
                    <div className="col-md-6">
                        <label style={labelStyle}>Đầu mối <span className="text-danger">*</span></label>
                        <input type="text" style={inputStyle} name="DauMoi" placeholder="Nhập tên người phụ trách" value={formData.DauMoi} onChange={handleInputChange} />
                    </div>
                    <div className="col-md-6">
                        <label style={labelStyle}>Chức danh</label>
                        <input type="text" style={inputStyle} name="ChucDanh" placeholder="Nhập chức danh" value={formData.ChucDanh} onChange={handleInputChange} />
                    </div>

                    <div className="col-md-6">
                        <label style={labelStyle}>Email <span className="text-danger">*</span></label>
                        <input type="email" style={inputStyle} name="Email" placeholder="Nhập email" value={formData.Email} onChange={handleInputChange} />
                    </div>
                    <div className="col-md-6">
                        <label style={labelStyle}>Số điện thoại <span className="text-danger">*</span></label>
                        <div className="d-flex gap-2">
                             <select 
                                style={{...inputStyle, width: "100px", cursor: "pointer"}} 
                                name="MaVung" 
                                value={formData.MaVung} 
                                onChange={handleInputChange}
                             >
                                <option value="+84">+84</option>
                                <option value="+82">+82</option>
                            </select>
                            <input type="text" style={inputStyle} name="SoDienThoai" placeholder="Nhập SĐT" value={formData.SoDienThoai} onChange={handleInputChange} />
                        </div>
                    </div>

                    <div className="col-md-6">
                        <label style={labelStyle}>Ngày đăng ký lên hệ thống <span className="text-danger">*</span></label>
                        <input type="date" style={inputStyle} name="NgayDangKy" value={formData.NgayDangKy} onChange={handleInputChange} />
                    </div>
                    <div className="col-md-6">
                        <label style={labelStyle}>Dịch vụ cung cấp <span className="text-danger">*</span></label>
                        <input 
                            type="text" 
                            style={inputStyle} 
                            name="Service" 
                            placeholder="Nhập dịch vụ cung cấp" 
                            value={formData.Service} 
                            onChange={handleInputChange} 
                        />
                    </div>

                    <div className="col-12">
                        <label style={labelStyle}>Địa chỉ <span className="text-danger">*</span></label>
                        <input type="text" style={inputStyle} name="DiaChi" placeholder="Địa chỉ vendor" value={formData.DiaChi} onChange={handleInputChange} />
                    </div>
                    
                    <div className="col-12">
                         <label style={labelStyle}>Nhập mật khẩu để xác nhận <span className="text-danger">*</span></label>
                         <div className="position-relative">
                            <input 
                                type={showConfirmPass ? "text" : "password"} 
                                style={{...inputStyle, paddingRight: "40px"}} 
                                name="ConfirmPassword" 
                                placeholder="Nhập mật khẩu" 
                                value={formData.ConfirmPassword} 
                                onChange={handleInputChange} 
                            />
                            <div 
                                className="position-absolute cursor-pointer text-muted"
                                style={{right: "12px", top: "50%", transform: "translateY(-50%)"}}
                                onClick={() => setShowConfirmPass(!showConfirmPass)}
                            >
                                {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
                            </div>
                         </div>
                         <a href="#" className="d-block mt-2 small text-decoration-none" style={{color: "#3b82f6"}}>Mật khẩu tài khoản admin hiện tại?</a>
                    </div>
                </div>

              <div className="mt-4 pt-2">
                <button 
                    className="btn w-100 fw-bold text-white shadow-sm" 
                    onClick={handleSubmit}
                    style={{
                        backgroundColor: "#22c55e", 
                        padding: "12px", 
                        borderRadius: "10px", 
                        fontSize: "16px",
                        border: "none"
                    }}
                >
                    {isEditing ? "Cập nhật vendor" : "Thêm vendor"}
                </button>
              </div>

               <button 
                    onClick={() => setShowModal(false)}
                    className="position-absolute top-0 end-0 m-3 btn btn-light rounded-circle p-2 shadow-sm"
                    style={{width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center"}}
                >
                    <X size={18} />
                </button>

            </div>
          </div>
        )}
      </div>
      <style>{`
        .table-bordered { border: 1px solid #dee2e6 !important; }
        .table-bordered th, .table-bordered td { border: 1px solid #dee2e6 !important; }
        .table-hover tbody tr:hover { background-color: rgba(0, 0, 0, 0.04); }
        .hover-bg-gray:hover { background-color: #f3f4f6; }
      `}</style>
    </div>
  );
}