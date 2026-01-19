// Chess Viewer with Keyboard Navigation
(function() {
  'use strict';

  let board = null;
  let game = null;
  let games = [];
  let currentGameIndex = 0;
  let currentMoveIndex = 0;
  let moveHistory = [];


  // Initialize the viewer
  function init() {
    // Wait for DOM and all scripts to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }
    
    // Wait for all dependencies to be available
    if (typeof jQuery === 'undefined' || typeof Chess === 'undefined' || typeof Chessboard === 'undefined') {
      setTimeout(init, 50);
      return;
    }
    
    const boardEl = document.getElementById('board');
    if (!boardEl) {
      showError('Board element not found in DOM');
      return;
    }

    // Ensure board has dimensions
    var $board = jQuery('#board');
    if ($board.width() === 0 || $board.height() === 0) {
      $board.css({ width: '480px', height: '480px' });
    }
    
    game = new Chess();
    
    const config = {
      draggable: false,
      position: 'start',
      pieceTheme: 'https://cdnjs.cloudflare.com/ajax/libs/chessboard-js/1.0.0/img/chesspieces/wikipedia/{piece}.png'
    };

    try {
      // Initialize chessboard
      board = Chessboard('board', config);
      
      if (!board) {
        throw new Error('Chessboard initialization returned null/undefined');
      }
      
      // Load PGN and setup
      loadPGN();
      setupEventListeners();
    } catch (e) {
      showError('Failed to initialize chessboard: ' + e.message);
    }
  }

  // Load PGN file
  function loadPGN() {
    // Get path from window variable or use relative path
    let pgnPath = window.CHESS_PGN_PATH;
    
    // If not set or empty, construct path relative to site root
    if (!pgnPath || pgnPath.trim() === '' || pgnPath === 'undefined') {
      // Try absolute path from root (works for GitHub Pages)
      pgnPath = '/assets/pgn/WinsAgainstGMs.pgn';
    }
    
    console.log('Loading PGN from:', pgnPath);
    
    fetch(pgnPath)
      .then(response => {
        console.log('Response status:', response.status, 'for path:', pgnPath);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.text();
      })
      .then(text => {
        console.log('PGN loaded, length:', text.length);
        if (!text || text.trim().length === 0) {
          throw new Error('PGN file is empty');
        }
        parsePGN(text);
        console.log('Parsed games:', games.length);
        if (games.length > 0) {
          loadGame(0);
          populateGameSelector();
        } else {
          showError('No games found in PGN file. Check console for details.');
        }
      })
      .catch(error => {
        console.error('Error loading PGN:', error);
        console.error('Path attempted:', pgnPath);
        console.error('Current location:', window.location.href);
        showError('Could not load PGN file: ' + error.message + '<br>Path attempted: ' + pgnPath + '<br>Check browser console (F12) for details.');
      });
  }

  // Parse PGN text into individual games
  function parsePGN(text) {
    games = [];
    
    // Split by [Event to find game boundaries
    // Each game starts with [Event "..."]
    const gameBlocks = text.split(/(?=\[Event)/);
    
    console.log('Split into', gameBlocks.length, 'potential game blocks');
    
    gameBlocks.forEach((block, idx) => {
      const trimmed = block.trim();
      // Skip empty blocks
      if (!trimmed || trimmed.length < 50) {
        return;
      }
      
      // A valid game should have [Event tag
      if (trimmed.includes('[Event')) {
        games.push(trimmed);
        console.log('Found game', games.length, ':', trimmed.substring(0, 150));
      } else {
        console.log('Skipping block', idx, ':', trimmed.substring(0, 100));
      }
    });
    
    console.log('Total games parsed:', games.length);
  }

  // Load a specific game
  function loadGame(index) {
    if (index < 0 || index >= games.length) {
      console.error('Invalid game index:', index);
      return;
    }

    currentGameIndex = index;
    currentMoveIndex = 0;
    game = new Chess();
    moveHistory = [];

    const gameText = games[index];
    console.log('Game text length:', gameText.length);
    console.log('Game text (first 500 chars):', gameText.substring(0, 500));
    console.log('Game text (last 500 chars):', gameText.substring(Math.max(0, gameText.length - 500)));
    const headerMatch = gameText.match(/\[Event\s+"([^"]+)"/);
    const whiteMatch = gameText.match(/\[White\s+"([^"]+)"/);
    const blackMatch = gameText.match(/\[Black\s+"([^"]+)"/);
    const resultMatch = gameText.match(/\[Result\s+"([^"]+)"/);
    const dateMatch = gameText.match(/\[Date\s+"([^"]+)"/);
    const siteMatch = gameText.match(/\[Site\s+"([^"]+)"/);

    // Extract moves - find everything after the last header tag
    // Headers are like [Event "..."], [Site "..."], etc. on separate lines
    const lines = gameText.split('\n');
    let lastHeaderLineIndex = -1;
    
    // Find the last line that starts with [ and ends with ]
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      // Match any header line: starts with [ and ends with ]
      if (line.startsWith('[') && line.endsWith(']')) {
        lastHeaderLineIndex = i;
        break;
      }
    }
    
    let movesText = '';
    if (lastHeaderLineIndex >= 0) {
      // Get everything after the last header line
      const remainingLines = lines.slice(lastHeaderLineIndex + 1);
      console.log('Lines after header:', remainingLines.length);
      console.log('First few lines after header:', remainingLines.slice(0, 5));
      movesText = remainingLines.join('\n');
    } else {
      // Fallback: find last ] character
      const lastBracket = gameText.lastIndexOf(']');
      if (lastBracket >= 0) {
        movesText = gameText.substring(lastBracket + 1);
      }
    }
    
    // Debug: log raw text before cleaning
    console.log('Raw text after headers (first 500 chars):', movesText.substring(0, 500));
    console.log('Raw text length before cleaning:', movesText.length);
    
    // Remove all annotations and clean up
    // Remove multi-line comments in braces - use [\s\S] to match newlines
    movesText = movesText.replace(/\{[\s\S]*?\}/g, ''); // Comments in braces (including multi-line, non-greedy)
    movesText = movesText.replace(/\{\s*\[%[^\]]+\]\s*\}/g, ''); // [%clk], [%eval], etc.
    movesText = movesText.replace(/\$\d+/g, ''); // Move quality markers
    movesText = movesText.replace(/\[%[^\]]+\]/g, ''); // Any remaining annotations
    movesText = movesText.replace(/^\s*[\r\n]+/gm, ''); // Remove leading blank lines
    movesText = movesText.trim();
    
    // Debug: log what we extracted
    console.log('Last header line index:', lastHeaderLineIndex);
    console.log('Extracted moves text length:', movesText.length);
    console.log('Moves text preview:', movesText.substring(0, 300));

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
      if (!movesText) {
        throw new Error('No moves found in game');
      }
      
      const loadResult = game.load_pgn(movesText);
      if (!loadResult) {
        throw new Error('Failed to parse PGN moves');
      }
      
      moveHistory = game.history({ verbose: true });
      currentMoveIndex = moveHistory.length;
      updateBoard();
      updateMoveList();
      console.log('Game loaded successfully, moves:', moveHistory.length);
    } catch (e) {
      console.error('Error loading game:', e);
      console.error('Moves text sample:', movesText.substring(0, 300));
      showError('Error parsing game moves: ' + e.message);
    }
  }

  // Update board position
  function updateBoard() {
    if (!board || !game) return;
    try {
      board.position(game.fen());
    } catch (e) {
      console.error('Error updating board:', e);
    }
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
    
    // Add click handlers
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
    document.getElementById('btn-first')?.addEventListener('click', () => goToMove(0));
    document.getElementById('btn-prev')?.addEventListener('click', () => goToMove(currentMoveIndex - 1));
    document.getElementById('btn-next')?.addEventListener('click', () => goToMove(currentMoveIndex + 1));
    document.getElementById('btn-last')?.addEventListener('click', () => goToMove(moveHistory.length));
    document.getElementById('btn-flip')?.addEventListener('click', () => {
      if (board) board.flip();
    });

    document.getElementById('game-select')?.addEventListener('change', (e) => {
      loadGame(parseInt(e.target.value));
    });

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
    games.forEach((gameText, index) => {
      const option = document.createElement('option');
      option.value = index;
      const headerMatch = gameText.match(/\[Event\s+"([^"]+)"/);
      const whiteMatch = gameText.match(/\[White\s+"([^"]+)"/);
      const blackMatch = gameText.match(/\[Black\s+"([^"]+)"/);
      const name = headerMatch ? headerMatch[1] : `Game ${index + 1}`;
      option.textContent = `${index + 1}. ${name}`;
      selectEl.appendChild(option);
    });
    console.log('Game selector populated with', games.length, 'games');
  }

  // Show error message
  function showError(message) {
    const container = document.getElementById('chess-container');
    if (container) {
      container.innerHTML = `<div class="error-message"><p>${message}</p></div>`;
    }
    console.error('Chess viewer error:', message);
  }

  // Start initialization
  init();
})();
