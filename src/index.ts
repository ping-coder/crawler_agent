import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { navigate, extractContent, searchWeb } from "./browser";
import { CsvWriterTool, GaokaoData } from "./csvWriter";

const server = new Server({
  name: "crawler-agent-mcpserver",
  version: "1.0.0",
}, {
  capabilities: {
    tools: {},
  },
});

const csvWriter = new CsvWriterTool();

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "chrome_navigate",
        description: "Navigate Chrome to a specific URL",
        inputSchema: {
          type: "object",
          properties: {
            url: { type: "string" },
          },
          required: ["url"],
        },
      },
      {
        name: "chrome_extract_content",
        description: "Extract text content from the current page. Providing a selector extracts just that element.",
        inputSchema: {
          type: "object",
          properties: {
            selector: { type: "string" },
          },
        },
      },
      {
        name: "chrome_search_web",
        description: "Search the web using Chrome to find resources",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string" },
          },
          required: ["query"],
        },
      },
      {
        name: "write_gaokao_csv",
        description: "Append records to the local Gaokao CSV file. Data should include: university, year, major, province, type, scoreLine, admissionCount, etc.",
        inputSchema: {
          type: "object",
          properties: {
            records: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  university: { type: "string" },
                  year: { type: "number" },
                  major: { type: "string" },
                  province: { type: "string" },
                  type: { type: "string" },
                  scoreLine: { type: "number" },
                  admissionCount: { type: "number" },
                  groupName: { type: "string" },
                  groupScoreLine: { type: "number" },
                  transferRules: { type: "string" },
                  postgradRate: { type: "number" },
                  undergradCount: { type: "number" },
                  furtherStudyRate: { type: "number" },
                  furtherStudySchools: { type: "string" },
                  recruitmentFairs: { type: "string" },
                  famousEnterprises: { type: "string" },
                  recruitedCount: { type: "number" }
                },
                required: ["university", "year", "major", "province", "type", "scoreLine", "admissionCount"]
              }
            }
          },
          required: ["records"],
        },
      }
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "chrome_navigate") {
    const args = request.params.arguments as { url: string };
    const title = await navigate(args.url);
    return {
      content: [{ type: "text", text: `Navigated to ${args.url}. Page title: "${title}"` }],
    };
  } else if (request.params.name === "chrome_extract_content") {
    const args = request.params.arguments as { selector?: string };
    const content = await extractContent(args.selector);
    return {
      content: [{ type: "text", text: content }],
    };
  } else if (request.params.name === "chrome_search_web") {
    const args = request.params.arguments as { query: string };
    const results = await searchWeb(args.query);
    return {
      content: [{ type: "text", text: results }],
    };
  } else if (request.params.name === "write_gaokao_csv") {
    const args = request.params.arguments as { records: GaokaoData[] };
    await csvWriter.writeRecords(args.records);
    return {
      content: [{ type: "text", text: `Successfully wrote ${args.records.length} records to CSV.` }],
    };
  }

  throw new Error(`Tool not found: ${request.params.name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Crawler Agent MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
