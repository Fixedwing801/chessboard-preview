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
    p: 'M38.4 2.1 L31.5 6.2 L26 14.4 L26.7 23.7 L35.6 32.5 L35.6 35.1 L21.2 42.8 L24.7 47.9 L37.7 48.5 L35.6 58.8 L27.4 69.6 L4.1 85.6 L0.7 91.8 L0 99.5 L99.3 99.5 L95.2 86.1 L69.9 68.6 L61.6 55.7 L61.6 47.9 L74.7 47.4 L77.4 44.3 L76 41.8 L63 35.1 L63 32.5 L68.5 28.4 L72.6 21.6 L70.5 10.3 L64.4 4.1 L56.8 1 L48.6 0 Z',
    k: 'M44.9 0 L44.5 9.7 L35.2 11.2 L35.2 21.4 L44.1 22.4 L41.9 36.2 L19.4 32.7 L8.4 37.2 L3.5 42.9 L0 51 L0 67.3 L3.1 74.5 L22 99.5 L40.1 97.4 L76.7 99 L97.4 70.9 L99.6 62.2 L98.2 50 L94.3 41.3 L85.5 34.2 L74.4 32.7 L57.7 37.2 L54.6 23 L63.9 21.4 L63.9 11.2 L55.5 10.7 L54.2 0 Z',
    b: 'M44.2 0 L37 4.1 L34.8 8.8 L39.1 18.7 L15.2 36.3 L2.2 53.9 L0 62.2 L2.2 80.3 L9.4 92.2 L18.1 99.5 L79.7 99.5 L89.9 91.7 L97.1 78.8 L97.1 67.9 L87 39.9 L72.5 28 L64.5 45.1 L62.3 67.9 L37.7 68.4 L39.1 46.1 L43.5 32.6 L52.2 17.1 L60.9 8.3 L60.1 5.2 L55.1 1 Z',
    n: 'M35.8 0 L31.6 11.6 L21.4 22.2 L15.5 38.1 L0 60.3 L0 68.8 L4.3 72 L16 75.1 L25.1 65.1 L38.5 62.4 L51.9 50.3 L54 50.3 L57.8 57.7 L55.6 66.7 L33.2 88.4 L27.3 99.5 L44.4 97.9 L79.7 97.9 L92.5 99.5 L97.9 81.5 L99.5 67.2 L97.9 52.9 L91.4 36.5 L80.2 23.8 L73.3 19 L63.1 14.3 L49.2 11.6 Z',
    r: 'M12 8 L12 24 L23 24 L23 13 L35 13 L35 24 L46 24 L46 13 L58 13 L58 24 L69 24 L69 13 L81 13 L81 24 L92 24 L92 8 L82 8 L82 30 L77 35 L74 47 L72 77 L66 85 L61 90 L61 96 L96 96 L94 88 L87 81 L84 77 L82 47 L79 35 L74 30 L74 24 L26 24 L26 30 L21 35 L18 47 L16 77 L12 81 L6 88 L4 96 L39 96 L39 90 L34 85 L28 77 L26 47 L23 35 L18 30 L18 24 L18 8 Z',
    q: 'M1.7 31 L0 35.8 L0.4 41.2 L3.8 46.5 L8.5 49.2 L25.2 99.5 L53 97.9 L74.8 99.5 L91.5 48.7 L97 45.5 L99.6 39.6 L99.6 34.8 L97 29.4 L94 27.3 L87.2 28.3 L83.3 34.2 L84.2 46 L71.8 62.6 L69.7 62.6 L67.5 21.9 L72.6 17.6 L74.4 10.2 L72.2 3.7 L67.5 0 L61.1 1.1 L56.4 8.6 L56.4 13.4 L60.3 19.8 L60.3 23.5 L50.9 55.6 L48.3 54 L39.3 23 L39.3 20.3 L43.2 13.4 L42.7 7 L36.8 0 L29.9 1.1 L25.6 8.6 L26.9 17.6 L32.5 23 L30.8 63.6 L29.1 63.6 L15.4 46 L16.7 35.8 L13.7 29.4 L10.7 27.3 L6 27.3 Z'
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
          svg.setAttribute("aria-hidden","true");svg.setAttribute("focusable","false");
          svg.innerHTML='<defs><linearGradient id="piece-shade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff"/><stop offset=".58" stop-color="#fff"/><stop offset=".78" stop-color="#eeeeef"/><stop offset="1" stop-color="#d2d4d7"/></linearGradient></defs><path d="'+PIECE_ART[piece.type]+'" fill="url(#piece-shade)" fill-rule="evenodd" stroke="#34363a" stroke-width="3.4" stroke-linejoin="round" stroke-linecap="round"/>';
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