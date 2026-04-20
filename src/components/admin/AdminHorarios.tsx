// src/components/admin/AdminHorarios.tsx
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

type Horario = {
  id: number;
  dia: string;
  hora_inicio: string;
  hora_fin: string;
  cerrado: boolean;
};

const DIAS = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo",
];
const DIAS_LABEL: Record<string, string> = {
  lunes: "Lunes",
  martes: "Martes",
  miercoles: "Miércoles",
  jueves: "Jueves",
  viernes: "Viernes",
  sabado: "Sábado",
  domingo: "Domingo",
};

export default function AdminHorarios() {
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "error"; text: string } | null>(
    null,
  );

  useEffect(() => {
    fetchHorarios();
  }, []);

  const fetchHorarios = async () => {
    setLoading(true);
    const { data } = await supabase.from("horarios").select("*");
    // ordenar por día de la semana
    const sorted = (data || []).sort(
      (a, b) => DIAS.indexOf(a.dia) - DIAS.indexOf(b.dia),
    );
    setHorarios(sorted);
    setLoading(false);
  };

  const notify = (type: "ok" | "error", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3000);
  };

  const update = (id: number, field: keyof Horario, value: any) => {
    setHorarios((prev) =>
      prev.map((h) => (h.id === id ? { ...h, [field]: value } : h)),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    const updates = horarios.map((h) =>
      supabase
        .from("horarios")
        .update({
          hora_inicio: h.hora_inicio,
          hora_fin: h.hora_fin,
          cerrado: h.cerrado,
        })
        .eq("id", h.id),
    );
    const results = await Promise.all(updates);
    setSaving(false);
    const hasError = results.some((r) => r.error);
    if (hasError) return notify("error", "Error al guardar algunos horarios");
    notify("ok", "Horarios guardados");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Horarios</h2>
          <p className="text-zinc-500 text-sm">
            Horario de atención del restaurante
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>

      {msg && (
        <div
          className={`mb-4 px-4 py-3 rounded-xl text-sm ${msg.type === "ok" ? "bg-green-500/10 border border-green-500/20 text-green-400" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}
        >
          {msg.text}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {horarios.map((h) => (
            <div
              key={h.id}
              className={`bg-zinc-900 border rounded-xl p-4 flex items-center gap-4 flex-wrap ${h.cerrado ? "border-white/4 opacity-60" : "border-white/8"}`}
            >
              {/* día */}
              <div className="w-28">
                <p className="text-white font-medium text-sm">
                  {DIAS_LABEL[h.dia]}
                </p>
              </div>

              {/* cerrado toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={h.cerrado}
                  onChange={(e) => update(h.id, "cerrado", e.target.checked)}
                  className="w-4 h-4 accent-orange-500"
                />
                <span className="text-zinc-400 text-sm">Cerrado</span>
              </label>

              {/* horas */}
              {!h.cerrado && (
                <div className="flex items-center gap-3 flex-1">
                  <div>
                    <label className="block text-zinc-500 text-xs mb-1">
                      Abre
                    </label>
                    <input
                      type="time"
                      value={h.hora_inicio?.slice(0, 5) || ""}
                      onChange={(e) =>
                        update(h.id, "hora_inicio", e.target.value + ":00")
                      }
                      className="bg-zinc-800 border border-white/8 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <span className="text-zinc-600 mt-4">—</span>
                  <div>
                    <label className="block text-zinc-500 text-xs mb-1">
                      Cierra
                    </label>
                    <input
                      type="time"
                      value={h.hora_fin?.slice(0, 5) || ""}
                      onChange={(e) =>
                        update(h.id, "hora_fin", e.target.value + ":00")
                      }
                      className="bg-zinc-800 border border-white/8 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              )}

              {h.cerrado && (
                <span className="text-zinc-600 text-sm italic">
                  No hay atención este día
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
