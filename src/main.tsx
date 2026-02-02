import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { UserProvider } from "./contexts/UserContext.js";
import { FrontPage } from "./components/page/frontPage.js";
import { NotFoundPage } from "./components/page/notFoundPage.js";
import { FourInARow } from "./components/page/fourInARow.js";
import { AboutDevelopment } from "./components/page/aboutDevelopment.js";
import { ProfilePage } from "./components/user/profilePage.js";
import { LogoutPage } from "./components/user/logoutPage.js";
import { LoginPage } from "./components/user/loginPage.js";

function Application() {
  return (
    <Routes>
      <Route path={"/"} element={<FrontPage />} />
      <Route path={"/fourInARow"} element={<FourInARow />} />
      <Route path={"/aboutDevelopment"} element={<AboutDevelopment />} />
      <Route path={"/profile"} element={<ProfilePage />} />
      <Route path={"/login"} element={<LoginPage />} />
      <Route path={"/logout"} element={<LogoutPage />} />
      <Route path={"*"} element={<NotFoundPage />} />
    </Routes>
  );
}

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <UserProvider>
      <Application />
    </UserProvider>
  </BrowserRouter>,
);
