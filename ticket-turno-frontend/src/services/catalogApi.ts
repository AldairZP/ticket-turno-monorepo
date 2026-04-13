import { getAdminToken } from "./authStorage";
import { httpClient } from "./httpClient";
import type {
  CatalogItemDto,
  CatalogKind,
  UpsertCatalogItemDto,
} from "../types/api";

const CATALOG_CACHE_PREFIX = "ticket_turno_catalog_cache_";

function getAdminHeaders() {
  const token = getAdminToken();

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

function getAdminCatalogUrl(catalogKind: CatalogKind) {
  return `/api/admin/catalogos/${catalogKind}`;
}

function getPublicCatalogUrl(catalogKind: CatalogKind) {
  return `/api/catalogos/${catalogKind}`;
}

function getCatalogCacheKey(catalogKind: CatalogKind) {
  return `${CATALOG_CACHE_PREFIX}${catalogKind}`;
}

function readCatalogCache(catalogKind: CatalogKind) {
  const rawCache = localStorage.getItem(getCatalogCacheKey(catalogKind));

  if (!rawCache) {
    return null;
  }

  try {
    const parsedData = JSON.parse(rawCache) as unknown;
    return normalizeCatalogItems(parsedData);
  } catch {
    return null;
  }
}

function writeCatalogCache(
  catalogKind: CatalogKind,
  catalogItems: ReadonlyArray<CatalogItemDto>,
) {
  localStorage.setItem(
    getCatalogCacheKey(catalogKind),
    JSON.stringify(catalogItems),
  );
}

function normalizeCatalogItem(rawItem: unknown): CatalogItemDto | null {
  if (!rawItem || typeof rawItem !== "object") {
    return null;
  }

  const source = rawItem as Record<string, unknown>;
  const idRaw = source.id ?? source.Id;
  const nameRaw = source.nombre ?? source.Nombre;

  const id = typeof idRaw === "number" ? idRaw : Number(idRaw);
  const nombre = typeof nameRaw === "string" ? nameRaw.trim() : "";

  if (!Number.isFinite(id) || !nombre) {
    return null;
  }

  const normalized: CatalogItemDto = {
    id,
    nombre,
  };

  const oficinaRegionalIdRaw =
    source.oficinaRegionalId ?? source.OficinaRegionalId;
  const oficinaRegionalRaw = source.oficinaRegional ?? source.OficinaRegional;

  const oficinaRegionalId =
    typeof oficinaRegionalIdRaw === "number"
      ? oficinaRegionalIdRaw
      : Number(oficinaRegionalIdRaw);

  if (Number.isFinite(oficinaRegionalId)) {
    normalized.oficinaRegionalId = oficinaRegionalId;
  }

  if (typeof oficinaRegionalRaw === "string" && oficinaRegionalRaw.trim()) {
    normalized.oficinaRegional = oficinaRegionalRaw.trim();
  }

  return normalized;
}

function normalizeCatalogItems(rawData: unknown) {
  if (!Array.isArray(rawData)) {
    return null;
  }

  return rawData
    .map((item) => normalizeCatalogItem(item))
    .filter((item): item is CatalogItemDto => item !== null);
}

async function readCatalogFromUrl(
  catalogUrl: string,
  useAdminHeaders: boolean,
) {
  const headers = useAdminHeaders ? getAdminHeaders() : undefined;
  const { data } = await httpClient.get<unknown>(catalogUrl, { headers });
  return normalizeCatalogItems(data);
}

export async function listCatalogItems(catalogKind: CatalogKind) {
  const hasAdminToken = Boolean(getAdminToken());
  const attempts = hasAdminToken
    ? [
        { url: getAdminCatalogUrl(catalogKind), withAuth: true },
        { url: getPublicCatalogUrl(catalogKind), withAuth: false },
      ]
    : [
        { url: getPublicCatalogUrl(catalogKind), withAuth: false },
        { url: getAdminCatalogUrl(catalogKind), withAuth: false },
      ];

  let latestError: unknown;

  for (const attempt of attempts) {
    try {
      const normalizedData = await readCatalogFromUrl(
        attempt.url,
        attempt.withAuth,
      );

      if (normalizedData) {
        writeCatalogCache(catalogKind, normalizedData);
        return normalizedData;
      }
    } catch (error) {
      latestError = error;
    }
  }

  const cachedData = readCatalogCache(catalogKind);
  if (cachedData) {
    return cachedData;
  }

  throw latestError ?? new Error("No fue posible cargar el catalogo.");
}

export async function createCatalogItem(
  catalogKind: CatalogKind,
  payload: UpsertCatalogItemDto,
) {
  const { data } = await httpClient.post<CatalogItemDto>(
    getAdminCatalogUrl(catalogKind),
    payload,
    {
      headers: getAdminHeaders(),
    },
  );

  const cachedData = readCatalogCache(catalogKind) ?? [];
  const hasItem = cachedData.some((item) => item.id === data.id);
  if (!hasItem) {
    writeCatalogCache(catalogKind, [...cachedData, data]);
  }

  return data;
}

export async function updateCatalogItem(
  catalogKind: CatalogKind,
  itemId: number,
  payload: UpsertCatalogItemDto,
) {
  const { data } = await httpClient.put<CatalogItemDto>(
    `${getAdminCatalogUrl(catalogKind)}/${itemId}`,
    payload,
    {
      headers: getAdminHeaders(),
    },
  );

  const cachedData = readCatalogCache(catalogKind) ?? [];
  const updatedCache = cachedData.map((item) =>
    item.id === itemId ? { ...item, ...data } : item,
  );
  writeCatalogCache(catalogKind, updatedCache);

  return data;
}

export async function deleteCatalogItem(
  catalogKind: CatalogKind,
  itemId: number,
) {
  await httpClient.delete(`${getAdminCatalogUrl(catalogKind)}/${itemId}`, {
    headers: getAdminHeaders(),
  });

  const cachedData = readCatalogCache(catalogKind) ?? [];
  writeCatalogCache(
    catalogKind,
    cachedData.filter((item) => item.id !== itemId),
  );
}
