import React, { useState } from "react";
import logo from "../assets/logo.png";
import { List } from 'lucide-react';
export default function Sidebar({ collapsed, onSelect, active = "list" }) {
  const [hoveredItem, setHoveredItem] = useState(null);

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
      transition: "all 0.3s ease",
      fontWeight: 500,
      justifyContent: collapsed ? "center" : "flex-start",
      color: "#fff",
      position: "relative",
      overflow: "hidden",
      borderRadius: "6px",
      background: "transparent",
    };

    // Active (đang chọn)
    if (active === key) {
      base.borderRight = "3px solid #93C5FD";
      base.background = "rgba(255,255,255,0.15)";
      base.boxShadow = "inset 0 0 6px rgba(255,255,255,0.2)";
    }

    // Hover → nền trắng sáng gương
    if (hoveredItem === key) {
      base.background = "#fff";
      base.color = "#2c4d9e";
      base.boxShadow =
        "0 0 10px rgba(255,255,255,0.7), inset 0 0 10px rgba(255,255,255,0.8)";
      base.transform = "translateY(-1px)";
    }

    return base;
  };

  return (
    <div style={sidebarStyle}>
      {/* ==== Logo ==== */}
      <div
        style={{
          width: "100%",
          padding: "16px 0",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "70px",
          boxSizing: "border-box",
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

      {/* ==== Menu ==== */}
      <div style={{ flex: 1, width: "100%" }}>
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            marginTop: 20,
            width: "100%",
          }}
        >
          <li
            style={getItemStyle("list")}
            onMouseEnter={() => setHoveredItem("list")}
            onMouseLeave={() => setHoveredItem(null)}
            onClick={() => onSelect("list")}
          >
             <List size={20} strokeWidth={2} />
            {!collapsed && "Danh Sách Yêu Cầu"}
          </li>
        </ul>
      </div>
    </div>
  );
}
