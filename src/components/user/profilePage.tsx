import { useUser } from "../../contexts/UserContext.js";
import Banner from "../page/banner.js";
import styles from "./profilePage.module.css";
import { type FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { format } from "date-fns";

interface FriendProfile {
  id: number;
  nickname: string;
  friendsSince: Date;
}

interface FakeRequest {
  requestId: number;
  nickname: string;
}

export function ProfilePage() {
  // Add debug to user if profile is loading
  // Add friend request options
  // Need a notification system when people add you
  // Should have a logout here as well as on the hamburger

  const { profile, loading, refreshProfile } = useUser();
  const [newNickname, setNewNickname] = useState("");
  const [deleteProfilePrompt, setDeleteProfilePrompt] = useState(false);
  const [isDeletingProfile, setIsDeletingProfile] = useState(false);
  const [nicknamePrompt, setNicknamePrompt] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{
    id: number;
    nickname: string;
  }> | null>(null);
  const [friends, setFriends] = useState<any[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);
  const [selector, setSelector] = useState<"received" | "sent">("received");
  const navigate = useNavigate();

  /*************TEST DATA***********/

  const [fakeUsers] = useState<FriendProfile[]>([
    { id: 1, nickname: "fakington", friendsSince: new Date("2026-01-03") },
    { id: 2, nickname: "gimminy", friendsSince: new Date("2025-03-05") },
    { id: 3, nickname: "cricket", friendsSince: new Date("2023-12-19") },
  ]);

  const [fakeSearch] = useState<FriendProfile[]>([
    { id: 4, nickname: "seymour", friendsSince: new Date("2026-01-03") },
    { id: 5, nickname: "butts", friendsSince: new Date("2025-03-05") },
    { id: 6, nickname: "rabid", friendsSince: new Date("2023-12-19") },
    { id: 7, nickname: "dog", friendsSince: new Date("2023-12-19") },
    {
      id: 8,
      nickname: "anoeherfefteeen",
      friendsSince: new Date("2023-12-19"),
    },
  ]);

  const [fakeIncoming] = useState<FakeRequest[]>([
    { requestId: 1, nickname: "bob" },
    { requestId: 2, nickname: "fred" },
    { requestId: 3, nickname: "abigail" },
  ]);

  const [fakeOutgoing] = useState<FakeRequest[]>([
    { requestId: 4, nickname: "geronimo" },
    { requestId: 5, nickname: "biglongnametest" },
  ]);

  /************END TEST DATA**************/

  useEffect(() => {
    if (profile?.nickname) {
      loadFriendsData();
    }
  }, [profile]);

  async function loadFriendsData() {
    const [friendsRes, incomingRes, outgoingRes] = await Promise.all([
      fetch("/api/friendship/friends"),
      fetch("/api/friendship/requests/incoming"),
      fetch("/api/friendship/requests/outgoing"),
    ]);

    if (friendsRes.ok) setFriends(await friendsRes.json());
    if (incomingRes.ok) setIncomingRequests(await incomingRes.json());
    if (outgoingRes.ok) setOutgoingRequests(await outgoingRes.json());
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

  // DO NOT FORGET TO FIX!!
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

  async function handleDeleteProfile() {
    const res = await fetch("/api/user", {
      method: "DELETE",
    });

    if (!res.ok) {
      // @ts-ignore
      toast.error("Failed to delete user");
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

    if (res.ok) {
      // @ts-ignore
      toast.success(data.message || "Success!");
      setNicknamePrompt(false);
    } else {
      // @ts-ignore
      toast.error(data.message || "Something went wrong");
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
      // @ts-ignore
      toast.error(data.message || "Something went wrong");
      return;
    }

    setSearchResults(data);
  }

  async function handleSendFriendRequest(friendId: number) {
    const res = await fetch("/api/friendship/requests/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendId }),
    });

    const data = await res.json();

    if (res.ok) {
      // @ts-ignore
      toast.success(data.message || "Friend request sent");
      await loadFriendsData();
    } else {
      // @ts-ignore
      toast.error(data.message || "Failed to send request");
      return;
    }
  }

  async function handleAcceptFriendRequest(requestId: number) {
    const res = await fetch("/api/friendship/requests/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId }),
    });

    const data = await res.json();

    if (!res.ok) {
      // @ts-ignore
      toast.error(data.message || "Failed to accept request");
      return;
    } else {
      // @ts-ignore
      toast.success(data.message || "Friendship created");
      await loadFriendsData();
    }
  }

  async function handleRejectFriendRequest(requestId: number) {
    const res = await fetch("/api/friendship/requests/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId }),
    });

    const data = await res.json();

    if (res.ok) {
      // @ts-ignore
      toast.success(data.message || "Request removed");
      await loadFriendsData();
    } else {
      // @ts-ignore
      toast.error(data.message || "Failed to remove request");
      return;
    }
  }

  async function handleRemoveFriend(friendId: number) {
    const res = await fetch("/api/friendship/friends/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendId }),
    });

    const data = await res.json();

    if (!res.ok) {
      // @ts-ignore
      toast.error(data.message || "Failed to remove friend");
      return;
    } else {
      // @ts-ignore
      toast.success(data.message || "Friendship removed");
      await loadFriendsData();
    }
  }

  return (
    <>
      <Banner />
      <div className={styles.wrapper}>
        <h1 className={styles.welcome}>Welcome, {profile.nickname}</h1>
        {/*
          <div className={styles.friendsWrapper}>
              <div className={styles.sectionTitle}>
              <h3>Friends</h3>
              </div>
              <div className={styles.friendsList}>
                  {friends.length === 0 ? (
                      <p className={styles.emptyList}>No friends yet... Search to add one!</p>
                  ):(
                  friends.map((friend) => (
                      <div key={friend.userId}>
                          <button onClick={() => handleRemoveFriend(friend.userId)}>
                              Remove
                          </button>
                          {friend.nickname}
                      </div>
                  )))}
              </div>
          </div>
          */}
        <div className={styles.friendsWrapper}>
          <div className={styles.sectionTitle}>
            <h3>Friends</h3>
          </div>
          {fakeUsers.map((f) => (
            <div key={f.id} className={styles.friendsList}>
              <div className={styles.inlineFriendRemove}>
                <div className={styles.friendName}>{f.nickname}</div>
                <button className={styles.removeFriend}>❌</button>
                {/* Don't forget to send friendId in handle click */}
              </div>
              <div className={styles.friendsInfo}>
                Friends since: {format(f.friendsSince, "MMMM do, yyyy")}
              </div>
            </div>
          ))}
        </div>
        {/* DON'T FORGET TO WRITE SOME NICE FEEDBACK TO USER IF NO REQUESTS */}
        {/* SEND A FRIEND REQUEST TO GET STARTED :) */}
        <div>
          <div className={styles.friendReqWrap}>
            <h3 id={styles.friendReqHeader} className={styles.sectionTitle}>
              Friend Requests
            </h3>
            <div className={styles.selectorWrapper}>
              <div
                className={`${styles.selector} ${selector === "received" ? styles.selectorActive : ""}`}
                onClick={() => setSelector("received")}
              >
                Received ({fakeIncoming.length})
              </div>

              <div
                className={`${styles.selector} ${selector === "sent" ? styles.selectorActive : ""}`}
                onClick={() => setSelector("sent")}
              >
                Sent ({fakeOutgoing.length})
              </div>
            </div>
          </div>
          <div className={styles.requestArray} data-active-tab={selector}>
            <div
              className={`${styles.gridTransition} ${selector === "received" ? styles.gridOpen : ""}`}
            >
              <div className={styles.gridInner}>
                {fakeIncoming.map((r) => (
                  <div className={styles.requestField}>
                    {/* So tired, so sorry */}
                    <div className={styles.requestInfo}>
                      <div className={styles.requestNickname}>{r.nickname}</div>
                    </div>
                    <div className={styles.requestInfo}>
                      <button className={styles.reqBtn}>✅</button>
                      <button className={styles.reqBtn}>❌</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              className={`${styles.gridTransition} ${selector === "sent" ? styles.gridOpen : ""}`}
            >
              <div className={styles.gridInner}>
                {fakeOutgoing.map((r) => (
                  <div className={styles.requestField}>
                    {/* So tired, so sorry, again */}
                    <div className={styles.requestInfo}>
                      <div className={styles.requestNickname}>{r.nickname}</div>
                    </div>
                    <div className={styles.requestInfo}>
                      <button className={styles.reqBtn}>✅</button>
                      <button className={styles.reqBtn}>❌</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div>
                {incomingRequests.map((r) => (
                  <div key={r.requestId}>
                    {r.fromNickname}
                    <button
                      onClick={() => handleAcceptFriendRequest(r.requestId)}
                    >
                      Accept
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.sectionTitle}>
          <h3>Find a friend</h3>
        </div>
        <div className={styles.searchFieldPadding}>
          <form onSubmit={handleSearchForUser}>
            <input
              className={styles.searchField}
              value={searchQuery}
              placeholder="Search for user"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className={styles.searchFieldBtn}>🔍</button>
          </form>
        </div>
        <div className={styles.searchResults}>
          {fakeSearch && (
            <>
              {fakeSearch.map((s) => (
                <div key={s.id} className={styles.searchWrapper}>
                  <button
                    className={`${styles.searchDisplay}  ${styles.addUsers}`}
                  >
                    ➕Add
                  </button>
                  <div
                    className={`${styles.searchDisplay}  ${styles.searchUsers}`}
                  >
                    {s.nickname}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
        {/*<div className={styles.searchResults}>
                  {searchResults !== null && (
                      <>
                          {searchResults.length === 0 ? (
                              <p>No users found...</p>
                          ) : (
                              searchResults.map((user) => (
                                  (user.nickname != profile.nickname && (<div className={styles.searchWrapper} key={user.id}>
                                      <button className={`${styles.searchDisplay}  ${styles.addUsers}`} onClick={() => handleSendFriendRequest(user.id)}>
                                          ➕Add friend
                                      </button>
                                          <div className={`${styles.searchDisplay}  ${styles.searchUsers}`}>
                                      {user.nickname}
                                          </div>
                                  </div>
                              ))))
                          )}
                      </>
                  )}
              </div>
              */}

        <a href={"/userGames"}>
          <div id={styles.games} className={styles.sectionTitle}>
            <h3>Play Games with Friends</h3>
          </div>
        </a>

        <div className={styles.nicknameContainer}>
          {!nicknamePrompt ? (
            <h3
              id={styles.nicknameToggle}
              className={styles.sectionTitle}
              onClick={() => setNicknamePrompt(true)}
            >
              ✏️ <span id={styles.editTxt}>Edit nickname</span>
            </h3>
          ) : (
            <>
              <div>
                <form onSubmit={handleSaveNickname}>
                  <input
                    value={newNickname}
                    placeholder="Enter new nickname"
                    onChange={(e) => setNewNickname(e.target.value)}
                  />
                  <button className={styles.nicknameBtn}>💾</button>
                  <button
                    className={styles.nicknameBtn}
                    onClick={() => setNicknamePrompt(false)}
                  >
                    ❌
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
        <div className={styles.sadBtns}>
          <button className={styles.logoutBtn}>Logout</button>

          <button
            className={styles.deleteProfileBtn}
            onClick={() => setDeleteProfilePrompt(true)}
          >
            Delete profile
          </button>
        </div>
        {deleteProfilePrompt && (
          <>
            <p>
              Are you sure you want to delete your profile? All your information
              will be removed, including game history, friends lists, etc.
            </p>
            <button onClick={handleDeleteProfile}>Confirm</button>
            <button onClick={() => setDeleteProfilePrompt(false)}>
              Cancel
            </button>
          </>
        )}
      </div>
    </>
  );
}
