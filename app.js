/* =========================================
   1. GLOBAL VARIABLES & ELEMENTS
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
  loader: document.getElementById("loader-overlay"),

  // Music Details Elements
  musicDetails: document.querySelector(".music-details"),
  closeBar: document.querySelector(".closeBar"),
  album: document.querySelector(".album"),
  searchContainer: document.querySelector(".search-container"),
};

// Icons
const playIcon = "M8 5V19L19 12L8 5Z";
const pauseIcon = "M6 4H10V20H6V4ZM14 4H18V20H14V4Z";

/* =========================================
   2. INITIALIZATION
   ========================================= */
window.addEventListener("DOMContentLoaded", () => {
  if (elements.searchResultsContainer)
    elements.searchResultsContainer.style.display = "none";
  if (elements.audio) {
    elements.audio.volume = 1;
    updateSliderBackground("#1db954");
  }
});

/* =========================================
   3. SEARCH LOGIC (iTunes API)
   ========================================= */
elements.searchInput.addEventListener("input", () => {
  const query = elements.searchInput.value.trim();
  if (!query) {
    elements.searchResultsContainer.style.display = "none";
    return;
  }
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => fetchSongs(query), 500);
});

async function fetchSongs(query) {
  try {
    if (elements.loader) elements.loader.style.display = "flex";
    elements.searchResultsContainer.style.display = "block";
    elements.searchResultsContainer.innerHTML = `<p style="padding:10px; color:white;">Searching...</p>`;

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

    songs = data.results.map((track, index) => ({
      index: index,
      title: track.trackName,
      artist: track.artistName,
      image: track.artworkUrl100
        ? track.artworkUrl100.replace("100x100bb", "600x600bb")
        : "Assets/defaultImg.png",
      url: track.previewUrl,
    }));

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
   4. PLAYER & UI LOGIC
   ========================================= */

window.playSong = function (index) {
  if (!songs[index]?.url) return;

  currentSongIndex = index;
  elements.audio.src = songs[index].url;

  elements.audio
    .play()
    .then(() => updatePlayPauseButton(true))
    .catch((err) => console.error("Playback failed:", err));

  // Update Bottom Player
  updateSongDetails(".album", index);
  // Update Sidebar Player
  updateSongDetails(".album1", index);

  // Update the Right Slide-out Menu (Music Details)
  updateMusicDetails(
    songs[index].image,
    songs[index].title,
    songs[index].artist
  );

  elements.searchResultsContainer.style.display = "none";
  elements.searchInput.value = "";
};

// --- THIS IS THE KEY FUNCTION FOR YOUR REQUEST ---
function updateMusicDetails(img, title, artist) {
  // 1. Update Background Blur
  const libOpt = document.querySelector(".music-details .lib-opt");
  if (libOpt) {
    libOpt.style.backgroundImage = `url(${img})`;
    libOpt.style.backgroundSize = "cover";
    libOpt.style.backgroundPosition = "center";
  }

  // 2. Update Header Info
  const titleEl = document.getElementById("details-title");
  const artistEl = document.getElementById("details-artist");
  if (titleEl) titleEl.textContent = title;
  if (artistEl) artistEl.textContent = artist;

  // 3. Update Header Small Image
  const smallImg = document.getElementById("current-artist-img");
  if (smallImg) smallImg.src = img;

  // 4. Update "About Artist" Large Image
  const largeImg = document.getElementById("about-artist-img");
  if (largeImg) largeImg.src = img;

  // 5. Update "About Artist" Name
  const aboutName = document.getElementById("about-artist-name");
  if (aboutName) aboutName.textContent = artist;

  // 6. Update Credits Name
  const creditName = document.getElementById("credit-artist");
  if (creditName) creditName.textContent = artist;
}

function updateSongDetails(selector, index) {
  const container = document.querySelector(selector);
  if (!container) return;

  const titleEl = container.querySelector(".song");
  const artistEl = container.querySelector(".artist");
  const imgEl = container.querySelector("img");

  if (titleEl) titleEl.textContent = songs[index].title;
  if (artistEl) artistEl.textContent = songs[index].artist;
  if (imgEl) {
    imgEl.src = songs[index].image;
    imgEl.style.display = "block"; // Ensure it shows up
  }
}

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
   5. PROGRESS & VOLUME
   ========================================= */

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

// Audio Listeners
elements.audio.addEventListener("timeupdate", updateProgressBar);
elements.audio.addEventListener("loadedmetadata", () => {
  elements.totalTimeDisplay.textContent = formatTime(elements.audio.duration);
});
elements.audio.addEventListener("ended", nextSong);

// Controls Listeners
document.querySelector(".play-btn").addEventListener("click", togglePlay);
elements.nextSongBtn.addEventListener("click", nextSong);
elements.prevSongBtn.addEventListener("click", prevSong);

// Progress Bar Click
elements.progressBar.addEventListener("click", (e) => {
  const rect = elements.progressBar.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  elements.audio.currentTime = (clickX / rect.width) * elements.audio.duration;
  updateProgressBar();
});

// Volume
elements.volumeControl.addEventListener("input", (e) => {
  elements.audio.volume = e.target.value;
  updateSliderBackground("#1db954");
  elements.volumeIcon.classList.toggle("muted", elements.audio.volume === 0);
});

// UI Toggles
if (elements.closeBar && elements.musicDetails) {
  elements.closeBar.addEventListener("click", () => {
    elements.musicDetails.style.display = "none";
  });
}
// Open details when clicking album art in player
if (elements.album) {
  elements.album.addEventListener("click", () => {
    if (elements.musicDetails) elements.musicDetails.style.display = "block";
  });
}

// Close Search
document.addEventListener("click", (e) => {
  if (
    !elements.searchInput.contains(e.target) &&
    !elements.searchResultsContainer.contains(e.target)
  ) {
    elements.searchResultsContainer.style.display = "none";
  }
});
