# Extracted piece assets

The `pixel-extracted-piece-assets` branch includes six extracted, transparent 64px white-piece PNGs:
- `white_pawn.png`
- `white_king.png`
- `white_bishop.png`
- `white_knight.png`
- `white_rook.png`
- `white_queen.png`

The image loader uses these for white pieces. Black-piece PNGs are not yet included; black pieces currently fall back to the previous SVG artwork with the existing dark styling. The fallback also protects against missing image files.

These assets are a pixel-extraction pass and remain subject to visual QA at board scale before integration into the main dashboard.