import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FourInARow } from "./fourInARow.js";

vi.mock("./banner.js", () => ({
  Banner: () => <div>Mocked Banner</div>,
}));

const clickCell = (row: number, column: number) => {
  fireEvent.click(screen.getByTestId(`${row}-${column}`));
};

describe("Shows horizontal win", () => {
  it("detects 3 horizontals as win", () => {
    render(<FourInARow />);
    clickCell(2, 0);
    clickCell(1, 0);
    clickCell(2, 1);
    clickCell(0, 2);
    clickCell(2, 2);
    const winnerMessage = screen.queryByText("Winner is red");
    expect(winnerMessage).toBeTruthy();
  });

  it("does not detect 2 horizontals as win", () => {
    render(<FourInARow />);
    clickCell(2, 0);
    clickCell(1, 0);
    clickCell(2, 1);
    expect(screen.queryByText("Winner is red")).toBeNull();
  });
});

describe("Asks user to play again", () => {
  it("returns play again message", () => {
    render(<FourInARow />);
    clickCell(0, 0);
    clickCell(1, 0);
    clickCell(0, 1);
    const gameOverMessage = screen.queryByText("Play again?");
    expect(gameOverMessage).toBeTruthy();
  });
});

it("prevents user from clicking board after winner is declared", () => {
  render(<FourInARow />);
  clickCell(0, 0);
  clickCell(1, 0);
  clickCell(0, 1);
  clickCell(1, 1);
  expect(screen.queryByText("(1, 1)")).toBeTruthy();
});
