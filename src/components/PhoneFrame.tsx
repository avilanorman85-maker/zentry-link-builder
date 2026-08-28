import { ReactNode } from "react";

export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[360px] shrink-0 select-none">
      {/* Chasis exterior iPhone 15 Pro */}
      <div className="relative rounded-[3.2rem] border-[9px] border-[#141417] bg-[#141417] p-1 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.8),0_0_25px_rgba(167,139,250,0.18)] ring-1 ring-white/10">
        
        {/* Dynamic Island minimalista */}
        <div className="pointer-events-none absolute left-1/2 top-2.5 z-30 h-4 w-20 -translate-x-1/2 rounded-full bg-black flex items-center justify-end px-1.5 shadow-sm">
          <div className="h-2 w-2 rounded-full bg-[#0d0d0f] ring-1 ring-white/10" />
        </div>

        {/* Contenedor de pantalla (adaptable a la altura del viewport) */}
        <div className="relative h-[740px] lg:h-[calc(100vh-110px)] lg:min-h-[720px] lg:max-h-[850px] overflow-hidden rounded-[2.6rem] bg-background text-foreground shadow-inner flex flex-col">
          
          {/* Barra de estado iPhone */}
          <div className="relative z-20 flex h-6 shrink-0 items-center justify-between px-6 pt-0.5 text-[10px] font-semibold text-muted-foreground/80 bg-background/80 backdrop-blur-md">
            <span>9:41</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px]">5G</span>
              <div className="h-2 w-3.5 rounded-[2.5px] border border-current p-0.5 flex items-center">
                <div className="h-full w-full bg-current rounded-[0.5px]" />
              </div>
            </div>
          </div>

          {/* Contenido de la pantalla: ocupa el 100% de la altura sin espacios en blanco */}
          <div className="flex-1 w-full h-[calc(100%-2.25rem)] overflow-hidden bg-background flex flex-col">
            {children}
          </div>

          {/* Indicador de inicio inferior (Home Bar) */}
          <div className="pointer-events-none relative z-30 h-3 shrink-0 flex items-center justify-center bg-background/40 backdrop-blur-xs">
            <div className="h-1 w-28 rounded-full bg-foreground/25" />
          </div>
        </div>
      </div>
    </div>
  );
}
