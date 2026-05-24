export type BrandLogo = {
  name: string;
  href: string;
  src: string;
  width: number;
  height: number;
  imageClassName: string;
};

const brandLogoBySlug = {
  balenciaga: {
    name: "Balenciaga",
    href: "/brands/balenciaga",
    src: "/brand-logos/balenciaga.png",
    width: 483,
    height: 71,
    imageClassName: "max-h-16 w-auto max-w-[460px]",
  },
  "chrome-hearts": {
    name: "Chrome Hearts",
    href: "/brands/chrome-hearts",
    src: "/brand-logos/chrome-hearts.png",
    width: 922,
    height: 988,
    imageClassName: "max-h-36 w-auto max-w-[170px]",
  },
  "enfants-riches-deprimes": {
    name: "Enfants Riches Deprimes",
    href: "/brands/enfants-riches-deprimes",
    src: "/brand-logos/erd.png",
    width: 1024,
    height: 280,
    imageClassName: "max-h-24 w-auto max-w-[440px]",
  },
  supreme: {
    name: "Supreme",
    href: "/brands/supreme",
    src: "/brand-logos/supreme.png",
    width: 984,
    height: 296,
    imageClassName: "max-h-20 w-auto max-w-[320px]",
  },
  "maison-margiela": {
    name: "Maison Margiela",
    href: "/brands/maison-margiela",
    src: "/brand-logos/maison-margiela.png",
    width: 1400,
    height: 321,
    imageClassName: "max-h-24 w-auto max-w-[420px]",
  },
  gucci: {
    name: "Gucci",
    href: "/brands/gucci",
    src: "/brand-logos/gucci.png",
    width: 1400,
    height: 243,
    imageClassName: "max-h-20 w-auto max-w-[380px]",
  },
  "louis-vuitton": {
    name: "Louis Vuitton",
    href: "/brands/louis-vuitton",
    src: "/brand-logos/louis-vuitton.png",
    width: 500,
    height: 482,
    imageClassName: "max-h-32 w-auto max-w-[150px]",
  },
} satisfies Record<string, BrandLogo>;

export const brandDiscoveryLogos = [
  brandLogoBySlug.balenciaga,
  brandLogoBySlug["chrome-hearts"],
  brandLogoBySlug["enfants-riches-deprimes"],
  brandLogoBySlug.supreme,
  brandLogoBySlug["maison-margiela"],
  brandLogoBySlug.gucci,
  brandLogoBySlug["louis-vuitton"],
];

export const brandNavLogos = [
  brandLogoBySlug["chrome-hearts"],
  brandLogoBySlug.supreme,
  brandLogoBySlug.balenciaga,
  brandLogoBySlug["maison-margiela"],
  brandLogoBySlug["enfants-riches-deprimes"],
  brandLogoBySlug.gucci,
  brandLogoBySlug["louis-vuitton"],
];
