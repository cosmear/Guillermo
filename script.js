tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#2b8cee",
        "primary-dark": "#1a6bbd",
        "background-light": "#f6f7f8",
        "background-dark": "#101922",
        navy: "#0f172a",
        charcoal: "#333333",
        gold: "#C5A059",
      },
      fontFamily: {
        display: ["Manrope", "sans-serif"],
        serif: ["Playfair Display", "serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
    },
  },
};

document.addEventListener("DOMContentLoaded", function () {
  // --- Language Switching Logic ---
  const langToggleBtn = document.getElementById("lang-toggle"); // Use ID for reliability
  let currentLang = localStorage.getItem("site-lang") || "es";

  function updateLanguage(lang) {
      if (!window.translations) {
          console.error("Translations not loaded");
          return;
      }
      
      const t = window.translations[lang];
      if (!t) return;

      // Update text content for elements with data-i18n attribute
      document.querySelectorAll("[data-i18n]").forEach(element => {
          const key = element.getAttribute("data-i18n");
          if (t[key]) {
              // Check if it's an input placeholder or text content
              if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
                  element.placeholder = t[key];
              } else {
                  element.textContent = t[key];
              }
          }
      });

      // Update Toggle Button Visuals
      if (langToggleBtn) {
          langToggleBtn.innerHTML = lang === "es" 
              ? 'ES <span class="text-gray-300">|</span> <span class="text-gray-400 font-normal">EN</span>'
              : '<span class="text-gray-400 font-normal">ES</span> <span class="text-gray-300">|</span> EN';
      }

      currentLang = lang;
      localStorage.setItem("site-lang", lang);
  }

  // Initialize Language
  if (langToggleBtn) {
      langToggleBtn.addEventListener("click", (e) => {
          e.preventDefault(); // Prevent default if it's a link (though it's a button)
          const newLang = currentLang === "es" ? "en" : "es";
          updateLanguage(newLang);
      });
  } else {
      console.error("Language toggle button not found with ID 'lang-toggle'");
  }
  
  // Initial load
  updateLanguage(currentLang);

  // --- Modal Logic ---
  const modal = document.getElementById("appointmentModal");
  const modalBackdrop = document.getElementById("modalBackdrop");
  const modalPanel = document.getElementById("modalPanel");
  const openBtns = document.querySelectorAll("#btn-agenda-header, #btn-agenda-hero, .open-modal-btn");
  const closeBtn = document.getElementById("closeModalBtn");

  function openModal() {
    if (!modal) return;
    modal.classList.remove("hidden");
    modal.classList.add("flex"); // Ensure flex is added for centering
    // Small delay to allow display:block/flex to apply before adding opacity for transition
    setTimeout(() => {
        modalBackdrop.classList.remove("opacity-0");
        modalPanel.classList.remove("opacity-0", "scale-95", "translate-y-4");
        modalPanel.classList.add("opacity-100", "scale-100", "translate-y-0");
    }, 10);
  }

  function closeModal() {
    if (!modal) return;
    modalBackdrop.classList.add("opacity-0");
    modalPanel.classList.remove("opacity-100", "scale-100", "translate-y-0");
    modalPanel.classList.add("opacity-0", "scale-95", "translate-y-4");
    
    // Wait for transition to finish
    setTimeout(() => {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
    }, 300);
  }
  window.closeModal = closeModal; // Expose globally for enviarFormulario

  openBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
        e.preventDefault();
        openModal();
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener("click", closeModal);
  }

  // Close on backdrop click
  if (modal) {
      modal.addEventListener("click", (e) => {
        // Check if the click effectively hit the backdrop/overlay wrapper
        // The structure is modal -> backdrop (absolute) + panel (relative)
        // Clicking 'modal' wrapper often means clicking outside the panel if panel doesn't fill it
        if (e.target === modal || e.target === modalBackdrop) {
            closeModal();
        }
      });
  }
  
  // Close on Escape key
  document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
          closeModal();
      }
  });

  // Connect contact form
  const form = document.getElementById("contactForm");
  if (form) {
      form.addEventListener("submit", enviarFormulario);
  }
});
// Reemplaza toda tu función enviarFormulario con esta
async function enviarFormulario(evento) {
  evento.preventDefault();

  // VERIFICA QUE ESTA SEA LA URL DE LA VERSIÓN 11 (O LA MÁS NUEVA)
  const urlScript = "https://script.google.com/macros/s/AKfycbyE6Oo8mGqafTxSSfg19ynKE1DbymGgb_mW3mhdLkzjIgbH7qQ030b2HPUnpQEsO9TM/exec"; 

  const submitBtn = document.querySelector("#contactForm button[type='submit']");
  const originalText = submitBtn ? submitBtn.textContent : "Enviar";

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Procesando...";
  }

  const datos = {
    nombre: document.getElementById("nombre").value,
    email: document.getElementById("email").value,
    telefono: document.getElementById("telefono").value,
    mensaje: document.getElementById("mensaje").value
  };

  try {
    const response = await fetch(urlScript, {
      method: "POST",
      redirect: "follow", // Importante para seguir la redirección de Google
      headers: {
        "Content-Type": "text/plain;charset=utf-8", // "text/plain" evita errores de CORS (OPTIONS)
      },
      body: JSON.stringify(datos)
    });

    // --- AQUÍ ESTÁ EL CAMBIO PARA DEPURAR ---
    // 1. Obtenemos el texto crudo antes de intentar convertirlo a JSON
    const textoRespuesta = await response.text();
    
    // 2. Intentamos convertir a JSON
    let result;
    try {
        result = JSON.parse(textoRespuesta);
    } catch (jsonError) {
        // SI ENTRA ACÁ, GOOGLE DEVOLVIÓ HTML (ERROR) EN VEZ DE JSON
        console.error("No es JSON:", textoRespuesta);
        alert("ERROR CRÍTICO: Google devolvió algo que no es JSON.\n\nMira esto:\n" + textoRespuesta.substring(0, 150) + "...");
        throw new Error("Respuesta no válida del servidor");
    }

    // 3. Verificamos el status lógico del script
    if (result.status === "success") {
      alert("¡Consulta enviada con éxito!");
      document.getElementById("contactForm").reset();
      
      if (typeof closeModal === "function") {
        closeModal();
      } else {
         const modal = document.getElementById("appointmentModal");
         if(modal) {
             modal.classList.add("hidden");
             modal.classList.remove("flex");
         }
      }
    } else {
      // Si el script de Google capturó un error interno y nos lo mandó
      alert("Error del servidor: " + result.message);
      throw new Error(result.message);
    }

  } catch (error) {
    console.error("Error final:", error);
    // Este alert ya no es genérico, te dirá qué pasó si falló el fetch
    if (!error.message.includes("Respuesta no válida")) {
        alert("Error de conexión: " + error.message);
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }
}