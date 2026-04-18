document.addEventListener("DOMContentLoaded", () => {

  const chatForm = document.getElementById("chat-form");
  const userInput = document.getElementById("user-input");
  const chatWindow = document.getElementById("chat-window");
  const messagesContainer = document.getElementById("messages-container");
  const welcomeSection = document.getElementById("welcome-section");
  const typingIndicator = document.getElementById("typing-indicator");
  const clearBtn = document.getElementById("clear-chat");
  const promptBtns = document.querySelectorAll(".prompt-btn");
  const imageUpload = document.getElementById("image-upload");
  const imagePreviewArea = document.getElementById("image-preview-area");
  const previewImg = document.getElementById("preview-img");
  const removePreviewBtn = document.getElementById("remove-preview");

  let stagedImage = null;

  // ── ADD MESSAGE ─────────────────────────────
  const addMessage = (text, sender, imageUrl = null) => {
    if (!welcomeSection.classList.contains("hidden")) {
      welcomeSection.classList.add("hidden");
    }

    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message", sender);

    if (imageUrl) {
      const img = document.createElement("img");
      img.src = imageUrl;
      msgDiv.appendChild(img);
    }

    if (text) {
      const textDiv = document.createElement("div");
      textDiv.classList.add(imageUrl ? "caption" : "text");
      textDiv.innerText = text;
      msgDiv.appendChild(textDiv);
    }

    messagesContainer.appendChild(msgDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  };

  // ── IMAGE HANDLING ─────────────────────────
  const stageImage = (dataUrl) => {
    stagedImage = dataUrl;
    previewImg.src = dataUrl;
    imagePreviewArea.classList.remove("hidden");
  };

  const clearStagedImage = () => {
    stagedImage = null;
    previewImg.src = "";
    imagePreviewArea.classList.add("hidden");
    imageUpload.value = "";
  };

  removePreviewBtn.addEventListener("click", clearStagedImage);

  imageUpload.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => stageImage(event.target.result);
      reader.readAsDataURL(file);
    }
  });

  // Paste image support
  userInput.addEventListener("paste", (e) => {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;

    for (let index in items) {
      const item = items[index];

      if (item.kind === "file" && item.type.startsWith("image/")) {
        const blob = item.getAsFile();
        const reader = new FileReader();
        reader.onload = (event) => stageImage(event.target.result);
        reader.readAsDataURL(blob);
      }
    }
  });

  // ── SEND MESSAGE ───────────────────────────
  const sendMessage = async (text) => {
    if (!text.trim() && !stagedImage) return;

    const currentImage = stagedImage;
    const currentText = text.trim();

    addMessage(currentText, "user", currentImage);

    userInput.value = "";
    clearStagedImage();

    typingIndicator.classList.remove("hidden");

    try {
      const queryText = currentText || "Image uploaded";

      const response = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: queryText }),
      });

      const data = await response.json();

      setTimeout(() => {
        typingIndicator.classList.add("hidden");
        addMessage(data.response, "bot");
      }, 800);

    } catch (error) {
      typingIndicator.classList.add("hidden");
      addMessage("Server connection error!", "bot");
    }
  };

  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    sendMessage(userInput.value);
  });

  promptBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      sendMessage(btn.getAttribute("data-text"));
    });
  });

  // ── CLEAR CHAT ─────────────────────────────
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (confirm("Clear chat?")) {
        messagesContainer.innerHTML = "";
        welcomeSection.classList.remove("hidden");
        userInput.value = "";
        clearStagedImage();
      }
    });
  }

  userInput.focus();
});
