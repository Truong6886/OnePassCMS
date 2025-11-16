import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import EditProfileModal from "./EditProfileModal";
import { useNavigate } from "react-router-dom";

export default function B2BPage() {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  const [pendingList, setPendingList] = useState([]);
  const [approvedList, setApprovedList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentUser, setCurrentUser] = useState(null);
  const [currentLanguage, setCurrentLanguage] = useState(
    localStorage.getItem("language") || "vi"
  );

  const [activeTab, setActiveTab] = useState("pending");

  const navigate = useNavigate();
  const t = (vi, en) => (currentLanguage === "vi" ? vi : en);

  // Load user và dữ liệu
  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pendingRes, approvedRes] = await Promise.all([
        fetch("http://localhost:5000/api/b2b/pending"),
        fetch("http://localhost:5000/api/b2b/approved"),
      ]);

      const p = await pendingRes.json();
      const a = await approvedRes.json();

      setPendingList(p.data || []);
      setApprovedList(a.data || []);
    } catch (err) {
      console.error("Load data error:", err);
      alert("Lỗi tải dữ liệu!");
    } finally {
      setLoading(false);
    }
  };

  const approve = async (id) => {
    if (!window.confirm("Duyệt doanh nghiệp này?")) return;

    try {
      const res = await fetch(`http://localhost:5000/api/b2b/approve/${id}`, {
        method: "POST",
      }).then((r) => r.json());

      if (res.success) {
        alert("Duyệt thành công");
        loadData();
      } else {
        alert("Lỗi: " + res.message);
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi server!");
    }
  };

  //---------------- TABS ----------------
  const TabsB2B = ({ activeTab, setActiveTab }) => {
    const tabs = [
      { key: "pending", label: t("Danh sách chờ duyệt", "Pending B2B") },
      { key: "approved", label: t("Danh sách đã duyệt", "Approved B2B") },
    ];

    return (
      <div
        className="d-flex border-bottom mb-4 gap-4 mt-3"
        style={{ fontWeight: 500 }}
      >
        {tabs.map((tab) => (
          <div
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              cursor: "pointer",
              paddingBottom: "6px",
              borderBottom:
                activeTab === tab.key
                  ? "3px solid #2563eb"
                  : "3px solid transparent",
              color: activeTab === tab.key ? "#2563eb" : "#6b7280",
              fontWeight: activeTab === tab.key ? "600" : "500",
              transition: "all 0.2s ease",
            }}
          >
            {tab.label}
          </div>
        ))}
      </div>
    );
  };

  //---------------------------------------

  const renderTable = (list, columns, showApproveBtn = false) => {
    if (loading)
      return (
        <div className="p-4 text-center">{t("Đang tải...", "Loading...")}</div>
      );

    if (!list.length)
      return (
        <tr>
          <td colSpan={columns.length} className="text-center p-4">
            {t("Không có dữ liệu", "No data")}
          </td>
        </tr>
      );

    return list.map((item, i) => (
      <tr key={item.ID} className="border-b">
        {columns.map((col) => (
          <td key={col.key} className="p-2 text-center">
            {col.render ? col.render(item) : item[col.key] || "—"}
          </td>
        ))}

        {showApproveBtn && (
          <td className="p-2 text-center">
            <button
              onClick={() => approve(item.ID)}
              className="px-3 py-1 bg-green-600 text-white rounded"
            >
              {t("Duyệt", "Approve")}
            </button>
          </td>
        )}
      </tr>
    ));
  };

  const pendingColumns = [
    { key: "STT", render: (_, i) => i + 1 },
    { key: "TenDoanhNghiep" },
    { key: "SoDKKD" },
    { key: "NguoiDaiDien" },
    { key: "DichVu" },
    { key: "NgayTao", render: (item) => item.NgayTao?.slice(0, 10) },
    {
      key: "PdfPath",
      render: (item) =>
        item.PdfPath ? (
          <a
            href={item.PdfPath}
            target="_blank"
            className="text-blue-600 underline"
          >
            {t("Xem PDF", "View PDF")}
          </a>
        ) : (
          "—"
        ),
    },
  ];

  const approvedColumns = [
    { key: "STT", render: (_, i) => i + 1 },
    { key: "TenDoanhNghiep" },
    { key: "SoDKKD" },
    { key: "NguoiDaiDien" },
    { key: "NganhNgheChinh" },
    { key: "DiaChi" },
    { key: "NgayDangKyB2B", render: (item) => item.NgayDangKyB2B?.slice(0, 10) },
    { key: "TongDoanhThu" },
    { key: "XepHang" },
    {
      key: "PdfPath",
      render: (item) =>
        item.PdfPath ? (
          <a
            href={item.PdfPath}
            target="_blank"
            className="text-blue-600 underline"
          >
            {t("Xem PDF", "View PDF")}
          </a>
        ) : (
          "—"
        ),
    },
  ];

  return (
    <div className="flex">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full z-40">
        <Sidebar collapsed={!showSidebar} user={currentUser} />
      </div>

     
      <div
        className="flex-1 transition-all duration-300"
        style={{
          paddingLeft: showSidebar ? 260 : 80,
          marginTop: 70, 
        }}
      >
        <Header
          currentUser={currentUser}
          showSidebar={showSidebar}
          onToggleSidebar={() => setShowSidebar((s) => !s)}
          onOpenEditModal={() => setShowEditModal(true)}
          currentLanguage={currentLanguage}
          onLanguageChange={setCurrentLanguage}
        />

        {showEditModal && (
          <EditProfileModal
            currentUser={currentUser}
            onUpdate={(u) => {
              setCurrentUser(u);
              localStorage.setItem("currentUser", JSON.stringify(u));
            }}
            onClose={() => setShowEditModal(false)}
            currentLanguage={currentLanguage}
          />
        )}


        <TabsB2B activeTab={activeTab} setActiveTab={setActiveTab} />


        <div className="mt-4">
          {activeTab === "pending" && (
            <div className="overflow-auto border rounded-lg bg-white shadow-sm">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-200 text-gray-700">
                  <tr>
                    {pendingColumns.map((col) => (
                      <th key={col.key} className="p-2">
                        {col.key}
                      </th>
                    ))}
                    <th className="p-2">{t("Duyệt", "Approve")}</th>
                  </tr>
                </thead>
                <tbody>
                  {renderTable(pendingList, pendingColumns, true)}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "approved" && (
            <div className="overflow-auto border rounded-lg bg-white shadow-sm">
              <table className="min-w-full text-sm">
                <thead className="bg-blue-200 text-gray-700">
                  <tr>
                    {approvedColumns.map((col) => (
                      <th key={col.key} className="p-2">
                        {col.key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>{renderTable(approvedList, approvedColumns)}</tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
