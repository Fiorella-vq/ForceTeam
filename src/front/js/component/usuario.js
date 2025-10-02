import React, { useState, useEffect } from "react";
import "../../styles/usuario.css";

export const Usuario = ({ user }) => {
  if (!user) {
    return <div>Cargando usuario...</div>;
  }

  // --- Estados inicializados con localStorage ---
  const [logs, setLogs] = useState(() => {
    const saved = localStorage.getItem(`logs_${user.id}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [fecha, setFecha] = useState("");
  const [ejercicio, setEjercicio] = useState("");
  const [peso, setPeso] = useState("");

  const [wods, setWods] = useState(() => {
    const saved = localStorage.getItem(`wods_${user.id}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [wodFecha, setWodFecha] = useState("");
  const [wodDescripcion, setWodDescripcion] = useState("");
  const [wodComoRealizo, setWodComoRealizo] = useState("");
  const [wodSentimiento, setWodSentimiento] = useState("");

  // --- Guardar logs y wods en localStorage ---
  useEffect(() => {
    localStorage.setItem(`logs_${user.id}`, JSON.stringify(logs));
  }, [logs, user.id]);

  useEffect(() => {
    localStorage.setItem(`wods_${user.id}`, JSON.stringify(wods));
  }, [wods, user.id]);

  // --- Funciones para agregar ---
  const agregarLog = () => {
    if (!fecha.trim() || !ejercicio.trim()) {
      alert("Fecha y ejercicio son obligatorios");
      return;
    }

    const pesoNum = peso ? Number(peso) : null;
    if (peso && (isNaN(pesoNum) || pesoNum < 0)) {
      alert("Peso debe ser un número válido");
      return;
    }

    setLogs([...logs, { fecha, ejercicio, peso: pesoNum }]);
    setFecha("");
    setEjercicio("");
    setPeso("");
  };

  const agregarWod = () => {
    if (!wodFecha.trim() || !wodDescripcion.trim()) {
      alert("Fecha y descripción son obligatorios");
      return;
    }

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

  // --- Funciones para eliminar ---
  const eliminarLog = (index) => {
    const nuevosLogs = [...logs];
    nuevosLogs.splice(index, 1);
    setLogs(nuevosLogs);
  };

  const eliminarWod = (index) => {
    const nuevosWods = [...wods];
    nuevosWods.splice(index, 1);
    setWods(nuevosWods);
  };

  // --- Funciones para editar ---
  const editarLog = (index) => {
    const log = logs[index];
    setFecha(log.fecha);
    setEjercicio(log.ejercicio);
    setPeso(log.peso !== null ? log.peso : "");
    eliminarLog(index); // eliminamos el registro original mientras editamos
  };

  const editarWod = (index) => {
    const wod = wods[index];
    setWodFecha(wod.wodFecha);
    setWodDescripcion(wod.wodDescripcion);
    setWodComoRealizo(wod.wodComoRealizo);
    setWodSentimiento(wod.wodSentimiento);
    eliminarWod(index); // eliminamos mientras editamos
  };

  return (
    <div className="usuario-container">
      <h2>
        Atleta: {user.name} {user.last_name}
      </h2>

      {/* --- Logs de levantamientos --- */}
      <section className="entrenamientos-section">
        <h3>Control de Levantamientos</h3>
        <div className="inputs-entrenamientos">
          <input
            type="date"
            name="fecha"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
          <input
            type="text"
            name="ejercicio"
            placeholder="Ejercicio"
            value={ejercicio}
            onChange={(e) => setEjercicio(e.target.value)}
          />
          <input
            type="number"
            name="peso"
            placeholder="Peso (kg)"
            value={peso}
            onChange={(e) => setPeso(e.target.value)}
            min="0"
            step="0.1"
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
                  <button
                    className="button-icon"
                    onClick={() => eliminarLog(i)}
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* --- WODs --- */}
      <section className="wods-section">
        <h3>Registro de WODs</h3>
        <div className="inputs-wods">
          <input
            type="date"
            name="wodFecha"
            value={wodFecha}
            onChange={(e) => setWodFecha(e.target.value)}
          />
          <textarea
            name="wodDescripcion"
            placeholder="Descripción del WOD"
            value={wodDescripcion}
            onChange={(e) => setWodDescripcion(e.target.value)}
            rows={3}
          />
          <textarea
            name="wodComoRealizo"
            placeholder="Cómo realizaste el WOD"
            value={wodComoRealizo}
            onChange={(e) => setWodComoRealizo(e.target.value)}
            rows={3}
          />
          <textarea
            name="wodSentimiento"
            placeholder="Cómo te sentiste / Lograste el objetivo?"
            value={wodSentimiento}
            onChange={(e) => setWodSentimiento(e.target.value)}
            rows={2}
          />
          <button onClick={agregarWod}>Agregar WOD</button>
        </div>

        <ul className="lista-wods">
          {wods.map((wod, i) => (
            <li key={i}>
              <strong>{wod.wodFecha}</strong> - {wod.wodDescripcion} <br />
              Cómo: {wod.wodComoRealizo} <br />
              Sentimiento: {wod.wodSentimiento} <br />
              <button className="button-icon" onClick={() => editarLog(i)}>
                    <i className="fa-solid fa-pencil"></i>
                  </button>
                  <button
                    className="button-icon"
                    onClick={() => eliminarLog(i)}
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="link-coach">
  {user.role === "admin" ? (
    <>
      <a href="/planificaCoach">Ir a planificaciones diarias del coach</a>
      <a href="/cronometroWod" style={{ marginLeft: "20px" }}>
        Ir a cronómetro
      </a>
    </>
  ) : (
    <>
      <a href="/planificacionViewer">Ir a planificaciones</a>
      <a href="/cronometro" style={{ marginLeft: "20px" }}>
        Ir a cronómetro
      </a>
    </>
  )}
</section>

    </div>
  );
};
