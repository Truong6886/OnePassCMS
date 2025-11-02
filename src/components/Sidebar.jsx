import React, { useState } from "react";
import logo from "../assets/logo.png";
import { List, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Sidebar({ collapsed = false, active = "list" }) {
  const [hoveredItem, setHoveredItem] = useState(null);
  const navigate = useNavigate();

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
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  };

  const getItemStyle = (key) => {
    const base = {
      width: "100%",
      padding: "12px 18px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "14px",
      transition: "all 0.25s ease",
      fontWeight: 500,
      justifyContent: collapsed ? "center" : "flex-start",
      color: "#fff",
      borderRadius: "6px",
      background: "transparent",
    };

    if (active === key) {
      base.background = "rgba(255,255,255,0.15)";
      base.boxShadow = "inset 0 0 6px rgba(255,255,255,0.2)";
      base.borderRight = "3px solid #93C5FD";
    }

    if (hoveredItem === key) {
      base.background = "#fff";
      base.color = "#2c4d9e";
      base.transform = "translateY(-1px)";
      base.boxShadow =
        "0 0 10px rgba(255,255,255,0.7), inset 0 0 10px rgba(255,255,255,0.8)";
    }

    return base;
  };

  return (
    <div style={sidebarStyle}>
      <div
        style={{
          width: "100%",
          padding: "16px 0",
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
            width: collapsed ? "42px" : "150px",
            height: collapsed ? "42px" : "64px",
            objectFit: "contain",
            transition: "all 0.3s ease",
          }}
        />
      </div>

      <div style={{ flex: 1, width: "100%" }}>
        <ul style={{ listStyle: "none", padding: 0, marginTop: 20 }}>
          <li
            style={getItemStyle("list")}
            onMouseEnter={() => setHoveredItem("list")}
            onMouseLeave={() => setHoveredItem(null)}
            onClick={() => navigate("/")}
          >
            <List size={20} />
            {!collapsed && "Danh Sách Yêu Cầu"}
          </li>

          <li
            style={getItemStyle("hoso")}
            onMouseEnter={() => setHoveredItem("hoso")}
            onMouseLeave={() => setHoveredItem(null)}
            onClick={() => navigate("/hoso")}
          >
            <Search size={20} />
            {!collapsed && "Tra Cứu Hồ Sơ"}
          </li>
        </ul>
      </div>
    </div>
  );
}
