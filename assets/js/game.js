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
    let chatGifs = $("#chat-gifs")
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
            chatInput.trigger("input")
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

            case "gif":
                let video = document.createElement("video")
                video.muted = true
                video.loop = true
                video.controls = false
                video.src = message

                video.play()
                messageDiv.append(video)
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

            chatHistory.css("max-height", "")
        }, 5000)

        setTimeout(() => {
            if (messageDiv.clientHeight > $(window).height() * 0.25) {
                chatHistory.css("max-height", `${messageDiv.clientHeight + 16}px`)
            }
        }, 500)

        chatHistory.scrollTop(chatHistory[0].scrollHeight)
    })

    let loading = false
    let controller = null

    function load(offset = 0) {
        if (controller && !controller.signal.aborted) controller.abort()
        controller = new AbortController()

        loading = true
        fetch(`https://api.giphy.com/v1/gifs/search?api_key=vqt2EIdJmahElquY7qTlzHzvJ5vmNEXu&q=${encodeURIComponent(chatInput.val())}&limit=15&offset=0&rating=r&lang=fr$&offset=${offset}`, {signal: controller.signal})
            .then(res => res.json())
            .then(res => {
                if (!offset) {
                    chatGifs.scrollLeft(0)
                    chatGifs.children().remove()
                }

                res.data.reduce((promise, gif) => {
                    let images = gif.images

                    let video = document.createElement("video")
                    video.muted = true
                    video.controls = false
                    video.crossOrigin = ""
                    video.src = images.fixed_height.mp4

                    video.addEventListener('mouseover', () => video.play(), false)
                    video.addEventListener("click", () => {
                        socket.emit("chat", {
                            type: "gif",
                            message: images.original.mp4
                        })
                        chatInput.val("")
                        chatInput.trigger("input")
                    }, { once: true })

                    chatGifs.append(video)

                    return promise.then(() => new Promise((resolve) => {
                        if (video && video.parentElement) {
                            video.addEventListener("ended", resolve, { once: true })
                            video.play()
                        }
                        else resolve()
                    }))
                }, Promise.resolve())

                loading = false
            })
            .catch(err => {
                if (!(err instanceof Error && err.name == "AbortErr")) {
                    console.error(err)
                }
            })
    }

    chatInput.on("input", (evt) => {
        if (chatInput.val()) {
            chat.attr("data-gifs", true)

            load()
        }
        else {
            chat.removeAttr("data-gifs")
            let children = chatGifs.children()

            setTimeout(() => children.remove(), 1000)
        }
    })

    chatGifs.on("scroll", () => {
        if (chatGifs[0].scrollWidth - (chatGifs[0].scrollLeft + chatGifs[0].clientWidth) < 50 && !loading && chat.attr("data-gifs")) {
            console.log("loading more")
            load(chatGifs.children().length)
        }
    })

    document.body.style.paddingBottom = "3em"
})