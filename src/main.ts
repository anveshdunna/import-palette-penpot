import "./style.css";

// get the current theme from the URL
const searchParams = new URLSearchParams(window.location.search);
document.body.dataset.theme = searchParams.get("theme") ?? "light";

// // Listen plugin.ts messages
window.addEventListener("message", (event) => {
  if (event.data.source === "penpot") {
    document.body.dataset.theme = event.data.theme;
  }
});

const urlInput = document.getElementById("palette-url") as HTMLInputElement;
const importButton = document.getElementById(
  "import-palette"
) as HTMLButtonElement;
const palettePreview = document.getElementById(
  "palette-preview"
) as HTMLDivElement;
const paletteMessage = document.getElementById(
  "palette-message"
) as HTMLParagraphElement;
const paletteColors = document.getElementById(
  "palette-colors"
) as HTMLDivElement;

let isErrorMessageVisible = false;
let isPaletteVisible = false;

let slideOutTimeout: number | null = null;

const resetPreview = () => {
  // palettePreview.style.display = "none";
  // paletteColors.style.display = "none";
  // paletteMessage.textContent = "";
  // paletteColors.innerHTML = "";

  if (isErrorMessageVisible || isPaletteVisible) {
    palettePreview.style.animation = "slide-out 0.15s ease-in forwards";
    setTimeout(() => {
      palettePreview.style.display = "none";
      paletteMessage.textContent = "";
      paletteColors.innerHTML = "";
      isErrorMessageVisible = false;
      isPaletteVisible = false;
    }, 150);
  }
};

const displayPalette = (colors: string[]) => {
  if (slideOutTimeout) clearTimeout(slideOutTimeout);

  palettePreview.style.display = "flex";
  paletteColors.style.display = "flex";
  paletteColors.style.marginTop = "var(--spacing-4)";
  palettePreview.style.animation = "slide-in 0.25s ease-out forwards";
  paletteMessage.textContent = `${colors.length} colors added.`;
  isPaletteVisible = true;

  colors.forEach((color) => {
    const colorBlock = document.createElement("div");
    colorBlock.style.backgroundColor = `#${color}`;
    colorBlock.style.flexGrow = "1";
    colorBlock.style.height = "var(--spacing-16)";
    paletteColors.appendChild(colorBlock);
  });

  // Start slide-out animation after timeout
  slideOutTimeout = window.setTimeout(() => {
    palettePreview.style.animation = "slide-out 0.15s ease-in forwards";
    setTimeout(() => {
      palettePreview.style.display = "none";
      paletteColors.style.marginTop = "0";
      paletteMessage.textContent = "";
      paletteColors.innerHTML = "";
      isPaletteVisible = false;
    }, 150);
  }, 2000);
};

const fetchPalette = async () => {
  // resetPreview();

  const url = urlInput.value.trim();

  // Check if the input is empty
  if (url === "") {
    showErrorMessage("⚠ Enter a URL.");
    return;
  }

  if (!url.startsWith("https://lospec.com/palette-list/")) {
    showErrorMessage("⚠ Please enter a valid palette URL.");
    return;
  }

  const slug = url.split("/").pop()?.replace(".json", "");
  if (!slug) {
    showErrorMessage("⚠ Please enter a valid palette URL.");
    return;
  }

  try {
    resetPreview();
    const response = await fetch(
      `https://lospec.com/palette-list/${slug}.json`
    );
    if (!response.ok) {
      throw new Error(`⚠ Failed to fetch palette: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.colors || !Array.isArray(data.colors)) {
      throw new Error("⚠ Invalid palette data received.");
    }

    displayPalette(data.colors);
    urlInput.value = ""; // Clear input field after successful fetch

    // Send the palette data to plugin.ts
    parent.postMessage({ type: "create-color-styles", palette: data }, "*");
  } catch (error) {
    console.error(error);
    showErrorMessage(
      "⚠ Failed to fetch the palette. Please check the URL or try again later."
    );
  }
};

const showErrorMessage = (message: string): void => {
  if (!isErrorMessageVisible) {
    palettePreview.style.display = "flex";
    palettePreview.style.animation = "slide-in 0.25s ease-out forwards";
    paletteMessage.textContent = message;
    paletteColors.innerHTML = "";
    isErrorMessageVisible = true;
  }
};

urlInput.addEventListener("input", () => {
  // if (
  //   paletteMessage.textContent?.startsWith("⚠ Enter a URL") ||
  //   paletteMessage.textContent?.startsWith("⚠ Please enter") ||
  //   paletteMessage.textContent?.startsWith("⚠ Failed to")
  // ) {
  //   resetPreview();
  // }
  if (isErrorMessageVisible) {
    palettePreview.style.animation = "slide-out 0.15s ease-in forwards";
    setTimeout(() => {
      palettePreview.style.display = "none";
      paletteMessage.textContent = "";
      isErrorMessageVisible = false;
    }, 150);
  }
});

importButton.addEventListener("click", fetchPalette);

// Listen for theme changes from plugin.ts
window.addEventListener("message", (event) => {
  if (event.data.source === "penpot" && event.data.type === "themechange") {
    document.body.dataset.theme = event.data.theme;
  }
});

// Add animations to the style tag
document.head.insertAdjacentHTML(
  "beforeend",
  `
  <style>
    @keyframes slide-in {
      0% {
        transform: translateY(100%);
        opacity: 0;
      }
      100% {
        transform: translateY(0);
        opacity: 1;
      }
    }

    @keyframes slide-out {
      0% {
        transform: translateY(0);
        opacity: 1;
      }
      100% {
        transform: translateY(100%);
        opacity: 0;
      }
    }
  </style>
`
);
