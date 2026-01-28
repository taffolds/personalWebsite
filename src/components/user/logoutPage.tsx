import { useEffect } from "react";

export function LogoutPage() {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = "/";
    }, 1500);

    return () => clearTimeout(timer);
  }, []); // note to self, this stops issues when clicking back button during redirection

  return (
    <>
      <h1>You have been logged out</h1>
      <p>Redirecting to homepage</p>
    </>
  );
}
