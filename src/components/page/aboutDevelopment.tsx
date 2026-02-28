import React from "react";
import Banner from "./banner.js";
import styles from "./aboutDevelopment.module.css";

export function AboutDevelopment() {
  return (
    <>
      <Banner />
      <div className={styles.container}>
        <h1>About Development</h1>
        <p className={styles.intro}>
          This is the development process for my website. I have recently
          learned how to make a React app for my exam, and I wanted to expand
          upon the knowledge I learned there to make a website that allows you
          to play four in a row. Funnily enough, my initial intention was to
          just create the game, and the reason I picked TypeScript was to have
          the ease of styling the game board in CSS. It slowly dawned on me that
          I could turn the game into a website. I never thought coding the game
          would be the beginning of a long full stack adventure.
        </p>
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
        <details className={styles.section}>
          <summary>
            <h3>OpenID, cookies and tokens</h3>
          </summary>
          <p>
            The next step was fixing OAuth. I have done login with Google
            before, so this wasn't too difficult. The challenge this time round
            was keeping the user validated for more than one hour. This was new
            to me. At first I stored the refresh token cryptographically in my
            database. However this resulted in making many calls to Google's API
            to validate the user on.
          </p>
          <p>
            This was maybe one of the most painful refactors I have ever done,
            because I had spent two whole days understanding how to use my own
            symmetric key to store users' refresh tokens safely. What would be
            even worse than this though would be to keep useless code around
            because I think it looks cool.
          </p>
          <p>
            I decided I would issue cookies myself with Hono. On my first try, I
            just used their normal setCookie using the stored user id in the
            database. All seemed good, a user was validated for 30 days on my
            website. Not only that, but if they got logged out, they could log
            in again to the same account using their google sub to validate the
            user in my database, and then get a new cookie for 30 days. Then I
            looked at the payload, saw that the cookie was just id: 1.
          </p>
          <p>
            I sent a Postman request with Cookie: id: 1 to change the nickname
            of that user, lo and behold, nothing was secure again. Lovely. I
            found that Hono had a function to sign the cookie. I set up another
            encryption key to sign this cookie, and now the cookie contained
            enough random characters that no one's changing anyone else's name
            any more.
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
            friend requests, which users are friends with each other, as well as
            game requests and the games themselves.
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
            charm. Having modelled it out and spent some time planning, using
            the database to map opponents names to the games became very easy.
          </p>
          <p>
            As I moved on in the project, a few columns did get altered. I also
            realised I don't want to implement all the functionality at once,
            though I do want to implement it with time. As an example, being
            able to block people won't really be that big of an issue on my
            website, more a fun coding challenge. I reckon I'll flesh it out
            after the semester.
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
          <p>
            Once I knew what the backend structure would look like for the
            userService, and userServer, I wrote tests for for both files. Now
            that I had the structure and tests in mind, I decided to go back to
            test driven development for the friendship part of the app. I
            started by writing tests for all the calls I knew my service would
            need to do on the database. Then I wrote all the code to make these
            tests pass in the service. Then came the controller. The magic with
            doing TTD on an orchestration service is that you really have to
            think about what you want the behaviour of the backend to be and
            since I am doing the full stack for this, I could also make mental
            as to what kind of error messages the user should receive in the
            front end once the backend was done, as well as what they just
            shouldn't be able access.
          </p>
          <p>
            The final piece came together in a coding frenzy on the train from
            Oslo to Bergen. Rarely do you hope the seven and a half hour train
            ride would last a little longer so you can wrap up what you are
            doing. It was ugly patchwork code, but now that I had all the
            frontend and backend set up to start playing games and I knew what I
            wanted the structure and tests to look like, I really just wanted to
            piece it all together, even though it meant a bit of duct taping.
            Mind you, my favourite part isn't writing the functioning code,
            because that can be a mess and work, but the first refactor is my
            favourite part, because now it's doing what it's meant to, just
            better.
          </p>
          <p>
            I manually tested the code by clicking on the frontend, and it all
            was working together well. I proceeded through the same steps as
            earlier, writing tests for the gameService. Then I made tests for
            the gameServer. This was the chance to really check for any
            oversights commited during the coding frenzy on the train, and make
            sure it was robust. Having the tests in place allowed me to safely
            refactor the game related code. Once this was done I refactored
            tests to be more robust.
          </p>
        </details>
      </div>
    </>
  );
}
