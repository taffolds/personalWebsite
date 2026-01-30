import React from "react";
import Banner from "./banner.js";

export function AboutDevelopment() {
  return (
    <>
      <Banner />
      <h1>About Four in a Row</h1>
      <p>
        I first tried to program this game, but I ended up hard coding all the
        winning variables. I brought it to my teacher at the time. And he wrote
        the first code where it just checked if two horizontal pieces next to
        each other was a win.
      </p>
      <p>
        I then took this initial code (which didn't yet work) and set up tests
        for two pieces next to each other validating as a win. Once the tests
        passed, I created new tests for further win conditions.
      </p>
      <p>
        It was an interesting experience being able to do TDD, and it was fun
        knowing that if my tests passed, I wouldn't have to manually test the
        game by clicking the board in the browser.
      </p>
      <p>
        The next step was fixing OAuth. I have done login with Google before, so
        this wasn't too difficult. The real challenge this time round was
        storing the refresh token, and doing so safely. I have been curious
        about encrypting user data for a while, and decided to use AES-256 GCM
        just for the sake of being able to verify the authenticity of the
        encrypted data. It's not like anyone is really going to care about the
        refresh tokens on my tiny website, but it was good practice (and a pain
        in the backside to understand).
      </p>
      <p>
        Next came the realisation that this looked like my Spring Boot projects,
        so I decided to attempt to use the MVC model in the backend. I wanted to
        remove the business logic from the server endpoints, and into the
        services. This was a gradual refactoring process.
      </p>
    </>
  );
}
