let queue = [];
let IDcounter = 0;

function matchPlayer(playerID){ // ritorna true se matchato + id giocatore
    if(queue.length > 0){
        return true, queue.shift();
    }

    // se player non è già in attesa
    if(!queue.find(playerID)){
        queue.push(playerID);
    }

    return false, undefined
}

function getID(){
    return IDcounter++;
}

module.exports = { matchPlayer, getID }