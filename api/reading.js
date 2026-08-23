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
  const prompt = `你是“今日饮见”的塔罗叙事者。请用中文为用户完成一次清晰、温柔、带有暗黑华丽氛围的三牌阵解读。整体要有神秘感，但表达必须直白易懂，让普通大学生或初入职场的年轻人读完就能理解，不要堆砌晦涩的玄学辞藻。\n\n用户今天喝的饮品：${drink}\n用户当前情绪：${mood}\n三张牌：${cards.map(c=>`${c.role}：${c.name}${c.orientation}`).join('；')}\n\n请严格遵守：\n1. 输出三段，顺序固定为“当前状态—行动建议—今日结果”；\n2. 每一段至少 100 个中文字符，内容具体、完整，不要用一句话敷衍；\n3. 每段的主语必须是对应塔罗牌名称，例如“女祭司守护着……”或“圣杯女王读取着……”；\n4. 三段必须形成连续叙事：第一段解释用户此刻的情绪从何而来，第二段承接第一段并说明今天可以如何面对，第三段描述如果沿着这个方向前进，今天可能感受到的变化；\n5. 必须自然提到用户选择的饮品或其象征意义，以及用户选择的情绪，但不要机械重复；\n6. 行动建议要清楚、实际、温和，可以让用户知道该关注什么，但不要强制命令、不要编造具体时间表；\n7. 正位表示能量较顺畅，逆位表示能量受阻、过度或需要重新调整；\n8. 不要声称确定预测未来，不涉及医疗、法律、财务或其他高风险决策；\n9. 只返回 JSON，不要 Markdown、不要前后解释：{"sections":["当前状态解读","行动建议解读","今日结果解读"]}`;
  try {
    const response = await fetch(endpoint, {method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${process.env.ZHIPU_API_KEY}`},body:JSON.stringify({model:'glm-4-flash',temperature:.8,max_tokens:1600,messages:[{role:'system',content:'你是一位克制、清晰、富有画面感的塔罗叙事者。你的任务是把神秘牌义翻译成普通年轻人能理解的情绪洞察和行动方向。'},{role:'user',content:prompt}]})});
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
