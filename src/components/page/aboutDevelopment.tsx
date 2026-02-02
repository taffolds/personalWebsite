import React from "react";
import Banner from "./banner.js";
import styles from "./aboutDevelopment.module.css";

export function AboutDevelopment() {
  return (
    <>
      <Banner />
      <div className={styles.container}>
        <h1>About Development</h1>
        <details className={styles.section}>
          <summary>
            <h3>Initial Game Development</h3>
          </summary>
          <p>
            When I first tried to program this game I ended up hard coding all
            the winning variables. I brought it to my teacher at the time. And
            he wrote the first code where it just checked if two horizontal
            pieces next to each other was a win. I then took this initial code
            (which didn't yet work) and set up tests for two pieces next to each
            other validating as a win. Once the tests passed, I created new
            tests for further win conditions.
          </p>
          <p>
            I kept this going back and forth, which can be seen in the earliest
            commits in this repository. I always wrote the tests before writing
            any logic, though that isn't always visible in the commits as I got
            a little eager. It was an interesting experience trying out TDD, and
            it was fun knowing that if my tests passed, I wouldn't have to
            manually test the game by clicking the board in the browser.
          </p>
        </details>
        <details open className={styles.section}>
          <summary>
            <h3>OAuth - testTxtOpen</h3>
          </summary>
          <p>
            The next step was fixing OAuth. I have done login with Google
            before, so this wasn't too difficult. The real challenge this time
            round was storing the refresh token, and doing so safely. I have
            been curious about encrypting user data for a while, and decided to
            use AES-256 GCM just for the sake of being able to verify the
            authenticity of the encrypted data. It's not like anyone is really
            going to care about the refresh tokens on my tiny website, but it
            was good practice (and a pain in the backside to understand). I
            wanted to store the minimal amount of data possible from the user as
            well, so I only requested the email and planned to use this as well
            as the unique GoogleId to store information needed for verifying the
            user against my database.
          </p>
        </details>
        <details className={styles.section}>
          <summary>
            <h3>Database</h3>
          </summary>
          <p>
            I did spend some time trying to normalise a database to hold
            information about a user. I needed to track a few things on my
            website to make it work. The user is the obvious central entity,
            with everything connecting to the user entity. I needed to handle
            refresh tokens, friend requests, which users are friends with each
            other, and sending friend requests (as well as blocking requests, in
            case some troll discovers my site and continuously sends requests).
          </p>
          <p>
            I also wanted to be able to view earlier games with friends, so I
            had to make a table to store games. This also meant tracking the
            state of the game. For example if Alice and Bob have an active game,
            I don't want them to be able to request a new game. If they have a
            game that has been completed, then they need that possibility. I
            tried go through all these possibilities so that I would only have
            to make the one schema, and get it right the first time. Knowing
            what data you are persisting, and why, helps make better endpoints
            and debug messages to the user later. Now if only I wrote it all
            down in one place, instead of scattered in word documents, comments
            in the ER diagram, in my head, etc... Solo projects have their
            charm.
          </p>
        </details>
        <details className={styles.section}>
          <summary>
            <h3>Orchestration</h3>
          </summary>
          <p>
            Next came the realisation that this looked like my Spring Boot
            projects, so I decided to attempt to use the MVC model in the
            backend. I wanted to remove the business logic from the server
            endpoints, and into the services. Whilst trying to keep the code to
            single responsibilities, and keeping as much logic out of the
            userServer as possible, I discovered the concept orchestration. To
            keep my code as clean as possible, as well as make it testable, I
            made the decision to refactor as much as possible straight away and
            plan ahead mentally for the coming interaction and game code.
          </p>
        </details>
      </div>
    </>
  );
}
