import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { SettingsProvider } from "./lib/settings";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Coin from "./pages/Coin";
import Exchanges from "./pages/Exchanges";
import Guide from "./pages/Guide";
import NotFound from "./pages/NotFound";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <SettingsProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="coin/:id" element={<Coin />} />
            <Route path="exchanges" element={<Exchanges />} />
            <Route path="guide" element={<Guide />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SettingsProvider>
  </React.StrictMode>
);
