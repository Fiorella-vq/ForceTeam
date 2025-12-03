import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/planiViewer.css";

const BACKEND = process.env.BACKEND_URL || "https://forceteam.onrender.com/api";

export const PlanificacionViewer = () => {
  const navigate = useNavigate();

  const [pesos, setPesos] = useState({});
  const [user, setUser] = useState(null);
  const token = localStorage.getItem("token");

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

  // ✅ Cargar usuario de forma SEGURA
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

  // ✅ Fetch de pesos SOLO cuando user ya existe
  useEffect(() => {
    if (!user?.id || !token) return;

    fetch(`${BACKEND}/users/${user.id}/pesos`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setPesos(data || {}))
      .catch((err) => console.error(err));
  }, [user?.id, token]);

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
    if (!user?.id) return;

    const timer = setTimeout(() => {
      Object.entries(pesos).forEach(([ej, val]) => {
        if (val !== "" && !isNaN(val)) guardarPeso(ej, parseFloat(val));
      });
    }, 600);

    return () => clearTimeout(timer);
  }, [pesos, user?.id]);

  const calcularPorcentajes = (peso) => {
    if (!peso || isNaN(peso)) return {};
    const porcents = [45, 55, 65, 70, 75, 80, 85, 90, 95];

    return porcents.reduce((acc, p) => {
      acc[p] = Math.round((peso * p) / 100);
      return acc;
    }, {});
  };

  return (
    <div className="plani-viewer-container">
      <h2>Porcentajes de levantamientos</h2>

      <table className="tabla-porcentajes">
        <thead>
          <tr>
            <th>Ejercicio</th>
            <th>Máx</th>
            <th>45%</th>
            <th>55%</th>
            <th>65%</th>
            <th>70%</th>
            <th>75%</th>
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
                    className="input-peso"
                    value={peso || ""}
                    onChange={(e) =>
                      setPesos((prev) => ({
                        ...prev,
                        [ej]: e.target.value,
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

      <div className="link-coach">
        <button className="link-btn" onClick={() => navigate("/usuarioPages")}>
          Volver a usuario
        </button>
      </div>
    </div>
  );
};
