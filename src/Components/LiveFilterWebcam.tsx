import { useRef, useState, useEffect } from "react";

const LiveFilterWebcam = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [filter, setFilter] = useState("none");
  const [text, setText] = useState("");
  const [stickers, setStickers] = useState([]);
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);

  const startWebcam = () => {
    // Access webcam
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        videoStreamRef.current = stream;

        // Prepare MediaRecorder if webcam is available
        if (stream) {
          const recorder = new MediaRecorder(stream);
          mediaRecorderRef.current = recorder;
          const chunks: Blob[] = [];
          recorder.ondataavailable = (e) => chunks.push(e.data);
          recorder.onstop = () => {
            const recordedVideo = new Blob(chunks, { type: "video/webm" });
            setRecordedBlob(recordedVideo);
          };
        }
      })
      .catch((err) => console.error("Error accessing webcam:", err));
  };

  const stopWebcam = () => {
    const stream = videoStreamRef.current;
    if (stream) {
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
    }
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const startRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.start();
      setRecording(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  // Function to update the canvas with live video feed, filter, text, and stickers
  const updateCanvas = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (video && canvas && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Apply filter before drawing
      ctx.filter = filter;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Draw text
      ctx.font = "30px Arial";
      ctx.fillStyle = "white";
      ctx.fillText(text, 50, 50); // Position text on canvas

      // Draw stickers
      stickers.forEach((sticker) => {
        ctx.drawImage(sticker.img, sticker.x, sticker.y, 50, 50); // Sticker size of 50x50
      });
    }
  };

  // Update canvas on every frame
  useEffect(() => {
    const interval = setInterval(() => {
      updateCanvas();
    }, 1000 / 30); // 30 FPS

    return () => clearInterval(interval);
  }, [filter, text, stickers]);

  const captureImage = () => {
    updateCanvas();
    canvasRef.current?.toDataURL("image/png");
  };

  const addSticker = (stickerUrl: string) => {
    const img = new Image();
    img.src = stickerUrl;
    img.onload = () => setStickers([...stickers, { img, x: 100, y: 100 }]);
  };

  return (
    <div className="flex flex-col items-center">
      <button onClick={startWebcam}>Start Webcam</button>
      <button onClick={stopWebcam}>Stop Webcam</button>
      <input
        type="text"
        placeholder="Enter text"
        onChange={(e) => setText(e.target.value)}
        className="border p-2"
      />
      {/* Webcam Feed */}
      <video
        ref={videoRef}
        autoPlay
        className="border-2 rounded-lg"
        style={{ filter, width: "500px", height: "auto" }}
      />

      {/* Canvas for capturing */}
      <canvas
        ref={canvasRef}
        // style={{ display: "none" }}
      />

      {/* Filter Selection */}
      <div className="flex gap-4 mt-4">
        <button onClick={() => setFilter("none")}>None</button>
        <button onClick={() => setFilter("grayscale(100%)")}>Grayscale</button>
        <button onClick={() => setFilter("sepia(100%)")}>Sepia</button>
        <button onClick={() => setFilter("blur(5px)")}>Blur</button>
        <button onClick={() => setFilter("invert(100%)")}>Invert</button>
        <button onClick={() => setFilter("brightness(1.5)")}>Brightness</button>
        <button onClick={() => setFilter("contrast(1.5)")}>Contrast</button>
        <button onClick={() => setFilter("hue-rotate(90deg)")}>
          Hue Rotate
        </button>
        <button onClick={() => setFilter("saturate(1.5)")}>Saturate</button>
        <button onClick={() => setFilter("opacity(0.5)")}>Opacity</button>
        <button
          onClick={() =>
            setFilter("drop-shadow(10px 10px 10px rgba(0, 0, 0, 0.5))")
          }
        >
          Drop Shadow
        </button>
      </div>

      {/* Capture Button */}
      <button
        onClick={captureImage}
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
      >
        Capture
      </button>

      <div className="flex gap-2 mt-4">
        <button onClick={() => addSticker("/stickers/sticker1.png")}>
          Add Sticker 1
        </button>
        <button onClick={() => addSticker("/stickers/sticker2.png")}>
          Add Sticker 2
        </button>
      </div>

      {/* Recording Controls */}
      <div className="flex gap-4 mt-4">
        <button
          onClick={startRecording}
          disabled={recording}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Start Recording
        </button>
        <button
          onClick={stopRecording}
          disabled={!recording}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Stop Recording
        </button>
      </div>

      {/* Video Download */}
      {recordedBlob && (
        <a
          href={URL.createObjectURL(recordedBlob)}
          download="recorded-video.webm"
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
        >
          Download Video
        </a>
      )}
    </div>
  );
};

export default LiveFilterWebcam;
