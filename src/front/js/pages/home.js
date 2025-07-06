import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ForceTeamLogo from "../../img/ForceTeam.jpg";
import "../../styles/home.css";

export const Home = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        navigate("/usuarioPages");
      } else {
        alert("Error: " + (data.error || data.message));
      }
    } catch (error) {
      alert("Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleRedirectToRegister = () => {
    navigate("/register");
  };

  return (
    <div className="home-container">
      <div className="logo-wrapper">
        <img src={ForceTeamLogo} alt="logo" className="logo-image" />
      </div>

      <h2>Bienvenido a la planificación de Force Team</h2>

      <form
        className="home-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleLogin();
        }}
      >
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div className="button-group">
          <button type="submit" disabled={loading} className="login-button">
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={handleRedirectToRegister}
            disabled={loading}
            className="register-button"
          >
            Registrarse
          </button>
        </div>
      </form>
    </div>
  );
};
