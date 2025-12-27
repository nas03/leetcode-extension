import * as vscode from 'vscode';
import { LeetCodeCrawler, LeetCodeProblem } from './leetcodeCrawler';

export function activate(context: vscode.ExtensionContext) {
    console.log('LeetCode Extension is now active!');

    let disposable = vscode.commands.registerCommand('leetcode.fetchProblem', async () => {
        const crawler = new LeetCodeCrawler();
        
        // Use QuickPick with dynamic search
        const quickPick = vscode.window.createQuickPick();
        quickPick.placeholder = 'Type problem number, title, or "number. title" (e.g., "1. Two Sum")';
        quickPick.matchOnDescription = false;
        quickPick.matchOnDetail = false;
        
        let searchTimeout: NodeJS.Timeout | undefined;
        const searchDelay = 300; // Debounce delay in ms

        quickPick.onDidChangeValue(async (value) => {
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }

            if (!value || value.trim().length === 0) {
                quickPick.items = [];
                return;
            }

            quickPick.busy = true;
            
            searchTimeout = setTimeout(async () => {
                try {
                    const problems = await crawler.searchProblems(value, 10);
                    quickPick.items = problems.map(p => ({
                        label: `${p.questionId}. ${p.title}`,
                        description: `Difficulty: ${p.difficulty}`,
                        detail: p.titleSlug,
                        problemNumber: parseInt(p.questionId),
                        problemName: p.title,
                        titleSlug: p.titleSlug
                    }));
                } catch (error: any) {
                    vscode.window.showErrorMessage(`Search error: ${error.message}`);
                    quickPick.items = [];
                } finally {
                    quickPick.busy = false;
                }
            }, searchDelay);
        });

        // Show initial empty state
        quickPick.items = [];
        quickPick.show();

        const selected = await new Promise<{ problemNumber: number; problemName: string; titleSlug?: string } | undefined>((resolve) => {
            quickPick.onDidAccept(() => {
                const item = quickPick.selectedItems[0];
                if (item && 'problemNumber' in item && 'problemName' in item) {
                    resolve({
                        problemNumber: item.problemNumber as number,
                        problemName: item.problemName as string,
                        titleSlug: 'titleSlug' in item ? item.titleSlug as string : undefined
                    });
                } else {
                    resolve(undefined);
                }
            });

            quickPick.onDidHide(() => {
                resolve(undefined);
            });
        });

        quickPick.dispose();

        if (!selected) {
            return;
        }

        const { problemNumber, problemName, titleSlug } = selected;

        // Show progress
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Fetching LeetCode problem...',
                cancellable: false
            },
            async (progress) => {
                try {
                    progress.report({ increment: 0, message: 'Connecting to LeetCode...' });

                    const problem = await crawler.fetchProblem(problemNumber, problemName, titleSlug);

                    progress.report({ increment: 50, message: 'Problem fetched, inserting into editor...' });

                    // Get active editor
                    const editor = vscode.window.activeTextEditor;
                    if (!editor) {
                        vscode.window.showErrorMessage('No active editor found. Please open a file first.');
                        return;
                    }

                    // Format the content
                    const formattedContent = formatProblemContent(problem);

                    // Insert at the beginning of the file
                    const position = new vscode.Position(0, 0);
                    await editor.edit(editBuilder => {
                        editBuilder.insert(position, formattedContent);
                    });

                    progress.report({ increment: 100, message: 'Done!' });

                    vscode.window.showInformationMessage(
                        `Successfully fetched problem: ${problem.title} (${problem.difficulty})`
                    );
                } catch (error: any) {
                    vscode.window.showErrorMessage(`Error: ${error.message}`);
                }
            }
        );
    });

    context.subscriptions.push(disposable);
}

/**
 * Format problem content as Python docstring with code
 */
function formatProblemContent(problem: LeetCodeProblem): string {
    const lines: string[] = [];
    
    // Start triple-quoted docstring
    lines.push('"""');
    lines.push(`${problem.title}`);
    lines.push(`LeetCode ${problem.problemNumber} - Difficulty: ${problem.difficulty}`);
    lines.push('');
    
    // Description as docstring content
    const descriptionLines = problem.description.split('\n');
    for (const line of descriptionLines) {
        lines.push(line);
    }
    
    // End triple-quoted docstring
    lines.push('"""');
    lines.push('');
    
    // Code snippet
    lines.push(problem.codeSnippet);
    lines.push('');
    
    return lines.join('\n');
}


export function deactivate() {}

