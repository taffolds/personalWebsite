import React from "react";
import Banner from "./banner.js";

export function AboutFourInARow() {
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
    </>
  );
}
