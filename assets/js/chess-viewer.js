// Chess Viewer with Keyboard Navigation
(function() {
  'use strict';

  let board = null;
  let game = null;
  let games = [];
  let currentGameIndex = 0;
  let currentMoveIndex = 0;
  let moveHistory = [];

  // Wait for all dependencies
  function waitForDependencies(callback, maxAttempts = 100) {
    if (typeof Chess !== 'undefined' && typeof Chessboard !== 'undefined' && typeof jQuery !== 'undefined') {
      callback();
    } else if (maxAttempts > 0) {
      setTimeout(() => waitForDependencies(callback, maxAttempts - 1), 100);
    } else {
      console.error('Dependencies check failed:', {
        Chess: typeof Chess,
        Chessboard: typeof Chessboard,
        jQuery: typeof jQuery
      });
      showError('Failed to load chess libraries. Please refresh the page.');
    }
  }

  // Initialize the viewer
  function init() {
    console.log('Initializing chess viewer...');
    console.log('Dependencies check:', {
      Chess: typeof Chess,
      Chessboard: typeof Chessboard,
      jQuery: typeof jQuery
    });
    
    const boardEl = document.getElementById('board');
    if (!boardEl) {
      console.error('Board element not found!');
      showError('Board element not found in DOM');
      return;
    }
    
    console.log('Board element found:', boardEl);

    waitForDependencies(() => {
      console.log('All dependencies loaded, initializing...');
      
      // Double-check everything is available
      if (typeof Chess === 'undefined') {
        showError('Chess library not loaded');
        return;
      }
      if (typeof Chessboard === 'undefined') {
        showError('Chessboard library not loaded');
        return;
      }
      
      // Verify Chessboard is a function
      if (typeof Chessboard !== 'function') {
        console.error('Chessboard is not a function, type:', typeof Chessboard);
        showError('Chessboard is not a function. Type: ' + typeof Chessboard);
        return;
      }
      
      console.log('Chessboard is a function, ready to initialize');
      if (typeof jQuery === 'undefined') {
        showError('jQuery not loaded');
        return;
      }
      
      game = new Chess();
      
      const config = {
        draggable: false,
        position: 'start',
        pieceTheme: 'https://cdnjs.cloudflare.com/ajax/libs/chessboard-js/1.0.0/img/chesspieces/wikipedia/{piece}.png'
      };

      try {
        console.log('Calling Chessboard with config:', config);
        
        // Ensure board element exists and has dimensions
        var boardElement = jQuery('#board');
        if (boardElement.length === 0) {
          throw new Error('Board element not found with jQuery selector');
        }
        
        // Check if element has dimensions (required for chessboard-js)
        var width = boardElement.width();
        var height = boardElement.height();
        console.log('Board element dimensions:', width, 'x', height);
        
        if (width === 0 || height === 0) {
          console.warn('Board element has no dimensions, setting default');
          boardElement.css({
            width: '480px',
            height: '480px'
          });
        }
        
        // Initialize chessboard - try multiple methods
        try {
          // Method 1: Direct call (standard way)
          board = Chessboard('board', config);
        } catch (e1) {
          console.warn('Method 1 failed, trying jQuery method:', e1);
          try {
            // Method 2: Using jQuery
            board = jQuery('#board').chessboard(config);
          } catch (e2) {
            console.warn('Method 2 failed, trying window.Chessboard:', e2);
            // Method 3: Using window object
            if (window.Chessboard) {
              board = window.Chessboard('board', config);
            } else {
              throw new Error('All initialization methods failed');
            }
          }
        }
        
        if (!board) {
          throw new Error('Chessboard returned null/undefined');
        }
        
        console.log('Chessboard initialized successfully, board object:', board);
        
        // Verify board is actually rendered after a short delay
        setTimeout(() => {
          var boardSquares = jQuery('#board .square-55d63');
          console.log('Board squares found:', boardSquares.length);
          if (boardSquares.length === 0) {
            console.warn('No board squares found - attempting to re-render');
            // Try to set position again to force render
            if (board && board.position) {
              board.position('start');
            }
          } else {
            console.log('Board rendered successfully with', boardSquares.length, 'squares');
          }
        }, 200);
        
        // Load PGN file
        loadPGN();
        
        // Setup event listeners
        setupEventListeners();
      } catch (e) {
        console.error('Error initializing chessboard:', e);
        console.error('Stack:', e.stack);
        showError('Failed to initialize chessboard: ' + e.message + '<br>Check browser console for details.');
      }
    });
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
    
    // Split by double newlines - this is the standard PGN separator
    const parts = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    console.log('Split into', parts.length, 'parts');
    
    parts.forEach((part, idx) => {
      const trimmed = part.trim();
      // A valid game should have [Event tag and moves
      if (trimmed.includes('[Event') && (trimmed.includes('1.') || trimmed.match(/\d+\.\s+\w/))) {
        games.push(trimmed);
        console.log('Found game', games.length, ':', trimmed.substring(0, 100));
      } else {
        console.log('Skipping part', idx, ':', trimmed.substring(0, 100));
      }
    });
    
    // If still no games, try a more lenient approach
    if (games.length === 0) {
      console.log('Trying alternative parsing...');
      // Look for [Event blocks followed by moves
      const gameBlocks = text.split(/(?=\[Event)/);
      gameBlocks.forEach(block => {
        const trimmed = block.trim();
        if (trimmed.length > 100 && trimmed.includes('[Event')) {
          games.push(trimmed);
        }
      });
    }
    
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
    const headerMatch = gameText.match(/\[Event\s+"([^"]+)"/);
    const whiteMatch = gameText.match(/\[White\s+"([^"]+)"/);
    const blackMatch = gameText.match(/\[Black\s+"([^"]+)"/);
    const resultMatch = gameText.match(/\[Result\s+"([^"]+)"/);
    const dateMatch = gameText.match(/\[Date\s+"([^"]+)"/);
    const siteMatch = gameText.match(/\[Site\s+"([^"]+)"/);

    // Extract moves (everything after the last ])
    const movesMatch = gameText.match(/\]([\s\S]*)/);
    let movesText = movesMatch ? movesMatch[1] : '';
    
    // Remove all annotations
    movesText = movesText.replace(/\{\s*\[%[^\]]+\]\s*\}/g, ''); // [%clk], [%eval], etc.
    movesText = movesText.replace(/\{[^}]*\}/g, ''); // Comments in braces
    movesText = movesText.replace(/\$\d+/g, ''); // Move quality markers
    movesText = movesText.replace(/\[%[^\]]+\]/g, ''); // Any remaining annotations
    movesText = movesText.trim();

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
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
