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
    location = new URL(target, location)
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

    let chat = $("#chat")
    let chatHistory = $("#chat-history")
    let chatForm = $("#chat-form")
    let chatInput = $("#chat-input")
    let chatSend = $("#chat-send")

    chatSend.on("click", () => chatForm.trigger("submit"))
    chatForm.on("submit", (evt) => {
        evt.preventDefault()
        let input = chatInput.val()

        if (input) {
            socket.emit("chat", {
                type: "text",
                message: input
            })
    
            chatInput.val("")
        }
    })

    socket.on("chat", ({ type, message, sender }) => {
        let messageDiv = document.createElement("div")
        messageDiv.classList.add("bubble")

        let senderH3 = document.createElement("h3")
        senderH3.innerText = sender
        messageDiv.append(senderH3)

        switch (type) {
            case "text":
                let messageP = document.createElement("p")
                messageP.innerText = message
                messageDiv.append(messageP)
                break;

            default:
                console.error("Err: unknown type", type)
                break;
        }

        chatHistory.append(messageDiv)

        if (chatHistory.children().length > 10) {
            chatHistory.children()[0].remove()
        }

        chat.attr("data-show", (chat.attr("data-show") ?? null) - (-1))

        setTimeout(() => {
            let target = (chat.attr("data-show") ?? null) - 1
            if (target > 0) {
                chat.attr("data-show", target)
            }
            else {
                chat.removeAttr("data-show")
            }
        }, 5000)
    })

    document.body.style.paddingBottom = "3em"
})