import { Chess } from 'chess.js';

var board = null;
var game = new Chess();
var $status = $('#status');
var $fen = $('#fen');
var $pgn = $('#pgn');
var $loadpgn = $('#loadpgn');
var $undo = $('#undo');
var whiteSquareGrey = '#a9a9a9'
var blackSquareGrey = '#696969'
const PIECESCORES = {
  'p' : 100,
  'b' : 320,
  'n' : 280,
  'r' : 479,
  'q' : 929,
  'k' : 60000
};
const PST = {
  'p': [   [0,   0,   0,   0,   0,   0,   0,   0],
          [78,  83,  86,  73, 102,  82,  85,  90],
           [7,  29,  21,  44,  40,  31,  44,   7],
         [-17,  16,  -2,  15,  14,   0,  15, -13],
         [-26,   3,  10,   9,   6,   1,   0, -23],
         [-22,   9,   5, -11, -10,  -2,   3, -19],
         [-31,   8,  -7, -37, -36, -14,   3, -31],
           [0,   0,   0,   0,   0,   0,   0,   0]],
  'n': [ [-66, -53, -75, -75, -10, -55, -58, -70],
          [-3,  -6, 100, -36,   4,  62,  -4, -14],
          [10,  67,   1,  74,  73,  27,  62,  -2],
          [24,  24,  45,  37,  33,  41,  25,  17],
          [-1,   5,  31,  21,  22,  35,   2,   0],
         [-18,  10,  13,  22,  18,  15,  11, -14],
         [-23, -15,   2,   0,   2,   0, -23, -20],
         [-74, -23, -26, -24, -19, -35, -22, -69]],
  'b': [ [-59, -78, -82, -76, -23,-107, -37, -50],
         [-11,  20,  35, -42, -39,  31,   2, -22],
          [-9,  39, -32,  41,  52, -10,  28, -14],
          [25,  17,  20,  34,  26,  25,  15,  10],
          [13,  10,  17,  23,  17,  16,   0,   7],
          [14,  25,  24,  15,   8,  25,  20,  15],
          [19,  20,  11,   6,   7,   6,  20,  16],
          [-7,   2, -15, -12, -14, -15, -10, -10]],
  'r': [  [35,  29,  33,   4,  37,  33,  56,  50],
          [55,  29,  56,  67,  55,  62,  34,  60],
          [19,  35,  28,  33,  45,  27,  25,  15],
           [0,   5,  16,  13,  18,  -4,  -9,  -6],
         [-28, -35, -16, -21, -13, -29, -46, -30],
         [-42, -28, -42, -25, -25, -35, -26, -46],
         [-53, -38, -31, -26, -29, -43, -44, -53],
         [-30, -24, -18,   5,  -2, -18, -31, -32]],
  'q': [   [6,   1,  -8,-104,  69,  24,  88,  26],
          [14,  32,  60, -10,  20,  76,  57,  24],
          [-2,  43,  32,  60,  72,  63,  43,   2],
           [1, -16,  22,  17,  25,  20, -13,  -6],
         [-14, -15,  -2,  -5,  -1, -10, -20, -22],
         [-30,  -6, -13, -11, -16, -11, -16, -27],
         [-36, -18,   0, -19, -15, -15, -21, -38],
         [-39, -30, -31, -13, -31, -36, -34, -42]],
  'k': [   [4,  54,  47, -99, -99,  60,  83, -62],
         [-32,  10,  55,  56,  56,  55,  10,   3],
         [-62,  12, -57,  44, -67,  28,  37, -31],
         [-55,  50,  11,  -4, -19,  13,   0, -49],
         [-55, -43, -52, -28, -51, -47,  -8, -50],
         [-47, -42, -43, -79, -64, -32, -29, -32],
          [-4,   3, -14, -50, -57, -18,  13,   4],
          [17,  30,  -3, -14,   6,  -1,  40,  18]],
};
const INT_MIN = -2147483648;
const INT_MAX = 2147483647;

undo.onclick = doUndo;
function doUndo() {
  game.undo();
  game.undo();
  updateStatus();
  board.position(game.fen());
}

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

function getPieceValue(type, square, isWhitePiece, isWhitetoMove) {
  var direction = isWhitePiece === isWhitetoMove ? 1 : -1;

  // console.log(square);
  var file = square.charCodeAt(0) - 97;
  var rank = (isWhitePiece ? 8 - square[1] : square[1] - 1);
  // console.log(type, rank, file);

  var pstval = PST[type][rank][file];

  return (PIECESCORES[type] + pstval) * direction;
}

function evaluateBoard() {
  var currentBoard = game.board();
  var score = 0;
  for (var i = 0; i < currentBoard.length; i++) {
    for (var j = 0; j < currentBoard[i].length; j++) {
      if (currentBoard[i][j] !== null) {
        // score += (PIECESCORES[currentBoard[i][j].type] + (currentBoard[i][j].color === 'w' ? PST[currentBoard[i][j].type][i][j] : PST[currentBoard[i][j].type].reverse()[i][j])) * (currentBoard[i][j].color === 'w' ? 1 : -1);
        score += getPieceValue(currentBoard[i][j].type, currentBoard[i][j].square, currentBoard[i][j].color === 'w', game.turn() === 'w');
      }
    }
  }
  return score;
}

function alphaBeta(depth, alpha, beta) {
  if (game.isCheckmate()) {
    return { 
      score: game.turn() === 'w' ? INT_MIN + 10000: INT_MAX - 10000
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

  let moves = game.moves({ verbose: true });
  let normalMoves = [];
  let captureMoves = [];
  let promotionMoves = [];
  for(var i = 0; i < moves.length; i++) {
    if (moves[i].isCapture()) captureMoves.push(moves[i]);
    else if (moves[i].isPromotion()) promotionMoves.push(moves[i]);
    else normalMoves.push(moves[i]);
  }
  moves = promotionMoves.concat(captureMoves).concat(normalMoves);

  if (game.turn() === 'w') {
    var score = INT_MIN;
    var best = moves[0];

    for (var i = 0; i < moves.length; i++) {
      var move = moves[i].san;
      game.move(move);
      var result = alphaBeta(depth - 1, alpha, beta);
      if (result.score > 9999999) result.score -= 1;
      else if (result.score < -9999999) result.score += 1;
      game.undo();
      if (result.score > score) {
        score = result.score;
        best = move;
      }
      alpha = Math.max(alpha, score);
      if (score >= beta) break;
    }
  }
  else {
    var score = INT_MAX;
    var best = moves[0];

    for (var i = 0; i < moves.length; i++) {
      var move = moves[i].san;
      game.move(move);
      var result = alphaBeta(depth - 1, alpha, beta);
      if (result.score > 9999999) result.score -= 1;
      else if (result.score < -9999999) result.score += 1;
      game.undo();
      if (result.score < score) {
        score = result.score;
        best = move;
      }
      beta = Math.min(beta, score);
      if (score <= alpha) break;
    }
  }

  return { score: score, move: best };

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

function onMouseoverSquare (square, piece) {
  // get list of possible moves for this square
  var moves = game.moves({
    square: square,
    verbose: true
  });

  // exit if there are no moves available for this square
  if (moves.length === 0) return;

  // highlight the square they moused over
  greySquare(square);

  // highlight the possible squares for this piece
  for (var i = 0; i < moves.length; i++) {
    greySquare(moves[i].to);
  }
}

function onMouseoutSquare (square, piece) {
  removeGreySquares();
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
      var bestMove = alphaBeta(5, INT_MIN, INT_MAX);
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