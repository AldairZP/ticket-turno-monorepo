import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { FormInput } from "../components/FormInput";
import { FormSelect } from "../components/FormSelect";
import { SectionHeader } from "../components/SectionHeader";
import {
  MUNICIPALITY_OPTIONS,
  STATUS_OPTIONS,
} from "../constants/ticketOptions";
import {
  CURP_FORMAT_HINT,
  CURP_HTML_PATTERN,
  isValidCurpFormat,
} from "../constants/validation";
import { useCatalogOptions } from "../hooks/useCatalogOptions";
import {
  getDashboardSummary,
  updateAdminTicketStatus,
} from "../services/adminApi";
import { extractApiErrorMessage } from "../services/httpClient";
import { getTicketByCurpAndTurn } from "../services/publicTicketsApi";
import type {
  DashboardStatusSummaryDto,
  TicketResponseDto,
  TicketStatus,
} from "../types/api";
import { formatDateTimeForUi } from "../utils/date";

function clampPercent(value: number) {
  return Math.min(Math.max(value, 0), 100);
}

function resolveTargetTicketId(ticketId: string, numeroTurno: string) {
  if (ticketId.trim()) {
    const parsedTicketId = Number(ticketId);
    if (Number.isInteger(parsedTicketId) && parsedTicketId > 0) {
      return { id: parsedTicketId, usedFallback: false };
    }

    return null;
  }

  const parsedTurnNumber = Number(numeroTurno);
  if (Number.isInteger(parsedTurnNumber) && parsedTurnNumber > 0) {
    return { id: parsedTurnNumber, usedFallback: true };
  }

  return null;
}

export function AdminDashboardPage() {
  const { options: municipalityOptions } = useCatalogOptions(
    "municipios",
    MUNICIPALITY_OPTIONS,
  );

  const [municipioId, setMunicipioId] = useState("");
  const [summary, setSummary] = useState<DashboardStatusSummaryDto | null>(
    null,
  );
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [consultCurp, setConsultCurp] = useState("");
  const [consultTurno, setConsultTurno] = useState("");
  const [ticketId, setTicketId] = useState("");
  const [status, setStatus] = useState<TicketStatus>("Resuelto");
  const [consultedTicket, setConsultedTicket] =
    useState<TicketResponseDto | null>(null);
  const [consultMessage, setConsultMessage] = useState<string | null>(null);
  const [consultError, setConsultError] = useState<string | null>(null);
  const [isConsultingTicket, setIsConsultingTicket] = useState(false);

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const loadSummary = async (selectedMunicipioId?: string) => {
    setIsLoadingSummary(true);
    setSummaryError(null);

    try {
      const selectedId = selectedMunicipioId
        ? Number(selectedMunicipioId)
        : undefined;
      const data = await getDashboardSummary(selectedId);
      setSummary(data);
    } catch (error) {
      setSummary(null);
      setSummaryError(extractApiErrorMessage(error));
    } finally {
      setIsLoadingSummary(false);
    }
  };

  useEffect(() => {
    void loadSummary();
  }, []);

  const handleFilterSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void loadSummary(municipioId);
  };

  const handleConsultTicket = async () => {
    if (!consultCurp.trim() || !consultTurno.trim()) {
      setConsultError(
        "Debe ingresar CURP y numero de turno para consultar el ticket.",
      );
      setConsultMessage(null);
      return;
    }

    if (!isValidCurpFormat(consultCurp)) {
      setConsultError("La CURP no tiene un formato valido.");
      setConsultMessage(null);
      return;
    }

    setIsConsultingTicket(true);
    setConsultError(null);
    setConsultMessage(null);
    setStatusError(null);
    setStatusMessage(null);

    try {
      const normalizedCurp = consultCurp.trim().toUpperCase();
      const ticket = await getTicketByCurpAndTurn(
        normalizedCurp,
        Number(consultTurno),
      );

      setConsultCurp(normalizedCurp);
      setConsultedTicket(ticket);
      setConsultMessage(
        "Ticket consultado correctamente. Ya puede actualizar su estatus a Resuelto.",
      );

      if (ticket.estatus === "Pendiente") {
        setStatus("Resuelto");
      }
    } catch (error) {
      setConsultedTicket(null);
      setConsultError(extractApiErrorMessage(error));
    } finally {
      setIsConsultingTicket(false);
    }
  };

  const handleStatusSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!consultedTicket) {
      setStatusError("Primero consulte el ticket para validar la información.");
      return;
    }

    const targetTicket = resolveTargetTicketId(ticketId, consultTurno);
    if (!targetTicket) {
      setStatusError(
        "Ingrese un Ticket ID valido. Si no lo tiene, intente con el numero de turno.",
      );
      return;
    }

    setIsUpdatingStatus(true);
    setStatusError(null);
    setStatusMessage(null);

    try {
      const response = await updateAdminTicketStatus(targetTicket.id, status);
      setStatusMessage(response.message);
      setConsultedTicket((previousState) =>
        previousState
          ? {
              ...previousState,
              estatus: status,
            }
          : previousState,
      );
      await loadSummary(municipioId);
    } catch (error) {
      const errorMessage = extractApiErrorMessage(error);

      if (targetTicket.usedFallback && !ticketId.trim()) {
        setStatusError(
          `${errorMessage} Si persiste, capture el Ticket ID real e intente de nuevo.`,
        );
      } else {
        setStatusError(errorMessage);
      }
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const pendingPercentage = summary
    ? clampPercent(summary.porcentajePendientes)
    : 0;

  const municipalityRows = useMemo(
    () =>
      summary
        ? [...summary.porMunicipio].sort(
            (left, right) => right.totalSolicitudes - left.totalSolicitudes,
          )
        : [],
    [summary],
  );

  const donutStyle: CSSProperties = {
    background: `conic-gradient(#f0a228 0% ${pendingPercentage}%, #2a8f65 ${pendingPercentage}% 100%)`,
  };

  return (
    <section className="panel" aria-labelledby="admin-dashboard-title">
      <div className="intro">
        <p className="intro-step">Modulo privado</p>
        <h2 id="admin-dashboard-title">Dashboard Administrativo</h2>
        <div className="intro-rule" aria-hidden />
      </div>

      <section className="group" aria-labelledby="summary-filter-title">
        <SectionHeader
          id="summary-filter-title"
          icon="analytics"
          title="Resumen de estatus"
        />

        <form className="inline-form" onSubmit={handleFilterSubmit}>
          <div className="field inline-field">
            <label className="field-label" htmlFor="dashboard-municipio">
              Filtrar por municipio
            </label>
            <div className="select-wrap">
              <select
                id="dashboard-municipio"
                className="field-control field-select"
                value={municipioId}
                onChange={(event) => setMunicipioId(event.target.value)}
              >
                <option value="">Todos</option>
                {municipalityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="secondary-button"
            disabled={isLoadingSummary}
          >
            {isLoadingSummary ? "Consultando..." : "Aplicar filtro"}
          </button>
        </form>

        {summaryError ? (
          <p className="feedback feedback-error">{summaryError}</p>
        ) : null}

        {summary ? (
          <>
            <div className="stat-grid">
              <article className="stat-card">
                <p>Total solicitudes</p>
                <strong>{summary.totalSolicitudes}</strong>
              </article>
              <article className="stat-card">
                <p>Pendientes</p>
                <strong>{summary.pendientes}</strong>
                <small>{summary.porcentajePendientes.toFixed(2)}%</small>
              </article>
              <article className="stat-card">
                <p>Resueltas</p>
                <strong>{summary.resueltas}</strong>
                <small>{summary.porcentajeResueltas.toFixed(2)}%</small>
              </article>
            </div>

            <div className="dashboard-visual-grid">
              <article className="chart-card">
                <h4>Distribucion global</h4>
                <div className="donut-shell">
                  <div className="donut-ring" style={donutStyle} />
                  <div className="donut-center">
                    <strong>{summary.totalSolicitudes}</strong>
                    <span>Solicitudes</span>
                  </div>
                </div>
                <div className="chart-legend-row">
                  <span>
                    <i className="legend-dot pending" aria-hidden /> Pendiente (
                    {summary.pendientes})
                  </span>
                  <span>
                    <i className="legend-dot resolved" aria-hidden /> Resuelto (
                    {summary.resueltas})
                  </span>
                </div>
              </article>

              <article className="chart-card">
                <h4>Rendimiento por municipio</h4>
                <div className="bar-chart">
                  {municipalityRows.length ? (
                    municipalityRows.map((item) => {
                      const pendingShare = item.totalSolicitudes
                        ? (item.pendientes / item.totalSolicitudes) * 100
                        : 0;
                      const resolvedShare = item.totalSolicitudes
                        ? (item.resueltas / item.totalSolicitudes) * 100
                        : 0;

                      return (
                        <div key={item.municipioId} className="bar-row">
                          <div className="bar-row-top">
                            <span>{item.municipio}</span>
                            <strong>{item.totalSolicitudes}</strong>
                          </div>
                          <div
                            className="stack-track"
                            aria-label={`Composición de solicitudes en ${item.municipio}`}
                          >
                            <span
                              className="stack-pending"
                              style={{
                                width: `${clampPercent(pendingShare)}%`,
                              }}
                            />
                            <span
                              className="stack-resolved"
                              style={{
                                width: `${clampPercent(resolvedShare)}%`,
                              }}
                            />
                          </div>
                          <div className="bar-row-meta">
                            <small>P: {item.pendientes}</small>
                            <small>R: {item.resueltas}</small>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="muted">
                      Sin datos por municipio para este filtro.
                    </p>
                  )}
                </div>
              </article>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Municipio</th>
                    <th>Total</th>
                    <th>Pendientes</th>
                    <th>Resueltas</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.porMunicipio.length ? (
                    summary.porMunicipio.map((item) => (
                      <tr key={item.municipioId}>
                        <td>{item.municipio}</td>
                        <td>{item.totalSolicitudes}</td>
                        <td>{item.pendientes}</td>
                        <td>{item.resueltas}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="muted">
                        Sin datos por municipio para este filtro.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </section>

      <section
        className="group group-emphasis"
        aria-labelledby="status-update-title"
      >
        <SectionHeader
          id="status-update-title"
          icon="task_alt"
          title="Actualizar estatus de ticket"
        />

        <form
          className="inline-form status-update-form"
          onSubmit={handleStatusSubmit}
        >
          <FormInput
            id="consult-curp"
            label="CURP"
            value={consultCurp}
            onChange={(value) => {
              setConsultCurp(
                value
                  .toUpperCase()
                  .replace(/[^A-Z0-9]/g, "")
                  .slice(0, 18),
              );
              setConsultedTicket(null);
              setConsultMessage(null);
              setConsultError(null);
              setStatusMessage(null);
              setStatusError(null);
            }}
            required
            minLength={18}
            maxLength={18}
            pattern={CURP_HTML_PATTERN}
            title={CURP_FORMAT_HINT}
          />
          <FormInput
            id="consult-turno"
            label="Numero de turno"
            type="number"
            min="1"
            value={consultTurno}
            onChange={(value) => {
              setConsultTurno(value);
              setConsultedTicket(null);
              setConsultMessage(null);
              setConsultError(null);
              setStatusMessage(null);
              setStatusError(null);
            }}
            required
          />
          <FormInput
            id="ticket-id"
            label="Ticket ID (opcional)"
            type="number"
            min="1"
            value={ticketId}
            onChange={(value) => {
              setTicketId(value);
              setStatusMessage(null);
              setStatusError(null);
            }}
            placeholder="Si el backend lo requiere"
          />
          <FormSelect
            id="ticket-status"
            label="Nuevo estatus"
            value={status}
            onChange={(value) =>
              setStatus((value || "Resuelto") as TicketStatus)
            }
            options={STATUS_OPTIONS}
            placeholder="Seleccione estatus"
            required
          />
          <button
            className="secondary-button"
            type="button"
            onClick={() => {
              void handleConsultTicket();
            }}
            disabled={isConsultingTicket || isUpdatingStatus}
          >
            {isConsultingTicket ? "Consultando..." : "Consultar"}
          </button>
          <button
            className="primary-button"
            type="submit"
            disabled={isUpdatingStatus || isConsultingTicket}
          >
            {isUpdatingStatus ? "Actualizando..." : "Actualizar estatus"}
          </button>
        </form>

        {consultError ? (
          <p className="feedback feedback-error">{consultError}</p>
        ) : null}
        {consultMessage ? (
          <p className="feedback feedback-success">{consultMessage}</p>
        ) : null}

        {consultedTicket ? (
          <article className="ticket-preview-card" aria-live="polite">
            <div className="ticket-preview-header">
              <h4>Informacion del ticket</h4>
              <span
                className={`ticket-status-chip ${consultedTicket.estatus === "Resuelto" ? "resolved" : "pending"}`}
              >
                {consultedTicket.estatus}
              </span>
            </div>
            <div className="ticket-preview-grid">
              <p>
                <strong>Ticket ID usado:</strong>{" "}
                {ticketId || consultTurno || "N/A"}
              </p>
              <p>
                <strong>Turno:</strong> {consultedTicket.numeroTurno}
              </p>
              <p>
                <strong>CURP:</strong> {consultedTicket.curp}
              </p>
              <p>
                <strong>Nombre:</strong> {consultedTicket.nombreCompleto}
              </p>
              <p>
                <strong>Fecha atencion:</strong>{" "}
                {formatDateTimeForUi(consultedTicket.fechaAtencion)}
              </p>
              <p>
                <strong>Municipio:</strong> {consultedTicket.municipio}
              </p>
              <p>
                <strong>Nivel educativo:</strong>{" "}
                {consultedTicket.nivelEducativo}
              </p>
              <p>
                <strong>Asunto:</strong> {consultedTicket.asunto}
              </p>
              <p>
                <strong>Oficina regional:</strong>{" "}
                {consultedTicket.oficinaRegional}
              </p>
              <p>
                <strong>Telefono:</strong> {consultedTicket.telefono}
              </p>
              <p>
                <strong>Celular:</strong> {consultedTicket.celular}
              </p>
              <p>
                <strong>Correo:</strong> {consultedTicket.correo}
              </p>
            </div>
          </article>
        ) : null}

        {statusError ? (
          <p className="feedback feedback-error">{statusError}</p>
        ) : null}
        {statusMessage ? (
          <p className="feedback feedback-success">{statusMessage}</p>
        ) : null}
      </section>
    </section>
  );
}
