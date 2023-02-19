let isUserChange = false
let inviteMessages = [
    "On va voir qui est le plus fort",
]

addEventListener("hashchange", () => {
    if (isUserChange) {
        location.reload()
    }
    else isUserChange = true
})

const socket = io({
    query: {
        game: location.pathname.split("/")[1],
        party: location.hash.substring(1),
    }
});

socket.on("setParty", (party) => {
    isUserChange = false
    location.hash = party
})

socket.on("error", (err) => {
    console.error(err)
    if (err == "party full") {
        location.pathname = "/party-full"
    }
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