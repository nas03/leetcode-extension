# Change Log

All notable changes to the "LeetCode Problem Fetcher" extension will be documented in this file.

## [1.0.4] - 2024-12-28

### Added
- **Search caching**: Search results and problem details are now cached for 5 minutes for faster repeated queries
- **Auto-uncomment class definitions**: Class definitions like `TreeNode`, `ListNode`, `Node` are now automatically uncommented and ready to use

### Improved
- Better indentation preservation when uncommenting class definitions

## [1.0.3] - 2024-12-28

### Improved
- Enhanced problem description formatting - now displays as clean plain text
- Code/parameters are marked with single quotes (e.g., `'nums'`, `'target'`) for clarity
- Removed markdown formatting artifacts for better readability in docstrings

## [1.0.2] - 2024-12-28

### Fixed
- Fixed keyboard shortcut conflict - changed to `Cmd+D Cmd+L` (Mac) / `Ctrl+D Ctrl+L` (Windows/Linux)

## [1.0.1] - 2024-12-27

### Fixed
- Fixed autocomplete sorting - problems now sorted in ascending order by number
- Added zero-padding to problem numbers for consistent sorting (0001, 0010, etc.)

### Added
- Keyboard shortcut: `Cmd+L Cmd+E` (Mac) / `Ctrl+L Ctrl+E` (Windows/Linux)
- Extension icon (LeetCode logo)

## [1.0.0] - 2024-12-27

### Added
- Initial release
- Fetch LeetCode problems by number or title
- Autocomplete search with prefix matching (type "8" to see problems 8, 80, 81, etc.)
- Insert problem description as Python docstring comments
- Insert default Python3 code template
- Automatically remove Examples section for cleaner comments

