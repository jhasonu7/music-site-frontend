function handleRouteChange() {
    const path = window.location.pathname;
    const albumOverlay = document.getElementById('albumOverlay');
    const playlistOverlay = document.getElementById('playlist-details-overlay');
    
    console.log("Handling route change for path:", path);

    // --- THIS IS THE FIX ---
    if (path.startsWith('/album/')) {
        const albumId = path.split('/')[2];
        const albumData = allAlbumsData.find(a => a.id === albumId);
        if (albumData) {
            if (!albumOverlay.classList.contains('show') || (currentAlbum && currentAlbum.id !== albumId)) {
                openAlbumDetails(albumData);
            }
        }
    } else if (path.startsWith('/playlist/')) {
        // 1. Added this block to specifically handle playlist URLs.
        const playlistId = path.split('/')[2];
        const playlistData = window.currentUserPlaylists.find(p => p._id === playlistId);
        if (playlistData) {
             // Only open the overlay if it's not already showing the correct playlist.
             if (!playlistOverlay.classList.contains('active') || (currentPlaylist && currentPlaylist._id !== playlistId)) {
                openPlaylistDetailsOverlay(playlistData);
            }
        }
    } else {
        // 2. Updated this block to close both album and playlist overlays when navigating away.
        if (albumOverlay && albumOverlay.classList.contains('show')) {
            closeAlbumOverlay();
        }
        if (playlistOverlay && playlistOverlay.classList.contains('active')) {
            closePlaylistDetailsOverlay();
        }
    }
    // --- END OF FIX ---
}


function showFullScreenPlayer() {
      pushHistoryStateForPopup();
    if (!fullScreenPlayer) return;

    fullScreenPlayer.classList.add('active');
    document.body.style.overflow = 'hidden';
    console.log("Full-screen player shown.");

    // --- Dynamic Background Logic ---
    const albumArt = document.getElementById('full-screen-album-art');
    const setBackgroundColor = () => {
        try {
            const colorThief = new ColorThief();
            const dominantColor = colorThief.getColor(albumArt);
            const rgbColor = `rgb(${dominantColor[0]}, ${dominantColor[1]}, ${dominantColor[2]})`;
            
            // Set a CSS variable for the gradient
            fullScreenPlayer.style.setProperty('--dominant-color', rgbColor);
        } catch (e) {
            console.error("ColorThief error:", e);
            // Fallback to a default color if there's an error
            fullScreenPlayer.style.setProperty('--dominant-color', '#4a4a4a');
        }
    };

    // If the image is already loaded (e.g., from cache), set the color immediately.
    if (albumArt.complete) {
        setBackgroundColor();
    } else {
        // Otherwise, wait for it to load.
        albumArt.onload = setBackgroundColor;
    }

    // Update the rest of the player UI
    updatePlayerUI();
}




// =======================================================
// NEW: MOBILE BACK BUTTON & HISTORY MANAGEMENT
// =======================================================

/**
 * A helper function to check if a popup is currently visible to the user.
 * @param {string} elementId - The ID of the popup element to check.
 * @returns {boolean} - True if the popup is visible, false otherwise.
 */
function isPopupVisible(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return false;
    
    // Check for common 'hidden' classes used in the project
    if (element.classList.contains('hidden') || element.classList.contains('unique-hidden') || element.classList.contains('invisible')) {
        return false;
    }
    
    // Check for 'active', 'open', or 'show' classes that indicate visibility
    if (element.classList.contains('active') || element.classList.contains('open') || element.classList.contains('show')) {
        return true;
    }
    
    // Check computed style for display property
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') {
        return false;
    }

    return false; // Default to not visible if no explicit show state is found
}

/**
 * Pushes a new state to the browser's history.
 * This should be called every time a popup or overlay is opened.
 */
function pushHistoryStateForPopup() {
    history.pushState({ swarifyPopup: true }, "");
    console.log("Pushed history state for a new popup.");
}

/**
 * Updates body scrolling based on whether any popups are open.
 * This prevents the page from scrolling when an overlay is active.
 */
function updateBodyForPopups() {
    // A slight delay to allow the DOM to update after a close function runs
    setTimeout(() => {
        const popupsToCheck = [
             'full-screen-player',
             'albumOverlay'
        ];

        const isAnyPopupVisible = popupsToCheck.some(id => isPopupVisible(id));

        if (isAnyPopupVisible) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }, 50); // 50ms delay
}



function showPlaylistDetailsOverlay() {
    const overlay = document.getElementById('playlist-details-overlay');
    if (!overlay) return;

   
    overlay.classList.remove('hidden', 'is-covered');
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(() => {
        overlay.classList.add('is-active');
        setTimeout(() => {
            overlay.classList.add('active');
        }, 10);
    });

    const mainBackBtn = document.getElementById('playlist-main-back-btn');
    const compactBackBtn = document.getElementById('playlist-compact-back-btn');
    
    // Change the onclick handlers to call history.back()
    if (mainBackBtn) mainBackBtn.onclick = () => history.back();
    if (compactBackBtn) compactBackBtn.onclick = () => history.back();
}

function hidePlaylistDetailsOverlay() {
    const overlay = document.getElementById('playlist-details-overlay');
    if (!overlay) return;

    overlay.classList.remove('active');
    setTimeout(() => {
        overlay.classList.add('hidden');
    }, 300); // Match CSS transition duration
    updateBodyForPopups();
}

// ADD these new functions anywhere in oc.js

function showSongActionsPopup() {
    const popup = document.getElementById('add-popup-overlay');
    if (popup) {
        popup.style.display = 'block';
        // A small delay ensures the transition is smooth
        setTimeout(() => popup.classList.add('active'), 10);
    }
}

function hideSongActionsPopup() {
    const popup = document.getElementById('add-popup-overlay');
    if (popup) {
        popup.classList.remove('active');
        // Hide the element completely after the transition ends
        setTimeout(() => {
            if (!popup.classList.contains('active')) {
                popup.style.display = 'none';
            }
        }, 300); // This duration should match your CSS transition time
    }
}
// --- Album Details Overlay ---

function showAlbumOverlay() {
    const albumOverlay = document.getElementById('album-overlay');
    if (!albumOverlay) return;

    albumOverlay.classList.remove('hidden');
    setTimeout(() => {
        albumOverlay.classList.add('show', 'active');
        document.body.style.overflow = 'hidden';
    }, 10);
    updateFixedTopHeadingVisibility();
}

function hideAlbumOverlay(instant = false) {
    const albumOverlay = document.getElementById('album-overlay');
    if (!albumOverlay) return;
    
    const compactHeader = document.getElementById('embedded-compact-header');
    if (compactHeader) {
        compactHeader.remove();
    }

    albumOverlay.classList.remove('active', 'show');
    const albumFullEmbedContainer = document.getElementById('album-full-embed-container');
    if (albumFullEmbedContainer) {
        albumFullEmbedContainer.style.display = 'none';
    }

    if (instant) {
        albumOverlay.style.transition = 'none';
        requestAnimationFrame(() => { albumOverlay.style.transition = ''; });
    }

    updateBodyForPopups();
    updateFixedTopHeadingVisibility();
}


// --- Full Screen Player ---

function showFullScreenPlayer() {
    const fullScreenPlayer = document.getElementById('full-screen-player');
    if (!fullScreenPlayer) return;

    fullScreenPlayer.classList.add('active');
    document.body.style.overflow = 'hidden';
    console.log("Full-screen player shown.");
}

function hideFullScreenPlayer() {
   
    const fullScreenPlayer = document.getElementById('full-screen-player');
    if (!fullScreenPlayer) return;

    fullScreenPlayer.classList.remove('active');
    if (typeof updateBodyForPopups === 'function') {
        updateBodyForPopups();
    }
    console.log("Full-screen player hidden.");
}


// --- Song Options Popup ---

function showSongOptionsPopup() {
    const popupBackdrop = document.getElementById('song-options-popup');
    if (!popupBackdrop) return;

  
    popupBackdrop.style.display = 'flex';
    setTimeout(() => popupBackdrop.classList.add('active'), 10);
}

function hideSongOptionsPopup() {
    const popupBackdrop = document.getElementById('song-options-popup');
    if (!popupBackdrop) return;

    popupBackdrop.classList.remove('active');
    setTimeout(() => {
        popupBackdrop.style.display = 'none';
    }, 300); // Wait for the transition to finish
}

// ADD these two new functions anywhere in oc.js

function showNewPlaylistPopup() {
    const popup = document.getElementById('new-playlist-popup-overlay');
    const input = document.getElementById('new-playlist-name-input');
    if (popup) {
        popup.classList.remove('hidden');
        // Automatically focus the input field for a better user experience
        if (input) setTimeout(() => input.focus(), 50);
    }
}

function hideNewPlaylistPopup() {
    const popup = document.getElementById('new-playlist-popup-overlay');
    const input = document.getElementById('new-playlist-name-input');
    if (popup) {
        popup.classList.add('hidden');
        // Clear the input field when the popup is hidden
        if (input) input.value = '';
    }
}
// --- "Add to Playlist" Overlay ---

function showAddToPlaylistOverlay() {
    const addToPlaylistOverlay = document.getElementById('add-to-playlist-overlay');
    if (!addToPlaylistOverlay) return;

    addToPlaylistOverlay.classList.remove('hidden');
    addToPlaylistOverlay.classList.add('visible');
    document.body.style.overflow = 'hidden';
}

function hideAddToPlaylistOverlay() {
    const addToPlaylistOverlay = document.getElementById('add-to-playlist-overlay');
    if (!addToPlaylistOverlay) return;

    addToPlaylistOverlay.classList.remove('visible');
    document.body.style.overflow = 'auto';
    setTimeout(() => {
        // Clear data after hiding
        const playlistSelectionContainer = document.getElementById('playlist-selection-container');
        const doneAddingToPlaylistBtn = document.getElementById('done-adding-to-playlist-btn');
        addToPlaylistOverlay.dataset.song = '';
        if (playlistSelectionContainer) playlistSelectionContainer.innerHTML = '';
        if (doneAddingToPlaylistBtn) doneAddingToPlaylistBtn.disabled = true;
    }, 300);
}


// --- Generic Record Breaking Popups ---

function showRecordBreakingPopup(popupOverlay) {
    if (!popupOverlay) return;
   
    popupOverlay.classList.remove('hidden');
    popupOverlay.classList.add('flex');
    document.body.classList.add('popup-active'); // A generic class might be better here
}
function closeRecordBreakingPopup(popupOverlay) {
    if (!popupOverlay) return;
    popupOverlay.classList.add('hidden');
    popupOverlay.classList.remove('flex');
    document.body.classList.remove('popup-active');
}
/**
 * @file This file acts as the main coordinator.
 * It connects user actions to the content manager and popup controls.
 * The original functions are now wrappers that call the separated logic.
 */

// --- Playlist Details ---
async function openPlaylistDetailsOverlay(playlist) {
    populatePlaylistDetails(playlist);
    showPlaylistDetailsOverlay();
}

function closePlaylistDetailsOverlay() {
    hidePlaylistDetailsOverlay();
}

// --- Album Details (CORRECTED) ---
async function openAlbumDetails(albumData) {
    // This function now contains all the necessary logic to show the album overlay.

    // 1. Update browser history
    const currentPath = window.location.pathname;
    const newPath = `/album/${albumData.id}`;
    if (currentPath !== newPath) {
        history.pushState({ albumId: albumData.id }, albumData.title, newPath);
    }
    
    // 2. Populate the UI with album data (from script.js)
    await populateAlbumOverlayUI(albumData); 
    setupAlbumSearchListeners();

    // 3. Show the overlay element
    const albumOverlay = document.getElementById('albumOverlay'); // Corrected ID from 'album-overlay'
    if (!albumOverlay) return;

    albumOverlay.classList.remove('hidden');
    setTimeout(() => {
        albumOverlay.classList.add('show', 'active');
        document.body.style.overflow = 'hidden';
    }, 10);
    
    updateFixedTopHeadingVisibility();
}

async function closeAlbumOverlay(instant = false) {
    // This function now contains all the necessary logic to hide the album overlay.
    currentAlbum = null; // Clear the global album state

    const albumOverlay = document.getElementById('albumOverlay'); // Corrected ID
    if (!albumOverlay) return;
    
    const compactHeader = document.getElementById('embedded-compact-header');
    if (compactHeader) {
        compactHeader.remove();
    }

    albumOverlay.classList.remove('active', 'show');
    const albumFullEmbedContainer = document.getElementById('album-full-embed-container');
    if (albumFullEmbedContainer) {
        albumFullEmbedContainer.style.display = 'none';
    }

    if (instant) {
        albumOverlay.style.transition = 'none';
        requestAnimationFrame(() => { albumOverlay.style.transition = ''; });
    }

    if (typeof updateBodyForPopups === 'function') {
        updateBodyForPopups();
    }
    if (typeof updateFixedTopHeadingVisibility === 'function') {
        updateFixedTopHeadingVisibility();
    }
}


// --- Player ---
function openFullScreenPlayer() {
    updatePlayerUI(); // This is the content part
    showFullScreenPlayer(); // This is the UI control part
}

// hideFullScreenPlayer is already in popup_controls.js as it's purely a UI function.



function closeSongOptionsPopup() {
    hideSongOptionsPopup();
}

// --- Add to Playlist ---
window.openAddToPlaylistOverlay = async (song) => {
    await populateAddToPlaylistOverlay(song);
    showAddToPlaylistOverlay();
};

window.closeAddToPlaylistOverlay = () => {
    hideAddToPlaylistOverlay();
};




//--------------------------------------------------------------------------------------------------------------

function pushHistoryState(popupName) {
    if (history.state?.swarifyPopup !== popupName) {
        history.pushState({ swarifyPopup: popupName }, "");
        console.log(`History Pushed: state for modal popup ${popupName}`);
    }
}

function isPopupVisible(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return false;
    
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
        return false;
    }
    
    const isHiddenClass = element.classList.contains('hidden') ||
                          element.classList.contains('unique-hidden') ||
                          element.classList.contains('invisible');

    if (isHiddenClass) {
        return false;
    }
    
    return element.classList.contains('active') ||
           element.classList.contains('open') ||
           element.classList.contains('show') ||
           element.classList.contains('visible');
}


// in oc.js

/**
 * Handles the `popstate` event (browser back button).
 * This is the MASTER function for closing all overlays sequentially and syncing the UI.
 * This corrected version simplifies the logic by delegating to the existing router functions,
 * ensuring the entire UI syncs with the URL after a back button press.
 */
function handleBackButton() {
    console.log("Back button pressed, delegating to main routers to sync UI with URL.");

    // This function handles views based on the URL path (e.g., /album/xyz vs /).
    // It will correctly close the album overlay when you navigate away from an album path.
    if (typeof window.handleRouteChange === 'function') {
        window.handleRouteChange();
    }

    // This function handles views based on the URL hash (e.g., #home vs #record-breaking-1).
    // It will close the record-breaking popup when the hash changes to #home and update the footer.
    if (typeof window.router === 'function') {
        window.router();
    }
}

// The event listener remains the same
window.addEventListener('popstate', handleBackButton);


// =================================================================
// SECTION 2: NAVIGATION & VIEW MANAGEMENT
// =================================================================

function hideMainFooterViews() {
    document.getElementById('unique-search-popup')?.classList.add('unique-hidden');
    document.getElementById('mobile-search-overlay')?.classList.add('hidden');
    document.getElementById('library-popup')?.classList.add('hidden');
}

function router() {
    const route = window.location.hash.substring(1) || 'home';
    console.log(`Routing to: ${route}`);
    hideMainFooterViews();

    // Get references to popups
      const albumSearchView = document.getElementById('album-search-view');
    const popupOverlay1 = document.getElementById('record-breaking-popup-overlay');
    const popupOverlay2 = document.getElementById('record-breaking-popup-overlay2');
     const fullScreenPlayer = document.getElementById('full-screen-player');
     const playlistSearchView = document.getElementById('playlist-search-view');

    // Close popups by default if they are not the target route
         // Handle the album search view

      if (route !== 'new-playlist') {
        hideNewPlaylistPopup();
    }

      if (route !== 'song-actions') {
        hideSongActionsPopup();
       }    
    if (route === 'album-search') {
        if (albumOverlay && albumSearchView) {
            albumOverlay.classList.add('search-active');
            if (typeof populateAlbumSearchResults === 'function') {
                populateAlbumSearchResults();
            }
            const searchInput = document.getElementById('album-search-input');
            if (searchInput) setTimeout(() => searchInput.focus(), 300);
        }
    }
    else {
        // This else block hides the search view when the route is not 'album-search'
        if (albumOverlay) {
            albumOverlay.classList.remove('search-active');
        }
    }
     if (route !== 'liked-songs') {
        const likedSongsOverlay = document.getElementById('likedSongsOverlay');
        if (likedSongsOverlay && likedSongsOverlay.classList.contains('open')) {
            // We use the existing close function to hide the overlay.
            window.closeLikedSongsOverlay();
        }
    }
    
    if (popupOverlay1 && route !== 'record-breaking-1') {
        closeRecordBreakingPopup(popupOverlay1);
    }
    if (popupOverlay2 && route !== 'record-breaking-2') {
        closeRecordBreakingPopup(popupOverlay2);
    }
    if (fullScreenPlayer && route !== 'player') {
        hideFullScreenPlayer();
    }
   
  if (route === 'playlist-search') {
        if (playlistSearchView) {
            playlistSearchView.classList.remove('hidden');
            playlistSearchView.classList.add('flex');
            const searchInput = document.getElementById('playlist-search-input');
            if (searchInput) setTimeout(() => searchInput.focus(), 50); // Auto-focus the input
        }
    } else {
        // If the route is anything else, ensure the search view is hidden
        if (playlistSearchView) {
            playlistSearchView.classList.remove('flex');
            playlistSearchView.classList.add('hidden');
        }
    }

      if (route !== 'song-options') {
        const songOptionsPopup = document.getElementById('song-options-popup');
        if (songOptionsPopup && songOptionsPopup.classList.contains('active')) {
            hideSongOptionsPopup(); // This function just handles the CSS animations
        }
    }


    let viewToShow;

    switch (route) {
         case 'new-playlist':
            showNewPlaylistPopup();
            break;
        case 'song-actions':
            showSongActionsPopup();
            break;
        case 'album-search':
        
            break;
         case 'song-options':
         
            break;

        case 'search':
            const isMobile = window.innerWidth <= 1024;
            viewToShow = isMobile 
                ? document.getElementById('mobile-search-overlay') 
                : document.getElementById('unique-search-popup');
            
            if (viewToShow) {
                if (isMobile) {
                    viewToShow.classList.remove('hidden');
                    viewToShow.style.display = 'flex';
                } else {
                    viewToShow.classList.remove('unique-hidden');
                    viewToShow.style.display = 'block';
                }
                viewToShow.classList.add('active', 'open');
            }
            break;
        case 'library':
            viewToShow = document.getElementById('library-popup');
            if(viewToShow) {
                viewToShow.classList.remove('hidden');
                viewToShow.classList.add('active', 'open');
            }
            break;
            
        // --- NEW CASES TO HANDLE THE POPUPS ---
        case 'record-breaking-1':
            if (popupOverlay1) {
                const popupGrid1 = document.getElementById('record-breaking-popup-grid');
                populateRecordBreakingGrid(popupGrid1, '#record-breaking-albums-container .mini-album-card');
                showRecordBreakingPopup(popupOverlay1);
            }
            break;
        case 'record-breaking-2':
             if (popupOverlay2) {
                const popupGrid2 = document.getElementById('record-breaking-popup-grid2');
                populateRecordBreakingGrid(popupGrid2, '#record-breaking-albums-container2 .mini-album-card2');
                showRecordBreakingPopup(popupOverlay2);
            }
            break;
                    case 'player':
            if(fullScreenPlayer && playingAlbum) {
                openFullScreenPlayer();
            }
            break;
            case 'liked-songs':
            // The router is now responsible for showing the overlay and fetching its content.
            if (typeof window.openLikedSongsOverlay === 'function') {
                window.openLikedSongsOverlay();
            }
            if (typeof window.fetchAndRenderLikedSongs === 'function') {
                window.fetchAndRenderLikedSongs();
            }
            break;


        case 'home':
        default:
            // Home is the default state where all popups are closed.
            break;
    }
    updateFooterActiveState(route);
}

function updateFooterActiveState(activeTarget) {
    document.querySelectorAll('.unique-footer-nav .unique-nav-link').forEach(link => {
        link.classList.remove('unique-active');
        const target = link.dataset.target || link.getAttribute('href')?.substring(1);
        if (target === activeTarget) {
            link.classList.add('unique-active');
        }
    });
}

function navigateTo(target) {
    if (target === 'home') {
        // Define the destination for the "home" view.
        const newPath = "/";
        const newHash = "#home";

        // Only create a new history entry if we are not already on the home page.
        // This prevents creating duplicate entries if the user clicks "Home" multiple times.
        if (window.location.pathname !== newPath || window.location.hash !== newHash) {
             // Create a new history entry that points to the root path with a #home hash.
             // This keeps the album page in the browser's "back" history.
             history.pushState({ swarifyView: 'home' }, "", newPath + newHash);

             // Manually call the route handler to update the UI.
             // This will close the album overlay because the pathname is now "/".
             if (typeof window.handleRouteChange === 'function') {
                 window.handleRouteChange();
             }

             // Call the router to update the active state of the footer icon.
             router();
        }
    } else {
        // For other links like 'search' or 'library', the existing hash-based behavior is correct.
        if (window.location.hash.substring(1) !== target) {
            window.location.hash = target;
        }
    }
}
// =================================================================
// SECTION 3: UNIFIED POPUP OPEN/CLOSE FUNCTIONS
// =================================================================

// in oc.js

// --- LIKED SONGS ---
window.openLikedSongsOverlay = function() {
    // pushHistoryState('liked-songs'); // <<< REMOVE THIS LINE
    const likedOverlay = document.getElementById('likedSongsOverlay');
    if (likedOverlay) {
        likedOverlay.classList.add('open', 'active');
        likedOverlay.setAttribute('aria-hidden', 'false');
    }
};
window.closeLikedSongsOverlay = function() {
    const likedOverlay = document.getElementById('likedSongsOverlay');
    if (likedOverlay) {
        likedOverlay.classList.remove('open', 'active');
        likedOverlay.setAttribute('aria-hidden', 'true');
    }
};

// --- RECORD BREAKING POPUPS ---
window.openRecordBreakingPopup = () => {
    pushHistoryState('record-breaking');
    const popup = document.getElementById('record-breaking-popup-overlay');
    if (popup) popup.classList.add('flex', 'active');
};
// ✅ RENAMED to avoid conflict with the router's local function
window.unifiedCloseRecordBreakingPopup1 = () => { 
    const popup = document.getElementById('record-breaking-popup-overlay');
    if (popup) popup.classList.remove('flex', 'active');
};
window.openRecordBreakingPopup2 = () => {
    pushHistoryState('popular-artists');
    const popup = document.getElementById('record-breaking-popup-overlay2');
    if (popup) popup.classList.add('flex', 'active');
};
window.closeRecordBreakingPopup2 = () => {
    const popup = document.getElementById('record-breaking-popup-overlay2');
    if (popup) popup.classList.remove('flex', 'active');
};

// --- FOOTER VIEWS (SEARCH/LIBRARY) ---
window.closeAllSearchUi = function() {
    const searchPopup = document.getElementById('unique-search-popup');
    if(searchPopup) {
        searchPopup.classList.add('unique-hidden');
        searchPopup.classList.remove('active', 'open');
    }
    const mobileSearch = document.getElementById('mobile-search-overlay');
    if(mobileSearch) {
        mobileSearch.classList.add('hidden');
        mobileSearch.classList.remove('active', 'open');
    }
};
window.closeLibraryPopup = function() {
    const libraryPopup = document.getElementById('library-popup');
    if(libraryPopup) {
        libraryPopup.classList.add('hidden');
        libraryPopup.classList.remove('active', 'open');
    }
};

// =================================================================
// SECTION 4: EVENT LISTENERS & INITIALIZATION
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
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
})
