import { useUser } from "../../contexts/UserContext.js";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Banner from "../page/banner.js";
import styles from "./userGames.module.css";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { LoadingWrapper } from "../loading/loadingWrapper.js";

interface Move {
  moveNumber: number;
  column: number;
  timestamp: string;
}

enum GameCondition {
  Active = "ACTIVE",
  OutgoingRequest = "OUTGOING_REQUEST",
  IncomingRequest = "INCOMING_REQUEST",
  None = "NONE",
}

interface FriendsWithGameStatus {
  friendId: number;
  nickname: string;
  gameStatus: GameCondition;
  gameId: number | undefined;
  requestId: number | undefined;
}

interface Friend {
  id: number;
  nickname: string;
}

interface ActiveGame {
  id: number;
  opponentId: number;
  opponentNickname: string;
  firstMove: number;
  lastMoveAt: string;
  moves: Move[];
}

interface HistoricGame {
  id: number;
  opponentId: number;
  opponentNickname: string;
  firstMove: number;
  status: "completed" | "draw" | "forfeited";
  winnerId: number | null;
  completedAt: string;
  moves: Move[];
}

interface GameRequest {
  requestId: number;
  friendId: number;
  nickname: string;
  firstMove: number;
  requestedBy: number;
}

export function UserGames() {
  const { profile, loading } = useUser();
  const [gamesLoading, setGamesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [friends, setFriends] = useState<FriendsWithGameStatus[]>([]);
  const [activeGames, setActiveGames] = useState<ActiveGame[]>([]);
  const [historicGames, setHistoricGames] = useState<HistoricGame[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<GameRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<GameRequest[]>([]);
  const [gameRequest, setGameRequest] = useState<GameRequest | null>(null);
  const [existingReqStep, setExistingReqStep] = useState(1);
  const [newReqStep, setNewReqStep] = useState(1);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [gameTab, setGameTab] = useState<"active" | "historic">("active");
  const [requestTab, setRequestTab] = useState<"received" | "sent">("received");
  const existingRequestDialogRef = useRef<HTMLDialogElement>(null);
  const newGameDialogRef = useRef<HTMLDialogElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (profile?.nickname) {
      loadGamesData();
    }
  }, [profile]);

  async function loadGamesData() {
    setGamesLoading(true);
    setError(null);

    const timeoutId = setTimeout(() => {
      setError("Failed to load games");
    }, 10000);

    try {
      const [
        friendsRes,
        incomingRequestsRes,
        outgoingRequestsRes,
        activeGamesRes,
        historicGamesRes,
      ] = await Promise.all([
        fetch("/api/friendship/friends"),
        fetch("/api/games/requests/incoming"),
        fetch("/api/games/requests/outgoing"),
        fetch("/api/games/active"),
        fetch("/api/games/historic"),
      ]);

      const friendsData: Friend[] = await friendsRes.json();
      const incomingReqData: GameRequest[] = await incomingRequestsRes.json();
      const outgoingReqData: GameRequest[] = await outgoingRequestsRes.json();
      const activeGamesData: ActiveGame[] = await activeGamesRes.json();
      const historicGamesData: HistoricGame[] = await historicGamesRes.json();

      const activeGameFriendIds = new Map(
        activeGamesData.map((g) => [g.opponentId, g.id]),
      );
      const incomingRequestFriendIds = new Map(
        incomingReqData.map((r) => [r.friendId, r.requestId]),
      );
      const outgoingRequestFriendIds = new Map(
        outgoingReqData.map((r) => [r.friendId, r.requestId]),
      );

      const friendsWithStatus: FriendsWithGameStatus[] = friendsData.map(
        (friend) => {
          let gameStatus: GameCondition;
          let gameId: number | undefined;
          let requestId: number | undefined;

          if (activeGameFriendIds.has(friend.id)) {
            gameStatus = GameCondition.Active;
            gameId = activeGameFriendIds.get(friend.id);
          } else if (incomingRequestFriendIds.has(friend.id)) {
            gameStatus = GameCondition.IncomingRequest;
            requestId = incomingRequestFriendIds.get(friend.id);
          } else if (outgoingRequestFriendIds.has(friend.id)) {
            gameStatus = GameCondition.OutgoingRequest;
            requestId = outgoingRequestFriendIds.get(friend.id);
          } else {
            gameStatus = GameCondition.None;
          }

          return {
            friendId: friend.id,
            nickname: friend.nickname,
            gameStatus,
            gameId,
            requestId,
          };
        },
      );

      setFriends(friendsWithStatus);
      setIncomingRequests(incomingReqData);
      setOutgoingRequests(outgoingReqData);
      setActiveGames(activeGamesData);
      setHistoricGames(historicGamesData);
    } catch (err) {
      setError("Failed to load games");
    } finally {
      clearTimeout(timeoutId);
      setGamesLoading(false);
    }
  }

  useEffect(() => {
    if (!profile && !loading) {
      setTimeout(() => {
        navigate("/login");
      }, 1000);
    }
  }, [profile, loading, navigate]);

  const isLoading = loading || gamesLoading;

  if (isLoading || error) {
    return (
      <>
        <Banner />
        <LoadingWrapper loading={isLoading} error={error}>
          <div></div>
        </LoadingWrapper>
      </>
    );
  }

  if (!profile) return <p>Not logged in, redirecting...</p>;

  if (!profile.nickname)
    return (
      <>
        <Banner />
        <div className={styles.wrapper}>
          <h3>Need to set a nickname</h3>
          <p>
            Please set a nickname on your <a href={"/profile"}>profile</a> to
            access this page
          </p>
        </div>
      </>
    );

  async function handleSendGameRequest(friendId: number, firstMove: number) {
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
        firstMove: firstMove,
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

  const handleShowRequestById = (requestId: number | undefined) => {
    if (!requestId) return;
    const request = [...incomingRequests, ...outgoingRequests].find(
      (r) => r.requestId === requestId,
    );

    if (!request) return;
    handleShowRequestModal(request);
  };

  const handleShowRequestModal = (request: GameRequest) => {
    setGameRequest(request);
    setExistingReqStep(1);
    existingRequestDialogRef.current?.showModal();
  };

  const handleSendChallengeModal = (friendId: number, nickname: string) => {
    setSelectedFriend({ id: friendId, nickname: nickname });
    setNewReqStep(1);
    newGameDialogRef.current?.showModal();
  };

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

  return (
    <>
      <Banner />
      <div className={styles.wrapper}>
        <h1 className={styles.welcome}>Four in a Row</h1>

        <div>
          <div className={styles.gamesWrap}>
            <h3 id={styles.gamesHeader} className={styles.sectionTitle}>
              Games
            </h3>
            <div className={styles.gameTabWrapper}>
              <div
                className={`${styles.gameTab} ${gameTab === "active" ? styles.gameTabActive : styles.gameTabInactive}`}
                onClick={() => setGameTab("active")}
              >
                Active ({activeGames.length})
              </div>

              <div
                className={`${styles.gameTab} ${gameTab === "historic" ? styles.gameTabActive : styles.gameTabInactive}`}
                onClick={() => setGameTab("historic")}
              >
                Historic ({historicGames.length})
              </div>
            </div>
          </div>
          <div className={styles.gamesArray} data-active-tab={gameTab}>
            <div
              className={`${styles.gridTransition} ${gameTab === "active" ? styles.gridOpen : ""}`}
            >
              {/* Everyone loves a good <div> tag */}
              <div className={styles.gridInner}>
                {activeGames.map((g) => (
                  <a href={`/fourInARow/${g.id}`}>
                    <div key={g.id} className={styles.gamesField}>
                      <div className={styles.gamesInfo}>
                        {g.firstMove === profile.id ? (
                          <div className={styles.gamesNickname}>
                            <div className={styles.redPiece}></div>
                            You vs {g.opponentNickname}
                            <div className={styles.bluePiece}></div>
                          </div>
                        ) : (
                          <div className={styles.gamesNickname}>
                            <div className={styles.redPiece}></div>
                            {g.opponentNickname} vs you
                            <div className={styles.bluePiece}></div>
                          </div>
                        )}
                        <div className={styles.turnDisplay}>
                          {g.moves.length % 2 === 0 ? (
                            /* EVEN MOVE */
                            /* Sorry about legibility... it came to me on a walk */
                            g.firstMove === profile.id ? (
                              <div className={styles.gamesTurn}>Your turn</div>
                            ) : (
                              <div className={styles.gamesTurn}>
                                {g.opponentNickname}'s turn
                              </div>
                            )
                          ) : /* ODD MOVE */
                          /* g.moves.length ternary below */
                          g.firstMove === profile.id ? (
                            <div className={styles.gamesTurn}>
                              {g.opponentNickname}'s turn
                            </div>
                          ) : (
                            <div className={styles.gamesTurn}>Your turn</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
                {activeGames.length === 0 && (
                  <div className={styles.gamesField}>
                    <div className={styles.gamesInfo}>
                      <div className={styles.gamesNickname}>
                        No active games...
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div
              className={`${styles.gridTransition} ${gameTab === "historic" ? styles.gridOpen : ""}`}
            >
              <div className={styles.gridInner}>
                {historicGames.map((g) => (
                  <a href={`/fourInARow/${g.id}`}>
                    <div key={g.id} className={styles.gamesField}>
                      <div className={styles.gamesInfo}>
                        {g.firstMove === profile.id ? (
                          <div className={styles.gamesNickname}>
                            <div className={styles.redPiece}></div>
                            You vs {g.opponentNickname}
                            <div className={styles.bluePiece}></div>
                          </div>
                        ) : (
                          <div className={styles.gamesNickname}>
                            <div className={styles.redPiece}></div>
                            {g.opponentNickname} vs you
                            <div className={styles.bluePiece}></div>
                          </div>
                        )}
                      </div>
                      <div className={styles.gamesStatus}>
                        {g.status === "draw" && (
                          <div className={styles.drawGameStyle}>Draw</div>
                        )}
                        {g.status !== "draw" &&
                          (g.winnerId === profile.id ? (
                            <div className={styles.winGameStyle}>You won</div>
                          ) : (
                            <div className={styles.lostGameStyle}>You lost</div>
                          ))}
                        <div className={styles.gamesDate}>
                          Ended on {format(g.completedAt, "MMMM do, yyyy")}
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
                {historicGames.length === 0 && (
                  <div className={styles.gamesField}>
                    <div className={styles.gamesInfo}>
                      <div className={styles.gamesNickname}>
                        No historic games...
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className={styles.friendReqWrap}>
            <h3 id={styles.friendReqHeader} className={styles.sectionTitle}>
              Game Requests
            </h3>
            <div className={styles.selectorWrapper}>
              <div
                className={`${styles.selector} ${requestTab === "received" ? styles.selectorActive : ""}`}
                onClick={() => setRequestTab("received")}
              >
                Received ({incomingRequests.length})
              </div>

              <div
                className={`${styles.selector} ${requestTab === "sent" ? styles.selectorActive : ""}`}
                onClick={() => setRequestTab("sent")}
              >
                Sent ({outgoingRequests.length})
              </div>
            </div>
          </div>
          <div className={styles.requestArray} data-active-tab={requestTab}>
            <div
              className={`${styles.gridTransition} ${requestTab === "received" ? styles.gridOpen : ""}`}
            >
              <div className={styles.gridInner}>
                {incomingRequests.map((r) => (
                  <div key={r.requestId} className={styles.requestField}>
                    <div className={styles.requestInfo}>
                      <div className={styles.requestNickname}>{r.nickname}</div>
                    </div>
                    <div className={styles.requestInfo}>
                      <button
                        className={styles.reqBtn}
                        onClick={() => handleShowRequestModal(r)}
                      >
                        Show
                      </button>
                    </div>
                  </div>
                ))}
                {incomingRequests.length === 0 && (
                  <div className={styles.requestField}>
                    <div className={styles.requestInfo}>
                      <div className={styles.requestNickname}>
                        No received game requests...
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div
              className={`${styles.gridTransition} ${requestTab === "sent" ? styles.gridOpen : ""}`}
            >
              <div className={styles.gridInner}>
                {outgoingRequests.map((r) => (
                  <div key={r.requestId} className={styles.requestField}>
                    <div className={styles.requestInfo}>
                      <div className={styles.requestNickname}>{r.nickname}</div>
                    </div>
                    <div className={styles.requestInfo}>
                      <button
                        className={styles.reqBtnRemove}
                        onClick={() => handleShowRequestModal(r)}
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
                        No sent game requests. Send one to begin!
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <dialog ref={existingRequestDialogRef}>
              {gameRequest && (
                <>
                  {existingReqStep === 1 && (
                    <div className={styles.dialogContainer}>
                      <button
                        className={styles.closeBtn}
                        onClick={() =>
                          existingRequestDialogRef.current?.close()
                        }
                      >
                        ✖️
                      </button>
                      <div className={styles.reqTitle}>Game Request</div>
                      {gameRequest.firstMove === profile.id ? (
                        <div className={styles.gamesNickname}>
                          <div className={styles.redPiece}></div>
                          <div>You vs. {gameRequest.nickname}</div>
                          <div className={styles.bluePiece}></div>
                        </div>
                      ) : (
                        <div className={styles.gamesNickname}>
                          <div className={styles.redPiece}></div>
                          <div className={styles.dialogNames}>
                            You vs. {gameRequest.nickname}
                          </div>
                          <div className={styles.bluePiece}></div>
                        </div>
                      )}
                      {gameRequest.requestedBy === profile.id ? (
                        <div>
                          <div className={styles.dialogInfoTxt}>
                            Waiting for {gameRequest.nickname} to accept...
                          </div>
                          <div className={styles.btnWrap}>
                            <button
                              className={`${styles.removeBtn} ${styles.generalBtn}`}
                              onClick={() => setExistingReqStep(2)}
                            >
                              Remove
                            </button>
                            <button
                              className={`${styles.cancelBtn} ${styles.generalBtn}`}
                              onClick={() =>
                                existingRequestDialogRef.current?.close()
                              }
                            >
                              Back
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className={styles.btnWrap}>
                          <button
                            className={`${styles.confirmBtn} ${styles.generalBtn}`}
                            onClick={() => {
                              handleAcceptGameRequest(gameRequest?.requestId);
                              existingRequestDialogRef.current?.close();
                            }}
                          >
                            Accept
                          </button>
                          <button
                            className={`${styles.removeBtn} ${styles.generalBtn}`}
                            onClick={() => setExistingReqStep(2)}
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {existingReqStep === 2 && (
                    <div className={styles.dialogContainer}>
                      <div className={styles.dialogInfoTxt}>
                        Are you sure you want to remove this game request?
                      </div>
                      <div className={styles.btnWrap}>
                        <button
                          className={`${styles.removeBtn} ${styles.generalBtn}`}
                          onClick={() => {
                            handleRejectGameRequest(gameRequest?.requestId);
                            existingRequestDialogRef.current?.close();
                            setExistingReqStep(1);
                          }}
                        >
                          Remove
                        </button>
                        <button
                          className={`${styles.cancelBtn} ${styles.generalBtn}`}
                          onClick={() => {
                            setExistingReqStep(1);
                            existingRequestDialogRef.current?.close();
                          }}
                        >
                          Back
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </dialog>
          </div>
          <div className={styles.friendsWrapper}>
            <div className={styles.sectionTitle}>
              <h3>Friends</h3>
            </div>
            {friends.map((f) => (
              <div key={f.friendId} className={styles.friendsList}>
                <div className={styles.inlineFriendRemove}>
                  <div className={styles.friendName}>{f.nickname}</div>
                </div>
                {f.gameStatus === "NONE" && (
                  <div className={styles.friendsInfo}>
                    <button
                      className={`${styles.challengeBtn} ${styles.friendsBtn}`}
                      onClick={() =>
                        handleSendChallengeModal(f.friendId, f.nickname)
                      }
                    >
                      Challenge!
                    </button>
                  </div>
                )}
                {f.gameStatus === "ACTIVE" && (
                  <div className={styles.friendsInfo}>
                    <button
                      className={`${styles.goToGameBtn} ${styles.friendsBtn}`}
                      onClick={() =>
                        (window.location.href = `/fourInARow/${f.gameId}`)
                      }
                    >
                      Go to game!
                    </button>
                  </div>
                )}
                {f.requestId !== undefined &&
                  (f.gameStatus === "INCOMING_REQUEST" ||
                    f.gameStatus === "OUTGOING_REQUEST") && (
                    <div className={styles.friendsInfo}>
                      <button
                        className={`${styles.activeReqBtn} ${styles.friendsBtn}`}
                        onClick={() => handleShowRequestById(f.requestId)}
                      >
                        View Request
                      </button>
                    </div>
                  )}
              </div>
            ))}
          </div>

          <dialog ref={newGameDialogRef}>
            {selectedFriend && (
              <>
                {newReqStep === 1 && (
                  <div className={styles.dialogContainer}>
                    <div>
                      <div
                        className={`${styles.dialogInfoTxt} ${styles.challengeTxt}`}
                      >
                        Challenge {selectedFriend.nickname} to a game?
                      </div>
                      <div className={styles.btnWrap}>
                        <button
                          className={`${styles.confirmBtn} ${styles.generalBtn}`}
                          onClick={() => {
                            setNewReqStep(2);
                          }}
                        >
                          Yes!
                        </button>
                        <button
                          className={`${styles.cancelBtn} ${styles.generalBtn}`}
                          onClick={() => newGameDialogRef.current?.close()}
                        >
                          Back
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {newReqStep === 2 && (
                  <div className={styles.dialogContainer}>
                    <button
                      className={styles.closeBtn}
                      onClick={() => {
                        newGameDialogRef.current?.close();
                        setNewReqStep(1);
                      }}
                    >
                      ✖️
                    </button>
                    <div
                      className={`${styles.dialogInfoTxt} ${styles.proposeTxt}`}
                    >
                      Who do you want to play as?
                    </div>
                    <div className={styles.playerBtnWrap}>
                      <button
                        className={`${styles.player1Btn} ${styles.playerBtn}`}
                        onClick={async () => {
                          await handleSendGameRequest(
                            selectedFriend.id,
                            profile.id,
                          );
                          newGameDialogRef.current?.close();
                          setNewReqStep(1);
                        }}
                      >
                        Player 1
                      </button>
                      <button
                        className={`${styles.player2Btn} ${styles.playerBtn}`}
                        onClick={async () => {
                          await handleSendGameRequest(
                            selectedFriend.id,
                            selectedFriend.id,
                          );
                          newGameDialogRef.current?.close();
                          setNewReqStep(1);
                        }}
                      >
                        Player 2
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </dialog>

          {friends.length === 0 && (
            <div className={`${styles.friendsList} ${styles.noFriends}`}>
              <div className={styles.inlineFriendRemove}>
                <div className={styles.friendName}>
                  No friends yet... Add a friend to play four in a row!
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
