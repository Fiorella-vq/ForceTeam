import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "../../styles/planifica.css";


const getWeekNumber = (date = new Date()) => {
  const year = date.getFullYear();
  const jan1 = new Date(year, 0, 1);
  const days = Math.floor((date - jan1) / (24 * 60 * 60 * 1000));
  const week = Math.ceil((days + jan1.getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
};

export const PlanificacionCoach = () => {
  const [semana, setSemana] = useState(getWeekNumber());
  const [dia, setDia] = useState(1);
  const [plan, setPlan] = useState({ A: "", B: "", C: "", D: "" });
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("token");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPlan({ ...plan, [name]: value });
  };

  const fetchPlanificacion = async () => {
    if (!semana || !dia) return;
    try {
      const res = await fetch(
        `http://localhost:3001/api/planificacion?semana=${semana}&dia=${dia}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (res.ok && data.plan) {
        setPlan(data.plan);
      } else {
        setPlan({ A: "", B: "", C: "", D: "" });
      }
    } catch (err) {
      console.error("Error al cargar planificación", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3001/api/planificacion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ semana, dia, plan }),
      });

      const data = await res.json();

      if (res.ok) {
        Swal.fire("¡Guardado!", "Planificación registrada.", "success");
      } else {
        Swal.fire("Error", data.error || "Algo salió mal", "error");
      }
    } catch (err) {
      Swal.fire("Error", "No se pudo conectar al servidor", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanificacion();
  }, [semana, dia]);

  return (
    <div className="planificacion-container">
      <h2>Planificación Semanal</h2>

      <form className="planificacion-form" onSubmit={handleSubmit}>
        <div className="selectors">
          <input
            type="week"
            value={semana}
            onChange={(e) => setSemana(e.target.value)}
            required
          />
          <select value={dia} onChange={(e) => setDia(parseInt(e.target.value))}>
            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
              <option key={d} value={d}>
                Día {d}
              </option>
            ))}
          </select>
        </div>

        <label>Bloque A</label>
        <textarea
          name="A"
          value={plan.A}
          onChange={handleChange}
          rows={4}
        />

        <label>Bloque B</label>
        <textarea
          name="B"
          value={plan.B}
          onChange={handleChange}
          rows={4}
        />

        <label>Bloque C</label>
        <textarea
          name="C"
          value={plan.C}
          onChange={handleChange}
          rows={4}
        />

        <label>Bloque D</label>
        <textarea
          name="D"
          value={plan.D}
          onChange={handleChange}
          rows={4}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Guardar Planificación"}
        </button>
      </form>
    </div>
  );
};
