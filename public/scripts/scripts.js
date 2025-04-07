// Modal Script

document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("popup-modal");
    const popupContent = document.getElementById("popup-content");
    const closeModal = document.getElementById("close-modal");

    // Function to show modal
    function showModal(content) {
        popupContent.innerHTML = content;
        modal.classList.remove("hidden");
    }

    // Function to close modal and stop video
    function closeModalAndStopVideo() {
        popupContent.innerHTML = ""; // Clear the modal content to stop the video
        modal.classList.add("hidden");
    }

    // Handle image clicks
    document.querySelectorAll(".clickable-image").forEach(img => {
        img.addEventListener("click", () => {
            showModal(`<img src="${img.src}" alt="Expanded Image">`);
        });
    });

    // Handle video clicks
    document.querySelectorAll(".clickable-video").forEach(thumb => {
        thumb.addEventListener("click", () => {
            const videoId = thumb.getAttribute("data-video-id");
            showModal(`
          <iframe width="100%" height="100%"
            src="https://www.youtube.com/embed/${videoId}?autoplay=1"
            frameborder="0" allowfullscreen></iframe>
        `);
        });
    });

    // Close modal on click
    closeModal.addEventListener("click", () => {
        closeModalAndStopVideo();
    });

    // Close modal when clicking outside content
    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeModalAndStopVideo();
        }
    });

    // Close modal when pressing the Escape key
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeModalAndStopVideo();
        }
    });
});