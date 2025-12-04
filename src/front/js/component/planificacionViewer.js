import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/planiViewer.css";

const BACKEND = process.env.BACKEND_URL || "https://forceteam.onrender.com/api";

export const PlanificacionViewer = () => {
  const navigate = useNavigate();

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
    Object.fromEntries(ejerciciosDisponibles.map((e) => [e, ""]))
  );

  const [planificacion, setPlanificacion] = useState(null);
  const [user, setUser] = useState(null);
  const token = localStorage.getItem("token");
  const fecha = new Date().toISOString().split("T")[0];
  const tipo = "normal";

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser || !token) {
      navigate("/");
      return;
    }

    const parsedUser = JSON.parse(storedUser);

    if (!parsedUser?.id) {
      navigate("/");
      return;
    }

    setUser(parsedUser);
  }, [token, navigate]);

  useEffect(() => {
    if (!user?.id || !token) return;

    fetch(`${BACKEND}/users/${user.id}/pesos`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const nuevos = {};

        ejerciciosDisponibles.forEach((ej) => {
          nuevos[ej] = data?.[ej] ?? "";
        });

        setPesos(nuevos);
      })
      .catch((err) => console.error(err));
  }, [user?.id, token]);

  useEffect(() => {
    if (!token) return;

    fetch(`${BACKEND}/planificacion?fecha=${fecha}&tipo=${tipo}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.bloque_a) {
          setPlanificacion(data);
        } else {
          setPlanificacion(null);
        }
      })
      .catch((err) => console.error(err));
  }, [fecha, tipo, token]);

  const guardarPeso = async (ejercicio, valor) => {
    if (!user?.id || !token) return;

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
      ejerciciosDisponibles.forEach((ej) => {
        const val = Number(pesos[ej]);
        if (!isNaN(val) && val > 0) {
          guardarPeso(ej, val);
        }
      });
    }, 600);

    return () => clearTimeout(timer);
  }, [pesos, user?.id, token]);

  const calcularPorcentajes = (peso) => {
    const base = Number(peso);
    if (!base) return {};
    const porcents = [45, 55, 65, 70, 75, 80, 85, 90, 95];

    return porcents.reduce((acc, p) => {
      acc[p] = Math.round((base * p) / 100);
      return acc;
    }, {});
  };

  if (!user || !user.id || !token) {
    return (
      <div className="plani-viewer-container">
        <h3>Cargando usuario...</h3>
      </div>
    );
  }

  return (
    <div className="plani-viewer-container">
      <h2>Porcentajes de levantamientos</h2>

      <table className="tabla-porcentajes">
        <thead>
          <tr>
            <th>Ejercicio</th>
            <th>Máx</th>
            {[45, 55, 65, 70, 75, 80, 85, 90, 95].map((p) => (
              <th key={p}>{p}%</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {ejerciciosDisponibles.map((ej) => {
            const peso = pesos[ej] || "";
            const porcentajes = calcularPorcentajes(peso);

            return (
              <tr key={ej}>
                <td>{ej}</td>
                <td>
                  <input
                    className="input-peso"
                    value={peso}
                    onChange={(e) =>
                      setPesos((prev) => ({
                        ...prev,
                        [ej]: e.target.value ?? "",
                      }))
                    }
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

      {planificacion && (
        <div className="plan-content">
          <h3>Planificación del día</h3>
          <ul>
            {["a", "b", "c", "d", "e"].map((b) => (
              <li key={b} className={`bloque-${b.toUpperCase()}`}>
                <span className="bloque-titulo">Bloque {b.toUpperCase()}</span>
                <span className="bloque-texto">
                  {planificacion[`bloque_${b}`] || "-"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="link-coach">
        <button className="link-btn" onClick={() => navigate("/usuarioPages")}>
          Volver a usuario
        </button>
      </div>
    </div>
  );
};
