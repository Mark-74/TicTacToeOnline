const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const crypto = require('crypto');

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
app.use('/assets', express.static(path.join(__dirname, '/templates/images')));

function auth(req, res, next) {
    const cookie = req.cookies.session;

    if (!cookie) {
        res.status(403).send('Session cookie not found');
        return;
    }
    try {
        jwt.verify(cookie, KEY);
    } catch {
        res.status(401).send('Invalid Session cookie');
        return;
    }

    next();
}

app.get('/', async (req, res) => {
    res.render('homepage');
})

app.get('/games/:gameID', auth, async (req, res) => {
    const cookie = req.cookies.session;
    const playerID = jwt.decode(cookie).id;
    const gameID = req.params.gameID;

    if(!gameID){
        res.status(400).send("Invalid gameID");
        return;
    }
    
    if(!playerIsPartOfGame(gameID, playerID)){
        res.status(401).send("You are not part of this match! 😡");
        return;
    }
    
    res.render('tris', {isPlayerOne: isPlayerOne(gameID, playerID)});
})

app.get('/muovi/:gameID', auth, async (req, res) => {
    const cookie = req.cookies.session;
    const playerID = jwt.decode(cookie).id;
    const gameID = req.params.gameID;

    if(!gameID){
        res.status(400).send("Invalid gameID");
        return;
    }
    
    if(!playerIsPartOfGame(gameID, playerID)){
        res.status(401).send("You are not part of this match! 😡");
        return;
    }

    const [row, col] = [req.query.row, req.query.col];
    if(!row || !col){
        res.status(400).send("Invalid row or col");
        return;
    }

    result = move(gameID, playerID, row, col);
    const winData = checkWinAndStalemate(gameID);

    if (winData === undefined){ // stalemate
        res.status(554).send('stalemate');
        return;
    } else if(winData['win'] === true){
        res.status(555).json(winData);
        return;
    }

    res.status(200).json(result);
})

app.get('/chiedi-mossa/:gameID', auth, (req, res) => {
    const cookie = req.cookies.session;
    const playerID = jwt.decode(cookie).id;
    const gameID = req.params.gameID;

    if(!gameID){
        res.status(400).send("Invalid gameID");
        return;
    }
    
    if(!playerIsPartOfGame(gameID, playerID)){
        res.status(401).send("You are not part of this match! 😡");
        return;
    }

    const lastMove = getLastMove(gameID, playerID);
    const winData = checkWinAndStalemate(gameID);

    if(winData === undefined){
        deleteInstance(gameID);
        res.status(554).send('stalemate');
        return;
    }
    else if (winData['win'] === true){
        deleteInstance(gameID);
        res.status(555).json({'winner':winData['winner'], lastMove});
        return;
    }

    if(lastMove !== undefined)
        res.status(200).json(lastMove);
    else
        res.status(420).send();
})

app.get('/chiedi-partita', auth, async (req, res) => {
    const cookie = req.cookies.session;
    
    const player1ID = jwt.decode(cookie).id
    
    const { success, player2ID } = matchPlayer(player1ID);
    if (success) {
        let { exists, gameID } = checkIfMatchExists(player1ID, player2ID);
        if(!exists)
            gameID = addMatch(player1ID, player2ID);
        
        res.status(200).json({game: gameID});
    } else {
        res.status(404).send('No match found yet');
    }

    return;
})

app.get('/login', async (req, res) => {
    // if(req.cookies.session){
    //     res.status(403).send("Already authenticated");
    //     return;
    // }

    try {
        const cookie = jwt.sign(JSON.stringify({ 'id': getID() }), KEY);

        res.cookie('session', cookie)
        res.status(200).send('')
    } catch {
        res.status(500).send('Error while providing playerID')
    }
})

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});