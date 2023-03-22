const express = require("express")
const socket = require("socket.io")
const game = require("../../classes/game.js")
const fs = require("fs").promises

/**
 * Shuffles array in place.
 * @param {Array<a>} array An array containing the items.
 * @returns {Array<a>} Shuffled array
 */
function shuffle(array) {
    let currentIndex = array.length, randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {

        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }

    return array;
}
/**
 * 
 * @param {socket.Server} io 
 * @returns 
 */
module.exports = (io) => {
    return class batonnets extends game {
        static id = "memory"
        static title = "Le jeu du memory"
        static desc = "Parviendrez-vous à trouver toutes les paires ?"
        static ttl = 60 * 1000
        static hidden = true

        constructor(party) {
            super(party)

            this.player1 = null
            this.player2 = null
            this.player1id = null
            this.player2id = null
            this.player1replay = false
            this.player2replay = false
            this.p1turn = true
            this.started = false
            this.ended = false
            this.selected = null
            this.hideTimeout = null

            this.data = []
        }

        sendUpdate() {
            io.to(this.party).emit("update", {
                data: this.data.map(card => card.owner === null ? { face: null, owner: null } : card),

                turn: (this.p1turn ? this.player1?.id : this.player2?.id),
                alone: !this.player1 || !this.player2,
                started: this.started,
                ended: this.ended,
                title: (this.player1?.handshake.query.userid == this.player2?.handshake.query.userid) ? "Partie d'entrainement" : (this.player1?.handshake.query.username ?? "???") + " vs " + (this.player2?.handshake.query.username ?? "???"),
                replay: `${this.player1replay + this.player2replay}/2`,
                winner: this.data.some(card => card.owner === null) ? null : (this.data.filter(card => card.owner).length < this.data.filter(card => !card.owner).length ? this.player1?.id : this.player2?.id)
            })
        }

        /**
         * 
         * @param {socket.Socket} socket 
         */
        addPlayer(socket) {
            super.addPlayer(socket)
            let { userid } = socket.handshake.query
            if (!this.player1 && this.player1id == userid) {
                this.player1 = socket
                this.player1id = userid
            }
            else if (!this.player2 && this.player2id == userid) {
                this.player2 = socket
                this.player2id = userid
            }
            else if (!this.player1) {
                this.player1 = socket
                this.player1id = userid
            }
            else if (!this.player2) {
                this.player2 = socket
                this.player2id = userid
            }
            else {
                socket.emit("redirect", "/party-full")
                return socket.disconnect()
            }
            socket.on("reveal", (id) => {
                if (this.hideTimeout) {
                    this.hideTimeout = clearInterval(this.hideTimeout)
                    io.to(this.party).emit("hide")
                }

                if (socket == (this.p1turn ? this.player1 : this.player2) && this.started) {
                    let card = this.data[id]

                    if (card && card.owner === null && card != this.selected) {
                        if (this.selected) {
                            if (card.face == this.selected.face) {
                                card.owner = this.selected.owner = this.p1turn
                            }
                            else {
                                io.to(this.party).emit("reveal", {
                                    id,
                                    face: card.face,
                                })
                                this.p1turn = !this.p1turn
                            }
                            this.selected = null

                            this.hideTimeout = setTimeout(() => {
                                io.to(this.party).emit("hide")
                            }, 5000);
                        }
                        else {
                            this.selected = card
                            io.to(this.party).emit("reveal", {
                                id,
                                face: card.face,
                            })
                        }
                    }

                    this.sendUpdate()
                }
            })
            socket.on("start", (count) => {
                if (socket == (this.p1turn ? this.player1 : this.player2) && !this.started) {
                    fs.readdir("./minigames/memory/faces")
                        .then(shuffle)
                        .then((faces) => {
                            let data = []
                            for (let i = 0; i < count; i++) {
                                let face = faces.shift()

                                data.push({
                                    face: face,
                                    owner: null
                                })
                                data.push({
                                    face: face,
                                    owner: null
                                })
                            }
                            this.data = shuffle(data)
                            this.started = true
                            this.sendUpdate()
                        })
                }
            })
            socket.on("replay", () => {
                if (socket == this.player1) {
                    this.player1replay = true
                }
                else {
                    this.player2replay = true
                }
                if (this.player1replay && this.player2replay) {
                    this.player1replay = false
                    this.player2replay = false
                    this.p1turn = true
                    this.started = false
                    this.ended = false

                    this.data = []
                }
                this.sendUpdate()
            })
            socket.on("ready", () => this.sendUpdate())
            this.sendUpdate()
        }

        /**
         * 
         * @param {socket.Socket} socket 
         */
        removePlayer(socket) {
            super.removePlayer(socket)
            if (this.player1 == socket) this.player1 = null
            if (this.player2 == socket) this.player2 = null
            this.sendUpdate()
        }

        /**
     * 
     * @returns {express.Router}
     */
        static loadPages() {
            let router = super.loadPages()

            router.use("/faces", express.static("./minigames/memory/faces"))

            return router
        }
    }
}