import Seo from "@/components/Seo";
import Hero from "@/components/Hero";
import FeatureCard from "@/components/FeatureCard";
import heroImage from "@/assets/hero-gradient.jpg";
import { Sparkles, Gauge, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Site Simples",
    url: typeof window !== "undefined" ? window.location.origin : "",
    description: "Landing page moderna e responsiva criada com React e Tailwind",
  };

  return (
    <>
      <Seo
        title="Site Simples — Landing moderna e responsiva"
        description="Crie um site simples, bonito e rápido com design premium."
        jsonLd={jsonLd}
      />

      <header className="container mx-auto flex items-center justify-between py-6">
        <a href="#" className="text-lg font-semibold">Site Simples</a>
        <nav className="hidden gap-6 md:flex">
          <a href="#recursos" className="text-sm text-muted-foreground hover:text-foreground">Recursos</a>
          <a href="#contato" className="text-sm text-muted-foreground hover:text-foreground">Contato</a>
        </nav>
        <Button className="md:ml-4" size="sm" onClick={() => navigate('/system')}>
          Acessar Sistema
        </Button>
      </header>

      <main>
        <section className="container">
          <Hero imageUrl={heroImage} />
        </section>

        <section className="container py-16 md:py-24 bg-accent/50">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-3 text-3xl font-semibold md:text-4xl">Sistema BPO de Validação</h2>
            <p className="text-muted-foreground mb-8">
              Acesse o sistema para gerenciar candidatos, validar dados e gerar relatórios em tempo real
            </p>
            <Button size="lg" onClick={() => navigate('/system')} className="px-8 py-4 text-lg">
              Acessar Sistema Completo
            </Button>
          </div>
        </section>

        <section id="recursos" className="container py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-3 text-3xl font-semibold md:text-4xl">Funcionalidades do Sistema</h2>
            <p className="text-muted-foreground">Ferramenta completa para gestão de candidatos BPO.</p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <FeatureCard
              icon={<Sparkles className="size-5" />}
              title="Dashboard Analítico"
              description="Acompanhe estatísticas e métricas em tempo real."
            />
            <FeatureCard
              icon={<Gauge className="size-5" />}
              title="Painel Operacional"
              description="Valide candidatos de forma rápida e eficiente."
            />
            <FeatureCard
              icon={<Shield className="size-5" />}
              title="Sincronização Automática"
              description="Integração com Google Sheets a cada 10 minutos."
            />
          </div>
        </section>
      </main>

      <footer id="contato" className="border-t py-10">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Site Simples</p>
          <div className="flex gap-3">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Termos</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Privacidade</a>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Index;
