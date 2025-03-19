const { parsers: elmParsers } = require("prettier-plugin-elm");

// Initialize tailwind sorter
let tailwindSorter = null;
let tailwindSorterInitialized = false;

/**
 * A comprehensive class sorter that follows Tailwind's natural ordering
 *
 * Order:
 * 1. Layout & Position (display, position, visibility, z-index, etc)
 * 2. Sizing (width, height, min/max)
 * 3. Spacing (padding, margin)
 * 4. Flexbox/Grid (flex, grid, gap, etc)
 * 5. Borders (border, rounded, etc)
 * 6. Background (bg-color, bg-opacity, etc)
 * 7. Typography (text-color, font-size, etc)
 * 8. Effects/Filters (shadow, opacity, transform, etc)
 * 9. Interactivity (cursor, user-select, etc)
 * 10. Misc/Variants (dark:, hover:, focus:, etc)
 */
function advancedTailwindSort(classStr) {
  if (!classStr || classStr.trim() === "") {
    return classStr;
  }

  // Split by whitespace and filter out empty strings
  const classNames = classStr.split(/\s+/).filter(Boolean);

  // Define the order of class categories
  const categoryOrder = [
    "layout",       // 1. Layout & Display
    "position",     // 1. Position
    "visibility",   // 1. Visibility
    "sizing",       // 2. Sizing
    "spacing",      // 3. Spacing
    "flexbox",      // 4. Flexbox
    "grid",         // 4. Grid
    "borders",      // 5. Borders
    "effects",      // 5. Effects (rounded, etc)
    "background",   // 6. Background
    "typography",   // 7. Typography
    "visual",       // 8. Visual effects
    "interactivity",// 9. Interactivity
    "svg",          // SVG specific
    "transitions",  // Transitions and animations
    "misc",         // Everything else
  ];

  // Define class prefixes by category
  const categories = {
    layout: [
      "block", "inline", "inline-block", "flex", "inline-flex", "grid", "inline-grid", "contents", "flow-root",
      "hidden", "table", "container", "columns", "break-", "box-", "float-", "clear-", "object-", "overflow-"
    ],
    position: [
      "static", "fixed", "absolute", "relative", "sticky", "inset-", "top-", "right-", "bottom-", "left-", "z-"
    ],
    visibility: [
      "visible", "invisible", "backface-", "isolate", "isolation-"
    ],
    sizing: [
      "w-", "h-", "min-w-", "min-h-", "max-w-", "max-h-", "size-", "aspect-"
    ],
    spacing: [
      "p-", "px-", "py-", "pt-", "pr-", "pb-", "pl-",
      "m-", "mx-", "my-", "mt-", "mr-", "mb-", "ml-",
      "space-"
    ],
    flexbox: [
      "flex-", "justify-", "items-", "self-", "place-", "order-", "grow", "shrink", "basis-"
    ],
    grid: [
      "grid-", "col-", "row-", "auto-", "gap-"
    ],
    borders: [
      "border", "border-", "outline", "outline-"
    ],
    effects: [
      "rounded", "rounded-", "shadow", "shadow-"
    ],
    background: [
      "bg-", "from-", "via-", "to-", "gradient-"
    ],
    typography: [
      "text-", "font-", "antialiased", "italic", "not-italic", "normal-", "uppercase", "lowercase", "capitalize",
      "truncate", "indent-", "align-", "whitespace-", "break-", "tracking-", "leading-", "list-", "underline",
      "no-underline", "line-", "decoration-", "underline-", "tab-"
    ],
    visual: [
      "opacity-", "mix-", "blend-", "filter", "blur-", "brightness-", "contrast-", "drop-", "grayscale-", "hue-",
      "invert-", "saturate-", "sepia-", "backdrop-", "transform", "scale-", "rotate-", "translate-", "skew-",
      "origin-", "accent-", "appearance-", "cursor-", "caret-", "pointer-", "resize-", "scroll-", "snap-", "touch-"
    ],
    interactivity: [
      "cursor-", "resize-", "user-", "select-", "touch-", "scroll-", "snap-", "will-change-"
    ],
    svg: [
      "fill-", "stroke-"
    ],
    transitions: [
      "transition-", "duration-", "ease-", "delay-", "animate-", "motion-"
    ],
    misc: []
  };

  // Helper function to determine the category of a class
  function getCategory(className) {
    // Skip known variant prefixes for categorization purposes
    const baseClass = className.replace(/^(hover|focus|active|group-hover|dark|lg|md|sm|xl|2xl|motion-safe|motion-reduce|first|last|odd|even|visited|disabled|checked|required|valid|invalid|open|before|after):/g, '');

    // Go through each category and check for matching prefixes
    for (const [category, prefixes] of Object.entries(categories)) {
      for (const prefix of prefixes) {
        if (baseClass.startsWith(prefix)) {
          return category;
        }
      }
    }

    return "misc";
  }

  // Sort classes into categories
  const categorized = {};
  categoryOrder.forEach(category => {
    categorized[category] = [];
  });

  // Place each class into its category
  classNames.forEach(cls => {
    const category = getCategory(cls);
    categorized[category].push(cls);
  });

  // Combine categories in order
  const result = categoryOrder
    .flatMap(category => categorized[category])
    .join(' ');

  return result;
}

// For tests, initialize the sorter immediately
tailwindSorter = advancedTailwindSort;
tailwindSorterInitialized = true;

// Try to load the actual Tailwind plugin (will be used if available)
async function initializeTailwindSorter() {
  try {
    // Use dynamic import for ES modules
    const tailwindModule = await import("prettier-plugin-tailwindcss");

    // Find the sorter function
    if (tailwindModule && tailwindModule.parsers && tailwindModule.parsers.babel) {
      const tailwindFn = tailwindModule.parsers.babel.preprocess;

      tailwindSorter = (classString) => {
        if (!classString || classString.trim() === "") {
          return classString;
        }

        try {
          const dummyHtml = `<div class="${classString}"></div>`;
          const processed = tailwindFn(dummyHtml, {
            tailwindConfig: {},
            tailwindFunctions: ['class', 'classList']
          });

          // Extract the sorted classes from the HTML
          const match = processed.match(/class="([^"]*)"/);
          if (match && match[1] !== classString) {
            return match[1];
          }

          // If the tailwind sorter doesn't work, fall back to our implementation
          return advancedTailwindSort(classString);
        } catch (error) {
          console.warn("Error using Tailwind sorter:", error.message);
          return advancedTailwindSort(classString);
        }
      };
    } else {
      console.warn("Could not find Tailwind CSS sorter in the plugin. Using advanced fallback.");
      tailwindSorter = advancedTailwindSort;
    }
  } catch (error) {
    console.warn("Could not load prettier-plugin-tailwindcss:", error.message);
    tailwindSorter = advancedTailwindSort;
  }

  // Set initialization flag
  tailwindSorterInitialized = true;
}

// Start the async initialization process for the real sorter
initializeTailwindSorter();

// Initialize our exports early
const plugin = {
  parsers: {
    elm: {
      ...elmParsers.elm,
      astFormat: "elm-format"
    }
  },

  printers: {
    "elm-format": {
      print: function(path) {
        const node = path.getValue();
        let result = node.body;

        if (typeof result === "string" && tailwindSorter) {
          // Handle the 'class' attribute in Elm
          result = result.replace(/class\s+\"([^\"]+)\"/g, (match, classGroup) => {
            const sortedClasses = tailwindSorter(classGroup.trim());
            return `class "${sortedClasses}"`;
          });

          // Handle the first part of string concatenation (class "base-styles " ++ "...")
          result = result.replace(/class\s+\"([^\"]+)\"\s*\+{2}\s*\"([^\"]+)\"/g, (match, firstPart, secondPart) => {
            const sortedFirstPart = tailwindSorter(firstPart.trim());
            const sortedSecondPart = tailwindSorter(secondPart.trim());
            return `class "${sortedFirstPart}" ++ "${sortedSecondPart}"`;
          });

          // Handle the classList pattern for Elm
          result = result.replace(/\(\s*\"([^\"]+)\"\s*,\s*([^\)]+)\)/g, (match, classGroup, condition) => {
            const sortedClasses = tailwindSorter(classGroup.trim());
            return `( "${sortedClasses}", ${condition} )`;
          });
        }
        return result;
      }
    }
  }
};

// Export initialization state
plugin.tailwindSorterInitialized = tailwindSorterInitialized;

module.exports = plugin;