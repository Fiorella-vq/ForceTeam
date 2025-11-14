import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import ScrollToTop from "./component/scrollToTop";
import { BackendURL } from "./component/backendURL";

import { Home } from "./pages/home";
import { Demo } from "./pages/demo";
import { Single } from "./pages/single";
import injectContext from "./store/appContext"; 
import { UsuarioPages } from "./pages/usuarioPages";

import { Navbar } from "./component/navbar";
import { Footer } from "./component/footer";
import { Register } from "./component/register"; 
import {PlanificacionCoach} from "./component/planificaCoach";
import { Usuario } from "./component/usuario"; 
import {PlanificacionViewer} from './component/planificacionViewer';
import { ForgotPassword } from "./component/forgotPassword";
import { ResetPassword } from "./component/resetPassword";
import { PlanificaCorta } from "./component/planificaCorta";



const Layout = () => {
  const basename = process.env.BASENAME || "";

  if(!process.env.BACKEND_URL || process.env.BACKEND_URL === "") return <BackendURL />;

  return (
    <div>
      <BrowserRouter basename={basename}>
        <ScrollToTop>
          <Navbar />
          <Routes>
            <Route element={<Home />} path="/" />
            <Route element={<Demo />} path="/demo" />
            <Route element={<Single />} path="/single/:theid" />
            <Route element={<Register />} path="/register" />
            <Route element={<UsuarioPages />} path="/usuarioPages" />
            <Route element={<Usuario />} path="/usuario" />
            <Route element={<PlanificacionCoach />} path="/planificaCoach" />
            <Route element={<PlanificacionViewer />} path="/planificacionViewer" />
            <Route element={<ForgotPassword />} path="/forgot-password" />  
            <Route element={<ResetPassword />} path="/reset-password" />
            <Route element={<PlanificaCorta />} path="/planificaCorta" />
            <Route element={<h1>Not found!</h1>} />
          </Routes>
          <Footer />
        </ScrollToTop>
      </BrowserRouter>
    </div>
  );
};

export default injectContext(Layout);
