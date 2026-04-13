import { useState } from "react";
import type { FormEvent } from "react";
import { FormInput } from "../components/FormInput";
import { SectionHeader } from "../components/SectionHeader";
import {
  getLatestTicketByCurp,
  getTicketByCurpAndTurn,
} from "../services/publicTicketsApi";
import { CURP_FORMAT_HINT, CURP_HTML_PATTERN } from "../constants/validation";
import { extractApiErrorMessage } from "../services/httpClient";
import type { TicketResponseDto } from "../types/api";
import { formatDateTimeForUi } from "../utils/date";

export function TicketLookupPage() {
  const [curp, setCurp] = useState("");
  const [numeroTurno, setNumeroTurno] = useState("");
  const [ticketData, setTicketData] = useState<TicketResponseDto | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!event.currentTarget.checkValidity()) {
      event.currentTarget.reportValidity();
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const normalizedCurp = curp.trim().toUpperCase();
      const ticket = numeroTurno.trim()
        ? await getTicketByCurpAndTurn(normalizedCurp, Number(numeroTurno))
        : await getLatestTicketByCurp(normalizedCurp);

      setTicketData(ticket);
    } catch (error) {
      setTicketData(null);
      setErrorMessage(extractApiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="panel" aria-labelledby="lookup-title">
      <div className="intro">
        <p className="intro-step">Flujo publico</p>
        <h2 id="lookup-title">Consultar Solicitud</h2>
        <div className="intro-rule" aria-hidden />
      </div>

      <form className="ticket-form" onSubmit={handleSubmit}>
        <section className="group" aria-labelledby="lookup-form-title">
          <SectionHeader
            id="lookup-form-title"
            icon="search"
            title="Buscar ticket por CURP"
          />
          <div className="grid grid-2">
            <FormInput
              id="lookup-curp"
              label="CURP"
              placeholder="ABCD001122HDFRRL09"
              value={curp}
              onChange={(value) =>
                setCurp(
                  value
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, "")
                    .slice(0, 18),
                )
              }
              required
              minLength={18}
              maxLength={18}
              pattern={CURP_HTML_PATTERN}
              title={CURP_FORMAT_HINT}
            />
            <FormInput
              id="lookup-turn"
              label="Numero de turno (opcional)"
              placeholder="Ej. 34"
              type="number"
              min="1"
              value={numeroTurno}
              onChange={setNumeroTurno}
            />
          </div>
        </section>

        <div className="actions">
          <button className="primary-button" type="submit" disabled={isLoading}>
            {isLoading ? "Consultando..." : "Consultar Ticket"}
            <span className="material-symbols-outlined" aria-hidden>
              travel_explore
            </span>
          </button>
          {errorMessage ? (
            <p className="feedback feedback-error">{errorMessage}</p>
          ) : null}
        </div>
      </form>

      {ticketData ? (
        <article className="result-card" aria-live="polite">
          <h3>Resultado de la consulta</h3>
          <div className="result-grid">
            <p>
              <strong>CURP:</strong> {ticketData.curp}
            </p>
            <p>
              <strong>Nombre:</strong> {ticketData.nombreCompleto}
            </p>
            <p>
              <strong>Turno:</strong> {ticketData.numeroTurno}
            </p>
            <p>
              <strong>Estatus:</strong> {ticketData.estatus}
            </p>
            <p>
              <strong>Fecha atencion:</strong>{" "}
              {formatDateTimeForUi(ticketData.fechaAtencion)}
            </p>
            <p>
              <strong>Municipio:</strong> {ticketData.municipio}
            </p>
            <p>
              <strong>Asunto:</strong> {ticketData.asunto}
            </p>
            <p>
              <strong>Nivel educativo:</strong> {ticketData.nivelEducativo}
            </p>
            <p>
              <strong>Oficina regional:</strong> {ticketData.oficinaRegional}
            </p>
            <p>
              <strong>Telefono:</strong> {ticketData.telefono}
            </p>
            <p>
              <strong>Celular:</strong> {ticketData.celular}
            </p>
            <p>
              <strong>Correo:</strong> {ticketData.correo}
            </p>
          </div>
        </article>
      ) : null}
    </section>
  );
}
