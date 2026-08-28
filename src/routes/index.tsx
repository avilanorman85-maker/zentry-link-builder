import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Zap,
  Smartphone,
  BarChart3,
  Crown,
  Mail,
  Lock,
  User,
  ArrowRight,
  Code2,
  Globe,
  MousePointerClick,
  ShieldCheck,
  Layers,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/hooks/use-auth";
import { ZentryWordmark } from "@/components/ZentryLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [termsModalOpen, setTermsModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/app/dashboard" });
  }, [loading, user, navigate]);

  const openAuth = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    if (authMode === "signup" && !acceptedTerms) {
      toast.error("Debes aceptar los Términos y Condiciones para registrarte");
      return;
    }

    setSubmitting(true);

    try {
      if (authMode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: name.trim() || email.split("@")[0],
              name: name.trim() || email.split("@")[0],
            },
          },
        });

        if (error) throw error;

        if (data.session) {
          toast.success("¡Cuenta creada exitosamente!");
          setAuthModalOpen(false);
          navigate({ to: "/app/dashboard" });
        } else {
          toast.success("¡Cuenta registrada! Si tienes confirmación por correo activada en Supabase, revisa tu correo.");
          setAuthModalOpen(false);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        toast.success("Sesión iniciada correctamente");
        setAuthModalOpen(false);
        navigate({ to: "/app/dashboard" });
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      toast.error(err.message || "Error al procesar la solicitud de autenticación");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-background text-foreground">
      {/* Background glow effects */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[750px] h-[480px] bg-gradient-to-tr from-accent/20 to-primary/20 blur-[140px] rounded-full" />

      {/* Header */}
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <ZentryWordmark />
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#inicio" className="hover:text-foreground transition-colors">Inicio</a>
          <a href="#features" className="hover:text-foreground transition-colors">Características</a>
          <a href="#ventajas" className="hover:text-foreground transition-colors">Ventajas</a>
          <button onClick={() => setTermsModalOpen(true)} className="hover:text-foreground transition-colors">Términos</button>
        </nav>
        <div className="flex items-center gap-3">
          <Button onClick={() => openAuth("login")} variant="ghost" className="text-sm font-medium">
            Iniciar sesión
          </Button>
          <Button onClick={() => openAuth("signup")} className="bg-gradient-neon text-background font-semibold glow-violet hover:opacity-90 transition-opacity">
            Registrarse
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section id="inicio" className="relative mx-auto max-w-5xl px-6 pt-16 pb-24 md:pt-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur">
            <Zap className="h-3.5 w-3.5 text-accent" /> Alojamiento Web Rápido · Sin servidores complicados
          </div>
          <h1 className="font-display text-5xl font-bold leading-[1.08] md:text-7xl">
            Sube, aloja y publica tus
            <br />
            <span className="text-gradient-neon">páginas de venta y apps web</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            La plataforma todo en uno para alojar landing pages, calculadoras interactivas,
            micro-sitios y embudos en HTML con analíticas en tiempo real y enlaces directos de pago.
          </p>
          <div className="mt-8 flex flex-wrap justify-center items-center gap-4">
            <Button onClick={() => openAuth("signup")} size="lg" className="bg-gradient-neon text-background font-semibold glow-violet h-12 px-8 text-base">
              Empezar gratis ahora <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button onClick={() => openAuth("login")} variant="outline" size="lg" className="h-12 px-6">
              Iniciar sesión
            </Button>
          </div>
          <p className="mt-5 text-xs text-muted-foreground">
            Al registrarte aceptas los{" "}
            <button onClick={() => setTermsModalOpen(true)} className="text-accent underline-offset-4 hover:underline">
              Términos y Condiciones
            </button>{" "}
            de Zentry Link
          </p>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="relative mx-auto max-w-7xl px-6 pb-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Potencia total para tus proyectos digitales</h2>
          <p className="mt-2 text-muted-foreground">Diseñado para máxima velocidad de carga, alta conversión y facilidad absoluta.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              icon: Code2,
              t: "Alojamiento HTML Instantáneo",
              d: "Sube cualquier archivo HTML (páginas de venta, calculadoras, quizzes, mini-apps) y obtén tu enlace en vivo al instante.",
            },
            {
              icon: MousePointerClick,
              t: "Editor Visual de Enlaces de Pago",
              d: "Haz clic directamente sobre cualquier botón en la vista previa para actualizar tus enlaces de Hotmart, Stripe o WhatsApp.",
            },
            {
              icon: BarChart3,
              t: "Analíticas y Clics en Vivo",
              d: "Monitorea en tiempo real cuántas visitas recibes y cuántas personas hacen clic exactamente en tus botones de compra.",
            },
            {
              icon: Smartphone,
              t: "Optimización Móvil (iPhone 15)",
              d: "Tus páginas se adaptan fluidamente al 100% de los teléfonos inteligentes sin cortes laterales ni desbordamientos.",
            },
            {
              icon: Globe,
              t: "Dominio Propio y Slugs Limpios",
              d: "Usa subdominios personalizados o conecta tu propio dominio (.com) con certificados SSL automáticos incluidos.",
            },
            {
              icon: ShieldCheck,
              t: "Infraestructura Segura y Rápida",
              d: "Alojamiento en la nube de alta disponibilidad con base de datos PostgreSQL y almacenamiento protegido.",
            },
          ].map((f, i) => (
            <motion.div
              key={f.t}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="glass rounded-2xl p-6 border border-border/70 hover:border-accent/50 transition-colors"
            >
              <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                <f.icon className="h-5 w-5 text-accent" />
              </div>
              <h3 className="font-display text-lg font-semibold">{f.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Ventajas Adicionales */}
      <section id="ventajas" className="relative mx-auto max-w-7xl px-6 pb-24">
        <div className="rounded-3xl border border-border bg-card/60 p-8 md:p-12 backdrop-blur">
          <div className="grid gap-8 md:grid-cols-2 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs text-accent mb-4">
                <Sparkles className="h-3.5 w-3.5" /> Todo lo que tu negocio necesita
              </div>
              <h3 className="font-display text-2xl md:text-3xl font-bold">
                Olvídate de cPanel y configuraciones difíciles
              </h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Con Zentry Link no necesitas contratar servidores complicados, configurar DNS engorrosos ni escribir código backend. Solo subes tu archivo o añades tus bloques, configuras tus enlaces de pago y compartes tu URL.
              </p>
              <div className="mt-6 space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[var(--neon-green)]" />
                  <span>Soporte total para scripts interactivos y almacenamiento local (`localStorage`)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[var(--neon-green)]" />
                  <span>Sin caídas de servidor y con carga instantánea en cualquier red</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[var(--neon-green)]" />
                  <span>Panel de métricas con desglose individual de clics por botón</span>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-background/80 p-6 flex flex-col justify-center items-center text-center">
              <Layers className="h-16 w-16 text-accent mb-4" />
              <h4 className="font-display text-xl font-bold">Tu primera página es 100% gratis</h4>
              <p className="mt-2 text-xs text-muted-foreground max-w-xs">
                Crea tu cuenta en 30 segundos y empieza a publicar tus proyectos digitales hoy mismo.
              </p>
              <Button onClick={() => openAuth("signup")} className="mt-6 bg-gradient-neon text-background font-semibold w-full max-w-xs">
                Crear cuenta ahora
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="relative mx-auto max-w-5xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-10 md:p-14 text-center glow-violet">
          <div className="absolute inset-0 bg-gradient-neon opacity-10" />
          <h2 className="relative font-display text-3xl font-bold md:text-4xl">Empieza a alojar tus páginas hoy</h2>
          <p className="relative mt-3 text-muted-foreground max-w-xl mx-auto">
            Aloja tus páginas de venta, calculadoras y aplicaciones web sin límites técnicos ni demoras.
          </p>
          <Button onClick={() => openAuth("signup")} size="lg" className="relative mt-6 bg-gradient-neon text-background font-semibold text-base h-12 px-8">
            Crear mi primera página gratis
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-border py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Zentry Company · <Link to="/" className="hover:text-accent">Zentry Link</Link> · Plataforma de Alojamiento y Páginas Web
      </footer>

      {/* Auth Modal (Login / Signup by Email) */}
      <Dialog open={authModalOpen} onOpenChange={setAuthModalOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader className="text-left">
            <DialogTitle className="font-display text-2xl font-bold">
              {authMode === "signup" ? "Crear cuenta en Zentry Link" : "Iniciar sesión"}
            </DialogTitle>
            <DialogDescription>
              {authMode === "signup"
                ? "Ingresa tu correo y contraseña para empezar a alojar tus páginas."
                : "Ingresa tus credenciales para acceder a tu panel de control."}
            </DialogDescription>
          </DialogHeader>

          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 text-sm font-medium">
            <button
              type="button"
              onClick={() => setAuthMode("signup")}
              className={`rounded-md py-1.5 transition-all ${
                authMode === "signup" ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Registrarse
            </button>
            <button
              type="button"
              onClick={() => setAuthMode("login")}
              className={`rounded-md py-1.5 transition-all ${
                authMode === "login" ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Iniciar sesión
            </button>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4 pt-2">
            {authMode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="auth-name">Nombre completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="auth-name"
                    type="text"
                    placeholder="Tu nombre o negocio"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="auth-email">Correo electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="auth-email"
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="auth-password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="auth-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {authMode === "signup" && (
              <div className="flex items-start gap-2 pt-1 text-xs">
                <Checkbox
                  id="terms-check"
                  checked={acceptedTerms}
                  onCheckedChange={(v) => setAcceptedTerms(!!v)}
                  className="mt-0.5"
                />
                <label htmlFor="terms-check" className="text-muted-foreground leading-snug cursor-pointer">
                  Acepto los{" "}
                  <button
                    type="button"
                    onClick={() => setTermsModalOpen(true)}
                    className="text-accent underline hover:opacity-80"
                  >
                    Términos y Condiciones
                  </button>{" "}
                  de uso del servicio.
                </label>
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-neon text-background font-semibold mt-4 h-10"
            >
              {submitting
                ? "Procesando…"
                : authMode === "signup"
                ? "Crear mi cuenta"
                : "Entrar al Dashboard"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Terms and conditions modal */}
      <Dialog open={termsModalOpen} onOpenChange={setTermsModalOpen}>
        <DialogContent className="max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold">Términos y Condiciones de Zentry Link</DialogTitle>
            <DialogDescription>
              Información legal sobre el uso de la plataforma de alojamiento.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-64 rounded-md border border-border p-3 text-sm text-muted-foreground">
            <p className="mb-2"><strong className="text-foreground">1. Uso del servicio.</strong> Zentry Link te permite alojar, crear y publicar páginas de venta, landing pages y aplicaciones web en HTML optimizadas para móviles.</p>
            <p className="mb-2"><strong className="text-foreground">2. Contenido.</strong> Eres responsable de todo el contenido que publicas. No se permite contenido ilegal, fraudulento ni que infrinja derechos de autor.</p>
            <p className="mb-2"><strong className="text-foreground">3. Cuentas y Seguridad.</strong> Tu acceso y datos se procesan de forma segura a través de Supabase PostgreSQL y autenticación cifrada por correo y contraseña.</p>
            <p className="mb-2"><strong className="text-foreground">4. Planes y Límites.</strong> El plan Free permite alojar 1 página. Los planes Premium y VIP habilitan más páginas, imágenes HD, analíticas avanzadas y dominios personalizados.</p>
            <p className="mb-2"><strong className="text-foreground">5. Privacidad.</strong> Tus datos personales se utilizan únicamente para proveer el servicio de la plataforma.</p>
          </ScrollArea>
          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => setTermsModalOpen(false)}>
              Entendido
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
