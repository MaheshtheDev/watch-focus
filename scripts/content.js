function applyFocusMode() {
  const belowVideo = document.querySelectorAll("#below, #secondary-inner");
  const focusIcon = document.getElementById("mtd-focus-icon");
  const notesContainer = document.getElementById("mtd-notes-container");

  // toggle focus mode icon
  focusIcon.src = focusIcon.src.includes("light-icon")
    ? chrome.runtime.getURL("/images/active-focus.png")
    : chrome.runtime.getURL("light-icon.png");

  for (let i = 0; i < belowVideo.length; i++) {
    // hide the belowVideo
    belowVideo[i].style.display = belowVideo[i].style.display
      ? belowVideo[i].style.display == "none"
        ? "block"
        : "none"
      : "none";

    // disable cursor for the belowVideo
    belowVideo[i].style.pointerEvents = belowVideo[i].style.pointerEvents
      ? belowVideo[i].style.pointerEvents == "none"
        ? "auto"
        : "none"
      : "none";
  }

  // add notes container
  if (!notesContainer) {
    const iframeContainer = document.createElement("div");
    iframeContainer.id = "mtd-notes-container";
    iframeContainer.style.width = "402px";
    iframeContainer.style.minWidth = "300px";
    iframeContainer.style.height = "400px";
    iframeContainer.style.zIndex = "1000";
    // check youtube theme and set background color
    iframeContainer.style.backgroundColor =
      document.documentElement.style.getPropertyValue(
        "--yt-spec-text-primary-inverse"
      );

    // Create the iframe element
    const iframe = document.createElement("iframe");
    iframe.src = chrome.runtime.getURL("html/notes.html");
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";

    // Append the iframe to the container
    iframeContainer.appendChild(iframe);

    // Append the container to the body of the document
    const secondaryDiv = document.querySelector(
      "#secondary.style-scope.ytd-watch-flexy"
    );
    secondaryDiv.appendChild(iframeContainer);
  } else {
    // remove notes container
    notesContainer.remove();
  }
}

function addFocusButton() {
  const endElement = document.getElementsByClassName("ytp-left-controls")[0];
  const focusIcon = document.getElementById("mtd-focus-icon");

  if (!focusIcon && endElement) {
    const icon = document.createElement("img");
    icon.id = "mtd-focus-icon";
    icon.title = "Watch Focus (W)";
    icon.style.width = "20px";
    icon.style.height = "20px";
    // right align
    icon.style.margin = "auto 15px auto auto";
    icon.style.float = "right";
    // hover cursor pointer
    icon.style.cursor = "pointer";
    // on hover on click
    icon.style.transition = "transform 0.2s";
    icon.src = chrome.runtime.getURL("light-icon.png");
    icon.onmouseover = () => {
      icon.style.transform = "scale(1.2)";
    };
    icon.onmouseout = () => {
      icon.style.transform = "scale(1)";
    };
    icon.onclick = () => {
      applyFocusMode();
    };

    endElement.appendChild(icon);
    addEventListeners();
  }
}

function addEventListeners() {
  // Add fullscreen change event listener
  document.addEventListener("fullscreenchange", handleFullscreenChange);

  // Add keyboard event listener
  document.addEventListener("keydown", handleKeyPress);
}

function handleFullscreenChange() {
  const focusIcon = document.getElementById("mtd-focus-icon");
  const notesContainer = document.getElementById("mtd-notes-container");

  if (document.fullscreenElement) {
    // Entered fullscreen mode
    if (focusIcon) focusIcon.style.display = "none";
    if (notesContainer) notesContainer.style.display = "none";
  } else {
    // Exited fullscreen mode
    if (focusIcon) focusIcon.style.display = "block";
    if (notesContainer) notesContainer.style.display = "block";
  }
}

function handleKeyPress(event) {
  // if the pressed key is 'W' or 'w' and not in fullscreen mode
  if (event.key.toLowerCase() === "w" && !document.fullscreenElement) {
    event.preventDefault();
    applyFocusMode();
  }
}

addFocusButton();
