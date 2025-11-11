import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

export default function KyHoSo() {
  const { mahoso } = useParams();
  const [pdfURL, setPdfURL] = useState(null);
  const [signature, setSignature] = useState(null);
  const [showSignPad, setShowSignPad] = useState(false);
  const [pageCanvases, setPageCanvases] = useState([]);
  const [signedPdfURL, setSignedPdfURL] = useState(null);
  const [isPdfLibReady, setIsPdfLibReady] = useState(false);
  const [loading, setLoading] = useState(true);

  const canvasRef = useRef(null);
  const pdfContainerRef = useRef(null);

  // ✅ vị trí ký trong PDF (đơn vị point)
  const signInfo = { pageIndex: 1, x: 230, y: 395, width: 140, height: 25 };
  const renderScale = 1.2; // PDF hiển thị
  const pdfScaleFactor = 0.75; // 1 point PDF ~ 0.75px

  // ✅ tải thư viện
  useEffect(() => {
    const scriptPdfLib = document.createElement("script");
    scriptPdfLib.src = "https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js";
    scriptPdfLib.onload = () => {
      const scriptPdfJs = document.createElement("script");
      scriptPdfJs.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js";
      scriptPdfJs.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";
        setIsPdfLibReady(true);
      };
      document.body.appendChild(scriptPdfJs);
    };
    document.body.appendChild(scriptPdfLib);
  }, []);

  // ✅ lấy pdf từ server
  useEffect(() => {
    if (!mahoso) return;
    const fetchPDF = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/pdf-chuaky/${mahoso}`);
        const data = await res.json();
        if (data.success && data.data?.PdfUrl) {
          setPdfURL(data.data.PdfUrl);
        }
      } catch (err) {
        console.error("❌ Lỗi tải PDF:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPDF();
  }, [mahoso]);

  // ✅ render PDF ra canvas
  useEffect(() => {
    if (!pdfURL || !isPdfLibReady) return;
    const renderPDF = async () => {
      const pdf = await window.pdfjsLib.getDocument(pdfURL).promise;
      const canvases = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: renderScale });
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, viewport }).promise;
        canvases.push({ id: i, canvas, viewport });
      }
      setPageCanvases(canvases);
    };
    renderPDF();
  }, [pdfURL, isPdfLibReady]);

  // ✅ áp dụng chữ ký vào PDF thực
  const applySignatureToPDF = async (sigDataURL) => {
    const { PDFDocument } = window.PDFLib;
    const bytes = await fetch(pdfURL).then((r) => r.arrayBuffer());
    const pdfDoc = await PDFDocument.load(bytes);
    const pages = pdfDoc.getPages();
    const page = pages[signInfo.pageIndex];
    const { height } = page.getSize();
    const y_pdf = height - signInfo.y - signInfo.height;
    const pngImage = await pdfDoc.embedPng(sigDataURL);
    page.drawImage(pngImage, {
      x: signInfo.x,
      y: y_pdf,
      width: signInfo.width,
      height: signInfo.height,
    });
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    setSignedPdfURL(url);
  };

  // ======================== Xử lý chữ ký ========================
  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    ctx.moveTo(x, y);
    canvas.isDrawing = true;
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.isDrawing) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    ctx.lineTo(x, y);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const handleMouseUp = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataURL = canvas.toDataURL("image/png");
    setSignature(dataURL);
    canvas.isDrawing = false;
    setShowSignPad(false);
    await applySignatureToPDF(dataURL);
  };

  const handleClearSignPad = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.isDrawing = false;
  };

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: 50 }}>
        ⏳ Đang tải tài liệu hồ sơ {mahoso}...
      </div>
    );

  // ======================== Giao diện ========================
  return (
    <div style={{ padding: 20, textAlign: "center", fontFamily: "Arial, sans-serif" }}>
      <h2>✍️ Ký hồ sơ: {mahoso}</h2>

      {!isPdfLibReady && <p>Đang tải thư viện PDF...</p>}

      {pdfURL && (
        <div
          ref={pdfContainerRef}
          style={{
            marginTop: 20,
            maxHeight: 600,
            overflowY: "auto",
            border: "1px solid #ccc",
            background: "#eee",
          }}
        >
          {pageCanvases.map(({ id, canvas }, index) => {
  // 🔹 Tính scale đúng theo PDF.js viewport
  const scaleFactor = canvas.height / canvas.height; // Giữ tỉ lệ
  const pdfToCanvasScale = renderScale * 0.75; // 1pt PDF ≈ 0.75px

  // 🔹 Chuyển đổi toạ độ PDF (gốc dưới) sang canvas (gốc trên)
  const scaled = {
    x: signInfo.x * pdfToCanvasScale,
    y:
      canvas.height -
      (signInfo.y + signInfo.height) * pdfToCanvasScale,
    width: signInfo.width * pdfToCanvasScale,
    height: signInfo.height * pdfToCanvasScale,
  };

  return (
    <div key={id} style={{ position: "relative", marginBottom: 10 }}>
      <canvas
        ref={(el) => {
          if (el && canvas && el.parentNode) {
            el.replaceWith(canvas);
          }
        }}
      />
      {/* 🔹 Vùng ký hiển thị */}
      {index === signInfo.pageIndex && !signature && (
        <div
          onClick={() => setShowSignPad(true)}
          style={{
            position: "absolute",
            left: `${scaled.x}px`,
            top: `${scaled.y}px`,
            width: `${scaled.width}px`,
            height: `${scaled.height}px`,
            background: "rgba(255,255,0,0.3)",
            border: "2px dashed orange",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            color: "#d35400",
          }}
        >
          CLICK ĐỂ KÝ
        </div>
      )}

      {/* 🔹 Hiển thị ảnh chữ ký */}
      {signature && index === signInfo.pageIndex && (
        <img
          src={signature}
          alt="signature"
          style={{
            position: "absolute",
            left: `${scaled.x}px`,
            top: `${scaled.y}px`,
            width: `${scaled.width}px`,
            height: `${scaled.height}px`,
            opacity: 0.9,
          }}
        />
      )}
    </div>
  );
})}

        </div>
      )}

      {/* Ký tên */}
      {showSignPad && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => setShowSignPad(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              padding: 20,
              borderRadius: 12,
              textAlign: "center",
            }}
          >
            <h3>Ký tên của bạn:</h3>
            <canvas
              ref={canvasRef}
              width={400}
              height={150}
              style={{
                border: "2px solid #333",
                background: "#fdfdfd",
                cursor: "crosshair",
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleMouseDown}
              onTouchMove={handleMouseMove}
              onTouchEnd={handleMouseUp}
            />
            <div style={{ marginTop: 10 }}>
              <button onClick={handleClearSignPad}>Xóa</button>
              <button
                onClick={handleMouseUp}
                style={{ marginLeft: 10, background: "#2c4d9e", color: "#fff" }}
              >
                Lưu chữ ký
              </button>
            </div>
          </div>
        </div>
      )}

      {signature && signedPdfURL && (
        <div style={{ marginTop: 20 }}>
          <h3>✅ Đã ký xong!</h3>
          <a
            href={signedPdfURL}
            download={`${mahoso}_da_ky.pdf`}
            style={{
              display: "inline-block",
              background: "#2c4d9e",
              color: "#fff",
              padding: "10px 20px",
              borderRadius: 6,
              textDecoration: "none",
            }}
          >
            📥 Tải PDF đã ký
          </a>
        </div>
      )}
    </div>
  );
}
