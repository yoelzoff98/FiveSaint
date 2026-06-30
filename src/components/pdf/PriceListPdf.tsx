import React, { forwardRef } from 'react';
import { banerasData, equipamientosData, ofertasData, spaDataPage1, spaDataPage2, spaOpcionalesData, platosDuchaData, columnasDuchaData, duchaEscocesaData, vaporData } from '@/config/price-list-data';
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
              16/23
            </div>
          </div>
        </div>
      </div>

      {/* 
        PÁGINA 1: Bañeras
      */}
      {/* 
        PÁGINAS DE BAÑERAS
      */}
      {Array.from({ length: Math.ceil(banerasData.products.length / 13) }).map((_, pageIndex) => {
        const chunk = banerasData.products.slice(pageIndex * 13, (pageIndex + 1) * 13);
        
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
                      <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Modelo</th>
                      <th className="py-3 px-2 font-semibold uppercase tracking-wider text-[11px]">Medidas</th>
                      <th className="py-3 px-2 font-semibold uppercase tracking-wider text-[11px]">Cascos</th>
                      <th className="py-3 px-2 font-semibold uppercase tracking-wider text-[11px]">4 Jet</th>
                      <th className="py-3 px-2 font-semibold uppercase tracking-wider text-[11px]">6 Jet</th>
                      <th className="py-3 px-2 font-semibold uppercase tracking-wider text-[11px] text-accent-gold">8 Jet</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chunk.map((p, idx) => (
                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-4 font-bold text-slate-700 w-1/4">
                          <div className="flex items-center gap-3">
                            {p.image ? (
                              <img src={p.image} alt={p.name} className="w-10 h-10 object-contain drop-shadow-sm mix-blend-multiply" />
                            ) : (
                              <div className="w-10 h-10 bg-accent-soft/30 rounded flex items-center justify-center shrink-0 border border-slate-100">
                                <span className="text-accent-gold/40 font-bold text-[10px]">FS</span>
                              </div>
                            )}
                            <span className="text-accent-deep text-[13px]">{p.name}</span>
                          </div>
                        </td>
                        <td className="py-2 px-2 text-slate-500 font-mono text-[11px] whitespace-nowrap">{p.medidas}</td>
                        <td className="py-2 px-2 font-medium text-[12px]">{p.cascos || '-'}</td>
                        <td className="py-2 px-2">
                          {p.oferta === 'OFERTA' ? (
                            <span className="font-bold text-white bg-accent-gold px-2 py-1 rounded text-[10px] uppercase tracking-wider shadow-sm">OFERTA</span>
                          ) : (
                            <span className="font-medium text-slate-600 text-[12px]">{p.jet4 || '-'}</span>
                          )}
                        </td>
                        <td className="py-2 px-2 font-medium text-slate-600 text-[12px]">{p.jet6 || '-'}</td>
                        <td className="py-2 px-2 font-bold text-accent-deep bg-accent-soft/30 text-[12px]">{p.jet8 || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer info Bañeras */}
            <div className="px-10 pb-8 mt-6 flex justify-between items-end shrink-0">
              <div className="text-[10px] text-slate-400 max-w-sm">
                <p>Los precios corresponden a color blanco.</p>
                <p className="mt-1">Las medidas y las imágenes son ilustrativas sujetas a variaciones sin previo aviso.</p>
              </div>
              <div className="bg-accent-gold text-white font-bold px-4 py-2 rounded-lg shadow-md text-sm uppercase tracking-wider">
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
              
              <div className="absolute inset-0 flex items-center px-10">
                <h1 className="text-4xl font-bold text-white uppercase tracking-widest drop-shadow-md">
                  Equipamientos {pageIndex > 0 && <span className="text-xl text-white/70 ml-2">(Cont.)</span>}
                </h1>
              </div>
            </div>

            {/* Tabla Equipamientos (Compacta) */}
            <div className="px-10 mt-3 flex-grow">
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                {chunk.map((e, idx) => (
                  <div key={idx} className="flex bg-white border-b border-slate-200 pb-1.5 hover:bg-slate-50 transition-colors">
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
                      <p className="text-[10px] text-slate-500 leading-tight line-clamp-2 pr-2">{e.descripcion}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Footer info Pág Equipamientos */}
            <div className="px-10 pb-4 mt-auto flex justify-end shrink-0">
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
          <div key={`ofertas-page-${pageIndex}`} className="page-break-after p-0 min-h-[297mm] w-[210mm] mx-auto bg-white shadow-xl print:shadow-none relative overflow-hidden flex flex-col">
            {/* Banner Ofertas */}
            <div className="relative w-full h-24 flex items-center justify-center bg-accent-soft border-b border-white shrink-0">
              <div className="absolute top-0 left-0 w-full h-8 bg-accent-deep"></div>
              
              {/* Título Central */}
              <div className="bg-accent-deep text-white px-16 py-3 shadow-md z-10 relative top-2">
                <h1 className="text-5xl font-black italic tracking-widest drop-shadow-md">
                  OFERTAS {pageIndex > 0 && <span className="text-2xl ml-2">(Cont.)</span>}
                </h1>
              </div>
            </div>

            {/* Listado de Ofertas */}
            <div className="flex-grow mt-12 flex flex-col gap-12 pt-6">
              {chunk.map((oferta, idx) => {
                const isEven = idx % 2 === 0;
                return (
                  <div key={idx} className="relative w-full h-56 flex items-center">
                    {/* Franja de fondo celeste */}
                    <div className="absolute w-full h-32 bg-accent-soft top-1/2 -translate-y-1/2 -z-10"></div>
                    
                    <div className={`w-full flex ${isEven ? 'flex-row' : 'flex-row-reverse'} px-10 gap-8 h-full items-center`}>
                      
                      {/* Imagen de la bañera */}
                      <div className="w-[55%] relative h-[120%] flex items-center justify-center drop-shadow-xl z-10">
                        {oferta.image ? (
                          <img src={oferta.image} alt={oferta.name} className={`max-h-full max-w-full object-contain ${!isEven ? '-scale-x-100' : ''}`} />
                        ) : (
                          <div className="w-64 h-32 bg-white rounded-3xl shadow-inner border border-slate-200 flex items-center justify-center">
                            <span className="text-slate-300 font-bold text-xl uppercase">Sin Imagen</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Tarjeta de información */}
                      <div className="w-[45%] flex flex-col h-[85%] bg-transparent justify-center pt-2">
                        {/* Título y Label */}
                        <div className="flex items-start justify-between mb-1">
                          <div>
                            <h3 className="text-lg font-bold text-slate-800 leading-none">{oferta.name}</h3>
                            <span className="text-sm font-medium text-slate-600">{oferta.medidas}</span>
                          </div>
                          <div className="bg-accent-deep text-white font-bold italic px-3 py-1 flex items-center gap-2 shadow-sm">
                            <div className="w-0 h-0 border-t-4 border-t-transparent border-l-6 border-l-white border-b-4 border-b-transparent mr-1"></div>
                            {oferta.jetLabel}
                          </div>
                        </div>
                        
                        {/* Descripción */}
                        <p className="text-[10px] text-slate-700 leading-tight mb-auto mt-2 text-justify">
                          {oferta.descripcion}
                        </p>
                        
                        {/* Precio */}
                        <div className="bg-accent-deep text-white font-bold text-xl py-2 mt-4 text-center shadow-md">
                          {oferta.precio}
                        </div>
                      </div>
                      
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer info Ofertas */}
            <div className="px-10 pb-8 mt-10 flex justify-between items-end shrink-0 text-[10px] text-slate-500">
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
        <div className="relative w-full h-32 bg-accent-deep overflow-hidden shrink-0">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
          <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-accent-gold opacity-20 rounded-full blur-3xl"></div>
          
          <div className="absolute inset-0 flex items-center justify-between px-10">
            <h1 className="text-5xl font-bold text-white uppercase tracking-widest drop-shadow-md">
              SPA
            </h1>
          </div>
        </div>

        {/* Contenido SPA Page 1 */}
        <div className="flex-grow px-10 pt-2 flex gap-8">
          {spaDataPage1.map((spa, idx) => (
            <div key={idx} className="w-1/2 flex flex-col">
              {/* Título de Modelo, Dimensiones y Espacio para Imagen */}
              <div className="mb-1 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-accent-deep uppercase tracking-wide leading-none">{spa.name}</h2>
                  <p className="text-[9px] text-slate-500 font-mono mt-1 whitespace-pre-line leading-tight">{spa.dimensions}</p>
                </div>
                {/* Espacio para la imagen del SPA */}
                <div className="w-24 h-16 bg-slate-50 rounded-lg overflow-hidden flex items-center justify-center border border-slate-200 shrink-0 shadow-inner relative">
                  {spa.image ? (
                    <img src={spa.image} alt={spa.name} className="w-full h-full object-contain mix-blend-multiply drop-shadow-md" />
                  ) : (
                    <div className="text-center">
                      <span className="text-slate-300 font-bold text-[8px] uppercase block">Falta Foto</span>
                    </div>
                  )}
                </div>
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
        <div className="relative w-full h-32 bg-accent-deep overflow-hidden shrink-0">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
          <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-accent-gold opacity-20 rounded-full blur-3xl"></div>
          
          <div className="absolute inset-0 flex items-center justify-between px-10">
            <h1 className="text-5xl font-bold text-white uppercase tracking-widest drop-shadow-md">
              SPA <span className="text-2xl text-white/70 ml-3">(Cont.)</span>
            </h1>
          </div>
        </div>

        {/* Contenido SPA Page 2 */}
        <div className="flex-grow px-10 pt-4 flex gap-8">
          {spaDataPage2.map((spa, idx) => (
            <div key={idx} className="w-1/2 flex flex-col">
              {/* Título de Modelo, Dimensiones y Espacio para Imagen */}
              <div className="mb-2 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-black text-accent-deep uppercase tracking-wide leading-none">{spa.name}</h2>
                  <p className="text-[9px] text-slate-500 font-mono mt-2 whitespace-pre-line leading-tight">{spa.dimensions}</p>
                </div>
                {/* Espacio para la imagen del SPA */}
                <div className="w-32 h-20 bg-slate-50 rounded-lg overflow-hidden flex items-center justify-center border border-slate-200 shrink-0 shadow-inner relative">
                  {spa.image ? (
                    <img src={spa.image} alt={spa.name} className="w-full h-full object-contain mix-blend-multiply drop-shadow-md" />
                  ) : (
                    <div className="text-center">
                      <span className="text-slate-300 font-bold text-[8px] uppercase block">Falta Foto</span>
                    </div>
                  )}
                </div>
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
        PÁGINA DE PLATOS DE DUCHA
      */}
      <div className="page-break-after p-0 min-h-[297mm] w-[210mm] mx-auto bg-white shadow-xl print:shadow-none relative overflow-hidden flex flex-col">
        {/* Banner Superior Premium */}
        <div className="relative w-full h-32 bg-accent-deep overflow-hidden shrink-0">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
          <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-accent-gold opacity-20 rounded-full blur-3xl"></div>
          
          <div className="absolute inset-0 flex items-center justify-between px-10">
            <h1 className="text-4xl font-bold text-white uppercase tracking-widest drop-shadow-md">
              Platos de Ducha <span className="text-xl text-white/70 ml-2">Acrílico</span>
            </h1>
          </div>
        </div>

        {/* Contenido Platos de Ducha (2 Columnas) */}
        <div className="flex-grow px-10 pt-6 flex gap-8">
          {/* Columna Izquierda (Rectos y Curvos) */}
          <div className="w-1/2 flex flex-col gap-6">
            {platosDuchaData.slice(0, 2).map((cat, idx) => (
              <div key={idx} className="flex flex-col">
                <div className="flex justify-between items-end border-b-2 border-accent-deep pb-2 mb-4">
                  <h3 className="text-2xl font-black text-accent-deep uppercase tracking-wide">{cat.title}</h3>
                </div>
                
                <div className="flex flex-col gap-4">
                  {/* Imagen de la Categoría */}
                  <div className="w-full h-40 bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200 shadow-inner relative">
                    {cat.image ? (
                      <img src={cat.image} alt={cat.title} className="w-full h-full object-contain mix-blend-multiply drop-shadow-md p-2" />
                    ) : (
                      <div className="text-center">
                        <span className="text-slate-300 font-bold text-[10px] uppercase block">Falta Foto</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Tabla de Modelos */}
                  <div className="rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                    <table className="w-full text-left border-collapse bg-white text-[9px]">
                      <thead className="bg-accent-deep text-white">
                        <tr>
                          <th className="py-2 px-2 font-semibold uppercase">Cód.</th>
                          <th className="py-2 px-1 text-center font-semibold uppercase">Largo</th>
                          <th className="py-2 px-1 text-center font-semibold uppercase">Ancho</th>
                          <th className="py-2 px-1 text-center font-semibold uppercase">Alto</th>
                          <th className="py-2 px-1 text-center font-semibold uppercase">Prof.</th>
                          <th className="py-2 px-2 text-right font-semibold uppercase">Precio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cat.items.map((item, iIdx) => (
                          <tr key={iIdx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                            <td className="py-1 px-2 text-slate-500 font-mono font-bold">{item.code}</td>
                            <td className="py-1 px-1 text-center text-slate-700">{item.largo}</td>
                            <td className="py-1 px-1 text-center text-slate-700">{item.ancho}</td>
                            <td className="py-1 px-1 text-center text-slate-700">{item.altura}</td>
                            <td className="py-1 px-1 text-center text-slate-700">{item.profundidad}</td>
                            <td className="py-1 px-2 text-right font-black text-accent-deep">{item.price}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Accesorio Desagüe */}
                  {cat.desagueCode && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex justify-between items-center shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                          <img src="/images/desague.png" alt="Desagüe" className="w-8 h-8 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                        </div>
                        <div>
                          <h4 className="text-[11px] font-bold text-slate-800 uppercase">Desagüe</h4>
                          <span className="text-[9px] font-mono text-slate-500">{cat.desagueCode}</span>
                        </div>
                      </div>
                      <span className="text-[12px] font-black text-accent-deep">{cat.desaguePrice}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Columna Derecha (Rectangulares y Línea de Luxe) */}
          <div className="w-1/2 flex flex-col gap-6">
            {platosDuchaData.slice(2, 4).map((cat, idx) => (
              <div key={idx} className="flex flex-col">
                <div className="flex justify-between items-end border-b-2 border-accent-deep pb-2 mb-4">
                  <h3 className="text-2xl font-black text-accent-deep uppercase tracking-wide">{cat.title}</h3>
                </div>
                
                <div className="flex flex-col gap-4">
                  {/* Imagen de la Categoría */}
                  <div className="w-full h-40 bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200 shadow-inner relative">
                    {cat.image ? (
                      <img src={cat.image} alt={cat.title} className="w-full h-full object-contain mix-blend-multiply drop-shadow-md p-2" />
                    ) : (
                      <div className="text-center">
                        <span className="text-slate-300 font-bold text-[10px] uppercase block">Falta Foto</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Tabla de Modelos */}
                  <div className="rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                    <table className="w-full text-left border-collapse bg-white text-[9px]">
                      <thead className="bg-accent-deep text-white">
                        <tr>
                          <th className="py-2 px-2 font-semibold uppercase">Cód.</th>
                          <th className="py-2 px-1 text-center font-semibold uppercase">Largo</th>
                          <th className="py-2 px-1 text-center font-semibold uppercase">Ancho</th>
                          <th className="py-2 px-1 text-center font-semibold uppercase">Alto</th>
                          <th className="py-2 px-1 text-center font-semibold uppercase">Prof.</th>
                          <th className="py-2 px-2 text-right font-semibold uppercase">Precio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cat.items.map((item, iIdx) => (
                          <tr key={iIdx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                            <td className="py-1 px-2 text-slate-500 font-mono font-bold">{item.code}</td>
                            <td className="py-1 px-1 text-center text-slate-700">{item.largo}</td>
                            <td className="py-1 px-1 text-center text-slate-700">{item.ancho}</td>
                            <td className="py-1 px-1 text-center text-slate-700">{item.altura}</td>
                            <td className="py-1 px-1 text-center text-slate-700">{item.profundidad}</td>
                            <td className="py-1 px-2 text-right font-black text-accent-deep">{item.price}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Accesorio Desagüe */}
                  {cat.desagueCode && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex justify-between items-center shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                          <img src="/images/desague.png" alt="Desagüe" className="w-8 h-8 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                        </div>
                        <div>
                          <h4 className="text-[11px] font-bold text-slate-800 uppercase">Desagüe</h4>
                          <span className="text-[9px] font-mono text-slate-500">{cat.desagueCode}</span>
                        </div>
                      </div>
                      <span className="text-[12px] font-black text-accent-deep">{cat.desaguePrice}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="px-10 pb-8 mt-auto flex justify-between items-end shrink-0 text-[10px] text-slate-500 border-t border-slate-200 pt-4 mx-10">
          <p>Los precios corresponden a color blanco.</p>
          <div className="bg-accent-gold text-white font-bold px-3 py-1 rounded shadow-sm text-xs uppercase tracking-wider">
            LOS PRECIOS NO INCLUYEN IVA
          </div>
        </div>
      </div>

      {/* 
        PÁGINA DE COLUMNAS DE DUCHA
      */}
      <div className="page-break-after p-0 min-h-[297mm] w-[210mm] mx-auto bg-white shadow-xl print:shadow-none relative overflow-hidden flex flex-col">
        {/* Banner Superior Premium */}
        <div className="relative w-full h-32 bg-accent-deep overflow-hidden shrink-0">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
          <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-accent-gold opacity-20 rounded-full blur-3xl"></div>
          
          <div className="absolute inset-0 flex flex-col justify-center px-10">
            <h1 className="text-4xl font-bold text-white uppercase tracking-widest drop-shadow-md">
              Columnas de Ducha
            </h1>
            <p className="text-white/80 tracking-widest uppercase text-sm mt-1">
              Para hidromasaje vertical
            </p>
          </div>
        </div>

        {/* Contenido Columnas (4 en fila horizontal) */}
        <div className="flex-grow px-8 pt-16 flex gap-4 justify-between">
          {columnasDuchaData.map((columna, idx) => (
            <div key={idx} className="flex flex-col items-center w-[22%]">
              
              {/* Espacio para la imagen alta (columna) */}
              <div className="w-full h-[500px] bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200 shadow-inner relative mb-6">
                {columna.image ? (
                  <img src={columna.image} alt={columna.name} className="max-h-full max-w-full object-contain mix-blend-multiply drop-shadow-lg p-2" />
                ) : (
                  <div className="text-center">
                    <span className="text-slate-300 font-bold text-[12px] uppercase block">Falta Foto</span>
                  </div>
                )}
              </div>
              
              {/* Tarjeta de Información */}
              <div className="w-full bg-white border border-slate-200 shadow-md rounded-xl p-4 flex flex-col items-center text-center relative">
                {/* Triángulo decorativo apuntando a la imagen */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[12px] border-b-accent-deep"></div>
                
                <span className="text-accent-deep font-mono font-bold text-[10px] bg-accent-soft/30 px-3 py-1 rounded-full mb-3">
                  {columna.code}
                </span>
                
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-wider leading-none mb-1">
                  {columna.name}
                </h3>
                <p className="text-[10px] text-slate-500 font-medium mb-4">
                  {columna.description}
                </p>
                
                <div className="w-full mt-auto bg-accent-deep text-white font-black text-lg py-2 rounded shadow-sm">
                  {columna.price}
                </div>
              </div>

            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="px-10 pb-8 mt-auto flex justify-between items-end shrink-0 text-[10px] text-slate-500 border-t border-slate-200 pt-4 mx-10">
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
            <span className="absolute text-[8px] text-slate-300 font-mono">vapor.png</span>
          </div>
          
          {/* Textos Vapor */}
          <div className="w-[55%] flex flex-col justify-center">
            <h2 className="text-5xl font-black text-slate-900 italic tracking-tighter mb-4">
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
    </div>
  );
});

PriceListPdf.displayName = 'PriceListPdf';
