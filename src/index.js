import { Chess } from 'chess.js';

var board = null;
var game = new Chess();
var vgame = new Chess();
var $status = $('#status');
var $fen = $('#fen');
var $pgn = $('#pgn');
var $loadpgn = $('#loadpgn');
const PIECESCORES = {
  'p' : 100,
  'b' : 300,
  'n' : 300,
  'r' : 500,
  'q' : 900,
  'k' : 10000
};

loadpgn.onclick = loadPgn;
function loadPgn() {
  var savedpgn = document.getElementById('savedpgn').value;
  game.loadPgn(savedpgn);
  board.position(game.fen());
  // $status.html(status);
  // $fen.html(game.fen());
  // $pgn.html(game.pgn());
  updateStatus();
  board.position(game.fen());
}

function onDragStart (source, piece, position, orientation) {
  // do not pick up pieces if the game is over
  if (game.isGameOver()) return false;

  // only pick up pieces for the side to move
  if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
    return false;
  }
}

function evaluateBoard() {
  var currentBoard = game.board();
  var score = 0;
  for (var i = 0; i < currentBoard.length; i++) {
    for (var j = 0; j < currentBoard[i].length; j++) {
      if (currentBoard[i][j] !== null) {
        score += PIECESCORES[currentBoard[i][j].type] * (currentBoard[i][j].color === 'w' ? 1 : -1);
      }
    }
  }
  return score;
}

function miniMax(depth) {
  if (game.isCheckmate()) {
    return { 
      score: game.turn() == 'w' ? -999999999999 : 999999999999
    }
  }

  if (game.isDraw()) {
    return {
      score: 0
    }
  }

  if (depth == 0) {
    return {
      score: evaluateBoard()
    }
  }

  let moves = game.moves();

  // let evaluated = [];
  
  // for (let i = 0; i < moves.length; i++) {
  //   var move = moves[i];
  //   game.move(move);
  //   var result = evaluateBoard();
  //   game.undo();
  //   evaluated.push({ move: move, score: result.score});
  // }

  // let best = evaluated[0];
  // if (game.turn() == 'w') {
  //   for (let i = 0; i < evaluated.length; i++) {
  //     if (evaluated[i].score > best.score) {
  //       best = evaluated[i];
  //     }
  //   }
  // } else {
  //   for (let i = 0; i < evaluated.length; i++) {
  //     if (evaluated[i].score < best.score) {
  //       best = evaluated[i];
  //     }
  //   }
  // }


  let evaluated = [];
  for (let i = 0; i < moves.length; i++) {
    var move = moves[i];
    game.move(move);
    var result = miniMax(depth - 1);
    game.undo();
    evaluated.push({ move: move, score: result.score });
  }

  let best = evaluated[0];
  if (game.turn() == 'w') {
    for (let i = 0; i < evaluated.length; i++) {
      if (evaluated[i].score > best.score) {
        best = evaluated[i];
      }
    }
  } else {
    for (let i = 0; i < evaluated.length; i++) {
      if (evaluated[i].score < best.score) {
        best = evaluated[i];
      }
    }
  }

  return best;
}

function onDrop (source, target) {
  try {
    // see if the move is legal
    var move = game.move({
      from: source,
      to: target,
      promotion: 'q'
    });
  } catch {
    // illegal move
    return 'snapback';
  }

  // promotion
  if (move.isPromotion('p')) {
    game.undo();
    var promotionChoice = prompt("Choose promotion piece (q, r, b, n):", "q");
    if (!["q", "r", "b", "n"].includes(promotionChoice)) {
      promotionChoice = "q";
    }
    game.move({
      from: source,
      to: target,
      promotion: promotionChoice
    });
  } 

  updateStatus();
}

// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onSnapEnd () {
  board.position(game.fen());
}

function updateStatus() {
  console.log(evaluateBoard());
  var status = '';

  var moveColor = 'White';
  if (game.turn() === 'b') {
    moveColor = 'Black';
  }

  // checkmate?
  if (game.isCheckmate()) {
    status = 'Game over, ' + moveColor + ' is in checkmate.';
  }

  // draw?
  else if (game.isDraw()) {
    status = 'Game over, drawn position';
  }

  // game still on
  else {
    status = moveColor + ' to move';
    
    // check?
    if (game.isCheck()) {
      status += ', ' + moveColor + ' is in check';
    }
  }
  
  $status.html(status);
  $fen.html(game.fen());
  $pgn.html(game.pgn());

  if (moveColor === 'Black' && !game.isGameOver()) {
    // var validMoves = game.moves();
    // game.move(validMoves[Math.floor((Math.random() * 1000) % validMoves.length)]);
    var bestMove = miniMax(3);
    game.move(bestMove.move);
    console.log("fwea");

    updateStatus();
    console.log("qwer");
  }
}

var config = {
  draggable: true,
  position: 'start',
  onDragStart: onDragStart,
  onDrop: onDrop,
  onSnapEnd: onSnapEnd
};
board = Chessboard('myBoard', config);

updateStatus();