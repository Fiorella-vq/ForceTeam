import React, { useState } from "react";
import Swal from "sweetalert2";
import { Link } from "react-router-dom";
import "../../styles/planifica.css";

// Esta función ahora protege contra undefined/null
const extractUrls = (text) => {
  if (!text) return [];
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
};

export const PlanificacionCoach = () => {
  const [fecha, setFecha] = useState("2025-10-04");
  const [dia, setDia] = useState(1);
  const [plan, setPlan] = useState({ A: "", B: "", C: "", D: "" });
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token")?.trim();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPlan((prev) => ({ ...prev, [name]: value }));
  };

  const fetchPlanificacion = async (fechaParam, diaParam) => {
    if (!fechaParam || !token) return;

    try {
      const res = await fetch(
        `http://localhost:3001/api/planificacion?fecha=${fechaParam}&dia=${diaParam}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setPlan(data.plan || { A: "", B: "", C: "", D: "" });
      } else {
        setPlan({ A: "", B: "", C: "", D: "" });
      }
    } catch {
      Swal.fire("Error", "No se pudo cargar la planificación", "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return Swal.fire("Error", "No estás autenticado", "error");

    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/api/planificacion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fecha, dia, plan }),
      });
      const data = await res.json();

      if (res.ok) {
        Swal.fire("¡Guardado!", "Planificación registrada.", "success");

        // Avanzar al siguiente día automáticamente
        const fechaObj = new Date(fecha);
        fechaObj.setDate(fechaObj.getDate() + 1);
        const yyyy = fechaObj.getFullYear();
        const mm = String(fechaObj.getMonth() + 1).padStart(2, "0");
        const dd = String(fechaObj.getDate()).padStart(2, "0");
        setFecha(`${yyyy}-${mm}-${dd}`);

        setDia(dia + 1);
        setPlan({ A: "", B: "", C: "", D: "" });
      } else {
        Swal.fire("Error", data.error || "Algo salió mal", "error");
      }
    } catch {
      Swal.fire("Error", "No se pudo conectar al servidor", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!token) return Swal.fire("Error", "No estás autenticado", "error");

    const confirm = await Swal.fire({
      title: "¿Estás seguro?",
      text: `Se eliminará la planificación del día ${dia} (${fecha}).`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return;

    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:3001/api/planificacion?fecha=${fecha}&dia=${dia}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (res.ok) {
        Swal.fire("Eliminado", "Planificación eliminada correctamente.", "success");
        setPlan({ A: "", B: "", C: "", D: "" });
      } else {
        Swal.fire("Error", data.error || "No se pudo eliminar", "error");
      }
    } catch {
      Swal.fire("Error", "No se pudo conectar al servidor", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleManualFechaChange = (e) => {
    const newFecha = e.target.value;
    setFecha(newFecha);
    fetchPlanificacion(newFecha, dia);
  };

  const handleManualDiaChange = (e) => {
    const newDia = parseInt(e.target.value, 10);
    setDia(newDia);
    fetchPlanificacion(fecha, newDia);
  };

  return (
    <div className="planificacion-container">
      <h2>Planificación Diaria</h2>
      <form className="planificacion-form" onSubmit={handleSubmit}>
        <div className="selectors">
          <input
            type="date"
            value={fecha}
            onChange={handleManualFechaChange}
            required
          />
          <select value={dia} onChange={handleManualDiaChange} required>
            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
              <option key={d} value={d}>
                Día {d}
              </option>
            ))}
          </select>
        </div>

        {["A", "B", "C", "D"].map((bloque) => (
          <div key={bloque}>
            <label>Bloque {bloque}</label>
            <textarea
              name={bloque}
              value={plan[bloque] || ""}
              onChange={handleChange}
              rows={4}
            />
            <div className="links-block">
              {extractUrls(plan[bloque]).map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                  {url}
                </a>
              ))}
            </div>
          </div>
        ))}

        <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
          <button type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Guardar Planificación"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="btn-eliminar"
          >
            {loading ? "Eliminando..." : "Eliminar Planificación"}
          </button>
        </div>
      </form>

      <div style={{ marginTop: "20px" }}>
        <Link to="/usuarioPages"> Volver al inicio</Link>
      </div>
    </div>
  );
};
