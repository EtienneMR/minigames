const express = require("express")
const socket = require("socket.io");

module.exports = class game {
    static id = "[id]"
    static title = "[title]"
    static desc = "[desc]"
    static view = ""
    static style = ""
    static ttl = 5000
    static hidden = false

    static servers = []
    cleanupTimeout = null
    party = ""

    constructor(party) {
        this.party = party
        console.log(`[${this.party}] starting server`)
    }

    /**
     * 
     * @param {socket.Socket} socket 
     */
    addPlayer(socket) {
        let { username, userid } = socket.handshake.query
        console.log(`[${this.party}] player joined ${username}:${userid}#${socket.id}`)
    }

    /**
     * 
     * @param {socket.Socket} socket 
     */
    removePlayer(socket) {
        let { username, userid } = socket.handshake.query
        console.log(`[${this.party}] player leaved ${username}:${userid}#${socket.id}`)
    }

    cleanup() {
        console.log(`[${this.party}] requested cleanup`)
    }

    emptied() {
        console.log(`[${this.party}] server emptied`)
    }

    /**
     * 
     * @returns {express.Router}
     */
    static loadPages() {
        let router = express.Router()

        router.get("/", (req, res) => {
            res.render(this.view ? this.view : this.id, this.getRenderOptions())
        })

        router.get("/client.js", (req, res) => {
            res.sendFile(`./${this.id}/client.js`, {
                root: "./minigames"
            })
        })

        router.get("/style.css", (req, res) => {
            res.sendFile(`./${this.id}/style.css`, {
                root: "./minigames"
            })
        })

        return router
    }

    /**
     * @type {() => {[string]: any}}
     */
    static getRenderOptions() {
        return {
            id: this.id,
            title: this.title,
            desc: this.desc,
            view: this.view,
            ttl: this.ttl,
            hidden: this.hidden,
            servers: this.servers,
            layout: "layouts/game"
        }
    }
}
