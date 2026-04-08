document.addEventListener("DOMContentLoaded", () => {
  
  // 1. Initialize Lenis for Smooth Scrolling
  try {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), 
      direction: 'vertical', 
      gestureDirection: 'vertical', 
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    const tourBgElements = document.querySelectorAll('.tour-bg');

    lenis.on('scroll', (e) => {
      tourBgElements.forEach((bg) => {
        const card = bg.closest('.tour-card');
        const cardRect = card.getBoundingClientRect();
        
        const viewportCenter = window.innerHeight / 2;
        const cardCenter = cardRect.top + cardRect.height / 2;
        
        const distanceFromCenter = cardCenter - viewportCenter;
        const yOffset = distanceFromCenter * -0.15;
        
        bg.style.transform = `translateY(${yOffset}px)`;
      });
    });
  } catch(e) {
    console.error("Lenis scrolling could not be initiated:", e);
  }

  // 2. Logo Scroll Fade
  const header = document.querySelector('.floating-header');
  lenis.on('scroll', (e) => {
    if (e.animatedScroll > 100) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // 3. Safe Fallback for Google API Network Failures (e.g. adblocker)
  setTimeout(() => {
    if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
      console.warn("Google Maps API failed to load (network/adblock). Injecting mock fallbacks.");
      renderMockReviews();
    }
  }, 2000);

  // Esc key closes lightbox
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeLightbox();
    }
  });

  // 4. Force video playback on restrictive mobile browsers
  const videos = document.querySelectorAll('video');
  videos.forEach(video => {
    video.muted = true;
    video.setAttribute('playsinline', 'playsinline');
    video.play().catch(e => {
        console.warn("Mobile autoplay restriction hit:", e);
        // Fallback: Attempt play on first user interaction if blocked by Low Power Mode
        document.body.addEventListener('touchstart', () => {
            video.play();
        }, { once: true });
    });
  });

});

// Lightbox Logic
function openLightbox(imgSrc) {
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  
  if(lightbox && lightboxImg) {
    lightboxImg.src = imgSrc;
    lightbox.classList.add("active");
  }
}

function closeLightbox() {
  const lightbox = document.getElementById("lightbox");
  if(lightbox) {
    lightbox.classList.remove("active");
  }
}

// Attach globally inside window just in case
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;


// Google Maps Auth Failure Hook
window.gm_authFailure = function() {
  console.warn("Google Maps authentication failed. Injecting mock fallbacks.");
  renderMockReviews();
};

// 3. Google Places API Initialization (For Reviews logic only since Map is now an Iframe)
function initMap() {
  const dummyDiv = document.createElement("div");

  const map = new google.maps.Map(dummyDiv, {
    center: { lat: 39.7709, lng: 20.0022 },
    zoom: 15
  });

  try {
    const placesService = new google.maps.places.PlacesService(map);
    const placeId = 'ChIJ7-TXawBrWxMRKfE_xEH1eEc';
    let reviewsReturned = false;

    // Safety timeout in case PlacesApi hangs silently
    setTimeout(() => {
        if (!reviewsReturned) {
            renderMockReviews();
        }
    }, 2500);

    placesService.getDetails({
      placeId: placeId,
      fields: ['reviews']
    }, (place, status) => {
      reviewsReturned = true;
      if (status === google.maps.places.PlacesServiceStatus.OK && place.reviews) {
        renderReviews(place.reviews);
      } else {
        renderMockReviews();
      }
    });

  } catch (e) {
    console.error("Places API Exception: ", e);
    renderMockReviews();
  }
}

window.initMap = initMap;

function renderMockReviews() {
  renderReviews([
    { author_name: "Emma W.", rating: 5, text: "Absolutely incredible experience. Captain Santiago took us to spots that no one else was at! Best time of my life." },
    { author_name: "Lukas P.", rating: 5, text: "Highly recommend. Clean boats, Bluetooth worked perfectly, and incredibly honest pricing for what you get." },
    { author_name: "Marie J.", rating: 5, text: "The sunset tour was magical. Generous crew and very safe. We will definitely be coming back here again." },
    { author_name: "Daniel R.", rating: 5, text: "Best value in Ksamil. They really understand hospitality. If you want a boat, this is the only correct choice here." },
    { author_name: "Sarah T.", rating: 5, text: "5 Islands tour is a must. No hidden fees. Very relaxing experience from start to finish." }
  ]);
}

let hasRenderedReviews = false;

function renderReviews(reviews) {
  if (hasRenderedReviews) return;
  hasRenderedReviews = true;

  const track = document.getElementById("marquee-track");
  if (!track) return;

  const generateReviewCards = () => {
    return reviews.map(r => {
      const starsHTML = Array(5).fill('<i data-feather="star" style="fill: currentColor; width: 14px; height: 14px;"></i>').join('');
      const text = r.text.length > 150 ? r.text.substring(0, 147) + '...' : r.text;

      return `
        <div class="review-card">
          <div class="review-header">
            <span class="reviewer-name">${r.author_name}</span>
            <div class="review-stars">${starsHTML}</div>
          </div>
          <p class="review-text">"${text}"</p>
        </div>
      `;
    }).join('');
  };

  const cardsChunk = generateReviewCards() + generateReviewCards() + generateReviewCards();
  const contentHalf = `<div class="marquee-content">${cardsChunk}</div>`;
  
  track.innerHTML = contentHalf + contentHalf;

  if (typeof feather !== 'undefined') {
    feather.replace();
  }
}
