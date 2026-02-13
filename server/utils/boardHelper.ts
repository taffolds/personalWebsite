type CellValue = null | number;

export function createEmptyBoard(): CellValue[][] {
  return Array(6)
    .fill(null)
    .map(() => Array(7).fill(null));
}

export function getDropRow(
  board: CellValue[][],
  columnIndex: number,
): number | null {
  for (let i = board.length - 1; i >= 0; i--) {
    if (!board[i]![columnIndex]) {
      return i;
    }
  }
  return null;
}

export function isColumnFull(board: CellValue[][], column: number): boolean {
  return getDropRow(board, column) === null;
}

export function applyMove(
  board: CellValue[][],
  column: number,
  playerId: number,
): CellValue[][] | null {
  const row = getDropRow(board, column);
  if (row === null) return null;

  const updated = [...board];
  updated[row] = [...updated[row]!];
  updated[row]![column] = playerId;

  return updated;
}

export function reconstructBoard(
  moves: { moveNumber: number; column: number }[],
  playerOneId: number,
  playerTwoId: number,
  firstMove: number,
): CellValue[][] {
  let board = createEmptyBoard();

  moves.forEach((move, index) => {
    const isFirstMoverTurn = index % 2 === 0;
    let playerId;
    if (firstMove === playerOneId) {
      if (isFirstMoverTurn) {
        playerId = playerOneId;
      } else {
        playerId = playerTwoId;
      }
    } else {
      if (isFirstMoverTurn) {
        playerId = playerTwoId;
      } else {
        playerId = playerOneId;
      }
    }
    board = applyMove(board, move.column, playerId) || board;
  });

  return board;
}
