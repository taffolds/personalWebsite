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
  it("detects 4 horizontals as win", () => {
    render(<FourInARow />);
    clickCell(3, 3);
    clickCell(0, 0);
    clickCell(3, 4);
    clickCell(1, 1);
    clickCell(3, 5);
    clickCell(1, 5);
    clickCell(3, 6);
    const winnerMessage = screen.queryByText("Winner is red");
    expect(winnerMessage).toBeTruthy();
  });

  it("does not detect 3 horizontals as win", () => {
    render(<FourInARow />);
    clickCell(2, 0);
    clickCell(1, 0);
    clickCell(2, 1);
    clickCell(1, 1);
    clickCell(2, 2);
    expect(screen.queryByText("Winner is red")).toBeNull();
  });
});

describe("Shows vertical win", () => {
  it("detects 4 verticals as win", () => {
    render(<FourInARow />);
    clickCell(1, 3);
    clickCell(0, 0);
    clickCell(2, 3);
    clickCell(1, 0);
    clickCell(3, 3);
    clickCell(2, 0);
    clickCell(4, 3);
    const winnerMessage = screen.queryByText("Winner is red");
    expect(winnerMessage).toBeTruthy();
  });
  it("does not detect 3 verticals as win", () => {
    render(<FourInARow />);
    clickCell(1, 3);
    clickCell(0, 0);
    clickCell(2, 3);
    clickCell(1, 0);
    clickCell(3, 3);
    expect(screen.queryByText("Winner is red")).toBeNull();
  });
});

describe("Asks user to play again", () => {
  it("returns play again message", () => {
    render(<FourInARow />);
    clickCell(0, 0);
    clickCell(1, 0);
    clickCell(0, 1);
    clickCell(1, 2);
    clickCell(0, 2);
    clickCell(1, 3);
    clickCell(0, 3);
    const gameOverMessage = screen.queryByText("Play again?");
    expect(gameOverMessage).toBeTruthy();
  });
});

it("prevents user from clicking board after winner is declared", () => {
  render(<FourInARow />);
  clickCell(0, 0);
  clickCell(1, 0);
  clickCell(0, 1);
  clickCell(1, 2);
  clickCell(0, 2);
  clickCell(1, 3);
  clickCell(0, 3);

  const blueCountBeforeClick = screen.queryAllByText("blue").length;

  clickCell(1, 3);

  const blueCountAfterClick = screen.queryAllByText("blue").length;
  expect(blueCountAfterClick).toBe(blueCountBeforeClick);
});
