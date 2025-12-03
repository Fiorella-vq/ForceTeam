import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../styles/planiViewer.css";

const BACKEND = process.env.BACKEND_URL || "https://forceteam.onrender.com/api";

export const PlanificacionViewer = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const token = location.state?.token || localStorage.getItem("token")?.trim();
  const user =
    location.state?.user ||
    JSON.parse(localStorage.getItem("usuario") || "null");

  const [pesos, setPesos] = useState({});
  const [ejercicioSeleccionado, setEjercicioSeleccionado] = useState(null);

  const ejerciciosDisponibles = [
    "Push jerk",
    "Bench press",
    "Deadlift",
    "Clean",
    "Hang Power Clean",
    "Hang Squat Clean",
    "Snatch",
    "Hang Power Snatch",
    "Hang Squat Snatch",
    "Clean & Jerk",
  ];

  useEffect(() => {
    if (!user?.id || !token) return;

    const controller = new AbortController();

    const fetchPesos = async () => {
      try {
        const res = await fetch(`${BACKEND}/users/${user.id}/pesos`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        const data = await res.json();
        setPesos(data || {});
      } catch (err) {
        if (err.name !== "AbortError") console.error(err);
      }
    };

    fetchPesos();
    return () => controller.abort();
  }, [user?.id, token]);

  const guardarPeso = async (ejercicio, valor) => {
    try {
      await fetch(`${BACKEND}/users/${user.id}/pesos`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ejercicio, valor }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!user?.id || !token) return;

    const timer = setTimeout(() => {
      Object.entries(pesos).forEach(([ej, val]) => {
        if (val !== "" && !isNaN(val)) {
          guardarPeso(ej, parseFloat(val));
        }
      });
    }, 700);

    return () => clearTimeout(timer);
  }, [pesos, user, token]);

  const calcularPorcentajes = (peso) => {
    if (!peso || isNaN(peso)) return {};
    const porcents = [45, 55, 65, 70, 75, 80, 85, 90, 95];

    return porcents.reduce((acc, p) => {
      acc[p] = Math.round((peso * p) / 100);
      return acc;
    }, {});
  };

  const calcularSquats = () => {
    const cj = parseFloat(pesos["Clean & Jerk"]);
    const sn = parseFloat(pesos["Snatch"]);
    if (!cj || !sn) return {};

    const total = cj + sn;
    const back = Math.round(total * 0.73);
    const front = Math.round(back * 0.85);

    return {
      totalOlimpico: total,
      backSquatOlimpico: back,
      frontSquatOlimpico: front,
    };
  };

  const squats = calcularSquats();

  const today = new Date();
  const initialFecha =
    location.state?.fecha || today.toISOString().split("T")[0];
  const [fecha, setFecha] = useState(initialFecha);
  const [tipo, setTipo] = useState("normal");

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

  useEffect(() => {
    const controller = new AbortController();

    const fetchPlanificacion = async () => {
      try {
        const headers = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const response = await fetch(
          `${BACKEND}/planificacion?fecha=${fecha}&tipo=${tipo}`,
          { headers, signal: controller.signal }
        );

        if (!response.ok) throw new Error("No se pudo cargar la planificación");

        const data = await response.json();
        setPlanificacion(data.plan ? data : null);
        setError(null);
      } catch (err) {
        if (err.name === "AbortError") return;
        setError(err.message || "Error desconocido");
        setPlanificacion(null);
      }
    };

    fetchPlanificacion();
    return () => controller.abort();
  }, [fecha, tipo, token]);

  return (
    <div className="plani-viewer-container">
      <h2>Planificación semanal ({tipo})</h2>

      <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="plani-input"
        />

        <button
          className="link-btn"
          onClick={() => setTipo(tipo === "normal" ? "corta" : "normal")}
        >
          {tipo === "normal"
            ? "Ver planificación corta"
            : "Ver planificación normal"}
        </button>
      </div>

      <section className="tabla-porcentajes-card">
        <h3>Porcentajes de levantamientos</h3>

        <table className="tabla-porcentajes">
          <thead>
            <tr>
              <th>Ejercicio</th>
              <th>Peso Máx</th>
              <th>45%</th>
              <th>55%</th>
              <th>65%</th>
              <th>70%</th>
              <th>75%</th>
              <th>80%</th>
              <th>85%</th>
              <th>90%</th>
              <th>95%</th>
            </tr>
          </thead>

          <tbody>
            {ejerciciosDisponibles.map((ej) => {
              const peso = pesos[ej];
              const porcentajes = calcularPorcentajes(peso);

              return (
                <tr
                  key={ej}
                  className={
                    ej === ejercicioSeleccionado ? "fila-seleccionada" : ""
                  }
                  onClick={() => setEjercicioSeleccionado(ej)}
                  style={{ cursor: "pointer" }}
                >
                  <td>{ej}</td>

                  <td>
                    <input
                      type="text"
                      value={peso || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^\d*\.?\d*$/.test(val))
                          setPesos((prev) => ({ ...prev, [ej]: val }));
                      }}
                      placeholder="Máx"
                      className="input-peso"
                    />
                  </td>

                  {[45, 55, 65, 70, 75, 80, 85, 90, 95].map((p) => (
                    <td key={p}>{porcentajes[p] || "-"}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

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
