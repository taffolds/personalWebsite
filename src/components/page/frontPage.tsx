import React from "react";
import Banner from "./banner.js";

export function FrontPage() {
  return (
    <>
      <Banner />
      <h1>Hello World!</h1>
      <p>
        Or rather hello friends, the odds of you stumbling across this page
        without knowing me are absolutely minimal.
      </p>
      <p>
        This website is a collection of my personal projects that I do for fun.
        All source code will be linked on the various pages. (Note to self,
        don't forget to actually do this...)
      </p>
      <p>
        Please contact me if you find any bugs or issues! If there are
        layout/interface problems, do not hesitate to contact me here:
        thomasltellefsen@gmail.com
      </p>
    </>
  );
}
