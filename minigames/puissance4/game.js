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
        static desc = "Jouez au grand au puissance 4 avec vos amis !"
        static ttl = 60 * 1000
        static hidden   =  true

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

            this.data = []
            this.width = 0
            this.height = 0
        }

        sendUpdate() {
            io.to(this.party).emit("update", {
                total: this.total,
                sticks: this.sticks,
                maxrm: this.maxrm,
                turn: (this.p1turn ? this.player1?.id : this.player2?.id),
                alone: !this.player1 || !this.player2,
                started: this.started,
                title: (this.player1?.handshake.query.userid == this.player2?.handshake.query.userid) ? "Partie d'entrainement" : (this.player1?.handshake.query.username ?? "???") + " vs " + (this.player2?.handshake.query.username ?? "???"),
                replay: `${this.player1replay ? 1 : 0 + this.player2replay ? 1 : 0}/2`
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
                socket.emit("error", "party full")
                return socket.disconnect()
            }
            socket.on("place", (w) => {
                if (!this.started) return
                if (socket == (this.p1turn ? this.player1 : this.player2) && (num > 0 && num <= this.maxrm)) {
                    if (this.sticks > num) {
                        this.sticks -= num
                        this.p1turn = !this.p1turn
                    }
                    else {
                        this.sticks = 0
                    }
                }
                this.sendUpdate()
            })
            socket.on("start", (w, h) => {
                if (socket == (this.p1turn ? this.player1 : this.player2) && !this.started) {
                    this.width = w
                    this.height = h
                    let data = []
                    for (let x = 0; x < w; i++) {
                        let row = []
                        for (let y = 0; x < h; i++) {
                            row.push(null)
                        }
                        data.push(row)
                    }
                    this.data = data
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

                    this.total = 21
                    this.sticks = 21
                    this.maxrm = 3
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
            let router = express.Router()

            router.get("/", (req, res) => {
                res.render("puissance4")
            })

            return router
        }
    }
}