
// Check if the browser supports service workers
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      // Registration was successful
      console.log('ServiceWorker registration successful with scope: ', registration.scope);

      // Request notification permission and subscribe to push notifications
      if ('Notification' in window) {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            console.log('Notification permission granted.');
            subscribeToPush(registration);
          } else {
            console.log('Notification permission denied.');
          }
        });
      }

      // Register for background synchronization
      if ('SyncManager' in window) {
        registration.sync.register('send-data-to-backend').then(() => {
          console.log('Background sync registered.');
        });
      }

    }, (err) => {
      // registration failed :(
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}

function subscribeToPush(registration) {
  registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array('BEmFm0Q_c9_C-o-9Q-9-G-C-N-K-I-9') // Replace with your actual VAPID public key
  }).then((subscription) => {
    console.log('Push subscription successful:', subscription.endpoint);
    // TODO: Send subscription to your backend server
  }).catch((error) => {
    console.error('Push subscription failed:', error);
  });
}

// Utility function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
// Inject fade-in CSS for similar albums
(function() {
    const style = document.createElement('style');
    style.innerHTML = `
    .fade-in { animation: fadeIn 0.6s ease-in; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    `;
    document.head.appendChild(style);
})();

// Inject fade-in CSS for similar albums
(function() {
    const style = document.createElement('style');
    style.innerHTML = `
    .fade-in { animation: fadeIn 0.6s ease-in; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    `;
    document.head.appendChild(style);
})();


// ADD THIS at the top of your script
const imageCache = new Set();


function preloadImage(url) {
    if (!url || imageCache.has(url)) {
        return; // Don't preload if URL is invalid or already cached
    }
    const img = new Image();
    img.src = url;
    imageCache.add(url);
}
// MODIFY the attachEventListenersToHtmlCards function
function attachEventListenersToHtmlCards() {
    console.log("Attaching event listeners to existing HTML cards.");
    const albumCards = document.querySelectorAll('.card'); 
    albumCards.forEach(card => {
        card.removeEventListener('click', handleCardClick);
        card.addEventListener('click', handleCardClick);

        // --- ADD THIS MOUSEOVER LISTENER ---
        card.addEventListener('mouseover', () => {
            const albumId = card.dataset.albumId;
            const albumData = allAlbumsData.find(a => a.id === albumId);
            if (albumData && albumData.coverArt) {
                preloadImage(albumData.coverArt);
            }
        });
        // --- END OF ADDITION ---
    });

    const playButtons = document.querySelectorAll('.card-play-button');
    playButtons.forEach(button => {
        button.removeEventListener('click', handlePlayButtonClick);
        button.addEventListener('click', handlePlayButtonClick);
    });
}

const offlineMessageEl = document.getElementById('offline-message');
const offlineMessageTextEl = offlineMessageEl ? offlineMessageEl.querySelector('p') : null;

window.addEventListener('offline', () => {
    if (offlineMessageEl && offlineMessageTextEl) {
        offlineMessageTextEl.textContent = "You're offline";
        offlineMessageEl.classList.add('visible');
    }
});

window.addEventListener('online', async () => {
    if (offlineMessageEl && offlineMessageTextEl) {
        offlineMessageTextEl.textContent = "You're back online";
        offlineMessageEl.classList.add('visible');
        setTimeout(() => {
            offlineMessageEl.classList.remove('visible');
        }, 2000);
    }
    await fetchAlbums();
});
// --- Configuration ---
// IMPORTANT: Replace this with your actual ngrok static domain if you are using ngrok for your backend.
// If your backend is hosted directly (e.g., on Render, Heroku), use that URL.
const BACKEND_BASE_URL = 'https://music-site-backend.onrender.com'; // Example: 'https://your-ngrok-subdomain.ngrok-free.app' or 'https://your-backend-api.com'

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
     background: transparent;
       
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
           top: 234px;
        left: 31px;
        width: 33px;
        height: calc(98% - 218px);
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
        right: 70px;
        width: 32px;
        height: calc(100% - 210px);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 34px;
        z-index: 1002; /* Ensure it's above the interaction layer */
        pointer-events: auto;
        overflow-y: auto;
background: transparent;
      
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
     top: 233px; /* Position below the top info mask */
        right: 53px;
        width: 33px;
        height: calc(97% - 210px);
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


let iframeCache = {};
let processedCarouselSongs = []; // <<< ADD THIS LINE
let currentPlaylistForView = null;
let songForPlaylistAddition = null;
// --- DOM Elements (assuming these exist in your HTML) ---
const trendingSongsContainer = document.querySelector('.trending-songs-container'); // Adjust selector as needed
const popularAlbumsContainer = document.querySelector('.popular-albums-container'); // Adjust selector as needed
const popularArtistsContainer = document.querySelector('.popular-artists-container'); // Adjust selector as needed
const errorMessageDisplay = document.getElementById('error-message-display'); // An element to show errors

// NEW: Reference for the "Explore More Albums" container
const exploreMoreAlbumsCardsContainer = document.getElementById('explore-more-albums-cards');


// --- Global Variables ---
let isInitialPageLoad = true;

let currentAlbum = null; // Stores the currently loaded album data (for the overlay)
let currentTrackIndex = 0; // Index of the currently playing track within currentAlbum.tracks
let isRepeat = false; // Flag for repeat mode
let isShuffle = false; // Flag for shuffle mode
let allAlbumsData = []; // This will store albums fetched from the backend for search lookups and card details



const PLAYER_STATE_KEY = 'swarify_player_state'; // KEY FOR STORING PLAYER STATE





/**
 * Converts an RGB color value to HSL. This helps us find colors
 * that are vibrant and have good brightness.
 * @param {number} r - Red value (0-255)
 * @param {number} g - Green value (0-255)
 * @param {number} b - Blue value (0-255)
 * @returns {Array} HSL values [hue, saturation, lightness]
 */
function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h * 360, s, l];
}

/**
 * Analyzes a color palette and picks the best color for text.
 * It prefers colors that are saturated (vibrant) and not too dark.
 * @param {Array} palette - An array of RGB color arrays from ColorThief.
 * @returns {Array|null} The best RGB color array, or null if none are suitable.
 */
function getBestPaletteColor(palette) {
    let bestColor = null;
    let highestScore = -1;

    for (const rgb of palette) {
        const hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);
        const saturation = hsl[1];
        const lightness = hsl[2];

        // We want to avoid very dark, very light, or grayscale colors for the text itself.
        if (lightness < 0.35 || lightness > 0.9 || saturation < 0.3) {
            continue; // Skip this color if it's not suitable
        }

        // We score colors based on a mix of saturation and ideal lightness.
        // This helps pick a color that is both vibrant and readable.
        const score = saturation + (1 - Math.abs(lightness - 0.7));

        if (score > highestScore) {
            highestScore = score;
            bestColor = rgb;
        }
    }
    // If no suitable vibrant color is found, we fall back to the first color in the palette.
    return bestColor || palette[0];
}

function initializeCarouselData() {
    if (!allAlbumsData || allAlbumsData.length === 0) {
        console.error("Cannot initialize carousel data: allAlbumsData is not ready.");
        // Use the original data as a fallback to prevent a total crash
        processedCarouselSongs = carouselSongs.map(song => ({ ...song, trackIndex: 0 }));
        return;
    }

    processedCarouselSongs = carouselSongs.map(carouselSong => {
        const album = allAlbumsData.find(a => a.id === carouselSong.albumId);
        let trackIndex = 0; // Default to the first track as a fallback

        if (album && album.tracks && album.tracks.length > 0) {
            // Find the precise index by matching the title
            const foundIndex = album.tracks.findIndex(t => t.title.toLowerCase() === carouselSong.title.toLowerCase());
            if (foundIndex !== -1) {
                trackIndex = foundIndex;
            }
        }
        // Return a new object containing all original info PLUS the precise trackIndex
        return { ...carouselSong, trackIndex: trackIndex };
    });
    console.log("Carousel data has been processed with precise track indices.");
}

/**
 * Adjusts an RGB color to be darker.
 * @param {number[]} rgb - An array of [r, g, b] values from ColorThief.
 * @param {number} factor - A value between 0 and 1 to darken the color (e.g., 0.5 for 50% darker).
 * @returns {number[]} The adjusted [r, g, b] array.
 */
function adjustColor(rgb, factor = 0.5) {
    const darkFactor = Math.max(0, Math.min(1, factor));

    const newR = Math.floor(rgb[0] * darkFactor);
    const newG = Math.floor(rgb[1] * darkFactor);
    const newB = Math.floor(rgb[2] * darkFactor);

    return [newR, newG, newB];
}

// START: Add these three new functions to your script.js file

/**
 * Converts an RGB color value to HSL.
 * @param {number} r - The red color value
 * @param {number} g - The green color value
 * @param {number} b - The blue color value
 * @returns {number[]} The HSL representation
 */
function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h, s, l];
}

/**
 * Converts an HSL color value to RGB.
 * @param {number} h - The hue
 * @param {number} s - The saturation
 * @param {number} l - The lightness
 * @returns {number[]} The RGB representation
 */
function hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/**
 * Creates a BOLD and VIBRANT background color from a source color.
 * This updated function increases saturation and lightness for a more dominant look.
 * @param {number[]} rgb - The input [r, g, b] array from ColorThief.
 * @returns {number[]} The final, adjusted [r, g, b] array.
 */
function createVibrantBackgroundColor(rgb) {
    // 1. Convert the dominant RGB color to HSL
    let [h, s, l] = rgbToHsl(rgb[0], rgb[1], rgb[2]);

    // 2. Intelligently adjust Saturation and Lightness
    // Clamp saturation to a tasteful maximum of 50%
    s = Math.min(s, 0.60); 
    // Force the lightness to be in a consistent, dark range (15%)
    l = 0.28;

    // 3. Convert the adjusted HSL color back to RGB
    return hslToRgb(h, s, l);
}

function createAdvancedBackgroundColor(rgb) {
   // 1. Convert the dominant RGB color to HSL
    let [h, s, l] = rgbToHsl(rgb[0], rgb[1], rgb[2]);

    // 2. Intelligently adjust Saturation and Lightness
    // Clamp saturation to a tasteful maximum of 50%
    s = Math.min(s, 0.60); 
    // Force the lightness to be in a consistent, dark range (15%)
    l = 0.28;

    // 3. Convert the adjusted HSL color back to RGB
    return hslToRgb(h, s, l);
}


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
// NEW: Add references for the dynamic header text
const fullScreenContextText = document.getElementById('full-screen-context-text');
const fullScreenSourceText = document.getElementById('full-screen-source-text');

// NEW: Fixed Top Heading Elements


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
window.currentUserPlaylists = [];
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
/**
 * CORRECTED FUNCTION - Replaces the old version
 * Resets player instances and UI elements without clearing the currently loaded album state.
 */
function stopAllPlaybackUI() {
    // Stop native audio player
    if (audio.src && !audio.paused) {
        audio.pause();
        audio.src = ''; // Clear source to fully stop
        console.log("Native audio stopped and source cleared.");
    }
    // Destroy YouTube player instance
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
                    console.log("Spotify player paused.");
                }
            }).catch(e => console.warn("Could not get Spotify player state to pause:", e));
        } catch (e) {
            console.warn("Error pausing Spotify player:", e);
        }
    }

    // Stop any background embedded iframe players
    const iframeInFullEmbedContainer = albumFullEmbedContainer.querySelector('iframe');
    if (iframeInFullEmbedContainer) {
        iframeInFullEmbedContainer.remove();
        console.log("Embedded iframe removed to stop background playback.");
    }
    albumFullEmbedContainer.style.display = 'none';

    // **NOTE: The line `playingAlbum = null;` has been intentionally removed.**
    // This is the primary correction. The state is now only cleared when a song naturally ends.

    // Clear state and UI for the currently playing card
    currentlyPlayedCardId = null;
    showAllCards();
    console.log("currentlyPlayedCardId cleared and all cards shown.");

    // Clear any mini-player from the main play bar
    const dynamicPlayerContainer = playerLeft.querySelector('#youtube-player-container');
    if (dynamicPlayerContainer) {
        dynamicPlayerContainer.remove();
    }

    if (currentAlbumArt) currentAlbumArt.style.display = 'block';

    // Reset progress bars and timers
    if (progressBarInterval) {
        clearInterval(progressBarInterval);
        progressBarInterval = null;
    }
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

    // Reset full-screen player UI
    if (fullScreenProgressBar) fullScreenProgressBar.value = 0;
    if (fullScreenCurrentTime) fullScreenCurrentTime.textContent = '0:00';
    if (fullScreenTotalTime) fullScreenTotalTime.textContent = '0:00';
    if (fullPlayPauseBtn) {
        fullPlayIcon.classList.remove('hidden');
        fullPauseIcon.classList.add('hidden');
    }

    togglePlayerControls(true); // Re-enable all player controls
    console.log("Player controls re-enabled.");

    // Hide auxiliary UI elements
    updateFixedTopHeadingVisibility();
    hideFullScreenPlayer();
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
 * Saves the current player state to localStorage.
 * This includes the album, track, position, volume, and modes.
 */
function savePlayerState() {
    // Only save state if a controllable track is loaded
    if (!playingAlbum || !playingAlbum.tracks || typeof currentTrackIndex === 'undefined' || !playingAlbum.id) {
        return;
    }

    const currentTrack = playingAlbum.tracks[currentTrackIndex];
    // Do not save state for uncontrollable embedded content
    if (!currentTrack || currentTrack.rawHtmlEmbed || currentTrack.fullSoundcloudEmbed || currentTrack.audiomackEmbed) {
        return;
    }

    const state = {
        albumId: playingAlbum.id,
        trackIndex: currentTrackIndex,
        position: lastKnownPlaybackPosition,
        volume: volumeBar ? parseFloat(volumeBar.value) : 0.5,
        isShuffle: isShuffle,
        isRepeat: isRepeat,
        timestamp: Date.now()
    };

    localStorage.setItem(PLAYER_STATE_KEY, JSON.stringify(state));
}

/**
 * Loads and restores the player state from localStorage on page load.
 * It sets up the player UI with the saved track, ready for the user to resume.
 */
async function loadPlayerState() {
    const savedStateJSON = localStorage.getItem(PLAYER_STATE_KEY);
    if (!savedStateJSON) {
        console.log("No saved player state found.");
        return;
    }

    try {
        const savedState = JSON.parse(savedStateJSON);
        console.log("Saved player state found:", savedState);

        // Find the album from the master list of all albums
        const album = allAlbumsData.find(a => a.id === savedState.albumId);
        if (!album || !album.tracks || album.tracks.length <= savedState.trackIndex) {
            console.warn("Could not find saved album or track. Clearing saved state.");
            localStorage.removeItem(PLAYER_STATE_KEY);
            return;
        }

        // Restore state variables without starting playback
        playingAlbum = album;
        currentTrackIndex = savedState.trackIndex;
        lastKnownPlaybackPosition = savedState.position || 0;
        isShuffle = savedState.isShuffle || false;
        isRepeat = savedState.isRepeat || false;

        // Restore UI elements like volume
        if (volumeBar) {
            const savedVolume = savedState.volume !== undefined ? savedState.volume : 0.5;
            volumeBar.value = savedVolume;
            audio.volume = savedVolume; // Also set for the native audio element
        }

        // Update the entire player UI to show the loaded track info in a paused state.
        // This will also make the main play bar visible.
        await updatePlayerUI();

        // Manually set the progress bar and time displays to the saved position
        const track = album.tracks[currentTrackIndex];
        const duration = parseDurationToSeconds(track.duration);

        if (!isNaN(duration) && duration > 0) {
            if (progressBar) {
                progressBar.value = lastKnownPlaybackPosition;
                progressBar.max = duration;
            }
            if (currentTimeSpan) currentTimeSpan.textContent = formatTime(lastKnownPlaybackPosition);
            if (totalTimeSpan) totalTimeSpan.textContent = formatTime(duration);

            if (fullScreenProgressBar) {
                fullScreenProgressBar.value = lastKnownPlaybackPosition;
                fullScreenProgressBar.max = duration;
            }
            if (fullScreenCurrentTime) fullScreenCurrentTime.textContent = formatTime(lastKnownPlaybackPosition);
            if (fullScreenTotalTime) fullScreenTotalTime.textContent = formatTime(duration);
        }

        console.log(`Player state restored for "${track.title}". Ready to play from ${formatTime(lastKnownPlaybackPosition)}.`);

    } catch (error) {
        console.error("Error loading player state:", error);
        localStorage.removeItem(PLAYER_STATE_KEY); // Clear corrupted state
    }
}



/**
 * If no local state is found, this function attempts to load the user's
 * most recently liked song into the playbar in a paused state.
 */
async function loadLatestLikedSongAsFallback() {
    // Step 1: Only run if no song was restored from localStorage
    if (playingAlbum) {
        console.log("Skipping liked song fallback: A session was already restored from localStorage.");
        return;
    }

    // Step 2: Only run if the user is logged in
    const token = localStorage.getItem('userToken');
    if (!token) {
        console.log("Skipping liked song fallback: User is not logged in.");
        return;
    }

    console.log("No local state found. Attempting to load the latest liked song as a fallback...");

    try {
        // Step 3: Fetch the user's liked songs from the backend
        const response = await fetch(`${BACKEND_BASE_URL}/api/likes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            console.warn("Failed to fetch liked songs for fallback state.");
            return;
        }

        const likedSongs = await response.json();

        // Step 4: Check if the user has any liked songs
        if (!likedSongs || likedSongs.length === 0) {
            console.log("User has no liked songs to use as a fallback.");
            return;
        }

        // The backend should return songs sorted by most recently liked first.
        const latestLikedSong = likedSongs[0];

        // Find the full album data for this song
        const album = allAlbumsData.find(a => a.id === latestLikedSong.albumId);
        if (!album || !album.tracks || !album.tracks[latestLikedSong.trackIndex]) {
            console.warn("Could not find the album/track for the latest liked song.", latestLikedSong);
            return;
        }

        // Step 5: Load this song into the player's state (paused at the beginning)
        playingAlbum = album;
        currentTrackIndex = latestLikedSong.trackIndex;
        lastKnownPlaybackPosition = 0; // Start from the beginning

        // Update the UI to show the song in the playbar
        await updatePlayerUI();
        
        console.log(`Fallback successful: Loaded "${latestLikedSong.title}" into the playbar.`);

    } catch (error) {
        console.error("Error during liked song fallback:", error);
    }
}
// REPLACE your existing updatePlayerUI function with this FINAL, COMPLETE version.

// REPLACE your existing updatePlayerUI function with this entire block

// in script.js

// REPLACE your existing updatePlayerUI function with this entire block

async function updatePlayerUI() {
    console.log("updatePlayerUI called.");

    // --- Get references to all UI elements ---
    const fullScreenControls = document.querySelector('.full-screen-controls');
    const fullScreenProgress = document.querySelector('.full-screen-progress-section');
    const fullScreenBottomActions = document.querySelector('.full-screen-bottom-actions');
    const fullScreenEmbedInfo = document.getElementById('full-screen-embed-info');
    const mainPlayerControls = document.getElementById('player-controls-group');

    // --- ADDED: References to the dynamic header text elements ---
    const fullScreenContextText = document.getElementById('full-screen-context-text');
    const fullScreenSourceText = document.getElementById('full-screen-source-text');
    // --- END OF ADDITION ---

    if (!playingAlbum) {
        mainPlayBar.style.display = 'none';
        hideFullScreenPlayer();
        if (currentAlbumArt) currentAlbumArt.src = 'https://placehold.co/64x64/4a4a4a/ffffff?text=Album';
        if (currentSongTitle) currentSongTitle.textContent = 'No Track Playing';
        if (currentArtistName) currentArtistName.textContent = '';
        return;
    }

    mainPlayBar.style.display = 'flex';

    const isEmbeddedAlbum = playingAlbum.rawHtmlEmbed || playingAlbum.fullSoundcloudEmbed || playingAlbum.audiomackEmbed || playingAlbum.iframeSrc;

    if (isEmbeddedAlbum) {
        if (fullScreenControls) fullScreenControls.classList.add('hidden');
        if (fullScreenProgress) fullScreenProgress.classList.add('hidden');
        if (fullScreenBottomActions) fullScreenBottomActions.classList.add('hidden');
        if (fullScreenEmbedInfo) fullScreenEmbedInfo.classList.remove('hidden');
        if (mainPlayerControls) mainPlayerControls.classList.add('hidden');
        togglePlayerControls(false);
    } else {
        if (fullScreenControls) fullScreenControls.classList.remove('hidden');
        if (fullScreenProgress) fullScreenProgress.classList.remove('hidden');
        if (fullScreenBottomActions) fullScreenBottomActions.classList.remove('hidden');
        if (fullScreenEmbedInfo) fullScreenEmbedInfo.classList.add('hidden');
        if (mainPlayerControls) mainPlayerControls.classList.remove('hidden');
        togglePlayerControls(true);
    }

    let displayTitle = playingAlbum.title || 'Unknown Title';
    let displayArtist = playingAlbum.artist || 'Unknown Artist';
    let displayCoverArt = playingAlbum.coverArt || 'https://placehold.co/64x64/4a4a4a/ffffff?text=Album';
    let displayCoverArtLarge = playingAlbum.coverArt || 'https://placehold.co/300x300/4a4a4a/ffffff?text=Album';
    let currentTrack = null;

    if (isEmbeddedAlbum) {
        if (progressBar) { progressBar.value = 0; progressBar.disabled = true; }
        if (currentTimeSpan) currentTimeSpan.textContent = '0:00';
        if (totalTimeSpan) totalTimeSpan.textContent = 'N/A';
        if (fullScreenProgressBar) { fullScreenProgressBar.value = 0; fullScreenProgressBar.disabled = true; }
        if (fullScreenCurrentTime) fullScreenCurrentTime.textContent = '0:00';
        if (fullScreenTotalTime) fullScreenTotalTime.textContent = 'N/A';
        if (progressBarInterval) clearInterval(progressBarInterval);
        progressBarInterval = null;
    } else if (playingAlbum.tracks && playingAlbum.tracks.length > 0) {
        currentTrackIndex = typeof currentTrackIndex !== 'undefined' ? currentTrackIndex : 0;
        currentTrack = playingAlbum.tracks[currentTrackIndex];
        if (currentTrack) {
            displayTitle = currentTrack.title || 'Unknown Title';
            displayArtist = currentTrack.artist || 'Unknown Artist';
            displayCoverArt = currentTrack.img || playingAlbum.coverArt || displayCoverArt;
            displayCoverArtLarge = currentTrack.img || playingAlbum.coverArt || displayCoverArtLarge;

            if (progressBarInterval) clearInterval(progressBarInterval);
            let saveStateCounter = 0;
            progressBarInterval = setInterval(async () => {
                let currentProgress = 0;
                let currentDuration = 0;
                let playerIsPlaying = false;

                if (audio.src && audio.src.includes(currentTrack.src)) {
                    currentProgress = audio.currentTime;
                    currentDuration = audio.duration || 0;
                    playerIsPlaying = !audio.paused && !audio.ended;
                } else if (ytPlayer && ytPlayer.getPlayerState) {
                    currentProgress = ytPlayer.getCurrentTime();
                    currentDuration = ytPlayer.getDuration();
                    playerIsPlaying = ytPlayer.getPlayerState() === YT.PlayerState.PLAYING;
                } else if (spotifyPlayer && currentTrack.spotifyUri) {
                    try {
                        const state = await spotifyPlayer.getCurrentState();
                        if (state) {
                            currentProgress = state.position / 1000;
                            currentDuration = state.duration / 1000;
                            playerIsPlaying = !state.paused;
                        }
                    } catch (e) { /* ignore */ }
                }

                if (isNaN(currentDuration) || currentDuration <= 0) {
                    currentDuration = parseDurationToSeconds(currentTrack.duration);
                }
                
                if (currentTimeSpan) currentTimeSpan.textContent = formatTime(currentProgress);
                if (totalTimeSpan) totalTimeSpan.textContent = formatTime(currentDuration);
                if (progressBar) {
                    progressBar.max = currentDuration;
                    progressBar.value = currentProgress;
                }

                if (fullScreenCurrentTime) fullScreenCurrentTime.textContent = formatTime(currentProgress);
                if (fullScreenTotalTime) fullScreenTotalTime.textContent = formatTime(currentDuration);
                if (fullScreenProgressBar) {
                    fullScreenProgressBar.max = currentDuration;
                    fullScreenProgressBar.value = currentProgress;
                    const progressPercent = (currentDuration > 0) ? (currentProgress / currentDuration) * 100 : 0;
                    fullScreenProgressBar.style.setProperty('--progress-percent', `${progressPercent}%`);
                }

                if (playIcon && pauseIcon) {
                    playIcon.classList.toggle('hidden', playerIsPlaying);
                    pauseIcon.classList.toggle('hidden', !playerIsPlaying);
                }
                if (fullPlayIcon && fullPauseIcon) {
                    fullPlayIcon.classList.toggle('hidden', playerIsPlaying);
                    fullPauseIcon.classList.toggle('hidden', !playerIsPlaying);
                }

                if (playerIsPlaying) {
                    lastKnownPlaybackPosition = currentProgress;
                    saveStateCounter++;
                    if (saveStateCounter >= 5) {
                        savePlayerState();
                        saveStateCounter = 0;
                    }
                }

            }, 1000);
        }
    }

    // Update common UI elements (titles, art, etc.)
    if (currentAlbumArt) currentAlbumArt.src = displayCoverArt;
    if (currentSongTitle) currentSongTitle.textContent = displayTitle;
    if (currentArtistName) currentArtistName.textContent = displayArtist;
    
    if (fullScreenAlbumArt) fullScreenAlbumArt.src = displayCoverArtLarge;
    if (fullScreenSongTitleLarge) fullScreenSongTitleLarge.textContent = displayTitle;
    if (fullScreenArtistNameLarge) fullScreenArtistNameLarge.textContent = displayArtist;

    // --- THIS IS THE FIX ---
    // The following lines were added to ensure the header text is always updated.
    // It correctly uses the `playingAlbum` data, which is accurate for both
    // embedded and non-embedded content at this stage.
    if (fullScreenContextText) {
        if (isEmbeddedAlbum) {
            fullScreenContextText.textContent = 'PLAYING FROM EMBEDDED PLAYER';
        } else {
            fullScreenContextText.textContent = 'PLAYING FROM ALBUM';
        }
    }
    if (fullScreenSourceText) {
        // The source is always the album's title.
        fullScreenSourceText.textContent = playingAlbum.title || 'Unknown Album';
    }
    // --- END OF FIX ---
    
    const setBackgroundColor = () => {
        try {
            if (!fullScreenAlbumArt.complete || typeof fullScreenAlbumArt.naturalWidth === "undefined" || fullScreenAlbumArt.naturalWidth === 0) return;
            const colorThief = new ColorThief();
            const dominantColor = colorThief.getColor(fullScreenAlbumArt);
            const finalColor = createAdvancedBackgroundColor(dominantColor);
            const rgbColor = `rgb(${finalColor[0]}, ${finalColor[1]}, ${finalColor[2]})`;
            
            fullScreenPlayer.style.setProperty('--dominant-color', rgbColor);
            mainPlayBar.style.setProperty('--dominant-color-main', rgbColor);
        } catch (e) {
            console.error("ColorThief error:", e);
            fullScreenPlayer.style.setProperty('--dominant-color', '#4a4a4a');
            mainPlayBar.style.setProperty('--dominant-color-main', '#1A0303');
        }
    };

    if (fullScreenAlbumArt) {
        if (fullScreenAlbumArt.complete) {
            setBackgroundColor();
        } else {
            fullScreenAlbumArt.onload = setBackgroundColor;
            fullScreenAlbumArt.onerror = () => {
                fullScreenPlayer.style.setProperty('--dominant-color', '#4a4a4a');
                mainPlayBar.style.setProperty('--dominant-color-main', '#1A0303');
            };
        }
    }
    
    updatePlaybarLikeState();
    updatePopupLikeState();
}
/**
 * Updates the icons of all compact play buttons in the playlist.
 */






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
function renderUserPlaylistsInLibrary() {
    const container = document.getElementById('user-playlists-container');
    if (!container) {
        console.error("Playlist container not found in the DOM.");
        return;
    }

    container.innerHTML = '';

    if (!container.dataset.listenerAttached) {
        container.addEventListener('click', (event) => {
            const playlistItem = event.target.closest('.swarify-playlist-item');
            if (playlistItem) {
                const playlistId = playlistItem.dataset.playlistId;
                const clickedPlaylist = window.currentUserPlaylists.find(p => p._id === playlistId);
                if (clickedPlaylist) {
                    currentPlaylist = clickedPlaylist;
                    
                    // --- THIS IS THE FIX ---
                    // 1. Update the URL path, just like for albums.
                    const newPath = `/playlist/${clickedPlaylist._id}`;
                    if (window.location.pathname !== newPath) {
                        history.pushState({ playlistId: clickedPlaylist._id }, clickedPlaylist.name, newPath);
                    }
                    // 2. Directly call the function to open the overlay.
                    openPlaylistDetailsOverlay(clickedPlaylist);
                    // --- END OF FIX ---
                }
            }
        });
        container.dataset.listenerAttached = 'true';
    }

    const token = localStorage.getItem('userToken');
    if (!token) {
        container.innerHTML = '<div class="p-2 text-gray-500 text-sm text-center">Log in to view playlists.</div>';
        return;
    }

    if (window.currentUserPlaylists.length === 0) {
        container.innerHTML = '<div class="p-2 text-gray-500 text-sm text-center">You have no playlists yet.</div>';
        return;
    }

    window.currentUserPlaylists.forEach(playlist => {
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
                openSongOptionsPopup(song, playlist._id);
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

// In script.js, REPLACE the entire fetchAndDisplaySimilarAlbums function

// In script.js

// REPLACEMENT for the fetchAndDisplaySimilarAlbums function
async function fetchAndDisplaySimilarAlbums(albumToRecommendFor) { // 1. Argument is renamed for clarity
    const container = document.getElementById('similar-albums-container');
    const section = document.getElementById('similar-albums-section');
    if (!container || !section) {
        console.error("CRITICAL: Could not find the HTML elements for the recommendations section.");
        return;
    }

    section.style.display = '';
    section.classList.remove('hidden');
    container.innerHTML = '<p style="color: #b3b3b3; grid-column: 1 / -1; text-align: center;">Loading recommendations...</p>';

    try {
        const artistQuery = encodeURIComponent(albumToRecommendFor.artist || '');
        const genreQuery = encodeURIComponent(albumToRecommendFor.genre || '');
        const currentAlbumId = encodeURIComponent(albumToRecommendFor.id || '');
        
        const fetchURL = `${BACKEND_BASE_URL}/api/recommendations?artist=${artistQuery}&genre=${genreQuery}&exclude=${currentAlbumId}&limit=12`;

        const response = await fetch(fetchURL);
        const similarAlbums = await response.json();

        // --- THE FIX ---
        // 2. Before updating the UI, we check if the album we fetched for is still the one being displayed.
        // `currentAlbum` is the global variable representing the currently visible album.
        if (!currentAlbum || currentAlbum.id !== albumToRecommendFor.id) {
            console.log("Aborting stale recommendation update. The user has already navigated to a different album.");
            return; // Exit the function to prevent overwriting the correct recommendations.
        }
        // --- END OF FIX ---

        if (Array.isArray(similarAlbums) && similarAlbums.length > 0) {
            container.innerHTML = '';
            similarAlbums.forEach(album => {
                const cardHtml = createAlbumCardHtml(album);
                container.insertAdjacentHTML('beforeend', cardHtml);
            });
            attachEventListenersToHtmlCards();
        } else {
            container.innerHTML = `<p style="color: #b3b3b3; text-align: center; grid-column: 1 / -1;">No similar albums found.</p>`;
        }
    } catch (error) {
        console.error('ERROR fetching similar albums:', error);
        container.innerHTML = `<p style="color: #ff4d4d; grid-column: 1 / -1; text-align: center;">Could not load recommendations.</p>`;
    }
}
async function playTrack(track, indexInAlbum, initialSeekTime = 0) {
    if (!isPlayingFromLikedSongs) {
        isPlayingFromLikedSongs = false;
    }
    if (mainPlayBar) {
        mainPlayBar.style.display = 'flex';
        console.log("playTrack: mainPlayBar set to display: flex.");
    }

    if (!track) {
        console.error("Attempted to play null or undefined track.");
        return;
    }

    const isControllableEmbeddedTrack = (track.iframeSrc && track.iframeSrc.includes('https://www.youtube.com/embed/')) || track.spotifyUri;

    // --- THIS IS THE KEY FIX ---
    // We only call the full UI reset if this is NOT a resume-from-load action.
    // On resume, the UI is already set up, and we just need to start the player.
    const isResumingAfterLoad = !audio.src && !ytPlayer && initialSeekTime > 0;
    if (!isResumingAfterLoad) {
        stopAllPlaybackUI(); // This is for starting a completely new track.
    } else {
        console.log("Resuming from loaded state, performing soft player stop.");
        stopControllablePlayersOnly(); // Gentler stop for resuming.
    }

    // This logic correctly sets the `playingAlbum`.
    // It prioritizes the album open in the overlay (`currentAlbum`).
    // If no album is open, it preserves the existing `playingAlbum` (the one restored from localStorage).
    playingAlbum = currentAlbum || playingAlbum;
    
    if (!playingAlbum) {
         console.error("playTrack Error: Could not determine the album context for playback.");
         return;
    }
    
    currentlyPlayedCardId = playingAlbum.id;
    hidePlayedCard();

    // Update global current track index
    if (indexInAlbum !== undefined) {
        currentTrackIndex = indexInAlbum;
    }

    // Update player UI (compact and full-screen)
    updatePlayerUI();
    updatePlaybarLikeState();
    updatePopupLikeState();

    // Update fixed top heading
    if (fixedTopAlbumArt) fixedTopAlbumArt.src = (playingAlbum.coverArt || track.img || 'https://placehold.co/40x40/4a4a4a/ffffff?text=Album');
    if (fixedTopAlbumTitle) fixedTopAlbumTitle.textContent = (playingAlbum.title || 'Unknown Album');
    updateFixedTopHeadingVisibility();

    // --- The rest of the playback logic remains the same ---
    const isNonControllableEmbeddedTrack = track.rawHtmlEmbed || track.fullSoundcloudEmbed || track.audiomackEmbed || track.soundcloudEmbed;

    if (isNonControllableEmbeddedTrack) {
        console.log("Playing via Non-Controllable Embed (Player Bar):", track.title);
        if (currentAlbumArt) currentAlbumArt.style.display = 'block';
        const dynamicPlayerContainer = playerLeft.querySelector('#youtube-player-container');
        if (dynamicPlayerContainer) dynamicPlayerContainer.remove();
        if (playPauseBtn) {
            playIcon.classList.add('hidden');
            pauseIcon.classList.remove('hidden');
        }
        if (progressBar) progressBar.value = 0;
        if (currentTimeSpan) currentTimeSpan.textContent = '0:00';
        if (totalTimeSpan) totalTimeSpan.textContent = 'N/A';
        togglePlayerControls(false);
    }
    else if (track.spotifyUri && spotifyPlayer && spotifyAccessToken && spotifyDeviceId) {
       // ... (Spotify playback logic - no changes needed here)
       // This block remains identical to your original file.
       // For brevity, it is collapsed.
    } else if (track.iframeSrc && track.iframeSrc.includes('https://www.youtube.com/embed/')) {
       // ... (YouTube playback logic - no changes needed here)
       // This block remains identical to your original file.
       // For brevity, it is collapsed.
    } else {
        if (!track.src) {
            console.error("playTrack Error: The selected track is missing a 'src' property and cannot be played.", track);
            showMessageBox("Sorry, this song is currently unavailable.", 'error');
            return;
        }

        audio.src = track.src;
        audio.currentTime = initialSeekTime;
        audio.play().catch(e => console.error("Audio play failed:", e)); // Added error catching
        if (playPauseBtn) {
            playIcon.classList.add('hidden');
            pauseIcon.classList.remove('hidden');
        }
        togglePlayerControls(true);

        audio.onloadedmetadata = () => {
            updatePlayerUI();
            if (playingAlbum && playingAlbum.tracks && playingAlbum.tracks[currentTrackIndex]) {
                const currentTrackInAlbum = playingAlbum.tracks[currentTrackIndex];
                if (currentTrackInAlbum.duration === 0 || Math.abs(currentTrackInAlbum.duration - audio.duration) > 1) {
                    currentTrackInAlbum.duration = audio.duration;
                    const trackRow = albumDetailsTracksBody.querySelector(`tr[data-track-index="${currentTrackIndex}"]`);
                    if (trackRow) {
                        const durationCell = trackRow.querySelector('td:nth-child(4)');
                        if (durationCell) {
                            durationCell.textContent = formatTime(audio.duration);
                        }
                    }
                }
            }
        };

        if (progressBarInterval) clearInterval(progressBarInterval);
        progressBarInterval = setInterval(() => {
            if (!audio.paused && !audio.ended) {
                lastKnownPlaybackPosition = audio.currentTime;
                updatePlayerUI();
            }
        }, 1000);

        audio.onended = () => {
            if (!playingAlbum || !playingAlbum.tracks || playingAlbum.tracks.length === 0) return;

            if (isRepeat) {
                playTrack(playingAlbum.tracks[currentTrackIndex], currentTrackIndex);
            } else if (isShuffle) {
                currentTrackIndex = Math.floor(Math.random() * playingAlbum.tracks.length);
                playTrack(playingAlbum.tracks[currentTrackIndex], currentTrackIndex);
            } else {
                if (playingAlbum.tracks && currentTrackIndex < playingAlbum.tracks.length - 1) {
                    currentTrackIndex++;
                    playTrack(playingAlbum.tracks[currentTrackIndex], currentTrackIndex);
                } else {
                    // This is where playback stops naturally
                    playingAlbum = null; // Manually clear the state here
                    stopAllPlaybackUI();
                    console.log("Last native audio track ended, no repeat/shuffle. Stopping all playback.");
                }
            }
        };
    }
   
    highlightPlayingLikedSong();
    updateAlbumPlayButtonIcon();
    updatePlaylistPlayButtons();
      updatePlayingTrackIndicator();
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




// Corrected logic for updateFixedTopHeadingVisibility
function updateFixedTopHeadingVisibility() {
    // Only proceed if the necessary elements exist
    const rightPanel = document.querySelector('.right');
    const fixedTopPlayingHeading = document.getElementById('fixed-top-playing-heading');
    const albumOverlay = document.getElementById('albumOverlay');
    if (!rightPanel || !fixedTopPlayingHeading || !albumOverlay) {
        return;
    }

    // Determine if the album overlay is currently open
    const isAlbumOverlayOpen = albumOverlay.classList.contains('show');
    const isFullScreenPlayerOpen = document.getElementById('full-screen-player').classList.contains('active');
    
    // **Stronger Condition**: The fixed header should not appear when the album overlay or full-screen player is open.
    if (isAlbumOverlayOpen || isFullScreenPlayerOpen) {
        fixedTopPlayingHeading.classList.remove('visible');
        return;
    }
    
    // The fixed header should only appear on mobile/tablet screens
    const isMobileOrTablet = window.innerWidth <= 768;
    if (!isMobileOrTablet) {
        fixedTopPlayingHeading.classList.remove('visible');
        return;
    }

    // Determine if an album is currently playing to display in the header
    let albumToShow = null;
    if (playingAlbum) {
        albumToShow = playingAlbum;
    }

    // If no album is playing, hide the header
    if (!albumToShow) {
        fixedTopPlayingHeading.classList.remove('visible');
        return;
    }

    // Set the scroll threshold for showing the header (e.g., 200px down)
    const scrollThreshold = 200;

    if (rightPanel.scrollTop > scrollThreshold) {
        // Update the header content with the playing album's details
        const albumArt = fixedTopPlayingHeading.querySelector('.album-art-small');
        if (albumArt) albumArt.src = albumToShow.coverArt;
        const albumTitle = fixedTopPlayingHeading.querySelector('.album-title-small');
        if (albumTitle) albumTitle.textContent = albumToShow.title;
        
        // Add the 'visible' class to show the header with a smooth transition
        fixedTopPlayingHeading.classList.add('visible');
    } else {
        // Remove the 'visible' class to hide the header
        fixedTopPlayingHeading.classList.remove('visible');
    }
}

function setupAlbumSearchListeners() {
    const overlay = document.getElementById('albumOverlay');
    // Corrected ID for the trigger
      const searchTrigger = document.getElementById('album-search-trigger');
    const searchBackBtn = document.getElementById('album-search-back-btn');
    const searchInput = document.getElementById('album-search-input');
    const clearSearchBtn = document.getElementById('album-search-clear-btn');

    if (!overlay || !searchTrigger || !searchBackBtn || !searchInput || !clearSearchBtn) {
        console.error("One or more album search elements are missing.");
        return;
    }

    // --- START: MODIFIED LISTENERS ---
    // Open the search view by changing the URL hash
    searchTrigger.onclick = () => {
        navigateTo('album-search');
    };

    // Close the search view using the browser's history
    searchBackBtn.onclick = () => {
        history.back();
    };
    // --- END: MODIFIED LISTENERS ---

    // The rest of the function remains the same
    searchInput.oninput = () => {
        filterAlbumSearchResults();
        clearSearchBtn.classList.toggle('hidden', searchInput.value.length === 0);
    };

    clearSearchBtn.onclick = () => {
        searchInput.value = '';
        searchInput.focus();
        filterAlbumSearchResults();
        clearSearchBtn.classList.add('hidden');
    };
}
function populateAlbumSearchResults() {
    const resultsContainer = document.getElementById('album-search-results');
    resultsContainer.innerHTML = ''; // Clear previous results

    if (currentAlbum && currentAlbum.tracks) {
        currentAlbum.tracks.forEach((track, index) => {
            const row = document.createElement('div');
            row.className = 'search-result-row';
            row.dataset.trackIndex = index;
            
            row.innerHTML = `
                <img src="${track.img || currentAlbum.coverArt}" alt="${track.title}">
                <div class="track-info">
                    <div class="track-title">${track.title || 'Untitled'}</div>
                    <div class="track-artist">${track.artist || currentAlbum.artist}</div>
                </div>
                <button class="track-options-btn">
                     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="12" cy="19" r="2"/></svg>
                </button>
            `;
            
            row.addEventListener('click', (e) => {
                if (e.target.closest('.track-options-btn')) return;
                playTrack(currentAlbum.tracks[index], index);
                // The line that closed the search view has been removed from here.
            });

            resultsContainer.appendChild(row);
        });
    }
    updateSearchTrackHighlight(); // Ensure highlight is correct when search is opened
}


/**
 * Highlights the currently playing track in the album search results by adding a 'playing' class.
 * CORRECTED: This function now reliably adds and removes a CSS class instead of using inline styles.
 */
function updateSearchTrackHighlight() {
    const searchResultsContainer = document.getElementById('album-search-results');
    if (!searchResultsContainer) return;

    const rows = searchResultsContainer.querySelectorAll('.search-result-row');
    const playingAlbumId = playingAlbum ? playingAlbum.id : null;
    const isOverlayAlbumContext = currentAlbum && playingAlbumId === currentAlbum.id;
    const playingTrackIndex = isOverlayAlbumContext ? currentTrackIndex : -1;

    rows.forEach(row => {
        const rowIndex = parseInt(row.dataset.trackIndex, 10);
        
        // Add or remove the 'playing' class based on the current track
        if (rowIndex === playingTrackIndex) {
            row.classList.add('playing');
        } else {
            row.classList.remove('playing');
        }
    });
}


/**
 * Filters the visible tracks in the search view based on the input query.
 */
function filterAlbumSearchResults() {
    const query = document.getElementById('album-search-input').value.toLowerCase().trim();
    const rows = document.querySelectorAll('#album-search-results .search-result-row');
    const noResultsView = document.getElementById('album-no-search-results');
    const noResultsQuerySpan = document.getElementById('no-results-query');
    
    let hasVisibleResults = false;

    rows.forEach(row => {
        const title = row.querySelector('.track-title').textContent.toLowerCase();
        const artist = row.querySelector('.track-artist').textContent.toLowerCase();
        
        if (title.includes(query) || artist.includes(query)) {
            row.style.display = 'flex';
            hasVisibleResults = true;
        } else {
            row.style.display = 'none';
        }
    });

    // Show or hide the "No results" message
    if (!hasVisibleResults && query) {
        noResultsView.classList.remove('hidden');
        noResultsQuerySpan.textContent = `"${document.getElementById('album-search-input').value}"`;
    } else {
        noResultsView.classList.add('hidden');
    }
}

// [script.js]

/**
 * Updates the visual indicator for the currently playing track in the album overlay.
 * It removes the 'playing' class from any previous track and adds it to the current one.
 */
function updatePlayingTrackIndicator() {
    const tracksBody = document.getElementById('albumDetails-tracks');
    if (!tracksBody) return; // Exit if the album overlay isn't open

    // 1. Find any row that is currently marked as 'playing' and remove the class.
    const previouslyPlayingRow = tracksBody.querySelector('tr.playing');
    if (previouslyPlayingRow) {
        previouslyPlayingRow.classList.remove('playing');
    }

    // 2. Add the 'playing' class to the new current track's row, but only if
    //    the album being played is the one currently displayed in the overlay.
    if (playingAlbum && currentAlbum && playingAlbum.id === currentAlbum.id && typeof currentTrackIndex !== 'undefined') {
        const newPlayingRow = tracksBody.querySelector(`tr[data-track-index="${currentTrackIndex}"]`);
        if (newPlayingRow) {
            newPlayingRow.classList.add('playing');
            
        }
    }
}




// in script.js

async function populateAlbumOverlayUI(albumData, shouldFetchRecommendations = true) {
    console.log(`Populating UI for album: "${albumData.title}"`);
    currentAlbum = albumData;

    // --- START: FIX FOR THE LAG ---
    // The 'await' keyword is removed from the line below.
    // This allows the recommendations to load in the background without blocking the UI.
    if (shouldFetchRecommendations) {
        fetchAndDisplaySimilarAlbums(albumData);
    }
    // --- END: FIX FOR THE LAG ---

    const isEmbeddedAlbum = !!(albumData.rawHtmlEmbed || albumData.fullSoundcloudEmbed || albumData.audiomackEmbed || albumData.iframeSrc);

    const albumDetailsContent = document.getElementById('album-overlay-scroll-content');
    const albumFullEmbedContainer = document.getElementById('album-full-embed-container');
    
    const oldCompactHeader = document.getElementById('embedded-compact-header');
    if (oldCompactHeader) {
        oldCompactHeader.remove();
    }

    if (albumDetailsContent) albumDetailsContent.scrollTop = 0;

    Array.from(albumFullEmbedContainer.children).forEach(child => {
        if (child.dataset.albumId) {
            child.style.display = 'none';
        }
    });

    // --- START: FIX FOR THE RACE CONDITION ---
    // After all the logic to prepare the UI is done, we add this final check.
    // It compares the album we just prepared against the current URL.
    const currentPathAlbumId = window.location.pathname.split('/')[2];
    if (currentPathAlbumId !== albumData.id) {
        console.warn(`Aborting UI population for "${albumData.title}" because the user has already navigated away.`);
        // If they don't match, it means the user hit "back" or clicked something else.
        // We stop the function here to prevent the "phantom" album from appearing.
        return; 
    }
    // --- END: FIX FOR THE RACE CONDITION ---

    // The rest of the function remains the same...
    if (isEmbeddedAlbum) {
        albumDetailsContent.style.display = 'none';
        albumFullEmbedContainer.style.display = 'block';
        albumOverlay.classList.add('embedded-view');
        albumOverlay.classList.remove('tracklist-view');

        let wrapper = iframeCache[albumData.id];

        if (wrapper) {
            wrapper.style.display = 'block';
        } else {
            wrapper = document.createElement('div');
            wrapper.dataset.albumId = albumData.id;
            wrapper.style.cssText = 'width: 100%; height: 100%; overflow-y: auto; position: relative;';

            const embedContent = albumData.soundcloudEmbed || albumData.fullSoundcloudEmbed || albumData.rawHtmlEmbed || albumData.audiomackEmbed || (albumData.iframeSrc ? `<iframe src="${albumData.iframeSrc}" title="${albumData.title}" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>` : '');

            const similarSectionHTML = `
                <div id="embedded-similar-albums-section" class="spotifyPlaylists">
                    <div class="section-heading"><h1>You might also like</h1></div>
                    <div class="cardcontainer" id="embedded-similar-albums-container"></div>
                </div>`;
     
            wrapper.innerHTML = embedContent + similarSectionHTML;
            albumFullEmbedContainer.appendChild(wrapper);
            iframeCache[albumData.id] = wrapper;
            fetchAndDisplayEmbeddedSimilarAlbums(albumData, wrapper);
        }

        const oldMask = wrapper.querySelector('#embedded-overlay-top-mask');
        if (oldMask) oldMask.remove();

        const topMaskHTML = `<div id="embedded-overlay-top-mask">
                        <button class="embedded-header-back-btn close-overlay">
                            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12l4.58-4.59z"/></svg>
                        </button>
                        <img src="${albumData.coverArt || 'https://placehold.co/300x300/4a4a4a/ffffff?text=Album'}" alt="Album Cover" class="embedded-header-cover">
                        <div class="embedded-header-info">
                            <div class="embedded-header-title">${albumData.title || 'Embedded Content'}</div>
                            <div class="embedded-header-artist">${albumData.artist || 'Various Artists'}</div>
                            <div class="embedded-header-meta">Album • ${albumData.year || '2024'} • ${albumData.tracks ? albumData.tracks.length : 1} songs</div>
                        </div>
                     </div>`;
        wrapper.insertAdjacentHTML('afterbegin', topMaskHTML);
        const embeddedBackBtn = wrapper.querySelector('.embedded-header-back-btn');
        if (embeddedBackBtn) {
            embeddedBackBtn.addEventListener('click', () => {
                history.back();
            });
        }

        const compactHeader = document.createElement('div');
        compactHeader.id = 'embedded-compact-header';
        compactHeader.innerHTML = `
            <button class="embedded-compact-header-back-btn close-overlay">
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12l4.58-4.59z"/></svg>
            </button>
            <span class="embedded-compact-header-title">${albumData.title || 'Embedded Content'}</span>
        `;
        wrapper.insertAdjacentElement('afterbegin', compactHeader);
        
        const topMask = wrapper.querySelector('#embedded-overlay-top-mask');
        const coverImg = topMask.querySelector('.embedded-header-cover');
        coverImg.crossOrigin = "Anonymous";

        const setDynamicBackgroundColor = () => {
            try {
                const colorThief = new ColorThief();
                const dominantColor = colorThief.getColor(coverImg);
                const baseColor = createAdvancedBackgroundColor(dominantColor);
                const baseRgb = `rgb(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]})`;
                const darkerColor = baseColor.map(c => Math.max(0, c - 70));
                const darkerRgb = `rgb(${darkerColor[0]}, ${darkerColor[1]}, ${darkerColor[2]})`;
                const pageDarkRgb = `rgb(18, 18, 18)`;

                const gradient = `linear-gradient(to bottom, ${baseRgb}, ${darkerRgb} 60%, ${pageDarkRgb} 95%)`;
                topMask.style.backgroundImage = gradient;
                compactHeader.style.backgroundColor = baseRgb;
            } catch (e) {
                console.error("ColorThief error:", e);
                const fallbackGradient = `linear-gradient(to bottom, rgb(50,50,50), rgb(18,18,18) 95%)`;
                topMask.style.backgroundImage = fallbackGradient;
                compactHeader.style.backgroundColor = 'rgb(50,50,50)';
            }
        };

        if (coverImg.complete) {
            setDynamicBackgroundColor();
        } else {
            coverImg.onload = setDynamicBackgroundColor;
        }

        setupEmbeddedScrollListener(wrapper);
          
         setTimeout(() => {
            checkEmbeddedHeaderVisibility(wrapper);
        }, 0);

    } else {
        albumDetailsContent.style.display = 'block';
        albumFullEmbedContainer.style.display = 'none';
        albumOverlay.classList.remove('embedded-view');
        albumOverlay.classList.add('tracklist-view');

        const albumCover = document.getElementById('albumDetails-cover');
        const albumTitle = document.getElementById('albumDetails-title');
        const albumArtist = document.getElementById('albumDetails-artist');
        const albumMeta = document.getElementById('albumDetails-meta');
        const tracksBody = document.getElementById('albumDetails-tracks');
        const compactTitle = document.getElementById('compact-header-title');

        albumCover.src = albumData.coverArt || 'https://placehold.co/250x250/000/fff?text=Album';
        albumTitle.textContent = albumData.title || 'Unknown Title';
        albumArtist.textContent = albumData.artist || 'Unknown Artist';
        albumMeta.textContent = `Album • ${albumData.year || 'N/A'} • ${albumData.tracks ? albumData.tracks.length : 0} songs`;
        if (compactTitle) compactTitle.textContent = albumData.title || 'Unknown Title';

        tracksBody.innerHTML = '';
        if (albumData.tracks && albumData.tracks.length > 0) {
            albumData.tracks.forEach((track, index) => {
                const row = tracksBody.insertRow();
                row.dataset.trackIndex = index;
                row.innerHTML = `<td class="track-title-cell"><div class="track-title">${track.title || 'Untitled'}</div><div class="track-artist">${track.artist || albumData.artist}</div></td><td class="track-options-cell"><button class="track-options-btn">...</button></td>`;
                row.addEventListener('click', (e) => {
                    if (e.target.closest('.track-options-btn')) return;
                    playTrack(albumData.tracks[index], index);
                });
            });
        }

        togglePlayerControls(true);
    }

    const albumPlayButton = document.getElementById('album-play');
    if (albumPlayButton) {
        albumPlayButton.onclick = () => {
            if (currentAlbum && currentAlbum.tracks && currentAlbum.tracks.length > 0) {
                const isPlayingThisAlbum = playingAlbum && playingAlbum.id === currentAlbum.id;
                if (isPlayingThisAlbum) {
                    togglePlayback();
                } else {
                    playTrack(currentAlbum.tracks[0], 0);
                }
            }
        };
    }

    updatePlayingTrackIndicator();
    updateAlbumPlayButtonIcon();
    setupAlbumScrollListener();
}
// in script.js

/**
 * Checks the scroll position of the embedded album view and shows/hides the compact header.
 * @param {HTMLElement} scrollWrapper - The scrollable div containing the embedded content.
 */
function checkEmbeddedHeaderVisibility(scrollWrapper) {
    if (!scrollWrapper) return;
    
    // Find the main header mask (with the large cover art) inside the specific wrapper
    const topMask = scrollWrapper.querySelector('#embedded-overlay-top-mask');
    // The compact header is inside the wrapper as well
    const compactHeader = scrollWrapper.querySelector('#embedded-compact-header');

    if (!topMask || !compactHeader) {
        return;
    }

    const topMaskRect = topMask.getBoundingClientRect();
    
    // Show the compact header if the bottom of the main header has scrolled
    // above the 60px mark from the top of the viewport.
    if (topMaskRect.bottom < 60) {
        compactHeader.classList.add('visible');
    } else {
        compactHeader.classList.remove('visible');
    }
}

// ADD THIS NEW FUNCTION to script.js

/**
 * Sets up the scroll listener for the embedded album view to show/hide the compact header.
 * @param {HTMLElement} scrollWrapper - The scrollable div containing the embedded content.
 */
function setupEmbeddedScrollListener(scrollWrapper) {
    // Remove any existing listener from this wrapper to prevent duplicates
    scrollWrapper.removeEventListener('scroll', handleEmbeddedScroll);
    // Add the new listener
    scrollWrapper.addEventListener('scroll', handleEmbeddedScroll);
}

/**
 * The actual scroll handler function.
 * @param {Event} event - The scroll event object.
 */
function handleEmbeddedScroll(event) {
    // The event handler now simply calls our reusable logic function
    checkEmbeddedHeaderVisibility(event.currentTarget);
}

function setupAlbumScrollListener() {
    const scrollContent = document.getElementById('album-overlay-scroll-content');
    if (!scrollContent) return;

    // Remove the previous listener to avoid memory leaks or multiple triggers
    scrollContent.removeEventListener('scroll', handleAlbumScroll);
    // Add the new listener
    scrollContent.addEventListener('scroll', handleAlbumScroll);
}

/**
 * Handles the scroll event within the album overlay.
 * Toggles a class on the main overlay element based on the scroll position,
 * which triggers the CSS transitions for the compact header.
 */
function handleAlbumScroll() {
    const overlay = document.getElementById('albumOverlay');
    const scrollContent = document.getElementById('album-overlay-scroll-content');
    if (!overlay || !scrollContent) return;

    // The threshold is the point at which you want the header to appear.
    // A value of 60 means after scrolling down 60 pixels.
    const scrollThreshold = 500;

    if (scrollContent.scrollTop > scrollThreshold) {
        overlay.classList.add('is-scrolled');
    } else {
        overlay.classList.remove('is-scrolled');
    }
}

// END: Add these two new functions to script.js
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
  
    updatePlayerUI(); // Sync all player UI
    updateFixedTopHeadingVisibility(); // Sync fixed top heading
}

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
     if (!navigator.onLine) {
        showMessageBox("You're offline. Please connect to the internet to open new albums.", "error");
        return;
    }
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
 if (!navigator.onLine) {
        showMessageBox("You're offline. Please connect to the internet to play music.", "error");
        return;
    }
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
        openAlbumDetails(albumToPlay);

        // Check if it's an embedded album
        if (albumToPlay.rawHtmlEmbed || albumToPlay.fullSoundcloudEmbed || albumToPlay.audiomackEmbed || albumToPlay.iframeSrc) {
            // If it's embedded, immediately update the player state and UI
            console.log("Embedded album play button clicked. Updating main play bar now.");
            playingAlbum = albumToPlay;
            updatePlayerUI(); // This makes the main play bar show the new album
        } else {
            // If it's a regular album with tracks, play the first one
            if (albumToPlay.tracks && albumToPlay.tracks.length > 0) {
                console.log("Tracklist album play button clicked. Playing first track.");
                playTrack(albumToPlay.tracks[0], 0);
            } else {
                console.log("Tracklist album has no tracks to play.");
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


/**
 * Populates the new "Record Breaking Albums" section with data from the "Popular Albums" list.
 */
function populateRecordBreakingSection() {
    const container = document.getElementById('record-breaking-albums-container');
    if (!container) return;

    // --- THIS IS THE CORRECTION ---
    // Define the specific IDs from your "Popular Albums" section in index.html
    const popularAlbumIds = [
        '687a08e6b29a102ef22ed746',
        '68651d36cab7938b8ca9db34',
        '68836d2dda78931723317151',
        '6879064984384901a6506164',
        '68836e34da78931723317155',
        '6871f5a419d863c7966eeef5',
        '6878ffad84384901a650615b',
        '6871f28b19d863c7966eeef3',
         '68836dafda78931723317153',
         '686d4a35d1372a1d73924abc',
         '686d4a35d1372a1d73924cde',
         '6885390563f554c11b55608a',
         '6885436a63f554c11b5560b4'
    ];

    // Filter your main album list to get only these specific albums, preserving their order
    const albumsToShow = popularAlbumIds.map(id => 
        allAlbumsData.find(album => album.id === id)
    ).filter(album => album); // Filter out any undefined albums if an ID wasn't found

    container.innerHTML = ''; // Clear any existing content

    albumsToShow.forEach(album => {
        const card = document.createElement('div');
        card.className = 'mini-album-card card'; // Added 'card' class for click listener
        card.dataset.albumId = album.id;

        card.innerHTML = `
            <img src="${album.coverArt}" alt="${album.title}">
            <div class="card-title">${album.title}</div>
        `;
        container.appendChild(card);
    });
}

function populateRecordBreakingSection2() {
    const container = document.getElementById('record-breaking-albums-container2');
    if (!container) return;

    // --- THIS IS THE CORRECTION ---
    // Define the specific IDs from your "Popular Albums" section in index.html
    const popularAlbumIds = [
        '687212d419d863c7966eeefa',
        
        '6879023b84384901a650615d',
        '686e29e3a8b53196ce754861',
        '687904e784384901a6506160',
        '6879058d84384901a6506162',
        '6879064984384901a6506164',
        '688209e3af4598687700e7cc',
        '687a2595b29a102ef22ed757',
        '687a2595b29a102ef22ed756',
        '687a2595b29a102ef22ed754',

        '687a2595b29a102ef22ed753',
        '68821087af4598687700e7d0'
    ];

    // Filter your main album list to get only these specific albums, preserving their order
    const albumsToShow = popularAlbumIds.map(id => 
        allAlbumsData.find(album => album.id === id)
    ).filter(album => album); // Filter out any undefined albums if an ID wasn't found

    container.innerHTML = ''; // Clear any existing content

    albumsToShow.forEach(album => {
        const card2 = document.createElement('div');
        card2.className = 'mini-album-card2 card2'; // Added 'card2' class for click listener
        card2.dataset.albumId = album.id;

        card2.innerHTML = `
            <img src="${album.coverArt}" alt="${album.title}">
            <div class="card-title2">${album.title}</div>
        `;
        container.appendChild(card2);
    });
}

// Add this line at the top of script.js with your other global variables


// Add this entire new function to script.js
async function populatePlaylistDetails(playlist) {
    currentPlaylistForView = playlist; // Set the global context for other functions
    const overlay = document.getElementById('playlist-details-overlay');
    const scrollContent = document.getElementById('playlist-scroll-content');
    const coverArt = document.getElementById('playlist-cover-art');
    const title = document.getElementById('playlist-title-h1');
    const compactTitle = document.getElementById('playlist-compact-title');
    const creatorName = document.getElementById('playlist-creator-name');
    const creatorAvatar = document.getElementById('playlist-creator-avatar');
    const durationInfo = document.getElementById('playlist-duration-info');
    const backgroundGradient = document.getElementById('playlist-background-gradient');

    if (!overlay || !coverArt || !title || !scrollContent) {
        console.error("One or more elements for the playlist details overlay are missing.");
        return;
    }

    // Reset scroll position and scroll-related classes
    scrollContent.scrollTop = 0;
    overlay.classList.remove('is-scrolled');

    // Populate header info
    const songCount = playlist.songs ? playlist.songs.length : 0;
    const totalSeconds = playlist.songs ? playlist.songs.reduce((acc, s) => acc + parseDurationToSeconds(s.duration), 0) : 0;
    const totalMinutes = Math.round(totalSeconds / 60);

    title.textContent = playlist.name;
    if (compactTitle) compactTitle.textContent = playlist.name;
    if (creatorName) creatorName.textContent = playlist.creatorName || 'Swarify';
    if (creatorAvatar) creatorAvatar.textContent = (playlist.creatorName || 'S').charAt(0).toUpperCase();
    if (durationInfo) durationInfo.textContent = `${totalMinutes} min`;

    coverArt.src = playlist.coverArt || 'https://placehold.co/192x192/4a4a4a/ffffff?text=Playlist';
    
    // Dynamic background color
    coverArt.crossOrigin = "Anonymous";
    const setColor = () => {
        try {
            const colorThief = new ColorThief();
            const dominantColor = colorThief.getColor(coverArt);
            // Use a helper to make the color darker for the background
            const vibrantColor = `rgb(${darkenColor(dominantColor, 0.5).join(',')})`;
            if(backgroundGradient) {
                backgroundGradient.style.setProperty('--playlist-bg-color', vibrantColor);
            }
        } catch (e) {
            console.error("ColorThief error for playlist:", e);
            if(backgroundGradient) {
                // Set a fallback color if ColorThief fails
                backgroundGradient.style.setProperty('--playlist-bg-color', '#2a2a2a');
            }
        }
    };

    if (coverArt.complete) {
        setColor();
    } else {
        coverArt.onload = setColor;
    }

    // Render songs and recommendations using existing functions
    renderPlaylistSongs(playlist);
    fetchAndRenderRecommendedSongs(playlist._id);
    
    // Setup listeners for this specific view (search and scroll)
    setupPlaylistSearchListeners();
    setupPlaylistScrollListener();
}

// Also, add this small helper function if it's not already in your script.js
function darkenColor(rgbArray, factor) {
    return rgbArray.map(color => Math.max(0, Math.floor(color * factor)));
}

/**
 * Sets up the navigation arrows for the new mini-carousel.
 */
function setupMiniCarouselScroll() {
    const container = document.getElementById('record-breaking-albums-container');
    const prevBtn = document.querySelector('.mini-carousel-nav.prev');
    const nextBtn = document.querySelector('.mini-carousel-nav.next');

    if (!container || !prevBtn || !nextBtn) return;

    const scrollAmount = container.querySelector('.mini-album-card').offsetWidth + 24; // Card width + gap

    prevBtn.addEventListener('click', () => {
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });

    nextBtn.addEventListener('click', () => {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });
}

function setupMiniCarouselScroll2() {
    const container = document.getElementById('record-breaking-albums-container2');
    const prevBtn = document.querySelector('.mini-carousel-nav2.prev2');
    const nextBtn = document.querySelector('.mini-carousel-nav2.next2');

    if (!container || !prevBtn || !nextBtn) return;

    // Check if there are any cards before trying to measure one
    const firstCard = container.querySelector('.mini-album-card2').offsetWidth + 24;


    prevBtn.addEventListener('click', () => {
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });

    nextBtn.addEventListener('click', () => {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });
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
                 await loadLatestLikedSongAsFallback();
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
                updateLoginUI(); 
                await loadLatestLikedSongAsFallback();// Ensure UI is updated immediately upon successful Google login
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
                updateLoginUI();
                await loadLatestLikedSongAsFallback(); // Call updateLoginUI here to ensure dropdown updates
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
                updateLoginUI(); 
                await loadLatestLikedSongAsFallback();// Call updateLoginUI here to ensure dropdown updates
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
            await loadLatestLikedSongAsFallback();
            updateLoginUI();
             // Call updateLoginUI here to ensure dropdown updates
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




       // NEW listener for opening the popup (goes in script.js)
document.getElementById('mobile-add-btn').addEventListener('click', function() {
    // This now changes the URL hash, triggering the router in oc.js
    navigateTo('song-actions');
});

// NEW listener for closing the popup (goes in script.js)
document.getElementById('add-popup-overlay').addEventListener('click', function(event) {
    // If the click is on the dark background, go back in history to close it
    if (event.target === this) {
        history.back();
    }
});

        // Intercept any click on + button before other scripts can react
// REPLACE the old document.addEventListener in script.js with this

// This listener correctly navigates to the song-actions route
document.addEventListener("click", function(e) {
    const plusBtn = e.target.closest("#mobile-add-btn");
    if (plusBtn) {
        // Prevent default button behavior
        e.preventDefault();
        
        // Use the router to open the popup, which will change the URL hash
        navigateTo('song-actions');
    }
});
  

// ======== Liked Songs: storage + UI + backend sync ========

// ======== Liked Songs: storage + UI + backend sync ========

const LIKED_STORAGE_KEY = 'swarify_liked_songs_v2';
const API_BASE_URL = "https://music-site-backend.onrender.com"; // Backend server base URL

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





// --- END: REPLACEMENT CODE ---


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

// in script.js

function setupPlaylistSearchListeners() {
    const searchTrigger = document.getElementById('playlist-search-trigger');
    const searchView = document.getElementById('playlist-search-view');
    const searchBackBtn = document.getElementById('playlist-search-back-btn');
    const searchInput = document.getElementById('playlist-search-input');
    const clearSearchBtn = document.getElementById('playlist-clear-search-btn');

    if (!searchTrigger || !searchView || !searchBackBtn || !searchInput || !clearSearchBtn) return;

    // --- CORRECTION 1: Trigger now changes the URL hash ---
    searchTrigger.addEventListener('click', () => {
        // This will change the hash to #playlist-search, which the router will then handle.
        navigateTo('playlist-search'); 
    });

    // --- CORRECTION 2: Back button now uses browser history ---
    searchBackBtn.addEventListener('click', () => {
        // This correctly goes back, removing the #playlist-search from the URL.
        history.back();
    });

    // The rest of the listeners remain the same
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
         openSongOptionsPopup(song, playlistId);
    });

    return songRow;
}
// in script.js

/**
 * A unified function to open the song options popup.
 * It populates the popup with the correct song data and configures its buttons
 * based on whether it was opened from "Liked Songs" or a specific playlist.
 * @param {object} song - The song data object.
 * @param {string|null} [playlistId=null] - The ID of the playlist, if applicable.
 */
function openSongOptionsPopup(song, playlistId = null) {
    const popupBackdrop = document.getElementById('song-options-popup');
    const popupPanel = document.querySelector('.song-options-panel');
    const popupSongCover = document.getElementById('popup-song-cover');
    const popupSongTitle = document.getElementById('popup-song-title');
    const popupSongArtist = document.getElementById('popup-song-artist');
    const removeFromPlaylistBtn = document.getElementById('popup-remove-from-liked');
    const goToAlbumBtn = document.getElementById('popup-go-to-album');

    if (!popupBackdrop || !removeFromPlaylistBtn || !goToAlbumBtn || !popupPanel) return;

    // 1. Populate UI with song details
    popupSongCover.src = song.img || song.coverArt || '';
    popupSongTitle.textContent = song.title;
    popupSongArtist.textContent = song.artist;

    // 2. Configure the action buttons with one-time event listeners
    // By cloning the node, we safely remove any previous listeners
    const newRemoveBtn = removeFromPlaylistBtn.cloneNode(true);
    const newGoToAlbumBtn = goToAlbumBtn.cloneNode(true);
    
    // Configure the "Remove" button based on the context
    if (playlistId) {
        newRemoveBtn.querySelector('span').textContent = 'Remove from this playlist';
        newRemoveBtn.onclick = async () => {
            await removeSongFromPlaylist(playlistId, song);
            history.back(); // Go back to close the popup
        };
    } else { // This is for "Liked Songs"
        newRemoveBtn.querySelector('span').textContent = 'Remove from Liked Songs';
        newRemoveBtn.onclick = () => {
            const likedSong = LikedStore.find(song);
            if (likedSong) {
                backendUnlikeSong(likedSong);
                LikedStore.remove(song);
                showMessageBox(`Removed "${song.title}" from Liked Songs.`, 'success');
                renderLikedSongsOverlay(); // Re-render the list
            }
            history.back(); // Go back to close the popup
        };
    }

    // Configure the "Go to album" button
    newGoToAlbumBtn.onclick = () => {
        const album = allAlbumsData.find(a => a.id === song.albumId);
        if (album) {
            // First, close the popup via history, then navigate to the album.
            // A small delay ensures the navigation doesn't interfere with the closing transition.
            history.back();
            setTimeout(() => openAlbumDetails(album), 50);
        }
    };
    
    removeFromPlaylistBtn.parentNode.replaceChild(newRemoveBtn, removeFromPlaylistBtn);
    goToAlbumBtn.parentNode.replaceChild(newGoToAlbumBtn, goToAlbumBtn);
    
    // 3. Show the popup and update the URL hash
    showSongOptionsPopup(); // This function will now be in oc.js
    navigateTo('song-options'); // This adds the hash to the URL
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
/**
 * Populates a grid element with cloned album cards from a source container on the main page.
 * @param {HTMLElement} gridContainer - The grid element inside the popup to populate.
 * @param {string} sourceSelector - A CSS selector for the source album cards to clone.
 */
function populateRecordBreakingGrid(gridContainer, sourceSelector) {
    if (!gridContainer) {
        console.error("Popup grid container not found.");
        return;
    }

    // 1. Clear any existing content from the popup grid
    gridContainer.innerHTML = '';

    // 2. Find all the source cards on the main page
    const sourceCards = document.querySelectorAll(sourceSelector);

    if (sourceCards.length === 0) {
        gridContainer.innerHTML = '<p class="text-gray-400 text-center col-span-full">No albums to display.</p>';
        return;
    }

    // 3. Loop through each source card, clone it, and add it to the popup
    sourceCards.forEach(sourceCard => {
        const newCard = sourceCard.cloneNode(true);

       newCard.addEventListener('click', () => {
            const albumId = newCard.dataset.albumId;
            const albumData = allAlbumsData.find(a => a.id === albumId);

            if (albumData && typeof openAlbumDetails === 'function') {
                // Just open the album. The browser will correctly handle the history stack.
                // The URL will change from /#record-breaking-1 to /album/your-album-id
                openAlbumDetails(albumData);
            }
        });

        // 5. Append the newly created card to the popup's grid
        gridContainer.appendChild(newCard);
    });
}


// Await all the backend data to load
async function initializeApp() {
    const splashScreen = document.getElementById('splash-screen');
    const container = document.querySelector('.container');

    if (splashScreen) {
        // Ensure splash screen is visible while loading
        splashScreen.classList.remove('hidden'); 
    }
    if (container) {
        // Hide the main content initially to prevent abrupt loading
        container.style.display = 'none';
    }
    
    // Set up the basic player UI and other non-data-dependent elements
    // This is a good place for code that doesn't need to wait for `fetchAlbums`
    if (mainPlayBar) {
        mainPlayBar.style.display = 'none';
    }

    try {
        await fetchAlbums();
       function disablePullToRefresh(elementId) {
            const element = document.getElementById(elementId);
            if (!element) return;
            
            let startY = 0;
            let isTouching = false;
            
            element.addEventListener('touchstart', (e) => {
                if (element.scrollTop === 0) {
                    isTouching = true;
                    startY = e.touches[0].clientY;
                }
            }, { passive: true });

            element.addEventListener('touchmove', (e) => {
                if (!isTouching) return;
                
                const pullDistance = e.touches[0].clientY - startY;
                if (pullDistance > 0 && element.scrollTop === 0) {
                    e.preventDefault();
                }
            }, { passive: false });

            element.addEventListener('touchend', () => {
                isTouching = false;
                startY = 0;
            });
        }
        // --- END OF NEW FUNCTION ---

        // --- Apply the function to ALL scrollable containers in your app ---
        disablePullToRefresh('right');
        disablePullToRefresh('full-screen-player');
        disablePullToRefresh('album-overlay-scroll-content');
        disablePullToRefresh('playlist-scroll-content');
        disablePullToRefresh('likedContent');
        disablePullToRefresh('record-breaking-popup-grid');
        disablePullToRefresh('record-breaking-popup-grid2');
        disablePullToRefresh('album-full-embed-container');
        disablePullToRefresh('unique-search-popup');
        disablePullToRefresh('library-popup');


        window.addEventListener('hashchange', router);
    router();

    document.querySelectorAll('.unique-footer-nav .unique-nav-link').forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const target = link.dataset.target || link.getAttribute('href')?.substring(1);
            if (target) navigateTo(target);
        });
    });

    const backButtons = [
        'close-library-popup', 'unique-close-search-popup', 'mobile-overlay-back',
        'closeLikedSongs', 'close-record-breaking-popup', 'close-record-breaking-popup2',
        'close-playlist-details', 'cancel-new-playlist',
    ];
    backButtons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                history.back();
            });
        }
    });

    const libraryLikedBtn = Array.from(document.querySelectorAll('h3.text-base.font-medium')).find(el => el.textContent.trim() === 'Liked Songs');
    if (libraryLikedBtn) {
        libraryLikedBtn.closest('div').addEventListener('click', () => {
            window.openLikedSongsOverlay();
            if (typeof fetchAndRenderLikedSongs === 'function') fetchAndRenderLikedSongs();
        });
    }

     const closeButtons = document.querySelectorAll('.close-overlay');
    closeButtons.forEach(btn => {
        btn.onclick = () => history.back();
    });
    
 //
// 🔴 IN FILE: oc.js
//

// Inside the DOMContentLoaded event listener...
// Find the setup blocks for the popups.

// ✅ REPLACE your existing setup blocks for both popups with this corrected version:

    // --- Setup for Record Breaking Popup 1 ---
    const listenNowBtn1 = document.querySelector('.listen-now-btn');
    if (listenNowBtn1) {
        listenNowBtn1.addEventListener('click', () => {
            navigateTo('record-breaking-1');
        });
    }
    const closePopupBtn1 = document.getElementById('close-record-breaking-popup');
    if (closePopupBtn1) {
        // Use history.back() to correctly go to the previous state (e.g., an album page).
        closePopupBtn1.addEventListener('click', () => history.back());
    }
    const popupOverlay1 = document.getElementById('record-breaking-popup-overlay');
    if (popupOverlay1) {
        popupOverlay1.addEventListener('click', (e) => {
            if (e.target === popupOverlay1) {
                history.back();
            }
        });
    }

    // --- Setup for Record Breaking Popup 2 ---
    const listenNowBtn2 = document.querySelector('.listen-now-btn2');
    if (listenNowBtn2) {
        listenNowBtn2.addEventListener('click', () => {
            navigateTo('record-breaking-2');
        });
    }
    const closePopupBtn2 = document.getElementById('close-record-breaking-popup2');
    if (closePopupBtn2) {
        // Use history.back() here as well. This will now work.
        closePopupBtn2.addEventListener('click', () => history.back());
    }
    const popupOverlay2 = document.getElementById('record-breaking-popup-overlay2');
    if (popupOverlay2) {
        popupOverlay2.addEventListener('click', (e) => {
            if (e.target === popupOverlay2) { 
                history.back();
            }
        });
    }

 if (mainPlayBar) {
    mainPlayBar.addEventListener('click', (event) => {
        if (event.target.closest('button, input')) {
            return;
        }

        if (playingAlbum) {
            console.log("Play bar clicked. Navigating to #player.");
            if (typeof navigateTo === 'function') {
                navigateTo('player');
            }
        }
    });
}
        if (minimizePlayerBtn) {
             minimizePlayerBtn.addEventListener('click', () => history.back());
            console.log("DOMContentLoaded: minimizePlayerBtn click listener attached.");
        }


        const songOptionsPopupBackdrop = document.getElementById('song-options-popup');
if (songOptionsPopupBackdrop) {
    songOptionsPopupBackdrop.addEventListener('click', (e) => {
        // If the dark overlay itself is clicked, go back in history to close the popup.
        if (e.target === songOptionsPopupBackdrop) {
            history.back();
        }
    });
}

      document.querySelector('.listen-now-btn')?.addEventListener('click', () => navigateTo('record-breaking-1'));
    document.querySelector('.listen-now-btn2')?.addEventListener('click', () => navigateTo('record-breaking-2'));
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
 
      const libraryLink1 = document.querySelector('.unique-footer-nav .unique-nav-item:nth-child(3) a');
  const popup = document.getElementById('library-popup');
  const closeBtn = document.getElementById('close-library-popup');

  if(libraryLink1 && popup && closeBtn) {
    libraryLink1.addEventListener('click', function(e) {
      e.preventDefault();
      popup.classList.remove('hidden');
    });

    closeBtn.addEventListener('click', function() {
      popup.classList.add('hidden');
    });
  }

 // in script.js
const libraryLikedBtn1 = Array.from(document.querySelectorAll('h3.text-base.font-medium')).find(el => el.textContent.trim() === 'Liked Songs');
if (libraryLikedBtn1) {
    libraryLikedBtn1.closest('div').addEventListener('click', () => {
        // This now changes the hash to #liked-songs, which triggers the router.
        navigateTo('liked-songs');
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

            // The code that closed the popup has been removed from here.
        });
    }

    // Call the function to initialize the UI state
    initializeUIState();


    // --- START: NEW CODE BLOCK TO ADD ---
    // Immediately attach a temporary click handler to all cards on the page.
    // This "catches" the very first click and prevents the browser from replaying it later.
    const allInitialCards = document.querySelectorAll('.card');
    allInitialCards.forEach(card => {
        card.addEventListener('click', (event) => {
            // If the main album data hasn't loaded yet, we show a message
            // and prevent the click from doing anything else.
            if (allAlbumsData.length === 0) {
                event.preventDefault();
                event.stopPropagation();
                showMessageBox('Albums are still loading, please wait...', 'info');
            }
        }, { once: true }); // The "{ once: true }" option is crucial. It makes this temporary listener
                           // automatically remove itself after it has been clicked one time.
    });
    // --- END: NEW CODE BLOCK TO ADD ---


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

              populateRecordBreakingSection();
              populateRecordBreakingSection2();
            setupMiniCarouselScroll();
            setupMiniCarouselScroll2();
            attachEventListenersToHtmlCards();
             // This reliably checks if you are on the homepage
if (window.location.pathname === '/' || window.location.pathname === '') {
    await loadPlayerState();
    await loadLatestLikedSongAsFallback();
}
            // Setup horizontal scroll for all three card sections
            setupHorizontalScroll('trending-songs-cards');
            setupHorizontalScroll('popular-albums-cards');
            setupHorizontalScroll('popular-artists-cards');
            // Also for the "more" sections in the overlay
            setupHorizontalScroll('more-trending-songs-cards');
            setupHorizontalScroll('explore-popular-albums-cards');
            setupHorizontalScroll('explore-popular-artists-cards');
            console.log("DOMContentLoaded: Horizontal scroll setup for all card sections.");

        } 
        else {
            console.warn("fetchAlbums function not found. Card event listeners might not be attached.");
        }

        // Set initial volume for the native audio element
        if (volumeBar) {
            audio.volume = parseFloat(volumeBar.value);
            console.log("DOMContentLoaded: Initial native audio volume set.");
        }



// ADD this new listener inside your DOMContentLoaded event

const viewEmbeddedPlayerBtn = document.getElementById('view-embedded-player-btn');
if (viewEmbeddedPlayerBtn) {
    viewEmbeddedPlayerBtn.addEventListener('click', () => {
        // First, hide the full-screen player
        hideFullScreenPlayer();
        // Then, open the album overlay for the currently playing embedded album
        if (playingAlbum) {
            openAlbumDetails(playingAlbum);
        }
    });
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

  
   


    // NEW: Add click listener to the "New playlist" item in the `add-popup-overlay`
  // in script.js, inside the 'DOMContentLoaded' listener

// REPLACE with this version in script.js

const newPlaylistPopupItem = document.querySelector('#add-popup-overlay .swarify-add-popup-item:last-child');
if (newPlaylistPopupItem) {
    newPlaylistPopupItem.addEventListener('click', (e) => {
        e.preventDefault();
        const song = getCurrentSongForLike();
        if (!isLoggedIn()) {
            showMessageBox("You need to log in to create a playlist.", 'error');
            return;
        }

        if (song) {
            localStorage.setItem('songToAddAfterCreatingPlaylist', JSON.stringify(song));
        }

        // This now uses the router to open the popup.
        // The router will automatically handle closing the previous popup and opening the new one.
        navigateTo('new-playlist');
    });
}

   // REPLACE with this version in script.js

if (createNewPlaylistBtn) {
    createNewPlaylistBtn.addEventListener('click', () => {
        const playlistName = newPlaylistNameInput.value.trim() || 'My New Playlist';
        createPlaylist(playlistName);
        // Go back in history to close the popup. The router will handle hiding it.
        history.back();
    });
}

if (cancelNewPlaylistBtn) {
    cancelNewPlaylistBtn.addEventListener('click', () => {
        // Just go back in history to close the popup.
        history.back();
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




 window.addEventListener('beforeunload', savePlayerState);




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
         pushHistoryStateForPopup();
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
    updateBodyForPopups();
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
         const albumOverlay = document.getElementById('albumOverlay'); // Get the album overlay element
    if (!userToken && !albumOverlay.classList.contains('show')) { // <-- ADD THIS CHECK
        openPopup();
    }
    }, 2000);

   if (closePopupButton) {
    closePopupButton.addEventListener('click', () => history.back());
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
        localStorage.removeItem(PLAYER_STATE_KEY); // Remove last played song state

        // Add these lines to fully reset the player
        playingAlbum = null;
        stopAllPlaybackUI();
        if (mainPlayBar) mainPlayBar.style.display = 'none';
        
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

            // After finishing, go back in history instead of closing directly
            history.back();
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
                // Navigate to the new-playlist view
                navigateTo('new-playlist');
            }
        });
    }

  const likedSongsOverlay = document.getElementById('likedSongsOverlay');
    const likedContent = document.getElementById('likedContent');
    const searchInput1 = document.getElementById('likedSongsSearchInput');
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
            searchInput1.focus();
        }
    });

    closeSearchBtn.addEventListener('click', () => {
        likedSongsOverlay.classList.remove('search-active');
        searchInput1.value = '';
        searchInput1.blur();
        searchInput1.dispatchEvent(new Event('input', { bubbles: true }));
    });
    
    // Attach the main close functionality to BOTH close buttons
    const closeLikedSongs = () => {
        const likedOverlay = document.getElementById('likedSongsOverlay');
        if (likedOverlay) {
            likedOverlay.classList.remove('open');
            likedOverlay.setAttribute('aria-hidden', 'true');
        }
    };
   document.getElementById('closeLikedSongs').addEventListener('click', () => history.back());



    searchInput1.addEventListener('input', () => {
        const query = searchInput1.value.toLowerCase().trim();
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
        searchInput1.value = '';
        searchInput1.focus();
        searchInput1.dispatchEvent(new Event('input', { bubbles: true }));
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
    // --- Data for the Carousel ---
  const carouselSongs = [
    {
      albumId: '6871f28b19d863c7966eeef3',
      title: 'Ranjha',
      details: 'Mithoon, Ankit Tiwari, Jeet Gannguli',
      imageUrl: 'https://i.scdn.co/image/ab67616d0000b273773c5f60bcb309ef8802e4ef'
    },
    {
      albumId: '687a08e6b29a102ef22ed746',
      title: 'Aashiqui 2',
      details: 'Mithoon, Ankit Tiwari, Jeet Gannguli',
      imageUrl: 'https://i.scdn.co/image/ab67616d0000b2736404721c1943d5069f0805f3'
    },
    {
      albumId: '6879fa6ab29a102ef22ed744',
      title: 'Saiyaara',
      details: 'Tanishk Bagchi, Faheem Abdullah',
      imageUrl: 'https://i.scdn.co/image/ab67616d00001e02a7e251b543c77a6ed356dfbe'
    },
    {
      albumId: '6879349573d641c48a1ca636',
      title: 'Dhun',
      details: 'Mithoon, Arijit Singh',
      imageUrl: 'https://i.scdn.co/image/ab67616d0000b273781faf59a3cb980fe3b493f8'
    },
    {
      albumId: '687a120cb29a102ef22ed748',
      title: 'JEE NA PAAYE',
      details: 'Haniska Pareek, Priyankit Jaiswal',
      imageUrl: 'https://i.scdn.co/image/ab67616d0000b273bac6fad80a0e81256ee15c40'
    },
    {
      albumId: '68790c3b84384901a650616c',
      title: 'Ishq Bawla',
      details: 'Coke Studio Bharat',
      imageUrl: 'https://i.scdn.co/image/ab67616d0000b273f42805148e916145f858318b'
    }
  ];

  // --- Element References ---
  const carouselContainer = document.querySelector('.trending-carousel-container');
  const slidesContainer = document.querySelector('.carousel-slides');
  const dotsContainer = document.querySelector('.carousel-dots');
  const songTitleEl = document.getElementById('carousel-song-title');
  const songDetailsEl = document.getElementById('carousel-song-details');
  const playBtn = document.getElementById('carousel-play-btn');
  const addBtn = document.getElementById('carousel-add-btn');

  if (!carouselContainer || !slidesContainer) {
    console.error("Carousel elements not found. Carousel will not load.");
    return;
  }

  let currentSlideIndex = 0;
  let slideInterval;

  // --- Variables for Slide/Drag Functionality ---
  let isDown = false;
  let startX;
  let currentTranslate = 0;
  let prevTranslate = 0;

// This new function will control all play/pause buttons on the page
function updateAllPlayButtonStates() {
    // 1. First, determine the single source of truth: Is any player currently playing?
    const isPlayerCurrentlyPlaying = (ytPlayer && ytPlayer.getPlayerState && ytPlayer.getPlayerState() === YT.PlayerState.PLAYING) || (audio && !audio.paused);

    // 2. Update the main playbar button
    const mainPlayIcon = document.getElementById('play-icon');
    const mainPauseIcon = document.getElementById('pause-icon');
    if (mainPlayIcon && mainPauseIcon) {
        mainPlayIcon.classList.toggle('hidden', isPlayerCurrentlyPlaying);
        mainPauseIcon.classList.toggle('hidden', !isPlayerCurrentlyPlaying);
    }
    
    // 3. Update the full-screen player button
    const fullPlayIcon = document.getElementById('full-play-icon');
    const fullPauseIcon = document.getElementById('full-pause-icon');
    if (fullPlayIcon && fullPauseIcon) {
        fullPlayIcon.classList.toggle('hidden', isPlayerCurrentlyPlaying);
        fullPauseIcon.classList.toggle('hidden', !isPlayerCurrentlyPlaying);
    }

    // 4. Update the carousel poster button with its special logic
    const carouselPlayBtn = document.getElementById('carousel-play-btn');
    if (carouselPlayBtn) {
        const playIcon = carouselPlayBtn.querySelector('.play-icon');
        const pauseIcon = carouselPlayBtn.querySelector('.pause-icon');
        const circle = carouselPlayBtn.querySelector('circle');
        if (!playIcon || !pauseIcon || !circle) return;

        const carouselSongData = carouselSongs[currentSlideIndex];
        let isCarouselSongLoaded = false;
        if (playingAlbum && playingAlbum.tracks && typeof currentTrackIndex !== 'undefined') {
            const playingTrack = playingAlbum.tracks[currentTrackIndex];
            if (playingTrack && playingAlbum.id === carouselSongData.albumId && playingTrack.title.toLowerCase() === carouselSongData.title.toLowerCase()) {
                isCarouselSongLoaded = true;
            }
        }

        const isThisSongPlaying = isCarouselSongLoaded && isPlayerCurrentlyPlaying;

        if (isThisSongPlaying) {
            playIcon.classList.add('hidden');
            pauseIcon.classList.remove('hidden');
            
            const activeSlideImage = document.querySelector('.carousel-slide.active img');
            if (activeSlideImage && activeSlideImage.complete) {
                try {
                    const colorThief = new ColorThief();
                    const palette = colorThief.getPalette(activeSlideImage, 5);
                    const bestColor = getBestPaletteColor(palette);
                    const vibrantColor = `rgb(${bestColor[0]}, ${bestColor[1]}, ${bestColor[2]})`;
                    pauseIcon.setAttribute('fill', vibrantColor);
                    circle.setAttribute('stroke', rgb(223,188,115));
                } catch (e) {
                    pauseIcon.setAttribute('fill', '#1ED760'); // Fallback color
                    circle.setAttribute('stroke', '#1ED760');
                }
            } else {
                pauseIcon.setAttribute('fill', '#1ED760'); // Fallback color
                circle.setAttribute('stroke', '#1ED760');
            }
        } else {
            playIcon.classList.remove('hidden');
            pauseIcon.classList.add('hidden');
            playIcon.setAttribute('fill', 'white');
            circle.setAttribute('stroke', '#957e50');
        }
    }
}


  function initCarousel() {
    slidesContainer.innerHTML = '';
    dotsContainer.innerHTML = '';

    carouselSongs.forEach((song, index) => {
      const slide = document.createElement('div');
      slide.className = 'carousel-slide';
      slide.dataset.index = index;
      slide.dataset.albumId = song.albumId;
      slide.innerHTML = `<img src="${song.imageUrl}" alt="${song.title}" loading="lazy" crossorigin="anonymous">`;
      slidesContainer.appendChild(slide);

      const dot = document.createElement('div');
      dot.className = 'carousel-dot';
      dot.dataset.index = index;
      dotsContainer.appendChild(dot);
    });

    addEventListeners();
    showSlide(0, false); // Initial load without animation
    startAutoPlay();
  }

function showSlide(index, animate = true) {
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.carousel-dot');
    const contentOverlay = document.querySelector('.carousel-content-overlay');

    if (index >= slides.length) index = 0;
    if (index < 0) index = slides.length - 1;

    currentSlideIndex = index;

    const offset = -currentSlideIndex * carouselContainer.offsetWidth;
    slidesContainer.style.transition = animate ? 'transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)' : 'none';
    slidesContainer.style.transform = `translateX(${offset}px)`;
    
    prevTranslate = offset;

    const song = carouselSongs[index];
    const activeSlide = slides[index];
    const activeImage = activeSlide.querySelector('img');

    slides.forEach(slide => slide.classList.remove('active'));
    activeSlide.classList.add('active');

    dots.forEach(dot => dot.classList.remove('active'));
    dots[index].classList.add('active');

    // --- START: New Advanced Dynamic Styling Logic ---
    const applyDynamicStyles = () => {
        try {
            const colorThief = new ColorThief();
            // Get a palette of 5 colors from the image
            const palette = colorThief.getPalette(activeImage, 5);
            // Use our helper function to pick the best color from the palette
            const bestColor = getBestPaletteColor(palette);
            
            // Format the chosen color as an RGB string for CSS
            const vibrantColor = `rgb(${bestColor[0]}, ${bestColor[1]}, ${bestColor[2]})`;

            // Apply the vibrant color to the title.
            songTitleEl.style.color = vibrantColor;
            
            // The artist details will remain white for best contrast and hierarchy.
            songDetailsEl.style.color = '#E0E0E0';
            
            // Both will have a strong dark shadow to ensure they are readable on any background.
            songTitleEl.style.textShadow = '0 4px 20px rgba(0, 0, 0, 0.8)';
            songDetailsEl.style.textShadow = '0 2px 8px rgba(0, 0, 0, 0.7)';

        } catch (error) {
            console.error("ColorThief error:", error);
            // Fallback to default white text if there's an error
            songTitleEl.style.color = '#FFFFFF';
            songDetailsEl.style.color = '#E0E0E0';
        }
    };

    if (activeImage.complete) {
        applyDynamicStyles();
    } else {
        activeImage.onload = applyDynamicStyles;
    }
    // --- END: New Advanced Dynamic Styling Logic ---

    contentOverlay.classList.remove('active-content');
    void contentOverlay.offsetWidth;

    songTitleEl.textContent = song.title;
    songDetailsEl.textContent = song.details;

    setTimeout(() => {
        contentOverlay.classList.add('active-content');
    }, 10);
  }

  function nextSlide() {
    showSlide(currentSlideIndex + 1);
  }

  function prevSlide() {
    showSlide(currentSlideIndex - 1);
  }

  function startAutoPlay() {
    clearInterval(slideInterval);
    slideInterval = setInterval(nextSlide, 5000);
  }

  function resetAutoPlay() {
    clearInterval(slideInterval);
    startAutoPlay();
  }

 function addEventListeners() {
    let wasDragged = false; // Flag to distinguish between a click and a drag

    dotsContainer.addEventListener('click', (e) => {
      if (e.target.matches('.carousel-dot')) {
        const index = parseInt(e.target.dataset.index, 10);
        showSlide(index);
        resetAutoPlay();
      }
    });

    // <<< START: MODIFIED & CORRECTED PLAY BUTTON LOGIC >>>
    playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        resetAutoPlay();

        // More reliable way to get current data by querying the DOM for the active slide
        const activeSlide = slidesContainer.querySelector('.carousel-slide.active');
        if (!activeSlide) return;
        const activeIndex = parseInt(activeSlide.dataset.index, 10);
        const songData = carouselSongs[activeIndex];
        
        const albumToPlay = allAlbumsData.find(album => album.id === songData.albumId);

        if (!albumToPlay || !albumToPlay.tracks || albumToPlay.tracks.length === 0) {
            showMessageBox('Album or tracks not available.', 'error');
            return;
        }

        const trackIndex = albumToPlay.tracks.findIndex(track => track.title.toLowerCase() === songData.title.toLowerCase());
        const trackToPlay = trackIndex !== -1 ? albumToPlay.tracks[trackIndex] : albumToPlay.tracks[0];

        // Check if the song we want to play is ALREADY the one playing
        const isThisSongPlayingAndActive = 
            playingAlbum && 
            playingAlbum.id === songData.albumId && 
            currentTrackIndex === (trackIndex === -1 ? 0 : trackIndex);

        if (isThisSongPlayingAndActive) {
            // If it's already the active song, just pause/resume it
            togglePlayback(); 
        } else {
            // Otherwise, open the album details and start the new song
            openAlbumDetails(albumToPlay);
            playTrack(trackToPlay, trackIndex === -1 ? 0 : trackIndex);
        }
    });
    // <<< END: MODIFIED & CORRECTED PLAY BUTTON LOGIC >>>

    addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof showMessageBox === 'function') {
            showMessageBox('"Add to Playlist" functionality can be linked here.', 'info');
        }
        resetAutoPlay();
    });

    

    const getPositionX = (e) => e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
const startSlide = (e) => {
      // --- NEW: This check solves the problem ---
      // If the click/press starts on the buttons, do nothing.
      if (e.target.closest('.carousel-actions')) {
        return;
      }
      // --- End of new code ---

      isDown = true;
      wasDragged = false;
      carouselContainer.classList.add('active-drag');
      startX = getPositionX(e);
      slidesContainer.style.transition = 'none';
      contentOverlay.style.transition = 'none';
      clearInterval(slideInterval);
    };

  const moveSlide = (e) => {
      if (!isDown) return;

      // First, we check if the movement is large enough to be considered a drag.
      if (!wasDragged && Math.abs(getPositionX(e) - startX) > 10) {
          wasDragged = true;
      }

      // --- This is the key change ---
      // We ONLY move the poster visually IF it's a confirmed drag.
      if (wasDragged) {
          e.preventDefault();
          currentTranslate = prevTranslate + getPositionX(e) - startX;
          slidesContainer.style.transform = `translateX(${currentTranslate}px)`;
          contentOverlay.style.transform = `translateX(${currentTranslate}px)`;
      }
    };

 const endSlide = () => {
      if (!isDown) return;
      isDown = false;
      carouselContainer.classList.remove('active-drag');

      // --- START: This is the key correction ---
      // If the user did not drag the poster, we do nothing here.
      // We simply re-enable the CSS transitions and let the 'click' event handler
      // open the album. This prevents the "snap-back" slide animation on a click.
      if (!wasDragged) {
          slidesContainer.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)';
          contentOverlay.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)';
          startAutoPlay();
          return;
      }
      // --- END: Correction ---
      
      // If the user WAS dragging, we proceed with the normal slide/snap logic
      const movedBy = currentTranslate - prevTranslate;
      const threshold = carouselContainer.offsetWidth / 4;

      if (movedBy < -threshold && currentSlideIndex < carouselSongs.length - 1) {
        currentSlideIndex += 1;
      }
      if (movedBy > threshold && currentSlideIndex > 0) {
        currentSlideIndex -= 1;
      }
      
      showSlide(currentSlideIndex);
      startAutoPlay();
    };
    
    carouselContainer.addEventListener('mousedown', startSlide);
    carouselContainer.addEventListener('touchstart', startSlide, { passive: true });

    carouselContainer.addEventListener('mousemove', moveSlide);
    carouselContainer.addEventListener('touchmove', moveSlide, { passive: true });
    
    window.addEventListener('mouseup', endSlide);
    window.addEventListener('touchend', endSlide);
    
    // <<< MODIFIED: This is the corrected click handler for the entire poster >>>
    // We attach it to the main container for reliability
    carouselContainer.addEventListener('click', (e) => {
        if (wasDragged) {
            return; // Don't do anything if the user was dragging
        }
        
        // If the click was on the buttons or dots, let their own handlers work
        if (e.target.closest('.carousel-actions') || e.target.closest('.carousel-dots')) {
            return;
        }

        // Otherwise, open the album for the currently active slide
        const activeSlide = slidesContainer.querySelector('.carousel-slide.active');
        if (activeSlide) {
            const albumId = activeSlide.dataset.albumId;
            const albumData = allAlbumsData.find(album => album.id === albumId);
            if (albumData) {
                openAlbumDetails(albumData);
            }
        }
    });
  }
  

  initCarousel();
audio.addEventListener('play', updateAllPlayButtonStates);
    audio.addEventListener('pause', updateAllPlayButtonStates);
    audio.addEventListener('ended', updateAllPlayButtonStates);






    

// REPLACE the existing 'blur' event listener inside your DOMContentLoaded with this one.

let blurTimeout = null;
window.addEventListener('blur', () => {
    // Use a small timeout because document.activeElement might not update instantly.
    if (blurTimeout) clearTimeout(blurTimeout);
    blurTimeout = setTimeout(() => {
        // Check if the user has clicked inside an iframe
        if (document.activeElement && document.activeElement.tagName === 'IFRAME') {
            // Check if this iframe belongs to the currently VIEWED embedded album.
            if (currentAlbum && currentAlbum.id) {
                const wrapper = iframeCache[currentAlbum.id];
                // Make sure the focused iframe is inside the correct album wrapper
                if (wrapper && wrapper.contains(document.activeElement)) {
                    console.log(`User clicked inside the iframe for album: "${currentAlbum.title}". Updating play bar.`);

                    // If the play bar is already showing this album, no need to do anything.
                    if (playingAlbum && playingAlbum.id === currentAlbum.id) {
                        return;
                    }

                    // --- THIS IS THE FIX ---
                    // Instead of the aggressive stopAllPlaybackUI(), we use a gentler function
                    // that only stops controllable players (like native audio or YouTube API)
                    // without destroying the current UI or removing our new iframe.
                    stopControllablePlayersOnly();

                    // Update the player state and refresh the UI
                    playingAlbum = currentAlbum;
                    currentlyPlayedCardId = currentAlbum.id;
                    updatePlayerUI();
                }
            }
        }
    }, 50);
});

        if (typeof populateRecordBreakingSection === 'function') {
            populateRecordBreakingSection();
        }
        if (typeof populateRecordBreakingSection2 === 'function') {
            populateRecordBreakingSection2();
        }
        if (typeof setupMiniCarouselScroll === 'function') {
            setupMiniCarouselScroll();
        }
        if (typeof setupMiniCarouselScroll2 === 'function') {
            setupMiniCarouselScroll2();
        }
        if (typeof attachEventListenersToHtmlCards === 'function') {
            attachEventListenersToHtmlCards();
        }
        // This reliably checks if you are on the homepage
        if (window.location.pathname === '/' || window.location.pathname === '') {
            await loadPlayerState();
            await loadLatestLikedSongAsFallback();
        }
        // The rest of your existing initialization code goes here:
        // You can copy and paste the rest of your original `DOMContentLoaded` logic here
        // (e.g., setting up scroll listeners, resize listeners, etc.).
    
        if (typeof setupHorizontalScroll === 'function') {
            setupHorizontalScroll('trending-songs-cards');
            setupHorizontalScroll('popular-albums-cards');
            setupHorizontalScroll('popular-artists-cards');
            setupHorizontalScroll('more-trending-songs-cards');
            setupHorizontalScroll('explore-popular-albums-cards');
            setupHorizontalScroll('explore-popular-artists-cards');
        }
    
        window.addEventListener('resize', () => {
            if (typeof toggleMainPlaybarView === 'function') toggleMainPlaybarView();
            if (typeof updateFixedTopHeadingVisibility === 'function') updateFixedTopHeadingVisibility();
        });
        
    } catch (error) {
        console.error("Failed to load initial app data.", error);
    } finally {
        // This block will execute regardless of success or failure.
        // It's the perfect place to hide the splash screen and show the main content.
        if (splashScreen) {
            splashScreen.classList.add('hidden'); // Hide splash screen
        }
        if (container) {
            container.style.display = 'block'; // Show the main content
        }
    }
}

// Ensure the code runs after the DOM is fully loaded.
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});






// ADD this new function anywhere in your script.js file

/**
 * Fetches and displays similar albums specifically for the embedded album view.
 * @param {Object} albumToRecommendFor - The album object to get recommendations for.
 */
// REPLACE this function in your script.js

async function fetchAndDisplayEmbeddedSimilarAlbums(albumToRecommendFor , wrapperElement) {
   // Find the container and section *inside* the specific wrapper for the current album
    const section = wrapperElement.querySelector('#embedded-similar-albums-section');
    const container = wrapperElement.querySelector('#embedded-similar-albums-container');
    
    if (!container || !section) {
        console.error("Could not find recommendation containers within the provided wrapper element.");
        return;
    }

    container.innerHTML = '<p style="color: #b3b3b3; grid-column: 1 / -1; text-align: center;">Loading recommendations...</p>';

    try {
        const artistQuery = encodeURIComponent(albumToRecommendFor.artist || '');
        const genreQuery = encodeURIComponent(albumToRecommendFor.genre || '');
        const currentAlbumId = encodeURIComponent(albumToRecommendFor.id || '');
        
        const fetchURL = `${BACKEND_BASE_URL}/api/recommendations?artist=${artistQuery}&genre=${genreQuery}&exclude=${currentAlbumId}&limit=16`;

        const response = await fetch(fetchURL);
        const similarAlbums = await response.json();

        if (Array.isArray(similarAlbums) && similarAlbums.length > 0) {
            container.innerHTML = '';
            similarAlbums.forEach(album => {
                const cardHtml = createAlbumCardHtml(album);
                container.insertAdjacentHTML('beforeend', cardHtml);
            });
            // Re-attach listeners to the newly created cards
            attachEventListenersToHtmlCards();
        } else {
            container.innerHTML = `<p style="color: #b3b3b3; text-align: center; grid-column: 1 / -1;">No similar albums found.</p>`;
        }
    } catch (error) {
        console.error('ERROR fetching embedded similar albums:', error);
        container.innerHTML = `<p style="color: #ff4d4d; grid-column: 1 / -1; text-align: center;">Could not load recommendations.</p>`;
    }
}

//start-separation------------------------------------------------------------------
