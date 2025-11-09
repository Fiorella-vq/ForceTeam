import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import ForceTeamLogo from "../../img/ForceTe.png";
import "../../styles/home.css";

export const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  
  const token = searchParams.get("token");

  const handleSubmit = async (e) => {
    e.preventDefault();

  
    if (!password || !confirmPassword) {
      return Swal.fire("Error", "Por favor completa ambos campos", "warning");
    }

    if (password !== confirmPassword) {
      return Swal.fire("Error", "Las contraseñas no coinciden", "error");
    }

    if (!token) {
      return Swal.fire("Error", "Token inválido o faltante", "error");
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: password }),
      });

      const data = await res.json();
      if (res.ok) {
        await Swal.fire(
          "¡Éxito!",
          "Tu contraseña fue restablecida correctamente.",
          "success"
        );
        navigate("/");
      } else {
        Swal.fire("Error", data.error || "Error al restablecer la contraseña", "error");
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
      <h2>Restablecer contraseña</h2>

      <form className="home-form" onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Nueva contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirmar contraseña"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <div className="button-group">
          <button type="submit" disabled={loading} className="login-button">
            {loading ? "Guardando..." : "Guardar contraseña"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="register-button"
          >
            Volver al inicio
          </button>
        </div>
      </form>
    </div>
  );
};
