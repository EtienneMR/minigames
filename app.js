const port = 8005
const cache_ver = 18
const session_length = 1000 * 60 * 30

const express = require("express")
const session = require("express-session")
const hbs = require("express-hbs")
const http = require("http")
const createMemoryStore = require("memorystore")
const fs = require("fs").promises
const path = require("path")
const socket = require("socket.io")

const MemoryStore = createMemoryStore(session);

const app = express()
const server = http.createServer(app)
const io = new socket.Server(server);

function makeServerId(length = 4) {
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

(() => { //express config
    app.get("/robots.txt", (req, res) => {
        res.sendFile(path.resolve("./assets/robots.txt"))
    })

    app.use(express.json())
    app.use(express.urlencoded())

    app.use(session({
        secret: "appLycee",
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            //secure: true,
            maxAge: session_length,
        },
        store: new MemoryStore({
            checkPeriod: session_length,
        })
    }))

    app.engine("hbs", hbs.express4({
        partialsDir: "./views/partials",
        defaultLayout: "./views/layouts/main.hbs",
    }))
        .set("view engine", "hbs")
        .set("views", "./views")

    hbs.registerHelper("cache_ver", () => new hbs.SafeString(`?v=${cache_ver}`))

    app.use("/assets", express.static("./assets"))

    app.get("/favicon.ico", (req, res) => {
        res.sendFile(path.resolve("./assets/img/favicon.ico"))
    })

    app.get("/", (req, res) => {
        res.render("index")
    })
})();

(() => {
    const minigames = []

    fs.readdir("./minigames")
        .then((files) => {
            files.map((file) => require(`./minigames/${file}/game.js`)).forEach((creator) => {
                let minigame = creator(io)
                minigames.push(minigame)

                app.use(`/${minigame.id}`, minigame.loadPages())
            })
        })

    io.on('connection', (socket) => {
        let { game, party } = socket.handshake.query

        let minigame = minigames.find((m) => m.id = game)

        if (minigame) {
            socket.join(game)

            let server = minigame.servers.find((s) => s.party == party)

            if (!server) {
                party = makeServerId()
                server = new minigame(party)
                minigame.servers.push(server)
                socket.emit("setParty", party)
            }

            if (server.cleanupTimeout) {
                clearTimeout(server.cleanupTimeout)
                server.cleanupTimeout = null
            }

            socket.join(party)
            server.addPlayer(socket)

            socket.on('disconnecting', () => {
                server.removePlayer(socket)
                let roomSockets = io.sockets.adapter.rooms.get(party);
                if (roomSockets && roomSockets.size === 1) {
                    server.emptied()
                    server.cleanupTimeout = setTimeout(() => {
                        minigame.servers = minigame.servers.filter((s) => s.party != party)
                        server.cleanup()
                    }, minigame.ttl)
                }
            })
        }
        else {
            console.error(`Invalid game: ${game}`)
            socket.emit("error", `Invalid game: ${game}`)
            socket.disconnect()
        }

        socket.on("error", (...args) => {
            console.error(`Error from ${socket.id}`, ...args)
            socket.disconnect()
        })
    })

    server.listen(port, () => console.log(`Site démarré à l'adresse http://localhost:${port}`))
})();