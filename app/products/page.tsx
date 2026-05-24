import { Suspense } from "react";
import { ProductsPage } from "@/components/marketplace-pages";
import { getCatalogPageData } from "@/lib/data/marketplace";
import {
  defaultProductSearchFilters,
  productSortOptions,
  type ProductSearchFilters,
  type ProductSortOption,
} from "@/lib/marketplace-contracts";
import ProductsLoading from "./loading";

function readParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function readBooleanParam(value: string | string[] | undefined) {
  return readParam(value) === "true";
}

function readSortParam(value: string | string[] | undefined): ProductSortOption {
  const sort = readParam(value);
  return productSortOptions.includes(sort as ProductSortOption) ? (sort as ProductSortOption) : "latest";
}

function readPageParam(value: string | string[] | undefined) {
  const page = Number(readParam(value));
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

export default async function ProductsRoute({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const filters: ProductSearchFilters = {
    ...defaultProductSearchFilters,
    q: readParam(resolvedSearchParams.q),
    brand: readParam(resolvedSearchParams.brand),
    category: readParam(resolvedSearchParams.category),
    condition: readParam(resolvedSearchParams.condition),
    verified: readBooleanParam(resolvedSearchParams.verified),
    tradeReady: readBooleanParam(resolvedSearchParams.tradeReady),
    size: readParam(resolvedSearchParams.size),
    minPrice: readParam(resolvedSearchParams.minPrice),
    maxPrice: readParam(resolvedSearchParams.maxPrice),
    sort: readSortParam(resolvedSearchParams.sort),
    page: readPageParam(resolvedSearchParams.page),
  };
  const { brand, products, sellersById } = await getCatalogPageData({ searchQuery: filters.q });
  const initialShowAll = readParam(resolvedSearchParams.view) === "all";

  return (
    <Suspense fallback={<ProductsLoading />}>
      <ProductsPage
        brand={brand}
        products={products}
        initialFilters={filters}
        initialShowAll={initialShowAll}
        sellersById={sellersById}
      />
    </Suspense>
  );
}
