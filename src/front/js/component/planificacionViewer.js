import React, { useState, useEffect } from "react";

export const PlanificacionViewer = ({ token }) => {
  const [semana, setSemana] = useState("2025-W28"); 
  const [dia, setDia] = useState(1);
  const [planificacion, setPlanificacion] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;

    const fetchPlanificacion = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/api/planificacion?semana=${semana}&dia=${dia}`,
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
        setPlanificacion(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        setPlanificacion(null);
      }
    };

    fetchPlanificacion();
  }, [token, semana, dia]);

  const diasSemana = [
    { id: 1, nombre: "Lunes" },
    { id: 2, nombre: "Martes" },
    { id: 3, nombre: "Miércoles" },
    { id: 4, nombre: "Jueves" },
    { id: 5, nombre: "Viernes" },
    { id: 6, nombre: "Sábado" },
    { id: 7, nombre: "Domingo" },
  ];

  return (
    <div>
      <h2>Planificación semanal</h2>

      <label>
        Semana:
        <input
          type="week"
          value={semana}
          onChange={(e) => setSemana(e.target.value)}
        />
      </label>

      <label>
        Día:
        <select value={dia} onChange={(e) => setDia(parseInt(e.target.value))}>
          {diasSemana.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nombre}
            </option>
          ))}
        </select>
      </label>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {!error && planificacion && planificacion.plan ? (
        <div style={{ marginTop: "1rem", border: "1px solid #ddd", padding: "1rem" }}>
          <h3>{`Planificación para ${semana} - ${diasSemana.find(d => d.id === dia)?.nombre}`}</h3>
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
