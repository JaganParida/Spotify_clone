let input = document.querySelector("input");
let search = document.querySelector(".search");

input.addEventListener("focus", () => {
  search.style.border = "3px solid white";
});

document.body.addEventListener("click", (event) => {
  if (!search.contains(event.target)) {
    search.style.border = "none";
  }
});

function adjustVolume() {
  let volumeSlider = document.getElementById("volume");
  let progress = (volumeSlider.value / volumeSlider.max) * 100;
  volumeSlider.style.setProperty("--progress", progress + "%");
}

let progressBar = document.getElementById("progress-bar");
let progressFill = document.getElementById("progress-fill");
let progressThumb = document.getElementById("progress-thumb");
let currentTime = document.getElementById("current-time");
let totalTime = document.getElementById("total-time");

let isDragging = false;
let totalDuration = 180;

// Start dragging
progressThumb.addEventListener("mousedown", (event) => {
  isDragging = true;
  document.addEventListener("mousemove", seek);
  document.addEventListener("mouseup", stopDragging);
});

// Seek function (updates position while dragging)
function seek(event) {
  if (!isDragging) return;

  let rect = progressBar.getBoundingClientRect();
  let offsetX = event.clientX - rect.left;
  let percent = Math.max(0, Math.min(1, offsetX / rect.width));

  let currentSeconds = Math.round(percent * totalDuration);
  progressFill.style.width = percent * 100 + "%";
  progressThumb.style.left = percent * 100 + "%";
  currentTime.innerText = formatTime(currentSeconds);
}

// Stop dragging (only updates time when released)
function stopDragging() {
  isDragging = false;
  document.removeEventListener("mousemove", seek);
  document.removeEventListener("mouseup", stopDragging);
}

// Format time (mm:ss)
function formatTime(seconds) {
  let minutes = Math.floor(seconds / 60);
  let secs = seconds % 60;
  return minutes + ":" + (secs < 10 ? "0" : "") + secs;
}
