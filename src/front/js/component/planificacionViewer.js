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
    ejerciciosDisponibles.reduce((acc, ej) => ({ ...acc, [ej]: "" }), {})
  );

  const [user, setUser] = useState(null);
  const token = localStorage.getItem("token");

  
  const [fecha, setFecha] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [planificacion, setPlanificacion] = useState(null);
  const [tipo] = useState("normal");

  
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
        const nuevosPesos = ejerciciosDisponibles.reduce(
          (acc, ej) => ({
            ...acc,
            [ej]: data?.[ej] ?? "",
          }),
          {}
        );

        setPesos(nuevosPesos);
      })
      .catch((err) => console.error(err));
  }, [user?.id, token]);

 
  useEffect(() => {
    if (!token) return;

    fetch(`${BACKEND}/planificacion?fecha=${fecha}&tipo=${tipo}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setPlanificacion(data?.plan ? data : null);
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
        const val = pesos[ej];
        if (val !== "" && !isNaN(val)) {
          guardarPeso(ej, parseFloat(val));
        }
      });
    }, 700);

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

    
      {planificacion && (
        <div className="planificacion-card">
          <h3>Planificación del día ({fecha})</h3>
          <p><strong>A:</strong> {planificacion.bloque_a}</p>
          <p><strong>B:</strong> {planificacion.bloque_b}</p>
          <p><strong>C:</strong> {planificacion.bloque_c}</p>
          <p><strong>D:</strong> {planificacion.bloque_d}</p>
          <p><strong>E:</strong> {planificacion.bloque_e}</p>
        </div>
      )}

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
