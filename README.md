# Prettier Plugin Elm Tailwind

A Prettier plugin that sorts Tailwind CSS classes in Elm files according to Tailwind's recommended class order.

## Installation

```bash
npm install --save-dev prettier-plugin-elm-tailwind
# or
yarn add --dev prettier-plugin-elm-tailwind
```

## Requirements

This plugin requires the following peer dependencies:

- `prettier` (v2.0.0 or newer)
- `prettier-plugin-elm` (v0.9.0 or newer)
- `prettier-plugin-tailwindcss` (v0.4.0 or newer - optional, but recommended)

## Usage

Once installed, Prettier will automatically use this plugin when formatting Elm files.

```bash
# Format a single file
prettier --write src/Main.elm

# Format all Elm files
prettier --write "src/**/*.elm"
```

## How It Works

This plugin integrates with both the Elm and Tailwind CSS Prettier plugins to provide class sorting capabilities for Elm files. It works by:

1. Using `prettier-plugin-elm` to format the Elm code
2. Identifying Tailwind CSS classes in `class` and `classList` attributes
3. Sorting those classes using logic from `prettier-plugin-tailwindcss` if available, or falling back to a built-in advanced sorter
4. Preserving the original Elm formatting while updating the class order

The plugin supports several Elm patterns:

```elm
-- Simple class attributes
div [ class "text-lg flex p-4 bg-blue-500" ] [ text "Hello" ]
-- ↓ becomes
div [ class "flex p-4 bg-blue-500 text-lg" ] [ text "Hello" ]

-- String concatenation
div [ class "base-styles " ++ " text-lg flex p-4" ] [ text "Hello" ]
-- ↓ becomes
div [ class "base-styles" ++ "flex p-4 text-lg" ] [ text "Hello" ]

-- classList with conditional classes
div [ classList [ ( "text-lg flex p-4", True ), ( "hidden", isHidden ) ] ] [ text "Hello" ]
-- ↓ becomes
div [ classList [ ( "flex p-4 text-lg", True ), ( "hidden", isHidden ) ] ] [ text "Hello" ]
```

## Class Sorting Order

This plugin tries to use the official Tailwind class sorting order by integrating with `prettier-plugin-tailwindcss`. If that's not available or doesn't work properly, it falls back to a sophisticated built-in sorting algorithm that follows the general Tailwind ordering principles:

1. **Layout & Position**
   - Display: `block`, `flex`, `grid`, etc.
   - Position: `static`, `fixed`, `absolute`, etc.
   - Visibility: `visible`, `invisible`, etc.

2. **Sizing**
   - Width/Height: `w-`, `h-`, `min-w-`, `max-h-`, etc.
   - Aspect ratio: `aspect-`

3. **Spacing**
   - Padding: `p-`, `px-`, `pt-`, etc.
   - Margin: `m-`, `mx-`, `mt-`, etc.
   - Space between: `space-`

4. **Flexbox & Grid**
   - Flex: `flex-`, `justify-`, `items-`, etc.
   - Grid: `grid-`, `col-`, `gap-`, etc.

5. **Borders**
   - Border: `border`, `rounded`, etc.

6. **Background**
   - Background: `bg-`, `gradient-`, etc.

7. **Typography**
   - Text: `text-`, `font-`, `tracking-`, etc.

8. **Visual & Effects**
   - Opacity, transforms, filters: `opacity-`, `transform`, etc.

9. **Interactivity**
   - User interaction: `cursor-`, `select-`, etc.

10. **Transitions & Animations**
    - Transitions: `transition-`, `animate-`, etc.

11. **Miscellaneous & Variants**
    - Everything else, including responsive/state variants

## Fallback Sorting

The built-in fallback sorting algorithm handles both regular Tailwind classes and variant-prefixed classes (like `hover:`, `dark:`, `md:`, etc.). It sorts based on the base class functionality while preserving the variants.

## License

MIT