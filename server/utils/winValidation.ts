type BoardCondition = null | number | "draw";
type CellValue = null | number;

const winningLength = 4;

export function checkWinner(board: CellValue[][]): BoardCondition {
  return (
    checkHorizontalWin(board) ||
    checkVerticalWin(board) ||
    checkFallingDiagonalWin(board) ||
    checkRisingDiagonalWin(board) ||
    checkDraw(board)
  );
}

const checkRisingDiagonalWin = (board: CellValue[][]): BoardCondition => {
  for (let rowIndex = winningLength - 1; rowIndex < board.length; rowIndex++) {
    for (
      let columnIndex = 0;
      columnIndex <= board[0]!.length - winningLength;
      columnIndex++
    ) {
      const valueInCell = board[rowIndex]![columnIndex];
      if (valueInCell === null) continue;
      let isWinner = true;
      for (let i = 1; i < winningLength; i++) {
        if (board[rowIndex - i]![columnIndex + i] !== valueInCell) {
          isWinner = false;
          break;
        }
      }
      if (isWinner) return valueInCell ?? null; // typescript duct tape for commit
    }
  }
  return null;
};

const checkFallingDiagonalWin = (board: CellValue[][]): BoardCondition => {
  for (let rowIndex = 0; rowIndex <= board.length - winningLength; rowIndex++) {
    for (
      let columnIndex = 0;
      columnIndex <= board[0]!.length - winningLength;
      columnIndex++
    ) {
      const valueInCell = board[rowIndex]![columnIndex];
      if (valueInCell === null) continue;
      let isWinner = true;
      for (let i = 1; i < winningLength; i++) {
        if (board[rowIndex + i]![columnIndex + i] !== valueInCell) {
          isWinner = false;
          break;
        }
      }
      if (isWinner) return valueInCell ?? null;
    }
  }
  return null;
};

const checkHorizontalWin = (board: CellValue[][]): BoardCondition => {
  for (let rowIndex = 0; rowIndex < board.length; rowIndex++) {
    const row = board[rowIndex];

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

      if (isWinner) return valueInCell ?? null;
    }
  }
  return null;
};

const checkVerticalWin = (board: CellValue[][]): BoardCondition => {
  for (let columnIndex = 0; columnIndex < board[0]!.length; columnIndex++) {
    for (
      let rowIndex = 0;
      rowIndex <= board.length - winningLength;
      rowIndex++
    ) {
      const valueInCell = board[rowIndex]![columnIndex];
      if (valueInCell === null) continue;
      let isWinner = true;
      for (let i = 1; i < winningLength; i++) {
        if (board![rowIndex + i]![columnIndex] !== valueInCell) {
          isWinner = false;
          break;
        }
      }
      if (isWinner) return valueInCell ?? null;
    }
  }
  return null;
};

const checkDraw = (board: CellValue[][]): BoardCondition => {
  const isFull = board.every((row) => row.every((cell) => cell !== null));
  return isFull ? "draw" : null;
};
