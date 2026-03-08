import React, { useEffect, useRef, useState } from "react";
import Banner from "../page/banner.js";
import styles from "./fourInARow.module.css";
import { useNavigate, useParams } from "react-router-dom";
import { useUser } from "../../contexts/UserContext.js";
import toast from "react-hot-toast";

type CellValue = null | "red" | "blue";

function createEmptyGame(): CellValue[][] {
  return Array(6)
    .fill(null)
    .map(() => Array(7).fill(null));
}

export function FourInARow() {
  const { gameId } = useParams<{ gameId: string }>();
  const { profile } = useUser();
  // const [loading, setLoading] = useState(true); // KEEPING FOR LATER
  const [board, setBoard] = useState<CellValue[][]>(createEmptyGame());
  const [opponentNickname, setOpponentNickname] = useState<string>("");
  const [nicknameEnding, setNicknameEnding] = useState(false);
  const [opponentId, setOpponentId] = useState<string>("");
  const [winner, setWinner] = useState<number | null>(null); // Redo this
  const [draw, setDraw] = useState(false);
  const [hoveredColumn, setHoveredColumn] = useState<number | null>(null);
  const [validGame, setValidGame] = useState(false);
  const [firstMoverId, setFirstMoverId] = useState<number | null>(null);
  const [moveCount, setMoveCount] = useState(0);
  const [gameStatus, setGameStatus] = useState<string>("in_progress");
  const [newRequestId, setNewRequestId] = useState(null);
  const navigate = useNavigate();
  const forfeitGameDialogRef = useRef<HTMLDialogElement>(null);
  const createRematchDialogRef = useRef<HTMLDialogElement>(null);
  const acceptRematchDialogRef = useRef<HTMLDialogElement>(null);

  function checkIsMyTurn(
    currentMoveCount: number,
    firstMover: number,
    myId: number,
  ): boolean {
    if (currentMoveCount % 2 === 0) {
      return firstMover === myId;
    } else {
      return firstMover !== myId;
    }
  }

  async function loadGame() {
    if (!gameId) {
      setValidGame(false);
      // setLoading(false);
      return;
    }

    const res = await fetch(`/api/games/game/${gameId}`);
    if (!res.ok) {
      // setLoading(false);
      setValidGame(false);
      return;
    }

    const gameRes = await res.json();

    const checkNickname = gameRes.opponentNickname;
    const lastChar = checkNickname.toLowerCase().slice(-1);

    if (lastChar === "s" || lastChar === "z" || lastChar === "x") {
      setNicknameEnding(true);
    } else {
      setNicknameEnding(false);
    }

    setOpponentNickname(gameRes.opponentNickname);
    setOpponentId(gameRes.opponentId);
    setFirstMoverId(gameRes.firstMove);
    setMoveCount(gameRes.moves.length);
    setGameStatus(gameRes.status);

    if (gameRes.status === "draw") {
      setDraw(true);
    }
    if (gameRes.status === "completed") {
      setWinner(gameRes.winnerId);
    }

    if (gameRes.status === "forfeited") {
      setWinner(gameRes.winnerId);
    }

    const reconstructered = reconstructBoard(gameRes.moves);
    setBoard(reconstructered);
    setValidGame(true);
    // setLoading(false);
  }

  async function checkForUpdates() {
    if (!gameId) return;

    const res = await fetch(`/api/games/game/${gameId}/status`);

    if (!res.ok) return;

    const statusData = await res.json();

    if (
      statusData.moveCount !== moveCount ||
      statusData.status !== gameStatus
    ) {
      await loadGame();
    }
  }

  useEffect(() => {
    loadGame();
  }, [gameId]);

  useEffect(() => {
    if (!validGame || !profile || !firstMoverId) return;
    if (gameStatus !== "in_progress") return;

    const myTurn = checkIsMyTurn(moveCount, firstMoverId, profile.id);
    if (myTurn) return;

    const pollInterval = setInterval(() => {
      checkForUpdates();
    }, 2500);

    return () => clearInterval(pollInterval);
  }, [validGame, profile, firstMoverId, moveCount, gameStatus]);

  function reconstructBoard(
    moves: { moveNumber: number; column: number }[],
  ): CellValue[][] {
    let board: CellValue[][] = Array(6)
      .fill(null)
      .map(() => Array(7).fill(null));
    moves.forEach((move, index) => {
      const colour: CellValue = index % 2 === 0 ? "red" : "blue"; // custom colours?

      for (let row = 5; row >= 0; row--) {
        if (board[row]![move.column] === null) {
          board[row]![move.column] = colour;
          break;
        }
      }
    });
    return board;
  }

  async function handleClick(columnNumber: number) {
    console.log("Clicked column: " + columnNumber);
    const res = await fetch(`/api/games/game/${gameId}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ move: columnNumber }),
    });

    const data = await res.json();

    if (!res.ok) {
      // @ts-ignore
      toast.error(data.message || "Move failed");
      return;
    }

    if (data.status === "draw") {
      setDraw(true);
      return;
    }

    if (data.winnerId) {
      setWinner(data.winnerId);
      return;
    }

    loadGame();

    setBoard(board);
  }

  async function handleForfeitGame(gameId: string | undefined) {
    const res = await fetch(`/api/games/game/${gameId}/forfeit`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();
    console.log(data);

    if (res.ok) {
      // @ts-ignore
      toast.success(data.message || "Game forfeited");
      forfeitGameDialogRef.current?.close();
      await loadGame();
    } else {
      // @ts-ignore
      toast.error(data.message || "Couldn't forfeit game");
    }
  }

  async function handleSendRematchRequest() {
    let newMover;
    if (firstMoverId === profile?.id) {
      newMover = opponentId;
    } else {
      newMover = profile?.id;
    }

    const res = await fetch("/api/games/requests/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        friendId: opponentId,
        firstMove: newMover,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      // @ts-ignore
      toast.success(data.message || "Rematch requested");
      createRematchDialogRef.current?.close();
    } else {
      if (data.message === "Game request already exists") {
        setNewRequestId(data.requestId);
        createRematchDialogRef.current?.close();
        acceptRematchDialogRef.current?.show();
      } else {
        // @ts-ignore
        toast.error(data.message || "Something went wrong");
      }
    }
  }

  async function handleAcceptGameRequest() {
    const res = await fetch("/api/games/requests/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestId: newRequestId,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      // @ts-ignore
      toast.success(data.message || "Game created");
      acceptRematchDialogRef.current?.close();
      navigate(`/fourInARow/${data.id}`);
    } else {
      // @ts-ignore
      toast.error(data.message || "Failed to accept game request");
    }
  }

  function getDropRow(columnIndex: number): number | null {
    for (let i = board.length - 1; i >= 0; i--) {
      if (!board[i]![columnIndex]) {
        return i;
      }
    }
    return null;
  }

  const isPlayerOne = firstMoverId === profile?.id;
  const p1Name = isPlayerOne ? "You" : opponentNickname;
  const p2Name = isPlayerOne ? opponentNickname : "You";
  const isP1Turn = moveCount % 2 === 0;
  const isP2Turn = moveCount % 2 === 1;
  const opponentSuffix = nicknameEnding ? "' turn" : "'s turn";

  return (
    <>
      <Banner />

      {winner &&
        (winner === profile?.id ? (
          <div
            className={`${styles.endgameAnimation} ${styles.winnerAnimation}`}
          >
            <div className={styles.party}>🎉</div>
          </div>
        ) : (
          <div
            className={`${styles.endgameAnimation} ${styles.loserAnimation}`}
          >
            <div className={styles.loser}>LOST!</div>
          </div>
        ))}

      {gameStatus === "forfeited" &&
        (winner === profile?.id ? (
          <div
            className={`${styles.endgameAnimation} ${styles.winnerAnimation}`}
          >
            <div className={styles.party}>🎉</div>
          </div>
        ) : (
          <div
            className={`${styles.endgameAnimation} ${styles.loserAnimation}`}
          >
            <div className={styles.loser}>LOST!</div>
          </div>
        ))}

      {draw && (
        <div className={`${styles.endgameAnimation} ${styles.winnerAnimation}`}>
          <div className={styles.draw}>DRAW</div>
        </div>
      )}

      <div className={styles.wrapper}>
        {validGame ? (
          <div className={styles.container}>
            <div className={styles.playerInfo}>
              {/* I promise I'll sort out this ternary mess someday. So fascinating though... */}
              {/* And yes, I know the styling fails for draws, but I need to move on unfortunately */}
              <div className={styles.playerRow}>
                <div
                  className={`
                  ${styles.userPiece}
                  ${styles.redUserPiece}
                  ${gameStatus === "in_progress" ? (isP1Turn ? styles.activePiece : "") : isP1Turn ? "" : styles.turnName}
                  `}
                ></div>
                <div
                  className={`
                  ${styles.username}
                  ${gameStatus === "in_progress" ? (isP1Turn ? styles.turnName : "") : isP1Turn ? "" : styles.turnName}
                `}
                >
                  {p1Name}
                  {gameStatus === "in_progress" &&
                    isP1Turn &&
                    (isPlayerOne ? "r turn" : opponentSuffix)}

                  {winner &&
                    isP2Turn &&
                    (winner === profile?.id ? " win" : " wins")}
                </div>
              </div>
              <div className={styles.playerRow}>
                <div
                  className={`
                  ${styles.userPiece} 
                  ${styles.blueUserPiece}
                  ${gameStatus === "in_progress" ? (isP2Turn ? styles.activePiece : "") : isP2Turn ? "" : styles.activePiece}
                `}
                ></div>
                <div
                  className={`
                  ${styles.username}
                  ${gameStatus === "in_progress" ? (isP2Turn ? styles.turnName : "") : isP2Turn ? "" : styles.turnName}
                `}
                >
                  {p2Name}
                  {gameStatus === "in_progress" &&
                    isP2Turn &&
                    (!isPlayerOne ? "r turn" : opponentSuffix)}

                  {winner &&
                    isP1Turn &&
                    (winner === profile?.id ? " win" : " wins")}
                </div>
              </div>
            </div>

            {draw && (
              <div className={styles.gameOver}>
                <p className={styles.gameOverTxt}>Draw!</p>
              </div>
            )}

            <table className={styles.board}>
              <tbody>
                {board.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((r, columnIndex) => {
                      const dropRow =
                        hoveredColumn !== null
                          ? getDropRow(hoveredColumn)
                          : null;
                      const isHoverTarget =
                        hoveredColumn === columnIndex && dropRow === rowIndex;
                      return (
                        <td
                          key={columnIndex}
                          className={`${styles.cells} ${isHoverTarget ? styles.hoverTarget : ""}`}
                          style={
                            {
                              "--row-index": rowIndex,
                            } as React.CSSProperties & { "--row-index": number }
                          }
                          data-testid={`${rowIndex}-${columnIndex}`}
                          onClick={() => handleClick(columnIndex)}
                          onMouseEnter={() =>
                            !winner && setHoveredColumn(columnIndex)
                          }
                          onMouseLeave={() => setHoveredColumn(null)}
                        >
                          {r ? <div className={styles[r]}></div> : <div></div>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className={styles.btnContainer}>
              {gameStatus === "in_progress" ? (
                <button
                  className={`${styles.gameBtn} ${styles.forfeitBtn}`}
                  onClick={() => forfeitGameDialogRef.current?.showModal()}
                >
                  Forfeit game
                </button>
              ) : (
                <button
                  className={`${styles.gameBtn} ${styles.replayBtn}`}
                  onClick={() => createRematchDialogRef.current?.showModal()}
                >
                  Rematch!
                </button>
              )}
              <button
                className={`${styles.gameBtn} ${styles.backBtn}`}
                onClick={() => (window.location.href = "/userGames")}
              >
                Back to Games
              </button>
            </div>

            <dialog ref={forfeitGameDialogRef}>
              <div
                className={`${styles.dialogContainer} ${styles.forfeitContainer}`}
              >
                <p>
                  Are you sure you want to forfeit your game against{" "}
                  {opponentNickname}?
                </p>
                <div className={styles.dialogOptionsWrapper}>
                  <button
                    className={`${styles.dialogBtn} ${styles.rejectDialogBtn}`}
                    onClick={() => handleForfeitGame(gameId)}
                  >
                    Confirm
                  </button>
                  <button
                    className={`${styles.dialogBtn} ${styles.cancelDialogBtn}`}
                    onClick={() => forfeitGameDialogRef.current?.close()}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </dialog>

            <dialog ref={createRematchDialogRef}>
              <div
                className={`${styles.dialogContainer} ${styles.rematchContainer}`}
              >
                <p>Play again vs. {opponentNickname}?</p>
                <div className={styles.dialogOptionsWrapper}>
                  <button
                    className={`${styles.dialogBtn} ${styles.confirmDialogBtn}`}
                    onClick={() => handleSendRematchRequest()}
                  >
                    Confirm
                  </button>
                  <button
                    className={`${styles.dialogBtn} ${styles.cancelDialogBtn}`}
                    onClick={() => createRematchDialogRef.current?.close()}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </dialog>

            <dialog ref={acceptRematchDialogRef}>
              <div
                className={`${styles.dialogContainer} ${styles.rematchContainer}`}
              >
                <p>
                  Game request already exists! Start new game with{" "}
                  {opponentNickname}?
                </p>
                <div className={styles.dialogOptionsWrapper}>
                  <button
                    className={`${styles.dialogBtn} ${styles.confirmDialogBtn}`}
                    onClick={() => handleAcceptGameRequest()}
                  >
                    Confirm
                  </button>
                  <button
                    className={`${styles.dialogBtn} ${styles.cancelDialogBtn}`}
                    onClick={() => acceptRematchDialogRef.current?.close()}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </dialog>
          </div>
        ) : (
          <>
            <h3>Game not found</h3>
            <button onClick={() => (window.location.href = "/userGames")}>
              Back to Games
            </button>
          </>
        )}
      </div>
    </>
  );
}
