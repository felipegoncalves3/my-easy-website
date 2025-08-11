import Seo from "@/components/Seo";
import Hero from "@/components/Hero";
import FeatureCard from "@/components/FeatureCard";
import heroImage from "@/assets/hero-gradient.jpg";
import { Sparkles, Gauge, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
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
        <Button className="md:ml-4" size="sm">Começar</Button>
      </header>

      <main>
        <section className="container">
          <Hero imageUrl={heroImage} />
        </section>

        <section id="recursos" className="container py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-3 text-3xl font-semibold md:text-4xl">Recursos essenciais</h2>
            <p className="text-muted-foreground">Tudo o que você precisa para lançar rápido e com estilo.</p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <FeatureCard
              icon={<Sparkles className="size-5" />}
              title="Design premium"
              description="Cores, gradientes e microinterações elegantes prontas para uso."
            />
            <FeatureCard
              icon={<Gauge className="size-5" />}
              title="Performance"
              description="Imagens otimizadas, carregamento rápido e boas práticas SEO."
            />
            <FeatureCard
              icon={<Shield className="size-5" />}
              title="Acessibilidade"
              description="Contraste, foco visível e responsividade em todos os dispositivos."
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
