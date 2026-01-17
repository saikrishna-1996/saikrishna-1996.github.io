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
<script src="https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.13.4/chess.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/chessboard-js/1.0.0/chessboard-1.0.0.min.js"></script>
<script>
  // Set base URL for PGN file
  window.CHESS_PGN_PATH = "{{ '/assets/pgn/WinsAgainstGMs.pgn' | prepend: site.baseurl | prepend: site.url }}";
</script>
<script src="{{ '/assets/js/chess-viewer.js' | prepend: site.baseurl | prepend: site.url }}"></script>
