const express = require('express')
const app = express()
const port = 3001

app.use(express.static((__dirname + 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

app.get('/', (req, res) => res.sendFile(__dirname + 'index.html'))

// Stream Chat server SDK
const StreamChat = require('stream-chat').StreamChat;

const serverClient = new StreamChat(
    '<STREAM_API_KEY>', 
    '<STREAM_API_SECRET>'
);

app.get('/token', (req, res) => {
    const { username } = req.query

    if (username) {
        const token = serverClient.createToken(username)
        res.status(200).json({ token, status: "sucess" })
    } else {
        res.status(401).json({ message: "invalid request", status: "error" })
    }
});

app.listen(port, () => { 
    console.log(`Example app listening at http://localhost:${port}`)
})
