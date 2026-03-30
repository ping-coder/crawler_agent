import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { CsvWriterTool, GaokaoData } from "./csvWriter.js";

async function runCrawler() {
  console.log("Starting Chrome MCP Server child process...");

  // Launch the official Chrome MCP server
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-puppeteer"],
    env: process.env as Record<string, string>
  });

  const client = new Client(
    { name: "crawler-agent-client", version: "1.0.0" },
    { capabilities: {} }
  );

  console.log("Connecting MCP Client...");
  await client.connect(transport);
  console.log("Connected successfully!");

  // List tools to make sure server is working
  const toolsResponse = await client.listTools();
  console.log("Available Chrome Tools:", toolsResponse.tools.map(t => t.name).join(", "));

  // Target website logic
  const targetUrl = "https://www.bing.com/"; // Using a safe test page for now
  console.log(`Navigating to ${targetUrl}...`);

  await client.callTool({
    name: "puppeteer_navigate",
    arguments: { url: targetUrl },
  });

  console.log("Extracting titles via js evaluation...");
  const evalResult: any = await client.callTool({
    name: "puppeteer_evaluate",
    arguments: {
      script: `
        (() => {
          const results = [];
          results.push(document.title);
          return results;
        })();
      `
    },
  });

  console.log("Evaluation Result:", evalResult);

  // Parse result safely and write to CSV
  // Note: The structure here is simplified for a test run
  let titleFound = "Unknown";
  if (evalResult.content && evalResult.content.length > 0) {
     const text = evalResult.content[0].text;
     try {
       // puppeteer_evaluate returns JSON strings inside 'text' field
       const parsedItems = JSON.parse(text);
       if (Array.isArray(parsedItems)) titleFound = parsedItems[0];
     } catch(e) {
         titleFound = text;
     }
  }

  const csvWriter = new CsvWriterTool();
  const mockData: GaokaoData[] = [{
      university: titleFound,
      year: 2024,
      major: "Test Major",
      province: "Guangdong",
      type: "Science",
      scoreLine: 600,
      admissionCount: 50
  }];

  await csvWriter.writeRecords(mockData);
  console.log("Wrote mock gaokao data to CSV.");

  console.log("Closing MCP connection...");
  await transport.close();
  console.log("Done.");
  
  // Puppeteer MCP server currently throws 'Not connected' when forcefully closed, so we explicitly exit
  process.exit(0);
}

runCrawler().catch((err) => {
  console.error("Fatal Error running crawler:", err);
  process.exit(1);
});
