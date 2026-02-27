import {
  createEmptyBoard,
  applyMove,
  reconstructBoard,
} from "../../utils/boardHelper.js";
import { describe, it, expect } from "vitest";

describe("Apply move", () => {
  it("should place piece in bottom of empty column", () => {
    const board = createEmptyBoard();
    const playerId = 1;
    const updatedBoard = applyMove(board, 3, playerId);

    expect(updatedBoard).not.toBeNull();
    expect(updatedBoard![5]![3]).toBe(1);
  });

  it("should put pieces on top of each other", () => {
    const board = createEmptyBoard();

    const move1 = applyMove(board, 0, 1);
    const move2 = applyMove(move1!, 0, 2);
    const move3 = applyMove(move2!, 0, 1);

    expect(move1![5]![0]).toBe(1);
    expect(move2![4]![0]).toBe(2);
    expect(move3![3]![0]).toBe(1);
  });

  it("should return null when column is full", () => {
    const board = createEmptyBoard();

    const move1 = applyMove(board, 0, 1);
    const move2 = applyMove(move1!, 0, 2);
    const move3 = applyMove(move2!, 0, 1);
    const move4 = applyMove(move3!, 0, 2);
    const move5 = applyMove(move4!, 0, 1);
    const move6 = applyMove(move5!, 0, 2);

    const res = applyMove(move6!, 0, 1);
    expect(res).toBeNull();
  });
});

describe("Reconstruct board", () => {
  it("should reconstruct game from moves", () => {
    const carla = 1;
    const peter = 2;
    const moves = [
      { moveNumber: 1, column: 3 },
      { moveNumber: 2, column: 3 },
      { moveNumber: 3, column: 3 },
      { moveNumber: 4, column: 4 },
      { moveNumber: 5, column: 3 },
      { moveNumber: 6, column: 6 },
    ];

    const board = reconstructBoard(moves, carla, peter, carla);

    expect(board[5]![3]).toBe(carla);
    expect(board[4]![3]).toBe(peter);
    expect(board[3]![3]).toBe(carla);
    expect(board[5]![4]).toBe(peter);
    expect(board[2]![3]).toBe(carla);
    expect(board[5]![6]).toBe(peter);
  });

  it("should handle game with no moves yet", () => {
    const board = reconstructBoard([], 1, 2, 1);
    expect(board[5]![0]).toBeNull();
    expect(board[5]![1]).toBeNull();
    expect(board[5]![2]).toBeNull();
    expect(board[5]![3]).toBeNull();
    expect(board[5]![4]).toBeNull();
    expect(board[5]![5]).toBeNull();
    expect(board[5]![6]).toBeNull();
  });

  it("should handle player two as firstMover", () => {
    const playerOne = 1;
    const playerTwo = 2;
    const moves = [
      { moveNumber: 1, column: 5 },
      { moveNumber: 2, column: 5 },
    ];

    const board = reconstructBoard(moves, playerOne, playerTwo, playerTwo);

    expect(board[5]![5]).toBe(playerTwo);
    expect(board[4]![5]).toBe(playerOne);
  });
});
