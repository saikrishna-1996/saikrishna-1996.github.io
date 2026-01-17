// Chess Viewer with Keyboard Navigation
(function() {
  'use strict';

  let board = null;
  let game = new Chess();
  let games = [];
  let currentGameIndex = 0;
  let currentMoveIndex = 0;
  let moveHistory = [];
  let pgnText = '';

  // Initialize the viewer
  function init() {
    console.log('Initializing chess viewer...');
    const boardEl = document.getElementById('board');
    if (!boardEl) {
      console.error('Board element not found!');
      return;
    }

    // Check if Chessboard is available
    if (typeof Chessboard === 'undefined') {
      console.error('Chessboard.js not loaded!');
      showError('Chessboard library failed to load. Please check your internet connection.');
      return;
    }

    // Check if Chess is available
    if (typeof Chess === 'undefined') {
      console.error('Chess.js not loaded!');
      showError('Chess.js library failed to load. Please check your internet connection.');
      return;
    }

    const config = {
      draggable: false,
      position: 'start',
      pieceTheme: 'https://cdnjs.cloudflare.com/ajax/libs/chessboard-js/1.0.0/img/chesspieces/wikipedia/{piece}.png',
      onMoveEnd: onMoveEnd
    };

    try {
      board = Chessboard('board', config);
      console.log('Chessboard initialized');
    } catch (e) {
      console.error('Error initializing chessboard:', e);
      showError('Failed to initialize chessboard: ' + e.message);
      return;
    }

    // Load PGN file
    loadPGN();

    // Setup event listeners
    setupEventListeners();
  }

  // Load PGN file
  function loadPGN() {
    // Use path from window variable set by Jekyll, or fallback to relative path
    const pgnPath = window.CHESS_PGN_PATH || './assets/pgn/WinsAgainstGMs.pgn';
    console.log('Loading PGN from:', pgnPath);
    
    fetch(pgnPath)
      .then(response => {
        console.log('PGN fetch response:', response.status, response.statusText);
        if (!response.ok) {
          throw new Error(`PGN file not found (${response.status}). Please ensure WinsAgainstGMs.pgn exists.`);
        }
        return response.text();
      })
      .then(text => {
        console.log('PGN loaded, length:', text.length);
        pgnText = text;
        parsePGN(text);
        console.log('Parsed games:', games.length);
        if (games.length > 0) {
          loadGame(0);
          populateGameSelector();
        } else {
          showError('No games found in PGN file. Please check the file format.');
        }
      })
      .catch(error => {
        console.error('Error loading PGN:', error);
        showError('Could not load PGN file: ' + error.message + '<br>Path attempted: ' + pgnPath);
      });
  }

  // Parse PGN text into individual games
  function parsePGN(text) {
    games = [];
    
    if (!text || text.trim().length === 0) {
      console.warn('PGN text is empty');
      return;
    }
    
    // Try to find games by looking for [Event tags
    const gameRegex = /(\[Event[^\]]+\][\s\S]*?)(?=\[Event|$)/g;
    let match;
    let lastIndex = 0;

    while ((match = gameRegex.exec(text)) !== null) {
      const gameText = match[1].trim();
      if (gameText && gameText.length > 50) { // Minimum length check
        games.push(gameText);
      }
      lastIndex = match.index + match[0].length;
    }

    // If no games found with regex, try treating entire text as one game
    if (games.length === 0 && text.trim().length > 50) {
      console.log('Treating entire PGN as single game');
      games.push(text.trim());
    }

    // If still no games, try splitting by double newlines
    if (games.length === 0) {
      const parts = text.split(/\n\s*\n/);
      parts.forEach(part => {
        const trimmed = part.trim();
        if (trimmed && trimmed.length > 50 && (trimmed.includes('[Event') || trimmed.match(/^\d+\./))) {
          games.push(trimmed);
        }
      });
    }
    
    console.log('Parsed', games.length, 'game(s) from PGN');
  }

  // Load a specific game
  function loadGame(index) {
    if (index < 0 || index >= games.length) return;

    currentGameIndex = index;
    currentMoveIndex = 0;
    game = new Chess();
    moveHistory = [];

    const gameText = games[index];
    const headerMatch = gameText.match(/\[Event\s+"([^"]+)"/);
    const whiteMatch = gameText.match(/\[White\s+"([^"]+)"/);
    const blackMatch = gameText.match(/\[Black\s+"([^"]+)"/);
    const resultMatch = gameText.match(/\[Result\s+"([^"]+)"/);
    const dateMatch = gameText.match(/\[Date\s+"([^"]+)"/);
    const siteMatch = gameText.match(/\[Site\s+"([^"]+)"/);

    // Extract moves (everything after the last ])
    const movesMatch = gameText.match(/\]([\s\S]*)/);
    let movesText = movesMatch ? movesMatch[1] : '';
    
    // Remove clock annotations like { [%clk 1:59:52] } for cleaner display
    movesText = movesText.replace(/\{\s*\[%clk[^\]]+\]\s*\}/g, '');

    // Update header
    const headerEl = document.getElementById('game-header');
    if (headerEl) {
      headerEl.innerHTML = `
        <h3>${headerMatch ? headerMatch[1] : 'Game ' + (index + 1)}</h3>
        <p><strong>White:</strong> ${whiteMatch ? whiteMatch[1] : 'Unknown'} | 
           <strong>Black:</strong> ${blackMatch ? blackMatch[1] : 'Unknown'}</p>
        <p><strong>Date:</strong> ${dateMatch ? dateMatch[1] : 'Unknown'} | 
           <strong>Result:</strong> ${resultMatch ? resultMatch[1] : '*'}</p>
        ${siteMatch ? `<p><strong>Site:</strong> ${siteMatch[1]}</p>` : ''}
      `;
    }

    // Parse and load moves
    try {
      // Try loading with chess.js
      game.load_pgn(movesText);
      moveHistory = game.history({ verbose: true });
      currentMoveIndex = moveHistory.length;
      updateBoard();
      updateMoveList();
    } catch (e) {
      console.error('Error loading game:', e);
      showError('Error parsing game moves.');
    }
  }

  // Update board position
  function updateBoard() {
    if (!board) return;
    board.position(game.fen());
  }

  // Update move list display
  function updateMoveList() {
    const moveListEl = document.getElementById('move-list');
    if (!moveListEl) return;

    let html = '<div class="moves">';
    const history = game.history({ verbose: false });
    
    for (let i = 0; i < history.length; i += 2) {
      const moveNum = Math.floor(i / 2) + 1;
      const whiteMove = history[i];
      const blackMove = history[i + 1];
      
      const whiteClass = i === currentMoveIndex - 1 ? 'current-move' : '';
      const blackClass = i + 1 === currentMoveIndex - 1 ? 'current-move' : '';
      
      html += `<div class="move-pair">
        <span class="move-num">${moveNum}.</span>
        <span class="move white-move ${whiteClass}" data-move-index="${i}">${whiteMove || ''}</span>
        <span class="move black-move ${blackClass}" data-move-index="${i + 1}">${blackMove || ''}</span>
      </div>`;
    }
    
    html += '</div>';
    moveListEl.innerHTML = html;
    
    // Add click handlers to moves
    moveListEl.querySelectorAll('.move').forEach(moveEl => {
      const moveIndex = parseInt(moveEl.getAttribute('data-move-index'));
      if (!isNaN(moveIndex) && moveIndex >= 0) {
        moveEl.style.cursor = 'pointer';
        moveEl.addEventListener('click', () => goToMove(moveIndex + 1));
      }
    });
    
    // Scroll to current move
    const currentMoveEl = moveListEl.querySelector('.current-move');
    if (currentMoveEl) {
      currentMoveEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // Navigate moves
  function goToMove(index) {
    if (index < 0) index = 0;
    if (index > moveHistory.length) index = moveHistory.length;

    currentMoveIndex = index;
    game = new Chess();
    
    for (let i = 0; i < index; i++) {
      const move = moveHistory[i];
      game.move(move);
    }
    
    updateBoard();
    updateMoveList();
  }

  // Setup event listeners
  function setupEventListeners() {
    // Button controls
    document.getElementById('btn-first')?.addEventListener('click', () => goToMove(0));
    document.getElementById('btn-prev')?.addEventListener('click', () => goToMove(currentMoveIndex - 1));
    document.getElementById('btn-next')?.addEventListener('click', () => goToMove(currentMoveIndex + 1));
    document.getElementById('btn-last')?.addEventListener('click', () => goToMove(moveHistory.length));
    document.getElementById('btn-flip')?.addEventListener('click', () => {
      if (board) {
        board.flip();
      }
    });

    // Game selector
    document.getElementById('game-select')?.addEventListener('change', (e) => {
      loadGame(parseInt(e.target.value));
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      switch(e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goToMove(currentMoveIndex - 1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToMove(currentMoveIndex + 1);
          break;
        case 'Home':
          e.preventDefault();
          goToMove(0);
          break;
        case 'End':
          e.preventDefault();
          goToMove(moveHistory.length);
          break;
      }
    });
  }

  // Populate game selector
  function populateGameSelector() {
    const selectEl = document.getElementById('game-select');
    if (!selectEl) return;

    selectEl.innerHTML = '';
    games.forEach((game, index) => {
      const option = document.createElement('option');
      option.value = index;
      const headerMatch = game.match(/\[Event\s+"([^"]+)"/);
      const whiteMatch = game.match(/\[White\s+"([^"]+)"/);
      const blackMatch = game.match(/\[Black\s+"([^"]+)"/);
      option.textContent = `Game ${index + 1}: ${whiteMatch ? whiteMatch[1] : 'White'} vs ${blackMatch ? blackMatch[1] : 'Black'}`;
      selectEl.appendChild(option);
    });
  }

  // Show error message
  function showError(message) {
    const container = document.getElementById('chess-container');
    if (container) {
      container.innerHTML = `<div class="error-message"><p>${message}</p></div>`;
    }
  }

  // Callback for move end
  function onMoveEnd() {
    // Not used since board is not draggable
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
