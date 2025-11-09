import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import ForceTeamLogo from "../../img/ForceTe.png";
import "../../styles/home.css";

export const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      return Swal.fire("Error", "Por favor ingresa tu email", "warning");
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.ok) {
        await Swal.fire(
          "¡Éxito!",
          "Se envió un correo con las instrucciones para recuperar tu contraseña.",
          "success"
        );
        navigate("/");
      } else {
        Swal.fire("Error", data.error || "No se pudo enviar el correo", "error");
      }
    } catch {
      Swal.fire("Error", "No se pudo conectar con el servidor", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-container">
      <div className="logo-wrapper">
        <img src={ForceTeamLogo} alt="logo" className="logo-image" />
      </div>
      <h2>Recuperar contraseña</h2>

      <form className="home-form" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Ingresá tu email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <div className="button-group">
          <button type="submit" disabled={loading} className="login-button">
            {loading ? "Enviando..." : "Enviar correo"}
          </button>
          <button type="button" onClick={() => navigate("/")} className="register-button">
            Volver al inicio
          </button>
        </div>
      </form>
    </div>
  );
};
