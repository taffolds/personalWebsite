import { useUser } from "../../contexts/UserContext.js";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Banner from "../page/banner.js";
import toast from "react-hot-toast";

export function UserGames() {
  const { profile, loading } = useUser();
  const [friends, setFriends] = useState<any[]>([]);
  const [activeGames, setActiveGames] = useState<any[]>([]);
  const [gameRequests, setGameRequests] = useState<any[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);
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
    const [
      gameRequestsRes,
      outgoingRequestsRes,
      activeGamesRes,
      historicGamesRes,
    ] = await Promise.all([
      fetch("/api/games/requests/incoming"),
      fetch("/api/games/requests/outgoing"),
      fetch("/api/games/active"),
      fetch("/api/games/historic"),
    ]);
    if (gameRequestsRes.ok) setGameRequests(await gameRequestsRes.json());
    if (outgoingRequestsRes.ok)
      setOutgoingRequests(await outgoingRequestsRes.json());
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
    if (!profile?.id) {
      // @ts-ignore
      toast.error("Profile not loaded");
      return;
    }

    const res = await fetch("/api/games/requests/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        friendId: friendId,
        firstMove: profile.id,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      // @ts-ignore
      toast.error(data.message || "Something went wrong");
      return;
    } else {
      // @ts-ignore
      toast.success(data.message || "Request sent");
      await loadGamesData();
    }
  }

  async function handleAcceptGameRequest(requestId: number) {
    const res = await fetch("/api/games/requests/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId }),
    });

    const data = await res.json();

    if (!res.ok) {
      // @ts-ignore
      toast.error(data.message || "Something went wrong");
      return;
    } else {
      // @ts-ignore
      toast.success(data.message || "Game request accepted");
      await loadGamesData();
    }
  }

  async function handleRejectGameRequest(requestId: number) {
    const res = await fetch("/api/games/requests/remove", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId }),
    });

    const data = await res.json();

    if (!res.ok) {
      // @ts-ignore
      toast.error(data.message || "Something went wrong");
      return;
    } else {
      // @ts-ignore
      toast.success(data.message || "Request removed");
      await loadGamesData();
    }
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

    const data = await res.json();

    if (!res.ok) {
      // @ts-ignore
      toast.error(data.message || "Something went wrong");
      return;
    } else {
      // @ts-ignore
      toast.success(data.message || "Game forfeited");
      await loadGamesData();
    }
  }

  return (
    <>
      <Banner />
      <div>
        <h3>Ideas:</h3>
        <ul>
          <li>
            Colours need to be easily visible, and indicate which player is
            first and second
          </li>
          <li>
            There needs to be a message to user under each tab, e.g. "no active
            games"
          </li>
        </ul>
      </div>
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
        <h3>Game Requests:</h3>
        <ul>
          {gameRequests.map((r) => (
            <li key={r.requestId}>
              {r.fromNickname}
              <button onClick={() => handleAcceptGameRequest(r.requestId)}>
                Accept && colour
              </button>
              <button onClick={() => handleRejectGameRequest(r.requestId)}>
                Remove request
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3>Outgoing Requests:</h3>
        <ul>
          {outgoingRequests.map((r) => (
            <li key={r.requestId}>
              {r.toNickname}
              <button onClick={() => handleRejectGameRequest(r.requestId)}>
                Remove request
              </button>
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
