import { showToast } from "../../../utils/toast";

export default function useProfile(currentUser, setCurrentUser, currentLanguage) {

  const handleProfileUpdate = async (userId, formData) => {
    try {
      console.log("🔄 Đang cập nhật profile...", { userId, formData });
      
      const res = await fetch(`https://onepasscms-backend.onrender.com/api/User/${userId}`, { 
        method: "PUT", 
        body: formData 
      });
      
      const result = await res.json();
      console.log("📨 Kết quả cập nhật:", result);

      if (result.success) {
        const updatedUser = {
          ...currentUser,
          username: formData.get("username") || currentUser.username,
          email: formData.get("email") || currentUser.email,
          avatar: result.data?.[0]?.avatar || currentUser.avatar
        };

        setCurrentUser(updatedUser);
        localStorage.setItem("currentUser", JSON.stringify(updatedUser));

        showToast(
          currentLanguage === "vi"
            ? "Cập nhật profile thành công!"
            : "Profile updated successfully!",
          "success"
        );

        return true;
      } else {
        showToast(
          currentLanguage === "vi"
            ? `❌ Cập nhật thất bại: ${result.message || result.error}`
            : `❌ Update failed: ${result.message || result.error}`,
          "danger"
        );
        return false;
      }
    } catch (err) {
      console.error("❌ Lỗi cập nhật profile:", err);
      showToast(
        currentLanguage === "vi" ? "Lỗi máy chủ!" : "Server error!",
        "danger"
      );
      return false;
    }
  };

  return { handleProfileUpdate };
}
