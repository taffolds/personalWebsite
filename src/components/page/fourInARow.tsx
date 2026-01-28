import React, { useEffect, useState } from "react";
import Banner from "./banner.js";
import styles from "./fourInARow.module.css";

type CellValue = null | "red" | "blue";

function createEmptyGame(): CellValue[][] {
  return Array(6)
    .fill(null)
    .map(() => Array(7).fill(null));
}

// COLUMN: board.length = 6
// ROW: board[0].length = 7

const winningLength = 4;

const checkWinner = (board: CellValue[][]): CellValue => {
  return (
    checkHorizontalWin(board) ||
    checkVerticalWin(board) ||
    checkFallingDiagonalWin(board) ||
    checkRisingDiagonalWin(board)
  );
};

const checkRisingDiagonalWin = (board: CellValue[][]): CellValue => {
  for (let rowIndex = winningLength - 1; rowIndex < board.length; rowIndex++) {
    for (
      let columnIndex = 0;
      columnIndex <= board[0]!.length - winningLength;
      columnIndex++
    ) {
      const valueInCell = board[rowIndex]![columnIndex];
      if (valueInCell === null) continue;
      let isWinner = true;
      for (let i = 1; i < winningLength; i++) {
        if (board[rowIndex - i]![columnIndex + i] !== valueInCell) {
          isWinner = false;
          break;
        }
      }
      if (isWinner) return valueInCell!;
    }
  }
  return null;
};

const checkFallingDiagonalWin = (board: CellValue[][]): CellValue => {
  // row length - winning length
  // column length - winning length
  // for each iteration, add one to row and column
  for (let rowIndex = 0; rowIndex <= board.length - winningLength; rowIndex++) {
    for (
      let columnIndex = 0;
      columnIndex <= board[0]!.length - winningLength;
      columnIndex++
    ) {
      const valueInCell = board[rowIndex]![columnIndex];
      if (valueInCell === null) continue;
      let isWinner = true;
      for (let i = 1; i < winningLength; i++) {
        if (board[rowIndex + i]![columnIndex + i] !== valueInCell) {
          isWinner = false;
          break;
        }
      }
      if (isWinner) return valueInCell!;
    }
  }
  return null;
};

const checkHorizontalWin = (board: CellValue[][]): CellValue => {
  for (let rowIndex = 0; rowIndex < board.length; rowIndex++) {
    const row = board[rowIndex];

    for (
      let columnIndex = 0;
      columnIndex <= row!.length - winningLength;
      columnIndex++
    ) {
      const valueInCell = row![columnIndex];
      if (valueInCell === null) continue;
      let isWinner = true;
      for (let i = 1; i < winningLength; i++) {
        if (row![columnIndex + i] !== valueInCell) {
          isWinner = false;
          break;
        }
      }

      if (isWinner) return valueInCell!;
    }
  }
  return null;
};

const checkVerticalWin = (board: CellValue[][]): CellValue => {
  for (let columnIndex = 0; columnIndex < board[0]!.length; columnIndex++) {
    for (
      let rowIndex = 0;
      rowIndex <= board.length - winningLength;
      rowIndex++
    ) {
      const valueInCell = board[rowIndex]![columnIndex];
      if (valueInCell === null) continue;
      let isWinner = true;
      for (let i = 1; i < winningLength; i++) {
        if (board![rowIndex + i]![columnIndex] !== valueInCell) {
          isWinner = false;
          break;
        }
      }
      if (isWinner) return valueInCell!;
    }
  }
  return null;
};

export function FourInARow() {
  const [board, setBoard] = useState<CellValue[][]>(createEmptyGame());
  const [turn, setTurn] = useState<CellValue>("red");
  const [winner, setWinner] = useState<CellValue>(null);
  const [hoveredColumn, setHoveredColumn] = useState<number | null>(null);

  useEffect(() => {
    setWinner(checkWinner(board));
  }, [board]);

  const isDraw =
    !winner && board.every((row) => row.every((cell) => cell !== null));

  function handleClick(columnIndex: number) {
    if (winner) return;
    setBoard((oldBoard) => {
      for (let i = board.length - 1; i >= 0; i--) {
        if (!oldBoard[i]![columnIndex]) {
          const updated = [...oldBoard];
          updated[i] = [...updated[i]!];
          updated[i]![columnIndex] = turn;
          setTurn((t) => (t === "red" ? "blue" : "red"));
          return updated;
        }
      }
      return oldBoard;
    });
  }

  function handleNewGame() {
    setWinner(null);
    setTurn("red");
    setBoard(createEmptyGame());
  }

  function getDropRow(columnIndex: number): number | null {
    for (let i = board.length - 1; i >= 0; i--) {
      if (!board[i]![columnIndex]) {
        return i;
      }
    }
    return null;
  }

  return (
    <>
      <Banner />
      <h1>Four In a Row</h1>
      {!winner || (!isDraw && <p>{turn}'s turn</p>)}

      {winner && (
        <>
          <p>Winner is {winner}</p>
          <p onClick={() => handleNewGame()}>Play again?</p>
        </>
      )}

      {isDraw && (
        <>
          <p>No winner</p>
          <p onClick={() => handleNewGame()}>Play again?</p>
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
                      `(${rowIndex}, ${columnIndex})`
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
