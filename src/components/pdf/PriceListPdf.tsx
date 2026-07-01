import React, { forwardRef } from 'react';
import { banerasData, equipamientosData, ofertasData, spaDataPage1, spaDataPage2, spaOpcionalesData, platosDuchaData, columnasDuchaData, duchaEscocesaData, vaporData, banerasPremiumData, banerasPremiumInfo, saunaData } from '@/config/price-list-data';
import Image from 'next/image';

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
        PÁGINAS DE BAÑERAS PREMIUM
      */}
      {Array.from({ length: 2 }).map((_, pageIndex) => {
        const chunk = pageIndex === 0
          ? banerasPremiumData.slice(0, 8)
          : banerasPremiumData.slice(8);

        return (
          <div key={`baneras-premium-page-${pageIndex}`} className="page-break-after p-0 min-h-[297mm] w-[210mm] mx-auto bg-white shadow-xl print:shadow-none relative overflow-hidden flex flex-col">
            {/* Banner Superior */}
            <div className="relative w-full h-32 bg-accent-deep overflow-hidden shrink-0">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>

              <div className="absolute inset-0 flex flex-col justify-center px-10">
                <h1 className="text-4xl font-bold text-white uppercase tracking-widest drop-shadow-md">
                  Bañeras Premium {pageIndex > 0 && <span className="text-xl text-white/70 ml-2">(Cont.)</span>}
                </h1>
              </div>
            </div>

            {/* Descripciones de Equipamiento (solo en pág 1) */}
            {pageIndex === 0 && (
              <div className="px-10 pt-4 shrink-0">
                <div className="flex gap-4">
                  <div className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg p-3 shadow-sm">
                    <h3 className="text-sm font-bold text-accent-deep uppercase mb-1">Equipamiento CONFORT</h3>
                    <p className="text-xs text-slate-700 leading-relaxed">{banerasPremiumInfo.confortDesc}</p>
                  </div>
                  <div className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg p-3 shadow-sm">
                    <h3 className="text-sm font-bold text-accent-gold uppercase mb-1">Equipamiento CONFORT PLUS</h3>
                    <p className="text-xs text-slate-700 leading-relaxed">{banerasPremiumInfo.confortPlusDesc}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Listado de Bañeras Premium */}
            <div className={`px-10 flex-grow flex flex-col gap-2 ${pageIndex === 0 ? 'pt-4' : 'pt-6'}`}>
              {chunk.map((item, idx) => (
                <div key={idx} className="flex gap-4 border border-slate-200 rounded-xl p-2 shadow-sm items-center hover:bg-slate-50 transition-colors">
                  {/* Imagen */}
                  <div className="w-24 h-16 bg-white rounded-lg border border-slate-200 flex items-center justify-center shrink-0 shadow-inner overflow-hidden relative">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-contain mix-blend-multiply p-1" />
                    ) : (
                      <span className="text-[8px] text-slate-300 font-bold uppercase">Falta Foto</span>
                    )}
                  </div>

                  {/* Detalles y Precios */}
                  <div className="flex-grow flex justify-between items-center">
                    {/* Info */}
                    <div className="w-1/3">
                      <h3 className="text-sm font-black text-accent-deep uppercase leading-tight">{item.name}</h3>
                      <p className="text-[10px] font-mono text-slate-500 mt-1">Medidas: {item.medidas}</p>
                    </div>

                    {/* Tabla de precios */}
                    <div className="w-2/3 flex gap-4">
                      {/* Confort */}
                      <div className="w-1/2 flex flex-col items-end justify-center">
                        <span className="text-[9px] font-bold text-slate-600 uppercase mb-1">Confort</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[9px] font-mono text-slate-400">{item.confortCode}</span>
                          <span className="text-xs font-black text-accent-deep">{item.confortPrice}</span>
                        </div>
                      </div>
                      {/* Confort Plus */}
                      <div className="w-1/2 flex flex-col items-end justify-center border-l border-slate-200 pl-4">
                        <span className="text-[9px] font-bold text-accent-gold uppercase mb-1">Confort Plus</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[9px] font-mono text-slate-400">{item.confortPlusCode}</span>
                          <span className="text-xs font-black text-accent-deep">{item.confortPlusPrice}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer info */}
            <div className="px-10 pb-8 mt-auto flex justify-end items-end shrink-0 pt-4">
              <div className="bg-accent-gold text-white font-bold px-3 py-1 rounded shadow-sm text-xs uppercase tracking-wider">
                LOS PRECIOS NO INCLUYEN IVA
              </div>
            </div>
          </div>
        );
      })}

      {/* 
        PÁGINAS DE BAÑERAS
      */}
      {Array.from({ length: Math.ceil(banerasData.products.length / 10) }).map((_, pageIndex) => {
        const chunk = banerasData.products.slice(pageIndex * 10, (pageIndex + 1) * 10);

        return (
          <div key={`baneras-page-${pageIndex}`} className="page-break-after p-0 min-h-[297mm] w-[210mm] mx-auto bg-white shadow-xl print:shadow-none relative overflow-hidden flex flex-col">

            {/* Banner Superior Premium (Igual a Equipamientos) */}
            <div className="relative w-full h-40 bg-accent-deep overflow-hidden shrink-0">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
              <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-accent-gold opacity-20 rounded-full blur-3xl"></div>

              <div className="absolute inset-0 flex items-center justify-between px-10">
                <h1 className="text-5xl font-bold text-white uppercase tracking-widest drop-shadow-md flex items-baseline">
                  {banerasData.title} {pageIndex > 0 && <span className="text-2xl text-white/70 ml-3">(Cont.)</span>}
                </h1>
                {pageIndex === 0 && (
                  <div className="w-32 h-16 relative p-2 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20">
                    <Image
                      src="/logo.png"
                      alt="Five Saint Logo"
                      fill
                      className="object-contain filter brightness-0 invert"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Tabla Bañeras */}
            <div className="px-10 flex-grow mt-6">
              <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                <table className="w-full text-left border-collapse bg-white">
                  <thead className="bg-accent-deep text-white">
                    <tr>
                      <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[12px]">Modelo</th>
                      <th className="py-3.5 px-2 font-semibold uppercase tracking-wider text-[12px]">Medidas</th>
                      <th className="py-3.5 px-2 font-semibold uppercase tracking-wider text-[12px]">Cascos</th>
                      <th className="py-3.5 px-2 font-semibold uppercase tracking-wider text-[12px]">4 Jet</th>
                      <th className="py-3.5 px-2 font-semibold uppercase tracking-wider text-[12px]">6 Jet</th>
                      <th className="py-3.5 px-2 font-semibold uppercase tracking-wider text-[12px] text-accent-gold">8 Jet</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chunk.map((p, idx) => (
                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-1.5 px-4 font-bold text-slate-700 w-1/4">
                          <div className="flex items-center gap-3">
                            {p.image ? (
                              <img src={p.image} alt={p.name} className="w-16 h-16 object-contain drop-shadow-sm mix-blend-multiply" />
                            ) : (
                              <div className="w-16 h-16 bg-accent-soft/30 rounded flex items-center justify-center shrink-0 border border-slate-100">
                                <span className="text-accent-gold/40 font-bold text-[12px]">FS</span>
                              </div>
                            )}
                            <span className="text-accent-deep text-[14px]">{p.name}</span>
                          </div>
                        </td>
                        <td className="py-1.5 px-2 text-slate-500 font-mono text-[12px] whitespace-nowrap">{p.medidas}</td>
                        <td className="py-1.5 px-2 font-medium text-[13px]">{p.cascos || '-'}</td>
                        <td className="py-1.5 px-2">
                          {p.oferta === 'OFERTA' ? (
                            <span className="font-bold text-white bg-accent-gold px-2 py-1 rounded text-[11px] uppercase tracking-wider shadow-sm">OFERTA</span>
                          ) : (
                            <span className="font-medium text-slate-600 text-[13px]">{p.jet4 || '-'}</span>
                          )}
                        </td>
                        <td className="py-1.5 px-2 font-medium text-slate-600 text-[13px]">{p.jet6 || '-'}</td>
                        <td className="py-1.5 px-2 font-bold text-accent-deep bg-accent-soft/30 text-[13px]">{p.jet8 || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer info Bañeras */}
            <div className="px-10 pb-8 mt-auto flex justify-between items-end shrink-0">
              <div className="text-[10px] text-slate-400 max-w-sm mb-2">
                <p>Los precios corresponden a color blanco.</p>
                <p className="mt-1">Las medidas y las imágenes son ilustrativas sujetas a variaciones sin previo aviso.</p>
              </div>
              <div className="bg-accent-gold text-white font-bold px-4 py-2 rounded-lg shadow-md text-sm uppercase tracking-wider mb-2">
                LOS PRECIOS NO INCLUYEN IVA
              </div>
            </div>
          </div>
        );
      })}

      {/* 
        PÁGINAS DE EQUIPAMIENTOS
      */}
      {Array.from({ length: Math.ceil(equipamientosData.length / 18) }).map((_, pageIndex) => {
        // Cortamos los datos en grupos de 18 (9 filas x 2 columnas) para cada página A4
        const chunk = equipamientosData.slice(pageIndex * 18, (pageIndex + 1) * 18);

        return (
          <div key={`equip-page-${pageIndex}`} className="page-break-after p-0 min-h-[297mm] w-[210mm] mx-auto bg-white shadow-xl print:shadow-none relative overflow-hidden flex flex-col">
            {/* Banner Superior con Ángulo */}
            <div className="relative w-full h-24 bg-accent-deep overflow-hidden shrink-0">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
              <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-accent-gold opacity-20 rounded-full blur-3xl"></div>

              <div className="absolute inset-0 flex items-center px-16">
                <h1 className="text-4xl font-bold text-white uppercase tracking-widest drop-shadow-md">
                  Equipamientos {pageIndex > 0 && <span className="text-xl text-white/70 ml-2">(Cont.)</span>}
                </h1>
              </div>
            </div>

            {/* Tabla Equipamientos (Centrada) */}
            <div className="px-16 pt-10 pb-12 flex-grow flex flex-col justify-center">
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                {chunk.map((e, idx) => (
                  <div key={idx} className="flex bg-white border-b border-slate-200 pb-3 hover:bg-slate-50 transition-colors">
                    {/* Image Section */}
                    <div className="w-12 h-12 bg-accent-soft/30 flex-shrink-0 flex items-center justify-center p-0.5 rounded-md border border-slate-100 mr-2">
                      {e.image ? (
                        <img src={e.image} alt={e.nombre} className="w-full h-full object-contain mix-blend-multiply" />
                      ) : (
                        <span className="text-accent-gold/40 font-bold text-[10px]">FS</span>
                      )}
                    </div>

                    {/* Content Section */}
                    <div className="flex-grow flex flex-col justify-between py-1">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="text-[13px] font-bold text-accent-deep leading-tight">{e.nombre}</h3>
                          <span className="text-accent-gold font-bold text-sm whitespace-nowrap shrink-0">{e.precio}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono tracking-tighter">Ref: {e.codigo}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-normal line-clamp-2 pr-2">{e.descripcion}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer info Pág Equipamientos */}
            <div className="px-16 pb-8 mt-auto flex justify-end shrink-0">
              <div className="bg-accent-deep text-white font-bold px-4 py-1.5 rounded-lg shadow-md text-xs uppercase tracking-wider">
                LOS PRECIOS NO INCLUYEN IVA
              </div>
            </div>
          </div>
        );
      })}
      {/* 
        PÁGINAS DE OFERTAS
      */}
      {Array.from({ length: Math.ceil(ofertasData.length / 3) }).map((_, pageIndex) => {
        const chunk = ofertasData.slice(pageIndex * 3, (pageIndex + 1) * 3);

        return (
          <div key={`ofertas-page-${pageIndex}`} className="page-break-after p-0 min-h-[297mm] w-[210mm] mx-auto bg-slate-50 shadow-xl print:shadow-none relative overflow-hidden flex flex-col">
            {/* Fondo decorativo premium */}
            <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-accent-soft via-transparent to-transparent"></div>
            <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-accent-gold/20 via-transparent to-transparent"></div>

            {/* Banner Ofertas */}
            <div className="relative w-full h-32 bg-accent-deep overflow-hidden shrink-0 border-b-2 border-accent-gold/40">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
              <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-accent-gold opacity-20 rounded-full blur-3xl"></div>
              <div className="absolute -top-10 -left-10 w-64 h-64 bg-accent-soft opacity-10 rounded-full blur-3xl"></div>

              <div className="absolute inset-0 flex items-center justify-between px-12">
                <div>
                  <h1 className="text-4xl font-extrabold text-white uppercase tracking-widest drop-shadow-md flex items-baseline">
                    OFERTAS <span className="text-accent-gold font-light italic ml-2">Especiales</span> {pageIndex > 0 && <span className="text-xl text-white/70 ml-3">(Cont.)</span>}
                  </h1>
                  <p className="text-white/60 tracking-widest uppercase text-[10px] mt-1">
                    Equipamiento completo de hidromasaje bonificado
                  </p>
                </div>
                {pageIndex === 0 && (
                  <div className="w-24 h-12 relative p-2 bg-white/5 rounded-lg backdrop-blur-sm border border-white/10">
                    <Image
                      src="/logo.png"
                      alt="Five Saint Logo"
                      fill
                      className="object-contain filter brightness-0 invert"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Listado de Ofertas */}
            <div className="flex-grow mt-8 flex flex-col gap-6 px-12 pt-4">
              {chunk.map((oferta, idx) => {
                const isEven = idx % 2 === 0;
                return (
                  <div key={idx} className={`bg-gradient-to-br from-white to-slate-50/50 border border-slate-200/80 rounded-3xl p-4 shadow-md flex ${isEven ? 'flex-row' : 'flex-row-reverse'} items-center gap-6 h-52 relative hover:shadow-lg transition-all duration-300`}>
                    
                    {/* Imagen de la bañera */}
                    <div className="w-[38%] relative h-full bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
                      <span className="absolute top-2 left-2 bg-accent-gold/90 text-white font-extrabold text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-full z-20 shadow-sm">
                        EXCLUSIVO
                      </span>
                      {oferta.image ? (
                        <img src={oferta.image} alt={oferta.name} className={`w-full h-full object-cover ${!isEven ? '-scale-x-100' : ''}`} />
                      ) : (
                        <div className="w-full h-full bg-slate-50 flex items-center justify-center">
                          <span className="text-slate-300 font-bold text-xs uppercase">Sin Imagen</span>
                        </div>
                      )}
                    </div>

                    {/* Tarjeta de información */}
                    <div className="w-[62%] flex flex-col h-full justify-between py-1">
                      {/* Título y Label */}
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-[17px] font-black text-accent-deep uppercase tracking-wide leading-none">{oferta.name}</h3>
                          <span className="inline-block mt-1 text-[10px] text-slate-500 font-bold font-mono bg-slate-100 px-2 py-0.5 rounded">
                            {oferta.medidas}
                          </span>
                        </div>
                        <div className="bg-gradient-to-r from-accent-gold to-accent-gold-hover text-white font-black italic text-[10px] px-3.5 py-1 rounded-full shadow-sm tracking-wider flex items-center gap-1 uppercase shrink-0">
                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                          {oferta.jetLabel}
                        </div>
                      </div>

                      {/* Descripción */}
                      <p className="text-[11px] text-slate-600 leading-relaxed mt-2 text-justify line-clamp-3 pr-2">
                        {oferta.descripcion}
                      </p>

                      {/* Precio */}
                      <div className="flex justify-between items-end mt-auto pt-2 border-t border-slate-100">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Precio Promocional</span>
                        <div className="bg-gradient-to-r from-accent-deep to-accent-hover text-white font-black text-base py-1 px-5 rounded-xl shadow-md tracking-wider">
                          {oferta.precio}
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Footer info Ofertas */}
            <div className="px-12 pb-8 mt-auto flex justify-between items-end shrink-0 text-[10px] text-slate-500 pt-4 border-t border-slate-200/50">
              <div>
                <p>Los precios corresponden a color blanco.</p>
                <p className="mt-1">Las bañeras de OFERTA se les puede agregar equipamiento <strong className="text-slate-700">sin variar la cantidad de jet.</strong></p>
              </div>
              <div className="bg-slate-200 text-slate-600 font-bold px-3 py-1 text-xs">
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
              SPA <span className="text-2xl text-white/70 ml-3">(Cont.)</span>
            </h1>
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
                  Platos de Ducha <span className="text-xl text-white/70 ml-2">Acrílico</span>
                  {pageIndex > 0 && <span className="text-xl text-white/70 ml-2">(Cont.)</span>}
                </h1>
              </div>
            </div>

            {/* Contenido Platos de Ducha (1 Columna, Centrado vertical, distribución optimizada para fotos verticales) */}
            <div className={`flex-grow px-16 py-8 flex flex-col justify-center ${pageIndex === 0 ? 'gap-6' : 'gap-10'}`}>
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
                              <img src="/images/desague.png" alt="Desagüe" className="w-6 h-6 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
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
        PÁGINA DE COLUMNAS DE DUCHA
      */}
      <div className="page-break-after p-0 min-h-[297mm] w-[210mm] mx-auto bg-slate-50 shadow-xl print:shadow-none relative overflow-hidden flex flex-col">
        {/* Fondo decorativo premium */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-accent-soft via-transparent to-transparent"></div>
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-accent-gold/20 via-transparent to-transparent"></div>

        {/* Banner Superior Premium */}
        <div className="relative w-full h-32 bg-accent-deep overflow-hidden shrink-0 border-b-2 border-accent-gold/40">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
          <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-accent-gold opacity-20 rounded-full blur-3xl"></div>
          <div className="absolute -top-10 -left-10 w-64 h-64 bg-accent-soft opacity-10 rounded-full blur-3xl"></div>

          <div className="absolute inset-0 flex items-center justify-between px-12">
            <div>
              <h1 className="text-4xl font-extrabold text-white uppercase tracking-widest drop-shadow-md">
                Columnas de Ducha
              </h1>
              <p className="text-white/60 tracking-widest uppercase text-[10px] mt-1">
                Diseño vanguardista para hidromasaje vertical
              </p>
            </div>
            <div className="w-24 h-12 relative p-2 bg-white/5 rounded-lg backdrop-blur-sm border border-white/10">
              <Image
                src="/logo.png"
                alt="Five Saint Logo"
                fill
                className="object-contain filter brightness-0 invert"
              />
            </div>
          </div>
        </div>

        {/* Contenido Columnas (4 en fila horizontal) */}
        <div className="flex-grow px-8 pt-10 flex gap-4 justify-between">
          {columnasDuchaData.map((columna, idx) => (
            <div key={idx} className="flex flex-col items-center w-[22%]">

              {/* Espacio para la imagen alta (columna) */}
              <div className="w-[120px] h-[580px] bg-white rounded-2xl overflow-hidden flex items-center justify-center border border-slate-200/80 shadow-lg relative mb-4 hover:shadow-xl transition-all duration-300">
                <span className="absolute top-2 left-2 bg-accent-gold/90 text-white font-extrabold text-[7px] uppercase tracking-widest px-2 py-0.5 rounded z-20 shadow-sm">
                  PREMIUM
                </span>
                {columna.image ? (
                  <img src={columna.image} alt={columna.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <span className="text-slate-300 font-bold text-[12px] uppercase block">Falta Foto</span>
                  </div>
                )}
              </div>

              {/* Tarjeta de Información */}
              <div className="w-full bg-gradient-to-b from-white to-slate-50 border border-slate-200/80 shadow-md rounded-2xl p-3.5 flex flex-col items-center text-center relative hover:shadow-lg transition-all duration-300">
                {/* Triángulo decorativo apuntando a la imagen */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[10px] border-b-accent-gold"></div>

                <span className="text-accent-deep font-mono font-bold text-[9px] bg-accent-soft px-3 py-0.5 rounded-full mb-2 tracking-wider">
                  {columna.code}
                </span>

                <h3 className="text-lg font-black text-slate-800 uppercase tracking-wider leading-none mb-1">
                  {columna.name}
                </h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-3">
                  {columna.description}
                </p>

                <div className="w-full mt-auto bg-gradient-to-r from-accent-deep to-accent-hover text-white font-black text-sm py-1.5 rounded-xl shadow-md tracking-wider">
                  {columna.price}
                </div>
              </div>

            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="px-12 pb-8 mt-auto flex justify-between items-end shrink-0 text-[10px] text-slate-500 border-t border-slate-200/50 pt-4 mx-12">
          <p>Las medidas y las imágenes son ilustrativas sujetas a variaciones sin previo aviso.</p>
          <div className="bg-accent-gold text-white font-bold px-3 py-1 rounded shadow-sm text-xs uppercase tracking-wider">
            LOS PRECIOS NO INCLUYEN IVA
          </div>
        </div>
      </div>

      {/* 
        PÁGINA DE DUCHA ESCOCESA Y VAPOR
      */}
      <div className="page-break-after p-0 min-h-[297mm] w-[210mm] mx-auto bg-white shadow-xl print:shadow-none relative overflow-hidden flex flex-col">
        {/* Banner Superior Premium */}
        <div className="relative w-full h-32 bg-accent-deep overflow-hidden shrink-0">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
          <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-accent-gold opacity-20 rounded-full blur-3xl"></div>

          <div className="absolute inset-0 flex flex-col justify-center px-10">
            <h1 className="text-4xl font-bold text-white uppercase tracking-widest drop-shadow-md">
              {duchaEscocesaData.title}
            </h1>
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
              <img src={duchaEscocesaData.images.full} alt="Ducha Escocesa Completa" className="w-full h-full object-cover mix-blend-multiply" onError={(e) => e.currentTarget.style.display = 'none'} />
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
            <img src={vaporData.image} alt={vaporData.title} className="max-w-full max-h-full object-contain mix-blend-multiply drop-shadow-xl p-4" onError={(e) => e.currentTarget.style.display = 'none'} />
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
          <div className="bg-slate-200 text-slate-600 font-bold px-3 py-1 text-xs">
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

          <div className="absolute inset-0 flex flex-col justify-center px-10">
            <h1 className="text-5xl font-bold text-white tracking-widest drop-shadow-md uppercase">
              {saunaData.title}
            </h1>
          </div>
        </div>

        {/* Imágenes Superiores */}
        <div className="flex gap-4 px-10 pt-8 shrink-0 h-[280px]">
          <div className="w-1/2 bg-slate-50 border border-slate-200 shadow-inner rounded-xl overflow-hidden flex items-center justify-center relative">
            <img src={saunaData.images.main} alt="Sauna 1" className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
            <span className="absolute text-[8px] text-slate-400 font-bold uppercase">Falta Foto</span>
          </div>
          <div className="w-1/2 bg-slate-50 border border-slate-200 shadow-inner rounded-xl overflow-hidden flex items-center justify-center relative">
            <img src={saunaData.images.secondary} alt="Sauna 2" className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
            <span className="absolute text-[8px] text-slate-400 font-bold uppercase">Falta Foto</span>
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
          <div className="bg-slate-200 text-slate-600 font-bold px-3 py-1 text-xs">
            LOS PRECIOS NO INCLUYEN IVA
          </div>
        </div>
      </div>
    </div>
  );
});

PriceListPdf.displayName = 'PriceListPdf';
