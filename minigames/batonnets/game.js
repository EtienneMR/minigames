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
        static id       = "batonnets"
        static title    = "Le jeu des batonnets"
        static desc     = "Jouez au grand classique jeu des batonnets avec vos amis !"
        static ttl      = 60 * 1000

        constructor(party) {
            super(party)

            this.player1 = null
            this.player2 = null
            this.p1turn = true
            this.started = false

            this.total = 21
            this.sticks = 21
            this.maxrm = 3
        }

        sendUpdate() {
            io.to(this.party).emit("update", {
                total: this.total,
                sticks: this.sticks,
                maxrm: this.maxrm,
                turn: (this.p1turn ? this.player1?.id : this.player2?.id),
                alone: !this.player1 || !this.player2,
                started: this.started,
            })
        }

        /**
         * 
         * @param {socket.Socket} socket 
         */
        addPlayer(socket) {
            super.addPlayer(socket)
            if (!this.player1) {
                this.player1 = socket
            }
            else if (!this.player2) {
                this.player2 = socket
            }
            else {
                socket.emit("error", "party full")
                return socket.disconnect()
            }
            socket.on("take", (num) => {
                if (!this.started) return
                if (socket == (this.p1turn ? this.player1 : this.player2)) {
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
            socket.once("start", ({ total, maxrm }) => {
                if (socket == (this.p1turn ? this.player1 : this.player2)) {
                    this.total = total
                    this.sticks = total
                    this.maxrm = maxrm
                    this.started = true
                    this.sendUpdate()
                }
            })
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
                res.render("batonnets")
            })

            return router
        }
    }
}