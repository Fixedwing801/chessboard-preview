# Extracted piece assets

This branch prepares the chessboard component to load image pieces from `assets/pieces/`.

Expected files:
- white_pawn.png
- white_king.png
- white_bishop.png
- white_knight.png
- white_rook.png
- white_queen.png
- black_pawn.png
- black_king.png
- black_bishop.png
- black_knight.png
- black_rook.png
- black_queen.png

The loader currently falls back to the previous SVG if a file is absent. The local extraction package contains the six verified white-piece PNGs at 64px and 96px; binary transfer/deployment is still pending. Black pieces currently use the same source artwork with CSS darkening, pending separate asset work.
