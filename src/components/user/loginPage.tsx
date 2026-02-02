import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Banner from "../page/banner.js";
import { useUser } from "../../contexts/UserContext.js";
import styles from "./loginPage.module.css";

export function LoginPage() {
  const { profile, loading } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (profile && !loading) {
      const timer = setTimeout(() => {
        navigate("/profile");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [profile, loading, navigate]);

  if (profile) {
    return <h1>Already logged in! Redirecting...</h1>;
  }

  return (
    <>
      <Banner />
      <div className={styles.container}>
        <p>
          By logging in, you consent to me storing your email. If you create a
          nickname, I will also store this. If you play a game with a friend, I
          will store the game in the database. This is the only information I
          will store about you. You can look at my code for all the information
          that gets stored in the database. I've tried to keep it as minimal as
          possible.
        </p>
        <a href="/api/user/login/start">
          <img
            src="https://developers.google.com/static/identity/images/branding_guideline_sample_nt_rd_lg.svg"
            alt="Login with Google"
          />
        </a>
        <p>
          You can delete all this information at any time after logging in.
          <ul>
            <li>
              <a href="https://gdpr-info.eu/art-17-gdpr/" target="_blank">
                Know your rights.
              </a>
            </li>
            <li>
              <a href="https://shoshanazuboff.com/book/about/" target="_blank">
                Know what they know.
              </a>
            </li>
          </ul>
        </p>
      </div>
    </>
  );
}
