const typingTarget = document.getElementById("typingText");
const runtimeConfig = window.RUNTIME_CONFIG || {};
const PORTFOLIO_CONFIG = {
  links: {
    github: runtimeConfig.GITHUB_URL || "https://github.com/Nikkyzzzz",
    linkedin: runtimeConfig.LINKEDIN_URL || "https://www.linkedin.com/in/nikita-patra-13a67a220/"
  },
  projectRepos: {
    audit: runtimeConfig.PROJECT_AUDIT_URL || "",
    pan: runtimeConfig.PROJECT_PAN_URL || "",
    lung: runtimeConfig.PROJECT_LUNG_URL || ""
  },
  contact: {
    formspreeEndpoint: runtimeConfig.FORMSPREE_ENDPOINT || ""
  },
  ai: {
    endpoint:
      runtimeConfig.CHAT_API_URL ||
      "https://nikita-portfolio-chat-proxy.patranikita236.workers.dev/api/chat"
  }
};

const typingPhrases = [
  "AI Engineer",
  "GenAI Enthusiast"
];

let phraseIndex = 0;
let charIndex = 0;
let deleting = false;

function runTypingEffect() {
  if (!typingTarget) return;

  const current = typingPhrases[phraseIndex];
  typingTarget.textContent = current.slice(0, charIndex);

  if (!deleting && charIndex < current.length) {
    charIndex += 1;
    setTimeout(runTypingEffect, 90);
    return;
  }

  if (!deleting && charIndex === current.length) {
    deleting = true;
    setTimeout(runTypingEffect, 1200);
    return;
  }

  if (deleting && charIndex > 0) {
    charIndex -= 1;
    setTimeout(runTypingEffect, 45);
    return;
  }

  deleting = false;
  phraseIndex = (phraseIndex + 1) % typingPhrases.length;
  setTimeout(runTypingEffect, 220);
}

function initRevealAnimations() {
  const revealItems = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  revealItems.forEach((item) => observer.observe(item));
}

function initScrollProgress() {
  const progress = document.getElementById("scrollProgress");
  if (!progress) return;

  const updateProgress = () => {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const value = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    progress.style.width = `${value}%`;
  };

  window.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();
}

function initCursorGlow() {
  const glow = document.getElementById("cursorGlow");
  if (!glow) return;

  window.addEventListener("mousemove", (event) => {
    glow.style.left = `${event.clientX}px`;
    glow.style.top = `${event.clientY}px`;
  });
}

function initThemeToggle() {
  const toggleBtn = document.getElementById("themeToggle");
  if (!toggleBtn) return;

  const root = document.documentElement;
  const icon = toggleBtn.querySelector("i");

  const setFallbackGlyph = (theme) => {
    toggleBtn.setAttribute("data-glyph", theme === "light" ? "sun" : "moon");
  };

  const applyTheme = (theme) => {
    if (theme === "light") {
      root.setAttribute("data-theme", "light");
      if (icon) icon.className = "fa-solid fa-sun";
      setFallbackGlyph("light");
    } else {
      root.removeAttribute("data-theme");
      if (icon) icon.className = "fa-solid fa-moon";
      setFallbackGlyph("dark");
    }
  };

  const savedTheme = localStorage.getItem("site-theme");
  applyTheme(savedTheme === "light" ? "light" : "dark");

  toggleBtn.addEventListener("click", () => {
    const nextTheme = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    applyTheme(nextTheme);
    localStorage.setItem("site-theme", nextTheme);
  });
}

function initProjectModal() {
  const modal = document.getElementById("projectModal");
  const closeBtn = document.getElementById("modalClose");
  const title = document.getElementById("modalTitle");
  const description = document.getElementById("modalDescription");
  const stack = document.getElementById("modalStack");

  if (!modal || !closeBtn || !title || !description || !stack) return;

  const projectDetails = {
    audit: {
      title: "Audit Automation Platform",
      description:
        "Designed an AI-driven audit ecosystem integrating anomaly detection, smart summaries, and workflow automation to improve operational reliability.",
      stack: "Python • FastAPI • LangChain • SQL"
    },
    pan: {
      title: "PAN Card Reader",
      description:
        "Built an OCR + LLM pipeline that extracts fields from PAN cards, performs confidence scoring, and validates formatting for downstream automation.",
      stack: "Python • OCR • LLM • FastAPI"
    },
    lung: {
      title: "Lung Cancer Detection",
      description:
        "Developed a Vision Transformer + CCT based classifier for radiology images, reaching 94% accuracy while maintaining robust generalization.",
      stack: "PyTorch • ViT • CCT • Computer Vision"
    }
  };

  const openers = document.querySelectorAll(".open-modal");
  openers.forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest(".project-card");
      if (!card) return;
      const key = card.dataset.project;
      const data = projectDetails[key];
      if (!data) return;

      title.textContent = data.title;
      description.textContent = data.description;
      stack.textContent = data.stack;
      modal.classList.add("show");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    });
  });

  const closeModal = () => {
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  closeBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("show")) closeModal();
  });
}

function initCanvasBackground() {
  const canvas = document.getElementById("bgCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const particles = [];
  const count = 70;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createParticles() {
    particles.length = 0;
    for (let i = 0; i < count; i += 1) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        r: Math.random() * 1.9 + 0.8
      });
    }
  }

  function drawFrame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < particles.length; i += 1) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(110, 184, 255, 0.75)";
      ctx.fill();

      for (let j = i + 1; j < particles.length; j += 1) {
        const p2 = particles[j];
        const dx = p.x - p2.x;
        const dy = p.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 130) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(101, 165, 255, ${0.18 - dist / 900})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(drawFrame);
  }

  resizeCanvas();
  createParticles();
  drawFrame();

  window.addEventListener("resize", () => {
    resizeCanvas();
    createParticles();
  });
}

function initFooterYear() {
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
}

function setExternalLink(anchor, url) {
  if (!anchor) return;

  const isValid = typeof url === "string" && /^https?:\/\//i.test(url);
  if (isValid) {
    anchor.href = url;
    anchor.classList.remove("is-disabled-link");
    anchor.removeAttribute("aria-disabled");
    anchor.removeAttribute("title");
    return;
  }

  anchor.href = "#";
  anchor.classList.add("is-disabled-link");
  anchor.setAttribute("aria-disabled", "true");
  anchor.title = "Set this URL in script.js";
}

function initExternalLinks() {
  setExternalLink(document.getElementById("githubLink"), PORTFOLIO_CONFIG.links.github);
  setExternalLink(document.getElementById("linkedinLink"), PORTFOLIO_CONFIG.links.linkedin);

  const projectLinks = document.querySelectorAll("[data-project-link]");
  projectLinks.forEach((anchor) => {
    const key = anchor.getAttribute("data-project-link");
    const url = key ? PORTFOLIO_CONFIG.projectRepos[key] : "";
    setExternalLink(anchor, url || "");
  });
}

function initContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;
  const status = document.getElementById("contactStatus");
  const endpoint = PORTFOLIO_CONFIG.contact.formspreeEndpoint;

  const setStatus = (text, type = "") => {
    if (!status) return;
    status.textContent = text;
    status.classList.remove("success", "error");
    if (type) status.classList.add(type);
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const button = form.querySelector("button[type='submit']");
    if (!endpoint) {
      setStatus("Set a Formspree endpoint in script.js to enable real email delivery.", "error");
      return;
    }

    if (button) {
      button.textContent = "Sending...";
      button.disabled = true;
    }

    try {
      const formData = new FormData(form);
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json"
        }
      });

      if (!response.ok) {
        throw new Error("Form submission failed");
      }

      form.reset();
      setStatus("Message sent successfully. I will get back to you soon.", "success");
    } catch (error) {
      setStatus("Unable to send message right now. Please try again.", "error");
    } finally {
      if (button) {
        button.textContent = "Send Message";
        button.disabled = false;
      }
    }
  });
}

function getLocalAssistantReply(prompt) {
  const normalized = prompt.toLowerCase();

  if (normalized.includes("project")) {
    return "Top projects include Audit Automation Platform, PAN Card Reader, and Lung Cancer Detection (94% accuracy).";
  }
  if (normalized.includes("skill") || normalized.includes("tech")) {
    return "Core stack: Python, SQL, JavaScript, PyTorch, Scikit-learn, LangChain, FastAPI, Docker, Git, and Streamlit.";
  }
  if (normalized.includes("experience") || normalized.includes("intern")) {
    return "At Capitall, Nikita built 25+ AI bots, processed 500K+ records, and reduced audit time by 60%.";
  }
  if (normalized.includes("contact") || normalized.includes("email")) {
    return "You can reach out at patranikita@gmail.com.";
  }

  return "I can answer about projects, skills, experience, certifications, and how to contact Nikita.";
}

async function initAssistantWidget() {
  const form = document.getElementById("assistantForm");
  const input = document.getElementById("assistantInput");
  const messages = document.getElementById("assistantMessages");
  const clearButton = document.getElementById("clearAiChatBtn");
  if (!form || !input || !messages || !clearButton) return;

  const history = [];
  const chatApiUrl = (PORTFOLIO_CONFIG.ai.endpoint || "").trim();

  const addMessage = (role, text) => {
    const item = document.createElement("div");
    item.className = `assistant-msg ${role}`;
    item.textContent = text;
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
  };

  addMessage("bot", "Hello, I am your resume assistant. I only answer from Nikita's resume details.");

  if (!chatApiUrl) {
    addMessage("bot", "Live API unavailable. Using local assistant mode.");
  } else {
    addMessage("bot", "Live AI mode enabled.");
  }

  clearButton.addEventListener("click", () => {
    messages.innerHTML = "";
    history.length = 0;
    addMessage("bot", "Chat cleared. Ask me anything about this portfolio.");
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const prompt = input.value.trim();
    if (!prompt) return;

    addMessage("user", prompt);
    input.value = "";

    if (!chatApiUrl) {
      addMessage("bot", getLocalAssistantReply(prompt));
      return;
    }

    history.push({ role: "user", content: prompt });
    try {
      const response = await fetch(chatApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: prompt,
          history: history.slice(-10)
        })
      });

      if (!response.ok) {
        let reason = `HTTP ${response.status}`;
        try {
          const errData = await response.json();
          reason = errData?.error || errData?.details || reason;
        } catch (parseError) {
          // Keep default reason.
        }
        throw new Error(reason);
      }

      const data = await response.json();
      const content = data?.reply?.trim() || data?.message?.trim() || data?.text?.trim();
      const reply = content || "I could not generate a response. Please try again.";

      history.push({ role: "assistant", content: reply });
      addMessage("bot", reply);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      addMessage("bot", `${getLocalAssistantReply(prompt)} (Live API unavailable: ${reason})`);
    }
  });
}

function initHeroEntranceSequence() {
  const sequenceItems = [
    document.getElementById("heroName"),
    document.getElementById("heroPhotoShell"),
    document.getElementById("heroMetrics")
  ].filter(Boolean);

  sequenceItems.forEach((item, index) => {
    setTimeout(() => {
      item.classList.add("in");
    }, 180 + index * 220);
  });
}

function initPortraitTilt() {
  const shell = document.getElementById("heroPhotoShell");
  if (!shell) return;

  const isTouchDevice = window.matchMedia("(hover: none)").matches;
  if (isTouchDevice) return;

  shell.addEventListener("mousemove", (event) => {
    const rect = shell.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = -((y - centerY) / centerY) * 7;
    const rotateY = ((x - centerX) / centerX) * 9;

    shell.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-2px)`;
  });

  shell.addEventListener("mouseleave", () => {
    shell.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)";
  });
}

function initAssistantFloatingButton() {
  const fab = document.getElementById("assistantFab");
  const popup = document.getElementById("assistantPopup");
  const backdrop = document.getElementById("assistantBackdrop");
  const closeBtn = document.getElementById("assistantPopupClose");
  const assistantInput = document.getElementById("assistantInput");
  if (!fab || !popup || !backdrop) return;

  const openAssistant = () => {
    popup.classList.add("open");
    backdrop.classList.add("open");
    popup.setAttribute("aria-hidden", "false");
    backdrop.setAttribute("aria-hidden", "false");
    fab.setAttribute("aria-label", "Close AI assistant chat");
    document.body.style.overflow = "hidden";
    setTimeout(() => {
      assistantInput?.focus();
    }, 120);
  };

  const closeAssistant = () => {
    popup.classList.remove("open");
    backdrop.classList.remove("open");
    popup.setAttribute("aria-hidden", "true");
    backdrop.setAttribute("aria-hidden", "true");
    fab.setAttribute("aria-label", "Open AI assistant chat");
    document.body.style.overflow = "";
  };

  const toggleAssistant = () => {
    if (popup.classList.contains("open")) {
      closeAssistant();
      return;
    }
    openAssistant();
  };

  fab.addEventListener("click", toggleAssistant);
  closeBtn?.addEventListener("click", closeAssistant);
  backdrop.addEventListener("click", closeAssistant);
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && popup.classList.contains("open")) {
      closeAssistant();
    }
  });
}

runTypingEffect();
initExternalLinks();
initRevealAnimations();
initScrollProgress();
initCursorGlow();
initThemeToggle();
initProjectModal();
initCanvasBackground();
initFooterYear();
initContactForm();
initAssistantWidget();
initHeroEntranceSequence();
initPortraitTilt();
initAssistantFloatingButton();
