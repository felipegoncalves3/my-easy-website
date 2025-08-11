import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <p className="text-xl text-muted-foreground mb-6">Oops! Página não encontrada</p>
        <a href="/" className="text-sm underline underline-offset-4 text-primary hover:opacity-90">
          Voltar para a página inicial
        </a>
      </div>
    </div>
  );
};

export default NotFound;
