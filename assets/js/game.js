let isUserChange = false
let inviteMessages = [
    "On va voir qui est le plus fort",
    "Je suis inbatable sur ce jeu",
    "Je suis prêt a parier que tu ne me battra jamais à ce jeu"
]

function saveParty() {
    let party = location.hash.substring(1)
    if (party) {
        let parties = (localStorage.getItem("parties") ?? "").split(";").filter((p, i) => p.split("|")[0] != party && (new Date() - new Date(p.split("|")[1]) < 1000 * 60 * 60) && i < 9)
        parties.unshift(party + "|" + new Date().toISOString())
        localStorage.setItem("parties", parties.join(";"))
    }
}

addEventListener("hashchange", () => {
    if (isUserChange) {
        location.reload()
    }
    else {
        isUserChange = true
        saveParty()
    }
});

saveParty()

const socket = io({
    query: {
        game: location.pathname.split("/")[1],
        party: location.hash.substring(1),
        username,
        userid,
    }
});

socket.on("setParty", (party) => {
    isUserChange = false
    location.hash = party
})

socket.on("redirect", (target) => {
    location =  new URL(target, location)
})

socket.on("error", (err) => {
    console.error(err)
})

jQuery(() => {
    $(document.body).on("click", (evt) => {
        let { target } = evt

        if (target.classList.contains("share-btn")) {
            navigator.share({
                url: location.href,
                text: inviteMessages[Math.floor(Math.random() * inviteMessages.length)],
                title: "Rejoins moi sur ce super mini-jeu !",
            })
        }
    })
})