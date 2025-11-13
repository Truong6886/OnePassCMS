
export default function translateService(serviceName) {
  const map = {
    "인증 센터": "Chứng thực",
    "결혼 이민": "Kết hôn",
    "출생신고 대행": "Khai sinh, khai tử",
    "출입국 행정 대행": "Xuất nhập cảnh",
    "신분증명 서류 대행": "Giấy tờ tùy thân",
    "입양 절차 대행": "Nhận nuôi",
    "비자 대행": "Thị thực",
    "법률 컨설팅": "Tư vấn pháp lý",
    "B2B 서비스": "Dịch vụ B2B",
    "기타": "Khác",
  };

  return map[serviceName] || serviceName;
}

