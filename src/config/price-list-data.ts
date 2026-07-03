export interface ProductPrice {
  name: string;
  medidas: string;
  cascos?: string;
  jet4?: string;
  jet6?: string;
  jet8?: string;
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
  confortDesc: "Bañera con piso reforzado, estructura metálica autoportante, 16 jet y sopapa y desborde metalico.",
  confortPlusDesc: "Bañera con piso reforzado, estructura metálica autoportante, 16 jet, sopapa y desborde metalico, almohadilla relax y comando digital."
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
  { name: "Esquinera", medidas: "150x150", confortCode: "FS10517C", confortPrice: "$ 3 671 000", confortPlusCode: "FS10517CP", confortPlusPrice: "$ 4 487 500", image: "/images/Beñeras/Esquinera.jpg" },
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
    { name: "Quadra", medidas: "150x150", jet8: "$ 2 916 000", image: "/images/Beñeras/quadra.jpg" },
    { name: "Parma", medidas: "180x080", cascos: "$ 726 000", jet4: "$ 1 768 000", jet6: "$ 1 920 000", jet8: "$ 2 078 000", image: "/images/Beñeras/Parma.jpg" },
    { name: "Veneto", medidas: "184x100", cascos: "$ 968 000", jet4: "$ 2 286 000", jet6: "$ 2 481 000", jet8: "$ 2 596 000", image: "/images/Beñeras/Veneto.jpg" },
    { name: "Modena", medidas: "200x144", cascos: "$ 1 038 000", jet4: "$ 2 629 000", jet6: "$ 2 805 000", jet8: "$ 2 985 000", image: "/images/Beñeras/Modena.jpg" },
    { name: "Romana", medidas: "150x0.70", cascos: "$ 614 000", jet4: "$ 1 450 000", jet6: "$ 1 588 000", jet8: "$ 1 729 000", image: "/images/Beñeras/romana.jpg" },
    { name: "Romana", medidas: "160x0.75", cascos: "$ 799 000", jet4: "$ 1 468 000", jet6: "$ 1 606 000", jet8: "$ 1 747 000", image: "/images/Beñeras/romana.jpg" },
    { name: "Romana", medidas: "170x080", cascos: "$ 799 000", jet4: "$ 1 768 000", jet6: "$ 1 920 000", jet8: "$ 2 078 000", image: "/images/Beñeras/romana.jpg" },
    { name: "Romana", medidas: "180x090", cascos: "$ 799 000", jet4: "$ 1 768 000", jet6: "$ 1 920 000", jet8: "$ 2 078 000", image: "/images/Beñeras/romana.jpg" },
    { name: "Romana", medidas: "180x120", cascos: "$ 1 007 000", jet4: "$ 2 095 000", jet6: "$ 2 264 000", jet8: "$ 2 437 000", image: "/images/Beñeras/romana.jpg" },
    { name: "Romana", medidas: "180x150", cascos: "$ 1 129 000", jet4: "$ 2 515 200", jet6: "$ 2 730 200", jet8: "$ 2 855 300", image: "/images/Beñeras/romana.jpg" },
    { name: "Perla", medidas: "140x077", cascos: "$ 520 000", jet4: "$ 1 198 000", jet6: "$ 1 324 000", jet8: "$ 1 453 000", image: "/images/Beñeras/Perla.jpg" },
    { name: "Perla", medidas: "165x090", cascos: "$ 726 000", jet4: "$ 1 588 000", jet6: "OFERTA", jet8: "$ 1 870 000", image: "/images/Beñeras/Perla.jpg" },
    { name: "Perla", medidas: "190x090", cascos: "$ 759 000", jet4: "$ 1 607 000", jet6: "$ 1 747 000", jet8: "$ 1 889 000", image: "/images/Beñeras/Perla.jpg" },
    { name: "Perla", medidas: "180x120", cascos: "$ 915 000", jet4: "$ 1 905 000", jet6: "$ 2 069 000", jet8: "$ 2 215 000", image: "/images/Beñeras/Perla.jpg" },
    { name: "Lady", medidas: "150x070", cascos: "$ 533 000", jet4: "OFERTA", jet6: "$ 1 392 000", jet8: "$ 1 520 000", image: "/images/Beñeras/Lady.jpg" },
    { name: "Lady", medidas: "160x070", cascos: "$ 558 000", jet4: "$ 1 318 000", jet6: "$ 1 443 000", jet8: "$ 1 572 000", image: "/images/Beñeras/Lady.jpg" },
    { name: "Lady", medidas: "170x070", cascos: "$ 595 000", jet4: "$ 1 409 000", jet6: "$ 1 534 000", jet8: "$ 1 663 000", image: "/images/Beñeras/Lady.jpg" },
    { name: "Quarzo", medidas: "170x083", cascos: "$ 776 000", jet4: "$ 1 588 000", jet6: "OFERTA", jet8: "$ 1 897 000", image: "/images/Beñeras/Quarzo.jpg" },
    { name: "Yaquelin", medidas: "165x120", cascos: "$ 886 000", jet4: "$ 1 706 000", jet6: "$ 1 860 000", jet8: "$ 2 016 000", image: "/images/Beñeras/Yaqueline.jpg" },
    { name: "Yaquelin", medidas: "181x091", cascos: "$ 726 000", jet4: "$ 1 608 000", jet6: "$ 1 747 000", jet8: "$ 1 889 000", image: "/images/Beñeras/Yaqueline.jpg" },
    { name: "Valeria", medidas: "140x0.70", cascos: "$ 520 000", jet4: "$ 1 198 000", jet6: "$ 1 324 000", jet8: "$ 1 453 000", image: "/images/Beñeras/Valeria.jpg" },
    { name: "Joya", medidas: "150x075", cascos: "$ 558 000", jet4: "$ 1 334 000", jet6: "$ 1 459 000", jet8: "$ 1 588 000", image: "/images/Beñeras/Joya.jpg" },
    { name: "Joya", medidas: "160x0.75", cascos: "$ 726 000", jet4: "$ 1 534 000", jet6: "$ 1 677 000", jet8: "$ 1 820 000", image: "/images/Beñeras/Joya.jpg" },
    { name: "Agustar", medidas: "180x150", cascos: "$ 1 026 000", jet4: "$ 2 286 000", jet6: "$ 2 439 000", jet8: "$ 2 596 000", image: "/images/Beñeras/Agustar.jpg" },
    { name: "Martina (con frente y estructura)", medidas: "180x120", cascos: "$ 1 221 000", jet4: "$ 2 858 000", jet6: "$ 3 011 000", jet8: "$ 3 167 000", image: "/images/Beñeras/martina.jpg" },
    { name: "Martina (sin frente)", medidas: "180x120", cascos: "$ 968 000", jet4: "$ 2 644 000", jet6: "$ 2 796 000", jet8: "$ 2 954 000", image: "/images/Beñeras/martina.jpg" },
    { name: "Unica", medidas: "180x150", cascos: "$ 1 038 000", jet4: "$ 2 287 000", jet6: "$ 2 482 000", jet8: "$ 2 596 000", image: "/images/Beñeras/Unica.jpg" },
    { name: "Laguna", medidas: "180x106", cascos: "$ 915 000", jet4: "$ 1 905 000", jet6: "$ 2 059 000", jet8: "$ 2 215 000", image: "/images/Beñeras/Laguna.jpg" },
    { name: "Circular", medidas: "150 diam.", cascos: "$ 1 008 000", jet4: "$ 2 191 000", jet6: "$ 2 344 000", jet8: "OFERTA", image: "/images/Beñeras/Circular.jpg" },
    { name: "Esquinera (frente curvo)", medidas: "140x140", cascos: "$ 1 008 000", jet4: "$ 2 191 000", jet6: "$ 2 344 000", jet8: "$ 2 380 000", image: "/images/Beñeras/Esquinera.jpg" },
    { name: "Esquinero (frente recto)", medidas: "150x150", cascos: "$ 1 008 000", jet4: "$ 2 191 000", jet6: "$ 2 344 000", jet8: "OFERTA", image: "/images/Beñeras/Esquinero.jpg" }
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
  { codigo: "FSE111E", nombre: "Almohadilla de relax y masaje cervical", descripcion: "Almohadilla de relax y 2 microjet con cierre, incorporadas al casco, para masaje cervical", precio: "$ 167 000" },
  { codigo: "FSE110", nombre: "Almohadilla de relax", descripcion: "Aplicable a cualquier bañera", precio: "$ 83 000" },
  { codigo: "FSE112", nombre: "Control de nivel", descripcion: "Impide el encendido del motor sin el nivel de agua suficiente.", precio: "$ 314 000" },
  { codigo: "FSE114", nombre: "Jet Adicional", descripcion: "De caudal regulable individual.", precio: "$ 77 000" },
  { codigo: "FSE115", nombre: "Sistema de aire Air Pool", descripcion: "Burbujeador de piso.", precio: "$ 900 000" },
  { codigo: "FSE115V", nombre: "Sistema de aire Air Pool (Var.)", descripcion: "Burbujeador de piso con variador de velocidad.", precio: "$ 1 312 000" },
  { codigo: "FSE116", nombre: "Air Pool / Ozono", descripcion: "Burbujeador de piso con lámpara de ozonización", precio: "$ 1 323 000" },
  { codigo: "FSE116V", nombre: "Air Pool / Ozono (Var.)", descripcion: "Burbujeador de piso con lámpara de ozonización y variador de velocidad.", precio: "$ 1 715 000" },
  { codigo: "FSE117", nombre: "Ozono", descripcion: "Aplicable a sistema de aire en los jet.", precio: "$ 445 000" },
  { codigo: "FSE119", nombre: "Potenciación de Jet", descripcion: "Instalación de un turbo soplador para inyectar aire a alta velocidad en los jet.", precio: "$ 734 000" },
  { codigo: "FSE119V", nombre: "Potenciación de Jet (Var.)", descripcion: "Instalación de un turbo soplador para inyectar aire a alta velocidad en los jet con variador de velocidad.", precio: "$ 1 132 000" },
  { codigo: "FSE129", nombre: "Manijas Alfa", descripcion: "Asideros, para instalar en los laterales interiores.", precio: "$ 197 000" },
  { codigo: "FSE124C", nombre: "Comando Digital Opcional", descripcion: "Encendido de bomba, turbo soplador, accesorios, tiempo programable y sensor de temp.", precio: "$ 729 000" },
  { codigo: "FSE101M", nombre: "Tapa de Inspección", descripcion: "Metálica para revestir 0,30 x 0,40 (con marco para amurar).", precio: "$ 165 000" },
  { codigo: "FSE102", nombre: "Calefactor (Incl. control de nivel)", descripcion: "Mantiene la temperatura del agua. Incluye luz testigo, tablero de seguridad y contactor.", precio: "$ 1 636 000" },
  { codigo: "FSE104M", nombre: "Desborde y Desagüe simple Metálico", descripcion: "Sistema anti derrame y sopapa de desagüe.", precio: "$ 181 000" },
  { codigo: "FSE106C", nombre: "Iluminación Cromoterapia", descripcion: "2 iluminadores leds, con variador de colores.", precio: "$ 477 000" },
  { codigo: "FSE108LA", nombre: "Pico Ola", descripcion: "", precio: "$ 1 239 000" },
  { codigo: "FSE108", nombre: "Pico Cascada", descripcion: "Para llenado o recirculación.", precio: "$ 243 000" },
  { codigo: "FSE108R", nombre: "Pico de Llenado", descripcion: "Solo para llenado", precio: "$ 201 000" },
  { codigo: "FSE126", nombre: "Llenado Interno", descripcion: "Conexión para llenado por el circuito de la bañera (rosca 1\")", precio: "$ 94 000" },
  { codigo: "FSE125", nombre: "Succión de Llenado", descripcion: "Llenado silencioso y de mayor caudal", precio: "$ 94 000" },
  { codigo: "FSE120A", nombre: "Grifería llenado (2 llaves + pico)", descripcion: "2 llaves laterales H 3/4\" con pico cascada", precio: "$ 922 000" },
  { codigo: "FSE120B", nombre: "Grifería llenado (Completa)", descripcion: "2 llaves lat., 1 transf., pico cascada y duchador", precio: "$ 1 866 000" },
  { codigo: "FSE120C", nombre: "Grifería llenado interno", descripcion: "2 llaves laterales H 3/4\", llenado interno", precio: "$ 760 000" },
  { codigo: "FSE120D", nombre: "Grifería llenado interno (Compl.)", descripcion: "2 llaves lat., llave transf., llenado interno y duchador", precio: "$ 1 700 000" },
  { codigo: "FSE123", nombre: "Tablero de seguridad", descripcion: "Caja con disyuntor y térmica", precio: "$ 263 000" },
  { codigo: "FSE118", nombre: "Estructura (Simple)", descripcion: "Estructura metálica autoportante, incluye piso ref.", precio: "$ 629 000" },
  { codigo: "FSE118D", nombre: "Estructura (Doble)", descripcion: "Estructura metálica autoportante para bañeras dobles", precio: "$ 829 000" },
  { codigo: "FSE127", nombre: "Frente", descripcion: "De acrílico blanco para bañeras rectas", precio: "$ 617 000" },
  { codigo: "FS114P", nombre: "Jet Punzante", descripcion: "Mini Jet Adicional", precio: "$ 38 600" },
];

export interface OfertaBañera {
  name: string;
  medidas: string;
  descripcion: string;
  precio: string;
  jetLabel: string;
  image?: string;
}

export const ofertasData: OfertaBañera[] = [
  {
    name: "Lady Plus",
    medidas: "1.50 x 0.70",
    descripcion: "4 jet de caudal regulable individual y 2 jet cervicales. Vistas cromo, succión, encendido neumático, regulador de aire, sopapa y desborde plástico.",
    precio: "$ 1 263 000",
    jetLabel: "¡6 jet!",
    image: "/images/Ofertas/lady plus.jpg"
  },
  {
    name: "Joya Plus",
    medidas: "1.60 x 0.75",
    descripcion: "5 jet de caudal regulable individual y 2 jet cervicales. Vistas cromo, succión, encendido neumático, regulador de aire, sopapa y desborde plástico.",
    precio: "$ 1 528 000",
    jetLabel: "¡7 jet!",
    image: "/images/Ofertas/joya plus.jpg"
  },
  {
    name: "Perla Plus",
    medidas: "1.65 x 0.90",
    descripcion: "6 jet de caudal regulable individual y 2 jet cervicales. Vistas cromo, succión, encendido neumático, regulador de aire, sopapa y desborde plástico.",
    precio: "$ 1 706 000",
    jetLabel: "¡8 jet!",
    image: "/images/Ofertas/perla plus.jpg"
  },
  {
    name: "Quarzo Plus",
    medidas: "1.70 x 0.83",
    descripcion: "6 jet de caudal regulable individual y 2 jet cervicales. Vistas cromo, succión, encendido neumático, regulador de aire, sopapa y desborde plástico",
    precio: "$ 1 786 000",
    jetLabel: "¡8 jet!",
    image: "/images/Ofertas/quarzo plus.jpg"
  },
  {
    name: "Circular Plus",
    medidas: "1.50",
    descripcion: "8 jet de caudal regulable individual y 2 jet cervicales. Vistas cromo, succión, encendido neumático, regulador de aire, sopapa y desborde plástico",
    precio: "$ 2 225 000",
    jetLabel: "¡10 jet!",
    image: "/images/Ofertas/Circular plus.jpg"
  },
  {
    name: "Esquinero Plus",
    medidas: "1.50 x 1.50",
    descripcion: "8 jet de caudal regulable individual y 2 jet cervicales. Vistas cromo, succión, encendido neumático, regulador de aire, sopapa y desborde plástico.",
    precio: "$ 2 225 000",
    jetLabel: "¡10 jet!",
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
  { name: "Cromoterapia", code: "FSE106C", price: "$ 477 000" },
  { name: "Cobertor térmico", code: "FSSPCT", price: "$ 743 000" },
  { name: "Calefactor eléctrico", code: "FSSPAOPC", price: "$ 2 601 000" },
  { name: "Equipo de filtrado c/bomba", code: "FSSPAF", price: "$ 1 069 000" },
  { name: "Estructura metalica autoportante", code: "FSSPAOPEN", price: "$ 1 072 000" }
];

export const spaDataPage1: SpaModel[] = [
  {
    name: "Space",
    dimensions: "Ancho: 2.25m / Largo: 2.25m\nProf.: 1.00m (Opción 0.60) / Cap.: 1.400 lts.",
    columns: ["Basic", "Confort", "Confort plus"],
    features: [
      { label: "Casco acrílico sanitario", sublabel: "Termoformado y reforzado con PRFV.", values: [1, 1, 1] },
      { label: "Jet de Caudal", sublabel: "Regulable individual", values: [1, 8, 15] },
      { label: "Jet de Caudal", sublabel: "En camilla", values: [3, 3, 3] },
      { label: "Jet de Caudal", sublabel: "En asientos zona lumbar", values: [2, 2, 2] },
      { label: "Mini jet", sublabel: "en camilla", values: [3, 3, 3] },
      { label: "Mini jet", sublabel: "en asiento zona de columna", values: [3, 3, 3] },
      { label: "Succiones", values: [2, 2, 4] },
      { label: "Llenado interno", values: [1, 1, 1] },
      { label: "Pulsadores para encendido", sublabel: "Sistema Air Swich", values: [1, 2, 3] },
      { label: "Jet cervicales", sublabel: "Con cierre individual", values: [2, 2, 2] },
      { label: "Almohadilla relax en camilla", values: [1, 1, 1] },
      { label: "Bombas autodrenantes", sublabel: "y autocebantes\nCon protector térmico\ny sistema de encendido Air Swich", values: [1, 1, 2] },
      { label: "Turbo sopladores", sublabel: "Con sistema de encendido Air Swich", values: ["-", 2, 2] },
      { label: "Inyectores de aire", values: ["-", 15, 35] },
      { label: "Desagüe de 1 1/2\"", values: [1, 1, 1] },
      { label: "Estructura metálica autoportante", values: [1, 1, 1] }
    ],
    prices: [
      { code: "FSSPSB", price: "$ 7 309 000" },
      { code: "FSSPSC", price: "$ 10 236 000" },
      { code: "FSSPSP", price: "$ 12 842 000" }
    ],
    image: "/images/Spa/space.png"
  },
  {
    name: "Design",
    dimensions: "Ancho: 2.18m / Largo: 2.03m\nProf.: 1.00m / Cap.: 850 lts.",
    columns: ["Basic", "Confort", "Confort plus"],
    features: [
      { label: "Casco acrílico sanitario", sublabel: "Termoformado y reforzado con PRFV.", values: [1, 1, 1] },
      { label: "Jet caudal", sublabel: "Regulable individual", values: [6, 6, 6] },
      { label: "Jet caudal", sublabel: "En camilla", values: [8, 8, 16] },
      { label: "Mini jet punzante", sublabel: "en camilla", values: ["-", 32, 50] },
      { label: "Succiones", values: [2, 2, 4] },
      { label: "Llenado interno", values: [1, 1, 1] },
      { label: "Pulsadores para encendido", sublabel: "Sistema Air Swich", values: [1, 3, 3] },
      { label: "Jet cervicales", sublabel: "Con cierre individual", values: [2, 2, 4] },
      { label: "Almohadilla relax en camilla", values: [2, 2, 2] },
      { label: "Bombas autodrenantes", sublabel: "y autocebantes\nCon protector térmico\ny Sist. de encendido Air Swich.", values: [1, 1, 2] },
      { label: "Turbo sopladores", sublabel: "Con sistema de encendido Air Siwich uno en potenciación y uno en sistema Air Pool", values: ["-", 2, 2] },
      { label: "Inyectores de aire", values: ["-", 30, 30] },
      { label: "Desagüe de 1 1/2\"", values: [1, 1, 1] },
      { label: "Estructura metálica autoportante", values: [1, 1, 1] }
    ],
    prices: [
      { code: "FSSPDB", price: "$ 7 309 000" },
      { code: "FSSPDC", price: "$ 11 233 000" },
      { code: "FSSPDP", price: "$ 13 640 000" }
    ],
    image: "/images/Spa/Design.png"
  }
];

export const spaDataPage2: SpaModel[] = [
  {
    name: "Relax",
    dimensions: "Ancho: 1.95m / Largo: 2.05m\nProf.: 0.65m / Cap.: 300 lts.",
    columns: ["Cantidad"],
    features: [
      { label: "Casco acrílico sanitario", values: [1] },
      { label: "Jet de caudal regulanle individual", values: [5] },
      { label: "Jet punzantes", values: [3] },
      { label: "Succión", values: [1] },
      { label: "Bomba autodrenante", values: [1] },
      { label: "Encendido neumático", values: [1] },
      { label: "Regulador de aire", values: [1] },
      { label: "Desagüe de 1 1/2\"", values: [1] },
      { label: "Llenado interno", values: [1] }
    ],
    prices: [
      { code: "FSSPRB", price: "$ 4 972 000" }
    ],
    image: "/images/Spa/Relax.png"
  },
  {
    name: "Party",
    dimensions: "Ancho: 1.90m / Largo: 2.10m\nProf.: 0.78m / Cap.: 700 lts.",
    columns: ["Cantidad"],
    features: [
      { label: "Casco acrílico sanitario", values: [1] },
      { label: "Jet de caudal regulable individual", values: [8] },
      { label: "Jet punzantes", values: [3] },
      { label: "Succión", values: [1] },
      { label: "Bomba autodrenante", values: [1] },
      { label: "Encendido numático", values: [1] },
      { label: "Regulador de aire", values: [1] },
      { label: "Desagüe 1. 1/2\"", values: [1] },
      { label: "Jet cervical", values: [4] },
      { label: "Llenado interno", values: [1] }
    ],
    prices: [
      { code: "FSSPPB", price: "$ 4 972 000" }
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
    title: "Cuadrados",
    image: "/images/Platos de Ducha/Plato Cuadrado.png",
    desagueCode: "FSE131",
    desaguePrice: "$ 28 000",
    items: [
      { code: "FSPD1M", largo: "0.70", ancho: "0.70", altura: "0.05", profundidad: "0.35", price: "$ 342 000" },
      { code: "FSPD5D", largo: "0.75", ancho: "0.75", altura: "0.05", profundidad: "0.35", price: "$ 342 000" },
      { code: "FSPD4B", largo: "0.80", ancho: "0.80", altura: "0.05", profundidad: "0.35", price: "$ 342 000" },
      { code: "FSPD3E", largo: "0.90", ancho: "0.90", altura: "0.05", profundidad: "0.35", price: "$ 342 000" }
    ]
  },
  {
    title: "Curvos",
    image: "/images/Platos de Ducha/Plato Curvo.png",
    desagueCode: "FSE131",
    desaguePrice: "$ 28 000",
    items: [
      { code: "FSPDC8", largo: "0.80", ancho: "0.80", altura: "0.05", profundidad: "0.35", price: "$ 342 000" },
      { code: "FSPDC9", largo: "0.90", ancho: "0.90", altura: "0.05", profundidad: "0.35", price: "$ 342 000" }
    ]
  },
  {
    title: "Rectangulares",
    image: "/images/Platos de Ducha/Plato Rectangular.png",
    desagueCode: "FSE131",
    desaguePrice: "$ 28 000",
    items: [
      { code: "FSPD6F", largo: "0.90", ancho: "0.60", altura: "0.05", profundidad: "0.35", price: "$ 342 000" },
      { code: "FSPD9J", largo: "1.00", ancho: "0.70", altura: "0.05", profundidad: "0.035", price: "$ 377 000" },
      { code: "FSPD8Z", largo: "1.20", ancho: "0.70", altura: "0.05", profundidad: "0.35", price: "$ 391 000" },
      { code: "FSPD6K", largo: "1.30", ancho: "0.70", altura: "0.05", profundidad: "0.035", price: "$ 398 000" },
      { code: "FSPD7Z", largo: "1.40", ancho: "0.70", altura: "0.05", profundidad: "0.35", price: "$ 436 000" },
      { code: "FSPD6L", largo: "1.50", ancho: "0.70", altura: "0.05", profundidad: "0.35", price: "$ 467 000" },
      { code: "FSPD7M", largo: "1.60", ancho: "0.70", altura: "0.05", profundidad: "0.35", price: "$ 491 000" }
    ]
  },
  {
    title: "Línea de Luxe",
    image: "/images/Platos de Ducha/Plato De Luxe.png",
    desagueCode: "FSE131",
    desaguePrice: "$ 28 000",
    items: [
      { code: "FSPD01", largo: "1.00", ancho: "0.70", altura: "0.05", profundidad: "0.035", price: "$ 527 000" },
      { code: "FSPD02", largo: "1.20", ancho: "0.70", altura: "0.05", profundidad: "0.035", price: "$ 547 000" },
      { code: "FSPD03", largo: "1.30", ancho: "0.70", altura: "0.05", profundidad: "0.035", price: "$ 557 000" },
      { code: "FSPD04", largo: "1.40", ancho: "0.70", altura: "0.05", profundidad: "0.035", price: "$ 610 000" },
      { code: "FSPD05", largo: "1.50", ancho: "0.70", altura: "0.05", profundidad: "0.036", price: "$ 654 000" },
      { code: "FSPD06", largo: "1.60", ancho: "0.70", altura: "0.05", profundidad: "0.036", price: "$ 686 700" }
    ]
  },
  {
    title: "Línea Sena",
    image: "/images/Platos de Ducha/Plato Sena.png",
    desagueCode: "FSE131",
    desaguePrice: "$ 28 000",
    items: [
      { code: "FSPDS2", largo: "1.20", ancho: "0.70", altura: "0.05", profundidad: "0.035", price: "$ 430 000" },
      { code: "FSPDS1", largo: "1.50", ancho: "0.70", altura: "0.05", profundidad: "0.035", price: "$ 515 000" }
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
      description: "Ducha escocesa y receptáculo para recirculación de 1 x 0.75 x 0.32 mts.\n\nIncluye: barrales de acero inoxidable, llave esférica de interrupción de duchón, desagüe con comando a distancia, desborde, control de nivel, llenado interno, deck, bomba de recirculación, con encendido neumático (sistema air swich).",
      code: "FSESCRE",
      price: "$ 5 098 000"
    },
    {
      name: "Exterior/embutir",
      description: "2 Barrales de acero inoxidable pulido para Ducha Escocesa. Diámetro 1 1/4”, con entrada de agua inferior y salida superior 3/4” para duchón.\n\nIncluye 6 duchas punzantes direccionables, con regulador y duchón.\n\nSe recomienda presurizar hasta 1.5kg.",
      code: "FSESCEX",
      price: "$ 2 603 000"
    }
  ]
};

export const vaporData = {
  title: "Vapor",
  image: "/images/Ducha Escocesa/Vapor.png",
  description: "Generador de vapor para cabinas automático con encendido digital monofásico y trifásico.",
  contact: "Solicitar cotización a comercial@fivesaint.com"
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
      consumo: "4.5 kw.",
      linea: ["Trifásica 2.5mm", "Monofásica 6mm"],
      cabinaCode: "FSSAU1C",
      revestimientoCode: "FSSAU1R",
      image: "/images/Sauna/Esquema 1.png"
    },
    {
      capacidad: "5 a 6 personas",
      consumo: "6 kw.",
      linea: ["Trifásica 2.5mm", "Monofásica 6mm"],
      cabinaCode: "FSSAU2C",
      revestimientoCode: "FSSAU2R",
      image: "/images/Sauna/Esquema 2.png"
    },
    {
      capacidad: "6 a 7 personas",
      consumo: "7.5kw.",
      linea: ["Trifásica 2.5mm", "Monofásica 6mm"],
      cabinaCode: "FSSAU3C",
      revestimientoCode: "FSSAU3R",
      image: "/images/Sauna/Esquema 3.png"
    }
  ],
  opcionales: [
    { code: "FSSAUV", name: "Ventana" },
    { code: "FSSAUB", name: "Puerta de blindex con marco de madera" }
  ],
  note: "Los Saunas se realizan a medida.\nLos gráficos mostrados son solo a modo de ejemplo.",
  contact: "Solicitar cotización a: comercial@fivesaint.com"
};
