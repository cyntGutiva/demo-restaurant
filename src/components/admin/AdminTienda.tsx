// src/components/admin/AdminTienda.tsx
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

type InfoItem = {
  id: number;
  clave: string;
  valor: string;
  descripcion: string;
};

interface ContactInfoProps {
  direccion: string;
  comuna: string;
  telefono: string;
}

const GRUPOS = [
  {
    titulo: "Información básica",
    claves: ["slogan", "direccion", "comuna", "telefono", "email"],
  },
  {
    titulo: "WhatsApp y pedidos",
    claves: [
      "whatsapp",
      "mensaje_whatsapp",
      "tiempo_entrega",
      "pedido_minimo",
      "costo_delivery",
      "zona_delivery",
    ],
  },
  {
    titulo: "Servicios disponibles",
    claves: ["delivery_activo", "retiro_activo", "consumo_local_activo"],
  },
  {
    titulo: "Redes sociales",
    claves: ["instagram", "facebook", "google_maps_url"],
  },
];

const BOOLEAN_KEYS = [
  "delivery_activo",
  "retiro_activo",
  "consumo_local_activo",
];

export default function AdminTienda() {
  const [info, setInfo] = useState<Record<string, string>>({});
  const [ids, setIds] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "error"; text: string } | null>(
    null,
  );
  const [descripciones, setDescripciones] = useState<Record<string, string>>(
    {},
  );

  useEffect(() => {
    fetchInfo();
  }, []);

  const fetchInfo = async () => {
    setLoading(true);
    const { data } = await supabase.from("info_tienda").select("*");
    const map: Record<string, string> = {};
    const idMap: Record<string, number> = {};
    const descMap: Record<string, string> = {};

    (data || []).forEach((item: InfoItem) => {
      map[item.clave] = item.valor;
      idMap[item.clave] = item.id;
      descMap[item.clave] = item.descripcion;
    });

    setInfo(map);
    setIds(idMap);
    setDescripciones(descMap);
    setLoading(false);
  };

  const notify = (type: "ok" | "error", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    // Usamos Promise.all para actualizar cada registro por su ID
    const updates = Object.entries(info).map(([clave, valor]) =>
      supabase.from("info_tienda").update({ valor }).eq("id", ids[clave]),
    );

    const results = await Promise.all(updates);
    setSaving(false);

    if (results.some((r) => r.error))
      return notify("error", "Error al guardar");
    notify("ok", "Información guardada correctamente");
  };

  const update = (clave: string, valor: string) => {
    setInfo((prev) => ({ ...prev, [clave]: valor }));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Info del restaurante</h2>
          <p className="text-zinc-500 text-sm">
            Datos que aparecen en el sitio web
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors shadow-lg shadow-orange-500/20"
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>

      {msg && (
        <div
          className={`mb-4 px-4 py-3 rounded-xl text-sm border ${
            msg.type === "ok"
              ? "bg-green-500/10 border-green-500/20 text-green-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className="space-y-6">
        {GRUPOS.map((grupo) => (
          <div
            key={grupo.titulo}
            className="bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden shadow-xl"
          >
            <div className="px-6 py-4 border-b border-white/5 bg-white/2">
              <h3 className="text-white font-semibold text-sm">
                {grupo.titulo}
              </h3>
            </div>

            <div className="p-6 space-y-5">
              {grupo.claves
                .filter((k) => k in info)
                .map((clave) => (
                  <div key={clave} className="group">
                    <label className="block text-zinc-500 text-xs uppercase tracking-widest mb-2 font-medium group-focus-within:text-orange-400 transition-colors">
                      {descripciones[clave] || clave}
                    </label>

                    {BOOLEAN_KEYS.includes(clave) ? (
                      <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-zinc-800/50 border border-white/5 hover:border-white/10 transition-all">
                        <input
                          type="checkbox"
                          checked={info[clave] === "true"}
                          onChange={(e) =>
                            update(clave, e.target.checked ? "true" : "false")
                          }
                          className="w-5 h-5 accent-orange-500 cursor-pointer"
                        />
                        <span className="text-zinc-300 text-sm font-medium">
                          {info[clave] === "true" ? "Activado" : "Desactivado"}
                        </span>
                      </label>
                    ) : (
                      <div className="space-y-3">
                        <input
                          value={info[clave] || ""}
                          onChange={(e) => update(clave, e.target.value)}
                          placeholder={`Ingresa ${clave}...`}
                          className="w-full bg-zinc-800 border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all"
                        />

                        {/* Lógica del Mapa integrada solo para la clave direccion */}
                        {clave === "comuna" && info["direccion"] && (
                          <div className="relative w-full h-48 rounded-xl overflow-hidden border border-white/10 mt-3">
                            <iframe
                              title="Preview Mapa"
                              width="100%"
                              height="100%"
                              style={{ border: 0 }}
                              src={`https://maps.google.com/maps?q=${encodeURIComponent(`${info["direccion"]} ${info["comuna"] || ""}`)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                              className="opacity-80"
                            ></iframe>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
