// Multi-language translation map for service names
// Backend always uses Korean keys (original database values)
// UI displays translated values based on currentLanguage

const serviceTranslations = {
  // Korean (원본 - Backend key)
  "인증 센터": {
    vi: "Hợp pháp hóa, công chứng",
    en: "Legalization, Notarization",
    ko: "인증 센터"
  },
  "결혼 이민": {
    vi: "Kết hôn",
    en: "Marriage Immigration",
    ko: "결혼 이민"
  },
  "결혼": {
    vi: "Kết hôn",
    en: "Marriage",
    ko: "결혼"
  },
  "출생신고 대행": {
    vi: "Khai sinh, khai tử",
    en: "Birth/Death Registration",
    ko: "출생신고 대행"
  },
  "국적 대행": {
    vi: "Quốc tịch",
    en: "Nationality",
    ko: "국적 대행"
  },
  "여권 • 호적 대행": {
    vi: "Hộ chiếu, Hộ tịch",
    en: "Passport & Family Register",
    ko: "여권 • 호적 대행"
  },
  "입양 절차 대행": {
    vi: "Nhận nuôi",
    en: "Adoption",
    ko: "입양 절차 대행"
  },
  "비자 대행": {
    vi: "Thị thực",
    en: "Visa",
    ko: "비자 대행"
  },
  "법률 컨설팅": {
    vi: "Tư vấn pháp lý",
    en: "Legal Consulting",
    ko: "법률 컨설팅"
  },
  "번역 공증": {
    vi: "Dịch thuật",
    en: "Translation & Notarization",
    ko: "번역 공증"
  },
  "B2B 서비스": {
    vi: "Dịch vụ B2B",
    en: "B2B Service",
    ko: "B2B 서비스"
  },
  "기타": {
    vi: "Khác",
    en: "Other",
    ko: "기타"
  },
  "다른": {
    vi: "Khác",
    en: "Other",
    ko: "다른"
  },
  "기타 사항": {
    vi: "Khác",
    en: "Other",
    ko: "기타 사항"
  }
};

// Backward compatibility: if no language specified, return Vietnamese (old behavior)
export default function translateService(serviceName, language = "vi") {
  // If serviceName is null/undefined, return as-is
  if (!serviceName) return serviceName;
  
  let koreanKey = serviceName;
  
  // If input is NOT a Korean key, try to find the corresponding Korean key
  if (!serviceTranslations[serviceName]) {
    koreanKey = getServiceKey(serviceName);
  }
  
  // Get translation object for this service
  const translations = serviceTranslations[koreanKey];
  
  // If we have translations, return the requested language
  if (translations) {
    return translations[language] || translations.vi;
  }
  
  // If no translation found, return original value
  return serviceName;
}

// Helper: Get original Korean key from any translated value
// Useful when filtering/sending data to backend
// Also handles reverse-mapping from any language to Korean
export function getServiceKey(displayValue) {
  if (!displayValue) return displayValue;
  
  // If already a Korean key, return as-is
  if (serviceTranslations[displayValue]) {
    return displayValue;
  }
  
  // Normalize whitespace for comparison
  const normalized = String(displayValue).trim();
  
  // Search for the key by comparing all translations
  for (const [koreanKey, translations] of Object.entries(serviceTranslations)) {
    // Compare with Vietnamese version
    if (translations.vi && translations.vi.trim() === normalized) {
      return koreanKey;
    }
    // Compare with English version
    if (translations.en && translations.en.trim() === normalized) {
      return koreanKey;
    }
    // Compare with Korean version
    if (translations.ko && translations.ko.trim() === normalized) {
      return koreanKey;
    }
  }
  
  // Not found, return original
  return displayValue;
}

