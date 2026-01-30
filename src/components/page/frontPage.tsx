import React from "react";
import Banner from "./banner.js";
import styles from "./frontPage.module.css";

export function FrontPage() {
  return (
    <>
      <Banner />
      <div className={styles.container}>
        <h1>Hello World!</h1>
        <p className={styles.section}>
          Or rather hello friends, the odds of you stumbling across this page
          without knowing me are absolutely minimal.
        </p>
        <p className={styles.section}>
          This website is a collection of my personal projects that I do for
          fun. All source code is found here! (Note to self, don't forget to
          actually do this...)
        </p>
        <p className={styles.section}>
          Please contact me if you find any bugs or issues! If there are
          layout/interface problems, do not hesitate to contact me here:{" "}
          <a href={"mailto:thomasltellefsen@gmail.com"}>
            thomasltellefsen@gmail.com
          </a>
        </p>
      </div>
    </>
  );
}
