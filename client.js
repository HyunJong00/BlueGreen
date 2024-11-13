const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

let localStream;
let peerConnection;

// 실행 전에 IP 확인 후 변경
const signalingServer = new WebSocket("ws://localhost:3000");

signalingServer.onmessage = async (message) => {
  const data = JSON.parse(message.data);

  if (data.offer) {
    await handleOffer(data.offer);
  } else if (data.answer) {
    await handleAnswer(data.answer);
  } else if (data.candidate) {
    await handleCandidate(data.candidate);
  }
};

// 1. Obtain local video and audio stream
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    localVideo.srcObject = stream;
    localStream = stream;
  })
  .then(() => startCall())
  .catch(error => console.error("Error accessing media devices.", error));

// 2. Function to initiate a video call
async function startCall() {
  peerConnection = new RTCPeerConnection({
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" } // Free STUN server
    ]
  });

  // Add each track of the local stream to peerConnection
  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  // When an ICE candidate is found, send it to the server
  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      signalingServer.send(JSON.stringify({ candidate: event.candidate }));
    }
  };

  // Add the remote stream to the video element
  peerConnection.ontrack = event => {
    if (!remoteVideo.srcObject) {
      remoteVideo.srcObject = event.streams[0];
    }
  };

  // Create and send an offer to the server
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  signalingServer.send(JSON.stringify({ offer }));
}

// 3. Handle the offer from the other party and create an answer
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

// 4. Process the answer from the other party
async function handleAnswer(answer) {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
}

// 5. Handle ICE candidate from the other party
async function handleCandidate(candidate) {
  await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
}
