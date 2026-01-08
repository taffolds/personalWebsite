import React, { useEffect, useState } from "react";
import { Banner } from "./banner.js";
// @ts-ignore
import "../styles.css";

type CellValue = null | "red" | "blue";

export function FourInARow() {
  const [squares, setSquares] = useState<CellValue[][]>([
    [null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null],
  ]);
  const [turn, setTurn] = useState<CellValue>("red");
  const [winner, setWinner] = useState<CellValue>(null);

  useEffect(() => {
    const checkWinner = (): CellValue => {
      for (let rowIndex = 0; rowIndex < squares.length; rowIndex++) {
        const row = squares[rowIndex];
        if (row && row[0] !== null && row[0] === row[1]) {
          console.log(`Winner is ${row[0]}`);
          return row[0] as CellValue;
        }
      }
      return null;
    };

    setWinner(checkWinner());
  }, [squares]);

  function handleClick(rowIndex: number, columnIndex: number) {
    console.log(`Clicked cell at row: ${rowIndex}, column: ${columnIndex}`);

    setSquares((old) => {
      if (old[rowIndex]![columnIndex]) return old;

      const updated = [...old];
      updated[rowIndex] = [...updated[rowIndex]!];
      updated[rowIndex][columnIndex] = turn;
      setTurn((t) => (t === "red" ? "blue" : "red"));
      return updated;
    });
  }

  return (
    <>
      <Banner />
      <h1>Game goes here</h1>

      <table>
        <tbody>
          {squares.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((r, columnIndex) => (
                <td
                  key={columnIndex}
                  className="cells"
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
