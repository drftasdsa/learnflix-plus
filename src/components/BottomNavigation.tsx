import { useNavigate } from "react-router-dom";
import { Home, CreditCard, MessageSquare, Video, Bot, Info, Phone } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface BottomNavigationProps {
  onScrollTo: (sectionId: string) => void;
}

const BottomNavigation = ({ onScrollTo }: BottomNavigationProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const navItems = [
    { id: "hero", icon: Home, label: t("student.nav.hero") },
    { id: "subscription", icon: CreditCard, label: t("student.nav.subscription") },
    { id: "messages", icon: MessageSquare, label: t("messages"), isLink: true },
    { id: "videos", icon: Video, label: t("student.nav.videos") },
    { id: "assistant", icon: Bot, label: t("student.nav.assistant") },
    { id: "about", icon: Info, label: t("student.nav.about") },
    { id: "contact", icon: Phone, label: t("student.nav.contact") },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-primary border-t border-primary-foreground/10 safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2 overflow-x-auto scrollbar-hide">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => item.isLink ? navigate("/messages") : onScrollTo(item.id)}
            className="flex flex-col items-center justify-center min-w-[48px] px-2 py-1 text-primary-foreground/80 hover:text-primary-foreground transition-colors duration-200 press-effect"
          >
            <item.icon className="h-5 w-5 mb-0.5" />
            <span className="text-[10px] font-medium whitespace-nowrap">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavigation;
