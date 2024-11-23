const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const startShareButton = document.getElementById("startShare");
const stopShareButton = document.getElementById("stopShare");

let localStream;
let screenStream; // 화면 공유 스트림
let peerConnection;

const signalingServer = new WebSocket("ws://localhost:3000");

signalingServer.onopen = () => {
  console.log("WebSocket 서버에 연결되었습니다.");
};

signalingServer.onmessage = async (message) => {
  const data = JSON.parse(message.data);
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
};

// 1. 로컬 비디오 스트림을 가져옴
navigator.mediaDevices
  .getUserMedia({ video: true, audio: true })
  .then((stream) => {
    localStream = stream;
    localVideo.srcObject = stream;
    startCall();
  })
  .catch((error) => console.error("Error accessing media devices:", error));

// 2. PeerConnection 설정
async function startCall() {
  peerConnection = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  // 로컬 스트림 트랙 추가
  localStream
    .getTracks()
    .forEach((track) => peerConnection.addTrack(track, localStream));

  // ICE Candidate 전송
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      signalingServer.send(JSON.stringify({ candidate: event.candidate }));
    }
  };

  // 원격 스트림 설정
  peerConnection.ontrack = (event) => {
    if (!remoteVideo.srcObject) {
      remoteVideo.srcObject = event.streams[0];
    }
  };

  // Offer 생성 및 전송
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  signalingServer.send(JSON.stringify({ offer }));
}

// 3. Offer 처리
async function handleOffer(offer) {
  peerConnection = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      signalingServer.send(JSON.stringify({ candidate: event.candidate }));
    }
  };

  peerConnection.ontrack = (event) => {
    if (!remoteVideo.srcObject) {
      remoteVideo.srcObject = event.streams[0];
    }
  };

  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

  localStream
    .getTracks()
    .forEach((track) => peerConnection.addTrack(track, localStream));

  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  signalingServer.send(JSON.stringify({ answer }));
}

// 4. Answer 처리
async function handleAnswer(answer) {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
}

// 5. ICE Candidate 처리
async function handleCandidate(candidate) {
  await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
}

// 6. 화면 공유 시작
startShareButton.addEventListener("click", async () => {
  try {
    // 화면 공유 스트림 가져오기
    screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: { cursor: "always" },
      audio: false,
    });

    // 화면 공유 스트림을 로컬 비디오에 표시
    localVideo.srcObject = screenStream;

    // PeerConnection에서 비디오 트랙 교체
    const screenTrack = screenStream.getVideoTracks()[0];
    const sender = peerConnection
      .getSenders()
      .find((s) => s.track.kind === "video");

    if (sender) {
      sender.replaceTrack(screenTrack); // 기존 비디오 트랙을 화면 공유 트랙으로 교체
    }

    // 화면 공유 종료 이벤트 설정
    screenTrack.onended = () => {
      stopShareButton.click(); // 화면 공유 종료 버튼 자동 클릭
    };

    stopShareButton.disabled = false;
    startShareButton.disabled = true;
    console.log("화면 공유 시작");
  } catch (error) {
    console.error("화면 공유 실패:", error);
  }
});

// 7. 화면 공유 중지
stopShareButton.addEventListener("click", () => {
  const sender = peerConnection
    .getSenders()
    .find((s) => s.track.kind === "video");

  if (sender) {
    sender.replaceTrack(localStream.getVideoTracks()[0]); // 원래 비디오 트랙 복구
  }

  // 로컬 비디오에 원래 비디오 스트림 복구
  localVideo.srcObject = localStream;

  // 화면 공유 스트림 종료
  screenStream.getTracks().forEach((track) => track.stop());
  screenStream = null;

  stopShareButton.disabled = true;
  startShareButton.disabled = false;
  console.log("화면 공유 중지");
});
