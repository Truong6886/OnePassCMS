import React, { useState } from "react";
import Sidebar from "./Sidebar";
import { useNavigate } from "react-router-dom";

export default function TraCuuHoSo() {
  const [collapsed, setCollapsed] = useState(false);
  const [searchCode, setSearchCode] = useState("");
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const navigate = useNavigate();

  // ✅ Tra cứu hồ sơ
  const handleSearch = async () => {
    if (!searchCode.trim()) return alert("Vui lòng nhập mã hồ sơ!");
    setLoading(true);
    setRecord(null);

    try {
      const res = await fetch("/api/yeucau");
      const result = await res.json();

      if (result.success) {
        const found = result.data.find(
          (item) =>
            item.MaHoSo?.toLowerCase() === searchCode.toLowerCase() &&
            item.TrangThai === "Đang xử lý"
        );

        if (found) setRecord(found);
        else alert("Không tìm thấy hồ sơ hoặc chưa được xử lý!");
      } else alert("Lỗi khi tải dữ liệu!");
    } catch (err) {
      console.error("❌ Lỗi tìm hồ sơ:", err);
      alert("Lỗi khi tìm hồ sơ!");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Upload PDF
  const handleUpload = async () => {
    if (!pdfFile || !record) return alert("Chưa chọn file PDF!");
    try {
      const formData = new FormData();
      formData.append("pdf", pdfFile);

      const res = await fetch(`/api/uploadpdf/${record.YeuCauID}`, {
        method: "POST",
        body: formData,
      });

      const result = await res.json();
      if (result.success) {
        const linkKy = `${window.location.origin}/ky/${record.MaHoSo}`;
        setRecord((prev) => ({
          ...prev,
          PdfUrl: result.url,
          LinkKy: linkKy,
        }));
        alert("Tải file PDF thành công!");
      } else alert("Lỗi khi tải file PDF!");
    } catch (err) {
      console.error("❌ Lỗi upload:", err);
      alert("Không thể upload PDF!");
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar collapsed={collapsed} active="search" />

      <div
        style={{
          marginLeft: collapsed ? "60px" : "250px",
          flex: 1,
          padding: "40px 20px",
          background: "#f9fafb",
          transition: "margin-left 0.3s ease",
        }}
      >
        <h2 style={{ fontSize: "22px", fontWeight: 600, marginBottom: 20 }}>
          Tra Cứu Hồ Sơ
        </h2>

        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <input
            type="text"
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            placeholder="Nhập mã hồ sơ (VD: CT-001)"
            style={{
              flex: 1,
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "6px",
            }}
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            style={{
              background: "#2c4d9e",
              color: "#fff",
              border: "none",
              padding: "10px 20px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            {loading ? "Đang tìm..." : "Tìm hồ sơ"}
          </button>
        </div>

        {record ? (
          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              padding: "20px",
              maxWidth: "700px",
            }}
          >
            <h3 style={{ color: "#2c4d9e", marginBottom: 15 }}>
              Thông tin hồ sơ
            </h3>

            <table style={{ width: "100%" }}>
              <tbody>
                <tr>
                  <td><b>Mã hồ sơ:</b></td>
                  <td>{record.MaHoSo}</td>
                </tr>
                <tr>
                  <td><b>Tên:</b></td>
                  <td>{record.HoTen || record.Ten || "—"}</td>
                </tr>
                <tr>
                  <td><b>Email:</b></td>
                  <td>{record.Email || "—"}</td>
                </tr>
                <tr>
                  <td><b>SĐT:</b></td>
                  <td>{record.SoDienThoai || record.SDT || "—"}</td>
                </tr>
                <tr>
                  <td><b>Trạng thái:</b></td>
                  <td>{record.TrangThai}</td>
                </tr>
              </tbody>
            </table>

            {/* Upload PDF */}
            {record.TrangThai === "Đang xử lý" && (
              <div style={{ marginTop: 20 }}>
                <h4>Tải lên file PDF</h4>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setPdfFile(e.target.files[0])}
                />
                <button
                  onClick={handleUpload}
                  style={{
                    background: "#2c4d9e",
                    color: "#fff",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    marginLeft: "10px",
                    cursor: "pointer",
                  }}
                >
                  Upload PDF
                </button>
              </div>
            )}

            {/* Hiển thị link ký */}
            {record.LinkKy && (
              <div style={{ marginTop: 20 }}>
                <h4>Link ký dành cho khách hàng:</h4>
                <a
                  href={record.LinkKy}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#2563eb", fontWeight: "500" }}
                >
                  {record.LinkKy}
                </a>
              </div>
            )}
          </div>
        ) : (
          <p style={{ color: "#555" }}>
            Nhập mã hồ sơ đã chuyển sang “Đang xử lý” để tra cứu.
          </p>
        )}
      </div>
    </div>
  );
}
