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

  // Fecha inicial: hoy
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

  // Función para obtener número de semana a partir de una fecha
  const getWeekNumber = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const dayNum = d.getDay() || 7; // Domingo = 7
    d.setDate(d.getDate() + 4 - dayNum);
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNum = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    return `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
  };

  // Calcular semana y día según fecha
  const semana = getWeekNumber(fecha);
  const dia = new Date(fecha).getDay() === 0 ? 7 : new Date(fecha).getDay();

  useEffect(() => {
    if (!token) {
      setPlanificacion(null);
      setError("Token no proporcionado");
      return;
    }

    const fetchPlanificacion = async () => {
      try {
        const response = await fetch(
          `http://localhost:3001/api/planificacion?semana=${semana}&dia=${dia}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.ok) {
          throw new Error("No se pudo cargar la planificación");
        }

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
  }, [token, semana, dia]);

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
