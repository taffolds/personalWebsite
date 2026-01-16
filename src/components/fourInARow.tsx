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

export function FourInARow() {
  const [squares, setSquares] = useState<CellValue[][]>(createEmptyGame());
  const [turn, setTurn] = useState<CellValue>("red");
  const [winner, setWinner] = useState<CellValue>(null);

  useEffect(() => {
    const checkWinner = (): CellValue => {
      const winningLength = 3;

      for (let rowIndex = 0; rowIndex < squares.length; rowIndex++) {
        const row = squares[rowIndex];

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

    setWinner(checkWinner());
  }, [squares]);

  function handleClick(rowIndex: number, columnIndex: number) {
    console.log(`Clicked cell at row: ${rowIndex}, column: ${columnIndex}`);

    if (winner) return;

    setSquares((old) => {
      if (old[rowIndex]![columnIndex]) return old;

      const updated = [...old];
      updated[rowIndex] = [...updated[rowIndex]!];
      updated[rowIndex][columnIndex] = turn;
      setTurn((t) => (t === "red" ? "blue" : "red"));
      return updated;
    });
  }

  function handleNewGame() {
    setWinner(null);
    setTurn("red");
    setSquares(createEmptyGame());
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
          {squares.map((row, rowIndex) => (
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
