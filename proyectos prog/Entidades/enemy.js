export class Enemy {

    constructor(level){

        this.level = level

        this.health = 20 + (level * 5)

        this.board = [null,null,null]
    }

}