// src/data/artworks.ts

export const categories = [
  "Todos",
  "Dibujantes",
  "Fotografía",
  "Fotógrafas Mujeres",
  "Pintura",
  "Escultura",
  "Mixto",
] as const;

export type Category = (typeof categories)[number];

export interface Artwork {
  id: string;
  title: string;
  artist: string;
  year: number;
  medium: string;
  dimensions: string;
  price: number;
  category: Category;
  description: string;
  /** Algunas obras traen una sola URL y otras un arreglo: permitimos ambas */
  image: string | string[];
}

export interface Artist {
  id: string;
  name: string;
  bio: string;
  image: string;
  email?: string;
}

export const artworks: Artwork[] = [
  {
    id: "1",
    title: "Cloud of Dharma",
    artist: "Daniel Acuña",
    year: 2024,
    medium: "Dibujo con carboncillo",
    dimensions: "75 cm x 75 cm",
    price: 5200000,
    category: "Dibujantes",
    description:
      "La obra se inspira en la noción de vacío presente en la pintura china antigua, donde el vacío, más allá de ser un elemento compositivo como nubes o niebla, representaba potencialidad vital y movimiento.",
    image: [
      "https://res.cloudinary.com/dg9gzic4s/image/upload/v1759253037/IMG-20250930-WA0016_nv86wc.jpg",
      "https://res.cloudinary.com/dg9gzic4s/image/upload/v1759253038/IMG-20250930-WA0017_gdaoua.jpg",
    ],
  },
  {
    id: "2",
    title: "De pequeña no tenía televisión",
    artist: "Natalia Armijo",
    year: 2023,
    medium: "Dibujo Etch A Sketch",
    dimensions: "18,5 cm x 22,5 cm",
    price: 1800000,
    category: "Dibujantes",
    description:
      "Por medio de su juego favorito de la infancia, Etch A Sketch, la artista descubrió una nueva forma de dibujar, que no involucra lápices 8B o 6H. Solo usando las dos manijas blancas que tienen dos movimientos y cuatro direcciones.",
    image:
      "https://res.cloudinary.com/dg9gzic4s/image/upload/v1759253091/IMG-20250930-WA0060_oqyyut.jpg",
  },
  {
    id: "3",
    title: "Plan Conejo",
    artist: "Daniela Acosta Parsons",
    year: 2020,
    medium: "Lápiz sobre papel",
    dimensions: "18,5 x 18,5",
    price: 1850000,
    category: "Dibujantes",
    description:
      "Plan conejo es un falso documental sobre la Doe Society, una secta que desea adquirir las propiedades divinas de los conejos. La serie se compone de decenas de dibujos y una línea de tiempo que permite visualizar la investigación.",
    image: [
      "https://res.cloudinary.com/dg9gzic4s/image/upload/v1759253035/IMG-20250930-WA0014_s7crqk.jpg",
      "https://res.cloudinary.com/dg9gzic4s/image/upload/v1759253036/IMG-20250930-WA0015_frh7x8.jpg",
    ],
  },
  {
    id: "4",
    title: "Rocas",
    artist: "Jorjan Betancourt",
    year: 2024,
    medium: "Carboncillo sobre papel",
    dimensions: "70 cm x 46,5 cm",
    price: 2100000,
    category: "Dibujantes",
    description:
      "Serie de dibujos hiperrealistas en carboncillo que capturan la esencia de paredes de rocas. Las formaciones rocosas se revelan minuciosamente dialogando con la materialidad del carbón y la textura sutil del papel.",
    image:
      "https://res.cloudinary.com/dg9gzic4s/image/upload/v1759253040/IMG-20250930-WA0018_xma1ky.jpg",
  },
  {
    id: "5",
    title: "El gesto de la línea",
    artist: "Juan Sebastián Cadavid",
    year: 2017,
    medium: "Dibujo en tinta sobre papel",
    dimensions: "42,3 cm x 34 cm",
    price: 1800000,
    category: "Dibujantes",
    description:
      "Grupo de dibujos donde se hace una composición a partir de la línea y el punto. Elementos básicos para el dibujo, en el que hay un juego permanente, delineando, cruzando, sobreponiendo líneas.",
    image: [
      "https://res.cloudinary.com/dg9gzic4s/image/upload/v1759253042/IMG-20250930-WA0021_wjrbw1.jpg",
      "https://res.cloudinary.com/dg9gzic4s/image/upload/v1759253043/IMG-20250930-WA0022_xgqryn.jpg",
      " https://res.cloudinary.com/dg9gzic4s/image/upload/v1759253041/IMG-20250930-WA0019_s5vfmc.jpg",
    ],
  },
  {
    id: "6",
    title: "Sin Título",
    artist: "Nelson Fabián Gómez",
    year: 2024,
    medium: "Punzón sobre negativo velado y visor de filminas",
    dimensions: "5,5 cm x 7 cm x 6,5 cm",
    price: 1300000,
    category: "Dibujantes",
    description:
      "¿No es un dibujo lo opuesto a una fotografía? Las fotografías detienen el tiempo, lo capturan; mientras que los dibujos fluyen con él. Estas piezas son una combinación de ambos conceptos y su relación con el tiempo.",
    image:
      "https://res.cloudinary.com/dg9gzic4s/image/upload/v1759253045/IMG-20250930-WA0024_xyg966.jpg",
  },
  {
    id: "7",
    title: "Serie Fantasmagoría",
    artist: "Gerson Vargas",
    year: 2024,
    medium: "Dibujo en lápiz de grafito sobre papel",
    dimensions: "Tamaño varía según pieza",
    price: 1365000,
    category: "Dibujantes",
    description:
      "La montaña me transforma, es un proyecto en progreso que consta de 18 pinturas. Invitan al espectador a acercarse, perderse entre los detalles y a la vez encontrar paisajes que hacen alusión a la potencia canalizadora y sanadora de nuestra conexión ancestral con el entorno.",
    image: [
      "https://res.cloudinary.com/dg9gzic4s/image/upload/v1759253056/IMG-20250930-WA0026_jojwcj.jpg",
      "https://res.cloudinary.com/dg9gzic4s/image/upload/v1759253057/IMG-20250930-WA0027_c4rq48.jpg",
      "https://res.cloudinary.com/dg9gzic4s/image/upload/v1759253044/IMG-20250930-WA0023_kzjkof.jpg",
    ],
  },
  {
    id: "8",
    title: "Potrero",
    artist: "Samuel Castaño",
    year: 2024,
    medium: "Dibujo a lápiz",
    dimensions: "20 cm x 25 cm",
    price: 800000,
    category: "Dibujantes",
    description:
      "El paisaje del potrero proporciona una muestra de formas que nos remiten a la pérdida, la esterilidad y el despojo. Pero esos mismos contornos logran expresar, incluso en medio de su escasez, otros valores como la dimensión del espacio, la amplitud y el silencio.",
    image: [
      "https://res.cloudinary.com/dg9gzic4s/image/upload/v1759253051/IMG-20250930-WA0025_a4qfdr.jpg",
      "https://res.cloudinary.com/dg9gzic4s/image/upload/v1759253054/IMG-20250930-WA0028_sqgn1t.jpg",
      "https://res.cloudinary.com/dg9gzic4s/image/upload/v1759253047/IMG-20250930-WA0029_u9gtjn.jpg",
    ],
  },
  {
    id: "9",
    title: "Bogotá en sombras",
    artist: "Azury del Sol",
    year: 2024,
    medium: "Pastel sobre papel",
    dimensions: "54 cm x 83 cm x 1.5 cm",
    price: 2100000,
    category: "Dibujantes",
    description:
      "Serie de dibujos, pastel sobre papel, que explora la luz que se refleja al atardecer en la montaña de oriente bogotana. Durante seis ocasos de mayo la artista intentó retratar los rayos del sol que se dibujan sobre el bosque y encontró su ausencia.",
    image: [
      "https://res.cloudinary.com/dg9gzic4s/image/upload/v1759253048/IMG-20250930-WA0031_x5o8hr.jpg",
      "https://res.cloudinary.com/dg9gzic4s/image/upload/v1759253050/IMG-20250930-WA0032_uesv8k.jpg",
      "https://res.cloudinary.com/dg9gzic4s/image/upload/v1759253046/IMG-20250930-WA0030_dll3hq.jpg",
    ],
  },
  {
    id: "10",
    title: "Montañero",
    artist: "Felipe Salgado",
    year: 2024,
    medium: "Rotulador sobre papel",
    dimensions: "29,7 cm x 21 cm",
    price: 1400000,
    category: "Dibujantes",
    description:
      "En esta propuesta se explora por medio del dibujo, el paisaje urbano latinoamericano, un entorno citadino, saturado y rudo. En las imágenes se observa una ciudad montañosa, abarrotada por una infinidad de edificios y casas pequeñas.",
    image: [
      "https://res.cloudinary.com/dg9gzic4s/image/upload/v1759253052/IMG-20250930-WA0033_nmurqd.jpg",
      "https://res.cloudinary.com/dg9gzic4s/image/upload/v1759253061/IMG-20250930-WA0038_fgwfjb.jpg",
    ],
  },
  {
    id: "11",
    title: "Montañero",
    artist: "Nicolás Ordóñez",
    year: 2024,
    medium: "Rotulador sobre papel",
    dimensions: "29,7 cm x 21 cm",
    price: 1400000,
    category: "Dibujantes",
    description:
      "La vida que pasa adentro es distinta a lo que viven los alpinistas que se han quedado expuestos al mundo y su grandeza. Ellos ven cuanto de la tierra se puede ver desde el universo, pero se sienten diminutos ante la vida visible que se extiende por kilómetros a su alrededor.",
    image: [
      "https://res.cloudinary.com/dg9gzic4s/image/upload/v1759253053/IMG-20250930-WA0034_duzmku.jpg",
      "https://res.cloudinary.com/dg9gzic4s/image/upload/v1759253061/IMG-20250930-WA0037_a2yf4l.jpg",
    ],
  },
  {
    id: "12",
    title: "Escombro - Visión",
    artist: "Fabián Acero",
    year: 2024,
    medium: "Pintura acrílica sobre adoquín y grafito sobre papel",
    dimensions: "Tamaño varía según pieza",
    price: 1150000,
    category: "Dibujantes",
    description:
      "Este trabajo está influenciado por el paso del tiempo, en los recuerdos que dejamos olvidados en nuestra mente y entorno, a veces no lo notamos, pero los lugares que habitamos y los objetos que están en ellos tienen una memoria, un rastro que, aunque sutil está presente y nos acompaña.",
    image: [
      "https://res.cloudinary.com/dg9gzic4s/image/upload/v1759253059/IMG-20250930-WA0036_n5kwfr.jpg",
      "https://res.cloudinary.com/dg9gzic4s/image/upload/v1759253058/IMG-20250930-WA0035_a3k3p3.jpg",
    ],
  },
  {
    id: "13",
    title: "Desituar",
    artist: "Carolina del Carmen Assik",
    year: 2024,
    medium: "Fotografía Digital",
    dimensions: "36 cm x 40 cm x 2 cm",
    price: 1500000,
    category: "Fotógrafas Mujeres",
    description:
      "Situar al cuerpo desnudo en el presente de su agencia de las cosas, le permite pasar de ser objeto del retrato a ser sujeto de la relación con el espacio, la silla en desconstrucción y la fotógrafa como testiga del proceso.",
    image: [
      "https://res.cloudinary.com/dg9gzic4s/image/upload/v1759253064/IMG-20250930-WA0040_lggv4p.jpg",
      "https://res.cloudinary.com/dg9gzic4s/image/upload/v1759253063/IMG-20250930-WA0039_moykni.jpg",
    ],
  },
  {
    id: "14",
    title: "Mujeres Tierra",
    artist: "Paola Lizarazo",
    year: 2023,
    medium: "Fotografía Digital",
    dimensions: "50cm x 75cm (sin marco)",
    price: 2000000,
    category: "Fotografía",
    description:
      "Proyecto fotográfico que narra los cambios drásticos que ha tenido nuestro paisaje por la ausencia de humanidad en el cuidado del medio ambiente. En las imágenes se encuentra un contraste de lo natural y lo antropogénico.",
    image: [
      "https://res.cloudinary.com/dg9gzic4s/image/upload/v1759253067/IMG-20250930-WA0042_dykkep.jpg",
      "https://res.cloudinary.com/dg9gzic4s/image/upload/v1759253065/IMG-20250930-WA0041_dspcrn.jpg",
    ],
  },
  {
    id: "15",
    title: "Interiores",
    artist: "Hortensia Velazco",
    year: 2024,
    medium: "Fotografía Digital",
    dimensions: "57cm x 40cm",
    price: 1400000,
    category: "Fotografía",
    description:
      "Cuando la piel se convierte en madera lustrada, no hay más remedio que atender a la quietud. 'Interiores' es una serie de fotografías autorretrato, donde se vislumbra el diálogo del cuerpo de la artista con diferentes espacios de la casa.",
    image: [
      "https://res.cloudinary.com/dg9gzic4s/image/upload/v1759253067/IMG-20250930-WA0043_cq0use.jpg",
      "https://res.cloudinary.com/dg9gzic4s/image/upload/v1759253069/IMG-20250930-WA0044_pvqjmt.jpg",
    ],
  },
  {
    id: "16",
    title: "Hotel",
    artist: "Renata Bolivar",
    year: 2024,
    medium: "Fotografía",
    dimensions: "120 cm x 120 cm",
    price: 5800000,
    category: "Fotografía",
    description:
      "Obra fotográfica de gran formato que explora los espacios íntimos y la arquitectura emocional de los lugares de tránsito.",
    image: [
      "https://res.cloudinary.com/dg9gzic4s/image/upload/v1759253072/IMG-20250930-WA0046_b7zizv.jpg",
      "https://res.cloudinary.com/dg9gzic4s/image/upload/v1759253071/IMG-20250930-WA0045_h2rdjp.jpg",
    ],
  },
  {
    id: "17",
    title: "Boceto",
    artist: "José Rosero",
    year: 2024,
    medium: "Pintura en acrílico sobre lienzo",
    dimensions: "40 cm x 50 cm",
    price: 2100000,
    category: "Pintura",
    description:
      "Los espacios de la calle se prestan para ser transformados en una evidencia pictórica de la vida urbana. El cielo funciona como imprimatura del lienzo, y la arquitectura, el punto de partida para un juego de formas que sugieren la abstracción de los rastros de la calle.",
    image: [
      "https://res.cloudinary.com/dg9gzic4s/image/upload/v1759253074/IMG-20250930-WA0047_ghsof7.jpg",
      "https://res.cloudinary.com/dg9gzic4s/image/upload/v1759253075/IMG-20250930-WA0048_cy90uw.jpg",
    ],
  },
  {
    id: "18",
    title: "PDT",
    artist: "Alexander Herrera",
    year: 2024,
    medium: "Escultura de concreto y alambre",
    dimensions: "31,5 cm x 23 cm X 23 cm",
    price: 1850000,
    category: "Escultura",
    description:
      "Obra escultórica que explora la materialidad del concreto y el alambre como elementos de construcción y deconstrucción del espacio urbano.",
    image: [
      "https://res.cloudinary.com/dg9gzic4s/image/upload/v1759253080/IMG-20250930-WA0051_uqw0tm.jpg",
      "https://res.cloudinary.com/dg9gzic4s/image/upload/v1759253079/IMG-20250930-WA0049_ssxp9q.jpg",
      "https://res.cloudinary.com/dg9gzic4s/image/upload/v1759253078/IMG-20250930-WA0050_xoy8hc.jpg",
    ],
  },
  {
    id: "19",
    title: "Hacerse a un lugar",
    artist: "Andrea Marulanda",
    year: 2024,
    medium: "Cerámica, hierro y madera",
    dimensions: "Tamaño varía según pieza",
    price: 1500000,
    category: "Escultura",
    description:
      "Esta serie es inspirada en uno de tantos barrios que aparecen en nuestras ciudades colombianas bajo esta lógica, poblaciones que parecen brotar de la tierra en topografías escarpadas de difícil acceso, y se funden miméticamente con el paisaje mismo a manera de palafitos.",
    image: [
      "https://res.cloudinary.com/dg9gzic4s/image/upload/v1759253081/IMG-20250930-WA0052_yaukhg.jpg",
      "https://res.cloudinary.com/dg9gzic4s/image/upload/v1759253090/IMG-20250930-WA0059_ejd4ie.jpg",
    ],
  },
  {
    id: "20",
    title: "Acción espeluznante a distancia",
    artist: "Juan David Alvarado",
    year: 2024,
    medium: "Ampliación sobre papel de fibra de algodón",
    dimensions: "60 cm x 38,8 cm",
    price: 1350000,
    category: "Fotografía",
    description:
      "El Cementerio Central se convirtió en un recuerdo habitual pero su interior era realmente un esbozo mal logrado. Esta serie fotográfica es el resultado de un encuentro espeluznante, un quinteto de fotografías que conmemoran los espacios de la memoria por medio del retrato del espacio mismo.",
    image:
      "https://res.cloudinary.com/dg9gzic4s/image/upload/v1759253083/IMG-20250930-WA0053_rybpq0.jpg",
  },
  {
    id: "21",
    title: "Ciudad en la Tierra",
    artist: "Juan Diego Carrillo",
    year: 2024,
    medium: "Tierra pisada sobre madera",
    dimensions: "38 cm x 38 cm",
    price: 1650000,
    category: "Pintura",
    description:
      "Los paisajes tienen una esencia, tienen un carácter onírico, una magia propia que a su vez se transforma, se modifica y trasciende con la interacción con los seres que la habitan. Los cuadros de la serie vistazos alterados de la cotidianidad son ventanas que permiten observar parcialmente sucesos de un espacio íntimo.",
    image: [
      "https://res.cloudinary.com/dg9gzic4s/image/upload/v1759253083/IMG-20250930-WA0054_n5cxoa.jpg",
      "https://res.cloudinary.com/dg9gzic4s/image/upload/v1759253084/IMG-20250930-WA0055_wlk5dx.jpg",
      "https://res.cloudinary.com/dg9gzic4s/image/upload/v1759253086/IMG-20250930-WA0056_sbbscn.jpg",
    ],
  },
  {
    id: "22",
    title: "Ciudad en la Tierra",
    artist: "Eider Fabián Martínez",
    year: 2024,
    medium: "Tierra pisada sobre madera",
    dimensions: "38 cm x 38 cm",
    price: 1500000,
    category: "Mixto",
    description:
      "El proyecto es una reflexión entre la arquitectura urbana y la agricultura tradicional. Inspirándose en la técnica de la tapia pisada y empleando ladrillos de tierra cruda de distintos colores abstraídos de diversas regiones de Colombia, abstrayendo la diversidad del paisaje colombiano.",
    image: [
      "https://res.cloudinary.com/dg9gzic4s/image/upload/v1759253089/IMG-20250930-WA0058_f0ouxk.jpg",
      "https://res.cloudinary.com/dg9gzic4s/image/upload/v1759253087/IMG-20250930-WA0057_hzbuln.jpg",
    ],
  },
];

export const artists: Artist[] = [
  {
    id: "1",
    name: "Daniel Acuña",
    email: "randreavivi@gmail.com",
    bio: "Artista especializado en dibujo con carboncillo, explora la noción de vacío presente en la pintura china antigua.",
    image: "https://res.cloudinary.com/dg9gzic4s/image/upload/v1761253568/obra-y-reconocimientos-de-fernando-botero-1187713_shk9sq.jpg",
  },
  {
    id: "2",
    name: "Natalia Armijo",
    bio: "Artista que utiliza el Etch A Sketch como medio de expresión, redescubriendo formas de dibujar sin lápices tradicionales.",
    image: "https://res.cloudinary.com/dg9gzic4s/image/upload/v1761253748/diana-francia-curriculum-1-_gkou31.jpg",
    email: "natyandrea182004@gmail.com"
  },

];
