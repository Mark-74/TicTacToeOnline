// Marco Balducci, Fabio Fantini, Simone Ceccarelli, Daniele Broccoli 4H

// import
const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const crypto = require('crypto');

// creo app e secret key
const app = express();
const KEY = crypto.randomBytes(32).toString('hex');

const { getID, matchPlayer } = require('./matchmaking.js');
const { addMatch, checkIfMatchExists, playerIsPartOfGame, move, getLastMove, checkWinAndStalemate, deleteInstance, isPlayerOne } = require('./game.js');

//setup ejs for templates and templates folder
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'templates'));

//settings for express
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist')));
app.use('/assets', express.static(path.join(__dirname, '/templates/assets')));

// middleware per autenticazione cookie
function auth(req, res, next) {
    const cookie = req.cookies.session;

    // primo controllo: se il cookie esiste
    if (!cookie) {
        res.status(403).send('Session cookie not found');
        return;
    }
    try { //se il cookie esiste, verifico che sia valido
        jwt.verify(cookie, KEY);
    } catch {
        res.status(401).send('Invalid Session cookie');
        return;
    }

    next(); // cookie valido, proseguo
}

// homepage
app.get('/', async (req, res) => {
    res.render('homepage');
})

// pagina della partita
app.get('/games/:gameID', auth, async (req, res) => {
    const cookie = req.cookies.session;
    const playerID = jwt.decode(cookie).id;
    const gameID = req.params.gameID;

    // controllo validità gameID
    if(!gameID){
        res.status(400).send("Invalid gameID");
        return;
    }
    
    // controllo che il player sia uno dei due player della partita
    if(!playerIsPartOfGame(gameID, playerID)){
        res.status(401).send("You are not part of this match! 😡");
        return;
    }
    
    // tutto ok
    res.render('tris', {isPlayerOne: isPlayerOne(gameID, playerID), playerID: playerID});
})

// api per movimento client -> server
app.get('/muovi/:gameID', auth, async (req, res) => {
    const cookie = req.cookies.session;
    const playerID = jwt.decode(cookie).id;
    const gameID = req.params.gameID;

    // controllo validità gameID
    if(!gameID){
        res.status(400).send("Invalid gameID");
        return;
    }
    
    // controllo che il player sia uno dei due player della partita
    if(!playerIsPartOfGame(gameID, playerID)){
        res.status(401).send("You are not part of this match! 😡");
        return;
    }

    // prendo i dati dalla query string e li controllo
    const [row, col] = [req.query.row, req.query.col];
    if(!row || !col){
        res.status(400).send("Invalid row or col");
        return;
    }

    // faccio la mossa
    result = move(gameID, playerID, row, col);
    const winData = checkWinAndStalemate(gameID);

    // se la mossa ha comportato ad una vittoria o ad un pareggio lo dico al client
    if (winData === undefined){ // stalemate
        res.status(555).json({'winner': 'stalemate', 'X': row, 'Y': col});
        return;
    } else if(winData['win'] === true){ // win
        res.status(555).json({'winner': winData['winner'], 'X': row, 'Y': col});
        return;
    }

    // altrimenti ritorno "mossa valida"
    res.status(200).json(result);
})

// api per movimento server -> client
app.get('/chiedi-mossa/:gameID', auth, (req, res) => {
    const cookie = req.cookies.session;
    const playerID = jwt.decode(cookie).id;
    const gameID = req.params.gameID;

    // controllo validità gameID
    if(!gameID){
        res.status(400).send("Invalid gameID");
        return;
    }
    
    // controllo che il player sia uno dei due player della partita
    if(!playerIsPartOfGame(gameID, playerID)){
        res.status(401).send("You are not part of this match! 😡");
        return;
    }

    // recupero ultima mossa fatta e controllo che questa non abbia portato a vittoria o pareggio
    const lastMove = getLastMove(gameID, playerID);
    const winData = checkWinAndStalemate(gameID);

    // se la mossa ha comportato ad una vittoria o ad un pareggio lo dico al client e cancello la partita dal dictionary delle partite
    if(winData === undefined){
        deleteInstance(gameID);
        res.status(555).json({'winner': 'stalemate', 'X': lastMove['X'], 'Y': lastMove['Y'] }); // stalemate
        return;
    }
    else if (winData['win'] === true){
        deleteInstance(gameID);
        try{
            res.status(555).json({'winner':winData['winner'], 'X': lastMove['X'], 'Y': lastMove['Y']}); // win
        } catch (err){
            console.log(err);
            res.status(500).send("Error while sending winner data");
        }
        return;
    }

    // se la mossa non ha portato a vittoria o pareggio, ritorno la mossa se esiste
    if(lastMove !== undefined)
        res.status(200).json(lastMove);
    else // altrimenti ritorno 420 (mossa non ancora fatta)
        res.status(420).send();
})

// api per il matchmaking
app.get('/chiedi-partita', auth, async (req, res) => {
    const cookie = req.cookies.session;
    const player1ID = jwt.decode(cookie).id
    
    // provo ad abbinare il player con un altro
    const { success, player2ID } = matchPlayer(player1ID);
    if (success) { // giocatore trovato
        let { exists, gameID } = checkIfMatchExists(player1ID, player2ID);
        if(!exists)
            gameID = addMatch(player1ID, player2ID);
        
        res.status(200).json({game: gameID});
    } else { // nessun giocatore trovato
        res.status(404).send('No match found yet');
    }

    return;
})

app.get('/login', async (req, res) => {
    // decommentare se si vuole impedire il login se già autenticati
    // if(req.cookies.session){
    //     res.status(403).send("Already authenticated");
    //     return;
    // }

    // creo un cookie di sessione per il player, lo firmo e lo invio al client
    try {
        const cookie = jwt.sign(JSON.stringify({ 'id': getID() }), KEY);

        res.cookie('session', cookie)
        res.status(200).send('')
    } catch {
        res.status(500).send('Error while providing playerID')
    }
})

// info e startup server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});