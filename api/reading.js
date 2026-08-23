const endpoint = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

function extractJson(text) {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text.match(/\{[\s\S]*\}/)?.[0];
  if (!candidate) throw new Error('No JSON in model response');
  return JSON.parse(candidate);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  if (!process.env.ZHIPU_API_KEY) return res.status(500).json({error:'Missing ZHIPU_API_KEY'});
  const {drink, mood, cards} = req.body || {};
  if (!drink || !mood || !Array.isArray(cards) || cards.length !== 3) return res.status(400).json({error:'Invalid reading input'});
  const prompt = `你是“今日饮见”的塔罗叙事者。请用中文，以暗黑、神秘、华丽、具有画面感的仪式型语气，解读这次三牌阵。\n\n用户今天喝的饮品：${drink}\n用户当前情绪：${mood}\n三张牌：${cards.map(c=>`${c.role}：${c.name}${c.orientation}`).join('；')}\n\n要求：\n1. 每段解读的主语必须是对应塔罗牌名称，例如“女祭司守护着……”；\n2. 按牌阵顺序输出三段，每段约60-100字；\n3. 不要声称确定预测未来，不涉及医疗、法律或财务建议；\n4. 不要使用命令式、时间表式建议，让行动方向自然融入叙事；\n5. 只返回 JSON，不要 Markdown：{"sections":["当前状态解读","行动建议解读","今日结果解读"]}`;
  try {
    const response = await fetch(endpoint, {method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${process.env.ZHIPU_API_KEY}`},body:JSON.stringify({model:'glm-4-flash',temperature:.85,max_tokens:900,messages:[{role:'system',content:'你是一位克制、富有诗意的塔罗叙事者。'},{role:'user',content:prompt}]})});
    if (!response.ok) throw new Error(`GLM ${response.status}`);
    const body = await response.json();
    const parsed = extractJson(body.choices?.[0]?.message?.content || '');
    if (!Array.isArray(parsed.sections) || parsed.sections.length !== 3) throw new Error('Invalid sections');
    return res.status(200).json({sections: parsed.sections});
  } catch (error) {
    console.error(error);
    return res.status(502).json({error:'Reading generation failed'});
  }
};
