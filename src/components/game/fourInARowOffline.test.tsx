import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { FourInARowOffline } from "./fourInARowOffline.js";

vi.mock("../page/banner.js", () => ({
  default: () => <div>Mocked Banner</div>,
}));

const clickColumn = (column: number) => {
  fireEvent.click(screen.getByTestId(`0-${column}`));
};

describe("Shows horizontal win", () => {
  it("detects 4 horizontals as win bottom left", () => {
    render(<FourInARowOffline />);
    clickColumn(2);
    clickColumn(2);
    clickColumn(3);
    clickColumn(3);
    clickColumn(0);
    clickColumn(0);
    clickColumn(1);
    const winnerMessage = screen.queryByText("Winner is red!");
    expect(winnerMessage).toBeTruthy();
  });
  it("does not detect 3 horizontals as win", () => {
    render(<FourInARowOffline />);
    clickColumn(0);
    clickColumn(0);
    clickColumn(1);
    clickColumn(1);
    clickColumn(2);
    expect(screen.queryByText("Winner is red!")).toBeNull();
  });
});

describe("Shows vertical win", () => {
  it("detects 4 verticals as win", () => {
    render(<FourInARowOffline />);
    clickColumn(3);
    clickColumn(0);
    clickColumn(3);
    clickColumn(0);
    clickColumn(3);
    clickColumn(0);
    clickColumn(3);
    const winnerMessage = screen.queryByText("Winner is red!");
    expect(winnerMessage).toBeTruthy();
  });
  it("does not detect 3 verticals as win", () => {
    render(<FourInARowOffline />);
    clickColumn(3);
    clickColumn(0);
    clickColumn(3);
    clickColumn(0);
    clickColumn(3);
    expect(screen.queryByText("Winner is red!")).toBeNull();
  });
});

describe("Shows falling diagonal win", () => {
  it("detects 4 falling diagonals as a win", () => {
    render(<FourInARowOffline />);
    clickColumn(6);
    clickColumn(5);
    clickColumn(5);
    clickColumn(4);
    clickColumn(3);
    clickColumn(4);
    clickColumn(4);
    clickColumn(3);
    clickColumn(0);
    clickColumn(3);
    clickColumn(3);
    const winnerMessage = screen.queryByText("Winner is red!");
    expect(winnerMessage).toBeTruthy();
  });
  it("does not detect 3 falling diagonals as a win", () => {
    render(<FourInARowOffline />);
    clickColumn(0);
    clickColumn(0);
    clickColumn(0);
    clickColumn(1);
    clickColumn(2);
    clickColumn(3);
    clickColumn(1);
    expect(screen.queryByText("Winner is red!")).toBeNull();
  });
});

describe("Shows rising diagonal win", () => {
  it("detects 4 rising diagonals as a win", () => {
    render(<FourInARowOffline />);
    clickColumn(3);
    clickColumn(2);
    clickColumn(4);
    clickColumn(3);
    clickColumn(4);
    clickColumn(4);
    clickColumn(5);
    clickColumn(5);
    clickColumn(5);
    clickColumn(5);
    const winnerMessage = screen.queryByText("Winner is blue!");
    expect(winnerMessage).toBeTruthy();
  });
  it("does not detect 3 rising diagonals as a win", () => {
    render(<FourInARowOffline />);
    clickColumn(3);
    clickColumn(2);
    clickColumn(4);
    clickColumn(3);
    clickColumn(4);
    clickColumn(4);
    expect(screen.queryByText("Winner is blue!")).toBeNull();
  });
});

describe("Makes pieces fall down to closest available cell", () => {
  it("falls all the way down when there's no pieces on the board", () => {
    render(<FourInARowOffline />);
    clickColumn(0);
    const bottomLeftCell = screen.getByTestId("5-0");
    expect(bottomLeftCell.querySelector("div")).toBeTruthy();
  });
  it("falls on top of other piece", () => {
    render(<FourInARowOffline />);
    clickColumn(6);
    clickColumn(6);
    clickColumn(5);
    clickColumn(5);
    const cell4_6 = screen.getByTestId("4-6");
    const cell4_5 = screen.getByTestId("4-5");
    expect(cell4_6.querySelector("div")).toBeTruthy();
    expect(cell4_5.querySelector("div")).toBeTruthy();
  });
  it("doesn't change turns after clicking a full column", () => {
    render(<FourInARowOffline />);
    clickColumn(0);
    clickColumn(0);
    clickColumn(0);
    clickColumn(0);
    clickColumn(0);
    clickColumn(0);
    clickColumn(0); // This is the superfluous click
    clickColumn(1);
    const cell5_1 = screen.getByTestId("5-1");
    expect(cell5_1.querySelector("div")).toBeTruthy();
  });
});

describe("Asks user to play again", () => {
  it("returns play again message", () => {
    render(<FourInARowOffline />);
    clickColumn(0);
    clickColumn(0);
    clickColumn(1);
    clickColumn(1);
    clickColumn(2);
    clickColumn(2);
    clickColumn(3);
    const gameOverMessage = screen.queryByText("Play again?");
    expect(gameOverMessage).toBeTruthy();
  });
  it("resets board after clicking play again", () => {
    render(<FourInARowOffline />);
    clickColumn(0);
    clickColumn(1);
    clickColumn(0);
    clickColumn(1);
    clickColumn(0);
    clickColumn(1);
    clickColumn(0);
    const playAgainButton = screen.getByText("Play again?");
    fireEvent.click(playAgainButton);
    const cell5_0 = screen.getByTestId("5-0");
    expect(cell5_0.querySelector("div")).toBeNull();
  });
});

it("prevents user from clicking board after winner is declared", () => {
  render(<FourInARowOffline />);
  clickColumn(0);
  clickColumn(0);
  clickColumn(1);
  clickColumn(1);
  clickColumn(2);
  clickColumn(2);
  clickColumn(3);

  const blueCountBeforeClick = screen.queryAllByText("blue").length;

  clickColumn(3);

  const blueCountAfterClick = screen.queryAllByText("blue").length;
  expect(blueCountAfterClick).toBe(blueCountBeforeClick);
});

describe("Checks draw condition", () => {
  it("Asks user to play again when draw condition is met", () => {
    render(<FourInARowOffline />);
    clickColumn(0);
    clickColumn(1);
    clickColumn(0);
    clickColumn(1);
    clickColumn(0);
    clickColumn(1);

    clickColumn(1);
    clickColumn(0);
    clickColumn(1);
    clickColumn(0);
    clickColumn(1);
    clickColumn(0);

    clickColumn(2);
    clickColumn(3);
    clickColumn(2);
    clickColumn(3);
    clickColumn(2);
    clickColumn(3);

    clickColumn(3);
    clickColumn(2);
    clickColumn(3);
    clickColumn(2);
    clickColumn(3);
    clickColumn(2);

    clickColumn(4);
    clickColumn(5);
    clickColumn(4);
    clickColumn(5);
    clickColumn(4);
    clickColumn(5);

    clickColumn(5);
    clickColumn(4);
    clickColumn(5);
    clickColumn(4);
    clickColumn(5);
    clickColumn(4);

    clickColumn(6);
    clickColumn(6);
    clickColumn(6);
    clickColumn(6);
    clickColumn(6);
    clickColumn(6);
    const noWinnerMessage = screen.getByText("No winner :(");
    const playAgainMessage = screen.getByText("Play again?");
    expect(noWinnerMessage).toBeTruthy();
    expect(playAgainMessage).toBeTruthy();
  });
});
