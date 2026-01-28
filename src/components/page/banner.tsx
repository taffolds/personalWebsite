import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import styles from "./banner.module.css";
import { useUser } from "../../contexts/UserContext.js";

// https://dev.to/nicm42/closing-a-navigation-menu-in-react-8ad
// https://github.com/nicm42/The-Newport-Group/blob/main/src/js/components/Nav.js

const Banner = () => {
  const { profile } = useUser();
  const [isOpen, setIsOpen] = useState(false);
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
      document.body.style.marginTop = targetRef.current.offsetHeight + "px";
    }
  });

  const navigation = [
    { link: "/", text: "Home" },
    { link: "/fourInARow", text: "Four in a Row" },
    { link: "/aboutFourInARow", text: "Four in a Row Development" },
  ];

  return (
    <nav ref={targetRef}>
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
            <a href={"api/user/logout/start"}>Logout</a>
          </li>
        )}
      </ul>
      <div className={styles.userSection}>
        {!profile ? (
          <a href={"/api/user/login/start"}>Login</a>
        ) : (
          <NavLink to="/profile">
            {/*Need a better greeting, either username, or something else than email if no email is set*/}
            Hello, {profile.email}
          </NavLink>
        )}
      </div>
    </nav>
  );
};

export default Banner;
