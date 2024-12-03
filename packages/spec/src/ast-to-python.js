import { SpecNode } from "./ast/SpecNode.js";

/**
 * Generate Python code for a Mosaic spec AST.
 * @param {SpecNode} ast Mosaic AST root node.
 * @param {object} [options] Code generation options.
 * @returns {string} Generated Python code using the mosaic-spec classes.
 */
export function astToPython(ast, options = {}) {
  const ctx = new PythonCodegenContext(options);
  const { root, data, params } = ast;

  // Function to format channel values
  const formatChannel = (value) => {
    // Handle strings that start with $
    if (typeof value === "string" && value.startsWith("$")) {
      return value; // Return variable references as-is
    }
    // Handle regular strings
    if (typeof value === "string") {
      return `ChannelValueSpec(ChannelValue("${value}"))`;
    }
    // Handle numbers
    if (typeof value === "number") {
      return value.toString();
    }
    if (!value || typeof value !== "object") {
      return "None";
    }

    // Handle different value types
    if (value.dateMonthDay) {
      return `ChannelValueSpec(ChannelValue(dateMonthDay="${value.dateMonthDay}"))`;
    }
    if (value.count !== undefined) {
      return `ChannelValueSpec(ChannelValue(count="${value.count}"))`;
    }
    if (value.avg) {
      return `ChannelValueSpec(ChannelValue(avg="${value.avg}"))`;
    }
    if (value.sql) {
      return `ChannelValueSpec(ChannelValue(sql="${value.sql}"))`;
    }
    if (value.format) {
      return `{"format": ${JSON.stringify(value.format)}}`;
    }

    // If none of the above, convert to string representation
    return `ChannelValueSpec(ChannelValue(${JSON.stringify(value)}))`;
  };

  // Function to generate mark code
  const generateMarkCode = (mark) => {
    if (!mark?.mark) {
      console.warn("Invalid mark:", mark);
      return "        PlotMark()";
    }

    const props = [];

    // Handle mark type
    const markType = mark.mark;
    const markClass = markType.charAt(0).toUpperCase() + markType.slice(1);
    props.push(`mark="${markType}"`);

    // Handle other properties
    if (mark.data?.from) {
      let dataProps = [`from_="${mark.data.from}"`];
      if (mark.data.filterBy) {
        dataProps.push(`filterBy=${mark.data.filterBy}`);
      }
      props.push(`data=PlotFrom(${dataProps.join(", ")})`);
    }
    if (mark.x) props.push(`x=${formatChannel(mark.x)}`);
    if (mark.y) props.push(`y=${formatChannel(mark.y)}`);
    if (mark.z) props.push(`z=${formatChannel(mark.z)}`);
    if (mark.fill) props.push(`fill=${formatChannel(mark.fill)}`);
    if (mark.stroke) props.push(`stroke=${formatChannel(mark.stroke)}`);
    if (mark.strokeWidth)
      props.push(`strokeWidth=${formatChannel(mark.strokeWidth)}`);
    if (mark.strokeOpacity)
      props.push(`strokeOpacity=${formatChannel(mark.strokeOpacity)}`);
    if (mark.fillOpacity)
      props.push(`fillOpacity=${formatChannel(mark.fillOpacity)}`);
    if (mark.r) props.push(`r=${formatChannel(mark.r)}`);
    if (mark.rotate) props.push(`rotate=${formatChannel(mark.rotate)}`);
    if (mark.length) props.push(`length=${formatChannel(mark.length)}`);
    if (mark.tip !== undefined) props.push(`tip=${formatChannel(mark.tip)}`);
    if (mark.title) props.push(`title=${formatChannel(mark.title)}`);
    if (mark.binWidth) props.push(`binWidth=${formatChannel(mark.binWidth)}`);
    if (mark.frameAnchor) props.push(`frameAnchor="${mark.frameAnchor}"`);
    if (mark.strokeLinecap) props.push(`strokeLinecap="${mark.strokeLinecap}"`);
    if (mark.dy) props.push(`dy=${mark.dy}`);
    if (mark.tickFormat) props.push(`tickFormat="${mark.tickFormat}"`);

    return `        PlotMark(${markClass}(${props.join(", ")}))`;
  };

  // Generate data definitions
  const dataCode = [];
  for (const [name, node] of Object.entries(data || {})) {
    dataCode.push(`${name} = DataSource(
    type="${node.format || "parquet"}",
    file="${node.file}",
    where="${node.options?.options?.where?.value || ""}"
)`);
  }

  // Function to find plot marks in nested structure
  const findPlotMarks = (node) => {
    if (node.plot) {
      return node.plot;
    }
    if (node.vconcat) {
      for (const child of node.vconcat) {
        const plot = findPlotMarks(child);
        if (plot) return plot;
      }
    }
    if (node.hconcat) {
      for (const child of node.hconcat) {
        const plot = findPlotMarks(child);
        if (plot) return plot;
      }
    }
    return null;
  };

  // Function to find plot properties in nested structure
  const findPlotProperties = (node) => {
    if (
      node.width !== undefined ||
      node.height !== undefined ||
      node.margin !== undefined
    ) {
      return {
        width: node.width,
        height: node.height,
        margin: node.margin,
      };
    }
    if (node.vconcat) {
      for (const child of node.vconcat) {
        const props = findPlotProperties(child);
        if (props) return props;
      }
    }
    if (node.hconcat) {
      for (const child of node.hconcat) {
        const props = findPlotProperties(child);
        if (props) return props;
      }
    }
    return null;
  };

  // Get plot marks and properties
  const rootJSON = root.toJSON();
  const plotMarks = findPlotMarks(rootJSON);
  const plotProps = findPlotProperties(rootJSON);

  // Generate mark code if plot marks exist
  let plotMarksCode = "";
  if (plotMarks?.length > 0) {
    plotMarksCode = plotMarks.map((mark) => generateMarkCode(mark)).join(",\n");
  }

  // Generate main spec
  let specCode = `spec = Plot(
    plot=[
${plotMarksCode}
    ],
    width=${plotProps?.width !== undefined ? plotProps.width : "None"},
    height=${plotProps?.height !== undefined ? plotProps.height : "None"}${
    plotProps?.margin !== undefined ? `,\n    margin=${plotProps.margin}` : ""
  }
)`;

  // Generate imports
  const imports = [
    "from mosaic import *",
    "from mosaic.spec import *",
    "from mosaic.generated_classes import *",
    "from typing import Dict, Any, Union",
    "",
  ];

  return [...imports, "", ...dataCode, "", specCode].join("\n");
}

export class PythonCodegenContext {
  constructor(options = {}) {
    this.depth = 0;
    this.options = options;
  }

  indent() {
    this.depth += 1;
  }

  undent() {
    this.depth -= 1;
  }

  tab() {
    return "    ".repeat(this.depth);
  }
}
