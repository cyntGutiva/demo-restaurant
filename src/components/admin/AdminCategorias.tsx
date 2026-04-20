// src/components/admin/AdminCategorias.tsx
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

type Categoria = {
  id: number;
  nombre: string;
  descripcion: string;
  orden: number;
  activa: boolean;
};
const empty = { nombre: "", descripcion: "", orden: 0, activa: true };

export default function AdminCategorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Categoria | null>(null);
  const [form, setForm] = useState(empty);
  const [msg, setMsg] = useState<{ type: "ok" | "error"; text: string } | null>(
    null,
  );

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("categorias")
      .select("*")
      .order("orden");
    setCategorias(data || []);
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
  const openEdit = (c: Categoria) => {
    setEditing(c);
    setForm({ ...c });
    setShowForm(true);
  };
  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(empty);
  };

  const handleSave = async () => {
    if (!form.nombre) return notify("error", "El nombre es obligatorio");
    setSaving(true);
    const { error } = editing
      ? await supabase.from("categorias").update(form).eq("id", editing.id)
      : await supabase.from("categorias").insert(form);
    setSaving(false);
    if (error) return notify("error", "Error al guardar");
    notify("ok", editing ? "Categoría actualizada" : "Categoría creada");
    closeForm();
    fetchAll();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar esta categoría?")) return;
    const { error } = await supabase.from("categorias").delete().eq("id", id);
    if (error) return notify("error", "Error al eliminar");
    notify("ok", "Categoría eliminada");
    fetchAll();
  };

  const toggleActiva = async (c: Categoria) => {
    await supabase
      .from("categorias")
      .update({ activa: !c.activa })
      .eq("id", c.id);
    fetchAll();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Categorías</h2>
          <p className="text-zinc-500 text-sm">
            {categorias.length} categorías
          </p>
        </div>
        <button
          onClick={openNew}
          className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          + Nueva categoría
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
          {categorias.map((c) => (
            <div
              key={c.id}
              className={`bg-zinc-900 border rounded-xl p-4 flex items-center gap-4 ${c.activa ? "border-white/8" : "border-white/4 opacity-60"}`}
            >
              <div className="flex-1">
                <p className="text-white font-medium text-sm">{c.nombre}</p>
                {c.descripcion && (
                  <p className="text-zinc-500 text-xs mt-0.5">
                    {c.descripcion}
                  </p>
                )}
                <p className="text-zinc-600 text-xs mt-0.5">Orden: {c.orden}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActiva(c)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${c.activa ? "border-green-500/30 text-green-400 hover:bg-green-500/10" : "border-white/10 text-zinc-500 hover:bg-white/5"}`}
                >
                  {c.activa ? "Activa" : "Oculta"}
                </button>
                <button
                  onClick={() => openEdit(c)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-white/8 text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-white/8 text-zinc-400 hover:text-red-400 hover:border-red-500/30 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/8 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-white/8">
              <h3 className="text-white font-bold">
                {editing ? "Editar categoría" : "Nueva categoría"}
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
                  Nombre *
                </label>
                <input
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full bg-zinc-800 border border-white/8 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-zinc-400 text-xs uppercase tracking-wider mb-1.5">
                  Descripción
                </label>
                <input
                  value={form.descripcion}
                  onChange={(e) =>
                    setForm({ ...form, descripcion: e.target.value })
                  }
                  className="w-full bg-zinc-800 border border-white/8 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-zinc-400 text-xs uppercase tracking-wider mb-1.5">
                  Orden
                </label>
                <input
                  type="number"
                  value={form.orden}
                  onChange={(e) =>
                    setForm({ ...form, orden: Number(e.target.value) })
                  }
                  className="w-full bg-zinc-800 border border-white/8 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.activa}
                  onChange={(e) =>
                    setForm({ ...form, activa: e.target.checked })
                  }
                  className="w-4 h-4 accent-orange-500"
                />
                <span className="text-zinc-300 text-sm">Categoría activa</span>
              </label>
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
