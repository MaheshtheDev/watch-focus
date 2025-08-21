function applyFocusMode() {
  console.log('applyFocusMode called'); // Debug log
  
  try {
    const belowVideo = document.querySelectorAll("#below, #secondary-inner");
    const focusIcon = document.getElementById("mtd-focus-icon");
    const notesContainer = document.getElementById("mtd-notes-container");
    const topNavBar = document.querySelector(
      "#container.style-scope.ytd-masthead"
    );

    if (!focusIcon) {
      console.error('Focus icon not found');
      return;
    }

    console.log('Current focus icon src:', focusIcon.src); // Debug log

    // toggle focus mode icon
    const isLightIcon = focusIcon.src.includes("light-icon");
    focusIcon.src = isLightIcon
      ? chrome.runtime.getURL("/images/active-focus.png")
      : chrome.runtime.getURL("light-icon.png");

    console.log('Focus icon toggled to:', isLightIcon ? 'active' : 'light'); // Debug log

    // Toggle top navigation bar
    if (topNavBar) {
      topNavBar.style.display =
        topNavBar.style.display == "none" ? "" : "none";
      console.log('Top nav bar toggled');
    }

    // Toggle below video elements
    for (let i = 0; i < belowVideo.length; i++) {
      const element = belowVideo[i];
      if (element) {
        // hide the belowVideo
        element.style.display = element.style.display
          ? element.style.display == "none"
            ? "block"
            : "none"
          : "none";

        // disable cursor for the belowVideo
        element.style.pointerEvents = element.style.pointerEvents
          ? element.style.pointerEvents == "none"
            ? "auto"
            : "none"
          : "none";
      }
    }

    console.log('Below video elements toggled, count:', belowVideo.length);

    // helper to update notes container height to match video height
    function updateNotesHeight() {
      const container = document.getElementById("mtd-notes-container");
      if (!container) return;
      const candidates = [
        document.getElementById("player-container"),
        document.querySelector("#player-container-outer"),
        document.querySelector("#player"),
        document.getElementById("movie_player"),
        document.querySelector(".html5-video-player")
      ];
      let height = 0;
      for (const el of candidates) {
        if (el && el.clientHeight) {
          height = Math.max(height, el.clientHeight);
        }
      }
      if (height > 0) {
        container.style.height = height + "px";
        console.log('Notes height updated to:', height);
      }
    }

    // add or toggle notes container
    if (!notesContainer) {
      const iframeContainer = document.createElement("div");
      iframeContainer.id = "mtd-notes-container";
      iframeContainer.style.width = "350px";
      iframeContainer.style.minWidth = "300px";
      iframeContainer.style.height = "400px";
      iframeContainer.style.zIndex = "1000";
      iframeContainer.style.overflow = "hidden";
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
      if (secondaryDiv) {
        secondaryDiv.appendChild(iframeContainer);
        console.log('Notes container added');
      } else {
        console.error('Secondary div not found for notes container');
      }

      // initial sizing and on resize
      updateNotesHeight();
      window.addEventListener("resize", updateNotesHeight);
    } else {
      // toggle visibility instead of removing to preserve state
      const willShow = notesContainer.style.display === "none";
      notesContainer.style.display = willShow ? "block" : "none";
      if (willShow) {
        updateNotesHeight();
      }
      console.log('Notes container toggled, will show:', willShow);
    }
    
    console.log('applyFocusMode completed successfully');
  } catch (error) {
    console.error('Error in applyFocusMode:', error);
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
    icon.style.zIndex = "9999";
    icon.style.position = "relative";
    icon.src = chrome.runtime.getURL("light-icon.png");
    
    // Use addEventListener instead of onclick for better reliability
    icon.addEventListener('mouseover', () => {
      icon.style.transform = "scale(1.2)";
    });
    
    icon.addEventListener('mouseout', () => {
      icon.style.transform = "scale(1)";
    });
    
    icon.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Watch Focus button clicked'); // Debug log
      applyFocusMode();
    });
    
    // Also add mousedown for better touch/click detection
    icon.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    endElement.appendChild(icon);
    addEventListeners();
    
    // Debug: log when button is added
    console.log('Watch Focus button added successfully');
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
  const activeElement = document.activeElement;

  const isTyping =
    activeElement.tagName === "INPUT" || activeElement.isContentEditable;

  if (
    event.key.toLowerCase() === "w" &&
    !document.fullscreenElement &&
    !isTyping
  ) {
    applyFocusMode();
  }
}

addFocusButton();
