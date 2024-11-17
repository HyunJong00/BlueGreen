// client.js

// WebSocket 서버 연결을 먼저 설정합니다.
const signalingServer = new WebSocket("ws://localhost:3000");

// WebSocket 연결이 열리면
signalingServer.onopen = () => {
  console.log("WebSocket 서버에 연결되었습니다.");
};

// WebSocket 메시지 수신 처리
signalingServer.onmessage = async (message) => {
  // 메시지가 Blob 객체인 경우 처리
  if (message.data instanceof Blob) {
    const text = await message.data.text();  // Blob을 텍스트로 변환
    const data = JSON.parse(text);  // 텍스트를 JSON으로 파싱

    console.log("Signaling 메시지 수신:", data);

    if (data.offer) {
      console.log("Offer 수신");
      await handleOffer(data.offer);
    } else if (data.answer) {
      console.log("Answer 수신");
      await handleAnswer(data.answer);
    } else if (data.candidate) {
      console.log("ICE Candidate 수신:", data.candidate);
      await handleCandidate(data.candidate);
    }
  } else {
    // 일반적인 JSON 데이터 처리
    const data = JSON.parse(message.data);  // 메시지가 JSON 형식일 경우
    console.log("Signaling 메시지 수신:", data);

    if (data.offer) {
      console.log("Offer 수신");
      await handleOffer(data.offer);
    } else if (data.answer) {
      console.log("Answer 수신");
      await handleAnswer(data.answer);
    } else if (data.candidate) {
      console.log("ICE Candidate 수신:", data.candidate);
      await handleCandidate(data.candidate);
    }
  }
};

// 로컬 비디오와 원격 비디오 요소를 가져옵니다.
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

let localStream;
let peerConnection;

// 1. 로컬 비디오 스트림을 가져옵니다.
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    localVideo.srcObject = stream;
    localStream = stream;
    startCall();  // 스트림이 준비되면 영상 통화를 시작
  })
  .catch(error => console.error("Error accessing media devices.", error));

// 2. 영상 통화를 시작하는 함수
async function startCall() {
  peerConnection = new RTCPeerConnection({
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" }  // STUN 서버 사용
    ]
  });

  // 로컬 스트림의 각 트랙을 peerConnection에 추가
  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  // ICE Candidate가 발견되면 서버로 전송
  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      signalingServer.send(JSON.stringify({ candidate: event.candidate }));
    }
  };

  // 원격 스트림을 remoteVideo에 표시
  peerConnection.ontrack = event => {
    if (!remoteVideo.srcObject) {
      remoteVideo.srcObject = event.streams[0];
    }
  };

  // Offer 생성 후 서버로 전송
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  signalingServer.send(JSON.stringify({ offer }));
}

// 3. Offer를 처리하는 함수
async function handleOffer(offer) {
  peerConnection = new RTCPeerConnection({
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" }
    ]
  });

  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      signalingServer.send(JSON.stringify({ candidate: event.candidate }));
    }
  };

  peerConnection.ontrack = event => {
    if (!remoteVideo.srcObject) {
      remoteVideo.srcObject = event.streams[0];
    }
  };

  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  signalingServer.send(JSON.stringify({ answer }));
}

// 4. Answer를 처리하는 함수
async function handleAnswer(answer) {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
}

// 5. ICE Candidate를 처리하는 함수
async function handleCandidate(candidate) {
  await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
}
