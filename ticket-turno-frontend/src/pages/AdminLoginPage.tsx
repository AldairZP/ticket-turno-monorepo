import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { FormInput } from "../components/FormInput";
import { SectionHeader } from "../components/SectionHeader";
import { getAdminCaptcha, loginAdmin } from "../services/adminApi";
import { extractApiErrorMessage } from "../services/httpClient";
import { useAuth } from "../context/AuthContext";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaPrompt, setCaptchaPrompt] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [isLoadingCaptcha, setIsLoadingCaptcha] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshCaptcha = async () => {
    setIsLoadingCaptcha(true);
    setErrorMessage(null);

    try {
      const captcha = await getAdminCaptcha();
      setCaptchaToken(captcha.captchaToken);
      setCaptchaPrompt(captcha.prompt);
      setCaptchaAnswer("");
    } catch (error) {
      setErrorMessage(extractApiErrorMessage(error));
    } finally {
      setIsLoadingCaptcha(false);
    }
  };

  useEffect(() => {
    void refreshCaptcha();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!event.currentTarget.checkValidity()) {
      event.currentTarget.reportValidity();
      return;
    }

    if (isLoadingCaptcha || !captchaToken.trim()) {
      setErrorMessage(
        "Primero genera un captcha valido antes de intentar iniciar sesión.",
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await loginAdmin({
        username: username.trim(),
        password,
        captchaToken,
        captchaAnswer: captchaAnswer.trim(),
      });

      login(response.accessToken);
      navigate("/admin/dashboard", { replace: true });
    } catch (error) {
      setErrorMessage(extractApiErrorMessage(error));
      await refreshCaptcha();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="panel" aria-labelledby="admin-login-title">
      <div className="intro">
        <p className="intro-step">Acceso privado</p>
        <h2 id="admin-login-title">Login de Administrador</h2>
        <div className="intro-rule" aria-hidden />
      </div>

      <form className="ticket-form" onSubmit={handleSubmit}>
        <section className="group" aria-labelledby="credentials-title">
          <SectionHeader
            id="credentials-title"
            icon="admin_panel_settings"
            title="Credenciales de acceso"
          />
          <div className="grid grid-2">
            <FormInput
              id="admin-username"
              label="Usuario"
              value={username}
              onChange={setUsername}
              required
              maxLength={80}
            />
            <FormInput
              id="admin-password"
              label="Contraseña"
              type="password"
              value={password}
              onChange={setPassword}
              required
              maxLength={256}
            />
          </div>
        </section>

        <section
          className="group group-emphasis"
          aria-labelledby="captcha-title"
        >
          <SectionHeader id="captcha-title" icon="verified" title="Captcha" />
          <p className="muted">
            {captchaPrompt ||
              "No hay captcha disponible. Usa el botón para generar un nuevo reto."}
          </p>
          <p className="muted">
            El captcha expira rápido y solo se puede usar una vez.
          </p>
          <div className="grid grid-2">
            <FormInput
              id="captcha-answer"
              label="Respuesta captcha"
              value={captchaAnswer}
              onChange={setCaptchaAnswer}
              required
              maxLength={20}
              pattern="^-?[0-9]+$"
              title="Ingresa solo números como respuesta del captcha."
            />
            <div className="field">
              <label className="field-label" htmlFor="captcha-token">
                Token de captcha
              </label>
              <input
                id="captcha-token"
                className="field-control"
                value={captchaToken}
                readOnly
              />
            </div>
          </div>
          <div className="button-row">
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                void refreshCaptcha();
              }}
              disabled={isLoadingCaptcha}
            >
              {isLoadingCaptcha ? "Generando..." : "Nuevo captcha"}
            </button>
          </div>
        </section>

        <div className="actions">
          <button
            className="primary-button"
            type="submit"
            disabled={isSubmitting || isLoadingCaptcha || !captchaToken.trim()}
          >
            {isSubmitting ? "Ingresando..." : "Iniciar sesión"}
            <span className="material-symbols-outlined" aria-hidden>
              login
            </span>
          </button>
          {errorMessage ? (
            <p className="feedback feedback-error">{errorMessage}</p>
          ) : null}
        </div>
      </form>
    </section>
  );
}
