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
    
    // Wait for libraries to load
    if (typeof Chess === 'undefined' || typeof Chessboard === 'undefined') {
      console.log('Waiting for libraries to load...');
      setTimeout(init, 100);
      return;
    }

    const boardEl = document.getElementById('board');
    if (!boardEl) {
      console.error('Board element not found!');
      showError('Chess board container not found.');
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
      console.log('Chessboard initialized successfully');
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
    
    // Split by double newlines (standard PGN separator)
    const parts = text.split(/\n\s*\n/);
    
    parts.forEach(part => {
      const trimmed = part.trim();
      // A valid game should have [Event tag and moves (starting with 1.)
      if (trimmed && trimmed.length > 50 && trimmed.includes('[Event') && trimmed.match(/\n\s*1\./)) {
        games.push(trimmed);
      }
    });
    
    // If that didn't work, try regex matching [Event blocks
    if (games.length === 0) {
      const gameRegex = /(\[Event[^\]]*\]\s*\n[\s\S]*?)(?=\n\s*\[Event|$)/g;
      let match;
      while ((match = gameRegex.exec(text)) !== null) {
        const gameText = match[1].trim();
        if (gameText && gameText.length > 50) {
          games.push(gameText);
        }
      }
    }
    
    console.log('Parsed', games.length, 'game(s) from PGN');
    if (games.length === 0) {
      console.error('No games found! PGN text preview:', text.substring(0, 500));
    }
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
    
    // Remove all annotations: clock annotations, evaluation annotations, comments, etc.
    movesText = movesText.replace(/\{\s*\[%[^\]]+\]\s*\}/g, ''); // Remove [%clk], [%eval], [%evp], etc.
    movesText = movesText.replace(/\{[^}]*\}/g, ''); // Remove all comments in braces
    movesText = movesText.replace(/\$\d+/g, ''); // Remove move quality annotations like $1, $5, etc.
    movesText = movesText.replace(/\[%[^\]]+\]/g, ''); // Remove any remaining annotations

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
      // Clean up the moves text more thoroughly
      movesText = movesText.trim();
      
      // Try loading with chess.js
      const loadResult = game.load_pgn(movesText);
      if (!loadResult) {
        throw new Error('Failed to load PGN - invalid format');
      }
      
      moveHistory = game.history({ verbose: true });
      currentMoveIndex = moveHistory.length;
      updateBoard();
      updateMoveList();
    } catch (e) {
      console.error('Error loading game:', e);
      console.error('Moves text:', movesText.substring(0, 200));
      showError('Error parsing game moves: ' + e.message);
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

  // Initialize when DOM and libraries are ready
  function startInit() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        setTimeout(init, 100);
      });
    } else {
      setTimeout(init, 100);
    }
  }
  
  startInit();
})();
