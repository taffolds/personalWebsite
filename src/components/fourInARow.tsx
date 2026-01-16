import React, { useEffect, useState } from "react";
import { Banner } from "./banner.js";
// @ts-ignore
import "../styles.css";

type CellValue = null | "red" | "blue";

function createEmptyGame(): CellValue[][] {
  return Array(6)
    .fill(null)
    .map(() => Array(7).fill(null));
}

const checkWinner = (board: CellValue[][]): CellValue => {
  return checkHorizontalWin(board);
};

const checkHorizontalWin = (board: CellValue[][]): CellValue => {
  const winningLength = 4;

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

export function FourInARow() {
  const [board, setBoard] = useState<CellValue[][]>(createEmptyGame());
  const [turn, setTurn] = useState<CellValue>("red");
  const [winner, setWinner] = useState<CellValue>(null);

  useEffect(() => {
    setWinner(checkWinner(board));
  }, [board]);

  function handleClick(rowIndex: number, columnIndex: number) {
    if (winner) return;

    setBoard((oldBoard) => {
      if (oldBoard[rowIndex]![columnIndex]) return oldBoard;

      const updated = [...oldBoard];
      updated[rowIndex] = [...updated[rowIndex]!];
      updated[rowIndex][columnIndex] = turn;
      setTurn((t) => (t === "red" ? "blue" : "red"));
      return updated;
    });
  }

  function handleNewGame() {
    setWinner(null);
    setTurn("red");
    setBoard(createEmptyGame());
  }

  return (
    <>
      <Banner />
      <h1>Four In a Row</h1>
      {!winner && <p>{turn}'s turn</p>}

      {winner && (
        <>
          <p>Winner is {winner}</p>
          <p onClick={() => handleNewGame()}>Play again?</p>
        </>
      )}

      <table>
        <tbody>
          {board.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((r, columnIndex) => (
                <td
                  key={columnIndex}
                  className="cells"
                  data-testid={`${rowIndex}-${columnIndex}`}
                  onClick={() => handleClick(rowIndex, columnIndex)}
                >
                  {r || `(${rowIndex}, ${columnIndex})`}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
