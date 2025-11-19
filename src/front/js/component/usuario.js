import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import "../../styles/usuario.css";

export const Usuario = ({ user, token }) => {
  const navigate = useNavigate();

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
    "Hang Power Clean",
    "Hang Squat Clean",
    "Snatch",
    "Hang Power Snatch",
    "Hang Squat Snatch",
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

      Swal.fire({
        icon: "success",
        title: "WOD eliminado",
        background: "#1e1e1e",
        color: "#fff",
        confirmButtonColor: "#4fa3ff",
      });

    } catch {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo eliminar el WOD.",
        background: "#1e1e1e",
        color: "#fff",
      });
    }
  };

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
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudieron cargar los datos.",
          background: "#1e1e1e",
          color: "#fff",
        });
      }
    };
    fetchData();
  }, [user, token]);

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

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
    } catch (err) {}
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

  const obtenerSaludo = () => {
    const h = new Date().getHours();
    if (h < 12) return "¡Buen día!";
    if (h < 18) return "¡Vamos con todo!";
    return "¡A cerrar el día fuerte!";
  };

  const emojiSentimiento = () => {
    const s = wodSentimiento.toLowerCase();
    if (s.includes("bien") || s.includes("fuerte")) return "💪🔥";
    if (s.includes("normal")) return "🙂";
    if (s.includes("mal") || s.includes("cansado")) return "🥵";
    return "🏋️";
  };

  const wodDeHoy = wods.find(
    (w) => (w.fecha?.split?.("T")[0] || w.fecha || w.wod_fecha) === hoy
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
          (w) => (w.fecha?.split?.("T")[0] || w.fecha || w.wod_fecha) !== hoy
        );
        return [...sinHoy, nuevoWod];
      });

      setWodDescripcion("");
      setWodComoRealizo("");
      setWodSentimiento("");

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "WOD guardado",
        background: "#1e1e1e",
        color: "#fff",
        timer: 1500,
        showConfirmButton: false,
      });

    } catch {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo guardar el WOD",
        background: "#1e1e1e",
        color: "#fff",
      });
    }
  };

  return (
    <div className="usuario-container">

      <div className="usuario-welcome-card">
        <h3>{obtenerSaludo()} {user.name} 💪</h3>
        <p className="usuario-welcome-sub">Último acceso: {new Date().toLocaleDateString("es-ES")}</p>
        <p className="usuario-welcome-text">Recordá registrar tu WOD del día para seguir mejorando 🚀</p>
      </div>

      <div className="usuario-header">
        <h2>
          Atleta: {user.name} {user.last_name}
        </h2>
        <button className="logout-btn" onClick={cerrarSesion}>
          Cerrar sesión
        </button>
      </div>

      {wodDeHoy && (
        <div className="usuario-resumen-hoy">
          <h3>Resumen del día 🗓️</h3>
          <p><strong>WOD:</strong> {wodDeHoy.descripcion || wodDeHoy.wod_descripcion}</p>
          <p><strong>Cómo lo realizaste:</strong> {wodDeHoy.como_realizo || wodDeHoy.wod_como_realizo}</p>
          <p><strong>Sentimiento:</strong> {wodDeHoy.sentimiento || wodDeHoy.wod_sentimiento}</p>
        </div>
      )}

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

          <div className="sentimiento-box">
            <textarea
              placeholder="Cómo te sentiste?"
              value={wodSentimiento}
              onChange={(e) => setWodSentimiento(e.target.value)}
            />
            <div className="emoji-sentimiento">{emojiSentimiento()}</div>
          </div>

          <button onClick={guardarWodHoy}>Guardar WOD</button>

          <button
            className="button-icon"
            onClick={() => {
              const ultimos = wods
                .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                .slice(0, 5)
                .map(
                  (w) => `
                    <p>
                      <strong>${w.fecha.split("T")[0]}</strong><br/>
                      ${w.descripcion}<br/>
                      😃 ${w.sentimiento}
                    </p>
                  `
                )
                .join("");

              Swal.fire({
                title: "Últimos WODs",
                html: ultimos,
                background: "#1e1e1e",
                color: "#fff",
                confirmButtonColor: "#4fa3ff",
              });
            }}
          >
            Ver histórico rápido 📅
          </button>
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
                      <p><strong>🏋️ Descripción:</strong> ${
                        wod.descripcion || wod.wod_descripcion || "-"
                      }</p>
                      <p><strong>🔥 Cómo lo realizaste:</strong> ${
                        wod.como_realizo || wod.wod_como_realizo || "-"
                      }</p>
                      <p><strong>❤️ Sentimiento:</strong> ${
                        wod.sentimiento || wod.wod_sentimiento || "-"
                      }</p>
                    `,
                    background: "#1e1e1e",
                    color: "#fff",
                    confirmButtonColor: "#4fa3ff",
                  });
                } else {
                  Swal.fire({
                    title: "Sin registro",
                    text: "No hay WOD guardado para esta fecha.",
                    icon: "info",
                    background: "#1e1e1e",
                    color: "#fff",
                    confirmButtonColor: "#4fa3ff",
                  });
                }
              }}
            />
          </label>
        </div>

        <ul className="lista-wods">
          {wods
            .filter(
              (w) =>
                (w.fecha?.split?.("T")[0] || w.fecha || w.wod_fecha) === hoy
            )
            .slice(0, 1)
            .map((wod) => (
              <li key={wod.id}>
                <strong>{wod.fecha}</strong> <br />
                <p><strong>🏋️ Descripción:</strong> {wod.descripcion || wod.wod_descripcion || "-"}</p>
                <p><strong>🔥 Cómo lo realizaste:</strong> {wod.como_realizo || wod.wod_como_realizo || "-"}</p>
                <p><strong>❤️ Sentimiento:</strong> {wod.sentimiento || wod.wod_sentimiento || "-"}</p>
              </li>
            ))}
        </ul>
      </section>

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
            onClick={() => navigate("/planificaCoach", { state: { pesos } })}
          >
            Agregar Planificación
          </button>
        )}
      </div>
    </div>
  );
};
