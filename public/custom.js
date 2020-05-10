// Global variables
let client, channel, username,
    timeOutID, recorder, response,
    recordedBlob = [],
    recordedChunks;

async function generateToken(username) {
    const { token } = (await axios.get(`/token?username=${username}`)).data
    return token
}

client = new StreamChat("<STREAM_API_KEY>")

async function initializeClient() {
    const token = await generateToken(username)
    client.setUser({
        id: username,
        name: "Jon Snow", // Update this name dynamically
        image: "https://bit.ly/2u9Vc0r",
      }, token); // token generated from our Node server

    channel = client.channel('messaging', 'general-chat-channel', {
        name: "General Chat Room",
        image: "https://bit.ly/2F3KEoM",
        members: [],
        session: 8 // custom field, you can add as many as you want
    });
    
    await channel.watch();

   // New message
   channel.on("message.new", event => {
        appendMessage(event.message)
    });

    // Messages already in the room
    channel.state.messages.forEach(message => {
        appendMessage(message)
    });

    return client
}

function checkAuthState() {
    if (!user.value) {
        document.getElementById("login-block").style.display = "grid"
        document.getElementsByClassName("message-container")[0].style.display = "none";
    } else {
        document.getElementsByClassName("message-container")[0].style.display = "grid";
        document.getElementById("login-block").style.display = "none"
        username = user.value

        initializeClient() // initiaize client
    }
}

const user = document.getElementById("user-login-input")
user.addEventListener("keyup", function(event) {
    if (event.key === "Enter") {
        checkAuthState()
    }
});
checkAuthState()

function getAudioElement(src) {
    const audioElement = document.createElement("audio")
    audioElement.src = src
    audioElement.controls = true

    return audioElement
}

function appendMessage(message) {
    const messageContainer = document.getElementById("messages")
    
    // Create and append the message div
    const messageDiv = document.createElement("div")
    messageDiv.className = `message ${ message.user.id === username ? 'message-right' : 'message-left' }`

    // Create the username div
    const usernameDiv = document.createElement("div")
    usernameDiv.className = "message-username"
    usernameDiv.textContent = `${message.user.id}:`

    // Append the username div to the MessageDiv
    messageDiv.append(usernameDiv)

    let messageContent
    if (message.attachments.length) {
        // we have an attachment - audio message
        messageContent = getAudioElement(message.attachments[0].asset_url)
    } else {
        // Create the main message text div
        const messageTextDiv = document.createElement("div")
        messageTextDiv.textContent = message.text
        messageContent = messageTextDiv
    }

    // Append the username div to the MessageDiv
    messageDiv.append(messageContent)

    // Then append the messageDiv to the "messages" div
    messageContainer.appendChild(messageDiv)
}

async function sendMessage(message, attachments) {
    return await channel.sendMessage({
        text: message,
        attachments: attachments
    });
}

const inputElement = document.getElementById("message-input");
inputElement.addEventListener("keyup", function(event) {
    if (event.key === "Enter") {
        sendMessage(inputElement.value)
        inputElement.value = ""
    }
});

function startRecording(stream) {
    recorder = new MediaRecorder(stream);

    let data = [];
    recorder.ondataavailable = event => data.push(event.data);
    recorder.start();

    let stopped = new Promise((resolve, reject) => {
      recorder.onstop = resolve;
      recorder.onerror = event => reject(event.name);
    });

    return stopped.then(() => data);
}

const recording = document.getElementById("recording");
let stream
( async () => {
    stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
    })
})();

recording.addEventListener("pointerdown", async () => {
    recordedChunks = startRecording(stream)
}, false);


recording.addEventListener("pointerup",  async () => {
    // Stop the recording
    recorder.state == "recording" && recorder.stop()

    recordedChunks = await recordedChunks
    recordedBlob = new Blob(recordedChunks, {type: 'audio/ogg; codecs="opus"'});

    // Create an audio file
    var audioFile = new File([recordedBlob], "audio.ogg", {
        type: 'audio/ogg; codecs="opus"',
    });

    // Send the recorded file to Stream CDN
    response = await channel.sendFile(
        audioFile,
        'audio.ogg',
    )
   
    const attachments = [{
        type: 'file',
        thumb_url: response.file,
        asset_url: response.file,
    }]
    
    // Send the attachment to the channel
    sendMessage("", attachments)
})