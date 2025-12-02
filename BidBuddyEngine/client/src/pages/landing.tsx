import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Shield, Zap, DollarSign, Globe } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useTranslation } from "react-i18next";

export default function Landing() {
  const { t, i18n } = useTranslation();
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header with Language Selector and Customer Login */}
      <div className="absolute top-0 right-0 z-20 p-4 flex items-center gap-3">
        <Button
          asChild
          variant="outline"
          className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
          data-testid="button-customer-login"
        >
          <a href="/api/login?type=customer">Customer Login</a>
        </Button>
        <Select value={i18n.language} onValueChange={(value) => i18n.changeLanguage(value)}>
          <SelectTrigger className="w-[140px] bg-slate-800 border-slate-700 text-slate-300">
            <Globe className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">🇺🇸 English</SelectItem>
            <SelectItem value="es">🇪🇸 Español</SelectItem>
            <SelectItem value="fr">🇫🇷 Français</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Hero Section */}
      <div className="relative min-h-[60vh] flex items-center justify-center bg-sidebar text-sidebar-foreground overflow-hidden">
        <div className="absolute inset-0 bg-hero-gradient"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
          <div className="flex justify-center mb-6">
            <Logo className="h-20 w-20" />
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
            {t('landing.hero.title')}
          </h1>
          <p className="text-xl sm:text-2xl text-sidebar-foreground/90 mb-8 max-w-2xl mx-auto">
            {t('landing.hero.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6"
              data-testid="button-get-started"
            >
              <a href="/api/login?type=customer">{t('landing.hero.getStarted')}</a>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 text-lg px-8 py-6"
              data-testid="button-learn-more"
            >
              <a href="#how-it-works">{t('landing.hero.learnMore')}</a>
            </Button>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">{t('landing.howItWorks.title')}</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            {t('landing.howItWorks.subtitle')}
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-blue-gradient flex items-center justify-center text-white font-bold text-xl mb-4">
                  1
                </div>
                <CardTitle>{t('landing.howItWorks.step1.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  {t('landing.howItWorks.step1.description')}
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-blue-gradient flex items-center justify-center text-white font-bold text-xl mb-4">
                  2
                </div>
                <CardTitle>{t('landing.howItWorks.step2.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  {t('landing.howItWorks.step2.description')}
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-blue-gradient flex items-center justify-center text-white font-bold text-xl mb-4">
                  3
                </div>
                <CardTitle>{t('landing.howItWorks.step3.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  {t('landing.howItWorks.step3.description')}
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-blue-gradient flex items-center justify-center text-white font-bold text-xl mb-4">
                  4
                </div>
                <CardTitle>{t('landing.howItWorks.step4.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  {t('landing.howItWorks.step4.description')}
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">{t('landing.features.title')}</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('landing.features.secure.title')}</h3>
              <p className="text-muted-foreground">
                {t('landing.features.secure.description')}
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <DollarSign className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('landing.features.refund.title')}</h3>
              <p className="text-muted-foreground">
                {t('landing.features.refund.description')}
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('landing.features.fast.title')}</h3>
              <p className="text-muted-foreground">
                {t('landing.features.fast.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">{t('landing.cta.title')}</h2>
          <p className="text-xl text-muted-foreground mb-8">
            {t('landing.cta.subtitle')}
          </p>
          <Button
            asChild
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6"
            data-testid="button-sign-up"
          >
            <a href="/api/login?type=customer">{t('landing.cta.button')}</a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-sidebar text-sidebar-foreground py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <Logo />
          </div>
          <p className="text-sidebar-foreground/70">
            {t('landing.footer.copyright')}
          </p>
          <div className="mt-6">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-sidebar-foreground/40 hover:text-sidebar-foreground/60 text-xs"
              data-testid="button-admin-login"
            >
              <a href="/api/login?type=admin">Admin Access</a>
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
