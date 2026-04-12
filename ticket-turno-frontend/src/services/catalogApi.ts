import { getAdminToken } from "./authStorage";
import { httpClient } from "./httpClient";
import type {
  CatalogItemDto,
  CatalogKind,
  UpsertCatalogItemDto,
} from "../types/api";

function getAdminHeaders() {
  const token = getAdminToken();

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

function getCatalogUrl(catalogKind: CatalogKind) {
  return `/api/admin/catalogos/${catalogKind}`;
}

export async function listCatalogItems(catalogKind: CatalogKind) {
  const { data } = await httpClient.get<CatalogItemDto[]>(
    getCatalogUrl(catalogKind),
    {
      headers: getAdminHeaders(),
    },
  );

  return data;
}

export async function createCatalogItem(
  catalogKind: CatalogKind,
  payload: UpsertCatalogItemDto,
) {
  const { data } = await httpClient.post<CatalogItemDto>(
    getCatalogUrl(catalogKind),
    payload,
    {
      headers: getAdminHeaders(),
    },
  );

  return data;
}

export async function updateCatalogItem(
  catalogKind: CatalogKind,
  itemId: number,
  payload: UpsertCatalogItemDto,
) {
  const { data } = await httpClient.put<CatalogItemDto>(
    `${getCatalogUrl(catalogKind)}/${itemId}`,
    payload,
    {
      headers: getAdminHeaders(),
    },
  );

  return data;
}

export async function deleteCatalogItem(
  catalogKind: CatalogKind,
  itemId: number,
) {
  await httpClient.delete(`${getCatalogUrl(catalogKind)}/${itemId}`, {
    headers: getAdminHeaders(),
  });
}
