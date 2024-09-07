# Watch Focus

Watch Focus is a Chrome extension designed to enhance your YouTube viewing experience by allowing you to focus on the video you're watching and take notes simultaneously.

## Features

1. **Video Focus Mode**: Removes distractions from the YouTube interface, allowing you to concentrate on the video content.
2. **Note-taking**: Provides an integrated note-taking feature while watching videos.

## Installation

1. Clone this repository .
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable "Developer mode" in the top right corner.
4. Click "Load unpacked" and select the directory containing the extension files.

## Usage

1. Navigate to a YouTube video page.
2. Click on the Watch Focus extension icon in your Chrome toolbar.
3. Use the toggle switch to activate/deactivate the focus mode.
4. Click on the "Add Notes" button to open the note-taking interface.

## Project Structure

- `manifest.json`: Extension configuration file
- `scripts/`:
  - `background.js`: Background script for the extension
  - `content.js`: Content script that modifies the YouTube page
- `html/`:
  - `popup.html`: Extension popup interface
  - `notes.html`: Note-taking interface
- `css/`:
  - `style.css`: Styles for the extension interfaces

## Development

To modify the extension:

1. Make changes to the relevant files.
2. If you modify `manifest.json`, you may need to reload the extension in Chrome.
3. For changes in other files, usually reloading the YouTube page is sufficient.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

