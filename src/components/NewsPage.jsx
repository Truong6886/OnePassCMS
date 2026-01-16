import React, { useEffect, useMemo, useState } from "react";
import { Plus, Edit3, Trash2, Search, X, Image as ImageIcon, CalendarClock, ChevronUp, ChevronDown, Type, Quote, Video, GripVertical, Languages, Bold, Italic, Link as LinkIcon, List, Heading1, Heading2 } from "lucide-react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import NotificationPanel from "./CMSDashboard/NotificationPanel";
import { authenticatedFetch } from "../utils/api";
import "../styles/NewsPage.css";

const emptyForm = {
  id: null,
  TieuDeVN: "",
  TieuDeKR: "",
  DanhMuc: "",
  TacGia: "",
  NgayXuatBan: "",
  UrlHinhAnh: "",
  NoiDungVN: "",
  NoiDungKR: "",
  blocks: [] // Mảng chứa các blocks content (text, image)
};

function NewsPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState(localStorage.getItem("language") || "vi");
  const [showNotification, setShowNotification] = useState(false);
  const [hasNewRequest, setHasNewRequest] = useState(false);
  const [news, setNews] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [toastMessage, setToastMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [draggingBlockId, setDraggingBlockId] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);
  const [translateLoading, setTranslateLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingBlockId, setUploadingBlockId] = useState(null);
  const [activeTextTarget, setActiveTextTarget] = useState({ blockId: null, lang: null });
  const textRefs = React.useRef({});

  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Error parsing user:", e);
      }
    }
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(
        "https://onepasscms-backend-tvdy.onrender.com/api/tintuc",
        { method: "GET" }
      );
      if (!response) {
        setNews([]);
        return;
      }
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setNews(result.data);
      } else {
        setNews([]);
      }
    } catch (err) {
      console.error("❌ Lỗi lấy tin tức:", err);
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredNews = useMemo(() => {
    return news.filter((item) => {
      const matchSearch = [item.TieuDeVN, item.DanhMuc, item.NoiDungVN]
        .join(" ")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchCategory = statusFilter === "all" || item.DanhMuc === statusFilter;
      return matchSearch && matchCategory;
    });
  }, [news, searchTerm, statusFilter]);

  const handleToggleSidebar = () => setShowSidebar((prev) => !prev);

  const handleOpenModal = (record) => {
    if (record) {
      // Parse blocks từ NoiDungVN nếu có, nếu không thì tạo block text từ nội dung cũ
      let blocks = [];
      let urlHinhAnh = record.UrlHinhAnh || "";
      try {
        blocks = JSON.parse(record.NoiDungVN || '[]');
        if (!Array.isArray(blocks) || blocks.length === 0) {
          // Nếu không có blocks, tạo block text từ nội dung cũ
          blocks = [{
            id: Date.now(),
            type: 'text',
            contentVN: record.NoiDungVN || '',
            contentKR: record.NoiDungKR || '',
            imageUrl: null,
            quoteAuthor: '',
            videoUrl: '',
            codeLanguage: 'javascript',
            codeContent: ''
          }];
        } else {
          // Đã có blocks hợp lệ, KHÔNG tự động thêm block image từ UrlHinhAnh
          blocks = blocks.map((b, idx) => ({
            id: b.id || Date.now() + idx,
            type: b.type || 'text',
            contentVN: b.contentVN || '',
            contentKR: b.contentKR || '',
            imageUrl: b.imageUrl || '',
            quoteAuthor: b.quoteAuthor || '',
            videoUrl: b.videoUrl || '',
            codeLanguage: b.codeLanguage || 'javascript',
            codeContent: b.codeContent || ''
          }));
        }
        // Nếu có block image trùng với UrlHinhAnh thì loại bỏ khỏi blocks
        if (urlHinhAnh) {
          blocks = blocks.filter(b => !(b.type === 'image' && b.imageUrl === urlHinhAnh));
        }
      } catch (e) {
        // Nếu parse lỗi, tạo block mặc định
        blocks = [{
          id: Date.now(),
          type: 'text',
          contentVN: record.NoiDungVN || '',
          contentKR: record.NoiDungKR || '',
          imageUrl: null,
          quoteAuthor: '',
          videoUrl: '',
          codeLanguage: 'javascript',
          codeContent: ''
        }];
      }

      setForm({
        id: record.ID,
        TieuDeVN: record.TieuDeVN || "",
        TieuDeKR: record.TieuDeKR || "",
        DanhMuc: record.DanhMuc || "",
        TacGia: record.TacGia || "",
        NgayXuatBan: record.NgayXuatBan ? record.NgayXuatBan.split("T")[0] : "",
        UrlHinhAnh: urlHinhAnh,
        NoiDungVN: record.NoiDungVN || "",
        NoiDungKR: record.NoiDungKR || "",
        blocks
      });
    } else {
      setForm({ ...emptyForm, blocks: [] });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setForm(emptyForm);
    setTranslateLoading(false);
    setModalOpen(false);
  };

  // === BLOCK MANAGEMENT ===
  const addBlock = (type) => {
    const newBlock = {
      id: Date.now(),
      type, // 'text', 'image', 'quote', 'video', 'code'
      contentVN: '',
      contentKR: '',
      imageUrl: type === 'image' ? '' : '',
      quoteAuthor: '',
      videoUrl: '',
      codeLanguage: 'javascript',
      codeContent: ''
    };
    setForm(prev => ({ ...prev, blocks: [...prev.blocks, newBlock] }));
  };

  const updateBlock = (blockId, field, value) => {
    setForm(prev => ({
      ...prev,
      blocks: prev.blocks.map(block =>
        block.id === blockId ? { ...block, [field]: value } : block
      )
    }));
  };

  const moveBlock = (blockId, direction) => {
    setForm(prev => {
      const blocks = [...prev.blocks];
      const index = blocks.findIndex(b => b.id === blockId);
      if (index === -1) return prev;
      
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= blocks.length) return prev;
      
      [blocks[index], blocks[newIndex]] = [blocks[newIndex], blocks[index]];
      return { ...prev, blocks };
    });
  };

  const removeBlock = (blockId) => {
    setForm(prev => ({
      ...prev,
      blocks: prev.blocks.filter(block => block.id !== blockId)
    }));
  };

  const applyTagWrap = (blockId, lang, before, after) => {
    const key = `${blockId}-${lang}`;
    const textarea = textRefs.current[key];
    if (!textarea) return;
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const field = lang === 'VN' ? 'contentVN' : 'contentKR';
    const current = form.blocks.find(b => b.id === blockId)?.[field] || '';
    const selected = current.slice(start, end);
    const newText = current.slice(0, start) + before + selected + after + current.slice(end);
    updateBlock(blockId, field, newText);
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + before.length;
      textarea.selectionEnd = end + before.length;
    }, 0);
  };

  const applyHeading = (blockId, lang, level = 1) => {
    applyTagWrap(blockId, lang, `<h${level}>`, `</h${level}>`);
  };

  const applyBold = (blockId, lang) => applyTagWrap(blockId, lang, '<strong>', '</strong>');
  const applyItalic = (blockId, lang) => applyTagWrap(blockId, lang, '<em>', '</em>');
  const applyLink = (blockId, lang) => {
    const url = prompt('Nhập URL liên kết');
    if (!url) return;
    applyTagWrap(blockId, lang, `<a href="${url}" target="_blank">`, '</a>');
  };
  const applyList = (blockId, lang) => {
    const key = `${blockId}-${lang}`;
    const textarea = textRefs.current[key];
    if (!textarea) return;
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const field = lang === 'VN' ? 'contentVN' : 'contentKR';
    const current = form.blocks.find(b => b.id === blockId)?.[field] || '';
    const selected = current.slice(start, end) || 'Mục 1\nMục 2';
    const items = selected.split(/\r?\n/).filter(Boolean).map(li => `<li>${li}</li>`).join('');
    const newText = current.slice(0, start) + `<ul>${items}</ul>` + current.slice(end);
    updateBlock(blockId, field, newText);
    setTimeout(() => textarea.focus(), 0);
  };

  const translateText = async (text) => {
    if (!text || !text.trim()) return "";
    try {
      const response = await authenticatedFetch("https://onepasscms-backend-tvdy.onrender.com/api/translate", {
        method: "POST",
        body: JSON.stringify({ text, sourceLang: "vi", targetLang: "ko" })
      });
      if (!response) return "";
      const result = await response.json();
      return result?.translatedText || "";
    } catch (err) {
      console.error("❌ Lỗi dịch block:", err);
      return "";
    }
  };

  const uploadNewsImage = async (file, blockId = null) => {
    if (!file) return null;

    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("sessionToken");
    const savedUser = localStorage.getItem("currentUser");
    let parsedUser = null;
    try {
      parsedUser = savedUser ? JSON.parse(savedUser) : null;
    } catch (err) {
      console.warn("Không parse được currentUser từ localStorage", err);
    }

    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (parsedUser?.id) headers["x-user-id"] = parsedUser.id;

    try {
      if (blockId) {
        setUploadingBlockId(blockId);
      } else {
        setUploadingImage(true);
      }

      const response = await fetch("https://onepasscms-backend-tvdy.onrender.com/api/upload-news-image", {
        method: "POST",
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "Upload thất bại");
      }

      const result = await response.json();
      if (!result?.success || !result.url) {
        throw new Error(result?.message || "Upload thất bại");
      }

      if (blockId) {
        updateBlock(blockId, "imageUrl", result.url);
      } else {
        setForm((prev) => ({ ...prev, UrlHinhAnh: result.url }));
      }

      setToastMessage("Upload hình ảnh thành công");
      return result.url;
    } catch (err) {
      console.error("❌ Lỗi upload ảnh:", err);
      setToastMessage(err.message || "Upload thất bại");
      return null;
    } finally {
      setUploadingImage(false);
      setUploadingBlockId(null);
    }
  };

  const handleTranslateAll = async () => {
    if (form.blocks.length === 0) {
      setToastMessage("Chưa có block để dịch");
      return;
    }

    try {
      setTranslateLoading(true);

      // Translate title if Korean title is empty
      let translatedTitle = form.TieuDeKR;
      if (!translatedTitle?.trim() && form.TieuDeVN?.trim()) {
        translatedTitle = await translateText(form.TieuDeVN.trim());
      }

      const textLike = ['text', 'quote', 'video'];
      const translatedBlocks = await Promise.all(
        form.blocks.map(async (block, idx) => {
          if (!textLike.includes(block.type)) return block;
          if (!block.contentVN?.trim()) return block;
          // Only translate if KR is empty
          if (block.contentKR?.trim()) return block;
          const translated = await translateText(block.contentVN.trim());
          return { ...block, contentKR: translated || block.contentKR };
        })
      );

      setForm(prev => ({
        ...prev,
        TieuDeKR: translatedTitle || prev.TieuDeKR,
        blocks: translatedBlocks
      }));

      setToastMessage("Đã dịch sang tiếng Hàn cho các block trống");
    } catch (err) {
      console.error("❌ Lỗi dịch tất cả:", err);
      setToastMessage("Dịch thất bại. Vui lòng thử lại");
    } finally {
      setTranslateLoading(false);
    }
  };

  const handleDragStart = (blockId) => {
    setDraggingBlockId(blockId);
  };

  const handleDragOver = (e, targetId) => {
    e.preventDefault();
    if (draggingBlockId === targetId) return;
    setDropTargetId(targetId);
  };

  const handleDrop = (targetId) => {
    setForm(prev => {
      if (!draggingBlockId || draggingBlockId === targetId) return prev;
      const blocks = [...prev.blocks];
      const fromIndex = blocks.findIndex(b => b.id === draggingBlockId);
      const toIndex = blocks.findIndex(b => b.id === targetId);
      if (fromIndex === -1 || toIndex === -1) return prev;
      const [moved] = blocks.splice(fromIndex, 1);
      blocks.splice(toIndex, 0, moved);
      return { ...prev, blocks };
    });
    setDraggingBlockId(null);
    setDropTargetId(null);
  };

  const handleDragEnd = () => {
    setDraggingBlockId(null);
    setDropTargetId(null);
  };

  const handleSave = async () => {
    if (!form.TieuDeVN.trim()) {
      setToastMessage("Vui lòng nhập tiêu đề Việt");
      return;
    }
    if (!form.TieuDeKR.trim()) {
      setToastMessage("Vui lòng nhập tiêu đề Hàn");
      return;
    }
    if (form.blocks.length === 0) {
      setToastMessage("Vui lòng thêm ít nhất 1 block nội dung");
      return;
    }
    
    // Serialize blocks to JSON for NoiDungVN/NoiDungKR
    const blocksJSON = JSON.stringify(form.blocks);

    // For backward compatibility, also create a text summary
    const textLike = ['text', 'quote', 'video'];
    const textSummaryVN = form.blocks
      .filter(b => textLike.includes(b.type))
      .map(b => b.contentVN)
      .join('\n\n');
    const textSummaryKR = form.blocks
      .filter(b => textLike.includes(b.type))
      .map(b => b.contentKR)
      .join('\n\n');

    // Không tự động lấy ảnh đầu tiên trong blocks làm ảnh đại diện
    // Chỉ lấy UrlHinhAnh từ input riêng

    if (!textSummaryVN.trim()) {
      setToastMessage("Vui lòng nhập nội dung Việt trong ít nhất 1 text block");
      return;
    }
    if (!textSummaryKR.trim()) {
      setToastMessage("Vui lòng nhập nội dung Hàn trong ít nhất 1 text block");
      return;
    }

    const isEdit = Boolean(form.id);
    const payload = {
      TieuDeVN: form.TieuDeVN,
      TieuDeKR: form.TieuDeKR,
      DanhMuc: form.DanhMuc,
      TacGia: form.TacGia || currentUser?.name || "One Pass",
      NgayXuatBan: form.NgayXuatBan,
      UrlHinhAnh: form.UrlHinhAnh || '',
      NoiDungVN: blocksJSON,
      NoiDungKR: textSummaryKR, // Lưu text summary cho compatibility
    };

    try {
      setLoading(true);
      const url = isEdit
        ? `https://onepasscms-backend-tvdy.onrender.com/api/tintuc/${form.id}`
        : "https://onepasscms-backend-tvdy.onrender.com/api/tintuc";
      const method = isEdit ? "PUT" : "POST";

      console.log("📝 Gửi request:", { method, url, payload, formId: form.id, isEdit });

      const response = await authenticatedFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      if (!response) {
        console.error("❌ Không nhận được response từ server");
        setToastMessage("Lỗi kết nối server");
        return;
      }

      console.log("📊 Response status:", response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Server error:", errorData);
        setToastMessage(errorData.message || `Lỗi ${response.status}: ${response.statusText}`);
        return;
      }

      const result = await response.json();
      console.log("📥 Response từ server:", result);

      if (result.success) {
        setToastMessage(isEdit ? "Đã cập nhật tin" : "Đã thêm tin mới");
        setTimeout(() => setToastMessage(null), 2000);
        handleCloseModal();
        fetchNews();
      } else {
        setToastMessage(result.message || "Lỗi lưu tin");
      }
    } catch (err) {
      console.error("❌ Lỗi lưu tin:", err);
      setToastMessage("Lỗi kết nối server: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;

    try {
      setLoading(true);
      const response = await authenticatedFetch(
        `https://onepasscms-backend-tvdy.onrender.com/api/tintuc/${confirmDeleteId}`,
        { method: "DELETE" }
      );

      if (!response) {
        setToastMessage("Lỗi kết nối server");
        return;
      }

      const result = await response.json();
      if (result.success) {
        setToastMessage("Đã xóa tin tức");
        setTimeout(() => setToastMessage(null), 2000);
        setConfirmDeleteId(null);
        fetchNews();
      } else {
        setToastMessage(result.message || "Lỗi xóa tin");
      }
    } catch (err) {
      console.error("❌ Lỗi xóa tin:", err);
      setToastMessage("Lỗi kết nối server");
    } finally {
      setLoading(false);
    }
  };

  const badgeColor = (status) => {
    if (status === "published") return "success";
    if (status === "scheduled") return "info";
    return "secondary";
  };

  if (loading && news.length === 0) {
    return (
      <div className="news-page__wrapper">
        <Header
          currentUser={currentUser}
          onToggleSidebar={handleToggleSidebar}
          showSidebar={showSidebar}
          onOpenEditModal={() => {}}
          hasNewRequest={hasNewRequest}
          onBellClick={() => setShowNotification((prev) => !prev)}
          currentLanguage={currentLanguage}
          onLanguageChange={setCurrentLanguage}
        />
        <Sidebar collapsed={!showSidebar} user={currentUser} />
        <div style={{ marginLeft: showSidebar ? 250 : 60, marginTop: 60, padding: 20 }}>
          <p>Đang tải tin tức...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="news-page__wrapper">
      <Header
        currentUser={currentUser}
        onToggleSidebar={handleToggleSidebar}
        showSidebar={showSidebar}
        onOpenEditModal={() => {}}
        hasNewRequest={hasNewRequest}
        onBellClick={() => setShowNotification((prev) => !prev)}
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
      />

      <NotificationPanel
        showNotification={showNotification}
        setShowNotification={setShowNotification}
        notifications={[]}
        currentLanguage={currentLanguage}
      />

      <Sidebar collapsed={!showSidebar} user={currentUser} />

      <div
        className="news-page__content"
        style={{ marginLeft: showSidebar ? 250 : 60, marginTop: 60 }}
      >
        <div className="news-page__header-block">
          <div>
            <p className="news-page__eyebrow">Tin tức • One Pass</p>
            <h1 className="news-page__title">Quản lý tin tức</h1>
            <p className="news-page__subtitle">
              Thêm, chỉnh sửa và xuất bản nội dung nhanh chóng
            </p>
            <div className="news-page__tags">
              <span className="news-pill">tin tức onepass</span>
            </div>
          </div>
          <div className="news-page__actions">
            <button className="news-btn news-btn--primary" onClick={() => handleOpenModal(null)}>
              <Plus size={18} />
              Thêm tin mới
            </button>
          </div>
        </div>

        <div className="news-toolbar">
          <div className="news-search">
            <Search size={18} />
            <input
              placeholder="Tìm kiếm tiêu đề, danh mục"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="news-filters">
            <label>Danh mục</label>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tất cả ({news.length})</option>
              <option value="대사관•총영사관 소식">Tin Đại sứ quán / Lãnh sự quán</option>
              <option value="공지사항">Thông báo</option>
              <option value="행사">Sự kiện</option>
              <option value="기타">Bài viết</option>
            </select>
          </div>
        </div>

        <div className="news-grid">
            {filteredNews.length > 0 ? (
              filteredNews.map((item) => {
                let blocks = [];
                try {
                  blocks = JSON.parse(item.NoiDungVN || '[]');
                } catch {
                  blocks = [];
                }
                // Lấy tất cả các block image (bao gồm cả trùng với UrlHinhAnh)
                const imageBlocks = Array.isArray(blocks)
                  ? blocks.filter(b => b.type === 'image' && b.imageUrl)
                  : [];
                return (
                  <div key={item.ID} className="news-card">
                    <div className="news-card__thumb">
                      {item.UrlHinhAnh ? (
                        <img src={item.UrlHinhAnh} alt={item.TieuDeVN} />
                      ) : (
                        <div className="news-card__thumb--placeholder">
                          <ImageIcon size={28} />
                        </div>
                      )}
                      <span className="news-badge badge-success">
                        Tin tức
                      </span>
                    </div>

                    {/* Hiển thị tất cả các ảnh trong blocks (bao gồm cả ảnh đại diện nếu có) */}
                    {imageBlocks.length > 0 && (
                      <div className="news-card__images">
                        {imageBlocks.map((imgBlock, idx) => (
                          <img
                            key={idx}
                            src={imgBlock.imageUrl}
                            alt={`Ảnh ${idx + 1}`}
                            style={{ maxWidth: '100px', maxHeight: '80px', marginRight: 8, marginBottom: 4, borderRadius: 4 }}
                          />
                        ))}
                      </div>
                    )}

                    <div className="news-card__body">
                      <p className="news-card__meta">
                        <CalendarClock size={16} /> {item.NgayXuatBan || "Chưa đặt"}
                      </p>
                      <h3 className="news-card__title">{item.TieuDeVN}</h3>
                      <p className="news-card__summary">
                        {(() => {
                          try {
                            const blocks = JSON.parse(item.NoiDungVN || '[]');
                            if (Array.isArray(blocks) && blocks.length > 0) {
                              const textBlocks = blocks.filter(b => ['text','quote','video'].includes(b.type) && b.contentVN);
                              const preview = textBlocks.map(b => b.contentVN).join(' ');
                              return preview.substring(0, 100) + (preview.length > 100 ? '...' : '');
                            }
                            return item.NoiDungVN?.substring(0, 100) + '...';
                          } catch {
                            return item.NoiDungVN?.substring(0, 100) + '...';
                          }
                        })()}
                      </p>

                      <div className="news-card__chips">
                        {item.DanhMuc && <span className="news-chip">{item.DanhMuc}</span>}
                        <span className="news-chip news-chip--soft">Hàn: {item.TieuDeKR?.substring(0, 20)}</span>
                      </div>

                      <div className="news-card__footer">
                        <div className="news-author">{item.TacGia || "One Pass"}</div>
                        <div className="news-actions">
                          <button
                            className="icon-btn"
                            onClick={() => handleOpenModal(item)}
                            title="Chỉnh sửa"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            className="icon-btn icon-btn--danger"
                            onClick={() => setConfirmDeleteId(item.ID)}
                            title="Xóa"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="news-empty">
                <p>Chưa có tin phù hợp. Thêm mới để bắt đầu.</p>
              </div>
            )}
        </div>
      </div>

      {modalOpen && (
        <div className="news-modal__backdrop" onClick={handleCloseModal}>
          <div className="news-modal" onClick={(e) => e.stopPropagation()}>
            <div className="news-modal__header">
              <h4>{form.id ? "Chỉnh sửa tin" : "Thêm tin tức mới"}</h4>
              <button className="icon-btn" onClick={handleCloseModal}>
                <X size={18} />
              </button>
            </div>

            <div className="news-modal__body">
              {/* Row 1: Title VN & Title KR */}
              <div className="news-modal__row">
                <div className="news-field">
                  <label>Tiêu đề (Tiếng Việt) *</label>
                  <input
                    value={form.TieuDeVN}
                    onChange={(e) => setForm((prev) => ({ ...prev, TieuDeVN: e.target.value }))}
                    placeholder="Nhập tiêu đề hấp dẫn"
                  />
                </div>
                <div className="news-field">
                  <label>Tiêu đề (Hàn quốc) *</label>
                  <input
                    value={form.TieuDeKR}
                    onChange={(e) => setForm((prev) => ({ ...prev, TieuDeKR: e.target.value }))}
                    placeholder="한국어 제목을 입력하세요"
                  />
                </div>
              </div>

              {/* Row 2: Category, Author, Date */}
              <div className="news-modal__row">
                <div className="news-field">
                  <label>Danh mục</label>
                  <select
                    value={form.DanhMuc}
                    onChange={(e) => setForm((prev) => ({ ...prev, DanhMuc: e.target.value }))}
                  >
                    <option value="">Tất cả tin tức</option>
                    <option value="대사관•총영사관 소식">Tin Đại sứ quán / Lãnh sự quán</option>
                    <option value="공지사항">Thông báo</option>
                    <option value="행사">Sự kiện</option>
                    <option value="기타">Bài viết</option>
                  </select>
                </div>
                <div className="news-field">
                  <label>Tác giả</label>
                  <input
                    value={form.TacGia}
                    onChange={(e) => setForm((prev) => ({ ...prev, TacGia: e.target.value }))}
                    placeholder="Tên tác giả"
                  />
                </div>
                <div className="news-field">
                  <label>Ngày xuất bản</label>
                  <input
                    type="date"
                    value={form.NgayXuatBan}
                    onChange={(e) => setForm((prev) => ({ ...prev, NgayXuatBan: e.target.value }))}
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div className="news-field">
                <label>Upload Hình ảnh</label>
                <div className="news-upload-wrapper">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        await uploadNewsImage(file);
                      }
                    }}
                    className="news-file-input"
                    id="imageUploadInput"
                  />
                  <button 
                    type="button" 
                    className="news-upload-btn"
                    onClick={() => document.getElementById("imageUploadInput")?.click()}
                  >
                    {uploadingImage ? "Đang upload..." : "Chọn ảnh"}
                  </button>
                </div>
                {form.UrlHinhAnh && (
                  <div className="news-image-preview">
                    <img src={form.UrlHinhAnh} alt="Preview" />
                  </div>
                )}
              </div>

              <div className="news-field">
                <label>Hoặc dán URL Hình ảnh</label>
                <input
                  value={form.UrlHinhAnh}
                  onChange={(e) => setForm((prev) => ({ ...prev, UrlHinhAnh: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              {/* Block-based Content Editor */}
              <div className="news-blocks-section">
                <div className="news-blocks-header">
                  <label>Nội dung tin tức (Blocks) *</label>
                  <div className="news-blocks-actions">
                    <button 
                      type="button" 
                      className="news-add-block-btn"
                      onClick={() => addBlock('text')}
                    >
                      <Type size={16} />
                      Thêm text
                    </button>
                    <button 
                      type="button" 
                      className="news-add-block-btn"
                      onClick={() => addBlock('image')}
                    >
                      <ImageIcon size={16} />
                      Thêm ảnh
                    </button>
                    <button 
                      type="button" 
                      className="news-add-block-btn"
                      onClick={() => addBlock('quote')}
                    >
                      <Quote size={16} />
                      Thêm quote
                    </button>
                    <button 
                      type="button" 
                      className="news-add-block-btn"
                      onClick={() => addBlock('video')}
                    >
                      <Video size={16} />
                      Thêm video
                    </button>
                    <button
                      type="button"
                      className="news-add-block-btn translate"
                      onClick={handleTranslateAll}
                      disabled={translateLoading || form.blocks.length === 0}
                    >
                      <Languages size={16} />
                      {translateLoading ? "Đang dịch..." : "Dịch sang tiếng Hàn"}
                    </button>
                  </div>
                </div>

                <div className="news-blocks-list">
                  {form.blocks.length === 0 ? (
                    <div className="news-blocks-empty">
                      Chưa có block nào. Nhấn các nút trên để thêm text, ảnh, quote hoặc video.
                    </div>
                  ) : (
                    form.blocks.map((block, index) => (
                      <div
                        key={block.id}
                        className={`news-block-item ${draggingBlockId === block.id ? 'dragging' : ''} ${dropTargetId === block.id ? 'drop-target' : ''}`}
                        draggable
                        onDragStart={() => handleDragStart(block.id)}
                        onDragOver={(e) => handleDragOver(e, block.id)}
                        onDrop={() => handleDrop(block.id)}
                        onDragEnd={handleDragEnd}
                      >
                        <div className="news-block-controls">
                          <div className="news-block-type">
                            <GripVertical size={16} className="drag-handle" />
                            <span className="news-block-number">#{index + 1}</span>
                            <span className="news-block-pill">{block.type}</span>
                          </div>
                          <div className="news-block-buttons">
                            <button
                              type="button"
                              className="icon-btn"
                              onClick={() => moveBlock(block.id, 'up')}
                              disabled={index === 0}
                              title="Di chuyển lên"
                            >
                              <ChevronUp size={16} />
                            </button>
                            <button
                              type="button"
                              className="icon-btn"
                              onClick={() => moveBlock(block.id, 'down')}
                              disabled={index === form.blocks.length - 1}
                              title="Di chuyển xuống"
                            >
                              <ChevronDown size={16} />
                            </button>
                            <button
                              type="button"
                              className="icon-btn danger"
                              onClick={() => removeBlock(block.id)}
                              title="Xóa block"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {block.type === 'text' && (
                          <div className="news-block-content">
                            <div className="news-field">
                              <label>Text (Tiếng Việt)</label>
                              <div className="text-toolbar">
                                <span>VI:</span>
                                <button type="button" title="Đậm" onClick={() => applyBold(block.id, 'VN')}><Bold size={16} /></button>
                                <button type="button" title="Nghiêng" onClick={() => applyItalic(block.id, 'VN')}><Italic size={16} /></button>
                                <button type="button" title="Tiêu đề 1" onClick={() => applyHeading(block.id, 'VN', 1)}><Heading1 size={16} /></button>
                                <button type="button" title="Tiêu đề 2" onClick={() => applyHeading(block.id, 'VN', 2)}><Heading2 size={16} /></button>
                                <button type="button" title="Danh sách" onClick={() => applyList(block.id, 'VN')}><List size={16} /></button>
                                <button type="button" title="Liên kết" onClick={() => applyLink(block.id, 'VN')}><LinkIcon size={16} /></button>
                              </div>
                              <textarea
                                rows={3}
                                value={block.contentVN}
                                onChange={(e) => updateBlock(block.id, 'contentVN', e.target.value)}
                                placeholder="Nhập nội dung tiếng Việt"
                                ref={el => { textRefs.current[`${block.id}-VN`] = el; }}
                                onFocus={() => setActiveTextTarget({ blockId: block.id, lang: 'VN' })}
                              />
                            </div>
                            <div className="news-field">
                              <label>Text (Hàn quốc)</label>
                              <div className="text-toolbar">
                                <span>KO:</span>
                                <button type="button" title="굵게" onClick={() => applyBold(block.id, 'KR')}><Bold size={16} /></button>
                                <button type="button" title="기울임" onClick={() => applyItalic(block.id, 'KR')}><Italic size={16} /></button>
                                <button type="button" title="제목 1" onClick={() => applyHeading(block.id, 'KR', 1)}><Heading1 size={16} /></button>
                                <button type="button" title="제목 2" onClick={() => applyHeading(block.id, 'KR', 2)}><Heading2 size={16} /></button>
                                <button type="button" title="목록" onClick={() => applyList(block.id, 'KR')}><List size={16} /></button>
                                <button type="button" title="링크" onClick={() => applyLink(block.id, 'KR')}><LinkIcon size={16} /></button>
                              </div>
                              <textarea
                                rows={3}
                                value={block.contentKR}
                                onChange={(e) => updateBlock(block.id, 'contentKR', e.target.value)}
                                placeholder="한국어 내용을 입력하세요"
                                ref={el => { textRefs.current[`${block.id}-KR`] = el; }}
                                onFocus={() => setActiveTextTarget({ blockId: block.id, lang: 'KR' })}
                              />
                            </div>
                          </div>
                        )}

                        {block.type === 'image' && (
                          <div className="news-block-content">
                            <div className="news-field">
                              <label>URL Hình ảnh</label>
                              <input
                                value={block.imageUrl || ''}
                                onChange={(e) => updateBlock(block.id, 'imageUrl', e.target.value)}
                                placeholder="https://example.com/image.jpg"
                              />
                            </div>
                            <div className="news-field">
                              <label>Hoặc upload file</label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    await uploadNewsImage(file, block.id);
                                  }
                                }}
                              />
                              {uploadingBlockId === block.id && (
                                <p className="news-uploading-text">Đang upload ảnh...</p>
                              )}
                            </div>
                            {block.imageUrl && (
                              <div className="news-image-preview">
                                <img src={block.imageUrl} alt="Block image" />
                              </div>
                            )}
                          </div>
                        )}

                        {block.type === 'quote' && (
                          <div className="news-block-content">
                            <div className="news-field">
                              <label>Quote (Tiếng Việt)</label>
                              <textarea
                                rows={3}
                                value={block.contentVN}
                                onChange={(e) => updateBlock(block.id, 'contentVN', e.target.value)}
                                placeholder="Nhập trích dẫn tiếng Việt"
                              />
                            </div>
                            <div className="news-field">
                              <label>Quote (Hàn quốc)</label>
                              <textarea
                                rows={3}
                                value={block.contentKR}
                                onChange={(e) => updateBlock(block.id, 'contentKR', e.target.value)}
                                placeholder="한국어 인용문을 입력하세요"
                              />
                            </div>
                            <div className="news-field">
                              <label>Tác giả / Nguồn</label>
                              <input
                                value={block.quoteAuthor}
                                onChange={(e) => updateBlock(block.id, 'quoteAuthor', e.target.value)}
                                placeholder="Tên tác giả hoặc nguồn"
                              />
                            </div>
                          </div>
                        )}

                        {block.type === 'video' && (
                          <div className="news-block-content">
                            <div className="news-field">
                              <label>Video URL (YouTube, MP4...)</label>
                              <input
                                value={block.videoUrl}
                                onChange={(e) => updateBlock(block.id, 'videoUrl', e.target.value)}
                                placeholder="https://www.youtube.com/watch?v=..."
                              />
                            </div>
                            <div className="news-field">
                              <label>Caption (Tiếng Việt)</label>
                              <textarea
                                rows={2}
                                value={block.contentVN}
                                onChange={(e) => updateBlock(block.id, 'contentVN', e.target.value)}
                                placeholder="Mô tả / chú thích video tiếng Việt"
                              />
                            </div>
                            <div className="news-field">
                              <label>Caption (Hàn quốc)</label>
                              <textarea
                                rows={2}
                                value={block.contentKR}
                                onChange={(e) => updateBlock(block.id, 'contentKR', e.target.value)}
                                placeholder="영상 캡션을 입력하세요"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Summary - Hidden fields for old format compatibility */}
              <div className="news-field" style={{ display: 'none' }}>
                <label>Nội dung (Tiếng Việt) *</label>
                <textarea
                  rows={4}
                  value={form.NoiDungVN}
                  onChange={(e) => setForm((prev) => ({ ...prev, NoiDungVN: e.target.value }))}
                  placeholder="Nhập nội dung tiếng Việt"
                />
              </div>

              {/* Content - Hidden */}
              <div className="news-field" style={{ display: 'none' }}>
                <label>Nội dung (Hàn quốc) *</label>
                <textarea
                  rows={4}
                  value={form.NoiDungKR}
                  onChange={(e) => setForm((prev) => ({ ...prev, NoiDungKR: e.target.value }))}
                  placeholder="한국어 내용을 입력하세요"
                />
              </div>
            </div>

            <div className="news-floating-actions">
              <button className="news-btn news-btn--secondary" onClick={handleCloseModal}>
                Hủy
              </button>
              <button className="news-btn news-btn--primary" onClick={handleSave}>
                {form.id ? "Lưu thay đổi" : "Tạo tin"}
              </button>
            </div>

            <div className="news-modal__footer">
              <button className="news-btn news-btn--secondary" onClick={handleCloseModal}>
                Hủy
              </button>
              <button className="news-btn news-btn--primary" onClick={handleSave}>
                {form.id ? "Lưu thay đổi" : "Tạo tin"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <div className="news-modal__backdrop" onClick={() => setConfirmDeleteId(null)}>
          <div className="news-confirm" onClick={(e) => e.stopPropagation()}>
            <h5>Bạn có chắc muốn xóa tin này?</h5>
            <p>Hành động này không thể hoàn tác.</p>
            <div className="news-modal__footer">
              <button 
                className="news-btn news-btn--secondary" 
                onClick={() => setConfirmDeleteId(null)}
                disabled={loading}
              >
                Hủy
              </button>
              <button 
                className="news-btn news-btn--danger" 
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="news-toast">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default NewsPage;
