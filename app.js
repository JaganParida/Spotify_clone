/* =========================================
   1. GLOBAL VARIABLES & SELECTORS
   ========================================= */
let songs = [];
let currentSongIndex = 0;
let isDragging = false;
let searchTimeout;

// Centralized access to DOM elements
const elements = {
  audio: document.getElementById("audio"),
  playPauseBtn: document.querySelector(".play-btn svg path"),
  volumeControl: document.getElementById("volume"),
  volumeIcon: document.getElementById("volume-icon"),
  currentTimeDisplay: document.getElementById("current-time"),
  totalTimeDisplay: document.getElementById("total-time"),
  searchInput: document.getElementById("search"),
  searchResultsContainer: document.getElementById("search-results"),
  songTitleDisplay: document.getElementById("title"),
  nextSongBtn: document.getElementById("nextBtn"),
  prevSongBtn: document.getElementById("prevBtn"),
  progressBar: document.getElementById("progress-bar"),
  progressFill: document.getElementById("progress-fill"),
  progressThumb: document.getElementById("progress-thumb"),
  // Optional elements (checked before use to prevent crashes)
  loader: document.getElementById("loader-overlay"),
  musicDetails: document.querySelector(".music-details"),
  closeBar: document.querySelector(".closeBar"),
  album: document.querySelector(".album"),
  searchContainer: document.querySelector(".search-container"),
};

// SVG Icons
const playIcon = "M8 5V19L19 12L8 5Z";
const pauseIcon = "M6 4H10V20H6V4ZM14 4H18V20H14V4Z";

/* =========================================
   2. INITIALIZATION
   ========================================= */

window.addEventListener("DOMContentLoaded", () => {
  // Hide search results initially
  if (elements.searchResultsContainer) {
    elements.searchResultsContainer.style.display = "none";
  }
  // Set initial volume
  if (elements.audio && elements.volumeControl) {
    elements.audio.volume = 1;
    elements.volumeControl.value = 1;
    updateSliderBackground("#1db954");
  }
});

/* =========================================
   3. SEARCH & FETCH LOGIC (iTunes API - No CORS Errors)
   ========================================= */

elements.searchInput.addEventListener("input", () => {
  const query = elements.searchInput.value.trim();

  if (!query) {
    elements.searchResultsContainer.style.display = "none";
    return;
  }

  // Debounce: Wait 500ms after typing stops before searching
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    fetchSongs(query);
  }, 500);
});

async function fetchSongs(query) {
  try {
    // Show loader
    if (elements.loader) elements.loader.style.display = "flex";

    elements.searchResultsContainer.style.display = "block";
    elements.searchResultsContainer.innerHTML = `<p style="padding:10px; color:white;">Searching...</p>`;

    // API CALL: iTunes API (Free, Stable, Works on Localhost)
    const response = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(
        query
      )}&media=music&entity=song&limit=15`
    );

    if (!response.ok) throw new Error("Network response was not ok");

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      elements.searchResultsContainer.innerHTML = `<p style="color: red; padding:10px;">No songs found</p>`;
      return;
    }

    // MAP DATA: Convert iTunes data to our App's format
    songs = data.results.map((track, index) => {
      // Get High-Res Image (Replace 100x100 with 600x600)
      const hdImage = track.artworkUrl100
        ? track.artworkUrl100.replace("100x100bb", "600x600bb")
        : "Assets/defaultImg.png";

      return {
        index: index,
        title: track.trackName,
        artist: track.artistName,
        image: hdImage,
        url: track.previewUrl, // 30-second preview
      };
    });

    displaySearchResults(songs);
  } catch (error) {
    console.error("Fetch error:", error);
    elements.searchResultsContainer.innerHTML = `<p style="color: red; padding:10px;">Connection Error.</p>`;
  } finally {
    if (elements.loader) elements.loader.style.display = "none";
  }
}

function displaySearchResults(songList) {
  elements.searchResultsContainer.innerHTML = songList
    .map(
      (song) => `
      <div class="song-item" onclick="playSong(${song.index})" style="display:flex; align-items:center; padding:8px; cursor:pointer; border-bottom:1px solid #333;">
        <img src="${song.image}" alt="${song.title}" style="width:40px; height:40px; border-radius:4px; margin-right:10px; object-fit: cover;">
        <div style="overflow:hidden;">
            <p style="margin:0; font-weight:bold; color:white; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${song.title}</p>
            <p style="margin:0; font-size:12px; color:#ccc;">${song.artist}</p>
        </div>
      </div>
    `
    )
    .join("");

  elements.searchResultsContainer.style.display = "block";
}

/* =========================================
   4. PLAYER LOGIC
   ========================================= */

// Expose playSong to window so HTML 'onclick' can find it
window.playSong = function (index) {
  if (!songs[index]?.url) return;

  currentSongIndex = index;
  elements.audio.src = songs[index].url;

  elements.audio
    .play()
    .then(() => updatePlayPauseButton(true))
    .catch((err) => console.error("Playback failed:", err));

  // Update UI with new song info
  updateSongDetails(".album", index);
  updateSongDetails(".album1", index);
  updateMusicDetails(
    songs[index].image,
    songs[index].title,
    songs[index].artist
  );

  // Hide search results
  elements.searchResultsContainer.style.display = "none";
  elements.searchInput.value = "";
};

function updatePlayPauseButton(isPlaying) {
  elements.playPauseBtn.setAttribute("d", isPlaying ? pauseIcon : playIcon);
}

function togglePlay() {
  if (elements.audio.paused) {
    elements.audio.play();
    updatePlayPauseButton(true);
  } else {
    elements.audio.pause();
    updatePlayPauseButton(false);
  }
}

function nextSong() {
  if (songs.length === 0) return;
  playSong((currentSongIndex + 1) % songs.length);
}

function prevSong() {
  if (songs.length === 0) return;
  playSong((currentSongIndex - 1 + songs.length) % songs.length);
}

/* =========================================
   5. UI HELPERS (Details, Progress, Volume)
   ========================================= */

function updateSongDetails(selector, index) {
  const container = document.querySelector(selector);
  if (!container) return;

  const titleEl = container.querySelector(".song");
  const artistEl = container.querySelector(".artist");
  const imgEl = container.querySelector("img");

  if (titleEl) titleEl.textContent = songs[index].title;
  if (artistEl) artistEl.textContent = songs[index].artist;
  if (imgEl) imgEl.src = songs[index].image;
}

function updateMusicDetails(img, title, artist) {
  const libOpt = document.querySelector(".music-details .lib-opt");
  if (libOpt) libOpt.style.backgroundImage = `url(${img})`;

  const followersTitle = document.querySelector(
    ".followers .add p:first-child"
  );
  if (followersTitle) followersTitle.textContent = title;

  const followersArtist = document.querySelector(
    ".followers .add p:last-child"
  );
  if (followersArtist) followersArtist.textContent = artist;
}

function updateProgressBar() {
  if (isDragging) return;
  const { currentTime, duration } = elements.audio;
  if (!duration) return;

  const progress = (currentTime / duration) * 100;
  elements.progressFill.style.width = `${progress}%`;
  elements.progressThumb.style.left = `${progress}%`;
  elements.currentTimeDisplay.textContent = formatTime(currentTime);
}

function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min}:${sec < 10 ? "0" : ""}${sec}`;
}

function updateSliderBackground(color) {
  const val = elements.volumeControl.value;
  const percentage = val * 100;
  elements.volumeControl.style.background = `linear-gradient(to right, ${color} ${percentage}%, #535353 ${percentage}%)`;
}

/* =========================================
   6. EVENT LISTENERS
   ========================================= */

// Audio Events
elements.audio.addEventListener("timeupdate", updateProgressBar);
elements.audio.addEventListener("loadedmetadata", () => {
  elements.totalTimeDisplay.textContent = formatTime(elements.audio.duration);
});
elements.audio.addEventListener("ended", nextSong);

// Button Events
document.querySelector(".play-btn").addEventListener("click", togglePlay);
elements.nextSongBtn.addEventListener("click", nextSong);
elements.prevSongBtn.addEventListener("click", prevSong);

// Progress Bar Dragging
elements.progressBar.addEventListener("click", (e) => {
  const rect = elements.progressBar.getBoundingClientRect();
  const width = rect.width;
  const clickX = e.clientX - rect.left;
  elements.audio.currentTime = (clickX / width) * elements.audio.duration;
  updateProgressBar();
});

// Drag Logic for Progress Bar
elements.progressThumb.addEventListener("mousedown", () => {
  isDragging = true;
  document.addEventListener("mousemove", handleProgressDrag);
  document.addEventListener("mouseup", stopDragging);
});

function handleProgressDrag(event) {
  const rect = elements.progressBar.getBoundingClientRect();
  const offsetX = event.clientX - rect.left;
  const progress = Math.max(0, Math.min(100, (offsetX / rect.width) * 100));
  elements.progressFill.style.width =
    elements.progressThumb.style.left = `${progress}%`;
}

function stopDragging(event) {
  isDragging = false;
  document.removeEventListener("mousemove", handleProgressDrag);
  document.removeEventListener("mouseup", stopDragging);
  const rect = elements.progressBar.getBoundingClientRect();
  const offsetX = event.clientX - rect.left;
  elements.audio.currentTime = (offsetX / rect.width) * elements.audio.duration;
  updateProgressBar();
}

// Volume Control
elements.volumeControl.addEventListener("input", (e) => {
  elements.audio.volume = e.target.value;
  updateSliderBackground("#1db954");

  // Icon toggle
  if (elements.audio.volume === 0) {
    elements.volumeIcon.classList.add("muted");
  } else {
    elements.volumeIcon.classList.remove("muted");
  }
});

// Click Outside Search to Close
document.addEventListener("click", (e) => {
  if (
    !elements.searchInput.contains(e.target) &&
    !elements.searchResultsContainer.contains(e.target)
  ) {
    elements.searchResultsContainer.style.display = "none";
  }
});

// Search Container Border Toggle
if (elements.searchContainer) {
  elements.searchContainer.addEventListener("click", () => {
    if (elements.searchContainer.style.border.includes("white")) {
      elements.searchContainer.style.border = "none";
    } else {
      elements.searchContainer.style.border = "3px solid white";
    }
  });
}

// Music Details Panel
if (elements.closeBar && elements.musicDetails) {
  elements.closeBar.addEventListener("click", () => {
    elements.musicDetails.style.display = "none";
  });
}
if (elements.album) {
  elements.album.addEventListener("click", () => {
    if (elements.musicDetails) elements.musicDetails.style.display = "block";
  });
}
