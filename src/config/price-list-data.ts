export interface ProductPrice {
  name: string;
  medidas: string;
  cascos?: string;
  cascosCode?: string;
  jet4?: string;
  jet4Code?: string;
  jet6?: string;
  jet6Code?: string;
  jet8?: string;
  jet8Code?: string;
  oferta?: string;
  image?: string;
}

export interface PriceCategory {
  title: string;
  subtitle?: string;
  products: ProductPrice[];
}

export interface BaneraPremium {
  name: string;
  medidas: string;
  confortCode: string;
  confortPrice: string;
  confortPlusCode: string;
  confortPlusPrice: string;
  image?: string;
}

export const banerasPremiumInfo = {
  confortDesc: "Bañera con piso reforzado, estructura metálica autoportante, 16 jets y sopapa y desborde metálico.",
  confortPlusDesc: "Bañera con piso reforzado, estructura metálica autoportante, 16 jets, sopapa y desborde metálico, almohadilla relax y comando digital."
};

export const banerasPremiumData: BaneraPremium[] = [
  { name: "Romana", medidas: "170x80", confortCode: "FS312C", confortPrice: "$ 3 199 000", confortPlusCode: "FS312CP", confortPlusPrice: "$ 4 016 000", image: "/images/Beñeras/romana.jpg" },
  { name: "Romana", medidas: "180x90", confortCode: "FS212C", confortPrice: "$ 3 199 000", confortPlusCode: "FS212CP", confortPlusPrice: "$ 4 016 000", image: "/images/Beñeras/romana.jpg" },
  { name: "Romana", medidas: "180x120", confortCode: "FS630C", confortPrice: "$ 3 758 000", confortPlusCode: "FS630CP", confortPlusPrice: "$ 4 574 500", image: "/images/Beñeras/romana.jpg" },
  { name: "Romana", medidas: "180x150", confortCode: "FS730C", confortPrice: "$ 4 174 300", confortPlusCode: "FS730CP", confortPlusPrice: "$ 4 652 800", image: "/images/Beñeras/romana.jpg" },
  { name: "Agustar", medidas: "180x150", confortCode: "FS10378C", confortPrice: "$ 3 916 900", confortPlusCode: "FS10378CP", confortPlusPrice: "$ 4 733 500", image: "/images/Beñeras/Agustar.jpg" },
  { name: "Quadra", medidas: "150x150", confortCode: "FS10601C", confortPrice: "$ 4 237 600", confortPlusCode: "FS10601CP", confortPlusPrice: "$ 5 055 000", image: "/images/Beñeras/quadra.jpg" },
  { name: "Modena", medidas: "200x144", confortCode: "FS10562C", confortPrice: "$ 4 106 000", confortPlusCode: "FS10562CP", confortPlusPrice: "$ 5 123 000", image: "/images/Beñeras/Modena.jpg" },
  { name: "Veneto", medidas: "184x100", confortCode: "FS10547C", confortPrice: "$ 3 716 800", confortPlusCode: "FS10547CP", confortPlusPrice: "$ 4 533 300", image: "/images/Beñeras/Veneto.jpg" },
  { name: "Parma", medidas: "180x80", confortCode: "FS10532C", confortPrice: "$ 3 199 000", confortPlusCode: "FS10532CP", confortPlusPrice: "$ 4 016 000", image: "/images/Beñeras/Parma.jpg" },
  { name: "Laguna", medidas: "180x106", confortCode: "FS10412C", confortPrice: "$ 3 336 300", confortPlusCode: "FS10412CP", confortPlusPrice: "$ 4 152 000", image: "/images/Beñeras/Laguna.jpg" },
  { name: "Circular", medidas: "150", confortCode: "FS10455C", confortPrice: "$ 3 671 000", confortPlusCode: "FS10455CP", confortPlusPrice: "$ 4 487 500", image: "/images/Beñeras/Circular.jpg" },
  { name: "Esquinero", medidas: "150x150", confortCode: "FS10517C", confortPrice: "$ 3 671 000", confortPlusCode: "FS10517CP", confortPlusPrice: "$ 4 487 500", image: "/images/Beñeras/Esquinera.jpg" },
  { name: "Perla", medidas: "165x90", confortCode: "FS10057C", confortPrice: "$ 2 991 000", confortPlusCode: "FS10057CP", confortPlusPrice: "$ 3 807 500", image: "/images/Beñeras/Perla.jpg" },
  { name: "Perla", medidas: "190x90", confortCode: "FS10072C", confortPrice: "$ 3 010 500", confortPlusCode: "FS10072CP", confortPlusPrice: "$ 3 826 900", image: "/images/Beñeras/Perla.jpg" },
  { name: "Perla", medidas: "180x120", confortCode: "FS10087C", confortPrice: "$ 3 536 300", confortPlusCode: "FS10087CP", confortPlusPrice: "$ 4 352 600", image: "/images/Beñeras/Perla.jpg" },
  { name: "Quarzo", medidas: "170x83", confortCode: "FS10175C", confortPrice: "$ 2 827 600", confortPlusCode: "FS10175CP", confortPlusPrice: "$ 3 835 000", image: "/images/Beñeras/Quarzo.jpg" },
  { name: "Yaquelin", medidas: "165x120", confortCode: "FS10233C", confortPrice: "$ 2 327 400", confortPlusCode: "FS10233CP", confortPlusPrice: "$ 4 154 000", image: "/images/Beñeras/Yaqueline.jpg" },
  { name: "Yaquelin", medidas: "181x91", confortCode: "FS10248C", confortPrice: "$ 3 010 500", confortPlusCode: "FS10248CP", confortPlusPrice: "$ 3 827 000", image: "/images/Beñeras/Yaqueline.jpg" }
];

export const banerasData: PriceCategory = {
  title: "Bañeras",
  subtitle: "Sistemas Hidroterapéuticos",
  products: [
    { name: "Quadra", medidas: "150x150", jet8: "$ 2 916 400", jet8Code: "FS10601", image: "/images/Beñeras/quadra.jpg" },
    { name: "Parma", medidas: "180x80", cascos: "$ 726 000", cascosCode: "FSC220", jet4: "$ 1 767 600", jet4Code: "FS10519", jet6: "$ 1 920 200", jet6Code: "FS10526", jet8: "$ 2 078 000", jet8Code: "FS10532", image: "/images/Beñeras/Parma.jpg" },
    { name: "Veneto", medidas: "184x100", cascos: "$ 968 000", cascosCode: "FSC230", jet4: "$ 2 286 000", jet4Code: "FS10535", jet6: "$ 2 481 500", jet6Code: "FS10541", jet8: "$ 2 595 800", jet8Code: "FS10547", image: "/images/Beñeras/Veneto.jpg" },
    { name: "Modena", medidas: "200x144", cascos: "$ 1 038 000", cascosCode: "FSC240", jet4: "$ 2 628 900", jet4Code: "FS10550", jet6: "$ 2 804 900", jet6Code: "FS10556", jet8: "$ 2 984 900", jet8Code: "FS10562", image: "/images/Beñeras/Modena.jpg" },
    { name: "Romana", medidas: "150x70", cascos: "$ 614 000", cascosCode: "FSC004", jet4: "$ 1 450 500", jet4Code: "FS511", jet6: "$ 1 587 600", jet6Code: "FS513", jet8: "$ 1 728 800", jet8Code: "FS515", image: "/images/Beñeras/romana.jpg" },
    { name: "Romana", medidas: "160x75", cascos: "$ 799 000", cascosCode: "FSC003", jet4: "$ 1 467 600", jet4Code: "FS411", jet6: "$ 1 605 900", jet6Code: "FS413", jet8: "$ 1 746 500", jet8Code: "FS415", image: "/images/Beñeras/romana.jpg" },
    { name: "Romana", medidas: "170x80", cascos: "$ 799 000", cascosCode: "FSC002", jet4: "$ 1 767 600", jet4Code: "FS300", jet6: "$ 1 920 200", jet6Code: "FS306", jet8: "$ 2 078 000", jet8Code: "FS312", image: "/images/Beñeras/romana.jpg" },
    { name: "Romana", medidas: "180x90", cascos: "$ 799 000", cascosCode: "FSC001", jet4: "$ 1 767 600", jet4Code: "FS200", jet6: "$ 1 920 200", jet6Code: "FS206", jet8: "$ 2 078 000", jet8Code: "FS212", image: "/images/Beñeras/romana.jpg" },
    { name: "Romana", medidas: "180x120", cascos: "$ 1 007 000", cascosCode: "FSC005", jet4: "$ 2 095 100", jet4Code: "FS610", jet6: "$ 2 264 300", jet6Code: "FS620", jet8: "$ 2 436 900", jet8Code: "FS630", image: "/images/Beñeras/romana.jpg" },
    { name: "Romana", medidas: "180x150", cascos: "$ 1 129 000", cascosCode: "FSC006", jet4: "$ 2 515 200", jet4Code: "FS710", jet6: "$ 2 730 200", jet6Code: "FS720", jet8: "$ 2 855 300", jet8Code: "FS730", image: "/images/Beñeras/romana.jpg" },
    { name: "Perla", medidas: "140x77", cascos: "$ 520 000", cascosCode: "FSC021", jet4: "$ 1 198 400", jet4Code: "FS10030", jet6: "$ 1 323 600", jet6Code: "FS10036", jet8: "$ 1 453 300", jet8Code: "FS10042", image: "/images/Beñeras/Perla.jpg" },
    { name: "Perla", medidas: "165x90", cascos: "$ 726 000", cascosCode: "FSC022", jet4: "$ 1 577 100", jet4Code: "FS10045", jet6: "OFERTA", jet6Code: "FS10051", jet8: "$ 1 869 900", jet8Code: "FS10057", image: "/images/Beñeras/Perla.jpg" },
    { name: "Perla", medidas: "190x90", cascos: "$ 759 000", cascosCode: "FSC023", jet4: "$ 1 607 100", jet4Code: "FS10060", jet6: "$ 1 742 000", jet6Code: "FS10066", jet8: "$ 1 889 400", jet8Code: "FS10072", image: "/images/Beñeras/Perla.jpg" },
    { name: "Perla", medidas: "180x120", cascos: "$ 915 000", cascosCode: "FSC024", jet4: "$ 1 904 800", jet4Code: "FS10075", jet6: "$ 2 068 800", jet6Code: "FS10081", jet8: "$ 2 215 100", jet8Code: "FS10087", image: "/images/Beñeras/Perla.jpg" },
    { name: "Lady", medidas: "150x70", cascos: "$ 533 000", cascosCode: "FSC030", jet4: "OFERTA", jet4Code: "FS10090", jet6: "$ 1 391 600", jet6Code: "FS10096", jet8: "$ 1 520 200", jet8Code: "FS10102", image: "/images/Beñeras/Lady.jpg" },
    { name: "Lady", medidas: "160x70", cascos: "$ 558 000", cascosCode: "FSC031", jet4: "$ 1 317 900", jet4Code: "FS10105", jet6: "$ 1 443 000", jet6Code: "FS10111", jet8: "$ 1 571 600", jet8Code: "FS10117", image: "/images/Beñeras/Lady.jpg" },
    { name: "Lady", medidas: "170x70", cascos: "$ 595 000", cascosCode: "FSC032", jet4: "$ 1 409 300", jet4Code: "FS10120", jet6: "$ 1 533 900", jet6Code: "FS10125", jet8: "$ 1 663 100", jet8Code: "FS10130", image: "/images/Beñeras/Lady.jpg" },
    { name: "Quarzo", medidas: "170x83", cascos: "$ 776 000", cascosCode: "FSC042", jet4: "$ 1 587 600", jet4Code: "FS10163", jet6: "OFERTA", jet6Code: "FS10169", jet8: "$ 1 897 400", jet8Code: "FS10175", image: "/images/Beñeras/Quarzo.jpg" },
    { name: "Yaquelin", medidas: "165x120", cascos: "$ 886 000", cascosCode: "FSC053", jet4: "$ 1 706 500", jet4Code: "FS10221", jet6: "$ 1 859 700", jet6Code: "FS10227", jet8: "$ 2 016 300", jet8Code: "FS10233", image: "/images/Beñeras/Yaqueline.jpg" },
    { name: "Yaquelin", medidas: "181x91", cascos: "$ 726 000", cascosCode: "FSC053B", jet4: "$ 1 607 600", jet4Code: "FS10236", jet6: "$ 1 746 500", jet6Code: "FS10242", jet8: "$ 1 889 400", jet8Code: "FS10248", image: "/images/Beñeras/Yaqueline.jpg" },
    { name: "Valeria", medidas: "140x70", cascos: "$ 520 000", cascosCode: "FSC070", jet4: "$ 1 198 400", jet4Code: "FS10296", jet6: "$ 1 323 600", jet6Code: "FS10302", jet8: "$ 1 453 300", jet8Code: "FS10308", image: "/images/Beñeras/Valeria.jpg" },
    { name: "Joya", medidas: "150x75", cascos: "$ 558 000", cascosCode: "FSC080", jet4: "$ 1 333 900", jet4Code: "FS10311", jet6: "$ 1 459 000", jet6Code: "FS10317", jet8: "$ 1 587 600", jet8Code: "FS10323", image: "/images/Beñeras/Joya.jpg" },
    { name: "Joya", medidas: "160x75", cascos: "$ 726 000", cascosCode: "FSC081", jet4: "$ 1 533 900", jet4Code: "FS10326", jet6: "$ 1 676 800", jet6Code: "FS10342", jet8: "$ 1 820 200", jet8Code: "FS10348", image: "/images/Beñeras/Joya.jpg" },
    { name: "Agustar", medidas: "180x150", cascos: "$ 1 026 000", cascosCode: "FSC100", jet4: "$ 2 286 000", jet4Code: "FS10366", jet6: "$ 2 439 200", jet6Code: "FS10372", jet8: "$ 2 595 800", jet8Code: "FS10378", image: "/images/Beñeras/Agustar.jpg" },
    { name: "Martina (con frente y estructura)", medidas: "180x120", cascos: "$ 1 221 000", cascosCode: "FSC110", jet4: "$ 2 858 100", jet4Code: "FS10381", jet6: "$ 3 010 700", jet6Code: "FS10387", jet8: "$ 3 167 300", jet8Code: "FS10393", image: "/images/Beñeras/martina.jpg" },
    { name: "Martina (sin frente)", medidas: "180x120", cascos: "$ 968 000", cascosCode: "FSC111", jet4: "$ 2 643 800", jet4Code: "FS10395B", jet6: "$ 2 796 300", jet6Code: "FS10395G", jet8: "$ 2 953 500", jet8Code: "FS10395K", image: "/images/Beñeras/martina.jpg" },
    { name: "Unica", medidas: "180x150", cascos: "$ 1 038 000", cascosCode: "FSC120", jet4: "$ 2 286 600", jet4Code: "FS10397", jet6: "$ 2 482 000", jet6Code: "FS10403", jet8: "$ 2 595 800", jet8Code: "FS10409", image: "/images/Beñeras/Unica.jpg" },
    { name: "Laguna", medidas: "180x106", cascos: "$ 915 000", cascosCode: "FSC130", jet4: "$ 1 904 800", jet4Code: "FS10412", jet6: "$ 2 058 500", jet6Code: "FS10418", jet8: "$ 2 215 100", jet8Code: "FS10424", image: "/images/Beñeras/Laguna.jpg" },
    { name: "Circular", medidas: "150 diam.", cascos: "$ 1 008 000", cascosCode: "FSC150", jet4: "$ 2 191 100", jet4Code: "FS10443", jet6: "$ 2 343 700", jet6Code: "FS10449", jet8: "OFERTA", jet8Code: "FS10455", image: "/images/Beñeras/Circular.jpg" },
    { name: "Esquinera (frente curvo)", medidas: "140x140", cascos: "$ 1 008 000", cascosCode: "FSC170", jet4: "$ 2 191 100", jet4Code: "FS10474", jet6: "$ 2 343 700", jet6Code: "FS10480", jet8: "$ 2 379 700", jet8Code: "FS10486", image: "/images/Beñeras/Esquinera.jpg" },
    { name: "Esquinero (frente recto)", medidas: "150x150", cascos: "$ 1 008 000", cascosCode: "FSC190", jet4: "$ 2 191 100", jet4Code: "FS10504", jet6: "$ 2 343 700", jet6Code: "FS10510", jet8: "OFERTA", jet8Code: "FS10517", image: "/images/Beñeras/Esquinero.jpg" }
  ]
};

export interface Equipamiento {
  codigo: string;
  nombre: string;
  descripcion: string;
  precio: string;
  image?: string;
}

export const equipamientosData: Equipamiento[] = [
  { codigo: "FSE111E", nombre: "Almohadilla c/2 jet", descripcion: "Almohadilla de relax y 2 microjet cervicales", precio: "$ 167 400", image: "/images/Equipamiento/FSE111E_APOYA CAB.C_2 CERVICALES PLUS.jpg" },
  { codigo: "FSE110", nombre: "Almohadilla de relax", descripcion: "Aplicable a cualquier bañera", precio: "$ 83 300", image: "/images/Equipamiento/FSE110 ALMOHADILLA DE RELAX.jpg" },
  { codigo: "FSE114", nombre: "Solo jet", descripcion: "De caudal regulable individual", precio: "$ 293 800", image: "/images/Equipamiento/FSE114P_JET PUNZANTE_.jpg" },
  { codigo: "FSE114P", nombre: "Jet punzante adicional", descripcion: "Mini jet adicional de masaje punzante", precio: "$ 38 600", image: "/images/Equipamiento/FSE114P_JET PUNZANTE_.jpg" },
  { codigo: "FSE119", nombre: "Potenciación de jets", descripcion: "Turbo soplador de aire a alta velocidad", precio: "$ 734 400", image: "/images/Equipamiento/FSE119_POTENCIACION DE JETS.jpg" },
  { codigo: "FSE115", nombre: "Sistema Air Pool", descripcion: "Burbujeador de piso", precio: "$ 900 100", image: "/images/Equipamiento/FSE116_SISTEMA AIR POOL _ FSE117 OZONO OZONO.jpg" },
  { codigo: "FSE116", nombre: "Sistema Air Pool / ozono", descripcion: "Burbujeador de piso con lámpara de ozonización", precio: "$ 1 323 000", image: "/images/Equipamiento/FSE116_SISTEMA AIR POOL _ FSE117 OZONO OZONO.jpg" },
  { codigo: "FSE117", nombre: "Equipo ozono de 1 lámpara", descripcion: "Aplicable a sistema de aire en los jets", precio: "$ 445 200", image: "/images/Equipamiento/FSE116_SISTEMA AIR POOL _ FSE117 OZONO OZONO.jpg" },
  { codigo: "FSE104M", nombre: "Desborde y desagüe metal cromo", descripcion: "Sistema anti-derrame y sopapa de desagüe", precio: "$ 181 400", image: "/images/Equipamiento/FSE104M_DESBORDE Y DESAGUE METAL CROMO.jpg" },
  { codigo: "FSE101M", nombre: "Tapa inspección metal 30x40 p/revestir", descripcion: "Para revestir 30 x 40 cm (con marco para amurar)", precio: "$ 164 600", image: "/images/Equipamiento/FSE101M_TAPA INSPECCION METAL 30X40 P_REVESTIR.jpg" },
  { codigo: "FSE106C", nombre: "Iluminadores par leds var. colores", descripcion: "2 iluminadores leds con variador de colores", precio: "$ 477 000", image: "/images/Equipamiento/FSE106C_ILUMINADORES PAR  LEDS.VAR.COLORES.jpg" },
  { codigo: "FSE112", nombre: "Control de nivel", descripcion: "Impide el encendido del motor sin el nivel de agua suficiente", precio: "$ 314 300", image: "/images/Equipamiento/FSE112_CONTROL DE NIVEL.jpg" },
  { codigo: "FSE124C", nombre: "Comando digital", descripcion: "Comando digital p/ bomba, soplador y accesor.", precio: "$ 729 000", image: "/images/Equipamiento/FSE124C_COMANDO DIGITAL.jpg" },
  { codigo: "FSE102", nombre: "Calefactor", descripcion: "Con control de nivel para mantener la temperatura", precio: "$ 1 635 600", image: "/images/Equipamiento/FSE102_CALEFACTOR C_CONTROL DE NIVEL.jpg" },
  { codigo: "FSE118", nombre: "Estructura bañera simple", descripcion: "Estructura metálica con piso reforzado", precio: "$ 628 700", image: "/images/Equipamiento/FSE118_ FSE118R_ESTRUCTURA BAÑERA SIMPLE_DOBLE INCLUYE PISO REFORZADO.jpg" },
  { codigo: "FSE118R", nombre: "Estructura bañera doble", descripcion: "Estructura metálica para bañeras dobles", precio: "$ 828 700", image: "/images/Equipamiento/FSE118_ FSE118R_ESTRUCTURA BAÑERA SIMPLE_DOBLE INCLUYE PISO REFORZADO.jpg" },
  { codigo: "FSE108LA", nombre: "Pico ola cromo", descripcion: "Pico ola de llenado o recirculación", precio: "$ 1 239 000", image: "/images/Equipamiento/FSE108LA_PICO OLA CROMO.jpg" },
  { codigo: "FSE108MC", nombre: "Pico cascada metal cromo", descripcion: "Pico cascada cromo p/ llenado o recirculación", precio: "$ 242 900", image: "/images/Equipamiento/FSE108MC_PICO CASCADA METAL CROMO.jpg" },
  { codigo: "FSE108R", nombre: "Pico llenado redondo cromo", descripcion: "Pico de llenado redondo cromo", precio: "$ 200 600", image: "/images/Equipamiento/FSE108R_PICO LLENADO REDONDO CROMO.jpg" },
  { codigo: "FSE120A", nombre: "Grif. p/ llenado", descripcion: "2 llaves laterales H 3/4\" con pico cascada", precio: "$ 921 800", image: "/images/Equipamiento/FSE120A_FSE120C.jpg" },
  { codigo: "FSE120B", nombre: "Grif. llen. con transf. y duchador", descripcion: "2 llaves lat., 1 transf., pico cascada y duchador", precio: "$ 1 865 900", image: "/images/Equipamiento/FSE120B FSE120D.jpg" },
  { codigo: "FSE120C", nombre: "Grif. llenado interno", descripcion: "2 llaves laterales H 3/4\", llenado interno", precio: "$ 759 500", image: "/images/Equipamiento/FSE120A_FSE120C.jpg" },
  { codigo: "FSE120D", nombre: "Grif. llenado interno y duchador", descripcion: "2 llaves lat., llave transf., llenado interno y duchador", precio: "$ 1 700 200", image: "/images/Equipamiento/FSE120B FSE120D.jpg" },
  { codigo: "FSE123", nombre: "Tablero de seguridad", descripcion: "Caja con disyuntor y térmica", precio: "$ 262 900", image: "/images/Equipamiento/FSE123_TABLERO DE SEGURIDAD.jpg" },
  { codigo: "FSE125", nombre: "Succión de llenado", descripcion: "Llenado silencioso y de mayor caudal (no incluye grifería)", precio: "$ 94 300", image: "/images/Equipamiento/FSE125_SUCCION LLENADO.jpg" },
  { codigo: "FSE126", nombre: "Llenado interno", descripcion: "Conexión para llenado por el circuito de la bañera (no incluye grifería)", precio: "$ 94 300", image: "/images/Equipamiento/FSE126_LLENADO INTERNO.jpg" },
  { codigo: "FSE127", nombre: "Frente de acrílico", descripcion: "De acrílico blanco para bañeras rectas de 1,40 a 1,90 m", precio: "$ 617 200", image: "/images/Equipamiento/FSE127_FRENTE DE ACRÍLICO 140 A 190.jpg" },
  { codigo: "FSE129C", nombre: "Manijas Alfa", descripcion: "Asideros para instalar en los laterales interiores", precio: "$ 197 200", image: "/images/Equipamiento/FSE129C_MANIJAS ALFA CROMO.jpg" }
];

export interface OfertaBañera {
  name: string;
  medidas: string;
  descripcion: string;
  precio: string;
  jetLabel: string;
  code: string;
  image?: string;
}

export const ofertasData: OfertaBañera[] = [
  {
    name: "Lady Plus",
    medidas: "150 x 70",
    descripcion: "4 jets de caudal regulable individual y 2 jets cervicales. Vistas cromo, succión, encendido neumático, regulador de aire, sopapa y desborde plástico.",
    precio: "$ 1 263 000",
    code: "FSLP1",
    jetLabel: "¡6 jets!",
    image: "/images/Ofertas/lady plus.jpg"
  },
  {
    name: "Joya Plus",
    medidas: "160 x 75",
    descripcion: "5 jets de caudal regulable individual y 2 jets cervicales. Vistas cromo, succión, encendido neumático, regulador de aire, sopapa y desborde plástico.",
    precio: "$ 1 528 000",
    code: "FSJP04",
    jetLabel: "¡7 jets!",
    image: "/images/Ofertas/joya plus.jpg"
  },
  {
    name: "Perla Plus",
    medidas: "165 x 90",
    descripcion: "6 jets de caudal regulable individual y 2 jets cervicales. Vistas cromo, succión, encendido neumático, regulador de aire, sopapa y desborde plástico.",
    precio: "$ 1 706 000",
    code: "FSPL06",
    jetLabel: "¡8 jets!",
    image: "/images/Ofertas/perla plus.jpg"
  },
  {
    name: "Quarzo Plus",
    medidas: "170 x 83",
    descripcion: "6 jets de caudal regulable individual y 2 jets cervicales. Vistas cromo, succión, encendido neumático, regulador de aire, sopapa y desborde plástico",
    precio: "$ 1 786 000",
    code: "FSQPC",
    jetLabel: "¡8 jets!",
    image: "/images/Ofertas/quarzo plus.jpg"
  },
  {
    name: "Circular Plus",
    medidas: "150",
    descripcion: "8 jets de caudal regulable individual y 2 jets cervicales. Vistas cromo, succión, encendido neumático, regulador de aire, sopapa y desborde plástico",
    precio: "$ 2 225 000",
    code: "FSCP06",
    jetLabel: "¡10 jets!",
    image: "/images/Ofertas/Circular plus.jpg"
  },
  {
    name: "Esquinero Plus",
    medidas: "150 x 150",
    descripcion: "8 jets de caudal regulable individual y 2 jets cervicales. Vistas cromo, succión, encendido neumático, regulador de aire, sopapa y desborde plástico.",
    precio: "$ 2 225 000",
    code: "FSEP10",
    jetLabel: "¡10 jets!",
    image: "/images/Ofertas/Esquinero plus.JPG"
  }
];

export interface SpaFeatureRow {
  label: string;
  sublabel?: string;
  values: (string | number)[];
}

export interface SpaModel {
  name: string;
  dimensions: string;
  columns: string[];
  features: SpaFeatureRow[];
  prices: { code: string; price: string }[];
  image?: string;
}

export const spaOpcionalesData = [
  { name: "Cromoterapia", code: "FSSPAZCRT", price: "$ 477 000" },
  { name: "Cobertor térmico", code: "FSSPAZCT", price: "$ 743 000" },
  { name: "Calefactor eléctrico", code: "FSSPAZC", price: "$ 2 601 000" },
  { name: "Equipo de filtrado c/bomba", code: "FSSPAZF", price: "$ 1 069 000" }
];

export const spaDataPage1: SpaModel[] = [
  {
    name: "Space",
    dimensions: "Ancho: 225 cm / Largo: 225 cm\nProf.: 100 cm (Opción 60 cm) / Cap.: 1.400 lts.",
    columns: ["Basic", "Confort", "Confort Plus"],
    features: [
      { label: "Casco acrílico sanitario", sublabel: "Termoformado y reforzado con PRFV.", values: [1, 1, 1] },
      { label: "Jets agua/aire", sublabel: "Regulable individual", values: [1, 8, 15] },
      { label: "Jets agua/aire", sublabel: "En camilla", values: [3, 3, 3] },
      { label: "Jets agua/aire", sublabel: "En asientos zona lumbar", values: [2, 2, 2] },
      { label: "Mini jets", sublabel: "en camilla", values: [3, 3, 3] },
      { label: "Mini jets", sublabel: "en asiento zona de columna", values: [3, 3, 3] },
      { label: "Succiones", values: [2, 2, 4] },
      { label: "Llenado interno", values: [1, 1, 1] },
      { label: "Pulsadores para encendido", sublabel: "Sistema Air Switch", values: [1, 2, 3] },
      { label: "Jets cervicales", sublabel: "Con cierre individual", values: [2, 2, 2] },
      { label: "Almohadilla relax en camilla", values: [1, 1, 1] },
      { label: "Bombas", values: [1, 1, 2] },
      { label: "Turbo sopladores", values: ["-", 2, 2] },
      { label: "Inyectores de aire", values: ["-", 15, 35] },
      { label: "Desagüe de 1 1/2\"", values: [1, 1, 1] },
      { label: "Estructura metálica autoportante", values: [1, 1, 1] }
    ],
    prices: [
      { code: "FSSPA1SB", price: "$ 7 308 000" },
      { code: "FSSPA1SC", price: "$ 10 236 000" },
      { code: "FSSPA1SCP", price: "$ 12 842 000" }
    ],
    image: "/images/Spa/space.png"
  },
  {
    name: "Design",
    dimensions: "Ancho: 218 cm / Largo: 203 cm\nProf.: 100 cm / Cap.: 850 lts.",
    columns: ["Basic", "Confort", "Confort Plus"],
    features: [
      { label: "Casco acrílico sanitario", sublabel: "Termoformado y reforzado con PRFV.", values: [1, 1, 1] },
      { label: "Jets agua/aire", sublabel: "Regulable individual", values: [6, 6, 6] },
      { label: "Jets agua/aire", sublabel: "En camilla", values: [8, 8, 16] },
      { label: "Mini jets punzantes", sublabel: "en camilla", values: ["-", 32, 50] },
      { label: "Succiones", values: [2, 2, 4] },
      { label: "Llenado interno", values: [1, 1, 1] },
      { label: "Pulsadores para encendido", sublabel: "Sistema Air Switch", values: [1, 3, 3] },
      { label: "Jets cervicales", sublabel: "Con cierre individual", values: [2, 2, 4] },
      { label: "Almohadilla relax en camilla", values: [2, 2, 2] },
      { label: "Bombas", values: [1, 1, 2] },
      { label: "Turbo sopladores", values: ["-", 2, 2] },
      { label: "Inyectores de aire", values: ["-", 30, 30] },
      { label: "Desagüe de 1 1/2\"", values: [1, 1, 1] },
      { label: "Estructura metálica autoportante", values: [1, 1, 1] }
    ],
    prices: [
      { code: "FSSPA2DB", price: "$ 7 173 000" },
      { code: "FSSPA2DC", price: "$ 11 233 000" },
      { code: "FSSPA2DCP", price: "$ 13 640 000" }
    ],
    image: "/images/Spa/Design.png"
  }
];

export const spaDataPage2: SpaModel[] = [
  {
    name: "Relax",
    dimensions: "Ancho: 195 cm / Largo: 205 cm\nProf.: 65 cm / Cap.: 450 lts.",
    columns: ["Cantidad"],
    features: [
      { label: "Casco acrílico sanitario", values: [1] },
      { label: "Jets AGUA/AIRE", values: [5] },
      { label: "Jets punzantes", values: [3] },
      { label: "Succión", values: [1] },
      { label: "Bomba", values: [1] },
      { label: "Encendido neumático", values: [1] },
      { label: "Desagüe de 1 1/2\"", values: [1] },
      { label: "Llenado interno", values: [1] },
      { label: "Estructura metálica autoportante", values: [1] }
    ],
    prices: [
      { code: "FSSPA4RB", price: "$ 6 044 000" }
    ],
    image: "/images/Spa/Relax.png"
  },
  {
    name: "Party",
    dimensions: "Ancho: 190 cm / Largo: 210 cm\nProf.: 78 cm / Cap.: 700 lts.",
    columns: ["Cantidad"],
    features: [
      { label: "Casco acrílico sanitario", values: [1] },
      { label: "Jets AGUA/AIRE", values: [8] },
      { label: "Jets punzantes", values: [3] },
      { label: "Succión", values: [1] },
      { label: "Bomba", values: [1] },
      { label: "Encendido neumático", values: [1] },
      { label: "Desagüe de 1 1/2\"", values: [1] },
      { label: "Jets cervicales", values: [4] },
      { label: "Llenado interno", values: [1] },
      { label: "Estructura metálica autoportante", values: [1] }
    ],
    prices: [
      { code: "FSSPA3PB", price: "$ 6 044 000" }
    ],
    image: "/images/Spa/Party.png"
  }
];

export interface PlatoDucha {
  code: string;
  largo: string;
  ancho: string;
  altura: string;
  profundidad: string;
  price: string;
}

export interface PlatosCategory {
  title: string;
  items: PlatoDucha[];
  image?: string;
  desagueCode?: string;
  desaguePrice?: string;
}

export const platosDuchaData: PlatosCategory[] = [
  {
    title: "Línea de Luxe",
    image: "/images/Platos de Ducha/Plato De Luxe.png",
    desagueCode: "FSE131",
    desaguePrice: "$ 28 000",
    items: [
      { code: "FSPD01", largo: "100", ancho: "70", altura: "5", profundidad: "3,5", price: "$ 527 000" },
      { code: "FSPD02", largo: "120", ancho: "70", altura: "5", profundidad: "3,5", price: "$ 547 000" },
      { code: "FSPD03", largo: "130", ancho: "70", altura: "5", profundidad: "3,5", price: "$ 557 000" },
      { code: "FSPD04", largo: "140", ancho: "70", altura: "5", profundidad: "3,5", price: "$ 610 000" },
      { code: "FSPD05", largo: "150", ancho: "70", altura: "5", profundidad: "3,5", price: "$ 654 000" },
      { code: "FSPD06", largo: "160", ancho: "70", altura: "5", profundidad: "3,5", price: "$ 686 700" }
    ]
  },
  {
    title: "Rectangulares",
    image: "/images/Platos de Ducha/Plato Rectangular.png",
    desagueCode: "FSE131",
    desaguePrice: "$ 28 000",
    items: [
      { code: "FSPD6F", largo: "90", ancho: "60", altura: "5", profundidad: "3,5", price: "$ 342 000" },
      { code: "FSPD9J", largo: "100", ancho: "70", altura: "5", profundidad: "3,5", price: "$ 377 000" },
      { code: "FSPD8Z", largo: "120", ancho: "70", altura: "5", profundidad: "3,5", price: "$ 391 000" },
      { code: "FSPD6K", largo: "130", ancho: "70", altura: "5", profundidad: "3,5", price: "$ 398 000" },
      { code: "FSPD7Z", largo: "140", ancho: "70", altura: "5", profundidad: "3,5", price: "$ 436 000" },
      { code: "FSPD6L", largo: "150", ancho: "70", altura: "5", profundidad: "3,5", price: "$ 467 000" },
      { code: "FSPD7M", largo: "160", ancho: "70", altura: "5", profundidad: "3,5", price: "$ 491 000" }
    ]
  },
  {
    title: "Línea Sena",
    image: "/images/Platos de Ducha/Plato Sena.png",
    desagueCode: "FSE131",
    desaguePrice: "$ 28 000",
    items: [
      { code: "FSPDS2", largo: "120", ancho: "70", altura: "5", profundidad: "3,5", price: "$ 430 000" },
      { code: "FSPDS1", largo: "150", ancho: "70", altura: "5", profundidad: "3,5", price: "$ 515 000" }
    ]
  },
  {
    title: "Cuadrados",
    image: "/images/Platos de Ducha/Plato Cuadrado.png",
    desagueCode: "FSE131",
    desaguePrice: "$ 28 000",
    items: [
      { code: "FSPD1M", largo: "70", ancho: "70", altura: "5", profundidad: "3,5", price: "$ 342 000" },
      { code: "FSPD5D", largo: "75", ancho: "75", altura: "5", profundidad: "3,5", price: "$ 342 000" },
      { code: "FSPD4B", largo: "80", ancho: "80", altura: "5", profundidad: "3,5", price: "$ 342 000" },
      { code: "FSPD3E", largo: "90", ancho: "90", altura: "5", profundidad: "3,5", price: "$ 342 000" }
    ]
  },
  {
    title: "Curvos",
    image: "/images/Platos de Ducha/Plato Curvo.png",
    desagueCode: "FSE131",
    desaguePrice: "$ 28 000",
    items: [
      { code: "FSPDC8", largo: "80", ancho: "80", altura: "5", profundidad: "3,5", price: "$ 342 000" },
      { code: "FSPDC9", largo: "90", ancho: "90", altura: "5", profundidad: "3,5", price: "$ 342 000" }
    ]
  }
];

export interface ColumnaDucha {
  code: string;
  name: string;
  description: string;
  price: string;
  image?: string;
}

export const columnasDuchaData: ColumnaDucha[] = [
  {
    code: "FSCOCD",
    name: "DIJON",
    description: "Corta con duchón",
    price: "$ 1 769 000",
    image: "/images/Columnas de Ducha/Dijon.png"
  },
  {
    code: "FSCOC",
    name: "BURDEOS",
    description: "Corta",
    price: "$ 1 769 000",
    image: "/images/Columnas de Ducha/Burdeos.png"
  },
  {
    code: "FSCOLD",
    name: "PARIS",
    description: "Larga con duchón",
    price: "$ 1 844 000",
    image: "/images/Columnas de Ducha/Paris.png"
  },
  {
    code: "FSCOL",
    name: "MARSELLA",
    description: "Larga",
    price: "$ 1 844 000",
    image: "/images/Columnas de Ducha/Marsella.png"
  }
];

export const duchaEscocesaData = {
  title: "Ducha Escocesa",
  images: {
    jet: "/images/Ducha Escocesa/Jet Ducha Escocesa.png",
    head: "/images/Ducha Escocesa/Duchon Ducha Escocesa.png",
    full: "/images/Ducha Escocesa/Ducha Escocesa.png"
  },
  models: [
    {
      name: "De recirculación",
      description: "Ducha escocesa y receptáculo para recirculación de 100 x 75 x 32 cm.\n\nIncluye: barrales de acero inoxidable, llave esférica de interrupción de duchón, desagüe con comando a distancia, desborde, control de nivel, llenado interno, deck, bomba de recirculación, con encendido neumático (sistema air switch).",
      code: "FSESCRE",
      price: "$ 5 098 000"
    },
    {
      name: "Exterior/embutir",
      description: "2 Barrales de acero inoxidable pulido para Ducha Escocesa. Diámetro 1 1/4”, con entrada de agua inferior y salida superior 3/4” para duchón.\n\nIncluye 6 duchas punzantes direccionables, con regulador y duchón.\n\nSe recomienda presurizar hasta 1,5 kg.",
      code: "FSESCEX",
      price: "$ 2 603 000"
    }
  ]
};

export const vaporData = {
  title: "Vapor",
  image: "/images/Ducha Escocesa/Vapor.png",
  description: "Generador de vapor para cabinas automático con encendido digital monofásico y trifásico.",
  contact: "Solicitar cotización a fivesaint@fivesaint.com"
};

export interface SaunaModel {
  capacidad: string;
  consumo: string;
  linea: string[];
  cabinaCode: string;
  revestimientoCode: string;
  image?: string;
}

export const saunaData = {
  title: "Sauna",
  images: {
    main: "/images/Sauna/Sauna 1.png",
    secondary: "/images/Sauna/Sauna 2.png"
  },
  models: [
    {
      capacidad: "3 a 4 personas",
      consumo: "4,5 kw.",
      linea: ["Trifásica 2,5 mm", "Monofásica 6 mm"],
      cabinaCode: "FSSAU1C",
      revestimientoCode: "FSSAU1R",
      image: "/images/Sauna/Esquema 1.png"
    },
    {
      capacidad: "5 a 6 personas",
      consumo: "6 kw.",
      linea: ["Trifásica 2,5 mm", "Monofásica 6 mm"],
      cabinaCode: "FSSAU2C",
      revestimientoCode: "FSSAU2R",
      image: "/images/Sauna/Esquema 2.png"
    },
    {
      capacidad: "6 a 7 personas",
      consumo: "7,5 kw.",
      linea: ["Trifásica 2,5 mm", "Monofásica 6 mm"],
      cabinaCode: "FSSAU3C",
      revestimientoCode: "FSSAU3R",
      image: "/images/Sauna/Esquema 3.png"
    }
  ],
  opcionales: [
    { code: "FSSAUV", name: "Ventana" },
    { code: "FSSAUB", name: "Puerta vidriada con marco de madera" }
  ],
  note: "Los Saunas se realizan a medida.\nLos gráficos mostrados son solo a modo de ejemplo.",
  contact: "Solicitar cotización a: fivesaint@fivesaint.com"
};
