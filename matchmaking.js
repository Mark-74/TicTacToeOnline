let queue = [];
let matches = {};
let IDcounter = 0;

function matchPlayer(playerID){ // ritorna true se matchato + id giocatore
    
    // caso ad un giocatore in attesa si unisce un altro giocatore
    if(matches[playerID] !== undefined){ 
        const Player2ID = matches[playerID];
        delete matches[playerID]

        return { success: true, player2ID: Player2ID};
    }

    // caso giocatore si unisce ad uno già in attesa
    if(queue.length > 0 && queue.indexOf(playerID) === -1){
        const Player2ID = queue.shift();
        matches[Player2ID] = playerID;
        
        return { success: true, player2ID: Player2ID}; 
    }

    // caso giocatore non è già in attesa e non ha trovato una partita
    if(queue.indexOf(playerID) === -1){ 
        queue.push(playerID);
    }

    return { success: false, player2ID: undefined }
}

function getID(){
    return IDcounter++;
}

module.exports = { matchPlayer, getID }