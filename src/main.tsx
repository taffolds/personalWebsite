import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { FrontPage } from "./components/frontPage.js";
import { NotFoundPage } from "./components/notFoundPage.js";
import { FourInARow } from "./components/fourInARow.js";

function Application() {
  return (
    <Routes>
      <Route path={"/"} element={<FrontPage />} />
      <Route path={"/fourInARow"} element={<FourInARow />} />
      <Route path={"*"} element={<NotFoundPage />} />
    </Routes>
  );
}

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Application />
  </BrowserRouter>,
);
