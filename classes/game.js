const express = require("express")
const socket = require("socket.io");

module.exports = class game {
    static id       = "[id]"
    static title    = "[title]"
    static desc     = "[desc]"
    static ttl      =  5000

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
        let {username, userid} = socket.handshake.query
        console.log(`[${this.party}] player joined ${username}:${userid}#${socket.id}`)
    }

    /**
     * 
     * @param {socket.Socket} socket 
     */
    removePlayer(socket) {
        let {username, userid} = socket.handshake.query
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

        return router
    }
}
