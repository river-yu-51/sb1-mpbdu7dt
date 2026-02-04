import React from "react";
import { NavLink, Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `block px-3 py-2 rounded-lg text-sm ${
    isActive ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"
  }`;

export default function AdminLayout() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
        <aside className="bg-white border rounded-xl p-4 h-fit">
          <h2 className="font-bold text-lg">Admin</h2>
          <nav className="mt-3 space-y-1">
            <NavLink to="/admin" end className={linkClass}>Overview</NavLink>
            <NavLink to="/admin/availability" className={linkClass}>Availability</NavLink>
            <NavLink to="/admin/services" className={linkClass}>Services</NavLink>
            <NavLink to="/admin/faqs" className={linkClass}>FAQs</NavLink>
            {/* add more links as you create pages */}
          </nav>
        </aside>

        <main className="bg-white border rounded-xl p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
