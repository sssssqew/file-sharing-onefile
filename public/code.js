(function(){
  let receiverID
  const socket = io()

  function generateID(){
    return `${Math.trunc(Math.random()*999)}-${Math.trunc(Math.random()*999)}-${Math.trunc(Math.random()*999)}`
  }
  document.querySelector('#sender-start-con-btn').addEventListener('click', function(){
    let joinID = generateID()
    document.querySelector('#join-id').innerHTML = `
      <b>Room ID</b>
      <span>${joinID}</span>
    `
    socket.emit('sender-join', { // 단계 1
      uid: joinID
    })
  })
  socket.on('init', function(uid){ // 단계 3
    console.log("Receiver ID: ", uid)
    receiverID = uid
    document.querySelector('.join-screen').classList.remove('active')
    document.querySelector('.fs-screen').classList.add('active')
  })
  document.querySelector('#file-input').addEventListener('change', function(e){
    let file = e.target.files[0]
    if(!file) return 
    let reader = new FileReader()
    reader.onload = function(e){
      let buffer = new Uint8Array(reader.result) // 0~255 숫자의 배열요소로 이루어진 배열
      console.log(buffer)

      let el = document.createElement('div')
      el.classList.add('item')
      el.innerHTML = `
        <div class="progress">0%</div>
        <div class="filename">${file.name}</div>
      `
      document.querySelector('.files-list').appendChild(el)
      
      shareFile({
        filename: file.name,
        total_buffer_size: buffer.length,
        buffer_size: 1024
      }, buffer, el.querySelector('.progress'))
    }
    reader.readAsArrayBuffer(file)
  })
  function shareFile(metadata, buffer, progress_node){
    console.log('업로드 완료', metadata)
    socket.emit('file-meta', { // 수신자에게 파일 메타데이터 전송 // 단계 4
      uid: receiverID,
      metadata: metadata,
    })
    // 단계 7, 단계 9
    socket.on('fs-share', function(){ // 수신자로부터 파일정보(chunk)를 보내줄것을 요청받음 - 수신자가 요청할때마다 chunk 를 계속 반복적으로 전달함
      let chunk = buffer.slice(0, metadata.buffer_size) // 파일에서 1024 바이트씩 끊어서 추출함
      console.log(metadata.filename, ': ', chunk)
      buffer = buffer.slice(metadata.buffer_size, buffer.length) // 파일에서 1024 바이트 시작점에서 끝가지 추출함
      const progress = Math.trunc((metadata.total_buffer_size - buffer.length) / metadata.total_buffer_size * 100)
      progress_node.innerText = progress + '%' // 현재진행률
      // console.log('전송 진행률: ', progress)
      if(chunk.length != 0){
        socket.emit('file-raw', { // 수신자에게 chunk 전달 // 단계 8, 단계 10
          uid: receiverID,
          buffer: chunk
        })
      }
    })
  }
})()