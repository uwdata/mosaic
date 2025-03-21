import { SpecNode } from "./ast/SpecNode.js";

/**
 * Generate Python code for a Mosaic spec AST.
 * @param {SpecNode} ast Mosaic AST root node.
 * @param {object} [options] Code generation options.
 * @returns {string} Generated Python code using the mosaic-spec classes.
 */
export function astToPython(ast, options = {}) {
  // WHAT DOES THE BELOW DO?
  const ctx = new PythonCodegenContext(options);
  const { root, data, params } = ast; 
  // if (ast.meta && ast.meta.title === "Seattle Weather") {
  //   console.log("HERE", ast);
  // }
  
  const generateMetaCode = (meta) => {
    const metaProps = [];
    
    if (meta.title) metaProps.push(`title="${meta.title}"`);
    if (meta.description) metaProps.push(`description="${meta.description.replace(/\n/g, "\\n")}"`); // Escape newlines
    if (meta.credit) metaProps.push(`credit="${meta.credit}"`);

    return `${metaProps.join(", \n")}`; 
  };

  const generateDataCode = (data) => {
    const dataProps = [];
     
  
    for (const [name, dataNode] of Object.entries(data || {})) {
      const dataNodeProps = [];
      const methodMapping = {
        loadParquet: "DataParquet",
        loadJSON: "DataJSON",
        loadCSV: "DataCSV",
        loadArray: "DataArray",
        loadTable: "DataTable",
        loadFile: "DataFile",
        loadJSONObjects: "DataJSONObjects",
        loadQuery: "DataQuery",
        loadSpatial: "DataSpatial"
      };
      
      for (const [key, value] of Object.entries(dataNode)) {
        if (key != "options" && key !== "type" && key !== "method" && key !== "name" && value !== null && value !== undefined) {
          dataNodeProps.push(`${key}="${value}"`);
        }
      }

      for (const [name, dataNode] of Object.entries(data || {})) {
        const dataNodeProps = [];
    
        // Check if options exists and is an object
        if (dataNode.options && typeof dataNode.options === 'object' && Object.keys(dataNode.options).length > 0) {
          // Iterate through the properties of options and add them to dataNodeProps
          for (const [optKey, optValue] of Object.entries(dataNode.options)) {
            // Only add options that have a value (not null or undefined)
            if (optValue !== null && optValue !== undefined) {
              dataNodeProps.push(`${optKey}="${optValue}"`);
            }
          }
        }
      }
      const dataMethod = methodMapping[dataNode.method] || "DataFile";
      dataProps.push(`${name} = DataDefinition(${dataMethod}(${dataNodeProps.join(", ")}))`);
    }
  
    return dataProps.join(", \n");
  };


  const formatChannel = (value) => {
    if (typeof value === "string" && value.startsWith("$")) return value;
    if (typeof value === "string") return `ChannelValueSpec(ChannelValue("${value}"))`;
    if (typeof value === "number") return value.toString();
    if (!value || typeof value !== "object") return "None";

    if (value.dateMonthDay) return `ChannelValueSpec(ChannelValue(dateMonthDay="${value.dateMonthDay}"))`;
    if (value.count !== undefined) return `ChannelValueSpec(ChannelValue(count="${value.count}"))`;
    if (value.avg) return `ChannelValueSpec(ChannelValue(avg="${value.avg}"))`;
    if (value.sql) return `ChannelValueSpec(ChannelValue(sql="${value.sql}"))`;
    if (value.format) return `{"format": ${JSON.stringify(value.format)}}`;

    return `ChannelValueSpec(ChannelValue(${JSON.stringify(value)}))`;
  };

  const generateParamsCode = (params) => {
    let paramStr = [];
    for (const [name, param] of Object.entries(params || {})) {
        if (param.type === "selection") {
            paramStr.push(`${name}=ParamDefinition(Selection("${param.select}"))`);
        } else if (param.type === "param") {
            // Ensure param.value is an array
            if (Array.isArray(param.value)) {
                const valueStrs = param.value.map(val => {
                    // Handle objects by JSON.stringify()
                    return typeof val === 'object' 
                        ? `ParamLiteral(${JSON.stringify(val)})` 
                        : `ParamLiteral("${val}")`;
                });
                paramStr.push(`${name}=ParamDefinition(ParamValue([${valueStrs.join(", ")}]))`);
            }
            // If param.value is a single value, treat it as an array with one element
            else if (param.value !== undefined) {
                // Handle objects by JSON.stringify()
                paramStr.push(`${name}=ParamDefinition(ParamValue([ParamLiteral("${typeof param.value === 'object' ? JSON.stringify(param.value) : param.value}")]))`);
            } else {
                // Handle the case where param.value is undefined or invalid
                console.warn(`Invalid value for param "${name}"`);
            }
        }
    }
    return paramStr.join(",\n");
  };


  //  const generatePlotMarkCode = (mark) => {
  //   if (!mark?.mark) {
  //     console.warn("Invalid mark:", mark);
  //     return "PlotMark()";
  //   }

  //   const props = [];
  //   const markType = mark.mark;
  //   const markClass = markType.charAt(0).toUpperCase() + markType.slice(1);
  //   props.push(`mark="${markType}"`);

  //   // Handle data properties and channels
  //   if (mark.data?.from) {
  //     let dataProps = [`from_="${mark.data.from}"`];
  //     if (mark.data.filterBy) dataProps.push(`filterBy="${mark.data.filterBy}"`);
  //     props.push(`data=PlotFrom(${dataProps.join(", ")})`);
  //   }

  //   // Adding other mark properties
  //   if (mark.x) props.push(`x=${formatChannel(mark.x)}`);
  //   if (mark.y) props.push(`y=${formatChannel(mark.y)}`);
  //   if (mark.fill) props.push(`fill=${formatChannel(mark.fill)}`);
  //   if (mark.r) props.push(`r=${formatChannel(mark.r)}`);
  //   if (mark.opacity) props.push(`opacity=${formatChannel(mark.opacity)}`);
    
  //   return `PlotMark(${markClass}(${props.join(", ")}))`;
  // };

  const generateVConcatCode = (node) => {
    return `VConcat([Component(${node.children.map(child => generateHConcatCode(child)).join(", ")})])`;
  };

  const generateHConcatCode = (node) => {
    // Check for valid children
    if (!Array.isArray(node.children)) {
      console.warn("Invalid or missing 'children' in node:", node);
      return "HConcat([])";
    }

    return `HConcat([${node.children.map(child => generatePlotCode(child)).join(", ")}])`;
  };

  const generatePlotCode = (plot) => {
    if (!plot) {
      console.warn("Invalid plot:", plot);
      return "Plot()";
    }
    
    const plotMarks = [];
    
    // Handle plot marks
    if (plot.children) {  // Changed from plot.plot to plot.children
      for (const mark of plot.children) {
        // Handle data object if it exists
        if (mark.data) {
          const dataProps = [];
          if (mark.data.from) {
            dataProps.push(`from_="${mark.data.from}"`);
          }
          if (mark.data.filterBy) {
            if (mark.data.filterBy.startsWith('$')) {
              dataProps.push(`filterBy=ParamRef("${mark.data.filterBy}")`);
            } else {
              dataProps.push(`filterBy="${mark.data.filterBy}"`);
            }
          }
          mark.dataString = `PlotMarkData(PlotFrom(${dataProps.join(', ')}))`;
        }
        plotMarks.push(generatePlotMarkCode(mark));
      }
    }

    // Handle plot attributes
    const attributes = [];
    for (const [key, value] of Object.entries(plot)) {
      if (key === "plot") continue;
      if (key === "xyDomain" || key === "xDomain" || key === "yDomain") {
        attributes.push(`${key}=Fixed("Fixed")`);
      } else if (key.startsWith("color") && value.startsWith("$")) {
        attributes.push(`${key}=ParamRef("${value}")`);
      } else if (Array.isArray(value)) {
        attributes.push(`${key}=${JSON.stringify(value)}`);
      } else if (typeof value === "number") {
        attributes.push(`${key}=${value}`);
      } else {
        attributes.push(`${key}="${value}"`);
      }
    }

    const indent = (str) => str.split("\n").map(line => "    " + line).join("\n");
    const plotContent = [...plotMarks, ...attributes].join(",\n");
    
    return `Component(Plot(\n${indent(plotContent)}\n))`;
  };

  const generatePlotMarkCode = (mark) => {
    if (!mark) {
      console.warn("Invalid mark:", mark);
      return "PlotMark()";
    }

    // Handle different types of marks
    if (mark.type === "plot") {
      return generatePlotMarkWithData(mark);
    } else if (mark.type === "mark") {
      return generateBarXMark(mark);
    } else if (mark.type === "interactor") {
      return generateInteractorMark(mark);
    }

    return "PlotMark()";
  };

  const generatePlotMarkWithData = (mark) => {
    const markType = mark.children?.[0]?.mark || "dot";
    const markClass = markType.charAt(0).toUpperCase() + markType.slice(1);
    
    // Handle data section
    const data = mark.children?.[0]?.data;
    let dataSection = "";
    if (data?.from) {
      const filterBy = data.filterBy ? `, filterBy="${data.filterBy}"` : "";
      dataSection = `PlotMarkData(PlotFrom(from_="${data.from}"${filterBy}))`;
    }

    // Handle channels
    const channels = mark.children?.[0] || {};
    const channelProps = [];
    
    if (channels.x) channelProps.push(`x=ChannelValueSpec(${formatChannelValue(channels.x)})`);
    if (channels.y) channelProps.push(`y=ChannelValueSpec(${formatChannelValue(channels.y)})`);
    if (channels.fill) channelProps.push(`fill=ChannelValueSpec(${formatChannelValue(channels.fill)})`);
    if (channels.r) channelProps.push(`r=ChannelValueSpec(${formatChannelValue(channels.r)})`);
    if (channels.fillOpacity) channelProps.push(`opacity=ChannelValueSpec(ChannelValue(${channels.fillOpacity}))`);

    const props = [`mark="${markType}"`, dataSection, ...channelProps].filter(Boolean);
    
    return `PlotMark(${markClass}(${props.join(", ")}))`;
  };

  const generateBarXMark = (mark) => {
    const props = [];
    
    if (mark.data) {
      const filterBy = mark.data.filterBy ? `, filterBy="${mark.data.filterBy}"` : "";
      props.push(`data=PlotMarkData(PlotFrom(from_="${mark.data.from}"${filterBy}))`);
    }
    
    props.push(`mark="${mark.name}"`);
    
    if (mark.options) {
      if (mark.options.x) props.push(`x=ChannelValueSpec(${formatChannelValue(mark.options.x)})`);
      if (mark.options.y) props.push(`y=ChannelValueSpec(${formatChannelValue(mark.options.y)})`);
      if (mark.options.fill) props.push(`fill=ChannelValueSpec(${formatChannelValue(mark.options.fill)})`);
      if (mark.options.fillOpacity) props.push(`opacity=ChannelValueSpec(ChannelValue(${mark.options.fillOpacity}))`);
    }

    return `PlotMark(BarX(${props.join(", ")}))`;
  };

  const generateInteractorMark = (mark) => {
    const interactorType = mark.name.charAt(0).toUpperCase() + mark.name.slice(1);
    const props = [];

    if (mark.options) {
      if (mark.options.as) props.push(`as_=ParamRef("${mark.options.as}")`);
      if (mark.options.by) props.push(`by=ParamRef("${mark.options.by}")`);
      if (mark.options.select) props.push(`select="${mark.options.select}"`);
    }

    return `PlotInteractor(${interactorType}(${props.join(", ")}))`;
  };

  const formatChannelValue = (value) => {
    if (typeof value === "string") {
      if (value.startsWith("$")) return `ParamRef("${value}")`;
      return `ChannelValue("${value}")`;
    }
    if (typeof value === "object") {
      if (value.dateMonthDay) return `{"dateMonthDay": "${value.dateMonthDay}"}`;
      if (value.count !== undefined) return `{"count": ${value.count === "" ? "None" : `"${value.count}"`}}`;
    }
    return `ChannelValue(${JSON.stringify(value)})`;
  };

  const specCode = `Spec({
    ${ast.meta ? `"meta": Meta(\n    ${generateMetaCode(ast.meta)}\n),` : ''}
    ${ast.data && Object.keys(ast.data).length ? `"data": Data(\n    ${generateDataCode(ast.data)}\n),` : ''}
    ${ast.params && Object.keys(ast.params).length ? `"params": Params(\n    ${generateParamsCode(ast.params)}\n),` : ''}
    ${ast.root ? `"vconcat": ${generateVConcatCode(ast.root)}` : ''}
  })`;
  
  

  const imports = ctx.getImports();

  return `${imports}\n${specCode}`;
}

class PythonCodegenContext {
  constructor(options = {}) {
    this.depth = 0;
    this.options = options;
    this.imports = [];  // Ensure it's an array from the start
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

  // Ensure getImports always returns a valid string
  getImports() {
    // If there are no imports, return an empty string instead of calling join on undefined
    if (this.imports.length === 0) {
      return ''; 
    }
    return this.imports.join("\n");
  }

  addImport(pkg) {
    this.imports.push(pkg);  // Adds an import to the list
  }
}

