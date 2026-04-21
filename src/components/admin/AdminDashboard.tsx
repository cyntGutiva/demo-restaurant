// src/components/admin/AdminDashboard.tsx
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

import AdminCarta from "./AdminCarta";
import AdminCategorias from "./AdminCategorias";
import AdminHorarios from "./AdminHorarios";
import AdminTienda from "./AdminTienda";
import AdminServicios from "./AdminServicios";

type Section = "carta" | "categorias" | "horarios" | "tienda" | "servicios";

const navItems = [
  { id: "carta", label: "Carta", icon: "🍗" },
  { id: "categorias", label: "Categorías", icon: "📂" },
  { id: "horarios", label: "Horarios", icon: "🕐" },
  { id: "tienda", label: "Tienda", icon: "🏪" },
  { id: "servicios", label: "Servicios", icon: "⚡" },
];

export default function AdminDashboard() {
  const [section, setSection] = useState<Section>("carta");
  const [checking, setChecking] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        window.location.href = "/admin/login";
      } else {
        setUserEmail(session.user.email || "");
        setChecking(false);
      }
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/admin/login";
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-white/8 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <span className="text-xl">🍗</span>
          <div>
            <p className="text-white font-semibold text-sm leading-none">
              Panel Admin
            </p>
            <p className="text-zinc-500 text-xs mt-0.5">Fried Chicken</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-zinc-500 text-xs hidden sm:block">
            {userEmail}
          </span>
          <button
            onClick={handleLogout}
            className="text-xs text-zinc-400 hover:text-red-400 border border-white/8 hover:border-red-500/30 px-3 py-1.5 rounded-lg transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar desktop */}
        <aside className="hidden sm:flex flex-col w-52 bg-zinc-900 border-r border-white/8 p-3 gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setSection(item.id as Section)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                section === item.id
                  ? "bg-orange-500 text-white"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </aside>

        {/* Nav mobile */}
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-white/8 flex z-10">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setSection(item.id as Section)}
              className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs transition-colors ${
                section === item.id ? "text-orange-500" : "text-zinc-500"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        {/* Contenido */}
        <main className="flex-1 p-4 sm:p-6 pb-20 sm:pb-6 overflow-auto">
          {section === "carta" && <AdminCarta />}
          {section === "categorias" && <AdminCategorias />}
          {section === "servicios" && <AdminServicios />}
          {section === "horarios" && <AdminHorarios />}
          {section === "tienda" && <AdminTienda />}
        </main>
      </div>
    </div>
  );
}
