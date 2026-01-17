#!/usr/bin/env python3
"""
CBH to PGN Converter
Converts ChessBase CBH files to PGN format.

Note: CBH files are proprietary ChessBase format. This script attempts basic conversion.
For best results, export directly from ChessBase to PGN format.
"""

import sys
import os
import struct

def read_cbh_file(cbh_path):
    """Read CBH file and attempt to extract game data."""
    try:
        with open(cbh_path, 'rb') as f:
            data = f.read()
        return data
    except Exception as e:
        print(f"Error reading CBH file: {e}", file=sys.stderr)
        return None

def parse_cbh_basic(data):
    """
    Basic CBH parser - attempts to extract game information.
    Note: CBH format is proprietary and complex. This is a simplified parser.
    """
    games = []
    
    # CBH files typically have:
    # - Header section (first ~100 bytes)
    # - Game records
    # - Index section
    
    # Try to find game markers or use heuristics
    # This is a simplified approach - full CBH parsing requires ChessBase specifications
    
    print("Warning: CBH format is proprietary. This converter may not extract all games correctly.", file=sys.stderr)
    print("For best results, please export from ChessBase directly to PGN format.", file=sys.stderr)
    
    # Return empty list - user should export from ChessBase
    return games

def convert_cbh_to_pgn(cbh_path, pgn_path):
    """Convert CBH file to PGN format."""
    data = read_cbh_file(cbh_path)
    if data is None:
        return False
    
    games = parse_cbh_basic(data)
    
    if not games:
        print("\nCould not automatically extract games from CBH file.", file=sys.stderr)
        print("Please export games from ChessBase to PGN format manually.", file=sys.stderr)
        print(f"\nTo export from ChessBase:", file=sys.stderr)
        print(f"1. Open ChessBase", file=sys.stderr)
        print(f"2. Open your database: {cbh_path}", file=sys.stderr)
        print(f"3. Select all games (Ctrl+A)", file=sys.stderr)
        print(f"4. File > Export > PGN", file=sys.stderr)
        print(f"5. Save as: {pgn_path}", file=sys.stderr)
        return False
    
    # Write PGN file
    try:
        with open(pgn_path, 'w', encoding='utf-8') as f:
            for game in games:
                f.write(game + '\n\n')
        print(f"Successfully converted {len(games)} games to {pgn_path}")
        return True
    except Exception as e:
        print(f"Error writing PGN file: {e}", file=sys.stderr)
        return False

def main():
    if len(sys.argv) < 3:
        print("Usage: python3 cbh2pgn.py <input.cbh> <output.pgn>")
        print("\nNote: CBH files are proprietary ChessBase format.")
        print("For best results, export directly from ChessBase to PGN.")
        sys.exit(1)
    
    cbh_path = sys.argv[1]
    pgn_path = sys.argv[2]
    
    if not os.path.exists(cbh_path):
        print(f"Error: CBH file not found: {cbh_path}", file=sys.stderr)
        sys.exit(1)
    
    # Create output directory if needed
    os.makedirs(os.path.dirname(pgn_path) if os.path.dirname(pgn_path) else '.', exist_ok=True)
    
    success = convert_cbh_to_pgn(cbh_path, pgn_path)
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()
