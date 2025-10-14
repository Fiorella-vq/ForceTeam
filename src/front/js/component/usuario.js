import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "../../styles/usuario.css";

export const Usuario = ({ user, token, onUserUpdate }) => {
  const [logs, setLogs] = useState([]);
  const [fecha, setFecha] = useState("");
  const [ejercicio, setEjercicio] = useState("");
  const [peso, setPeso] = useState("");

  const [wods, setWods] = useState([]);
  const [wodDescripcion, setWodDescripcion] = useState("");
  const [wodComoRealizo, setWodComoRealizo] = useState("");
  const [wodSentimiento, setWodSentimiento] = useState("");

  const hoy = new Date().toISOString().split("T")[0];
  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoy);

  // -------------------- Fetch inicial --------------------
  useEffect(() => {
    if (!user || !token) return;

    const fetchData = async () => {
      try {
        const logsRes = await fetch(
          `http://localhost:3001/api/users/${user.id}/logs`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const logsData = await logsRes.json();
        setLogs(logsData);

        const wodsRes = await fetch(
          `http://localhost:3001/api/users/${user.id}/wods`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const wodsData = await wodsRes.json();
        setWods(wodsData);
      } catch (err) {
        console.error(err);
        Swal.fire("Error", "No se pudieron cargar los datos del usuario.", "error");
      }
    };

    fetchData();
  }, [user, token]);

  // -------------------- Funciones --------------------
  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  // --- Logs ---
  const agregarLog = async () => {
    if (!fecha.trim() || !ejercicio.trim()) return;
    const payload = { fecha, ejercicio, peso: peso ? Number(peso) : null };

    try {
      const res = await fetch(
        `http://localhost:3001/api/users/${user.id}/logs`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error("Error al guardar log");

      const nuevoLog = await res.json();
      setLogs([...logs, nuevoLog]);
      onUserUpdate({ ...user, logs: [...logs, nuevoLog] });

      setFecha("");
      setEjercicio("");
      setPeso("");
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "No se pudo agregar el log", "error");
    }
  };

  const eliminarLog = async (logId) => {
    try {
      const res = await fetch(
        `http://localhost:3001/api/users/${user.id}/logs/${logId}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Error al eliminar log");

      const nuevos = logs.filter((log) => log.id !== logId);
      setLogs(nuevos);
      onUserUpdate({ ...user, logs: nuevos });
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "No se pudo eliminar el log", "error");
    }
  };

  const editarLog = (log) => {
    setFecha(log.fecha);
    setEjercicio(log.ejercicio);
    setPeso(log.peso !== null ? log.peso : "");
    eliminarLog(log.id);
  };

  // --- WODs ---
  const guardarWodHoy = async () => {
    const wodActual = wods.find(
      (w) => (w.fecha?.split("T")[0] || w.fecha) === hoy
    );

    const payload = {
      wod_fecha: hoy,
      wod_descripcion: wodActual?.descripcion || "WOD del día",
      wod_como_realizo: wodComoRealizo.trim() || "No especificado",
      wod_sentimiento: wodSentimiento.trim() || "No especificado",
    };

    try {
      let res;
      if (wodActual) {
        res = await fetch(
          `http://localhost:3001/api/users/${user.id}/wods/${wodActual.id}`,
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
          `http://localhost:3001/api/users/${user.id}/wods`,
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
      setWodComoRealizo("");
      setWodSentimiento("");
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "No se pudo guardar el WOD", "error");
    }
  };

  const eliminarWod = async (wodId) => {
    try {
      const res = await fetch(
        `http://localhost:3001/api/users/${user.id}/wods/${wodId}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Error al eliminar WOD");

      const nuevos = wods.filter((wod) => wod.id !== wodId);
      setWods(nuevos);
      onUserUpdate({ ...user, wods: nuevos });
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "No se pudo eliminar el WOD", "error");
    }
  };

  const editarWod = (wod) => {
    setWodDescripcion(wod.descripcion);
    setWodComoRealizo(wod.como_realizo);
    setWodSentimiento(wod.sentimiento);
    setFechaSeleccionada(wod.fecha.split("T")[0] || wod.fecha);
    eliminarWod(wod.id);
  };

  // -------------------- Render --------------------
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

      {/* Logs */}
      <section className="entrenamientos-section">
        <h3>Control de Levantamientos</h3>
        <div className="inputs-entrenamientos">
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
          <input
            type="text"
            placeholder="Ejercicio"
            value={ejercicio}
            onChange={(e) => setEjercicio(e.target.value)}
          />
          <input
            type="text"
            placeholder="Peso (kg)"
            value={peso}
            onChange={(e) => {
              const value = e.target.value;
              if (/^\d*\.?\d*$/.test(value)) setPeso(value);
            }}
          />
          <button onClick={agregarLog}>Agregar</button>
        </div>

        <table className="tabla-entrenamientos">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Ejercicio</th>
              <th>Peso (kg)</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{log.fecha}</td>
                <td>{log.ejercicio}</td>
                <td>{log.peso !== null ? log.peso : "-"}</td>
                <td>
                  <button className="button-icon" onClick={() => editarLog(log)}>
                    <i className="fa-solid fa-pencil"></i>
                  </button>
                  <button className="button-icon" onClick={() => eliminarLog(log.id)}>
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* WODs */}
      <section className="wods-section">
        <h3>Registro de WODs</h3>

        <div className="inputs-wods">
          {user.role !== "admin" && <h4>WOD de hoy ({hoy})</h4>}
          {user.role === "admin" && (
            <>
              <input
                type="date"
                value={fechaSeleccionada}
                onChange={(e) => setFechaSeleccionada(e.target.value)}
              />
              <textarea
                placeholder="Descripción del WOD"
                value={wodDescripcion}
                onChange={(e) => setWodDescripcion(e.target.value)}
                rows={3}
              />
            </>
          )}
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

        {/* WOD histórico con SweetAlert2 */}
        <div className="wod-por-fecha inputs-wods">
          <label>
            Fecha WOD histórico:
            <input
              type="date"
              value={fechaSeleccionada}
              onChange={(e) => {
                const nuevaFecha = e.target.value;
                setFechaSeleccionada(nuevaFecha);

                const wod = wods.find(
                  (w) => (w.fecha?.split("T")[0] || w.fecha) === nuevaFecha
                );

                if (wod) {
                  Swal.fire({
                    title: `WOD del ${wod.fecha.split("T")[0]}`,
                    html: `
                      <div style="text-align:left; color:#eee;">
                        <p><strong>🏋️ Descripción:</strong> ${wod.descripcion}</p>
                        <p><strong>🔥 Cómo lo realizaste:</strong> ${wod.como_realizo || "-"}</p>
                        <p><strong>❤️ Sentimiento:</strong> ${wod.sentimiento || "-"}</p>
                      </div>
                    `,
                    background: "#1e1e1e",
                    color: "#fff",
                    confirmButtonText: "Cerrar",
                    confirmButtonColor: "#d33",
                    width: "500px",
                  });
                } else {
                  Swal.fire({
                    title: "Sin registro",
                    text: "No hay WOD guardado para esta fecha.",
                    icon: "info",
                    background: "#1e1e1e",
                    color: "#fff",
                    confirmButtonColor: "#3085d6",
                  });
                }
              }}
            />
          </label>
        </div>

        {/* Lista de WODs */}
        <ul className="lista-wods">
          {wods.map((wod) => (
            <li key={wod.id}>
              <strong>{wod.fecha}</strong> - {wod.descripcion} <br />
              Cómo: {wod.como_realizo || "-"} <br />
              Sentimiento: {wod.sentimiento || "-"} <br />
              {user.role === "admin" && (
                <>
                  <button className="button-icon" onClick={() => editarWod(wod)}>
                    <i className="fa-solid fa-pencil"></i>
                  </button>
                  <button className="button-icon" onClick={() => eliminarWod(wod.id)}>
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
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
