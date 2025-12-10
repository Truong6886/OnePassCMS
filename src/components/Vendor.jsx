import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { showToast } from "../utils/toast"; 
import { authenticatedFetch } from "../utils/api";
import { Plus, Edit, Trash2, X, Save } from "lucide-react";
import Swal from "sweetalert2";

export default function Vendor() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem("currentUser")) || null);
  const [currentLanguage, setCurrentLanguage] = useState(localStorage.getItem("language") || "vi");

  // State cho Modal
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
 const [formData, setFormData] = useState({
    id: null,
    TenVendor: "",
    SoDKKD: "",
    DiaChi: "",
    DauMoi: "",
    MaVung: "+84",
    SoDienThoai: "",
    Email: "",
    Service: "",
    GhiChu: ""
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const res = await authenticatedFetch("https://onepasscms-backend.onrender.com/api/vendors");
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
      id: null, TenVendor: "", SoDKKD: "", DiaChi: "", DauMoi: "",
      MaVung: "", SoDienThoai: "", Email: "", Service: "", GhiChu: ""
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const openEditModal = (vendor) => {
    setFormData(vendor);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.name) return showToast("Tên Vendor là bắt buộc", "warning");

    try {
      const url = isEditing 
        ? `https://onepasscms-backend.onrender.com/api/vendors/${formData.id}`
        : "https://onepasscms-backend.onrender.com/api/vendors";
      
      const method = isEditing ? "PUT" : "POST";

      const res = await authenticatedFetch(url, {
        method,
        body: JSON.stringify(formData)
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
        const res = await authenticatedFetch(`https://onepasscms-backend.onrender.com/api/vendors/${id}`, {
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

        <div className="container-fluid mt-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="fw-bold text-primary">Quản lý Vendor</h4>
            <button className="btn btn-primary d-flex align-items-center gap-2" onClick={openAddModal}>
              <Plus size={18} /> Thêm Vendor
            </button>
          </div>

          <div className="table-responsive shadow-sm rounded">
            <table className="table table-bordered mb-0 align-middle" style={{ fontSize: "13px" }}>
              <thead className="text-white text-center" style={{ backgroundColor: "#2e4a87" }}>
                <tr>
                  <th style={{width: '40px'}}>STT</th>
                  <th>Tên vendor</th>
                  <th>Số ĐKKD</th>
                  <th>Địa chỉ</th>
                  <th>Đầu mối</th>
                  <th style={{width: '60px'}}>Mã vùng</th>
                  <th>Số điện thoại</th>
                  <th>Email</th>
                  <th>Dịch vụ cung cấp</th>
                  <th>Ngày đăng ký</th>
                  <th>Ghi chú về vendor</th>
                  <th style={{width: '100px'}}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                    {vendors.length > 0 ? (
                        vendors.map((item, index) => (
                        <tr key={item.id} className="bg-white hover:bg-light">
                            <td className="text-center">{index + 1}</td>
                            <td className="fw-semibold">{item.TenVendor}</td> 
                            <td className="text-center">{item.SoDKKD}</td>  
                            <td>{item.DiaChi}</td>                           
                            <td>{item.DauMoi}</td>                           
                            <td className="text-center">{item.MaVung}</td>   
                            <td>{item.SoDienThoai}</td>                    
                            <td>{item.Email}</td>                           
                            <td>{item.Service}</td>                          
                            <td className="text-center">{item.created_at?.split("T")[0]}</td>
                            <td>{item.GhiChu}</td>                           
                            <td className="text-center">
                                {/* ... (phần nút bấm giữ nguyên) */}
                            </td>
                        </tr>
                        ))
                    ) : (
                        <tr>
                    <td colSpan="12" className="text-center py-4 text-muted">Chưa có dữ liệu vendor</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-muted small">
             Hiển thị {vendors.length} vendor
          </div>
        </div>

        {/* Modal Thêm/Sửa */}
        {showModal && (
          <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" 
               style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
            <div className="bg-white p-4 rounded shadow-lg" style={{ width: "700px", maxHeight: "90vh", overflowY: "auto" }}>
              <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
                <h5 className="mb-0 fw-bold">{isEditing ? "Cập nhật Vendor" : "Thêm Vendor mới"}</h5>
                <button className="btn btn-sm btn-light rounded-circle" onClick={() => setShowModal(false)}>
                    <X size={20} />
                </button>
              </div>

              <div className="row g-3">
                    <div className="col-md-8">
                    <label className="form-label fw-bold small">Tên Vendor <span className="text-danger">*</span></label>
                    <input type="text" className="form-control form-control-sm" name="TenVendor" value={formData.TenVendor} onChange={handleInputChange} />
                    </div>
                    <div className="col-md-4">
                    <label className="form-label fw-bold small">Số ĐKKD</label>
                    <input type="text" className="form-control form-control-sm" name="SoDKKD" value={formData.SoDKKD} onChange={handleInputChange} />
                    </div>
                    
                    <div className="col-md-6">
                    <label className="form-label fw-bold small">Người đầu mối</label>
                    <input type="text" className="form-control form-control-sm" name="DauMoi" value={formData.DauMoi} onChange={handleInputChange} />
                    </div>
                    <div className="col-md-6">
                    <label className="form-label fw-bold small">Email</label>
                    <input type="email" className="form-control form-control-sm" name="Email" value={formData.Email} onChange={handleInputChange} />
                    </div>

                    <div className="col-md-3">
                        <label className="form-label fw-bold small">Mã vùng</label>
                        <select className="form-select form-select-sm" name="MaVung" value={formData.MaVung} onChange={handleInputChange}>
                            <option value="+84">+84 (VN)</option>
                            <option value="+82">+82 (KR)</option>
                        </select>
                    </div>
                    <div className="col-md-9">
                    <label className="form-label fw-bold small">Số điện thoại</label>
                    <input type="text" className="form-control form-control-sm" name="SoDienThoai" value={formData.SoDienThoai} onChange={handleInputChange} />
                    </div>

                    <div className="col-12">
                    <label className="form-label fw-bold small">Địa chỉ</label>
                    <input type="text" className="form-control form-control-sm" name="DiaChi" value={formData.DiaChi} onChange={handleInputChange} />
                    </div>

                    <div className="col-12">
                    <label className="form-label fw-bold small">Dịch vụ cung cấp</label>
                    <textarea className="form-control form-control-sm" rows="2" name="Service" value={formData.Service} onChange={handleInputChange} placeholder="VD: Dịch thuật, công chứng..."></textarea>
                    </div>

                    <div className="col-12">
                    <label className="form-label fw-bold small">Ghi chú</label>
                    <textarea className="form-control form-control-sm" rows="2" name="GhiChu" value={formData.GhiChu} onChange={handleInputChange}></textarea>
                    </div>
                </div>
              <div className="mt-4 text-end">
                <button className="btn btn-secondary btn-sm me-2" onClick={() => setShowModal(false)}>Đóng</button>
                <button className="btn btn-primary btn-sm d-inline-flex align-items-center gap-1" onClick={handleSubmit}>
                    <Save size={16}/> Lưu thông tin
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}