import React, { useState, useEffect } from 'react';
import './App.css';

// Theme color palette (JavaScript fallback for some in-component styles)
const COLORS = {
  primary: '#1976d2',
  secondary: '#424242',
  accent: '#ffb300',
};

// Square component represents a cell in the tic tac toe grid
function Square({ value, onClick, highlight }) {
  return (
    <button
      className={`ttt-square${highlight ? ' highlight' : ''}`}
      onClick={onClick}
      aria-label={`Tic tac toe cell: ${value ? value : 'empty'}`}
      tabIndex={0}
    >
      {value}
    </button>
  );
}

// PUBLIC_INTERFACE
function GameBoard({ board, onCellClick, winningLine, disabled }) {
  return (
    <div className="ttt-board">
      {board.map((row, i) =>
        row.map((cell, j) => {
          const isHighlight =
            winningLine &&
            winningLine.some(([x, y]) => x === i && y === j);
          return (
            <Square
              key={`${i}-${j}`}
              value={cell}
              onClick={() => onCellClick(i, j)}
              highlight={isHighlight}
              disabled={disabled || !!cell}
            />
          );
        })
      )}
    </div>
  );
}

// AI logic (random move, could be improved with minimax if desired)
function getBestMove(board) {
  // Find possible moves
  const moves = [];
  for (let i = 0; i < 3; ++i)
    for (let j = 0; j < 3; ++j)
      if (!board[i][j]) moves.push([i, j]);

  if (moves.length === 0) return null;
  return moves[Math.floor(Math.random() * moves.length)];
}

// Returns winner symbol, array of winning positions, or null
function checkWinner(board) {
  const lines = [
    // rows
    [[0,0],[0,1],[0,2]],
    [[1,0],[1,1],[1,2]],
    [[2,0],[2,1],[2,2]],
    // columns
    [[0,0],[1,0],[2,0]],
    [[0,1],[1,1],[2,1]],
    [[0,2],[1,2],[2,2]],
    // diagonals
    [[0,0],[1,1],[2,2]],
    [[0,2],[1,1],[2,0]],
  ];
  for (const line of lines) {
    const [a, b, c] = line;
    if (
      board[a[0]][a[1]] &&
      board[a[0]][a[1]] === board[b[0]][b[1]] &&
      board[a[0]][a[1]] === board[c[0]][c[1]]
    ) {
      return { winner: board[a[0]][a[1]], line };
    }
  }
  // Draw check: all cells filled, no winner
  const anyEmpty = board.some(row => row.some(cell => !cell));
  if (!anyEmpty) return { winner: 'draw', line: null };
  return null;
}

const initialBoard = () => [
  [null, null, null],
  [null, null, null],
  [null, null, null],
];

// PUBLIC_INTERFACE
function App() {
  // Theme support
  const [theme, setTheme] = useState('light');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Game state
  const [mode, setMode] = useState('single'); // 'single' or 'multi'
  const [board, setBoard] = useState(initialBoard());
  const [turn, setTurn] = useState('X'); // 'X' always starts
  const [winnerInfo, setWinnerInfo] = useState(null);
  const [scores, setScores] = useState({
    X: 0,
    O: 0,
    draw: 0,
  });

  // Switch theme button
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  // Handle cell click
  function handleCellClick(i, j) {
    if (winnerInfo || board[i][j]) return;
    const newBoard = board.map(row => row.slice());
    newBoard[i][j] = turn;
    const result = checkWinner(newBoard);

    setBoard(newBoard);
    if (result?.winner) {
      setWinnerInfo(result);
      setScores(prev => ({
        ...prev,
        [result.winner]: (prev[result.winner] ?? 0) + 1
      }));
    } else {
      setTurn(turn === 'X' ? 'O' : 'X');
    }
  }

  // Reset to initial state (retain theme and mode!)
  function handleNewGame() {
    setBoard(initialBoard());
    setTurn('X');
    setWinnerInfo(null);
  }

  // Mode switch (resets game and scores)
  function handleModeSwitch(modeValue) {
    setMode(modeValue);
    setScores({
      X: 0, O: 0, draw: 0
    });
    setBoard(initialBoard());
    setTurn('X');
    setWinnerInfo(null);
  }

  // AI move effect
  useEffect(() => {
    if (mode === 'single' && turn === 'O' && !winnerInfo) {
      // Delay for human feeling
      const timeout = setTimeout(() => {
        const [i, j] = getBestMove(board) || [];
        if (i !== undefined && j !== undefined) {
          handleCellClick(i, j);
        }
      }, 450);
      return () => clearTimeout(timeout);
    }
  // eslint-disable-next-line
  }, [board, mode, turn, winnerInfo]);

  let status;
  if (winnerInfo?.winner === 'draw') {
    status = "It's a draw!";
  } else if (winnerInfo?.winner) {
    status = `Winner: ${winnerInfo.winner}`;
  } else {
    status =
      mode === 'single' && turn === 'O'
        ? "AI's turn (O)"
        : `Your turn: ${turn}`;
  }

  return (
    <div className="App">
      <header className="App-header">
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
        <h1 className="ttt-title">Tic Tac Toe</h1>
        <div className="ttt-controls">
          <button
            className={`ttt-mode-btn${mode === 'single' ? ' active' : ''}`}
            onClick={() => handleModeSwitch('single')}
            aria-label="Single player mode"
          >Single Player</button>
          <button
            className={`ttt-mode-btn${mode === 'multi' ? ' active' : ''}`}
            onClick={() => handleModeSwitch('multi')}
            aria-label="Multiplayer mode"
          >Multiplayer</button>
          <button
            className="ttt-reset-btn"
            onClick={handleNewGame}
            aria-label="Start new game"
          >New Game</button>
        </div>
        <div className="ttt-status">{status}</div>
        <GameBoard
          board={board}
          onCellClick={(i, j) =>
            !(mode === 'single' && turn === 'O' && !winnerInfo)
              ? handleCellClick(i, j)
              : undefined
          }
          winningLine={winnerInfo?.line}
          disabled={!!winnerInfo}
        />
        <div className="ttt-scores" aria-label="Score">
          <div>
            <span>X</span>
            <span className="ttt-score-value">{scores.X}</span>
          </div>
          <div>
            <span>O</span>
            <span className="ttt-score-value">{scores.O}</span>
          </div>
          <div>
            <span>Draw</span>
            <span className="ttt-score-value">{scores.draw}</span>
          </div>
        </div>
        <footer>
          <span className="ttt-footer">
            Modern, minimal web app &mdash; Powered by React
          </span>
        </footer>
      </header>
    </div>
  );
}

export default App;
