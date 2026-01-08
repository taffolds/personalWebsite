import React from "react";
import { Link } from "react-router-dom";

export function Banner() {
  return (
    <>
      <Link to={"/"}>
        <p>Home</p>
      </Link>
      <Link to={"/fourInARow"}>
        <p>Four In a Row</p>
      </Link>
    </>
  );
}
