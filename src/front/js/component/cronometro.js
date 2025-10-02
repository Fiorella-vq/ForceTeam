import React, { useState, useEffect, useRef } from "react";
import "../../styles/usuario.css";

export const Cronometro = () => {
  const [tipo, setTipo] = useState("AMRAP");
  const [minutos, setMinutos] = useState(5);
  const [segundos, setSegundos] = useState(0);
  const [running, setRunning] = useState(false);
  const [ronda, setRonda] = useState(1);
  const [totalRondas, setTotalRondas] = useState(5);
  const [tiempoRestante, setTiempoRestante] = useState(minutos * 60 + segundos);
  const [preCountdown, setPreCountdown] = useState(10); // cuenta regresiva inicial

  const intervalRef = useRef(null);

  // Sonidos
  const beep = useRef(new Audio("https://www.soundjay.com/buttons/sounds/beep-07.mp3")); // pip pip
  const go = useRef(new Audio("https://www.soundjay.com/buttons/sounds/button-3.mp3")); // GO
  const alertEnd = useRef(new Audio("https://www.soundjay.com/buttons/sounds/beep-10.mp3")); // 10s final
  const bell = useRef(new Audio("https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3")); // campana final

  const configurarTiempo = () => {
    if (tipo === "EMOM") {
      setTiempoRestante(60);
    } else {
      setTiempoRestante(minutos * 60 + segundos);
    }
    setRonda(1);
    setPreCountdown(10);
  };

  const formatTime = (t) => {
    const m = Math.floor(t / 60);
    const s = t % 60;
    return `${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;
  };

  // Cronómetro
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        // Cuenta regresiva inicial
        setPreCountdown((prev) => {
          if (prev > 0) {
            beep.current.play();
            return prev - 1;
          } else if (prev === 0) {
            go.current.play();
            setPreCountdown(-1);
            return -1;
          }
          return prev;
        });

        // Tiempo del WOD
        if (preCountdown <= -1) {
          setTiempoRestante((prev) => {
            if (prev <= 0) {
              bell.current.play();
              if (tipo === "EMOM") {
                if (ronda < totalRondas) {
                  setRonda(ronda + 1);
                  return 60;
                } else {
                  setRunning(false);
                  return 0;
                }
              } else {
                setRunning(false);
                return 0;
              }
            }

            // alerta 10 segundos antes del final
            if (prev === 10) {
              alertEnd.current.play();
            }

            return prev - 1;
          });
        }
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, preCountdown, tipo, ronda, totalRondas]);

  const reset = () => {
    clearInterval(intervalRef.current);
    setRunning(false);
    configurarTiempo();
  };

  return (
    <div className="timer-container">
      <h2>Smart WOD Timer</h2>

      <div className="timer-controls">
        <label>Tipo de WOD:</label>
        <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="AMRAP">AMRAP</option>
          <option value="FOR TIME">FOR TIME</option>
          <option value="EMOM">EMOM</option>
        </select>
      </div>

      {tipo !== "EMOM" && (
        <div className="timer-inputs">
          <input
            type="number"
            min="0"
            placeholder="Minutos"
            value={minutos}
            onChange={(e) => setMinutos(Number(e.target.value))}
          />
          <input
            type="number"
            min="0"
            max="59"
            placeholder="Segundos"
            value={segundos}
            onChange={(e) => setSegundos(Number(e.target.value))}
          />
          <button onClick={configurarTiempo}>Set</button>
        </div>
      )}

      {tipo === "EMOM" && (
        <div className="timer-inputs">
          <input
            type="number"
            min="1"
            placeholder="Total de rondas"
            value={totalRondas}
            onChange={(e) => setTotalRondas(Number(e.target.value))}
          />
          <button onClick={configurarTiempo}>Set EMOM</button>
        </div>
      )}

      {/* Display */}
      {preCountdown > 0 && <div className="time-display">Prep: {preCountdown}</div>}
      {preCountdown <= 0 && <div className={`time-display ${running ? "running" : ""}`}>{formatTime(tiempoRestante)}</div>}

      {tipo === "EMOM" && preCountdown <= 0 && (
        <p className="ronda-display">Ronda: {ronda}/{totalRondas}</p>
      )}

      <div className="timer-buttons">
        {!running && <button onClick={() => setRunning(true)}>Iniciar</button>}
        {running && <button onClick={() => setRunning(false)}>Pausar</button>}
        <button onClick={reset}>Reset</button>
      </div>
    </div>
  );
};
