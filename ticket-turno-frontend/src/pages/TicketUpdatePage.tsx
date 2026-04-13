import { useState } from "react";
import type { FormEvent } from "react";
import { FormInput } from "../components/FormInput";
import { FormSelect } from "../components/FormSelect";
import { SectionHeader } from "../components/SectionHeader";
import {
  LEVEL_OPTIONS,
  SUBJECT_OPTIONS,
  findOptionValueByLabel,
} from "../constants/ticketOptions";
import {
  CURP_FORMAT_HINT,
  CURP_HTML_PATTERN,
  EMAIL_FORMAT_HINT,
  EMAIL_HTML_PATTERN,
  isValidCurpFormat,
} from "../constants/validation";
import { useCatalogOptions } from "../hooks/useCatalogOptions";
import {
  getTicketByCurpAndTurn,
  updateTicket,
} from "../services/publicTicketsApi";
import { extractApiErrorMessage } from "../services/httpClient";
import { downloadPdfFromResponse } from "../utils/fileDownload";
import { toDatetimeLocalValue, toIsoFromDatetimeLocal } from "../utils/date";
import type { TicketUpdateFormValues } from "../types/forms";

const INITIAL_UPDATE_VALUES: TicketUpdateFormValues = {
  curp: "",
  numeroTurno: "",
  nombre: "",
  paterno: "",
  materno: "",
  telefono: "",
  celular: "",
  correo: "",
  fechaAtencion: "",
  nivelEducativoId: "",
  asuntoId: "",
};

interface SplitNameResult {
  nombre: string;
  paterno: string;
  materno: string;
}

function splitFullName(nombreCompleto: string): SplitNameResult {
  const parts = nombreCompleto.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return { nombre: "", paterno: "", materno: "" };
  }

  if (parts.length === 1) {
    return { nombre: parts[0], paterno: "", materno: "" };
  }

  if (parts.length === 2) {
    return { nombre: parts[0], paterno: parts[1], materno: "" };
  }

  return {
    nombre: parts.slice(0, parts.length - 2).join(" "),
    paterno: parts[parts.length - 2],
    materno: parts[parts.length - 1],
  };
}

export function TicketUpdatePage() {
  const { options: levelOptions, isLoading: isLoadingLevelOptions } =
    useCatalogOptions("niveles-educativos", LEVEL_OPTIONS);
  const { options: subjectOptions, isLoading: isLoadingSubjectOptions } =
    useCatalogOptions("asuntos", SUBJECT_OPTIONS);

  const [formValues, setFormValues] = useState<TicketUpdateFormValues>(
    INITIAL_UPDATE_VALUES,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoadingTicket, setIsLoadingTicket] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setField = <TKey extends keyof TicketUpdateFormValues>(
    field: TKey,
    value: TicketUpdateFormValues[TKey],
  ) => {
    if (field === "curp") {
      setFormValues((previousState) => ({
        ...previousState,
        curp: value
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "")
          .slice(0, 18),
      }));
      return;
    }

    setFormValues((previousState) => ({
      ...previousState,
      [field]: value,
    }));
  };

  const handleLoadCurrentData = async () => {
    if (!formValues.curp || !formValues.numeroTurno) {
      setErrorMessage(
        "Ingrese CURP y numero de turno para cargar la solicitud.",
      );
      return;
    }

    if (!isValidCurpFormat(formValues.curp)) {
      setErrorMessage("La CURP no tiene un formato valido.");
      return;
    }

    setIsLoadingTicket(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const ticket = await getTicketByCurpAndTurn(
        formValues.curp,
        Number(formValues.numeroTurno),
      );
      const splitName = splitFullName(ticket.nombreCompleto);

      setFormValues((previousState) => ({
        ...previousState,
        nombre: splitName.nombre,
        paterno: splitName.paterno,
        materno: splitName.materno,
        telefono: ticket.telefono,
        celular: ticket.celular,
        correo: ticket.correo,
        fechaAtencion: toDatetimeLocalValue(ticket.fechaAtencion),
        nivelEducativoId: findOptionValueByLabel(
          levelOptions,
          ticket.nivelEducativo,
        ),
        asuntoId: findOptionValueByLabel(subjectOptions, ticket.asunto),
      }));

      setSuccessMessage(
        "Solicitud encontrada. Puede editar y guardar cambios.",
      );
    } catch (error) {
      setErrorMessage(extractApiErrorMessage(error));
    } finally {
      setIsLoadingTicket(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!event.currentTarget.checkValidity()) {
      event.currentTarget.reportValidity();
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await updateTicket({
        curp: formValues.curp,
        numeroTurno: Number(formValues.numeroTurno),
        nombre: formValues.nombre.trim(),
        paterno: formValues.paterno.trim(),
        materno: formValues.materno.trim() || undefined,
        telefono: formValues.telefono.trim(),
        celular: formValues.celular.trim(),
        correo: formValues.correo.trim(),
        fechaAtencion: toIsoFromDatetimeLocal(formValues.fechaAtencion),
        nivelEducativoId: Number(formValues.nivelEducativoId),
        asuntoId: Number(formValues.asuntoId),
      });

      downloadPdfFromResponse(
        response,
        `ticket-actualizado-${formValues.curp}-${formValues.numeroTurno}.pdf`,
      );

      setSuccessMessage(
        "Solicitud actualizada y PDF descargado correctamente.",
      );
    } catch (error) {
      setErrorMessage(extractApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="panel" aria-labelledby="update-title">
      <div className="intro">
        <p className="intro-step">Flujo publico</p>
        <h2 id="update-title">Actualizar Solicitud Existente</h2>
        <div className="intro-rule" aria-hidden />
      </div>

      <form className="ticket-form" onSubmit={handleSubmit}>
        <section className="group" aria-labelledby="identity-search-title">
          <SectionHeader
            id="identity-search-title"
            icon="badge"
            title="Identificación de solicitud"
          />
          <div className="grid grid-2">
            <FormInput
              id="update-curp"
              label="CURP"
              value={formValues.curp}
              onChange={(value) => setField("curp", value)}
              required
              minLength={18}
              maxLength={18}
              pattern={CURP_HTML_PATTERN}
              title={CURP_FORMAT_HINT}
              placeholder="GODE561231HDFABC09"
            />
            <FormInput
              id="update-turn"
              label="Numero de turno"
              type="number"
              min="1"
              value={formValues.numeroTurno}
              onChange={(value) => setField("numeroTurno", value)}
              required
            />
          </div>
          <div className="button-row">
            <button
              type="button"
              className="secondary-button"
              onClick={handleLoadCurrentData}
              disabled={
                isLoadingTicket ||
                isLoadingLevelOptions ||
                isLoadingSubjectOptions
              }
            >
              {isLoadingTicket ? "Cargando..." : "Cargar datos actuales"}
            </button>
          </div>
        </section>

        <section className="group" aria-labelledby="update-data-title">
          <SectionHeader
            id="update-data-title"
            icon="edit_note"
            title="Datos a actualizar"
          />
          <div className="grid grid-3">
            <FormInput
              id="update-nombre"
              label="Nombre"
              value={formValues.nombre}
              onChange={(value) => setField("nombre", value)}
              required
              maxLength={120}
            />
            <FormInput
              id="update-paterno"
              label="Apellido Paterno"
              value={formValues.paterno}
              onChange={(value) => setField("paterno", value)}
              required
              maxLength={120}
            />
            <FormInput
              id="update-materno"
              label="Apellido Materno"
              value={formValues.materno}
              onChange={(value) => setField("materno", value)}
              maxLength={120}
            />
            <FormInput
              id="update-telefono"
              label="Telefono"
              type="tel"
              value={formValues.telefono}
              onChange={(value) => setField("telefono", value)}
              required
              maxLength={20}
            />
            <FormInput
              id="update-celular"
              label="Celular"
              type="tel"
              value={formValues.celular}
              onChange={(value) => setField("celular", value)}
              required
              maxLength={20}
            />
            <FormInput
              id="update-correo"
              label="Correo"
              type="email"
              value={formValues.correo}
              onChange={(value) => setField("correo", value)}
              required
              pattern={EMAIL_HTML_PATTERN}
              title={EMAIL_FORMAT_HINT}
              maxLength={180}
            />
            <FormInput
              id="update-fecha"
              label="Fecha y hora de atencion"
              type="datetime-local"
              value={formValues.fechaAtencion}
              onChange={(value) => setField("fechaAtencion", value)}
              required
            />
            <FormSelect
              id="update-level"
              label="Nivel educativo"
              value={formValues.nivelEducativoId}
              onChange={(value) => setField("nivelEducativoId", value)}
              options={levelOptions}
              placeholder="Seleccione nivel"
              required
            />
            <FormSelect
              id="update-subject"
              label="Asunto"
              value={formValues.asuntoId}
              onChange={(value) => setField("asuntoId", value)}
              options={subjectOptions}
              placeholder="Seleccione asunto"
              required
            />
          </div>
        </section>

        <div className="actions">
          <button
            className="primary-button"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Actualizando..." : "Actualizar y Descargar PDF"}
            <span className="material-symbols-outlined" aria-hidden>
              save
            </span>
          </button>
          {errorMessage ? (
            <p className="feedback feedback-error">{errorMessage}</p>
          ) : null}
          {successMessage ? (
            <p className="feedback feedback-success">{successMessage}</p>
          ) : null}
        </div>
      </form>
    </section>
  );
}
