import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import "../../styles/planifica.css";

// Función para extraer URLs de un texto
const extractUrls = (text) => {
  if (!text) return [];
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
};

// Fecha hoy en formato YYYY-MM-DD
const getTodayString = () => {
  const today = new Date();
  return today.toISOString().split("T")[0];
};

export const PlanificacionCoach = () => {
  const [fecha, setFecha] = useState(getTodayString());
  const [plan, setPlan] = useState({ A: "", B: "", C: "", D: "" });
  const [wods, setWods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [verComoAtleta, setVerComoAtleta] = useState(false);

  const token = localStorage.getItem("token")?.trim();
  const user_id = localStorage.getItem("user_id"); // asegurarse de tener el user_id guardado
  const navigate = useNavigate();

  // Cargar planificación
  const fetchPlanificacion = async (fechaParam) => {
    if (!fechaParam || !token) return;
    try {
      const res = await fetch(
        `http://localhost:3001/api/planificacion?fecha=${fechaParam}`,
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

  // Cargar WODs del usuario
  const fetchWods = async () => {
    if (!token || !user_id) return;
    try {
      const res = await fetch(`http://localhost:3001/api/users/${user_id}/wods`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        // Filtrar por fecha seleccionada
        const wodsHoy = data.filter((w) => w.fecha === fecha);
        setWods(wodsHoy);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPlanificacion(fecha);
    if (verComoAtleta) fetchWods();
  }, [fecha, verComoAtleta]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPlan((prev) => ({ ...prev, [name]: value }));
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
        body: JSON.stringify({ fecha, plan }),
      });
      const data = await res.json();

      if (res.ok) {
        Swal.fire("¡Guardado!", "Planificación registrada.", "success");
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
      text: `Se eliminará la planificación de la fecha ${fecha}.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return;

    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:3001/api/planificacion?fecha=${fecha}`,
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

  return (
    <div className="planificacion-container">
      <h2>Planificación Diaria</h2>

      {/* Botón modo coach / atleta */}
      <div style={{ marginBottom: "15px", display: "flex", justifyContent: "center" }}>
        <button
          className="button-atleta"
          onClick={() => setVerComoAtleta(!verComoAtleta)}
        >
          {verComoAtleta ? "Volver a modo Coach" : "Ver como Atleta"}
        </button>
      </div>

      {/* Selector de fecha */}
      <div style={{ marginBottom: "15px", display: "flex", justifyContent: "center" }}>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          required
        />
      </div>

      {/* Modo atleta: solo lectura */}
      {verComoAtleta ? (
        <div className="planificacion-atleta">
          {["A", "B", "C", "D"].map((bloque) => (
            <div key={bloque}>
              <h4>Bloque {bloque}</h4>
              <div className="bloque-lectura">{plan[bloque] || "-"}</div>
              <div className="links-block">
                {extractUrls(plan[bloque]).map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer">{url}</a>
                ))}
              </div>
            </div>
          ))}

          {/* Mostrar WODs del día */}
          {wods.length > 0 && (
            <div className="wods-atleta">
              <h3>WODs del día</h3>
              {wods.map((wod) => (
                <div key={wod.id} className="wod-card">
                  <p><strong>Descripción:</strong> {wod.descripcion}</p>
                  <p><strong>Cómo lo realizaste:</strong> {wod.como_realizo}</p>
                  <p><strong>Sentimiento:</strong> {wod.sentimiento}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Modo coach: edición */
        <form className="planificacion-form" onSubmit={handleSubmit}>
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
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer">{url}</a>
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
      )}

      {/* Botón volver al inicio */}
      <div style={{ marginTop: "10px", display: "flex", justifyContent: "center" }}>
        <button type="button" className="link-btn" onClick={() => navigate("/usuarioPages")}>
          Volver al inicio
        </button>
      </div>
    </div>
  );
};
