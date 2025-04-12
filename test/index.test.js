const prettier = require("prettier");
const path = require("path");
const plugin = require("../index.js");
const fs = require("fs");

// Create a temporary Tailwind config file for testing
const tailwindConfigPath = path.join(__dirname, "tailwind.config.js");
fs.writeFileSync(
  tailwindConfigPath,
  `module.exports = {
  content: [],
  theme: {
    extend: {},
  },
  plugins: [],
}`
);

const options = {
  parser: "elm",
  plugins: [path.resolve(__dirname, ".."), plugin],
  printWidth: 80,
  tailwindConfig: tailwindConfigPath,
};

describe("prettier-plugin-elm-tailwind (matching official plugin behavior)", () => {
  test("sorts simple Elm class attributes", async () => {
    const elmCode = `
module Main exposing (..)

view : Html msg
view =
    div [ class "p-4 bg-blue-500 text-lg flex" ] [ text "Hello World" ]
`;
    const formatted = await prettier.format(elmCode, options);
    // The official plugin puts display utilities first, then colors, then spacing, then typography
    expect(formatted).toContain('class "flex bg-blue-500 p-4 text-lg"');
  });

  test("sorts classList entries", async () => {
    const elmCode = `
module Main exposing (..)

view : Html msg
view =
    div [ classList [ ( "p-4 bg-blue-500 text-lg flex", True ), ( "hidden", isHidden ) ] ] [ text "Hello World" ]
`;
    const formatted = await prettier.format(elmCode, options);
    expect(formatted).toContain('( "flex bg-blue-500 p-4 text-lg", True )');
  });

  test("sorts concatenated class strings", async () => {
    const elmCode = `
module Main exposing (..)

view : Html msg
view =
    div [ class "base-styles " ++ "p-4 bg-blue-500 text-lg flex" ] [ text "Hello World" ]
`;
    const formatted = await prettier.format(elmCode, options);
    expect(formatted).toContain(
      'class "base-styles" ++ "flex bg-blue-500 p-4 text-lg"'
    );
  });

  test("sorts responsive and variant classes", async () => {
    const elmCode = `
module Main exposing (..)

view : Html msg
view =
    div [ class "md:grid sm:flex hover:bg-blue-500 focus:bg-green-500 dark:bg-gray-800" ] [ text "Hello World" ]
`;
    const formatted = await prettier.format(elmCode, options);
    // Responsive prefixes first, then variants, then base utilities
    expect(formatted).toContain(
      'class "hover:bg-blue-500 focus:bg-green-500 sm:flex md:grid dark:bg-gray-800"'
    );
  });

  test("handles arbitrary values correctly", async () => {
    const elmCode = `
module Main exposing (..)

view : Html msg
view =
    div [ class "w-[200px] h-[100px] bg-[#123456] text-[16px]" ] [ text "Hello World" ]
`;
    const formatted = await prettier.format(elmCode, options);
    // Arbitrary values should be sorted by their base utility
    expect(formatted).toContain(
      'class "h-[100px] w-[200px] bg-[#123456] text-[16px]"'
    );
  });

  test("sorts negative spacing and positional classes", async () => {
    const elmCode = `
module Main exposing (..)

view : Html msg
view =
    div [ class "-m-4 -p-2 top-4 right-2" ] [ text "Hello World" ]
`;
    const formatted = await prettier.format(elmCode, options);
    // Positioning before negative spacing
    expect(formatted).toContain('class "-p-2 right-2 top-4 -m-4"');
  });

  test("respects class dependencies", async () => {
    const elmCode = `
module Main exposing (..)

view : Html msg
view =
    div [ class "flex-col flex flex-wrap justify-center items-center" ] [ text "Hello World" ]
`;
    const formatted = await prettier.format(elmCode, options);
    // Base display utility first, then modifiers
    expect(formatted).toContain(
      'class "flex flex-col flex-wrap items-center justify-center"'
    );
  });

  test("handles complex variant scenarios", async () => {
    const elmCode = `
module Main exposing (..)

view : Html msg
view =
    div [ class "dark:hover:bg-blue-500 focus:dark:bg-green-500 sm:hover:bg-gray-800" ] [ text "Hello World" ]
`;
    const formatted = await prettier.format(elmCode, options);
    // Responsive first, then dark mode, then other variants
    expect(formatted).toContain(
      'class "sm:hover:bg-gray-800 dark:hover:bg-blue-500 focus:dark:bg-green-500"'
    );
  });

  afterAll(() => {
    fs.unlinkSync(tailwindConfigPath);
  });
});
