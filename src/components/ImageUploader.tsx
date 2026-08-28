import { useRef, useState, DragEvent } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/hooks/use-auth";
import { toast } from "sonner";

const ACCEPT = "image/png,image/jpeg,image/webp";
const MAX_BYTES = 5 * 1024 * 1024;

async function uploadOne(userId: string, file: File): Promise<string | null> {
  if (!ACCEPT.split(",").includes(file.type)) {
    toast.error(`${file.name}: formato no soportado (PNG, JPG, WebP)`);
    return null;
  }
  if (file.size > MAX_BYTES) {
    toast.error(`${file.name}: máximo 5 MB`);
    return null;
  }
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("page-assets").upload(path, file, { upsert: false, contentType: file.type });
  if (error) {
    toast.error(error.message);
    return null;
  }
  const { data } = supabase.storage.from("page-assets").getPublicUrl(path);
  return data.publicUrl;
}

export function ImageUploader({
  value,
  onChange,
  label = "Arrastra una imagen o haz clic para subir",
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}) {
  const { user } = useAuth();
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);

  const handle = async (files: FileList | null) => {
    if (!files?.length || !user) return;
    setBusy(true);
    const url = await uploadOne(user.id, files[0]);
    setBusy(false);
    if (url) onChange(url);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    handle(e.dataTransfer.files);
  };

  if (value) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-border">
        <img src={value} alt="" className="aspect-video w-full object-cover" />
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white hover:bg-black"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      onClick={() => ref.current?.click()}
      className={`group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition ${
        over ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 bg-card"
      }`}
    >
      {busy ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <Upload className="h-6 w-6 text-accent" />}
      <p className="text-sm font-medium">{busy ? "Subiendo…" : label}</p>
      <p className="text-xs text-muted-foreground">PNG, JPG, WebP · hasta 5 MB</p>
      <input ref={ref} type="file" accept={ACCEPT} className="hidden" onChange={(e) => handle(e.target.files)} />
    </div>
  );
}

export function MultiImageUploader({
  value,
  onChange,
  max = 8,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}) {
  const { user } = useAuth();
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);

  const handle = async (files: FileList | null) => {
    if (!files?.length || !user) return;
    const remaining = max - value.length;
    if (remaining <= 0) { toast.error(`Máximo ${max} imágenes`); return; }
    setBusy(true);
    const arr = Array.from(files).slice(0, remaining);
    const results = await Promise.all(arr.map((f) => uploadOne(user.id, f)));
    setBusy(false);
    const ok = results.filter((u): u is string => !!u);
    if (ok.length) onChange([...value, ...ok]);
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); handle(e.dataTransfer.files); }}
        onClick={() => ref.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed p-6 text-center transition ${
          over ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 bg-card"
        }`}
      >
        {busy ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <Upload className="h-5 w-5 text-accent" />}
        <p className="text-sm font-medium">{busy ? "Subiendo…" : "Arrastra imágenes o haz clic"}</p>
        <p className="text-xs text-muted-foreground">{value.length}/{max} · PNG, JPG, WebP</p>
        <input ref={ref} type="file" accept={ACCEPT} multiple className="hidden" onChange={(e) => handle(e.target.files)} />
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {value.map((u, i) => (
            <div key={u + i} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
              <img src={u} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => onChange(value.filter((_, k) => k !== i))}
                className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white opacity-0 transition group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
