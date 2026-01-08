import React from "react";
import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <>
      <h1>Couldn't find this page</h1>
      <Link to={"/"}>
        <p>Back to homepage</p>
      </Link>
    </>
  );
}
