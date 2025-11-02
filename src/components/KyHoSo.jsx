import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import SignatureCanvas from "react-signature-canvas";
import { PDFDocument } from "pdf-lib";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js`;

export default function KyHoSo() {
  const { mahoso } = useParams();
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [showSign, setShowSign] = useState(false);
  const sigRef = useRef(null);

  // ✅ Lấy file PDF khi truy cập link ký
  useEffect(() => {
    const fetchPdf = async () => {
      try {
        const res = await fetch(`/api/getpdf/${mahoso}`);
        const data = await res.json();
        if (data.success && data.url) {
          setPdfUrl(data.url.startsWith("http") ? data.url : `${data.url}`);
        } else {
          setErrorMsg("Không tìm thấy hồ sơ hoặc PDF chưa được tải lên!");
        }
      } catch (err) {
        console.error("❌ Lỗi khi tải PDF:", err);
        setErrorMsg("Không thể kết nối đến máy chủ!");
      } finally {
        setLoading(false);
      }
    };
    fetchPdf();
  }, [mahoso]);

  // ✅ Lưu chữ ký vào PDF
  const handleSave = async () => {
    try {
      const signatureDataUrl = sigRef.current.getTrimmedCanvas().toDataURL("image/png");
      const existingPdfBytes = await fetch(pdfUrl).then((r) => r.arrayBuffer());
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const pages = pdfDoc.getPages();
      const lastPage = pages[pages.length - 1];
      const pngImage = await pdfDoc.embedPng(signatureDataUrl);
      const { width } = lastPage.getSize();

      // 🖊️ Chèn chữ ký góc phải dưới
      lastPage.drawImage(pngImage, {
        x: width - 200,
        y: 80,
        width: 150,
        height: 60,
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const formData = new FormData();
      formData.append("pdf", blob, `${mahoso}_signed.pdf`);

      const res = await fetch(`/api/uploadpdf/${mahoso}`, {
        method: "POST",
        body: formData,
      });

      const result = await res.json();
      if (result.success) {
        alert("✅ Đã ký và lưu file thành công!");
        setShowSign(false);
        setPdfUrl(result.url); // Cập nhật lại bản PDF mới
      } else {
        alert("❌ Lỗi khi lưu file đã ký!");
      }
    } catch (err) {
      console.error("❌ Lỗi khi ký hồ sơ:", err);
      alert("Không thể lưu chữ ký. Vui lòng thử lại!");
    }
  };

  // ✅ Giao diện
  return (
    <div style={{ padding: 20, textAlign: "center" }}>
      <h2 style={{ marginBottom: 20 }}>Ký hồ sơ: {mahoso}</h2>

      {/* Trạng thái tải */}
      {loading && <p>🔄 Đang tải file PDF...</p>}
      {errorMsg && !loading && <p style={{ color: "red" }}>{errorMsg}</p>}

      {/* PDF */}
      {!loading && pdfUrl && (
        <>
          <div
            style={{
              display: "inline-block",
              position: "relative",
              marginBottom: "30px",
            }}
          >
            <Document file={pdfUrl}>
              <Page pageNumber={1} width={600} />
            </Document>

            {/* 🔴 Vùng ký */}
            <div
              onClick={() => setShowSign(true)}
              style={{
                position: "absolute",
                bottom: "80px",
                right: "60px",
                width: "150px",
                height: "60px",
                border: "2px dashed red",
                background: "rgba(255,0,0,0.1)",
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  color: "red",
                  fontWeight: "bold",
                }}
              >
                Ký tại đây
              </span>
            </div>
          </div>
        </>
      )}

      {/* 🖋️ Hộp ký */}
      {showSign && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 20,
              borderRadius: 10,
              boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
              textAlign: "center",
            }}
          >
            <h3 style={{ marginBottom: 10 }}>Ký tên xác nhận hồ sơ</h3>
            <SignatureCanvas
              ref={sigRef}
              penColor="black"
              canvasProps={{
                width: 400,
                height: 150,
                style: { border: "1px solid #000", borderRadius: "6px" },
              }}
            />
            <div style={{ marginTop: 15, display: "flex", gap: "10px", justifyContent: "center" }}>
              <button onClick={() => sigRef.current.clear()}>Xóa</button>
              <button onClick={handleSave}>Lưu chữ ký</button>
              <button onClick={() => setShowSign(false)}>Hủy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
