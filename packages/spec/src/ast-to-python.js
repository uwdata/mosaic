// import { SpecNode } from "./ast/SpecNode.js";

// /**
//  * Generate Python code for a Mosaic spec AST.
//  * @param {SpecNode} ast Mosaic AST root node.
//  * @param {object} [options] Code generation options.
//  * @returns {string} Generated Python code using the mosaic-spec classes.
//  */
// export function astToPython(ast, options = {}) {
//   const ctx = new PythonCodegenContext(options);
//   const { root, data, params } = ast; 

//   const formatChannel = (value) => {
//     if (typeof value === "string" && value.startsWith("$")) return value;
//     if (typeof value === "string") return `ChannelValueSpec(ChannelValue("${value}"))`;
//     if (typeof value === "number") return value.toString();
//     if (!value || typeof value !== "object") return "None";

//     if (value.dateMonthDay) return `ChannelValueSpec(ChannelValue(dateMonthDay="${value.dateMonthDay}"))`;
//     if (value.count !== undefined) return `ChannelValueSpec(ChannelValue(count="${value.count}"))`;
//     if (value.avg) return `ChannelValueSpec(ChannelValue(avg="${value.avg}"))`;
//     if (value.sql) return `ChannelValueSpec(ChannelValue(sql="${value.sql}"))`;
//     if (value.format) return `{"format": ${JSON.stringify(value.format)}}`;

//     return `ChannelValueSpec(ChannelValue(${JSON.stringify(value)}))`;
//   };

//   const generateParamsCode = (params) => {
//     let paramStr = [];
//     for (const [name, param] of Object.entries(params || {})) {
//       if (param.type === "selection") {
//         paramStr.push(`${name}=ParamDefinition(Selection("${param.select}"))`);
//       } else if (param.type === "param") {
//         if (Array.isArray(param.value)) {
//           const valueStrs = param.value.map(val => {
//             // If val is an object, extract a useful property or stringify it
//             if (typeof val === "object") {
//               // You can customize the logic here to extract properties you need
//               return `ParamLiteral("${JSON.stringify(val)}")`;
//             }
//             return `ParamLiteral("${val}")`;
//           });
//           paramStr.push(`${name}=ParamDefinition(ParamValue([${valueStrs.join(", ")}]))`);
//         } else if (param.value !== undefined) {
//           // If param.value is an object, handle it properly
//           if (typeof param.value === "object") {
//             paramStr.push(`${name}=ParamDefinition(ParamValue([ParamLiteral("${JSON.stringify(param.value)}")]))`);
//           } else {
//             paramStr.push(`${name}=ParamDefinition(ParamValue([ParamLiteral("${param.value}")]))`);
//           }
//         } else {
//           console.warn(`Invalid value for param "${name}"`);
//         }
//       }
//     }
//     return paramStr.join(",\n");
//   };
  

//   const generatePlotCode = (plot) => {
//     const plotArray = Array.isArray(plot) ? plot : [plot];
//     const plotMarks = plotArray.map((mark) => generateMarkCode(mark)).join(",\n");
//     return `Plot(\n  plot=[\n${plotMarks}\n  ],\n  width=800\n)`;
//   };

//   const generateMarkCode = (mark) => {
//     if (!mark?.mark) {
//       console.warn("Invalid mark:", mark);
//       return "PlotMark()";
//     }

//     const props = [];
    
//     const markType = mark?.mark;
//     if (!markType || typeof markType !== "string") {
//       console.warn("Invalid or missing mark type:", mark);
//       return "PlotMark()";
//     }
//     const markClass = markType.charAt(0).toUpperCase() + markType.slice(1);

//     props.push(`mark="${markType}"`);

//     if (mark.data?.from) {
//       let dataProps = [`from_="${mark.data.from}"`];
//       if (mark.data.filterBy) dataProps.push(`filterBy="${mark.data.filterBy}"`);
//       props.push(`data=PlotFrom(${dataProps.join(", ")})`);
//     }

//     if (mark.x) props.push(`x=${formatChannel(mark.x)}`);
//     if (mark.y) props.push(`y=${formatChannel(mark.y)}`);
//     if (mark.fill) props.push(`fill=${formatChannel(mark.fill)}`);
//     if (mark.r) props.push(`r=${formatChannel(mark.r)}`);

//     return `PlotMark(${markClass}(${props.join(", ")}))`;
//   };

//   const generateVConcatCode = (node) => {
//     return `VConcat([${node.children.map(child => generateHConcatCode(child)).join(", ")}])`;
//   };

//   const generateHConcatCode = (node) => {
//     if (!Array.isArray(node.children)) {
//       console.warn("Invalid or missing 'children' in node:", node);
//       return "HConcat([])";
//     }
//     return `HConcat([${node.children.map(child => generatePlotCode(child)).join(", ")}])`;
//   };

//   const specCode = `
// Spec({
//   "params":Params(
//     ${generateParamsCode(ast.params)}
// }),
//   vconcat=${generateVConcatCode(ast.root)}
// )`;

//   const imports = ctx.getImports();

//   return `${imports}\n${specCode}`;
// }

// class PythonCodegenContext {
//   constructor(options = {}) {
//     this.depth = 0;
//     this.options = options;
//     this.imports = [];
//   }

//   indent() {
//     this.depth += 1;
//   }

//   undent() {
//     this.depth -= 1;
//   }

//   tab() {
//     return "    ".repeat(this.depth);
//   }

//   getImports() {
//     if (this.imports.length === 0) {
//       return ''; 
//     }
//     return this.imports.join("\n");
//   }

//   addImport(pkg) {
//     this.imports.push(pkg);
//   }
// }

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
  if (ast.meta && ast.meta.title === "Seattle Weather") {
    console.log("HERE", ast);
  }
  
  
  //'root' is everything except data, params and meta in the ast
  //console.log(`root: ${JSON.stringify(root, null, 2)}\n\n`);
  //console.log(`data: ${JSON.stringify(data, null, 2)}\n\n`);
  //console.log(`params: ${JSON.stringify(params, null, 2)}\n\n`);

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


   const generatePlotMarkCode = (mark) => {
    if (!mark?.mark) {
      console.warn("Invalid mark:", mark);
      return "PlotMark()";
    }

    const props = [];
    const markType = mark.mark;
    const markClass = markType.charAt(0).toUpperCase() + markType.slice(1);
    props.push(`mark="${markType}"`);

    // Handle data properties and channels
    if (mark.data?.from) {
      let dataProps = [`from_="${mark.data.from}"`];
      if (mark.data.filterBy) dataProps.push(`filterBy="${mark.data.filterBy}"`);
      props.push(`data=PlotFrom(${dataProps.join(", ")})`);
    }

    // Adding other mark properties
    if (mark.x) props.push(`x=${formatChannel(mark.x)}`);
    if (mark.y) props.push(`y=${formatChannel(mark.y)}`);
    if (mark.fill) props.push(`fill=${formatChannel(mark.fill)}`);
    if (mark.r) props.push(`r=${formatChannel(mark.r)}`);
    if (mark.opacity) props.push(`opacity=${formatChannel(mark.opacity)}`);
    
    return `PlotMark(${markClass}(${props.join(", ")}))`;
  };

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
        return "Component(Plot(plot=[]))";
    }
  
    // Ensure the plot is treated as an array
    const plotArray = Array.isArray(plot.plot) ? plot.plot : [plot];
  
    const plotMarks = plotArray.map((mark) => {
        if (mark.type === "interactor") {
            return generatePlotInteractorCode(mark);
        }
        return generatePlotMarkCode(mark);
    }).join(",\n");
  
    // Dynamically extract all plot attributes except "plot"
    const plotAttributes = Object.entries(plot)
        .filter(([key]) => key !== "plot") // Exclude 'plot' since it's explicitly handled
        .map(([key, value]) => {
            if (typeof value === "string") return `${key}="${value}"`;
            if (Array.isArray(value)) return `${key}=${JSON.stringify(value)}`;
            return `${key}=${value}`;
        })
        .join(",\n  ");
  
        return `Component(Plot(
      plot=[
    ${plotMarks}
      ]${plotAttributes ? ",\n  " + plotAttributes : ""}
    ))`;
    };


    const generatePlotInteractorCode = (mark) => {
      if (mark && mark.type === "interactor") {
        let interactorString = `PlotInteractor(${capitalizeFirstLetter(mark.name)}(`; // Use name as method and capitalize it
    
        // If 'options' exists, handle it dynamically
        if (mark.options) {
          const options = mark.options;
    
          // Map over the options and generate the string for each key-value pair
          const optionsString = Object.entries(options)
            .map(([key, value]) => {
              // If the value starts with "$", treat it as a reference (e.g., ParamRef)
              if (typeof value === 'string' && value.startsWith("$")) {
                return `${key}=ParamRef("${value}")`;
              } else {
                // Otherwise, just use the value as is (it will be treated as a string)
                return `${key}="${value}"`;
              }
            })
            .join(",\n    ");
    
          interactorString += optionsString + "\n";
        }
    
        interactorString += "))";
        return interactorString;
      } else {
        console.error("Invalid mark or missing properties:", mark);
        return ""; // Return an empty string or handle the error as needed
      }
    };
    
    // Utility function to capitalize method name
    const capitalizeFirstLetter = (string) => {
      return string.charAt(0).toUpperCase() + string.slice(1);
    };
    
    
    
  
  
  const specCode = `
Spec({
  "params": Params(
    ${generateParamsCode(ast.params)}
),
  "vconcat": ${generateVConcatCode(ast.root)}
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

