import { useCallback, useEffect, useState } from "react";
import type { SelectOption } from "../constants/ticketOptions";
import { listCatalogItems } from "../services/catalogApi";
import type { CatalogItemDto, CatalogKind } from "../types/api";

interface UseCatalogOptionsResult {
  options: ReadonlyArray<SelectOption<string>>;
  isLoading: boolean;
  reload: () => Promise<void>;
}

function mapCatalogItemsToOptions(
  items: ReadonlyArray<CatalogItemDto>,
): Array<SelectOption<string>> {
  return items.map((item) => ({
    value: String(item.id),
    label: item.nombre,
  }));
}

export function useCatalogOptions(
  catalogKind: CatalogKind,
  fallbackOptions: ReadonlyArray<SelectOption<string>>,
): UseCatalogOptionsResult {
  const [options, setOptions] =
    useState<ReadonlyArray<SelectOption<string>>>(fallbackOptions);
  const [isLoading, setIsLoading] = useState(false);

  const loadOptions = useCallback(async () => {
    setIsLoading(true);

    try {
      const items = await listCatalogItems(catalogKind);
      setOptions(mapCatalogItemsToOptions(items));
    } catch {
      setOptions(fallbackOptions);
    } finally {
      setIsLoading(false);
    }
  }, [catalogKind, fallbackOptions]);

  useEffect(() => {
    void loadOptions();
  }, [loadOptions]);

  useEffect(() => {
    const handleWindowFocus = () => {
      void loadOptions();
    };
    const handleCatalogsUpdated = () => {
      void loadOptions();
    };

    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("catalogs:updated", handleCatalogsUpdated);

    return () => {
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("catalogs:updated", handleCatalogsUpdated);
    };
  }, [loadOptions]);

  return {
    options,
    isLoading,
    reload: loadOptions,
  };
}
