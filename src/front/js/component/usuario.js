import React, { useState, useEffect, useContext } from "react";
import { Context } from "../store/appContext";
import "../../styles/usuario.css";

export const Usuario = ({ user }) => {
  const { actions } = useContext(Context);

  // --- Estados inicializados con localStorage ---
  const [logs, setLogs] = useState(() => {
    const saved = user ? localStorage.getItem(`logs_${user.id}`) : null;
    return saved ? JSON.parse(saved) : [];
  });
  const [fecha, setFecha] = useState("");
  const [ejercicio, setEjercicio] = useState("");
  const [peso, setPeso] = useState("");

  const [wods, setWods] = useState(() => {
    const saved = user ? localStorage.getItem(`wods_${user.id}`) : null;
    return saved ? JSON.parse(saved) : [];
  });
  const [wodFecha, setWodFecha] = useState("");
  const [wodDescripcion, setWodDescripcion] = useState("");
  const [wodComoRealizo, setWodComoRealizo] = useState("");
  const [wodSentimiento, setWodSentimiento] = useState("");

  // --- Guardar logs y wods en localStorage de manera segura ---
  useEffect(() => {
    let isMounted = true;
    if (isMounted && user) {
      localStorage.setItem(`logs_${user.id}`, JSON.stringify(logs));
    }
    return () => {
      isMounted = false;
    };
  }, [logs, user]);

  useEffect(() => {
    let isMounted = true;
    if (isMounted && user) {
      localStorage.setItem(`wods_${user.id}`, JSON.stringify(wods));
    }
    return () => {
      isMounted = false;
    };
  }, [wods, user]);

  if (!user) return <div>Cargando usuario...</div>;

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

  // --- Funciones para eliminar y editar ---
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

  // --- Cerrar sesión usando Context ---
  const cerrarSesion = () => {
    actions.logoutUser();
  };

  return (
    <div className="usuario-container">
      {/* --- Encabezado del usuario --- */}
      <div className="usuario-header">
        <h2>
          <i className="fa-solid fa-user"></i> Atleta: {user.name} {user.last_name}
        </h2>
        <button className="logout-btn" onClick={cerrarSesion}>
          Cerrar sesión
        </button>
      </div>

      {/* --- Logs de levantamientos --- */}
      <section className="entrenamientos-section">
        <h3>Control de Levantamientos</h3>
        <div className="inputs-entrenamientos">
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          <input
            type="text"
            placeholder="Ejercicio"
            value={ejercicio}
            onChange={(e) => setEjercicio(e.target.value)}
          />
          <input
            type="number"
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
                  <button className="button-icon" onClick={() => eliminarLog(i)}>
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
          <input type="date" value={wodFecha} onChange={(e) => setWodFecha(e.target.value)} />
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
            rows={3}
          />
          <textarea
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

      {/* --- Enlaces finales --- */}
      <section className="link-coach">
        {user.role === "admin" ? (
          <>
            <a href="/planificaCoach">Ir a planificaciones diarias del coach</a>
           
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
