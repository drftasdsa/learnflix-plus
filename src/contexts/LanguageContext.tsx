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
    "dashboard.title": "Dashboard",
    
    // Settings
    "settings.title": "Settings",
    "settings.language": "Language",
    "settings.language.desc": "Choose your preferred language",
    "settings.back": "Back to Dashboard",
    
    // Student Dashboard
    "student.videos": "Available Videos",
    "student.videos.desc": "Browse and watch educational content",
    "student.filter": "Filter by Category",
    "student.all.categories": "All Categories",
    
    // Subscription
    "subscription.title": "Premium Subscription",
    "subscription.active": "You have unlimited access to all videos",
    "subscription.upgrade": "Upgrade to watch unlimited videos",
    "subscription.active.badge": "Active Premium Subscription",
    "subscription.benefit.unlimited": "Unlimited video views",
    "subscription.benefit.hd": "HD quality streaming",
    "subscription.benefit.noads": "No ads",
    "subscription.price": "Price: 1 JOD/month",
    
    // Video List
    "video.loading": "Loading videos...",
    "video.none.teacher": "No videos uploaded yet",
    "video.none.student": "No videos available",
    "video.views": "views",
    "video.watch": "Watch",
    "video.limit": "Limit Reached",
    "video.upgrade": "Upgrade to Premium for unlimited views",
    "video.delete.confirm": "Are you sure you want to delete this video?",
    "video.deleted": "Video deleted",
    "video.deleted.desc": "The video has been removed successfully",
    
    // Teacher Dashboard
    "teacher.upload": "Upload New Video",
    "teacher.upload.desc": "Share your knowledge with students",
    "teacher.videos": "My Videos",
    "teacher.videos.desc": "Manage your uploaded content",
    "teacher.title.label": "Video Title",
    "teacher.description.label": "Description",
    "teacher.category.label": "Category",
    "teacher.video.label": "Video File",
    "teacher.thumbnail.label": "Thumbnail Image (optional)",
    "teacher.upload.button": "Upload Video",
    "teacher.uploading": "Uploading...",
    
    // Common
    "english": "English",
    "arabic": "Arabic",
    "error": "Error",
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
    "dashboard.title": "لوحة التحكم",
    
    // Settings
    "settings.title": "الإعدادات",
    "settings.language": "اللغة",
    "settings.language.desc": "اختر لغتك المفضلة",
    "settings.back": "العودة إلى لوحة التحكم",
    
    // Student Dashboard
    "student.videos": "الفيديوهات المتاحة",
    "student.videos.desc": "تصفح وشاهد المحتوى التعليمي",
    "student.filter": "تصفية حسب المادة",
    "student.all.categories": "جميع المواد",
    
    // Subscription
    "subscription.title": "الاشتراك المميز",
    "subscription.active": "لديك وصول غير محدود لجميع الفيديوهات",
    "subscription.upgrade": "قم بالترقية لمشاهدة فيديوهات غير محدودة",
    "subscription.active.badge": "اشتراك مميز نشط",
    "subscription.benefit.unlimited": "مشاهدات غير محدودة",
    "subscription.benefit.hd": "جودة عالية",
    "subscription.benefit.noads": "بدون إعلانات",
    "subscription.price": "السعر: 1 دينار أردني/شهر",
    
    // Video List
    "video.loading": "جاري تحميل الفيديوهات...",
    "video.none.teacher": "لم يتم رفع أي فيديوهات بعد",
    "video.none.student": "لا توجد فيديوهات متاحة",
    "video.views": "مشاهدة",
    "video.watch": "شاهد",
    "video.limit": "تم الوصول للحد الأقصى",
    "video.upgrade": "قم بالترقية للاشتراك المميز للمشاهدة غير المحدودة",
    "video.delete.confirm": "هل أنت متأكد من حذف هذا الفيديو؟",
    "video.deleted": "تم حذف الفيديو",
    "video.deleted.desc": "تم إزالة الفيديو بنجاح",
    
    // Teacher Dashboard
    "teacher.upload": "رفع فيديو جديد",
    "teacher.upload.desc": "شارك معرفتك مع الطلاب",
    "teacher.videos": "فيديوهاتي",
    "teacher.videos.desc": "إدارة المحتوى المرفوع",
    "teacher.title.label": "عنوان الفيديو",
    "teacher.description.label": "الوصف",
    "teacher.category.label": "المادة",
    "teacher.video.label": "ملف الفيديو",
    "teacher.thumbnail.label": "صورة مصغرة (اختياري)",
    "teacher.upload.button": "رفع الفيديو",
    "teacher.uploading": "جاري الرفع...",
    
    // Common
    "english": "English",
    "arabic": "العربية",
    "error": "خطأ",
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
