import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { Viewer, Worker, SpecialZoomLevel } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import SignatureCanvas from "react-signature-canvas";
import { Button, Modal } from "react-bootstrap";

// Import styles
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

export default function KyHoSo() {
  const { mahoso } = useParams();
  const [pdfUrl, setPdfUrl] = useState("");
  const [signatureAreas, setSignatureAreas] = useState([]);
  const [signingArea, setSigningArea] = useState(null);
  const [showSignModal, setShowSignModal] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const [containerRef, setContainerRef] = useState(null);
  const sigCanvas = useRef();
  
  // Tạo plugin với layout mặc định
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  useEffect(() => {
    console.log("🔍 Mã hồ sơ từ URL:", mahoso);
    if (!mahoso) return;

    const fetchData = async () => {
      try {
        setPdfLoading(true);
        setPdfError("");

        // Lấy URL PDF
        const pdfRes = await fetch(`http://localhost:5000/api/pdf-chuaky/${mahoso}`);
        const pdfJson = await pdfRes.json();
        
        if (pdfJson.success && pdfJson.data?.PdfUrl) {
          console.log("📄 PDF URL:", pdfJson.data.PdfUrl);
          setPdfUrl(pdfJson.data.PdfUrl);
        } else {
          setPdfError("Không tìm thấy PDF cho hồ sơ này");
        }

        // Lấy thông tin vùng ký
        const areaRes = await fetch(`http://localhost:5000/api/signature-area/${mahoso}`);
        const areaJson = await areaRes.json();
        if (areaJson.success && Array.isArray(areaJson.data)) {
          console.log("📍 Vùng ký:", areaJson.data);
          setSignatureAreas(areaJson.data);
        } else {
          console.warn("⚠️ Không có vùng ký nào cho hồ sơ này");
        }
      } catch (err) {
        console.error("❌ Lỗi khi tải PDF hoặc vùng ký:", err);
        setPdfError("Lỗi khi tải dữ liệu: " + err.message);
      } finally {
        setPdfLoading(false);
      }
    };

    fetchData();
  }, [mahoso]);

  const handleSign = async () => {
    if (!sigCanvas.current || !pdfUrl || !signingArea) {
      alert("Vui lòng vẽ chữ ký trước khi lưu");
      return;
    }

    if (sigCanvas.current.isEmpty()) {
      alert("Vui lòng vẽ chữ ký trước khi lưu");
      return;
    }

    const signatureData = sigCanvas.current.toDataURL("image/png");

    try {
      const res = await fetch("http://localhost:5000/api/sign-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdfUrl,
          signatureData,
          MaHoSo: mahoso,
          areaId: signingArea.id,
        }),
      });

      const json = await res.json();
      if (json.success) {
        alert("✅ Ký thành công!");
        window.open(json.pdfUrl, "_blank");
        setShowSignModal(false);
        sigCanvas.current.clear();
        
        // Cập nhật lại danh sách vùng ký sau khi ký thành công
        const areaRes = await fetch(`http://localhost:5000/api/signature-area/${mahoso}`);
        const areaJson = await areaRes.json();
        if (areaJson.success && Array.isArray(areaJson.data)) {
          setSignatureAreas(areaJson.data);
        }
      } else {
        alert("❌ Lỗi ký: " + json.message);
      }
    } catch (err) {
      console.error("❌ Lỗi gửi chữ ký:", err);
      alert("Lỗi khi gửi chữ ký: " + err.message);
    }
  };

  const clearSignature = () => {
    sigCanvas.current?.clear();
  };

  return (
    <div
      style={{
        background: "#f9fafb",
        minHeight: "100vh",
        padding: "30px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <h4 className="fw-bold mb-3 text-primary">
        ✍️ Ký hồ sơ khách hàng #{mahoso}
      </h4>

      {pdfLoading && (
        <div className="text-center p-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
          <p className="mt-2">Đang tải PDF...</p>
        </div>
      )}

      {pdfError && (
        <div className="alert alert-danger" role="alert">
          {pdfError}
        </div>
      )}

      {!pdfLoading && pdfUrl && (
        <div
          style={{
            border: "1px solid #ccc",
            borderRadius: "8px",
            background: "#fff",
            position: "relative",
            width: "100%",
            maxWidth: "900px",
            height: "80vh",
            overflow: "hidden",
          }}
        >
          {/* PDF Viewer */}
          <div
            ref={setContainerRef}
            style={{
              position: 'relative',
              height: '100%',
              width: '100%',
            }}
          >
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
              <Viewer
                fileUrl={pdfUrl}
                plugins={[defaultLayoutPluginInstance]}
                defaultScale={SpecialZoomLevel.PageWidth}
              />
            </Worker>

            {/* Overlay cho vùng ký - CHỈ HIỂN THỊ VÙNG KÝ KHÁCH HÀNG */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 1000,
              }}
            >
              {signatureAreas.map((area) => (
                <div
                  key={area.id}
                  style={{
                    position: "absolute",
                    left: `${area.x}px`,
                    bottom: `${area.y}px`,
                    width: `${area.width}px`,
                    height: `${area.height}px`,
                    background: "rgba(255, 255, 0, 0.4)",
                    border: "2px dashed #ff0000",
                    borderRadius: "4px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                    color: "#d63384",
                    fontSize: "12px",
                    userSelect: "none",
                    transition: "all 0.3s ease",
                    pointerEvents: 'auto',
                    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = "rgba(255, 255, 0, 0.7)";
                    e.target.style.border = "2px solid #ff0000";
                    e.target.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
                    e.target.style.transform = "scale(1.02)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "rgba(255, 255, 0, 0.4)";
                    e.target.style.border = "2px dashed #ff0000";
                    e.target.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
                    e.target.style.transform = "scale(1)";
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSigningArea(area);
                    setShowSignModal(true);
                    console.log("🎯 Click vào vùng ký:", area);
                  }}
                  title={`Click để ký vào vùng: ${area.label}`}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div>✍️</div>
                    <div style={{ fontSize: '10px', marginTop: '2px' }}>
                      {area.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Thông báo nếu không có vùng ký */}
      {!pdfLoading && pdfUrl && signatureAreas.length === 0 && (
        <div className="alert alert-warning mt-3" role="alert">
          ⚠️ PDF này chưa có vùng ký được định nghĩa. Vui lòng liên hệ quản trị viên.
        </div>
      )}

      {/* Modal ký tên */}
      <Modal show={showSignModal} onHide={() => setShowSignModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            ✍️ Ký vùng: <span className="text-primary">{signingArea?.label}</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <p className="text-muted mb-1">Vẽ chữ ký của bạn vào khung bên dưới:</p>
            <small className="text-muted">Kéo chuột để vẽ chữ ký</small>
          </div>
          
          <SignatureCanvas
            ref={sigCanvas}
            penColor="black"
            canvasProps={{
              width: 600,
              height: 200,
              className: "signatureCanvas border border-secondary rounded w-100",
              style: { 
                background: "#f8f9fa",
                cursor: "crosshair"
              }
            }}
          />
          
          <div className="d-flex justify-content-between mt-3">
            <Button variant="outline-danger" onClick={clearSignature}>
              🗑️ Xóa chữ ký
            </Button>
            <div>
              <Button variant="outline-secondary" onClick={() => setShowSignModal(false)} className="me-2">
                Hủy
              </Button>
              <Button variant="success" onClick={handleSign}>
                💾 Lưu chữ ký
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}
