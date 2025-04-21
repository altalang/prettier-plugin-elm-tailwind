const { parsers: elmParsers } = require("prettier-plugin-elm");
const prettier = require("prettier");

function createPlugin() {
  let tailwindOptions = null;
  let tailwindPlugin = null;

  return {
    options: {
      tailwindConfig: {
        type: "string",
        category: "Tailwind CSS",
        description: "Path to Tailwind configuration file",
      },
      tailwindEntryPoint: {
        type: "string",
        category: "Tailwind CSS",
        description:
          "Path to the CSS entrypoint in your Tailwind project (v4+)",
      },
      tailwindStylesheet: {
        type: "string",
        category: "Tailwind CSS",
        description:
          "Path to the CSS stylesheet in your Tailwind project (v4+)",
      },
      tailwindAttributes: {
        type: "string",
        array: true,
        default: [{ value: [] }],
        category: "Tailwind CSS",
        description:
          "List of attributes/props that contain sortable Tailwind classes",
      },
      tailwindFunctions: {
        type: "string",
        array: true,
        default: [{ value: [] }],
        category: "Tailwind CSS",
        description:
          "List of functions and tagged templates that contain sortable Tailwind classes",
      },
      tailwindPreserveWhitespace: {
        type: "boolean",
        default: false,
        category: "Tailwind CSS",
        description: "Preserve whitespace around Tailwind classes when sorting",
      },
      tailwindPreserveDuplicates: {
        type: "boolean",
        default: false,
        category: "Tailwind CSS",
        description:
          "Preserve duplicate classes inside a class list when sorting",
      },
    },
    parsers: {
      elm: {
        ...elmParsers.elm,
        astFormat: "elm-format",
        preprocess: function (text, options) {
          tailwindOptions = options;
          return text;
        },
      },
    },

    printers: {
      "elm-format": {
        print: async function (path) {
          const node = path.getValue();
          let result = node.body;

          if (typeof result === "string" && tailwindOptions) {
            // Lazy load the tailwind plugin using absolute path
            if (!tailwindPlugin) {
              const tailwindPluginPath = require.resolve(
                "prettier-plugin-tailwindcss"
              );
              tailwindPlugin = await import(tailwindPluginPath);
            }

            // Helper function to format classes using Tailwind
            async function formatClasses(classString) {
              const html = `<div class="${classString.trim()}"></div>`;
              const formatted = await prettier.format(html, {
                parser: "html",
                plugins: [tailwindPlugin],
                tailwindConfig: tailwindOptions.tailwindConfig || "",
                tailwindEntryPoint: tailwindOptions.tailwindEntryPoint,
                tailwindStylesheet: tailwindOptions.tailwindStylesheet,
                tailwindAttributes: tailwindOptions.tailwindAttributes,
                tailwindFunctions: tailwindOptions.tailwindFunctions,
                tailwindPreserveWhitespace:
                  tailwindOptions.tailwindPreserveWhitespace,
                tailwindPreserveDuplicates:
                  tailwindOptions.tailwindPreserveDuplicates,
                printWidth: 1000,
                htmlWhitespaceSensitivity: "css",
              });
              return formatted.match(/class="([^"]+)"/)[1].trim();
            }

            // Process class attributes
            const classRegex = /(\s*)(class\s+\"([^\"]+)\")/g;
            let match;
            while ((match = classRegex.exec(result)) !== null) {
              const [fullMatch, indent, classAttr, classGroup] = match;
              const sortedClasses = await formatClasses(classGroup);
              result = result.replace(fullMatch, `${indent}class "${sortedClasses}"`);
            }

            // Process classList attributes
            const classListRegex = /(\s*)(classList[\s\S]*?\[\s*\(\s*)("([^"]+)")(\s*,\s*[^\)]+\s*\))/g;
            while ((match = classListRegex.exec(result)) !== null) {
              const [fullMatch, indent, before, quotedClassGroup, classGroup, after] = match;
              const sortedClasses = await formatClasses(classGroup);
              result = result.replace(fullMatch, `${indent}${before}"${sortedClasses}"${after}`);
            }

            // Process concatenated class strings
            const concatRegex = /(\s*)(class\s+\"([^\"]+)\"\s*\+{2}\s*\"([^\"]+)\")/g;
            while ((match = concatRegex.exec(result)) !== null) {
              const [fullMatch, indent, _, firstPart, secondPart] = match;
              const sortedFirst = await formatClasses(firstPart);
              const sortedSecond = await formatClasses(secondPart);
              result = result.replace(fullMatch, `${indent}class "${sortedFirst}" ++ "${sortedSecond}"`);
            }
          }

          return result;
        },
      },
    },
  };
}

module.exports = createPlugin();
