import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/planiViewer.css";

const BACKEND = process.env.BACKEND_URL || "https://forceteam.onrender.com/api";

export const PlanificacionViewer = () => {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "null");
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

  const [pesos, setPesos] = useState({});

  
  useEffect(() => {
    if (!user?.id || !token) {
      navigate("/");
      return;
    }

    fetch(`${BACKEND}/users/${user.id}/pesos`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data === "object") {
          setPesos(data);
        } else {
          setPesos({});
        }
      })
      .catch((err) => console.error("Error cargando pesos:", err));
  }, [user?.id, token, navigate]);

  
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
    } catch (err) {
      console.error("Error guardando peso:", err);
    }
  };

 
  useEffect(() => {
    if (!user?.id || !token) return;

    const timer = setTimeout(() => {
      Object.entries(pesos).forEach(([ej, val]) => {
        if (val !== "" && !isNaN(val)) {
          guardarPeso(ej, Number(val));
        }
      });
    }, 600);

    return () => clearTimeout(timer);
  }, [pesos, user?.id, token]);

 
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
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^\d*\.?\d*$/.test(val)) {
                        setPesos((prev) => ({
                          ...prev,
                          [ej]: val,
                        }));
                      }
                    }}
                    placeholder="Máx"
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
