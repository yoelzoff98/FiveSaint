"use client";

import { useState } from "react";
import Link from "next/link";
import { registerDistributorAction } from "./actions";
import { toggleDistributorActive } from "@/lib/supabase/comercial";
import { Button } from "@/components/ui/Button";
import { 
  Building2, 
  Plus, 
  Search, 
  CheckCircle, 
  XCircle, 
  Percent, 
  Eye, 
  Mail, 
  Phone, 
  MapPin, 
  User 
} from "lucide-react";

export interface Distributor {
  id: string;
  user_id: string;
  username: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  discount_percentage: number;
  is_active: boolean;
  created_at: string;
}

interface DistributorsPageClientProps {
  initialDistributors: Distributor[];
}

export function DistributorsPageClient({ initialDistributors }: DistributorsPageClientProps) {
  const [distributors, setDistributors] = useState<Distributor[]>(initialDistributors);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Estado del formulario de nuevo distribuidor
  const [formData, setFormData] = useState({
    username: "",
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    address: "",
    discountPercentage: 30,
    password: "",
  });

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const nextStatus = !currentStatus;
      await toggleDistributorActive(id, nextStatus);
      setDistributors(prev =>
        prev.map(d => (d.id === id ? { ...d, is_active: nextStatus } : d))
      );
    } catch (err: any) {
      alert(err.message || "Error al cambiar el estado del distribuidor.");
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await registerDistributorAction({
        username: formData.username,
        companyName: formData.companyName,
        contactName: formData.contactName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        discountPercentage: Number(formData.discountPercentage),
        password: formData.password,
      });

      if (res.success && res.distributor) {
        setDistributors(prev => [res.distributor, ...prev]);
        setSuccessMessage(`Distribuidor "${res.distributor.company_name}" creado exitosamente.`);
        setFormData({
          username: "",
          companyName: "",
          contactName: "",
          email: "",
          phone: "",
          address: "",
          discountPercentage: 30,
          password: "",
        });
        setIsModalOpen(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Error al crear el distribuidor.");
    } finally {
      setLoading(false);
    }
  };

  const filteredDistributors = distributors.filter(d =>
    d.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header y Acción */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-wide flex items-center gap-2">
            <Building2 className="w-7 h-7 text-accent-deep" />
            Distribuidores y Listas Personalizadas
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Administrá el acceso a distribuidores, asigná porcentajes de descuento y revisá su historial de operaciones.
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          variant="primary"
          className="flex items-center gap-2 px-5 py-2.5 shadow-md cursor-pointer shrink-0"
        >
          <Plus className="w-5 h-5" />
          Nuevo Distribuidor
        </Button>
      </div>

      {/* Mensajes Globales */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm flex justify-between items-center">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 font-bold ml-4">✕</button>
        </div>
      )}

      {/* Barra de Búsqueda */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex items-center gap-3">
        <Search className="w-5 h-5 text-stone-400" />
        <input
          type="text"
          placeholder="Buscar distribuidor por Razón Social, contacto, email o usuario..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent focus:outline-none text-stone-800 text-sm"
        />
      </div>

      {/* Grid de Distribuidores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDistributors.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center rounded-xl border border-stone-200 text-stone-500">
            No se encontraron distribuidores registrados.
          </div>
        ) : (
          filteredDistributors.map((d) => (
            <div 
              key={d.id} 
              className={`bg-white rounded-xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
                d.is_active ? "border-stone-200 hover:border-stone-300" : "border-red-200 bg-red-50/20"
              }`}
            >
              <div>
                {/* Header card */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg text-stone-900 leading-snug">{d.company_name}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-0.5">
                      <User className="w-3.5 h-3.5" />
                      <span>{d.contact_name}</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shrink-0 ${
                    d.is_active 
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200" 
                      : "bg-red-100 text-red-800 border border-red-200"
                  }`}>
                    {d.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {d.is_active ? "Activo" : "Inactivo"}
                  </span>
                </div>

                {/* Descuento Asignado */}
                <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 my-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-stone-700 font-semibold text-xs uppercase tracking-wider">
                    <Percent className="w-4 h-4 text-accent-deep" />
                    <span>Descuento Especial</span>
                  </div>
                  <div className="text-xl font-black text-accent-deep">
                    {d.discount_percentage}% <span className="text-xs font-normal text-stone-500">OFF</span>
                  </div>
                </div>

                {/* Contacto Info */}
                <div className="space-y-2 text-xs text-stone-600 mb-4">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span className="truncate">{d.email}</span>
                  </div>
                  {d.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>{d.phone}</span>
                    </div>
                  )}
                  {d.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="truncate">{d.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Botones de acción */}
              <div className="pt-4 border-t border-stone-150 flex items-center justify-between gap-2 mt-auto">
                <Link
                  href={`/admin-comercial/distribuidores/${d.id}`}
                  className="flex items-center gap-1.5 text-xs font-bold text-accent-deep hover:text-accent-deep/80 py-1.5 px-3 rounded-md hover:bg-stone-100 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Ver Historial / ID
                </Link>

                <button
                  onClick={() => handleToggleActive(d.id, d.is_active)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                    d.is_active 
                      ? "text-red-600 hover:bg-red-50" 
                      : "text-emerald-700 hover:bg-emerald-50"
                  }`}
                >
                  {d.is_active ? "Desactivar" : "Activar"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Nuevo Distribuidor */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                <Building2 className="w-6 h-6 text-accent-deep" />
                Registrar Nuevo Distribuidor
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs mb-4">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-stone-700 uppercase">Razón Social / Empresa *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Distribuidora San Martín"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-800 focus:ring-2 focus:ring-accent-deep focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-stone-700 uppercase">Contacto Responsable *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Roberto Gómez"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    className="px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-800 focus:ring-2 focus:ring-accent-deep focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-stone-700 uppercase">Usuario de Acceso *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej: distri_sanmartin"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-800 focus:ring-2 focus:ring-accent-deep focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-stone-700 uppercase">Email Corporativo *</label>
                  <input
                    type="email"
                    required
                    placeholder="distribuidora@ejemplo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-800 focus:ring-2 focus:ring-accent-deep focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-stone-700 uppercase">% Descuento Asignado *</label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      required
                      min="0"
                      max="100"
                      step="0.5"
                      placeholder="30"
                      value={formData.discountPercentage}
                      onChange={(e) => setFormData({ ...formData, discountPercentage: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm font-bold text-accent-deep focus:ring-2 focus:ring-accent-deep focus:outline-none pr-8"
                    />
                    <span className="absolute right-3 font-bold text-stone-400">%</span>
                  </div>
                  <p className="text-[10px] text-stone-500 mt-0.5">Porcentaje de descuento sobre la lista base.</p>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-stone-700 uppercase">Contraseña Inicial *</label>
                  <input
                    type="password"
                    required
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-800 focus:ring-2 focus:ring-accent-deep focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-stone-700 uppercase">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="Ej. +54 11 1234-5678"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-800 focus:ring-2 focus:ring-accent-deep focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-stone-700 uppercase">Dirección / Depósito</label>
                  <input
                    type="text"
                    placeholder="Ej. Av. Mitre 1234, CABA"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-800 focus:ring-2 focus:ring-accent-deep focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg text-sm font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <Button
                  type="submit"
                  variant="primary"
                  className="px-6 py-2 cursor-pointer text-sm font-semibold"
                  disabled={loading}
                >
                  {loading ? "Creando..." : "Crear Distribuidor"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
