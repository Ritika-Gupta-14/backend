const express = require('express')
const app = express()
require('dotenv').config()

const port =process.env.PORT

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/login',(req,res)=>{
    res.send("<h1> Login to continue </h1>")
})

app.get('/hehe',(req,res)=>{
    res.send("hehe lelo ")
})

app.get("/json",(req,res)=>{
    res.json({name: "Ritika",})
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})