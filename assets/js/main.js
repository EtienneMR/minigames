let isUserChange = false
let inviteMessages = [
    "On va voir qui est le plus fort",
    "Je suis inbatable sur ce jeu",
    "Je suis prêt a parier que tu ne me battra jamais à ce jeu"
]

addEventListener("hashchange", () => {
    if (isUserChange) {
        location.reload()
    }
    else isUserChange = true
});

let username = (() => {
    let name = localStorage.getItem("username")
    if (!name) {
        let num = String(Math.floor(Math.random()*1000))
        name = `Anonyme${"0".repeat(4-num.length)+num}`
        localStorage.setItem("username", name)
    }
    return name
})();

let userid = (() => {
    let id = localStorage.getItem("userid")
    if (!id) {
        id = String(Math.floor(Math.random()*10^6))
        localStorage.setItem("userid", id)
    }
    return id
})();

const socket = io({
    query: {
        game:       location.pathname.split("/")[1],
        party:      location.hash.substring(1),
        username    ,
        userid      ,
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