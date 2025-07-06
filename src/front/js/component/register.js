import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "../../styles/register.css";

export const Register = () => {
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Ejemplo simple validación para que contraseña coincida
    if (password !== repeatPassword) {
      Swal.fire({
        title: "Error",
        text: "Las contraseñas no coinciden",
        icon: "error",
        customClass: {
          popup: "swal-popup",
          title: "swal-title",
          content: "swal-content",
          confirmButton: "swal-button",
        },
        confirmButtonText: "Aceptar",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          last_name: lastName,
          email,
          password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        Swal.fire({
          title: "¡Éxito!",
          text: "Usuario creado con éxito",
          icon: "success",
          customClass: {
            popup: "swal-popup",
            title: "swal-title",
            content: "swal-content",
            confirmButton: "swal-button",
          },
          confirmButtonText: "Aceptar",
        }).then(() => {
          navigate("/usuarioPages");
        });
      } else {
        Swal.fire({
          title: "Error",
          text: data.error || data.message || "Error desconocido",
          icon: "error",
          customClass: {
            popup: "swal-popup",
            title: "swal-title",
            content: "swal-content",
            confirmButton: "swal-button",
          },
          confirmButtonText: "Aceptar",
        });
      }
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: "Error al conectar con el servidor",
        icon: "error",
        customClass: {
          popup: "swal-popup",
          title: "swal-title",
          content: "swal-content",
          confirmButton: "swal-button",
        },
        confirmButtonText: "Aceptar",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <h2>Crear cuenta</h2>
      <form onSubmit={handleSubmit} className="register-form">
        <input
          type="text"
          placeholder="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Apellido"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Contraseña (mín. 6 letras y números)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        <input
          type="password"
          placeholder="Repetir contraseña"
          value={repeatPassword}
          onChange={(e) => setRepeatPassword(e.target.value)}
          required
          minLength={6}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Registrando..." : "Registrarse"}
        </button>
      </form>
    </div>
  );
};
