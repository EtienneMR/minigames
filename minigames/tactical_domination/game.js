const express = require("express")
const socket = require("socket.io")
const game = require("../../classes/game.js")
const generation = require("./generation.js")
const { CONSTS } = require("./shared.js")

function makeId(length = 8) {
    let result = ''
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const charactersLength = characters.length
    let counter = 0
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength))
        counter += 1
    }
    return result
}

/**
 * 
 * @param {socket.Server} io 
 * @returns 
 */
module.exports = (io) => {
    return class batonnets extends game {
        static id = "tactical_domination"
        static title = "Tactical Domination"
        static desc = "Combattez vos amis dans ce jeu de stratégie !"
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
            this.started = false
            this.ended = false
            this.p1turn = true

            this.p1data = {
                gold: 1,
                wheat: 2,
            }
            this.p2data = {
                gold: 1,
                wheat: 2,
            }

            this.mapData = generation()
            this.units = [{
                x: 0,
                z: 0,
                owner: 0,
                id: makeId(),
            }, {
                x: CONSTS.WIDTH - 1,
                z: CONSTS.HEIGHT - 1,
                owner: 1,
                id: makeId(),
            }]
            this.lockedUnits = []

            this.started = true
        }

        sendUpdate() {
            io.to(this.party).emit("update", {
                alone: !this.player1 || !this.player2,
                started: this.started,
                ended: this.ended,
                title: (this.player1?.handshake.query.userid == this.player2?.handshake.query.userid) ? "Partie d'entrainement" : (this.player1?.handshake.query.username ?? "???") + " vs " + (this.player2?.handshake.query.username ?? "???"),
                replay: `${this.player1replay + this.player2replay}/2`,
                turn: (this.p1turn ? this.player1?.id : this.player2?.id),
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

            socket.on("move", (id, x, z) => {
                if (socket == (this.p1turn ? this.player1 : this.player2) && this.started && !this.ended) {
                    let data = this.p1turn ? this.p1data : this.p2data
                    let unit = this.units.find(u => u.id == id && u.owner == (socket == this.player1 ? 0 : 1))
                    if (unit && data.wheat >= 1 && Math.max(Math.abs(unit.x-x), Math.abs(unit.z-z)) <= 1 && this.lockedUnits.find(u => u == unit.id) == null) {
                        data.wheat -= 1
                        this.lockedUnits.push(unit.id)

                        let caseData = this.mapData[unit.x][unit.z]
                        if (caseData.building.id != CONSTS.BUILDING_MAINBASE.id) caseData.owner = null
                        unit.x = x
                        unit.z = z
                        this.mapData[x][z].owner = unit.owner
                        let target = this.units.find(u => u.x == x && u.z == z && u != unit)
                        if (target) {
                            this.units = this.units.filter(u => u != target)
                        }
                        io.to(this.party).emit("move", id, x, z)

                        let checkTarget = this.p1turn ? 1 : 0
                        if (
                            !this.mapData.find(row => row.find(caseData => caseData.building.id == CONSTS.BUILDING_MAINBASE.id && caseData.owner == checkTarget)) &&
                            !this.units.find(unit => unit.owner == checkTarget)
                        ) {
                            this.ended = true
                            this.sendUpdate()
                        }
                        socket.emit("ressources", data)
                    }
                }
            })

            socket.on("endTurn", () => {
                if (socket == (this.p1turn ? this.player1 : this.player2)) {
                    let data = this.p1turn ? this.p1data : this.p2data

                    for (let x = 0; x < this.mapData.length; x++) {
                        let rowData = this.mapData[x]
                        for (let z = 0; z < rowData.length; z++) {
                            let caseData = rowData[z]
                            if (caseData.owner == (this.p1turn ? 0 : 1)) {
                                for (let effect of caseData.building.effects) {
                                    data[effect.id] += effect.value
                                }
                            }
                        }
                    }

                    this.lockedUnits = []

                    socket.emit("ressources", data)

                    this.p1turn = !this.p1turn
                    this.sendUpdate()
                }
            })

            socket.on("newUnit", (x, z) => {
                if (socket == (this.p1turn ? this.player1 : this.player2)) {
                    let data = this.p1turn ? this.p1data : this.p2data
                    if (
                        data.gold >= 1 &&
                        this.mapData[x][z].building.id == CONSTS.BUILDING_MAINBASE.id &&
                        this.mapData[x][z].owner == (this.p1turn ? 0 : 1) &&
                        this.units.find(u => u.x == x && u.z == z) == null
                    ) {
                        data.gold -= 1
                        let unit = {
                            x, z,
                            owner: (this.p1turn ? 0 : 1),
                            id: makeId(),
                        }
                        this.units.push(unit)
                        io.to(this.party).emit("newUnit",unit)
                        socket.emit("ressources", data)
                    }
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
                    this.started = false
                    this.ended = false
                }
                this.sendUpdate()
            })
            
            socket.once("ready", () => {
                this.sendUpdate()
                if (this.mapData && this.units) {
                    socket.emit("data", {
                        mapData: this.mapData,
                        units: this.units
                    })
                    socket.emit("ressources", socket == this.player1 ? this.p1data : this.p2data)
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
            let router = super.loadPages()

            router.use("/icons", express.static("./minigames/tactical_domination/icons"))
            router.use("/shared.js", express.static("./minigames/tactical_domination/shared.js"))

            return router
        }
    }
}