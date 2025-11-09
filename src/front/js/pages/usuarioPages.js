import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Usuario } from "../component/usuario";

export const UsuarioPages = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem("token");

    if (!storedToken) {
      navigate("/");
      return;
    }

    setToken(storedToken);

    const fetchUser = async () => {
      try {
        const res = await fetch(
          "http://localhost:3001/api/usuario",
          {
            headers: { Authorization: `Bearer ${storedToken}` },
          }
        );

        if (!res.ok) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/");
          return;
        }

        const data = await res.json();
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
      } catch (err) {
        console.error(err);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
      }
    };

    fetchUser();
  }, [navigate]);

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  if (!user || !token) return null;
;

  return <Usuario user={user} token={token} onUserUpdate={handleUserUpdate} />;
};
