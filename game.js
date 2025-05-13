// Marco Balducci, Fabio Fantini, Simone Ceccarelli, Daniele Broccoli 4H

let active_matches = {};
let globalGameID = 0;

const winningCombinations = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
  ];

// classe che rappresenta una partita in corso
class GameInstance {
    constructor(player1ID, player2ID, gameID){
        this.player1ID = player1ID;
        this.player2ID = player2ID;
        this.id = gameID;
        this.turn = 1;
        this.MATRIX = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
        this.lastMove = undefined;
    }

    move(playerID, X, Y){
        // Controlla se è il turno del player; in caso contrario genera un errore
        if((this.turn == 1 && this.player1ID != playerID) || (this.turn == 2 && this.player2ID != playerID))
            throw new Error('Non è il tuo turno');

        // verico la mossa: controllo che sia nei limiti e che la cella sia vuota
        if((X < 0 || X >= 3) || (Y < 0 || Y >= 3) || this.MATRIX[X][Y] != 0){
            throw new Error('Mossa non valida');
        }

        // Aggiorno la matrice di gioco con la mossa del giocatore
        this.MATRIX[X][Y] = this.turn;
        this.lastMove = {'X': X, 'Y':Y};

        // Cambio il turno all'altro giocatore
        switch(this.turn){
            case 1:
                this.turn = 2;
                break;
            case 2:
                this.turn = 1;
                break;
            default:
                // Gestisce casi inaspettati (non dovrebbe accadere)
                throw new Error("Qualcosa è andato storto");
        }
    }

    // ritorna l'ultima mossa fatta dal giocatore opposto, utilizzata in /chiedi-mossa
    getLastMove(playerID){
        if((this.turn == 1 && this.player1ID != playerID) || (this.turn == 2 && this.player2ID != playerID))
            throw new Error('The opponent hasn\'t made a move yet');

        return this.lastMove; // {'X': X, 'Y':Y}
    }

    checkWin(){
        try{
            // Controlla se uno dei due giocatori ha vinto
            for(let i = 0; i < winningCombinations.length; i++){
                const [a, b, c] = winningCombinations[i];

                if(this.MATRIX[(a-a%3)/3][a%3] == 1 && this.MATRIX[(b-b%3)/3][b%3] == 1 && this.MATRIX[(c-c%3)/3][c%3] == 1)
                    return {win: true, winner: this.player1ID};
                
                if(this.MATRIX[(a-a%3)/3][a%3] == 2 && this.MATRIX[(b-b%3)/3][b%3] == 2 && this.MATRIX[(c-c%3)/3][c%3] == 2)
                    return {win: true, winner: this.player2ID};
            }
        } catch (Error){
            console.log(Error);
        }
        
        // se non è stato trovato nessun vincitore, controllo se la partita è in pareggio
        if(this.checkStalemate())
            throw new Error('Stalemate');

        // altrimenti la partita continua
        return {win: false, winner: undefined};
    }

    // Controlla se la partita è in situazione di stallo, ritorna True se la partita è in stallo, altrimenti false
    checkStalemate(){
        // se tutte le celle sono occupate e non c'è un vincitore, allora la partita è in stallo
        for(let X = 0; X < 3; X++){
            for(let Y = 0; Y < 3; Y++){
                if(this.MATRIX[X][Y] == 0){
                    return false
                }
            }
        }

        return true;
    }

}

// si interfaccia con la classe GameInstance per muovere
function move(gameID, playerID, X, Y){
    try{
        active_matches[gameID].move(playerID, X, Y);
    } catch(err){
        // mossa non valida
        return {valid: false, reason: err.message};
    }

    // mossa valida
    return {valid: true, reason: undefined};
}

// si interfaccia con la classe GameInstance per prendere l'ultima mossa
function getLastMove(gameID, playerID){
    try{
        return active_matches[gameID].getLastMove(playerID);
    } catch(err){
        return undefined;
    }
}

// si interfaccia con la classe GameInstance per controllare se c'è un vincitore o un pareggio
function checkWinAndStalemate(gameID){
    try{
        return active_matches[gameID].checkWin();
    } catch(err){
        return undefined; // if undefined, stalemate
    }
}

// crea una nuova partita e la aggiunge al dizionario delle partite
function addMatch(player1ID, player2ID){
    active_matches[globalGameID] = new GameInstance(player1ID, player2ID, globalGameID);
    return globalGameID ++; // ritorna l'id della partita appena creata e incrementa l'id globale
}

// controlla se esiste una partita tra i due giocatori
function checkIfMatchExists(player1ID, player2ID){
    for (const [gameID, instance] of Object.entries(active_matches)) {
        if((instance.player1ID == player1ID || instance.player1ID == player2ID) && (instance.player2ID == player1ID || instance.player2ID == player2ID))
            return { exists: true, gameID: gameID } // partita esistente
    }

    // partita non esistente
    return { exists: false, gameID: undefined };
}

// controlla se il player è uno dei due giocatori della partita
function playerIsPartOfGame(gameID, playerID){
    const instance = active_matches[gameID];

    if(!instance) return false;

    return (instance.player1ID === playerID || instance.player2ID === playerID);
}

// controlla se il player è il player1 della partita (che quindi ha il primo turno)
function isPlayerOne(gameID, playerID){
    return active_matches[gameID].player1ID === playerID;
}

// cancella la partita dal dizionario delle partite
function deleteInstance(gameID){
    delete active_matches[gameID];
}

module.exports = { addMatch, checkIfMatchExists, playerIsPartOfGame, move, getLastMove, checkWinAndStalemate, deleteInstance, isPlayerOne }