<p align="center">
  <img src="leetcode.png" alt="LeetCode Logo" width="128" height="128">
  <h1 align="center">🧩 LeetCode Problem Fetcher</h1>
  <p align="center">
    <strong>Instantly fetch LeetCode problems into your editor with smart autocomplete</strong>
  </p>
  <p align="center">
    <a href="https://marketplace.visualstudio.com/items?itemName=nas03.leetcode-problem-fetcher">
      <img src="https://img.shields.io/visual-studio-marketplace/v/nas03.leetcode-problem-fetcher?color=blue&label=VS%20Code%20Marketplace" alt="VS Code Marketplace">
    </a>
    <a href="https://marketplace.visualstudio.com/items?itemName=nas03.leetcode-problem-fetcher">
      <img src="https://img.shields.io/visual-studio-marketplace/d/nas03.leetcode-problem-fetcher?color=green" alt="Downloads">
    </a>
    <a href="https://github.com/nas03/leetcode-extension/blob/main/LICENSE">
      <img src="https://img.shields.io/github/license/nas03/leetcode-extension" alt="License">
    </a>
  </p>
  <p align="center">
    <a href="#installation">Installation</a> •
    <a href="#features">Features</a> •
    <a href="#usage">Usage</a> •
    <a href="#demo">Demo</a> •
    <a href="#development">Development</a>
  </p>
</p>

---

A powerful Cursor/VS Code extension that automatically fetches LeetCode problem descriptions and Python3 starter code, then inserts them directly into your editor as clean, readable docstrings.

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔍 **Smart Autocomplete** | Type a number prefix and see all matching problems (e.g., "8" → 8, 80, 81, 82...) |
| 📝 **Clean Docstrings** | Problem descriptions formatted as Python triple-quote docstrings |
| 💻 **Starter Code** | Automatically includes the default Python3 code template |
| 🌳 **Auto-Uncomment Classes** | `TreeNode`, `ListNode`, etc. are automatically uncommented and ready to use |
| 🎯 **Prefix Search** | Search by problem number, title, or "number. title" format |
| 🚀 **Fast & Cached** | Uses LeetCode's GraphQL API with 5-minute caching for instant repeated searches |
| ✂️ **No Examples Clutter** | Automatically removes verbose example sections |

## 🚀 Usage

### Keyboard Shortcut

| Platform | Shortcut |
|----------|----------|
| **Mac** | `Cmd+D+L` |
| **Windows/Linux** | `Ctrl+D+L` |

### Quick Start

1. **Open any file** in Cursor/VS Code (preferably a `.py` file)
2. **Press the shortcut** or open Command Palette (`Cmd+Shift+P`)
3. **Run**: `Fetch LeetCode Problem`
4. **Search** for a problem using any of these formats:
   - By number: `841`
   - By prefix: `8` (shows 8, 80, 81, 82, ..., 800, 801, ...)
   - By title: `Two Sum`
   - Combined: `1. Two Sum`
5. **Select** from the autocomplete dropdown
6. **Done!** The problem is inserted at the top of your file

### Search Examples

| Input | Results |
|-------|---------|
| `1` | Problem 0001, 0010, 0011, 0012, ..., 0100, 0101, ... |
| `84` | Problem 0084, 0840, 0841, 0842, ... |
| `841` | Problem 0841 |
| `Two Sum` | Problems with "Two Sum" in the title |
| `841. Keys` | Problem 841 (if title matches) |

## 📸 Demo

After fetching problem **450. Delete Node in a BST**, your file will contain:

```python
"""
Delete Node in a BST
LeetCode 450 - Difficulty: Medium

Given a root node reference of a BST and a key, delete the node with the given key in the BST.
Return the root node reference (possibly updated) of the BST.

Basically, the deletion can be divided into two stages:
1. Search for a node to remove.
2. If the node is found, delete the node.

Constraints:
- The number of nodes in the tree is in the range [0, 10^4].
- -10^5 <= Node.val <= 10^5
- Each node has a unique value.
- 'root' is a valid binary search tree.
- -10^5 <= key <= 10^5
"""

# Definition for a binary tree node.
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

class Solution:
    def deleteNode(self, root: Optional[TreeNode], key: int) -> Optional[TreeNode]:
        
```

### ✨ Key Features Shown:
- **Clean docstring**: Problem description without verbose examples
- **Auto-uncommented `TreeNode`**: Class definition is ready to use (not commented out!)
- **Parameters marked**: `'root'` is quoted for clarity

## 🎯 Why This Extension?

### Before (Manual Process)
1. Open LeetCode website
2. Find the problem
3. Copy the description
4. Format it as comments
5. Copy the starter code
6. Paste everything into your editor
7. **Time: 2-3 minutes per problem**

### After (With This Extension)
1. Press `Cmd+L Cmd+E` → Search → Select
2. **Time: 5 seconds**

Perfect for:
- 📚 **Daily LeetCode practice**
- 🎓 **Interview preparation**
- 📖 **Building a solutions repository**
- ⚡ **Speed coding sessions**

## ⚙️ How It Works

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   User Input    │ ──▶ │  LeetCode API    │ ──▶ │  Format &       │
│   "841"         │     │  (GraphQL)       │     │  Insert         │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                       │                        │
         ▼                       ▼                        ▼
    Prefix Match           Fetch Problem           Triple-quote
    8, 80, 81...          Description +           Docstring +
                          Python3 Code            Starter Code
```

1. **Parse Input**: Detects if input is a number prefix, title, or combined format
2. **Smart Search**: Scans LeetCode's problem database with intelligent pagination
3. **Fetch Details**: Uses GraphQL API to get problem content and code snippets
4. **Clean & Format**: Removes examples, converts HTML to clean text
5. **Insert**: Places formatted docstring + code at cursor position

## 🛠️ Development

### Project Structure

```
leetcode-extension/
├── src/
│   ├── extension.ts        # Extension entry point & UI logic
│   └── leetcodeCrawler.ts  # LeetCode API integration
├── out/                    # Compiled JavaScript
├── package.json            # Extension manifest
├── tsconfig.json           # TypeScript configuration
├── CHANGELOG.md            # Version history
├── LICENSE                 # MIT License
└── README.md               # You are here!
```

### Building

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode (auto-compile on save)
npm run watch

# Package as VSIX
npm run package
```

### Testing Locally

1. Open the project in Cursor/VS Code
2. Press `F5` to launch Extension Development Host
3. In the new window, run `Fetch LeetCode Problem`

## 📋 Requirements

- **Editor**: Cursor IDE or VS Code 1.74+
- **Network**: Internet connection to fetch problems

## ❓ Troubleshooting

<details>
<summary><strong>Problem not found</strong></summary>

- Verify the problem number exists on LeetCode
- Check your internet connection
- Premium-only problems may not be accessible

</details>

<details>
<summary><strong>Autocomplete is slow</strong></summary>

- The extension needs to fetch problem lists from LeetCode
- First search may take 1-2 seconds
- Subsequent searches are faster

</details>

<details>
<summary><strong>Network errors</strong></summary>

- Check your internet connection
- LeetCode API may be temporarily unavailable
- Try again in a few minutes

</details>

## 🤝 Contributing

Contributions are welcome! Here's how:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Ideas for Contributions

- [ ] Support for other languages (Java, C++, JavaScript, etc.)
- [ ] Problem difficulty filtering
- [ ] Favorites/bookmarks
- [ ] Solution templates

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [LeetCode](https://leetcode.com) for providing the problem database
- [VS Code Extension API](https://code.visualstudio.com/api) for the extension framework

---

<p align="center">
  Made with ❤️ for the competitive programming community
</p>

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=nas03.leetcode-problem-fetcher">Install from Marketplace</a> •
  <a href="https://github.com/nas03/leetcode-extension/issues">Report Bug</a> •
  <a href="https://github.com/nas03/leetcode-extension/issues">Request Feature</a>
</p>
