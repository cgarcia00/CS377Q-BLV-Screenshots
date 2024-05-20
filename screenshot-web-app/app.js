document.addEventListener("DOMContentLoaded", function () {
  const captureButton = document.getElementById("captureButton");
  const screenshotResult = document.getElementById("screenshotResult");
  const uploadInput = document.getElementById("uploadInput");
  const imageResult = document.getElementById("imageResult");

  captureButton.addEventListener("click", async function () {
    try {
      // Request screen capture
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" },
      });

      // Create a video element to capture the stream
      const video = document.createElement("video");
      video.srcObject = stream;
      video.onloadedmetadata = function () {
        video.play();

        video.addEventListener("playing", () => {
          // Wait for a short period to allow screen selection
          setTimeout(() => {
            // Create a canvas to draw the video frame
            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext("2d");
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Stop the video stream
            stream.getTracks().forEach((track) => track.stop());

            // Get the screenshot as a data URL
            const dataURL = canvas.toDataURL();

            // Create an image element to display the screenshot
            const img = document.createElement("img");
            img.src = dataURL;
            img.alt = "Screenshot of the entire screen";

            // Clear previous result and append the new screenshot
            screenshotResult.innerHTML = "";
            screenshotResult.appendChild(img);
          }, 1000); // Adjust the delay as needed
        });
      };
    } catch (error) {
      console.error("Error capturing screen:", error);
      screenshotResult.textContent =
        "Error capturing screen. Please try again.";
    }
  });

  uploadInput.addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const img = document.createElement("img");
        img.src = e.target.result;
        img.alt = "Uploaded image";

        // Clear previous result and append the new image
        imageResult.innerHTML = "";
        imageResult.appendChild(img);
      };
      reader.readAsDataURL(file);
    }
  });
});
