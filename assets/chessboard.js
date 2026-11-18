/* Reusable Chess Improvement Lab board.
 * Requires a chess.js-compatible game object supplied by the host page.
 */
(() => {
  "use strict";
  const FILES = "abcdefgh";
  const PIECES = { k:"king", q:"queen", r:"rook", b:"bishop", n:"knight", p:"pawn" };
  // Traditional Staunton silhouettes: broad bases, recognisable crowns,
  // horse-head knights and mitred bishops. Kept as local SVG for reliability.
  const PIECE_ART = {
    p: 'M46 7 40 12 35 22 35 29 41 40 32 47 33 54 35 56 41 56 43 58 43 61 37 72 32 77 24 82 19 89 17 97 17 105 94 105 94 95 92 89 89 84 77 75 71 68 68 60 69 57 75 57 79 52 79 47 71 41 76 29 75 19 72 13 68 9 62 6 49 6Z',
    k: 'M51 6 51 13 42 15 42 23 51 25 48 35 33 31 24 32 18 35 13 40 10 46 10 60 12 64 31 85 38 85 39 86 27 89 22 95 21 104 22 105 90 105 90 95 86 90 79 88 78 86 81 85 99 65 101 61 101 44 95 36 87 32 75 32 64 35 62 30 62 25 63 24 69 24 69 14 63 14 61 12 60 6Z M79 47 84 51 84 58 71 72 65 71 64 70 64 52 69 48Z M32 47 41 47 47 51 47 71 46 72 39 71 29 60 27 56 27 52Z',
    b: 'M49 7 45 12 46 22 36 32 27 49 26 53 27 68 34 83 25 86 21 90 20 105 91 105 91 94 89 89 84 85 77 83 77 81 81 76 84 69 84 64 85 63 84 49 79 38 68 25 65 27 61 37 61 40 59 44 59 56 54 57 52 55 52 48 54 38 57 29 65 16 65 13 58 6Z',
    n: 'M42 6 39 9 37 17 31 22 24 39 13 54 13 58 16 63 21 66 26 66 27 67 31 67 38 59 44 59 47 57 49 57 51 59 51 61 38 73 33 84 26 89 24 93 24 104 25 105 97 105 96 91 88 83 93 65 93 56 92 55 93 51 87 34 78 23 67 17 61 15 56 15 46 6Z',
    r: 'M22 11 23 30 25 35 32 41 32 45 30 53 27 81 22 84 17 90 16 105 94 105 94 91 90 85 83 81 82 67 80 59 80 47 79 46 79 40 83 38 87 32 88 11 79 8 74 8 71 18 69 20 66 19 65 7 64 6 47 6 45 10 45 18 43 20 41 20 39 18 37 8 31 8Z',
    q: 'M30 11 30 22 35 27 35 42 33 48 27 43 26 41 26 32 22 27 12 26 9 28 10 31 9 32 9 41 10 42 9 44 15 49 19 61 28 81 28 84 23 86 18 93 18 105 91 105 91 93 86 86 81 84 81 80 83 78 84 73 90 61 94 49 101 44 101 29 97 26 89 26 86 28 83 32 83 42 76 48 74 45 74 27 80 19 80 13 78 9 74 6 64 6 58 12 58 20 61 26 55 42 52 38 52 35 48 26 48 24 51 20 51 13 49 9 45 6 36 6Z'
  };

  function mount(root, options = {}) {
    if (!root) throw new Error("ChessBoard.mount requires a root element.");
    if (typeof options.getGame !== "function") throw new Error("ChessBoard requires getGame().");
    let orientation = options.orientation === "black" ? "black" : "white";
    let selected = null, targets = [], lastMove = null, hint = null;
    const shell = document.createElement("div"); shell.className = "cl-board-shell";
    const rankLabels = document.createElement("div"); rankLabels.className = "cl-board-ranks";
    const board = document.createElement("div"); board.className = "cl-board";
    board.setAttribute("role", "group"); board.setAttribute("aria-label", "Interactive chessboard");
    const files = document.createElement("div"); files.className = "cl-board-files";
    shell.append(rankLabels, board, files); root.replaceChildren(shell);

    function squareOrder() {
      return {
        ranks: orientation === "white" ? [8,7,6,5,4,3,2,1] : [1,2,3,4,5,6,7,8],
        filesInOrder: orientation === "white" ? [...FILES] : [...FILES].reverse()
      };
    }
    function render() {
      const game = options.getGame(); if (!game) return;
      const order = squareOrder();
      rankLabels.replaceChildren(); files.replaceChildren(); board.replaceChildren();
      order.ranks.forEach(rank => { const el=document.createElement("span"); el.textContent=String(rank); rankLabels.append(el); });
      files.append(document.createElement("span"));
      order.filesInOrder.forEach(file => { const el=document.createElement("span"); el.textContent=file; files.append(el); });
      order.ranks.forEach(rank => order.filesInOrder.forEach(file => {
        const square=file+rank, piece=game.get(square), cell=document.createElement("button");
        cell.type="button"; cell.className="cl-square "+((FILES.indexOf(file)+rank)%2?"cl-dark":"cl-light");
        cell.dataset.square=square;
        cell.setAttribute("aria-label",square+(piece?", "+(piece.color==="w"?"White ":"Black ")+PIECES[piece.type]:", empty"));
        if(selected===square) cell.classList.add("cl-selected");
        if(targets.includes(square)){cell.classList.add("cl-target");if(piece)cell.classList.add("cl-capture");}
        if(lastMove&&(lastMove.from===square||lastMove.to===square))cell.classList.add("cl-last");
        if(hint&&(hint.from===square||hint.to===square))cell.classList.add("cl-hint");
        if(piece){
          const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
          svg.setAttribute("viewBox","0 0 112 112");svg.setAttribute("class","cl-piece "+(piece.color==="w"?"cl-piece-white":"cl-piece-black"));
          svg.setAttribute("aria-hidden","true");svg.setAttribute("focusable","false");
          svg.innerHTML='<defs><linearGradient id="piece-shade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff"/><stop offset=".72" stop-color="#fff"/><stop offset="1" stop-color="#d5d6d8"/></linearGradient></defs><path d="'+PIECE_ART[piece.type]+'" fill="url(#piece-shade)" fill-rule="evenodd" stroke="#34363a" stroke-width="3.4" stroke-linejoin="round" stroke-linecap="round"/>';
          cell.append(svg);
        }
        cell.addEventListener("click",()=>handleSquare(square));board.append(cell);
      }));
      if(typeof options.onRender==="function")options.onRender(game);
    }
    function handleSquare(square){
      const game=options.getGame();
      if(selected){
        const move=game.move({from:selected,to:square,promotion:typeof options.getPromotion==="function"?options.getPromotion(selected,square,game):(options.promotion||"q")});
        if(move){lastMove={from:move.from,to:move.to};selected=null;targets=[];hint=null;if(typeof options.onMove==="function")options.onMove(move,game);render();return;}
      }
      const piece=game.get(square);
      if(piece&&piece.color===game.turn()&&(typeof options.canSelectPiece!=="function"||options.canSelectPiece(piece,square,game))){
        selected=square;targets=game.moves({square,verbose:true}).map(move=>move.to);
      }else{selected=null;targets=[];}
      if(typeof options.onSelection==="function")options.onSelection(selected,targets.slice());render();
    }
    render();
    return {
      render,
      setOrientation(value){orientation=value==="black"?"black":"white";render();},
      flip(){orientation=orientation==="white"?"black":"white";render();return orientation;},
      setHint(from,to){hint={from,to};selected=from;targets=[to];render();},
      clearHint(){hint=null;selected=null;targets=[];render();},
      setLastMove(move){lastMove=move?{from:move.from,to:move.to}:null;render();},
      destroy(){root.replaceChildren();}
    };
  }
  window.ChessBoard={mount};
})();