(function(){
  let senderID
  const socket = io()

  function generateID(){
    return `${Math.trunc(Math.random()*999)}-${Math.trunc(Math.random()*999)}-${Math.trunc(Math.random()*999)}`
  }
  document.querySelector('#receiver-start-con-btn').addEventListener('click', function(){
    senderID = document.querySelector('#join-id').value
    if(senderID.length === 0) return 

    let joinID = generateID() 
    socket.emit('receiver-join', { // 단계 2
      uid: joinID,
      sender_uid: senderID
    })
    document.querySelector('.join-screen').classList.remove('active')
    document.querySelector('.fs-screen').classList.add('active')
  })

  let fileshare = {}
  socket.on('fs-meta', function(metadata){ // 송신자로부터 전달받은 메타데이터 // 단계 5
    console.log('전달받은 파일 메타데이터', metadata)
    fileshare.metadata = metadata
    fileshare.transmited = 0
    fileshare.buffer = []

    let el = document.createElement('div')
    el.classList.add('item')
    el.innerHTML = `
      <div class="progress">0%</div>
      <div class="filename">${metadata.filename}</div>
    `
    document.querySelector('.files-list').appendChild(el)
    fileshare.progress_node = el.querySelector('.progress')

    socket.emit('fs-start', { // 송신자에게 실제 파일데이터를 보내달라고 요청함 // 단계 6
      uid: senderID
    })
  })
  // fileshare.buffer 와 buffer 는 모두 배열임 (즉 push 하면 2차원 배열) - new Blob(fileshare.buffer) 는 배열을 이어붙여 1차원 배열(원본 파일데이터)로 만들어줌
  socket.on('fs-share', function(buffer){ // 송신자로부터 파일 청크(chunk) - 1024바이트를 전달받음
    fileshare.buffer.push(buffer) // buffer : sender 가 보낸 chunk
    fileshare.transmited += buffer.byteLength 
    fileshare.progress_node.innerText = Math.trunc(fileshare.transmited / fileshare.metadata.total_buffer_size * 100) + '%'
    
    // console.log('전달받은 실제 데이터', fileshare.buffer)
    if(fileshare.transmited == fileshare.metadata.total_buffer_size){ // 송신자로부터 수신자에게 파일 데이터 전송이 완료된 경우
      // console.log('blob 데이터: ', new Blob(fileshare.buffer))
      download(new Blob(fileshare.buffer), fileshare.metadata.filename) // 파일 다운로드 실행
      fileshare = {} // 초기화
    }else{
      socket.emit('fs-start', { // 현재 파일전송이 진행중인 경우 송신자에게 다음 chunk 를 보내달라고 요청함
        uid: senderID
      })
    }
  })
})()