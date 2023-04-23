const express = require("express")
const socket = require("socket.io")
const game = require("../../classes/game.js")

/**
 * 
 * @param {socket.Server} io 
 * @returns 
 */
module.exports = (io) => {
    return class batonnets extends game {
        static id = "puissance4"
        static title = "Le jeu du puissance 4"
        static desc = "Jouez au puissance 4 avec vos amis !"
        static ttl = 60 * 1000
        static hidden = false

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

            this.data = []
            this.width = 0
            this.height = 0
            this.align = 4
        }

        sendUpdate() {
            io.to(this.party).emit("update", {
                width: this.width,
                height: this.height,
                align: this.align,
                data: this.data,
                turn: (this.p1turn ? this.player1?.id : this.player2?.id),
                alone: !this.player1 || !this.player2,
                started: this.started,
                ended: this.ended,
                title: (this.player1?.handshake.query.userid == this.player2?.handshake.query.userid) ? "Partie d'entrainement" : (this.player1?.handshake.query.username ?? "???") + " vs " + (this.player2?.handshake.query.username ?? "???"),
                replay: `${this.player1replay + this.player2replay}/2`
            })
        }

        checkWinner(x, y) {
            // Vérification horizontale
            let counter = 0
            let h = 0
            while (h < this.height) {
                if (this.data[x][h] == this.p1turn) {
                    counter++
                    if (counter >= this.align) return true
                }
                else {
                    counter = 0
                }
                h++
            }

            // Vérification verticale
            counter = 0
            let w = 0
            while (w < this.width) {
                if (this.data[w][y] == this.p1turn) {
                    counter++
                    if (counter >= this.align) return true
                }
                else {
                    counter = 0
                }
                w++
            }

            // Vérification diagonale
            counter = 0
            let d = -Math.min(x, y)

            while (x + d < this.width && y + d < this.height) {
                let row = this.data[x + d]
                if (row && row[y + d] == this.p1turn) {
                    counter++
                    if (counter >= this.align) return true
                }
                else {
                    counter = 0
                }
                d++
            }

            // Vérification anti-diagonale
            counter = 0
            let d2 = -Math.min(x, this.height - 1 - y)

            while (x + d2 < this.width && y - d2 < this.height && x + d2 >= 0 && y - d2 >= 0) {
                let row = this.data[x + d2]
                if (row && row[y - d2] == this.p1turn) {
                    counter++
                    if (counter >= this.align) return true
                }
                else {
                    counter = 0
                }
                d2++
            }
        }

        checkEquality() {
            return !this.data.some(row => row.length < this.height)
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
            socket.on("place", (w) => {
                w = Number(w)
                if (!this.started || this.ended) return;
                if (socket == (this.p1turn ? this.player1 : this.player2) && (w >= 0 && w < this.width)) {
                    if (this.data[w].length < this.height) {
                        this.data[w].push(this.p1turn)
                        io.to(this.party).emit("place", w, this.data[w].length - 1, this.p1turn)

                        if (this.checkWinner(w, this.data[w].length - 1) || this.checkEquality()) {
                            this.ended = true
                        }

                        this.p1turn = !this.p1turn
                    }
                }
                this.sendUpdate()
            })
            socket.on("start", (w, h, a) => {
                if (socket == (this.p1turn ? this.player1 : this.player2) && !this.started) {
                    this.width = w
                    this.height = h
                    this.align = a
                    let data = []
                    for (let x = 0; x < w; x++) {
                        data.push([])
                    }
                    this.data = data
                    this.started = true
                    this.sendUpdate()
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
                    this.width = 0
                    this.height = 0
                    this.align = 4
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
    }
}