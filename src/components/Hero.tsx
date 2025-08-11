import React, { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

interface HeroProps {
  imageUrl: string;
}

const Hero: React.FC<HeroProps> = ({ imageUrl }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const handle = (e: MouseEvent) => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        el.style.setProperty("--glow-x", `${x}px`);
        el.style.setProperty("--glow-y", `${y}px`);
      });
    };
    el.addEventListener("mousemove", handle);
    return () => {
      el.removeEventListener("mousemove", handle);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section ref={ref} className="relative overflow-hidden rounded-lg border bg-card">
      <div className="absolute inset-0 -z-10">
        <img
          src={imageUrl}
          alt="Fundo abstrato com ondas em gradiente"
          loading="lazy"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/20 to-background" />
      </div>

      <div className="pointer-glow">
        {/* signature interaction layer */}
      </div>

      <div className="relative mx-auto max-w-5xl px-6 py-24 text-center md:py-28">
        <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-6xl">
          Site Simples, bonito e rápido
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl">
          Uma landing page moderna com design premium, pronta para você personalizar.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button size="lg" variant="hero">Começar agora</Button>
          <Button size="lg" variant="outline">Ver recursos</Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
