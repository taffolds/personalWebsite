import { describe, it, expect } from "vitest";
import { checkWinner } from "../../utils/winValidation.js";

type CellValue = null | number;

function buildBoardFromMoves(moves: number[]): CellValue[][] {
  const board: CellValue[][] = Array(6)
    .fill(null)
    .map(() => Array(7).fill(null));

  moves.forEach((column, index) => {
    const playerId = index % 2 === 0 ? 1 : 2;

    for (let row = 5; row >= 0; row--) {
      if (board[row]![column] === null) {
        board[row]![column] = playerId;
        break;
      }
    }
  });

  return board;
}

describe("Shows horizontal win", () => {
  it("detects 4 horizontals as win bottom left", () => {
    const board = buildBoardFromMoves([2, 2, 3, 3, 0, 0, 1]);
    const winner = checkWinner(board);
    expect(winner).toBe(1);
  });

  it("does not detect 3 horizontals as win", () => {
    const board = buildBoardFromMoves([0, 0, 1, 1, 2]);
    const winner = checkWinner(board);
    expect(winner).toBeNull();
  });
});

describe("Shows vertical win", () => {
  it("detects 4 verticals as win", () => {
    const board = buildBoardFromMoves([3, 0, 3, 0, 3, 0, 3]);
    const winner = checkWinner(board);
    expect(winner).toBe(1);
  });

  it("does not detect 3 verticals as win", () => {
    const board = buildBoardFromMoves([3, 0, 3, 0, 3]);
    const winner = checkWinner(board);
    expect(winner).toBeNull();
  });
});

describe("Shows falling diagonal as win", () => {
  it("detects 4 falling diagonals as win", () => {
    const board = buildBoardFromMoves([6, 5, 5, 4, 3, 4, 4, 3, 0, 3, 3]);
    const winner = checkWinner(board);
    expect(winner).toBe(1);
  });

  it("does not detect 3 falling diagonals as win", () => {
    const board = buildBoardFromMoves([0, 0, 0, 1, 2, 3, 1]);
    const winner = checkWinner(board);
    expect(winner).toBeNull();
  });
});

describe("Shows rising diagonal win", () => {
  it("detects 4 rising diagonals as win", () => {
    const board = buildBoardFromMoves([3, 2, 4, 3, 4, 4, 5, 5, 5, 5]);
    const winner = checkWinner(board);
    expect(winner).toBe(2);
  });

  it("does not detect 3 rising diagonals as win", () => {
    const board = buildBoardFromMoves([3, 2, 4, 3, 4, 4]);
    const winner = checkWinner(board);
    expect(winner).toBeNull();
  });
});

describe("Checks draw condition", () => {
  it("returns draw when board is full with no winner", () => {
    const board = buildBoardFromMoves([
      0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 2, 3, 2, 3, 2, 3, 3, 2, 3, 2, 3, 2, 4,
      5, 4, 5, 4, 5, 5, 4, 5, 4, 5, 4, 6, 6, 6, 6, 6, 6,
    ]);
    const res = checkWinner(board);
    expect(res).toBe("draw");
  });
});
