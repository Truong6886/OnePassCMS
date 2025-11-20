import React, { useEffect, useState } from "react";
import logo from "../assets/logo.png";
import { useNavigate, useLocation } from "react-router-dom";
import { List, Search, DollarSign } from "lucide-react";
import { Handshake } from 'lucide-react';
export default function Sidebar({ collapsed = false, user }) {
  const [hoveredItem, setHoveredItem] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const [currentLanguage, setCurrentLanguage] = useState(
    localStorage.getItem("language") || "vi"
  );

useEffect(() => {
  const updateLanguage = () => {
    const lang = localStorage.getItem("language") || "vi";
    setCurrentLanguage(lang);
  };


  window.addEventListener("language-change", updateLanguage);


  window.addEventListener("storage", updateLanguage);

  updateLanguage();

  return () => {
    window.removeEventListener("language-change", updateLanguage);
    window.removeEventListener("storage", updateLanguage);
  };
}, []);


  const texts = {
    list: {
      vi: user?.is_admin ? "Quản Lý Yêu Cầu" : "Danh Sách Yêu Cầu",
      en: user?.is_admin ? "Manage Requests" : "Request List",
    },
    hoso: { vi: "Tra Cứu Hồ Sơ", en: "Record Lookup" },
    nhanvien: { vi: "Quản Lý Nhân Viên", en: "Employee Management" },
    doanhthu: { vi: "Doanh Thu", en: "Revenue" },
    b2b: {vi:"Quản lý B2B", en: "B2B Management"}
  };

  const sidebarStyle = {
    width: collapsed ? "60px" : "250px",
    background: "#2c4d9e",
    color: "#fff",
    height: "100vh",
    position: "fixed",
    top: 0,
    left: 0,
    transition: "width 0.3s ease",
    borderRight: "1px solid #E5E7EB",
    zIndex: 999,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  };

  const getItemStyle = (key) => {
    const base = {
      width: "100%",
      padding: collapsed ? "12px 0" : "12px 18px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: collapsed ? "center" : "flex-start",
      gap: collapsed ? "0" : "14px",
      transition: "all 0.25s ease",
      fontWeight: 500,
      color: "#fff",
      borderRadius: "6px",
      background: "transparent",
      marginBottom: "4px",
      textAlign: collapsed ? "center" : "left",
    };

    const isActive =
      (key === "list" && currentPath === "/") ||
      (key === "hoso" && currentPath.startsWith("/hoso")) ||
      (key === "B2B" && currentPath.startsWith("/B2B")) ||
      (key === "nhanvien" && currentPath.startsWith("/nhanvien")) ||
      (key === "doanhthu" && currentPath.startsWith("/doanhthu"));

    if (isActive) {
      base.background = "rgba(255,255,255,0.15)";
      base.boxShadow = "inset 0 0 6px rgba(255,255,255,0.2)";
      base.borderRight = "3px solid #93C5FD";
    }

    if (hoveredItem === key) {
      base.background = "#fff";
      base.color = "#2c4d9e";
      base.transform = "translateY(-1px)";
      base.boxShadow = "0 0 10px rgba(255,255,255,0.7)";
    }

    return base;
  };

  return (
    <div style={sidebarStyle}>
      {/* 🔹 Logo */}
      <div
        style={{
          width: "100%",
          padding: collapsed ? "10px 0" : "16px 0",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "70px",
        }}
      >
        <img
          src={logo}
          alt="Logo"
          style={{
            width: collapsed ? "40px" : "140px",
            height: collapsed ? "40px" : "60px",
            objectFit: "contain",
            transition: "all 0.3s ease",
          }}
        />
      </div>

      {/* 🔹 Menu */}
      <div style={{ flex: 1, width: "100%" }}>
        <ul style={{ listStyle: "none", padding: "0 10px", marginTop: 20 }}>
          {/* Danh sách yêu cầu */}
          <li
            style={getItemStyle("list")}
            onMouseEnter={() => setHoveredItem("list")}
            onMouseLeave={() => setHoveredItem(null)}
            onClick={() => navigate("/")}
          >
            <List size={22} />
            {!collapsed && <span>{texts.list[currentLanguage]}</span>}
          </li>

          {/* Tra cứu hồ sơ */}
          <li
            style={getItemStyle("hoso")}
            onMouseEnter={() => setHoveredItem("hoso")}
            onMouseLeave={() => setHoveredItem(null)}
            onClick={() => navigate("/hoso")}
          >
            <Search size={22} />
            {!collapsed && <span>{texts.hoso[currentLanguage]}</span>}
          </li>

        
          {(user?.is_admin ||user?.is_directorI|| user?.is_director) && (
            <li
              style={getItemStyle("nhanvien")}
              onMouseEnter={() => setHoveredItem("nhanvien")}
              onMouseLeave={() => setHoveredItem(null)}
              onClick={() => navigate("/nhanvien")}
            >
              <i className="bi bi-people" style={{ fontSize: 20 }}></i>
              {!collapsed && <span>{texts.nhanvien[currentLanguage]}</span>}
            </li>
          )}

  
          {(user?.is_accountant || user?.is_director) && (
            <li
              style={getItemStyle("doanhthu")}
              onMouseEnter={() => setHoveredItem("doanhthu")}
              onMouseLeave={() => setHoveredItem(null)}
              onClick={() => navigate("/doanhthu")}
            >
              <DollarSign size={22} />
              {!collapsed && <span>{texts.doanhthu[currentLanguage]}</span>}
            </li>
          )}
          {(user?.is_admin || user?.is_director) && (
            <li
              style={getItemStyle("B2B")}
              onMouseEnter={() => setHoveredItem("B2B")}
              onMouseLeave={() => setHoveredItem(null)}
              onClick={() => navigate("/B2B")}
            >
                <Handshake  style={{ fontSize: 20 }} />
                {!collapsed && <span>{texts.b2b[currentLanguage]}</span>}
            </li>
          )}

        </ul>
      </div>
    </div>
  );
}
