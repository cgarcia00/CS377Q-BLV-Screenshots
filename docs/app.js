document.addEventListener("DOMContentLoaded", function () {
  const uploadInput = document.getElementById("uploadInput");
  const imageResult = document.getElementById("imageResult");
  const redactOptions = document.getElementById("redactOptions");
  const redactButton = document.getElementById("redactButton");
  const windowOptions = document.getElementById("windowOptions");
  const cropButton = document.getElementById("cropButton");
  const chatLog = document.getElementById("chatLog");
  const userInput = document.getElementById("userInput");
  const sendButton = document.getElementById("sendButton");
  const downloadZipButton = document.getElementById("downloadZipButton");

  let selectedRedactOption = "none";
  let selectedWindow = null;
  let imageFile = null;

  redactOptions.addEventListener("change", function (event) {
    selectedRedactOption = event.target.value;
    console.log("Selected Redact Option:", selectedRedactOption);
  });

  windowOptions.addEventListener("change", function (event) {
    selectedWindow = event.target.value;
    console.log("Selected Window:", selectedWindow);
  });

  uploadInput.addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
      imageFile = file;
      displayImage(URL.createObjectURL(file));
      identifyWindows(file);
      showTools(); // Show the hidden elements after image upload
    }
  });

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

      windowOptions.innerHTML = '<option value="none">None</option>';
      selectedWindow = null;
      cropButton.disabled = true;
    } catch (error) {
      console.error("Error cropping image:", error);
      imageResult.textContent = "Error cropping image. Please try again.";
    }
  });

  sendButton.addEventListener("click", async function () {
    const userMessage = userInput.value.trim();
    if (!userMessage || !imageFile) {
      alert("Please enter a message and ensure an image is available.");
      return;
    }

    const userMessageDiv = document.createElement("div");
    userMessageDiv.textContent = `User: ${userMessage}`;
    userMessageDiv.tabIndex = 0;
    chatLog.insertBefore(userMessageDiv, chatLog.firstChild);

    userInput.value = "";

    const formData = new FormData();
    formData.append("message", userMessage);
    formData.append("image", imageFile);

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
        botMessageDiv.tabIndex = 0;
        chatLog.insertBefore(botMessageDiv, chatLog.firstChild);
        notifyNewMessage();
      } else {
        throw new Error("API response does not contain message.");
      }
    } catch (error) {
      console.error("Error calling chat API:", error);
      const errorMessageDiv = document.createElement("div");
      errorMessageDiv.textContent = "Error calling chat API. Please try again.";
      errorMessageDiv.tabIndex = 0;
      chatLog.insertBefore(errorMessageDiv, chatLog.firstChild);
    }
  });

  downloadZipButton.addEventListener("click", async function () {
    if (!imageFile) {
      alert("Please upload an image or capture a screenshot first.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("image", imageFile);

      const response = await fetch(
        "https://cs377q-fvmxgzmagq-wl.a.run.app/filename",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      const filename = data.filename;
      const altText = document.getElementById("currentImage").alt;

      createAndDownloadZip(filename, imageFile, altText);
    } catch (error) {
      console.error("Error fetching filename:", error);
    }
  });

  function displayImage(src) {
    const img = document.createElement("img");
    img.src = src;
    img.alt = "Loading image description...";
    img.id = "currentImage";
    img.tabIndex = 0; // Make the image focusable
    imageResult.innerHTML = "";
    imageResult.appendChild(img);

    cropButton.disabled = false;

    updateAltText(imageFile);
  }

  async function updateAltText(imageFile) {
    const formData = new FormData();
    formData.append("image", imageFile);

    try {
      const response = await fetch(
        "https://cs377q-fvmxgzmagq-wl.a.run.app/alt",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      const altText = data.alt;

      const img = document.getElementById("currentImage");
      if (img) {
        img.alt = altText;
      }
    } catch (error) {
      console.error("Error updating alt text:", error);
    }
  }

  function readAltText(altText) {
    const utterance = new SpeechSynthesisUtterance(altText);
    window.speechSynthesis.speak(utterance);
  }

  async function identifyWindows(imageFile) {
    const formData = new FormData();
    formData.append("image", imageFile);

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
        windowOptions.innerHTML = '<option value="none">None</option>';
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

  async function createAndDownloadZip(filename, imageFile, altText) {
    const zip = new JSZip();
    zip.file(`${filename}.txt`, altText);
    zip.file(`${filename}.png`, await imageFile.arrayBuffer());

    zip.generateAsync({ type: "blob" }).then((content) => {
      const a = document.createElement("a");
      const url = URL.createObjectURL(content);
      a.href = url;
      a.download = `${filename}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  }

  function notifyNewMessage() {
    const liveRegion = document.createElement("div");
    liveRegion.setAttribute("aria-live", "assertive");
    liveRegion.setAttribute("role", "alert");
    liveRegion.classList.add("sr-only");
    liveRegion.innerText = "New message received.";
    document.body.appendChild(liveRegion);

    setTimeout(() => {
      document.body.removeChild(liveRegion);
    }, 1000);
  }

  function showTools() {
    document.getElementById("mainContent").style.display = "flex";
    document.getElementById("redactTool").style.display = "flex";
    document.getElementById("cropTool").style.display = "flex";
    document.getElementById("line").style.display = "block";
    document.getElementById("downloadZipButton").style.display = "block";
    document.getElementById("downloadZipButton").style.height = "1%";
  }
});
