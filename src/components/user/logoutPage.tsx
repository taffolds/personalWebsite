import { useEffect } from "react";
import Banner from "../page/banner.js";
import styles from "./logoutPage.module.css";

export function LogoutPage() {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = "/";
    }, 1500);

    return () => clearTimeout(timer);
  }, []); // note to self, this stops issues when clicking back button during redirection

  return (
    <>
      <Banner />
      <div className={styles.wrapper}>
        <h1>You have been logged out</h1>
        <p>Redirecting to homepage</p>
      </div>
    </>
  );
}
