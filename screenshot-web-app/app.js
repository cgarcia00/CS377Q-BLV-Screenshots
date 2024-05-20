document.addEventListener("DOMContentLoaded", function () {
  const captureButton = document.getElementById("captureButton");
  const uploadInput = document.getElementById("uploadInput");
  const imageResult = document.getElementById("imageResult");
  const redactOptions = document.getElementById("redactOptions");
  const redactButton = document.getElementById("redactButton");
  const chatLog = document.getElementById("chatLog");
  const userInput = document.getElementById("userInput");
  const sendButton = document.getElementById("sendButton");

  let selectedRedactOption = "none";
  let imageFile = null;

  // Listener for selecting redaction option
  redactOptions.addEventListener("change", function (event) {
    selectedRedactOption = event.target.value;
    console.log("Selected Redact Option:", selectedRedactOption);
  });

  // Listener for screenshotting
  captureButton.addEventListener("click", async function () {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" },
      });

      const video = document.createElement("video");
      video.srcObject = stream;
      video.onloadedmetadata = function () {
        video.play();

        video.addEventListener("playing", () => {
          setTimeout(() => {
            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext("2d");
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            stream.getTracks().forEach((track) => track.stop());

            canvas.toBlob((blob) => {
              imageFile = new File([blob], "screenshot.png", {
                type: "image/png",
              });
              displayImage(URL.createObjectURL(imageFile));
            }, "image/png");
          }, 1000);
        });
      };
    } catch (error) {
      console.error("Error capturing screen:", error);
      imageResult.textContent = "Error capturing screen. Please try again.";
    }
  });

  // Listener for upload
  uploadInput.addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
      imageFile = file;
      displayImage(URL.createObjectURL(file));
    }
  });

  // Listenr for redact button
  redactButton.addEventListener("click", async function () {
    if (selectedRedactOption === "none" || !imageFile) {
      alert(
        "Please upload an image or capture a screenshot and select a redact option."
      );
      return;
    }

    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("category", selectedRedactOption);

    // API call to backend
    try {
      const response = await fetch("http://127.0.0.1:5000/redact", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      imageFile = new File([blob], "redacted.png", { type: "image/png" });

      displayImage(url);
    } catch (error) {
      console.error("Error redacting image:", error);
      imageResult.textContent = "Error redacting image. Please try again.";
    }
  });

  // Chatbot listener
  sendButton.addEventListener("click", async function () {
    const userMessage = userInput.value.trim();
    if (!userMessage || !imageFile) {
      alert("Please enter a message and ensure an image is available.");
      return;
    }

    const userMessageDiv = document.createElement("div");
    userMessageDiv.textContent = `User: ${userMessage}`;
    chatLog.appendChild(userMessageDiv);

    userInput.value = "";

    const formData = new FormData();
    formData.append("message", userMessage);
    formData.append("image", imageFile);

    // API call to backend for chat
    try {
      const response = await fetch("http://127.0.0.1:5000/chat", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      console.log("API response:", data); // Debugging log

      if (data.message) {
        const botMessage = data.message;
        const botMessageDiv = document.createElement("div");
        botMessageDiv.innerHTML = marked.parse(botMessage);
        chatLog.appendChild(botMessageDiv);

        // Use Web Speech API to read out the bot's response
        // const utterance = new SpeechSynthesisUtterance(botMessage);
        // window.speechSynthesis.speak(utterance);
      } else {
        throw new Error("API response does not contain message.");
      }
    } catch (error) {
      console.error("Error calling chat API:", error);
      const errorMessageDiv = document.createElement("div");
      errorMessageDiv.textContent = "Error calling chat API. Please try again.";
      chatLog.appendChild(errorMessageDiv);
    }
  });

  // Function to display the image
  function displayImage(src) {
    const img = document.createElement("img");
    img.src = src;
    img.alt = "Displayed image";
    imageResult.innerHTML = "";
    imageResult.appendChild(img);
  }
});
