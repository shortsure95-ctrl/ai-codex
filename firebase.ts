@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
@import "tailwindcss";

@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Space Grotesk", sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, monospace;
}

/* Custom smooth transition classes */
.theme-transition {
  transition: background-color 1.2s cubic-bezier(0.4, 0, 0.2, 1), 
              background-image 1.2s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.8s ease;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

@keyframes fall {
  0% { transform: translateY(-20px); opacity: 0; }
  10% { opacity: 0.5; }
  90% { opacity: 0.5; }
  100% { transform: translateY(105vh); opacity: 0; }
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}


