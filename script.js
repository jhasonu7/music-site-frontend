// --- Configuration ---
// IMPORTANT: Replace this with your actual ngrok static domain if you are using ngrok for your backend.
// If your backend is hosted directly (e.g., on Render, Heroku), use that URL.
const BACKEND_BASE_URL = 'https://dfc9de7975ba.ngrok-free.app'; // Example: 'https://your-ngrok-subdomain.ngrok-free.app' or 'https://your-backend-api.com'

// IMPORTANT: Replace this with your actual Netlify frontend domain for CORS setup on the backend.
// This is crucial for your backend's CORS configuration (e.g., in Flask-CORS or Express CORS options)
// It tells your backend which frontend domains are allowed to access its resources.
const NETLIFY_FRONTEND_DOMAIN = 'https://swarify.com'; // e.g., https://my-music-site.netlify.app

// --- DOM Elements (assuming these exist in your HTML) ---
const trendingSongsContainer = document.querySelector('.trending-songs-container'); // Adjust selector as needed
const popularAlbumsContainer = document.querySelector('.popular-albums-container'); // Adjust selector as needed
const popularArtistsContainer = document.querySelector('.popular-artists-container'); // Adjust selector as needed
const errorMessageDisplay = document.getElementById('error-message-display'); // An element to show errors

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
let progressBarInterval = null; // To clear the interval for progress bar updates
let searchMessageTimeout = null; // To clear the timeout for search messages
let searchMessageContainer = null; // Global variable to hold the dynamically created search message container
let lastKnownPlaybackPosition = 0; // Stores the last known playback position for resuming (for controllable players)

let embeddedVideoOverlayContainer = null; // Global variable for the video overlay
let backgroundEmbeddedAlbum = null; // Stores the album data for the embedded content playing in the background
let playingAlbum = null; // NEW: Stores the album object that is currently playing audio (could be embedded or controllable)
let currentUserName = 'Guest'; // NEW: Global variable to store the logged-in user's name

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
const albumPlayButton = document.getElementById('album-play'); // Play button inside album overlay

const playerBar = document.querySelector('.player-bar'); // Get the player-bar element
const playerImg = document.getElementById('player-img'); // Album cover in player bar
const trackTitleDisplay = document.getElementById('track-title'); // Track title in player bar
const trackArtistDisplay = document.getElementById('track-artist'); // Track artist in player bar
const playPauseBtn = document.getElementById('play-pause'); // Play/Pause button in player bar
const progressBar = document.getElementById('progress-bar'); // Progress bar in player bar
const currentTimeDisplay = document.getElementById('current-time'); // Current time in player bar
const durationDisplay = document.getElementById('duration'); // Duration in player bar
const volumeBar = document.getElementById('volume-bar'); // Volume bar in player bar
const nextTrackBtn = document.getElementById('next-track'); // Next track button in player bar
const prevTrackBtn = document.getElementById('prev-track'); // Previous track button in player bar
const repeatBtn = document.getElementById('repeat-btn'); // Repeat button in player bar
const shuffleBtn = document.getElementById('shuffle-btn'); // Shuffle button in player bar
const searchInput = document.getElementById('search-input'); // Search input field
const searchIcon = document.querySelector('.search-icon'); // Search icon button
const playerLeft = document.querySelector('.player-left'); // Get the player-left container (for dynamic embeds)
const spotifyLoginBtn = document.getElementById('spotify-login-btn'); // Spotify Login Button (if it exists)
const playerControls = document.querySelector('.player-center .controls'); // Assuming a container for player controls

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
    if (playerControls) {
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
}

/**
 * Manages the display of a video overlay over player controls when an embedded album is playing.
 * Also applies/removes a yellow border to the player bar.
 * @param {boolean} show - True to show the video overlay and apply border, false to hide it and remove border.
 */
function toggleEmbeddedPlayerVideoOverlay(show) {
    if (!playerBar) {
        console.error("playerBar element not found for video overlay.");
        return;
    }

    if (!embeddedVideoOverlayContainer) {
        embeddedVideoOverlayContainer = document.createElement('div');
        embeddedVideoOverlayContainer.id = 'embedded-video-overlay';
        embeddedVideoOverlayContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 96px; /* player-left width (80px img + 8px padding * 2) */
            right: 0;
            bottom: 0;
            width: calc(100% - 96px); /* Adjust width to cover center and right */
            height: 100%;
            overflow: hidden;
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 5; /* Above player controls but below other critical elements */
            background-color: #000; /* Fallback background */
            border-radius: 8px; /* Match player bar style */
        `;
        playerBar.appendChild(embeddedVideoOverlayContainer);

        const videoElement = document.createElement('video');
        videoElement.id = 'embedded-background-video';
        videoElement.src = 'https://files.catbox.moe/7ixtbj.mp4';
        videoElement.autoplay = true;
        videoElement.loop = true;
        videoElement.muted = true; // Muted for autoplay
        videoElement.playsInline = true; // Important for mobile autoplay
        videoElement.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: cover; /* Cover the container without distortion */
            border-radius: 8px;
            /* No border on videoElement itself, border is on playerBar */
        `;
        embeddedVideoOverlayContainer.appendChild(videoElement);
        console.log("Embedded video overlay created.");
    }

    if (show) {
        embeddedVideoOverlayContainer.style.display = 'flex';
        // Ensure the video is playing if it was paused
        const video = embeddedVideoOverlayContainer.querySelector('video');
        if (video && video.paused) {
            video.play().catch(e => console.warn("Video autoplay failed (might be unmuted):", e));
        }
        console.log("Embedded video overlay shown.");
        // Disable player controls when video overlay is active
        togglePlayerControls(false);
        // Add yellow border to the playerBar
        playerBar.style.boxSizing = 'border-box'; // Ensure border doesn't add to layout size
    } else {
        embeddedVideoOverlayContainer.style.display = 'none';
        const video = embeddedVideoOverlayContainer.querySelector('video');
        if (video) {
            video.pause(); // Pause video when hidden
        }
        console.log("Embedded video overlay hidden.");
        // Re-enable player controls when video overlay is hidden
        togglePlayerControls(true);
        // Remove yellow border from the playerBar
        playerBar.style.border = 'none'; // Remove border from playerBar
    }
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
                    console.log("Spotify player paused.");
                }
            }).catch(e => console.warn("Could not get Spotify player state to pause:", e));
        } catch (e) {
            console.warn("Error pausing Spotify player:", e);
        }
    }
    // Do NOT reset player bar UI or controls here.
    // This function is for stopping audio, not resetting UI state.
    // The UI reset is handled by stopAllPlaybackUI or when a new track is played.
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
    // Clear the backgroundEmbeddedAlbum reference as its playback has been stopped
    backgroundEmbeddedAlbum = null;
    console.log("backgroundEmbeddedAlbum set to null after stopAllPlaybackUI.");
    // NEW: Clear playingAlbum when all playback is stopped
    playingAlbum = null;
    console.log("playingAlbum set to null after stopAllPlaybackUI.");


    // Clear any existing iframe/youtube player div/raw HTML embed from the player-left container (mini-player)
    const existingPlayerContainer = playerLeft.querySelector('#dynamic-player-container');
    if (existingPlayerContainer) {
        existingPlayerContainer.remove();
    }
    const existingYoutubePlayerDiv = playerLeft.querySelector('#youtube-player-container');
    if (existingYoutubePlayerDiv) {
        existingYoutubePlayerDiv.remove();
    }

    // Ensure player image is visible
    if (playerImg) playerImg.style.display = 'block';

    // Reset progress bar and time displays
    if (progressBarInterval) {
        clearInterval(progressBarInterval);
        progressBarInterval = null;
    }
    if (progressBar) progressBar.value = 0;
    if (currentTimeDisplay) currentTimeDisplay.textContent = '0:00';
    if (durationDisplay) durationDisplay.textContent = '0:00';
    if (playPauseBtn) playPauseBtn.innerHTML = '&#9658;'; // Set to play icon (triangle)

    togglePlayerControls(true); // Re-enable controls when stopping all playback
    toggleEmbeddedPlayerVideoOverlay(false); // <--- Hide video overlay when stopping all playback
    console.log("Player controls re-enabled.");
}


// Plays a specific track, handling different media types (YouTube, Spotify, SoundCloud, native audio).
// It updates the player bar UI and manages the progress bar.
async function playTrack(track, indexInAlbum, initialSeekTime = 0) { // Added initialSeekTime parameter
    if (!track) {
        console.error("Attempted to play null or undefined track.");
        return;
    }

    // Determine if the track is an embedded type that we cannot control via API
    const isControllableEmbeddedTrack = (track.iframeSrc && track.iframeSrc.includes('https://www.youtube.com/embed/')) || track.spotifyUri;
    const isNonControllableEmbeddedTrack = track.rawHtmlEmbed || track.soundcloudEmbed || track.audiomackEmbed || track.fullSoundcloudEmbed;

    // Playback is stopped ONLY when a new controllable track is explicitly played.
    // This ensures only one controllable audio source is active.
    // Also stop if we are switching from an embedded to a controllable track.
    if (track.src || isControllableEmbeddedTrack) {
        stopAllPlaybackUI();
        console.log("stopAllPlaybackUI called before playing new controllable track.");
        playingAlbum = currentAlbum; // NEW: Set playingAlbum for controllable tracks
        console.log("playingAlbum set to currentAlbum for controllable track:", playingAlbum);
    } else {
        // For non-controllable embedded tracks (e.g., raw HTML embeds),
        // we do NOT stop previous playback here. The user interaction layer
        // (firstClickEmbedHandler for full embeds) is responsible for stopping
        // controllable players.
        console.log("Not calling stopAllPlaybackUI for non-controllable embedded track. User interaction layer handles stopping for full embeds.");
        playingAlbum = currentAlbum; // NEW: Set playingAlbum for non-controllable embedded tracks
        console.log("playingAlbum set to currentAlbum for non-controllable embedded track:", playingAlbum);
    }


    // Update global current track index
    if (currentAlbum && indexInAlbum !== undefined) {
        currentTrackIndex = indexInAlbum;
    }

    // Update player bar UI (common for all types)
    if (playerImg) playerImg.src = track.img || 'https://placehold.co/80x80/000000/FFFFFF?text=Track'; // Fallback image
    if (trackTitleDisplay) trackTitleDisplay.textContent = track.title || 'Unknown Title';
    if (trackArtistDisplay) trackArtistDisplay.textContent = track.artist || 'Unknown Artist';

    // --- Play Raw HTML Embed (e.g., Spotify iframe for playlists) or Audiomack/SoundCloud (non-controllable) ---
    // For these, we only update the mini-player visually, and the full embed is handled by openAlbumDetails.
    if (isNonControllableEmbeddedTrack) {
        console.log("Playing via Non-Controllable Embed (Player Bar):", track.title);
        // Ensure player image is visible and any dynamic mini-player iframe is removed
        if (playerImg) playerImg.style.display = 'block';
        const existingPlayerContainer = playerLeft.querySelector('#dynamic-player-container');
        if (existingPlayerContainer) existingPlayerContainer.remove();
        const existingYoutubePlayerDiv = playerLeft.querySelector('#youtube-player-container');
        if (existingYoutubePlayerDiv) existingYoutubePlayerDiv.remove();

        // Update player bar UI for visual info only
        if (playPauseBtn) playPauseBtn.innerHTML = '&#10074;&#10074;'; // Pause icon
        if (progressBar) progressBar.value = 0; // Cannot get real progress
        if (currentTimeDisplay) currentTimeDisplay.textContent = '0:00';
        if (durationDisplay) durationDisplay.textContent = 'N/A';

        togglePlayerControls(false); // Disable main controls for embedded content as they cannot control the iframe
    }
    // --- Play Spotify Track (via SDK) ---
    else if (track.spotifyUri && spotifyPlayer && spotifyAccessToken && spotifyDeviceId) {
        console.log("Playing via Spotify Web Playback SDK:", track.spotifyUri);
        // Ensure player image is hidden and a dynamic mini-player container is created for the SDK player
        if (playerImg) playerImg.style.display = 'none';
        const existingPlayerContainer = playerLeft.querySelector('#dynamic-player-container');
        if (existingPlayerContainer) existingPlayerContainer.remove();
        const existingYoutubePlayerDiv = playerLeft.querySelector('#youtube-player-container');
        if (existingYoutubePlayerDiv) existingYoutubePlayerDiv.remove();

        // Spotify SDK doesn't need a visible iframe in the mini-player, it's controlled internally.
        // We just hide the album art and let the track info show.
        // No dynamic player container needed here for SDK.

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
                showMessageBox('Failed to play Spotify track. Please ensure Spotify is open and you are logged in, or try logging in again.', 'error');

                if (response.status === 401) { // Token expired or invalid
                    spotifyAccessToken = null; // Clear token
                }
                if (playPauseBtn) playPauseBtn.innerHTML = '&#9658;';
                togglePlayerControls(true); // Re-enable if playback fails
                return;
            }
            console.log('Spotify track started successfully.');
            if (playPauseBtn) playPauseBtn.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="#1ED760"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'; // Green pause icon
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
                            if (currentTimeDisplay) currentTimeDisplay.textContent = formatTime(currentTime);
                            if (durationDisplay) durationDisplay.textContent = formatTime(duration);
                            if (progressBar) {
                                progressBar.max = duration;
                                progressBar.value = currentTime;
                            }
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
                            // Only stop playback if there's no next track and not repeating/shuffling
                            if (!(currentAlbum && currentAlbum.tracks && currentTrackIndex < currentAlbum.tracks.length - 1)) {
                                // This block will be reached if it's the last song and not repeating/shuffling
                                // So, we will let the player stay in its "ended" state without explicitly calling stopAllPlaybackUI here.
                            }
                        }
                    }
                }
            }, 1000);

        } catch (error) {
            console.error("Error playing Spotify track:", error);
            showMessageBox("Error playing Spotify track. Please ensure Spotify is open and you are logged in.", 'error');
            if (playPauseBtn) playPauseBtn.innerHTML = '&#9658;';
            togglePlayerControls(true); // Re-enable if playback fails
        }

    } else if (track.iframeSrc && track.iframeSrc.includes('https://www.youtube.com/embed/')) {
        console.log("Playing via YouTube iframe API:", track.iframeSrc);

        const videoIdMatch = track.iframeSrc.match(/\/embed\/([a-zA-Z0-9_-]+)/);
        const videoId = videoIdMatch ? videoIdMatch[1] : null;
        if (videoId && typeof YT !== 'undefined' && YT.Player) {
            // Hide the player image
            if (playerImg) playerImg.style.display = 'none';

            // Create a div placeholder for the YouTube player
            const playerDiv = document.createElement('div');
            playerDiv.id = 'youtube-player-container'; // Fixed ID for easier selection/removal
            playerDiv.style.width = '80px'; // Match player-img width
            playerDiv.style.height = '80px'; // Match player-img height
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
                        if (playPauseBtn) playPauseBtn.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="#1ED760"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'; // Green pause icon
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
                                    if (currentTimeDisplay) currentTimeDisplay.textContent = formatTime(currentTime);
                                    if (durationDisplay) durationDisplay.textContent = formatTime(duration);
                                    if (progressBar) {
                                        progressBar.max = duration;
                                        progressBar.value = currentTime;
                                    }
                                }
                            }
                        }, 1000); // Update every second
                    },
                    'onStateChange': (event) => {
                        if (event.data === YT.PlayerState.PLAYING) {
                            if (playPauseBtn) playPauseBtn.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="#1ED760"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
                        } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
                            if (playPauseBtn) playPauseBtn.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="#1ED760"><path d="M8 5v14l11-7z"/></svg>';
                            if (event.data === YT.PlayerState.ENDED) {
                                // Handle track ending for YouTube player
                                if (isRepeat) {
                                    ytPlayer.seekTo(0);
                                    ytPlayer.playVideo();
                                } else if (isShuffle) {
                                    currentTrackIndex = Math.floor(Math.random() * currentAlbum.tracks.length);
                                    playTrack(currentAlbum.tracks[currentTrackIndex], currentTrackIndex);
                                } else {
                                    // Only stop playback if there's no next track and not repeating/shuffling
                                    if (!(currentAlbum && currentAlbum.tracks && currentTrackIndex < currentAlbum.tracks.length - 1)) {
                                        console.log("YouTube track ended, no auto-advance/repeat/shuffle. Player remains in ended state.");
                                    }
                                }
                            }
                        }
                        updateTrackHighlightingInOverlay(); // Update highlighting on state change
                    },
                    'onError': (event) => {
                        console.error("YouTube Player Error:", event.data);
                        showMessageBox("Error playing YouTube video. It might be unavailable or restricted.", 'error');
                        if (playPauseBtn) playPauseBtn.innerHTML = '&#9658;';
                        togglePlayerControls(true); // Re-enable if playback fails
                    }
                }
            });
        } else {
            console.warn("YouTube video ID not found or YouTube API not loaded.", track.iframeSrc);
            showMessageBox("Could not load YouTube player. Please try again later.", 'error');
            if (playPauseBtn) playPauseBtn.innerHTML = '&#9658;';
            togglePlayerControls(true); // Re-enable controls if playback fails
        }
    } else {
        // Play using the standard audio element
        audio.src = track.src;
        audio.currentTime = initialSeekTime;
        audio.play();
        if (playPauseBtn) playPauseBtn.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="#1ED760"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'; // Green Pause icon
        togglePlayerControls(true); // Enable controls for native audio

        audio.onloadedmetadata = () => {
            if (durationDisplay) durationDisplay.textContent = formatTime(audio.duration);
            if (progressBar) progressBar.max = audio.duration;
            if (progressBar) progressBar.value = audio.currentTime;

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
                if (currentTimeDisplay) currentTimeDisplay.textContent = formatTime(audio.currentTime);
                if (progressBar) progressBar.value = audio.currentTime;
                lastKnownPlaybackPosition = audio.currentTime;
            }
        }, 1000);
        audio.onended = () => {
            // This event listener is primarily for native audio. YouTube/Spotify APIs handle their own 'ended' state.
            if (!currentAlbum || !currentAlbum.tracks || currentAlbum.tracks.length === 0) return;

            // If the current track is an embed, we cannot auto-advance/repeat via this event.
            if (currentAlbum.tracks[currentTrackIndex]?.rawHtmlEmbed || currentAlbum.tracks[currentTrackIndex]?.soundcloudEmbed || currentAlbum.tracks[currentTrackIndex]?.audiomackEmbed || currentAlbum.tracks[currentTrackIndex]?.fullSoundcloudEmbed) {
                console.warn("Auto-advance/repeat is not supported for raw HTML, SoundCloud, or Audiomack embedded content.");
                // We don't call stopAllPlaybackUI here, as the embedded player might still be playing in the background.
                return;
            }
            if (isRepeat) {
                playTrack(currentAlbum.tracks[currentTrackIndex], currentTrackIndex); // Repeat current track
            } else if (isShuffle) {
                currentTrackIndex = Math.floor(Math.random() * currentAlbum.tracks.length);
                playTrack(currentAlbum.tracks[currentTrackIndex], currentTrackIndex);
            } else {
                currentTrackIndex++;
                // Only play next track if it exists
                if (currentAlbum.tracks[currentTrackIndex]) {
                    playTrack(currentAlbum.tracks[currentTrackIndex], currentTrackIndex);
                } else {
                    // If no next track and not repeating/shuffling, just let it end.
                    console.log("Native audio track ended, no auto-advance/repeat/shuffle. Player remains in ended state.");
                }
            }
        };
    }
    // Call the new highlighting function after playback starts/changes
    updateTrackHighlightingInOverlay();
    // Update the main album play button icon
    updateAlbumPlayButtonIcon();
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
            iconCell.innerHTML = i + 1; // Default to track number
            iconCell.classList.remove('playing-icon-container', 'paused-icon-container');
        }

        const isCurrentTrack = (currentAlbum && i === currentTrackIndex);

        if (isCurrentTrack && trackInRow) {
            let isPlaying = false;
            let isPaused = false;

            // Check native audio state
            if (audio.src === trackInRow.src) {
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

            if (isPlaying) {
                row.classList.add('playing');
                row.style.backgroundColor = '#25934cff';
                row.style.color = '#1ED760';
                row.querySelectorAll('td').forEach(td => td.style.color = '#1ED760');

                if (iconCell) {
                    iconCell.classList.add('playing-icon-container');
                    // Check if it's a native audio track
                    if (audio.src === trackInRow.src) {
                        iconCell.innerHTML = ''; // Hide the number/icon for playing native audio
                    } else {
                        // For other playing types (YouTube, Spotify), keep the green pause icon
                        iconCell.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="#1ED760"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
                    }
                }
            } else if (isPaused) {
                row.classList.add('paused');
                row.style.backgroundColor = row.classList.contains('highlighted-search-result') ? 'rgba(30, 215, 96, 0.3)' : 'transparent';
                row.style.color = '#1ED760';
                row.querySelectorAll('td').forEach(td => td.style.color = '#1ED760');
                if (iconCell) {
                    // Green play icon for paused state
                    iconCell.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24" fill="#1ED760"><path d="M8 5v14l11-7z"/></svg>`;
                    iconCell.classList.add('paused-icon-container');
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
        if (audio.src === currentTrack.src && !audio.paused) {
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


// --- Player Controls (Play/Pause, Next, Previous, Volume, Progress) ---

if (playPauseBtn) {
    playPauseBtn.addEventListener('click', async () => {
        if (ytPlayer && currentAlbum && currentAlbum.tracks[currentTrackIndex]?.iframeSrc) {
            // Control YouTube player play/pause
            const playerState = ytPlayer.getPlayerState();
            if (playerState === YT.PlayerState.PLAYING) {
                ytPlayer.pauseVideo();
                playPauseBtn.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="#1ED760"><path d="M8 5v14l11-7z"/></svg>'; // Green Play icon
            } else {
                ytPlayer.playVideo();
                playPauseBtn.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="#1ED760"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'; // Green Pause icon
            }
        } else if (spotifyPlayer && currentAlbum && currentAlbum.tracks[currentTrackIndex]?.spotifyUri) {
            // Control Spotify player play/pause
            const state = await spotifyPlayer.getCurrentState();
            if (state) {
                await spotifyPlayer.togglePlay();
                if (state.paused) { // If it was paused, it will now play
                    playPauseBtn.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="#1ED760"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'; // Green Pause icon
                } else { // If it was playing, it will now pause
                    playPauseBtn.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="#1ED760"><path d="M8 5v14l11-7z"/></svg>'; // Green Play icon
                }
            } else {
                // If no state (e.g., Spotify not playing anything), try to play the current track
                playTrack(currentAlbum.tracks[currentTrackIndex], currentTrackIndex);
            }
        } else if (audio.src) { // Check if native audio has a source loaded
            if (audio.paused || audio.ended) {
                audio.play();
                playPauseBtn.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="#1ED760"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'; // Green Pause icon
            } else {
                audio.pause();
                playPauseBtn.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="#1ED760"><path d="M8 5v14l11-7z"/></svg>'; // Green Play icon
            }
        } else if (currentAlbum && (currentAlbum.tracks[currentTrackIndex]?.rawHtmlEmbed || currentAlbum.tracks[currentTrackIndex]?.soundcloudEmbed || currentAlbum.tracks[currentTrackIndex]?.audiomackEmbed || currentAlbum.tracks[currentTrackIndex]?.fullSoundcloudEmbed)) {
            // This click will not control the embedded iframe.
            console.log("Play/Pause button clicked for embedded content (Spotify/SoundCloud/Audiomack), but direct control is not possible.");
            // Example: Add a temporary class for a visual "press" effect
            playPauseBtn.classList.add('clicked-effect');
            setTimeout(() => {
                playPauseBtn.classList.remove('clicked-effect');
            }, 200); // Remove class after 200ms for a brief effect
        } else if (currentAlbum && currentAlbum.tracks && currentAlbum.tracks.length > 0) {
            // If nothing is loaded yet, try to play the first track of the current album
            playTrack(currentAlbum.tracks[currentTrackIndex], currentTrackIndex);
        }
        // Update the main album play button icon after player state change
        updateAlbumPlayButtonIcon();
        updateTrackHighlightingInOverlay(); // Update track highlighting in overlay
    });
}

/**
 * Function to go to the next track in the current album.
 */
function nextTrack() {
    console.log("nextTrack called.");
    if (!currentAlbum || !currentAlbum.tracks || currentAlbum.tracks.length === 0) {
        // If it's an album that is itself a rawHtmlEmbed (like a playlist),
        // we can't 'next track' within it from our controls.
        if (currentAlbum && (currentAlbum.rawHtmlEmbed || currentAlbum.rawHtmlEmbed || currentAlbum.fullSoundcloudEmbed || currentAlbum.audiomackEmbed || currentAlbum.soundcloudEmbed)) {
            console.log("Next track button clicked for embedded content (Spotify/SoundCloud/Audiomack), but direct control is not possible.");
            // Add visual effect for click
            nextTrackBtn.classList.add('clicked-effect');
            setTimeout(() => {
                nextTrackBtn.classList.remove('clicked-effect');
            }, 200);
        }
        return;
    }

    if (isShuffle) {
        currentTrackIndex = Math.floor(Math.random() * currentAlbum.tracks.length);
    } else if (currentTrackIndex < currentAlbum.tracks.length - 1) { // Changed condition for next track
        currentTrackIndex++;
    } else if (isRepeat) { // If repeat is on and at last song, go to first
        currentTrackIndex = 0;
    } else {
        // If not repeat or shuffle and at end, do not stop playback explicitly.
        // Let the current player finish naturally.
        console.log("No next track and not repeating/shuffling. Playback will continue until current track ends.");
        return; // Exit if no next track and not repeating/shuffling
    }
    playTrack(currentAlbum.tracks[currentTrackIndex], currentTrackIndex);
}

/**
 * Function to go to the previous track in the current album.
 */
function prevTrack() {
    console.log("prevTrack called.");
    if (!currentAlbum || !currentAlbum.tracks || currentAlbum.tracks.length === 0) {
        if (currentAlbum && (currentAlbum.rawHtmlEmbed || currentAlbum.fullSoundcloudEmbed || currentAlbum.tracks[currentTrackIndex]?.audiomackEmbed || currentAlbum.soundcloudEmbed)) {
            console.log("Previous track button clicked for embedded content (Spotify/SoundCloud/Audiomack), but direct control is not possible.");
            prevTrackBtn.classList.add('clicked-effect');
            setTimeout(() => {
                prevTrackBtn.classList.remove('clicked-effect');
            }, 200);
        }
        return;
    }

    if (isShuffle) {
        currentTrackIndex = Math.floor(Math.random() * currentAlbum.tracks.length);
    } else if (currentTrackIndex > 0) {
        currentTrackIndex--;
    } else if (isRepeat) { // If repeat is on and at first song, go to last
        currentTrackIndex = currentAlbum.tracks.length - 1;
    } else {
        // If not repeat or shuffle and at beginning, do not stop playback explicitly.
        console.log("No previous track and not repeating/shuffling. Playback will continue until current track ends.");
        return; // Exit if no previous track and not repeating/shuffling
    }
    playTrack(currentAlbum.tracks[currentTrackIndex], currentTrackIndex);
}

if (prevTrackBtn) {
    prevTrackBtn.addEventListener('click', prevTrack);
}

if (nextTrackBtn) { // Added missing event listener for next track button
    nextTrackBtn.addEventListener('click', nextTrack);
}

if (progressBar) {
    progressBar.addEventListener('input', async (e) => {
        if (ytPlayer && currentAlbum && currentAlbum.tracks[currentTrackIndex]?.iframeSrc) {
            // Control YouTube player progress
            const seekTime = parseFloat(e.target.value);
            ytPlayer.seekTo(seekTime, true); // true for allowSeekAhead
            lastKnownPlaybackPosition = seekTime;
        } else if (spotifyPlayer && currentAlbum && currentAlbum.tracks[currentTrackIndex]?.spotifyUri) {
            // Control Spotify player progress
            const seekTimeMs = parseFloat(e.target.value) * 1000; // Convert seconds to milliseconds
            await spotifyPlayer.seek(seekTimeMs);
            lastKnownPlaybackPosition = parseFloat(e.target.value);
        } else if (audio.duration) {
            // Control native audio progress
            audio.currentTime = parseFloat(e.target.value);
            lastKnownPlaybackPosition = audio.currentTime;
        } else if (currentAlbum && (currentAlbum.tracks[currentTrackIndex]?.rawHtmlEmbed || currentAlbum.tracks[currentTrackIndex]?.soundcloudEmbed || currentAlbum.tracks[currentTrackIndex]?.audiomackEmbed || currentAlbum.tracks[currentTrackIndex]?.fullSoundcloudEmbed)) {
            // No direct control for embedded iframes, so we don't allow seeking.
            console.log("Seeking not possible for embedded content (Spotify/SoundCloud/Audiomack).");
        }
    });
}

if (volumeBar) {
    volumeBar.addEventListener('input', (e) => {
        const volume = parseFloat(e.target.value);
        if (isNaN(volume)) return;

        if (ytPlayer && currentAlbum && currentAlbum.tracks[currentTrackIndex]?.iframeSrc) {
            // Control YouTube player volume (0-100)
            ytPlayer.setVolume(volume * 100);
        } else if (spotifyPlayer && currentAlbum && currentAlbum.tracks[currentTrackIndex]?.spotifyUri) {
            // Control Spotify player volume (0-1)
            spotifyPlayer.setVolume(volume);
        } else if (currentAlbum && (currentAlbum.tracks[currentTrackIndex]?.rawHtmlEmbed || currentAlbum.tracks[currentTrackIndex]?.soundcloudEmbed || currentAlbum.tracks[currentTrackIndex]?.audiomackEmbed || currentAlbum.tracks[currentTrackIndex]?.fullSoundcloudEmbed)) {
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

// Repeat and Shuffle Buttons (assuming they exist in HTML)
if (repeatBtn) {
    repeatBtn.addEventListener('click', () => {
        isRepeat = !isRepeat;
        repeatBtn.classList.toggle('active', isRepeat);
        // Ensure shuffle is off if repeat is on
        if (isRepeat && isShuffle) {
            isShuffle = false;
            if (shuffleBtn) shuffleBtn.classList.remove('active');
        }
        console.log("Repeat mode:", isRepeat ? "On" : "Off");
    });
}

if (shuffleBtn) {
    shuffleBtn.addEventListener('click', () => {
        isShuffle = !isShuffle;
        shuffleBtn.classList.toggle('active', isShuffle);
        // Ensure repeat is off if shuffle is on
        if (isShuffle && isRepeat) {
            isRepeat = false;
            if (repeatBtn) repeatBtn.classList.remove('active'); // Corrected: should remove 'active' from repeatBtn
        }
        console.log("Shuffle mode:", isShuffle ? "On" : "Off");
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
    const albumCards = document.querySelectorAll('.spotifyPlaylists .card, .AlbumPlaylists .card'); // Select all cards in both sections
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
 * This function attempts to find the album by its title and artist from the HTML.
 * Playback is NOT stopped by this function.
 * @param {Event} event
 */
function handleCardClick(event) {
    // Prevent opening the album details if the play button was clicked
    if (event.target.closest('.card-play-button')) {
        return; // Let the play button's specific handler take over
    }

    const card = event.currentTarget; // The .card element itself
    const cardTitleElement = card.querySelector('.card-title');
    const cardArtistElement = card.querySelector('.card-artists');
    const cardTitle = cardTitleElement ? cardTitleElement.textContent.trim() : '';
    const cardArtist = cardArtistElement ? cardArtistElement.textContent.trim() : '';

    console.log(`handleCardClick: Clicked card has Title='${cardTitle}', Artist='${cardArtist}'`);

    if (!cardTitle || !cardArtist) {
        console.warn("Card clicked, but could not extract title or artist from HTML. Cannot open album details.");
        showMessageBox('Album details not found (missing title/artist in card HTML).', 'error');
        return;
    }

    // Find the corresponding album data from the fetched allAlbumsData using title and artist
    const albumToOpen = allAlbumsData.find(album =>
        (album.title && album.title.toLowerCase() === cardTitle.toLowerCase()) &&
        (album.artist && album.artist.toLowerCase() === cardArtist.toLowerCase())
    );

    if (albumToOpen) {
        console.log(`handleCardClick: Found album in allAlbumsData: ${albumToOpen.title} by ${albumToOpen.artist}`);
        openAlbumDetails(albumToOpen);
    } else {
        console.warn(`handleCardClick: Album data not found in backend for HTML card: "${cardTitle}" by "${cardArtist}". Data might not be loaded or ID incorrect. allAlbumsData length: ${allAlbumsData.length}`);
        showMessageBox('Album details not found for this card. Data might not be loaded or ID incorrect.', 'error');
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
            backgroundEmbeddedAlbum = albumToPlay; // NEW: Set backgroundEmbeddedAlbum here
            playingAlbum = albumToPlay; // NEW: Set playingAlbum here
        } else {
            console.log("Non-embedded album play button clicked. Not stopping playback yet, waiting for track click.");
            // For non-embedded albums, playingAlbum is only set when a track is clicked.
        }
        openAlbumDetails(albumToPlay); // Open the album details overlay
        if (albumToPlay.rawHtmlEmbed || albumToPlay.fullSoundcloudEmbed || albumToPlay.audiomackEmbed || albumToPlay.iframeSrc) {
            console.log("Embedded album play button clicked, letting firstClickEmbedHandler manage play.");
        } else {
            console.log("Non-embedded album play button clicked. Autoplay prevented. Click a track to start playing!", 'info');
        }
    } else {
        console.warn(`handlePlayButtonClick: Album with ID ${albumId} not found when trying to play. allAlbumsData length: ${allAlbumsData.length}`);
        showMessageBox('Could not find album to play. Data might not be loaded or ID incorrect.', 'error');
    }
}


// --- Fetch Albums from Backend ---
async function fetchAlbums() {
    console.log("fetchAlbums: Starting album data fetch...");
    showMessageBox('Loading albums data...', 'info');
    try {
        console.log(`fetchAlbums: Attempting to fetch from: ${BACKEND_BASE_URL}/api/albums`);
        const response = await fetch(`${BACKEND_BASE_URL}/api/albums`, {
            method: 'GET',
            headers: {
                'ngrok-skip-browser-warning': 'true', // Crucial for ngrok free plan
                'Content-Type': 'application/json'
            }
        });
        console.log("fetchAlbums: Fetch response received.");

        if (!response.ok) {
            const errorText = await response.text(); // Read error response as text
            throw new Error(`HTTP error! status: ${response.status}. Details: ${errorText.substring(0, 200)}...`);
        }

        const rawAlbumsData = await response.json();
        console.log("fetchAlbums: Raw album data received from backend:", rawAlbumsData);

        // --- IMPORTANT CHANGE: Map _id to id for consistency and parse track durations ---
        allAlbumsData = rawAlbumsData.map(album => {
            const albumId = album._id && typeof album._id === 'object' && album._id.$oid
                ? album._id.$oid // Value if true
                : album._id; // Value if false

            // Process tracks to ensure duration is a number
            const processedTracks = album.tracks ? album.tracks.map(track => {
                const durationInSeconds = parseDurationToSeconds(track.duration);
                // NEW: Added logging here to see raw and parsed duration
                console.log(`Processing track "${track.title}": Raw duration from backend: "${track.duration}" (Type: ${typeof track.duration}), Parsed duration (seconds): ${durationInSeconds}`);
                return {
                    ...track,
                    duration: durationInSeconds
                };
            }) : [];

            return {
                ...album, // Copy all existing properties
                id: albumId, // Add an 'id' property with the string representation of _id
                tracks: processedTracks // Use the processed tracks array
            };
        });
        console.log("fetchAlbums: Albums data transformed and stored. Total albums:", allAlbumsData.length); // Log all fetched data

        // Remove any previous error message if fetch was successful
        const existingErrorMessage = document.querySelector('.backend-error-message');
        if (existingErrorMessage) {
            existingErrorMessage.remove();
        }

        showMessageBox('Album data loaded successfully!', 'success');
        // IMPORTANT: We no longer dynamically create HTML cards here.
        // We only attach listeners to the *existing* HTML cards.
        attachEventListenersToHtmlCards();
    } catch (error) {
        console.error("fetchAlbums: Error fetching albums data:", error);
        const mainContentArea = document.querySelector('.main-content'); // Or a more specific container where you want to show the error
        if (mainContentArea) {
            // Create the error message div dynamically
            let errorMessageDiv = mainContentArea.querySelector('.backend-error-message');
            if (!errorMessageDiv) {
                errorMessageDiv = document.createElement('div');
                errorMessageDiv.classList.add('backend-error-message'); // Add a class for easier identification and removal
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
                mainContentArea.prepend(errorMessageDiv); // Prepend to appear at the top of content
            }

            errorMessageDiv.innerHTML = `
                <p>Failed to load album data from backend. Please ensure your backend server is running and accessible at:</p>
                <p style="font-weight: bold; color: #1ED760;">${BACKEND_BASE_URL}</p>
                <p>Error: ${error.message}</p>
            `;
        }
        showMessageBox(`Failed to load albums data: ${error.message}`, 'error');
    }
}


// --- Search functionality to open album and track by name ---
let debounceTimer;
const DEBOUNCE_DELAY = 300; // milliseconds

/**
 * Displays a message near the search input.
 * @param {string} message - The message to display.
 * @param {string} type - 'info' or 'error' for styling.
 */
function displaySearchMessage(message, type = 'info') {
    // If the container doesn't exist, create it and append it
    if (!searchMessageContainer) {
        searchMessageContainer = document.createElement('div');
        searchMessageContainer.id = 'search-message-container'; // Assign the ID for consistency
        searchMessageContainer.style.cssText = `
            position: fixed; /* Changed to fixed for robust positioning */
            background-color: #333;
            color: #ffffff;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 0.85em;
            white-space: nowrap;
            opacity: 0;
            transition: opacity 0.5s ease-in-out, transform 0.5s ease-in-out;
            transform: translateY(-10px); /* Start slightly above */
            pointer-events: none; /* Allow clicks to pass through */
            z-index: 100; /* Ensure it's on top */
        `;
        // Append it to the body to ensure it's not clipped by overflow: hidden parents
        document.body.appendChild(searchMessageContainer);
    }

    // Position the message container relative to the search input
    if (searchInput) {
        const searchRect = searchInput.getBoundingClientRect();
        searchMessageContainer.style.left = `${searchRect.left}px`;
        searchMessageContainer.style.top = `${searchRect.bottom + 5}px`; // 5px below the search input
    } else {
        // Fallback positioning if searchInput is not found (though it should be)
        searchMessageContainer.style.left = '50%';
        searchMessageContainer.style.transform = 'translateX(-50%)';
        searchMessageContainer.style.top = '10px'; // Top of the viewport
    }

    // Clear any existing timeout to prevent previous messages from being cut short
    if (searchMessageTimeout) {
        clearTimeout(searchMessageTimeout);
    }
    console.log("Displaying search message:", message, "Type:", type); // Debugging log
    searchMessageContainer.textContent = message;
    searchMessageContainer.style.color = type === 'error' ? '#FF6B6B' : '#ffffff'; // Red for error, white for info
    searchMessageContainer.style.opacity = '1'; // Ensure full opacity when displayed
    searchMessageContainer.style.transform = 'translateY(0)'; // Slide into place

    // Set a timeout to clear the message after 5 seconds
    searchMessageTimeout = setTimeout(() => {
        searchMessageContainer.style.opacity = '0'; // Start fading out
        searchMessageContainer.style.transform = 'translateY(-10px)'; // Slide up as it fades
        // After fade, hide the element completely
        setTimeout(() => {
            searchMessageContainer.textContent = ''; // Clear text content
            // No need to set display: 'none' here, as opacity 0 and translateY(-10px) makes it effectively hidden
            // and pointer-events: none ensures it's not block clicks.
        }, 500); // This should match your CSS transition duration for opacity
    }, 5000); // Message visible for 5 seconds
}

/**
 * Clears any displayed search message immediately.
 */
function clearSearchMessage() {
    if (searchMessageContainer) {
        if (searchMessageTimeout) {
            clearTimeout(searchMessageTimeout);
            searchMessageTimeout = null;
        }
        searchMessageContainer.style.opacity = '0';
        searchMessageContainer.style.transform = 'translateY(-10px)';
        searchMessageContainer.textContent = '';
    }
}
if (searchInput) {
    searchInput.addEventListener('input', (event) => {
        const searchQuery = event.target.value.trim().toLowerCase();
        console.log("Search input changed:", searchQuery); // Debugging log
        clearTimeout(debounceTimer);
        clearSearchMessage(); // Clear message on new input

        if (searchQuery.length > 0) {
            // NEW: Trigger search after a debounce delay
            debounceTimer = setTimeout(() => {
                searchAndOpenAlbum(searchQuery);
            }, DEBOUNCE_DELAY);
        } else {
            // If the query is empty, close the overlay
            closeAlbumOverlay();
            clearSearchMessage();
        }
    });
    // Add event listener for 'keydown' on searchInput to handle 'Enter' key
    searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent default form submission if it's part of a form
            clearTimeout(debounceTimer); // Clear debounce if Enter is pressed
            const searchQuery = searchInput.value.trim().toLowerCase();
            if (searchQuery.length > 0) {
                searchAndOpenAlbum(searchQuery);
            } else {
                closeAlbumOverlay();
                clearSearchMessage();
            }
        }
    });
}

// Function to perform the search and open the album.
// Playback is NOT stopped by this function. It calls `openAlbumDetails`,
// which then handles playback initiation if a track is specified.
async function searchAndOpenAlbum(searchQuery) {
    console.log(`--- Initiating client-side search for: "${searchQuery}" ---`);
    let matchedAlbum = null;
    let matchedTrackTitle = null;

    if (allAlbumsData.length === 0) {
        console.warn("allAlbumsData is empty. Attempting to re-fetch albums for search.");
        await fetchAlbums(); // Ensure data is loaded if not already
        if (allAlbumsData.length === 0) {
            displaySearchMessage("Album data not loaded. Cannot perform search.", 'error');
            return;
        }
    }

    // Find the first album that matches the search query (case-insensitive)
    matchedAlbum = allAlbumsData.find(album =>
        (album.title && album.title.toLowerCase().includes(searchQuery)) ||
        (album.artist && album.artist.toLowerCase().includes(searchQuery)) ||
        (album.tracks && album.tracks.some(track =>
            (track.title && track.title.toLowerCase().includes(searchQuery)) ||
            (track.artist && track.artist.toLowerCase().includes(searchQuery))
        ))
    );

    if (matchedAlbum) {
        console.log(`Client-side match found: "${matchedAlbum.title}" for query "${searchQuery}"`);
        clearSearchMessage(); // Clear message if results are found

        // Re-check tracks in the matched album for highlighting
        if (matchedAlbum.tracks) {
            for (const track of matchedAlbum.tracks) {
                const trackTitleLower = (track.title ?? '').toLowerCase();
                const trackArtistLower = (track.artist ?? '').toLowerCase();
                if (trackTitleLower.includes(searchQuery) || trackArtistLower.includes(searchQuery)) {
                    matchedTrackTitle = track.title;
                    break;
                }
            }
        }
        console.log(`Calling openAlbumDetails for: "${matchedAlbum.title}" with highlight: "${matchedTrackTitle || 'none'}"`);
        openAlbumDetails(matchedAlbum, matchedTrackTitle);
    } else {
        console.log(`No specific album or track match found in loaded data for query: "${searchQuery}"`);
        displaySearchMessage("No albums found matching your search.", 'error');
        closeAlbumOverlay(); // If no match, ensure overlay is closed
    }
}

// Event listener for search icon click
if (searchIcon) {
    searchIcon.addEventListener('click', function() {
        const searchQuery = searchInput.value.trim().toLowerCase();
        console.log("Search icon clicked, query:", searchQuery); // Debugging log
        if (searchQuery.length > 0) {
            searchAndOpenAlbum(searchQuery);
        } else {
            // If search input is empty on icon click, close overlay and clear search message
            closeAlbumOverlay();
            clearSearchMessage();
        }
    });
}
/**
 * Handles the first click on an embedded album overlay.
 * It removes itself to allow direct iframe interaction.
 * Playback of the embedded content is expected to start/be controllable directly within the iframe.
 */
async function firstClickEmbedHandler() {
    console.log("First click on embedded album detected. Removing interaction layer.");
    // Stop any currently playing *controllable* media (native, Spotify SDK, YouTube API)
    // This ensures that if a track was playing in the background, it stops.
    stopControllablePlayersOnly(); // <--- NEW CALL
    playingAlbum = backgroundEmbeddedAlbum; // NEW: Set playingAlbum when embedded album is activated
    console.log("playingAlbum set to backgroundEmbeddedAlbum after first embed click:", playingAlbum);

    const embedInteractionLayer = document.getElementById('embed-interaction-layer');
    if (embedInteractionLayer) {
        embedInteractionLayer.removeEventListener('click', firstClickEmbedHandler);
        embedInteractionLayer.remove(); // Remove from DOM
        console.log("embed-interaction-layer removed after first click.");
    }
    // The embedded iframe itself is NOT removed here. It remains active.
    // Its playback is managed by the iframe itself (e.g., YouTube's autoplay, Spotify's embed player).
}

/**
 * Updates the mini-player in the player bar to display the embedded content.
 * For non-controllable embeds like Audiomack, it shows the album cover.
 * For controllable embeds (YouTube/Spotify SDK), it manages their specific mini-player elements.
 * This is called when an embedded album's overlay is closed, to ensure the mini-player
 * correctly reflects what's playing.
 * @param {object} albumData - The album data for the embedded content.
 */
function updateMiniPlayerForEmbed(albumData) {
    // Clear any existing dynamic player container (mini-iframe) in playerLeft
    const existingPlayerContainer = playerLeft.querySelector('#dynamic-player-container');
    if (existingPlayerContainer) {
        existingPlayerContainer.remove();
    }
    const existingYoutubePlayerDiv = playerLeft.querySelector('#youtube-player-container');
    if (existingYoutubePlayerDiv) {
        existingYoutubePlayerDiv.remove();
    }

    const isNonControllableEmbeddedAlbum = albumData.rawHtmlEmbed || albumData.fullSoundcloudEmbed || albumData.audiomackEmbed || albumData.soundcloudEmbed;
    const isYouTubeEmbed = albumData.iframeSrc && albumData.iframeSrc.includes('https://www.youtube.com/embed/');

    if (isNonControllableEmbeddedAlbum) {
        // For non-controllable embeds (Audiomack, raw HTML, SoundCloud), show the album image in mini-player
        if (playerImg) playerImg.style.display = 'block'; // Ensure player image is visible
        if (playerImg) playerImg.src = albumData.coverArt || 'https://placehold.co/80x80/000000/FFFFFF?text=Album';
        console.log("Mini-player updated for non-controllable embed: showing album image.");
    } else if (isYouTubeEmbed) {
        // For YouTube, re-create the YouTube mini-player div if needed
        if (playerImg) playerImg.style.display = 'none'; // Hide album image for YouTube embed
        const videoIdMatch = albumData.iframeSrc.match(/\/embed\/([a-zA-Z0-9_-]+)/);
        const videoId = videoIdMatch ? videoIdMatch[1] : null;

        if (videoId) {
            const playerDiv = document.createElement('div');
            playerDiv.id = 'youtube-player-container';
            playerDiv.style.width = '80px';
            playerDiv.style.height = '80px';
            playerDiv.style.borderRadius = '8px'; // Added border-radius
            playerLeft.prepend(playerDiv);
            // Re-initialize YouTube player (it will attempt to resume if it was playing)
            ytPlayer = new YT.Player('youtube-player-container', {
                videoId: videoId,
                playerVars: {
                    'autoplay': 1, // Autoplay when loaded
                    'controls': 0,
                    'modestbranding': 1,
                    'rel': 0,
                    'showinfo': 0,
                    'enablejsapi': 1,
                    'origin': window.location.origin
                },
                events: {
                    'onReady': (event) => {
                        // If it was playing, it should resume. Otherwise, it will start from beginning or stay paused.
                        // We don't explicitly seek here, as we are relying on YouTube's internal state.
                        if (playPauseBtn) playPauseBtn.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="#1ED760"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
                        if (volumeBar) event.target.setVolume(volumeBar.value * 100);
                        togglePlayerControls(true); // Enable controls for YouTube playback
                    },
                    'onStateChange': (event) => {
                        if (event.data === YT.PlayerState.PLAYING) {
                            if (playPauseBtn) playPauseBtn.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="#1ED760"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
                        } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
                            if (playPauseBtn) playPauseBtn.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="#1ED760"><path d="M8 5v14l11-7z"/></svg>';
                        }
                    },
                    'onError': (event) => {
                        console.error("YouTube Player Error in mini-player:", event.data);
                        // Handle error, maybe show album art again
                        if (playerImg) playerImg.style.display = 'block';
                        if (playPauseBtn) playPauseBtn.innerHTML = '&#9658;';
                        togglePlayerControls(true);
                    }
                }
            });
            console.log("Mini-player updated for YouTube embed: re-initialized YouTube player.");
        } else {
            if (playerImg) playerImg.style.display = 'block'; // Fallback to image if videoId not found
            console.warn("Mini-player updated for YouTube embed: video ID not found, showing album image.");
        }
    } else {
        // For Spotify SDK (which doesn't need a visible iframe in mini-player) or other cases
        if (playerImg) playerImg.style.display = 'block';
        console.log("Mini-player updated for controllable embed (Spotify SDK or other): showing album image.");
    }
}


function openAlbumDetails(albumData, highlightTrackTitle = null) {
    console.log("openAlbumDetails called with albumData:", albumData);

    // Hide the video overlay immediately when opening any album details
    toggleEmbeddedPlayerVideoOverlay(false); // <--- Hide video overlay

    const isOpeningEmbeddedAlbum = (
        albumData.rawHtmlEmbed || albumData.fullSoundcloudEmbed || albumData.audiomackEmbed || albumData.soundcloudEmbed || albumData.iframeSrc
    );

    // Get existing iframe in the full embed container to check if it's the same album
    const existingIframeInFullEmbedContainer = albumFullEmbedContainer.querySelector('iframe');
    const existingEmbedAlbumId = existingIframeInFullEmbedContainer ? existingIframeInFullEmbedContainer.dataset.albumId : null;

    const isSameEmbeddedAlbumAlreadyLoaded = (
        existingEmbedAlbumId === albumData.id &&
        isOpeningEmbeddedAlbum
    );

    console.log(`DEBUG: isOpeningEmbeddedAlbum = ${isOpeningEmbeddedAlbum}`);
    console.log(`DEBUG: isSameEmbeddedAlbumAlreadyLoaded = ${isSameEmbeddedAlbumAlreadyLoaded}`);
    console.log("DEBUG: albumData for evaluation:", albumData);
    console.log("DEBUG: currentAlbum for evaluation:", currentAlbum);

    // --- Critical DOM element checks ---
    if (!albumOverlay) { console.error("Error: albumOverlay element not found."); return; }
    if (!topBar) { console.error("Error: topBar element not found."); return; }
    if (!rightPanel) { console.error("Error: rightPanel element not found."); return; }
    if (!playerBar) { console.error("Error: playerBar element not found."); return; }
    if (!albumFullEmbedContainer) { console.error("Error: albumFullEmbedContainer element not found."); return; }

    // Assign to the global variable
    albumDetailsContent = document.getElementById('albumDetails');
    if (!albumDetailsContent) { console.error("Error: albumDetails element (main content) not found."); return; }
    if (!closeOverlayBtn) { console.error("Error: closeOverlayBtn element not found."); return; }
    if (!albumHeader) { console.error("Error: albumHeader element not found."); return; } // Added check
    if (!albumDetailsCover) { console.error("Error: albumDetailsCover element not found."); return; } // Added check
    if (!albumDetailsTitle) { console.error("Error: albumDetailsTitle element not found."); return; } // Added check
    if (!albumDetailsArtist) { console.error("Error: albumDetailsArtist element not found."); return; } // Added check
    if (!albumDetailsMeta) { console.error("Error: albumDetailsMeta element not found."); return; } // Added check
    if (!albumTracksSection) { console.error("Error: albumTracksSection element not found."); return; } // Added check
    if (!albumPlayButton) { console.error("Error: albumPlayButton element not found."); return; } // Added check
    if (!albumDetailsTracksBody) { console.error("Error: albumDetailsTracksBody element not found."); return; } // Added check


    // IMPORTANT CHANGE:
    // Only clear albumFullEmbedContainer if we are about to load a *new* embedded album into it.
    // If opening a non-embedded album, we only hide it.
    if (isOpeningEmbeddedAlbum && !isSameEmbeddedAlbumAlreadyLoaded) {
        // If opening a new embedded album, clear existing content to replace it.
        console.log("openAlbumDetails: Clearing albumFullEmbedContainer for NEW embedded album.");
        while (albumFullEmbedContainer.firstChild) {
            albumFullEmbedContainer.removeChild(albumFullEmbedContainer.firstChild);
        }
        console.log("albumFullEmbedContainer content cleared for a NEW embedded album.");
    } else if (!isOpeningEmbeddedAlbum && existingIframeInFullEmbedContainer) {
        // If opening a non-embedded album, and an embedded player is currently in the full embed container,
        // just hide the full embed container. DO NOT remove its children.
        albumFullEmbedContainer.style.display = 'none';
        console.log("Opening non-embedded album. Hiding albumFullEmbedContainer to preserve existing embedded player.");
    } else if (!isOpeningEmbeddedAlbum && !existingIframeInFullEmbedContainer) {
        // If opening a non-embedded album and no embed is currently in the container, ensure it's empty and hidden.
        while (albumFullEmbedContainer.firstChild) {
            albumFullEmbedContainer.removeChild(albumFullEmbedContainer.firstChild);
        }
        albumFullEmbedContainer.style.display = 'none';
        console.log("Opening non-embedded album. No existing embed. Ensuring albumFullEmbedContainer is empty and hidden.");
    }


    // Only reset currentTrackIndex if a new album is being opened (or if it's the same album but not an embed)
    // If we are re-opening the *same* album (controllable or embedded), preserve currentTrackIndex.
    if (currentAlbum === null || currentAlbum.id !== albumData.id) {
        currentTrackIndex = 0; // Reset if it's a completely new album
        console.log("Resetting currentTrackIndex to 0 as a new album is being opened.");
    } else {
        console.log("Preserving currentTrackIndex as the same album is being re-opened.");
    }

    // Set the current album globally (always update to the album being opened)
    currentAlbum = albumData;
    // If this is an embedded album being opened, set it as the background embedded album
    if (isOpeningEmbeddedAlbum) {
        backgroundEmbeddedAlbum = albumData;
    }
    console.log("currentAlbum set to:", currentAlbum);


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
        albumOverlay.style.removeProperty('filter');   // NEW: Ensure no filter
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
                console.log("originalIframe appended to albumFullEmbedContainer.");

            } else {
                albumFullEmbedContainer.innerHTML = embedContent;
                console.warn("openAlbumDetails: Embed content did not contain an iframe. Appending raw HTML directly. This might not be expected.");
            }

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
            // Always attach/re-attach the listener for a new embed, as it will be removed on first click
            embedInteractionLayer.removeEventListener('click', firstClickEmbedHandler);
            embedInteractionLayer.addEventListener('click', firstClickEmbedHandler);
            console.log("embedInteractionLayer listener attached for NEW embedded album.");

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
        if (playerBar) {
            playerBar.style.display = 'none';
            console.log("playerBar set to display: none for embedded album.");
        }

        if (albumOverlay && topBar) {
            const topBarHeight = topBar.offsetHeight;
            albumOverlay.style.position = 'fixed';
            albumOverlay.style.top = `${topBarHeight}px`;
            albumOverlay.style.bottom = '0';
            albumOverlay.style.right = '0';
            albumOverlay.style.width = 'auto';
            albumOverlay.style.height = 'auto';
            albumOverlay.style.zIndex = '999';
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
            closeOverlayBtn.style.zIndex = '1000';
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
                    tableHeaders[0].style.width = '8%'; // Number column (increased for icon visibility)
                    tableHeaders[1].style.width = '42%'; // Title column (adjusted)
                    tableHeaders[2].style.width = '28%'; // Artist column
                    tableHeaders[3].style.width = '22%'; // Duration column
                } else if (window.innerWidth < 768) {
                    // Mobile specific column widths (between 400px and 768px)
                    tableHeaders[0].style.width = '10%'; // Number column (increased for icon visibility)
                    tableHeaders[1].style.width = '40%'; // Title column (adjusted)
                    tableHeaders[2].style.width = '30%'; // Artist column
                    tableHeaders[3].style.width = '20%'; // Duration column
                } else {
                    // Larger screen column widths
                    tableHeaders[0].style.width = '5%';
                    tableHeaders[1].style.width = '45%';
                    tableHeaders[2].style.width = '35%';
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


                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td class="track-title">${track.title || 'Untitled'}</td>
                    <td>${track.artist || albumData.artist || 'Various Artists'}</td>
                    <td>${formatTime(track.duration)}</td>
                `;

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
                        if (audio.src === clickedTrack.src) {
                            isPlaying = !audio.paused;
                        } else if (ytPlayer && clickedTrack.iframeSrc && clickedTrack.iframeSrc.includes('https://www.youtube.com/embed/')) {
                            const videoIdMatch = clickedTrack.iframeSrc.match(/\/embed\/([a-zA-Z0-9_-]+)/);
                            const videoId = videoIdMatch ? videoId[1] : null;
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
                            if (audio.src === clickedTrack.src) audio.pause();
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
                        stopAllPlaybackUI();
                        backgroundEmbeddedAlbum = null; // Clear background embed if a new track is clicked
                        console.log(`DEBUG: Playing new track or non-controllable embedded track "${clickedTrack.title}". Starting fresh.`);
                    }

                    // No need to reset all track icons here. updateTrackHighlightingInOverlay will handle it.

                    if (shouldPlay) {
                        playTrack(clickedTrack, clickedTrackIndex, seekTime);
                    } else {
                        // If paused, just update the UI to reflect pause state
                        updateTrackHighlightingInOverlay(); // Re-apply highlights and icons
                        if (playPauseBtn) playPauseBtn.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="#1ED760"><path d="M8 5v14l11-7z"/></svg>'; // Green Play icon
                        updateAlbumPlayButtonIcon(); // Sync album play button
                    }
                });
                if (albumDetailsTracksBody) {
                    albumDetailsTracksBody.appendChild(row);
                }
            });
            // After populating tracks, update highlighting based on current playback
            updateTrackHighlightingInOverlay();

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
    }

    // Add the event listeners for player controls here, once the album details are populated
    // and the player is ready to be interacted with for the *newly opened album*.
    if (prevTrackBtn) {
        prevTrackBtn.removeEventListener('click', prevTrack); // Remove previous listener to prevent duplicates
        prevTrackBtn.addEventListener('click', prevTrack);
    }

    if (nextTrackBtn) {
        nextTrackBtn.removeEventListener('click', nextTrack); // Remove previous listener to prevent duplicates
        nextTrackBtn.addEventListener('click', nextTrack);
    }

    // Attach event listener for the close button
    if (closeOverlayBtn) {
        closeOverlayBtn.removeEventListener('click', closeAlbumOverlay); // Prevent multiple listeners
        closeOverlayBtn.addEventListener('click', closeAlbumOverlay);
    }


    if (albumOverlay && topBar && rightPanel && playerBar) {
        albumOverlay.classList.remove('hidden');
        albumOverlay.classList.add('show');
        document.body.style.overflow = 'hidden';
        console.log("albumOverlay classes updated: hidden removed, show added. body overflow hidden.");
    } else {
        console.error("Error: One or more critical elements for albumOverlay visibility are missing. Overlay will not show.", { albumOverlay, topBar, rightPanel, playerBar });
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
        showMessageBox("No tracks available to play for this album.", 'info');
        return;
    }

    const currentTrack = currentAlbum.tracks[currentTrackIndex];
    if (!currentTrack) {
        console.error("Current track is undefined, cannot play.");
        showMessageBox("Error: Current track data is missing.", 'error');
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

    if (isPlaying) {
        // If currently playing, pause it
        if (audio.src && audio.src === currentTrack.src) {
            audio.pause();
            playPauseBtn.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="#1ED760"><path d="M8 5v14l11-7z"/></svg>'; // Green Play icon
        } else if (ytPlayer && currentTrack.iframeSrc && currentTrack.iframeSrc.includes('https://www.youtube.com/embed/')) {
            ytPlayer.pauseVideo();
            playPauseBtn.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="#1ED760"><path d="M8 5v14l11-7z"/></svg>'; // Green Play icon
        } else if (spotifyPlayer && currentTrack.spotifyUri) {
            await spotifyPlayer.pause();
            playPauseBtn.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="#1ED760"><path d="M8 5v14l11-7z"/></svg>'; // Green Play icon
        }
        console.log("Album Play Button: Paused current track.");
    } else {
        // If not playing, or paused, play/resume it
        if (audio.src === currentTrack.src && audio.paused) { // Same track, just resume
            audio.play();
            playPauseBtn.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="#1ED760"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'; // Green Pause icon
        } else if (ytPlayer && currentTrack.iframeSrc && currentTrack.iframeSrc.includes('https://www.youtube.com/embed/')) {
            const videoIdMatch = currentTrack.iframeSrc.match(/\/embed\/([a-zA-Z0-9_-]+)/);
            const currentVideoId = videoIdMatch ? videoIdMatch[1] : null;
            if (currentVideoId && ytPlayer.getVideoData() && ytPlayer.getVideoData().video_id === currentVideoId && ytPlayer.getPlayerState() === YT.PlayerState.PAUSED) {
                ytPlayer.playVideo(); // Resume YouTube
                playPauseBtn.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="#1ED760"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'; // Green Pause icon
            } else {
                playTrack(currentTrack, currentTrackIndex); // Play new YouTube track
            }
        } else if (spotifyPlayer && currentTrack.spotifyUri) {
            try {
                const state = await spotifyPlayer.getCurrentState();
                if (state && state.track_window.current_track.uri === currentTrack.spotifyUri && state.paused) {
                    await spotifyPlayer.resume(); // Resume Spotify
                    playPauseBtn.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="#1ED760"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'; // Green Pause icon
                } else {
                    playTrack(currentTrack, currentTrackIndex); // Play new Spotify track
                }
            } catch (e) {
                console.warn("Error resuming Spotify from album play button:", e);
                playTrack(currentTrack, currentTrackIndex); // Fallback to play new
            }
        } else {
            // No current player or different track, start playing the current album's track
            playTrack(currentTrack, currentTrackIndex);
        }
        console.log("Album Play Button: Playing/Resuming current track.");
    }
    updateAlbumPlayButtonIcon(); // Always update icon after action
    updateTrackHighlightingInOverlay(); // Update track highlighting in overlay
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
        console.log("albumOverlay classes updated: hidden added, show removed.");
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
        albumOverlay.style.removeProperty('filter');   // NEW: Ensure no filter
        console.log("albumOverlay inline styles reset.");

        // Re-show the player bar when the overlay is closed
        if (playerBar) {
            playerBar.style.display = 'flex'; // Or 'block', depending on its original display type
            console.log("playerBar set to display: flex.");
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
        if (prevTrackBtn) {
            prevTrackBtn.removeEventListener('click', prevTrack);
            console.log("prevTrackBtn listener removed.");
        }
        if (nextTrackBtn) {
            nextTrackBtn.removeEventListener('click', nextTrack);
            console.log("nextTrackBtn listener removed.");
        }

        // When closing the overlay, manage the albumFullEmbedContainer's visibility.
        // IMPORTANT: Do NOT clear content if it's an embedded player that should continue playing.
        // We only hide it. The content remains in the DOM but is not visible.
        // This is crucial for the embedded player to continue playing.
        if (albumFullEmbedContainer) {
            // Check if there's a background embedded album playing
            const isEmbeddedAlbumPlayingInBackground = playingAlbum && (playingAlbum.rawHtmlEmbed || playingAlbum.fullSoundcloudEmbed || playingAlbum.audiomackEmbed || playingAlbum.iframeSrc);

            if (isEmbeddedAlbumPlayingInBackground) {
                // For embedded albums, just hide the full embed container.
                // The iframe inside it remains in the DOM to potentially retain state.
                albumFullEmbedContainer.style.display = 'none';
                console.log("albumFullEmbedContainer hidden for embedded album on close.");
                backgroundEmbeddedAlbum = playingAlbum; // Ensure backgroundEmbeddedAlbum is set to the currently playing embed
                updateMiniPlayerForEmbed(backgroundEmbeddedAlbum); // Update the mini-player to reflect the active embed
                toggleEmbeddedPlayerVideoOverlay(true); // <--- Show video overlay for embedded background playback
            } else {
                // For non-embedded albums, clear children and ensure player image is visible
                while (albumFullEmbedContainer.firstChild) {
                    albumFullEmbedContainer.removeChild(albumFullEmbedContainer.firstChild);
                }
                if (playerImg) playerImg.style.display = 'block';
                // Clear any lingering dynamic player container if it's not an embed
                const existingPlayerContainer = playerLeft.querySelector('#dynamic-player-container');
                if (existingPlayerContainer) {
                    existingPlayerContainer.remove();
                }
                const existingYoutubePlayerDiv = playerLeft.querySelector('#youtube-player-container');
                if (existingYoutubePlayerDiv) {
                    existingYoutubePlayerDiv.remove();
                }
                backgroundEmbeddedAlbum = null; // No background embedded album if a controllable track is playing
                togglePlayerControls(true); // Re-enable controls for non-embedded playback
                toggleEmbeddedPlayerVideoOverlay(false); // <--- Hide video overlay for non-embedded playback
                console.log("albumFullEmbedContainer content cleared and hidden on close for non-embedded album.");
            }
            // Reset all inline styles that were applied for embeds
            albumFullEmbedContainer.style.removeProperty('position');
            albumFullEmbedContainer.style.removeProperty('top');
            albumFullEmbedContainer.style.removeProperty('left');
            albumFullEmbedContainer.style.removeProperty('right');
            albumFullEmbedContainer.style.removeProperty('bottom');
            albumFullEmbedContainer.style.removeProperty('width');
            albumFullEmbedContainer.style.removeProperty('height');
            albumFullEmbedContainer.style.removeProperty('z-index');
            albumFullEmbedContainer.style.removeProperty('margin');
            albumFullEmbedContainer.style.removeProperty('padding');
            albumFullEmbedContainer.style.removeProperty('overflow');
            albumFullEmbedContainer.style.removeProperty('background-color');
            albumFullEmbedContainer.style.removeProperty('justify-content');
            albumFullEmbedContainer.style.removeProperty('align-items');
            albumFullEmbedContainer.style.removeProperty('border-radius');
            albumFullEmbedContainer.style.removeProperty('border');
            console.log("albumFullEmbedContainer inline styles reset on close.");
        }
        // Re-show the traditional album details content if it was hidden
        // This is important for when a tracklist album is opened next.
        if (albumDetailsContent) { // Now uses the global albumDetailsContent
            albumDetailsContent.style.display = 'block';
            console.log("albumDetailsContent set to display: block.");
        }
        // Always reset header, tracks section, and album play button to their default visibility
        if (albumHeader) albumHeader.style.display = 'flex'; // Reset to default (flex in your CSS)
        if (albumTracksSection) albumTracksSection.style.display = 'block'; // Reset to default (block in your CSS)
        if (albumPlayButton) albumPlayButton.style.display = 'inline-block'; // Reset to default (inline-block in your CSS)
        console.log("Album header, tracks section, and play button reset to default display.");

        // Ensure all album cards are visible after closing the overlay
        const albumCards = document.querySelectorAll('.card'); // Select all cards
        albumCards.forEach(card => {
            card.style.display = 'block'; // Ensure all cards are displayed
        });
        console.log("All album cards set to display: block.");

        // Do NOT stop any playback here. Playback continues in the background.
    }
    document.body.style.overflow = ''; // Re-enable background scrolling
    clearSearchMessage(); // Clear search message when overlay is closed
    console.log("Body overflow re-enabled, search message cleared.");
}


// --- Spotify Web Playback SDK Integration ---

// Placeholder for Spotify login initiation (you'll need to implement the actual OAuth flow)
function initiateSpotifyLogin() {
    console.log("Initiating Spotify login...");
    // This would typically redirect to Spotify's authorization page
    window.location.href = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=token&redirect_uri=${SPOTIFY_REDIRECT_URI}&scope=${SPOTIFY_SCOPES}`;
    showMessageBox("Redirecting to Spotify for login...", 'info');
}

// Function to handle Spotify callback from redirect URI
async function handleSpotifyCallback() { // Made async to await fetch
    const hash = window.location.hash
        .substring(1)
        .split('&')
        .reduce((initial, item) => {
            if (item) {
                const parts = item.split('=');
                initial[parts[0]] = decodeURIComponent(parts[1]);
            }
            return initial;
        }, {});

    window.location.hash = ''; // Clear the hash from the URL

    if (hash.access_token) {
        spotifyAccessToken = hash.access_token;
        localStorage.setItem('spotifyAccessToken', spotifyAccessToken);
        console.log("Spotify Access Token obtained:", spotifyAccessToken);

        // NEW: Fetch user profile to get display name
        try {
            const userProfileResponse = await fetch('https://api.spotify.com/v1/me', {
                headers: {
                    'Authorization': `Bearer ${spotifyAccessToken}`
                }
            });

            if (userProfileResponse.ok) {
                const userProfile = await userProfileResponse.json();
                currentUserName = userProfile.display_name || userProfile.id || 'Spotify User';
                console.log("Spotify User Profile fetched:", userProfile);
                showMessageBox(`Spotify login successful! Welcome, ${currentUserName}!`, 'success');
            } else {
                console.warn("Failed to fetch Spotify user profile:", userProfileResponse.status);
                showMessageBox('Spotify login successful, but failed to get username.', 'warning');
                currentUserName = 'Spotify User'; // Fallback
            }
        } catch (error) {
            console.error("Error fetching Spotify user profile:", error);
            showMessageBox('Spotify login successful, but error fetching username.', 'warning');
            currentUserName = 'Spotify User'; // Fallback
        }

        updateLoginUI(true); // Update UI to show logged-in state
        loadSpotifySDK();
    } else if (hash.error) {
        console.error("Spotify login error:", hash.error);
        showMessageBox(`Spotify login failed: ${hash.error}`, 'error');
        updateLoginUI(false); // Update UI to show logged-out state
    }
}

// Function to dynamically load the Spotify Web Playback SDK
function loadSpotifySDK() {
    if (document.getElementById('spotify-playback-sdk')) {
        console.log("Spotify Web Playback SDK script already loaded.");
        return;
    }
    const script = document.createElement('script');
    script.id = 'spotify-playback-sdk';
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);
    console.log("Spotify Web Playback SDK script appended to body.");
}


// This function is called when the Spotify Web Playback SDK is ready
window.onSpotifyWebPlaybackSDKReady = () => {
    console.log('Spotify Web Playback SDK is ready.');
    // Try to retrieve token from localStorage if not already set by callback
    if (!spotifyAccessToken) {
        spotifyAccessToken = localStorage.getItem('spotifyAccessToken');
    }

    if (!spotifyAccessToken) {
        console.warn('Spotify access token not available. Please log in to Spotify.');

        updateLoginUI(false); // Ensure UI reflects logged out state
        return;
    }
    spotifyPlayer = new Spotify.Player({
        name: 'My Custom Music Player',
        getOAuthToken: cb => { cb(spotifyAccessToken); },
        volume: volumeBar ? volumeBar.value : 0.5
    });

    spotifyPlayer.addListener('ready', ({ device_id }) => {
        spotifyDeviceId = device_id;
        console.log('Ready with Device ID', spotifyDeviceId);
        showMessageBox(`Spotify player ready! Device ID: ${deviceId.substring(0, 8)}...`, 'success');
        // Transfer playback to our player
        transferPlaybackToDevice(spotifyDeviceId);
    });

    spotifyPlayer.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id);
        showMessageBox(`Spotify device offline: ${device_id.substring(0, 8)}...`, 'error');
    });

    spotifyPlayer.addListener('player_state_changed', (state) => {
        if (!state) {
            console.log("Spotify player state is null.");
            return;
        }

        const { current_track } = state.track_window;
        if (current_track) {
            // Update UI with Spotify track info if needed (though playTrack does this)
            // This listener mainly helps keep our UI in sync with external Spotify actions
            if (!state.paused) {
                if (playPauseBtn) playPauseBtn.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="#1ED760"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
            } else {
                if (playPauseBtn) playPauseBtn.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="#1ED760"><path d="M8 5v14l11-7z"/></svg>';
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
                // Only stop playback if there's no next track and not repeating/shuffling
                if (!(currentAlbum && currentAlbum.tracks && currentTrackIndex < currentAlbum.tracks.length - 1)) {
                    // This block will be reached if it's the last song and not repeating/shuffling
                    // So, we will let the player stay in its "ended" state without explicitly calling stopAllPlaybackUI here.
                }
            }
        }
        // Update the main album play button icon after player state change
        updateAlbumPlayButtonIcon();
        updateTrackHighlightingInOverlay(); // Update track highlighting in overlay
    });

    spotifyPlayer.addListener('initialization_error', ({ message }) => {
        console.error('Failed to initialize Spotify player:', message);
        showMessageBox(`Spotify player init error: ${message}`, 'error');
    });
    spotifyPlayer.addListener('authentication_error', ({ message }) => {
        console.error('Authentication error with Spotify:', message);
        spotifyAccessToken = null;
        localStorage.removeItem('spotifyAccessToken');
        showMessageBox('Spotify authentication failed. Please log in again.', 'error');
        updateLoginUI(false); // Ensure UI reflects logged out state
    });
    spotifyPlayer.addListener('account_error', ({ message }) => {
        console.error('Account error with Spotify:', message);
        showMessageBox('Spotify account error. Please check your Spotify Premium status.', 'error');
    });
    spotifyPlayer.addListener('playback_error', ({ message }) => {
        console.error('Playback error with Spotify:', message);
        showMessageBox('Spotify playback error. Please try again or check your Spotify app.', 'error');
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
            showMessageBox('Could not transfer playback to web player. You might need to select it manually in Spotify.', 'error');
        } else {
            console.log('Playback transfer initiated successfully.');
        }
    } catch (error) {
        console.error('Error transferring playback:', error);
        showMessageBox('Error transferring playback.', 'error');
    }
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
//      closeOverlayBtn.addEventListener('click', closeAlbumOverlay);
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
        // Open the dropdown
        if (userDropdown.parentNode !== document.body) {
            document.body.appendChild(userDropdown);
            console.log("toggleUserDropdown: User dropdown moved to document.body.");
        }

        if (userAvatarContainer) {
            const avatarRect = userAvatarContainer.getBoundingClientRect();
            userDropdown.style.position = 'fixed';
            userDropdown.style.top = `${avatarRect.bottom + 10}px`;
            userDropdown.style.right = `${window.innerWidth - avatarRect.right}px`;
            userDropdown.style.left = 'auto';
            userDropdown.style.minWidth = '150px';
            userDropdown.style.backgroundColor = '#282828';
            userDropdown.style.borderRadius = '8px';
            userDropdown.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.6)';
            userDropdown.style.padding = '10px 0';
            userDropdown.style.zIndex = '9999999';
            userDropdown.style.display = 'block';
            userDropdown.offsetHeight; // Trigger reflow
            userDropdown.style.opacity = '1';
            userDropdown.style.pointerEvents = 'auto';

            console.log(`toggleUserDropdown: User dropdown shown. Position: fixed, Top: ${userDropdown.style.top}, Right: ${userDropdown.style.right}, Z-index: ${userDropdown.style.zIndex}`);

            if (dropdownUsername) {
                dropdownUsername.textContent = currentUserName;
                dropdownUsername.style.padding = '8px 15px';
                dropdownUsername.style.color = '#b3b3b3';
                dropdownUsername.style.fontSize = '0.9em';
                dropdownUsername.style.borderBottom = '1px solid #333';
                dropdownUsername.style.marginBottom = '5px';
            }
            if (dropdownLogoutBtn) {
                dropdownLogoutBtn.style.display = 'block';
                dropdownLogoutBtn.style.width = 'calc(100% - 20px)';
                dropdownLogoutBtn.style.padding = '10px 15px';
                dropdownLogoutBtn.style.backgroundColor = 'transparent';
                dropdownLogoutBtn.style.color = '#fff';
                dropdownLogoutBtn.style.border = 'none';
                dropdownLogoutBtn.style.textAlign = 'left';
                dropdownLogoutBtn.style.cursor = 'pointer';
                dropdownLogoutBtn.style.fontSize = '1em';
                dropdownLogoutBtn.style.fontWeight = 'normal';
                dropdownLogoutBtn.style.transition = 'background-color 0.2s ease';
                dropdownLogoutBtn.onmouseover = function() { this.style.backgroundColor = '#3e3e3e'; };
                dropdownLogoutBtn.onmouseout = function() { this.style.backgroundColor = 'transparent'; };
            }
        }
        isUserDropdownOpen = true;
        console.log("toggleUserDropdown: User dropdown state: OPEN. isUserDropdownOpen:", isUserDropdownOpen);
    } else {
        // Close the dropdown
        userDropdown.style.opacity = '0';
        userDropdown.style.pointerEvents = 'none';
        // Delay setting display: 'none' to allow transition to complete
        closeDropdownTimeout = setTimeout(() => {
            userDropdown.style.display = 'none';
            closeDropdownTimeout = null; // Clear the timeout ID
            console.log("toggleUserDropdown: User dropdown display set to none after transition.");
        }, 300); // Match CSS transition duration
        isUserDropdownOpen = false;
        console.log("toggleUserDropdown: User dropdown state: CLOSED. isUserDropdownOpen:", isUserDropdownOpen);
    }
}

// Event listener for the user avatar to toggle the dropdown
if (userAvatarContainer) {
    userAvatarContainer.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent document click listener from immediately closing it
        console.log("userAvatarContainer click: isUserDropdownOpen before toggle:", isUserDropdownOpen);
        if (isUserDropdownOpen) {
            toggleUserDropdown(false); // Explicitly close
        } else {
            toggleUserDropdown(true); // Explicitly open
        }
        console.log("userAvatarContainer click: isUserDropdownOpen after toggle:", isUserDropdownOpen);
    });
}

// Event listener to close the dropdown when clicking anywhere else on the document
document.addEventListener('click', (event) => {
    console.log(`Document click: target=${event.target.id || event.target.className || event.target.tagName}, isUserDropdownOpen=${isUserDropdownOpen}`);

    // Add a small timeout to allow the avatar click's stopPropagation to fully register
    // This is a common workaround for race conditions where the document click listener
    // might fire before the event bubbling for the avatar click is fully processed.
    setTimeout(() => {
        if (isUserDropdownOpen) { // Only attempt to close if it's currently open
            const isClickInsideDropdown = userDropdown.contains(event.target);
            const isClickOnAvatar = userAvatarContainer.contains(event.target);

            // Check if the click is inside the album overlay (to prevent closing dropdown if overlay is active)
            const isClickInsideAlbumOverlay = albumOverlay && albumOverlay.classList.contains('show') && albumOverlay.contains(event.target);

            console.log(`Document click (delayed check): isClickInsideDropdown=${isClickInsideDropdown}, isClickOnAvatar=${isClickOnAvatar}, isClickInsideAlbumOverlay=${isClickInsideAlbumOverlay}`);

            // Close the dropdown if click is outside both dropdown and avatar, AND outside album overlay (if open)
            if (!isClickInsideDropdown && !isClickOnAvatar && !isClickInsideAlbumOverlay) {
                console.log("Closing dropdown due to outside click (delayed).");
                toggleUserDropdown(false); // Explicitly close
            }
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


// --- Initial Setup on DOM Content Loaded ---
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM Content Loaded: Script execution started.");
    // REMOVED: playerBar.style.display = 'none'; // Hide player bar initially - now visible by default

    // Add padding to the player-left container for better spacing of the album cover/mini-player
    if (playerLeft) {
        playerLeft.style.padding = '8px';
        console.log("DOMContentLoaded: playerLeft padding set to 8px.");
    }
    // Apply consistent styling to the player image (album cover)
    if (playerImg) {
        playerImg.style.width = '80px';
        playerImg.style.height = '80px';
        playerImg.style.borderRadius = '8px';
        playerImg.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.4)';
        playerImg.style.objectFit = 'cover'; // Ensure image covers the area
        playerImg.style.display = 'block'; // Ensure it's visible by default
        console.log("DOMContentLoaded: playerImg styling applied.");
    }

    showMessageBox('Initializing app...', 'info', 5000); // Initial loading message

    try {
        // Attempt to handle Spotify callback on page load
        await handleSpotifyCallback();
        console.log("DOMContentLoaded: handleSpotifyCallback called.");

        // Load YouTube Iframe API
        loadYoutubeIframeAPI();
        console.log("DOMContentLoaded: loadYoutubeIframeAPI called.");

        // Set initial UI state for login (e.g., if no Spotify token found)
        // Moved here to update UI after potential Spotify login
        updateLoginUI();
        console.log("DOMContentLoaded: updateLoginUI called.");

        // Fetch and display initial content (these are placeholders now)
        if (typeof fetchAndDisplayTrendingSongs === 'function') fetchAndDisplayTrendingSongs();
        if (typeof fetchAndDisplayPopularAlbums === 'function') fetchAndDisplayPopularAlbums();
        if (typeof fetchAndDisplayPopularArtists === 'function') fetchAndDisplayPopularArtists();
        console.log("DOMContentLoaded: Initial content display functions called (if defined).");

        // IMPORTANT: Fetch and attach listeners after everything else
        await fetchAlbums(); // This call includes attachEventListenersToHtmlCards()
        console.log("DOMContentLoaded: fetchAlbums completed and listeners attached.");

        // Set initial volume for the native audio element
        if (volumeBar) {
            audio.volume = parseFloat(volumeBar.value);
            console.log("DOMContentLoaded: Initial native audio volume set.");
        }

        // Add an event listener to the player-left container to re-open the album overlay
        if (playerLeft) {
            playerLeft.addEventListener('click', () => {
                let albumToReopen = null;

                // Priority 1: If there's an album actively playing (controllable or embedded)
                if (playingAlbum) {
                    albumToReopen = playingAlbum;
                    console.log("Mini-player clicked. Actively playing album found. Opening its details.");
                }
                // Priority 2: If no album is actively playing, but an album's details were last opened
                else if (currentAlbum) {
                    albumToReopen = currentAlbum;
                    console.log("Mini-player clicked. No actively playing album, opening last viewed album details.");
                } else {
                    console.log("Mini-player clicked, but no current or playing album to open.");
                    return; // No album to open
                }

                // Open the album details. Importantly, openAlbumDetails should NOT stop playback
                // if it's the same album already playing.
                openAlbumDetails(albumToReopen);

                // If it's a controllable track and it was paused, resume it.
                // If it's an embedded track, it should continue playing automatically.
                if (albumToReopen === playingAlbum && playingAlbum && playingAlbum.tracks && playingAlbum.tracks.length > 0) {
                    const track = playingAlbum.tracks[currentTrackIndex]; // Use currentTrackIndex from playingAlbum context

                    // Check if it's a controllable track and currently paused
                    const isControllableTrack = track.spotifyUri || (track.iframeSrc && track.iframeSrc.includes('https://www.youtube.com/embed/')) || (track.src && !track.iframeSrc && !track.spotifyUri && !track.rawHtmlEmbed && !track.soundcloudEmbed && !track.audiomackEmbed && !track.fullSoundcloudEmbed);

                    if (isControllableTrack) {
                        let isPaused = false;
                        if (audio.src === track.src) {
                            isPaused = audio.paused;
                        } else if (ytPlayer && track.iframeSrc && track.iframeSrc.includes('https://www.youtube.com/embed/')) {
                            const videoIdMatch = track.iframeSrc.match(/\/embed\/([a-zA-Z0-9_-]+)/);
                            const videoId = videoIdMatch ? videoIdMatch[1] : null;
                            if (videoId && ytPlayer.getVideoData() && ytPlayer.getVideoData().video_id === videoId) {
                                isPaused = ytPlayer.getPlayerState() === YT.PlayerState.PAUSED;
                            }
                        } else if (spotifyPlayer && track.spotifyUri) {
                            spotifyPlayer.getCurrentState().then(state => {
                                if (state && state.track_window.current_track.uri === track.spotifyUri) {
                                    isPaused = state.paused;
                                }
                                if (isPaused) {
                                    // Resume playback if it was paused
                                    playTrack(track, currentTrackIndex, lastKnownPlaybackPosition);
                                    console.log("Mini-player clicked: Resuming paused controllable track.");
                                }
                            }).catch(e => console.warn("Error checking Spotify state for mini-player resume:", e));
                        }

                        if (isPaused) {
                            // Resume playback if it was paused
                            playTrack(track, currentTrackIndex, lastKnownPlaybackPosition);
                            console.log("Mini-player clicked: Resuming paused controllable track.");
                        }
                    }
                }
            });
            console.log("DOMContentLoaded: playerLeft click listener attached.");
        }
        showMessageBox('App is ready!', 'success'); // Final ready message

    } catch (error) {
        console.error("DOMContentLoaded: An error occurred during initial setup:", error);
        showMessageBox(`Critical error during setup: ${error.message}`, 'error', 10000);
    }
    console.log("DOMContentLoaded: Script execution finished.");

const searchInput = document.getElementById('search-input');
    const voiceSearchBtn = document.getElementById('voice-search-btn');
    const voiceStartSound = document.getElementById('voice-start-sound');
    const voiceEndSound = document.getElementById('voice-end-sound');

    // Check if browser supports Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (voiceSearchBtn && SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false; // Listen for a single utterance
        recognition.lang = 'en-US'; // Set recognition language
        recognition.interimResults = false; // Only return final results

        let isListening = false; // Track listening state

        // Function to play sound effects
        function playSound(audioElement) {
            if (audioElement) {
                audioElement.currentTime = 0; // Rewind to start
                audioElement.play().catch(e => console.warn("Audio playback failed:", e));
            }
        }

        voiceSearchBtn.addEventListener('click', () => {
            if (!isListening) {
                playSound(voiceStartSound); // Play start sound
                voiceSearchBtn.classList.add('listening'); // Add visual cue
                searchInput.placeholder = "Listening...";
                recognition.start();
                isListening = true;
                console.log("Voice search started.");
            } else {
                playSound(voiceEndSound); // Play end sound
                voiceSearchBtn.classList.remove('listening'); // Remove visual cue
                searchInput.placeholder = "Search...";
                recognition.stop();
                isListening = false;
                console.log("Voice search stopped.");
            }
        });

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            console.log("Speech recognized:", transcript);
            if (searchInput) {
                searchInput.value = transcript; // Write voice input to search box
                // Trigger an 'input' event so existing search listeners pick it up
                const inputEvent = new Event('input', { bubbles: true });
                searchInput.dispatchEvent(inputEvent);

                // Optionally, trigger a search immediately if your search logic is tied to a button click
                // const searchIcon = document.querySelector('.search-icon');
                // if (searchIcon) {
                //     searchIcon.click(); // Simulate click on search icon
                // }
            }
            playSound(voiceEndSound); // Play end sound
            voiceSearchBtn.classList.remove('listening'); // Remove visual cue
            searchInput.placeholder = "Search...";
            isListening = false;
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            showMessageBox(`Voice search error: ${event.error}`, 'error');
            playSound(voiceEndSound); // Play end sound
            voiceSearchBtn.classList.remove('listening'); // Remove visual cue
            searchInput.placeholder = "Search...";
            isListening = false;
        };

        recognition.onend = () => {
            console.log("Speech recognition ended.");
            if (isListening) { // If it ended without manual stop, means no speech detected or timed out
                playSound(voiceEndSound); // Play end sound
                voiceSearchBtn.classList.remove('listening'); // Remove visual cue
                searchInput.placeholder = "Search...";
                isListening = false;
            }
        };

    } else if (voiceSearchBtn) {
        // If SpeechRecognition is not supported, hide the button or inform the user
        voiceSearchBtn.style.display = 'none';
        console.warn("Web Speech API not supported in this browser.");
        showMessageBox("Your browser does not support voice search.", 'info', 5000);
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

// Placeholder for fetchAndDisplayTrendingSongs
function fetchAndDisplayTrendingSongs() {
    console.log("Fetching and displaying trending songs (placeholder - now handled by existing HTML).");
    // No longer dynamically populates HTML here per user request.
}

// Placeholder for fetchAndDisplayPopularAlbums
function fetchAndDisplayPopularAlbums() {
    console.log("Fetching and displaying popular albums (placeholder - now handled by existing HTML).");
    // No longer dynamically populates HTML here per user request.
}

// Placeholder for fetchAndDisplayPopularArtists
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
            spotifyLoginBtn.style.marginTop = '10px';
        }
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
        }, 500);
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
        if (popupOverlay) popupOverlay.classList.remove('active');
        popupOverlay.classList.add('invisible', 'opacity-0');
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
});
