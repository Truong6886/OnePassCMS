import { showToast } from "../../../utils/toast";
// 1. Import authenticatedFetch
import { authenticatedFetch } from "../../../utils/api";

export default function useProfile(currentUser, setCurrentUser, currentLanguage) {

  const handleProfileUpdate = async (userId, formData) => {
    try {
      console.log("🔄 Đang cập nhật profile...", { userId, formData });
      
      // 2. Thay fetch bằng authenticatedFetch
      const res = await authenticatedFetch(
        `https://onepasscms-backend-tvdy.onrender.com/api/User/${userId}`, 
        { 
          method: "PUT", 
          body: formData,
          headers: {
            "Content-Type": undefined 
          }
        }
      );
      
 
      const result = await res.json();
      console.log("Kết quả cập nhật:", result);

      if (result.success) {
       
        const updatedUser = {
          ...currentUser,
          name: formData.get("name")?.trim() || currentUser.name,
          username: formData.get("username") || currentUser.username,
          email: formData.get("email") || currentUser.email,
         
          avatar: (result.data && result.data.avatar) || result.data?.[0]?.avatar || currentUser.avatar
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
            ? `❌ Cập nhật thất bại: ${result.message || "Lỗi không xác định"}`
            : `❌ Update failed: ${result.message || "Unknown error"}`,
          "error"
        );
        return false;
      }
    } catch (err) {
      console.error("❌ Lỗi cập nhật profile:", err);
      showToast(
        currentLanguage === "vi" ? "Lỗi máy chủ!" : "Server error!",
        "error"
      );
      return false;
    }
  };

  return { handleProfileUpdate };
}