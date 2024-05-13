// Toggling menu
menu_icons.addEventListener("click", () => {
    nav.classList.toggle("active");
  });
  
  // Get all the navigation links
  const navLinks = document.querySelectorAll('.navbar ul li a');
  
  // Add event listener to each link
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('active');
    });
  });
  
  // Add event listener to hide menu when clicking outside of it
  document.body.addEventListener('click', (event) => {
    // Check if the clicked element is not inside the navigation menu
    if (!event.target.closest('.navbar')) {
      nav.classList.remove('active');
    }
  });  
  

// Get all video elements
const videos = document.querySelectorAll('video');

// Function to stop all videos
function stopVideos() {
    videos.forEach(video => {
        video.pause(); // Pause the video
        video.currentTime = 0; // Reset the video to the beginning
    });
}

// Game tab Functions
Array.from(document.querySelectorAll('.games')).forEach((game_container, TabID) => {
    const registers = game_container.querySelector('.game-registers');
    const bodies = game_container.querySelector('.game-bodies');

    // Move the neutral state to the top
    bodies.prepend(bodies.querySelector('.neutral-body'));

    Array.from(registers.children).forEach((el, i) => {
        el.setAttribute('aria-controls', `${TabID}_${i}`)
        bodies.children[i + 1]?.setAttribute('id', `${TabID}_${i}`)
  
        el.addEventListener('click', (ev) => {
            let activeRegister = registers.querySelector('.active-game');
            if (activeRegister === el) {
                // If the same button is clicked, toggle back to the neutral state
                activeRegister.classList.remove('active-game');
                changeBody(registers, bodies, activeRegister);
                stopVideos(); // Stop videos when going to the neutral state
            } else {
                if (activeRegister) {
                    activeRegister.classList.remove('active-game');
                    stopVideos(); // Stop videos when changing tabs
                }
                activeRegister = el;
                activeRegister.classList.add('active-game');
                changeBody(registers, bodies, activeRegister);
            }
        })
    })

    // Default to show neutral state
    changeBody(registers, bodies, null); // Change this line

    function changeBody(registers, bodies, activeRegister) {
        Array.from(bodies.children).forEach((el, i) => {
            if (i === 0) {
                el.style.display = activeRegister && activeRegister.classList.contains('active-game') ? 'none' : 'flex';
            } else {
                el.style.display = el.id === (activeRegister ? activeRegister.getAttribute('aria-controls') : null) ? 'flex' : 'none'; // Change this line
            }
        });

        // Disable scrolling to previous game bodies when in the neutral state
        bodies.style.overflowY = activeRegister && activeRegister.classList.contains('active-game') ? 'auto' : 'hidden';

        Array.from(registers.children).forEach((el, i) => {
            el.setAttribute('aria-expanded', el == activeRegister ? 'true' : 'false')
        });
    }
});




// Find all carousels and iterate through them
document.querySelectorAll(".carousel").forEach(carousel => {
    const slides = carousel.querySelector("[data-slides]");
    const slideCounter = carousel.querySelector(".slide-counter");
    const totalSlides = slides.children.length;
  
    // Initialize the slide counter
    updateSlideCounter(0);
  
    // Add event listeners to carousel buttons
    carousel.querySelectorAll("[data-carousel-button]").forEach(button => {
      button.addEventListener("click", () => {
        const offset = button.dataset.carouselButton === "next" ? 1 : -1;
        const activeSlide = slides.querySelector("[data-active]");
  
        let newIndex = [...slides.children].indexOf(activeSlide) + offset;
        newIndex = (newIndex + totalSlides) % totalSlides; // Ensure newIndex is within bounds
  
        activeSlide.removeAttribute("data-active");
        slides.children[newIndex].setAttribute("data-active", "");
  
        // Update slide counter
        updateSlideCounter(newIndex);
      });
    });
  
    // Function to update slide counter
    function updateSlideCounter(currentIndex) {
      const currentSlideNumber = currentIndex + 1;
      slideCounter.innerHTML = `<span style="font-size: 1.5vh; color: #F59E2A; font-weight: bold">${currentSlideNumber}</span> / ${totalSlides}`;
    }
  });
  
  
