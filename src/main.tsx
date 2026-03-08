import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { UserProvider } from "./contexts/UserContext.js";
import { FrontPage } from "./components/page/frontPage.js";
import { NotFoundPage } from "./components/page/notFoundPage.js";
import { FourInARow } from "./components/game/fourInARow.js";
import { AboutDevelopment } from "./components/page/aboutDevelopment.js";
import { ProfilePage } from "./components/user/profilePage.js";
import { LogoutPage } from "./components/user/logoutPage.js";
import { LoginPage } from "./components/user/loginPage.js";
import { DeletedUserPage } from "./components/user/deletedUser.js";
import { FourInARowOffline } from "./components/game/fourInARowOffline.js";
import { GameSelector } from "./components/game/gameSelector.js";
import { UserGames } from "./components/game/userGames.js";
import { Toaster } from "react-hot-toast";

function Application() {
  return (
    <>
      <Toaster
        toastOptions={{
          style: {
            fontFamily: "Bahnschrift, sans-serif",
            width: "fit-content",
            textAlign: "center",
          },
        }}
      />
      <Routes>
        <Route path={"/"} element={<FrontPage />} />
        <Route path={"/gameSelector"} element={<GameSelector />} />
        <Route path={"/userGames"} element={<UserGames />} />
        <Route path={"/fourInARow/:gameId"} element={<FourInARow />} />
        <Route path={"/fourInARowOffline"} element={<FourInARowOffline />} />
        <Route path={"/aboutDevelopment"} element={<AboutDevelopment />} />
        <Route path={"/profile"} element={<ProfilePage />} />
        <Route path={"/login"} element={<LoginPage />} />
        <Route path={"/logout"} element={<LogoutPage />} />
        <Route path={"/deleted"} element={<DeletedUserPage />} />
        <Route path={"*"} element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <UserProvider>
      <Application />
    </UserProvider>
  </BrowserRouter>,
);
