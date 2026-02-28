import { useUser } from "../../contexts/UserContext.js";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Banner from "../page/banner.js";

export function UserGames() {
  const { profile, loading } = useUser();
  const [friends, setFriends] = useState<any[]>([]);
  const [activeGames, setActiveGames] = useState<any[]>([]);
  const [gameRequests, setGameRequests] = useState<any[]>([]);
  const [historicGames, setHistoricGames] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (profile?.nickname) {
      loadFriendsData();
      loadGamesData();
    }
  }, [profile]);

  async function loadFriendsData() {
    const friendsRes = await fetch("/api/friendship/friends");

    if (friendsRes.ok) setFriends(await friendsRes.json());
  }

  async function loadGamesData() {
    const [gameRequestsRes, activeGamesRes, historicGamesRes] =
      await Promise.all([
        fetch("/api/games/requests/incoming"),
        fetch("/api/games/active"),
        fetch("/api/games/historic"),
      ]);
    if (gameRequestsRes.ok) setGameRequests(await gameRequestsRes.json());
    if (activeGamesRes.ok) setActiveGames(await activeGamesRes.json());
    if (historicGamesRes.ok) setHistoricGames(await historicGamesRes.json());
  }

  useEffect(() => {
    if (!profile && !loading) {
      setTimeout(() => {
        navigate("/login");
      }, 1000);
    }
  }, [profile, loading, navigate]);

  if (loading) return <p>Loading games</p>;

  if (!profile) return <p>Not logged in, redirecting...</p>;

  if (!profile.nickname)
    return (
      <>
        <Banner />
        <h1>Need to set a nickname</h1>
        <p>
          Please set a nickname on your <a href={"/profile"}>profile</a> to
          access this page
        </p>
      </>
    );

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

  return (
    <>
      <Banner />
      <div>
        <h3>Friends:</h3>
        <ul>
          {friends.map((friend) => (
            <li key={friend.userId}>
              {friend.nickname}
              <button onClick={() => handleSendGameRequest(friend.userId)}>
                Send game request || respond to req || go to active game
              </button>
              <p>&& sendGameRequestBtn (pick colour</p>
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
                Accept && colour
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
              {g.opponentNickname}
              <button onClick={() => handleEnterGame(g.id)}>Play</button>
              <button onClick={() => handleForfeitGame(g.id)}>Forfeit</button>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3>Historic Games:</h3>
        <ul>
          {historicGames.map((g) => (
            <li key={g.id}>
              {g.opponentNickname}
              <button onClick={() => handleEnterGame(g.id)}>Revisit</button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
