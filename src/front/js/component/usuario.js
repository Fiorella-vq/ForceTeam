import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "../../styles/usuario.css";

export const Usuario = ({ user, token }) => {
  const [logs, setLogs] = useState([]);
  const [wods, setWods] = useState([]);
  const [wodDescripcion, setWodDescripcion] = useState("");
  const [wodComoRealizo, setWodComoRealizo] = useState("");
  const [wodSentimiento, setWodSentimiento] = useState("");
  const hoy = new Date().toISOString().split("T")[0];

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

  const [editandoWod, setEditandoWod] = useState(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoy);

  // ❗ NECESARIO: eliminar un WOD
  const eliminarWod = async (id) => {
    try {
      const res = await fetch(
        `http://localhost:3001/api/users/${user.id}/wods/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error();

      setWods((prev) => prev.filter((w) => w.id !== id));

      Swal.fire("Eliminado", "El WOD fue eliminado.", "success");
    } catch (err) {
      Swal.fire("Error", "No se pudo eliminar el WOD.", "error");
    }
  };

  // ---- CARGAR DATOS ----
  useEffect(() => {
    if (!user || !token) return;

    const fetchData = async () => {
      try {
        const [logsRes, wodsRes, pesosRes] = await Promise.all([
          fetch(`http://localhost:3001/api/users/${user.id}/logs`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`http://localhost:3001/api/users/${user.id}/wods`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`http://localhost:3001/api/users/${user.id}/pesos`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setLogs(await logsRes.json());
        setWods(await wodsRes.json());
        const pesosData = await pesosRes.json();
        if (pesosData && typeof pesosData === "object") setPesos(pesosData);
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

  // ---- PESOS ----
  const guardarPeso = async (ejercicio, valor) => {
    try {
      await fetch(`http://localhost:3001/api/users/${user.id}/pesos`, {
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
    const timer = setTimeout(() => {
      ejerciciosDisponibles.forEach((ej) => {
        const val = pesos[ej];
        if (val !== "" && !isNaN(val)) guardarPeso(ej, parseFloat(val));
      });
    }, 700);
    return () => clearTimeout(timer);
  }, [pesos]);

  const calcularPorcentajes = (peso) => {
    if (!peso || isNaN(peso)) return {};
    const porcentajes = [45, 55, 65, 70, 80, 85, 90, 95];
    return porcentajes.reduce((acc, p) => {
      acc[p] = Math.round((peso * p) / 100);
      return acc;
    }, {});
  };

  const calcularSquats = () => {
    const cleanJerk = parseFloat(pesos["Clean & Jerk"]);
    const snatch = parseFloat(pesos["Snatch"]);
    if (!cleanJerk || !snatch) return {};
    const totalOlimpico = cleanJerk + snatch;
    const backSquatOlimpico = Math.round(totalOlimpico * 0.73);
    const frontSquatOlimpico = Math.round(backSquatOlimpico * 0.85);
    return { totalOlimpico, backSquatOlimpico, frontSquatOlimpico };
  };

  const wodDeHoy = wods.find(
    (w) => (w.fecha?.split("T")[0] || w.fecha) === hoy
  );

  const guardarWodHoy = async () => {
    const payload = {
      wod_fecha: hoy,
      wod_descripcion: wodDescripcion.trim() || "WOD del día",
      wod_como_realizo: wodComoRealizo.trim() || "No especificado",
      wod_sentimiento: wodSentimiento.trim() || "No especificado",
    };

    try {
      let res;

      if (wodDeHoy) {
        res = await fetch(
          `http://localhost:3001/api/users/${user.id}/wods/${wodDeHoy.id}`,
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
        res = await fetch(`http://localhost:3001/api/users/${user.id}/wods`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) throw new Error();

      const nuevoWod = await res.json();

      setWods((prev) => {
        const sinHoy = prev.filter(
          (w) => (w.fecha?.split("T")[0] || w.fecha) !== hoy
        );
        return [...sinHoy, nuevoWod];
      });

      setWodDescripcion("");
      setWodComoRealizo("");
      setWodSentimiento("");

      Swal.fire("Guardado", "Tu WOD fue registrado correctamente.", "success");
    } catch (err) {
      Swal.fire("Error", "No se pudo guardar el WOD", "error");
    }
  };

  // ---- EDITAR WOD ----
  const guardarEdicionWod = async (wod) => {
    try {
      const res = await fetch(
        `http://localhost:3001/api/users/${user.id}/wods/${wod.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            wod_descripcion: wod.wod_descripcion,
            wod_como_realizo: wod.wod_como_realizo,
            wod_sentimiento: wod.wod_sentimiento,
          }),
        }
      );

      if (!res.ok) throw new Error();

      const updated = await res.json();
      setWods((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));

      setEditandoWod(null);
      Swal.fire("Actualizado", "El WOD fue editado correctamente.", "success");
    } catch (err) {
      Swal.fire("Error", "No se pudo actualizar el WOD.", "error");
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

      {/* ---- PESOS ---- */}
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
                        if (/^\d*\.?\d*$/.test(val))
                          setPesos((prev) => ({ ...prev, [ej]: val }));
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
                <tr className="fila-calculo">
                  <td>Back Squat Olímpico</td>
                  <td>{squats.backSquatOlimpico}</td>
                  {[45, 55, 65, 70, 80, 85, 90, 95].map((p) => (
                    <td key={p}>
                      {Math.round((squats.backSquatOlimpico * p) / 100) || "-"}
                    </td>
                  ))}
                </tr>

                <tr className="fila-calculo">
                  <td>Front Squat Olímpico</td>
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

      {/* ---- WODS ---- */}
      <section className="wods-section">
        <h3>Registro de WODs</h3>

        <div className="inputs-wods">
          <h4>WOD de hoy ({hoy})</h4>

          <textarea
            placeholder="Descripción del WOD"
            value={wodDescripcion}
            onChange={(e) => setWodDescripcion(e.target.value)}
          />

          <textarea
            placeholder="Cómo realizaste el WOD"
            value={wodComoRealizo}
            onChange={(e) => setWodComoRealizo(e.target.value)}
          />

          <textarea
            placeholder="Cómo te sentiste / Lograste el objetivo?"
            value={wodSentimiento}
            onChange={(e) => setWodSentimiento(e.target.value)}
          />

          <button onClick={guardarWodHoy}>Guardar WOD</button>
        </div>
        <div className="wod-por-fecha">
          <label>
            Consultar WOD por fecha:
            <input
              type="date"
              className="input-date-dark"
              value={fechaSeleccionada}
              onChange={(e) => {
                const nuevaFecha = e.target.value;
                setFechaSeleccionada(nuevaFecha);
                const wod = wods.find(
                  (w) => (w.fecha?.split("T")[0] || w.fecha) === nuevaFecha
                );
                if (wod) {
                  Swal.fire({
                    title: `WOD del ${wod.fecha}`,
                    html: `
              <p><strong>🏋️ Descripción:</strong> ${wod.descripcion}</p>
              <p><strong>🔥 Cómo lo realizaste:</strong> ${
                wod.como_realizo || "-"
              }</p>
              <p><strong>❤️ Sentimiento:</strong> ${wod.sentimiento || "-"}</p>
            `,
                    background: "#1e1e1e",
                    color: "#fff",
                  });
                } else {
                  Swal.fire({
                    title: "Sin registro",
                    text: "No hay WOD guardado para esta fecha.",
                    icon: "info",
                    background: "#1e1e1e",
                    color: "#fff",
                  });
                }
              }}
            />
          </label>
        </div>

        <ul className="lista-wods">
          {wods
            .filter((w) => (w.fecha?.split("T")[0] || w.fecha) === hoy)
            .slice(0, 1)
            .map((wod) => (
              <li key={wod.id}>
                <strong>{wod.fecha}</strong> <br />
                <p>
                  <strong>🏋️ Descripción:</strong> {wod.wod_descripcion}
                </p>
                <p>
                  <strong>🔥 Cómo lo realizaste:</strong>{" "}
                  {wod.wod_como_realizo || "-"}
                </p>
                <p>
                  <strong>❤️ Sentimiento:</strong> {wod.wod_sentimiento || "-"}
                </p>
              </li>
            ))}
        </ul>
      </section>
      {/* ---- BOTONES DE PLANIFICACIÓN ---- */}
      <div className="link-planificacion">
        <button
          className="link-btn"
          onClick={() => (window.location.href = "/planificacionViewer")}
        >
          Ver Planificación
        </button>

        {user.role === "admin" && (
          <button
            className="link-btn"
            onClick={() => (window.location.href = "/planificacoach")}
          >
            Agregar Planificación
          </button>
        )}
      </div>
    </div>
  );
};
