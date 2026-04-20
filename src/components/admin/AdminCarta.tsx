// src/components/admin/AdminCarta.tsx
import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";

type Categoria = { id: number; nombre: string };
type Producto = {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria_id: number;
  image_url: string;
  stock: number;
  disponible: boolean;
  destacado: boolean;
  orden: number;
};

const empty: Omit<Producto, "id"> = {
  nombre: "",
  descripcion: "",
  precio: 0,
  categoria_id: 0,
  image_url: "",
  stock: -1,
  disponible: true,
  destacado: false,
  orden: 0,
};

export default function AdminCarta() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Producto | null>(null);
  const [form, setForm] = useState(empty);
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState<{ type: "ok" | "error"; text: string } | null>(
    null,
  );
  const [uploadingImg, setUploadingImg] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // Nuevo: guarda el archivo físico

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from("productos").select("*").order("orden"),
      supabase.from("categorias").select("id, nombre").order("orden"),
    ]);
    setProductos(prods || []);
    setCategorias(cats || []);
    setLoading(false);
  };

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setPreviewUrl("");
    setShowForm(true);
  };

  const openEdit = (p: Producto) => {
    setEditing(p);
    setForm({ ...p });
    setPreviewUrl(p.image_url || "");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(empty);
    setPreviewUrl("");
  };

  const notify = (type: "ok" | "error", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3000);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/"))
      return notify("error", "Solo se permiten imágenes");

    if (file.size > 2 * 1024 * 1024)
      return notify("error", "La imagen no puede superar 2MB");

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    // setUploadingImg(true);
    // const ext = file.name.split(".").pop();
    // const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    // const { error } = await supabase.storage
    //   .from("menu")
    //   .upload(fileName, file, { upsert: false });

    // if (error) {
    //   notify("error", "Error al subir imagen");
    //   setUploadingImg(false);
    //   return;
    // }

    // const { data } = supabase.storage.from("menu").getPublicUrl(fileName);
    // setForm((prev) => ({ ...prev, image_url: data.publicUrl }));
    // setPreviewUrl(data.publicUrl);
    // setUploadingImg(false);
    // notify("ok", "Imagen subida correctamente");
  };

  const handleDeleteImage = async () => {
    if (!form.image_url) return;
    const fileName = form.image_url.split("/").pop();
    if (fileName) await supabase.storage.from("menu").remove([fileName]);
    setForm((prev) => ({ ...prev, image_url: "" }));
    setPreviewUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async () => {
    if (!form.nombre || !form.precio)
      return notify("error", "Nombre y precio son obligatorios");

    setSaving(true);
    let currentImageUrl = form.image_url;

    try {
      // 1. SUBIR IMAGEN SI HAY UNA NUEVA SELECCIONADA
      if (selectedFile) {
        const ext = selectedFile.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("menu")
          .upload(fileName, selectedFile);

        if (uploadError) throw new Error("Error al subir la imagen");

        const { data } = supabase.storage.from("menu").getPublicUrl(fileName);
        currentImageUrl = data.publicUrl;
      }

      // 2. PREPARAR PAYLOAD FINAL
      // Importante: No uses ...form directamente si quieres asegurar los tipos numéricos
      const payload = {
        nombre: form.nombre,
        descripcion: form.descripcion,
        precio: Number(form.precio),
        categoria_id: Number(form.categoria_id) || null,
        image_url: currentImageUrl, // Aquí asignamos la URL subida
        stock: Number(form.stock),
        disponible: form.disponible,
        destacado: form.destacado,
        orden: form.orden,
      };

      // 3. GUARDAR EN LA BASE DE DATOS
      const { error } = editing
        ? await supabase.from("productos").update(payload).eq("id", editing.id)
        : await supabase.from("productos").insert(payload);

      if (error) throw error;

      // 4. ÉXITO Y LIMPIEZA
      notify("ok", editing ? "Producto actualizado" : "Producto creado");
      setSelectedFile(null);
      closeForm();
      fetchAll();
    } catch (err: any) {
      console.error(err);
      notify("error", err.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este producto?")) return;
    const { error } = await supabase.from("productos").delete().eq("id", id);
    if (error) return notify("error", "Error al eliminar");
    notify("ok", "Producto eliminado");
    fetchAll();
  };

  const toggleDisponible = async (p: Producto) => {
    await supabase
      .from("productos")
      .update({ disponible: !p.disponible })
      .eq("id", p.id);
    fetchAll();
  };

  const filtered = productos.filter((p) =>
    p.nombre.toLowerCase().includes(search.toLowerCase()),
  );

  const catNombre = (id: number) =>
    categorias.find((c) => c.id === id)?.nombre || "—";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Carta</h2>
          <p className="text-zinc-500 text-sm">{productos.length} productos</p>
        </div>
        <button
          onClick={openNew}
          className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          + Nuevo producto
        </button>
      </div>

      {msg && (
        <div
          className={`mb-4 px-4 py-3 rounded-xl text-sm ${msg.type === "ok" ? "bg-green-500/10 border border-green-500/20 text-green-400" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}
        >
          {msg.text}
        </div>
      )}

      <input
        type="text"
        placeholder="Buscar producto..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full mb-4 bg-zinc-900 border border-white/8 rounded-xl px-4 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-orange-500"
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <div
              key={p.id}
              className={`bg-zinc-900 border rounded-xl p-4 flex items-center gap-4 ${p.disponible ? "border-white/8" : "border-white/4 opacity-60"}`}
            >
              <div className="w-12 h-12 rounded-lg bg-zinc-800 overflow-hidden flex-shrink-0">
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt={p.nombre}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">
                    🍗
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white font-medium text-sm truncate">
                    {p.nombre}
                  </p>
                  {p.destacado && (
                    <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">
                      Popular
                    </span>
                  )}
                  {p.stock === 0 && (
                    <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                      Agotado
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-zinc-500 text-xs">
                    {catNombre(p.categoria_id)}
                  </span>
                  <span className="text-orange-400 text-xs font-medium">
                    ${p.precio.toLocaleString("es-CL")}
                  </span>
                  {p.stock > 0 && (
                    <span className="text-zinc-500 text-xs">
                      Stock: {p.stock}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => toggleDisponible(p)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${p.disponible ? "border-green-500/30 text-green-400 hover:bg-green-500/10" : "border-white/10 text-zinc-500 hover:bg-white/5"}`}
                >
                  {p.disponible ? "Activo" : "Oculto"}
                </button>
                <button
                  onClick={() => openEdit(p)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-white/8 text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-white/8 text-zinc-400 hover:text-red-400 hover:border-red-500/30 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-16 text-zinc-600">
              No se encontraron productos
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/8 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-white/8">
              <h3 className="text-white font-bold">
                {editing ? "Editar producto" : "Nuevo producto"}
              </h3>
              <button
                onClick={closeForm}
                className="text-zinc-500 hover:text-white text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Imagen */}
              <div>
                <label className="block text-zinc-400 text-xs uppercase tracking-wider mb-1.5">
                  Imagen del producto
                </label>
                {previewUrl ? (
                  <div className="relative w-full h-40 rounded-xl overflow-hidden bg-zinc-800">
                    <img
                      src={previewUrl}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={handleDeleteImage}
                      className="absolute top-2 right-2 bg-black/60 hover:bg-red-500 text-white text-xs px-2 py-1 rounded-lg transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-32 border-2 border-dashed border-white/10 hover:border-orange-500/50 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors group"
                  >
                    {uploadingImg ? (
                      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="text-2xl mb-2">📷</span>
                        <p className="text-zinc-500 text-sm group-hover:text-zinc-300 transition-colors">
                          Clic para subir imagen
                        </p>
                        <p className="text-zinc-600 text-xs mt-1">
                          JPG, PNG o WEBP — máx 2MB
                        </p>
                      </>
                    )}
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

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
                <textarea
                  value={form.descripcion}
                  onChange={(e) =>
                    setForm({ ...form, descripcion: e.target.value })
                  }
                  rows={2}
                  className="w-full bg-zinc-800 border border-white/8 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 text-xs uppercase tracking-wider mb-1.5">
                    Precio (CLP) *
                  </label>
                  <input
                    type="number"
                    value={form.precio}
                    onChange={(e) =>
                      setForm({ ...form, precio: Number(e.target.value) })
                    }
                    className="w-full bg-zinc-800 border border-white/8 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs uppercase tracking-wider mb-1.5">
                    Stock (-1 = ilimitado)
                  </label>
                  <input
                    type="number"
                    value={form.stock}
                    onChange={(e) =>
                      setForm({ ...form, stock: Number(e.target.value) })
                    }
                    className="w-full bg-zinc-800 border border-white/8 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 text-xs uppercase tracking-wider mb-1.5">
                  Categoría
                </label>
                <select
                  value={form.categoria_id}
                  onChange={(e) =>
                    setForm({ ...form, categoria_id: Number(e.target.value) })
                  }
                  className="w-full bg-zinc-800 border border-white/8 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500"
                >
                  <option value={0}>Sin categoría</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.disponible}
                    onChange={(e) =>
                      setForm({ ...form, disponible: e.target.checked })
                    }
                    className="w-4 h-4 accent-orange-500"
                  />
                  <span className="text-zinc-300 text-sm">Disponible</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.destacado}
                    onChange={(e) =>
                      setForm({ ...form, destacado: e.target.checked })
                    }
                    className="w-4 h-4 accent-orange-500"
                  />
                  <span className="text-zinc-300 text-sm">Destacado</span>
                </label>
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
                disabled={saving || uploadingImg}
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
