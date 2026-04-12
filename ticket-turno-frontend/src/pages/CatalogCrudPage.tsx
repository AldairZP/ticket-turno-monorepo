import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { SectionHeader } from "../components/SectionHeader";
import {
  createCatalogItem,
  deleteCatalogItem,
  listCatalogItems,
  updateCatalogItem,
} from "../services/catalogApi";
import { extractApiErrorMessage } from "../services/httpClient";
import type {
  CatalogItemDto,
  CatalogKind,
  UpsertCatalogItemDto,
} from "../types/api";
import type { CatalogEditorFormValues } from "../types/forms";

const CATALOG_TYPE_OPTIONS: Array<{ value: CatalogKind; label: string }> = [
  { value: "niveles-educativos", label: "Niveles Educativos" },
  { value: "asuntos", label: "Asuntos" },
  { value: "municipios", label: "Municipios" },
];

const INITIAL_FORM_VALUES: CatalogEditorFormValues = {
  nombre: "",
  oficinaRegionalId: "",
};

export function CatalogCrudPage() {
  const [catalogKind, setCatalogKind] =
    useState<CatalogKind>("niveles-educativos");
  const [items, setItems] = useState<CatalogItemDto[]>([]);
  const [formValues, setFormValues] =
    useState<CatalogEditorFormValues>(INITIAL_FORM_VALUES);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadItems = async (selectedCatalog: CatalogKind) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const catalogItems = await listCatalogItems(selectedCatalog);
      setItems(catalogItems);
    } catch (error) {
      setItems([]);
      setErrorMessage(extractApiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setEditingId(null);
    setFormValues(INITIAL_FORM_VALUES);
    setSuccessMessage(null);
    void loadItems(catalogKind);
  }, [catalogKind]);

  const handleEditItem = (item: CatalogItemDto) => {
    setEditingId(item.id);
    setFormValues({
      nombre: item.nombre,
      oficinaRegionalId: item.oficinaRegionalId
        ? String(item.oficinaRegionalId)
        : "",
    });
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormValues(INITIAL_FORM_VALUES);
  };

  const buildPayload = (): UpsertCatalogItemDto => {
    const payload: UpsertCatalogItemDto = {
      nombre: formValues.nombre.trim(),
    };

    if (catalogKind === "municipios" && formValues.oficinaRegionalId.trim()) {
      payload.oficinaRegionalId = Number(formValues.oficinaRegionalId);
    }

    return payload;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!event.currentTarget.checkValidity()) {
      event.currentTarget.reportValidity();
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const payload = buildPayload();

      if (editingId) {
        await updateCatalogItem(catalogKind, editingId, payload);
        setSuccessMessage("Catalogo actualizado correctamente.");
      } else {
        await createCatalogItem(catalogKind, payload);
        setSuccessMessage("Registro creado correctamente.");
      }

      setFormValues(INITIAL_FORM_VALUES);
      setEditingId(null);
      await loadItems(catalogKind);
    } catch (error) {
      setErrorMessage(extractApiErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (itemId: number) => {
    const shouldDelete = window.confirm(
      "Esta accion eliminara el registro. Desea continuar?",
    );

    if (!shouldDelete) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await deleteCatalogItem(catalogKind, itemId);
      setSuccessMessage("Registro eliminado correctamente.");
      await loadItems(catalogKind);
    } catch (error) {
      setErrorMessage(extractApiErrorMessage(error));
    }
  };

  return (
    <section className="panel" aria-labelledby="catalogs-title">
      <div className="intro">
        <p className="intro-step">Modulo privado</p>
        <h2 id="catalogs-title">CRUD de Catalogos</h2>
        <div className="intro-rule" aria-hidden />
      </div>

      <section className="group" aria-labelledby="catalog-selector-title">
        <SectionHeader
          id="catalog-selector-title"
          icon="dataset"
          title="Seleccion de catalogo"
        />

        <div className="inline-form">
          <div className="field inline-field">
            <label className="field-label" htmlFor="catalog-type">
              Tipo de catalogo
            </label>
            <div className="select-wrap">
              <select
                id="catalog-type"
                className="field-control field-select"
                value={catalogKind}
                onChange={(event) =>
                  setCatalogKind(event.target.value as CatalogKind)
                }
              >
                {CATALOG_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      <section
        className="group group-emphasis"
        aria-labelledby="catalog-editor-title"
      >
        <SectionHeader
          id="catalog-editor-title"
          icon="edit"
          title={editingId ? "Editar registro" : "Nuevo registro"}
        />

        <form className="inline-form" onSubmit={handleSubmit}>
          <div className="field inline-field">
            <label className="field-label" htmlFor="catalog-name">
              Nombre
            </label>
            <input
              id="catalog-name"
              className="field-control"
              value={formValues.nombre}
              onChange={(event) =>
                setFormValues((previousState) => ({
                  ...previousState,
                  nombre: event.target.value,
                }))
              }
              required
              maxLength={120}
            />
          </div>

          {catalogKind === "municipios" ? (
            <div className="field inline-field">
              <label className="field-label" htmlFor="office-id">
                Oficina regional ID (opcional)
              </label>
              <input
                id="office-id"
                className="field-control"
                type="number"
                min="1"
                value={formValues.oficinaRegionalId}
                onChange={(event) =>
                  setFormValues((previousState) => ({
                    ...previousState,
                    oficinaRegionalId: event.target.value,
                  }))
                }
              />
            </div>
          ) : null}

          <button type="submit" className="primary-button" disabled={isSaving}>
            {isSaving
              ? "Guardando..."
              : editingId
                ? "Guardar cambios"
                : "Crear registro"}
          </button>

          {editingId ? (
            <button
              type="button"
              className="ghost-button"
              onClick={handleCancelEdit}
            >
              Cancelar edicion
            </button>
          ) : null}
        </form>

        {errorMessage ? (
          <p className="feedback feedback-error">{errorMessage}</p>
        ) : null}
        {successMessage ? (
          <p className="feedback feedback-success">{successMessage}</p>
        ) : null}
      </section>

      <section className="group" aria-labelledby="catalog-list-title">
        <SectionHeader
          id="catalog-list-title"
          icon="list_alt"
          title="Listado actual"
        />

        {isLoading ? <p className="muted">Cargando catalogo...</p> : null}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Oficina regional</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.length ? (
                items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.nombre}</td>
                    <td>
                      {item.oficinaRegional ?? item.oficinaRegionalId ?? "N/A"}
                    </td>
                    <td className="action-cell">
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => handleEditItem(item)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="danger-button"
                        onClick={() => {
                          void handleDelete(item.id);
                        }}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="muted">
                    Sin registros disponibles para este catalogo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
