---
layout: page
permalink: /chess/
title: Best Chess Games
description: A collection of my best games against Grandmasters and International Masters
---

<div id="chess-container">
  <div id="game-selector">
    <label for="game-select">Select Game:</label>
    <select id="game-select"></select>
  </div>
  
  <div id="chess-info">
    <div id="game-header"></div>
    <div id="move-list-container">
      <div id="move-list"></div>
    </div>
  </div>
  
  <div id="chessboard-container">
    <div id="board"></div>
    <div id="controls">
      <button id="btn-first">⏮ First</button>
      <button id="btn-prev">⏪ Prev</button>
      <button id="btn-next">Next ⏩</button>
      <button id="btn-last">Last ⏭</button>
      <button id="btn-flip">Flip Board</button>
    </div>
    <div id="keyboard-hint">
      <small>Use ← → arrow keys to navigate moves</small>
    </div>
  </div>
</div>

<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/chessboard-js/1.0.0/chessboard-1.0.0.min.css">

<script>
  // Set base URL for PGN file - use relative_url for proper path resolution
  window.CHESS_PGN_PATH = '{{ "/assets/pgn/WinsAgainstGMs.pgn" | relative_url }}';
</script>

<!-- Load jQuery first (required by chessboard-js) -->
<script src="//code.jquery.com/jquery-{{ site.jquery_version }}.min.js"></script>

<script>
  // Load chess libraries in proper order after jQuery
  (function() {
    function loadChessJs(callback) {
      if (typeof Chess !== 'undefined') {
        callback();
        return;
      }
      
      var chessJs = document.createElement('script');
      chessJs.src = 'https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.13.4/chess.min.js';
      chessJs.onload = callback;
      chessJs.onerror = function() {
        console.error('Failed to load chess.js');
      };
      document.head.appendChild(chessJs);
    }
    
    function loadChessboardJs(callback) {
      if (typeof Chessboard !== 'undefined') {
        callback();
        return;
      }
      
      // Ensure jQuery is available
      if (typeof jQuery === 'undefined') {
        console.error('jQuery not available for chessboard');
        setTimeout(function() {
          loadChessboardJs(callback);
        }, 100);
        return;
      }
      
      var chessboardJs = document.createElement('script');
      chessboardJs.src = 'https://cdnjs.cloudflare.com/ajax/libs/chessboard-js/1.0.0/chessboard-1.0.0.min.js';
      chessboardJs.onload = callback;
      chessboardJs.onerror = function() {
        console.error('Failed to load chessboard.js');
      };
      document.head.appendChild(chessboardJs);
    }
    
    function loadViewer() {
      var viewerJs = document.createElement('script');
      viewerJs.src = '{{ "/assets/js/chess-viewer.js" | relative_url }}';
      viewerJs.onerror = function() {
        console.error('Failed to load chess-viewer.js');
      };
      document.head.appendChild(viewerJs);
    }
    
    // Wait for jQuery to be available, then load chess libraries
    function waitForJQuery() {
      if (typeof jQuery !== 'undefined') {
        console.log('jQuery ready, loading chess libraries...');
        loadChessJs(function() {
          console.log('chess.js loaded');
          loadChessboardJs(function() {
            console.log('chessboard.js loaded');
            loadViewer();
          });
        });
      } else {
        setTimeout(waitForJQuery, 50);
      }
    }
    
    // Start loading when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', waitForJQuery);
    } else {
      waitForJQuery();
    }
  })();
</script>
