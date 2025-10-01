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
  }, 500);
});

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
      image: track.image?.[2]?.url || "Assets/defaultImg.png",
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

function updateSongDetails(containerSelector, index) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  const songTitleElement = container.querySelector(".song");
  const artistNameElement = container.querySelector(".artist");
  const albumImageElement = container.querySelector("img");

  if (songTitleElement) songTitleElement.textContent = songs[index].title;
  if (artistNameElement) artistNameElement.textContent = songs[index].artist;
  if (albumImageElement) albumImageElement.src = songs[index].image;
}

function updateMusicDetails(imageUrl, songTitle, artistName) {
  const libOpt = document.querySelector(".music-details .lib-opt");
  if (libOpt) libOpt.style.backgroundImage = `url(${imageUrl})`;

  const songTitleElement = document.querySelector(
    ".followers .add p:first-child"
  );
  if (songTitleElement) songTitleElement.textContent = songTitle;

  const artistNameElement = document.querySelector(
    ".followers .add p:last-child"
  );
  if (artistNameElement) artistNameElement.textContent = artistName;
}

function playSong(index) {
  if (!songs[index]?.url) return;

  currentSongIndex = index;
  elements.audio.src = songs[index].url;
  elements.audio.play();

  updateSongDetails(".album", index);
  updateSongDetails(".album1", index);
  updateMusicDetails(
    songs[index].image,
    songs[index].title,
    songs[index].artist
  );

  updatePlayPauseButton(true);
  elements.searchResultsContainer.style.display = "none";
  elements.searchInput.value = "";
}

elements.audio.addEventListener("timeupdate", updateProgressBar);
elements.audio.addEventListener("loadedmetadata", () => {
  elements.totalTimeDisplay.textContent = formatTime(elements.audio.duration);
});
elements.audio.addEventListener("ended", nextSong);
elements.volumeControl.addEventListener("input", adjustVolume);
document.querySelector(".play-btn").addEventListener("click", togglePlay);
elements.nextSongBtn.addEventListener("click", nextSong);
elements.prevSongBtn.addEventListener("click", prevSong);

document.addEventListener("click", (event) => {
  if (
    !elements.searchInput.contains(event.target) &&
    !elements.searchResultsContainer.contains(event.target)
  ) {
    elements.searchResultsContainer.style.display = "none";
  }
});

function togglePlay() {
  if (elements.audio.paused) {
    elements.audio.play();
    updatePlayPauseButton(true);
  } else {
    elements.audio.pause();
    updatePlayPauseButton(false);
  }
}

function updateProgressBar() {
  if (isDragging) return;
  const progress = (elements.audio.currentTime / elements.audio.duration) * 100;
  elements.progressFill.style.width =
    elements.progressThumb.style.left = `${progress}%`;
  elements.currentTimeDisplay.textContent = formatTime(
    elements.audio.currentTime
  );
}

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

function nextSong() {
  playSong((currentSongIndex + 1) % songs.length);
}

function prevSong() {
  playSong((currentSongIndex - 1 + songs.length) % songs.length);
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
}

function adjustVolume() {
  elements.audio.volume = elements.volumeControl.value;
  const percentage = elements.volumeControl.value * 100;
  elements.volumeIcon.classList.toggle("muted", elements.audio.volume === 0);
}

const volumeControl = elements.volumeControl;

function updateSliderBackground(fillColor) {
  const percentage = (volumeControl.value / volumeControl.max) * 100;
  volumeControl.style.background = `linear-gradient(to right, ${fillColor} ${percentage}%, #535353 ${percentage}%)`;
}

function handleMouseEnter() {
  updateSliderBackground("#1db954");
  volumeControl.style.setProperty("--thumb-opacity", "1");
}

function handleMouseLeave() {
  updateSliderBackground("#fff");
  volumeControl.style.setProperty("--thumb-opacity", "0");
}

volumeControl.addEventListener("input", function () {
  const isHovered = volumeControl.matches(":hover");
  updateSliderBackground(isHovered ? "#1db954" : "#fff");
});

volumeControl.addEventListener("mouseenter", handleMouseEnter);
volumeControl.addEventListener("mouseleave", handleMouseLeave);

function toggleMute() {
  if (elements.audio.volume > 0) {
    elements.audio.dataset.prevVolume = elements.audio.volume;
    elements.audio.volume = 0;
    elements.volumeControl.value = 0;
  } else {
    const prevVolume = elements.audio.dataset.prevVolume || 1;
    elements.audio.volume = prevVolume;
    elements.volumeControl.value = prevVolume;
  }
  adjustVolume();
}

// Ensure search container is hidden on initial load
window.addEventListener("DOMContentLoaded", () => {
  elements.searchResultsContainer.style.display = "none";
});

/*loader */
async function fetchSongs(query) {
  try {
    document.getElementById("loader-overlay").style.display = "flex"; // Show loader
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
      image: track.image?.[2]?.url || "Assets/defaultImg.png",
      url:
        track.downloadUrl?.[4]?.url ||
        track.downloadUrl?.[2]?.url ||
        track.downloadUrl?.[0]?.url,
    }));

    displaySearchResults(songs);
  } catch (error) {
    console.error("Error fetching songs:", error);
    elements.searchResultsContainer.innerHTML = `<p style="color: red;">Error fetching songs</p>`;
  } finally {
    document.getElementById("loader-overlay").style.display = "none"; // Hide loader
  }
}

let musicdetails = document.querySelector(".music-details");
let closeBar = document.querySelector(".closeBar");

if (closeBar && musicdetails) {
  closeBar.addEventListener("click", () => {
    musicdetails.style.display = "none";
  });
}

let album = document.querySelector(".album");
album.addEventListener("click", () => {
  musicdetails.style.display = "block";
});

let searchcontainer = document.querySelector(".search-container");

if (searchcontainer) {
  searchcontainer.addEventListener("click", () => {
    searchcontainer.style.border.toggle = "3px solid white";
  });
}
