import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import "../../styles/usuario.css";

const BACKEND = process.env.BACKEND_URL || "https://forceteam.onrender.com/api";

export const Usuario = ({ user, token }) => {
  const navigate = useNavigate();

  const obtenerSaludo = () => {
    const h = new Date().getHours();
    if (h < 12) return "¡Buen día!";
    if (h < 18) return "¡Vamos con todo!";
    return "¡A cerrar el día fuerte!";
  };

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
    ejerciciosDisponibles.reduce((acc, ej) => ({ ...acc, [ej]: "" }), {})
  );

  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoy);
  const [busqueda, setBusqueda] = useState("");
  const [usuariosRegistrados, setUsuariosRegistrados] = useState([]);

  const usuariosFiltrados = usuariosRegistrados
    .filter((u) =>
      (u.name + " " + u.last_name)
        .toLowerCase()
        .includes(busqueda.toLowerCase())
    )
    .sort((a, b) => (a.name + a.last_name).localeCompare(b.name + b.last_name));

  const frases = [
    "La fuerza no viene de ganar, viene del esfuerzo 💪🔥",
    "Hoy entrenás, mañana sos más fuerte 🏋️",
    "Las repeticiones construyen campeones 🦾",
    "Tu único rival sos vos mismo 😤🔥",
    "El dolor es temporal, el orgullo es para siempre 🏆",
  ];

  const [fraseMotivacional, setFraseMotivacional] = useState("");

  // Frase motivacional
  useEffect(() => {
    const f = frases[Math.floor(Math.random() * frases.length)];
    setFraseMotivacional(f);
  }, []);

  // Usuarios registrados
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${BACKEND}/usuarios`);
        setUsuariosRegistrados(await res.json());
      } catch (e) {
        console.error("Error cargando usuarios:", e);
      }
    };
    fetchUsers();
  }, []);

  // Logs, WODs y pesos del usuario
  useEffect(() => {
    if (!user?.id || !token) return;

    const fetchData = async () => {
      try {
        const [logsRes, wodsRes, pesosRes] = await Promise.all([
          fetch(`${BACKEND}/users/${user.id}/logs`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${BACKEND}/users/${user.id}/wods`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${BACKEND}/users/${user.id}/pesos`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setLogs(await logsRes.json());
        setWods(await wodsRes.json());

        const pesosData = await pesosRes.json();
        if (pesosData && typeof pesosData === "object") setPesos(pesosData);
      } catch {
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
    } catch {
      // silencioso
    }
  };

  // Autoguardar pesos
  useEffect(() => {
    if (!user?.id || !token) return;

    const timer = setTimeout(() => {
      ejerciciosDisponibles.forEach((ej) => {
        const val = pesos[ej];
        if (val !== "" && !isNaN(val)) {
          guardarPeso(ej, parseFloat(val));
        }
      });
    }, 700);

    return () => clearTimeout(timer);
  }, [pesos, user?.id, token]);

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
        res = await fetch(`${BACKEND}/users/${user.id}/wods/${wodDeHoy.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${BACKEND}/users/${user.id}/wods`, {
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

  const cerrarSesion = async () => {
    try {
      await fetch(`${BACKEND}/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } finally {
      localStorage.clear();
      window.location.href = "/";
    }
  };

  // Render de carga si por algún motivo no llegó el user
  if (!user || !user.id || !token) {
    return (
      <div className="usuario-container">
        <p>Cargando usuario...</p>
      </div>
    );
  }

  return (
    <div className="usuario-container">
      <div className="usuario-welcome-card">
        <h3>
          {obtenerSaludo()} {user.name} 💪
        </h3>
        <p className="usuario-welcome-sub">
          Último acceso: {new Date().toLocaleDateString("es-ES")}
        </p>
      </div>

      <div className="usuario-header">
        <h2>
          Atleta: {user.name} {user.last_name}
        </h2>
        <button className="logout-btn" onClick={cerrarSesion}>
          Cerrar sesión
        </button>
      </div>

      <section className="wods-section">
        <h3>Registrar WOD del día</h3>

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
                  (w) => (w.fecha?.split?.("T")[0] || w.fecha) === nuevaFecha
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

        {wodDeHoy && (
          <div className="usuario-wod-hoy">
            <h3>WOD de hoy 🗓️ ({hoy})</h3>

            <div className="wod-hoy-card">
              <p>
                <strong>🏋️ Descripción:</strong>{" "}
                {wodDeHoy.descripcion || wodDeHoy.wod_descripcion || "-"}
              </p>

              <p>
                <strong>🔥 Cómo lo realizaste:</strong>{" "}
                {wodDeHoy.como_realizo || wodDeHoy.wod_como_realizo || "-"}
              </p>

              <p>
                <strong>❤️ Sentimiento:</strong>{" "}
                {wodDeHoy.sentimiento || wodDeHoy.wod_sentimiento || "-"}
              </p>
            </div>
          </div>
        )}

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
            placeholder="Cómo te sentiste?"
            value={wodSentimiento}
            onChange={(e) => setWodSentimiento(e.target.value)}
          />

          <button onClick={guardarWodHoy}>Guardar WOD</button>
        </div>
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

      <div className="motivacional-card">
        <p>⚡ {fraseMotivacional}</p>
      </div>

      <div className="usuarios-conectados-card">
        <h4>Usuarios registrados</h4>

        <p className="usuario-total">Total: {usuariosRegistrados.length}</p>

        <input
          type="text"
          className="usuario-buscador"
          placeholder="Buscar usuario..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <ul>
          {usuariosFiltrados.map((u) => {
            const inicial = u.name?.charAt(0)?.toUpperCase() || "?";

            const colores = [
              "#6a0dad",
              "#2980b9",
              "#c0392b",
              "#16a085",
              "#8e44ad",
              "#d35400",
            ];
            const color = colores[inicial.charCodeAt(0) % colores.length];

            const rol = u.role === "admin" ? "Admin" : "Atleta";

            return (
              <li key={u.id} className="usuario-item">
                <div
                  className={`usuario-avatar ${
                    u.role === "admin" ? "admin-avatar" : ""
                  }`}
                  style={{ background: color }}
                >
                  {inicial}
                </div>

                <span className="usuario-nombre">
                  {u.name} {u.last_name}
                  {u.id === user.id && " (vos)"}
                </span>

                <span
                  className={`usuario-rol ${
                    u.role === "admin" ? "rol-admin" : "rol-atleta"
                  }`}
                >
                  {rol}
                </span>

                <div className={u.is_online ? "dot-online" : "dot-offline"} />
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
