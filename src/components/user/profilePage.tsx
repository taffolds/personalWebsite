import { useUser } from "../../contexts/UserContext.js";
import Banner from "../page/banner.js";
import { type FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export function ProfilePage() {
  // Add debug to user if profile is loading
  // Add friend request options
  // Need a notification system when people add you
  // Edit username
  // Should have a logout here as well as on the hamburger

  // This page is begging to be divided into components

  const { profile, loading, refreshProfile } = useUser();
  const [newNickname, setNewNickname] = useState("");
  const [deleteProfilePrompt, setDeleteProfilePrompt] = useState(false);
  const [isDeletingProfile, setIsDeletingProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [activeGames, setActiveGames] = useState<any[]>([]);
  const [gameRequests, setGameRequests] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (profile?.nickname) {
      loadFriendsData();
      loadGamesData();
    }
  }, [profile]);

  async function loadFriendsData() {
    const [friendsRes, incomingRes] = await Promise.all([
      fetch("/api/friendship/friends"),
      fetch("/api/friendship/requests/incoming"),
    ]);

    if (friendsRes.ok) setFriends(await friendsRes.json());
    if (incomingRes.ok) setIncomingRequests(await incomingRes.json());
  }

  async function loadGamesData() {
    const [gameRequestsRes, activeGamesRes] = await Promise.all([
      fetch("/api/games/requests/incoming"),
      fetch("/api/games/user"),
    ]);
    if (gameRequestsRes.ok) setGameRequests(await gameRequestsRes.json());
    if (activeGamesRes.ok) setActiveGames(await activeGamesRes.json());
  }

  useEffect(() => {
    if (!profile && !loading && !isDeletingProfile) {
      setTimeout(() => {
        navigate("/login");
      }, 1000);
    }
  }, [profile, loading, navigate]);

  if (loading) return <p>Loading profile</p>;

  if (!profile) return <p>Not logged in, redirecting...</p>;

  if (!profile.nickname)
    return (
      <>
        <Banner />
        <h1>Need to set a nickname</h1>
        <form onSubmit={handleSaveNickname}>
          <input
            value={newNickname}
            placeholder="Enter nickname"
            onChange={(e) => setNewNickname(e.target.value)}
          />
          <button>Save</button>
        </form>
      </>
    );

  function handleOpenUserWarning() {
    setDeleteProfilePrompt(true);
  }

  function handleCloseUserWarning() {
    setDeleteProfilePrompt(false);
  }

  async function handleDeleteProfile() {
    const res = await fetch("/api/user", {
      method: "DELETE",
    });

    if (!res.ok) {
      alert("Failed to delete profile");
      return;
    }

    setDeleteProfilePrompt(false);
    setIsDeletingProfile(true);

    await refreshProfile();
    navigate("/deleted");
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

  // Refresh profile page whenever a change has occurred so that friendship elements render in the right boxes

  async function handleSearchForUser(event: FormEvent) {
    event.preventDefault();

    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const res = await fetch(`/api/friendship/search?query=${searchQuery}`);
    const data = await res.json();

    if (!res.ok) {
      console.log("Error: ", data.error);
      return;
    }

    setSearchResults(data);
  }

  async function handleSendGameRequest(friendId: number) {
    const res = await fetch("/api/games/requests/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendId }),
    });

    if (!res.ok) {
      alert("no game request sent womp womp");
      return;
    }

    await loadGamesData();
  }

  async function handleAcceptGameRequest(requestId: number) {
    const res = await fetch("/api/games/requests/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId }),
    });

    if (!res.ok) {
      alert("Couldn't create game");
      return;
    }

    // could also use navigate to res.json().gameId

    await loadGamesData();
  }

  async function handleEnterGame(gameId: number) {
    navigate(`/fourInARow/${gameId}`);
  }

  async function handleForfeitGame(gameId: number) {
    const res = await fetch(`/api/games/game/${gameId}/forfeit`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId }),
    });

    if (!res.ok) {
      alert("didn't delete game");
      return;
    }

    await loadGamesData();
  }

  async function handleSendFriendRequest(nickname: string) {
    const res = await fetch("/api/friendship/requests/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname }),
    });

    if (!res.ok) {
      alert("ffs");
      return;
    }

    await loadFriendsData();
  }

  async function handleAcceptFriendRequest(requestId: number) {
    const res = await fetch("/api/friendship/requests/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId }),
    });
    if (res.ok) await loadFriendsData();
  }

  async function handleRemoveFriend(friendId: number) {
    const res = await fetch("/api/friendship/friends/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendId }),
    });
    if (res.ok) await loadFriendsData();
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

      <div>
        <h3>Search For User</h3>
        <form onSubmit={handleSearchForUser}>
          <input
            value={searchQuery}
            placeholder="Search for user"
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button>Search</button>
        </form>
        <div>
          <p>RESULTS:</p>
          <ul>
            {searchResults.map((nickname) => (
              <li key={nickname}>
                {nickname}
                <button onClick={() => handleSendFriendRequest(nickname)}>
                  Add
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {searchQuery && searchResults.length === 0 && <p>No users found</p>}

      <div>
        <h3>Friends:</h3>
        <ul>
          {friends.map((friend) => (
            <li key={friend.userId}>
              {friend.nickname}
              <button onClick={() => handleSendGameRequest(friend.userId)}>
                Send game request
              </button>
              <button onClick={() => handleRemoveFriend(friend.userId)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3>Friend Requests:</h3>
        <ul>
          {incomingRequests.map((r) => (
            <li key={r.requestId}>
              {r.fromNickname}
              <button onClick={() => handleAcceptFriendRequest(r.requestId)}>
                Accept
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3>Game Requests:</h3>
        <ul>
          {gameRequests.map((r) => (
            <li key={r.requestId}>
              Game with id {r.requestId}
              <button onClick={() => handleAcceptGameRequest(r.requestId)}>
                Accept
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3>Games:</h3>
        <ul>
          {activeGames.map((g) => (
            <li key={g.id}>
              {g.nickname}
              <button onClick={() => handleEnterGame(g.id)}>Play</button>
              <button onClick={() => handleForfeitGame(g.id)}>Forfeit</button>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3>Historic Games:</h3>
        <ul>
          <li>historicGames.map</li>
          <li>select().where(ne("in_progress"))</li>
        </ul>
      </div>
    </>
  );
}
