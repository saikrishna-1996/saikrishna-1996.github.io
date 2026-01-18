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

<script>
  // Load chess libraries after jQuery is available (jQuery loads in hemline.html)
  (function() {
    var maxWaitTime = 10000; // 10 seconds max wait
    var startTime = Date.now();
    
    function loadChessScripts() {
      // Check if jQuery is available (it loads in hemline.html at bottom of page)
      if (typeof jQuery === 'undefined') {
        if (Date.now() - startTime < maxWaitTime) {
          setTimeout(loadChessScripts, 100);
          return;
        } else {
          console.error('jQuery not loaded after 10 seconds');
          // Load jQuery ourselves as fallback
          var jq = document.createElement('script');
          jq.src = '//code.jquery.com/jquery-{{ site.jquery_version }}.min.js';
          jq.onload = loadChessScripts;
          document.head.appendChild(jq);
          return;
        }
      }
      
      console.log('jQuery loaded, loading chess libraries...');
      
      // Load chess.js if not already loaded
      if (typeof Chess === 'undefined') {
        var chessJs = document.createElement('script');
        chessJs.src = 'https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.13.4/chess.min.js';
        chessJs.onload = function() {
          console.log('chess.js loaded');
          loadChessboard();
        };
        chessJs.onerror = function() {
          console.error('Failed to load chess.js');
        };
        document.head.appendChild(chessJs);
      } else {
        loadChessboard();
      }
    }
    
    function loadChessboard() {
      // Ensure jQuery is still available before loading chessboard
      if (typeof jQuery === 'undefined') {
        console.error('jQuery not available for chessboard');
        setTimeout(loadChessboard, 100);
        return;
      }
      
      // Load chessboard.js after chess.js (requires jQuery)
      if (typeof Chessboard === 'undefined') {
        var chessboardJs = document.createElement('script');
        chessboardJs.src = 'https://cdnjs.cloudflare.com/ajax/libs/chessboard-js/1.0.0/chessboard-1.0.0.min.js';
        chessboardJs.onload = function() {
          console.log('chessboard.js loaded');
          loadViewer();
        };
        chessboardJs.onerror = function() {
          console.error('Failed to load chessboard.js');
        };
        document.head.appendChild(chessboardJs);
      } else {
        loadViewer();
      }
    }
    
    function loadViewer() {
      // Load chess-viewer.js after chessboard.js
      var viewerJs = document.createElement('script');
      viewerJs.src = '{{ "/assets/js/chess-viewer.js" | relative_url }}';
      viewerJs.onerror = function() {
        console.error('Failed to load chess-viewer.js');
      };
      document.head.appendChild(viewerJs);
    }
    
    // Wait for page to be fully loaded, including hemline.html scripts
    if (document.readyState === 'complete') {
      loadChessScripts();
    } else {
      window.addEventListener('load', loadChessScripts);
    }
  })();
</script>
