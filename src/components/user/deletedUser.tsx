import { useEffect, useState } from "react";
import Banner from "../page/banner.js";

export function DeletedUserPage() {
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((countdown) => {
        if (countdown <= 1) {
          clearInterval(timer);
          window.location.href = "/";
        }
        return countdown - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <Banner />
      <h1>You have deleted your user</h1>
      <p>Redirecting to home page in {timeLeft}</p>
      <p>
        <a href={"/"}>Go now</a>
      </p>
    </>
  );
}
