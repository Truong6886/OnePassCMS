import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useNavigate } from "react-router-dom";

export default function TraCuuHoSo() {
  const [searchCode, setSearchCode] = useState("");
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState("vi");
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
  }, []);

  const showToast = (message, type = "info") => {
    const colors = {
      success: "#4caf50",
      error: "#f44336",
      warning: "#ff9800",
      info: "#2196f3",
    };
    const toast = document.createElement("div");
    toast.textContent = message;
    toast.style.position = "fixed";
    toast.style.bottom = "20px";
    toast.style.right = "20px";
    toast.style.padding = "12px 20px";
    toast.style.background = colors[type];
    toast.style.color = "#fff";
    toast.style.borderRadius = "8px";
    toast.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
    toast.style.zIndex = "9999";
    toast.style.fontSize = "14px";
    toast.style.transition = "opacity 0.5s ease";
    document.body.appendChild(toast);
    setTimeout(() => (toast.style.opacity = "0"), 2500);
    setTimeout(() => toast.remove(), 3000);
  };

  const t = (vi, en) => (currentLanguage === "vi" ? vi : en);

  // ✅ Tra cứu hồ sơ
  const handleSearch = async () => {
    if (!searchCode.trim())
      return showToast(
        t("Vui lòng nhập mã hồ sơ!", "Please enter the case code!"),
        "warning"
      );

    setLoading(true);
    setRecord(null);

    try {
      const res = await fetch("http://localhost:5000/api/yeucau");
      const result = await res.json();

      if (result.success) {
        const found = result.data.find(
          (item) =>
            item.MaHoSo?.toLowerCase?.() === searchCode.toLowerCase() ||
            item.YeuCauID?.toString() === searchCode
        );

        if (found) {
          const pdfRes = await fetch(
            `http://localhost:5000/api/pdf-chuaky/${found.MaHoSo}`
          );
          const pdfResult = await pdfRes.json();

          if (pdfResult.success && pdfResult.data?.PdfUrl) {
            found.PdfChuaKy = pdfResult.data.PdfUrl;
            found.LinkKy = `${window.location.origin}/kyhoso/${found.MaHoSo}`;
          }
          setRecord(found);
        } else showToast(t("Không tìm thấy hồ sơ!", "Case not found!"), "error");
      }
    } catch (err) {
      console.error(err);
      showToast(t("Lỗi khi tìm hồ sơ!", "Error searching case!"), "error");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Upload PDF (và thêm 2 vùng ký)
  const handleUpload = async () => {
    if (!pdfFile || !record)
      return showToast(
        t("Vui lòng chọn file PDF!", "Please choose a PDF file!"),
        "warning"
      );

    try {
      // 1️⃣ Upload PDF
      const formData = new FormData();
      formData.append("pdf", pdfFile);
      formData.append("MaHoSo", record.MaHoSo);

      const res = await fetch("http://localhost:5000/api/upload-pdf", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.message);

      // 2️⃣ Tạo vùng ký PDF
      const addRes = await fetch("http://localhost:5000/api/add-signature-field", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfUrl: result.url, mahoso: record.MaHoSo }),
      });
      const addJson = await addRes.json();
      if (!addJson.success) throw new Error(addJson.message);

      // 3️⃣ Lưu kết quả
      const linkKy = `${window.location.origin}/kyhoso/${record.MaHoSo}`;
      setRecord((prev) => ({
        ...prev,
        PdfChuaKy: addJson.pdfUrl,
        LinkKy: linkKy,
      }));

      showToast(
        t(
          "✅ Đã upload PDF và tạo 2 vùng ký cho khách hàng!",
          "✅ PDF uploaded and 2 signature zones created!"
        ),
        "success"
      );
    } catch (err) {
      console.error("❌ Upload lỗi:", err);
      showToast(err.message || "Lỗi upload!", "error");
    }
  };

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
          <h2>{t("Tra Cứu Hồ Sơ", "Record ID Lookup")}</h2>

          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            <input
              type="text"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder={t(
                "Nhập mã hồ sơ (VD: CT-001)",
                "Enter Record ID (e.g. CT-001)"
              )}
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
              {loading ? t("Đang tìm...", "Searching...") : t("Tìm hồ sơ", "Search")}
            </button>
          </div>

          {record && (
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
                {t("Thông tin hồ sơ", "Case Information")}
              </h3>

              <table style={{ width: "100%" }}>
                <tbody>
                  <tr><td><b>{t("Mã hồ sơ:", "Case Code:")}</b></td><td>{record.MaHoSo}</td></tr>
                  <tr><td><b>{t("Tên:", "Name:")}</b></td><td>{record.HoTen || "—"}</td></tr>
                  <tr><td><b>{t("Email:", "Email:")}</b></td><td>{record.Email || "—"}</td></tr>
                  <tr><td><b>{t("SĐT:", "Phone:")}</b></td><td>{record.SoDienThoai || "—"}</td></tr>
                </tbody>
              </table>

              <div style={{ marginTop: 20 }}>
                <h4>📎 {t("Upload file PDF đã điền sẵn", "Upload pre-filled PDF file")}</h4>
                <input type="file" accept="application/pdf" onChange={(e) => setPdfFile(e.target.files[0])} />
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
                  {t("Upload PDF", "Upload PDF")}
                </button>
              </div>

              {record?.PdfChuaKy && record?.LinkKy && !loading && (
                <div style={{ marginTop: 20 }}>
                  <h4>🔗 {t("Link ký khách hàng:", "Customer signing link:")}</h4>
                  <a href={record.LinkKy} target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb" }}>
                    {record.LinkKy}
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
