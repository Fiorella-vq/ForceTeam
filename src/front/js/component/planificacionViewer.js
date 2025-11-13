import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../styles/planiViewer.css";

export const PlanificacionViewer = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const token = location.state?.token || localStorage.getItem("token")?.trim();
  const user =
    location.state?.user ||
    JSON.parse(localStorage.getItem("usuario") || "null");

  useEffect(() => {
    if (location.state?.user) {
      localStorage.setItem("usuario", JSON.stringify(location.state.user));
    }
  }, [location.state?.user]);

  const today = new Date();
  const initialFecha =
    location.state?.fecha || today.toISOString().split("T")[0];
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
  ];

  const renderContenido = (texto) => {
    if (!texto) return "Sin plan";

    const urlRegex = /(https?:\/\/[^\s]+)/g;

    const partes = texto.split(urlRegex);

    return partes.map((parte, i) => {
      if (urlRegex.test(parte)) {
        return (
          <a
            key={i}
            href={parte}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#4fa3ff" }}
          >
            {parte}
          </a>
        );
      } else {
        return parte.split("\n").map((linea, j) => (
          <React.Fragment key={`${i}-${j}`}>
            {linea}
            <br />
          </React.Fragment>
        ));
      }
    });
  };

  useEffect(() => {
    const fetchPlanificacion = async () => {
      try {
        const headers = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const response = await fetch(
          `http://localhost:3001/api/planificacion?fecha=${fecha}`,
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
  }, [fecha, token]);

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
              diasSemana.find((d) => d.id === planificacion.dia)?.nombre || ""
            }`}
          </h3>
          <ul>
            {Object.entries(planificacion.plan).map(([bloque, contenido]) => (
              <li key={bloque}>
                <strong>Bloque {bloque}:</strong>
                <div className="bloque-texto">{renderContenido(contenido)}</div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        !error && <p>No hay planificación para esta fecha.</p>
      )}

      <div className="link-coach">
        <button
          className="link-btn"
          onClick={() => navigate("/usuarioPages", { state: { user } })}
        >
          Volver a usuario
        </button>
      </div>
    </div>
  );
};
