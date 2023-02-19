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
        console.log(`[${this.party}] player joined ${socket.id}`)
    }

    /**
     * 
     * @param {socket.Socket} socket 
     */
    removePlayer(socket) {
        console.log(`[${this.party}] player leaved ${socket.id}`)
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
