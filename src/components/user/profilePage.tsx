import { useUser } from "../../contexts/UserContext.js";
import Banner from "../page/banner.js";
import { type FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export function ProfilePage() {
  // Add debug if not logged in
  // Add debug to user if profile is loading
  // Add friend request options
  // Need a notification system when people add you
  // Friends list?
  // Need some GDPR to delete user from database
  // Edit username
  // Should have a logout here as well as on the hamburger

  const { profile, loading, refreshProfile } = useUser();
  const [newNickname, setNewNickname] = useState("");
  const [deleteProfilePrompt, setDeleteProfilePrompt] = useState(false);
  const navigate = useNavigate();

  // What happens if you want to remove your nickname?
  // Disallow it?
  // Own button?
  // Button, and also write blank, set to null

  useEffect(() => {
    if (!profile && !loading) {
      setTimeout(() => {
        navigate("/login");
      }, 1000);
    }
  }, [profile, loading, navigate]);

  if (loading) return <p>Loading profile</p>;

  if (!profile) return <p>Not logged in, redirecting...</p>;

  function handleOpenUserWarning() {
    setDeleteProfilePrompt(true);
  }

  function handleCloseUserWarning() {
    setDeleteProfilePrompt(false);
  }

  async function handleDeleteProfile() {
    alert("Nothing happened"); // Just so I don't forget
    setDeleteProfilePrompt(false);
  }

  async function handleSaveNickname(event: FormEvent) {
    event.preventDefault();
    const res = await fetch("/api/user/nickname", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nickname: newNickname }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.log("Error:", data.error);
      return;
    }
    await refreshProfile();
    setNewNickname("");
  }

  return (
    <>
      <Banner />
      <p>Hello, {profile.nickname}</p>
      <form onSubmit={handleSaveNickname}>
        <input
          value={newNickname}
          placeholder="Enter nickname"
          onChange={(e) => setNewNickname(e.target.value)}
        />
        <button>Save</button>
      </form>
      <p>
        <button onClick={handleOpenUserWarning}>Delete profile</button>
      </p>
      {deleteProfilePrompt && (
        <>
          <p>
            Are you sure you want to delete your profile? All your information
            will be removed, including game history, friends lists, etc.
          </p>
          <button onClick={handleDeleteProfile}>Yes</button>
          <button onClick={handleCloseUserWarning}>No</button>
        </>
      )}
    </>
  );
}
