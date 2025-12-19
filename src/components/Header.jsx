// ✅ Header.jsx (đã sửa)
import React, { useState, useEffect, useRef } from "react";

const Header = ({ currentUser, onToggleSidebar, showSidebar, onOpenEditModal, hasNewRequest, onBellClick, currentLanguage, onLanguageChange }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const languageDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target)) {
        setLanguageDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);   

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    window.location.href = "/login";
  };

  const handleDropdownItemClick = (action) => {
    setDropdownOpen(false);
    if (action === "edit") onOpenEditModal();
    else if (action === "logout") handleLogout();
  };

const handleLanguageChange = (lang) => {
  localStorage.setItem("language", lang);

  window.dispatchEvent(new Event("language-change"));

  onLanguageChange(lang);
};

  return (
  <header
      className="d-flex align-items-center justify-content-between p-2"
      style={{
        background: "#FFFFFF",
        color: "#111",
        height: "60px",
        position: "fixed",
        top: 0,
        left: showSidebar ? "250px" : "60px",
        right: 0,
        zIndex: 999,
        borderBottom: "1px solid #E5E7EB",
        paddingLeft: 20,
        paddingRight: 20,
        transition: "left 0.3s ease-in-out"
      }}
    >
      <div className="d-flex align-items-center">
        <button
          onClick={onToggleSidebar}
          style={{
            background: "transparent",
            color: "#2c4d9e",
            border: "none",
            borderRadius: "6px",
            padding: "6px 10px",
            fontSize: "20px",
            lineHeight: "1",
            cursor: "pointer",
            transition: "transform 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.2)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          ☰
        </button>
      </div>

      {/* Bell + Language + Avatar Section */}
      <div className="d-flex align-items-center me-3" style={{ gap: "14px" }}>
  

        {/* 🔔 Bell Notification */}
        <div className="position-relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBellClick();
            }}
            className="btn position-relative d-flex align-items-center justify-content-center"
            style={{
              width: "46px",
              height: "46px",
              border: "none",
              background: "transparent",
              borderRadius: "50%",
              cursor: "pointer",
              transition: "transform 0.25s ease-in-out, filter 0.25s ease-in-out",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.1)";
              e.currentTarget.style.filter = "drop-shadow(0 2px 4px rgba(44,77,158,0.4))";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.filter = "none";
            }}
          >
            {/* 🔔 Bell icon với gradient nhẹ */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              fill="url(#bellGradient)"
              viewBox="0 0 24 24"
              className={hasNewRequest ? "bell-shake" : ""}
            >
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9z"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              <defs>
                <linearGradient id="bellGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3d5cb8" />
                  <stop offset="100%" stopColor="#2c4d9e" />
                </linearGradient>
              </defs>
            </svg>

            {/* 🔴 Red badge */}
            {hasNewRequest && (
              <span
                style={{
                  position: "absolute",
                  top: "5px",
                  right: "7px",
                  width: "9px",
                  height: "9px",
                  backgroundColor: "#ef4444",
                  borderRadius: "50%",
                  boxShadow: "0 0 8px rgba(239,68,68,0.5)",
                }}
              ></span>
            )}
          </button>
        </div>
        <div className="d-flex align-items-center" style={{ gap: "12px" }}>
          {/* 🇻🇳 Vietnamese */}
          <button
            type="button"
            onClick={() => handleLanguageChange("vi")}
            style={{
              width: "25px",
              height: "25px",
              borderRadius: "50%",
              overflow: "hidden",
              border: "none",
              boxShadow:
                currentLanguage === "vi"
                  ? "0 0 8px rgba(0,0,0,0.2), 0 0 10px rgba(255,255,255,0.4)"
                  : "0 2px 6px rgba(0,0,0,0.2)",
              background: "transparent",
              cursor: "pointer",
              padding: 0,
              transition: "all 0.3s ease",
              transform: currentLanguage === "vi" ? "scale(1.1)" : "scale(1)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.15)")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.transform =
                currentLanguage === "vi" ? "scale(1.1)" : "scale(1)")
            }
          >
            <img
              src="https://flagcdn.com/w80/vn.png"
              alt="Vietnamese"
              style={{
                width: "25px",
                height: "25px",
                objectFit: "cover",
                display: "block",
                borderRadius: "50%",
                filter: "drop-shadow(0 0 2px rgba(0,0,0,0.2))",
              }}
            />
          </button>

          {/* 🇬🇧 English */}
          <button
            type="button"
            onClick={() => handleLanguageChange("en")}
            style={{
              width: "25px",
              height: "25px",
              borderRadius: "50%",
              overflow: "hidden",
              border: "none",
              boxShadow:
                currentLanguage === "en"
                  ? "0 0 8px rgba(0,0,0,0.2), 0 0 10px rgba(255,255,255,0.4)"
                  : "0 2px 6px rgba(0,0,0,0.2)",
              background: "transparent",
              cursor: "pointer",
              padding: 0,
              transition: "all 0.3s ease",
              transform: currentLanguage === "en" ? "scale(1.1)" : "scale(1)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.15)")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.transform =
                currentLanguage === "en" ? "scale(1.1)" : "scale(1)")
            }
          >
            <img
              src="https://flagcdn.com/w80/gb.png"
              alt="English"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                borderRadius: "50%",
                filter: "drop-shadow(0 0 2px rgba(0,0,0,0.2))",
              }}
            />
          </button>
          
        </div>
            <button
            type="button"
            onClick={() => handleLanguageChange("vi")}
            style={{
              width: "25px",
              height: "25px",
              borderRadius: "50%",
              overflow: "hidden",
              border: "none",
              boxShadow:
                currentLanguage === "vi"
                  ? "0 0 8px rgba(0,0,0,0.2), 0 0 10px rgba(255,255,255,0.4)"
                  : "0 2px 6px rgba(0,0,0,0.2)",
              background: "transparent",
              cursor: "pointer",
              padding: 0,
              transition: "all 0.3s ease",
              transform: currentLanguage === "vi" ? "scale(1.1)" : "scale(1)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.15)")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.transform =
                currentLanguage === "vi" ? "scale(1.1)" : "scale(1)")
            }
          >
            <img
              src="https://flagcdn.com/w80/kr.png"
              alt="Korea"
              style={{
                width: "25px",
                height: "25px",
                objectFit: "cover",
                display: "block",
                borderRadius: "50%",
                filter: "drop-shadow(0 0 2px rgba(0,0,0,0.2))",
              }}
            />
          </button>



        {/* 🧑‍💼 Avatar Dropdown */}
        <div className="position-relative" ref={dropdownRef}>
          <div
            onClick={(e) => {
              e.stopPropagation(); // ✅ NGĂN SỰ KIỆN LAN RA NGOÀI
              setDropdownOpen(!dropdownOpen);
            }}
            className="d-flex align-items-center justify-content-center rounded-circle"
            style={{
              width: "44px",
              height: "44px",
              cursor: "pointer",
              backgroundColor: dropdownOpen ? "#eef5ff" : "white",
              border: "1px solid #cfe2ff",
              transition: "all 0.2s ease-in-out",
              boxShadow: dropdownOpen
                ? "0 2px 8px rgba(0,0,0,0.15)"
                : "0 1px 4px rgba(0,0,0,0.08)",
            }}
          >
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                currentUser?.username || "User"
              )}&background=0D8ABC&color=fff&rounded=true&size=128`}
              alt="avatar"
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                border: "2px solid transparent",
                backgroundImage:
                  "linear-gradient(white, white), linear-gradient(135deg, #007bff, #00b4d8)",
                backgroundOrigin: "border-box",
                backgroundClip: "content-box, border-box",
                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                transition: "transform 0.2s ease-in-out",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "scale(1.07)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "scale(1)")
              }
            />
          </div>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div
              className="position-absolute shadow-lg"
              style={{
                top: "43px",
                right: "0",
                width: "250px",
                zIndex: 1050,
                background: "white",
                borderRadius: "16px",
                overflow: "hidden",
                border: "1px solid rgba(0,0,0,0.05)",
                backdropFilter: "blur(8px)",
                animation: "fadeInUp 0.25s ease-out",
                boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
              }}
            >
              {/* Header user info */}
              <div
                className="d-flex align-items-center gap-3 px-3 py-3"
                style={{
                  background: "linear-gradient(135deg, #007bff, #00b4d8)",
                  color: "white",
                }}
              >
                <img
                  src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    currentUser?.name || "User"
                  )}&background=0D8ABC&color=fff&rounded=true&size=128`}
                  alt="avatar"
                  style={{
                    width: "46px",
                    height: "46px",
                    borderRadius: "50%",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    objectFit: "cover",
                    border: "2px solid rgba(255,255,255,0.3)"
                  }}
                />
                <div>
                  <div className="fw-bold" style={{ fontSize: "15px" }}>
                    {currentUser?.name || "User"}
                  </div>
                  <div style={{ fontSize: "13px", opacity: 0.9 }}>
                    {currentUser?.email}
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="d-flex flex-column py-2">
                <button
                  className="d-flex align-items-center px-3 py-2 border-0 bg-transparent text-start w-100"
                  style={{ fontSize: "14px", transition: "background 0.2s, color 0.2s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f8ff")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDropdownItemClick('edit');
                  }}
                >
                  <i className="bi bi-person-gear me-2 text-primary"></i>
                  <span>{currentLanguage === 'vi' ? 'Sửa thông tin' : 'Edit Profile'}</span>
                </button>

                <div className="border-top my-1"></div>

                <button
                  className="d-flex align-items-center px-3 py-2 border-0 bg-transparent text-start w-100 text-danger fw-semibold"
                  style={{
                    fontSize: "14px",
                    transition: "background 0.2s, color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#ffecec")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDropdownItemClick('logout');
                  }}
                >
                  <i className="bi bi-box-arrow-right me-2"></i>
                  <span>{currentLanguage === 'vi' ? 'Đăng xuất' : 'Logout'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
