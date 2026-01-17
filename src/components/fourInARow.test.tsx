import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
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

describe("Shows falling diagonal win", () => {
  it("detects 4 falling diagonals in the top left as a win", () => {
    render(<FourInARow />);
    clickCell(0, 0);
    clickCell(0, 1);
    clickCell(1, 1);
    clickCell(1, 2);
    clickCell(2, 2);
    clickCell(2, 3);
    clickCell(3, 3);
    const winnerMessage = screen.queryByText("Winner is red");
    expect(winnerMessage).toBeTruthy();
  });
  it("detects 4 falling diagonals in the bottom right as a win", () => {
    render(<FourInARow />);
    clickCell(0, 0);
    clickCell(5, 6);
    clickCell(0, 6);
    clickCell(3, 4);
    clickCell(5, 0);
    clickCell(2, 3);
    clickCell(4, 0);
    clickCell(4, 5);
    const winnerMessage = screen.getByText("Winner is blue");
    expect(winnerMessage).toBeTruthy();
  });
  it("does not detect 3 falling diagonals as a win", () => {
    render(<FourInARow />);
    clickCell(0, 0);
    clickCell(1, 0);
    clickCell(1, 1);
    clickCell(2, 0);
    clickCell(2, 2);
    expect(screen.queryByText("Winner is red")).toBeNull();
  });
});

describe("Shows rising diagonal win", () => {
  it("detects 4 rising diagonals bottom left as a win", () => {
    render(<FourInARow />);
    clickCell(5, 0);
    clickCell(0, 0);
    clickCell(4, 1);
    clickCell(0, 1);
    clickCell(3, 2);
    clickCell(0, 2);
    clickCell(2, 3);
    const winnerMessage = screen.queryByText("Winner is red");
    expect(winnerMessage).toBeTruthy();
  });

  it("detects 4 rising diagonals top right as a win", () => {
    render(<FourInARow />);
    clickCell(5, 0);
    clickCell(1, 5);
    clickCell(4, 0);
    clickCell(3, 3);
    clickCell(3, 0);
    clickCell(0, 6);
    clickCell(5, 1);
    clickCell(2, 4);
    const winnerMessage = screen.getByText("Winner is blue");
    expect(winnerMessage).toBeTruthy();
  });
  it("does not detect 3 rising diagonals as a win", () => {
    render(<FourInARow />);
    clickCell(5, 2);
    clickCell(5, 0);
    clickCell(4, 3);
    clickCell(4, 0);
    clickCell(3, 4);
    expect(screen.queryByText("Winner is red")).toBeNull();
  });
});

describe("Makes pieces fall down to closest available cell", () => {
  it("falls all the way down when there's no pieces on the board", () => {
    render(<FourInARow />);
    clickCell(0, 0);
    const bottomLeftCell = screen.getByTestId("5-0");
    expect(bottomLeftCell).toHaveTextContent("red");
  });
  it("falls on top of other piece", () => {
    render(<FourInARow />);
    clickCell(0, 6);
    clickCell(0, 6);
    clickCell(0, 5);
    clickCell(0, 5);
    const cell4_6 = screen.getByTestId("4-6");
    const cell4_5 = screen.getByTestId("4-5");
    expect(cell4_6).toHaveTextContent("blue");
    expect(cell4_5).toHaveTextContent("blue");
  });
  it("doesn't change turns after clicking a full column", () => {
    render(<FourInARow />);
    clickCell(0, 0);
    clickCell(0, 0);
    clickCell(0, 0);
    clickCell(0, 0);
    clickCell(0, 0);
    clickCell(0, 0);
    clickCell(0, 0); // This is the superfluous click
    clickCell(0, 1);
    const cell5_1 = screen.getByTestId("5-1");
    expect(cell5_1).toHaveTextContent("red");
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
