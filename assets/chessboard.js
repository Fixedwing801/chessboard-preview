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
    k: '<path d="M46 5h8v12h12v8H54v12h-8V25H34v-8h12z M50 37c-20 0-34 12-34 30 0 10 6 17 15 21h38c9-4 15-11 15-21 0-18-14-30-34-30z M22 82h56q8 0 10 8l2 7H10l2-7q2-8 10-8z"/><path d="M28 65c6-8 13-12 22-12s16 4 22 12c-7 2-12 6-16 13H44c-4-7-9-11-16-13z" fill="#c4c5c7" stroke="none"/>',
    q: '<path d="M18 31l13 17 7-28 12 25 12-25 7 28 13-17-8 38H26z M22 69h56l8 10H14z M18 79h64q7 0 9 8l1 8H8l1-8q2-8 9-8z"/><circle cx="18" cy="25" r="6"/><circle cx="38" cy="14" r="6"/><circle cx="50" cy="10" r="6"/><circle cx="62" cy="14" r="6"/><circle cx="82" cy="25" r="6"/>',
    r: '<path d="M15 12h16v13h8V12h22v13h8V12h16v27H15z M25 39h50l-5 12 5 30H25l5-30z M18 80h64q7 0 9 8l1 7H8l1-7q2-8 9-8z"/><path d="M37 48h26l-3 31H34z" fill="#c3c4c6" stroke="none"/>',
    b: '<path d="M50 8c-7 8-22 27-22 42 0 13 8 21 19 25l-8 7h22l-8-7c11-4 19-12 19-25C72 35 57 16 50 8z M19 80h62q8 0 10 8l1 7H8l1-7q2-8 10-8z"/><path d="M50 17c-6 8-11 18-12 29 5 5 11 9 17 13-3-12-2-24 4-35z" fill="#c5c6c8" stroke="none"/><path d="M42 22l16 31" fill="none" stroke="#30343a" stroke-width="4"/>',
    n: '<path d="M20 80c7-9 10-19 12-30 2-15 10-29 24-40l11 8 15 8-8 12 9 12-12 11-3 19z M18 80h64q7 0 9 8l1 7H8l1-7q2-8 9-8z"/><path d="M31 48c4-13 12-25 25-34l8 9-9 9c11 8 18 18 16 30-2 10-9 17-20 20H31c8-9 11-18 10-27z" fill="#c5c6c8" stroke="none"/><path d="M37 37q6-7 13-5" fill="none" stroke="#30343a" stroke-width="4"/><ellipse cx="39" cy="37" rx="3.5" ry="2.8" fill="#30343a" stroke="none"/>',
    p: '<circle cx="50" cy="25" r="17"/><path d="M34 43h32l-4 9c4 9 12 14 19 20 6 6 8 11 8 17H11c0-6 2-11 8-17 7-6 15-11 19-20z M20 80h60q8 0 10 8l1 7H9l1-7q2-8 10-8z"/><path d="M39 52c5 9 11 15 21 21l-3 11H43l-7-18z" fill="#c5c6c8" stroke="none"/>'
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
          svg.setAttribute("viewBox","0 0 100 100");svg.setAttribute("class","cl-piece "+(piece.color==="w"?"cl-piece-white":"cl-piece-black"));
          svg.setAttribute("aria-hidden","true");svg.setAttribute("focusable","false");svg.innerHTML=PIECE_ART[piece.type];cell.append(svg);
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