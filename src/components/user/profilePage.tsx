import { useUser } from "../../contexts/UserContext.js";
import Banner from "../page/banner.js";
import styles from "./profilePage.module.css";
import React, { type FormEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { format } from "date-fns";

interface Friend {
  id: number;
  nickname: string;
  friendsSince: string;
}

interface FriendRequest {
  requestId: number;
  friendId: number;
  nickname: string;
}

export function ProfilePage() {
  // Add debug to user if profile is loading

  const { profile, loading, refreshProfile } = useUser();
  const [newNickname, setNewNickname] = useState("");
  const [isDeletingProfile, setIsDeletingProfile] = useState(false);
  const [nicknamePrompt, setNicknamePrompt] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{
    id: number;
    nickname: string;
  }> | null>(null);
  const [friends, setFriends] = useState<any[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);
  const [selector, setSelector] = useState<"received" | "sent">("received");
  const navigate = useNavigate();
  const removeFriendDialogRef = useRef<HTMLDialogElement>(null);
  const removeRequestDialogRef = useRef<HTMLDialogElement>(null);
  const deleteProfileDialogRef = useRef<HTMLDialogElement>(null);

  const [friendToRemove, setFriendToRemove] = useState<{
    id: number;
    nickname: string;
  } | null>(null);

  const [requestToRemove, setRequestToRemove] = useState<{
    requestId: number;
    nickname: string;
    type: "incoming" | "outgoing";
  } | null>(null);

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

    if (friendsRes.ok) {
      const data: Friend[] = await friendsRes.json();
      setFriends(data);
    }
    if (incomingRes.ok) {
      const data: FriendRequest[] = await incomingRes.json();
      setIncomingRequests(data);
    }
    if (outgoingRes.ok) {
      const data: FriendRequest[] = await outgoingRes.json();
      setOutgoingRequests(data);
    }
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
        <h3>Need to set a nickname</h3>
        <div className={styles.editNickname}>
          <form onSubmit={handleSaveNickname}>
            <input
              className={styles.nicknameField}
              value={newNickname}
              placeholder="Enter nickname"
              onChange={(e) => setNewNickname(e.target.value)}
            />
            <button
              className={`${styles.nicknameBtn} ${styles.nicknameConfirmBtn}`}
            >
              💾
            </button>
          </form>
        </div>
      </>
    );

  const handleRemoveFriendModal = (id: number, nickname: string) => {
    setFriendToRemove({ id, nickname });
    removeFriendDialogRef.current?.showModal();
  };

  async function handleRemoveFriend(friendId: number) {
    const res = await fetch("/api/friendship/friends/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendId }),
    });

    const data = await res.json();

    if (res.ok) {
      // @ts-ignore
      toast.success(data.message || "Friendship removed");
      await loadFriendsData();
    } else {
      // @ts-ignore
      toast.error(data.message || "Failed to remove friend");
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

    if (res.ok) {
      // @ts-ignore
      toast.success(data.message || "Friendship created");
      await loadFriendsData();
    } else {
      // @ts-ignore
      toast.error(data.message || "Failed to accept request");
      return;
    }
  }

  const handleRemoveRequestModal = (
    requestId: number,
    nickname: string,
    type: "incoming" | "outgoing",
  ) => {
    setRequestToRemove({ requestId, nickname, type });
    removeRequestDialogRef.current?.showModal();
  };

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

    setHasSearched(true);

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

  const handleDeleteProfileModal = () => {
    deleteProfileDialogRef.current?.showModal();
  };

  async function handleDeleteProfile() {
    const res = await fetch("/api/user", {
      method: "DELETE",
    });

    if (!res.ok) {
      // @ts-ignore
      toast.error("Failed to delete user");
      return;
    }

    setIsDeletingProfile(true);

    await refreshProfile();
    navigate("/deleted");
  }

  return (
    <>
      <Banner />
      <div className={styles.wrapper}>
        <h1 className={styles.welcome}>Welcome, {profile.nickname}</h1>

        <div className={styles.friendsWrapper}>
          <div className={styles.sectionTitle}>
            <h3>Friends</h3>
          </div>
          {friends.map((f) => (
            <div key={f.id} className={styles.friendsList}>
              <div className={styles.inlineFriendRemove}>
                <div className={styles.friendName}>{f.nickname}</div>
                <button
                  className={styles.removeFriend}
                  onClick={() => handleRemoveFriendModal(f.id, f.nickname)}
                >
                  ❌
                </button>
              </div>
              <div className={`${styles.friendsInfo}`}>
                Friends since: {format(f.friendsSince, "MMMM do, yyyy")}
              </div>
            </div>
          ))}
        </div>

        <dialog ref={removeFriendDialogRef}>
          <div className={styles.dialogContainer}>
            <p>
              Are you sure you want to remove {friendToRemove?.nickname} as a
              friend?
            </p>
            <div className={styles.dialogOptionsWrapper}>
              <button
                className={`${styles.dialogBtn} ${styles.confirmDialogBtn}`}
                onClick={() => handleRemoveFriend(friendToRemove!.id)}
              >
                Confirm
              </button>
              <button
                className={`${styles.dialogBtn} ${styles.cancelDialogBtn}`}
                onClick={() => removeFriendDialogRef.current?.close()}
              >
                Cancel
              </button>
            </div>
          </div>
        </dialog>
        {friends.length === 0 && (
          <div className={`${styles.friendsList} ${styles.noFriends}`}>
            <div className={styles.inlineFriendRemove}>
              <div className={styles.friendName}>
                No friends yet... Add one to see them displayed here
              </div>
            </div>
          </div>
        )}

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
                Received ({incomingRequests.length})
              </div>

              <div
                className={`${styles.selector} ${selector === "sent" ? styles.selectorActive : ""}`}
                onClick={() => setSelector("sent")}
              >
                Sent ({outgoingRequests.length})
              </div>
            </div>
          </div>
          <div className={styles.requestArray} data-active-tab={selector}>
            <div
              className={`${styles.gridTransition} ${selector === "received" ? styles.gridOpen : ""}`}
            >
              <div className={styles.gridInner}>
                {incomingRequests.map((r) => (
                  <div className={styles.requestField}>
                    <div className={styles.requestInfo}>
                      <div className={styles.requestNickname}>{r.nickname}</div>
                    </div>
                    <div className={styles.requestInfo}>
                      <button
                        className={styles.reqBtn}
                        onClick={() => handleAcceptFriendRequest(r.requestId)}
                      >
                        ✅
                      </button>
                      <button
                        className={styles.reqBtn}
                        onClick={() =>
                          handleRemoveRequestModal(
                            r.requestId,
                            r.nickname,
                            "incoming",
                          )
                        }
                      >
                        ❌
                      </button>
                    </div>
                  </div>
                ))}
                {incomingRequests.length === 0 && (
                  <div className={styles.requestField}>
                    <div className={styles.requestInfo}>
                      <div className={styles.requestNickname}>
                        No received friend requests...
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <dialog ref={removeRequestDialogRef}>
                <div className={styles.dialogContainer}>
                  <p>
                    Are you sure you want to remove your friend request from{" "}
                    {requestToRemove?.nickname}?
                  </p>
                  <div className={styles.dialogOptionsWrapper}>
                    <button
                      className={`${styles.dialogBtn} ${styles.confirmDialogBtn}`}
                      onClick={() =>
                        handleRejectFriendRequest(requestToRemove!.requestId)
                      }
                    >
                      Confirm
                    </button>
                    <button
                      className={`${styles.dialogBtn} ${styles.cancelDialogBtn}`}
                      onClick={() => removeRequestDialogRef.current?.close()}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </dialog>
            </div>

            <div
              className={`${styles.gridTransition} ${selector === "sent" ? styles.gridOpen : ""}`}
            >
              <div className={styles.gridInner}>
                {outgoingRequests.map((r) => (
                  <div className={styles.requestField}>
                    <div className={styles.requestInfo}>
                      <div className={styles.requestNickname}>{r.nickname}</div>
                    </div>
                    <div className={styles.requestInfo}>
                      <button
                        className={styles.reqBtn}
                        onClick={() =>
                          handleRemoveRequestModal(
                            r.requestId,
                            r.nickname,
                            "outgoing",
                          )
                        }
                      >
                        ❌
                      </button>
                    </div>
                  </div>
                ))}
                {outgoingRequests.length === 0 && (
                  <div className={styles.requestField}>
                    <div className={styles.requestInfo}>
                      <div className={styles.requestNickname}>
                        No sent friend requests. Send one to begin!
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <dialog ref={removeRequestDialogRef}>
                <div className={styles.dialogContainer}>
                  <p>
                    Are you sure you want to remove your friend request to{" "}
                    {requestToRemove?.nickname}?
                  </p>
                  <div className={styles.dialogOptionsWrapper}>
                    <button
                      className={`${styles.dialogBtn} ${styles.confirmDialogBtn}`}
                      onClick={() =>
                        handleRejectFriendRequest(requestToRemove!.requestId)
                      }
                    >
                      Confirm
                    </button>
                    <button
                      className={`${styles.dialogBtn} ${styles.cancelDialogBtn}`}
                      onClick={() => removeRequestDialogRef.current?.close()}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </dialog>
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
          {searchResults && (
            <>
              {searchResults.map((s) => (
                <div key={s.id} className={styles.searchWrapper}>
                  <button
                    className={`${styles.searchDisplay}  ${styles.addUsers}`}
                    onClick={() => handleSendFriendRequest(s.id)}
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
          {searchResults?.length === 0 && hasSearched && (
            <div>
              <div className={styles.searchWrapper}>
                <div
                  className={`${styles.searchDisplay}  ${styles.searchUsers}`}
                >
                  Couldn't find any users...
                </div>
              </div>
            </div>
          )}
        </div>

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
            <div className={styles.editNickname}>
              <form onSubmit={handleSaveNickname}>
                <input
                  className={styles.nicknameField}
                  value={newNickname}
                  placeholder="Enter new nickname"
                  onChange={(e) => setNewNickname(e.target.value)}
                />
                <button
                  className={`${styles.nicknameBtn} ${styles.nicknameConfirmBtn}`}
                >
                  💾
                </button>
                <button
                  className={`${styles.nicknameBtn} ${styles.nicknameCancelBtn}`}
                  onClick={() => setNicknamePrompt(false)}
                >
                  ❌
                </button>
              </form>
            </div>
          )}
        </div>
        <div className={styles.sadBtns}>
          <a href={"api/user/logout/start"}>
            <button className={styles.logoutBtn}>Logout</button>
          </a>

          <button
            className={styles.deleteProfileBtn}
            onClick={() => handleDeleteProfileModal()}
          >
            Delete profile
          </button>
          <dialog ref={deleteProfileDialogRef}>
            <div
              id={styles.deleteProfileDialog}
              className={styles.dialogContainer}
            >
              <p>
                Are you sure you want to delete your profile? All your
                information will be removed, including game history, friends
                lists, etc.
              </p>
              <div className={styles.dialogOptionsWrapper}>
                <button
                  className={`${styles.dialogBtn} ${styles.confirmDialogBtn}`}
                  onClick={() => handleDeleteProfile()}
                >
                  Confirm
                </button>
                <button
                  className={`${styles.dialogBtn} ${styles.cancelDialogBtn}`}
                  onClick={() => deleteProfileDialogRef.current?.close()}
                >
                  Cancel
                </button>
              </div>
            </div>
          </dialog>
        </div>
      </div>
    </>
  );
}
