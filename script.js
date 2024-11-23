const video = document.getElementById("video");
const goToVideoButton = document.getElementById("goToVideo");

// 모델 로드
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("/models"), // 얼굴 감지 모델
  faceapi.nets.faceLandmark68Net.loadFromUri("/models"), // 랜드마크 감지 모델
  faceapi.nets.faceRecognitionNet.loadFromUri("/models"), // 얼굴 인식 모델
  faceapi.nets.faceExpressionNet.loadFromUri("/models"), // 얼굴 표정 모델
]).then(startVideo);

// 비디오 스트림 시작 함수
function startVideo() {
  navigator.mediaDevices
    .getUserMedia({ video: true }) // 카메라 스트림 요청
    .then((stream) => {
      video.srcObject = stream; // 비디오 요소에 스트림 연결
    })
    .catch((err) => {
      console.error("카메라 접근 실패:", err);
    });
}

// 얼굴 인식 이벤트 등록
video.addEventListener("play", () => {
  // 비디오 위에 캔버스 생성
  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);

  // 비디오 크기에 캔버스 맞추기
  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  // 주기적으로 얼굴 감지
  const interval = setInterval(async () => {
    // 얼굴 감지 및 랜드마크/표정 분석
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions();

    // 얼굴 감지가 성공했을 때 버튼 활성화
    if (detections.length > 0) {
      goToVideoButton.disabled = false; // 버튼 활성화
      goToVideoButton.style.backgroundColor = "#007bff";
      goToVideoButton.style.color = "#fff";
      goToVideoButton.textContent = "영상통화 시작하기";

      //clearInterval(interval); // 반복 중지
    }

    // 캔버스를 초기화하고 감지된 얼굴 정보 다시 그리기
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    faceapi.draw.drawDetections(canvas, resizedDetections); // 얼굴 경계 상자
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections); // 얼굴 랜드마크
  }, 100);
});

// 버튼 클릭 시 페이지 이동
goToVideoButton.addEventListener("click", () => {
  window.location.href = "/webrtc"; // video.html로 이동
});
