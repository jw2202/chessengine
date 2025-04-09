import { Chess } from 'chess.js';

var board = null;
var game = new Chess();
var vgame = new Chess();
var $status = $('#status');
var $fen = $('#fen');
var $pgn = $('#pgn');
var $loadpgn = $('#loadpgn');
var whiteSquareGrey = '#a9a9a9'
var blackSquareGrey = '#696969'
const PIECESCORES = {
  'p' : 100,
  'b' : 300,
  'n' : 300,
  'r' : 500,
  'q' : 900,
  'k' : 10000
};

function removeGreySquares () {
  $('#myBoard .square-55d63').css('background', '')
}

function greySquare (square) {
  var $square = $('#myBoard .square-' + square)

  var background = whiteSquareGrey
  if ($square.hasClass('black-3c85d')) {
    background = blackSquareGrey
  }

  $square.css('background', background)
}

loadpgn.onclick = loadPgn;
function loadPgn() {
  var savedpgn = document.getElementById('savedpgn').value;
  game.loadPgn(savedpgn);
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
      score: game.turn() == 'w' ? -999999999999 - depth : 999999999999 + depth
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

  let evaluated = [];
  
  for (let i = 0; i < moves.length; i++) {
    var move = moves[i];
    game.move(move);
    var result = miniMax(depth - 1);
    game.undo();
    evaluated.push({ move: move, score: result.score });
  }

  let best = evaluated[0];
  if (game.turn() === 'w') {
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
  // board.position(game.fen());

  updateStatus();
}

function onMouseoverSquare (square, piece) {
  // get list of possible moves for this square
  var moves = game.moves({
    square: square,
    verbose: true
  })

  // exit if there are no moves available for this square
  if (moves.length === 0) return

  // highlight the square they moused over
  greySquare(square)

  // highlight the possible squares for this piece
  for (var i = 0; i < moves.length; i++) {
    greySquare(moves[i].to)
  }
}

function onMouseoutSquare (square, piece) {
  removeGreySquares()
}

// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onSnapEnd () {
  board.position(game.fen());
}

function updateStatus() {
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
    setTimeout(function(){
      var bestMove = miniMax(3);
      game.move(bestMove.move);
      updateStatus();
      board.position(game.fen());
    }, 300);
  }
}

var config = {
  draggable: true,
  position: 'start',
  onDragStart: onDragStart,
  onSnapEnd: onSnapEnd,
  onDrop: onDrop,
  onMouseoverSquare: onMouseoverSquare,
  onMouseoutSquare: onMouseoutSquare
};
board = Chessboard('myBoard', config);

updateStatus();