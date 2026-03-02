import React, { useEffect, useState } from "react";
import Banner from "../page/banner.js";
import styles from "./fourInARow.module.css";
import { useParams } from "react-router-dom";
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
  const [loading, setLoading] = useState(true);
  const [board, setBoard] = useState<CellValue[][]>(createEmptyGame());
  const [opponentNickname, setOpponentNickname] = useState<string>("");
  const [winner, setWinner] = useState<number | null>(null); // Redo this
  const [draw, setDraw] = useState(false);
  const [hoveredColumn, setHoveredColumn] = useState<number | null>(null);
  const [validGame, setValidGame] = useState(false);
  const [firstMoverId, setFirstMoverId] = useState<number | null>(null);
  const [moveCount, setMoveCount] = useState(0);
  const [gameStatus, setGameStatus] = useState<string>("in_progress");

  function isMyTurn(
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
      setLoading(false);
      return;
    }

    const res = await fetch(`/api/games/game/${gameId}`);
    if (!res.ok) {
      setLoading(false);
      setValidGame(false);
      return;
    }

    const gameRes = await res.json();

    setOpponentNickname(gameRes.opponentNickname);
    setFirstMoverId(gameRes.firstMove);
    setMoveCount(gameRes.moves.length);
    setGameStatus(gameRes.status);

    if (gameRes.status === "draw") {
      setDraw(true);
    }
    if (gameRes.status === "completed") {
      setWinner(gameRes.winnerId);
    }

    const reconstructered = reconstructBoard(gameRes.moves);
    setBoard(reconstructered);
    setValidGame(true);
    setLoading(false);
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

    const myTurn = isMyTurn(moveCount, firstMoverId, profile.id);
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
    // or load? getting so tired
  }

  function getDropRow(columnIndex: number): number | null {
    for (let i = board.length - 1; i >= 0; i--) {
      if (!board[i]![columnIndex]) {
        return i;
      }
    }
    return null;
  }

  function getWinnerDisplay() {
    if (!winner) return null;

    if (winner === profile?.id) {
      return "You win!";
    } else {
      return `${opponentNickname} wins!`;
    }
  }

  return (
    <>
      <div className={styles.rotateOverlay}>
        <div className={styles.rotateContent}>
          <div className={styles.rotateIcon}></div>
          <p>Please rotate device</p>
        </div>
      </div>

      <Banner />
      <div className={styles.wrapper}>
        {validGame ? (
          <div className={styles.container}>
            <h3>firstMove.nickname vs second.Move nickname</h3>
            {!winner && !draw && opponentNickname && <p>player?'s turn</p>}

            {winner && (
              <>
                <p>{getWinnerDisplay()}</p>
                <p>Play again? set up backend</p>
              </>
            )}

            {draw && (
              <>
                <p>Draw!</p>
                <p>Play again? set up backend</p>
              </>
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
                          {r ? (
                            <div className={styles[r]}></div>
                          ) : (
                            `(${rowIndex}, ${columnIndex})` // yuck
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <>
            <h3>Didn't recognise game</h3>
            <p>Get message from server?</p>
          </>
        )}
      </div>
    </>
  );
}
