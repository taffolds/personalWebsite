import React from "react";
import Banner from "./banner.js";
import styles from "./frontPage.module.css";

export function FrontPage() {
  return (
    <>
      <Banner />
      <div className={styles.container}>
        <h1>Welcome!</h1>
        <div className={styles.pnpContainer}>
          <p className={styles.section}>
            You have reached my personal website. My name is Thomas, and I am
            currently a student learning programming. I have made this website
            in large part because I've always wanted to have my own website.
            Currently you can play four in a row here, but not much else. I will
            add functionality as I go along. I play in a band, and I love music.
            I've taken part in recording an album with{" "}
            {/* wtf Spotify... my formatting... */}
            <a
              href={`https://open.spotify.com/artist/15fKxF3j1ElSJjh4d87Bn6?si=lAdsGtbZQ2ucHNvyHrXZFw`}
            >
              Død Drøm
            </a>{" "}
            (pictured), and I currently play in local Oslo band{" "}
            <a
              href={`https://open.spotify.com/artist/3z0rH1FC0ZuHOv6oWVyCvZ?si=kriwGEl0TymgXZ6xGf5Ngg`}
            >
              Alle Gode Ting
            </a>
            . I get a lot of enjoyment out of playing music with others and
            sharing that passion with other musicians.
          </p>
          <img
            className={styles.image}
            src={"/homepage/BandPicture.jpg"}
            alt={"Picture of me playing a concert"}
            loading={"lazy"}
          />
        </div>
        <div className={`${styles.pnpContainer} ${styles.prettyPics}`}>
          <img
            className={styles.image}
            src={"/homepage/Snowboard.jpg"}
            alt={"Me on the top of Wyller"}
            loading={"lazy"}
          />
          <p className={styles.section}>
            I also really enjoy getting out and exercising. In the summer I
            can't get enough of biking. And in the winter I have a blast
            snowboarding. I really like having an activity that is bound to each
            season, because in a country like Norway, with these long winters,
            it's a good idea to have something to look forward to when it's
            minus degrees and the daylight briefly pops by to say hello for five
            minutes a day.
          </p>
        </div>
        <div className={styles.pnpContainer}>
          <p className={styles.section}>
            This website is a continuous work in progress. I will keep
            maintaining and improving this website indefinitely. I already have
            some plans as to what I want to add. Please contact me if you find
            any bugs or issues! If there are layout/interface problems, you can
            also let me know. I'm available here:{" "}
            <a href={"mailto:thomasltellefsen@gmail.com"}>
              thomasltellefsen@gmail.com
            </a>
          </p>
          <img
            className={styles.image}
            src={"/homepage/Hiking.jpg"}
            alt={"In nature with perfect company"}
            loading={"lazy"}
          />
        </div>
      </div>
    </>
  );
}
