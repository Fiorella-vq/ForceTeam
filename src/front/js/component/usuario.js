import React, { useState } from "react";
import "../../styles/usuario.css";

export const Usuario = ({ user }) => {
  if (!user) {
    return <div>Cargando usuario...</div>;
  }

  const [logs, setLogs] = useState([]);
  const [fecha, setFecha] = useState("");
  const [ejercicio, setEjercicio] = useState("");
  const [peso, setPeso] = useState("");

  const [wods, setWods] = useState([]);
  const [wodFecha, setWodFecha] = useState("");
  const [wodDescripcion, setWodDescripcion] = useState("");
  const [wodComoRealizo, setWodComoRealizo] = useState("");
  const [wodSentimiento, setWodSentimiento] = useState("");

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
    // Limpiar inputs después de agregar
    setWodFecha("");
    setWodDescripcion("");
    setWodComoRealizo("");
    setWodSentimiento("");
  };

  return (
    <div className="usuario-container">
      <h2>
        Atleta: {user.name} {user.last_name}
      </h2>

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
            </tr>
          </thead>
          <tbody>
            {logs.map((log, i) => (
              <tr key={i}>
                <td>{log.fecha}</td>
                <td>{log.ejercicio}</td>
                <td>{log.peso !== null ? log.peso : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

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
              Sentimiento: {wod.wodSentimiento}
            </li>
          ))}
        </ul>
      </section>

<section className="link-coach">
  {user.role === "admin" ? (
    <a href="/planificaCoach">Ir a planificaciones diarias del coach</a>
  ) : (
    <a href="/planificacionViewer">Ir a planificaciones</a>
  )}
</section>

    </div>
  );
};
