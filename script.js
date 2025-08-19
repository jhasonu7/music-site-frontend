

// Inject fade-in CSS for similar albums
(function() {
    const style = document.createElement('style');
    style.innerHTML = `
    .fade-in { animation: fadeIn 0.6s ease-in; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    `;
    document.head.appendChild(style);
})();



// --- Configuration ---
// IMPORTANT: Replace this with your actual ngrok static domain if you are using ngrok for your backend.
// If your backend is hosted directly (e.g., on Render, Heroku), use that URL.
const BACKEND_BASE_URL = 'https://452e1283da6a.ngrok-free.app'; // Example: 'https://your-ngrok-subdomain.ngrok-free.app' or 'https://your-backend-api.com'

// IMPORTANT: Replace this with your actual Netlify frontend domain for CORS setup on the backend.
// This is crucial for your backend's CORS configuration (e.g., in Flask-CORS or Express CORS options)
// It tells your backend which frontend domains are allowed to access its resources.
const NETLIFY_FRONTEND_DOMAIN = 'https://swarify-play.netlify.app'; // e.g., https://my-music-site.netlify.app'

// --- Heart Icon Styles ---
// Inject styles for the new heart icons and related elements into the document's head.
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = `

/* === Embedded Album Backdrop to block background content === */
#embedded-album-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.75);
    z-index: 9998;
    display: none;
}
#album-full-embed-container {
    z-index: 9999 !important;
}


   
    #vertical-heart-strip {
        position: absolute;
        top: 248px; /* Position below the top info mask */
        left: 53px;
        width: 27px;
        height: calc(100% - 210px);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 34px;
        z-index: 1002; /* Ensure it's above the interaction layer */
        pointer-events: auto;
        overflow-y: auto;
        background: rgb(13,13,13);
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
        border-radius: 25px;
        padding: 20px 0;
        box-sizing: border-box;
    }
      @media (max-width: 480px) { 
    #vertical-heart-strip {
    position: absolute;
    top: 231px;
    left: 36px;
    width: 27px;
    height: calc(100% - 210px);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
}
}

  @media (max-width: 768px) { 
    #vertical-heart-strip {
    position: absolute;
    top: 231px;
    left: 32px;
    width: 27px;
    height: calc(100% - 210px);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
}
}

    
    /* Hide scrollbar for the vertical strip */
    #vertical-heart-strip::-webkit-scrollbar {
        display: none;
    }
    #vertical-heart-strip {
        -ms-overflow-style: none;  /* IE and Edge */
        scrollbar-width: none;  /* Firefox */
    }

   #vertical-heart-strip1 {
        position: absolute;
        top: 248px; /* Position below the top info mask */
        right: 75px;
        width: 27px;
        height: calc(100% - 210px);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 34px;
        z-index: 1002; /* Ensure it's above the interaction layer */
        pointer-events: auto;
        overflow-y: auto;
        background: rgb(13,13,13);
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
        border-radius: 25px;
        padding: 20px 0;
        box-sizing: border-box;
    }
      @media (max-width: 480px) { 
    #vertical-heart-strip1 {
    position: absolute;
    top: 231px;
    right: 36px;
    width: 27px;
    height: calc(100% - 210px);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
}
}

  @media (max-width: 768px) { 
    #vertical-heart-strip1 {
    position: absolute;
    top: 231px;
    right: 32px;
    width: 27px;
    height: calc(100% - 210px);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
}
}

    
    /* Hide scrollbar for the vertical strip */
    #vertical-heart-strip1::-webkit-scrollbar {
        display: none;
    }
    #vertical-heart-strip1 {
        -ms-overflow-style: none;  /* IE and Edge */
        scrollbar-width: none;  /* Firefox */
    }





`;
document.head.appendChild(styleSheet);


// --- DOM Elements (assuming these exist in your HTML) ---
const trendingSongsContainer = document.querySelector('.trending-songs-container'); // Adjust selector as needed
const popularAlbumsContainer = document.querySelector('.popular-albums-container'); // Adjust selector as needed
const popularArtistsContainer = document.querySelector('.popular-artists-container'); // Adjust selector as needed
const errorMessageDisplay = document.getElementById('error-message-display'); // An element to show errors

// NEW: Reference for the "Explore More Albums" container
const exploreMoreAlbumsCardsContainer = document.getElementById('explore-more-albums-cards');


// --- Global Variables ---
let currentAlbum = null; // Stores the currently loaded album data (for the overlay)
let currentTrackIndex = 0; // Index of the currently playing track within currentAlbum.tracks
let isRepeat = false; // Flag for repeat mode
let isShuffle = false; // Flag for shuffle mode
let allAlbumsData = []; // This will store albums fetched from the backend for search lookups and card details

let ytPlayer = null; // Global variable to hold the YouTube player instance
let spotifyPlayer = null; // Global variable to hold the Spotify player instance
let spotifyAccessToken = null; // Spotify access token
let spotifyDeviceId = null; // Spotify device ID for playback
let progressBarInterval = null; // To clear the interval for main player bar progress updates
let albumOverlayProgressBarInterval = null; // NEW: To clear the interval for main album playbar progress updates
let searchMessageTimeout = null; // To clear the timeout for search messages
let searchMessageContainer = null; // Global variable to hold the dynamically created search message container
let lastKnownPlaybackPosition = 0; // Stores the last known playback position for resuming (for controllable players)

let playingAlbum = null; // NEW: Stores the album object that is currently playing audio (could be embedded or controllable)
let currentUserName = 'Guest'; // NEW: Global variable to store the logged-in user's name
let currentlyPlayedCardId = null; // NEW: Stores the ID of the card that is currently playing audio

// Create audio element (still needed for non-iframe tracks like direct audio)
const audio = new Audio();
audio.id = 'audio-player';
document.body.appendChild(audio);

// --- Get References to Key HTML Elements ---
const albumOverlay = document.getElementById('albumOverlay'); // Corrected ID from 'album-overlay'
const closeOverlayBtn = document.querySelector('.close-overlay'); // This is the single close button for the overlay
const albumFullEmbedContainer = document.getElementById('album-full-embed-container');
const albumHeader = document.querySelector('.album-header'); // Get album header
const albumTracksSection = document.querySelector('.album-tracks'); // Get album tracks section
const albumDetailsCover = document.getElementById('albumDetails-cover'); // Album cover in overlay
const albumDetailsTitle = document.getElementById('albumDetails-title'); // Album title in overlay
const albumDetailsArtist = document.getElementById('albumDetails-artist'); // Album artist in overlay
const albumDetailsMeta = document.getElementById('albumDetails-meta'); // Album meta in overlay
const albumDetailsTracksBody = document.getElementById('albumDetails-tracks'); // Tracklist table body in overlay
const albumPlayButton = document.getElementById('album-play');

// === Create the embedded album backdrop once ===
let embeddedBackdrop = document.getElementById('embedded-album-backdrop');
if (!embeddedBackdrop) {
    embeddedBackdrop = document.createElement('div');
    embeddedBackdrop.id = 'embedded-album-backdrop';
    document.body.appendChild(embeddedBackdrop);
    embeddedBackdrop.addEventListener('click', closeEmbeddedAlbum);
}
 // Play button inside album overlay

// --- NEW Main Play Bar Elements (from the provided HTML structure) ---
const mainPlayBar = document.getElementById('main-play-bar'); // The entire fixed play bar container
const currentAlbumArt = document.getElementById('current-album-art'); // Album cover in main play bar
const currentSongTitle = document.getElementById('current-song-title'); // Song title in main play bar
const currentArtistName = document.getElementById('current-artist-name'); // Artist name in main play bar
const playPauseBtn = document.getElementById('play-pause-btn'); // Play/Pause button in main play bar
const playIcon = document.getElementById('play-icon'); // Play icon SVG
const pauseIcon = document.getElementById('pause-icon'); // Pause icon SVG
const progressBar = document.getElementById('progress-bar'); // Progress bar in main play bar
const currentTimeSpan = document.getElementById('current-time'); // Current time display in main play bar
const totalTimeSpan = document.getElementById('total-time'); // Total duration display in main play bar (CHANGED FROM 'duration')
const volumeBar = document.getElementById('volume-bar'); // Volume bar in main play bar
const nextTrackBtn = document.getElementById('next-track-btn'); // Next track button in main play bar
const prevTrackBtn = document.getElementById('prev-track-btn'); // Previous track button in main play bar
const rewindBtn = document.getElementById('rewind-btn'); // Rewind button in main play bar
const fastForwardBtn = document.getElementById('fast-forward-btn'); // Fast-forward button in main play bar
const repeatBtn = document.getElementById('repeat-btn'); // Repeat button in main play bar
const shuffleBtn = document.getElementById('shuffle-btn'); // Shuffle button in main play bar

// NEW: Full-Screen Player Elements (from the provided HTML structure)
const fullScreenPlayer = document.getElementById('full-screen-player');
const minimizePlayerBtn = document.getElementById('minimize-player-btn');
const fullScreenAlbumArt = document.getElementById('full-screen-album-art');
const fullScreenSongTitle = document.getElementById('full-screen-song-title'); // Title in header
const fullScreenArtistName = document.getElementById('full-screen-artist-name'); // Artist in header
const fullScreenSongTitleLarge = document.getElementById('full-screen-song-title-large'); // Title in main content
const fullScreenArtistNameLarge = document.getElementById('full-screen-artist-name-large'); // Artist in main content
const fullScreenProgressBar = document.getElementById('full-screen-progress-bar');
const fullScreenCurrentTime = document.getElementById('full-screen-current-time');
const fullScreenTotalTime = document.getElementById('full-screen-total-time');
const fullPlayPauseBtn = document.getElementById('full-play-pause-btn');
const fullPlayIcon = document.getElementById('full-play-icon');
const fullPauseIcon = document.getElementById('full-pause-icon');
const fullPrevTrackBtn = document.getElementById('full-prev-track-btn');
const fullNextTrackBtn = document.getElementById('full-next-track-btn');
const fullShuffleBtn = document.getElementById('full-shuffle-btn');
const fullRepeatBtn = document.getElementById('full-repeat-btn');
const fullAddToPlaylistBtn = document.getElementById('full-add-to-playlist-btn');
const fullShareBtn = document.getElementById('full-share-btn');


// NEW: Fixed Top Heading Elements
const fixedTopPlayingHeading = document.getElementById('fixed-top-playing-heading');
const fixedTopAlbumArt = document.getElementById('fixed-top-album-art');
const fixedTopAlbumTitle = document.getElementById('fixed-top-album-title');


// Re-referencing existing elements for clarity and consistency with the new HTML structure
// These were already defined above, but re-listed here to match the new HTML's logical grouping
const playerLeft = document.querySelector('.flex.items-center.w-full.md\\:w-auto.flex-grow'); // The container for album art and song info
const playerControls = document.querySelector('.flex.items-center.justify-center.space-x-4.w-full.md\\:w-auto.flex-shrink-0'); // The container for play/pause, next, prev buttons

const searchInput = document.getElementById('search-input'); // Search input field
const searchIcon = document.querySelector('.search-icon'); // Search icon button
const spotifyLoginBtn = document.getElementById('spotify-login-btn'); // Spotify Login Button (if it exists)

// Hamburger menu and sidebar elements
const hamburger = document.querySelector('.hamburger'); // New reference for hamburger
const sidebar = document.querySelector('.left.sidebar'); // Corrected selector for sidebar
const overlay = document.getElementById('overlay'); // Assuming ID for overlay
const closeBtn = document.querySelector('.close-btn'); // New reference for close button in sidebar

// New references for topBar and rightPanel (used for dynamic positioning)
const topBar = document.querySelector('.top-bar');
const rightPanel = document.querySelector('.right');

// New references for top bar login/signup buttons and user avatar/dropdown
const topSignupBtn = document.getElementById('top-signup-btn');
const topLoginBtn = document.getElementById('top-login-btn');
const userAvatarContainer = document.getElementById('user-avatar-container');
const userAvatar = document.getElementById('user-avatar');
const userDropdown = document.getElementById('user-dropdown');
const dropdownUsername = document.getElementById('dropdown-username');
const dropdownLogoutBtn = document.getElementById('dropdown-logout-btn');

// Global variable for albumDetailsContent
let albumDetailsContent = null; // Made global to be accessible by closeAlbumOverlay

// Spotify API Credentials (REPLACE WITH YOUR OWN FROM SPOTIFY DEVELOPER DASHBOARD)
// For client-side implicit grant flow, these are usually client ID and redirect URI.
// The redirect URI MUST be whitelisted in your Spotify Developer Dashboard.
const SPOTIFY_CLIENT_ID = 'YOUR_SPOTIFY_CLIENT_ID'; // Replace with your Spotify Client ID
const SPOTIFY_REDIRECT_URI = window.location.origin; // Your app's URL (e.g., http://localhost:8000)
const SPOTIFY_SCOPES = 'user-read-playback-state user-modify-playback-state streaming user-read-email user-read-private';



// script.js
// ... (existing code)

// --- New Global Variables for Playlists ---
let currentUserPlaylists = []; // To store all the user's playlists
let currentPlaylist = null; // To store the currently viewed playlist

// --- New Element References for Playlists ---
const newPlaylistPopupOverlay = document.getElementById('new-playlist-popup-overlay');
const newPlaylistNameInput = document.getElementById('new-playlist-name-input');
const createNewPlaylistBtn = document.getElementById('create-new-playlist');
const cancelNewPlaylistBtn = document.getElementById('cancel-new-playlist');

const playlistDetailsOverlay = document.getElementById('playlist-details-overlay');
const closePlaylistDetailsBtn = document.getElementById('close-playlist-details');
const playlistTitleH1 = document.getElementById('playlist-title-h1');
const playlistInfoP = document.getElementById('playlist-info');
const playlistSongsContainer = document.getElementById('playlist-songs-container');
const recommendedSongsContainer = document.getElementById('recommended-songs-container');
const playlistPlayBtn = document.getElementById('playlist-play-btn');

let userPlaylistsContainer = document.getElementById('user-playlists-container');
const addPopupOverlay = document.getElementById('add-popup-overlay');

// ... (rest of your existing code)
// --- Utility Functions ---



/**
 * Formats time from seconds to MM:SS format.
 * @param {number} seconds - The time in seconds.
 * @returns {string} Formatted time string.
 */
function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return '0:00';
    }
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

/**
 * Parses a duration string (e.g., "3:45", "210") into seconds.
 * @param {string|number} durationInput - The duration value from the backend.
 * @returns {number} Duration in seconds, or 0 if parsing fails.
 */
function parseDurationToSeconds(durationInput) {
    console.log(`parseDurationToSeconds: Received input: "${durationInput}" (Type: ${typeof durationInput})`);

    if (typeof durationInput === 'number') {
        if (!isNaN(durationInput) && isFinite(durationInput)) {
            console.log(`parseDurationToSeconds: Input is a valid number. Returning: ${durationInput}`);
            return durationInput;
        } else {
            console.warn(`parseDurationToSeconds: Input is an invalid number (NaN or Infinity). Returning 0.`);
            return 0;
        }
    }

    if (typeof durationInput !== 'string' || durationInput.trim() === '') {
        console.warn(`parseDurationToSeconds: Input is not a valid string or is empty. Returning 0.`);
        return 0;
    }

    const durationString = durationInput.trim();

    // Try parsing as a direct float first (e.g., "210.5")
    const floatValue = parseFloat(durationString);
    if (!isNaN(floatValue) && isFinite(floatValue)) {
        console.log(`parseDurationToSeconds: Parsed as float: ${floatValue}. Returning: ${floatValue}`);
        return floatValue;
    }

    // If not a direct float, try MM:SS format (e.g., "3:45")
    const parts = durationString.split(':');
    if (parts.length === 2) {
        const minutes = parseInt(parts[0], 10);
        const seconds = parseInt(parts[1], 10);
        if (!isNaN(minutes) && !isNaN(seconds)) {
            const result = (minutes * 60) + seconds;
            console.log(`parseDurationToSeconds: Parsed as MM:SS. Minutes: ${minutes}, Seconds: ${seconds}. Returning: ${result}`);
            return result;
        }
    } else if (parts.length === 3) { // Handle HH:MM:SS format
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        const seconds = parseInt(parts[2], 10);
        if (!isNaN(hours) && !isNaN(minutes) && !isNaN(seconds)) {
            const result = (hours * 3600) + (minutes * 60) + seconds;
            console.log(`parseDurationToSeconds: Parsed as HH:MM:SS. Hours: ${hours}, Minutes: ${minutes}, Seconds: ${seconds}. Returning: ${result}`);
            return result;
        }
    }

    console.warn(`parseDurationToSeconds: Could not parse duration string: "${durationString}". Returning 0.`);
    return 0; // Fallback if parsing fails
}


/**
 * Function to enable/disable main player controls based on playback type.
 * Controls are disabled for embedded content (Spotify/SoundCloud iframes) as they cannot be controlled directly.
 */
function togglePlayerControls(enable) {
    // Check if playerControls exists before trying to access its style
    if (playerControls) { // This now refers to the main controls container
        playerControls.style.pointerEvents = enable ? 'auto' : 'none';
        playerControls.style.opacity = enable ? '1' : '0.5';
    }
    // Check if individual buttons exist before trying to disable them
    if (playPauseBtn) playPauseBtn.disabled = !enable;
    if (nextTrackBtn) nextTrackBtn.disabled = !enable;
    if (prevTrackBtn) prevTrackBtn.disabled = !enable;
    if (progressBar) progressBar.disabled = !enable;
    if (volumeBar) volumeBar.disabled = !enable;
    if (repeatBtn) repeatBtn.disabled = !enable;
    if (shuffleBtn) shuffleBtn.disabled = !enable;
    if (rewindBtn) rewindBtn.disabled = !enable;
    if (fastForwardBtn) fastForwardBtn.disabled = !enable;

    // Also update full-screen player controls
    if (fullPlayPauseBtn) fullPlayPauseBtn.disabled = !enable;
    if (fullNextTrackBtn) fullNextTrackBtn.disabled = !enable;
    if (fullPrevTrackBtn) fullPrevTrackBtn.disabled = !enable;
    if (fullScreenProgressBar) fullScreenProgressBar.disabled = !enable;
    if (fullRepeatBtn) fullRepeatBtn.disabled = !enable;
    if (fullShuffleBtn) fullShuffleBtn.disabled = !enable;
    if (fullAddToPlaylistBtn) fullAddToPlaylistBtn.disabled = !enable;
    if (fullShareBtn) fullShareBtn.disabled = !enable;
}

/**
 * Stops only the controllable audio players (native audio, YouTube API, Spotify SDK).
 * It does NOT clear embedded iframes in albumFullEmbedContainer or mini-player elements.
 */
function stopControllablePlayersOnly() {
    console.log("stopControllablePlayersOnly: Stopping active controllable players.");
    // Stop native audio
    if (audio.src && !audio.paused) {
        audio.pause();
        // Do NOT clear audio.src here, as it might be resumed if it's the same track.
        // If a new track is played, playTrack will handle src clearing.
        console.log("Native audio paused.");
    }
    // Destroy YouTube player
    if (ytPlayer) {
        ytPlayer.destroy();
        ytPlayer = null;
        console.log("YouTube player destroyed.");
    }
    // Pause Spotify SDK player
    if (spotifyPlayer && spotifyDeviceId) {
        try {
            spotifyPlayer.getCurrentState().then(state => {
                if (state && !state.paused) {
                    spotifyPlayer.pause();
                }
            }).catch(e => console.warn("Could not get Spotify player state to pause:", e));
        } catch (e) {
            console.warn("Error pausing Spotify player:", e);
        }
    }


}




/**
 * Function to reset the player UI elements and clear mini-player from the player bar.
 * It also attempts to stop actual audio/video playback from native audio, YouTube, and Spotify SDK.
 * IMPORTANT: This function now ensures ALL playback sources are stopped, including background embedded iframes.
 */
function stopAllPlaybackUI() {
    // Stop native audio
    if (audio.src && !audio.paused) {
        audio.pause();
        audio.src = ''; // Clear source to fully stop
        console.log("Native audio stopped and source cleared.");
    }
    // Destroy YouTube player
    if (ytPlayer) {
        ytPlayer.destroy(); // Destroy YouTube player
        ytPlayer = null;
        console.log("YouTube player destroyed.");
    }
    // Pause Spotify SDK player
    if (spotifyPlayer && spotifyDeviceId) { // Only pause Spotify if it's active through SDK
        try {
            // Check if a track is actually playing or paused on the device
            spotifyPlayer.getCurrentState().then(state => {
                if (state && !state.paused) {
                    spotifyPlayer.pause();
                    console.log("Spotify player paused.");
                }
            }).catch(e => console.warn("Could not get Spotify player state to pause:", e));
        } catch (e) {
            console.warn("Error pausing Spotify player:", e);
        }
    }

    // --- IMPORTANT: Stop any background embedded iframes by removing them from the DOM. ---
    // This ensures that when stopAllPlaybackUI is called, all previous playback ceases.
    const iframeInFullEmbedContainer = albumFullEmbedContainer.querySelector('iframe');
    if (iframeInFullEmbedContainer) {
        iframeInFullEmbedContainer.remove();
        console.log("iframe in albumFullEmbedContainer removed to stop background embed playback.");
    }
    // Also ensure the container is hidden if it was showing an embed
    albumFullEmbedContainer.style.display = 'none';
    // NEW: Clear playingAlbum when all playback is stopped
    playingAlbum = null;
    console.log("stopAllPlaybackUI: playingAlbum set to null.");
    // NEW: Clear currentlyPlayedCardId and show all cards
    currentlyPlayedCardId = null;
    showAllCards();
    console.log("stopAllPlaybackUI: currentlyPlayedCardId cleared and all cards shown.");


    // Clear any existing iframe/youtube player div/raw HTML embed from the player-left container (mini-player)
    // The playerLeft now contains the album art and song info, so we need to target the dynamic player container within it.
    const dynamicPlayerContainer = playerLeft.querySelector('#youtube-player-container');
    if (dynamicPlayerContainer) {
        dynamicPlayerContainer.remove();
    }

    // Ensure player image is visible
    if (currentAlbumArt) currentAlbumArt.style.display = 'block';

    // Reset progress bar and time displays for the main play bar
    if (progressBarInterval) {
        clearInterval(progressBarInterval);
        progressBarInterval = null;
    }
    // NEW: Clear main album playbar progress bar interval
    if (albumOverlayProgressBarInterval) {
        clearInterval(albumOverlayProgressBarInterval);
        albumOverlayProgressBarInterval = null;
    }

    if (progressBar) progressBar.value = 0;
    if (currentTimeSpan) currentTimeSpan.textContent = '0:00';
    if (totalTimeSpan) totalTimeSpan.textContent = '0:00';
    if (playPauseBtn) {
        playIcon.classList.remove('hidden');
        pauseIcon.classList.add('hidden');
    }

    // NEW: Reset full-screen player UI
    if (fullScreenProgressBar) fullScreenProgressBar.value = 0;
    if (fullScreenCurrentTime) fullScreenCurrentTime.textContent = '0:00';
    if (fullScreenTotalTime) fullScreenTotalTime.textContent = '0:00';
    if (fullPlayPauseBtn) {
        fullPlayIcon.classList.remove('hidden');
        fullPauseIcon.classList.add('hidden');
    }

    togglePlayerControls(true); // Re-enable controls when stopping all playback
    console.log("Player controls re-enabled.");

    // Hide the fixed top playing heading
    updateFixedTopHeadingVisibility(); // Call new function to manage visibility
    hideFullScreenPlayer(); // Ensure full screen player is hidden
}

function updateCompactPlayButtonIcons() {
    const compactButtons = document.querySelectorAll('.playlist-compact-play-btn');
    const isPlaying = (ytPlayer && ytPlayer.getPlayerState && ytPlayer.getPlayerState() === YT.PlayerState.PLAYING) || (audio && !audio.paused);
    
    compactButtons.forEach(button => {
        const playIcon = button.querySelector('.play-icon');
        const pauseIcon = button.querySelector('.pause-icon');
        const songId = button.dataset.songId;

        if (!playIcon || !pauseIcon) {
            console.warn("Compact playlist play button is missing play/pause icons.");
            return;
        }

        if (songId === currentlyPlayedCardId) {
            if (isPlaying) {
                playIcon.classList.add('hidden');
                pauseIcon.classList.remove('hidden');
            } else {
                playIcon.classList.remove('hidden');
                pauseIcon.classList.add('hidden');
            }
        } else {
            playIcon.classList.remove('hidden');
            pauseIcon.classList.add('hidden');
        }
    });
}


/**
 * Updates the UI elements of both the compact playbar and the full-screen player.
 * This function is called whenever the playback state or current track changes.
 */
async function updatePlayerUI() {
    console.log("updatePlayerUI called.");

    if (!playingAlbum) {
        console.log("updatePlayerUI: No playing album. Clearing playbar UI and hiding playbar.");
        // Clear compact playbar UI elements
        if (currentAlbumArt) currentAlbumArt.src = 'https://placehold.co/64x64/4a4a4a/ffffff?text=Album';
        if (currentSongTitle) currentSongTitle.textContent = 'No Track Playing';
        if (currentArtistName) currentArtistName.textContent = '';
        if (progressBar) {
            progressBar.value = 0;
            progressBar.max = 0;
            progressBar.disabled = true;
        }
        if (currentTimeSpan) currentTimeSpan.textContent = '0:00';
        if (totalTimeSpan) totalTimeSpan.textContent = '0:00';
        if (playPauseBtn) {
            playIcon.classList.remove('hidden');
            pauseIcon.classList.add('hidden');
        }

        // Clear full-screen player UI elements
        if (fullScreenAlbumArt) fullScreenAlbumArt.src = 'https://placehold.co/300x300/4a4a4a/ffffff?text=Album';
        if (fullScreenSongTitle) fullScreenSongTitle.textContent = 'No Track Playing';
        if (fullScreenArtistName) fullScreenArtistName.textContent = '';
        if (fullScreenSongTitleLarge) fullScreenSongTitleLarge.textContent = 'No Track Playing';
        if (fullScreenArtistNameLarge) fullScreenArtistNameLarge.textContent = '';
        if (fullScreenProgressBar) {
            fullScreenProgressBar.value = 0;
            fullScreenProgressBar.max = 0;
            fullScreenProgressBar.disabled = true;
        }
        if (fullScreenCurrentTime) fullScreenCurrentTime.textContent = '0:00';
        if (fullScreenTotalTime) fullScreenTotalTime.textContent = '0:00';
        if (fullPlayPauseBtn) {
            fullPlayIcon.classList.remove('hidden');
            fullPauseIcon.classList.add('hidden');
        }

        togglePlayerControls(true); // Re-enable controls, as nothing is playing (or it's a non-embed state)
        if (progressBarInterval) {
            clearInterval(progressBarInterval);
            progressBarInterval = null;
        }
        mainPlayBar.style.display = 'none'; // Hide the playbar if nothing is playing
        updateFixedTopHeadingVisibility(); // Hide fixed heading as well
        hideFullScreenPlayer(); // Ensure full screen player is hidden
        return;
    }

    mainPlayBar.style.display = 'flex'; // Ensure compact playbar is visible if something is playing

    const isEmbeddedAlbum = playingAlbum.rawHtmlEmbed || playingAlbum.fullSoundcloudEmbed || playingAlbum.audiomackEmbed || playingAlbum.iframeSrc;

    let displayTitle = 'Unknown Title';
    let displayArtist = 'Unknown Artist';
    let displayCoverArt = 'https://placehold.co/64x64/4a4a4a/ffffff?text=Album'; // Default for compact
    let displayCoverArtLarge = 'https://placehold.co/300x300/4a4a4a/ffffff?text=Album'; // Default for full-screen
    let currentTrack = null;

    if (isEmbeddedAlbum) {
        displayTitle = playingAlbum.title || 'Embedded Content';
        displayArtist = playingAlbum.artist || 'Various Artists';
        displayCoverArt = playingAlbum.coverArt || 'https://placehold.co/64x64/4a4a4a/ffffff?text=Embed';
        displayCoverArtLarge = playingAlbum.coverArt || 'https://placehold.co/300x300/4a4a4a/ffffff?text=Embed';
        console.log(`updatePlayerUI: Detected embedded album. Using album data: ${displayTitle} by ${displayArtist}`);

        // For embedded content, progress bar and controls are generally disabled
        if (progressBar) { progressBar.value = 0; progressBar.max = 0; progressBar.disabled = true; }
        if (currentTimeSpan) currentTimeSpan.textContent = '0:00';
        if (totalTimeSpan) totalTimeSpan.textContent = 'N/A';

        if (fullScreenProgressBar) { fullScreenProgressBar.value = 0; fullScreenProgressBar.max = 0; fullScreenProgressBar.disabled = true; }
        if (fullScreenCurrentTime) fullScreenCurrentTime.textContent = '0:00';
        if (fullScreenTotalTime) fullScreenTotalTime.textContent = 'N/A';

        togglePlayerControls(false); // Disable controls
        if (progressBarInterval) { // Clear interval for continuous updates as we can't get live progress
            clearInterval(progressBarInterval);
            progressBarInterval = null;
        }

    } else {
        if (playingAlbum.tracks && playingAlbum.tracks.length > 0 && currentTrackIndex !== undefined && currentTrackIndex >= 0 && currentTrackIndex < playingAlbum.tracks.length) {
            currentTrack = playingAlbum.tracks[currentTrackIndex];
            if (currentTrack) {
                displayTitle = currentTrack.title || 'Unknown Title';
                displayArtist = currentTrack.artist || 'Unknown Artist';
                displayCoverArt = currentTrack.img || playingAlbum.coverArt || 'https://placehold.co/64x64/4a4a4a/ffffff?text=Track';
                displayCoverArtLarge = currentTrack.img || playingAlbum.coverArt || 'https://placehold.co/300x300/4a4a4a/ffffff?text=Track';
                console.log(`updatePlayerUI: Detected tracklist album. Using track data: ${displayTitle} by ${displayArtist}`);

                let isPlaying = false;
                let duration = 0;
                let currentTime = 0;

                // Determine current playback state and time from the active player
                if (audio.src === currentTrack.src) {
                    isPlaying = !audio.paused && !audio.ended;
                    duration = audio.duration;
                    currentTime = audio.currentTime;
                } else if (ytPlayer && currentTrack.iframeSrc && currentTrack.iframeSrc.includes('https://www.youtube.com/embed/')) {
                    const videoIdMatch = currentTrack.iframeSrc.match(/\/embed\/([a-zA-Z0-9_-]+)/);
                    const videoId = videoIdMatch ? videoIdMatch[1] : null;
                    if (videoId && ytPlayer.getVideoData() && ytPlayer.getVideoData().video_id === videoId) {
                        isPlaying = ytPlayer.getPlayerState() === YT.PlayerState.PLAYING;
                        const ytDuration = ytPlayer.getDuration();
                        if (!isNaN(ytDuration) && ytDuration > 0) {
                            duration = ytDuration;
                        }
                        currentTime = ytPlayer.getCurrentTime();
                    }
                } else if (spotifyPlayer && currentTrack.spotifyUri) {
                    try {
                        const state = await spotifyPlayer.getCurrentState();
                        if (state && state.track_window.current_track.uri === currentTrack.spotifyUri) {
                            isPlaying = !state.paused;
                            const spotifyDuration = state.duration / 1000;
                            if (!isNaN(spotifyDuration) && spotifyDuration > 0) {
                                duration = spotifyDuration;
                            }
                            currentTime = state.position / 1000;
                        }
                    } catch (e) {
                        console.warn("Error getting Spotify state for player UI update:", e);
                        isPlaying = false;
                    }
                }

                if (isNaN(duration) || duration <= 0) {
                    duration = currentTrack.duration || 0;
                }

                // Update compact playbar progress
                if (progressBar) {
                    progressBar.max = duration;
                    progressBar.value = currentTime;
                    progressBar.disabled = false;
                }
                if (currentTimeSpan) currentTimeSpan.textContent = formatTime(currentTime);
                if (totalTimeSpan) totalTimeSpan.textContent = formatTime(duration);

                // Update full-screen player progress
                if (fullScreenProgressBar) {
                    fullScreenProgressBar.max = duration;
                    fullScreenProgressBar.value = currentTime;
                    fullScreenProgressBar.disabled = false;
                }
                if (fullScreenCurrentTime) fullScreenCurrentTime.textContent = formatTime(currentTime);
                if (fullScreenTotalTime) fullScreenTotalTime.textContent = formatTime(duration);

                togglePlayerControls(true); // Enable controls for controllable tracks

                // Clear and restart the progress bar interval
                if (progressBarInterval) clearInterval(progressBarInterval);
                progressBarInterval = setInterval(async () => {
                    let currentProgress = 0;
                    let currentDuration = 0;
                    let playerIsPlaying = false;

                    if (audio.src === currentTrack.src) {
                        currentProgress = audio.currentTime;
                        currentDuration = audio.duration;
                        playerIsPlaying = !audio.paused && !audio.ended;
                    } else if (ytPlayer && currentTrack.iframeSrc && currentTrack.iframeSrc.includes('youtube.com')) {
                        currentProgress = ytPlayer.getCurrentTime();
                        currentDuration = ytPlayer.getDuration();
                        playerIsPlaying = ytPlayer.getPlayerState() === YT.PlayerState.PLAYING;
                    } else if (spotifyPlayer && currentTrack.spotifyUri) {
                        try {
                            const state = await spotifyPlayer.getCurrentState();
                            if (state && !state.paused) { // Only update if state is available and not paused
                                currentProgress = state.position / 1000;
                                currentDuration = state.duration / 1000;
                                playerIsPlaying = !state.paused;
                            }
                        } catch (e) { /* ignore */ }
                    }

                    // Update compact playbar
                    if (currentTimeSpan) currentTimeSpan.textContent = formatTime(currentProgress);
                    if (progressBar) {
                        progressBar.max = currentDuration;
                        progressBar.value = currentProgress;
                    }

                    // Update full-screen player
                    if (fullScreenCurrentTime) fullScreenCurrentTime.textContent = formatTime(currentProgress);
                    if (fullScreenProgressBar) {
                        fullScreenProgressBar.max = currentDuration;
                        fullScreenProgressBar.value = currentProgress;
                    }

                    // Update play/pause icons for both playbars
                    if (playPauseBtn) {
                        if (playerIsPlaying) {
                            playIcon.classList.add('hidden');
                            pauseIcon.classList.remove('hidden');
                        } else {
                            playIcon.classList.remove('hidden');
                            pauseIcon.classList.add('hidden');
                        }
                    }
                    if (fullPlayPauseBtn) {
                        if (playerIsPlaying) {
                            fullPlayIcon.classList.add('hidden');
                            fullPauseIcon.classList.remove('hidden');
                        } else {
                            fullPlayIcon.classList.remove('hidden');
                            fullPauseIcon.classList.add('hidden');
                        }
                    }

                    if (!playerIsPlaying && currentProgress >= currentDuration && currentDuration > 0) {
                        clearInterval(progressBarInterval);
                        progressBarInterval = null;
                        // Reset UI if track truly ended
                        if (currentTimeSpan) currentTimeSpan.textContent = '0:00';
                        if (progressBar) progressBar.value = 0;
                        if (playPauseBtn) {
                            playIcon.classList.remove('hidden');
                            pauseIcon.classList.add('hidden');
                        }
                        if (fullScreenCurrentTime) fullScreenCurrentTime.textContent = '0:00';
                        if (fullScreenProgressBar) fullScreenProgressBar.value = 0;
                        if (fullPlayPauseBtn) {
                            fullPlayIcon.classList.remove('hidden');
                            fullPauseIcon.classList.add('hidden');
                        }
                    }
                }, 1000);
            }
        } else {
            console.log("updatePlayerUI: currentTrack is null/undefined for tracklist album.");
            displayTitle = playingAlbum.title || 'Unknown Title';
            displayArtist = playingAlbum.artist || 'Unknown Artist';
            displayCoverArt = playingAlbum.coverArt || 'https://placehold.co/64x64/4a4a4a/ffffff?text=Album';
            displayCoverArtLarge = playingAlbum.coverArt || 'https://placehold.co/300x300/4a4a4a/ffffff?text=Album';

            if (progressBar) { progressBar.value = 0; progressBar.max = 0; progressBar.disabled = true; }
            if (currentTimeSpan) currentTimeSpan.textContent = '0:00';
            if (totalTimeSpan) totalTimeSpan.textContent = '0:00';

            if (fullScreenProgressBar) { fullScreenProgressBar.value = 0; fullScreenProgressBar.max = 0; fullScreenProgressBar.disabled = true; }
            if (fullScreenCurrentTime) fullScreenCurrentTime.textContent = '0:00';
            if (fullScreenTotalTime) fullScreenTotalTime.textContent = '0:00';

            togglePlayerControls(true);
            if (progressBarInterval) clearInterval(progressBarInterval);
            progressBarInterval = null;
        }
    }

    // Apply the determined display info to the compact playbar UI
    if (currentAlbumArt) currentAlbumArt.src = displayCoverArt;
    if (currentSongTitle) {
        currentSongTitle.textContent = displayTitle;
        currentSongTitle.style.overflow = 'hidden';
        currentSongTitle.style.whiteSpace = 'nowrap';
        currentSongTitle.style.textOverflow = 'ellipsis';
    }
    if (currentArtistName) {
        currentArtistName.textContent = displayArtist;
        currentArtistName.style.overflow = 'hidden';
        currentArtistName.style.whiteSpace = 'nowrap';
        currentArtistName.style.textOverflow = 'ellipsis';
    }

    // Apply the determined display info to the full-screen player UI
    if (fullScreenAlbumArt) fullScreenAlbumArt.src = displayCoverArtLarge;
    if (fullScreenSongTitle) fullScreenSongTitle.textContent = displayTitle;
    if (fullScreenArtistName) fullScreenArtistName.textContent = displayArtist;
    if (fullScreenSongTitleLarge) fullScreenSongTitleLarge.textContent = displayTitle;
    if (fullScreenArtistNameLarge) fullScreenArtistNameLarge.textContent = displayArtist;

    // Update play/pause icon in both play bars (always reflect current player state if controllable)
    let isPlaying = false;
    if (currentTrack && currentTrack.src && !audio.paused && audio.src === currentTrack.src) {
        isPlaying = true;
    } else if (currentTrack && ytPlayer && currentTrack.iframeSrc && currentTrack.iframeSrc.includes('youtube.com') && ytPlayer.getPlayerState() === YT.PlayerState.PLAYING) {
        isPlaying = true;
    } else if (currentTrack && spotifyPlayer && currentTrack.spotifyUri) {
        try {
            const state = await spotifyPlayer.getCurrentState();
            if (state && !state.paused && state.track_window.current_track.uri === currentTrack.spotifyUri) {
                isPlaying = true;
            }
        } catch (e) { /* ignore */ }
    } else if (isEmbeddedAlbum && playingAlbum) {
        isPlaying = true;
    }

    if (playPauseBtn) {
        if (isPlaying) {
            playIcon.classList.add('hidden');
            pauseIcon.classList.remove('hidden');
        } else {
            playIcon.classList.remove('hidden');
            pauseIcon.classList.add('hidden');
        }
    }
    if (fullPlayPauseBtn) {
        if (isPlaying) {
            fullPlayIcon.classList.add('hidden');
            fullPauseIcon.classList.remove('hidden');
        } else {
            fullPlayIcon.classList.remove('hidden');
            fullPauseIcon.classList.add('hidden');
        }
    }
    // Update repeat/shuffle button states
    if (repeatBtn) repeatBtn.classList.toggle('active', isRepeat);
    if (shuffleBtn) shuffleBtn.classList.toggle('active', isShuffle);
    if (fullRepeatBtn) fullRepeatBtn.classList.toggle('active', isRepeat);
    if (fullShuffleBtn) fullShuffleBtn.classList.toggle('active', isShuffle);
     updatePlaybarLikeState();
      updatePopupLikeState();

// NEW: Full-Screen Player Elements
// ... other existing code
const fullScreenAddBtn = document.getElementById('full-screen-add-btn');
document.addEventListener('DOMContentLoaded', () => {
    // ... existing code
    
    // Wire up the new full-screen like button
    if (fullScreenAddBtn) {
        fullScreenAddBtn.addEventListener('click', (ev) => {
            ev.preventDefault();
            toggleLikeCurrentSong();
        });
    }
});

function updatePlaybarLikeState() {
    const mainBtn = document.getElementById('mobile-add-btn') || document.querySelector('.playbar-add-btn');
    const fullScreenBtn = document.getElementById('full-screen-add-btn');

    const song = getCurrentSongForLike();
    
    // If no song is playing, hide both buttons
    if (!song) {
        if (mainBtn) mainBtn.classList.remove('liked');
        if (fullScreenBtn) fullScreenBtn.classList.remove('liked');
        return;
    }

    const liked = LikedStore.get().some(x => LikedStore.isSame(x, song));

    // Update the main playbar button
    if (mainBtn) {
        mainBtn.classList.toggle('liked', !!liked);
        const plusIcon = mainBtn.querySelector('.icon-plus');
        const checkIcon = mainBtn.querySelector('.icon-check');
        if (plusIcon && checkIcon) {
            plusIcon.style.display = liked ? 'none' : 'block';
            checkIcon.style.display = liked ? 'block' : 'none';
        }
    }

    // Update the new full-screen button
    if (fullScreenBtn) {
        fullScreenBtn.classList.toggle('liked', !!liked);
        const plusIcon = fullScreenBtn.querySelector('.icon-plus');
        const checkIcon = fullScreenBtn.querySelector('.icon-check');
        if (plusIcon && checkIcon) {
            plusIcon.style.display = liked ? 'none' : 'block';
            checkIcon.style.display = liked ? 'block' : 'none';
        }
    }
}

updateCompactPlayButtonIcons();

}
/**
 * Updates the icons of all compact play buttons in the playlist.
 */


// A single function to close all overlays and popups
function closeAllPopups() {
    const mobileOverlay = document.getElementById('mobile-search-overlay');
    const smallPopup = document.getElementById('unique-search-popup');
    const libraryPopup = document.getElementById('library-popup');
    const likedSongsOverlay = document.getElementById('likedSongsOverlay');
    const albumOverlay = document.getElementById('albumOverlay');
    const songOptionsPopup = document.getElementById('song-options-popup');
    const mainAuthPopup = document.getElementById('popup-overlay');
    const playlistDetailsOverlay = document.getElementById('playlist-details-overlay'); // NEW

    if (mobileOverlay) mobileOverlay.classList.remove('open');
    if (smallPopup) smallPopup.classList.add('unique-hidden');
    if (libraryPopup) libraryPopup.classList.add('hidden');
    if (likedSongsOverlay) likedSongsOverlay.classList.remove('open');
    if (albumOverlay) closeAlbumOverlay(); // This relies on your existing function
    if (songOptionsPopup) closeSongOptionsPopup(); // This relies on your existing function
    if (mainAuthPopup) mainAuthPopup.classList.add('invisible', 'opacity-0');
    if (playlistDetailsOverlay) playlistDetailsOverlay.classList.add('hidden');
    // Restore default body overflow for mobile
    document.body.style.overflow = 'auto';

    // Remove the `unique-active` class from all footer links
    const navLinks = document.querySelectorAll('.unique-footer-nav .unique-nav-link');
    navLinks.forEach(link => link.classList.remove('unique-active'));
}

// A centralized navigation function
function navigateTo(target) {
    // Step 1: Always close everything first to ensure a clean state
    closeAllPopups();

    // Step 2: Based on the target, show the correct UI and highlight the footer button
    switch(target) {
        case 'home':
            // The home view is the default, so no special popup needs to be opened.
            // The main content is already visible.
            document.querySelector('.unique-footer-nav .unique-nav-link:nth-child(1)').classList.add('unique-active');
            break;
        case 'search':
            // The search button uses two different popups, one for mobile and one for desktop.
            if (window.innerWidth <= 1024) {
                document.getElementById('mobile-search-overlay').classList.add('open');
            } else {
                document.getElementById('unique-search-popup').classList.remove('unique-hidden');
            }
            document.querySelector('#unique-search-icon-link').classList.add('unique-active');
            break;
        case 'library':
            document.getElementById('library-popup').classList.remove('hidden');
            document.querySelector('#your-library-link').classList.add('unique-active');
            break;
        case 'premium':
            // Since there's no UI for this, you can just show a message.
            showMessageBox('Premium features are not yet implemented.', 'info');
            document.querySelector('.unique-nav-link[href="#premium"]').classList.add('unique-active');
            break;
    }
}

// script.js
// ... (your existing utility functions)

/**
 * Fetches all of the user's playlists from the backend.
 */
// --- START: REPLACEMENT for fetchUserPlaylists function ---
async function fetchUserPlaylists() {
    const token = localStorage.getItem('userToken');
    if (!token) {
        console.warn("User not logged in, cannot fetch playlists.");
        return false; // Return a clear failure signal
    }
    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/playlists`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (response.ok) {
            currentUserPlaylists = await response.json();
            renderUserPlaylistsInLibrary(); // This updates the main library view
            return true; // Return a clear success signal
        } else {
            console.error("Failed to fetch user playlists:", await response.text());
            return false; // Return failure
        }
    } catch (error) {
        console.error("Network error fetching user playlists:", error);
        return false; // Return failure
    }
}
// --- END: REPLACEMENT for fetchUserPlaylists function ---

/**
 * Renders the user's playlists in the library sidebar.
 */
// in script.js
// REPIACE the old renderUserPlaylistsInLibrary function with this one

function renderUserPlaylistsInLibrary() {
    // Find the container fresh every time to avoid issues with global variables
    const container = document.getElementById('user-playlists-container');
    if (!container) {
        console.error("Playlist container not found in the DOM.");
        return;
    }

    // Clear previous playlists
    container.innerHTML = '';

    // Attach the click listener to the container if it's not already there
    if (!container.dataset.listenerAttached) {
        container.addEventListener('click', (event) => {
            const playlistItem = event.target.closest('.swarify-playlist-item');
            if (playlistItem) {
                const playlistId = playlistItem.dataset.playlistId;
                // Find the clicked playlist from the global list of playlists
                const clickedPlaylist = currentUserPlaylists.find(p => p._id === playlistId);
                if (clickedPlaylist) {
                    currentPlaylist = clickedPlaylist;
                    // This function makes the playlist details view appear
                    openPlaylistDetailsOverlay(clickedPlaylist);
                }
            }
        });
        container.dataset.listenerAttached = 'true'; // Mark that the listener has been added
    }

    const token = localStorage.getItem('userToken');
    if (!token) {
        container.innerHTML = '<div class="p-2 text-gray-500 text-sm text-center">Log in to view playlists.</div>';
        return;
    }

    if (currentUserPlaylists.length === 0) {
        container.innerHTML = '<div class="p-2 text-gray-500 text-sm text-center">You have no playlists yet.</div>';
        return;
    }

    // Create and append each playlist item
    currentUserPlaylists.forEach(playlist => {
        const playlistItem = document.createElement('div');
        playlistItem.className = 'swarify-playlist-item flex items-center p-2 rounded-lg hover:bg-[#282828] cursor-pointer';
        playlistItem.dataset.playlistId = playlist._id;

        const songCount = playlist.songs ? playlist.songs.length : 0;
        const playlistCover = (playlist.coverArt && playlist.coverArt !== 'undefined')
            ? playlist.coverArt
            : 'https://placehold.co/48x48/333/ffffff?text=P';

        playlistItem.innerHTML = `
            <img src="${playlistCover}" alt="${playlist.name} cover" class="w-12 h-12 rounded-lg object-cover mr-3">
            <div>
                <h3 class="text-base font-medium">${escapeHtml(playlist.name)}</h3>
                <p class="text-sm text-gray-400">Playlist • ${songCount} song${songCount === 1 ? '' : 's'}</p>
            </div>
        `;
        container.appendChild(playlistItem);
    });
}

/**
 * Creates a new playlist with the given name and adds the current song if available.
 */
/**
 * Creates a new playlist. If a song was selected to be added before creation,
 * it adds that song to the new playlist. Otherwise, it adds the currently playing song.
 */
// in script.js, find and replace the entire createPlaylist function

async function createPlaylist(name) {
    const token = localStorage.getItem('userToken');
    if (!token) {
        showMessageBox("You must be logged in to create a playlist.", 'error');
        return;
    }
    
    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/playlists`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name: name })
        });

        const responseData = await response.json();
        
        // --- DEBUGGING & FIX ---
        // This log will show you the exact structure of what your backend is sending.
        console.log("Backend response after creating playlist:", responseData);

        // Defensively find the new playlist object and its ID.
        // The backend might return the playlist directly, or nested under a key like 'playlist'.
        const newPlaylist = responseData.playlist || responseData; 
        const newPlaylistId = newPlaylist._id || newPlaylist.id; // Check for both _id and id
        
        // Proceed only if the request was OK AND we found a valid ID.
        if (response.ok && newPlaylistId) {
            showMessageBox(`Playlist "${name}" created successfully!`, 'success');
            
            // Add the new playlist to our local data model.
            currentUserPlaylists.push(newPlaylist);

            const songToAddString = localStorage.getItem('songToAddAfterCreatingPlaylist');
            if (songToAddString) {
                const songToAdd = JSON.parse(songToAddString);
                
                // Use the valid ID we found to add the song.
                await addSongToPlaylist(newPlaylistId, songToAdd);
                
                localStorage.removeItem('songToAddAfterCreatingPlaylist');
            }
            
            // Re-render the library from our updated local data.
            renderUserPlaylistsInLibrary(); 
        } else {
            // Handle cases where the request failed or the response was missing an ID.
            const errorMessage = responseData.message || 'Failed to create playlist or invalid response from server.';
            showMessageBox(errorMessage, 'error');
            console.error("Error: Failed to create playlist or missing '_id' in server response:", responseData);
        }
    } catch (error) {
        showMessageBox('Network error creating playlist.', 'error');
        console.error("Network error:", error);
    }
}
/**
 * Adds a song to a specific playlist on the backend.
 */
// START: Replace this function in script.js
async function addSongToPlaylist(playlistId, song) {
    const token = localStorage.getItem('userToken');
    if (!token) return false; // Return false if not logged in

    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/playlists/${playlistId}/songs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ song_details: song })
        });

        if (response.ok) {
            console.log("Song added to playlist successfully.");
            showMessageBox(`Added "${song.title}" to playlist.`, 'success');
            return true; // Return true on success
        } else {
            const error = await response.json();
            console.error("Failed to add song to playlist:", error);
            showMessageBox('Failed to add song to playlist.', 'error');
            return false; // Return false on failure
        }
    } catch (error) {
        console.error("Network error adding song to playlist:", error);
        showMessageBox('Network error. Could not add song to playlist.', 'error');
        return false; // Return false on network error
    }
}
// END: Replacement for addSongToPlaylist

/**
 * Opens the playlist details overlay and populates it.
 */
// START: Replace this function in script.js
// --- START: NEW Helper function to darken an RGB color ---
function darkenColor(rgbArray, factor) {
    return rgbArray.map(color => Math.max(0, Math.floor(color * factor)));
}
// --- END: NEW Helper function ---


// --- REPLACEMENT for openPlaylistDetailsOverlay function ---
async function openPlaylistDetailsOverlay(playlist) {
    console.log("Opening new playlist overlay for:", playlist.name);
    currentPlaylistForView = playlist;

    const overlay = document.getElementById('playlist-details-overlay');
    const scrollContent = document.getElementById('playlist-scroll-content');
    if (!overlay || !scrollContent) return;
    
    // Reset scroll position and state
    scrollContent.scrollTop = 0;
    overlay.classList.remove('is-scrolled');
    
    overlay.classList.remove('hidden');
    setTimeout(() => {
        overlay.classList.add('active');
    }, 10);
    
    document.body.style.overflow = 'hidden';

    // Get all necessary elements
    const backgroundGradient = document.getElementById('playlist-background-gradient');
    const coverArtImg = document.getElementById('playlist-cover-art');
    const titleH1 = document.getElementById('playlist-title-h1');
    const compactTitle = document.getElementById('playlist-compact-title');
    const mainBackBtn = document.getElementById('playlist-main-back-btn');
    const compactBackBtn = document.getElementById('playlist-compact-back-btn');

    // --- Back Button Listeners ---
    mainBackBtn.onclick = closePlaylistDetailsOverlay;
    compactBackBtn.onclick = closePlaylistDetailsOverlay;

    // --- Dynamic Background Logic ---
    const coverArt = (playlist.songs && playlist.songs.length > 0) 
        ? (playlist.songs[0].img || playlist.songs[0].coverArt)
        : 'https://placehold.co/192x192/4a4a4a/ffffff?text=Playlist';
    
    if (coverArtImg) {
        // **FIX**: Add the crossOrigin attribute to allow color analysis of images from other domains.
        coverArtImg.crossOrigin = "Anonymous";

        const extractAndSetColor = () => {
            try {
                const colorThief = new ColorThief();
                const dominantColor = colorThief.getColor(coverArtImg);
                const darkColorArray = darkenColor(dominantColor, 0.4); // Factor of 0.4 for a dark shade
                const darkRgbColor = `rgb(${darkColorArray[0]}, ${darkColorArray[1]}, ${darkColorArray[2]})`;
                overlay.style.setProperty('--playlist-bg-color', darkRgbColor);
            } catch (e) {
                console.error("ColorThief error:", e);
                overlay.style.setProperty('--playlist-bg-color', '#2a2a2a'); // Fallback color
            }
        };

        // Set up event listeners
        coverArtImg.onload = extractAndSetColor;
        coverArtImg.onerror = () => {
             overlay.style.setProperty('--playlist-bg-color', '#2a2a2a');
        };

        // Set the image source *after* setting the crossOrigin attribute.
        coverArtImg.src = coverArt;

        // **FIX**: Handle cached images where the 'onload' event might not fire again.
        if (coverArtImg.complete) {
            extractAndSetColor();
        }
    }

    // Set Titles and other info
    if (titleH1) titleH1.textContent = playlist.name;
    if (compactTitle) compactTitle.textContent = playlist.name;
    
    const creatorAvatar = document.getElementById('playlist-creator-avatar');
    const creatorName = document.getElementById('playlist-creator-name');
    const durationInfo = document.getElementById('playlist-duration-info');
    const mainPlayBtn = document.getElementById('playlist-play-btn');
    const compactPlayBtn = document.getElementById('playlist-compact-play-btn');

    const userName = localStorage.getItem('loggedInUserName') || 'You';
    if (creatorName) creatorName.textContent = userName;
    if (creatorAvatar) creatorAvatar.textContent = userName.charAt(0).toUpperCase();

    const totalSeconds = playlist.songs ? playlist.songs.reduce((acc, song) => acc + parseDurationToSeconds(song.duration), 0) : 0;
    const totalMinutes = Math.round(totalSeconds / 60);
    if (durationInfo) durationInfo.textContent = `${totalMinutes} min`;

 const playPlaylist = () => {
    if (playlist.songs && playlist.songs.length > 0) {
        const firstSong = playlist.songs[0];
        const currentTrack = playingAlbum && playingAlbum.tracks ? playingAlbum.tracks[currentTrackIndex] : null;

        // Check if the current song is already the first song of this playlist
        if (currentTrack && currentTrack.id === firstSong.id) {
            togglePlayback();
        } else {
            // If it's a new song, find the album, open its details, and play the track
            const album = allAlbumsData.find(a => a.id === firstSong.albumId);
            if (album) {
                openAlbumDetails(album);
                playTrack(album.tracks[firstSong.trackIndex], firstSong.trackIndex);
            }
        }
    } else {
        // Optional: show a message if the playlist is empty
        showMessageBox("This playlist is empty.", "info");
    }
};
    if (mainPlayBtn) mainPlayBtn.onclick = playPlaylist;
    if (compactPlayBtn) compactPlayBtn.onclick = playPlaylist;

    // Render songs and setup listeners
    renderPlaylistSongs(playlist);
    setupPlaylistScrollListener();
    setupPlaylistSearchListeners();
    fetchAndRenderRecommendedSongs(playlist._id);
}

// END: Replacement for openPlaylistDetailsOverlay

/**
 * Renders the songs within the playlist details overlay.
 */
function renderPlaylistSongs(playlist) {
    const playlistSongsContainer = document.getElementById('playlist-songs-container');
    if (!playlistSongsContainer) return;

    playlistSongsContainer.innerHTML = ''; // Clear existing songs

    // Handle the case where the playlist is empty
    if (!playlist.songs || playlist.songs.length === 0) {
        playlistSongsContainer.innerHTML = '<p class="text-center text-gray-400 py-8">This playlist has no songs yet.</p>';
        return;
    }

    // Loop through each song and create its row element
    playlist.songs.forEach(song => {
        const songRow = document.createElement('div');
        songRow.className = 'flex items-center gap-4 p-2 rounded-lg hover:bg-[#282828] cursor-pointer';

        // **Correction 1: Added the 3-dot button to the HTML structure**
        songRow.innerHTML = `
            <img src="${song.img || song.coverArt || 'https://placehold.co/44x44/333/fff?text=S'}" alt="${escapeHtml(song.title)} cover" class="w-11 h-11 rounded-md object-cover flex-shrink-0">
            <div class="flex-1 min-w-0">
                <div class="font-semibold text-white truncate">${escapeHtml(song.title)}</div>
                <div class="text-sm text-gray-400 truncate">${escapeHtml(song.artist)}</div>
            </div>
            <div class="text-sm text-gray-400">${formatTimeDisplay(song.duration)}</div>
            <button class="playlist-song-options-btn ml-auto p-2 rounded-full" aria-label="More options for ${escapeHtml(song.title)}">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="12" cy="19" r="2"/></svg>
            </button>
        `;
        
        // Main click listener for the row (to play the song)
        songRow.addEventListener('click', (event) => {
            // **Correction 2: Ensure clicking the button doesn't also play the song**
            if (event.target.closest('.playlist-song-options-btn')) {
                return; // Do nothing if the options button was clicked
            }

            const album = allAlbumsData.find(a => a.id === song.albumId);
            if (album && album.tracks && album.tracks[song.trackIndex]) {
                openAlbumDetails(album);
                playTrack(album.tracks[song.trackIndex], song.trackIndex);
            } else {
                console.error(`Error: Could not find album or track for song:`, song);
                showMessageBox('Could not load the album for this song.', 'error');
            }
        });
        
        // **Correction 3: Add a specific listener for the new options button**
        const optionsBtn = songRow.querySelector('.playlist-song-options-btn');
        if (optionsBtn) {
            optionsBtn.addEventListener('click', (event) => {
                event.stopPropagation(); // Stop the click from bubbling up to the row
                // This function opens the popup with the correct song's details
                openPlaylistSongOptionsPopup(song, playlist._id);
            });
        }
        
        playlistSongsContainer.appendChild(songRow);
    });
}

/**
 * Fetches and renders recommended songs for a playlist.
 */
// script.js

// ... (your existing code) ...

/**
 * Fetches and renders recommended songs for a playlist.
 */
// START: Replace this function in script.js
// START: Replace this function in script.js
// START: Replace this function in script.js
async function fetchAndRenderRecommendedSongs(playlistId) {
    if (!recommendedSongsContainer) return;
    recommendedSongsContainer.innerHTML = '<p class="text-center text-gray-400 py-4 col-span-full">Loading recommendations...</p>';
    const token = localStorage.getItem('userToken');
    if (!token) {
        recommendedSongsContainer.innerHTML = '';
        return;
    }

    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/playlists/recommendations/${playlistId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const recommendations = await response.json();
        
        if (response.ok && recommendations.length > 0) {
            recommendedSongsContainer.innerHTML = ''; 
            
            recommendations.forEach(album => {
                if (album.tracks && album.tracks.length > 0) {
                    const song = album.tracks[0]; 
                    const songItem = document.createElement('div');
                    songItem.className = 'flex items-center gap-4 p-2 rounded-lg hover:bg-[#282828]';
                    
                    songItem.innerHTML = `
                        <img src="${song.img || album.coverArt}" alt="${song.title} cover" class="w-11 h-11 rounded-md object-cover">
                        <div class="flex-1 min-w-0">
                            <div class="font-semibold text-white truncate cursor-pointer">${escapeHtml(song.title)}</div>
                            <div class="text-sm text-gray-400 truncate">${escapeHtml(song.artist || album.artist)}</div>
                        </div>
                        <button class="add-recommended-btn p-2 rounded-full hover:bg-gray-700">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" /></svg>
                        </button>
                    `;
                    
                    songItem.querySelector('.font-semibold').addEventListener('click', () => {
                        openAlbumDetails(album);
                        playTrack(song, 0);
                    });

                    const addButton = songItem.querySelector('.add-recommended-btn');
                    addButton.addEventListener('click', async () => {
                        // --- THIS IS THE FIX ---
                        // Safely get the album ID, whether it's named 'id' or '_id'
                        const currentAlbumId = album.id || album._id;

                        // Add a check to prevent adding a song without an ID
                        if (!currentAlbumId) {
                            showMessageBox('Cannot add song: Album ID is missing.', 'error');
                            return;
                        }

                        const songDetails = {
                             ...song,
                             albumId: currentAlbumId, // Use the safe ID
                             trackIndex: 0,
                             coverArt: album.coverArt
                        };
                        // --- END OF FIX ---
                        
                        const success = await addSongToPlaylist(playlistId, songDetails);

                        if (success) {
                            addButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>`;
                            addButton.disabled = true;

                            const playlistToUpdate = currentUserPlaylists.find(p => p._id === playlistId);
                            if (playlistToUpdate) {
                                playlistToUpdate.songs.push(songDetails);
                                renderPlaylistSongs(playlistToUpdate);

                                const songCount = playlistToUpdate.songs.length;
                                const totalSeconds = playlistToUpdate.songs.reduce((acc, s) => acc + parseDurationToSeconds(s.duration), 0);
                                const totalMinutes = Math.round(totalSeconds / 60);

                                if (document.getElementById('playlist-duration-info')) {
                                     document.getElementById('playlist-duration-info').textContent = `${totalMinutes} min`;
                                }
                            }
                        }
                    });

                    recommendedSongsContainer.appendChild(songItem);
                }
            });
        } else {
            recommendedSongsContainer.innerHTML = '<p class="text-center text-gray-400 py-4 col-span-full">No recommendations available.</p>';
        }
    } catch (error) {
        console.error("Network error fetching recommendations:", error);
        recommendedSongsContainer.innerHTML = '<p class="text-center text-gray-400 py-4 col-span-full">Could not load recommendations.</p>';
    }
}
// END: Replacement for fetchAndRenderRecommendedSongs
// END: Replacement for fetchAndRenderRecommendedSongs
// END: Replacement for fetchAndRenderRecommendedSongs

// ... (rest of your existing code) ...

// You can add this right after your existing utility functions.

// Plays a specific track, handling different media types (YouTube, Spotify, SoundCloud, native audio).
// It updates the player bar UI and manages the progress bar.
async function playTrack(track, indexInAlbum, initialSeekTime = 0) { 
    
    
     // ADD THIS LINE AT THE TOP OF THE FUNCTION
    if (!isPlayingFromLikedSongs) {
        isPlayingFromLikedSongs = false;
    }// Added initialSeekTime parameter
    // Show the main play bar when a song starts playing
    if (mainPlayBar) {
        mainPlayBar.style.display = 'flex'; // Ensure playbar is visible
        console.log("playTrack: mainPlayBar set to display: flex.");
    }

    if (!track) {
        console.error("Attempted to play null or undefined track.");
        return;
    }

    // Determine if the track is an embedded type that we cannot control via API
    const isControllableEmbeddedTrack = (track.iframeSrc && track.iframeSrc.includes('https://www.youtube.com/embed/')) || track.spotifyUri;
    const isNonControllableEmbeddedTrack = track.rawHtmlEmbed || track.fullSoundcloudEmbed || track.audiomackEmbed || track.soundcloudEmbed; // Added soundcloudEmbed

    // Playback is stopped ONLY when a new controllable track is explicitly played.
    // This ensures only one controllable audio source is active.
    // Also stop if we are switching from an embedded to a controllable track.
    // IMPORTANT: For non-controllable embedded tracks, we do NOT stop previous playback here.
    if (track.src || isControllableEmbeddedTrack) {
        stopAllPlaybackUI(); // Stop all previous playback if a new controllable track is starting
        console.log("stopAllPlaybackUI called before playing new controllable track.");
        playingAlbum = currentAlbum; // Set playingAlbum for controllable tracks
        console.log("playTrack: playingAlbum set to:", playingAlbum ? playingAlbum.title : "null", "currentTrackIndex:", indexInAlbum);
        currentlyPlayedCardId = playingAlbum ? playingAlbum.id : null; // Set the ID of the playing card
        hidePlayedCard(); // Hide the playing card from other sections
    } else {
        // For non-controllable embedded tracks: avoid killing an already playing embedded album when merely opening/searching another embedded album.
        const isBackgroundEmbeddedPlaying = playingAlbum && (playingAlbum.rawHtmlEmbed || playingAlbum.fullSoundcloudEmbed || playingAlbum.audiomackEmbed || playingAlbum.iframeSrc);
        const isClickedTrackEmbedded = track && (track.rawHtmlEmbed || track.fullSoundcloudEmbed || track.audiomackEmbed || track.iframeSrc);
        const isSwitchingEmbeddedToEmbedded = isBackgroundEmbeddedPlaying && isClickedTrackEmbedded && playingAlbum && currentAlbum && playingAlbum.id !== currentAlbum.id;

        if (!isSwitchingEmbeddedToEmbedded) {
            playingAlbum = currentAlbum; // Set playingAlbum for non-controllable embedded tracks or other transitions
            console.log("playTrack: playingAlbum set to:", playingAlbum ? playingAlbum.title : "null", "currentTrackIndex:", indexInAlbum);
            currentlyPlayedCardId = playingAlbum ? playingAlbum.id : null; // Set the ID of the playing card
            hidePlayedCard(); // Hide the playing card from other sections
        } else {
            console.log("playTrack: embedded-to-embedded transition detected; preserving background embedded playback.");
            // Do not overwrite playingAlbum so existing embedded playback continues
        }
    }


    // Update global current track index
    if (currentAlbum && indexInAlbum !== undefined) {
        currentTrackIndex = indexInAlbum;
    }

    // Update player UI (compact and full-screen)
    updatePlayerUI();
     // NEW: Update like state immediately after UI update
    updatePlaybarLikeState();
    updatePopupLikeState();

    // Update fixed top heading
    if (fixedTopAlbumArt) fixedTopAlbumArt.src = (playingAlbum ? (playingAlbum.coverArt || 'https://placehold.co/40x40/4a4a4a/ffffff?text=Album') : track.img || 'https://placehold.co/40x40/4a4a4a/ffffff?text=Album');
    if (fixedTopAlbumTitle) fixedTopAlbumTitle.textContent = (playingAlbum ? (playingAlbum.title || 'Unknown Album') : playingAlbum ? playingAlbum.title : (track.title || 'Unknown Album'));
    updateFixedTopHeadingVisibility();


    // --- Play Raw HTML Embed (e.g., Spotify iframe for playlists) or Audiomack/SoundCloud (non-controllable) ---
    // For these, we only update the mini-player visually, and the full embed is handled by openAlbumDetails.
    if (isNonControllableEmbeddedTrack) {
        console.log("Playing via Non-Controllable Embed (Player Bar):", track.title);
        // Ensure player image is visible and any dynamic mini-player iframe is removed
        if (currentAlbumArt) currentAlbumArt.style.display = 'block';
        const dynamicPlayerContainer = playerLeft.querySelector('#youtube-player-container');
        if (dynamicPlayerContainer) dynamicPlayerContainer.remove();

        // Update play/pause button to indicate non-controllable state (e.g., a "pause" icon that doesn't function)
        if (playPauseBtn) {
            playIcon.classList.add('hidden');
            pauseIcon.classList.remove('hidden'); // Show pause icon, but it won't be interactive
        }
        if (progressBar) progressBar.value = 0; // Cannot get real progress
        if (currentTimeSpan) currentTimeSpan.textContent = '0:00';
        if (totalTimeSpan) totalTimeSpan.textContent = 'N/A';

        togglePlayerControls(false); // Disable main controls for embedded content as they cannot control the iframe
    }
    // --- Play Spotify Track (via SDK) ---
    else if (track.spotifyUri && spotifyPlayer && spotifyAccessToken && spotifyDeviceId) {
        console.log("Playing via Spotify Web Playback SDK:", track.spotifyUri);
        // Ensure player image is hidden and a dynamic mini-player container is created for the SDK player
        if (currentAlbumArt) currentAlbumArt.style.display = 'none';
        const dynamicPlayerContainer = playerLeft.querySelector('#youtube-player-container');
        if (dynamicPlayerContainer) dynamicPlayerContainer.remove();

        try {
            const playOptions = {
                device_id: spotifyDeviceId,
                uris: [track.spotifyUri],
                position_ms: initialSeekTime * 1000 // Use initialSeekTime
            };

            const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${spotifyDeviceId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${spotifyAccessToken}`
                },
                body: JSON.stringify(playOptions)
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Failed to play Spotify track:', errorData);


                if (response.status === 401) { // Token expired or invalid
                    spotifyAccessToken = null; // Clear token
                }
                if (playPauseBtn) {
                    playIcon.classList.remove('hidden');
                    pauseIcon.classList.add('hidden');
                }
                togglePlayerControls(true); // Re-enable if playback fails
                return;
            }
            console.log('Spotify track started successfully.');
            if (playPauseBtn) {
                playIcon.classList.add('hidden');
                pauseIcon.classList.remove('hidden');
            }
            togglePlayerControls(true); // Enable controls for SDK playback

            // Start updating progress bar for Spotify
            if (progressBarInterval) clearInterval(progressBarInterval);
            progressBarInterval = setInterval(async () => {
                if (spotifyPlayer) {
                    const state = await spotifyPlayer.getCurrentState();
                    if (state && !state.paused) {
                        const currentTime = state.position / 1000; // ms to seconds
                        lastKnownPlaybackPosition = currentTime; // Update global position
                        const duration = state.duration / 1000; // ms to seconds
                        if (duration > 0) {
                            updatePlayerUI(); // Update all UI elements
                        }
                    } else if (state && state.paused && state.position === 0 && state.track_window.current_track.id !== null) {
                        // This indicates the track has ended
                        if (isRepeat) {
                            spotifyPlayer.seek(0);
                            spotifyPlayer.resume();
                        } else if (isShuffle) {
                            currentTrackIndex = Math.floor(Math.random() * currentAlbum.tracks.length);
                            playTrack(currentAlbum.tracks[currentTrackIndex], currentTrackIndex);
                        } else {
                            // Automatically play next song or shift to next album if last song of current album
                            if (playingAlbum && playingAlbum.tracks && currentTrackIndex === playingAlbum.tracks.length - 1) {
                                // Last track of the album finished, try to play next album
                                const currentAlbumIndex = allAlbumsData.findIndex(album => album.id === playingAlbum.id);
                                if (currentAlbumIndex !== -1 && currentAlbumIndex < allAlbumsData.length - 1) {
                                    const nextAlbum = allAlbumsData[currentAlbumIndex + 1];
                                    if (nextAlbum.tracks && nextAlbum.tracks.length > 0) {
                                        playingAlbum = nextAlbum; // Update playingAlbum to the next album
                                        currentTrackIndex = 0; // Reset track index for the new album
                                        openAlbumDetails(nextAlbum); // Open the next album's details if overlay is open
                                        playTrack(nextAlbum.tracks[0], 0);
                                        console.log("Automatically playing first track of next Spotify album.");
                                    } else {
                                        stopAllPlaybackUI();
                                        console.log("Last Spotify track ended, next album has no tracks. Stopping all playback.");
                                    }
                                } else {
                                    stopAllPlaybackUI();
                                    console.log("Last Spotify track ended, no next album. Stopping all playback.");
                                }
                            } else if (playingAlbum && playingAlbum.tracks && currentTrackIndex < playingAlbum.tracks.length - 1) {
                                currentTrackIndex++;
                                playTrack(playingAlbum.tracks[currentTrackIndex], currentTrackIndex);
                                console.log("Automatically playing next Spotify track within the same album.");
                            } else {
                                stopAllPlaybackUI();
                                console.log("Last Spotify track ended, no repeat/shuffle. Stopping all playback.");
                            }
                        }
                    }
                }
            }, 1000);

        } catch (error) {
            console.error("Error playing Spotify track:", error);

            if (playPauseBtn) {
                playIcon.classList.remove('hidden');
                pauseIcon.classList.add('hidden');
            }
            togglePlayerControls(true); // Re-enable if playback fails
        }

    } else if (track.iframeSrc && track.iframeSrc.includes('https://www.youtube.com/embed/')) {
        console.log("Playing via YouTube iframe API:", track.iframeSrc);

        const videoIdMatch = track.iframeSrc.match(/\/embed\/([a-zA-Z0-9_-]+)/);
        const videoId = videoIdMatch ? videoIdMatch[1] : null;
        if (videoId && typeof YT !== 'undefined' && YT.Player) {
            // Hide the player image
            if (currentAlbumArt) currentAlbumArt.style.display = 'none';

            // Create a div placeholder for the YouTube player
            const playerDiv = document.createElement('div');
            playerDiv.id = 'youtube-player-container'; // Fixed ID for easier selection/removal
            playerDiv.style.width = '64px'; // Match album art width
            playerDiv.style.height = '64px'; // Match album art height
            playerDiv.style.borderRadius = '8px'; // Added border-radius
            playerLeft.prepend(playerDiv); // Prepend to appear before track info

            ytPlayer = new YT.Player('youtube-player-container', {
                videoId: videoId,
                playerVars: {
                    'autoplay': 1, // Autoplay when loaded
                    'controls': 0, // Hide YouTube's native controls
                    'modestbranding': 1,
                    'rel': 0, // Do not show related videos
                    'showinfo': 0, // Hide video title and uploader info
                    'enablejsapi': 1, // Enable JavaScript API
                    'origin': window.location.origin // Crucial for API to work in cross-origin iframes
                },
                events: {
                    'onReady': (event) => {
                        event.target.seekTo(initialSeekTime, true); // Use initialSeekTime
                        event.target.playVideo();
                        if (playPauseBtn) {
                            playIcon.classList.add('hidden');
                            pauseIcon.classList.remove('hidden');
                        }
                        // Set initial volume for YouTube player
                        if (volumeBar) event.target.setVolume(volumeBar.value * 100);
                        togglePlayerControls(true); // Enable controls for YouTube playback

                        // Start updating progress bar
                        if (progressBarInterval) clearInterval(progressBarInterval);
                        progressBarInterval = setInterval(() => {
                            if (ytPlayer && ytPlayer.getPlayerState() === YT.PlayerState.PLAYING) {
                                const currentTime = ytPlayer.getCurrentTime();
                                lastKnownPlaybackPosition = currentTime;
                                const duration = ytPlayer.getDuration();
                                if (duration > 0) {
                                    updatePlayerUI(); // Update all UI elements
                                }
                            }
                        }, 1000); // Update every second
                    },
                    'onStateChange': (event) => {
                        if (event.data === YT.PlayerState.PLAYING) {
                            if (playPauseBtn) {
                                playIcon.classList.add('hidden');
                                pauseIcon.classList.remove('hidden');
                            }
                        } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
                            if (playPauseBtn) {
                                playIcon.classList.remove('hidden');
                                pauseIcon.classList.add('hidden');
                            }
                            if (event.data === YT.PlayerState.ENDED) {
                                // Handle track ending for YouTube player
                                if (isRepeat) {
                                    ytPlayer.seekTo(0);
                                    ytPlayer.playVideo();
                                } else if (isShuffle) {
                                    currentTrackIndex = Math.floor(Math.random() * currentAlbum.tracks.length);
                                    playTrack(currentAlbum.tracks[currentTrackIndex], currentTrackIndex);
                                } else {
                                    // Automatically play next song or shift to next album if last song of current album
                                    if (playingAlbum && playingAlbum.tracks && currentTrackIndex === playingAlbum.tracks.length - 1) {
                                        // Last track of the album finished, try to play next album
                                        const currentAlbumIndex = allAlbumsData.findIndex(album => album.id === playingAlbum.id);
                                        if (currentAlbumIndex !== -1 && currentAlbumIndex < allAlbumsData.length - 1) {
                                            const nextAlbum = allAlbumsData[currentAlbumIndex + 1];
                                            if (nextAlbum.tracks && nextAlbum.tracks.length > 0) {
                                                playingAlbum = nextAlbum; // Update playingAlbum to the next album
                                                currentTrackIndex = 0; // Reset track index for the new album
                                                openAlbumDetails(nextAlbum); // Open the next album's details if overlay is open
                                                playTrack(nextAlbum.tracks[0], 0);
                                                console.log("Automatically playing first track of next YouTube album.");
                                            } else {
                                                stopAllPlaybackUI();
                                                console.log("Last YouTube track ended, next album has no tracks. Stopping all playback.");
                                            }
                                        } else {
                                            stopAllPlaybackUI();
                                            console.log("Last YouTube track ended, no next album. Stopping all playback.");
                                        }
                                    } else if (playingAlbum && playingAlbum.tracks && currentTrackIndex < playingAlbum.tracks.length - 1) {
                                        currentTrackIndex++;
                                        playTrack(playingAlbum.tracks[currentTrackIndex], currentTrackIndex);
                                        console.log("Automatically playing next YouTube track within the same album.");
                                    } else {
                                        stopAllPlaybackUI();
                                        console.log("Last YouTube track ended, no repeat/shuffle. Stopping all playback.");
                                    }
                                }
                            }
                        }
                        updateTrackHighlightingInOverlay(); // Update highlighting on state change
                        updatePlayerUI(); // Sync all player UI on state change
                        updateFixedTopHeadingVisibility(); // Sync fixed top heading on state change
                    },
                    'onError': (event) => {
                        console.error("YouTube Player Error:", event.data);
                        showMessageBox("Error playing YouTube video. It might be unavailable or restricted.", 'error');
                        if (playPauseBtn) {
                            playIcon.classList.remove('hidden');
                            pauseIcon.classList.add('hidden');
                        }
                        togglePlayerControls(true); // Re-enable if playback fails
                        updatePlayerUI(); // Sync all player UI on error
                        updateFixedTopHeadingVisibility(); // Sync fixed top heading on error
                    }
                }
            });
        } else {
            console.warn("YouTube video ID not found or YouTube API not loaded.", track.iframeSrc);

            if (playPauseBtn) {
                playIcon.classList.remove('hidden');
                pauseIcon.classList.add('hidden');
            }
            togglePlayerControls(true); // Re-enable controls if playback fails
        }
    } else {
        if (!track.src) {
            console.error("playTrack Error: The selected track is missing a 'src' property and cannot be played.", track);
            showMessageBox("Sorry, this song is currently unavailable.", 'error');
            return; // Stop the function here
        }

        audio.src = track.src;
        audio.currentTime = initialSeekTime;
        audio.play();
        if (playPauseBtn) {
            playIcon.classList.add('hidden');
            pauseIcon.classList.remove('hidden');
        }
        togglePlayerControls(true); // Enable controls for native audio

        audio.onloadedmetadata = () => {
            updatePlayerUI(); // Update all UI elements immediately on metadata load

            // NEW LOGIC: Update the duration in the currentAlbum object and the overlay
            if (currentAlbum && currentAlbum.tracks && currentAlbum.tracks[currentTrackIndex]) {
                const currentTrackInAlbum = currentAlbum.tracks[currentTrackIndex];
                // Only update if the duration is currently 0 or significantly different
                if (currentTrackInAlbum.duration === 0 || Math.abs(currentTrackInAlbum.duration - audio.duration) > 1) { // Check for significant difference
                    currentTrackInAlbum.duration = audio.duration; // Update the stored duration

                    // Find the specific row in the album overlay and update its duration cell
                    const trackRow = albumDetailsTracksBody.querySelector(`tr[data-track-index="${currentTrackIndex}"]`);
                    if (trackRow) {
                        // Assuming the duration is the 4th td (index 3)
                        const durationCell = trackRow.querySelector('td:nth-child(4)');
                        if (durationCell) {
                            durationCell.textContent = formatTime(audio.duration);
                        }
                    }
                }
            }
        };

        // Start updating progress bar for native audio
        if (progressBarInterval) clearInterval(progressBarInterval); // Clear any old interval

        progressBarInterval = setInterval(() => {
            if (!audio.paused && !audio.ended) {
                updatePlayerUI(); // Update all UI elements
                lastKnownPlaybackPosition = audio.currentTime;
            }
        }, 1000);

        audio.onended = () => {
            // This event listener is primarily for native audio. YouTube/Spotify APIs handle their own 'ended' state.
            if (!playingAlbum || !playingAlbum.tracks || playingAlbum.tracks.length === 0) return;

            // If the current track is an embed, we cannot auto-advance/repeat via this event.
            if (playingAlbum.tracks[currentTrackIndex]?.rawHtmlEmbed || playingAlbum.tracks[currentTrackIndex]?.soundcloudEmbed || playingAlbum.tracks[currentTrackIndex]?.audiomackEmbed || playingAlbum.tracks[currentTrackIndex]?.fullSoundcloudEmbed || playingAlbum.tracks[currentTrackIndex]?.iframeSrc) {
                console.warn("Auto-advance/repeat is not supported for raw HTML, SoundCloud, Audiomack, or YouTube embedded content.");
                return;
            }
            if (isRepeat) {
                playTrack(playingAlbum.tracks[currentTrackIndex], currentTrackIndex); // Repeat current track
            } else if (isShuffle) {
                currentTrackIndex = Math.floor(Math.random() * playingAlbum.tracks.length);
                playTrack(playingAlbum.tracks[currentTrackIndex], currentTrackIndex);
            } else {
                // Automatically play next song or shift to next album if last song of current album
                if (playingAlbum && playingAlbum.tracks && currentTrackIndex === playingAlbum.tracks.length - 1) {
                    // Last track of the album finished, try to play next album
                    const currentAlbumIndex = allAlbumsData.findIndex(album => album.id === playingAlbum.id);
                    if (currentAlbumIndex !== -1 && currentAlbumIndex < allAlbumsData.length - 1) {
                        const nextAlbum = allAlbumsData[currentAlbumIndex + 1];
                        if (nextAlbum.tracks && nextAlbum.tracks.length > 0) {
                            playingAlbum = nextAlbum; // Update playingAlbum to the next album
                            currentTrackIndex = 0; // Reset track index for the new album
                            openAlbumDetails(nextAlbum); // Open the next album's details if overlay is open
                            playTrack(nextAlbum.tracks[0], 0);
                            console.log("Automatically playing first track of next native audio album.");
                        } else {
                            stopAllPlaybackUI();
                            console.log("Last native audio track ended, next album has no tracks. Stopping all playback.");
                        }
                    } else {
                        stopAllPlaybackUI();
                        console.log("Last native audio track ended, no next album. Stopping all playback.");
                    }
                } else if (playingAlbum && playingAlbum.tracks && currentTrackIndex < playingAlbum.tracks.length - 1) {
                    currentTrackIndex++;
                    playTrack(playingAlbum.tracks[currentTrackIndex], currentTrackIndex);
                    console.log("Automatically playing next native audio track within the same album.");
                } else {
                    stopAllPlaybackUI();
                    console.log("Last native audio track ended, no repeat/shuffle. Stopping all playback.");
                }
            }
            updatePlayerUI(); // Sync all player UI
            updateFixedTopHeadingVisibility(); // Sync fixed top heading
        };
    }
    // Call the new highlighting function after playback starts/changes
    updateTrackHighlightingInOverlay();
    highlightPlayingLikedSong();
    // Update the main album play button icon
    updateAlbumPlayButtonIcon();
updatePlaylistPlayButtons();
    // If on mobile/tablet, show the full-screen player after playing a track
    // This is now handled by the mainPlayBar click listener for controllable tracks.
    // For embedded tracks, the album overlay itself is the "full player".
    // if (window.innerWidth <= 768) {
    //     showFullScreenPlayer();
    // }
}

/**
 * NEW: Hides the card that is currently playing from all card containers.
 */
function hidePlayedCard() {
    if (!currentlyPlayedCardId) {
        showAllCards(); // Ensure all are visible if nothing is playing
        return;
    }

    // Select all card containers, including those in the overlay
    const allCardContainers = document.querySelectorAll(
        '#trending-songs-cards, #popular-albums-cards, #popular-artists-cards, ' +
        '#more-trending-songs-cards, #explore-more-albums-cards, #explore-popular-artists-cards' // Corrected ID for explore-more-albums-cards
    );

    allCardContainers.forEach(container => {
        const cards = container.querySelectorAll('.card');
        cards.forEach(card => {
            if (card.dataset.albumId === currentlyPlayedCardId) {
                card.classList.add('hidden-on-play'); // Add a class to hide it
            } else {
                card.classList.remove('hidden-on-play'); // Ensure other cards are visible
            }
        });
    });
}

/**
 * NEW: Shows all cards that might have been hidden.
 */
function showAllCards() {
    const allCards = document.querySelectorAll('.card.hidden-on-play');
    allCards.forEach(card => {
        card.classList.remove('hidden-on-play');
    });
}


/**
 * Updates the highlighting and icons for tracks in the album overlay.
 * This function is called whenever playback state might have changed or the overlay is opened.
 */
async function updateTrackHighlightingInOverlay() {
    if (!albumDetailsTracksBody || !currentAlbum || !currentAlbum.tracks) {
        return;
    }

    document.querySelectorAll('#albumDetails-tracks tr').forEach(async (row, i) => {
        const iconCell = row.querySelector('td:first-child');
        const trackInRow = currentAlbum.tracks[i];

        // Reset all rows first
        row.classList.remove('playing', 'paused');
        row.style.backgroundColor = row.classList.contains('highlighted-search-result') ? 'rgba(30, 215, 96, 0.3)' : 'transparent';
        row.style.color = '';
        row.querySelectorAll('td').forEach(td => td.style.color = '');

        if (iconCell) {
            // The icon cell now contains the heart and number, so we don't reset its innerHTML here.
            // We just need to manage the playing/paused state visual cues.
            const trackNumberSpan = iconCell.querySelector('.track-index-number');
            const heartContainer = iconCell.querySelector('.heart-icon-container');

            // Make sure number is visible by default
            if (trackNumberSpan) trackNumberSpan.style.display = 'inline';
            if (heartContainer) heartContainer.style.display = 'inline-flex';

            // Remove any old playing/paused icons that might have been injected
            const oldPlayingIcon = iconCell.querySelector('.playing-state-icon');
            if (oldPlayingIcon) oldPlayingIcon.remove();
        }

        const isCurrentTrack = (playingAlbum && playingAlbum.id === currentAlbum.id && i === currentTrackIndex);

        if (isCurrentTrack && trackInRow) {
            let isPlaying = false;
            let isPaused = false;

            // Check native audio state
            if (audio.src && audio.src === trackInRow.src) {
                isPlaying = !audio.paused && !audio.ended;
                isPaused = audio.paused && !audio.ended;
            }
            // Check YouTube player state
            else if (ytPlayer && trackInRow.iframeSrc && trackInRow.iframeSrc.includes('https://www.youtube.com/embed/')) {
                const videoIdMatch = trackInRow.iframeSrc.match(/\/embed\/([a-zA-Z0-9_-]+)/);
                const videoId = videoIdMatch ? videoIdMatch[1] : null;
                if (videoId && ytPlayer.getVideoData() && ytPlayer.getVideoData().video_id === videoId) {
                    const playerState = ytPlayer.getPlayerState();
                    isPlaying = playerState === YT.PlayerState.PLAYING;
                    isPaused = playerState === YT.PlayerState.PAUSED;
                }
            }
            // Check Spotify player state
            else if (spotifyPlayer && trackInRow.spotifyUri) {
                try {
                    const state = await spotifyPlayer.getCurrentState();
                    if (state && state.track_window.current_track.uri === trackInRow.spotifyUri) {
                        isPlaying = !state.paused;
                        isPaused = state.paused;
                    }
                } catch (e) {
                    console.warn("Error checking Spotify state for track icon update:", e);
                }
            }
            // For non-controllable embedded tracks, if they are the currently playing album, assume playing
            else if (trackInRow.rawHtmlEmbed || trackInRow.soundcloudEmbed || trackInRow.audiomackEmbed || trackInRow.fullSoundcloudEmbed) {
                if (playingAlbum && playingAlbum.id === currentAlbum.id) {
                    isPlaying = true; // Assume playing if it's the active embedded album
                }
            }


            if (isPlaying) {
                row.classList.add('playing');
                row.style.backgroundColor = '#25934cff';
                row.style.color = '#1ED760';
                row.querySelectorAll('td').forEach(td => td.style.color = '#1ED760');
                // Also color the heart icon green
                const heartIcon = row.querySelector('.heart-icon');
                if(heartIcon) heartIcon.style.stroke = '#1ED760';


                if (iconCell) {
                    const trackNumberSpan = iconCell.querySelector('.track-index-number');
                    const heartContainer = iconCell.querySelector('.heart-icon-container');
                    if(trackNumberSpan) trackNumberSpan.style.display = 'none';
                    if(heartContainer) heartContainer.style.display = 'none';

                    // Inject a playing icon (e.g., sound bars)
                    iconCell.insertAdjacentHTML('afterbegin', '<div class="playing-state-icon" style="width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;"><svg viewBox="0 0 24 24" width="24" height="24" fill="#1ED760"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg></div>');
                }
            } else if (isPaused) {
                row.classList.add('paused');
                row.style.backgroundColor = row.classList.contains('highlighted-search-result') ? 'rgba(30, 215, 96, 0.3)' : 'transparent';
                row.style.color = '#1ED760';
                row.querySelectorAll('td').forEach(td => td.style.color = '#1ED760');
                 // Also color the heart icon green
                const heartIcon = row.querySelector('.heart-icon');
                if(heartIcon) heartIcon.style.stroke = '#1ED760';

                if (iconCell) {
                     // Keep heart and number visible, just colored green.
                }
            }
        }
    });
}


/**
 * Updates the icon on the main album play button (albumPlayButton) based on current playback state.
 * Shows a pause icon if the current album's track is playing, otherwise a play icon.
 */
async function updateAlbumPlayButtonIcon() {
    if (!albumPlayButton) return;

    let isPlayingCurrentAlbumTrack = false;

    if (currentAlbum && currentAlbum.tracks && currentAlbum.tracks.length > 0) {
        const currentTrack = currentAlbum.tracks[currentTrackIndex];

        // Check native audio
        if (audio.src && audio.src === currentTrack.src && !audio.paused) {
            isPlayingCurrentAlbumTrack = true;
        }
        // Check YouTube player
        else if (ytPlayer && currentTrack.iframeSrc && currentTrack.iframeSrc.includes('https://www.youtube.com/embed/')) {
            const videoIdMatch = currentTrack.iframeSrc.match(/\/embed\/([a-zA-Z0-9_-]+)/);
            const currentVideoId = videoIdMatch ? videoIdMatch[1] : null;
            if (currentVideoId && ytPlayer.getVideoData() && ytPlayer.getVideoData().video_id === currentVideoId && ytPlayer.getPlayerState() === YT.PlayerState.PLAYING) {
                isPlayingCurrentAlbumTrack = true;
            }
        }
        // Check Spotify player
        else if (spotifyPlayer && currentTrack.spotifyUri) {
            try {
                const state = await spotifyPlayer.getCurrentState();
                if (state && !state.paused && state.track_window.current_track.uri === currentTrack.spotifyUri) {
                    isPlayingCurrentAlbumTrack = true;
                }
            } catch (e) {
                console.warn("Error getting Spotify state for album play button icon update:", e);
                // If there's an error getting state, assume not playing to attempt playback
                isPlayingCurrentAlbumTrack = false;
            }
        }
    }

    if (isPlayingCurrentAlbumTrack) {
        albumPlayButton.innerHTML = `
            <svg viewBox="0 0 24 24" width="24" height="24" fill="#1ED760">
                <rect x="6" y="4" width="4" height="16"/>
                <rect x="14" y="4" width="4" height="16"/>
            </svg>
        `; // Green Pause icon
    } else {
        albumPlayButton.innerHTML = `
            <svg viewBox="0 0 24 24" width="24" height="24" fill="#1ED760">
                <path d="M8 5v14l11-7z"/>
            </svg>
        `; // Green Play icon
    }
}


/**
 * NEW: Shows the full-screen player overlay.
 */
function showFullScreenPlayer() {
    if (!fullScreenPlayer) return;
    fullScreenPlayer.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent scrolling behind the full-screen player
    console.log("Full-screen player shown.");

    // Update player UI to populate full-screen player elements
    updatePlayerUI();
}

/**
 * NEW: Hides the full-screen player overlay.
 */
function hideFullScreenPlayer() {
    if (!fullScreenPlayer) return;
    fullScreenPlayer.classList.remove('active');
    document.body.style.overflow = ''; // Restore body scrolling
    console.log("Full-screen player hidden.");

    // If the album overlay (tracklist) is open, ensure it's still visible
    if (albumOverlay && albumOverlay.classList.contains('show')) {
        // Keep album overlay open, but ensure its content is correctly positioned
        // This might involve adjusting padding-bottom for main-play-bar if it's compact.
        // The toggleMainPlaybarView will handle the main-play-bar's layout.
        console.log("Album overlay (tracklist) is still open.");
    }
}


/**
 * NEW: Manages the visibility of the fixed top playing heading.
 * This function should be called whenever the `playingAlbum` state changes
 * or on scroll events.
 */

function updateFixedTopHeadingVisibility() {
    if (!fixedTopPlayingHeading) {
        console.warn("updateFixedTopHeadingVisibility: fixedTopPlayingHeading element not found.");
        return;
    }

    // Determine which album should be shown in the fixed top heading:
    // - If the album overlay is open and a currentAlbum is set, show currentAlbum (the opened one).
    // - Otherwise, if something is playing, show playingAlbum.
    // - Otherwise, hide/clear the header.
    let albumToShow = null;
    try {
        if (albumOverlay && albumOverlay.classList && albumOverlay.classList.contains('show') && currentAlbum) {
            albumToShow = currentAlbum;
        } else if (playingAlbum) {
            albumToShow = playingAlbum;
        }
    } catch (e) {
        console.warn("updateFixedTopHeadingVisibility: error determining album to show", e);
    }

    // Update header content if there is an album to show
    if (albumToShow) {
        if (fixedTopAlbumArt) fixedTopAlbumArt.src = albumToShow.coverArt || 'https://placehold.co/40x40/4a4a4a/ffffff?text=Album';
        if (fixedTopAlbumTitle) fixedTopAlbumTitle.textContent = albumToShow.title || 'Unknown Album';
    } else {
        // No album to show; set defaults
        if (fixedTopAlbumArt) fixedTopAlbumArt.src = 'https://placehold.co/40x40/4a4a4a/ffffff?text=Album';
        if (fixedTopAlbumTitle) fixedTopAlbumTitle.textContent = '';
    }

    const scrollThreshold = topBar ? topBar.offsetHeight : 0; // Show after scrolling past top bar

    // Show the heading only when there's an album to show AND the user has scrolled past the threshold
    // AND we are NOT on a desktop screen (where the main playbar is already full-width).
    if (albumToShow && rightPanel && rightPanel.scrollTop > scrollThreshold && window.innerWidth < 768) {
        fixedTopPlayingHeading.classList.add('visible');
        fixedTopPlayingHeading.classList.remove('hidden'); // Ensure 'hidden' is removed if present
        console.log("Fixed top heading set to VISIBLE for album:", albumToShow.title);
    } else {
        fixedTopPlayingHeading.classList.remove('visible');
        console.log("Fixed top heading set to HIDDEN (via CSS transition).");
    }
}



function openAlbumDetails(albumData, highlightTrackTitle = null) {


    
    console.log("openAlbumDetails called with albumData:", albumData);
    const isOpeningEmbeddedAlbum = (
        albumData.rawHtmlEmbed || albumData.fullSoundcloudEmbed || albumData.audiomackEmbed || albumData.iframeSrc
    );

    // Get existing iframe in the full embed container to check if it's the same album
    // Prefer an existing iframe that matches THIS album by data-album-id (handles multiple iframes kept for background playback)
const existingMatchingIframe = albumFullEmbedContainer.querySelector(`iframe[data-album-id="${albumData.id}"]`);
// Fallback to any iframe if a matching one isn't present
const existingIframeInFullEmbedContainer = existingMatchingIframe || albumFullEmbedContainer.querySelector('iframe');
const existingEmbedAlbumId = existingMatchingIframe ? albumData.id : (existingIframeInFullEmbedContainer ? existingIframeInFullEmbedContainer.dataset.albumId : null);

// If a matching iframe exists, we'll reuse it and ensure it's visible while hiding others.
const isSameEmbeddedAlbumAlreadyLoaded = !!existingMatchingIframe && isOpeningEmbeddedAlbum;

if (isSameEmbeddedAlbumAlreadyLoaded) {
    // Make sure only the matching iframe is visible to avoid showing stale/other embeds.
    albumFullEmbedContainer.querySelectorAll('iframe').forEach(iframe => {
        try { iframe.style.display = (iframe.dataset.albumId === albumData.id) ? 'block' : 'none'; } catch(e) {}
    });
}

    console.log(`DEBUG: isOpeningEmbeddedAlbum = ${isOpeningEmbeddedAlbum}`);
    console.log(`DEBUG: isSameEmbeddedAlbumAlreadyLoaded = ${isSameEmbeddedAlbumAlreadyLoaded}`);
    console.log("DEBUG: albumData for evaluation:", albumData);
    console.log("DEBUG: currentAlbum for evaluation:", currentAlbum);

    // --- Critical DOM element checks ---
    if (!albumOverlay) {
        console.error("Error: albumOverlay element not found.");
        return;
    }
    if (!topBar) {
        console.error("Error: topBar element not found.");
        return;
    }
    if (!rightPanel) {
        console.error("Error: rightPanel element not found.");
        return;
    }
    if (!mainPlayBar) {
        console.error("Error: mainPlayBar element not found.");
        return;
    } // Changed from playerBar
    if (!albumFullEmbedContainer) {
        console.error("Error: albumFullEmbedContainer element not found.");
        return;
    }
    // Assign to the global variable
    albumDetailsContent = document.getElementById('albumDetails');
    if (!albumDetailsContent) {
        console.error("Error: albumDetails element (main content) not found.");
        return;
    }
    if (!closeOverlayBtn) {
        console.error("Error: closeOverlayBtn element not found.");
        return;
    }
    if (!albumHeader) {
        console.error("Error: albumHeader element not found.");
        return;
    } // Added check
    if (!albumDetailsCover) {
        console.error("Error: albumDetailsCover element not found.");
        return;
    } // Added check
    if (!albumDetailsTitle) {
        console.error("Error: albumDetailsTitle element not found.");
        return;
    } // Added check
    if (!albumDetailsArtist) {
        console.error("Error: albumDetailsArtist element not found.");
        return;
    } // Added check
    if (!albumDetailsMeta) {
        console.error("Error: albumDetailsMeta element not found.");
        return;
    } // Added check
    if (!albumTracksSection) {
        console.error("Error: albumTracksSection element not found.");
        return;
    } // Added check
    if (!albumPlayButton) {
        console.error("Error: albumPlayButton element not found.");
        return;
    } // Added check
    if (!albumDetailsTracksBody) {
        console.error("Error: albumDetailsTracksBody element not found.");
        return;
    } // Added check

    // IMPORTANT CHANGE:
    // Only clear albumFullEmbedContainer if we are about to load a *new* embedded album into it.
    // If opening a non-embedded album, we only hide it.
    
    // Determine if we are switching from one embedded album to another
    const isSwitchingEmbeds = playingAlbum && isOpeningEmbeddedAlbum && playingAlbum.id !== albumData.id && 
        (playingAlbum.rawHtmlEmbed || playingAlbum.fullSoundcloudEmbed || playingAlbum.audiomackEmbed || playingAlbum.iframeSrc);

    if (isOpeningEmbeddedAlbum && !isSameEmbeddedAlbumAlreadyLoaded) {
        if (isSwitchingEmbeds) {
            // Hide the UI of the currently playing album before adding the new one
            console.log("Switching embeds. Hiding previous album's UI.");
            for (const child of albumFullEmbedContainer.children) {
                if (child instanceof HTMLElement) {
                    child.style.display = 'none';
                }
            }
        } else {
            // If it's the first embed or switching from a non-embed, clear the container
            console.log("Clearing embed container for a fresh start.");
            albumFullEmbedContainer.innerHTML = '';
        }
    }else if (!isOpeningEmbeddedAlbum && existingIframeInFullEmbedContainer) {
        // If opening a non-embedded album, and an embedded player is currently in the full embed container,
        // just hide the full embed container. DO NOT remove its children.
        albumFullEmbedContainer.style.display = 'none';
        console.log("Opening non-embedded album. Hiding albumFullEmbedContainer to preserve existing embedded player.");
    } else if (!isOpeningEmbeddedAlbum && !existingIframeInFullEmbedContainer) { // Corrected condition
        // If opening a non-embedded album and no embed is currently in the container, ensure it's empty and hidden.
        while (albumFullEmbedContainer.firstChild) {
            albumFullEmbedContainer.removeChild(albumFullEmbedContainer.firstChild);
        }
        albumFullEmbedContainer.style.display = 'none';
        console.log("Opening non-embedded album. No existing embed. Ensuring albumFullEmbedContainer is empty and hidden.");
    }

    // MODIFIED LOGIC FOR currentTrackIndex RESET:
    // Determine if the album being opened is different from the one currently playing.
    // If it's a new album, reset currentTrackIndex. Otherwise, preserve it.
    // Also, if nothing is playing, reset to 0.
    if (!playingAlbum || playingAlbum.id !== albumData.id) {
        currentTrackIndex = 0; // Reset if a new album is being opened for playback or viewing
        console.log("openAlbumDetails: Resetting currentTrackIndex to 0 as a new album is being opened or nothing is playing.");
    } else {
        // If the album being opened is the same as the one currently playing,
        // currentTrackIndex should already be correct from the playback.
        console.log("openAlbumDetails: Preserving currentTrackIndex as the same album is already playing.");
    }

    // Always set currentAlbum to the album being opened, as this is the *viewed* album.
    currentAlbum = albumData;
    console.log("openAlbumDetails: currentAlbum set to:", currentAlbum ? currentAlbum.title : "null");

    // Remove explicit background color and border-radius from JavaScript
    if (albumOverlay) {
        albumOverlay.style.removeProperty('background-color');
        albumOverlay.style.removeProperty('border-radius');
        albumOverlay.style.removeProperty('position');
        albumOverlay.style.removeProperty('top');
        albumOverlay.style.removeProperty('bottom');
        albumOverlay.style.removeProperty('left');
        albumOverlay.style.removeProperty('right');
        albumOverlay.style.removeProperty('width');
        albumOverlay.style.removeProperty('height');
        albumOverlay.style.removeProperty('margin');
        albumOverlay.style.removeProperty('padding');
        albumOverlay.style.removeProperty('z-index');
        albumOverlay.style.removeProperty('justify-content');
        albumOverlay.style.removeProperty('align-items');
        albumOverlay.style.removeProperty('overflow');
        albumOverlay.style.removeProperty('transform'); // NEW: Ensure no transform
        albumOverlay.style.removeProperty('filter'); // NEW: Ensure no filter
        console.log("albumOverlay inline styles reset.");
    }
    if (albumDetailsCover) {
        albumDetailsCover.src = albumData.coverArt || 'https://placehold.co/160x160/000000/FFFFFF?text=Album'; // Fallback image
    }
    if (albumDetailsTitle) {
        albumDetailsTitle.textContent = albumData.title || 'Unknown Title';
    }
    if (albumDetailsArtist) {
        albumDetailsArtist.textContent = albumData.artist || 'Unknown Artist';
    }
    if (albumDetailsMeta) {
        albumDetailsMeta.textContent = `Album • ${albumData.year || 'Year N/A'} • ${albumData.genre || 'Genre N/A'}`;
    }

    // 2. Populate the tracklist table OR the full embed container
    if (albumDetailsTracksBody) {
        albumDetailsTracksBody.innerHTML = ''; // Clear existing tracks
        console.log("albumDetailsTracksBody cleared.");
    }

    albumFullEmbedContainer.style.display = 'none'; // Hide by default, will be shown if it's an embed


    // If the album has a raw HTML embed OR a full SoundCloud embed OR Audiomack embed OR YouTube embed, display it in the dedicated container
    if (isOpeningEmbeddedAlbum && albumFullEmbedContainer) {
        console.log("Detected embedded album content.");
        // Hide the traditional album details content
        if (albumDetailsContent) {
            albumDetailsContent.style.display = 'none';
            console.log("albumDetailsContent set to display: none for embedded album.");
        }
        // Only create/insert the iframe if it's a new embedded album or a different one
        if (!isSameEmbeddedAlbumAlreadyLoaded) {
            const embedContent = albumData.soundcloudEmbed || albumData.fullSoundcloudEmbed || albumData.rawHtmlEmbed || albumData.audiomackEmbed || (albumData.iframeSrc ? `<iframe src="${albumData.iframeSrc}" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" style="border-radius:12px;"></iframe>` : '');
            console.log("openAlbumDetails: Attempting to display full embed. Content received:", embedContent ? embedContent.substring(0, 200) + '...' : 'No content'); // Log first 200 chars

            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = embedContent;
            const originalIframe = tempDiv.querySelector('iframe');

            if (originalIframe) {
                console.log("openAlbumDetails: Iframe element found in embed content. Inserting new iframe.");
                originalIframe.removeAttribute('width');
                originalIframe.removeAttribute('height');
                originalIframe.style.border = '0';
                originalIframe.style.borderRadius = '12px';
                originalIframe.style.width = '100%'; // Make it fill the container
                originalIframe.style.height = '100%'; // Make it fill the container
                originalIframe.dataset.albumId = albumData.id; // Store album ID on the iframe for future checks

                // Append iframe first so the interaction layer sits on top
                albumFullEmbedContainer.appendChild(originalIframe);
                // Ensure the newly appended iframe is visible and hide any other iframes in the container
                try {
                    albumFullEmbedContainer.querySelectorAll('iframe').forEach(iframe => {
                        iframe.style.display = (iframe === originalIframe) ? 'block' : 'none';
                    });
                } catch(e) {}

                console.log("originalIframe appended to albumFullEmbedContainer.");

            } else {
                albumFullEmbedContainer.innerHTML = embedContent;
                // If embedContent contained an iframe inserted via innerHTML, ensure only that iframe is visible
                try {
                    const newIframe = albumFullEmbedContainer.querySelector('iframe');
                    if (newIframe) {
                        albumFullEmbedContainer.querySelectorAll('iframe').forEach(iframe => iframe.style.display = (iframe === newIframe) ? 'block' : 'none');
                        newIframe.dataset.albumId = albumData.id; // normalize dataset if possible
                    }
                } catch(e) {}

                console.warn("openAlbumDetails: Embed content did not contain an iframe. Appending raw HTML directly. This might not be expected.");
            }

          // NEW: Always ensure the top mask div is present and updated for embedded albums
        let topMaskDiv = albumFullEmbedContainer.querySelector('#embedded-overlay-top-mask');
        if (!topMaskDiv) {
            topMaskDiv = document.createElement('div');
            topMaskDiv.id = 'embedded-overlay-top-mask';
            albumFullEmbedContainer.appendChild(topMaskDiv);
            console.log("embedded-overlay-top-mask created and appended.");
        }

        // Populate the content of the top mask div with image on left, text on right
        topMaskDiv.innerHTML = `
            <img src="${albumData.coverArt || 'https://placehold.co/80x80/4a4a4a/ffffff?text=Album'}"
                 alt="Album Cover"
                 style="width: 80px; height: 80px; border-radius: 8px; object-fit: cover; flex-shrink: 0; box-shadow: 0 4px 10px rgba(0,0,0,0.5); margin-right: 15px;">
            <div style="display: flex; flex-direction: column; flex-grow: 1; overflow: hidden;">
                <div style="font-size: clamp(1.5em, 5vw, 2.5em); font-weight: bold; color: white; margin-bottom: 2px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
                    ${albumData.title || 'Embedded Content'}
                </div>
                <div style="font-size: clamp(0.9em, 3vw, 1.2em); color: #b3b3b3; margin-bottom: 2px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
                    ${albumData.artist || 'Various Artists'}
                </div>
                <div style="font-size: clamp(0.7em, 2.5vw, 0.9em); color: #a0a0a0; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
                    Album • ${albumData.year || 'Year N/A'} • ${albumData.genre || 'Genre N/A'}
                </div>
            </div>
        `;
        console.log("embedded-overlay-top-mask content populated with image left, text right.");

        // Apply styles to the topMaskDiv, letting its height adjust based on content
        topMaskDiv.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height:188px;
            /* Height will be determined by content + padding */
            z-index: 906;
            background-color: #1d1b1bff; /* Fully opaque black background as requested */
            display: flex;
            align-items: center; /* Vertically center content */
            padding: 15px 20px; /* Padding around content */
            box-sizing: border-box;
            overflow: hidden; /* Hide overflow if text is too long */
            box-shadow: 0 5px 25px rgba(0,0,0,0.5); /* Subtle shadow at the bottom */
        `;
        console.log("embedded-overlay-top-mask styled.");




            // ONLY add the interaction layer if it's a NEW embedded album
            let embedInteractionLayer = albumFullEmbedContainer.querySelector('#embed-interaction-layer');
            if (!embedInteractionLayer) { // Ensure it doesn't already exist from a previous *same* album open
                embedInteractionLayer = document.createElement('div');
                embedInteractionLayer.id = 'embed-interaction-layer';
                embedInteractionLayer.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 1001; /* Ensure it's above the iframe */
                    cursor: pointer;
                    background-color: rgba(0,0,0,0); /* Fully transparent */
                `;
                albumFullEmbedContainer.appendChild(embedInteractionLayer);
                console.log("embedInteractionLayer created and appended for NEW embedded album.");
            }
            // Always attach/re-attach the wrapper listener for a new embed, as it will be removed on first valid click
            if (embedInteractionLayer._firstClickWrapper) {
                embedInteractionLayer.removeEventListener('click', embedInteractionLayer._firstClickWrapper);
                delete embedInteractionLayer._firstClickWrapper;
            }
            const wrapper = function (e) {
                const rect = embedInteractionLayer.getBoundingClientRect();
                const y = e.clientY - rect.top;
                if (y <= 180) {
                    // Click in excluded top region: ignore.
                    console.log("embedInteractionLayer click ignored because it's within top 180px."); 
                    e.stopPropagation();
                    return;
                }
                firstClickEmbedHandler();
            };
            embedInteractionLayer._firstClickWrapper = wrapper;
            embedInteractionLayer.addEventListener('click', wrapper);
            console.log("embedInteractionLayer wrapper listener attached for NEW embedded album.");




            // NEW: Add vertical heart strip for embedded albums
            const verticalHeartStrip = document.createElement('div');
            verticalHeartStrip.id = 'vertical-heart-strip';
            // Styles are defined in the injected stylesheet, just append it.
            albumFullEmbedContainer.appendChild(verticalHeartStrip);

            // Populate the strip with clickable hearts
            for (let i = 0; i < 15; i++) { // Add 15 hearts as an example
                const heartContainer = document.createElement('div');
                heartContainer.className = 'heart-icon-container';
                heartContainer.innerHTML = `<svg class="heart-icon" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;
                heartContainer.addEventListener('click', (e) => {
                    e.stopPropagation(); // VERY IMPORTANT: Prevent click from reaching interaction layer
                    const heartIcon = e.currentTarget.querySelector('.heart-icon');
                    heartIcon.classList.toggle('liked');
                });
                verticalHeartStrip.appendChild(heartContainer);
            }
            console.log("Vertical heart strip added to embedded album overlay.");


  // NEW: Add vertical heart strip for embedded albums
            const verticalHeartStrip1 = document.createElement('div');
            verticalHeartStrip1.id = 'vertical-heart-strip1';
            // Styles are defined in the injected stylesheet, just append it.
            albumFullEmbedContainer.appendChild(verticalHeartStrip1);

            // Populate the strip with clickable hearts
            for (let i = 0; i < 15; i++) { // Add 15 hearts as an example
                const heartContainer1 = document.createElement('div');
                heartContainer1.className = 'heart-icon-container1';
                heartContainer1.innerHTML = `<svg class="heart-icon1" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;
                heartContainer1.addEventListener('click', (e) => {
                    e.stopPropagation(); // VERY IMPORTANT: Prevent click from reaching interaction layer
                    const heartIcon = e.currentTarget.querySelector('.heart-icon1');
                    heartIcon.classList.toggle('liked');
                });
                verticalHeartStrip.appendChild(heartContainer1);
            }
            console.log("Vertical heart strip added to embedded album overlay.");











        } else {
            console.log("openAlbumDetails: Same embedded album already loaded. Reusing existing iframe.");
            // If it's the same embedded album, ensure the interaction layer is GONE
            // It should have been removed by firstClickEmbedHandler on the initial interaction.
            const existingInteractionLayer = albumFullEmbedContainer.querySelector('#embed-interaction-layer');
            if (existingInteractionLayer) {
                existingInteractionLayer.removeEventListener('click', firstClickEmbedHandler);
                existingInteractionLayer.remove();
                console.log("Existing embed-interaction-layer removed for SAME embedded album (should have been removed already).");
            }
        }

        // Ensure albumFullEmbedContainer is visible and styled for embeds
        albumFullEmbedContainer.style.position = 'absolute';
        albumFullEmbedContainer.style.top = '0';
        albumFullEmbedContainer.style.left = '0';
        albumFullEmbedContainer.style.width = '100%';
        albumFullEmbedContainer.style.height = '100%'; // This makes it fill the parent overlay
        albumFullEmbedContainer.style.overflow = 'hidden'; // Hide overflow of the iframe
        albumFullEmbedContainer.style.backgroundColor = '#000'; // Optional: black background for embeds
        albumFullEmbedContainer.style.display = 'flex'; // Ensure it's visible
        albumFullEmbedContainer.style.zIndex = '1'; // Ensure it has a z-index to form a stacking context
        console.log("albumFullEmbedContainer positioned to fill parent and set to display: flex.");
        // Hide the player bar for embedded albums
        if (mainPlayBar) { // Changed from playerBar
            mainPlayBar.style.display = 'flex'; // Ensure mainPlayBar is visible
            togglePlayerControls(false); // Disable controls for embedded content
            // updateMiniPlayerForEmbed(albumData); // This is now handled by updatePlayerUI
        }

        if (albumOverlay && topBar) {
            const topBarHeight = topBar.offsetHeight;
            albumOverlay.style.position = 'fixed';
            albumOverlay.style.top = `${topBarHeight}px`;
            albumOverlay.style.bottom = '0';
            albumOverlay.style.right = '0';
            albumOverlay.style.width = 'auto';
            albumOverlay.style.height = 'auto';
            albumOverlay.style.zIndex = '900'; // Adjusted z-index to be below full-screen player but above playbar
            console.log("albumOverlay positioned fixed and sized to full available space.");

            if (window.innerWidth < 772) {
                albumOverlay.style.left = '0';
            } else {
                albumOverlay.style.left = '25%';
            }
        }

        if (closeOverlayBtn) {
            closeOverlayBtn.style.display = 'flex';
            closeOverlayBtn.style.position = 'absolute';
            closeOverlayBtn.style.top = `${topBar ? topBar.offsetHeight + 15 : 15}px`;
            closeOverlayBtn.style.right = '16px';
            closeOverlayBtn.style.backgroundColor = 'rgb(26, 2, 2)';
            closeOverlayBtn.style.color = 'white';
            closeOverlayBtn.style.border = 'none';
            closeOverlayBtn.style.borderRadius = '50%';
            closeOverlayBtn.style.width = '34px';
            closeOverlayBtn.style.height = '34px';
            closeOverlayBtn.style.justifyContent = 'center';
            closeOverlayBtn.style.alignItems = 'center';
            closeOverlayBtn.style.cursor = 'pointer';
            closeOverlayBtn.style.zIndex = '10000'; // Ensure it's above the embed container
            console.log("closeOverlayBtn styled and displayed.");
        }

    } else { // This block handles non-embedded albums (with tracks or no tracks)
        console.log("Detected non-embedded album (with tracks or no tracks).");

        // Ensure albumFullEmbedContainer is hidden for non-embedded albums
        if (albumFullEmbedContainer) {
            albumFullEmbedContainer.style.display = 'none';
            // Its content was already cleared at the beginning of openAlbumDetails
            console.log("albumFullEmbedContainer explicitly hidden for tracklist album.");
        }

        if (albumDetailsContent) {
            albumDetailsContent.style.display = 'block';
            // Apply styling to the main album details content area
            albumDetailsContent.style.boxSizing = 'border-box'; // Include padding in width
            albumDetailsContent.style.maxWidth = '100%'; // Ensure it takes full width

            // Responsive padding for albumDetailsContent
            if (window.innerWidth < 386) { // New breakpoint for very small screens
                albumDetailsContent.style.padding = '5px'; // Even more reduced padding
            } else if (window.innerWidth < 768) {
                albumDetailsContent.style.padding = '10px'; // Reduced padding for mobile
            } else {
                albumDetailsContent.style.padding = '20px'; // Default padding for larger screens
            }
            console.log("albumDetailsContent set to display: block and styled.");
        }

        if (albumHeader) {
            albumHeader.style.display = 'flex';
            albumHeader.style.alignItems = 'flex-end'; // Align items to the bottom
            albumHeader.style.gap = '20px'; // Gap between cover and text
            albumHeader.style.backgroundColor = 'rgba(0, 0, 0, 0.3)'; // Slightly darker background for header
            albumHeader.style.borderRadius = '8px'; // Rounded corners for the header
            albumHeader.style.flexWrap = 'wrap'; // Allow wrapping on smaller screens

            // Reduced margin-bottom to decrease space between header and tracks
            albumHeader.style.marginBottom = '15px';
            console.log("albumHeader styled.");

            // Responsive adjustments for albumHeader and albumDetailsCover
            if (window.innerWidth < 768) { // Example breakpoint for mobile/small tablets
                albumHeader.style.flexDirection = 'column';
                albumHeader.style.alignItems = 'center'; // Center items horizontally
                albumHeader.style.textAlign = 'center'; // Center text
                albumHeader.style.padding = '15px'; // Reduce padding for small screens

                if (albumDetailsCover) {
                    albumDetailsCover.style.width = '120px'; // Smaller cover image
                    albumDetailsCover.style.height = '120px';
                    albumDetailsCover.style.margin = '0 auto 15px auto'; // Center image and add bottom margin
                }
                if (albumDetailsTitle) {
                    albumDetailsTitle.style.fontSize = 'clamp(1.8em, 6vw, 2.5em)'; // Adjust clamp for smaller screens
                    albumDetailsTitle.style.marginBottom = '2px';
                }
                if (albumDetailsArtist) {
                    albumDetailsArtist.style.fontSize = 'clamp(1em, 3.5vw, 1.2em)';
                    albumDetailsArtist.style.marginBottom = '2px';
                }
                if (albumDetailsMeta) {
                    albumDetailsMeta.style.fontSize = 'clamp(0.8em, 3vw, 0.9em)';
                    // Optionally hide meta on very small screens if space is critical
                    // albumDetailsMeta.style.display = 'none';
                }
            } else { // Reset for larger screens
                albumHeader.style.flexDirection = 'row';
                albumHeader.style.alignItems = 'flex-end';
                albumHeader.style.textAlign = 'left';
                albumHeader.style.padding = '20px';

                if (albumDetailsCover) {
                    albumDetailsCover.style.width = '160px';
                    albumDetailsCover.style.height = '160px';
                    albumDetailsCover.style.margin = '0'; // Remove auto margin
                }
            }
        }
        if (albumDetailsCover) {
            albumDetailsCover.src = albumData.coverArt || 'https://placehold.co/160x160/000000/FFFFFF?text=Album'; // Fallback image
            albumDetailsCover.style.borderRadius = '8px'; // Rounded corners for cover
            albumDetailsCover.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.5)'; // Add shadow
            albumDetailsCover.style.objectFit = 'cover'; // Ensure image covers the area
            albumDetailsCover.style.display = 'block'; // Ensure it's visible by default
            console.log("albumDetailsCover styled.");
        }
        // Adjust text elements within album header for better spacing
        if (albumDetailsTitle) {
            albumDetailsTitle.textContent = albumData.title || 'Unknown Title';
            albumDetailsTitle.style.fontWeight = 'bold';
            albumDetailsTitle.style.color = '#fff';
            console.log("albumDetailsTitle styled.");
        }
        if (albumDetailsArtist) {
            albumDetailsArtist.textContent = albumData.artist || 'Unknown Artist';
            albumDetailsArtist.style.color = '#b3b3b3';
            console.log("albumDetailsArtist styled.");
        }
        if (albumDetailsMeta) {
            albumDetailsMeta.textContent = `Album • ${albumData.year || 'Year N/A'} • ${albumData.genre || 'Genre N/A'}`;
            albumDetailsMeta.style.color = '#a0a0a0';
            console.log("albumDetailsMeta styled.");
        }

        if (albumTracksSection) {
            albumTracksSection.style.display = 'block';
            // Always apply bottom padding for smaller screens to lift tracks above player bar
            if (window.innerWidth < 450) {
                albumTracksSection.style.paddingBottom = '80px';
            } else {
                albumTracksSection.style.paddingBottom = '20px'; // Default bottom padding
            }

            // Horizontal padding for albumTracksSection - removed and relying on albumDetailsContent
            albumTracksSection.style.paddingLeft = '0';
            albumTracksSection.style.paddingRight = '0';
            console.log("albumTracksSection styled.");
        }
        if (albumPlayButton) {
            albumPlayButton.style.display = 'inline-flex'; // Changed to inline-flex for centering icon
            albumPlayButton.style.justifyContent = 'center'; // Center horizontally
            albumPlayButton.style.alignItems = 'center'; // Center vertically
            albumPlayButton.style.marginTop = '9px'; // Space above play button
            albumPlayButton.style.width = '60px'; // Make it a fixed size for circular shape
            albumPlayButton.style.height = '60px'; // Make it a fixed size for circular shape
            albumPlayButton.style.borderRadius = '50%'; // Make it circular
            albumPlayButton.style.backgroundColor = '#d71e1eff';
            albumPlayButton.style.color = 'black';
            albumPlayButton.style.fontWeight = 'bold';
            albumPlayButton.style.textTransform = 'uppercase';
            albumPlayButton.style.letterSpacing = '1px';
            albumPlayButton.style.border = 'none';
            albumPlayButton.style.cursor = 'pointer';
            albumPlayButton.onmouseover = function() { this.style.backgroundColor = '#df1f1fff'; };
            albumPlayButton.onmouseout = function() { this.style.backgroundColor = '#d71e1eff'; };
            console.log("albumPlayButton styled.");

            // Add click listener for the album play button
            albumPlayButton.removeEventListener('click', handleAlbumPlayButtonClick); // Prevent duplicates
            albumPlayButton.addEventListener('click', handleAlbumPlayButtonClick);
        }

        // Table styling
        if (albumDetailsTracksBody && albumDetailsTracksBody.parentNode && albumDetailsTracksBody.parentNode.tagName === 'TABLE') {
            const trackTable = albumDetailsTracksBody.parentNode;
            trackTable.style.width = '100%'; // Make table take full width
            trackTable.style.borderCollapse = 'collapse'; // Collapse borders
            trackTable.style.marginTop = '20px'; // Space above table
            trackTable.style.color = '#fff'; // Text color
            trackTable.style.tableLayout = 'fixed'; // Use fixed table layout for column width control
            console.log("Track table styled.");

            // Style table headers
            const tableHeaders = trackTable.querySelectorAll('th');
            tableHeaders.forEach(th => {
                th.style.padding = '15px 10px';
                th.style.textAlign = 'left';
                th.style.borderBottom = '1px solid #444';
                th.style.color = '#b3b3b3';
                th.style.fontWeight = 'normal';
                th.style.textTransform = 'uppercase';
                th.style.fontSize = '0.8em';
            });

            // Adjust specific column widths for responsiveness
            if (tableHeaders.length >= 4) {
                if (window.innerWidth < 400) { // New breakpoint for very small screens
                    tableHeaders[0].style.width = '15%'; // Number column (increased for icon visibility)
                    tableHeaders[1].style.width = '40%'; // Title column (adjusted)
                    tableHeaders[2].style.width = '25%'; // Artist column
                    tableHeaders[3].style.width = '20%'; // Duration column
                } else if (window.innerWidth < 768) {
                    // Mobile specific column widths (between 400px and 768px)
                    tableHeaders[0].style.width = '12%'; // Number column (increased for icon visibility)
                    tableHeaders[1].style.width = '40%'; // Title column (adjusted)
                    tableHeaders[2].style.width = '28%'; // Artist column
                    tableHeaders[3].style.width = '20%'; // Duration column
                } else {
                    // Larger screen column widths
                    tableHeaders[0].style.width = '10%';
                    tableHeaders[1].style.width = '45%';
                    tableHeaders[2].style.width = '30%';
                    tableHeaders[3].style.width = '15%';
                }
            }
            console.log("Table headers styled and column widths adjusted.");
        }

        if (albumData.tracks && albumData.tracks.length > 0) {
            albumData.tracks.forEach((track, index) => {
                const row = document.createElement('tr');
                row.dataset.trackIndex = index;
                row.dataset.title = track.title || 'Untitled';
                row.dataset.artist = track.artist || albumData.artist || 'Various Artists';
                row.dataset.img = track.img || albumData.coverArt;
                row.dataset.src = track.src || '';
                row.dataset.iframeSrc = track.iframeSrc || '';
                row.dataset.spotifyUri = track.spotifyUri || '';
                row.dataset.rawHtmlEmbed = track.rawHtmlEmbed || '';
                row.dataset.soundcloudEmbed = track.soundcloudEmbed || '';
                row.dataset.audiomackEmbed = track.audiomackEmbed || '';
                row.dataset.fullSoundcloudEmbed = track.fullSoundcloudEmbed || '';

                // NEW: Updated row innerHTML with heart icon
                row.innerHTML = `
                    <td class="track-number-cell">
                        <span class="heart-icon-container">
                            <svg class="heart-icon" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                        </span>
                        <span class="track-index-number">${index + 1}</span>
                    </td>
                    <td class="track-title">${track.title || 'Untitled'}</td>
                    <td>${track.artist || albumData.artist || 'Various Artists'}</td>
                    <td>${formatTime(track.duration)}</td>
                `;

                // NEW: Add click listener to the heart icon container
                const heartContainer = row.querySelector('.heart-icon-container');
                if (heartContainer) {
                    heartContainer.addEventListener('click', (e) => {
                        e.stopPropagation(); // Prevent the row's click listener (play track) from firing
                        const heartIcon = e.currentTarget.querySelector('.heart-icon');
                        heartIcon.classList.toggle('liked');
                    });
                }


                // Apply styles to each table cell
                row.querySelectorAll('td').forEach(td => {
                    td.style.padding = '12px 10px'; // Increased padding
                    td.style.borderBottom = '1px solid #333'; // Lighter border
                    td.style.verticalAlign = 'middle';
                    td.style.whiteSpace = 'nowrap'; // Prevent text wrapping by default
                    td.style.overflow = 'hidden';
                    td.style.textOverflow = 'ellipsis'; // Add ellipsis for overflow
                    // Responsive font size for table cells
                    td.style.setProperty('font-size', 'clamp(0.8em, 2.5vw, 1em)', 'important');
                });
                // Specific styling for track title to allow wrapping on small screens
                const trackTitleCell = row.querySelector('.track-title');
                if (trackTitleCell) {
                    trackTitleCell.style.fontWeight = 'bold';
                    trackTitleCell.style.color = '#fff';
                    trackTitleCell.style.whiteSpace = 'normal'; // Allow title to wrap
                    trackTitleCell.style.wordBreak = 'break-word'; // Break long words
                }

                // Hover effect for rows
                row.style.transition = 'background-color 0.2s ease';
                row.onmouseover = function() { this.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'; };
                row.onmouseout = function() { this.style.backgroundColor = 'transparent'; };


                if (highlightTrackTitle && (track.title || '').toLowerCase().includes(highlightTrackTitle.toLowerCase())) {
                    row.classList.add('highlighted-search-result');
                    row.style.backgroundColor = 'rgba(30, 215, 96, 0.3)'; // Highlight color
                } else {
                    row.classList.remove('highlighted-search-result');
                    row.style.backgroundColor = 'transparent'; // Ensure no highlight if not matched
                }

                row.addEventListener('click', async () => { // Made async to await Spotify state
                    const clickedTrackIndex = parseInt(row.dataset.trackIndex);
                    const clickedTrack = currentAlbum.tracks[clickedTrackIndex];

                    // Check if the clicked track is the same as the currently playing track
                    const isCurrentlyPlayingThisTrack = (playingAlbum && playingAlbum.id === currentAlbum.id && clickedTrackIndex === currentTrackIndex);

                    // Check if the track is controllable by our JS (YouTube or Spotify SDK, or native audio)
                    const isControllableTrack = clickedTrack.spotifyUri || (clickedTrack.iframeSrc && clickedTrack.iframeSrc.includes('https://www.youtube.com/embed/')) || (clickedTrack.src && !clickedTrack.iframeSrc && !clickedTrack.spotifyUri && !clickedTrack.rawHtmlEmbed && !clickedTrack.soundcloudEmbed && !clickedTrack.audiomackEmbed && !clickedTrack.fullSoundcloudEmbed);

                    let shouldPlay = true;
                    let seekTime = 0;

                    if (isCurrentlyPlayingThisTrack && isControllableTrack) {
                        // If it's the same controllable track, toggle play/pause
                        let isPlaying = false;
                        if (audio.src && audio.src === clickedTrack.src) {
                            isPlaying = !audio.paused;
                        } else if (ytPlayer && clickedTrack.iframeSrc && clickedTrack.iframeSrc.includes('https://www.youtube.com/embed/')) {
                            const videoIdMatch = clickedTrack.iframeSrc.match(/\/embed\/([a-zA-Z0-9_-]+)/);
                            const videoId = videoIdMatch ? videoIdMatch[1] : null;
                            if (videoId && ytPlayer.getVideoData() && ytPlayer.getVideoData().video_id === videoId) {
                                isPlaying = ytPlayer.getPlayerState() === YT.PlayerState.PLAYING;
                            }
                        } else if (spotifyPlayer && clickedTrack.spotifyUri) {
                            try {
                                const state = await spotifyPlayer.getCurrentState();
                                if (state && state.track_window.current_track.uri === clickedTrack.spotifyUri) {
                                    isPlaying = !state.paused;
                                }
                            } catch (e) {
                                console.warn("Error checking Spotify state for toggle:", e);
                            }
                        }

                        if (isPlaying) {
                            // Pause
                            if (audio.src && audio.src === clickedTrack.src) audio.pause();
                            else if (ytPlayer) ytPlayer.pauseVideo();
                            else if (spotifyPlayer) await spotifyPlayer.pause();
                            shouldPlay = false; // Don't call playTrack, just pause
                            console.log(`DEBUG: Paused currently playing controllable track "${clickedTrack.title}".`);
                        } else {
                            // Resume from last known position
                            seekTime = lastKnownPlaybackPosition;
                            console.log(`DEBUG: Resuming currently paused controllable track "${clickedTrack.title}" from: ${seekTime} seconds.`);
                        }
                    } else {
                        // If it's a different track or a non-controllable embed, stop all and play fresh
                        
// Preserve embedded playback when switching embedded->embedded (don't stop previous embed)
const isBackgroundEmbeddedPlaying = playingAlbum && (playingAlbum.rawHtmlEmbed || playingAlbum.fullSoundcloudEmbed || playingAlbum.audiomackEmbed || playingAlbum.iframeSrc || playingAlbum.soundcloudEmbed);
const isClickedTrackEmbedded = clickedTrack && (clickedTrack.rawHtmlEmbed || clickedTrack.fullSoundcloudEmbed || clickedTrack.audiomackEmbed || clickedTrack.iframeSrc || clickedTrack.soundcloudEmbed);
const isSwitchingEmbeddedToEmbedded = isBackgroundEmbeddedPlaying && isClickedTrackEmbedded && playingAlbum && currentAlbum && playingAlbum.id !== currentAlbum.id;
if (!isSwitchingEmbeddedToEmbedded) {
    stopAllPlaybackUI();
} else {
    console.log("Preserving background embedded playback when switching to another embedded album.");
}

                        console.log(`DEBUG: Playing new track or non-controllable embedded track "${clickedTrack.title}". Starting fresh.`);
                    }

                    // No need to reset all track icons here. updateTrackHighlightingInOverlay will handle it.
                    if (shouldPlay) {
                        playTrack(clickedTrack, clickedTrackIndex, seekTime);
                    } else {
                        // If paused, just update the UI to reflect pause state
                        updateTrackHighlightingInOverlay(); // Re-apply highlights and icons
                        if (playPauseBtn) {
                            playIcon.classList.remove('hidden');
                            pauseIcon.classList.add('hidden');
                        }
                        updateAlbumPlayButtonIcon(); // Sync album play button
                    }
                    updatePlayerUI(); // Sync all player UI
                    updateFixedTopHeadingVisibility(); // Sync fixed top heading
                });
                if (albumDetailsTracksBody) {
                    albumDetailsTracksBody.appendChild(row);
                }
            });
            // After populating tracks, update highlighting based on current playback
            updateTrackHighlightingInOverlay();
        }
        if (closeOverlayBtn) {
            closeOverlayBtn.style.display = 'flex';
            closeOverlayBtn.style.position = 'absolute';
            closeOverlayBtn.style.top = '15px';
            closeOverlayBtn.style.right = '16px';
            closeOverlayBtn.style.backgroundColor = 'rgb(26, 2, 2)';
            closeOverlayBtn.style.color = 'white';
            closeOverlayBtn.style.border = 'none';
            closeOverlayBtn.style.borderRadius = '50%';
            closeOverlayBtn.style.width = '34px';
            closeOverlayBtn.style.height = '34px';
            closeOverlayBtn.style.justifyContent = 'center';
            closeOverlayBtn.style.alignItems = 'center';
            closeOverlayBtn.style.cursor = 'pointer';
            closeOverlayBtn.style.zIndex = '1000';
            console.log("closeOverlayBtn styled and displayed.");
        }
    }
    // Always update the album play button icon when opening a non-embedded album
    updateAlbumPlayButtonIcon();
    // NEW: Update the main album playbar UI when opening a non-embedded album
    updatePlayerUI();

    // Add the event listeners for player controls here, once the album details are populated
    // and the player is ready to be interacted with for the *newly opened album*.
    if (prevTrackBtn) {
        prevTrackBtn.removeEventListener('click', prevTrack); // Prevent duplicates
        prevTrackBtn.addEventListener('click', prevTrack);
    }
    if (nextTrackBtn) {
        nextTrackBtn.removeEventListener('click', nextTrack); // Prevent duplicates
        nextTrackBtn.addEventListener('click', nextTrack);
    }
    // Attach event listener for the close button
    if (closeOverlayBtn) {
        closeOverlayBtn.removeEventListener('click', closeAlbumOverlay); // Prevent multiple listeners
        closeOverlayBtn.addEventListener('click', closeAlbumOverlay);
    }
    // Locate the section you want to correct within openAlbumDetails
if (albumOverlay && topBar && rightPanel && mainPlayBar) {
    // OLD CODE: You were removing 'hidden' and adding 'show' and 'active' separately.
    // albumOverlay.classList.remove('hidden');
    // albumOverlay.classList.add('show');
    // albumOverlay.classList.add('active'); 

    // NEW CODE: This single line adds both 'show' and 'active' classes at once for a cleaner approach.
    // It also assumes 'hidden' has been removed earlier in the process.
    // The `classList.add()` method can take multiple arguments, each one a class to add.
    albumOverlay.classList.remove('hidden'); // Ensure the element is not hidden first
    albumOverlay.classList.add('show', 'active'); // Add both classes to trigger the transition

    // Log the current state for debugging
    console.log("albumOverlay classes updated: hidden removed, show added, active added. body overflow hidden.");

    // The rest of the code is fine.
    document.body.style.overflow = 'hidden';
    updateFixedTopHeadingVisibility();
} else {
    console.error("Error: One or more critical elements for albumOverlay visibility are missing. Overlay will not show.", {
        albumOverlay,
        topBar,
        rightPanel,
        mainPlayBar
    });
}

}

/**
 * Function to handle the click on the main album play button within the overlay.
 * Toggles playback of the current album's current track.
 */
async function handleAlbumPlayButtonClick() {
    console.log("Album Play Button clicked.");
    if (!currentAlbum || !currentAlbum.tracks || currentAlbum.tracks.length === 0) {
        console.warn("No tracks available in current album to play.");
        return;
    }
    const currentTrack = currentAlbum.tracks[currentTrackIndex];
    if (!currentTrack) {
        console.error("Current track is undefined, cannot play.");
        return;
    }
    let isPlaying = false;
    // Check if native audio is playing the current track
    if (audio.src && audio.src === currentTrack.src && !audio.paused) {
        isPlaying = true;
    }
    // Check if YouTube player is playing the current track
    else if (ytPlayer && currentTrack.iframeSrc && currentTrack.iframeSrc.includes('https://www.youtube.com/embed/')) {
        const videoIdMatch = currentTrack.iframeSrc.match(/\/embed\/([a-zA-Z0-9_-]+)/);
        const currentVideoId = videoIdMatch ? videoIdMatch[1] : null;
        if (currentVideoId && ytPlayer.getVideoData() && ytPlayer.getVideoData().video_id === currentVideoId && ytPlayer.getPlayerState() === YT.PlayerState.PLAYING) {
            isPlaying = true;
        }
    }
    // Check if Spotify player is playing the current track
    else if (spotifyPlayer && currentTrack.spotifyUri) {
        try {
            const state = await spotifyPlayer.getCurrentState();
            if (state && !state.paused && state.track_window.current_track.uri === currentTrack.spotifyUri) {
                isPlaying = true;
            }
        } catch (e) {
            console.warn("Error getting Spotify state for album play button toggle:", e);
            // If there's an error getting state, assume not playing to attempt playback
            isPlaying = false;
        }
    }
    // For embedded content, if it's the currently playing album, assume it's playing
    else if (currentTrack.rawHtmlEmbed || currentTrack.soundcloudEmbed || currentTrack.audiomackEmbed || currentTrack.fullSoundcloudEmbed || currentTrack.iframeSrc) {
        if (playingAlbum && playingAlbum.id === currentAlbum.id) {
            isPlaying = true;
        }
    }


    if (isPlaying) {
        // If currently playing, pause it
        if (audio.src && audio.src === currentTrack.src) {
            audio.pause();
        } else if (ytPlayer && currentTrack.iframeSrc && currentTrack.iframeSrc.includes('https://www.youtube.com/embed/')) {
            ytPlayer.pauseVideo();
        } else if (spotifyPlayer && currentTrack.spotifyUri) {
            await spotifyPlayer.pause();
        } else if (currentTrack.rawHtmlEmbed || currentTrack.soundcloudEmbed || currentTrack.audiomackEmbed || currentTrack.fullSoundcloudEmbed || currentTrack.iframeSrc) {
            // Cannot directly pause embedded iframes from here.
            console.log("Attempted to pause embedded content from album play button, but direct control is not possible.");
            // Optionally, provide a visual cue that the button was clicked but no action taken
            albumPlayButton.classList.add('clicked-effect');
            setTimeout(() => {
                albumPlayButton.classList.remove('clicked-effect');
            }, 200);
            return; // Exit as we cannot control it
        }
        console.log("Album Play Button: Paused current track.");
    } else {
        // If not playing, or paused, play/resume it.
        // The playTrack function will handle whether to resume from lastKnownPlaybackPosition
        // or start from 0 if it's a completely new track/player.
        playTrack(currentTrack, currentTrackIndex, lastKnownPlaybackPosition);
        console.log("Album Play Button: Playing/Resuming current track from lastKnownPlaybackPosition.");
    }
    updateAlbumPlayButtonIcon(); // Always update icon after action
    updateTrackHighlightingInOverlay(); // Update track highlighting in overlay
    updatePlayerUI(); // Sync all player UI
    updateFixedTopHeadingVisibility(); // Sync fixed top heading
}

/**
 * Function to close the album overlay.
 * Playback is NOT stopped by this function. Playback continues in the background.
 */
function closeAlbumOverlay() {
    console.log("closeAlbumOverlay called.");
    if (albumOverlay) {
        albumOverlay.classList.add('hidden'); // Hide the overlay
        albumOverlay.classList.remove('show'); // Remove the show class
        albumOverlay.classList.remove('active'); // Remove the active class here
        document.body.style.overflow = ''; // Re-enable scrolling
        console.log("albumOverlay classes updated: hidden added, show removed, active removed. body overflow restored.");

        // Ensure all inline styles are removed when closing
        albumOverlay.style.removeProperty('background-color');
        albumOverlay.style.removeProperty('border-radius');
        albumOverlay.style.removeProperty('position');
        albumOverlay.style.removeProperty('top');
        albumOverlay.style.removeProperty('bottom');
        albumOverlay.style.removeProperty('left');
        albumOverlay.style.removeProperty('right');
        albumOverlay.style.removeProperty('width');
        albumOverlay.style.removeProperty('height');
        albumOverlay.style.removeProperty('margin');
        albumOverlay.style.removeProperty('padding');
        albumOverlay.style.removeProperty('z-index');
        albumOverlay.style.removeProperty('justify-content');
        albumOverlay.style.removeProperty('align-items');
        albumOverlay.style.removeProperty('overflow');
        albumOverlay.style.removeProperty('transform'); // NEW: Ensure no transform
        albumOverlay.style.removeProperty('filter'); // NEW: Ensure no filter
        console.log("albumOverlay inline styles reset.");

        // The mainPlayBar should now always be visible, its layout is handled by CSS.
        // Controls are enabled/disabled based on whether the playing track is controllable.
        console.log("mainPlayBar display not explicitly set here, controlled by playTrack.");

        const isEmbeddedAlbumPlayingInBackground = playingAlbum && (playingAlbum.rawHtmlEmbed || playingAlbum.fullSoundcloudEmbed || playingAlbum.audiomackEmbed || playingAlbum.iframeSrc);

        if (isEmbeddedAlbumPlayingInBackground) {
            // updateMiniPlayerForEmbed(playingAlbum); // This is now handled by updatePlayerUI
            togglePlayerControls(false); // Disable controls for embedded content
            if (progressBar) progressBar.disabled = true;
            console.log("closeAlbumOverlay: Controls disabled for embedded album playing in background.");
        } else {
            // Ensure mini-player shows the image for controllable tracks
            if (currentAlbumArt) currentAlbumArt.style.display = 'block';
            const dynamicPlayerContainer = playerLeft.querySelector('#youtube-player-container');
            if (dynamicPlayerContainer) dynamicPlayerContainer.remove();
            togglePlayerControls(true); // Re-enable controls for controllable playback
            if (progressBar) progressBar.disabled = false;
            console.log("closeAlbumOverlay: Controls enabled for controllable album playing in background.");
        }

        updateFixedTopHeadingVisibility(); // Update fixed top heading visibility

        // Reset album overlay content padding for larger screens
        if (albumDetailsContent) {
            albumDetailsContent.style.paddingBottom = '20px'; // Default padding
        }

        // Remove the interaction layer if it exists when closing the overlay
        const existingInteractionLayer = albumFullEmbedContainer.querySelector('#embed-interaction-layer');
        if (existingInteractionLayer) {
            existingInteractionLayer.removeEventListener('click', firstClickEmbedHandler); // Ensure listener is removed
            existingInteractionLayer.remove();
            console.log("Existing embed-interaction-layer removed on close.");
        }

        // Remove the closeOverlayBtn listener when the overlay is closed
        if (closeOverlayBtn) {
            closeOverlayBtn.removeEventListener('click', closeAlbumOverlay);
            console.log("closeOverlayBtn listener removed.");
        }

        // Remove prev/next track button listeners when overlay closes
        // These are permanent now, no need to remove here.
        console.log("Main album playbar event listeners are permanent, no removal needed on close.");

        // NEW: Clear main album playbar progress bar interval
        if (albumOverlayProgressBarInterval) {
            clearInterval(albumOverlayProgressBarInterval);
            albumOverlayProgressBarInterval = null;
            console.log("albumOverlayProgressBarInterval cleared on close.");
        }

        // When closing the overlay, manage the albumFullEmbedContainer's visibility.
        // IMPORTANT: Do NOT clear content if it's an embedded player that should continue playing.
        // We only hide it. The content remains in the DOM but is not visible.
        // This is crucial for the embedded player to continue playing.
        if (albumFullEmbedContainer) {
            // If an embedded album is playing in the background, just hide the full embed container.
            if (isEmbeddedAlbumPlayingInBackground) {
                albumFullEmbedContainer.style.display = 'none';
                console.log("albumFullEmbedContainer hidden to allow embedded player to continue in background.");
            } else {
                // If no embedded album is playing, or it's a controllable one, clear the container.
                while (albumFullEmbedContainer.firstChild) {
                    albumFullEmbedContainer.removeChild(albumFullEmbedContainer.firstChild);
                }
                albumFullEmbedContainer.style.display = 'none';
                console.log("albumFullEmbedContainer cleared and hidden as no embedded player is active.");
            }
        }
    }
    // Call toggleMainPlaybarView to update playbar visibility based on overlay state
    toggleMainPlaybarView();
}

/**
 * Closes all major app popups and overlays.
 * This function ensures a single source of truth for managing popup state.
 */
/**
 * Closes all major app popups and overlays, including the liked songs and library popups.
 */
function closeAllOverlays() {
    console.log("closeAllOverlays: Initiating a full closure of all popups and overlays.");
    
    // Close the main login/signup popup
    const authPopup = document.getElementById('popup-overlay');
    if (authPopup) {
        authPopup.classList.add('invisible', 'opacity-0');
        document.body.classList.remove('no-scroll');
    }
    
    // Close the search overlays
    const searchOverlay = document.getElementById('mobile-search-overlay');
    if (searchOverlay) {
        searchOverlay.classList.remove('open');
        document.body.style.overflow = 'auto';
    }
    const searchPopup = document.getElementById('unique-search-popup');
    if (searchPopup) {
        searchPopup.classList.add('unique-hidden');
    }
    
    // Close the album details overlay
    const albumOverlay = document.getElementById('albumOverlay');
    if (albumOverlay) {
        albumOverlay.classList.add('hidden', 'opacity-0');
        albumOverlay.classList.remove('show', 'active');
        document.body.style.overflow = 'auto';
    }
    
    // Close the library popups
    const libraryPopup = document.getElementById('library-popup');
    if (libraryPopup) {
        libraryPopup.classList.add('hidden');
    }
    const likedSongsOverlay = document.getElementById('likedSongsOverlay');
    if (likedSongsOverlay) {
        likedSongsOverlay.classList.remove('open');
        likedSongsOverlay.setAttribute('aria-hidden', 'true');
    }
    
    // Close any smaller popups
    const smallPopups = document.querySelectorAll('.swarify-add-popup-overlay, .song-options-popup-backdrop');
    smallPopups.forEach(p => p.classList.remove('active'));
    
    console.log("closeAllOverlays: All known overlays and popups are now closed.");
}

// --- Player Controls (Play/Pause, Next, Previous, Volume, Progress) ---

// Main Play/Pause button (compact playbar)
if (playPauseBtn) {
    playPauseBtn.addEventListener('click', async (event) => {
        event.stopPropagation();
        await togglePlayback();
    });
}

// Full-Screen Play/Pause button
if (fullPlayPauseBtn) {
    fullPlayPauseBtn.addEventListener('click', async () => {
        await togglePlayback();
    });
}

/**
 * Toggles playback for the currently playing track.
 * This function handles the logic for native audio, YouTube, and Spotify.
 */
async function togglePlayback() {
    if (!playingAlbum || !playingAlbum.tracks || playingAlbum.tracks.length === 0) {
        console.warn("No track loaded to toggle playback.");
        return;
    }
    const currentTrack = playingAlbum.tracks[currentTrackIndex];
    if (!currentTrack) {
        console.error("Current track is undefined, cannot toggle playback.");
        return;
    }

    // Check if the track is controllable by our JS (YouTube or Spotify SDK, or native audio)
    const isControllableTrack = currentTrack.spotifyUri || (currentTrack.iframeSrc && currentTrack.iframeSrc.includes('https://www.youtube.com/embed/')) || (currentTrack.src && !currentTrack.iframeSrc && !currentTrack.spotifyUri && !currentTrack.rawHtmlEmbed && !currentTrack.soundcloudEmbed && !currentTrack.audiomackEmbed && !currentTrack.fullSoundcloudEmbed);

    if (!isControllableTrack) {
        console.log("Toggle playback clicked for embedded content, but direct control is not possible.");
        // Optionally, provide a visual cue that the button was clicked but no action taken
        playPauseBtn.classList.add('clicked-effect');
        fullPlayPauseBtn.classList.add('clicked-effect');
        setTimeout(() => {
            playPauseBtn.classList.remove('clicked-effect');
            fullPlayPauseBtn.classList.remove('clicked-effect');
        }, 200);
        return;
    }

    let isPlaying = false;
    if (audio.src && audio.src === currentTrack.src) {
        isPlaying = !audio.paused;
    } else if (ytPlayer && currentTrack.iframeSrc && currentTrack.iframeSrc.includes('https://www.youtube.com/embed/')) {
        const videoIdMatch = currentTrack.iframeSrc.match(/\/embed\/([a-zA-Z0-9_-]+)/);
        const videoId = videoIdMatch ? videoIdMatch[1] : null;
        if (videoId && ytPlayer.getVideoData() && ytPlayer.getVideoData().video_id === videoId) {
            isPlaying = ytPlayer.getPlayerState() === YT.PlayerState.PLAYING;
        }
    } else if (spotifyPlayer && currentTrack.spotifyUri) {
        try {
            const state = await spotifyPlayer.getCurrentState();
            if (state && state.track_window.current_track.uri === currentTrack.spotifyUri) {
                isPlaying = !state.paused;
            }
        } catch (e) {
            console.warn("Error checking Spotify state for togglePlayback:", e);
            isPlaying = false;
        }
    }

    if (isPlaying) {
        if (audio.src && audio.src === currentTrack.src) audio.pause();
        else if (ytPlayer) ytPlayer.pauseVideo();
        else if (spotifyPlayer) await spotifyPlayer.pause();
        console.log("Playback paused.");
    } else {
        if (audio.src && audio.src === currentTrack.src) audio.play();
        else if (ytPlayer) ytPlayer.playVideo();
        else if (spotifyPlayer) await spotifyPlayer.resume();
        else {
            // If nothing is playing, and it's a controllable track, start playing it.
            playTrack(currentTrack, currentTrackIndex, lastKnownPlaybackPosition);
        }
        console.log("Playback resumed/started.");
    }
    updatePlayerUI(); // Update all UI elements after toggle
    updateAlbumPlayButtonIcon(); // Sync album play button
    updateTrackHighlightingInOverlay(); // Update track highlighting in overlay
    updateFixedTopHeadingVisibility(); // Sync fixed top heading
     highlightPlayingLikedSong();
     updatePlaylistPlayButtons();
    updateCompactPlayButtonIcons();
}


/**
 * Function to go to the next track in the current album.
 */
function nextTrack(event) { // Added event parameter
    if (event) event.stopPropagation(); // Prevent click from bubbling to mainPlayBar
    console.log("nextTrack called.");
    if (!playingAlbum || !playingAlbum.tracks || playingAlbum.tracks.length === 0) {
        // If it's an album that is itself a rawHtmlEmbed (like a playlist),
        // we can't 'next track' within it from our controls.
        if (playingAlbum && (playingAlbum.rawHtmlEmbed || playingAlbum.fullSoundcloudEmbed || playingAlbum.audiomackEmbed || playingAlbum.soundcloudEmbed || playingAlbum.iframeSrc)) {
            console.log("Next track button clicked for embedded content (Spotify/SoundCloud/Audiomack), but direct control is not possible.");
            // Add visual effect for click
            nextTrackBtn.classList.add('clicked-effect');
            fullNextTrackBtn.classList.add('clicked-effect');
            setTimeout(() => {
                nextTrackBtn.classList.remove('clicked-effect');
                fullNextTrackBtn.classList.remove('clicked-effect');
            }, 200);
        }
        return;
    }

    if (isShuffle) {
        currentTrackIndex = Math.floor(Math.random() * playingAlbum.tracks.length);
    } else if (currentTrackIndex < playingAlbum.tracks.length - 1) { // Changed condition for next track
        currentTrackIndex++;
    } else if (isRepeat) { // If repeat is on and at last song, go to first
        currentTrackIndex = 0;
    } else {
        // If not repeat or shuffle and at end, try to play next album
        if (currentTrackIndex === playingAlbum.tracks.length - 1) {
            const currentAlbumIndex = allAlbumsData.findIndex(album => album.id === playingAlbum.id);
            if (currentAlbumIndex !== -1 && currentAlbumIndex < allAlbumsData.length - 1) {
                const nextAlbum = allAlbumsData[currentAlbumIndex + 1];
                if (nextAlbum.tracks && nextAlbum.tracks.length > 0) {
                    playingAlbum = nextAlbum; // Update playingAlbum to the next album
                    currentTrackIndex = 0; // Reset track index for the new album
                    openAlbumDetails(nextAlbum); // Open the next album's details if overlay is open
                    playTrack(nextAlbum.tracks[0], 0);
                    console.log("Manually playing first track of next album.");
                    return; // Exit after playing next album
                }
            }
        }
        console.log("No next track and not repeating/shuffling. Playback will continue until current track ends.");
        return; // Exit if no next track and not repeating/shuffling
    }
    playTrack(playingAlbum.tracks[currentTrackIndex], currentTrackIndex);
    updatePlayerUI(); // Sync all player UI
    updateFixedTopHeadingVisibility(); // Sync fixed top heading
}

/**
 * Function to go to the previous track in the current album.
 */
function prevTrack(event) { // Added event parameter
    if (event) event.stopPropagation(); // Prevent click from bubbling to mainPlayBar
    console.log("prevTrack called.");
    if (!playingAlbum || !playingAlbum.tracks || playingAlbum.tracks.length === 0) {
        if (playingAlbum && (playingAlbum.rawHtmlEmbed || playingAlbum.fullSoundcloudEmbed || playingAlbum.audiomackEmbed || playingAlbum.soundcloudEmbed || playingAlbum.iframeSrc)) {
            console.log("Previous track button clicked for embedded content (Spotify/SoundCloud/Audiomack), but direct control is not possible.");
            prevTrackBtn.classList.add('clicked-effect');
            fullPrevTrackBtn.classList.add('clicked-effect');
            setTimeout(() => {
                prevTrackBtn.classList.remove('clicked-effect');
                fullPrevTrackBtn.classList.remove('clicked-effect');
            }, 200);
        }
        return;
    }

    if (isShuffle) {
        currentTrackIndex = Math.floor(Math.random() * playingAlbum.tracks.length);
    } else if (currentTrackIndex > 0) {
        currentTrackIndex--;
    } else if (isRepeat) { // If repeat is on and at first song, go to last
        currentTrackIndex = playingAlbum.tracks.length - 1;
    } else {
        // If not repeat or shuffle and at beginning, do not stop playback explicitly.
        console.log("No previous track and not repeating/shuffling. Playback will continue until current track ends.");
        return; // Exit if no previous track and not repeating/shuffling
    }
    playTrack(playingAlbum.tracks[currentTrackIndex], currentTrackIndex);
    updatePlayerUI(); // Sync all player UI
    updateFixedTopHeadingVisibility(); // Sync fixed top heading
}

if (prevTrackBtn) {
    prevTrackBtn.addEventListener('click', prevTrack);
}

if (nextTrackBtn) { // Added missing event listener for next track button
    nextTrackBtn.addEventListener('click', nextTrack);
}

if (fullPrevTrackBtn) {
    fullPrevTrackBtn.addEventListener('click', prevTrack);
}

if (fullNextTrackBtn) {
    fullNextTrackBtn.addEventListener('click', nextTrack);
}


// Add event listeners for rewind and fast-forward buttons
if (rewindBtn) {
    rewindBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        console.log("Rewind button clicked.");
        // Implement rewind logic here (e.g., seek back 10 seconds)
        if (audio.src && playingAlbum && playingAlbum.tracks[currentTrackIndex]?.src) {
            audio.currentTime = Math.max(0, audio.currentTime - 10);
        } else if (ytPlayer && playingAlbum && playingAlbum.tracks[currentTrackIndex]?.iframeSrc) {
            ytPlayer.seekTo(Math.max(0, ytPlayer.getCurrentTime() - 10), true);
        } else if (spotifyPlayer && playingAlbum && playingAlbum.tracks[currentTrackIndex]?.spotifyUri) {
            spotifyPlayer.seek(Math.max(0, lastKnownPlaybackPosition - 10) * 1000);
        }
        updatePlayerUI();
    });
}

if (fastForwardBtn) {
    fastForwardBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        console.log("Fast-forward button clicked.");
        // Implement fast-forward logic here (e.g., seek forward 10 seconds)
        if (audio.src && playingAlbum && playingAlbum.tracks[currentTrackIndex]?.src) {
            audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
        } else if (ytPlayer && playingAlbum && playingAlbum.tracks[currentTrackIndex]?.iframeSrc) {
            ytPlayer.seekTo(Math.min(ytPlayer.getDuration(), ytPlayer.getCurrentTime() + 10), true);
        } else if (spotifyPlayer && playingAlbum && playingAlbum.tracks[currentTrackIndex]?.spotifyUri) {
            spotifyPlayer.seek(Math.min(spotifyPlayer.getDuration() / 1000, lastKnownPlaybackPosition + 10) * 1000);
        }
        updatePlayerUI();
    });
}


if (progressBar) {
    progressBar.addEventListener('input', async (e) => {
        e.stopPropagation(); // Prevent click from bubbling to mainPlayBar
        if (ytPlayer && playingAlbum && playingAlbum.tracks[currentTrackIndex]?.iframeSrc) {
            // Control YouTube player progress
            const seekTime = parseFloat(e.target.value);
            ytPlayer.seekTo(seekTime, true); // true for allowSeekAhead
            lastKnownPlaybackPosition = seekTime;
        } else if (spotifyPlayer && playingAlbum && playingAlbum.tracks[currentTrackIndex]?.spotifyUri) {
            // Control Spotify player progress
            const seekTimeMs = parseFloat(e.target.value) * 1000; // Convert seconds to milliseconds
            await spotifyPlayer.seek(seekTimeMs);
            lastKnownPlaybackPosition = parseFloat(e.target.value);
        } else if (audio.duration && playingAlbum && playingAlbum.tracks[currentTrackIndex]?.src) {
            // Control native audio progress
            audio.currentTime = parseFloat(e.target.value);
            lastKnownPlaybackPosition = audio.currentTime;
        } else if (playingAlbum && (playingAlbum.rawHtmlEmbed || playingAlbum.fullSoundcloudEmbed || playingAlbum.audiomackEmbed || playingAlbum.iframeSrc)) {
            // No direct control for embedded iframes, so we don't allow seeking.
            console.log("Seeking not possible for embedded content (Spotify/SoundCloud/Audiomack).");
        }
        updatePlayerUI(); // Sync all player UI
    });
}

// Full-screen player progress bar
if (fullScreenProgressBar) {
    fullScreenProgressBar.addEventListener('input', async (e) => {
        if (ytPlayer && playingAlbum && playingAlbum.tracks[currentTrackIndex]?.iframeSrc) {
            const seekTime = parseFloat(e.target.value);
            ytPlayer.seekTo(seekTime, true);
            lastKnownPlaybackPosition = seekTime;
        } else if (spotifyPlayer && playingAlbum && playingAlbum.tracks[currentTrackIndex]?.spotifyUri) {
            const seekTimeMs = parseFloat(e.target.value) * 1000;
            await spotifyPlayer.seek(seekTimeMs);
            lastKnownPlaybackPosition = parseFloat(e.target.value);
        } else if (audio.duration && playingAlbum && playingAlbum.tracks[currentTrackIndex]?.src) {
            audio.currentTime = parseFloat(e.target.value);
            lastKnownPlaybackPosition = audio.currentTime;
        } else if (playingAlbum && (playingAlbum.rawHtmlEmbed || playingAlbum.fullSoundcloudEmbed || playingAlbum.audiomackEmbed || playingAlbum.iframeSrc)) {
            console.log("Seeking not possible for embedded content (Spotify/SoundCloud/Audiomack).");
        }
        updatePlayerUI();
    });
}


if (volumeBar) {
    volumeBar.addEventListener('input', (e) => {
        e.stopPropagation(); // Prevent click from bubbling to mainPlayBar
        const volume = parseFloat(e.target.value);
        if (isNaN(volume)) return;

        if (ytPlayer && playingAlbum && playingAlbum.tracks[currentTrackIndex]?.iframeSrc) {
            // Control YouTube player volume (0-100)
            ytPlayer.setVolume(volume * 100);
        } else if (spotifyPlayer && playingAlbum && playingAlbum.tracks[currentTrackIndex]?.spotifyUri) {
            // Control Spotify player volume (0-1)
            spotifyPlayer.setVolume(volume);
        } else if (playingAlbum && (playingAlbum.rawHtmlEmbed || playingAlbum.fullSoundcloudEmbed || playingAlbum.audiomackEmbed || playingAlbum.iframeSrc)) {
            // No direct control for embedded iframes.
            console.log("Volume bar adjusted for embedded content (Spotify/SoundCloud/Audiomack), but direct control is not possible.");
        } else {
            // Control native audio volume (0-1)
            audio.volume = volume;
        }
    });
    // Set initial volume for all players
    audio.volume = 0.5;
    if (volumeBar) volumeBar.value = 0.5;
}

// Repeat and Shuffle Buttons (Compact Playbar)
if (repeatBtn) {
    repeatBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        isRepeat = !isRepeat;
        repeatBtn.classList.toggle('active', isRepeat);
        if (isRepeat && isShuffle) {
            isShuffle = false;
            if (shuffleBtn) shuffleBtn.classList.remove('active');
            if (fullShuffleBtn) fullShuffleBtn.classList.remove('active');
        }
        if (fullRepeatBtn) fullRepeatBtn.classList.toggle('active', isRepeat);
        console.log("Repeat mode:", isRepeat ? "On" : "Off");
    });
}

if (shuffleBtn) {
    shuffleBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        isShuffle = !isShuffle;
        shuffleBtn.classList.toggle('active', isShuffle);
        if (isShuffle && isRepeat) {
            isRepeat = false;
            if (repeatBtn) repeatBtn.classList.remove('active');
            if (fullRepeatBtn) fullRepeatBtn.classList.remove('active');
        }
        if (fullShuffleBtn) fullShuffleBtn.classList.toggle('active', isShuffle);
        console.log("Shuffle mode:", isShuffle ? "On" : "Off");
    });
}

// Repeat and Shuffle Buttons (Full-Screen Player)
if (fullRepeatBtn) {
    fullRepeatBtn.addEventListener('click', () => {
        isRepeat = !isRepeat;
        fullRepeatBtn.classList.toggle('active', isRepeat);
        if (isRepeat && isShuffle) {
            isShuffle = false;
            if (fullShuffleBtn) fullShuffleBtn.classList.remove('active');
            if (shuffleBtn) shuffleBtn.classList.remove('active');
        }
        if (repeatBtn) repeatBtn.classList.toggle('active', isRepeat);
        console.log("Full-screen Repeat mode:", isRepeat ? "On" : "Off");
    });
}

if (fullShuffleBtn) {
    fullShuffleBtn.addEventListener('click', () => {
        isShuffle = !isShuffle;
        fullShuffleBtn.classList.toggle('active', isShuffle);
        if (isShuffle && isRepeat) {
            isRepeat = false;
            if (fullRepeatBtn) fullRepeatBtn.classList.remove('active');
            if (repeatBtn) repeatBtn.classList.remove('active');
        }
        if (shuffleBtn) shuffleBtn.classList.toggle('active', isShuffle);
        console.log("Full-screen Shuffle mode:", isShuffle ? "On" : "Off");
    });
}


// This function is called by the YouTube Iframe API when it's ready
function onYouTubeIframeAPIReady() {
    console.log("YouTube Iframe API is ready.");
    // No direct action needed here, playTrack will use ytPlayer when a YouTube track is selected.
}

/**
 * Creates the HTML string for an album card.
 * This function is included for completeness but is NOT used to generate the initial
 * cards on the front page as per user's request. It's here as a reference for how
 * a card *should* be structured if dynamically created.
 * Make sure the play button has the 'card-play-button' class and 'data-album-id'.
 * @param {Object} album - The album data object.
 * @returns {string} The HTML string for the album card.
 */
function createAlbumCardHtml(album) {
    // This is a basic example. You might have more complex card structures.
    // Ensure the `data-album-id` is on the main card div AND the play button
    // The play button should also have a distinct class like 'card-play-button'
    return `
        <div class="card" data-album-id="${album.id}" data-album-title="${album.title}" data-album-artist="${album.artist}">
            <img src="${album.coverArt}" alt="${album.title} Cover">
            <div class="play-button card-play-button" data-album-id="${album.id}">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="12" fill="#1ED760" />
                    <polygon points="9,6 19,12 9,18" fill="#000000" />
                </svg>
            </div>
            <div class="card-title">${album.title}</div>
            <div class="card-artists">${album.artist}</div>
        </div>
    `;
}

/**
 * Attaches event listeners to all existing HTML album cards and their play buttons.
 * This function is called once on DOMContentLoaded after albums data is fetched.
 */
function attachEventListenersToHtmlCards() {
    console.log("Attaching event listeners to existing HTML cards.");

    // Event listener for clicking anywhere on the album card (to open album details)
    const albumCards = document.querySelectorAll('.spotifyPlaylists .card, .AlbumPlaylists .card, .popular-artists .card, #explore-more-albums-cards .card'); // Select all cards in all sections, including dynamically added ones
    albumCards.forEach(card => {
        // Log the data attributes and text content of each card being attached
        console.log(`Attaching listener to card: ID='${card.dataset.albumId}', Title='${card.querySelector('.card-title')?.textContent.trim()}', Artist='${card.querySelector('.card-artists')?.textContent.trim()}'`);

        // Remove existing listener to prevent duplicates if this function is called multiple times
        card.removeEventListener('click', handleCardClick);
        card.addEventListener('click', handleCardClick);
    });

    // Event listener for the specific green play button on each card
    const playButtons = document.querySelectorAll('.card-play-button');
    playButtons.forEach(button => {
        // Log the data-album-id of each play button
        const card = button.closest('.card');
        console.log(`Attaching listener to play button for card ID: '${card?.dataset.albumId}'`);

        button.removeEventListener('click', handlePlayButtonClick);
        button.addEventListener('click', handlePlayButtonClick);
    });
}

/**
 * Handler for general album card clicks (opens details).
 * This function now uses the data-album-id for a more robust lookup.
 * Playback is NOT initiated by this function.
 * @param {Event} event
 */
function handleCardClick(event) {
    // Prevent opening the album details if the play button was clicked
    if (event.target.closest('.card-play-button')) {
        return; // Let the play button's specific handler take over
    }

    const card = event.currentTarget; // The .card element itself
    const albumId = card.dataset.albumId; // Get album ID from the card's dataset

    console.log(`handleCardClick: Clicked card has ID='${albumId}'`);

    if (!albumId) {
        console.warn("Card clicked, but could not retrieve data-album-id. Cannot open album details.");
        // No message box here as per user request
        return;
    }

    // Find the corresponding album data from the fetched allAlbumsData using the album ID
    const albumToOpen = allAlbumsData.find(album => album.id === albumId);

    if (albumToOpen) {
        console.log(`handleCardClick: Found album in allAlbumsData: ${albumToOpen.title} (ID: ${albumToOpen.id})`);
        openAlbumDetails(albumToOpen);
    } else {
        console.warn(`handleCardClick: Album with ID ${albumId} not found in loaded data. Data might not be loaded or ID incorrect. allAlbumsData length: ${allAlbumsData.length}`);
        // No message box here as per user request
    }
}

/**
 * Handler for the green play button clicks (opens details and plays first track).
 * This function primarily relies on the `data-album-id` attribute on the card.
 * Playback is NOT stopped by this function directly. It calls `openAlbumDetails`
 * and then handles playback initiation if a track is specified.
 * @param {Event} event
 */
function handlePlayButtonClick(event) {
    event.stopPropagation(); // Prevent the parent card's click event from firing

    const button = event.currentTarget; // The .card-play-button element
    const card = button.closest('.card'); // Get the parent card element
    const albumId = card.dataset.albumId; // Get album ID from the card's dataset

    console.log(`handlePlayButtonClick: Clicked play button for card ID='${albumId}'`);

    if (!albumId) {
        console.error("Play button clicked on a card without a data-album-id. Cannot play track.");
        showMessageBox("Cannot play: Album ID missing from card. Please ensure your HTML cards have 'data-album-id'.", "error");
        return;
    }

    // Now, `album.id` will correctly match the `data-album-id` after transformation in fetchAlbums
    const albumToPlay = allAlbumsData.find(album => album.id === albumId);
    if (albumToPlay) {
        console.log(`handlePlayButtonClick: Found album in allAlbumsData: ${albumToPlay.title} (ID: ${albumToPlay.id})`);

        // If this is an embedded album, stop all previous controllable playback before opening its overlay
        if (albumToPlay.rawHtmlEmbed || albumToPlay.fullSoundcloudEmbed || albumToPlay.audiomackEmbed || albumToPlay.iframeSrc) {
            console.log("Embedded album play button clicked. Calling stopControllablePlayersOnly before opening overlay.");
            stopControllablePlayersOnly(); // Stop any existing controllable playback
            playingAlbum = albumToPlay; // NEW: Set playingAlbum here
            currentlyPlayedCardId = albumToPlay.id; // Set the ID of the playing card
            hidePlayedCard(); // Hide the playing card
            openAlbumDetails(albumToPlay); // Open the album details overlay
            console.log("Embedded album play button clicked, letting firstClickEmbedHandler manage play.");
        } else {
            // For non-embedded albums (tracklists), open the album details and automatically play the first track
            openAlbumDetails(albumToPlay); // Open the album details overlay
            if (albumToPlay.tracks && albumToPlay.tracks.length > 0) {
                console.log("Non-embedded album play button clicked. Playing first track automatically.");
                playTrack(albumToPlay.tracks[0], 0); // Play the first track (index 0)
            } else {
                console.log("Non-embedded album play button clicked, but no tracks found to play automatically.");
                showMessageBox('No tracks available to play for this album.', 'info');
            }
        }
    } else {
        console.warn(`handlePlayButtonClick: Album with ID ${albumId} not found when trying to play. allAlbumsData length: ${allAlbumsData.length}`);
        showMessageBox('Could not find album to play. Data might not be loaded or ID incorrect.', 'error');
    }
}


/*
  search_with_overlay_fixed.js
  Fixed behavior:
  - Bottom search button → popup first
  - Popup → overlay on input/icon click
  - Overlay back → popup
  - Clicking album closes popup/overlay
*/

// ---------------------------
// Configuration & globals

// ---------------------------
// Fetch albums (unchanged)
// ---------------------------
/*
  search_with_overlay.js
  This is a corrected version of the search script.
  It ensures the mobile overlay and recent searches function as expected.
  - Keeps user's fetchAlbums() logic as it was largely correct.
  - Consolidates and corrects the logic for showing/hiding the small popup and the full-screen overlay.
  - Ensures recent searches are stored in-memory and correctly rendered/cleared in the mobile overlay.
  - Guarantees that selecting an album closes all search UI components.
*/

// ---------------------------
// Configuration & globals
// ---------------------------


// Helper function to parse a duration string like "M:SS" into seconds
function parseDurationToSeconds(duration) {
    if (!duration) return 0;
    if (typeof duration === 'number') return duration;
    const parts = String(duration).split(':');
    if (parts.length === 1) {
        const n = parseInt(parts[0], 10);
        return isNaN(n) ? 0 : n;
    }
    const mins = parseInt(parts[0], 10) || 0;
    const secs = parseInt(parts[1], 10) || 0;
    return mins * 60 + secs;
}

// ---------------------------
// The main fetchAlbums() function from the previous version.
// This function handles fetching album data and populating the UI.
// ---------------------------
async function fetchAlbums() {
    console.log("fetchAlbums: Starting album data fetch...");
    try {
        console.log(`fetchAlbums: Attempting to fetch from: ${BACKEND_BASE_URL}/api/albums`);
        const response = await fetch(`${BACKEND_BASE_URL}/api/albums`, {
            method: 'GET',
            headers: {
                'ngrok-skip-browser-warning': 'true',
                'Content-Type': 'application/json'
            }
        });
        console.log("fetchAlbums: Fetch response received.");

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}. Details: ${errorText.substring(0, 200)}...`);
        }

        const rawAlbumsData = await response.json();
        console.log("fetchAlbums: Raw album data received from backend:", rawAlbumsData);

        // Map _id to id for consistency and parse track durations
        allAlbumsData = rawAlbumsData.map(album => {
            const albumId = album._id && typeof album._id === 'object' && album._id.$oid
                ? album._id.$oid
                : album._id;

            const processedTracks = album.tracks ? album.tracks.map(track => {
                const durationInSeconds = parseDurationToSeconds(track.duration);
                return {
                    ...track,
                    duration: durationInSeconds
                };
            }) : [];

            return {
                ...album,
                id: albumId,
                tracks: processedTracks
            };
        });
        console.log("fetchAlbums: Albums data transformed and stored. Total albums:", allAlbumsData.length);

        // Remove any previous error message if fetch was successful
        const existingErrorMessage = document.querySelector('.backend-error-message');
        if (existingErrorMessage) {
            existingErrorMessage.remove();
        }

        if (typeof showMessageBox === 'function') {
            try { showMessageBox('Album data loaded successfully!', 'success'); } catch(e) { console.warn('showMessageBox threw', e); }
        }

        // Populate Explore More Albums if container exists
        if (exploreMoreAlbumsCardsContainer) {
            exploreMoreAlbumsCardsContainer.innerHTML = '';
            allAlbumsData.forEach(album => {
                const isAlreadyDisplayed = document.querySelector(`.card[data-album-id="${album.id}"]`);
                if (!isAlreadyDisplayed) {
                    let cardHtml = '';
                    if (typeof createAlbumCardHtml === 'function') {
                        cardHtml = createAlbumCardHtml(album);
                    } else {
                        cardHtml = `
                            <div class="card" data-album-id="${album.id}">
                                <img src="${album.coverArt || ''}" alt="${album.title || ''}">
                                <div class="card-title">${album.title || ''}</div>
                                <div class="card-artists">${album.artist || ''}</div>
                            </div>`;
                    }
                    exploreMoreAlbumsCardsContainer.insertAdjacentHTML('beforeend', cardHtml);
                }
            });
            console.log("fetchAlbums: 'Explore More Albums' section dynamically populated.");
        }

        // Attach listeners to HTML cards if user has function
        if (typeof attachEventListenersToHtmlCards === 'function') {
            try { attachEventListenersToHtmlCards(); } catch(e) { console.warn('attachEventListenersToHtmlCards threw', e); }
        }
    } catch (error) {
        console.error("fetchAlbums: Error fetching albums data:", error);
        const mainContentArea = document.querySelector('.main-content');
        if (mainContentArea) {
            let errorMessageDiv = mainContentArea.querySelector('.backend-error-message');
            if (!errorMessageDiv) {
                errorMessageDiv = document.createElement('div');
                errorMessageDiv.classList.add('backend-error-message');
                errorMessageDiv.style.cssText = `
                    color: white;
                    text-align: center;
                    padding: 20px;
                    background-color: #333;
                    border-radius: 8px;
                    margin-top: 50px;
                    max-width: 600px;
                    margin-left: auto;
                    margin-right: auto;
                `;
                mainContentArea.prepend(errorMessageDiv);
            }

            errorMessageDiv.innerHTML = `
                <p>Failed to load album data from backend. Please ensure your backend server is running and accessible at:</p>
                <p style="font-weight: bold; color: #1ED760;">${BACKEND_BASE_URL}</p>
                <p>Error: ${error.message}</p>
            `;
        }
    }
}

// ---------------------------
// Search message helpers
// ---------------------------
let searchMessageTimeoutLocal = null;
function displaySearchMessage(message, type = 'info') {
    if (!searchMessageContainer) {
        searchMessageContainer = document.createElement('div');
        searchMessageContainer.id = 'search-message-container';
        searchMessageContainer.style.cssText = `
            position: fixed;
            background-color: #333;
            color: #ffffff;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 0.85em;
            white-space: nowrap;
            opacity: 0;
            transition: opacity 0.5s ease-in-out, transform 0.5s ease-in-out;
            transform: translateY(-10px);
            pointer-events: none;
            z-index: 100;
        `;
        document.body.appendChild(searchMessageContainer);
    }
    const inputElement = document.activeElement;
    if (inputElement && inputElement.tagName === 'INPUT' && inputElement.type === 'text') {
        const searchRect = inputElement.getBoundingClientRect();
        searchMessageContainer.style.left = `${searchRect.left}px`;
        searchMessageContainer.style.top = `${searchRect.bottom + 5}px`;
    } else {
        searchMessageContainer.style.left = '50%';
        searchMessageContainer.style.transform = 'translateX(-50%)';
        searchMessageContainer.style.top = '10px';
    }
    if (searchMessageTimeoutLocal) clearTimeout(searchMessageTimeoutLocal);
    searchMessageContainer.textContent = message;
    searchMessageContainer.style.color = type === 'error' ? '#FF6B6B' : '#ffffff';
    searchMessageContainer.style.opacity = '1';
    searchMessageContainer.style.transform = 'translateY(0)';
    searchMessageTimeoutLocal = setTimeout(() => {
        searchMessageContainer.style.opacity = '0';
        searchMessageContainer.style.transform = 'translateY(-10px)';
        setTimeout(() => { searchMessageContainer.textContent = ''; }, 500);
    }, 4000);
}
function clearSearchMessage() {
    if (searchMessageContainer) {
        if (searchMessageTimeoutLocal) clearTimeout(searchMessageTimeoutLocal);
        searchMessageContainer.style.opacity = '0';
        searchMessageContainer.style.transform = 'translateY(-10px)';
        searchMessageContainer.textContent = '';
    }
}

// Global function to close all search UIs
// This function is now the single source of truth for closing all search-related elements.
window.closeAllSearchUi = function() {
    const mobileOverlay = document.getElementById('mobile-search-overlay');
    const smallPopup = document.getElementById('unique-search-popup');
    const overlayBackdrop = document.getElementById('overlay');
    const popupSearchInput = document.querySelector(".unique-search-input");
    
    if (mobileOverlay) {
        mobileOverlay.classList.remove('open');
        mobileOverlay.setAttribute('aria-hidden', 'true');
        mobileOverlay.querySelector('#mobile-overlay-results').innerHTML = '';
        document.body.style.overflow = 'auto'; // Re-enable scrolling
    }
    if (smallPopup) {
        smallPopup.classList.add('unique-hidden');
    }
    if (overlayBackdrop) {
        overlayBackdrop.style.display = 'none';
    }
    // Clear the input in the small popup on close
    if (popupSearchInput) {
        popupSearchInput.value = '';
    }
};

// ---------------------------
// Enhanced renderSuggestions + attachLiveSearch with `mode`
// mode: 'popup' (small dropdown) | 'overlay' (mobile full-screen overlay)
// ---------------------------
let recentSearches = [];

function renderSuggestions(results, container, mode = 'popup') {
    container.innerHTML = '';
    if (!results || results.length === 0) {
        container.style.display = 'none';
        return;
    }

    results.forEach(album => {
        const suggestion = document.createElement('div');
        suggestion.className = 'suggestion-item';
        suggestion.style.cssText = (mode === 'overlay') ? `
            display:flex;
            align-items:center;
            padding:12px 14px;
            border-bottom:1px solid rgba(255,255,255,0.03);
            cursor:pointer;
        ` : `
            display:flex;
            align-items:center;
            padding:8px;
            cursor:pointer;
        `;

        const imgSrc = album.coverArt || album.img || '';
        suggestion.innerHTML = `
            <img src="${imgSrc}" alt="" style="width:${mode==='overlay'?'56px':'40px'};height:${mode==='overlay'?'56px':'40px'};border-radius:6px;margin-right:12px;object-fit:cover;">
            <div style="min-width:0">
                <div style="color:#fff;font-size:${mode==='overlay'?'15px':'14px'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${album.title || ''}</div>
                <div style="color:#aaa;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${album.artist || ''}</div>
            </div>
        `;

        suggestion.addEventListener('click', (e) => {
            e.stopPropagation();
            addToRecents(album);
            closeAllSearchUi();
            
            if (typeof openAlbumDetails === 'function') {
                try { openAlbumDetails(album); } catch(err) { console.error('openAlbumDetails threw', err); }
            } else {
                console.warn('openAlbumDetails is not defined. Click will not open album.');
            }
        });

        container.appendChild(suggestion);
    });

    container.style.display = 'block';
}

function attachLiveSearch(inputElement, container, mode = 'popup') {
    if (!inputElement || !container) return;
    let dt;
    inputElement.addEventListener('input', () => {
        const query = inputElement.value.trim().toLowerCase();
        clearTimeout(dt);
        if (query.length < 2) {
            container.innerHTML = '';
            container.style.display = 'none';
            // On mobile, if input is empty, show recents again
            if (mode === 'overlay') renderMobileRecents();
            return;
        }
        dt = setTimeout(() => {
            if (!allAlbumsData || allAlbumsData.length === 0) return;
            const filtered = allAlbumsData.filter(album => {
                const title = (album.title||'').toLowerCase();
                const artist = (album.artist||'').toLowerCase();
                const trackMatch = (album.tracks||[]).some(t => ((t.title||'').toLowerCase().includes(query) || (t.artist||'').toLowerCase().includes(query)));
                return title.includes(query) || artist.includes(query) || trackMatch;
            });
            // On mobile, hide the recents section when there's a search query
            const mobileRecentsContainer = document.getElementById('mobile-recents');
            if (mobileRecentsContainer) {
                 mobileRecentsContainer.style.display = filtered.length > 0 ? 'none' : 'block';
            }
            renderSuggestions(filtered, container, mode);
        }, 200);
    });

    inputElement.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            const first = container.querySelector('.suggestion-item');
            if (first) first.click();
        }
    });
}

// ---------------------------
// Helper: createSuggestionsContainer
// ---------------------------
function createSuggestionsContainer(inputElement) {
    const container = document.createElement('div');
    container.classList.add('search-suggestions');
    container.style.cssText = `
        position: absolute;
        left: 0;
        right: 0;
        top: 100%;
        background: #121212;
        max-height: 320px;
        overflow-y: auto;
        border-radius: 6px;
        z-index: 9999;
        display: none;
        box-shadow: 0 8px 24px rgba(0,0,0,0.6);
    `;
    inputElement.parentElement.style.position = "relative";
    inputElement.parentElement.appendChild(container);
    return container;
}

// ---------------------------
// Mobile/Tablet full-screen overlay (injected by JS)
// ---------------------------
(function injectMobileOverlay() {
    // Only inject on mobile/tablet (if screen size is less than or equal to 1024px)
    if (window.innerWidth > 1024) return;

    // Inject minimal CSS for overlay and animations
    const style = document.createElement('style');
    style.innerHTML = `
    /* mobile overlay styles */
    #mobile-search-overlay {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: #0f0f10;
        z-index: 10002;
        display: none;
        flex-direction: column;
        transform: translateY(8%);
        opacity: 0;
        transition: transform 260ms ease, opacity 260ms ease;
    }
    #mobile-search-overlay.open {
        display:flex;
        transform: translateY(0);
        opacity: 1;
    }
    #mobile-search-overlay .overlay-header {
        display:flex;
        align-items:center;
        gap:8px;
        padding:12px 14px;
        border-bottom:1px solid rgba(255,255,255,0.03);
        background:linear-gradient(180deg, rgba(0,0,0,0.35), rgba(0,0,0,0.05));
    }
    #mobile-search-overlay .overlay-back {
        background:none;border:none;color:#fff;font-size:20px;padding:8px;cursor:pointer;
    }
    #mobile-search-overlay .overlay-search-input {
        flex:1;
        background:#171717;border-radius:999px;padding:10px 14px;border:none;color:#fff;font-size:16px;
    }
    #mobile-search-overlay .overlay-clear {
        background:none;border:none;color:#aaa;font-size:18px;cursor:pointer;padding:6px;
    }
    #mobile-search-overlay .overlay-body {
        padding:12px;
        overflow:auto;
        flex:1;
    }
    #mobile-recents { margin-bottom: 20px; }
    #mobile-recent-list .recent-item {
        display:flex;align-items:center;padding:10px;border-radius:8px;margin-bottom:8px;background:#111;cursor:pointer;
    }
    #mobile-recent-list .recent-item img { width:48px;height:48px;border-radius:6px;margin-right:12px;object-fit:cover; }
    #mobile-recent-list .recent-item .meta { color:#fff; }
    #mobile-recent-list .recent-empty { color:#888;padding:16px;text-align:center; }
    #mobile-overlay-results { margin-top:6px;border-top:1px solid rgba(255,255,255,0.02); }
    `;
    document.head.appendChild(style);

    const overlayHtml = `
    <div id="mobile-search-overlay" aria-hidden="true">
        <div class="overlay-header">
            <button class="overlay-back" id="mobile-overlay-back">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:24px; height:24px; color:white;">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
            </button>
            <input id="mobile-overlay-input" class="overlay-search-input" placeholder="Search for songs, albums, artists..." autocomplete="off" />
            <button id="mobile-overlay-clear" class="overlay-clear" title="Clear">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:24px; height:24px; color:white;">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
        <div class="overlay-body">
            <div id="mobile-recents">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                    <h3 style="color:#fff;margin:0;font-size:16px;">Recent searches</h3>
                    <button id="mobile-clear-recents" style="background:none;border:none;color:#8f8f8f;cursor:pointer;font-size:12px;">Clear</button>
                </div>
                <div id="mobile-recent-list"></div>
            </div>
            <div id="mobile-overlay-results"></div>
        </div>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', overlayHtml);

    // Elements
    const mobileOverlay = document.getElementById('mobile-search-overlay');
    const mobileOverlayBack = document.getElementById('mobile-overlay-back');
    const mobileOverlayInput = document.getElementById('mobile-overlay-input');
    const mobileOverlayClear = document.getElementById('mobile-overlay-clear');
    const mobileRecentList = document.getElementById('mobile-recent-list');
    const mobileOverlayResults = document.getElementById('mobile-overlay-results');
    const mobileRecentsContainer = document.getElementById('mobile-recents');
    const mobileClearRecents = document.getElementById('mobile-clear-recents');

    // Recent searches helpers
    window.renderMobileRecents = function() {
        mobileRecentList.innerHTML = '';
        if (!recentSearches || recentSearches.length === 0) {
            mobileRecentList.innerHTML = '<div class="recent-empty">No recent searches</div>';
            return;
        }
        recentSearches.forEach(album => {
            const div = document.createElement('div');
            div.className = 'recent-item';
            div.innerHTML = `
                <img src="${album.coverArt || album.img || ''}" alt="">
                <div style="flex:1;min-width:0;">
                    <div style="color:#fff;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${album.title || ''}</div>
                    <div style="color:#aaa;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${album.artist || ''}</div>
                </div>
                <button aria-label="Remove" class="recent-remove" style="background:none;border:none;color:#8f8f8f;font-size:18px;cursor:pointer;padding:6px;">×</button>
            `;
            div.querySelector('.recent-remove').addEventListener('click', (ev) => {
                ev.stopPropagation();
                recentSearches = recentSearches.filter(a => a.id !== album.id);
                window.renderMobileRecents();
            });
            div.addEventListener('click', () => {
                addToRecents(album);
                closeAllSearchUi();
                if (typeof openAlbumDetails === 'function') openAlbumDetails(album);
            });
            mobileRecentList.appendChild(div);
        });
    }

    window.addToRecents = function(album) {
        recentSearches = recentSearches.filter(a => a.id !== album.id);
        recentSearches.unshift(album);
        if (recentSearches.length > 10) recentSearches.pop();
        window.renderMobileRecents();
    }

    function clearRecents() {
        recentSearches = [];
        window.renderMobileRecents();
    }

    // Open overlay: called when popup search input is clicked on mobile/tablet
    function openMobileOverlay(initialQuery = '') {
        mobileOverlay.classList.add('open');
        mobileOverlay.setAttribute('aria-hidden', 'false');
        mobileOverlayInput.value = initialQuery || '';
        mobileRecentsContainer.style.display = 'block';
        mobileOverlayResults.innerHTML = '';
        document.body.style.overflow = 'hidden'; // Disable background scrolling
        window.renderMobileRecents();
        setTimeout(() => {
            mobileOverlayInput.focus();
            if (initialQuery && initialQuery.length >= 2) {
                const evt = new Event('input', { bubbles: true });
                mobileOverlayInput.dispatchEvent(evt);
            }
        }, 80);
    }

    // Event listeners for the mobile overlay
    mobileOverlayBack.addEventListener('click', (e) => {
        e.preventDefault();
        closeAllSearchUi();
    });

    mobileOverlayClear.addEventListener('click', () => {
        mobileOverlayInput.value = '';
        mobileOverlayResults.innerHTML = '';
        mobileRecentsContainer.style.display = 'block';
        window.renderMobileRecents();
        mobileOverlayInput.focus();
    });

    mobileClearRecents.addEventListener('click', () => {
        clearRecents();
    });

    attachLiveSearch(mobileOverlayInput, mobileOverlayResults, 'overlay');

   
})();

// ---------------------------
// Small popup wiring (Corrected to open popup first)
// ---------------------------
function openSearchPopup() {
    const mobileOverlay = document.getElementById('mobile-search-overlay');
    const smallPopup = document.getElementById('unique-search-popup');
    const overlayBackdrop = document.getElementById('overlay');

    if (window.innerWidth <= 1024) {
        // For mobile/tablet, open the full-screen overlay directly.
        if (mobileOverlay) {
            mobileOverlay.classList.add('open');
            mobileOverlay.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden'; // Disable background scrolling
            window.renderMobileRecents(); // Display recent searches
            setTimeout(() => {
                const mobileInput = document.getElementById('mobile-overlay-input');
                if (mobileInput) mobileInput.focus();
            }, 80);
        }
    } else {
        // For desktop, open the small search popup.
        if (smallPopup) {
            smallPopup.classList.remove('unique-hidden');
            if (overlayBackdrop) overlayBackdrop.style.display = 'block';
            const popupSearchInput = smallPopup.querySelector(".unique-search-input");
            if (popupSearchInput) popupSearchInput.focus();
        }
    }
}

const bottomSearchLink = document.getElementById("unique-search-icon-link");
if (bottomSearchLink) {
    bottomSearchLink.addEventListener("click", (e) => {
        e.preventDefault();
        openSearchPopup();
    });
}

// ---------------------------
// Initial data fetch on load
// ---------------------------
document.addEventListener("DOMContentLoaded", () => {
    fetchAlbums();
});

// ----------


function firstClickEmbedHandler() {
    console.log("First click on embedded album detected. Handling previous embedded playback removal.");

    // Stop controllable players (native audio, YouTube API player instance, Spotify SDK)
    // This does NOT stop embedded iframe players (they must be removed from DOM to stop).
    try {
        stopControllablePlayersOnly();
    } catch (e) {
        console.warn("Error calling stopControllablePlayersOnly:", e);
    }

    const prevPlayingAlbumId = playingAlbum ? playingAlbum.id : null;
    const newAlbumId = currentAlbum ? currentAlbum.id : null;
    console.log("firstClickEmbedHandler: prevPlayingAlbumId=", prevPlayingAlbumId, "newAlbumId=", newAlbumId);

    // Remove any iframe elements that belong to the previously playing embedded album(s).
    // Keep any iframe that matches the currently opened album (newAlbumId).
    try {
        const allIframes = Array.from(document.querySelectorAll('iframe[data-album-id]'));
        allIframes.forEach(iframe => {
            try {
                const aid = iframe.dataset.albumId;
                if (!aid) return;
                // If the iframe belongs to a different (previous) album, remove it.
                if (newAlbumId && aid !== String(newAlbumId)) {
                    iframe.remove();
                    console.log("Removed previous embedded iframe for albumId:", aid);
                }
                // If there's no newAlbumId (defensive), and iframe != current overlay iframe, remove all.
            } catch (e) {
                console.warn("Error evaluating iframe dataset:", e);
            }
        });
    } catch (e) {
        console.warn("Error removing previous iframes:", e);
    }

    // Additionally, remove any hidden iframes inside albumFullEmbedContainer that are not the new one.
    try {
        if (albumFullEmbedContainer) {
            const containerIframes = Array.from(albumFullEmbedContainer.querySelectorAll('iframe'));
            containerIframes.forEach(f => {
                const aid = f.dataset.albumId;
                if (newAlbumId && aid !== String(newAlbumId)) {
                    f.remove();
                    console.log("Removed non-current iframe from albumFullEmbedContainer (id=" + aid + ")");
                }
            });
        }
    } catch (e) {
        console.warn("Error cleaning albumFullEmbedContainer iframes:", e);
    }

    // Now set playingAlbum to the newly opened album (the overlay's album view)
    try {
        playingAlbum = currentAlbum;
        currentlyPlayedCardId = playingAlbum ? playingAlbum.id : null;
        console.log("firstClickEmbedHandler: playingAlbum set to currentAlbum id=", currentlyPlayedCardId);
        hidePlayedCard();
    } catch (e) {
        console.warn("Error setting playingAlbum/currentlyPlayedCardId:", e);
    }

    // Remove the interaction layer so iframe receives direct input
    const embedInteractionLayer = document.getElementById('embed-interaction-layer');
    if (embedInteractionLayer) {
        try {
            embedInteractionLayer.removeEventListener('click', firstClickEmbedHandler);
        } catch (e) {}
        embedInteractionLayer.remove();
        console.log('embed-interaction-layer removed after first click.');
    }

    // Update playbar and fixed heading to reflect the newly active embedded album
    try {
        updatePlayerUI();
        updateFixedTopHeadingVisibility();
    } catch (e) {
        console.warn("Error updating player UI after first click:", e);
    }
}

    // The embedded iframe itself is NOT removed here. It remains active.
    // Its playback is managed by the iframe itself (e.g., YouTube's autoplay, Spotify's embed player).



/**
 * NEW: Toggles the visibility and layout of the main playbar details
 * based on screen width and album overlay state.
 * This function now ensures the main playbar is *always* visible,
 * but its internal layout adapts.
 */
function toggleMainPlaybarView() {
    console.log(`toggleMainPlaybarView called. window.innerWidth: ${window.innerWidth}`);
    if (!mainPlayBar) {
        console.error("toggleMainPlaybarView: Main play bar element not found.");
        return;
    }

    const isAlbumOverlayActive = albumOverlay && albumOverlay.classList.contains('active');
    // isPlayingEmbeddedContent refers to the *currently playing* album, not the one in the overlay
    const isPlayingEmbeddedContent = playingAlbum && (playingAlbum.rawHtmlEmbed || playingAlbum.fullSoundcloudEmbed || playingAlbum.audiomackEmbed || playingAlbum.iframeSrc);

    // Apply specific styles for desktop size screens
    if (window.innerWidth >= 768) { // Desktop breakpoint
        mainPlayBar.style.setProperty('left', '25%', 'important');
        mainPlayBar.style.setProperty('width', '75%', 'important');
        console.log("toggleMainPlaybarView: mainPlayBar set for desktop (left: 25% !important, width: 75% !important).");

        // Full controls should only be visible on desktop if a non-embedded album overlay is active.
        // If an embedded album is playing, or no album is playing, or a controllable album is playing but its overlay is closed,
        // the playbar should be simplified.
        const shouldShowFullControls = isAlbumOverlayActive && !isPlayingEmbeddedContent;

        if (shouldShowFullControls) {
            console.log("toggleMainPlaybarView: Desktop - showing FULL controls (non-embedded album overlay active).");
            // Show all elements for full player
            mainPlayBar.classList.remove('flex-col', 'space-y-4');
            mainPlayBar.classList.add('flex-row', 'justify-between', 'space-x-4');

            const elementsToToggleVisibility = [
                progressBar, currentTimeSpan, totalTimeSpan, volumeBar,
                nextTrackBtn, prevTrackBtn, rewindBtn, fastForwardBtn,
                repeatBtn, shuffleBtn
            ];
            elementsToToggleVisibility.forEach(el => {
                if (el) el.style.display = ''; // Revert to default display (flex or block)
            });

            if (playerControls) playerControls.style.display = 'flex';
            if (document.getElementById('progress-time-group')) document.getElementById('progress-time-group').style.display = 'flex';
            if (document.querySelector('.flex.items-center.space-x-4.w-full.md\\:w-auto.md\\:flex-shrink-0.justify-end')) { // Volume group
                document.querySelector('.flex.items-center.space-x-4.w-full.md\\:w-auto.md\\:flex-shrink-0.justify-end').style.display = 'flex';
            }
            if (playerLeft) {
                playerLeft.style.flexGrow = '1';
                playerLeft.style.flexShrink = '1';
                playerLeft.style.overflow = 'visible';
                if (currentSongTitle) currentSongTitle.style.whiteSpace = 'nowrap';
                if (currentArtistName) currentArtistName.style.whiteSpace = 'nowrap';
            }
        } else {
            console.log("toggleMainPlaybarView: Desktop - showing SIMPLIFIED controls (album overlay not active or embedded content playing).");
            // Simplify playbar for desktop when no non-embedded album overlay is open
            // or when an embedded album is playing in the background, or nothing is playing.
            mainPlayBar.classList.remove('flex-col', 'space-y-4');
            mainPlayBar.classList.add('flex-row', 'justify-between', 'space-x-4');

            const elementsToToggleVisibility = [
                progressBar, currentTimeSpan, totalTimeSpan, volumeBar,
                nextTrackBtn, prevTrackBtn, rewindBtn, fastForwardBtn,
                repeatBtn, shuffleBtn
            ];
            elementsToToggleVisibility.forEach(el => {
                if (el) el.style.display = 'none'; // Hide non-essential elements
            });

            if (playerControls) playerControls.style.display = 'flex'; // Still show play/pause controls
            if (playPauseBtn) playPauseBtn.style.display = 'block'; // Ensure play/pause is visible
            if (document.getElementById('progress-time-group')) document.getElementById('progress-time-group').style.display = 'none';
            if (document.querySelector('.flex.items-center.space-x-4.w-full.md\\:w-auto.md\\:flex-shrink-0.justify-end')) { // Volume group
                document.querySelector('.flex.items-center.space-x-4.w-full.md\\:w-auto.md\\:flex-shrink-0.justify-end').style.display = 'none';
            }
            if (playerLeft) {
                playerLeft.style.flexGrow = '1';
                playerLeft.style.flexShrink = '1';
                playerLeft.style.overflow = 'hidden';
                if (currentSongTitle) currentSongTitle.style.whiteSpace = 'nowrap';
                if (currentArtistName) currentArtistName.style.whiteSpace = 'nowrap';
            }
        }

    } else { // Mobile/Tablet
        mainPlayBar.style.setProperty('left', '0', 'important');
        mainPlayBar.style.setProperty('width', '100%', 'important');
        console.log("toggleMainPlaybarView: mainPlayBar set for mobile/tablet (left: 0 !important, width: 100% !important).");

        // Mobile compact layout (always simplified, as full player is a separate overlay)
        mainPlayBar.classList.remove('flex-col', 'space-y-4');
        mainPlayBar.classList.add('flex-row', 'justify-between', 'space-x-4');

        const elementsToToggleVisibility = [
            progressBar, currentTimeSpan, totalTimeSpan, volumeBar,
            nextTrackBtn, prevTrackBtn, rewindBtn, fastForwardBtn,
            repeatBtn, shuffleBtn
        ];
        elementsToToggleVisibility.forEach(el => {
            if (el) el.style.display = 'none';
        });

        if (playerControls) playerControls.style.display = 'flex';
        if (playPauseBtn) playPauseBtn.style.display = 'block';
        if (document.getElementById('progress-time-group')) document.getElementById('progress-time-group').style.display = 'none';
        if (document.querySelector('.flex.items-center.space-x-4.w-full.md\\:w-auto.md\\:flex-shrink-0.justify-end')) {
            document.querySelector('.flex.items-center.space-x-4.w-full.md\\:w-auto.md\\:flex-shrink-0.justify-end').style.display = 'none';
        }
        if (playerLeft) {
            playerLeft.style.flexGrow = '1';
            playerLeft.style.flexShrink = '1';
            playerLeft.style.overflow = 'hidden';
            if (currentSongTitle) currentSongTitle.style.whiteSpace = 'nowrap';
            if (currentArtistName) currentArtistName.style.whiteSpace = 'nowrap';
        }
        console.log("toggleMainPlaybarView: Mobile/Tablet - showing simplified controls.");
    }

    // Ensure album art is visible and YouTube player div is removed if present in compact view
    if (currentAlbumArt) currentAlbumArt.style.display = 'block';
    const dynamicPlayerContainer = playerLeft.querySelector('#youtube-player-container');
    if (dynamicPlayerContainer) dynamicPlayerContainer.remove();

    console.log("toggleMainPlaybarView: Main play bar layout adjusted based on screen size and overlay state.");
    updatePlayerUI(); // Always update the UI of the player whenever its visibility might change
}

/**
 * NEW: Manages the visibility of the fixed top playing heading.
 * This function should be called whenever the `playingAlbum` state changes
 * or on scroll events.
 */
function updateFixedTopHeadingVisibility() {
    if (!fixedTopPlayingHeading) {
        console.warn("updateFixedTopHeadingVisibility: fixedTopPlayingHeading element not found.");
        return;
    }

    const scrollThreshold = topBar ? topBar.offsetHeight : 0; // Show after scrolling past top bar

    // Only show the heading if there's a playing album AND the user has scrolled past the threshold
    // AND we are NOT on a desktop screen (where the main playbar is already full-width).
    if (playingAlbum && rightPanel.scrollTop > scrollThreshold && window.innerWidth < 768) {
        fixedTopPlayingHeading.classList.add('visible');
        fixedTopPlayingHeading.classList.remove('hidden'); // Ensure 'hidden' is removed if present
        console.log("Fixed top heading set to VISIBLE.");
    } else {
        fixedTopPlayingHeading.classList.remove('visible');
        // We don't add 'hidden' here, as the CSS transition handles the transform/opacity
        // The default CSS for .fixed-top-heading already sets transform: translateY(-100%) and opacity: 0
        console.log("Fixed top heading set to HIDDEN (via CSS transition).");
    }
}


/**
 * Updates the visibility of horizontal scroll buttons for a given container.
 * @param {string} containerId - The ID of the scrollable container.
 */
function updateScrollButtonVisibility(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`Scroll container with ID '${containerId}' not found.`);
        return;
    }
    const scrollLeftBtn = document.querySelector(`.carousel-nav-btn.prev-btn[data-target="${containerId}"]`);
    const scrollRightBtn = document.querySelector(`.carousel-nav-btn.next-btn[data-target="${containerId}"]`);

    if (!scrollLeftBtn || !scrollRightBtn) {
        // console.warn(`Scroll buttons for container ID '${containerId}' not found.`); // This warning can be noisy if buttons are intentionally absent
        return;
    }

    const scrollTolerance = 5; // Small tolerance for floating point errors

    // Check if there's content to scroll horizontally
    const hasHorizontalScroll = container.scrollWidth > container.clientWidth + scrollTolerance;

    if (!hasHorizontalScroll) {
        // If no scrollbar is needed, hide both buttons
        scrollLeftBtn.classList.add('hidden');
        scrollRightBtn.classList.add('hidden');
        return;
    }

    // Show/hide left button
    if (container.scrollLeft <= scrollTolerance) {
        scrollLeftBtn.classList.add('hidden');
    } else {
        scrollLeftBtn.classList.remove('hidden');
    }

    // Show/hide right button
    // Check if scrolled all the way to the right
    if (container.scrollLeft + container.clientWidth >= container.scrollWidth - scrollTolerance) {
        scrollRightBtn.classList.add('hidden');
    } else {
        scrollRightBtn.classList.remove('hidden');
    }
}

/**
 * Sets up horizontal scrolling for a given container with associated buttons.
 * @param {string} containerId - The ID of the scrollable container.
 */
function setupHorizontalScroll(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const scrollLeftBtn = document.querySelector(`.carousel-nav-btn.prev-btn[data-target="${containerId}"]`);
    const scrollRightBtn = document.querySelector(`.carousel-nav-btn.next-btn[data-target="${containerId}"]`);

    if (scrollLeftBtn) {
        scrollLeftBtn.addEventListener('click', () => {
            container.scrollBy({
                left: -container.clientWidth / 1.5, // Scroll 2/3 of the visible width
                behavior: 'smooth'
            });
        });
    }

    if (scrollRightBtn) {
        scrollRightBtn.addEventListener('click', () => {
            container.scrollBy({
                left: container.clientWidth / 1.5, // Scroll 2/3 of the visible width
                behavior: 'smooth'
            });
        });
    }

    // Update button visibility on scroll and resize
    container.addEventListener('scroll', () => updateScrollButtonVisibility(containerId));
    // Initial update
    updateScrollButtonVisibility(containerId);
}


// --- Spotify Web Playback SDK ---
window.onSpotifyWebPlaybackSDKReady = () => {
    console.log("Spotify Web Playback SDK is ready.");
    if (!spotifyAccessToken) {
        console.warn("Spotify Access Token not available. Cannot initialize Spotify Player.");

        updateLoginUI(false); // Ensure UI reflects logged out state
        return;
    }

    spotifyPlayer = new Spotify.Player({
        name: 'My Custom Music Player',
        getOAuthToken: cb => {
            cb(spotifyAccessToken);
        },
        volume: volumeBar ? volumeBar.value : 0.5
    });

    spotifyPlayer.addListener('ready', ({
        device_id
    }) => {
        spotifyDeviceId = device_id;
        console.log('Ready with Device ID', spotifyDeviceId);

        // Transfer playback to our player
        transferPlaybackToDevice(spotifyDeviceId);
    });

    spotifyPlayer.addListener('not_ready', ({
        device_id
    }) => {
        console.log('Device ID has gone offline', device_id);

    });

    spotifyPlayer.addListener('player_state_changed', (state) => {
        if (!state) {
            console.log("Spotify player state is null.");
            return;
        }
        const {
            current_track
        } = state.track_window;
        if (current_track) {
            // Update UI with Spotify track info if needed (though playTrack does this)
            // This listener mainly helps keep our UI in sync with external Spotify actions
            if (!state.paused) {
                if (playPauseBtn) {
                    playIcon.classList.add('hidden');
                    pauseIcon.classList.remove('hidden');
                }
            } else {
                if (playPauseBtn) {
                    playIcon.classList.remove('hidden');
                    pauseIcon.classList.add('hidden');
                }
            }
        }
        // Handle track ending for Spotify (also handled in playTrack's interval, but good to have)
        if (state.paused && state.position === 0 && current_track && current_track.id !== null) {
            // This might fire multiple times, ensure logic is idempotent
            console.log("Spotify track ended via state change.");
            if (isRepeat) {
                spotifyPlayer.seek(0);
                spotifyPlayer.resume();
            } else if (isShuffle) {
                if (currentAlbum && currentAlbum.tracks) {
                    currentTrackIndex = Math.floor(Math.random() * currentAlbum.tracks.length);
                    playTrack(currentAlbum.tracks[currentTrackIndex], currentTrackIndex);
                }
            } else {
                // Automatically play next song or shift to next album if last song of current album
                if (playingAlbum && playingAlbum.tracks && currentTrackIndex === playingAlbum.tracks.length - 1) {
                    // Last track of the album finished, try to play next album
                    const currentAlbumIndex = allAlbumsData.findIndex(album => album.id === playingAlbum.id);
                    if (currentAlbumIndex !== -1 && currentAlbumIndex < allAlbumsData.length - 1) {
                        const nextAlbum = allAlbumsData[currentAlbumIndex + 1];
                        if (nextAlbum.tracks && nextAlbum.tracks.length > 0) {
                            playingAlbum = nextAlbum; // Update playingAlbum to the next album
                            currentTrackIndex = 0; // Reset track index for the new album
                            openAlbumDetails(nextAlbum); // Open the next album's details if overlay is open
                            playTrack(nextAlbum.tracks[0], 0);
                            console.log("Automatically playing first track of next Spotify album.");
                        } else {
                            stopAllPlaybackUI();
                            console.log("Last Spotify track ended, next album has no tracks. Stopping all playback.");
                        }
                    } else {
                        stopAllPlaybackUI();
                        console.log("Last Spotify track ended, no next album. Stopping all playback.");
                    }
                } else if (playingAlbum && playingAlbum.tracks && currentTrackIndex < playingAlbum.tracks.length - 1) {
                    currentTrackIndex++;
                    playTrack(playingAlbum.tracks[currentTrackIndex], currentTrackIndex);
                    console.log("Automatically playing next Spotify track within the same album.");
                } else {
                    stopAllPlaybackUI();
                    console.log("Last Spotify track ended, no repeat/shuffle. Stopping all playback.");
                }
            }
        }
        // Update the main album play button icon after player state change
        updateAlbumPlayButtonIcon();
        updateTrackHighlightingInOverlay(); // Update track highlighting in overlay
        updatePlayerUI(); // Sync all player UI
        updateFixedTopHeadingVisibility(); // Sync fixed top heading
    });

    spotifyPlayer.addListener('initialization_error', ({
        message
    }) => {
        console.error('Failed to initialize Spotify player:', message);

    });

    spotifyPlayer.addListener('authentication_error', ({
        message
    }) => {
        console.error('Authentication error with Spotify:', message);
        spotifyAccessToken = null;
        localStorage.removeItem('spotifyAccessToken');

        updateLoginUI(false); // Ensure UI reflects logged out state
    });

    spotifyPlayer.addListener('account_error', ({
        message
    }) => {
        console.error('Account error with Spotify:', message);

    });

    spotifyPlayer.addListener('playback_error', ({
        message
    }) => {
        console.error('Playback error with Spotify:', message);

    });

    spotifyPlayer.connect();
}

/**
 * Transfers playback to the newly created Spotify Web Playback SDK device.
 * @param {string} deviceId - The Spotify device ID to transfer playback to.
 */
async function transferPlaybackToDevice(deviceId) {
    if (!spotifyAccessToken) return;
    try {
        const response = await fetch('https://api.spotify.com/v1/me/player', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${spotifyAccessToken}`
            },
            body: JSON.stringify({
                device_ids: [deviceId],
                play: false // Do not start playing immediately, let playTrack handle it
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Failed to transfer playback:', errorData);

        } else {
            console.log('Playback transfer initiated successfully.');
        }
    } catch (error) {
        console.error('Error transferring playback:', error);

    }
}



// --- Spotify Authentication Flow ---
async function handleSpotifyCallback() {
    console.log("handleSpotifyCallback: Checking for Spotify authentication callback...");
    const hash = window.location.hash;
    let token = localStorage.getItem('spotifyAccessToken');
    let expiresIn = localStorage.getItem('spotifyExpiresIn');
    let tokenTimestamp = localStorage.getItem('spotifyTokenTimestamp');

    // Check if token exists and is still valid
    if (token && expiresIn && tokenTimestamp) {
        const now = Date.now();
        const storedTime = parseInt(tokenTimestamp, 10);
        const expiryTime = storedTime + (parseInt(expiresIn, 10) * 1000); // Convert seconds to milliseconds
        if (now < expiryTime) {
            spotifyAccessToken = token;
            console.log("handleSpotifyCallback: Reusing existing valid Spotify access token.");
            // If token is valid, initialize Spotify Player SDK
            if (typeof Spotify !== 'undefined' && Spotify.Player) {
                window.onSpotifyWebPlaybackSDKReady();
            } else {
                // If SDK not yet loaded, it will call onSpotifyWebPlaybackSDKReady when ready
                console.log("Spotify SDK not yet loaded, will initialize player when ready.");
            }
            return;
        } else {
            console.log("handleSpotifyCallback: Stored Spotify access token expired.");
            localStorage.removeItem('spotifyAccessToken');
            localStorage.removeItem('spotifyExpiresIn');
            localStorage.removeItem('spotifyTokenTimestamp');
            spotifyAccessToken = null;
        }
    }

    if (hash.includes('access_token')) {
        const params = new URLSearchParams(hash.substring(1)); // Remove #
        token = params.get('access_token');
        expiresIn = params.get('expires_in'); // in seconds
        const state = params.get('state'); // For CSRF protection, if you implemented it

        if (token) {
            spotifyAccessToken = token;
            localStorage.setItem('spotifyAccessToken', token);
            localStorage.setItem('spotifyExpiresIn', expiresIn);
            localStorage.setItem('spotifyTokenTimestamp', Date.now().toString());
            console.log("handleSpotifyCallback: New Spotify access token obtained and stored.");

            // Clear hash from URL to prevent issues on refresh
            window.history.replaceState({}, document.title, window.location.pathname);

            // Initialize Spotify Player SDK
            if (typeof Spotify !== 'undefined' && Spotify.Player) {
                window.onSpotifyWebPlaybackSDKReady();
            } else {
                console.log("Spotify SDK not yet loaded, will initialize player when ready.");
            }
        } else {
            console.warn("handleSpotifyCallback: No access token found in hash.");

        }
    } else {
        console.log("handleSpotifyCallback: No Spotify authentication callback detected in URL.");
    }
}

if (spotifyLoginBtn) {
    spotifyLoginBtn.addEventListener('click', () => {
        console.log("Spotify Login button clicked. Redirecting for authorization...");
        const authUrl = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&redirect_uri=${encodeURIComponent(SPOTIFY_REDIRECT_URI)}&scope=${encodeURIComponent(SPOTIFY_SCOPES)}&response_type=token&show_dialog=true`;
        window.location.href = authUrl;
    });
}

// --- Message Box Functionality ---
let messageBoxTimeout;

/**
 * Displays a custom message box.
 * @param {string} message - The message to display.
 * @param {string} type - 'success', 'error', or 'info'.
 * @param {number} duration - How long to show the message in milliseconds. Default 3000.
 */
function showMessageBox(message, type = 'info', duration = 3000) {
    const box = document.getElementById('messageBox');
    if (!box) {
        console.error("Message box element not found!");
        return;
    }

    // Clear any existing timeout
    if (messageBoxTimeout) {
        clearTimeout(messageBoxTimeout);
    }

    box.textContent = message;
    box.className = 'message-box'; // Reset classes
    box.classList.add(type); // Add type class for styling
    box.classList.add('show'); // Make it visible

    messageBoxTimeout = setTimeout(() => {
        box.classList.remove('show'); // Hide after duration
    }, duration);
}

// --- Sidebar toggle functionality ---
function toggleSidebar() {
    const sidebarElement = document.querySelector('.left.sidebar'); // Use a different variable name to avoid conflict
    if (sidebarElement) {
        sidebarElement.classList.toggle('open');
        // Also toggle the overlay visibility
        if (overlay) {
            overlay.classList.toggle('show', sidebarElement.classList.contains('open'));
        }
    }
}


// --- Event Listeners for Overlay and Sidebar ---
// These are now handled within openAlbumDetails and closeAlbumOverlay for dynamic attachment/detachment
// if (closeOverlayBtn) {
//     closeOverlayBtn.addEventListener('click', closeAlbumOverlay);
// }
if (hamburger) {
    hamburger.addEventListener('click', toggleSidebar);
}
if (closeBtn) {
    closeBtn.addEventListener('click', toggleSidebar);
}
if (overlay) {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) { // Only close if the overlay itself is clicked, not its children
            toggleSidebar();
        }
    });
}

// --- User Dropdown Functionality ---
let isUserDropdownOpen = false; // New global state for dropdown
let closeDropdownTimeout = null; // To manage delayed closing

/**
 * Toggles the visibility of the user dropdown menu.
 * This function is now solely responsible for *showing* or *hiding* the dropdown.
 * @param {boolean} show - True to show the dropdown, false to hide it.
 */
function toggleUserDropdown(show) {
    if (!userDropdown) {
        console.error("toggleUserDropdown: userDropdown element not found.");
        return;
    }

    // Clear any pending close timeout if we're explicitly opening or re-opening
    if (closeDropdownTimeout) {
        clearTimeout(closeDropdownTimeout);
        closeDropdownTimeout = null;
        console.log("toggleUserDropdown: Cleared pending close timeout.");
    }

    if (show) {
        if (userAvatarContainer) {
            const avatarRect = userAvatarContainer.getBoundingClientRect();

            // Calculate dropdown's position
            // Align dropdown's right edge with avatar's right edge
            // And position it 5px below the avatar
            userDropdown.style.position = 'fixed';
            userDropdown.style.top = `${avatarRect.bottom + window.scrollY + 5}px`;
            userDropdown.style.right = `${window.innerWidth - avatarRect.right}px`;
            userDropdown.style.left = 'auto'; // Ensure left is not set to auto
            userDropdown.style.transform = 'none'; // Remove any previous transform
            userDropdown.style.zIndex = '10000'; // Ensure it's on top of everything

            // Explicitly set display to flex when showing
            userDropdown.style.display = 'flex';

            console.log(`Dropdown calculated position: Top=${userDropdown.style.top}, Right=${userDropdown.style.right}`);

            // Apply other styling for appearance
            userDropdown.style.backgroundColor = '#282828'; // Dark background
            userDropdown.style.borderRadius = '8px'; // Rounded corners
            userDropdown.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.5)'; // Subtle shadow
            userDropdown.style.padding = '10px'; // Internal padding
            userDropdown.style.width = '180px'; // Fixed width for compactness
            userDropdown.style.flexDirection = 'column'; // Stack items vertically
            userDropdown.style.gap = '8px'; // Space between items
            userDropdown.style.textAlign = 'left'; // Align text to left
            userDropdown.style.color = '#fff'; // Text color
            userDropdown.style.fontSize = '0.95em'; // Slightly smaller font
        }

        if (dropdownUsername) {
            dropdownUsername.style.padding = '8px 10px';
            dropdownUsername.style.fontWeight = 'bold';
            dropdownUsername.style.borderBottom = '1px solid #444'; // Separator
            dropdownUsername.style.marginBottom = '5px';
            dropdownUsername.style.cursor = 'default';
        }

        if (dropdownLogoutBtn) {
            dropdownLogoutBtn.style.padding = '8px 10px';
            dropdownLogoutBtn.style.textAlign = 'left';
            dropdownLogoutBtn.style.backgroundColor = 'transparent'; // Transparent background
            dropdownLogoutBtn.style.border = 'none';
            dropdownLogoutBtn.style.color = '#fff';
            dropdownLogoutBtn.style.cursor = 'pointer';
            dropdownLogoutBtn.style.borderRadius = '4px';
            dropdownLogoutBtn.style.transition = 'background-color 0.2s ease';
            dropdownLogoutBtn.onmouseover = function() { this.style.backgroundColor = '#444'; };
            dropdownLogoutBtn.onmouseout = function() { this.style.backgroundColor = 'transparent'; };
        }

        userDropdown.setAttribute('aria-expanded', 'true');
        isUserDropdownOpen = true;
        console.log("toggleUserDropdown: Dropdown opened.");
    } else {
        // Explicitly set display to none when hiding
        userDropdown.style.display = 'none';
        userDropdown.setAttribute('aria-expanded', 'false');
        isUserDropdownOpen = false;
        console.log("toggleUserDropdown: Dropdown closed.");
    }
}

// Event listener for the user avatar click
if (userAvatarContainer) {
    userAvatarContainer.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent document click from immediately closing it
        console.log("User avatar clicked.");
        toggleUserDropdown(!isUserDropdownOpen); // Toggle visibility
    });
}

// Event listener for clicks anywhere on the document to close the dropdown
document.addEventListener('click', (event) => {
    console.log(`Document click: target=${event.target.id || event.target.className || event.target.tagName}, isUserDropdownOpen=${isUserDropdownOpen}`);
    // Add a small timeout to allow the avatar click's stopPropagation to fully register
    // This is a common workaround for race conditions where the document click listener
    // might fire before the event bubbling for the avatar click is fully processed.
    setTimeout(() => {
        if (isUserDropdownOpen) {
            // Only attempt to close if it's currently open
            const isClickInsideDropdown = userDropdown.contains(event.target);
            const isClickOnAvatar = userAvatarContainer.contains(event.target);

            // Check if the click target is an album card or a play button on a card
            const isClickOnAlbumCard = event.target.closest('.card');
            const isClickOnCardPlayButton = event.target.closest('.card-play-button');

            // If the click is inside the dropdown or on the avatar, do nothing (handled by avatar click listener)
            if (isClickInsideDropdown || isClickOnAvatar) {
                return;
            }

            // If the click is on an album card or its play button, do NOT close the dropdown.
            // This allows the dropdown to stay open if the user clicks a card to open an album.
            if (isClickOnAlbumCard || isClickOnCardPlayButton) {
                console.log("Document click: Clicked on an album card/play button. Not closing dropdown.");
                return;
            }

            // If none of the above, then it's a genuine "outside" click
            console.log("Closing dropdown due to genuine outside click.");
            toggleUserDropdown(false);
        }
    }, 50); // Small delay, e.g., 50ms
});


// Event listener for the logout button
if (dropdownLogoutBtn) {
    dropdownLogoutBtn.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent this click from bubbling to document and closing dropdown prematurely
        localStorage.removeItem('spotifyAccessToken');
        spotifyAccessToken = null;
        currentUserName = 'Guest'; // Reset username on logout
        if (spotifyPlayer) {
            spotifyPlayer.disconnect();
            spotifyPlayer = null;
            spotifyDeviceId = null;
        }
        updateLoginUI(false);
        showMessageBox('Logged out successfully!', 'success');
        toggleUserDropdown(false); // Close the dropdown after logout
        // Optionally, reload the page or redirect to login
        // window.location.reload();
    });
}

/**
 * Updates the visibility of horizontal scroll buttons for a given container.
 * @param {string} containerId - The ID of the scrollable container.
 */
function updateScrollButtonVisibility(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`Scroll container with ID '${containerId}' not found.`);
        return;
    }
    const scrollLeftBtn = document.querySelector(`.carousel-nav-btn.prev-btn[data-target="${containerId}"]`);
    const scrollRightBtn = document.querySelector(`.carousel-nav-btn.next-btn[data-target="${containerId}"]`);

    if (!scrollLeftBtn || !scrollRightBtn) {
        console.warn(`Scroll buttons for container ID '${containerId}' not found.`);
        return;
    }

    const scrollTolerance = 5; // Small tolerance for floating point errors

    // Check if there's content to scroll horizontally
    const hasHorizontalScroll = container.scrollWidth > container.clientWidth + scrollTolerance;

    if (!hasHorizontalScroll) {
        // If no scrollbar is needed, hide both buttons
        scrollLeftBtn.classList.add('hidden');
        scrollRightBtn.classList.add('hidden');
        return;
    }

    // Show/hide left button
    if (container.scrollLeft <= scrollTolerance) {
        scrollLeftBtn.classList.add('hidden');
    } else {
        scrollLeftBtn.classList.remove('hidden');
    }

    // Show/hide right button
    // Check if scrolled all the way to the right
    if (container.scrollLeft + container.clientWidth >= container.scrollWidth - scrollTolerance) {
        scrollRightBtn.classList.add('hidden');
    } else {
        scrollRightBtn.classList.remove('hidden');
    }
}

/**
 * Sets up horizontal scrolling for a given container with associated buttons.
 * @param {string} containerId - The ID of the scrollable container.
 */
function setupHorizontalScroll(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const scrollLeftBtn = document.querySelector(`.carousel-nav-btn.prev-btn[data-target="${containerId}"]`);
    const scrollRightBtn = document.querySelector(`.carousel-nav-btn.next-btn[data-target="${containerId}"]`);

    if (scrollLeftBtn) {
        scrollLeftBtn.addEventListener('click', () => {
            container.scrollBy({
                left: -container.clientWidth / 1.5, // Scroll 2/3 of the visible width
                behavior: 'smooth'
            });
        });
    }

    if (scrollRightBtn) {
        scrollRightBtn.addEventListener('click', () => {
            container.scrollBy({
                left: container.clientWidth / 1.5, // Scroll 2/3 of the visible width
                behavior: 'smooth'
            });
        });
    }

    // Update button visibility on scroll and resize
    container.addEventListener('scroll', () => updateScrollButtonVisibility(containerId));
    // Initial update
    updateScrollButtonVisibility(containerId);
}

// --- Initial Setup on DOM Content Loaded ---
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM Content Loaded: Script execution started.");
    // Hide player bar initially
    if (mainPlayBar) {
        mainPlayBar.style.display = 'none'; // Keep this to hide it until a song plays
        console.log("DOMContentLoaded: mainPlayBar initially hidden.");
    }

    // Add padding to the player-left container for better spacing of the album cover/mini-player
    if (playerLeft) {
        // This is now the album art + song info container
        playerLeft.style.padding = '0'; // The HTML already has padding on the main-play-bar-inner
        // Ensure playerLeft can grow but also shrink if content is too long
        playerLeft.style.minWidth = '0'; // Allow flex item to shrink below its content size
        console.log("DOMContentLoaded: playerLeft padding reset to 0 and min-width set to 0.");
    }

    // Apply consistent styling to the player image (album cover)
    if (currentAlbumArt) { // Changed from playerImg
        currentAlbumArt.style.width = '64px'; // Matches new HTML
        currentAlbumArt.style.height = '64px'; // Matches new HTML
        currentAlbumArt.style.borderRadius = '8px';
        currentAlbumArt.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.4)';
        currentAlbumArt.style.objectFit = 'cover'; // Ensure image covers the area
        currentAlbumArt.style.display = 'block'; // Ensure it's visible by default
        console.log("DOMContentLoaded: currentAlbumArt styling applied.");
    }

    // showMessageBox('Initializing app...', 'info', 5000); // Initial loading message - REMOVED AS PER USER REQUEST
    try {
        // Attempt to handle Spotify callback on page load
        await handleSpotifyCallback();
        console.log("DOMContentLoaded: handleSpotifyCallback called.");

        // Load YouTube Iframe API
        loadYoutubeIframeAPI();
        console.log("DOMContentLoaded: loadYoutubeIframeAPI called.");

        // Set initial UI state for login (e.g., if no Spotify token found)
        updateLoginUI();
        console.log("DOMContentLoaded: updateLoginUI called.");

        // Fetch and display initial content (these are placeholders now)
        // Ensure these functions actually exist in your project
        if (typeof fetchAndDisplayTrendingSongs === 'function') {
            fetchAndDisplayTrendingSongs();
        } else {
            console.warn("fetchAndDisplayTrendingSongs function not found.");
        }
        if (typeof fetchAndDisplayPopularAlbums === 'function') {
            fetchAndDisplayPopularAlbums();
        } else {
            console.warn("fetchAndDisplayPopularAlbums function not found.");
        }
        if (typeof fetchAndDisplayPopularArtists === 'function') {
            fetchAndDisplayPopularArtists();
        } else {
            console.warn("fetchAndDisplayPopularArtists function not found.");
        }
        console.log("DOMContentLoaded: Initial content display functions called (if defined).");

        // IMPORTANT: Fetch and attach listeners after everything else
        // Ensure fetchAlbums is defined and correctly populates cardcontainers
        if (typeof fetchAlbums === 'function') {
            await fetchAlbums(); // This call includes attachEventListenersToHtmlCards()
            console.log("DOMContentLoaded: fetchAlbums completed and listeners attached.");

            // Setup horizontal scroll for all three card sections
            setupHorizontalScroll('trending-songs-cards');
            setupHorizontalScroll('popular-albums-cards');
            setupHorizontalScroll('popular-artists-cards');
            // Also for the "more" sections in the overlay
            setupHorizontalScroll('more-trending-songs-cards');
            setupHorizontalScroll('explore-popular-albums-cards');
            setupHorizontalScroll('explore-popular-artists-cards');
            console.log("DOMContentLoaded: Horizontal scroll setup for all card sections.");

        } else {
            console.warn("fetchAlbums function not found. Card event listeners might not be attached.");
        }

        // Set initial volume for the native audio element
        if (volumeBar) {
            audio.volume = parseFloat(volumeBar.value);
            console.log("DOMContentLoaded: Initial native audio volume set.");
        }

        // NEW: Add an event listener to the entire mainPlayBar to open the full-screen player on mobile/tablet
        if (mainPlayBar) {
            mainPlayBar.addEventListener('click', async (event) => {
                // Check if the click originated from a control button, if so, let it handle the event
                const isControlClick = event.target.closest('#play-pause-btn') ||
                                       event.target.closest('#prev-track-btn') ||
                                       event.target.closest('#next-track-btn') ||
                                       event.target.closest('#rewind-btn') ||
                                       event.target.closest('#fast-forward-btn') ||
                                       event.target.closest('#progress-bar') ||
                                       event.target.closest('#volume-bar') ||
                                       event.target.closest('#repeat-btn') ||
                                       event.target.closest('#shuffle-btn');

                if (window.innerWidth <= 768 && !isControlClick) { // Only on mobile/tablet and if not a control button
                    let albumToReopen = null;
                    if (playingAlbum) {
                        albumToReopen = playingAlbum;
                        console.log("Compact playbar clicked (mobile). Actively playing album found.");

                        // Check if the currently playing album is an embedded type
                        const isEmbeddedPlaying = albumToReopen.rawHtmlEmbed || albumToReopen.fullSoundcloudEmbed || albumToReopen.audiomackEmbed || albumToReopen.iframeSrc;

                        if (isEmbeddedPlaying) {
                            console.log("Playing album is embedded. Redirecting to embedded album overlay.");
                            openAlbumDetails(albumToReopen); // Re-open the album overlay for the embedded content
                        } else {
                            console.log("Playing album is controllable. Opening full-screen player.");
                            showFullScreenPlayer(); // Show the full-screen player for controllable tracks
                        }
                    } else if (currentAlbum) {
                        albumToReopen = currentAlbum;
                        console.log("Compact playbar clicked (mobile). No actively playing album, opening last viewed album details.");
                        // If no album is *playing*, but there's a *current* album (last viewed),
                        // we should open its details, regardless of embed status.
                        openAlbumDetails(albumToReopen);
                    } else {
                        console.log("Compact playbar clicked (mobile), but no current or playing album to open.");
                        return;
                    }
                } else if (window.innerWidth > 768 && !isControlClick) { // Desktop behavior
                    console.log("Main playbar clicked (desktop). Not a control button click.");
                    let albumToReopen = null;
                    if (playingAlbum) {
                        albumToReopen = playingAlbum;
                        console.log("Desktop playbar clicked. Actively playing album found. Redirecting to album details.");
                        openAlbumDetails(albumToReopen);
                    } else if (currentAlbum) {
                        albumToReopen = currentAlbum;
                        console.log("Desktop playbar clicked. No actively playing album, opening last viewed album details.");
                        openAlbumDetails(albumToReopen);
                    } else {
                        console.log("Desktop playbar clicked, but no current or playing album to open.");
                        return;
                    }
                }
            });
            console.log("DOMContentLoaded: mainPlayBar click listener attached.");
        }

        // NEW: Add minimize button listener for full-screen player
        if (minimizePlayerBtn) {
            minimizePlayerBtn.addEventListener('click', hideFullScreenPlayer);
            console.log("DOMContentLoaded: minimizePlayerBtn click listener attached.");
        }


        // NEW: Add resize event listener to manage playbar view and scroll button visibility on window resize
        window.addEventListener('resize', () => {
            toggleMainPlaybarView(); // This now handles desktop vs mobile layout
            // Update scroll button visibility for all relevant sections on resize
            updateScrollButtonVisibility('trending-songs-cards');
            updateScrollButtonVisibility('popular-albums-cards');
            updateScrollButtonVisibility('popular-artists-cards');
            updateScrollButtonVisibility('more-trending-songs-cards');
            updateScrollButtonVisibility('explore-popular-albums-cards');
            updateScrollButtonVisibility('explore-popular-artists-cards');
            updateFixedTopHeadingVisibility(); // Update fixed top heading visibility on resize
            // Also reposition the user dropdown on resize if it's open
            if (isUserDropdownOpen) {
                toggleUserDropdown(true); // Re-calculate and apply position
            }
        });
        console.log("DOMContentLoaded: window resize listener attached for playbar view and scroll buttons.");

        // Initial call to set the correct playbar view on load
        toggleMainPlaybarView(); // Call without argument, it will determine based on window.innerWidth
        console.log("DOMContentLoaded: Initial toggleMainPlaybarView called.");

        // NEW: Scroll event listener for the fixed top heading
        if (rightPanel && fixedTopPlayingHeading) {
            rightPanel.addEventListener('scroll', () => {
                updateFixedTopHeadingVisibility(); // Call the dedicated function on scroll
            });
            console.log("DOMContentLoaded: rightPanel scroll listener attached for fixed top heading.");
        }

    }
    catch (error) {
        console.error("DOMContentLoaded: An error occurred during initial setup:", error);

    }
    console.log("DOMContentLoaded: Script execution finished.");

    const searchInput = document.getElementById('search-input');
    const voiceSearchBtn = document.getElementById('voice-search-btn'); // Assuming these audio elements are defined in your HTML and globally accessible

    const voiceStartSound = new Audio('https://files.catbox.moe/z41l8g.mp3'); // Replace with your actual path
    const voiceEndSound = new Audio('https://files.catbox.moe/v08732.mp3'); // Replace with your actual path

    let isListening = false; // To prevent multiple recognition instances

    // Check for Web Speech API compatibility
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition && voiceSearchBtn) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false; // Listen for a single utterance
        recognition.lang = 'en-US'; // Set language
        recognition.interimResults = false; // Only return final results
        recognition.maxAlternatives = 1; // Get the most likely result

        voiceSearchBtn.addEventListener('click', () => {
            if (isListening) {
                recognition.stop();
                return;
            }

            // Stop any ongoing playback when voice search is initiated
            stopAllPlaybackUI();

            recognition.start();
            // Assuming playSound function is defined elsewhere
            // playSound(voiceStartSound); // Play start sound
            voiceSearchBtn.classList.add('listening'); // Add visual cue
            searchInput.placeholder = "Listening...";
            isListening = true;
            console.log("Voice search started.");
        });

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            console.log("Speech recognition result:", transcript);
            searchInput.value = transcript; // Set the transcript to the search input

            // Trigger the search logic
            if (transcript.trim().length > 0) {
                clearTimeout(debounceTimer); // Clear any existing debounce
                searchAndOpenAlbum(transcript.trim().toLowerCase());
            } else {
                closeAlbumOverlay();
                clearSearchMessage();
            }
        };

        recognition.onend = () => {
            console.log("Speech recognition ended.");
            if (isListening) { // If it ended without manual stop, means no speech detected or timed out
                // Assuming playSound function is defined elsewhere
                // playSound(voiceEndSound); // Play end sound
                voiceSearchBtn.classList.remove('listening'); // Remove visual cue
                searchInput.placeholder = "Search...";
                isListening = false;
            }
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            showMessageBox(`Voice search error: ${event.error}`, 'error');
            // Assuming playSound function is defined elsewhere
            // playSound(voiceEndSound); // Play end sound
            voiceSearchBtn.classList.remove('listening'); // Remove visual cue
            searchInput.placeholder = "Search...";
            isListening = false;
        };
    } else if (voiceSearchBtn) {
        // If SpeechRecognition is not supported, hide the button or inform the user
        voiceSearchBtn.style.display = 'none';
        console.warn("Web Speech API not supported in this browser.");
        showMessageBox("Your browser does not support voice search.", 'info', 5000);
    }

  // --- New: Centralized Footer Navigation Listeners ---
    const navLinks = document.querySelectorAll('.unique-footer-nav .unique-nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const target = link.dataset.target || link.getAttribute('href').substring(1);
            if (target) {
                navigateTo(target);
            }
        });
    });
    

   navigateTo('home');

   


    // NEW: Add click listener to the "New playlist" item in the `add-popup-overlay`
  // in script.js, inside the 'DOMContentLoaded' listener

const newPlaylistPopupItem = document.querySelector('#add-popup-overlay .swarify-add-popup-item:last-child');
if (newPlaylistPopupItem) {
    newPlaylistPopupItem.addEventListener('click', (e) => {
        e.preventDefault();
        const song = getCurrentSongForLike();
        if (!isLoggedIn()) {
            showMessageBox("You need to log in to create a playlist.", 'error');
            return;
        }

        // --- FIX: Add this line ---
        if (song) {
            localStorage.setItem('songToAddAfterCreatingPlaylist', JSON.stringify(song));
        }
        // --- End of Fix ---

        // Close the main add popup first
        addPopupOverlay.classList.remove('active');
        // Show the new playlist name popup
        if(newPlaylistPopupOverlay) {
            newPlaylistPopupOverlay.classList.remove('hidden');
            setTimeout(() => newPlaylistNameInput.focus(), 10);
        }
    });
}

    // NEW: Add listeners for the "Create Playlist" popup buttons
    if (createNewPlaylistBtn) {
        createNewPlaylistBtn.addEventListener('click', () => {
            const playlistName = newPlaylistNameInput.value.trim() || 'My new playlist';
            createPlaylist(playlistName);
            newPlaylistPopupOverlay.classList.add('hidden');
            newPlaylistNameInput.value = '';
        });
    }

    if (cancelNewPlaylistBtn) {
        cancelNewPlaylistBtn.addEventListener('click', () => {
            newPlaylistPopupOverlay.classList.add('hidden');
            newPlaylistNameInput.value = '';
        });
    }

    // NEW: Add listener for the library link in the footer
    const libraryLink = document.getElementById('your-library-link');
    if(libraryLink) {
        libraryLink.addEventListener('click', async (e) => {
            e.preventDefault();
            await fetchUserPlaylists(); // Fetch and render playlists when library is opened
            document.getElementById('library-popup').classList.remove('hidden');
        });
    }
    
    // NEW: Add listener for the close button on the playlist details overlay
    if (closePlaylistDetailsBtn) {
        closePlaylistDetailsBtn.addEventListener('click', () => {
            playlistDetailsOverlay.classList.add('hidden');
            document.body.style.overflow = 'auto';
        });
    }









});

// Placeholder for loadYoutubeIframeAPI function
function loadYoutubeIframeAPI() {
    console.log("Loading YouTube Iframe API...");
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

// Placeholder for fetchAndDisplayTrendingSongs function
function fetchAndDisplayTrendingSongs() {
    console.log("Fetching and displaying trending songs (placeholder - now handled by existing HTML).");
    // No longer dynamically populates HTML here per user request.
}

// Placeholder for fetchAndDisplayPopularAlbums function
function fetchAndDisplayPopularAlbums() {
    console.log("Fetching and displaying popular albums (placeholder - now handled by existing HTML).");
    // No longer dynamically populates HTML here per user request.
}

// Placeholder for fetchAndDisplayPopularArtists function
function fetchAndDisplayPopularArtists() {
    console.log("Fetching and displaying popular artists (placeholder - now handled by existing HTML).");
    // No longer dynamically populates HTML here per user request.
}

// Placeholder for updateLoginUI
function updateLoginUI(isLoggedIn) {
    console.log("Updating login UI (placeholder). Logged in:", isLoggedIn);
    if (topSignupBtn) topSignupBtn.style.display = isLoggedIn ? 'none' : 'block';
    if (topLoginBtn) topLoginBtn.style.display = isLoggedIn ? 'none' : 'block';
    if (userAvatarContainer) userAvatarContainer.style.display = isLoggedIn ? 'flex' : 'none';

    // Update dropdown username immediately when login status changes
    if (dropdownUsername) {
        dropdownUsername.textContent = currentUserName;
    }

    // Show/hide Spotify login button based on login status
    if (spotifyLoginBtn) {
        spotifyLoginBtn.style.display = isLoggedIn ? 'none' : 'block';
        if (!isLoggedIn) {
            // Add a visual cue if not logged in and Spotify is the main login method
            spotifyLoginBtn.textContent = 'Login with Spotify';
            spotifyLoginBtn.style.backgroundColor = '#1DB954'; // Spotify green
            spotifyLoginBtn.style.color = 'white';
            spotifyLoginBtn.style.padding = '10px 20px';
            spotifyLoginBtn.style.borderRadius = '20px';
            spotifyLoginBtn.style.border = 'none';
            spotifyLoginBtn.style.cursor = 'pointer';
            spotifyLoginBtn.style.fontWeight = 'bold';
        }
    }
}

// === Show/Hide embedded album with backdrop ===
function showEmbeddedAlbum(albumHtml) {
    if (embeddedBackdrop) embeddedBackdrop.style.display = 'block';
    albumFullEmbedContainer.innerHTML = albumHtml;
    albumFullEmbedContainer.style.zIndex = 9999;
    albumFullEmbedContainer.style.position = 'fixed';
    albumFullEmbedContainer.style.top = '50%';
    albumFullEmbedContainer.style.left = '50%';
    albumFullEmbedContainer.style.transform = 'translate(-50%, -50%)';
    albumFullEmbedContainer.style.display = 'block';
}
function closeEmbeddedAlbum() {
    albumFullEmbedContainer.style.display = 'none';
    if (embeddedBackdrop) embeddedBackdrop.style.display = 'none';
}



function loadSimilarAlbumsOnce(albumId, container) {
    if (container.dataset.similarLoaded === 'true') return;
    container.dataset.similarLoaded = 'true';

    fetch(`${BACKEND_BASE_URL}/similar-albums?albumId=${albumId}`)
        .then(res => res.json())
        .then(albums => {
            if (!albums || !albums.length) return;
            const section = document.createElement('div');
            section.id = 'similar-albums-section';
            section.innerHTML = '<h3>Similar Albums</h3>';
            const grid = document.createElement('div');
            grid.className = 'similar-albums-grid';
            section.appendChild(grid);
            albums.forEach(album => {
                const card = document.createElement('div');
                card.className = 'card fade-in';
                card.innerHTML = `
                    <img src="${album.cover}" alt="${album.title}">
                    <div class="card-title">${album.title}</div>
                `;
                grid.appendChild(card);
            });
            container.appendChild(section);
        })
        .catch(err => console.error('Error loading similar albums:', err));
}


function attachSimilarAlbumsScrollListener(overlayElement, albumId) {
    overlayElement.addEventListener('scroll', function() {
        if (overlayElement.scrollTop + overlayElement.clientHeight >= overlayElement.scrollHeight - 100) {
            loadSimilarAlbumsOnce(albumId, overlayElement);
        }
    });
}


// Hook: Call this when embedded album overlay is opened
function initEmbeddedAlbumOverlay(overlayElement, albumId, player) {
    attachSimilarAlbumsScrollListener(overlayElement, albumId);
    if (player && player.on) {
        // Assuming player emits 'ended' event on track finish
        player.on('ended', function() {
            overlayElement.scrollTop = 0;
            loadSimilarAlbumsOnce(albumId, overlayElement);
        });
    }
}


// The BACKEND_URL constant is already defined at the very top of the script as BACKEND_BASE_URL.
// Using BACKEND_BASE_URL for consistency.

// --- Custom Message Box (instead of alert/confirm) ---
function showMessageBox(message, type = 'info', duration = 3000) {
    let messageBox = document.getElementById('custom-message-box');
    let messageText = document.getElementById('custom-message-text');
    let messageCloseButton = document.getElementById('custom-message-close-button');

    if (!messageBox) {
        messageBox = document.createElement('div');
        messageBox.id = 'custom-message-box';
        messageBox.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            color: #333; /* Darker text for lighter backgrounds */
            padding: 10px 20px;
            border-radius: 8px;
            z-index: 99999999;
            opacity: 0;
            transition: opacity 0.5s ease-in-out, transform 0.5s ease-in-out;
            pointer-events: none;
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 250px;
            text-align: center;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2); /* Enhanced shadow */
            border: 1px solid rgba(0,0,0,0.1); /* Subtle border */
        `;
        document.body.appendChild(messageBox);

        messageText = document.createElement('span');
        messageText.id = 'custom-message-text';
        messageBox.appendChild(messageText);

        messageCloseButton = document.createElement('button');
        messageCloseButton.id = 'custom-message-close-button';
        messageCloseButton.innerHTML = '&times;';
        messageCloseButton.style.cssText = `
            background: none;
            border: none;
            color: #555; /* Darker close button for contrast */
            font-size: 1.5em;
            cursor: pointer;
            padding: 0 5px;
            line-height: 1;
            margin-left: auto;
            transition: color 0.2s ease;
        `;
        messageBox.appendChild(messageCloseButton);

        messageCloseButton.addEventListener('click', () => {
            messageBox.style.opacity = '0';
            messageBox.style.transform = 'translateX(-50%) translateY(10px)';
            setTimeout(() => {
                messageBox.style.display = 'none';
                messageBox.style.pointerEvents = 'none';
            }, 500);
        });
    }

    messageText.textContent = message;
    messageBox.style.backgroundColor = ''; // Reset background
    messageBox.style.color = '#333'; // Default text color for lighter backgrounds
    if (messageCloseButton) messageCloseButton.style.color = '#555'; // Default close button color

    if (type === 'success') {
        messageBox.style.backgroundColor = '#d4edda'; // Light green
        messageBox.style.borderColor = '#28a745';
        messageBox.style.color = '#155724'; // Dark green text
        if (messageCloseButton) messageCloseButton.style.color = '#155724';
    } else if (type === 'error') {
        messageBox.style.backgroundColor = '#f8d7da'; // Light red
        messageBox.style.borderColor = '#dc3545';
        messageBox.style.color = '#721c24'; // Dark red text
        if (messageCloseButton) messageCloseButton.style.color = '#721c24';
    } else { // info
        messageBox.style.backgroundColor = '#cce5ff'; // Light blue
        messageBox.style.borderColor = '#007bff';
        messageBox.style.color = '#004085'; // Dark blue text
        if (messageCloseButton) messageCloseButton.style.color = '#004085';
    }

    messageBox.style.display = 'flex';
    messageBox.style.pointerEvents = 'auto';
    messageBox.style.transform = 'translateX(-50%) translateY(0)';
    messageBox.style.opacity = '1';

    setTimeout(() => {
        messageBox.style.opacity = '0';
        messageBox.style.transform = 'translateX(-50%) translateY(10px)';
        setTimeout(() => {
            messageBox.style.display = 'none';
            messageBox.style.pointerEvents = 'none';
        }, duration);
    }, duration);
}

// Helper function to remove debug OTP from messages
function cleanMessage(message) {
    if (typeof message === 'string') {
        return message.replace(/\s*\(DEBUG OTP: \d+\)/, '');
    }
    return message;
}


// --- Global variables for timers ---
let emailOtpTimerInterval;
let emailOtpResendAvailableTime = 0;
let phoneOtpTimerInterval;
let phoneOtpResendAvailableTime = 0;
let currentOtpContext = 'signup'; // Default context

// Global variable to store the identifier for profile completion
let identifierForProfileCompletion = null;

/**
 * Starts the timer for email OTP validity.
 * @param {number} duration - The duration of the timer in seconds.
 */
const startEmailOtpTimer = (duration) => {
    let timer = duration;
    let minutes, seconds;

    emailOtpResendAvailableTime = duration;
    const resendEmailOtpButton = document.getElementById('resend-email-otp-button');
    const verifyEmailOtpButton = document.getElementById('verify-email-otp-button');
    const emailOtpTimerDisplay = document.getElementById('email-otp-timer-display');

    if (resendEmailOtpButton) resendEmailOtpButton.classList.add('hidden');
    if (verifyEmailOtpButton) verifyEmailOtpButton.disabled = false;

    clearInterval(emailOtpTimerInterval);
    emailOtpTimerInterval = setInterval(() => {
        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : "" + seconds;

        if (emailOtpTimerDisplay) emailOtpTimerDisplay.textContent = `OTP valid for: ${minutes}:${seconds}`;

        if (--timer < 0) {
            clearInterval(emailOtpTimerInterval);
            if (emailOtpTimerDisplay) emailOtpTimerDisplay.textContent = "OTP expired. Please resend.";
            if (resendEmailOtpButton) resendEmailOtpButton.classList.remove('hidden');
            if (verifyEmailOtpButton) verifyEmailOtpButton.disabled = true;
        }
        emailOtpResendAvailableTime = timer;
    }, 1000);
};

/**
 * Starts the timer for phone OTP validity.
 * @param {number} duration - The duration of the timer in seconds.
 */
const startPhoneOtpTimer = (duration) => {
    let timer = duration;
    let minutes, seconds;

    phoneOtpResendAvailableTime = duration;
    const resendPhoneOtpButton = document.getElementById('resend-otp-button');
    const sendPhoneOtpButton = document.getElementById('send-otp-button');
    const verifyPhoneOtpButton = document.getElementById('verify-otp-button');
    const phoneOtpTimerDisplay = document.getElementById('otp-timer-display');

    if (resendPhoneOtpButton) resendPhoneOtpButton.classList.add('hidden');
    if (sendPhoneOtpButton && document.getElementById('phone-otp-input-screen').classList.contains('active')) {
        sendPhoneOtpButton.disabled = true;
    }
    if (verifyPhoneOtpButton) verifyPhoneOtpButton.disabled = false;

    clearInterval(phoneOtpTimerInterval);
    phoneOtpTimerInterval = setInterval(() => {
        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : "" + seconds;

        if (phoneOtpTimerDisplay) phoneOtpTimerDisplay.textContent = `OTP valid for: ${minutes}:${seconds}`;

        if (--timer < 0) {
            clearInterval(phoneOtpTimerInterval);
            if (phoneOtpTimerDisplay) phoneOtpTimerDisplay.textContent = "OTP expired. Please resend.";
            if (resendPhoneOtpButton) resendPhoneOtpButton.classList.remove('hidden');
            if (sendPhoneOtpButton && document.getElementById('phone-otp-input-screen').classList.contains('active')) {
                sendPhoneOtpButton.disabled = false;
            }
            if (verifyPhoneOtpButton) verifyPhoneOtpButton.disabled = true;
        }
        phoneOtpResendAvailableTime = timer;
    }, 1000);
};

/**
 * Updates the main UI of the page to reflect login status.
 */
function updateLoginUI() {
    const userToken = localStorage.getItem('userToken');
    const loggedInUserEmail = localStorage.getItem('loggedInUserEmail');
    const loggedInUserName = localStorage.getItem('loggedInUserName'); // Get stored name

    const topSignupBtn = document.getElementById('top-signup-btn');
    const topLoginBtn = document.getElementById('top-login-btn');
    const userAvatarContainer = document.getElementById('user-avatar-container');
    const userAvatar = document.getElementById('user-avatar');
    const userDropdown = document.getElementById('user-dropdown');
    const dropdownUsername = document.getElementById('dropdown-username');

    if (userToken) {
        // User is logged in
        if (topSignupBtn) topSignupBtn.classList.add('hidden');
        if (topLoginBtn) topLoginBtn.classList.add('hidden');
        if (userAvatarContainer) userAvatarContainer.classList.remove('hidden');

        if (userAvatar && loggedInUserName) { // Use loggedInUserName for avatar
            const initial = loggedInUserName.charAt(0).toUpperCase();
            userAvatar.textContent = initial;
            if (userAvatarContainer) userAvatarContainer.title = loggedInUserName; // Set title for native hover tooltip
            if (dropdownUsername) dropdownUsername.textContent = loggedInUserName; // Show full name in dropdown
        } else if (userAvatar && loggedInUserEmail) { // Fallback to email initial if name not found
            const initial = loggedInUserEmail.charAt(0).toUpperCase();
            userAvatar.textContent = initial;
            if (userAvatarContainer) userAvatarContainer.title = loggedInUserEmail; // Set title for native hover tooltip
            if (dropdownUsername) dropdownUsername.textContent = loggedInUserEmail;
        } else {
             // Fallback if no name or email is available (shouldn't happen with current flow)
            userAvatar.textContent = 'G';
            if (userAvatarContainer) userAvatarContainer.title = 'Guest';
            if (dropdownUsername) dropdownUsername.textContent = 'Guest';
        }
    } else {
        // User is logged out
        if (topSignupBtn) topSignupBtn.classList.remove('hidden');
        if (topLoginBtn) topLoginBtn.classList.remove('hidden');
        if (userAvatarContainer) userAvatarContainer.classList.add('hidden');
        if (userDropdown) userDropdown.classList.remove('show');
    }
    console.log('UI updated. User logged in:', !!userToken);
}

// --- Backend API Interaction Functions ---
/**
 * Registers a new user with email/password or phone number/password.
 * @param {string|null} email - User's email address. Null if registering with phone.
 * @param {string} password - User's chosen password.
 * @param {string|null} phoneNumber - User's phone number. Null if registering with email.
 * @param {HTMLElement} button - The button element to disable during the request.
*/
async function registerUser(email, password, phoneNumber = null, button) {
    button.disabled = true;
    const originalButtonText = button.textContent;
    button.textContent = 'Registering...';

    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify({ email, password, phoneNumber })
        });

        const data = await response.json();

        if (response.ok) {
            if (data.requiresEmailVerification && email) {
                localStorage.setItem('pendingEmailVerification', email);
                // Store the temporary token for subsequent steps (needed for verify-email-otp call)
                if (data.token) {
                    localStorage.setItem('userToken', data.token);
                }
                showMessageBox(cleanMessage(data.message), 'success'); // Clean message here
                currentOtpContext = 'signup';
                showEmailOtpInputScreen();
                startEmailOtpTimer(120);
            } else if (data.profileCompletionRequired) {
                // Store identifier and the token provided by backend (needed for complete-profile call)
                identifierForProfileCompletion = data.identifier;
                if (data.token) {
                    localStorage.setItem('userToken', data.token);
                }
                showMessageBox(data.message, 'info');
                showCompleteProfileScreen();
            } else {
                // This path should ideally not be hit with the new flow, but as a fallback
                showMessageBox(data.message || 'Registration successful!', 'success');
                // If no token, it means something unexpected, but let's try to log them in if possible
                if (data.token) {
                    localStorage.setItem('userToken', data.token);
                    localStorage.setItem('loggedInUserEmail', email || phoneNumber);
                    localStorage.setItem('loggedInUserName', data.name || email || phoneNumber);
                    closePopup();
                    updateLoginUI();
                } else {
                    showLoginScreen(); // Prompt login if no token
                }
            }
        } else {
            showMessageBox('Registration failed: ' + (data.message || 'An unknown error occurred.'), 'error');
            console.error('Backend registration error:', data.message);
        }
    } catch (error) {
        console.error('Network error during registration:', error);
        showMessageBox('Network error during registration. Please check your connection and try again.', 'error');
    } finally {
        button.disabled = false;
        button.textContent = originalButtonText;
    }
}

/**
 * Logs in a user using identifier (email/username/phone) or password.
 * @param {string} identifier - User's email, username, or phone number.
 * @param {string} password - User's password.
 * @param {HTMLElement} button - The button element to disable during the request.
 */
async function loginUser(identifier, password, button) {
    button.disabled = true;
    const originalButtonText = button.textContent;
    button.textContent = 'Logging in...';

    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify({ identifier, password })
        });

        const data = await response.json();

        if (response.ok) {
            if (data.requiresEmailVerification) {
                localStorage.setItem('pendingEmailVerification', data.email);
                if (data.token) { // Ensure token is stored for email verification step
                    localStorage.setItem('userToken', data.token);
                }
                showMessageBox(cleanMessage(data.message), 'info'); // Clean message here
                currentOtpContext = 'login';
                showEmailOtpInputScreen();
                startEmailOtpTimer(120);
            } else if (data.profileCompletionRequired) {
                identifierForProfileCompletion = data.identifier;
                if (data.token) { // Ensure token is stored for profile completion step
                    localStorage.setItem('userToken', data.token);
                }
                showMessageBox(data.message, 'info');
                showCompleteProfileScreen();
            } else {
                showMessageBox(data.message || 'Logged in successfully!', 'success');
                localStorage.setItem('userToken', data.token);
                localStorage.setItem('loggedInUserEmail', data.email || identifier);
                localStorage.setItem('loggedInUserName', data.name || data.email || identifier);
                closePopup();
                console.log('User logged in. Token stored:', data.token);
                updateLoginUI(); // Ensure UI is updated immediately upon successful login
            }
        } else if (!response.ok && data.message && data.message.includes('does not have a password')) {
            showMessageBox('This account was registered with Google and does not have a password. Please sign in with Google or set a password for your account.', 'info');
            // Optionally, guide user to Google login or password reset flow
        } else {
            showMessageBox('Login failed: ' + (data.message || 'An unknown error occurred.'), 'error');
            console.error('Backend login error:', data.message);
        }
    } catch (error) {
        console.error('Network error during login:', error);
        showMessageBox('Network error during login. Please check your connection and try again.', 'error');
    } finally {
        button.disabled = false;
        button.textContent = originalButtonText;
    }
}

/**
 * Fetches the total number of registered users (admin-only endpoint).
 * @param {HTMLElement} button - The button element to disable during the request.
 */
async function getUserCount(button) {
    const token = localStorage.getItem('userToken');

    if (!token) {
        showMessageBox('You need to be logged in to view the user count. Please log in first.', 'info');
        return;
    }

    button.disabled = true;
    const originalButtonText = button.textContent;
    button.textContent = 'Fetching...';

    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/admin/users/count`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'ngrok-skip-browser-warning': 'true'
            }
        });

        const data = await response.json();

        if (response.ok) {
            showMessageBox(`Total registered users: ${data.totalUsers}`, 'info');
        } else {
            showMessageBox('Failed to get user count: ' + (data.message || 'An unknown error occurred.'), 'error');
            console.error('Backend user count error:', data.message);
        }
    } catch (error) {
        console.error('Network error fetching user count:', error);
        showMessageBox('Network error fetching user count. Please try again.', 'error');
    } finally {
        button.disabled = false;
        button.textContent = originalButtonText;
    }
}

/**
 * Handles the Google Sign-In response from the GIS library.
 * @param {Object} response - The Google Identity Services response object containing the credential.
 */
window.handleGoogleSignIn = async (response) => {
    const id_token = response.credential;
    console.log('Google ID Token received:', id_token);

    showMessageBox('Attempting Google login...', 'info');

    try {
        const backendResponse = await fetch(`${BACKEND_BASE_URL}/api/auth/google`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify({ token: id_token })
        });

        const data = await backendResponse.json();

        if (backendResponse.ok) {
            if (data.requiresEmailVerification && data.email) {
                localStorage.setItem('pendingEmailVerification', data.email);
                if (data.token) { // Ensure token is stored for email verification step
                    localStorage.setItem('userToken', data.token);
                }
                showMessageBox(cleanMessage(data.message), 'info'); // Clean message here
                currentOtpContext = 'googleSignup';
                showEmailOtpInputScreen();
                startEmailOtpTimer(120);
            } else if (data.profileCompletionRequired) {
                identifierForProfileCompletion = data.identifier || data.email;
                if (data.token) { // Ensure token is stored for profile completion step
                    localStorage.setItem('userToken', data.token);
                }
                showMessageBox(data.message, 'info');
                showCompleteProfileScreen();
            } else {
                showMessageBox(data.message || 'Logged in successfully with Google!', 'success');
                localStorage.setItem('userToken', data.token);
                localStorage.setItem('loggedInUserEmail', data.email);
                localStorage.setItem('loggedInUserName', data.name || data.email);
                closePopup();
                console.log('User logged in via existing Google account. Token stored:', data.token);
                updateLoginUI(); // Ensure UI is updated immediately upon successful Google login
            }
        } else {
            showMessageBox('Google login initiation failed: ' + (data.message || 'An unknown error occurred.'), 'error');
            console.error('Backend Google login error:', data.message);
            if (data.message && data.message.includes('already registered')) {
                showMessageBox('This email is already registered with an account. Please try logging in with your email/password or use "Continue with Google" on the login screen if you registered with Google before.', 'info');
                showLoginScreen();
            }
        }
    } catch (error) {
        console.error('Network error during Google login initiation:', error);
        showMessageBox('Network error during Google login. Please check your connection and try again.', 'error');
    }
};

/**
 * Verifies the email OTP sent to the user.
 * @param {string} email - The email address for which OTP was sent.
 * @param {string} otpCode - The OTP code entered by the user.
 * @param {HTMLElement} button - The button element to disable during the request.
 */
async function verifyEmailOtp(email, otpCode, button) {
    button.disabled = true;
    const originalButtonText = button.textContent;
    button.textContent = 'Verifying...';

    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/auth/verify-email-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify({ email, otpCode })
        });
        const data = await response.json();

        if (response.ok) {
            if (data.profileCompletionRequired) {
                identifierForProfileCompletion = data.identifier || data.email;
                if (data.token) { // Ensure token is stored for profile completion step
                    localStorage.setItem('userToken', data.token);
                }
                showMessageBox(cleanMessage(data.message), 'success'); // Clean message here
                showCompleteProfileScreen();
            } else if (data.setPasswordRequired) {
                localStorage.setItem('userEmailForPasswordSet', email);
                currentOtpContext = 'setPassword';
                showMessageBox(data.message, 'success');
                showCreatePasswordScreen();
            } else {
                showMessageBox(data.message || 'Email verified successfully!', 'success');
                localStorage.setItem('userToken', data.token);
                localStorage.setItem('loggedInUserEmail', email);
                localStorage.setItem('loggedInUserName', data.name || email);
                localStorage.removeItem('pendingEmailVerification');
                clearInterval(emailOtpTimerInterval);
                console.log('User logged in via Email OTP. Token stored:', data.token);
                updateLoginUI(); // Call updateLoginUI here to ensure dropdown updates
                closePopup();
            }
        } else {
            showMessageBox('Email OTP verification failed: ' + (data.message || 'An unknown error occurred.'), 'error');
            console.error('Backend email OTP verification error:', data.message);
        }
    } catch (error) {
        console.error('Network error during email OTP verification:', error);
        showMessageBox('Network error during email OTP verification. Please check your connection and try again.', 'error');
    } finally {
        button.disabled = false;
        button.textContent = originalButtonText;
    }
}

/**
 * Sets a password for a user, typically after a Google registration where no password was initially set.
 * @param {string} identifier - The user's email address or phone number.
 * @param {string} newPassword - The new password to set.
 * @param {HTMLElement} button - The button element to disable during the request.
 */
async function setPasswordForUser(identifier, newPassword, button) {
    button.disabled = true;
    const originalButtonText = button.textContent;
    button.textContent = 'Setting Password...';

    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/auth/set-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': localStorage.getItem('userToken') ? `Bearer ${localStorage.getItem('userToken')}` : '',
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify({ identifier, newPassword })
        });
        const data = await response.json();

        if (response.ok) {
            showMessageBox(data.message || 'Password set successfully!', 'success');
            localStorage.removeItem('userEmailForPasswordSet');
            localStorage.removeItem('passwordResetIdentifier');
            
            if (data.token) {
                localStorage.setItem('userToken', data.token);
                localStorage.setItem('loggedInUserEmail', data.email || identifier);
                localStorage.setItem('loggedInUserName', data.name || identifier);
                updateLoginUI(); // Call updateLoginUI here
            }
            
            showLoginScreen(); 
        } else {
            showMessageBox('Failed to set password: ' + (data.message || 'An unknown error occurred.'), 'error');
            console.error('Backend set password error:', data.message);
        }
    } catch (error) {
        console.error('Network error during set password:', error);
        showMessageBox('Network error while setting your password. Please check your connection and try again.', 'error');
    } finally {
        button.disabled = false;
        button.textContent = originalButtonText;
    }
}

/**
 * Sends an OTP to a phone number.
 * @param {string} phoneNumber - The phone number to send OTP to.
 * @param {HTMLElement} button - The button element to disable during the request.
 */
async function sendPhoneOtp(phoneNumber, button) {
    button.disabled = true;
    const originalButtonText = button.textContent;
    button.textContent = 'Sending OTP...';

    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/auth/send-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify({ phoneNumber })
        });
        const data = await response.json();

        if (response.ok) {
            showMessageBox(data.message, 'success');
            // Retained debug OTP message for phone
            if (data.debugOtp) {
                console.warn(`DEVELOPMENT OTP: ${data.debugOtp}`);
                showMessageBox(`Phone OTP is ${data.debugOtp}`, 'info');
            }
            const otpVerificationTitle = document.getElementById('otp-verification-title');
            const otpVerificationMessage = document.getElementById('otp-verification-message');
            if (otpVerificationTitle) otpVerificationTitle.textContent = 'Verify Phone OTP';
            if (otpVerificationMessage) otpVerificationMessage.textContent = `An OTP has been sent to ${phoneNumber}. Please enter it below.`;

            showScreen('otp-verification-screen');
            startPhoneOtpTimer(120);
        } else {
            showMessageBox('Failed to send OTP: ' + (data.message || 'An unknown error occurred.'), 'error');
        }
    } catch (error) {
        console.error('Network error during send OTP:', error);
        showMessageBox('Network error during send OTP. Please check your connection and try again.', 'error');
    } finally {
        button.disabled = false;
        button.textContent = originalButtonText;
    }
}

/**
 * Verifies a phone OTP.
 * @param {string} phoneNumber - The phone number.
 * @param {string} otpCode - The OTP code.
 * @param {HTMLElement} button - The button element to disable during the request.
 */
async function verifyPhoneOtp(phoneNumber, otpCode, button) {
    button.disabled = true;
    const originalButtonText = button.textContent;
    button.textContent = 'Verifying...';

    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/auth/verify-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify({ phoneNumber, otpCode })
        });
        const data = await response.json();

        if (response.ok) {
            if (data.profileCompletionRequired) {
                identifierForProfileCompletion = data.identifier || phoneNumber;
                if (data.token) { // Ensure token is stored for profile completion step
                    localStorage.setItem('userToken', data.token);
                }
                showMessageBox(data.message, 'success');
                showCompleteProfileScreen();
            } else {
                showMessageBox(data.message || 'Phone verified successfully!', 'success');
                localStorage.setItem('userToken', data.token);
                localStorage.setItem('loggedInUserEmail', phoneNumber);
                localStorage.setItem('loggedInUserName', data.name || phoneNumber);
                closePopup();
                console.log('User logged in via OTP. Token stored:', data.token);
                clearInterval(phoneOtpTimerInterval);
                updateLoginUI(); // Call updateLoginUI here to ensure dropdown updates
            }
        } else {
            showMessageBox('OTP verification failed: ' + (data.message || 'An unknown error occurred.'), 'error');
        }
    } catch (error) {
        console.error('Network error during OTP verification:', error);
        showMessageBox('Network error during OTP verification. Please check your connection and try again.', 'error');
    } finally {
        button.disabled = false;
        button.textContent = originalButtonText;
    }
}

/**
 * Sends a password reset OTP to the provided identifier (email or phone number).
 * @param {string} identifier - The email address or phone number.
 * @param {HTMLElement} button - The button element to disable during the request.
 */
async function sendPasswordResetOtp(identifier, button) {
    button.disabled = true;
    const originalButtonText = button.textContent;
    button.textContent = 'Sending Code...';

    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/auth/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify({ identifier })
        });
        const data = await response.json();

        if (response.ok) {
            showMessageBox(data.message || 'Verification code sent!', 'success');
            localStorage.setItem('passwordResetIdentifier', identifier);
            currentOtpContext = 'passwordReset';

            const otpVerificationTitle = document.getElementById('otp-verification-title');
            const otpVerificationMessage = document.getElementById('otp-verification-message');
            if (otpVerificationTitle) otpVerificationTitle.textContent = 'Verify Password Reset Code';
            if (otpVerificationMessage) otpVerificationMessage.textContent = `A verification code has been sent to ${identifier}. Please enter it below.`;

            showScreen('otp-verification-screen');
            startPhoneOtpTimer(120);

            // Retained debug OTP message for password reset, conditional on identifier type
            if (data.debugOtp) {
                console.warn(`DEVELOPMENT PASSWORD RESET OTP: ${data.debugOtp}`);
                // Check if the identifier looks like a phone number (simple check: starts with + or contains only digits and specific characters)
                // This regex is a basic example; you might need a more robust one depending on your phone number format.
                const isPhoneNumber = /^\+?\d[\d\s-()]*\d$/.test(identifier); 
                
                if (isPhoneNumber) {
                    showMessageBox(`Password Reset OTP: ${data.debugOtp}`, 'info');
                }
            }
        } else {
            showMessageBox('Failed to send verification code: ' + (data.message || 'An unknown error occurred.'), 'error');
        }
    } catch (error) {
        console.error('Network error during send password reset OTP:', error);
        showMessageBox('Network error. Please check your connection and try again.', 'error');
    } finally {
        button.disabled = false;
        button.textContent = originalButtonText;
    }
}

/**
 * Verifies the password reset OTP.
 * @param {string} identifier - The email or phone number used for reset.
 * @param {string} otpCode - The OTP code entered by the user.
 * @param {HTMLElement} button - The button element to disable during the request.
 */
async function verifyPasswordResetOtp(identifier, otpCode, button) {
    button.disabled = true;
    const originalButtonText = button.textContent;
    button.textContent = 'Verifying...';

    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/auth/verify-password-reset-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify({ identifier, otpCode })
        });
        const data = await response.json();

        if (response.ok) {
            showMessageBox(data.message || 'OTP verified. You can now set a new password.', 'success');
            clearInterval(phoneOtpTimerInterval);
            localStorage.setItem('userEmailForPasswordSet', identifier);
            if (data.token) { // Ensure token from verification is stored for set-password step
                localStorage.setItem('userToken', data.token);
            }
            currentOtpContext = 'passwordReset';
            
            const createPasswordTitle = document.getElementById('create-password-title');
            const createPasswordMessage = document.getElementById('create-password-message');
            if (createPasswordTitle) createPasswordTitle.textContent = 'Set New Password';
            if (createPasswordMessage) createPasswordMessage.textContent = 'Please enter and confirm your new password.';

            showCreatePasswordScreen();
        } else {
            showMessageBox('Verification failed: ' + (data.message || 'An unknown error occurred.'), 'error');
        }
    } catch (error) {
        console.error('Network error during password reset OTP verification:', error);
        showMessageBox('Network error. Please check your connection and try again.', 'error');
    } finally {
        button.disabled = false;
        button.textContent = originalButtonText;
    }
}

/**
 * Completes the user's profile by adding name and DOB.
 * @param {string} identifier - The user's email or phone number.
 * @param {string} name - The user's full name.
 * @param {string} dob - The user's date of birth (YYYY-MM-DD format).
 * @param {HTMLElement} button - The button element to disable during the request.
 */
async function completeUserProfile(identifier, name, dob, button) {
    button.disabled = true;
    const originalButtonText = button.textContent;
    button.textContent = 'Saving Profile...';

    try {
        const token = localStorage.getItem('userToken');

        if (!token) {
            showMessageBox('Access Denied: No token provided. Please log in again.', 'error');
            console.error('Error: No user token found for profile completion.');
            button.disabled = false;
            button.textContent = originalButtonText;
            closePopup();
            return;
        }

        const response = await fetch(`${BACKEND_BASE_URL}/api/auth/complete-profile`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name, dob }) // Removed identifier from body as backend uses req.user.id
        });
        const data = await response.json();

        if (response.ok) {
            showMessageBox(data.message || 'Profile completed successfully!', 'success');
            localStorage.setItem('userToken', data.token);
            localStorage.setItem('loggedInUserEmail', data.email || identifier);
            localStorage.setItem('loggedInUserName', data.name || identifier);
            localStorage.removeItem('identifierForProfileCompletion');
            closePopup();
            updateLoginUI(); // Call updateLoginUI here to ensure dropdown updates
        } else {
            showMessageBox('Failed to complete profile: ' + (data.message || 'An unknown error occurred.'), 'error');
            console.error('Backend complete profile error:', data.message);
        }
    } catch (error) {
        console.error('Network error during profile completion:', error);
        showMessageBox('Network error during profile completion. Please check your connection and try again.', 'error');
    } finally {
        button.disabled = false;
        button.textContent = originalButtonText;
    }
}


// --- DOM Content Loaded and Main Logic ---
document.addEventListener('DOMContentLoaded', async () => {
    // --- Centralized DOM Element References ---
    const popupOverlay = document.getElementById('popup-overlay');
    const popupContainer = document.getElementById('popup-container');

    const initialChoiceScreen = document.getElementById('initial-choice-screen');
    const loginScreen = document.getElementById('login-screen');
    const signupScreen = document.getElementById('signup-screen');
    const phoneSignupScreen = document.getElementById('phone-signup-screen');
    const phoneLoginScreen = document.getElementById('phone-login-screen');
    const phoneOtpInputScreen = document.getElementById('phone-otp-input-screen');
    const otpVerificationScreen = document.getElementById('otp-verification-screen');
    const emailOtpInputScreen = document.getElementById('email-otp-input-screen');
    const createPasswordScreen = document.getElementById('create-password-screen');
    const forgotPasswordInputScreen = document.getElementById('forgot-password-input-screen');
    const completeProfileScreen = document.getElementById('complete-profile-screen'); // NEW

    // All possible screens - Map them to an easy-to-use object
    const screens = {
        'initial-choice-screen': initialChoiceScreen,
        'login-screen': loginScreen,
        'signup-screen': signupScreen,
        'phone-signup-screen': phoneSignupScreen,
        'phone-login-screen': phoneLoginScreen,
        'phone-otp-input-screen': phoneOtpInputScreen,
        'otp-verification-screen': otpVerificationScreen,
        'email-otp-input-screen': emailOtpInputScreen,
        'create-password-screen': createPasswordScreen,
        'forgot-password-input-screen': forgotPasswordInputScreen,
        'complete-profile-screen': completeProfileScreen // NEW
    };

    const screenHistory = [];

    // --- Buttons and Inputs ---
    const closePopupButton = document.querySelector('#popup-container .close-button');
    const testUserCountBtn = document.getElementById('test-user-count-btn');

    // Initial Choice Screen elements
    const initialSignupBtn = document.getElementById('initial-signup-btn');
    const initialLoginLink = document.getElementById('initial-login-link');

    // Login Screen elements
    const loginBackBtn = document.getElementById('login-back-btn');
    const loginContinueButton = document.getElementById('login-continue-button');
    const loginEmailUsernameInput = document.getElementById('login-email-username');
    const loginPasswordInput = document.getElementById('login-password');
    const loginPhoneOtpBtn = document.getElementById('login-phone-otp-btn');
    const loginPhonePasswordBtn = document.getElementById('login-phone-password-btn');
    const loginSignupLink = document.getElementById('login-signup-link');
    const forgotPasswordLink = document.getElementById('forgot-password-link');

    // Signup Screen elements
    const signupBackBtn = document.getElementById('signup-back-btn');
    const signupNextButton = document.getElementById('signup-next-button');
    const signupEmailInput = document.getElementById('signup-email');
    const signupPasswordInput = document.getElementById('signup-password');
    const signupUsePhoneLink = document.getElementById('signup-use-phone-link');
    const signupLoginLink = document.getElementById('signup-login-link');

    // Phone Signup Screen elements
    const phoneSignupBackBtn = document.getElementById('phone-signup-back-btn');
    const phoneSignupNextButton = document.getElementById('phone-signup-next-button');
    const phonePhoneNumberSignupInput = document.getElementById('phone-number-signup');
    const phoneSignupPasswordInput = document.getElementById('phone-signup-password');
    const phoneSignupUseEmailLink = document.getElementById('phone-signup-use-email-link');
    const phoneSignupLoginLink = document.getElementById('phone-signup-login-link');

    // Phone Login Screen elements
    const phoneLoginBackBtn = document.getElementById('phone-login-back-btn');
    const phoneLoginContinueButton = document.getElementById('phone-login-continue-button');
    const phonePhoneNumberLoginInput = document.getElementById('phone-number-login');
    const phoneLoginPasswordInput = document.getElementById('phone-login-password');
    const phoneLoginSignupLink = document.getElementById('phone-login-signup-link');
    const phoneForgotPasswordLink = document.getElementById('phone-forgot-password-link');

    // Phone OTP Input Screen elements
    const phoneOtpBackBtn = document.getElementById('phone-otp-back-btn');
    const otpPhoneNumberInput = document.getElementById('otp-phone-number-input');
    const sendPhoneOtpButton = document.getElementById('send-otp-button');

    // OTP Verification Screen elements
    const otpVerificationBackBtn = document.getElementById('otp-verification-back-btn');
    const phoneOtpCodeInput = document.getElementById('otp-code-input');
    const verifyPhoneOtpButton = document.getElementById('verify-otp-button');
    const resendPhoneOtpButton = document.getElementById('resend-otp-button');
    const otpVerificationTitle = document.getElementById('otp-verification-title');
    const otpVerificationMessage = document.getElementById('otp-verification-message');

    // Email OTP specific elements
    const emailOtpBackBtn = document.getElementById('email-otp-back-btn');
    const emailOtpDisplayEmail = document.getElementById('email-otp-display-email');
    const emailOtpCodeInput = document.getElementById('email-otp-code-input');
    const verifyEmailOtpButton = document.getElementById('verify-email-otp-button');
    const resendEmailOtpButton = document.getElementById('resend-email-otp-button');

    // Forgot Password Input Screen elements
    const forgotPasswordBackBtn = document.getElementById('forgot-password-back-btn');
    const forgotPasswordIdentifierInput = document.getElementById('forgot-password-identifier-input');
    const sendPasswordResetOtpButton = document.getElementById('send-password-reset-otp-button');
    const forgotPasswordLoginLink = document.getElementById('forgot-password-login-link');

    // Set Password Screen elements
    const createPasswordBackBtn = document.getElementById('create-password-back-btn');
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const setNewPasswordButton = document.getElementById('set-new-password-button');
    const createPasswordTitle = document.getElementById('create-password-title');
    const createPasswordMessage = document.getElementById('create-password-message');

    // Complete Profile Screen elements (NEW)
    const completeProfileBackBtn = document.getElementById('complete-profile-back-btn');
    const profileNameInput = document.getElementById('profile-name-input');
    const profileDobInput = document.getElementById('profile-dob-input');
    const completeProfileSubmitButton = document.getElementById('complete-profile-submit-button');

    // Top bar elements for UI update
    const topSignupBtn = document.getElementById('top-signup-btn');
    const topLoginBtn = document.getElementById('top-login-btn');
    const userAvatarContainer = document.getElementById('user-avatar-container');
    const userAvatar = document.getElementById('user-avatar');
    const userDropdown = document.getElementById('user-dropdown');
    const dropdownUsername = document.getElementById('dropdown-username');
    const dropdownLogoutBtn = document.getElementById('dropdown-logout-btn');

    // NEW: Tooltip element for hover effect
    let userAvatarTooltip = null;

    /**
     * Creates or updates a tooltip for the user avatar on hover.
     * @param {string} userName - The name to display in the tooltip.
     */
    const createOrUpdateUserTooltip = (userName) => {
        if (!userAvatarTooltip) {
            userAvatarTooltip = document.createElement('div');
            userAvatarTooltip.id = 'user-avatar-tooltip';
            userAvatarTooltip.classList.add('user-avatar-tooltip', 'hidden');
            document.body.appendChild(userAvatarTooltip);
        }
        userAvatarTooltip.textContent = userName;
    };

    /**
     * Shows the user avatar tooltip.
     * @param {Event} e - The mouseover event.
     */
    const showUserTooltip = (e) => {
        const userName = localStorage.getItem('loggedInUserName') || localStorage.getItem('loggedInUserEmail') || 'Guest';
        createOrUpdateUserTooltip(userName);

        const rect = userAvatarContainer.getBoundingClientRect();
        // Position the tooltip above and centered with the avatar
        userAvatarTooltip.style.left = `${rect.left + rect.width / 2}px`;
        userAvatarTooltip.style.top = `${rect.top - userAvatarTooltip.offsetHeight - 5}px`; // Adjust 5px for spacing
        userAvatarTooltip.classList.remove('hidden');
        userAvatarTooltip.classList.add('show');
    };

    /**
     * Hides the user avatar tooltip.
     */
    const hideUserTooltip = () => {
        if (userAvatarTooltip) {
            userAvatarTooltip.classList.remove('show');
            userAvatarTooltip.classList.add('hidden');
        }
    };


    /**
     * Gets the ID of the currently active screen.
     * @returns {string|null} The ID of the active screen, or null if none.
     */
    const getActiveScreenId = () => {
        for (const id in screens) {
            if (screens[id] && screens[id].classList.contains('active')) {
                return id;
            }
        }
        return null;
    };

    /**
     * Shows a specific screen and hides all others within the popup.
     * @param {string} screenToShowId - The ID of the screen to show.
     * @param {boolean} [pushToHistory=true] - Whether to push the current screen to history.
     */
    window.showScreen = (screenToShowId, pushToHistory = true) => {
        const screenToShow = screens[screenToShowId];
        if (!screenToShow) {
            console.error(`Screen with ID "${screenToShowId}" not found.`);
            return;
        }

        const currentActiveScreenId = getActiveScreenId();
        if (pushToHistory && currentActiveScreenId && currentActiveScreenId !== screenToShowId) {
            screenHistory.push(currentActiveScreenId);
            console.log('Screen pushed to history:', currentActiveScreenId, 'History:', screenHistory);
        } else if (!pushToHistory) {
            console.log('Not pushing to history. Current history:', screenHistory);
        }

        screenToShow.scrollTop = 0;

        if (currentActiveScreenId && currentActiveScreenId !== screenToShowId) {
            const currentActiveScreen = screens[currentActiveScreenId];
            if (currentActiveScreen) {
                currentActiveScreen.classList.remove('active');
                currentActiveScreen.classList.add('slide-out-left');
                currentActiveScreen.classList.add('opacity-0', 'pointer-events-none');

                currentActiveScreen.addEventListener('transitionend', function handler() {
                    currentActiveScreen.classList.remove('slide-out-left');
                    currentActiveScreen.style.display = 'none';
                    currentActiveScreen.removeEventListener('transitionend', handler);
                }, { once: true });
            }
        }

        screenToShow.style.display = 'flex';
        screenToShow.classList.remove('opacity-0', 'pointer-events-none', 'slide-out-left');
        screenToShow.classList.add('active');

        if (!pushToHistory && currentActiveScreenId) {
            screenToShow.classList.add('slide-in-right');
            void screenToShow.offsetWidth;
            screenToShow.classList.remove('slide-in-right');
        } else {
            screenToShow.style.transform = 'translateX(0)';
        }

        setTimeout(() => {
            if (popupContainer) {
                popupContainer.style.height = screenToShow.scrollHeight + 'px';
            }
        }, 50);
    };

    /**
     * Navigates back to the previous screen in the history stack.
     */
    window.goBack = () => {
        console.log('goBack called. Current history:', screenHistory);
        if (screenHistory.length > 0) {
            const prevScreenId = screenHistory.pop();
            console.log('Popping from history:', prevScreenId, 'New history:', screenHistory);
            showScreen(prevScreenId, false);
        } else {
            console.log('History empty, closing popup.');
            closePopup();
        }
    };

    window.showInitialChoiceScreen = () => {
        screenHistory.length = 0;
        console.log('showInitialChoiceScreen: History cleared.');
        showScreen('initial-choice-screen', false);
    };

    window.showLoginScreen = () => {
        showScreen('login-screen');
        if (phoneOtpTimerInterval) { clearInterval(phoneOtpTimerInterval); }
        phoneOtpResendAvailableTime = 0;
    };

    window.showSignupScreen = () => {
        showScreen('signup-screen');
        if (phoneOtpTimerInterval) { clearInterval(phoneOtpTimerInterval); }
        phoneOtpResendAvailableTime = 0;
    };

    window.showPhoneSignup = () => {
        showScreen('phone-signup-screen');
        if (phoneOtpTimerInterval) { clearInterval(phoneOtpTimerInterval); }
        phoneOtpResendAvailableTime = 0;
    };

    window.showPhoneLogin = () => {
        showScreen('phone-login-screen');
    };

    window.showPhoneOtpInput = () => {
        showScreen('phone-otp-input-screen');
        if (phoneOtpTimerInterval) { clearInterval(phoneOtpTimerInterval); }
        phoneOtpResendAvailableTime = 0;
    };

    window.showEmailOtpInputScreen = () => {
        const pendingEmail = localStorage.getItem('pendingEmailVerification');
        if (pendingEmail) {
            if (emailOtpDisplayEmail) emailOtpDisplayEmail.textContent = pendingEmail;
            showScreen('email-otp-input-screen');
            if (emailOtpTimerInterval) { clearInterval(emailOtpTimerInterval); }
            emailOtpResendAvailableTime = 0;
        } else {
            showMessageBox('No email found for OTP verification. Please try Google login again.', 'error');
            showInitialChoiceScreen();
        }
    };

    window.showCreatePasswordScreen = () => {
        if (newPasswordInput) newPasswordInput.value = '';
        if (confirmPasswordInput) confirmPasswordInput.value = '';
        showScreen('create-password-screen');
    };

    window.showForgotPasswordInputScreen = () => {
        if (forgotPasswordIdentifierInput) forgotPasswordIdentifierInput.value = '';
        showScreen('forgot-password-input-screen');
    };

    // NEW: Function to show Complete Profile Screen
    window.showCompleteProfileScreen = () => {
        if (profileNameInput) profileNameInput.value = '';
        if (profileDobInput) profileDobInput.value = '';
        showScreen('complete-profile-screen');
    };


    /**
     * Opens the main authentication popup.
     */
    window.openPopup = () => {
        if (popupOverlay) popupOverlay.classList.add('active');
        popupOverlay.classList.remove('invisible', 'opacity-0');
        document.body.classList.add('no-scroll');
        screenHistory.length = 0;
        console.log('openPopup: History cleared.');
        showScreen('initial-choice-screen', false);
    };

    /**
     * Closes the main authentication popup.
     */
    window.closePopup = () => {
    if (popupOverlay) {
        popupOverlay.classList.remove('active');
        popupOverlay.classList.add('invisible', 'opacity-0');
        popupOverlay.classList.add('hidden'); // <-- ADD THIS LINE
    }
    document.body.classList.remove('no-scroll');
    screenHistory.length = 0;
        console.log('closePopup: History cleared and popup closed.');
        for (const id in screens) {
            const screen = screens[id];
            if (screen) {
                screen.classList.remove('active');
                screen.classList.add('opacity-0', 'pointer-events-none');
                screen.classList.remove('slide-out-left', 'slide-in-right');
                screen.style.display = 'none';
            }
        }
        localStorage.removeItem('pendingEmailVerification');
        localStorage.removeItem('userEmailForPasswordSet');
        localStorage.removeItem('passwordResetIdentifier');
        localStorage.removeItem('identifierForProfileCompletion'); // NEW: Clear profile completion identifier
        hideUserTooltip(); // Hide tooltip when popup closes
    };

    // --- Initial Load Logic ---
    updateLoginUI();

    setTimeout(() => {
        const userToken = localStorage.getItem('userToken');
        if (!userToken) {
            openPopup();
        }
    }, 2000);

    // --- Event Listeners ---
    if (closePopupButton) {
        closePopupButton.addEventListener('click', closePopup);
    }
    if (testUserCountBtn) {
        testUserCountBtn.addEventListener('click', () => getUserCount(testUserCountBtn));
    }

    // Top Bar Login/Signup Button Listeners
    if (topSignupBtn) {
        topSignupBtn.addEventListener('click', openPopup);
    }
    if (topLoginBtn) {
        topLoginBtn.addEventListener('click', openPopup);
    }

    // User Avatar and Dropdown Listeners
    if (userAvatarContainer && userDropdown) {
        let isDropdownOpen = false;

        userAvatarContainer.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent click from propagating to document

            if (!isDropdownOpen) {
                userDropdown.classList.add('show');
                // Ensure dropdown username is updated when opened by click
                const loggedInUserName = localStorage.getItem('loggedInUserName') || localStorage.getItem('loggedInUserEmail') || 'Guest';
                if (dropdownUsername) dropdownUsername.textContent = loggedInUserName;
                
                isDropdownOpen = true;
                // Add a click listener to the document to close dropdown when clicking outside
                document.addEventListener('click', outsideClickHandler);
            } else {
                userDropdown.classList.remove('show');
                isDropdownOpen = false;
                document.removeEventListener('click', outsideClickHandler);
            }
        });

        // Event listeners for the new tooltip on hover
        userAvatarContainer.addEventListener('mouseover', showUserTooltip);
        userAvatarContainer.addEventListener('mouseout', hideUserTooltip);


        function outsideClickHandler(event) {
            // Check if the click was outside the avatar container and the dropdown itself
            const clickedOutside = !userAvatarContainer.contains(event.target) && !userDropdown.contains(event.target);
            if (clickedOutside) {
                userDropdown.classList.remove('show');
                isDropdownOpen = false;
                document.removeEventListener('click', outsideClickHandler);
            }
        }
    }

    if (dropdownLogoutBtn) {
        dropdownLogoutBtn.addEventListener('click', () => {
            localStorage.removeItem('userToken');
            localStorage.removeItem('loggedInUserEmail');
            localStorage.removeItem('loggedInUserName');
            showMessageBox('You have been logged out.', 'info');
            updateLoginUI();
            closePopup(); // Close popup after logout
        });
    }

    // Initial Choice Screen Listeners
    if (initialSignupBtn) {
        initialSignupBtn.addEventListener('click', showSignupScreen);
    }
    if (initialLoginLink) {
        initialLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginScreen();
        });
    }

    // Login Screen Listeners
    if (loginBackBtn) {
        loginBackBtn.addEventListener('click', goBack);
    }
    if (loginContinueButton) {
        loginContinueButton.addEventListener('click', async () => {
            const identifier = loginEmailUsernameInput ? loginEmailUsernameInput.value.trim() : '';
            const password = loginPasswordInput ? loginPasswordInput.value.trim() : '';

            if (!identifier || !password) {
                showMessageBox('Please enter your email/username/phone and password.', 'error');
                return;
            }
            await loginUser(identifier, password, loginContinueButton);
            if (loginEmailUsernameInput) loginEmailUsernameInput.value = '';
            if (loginPasswordInput) loginPasswordInput.value = '';
        });
    }

    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            showForgotPasswordInputScreen();
        });
    }

    if (loginPhoneOtpBtn) {
        loginPhoneOtpBtn.addEventListener('click', showPhoneOtpInput);
    }
    if (loginPhonePasswordBtn) {
        loginPhonePasswordBtn.addEventListener('click', showPhoneLogin);
    }
    if (loginSignupLink) {
        loginSignupLink.addEventListener('click', (e) => {
            e.preventDefault();
            showSignupScreen();
        });
    }

    // Signup Screen Listeners
    if (signupBackBtn) {
        signupBackBtn.addEventListener('click', goBack);
    }
    if (signupNextButton) {
        signupNextButton.addEventListener('click', async () => {
            const email = signupEmailInput ? signupEmailInput.value.trim() : '';
            const password = signupPasswordInput ? signupPasswordInput.value.trim() : '';

            if (!email || !email.includes('@')) {
                showMessageBox('Please enter a valid email address.', 'error');
                return;
            }
            if (!password || password.length < 6) {
                showMessageBox('Please enter a password with at least 6 characters.', 'error');
                return;
            }

            await registerUser(email, password, null, signupNextButton);
            if (signupEmailInput) signupEmailInput.value = '';
            if (signupPasswordInput) signupPasswordInput.value = '';
        });
    }
    if (signupUsePhoneLink) {
        signupUsePhoneLink.addEventListener('click', (e) => {
            e.preventDefault();
            showPhoneSignup();
        });
    }
    if (signupLoginLink) {
        signupLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginScreen();
        });
    }

    // Phone Signup Screen Listeners
    if (phoneSignupBackBtn) {
        phoneSignupBackBtn.addEventListener('click', goBack);
    }
    if (phoneSignupNextButton) {
        phoneSignupNextButton.addEventListener('click', async () => {
            const phoneNumber = phonePhoneNumberSignupInput ? phonePhoneNumberSignupInput.value.trim() : '';
            const password = phoneSignupPasswordInput ? phoneSignupPasswordInput.value.trim() : '';

            if (!phoneNumber) {
                showMessageBox('Please enter a phone number.', 'error');
                return;
            }
            if (!password || password.length < 6) {
                showMessageBox('Please enter a password with at least 6 characters.', 'error');
                return;
            }

            await registerUser(null, password, phoneNumber, phoneSignupNextButton);
            if (phonePhoneNumberSignupInput) phonePhoneNumberSignupInput.value = '';
            if (phoneSignupPasswordInput) phoneSignupPasswordInput.value = '';
        });
    }
    if (phoneSignupUseEmailLink) {
        phoneSignupUseEmailLink.addEventListener('click', (e) => {
            e.preventDefault();
            showSignupScreen();
        });
    }
    if (phoneSignupLoginLink) {
        phoneSignupLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginScreen();
        });
    }

    // Phone Login Screen Listeners
    if (phoneLoginBackBtn) {
        phoneLoginBackBtn.addEventListener('click', goBack);
    }
    if (phoneLoginContinueButton) {
        phoneLoginContinueButton.addEventListener('click', async () => {
            const phoneNumber = phonePhoneNumberLoginInput ? phonePhoneNumberLoginInput.value.trim() : '';
            const password = phoneLoginPasswordInput ? phoneLoginPasswordInput.value.trim() : '';

            if (!phoneNumber || !password) {
                showMessageBox('Please enter a phone number and a password.', 'error');
                return;
            }
            await loginUser(phoneNumber, password, phoneLoginContinueButton);
            if (phonePhoneNumberLoginInput) phonePhoneNumberLoginInput.value = '';
            if (phoneLoginPasswordInput) phoneLoginPasswordInput.value = '';
        });
    }

    if (phoneForgotPasswordLink) {
        phoneForgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            showForgotPasswordInputScreen();
        });
    }

    if (phoneLoginSignupLink) {
        phoneLoginSignupLink.addEventListener('click', (e) => {
            e.preventDefault();
            showSignupScreen();
        });
    }

    // Phone OTP Input Screen Listeners
    if (phoneOtpBackBtn) {
        phoneOtpBackBtn.addEventListener('click', goBack);
    }
    if (sendPhoneOtpButton) {
        sendPhoneOtpButton.addEventListener('click', async () => {
            const phoneNumber = otpPhoneNumberInput ? otpPhoneNumberInput.value.trim() : '';
            if (!phoneNumber) {
                showMessageBox('Please enter your phone number to send OTP.', 'error');
                return;
            }
            currentOtpContext = 'login';
            await sendPhoneOtp(phoneNumber, sendPhoneOtpButton);
        });
    }

    // OTP Verification Screen Listeners
    if (otpVerificationBackBtn) {
        otpVerificationBackBtn.addEventListener('click', goBack);
    }
    if (verifyPhoneOtpButton) {
        verifyPhoneOtpButton.addEventListener('click', async () => {
            const otpCode = phoneOtpCodeInput ? phoneOtpCodeInput.value.trim() : '';

            if (!otpCode) {
                showMessageBox('Please enter the OTP.', 'error');
                return;
            }

            if (currentOtpContext === 'passwordReset') {
                const identifier = localStorage.getItem('passwordResetIdentifier');
                if (!identifier) {
                    showMessageBox('No identifier found for password reset. Please restart the process.', 'error');
                    closePopup();
                    return;
                }
                await verifyPasswordResetOtp(identifier, otpCode, verifyPhoneOtpButton);
            } else {
                const phoneNumber = otpPhoneNumberInput ? otpPhoneNumberInput.value.trim() : '';
                if (!phoneNumber) {
                    showMessageBox('No phone number found. Please go back and re-enter.', 'error');
                    return;
                }
                await verifyPhoneOtp(phoneNumber, otpCode, verifyPhoneOtpButton);
            }
            if (phoneOtpCodeInput) phoneOtpCodeInput.value = '';
        });
    }
    if (resendPhoneOtpButton) {
        resendPhoneOtpButton.addEventListener('click', async () => {
            if (phoneOtpResendAvailableTime <= 0) {
                if (currentOtpContext === 'passwordReset') {
                    const identifier = localStorage.getItem('passwordResetIdentifier');
                    if (!identifier) {
                        showMessageBox('No identifier found to resend OTP. Please restart the process.', 'error');
                        return;
                    }
                    await sendPasswordResetOtp(identifier, resendPhoneOtpButton);
                } else {
                    const phoneNumber = otpPhoneNumberInput ? otpPhoneNumberInput.value.trim() : '';
                    if (!phoneNumber) {
                        showMessageBox('No phone number found to resend OTP. Please go back and re-enter.', 'error');
                        return;
                    }
                    await sendPhoneOtp(phoneNumber, resendPhoneOtpButton);
                }
            } else {
                showMessageBox('Please wait before resending OTP.', 'info');
            }
        });
    }

    // Email OTP Input Screen Listeners
    if (emailOtpBackBtn) {
        emailOtpBackBtn.addEventListener('click', goBack);
    }
    if (verifyEmailOtpButton) {
        verifyEmailOtpButton.addEventListener('click', async () => {
            const email = localStorage.getItem('pendingEmailVerification');
            const otpCode = emailOtpCodeInput ? emailOtpCodeInput.value.trim() : '';

            if (!email || !otpCode) {
                showMessageBox('Email and OTP are required.', 'error');
                return;
            }
            await verifyEmailOtp(email, otpCode, verifyEmailOtpButton);
            if (emailOtpCodeInput) emailOtpCodeInput.value = '';
        });
    }
    if (resendEmailOtpButton) {
        resendEmailOtpButton.addEventListener('click', async () => {
            if (emailOtpResendAvailableTime <= 0) {
                const email = localStorage.getItem('pendingEmailVerification');
                if (!email) {
                    showMessageBox('No email found to resend OTP. Please try Google login again.', 'error');
                    return;
                }
                try {
                    const response = await fetch(`${BACKEND_BASE_URL}/api/auth/resend-email-otp`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'ngrok-skip-browser-warning': 'true'
                        },
                        body: JSON.stringify({ email })
                    });
                    const data = await response.json();
                    if (response.ok) {
                        showMessageBox(cleanMessage(data.message), 'success'); // Clean message here
                        startEmailOtpTimer(120);
                        resendEmailOtpButton.classList.add('hidden');
                    } else {
                        showMessageBox('Failed to resend email OTP: ' + (data.message || 'An unknown error occurred.'), 'error');
                    }
                } catch (error) {
                    console.error('Network error during resend email OTP:', error);
                    showMessageBox('Network error during resend email OTP. Please check your connection and try again.', 'error');
                }
            } else {
                showMessageBox('Please wait before resending OTP.', 'info');
            }
        });
    }

    // Forgot Password Input Screen Listeners
    if (forgotPasswordBackBtn) {
        forgotPasswordBackBtn.addEventListener('click', goBack);
    }
    if (sendPasswordResetOtpButton) {
        sendPasswordResetOtpButton.addEventListener('click', async () => {
            const identifier = forgotPasswordIdentifierInput ? forgotPasswordIdentifierInput.value.trim() : '';
            if (!identifier) {
                showMessageBox('Please enter your email or phone number.', 'error');
                return;
            }
            await sendPasswordResetOtp(identifier, sendPasswordResetOtpButton);
        });
    }
    if (forgotPasswordLoginLink) {
        forgotPasswordLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginScreen();
        });
    }

    // Set Password Screen Listeners
    if (createPasswordBackBtn) {
        createPasswordBackBtn.addEventListener('click', goBack);
    }
    if (setNewPasswordButton) {
        setNewPasswordButton.addEventListener('click', async () => {
            const identifier = localStorage.getItem('userEmailForPasswordSet') || localStorage.getItem('passwordResetIdentifier');
            const newPassword = newPasswordInput ? newPasswordInput.value.trim() : '';
            const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value.trim() : '';

            if (!identifier) {
                showMessageBox('User identifier not found. Please try logging in or resetting password again.', 'error');
                closePopup();
                return;
            }

            if (!newPassword || newPassword.length < 6) {
                showMessageBox('Please enter a new password with at least 6 characters.', 'error');
                return;
            }

            if (newPassword !== confirmPassword) {
                showMessageBox('Passwords do not match. Please re-enter.', 'error');
                return;
            }

            await setPasswordForUser(identifier, newPassword, setNewPasswordButton);
            if (newPasswordInput) newPasswordInput.value = '';
            if (confirmPasswordInput) confirmPasswordInput.value = '';
        });
    }

    // NEW: Complete Profile Screen Listeners
    if (completeProfileBackBtn) {
        completeProfileBackBtn.addEventListener('click', goBack);
    }
    if (completeProfileSubmitButton) {
        completeProfileSubmitButton.addEventListener('click', async () => {
            const name = profileNameInput ? profileNameInput.value.trim() : '';
            const dob = profileDobInput ? profileDobInput.value.trim() : ''; // YYYY-MM-DD format from input type="date"

            if (!name) {
                showMessageBox('Please enter your name.', 'error');
                return;
            }
            if (!dob) {
                showMessageBox('Please enter your date of birth.', 'error');
                return;
            }

            const identifier = identifierForProfileCompletion; // Get identifier stored from previous step
            if (!identifier) {
                showMessageBox('Could not find user identifier for profile completion. Please try logging in again.', 'error');
                closePopup();
                return;
            }

            await completeUserProfile(identifier, name, dob, completeProfileSubmitButton);
        });
    }


     // Event listeners for UI components
    const libraryLikedBtn = Array.from(document.querySelectorAll('h3.text-base.font-medium')).find(el => el.textContent.trim() === 'Liked Songs');
    if (libraryLikedBtn) {
        libraryLikedBtn.closest('div').addEventListener('click', () => {
            const likedOverlay = document.getElementById('likedSongsOverlay');
            if (likedOverlay) {
                likedOverlay.classList.add('open');
                likedOverlay.setAttribute('aria-hidden', 'false');
                fetchAndRenderLikedSongs();
            }
        });
    }

    const closeLikedBtn = document.getElementById('closeLikedSongs');
    if (closeLikedBtn) {
        closeLikedBtn.addEventListener('click', () => {
            const likedOverlay = document.getElementById('likedSongsOverlay');
            if (likedOverlay) {
                likedOverlay.classList.remove('open');
                likedOverlay.setAttribute('aria-hidden', 'true');
            }
        });
    }

    // Wiring up the playbar like button
    const playbarLikeBtn = document.getElementById('mobile-add-btn') || document.querySelector('.playbar-add-btn');
    if (playbarLikeBtn && !playbarLikeBtn.dataset.swarifyLikeWired) {
        playbarLikeBtn.dataset.swarifyLikeWired = 'true';
        playbarLikeBtn.addEventListener('click', (ev) => {
            ev.preventDefault();
            toggleLikeCurrentSong();
        });
    }
    
    // Wire up the add-to-playlist popup listener
    const addPopupLikedItem = document.querySelector('#add-popup-overlay .swarify-add-popup-item');
    if(addPopupLikedItem && addPopupLikedItem.textContent.toLowerCase().includes('liked songs')) {
        addPopupLikedItem.addEventListener('click', (ev) => {
            ev.preventDefault();
            
            const song = getCurrentSongForLike();
            if (song) {
                const likedSong = LikedStore.get().find(x => LikedStore.isSame(x, song));
                if (likedSong) {
                    backendUnlikeSong(likedSong);
                    LikedStore.remove(song);
                } else {
                    LikedStore.add(song);
                    backendLikeSong(song);
                }
                updatePlaybarLikeState();
                updatePopupLikeState();
            }

            const overlay = document.getElementById('add-popup-overlay');
            if(overlay) {
                overlay.classList.remove('active');
                overlay.style.display = 'none';
            }
        });
    }

    // Call the function to initialize the UI state
    initializeUIState();

    // --- NEW: Event listeners for the song options popup ---
    const popupBackdrop = document.getElementById('song-options-popup');
    const removeBtn = document.getElementById('popup-remove-from-liked');
    const goBtn = document.getElementById('popup-go-to-album');

    // Listener for the backdrop to close the popup on outside click
    if (popupBackdrop) {
        popupBackdrop.addEventListener('click', (e) => {
            if (e.target === popupBackdrop) {
                closeSongOptionsPopup();
            }
        });
    }
    
    // Listener for the "Remove from this playlist" button
    if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
            const albumId = e.currentTarget.dataset.albumId;
            const trackIndex = e.currentTarget.dataset.trackIndex;
            const likeId = e.currentTarget.dataset.likeId;
            const songTitle = e.currentTarget.dataset.songTitle;
            
            if (albumId && trackIndex) {
                const songToRemove = { albumId, trackIndex: Number(trackIndex), likeId };
                LikedStore.remove(songToRemove);
                backendUnlikeSong(songToRemove);
                showMessageBox(`Removed from Liked Songs: ${songTitle}`, 'success', 1800);
            }
            closeSongOptionsPopup();
            renderLikedSongsOverlay(); // Re-render the liked songs list
        });
    }

    // Listener for "Go to album" button
    // Listener for "Go to album" button
if (goBtn) {
    goBtn.addEventListener('click', (e) => {
        // Use e.currentTarget to get the button element itself
        const albumId = e.currentTarget.dataset.albumId; 
        const albumToOpen = allAlbumsData.find(a => a.id === albumId);
        
        if (albumToOpen) {
            // First, close all other popups, including the song options and liked songs overlays.
            // This is a more robust approach than calling individual close functions.
            closeAllPopups();
            
            // Then, immediately open the album details.
            openAlbumDetails(albumToOpen);
        }
    });
}
    
});



// NEW: inline js from html

function setDynamicBackground() {
                const albumArt = document.getElementById('full-screen-album-art');
                if (albumArt) {
                    albumArt.onload = () => {
                        const colorThief = new ColorThief();
                        const dominantColor = colorThief.getColor(albumArt);
                        const rgbColor = `rgb(${dominantColor[0]}, ${dominantColor[1]}, ${dominantColor[2]})`;
                        document.getElementById('full-screen-player').style.backgroundColor = rgbColor;
                    };
                }
            }
            setDynamicBackground();

document.addEventListener('DOMContentLoaded', function() {
  const libraryLink = document.querySelector('.unique-footer-nav .unique-nav-item:nth-child(3) a');
  const popup = document.getElementById('library-popup');
  const closeBtn = document.getElementById('close-library-popup');

  if(libraryLink && popup && closeBtn) {
    libraryLink.addEventListener('click', function(e) {
      e.preventDefault();
      popup.classList.remove('hidden');
    });

    closeBtn.addEventListener('click', function() {
      popup.classList.add('hidden');
    });
  }
});


        // NEW: Event listener for the mobile add button to open the popup
        document.getElementById('mobile-add-btn').addEventListener('click', function() {
            const popupOverlay = document.getElementById('add-popup-overlay');
            popupOverlay.classList.add('active');
        });

        // NEW: Event listener to close the popup when clicking outside
        document.getElementById('add-popup-overlay').addEventListener('click', function(event) {
            // Check if the click occurred on the overlay itself, not a child element
            if (event.target === this) {
                this.classList.remove('active');
            }
        });

        // Intercept any click on + button before other scripts can react
document.addEventListener("click", function(e) {
    const plusBtn = e.target.closest("#mobile-add-btn");
    if (plusBtn) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        // Show only the liked popup
        const likedPopup = document.querySelector(".swarify-add-popup-overlay");
        if (likedPopup) {
            likedPopup.classList.add("active");
            likedPopup.style.display = "block";
        }
    }
}, true);
  

// ======== Liked Songs: storage + UI + backend sync ========

// ======== Liked Songs: storage + UI + backend sync ========

const LIKED_STORAGE_KEY = 'swarify_liked_songs_v2';
const API_BASE_URL = "https://452e1283da6a.ngrok-free.app"; // Backend server base URL

const LIKED_API = {
    getLikes: () => `${API_BASE_URL}/api/likes`,
    likeSong: () => `${API_BASE_URL}/api/likes`,
    unlikeSong: (likeId) => `${API_BASE_URL}/api/likes/${encodeURIComponent(likeId)}`,
    // This is not used in the optimized fetch, but kept for other uses
    getAlbum: (albumId) => `${API_BASE_URL}/api/albums?id=${encodeURIComponent(albumId)}`
};

const LikedStore = {
    get() {
        try {
            return JSON.parse(localStorage.getItem(LIKED_STORAGE_KEY)) || [];
        } catch (e) {
            console.error("Failed to parse liked songs from localStorage.", e);
            return [];
        }
    },
    set(arr) {
        localStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify(arr));
    },
    isSame(a, b) {
        return a.albumId === b.albumId && String(a.trackIndex) === String(b.trackIndex);
    },
    add(item) {
        const list = this.get();
        if (!list.some(x => this.isSame(x, item))) {
            list.unshift({ ...item,
                addedAt: Date.now()
            });
            this.set(list);
        }
        return list;
    },
    remove(item) {
        const list = this.get().filter(x => !this.isSame(x, item));
        this.set(list);
        return list;
    },
    find(item) {
        return this.get().find(x => this.isSame(x, item));
    }
};

function escapeHtml(str) {
    if (!str) return '';
    return ('' + str).replace(/[&<>"']/g, c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[c]);
}

function formatTimeDisplay(val) {
    if (!val) return '';
    if (typeof val === 'string' && val.includes(':')) return val;
    let sec = parseInt(val, 10);
    if (isNaN(sec)) return '';
    let m = Math.floor(sec / 60);
    let s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function dispatchEventSafe(name) {
    try {
        document.dispatchEvent(new Event(name));
    } catch (e) {}
}

function isLoggedIn() {
    return !!localStorage.getItem('userToken');
}

function showMessageBox(message, type, duration = 2000) {
    console.log(`[Message: ${type}] ${message}`);
    // This is a placeholder for a UI function
    // Example: show some toast message
    // const msgBox = document.getElementById('message-box');
    // msgBox.textContent = message;
    // msgBox.className = `message-box ${type}`;
    // setTimeout(() => msgBox.className = 'message-box', duration);
}

// Helper to get current song data from global variables
function getCurrentSongForLike() {
    try {
        let album = (typeof currentAlbum !== 'undefined' && currentAlbum) ? currentAlbum : null;
        let idx = (typeof currentTrackIndex === 'number') ? currentTrackIndex : (typeof window.currentTrackIndex === 'number' ? window.currentTrackIndex : 0);
        if ((!album || !album.id) && typeof playingAlbum !== 'undefined' && playingAlbum) {
            album = playingAlbum;
        }
        if (!album || !album.id) return null;

        if (Array.isArray(album.tracks) && album.tracks.length > 0) {
            if (!(idx >= 0 && idx < album.tracks.length)) idx = 0;
            const t = album.tracks[idx];
            if (!t) return null;
            return {
                albumId: album.id,
                albumTitle: album.title || album.name || 'Album',
                trackIndex: idx,
                title: t.title || `Track ${idx + 1}`,
                artist: t.artist || album.artist || '',
                img: t.img || album.coverArt || '',
                duration: t.duration,
                src: t.src || t.streamUrl || t.url || ''
            };
        }
        return {
            albumId: album.id,
            albumTitle: album.title || album.name || 'Album',
            trackIndex: 0,
            title: album.currentTrackTitle || album.title || 'Unknown Track',
            artist: album.artist || '',
            img: album.coverArt || '',
            duration: album.currentTrackDuration || '',
            src: album.embedUrl || album.url || ''
        };
    } catch (e) {
        console.warn('getCurrentSongForLike error', e);
        return null;
    }
}



// Function to send a like request to the backend with full song details
async function backendLikeSong(item) {
    const token = localStorage.getItem('userToken');
    if (!token) {
        console.warn('Cannot like song: user not authenticated.');
        return;
    }
    try {
        const res = await fetch(LIKED_API.likeSong(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            // The key change: send the full item object
            body: JSON.stringify(item)
        });

    if (res.ok) {
    const data = await res.json().catch(() => null);
    if (data && data.id) {
        // Update the item being liked with the new 'likeId' from the backend response
        item.likeId = data.id;
        // Find the song in the local list and update its 'likeId'
        const list = LikedStore.get();
        const existingSong = list.find(x => LikedStore.isSame(x, item));
        if (existingSong) {
            existingSong.likeId = item.likeId;
            LikedStore.set(list); // Re-save the list with the updated item
        }
    }
    showMessageBox(`Added to Liked Songs: ${item.title}`, 'success', 1800);
} else {
            console.warn('Failed to like song:', await res.text());
            showMessageBox('Failed to add to Liked Songs.', 'error');
        }
    } catch (e) {
        console.error('Network error in like:', e);
        showMessageBox('Network error. Could not add song.', 'error');
    }
}

async function backendUnlikeSong(item) {
    const token = localStorage.getItem('userToken');
    if (!token) {
        console.warn('Cannot unlike song: user not authenticated.');
        return;
    }
    try {
        const song = LikedStore.find(item);
        if (!song || !song.likeId) {
            console.warn('Cannot unlike song: likeId not found for item.', item);
            return;
        }
        const res = await fetch(LIKED_API.unlikeSong(song.likeId), {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!res.ok) {
            console.warn('Failed to unlike song from backend:', await res.text());
        } else {
            console.log('Song unliked successfully on backend.');
        }
    } catch (e) {
        console.error('Network error in unlike:', e);
    }
}

/**
 * Updates the state of the playbar like button (plus/tick icons).
 */
function updatePlaybarLikeState() {
    const btn = document.getElementById('mobile-add-btn') || document.querySelector('.playbar-add-btn');
    if (!btn) return;
    const song = getCurrentSongForLike();
    if (!song) {
        btn.classList.remove('liked');
        return;
    }
    const liked = LikedStore.get().some(x => LikedStore.isSame(x, song));
    btn.classList.toggle('liked', !!liked);

    const plusIcon = btn.querySelector('.icon-plus');
    const checkIcon = btn.querySelector('.icon-check');
    if (plusIcon && checkIcon) {
        plusIcon.style.display = liked ? 'none' : 'block';
        checkIcon.style.display = liked ? 'block' : 'none';
    }
}

/**
 * Updates the visual state of the heart icon in the popup.
 */
function updatePopupLikeState() {
    const heartIcon = document.getElementById('popup-heart-icon');
    if (!heartIcon) return;
    
    const song = getCurrentSongForLike();
    if (!song) {
        heartIcon.style.fill = 'white'; // Default color
        return;
    }

    const liked = LikedStore.get().some(x => LikedStore.isSame(x, song));
    if (liked) {
        heartIcon.style.fill = '#E3342F'; // Red fill
    } else {
        heartIcon.style.fill = 'white'; // Unfilled color
    }
}

// NEW: Function to open the song options popup
// --- START: REPLACEMENT for openSongOptionsPopup function ---
// --- START: REPLACEMENT for openSongOptionsPopup function ---

function openSongOptionsPopup(song) {
    const popupBackdrop = document.getElementById('song-options-popup');
    const popupPanel = document.querySelector('.song-options-panel');
    const popupSongCover = document.getElementById('popup-song-cover');
    const popupSongTitle = document.getElementById('popup-song-title');
    const popupSongArtist = document.getElementById('popup-song-artist');
    
    if (!popupBackdrop || !popupPanel) {
        console.error("Could not find the song options popup panel.");
        return;
    }

    // Store the entire song object as a stringified JSON on the panel.
    // This is the most important step.
    popupPanel.dataset.song = JSON.stringify(song);

    // Populate the popup's UI with song details
    if (popupSongCover) popupSongCover.src = song.img || song.coverArt || '';
    if (popupSongTitle) popupSongTitle.textContent = song.title;
    if (popupSongArtist) popupSongArtist.textContent = song.artist;
    
    // Show the popup
    popupBackdrop.style.display = 'flex';
    setTimeout(() => popupBackdrop.classList.add('active'), 10);
}

// --- END: REPLACEMENT for openSongOptionsPopup function ---
// --- END: REPLACEMENT for openSongOptionsPopup function ---

// NEW: Function to close the song options popup
function closeSongOptionsPopup() {
    const popupBackdrop = document.getElementById('song-options-popup');
    if (!popupBackdrop) return;
    
    popupBackdrop.classList.remove('active');
    setTimeout(() => {
        popupBackdrop.style.display = 'none';
    }, 300); // Wait for the transition to finish
}




// in script.js
function renderLikedSongsOverlay() {
    const listEl = document.getElementById('likedSongsList');
    const countEl = document.getElementById('likedSongsCount');
    if (!listEl) return;

    const list = LikedStore.get();
    listEl.innerHTML = '';

    if (list.length === 0) {
        listEl.innerHTML = '<p style="text-align: center; color: #b3b3b3; padding: 20px;">You haven\'t liked any songs yet.</p>';
    } else {
        list.forEach((s, i) => {
            const row = document.createElement('div');
            row.className = 'swarify-liked-row';
            row.setAttribute('data-album-id', s.albumId);
            row.setAttribute('data-track-index', s.trackIndex);
            if (s.likeId) row.setAttribute('data-like-id', s.likeId);
            row.style.cssText = 'display:flex;align-items:center;gap:12px;padding:8px 10px;border-radius:8px;cursor:pointer;';

            // START OF FIX: Added class="song-title" and class="song-artist" to the divs below
            row.innerHTML = `
                <div style="width:24px;text-align:right;color:#aaa;font-size:0.95rem">${i + 1}</div>
                <img src="${s.img || s.coverArt || ''}" onerror="this.style.display='none'" style="width:44px;height:44px;border-radius:6px;object-fit:cover;">
                <div style="flex:1;min-width:0">
                    <div class="song-title" style="font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(s.title)}</div>
                    <div class="song-artist" style="font-size:.85rem;color:#bbb;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(s.artist)}</div>
                </div>
                <div style="font-size:.85rem;color:#aaa">${formatTimeDisplay(s.duration)}</div>
                <button class="swarify-options-btn" title="More options" style="background:none;border:0;cursor:pointer;padding:6px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#bbb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="1" />
                        <circle cx="12" cy="5" r="1" />
                        <circle cx="12" cy="19" r="1" />
                    </svg>
                </button>
            `;
            // END OF FIX

            const optionsBtn = row.querySelector('.swarify-options-btn');
            if (optionsBtn) {
                optionsBtn.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    openSongOptionsPopup(s);
                });
            }

            row.addEventListener('click', (ev) => {
                if (ev.target && ev.target.closest && ev.target.closest('.swarify-options-btn')) {
                    return;
                }
                openAlbumAndPlayLikedSong(s.albumId, Number(s.trackIndex));
            });

            listEl.appendChild(row);
        });
    }


    if (countEl) countEl.textContent = `${list.length} song${list.length === 1 ? '' : 's'}`;
    dispatchEventSafe('likedSongsRendered');
}

// Function to fetch liked songs from the backend and update the UI.
async function fetchAndRenderLikedSongs() {
    const listEl = document.getElementById('likedSongsList');
    if (!listEl) return;
    listEl.innerHTML = '<p style="text-align: center; color: #bbb;">Loading your liked songs...</p>';

    const token = localStorage.getItem('userToken');
    if (!token) {
        LikedStore.set([]);
        renderLikedSongsOverlay();
        console.warn('No authentication token found. Cannot fetch liked songs from backend.');
        listEl.innerHTML = '<p style="text-align: center; color: #bbb;">Please log in to see your liked songs.</p>';
        return;
    }

    try {
        const res = await fetch(LIKED_API.getLikes(), {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!res.ok) {
            if (res.status === 401) {
                console.error('Authentication failed. Please log in again.');
                listEl.innerHTML = '<p style="text-align: center; color: #bbb;">Please log in to see your liked songs.</p>';
            } else {
                throw new Error('Failed to fetch liked songs from backend.');
            }
            return;
        }

      const likedSongs = await res.json();
// Ensure each song object contains the unique 'id' from the backend, and store it as 'likeId'
const updatedSongs = likedSongs.map(song => ({ ...song, likeId: song.id || song._id }));
LikedStore.set(updatedSongs);
    


        renderLikedSongsOverlay();

    } catch (e) {
        console.error('Error fetching liked songs from backend:', e);
        renderLikedSongsOverlay();
        listEl.innerHTML = '<p style="text-align: center; color: #bbb;">Could not load liked songs. Please try again.</p>';
    }
}

// Function to handle the toggle of a like
function toggleLikeCurrentSong() {
    if (!isLoggedIn()) {
        window.location.href = '/login.html';
        return;
    }
    const song = getCurrentSongForLike();
    if (!song) {
        showMessageBox('Nothing playing to like right now.', 'error');
        return;
    }

    const exists = LikedStore.find(song);
    if (exists) {
        const likedSong = LikedStore.get().find(x => LikedStore.isSame(x, song));
        if (likedSong && likedSong.likeId) {
            backendUnlikeSong(likedSong);
        }
        
        LikedStore.remove(song);
        
        dispatchEventSafe('songUnliked');
        showMessageBox(`Removed from Liked Songs: ${song.title}`, 'success', 1800);
    } else {
        LikedStore.add(song);
        backendLikeSong(song);
        dispatchEventSafe('songLiked');
        showMessageBox(`Added to Liked Songs: ${song.title}`, 'success', 1800);
    }
    // Update the UI after the local state has been changed.
    updatePlaybarLikeState();
    updatePopupLikeState();
    renderLikedSongsOverlay();
}

// A new function to properly initialize the UI state on page load.
function initializeUIState() {
    // We fetch the liked songs first, and after that's done, we update the UI.
    fetchAndRenderLikedSongs().then(() => {
        // Once the liked songs are loaded, check the current song and update the UI.
        updatePlaybarLikeState();
        updatePopupLikeState();
    });
}

// Listen for custom events to keep the UI in sync
document.addEventListener('trackChanged', () => {
    // When the track changes, update the UI state.
    updatePlaybarLikeState();
    updatePopupLikeState();
});
document.addEventListener('songLiked', updatePlaybarLikeState);
document.addEventListener('songUnliked', updatePlaybarLikeState);




// --- Core Functions for "Add to Playlist" Overlay ---
// By defining these in the global scope (outside of any event listener),
// they are guaranteed to be available when needed.

window.openAddToPlaylistOverlay = async (song) => {
    const addToPlaylistOverlay = document.getElementById('add-to-playlist-overlay');
    if (!addToPlaylistOverlay || !song) return;

    addToPlaylistOverlay.dataset.song = JSON.stringify(song);
    await fetchUserPlaylists(); // Assumes fetchUserPlaylists is globally available
    
    // Find the container and render the list inside this function
    const playlistSelectionContainer = document.getElementById('playlist-selection-container');
    if (!playlistSelectionContainer) return;
    playlistSelectionContainer.innerHTML = ''; // Clear previous items

    if (!currentUserPlaylists || currentUserPlaylists.length === 0) {
        playlistSelectionContainer.innerHTML = '<p class="text-center text-gray-400 py-4">You have no playlists yet.</p>';
    } else {
        currentUserPlaylists.forEach(playlist => {
            const item = document.createElement('div');
            item.className = 'flex items-center gap-4 p-2 rounded-lg';
            const isAlreadyInPlaylist = playlist.songs && playlist.songs.some(s => s.albumId === song.albumId && String(s.trackIndex) === String(song.trackIndex));
            const coverArt = (playlist.coverArt && playlist.coverArt !== 'undefined') ? playlist.coverArt : 'https://placehold.co/64x64/333/fff?text=♫';
            item.innerHTML = `
                <img src="${coverArt}" alt="${escapeHtml(playlist.name)}" class="w-16 h-16 rounded-md object-cover">
                <div class="flex-grow min-w-0">
                    <p class="text-white font-semibold truncate">${escapeHtml(playlist.name)}</p>
                    <p class="text-gray-400 text-sm">${playlist.songs ? playlist.songs.length : 0} song${(playlist.songs && playlist.songs.length === 1) ? '' : 's'}</p>
                </div>
                <input type="checkbox" class="playlist-select-checkbox" data-playlist-id="${playlist._id}" ${isAlreadyInPlaylist ? 'checked' : ''}>
            `;
            playlistSelectionContainer.appendChild(item);
        });
    }
      addToPlaylistOverlay.classList.remove('hidden'); // <-- ADD THIS LINE    
    addToPlaylistOverlay.classList.add('visible');
    document.body.style.overflow = 'hidden';
};

window.closeAddToPlaylistOverlay = () => {
    const addToPlaylistOverlay = document.getElementById('add-to-playlist-overlay');
    const playlistSelectionContainer = document.getElementById('playlist-selection-container');
    const doneAddingToPlaylistBtn = document.getElementById('done-adding-to-playlist-btn');

    if (!addToPlaylistOverlay) return;
    addToPlaylistOverlay.classList.remove('visible');
    document.body.style.overflow = 'auto';
    setTimeout(() => {
        addToPlaylistOverlay.dataset.song = '';
        if (playlistSelectionContainer) playlistSelectionContainer.innerHTML = '';
        if (doneAddingToPlaylistBtn) doneAddingToPlaylistBtn.disabled = true;
    }, 300);
};


// This listener now ONLY handles attaching other listeners and injecting CSS
document.addEventListener('DOMContentLoaded', () => {
    // --- CSS Injection ---
    const addToPlaylistStyle = document.createElement('style');
    addToPlaylistStyle.innerHTML = `
        #add-to-playlist-overlay {
            display: flex; visibility: hidden; opacity: 0;
            transform: translateY(100%);
            transition: visibility 0.3s, opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
            z-index:10001;
        }
        #add-to-playlist-overlay.visible { visibility: visible; opacity: 1; transform: translateY(0); }
        .playlist-select-checkbox {
            appearance: none; -webkit-appearance: none; width: 28px; height: 28px; border: 2px solid #727272;
            border-radius: 50%; outline: none; cursor: pointer; transition: background-color 0.2s, border-color 0.2s;
            position: relative; flex-shrink: 0;
        }
        .playlist-select-checkbox:checked { background-color: #1ED760; border-color: #1ED760; }
        .playlist-select-checkbox:checked::after {
            content: '✔'; font-weight: bold; font-size: 16px; color: black; position: absolute;
            top: 50%; left: 50%; transform: translate(-50%, -51%);
        }
    `;
    document.head.appendChild(addToPlaylistStyle);

    // --- Element References ---
    const addToPlaylistOverlay = document.getElementById('add-to-playlist-overlay');
    const closeAddToPlaylistBtn = document.getElementById('close-add-to-playlist-btn');
    const newPlaylistFromAddScreenBtn = document.getElementById('new-playlist-from-add-screen');
    const playlistSelectionContainer = document.getElementById('playlist-selection-container');
    const doneAddingToPlaylistBtn = document.getElementById('done-adding-to-playlist-btn');
    const popupAddToOtherPlaylistBtn = document.getElementById('popup-add-to-other-playlist');
    const newPlaylistPopupOverlay = document.getElementById('new-playlist-popup-overlay');
    const newPlaylistNameInput = document.getElementById('new-playlist-name-input');
    
    // --- Event Listeners Setup ---
    if (popupAddToOtherPlaylistBtn) {
        popupAddToOtherPlaylistBtn.addEventListener('click', () => {
            const popupPanel = document.querySelector('.song-options-panel');
            const songDataString = popupPanel ? popupPanel.dataset.song : null;

            if (songDataString) {
                const songData = JSON.parse(songDataString);
                closeSongOptionsPopup();
                setTimeout(() => window.openAddToPlaylistOverlay(songData), 350);
            } else { 
                showMessageBox('Could not find song details to add.', 'error'); 
                closeSongOptionsPopup();
            }
        });
    }

    if (playlistSelectionContainer) {
        playlistSelectionContainer.addEventListener('change', () => {
            if (doneAddingToPlaylistBtn) {
                doneAddingToPlaylistBtn.disabled = !playlistSelectionContainer.querySelector('input:checked');
            }
        });
    }

    if (doneAddingToPlaylistBtn) {
        doneAddingToPlaylistBtn.addEventListener('click', async () => {
            const songDataString = addToPlaylistOverlay.dataset.song;
            if (!songDataString) return;
            const song = JSON.parse(songDataString);
            const checkboxes = playlistSelectionContainer.querySelectorAll('input:checked');
            if (checkboxes.length === 0) return;
            doneAddingToPlaylistBtn.disabled = true;
            doneAddingToPlaylistBtn.textContent = 'Adding...';
            const promises = Array.from(checkboxes).map(cb => addSongToPlaylist(cb.dataset.playlistId, song));
            const results = await Promise.all(promises);
            if (results.some(Boolean)) {
                showMessageBox(`Added to ${results.filter(Boolean).length} playlist(s).`, 'success');
                await fetchUserPlaylists();
            }
            doneAddingToPlaylistBtn.textContent = 'Done';
            window.closeAddToPlaylistOverlay();
        });
    }

    if (closeAddToPlaylistBtn) {
        closeAddToPlaylistBtn.addEventListener('click', window.closeAddToPlaylistOverlay);
    }
    
    if (newPlaylistFromAddScreenBtn) {
        newPlaylistFromAddScreenBtn.addEventListener('click', () => {
            const songDataString = addToPlaylistOverlay.dataset.song;
            if (songDataString) {
                localStorage.setItem('songToAddAfterCreatingPlaylist', songDataString);
                window.closeAddToPlaylistOverlay();
                setTimeout(() => {
                    if (newPlaylistPopupOverlay) {
                        newPlaylistPopupOverlay.classList.remove('hidden');
                        newPlaylistPopupOverlay.style.display = 'flex';
                        newPlaylistPopupOverlay.style.visibility = 'visible';
                        newPlaylistPopupOverlay.style.opacity = '1';
                        if (newPlaylistNameInput) {
                            setTimeout(() => newPlaylistNameInput.focus(), 50);
                        }
                    }
                }, 350);
            }
        });
    }
});

// --- END: REPLACEMENT CODE ---

// --- START: JavaScript for Liked Songs Search Functionality (Version 3) ---
document.addEventListener('DOMContentLoaded', () => {
    const likedSongsOverlay = document.getElementById('likedSongsOverlay');
    const likedContent = document.getElementById('likedContent');
    const searchInput = document.getElementById('likedSongsSearchInput');
    const noResultsMessage = document.getElementById('noResultsMessage');
    const noResultsQuery = document.getElementById('noResultsQuery');
    const closeSearchBtn = document.getElementById('closeLikedSongsSearch');
    const clearSearchBtn = document.getElementById('clearLikedSearch');
    const compactHeader = document.getElementById('likedSongsCompactHeader');
    const compactCloseBtn = document.getElementById('closeLikedSongsCompact');

    if (!likedContent || !likedSongsOverlay) return;

    // --- Main Scroll Listener ---
    // This now toggles a class that shows the compact header instead of the search bar.
    likedContent.addEventListener('scroll', () => {
        if (likedContent.scrollTop > 60) { // Threshold to switch to compact header
            likedSongsOverlay.classList.add('is-scrolled');
        } else {
            likedSongsOverlay.classList.remove('is-scrolled');
        }
    }, false);

    // --- Search Activation & Filtering ---
    // We add a listener to the document because the search trigger is inside the rendered list.
    document.body.addEventListener('focusin', (e) => {
        if (e.target && e.target.id === 'find-in-liked-songs-trigger') {
            likedSongsOverlay.classList.add('search-active');
            searchInput.focus();
        }
    });

    closeSearchBtn.addEventListener('click', () => {
        likedSongsOverlay.classList.remove('search-active');
        searchInput.value = '';
        searchInput.blur();
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    });
    
    // Attach the main close functionality to BOTH close buttons
    const closeLikedSongs = () => {
        const likedOverlay = document.getElementById('likedSongsOverlay');
        if (likedOverlay) {
            likedOverlay.classList.remove('open');
            likedOverlay.setAttribute('aria-hidden', 'true');
        }
    };
    document.getElementById('closeLikedSongs').addEventListener('click', closeLikedSongs);
    if(compactCloseBtn) compactCloseBtn.addEventListener('click', closeLikedSongs);


    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase().trim();
        const songs = document.querySelectorAll('#likedSongsList .swarify-liked-row');
        let found = false;

        songs.forEach(song => {
            const titleEl = song.querySelector('.song-title');
            const artistEl = song.querySelector('.song-artist');
            const title = titleEl ? titleEl.textContent.toLowerCase() : '';
            const artist = artistEl ? artistEl.textContent.toLowerCase() : '';

            if (title.includes(query) || artist.includes(query)) {
                song.style.display = 'flex';
                found = true;
            } else {
                song.style.display = 'none';
            }
        });

        clearSearchBtn.style.display = (query.length > 0) ? 'block' : 'none';

        if (!found && query.length > 0) {
            noResultsMessage.style.display = 'block';
            noResultsQuery.textContent = `No results found for "${searchInput.value}"`;
        } else {
            noResultsMessage.style.display = 'none';
        }
    });

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchInput.focus();
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const likedSongsPlayBtn = document.getElementById('liked-songs-play-btn');
    if (likedSongsPlayBtn) {
        likedSongsPlayBtn.addEventListener('click', () => {
            handleLikedSongsPlayButtonClick();
        });
    }

    // Also, ensure the highlight and icon update when playback is toggled globally.
    document.addEventListener('trackChanged', () => {
        highlightPlayingLikedSong();
        updateLikedSongsPlayButtonIcon();
    });

    // It is crucial to update the liked songs UI state whenever any track ends
    // or playback is toggled.
    const audioPlayer = document.getElementById('audio-player');
    if(audioPlayer) {
        audioPlayer.addEventListener('play', () => {
             highlightPlayingLikedSong();
             updateLikedSongsPlayButtonIcon();
        });
        audioPlayer.addEventListener('pause', () => {
             highlightPlayingLikedSong();
             updateLikedSongsPlayButtonIcon();
        });
        audioPlayer.addEventListener('ended', () => {
            isPlayingFromLikedSongs = false; // Reset context when a song ends
            highlightPlayingLikedSong();
            updateLikedSongsPlayButtonIcon();
        });
    }


});

// --- Update renderLikedSongsOverlay to include the search trigger ---
// Replace your existing 'renderLikedSongsOverlay' function with this one.
// --- Update renderLikedSongsOverlay to include the search trigger ---
// Replace your existing 'renderLikedSongsOverlay' function with this one.
function renderLikedSongsOverlay() {
    const listEl = document.getElementById('likedSongsList');
    const countEl = document.getElementById('likedSongsCount');
    if (!listEl) return;

    // --- FIX START ---
    // Find and remove any existing search trigger to prevent duplicates.
    // The search trigger is a sibling of the list, within the same parent.
    const parentContainer = listEl.parentElement;
    if (parentContainer) {
        const existingSearchTrigger = parentContainer.querySelector('.search-trigger-container');
        if (existingSearchTrigger) {
            existingSearchTrigger.remove();
        }
    }
    // --- FIX END ---

    const list = LikedStore.get();
    listEl.innerHTML = ''; // Clear previous song content

    // Add the "Find in Liked Songs" input trigger at the top of the list
    const searchTriggerHTML = `
        <div class="search-trigger-container">
            <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path></svg>
            <input type="text" id="find-in-liked-songs-trigger" readonly placeholder="Find in Liked Songs">
        </div>
    `;
    listEl.insertAdjacentHTML('beforebegin', searchTriggerHTML);

    if (list.length === 0) {
        listEl.innerHTML = '<p style="text-align: center; color: #b3b3b3; padding: 20px;">You haven\'t liked any songs yet.</p>';
    } else {
        list.forEach((s, i) => {
            const row = document.createElement('div');
            row.className = 'swarify-liked-row';
            row.setAttribute('data-album-id', s.albumId);
            row.setAttribute('data-track-index', s.trackIndex);
            if (s.likeId) row.setAttribute('data-like-id', s.likeId);
            row.style.cssText = 'display:flex;align-items:center;gap:12px;padding:8px 10px;border-radius:8px;cursor:pointer;';

            row.innerHTML = `
                <div style="width:24px;text-align:right;color:#aaa;font-size:0.95rem">${i + 1}</div>
                <img src="${s.img || s.coverArt || ''}" onerror="this.style.display='none'" style="width:44px;height:44px;border-radius:6px;object-fit:cover;">
                <div style="flex:1;min-width:0">
                    <div class="song-title" style="font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(s.title)}</div>
                    <div class="song-artist" style="font-size:.85rem;color:#bbb;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(s.artist)}</div>
                </div>
                <div style="font-size:.85rem;color:#aaa">${formatTimeDisplay(s.duration)}</div>
                <button class="swarify-options-btn" title="More options" style="background:none;border:0;cursor:pointer;padding:6px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#bbb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" />
                    </svg>
                </button>
            `;
            const optionsBtn = row.querySelector('.swarify-options-btn');
            if (optionsBtn) {
                optionsBtn.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    openSongOptionsPopup(s);
                });
            }
            row.addEventListener('click', (ev) => {
                if (ev.target && ev.target.closest && ev.target.closest('.swarify-options-btn')) { return; }
                openAlbumAndPlayLikedSong(s.albumId, Number(s.trackIndex));
            });
            listEl.appendChild(row);
        });
    }

    if (countEl) countEl.textContent = `${list.length} song${list.length === 1 ? '' : 's'}`;
    dispatchEventSafe('likedSongsRendered');
}
// --- END: JavaScript for Liked Songs Search Functionality (Version 3) ---
/**
 * Opens the album details for a liked song and plays the specific track.
 * This function ensures that when a user clicks a song in the "Liked Songs" list,
 * the player starts playing that track immediately.
 * @param {string} albumId - The ID of the album containing the liked song.
 * @param {number} trackIndex - The index of the liked song within its album's tracklist.
 */
function openAlbumAndPlayLikedSong(albumId, trackIndex) {


    isPlayingFromLikedSongs = true;
    // Find the full album details from the globally stored `allAlbumsData` array.
    const album = allAlbumsData.find(a => a.id === albumId);

    if (album) {
        // Find the specific track within the album's tracklist.
        const track = album.tracks[trackIndex];
        if (track) {
            // Set the current album context to the album of the played track.
            // This is important for next/previous track functionality to work correctly.
            currentAlbum = album;
            
            // Call the main playTrack function to start playback.
            // This function handles all the logic for showing the playbar, updating UI, etc.
            playTrack(track, trackIndex);
        } else {
            console.error(`Track with index ${trackIndex} not found in album ${albumId}`);
            showMessageBox('Could not find the selected track.', 'error');
        }
    } else {
        console.error(`Album with ID ${albumId} not found.`);
        showMessageBox('Could not find the album for this song.', 'error');
    }
}

/**
 * Highlights the currently playing song within the "Liked Songs" overlay.
 * It iterates through the list, resets any previous highlighting, and applies a 'playing'
 * style to the title of the song that is currently active.
 */
function highlightPlayingLikedSong() {
    const likedSongsList = document.getElementById('likedSongsList');
    if (!likedSongsList) return;

    const rows = likedSongsList.querySelectorAll('.swarify-liked-row');
    let playingAlbumId = null;
    let playingTrackIndex = -1;

    // Determine which song is currently playing from global state variables.
    if (playingAlbum && typeof currentTrackIndex !== 'undefined') {
        playingAlbumId = playingAlbum.id;
        playingTrackIndex = currentTrackIndex;
    }

    // Loop through each song row in the liked songs list.
    rows.forEach(row => {
        const rowAlbumId = row.dataset.albumId;
        const rowTrackIndex = parseInt(row.dataset.trackIndex, 10);
        const titleEl = row.querySelector('.song-title');

        if (titleEl) {
            // Reset styles for all rows first.
            row.classList.remove('playing');
            titleEl.style.color = ''; // Revert to default text color.
        }

        // If the row matches the currently playing song, apply the highlight.
        if (rowAlbumId === playingAlbumId && rowTrackIndex === playingTrackIndex) {
             if (titleEl) {
                row.classList.add('playing');
                titleEl.style.color = '#1ED760'; // Apply Spotify green color to the title.
             }
        }
    });
}


// NEW: Global variable to track if playback started from the Liked Songs playlist
let isPlayingFromLikedSongs = false;

/**
 * Updates the icon of the main play button in the "Liked Songs" overlay.
 * Toggles between a play and pause icon based on the current playback state.
 */
function updateLikedSongsPlayButtonIcon() {
    const btn = document.getElementById('liked-songs-play-btn');
    if (!btn) return;
    const playIcon = btn.querySelector('.play-icon');
    const pauseIcon = btn.querySelector('.pause-icon');

    // Check if any audio is currently playing.
    const isAnySongPlaying = (ytPlayer && ytPlayer.getPlayerState && ytPlayer.getPlayerState() === YT.PlayerState.PLAYING) || (audio && !audio.paused);

    // Show pause icon only if a song is playing AND it was started from the liked songs list.
    if (isAnySongPlaying && isPlayingFromLikedSongs) {
        playIcon.classList.add('hidden');
        pauseIcon.classList.remove('hidden');
    } else {
        playIcon.classList.remove('hidden');
        pauseIcon.classList.add('hidden');
    }
}

/**
 * Handles clicks on the main green play button in the Liked Songs overlay.
 * It will either play the first liked song or toggle the play/pause state.
 */
function handleLikedSongsPlayButtonClick() {
    const likedSongs = LikedStore.get();
    if (likedSongs.length === 0) {
        showMessageBox("You have no liked songs to play.", "info");
        return;
    }

    const isAnySongPlaying = (ytPlayer && ytPlayer.getPlayerState && ytPlayer.getPlayerState() === YT.PlayerState.PLAYING) || (audio && !audio.paused);

    // If the currently playing context is the liked songs list, just toggle play/pause.
    if (isPlayingFromLikedSongs) {
        togglePlayback();
    } else {
        // If a different song is playing, or nothing is playing, start the liked songs list from the top.
        const firstSongInfo = likedSongs[0];
        // This function will set the context and start playback.
        openAlbumAndPlayLikedSong(firstSongInfo.albumId, firstSongInfo.trackIndex);
    }
}

// --- REPLACEMENT for handlePlaylistScroll and its setup function ---
// --- REPLACEMENT for handlePlaylistScroll and its setup function ---
function setupPlaylistScrollListener() {
    // Target the new scrollable container
    const scrollContent = document.getElementById('playlist-scroll-content');
    if (!scrollContent) return;
    
    // Always remove the old listener before adding a new one
    scrollContent.removeEventListener('scroll', handlePlaylistScroll);
    scrollContent.addEventListener('scroll', handlePlaylistScroll);
}

function handlePlaylistScroll() {
    const overlay = document.getElementById('playlist-details-overlay');
    const scrollContent = document.getElementById('playlist-scroll-content');
    const mainHeader = document.getElementById('playlist-header-content');
    if (!overlay || !mainHeader || !scrollContent) return;

    // The threshold is when the main header is about to scroll out of view
    const scrollThreshold = mainHeader.offsetHeight - -20; // 80px is a buffer

    if (scrollContent.scrollTop > scrollThreshold) {
        overlay.classList.add('is-scrolled');
    } else {
        overlay.classList.remove('is-scrolled');
    }
}




// --- END: NEW FUNCTION for Playlist Scrolling Header ---
// --- START: NEW FUNCTIONS for Playlist Search ---

function setupPlaylistSearchListeners() {
    const searchTrigger = document.getElementById('playlist-search-trigger');
    const searchView = document.getElementById('playlist-search-view');
    const searchBackBtn = document.getElementById('playlist-search-back-btn');
    const searchInput = document.getElementById('playlist-search-input');
    const clearSearchBtn = document.getElementById('playlist-clear-search-btn');

    if (!searchTrigger || !searchView || !searchBackBtn || !searchInput || !clearSearchBtn) return;

    searchTrigger.addEventListener('click', () => {
        searchView.classList.remove('hidden');
        searchView.classList.add('flex'); // Use flex to show it
        renderFullPlaylistForSearch(); // Show all songs initially
        setTimeout(() => searchInput.focus(), 50);
    });

    searchBackBtn.addEventListener('click', () => {
        searchView.classList.remove('flex');
        searchView.classList.add('hidden');
        searchInput.value = '';
    });

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchInput.focus();
        filterPlaylistSongs();
    });

    searchInput.addEventListener('input', () => {
        filterPlaylistSongs();
        clearSearchBtn.classList.toggle('hidden', searchInput.value.length === 0);
    });
}

function renderFullPlaylistForSearch() {
    const resultsContainer = document.getElementById('playlist-search-results');
    resultsContainer.innerHTML = '';
    
    if (currentPlaylistForView && currentPlaylistForView.songs) {
        currentPlaylistForView.songs.forEach(song => {
            resultsContainer.appendChild(createPlaylistSongRow(song, currentPlaylistForView._id));
        });
    }
}

function filterPlaylistSongs() {
    const query = document.getElementById('playlist-search-input').value.toLowerCase().trim();
    const resultsContainer = document.getElementById('playlist-search-results');
    const noResultsView = document.getElementById('playlist-no-search-results');
    const noResultsQuerySpan = document.getElementById('no-results-query');
    
    resultsContainer.innerHTML = '';
    let found = false;

    if (currentPlaylistForView && currentPlaylistForView.songs) {
        currentPlaylistForView.songs.forEach(song => {
            const title = (song.title || '').toLowerCase();
            const artist = (song.artist || '').toLowerCase();

            if (title.includes(query) || artist.includes(query)) {
                resultsContainer.appendChild(createPlaylistSongRow(song, currentPlaylistForView._id));
                found = true;
            }
        });
    }

    if (!found && query) {
        resultsContainer.classList.add('hidden');
        noResultsView.classList.remove('hidden');
        noResultsQuerySpan.textContent = query;
    } else {
        resultsContainer.classList.remove('hidden');
        noResultsView.classList.add('hidden');
    }
}
// --- END: NEW FUNCTIONS for Playlist Search ---
// --- START: NEW HELPER FUNCTION for Creating Song Rows ---
function createPlaylistSongRow(song, playlistId) {
    const songRow = document.createElement('div');
    songRow.className = 'playlist-song-row';

    songRow.innerHTML = `
        <img src="${song.img || song.coverArt || 'https://placehold.co/44x44/333/fff?text=S'}" alt="${escapeHtml(song.title)} cover" class="w-11 h-11 rounded-md object-cover flex-shrink-0">
        <div class="song-details">
            <div class="song-title">${escapeHtml(song.title)}</div>
            <div class="song-artist">${escapeHtml(song.artist)}</div>
        </div>
        <button class="playlist-song-options-btn" aria-label="More options for ${escapeHtml(song.title)}">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="12" cy="19" r="2"/></svg>
        </button>
    `;

    // Click on the row plays the song
    songRow.addEventListener('click', (e) => {
        // Prevent playing if the options button was the click target
        if (e.target.closest('.playlist-song-options-btn')) return;
        
        const album = allAlbumsData.find(a => a.id === song.albumId);
        if (album) {
            openAlbumDetails(album);
            playTrack(album.tracks[song.trackIndex], song.trackIndex);
        } else {
            showMessageBox('Could not load the album for this song.', 'error');
        }
    });

    // Click on the options button opens the popup
    const optionsBtn = songRow.querySelector('.playlist-song-options-btn');
    optionsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openPlaylistSongOptionsPopup(song, playlistId);
    });

    return songRow;
}
// --- END: NEW HELPER FUNCTION ---
// --- START: NEW FUNCTION to Open Song Options for Playlist Songs ---
function openPlaylistSongOptionsPopup(song, playlistId) {
    // This reuses your existing song options popup
    const popupBackdrop = document.getElementById('song-options-popup');
    const popupPanel = document.querySelector('.song-options-panel');
    const popupSongCover = document.getElementById('popup-song-cover');
    const popupSongTitle = document.getElementById('popup-song-title');
    const popupSongArtist = document.getElementById('popup-song-artist');
    
    const removeFromPlaylistBtn = document.getElementById('popup-remove-from-liked');
    const goToAlbumBtn = document.getElementById('popup-go-to-album');

    if (!popupBackdrop || !removeFromPlaylistBtn || !goToAlbumBtn) return;

    // 1. Populate UI
    popupSongCover.src = song.img || song.coverArt || '';
    popupSongTitle.textContent = song.title;
    popupSongArtist.textContent = song.artist;

    // 2. Configure the "Remove" button
    removeFromPlaylistBtn.querySelector('span').textContent = 'Remove from this playlist';
    
    // Use a one-time event listener for the remove action
    const removeHandler = async () => {
        await removeSongFromPlaylist(playlistId, song);
        closeSongOptionsPopup();
    };
    removeFromPlaylistBtn.replaceWith(removeFromPlaylistBtn.cloneNode(true)); // Clones the button to remove old listeners
    document.getElementById('popup-remove-from-liked').addEventListener('click', removeHandler, { once: true });


    // 3. Configure the "Go to album" button
    const albumHandler = () => {
        const album = allAlbumsData.find(a => a.id === song.albumId);
        if (album) {
            closeSongOptionsPopup();
            // We might need a small delay to prevent click-through issues
            setTimeout(() => {
                openAlbumDetails(album);
            }, 50);
        }
    };
    goToAlbumBtn.replaceWith(goToAlbumBtn.cloneNode(true));
    document.getElementById('popup-go-to-album').addEventListener('click', albumHandler, { once: true });


    // 4. Show the popup
    popupBackdrop.style.display = 'flex';
    setTimeout(() => popupBackdrop.classList.add('active'), 10);
}
// --- END: NEW FUNCTION ---
// --- START: NEW FUNCTION to Remove Song from a Playlist ---
async function removeSongFromPlaylist(playlistId, songToRemove) {
    const token = localStorage.getItem('userToken');
    if (!token) {
        showMessageBox("You must be logged in to modify playlists.", 'error');
        return;
    }

    // You need to create this endpoint on your backend.
    // It should accept a DELETE request to /api/playlists/:playlistId/songs
    // with the song details in the body.
    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/playlists/${playlistId}/songs`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                albumId: songToRemove.albumId,
                trackIndex: songToRemove.trackIndex
            })
        });

        const data = await response.json();

        if (response.ok) {
            showMessageBox(`Removed "${songToRemove.title}" from the playlist.`, 'success');
            
            // Update local state and re-render
            const playlist = currentUserPlaylists.find(p => p._id === playlistId);
            if (playlist) {
                playlist.songs = playlist.songs.filter(s => 
                    !(s.albumId === songToRemove.albumId && s.trackIndex === songToRemove.trackIndex)
                );
            }
            // If the currently viewed playlist is the one we modified, re-render its songs
            if (currentPlaylistForView && currentPlaylistForView._id === playlistId) {
                renderPlaylistSongs(playlist);
            }
            
        } else {
            showMessageBox(data.message || "Failed to remove song.", 'error');
        }
    } catch (error) {
        console.error("Error removing song from playlist:", error);
        showMessageBox("A network error occurred.", 'error');
    }
}
// --- END: NEW FUNCTION ---
// --- START: NEW FUNCTION to close the playlist details ---
function closePlaylistDetailsOverlay() {
    const overlay = document.getElementById('playlist-details-overlay');
    if (!overlay) return;

    overlay.classList.remove('active');
    // Add hidden class after transition to ensure it's removed from the accessibility tree
    setTimeout(() => {
        overlay.classList.add('hidden');
    }, 300); // Should match your CSS transition duration

    document.body.style.overflow = 'auto'; // Restore scrolling on the body
}
// --- END: NEW FUNCTION ---
/**
 * Updates the play/pause icon for all playlist play buttons
 * to reflect the current playback state.
 */
/**
 * Updates the play/pause icon for all playlist play buttons
 * to reflect the current playback state.
 * 
 * 
 */

function updatePlaylistPlayButton(isPlaying) {
    const playlistPlayBtn = document.getElementById('playlist-play-btn');
    if (!playlistPlayBtn) return;

    if (isPlaying) {
        // Change the icon to a pause icon
        playlistPlayBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
        `;
    } else {
        // Change the icon back to a play icon
        playlistPlayBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
        `;
    }
}

function updatePlaylistPlayButtons() {
    // Get all play buttons on the page that belong to a playlist/card
    const allPlayButtons = document.querySelectorAll('.card-play-button');

    // Get the main playlist play button if it exists
    const playlistPlayBtn = document.getElementById('playlist-play-btn');

    // Check the current playback state from the main player
    const isPlaying = !audio.paused || (ytPlayer && ytPlayer.getPlayerState() === YT.PlayerState.PLAYING);
    
    // Iterate over all buttons and update their icons
    allPlayButtons.forEach(button => {
        const playIcon = button.querySelector('.play-icon');
        const pauseIcon = button.querySelector('.pause-icon');
        
        // Add a check to ensure the icons exist before trying to modify them
        if (playIcon && pauseIcon) {
            if (isPlaying) {
                playIcon.classList.add('hidden');
                pauseIcon.classList.remove('hidden');
            } else {
                playIcon.classList.remove('hidden');
                pauseIcon.classList.add('hidden');
            }
        }
    });

    // Handle the specific playlist play button in the overlay
    if (playlistPlayBtn) {
        const playIcon = playlistPlayBtn.querySelector('.play-icon');
        const pauseIcon = playlistPlayBtn.querySelector('.pause-icon');
        // Add a check to ensure the icons exist before trying to modify them
        if (playIcon && pauseIcon) {
            if (isPlaying) {
                playIcon.classList.add('hidden');
                pauseIcon.classList.remove('hidden');
            } else {
                playIcon.classList.remove('hidden');
                pauseIcon.classList.add('hidden');
            }
        }
    }

    updatePlaylistPlayButton(isPlaying);
}

