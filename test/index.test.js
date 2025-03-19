const prettier = require("prettier");
const path = require("path");
const plugin = require('../index.js');

// Function to make sure the sorter is initialized
function waitForSorter(maxAttempts = 30, interval = 100) {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const check = () => {
      if (plugin.tailwindSorterInitialized) {
        return resolve();
      }

      attempts++;
      if (attempts >= maxAttempts) {
        return reject(new Error("Timed out waiting for Tailwind sorter to initialize"));
      }

      setTimeout(check, interval);
    };

    check();
  });
}

// Wait for the plugin to initialize before running tests
beforeAll(async () => {
  try {
    await waitForSorter();
  } catch (error) {
    console.warn("Warning: Tailwind sorter may not be initialized:", error.message);
  }
});

describe("prettier-plugin-elm-tailwind", () => {
  const options = {
    parser: "elm",
    plugins: [path.resolve(__dirname, ".."), plugin],
    printWidth: 80,
  };

  test("it sorts simple Elm class attributes", async () => {
    const elmCode = `
module Main exposing (..)

view : Html msg
view =
    div [ class "text-lg flex p-4 bg-blue-500" ] [ text "Hello World" ]
`;

    const formatted = await prettier.format(elmCode, options);
    console.log("Formatted code:", formatted);

    // The order should now be sorted according to Tailwind's conventions
    expect(formatted).toContain('class "flex p-4 bg-blue-500 text-lg"');
  });

  test("it sorts classList entries", async () => {
    const elmCode = `
module Main exposing (..)

view : Html msg
view =
    div [ classList [ ( "text-lg flex p-4 bg-blue-500", True ), ( "hidden", isHidden ) ] ] [ text "Hello World" ]
`;

    const formatted = await prettier.format(elmCode, options);
    console.log("Formatted code:", formatted);

    // The order should now be sorted according to Tailwind's conventions
    expect(formatted).toContain('( "flex p-4 bg-blue-500 text-lg", True');
  });

  test("it sorts concatenated class strings", async () => {
    const elmCode = `
module Main exposing (..)

view : Html msg
view =
    div [ class "base-styles " ++ " text-lg flex p-4 bg-blue-500" ] [ text "Hello World" ]
`;

    const formatted = await prettier.format(elmCode, options);
    console.log("Formatted code:", formatted);

    // The order should now be sorted according to Tailwind's conventions
    expect(formatted).toContain('class "base-styles" ++ "flex p-4 bg-blue-500 text-lg"');
  });
});