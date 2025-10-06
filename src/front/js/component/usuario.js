import React, { useState, useEffect } from "react";
import "../../styles/usuario.css";

export const Usuario = ({ user, onUserUpdate }) => {
  const [logs, setLogs] = useState(user?.logs || []);
  const [fecha, setFecha] = useState("");
  const [ejercicio, setEjercicio] = useState("");
  const [peso, setPeso] = useState("");

  const [wods, setWods] = useState(user?.wods || []);
  const [wodFecha, setWodFecha] = useState("");
  const [wodDescripcion, setWodDescripcion] = useState("");
  const [wodComoRealizo, setWodComoRealizo] = useState("");
  const [wodSentimiento, setWodSentimiento] = useState("");

  useEffect(() => {
    if (!user) return;
    onUserUpdate({ ...user, logs });
  }, [logs]);

  useEffect(() => {
    if (!user) return;
    onUserUpdate({ ...user, wods });
  }, [wods]);

  if (!user) return <div>Cargando usuario...</div>;

  const agregarLog = () => {
    if (!fecha.trim() || !ejercicio.trim()) return;
    const pesoNum = peso ? Number(peso) : null;
    if (peso && (isNaN(pesoNum) || pesoNum < 0)) return;
    setLogs([...logs, { fecha, ejercicio, peso: pesoNum }]);
    setFecha("");
    setEjercicio("");
    setPeso("");
  };

  const agregarWod = () => {
    if (!wodFecha.trim() || !wodDescripcion.trim()) return;
    setWods([
      ...wods,
      {
        wodFecha,
        wodDescripcion,
        wodComoRealizo: wodComoRealizo.trim() || "No especificado",
        wodSentimiento: wodSentimiento.trim() || "No especificado",
      },
    ]);
    setWodFecha("");
    setWodDescripcion("");
    setWodComoRealizo("");
    setWodSentimiento("");
  };

  const eliminarLog = (index) => {
    const nuevos = [...logs];
    nuevos.splice(index, 1);
    setLogs(nuevos);
  };

  const eliminarWod = (index) => {
    const nuevos = [...wods];
    nuevos.splice(index, 1);
    setWods(nuevos);
  };

  const editarLog = (index) => {
    const log = logs[index];
    setFecha(log.fecha);
    setEjercicio(log.ejercicio);
    setPeso(log.peso !== null ? log.peso : "");
    eliminarLog(index);
  };

  const editarWod = (index) => {
    const wod = wods[index];
    setWodFecha(wod.wodFecha);
    setWodDescripcion(wod.wodDescripcion);
    setWodComoRealizo(wod.wodComoRealizo);
    setWodSentimiento(wod.wodSentimiento);
    eliminarWod(index);
  };

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    window.location.href = "/";
  };

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

      <section className="entrenamientos-section">
        <h3>Control de Levantamientos</h3>
        <div className="inputs-entrenamientos">
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          <input type="text" placeholder="Ejercicio" value={ejercicio} onChange={(e) => setEjercicio(e.target.value)} />
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
            {logs.map((log, i) => (
              <tr key={i}>
                <td>{log.fecha}</td>
                <td>{log.ejercicio}</td>
                <td>{log.peso !== null ? log.peso : "-"}</td>
                <td>
                  <button className="button-icon" onClick={() => editarLog(i)}>
                    <i className="fa-solid fa-pencil"></i>
                  </button>
                  <button className="button-icon" onClick={() => eliminarLog(i)}>
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="wods-section">
        <h3>Registro de WODs</h3>
        <div className="inputs-wods">
          <input type="date" value={wodFecha} onChange={(e) => setWodFecha(e.target.value)} />
          <textarea placeholder="Descripción del WOD" value={wodDescripcion} onChange={(e) => setWodDescripcion(e.target.value)} rows={3} />
          <textarea placeholder="Cómo realizaste el WOD" value={wodComoRealizo} onChange={(e) => setWodComoRealizo(e.target.value)} rows={3} />
          <textarea placeholder="Cómo te sentiste / Lograste el objetivo?" value={wodSentimiento} onChange={(e) => setWodSentimiento(e.target.value)} rows={2} />
          <button onClick={agregarWod}>Agregar WOD</button>
        </div>

        <ul className="lista-wods">
          {wods.map((wod, i) => (
            <li key={i}>
              <strong>{wod.wodFecha}</strong> - {wod.wodDescripcion} <br />
              Cómo: {wod.wodComoRealizo} <br />
              Sentimiento: {wod.wodSentimiento} <br />
              <button className="button-icon" onClick={() => editarWod(i)}>
                <i className="fa-solid fa-pencil"></i>
              </button>
              <button className="button-icon" onClick={() => eliminarWod(i)}>
                <i className="fa-solid fa-trash"></i>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="link-coach">
        {user.role === "admin" ? (
          <button className="link-btn" onClick={() => (window.location.href = "/planificaCoach")}>
            Agregar planificaciones
          </button>
        ) : (
          <button className="link-btn" onClick={() => (window.location.href = "/planificacionViewer")}>
            Ir a planificaciones
          </button>
        )}
      </section>
    </div>
  );
};
