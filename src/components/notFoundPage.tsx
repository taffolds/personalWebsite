import React from "react";
import { Link } from "react-router-dom";
import { Banner } from "./banner.js";

export function NotFoundPage() {
  return (
    <>
      <Banner />
      <h1>Couldn't find this page</h1>
      <Link to={"/"}>
        <p>Back to homepage</p>
      </Link>
    </>
  );
}
