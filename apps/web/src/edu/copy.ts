export const scannerEducation = {
  title: "Scanner 怎么读",
  points: [
    "资金费率是永续合约多空双方定期交换的费用，用来让合约价格靠近现货价格。",
    "费率为正时，多头付钱，空头收钱；费率为负时，空头付钱，多头收钱。",
    "费差最大不等于利润最大，手续费和滑点会吞掉看起来很漂亮的价差。",
    "要重点看净费差 netEdge；netEdge <= 0 时，就是扣费后为负的假机会。"
  ]
};

export const calculatorEducation = {
  title: "Calculator 怎么算",
  points: [
    "毛收益不等于净收益，资金费收入只是第一层。",
    "手续费要付 4 次：两所各开各平。",
    "滑点会直接吃掉收益，尤其在深度不足或波动很快时。",
    "净收益 = 毛资金费 - 手续费 - 滑点。本计算是简化估算。"
  ]
};

export const liquidationEducation = {
  title: "Liquidation 怎么看",
  points: [
    "双腿 delta 中性不代表没有风险，每条腿都会单独爆仓。",
    "杠杆越高，安全垫越小，价格离强平价越近。",
    "建议默认杠杆不超过 3x，并为资金使用比例保留缓冲。",
    "强平风险、费率反转和交易所风险都需要和收益一起看。"
  ]
};
