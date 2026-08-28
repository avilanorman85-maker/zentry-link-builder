import { Crown, Check, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export function PaywallModal({
  open,
  onOpenChange,
  feature = "esta función",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  feature?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden border-0 p-0">
        <div className="relative bg-gradient-to-br from-primary via-primary to-accent p-6 text-background">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_10%,white,transparent_40%)]" />
          <DialogHeader className="relative">
            <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full bg-background/20 px-3 py-1 text-xs font-semibold backdrop-blur">
              <Crown className="h-3 w-3" /> Zentry Link Pro
            </div>
            <DialogTitle className="font-display text-2xl">Desbloquea {feature}</DialogTitle>
          </DialogHeader>
          <ul className="relative mt-4 space-y-2 text-sm">
            {["Recetas ilimitadas", "Constructor visual avanzado", "Enlaces personalizados", "Sin marca de agua", "Estadísticas detalladas"].map((f) => (
              <li key={f} className="flex items-center gap-2">
                <Check className="h-4 w-4" /> {f}
              </li>
            ))}
          </ul>
          <div className="relative mt-6 flex gap-2">
            <Button asChild className="flex-1 bg-background text-foreground hover:bg-background/90">
              <Link to="/app/subscription" onClick={() => onOpenChange(false)}>Ver planes →</Link>
            </Button>
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-background hover:bg-background/20">
              <Lock className="mr-1 h-3 w-3" /> Más tarde
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
