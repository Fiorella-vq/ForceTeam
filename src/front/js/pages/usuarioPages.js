import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Usuario } from "../component/usuario";

export const UsuarioPages = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/usuario", {
          headers: {
            Authorization: "Bearer " + token,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          localStorage.removeItem("token");
          navigate("/");
        }
      } catch (error) {
        console.error("Error al obtener usuario:", error);
        navigate("/");
      }
    };

    fetchUser();
  }, [navigate]);

  return <Usuario user={user} />;
};
