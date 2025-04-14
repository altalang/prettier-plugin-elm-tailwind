const { parsers: elmParsers } = require("prettier-plugin-elm");
const prettier = require("prettier");

function createPlugin() {
  let tailwindOptions = null;

  return {
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
            // Find all class attributes in Elm syntax
            const classMatches = result.match(/class\s+\"([^\"]+)\"/g) || [];
            for (const match of classMatches) {
              const classGroup = match.match(/class\s+\"([^\"]+)\"/)[1];

              // Create a minimal HTML file with the classes
              const html = `
                <div class="${classGroup.trim()}"></div>
              `;

              const formatted = await prettier.format(html, {
                parser: "html",
                plugins: [require.resolve("prettier-plugin-tailwindcss")],
                tailwindConfig: tailwindOptions.tailwindConfig,
              });

              // Extract the sorted classes from the formatted HTML
              const sortedClasses = formatted.match(/class="([^"]+)"/)[1];
              result = result.replace(match, `class "${sortedClasses}"`);
            }

            // Find all classList attributes in Elm syntax
            const classListMatches =
              result.match(
                /classList\s*\[\s*\(\s*\"([^\"]+)\"\s*,\s*([^\)]+)\s*\)/g
              ) || [];
            for (const match of classListMatches) {
              const [_, classGroup, condition] = match.match(
                /classList\s*\[\s*\(\s*\"([^\"]+)\"\s*,\s*([^\)]+)\s*\)/
              );

              // Create a minimal HTML file with the classes
              const html = `
                <div class="${classGroup.trim()}"></div>
              `;

              const formatted = await prettier.format(html, {
                parser: "html",
                plugins: [require.resolve("prettier-plugin-tailwindcss")],
                tailwindConfig: tailwindOptions.tailwindConfig,
              });

              // Extract the sorted classes from the formatted HTML
              const sortedClasses = formatted.match(/class="([^"]+)"/)[1];
              result = result.replace(
                match,
                `classList [ ( "${sortedClasses}", ${condition.trim()} )`
              );
            }

            // Find all concatenated class attributes in Elm syntax
            const concatMatches =
              result.match(/class\s+\"([^\"]+)\"\s*\+{2}\s*\"([^\"]+)\"/g) ||
              [];
            for (const match of concatMatches) {
              const [_, firstPart, secondPart] = match.match(
                /class\s+\"([^\"]+)\"\s*\+{2}\s*\"([^\"]+)\"/
              );

              // Create minimal HTML files for each part
              const htmlFirst = `
                <div class="${firstPart.trim()}"></div>
              `;
              const htmlSecond = `
                <div class="${secondPart.trim()}"></div>
              `;

              const formattedFirst = await prettier.format(htmlFirst, {
                parser: "html",
                plugins: [require.resolve("prettier-plugin-tailwindcss")],
                tailwindConfig: tailwindOptions.tailwindConfig,
              });
              const formattedSecond = await prettier.format(htmlSecond, {
                parser: "html",
                plugins: [require.resolve("prettier-plugin-tailwindcss")],
                tailwindConfig: tailwindOptions.tailwindConfig,
              });

              // Extract the sorted classes from the formatted HTML
              const sortedFirstPart =
                formattedFirst.match(/class="([^"]+)"/)[1];
              const sortedSecondPart =
                formattedSecond.match(/class="([^"]+)"/)[1];
              result = result.replace(
                match,
                `class "${sortedFirstPart}" ++ "${sortedSecondPart}"`
              );
            }
          }
          return result;
        },
      },
    },
  };
}

module.exports = createPlugin();
