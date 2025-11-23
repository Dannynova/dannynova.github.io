// Example Node serverless handler (replace AI_CALL with your provider SDK)
// For Vercel: export default async function handler(req,res) { ... }
const handler = async (req, res) => {
  if(req.method !== 'POST') return res.status(405).end();
  const { topic, tone, minutes } = req.body || {};
  if(!topic) return res.status(400).json({error:'missing topic'});

  // Server-side: call your AI provider here (keep API key in environment)
  // PSEUDO:
  // const aiResponse = await AI_CALL.generate({prompt: buildPrompt(topic,tone,minutes)});
  // const script = aiResponse.text;

  // Temporary placeholder until provider implemented:
  const script = `Hook: Quick tip on ${topic}\n\nIntro: In this ${minutes}-minute video I will... \n\nMain points:\n1) ...\n2) ...\n3) ...\n\nCTA: Subscribe and check the description for links.`;

  // return generated script
  res.setHeader('Content-Type','application/json');
  res.end(JSON.stringify({script}));
};

module.exports = handler;