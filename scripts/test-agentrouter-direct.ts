async function testAgentRouter() {
  const key = "sk-G8R6W0rZUlNiwxnvyuZeFNYgk0CfZuF2Hy29bQqTYIYGeAGw";

  console.log("Testing Agent Router direct API call...");
  const models = ["claude-opus-4-8", "claude-opus-5", "gpt-5.6-sol", "claude-3-5-sonnet-20241022", "gpt-4o-mini"];

  for (const model of models) {
    try {
      console.log(`\nTrying model: ${model}...`);
      const res = await fetch("https://agentrouter.org/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: "Hello!" }],
        }),
      });

      console.log(`Status (${model}):`, res.status);
      const text = await res.text();
      console.log(`Response (${model}):`, text.substring(0, 300));
    } catch (err) {
      console.error(`Error (${model}):`, err);
    }
  }
}

testAgentRouter();
