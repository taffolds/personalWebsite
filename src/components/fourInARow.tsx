import React, { useState } from "react";
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

  function handleClick(rowIndex: number, columnIndex: number) {
    console.log(`Clicked cell at row: ${rowIndex}, column: ${columnIndex}`);
  }

  return (
    <>
      <Banner />
      <h1>Game goes here</h1>

      <table>
        <tbody>
          {squares.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((column, columnIndex) => (
                <td
                  key={columnIndex}
                  className="cells"
                  onClick={() => handleClick(rowIndex, columnIndex)}
                >
                  {`(${rowIndex}, ${columnIndex})`}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
