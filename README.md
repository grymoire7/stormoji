# Stormoji

Stormoji is a daily, shareable, puzzle game (like Wordle in that respect) where
you are given a set of four emojis and you have to tell a story that includes
all four emojis. The story can be as long or as short as you like, but it must
include all four emojis.

## Design notes

Stormoji is a simple, single-page web application that displays a set of four
emojis each day. The emojis are randomly selected from a list of emojis. The
emojis are displayed in a random order. The user can write a story that
includes all four emojis. The user can share their story with friends via the
share button. The screen design is simple and clean. The emojis are displayed
in the center of the screen. Below the emojis is a text area where the user can
write their story. Below the text area is a share button. The share button
allows the user to share their story with friends via social media by copying
the emojis, date, and story to the clipboard.

The page looks somthing like this:

```plaintext

.-----------------------------------------------------.
| Stormoji                                          ⚙️ |
|                                                     |
|             Stormoji for May 5, 2025                |
|                   🕵️  🎳  🛼  🍅                    |
|                                                     |
|   .-------------------------------------------.     |
|   | Write a story here that includes all four |     |
|   | emojis. Share your story with friends and |     |
|   | social media.                             |     |
|   '-------------------------------------------'     |
|                       [Share]                       |
|                                                     |
`-----------------------------------------------------'

```

When the user hovers over an emoji, a tooltip is displayed that shows the name
of the emoji. The tooltip is displayed for a few seconds and then disappears.

The selection of emojis is random, but the same set of emojis is displayed to
all users on a given day. The emojis are selected from a list of emojis that
are appropriate for all ages. The emojis are displayed in a random order. At
most one emoji will be selected from each category of emojis. The categories
are:

        😃 Smileys
        🧑 People
        🐻 Animals & Nature
        🍔 Food & Drink
        ⚽ Activity
        💡 Objects
        💕 Symbols
        🚗 Travel & Places


## Implementation notes

This is a single-page web application that uses HTML, CSS, and JavaScript.


## How to Play

1. Visit [stormoji.com](https://stormoji.com) to see the daily emojis.
2. Write a story that includes all four emojis.
3. Share your story with friends and family.

## Contributing

If you have an idea for a new feature or improvement, please open an issue or
submit a pull request.  Currently, the project is in the early stages of
development, so there are many opportunities for improvement.  For example:

- The emoji data could be better curated.
- There are no settings. The gear icon is there mostl for visual balance.

## License

Stormoji is released under the [MIT License](LICENSE).

## Acknowledgements

Stormoji was created by [Tracy Atteberry](https://tracyatteberry.com) and is
inspired by [Wordle](https://www.powerlanguage.co.uk/wordle/) and [Story
Cubes](https://storycubes.com).

