import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "../../styles/planiViewer.css";

export const PlanificacionViewer = () => {
  const location = useLocation();

  // Traer token y posible planificación inicial desde location.state
  const token = location.state?.token || localStorage.getItem("token")?.trim();
  const initialSemana = location.state?.semana || "2025-W28";
  const initialDia = location.state?.dia || 1;

  const [semana, setSemana] = useState(initialSemana);
  const [dia, setDia] = useState(initialDia);
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
            headers: {
              Authorization: `Bearer ${token}`,
            },
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
          setError(null); // No es error, simplemente no hay plan
        }
      } catch (err) {
        setError(err.message || "Error desconocido");
        setPlanificacion(null);
      }
    };

    fetchPlanificacion();
  }, [token, semana, dia]);

  return (
    <div className="plani-viewer-container">
      <h2>Planificación semanal</h2>

      <label>
        Semana:
        <input
          type="week"
          value={semana}
          onChange={(e) => setSemana(e.target.value)}
          className="plani-input"
        />
      </label>

      <label>
        Día:
        <select
          value={dia}
          onChange={(e) => setDia(parseInt(e.target.value, 10))}
          className="plani-input"
        >
          {diasSemana.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nombre}
            </option>
          ))}
        </select>
      </label>

      {error && <p className="plani-error">{error}</p>}

      {!error && planificacion && planificacion.plan ? (
        <div className="plan-content">
          <h3>
            {`Planificación para ${semana} - ${
              diasSemana.find((d) => d.id === dia)?.nombre || ""
            }`}
          </h3>
          <ul>
            {Object.entries(planificacion.plan).map(([bloque, contenido]) => (
              <li key={bloque}>
                <strong>Bloque {bloque}:</strong> {contenido || "Sin plan"}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        !error && <p>No hay planificación para esta fecha.</p>
      )}
    </div>
  );
};
