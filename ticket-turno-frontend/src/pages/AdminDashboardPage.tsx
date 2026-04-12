import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { FormInput } from "../components/FormInput";
import { FormSelect } from "../components/FormSelect";
import { SectionHeader } from "../components/SectionHeader";
import {
  MUNICIPALITY_OPTIONS,
  STATUS_OPTIONS,
} from "../constants/ticketOptions";
import {
  getDashboardSummary,
  updateAdminTicketStatus,
} from "../services/adminApi";
import { extractApiErrorMessage } from "../services/httpClient";
import type { DashboardStatusSummaryDto, TicketStatus } from "../types/api";

export function AdminDashboardPage() {
  const [municipioId, setMunicipioId] = useState("");
  const [summary, setSummary] = useState<DashboardStatusSummaryDto | null>(
    null,
  );
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [ticketId, setTicketId] = useState("");
  const [status, setStatus] = useState<TicketStatus>("Pendiente");
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

  const handleStatusSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!ticketId.trim()) {
      setStatusError("Debe ingresar un ticketId para actualizar estatus.");
      return;
    }

    setIsUpdatingStatus(true);
    setStatusError(null);
    setStatusMessage(null);

    try {
      const response = await updateAdminTicketStatus(Number(ticketId), status);
      setStatusMessage(response.message);
      await loadSummary(municipioId);
    } catch (error) {
      setStatusError(extractApiErrorMessage(error));
    } finally {
      setIsUpdatingStatus(false);
    }
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
                {MUNICIPALITY_OPTIONS.map((option) => (
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

        <form className="inline-form" onSubmit={handleStatusSubmit}>
          <FormInput
            id="ticket-id"
            label="Ticket ID"
            type="number"
            min="1"
            value={ticketId}
            onChange={setTicketId}
            required
          />
          <FormSelect
            id="ticket-status"
            label="Nuevo estatus"
            value={status}
            onChange={(value) =>
              setStatus((value || "Pendiente") as TicketStatus)
            }
            options={STATUS_OPTIONS}
            placeholder="Seleccione estatus"
            required
          />
          <button
            className="primary-button"
            type="submit"
            disabled={isUpdatingStatus}
          >
            {isUpdatingStatus ? "Actualizando..." : "Actualizar estatus"}
          </button>
        </form>

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
