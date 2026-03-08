import React from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./loadingWrapper.module.css";

interface LoadingContent {
  loading: boolean;
  error?: string | null;
  children: ReactNode;
}

export function LoadingWrapper({ loading, error, children }: LoadingContent) {
  const navigate = useNavigate();

  const handleRetry = () => {
    // Note to self, this is equivalent of saying navigate to current location
    // It is used to represent the browser's history stack, so 0 is the same
    // place that the browser is currently in.
    navigate(0);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingRectangles}>
          <div className={`${styles.rectangle} ${styles.rectangleOne}`}></div>
          <div className={`${styles.rectangle} ${styles.rectangleTwo}`}></div>
          <div className={`${styles.rectangle} ${styles.rectangleThree}`}></div>
        </div>
        <p className={styles.feedbackTxt}>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.errorMessage}>
          <h3>Couldn't load page</h3>
          <p className={styles.feedbackTxt}>{error}</p>
        </div>
        <button className={styles.retryBtn} onClick={handleRetry}>
          Retry
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
