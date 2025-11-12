import React from "react";

const DashboardHeader = ({
  currentUser,
  currentLanguage,
  viewMode,
  setViewMode,
  fromChart,
  setFromChart,
  setFilterType,
  setFilterDichVu,
  setFilterStatus,
}) => {
  if (!currentUser?.is_admin) return null;

  const tabs = [
    { key: "summary", labelVi: "Tổng quan", labelEn: "Summary" },
    { key: "list", labelVi: "Danh sách", labelEn: "List" },
  ];

  return (
    <div
      className="d-flex border-bottom mb-4"
      style={{
        gap: "2rem",
        borderColor: "#e0e0e0",
        fontWeight: 500,
        fontSize: "1rem",
      }}
    >
      {tabs.map((tab) => (
        <div
          key={tab.key}
          onClick={() => {
            if (tab.key === "list" && !fromChart) {
              setFilterType(null);
              setFilterDichVu(null);
              setFilterStatus(null);
            }
            setFromChart(false);
            setViewMode(tab.key);
          }}
          style={{
            cursor: "pointer",
            paddingBottom: "6px",
            borderBottom:
              viewMode === tab.key
                ? "3px solid #2563eb"
                : "3px solid transparent",
            color: viewMode === tab.key ? "#2563eb" : "#6b7280",
            fontWeight: viewMode === tab.key ? "600" : "500",
            transition: "all 0.2s ease",
          }}
        >
          {currentLanguage === "vi" ? tab.labelVi : tab.labelEn}
        </div>
      ))}
    </div>
  );
};

export default DashboardHeader;
