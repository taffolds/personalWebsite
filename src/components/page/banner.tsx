import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import styles from "./banner.module.css";
import { useUser } from "../../contexts/UserContext.js";

// https://dev.to/nicm42/closing-a-navigation-menu-in-react-8ad
// https://github.com/nicm42/The-Newport-Group/blob/main/src/js/components/Nav.js

const Banner = () => {
  const { profile } = useUser();
  // const profile = {nickname: "OOOOOOOOOOOOOOO", email: "memail@com", id: 1};
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isGamePage = location.pathname.startsWith("/fourInARow");
  const isLoginPage = location.pathname === "/login";
  const isProfilePage = location.pathname === "/profile";
  const toggle = () => setIsOpen(!isOpen);
  const hide = () => setIsOpen(false);
  const show = () => setIsOpen(true);

  useEffect(() => {
    const closeMenu = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", closeMenu);
    return () => {
      window.removeEventListener("keydown", closeMenu);
    };
  }, []);

  const targetRef = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    if (targetRef.current) {
      if (isGamePage) {
        document.body.style.marginTop = "0px";
        document.body.style.marginLeft = targetRef.current.offsetWidth + "px";
      } else {
        document.body.style.marginLeft = "0px";
        document.body.style.marginTop = targetRef.current.offsetHeight + "px";
      }
    }
  }, [isGamePage]);

  const navigation = [
    profile
      ? { link: "/profile", text: "Profile" }
      : { link: "/login", text: "Login" },
    { link: "/", text: "Home" },
    { link: "/gameSelector", text: "Four in a Row" },
    { link: "/aboutDevelopment", text: "About Development" },
  ];

  return (
    <nav ref={targetRef} className={`${styles.nav} ${styles.topbar}`}>
      <button className={styles.menuToggle} onClick={toggle}>
        <span className={`${styles.menu} ${isOpen ? styles.cross : ""}`}></span>
      </button>
      <ul className={`${styles.menuLinks} ${isOpen ? styles.show : ""}`}>
        {navigation.map((nav) => (
          <li key={nav.text}>
            <NavLink
              to={nav.link}
              onClick={hide}
              onBlur={hide}
              onFocus={show}
              className={({ isActive }) => (isActive ? styles.active : "")}
            >
              {nav.text}
            </NavLink>
          </li>
        ))}
        {profile && (
          <li>
            <a className={styles.logoutField} href={"api/user/logout/start"}>
              Logout
            </a>
          </li>
        )}
      </ul>
      {!isGamePage && (
        <div className={styles.userSection}>
          {profile ? (
            !isProfilePage && (
              <NavLink to="/profile">
                {profile.nickname ? (
                  <div>Hello, {profile.nickname}</div>
                ) : (
                  <div>Welcome!</div>
                )}
              </NavLink>
            )
          ) : !isLoginPage ? (
            <a href={"/login"}>Login</a>
          ) : null}
        </div>
      )}
    </nav>
  );
};

export default Banner;
