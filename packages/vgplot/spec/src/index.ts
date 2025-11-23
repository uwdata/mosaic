/**
 * @typedef {import('./spec/Spec.js').Spec} Spec A Mosaic declarative specification.
 */

export { astToDOM, InstantiateContext } from "./ast-to-dom.js";
export { astToESM, CodegenContext } from "./ast-to-esm.js";
export { parseSpec } from "./parse-spec.js";

export * from "./constants.js";
export { ASTNode } from "./ast/ASTNode.js";
export {
  DataNode,
  QueryDataNode,
  TableDataNode,
  FileDataNode,
  CSVDataNode,
  JSONDataNode,
  ParquetDataNode,
  SpatialDataNode,
  LiteralJSONDataNode,
} from "./ast/DataNode.js";
export { ExpressionNode } from "./ast/ExpressionNode.js";
export { HConcatNode } from "./ast/HConcatNode.js";
export { HSpaceNode } from "./ast/HSpaceNode.js";
export { InputNode } from "./ast/InputNode.js";
export { LiteralNode } from "./ast/LiteralNode.js";
export { OptionsNode } from "./ast/OptionsNode.js";
export { ParamNode } from "./ast/ParamNode.js";
export { ParamRefNode } from "./ast/ParamRefNode.js";
export { PlotAttributeNode, PlotFixedNode } from "./ast/PlotAttributeNode.js";
export { PlotFromNode } from "./ast/PlotFromNode.js";
export { PlotInteractorNode } from "./ast/PlotInteractorNode.js";
export { PlotLegendNode } from "./ast/PlotLegendNode.js";
export { PlotMarkNode } from "./ast/PlotMarkNode.js";
export { PlotNode } from "./ast/PlotNode.js";
export { SelectionNode } from "./ast/SelectionNode.js";
export { SpecNode } from "./ast/SpecNode.js";
export { TransformNode } from "./ast/TransformNode.js";
export { VConcatNode } from "./ast/VConcatNode.js";
export { VSpaceNode } from "./ast/VSpaceNode.js";

// Spec types
export type * from "./spec/CSSStyles.js";
export type * from "./spec/Data.js";
export type * from "./spec/Expression.js";
export type * from "./spec/HConcat.js";
export type * from "./spec/HSpace.js";
export type * from "./spec/Input.js";
export type * from "./spec/Interval.js";
export type * from "./spec/Param.js";
export type * from "./spec/Plot.js";
export type * from "./spec/PlotAttribute.js";
export type * from "./spec/PlotFrom.js";
export type * from "./spec/PlotInteractor.js";
export type * from "./spec/PlotLegend.js";
export type * from "./spec/PlotMark.js";
export type * from "./spec/PlotTypes.js";
export type * from "./spec/Spec.js";
export type * from "./spec/Transform.js";
export type * from "./spec/VConcat.js";
export type * from "./spec/VSpace.js";

// Marks
export type * from "./spec/marks/Area.js";
export type * from "./spec/marks/Arrow.js";
export type * from "./spec/marks/Axis.js";
export type * from "./spec/marks/Bar.js";
export type * from "./spec/marks/Cell.js";
export type * from "./spec/marks/Contour.js";
export type * from "./spec/marks/Delaunay.js";
export type * from "./spec/marks/DenseLine.js";
export type * from "./spec/marks/Density.js";
export type * from "./spec/marks/Dot.js";
export type * from "./spec/marks/ErrorBar.js";
export type * from "./spec/marks/Frame.js";
export type * from "./spec/marks/Geo.js";
export type * from "./spec/marks/Hexbin.js";
export type * from "./spec/marks/Hexgrid.js";
export type * from "./spec/marks/Image.js";
export type * from "./spec/marks/Line.js";
export type * from "./spec/marks/Link.js";
export type * from "./spec/marks/Marks.js";
export type * from "./spec/marks/Raster.js";
export type * from "./spec/marks/Rect.js";
export type * from "./spec/marks/Regression.js";
export type * from "./spec/marks/Rule.js";
export type * from "./spec/marks/Text.js";
export type * from "./spec/marks/Tick.js";
export type * from "./spec/marks/Vector.js";
export type * from "./spec/marks/Waffle.js";

// Interactors
export type * from "./spec/interactors/BrushStyles.js";
export type * from "./spec/interactors/Highlight.js";
export type * from "./spec/interactors/Interval1D.js";
export type * from "./spec/interactors/Interval2D.js";
export type * from "./spec/interactors/Nearest.js";
export type * from "./spec/interactors/PanZoom.js";
export type * from "./spec/interactors/Region.js";
export type * from "./spec/interactors/Toggle.js";
