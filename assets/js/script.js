document.addEventListener("DOMContentLoaded", function () {
  window.addEventListener('scroll', function () {
    const headerContainer = document.getElementById('headerContainer');
    if (headerContainer) {
      if (window.scrollY > 40) {
        headerContainer.classList.remove('h-18', 'md:h-24', 'px-6', 'md:px-10');
        headerContainer.classList.add('h-14', 'md:h-20', 'px-5', 'md:px-8', 'shadow-lg');
      } else {
        headerContainer.classList.add('h-18', 'md:h-24', 'px-6', 'md:px-10');
        headerContainer.classList.remove('h-14', 'md:h-20', 'px-5', 'md:px-8', 'shadow-lg');
      }
    }
  });

  // 1. Drawer Logic
  const drawerOverlay = document.getElementById('drawerOverlay');
  const drawer = document.getElementById('drawer');
  const openDrawerBtn = document.getElementById('openDrawer');
  const closeDrawerBtn = document.getElementById('closeDrawer');
  const drawerBackdrop = document.getElementById('drawerBackdrop');

  function openDrawer() {
    drawerOverlay.classList.remove('invisible', 'opacity-0');
    drawerOverlay.classList.add('opacity-100');
    drawer.classList.remove('translate-x-full');
    document.body.style.overflow = 'hidden';
    openDrawerBtn.setAttribute('aria-expanded', 'true');
  }

  function closeDrawer() {
    drawer.classList.add('translate-x-full');
    drawerOverlay.classList.remove('opacity-100');
    drawerOverlay.classList.add('opacity-0');
    document.body.style.overflow = '';
    openDrawerBtn.setAttribute('aria-expanded', 'false');
    setTimeout(function () {
      drawerOverlay.classList.add('invisible');
    }, 500);
  }

  if (openDrawerBtn) openDrawerBtn.addEventListener('click', openDrawer);
  if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', closeDrawer);
  if (drawerBackdrop) drawerBackdrop.addEventListener('click', closeDrawer);

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      closeDrawer();
    }
  });

  if (drawer) {
    drawer.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeDrawer);
    });
  }

  // 2. Residence Tabs Logic
  const tabs = document.querySelectorAll(".residence-tab");
  const panels = document.querySelectorAll(".residence-panel");

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      const target = this.dataset.target;

      tabs.forEach(function (item) {
        item.classList.remove("active", "bg-theme1");
        const title = item.querySelector(".tab-title");
        const line = item.querySelector(".tab-line");
        if (title) title.classList.add("text-[#777068]");
        if (line) line.classList.add("hidden");
      });

      this.classList.add("active", "bg-theme1");
      const title = this.querySelector(".tab-title");
      const line = this.querySelector(".tab-line");
      if (title) title.classList.remove("text-[#777068]");
      if (line) line.classList.remove("hidden");

      panels.forEach(function (panel) {
        panel.classList.add("lg:hidden");
        panel.classList.remove("lg:active");
      });

      const activePanel = document.querySelector('.residence-panel[data-content="' + target + '"]');
      if (activePanel) {
        activePanel.classList.remove("lg:hidden");
        activePanel.classList.add("lg:active");
      }
    });
  });

  // 3. Leaflet Map Logic
  const mapElement = document.getElementById('harisonsMap');
  if (mapElement) {
    const projectLocation = {
      lat: 30.88985487802186,
      lng: 77.06465817577957
    };

    const map = L.map('harisonsMap', {
      scrollWheelZoom: false
    }).setView([projectLocation.lat, projectLocation.lng], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const projectIcon = L.divIcon({
      className: '',
      html: '<div class="harisons-project-marker"></div>',
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });

    L.marker([projectLocation.lat, projectLocation.lng], { icon: projectIcon })
      .addTo(map)
      .bindPopup('<strong>Harisons Homes</strong><br>Project Location')
      .openPopup();

    const buttons = document.querySelectorAll('.loc-btn');
    const toast = document.getElementById('distToast');
    const toastName = document.getElementById('toastName');
    const toastKm = document.getElementById('toastKm');
    const toastTime = document.getElementById('toastTime');
    const toastClose = document.getElementById('toastClose');

    let activeMarker = null;
    let activeRoute = null;

    function createLocationMarker(lat, lng, name) {
      const locationIcon = L.divIcon({
        className: '',
        html: '<div class="harisons-marker"></div>',
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });

      return L.marker([lat, lng], { icon: locationIcon })
        .addTo(map)
        .bindPopup('<strong>' + name + '</strong>')
        .openPopup();
    }

    async function drawRoadRoute(lat, lng) {
      if (activeRoute) {
        map.removeLayer(activeRoute);
        activeRoute = null;
      }

      const url = 'https://router.project-osrm.org/route/v1/driving/' + lng + ',' + lat + ';' + projectLocation.lng + ',' + projectLocation.lat + '?overview=full&geometries=geojson';

      try {
        const response = await fetch(url);
        const data = await response.json();

        if (!data.routes || !data.routes.length) return;

        const route = data.routes[0];
        activeRoute = L.geoJSON(route.geometry, {
          style: {
            color: '#6f3ae0',
            weight: 5,
            opacity: 0.9,
            lineCap: 'round',
            lineJoin: 'round'
          }
        }).addTo(map);

        map.fitBounds(activeRoute.getBounds(), {
          paddingTopLeft: [40, 40],
          paddingBottomRight: [40, 40],
          maxZoom: 12,
          animate: true
        });

        const actualKm = (route.distance / 1000).toFixed(1);
        const actualMinutes = Math.round(route.duration / 60);

        toastKm.textContent = actualKm + ' km';
        toastTime.textContent = formatDuration(actualMinutes);
      } catch (error) {
        console.error('Route loading error:', error);
      }
    }

    function formatDuration(minutes) {
      if (minutes < 60) return minutes + ' min';
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      if (mins === 0) return hours + ' hr';
      return hours + ' hr ' + mins + ' min';
    }

    async function showLocation(button) {
      const name = button.dataset.name;
      const lat = parseFloat(button.dataset.lat);
      const lng = parseFloat(button.dataset.lng);

      if (activeMarker) map.removeLayer(activeMarker);
      activeMarker = createLocationMarker(lat, lng, name);

      buttons.forEach(function (btn) { btn.classList.remove('active'); });
      button.classList.add('active');

      toastName.textContent = name;
      toastKm.textContent = 'Calculating...';
      toastTime.textContent = 'Calculating...';
      toast.classList.remove('hidden');

      await drawRoadRoute(lat, lng);
    }

    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        showLocation(button);
      });
    });

    if (toastClose) {
      toastClose.addEventListener('click', function () {
        toast.classList.add('hidden');
        buttons.forEach(function (btn) { btn.classList.remove('active'); });
        if (activeRoute) { map.removeLayer(activeRoute); activeRoute = null; }
        if (activeMarker) { map.removeLayer(activeMarker); activeMarker = null; }
        map.setView([projectLocation.lat, projectLocation.lng], 10);
      });
    }

    if (buttons.length) {
      showLocation(buttons[0]);
    }

    setTimeout(function () {
      map.invalidateSize();
    }, 500);
  }

  // 4. Swiper Gallery Slider Logic
  const sliderData = [
    { image: "https://risingnexusinfra.com/assets/images/projects/slider-block-2.png", title: "Block 2" },
    { image: "assets/images/gallery/img01.webp", title: "Fitness Studios" },
    { image: "assets/images/gallery/img02.webp", title: "Wellness Spas" },
    { image: "assets/images/gallery/img03.webp", title: "Club House" },
    { image: "https://risingnexusinfra.com/assets/images/projects/slider-balcony-view-1-snow.png", title: "Balcony View 1 Snow" },
    { image: "https://risingnexusinfra.com/assets/images/projects/slider-block-3-interior-2-snow.png", title: "Block 3 Interior 2 Snow" },
    { image: "https://risingnexusinfra.com/assets/images/projects/slider-entry-gate.png", title: "Entry Gate" },
    { image: "https://risingnexusinfra.com/assets/images/projects/slider-gazebo.png", title: "Gazebo" },
    { image: "https://risingnexusinfra.com/assets/images/projects/slider-internal-rd-snow.png", title: "Internal Road Snow" },
    { image: "https://risingnexusinfra.com/assets/images/projects/slider-micro-wind.png", title: "Micro Wind" },
    { image: "https://risingnexusinfra.com/assets/images/projects/slider-sunken-bonfire-pit.png", title: "Sunken Bonfire Pit" }
  ];

  const wrapper = document.getElementById("sliderWrapper");
  if (wrapper) {
    sliderData.forEach((item) => {
      const slide = document.createElement("div");
      slide.className = "swiper-slide";
      slide.innerHTML = `
        <div class="overflow-hidden bg-white">
            <img src="${item.image}" alt="${item.title}" class="block h-[280px] w-full object-cover" loading="lazy">
            <div class="px-4 py-5 text-center">
                <h3 class="text-[1.2rem] text-gray-900">${item.title}</h3>
            </div>
        </div>
      `;
      wrapper.appendChild(slide);
    });

    new Swiper(".mySwiper", {
      slidesPerView: 1,
      spaceBetween: 20,
      loop: true,
      speed: 700,
      autoplay: { delay: 3000, disableOnInteraction: false },
      pagination: { el: ".swiper-pagination", clickable: true },
      breakpoints: {
        0: { slidesPerView: 1, spaceBetween: 15 },
        640: { slidesPerView: 2, spaceBetween: 20 },
        1024: { slidesPerView: 3, spaceBetween: 24 }
      }
    });
  }

  // 5. Attractions Hover Logic
  const attractionImages = [
    "assets/images/attrections/01.webp",
    "assets/images/attrections/02.webp",
    "assets/images/attrections/03.webp",
    "assets/images/attrections/04.webp",
    "assets/images/attrections/05.webp",
    "assets/images/attrections/06.webp",
    "assets/images/attrections/07.webp"
  ];

  const mainImage = document.getElementById("attraction-image");
  const cards = document.querySelectorAll(".attraction-card");

  if (mainImage && cards.length) {
    cards.forEach((card) => {
      card.addEventListener("mouseenter", () => {
        const index = card.getAttribute("data-index");
        if (attractionImages[index]) {
          mainImage.style.opacity = "0.4";
          setTimeout(() => {
            mainImage.src = attractionImages[index];
            mainImage.style.opacity = "1";
          }, 150);
        }
      });
    });
  }
});



const enquiryForm = document.getElementById('enquiryForm');
if (enquiryForm) {
  enquiryForm.addEventListener('submit', function (e) {
    e.preventDefault(); // Page reload ya redirect hone se rokega

    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = 'Sending...';
    submitBtn.disabled = true;

    const formData = new FormData(enquiryForm);

    fetch("https://formsubmit.co/ajax/admin@barogvalley.com", {
      method: "POST",
      body: formData
    })
      .then(response => response.json())
      .then(data => {
        alert("Thank you! Your enquiry has been sent successfully. We will connect with you soon.");
        enquiryForm.reset();
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      })
      .catch(error => {
        console.error('Error:', error);
        alert("Something went wrong. Please try again later.");
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      });
  });
}