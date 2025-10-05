import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import "../../styles/planiViewer.css";

export const PlanificacionViewer = () => {
  const location = useLocation();

  const token = location.state?.token || localStorage.getItem("token")?.trim();
  const user =
    location.state?.user ||
    JSON.parse(localStorage.getItem("usuario") || "null");

  useEffect(() => {
    if (location.state?.user) {
      localStorage.setItem("usuario", JSON.stringify(location.state.user));
    }
  }, [location.state?.user]);

  // Fecha inicial: hoy o la que viene del state
  const today = new Date();
  const initialFecha = location.state?.fecha || today.toISOString().split("T")[0];

  const [fecha, setFecha] = useState(initialFecha);
  const [planificacion, setPlanificacion] = useState(null);
  const [error, setError] = useState(null);

  const diasSemana = [
    { id: 1, nombre: "Lunes" },
    { id: 2, nombre: "Martes" },
    { id: 3, nombre: "Miércoles" },
    { id: 4, nombre: "Jueves" },
    { id: 5, nombre: "Viernes" },
    { id: 6, nombre: "Sábado" },
    { id: 7, nombre: "Domingo" },
  ];

  // ✅ Obtener número de semana ISO
  const getWeekNumber = (date) => {
    const d = new Date(date + "T12:00:00"); // hora neutra para evitar problemas de zona horaria
    d.setHours(0, 0, 0, 0);
    const dayNum = d.getDay() || 7; // Domingo = 7
    d.setDate(d.getDate() + 4 - dayNum);
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNum = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    return `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
  };

  // ✅ Obtener día según backend: 1 = lunes, 7 = domingo
  const getDiaBackend = (fecha) => {
    const d = new Date(fecha + "T12:00:00"); // hora neutra
    const day = d.getDay(); // 0 = domingo, 1 = lunes
    return day === 0 ? 7 : day;
  };

  const semana = getWeekNumber(fecha);
  const dia = getDiaBackend(fecha);

  // ✅ Cargar planificación cada vez que cambia la fecha
  useEffect(() => {
    const fetchPlanificacion = async () => {
      try {
        const headers = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const response = await fetch(
          `http://localhost:3001/api/planificacion?fecha=${fecha}&dia=${dia}`,
          { headers }
        );

        if (!response.ok) throw new Error("No se pudo cargar la planificación");

        const data = await response.json();
        if (data.plan) {
          setPlanificacion(data);
          setError(null);
        } else {
          setPlanificacion(null);
          setError(null);
        }
      } catch (err) {
        setError(err.message || "Error desconocido");
        setPlanificacion(null);
      }
    };

    fetchPlanificacion();
  }, [fecha, dia, token]);

  // ✅ Detecta links dentro del texto
  const renderContenido = (texto) => {
    if (!texto) return "Sin plan";
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const partes = texto.split(urlRegex);
    return partes.map((parte, i) =>
      urlRegex.test(parte) ? (
        <a
          key={i}
          href={parte}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "blue" }}
        >
          {parte}
        </a>
      ) : (
        <span key={i}>{parte}</span>
      )
    );
  };

  return (
    <div className="plani-viewer-container">
      <h2>Planificación semanal</h2>

      <label>
        Fecha:
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="plani-input"
        />
      </label>

      {error && <p className="plani-error">{error}</p>}

      {!error && planificacion && planificacion.plan ? (
        <div className="plan-content">
          <h3>
            {`Planificación para ${fecha} - ${
              diasSemana.find((d) => d.id === dia)?.nombre || ""
            }`}
          </h3>
          <ul>
            {Object.entries(planificacion.plan).map(([bloque, contenido]) => (
              <li key={bloque}>
                <strong>Bloque {bloque}:</strong> {renderContenido(contenido)}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        !error && <p>No hay planificación para esta fecha.</p>
      )}

      <div className="link-coach">
        <Link to="/usuarioPages" state={{ user: user || null }}>
          Volver a usuario
        </Link>
      </div>
    </div>
  );
};
