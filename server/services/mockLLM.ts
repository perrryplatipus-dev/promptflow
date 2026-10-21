import { EvaluationScores } from './storage';

// Helper to wait
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Generate realistic responses based on prompt and variables
export function generateMockResponse(prompt: string, variables: Record<string, string>): string {
  // Replace variables in prompt
  let renderedPrompt = prompt;
  for (const [key, value] of Object.entries(variables)) {
    renderedPrompt = renderedPrompt.replace(new RegExp(`{${key}}`, 'g'), value);
  }

  const promptLower = renderedPrompt.toLowerCase();

  if (promptLower.includes('sql') || promptLower.includes('select') || promptLower.includes('query')) {
    const table = promptLower.includes('user') ? 'users' : promptLower.includes('order') ? 'orders' : 'products';
    return `\`\`\`sql
-- Automated Query Generation
SELECT 
  id, 
  name, 
  created_at 
FROM ${table}
WHERE active = true 
  AND created_at >= NOW() - INTERVAL '30 days'
ORDER BY created_at DESC 
LIMIT 10;
\`\`\`

**Explanation:**
- The query filters for active records in the \`${table}\` table.
- Indexes on \`created_at\` and \`active\` will optimize performance.`;
  }

  if (promptLower.includes('marketing') || promptLower.includes('saas') || promptLower.includes('headline')) {
    const keyword = variables.audience || 'modern builders';
    return `# Transform Your Prompt Workflow 🚀

Stop guessing what works. **PromptFlow** lets you A/B test system prompts, analyze latency metrics, and inspect outputs side-by-side. 

### Why Choose Us?
1. **Real-time Streaming**: Instant Socket.io feedback.
2. **Automated Metrics**: Intelligent scoring on tone, grammar, and accuracy.
3. **Optimized for ${keyword}**: High performance, zero friction.

*Get started today and increase prompt accuracy by up to 43%!*`;
  }

  if (promptLower.includes('support') || promptLower.includes('sentiment') || promptLower.includes('customer')) {
    return `Dear Customer,

Thank you for reaching out to PromptFlow Support. We sincerely apologize for the inconvenience you've experienced with your latency peaks.

Our engineering team has identified a minor caching issue on the socket gateways which affected streaming speeds for a short period. This has now been fully resolved. We have also credited 5,000 free tokens to your balance as a gesture of goodwill.

If you have any further questions or if the problem persists, please reply directly to this message.

Best regards,
PromptFlow Support Team`;
  }

  // Fallback generic response
  return `### AI Response for: "${renderedPrompt.substring(0, 40)}..."

Thank you for inputting this prompt. Under the active variables:
${Object.entries(variables).map(([k, v]) => `- **${k}**: "${v}"`).join('\n')}

This is a streamed simulation response demonstrating side-by-side prompt testing in **PromptFlow**. 

By comparing prompts, you can optimize:
1. **Response Tone** (e.g. polite, direct, code-only)
2. **Grammar & Structural formatting** (Markdown support)
3. **Execution Latency** (average response times)
4. **Token Counts** (cost savings and density)`;
}

// Generate automated scores based on length, tone, grammar
export function calculateScores(
  outputA: string,
  outputB: string,
  promptA: string,
  promptB: string
): EvaluationScores {
  // Return pseudo-random but repeatable scores for demonstration
  const getScore = (seed: string, min = 7.0, max = 9.8) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const val = Math.abs(hash % 100) / 100;
    return parseFloat((min + val * (max - min)).toFixed(1));
  };

  const tone = getScore(outputA + "tone", 7.2, 9.8);
  const accuracy = getScore(outputB + "accuracy", 7.5, 9.9);
  const lengthScore = getScore(outputA.length > outputB.length ? outputA : outputB, 8.0, 9.7);
  const grammar = getScore(outputA + outputB, 8.5, 9.9);
  
  const overall = parseFloat(((tone + accuracy + lengthScore + grammar) / 4).toFixed(2));

  return { tone, accuracy, length: lengthScore, grammar, overall };
}

// Helper to stream text back token by token via socket callbacks
export async function streamText(
  text: string,
  onToken: (token: string) => void,
  chunkSize = 3, // average characters per token
  intervalMs = 30 // millisecond delay between emissions
) {
  let index = 0;
  while (index < text.length) {
    const end = Math.min(index + chunkSize, text.length);
    const token = text.substring(index, end);
    onToken(token);
    index = end;
    await sleep(intervalMs + Math.random() * 15); // Add a small jitter for natural streaming feel
  }
}
