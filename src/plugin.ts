// Size the iframe
penpot.ui.open("IMPORT PALETTE PLUGIN", `?theme=${penpot.theme}`, {
  width: 280,
  height: 200,
});

penpot.ui.onMessage<{
  type: string;
  palette?: { name: string; colors: string[] };
}>(async (message) => {
  if (message.type === "create-color-styles" && message.palette) {
    const { name, colors } = message.palette;

    // Utility function to pad numbers dynamically
    const padNumber = (num: number, totalDigits: number): string => {
      return String(num).padStart(totalDigits, "0");
    };

    // Determine padding based on the total number of colors
    const totalDigits = colors.length >= 100 ? 3 : colors.length >= 10 ? 2 : 1;

    // Create color styles and add them to the library
    for (let i = 0; i < colors.length; i++) {
      const newColor = penpot.library.local.createColor();
      newColor.name = `${padNumber(i + 1, totalDigits)}`;
      newColor.color = `#${colors[i]}`;
      newColor.path = name;
    }
  }
});

// Update the theme in the iframe
penpot.on("themechange", (theme) => {
  penpot.ui.sendMessage({
    source: "penpot",
    type: "themechange",
    theme,
  });
});
