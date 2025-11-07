const getState = ({ getStore, getActions, setStore }) => {
  return {
    store: {
      message: null,
      user: JSON.parse(localStorage.getItem("user")) || null,
      token: localStorage.getItem("token") || null,
    },

    actions: {
      // Ejemplo existente
      exampleFunction: () => {
        getActions().changeColor(0, "green");
      },

      // --- Login exitoso ---
      loginUser: (user, token) => {
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("token", token);
        setStore({
          user: user,
          token: token,
        });
      },

      // --- Logout ---
      logoutUser: () => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setStore({
          user: null,
          token: null,
        });
        window.location.href = "/";
      },

      // --- Cargar usuario si hay token guardado ---
      loadUserFromToken: async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
          const res = await fetch(
            "http://https://forceteam.onrender.com/api/usuario",
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const data = await res.json();

          if (res.ok && data.user) {
            setStore({
              user: data.user,
              token: token,
            });
            localStorage.setItem("user", JSON.stringify(data.user));
          } else {
            getActions().logoutUser();
          }
        } catch (error) {
          console.error("Error cargando usuario:", error);
          getActions().logoutUser();
        }
      },

      // --- Función de login con fetch dentro ---
      loginFetch: async (email, password) => {
        try {
          const response = await fetch(
            "http://https://forceteam.onrender.com/api/login",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, password }),
            }
          );

          const data = await response.json();

          if (response.ok) {
            getActions().loginUser(data.user, data.token);
            window.location.href = "/usuario";
          } else {
            alert(data.error || "Error en login");
          }
        } catch (error) {
          console.error("Error en login:", error);
          alert("Error en login, revisa la consola");
        }
      },
    },
  };
};

export default getState;
