import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ForceTeamLogo from "../../img/ForceTe.png";
import "../../styles/home.css";

export const Home = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const isMounted = useRef(true);

  // ✅ Al montar, si hay email guardado, lo cargamos
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }

    return () => {
      isMounted.current = false;
    };
  }, []);

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

        // ✅ Guardar o eliminar el email según el estado de "Recordarme"
        if (rememberMe) {
          localStorage.setItem("rememberedEmail", email);
        } else {
          localStorage.removeItem("rememberedEmail");
        }

        if (isMounted.current) navigate("/usuarioPages");
      } else {
        if (isMounted.current) alert("Error: " + (data.error || data.message));
      }
    } catch (error) {
      if (isMounted.current) alert("Error al conectar con el servidor");
    } finally {
      if (isMounted.current) setLoading(false);
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
      <h2>Planificación Tincho Soria</h2>
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

        <div className="password-container">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <i
            className={`fa ${showPassword ? "fa-eye-slash" : "fa-eye"} toggle-password`}
            onClick={() => setShowPassword(!showPassword)}
          ></i>
        </div>

        {/* ✅ Checkbox Recordarme */}
        <div className="remember-me">
          <label>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={() => setRememberMe(!rememberMe)}
            />{" "}
            Recordarme
          </label>
        </div>

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
