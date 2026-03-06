import React from "react";
import { Link } from "react-router-dom";
import Banner from "./banner.js";
import styles from "./notFoundPage.module.css";

export function NotFoundPage() {
  return (
    <>
      <Banner />
      <div className={styles.wrapper}>
        <h3>Couldn't find this page</h3>
        <Link to={"/"}>
          <p>Back to homepage</p>
        </Link>
      </div>
    </>
  );
}
