import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { FormInput } from "../components/FormInput";
import { FormSelect } from "../components/FormSelect";
import { SectionHeader } from "../components/SectionHeader";
import {
  LEVEL_OPTIONS,
  MUNICIPALITY_OPTIONS,
  SUBJECT_OPTIONS,
} from "../constants/ticketOptions";
import {
  CURP_FORMAT_HINT,
  CURP_HTML_PATTERN,
  EMAIL_FORMAT_HINT,
  EMAIL_HTML_PATTERN,
  isValidCurpFormat,
  isValidEmailFormat,
} from "../constants/validation";
import { useCatalogOptions } from "../hooks/useCatalogOptions";
import { generateTicket } from "../services/publicTicketsApi";
import { extractApiErrorMessage } from "../services/httpClient";
import { downloadPdfFromResponse } from "../utils/fileDownload";
import {
  getDefaultFutureDatetimeLocal,
  toIsoFromDatetimeLocal,
} from "../utils/date";
import type { TicketGenerateFormValues } from "../types/forms";

const PHONE_PATTERN = /^[0-9+\-\s()]{7,20}$/;

const INITIAL_FORM_VALUES: TicketGenerateFormValues = {
  curp: "",
  nombre: "",
  paterno: "",
  materno: "",
  telefono: "",
  celular: "",
  correo: "",
  fechaAtencion: getDefaultFutureDatetimeLocal(),
  nivelEducativoId: "",
  municipioId: "",
  asuntoId: "",
};

export function GenerateTicketPage() {
  const { options: levelOptions } = useCatalogOptions(
    "niveles-educativos",
    LEVEL_OPTIONS,
  );
  const { options: municipalityOptions } = useCatalogOptions(
    "municipios",
    MUNICIPALITY_OPTIONS,
  );
  const { options: subjectOptions } = useCatalogOptions(
    "asuntos",
    SUBJECT_OPTIONS,
  );

  const [formValues, setFormValues] =
    useState<TicketGenerateFormValues>(INITIAL_FORM_VALUES);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationMessages, setValidationMessages] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getValidationMessages = (
    values: TicketGenerateFormValues,
  ): string[] => {
    const messages: string[] = [];

    if (!values.nombre.trim()) {
      messages.push("El nombre es obligatorio.");
    }

    if (!values.paterno.trim()) {
      messages.push("El apellido paterno es obligatorio.");
    }

    if (!values.curp.trim()) {
      messages.push("La CURP es obligatoria.");
    } else if (!isValidCurpFormat(values.curp)) {
      messages.push("La CURP no tiene un formato valido.");
    }

    if (!values.telefono.trim()) {
      messages.push("El telefono es obligatorio.");
    } else if (!PHONE_PATTERN.test(values.telefono.trim())) {
      messages.push("El telefono contiene caracteres no validos.");
    }

    if (!values.celular.trim()) {
      messages.push("El celular es obligatorio.");
    } else if (!PHONE_PATTERN.test(values.celular.trim())) {
      messages.push("El celular contiene caracteres no validos.");
    }

    if (!values.correo.trim()) {
      messages.push("El correo es obligatorio.");
    } else if (!isValidEmailFormat(values.correo)) {
      messages.push("El correo no tiene un formato valido.");
    }

    if (!values.nivelEducativoId) {
      messages.push("Debe seleccionar un nivel educativo.");
    }

    if (!values.municipioId) {
      messages.push("Debe seleccionar un municipio.");
    }

    if (!values.asuntoId) {
      messages.push("Debe seleccionar un asunto.");
    }

    if (!values.fechaAtencion) {
      messages.push("La fecha de atención es obligatoria.");
      return messages;
    }

    const selectedDate = new Date(values.fechaAtencion);
    if (Number.isNaN(selectedDate.getTime())) {
      messages.push("La fecha de atención es invalida.");
      return messages;
    }

    if (selectedDate.getTime() < Date.now()) {
      messages.push("La fecha de atención no puede estar en el pasado.");
    }

    if (selectedDate.getDay() === 0 || selectedDate.getDay() === 6) {
      messages.push("Solo se pueden agendar turnos de lunes a viernes.");
    }

    return messages;
  };

  const setField = <TKey extends keyof TicketGenerateFormValues>(
    field: TKey,
    value: TicketGenerateFormValues[TKey],
  ) => {
    setErrorMessage(null);
    setValidationMessages([]);

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

  const previewFolio = useMemo(() => {
    if (!formValues.curp) {
      return "#----";
    }

    return `#${formValues.curp.slice(0, 8).padEnd(8, "X")}`;
  }, [formValues.curp]);

  const previewCitizen = useMemo(() => {
    const fullName = [formValues.nombre, formValues.paterno, formValues.materno]
      .map((value) => value.trim())
      .filter(Boolean)
      .join(" ");

    return fullName || "Pendiente de registro";
  }, [formValues.materno, formValues.nombre, formValues.paterno]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const invalidMessages = getValidationMessages(formValues);
    if (invalidMessages.length > 0) {
      setErrorMessage(null);
      setSuccessMessage(null);
      setValidationMessages(invalidMessages);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setValidationMessages([]);
    setSuccessMessage(null);

    try {
      const response = await generateTicket({
        curp: formValues.curp,
        nombre: formValues.nombre.trim(),
        paterno: formValues.paterno.trim(),
        materno: formValues.materno.trim() || undefined,
        telefono: formValues.telefono.trim(),
        celular: formValues.celular.trim(),
        correo: formValues.correo.trim(),
        fechaAtencion: toIsoFromDatetimeLocal(formValues.fechaAtencion),
        nivelEducativoId: Number(formValues.nivelEducativoId),
        municipioId: Number(formValues.municipioId),
        asuntoId: Number(formValues.asuntoId),
      });

      downloadPdfFromResponse(response, `ticket-${formValues.curp}.pdf`);
      setSuccessMessage("Turno generado y PDF descargado correctamente.");
    } catch (error) {
      setErrorMessage(extractApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="panel" aria-labelledby="generate-title">
      <div className="intro">
        <p className="intro-step">Flujo publico</p>
        <h2 id="generate-title">Generar Solicitud de Turno</h2>
        <div className="intro-rule" aria-hidden />
      </div>

      <form className="ticket-form" onSubmit={handleSubmit}>
        <section className="group" aria-labelledby="student-data-title">
          <SectionHeader
            id="student-data-title"
            icon="person"
            title="Datos del Solicitante"
          />
          <div className="grid grid-3">
            <FormInput
              id="nombre"
              label="Nombre"
              placeholder="Nombre(s)"
              value={formValues.nombre}
              onChange={(value) => setField("nombre", value)}
              required
              maxLength={120}
            />
            <FormInput
              id="paterno"
              label="Apellido Paterno"
              placeholder="Primer apellido"
              value={formValues.paterno}
              onChange={(value) => setField("paterno", value)}
              required
              maxLength={120}
            />
            <FormInput
              id="materno"
              label="Apellido Materno"
              placeholder="Segundo apellido"
              value={formValues.materno}
              onChange={(value) => setField("materno", value)}
              maxLength={120}
            />
            <div className="span-3">
              <FormInput
                id="curp"
                label="CURP"
                placeholder="18 caracteres"
                value={formValues.curp}
                onChange={(value) => setField("curp", value)}
                required
                minLength={18}
                maxLength={18}
                pattern={CURP_HTML_PATTERN}
                title={CURP_FORMAT_HINT}
              />
            </div>
          </div>
        </section>

        <section
          className="group group-emphasis"
          aria-labelledby="contact-title"
        >
          <SectionHeader
            id="contact-title"
            icon="contact_mail"
            title="Information de Contacto"
          />
          <div className="grid grid-2">
            <FormInput
              id="telefono"
              label="Telefono"
              type="tel"
              placeholder="8181818181"
              value={formValues.telefono}
              onChange={(value) => setField("telefono", value)}
              required
              maxLength={20}
            />
            <FormInput
              id="celular"
              label="Celular"
              type="tel"
              placeholder="8111111111"
              value={formValues.celular}
              onChange={(value) => setField("celular", value)}
              required
              maxLength={20}
            />
            <div className="span-2">
              <FormInput
                id="correo"
                label="Correo"
                type="email"
                placeholder="usuario@ejemplo.com"
                value={formValues.correo}
                onChange={(value) => setField("correo", value)}
                required
                pattern={EMAIL_HTML_PATTERN}
                title={EMAIL_FORMAT_HINT}
                maxLength={180}
              />
            </div>
          </div>
        </section>

        <section className="group" aria-labelledby="service-title">
          <SectionHeader
            id="service-title"
            icon="school"
            title="Datos del Servicio"
          />
          <div className="grid grid-2">
            <FormInput
              id="fechaAtencion"
              label="Fecha y hora de atencion"
              type="datetime-local"
              value={formValues.fechaAtencion}
              onChange={(value) => setField("fechaAtencion", value)}
              required
            />
            <FormSelect
              id="nivelEducativo"
              label="Nivel educativo"
              value={formValues.nivelEducativoId}
              onChange={(value) => setField("nivelEducativoId", value)}
              options={levelOptions}
              placeholder="Seleccione nivel"
              required
            />
            <FormSelect
              id="municipio"
              label="Municipio"
              value={formValues.municipioId}
              onChange={(value) => setField("municipioId", value)}
              options={municipalityOptions}
              placeholder="Seleccione municipio"
              required
            />
            <FormSelect
              id="asunto"
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
            {isSubmitting ? "Generando..." : "Generar Turno y Descargar PDF"}
            <span className="material-symbols-outlined" aria-hidden>
              confirmation_number
            </span>
          </button>
          <p className="legal-copy">
            Al generar su turno, se enviaran sus datos al backend y recibirá su
            comprobante en PDF.
          </p>
          {validationMessages.length > 0 ? (
            <div className="feedback feedback-error" role="alert">
              <p>Corrige los siguientes datos:</p>
              <ul className="feedback-list">
                {validationMessages.map((message, index) => (
                  <li key={`${message}-${index}`}>{message}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {errorMessage ? (
            <p className="feedback feedback-error" role="alert">
              {errorMessage}
            </p>
          ) : null}
          {successMessage ? (
            <p className="feedback feedback-success">{successMessage}</p>
          ) : null}
        </div>

        <section className="preview-panel" aria-label="Vista previa del ticket">
          <span className="preview-badge">Vista previa</span>
          <div className="preview-folio-wrap">
            <p className="preview-label">FOLIO PROVISIONAL</p>
            <p className="preview-folio">{previewFolio}</p>
          </div>
          <div className="preview-row">
            <div>
              <p className="preview-label">CIUDADANO</p>
              <p className="preview-name">{previewCitizen}</p>
            </div>
            <span className="material-symbols-outlined" aria-hidden>
              qr_code_2
            </span>
          </div>
        </section>
      </form>
    </section>
  );
}
