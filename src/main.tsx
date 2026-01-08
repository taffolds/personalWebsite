import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { FrontPage } from "./components/frontPage.js";

function Application() {
  return (
    <Routes>
      <Route path={"/"} element={<FrontPage />} />
    </Routes>
  );
}

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Application />
  </BrowserRouter>,
);
