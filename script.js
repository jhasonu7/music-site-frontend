// --- YouTube Iframe API Loader ---
// This code loads the IFrame Player API asynchronously.
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// --- Global Variables ---
let currentAlbum = null; // Stores the currently loaded album data
let currentTrackIndex = 0; // Index of the currently playing track within currentAlbum.tracks
let isRepeat = false; // Flag for repeat mode
let isShuffle = false; // Flag for shuffle mode
let allAlbumsData = []; // This will store albums fetched from the backend for search lookups

let ytPlayer = null; // Global variable to hold the YouTube player instance
let spotifyPlayer = null; // Global variable to hold the Spotify player instance
let spotifyAccessToken = null; // Spotify access token
let spotifyDeviceId = null; // Spotify device ID for playback
let progressBarInterval = null; // To clear the interval for progress bar updates
let searchMessageTimeout = null; // To clear the timeout for search messages
let searchMessageContainer = null; // Global variable to hold the dynamically created search message container

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
const playerControls = document.querySelector('.player-controls'); // Assuming a container for player controls

// Hamburger menu and sidebar elements
const hamburger = document.querySelector('.hamburger'); // New reference for hamburger
const sidebar = document.querySelector('.left.sidebar'); // Corrected selector for sidebar
const overlay = document.getElementById('overlay'); // Assuming ID for overlay
const closeBtn = document.querySelector('.close-btn'); // New reference for close button

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
 * Function to enable/disable main player controls based on playback type.
 * Controls are disabled for embedded content (Spotify/SoundCloud iframes) as they cannot be controlled directly.
 * @param {boolean} enable - True to enable, false to disable.
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
 * Function to stop all active playback (native audio, YouTube, Spotify) and reset the player UI.
 */
function stopAllPlayback() {
    audio.pause();
    audio.src = '';
    audio.currentTime = 0;

    if (ytPlayer) {
        ytPlayer.destroy(); // Destroy the YouTube player instance
        ytPlayer = null;
    }

    if (spotifyPlayer) {
        spotifyPlayer.pause(); // Pause Spotify playback
        // spotifyPlayer.disconnect(); // Disconnecting might be too aggressive if user wants to switch between Spotify tracks
        // spotifyPlayer = null; // Don't destroy player, just pause it
    }

    // Clear any existing iframe/youtube player div/raw HTML embed from the player-left container
    const existingPlayerContainer = playerLeft.querySelector('#dynamic-player-container');
    if (existingPlayerContainer) {
        existingPlayerContainer.remove();
    }
    const existingYoutubePlayerDiv = playerLeft.querySelector('#youtube-player-container'); // Specific for YouTube API
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
    if (playPauseBtn) playPauseBtn.textContent = '▶'; // Set to play icon

    togglePlayerControls(true); // Re-enable controls when stopping all playback
}

// Plays a specific track, handling different media types (YouTube, Spotify, SoundCloud, native audio).
// It updates the player bar UI and manages the progress bar.
async function playTrack(track, indexInAlbum) {
    if (!track) {
        console.error("Attempted to play null or undefined track.");
        return;
    }

    stopAllPlayback(); // Stop any current playback before starting new one

    // Update global current track index
    if (currentAlbum && indexInAlbum !== undefined) {
        currentTrackIndex = indexInAlbum;
    }

    // Update player bar UI (common for all types)
    if (playerImg) playerImg.src = track.img || 'https://placehold.co/80x80/000000/FFFFFF?text=Track'; // Fallback image
    if (trackTitleDisplay) trackTitleDisplay.textContent = track.title || 'Unknown Title';
    if (trackArtistDisplay) trackArtistDisplay.textContent = track.artist || 'Unknown Artist';

    // --- Play Raw HTML Embed (e.g., Spotify iframe for playlists) ---
    // This logic is for displaying a miniature embed in the player bar.
    if (track.rawHtmlEmbed) {
        console.log("Playing via Raw HTML Embed (Player Bar):", track.rawHtmlEmbed);
        // Hide the player image
        if (playerImg) playerImg.style.display = 'none';

        // Create a dedicated container for the raw HTML embed in the player-left area
        const dynamicPlayerContainer = document.createElement('div');
        dynamicPlayerContainer.id = 'dynamic-player-container';
        // Apply styles to make it fit where the album art usually is
        dynamicPlayerContainer.style.width = '80px';
        dynamicPlayerContainer.style.height = '80px';
        dynamicPlayerContainer.style.borderRadius = '8px';
        dynamicPlayerContainer.style.overflow = 'hidden'; // Important for iframes that might be larger
        dynamicPlayerContainer.style.display = 'flex'; // Use flexbox to center content if needed
        dynamicPlayerContainer.style.justifyContent = 'center';
        dynamicPlayerContainer.style.alignItems = 'center';

        playerLeft.prepend(dynamicPlayerContainer);

        // Insert a simplified iframe for the player bar.
        // We'll extract the src and create a new iframe for the player bar.
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = track.rawHtmlEmbed;
        const originalIframeSrc = tempDiv.querySelector('iframe')?.src;

        if (originalIframeSrc) {
            const miniIframe = document.createElement('iframe');
            miniIframe.src = originalIframeSrc;
            miniIframe.width = '100%';
            miniIframe.height = '100%';
            miniIframe.frameBorder = '0';
            miniIframe.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
            miniIframe.loading = 'lazy';
            miniIframe.style.borderRadius = '12px'; // Match original style
            dynamicPlayerContainer.appendChild(miniIframe);
        }

        // Update player bar UI for raw HTML embed (only visual info)
        // Set play button to pause icon to visually indicate playing
        if (playPauseBtn) playPauseBtn.textContent = '⏸';
        if (progressBar) progressBar.value = 0;
        if (currentTimeDisplay) currentTimeDisplay.textContent = '0:00'; // Cannot fetch real-time data from iframe
        if (durationDisplay) durationDisplay.textContent = 'N/A'; // Cannot fetch real-time data from iframe

        togglePlayerControls(false); // Disable main controls for embedded content as they cannot control the iframe
    }
    // --- Play SoundCloud Track (via embed) ---
    // Check for both 'soundcloudEmbed' and 'fullSoundcloudEmbed'
    else if (track.soundcloudEmbed || track.fullSoundcloudEmbed) {
        const soundcloudEmbedContent = track.soundcloudEmbed || track.fullSoundcloudEmbed;
        console.log("Playing via SoundCloud Embed (Player Bar):", soundcloudEmbedContent);
        // Hide the player image
        if (playerImg) playerImg.style.display = 'none';

        // Create a dedicated container for the SoundCloud embed in the player-left area
        const dynamicPlayerContainer = document.createElement('div');
        dynamicPlayerContainer.id = 'dynamic-player-container';
        dynamicPlayerContainer.style.width = '80px';
        dynamicPlayerContainer.style.height = '80px';
        dynamicPlayerContainer.style.borderRadius = '8px';
        dynamicPlayerContainer.style.overflow = 'hidden';
        dynamicPlayerContainer.style.display = 'flex';
        dynamicPlayerContainer.style.justifyContent = 'center';
        dynamicPlayerContainer.style.alignItems = 'center';

        playerLeft.prepend(dynamicPlayerContainer);

        // Insert a simplified iframe for the player bar.
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = soundcloudEmbedContent;
        const originalIframeSrc = tempDiv.querySelector('iframe')?.src;

        if (originalIframeSrc) {
            const miniIframe = document.createElement('iframe');
            miniIframe.src = originalIframeSrc;
            miniIframe.width = '100%';
            miniIframe.height = '100%';
            miniIframe.frameBorder = '0';
            miniIframe.allow = 'autoplay'; // SoundCloud embeds typically support autoplay
            miniIframe.loading = 'lazy';
            miniIframe.style.borderRadius = '12px';
            dynamicPlayerContainer.appendChild(miniIframe);
        }

        // Update player bar UI for SoundCloud embed (only visual info)
        if (playPauseBtn) playPauseBtn.textContent = '⏸';
        if (progressBar) progressBar.value = 0;
        if (currentTimeDisplay) currentTimeDisplay.textContent = '0:00'; // Cannot fetch real-time data from iframe
        if (durationDisplay) durationDisplay.textContent = 'N/A'; // Cannot fetch real-time data from iframe

        togglePlayerControls(false); // Disable main controls for embedded content
    }
    // --- Play Audiomack Track (via embed) ---
    else if (track.audiomackEmbed) {
        console.log("Playing via Audiomack Embed (Player Bar):", track.audiomackEmbed);
        // Hide the player image
        if (playerImg) playerImg.style.display = 'none';

        // Create a dedicated container for the Audiomack embed in the player-left area
        const dynamicPlayerContainer = document.createElement('div');
        dynamicPlayerContainer.id = 'dynamic-player-container';
        dynamicPlayerContainer.style.width = '80px';
        dynamicPlayerContainer.style.height = '80px';
        dynamicPlayerContainer.style.borderRadius = '8px';
        dynamicPlayerContainer.style.overflow = 'hidden';
        dynamicPlayerContainer.style.display = 'flex';
        dynamicPlayerContainer.style.justifyContent = 'center';
        dynamicPlayerContainer.style.alignItems = 'center';

        playerLeft.prepend(dynamicPlayerContainer);

        // Insert a simplified iframe for the player bar.
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = track.audiomackEmbed;
        const originalIframeSrc = tempDiv.querySelector('iframe')?.src;

        if (originalIframeSrc) {
            const miniIframe = document.createElement('iframe');
            miniIframe.src = originalIframeSrc;
            miniIframe.width = '100%';
            miniIframe.height = '100%';
            miniIframe.frameBorder = '0';
            miniIframe.scrolling = 'no'; // Audiomack embeds often use no scrolling
            miniIframe.title = track.title || "Audiomack Embed";
            miniIframe.loading = 'lazy';
            miniIframe.style.borderRadius = '12px';
            dynamicPlayerContainer.appendChild(miniIframe);
        }

        // Update player bar UI for Audiomack embed (only visual info)
        if (playPauseBtn) playPauseBtn.textContent = '⏸';
        if (progressBar) progressBar.value = 0;
        if (currentTimeDisplay) currentTimeDisplay.textContent = '0:00'; // Cannot fetch real-time data from iframe
        if (durationDisplay) durationDisplay.textContent = 'N/A'; // Cannot fetch real-time data from iframe

        togglePlayerControls(false); // Disable main controls for embedded content
    }
    // --- Play Spotify Track (via SDK) ---
    else if (track.spotifyUri && spotifyPlayer && spotifyAccessToken && spotifyDeviceId) {
        console.log("Playing via Spotify Web Playback SDK:", track.spotifyUri);
        try {
            const playOptions = {
                device_id: spotifyDeviceId,
                uris: [track.spotifyUri],
                position_ms: 0
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
                console.warn('Failed to play Spotify track. Please ensure Spotify is open and you are logged in, or try logging in again.');

                if (response.status === 401) { // Token expired or invalid
                    spotifyAccessToken = null; // Clear token
                    // initiateSpotifyLogin(); // Prompt re-login - this function is not defined in the provided code
                }
                if (playPauseBtn) playPauseBtn.textContent = '▶';
                togglePlayerControls(true); // Re-enable if playback fails
                return;
            }
            console.log('Spotify track started successfully.');
            if (playPauseBtn) playPauseBtn.textContent = '⏸';
            togglePlayerControls(true); // Enable controls for SDK playback

            // Start updating progress bar for Spotify
            if (progressBarInterval) clearInterval(progressBarInterval);
            progressBarInterval = setInterval(async () => {
                if (spotifyPlayer) {
                    const state = await spotifyPlayer.getCurrentState();
                    if (state && !state.paused) {
                        const currentTime = state.position / 1000; // ms to seconds
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
                            stopAllPlayback(); // End of album
                        }
                    }
                }
            }, 1000);

        } catch (error) {
            console.error("Error playing Spotify track:", error);
            console.warn("Error playing Spotify track. Please ensure Spotify is open and you are logged in.");
            if (playPauseBtn) playPauseBtn.textContent = '▶';
            togglePlayerControls(true); // Re-enable if error
        }

    }
    // --- Play YouTube Track ---
    else if (track.iframeSrc && track.iframeSrc.includes('https://www.youtube.com/embed/')) {
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
            playerDiv.style.borderRadius = '8px';
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
                        event.target.playVideo();
                        if (playPauseBtn) playPauseBtn.textContent = '⏸';
                        // Set initial volume for YouTube player
                        if (volumeBar) event.target.setVolume(volumeBar.value * 100);
                        togglePlayerControls(true); // Enable controls for YouTube playback

                        // Start updating progress bar
                        if (progressBarInterval) clearInterval(progressBarInterval);
                        progressBarInterval = setInterval(() => {
                            if (ytPlayer && ytPlayer.getPlayerState() === YT.PlayerState.PLAYING) {
                                const currentTime = ytPlayer.getCurrentTime();
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
                            if (playPauseBtn) playPauseBtn.textContent = '⏸';
                        } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
                            if (playPauseBtn) playPauseBtn.textContent = '▶';
                            if (event.data === YT.PlayerState.ENDED) {
                                // Handle track ending for YouTube player
                                if (isRepeat) {
                                    ytPlayer.seekTo(0);
                                    ytPlayer.playVideo();
                                } else if (isShuffle) {
                                    currentTrackIndex = Math.floor(Math.random() * currentAlbum.tracks.length);
                                    playTrack(currentAlbum.tracks[currentTrackIndex], currentTrackIndex);
                                } else {
                                    nextTrack(); // Try to play next track automatically
                                }
                            }
                        }
                    },
                    'onError': (event) => {
                        console.error("YouTube Player Error:", event.data);
                        stopAllPlayback();
                        console.warn("Error playing YouTube video. Please ensure the YouTube API script is loaded and the URL is correct.");
                        togglePlayerControls(true); // Re-enable if error
                    }
                }
            });
        } else {
            console.error("YouTube Iframe API not loaded or video ID not found.");
            console.warn("Could not load YouTube video. Please ensure the YouTube API script is loaded and the URL is correct.");
            togglePlayerControls(true); // Re-enable if error
        }

    }
    // --- Play Native Audio Track ---
    else {
        // Play using the standard audio element
        audio.src = track.src;
        audio.play();
        if (playPauseBtn) playPauseBtn.textContent = '⏸';
        togglePlayerControls(true); // Enable controls for native audio

        audio.onloadedmetadata = () => {
            if (durationDisplay) durationDisplay.textContent = formatTime(audio.duration);
            if (progressBar) progressBar.max = audio.duration;
            if (progressBar) progressBar.value = audio.currentTime;
        };

        // Start updating progress bar for native audio
        if (progressBarInterval) clearInterval(progressBarInterval); // Clear any old interval
        progressBarInterval = setInterval(() => {
            if (!audio.paused && !audio.ended) {
                if (currentTimeDisplay) currentTimeDisplay.textContent = formatTime(audio.currentTime);
                if (progressBar) progressBar.value = audio.currentTime;
            }
        }, 1000);

        audio.onended = () => {
            // This event listener is primarily for native audio. YouTube/Spotify APIs handle their own 'ended' state.
            if (!currentAlbum || !currentAlbum.tracks || currentAlbum.tracks.length === 0) return;

            // If the current track is an embed, we cannot auto-advance/repeat via this event.
            if (currentAlbum.tracks[currentTrackIndex]?.rawHtmlEmbed || currentAlbum.tracks[currentTrackIndex]?.soundcloudEmbed || currentAlbum.tracks[currentTrackIndex]?.audiomackEmbed || currentAlbum.tracks[currentTrackIndex]?.fullSoundcloudEmbed) {
                console.warn("Auto-advance/repeat is not supported for raw HTML, SoundCloud, or Audiomack embedded content.");
                stopAllPlayback(); // Stop playback when the native audio ends (if it was playing)
                return;
            }
            if (isRepeat) {
                playTrack(currentAlbum.tracks[currentTrackIndex], currentTrackIndex); // Repeat current track
            } else if (isShuffle) {
                currentTrackIndex = Math.floor(Math.random() * currentAlbum.tracks.length);
                playTrack(currentAlbum.tracks[currentTrackIndex], currentTrackIndex);
            } else {
                currentTrackIndex++;
                playTrack(currentAlbum.tracks[currentTrackIndex], currentTrackIndex);
            }
        };
    }

    // Highlight currently playing row in album table (if overlay is open)
    if (albumDetailsTracksBody) {
        document.querySelectorAll('#albumDetails-tracks tr').forEach((row, i) => {
            const isPlaying = (currentAlbum && i === currentTrackIndex);
            row.classList.toggle('playing', isPlaying);

            // Update play icon in table row
            const iconCell = row.querySelector('td:first-child');
            if (iconCell) {
                iconCell.innerHTML = isPlaying
                    ? `<svg class="eq-icon" viewBox="0 0 24 24"><rect x="3" y="10" width="3" height="10"/><rect x="10" y="6" width="3" height="14"/><rect x="17" y="2" width="3" height="18"/></svg>`
                    : i + 1;
            }
        });
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
            } else {
                ytPlayer.playVideo();
            }
        } else if (spotifyPlayer && currentAlbum && currentAlbum.tracks[currentTrackIndex]?.spotifyUri) {
            // Control Spotify player play/pause
            const state = await spotifyPlayer.getCurrentState();
            if (state) {
                await spotifyPlayer.togglePlay();
            } else {
                // If no state (e.g., Spotify not playing anything), try to play the current track
                playTrack(currentAlbum.tracks[currentTrackIndex], currentTrackIndex);
            }
        } else if (audio.src) { // Check if native audio has a source loaded
            if (audio.paused || audio.ended) {
                audio.play();
                playPauseBtn.textContent = '⏸';
            } else {
                audio.pause();
                playPauseBtn.textContent = '▶';
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
    });
}

// Function to play the next track
function nextTrack() {
    if (!currentAlbum || !currentAlbum.tracks || currentAlbum.tracks.length === 0) {
        // If it's an album that is itself a rawHtmlEmbed (like a playlist),
        // we can't 'next track' within it from our controls.
        if (currentAlbum && (currentAlbum.rawHtmlEmbed || currentAlbum.fullSoundcloudEmbed || currentAlbum.audiomackEmbed || currentAlbum.soundcloudEmbed)) {
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
        // If not repeat or shuffle and at end, stop
        stopAllPlayback();
        return; // Exit if no next track and not repeating/shuffling
    }
    playTrack(currentAlbum.tracks[currentTrackIndex], currentTrackIndex);
}

// Function to play the previous track
function prevTrack() {
    if (!currentAlbum || !currentAlbum.tracks || currentAlbum.tracks.length === 0) {
        if (currentAlbum && (currentAlbum.rawHtmlEmbed || currentAlbum.fullSoundcloudEmbed || currentAlbum.audiomackEmbed || currentAlbum.soundcloudEmbed)) {
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
        // If not repeat or shuffle and at beginning, stop
        stopAllPlayback(); // Now stop after checking repeat/shuffle
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
        } else if (spotifyPlayer && currentAlbum && currentAlbum.tracks[currentTrackIndex]?.spotifyUri) {
            // Control Spotify player progress
            const seekTimeMs = parseFloat(e.target.value) * 1000; // Convert seconds to milliseconds
            await spotifyPlayer.seek(seekTimeMs);
        } else if (audio.duration) {
            // Control native audio progress
            audio.currentTime = parseFloat(e.target.value);
        } else if (currentAlbum && (currentAlbum.tracks[currentTrackIndex]?.rawHtmlEmbed || currentAlbum.tracks[currentTrackIndex]?.soundcloudEmbed || currentAlbum.tracks[currentTrackIndex]?.audiomackEmbed || currentAlbum.tracks[currentTrackIndex]?.fullSoundcloudEmbed)) {
            // No direct control for embedded iframes, so we don't allow seeking.
            console.log("Seeking not possible for embedded content (Spotify/SoundCloud/Audiomack).");
        }
    });
}

if (volumeBar) {
    volumeBar.addEventListener('input', (e) => {
        const volume = parseFloat(e.target.value);
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
            if (repeatBtn) repeatBtn.classList.remove('active');
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
 * Attaches event listeners to existing HTML album cards.
 * This function is called once on DOMContentLoaded.
 */
function attachEventListenersToHtmlCards() {
    const albumCards = document.querySelectorAll('.spotifyPlaylists .card, .AlbumPlaylists .card'); // Select all cards in both sections

    albumCards.forEach(card => {
        // Find the album title and artist from the HTML card's content
        const cardTitleElement = card.querySelector('.card-title');
        const cardArtistElement = card.querySelector('.card-artists');
        const cardTitle = cardTitleElement ? cardTitleElement.textContent.trim() : '';
        const cardArtist = cardArtistElement ? cardArtistElement.textContent.trim() : '';

        // Find the corresponding album data from the fetched allAlbumsData
        const albumData = allAlbumsData.find(album =>
            (album.title && album.title.toLowerCase() === cardTitle.toLowerCase()) &&
            (album.artist && album.artist.toLowerCase() === cardArtist.toLowerCase())
        );

        if (!albumData) {
            console.warn(`Album data not found in backend for HTML card: "${cardTitle}" by "${cardArtist}". This card will not be interactive.`);
            return; // Skip attaching listeners if data isn't found
        }

        // Attach event listener to the play button within the card
        const playButton = card.querySelector('.play-button');
        if (playButton) {
            playButton.addEventListener('click', e => {
                e.stopPropagation(); // Prevent card clicks if any
                openAlbumDetails(albumData);
                if (albumData.tracks && albumData.tracks.length > 0) {
                    playTrack(albumData.tracks[0], 0);
                } else if (albumData.rawHtmlEmbed || albumData.fullSoundcloudEmbed || albumData.audiomackEmbed || albumData.soundcloudEmbed) {
                    const embedTrack = {
                        title: albumData.title,
                        artist: albumData.artist,
                        img: albumData.coverArt,
                        rawHtmlEmbed: albumData.rawHtmlEmbed,
                        fullSoundcloudEmbed: albumData.fullSoundcloudEmbed,
                        audiomackEmbed: albumData.audiomackEmbed,
                        soundcloudEmbed: albumData.soundcloudEmbed
                    };
                    playTrack(embedTrack, 0);
                }
            });
        }

        // Attach event listener to the card itself to open album details without playing
        card.addEventListener('click', e => {
            openAlbumDetails(albumData);
        });
    });
}


// --- Fetch Albums from Backend ---
async function fetchAlbums() {
    try {
        // IMPORTANT: The frontend is running on http://10.239.241.228:5500.
        // Assuming your backend is running on the same IP address but on port 5000.
        // If your backend is on a different IP, please update this URL accordingly.
        const response = await fetch('https://240453584c92.ngrok-free.app/api/albums');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        allAlbumsData = await response.json();
        console.log("Albums fetched from backend:", allAlbumsData);

        // Clear any previous error message if fetch was successful
        const cardContainer = document.querySelector('.spotifyPlaylists .cardcontainer');
        if (cardContainer) {
            // Remove any dynamically added error message div
            const existingErrorMessage = cardContainer.querySelector('.backend-error-message');
            if (existingErrorMessage) {
                existingErrorMessage.remove();
            }
        }

    } catch (error) {
        console.error("Error fetching albums:", error);
        const cardContainer = document.querySelector('.spotifyPlaylists .cardcontainer');
        if (cardContainer) {
            // Create the error message div dynamically
            const errorMessageDiv = document.createElement('div');
            errorMessageDiv.classList.add('backend-error-message'); // Add a class for easier identification and removal
            errorMessageDiv.style.cssText = `
                color: white;
                text-align: center;
                padding: 20px;
                background-color: #333;
                border-radius: 8px;
                margin-top: 50px;
            `;
            errorMessageDiv.innerHTML = `
                <p>Failed to load albums from backend. Please ensure your backend server is running and accessible at:</p>
                <p style="font-weight: bold; color: #1ED760;">https://240453584c92.ngrok-free.app</p>
                <p>Check your server logs for more details.</p>
            `;
            // Clear existing content and append the error message
            cardContainer.innerHTML = ''; // Clear any existing cards/content
            cardContainer.appendChild(errorMessageDiv);
        }
    }
}


// --- Search functionality to open album and track by name ---
let debounceTimer;

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
            // and pointer-events: none ensures it doesn't block clicks.
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
        searchMessageContainer.style.opacity = '0'; // Ensure it's hidden and transparent
        searchMessageContainer.style.transform = 'translateY(-10px)'; // Slide up
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
            debounceTimer = setTimeout(() => {
                searchAndOpenAlbum(searchQuery);
            }, 300); // Wait for 300ms after the user stops typing
        } else {
            // If search query is empty, close overlay and clear any search messages
            closeAlbumOverlay();
            clearSearchMessage();
        }
    });
}

// Function to perform the search and open the album - NOW ONLY USES BACKEND
async function searchAndOpenAlbum(searchQuery) {
    console.log(`--- Initiating backend-only search for: "${searchQuery}" ---`);
    let matchedAlbum = null;
    let matchedTrackTitle = null; // Still useful if backend returns a specific track match

    try {
        // Always attempt backend search
        console.log(`Attempting backend search for query: "${searchQuery}"...`);
        const response = await fetch(`https://240453584c92.ngrok-free.app/api/albums?search=${encodeURIComponent(searchQuery)}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const searchResults = await response.json();
        console.log("Backend search results:", searchResults);

        if (searchResults.length > 0) {
            matchedAlbum = searchResults[0]; // Take the first result from backend
            console.log(`Backend match found: "${matchedAlbum.title}" for query "${searchQuery}"`);
            clearSearchMessage(); // Clear message if results are found

            // Re-check tracks in the backend-matched album for highlighting (optional, if your backend doesn't specify)
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
        } else {
            console.log(`No backend match found for query: "${searchQuery}"`);
            // Display red alert message for "No albums found"
            displaySearchMessage("No albums found matching your search.", 'error');
        }

    } catch (error) {
        console.error("Error during backend search:", error);
        displaySearchMessage("Error during search. Please try again later.", 'error'); // Display error message
    }

    if (matchedAlbum) {
        console.log(`Calling openAlbumDetails for: "${matchedAlbum.title}" with highlight: "${matchedTrackTitle || 'none'}"`);
        console.log("Matched Album data for openAlbumDetails:", matchedAlbum);
        openAlbumDetails(matchedAlbum, matchedTrackTitle);
    } else {
        // If no album found, the front page cards remain untouched.
        // The message is already handled by displaySearchMessage.
        console.log("No matching album or track found from backend. Overlay not opened.");
        // Removed closeAlbumOverlay() here to prevent unintended closing of unrelated overlays.
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
 * Opens the album details overlay, populating it with album and track information.
 * It can also highlight a specific track if a search query resulted in a track match.
 * @param {object} albumData - The data of the album to display.
 * @param {string} [highlightTrackTitle=null] - Optional title of a track to highlight in the tracklist.
 */
function openAlbumDetails(albumData, highlightTrackTitle = null) {
    console.log("Album data received by openAlbumDetails:", albumData); // Crucial log for debugging embed properties

    // Set the current album globally
    currentAlbum = albumData;
    currentTrackIndex = 0; // Reset track index when opening a new album

    // Get reference to the new album-details-content container
    // Note: album-details-content ID is not present in the provided HTML.
    // Assuming albumDetails is the main container for traditional album details.
    const albumDetailsContent = document.getElementById('albumDetails'); // Use albumDetails as the main content container

    // Remove explicit background color and border-radius from JavaScript
    if (albumOverlay) {
        albumOverlay.style.removeProperty('background-color'); // Remove background color
        albumOverlay.style.removeProperty('border-radius'); // Remove border-radius
        // Remove all dynamic positioning and sizing styles
        albumOverlay.style.removeProperty('position');
        albumOverlay.style.removeProperty('top');
        albumOverlay.style.removeProperty('left');
        albumOverlay.style.removeProperty('width');
        albumOverlay.style.removeProperty('height');
        albumOverlay.style.removeProperty('margin');
        albumOverlay.style.removeProperty('padding');
        albumOverlay.style.removeProperty('z-index');
        // Do not remove display here, as it's controlled by the if/else below
        // albumOverlay.style.removeProperty('display');
        albumOverlay.style.removeProperty('justify-content');
        albumOverlay.style.removeProperty('align-items');
        albumOverlay.style.removeProperty('overflow');
    }

    // 1. Populate the album header details
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
    }
    if (albumFullEmbedContainer) {
        albumFullEmbedContainer.innerHTML = ''; // Clear existing embed
        albumFullEmbedContainer.style.display = 'none'; // Hide by default
    }

    // If the album has a raw HTML embed OR a full SoundCloud embed OR Audiomack embed, display it in the dedicated container
    if ((albumData.rawHtmlEmbed || albumData.fullSoundcloudEmbed || albumData.audiomackEmbed || albumData.soundcloudEmbed) && albumFullEmbedContainer) {
        // Hide the traditional album details content
        if (albumDetailsContent) albumDetailsContent.style.display = 'none';

        // Prioritize soundcloudEmbed, then fullSoundcloudEmbed, then rawHtmlEmbed, then audiomackEmbed
        const embedContent = albumData.soundcloudEmbed || albumData.fullSoundcloudEmbed || albumData.rawHtmlEmbed || albumData.audiomackEmbed;
        console.log("openAlbumDetails: Attempting to display full embed. Content received:", embedContent ? embedContent.substring(0, 200) + '...' : 'No content'); // Log first 200 chars

        albumFullEmbedContainer.innerHTML = ''; // Clear existing content
        albumFullEmbedContainer.style.display = 'flex'; // Use flexbox to center content
        albumFullEmbedContainer.style.justifyContent = 'center';
        albumFullEmbedContainer.style.alignItems = 'center';
        albumFullEmbedContainer.style.position = 'absolute'; // Keep absolute positioning to fill parent
        albumFullEmbedContainer.style.top = '0';
        albumFullEmbedContainer.style.width = '100%';
        albumFullEmbedContainer.style.height = '100%';
        albumFullEmbedContainer.style.zIndex = '10';
        albumFullEmbedContainer.style.margin = '0';
        albumFullEmbedContainer.style.padding = '0';
        albumFullEmbedContainer.style.overflow = 'hidden'; // Hide overflow for the container itself
        albumFullEmbedContainer.style.backgroundColor = '#2e0e0e'; // Set to album overlay background color
        albumFullEmbedContainer.style.borderRadius = '12px'; // Match overlay's rounded corners

        // Hide the player bar when an embedded album is opened (as these are self-contained players)
        if (playerBar) {
            playerBar.style.display = 'none';
        }

        // Adjust albumOverlay height and position to take full available space when player bar is hidden
        if (albumOverlay && topBar) {
            const topBarHeight = topBar.offsetHeight;
            const playerBarHeight = playerBar ? playerBar.offsetHeight : 0; // Get player bar height

            albumOverlay.style.position = 'fixed'; // Change to fixed for full viewport coverage
            albumOverlay.style.top = `${topBarHeight}px`;
            albumOverlay.style.bottom = `${playerBarHeight}px`; // Account for player bar height
            albumOverlay.style.right = '0'; // Stretch to the very right (ensures full width)
            albumOverlay.style.width = 'auto'; // Let left/right define width
            albumOverlay.style.height = 'auto'; // Let top/bottom define height
            albumOverlay.style.zIndex = '999'; // Ensure it's on top of everything

            if (window.innerWidth < 772) {
                albumOverlay.style.left = '0'; // Cover entire width if sidebar is hidden
            } else {
                albumOverlay.style.left = '25%';
            }
        }


        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = embedContent;
        const originalIframe = tempDiv.querySelector('iframe');

        if (originalIframe) {
            console.log("openAlbumDetails: Iframe element found in embed content.");
            originalIframe.removeAttribute('width');
            originalIframe.removeAttribute('height');
            originalIframe.style.border = '0';
            originalIframe.style.borderRadius = '12px';

            // Function to calculate and apply dimensions to make the iframe *cover* the container
            const updateIframeDimensions = () => {
                const containerWidth = albumFullEmbedContainer.offsetWidth;
                const containerHeight = albumFullEmbedContainer.offsetHeight;

                // Default aspect ratio for most video embeds
                const aspectRatio = 16 / 9;

                let finalWidth;
                let finalHeight;

                // Calculate dimensions to *cover* the container while maintaining aspect ratio
                // If container's aspect ratio is wider than embed's, scale based on height
                if (containerWidth / containerHeight > aspectRatio) {
                    finalHeight = containerHeight;
                    finalWidth = containerHeight * aspectRatio;
                } else {
                    // If container's aspect ratio is taller than or equal to embed's, scale based on width
                    finalWidth = containerWidth;
                    finalHeight = containerWidth / aspectRatio;
                }

                // Ensure the iframe covers the entire container, even if it means overflowing one dimension
                if (finalWidth < containerWidth) {
                    finalWidth = containerWidth;
                    finalHeight = containerWidth / aspectRatio;
                }
                if (finalHeight < containerHeight) {
                    finalHeight = containerHeight;
                    finalWidth = containerHeight * aspectRatio;
                }

                originalIframe.style.width = `${finalWidth}px`;
                originalIframe.style.height = `${finalHeight}px`;
                originalIframe.style.margin = 'auto'; // Center the iframe within the flex container
                originalIframe.style.display = 'block'; // Ensure it's a block element for margin auto

                console.log(`openAlbumDetails: Iframe dimensions set to: width=${finalWidth}px, height=${finalHeight}px`);

                // Also update albumOverlay's left property on resize
                if (albumOverlay && window.innerWidth < 772) {
                    albumOverlay.style.left = '0';
                } else if (albumOverlay) {
                    albumOverlay.style.left = '25%';
                }
            };

            // Initial dimension update
            updateIframeDimensions();

            // Add a resize listener to update dimensions if the overlay container changes size
            window.addEventListener('resize', updateIframeDimensions);
            // Remove the listener when the overlay is closed to prevent memory leaks
            albumOverlay.addEventListener('transitionend', (e) => {
                if (e.propertyName === 'opacity' && albumOverlay.classList.contains('hidden')) {
                    window.removeEventListener('resize', updateIframeDimensions);
                }
            });

            // Handle autoplay for the full embed in the overlay
            let iframeSrc = originalIframe.src;
            console.log("openAlbumDetails: Original iframe src before autoplay:", iframeSrc); // Debugging log
            if (iframeSrc.includes('youtube.com/embed/') && !iframeSrc.includes('autoplay=1')) {
                iframeSrc += (iframeSrc.includes('?') ? '&' : '?') + 'autoplay=1';
            } else if (iframeSrc.includes('w.soundcloud.com/player/') && !iframeSrc.includes('autoplay=true')) {
                iframeSrc += (iframeSrc.includes('?') ? '&' : '?') + 'autoplay=true';
            } else if (iframeSrc.includes('audiomack.com/embed/') && !iframeSrc.includes('autoplay=1')) {
                iframeSrc += (iframeSrc.includes('?') ? '&' : '?') + 'autoplay=1';
            }
            originalIframe.src = iframeSrc; // Update the src with autoplay
            console.log("openAlbumDetails: Updated iframe src with autoplay:", originalIframe.src); // Debugging log

            albumFullEmbedContainer.appendChild(originalIframe);
        } else {
            albumFullEmbedContainer.innerHTML = embedContent;
            console.warn("openAlbumDetails: Embed content did not contain an iframe. Appending raw HTML directly. This might not work as expected.");
        }
        if (closeOverlayBtn) {
            closeOverlayBtn.style.display = 'flex'; // Or 'block', depending on its original display type
            closeOverlayBtn.style.position = 'absolute'; // Ensure it's positioned relative to the overlay
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
            closeOverlayBtn.style.zIndex = '1000'; // Ensure it's above the embed
        }

    } else if (albumData.tracks && albumData.tracks.length > 0) {
        // Show the traditional album details content
        if (albumDetailsContent) albumDetailsContent.style.display = 'block';

        // Ensure header and tracks section are visible
        if (albumHeader) albumHeader.style.display = 'flex';
        if (albumTracksSection) albumTracksSection.style.display = 'block';
        if (albumPlayButton) albumPlayButton.style.display = 'inline-block';

        albumData.tracks.forEach((track, index) => {
            const row = document.createElement('tr');
            row.dataset.trackIndex = index;
            // Add data attributes for track info for easier access in playTrack
            row.dataset.title = track.title || 'Untitled';
            row.dataset.artist = track.artist || albumData.artist || 'Various Artists';
            row.dataset.img = track.img || albumData.coverArt; // Use track img or album cover
            row.dataset.src = track.src || ''; // For direct audio
            row.dataset.iframeSrc = track.iframeSrc || ''; // For YouTube
            row.dataset.spotifyUri = track.spotifyUri || ''; // For Spotify SDK
            row.dataset.rawHtmlEmbed = track.rawHtmlEmbed || ''; // For Spotify playlist embeds (mini player)
            row.dataset.soundcloudEmbed = track.soundcloudEmbed || ''; // For SoundCloud (mini player)
            row.dataset.audiomackEmbed = track.audiomackEmbed || ''; // For Audiomack (mini player)
            row.dataset.fullSoundcloudEmbed = track.fullSoundcloudEmbed || ''; // For SoundCloud (full player)


            row.innerHTML = `
                <td>${index + 1}</td>
                <td class="track-title">${track.title || 'Untitled'}</td>
                <td>${track.artist || albumData.artist || 'Various Artists'}</td>
                <td>${formatTime(track.duration)}</td>
            `;

            // Add highlight class if this track matches the search highlight
            if (highlightTrackTitle && (track.title || '').toLowerCase().includes(highlightTrackTitle.toLowerCase())) {
                row.classList.add('highlighted-search-result');
                // Optionally, auto-play this track if it's a search result
                playTrack(track, index);
            } else {
                row.classList.remove('highlighted-search-result'); // Ensure no lingering highlight
            }

            row.addEventListener('click', () => {
                // Remove 'playing' class from all rows first
                document.querySelectorAll('#albumDetails-tracks tr').forEach(r => r.classList.remove('playing'));
                row.classList.add('playing'); // Add 'playing' class to the clicked row

                playTrack(track, index); // Play the selected track
            });
            if (albumDetailsTracksBody) { // Check if tracksBody exists before appending
                albumDetailsTracksBody.appendChild(row);
            }
        });

        // Ensure the single close button is visible for non-embedded content
        if (closeOverlayBtn) {
            closeOverlayBtn.style.display = 'flex'; // Or 'block', depending on its original display type
            closeOverlayBtn.style.position = 'absolute'; // Ensure it's positioned relative to the overlay
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
            closeOverlayBtn.style.zIndex = '1000'; // Ensure it's on top
        }

    } else {
        // Show the traditional album details content
        if (albumDetailsContent) albumDetailsContent.style.display = 'block';

        // Ensure header and tracks section are visible
        if (albumHeader) albumHeader.style.display = 'flex';
        if (albumTracksSection) albumTracksSection.style.display = 'block';
        if (albumPlayButton) albumPlayButton.style.display = 'inline-block';
        if (albumDetailsTracksBody) { // Check if tracksBody exists before setting innerHTML
            albumDetailsTracksBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #aaa;">No individual tracks listed for this album.</td></tr>`;
        }

        // Ensure the single close button is visible even if no tracks
        if (closeOverlayBtn) {
            closeOverlayBtn.style.display = 'flex'; // Or 'block'
            closeOverlayBtn.style.position = 'absolute'; // Ensure it's positioned relative to the overlay
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
            closeOverlayBtn.style.zIndex = '1000'; // Ensure it's on top
        }
    }


    // Show the overlay for album details
    if (albumOverlay && topBar && rightPanel && playerBar) {
        albumOverlay.classList.remove('hidden');
        albumOverlay.classList.add('show');
    }
    document.body.style.overflow = 'hidden'; // Disable background scrolling when overlay is open

    // --- Automatically play the rawHtmlEmbed or fullSoundcloudEmbed if the album contains it ---
    // This handles the case where the "album" itself is a single embed like a playlist
    // This will put the miniature embed in the player bar.
    if (albumData.rawHtmlEmbed || albumData.fullSoundcloudEmbed || albumData.audiomackEmbed || albumData.soundcloudEmbed) {
        const dummyTrack = {
            title: albumData.title,
            artist: albumData.artist,
            img: albumData.coverArt,
            rawHtmlEmbed: albumData.rawHtmlEmbed,
            fullSoundcloudEmbed: albumData.fullSoundcloudEmbed,
            audiomackEmbed: albumData.audiomackEmbed,
            soundcloudEmbed: albumData.soundcloudEmbed // Pass both for robustness
        };
        playTrack(dummyTrack, 0); // Play the dummy track representing the embed
    }
}

/**
 * Function to close the album overlay.
 */
function closeAlbumOverlay() {
    if (albumOverlay) {
        albumOverlay.classList.add('hidden'); // Hide the overlay
        albumOverlay.classList.remove('show'); // Remove the show class

        // Ensure all inline styles are removed when closing
        // Note: We are now explicitly setting display properties in openAlbumDetails,
        // so removing them here should revert to CSS defaults, which is usually 'none' for .hidden
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
        // albumOverlay.style.removeProperty('display'); // Let 'hidden' class handle display
        albumOverlay.style.removeProperty('justify-content');
        albumOverlay.style.removeProperty('align-items');
        albumOverlay.style.removeProperty('overflow');
        albumOverlay.style.removeProperty('background-color');
        albumOverlay.style.removeProperty('border-radius');

        // Re-show the player bar when the overlay is closed
        if (playerBar) {
            playerBar.style.display = 'flex'; // Or 'block', depending on its original display type
        }

        // Clear the full embed container
        if (albumFullEmbedContainer) {
            albumFullEmbedContainer.innerHTML = '';
            albumFullEmbedContainer.style.display = 'none'; // Ensure it's hidden
            // Reset all inline styles that were applied for embeds
            albumFullEmbedContainer.style.removeProperty('position');
            albumFullEmbedContainer.style.removeProperty('top');
            albumFullEmbedContainer.style.removeProperty('left');
            albumFullEmbedContainer.style.removeProperty('right');
            albumFullEmbedContainer.style.removeProperty('bottom');
            albumFullEmbedContainer.style.removeProperty('z-index');
            albumFullEmbedContainer.style.removeProperty('margin');
            albumFullEmbedContainer.style.removeProperty('padding');
            albumFullEmbedContainer.style.removeProperty('overflow'); // Reset to default (e.g., 'visible')
            albumFullEmbedContainer.style.removeProperty('background-color');
            albumFullEmbedContainer.style.removeProperty('justify-content');
            albumFullEmbedContainer.style.removeProperty('align-items');
            albumFullEmbedContainer.style.removeProperty('border-radius');
            albumFullEmbedContainer.style.removeProperty('border'); // Remove the temporary border
        }

        // Re-show the traditional album details content if it was hidden
        const albumDetailsContent = document.getElementById('albumDetails'); // Use albumDetails as the main content container
        if (albumDetailsContent) albumDetailsContent.style.display = 'block';

        // Always reset header, tracks section, and album play button to their default visibility
        if (albumHeader) albumHeader.style.display = 'flex'; // Reset to default (flex in your CSS)
        if (albumTracksSection) albumTracksSection.style.display = 'block'; // Reset to default (block in your CSS)
        if (albumPlayButton) albumPlayButton.style.display = 'inline-block'; // Reset to default (inline-block in your CSS)

        // Ensure all album cards are visible after closing the overlay
        const albumCards = document.querySelectorAll('.card'); // Select all cards
        albumCards.forEach(card => {
            card.style.display = 'block'; // Ensure all cards are displayed
        });

        // Stop any currently playing media when closing the overlay
        stopAllPlayback();
    }
    document.body.style.overflow = ''; // Re-enable background scrolling
    clearSearchMessage(); // Clear search message when overlay is closed
}


// --- Spotify Web Playback SDK Integration ---

// Placeholder for Spotify login initiation (you'll need to implement the actual OAuth flow)
function initiateSpotifyLogin() {
    console.log("Initiating Spotify login...");
    // This would typically redirect to Spotify's authorization page
    // window.location.href = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=token&redirect_uri=${SPOTIFY_REDIRECT_URI}&scope=${SPOTIFY_SCOPES}`;
    console.warn("Spotify login initiation is a placeholder. Implement actual OAuth flow.");
}

// Function to handle Spotify callback from redirect URI
function handleSpotifyCallback() {
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

        // Load the Spotify Web Playback SDK script dynamically
        loadSpotifySDK();
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
    if (!spotifyAccessToken) {
        console.warn('Spotify access token not available. Please log in to Spotify.');
        // Optionally, hide Spotify-related controls or show a login prompt
        if (spotifyLoginBtn) spotifyLoginBtn.style.display = 'block';
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
        // Transfer playback to our player
        transferPlaybackToDevice(spotifyDeviceId);
    });

    spotifyPlayer.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id);
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
                if (playPauseBtn) playPauseBtn.textContent = '⏸';
            } else {
                if (playPauseBtn) playPauseBtn.textContent = '▶';
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
                if (currentAlbum && currentAlbum.tracks && currentTrackIndex < currentAlbum.tracks.length - 1) {
                    currentTrackIndex++;
                    playTrack(currentAlbum.tracks[currentTrackIndex], currentTrackIndex);
                } else {
                    stopAllPlayback(); // End of album
                }
            }
        }
    });

    spotifyPlayer.addListener('initialization_error', ({ message }) => {
        console.error('Failed to initialize Spotify player:', message);
    });
    spotifyPlayer.addListener('authentication_error', ({ message }) => {
        console.error('Authentication error with Spotify:', message);
        spotifyAccessToken = null;
        localStorage.removeItem('spotifyAccessToken');
        console.warn('Spotify authentication failed. Please log in again.'); // Using console.warn
    });
    spotifyPlayer.addListener('account_error', ({ message }) => {
        console.error('Account error with Spotify:', message);
        console.warn('Spotify account error. Please check your Spotify Premium status.'); // Using console.warn
    });
    spotifyPlayer.addListener('playback_error', ({ message }) => {
        console.error('Playback error with Spotify:', message);
        console.warn('Spotify playback error. Please try again or check your Spotify app.'); // Using console.warn
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
            console.warn('Could not transfer playback to web player. You might need to select it manually in Spotify.');
        } else {
            console.log('Playback transfer initiated successfully.');
        }
    } catch (error) {
        console.error('Error transferring playback:', error);
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


/*login-sign functionality */
const BACKEND_URL = 'https://240453584c92.ngrok-free.app'; // IMPORTANT: Match your backend's PORT

// --- Custom Message Box (instead of alert/confirm) ---
// Moved showMessageBox to the top so it's always defined before use
function showMessageBox(message, type = 'info') {
    const messageBox = document.getElementById('custom-message-box');
    const messageText = document.getElementById('custom-message-text');
    const messageCloseButton = document.getElementById('custom-message-close-button');

    if (!messageBox || !messageText || !messageCloseButton) { // Ensure all elements are found
        console.error('Custom message box elements not found! Falling back to console.log.');
        console.log(`Message (${type}): ${message}`); // Log to console as fallback
        return;
    }

    messageText.textContent = message;
    messageBox.classList.remove('info', 'error', 'success', 'bg-green-600', 'bg-red-600', 'bg-blue-600'); // Clear previous types and Tailwind colors

    // Add Tailwind classes based on type
    if (type === 'success') {
        messageBox.classList.add('bg-green-600');
    } else if (type === 'error') {
        messageBox.classList.add('bg-red-600');
    } else { // 'info' or default
        messageBox.classList.add('bg-blue-600');
    }

    messageBox.classList.add('active'); // Show the message box
    messageBox.classList.remove('invisible', 'opacity-0'); // Make visible

    // Close button listener (ensure it's only added once)
    // Using a flag to prevent multiple listeners
    if (!messageCloseButton.hasAttribute('data-listener-added')) {
        messageCloseButton.addEventListener('click', () => {
            messageBox.classList.remove('active');
            messageBox.classList.add('invisible', 'opacity-0'); // Hide
        });
        messageCloseButton.setAttribute('data-listener-added', 'true');
    }

    // Automatically hide after 5 seconds
    setTimeout(() => {
        messageBox.classList.remove('active');
        messageBox.classList.add('invisible', 'opacity-0'); // Hide
    }, 5000);
}


// --- Global variables for timers (declared at a higher scope) ---
let emailOtpTimerInterval;
let emailOtpResendAvailableTime = 0;
let phoneOtpTimerInterval;
let phoneOtpResendAvailableTime = 0;


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

    if (resendEmailOtpButton) resendEmailOtpButton.classList.add('hidden'); // Hide resend
    if (verifyEmailOtpButton) verifyEmailOtpButton.disabled = false; // Enable verify button

    clearInterval(emailOtpTimerInterval); // Clear any existing timer
    emailOtpTimerInterval = setInterval(() => {
        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds; // Fix for negative seconds

        if (emailOtpTimerDisplay) emailOtpTimerDisplay.textContent = `OTP valid for: ${minutes}:${seconds}`;

        if (--timer < 0) {
            clearInterval(emailOtpTimerInterval);
            if (emailOtpTimerDisplay) emailOtpTimerDisplay.textContent = "OTP expired. Please resend.";
            if (resendEmailOtpButton) resendEmailOtpButton.classList.remove('hidden'); // Show resend
            if (verifyEmailOtpButton) verifyEmailOtpButton.disabled = true; // Disable verify after expiry
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

    phoneOtpResendAvailableTime = duration; // Set initial time for resend logic
    const resendPhoneOtpButton = document.getElementById('resend-otp-button');
    const sendPhoneOtpButton = document.getElementById('send-otp-button');
    const phoneOtpTimerDisplay = document.getElementById('otp-timer-display');

    if (resendPhoneOtpButton) resendPhoneOtpButton.classList.add('hidden'); // Hide resend during active timer
    if (sendPhoneOtpButton) sendPhoneOtpButton.disabled = true; // Disable send OTP button during timer

    clearInterval(phoneOtpTimerInterval); // Clear any existing timer
    phoneOtpTimerInterval = setInterval(() => {
        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 0 ? "0" : "" + seconds; // Fix for negative seconds

        if (phoneOtpTimerDisplay) phoneOtpTimerDisplay.textContent = `OTP valid for: ${minutes}:${seconds}`;

        if (--timer < 0) {
            clearInterval(phoneOtpTimerInterval);
            if (phoneOtpTimerDisplay) phoneOtpTimerDisplay.textContent = "OTP expired. Please resend.";
            if (resendPhoneOtpButton) resendPhoneOtpButton.classList.remove('hidden'); // Show resend button
            if (sendPhoneOtpButton) sendPhoneOtpButton.disabled = false; // Re-enable send OTP button
        }
        phoneOtpResendAvailableTime = timer; // Update remaining time
    }, 1000);
};

/**
 * Updates the main UI of the page to reflect login status.
 * Moved to a higher scope so it's accessible by all functions.
 */
function updateLoginUI() {
    const userToken = localStorage.getItem('userToken');
    const loggedInUserEmail = localStorage.getItem('loggedInUserEmail');
    const loggedInUserName = localStorage.getItem('loggedInUserName'); // For future use if backend provides name

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

        if (userAvatar && loggedInUserEmail) {
            const initial = loggedInUserEmail.charAt(0).toUpperCase();
            userAvatar.textContent = initial;
            if (dropdownUsername) dropdownUsername.textContent = loggedInUserName || loggedInUserEmail; // Show full email or name
        }
    } else {
        // User is logged out
        if (topSignupBtn) topSignupBtn.classList.remove('hidden');
        if (topLoginBtn) topLoginBtn.classList.remove('hidden');
        if (userAvatarContainer) userAvatarContainer.classList.add('hidden');
        if (userDropdown) userDropdown.classList.remove('show'); // Ensure dropdown is hidden
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
        const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password, phoneNumber })
        });

        const data = await response.json();

        if (response.ok) { // HTTP status 2xx (e.g., 201 Created)
            if (data.requiresEmailVerification && email) {
                localStorage.setItem('pendingEmailVerification', email);
                showMessageBox(data.message, 'success');
                if (data.debugOtp) {
                    console.warn(`DEVELOPMENT EMAIL OTP: ${data.debugOtp}`);
                    showMessageBox(`DEVELOPMENT ONLY: Email OTP is ${data.debugOtp}. Check console.`, 'info');
                }
                showEmailOtpInputScreen(); // Transition to OTP screen
                startEmailOtpTimer(120);
            } else {
                showMessageBox(data.message || 'Registration successful!', 'success');
                // Store user email/name upon successful registration
                localStorage.setItem('loggedInUserEmail', email || phoneNumber);
                localStorage.setItem('loggedInUserName', data.name || email || phoneNumber); // Prefer name if available
                showLoginScreen(); // Show login screen after successful signup
            }
        } else { // HTTP status 4xx or 5xx
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
        const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ identifier, password })
        });

        const data = await response.json();

        if (response.ok) { // HTTP status 2xx
            showMessageBox(data.message || 'Logged in successfully!', 'success');
            localStorage.setItem('userToken', data.token); // Store the JWT token
            localStorage.setItem('loggedInUserEmail', data.email || identifier); // Store email/identifier
            localStorage.setItem('loggedInUserName', data.name || data.email || identifier); // Store name/email
            closePopup(); // Close the popup
            console.log('User logged in. Token stored:', data.token);
            updateLoginUI(); // Update UI after login
        } else if (response.status === 403 && data.requiresEmailVerification) { // Specific handling for unverified email login
            showMessageBox(data.message, 'info');
            localStorage.setItem('pendingEmailVerification', data.email);
            showEmailOtpInputScreen();
            if (data.debugOtp) {
                console.warn(`DEVELOPMENT EMAIL OTP: ${data.debugOtp}`);
                showMessageBox(`DEVELOPMENT ONLY: Email OTP is ${data.debugOtp}. Check console.`, 'info');
            }
            startEmailOtpTimer(120);
        } else if (!response.ok && data.message && data.message.includes('does not have a password')) {
            showMessageBox('This account was registered with Google and does not have a password. Please sign in with Google or set a password for your account.', 'info');
            // Do not clear inputs here, let user see the identifier
            // showLoginScreen(); // Keep on login screen
        } else { // For any other non-2xx response (400, 401, 500 etc.)
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
        const response = await fetch(`${BACKEND_URL}/api/admin/users/count`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}` // Send the JWT token
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
// IMPORTANT: Make this function globally accessible because Google SDK will call it
window.handleGoogleSignIn = async (response) => {
    const id_token = response.credential;
    console.log('Google ID Token received:', id_token);

    // No specific button to disable here as GIS handles its own UI,
    // but could add a global loading indicator if desired.
    showMessageBox('Attempting Google login...', 'info');

    try {
        const backendResponse = await fetch(`${BACKEND_URL}/api/auth/google`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token: id_token })
        });

        const data = await backendResponse.json();

        if (backendResponse.ok) {
            if (data.requiresEmailVerification && data.email) {
                localStorage.setItem('pendingEmailVerification', data.email);
                showMessageBox(data.message, 'info');
                if (data.debugOtp) {
                    console.warn(`DEVELOPMENT GOOGLE EMAIL OTP: ${data.debugOtp}`);
                    showMessageBox(`DEVELOPMENT ONLY: Google Email OTP is ${data.debugOtp}. Check console.`, 'info');
                }
                showEmailOtpInputScreen(); // Transition to the new email OTP screen
                startEmailOtpTimer(120);
            } else if (data.userExists && !data.requiresEmailVerification) {
                showMessageBox(data.message || 'Logged in successfully with Google!', 'success');
                localStorage.setItem('userToken', data.token); // Store the JWT token
                localStorage.setItem('loggedInUserEmail', data.email);
                localStorage.setItem('loggedInUserName', data.name || data.email);
                closePopup();
                console.log('User logged in via existing Google account. Token stored:', data.token);
                updateLoginUI();
            } else {
                console.error('Backend did not return expected data for Google auth.');
                showMessageBox('Google login failed: Unexpected backend response.', 'error');
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
        const response = await fetch(`${BACKEND_URL}/api/auth/verify-email-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, otpCode })
        });
        const data = await response.json();

        if (response.ok) {
            showMessageBox(data.message || 'Email verified successfully!', 'success');
            localStorage.setItem('userToken', data.token); // Store the JWT token
            localStorage.setItem('loggedInUserEmail', email); // Store the email
            localStorage.setItem('loggedInUserName', data.name || email); // Store name or email
            localStorage.removeItem('pendingEmailVerification'); // Clear the pending email
            clearInterval(emailOtpTimerInterval); // Stop the email OTP timer
            console.log('User logged in via Email OTP. Token stored:', data.token);
            updateLoginUI(); // Update UI after login

            if (data.setPasswordRequired) {
                localStorage.setItem('userEmailForPasswordSet', email);
                showCreatePasswordScreen(); // Show the new screen to set password
            } else {
                closePopup(); // Close the popup if no password needs to be set
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
 * @param {string} email - The user's email address.
 * @param {string} newPassword - The new password to set.
 * @param {HTMLElement} button - The button element to disable during the request.
 */
async function setPasswordForUser(email, newPassword, button) {
    button.disabled = true;
    const originalButtonText = button.textContent;
    button.textContent = 'Setting Password...';

    try {
        const response = await fetch(`${BACKEND_URL}/api/auth/set-password`, { // NEW BACKEND ENDPOINT
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('userToken')}` // Send the current token
            },
            body: JSON.stringify({ email, newPassword })
        });
        const data = await response.json();

        if (response.ok) {
            showMessageBox(data.message || 'Password set successfully!', 'success');
            localStorage.removeItem('userEmailForPasswordSet'); // Clear temporary storage
            closePopup(); // Close popup after successful password set
            updateLoginUI(); // Ensure UI updates after password set and login
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
        const response = await fetch(`${BACKEND_URL}/api/auth/send-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ phoneNumber })
        });
        const data = await response.json();

        if (response.ok) {
            showMessageBox(data.message, 'success');
            if (data.debugOtp) { // For development, show debug OTP
                console.warn(`DEVELOPMENT OTP: ${data.debugOtp}`);
                showMessageBox(`DEVELOPMENT ONLY: Phone OTP is ${data.debugOtp}. Check console.`, 'info');
            }
            showScreen('otp-verification-screen'); // Move to verification screen
            startPhoneOtpTimer(120); // Start 2-minute timer for OTP validity
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
        const response = await fetch(`${BACKEND_URL}/api/auth/verify-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ phoneNumber, otpCode })
        });
        const data = await response.json();

        if (response.ok) {
            showMessageBox(data.message || 'Phone verified successfully!', 'success');
            localStorage.setItem('userToken', data.token); // Store the JWT token
            localStorage.setItem('loggedInUserEmail', phoneNumber); // Store phone number as identifier
            localStorage.setItem('loggedInUserName', data.name || phoneNumber); // Store name or phone number
            closePopup(); // Close the popup
            console.log('User logged in via OTP. Token stored:', data.token);
            clearInterval(phoneOtpTimerInterval); // Stop the timer
            updateLoginUI(); // Update UI after login
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
        'create-password-screen': createPasswordScreen
    };

    // History stack to keep track of visited screens
    const screenHistory = []; // Stores screen IDs

    // --- Buttons and Inputs ---
    const closePopupButton = document.querySelector('#popup-container .close-button'); // Corrected selector for popup close button
    // REMOVED: const mainLogoutButton = document.getElementById('main-logout-button');
    const testUserCountBtn = document.getElementById('test-user-count-btn');

    // Initial Choice Screen elements
    const initialSignupBtn = document.getElementById('initial-signup-btn');
    const initialLoginLink = document.getElementById('initial-login-link');

    // Login Screen elements
    const loginBackBtn = document.getElementById('login-back-btn');
    const loginContinueButton = document.getElementById('login-continue-button');
    const loginEmailUsernameInput = document.getElementById('login-email-username');
    const loginPasswordInput = document.getElementById('login-password');
    const loginFacebookBtn = document.getElementById('login-facebook-btn'); // Placeholder for Facebook
    const loginPhoneOtpBtn = document.getElementById('login-phone-otp-btn');
    const loginPhonePasswordBtn = document.getElementById('login-phone-password-btn');
    const loginSignupLink = document.getElementById('login-signup-link');

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

    // Phone OTP Input Screen elements
    const phoneOtpBackBtn = document.getElementById('phone-otp-back-btn');
    const otpPhoneNumberInput = document.getElementById('otp-phone-number-input');
    const sendPhoneOtpButton = document.getElementById('send-otp-button');

    // OTP Verification Screen elements
    const otpVerificationBackBtn = document.getElementById('otp-verification-back-btn');
    const phoneOtpCodeInput = document.getElementById('otp-code-input');
    const verifyPhoneOtpButton = document.getElementById('verify-otp-button');
    const resendPhoneOtpButton = document.getElementById('resend-otp-button');
    // const phoneOtpTimerDisplay = document.getElementById('otp-timer-display'); // Referenced in startPhoneOtpTimer

    // Email OTP specific elements
    const emailOtpBackBtn = document.getElementById('email-otp-back-btn');
    const emailOtpDisplayEmail = document.getElementById('email-otp-display-email');
    const emailOtpCodeInput = document.getElementById('email-otp-code-input');
    const verifyEmailOtpButton = document.getElementById('verify-email-otp-button');
    const resendEmailOtpButton = document.getElementById('resend-email-otp-button');
    // const emailOtpTimerDisplay = document.getElementById('email-otp-timer-display'); // Referenced in startEmailOtpTimer

    // Set Password Screen elements
    const createPasswordBackBtn = document.getElementById('create-password-back-btn');
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const setNewPasswordButton = document.getElementById('set-new-password-button');


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
        return null; // No active screen found
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
            console.log('Screen pushed to history:', currentActiveScreenId, 'History:', screenHistory); // DEBUG
        } else if (!pushToHistory) {
            console.log('Not pushing to history. Current history:', screenHistory); // DEBUG
        }

        // Reset scroll position for the new screen
        screenToShow.scrollTop = 0;

        // Animate transition for current active screen
        if (currentActiveScreenId && currentActiveScreenId !== screenToShowId) {
            const currentActiveScreen = screens[currentActiveScreenId];
            if (currentActiveScreen) {
                currentActiveScreen.classList.remove('active');
                currentActiveScreen.classList.add('slide-out-left'); // Add slide-out effect
                currentActiveScreen.classList.add('opacity-0', 'pointer-events-none'); // Ensure properties for slide-out

                // Use a transitionend listener to set display: none after animation
                currentActiveScreen.addEventListener('transitionend', function handler() {
                    currentActiveScreen.classList.remove('slide-out-left');
                    currentActiveScreen.style.display = 'none'; // Fully hide after transition
                    currentActiveScreen.removeEventListener('transitionend', handler);
                }, { once: true });
            }
        }

        // Prepare the new screen to slide in (initially off-screen and visible)
        screenToShow.style.display = 'block'; // Or 'flex' if it's a flex container
        screenToShow.classList.remove('opacity-0', 'pointer-events-none', 'slide-out-left'); // Remove old states
        screenToShow.classList.add('active'); // Add active class to trigger transition

        // If coming from 'goBack' or initial load, ensure it slides in correctly
        if (!pushToHistory && currentActiveScreenId) { // If going back, or initial load, it comes from right
             screenToShow.classList.add('slide-in-right'); // Add slide-in-right class
             // Force reflow to ensure transform is applied before removing
             void screenToShow.offsetWidth;
             screenToShow.classList.remove('slide-in-right'); // Remove to trigger transition to 0
        } else {
             screenToShow.style.transform = 'translateX(0)'; // Ensure it's at 0 for non-back transitions
        }


        // Adjust popup container height to fit content of the active screen
        setTimeout(() => {
            if (popupContainer) {
                popupContainer.style.height = screenToShow.scrollHeight + 'px';
            }
        }, 50); // Small delay to allow content to render and calculate its height
    };

    /**
     * Navigates back to the previous screen in the history stack.
     */
    window.goBack = () => {
        console.log('goBack called. Current history:', screenHistory); // DEBUG
        if (screenHistory.length > 0) {
            const prevScreenId = screenHistory.pop();
            console.log('Popping from history:', prevScreenId, 'New history:', screenHistory); // DEBUG
            showScreen(prevScreenId, false); // Don't push to history when going back
        } else {
            console.log('History empty, closing popup.'); // DEBUG
            closePopup(); // If no history, close the popup
        }
    };

    // Functions to switch between specific screens - now using the centralized showScreen
    window.showInitialChoiceScreen = () => {
        screenHistory.length = 0; // Clear history when going to initial screen
        console.log('showInitialChoiceScreen: History cleared.'); // DEBUG
        showScreen('initial-choice-screen', false); // Show initial screen without pushing to history
    };

    window.showLoginScreen = () => {
        showScreen('login-screen');
    };

    window.showSignupScreen = () => {
        showScreen('signup-screen');
    };

    window.showPhoneSignup = () => {
        showScreen('phone-signup-screen');
        // Clear previous phone OTP timer if any
        if (phoneOtpTimerInterval) {
            clearInterval(phoneOtpTimerInterval);
        }
        phoneOtpResendAvailableTime = 0; // Reset
    };

    window.showPhoneLogin = () => {
        showScreen('phone-login-screen');
    };

    window.showPhoneOtpInput = () => {
        showScreen('phone-otp-input-screen');
        // Clear previous phone OTP timer if any
        if (phoneOtpTimerInterval) {
            clearInterval(phoneOtpTimerInterval);
        }
        phoneOtpResendAvailableTime = 0; // Reset
    };

    /**
     * Shows the email OTP input screen, displaying the pending email for verification.
     */
    window.showEmailOtpInputScreen = () => {
        const pendingEmail = localStorage.getItem('pendingEmailVerification');
        if (pendingEmail) {
            if (emailOtpDisplayEmail) emailOtpDisplayEmail.textContent = pendingEmail; // Display the email for clarity
            showScreen('email-otp-input-screen');
            // Clear previous email OTP timer if any
            if (emailOtpTimerInterval) {
                clearInterval(emailOtpTimerInterval);
            }
            emailOtpResendAvailableTime = 0; // Reset
        } else {
            showMessageBox('No email found for OTP verification. Please try Google login again.', 'error');
            showInitialChoiceScreen(); // Go back to initial screen
        }
    };

    /**
     * Shows the create password screen, clearing previous password inputs.
     */
    window.showCreatePasswordScreen = () => {
        // Clear password fields when showing the screen
        if (newPasswordInput) newPasswordInput.value = '';
        if (confirmPasswordInput) confirmPasswordInput.value = '';
        showScreen('create-password-screen');
    };


    /**
     * Opens the main authentication popup.
     */
    window.openPopup = () => {
        if (popupOverlay) popupOverlay.classList.add('active');
        popupOverlay.classList.remove('invisible', 'opacity-0'); // Make visible
        document.body.classList.add('no-scroll'); // Prevent body scrolling
        screenHistory.length = 0; // Clear history when opening fresh
        console.log('openPopup: History cleared.'); // DEBUG
        showScreen('initial-choice-screen', false); // Show initial screen without pushing to history
    };

    /**
     * Closes the main authentication popup.
     */
    window.closePopup = () => {
        if (popupOverlay) popupOverlay.classList.remove('active');
        popupOverlay.classList.add('invisible', 'opacity-0'); // Hide
        document.body.classList.remove('no-scroll'); // Allow body scrolling
        screenHistory.length = 0;
        console.log('closePopup: History cleared and popup closed.'); // DEBUG
        // When closing popup, ensure all screens are hidden
        for (const id in screens) {
            const screen = screens[id];
            if (screen) {
                screen.classList.remove('active');
                screen.classList.add('opacity-0', 'pointer-events-none');
                screen.classList.remove('slide-out-left', 'slide-in-right'); // Ensure this is clean
                screen.style.display = 'none'; // Ensure it's fully hidden
            }
        }
        // Also clear any pending OTP/password data
        localStorage.removeItem('pendingEmailVerification');
        localStorage.removeItem('userEmailForPasswordSet');
    };

    // --- Initial Load Logic ---
    // NO AUTOMATIC POPUP ON LOAD. User will click buttons.
    // Call updateLoginUI on initial load to set the correct state for the main page
    updateLoginUI();

    // Automatically show signup popup after a delay if not logged in
    setTimeout(() => {
        const userToken = localStorage.getItem('userToken');
        if (!userToken) { // Only show if user is not logged in
            openPopup();
        }
    }, 2000); // 2-second delay

    // --- Event Listeners ---
    if (closePopupButton) {
        closePopupButton.addEventListener('click', closePopup);
    }
    // REMOVED: mainLogoutButton listener
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
    if (userAvatarContainer) {
        userAvatarContainer.addEventListener('click', (e) => {
            // Prevent click from propagating to document body and closing immediately
            e.stopPropagation();
            if (userDropdown) {
                userDropdown.classList.toggle('show');
            }
        });

        // Hide dropdown when mouse leaves the avatar container
        userAvatarContainer.addEventListener('mouseleave', () => {
            if (userDropdown) {
                userDropdown.classList.remove('show');
            }
        });
    }

    if (dropdownLogoutBtn) {
        dropdownLogoutBtn.addEventListener('click', () => {
            localStorage.removeItem('userToken'); // Clear the token
            localStorage.removeItem('loggedInUserEmail'); // Clear stored email
            localStorage.removeItem('loggedInUserName'); // Clear stored name
            showMessageBox('You have been logged out.', 'info');
            updateLoginUI(); // Update UI to reflect logged out state
            closePopup(); // Close the popup
            // Optionally, open the initial choice screen after logout
            // openPopup(); // This will show the initial choice screen
        });
    }


    // Initial Choice Screen Listeners
    if (initialSignupBtn) {
        initialSignupBtn.addEventListener('click', showSignupScreen);
    }
    if (initialLoginLink) {
        initialLoginLink.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link behavior
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
            // Clear inputs after attempt
            if (loginEmailUsernameInput) loginEmailUsernameInput.value = '';
            if (loginPasswordInput) loginPasswordInput.value = '';
        });
    }
    if (loginFacebookBtn) {
        loginFacebookBtn.addEventListener('click', () => {
            showMessageBox('Facebook login is not implemented in this demo.', 'info');
            // handleAuthClick('Facebook', 'Login'); // Original placeholder
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
            if (!password || password.length < 6) { // Basic validation
                showMessageBox('Please enter a password with at least 6 characters.', 'error');
                return;
            }

            await registerUser(email, password, null, signupNextButton);
            // Clear inputs after successful registration attempt
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
            await sendPhoneOtp(phoneNumber, sendPhoneOtpButton);
        });
    }

    // OTP Verification Screen Listeners
    if (otpVerificationBackBtn) {
        otpVerificationBackBtn.addEventListener('click', goBack);
    }
    if (verifyPhoneOtpButton) {
        verifyPhoneOtpButton.addEventListener('click', async () => {
            const phoneNumber = otpPhoneNumberInput ? otpPhoneNumberInput.value.trim() : ''; // Get from previous screen's input
            const otpCode = phoneOtpCodeInput ? phoneOtpCodeInput.value.trim() : '';

            if (!phoneNumber || !otpCode) {
                showMessageBox('Please enter both phone number and OTP.', 'error');
                return;
            }
            await verifyPhoneOtp(phoneNumber, otpCode, verifyPhoneOtpButton);
            if (phoneOtpCodeInput) phoneOtpCodeInput.value = ''; // Clear OTP input
        });
    }
    if (resendPhoneOtpButton) {
        resendPhoneOtpButton.addEventListener('click', async () => {
            if (phoneOtpResendAvailableTime <= 0) { // Only allow resend if timer has run out
                const phoneNumber = otpPhoneNumberInput ? otpPhoneNumberInput.value.trim() : '';
                if (!phoneNumber) {
                    showMessageBox('No phone number found to resend OTP. Please go back and re-enter.', 'error');
                    return;
                }
                await sendPhoneOtp(phoneNumber, resendPhoneOtpButton); // Reuse sendPhoneOtp function
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
            if (emailOtpCodeInput) emailOtpCodeInput.value = ''; // Clear OTP input
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
                    // This assumes you have a backend endpoint specifically for resending email OTP
                    const response = await fetch(`${BACKEND_URL}/api/auth/resend-email-otp`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email })
                    });
                    const data = await response.json();
                    if (response.ok) {
                        showMessageBox(data.message, 'success');
                        if (data.debugOtp) { console.warn(`DEVELOPMENT GOOGLE EMAIL OTP (Resent): ${data.debugOtp}`); }
                        startEmailOtpTimer(120);
                        resendEmailOtpButton.classList.add('hidden'); // Hide resend button again
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

    // Set Password Screen Listeners
    if (createPasswordBackBtn) {
        createPasswordBackBtn.addEventListener('click', goBack);
    }
    if (setNewPasswordButton) {
        setNewPasswordButton.addEventListener('click', async () => {
            const email = localStorage.getItem('userEmailForPasswordSet'); // Get the email
            const newPassword = newPasswordInput ? newPasswordInput.value.trim() : '';
            const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value.trim() : '';

            if (!email) {
                showMessageBox('User email not found. Please try logging in again.', 'error');
                closePopup();
                return;
            }

            if (!newPassword || newPassword.length < 6) { // Example password length validation
                showMessageBox('Please enter a new password with at least 6 characters.', 'error');
                return;
            }

            if (newPassword !== confirmPassword) {
                showMessageBox('Passwords do not match. Please re-enter.', 'error');
                return;
            }

            await setPasswordForUser(email, newPassword, setNewPasswordButton);
            if (newPasswordInput) newPasswordInput.value = '';
            if (confirmPasswordInput) confirmPasswordInput.value = '';
        });
    }

    // --- Initial Setup on DOM Content Loaded (moved from above) ---
    // Handle Spotify callback on page load (checks URL for access token)
    handleSpotifyCallback();

    // Attempt to retrieve Spotify access token from localStorage
    const storedToken = localStorage.getItem('spotifyAccessToken');
    if (storedToken) {
        spotifyAccessToken = storedToken;
        // If a token is found, try to load the Spotify SDK
        loadSpotifySDK(); // Call loadSpotifySDK here
    }

    // Fetch albums from your backend API (only to populate allAlbumsData for search)
    await fetchAlbums();

    // Attach event listeners to the existing HTML cards after albums data is fetched
    attachEventListenersToHtmlCards();

    if (volumeBar) {
        audio.volume = volumeBar.value;
    }
    togglePlayerControls(true);

    // Event listeners for hamburger and close button (using the new toggleSidebar function)
    if (hamburger) {
        hamburger.addEventListener('click', toggleSidebar);
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', toggleSidebar);
    }

    // Event listener for clicking the overlay to close the sidebar
    if (overlay) {
        overlay.addEventListener('click', () => {
            // Only close sidebar if it's open
            if (sidebar && sidebar.classList.contains('open')) {
                toggleSidebar();
            }
        });
    }

    // Attach event listener for the main album overlay close button
    if (closeOverlayBtn) {
        closeOverlayBtn.addEventListener('click', closeAlbumOverlay);
    }

    // Initial state: player bar should always be visible
    if (playerBar) {
        playerBar.style.display = 'flex'; // Ensure player bar is visible on load
    }
});
