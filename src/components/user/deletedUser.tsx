import { useEffect, useState } from "react";
import Banner from "../page/banner.js";
import { useUser } from "../../contexts/UserContext.js";
import styles from "./deletedUser.module.css";

export function DeletedUserPage() {
  const { profile } = useUser();
  const [timeLeft, setTimeLeft] = useState(30);

  if (profile) return (window.location.href = "/");

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((countdown) => {
        if (countdown <= 1) {
          clearInterval(timer);
          window.location.href = "/";
        }
        return countdown - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <Banner />
      <div className={styles.wrapper}>
        <h3>You have deleted your user</h3>
        <p>Redirecting to home page in {timeLeft}</p>
        <p>
          <a href={"/"}>Go now</a>
        </p>
      </div>
    </>
  );
}
