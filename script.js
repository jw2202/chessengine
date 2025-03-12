var board = null
var game = new Chess()
var $status = $('#status')
var $fen = $('#fen')
var $pgn = $('#pgn')

function onDragStart (source, piece, position, orientation) {
  // do not pick up pieces if the game is over
  if (game.game_over()) return false

  // only pick up pieces for the side to move
  if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
    return false
  }
}

function onDrop (source, target) {
  // see if the move is legal
  var move = game.move({
    from: source,
    to: target,
    promotion: 'q'
  })

  // illegal move
  if (move === null) return 'snapback'

  // promotion
  if (move.flags.includes('p')) {
    game.undo()
    var promotionChoice = prompt("Choose promotion piece (q, r, b, n):", "q");
    if (!["q", "r", "b", "n"].includes(promotionChoice)) {
      promotionChoice = "q"; // 잘못된 입력 시 기본값 퀸
    }
    game.move({
      from: source,
      to: target,
      promotion: promotionChoice
    })
  } 

  updateStatus()
}

// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onSnapEnd () {
  board.position(game.fen())
}

function updateStatus () {
  var status = ''

  var moveColor = 'White'
  if (game.turn() === 'b') {
    moveColor = 'Black'
  }

  // checkmate?
  if (game.in_checkmate()) {
    status = 'Game over, ' + moveColor + ' is in checkmate.'
  }

  // draw?
  else if (game.in_draw()) {
    status = 'Game over, drawn position'
  }

  // game still on
  else {
    status = moveColor + ' to move'
    
    // check?
    if (game.in_check()) {
      status += ', ' + moveColor + ' is in check'
    }

  }
  
  $status.html(status)
  $fen.html(game.fen())
  $pgn.html(game.pgn())

  if (moveColor === 'Black' && !game.game_over()) {
    var validMoves = game.moves()
    // game.move(validMoves[0])
    game.move(validMoves[Math.floor((Math.random() * 1000) % validMoves.length)])
    updateStatus()
  }
}

var config = {
  draggable: true,
  position: 'start',
  onDragStart: onDragStart,
  onDrop: onDrop,
  onSnapEnd: onSnapEnd
}
board = Chessboard('myBoard', config)

updateStatus()