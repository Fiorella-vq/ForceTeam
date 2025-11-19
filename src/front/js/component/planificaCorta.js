import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import "../../styles/planifica.css";

const extractUrls = (text) => {
  if (!text) return [];
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
};

const getTodayString = () => {
  const today = new Date();
  return today.toISOString().split("T")[0];
};

export const PlanificaCorta = () => {
  const [fecha, setFecha] = useState(getTodayString());
  const [plan, setPlan] = useState({ A: "", B: "", C: "", D: "", E: "" });
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token")?.trim();
  const navigate = useNavigate();

  const fetchPlanificacion = async (fechaParam) => {
    if (!fechaParam || !token) return;

    try {
      const res = await fetch(
        `https://forceteam.onrender.com/api
/planificacion?fecha=${fechaParam}&tipo=corta`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.ok) {
        const data = await res.json();
        setPlan(data.plan || { A: "", B: "", C: "", D: "", E: "" });
      } else {
        setPlan({ A: "", B: "", C: "", D: "", E: "" });
      }
    } catch {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo cargar la planificación corta",
        background: "#1e1e1e",
        color: "#fff",
      });
    }
  };

  useEffect(() => {
    fetchPlanificacion(fecha);
  }, [fecha]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPlan((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token)
      return Swal.fire({
        icon: "error",
        text: "No estás autenticado",
        background: "#1e1e1e",
        color: "#fff",
      });

    setLoading(true);
    try {
      const res = await fetch("https://forceteam.onrender.com/api
/planificacion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fecha, tipo: "corta", plan }),
      });

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "Guardado",
          text: "Planificación corta guardada correctamente",
          background: "#1e1e1e",
          color: "#fff",
        });
      } else {
        Swal.fire({
          icon: "error",
          text: "Error guardando planificación corta",
          background: "#1e1e1e",
          color: "#fff",
        });
      }
    } catch {
      Swal.fire({
        icon: "error",
        text: "Error de conexión",
        background: "#1e1e1e",
        color: "#fff",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!token)
      return Swal.fire({
        icon: "error",
        text: "No estás autenticado",
        background: "#1e1e1e",
        color: "#fff",
      });

    const confirm = await Swal.fire({
      title: "¿Eliminar planificación corta?",
      text: `Se eliminará la planificación corta del ${fecha}.`,
      icon: "warning",
      background: "#1e1e1e",
      color: "#fff",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
    });

    if (!confirm.isConfirmed) return;

    setLoading(true);
    try {
      const res = await fetch(
        `https://forceteam.onrender.com/api
/planificacion?fecha=${fecha}&tipo=corta`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "Eliminada",
          text: "Planificación corta eliminada",
          background: "#1e1e1e",
          color: "#fff",
        });
        setPlan({ A: "", B: "", C: "", D: "", E: "" });
      } else {
        Swal.fire({
          icon: "error",
          text: "Error eliminando planificación",
          background: "#1e1e1e",
          color: "#fff",
        });
      }
    } catch {
      Swal.fire({
        icon: "error",
        text: "Error de conexión",
        background: "#1e1e1e",
        color: "#fff",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="planificacion-container">
      <h2>Planificación Corta</h2>

      <div
        style={{
          marginBottom: "15px",
          display: "flex",
          gap: "10px",
          justifyContent: "center",
        }}
      >
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          required
        />

        <button
          className="link-btn"
          onClick={() => navigate("/planificaCoach")}
        >
          Volver a planificación normal
        </button>
      </div>

      <form className="planificacion-form" onSubmit={handleSubmit}>
        {["A", "B", "C", "D", "E"].map((bloque) => (
          <div key={bloque}>
            <label>Bloque {bloque} (corta)</label>
            <textarea
              name={bloque}
              value={plan[bloque] || ""}
              onChange={handleChange}
              rows={3}
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
            {loading ? "Guardando..." : "Guardar Corta"}
          </button>

          <button
            type="button"
            className="btn-eliminar"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </form>

      <div
        style={{ marginTop: "15px", display: "flex", justifyContent: "center" }}
      >
        <button className="link-btn" onClick={() => navigate("/usuarioPages")}>
          Volver al inicio
        </button>
      </div>
    </div>
  );
};
