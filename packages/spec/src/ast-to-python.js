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
  // if (ast.meta && ast.meta.title === "Aeromagnetic Survey") {
  //   console.log(ast);
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
            // if (optKey === "format") {
            //   dataNodeProps.push(`type=${JSON.stringify(optValue)}`);
            //   continue;
            // }
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
                paramStr.push(`${name}=ParamDefinition(ParamValue(${valueStrs.join(", ")}))`);
            }
            // If param.value is a single value, treat it as an array with one element
            else if (param.value !== undefined) {
                // Handle objects by JSON.stringify()
                paramStr.push(`${name}=ParamDefinition(ParamValue(ParamLiteral(${typeof param.value === 'string' ? `"${param.value}"` : param.value})))`);
            } 
        }
    }
    return paramStr.join(",\n");
  };

  const generateVConcatCode = (node) => {
    if (!node || !node.children || node.children.length === 0) {
      //console.warn("Invalid or missing 'children' in node:", node);
      return "VConcat([])";
    }
    return `VConcat([Component(HConcat(${node.children.map(child => generateHConcatCode(child)).join(", ")}))])`;
  };

  const generateHConcatCode = (node) => {
    // Check for valid children

    if (!Array.isArray(node.children)) {
      
      //console.warn("Invalid or missing 'children' in node:", node);
      return generatePlotCode(node);

    }

    return `${node.children.map(child => generatePlotCode(child)).join(", ")}`;
  };

  const generatePlotCode = (plot) => {
    if (!plot) {
      //console.warn("Invalid plot:", plot);
      return "Plot()";
    }
    
    const plotMarks = [];
    
    // Handle plot marks
    if (plot.children) { 
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
    const capitalizedPlotName = plot.name ? plot.name.charAt(0).toUpperCase() + plot.name.slice(1) : "";
    const attributes = [];
    if (plot.type === "input") {
      for (const [key, value] of Object.entries(plot)) {
        console.log("Key:", key);
        console.log("Value:", value); 
        if (key === "plot") continue;
        if (key === "name") {
          attributes.push(`input="${value}"`)
        }
        // if (key === "as") {
        //   attributes.push(`);
        // }        
        if (key == "options") {
          for (const [optKey, optValue] of Object.entries(value)) {
            if (optKey === "options") {
              for (const [optKey2, optValue2] of Object.entries(optValue)) {
                attributes.push(`${optKey2}=${JSON.stringify(optValue2)}`);
              }
              continue;
            }
          }
        }
      }
    } else if (plot.type === "mark") {
      const plotMark = generatePlotMarkCode(plot,capitalizedPlotName);
      attributes.push(plotMark);
    } else {
      for (const [key, value] of Object.entries(plot)) {
        if (key === "name") {
          attributes.push(`name="${value}"`);
        } else if (key !== "children" && key !== "type") {
          const componentType = plot.type? plot.type.charAt(0).toUpperCase() + plot.type.slice(1): "";

          attributes.push(`${componentType}(${plot.type}=${JSON.stringify(value)})`);
        }
      }
    }
    const indent = (str) => str.split("\n").map(line => "    " + line).join("\n");


    const layoutAttributes = [];
    for (const [key, value] of Object.entries(plot)) {
      if (key === "children" || key === "type") continue;
      
      layoutAttributes.push(`${key}: ${JSON.stringify(value)}`);
      
    }
    const plotContent = [...plotMarks, ...attributes].join(",\n");
    return `Component(${capitalizedPlotName}(\n${indent(plotContent)}\n))`;
  };

  const generatePlotMarkCode = (plot, capitalizedPlotName) => {
    const attributes = [];
      for (const [key, value] of Object.entries(plot)) {
        if (key === "name") {
          attributes.push(`mark="${value}"`)
        } else if (key == "options") {
          for (const [optKey, optValue] of Object.entries(value)) {
            if (optKey === "options") {
              for (const [optKey2, optValue2] of Object.entries(optValue)) {
                attributes.push(`${optKey2}=${JSON.stringify(optValue2)}`);
              }
              continue;
            }
          }
        } else if (key === "mark") {
          attributes.push(`data=PlotMarkData(PlotFrom(from_="${value}"))`);
        } else if (key === "data") {
          attributes.push(`${key}=${JSON.stringify(value)}`);
        }
      }
    
      
    return `Plot(plot=[PlotMark(${capitalizedPlotName}(${attributes.join(", ")}))])`;
  };

  // const formatChannelValue = (value) => {
  //   if (typeof value === "string") {
  //     if (value.startsWith("$")) return `ParamRef("${value}")`;
  //     return `ChannelValue("${value}")`;
  //   }
  //   if (typeof value === "object") {
  //     if (value.dateMonthDay) return `{"dateMonthDay": "${value.dateMonthDay}"}`;
  //     if (value.count !== undefined) return `{"count": ${value.count === "" ? "None" : `"${value.count}"`}}`;
  //   }
  //   return `ChannelValue(${JSON.stringify(value)})`;
  // };

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

