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
    p: 'M56 7 C42 7 32 17 32 31 C32 39 36 45 43 49 L35 54 C31 57 29 62 32 66 L40 69 C37 75 31 79 25 83 C18 89 15 97 16 105 L96 105 C97 97 94 89 87 83 C81 79 75 75 72 69 L80 66 C83 62 81 57 77 54 L69 49 C76 45 80 39 80 31 C80 17 70 7 56 7 Z',
    k: 'M56 7 L56 17 L45 17 L45 25 L56 25 L56 35 C46 34 36 31 27 33 C16 37 10 47 10 58 C10 65 13 71 19 77 L29 85 L25 89 C20 92 18 98 19 105 L93 105 C94 98 92 92 87 89 L83 85 L93 77 C99 71 102 65 102 58 C102 47 96 37 85 33 C76 31 66 34 56 35 L56 25 L67 25 L67 17 L56 17 Z',
    b: 'M56 7 C47 7 42 14 42 22 C42 28 46 32 49 36 C40 40 33 49 30 60 C24 72 29 81 39 86 L31 89 C25 92 22 98 22 105 L90 105 C90 98 87 92 81 89 L73 86 C83 81 88 72 82 60 C77 49 70 40 63 36 C66 32 70 28 70 22 C70 14 65 7 56 7 Z',
    n: 'M39 10 C31 14 27 23 27 32 C25 40 18 47 14 53 C10 59 14 66 22 68 L33 68 C37 60 43 56 50 53 C44 61 39 69 35 78 L29 86 C24 90 21 96 21 105 L94 105 C95 97 90 90 83 86 L78 81 C85 72 88 60 85 49 C82 35 72 25 59 16 C52 11 45 8 39 10 Z',
    r: 'M24 10 L24 29 C27 35 32 38 37 40 L35 49 L31 80 L25 86 C20 91 18 98 18 105 L94 105 C94 98 92 91 87 86 L81 80 L77 49 L75 40 C80 38 85 35 88 29 L88 10 L78 10 L78 22 L68 22 L68 8 L57 8 L57 22 L47 22 L47 10 L37 10 L37 22 L24 22 Z',
    q: 'M56 7 C63 7 67 14 67 20 C67 25 64 29 60 31 L75 35 C83 28 88 25 94 28 C101 31 102 40 98 47 L86 63 L80 77 L82 84 L89 89 C94 93 96 99 96 105 L16 105 C16 99 18 93 23 89 L30 84 L32 77 L26 63 L14 47 C10 40 11 31 18 28 C24 25 29 28 37 35 L52 31 C48 29 45 25 45 20 C45 14 49 7 56 7 Z'
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