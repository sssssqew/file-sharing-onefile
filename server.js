const express = require('express')
const app = express()
const http = require('http')
const path = require('path')

const server = http.createServer(app)
const { Server } = require("socket.io")
const io = new Server(server)

app.use(express.static(path.join(__dirname+'/public')))

io.on('connection', function(socket){
  socket.on('sender-join', function(data){
    socket.join(data.uid) // sender ID 등록
    console.log("sender: ", socket.rooms)
  })
  socket.on('receiver-join', function(data){
    socket.join(data.uid) // receiver ID 등록
    console.log("receiver: ", socket.rooms)
    socket.to(data.sender_uid).emit('init', data.uid)
  })
  socket.on('file-meta', function(data){
    console.log('data: ', data)
    socket.to(data.uid).emit('fs-meta', data.metadata) // data.uid : 수신자 ID / 수신자에게 메타데이터 전송
  })
  socket.on('fs-start', function(data){ // 수신자로부터 다음 chunk 를 보내줄것을 송신자에게 요청
    socket.to(data.uid).emit('fs-share', {}) // data.uid : 송신자 ID 
  })
  socket.on('file-raw', function(data){
    socket.to(data.uid).emit('fs-share', data.buffer) // data.uid : 수신자 ID / 수신자에게 파일 청크(1024바이트) 전송
  })
})

server.listen(5000)
