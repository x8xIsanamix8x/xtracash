export type MarketplaceProduct = Readonly<{
  id: string;
  name: string;
  price: string;
  category: string;
  description: string;
  imageVariant: number;
}>;

/** Catálogo de muestra hasta que Marketplace exponga su servicio. */
export const marketplaceProducts: readonly MarketplaceProduct[] = [
  {
    id: "kit-solar-3kw",
    name: "Equipos de 3 KW",
    price: "$1.500",
    category: "Energía solar",
    description: "Sistema de energía solar UVU Energy para generar electricidad limpia en tu hogar. Consulta los detalles y encuentra un plan de compra que se adapte a ti.",
    imageVariant: 0,
  },
  {
    id: "panel-solar-residencial",
    name: "Panel solar residencial",
    price: "$850",
    category: "Energía solar",
    description: "Panel fotovoltaico de alta eficiencia UVU Energy, pensado para aprovechar la energía del sol y acompañar tu hogar.",
    imageVariant: 1,
  },
  {
    id: "kit-solar-compacto",
    name: "Kit solar compacto",
    price: "$620",
    category: "Energía solar",
    description: "Una alternativa compacta UVU Energy para comenzar a utilizar energía renovable en casa.",
    imageVariant: 2,
  },
  {
    id: "sistema-solar-hogar",
    name: "Sistema solar para el hogar",
    price: "$2.400",
    category: "Energía solar",
    description: "Solución fotovoltaica UVU Energy para hogares que buscan mayor autonomía energética.",
    imageVariant: 3,
  },
];

export function findMarketplaceProduct(id: string): MarketplaceProduct | undefined {
  return marketplaceProducts.find((product) => product.id === id);
}
