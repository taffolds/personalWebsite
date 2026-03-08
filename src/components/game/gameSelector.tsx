import { useRef } from "react";
import Banner from "../page/banner.js";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../contexts/UserContext.js";
import styles from "./gameSelector.module.css";

export function GameSelector() {
  const { profile } = useUser();
  const navigate = useNavigate();
  const dialogRef = useRef<HTMLDialogElement>(null);

  const handleOnlineClick = () => {
    if (!profile) {
      dialogRef.current?.showModal();
      return;
    }
    navigate("/userGames");
  };

  return (
    <>
      <Banner />
      <div className={styles.wrapper}>
        <h1>Four in a Row</h1>
        <p>
          You can play Four in a Row here. You can either choose to play
          offline, or you can play online with your friends! Select your game
          mode below.
        </p>
        <div className={styles.btnContainer}>
          <button
            className={`${styles.generalBtn} ${styles.onlineBtn}`}
            onClick={() => handleOnlineClick()}
          >
            Online
          </button>
          <button
            className={`${styles.generalBtn} ${styles.offlineBtn}`}
            onClick={() => navigate("/fourInARowOffline")}
          >
            Offline
          </button>
        </div>
        <dialog ref={dialogRef}>
          <p>Must be logged in to access this page</p>
          <button onClick={() => navigate("/login")}>Login</button>
          <button onClick={() => dialogRef.current?.close()}>Close</button>
        </dialog>
      </div>
    </>
  );
}
