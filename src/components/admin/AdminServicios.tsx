// src/components/admin/AdminServicios.tsx
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import {
  Truck,
  Store,
  Utensils,
  Clock,
  Phone,
  Star,
  ShieldCheck,
  MapPin,
  type LucideIcon,
} from "lucide-react";

type Servicio = {
  id: number;
  icono: string;
  titulo: string;
  descripcion: string;
  activa: boolean;
};

const ICONOS_MAP: Record<string, LucideIcon> = {
  truck: Truck,
  store: Store,
  utensils: Utensils,
  clock: Clock,
  phone: Phone,
  star: Star,
  "shield-check": ShieldCheck,
  "map-pin": MapPin,
};

const ICONOS_DISPONIBLES = [
  { value: "truck", label: "🚚 Delivery" },
  { value: "store", label: "🏪 Tienda" },
  { value: "utensils", label: "🍴 Cubiertos" },
  { value: "clock", label: "🕐 Reloj" },
  { value: "phone", label: "📞 Teléfono" },
  { value: "star", label: "⭐ Estrella" },
  { value: "shield-check", label: "🛡 Seguridad" },
  { value: "map-pin", label: "📍 Ubicación" },
];

const empty = { icono: "truck", titulo: "", descripcion: "" };

export default function AdminServicios() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Servicio | null>(null);
  const [form, setForm] = useState(empty);
  const [msg, setMsg] = useState<{ type: "ok" | "error"; text: string } | null>(
    null,
  );

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const { data } = await supabase.from("servicios").select("*").order("id");
    setServicios(data || []);
    setLoading(false);
  };

  const notify = (type: "ok" | "error", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3000);
  };

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setShowForm(true);
  };
  const openEdit = (s: Servicio) => {
    setEditing(s);
    setForm({ ...s });
    setShowForm(true);
  };
  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(empty);
  };

  const handleSave = async () => {
    if (!form.titulo) return notify("error", "El título es obligatorio");
    setSaving(true);
    const { error } = editing
      ? await supabase.from("servicios").update(form).eq("id", editing.id)
      : await supabase.from("servicios").insert(form);
    setSaving(false);
    if (error) return notify("error", "Error al guardar");
    notify("ok", editing ? "Servicio actualizado" : "Servicio creado");
    closeForm();
    fetchAll();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este servicio?")) return;
    const { error } = await supabase.from("servicios").delete().eq("id", id);
    if (error) return notify("error", "Error al eliminar");
    notify("ok", "Servicio eliminado");
    fetchAll();
  };

  const toggleActiva = async (s: Servicio) => {
    await supabase
      .from("servicios")
      .update({ activa: !s.activa })
      .eq("id", s.id);
    fetchAll();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Servicios</h2>
          <p className="text-zinc-500 text-sm">
            {servicios.length} servicios visibles en el sitio
          </p>
        </div>
        <button
          onClick={openNew}
          className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          + Nuevo servicio
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
          {servicios.map((s) => (
            <div
              key={s.id}
              className="bg-zinc-900 border border-white/8 rounded-xl p-4 flex items-center gap-4"
            >
              <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                {(() => {
                  const Icon = ICONOS_MAP[s.icono];
                  return Icon ? (
                    <Icon className="w-5 h-5 text-orange-400" />
                  ) : null;
                })()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm">{s.titulo}</p>
                <p className="text-zinc-500 text-xs mt-0.5 truncate">
                  {s.descripcion}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => toggleActiva(s)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${s.activa ? "border-green-500/30 text-green-400 hover:bg-green-500/10" : "border-white/10 text-zinc-500 hover:bg-white/5"}`}
                >
                  {s.activa ? "Activa" : "Oculta"}
                </button>
                <button
                  onClick={() => openEdit(s)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-white/8 text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-white/8 text-zinc-400 hover:text-red-400 hover:border-red-500/30 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}

          {servicios.length === 0 && (
            <div className="text-center py-16 text-zinc-600">
              No hay servicios configurados
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/8 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-white/8">
              <h3 className="text-white font-bold">
                {editing ? "Editar servicio" : "Nuevo servicio"}
              </h3>
              <button
                onClick={closeForm}
                className="text-zinc-500 hover:text-white text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-zinc-400 text-xs uppercase tracking-wider mb-1.5">
                  Ícono
                </label>
                <select
                  value={form.icono}
                  onChange={(e) => setForm({ ...form, icono: e.target.value })}
                  className="w-full bg-zinc-800 border border-white/8 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500"
                >
                  {ICONOS_DISPONIBLES.map((i) => (
                    <option key={i.value} value={i.value}>
                      {i.label}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-3 mt-2">
                  <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                    {(() => {
                      const Icon = ICONOS_MAP[form.icono];
                      return Icon ? (
                        <Icon className="w-5 h-5 text-orange-400" />
                      ) : null;
                    })()}
                  </div>
                  <span className="text-zinc-500 text-xs">
                    Preview del ícono
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 text-xs uppercase tracking-wider mb-1.5">
                  Título *
                </label>
                <input
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="ej: Delivery, Retiro en Local..."
                  className="w-full bg-zinc-800 border border-white/8 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-xs uppercase tracking-wider mb-1.5">
                  Descripción
                </label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) =>
                    setForm({ ...form, descripcion: e.target.value })
                  }
                  rows={3}
                  placeholder="Descripción breve del servicio..."
                  className="w-full bg-zinc-800 border border-white/8 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-white/8">
              <button
                onClick={closeForm}
                className="flex-1 border border-white/8 text-zinc-400 hover:text-white py-2.5 rounded-xl text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-medium py-2.5 rounded-xl text-sm transition-colors"
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
