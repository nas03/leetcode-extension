import axios from 'axios';

export interface LeetCodeProblem {
  title: string;
  description: string;
  difficulty: string;
  codeSnippet: string;
  problemNumber: number;
}

export interface LeetCodeProblemInfo {
  questionId: string;
  title: string;
  titleSlug: string;
  difficulty: string;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class LeetCodeCrawler {
  private readonly graphqlUrl = 'https://leetcode.com/graphql/';
  
  // Cache for search results and problem details
  private searchCache: Map<string, CacheEntry<LeetCodeProblemInfo[]>> = new Map();
  private problemCache: Map<string, CacheEntry<LeetCodeProblem>> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL

  /**
   * Check if cache entry is still valid
   */
  private isCacheValid<T>(entry: CacheEntry<T> | undefined): boolean {
    if (!entry) return false;
    return Date.now() - entry.timestamp < this.CACHE_TTL;
  }

  /**
   * Clear all caches
   */
  public clearCache(): void {
    this.searchCache.clear();
    this.problemCache.clear();
  }

  /**
   * Fetch problem details from LeetCode using problem number and name
   * @param problemNumber The problem number
   * @param problemName The problem name
   * @param titleSlug Optional: The exact titleSlug from LeetCode (more reliable than converting name)
   */
  async fetchProblem(problemNumber: number, problemName: string, titleSlug?: string): Promise<LeetCodeProblem> {
    // Use provided titleSlug if available, otherwise convert problem name to slug format
    let problemSlug: string;
    if (titleSlug) {
      problemSlug = titleSlug;
    } else {
      problemSlug = this.nameToSlug(problemName);
    }
    
    // Check cache first
    const cacheKey = `problem:${problemSlug}`;
    const cachedProblem = this.problemCache.get(cacheKey);
    if (this.isCacheValid(cachedProblem)) {
      return cachedProblem!.data;
    }
    
    // GraphQL query to get problem details
    const query = `
      query questionContent($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
          questionId
          title
          content
          difficulty
          codeSnippets {
            lang
            langSlug
            code
          }
        }
      }
    `;

    try {
      let response = await axios.post(
        this.graphqlUrl,
        {
          query: query,
          variables: { titleSlug: problemSlug }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0'
          }
        }
      );

      let question = response.data.data?.question;
      
      // If the provided titleSlug didn't work and we have a fallback, try it
      if (!question && titleSlug && titleSlug !== this.nameToSlug(problemName)) {
        // Try with the converted slug as fallback
        const fallbackSlug = this.nameToSlug(problemName);
        try {
          response = await axios.post(
            this.graphqlUrl,
            {
              query: query,
              variables: { titleSlug: fallbackSlug }
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0'
              }
            }
          );
          question = response.data.data?.question;
          if (question) {
            problemSlug = fallbackSlug; // Update for logging
          }
        } catch (fallbackError) {
          // Ignore fallback error, use original error
        }
      }
      
      if (!question) {
        throw new Error(`Problem not found: ${problemName} (${problemNumber}) with slug: ${problemSlug}`);
      }

      // Find Python3 code snippet
      const pythonSnippet = question.codeSnippets?.find(
        (snippet: any) => snippet.langSlug === 'python3' || snippet.lang === 'Python3'
      );

      if (!pythonSnippet) {
        throw new Error(`Python3 code snippet not found for problem: ${problemName}`);
      }

      // Clean HTML content and convert to plain text/markdown
      const description = this.cleanHtmlContent(question.content);
      
      // Uncomment class definitions (TreeNode, ListNode, etc.)
      const processedCode = this.uncommentClassDefinitions(pythonSnippet.code);

      const result: LeetCodeProblem = {
        title: question.title,
        description: description,
        difficulty: question.difficulty,
        codeSnippet: processedCode,
        problemNumber: parseInt(question.questionId) || problemNumber
      };

      // Store in cache
      this.problemCache.set(cacheKey, { data: result, timestamp: Date.now() });
      
      return result;
    } catch (error: any) {
      // If slug-based search fails, try alternative approach
      if (error.response?.status === 404 || error.message?.includes('not found')) {
        throw new Error(
          `Problem "${problemName}" (${problemNumber}) not found. ` +
          `Please verify the problem name matches LeetCode's exact title.`
        );
      }
      throw new Error(`Failed to fetch problem: ${error.message}`);
    }
  }

  /**
   * Convert problem name to LeetCode slug format
   * Example: "Two Sum" -> "two-sum", "Binary Tree Inorder Traversal" -> "binary-tree-inorder-traversal"
   */
  private nameToSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Uncomment class definitions in the code snippet (TreeNode, ListNode, etc.)
   * LeetCode provides these as comments, but we want them as actual code
   * 
   * LeetCode format:
   * # Definition for a binary tree node.
   * # class TreeNode:
   * #     def __init__(self, val=0, left=None, right=None):
   * #         self.val = val
   */
  private uncommentClassDefinitions(code: string): string {
    const lines = code.split('\n');
    const result: string[] = [];
    let inDefinitionBlock = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if this is the start of a definition comment block
      // Matches: "# Definition for ...", "# Definition of ...", etc.
      if (line.match(/^#\s*Definition\s+(for|of)\s+/i)) {
        inDefinitionBlock = true;
        // Keep the definition comment as a regular comment
        result.push(line);
        continue;
      }
      
      // If we're in a definition block, uncomment class-related lines
      if (inDefinitionBlock) {
        // Check if line starts with "# class"
        if (line.match(/^#\s*class\s+/)) {
          // Remove only "# " (hash + single space) to preserve any following content
          result.push(line.replace(/^# /, ''));
          continue;
        }
        
        // Indented line inside class (starts with "# " followed by spaces)
        // e.g., "#     def __init__" -> "    def __init__"
        if (line.match(/^# {4}/)) {
          // Remove only "# " to preserve indentation
          result.push(line.replace(/^# /, ''));
          continue;
        }
        
        // Empty comment line in definition block
        if (line.match(/^#\s*$/)) {
          result.push('');
          continue;
        }
        
        // End of definition block (non-commented line or different type of comment)
        if (!line.startsWith('#')) {
          inDefinitionBlock = false;
        }
      }
      
      result.push(line);
    }
    
    return result.join('\n');
  }

  /**
   * Clean HTML content and format as plain readable text for Python docstrings
   */
  private cleanHtmlContent(html: string): string {
    // First, remove Examples section from HTML before converting to text
    html = this.removeExamplesSectionFromHtml(html);

    // Convert HTML to clean, readable plain text (no markdown)
    let text = html
      // Handle code blocks - convert to indented text
      .replace(/<pre[^>]*>([\s\S]*?)<\/pre>/g, (_, code) => {
        const cleanCode = code.replace(/<[^>]+>/g, '').trim();
        return '\n    ' + cleanCode.split('\n').join('\n    ') + '\n';
      })
      // Handle inline code - wrap in single quotes to mark as code/parameter
      .replace(/<code[^>]*>(.*?)<\/code>/g, "'$1'")
      // Handle superscript (like x^2)
      .replace(/<sup[^>]*>(.*?)<\/sup>/g, '^$1')
      // Handle subscript
      .replace(/<sub[^>]*>(.*?)<\/sub>/g, '_$1')
      // Paragraphs to newlines
      .replace(/<p[^>]*>/g, '\n')
      .replace(/<\/p>/g, '\n')
      .replace(/<br\s*\/?>/g, '\n')
      // Bold/strong - just keep the text (no markdown)
      .replace(/<strong[^>]*>(.*?)<\/strong>/g, '$1')
      .replace(/<b[^>]*>(.*?)<\/b>/g, '$1')
      // Italic/em - just keep the text
      .replace(/<em[^>]*>(.*?)<\/em>/g, '$1')
      .replace(/<i[^>]*>(.*?)<\/i>/g, '$1')
      // Lists - use simple bullet points
      .replace(/<li[^>]*>/g, '  • ')
      .replace(/<\/li>/g, '\n')
      .replace(/<ul[^>]*>/g, '\n')
      .replace(/<\/ul>/g, '\n')
      .replace(/<ol[^>]*>/g, '\n')
      .replace(/<\/ol>/g, '\n')
      // Remove remaining HTML tags
      .replace(/<[^>]+>/g, '')
      // Decode HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&times;/g, '×')
      .replace(/&divide;/g, '÷')
      .replace(/&le;/g, '<=')
      .replace(/&ge;/g, '>=')
      .replace(/&ne;/g, '!=')
      .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)));

    // Also remove Examples section from text (in case HTML removal missed something)
    text = this.removeExamplesSection(text);

    // Clean up whitespace
    text = text
      .replace(/\n{3,}/g, '\n\n')  // Max 2 consecutive newlines
      .replace(/[ \t]+/g, ' ')      // Collapse multiple spaces
      .replace(/\n /g, '\n')        // Remove leading spaces after newlines
      .trim();

    return text;
  }

  /**
   * Remove Examples section from HTML before converting to text
   */
  private removeExamplesSectionFromHtml(html: string): string {
    // Pattern to match Examples section in HTML
    // Look for patterns like: <p><strong>Example</strong></p> or <p>Example 1:</p>
    const exampleStartPatterns = [
      /<p[^>]*>\s*<strong[^>]*>\s*Example\s*\d*\s*:?\s*<\/strong>\s*<\/p>/gi,
      /<p[^>]*>\s*Example\s*\d*\s*:?\s*<\/p>/gi,
      /<p[^>]*>\s*Examples?\s*:?\s*<\/p>/gi,
      /<strong[^>]*>\s*Example\s*\d*\s*:?\s*<\/strong>/gi
    ];

    let result = html;
    let foundExample = false;

    // Find the start of Examples section
    for (const pattern of exampleStartPatterns) {
      const match = result.match(pattern);
      if (match) {
        foundExample = true;
        // Find the position of the first match
        const matchIndex = result.search(pattern);
        if (matchIndex !== -1) {
          // Find where the Examples section ends (look for Constraints, Follow-up, etc.)
          const afterExample = result.substring(matchIndex);
          
          // Look for section end markers
          const endPatterns = [
            /<p[^>]*>\s*<strong[^>]*>\s*Constraints?\s*:?\s*<\/strong>\s*<\/p>/i,
            /<p[^>]*>\s*Constraints?\s*:?\s*<\/p>/i,
            /<p[^>]*>\s*<strong[^>]*>\s*Follow-?up\s*:?\s*<\/strong>\s*<\/p>/i,
            /<p[^>]*>\s*Follow-?up\s*:?\s*<\/p>/i,
            /<p[^>]*>\s*<strong[^>]*>\s*Note\s*:?\s*<\/strong>\s*<\/p>/i,
            /<p[^>]*>\s*Note\s*:?\s*<\/p>/i
          ];

          let endIndex = afterExample.length;
          for (const endPattern of endPatterns) {
            const endMatch = afterExample.search(endPattern);
            if (endMatch !== -1 && endMatch < endIndex) {
              endIndex = endMatch;
            }
          }

          // Remove the Examples section
          result = result.substring(0, matchIndex) + result.substring(matchIndex + endIndex);
        }
        break;
      }
    }

    // If we didn't find HTML patterns, try a more aggressive approach
    // Remove everything between "Example" and "Constraints" or similar sections
    if (!foundExample) {
      const aggressivePattern = /(<p[^>]*>.*?Example.*?<\/p>)([\s\S]*?)(?=<p[^>]*>.*?(?:Constraints?|Follow-?up|Note)[\s\S]*?<\/p>)/gi;
      result = result.replace(aggressivePattern, '');
    }

    return result;
  }

  /**
   * Remove the Examples section from the problem description
   */
  private removeExamplesSection(text: string): string {
    // More aggressive patterns to identify the start of Examples section
    const examplePatterns = [
      /^Example\s*\d*:/im,
      /^Examples?:/im,
      /^Example\s*\d*\s*:/im,
      /^\s*Example\s*\d*:/im,
      /Example\s+1:/i,
      /Example\s+2:/i,
      /Example\s+3:/i
    ];

    const lines = text.split('\n');
    const result: string[] = [];
    let inExamplesSection = false;
    let exampleLineCount = 0;
    const maxExampleLines = 50; // Safety limit to prevent removing too much

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Check if this line starts the Examples section
      if (!inExamplesSection) {
        const isExampleStart = examplePatterns.some(pattern => pattern.test(trimmedLine));
        if (isExampleStart) {
          inExamplesSection = true;
          exampleLineCount = 0;
          // Skip this line and continue
          continue;
        }
      }

      // If we're in Examples section
      if (inExamplesSection) {
        exampleLineCount++;
        
        // Safety check: if we've processed too many lines, exit Examples section
        if (exampleLineCount > maxExampleLines) {
          inExamplesSection = false;
          result.push(line);
          continue;
        }

        // Check if we've reached a new section (usually starts with a heading-like pattern)
        const sectionEndPatterns = [
          /^Constraints?:/i,
          /^Follow-?up:/i,
          /^Note:/i,
          /^Follow-?up\s+Question:/i,
          /^Hints?:/i,
          /^Note\s+that:/i,
          /^Note\s+:/i
        ];

        const isSectionEnd = sectionEndPatterns.some(pattern => pattern.test(trimmedLine));
        if (isSectionEnd) {
          inExamplesSection = false;
          // Include this line as it's the start of a new section
          result.push(line);
          continue;
        }

        // Also check for patterns that indicate end of examples (like "Explanation:" followed by constraints)
        // Skip lines that look like example content (Input:, Output:, Explanation: within examples)
        if (/^(Input|Output|Explanation):/i.test(trimmedLine) && exampleLineCount < 20) {
          // This is likely still part of examples, skip it
          continue;
        }

        // Skip lines in Examples section
        continue;
      }

      // Include lines not in Examples section
      result.push(line);
    }

    return result.join('\n');
  }

  /**
   * Search for LeetCode problems by query (supports number, title, or "number. title" format)
   */
  async searchProblems(query: string, limit: number = 10): Promise<LeetCodeProblemInfo[]> {
    // Check cache first
    const cacheKey = `search:${query.trim().toLowerCase()}:${limit}`;
    const cachedResults = this.searchCache.get(cacheKey);
    if (this.isCacheValid(cachedResults)) {
      return cachedResults!.data;
    }

    // Parse query - could be "1", "Two Sum", or "1. Two Sum"
    let searchQuery = query.trim();
    const match = searchQuery.match(/^(\d+)\.?\s*(.+)?$/);
    let numberPrefix: string | null = null; // The number prefix to search for (e.g., "8" matches 8, 80, 81, etc.)
    
    if (match) {
      numberPrefix = match[1]; // Keep as string for prefix matching
      if (match[2]) {
        searchQuery = match[2].trim();
      } else {
        searchQuery = '';
      }
    } else if (/^\d+$/.test(searchQuery)) {
      numberPrefix = searchQuery; // Keep as string for prefix matching
      searchQuery = '';
    }

    // GraphQL query to search problems - note the ordering parameters
    const searchQueryGraphQL = `
      query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
        problemsetQuestionList: questionList(
          categorySlug: $categorySlug
          limit: $limit
          skip: $skip
          filters: $filters
        ) {
          total: totalNum
          questions: data {
            acRate
            difficulty
            freqBar
            frontendQuestionId: questionFrontendId
            isFavor
            paidOnly: isPaidOnly
            status
            title
            titleSlug
            topicTags {
              name
              id
              slug
            }
            hasSolution
            hasVideoSolution
          }
        }
      }
    `;

    try {
      // If we have a number prefix (e.g., "8" should match 8, 80, 81, ..., 89, 800, etc.)
      if (numberPrefix !== null && !searchQuery) {
        // For numeric prefix searches, we need to find all problems starting with this prefix
        // E.g., "8" → 8, 80, 81, 82, ..., 89, 800, 801, etc.
        // E.g., "84" → 84, 840, 841, 842, etc.
        
        let allQuestions: any[] = [];
        const seen = new Set<string>();
        
        // Calculate the range of problem numbers we need to cover
        // For prefix "8": covers 8, and 80-89, and 800-899, etc.
        // For prefix "84": covers 84, and 840-849, and 8400-8499, etc.
        const prefixNum = parseInt(numberPrefix);
        
        // Calculate positions to search based on prefix
        // We need to cover: prefix itself, prefix*10 to prefix*10+9, etc.
        const positionsToSearch: number[] = [];
        
        // Add the exact number position
        positionsToSearch.push(Math.max(0, prefixNum - 20));
        
        // Add positions for prefix*10, prefix*100, etc.
        let multiplier = 10;
        while (prefixNum * multiplier <= 4000) { // LeetCode has ~3000+ problems
          const rangeStart = prefixNum * multiplier;
          positionsToSearch.push(Math.max(0, rangeStart - 20));
          multiplier *= 10;
        }
        
        // Also scan from beginning to catch all matching problems
        positionsToSearch.unshift(0);
        
        // Fetch problems from calculated positions
        const batchSize = 200;
        const maxRequests = 8;
        let requestsMade = 0;
        
        // Remove duplicates and sort
        const uniquePositions = [...new Set(positionsToSearch)].sort((a, b) => a - b);
        
        for (const skipValue of uniquePositions) {
          if (requestsMade >= maxRequests) break;
          
          try {
            const resp = await axios.post(
              this.graphqlUrl,
              {
                query: searchQueryGraphQL,
                variables: {
                  categorySlug: '',
                  limit: batchSize,
                  skip: skipValue,
                  filters: {}
                }
              },
              {
                headers: {
                  'Content-Type': 'application/json',
                  'User-Agent': 'Mozilla/5.0'
                }
              }
            );

            requestsMade++;
            const qs = resp.data.data?.problemsetQuestionList?.questions || [];
            
            for (const q of qs) {
              if (!seen.has(q.frontendQuestionId)) {
                allQuestions.push(q);
                seen.add(q.frontendQuestionId);
              }
            }
            
            // If this batch had no results, stop
            if (qs.length === 0) break;
            
          } catch (e) {
            // Continue with other positions
          }
        }
        
        // Filter to only include problems whose number STARTS WITH the prefix
        let filtered = allQuestions.filter((q: any) => {
          const numStr = q.frontendQuestionId.toString();
          return numStr.startsWith(numberPrefix!);
        });

        // Sort by problem number (ascending)
        // This gives: 8, 80, 81, 82, ..., 89, 800, 801, etc.
        filtered.sort((a: any, b: any) => {
          const aNum = parseInt(a.frontendQuestionId);
          const bNum = parseInt(b.frontendQuestionId);
          return aNum - bNum;
        });

        const results = filtered.slice(0, limit).map((q: any) => ({
          questionId: q.frontendQuestionId,
          title: q.title,
          titleSlug: q.titleSlug,
          difficulty: q.difficulty
        }));
        
        // Store in cache
        this.searchCache.set(cacheKey, { data: results, timestamp: Date.now() });
        return results;
        
      } else if (numberPrefix !== null && searchQuery) {
        // Have both number prefix and title - search by title and filter by number prefix
        const filters: any = {
          searchKeywords: searchQuery
        };
        
        const response = await axios.post(
          this.graphqlUrl,
          {
            query: searchQueryGraphQL,
            variables: {
              categorySlug: '',
              limit: 50,
              skip: 0,
              filters: filters
            }
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'Mozilla/5.0'
            }
          }
        );

        const questions = response.data.data?.problemsetQuestionList?.questions || [];
        
        // Filter by number prefix (e.g., "8" matches 8, 80, 81, etc.)
        let filtered = questions.filter((q: any) => {
          const numStr = q.frontendQuestionId.toString();
          return numStr.startsWith(numberPrefix!);
        });
        
        // If no prefix match found, return all title matches
        if (filtered.length === 0) {
          filtered = questions;
        }

        // Sort by problem number
        filtered.sort((a: any, b: any) => {
          const aNum = parseInt(a.frontendQuestionId);
          const bNum = parseInt(b.frontendQuestionId);
          return aNum - bNum;
        });

        const results = filtered.slice(0, limit).map((q: any) => ({
          questionId: q.frontendQuestionId,
          title: q.title,
          titleSlug: q.titleSlug,
          difficulty: q.difficulty
        }));
        
        // Store in cache
        this.searchCache.set(cacheKey, { data: results, timestamp: Date.now() });
        return results;
        
      } else {
        // Search by title/keywords only
        const filters: any = {
          searchKeywords: searchQuery
        };
        
        const response = await axios.post(
          this.graphqlUrl,
          {
            query: searchQueryGraphQL,
            variables: {
              categorySlug: '',
              limit: limit,
              skip: 0,
              filters: filters
            }
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'Mozilla/5.0'
            }
          }
        );

        const questions = response.data.data?.problemsetQuestionList?.questions || [];
        
        // Sort by problem number (ascending)
        questions.sort((a: any, b: any) => {
          const aNum = parseInt(a.frontendQuestionId);
          const bNum = parseInt(b.frontendQuestionId);
          return aNum - bNum;
        });
        
        const results = questions.map((q: any) => ({
          questionId: q.frontendQuestionId,
          title: q.title,
          titleSlug: q.titleSlug,
          difficulty: q.difficulty
        }));
        
        // Store in cache
        this.searchCache.set(cacheKey, { data: results, timestamp: Date.now() });
        return results;
      }
    } catch (error: any) {
      console.error('Error searching problems:', error);
      return [];
    }
  }
}

