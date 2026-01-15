import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FourInARow } from "./fourInARow.js";

vi.mock("./banner.js", () => ({
  Banner: () => <div>Mocked Banner</div>,
}));

describe("Shows horizontal win", () => {
  it("detects 2 horizontals as win", () => {
    render(<FourInARow />);

    fireEvent.click(screen.getByText("(0, 0)"));
    fireEvent.click(screen.getByText("(1, 0)"));
    fireEvent.click(screen.getByText("(0, 1)"));
    const winnerMessage = screen.queryByText("Winner is red");
    expect(winnerMessage).toBeTruthy();
  });
});

describe("Asks user to play again", () => {
  it("returns play again message", () => {
    render(<FourInARow />);
    fireEvent.click(screen.getByText("(0, 0)"));
    fireEvent.click(screen.getByText("(1, 0)"));
    fireEvent.click(screen.getByText("(0, 1)"));
    const gameOverMessage = screen.queryByText("Play again?");
    expect(gameOverMessage).toBeTruthy();
  });
});

it("prevents user from clicking board after winner is declared", () => {
  render(<FourInARow />);
  fireEvent.click(screen.getByText("(0, 0)"));
  fireEvent.click(screen.getByText("(1, 0)"));
  fireEvent.click(screen.getByText("(0, 1)"));
  fireEvent.click(screen.getByText("(1, 1)"));
  expect(screen.queryByText("(1, 1)")).toBeTruthy();
});
