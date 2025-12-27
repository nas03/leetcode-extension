# LeetCode Extension for Cursor

A Cursor extension that automatically fetches LeetCode problem descriptions and default Python3 code snippets, then inserts them into your editor as formatted comments.

## Features

- 🔍 Fetch LeetCode problems by number and name
- 📝 Automatically format problem descriptions as Python comments
- 💻 Insert default Python3 code template
- ⚡ Quick and easy to use

## Installation

### Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Compile the extension:**
   ```bash
   npm run compile
   ```

3. **Open in Cursor:**
   - Press `F5` to open a new Extension Development Host window
   - Or use the "Run Extension" command from the Command Palette

### Package for Distribution

```bash
npm install -g vsce
vsce package
```

This will create a `.vsix` file that can be installed in Cursor.

## Usage

1. **Open a Python file** (or any file) in Cursor
2. **Open Command Palette** (`Cmd+Shift+P` on Mac, `Ctrl+Shift+P` on Windows/Linux)
3. **Run the command:** `Fetch LeetCode Problem`
4. **Enter the problem number** (e.g., `1`)
5. **Enter the problem name** (e.g., `Two Sum`)
6. The extension will fetch the problem and insert it at the top of your file

## Example

After running the command with problem number `1` and name `Two Sum`, your file will be populated with:

```python
# ==============================================================================
# LeetCode 1: Two Sum
# Difficulty: Easy
# ==============================================================================
#
# Given an array of integers nums and an integer target, return indices of the
# two numbers such that they add up to target.
#
# You may assume that each input would have exactly one solution, and you may
# not use the same element twice.
#
# You can return the answer in any order.
#
# ==============================================================================
# Solution
# ==============================================================================

class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        # Your code here
        pass
```

## How It Works

The extension uses LeetCode's public GraphQL API to fetch problem details:
- Problem description (formatted as comments)
- Difficulty level
- Default Python3 code template

The problem name is automatically converted to a slug format (e.g., "Two Sum" → "two-sum") to match LeetCode's URL structure.

## Requirements

- Cursor IDE (or VS Code)
- Node.js 18+ (for development)
- Internet connection (to fetch problems from LeetCode)

## Troubleshooting

**Problem not found:**
- Make sure the problem name matches exactly as it appears on LeetCode
- Check that the problem number is correct
- Some problems may require authentication (premium problems)

**Network errors:**
- Check your internet connection
- LeetCode's API may be temporarily unavailable

## Development

### Project Structure

```
leetcode-extension/
├── src/
│   ├── extension.ts          # Main extension entry point
│   └── leetcodeCrawler.ts    # LeetCode API integration
├── out/                      # Compiled JavaScript (generated)
├── package.json              # Extension manifest
├── tsconfig.json             # TypeScript configuration
└── README.md                 # This file
```

### Building

```bash
# Compile TypeScript
npm run compile

# Watch mode (auto-compile on changes)
npm run watch
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

