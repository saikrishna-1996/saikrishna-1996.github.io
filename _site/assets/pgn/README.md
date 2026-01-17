# Chess Games PGN Files

This directory contains PGN (Portable Game Notation) files for the chess games viewer.

## Converting CBH to PGN

The `WinsAgainstGMs.cbh` file needs to be converted to PGN format. Here are the recommended methods:

### Method 1: Export from ChessBase (Recommended)

1. Open ChessBase
2. Open your database: `assets/WinsAgainstGMs.cbh`
3. Select all games (Ctrl+A / Cmd+A)
4. Go to **File > Export > PGN**
5. Save as: `assets/pgn/WinsAgainstGMs.pgn`
6. Make sure to include all game headers (Event, White, Black, Date, Result, etc.)

### Method 2: Using pgn-extract (if available)

If you have `pgn-extract` installed:
```bash
# This won't work directly with CBH, but if you have other formats
pgn-extract -o assets/pgn/WinsAgainstGMs.pgn input.pgn
```

### Method 3: Online Converters

Some online chess tools can convert CBH to PGN:
- ChessBase Online
- Various chess database converters

## File Format

The PGN file should contain one or more games in standard PGN format:

```
[Event "Tournament Name"]
[Site "Location"]
[Date "2024.01.13"]
[Round "1"]
[White "Player Name"]
[Black "Opponent Name"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 ...

[Event "Next Game"]
...
```

Each game should be separated by a blank line.
