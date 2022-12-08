export function when(test, thenExpr, elseExpr) {
  return `CASE WHEN ${test} THEN ${thenExpr} ELSE ${elseExpr} END`;
}
