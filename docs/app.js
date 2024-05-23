document.addEventListener("DOMContentLoaded", function () {
  const captureButton = document.getElementById("captureButton");
  const uploadInput = document.getElementById("uploadInput");
  const imageResult = document.getElementById("imageResult");
  const redactOptions = document.getElementById("redactOptions");
  const redactButton = document.getElementById("redactButton");
  const windowOptions = document.getElementById("windowOptions");
  const cropButton = document.getElementById("cropButton");
  const chatLog = document.getElementById("chatLog");
  const userInput = document.getElementById("userInput");
  const sendButton = document.getElementById("sendButton");

  let selectedRedactOption = "none";
  let selectedWindow = null;
  let imageFile = null;

  // Listener for selecting redaction option
  redactOptions.addEventListener("change", function (event) {
    selectedRedactOption = event.target.value;
    console.log("Selected Redact Option:", selectedRedactOption);
  });

  // Listener for selection window
  windowOptions.addEventListener("change", function (event) {
    selectedWindow = event.target.value;
    console.log("Selected Window:", selectedWindow);
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
              identifyWindows(imageFile); // Call to identify windows in the image
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
      identifyWindows(file); // Call to identify windows in the image
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
      const response = await fetch(
        "https://cs377q-fvmxgzmagq-wl.a.run.app/redact",
        {
          method: "POST",
          body: formData,
        }
      );

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

  // Crop button listener
  cropButton.addEventListener("click", async function () {
    if (!selectedWindow || !imageFile) {
      alert(
        "Please upload an image or capture a screenshot and select a window to crop."
      );
      return;
    }

    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("window", selectedWindow);

    // API call to backend for cropping
    try {
      const response = await fetch(
        "https://cs377q-fvmxgzmagq-wl.a.run.app/crop_window",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      imageFile = new File([blob], "cropped.png", { type: "image/png" });

      displayImage(url);

      // Clear the window options and disable the crop button
      windowOptions.innerHTML = '<option value="none">None</option>';
      selectedWindow = null;
      cropButton.disabled = true;
    } catch (error) {
      console.error("Error cropping image:", error);
      imageResult.textContent = "Error cropping image. Please try again.";
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
      const response = await fetch(
        "https://cs377q-fvmxgzmagq-wl.a.run.app/chat",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();
      console.log("API response:", data);

      if (data.message) {
        const botMessage = data.message;
        const botMessageDiv = document.createElement("div");
        botMessageDiv.innerHTML = marked.parse(botMessage);
        chatLog.appendChild(botMessageDiv);
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

  // Function for displaying images
  function displayImage(src) {
    const img = document.createElement("img");
    img.src = src;
    img.alt = "Displayed image";
    imageResult.innerHTML = "";
    imageResult.appendChild(img);

    // Enable the crop button when an image is displayed
    cropButton.disabled = false;
  }

  // Listener for identifying windows
  async function identifyWindows(imageFile) {
    const formData = new FormData();
    formData.append("image", imageFile);

    // API call for identifying windows
    try {
      const response = await fetch(
        "https://cs377q-fvmxgzmagq-wl.a.run.app/identify_windows",
        {
          method: "POST",
          body: formData,
        }
      );

      let data = await response.json();
      data = JSON.parse(data);
      console.log("Identify Windows response:", data);

      if (data.windows) {
        windowOptions.innerHTML = '<option value="none">None</option>'; // Clear existing options and add default
        data.windows.forEach((window, index) => {
          const option = document.createElement("option");
          option.value = window;
          option.textContent = window;
          windowOptions.appendChild(option);
        });
      } else {
        throw new Error("API response does not contain windows.");
      }
    } catch (error) {
      console.error("Error identifying windows:", error);
      windowOptions.innerHTML =
        "<option>Error identifying windows. Please try again.</option>";
    }
  }
});
