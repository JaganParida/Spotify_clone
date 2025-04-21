let songs = [];
let currentSongIndex = 0;
let isDragging = false;

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
};

// Initial volume setup

elements.audio.volume = elements.volumeControl.value = 1;

// Play and pause icons
const playIcon = "M8 5V19L19 12L8 5Z";
const pauseIcon = "M6 4H10V20H6V4ZM14 4H18V20H14V4Z";

const updatePlayPauseButton = (isPlaying) => {
  elements.playPauseBtn.setAttribute("d", isPlaying ? pauseIcon : playIcon);
};

// Fetch songs dynamically as the user types
let searchTimeout;
elements.searchInput.addEventListener("input", () => {
  const query = elements.searchInput.value.trim();
  if (!query) {
    elements.searchResultsContainer.style.display = "none";
    return;
  }

  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    fetchSongs(query);
  }, 500); // Delay search to avoid excessive API calls
});

// Fetch songs from API
async function fetchSongs(query) {
  try {
    elements.searchResultsContainer.innerHTML = `<p>Loading...</p>`;
    const response = await fetch(
      `https://saavn.dev/api/search/songs?query=${query}`
    );
    const data = await response.json();

    if (!data.data || !data.data.results.length) {
      elements.searchResultsContainer.innerHTML = `<p style="color: red;">No songs found</p>`;
      return;
    }

    songs = data.data.results.map((track, index) => ({
      index,
      title: track.name,
      artist: track.primaryArtists
        ? Array.isArray(track.primaryArtists)
          ? track.primaryArtists.map((a) => a.name).join(", ")
          : track.primaryArtists
        : "Unknown Artist",
      image: track.image?.[2]?.url || "Assets/jhol.png",
      url:
        track.downloadUrl?.[4]?.url ||
        track.downloadUrl?.[2]?.url ||
        track.downloadUrl?.[0]?.url,
    }));

    displaySearchResults(songs);
  } catch (error) {
    console.error("Error fetching songs:", error);
    elements.searchResultsContainer.innerHTML = `<p style="color: red;">Error fetching songs</p>`;
  }
}

// Display search results dynamically
function displaySearchResults(songs) {
  elements.searchResultsContainer.innerHTML = songs
    .map(
      (song) => `
    <div class="song-item" onclick="playSong(${song.index})">
      <img src="${song.image}" alt="${song.title}">
      <p>${song.title}</p>
    </div>
  `
    )
    .join("");
  elements.searchResultsContainer.style.display = "inline-flex";
}

// Play song
function playSong(index) {
  if (!songs[index]?.url) return console.error("Invalid song URL");

  currentSongIndex = index;
  elements.audio.src = songs[index].url;
  elements.audio.play();

  // Select and update the correct HTML elements
  const songTitleElement = document.querySelector(".song");
  const artistNameElement = document.querySelector(".artist");
  const albumImageElement = document.querySelector(".album img");

  if (songTitleElement) {
    songTitleElement.textContent = songs[index].title;
  } else {
    console.error("Song title element not found!");
  }

  if (artistNameElement) {
    artistNameElement.textContent = songs[index].artist;
  } else {
    console.error("Artist element not found!");
  }

  if (albumImageElement) {
    albumImageElement.src = songs[index].image;
  }

  updatePlayPauseButton(true);
  elements.searchResultsContainer.style.display = "none";
  elements.searchInput.value = "";
}

// Event listeners
elements.audio.addEventListener("timeupdate", updateProgressBar);
elements.audio.addEventListener("loadedmetadata", () => {
  elements.totalTimeDisplay.textContent = formatTime(elements.audio.duration);
});
elements.audio.addEventListener("ended", nextSong);
elements.volumeControl.addEventListener("input", adjustVolume);
document.querySelector(".play-btn").addEventListener("click", togglePlay);
elements.nextSongBtn.addEventListener("click", nextSong);
elements.prevSongBtn.addEventListener("click", prevSong);

// Hide search results on outside click
document.addEventListener("click", (event) => {
  if (
    !elements.searchInput.contains(event.target) &&
    !elements.searchResultsContainer.contains(event.target)
  ) {
    elements.searchResultsContainer.style.display = "none";
  }
});

// Toggle play/pause
function togglePlay() {
  if (elements.audio.paused) {
    elements.audio.play();
    updatePlayPauseButton(true);
  } else {
    elements.audio.pause();
    updatePlayPauseButton(false);
  }
}

// Update progress bar
function updateProgressBar() {
  if (isDragging) return;
  const progress = (elements.audio.currentTime / elements.audio.duration) * 100;
  elements.progressFill.style.width =
    elements.progressThumb.style.left = `${progress}%`;
  elements.currentTimeDisplay.textContent = formatTime(
    elements.audio.currentTime
  );
}

// Progress bar interaction
elements.progressBar.addEventListener("click", (event) => {
  const rect = elements.progressBar.getBoundingClientRect();
  const offsetX = event.clientX - rect.left;
  elements.audio.currentTime = (offsetX / rect.width) * elements.audio.duration;
  updateProgressBar();
});

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

// Next and previous song
function nextSong() {
  playSong((currentSongIndex + 1) % songs.length);
}

function prevSong() {
  playSong((currentSongIndex - 1 + songs.length) % songs.length);
}

// Format time display
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
}

// Volume control
function adjustVolume() {
  elements.audio.volume = elements.volumeControl.value;
  const percentage = elements.volumeControl.value * 100;
  elements.volumeControl.style.background = `linear-gradient(to right, #1DB954 ${percentage}%, white ${percentage}%)`;

  elements.volumeIcon.classList.toggle("muted", elements.audio.volume === 0);
}

function toggleMute() {
  if (elements.audio.volume > 0) {
    elements.audio.dataset.prevVolume = elements.audio.volume;
    elements.audio.volume = 0;
    elements.volumeControl.value = 0;
  } else {
    elements.audio.volume = elements.audio.dataset.prevVolume || 0.5;
    elements.volumeControl.value = elements.audio.volume;
  }
  adjustVolume();
}

// Event listeners
elements.audio.addEventListener("timeupdate", updateProgressBar);
elements.audio.addEventListener("loadedmetadata", () => {
  elements.totalTimeDisplay.textContent = formatTime(elements.audio.duration);
});
elements.audio.addEventListener("ended", nextSong);
elements.volumeControl.addEventListener("input", adjustVolume);
document.querySelector(".play-btn").addEventListener("click", togglePlay);
elements.nextSongBtn.addEventListener("click", nextSong);
elements.prevSongBtn.addEventListener("click", prevSong);

// Hide search results on outside click
document.addEventListener("click", (event) => {
  if (
    !elements.searchInput.contains(event.target) &&
    !elements.searchResultsContainer.contains(event.target)
  ) {
    elements.searchResultsContainer.style.display = "none";
  }
});

// Initialize volume
adjustVolume();

/*opt-out */
function updateMusicDetails(imageUrl, songTitle) {
  document.querySelector(
    ".music-details .lib-opt"
  ).style.backgroundImage = `url(${imageUrl})`;
  const songTitleElement = document.querySelector(".music-details .song-title");
  if (songTitleElement) songTitleElement.textContent = songTitle;
}

// Call this function inside playSong to update the background and song title dynamically
function playSong(index) {
  if (!songs[index]?.url) return console.error("Invalid song URL");

  currentSongIndex = index;
  elements.audio.src = songs[index].url;
  elements.audio.play();

  const songTitleElement = document.querySelector(".song");
  const artistNameElement = document.querySelector(".artist");
  const albumImageElement = document.querySelector(".album img");

  if (songTitleElement) songTitleElement.textContent = songs[index].title;
  if (artistNameElement) artistNameElement.textContent = songs[index].artist;
  if (albumImageElement) albumImageElement.src = songs[index].image;

  updateMusicDetails(songs[index].image, songs[index].title);
  updatePlayPauseButton(true);
  elements.searchResultsContainer.style.display = "none";
  elements.searchInput.value = "";
}

/*music details */
function updateMusicDetails(imageUrl, songTitle, artistName) {
  // Update background image
  document.querySelector(
    ".music-details .lib-opt"
  ).style.backgroundImage = `url(${imageUrl})`;

  // Update song title in followers section
  const songTitleElement = document.querySelector(
    ".followers .add p:first-child"
  );
  if (songTitleElement) songTitleElement.textContent = songTitle;

  // Update artist name in followers section
  const artistNameElement = document.querySelector(
    ".followers .add p:last-child"
  );
  if (artistNameElement) artistNameElement.textContent = artistName;
}

// Call this function inside playSong to update the background and song title dynamically
function playSong(index) {
  if (!songs[index]?.url) return console.error("Invalid song URL");

  currentSongIndex = index;
  elements.audio.src = songs[index].url;
  elements.audio.play();

  // Select and update the correct HTML elements
  const songTitleElement = document.querySelector(".song");
  const artistNameElement = document.querySelector(".artist");
  const albumImageElement = document.querySelector(".album img");
  const album1ImageElement = document.querySelector(".album1 img");

  if (songTitleElement) songTitleElement.textContent = songs[index].title;
  if (artistNameElement) artistNameElement.textContent = songs[index].artist;
  if (albumImageElement) albumImageElement.src = songs[index].image;
  if (album1ImageElement) album1ImageElement.src = songs[index].image;

  // Update music details
  updateMusicDetails(
    songs[index].image,
    songs[index].title,
    songs[index].artist
  );

  updatePlayPauseButton(true);
  elements.searchResultsContainer.style.display = "none";
  elements.searchInput.value = "";
}

/*Progress bar */
document.addEventListener("DOMContentLoaded", function () {
  const progressBar = document.getElementById("progress-bar");
  const progressThumb = document.getElementById("progress-thumb");
  const progressFill = document.getElementById("progress-fill");

  if (progressBar && progressThumb) {
    progressThumb.style.display = "none"; // Initially hide the progress thumb
    progressFill.style.backgroundColor = "white";

    progressBar.addEventListener("mouseenter", function () {
      progressThumb.style.display = "block"; // Show on hover
      progressFill.style.backgroundColor = "#1db954";
    });

    progressBar.addEventListener("mouseleave", function () {
      progressThumb.style.display = "none"; // Hide when not hovering
      progressFill.style.backgroundColor = "white";
    });
  }
});

const volumeSlider = document.getElementById("volume");

function showThumb() {
  volumeSlider.style.setProperty("--thumb-opacity", "1");
}

function hideThumb() {
  volumeSlider.style.setProperty("--thumb-opacity", "0");
}

volumeSlider.addEventListener("mouseenter", showThumb);
volumeSlider.addEventListener("mouseleave", hideThumb);

/*input click*/
document.addEventListener("DOMContentLoaded", function () {
  const searchContainer = document.querySelector(".search-container");
  const inputField = searchContainer.querySelector("input");

  if (inputField) {
    inputField.addEventListener("click", function (event) {
      searchContainer.style.border = "3px solid white";
      event.stopPropagation();
    });
  }

  document.addEventListener("click", function (event) {
    if (!searchContainer.contains(event.target)) {
      searchContainer.style.border = "none";
    }
  });
});
