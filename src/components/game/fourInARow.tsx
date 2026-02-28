import React, { useEffect, useState } from "react";
import Banner from "../page/banner.js";
import styles from "./fourInARow.module.css";
import { useParams } from "react-router-dom";
import { useUser } from "../../contexts/UserContext.js";

type CellValue = null | "red" | "blue";

function createEmptyGame(): CellValue[][] {
  return Array(6)
    .fill(null)
    .map(() => Array(7).fill(null));
}

// COLUMN: board.length = 6
// ROW: board[0].length = 7

export function FourInARow() {
  const { gameId } = useParams<{ gameId: string }>();
  const { profile } = useUser();
  const [loading, setLoading] = useState(true);
  const [board, setBoard] = useState<CellValue[][]>(createEmptyGame());
  const [opponentNickname, setOpponentNickname] = useState<string>("");
  const [turn, setTurn] = useState<CellValue>();
  const [winner, setWinner] = useState<number | null>(null); // Redo this
  const [draw, setDraw] = useState(false);
  const [hoveredColumn, setHoveredColumn] = useState<number | null>(null);
  const [validGame, setValidGame] = useState(false);
  // const location = useLocation();

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
    if (res.ok) {
      setOpponentNickname(gameRes.opponentNickname);

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
  }

  useEffect(() => {
    loadGame();
  }, [gameId]);

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

    if (!res.ok) {
      alert("move failed");
      return;
    }

    const data = await res.json();
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
      {validGame ? (
        <div className={styles.container}>
          <h1>Four In a Row</h1>
          {!winner && !draw && opponentNickname && (
            <>
              <p>Playing against {opponentNickname}</p>
              <p>{turn}'s turn</p>
            </>
          )}

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
                      hoveredColumn !== null ? getDropRow(hoveredColumn) : null;
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
    </>
  );
}
