import { createContext, useContext, useState, ReactNode, useEffect } from "react";

type Language = "en" | "ar";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Landing Page
    "app.title": "LearnFlix Plus",
    "landing.hero.title": "Quality Education at Your Fingertips",
    "landing.hero.subtitle": "Join our platform where teachers share knowledge and students learn without limits",
    "landing.hero.cta": "Start Learning Now",
    "landing.feature.quality.title": "Quality Content",
    "landing.feature.quality.desc": "Access educational videos uploaded by experienced teachers",
    "landing.feature.free.title": "Free Access",
    "landing.feature.free.desc": "Watch videos up to 2 times for free in standard quality",
    "landing.feature.premium.title": "Premium Benefits",
    "landing.feature.premium.desc": "Upgrade for unlimited views, downloads, and HD quality (Coming Soon)",
    "landing.teacher.title": "Are you a teacher?",
    "landing.teacher.desc": "Share your knowledge with students around Jordan. Upload videos and help students succeed.",
    "landing.teacher.cta": "Sign Up as Teacher",
    "landing.creators": "Creators",
    "get.started": "Get Started",
    
    // Dashboard
    "dashboard.signout": "Sign Out",
    "dashboard.loading": "Loading...",
    
    // Settings
    "settings.title": "Settings",
    "settings.language": "Language",
    "settings.language.desc": "Choose your preferred language",
    "settings.back": "Back to Dashboard",
    
    // Common
    "english": "English",
    "arabic": "Arabic",
  },
  ar: {
    // Landing Page
    "app.title": "ليرن فليكس بلس",
    "landing.hero.title": "تعليم عالي الجودة في متناول يدك",
    "landing.hero.subtitle": "انضم إلى منصتنا حيث يشارك المعلمون المعرفة ويتعلم الطلاب بلا حدود",
    "landing.hero.cta": "ابدأ التعلم الآن",
    "landing.feature.quality.title": "محتوى عالي الجودة",
    "landing.feature.quality.desc": "الوصول إلى مقاطع الفيديو التعليمية التي يحملها معلمون ذوو خبرة",
    "landing.feature.free.title": "وصول مجاني",
    "landing.feature.free.desc": "شاهد الفيديوهات حتى مرتين مجانًا بجودة قياسية",
    "landing.feature.premium.title": "مزايا مميزة",
    "landing.feature.premium.desc": "قم بالترقية للحصول على مشاهدات غير محدودة وتنزيلات وجودة عالية (قريبًا)",
    "landing.teacher.title": "هل أنت معلم؟",
    "landing.teacher.desc": "شارك معرفتك مع الطلاب في جميع أنحاء الأردن. قم برفع الفيديوهات وساعد الطلاب على النجاح.",
    "landing.teacher.cta": "التسجيل كمعلم",
    "landing.creators": "المبدعون",
    "get.started": "ابدأ الآن",
    
    // Dashboard
    "dashboard.signout": "تسجيل الخروج",
    "dashboard.loading": "جاري التحميل...",
    
    // Settings
    "settings.title": "الإعدادات",
    "settings.language": "اللغة",
    "settings.language.desc": "اختر لغتك المفضلة",
    "settings.back": "العودة إلى لوحة التحكم",
    
    // Common
    "english": "English",
    "arabic": "العربية",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("language");
    return (saved as Language) || "en";
  });

  useEffect(() => {
    localStorage.setItem("language", language);
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.en] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
