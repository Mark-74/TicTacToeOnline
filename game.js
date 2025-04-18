let active_matches = {};
let globalGameID = 0;

class GameInstance {
    constructor(player1ID, player2ID, gameID){
        this.player1ID = player1ID;
        this.player2ID = player2ID;
        this.id = gameID;
        this.turn = 1;
        this.MATRIX = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    }

    move(X, Y){
        if((X < 0 || X >= 3) || (Y < 0 || Y >= 3) || this.MATRIX[X][Y] != 0){
            throw new Error('Invalid move');
        }

        this.MATRIX[X][Y] = this.turn;
        switch(this.turn){
            case 1:
                this.turn = 2;
                break;
            case 2:
                this.turn = 1;
                break;
            default:
                throw new Error("Something really bad happened");
        }
    }

    checkWin(){
        //TODO
    }

    /**
     * Checks for a stalemate situation
     * @returns True if the game is in stalemate, otherwise false
     */
    checkStalemate(){
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

function addMatch(player1ID, player2ID){
    active_matches[globalGameID] = new GameInstance(player1ID, player2ID, globalGameID);
    return globalGameID ++;
}

function checkIfMatchExists(player1ID, player2ID){
    for (const [gameID, instance] of Object.entries(active_matches)) {
        if((instance.player1ID == player1ID || instance.player1ID == player2ID) && (instance.player2ID == player1ID || instance.player2ID == player2ID))
            return { exists: true, gameID: gameID }
    }

    return { exists: false, gameID: undefined };
}

module.exports = { addMatch, checkIfMatchExists }