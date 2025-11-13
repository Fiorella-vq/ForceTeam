import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "../../styles/usuario.css";

export const Usuario = ({ user, token, onUserUpdate }) => {
  const [logs, setLogs] = useState([]);
  const [wods, setWods] = useState([]);

  const [wodDescripcion, setWodDescripcion] = useState("");
  const [wodComoRealizo, setWodComoRealizo] = useState("");
  const [wodSentimiento, setWodSentimiento] = useState("");

  const hoy = new Date().toISOString().split("T")[0];
  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoy);

  const ejerciciosDisponibles = [
    "Push jerk",
    "Bench press",
    "Deadlift",
    "Clean",
    "Snatch",
    "Clean & Jerk",
  ];

  const [pesos, setPesos] = useState(
    ejerciciosDisponibles.reduce((acc, ej) => {
      acc[ej] = "";
      return acc;
    }, {})
  );

  useEffect(() => {
    if (!user || !token) return;

    const fetchData = async () => {
      try {
        const logsRes = await fetch(
          `https://forceteam.onrender.com/api/users/${user.id}/logs`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const logsData = await logsRes.json();
        setLogs(logsData);

        const wodsRes = await fetch(
          `https://forceteam.onrender.com/api/users/${user.id}/wods`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const wodsData = await wodsRes.json();
        setWods(wodsData);
      } catch (err) {
        console.error(err);
        Swal.fire("Error", "No se pudieron cargar los datos.", "error");
      }
    };

    fetchData();
  }, [user, token]);

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  // Calcular porcentajes del peso máximo
  const calcularPorcentajes = (peso) => {
    if (!peso || isNaN(peso)) return {};
    const porcentajes = [45, 55, 65, 70, 80, 85, 90, 95];
    return porcentajes.reduce((acc, p) => {
      acc[p] = Math.round((peso * p) / 100);
      return acc;
    }, {});
  };

  // ✅ Calcular Squats estimados con fórmulas olímpicas reales
  const calcularSquats = () => {
    const cleanJerk = parseFloat(pesos["Clean & Jerk"]);
    const snatch = parseFloat(pesos["Snatch"]);

    if (!cleanJerk || !snatch) return {};

    const totalOlimpico = cleanJerk + snatch;
    const backSquatOlimpico = Math.round(totalOlimpico * 0.73);
    const frontSquatOlimpico = Math.round(backSquatOlimpico * 0.85);

    return {
      totalOlimpico,
      backSquatOlimpico,
      frontSquatOlimpico,
    };
  };

  // --- WODs ---
  const guardarWodHoy = async () => {
    const wodActual = wods.find(
      (w) => (w.fecha?.split("T")[0] || w.fecha) === hoy
    );

    const payload = {
      wod_fecha: hoy,
      wod_descripcion: wodDescripcion.trim() || "WOD del día",
      wod_como_realizo: wodComoRealizo.trim() || "No especificado",
      wod_sentimiento: wodSentimiento.trim() || "No especificado",
    };

    try {
      let res;
      if (wodActual) {
        res = await fetch(
          `https://forceteam.onrender.com/api/users/${user.id}/wods/${wodActual.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          }
        );
      } else {
        res = await fetch(
          `https://forceteam.onrender.com/api/users/${user.id}/wods`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          }
        );
      }

      if (!res.ok) throw new Error("Error al guardar WOD");
      const nuevoWod = await res.json();
      setWods([...wods.filter((w) => w.id !== nuevoWod.id), nuevoWod]);
      setWodDescripcion("");
      setWodComoRealizo("");
      setWodSentimiento("");
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "No se pudo guardar el WOD", "error");
    }
  };

  const squats = calcularSquats();

  return (
    <div className="usuario-container">
      <div className="usuario-header">
        <h2>
          Atleta: {user.name} {user.last_name}
        </h2>
        <button className="logout-btn" onClick={cerrarSesion}>
          Cerrar sesión
        </button>
      </div>

      {/* Tabla de levantamientos */}
      <section className="entrenamientos-section">
        <h3>Porcentajes de levantamientos</h3>
        <table className="tabla-porcentajes">
          <thead>
            <tr>
              <th>Ejercicio</th>
              <th>Peso Máximo (kg)</th>
              <th>45%</th>
              <th>55%</th>
              <th>65%</th>
              <th>70%</th>
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
                <tr key={ej}>
                  <td>{ej}</td>
                  <td>
                    <input
                      type="text"
                      value={peso}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^\d*\.?\d*$/.test(val)) {
                          setPesos({ ...pesos, [ej]: val });
                        }
                      }}
                      placeholder="Máx"
                      className="input-peso"
                    />
                  </td>
                  {[45, 55, 65, 70, 80, 85, 90, 95].map((p) => (
                    <td key={p}>{porcentajes[p] || "-"}</td>
                  ))}
                </tr>
              );
            })}

            {squats.totalOlimpico && (
              <>
                {/* <tr className="fila-calculo">
            <td>Total Olímpico 💡</td>
            <td>{squats.totalOlimpico}</td>
            {[45, 55, 65, 70, 80, 85, 90, 95].map((p) => (
              <td key={p}>
                {Math.round((squats.totalOlimpico * p) / 100) || "-"}
              </td>
            ))}
          </tr> */}
                <tr className="fila-calculo">
                  <td>Back Squat Olímpico </td>
                  <td>{squats.backSquatOlimpico}</td>
                  {[45, 55, 65, 70, 80, 85, 90, 95].map((p) => (
                    <td key={p}>
                      {Math.round((squats.backSquatOlimpico * p) / 100) || "-"}
                    </td>
                  ))}
                </tr>

                <tr className="fila-calculo">
                  <td>Front Squat Olímpico </td>
                  <td>{squats.frontSquatOlimpico}</td>
                  {[45, 55, 65, 70, 80, 85, 90, 95].map((p) => (
                    <td key={p}>
                      {Math.round((squats.frontSquatOlimpico * p) / 100) || "-"}
                    </td>
                  ))}
                </tr>
              </>
            )}
          </tbody>
        </table>
      </section>

      {/* WODs */}
      <section className="wods-section">
        <h3>Registro de WODs</h3>
        <div className="inputs-wods">
          {user.role !== "admin" && <h4>WOD de hoy ({hoy})</h4>}
          <textarea
            placeholder="Descripción del WOD"
            value={wodDescripcion}
            onChange={(e) => setWodDescripcion(e.target.value)}
            rows={3}
          />
          <textarea
            placeholder="Cómo realizaste el WOD"
            value={wodComoRealizo}
            onChange={(e) => setWodComoRealizo(e.target.value)}
            rows={2}
          />
          <textarea
            placeholder="Cómo te sentiste / Lograste el objetivo?"
            value={wodSentimiento}
            onChange={(e) => setWodSentimiento(e.target.value)}
            rows={2}
          />
          <button onClick={guardarWodHoy}>Guardar WOD</button>
        </div>
      </section>

      {/* Botones de planificaciones */}
      <section className="link-coach">
        {user.role === "admin" ? (
          <button
            className="link-btn"
            onClick={() => (window.location.href = "/planificaCoach")}
          >
            Agregar planificaciones
          </button>
        ) : (
          <button
            className="link-btn"
            onClick={() => (window.location.href = "/planificacionViewer")}
          >
            Ir a planificaciones
          </button>
        )}
      </section>
    </div>
  );
};
