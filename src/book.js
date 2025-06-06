function bookMove() {
    var baseUrl = 'https://www.chessdb.cn/cdb.php?action=queryall&json=1&board='
    var pvUrl = 'https://www.chessdb.cn/cdb.php?action=querypv&json=1&board='

    var userfen = game.fen();
    var url = baseUrl + userfen;
    var pvUrlGet = pvUrl + userfen;
}