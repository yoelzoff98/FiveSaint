import Image from "next/image";
import Link from "next/link";
import { saunaData } from "@/config/price-list-data";
import { saunaPublicProduct } from "@/config/sauna-public-catalog";
import { Container } from "@/components/ui/Container";
import { ProductImageGallery } from "./ProductImageGallery";
import { ArrowLeft, ArrowRight, Users, Zap, Settings } from "lucide-react";
export function SaunaPriceListDetails() {
  const quoteEmail = saunaData.contact.split(":").slice(1).join(":").trim();
  return (
    <article>
      <section className="bg-gradient-to-b from-sky-50 to-white border-b border-stone-200 py-10 sm:py-16">
        <Container>
          <nav
            aria-label="Ruta del producto"
            className="text-sm text-stone-500 flex flex-wrap items-center gap-3 mb-8"
          >
            <Link href="/productos">Productos</Link>
            <span aria-hidden="true">/</span>
            <Link href="/productos?categoria=sauna">Sauna</Link>
          </nav>
          <div className="grid gap-8 lg:gap-14 lg:grid-cols-2 items-center">
            <div className="space-y-5">
              <span className="text-xs uppercase tracking-widest font-semibold text-accent-deep">
                Fabricación a medida
              </span>
              <h1 className="text-4xl sm:text-5xl font-bold text-stone-900">
                Sauna
              </h1>
              <p className="text-lg text-stone-600">
                Cabina y revestimiento interior, con las capacidades y opciones
                de nuestra lista de precios.
              </p>
              <ul className="space-y-3 text-stone-700">
                {saunaData.models.map((model) => (
                  <li
                    key={model.cabinaCode}
                    className="flex items-center gap-3"
                  >
                    <Users className="w-5 h-5 text-accent-deep shrink-0" />
                    {model.capacidad}
                    <span className="text-sm text-stone-500">
                      · {model.consumo}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="font-semibold text-accent-deep">
                Cotización a pedido
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/contacto?ref=sauna"
                  className="inline-flex gap-2 items-center bg-accent-deep text-white rounded-xl px-5 py-3 font-semibold text-sm"
                >
                  Solicitar cotización
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#modelos"
                  className="inline-flex items-center border border-stone-300 rounded-xl px-5 py-3 text-sm font-semibold"
                >
                  Ver capacidades y códigos
                </a>
              </div>
            </div>
            <div className="relative aspect-[3/4] w-full max-w-md mx-auto max-h-[540px] rounded-2xl border border-stone-200 bg-white overflow-hidden">
              <Image
                src={saunaPublicProduct.image!.url}
                alt={saunaPublicProduct.image!.alt}
                fill
                sizes="(max-width: 768px) 90vw, 450px"
                className="object-contain"
                priority
              />
            </div>
          </div>
        </Container>
      </section>
      <section id="modelos" className="py-14 sm:py-20">
        <Container>
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900">
            Capacidades y especificaciones
          </h2>
          <p className="mt-3 text-stone-500">
            Datos de la lista de precios Five Saint. Los saunas se realizan a
            medida.
          </p>
          <div className="grid gap-6 lg:grid-cols-3 mt-8">
            {saunaData.models.map((model) => (
              <section
                key={model.cabinaCode}
                className="rounded-2xl border border-stone-200 bg-white shadow-sm p-5 sm:p-6 flex flex-col gap-5"
              >
                <h3 className="font-bold text-xl">{model.capacidad}</h3>
                <div className="flex items-center gap-2 text-accent-deep">
                  <Zap className="w-4 h-4" />
                  <span>Consumo indicado: {model.consumo}</span>
                </div>
                <dl className="text-sm space-y-4">
                  <div>
                    <dt className="font-semibold text-stone-800">Cabina</dt>
                    <dd className="font-mono text-stone-600 mt-1">
                      {model.cabinaCode}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-stone-800">
                      Revestimiento interior
                    </dt>
                    <dd className="font-mono text-stone-600 mt-1">
                      {model.revestimientoCode}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-stone-800">
                      Línea indicada en la lista
                    </dt>
                    <dd className="text-stone-600 mt-1 space-y-1">
                      {model.linea.map((line) => (
                        <p key={line}>{line}</p>
                      ))}
                    </dd>
                  </div>
                </dl>
                <figure className="mt-auto">
                  <div className="relative aspect-[4/3] bg-white border border-stone-100 rounded-xl">
                    {model.image && (
                      <Image
                        src={model.image}
                        alt={`Esquema de sauna para ${model.capacidad}`}
                        fill
                        sizes="(max-width: 1024px) 90vw, 350px"
                        className="object-contain p-3"
                      />
                    )}
                  </div>
                  <figcaption className="text-xs text-stone-500 mt-2">
                    Esquema de ejemplo de la lista.
                  </figcaption>
                </figure>
              </section>
            ))}
          </div>
        </Container>
      </section>
      <section className="py-12 bg-stone-50 border-y border-stone-200">
        <Container className="grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold flex gap-2 items-center">
              <Settings className="w-6 h-6 text-accent-deep" />
              Opcionales
            </h2>
            <ul className="mt-5 space-y-4">
              {saunaData.opcionales.map((optional) => (
                <li
                  key={optional.code}
                  className="rounded-xl bg-white border border-stone-200 p-4"
                >
                  <span className="font-mono text-xs text-accent-deep">
                    {optional.code}
                  </span>
                  <p className="font-semibold mt-1">{optional.name}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">A tener en cuenta</h2>
            {saunaData.note.split("\n").map((line) => (
              <p className="text-stone-600" key={line}>
                {line}
              </p>
            ))}
            <p className="text-sm text-stone-500">
              La lista no publica importes para esta línea. Solicitá una
              cotización para tu proyecto.
            </p>
            <a
              href={`mailto:${quoteEmail}`}
              className="text-accent-deep underline break-all"
            >
              {quoteEmail}
            </a>
          </div>
        </Container>
      </section>
      <ProductImageGallery
        images={saunaPublicProduct.images ?? []}
        productName="Sauna Five Saint"
      />
      <Container className="pb-14 flex flex-wrap gap-4 justify-between">
        <Link
          className="inline-flex items-center gap-2 text-accent-deep font-semibold"
          href="/productos?categoria=sauna"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al catálogo de Sauna
        </Link>
        <Link
          className="inline-flex items-center gap-2 bg-accent-deep text-white rounded-xl px-5 py-3 font-semibold"
          href="/contacto?ref=sauna"
        >
          Consultar por mi proyecto
          <ArrowRight className="w-4 h-4" />
        </Link>
      </Container>
    </article>
  );
}
