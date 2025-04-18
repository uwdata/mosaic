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
  if (ast.meta && ast.meta.title === "Airline Travelers") {
    console.log("HERE",ast.root);
  }
  const generateMetaCode = (meta) => {
    const metaProps = [];
    
    if (meta.title) metaProps.push(`title="${meta.title}"`);
    if (meta.description) metaProps.push(`description="${meta.description.replace(/\n/g, "\\n")}"`); // Escape newlines
    if (meta.credit) metaProps.push(`credit="${meta.credit}"`);

    return `${metaProps.join(", \n")}`; 
  };

  // const generateDataCode = (data) => {
  //   const dataProps = [];
  //   let dataType = "";
     
  
  //   for (const [name, dataNode] of Object.entries(data || {})) {
  //     const dataNodeProps = [];
  //     const methodMapping = {
  //       loadParquet: "DataParquet",
  //       loadJSON: "DataJSON",
  //       loadCSV: "DataCSV",
  //       loadArray: "DataArray",
  //       loadTable: "DataTable",
  //       loadFile: "DataFile",
  //       loadJSONObjects: "DataJSONObjects",
  //       loadQuery: "DataQuery",
  //       loadSpatial: "DataSpatial"
  //     };
      
  //     for (const [key, value] of Object.entries(dataNode)) {
  //       if (key != "options" && key !== "type" && key !== "method" && key !== "name" && value !== null && value !== undefined) {
  //         if (key === "format") {
  //           dataNodeProps.push(`type="${value}"`);
  //           dataType = value;
  //         } else {
  //           dataNodeProps.push(`${key}="${value}"`);
  //         }
  //       }
  //     }

  //     // for (const [name, dataNode] of Object.entries(data || {})) {
  //     //   const dataNodeProps = [];
    
  //     //   // Check if options exists and is an object
  //     //   if (dataNode.options && typeof dataNode.options === 'object' && Object.keys(dataNode.options).length > 0) {
  //     //     // Iterate through the properties of options and add them to dataNodeProps
  //     //     for (const [optKey, optValue] of Object.entries(dataNode.options)) {
  //     //       // Only add options that have a value (not null or undefined)
  //     //       // if (optKey === "format") {
  //     //       //   dataNodeProps.push(`type=${JSON.stringify(optValue)}`);
  //     //       //   continue;
  //     //       // }
  //     //       if (optValue !== null && optValue !== undefined) {
  //     //         dataNodeProps.push(`${optKey}="${optValue}"`);
  //     //       }
  //     //     }
  //     //   }
  //     // }
  //     const dataMethod = dataNode.method ? methodMapping[dataNode.method] : methodMapping[dataType];
  //     dataProps.push(`${name} = DataDefinition(${dataMethod}(${dataNodeProps.join(", ")}))`);
  //   }
  
  //   return dataProps.join(", \n");
  // };
  const generateDataCode = (data) => {
    const dataProps = [];
  
    for (const [name, dataNode] of Object.entries(data || {})) {
      let dataNodeProps = [];
      let dataType = "";
  
      const methodMapping = {
        loadParquet: "DataParquet",
        loadJSON: "DataJSON",
        loadCSV: "DataCSV",
        loadArray: "DataArray",
        loadTable: "DataTable",  // Ensure this is in the mapping
        loadFile: "DataFile",
        loadJSONObjects: "DataJSONObjects",
        loadQuery: "DataQuery",
        loadSpatial: "DataSpatial"
      };
  
      // Process properties of dataNode
      for (const [key, value] of Object.entries(dataNode)) {
        if (key !== "options" && key !== "type" && key !== "method" && key !== "name" && value !== null && value !== undefined) {
          if (key === "format") {
            dataType = value;
            dataNodeProps.push(`type="${value}"`);
          } else {
            dataNodeProps.push(`${key}="${value}"`);
          }
        }
      }
  
      // Check if method exists in the mapping, otherwise default to DataTable
      const dataMethod = dataNode.method ? methodMapping[dataNode.method] : "DataTable"; // Fallback to DataTable
  
      // Generate the data code
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
                paramStr.push(`${name}=ParamDefinition(${valueStrs.join(", ")})`);
            }
            // If param.value is a single value, treat it as an array with one element
            else if (param.value !== undefined) {
                // Handle objects by JSON.stringify()
                paramStr.push(`${name}=ParamDefinition(ParamLiteral(${typeof param.value === 'string' ? `"${param.value}"` : param.value}))`);
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
    
    // const plotMarks = [];
    
    // //Handle plot marks
    // if (plot.children) {
    //   for (const mark of plot.children) {
    //     console.log("Generating plot mark CODE for:", mark);
    //     plotMarks.push(generatePlotMarkCode(mark));
    //   }
    // }

    // Handle plot attributes
    const capitalizedPlotName = plot.name
    ? plot.name.charAt(0).toUpperCase() + plot.name.slice(1)
    : "";
  const attributes = [];
  let componentString = ""; // this will hold the inner component structure

  if (plot.type === "input") {
    for (const [key, value] of Object.entries(plot)) {
      if (key === "plot") continue;

      if (key === "name") {
        attributes.push(`input="${value}"`);
      }

      if (key === "options") {
        for (const [optKey, optValue] of Object.entries(value)) {
          if (optKey === "options") {
            for (const [optKey2, optValue2] of Object.entries(optValue)) {
              if (optKey2 === "as") {
                attributes.push(`as_=${JSON.stringify(optValue2)}`);
              } else {
                attributes.push(`${optKey2}=${JSON.stringify(optValue2)}`);
              }
            }
          }
        }
      }
    }
    componentString = `${capitalizedPlotName}(\n${attributes.map(line => "    " + line).join(",\n")}\n)`;
  } else if (plot.type === "mark") {
    const plotMark = generatePlotMarkCode(plot, capitalizedPlotName);
    attributes.push(plotMark);
    componentString = `\n${attributes.map(line => "    " + line).join(",\n")}\n`;
  } else {
    for (const [key, value] of Object.entries(plot)) {
      if (key === "name") {
        attributes.push(`name="${value}"`);
      } else if (key !== "children" && key !== "type") {
        const componentType = plot.type
          ? plot.type.charAt(0).toUpperCase() + plot.type.slice(1)
          : "";
        attributes.push(`${componentType}(${plot.type}=${JSON.stringify(value)})`);
      }
    }
    componentString = `\n${attributes.map(line => "    " + line).join(",\n")}\n`;
    }

    return `Component(${componentString})`;
  };

  const generatePlotMarkCode = (plot, capitalizedPlotName) => {
    console.log("Generating plot mark code for:", plot);
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
    
      
    return `PlotMark(${capitalizedPlotName}(${attributes.join(", ")})`;
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

  const generateRootCode = (root) => {
    if (root.type === 'vconcat') {
      return `"vconcat": ${generateVConcatCode(root)}`;
    } else if (root.type === 'hconcat') {
      return `"hconcat": ${generateHConcatCode(root)}`;
    }
    else {
      return `"plot": ${generateHConcatCode(root)}`;
    }
     
  };
  
  // In your main code
  const generatedCode = `${ast.root ? generateRootCode(ast.root) : ''}`;
  
  const specCode = `Spec({
    ${ast.meta ? `"meta": Meta(\n    ${generateMetaCode(ast.meta)}\n),` : ''}
    ${ast.data && Object.keys(ast.data).length ? `"data": Data(\n    ${generateDataCode(ast.data)}\n),` : ''}
    ${ast.params && Object.keys(ast.params).length ? `"params": Params(\n    ${generateParamsCode(ast.params)}\n),` : ''}
    ${ast.root ? generateRootCode(ast.root) : ''};
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

