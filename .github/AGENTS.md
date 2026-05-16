---
name: agentic-microsystems-agents
description: "Available agents and skills for the Agentic Microsystems project. Use to invoke specialized workflows for web scraping, content extraction, and markdown generation."
---

# Agents & Skills

Available tools and workflows for the Agentic Microsystems project.

## Skills

### Website Content Summary

**Skill:** `webpage-summary`

**Purpose:** Scrape and summarize web pages using Playwright MCP with headless Chrome. Extract website content and generate formatted markdown summaries with executive summaries, key sections, and links.

**Invocation:**

```
/webpage-summary
```

Or with a custom URL:

```
/webpage-summary https://example.com
```

**Parameters:**
- `URL` (optional): Target website to scrape. Defaults to `https://rijoemathew.com/`

**Output:**
- Markdown file saved to workspace root
- Naming convention: `{domain}-summary.md`
- Examples: `rijoemathew-summary.md`, `github-summary.md`

**Output Format:**
- YAML frontmatter (title, source URL, extraction date, word count)
- Executive summary (1-3 sentences of main purpose)
- Key sections organized by heading hierarchy
- Links section with descriptions
- Extraction metadata footer

**When to Use:**

- Extract and archive website content as markdown
- Generate executive summaries of web pages
- Create offline-readable documentation from live websites
- Research and analyze website structure and content
- Build content libraries from multiple sources
- Document competitor websites or reference materials

**Example Usage:**

```
User: /webpage-summary https://rijoemathew.com/

Copilot:
1. Launches headless Chrome browser via Playwright MCP
2. Navigates to https://rijoemathew.com/
3. Extracts page content (headings, text, links)
4. Generates markdown summary with:
   - Title: "Rijo Mathew - Full Stack Engineer & AI Researcher"
   - Executive summary of the site's purpose
   - Sections: About, Expertise, Services, Projects
   - Links: GitHub, Twitter, Contact
5. Saves to: rijoemathew-summary.md in workspace root
```

**Expected Output Example:**

```markdown
---
title: "Rijo Mathew - Full Stack Engineer & AI Researcher"
source_url: "https://rijoemathew.com/"
extracted_date: "2026-05-09T14:32:00Z"
word_count: 487
extraction_method: "Playwright MCP (Chrome Headless)"
---

# Executive Summary

Rijo Mathew is a full-stack engineer and AI researcher specializing in agentic systems 
and microsystems architecture. The portfolio site showcases work in distributed systems, 
machine learning, and developer tooling.

## About

Full-stack engineering combined with AI research to build scalable, intelligent systems...

## Key Features

- Full-stack development expertise
- AI/ML systems and reinforcement learning
- Agentic systems and autonomous agents
- Distributed systems architecture

## Links

- [GitHub Profile](https://github.com/rijoe) - Code repositories
- [Twitter/X](https://twitter.com/rijoe) - Updates and insights
- [Email](mailto:rijo@example.com) - Direct contact

---

**Extraction Details:**
- Tool: Playwright MCP (Chrome Headless)
- Extracted: 2026-05-09 at 14:32:00 UTC
- Source: https://rijoemathew.com/
- Format Version: 1.0
```

**Supported Features:**

✓ Any public website URL  
✓ JavaScript-rendered pages (waits for dynamic content)  
✓ Automatic link extraction  
✓ Heading hierarchy preservation  
✓ Metadata extraction (title, date, word count)  
✓ Headless Chrome mode  

**Tips & Best Practices:**

1. **For JavaScript-heavy sites:** The skill automatically waits for network idle state, ensuring all dynamic content loads before extraction.

2. **Custom URLs:** Provide full URLs with protocol (https://):
   ```
   /webpage-summary https://example.com
   ```

3. **Output location:** Check the workspace root for generated `.md` files:
   ```
   d:/dev/agentic_microsystems/{domain}-summary.md
   ```

4. **Re-running extraction:** Invoking the skill multiple times on the same URL overwrites the previous summary file.

5. **Large pages:** May take 10-30 seconds depending on page size and network conditions.

**Troubleshooting:**

| Issue | Solution |
|-------|----------|
| **"Browser launch failed"** | Verify Playwright MCP is configured in your Claude environment |
| **"Navigation timeout"** | Check URL is correct and publicly accessible; may need increased timeout |
| **"Content not extracted"** | Try with a different URL; some sites may have access restrictions |
| **"File not created"** | Verify workspace folder is writable; check workspace root directory |
| **Output file not found** | Look in workspace root (not subdirectories); filename uses domain name |

**Related Documentation:**

- [SKILL.md](./skills/webpage-summary/SKILL.md) — Full skill documentation
- [MCP Commands Reference](./skills/webpage-summary/references/mcp-commands.md) — Playwright MCP API details
- [Output Format Reference](./skills/webpage-summary/references/output-format.md) — Markdown template and guidelines

---

## Advanced Usage

### Extracting Multiple Pages

Invoke the skill multiple times with different URLs:

```
/webpage-summary https://example.com
/webpage-summary https://example.com/about
/webpage-summary https://example.com/services
```

Creates: `example-summary.md`, `about-summary.md`, `services-summary.md`

### Batch Processing

Request summaries of multiple sites in sequence:

```
User: Please summarize these three websites:
1. https://rijoemathew.com/
2. https://github.com/
3. https://example.com/

Copilot: [Invokes /webpage-summary three times with different URLs]
```

### Integrating with Other Tools

Use generated markdown files with:
- Documentation generators
- Knowledge management systems
- Content analysis workflows
- Competitive research compilation
- Website archiving systems

---

## Skill Discovery

To view skill details in the command palette:

1. Type `/` in Copilot Chat
2. Find `webpage-summary` in the suggestions
3. View description: "Scrape and summarize web pages using Playwright MCP..."
4. Click to invoke or type custom URL as argument

---

## Feedback & Issues

For issues or feature requests related to the `webpage-summary` skill:

1. Check [MCP Commands Reference](./skills/webpage-summary/references/mcp-commands.md) for error handling patterns
2. Verify Playwright MCP server is properly configured
3. Test with a known public URL (e.g., https://github.com/)
4. Review generated markdown format matches [Output Format Reference](./skills/webpage-summary/references/output-format.md)
