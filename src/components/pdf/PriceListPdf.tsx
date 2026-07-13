import React, { forwardRef } from 'react';
import { banerasData, equipamientosData, ofertasData, spaDataPage1, spaDataPage2, spaOpcionalesData, platosDuchaData, columnasDuchaData, duchaEscocesaData, vaporData, banerasPremiumData, banerasPremiumInfo, saunaData } from '@/config/price-list-data';
import Image from 'next/image';

const CheckIcon = ({ color, size = 18 }: { color: string; size?: number }) => (
  <div
    className="rounded-full flex items-center justify-center shadow-sm shrink-0"
    style={{ backgroundColor: color, width: `${size}px`, height: `${size}px` }}
  >
    <svg
      style={{ width: `${size * 0.6}px`, height: `${size * 0.6}px` }}
      className="text-white"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={4}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  </div>
);

const DashIcon = ({ size = 18 }: { size?: number }) => (
  <span className="text-slate-300 font-bold leading-none select-none" style={{ fontSize: `${size * 0.9}px` }}>—</span>
);

// Helper to parse the unstructured offer description
const parseOfertaDescription = (desc: string) => {
  const hydroMatch = desc.match(/(\d+)\s*jet\s*de\s*caudal/i);
  const hydroCount = hydroMatch ? hydroMatch[1] : '4';

  const cervicalMatch = desc.match(/(\d+)\s*jet\s*cervicales/i);
  const cervicalCount = cervicalMatch ? cervicalMatch[1] : '2';

  const vistasMatch = desc.match(/vistas\s+([a-zA-ZáéíóúÁÉÍÓÚñÑ]+)/i);
  const vistas = vistasMatch ? vistasMatch[1] : 'cromo';

  const succion = desc.toLowerCase().includes('succión');

  const encendidoMatch = desc.match(/encendido\s+([a-zA-ZáéíóúÁÉÍÓÚñÑ]+)/i);
  const encendido = encendidoMatch ? encendidoMatch[1] : 'neumático';

  const reguladorAire = desc.toLowerCase().includes('regulador de aire');
  const sopapa = desc.toLowerCase().includes('sopapa');

  const desbordeMatch = desc.match(/desborde\s+([a-zA-ZáéíóúÁÉÍÓÚñÑ]+)/i);
  let desborde = desbordeMatch ? desbordeMatch[1] : 'plástico';
  if (desborde.endsWith('.')) {
    desborde = desborde.slice(0, -1);
  }

  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

  return {
    hydroJets: `${hydroCount} jets de caudal regulable individual`,
    cervicalJets: `${cervicalCount} jets`,
    vistas: capitalize(vistas),
    succion,
    encendido: capitalize(encendido),
    reguladorAire,
    sopapa,
    desborde: capitalize(desborde)
  };
};

// Icons for the offer specs table
const HydroJetsIcon = ({ className = "w-3.5 h-3.5 text-slate-500" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
  </svg>
);

const CervicalIcon = ({ className = "w-3.5 h-3.5 text-slate-500" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const VistasIcon = ({ className = "w-3.5 h-3.5 text-slate-500" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const SuccionIcon = ({ className = "w-3.5 h-3.5 text-slate-500" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="9" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8m-4-4l4 4 4-4" />
  </svg>
);

const EncendidoIcon = ({ className = "w-3.5 h-3.5 text-slate-500" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18.36 6.64a9 9 0 11-12.73 0M12 2v10" />
  </svg>
);

const ReguladorAireIcon = ({ className = "w-3.5 h-3.5 text-slate-500" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.59 4.59A2 2 0 1111 8H2m10.59 11.41A2 2 0 1014 16H2m15.73-8.27A2.5 2.5 0 1119.5 12H2" />
  </svg>
);

const SopapaIcon = ({ className = "w-3.5 h-3.5 text-slate-500" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a7 7 0 00-14 0v2M12 2v2" />
  </svg>
);

const DesbordeIcon = ({ className = "w-3.5 h-3.5 text-slate-500" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 4.79M9 11h.01M15 11h.01M12 11h.01" />
  </svg>
);

const CheckedCircleIcon = ({ size = 14 }: { size?: number }) => (
  <div className="bg-[#004a7c] text-white rounded-full flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
    <svg className="w-[70%] h-[70%]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  </div>
);

export const PriceListPdf = forwardRef<HTMLDivElement, {}>((props, ref) => {
  return (
    <div ref={ref} className="bg-white w-full print:bg-white text-slate-800 text-sm font-sans">

      {/* 
        PORTADA PRINCIPAL
      */}
      <div className="page-break-after p-0 h-[297mm] w-[210mm] mx-auto bg-accent-deep shadow-xl print:shadow-none relative overflow-hidden flex flex-col justify-center items-center">
        {/* Fondo Moderno Premium (Luces y Degradados) */}
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-accent-soft via-transparent to-transparent"></div>
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-accent-gold opacity-10 rounded-full blur-[100px]"></div>

        {/* Formas Abstractas (Ondas modernas) */}
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0,0 L100,0 L100,100 Q40,60 0,100 Z" className="fill-accent-soft opacity-30"></path>
            <path d="M0,100 Q50,40 100,100 Z" className="fill-white opacity-10"></path>
          </svg>
        </div>

        {/* Contenido Central */}
        <div className="relative z-10 flex flex-col items-center">
          {/* Imagen del Logo */}
          <div className="mb-20 relative z-10 w-64 h-64 flex justify-center items-center">
            <img src="/logo.png" alt="Five Saint" className="w-full h-full object-contain drop-shadow-xl" />
          </div>

          {/* Título Principal */}
          <h2 className="text-white text-4xl font-light tracking-[0.4em] uppercase mb-6 text-center drop-shadow-md">
            Acrílico <span className="font-black text-accent-gold">Sanitario</span>
          </h2>
          <div className="w-24 h-1.5 bg-accent-gold mb-16 rounded-full shadow-[0_0_15px_rgba(212,175,55,0.6)]"></div>
        </div>

        {/* Footer Portada */}
        <div className="absolute bottom-20 w-full flex justify-center z-10">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 text-white font-medium px-10 py-4 rounded-full shadow-xl tracking-widest uppercase text-sm flex items-center gap-4">
            Lista de Precios N°
            <div className="bg-accent-gold text-white font-black px-4 py-1 rounded-full shadow-inner text-base">
              17/26
            </div>
          </div>
        </div>
      </div>

      {/* 
        GUÍA DE CATÁLOGO & ÍNDICE (PÁGINA 2)
      */}
      <div className="page-break-after p-0 h-[297mm] max-h-[297mm] w-[210mm] mx-auto bg-white shadow-xl print:shadow-none relative overflow-hidden flex flex-col justify-between p-10">
        {/* Decorative background gradients */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-accent-soft via-transparent to-transparent"></div>

        {/* Header */}
        <div className="border-b-2 border-[#006699] pb-3 shrink-0 flex justify-between items-end">
          <div>
            <span className="text-[10px] font-black text-[#b08b5c] uppercase tracking-widest block mb-0.5">FIVE SAINT • BIENESTAR</span>
            <h1 className="text-2xl font-black text-[#004a7c] uppercase tracking-wide leading-none">GUÍA DE CATÁLOGO & ÍNDICE</h1>
          </div>
          <img src="/logo.png" alt="Five Saint Logo" className="h-10 object-contain" />
        </div>

        {/* Content Body Grid */}
        <div className="flex-grow grid grid-cols-12 gap-8 py-6 items-stretch">
          {/* Left Column (Brand info and Quality) */}
          <div className="col-span-5 bg-slate-50 border border-slate-100 rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-black text-[#004a7c] uppercase tracking-wider mb-2.5">CALIDAD DE MATERIALES</h3>
              <p className="text-[10px] text-slate-600 leading-relaxed text-justify mb-4">
                Todas nuestras bañeras y spas están fabricados con <strong>acrílico sanitario 100% virgen</strong> termoformado de origen importado, reforzado con fibra de vidrio y resina poliéster de alta resistencia, garantizando un acabado brillante, durabilidad excepcional y fácil mantenimiento.
              </p>
              <h3 className="text-xs font-black text-[#004a7c] uppercase tracking-wider mb-2.5">FILOSOFÍA FIVE SAINT</h3>
              <p className="text-[10px] text-slate-600 leading-relaxed text-justify">
                Diseñamos soluciones de hidromasaje y bienestar que transforman el baño cotidiano en un santuario personal de relajación, renovación física y descanso mental.
              </p>
            </div>

            {/* Quality Seals */}
            <div className="border-t border-slate-200/60 pt-4 flex flex-col gap-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#004a7c]/10 flex items-center justify-center text-[#004a7c] shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-700 block leading-tight">100% ACRÍLICO</span>
                  <span className="text-[8px] text-slate-500 block">Sanitario de alta resistencia y brillo</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#b08b5c]/10 flex items-center justify-center text-[#b08b5c] shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-700 block leading-tight">GARANTÍA DE FÁBRICA</span>
                  <span className="text-[8px] text-slate-500 block">Respaldo directo de Five Saint</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#006699]/10 flex items-center justify-center text-[#006699] shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-700 block leading-tight">PRODUCCIÓN NACIONAL</span>
                  <span className="text-[8px] text-slate-500 block">Tecnología y diseño de vanguardia</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (Index & Directory) */}
          <div className="col-span-7 flex flex-col justify-between py-1">
            <h3 className="text-xs font-black text-[#004a7c] uppercase tracking-wider mb-3 border-b border-slate-100 pb-1.5 shrink-0">SECCIONES DEL CATÁLOGO</h3>
            <div className="flex-grow flex flex-col gap-3 justify-center">
              {/* Item 1 */}
              <div className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-[#004a7c] text-white flex items-center justify-center font-black text-[10px] shrink-0 shadow-sm mt-0.5">01</div>
                <div>
                  <h4 className="text-[10px] font-black text-[#004a7c] uppercase leading-tight">Línea Premium (Showcase)</h4>
                  <p className="text-[9px] text-slate-600 leading-snug mt-0.5">Modelos de alta gama con diseños anatómicos exclusivos y equipamiento premium.</p>
                </div>
              </div>
              {/* Item 2 */}
              <div className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-[#004a7c] text-white flex items-center justify-center font-black text-[10px] shrink-0 shadow-sm mt-0.5">02</div>
                <div>
                  <h4 className="text-[10px] font-black text-[#004a7c] uppercase leading-tight">Bañeras de Línea</h4>
                  <p className="text-[9px] text-slate-600 leading-snug mt-0.5">Gama clásica y moderna de bañeras con variadas opciones de medidas y volúmenes.</p>
                </div>
              </div>
              {/* Item 3 */}
              <div className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-[#004a7c] text-white flex items-center justify-center font-black text-[10px] shrink-0 shadow-sm mt-0.5">03</div>
                <div>
                  <h4 className="text-[10px] font-black text-[#004a7c] uppercase leading-tight">Equipamiento Adicional</h4>
                  <p className="text-[9px] text-slate-600 leading-snug mt-0.5">Opcionales y accesorios para configurar y potenciar la experiencia de masaje.</p>
                </div>
              </div>
              {/* Item 4 */}
              <div className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-[#004a7c] text-white flex items-center justify-center font-black text-[10px] shrink-0 shadow-sm mt-0.5">04</div>
                <div>
                  <h4 className="text-[10px] font-black text-[#004a7c] uppercase leading-tight">Ofertas Especiales</h4>
                  <p className="text-[9px] text-slate-600 leading-snug mt-0.5">Modelos con equipamiento de hidromasaje completo incluido a precios especiales.</p>
                </div>
              </div>
              {/* Item 5 */}
              <div className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-[#004a7c] text-white flex items-center justify-center font-black text-[10px] shrink-0 shadow-sm mt-0.5">05</div>
                <div>
                  <h4 className="text-[10px] font-black text-[#004a7c] uppercase leading-tight">Línea Spa & Opcionales</h4>
                  <p className="text-[9px] text-slate-600 leading-snug mt-0.5">Minipiscinas y spas de alto rendimiento para el confort en interiores y exteriores.</p>
                </div>
              </div>
              {/* Item 6 */}
              <div className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-[#004a7c] text-white flex items-center justify-center font-black text-[10px] shrink-0 shadow-sm mt-0.5">06</div>
                <div>
                  <h4 className="text-[10px] font-black text-[#004a7c] uppercase leading-tight">Ducha, Vapor y Saunas</h4>
                  <p className="text-[9px] text-slate-600 leading-snug mt-0.5">Platos de ducha reforzados, columnas escocesas, saunas secos y generadores de vapor.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Legend of Icons & Symbols */}
        <div className="border-t border-slate-200 pt-5 mt-auto shrink-0">
          <h3 className="text-[10px] font-black text-[#004a7c] uppercase tracking-wider mb-3">GUÍA DE ICONOS & EQUIPAMIENTOS</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="flex gap-2">
              <HydroJetsIcon className="w-4 h-4 text-[#004a7c] shrink-0 mt-0.5" />
              <div>
                <span className="text-[8.5px] font-black text-slate-800 block">Hidromasaje</span>
                <span className="text-[7.5px] text-slate-500 leading-tight block">Cantidad de jets regulables instalados en el casco.</span>
              </div>
            </div>
            <div className="flex gap-2">
              <CervicalIcon className="w-4 h-4 text-[#004a7c] shrink-0 mt-0.5" />
              <div>
                <span className="text-[8.5px] font-black text-slate-800 block">Jets Cervicales</span>
                <span className="text-[7.5px] text-slate-500 leading-tight block">Jets superiores orientados al cuello y cervicales.</span>
              </div>
            </div>
            <div className="flex gap-2">
              <VistasIcon className="w-4 h-4 text-[#004a7c] shrink-0 mt-0.5" />
              <div>
                <span className="text-[8.5px] font-black text-slate-800 block">Vistas</span>
                <span className="text-[7.5px] text-slate-500 leading-tight block">Terminación estética de los jets (Cromo de alta calidad).</span>
              </div>
            </div>
            <div className="flex gap-2">
              <SuccionIcon className="w-4 h-4 text-[#004a7c] shrink-0 mt-0.5" />
              <div>
                <span className="text-[8.5px] font-black text-slate-800 block">Succión</span>
                <span className="text-[7.5px] text-slate-500 leading-tight block">Sistema de retorno con rejilla y filtro de seguridad.</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mt-3">
            <div className="flex gap-2">
              <EncendidoIcon className="w-4 h-4 text-[#004a7c] shrink-0 mt-0.5" />
              <div>
                <span className="text-[8.5px] font-black text-slate-800 block">Encendido</span>
                <span className="text-[7.5px] text-slate-500 leading-tight block">Pulsador neumático o digital estanco de encendido.</span>
              </div>
            </div>
            <div className="flex gap-2">
              <ReguladorAireIcon className="w-4 h-4 text-[#004a7c] shrink-0 mt-0.5" />
              <div>
                <span className="text-[8.5px] font-black text-slate-800 block">Regulador Aire</span>
                <span className="text-[7.5px] text-slate-500 leading-tight block">Válvula mezcladora de aire para modular la intensidad.</span>
              </div>
            </div>
            <div className="flex gap-2">
              <SopapaIcon className="w-4 h-4 text-[#004a7c] shrink-0 mt-0.5" />
              <div>
                <span className="text-[8.5px] font-black text-slate-800 block">Sopapa</span>
                <span className="text-[7.5px] text-slate-500 leading-tight block">Desagüe de fondo metálico o plástico de acoplamiento directo.</span>
              </div>
            </div>
            <div className="flex gap-2">
              <DesbordeIcon className="w-4 h-4 text-[#004a7c] shrink-0 mt-0.5" />
              <div>
                <span className="text-[8.5px] font-black text-slate-800 block">Desborde</span>
                <span className="text-[7.5px] text-slate-500 leading-tight block">Rebosadero de seguridad para prevenir desbordes.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 pt-3 flex justify-between items-center shrink-0 mt-4">
          <span className="text-[8px] text-slate-400">Five Saint © 2026 • Catálogo y Lista de Precios</span>
          <div className="bg-[#b08b5c]/10 text-[#b08b5c] font-black px-3 py-1 rounded text-[8px] uppercase tracking-wider">
            Guía de Referencia
          </div>
        </div>
      </div>

      {/* 
        PÁGINAS DE BAÑERAS PREMIUM (2 PÁGINAS SHOWCASE)
      */}
      {(() => {
        const premiumModels = [
          { name: "Romana", imagePath: "/images/Beñeras/romana.jpg" },
          { name: "Perla", imagePath: "/images/Beñeras/Perla.jpg" },
          { name: "Yaquelin", imagePath: "/images/Beñeras/Yaqueline.jpg" },
          { name: "Agustar", imagePath: "/images/Beñeras/Agustar.jpg" },
          { name: "Quadra", imagePath: "/images/Beñeras/quadra.jpg" },
          { name: "Modena", imagePath: "/images/Beñeras/Modena.jpg" },
          { name: "Veneto", imagePath: "/images/Beñeras/Veneto.jpg" },
          { name: "Parma", imagePath: "/images/Beñeras/Parma.jpg" },
          { name: "Laguna", imagePath: "/images/Beñeras/Laguna.jpg" },
          { name: "Circular", imagePath: "/images/Beñeras/Circular.jpg" },
          { name: "Esquinero", imagePath: "/images/Beñeras/Esquinero.jpg" },
          { name: "Quarzo", imagePath: "/images/Beñeras/Quarzo.jpg" }
        ].map(model => ({
          ...model,
          items: banerasPremiumData.filter(item => item.name === model.name)
        }));

        const renderPremiumPage = (pageIndex: number, modelsChunk: typeof premiumModels) => {
          return (
            <div key={`premium-showcase-page-${pageIndex}`} className="page-break-after p-0 h-[297mm] max-h-[297mm] w-[210mm] mx-auto bg-white shadow-xl print:shadow-none relative overflow-hidden flex flex-col justify-between p-8">
              {/* Main Content Area */}
              <div className="flex flex-col flex-grow">
                {/* Top Header */}
                <div className="border-b border-slate-200 pb-2 mb-3 shrink-0 flex justify-between items-end">
                  <div>
                    <h1 className="text-2xl font-black text-[#006699] uppercase tracking-wide">Bañeras Premium </h1>
                  </div>
                  <div className="flex items-center gap-4">
                    <img src="/logo.png" alt="Five Saint Logo" className="h-16 object-contain" />
                  </div>
                </div>

                {/* VERSIONES section - Ampliado para mayor legibilidad - Solo en la página 1 */}
                {pageIndex === 1 && (
                  <div className="shrink-0 mb-3.5 bg-slate-50 border border-slate-200 rounded-xl p-3.5 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
                      <h2 className="text-[11.5px] font-black text-[#006699] uppercase tracking-wider">Especificaciones de Equipamientos</h2>
                    </div>
                    <table className="w-full text-left border-collapse text-[10.5px]">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 font-bold">
                          <th className="py-1 w-[50%]">INCLUYE</th>
                          <th className="py-1 text-center bg-[#006d9c] text-white rounded-t-md text-[9px] font-bold w-[25%] uppercase tracking-wider">CONFORT</th>
                          <th className="py-1 text-center bg-[#d0a65c] text-white rounded-t-md text-[9px] font-bold w-[25%] uppercase tracking-wider">CONFORT PLUS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr>
                          <td className="py-1 flex items-center gap-2 font-medium text-slate-700">
                            <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="3" />
                              <circle cx="12" cy="5" r="1.5" />
                              <circle cx="12" cy="19" r="1.5" />
                              <circle cx="5" cy="12" r="1.5" />
                              <circle cx="19" cy="12" r="1.5" />
                              <circle cx="7" cy="7" r="1.5" />
                              <circle cx="17" cy="17" r="1.5" />
                              <circle cx="7" cy="17" r="1.5" />
                              <circle cx="17" cy="7" r="1.5" />
                            </svg>
                            16 jets de hidromasaje
                          </td>
                          <td className="py-1 text-center"><div className="flex justify-center"><CheckIcon color="#006d9c" size={13} /></div></td>
                          <td className="py-1 text-center"><div className="flex justify-center"><CheckIcon color="#d0a65c" size={13} /></div></td>
                        </tr>
                        <tr>
                          <td className="py-1 flex items-center gap-2 font-medium text-slate-700">
                            <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <circle cx="12" cy="12" r="9" />
                              <circle cx="12" cy="12" r="4" />
                              <path d="M12 3v18M3 12h18" />
                            </svg>
                            Sopapa
                          </td>
                          <td className="py-1 text-center"><div className="flex justify-center"><CheckIcon color="#006d9c" size={13} /></div></td>
                          <td className="py-1 text-center"><div className="flex justify-center"><CheckIcon color="#d0a65c" size={13} /></div></td>
                        </tr>
                        <tr>
                          <td className="py-1 flex items-center gap-2 font-medium text-slate-700">
                            <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <rect x="3" y="7" width="18" height="10" rx="2" />
                              <circle cx="12" cy="12" r="2.5" />
                              <path d="M6 12h1M17 12h1" />
                            </svg>
                            Desborde metálico
                          </td>
                          <td className="py-1 text-center"><div className="flex justify-center"><CheckIcon color="#006d9c" size={13} /></div></td>
                          <td className="py-1 text-center"><div className="flex justify-center"><CheckIcon color="#d0a65c" size={13} /></div></td>
                        </tr>
                        <tr>
                          <td className="py-1 flex items-center gap-2 font-medium text-slate-700">
                            <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <rect x="3" y="3" width="18" height="18" rx="1" />
                              <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
                            </svg>
                            Estructura metálica autoportante con piso reforzado
                          </td>
                          <td className="py-1 text-center"><div className="flex justify-center"><CheckIcon color="#006d9c" size={13} /></div></td>
                          <td className="py-1 text-center"><div className="flex justify-center"><CheckIcon color="#d0a65c" size={13} /></div></td>
                        </tr>
                        <tr>
                          <td className="py-1 flex items-center gap-2 font-medium text-slate-700">
                            <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path d="M3 16c0-3 2.5-5.5 5.5-5.5h7c3 0 5.5 2.5 5.5 5.5" />
                              <rect x="7" y="14" width="10" height="4" rx="1" />
                            </svg>
                            Almohadilla Relax
                          </td>
                          <td className="py-1 text-center"><div className="flex justify-center"><DashIcon size={13} /></div></td>
                          <td className="py-1 text-center"><div className="flex justify-center"><CheckIcon color="#d0a65c" size={13} /></div></td>
                        </tr>
                        <tr>
                          <td className="py-1 flex items-center gap-2 font-medium text-slate-700">
                            <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <rect x="4" y="6" width="16" height="12" rx="1.5" />
                              <circle cx="8" cy="12" r="1.5" />
                              <path d="M13 10h4M13 14h4" />
                            </svg>
                            Comando digital
                          </td>
                          <td className="py-1 text-center"><div className="flex justify-center"><DashIcon size={13} /></div></td>
                          <td className="py-1 text-center"><div className="flex justify-center"><CheckIcon color="#d0a65c" size={13} /></div></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Grid of bathtubs (Two columns, dynamically chunked to fill available space) */}
                <div className="flex flex-col gap-2 flex-grow">
                  {(() => {
                    const rows: (typeof premiumModels)[] = [];
                    for (let i = 0; i < modelsChunk.length; i += 2) {
                      rows.push(modelsChunk.slice(i, i + 2));
                    }
                    return rows.map((rowChunk, rowIndex) => (
                      <div key={rowIndex} className="grid grid-cols-2 gap-3 flex-1">
                        {rowChunk.map((group) => (
                          <div key={group.name} className="flex flex-col bg-white rounded-xl border border-slate-200 p-2 shadow-sm hover:shadow-md transition-shadow h-full">
                            <div className="mb-1 shrink-0">
                              <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest block leading-none">LÍNEA PREMIUM</span>
                              <h2 className="text-sm font-black text-[#006699] uppercase tracking-wide leading-tight mt-0.5">{group.name}</h2>
                            </div>

                            {/* Bathtub Image */}
                            <div className={`${pageIndex === 1 ? 'h-[175px]' : 'h-[110px]'} w-full border border-slate-200 bg-slate-50 rounded-lg overflow-hidden flex items-center justify-center relative mb-2 shrink-0`}>
                              {group.imagePath ? (
                                <img src={group.imagePath} alt={group.name} className="w-full h-full object-contain mix-blend-multiply p-2" />
                              ) : (
                                <div className="flex flex-col items-center justify-center p-2 text-slate-300 h-full w-full">
                                  <svg className="w-6 h-6 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375 0 11-.75 0 .375 0 01.75 0z" />
                                  </svg>
                                  <span className="text-[7px] font-mono uppercase tracking-wider">Sin Foto</span>
                                </div>
                              )}
                            </div>

                            {/* Pricing list */}
                            <div className="shrink-0">
                              <table className="w-full text-left border-collapse text-[8px]">
                                <thead>
                                  <tr className="border-b border-slate-200 text-slate-500 font-bold">
                                    <th className="py-0.5 w-[38%]">MEDIDA</th>
                                    <th className="py-0.5 text-center bg-[#006d9c] text-white rounded-t-md text-[7px] font-bold w-[31%]">CONFORT</th>
                                    <th className="py-0.5 text-center bg-[#d0a65c] text-white rounded-t-md text-[7px] font-bold w-[31%]">PLUS</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {group.items.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                      <td className="py-1 font-bold text-slate-700 whitespace-nowrap">{item.medidas.replace('x', ' x ')}</td>
                                      <td className="py-1 text-center">
                                        <div className="flex flex-col items-center">
                                          <span className="font-bold text-[#006d9c] leading-none">{item.confortPrice}</span>
                                          <span className="text-[6.5px] font-mono text-slate-400 mt-0.5 leading-none">{item.confortCode}</span>
                                        </div>
                                      </td>
                                      <td className="py-1 text-center">
                                        <div className="flex flex-col items-center">
                                          <span className="font-bold text-slate-800 leading-none">{item.confortPlusPrice}</span>
                                          <span className="text-[6.5px] font-mono text-slate-400 mt-0.5 leading-none">{item.confortPlusCode}</span>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))}
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Highlights Footer */}
              <div className="mt-3 border border-slate-200 bg-slate-50 rounded-xl p-2 flex justify-between gap-4 text-left shadow-sm shrink-0">
                {/* Quality */}
                <div className="flex items-center gap-2 w-1/3">
                  <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-sm text-[#006699] shrink-0">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-[8px] font-black text-accent-deep uppercase tracking-wide leading-tight">Calidad y respaldo</h4>
                    <p className="text-[7px] text-slate-500 font-medium leading-none mt-0.5">Productos diseñados para durar.</p>
                  </div>
                </div>

                {/* Warranty */}
                <div className="flex items-center gap-2 w-1/3 border-l border-slate-200 pl-3">
                  <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-sm text-[#006699] shrink-0">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-[8px] font-black text-accent-deep uppercase tracking-wide leading-tight">Garantía Five Saint</h4>
                    <p className="text-[7px] text-slate-500 font-medium leading-none mt-0.5">5 años en Acrílico y 1 año en Bomba.</p>
                  </div>
                </div>

                {/* Comfort */}
                <div className="flex items-center gap-2 w-1/3 border-l border-slate-200 pl-3">
                  <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-sm text-[#006699] shrink-0">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-[8px] font-black text-accent-deep uppercase tracking-wide leading-tight">Practicidad y confort</h4>
                  </div>
                </div>
              </div>

              {/* Footer info Premium */}
              <div className="flex justify-between items-center shrink-0 pt-2 border-t border-slate-100 mt-2">
                <p className="text-[8.5px] text-slate-400 font-bold">Los precios corresponden a color blanco.</p>
                <div className="bg-accent-gold text-white font-bold px-2 py-1 rounded text-[8.5px] uppercase tracking-wider">
                  LOS PRECIOS NO INCLUYEN IVA
                </div>
              </div>
            </div>
          );
        };

        return (
          <>
            {renderPremiumPage(1, premiumModels.slice(0, 4))}
            {renderPremiumPage(2, premiumModels.slice(4, 12))}
          </>
        );
      })()}

      {/* 
        PÁGINAS DE BAÑERAS
      */}
      {(() => {
        const products = banerasData.products;

        const groupedModels = [
          {
            name: "Romana",
            image: "/images/Beñeras/romana.jpg",
            items: products.filter(p => p.name === "Romana")
          },
          {
            name: "Perla",
            image: "/images/Beñeras/Perla.jpg",
            items: products.filter(p => p.name === "Perla")
          },
          {
            name: "Lady",
            image: "/images/Beñeras/Lady.jpg",
            items: products.filter(p => p.name === "Lady")
          },
          {
            name: "Yaquelin",
            image: "/images/Beñeras/Yaqueline.jpg",
            items: products.filter(p => p.name === "Yaquelin")
          },
          {
            name: "Joya",
            image: "/images/Beñeras/Joya.jpg",
            items: products.filter(p => p.name === "Joya")
          },
          {
            name: "Martina",
            image: "/images/Beñeras/martina.jpg",
            items: products.filter(p => p.name.includes("Martina"))
          }
        ];

        const singleModels = products.filter(p =>
          !["Romana", "Perla", "Lady", "Yaquelin", "Joya"].includes(p.name) &&
          !p.name.includes("Martina")
        );

        // Helper to render "OFERTA" badge or price
        const renderPrice = (
          val: string | undefined,
          sizeClass = "text-[9px]",
          weightClass = "font-medium text-slate-600",
          ofertaSizeClass = "text-[7px]"
        ) => {
          if (val === 'OFERTA') {
            return <span className={`font-bold text-white bg-accent-gold px-1 py-0.5 rounded uppercase tracking-wider shadow-sm ${ofertaSizeClass}`}>OFERTA</span>;
          }
          return <span className={`${weightClass} ${sizeClass}`}>{val || '-'}</span>;
        };

        // Helper to render the header & levels of equipment
        const renderHeaderAndLevels = (cont = false) => (
          <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4 shrink-0">
            <div>
              <h1 className="text-2xl font-black text-accent-deep tracking-tight">
                BAÑERAS
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-[7.5px] uppercase font-black tracking-wider text-accent-deep border-r border-slate-200 pr-3 h-7 flex items-center leading-tight">
                Niveles de<br />Equipamiento
              </span>

              {/* Solo Bañera */}
              <div className="flex flex-col items-center text-center w-12">
                <div className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center bg-slate-50 shadow-sm">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-slate-600">
                    <path d="M2 9h20v2a4 4 0 01-4 4H6a4 4 0 01-4-4V9z" />
                    <path d="M4 9V7a2 2 0 012-2h12a2 2 0 012 2v2" />
                    <path d="M6 15v2M18 15v2" />
                  </svg>
                </div>
                <span className="text-[6.5px] font-black uppercase text-accent-deep mt-0.5 leading-none">Casco</span>
              </div>

              {/* 4 Jets */}
              <div className="flex flex-col items-center text-center w-12">
                <div className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center bg-slate-50 shadow-sm">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-slate-600">
                    <circle cx="7" cy="7" r="2.2" />
                    <circle cx="17" cy="7" r="2.2" />
                    <circle cx="7" cy="17" r="2.2" />
                    <circle cx="17" cy="17" r="2.2" />
                  </svg>
                </div>
                <span className="text-[6.5px] font-black uppercase text-accent-deep mt-0.5 leading-none">4 Jets</span>
              </div>

              {/* 6 Jets */}
              <div className="flex flex-col items-center text-center w-12">
                <div className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center bg-slate-50 shadow-sm">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-slate-600">
                    <circle cx="6" cy="7" r="2" />
                    <circle cx="12" cy="7" r="2" />
                    <circle cx="18" cy="7" r="2" />
                    <circle cx="6" cy="17" r="2" />
                    <circle cx="12" cy="17" r="2" />
                    <circle cx="18" cy="17" r="2" />
                  </svg>
                </div>
                <span className="text-[6.5px] font-black uppercase text-accent-deep mt-0.5 leading-none">6 Jets</span>
              </div>

              {/* 8 Jets */}
              <div className="flex flex-col items-center text-center w-12">
                <div className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center bg-slate-50 shadow-sm">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-slate-600">
                    <circle cx="6" cy="6" r="1.5" />
                    <circle cx="12" cy="6" r="1.5" />
                    <circle cx="18" cy="6" r="1.5" />
                    <circle cx="6" cy="12" r="1.5" />
                    <circle cx="18" cy="12" r="1.5" />
                    <circle cx="6" cy="18" r="1.5" />
                    <circle cx="12" cy="18" r="1.5" />
                    <circle cx="18" cy="18" r="1.5" />
                  </svg>
                </div>
                <span className="text-[6.5px] font-black uppercase text-accent-deep mt-0.5 leading-none">8 Jets</span>
              </div>

              <img src="/logo.png" alt="Five Saint Logo" className="h-16 object-contain ml-2 border-l border-slate-200 pl-4" />
            </div>
          </div>
        );

        const renderGroupedCard = (group: typeof groupedModels[0]) => (
          <div key={group.name} className="shrink-0">
            <div className="flex items-baseline gap-1.5 mb-1 shrink-0">
              <h2 className="text-[12px] font-black text-[#006699] uppercase tracking-wide leading-none">{group.name}</h2>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm flex items-center bg-white p-3 gap-4">
              {/* Left Image Section */}
              <div className="w-[30%] flex items-center justify-center bg-slate-50/50 rounded-lg p-2 border border-slate-100 shrink-0 h-[100px]">
                <img src={group.image} alt={group.name} className="w-full h-full object-contain mix-blend-multiply" />
              </div>

              {/* Right Table Section */}
              <div className="flex-grow flex flex-col justify-center">
                <h4 className="text-[7.5px] font-black uppercase text-[#006699] tracking-wider mb-1.5">Varias medidas para adaptarse a tu espacio</h4>
                <div className="rounded-lg overflow-hidden border border-slate-200 bg-white">
                  <table className="w-full text-left border-collapse text-[10px]">
                    <thead>
                      <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                        <th className="py-1 px-2 font-bold uppercase tracking-wider text-[7px] border-r border-slate-200 text-center w-[20%]">Medida</th>
                        <th className="py-1 px-2 font-bold uppercase tracking-wider text-[7px] border-r border-slate-200 text-center w-[20%]">Bañera <span className="text-[5.5px] text-slate-400 block font-normal leading-none mt-0.5">(casco)</span></th>
                        <th className="py-1 px-2 font-bold uppercase tracking-wider text-[7px] border-r border-slate-200 text-center w-[20%]">4 Jets</th>
                        <th className="py-1 px-2 font-bold uppercase tracking-wider text-[7px] border-r border-slate-200 text-center w-[20%]">6 Jets</th>
                        <th className="py-1 px-2 font-bold uppercase tracking-wider text-[7px] text-center w-[20%] text-[#006699]">8 Jets</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map((item, idx) => (
                        <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                          <td className="py-1 px-2 font-bold text-slate-700 text-center font-mono text-[8.5px] border-r border-slate-200">
                            {group.name === "Martina" ? (
                              item.name.includes("con frente") ? "Con frente (180x120)" : "Sin frente (180x120)"
                            ) : (
                              item.medidas
                            )}
                          </td>
                          <td className="py-1 px-2 font-medium text-slate-600 text-center border-r border-slate-200 text-[9px]">
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] font-black text-slate-900">{item.cascos || '-'}</span>
                              {item.cascosCode && <span className="text-[8px] font-mono text-slate-600 font-semibold mt-0.5 leading-none">{item.cascosCode}</span>}
                            </div>
                          </td>
                          <td className="py-1 px-2 text-center border-r border-slate-200 text-[9px]">
                            <div className="flex flex-col items-center">
                              {renderPrice(item.jet4, "text-[10px]", "font-black text-slate-900")}
                              {item.jet4Code && <span className="text-[8px] font-mono text-slate-600 font-semibold mt-0.5 leading-none">{item.jet4Code}</span>}
                            </div>
                          </td>
                          <td className="py-1 px-2 text-center border-r border-slate-200 text-[9px]">
                            <div className="flex flex-col items-center">
                              {renderPrice(item.jet6, "text-[10px]", "font-black text-slate-900")}
                              {item.jet6Code && <span className="text-[8px] font-mono text-slate-600 font-semibold mt-0.5 leading-none">{item.jet6Code}</span>}
                            </div>
                          </td>
                          <td className="py-1 px-2 bg-[#006699]/5 text-center text-[9px]">
                            <div className="flex flex-col items-center">
                              {renderPrice(item.jet8, "text-[10px]", "font-black text-accent-deep")}
                              {item.jet8Code && <span className="text-[8px] font-mono text-slate-600 font-semibold mt-0.5 leading-none">{item.jet8Code}</span>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );

        // Helper to render the single-measure models table (enlarged)
        const renderSingleModelsTable = (models: typeof singleModels, isContinuation = false) => (
          <div className="mt-4">
            <div className="flex items-baseline gap-1.5 mb-2 shrink-0">
              <h2 className="text-[14px] font-black text-accent-deep uppercase tracking-wide leading-none">
                Modelos de Medida Única
              </h2>
            </div>

            <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#006699] text-white">
                  <tr>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-[11px] w-[30%]">Modelo</th>
                    <th className="py-3 px-2 font-bold uppercase tracking-wider text-[11px] text-center w-[11%]">Medidas</th>
                    <th className="py-3 px-2 font-bold uppercase tracking-wider text-[11px] text-center w-[11%]">Cascos</th>
                    <th className="py-3 px-2 font-bold uppercase tracking-wider text-[11px] text-center w-[16%]">4 Jet</th>
                    <th className="py-3 px-2 font-bold uppercase tracking-wider text-[11px] text-center w-[16%]">6 Jet</th>
                    <th className="py-3 px-2 font-bold uppercase tracking-wider text-[11px] text-center w-[16%]">8 Jet</th>
                  </tr>
                </thead>
                <tbody>
                  {models.map((p, idx) => (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-700">
                        <div className="flex items-center gap-4">
                          {p.image ? (
                            <img src={p.image} alt={p.name} className="w-16 h-16 object-contain mix-blend-multiply rounded-lg border border-slate-150 bg-slate-50/50 p-1 shrink-0" />
                          ) : (
                            <div className="w-16 h-16 bg-accent-soft/30 rounded-lg flex items-center justify-center shrink-0 border border-slate-150">
                              <span className="text-accent-gold/40 font-bold text-[13px]">FS</span>
                            </div>
                          )}
                          <span className="text-accent-deep text-[15px] font-black">{p.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-2 text-slate-750 font-mono text-[13px] font-semibold text-center whitespace-nowrap">{p.medidas}</td>
                      <td className="py-3.5 px-2 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center">
                          <span className="font-bold text-[13.5px] text-slate-800">{p.cascos || '-'}</span>
                          {p.cascosCode && <span className="text-[10.5px] font-mono text-slate-500 font-semibold mt-0.5 leading-none">{p.cascosCode}</span>}
                        </div>
                      </td>
                      <td className="py-3.5 px-2 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center">
                          {renderPrice(p.jet4, "text-[13.5px]", "font-bold text-slate-800", "text-[10px]")}
                          {p.jet4Code && <span className="text-[10.5px] font-mono text-slate-500 font-semibold mt-0.5 leading-none">{p.jet4Code}</span>}
                        </div>
                      </td>
                      <td className="py-3.5 px-2 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center">
                          {renderPrice(p.jet6, "text-[13.5px]", "font-bold text-slate-800", "text-[10px]")}
                          {p.jet6Code && <span className="text-[10.5px] font-mono text-slate-500 font-semibold mt-0.5 leading-none">{p.jet6Code}</span>}
                        </div>
                      </td>
                      <td className="py-3.5 px-2 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center">
                          {renderPrice(p.jet8, "text-[13.5px]", "font-bold text-slate-800", "text-[10px]")}
                          {p.jet8Code && <span className="text-[10.5px] font-mono text-slate-500 font-semibold mt-0.5 leading-none">{p.jet8Code}</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

        return (
          <>
            {/* PÁGINA 1 DE BAÑERAS: Cabecera + Niveles + Romana + Perla + Lady + Yaquelin */}
            <div key="baneras-page-1" className="page-break-after p-0 h-[297mm] max-h-[297mm] w-[210mm] mx-auto bg-white shadow-xl print:shadow-none relative overflow-hidden flex flex-col justify-between p-8">
              <div className="flex flex-col flex-grow">
                {renderHeaderAndLevels(false)}
                <div className="flex flex-col gap-2.5">
                  {renderGroupedCard(groupedModels[0])} {/* Romana */}
                  {renderGroupedCard(groupedModels[1])} {/* Perla */}
                  {renderGroupedCard(groupedModels[2])} {/* Lady */}
                  {renderGroupedCard(groupedModels[3])} {/* Yaquelin */}
                </div>
              </div>
              {/* Footer */}
              <div className="flex justify-between items-end shrink-0 pt-2 border-t border-slate-100 mt-2">
                <div className="text-[9px] text-slate-600 max-w-[500px] leading-relaxed">
                  <p className="font-bold text-slate-800">Los precios corresponden a color blanco</p>
                  <p className="mt-0.5">En los Sistemas Hidroterapéuticos las vistas son cromo y están compuestos de: casco con soporte para bomba, jet, succión, pulsador neumático y bomba.</p>
                  <p className="mt-0.5">Las medidas y las imágenes son ilustrativas sujetas a variaciones sin previo aviso.</p>
                </div>
                <div className="bg-accent-gold text-white font-bold px-2 py-1 rounded text-[9px] uppercase tracking-wider">
                  LOS PRECIOS NO INCLUYEN IVA
                </div>
              </div>
            </div>

            {/* PÁGINA 2 DE BAÑERAS: Cabecera Cont. + Niveles + Joya + Martina + Modelos de Medida Única (Parte 1) */}
            <div key="baneras-page-2" className="page-break-after p-0 h-[297mm] max-h-[297mm] w-[210mm] mx-auto bg-white shadow-xl print:shadow-none relative overflow-hidden flex flex-col justify-between p-8">
              <div className="flex flex-col flex-grow">
                {renderHeaderAndLevels(true)}

                <div className="flex flex-col gap-2.5">
                  {renderGroupedCard(groupedModels[4])} {/* Joya */}
                  {renderGroupedCard(groupedModels[5])} {/* Martina */}
                </div>

                {renderSingleModelsTable(singleModels.slice(0, 5), false)}
              </div>
              {/* Footer */}
              <div className="flex justify-between items-end shrink-0 pt-2 border-t border-slate-100 mt-2">
                <div className="text-[9px] text-slate-600 max-w-[500px] leading-relaxed">
                  <p className="font-bold text-slate-800">Los precios corresponden a color blanco</p>
                  <p className="mt-0.5">En los Sistemas Hidroterapéuticos las vistas son cromo y están compuestos de: casco con soporte para bomba, jet, succión, pulsador neumático y bomba.</p>
                  <p className="mt-0.5">Las medidas y las imágenes son ilustrativas sujetas a variaciones sin previo aviso.</p>
                </div>
                <div className="bg-accent-gold text-white font-bold px-2 py-1 rounded text-[9px] uppercase tracking-wider">
                  LOS PRECIOS NO INCLUYEN IVA
                </div>
              </div>
            </div>

            {/* PÁGINA 3 DE BAÑERAS: Cabecera Cont. + Niveles + Modelos de Medida Única (Parte 2) */}
            <div key="baneras-page-3" className="page-break-after p-0 h-[297mm] max-h-[297mm] w-[210mm] mx-auto bg-white shadow-xl print:shadow-none relative overflow-hidden flex flex-col justify-between p-8">
              <div className="flex flex-col flex-grow">
                {renderHeaderAndLevels(true)}
                {renderSingleModelsTable(singleModels.slice(5), true)}
              </div>
              {/* Footer */}
              <div className="flex justify-between items-end shrink-0 pt-2 border-t border-slate-100 mt-2">
                <div className="text-[9px] text-slate-600 max-w-[500px] leading-relaxed">
                  <p className="font-bold text-slate-800">Los precios corresponden a color blanco</p>
                  <p className="mt-0.5">En los Sistemas Hidroterapéuticos las vistas son cromo y están compuestos de: casco con soporte para bomba, jet, succión, pulsador neumático y bomba.</p>
                  <p className="mt-0.5">Las medidas y las imágenes son ilustrativas sujetas a variaciones sin previo aviso.</p>
                </div>
                <div className="bg-accent-gold text-white font-bold px-2 py-1 rounded text-[9px] uppercase tracking-wider">
                  LOS PRECIOS NO INCLUYEN IVA
                </div>
              </div>
            </div>
          </>
        );
      })()}

      {/* 
        PÁGINAS DE EQUIPAMIENTOS (Única Página)
      */}
      <div key="equip-page-single" className="page-break-after p-0 h-[297mm] max-h-[297mm] w-[210mm] mx-auto bg-white shadow-xl print:shadow-none relative overflow-hidden flex flex-col justify-between">
        <div className="flex flex-col flex-grow">
          {/* Banner Superior Premium */}
          <div className="relative w-full h-32 bg-accent-deep overflow-hidden shrink-0 border-b-2 border-accent-gold/40">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
            <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-accent-gold opacity-20 rounded-full blur-3xl"></div>
            <div className="absolute -top-10 -left-10 w-64 h-64 bg-accent-soft opacity-10 rounded-full blur-3xl"></div>

            <div className="absolute inset-0 flex items-center justify-between px-10">
              <div>
                <h1 className="text-4xl font-extrabold text-white uppercase tracking-widest drop-shadow-md">
                  Equipamiento Adicional
                </h1>
                <p className="text-white/60 tracking-widest uppercase text-[10px] mt-1">
                  Pensado para una Experiencia Superior
                </p>
              </div>
              <img src="/logo.png" alt="Five Saint Logo" className="h-16 object-contain" />
            </div>
          </div>

          {/* Listado en dos columnas */}
          <div className="px-10 pt-2 flex-grow flex flex-col justify-center">
            <div className="grid grid-cols-2 gap-x-8 gap-y-1">
              {(() => {
                const N = equipamientosData.length;
                const half = Math.ceil(N / 2);
                const reordered: typeof equipamientosData = [];
                for (let i = 0; i < half; i++) {
                  reordered.push(equipamientosData[i]);
                  if (half + i < N) {
                    reordered.push(equipamientosData[half + i]);
                  }
                }
                return reordered.map((e, idx) => (
                  <div key={idx} className="flex flex-col justify-between border-b border-slate-100 pb-0.5 hover:bg-slate-50 transition-colors">
                    <div>
                      <div className="flex justify-between items-baseline gap-2">
                        <h3 className="text-[10px] font-black text-accent-deep leading-none uppercase">{e.nombre}</h3>
                        <span className="text-accent-gold font-black text-[11px] whitespace-nowrap shrink-0">{e.precio}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0 mb-0.5">
                        <span className="text-[8px] text-slate-600 font-mono tracking-tighter bg-slate-150 px-1 rounded font-medium">Ref: {e.codigo}</span>
                      </div>
                    </div>
                    {e.descripcion && (
                      <p className="text-[9px] text-slate-700 leading-normal line-clamp-1 pr-1 font-medium">{e.descripcion}</p>
                    )}
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>

        {/* Footer info Pág Equipamientos */}
        <div className="px-10 pb-4 flex justify-between items-end shrink-0 border-t border-slate-100 pt-2 mt-2">
          <div className="text-[7.5px] text-slate-400 max-w-sm">
            <p>Los precios corresponden a color blanco.</p>
            <p className="mt-0.5">Precios sujetos a modificación sin previo aviso.</p>
          </div>
          <div className="bg-accent-gold text-white font-bold px-2 py-1 rounded text-[9px] uppercase tracking-wider">
            LOS PRECIOS NO INCLUYEN IVA
          </div>
        </div>
      </div>
      {/* 
        PÁGINAS DE OFERTAS
      */}
      {Array.from({ length: Math.ceil(ofertasData.length / 3) }).map((_, pageIndex) => {
        const chunk = ofertasData.slice(pageIndex * 3, (pageIndex + 1) * 3);

        return (
          <div key={`ofertas-page-${pageIndex}`} className="page-break-after p-0 h-[297mm] max-h-[297mm] w-[210mm] mx-auto bg-white shadow-xl print:shadow-none relative overflow-hidden flex flex-col justify-between p-8">
            {/* Header */}
            <div className="border-b border-slate-200 pb-2 mb-4 shrink-0 flex justify-between items-end">
              <div>
                <h1 className="text-2xl font-black text-[#006699] uppercase tracking-wide">OFERTAS</h1>
              </div>
              <div className="flex items-center gap-4">
                <img src="/logo.png" alt="Five Saint Logo" className="h-12 object-contain" />
              </div>
            </div>

            {/* Listado de Ofertas (Exactamente 3 por página) */}
            <div className="flex-grow flex flex-col justify-between py-2">
              {chunk.map((oferta, idx) => {
                const globalIdx = pageIndex * 3 + idx;
                const isEven = globalIdx % 2 === 0;
                const specs = parseOfertaDescription(oferta.descripcion);

                return (
                  <div key={idx} className={`w-full bg-white border border-slate-200 rounded-3xl p-3.5 shadow-sm flex ${isEven ? 'flex-row' : 'flex-row-reverse'} items-center gap-4 h-[278px] shrink-0 relative`}>

                    {/* Imagen de la bañera */}
                    <div className="w-[48%] relative h-[250px] bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center shrink-0">

                      {/* Zoom/Viewport bracket icon on the top right */}
                      <div className="absolute top-3 right-3 w-7 h-7 bg-white/80 backdrop-blur-xs border border-[#006699] rounded-full flex items-center justify-center z-20 shadow-xs">
                        <svg className="w-4 h-4 text-[#006699]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7V5a2 2 0 012-2h2m10 0h2a2 2 0 012 2v2m0 10v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
                          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                        </svg>
                      </div>

                      {oferta.image ? (
                        <img src={oferta.image} alt={oferta.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-slate-50 flex items-center justify-center">
                          <span className="text-slate-300 font-bold text-xs uppercase">Sin Imagen</span>
                        </div>
                      )}
                    </div>

                    {/* Tarjeta de información */}
                    <div className="w-[52%] flex flex-col h-[250px] justify-between py-0.5">
                      {/* Título, Medida y Badge */}
                      <div className="flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-lg font-black text-[#004a7c] uppercase tracking-wide leading-none">{oferta.name}</h3>
                          <span className="bg-[#e6f2fa] text-[#006699] font-black text-[9px] px-2 py-0.5 rounded uppercase tracking-wider font-mono">
                            {oferta.medidas}
                          </span>
                        </div>
                        <div className="bg-[#b08b5c] text-white font-black text-[10px] px-3.5 py-1 rounded-full shadow-xs tracking-wider uppercase shrink-0">
                          • {oferta.jetLabel}
                        </div>
                      </div>

                      {/* Equipamiento label */}
                      <div className="mt-1 shrink-0">
                        <span className="text-[10px] font-black text-[#004a7c] uppercase tracking-wider block">EQUIPAMIENTO</span>
                      </div>

                      {/* Tabla de Especificaciones */}
                      <div className="flex-grow flex flex-col justify-center">
                        <table className="w-full border-collapse text-[10px] text-slate-700 leading-normal">
                          <tbody>
                            <tr className="border-b border-slate-100">
                              <td className="py-[2px] text-left font-bold">
                                <div className="flex items-center gap-1.5">
                                  <HydroJetsIcon className="w-3.5 h-3.5 text-[#004a7c]" />
                                  <span>Jets de hidromasaje</span>
                                </div>
                              </td>
                              <td className="py-[2px] text-right font-medium text-slate-600 align-middle">{specs.hydroJets}</td>
                            </tr>
                            <tr className="border-b border-slate-100">
                              <td className="py-[2px] text-left font-bold">
                                <div className="flex items-center gap-1.5">
                                  <CervicalIcon className="w-3.5 h-3.5 text-[#004a7c]" />
                                  <span>Jets cervicales</span>
                                </div>
                              </td>
                              <td className="py-[2px] text-right font-medium text-slate-600 align-middle">{specs.cervicalJets}</td>
                            </tr>
                            <tr className="border-b border-slate-100">
                              <td className="py-[2px] text-left font-bold">
                                <div className="flex items-center gap-1.5">
                                  <VistasIcon className="w-3.5 h-3.5 text-[#004a7c]" />
                                  <span>Vistas</span>
                                </div>
                              </td>
                              <td className="py-[2px] text-right font-medium text-slate-600 align-middle">{specs.vistas}</td>
                            </tr>
                            <tr className="border-b border-slate-100">
                              <td className="py-[2px] text-left font-bold">
                                <div className="flex items-center gap-1.5">
                                  <SuccionIcon className="w-3.5 h-3.5 text-[#004a7c]" />
                                  <span>Succión</span>
                                </div>
                              </td>
                              <td className="py-[2px] text-right align-middle">
                                <div className="flex justify-end">
                                  {specs.succion ? <CheckedCircleIcon size={12} /> : <DashIcon size={12} />}
                                </div>
                              </td>
                            </tr>
                            <tr className="border-b border-slate-100">
                              <td className="py-[2px] text-left font-bold">
                                <div className="flex items-center gap-1.5">
                                  <EncendidoIcon className="w-3.5 h-3.5 text-[#004a7c]" />
                                  <span>Encendido</span>
                                </div>
                              </td>
                              <td className="py-[2px] text-right font-medium text-slate-600 align-middle">{specs.encendido}</td>
                            </tr>
                            <tr className="border-b border-slate-100">
                              <td className="py-[2px] text-left font-bold">
                                <div className="flex items-center gap-1.5">
                                  <ReguladorAireIcon className="w-3.5 h-3.5 text-[#004a7c]" />
                                  <span>Regulador de aire</span>
                                </div>
                              </td>
                              <td className="py-[2px] text-right align-middle">
                                <div className="flex justify-end">
                                  {specs.reguladorAire ? <CheckedCircleIcon size={12} /> : <DashIcon size={12} />}
                                </div>
                              </td>
                            </tr>
                            <tr className="border-b border-slate-100">
                              <td className="py-[2px] text-left font-bold">
                                <div className="flex items-center gap-1.5">
                                  <SopapaIcon className="w-3.5 h-3.5 text-[#004a7c]" />
                                  <span>Sopapa</span>
                                </div>
                              </td>
                              <td className="py-[2px] text-right align-middle">
                                <div className="flex justify-end">
                                  {specs.sopapa ? <CheckedCircleIcon size={12} /> : <DashIcon size={12} />}
                                </div>
                              </td>
                            </tr>
                            <tr>
                              <td className="py-[2px] text-left font-bold">
                                <div className="flex items-center gap-1.5">
                                  <DesbordeIcon className="w-3.5 h-3.5 text-[#004a7c]" />
                                  <span>Desborde</span>
                                </div>
                              </td>
                              <td className="py-[2px] text-right font-medium text-slate-600 align-middle">{specs.desborde}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Precio */}
                      <div className="flex justify-between items-center mt-1 pt-1 border-t border-slate-100 shrink-0">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">PRECIO PROMOCIONAL</span>
                        <div className="bg-[#004a7c] text-white font-black text-sm py-1.5 px-6 rounded-full shadow-sm tracking-wider">
                          {oferta.precio}
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Footer info Ofertas */}
            <div className="flex justify-between items-end shrink-0 pt-2 border-t border-slate-100 mt-2">
              <div className="text-[9px] text-slate-500 max-w-[500px] leading-relaxed">
                <p className="font-bold text-slate-700">Los precios corresponden a color blanco.</p>
                <p className="mt-0.5">Las bañeras de OFERTA se les puede agregar equipamiento <strong className="text-slate-700">sin variar la cantidad de jet.</strong></p>
              </div>
              <div className="bg-accent-gold text-white font-bold px-3 py-1 rounded text-[9px] uppercase tracking-wider">
                LOS PRECIOS NO INCLUYEN IVA
              </div>
            </div>
          </div>
        );
      })}
      {/* 
        PÁGINAS DE SPA
      */}
      {/* SPA Página 1 (Space y Design) */}
      <div className="page-break-after p-0 min-h-[297mm] w-[210mm] mx-auto bg-white shadow-xl print:shadow-none relative overflow-hidden flex flex-col">
        {/* Banner Superior Premium (Igual al resto) */}
        <div className="relative w-full h-24 bg-accent-deep overflow-hidden shrink-0">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
          <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-accent-gold opacity-20 rounded-full blur-3xl"></div>

          <div className="absolute inset-0 flex items-center justify-between px-10">
            <h1 className="text-5xl font-bold text-white uppercase tracking-widest drop-shadow-md">
              SPA
            </h1>
            <img src="/logo.png" alt="Five Saint Logo" className="h-16 object-contain" />
          </div>
        </div>

        {/* Contenido SPA Page 1 */}
        <div className="flex-grow px-10 pt-8 flex gap-8">
          {spaDataPage1.map((spa, idx) => (
            <div key={idx} className="w-1/2 flex flex-col">
              {/* Título de Modelo, Dimensiones y Espacio para Imagen */}
              <div className="mb-4 flex flex-col gap-2">
                <div className="flex justify-between items-baseline">
                  <h2 className="text-2xl font-black text-accent-deep uppercase tracking-wide leading-none">{spa.name}</h2>
                </div>
                {/* Espacio para la imagen del SPA */}
                <div className="w-full h-48 bg-slate-50 rounded-lg overflow-hidden flex items-center justify-center border border-slate-200 shrink-0 shadow-inner relative">
                  {spa.image ? (
                    <img src={spa.image} alt={spa.name} className="w-full h-full object-cover drop-shadow-md" />
                  ) : (
                    <div className="text-center">
                      <span className="text-slate-300 font-bold text-[8px] uppercase block">Falta Foto</span>
                    </div>
                  )}
                </div>
                {/* Dimensiones y descripción */}
                <p className="text-[9px] text-slate-500 font-mono whitespace-pre-line leading-tight">{spa.dimensions}</p>
              </div>

              {/* Tabla de características */}
              <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm flex-grow flex flex-col">
                <table className="w-full text-left border-collapse bg-white">
                  <thead className="bg-accent-deep text-white">
                    <tr>
                      <th className="py-1 px-3 font-semibold text-[10px] uppercase w-[40%]">Características</th>
                      {spa.columns.map((col, cIdx) => (
                        <th key={cIdx} className="py-1 px-1 text-center font-semibold text-[9px] uppercase leading-tight">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {spa.features.map((feat, fIdx) => (
                      <tr key={fIdx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-0.5 px-3 text-slate-700 leading-tight">
                          <span className="font-bold text-[10px]">{feat.label}</span>
                        </td>
                        {feat.values.map((val, vIdx) => (
                          <td key={vIdx} className="py-0.5 px-1 text-center font-medium text-slate-600 text-[10px]">
                            {val}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Precios (Footer de tabla) */}
                <div className="mt-auto bg-accent-soft/30 border-t border-slate-200 p-2">
                  <div className="flex justify-between items-center gap-2">
                    {spa.prices.map((p, pIdx) => (
                      <div key={pIdx} className="flex-1 flex flex-col items-center bg-white border border-slate-200 rounded p-1 shadow-sm">
                        <span className="text-[8px] text-slate-400 font-mono font-bold mb-0.5">{p.code}</span>
                        <span className="text-[11px] font-black text-accent-deep">{p.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Opcionales Page 1 */}
        <div className="px-10 pb-4 mt-2 shrink-0">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-sm">
            <h3 className="text-xs font-bold text-accent-gold uppercase mb-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-accent-deep rounded-full"></span>
              Opcionales Disponibles
            </h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-1">
              {spaOpcionalesData.map((opc, oIdx) => (
                <div key={oIdx} className="flex justify-between items-center border-b border-slate-200/60 pb-0.5">
                  <span className="text-[9px] font-bold text-slate-700">{opc.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[8px] font-mono text-slate-400">{opc.code}</span>
                    <span className="text-[9px] font-black text-accent-deep w-16 text-right">{opc.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SPA Página 2 (Relax y Party) */}
      <div className="page-break-after p-0 min-h-[297mm] w-[210mm] mx-auto bg-white shadow-xl print:shadow-none relative overflow-hidden flex flex-col">
        {/* Banner Superior Premium */}
        <div className="relative w-full h-24 bg-accent-deep overflow-hidden shrink-0">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
          <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-accent-gold opacity-20 rounded-full blur-3xl"></div>

          <div className="absolute inset-0 flex items-center justify-between px-10">
            <h1 className="text-5xl font-bold text-white uppercase tracking-widest drop-shadow-md">
              SPA
            </h1>
            <img src="/logo.png" alt="Five Saint Logo" className="h-16 object-contain" />
          </div>
        </div>

        {/* Contenido SPA Page 2 */}
        <div className="flex-grow px-10 pt-8 flex gap-8">
          {spaDataPage2.map((spa, idx) => (
            <div key={idx} className="w-1/2 flex flex-col">
              {/* Título de Modelo, Dimensiones y Espacio para Imagen */}
              <div className="mb-4 flex flex-col gap-2">
                <div className="flex justify-between items-baseline">
                  <h2 className="text-3xl font-black text-accent-deep uppercase tracking-wide leading-none">{spa.name}</h2>
                </div>
                {/* Espacio para la imagen del SPA */}
                <div className="w-full h-56 bg-slate-50 rounded-lg overflow-hidden flex items-center justify-center border border-slate-200 shrink-0 shadow-inner relative">
                  {spa.image ? (
                    <img src={spa.image} alt={spa.name} className="w-full h-full object-cover drop-shadow-md" />
                  ) : (
                    <div className="text-center">
                      <span className="text-slate-300 font-bold text-[8px] uppercase block">Falta Foto</span>
                    </div>
                  )}
                </div>
                {/* Dimensiones y descripción */}
                <p className="text-[9px] text-slate-500 font-mono whitespace-pre-line leading-tight">{spa.dimensions}</p>
              </div>

              {/* Tabla de características */}
              <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm flex-grow flex flex-col">
                <table className="w-full text-left border-collapse bg-white">
                  <thead className="bg-accent-deep text-white">
                    <tr>
                      <th className="py-3 px-4 font-semibold text-[11px] uppercase w-[70%]">Características</th>
                      <th className="py-3 px-2 text-center font-semibold text-[11px] uppercase">
                        {spa.columns[0]}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {spa.features.map((feat, fIdx) => (
                      <tr key={fIdx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-4 text-slate-700 leading-tight">
                          <span className="font-bold text-[11px]">{feat.label}</span>
                        </td>
                        <td className="py-2 px-2 text-center font-black text-accent-deep text-[12px]">
                          {feat.values[0]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Precios (Footer de tabla) */}
                <div className="mt-auto bg-accent-soft/30 border-t border-slate-200 p-4">
                  <div className="flex justify-center items-center gap-2">
                    <div className="w-full flex items-center justify-between bg-white border border-slate-200 rounded p-3 shadow-md">
                      <span className="text-[10px] text-slate-400 font-mono font-bold">{spa.prices[0].code}</span>
                      <span className="text-lg font-black text-accent-deep">{spa.prices[0].price}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Opcionales Page 2 */}
        <div className="px-10 pb-8 mt-6 shrink-0">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-bold text-accent-gold uppercase mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-accent-deep rounded-full"></span>
              Opcionales Disponibles
            </h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              {spaOpcionalesData.map((opc, oIdx) => (
                <div key={oIdx} className="flex justify-between items-center border-b border-slate-200/60 pb-1">
                  <span className="text-[10px] font-bold text-slate-700">{opc.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[8px] font-mono text-slate-400">{opc.code}</span>
                    <span className="text-[10px] font-black text-accent-deep w-16 text-right">{opc.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 
        PÁGINAS DE PLATOS DE DUCHA
      */}
      {/* 
        PÁGINAS DE PLATOS DE DUCHA Y COLUMNAS
      */}
      {Array.from({ length: 2 }).map((_, pageIndex) => {
        const pageCats = pageIndex === 0
          ? platosDuchaData.slice(0, 3)
          : platosDuchaData.slice(3, 5);

        return (
          <div key={`platos-page-${pageIndex}`} className="page-break-after p-0 min-h-[297mm] w-[210mm] mx-auto bg-white shadow-xl print:shadow-none relative overflow-hidden flex flex-col">
            {/* Banner Superior Premium */}
            <div className="relative w-full h-24 bg-accent-deep overflow-hidden shrink-0">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
              <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-accent-gold opacity-20 rounded-full blur-3xl"></div>

              <div className="absolute inset-0 flex items-center justify-between px-16">
                <h1 className="text-4xl font-bold text-white uppercase tracking-widest drop-shadow-md">
                  {pageIndex === 0 ? (
                    <>Platos de Ducha <span className="text-xl text-white/70 ml-2">Acrílico</span></>
                  ) : (
                    <>Platos y Columnas <span className="text-xl text-white/70 ml-2">de Ducha</span></>
                  )}
                </h1>
                <img src="/logo.png" alt="Five Saint Logo" className="h-16 object-contain" />
              </div>
            </div>

            {/* Contenido Platos de Ducha */}
            <div className={`flex-grow px-16 py-8 flex flex-col justify-center ${pageIndex === 0 ? 'gap-6' : 'gap-5'}`}>
              {pageCats.map((cat, idx) => (
                <div key={idx} className="flex flex-col">
                  {/* Título de la Categoría */}
                  <div className="flex justify-between items-end border-b-2 border-accent-deep pb-1.5 mb-3">
                    <h3 className="text-xl font-black text-accent-deep uppercase tracking-wide">{cat.title}</h3>
                  </div>

                  {/* Fila de Contenido con Imagen Vertical a la izquierda y Tabla/Desagüe a la derecha */}
                  <div className="flex gap-6 items-center">
                    {/* Imagen de la Categoría (Aspecto Vertical Fijo) */}
                    <div className="w-[130px] h-[180px] bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200 shadow-inner relative shrink-0">
                      {cat.image ? (
                        <img src={cat.image} alt={cat.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center">
                          <span className="text-slate-300 font-bold text-xs uppercase block">Falta Foto</span>
                        </div>
                      )}
                    </div>

                    {/* Tabla y Desagüe */}
                    <div className="flex-grow flex flex-col justify-between gap-3">
                      {/* Tabla de Modelos */}
                      <div className="rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                        <table className="w-full text-left border-collapse bg-white text-[9.5px]">
                          <thead className="bg-accent-deep text-white">
                            <tr>
                              <th className="py-1.5 px-3 font-semibold uppercase">Cód.</th>
                              <th className="py-1.5 px-2 text-center font-semibold uppercase">Largo</th>
                              <th className="py-1.5 px-2 text-center font-semibold uppercase">Ancho</th>
                              <th className="py-1.5 px-2 text-center font-semibold uppercase">Alto</th>
                              <th className="py-1.5 px-2 text-center font-semibold uppercase">Prof.</th>
                              <th className="py-1.5 px-3 text-right font-semibold uppercase">Precio</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cat.items.map((item, iIdx) => (
                              <tr key={iIdx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                <td className="py-1 px-3 text-slate-500 font-mono font-bold">{item.code}</td>
                                <td className="py-1 px-2 text-center text-slate-700">{item.largo}</td>
                                <td className="py-1 px-2 text-center text-slate-700">{item.ancho}</td>
                                <td className="py-1 px-2 text-center text-slate-700">{item.altura}</td>
                                <td className="py-1 px-2 text-center text-slate-700">{item.profundidad}</td>
                                <td className="py-1 px-3 text-right font-black text-accent-deep">{item.price}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Accesorio Desagüe */}
                      {cat.desagueCode && (
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 flex justify-between items-center shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white rounded-full border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                              <img src="/images/Platos de Ducha/desague.png" alt="Desagüe" className="w-6 h-6 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                            </div>
                            <div>
                              <h4 className="text-[10px] font-bold text-slate-800 uppercase leading-none">Desagüe</h4>
                              <span className="text-[8px] font-mono text-slate-500 leading-normal">{cat.desagueCode}</span>
                            </div>
                          </div>
                          <span className="text-[11px] font-black text-accent-deep">{cat.desaguePrice}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Columnas de Ducha Section */}
              {pageIndex === 1 && (
                <div className="mt-2 flex flex-col">
                  {/* Título de la Categoría */}
                  <div className="flex justify-between items-end border-b-2 border-accent-deep pb-1 mb-2">
                    <h3 className="text-xl font-black text-accent-deep uppercase tracking-wide">Columnas de Ducha</h3>
                  </div>

                  {/* Contenido Columnas (4 en fila horizontal) */}
                  <div className="flex gap-4 justify-between mt-1">
                    {columnasDuchaData.map((columna, idx) => (
                      <div key={idx} className="flex flex-col items-center w-[23%] bg-slate-50 border border-slate-200 rounded-xl p-2.5 shadow-sm relative">
                        {/* Espacio para la imagen alta (columna) */}
                        <div className="w-[52px] h-[250px] bg-white rounded-lg overflow-hidden flex items-center justify-center border border-slate-150 shadow-inner relative mb-2 shrink-0">
                          {columna.image ? (
                            <img src={columna.image} alt={columna.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-center">
                              <span className="text-slate-300 font-bold text-[8px] uppercase block">Falta Foto</span>
                            </div>
                          )}
                        </div>

                        {/* Tarjeta de Información */}
                        <div className="w-full flex flex-col items-center text-center">
                          <span className="text-accent-deep font-mono font-bold text-[7px] bg-accent-soft px-1.5 py-0.2 rounded-full mb-1 tracking-wider leading-none">
                            {columna.code}
                          </span>

                          <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-wide leading-none mb-0.5">
                            {columna.name}
                          </h3>
                          <p className="text-[6.5px] text-slate-400 font-bold uppercase tracking-wider mb-2 leading-none">
                            {columna.description}
                          </p>

                          <div className="w-full bg-accent-deep text-white font-black text-[9.5px] py-0.5 rounded-lg shadow-sm tracking-wider">
                            {columna.price}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer info */}
            <div className="px-16 pb-8 mt-auto flex justify-between items-end shrink-0 text-[10px] text-slate-500 border-t border-slate-200 pt-4">
              <p>Los precios corresponden a color blanco.</p>
              <div className="bg-accent-gold text-white font-bold px-3 py-1 rounded shadow-sm text-xs uppercase tracking-wider">
                LOS PRECIOS NO INCLUYEN IVA
              </div>
            </div>
          </div>
        );
      })}

      {/* 
        PÁGINA DE DUCHA ESCOCESA Y VAPOR
      */}
      <div className="page-break-after p-0 min-h-[297mm] w-[210mm] mx-auto bg-white shadow-xl print:shadow-none relative overflow-hidden flex flex-col">
        {/* Banner Superior Premium */}
        <div className="relative w-full h-32 bg-accent-deep overflow-hidden shrink-0">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
          <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-accent-gold opacity-20 rounded-full blur-3xl"></div>

          <div className="absolute inset-0 flex items-center justify-between px-10">
            <h1 className="text-4xl font-bold text-white uppercase tracking-widest drop-shadow-md">
              {duchaEscocesaData.title}
            </h1>
            <img src="/logo.png" alt="Five Saint Logo" className="h-16 object-contain" />
          </div>
        </div>

        {/* Contenido Ducha Escocesa */}
        <div className="flex px-10 pt-12 gap-10">

          {/* Columna Izquierda: Imágenes */}
          <div className="w-[45%] flex flex-col gap-4">
            {/* Imágenes pequeñas superiores */}
            <div className="flex gap-4 h-32">
              <div className="w-1/2 bg-slate-50 border border-slate-200 shadow-inner rounded-xl overflow-hidden flex items-center justify-center relative">
                <img src={duchaEscocesaData.images.jet} alt="Jet" className="w-full h-full object-cover mix-blend-multiply" onError={(e) => e.currentTarget.style.display = 'none'} />
              </div>
              <div className="w-1/2 bg-slate-50 border border-slate-200 shadow-inner rounded-xl overflow-hidden flex items-center justify-center relative">
                <img src={duchaEscocesaData.images.head} alt="Duchón" className="w-full h-full object-cover mix-blend-multiply" onError={(e) => e.currentTarget.style.display = 'none'} />
              </div>
            </div>

            {/* Imagen grande inferior */}
            <div className="w-full h-[380px] bg-slate-50 border border-slate-200 shadow-inner rounded-xl overflow-hidden flex items-center justify-center relative">
              <img src={duchaEscocesaData.images.full} alt="Ducha Escocesa Completa" className="w-full h-full object-contain mix-blend-multiply p-2" onError={(e) => e.currentTarget.style.display = 'none'} />
            </div>
          </div>

          {/* Columna Derecha: Modelos */}
          <div className="w-[55%] flex flex-col gap-10">
            {duchaEscocesaData.models.map((model, idx) => (
              <div key={idx} className="flex flex-col">
                <h3 className="text-xl font-black text-[#00a8e8] mb-4 uppercase tracking-wide">
                  {model.name}
                </h3>
                <p className="text-[11px] text-slate-600 leading-relaxed whitespace-pre-line text-justify mb-6 min-h-[100px]">
                  {model.description}
                </p>
                <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-inner flex justify-between gap-2 shrink-0">
                  <span className="text-[11px] font-mono font-bold text-slate-500">{model.code}</span>
                  <span className="text-[14px] font-black text-slate-800">{model.price}</span>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Separador */}
        <div className="mx-10 my-10 border-t-2 border-slate-800"></div>

        {/* Contenido Vapor */}
        <div className="flex px-10 gap-10 mb-8">
          {/* Imagen Vapor */}
          <div className="w-[45%] h-48 bg-slate-50 border border-slate-200 shadow-inner rounded-xl overflow-hidden flex items-center justify-center relative">
            <img src={vaporData.image} alt={vaporData.title} className="w-full h-full object-cover mix-blend-multiply" onError={(e) => e.currentTarget.style.display = 'none'} />
          </div>

          {/* Textos Vapor */}
          <div className="w-[55%] flex flex-col justify-center">
            <h2 className="text-5xl font-bold text-accent-deep uppercase tracking-widest mb-4">
              {vaporData.title}
            </h2>
            <p className="text-[11px] text-slate-700 font-medium leading-relaxed mb-6 pr-10">
              {vaporData.description}
            </p>
            <div className="bg-white border border-slate-300 shadow-sm p-4 text-center rounded-lg inline-block self-start">
              <span className="text-[11px] font-bold text-slate-700">{vaporData.contact}</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-10 pb-8 mt-auto flex justify-end items-end shrink-0 text-[10px] text-slate-500 border-t border-slate-200 pt-4 mx-10">
          <div className="bg-accent-gold text-white font-bold px-3 py-1 rounded text-[9px] uppercase tracking-wider">
            LOS PRECIOS NO INCLUYEN IVA
          </div>
        </div>
      </div>

      {/* 
        PÁGINA DE SAUNA
      */}
      <div className="page-break-after p-0 min-h-[297mm] w-[210mm] mx-auto bg-white shadow-xl print:shadow-none relative overflow-hidden flex flex-col">
        {/* Banner Superior */}
        <div className="relative w-full h-32 bg-accent-deep overflow-hidden shrink-0">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>

          <div className="absolute inset-0 flex items-center justify-between px-10">
            <h1 className="text-5xl font-bold text-white tracking-widest drop-shadow-md uppercase">
              {saunaData.title}
            </h1>
            <img src="/logo.png" alt="Five Saint Logo" className="h-16 object-contain" />
          </div>
        </div>

        {/* Imágenes Superiores */}
        <div className="flex gap-4 px-10 pt-8 shrink-0 h-[280px]">
          <div className="w-1/2 bg-slate-50 border border-slate-200 shadow-inner rounded-xl overflow-hidden flex items-center justify-center relative">
            <img src={saunaData.images.main} alt="Sauna 1" className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
          </div>
          <div className="w-1/2 bg-slate-50 border border-slate-200 shadow-inner rounded-xl overflow-hidden flex items-center justify-center relative">
            <img src={saunaData.images.secondary} alt="Sauna 2" className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
          </div>
        </div>

        {/* Tabla Modelos */}
        <div className="px-10 pt-8 flex-grow flex flex-col">
          {/* Cabecera Tabla */}
          <div className="flex font-bold text-slate-800 text-[12px] mb-2 px-4 border-b-2 border-accent-deep pb-2">
            <div className="w-[25%]">Capacidad</div>
            <div className="w-[20%]">Consumo</div>
            <div className="w-[25%]">Línea</div>
            <div className="w-[30%]"></div>
          </div>

          {/* Filas */}
          <div className="flex flex-col gap-4 mt-2">
            {saunaData.models.map((model, idx) => (
              <div key={idx} className="flex bg-slate-50 border border-slate-200 rounded-xl p-4 items-center shadow-sm relative overflow-hidden">
                <div className="w-[25%] flex flex-col gap-3 text-[11px] text-slate-700 font-medium z-10">
                  <span className="text-[12px] font-bold text-slate-800">{model.capacidad}</span>
                  <div className="flex flex-col">
                    <span className="font-mono text-slate-600">{model.cabinaCode}</span>
                    <span className="font-mono text-slate-600">{model.revestimientoCode}</span>
                  </div>
                </div>

                <div className="w-[20%] flex flex-col gap-3 text-[11px] text-slate-700 z-10">
                  <span className="font-bold">{model.consumo}</span>
                  <div className="flex flex-col leading-tight">
                    <span>Cabina</span>
                    <span>Revestimiento</span>
                    <span>Interior</span>
                  </div>
                </div>

                <div className="w-[25%] text-[11px] text-slate-700 flex flex-col gap-1 z-10">
                  {model.linea.map((l, i) => (
                    <span key={i}>{l}</span>
                  ))}
                </div>

                <div className="w-[30%] flex justify-end z-10">
                  {/* Placeholder for diagram */}
                  <div className="w-24 h-14 bg-white border border-slate-300 rounded shadow-inner flex items-center justify-center relative overflow-hidden">
                    <img src={model.image} alt="Diagrama" className="w-full h-full object-contain p-1 mix-blend-multiply" onError={(e) => e.currentTarget.style.display = 'none'} />
                    <span className="absolute text-[6px] text-slate-300">Esquema</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Opcionales y Notas */}
          <div className="flex justify-between items-end mt-12 mb-4">
            {/* Opcionales */}
            <div className="w-1/2">
              <h3 className="text-lg font-bold text-slate-800 border-b-2 border-accent-deep pb-1 mb-4 inline-block">Opcionales</h3>
              <div className="flex flex-col gap-2">
                {saunaData.opcionales.map((opc, idx) => (
                  <div key={idx} className="flex gap-6 text-[11px] text-slate-700">
                    <span className="font-mono font-bold w-16">{opc.code}</span>
                    <span>{opc.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Nota */}
            <div className="w-[45%] border border-slate-300 rounded-md p-4 text-[10px] text-slate-600 bg-white leading-relaxed text-center shadow-sm">
              {saunaData.note.split('\n').map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-10 pb-8 mt-auto flex justify-between items-center shrink-0 border-t border-slate-200 pt-4 mx-10">
          <div className="text-[10px] text-slate-600 flex items-center gap-2">
            Solicitar cotización a: <span className="border border-slate-300 px-2 py-1 bg-white font-mono">{saunaData.contact.split(': ')[1]}</span>
          </div>
          <div className="bg-accent-gold text-white font-bold px-3 py-1 rounded text-[9px] uppercase tracking-wider">
            LOS PRECIOS NO INCLUYEN IVA
          </div>
        </div>
      </div>
      {/* 
        CONTRA TAPA
      */}
      <div className="page-break-after p-0 h-[297mm] w-[210mm] mx-auto bg-accent-deep shadow-xl print:shadow-none relative overflow-hidden flex flex-col justify-center items-center">
        {/* Fondo Moderno Premium (Luces y Degradados) */}
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-accent-soft via-transparent to-transparent"></div>
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-accent-gold opacity-10 rounded-full blur-[100px]"></div>

        {/* Formas Abstractas (Ondas modernas) */}
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none rotate-180">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0,0 L100,0 L100,100 Q40,60 0,100 Z" className="fill-accent-soft opacity-30"></path>
            <path d="M0,100 Q50,40 100,100 Z" className="fill-white opacity-10"></path>
          </svg>
        </div>

        {/* Contenido Central */}
        <div className="relative z-10 flex flex-col items-center mt-[-100px]">
          {/* Imagen del Logo */}
          <div className="mb-12 relative z-10 w-56 h-56 flex justify-center items-center">
            <img src="/logo.png" alt="Five Saint" className="w-full h-full object-contain drop-shadow-xl" />
          </div>

          {/* Título o Lema */}
          <h2 className="text-white text-2xl font-light tracking-[0.3em] uppercase mb-4 text-center drop-shadow-md">
            Calidad y <span className="font-black text-accent-gold">Diseño</span>
          </h2>
          <div className="w-16 h-1 bg-accent-gold rounded-full shadow-[0_0_15px_rgba(212,175,55,0.6)]"></div>
        </div>

        {/* Zócalo de Contacto */}
        <div className="absolute bottom-0 w-full bg-white/5 backdrop-blur-md border-t border-white/10 z-10 p-8 flex flex-col items-center gap-6">
          <div className="grid grid-cols-2 gap-x-16 gap-y-8 w-fit text-white text-xs">

            {/* Contacto 1 - Dirección */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-accent-gold/20 flex items-center justify-center text-accent-gold shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-accent-gold tracking-wider uppercase text-[9px] mb-0.5">Dirección</span>
                <span className="text-[10px] font-medium opacity-90 leading-tight">Baradero 1520, B1708 Morón<br />Provincia de Buenos Aires, Argentina</span>
              </div>
            </div>

            {/* Contacto 2 - Web */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-accent-gold/20 flex items-center justify-center text-accent-gold shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-accent-gold tracking-wider uppercase text-[9px] mb-0.5">Sitio Web</span>
                <span className="text-[11px] font-medium opacity-90">www.fivesaint.com</span>
              </div>
            </div>

            {/* Contacto 3 - Instagram */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-accent-gold/20 flex items-center justify-center text-accent-gold shrink-0">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.88z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-accent-gold tracking-wider uppercase text-[9px] mb-0.5">Instagram</span>
                <span className="text-[11px] font-medium opacity-90">@Five Saint</span>
              </div>
            </div>

            {/* Contacto 4 - YouTube */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-accent-gold/20 flex items-center justify-center text-accent-gold shrink-0">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.498 5.814a3.016 3.016 0 0 0 2.122 2.136c1.872.55 9.377.55 9.377.55s7.505 0 9.377-.55a3.016 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-accent-gold tracking-wider uppercase text-[9px] mb-0.5">YouTube</span>
                <span className="text-[11px] font-medium opacity-90">@FiveSaintOk</span>
              </div>
            </div>
          </div>

          <div className="w-full border-t border-white/10 pt-4 mt-2 text-center text-white/40 text-[9px] uppercase tracking-widest">
            © {new Date().getFullYear()} Five Saint - Acrílico Sanitario. Todos los derechos reservados.
          </div>
        </div>
      </div>
    </div>
  );
});

PriceListPdf.displayName = 'PriceListPdf';
