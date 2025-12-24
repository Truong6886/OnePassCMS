
export const statusColors = {
  "Tư vấn": "#f59e0b",
  "Đang xử lý": "#3b82f6",
  "Đang nộp hồ sơ": "#06b6d4",
  "Hoàn thành": "#22c55e",
  "": "#2563eb", // default
};

export const serviceColorMap = {
  "Chứng thực": "#3b82f6",
  "Kết hôn": "#ec4899",
  "Khai sinh, khai tử": "#f59e0b",
  "Quốc tịch": "#06b6d4",
  "Hộ chiếu, hộ tịch": "#84cc16",
  "Nhận nuôi": "#8b5cf6",
  "Thị thực": "#f97316",
  "Tư vấn pháp lý": "#6366f1",
  "Giấy tờ tùy thân": "#10b981",
};


export function filterByStatus(data, filterStatus) {
  return data.filter((item) =>
    !filterStatus ? true : item.TrangThai === filterStatus
  );
}


export function groupByService(data, translateService) {
  const grouped = data.reduce((acc, item) => {
    const service = translateService(item.TenDichVu || "Không xác định");
    acc[service] = (acc[service] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(grouped).map(([service, count]) => ({
    service,
    count,
  }));

  const total = Object.values(grouped).reduce((a, b) => a + b, 0);

  return { grouped, chartData, total };
}

export function filterByTimeRange(data, timeRange) {
  return data.filter((item) => {
    if (!item.NgayTao) return false;
    const date = new Date(item.NgayTao);
    const now = new Date();
    const diffDays = (now - date) / (1000 * 60 * 60 * 24);
    return diffDays <= timeRange;
  });
}


export function groupChartData(data, translateService) {
  return Object.values(
    data.reduce((acc, cur) => {
      const date = new Date(cur.NgayTao).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      const service = translateService(cur.TenDichVu || "Không xác định");

      if (!acc[date]) acc[date] = { date };
      acc[date][service] = (acc[date][service] || 0) + 1;

      return acc;
    }, {})
  );
}

export function getAllServices(data, translateService) {
  return [
    ...new Set(
      data.map((d) => translateService(d.LoaiDichVu || "Không xác định"))
    ),
  ];
}


export function buildPieData(data, currentLanguage) {
  return [
    {
      name: currentLanguage === "vi" ? "Tư vấn" : "Consulting",
      value: data.filter((d) => d.TrangThai === "Tư vấn").length,
      TrangThai: "Tư vấn",
    },
    {
      name: currentLanguage === "vi" ? "Đang xử lý" : "Processing",
      value: data.filter((d) => d.TrangThai === "Đang xử lý").length,
      TrangThai: "Đang xử lý",
    },
    {
      name: currentLanguage === "vi" ? "Đang nộp hồ sơ" : "Submitting",
      value: data.filter((d) => d.TrangThai === "Đang nộp hồ sơ").length,
      TrangThai: "Đang nộp hồ sơ",
    },
    {
      name: currentLanguage === "vi" ? "Hoàn thành" : "Completed",
      value: data.filter((d) => d.TrangThai === "Hoàn thành").length,
      TrangThai: "Hoàn thành",
    },
  ];
}
