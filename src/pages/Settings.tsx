import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Settings = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <header className="sticky top-0 z-50 glass border-b">
        <div className="container mx-auto px-4 py-4">
          <Button onClick={() => navigate(-1)} variant="ghost" size="sm" className="press-effect">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("settings.back")}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl animate-fade-in-up">
        <h1 className="text-3xl font-bold mb-8 gradient-text">{t("settings.title")}</h1>

        <Card className="glass">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>{t("settings.language")}</CardTitle>
                <CardDescription>{t("settings.language.desc")}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="language">{t("settings.language")}</Label>
              <Select value={language} onValueChange={(value) => setLanguage(value as "en" | "ar")}>
                <SelectTrigger id="language" className="bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border">
                  <SelectItem value="en">{t("english")}</SelectItem>
                  <SelectItem value="ar">{t("arabic")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Settings;
