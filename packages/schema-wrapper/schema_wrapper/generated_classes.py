from typing import List, Dict, Any, Union
from schema_wrapper.SchemaBase import SchemaBase
from schema_wrapper.utils import revert_validation

class AggregateExpression(SchemaBase):
    def __init__(self, agg: str, label: str = ...):
        self.agg = agg
        self.label = label


class AggregateTransform(SchemaBase):
    def __init__(self, value: Union["Quantile", "Product", "Argmax", "Last", "Variance", "Sum", "Median", "Mode", "VarPop", "First", "Avg", "Max", "Min", "Stddev", "StddevPop", "Argmin", "Count"]):
        self.value = value


class ChannelValue(SchemaBase):
    def __init__(self, value: Union["Transform", str, "AggregateExpression", "SQLExpression", float, bool, List[Any], Any]):
        self.value = value


class PlotMarkData(SchemaBase):
    def __init__(self, value: Union["PlotFrom", "PlotDataInline"]):
        self.value = value


class ChannelValueSpec(SchemaBase):
    def __init__(self, value: Union[Dict[str, Any], "ChannelValue"]):
        self.value = value


class SelectFilter(SchemaBase):
    enum_options = ['first', 'last', 'maxX', 'maxY', 'minX', 'minY', 'nearest', 'nearestX', 'nearestY']

    def __init__(self, value: str):
        if value not in self.enum_options:
            raise ValueError(f"Value of enum not in allowed values: {self.enum_options}")
        self.value = value


class Argmax(SchemaBase):
    def __init__(self, argmax: List[Union[float, bool, str]], distinct: bool = ..., orderby: Union[List["TransformField"], "TransformField"] = ..., partitionby: Union[List["TransformField"], "TransformField"] = ..., range: Union["ParamRef", List[Union[float, Any]]] = ..., rows: Union["ParamRef", List[Union[float, Any]]] = ...):
        self.argmax = argmax
        self.distinct = distinct
        self.orderby = orderby
        self.partitionby = partitionby
        self.range = range
        self.rows = rows


class Argmin(SchemaBase):
    def __init__(self, argmin: List[Union[float, bool, str]], distinct: bool = ..., orderby: Union[List["TransformField"], "TransformField"] = ..., partitionby: Union[List["TransformField"], "TransformField"] = ..., range: Union["ParamRef", List[Union[float, Any]]] = ..., rows: Union["ParamRef", List[Union[float, Any]]] = ...):
        self.argmin = argmin
        self.distinct = distinct
        self.orderby = orderby
        self.partitionby = partitionby
        self.range = range
        self.rows = rows


class Avg(SchemaBase):
    def __init__(self, avg: Union[Union[float, bool, str], List[Union[float, bool, str]]], distinct: bool = ..., orderby: Union[List["TransformField"], "TransformField"] = ..., partitionby: Union[List["TransformField"], "TransformField"] = ..., range: Union["ParamRef", List[Union[float, Any]]] = ..., rows: Union["ParamRef", List[Union[float, Any]]] = ...):
        self.avg = avg
        self.distinct = distinct
        self.orderby = orderby
        self.partitionby = partitionby
        self.range = range
        self.rows = rows


class ChannelValueIntervalSpec(SchemaBase):
    def __init__(self, value: Union[Dict[str, Any], "ChannelValueSpec"]):
        self.value = value


class BinInterval(SchemaBase):
    enum_options = ['date', 'number', 'millisecond', 'second', 'minute', 'hour', 'day', 'month', 'year']

    def __init__(self, value: str):
        if value not in self.enum_options:
            raise ValueError(f"Value of enum not in allowed values: {self.enum_options}")
        self.value = value


class BrushStyles(SchemaBase):
    def __init__(self, fill: str = ..., fillOpacity: float = ..., opacity: float = ..., stroke: str = ..., strokeOpacity: float = ...):
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.opacity = opacity
        self.stroke = stroke
        self.strokeOpacity = strokeOpacity


class CSSStyles(SchemaBase):
    def __init__(self, accentColor: str = ..., alignContent: str = ..., alignItems: str = ..., alignSelf: str = ..., alignmentBaseline: str = ..., all: str = ..., animation: str = ..., animationComposition: str = ..., animationDelay: str = ..., animationDirection: str = ..., animationDuration: str = ..., animationFillMode: str = ..., animationIterationCount: str = ..., animationName: str = ..., animationPlayState: str = ..., animationTimingFunction: str = ..., appearance: str = ..., aspectRatio: str = ..., backdropFilter: str = ..., backfaceVisibility: str = ..., background: str = ..., backgroundAttachment: str = ..., backgroundBlendMode: str = ..., backgroundClip: str = ..., backgroundColor: str = ..., backgroundImage: str = ..., backgroundOrigin: str = ..., backgroundPosition: str = ..., backgroundPositionX: str = ..., backgroundPositionY: str = ..., backgroundRepeat: str = ..., backgroundSize: str = ..., baselineShift: str = ..., baselineSource: str = ..., blockSize: str = ..., border: str = ..., borderBlock: str = ..., borderBlockColor: str = ..., borderBlockEnd: str = ..., borderBlockEndColor: str = ..., borderBlockEndStyle: str = ..., borderBlockEndWidth: str = ..., borderBlockStart: str = ..., borderBlockStartColor: str = ..., borderBlockStartStyle: str = ..., borderBlockStartWidth: str = ..., borderBlockStyle: str = ..., borderBlockWidth: str = ..., borderBottom: str = ..., borderBottomColor: str = ..., borderBottomLeftRadius: str = ..., borderBottomRightRadius: str = ..., borderBottomStyle: str = ..., borderBottomWidth: str = ..., borderCollapse: str = ..., borderColor: str = ..., borderEndEndRadius: str = ..., borderEndStartRadius: str = ..., borderImage: str = ..., borderImageOutset: str = ..., borderImageRepeat: str = ..., borderImageSlice: str = ..., borderImageSource: str = ..., borderImageWidth: str = ..., borderInline: str = ..., borderInlineColor: str = ..., borderInlineEnd: str = ..., borderInlineEndColor: str = ..., borderInlineEndStyle: str = ..., borderInlineEndWidth: str = ..., borderInlineStart: str = ..., borderInlineStartColor: str = ..., borderInlineStartStyle: str = ..., borderInlineStartWidth: str = ..., borderInlineStyle: str = ..., borderInlineWidth: str = ..., borderLeft: str = ..., borderLeftColor: str = ..., borderLeftStyle: str = ..., borderLeftWidth: str = ..., borderRadius: str = ..., borderRight: str = ..., borderRightColor: str = ..., borderRightStyle: str = ..., borderRightWidth: str = ..., borderSpacing: str = ..., borderStartEndRadius: str = ..., borderStartStartRadius: str = ..., borderStyle: str = ..., borderTop: str = ..., borderTopColor: str = ..., borderTopLeftRadius: str = ..., borderTopRightRadius: str = ..., borderTopStyle: str = ..., borderTopWidth: str = ..., borderWidth: str = ..., bottom: str = ..., boxShadow: str = ..., boxSizing: str = ..., breakAfter: str = ..., breakBefore: str = ..., breakInside: str = ..., captionSide: str = ..., caretColor: str = ..., clear: str = ..., clip: str = ..., clipPath: str = ..., clipRule: str = ..., color: str = ..., colorInterpolation: str = ..., colorInterpolationFilters: str = ..., colorScheme: str = ..., columnCount: str = ..., columnFill: str = ..., columnGap: str = ..., columnRule: str = ..., columnRuleColor: str = ..., columnRuleStyle: str = ..., columnRuleWidth: str = ..., columnSpan: str = ..., columnWidth: str = ..., columns: str = ..., contain: str = ..., containIntrinsicBlockSize: str = ..., containIntrinsicHeight: str = ..., containIntrinsicInlineSize: str = ..., containIntrinsicSize: str = ..., containIntrinsicWidth: str = ..., container: str = ..., containerName: str = ..., containerType: str = ..., content: str = ..., contentVisibility: str = ..., counterIncrement: str = ..., counterReset: str = ..., counterSet: str = ..., cssFloat: str = ..., cssText: str = ..., cursor: str = ..., cx: str = ..., cy: str = ..., d: str = ..., direction: str = ..., display: str = ..., dominantBaseline: str = ..., emptyCells: str = ..., fill: str = ..., fillOpacity: str = ..., fillRule: str = ..., filter: str = ..., flex: str = ..., flexBasis: str = ..., flexDirection: str = ..., flexFlow: str = ..., flexGrow: str = ..., flexShrink: str = ..., flexWrap: str = ..., float: str = ..., floodColor: str = ..., floodOpacity: str = ..., font: str = ..., fontFamily: str = ..., fontFeatureSettings: str = ..., fontKerning: str = ..., fontOpticalSizing: str = ..., fontPalette: str = ..., fontSize: str = ..., fontSizeAdjust: str = ..., fontStretch: str = ..., fontStyle: str = ..., fontSynthesis: str = ..., fontSynthesisSmallCaps: str = ..., fontSynthesisStyle: str = ..., fontSynthesisWeight: str = ..., fontVariant: str = ..., fontVariantAlternates: str = ..., fontVariantCaps: str = ..., fontVariantEastAsian: str = ..., fontVariantLigatures: str = ..., fontVariantNumeric: str = ..., fontVariantPosition: str = ..., fontVariationSettings: str = ..., fontWeight: str = ..., forcedColorAdjust: str = ..., gap: str = ..., grid: str = ..., gridArea: str = ..., gridAutoColumns: str = ..., gridAutoFlow: str = ..., gridAutoRows: str = ..., gridColumn: str = ..., gridColumnEnd: str = ..., gridColumnGap: str = ..., gridColumnStart: str = ..., gridGap: str = ..., gridRow: str = ..., gridRowEnd: str = ..., gridRowGap: str = ..., gridRowStart: str = ..., gridTemplate: str = ..., gridTemplateAreas: str = ..., gridTemplateColumns: str = ..., gridTemplateRows: str = ..., height: str = ..., hyphenateCharacter: str = ..., hyphens: str = ..., imageOrientation: str = ..., imageRendering: str = ..., inlineSize: str = ..., inset: str = ..., insetBlock: str = ..., insetBlockEnd: str = ..., insetBlockStart: str = ..., insetInline: str = ..., insetInlineEnd: str = ..., insetInlineStart: str = ..., isolation: str = ..., justifyContent: str = ..., justifyItems: str = ..., justifySelf: str = ..., left: str = ..., length: float = ..., letterSpacing: str = ..., lightingColor: str = ..., lineBreak: str = ..., lineHeight: str = ..., listStyle: str = ..., listStyleImage: str = ..., listStylePosition: str = ..., listStyleType: str = ..., margin: str = ..., marginBlock: str = ..., marginBlockEnd: str = ..., marginBlockStart: str = ..., marginBottom: str = ..., marginInline: str = ..., marginInlineEnd: str = ..., marginInlineStart: str = ..., marginLeft: str = ..., marginRight: str = ..., marginTop: str = ..., marker: str = ..., markerEnd: str = ..., markerMid: str = ..., markerStart: str = ..., mask: str = ..., maskClip: str = ..., maskComposite: str = ..., maskImage: str = ..., maskMode: str = ..., maskOrigin: str = ..., maskPosition: str = ..., maskRepeat: str = ..., maskSize: str = ..., maskType: str = ..., mathDepth: str = ..., mathStyle: str = ..., maxBlockSize: str = ..., maxHeight: str = ..., maxInlineSize: str = ..., maxWidth: str = ..., minBlockSize: str = ..., minHeight: str = ..., minInlineSize: str = ..., minWidth: str = ..., mixBlendMode: str = ..., objectFit: str = ..., objectPosition: str = ..., offset: str = ..., offsetAnchor: str = ..., offsetDistance: str = ..., offsetPath: str = ..., offsetPosition: str = ..., offsetRotate: str = ..., opacity: str = ..., order: str = ..., orphans: str = ..., outline: str = ..., outlineColor: str = ..., outlineOffset: str = ..., outlineStyle: str = ..., outlineWidth: str = ..., overflow: str = ..., overflowAnchor: str = ..., overflowClipMargin: str = ..., overflowWrap: str = ..., overflowX: str = ..., overflowY: str = ..., overscrollBehavior: str = ..., overscrollBehaviorBlock: str = ..., overscrollBehaviorInline: str = ..., overscrollBehaviorX: str = ..., overscrollBehaviorY: str = ..., padding: str = ..., paddingBlock: str = ..., paddingBlockEnd: str = ..., paddingBlockStart: str = ..., paddingBottom: str = ..., paddingInline: str = ..., paddingInlineEnd: str = ..., paddingInlineStart: str = ..., paddingLeft: str = ..., paddingRight: str = ..., paddingTop: str = ..., page: str = ..., pageBreakAfter: str = ..., pageBreakBefore: str = ..., pageBreakInside: str = ..., paintOrder: str = ..., perspective: str = ..., perspectiveOrigin: str = ..., placeContent: str = ..., placeItems: str = ..., placeSelf: str = ..., pointerEvents: str = ..., position: str = ..., printColorAdjust: str = ..., quotes: str = ..., r: str = ..., resize: str = ..., right: str = ..., rotate: str = ..., rowGap: str = ..., rubyPosition: str = ..., rx: str = ..., ry: str = ..., scale: str = ..., scrollBehavior: str = ..., scrollMargin: str = ..., scrollMarginBlock: str = ..., scrollMarginBlockEnd: str = ..., scrollMarginBlockStart: str = ..., scrollMarginBottom: str = ..., scrollMarginInline: str = ..., scrollMarginInlineEnd: str = ..., scrollMarginInlineStart: str = ..., scrollMarginLeft: str = ..., scrollMarginRight: str = ..., scrollMarginTop: str = ..., scrollPadding: str = ..., scrollPaddingBlock: str = ..., scrollPaddingBlockEnd: str = ..., scrollPaddingBlockStart: str = ..., scrollPaddingBottom: str = ..., scrollPaddingInline: str = ..., scrollPaddingInlineEnd: str = ..., scrollPaddingInlineStart: str = ..., scrollPaddingLeft: str = ..., scrollPaddingRight: str = ..., scrollPaddingTop: str = ..., scrollSnapAlign: str = ..., scrollSnapStop: str = ..., scrollSnapType: str = ..., scrollbarColor: str = ..., scrollbarGutter: str = ..., scrollbarWidth: str = ..., shapeImageThreshold: str = ..., shapeMargin: str = ..., shapeOutside: str = ..., shapeRendering: str = ..., stopColor: str = ..., stopOpacity: str = ..., stroke: str = ..., strokeDasharray: str = ..., strokeDashoffset: str = ..., strokeLinecap: str = ..., strokeLinejoin: str = ..., strokeMiterlimit: str = ..., strokeOpacity: str = ..., strokeWidth: str = ..., tabSize: str = ..., tableLayout: str = ..., textAlign: str = ..., textAlignLast: str = ..., textAnchor: str = ..., textCombineUpright: str = ..., textDecoration: str = ..., textDecorationColor: str = ..., textDecorationLine: str = ..., textDecorationSkipInk: str = ..., textDecorationStyle: str = ..., textDecorationThickness: str = ..., textEmphasis: str = ..., textEmphasisColor: str = ..., textEmphasisPosition: str = ..., textEmphasisStyle: str = ..., textIndent: str = ..., textOrientation: str = ..., textOverflow: str = ..., textRendering: str = ..., textShadow: str = ..., textTransform: str = ..., textUnderlineOffset: str = ..., textUnderlinePosition: str = ..., textWrap: str = ..., textWrapMode: str = ..., textWrapStyle: str = ..., top: str = ..., touchAction: str = ..., transform: str = ..., transformBox: str = ..., transformOrigin: str = ..., transformStyle: str = ..., transition: str = ..., transitionBehavior: str = ..., transitionDelay: str = ..., transitionDuration: str = ..., transitionProperty: str = ..., transitionTimingFunction: str = ..., translate: str = ..., unicodeBidi: str = ..., userSelect: str = ..., vectorEffect: str = ..., verticalAlign: str = ..., visibility: str = ..., webkitAlignContent: str = ..., webkitAlignItems: str = ..., webkitAlignSelf: str = ..., webkitAnimation: str = ..., webkitAnimationDelay: str = ..., webkitAnimationDirection: str = ..., webkitAnimationDuration: str = ..., webkitAnimationFillMode: str = ..., webkitAnimationIterationCount: str = ..., webkitAnimationName: str = ..., webkitAnimationPlayState: str = ..., webkitAnimationTimingFunction: str = ..., webkitAppearance: str = ..., webkitBackfaceVisibility: str = ..., webkitBackgroundClip: str = ..., webkitBackgroundOrigin: str = ..., webkitBackgroundSize: str = ..., webkitBorderBottomLeftRadius: str = ..., webkitBorderBottomRightRadius: str = ..., webkitBorderRadius: str = ..., webkitBorderTopLeftRadius: str = ..., webkitBorderTopRightRadius: str = ..., webkitBoxAlign: str = ..., webkitBoxFlex: str = ..., webkitBoxOrdinalGroup: str = ..., webkitBoxOrient: str = ..., webkitBoxPack: str = ..., webkitBoxShadow: str = ..., webkitBoxSizing: str = ..., webkitFilter: str = ..., webkitFlex: str = ..., webkitFlexBasis: str = ..., webkitFlexDirection: str = ..., webkitFlexFlow: str = ..., webkitFlexGrow: str = ..., webkitFlexShrink: str = ..., webkitFlexWrap: str = ..., webkitJustifyContent: str = ..., webkitLineClamp: str = ..., webkitMask: str = ..., webkitMaskBoxImage: str = ..., webkitMaskBoxImageOutset: str = ..., webkitMaskBoxImageRepeat: str = ..., webkitMaskBoxImageSlice: str = ..., webkitMaskBoxImageSource: str = ..., webkitMaskBoxImageWidth: str = ..., webkitMaskClip: str = ..., webkitMaskComposite: str = ..., webkitMaskImage: str = ..., webkitMaskOrigin: str = ..., webkitMaskPosition: str = ..., webkitMaskRepeat: str = ..., webkitMaskSize: str = ..., webkitOrder: str = ..., webkitPerspective: str = ..., webkitPerspectiveOrigin: str = ..., webkitTextFillColor: str = ..., webkitTextSizeAdjust: str = ..., webkitTextStroke: str = ..., webkitTextStrokeColor: str = ..., webkitTextStrokeWidth: str = ..., webkitTransform: str = ..., webkitTransformOrigin: str = ..., webkitTransformStyle: str = ..., webkitTransition: str = ..., webkitTransitionDelay: str = ..., webkitTransitionDuration: str = ..., webkitTransitionProperty: str = ..., webkitTransitionTimingFunction: str = ..., webkitUserSelect: str = ..., whiteSpace: str = ..., whiteSpaceCollapse: str = ..., widows: str = ..., width: str = ..., willChange: str = ..., wordBreak: str = ..., wordSpacing: str = ..., wordWrap: str = ..., writingMode: str = ..., x: str = ..., y: str = ..., zIndex: str = ..., zoom: str = ..., **kwargs):
        self.accentColor = accentColor
        self.alignContent = alignContent
        self.alignItems = alignItems
        self.alignSelf = alignSelf
        self.alignmentBaseline = alignmentBaseline
        self.all = all
        self.animation = animation
        self.animationComposition = animationComposition
        self.animationDelay = animationDelay
        self.animationDirection = animationDirection
        self.animationDuration = animationDuration
        self.animationFillMode = animationFillMode
        self.animationIterationCount = animationIterationCount
        self.animationName = animationName
        self.animationPlayState = animationPlayState
        self.animationTimingFunction = animationTimingFunction
        self.appearance = appearance
        self.aspectRatio = aspectRatio
        self.backdropFilter = backdropFilter
        self.backfaceVisibility = backfaceVisibility
        self.background = background
        self.backgroundAttachment = backgroundAttachment
        self.backgroundBlendMode = backgroundBlendMode
        self.backgroundClip = backgroundClip
        self.backgroundColor = backgroundColor
        self.backgroundImage = backgroundImage
        self.backgroundOrigin = backgroundOrigin
        self.backgroundPosition = backgroundPosition
        self.backgroundPositionX = backgroundPositionX
        self.backgroundPositionY = backgroundPositionY
        self.backgroundRepeat = backgroundRepeat
        self.backgroundSize = backgroundSize
        self.baselineShift = baselineShift
        self.baselineSource = baselineSource
        self.blockSize = blockSize
        self.border = border
        self.borderBlock = borderBlock
        self.borderBlockColor = borderBlockColor
        self.borderBlockEnd = borderBlockEnd
        self.borderBlockEndColor = borderBlockEndColor
        self.borderBlockEndStyle = borderBlockEndStyle
        self.borderBlockEndWidth = borderBlockEndWidth
        self.borderBlockStart = borderBlockStart
        self.borderBlockStartColor = borderBlockStartColor
        self.borderBlockStartStyle = borderBlockStartStyle
        self.borderBlockStartWidth = borderBlockStartWidth
        self.borderBlockStyle = borderBlockStyle
        self.borderBlockWidth = borderBlockWidth
        self.borderBottom = borderBottom
        self.borderBottomColor = borderBottomColor
        self.borderBottomLeftRadius = borderBottomLeftRadius
        self.borderBottomRightRadius = borderBottomRightRadius
        self.borderBottomStyle = borderBottomStyle
        self.borderBottomWidth = borderBottomWidth
        self.borderCollapse = borderCollapse
        self.borderColor = borderColor
        self.borderEndEndRadius = borderEndEndRadius
        self.borderEndStartRadius = borderEndStartRadius
        self.borderImage = borderImage
        self.borderImageOutset = borderImageOutset
        self.borderImageRepeat = borderImageRepeat
        self.borderImageSlice = borderImageSlice
        self.borderImageSource = borderImageSource
        self.borderImageWidth = borderImageWidth
        self.borderInline = borderInline
        self.borderInlineColor = borderInlineColor
        self.borderInlineEnd = borderInlineEnd
        self.borderInlineEndColor = borderInlineEndColor
        self.borderInlineEndStyle = borderInlineEndStyle
        self.borderInlineEndWidth = borderInlineEndWidth
        self.borderInlineStart = borderInlineStart
        self.borderInlineStartColor = borderInlineStartColor
        self.borderInlineStartStyle = borderInlineStartStyle
        self.borderInlineStartWidth = borderInlineStartWidth
        self.borderInlineStyle = borderInlineStyle
        self.borderInlineWidth = borderInlineWidth
        self.borderLeft = borderLeft
        self.borderLeftColor = borderLeftColor
        self.borderLeftStyle = borderLeftStyle
        self.borderLeftWidth = borderLeftWidth
        self.borderRadius = borderRadius
        self.borderRight = borderRight
        self.borderRightColor = borderRightColor
        self.borderRightStyle = borderRightStyle
        self.borderRightWidth = borderRightWidth
        self.borderSpacing = borderSpacing
        self.borderStartEndRadius = borderStartEndRadius
        self.borderStartStartRadius = borderStartStartRadius
        self.borderStyle = borderStyle
        self.borderTop = borderTop
        self.borderTopColor = borderTopColor
        self.borderTopLeftRadius = borderTopLeftRadius
        self.borderTopRightRadius = borderTopRightRadius
        self.borderTopStyle = borderTopStyle
        self.borderTopWidth = borderTopWidth
        self.borderWidth = borderWidth
        self.bottom = bottom
        self.boxShadow = boxShadow
        self.boxSizing = boxSizing
        self.breakAfter = breakAfter
        self.breakBefore = breakBefore
        self.breakInside = breakInside
        self.captionSide = captionSide
        self.caretColor = caretColor
        self.clear = clear
        self.clip = clip
        self.clipPath = clipPath
        self.clipRule = clipRule
        self.color = color
        self.colorInterpolation = colorInterpolation
        self.colorInterpolationFilters = colorInterpolationFilters
        self.colorScheme = colorScheme
        self.columnCount = columnCount
        self.columnFill = columnFill
        self.columnGap = columnGap
        self.columnRule = columnRule
        self.columnRuleColor = columnRuleColor
        self.columnRuleStyle = columnRuleStyle
        self.columnRuleWidth = columnRuleWidth
        self.columnSpan = columnSpan
        self.columnWidth = columnWidth
        self.columns = columns
        self.contain = contain
        self.containIntrinsicBlockSize = containIntrinsicBlockSize
        self.containIntrinsicHeight = containIntrinsicHeight
        self.containIntrinsicInlineSize = containIntrinsicInlineSize
        self.containIntrinsicSize = containIntrinsicSize
        self.containIntrinsicWidth = containIntrinsicWidth
        self.container = container
        self.containerName = containerName
        self.containerType = containerType
        self.content = content
        self.contentVisibility = contentVisibility
        self.counterIncrement = counterIncrement
        self.counterReset = counterReset
        self.counterSet = counterSet
        self.cssFloat = cssFloat
        self.cssText = cssText
        self.cursor = cursor
        self.cx = cx
        self.cy = cy
        self.d = d
        self.direction = direction
        self.display = display
        self.dominantBaseline = dominantBaseline
        self.emptyCells = emptyCells
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.fillRule = fillRule
        self.filter = filter
        self.flex = flex
        self.flexBasis = flexBasis
        self.flexDirection = flexDirection
        self.flexFlow = flexFlow
        self.flexGrow = flexGrow
        self.flexShrink = flexShrink
        self.flexWrap = flexWrap
        self.float = float
        self.floodColor = floodColor
        self.floodOpacity = floodOpacity
        self.font = font
        self.fontFamily = fontFamily
        self.fontFeatureSettings = fontFeatureSettings
        self.fontKerning = fontKerning
        self.fontOpticalSizing = fontOpticalSizing
        self.fontPalette = fontPalette
        self.fontSize = fontSize
        self.fontSizeAdjust = fontSizeAdjust
        self.fontStretch = fontStretch
        self.fontStyle = fontStyle
        self.fontSynthesis = fontSynthesis
        self.fontSynthesisSmallCaps = fontSynthesisSmallCaps
        self.fontSynthesisStyle = fontSynthesisStyle
        self.fontSynthesisWeight = fontSynthesisWeight
        self.fontVariant = fontVariant
        self.fontVariantAlternates = fontVariantAlternates
        self.fontVariantCaps = fontVariantCaps
        self.fontVariantEastAsian = fontVariantEastAsian
        self.fontVariantLigatures = fontVariantLigatures
        self.fontVariantNumeric = fontVariantNumeric
        self.fontVariantPosition = fontVariantPosition
        self.fontVariationSettings = fontVariationSettings
        self.fontWeight = fontWeight
        self.forcedColorAdjust = forcedColorAdjust
        self.gap = gap
        self.grid = grid
        self.gridArea = gridArea
        self.gridAutoColumns = gridAutoColumns
        self.gridAutoFlow = gridAutoFlow
        self.gridAutoRows = gridAutoRows
        self.gridColumn = gridColumn
        self.gridColumnEnd = gridColumnEnd
        self.gridColumnGap = gridColumnGap
        self.gridColumnStart = gridColumnStart
        self.gridGap = gridGap
        self.gridRow = gridRow
        self.gridRowEnd = gridRowEnd
        self.gridRowGap = gridRowGap
        self.gridRowStart = gridRowStart
        self.gridTemplate = gridTemplate
        self.gridTemplateAreas = gridTemplateAreas
        self.gridTemplateColumns = gridTemplateColumns
        self.gridTemplateRows = gridTemplateRows
        self.height = height
        self.hyphenateCharacter = hyphenateCharacter
        self.hyphens = hyphens
        self.imageOrientation = imageOrientation
        self.imageRendering = imageRendering
        self.inlineSize = inlineSize
        self.inset = inset
        self.insetBlock = insetBlock
        self.insetBlockEnd = insetBlockEnd
        self.insetBlockStart = insetBlockStart
        self.insetInline = insetInline
        self.insetInlineEnd = insetInlineEnd
        self.insetInlineStart = insetInlineStart
        self.isolation = isolation
        self.justifyContent = justifyContent
        self.justifyItems = justifyItems
        self.justifySelf = justifySelf
        self.left = left
        self.length = length
        self.letterSpacing = letterSpacing
        self.lightingColor = lightingColor
        self.lineBreak = lineBreak
        self.lineHeight = lineHeight
        self.listStyle = listStyle
        self.listStyleImage = listStyleImage
        self.listStylePosition = listStylePosition
        self.listStyleType = listStyleType
        self.margin = margin
        self.marginBlock = marginBlock
        self.marginBlockEnd = marginBlockEnd
        self.marginBlockStart = marginBlockStart
        self.marginBottom = marginBottom
        self.marginInline = marginInline
        self.marginInlineEnd = marginInlineEnd
        self.marginInlineStart = marginInlineStart
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.marker = marker
        self.markerEnd = markerEnd
        self.markerMid = markerMid
        self.markerStart = markerStart
        self.mask = mask
        self.maskClip = maskClip
        self.maskComposite = maskComposite
        self.maskImage = maskImage
        self.maskMode = maskMode
        self.maskOrigin = maskOrigin
        self.maskPosition = maskPosition
        self.maskRepeat = maskRepeat
        self.maskSize = maskSize
        self.maskType = maskType
        self.mathDepth = mathDepth
        self.mathStyle = mathStyle
        self.maxBlockSize = maxBlockSize
        self.maxHeight = maxHeight
        self.maxInlineSize = maxInlineSize
        self.maxWidth = maxWidth
        self.minBlockSize = minBlockSize
        self.minHeight = minHeight
        self.minInlineSize = minInlineSize
        self.minWidth = minWidth
        self.mixBlendMode = mixBlendMode
        self.objectFit = objectFit
        self.objectPosition = objectPosition
        self.offset = offset
        self.offsetAnchor = offsetAnchor
        self.offsetDistance = offsetDistance
        self.offsetPath = offsetPath
        self.offsetPosition = offsetPosition
        self.offsetRotate = offsetRotate
        self.opacity = opacity
        self.order = order
        self.orphans = orphans
        self.outline = outline
        self.outlineColor = outlineColor
        self.outlineOffset = outlineOffset
        self.outlineStyle = outlineStyle
        self.outlineWidth = outlineWidth
        self.overflow = overflow
        self.overflowAnchor = overflowAnchor
        self.overflowClipMargin = overflowClipMargin
        self.overflowWrap = overflowWrap
        self.overflowX = overflowX
        self.overflowY = overflowY
        self.overscrollBehavior = overscrollBehavior
        self.overscrollBehaviorBlock = overscrollBehaviorBlock
        self.overscrollBehaviorInline = overscrollBehaviorInline
        self.overscrollBehaviorX = overscrollBehaviorX
        self.overscrollBehaviorY = overscrollBehaviorY
        self.padding = padding
        self.paddingBlock = paddingBlock
        self.paddingBlockEnd = paddingBlockEnd
        self.paddingBlockStart = paddingBlockStart
        self.paddingBottom = paddingBottom
        self.paddingInline = paddingInline
        self.paddingInlineEnd = paddingInlineEnd
        self.paddingInlineStart = paddingInlineStart
        self.paddingLeft = paddingLeft
        self.paddingRight = paddingRight
        self.paddingTop = paddingTop
        self.page = page
        self.pageBreakAfter = pageBreakAfter
        self.pageBreakBefore = pageBreakBefore
        self.pageBreakInside = pageBreakInside
        self.paintOrder = paintOrder
        self.perspective = perspective
        self.perspectiveOrigin = perspectiveOrigin
        self.placeContent = placeContent
        self.placeItems = placeItems
        self.placeSelf = placeSelf
        self.pointerEvents = pointerEvents
        self.position = position
        self.printColorAdjust = printColorAdjust
        self.quotes = quotes
        self.r = r
        self.resize = resize
        self.right = right
        self.rotate = rotate
        self.rowGap = rowGap
        self.rubyPosition = rubyPosition
        self.rx = rx
        self.ry = ry
        self.scale = scale
        self.scrollBehavior = scrollBehavior
        self.scrollMargin = scrollMargin
        self.scrollMarginBlock = scrollMarginBlock
        self.scrollMarginBlockEnd = scrollMarginBlockEnd
        self.scrollMarginBlockStart = scrollMarginBlockStart
        self.scrollMarginBottom = scrollMarginBottom
        self.scrollMarginInline = scrollMarginInline
        self.scrollMarginInlineEnd = scrollMarginInlineEnd
        self.scrollMarginInlineStart = scrollMarginInlineStart
        self.scrollMarginLeft = scrollMarginLeft
        self.scrollMarginRight = scrollMarginRight
        self.scrollMarginTop = scrollMarginTop
        self.scrollPadding = scrollPadding
        self.scrollPaddingBlock = scrollPaddingBlock
        self.scrollPaddingBlockEnd = scrollPaddingBlockEnd
        self.scrollPaddingBlockStart = scrollPaddingBlockStart
        self.scrollPaddingBottom = scrollPaddingBottom
        self.scrollPaddingInline = scrollPaddingInline
        self.scrollPaddingInlineEnd = scrollPaddingInlineEnd
        self.scrollPaddingInlineStart = scrollPaddingInlineStart
        self.scrollPaddingLeft = scrollPaddingLeft
        self.scrollPaddingRight = scrollPaddingRight
        self.scrollPaddingTop = scrollPaddingTop
        self.scrollSnapAlign = scrollSnapAlign
        self.scrollSnapStop = scrollSnapStop
        self.scrollSnapType = scrollSnapType
        self.scrollbarColor = scrollbarColor
        self.scrollbarGutter = scrollbarGutter
        self.scrollbarWidth = scrollbarWidth
        self.shapeImageThreshold = shapeImageThreshold
        self.shapeMargin = shapeMargin
        self.shapeOutside = shapeOutside
        self.shapeRendering = shapeRendering
        self.stopColor = stopColor
        self.stopOpacity = stopOpacity
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.tabSize = tabSize
        self.tableLayout = tableLayout
        self.textAlign = textAlign
        self.textAlignLast = textAlignLast
        self.textAnchor = textAnchor
        self.textCombineUpright = textCombineUpright
        self.textDecoration = textDecoration
        self.textDecorationColor = textDecorationColor
        self.textDecorationLine = textDecorationLine
        self.textDecorationSkipInk = textDecorationSkipInk
        self.textDecorationStyle = textDecorationStyle
        self.textDecorationThickness = textDecorationThickness
        self.textEmphasis = textEmphasis
        self.textEmphasisColor = textEmphasisColor
        self.textEmphasisPosition = textEmphasisPosition
        self.textEmphasisStyle = textEmphasisStyle
        self.textIndent = textIndent
        self.textOrientation = textOrientation
        self.textOverflow = textOverflow
        self.textRendering = textRendering
        self.textShadow = textShadow
        self.textTransform = textTransform
        self.textUnderlineOffset = textUnderlineOffset
        self.textUnderlinePosition = textUnderlinePosition
        self.textWrap = textWrap
        self.textWrapMode = textWrapMode
        self.textWrapStyle = textWrapStyle
        self.top = top
        self.touchAction = touchAction
        self.transform = transform
        self.transformBox = transformBox
        self.transformOrigin = transformOrigin
        self.transformStyle = transformStyle
        self.transition = transition
        self.transitionBehavior = transitionBehavior
        self.transitionDelay = transitionDelay
        self.transitionDuration = transitionDuration
        self.transitionProperty = transitionProperty
        self.transitionTimingFunction = transitionTimingFunction
        self.translate = translate
        self.unicodeBidi = unicodeBidi
        self.userSelect = userSelect
        self.vectorEffect = vectorEffect
        self.verticalAlign = verticalAlign
        self.visibility = visibility
        self.webkitAlignContent = webkitAlignContent
        self.webkitAlignItems = webkitAlignItems
        self.webkitAlignSelf = webkitAlignSelf
        self.webkitAnimation = webkitAnimation
        self.webkitAnimationDelay = webkitAnimationDelay
        self.webkitAnimationDirection = webkitAnimationDirection
        self.webkitAnimationDuration = webkitAnimationDuration
        self.webkitAnimationFillMode = webkitAnimationFillMode
        self.webkitAnimationIterationCount = webkitAnimationIterationCount
        self.webkitAnimationName = webkitAnimationName
        self.webkitAnimationPlayState = webkitAnimationPlayState
        self.webkitAnimationTimingFunction = webkitAnimationTimingFunction
        self.webkitAppearance = webkitAppearance
        self.webkitBackfaceVisibility = webkitBackfaceVisibility
        self.webkitBackgroundClip = webkitBackgroundClip
        self.webkitBackgroundOrigin = webkitBackgroundOrigin
        self.webkitBackgroundSize = webkitBackgroundSize
        self.webkitBorderBottomLeftRadius = webkitBorderBottomLeftRadius
        self.webkitBorderBottomRightRadius = webkitBorderBottomRightRadius
        self.webkitBorderRadius = webkitBorderRadius
        self.webkitBorderTopLeftRadius = webkitBorderTopLeftRadius
        self.webkitBorderTopRightRadius = webkitBorderTopRightRadius
        self.webkitBoxAlign = webkitBoxAlign
        self.webkitBoxFlex = webkitBoxFlex
        self.webkitBoxOrdinalGroup = webkitBoxOrdinalGroup
        self.webkitBoxOrient = webkitBoxOrient
        self.webkitBoxPack = webkitBoxPack
        self.webkitBoxShadow = webkitBoxShadow
        self.webkitBoxSizing = webkitBoxSizing
        self.webkitFilter = webkitFilter
        self.webkitFlex = webkitFlex
        self.webkitFlexBasis = webkitFlexBasis
        self.webkitFlexDirection = webkitFlexDirection
        self.webkitFlexFlow = webkitFlexFlow
        self.webkitFlexGrow = webkitFlexGrow
        self.webkitFlexShrink = webkitFlexShrink
        self.webkitFlexWrap = webkitFlexWrap
        self.webkitJustifyContent = webkitJustifyContent
        self.webkitLineClamp = webkitLineClamp
        self.webkitMask = webkitMask
        self.webkitMaskBoxImage = webkitMaskBoxImage
        self.webkitMaskBoxImageOutset = webkitMaskBoxImageOutset
        self.webkitMaskBoxImageRepeat = webkitMaskBoxImageRepeat
        self.webkitMaskBoxImageSlice = webkitMaskBoxImageSlice
        self.webkitMaskBoxImageSource = webkitMaskBoxImageSource
        self.webkitMaskBoxImageWidth = webkitMaskBoxImageWidth
        self.webkitMaskClip = webkitMaskClip
        self.webkitMaskComposite = webkitMaskComposite
        self.webkitMaskImage = webkitMaskImage
        self.webkitMaskOrigin = webkitMaskOrigin
        self.webkitMaskPosition = webkitMaskPosition
        self.webkitMaskRepeat = webkitMaskRepeat
        self.webkitMaskSize = webkitMaskSize
        self.webkitOrder = webkitOrder
        self.webkitPerspective = webkitPerspective
        self.webkitPerspectiveOrigin = webkitPerspectiveOrigin
        self.webkitTextFillColor = webkitTextFillColor
        self.webkitTextSizeAdjust = webkitTextSizeAdjust
        self.webkitTextStroke = webkitTextStroke
        self.webkitTextStrokeColor = webkitTextStrokeColor
        self.webkitTextStrokeWidth = webkitTextStrokeWidth
        self.webkitTransform = webkitTransform
        self.webkitTransformOrigin = webkitTransformOrigin
        self.webkitTransformStyle = webkitTransformStyle
        self.webkitTransition = webkitTransition
        self.webkitTransitionDelay = webkitTransitionDelay
        self.webkitTransitionDuration = webkitTransitionDuration
        self.webkitTransitionProperty = webkitTransitionProperty
        self.webkitTransitionTimingFunction = webkitTransitionTimingFunction
        self.webkitUserSelect = webkitUserSelect
        self.whiteSpace = whiteSpace
        self.whiteSpaceCollapse = whiteSpaceCollapse
        self.widows = widows
        self.width = width
        self.willChange = willChange
        self.wordBreak = wordBreak
        self.wordSpacing = wordSpacing
        self.wordWrap = wordWrap
        self.writingMode = writingMode
        self.x = x
        self.y = y
        self.zIndex = zIndex
        self.zoom = zoom
        for key, value in kwargs.items():
            if not isinstance(value, str):
                raise ValueError(f"Value for key '{key}' must be an instance of str.")
        self.additional_params = kwargs



class Centroid(SchemaBase):
    def __init__(self, centroid: Union[Union[float, bool, str], List[Union[float, bool, str]]]):
        self.centroid = centroid


class CentroidX(SchemaBase):
    def __init__(self, centroidX: Union[Union[float, bool, str], List[Union[float, bool, str]]]):
        self.centroidX = centroidX


class CentroidY(SchemaBase):
    def __init__(self, centroidY: Union[Union[float, bool, str], List[Union[float, bool, str]]]):
        self.centroidY = centroidY


class ChannelDomainValueSpec(SchemaBase):
    def __init__(self, value: Union[Dict[str, Any], "ChannelDomainValue"]):
        self.value = value


class ChannelDomainValue(SchemaBase):
    def __init__(self, value: Union[str, Union[str, "ChannelName"], Any]):
        self.value = value


class ChannelName(SchemaBase):
    enum_options = ['ariaLabel', 'fill', 'fillOpacity', 'fontSize', 'fx', 'fy', 'geometry', 'height', 'href', 'length', 'opacity', 'path', 'r', 'rotate', 'src', 'stroke', 'strokeOpacity', 'strokeWidth', 'symbol', 'text', 'title', 'weight', 'width', 'x', 'x1', 'x2', 'y', 'y1', 'y2', 'z']

    def __init__(self, value: str):
        if value not in self.enum_options:
            raise ValueError(f"Value of enum not in allowed values: {self.enum_options}")
        self.value = value


class ColorScaleType(SchemaBase):
    enum_options = ['linear', 'pow', 'sqrt', 'log', 'symlog', 'utc', 'time', 'point', 'band', 'ordinal', 'sequential', 'cyclical', 'diverging', 'diverging-log', 'diverging-pow', 'diverging-sqrt', 'diverging-symlog', 'categorical', 'threshold', 'quantile', 'quantize', 'identity']

    def __init__(self, value: str):
        if value not in self.enum_options:
            raise ValueError(f"Value of enum not in allowed values: {self.enum_options}")
        self.value = value


class ColorScheme(SchemaBase):
    def __init__(self, value: Union[Dict[str, Any], str]):
        self.value = value


class ColumnTransform(SchemaBase):
    def __init__(self, value: Union["CentroidX", "DateMonthDay", "DateMonth", "DateDay", "CentroidY", "Centroid", "Bin", "GeoJSON"]):
        self.value = value


class Component(SchemaBase):
    def __init__(self, value: Union["Plot", "Table", "Legend", "HSpace", "VSpace", "Menu", "Search", "VConcat", "HConcat", "Slider", "PlotMark"]):
        self.value = value


class Config(SchemaBase):
    def __init__(self, extensions: Union[str, List[str]] = ...):
        self.extensions = extensions


class ContinuousScaleType(SchemaBase):
    enum_options = ['linear', 'pow', 'sqrt', 'log', 'symlog', 'utc', 'time', 'identity']

    def __init__(self, value: str):
        if value not in self.enum_options:
            raise ValueError(f"Value of enum not in allowed values: {self.enum_options}")
        self.value = value


class Count(SchemaBase):
    def __init__(self, count: Union[Union[Union[float, bool, str], List[Union[float, bool, str]]], Any], distinct: bool = ..., orderby: Union[List["TransformField"], "TransformField"] = ..., partitionby: Union[List["TransformField"], "TransformField"] = ..., range: Union["ParamRef", List[Union[float, Any]]] = ..., rows: Union["ParamRef", List[Union[float, Any]]] = ...):
        self.count = count
        self.distinct = distinct
        self.orderby = orderby
        self.partitionby = partitionby
        self.range = range
        self.rows = rows


class CumeDist(SchemaBase):
    def __init__(self, cume_dist: Any, orderby: Union[List["TransformField"], "TransformField"] = ..., partitionby: Union[List["TransformField"], "TransformField"] = ..., range: Union["ParamRef", List[Union[float, Any]]] = ..., rows: Union["ParamRef", List[Union[float, Any]]] = ...):
        self.cume_dist = cume_dist
        self.orderby = orderby
        self.partitionby = partitionby
        self.range = range
        self.rows = rows


class CurveName(SchemaBase):
    enum_options = ['basis', 'basis-closed', 'basis-open', 'bundle', 'bump-x', 'bump-y', 'cardinal', 'cardinal-closed', 'cardinal-open', 'catmull-rom', 'catmull-rom-closed', 'catmull-rom-open', 'linear', 'linear-closed', 'monotone-x', 'monotone-y', 'natural', 'step', 'step-after', 'step-before']

    def __init__(self, value: str):
        if value not in self.enum_options:
            raise ValueError(f"Value of enum not in allowed values: {self.enum_options}")
        self.value = value


class DataDefinition(SchemaBase):
    def __init__(self, value: Union["DataSpatial", "DataQuery", "DataParquet", "DataJSON", "DataFile", "DataTable", "DataCSV", "DataArray", "DataJSONObjects"]):
        self.value = value


class DataArray(SchemaBase):
    def __init__(self, value: List[Dict[str, Any]]):
        self.value = value


class DataCSV(SchemaBase):
    def __init__(self, file: str, type: str, delimiter: str = ..., replace: bool = ..., sample_size: float = ..., select: List[str] = ..., temp: bool = ..., view: bool = ..., where: Union[str, List[str]] = ...):
        self.delimiter = delimiter
        self.file = file
        self.replace = replace
        self.sample_size = sample_size
        self.select = select
        self.temp = temp
        self.type = type
        self.view = view
        self.where = where


class DataFile(SchemaBase):
    def __init__(self, file: str, replace: bool = ..., select: List[str] = ..., temp: bool = ..., view: bool = ..., where: Union[str, List[str]] = ...):
        self.file = file
        self.replace = replace
        self.select = select
        self.temp = temp
        self.view = view
        self.where = where


class DataJSON(SchemaBase):
    def __init__(self, file: str, type: str, replace: bool = ..., select: List[str] = ..., temp: bool = ..., view: bool = ..., where: Union[str, List[str]] = ...):
        self.file = file
        self.replace = replace
        self.select = select
        self.temp = temp
        self.type = type
        self.view = view
        self.where = where


class DataJSONObjects(SchemaBase):
    def __init__(self, data: List[Dict[str, Any]], replace: bool = ..., select: List[str] = ..., temp: bool = ..., type: str = ..., view: bool = ..., where: Union[str, List[str]] = ...):
        self.data = data
        self.replace = replace
        self.select = select
        self.temp = temp
        self.type = type
        self.view = view
        self.where = where


class DataParquet(SchemaBase):
    def __init__(self, file: str, type: str, replace: bool = ..., select: List[str] = ..., temp: bool = ..., view: bool = ..., where: Union[str, List[str]] = ...):
        self.file = file
        self.replace = replace
        self.select = select
        self.temp = temp
        self.type = type
        self.view = view
        self.where = where


class DataQuery(SchemaBase):
    def __init__(self, value: str):
        self.value = value


class DataSpatial(SchemaBase):
    def __init__(self, file: str, type: str, layer: str = ..., replace: bool = ..., select: List[str] = ..., temp: bool = ..., view: bool = ..., where: Union[str, List[str]] = ...):
        self.file = file
        self.layer = layer
        self.replace = replace
        self.select = select
        self.temp = temp
        self.type = type
        self.view = view
        self.where = where


class DataTable(SchemaBase):
    def __init__(self, query: str, type: str, replace: bool = ..., select: List[str] = ..., temp: bool = ..., view: bool = ..., where: Union[str, List[str]] = ...):
        self.query = query
        self.replace = replace
        self.select = select
        self.temp = temp
        self.type = type
        self.view = view
        self.where = where


class DateDay(SchemaBase):
    def __init__(self, dateDay: Union[Union[float, bool, str], List[Union[float, bool, str]]]):
        self.dateDay = dateDay


class DateMonth(SchemaBase):
    def __init__(self, dateMonth: Union[Union[float, bool, str], List[Union[float, bool, str]]]):
        self.dateMonth = dateMonth


class DateMonthDay(SchemaBase):
    def __init__(self, dateMonthDay: Union[Union[float, bool, str], List[Union[float, bool, str]]]):
        self.dateMonthDay = dateMonthDay


class DenseRank(SchemaBase):
    def __init__(self, dense_rank: Any, orderby: Union[List["TransformField"], "TransformField"] = ..., partitionby: Union[List["TransformField"], "TransformField"] = ..., range: Union["ParamRef", List[Union[float, Any]]] = ..., rows: Union["ParamRef", List[Union[float, Any]]] = ...):
        self.dense_rank = dense_rank
        self.orderby = orderby
        self.partitionby = partitionby
        self.range = range
        self.rows = rows


class DensityX(SchemaBase):
    def __init__(self, value: Dict[str, Any]):
        self.value = value


class DensityY(SchemaBase):
    def __init__(self, value: Dict[str, Any]):
        self.value = value


class DiscreteScaleType(SchemaBase):
    enum_options = ['ordinal', 'identity']

    def __init__(self, value: str):
        if value not in self.enum_options:
            raise ValueError(f"Value of enum not in allowed values: {self.enum_options}")
        self.value = value


class First(SchemaBase):
    def __init__(self, first: Union[Union[float, bool, str], List[Union[float, bool, str]]], distinct: bool = ..., orderby: Union[List["TransformField"], "TransformField"] = ..., partitionby: Union[List["TransformField"], "TransformField"] = ..., range: Union["ParamRef", List[Union[float, Any]]] = ..., rows: Union["ParamRef", List[Union[float, Any]]] = ...):
        self.distinct = distinct
        self.first = first
        self.orderby = orderby
        self.partitionby = partitionby
        self.range = range
        self.rows = rows


class FirstValue(SchemaBase):
    def __init__(self, first_value: Union[Union[float, bool, str], List[Union[float, bool, str]]], orderby: Union[List["TransformField"], "TransformField"] = ..., partitionby: Union[List["TransformField"], "TransformField"] = ..., range: Union["ParamRef", List[Union[float, Any]]] = ..., rows: Union["ParamRef", List[Union[float, Any]]] = ...):
        self.first_value = first_value
        self.orderby = orderby
        self.partitionby = partitionby
        self.range = range
        self.rows = rows


class Fixed(SchemaBase):
    def __init__(self, value: str):
        self.value = value


class FrameAnchor(SchemaBase):
    enum_options = ['middle', 'top-left', 'top', 'top-right', 'right', 'bottom-right', 'bottom', 'bottom-left', 'left']

    def __init__(self, value: str):
        if value not in self.enum_options:
            raise ValueError(f"Value of enum not in allowed values: {self.enum_options}")
        self.value = value


class GeoJSON(SchemaBase):
    def __init__(self, geojson: Union[Union[float, bool, str], List[Union[float, bool, str]]]):
        self.geojson = geojson


class GridInterpolate(SchemaBase):
    enum_options = ['none', 'linear', 'nearest', 'barycentric', 'random-walk']

    def __init__(self, value: str):
        if value not in self.enum_options:
            raise ValueError(f"Value of enum not in allowed values: {self.enum_options}")
        self.value = value


class HSpace(SchemaBase):
    def __init__(self, hspace: Union[float, str]):
        self.hspace = hspace


class ParamRef(SchemaBase):
    def __init__(self, value: str):
        self.value = value


class Interpolate(SchemaBase):
    enum_options = ['number', 'rgb', 'hsl', 'hcl', 'lab']

    def __init__(self, value: str):
        if value not in self.enum_options:
            raise ValueError(f"Value of enum not in allowed values: {self.enum_options}")
        self.value = value


class LiteralTimeInterval(SchemaBase):
    def __init__(self, value: Union["TimeIntervalName", str]):
        self.value = value


class LabelArrow(SchemaBase):
    enum_options = ['auto', 'up', 'right', 'down', 'left', 'none', True, False, None]

    def __init__(self, value: Union[bool, str, Any]):
        if value not in self.enum_options:
            raise ValueError(f"Value of enum not in allowed values: {self.enum_options}")
        self.value = value


class Lag(SchemaBase):
    def __init__(self, lag: Union[Union[float, bool, str], List[Union[float, bool, str]]], orderby: Union[List["TransformField"], "TransformField"] = ..., partitionby: Union[List["TransformField"], "TransformField"] = ..., range: Union["ParamRef", List[Union[float, Any]]] = ..., rows: Union["ParamRef", List[Union[float, Any]]] = ...):
        self.lag = lag
        self.orderby = orderby
        self.partitionby = partitionby
        self.range = range
        self.rows = rows


class Last(SchemaBase):
    def __init__(self, last: Union[Union[float, bool, str], List[Union[float, bool, str]]], distinct: bool = ..., orderby: Union[List["TransformField"], "TransformField"] = ..., partitionby: Union[List["TransformField"], "TransformField"] = ..., range: Union["ParamRef", List[Union[float, Any]]] = ..., rows: Union["ParamRef", List[Union[float, Any]]] = ...):
        self.distinct = distinct
        self.last = last
        self.orderby = orderby
        self.partitionby = partitionby
        self.range = range
        self.rows = rows


class LastValue(SchemaBase):
    def __init__(self, last_value: Union[Union[float, bool, str], List[Union[float, bool, str]]], orderby: Union[List["TransformField"], "TransformField"] = ..., partitionby: Union[List["TransformField"], "TransformField"] = ..., range: Union["ParamRef", List[Union[float, Any]]] = ..., rows: Union["ParamRef", List[Union[float, Any]]] = ...):
        self.last_value = last_value
        self.orderby = orderby
        self.partitionby = partitionby
        self.range = range
        self.rows = rows


class Lead(SchemaBase):
    def __init__(self, lag: Union[Union[float, bool, str], List[Union[float, bool, str]]], orderby: Union[List["TransformField"], "TransformField"] = ..., partitionby: Union[List["TransformField"], "TransformField"] = ..., range: Union["ParamRef", List[Union[float, Any]]] = ..., rows: Union["ParamRef", List[Union[float, Any]]] = ...):
        self.lag = lag
        self.orderby = orderby
        self.partitionby = partitionby
        self.range = range
        self.rows = rows


class MarkerName(SchemaBase):
    enum_options = ['arrow', 'arrow-reverse', 'dot', 'circle', 'circle-fill', 'circle-stroke', 'tick', 'tick-x', 'tick-y']

    def __init__(self, value: str):
        if value not in self.enum_options:
            raise ValueError(f"Value of enum not in allowed values: {self.enum_options}")
        self.value = value


class Max(SchemaBase):
    def __init__(self, max: Union[Union[float, bool, str], List[Union[float, bool, str]]], distinct: bool = ..., orderby: Union[List["TransformField"], "TransformField"] = ..., partitionby: Union[List["TransformField"], "TransformField"] = ..., range: Union["ParamRef", List[Union[float, Any]]] = ..., rows: Union["ParamRef", List[Union[float, Any]]] = ...):
        self.distinct = distinct
        self.max = max
        self.orderby = orderby
        self.partitionby = partitionby
        self.range = range
        self.rows = rows


class Median(SchemaBase):
    def __init__(self, median: Union[Union[float, bool, str], List[Union[float, bool, str]]], distinct: bool = ..., orderby: Union[List["TransformField"], "TransformField"] = ..., partitionby: Union[List["TransformField"], "TransformField"] = ..., range: Union["ParamRef", List[Union[float, Any]]] = ..., rows: Union["ParamRef", List[Union[float, Any]]] = ...):
        self.distinct = distinct
        self.median = median
        self.orderby = orderby
        self.partitionby = partitionby
        self.range = range
        self.rows = rows


class Meta(SchemaBase):
    def __init__(self, credit: str = ..., description: str = ..., title: str = ...):
        self.credit = credit
        self.description = description
        self.title = title


class Min(SchemaBase):
    def __init__(self, min: Union[Union[float, bool, str], List[Union[float, bool, str]]], distinct: bool = ..., orderby: Union[List["TransformField"], "TransformField"] = ..., partitionby: Union[List["TransformField"], "TransformField"] = ..., range: Union["ParamRef", List[Union[float, Any]]] = ..., rows: Union["ParamRef", List[Union[float, Any]]] = ...):
        self.distinct = distinct
        self.min = min
        self.orderby = orderby
        self.partitionby = partitionby
        self.range = range
        self.rows = rows


class Mode(SchemaBase):
    def __init__(self, mode: Union[Union[float, bool, str], List[Union[float, bool, str]]], distinct: bool = ..., orderby: Union[List["TransformField"], "TransformField"] = ..., partitionby: Union[List["TransformField"], "TransformField"] = ..., range: Union["ParamRef", List[Union[float, Any]]] = ..., rows: Union["ParamRef", List[Union[float, Any]]] = ...):
        self.distinct = distinct
        self.mode = mode
        self.orderby = orderby
        self.partitionby = partitionby
        self.range = range
        self.rows = rows


class NTile(SchemaBase):
    def __init__(self, ntile: Union[Union[float, bool, str], List[Union[float, bool, str]]], orderby: Union[List["TransformField"], "TransformField"] = ..., partitionby: Union[List["TransformField"], "TransformField"] = ..., range: Union["ParamRef", List[Union[float, Any]]] = ..., rows: Union["ParamRef", List[Union[float, Any]]] = ...):
        self.ntile = ntile
        self.orderby = orderby
        self.partitionby = partitionby
        self.range = range
        self.rows = rows


class NthValue(SchemaBase):
    def __init__(self, nth_value: Union[Union[float, bool, str], List[Union[float, bool, str]]], orderby: Union[List["TransformField"], "TransformField"] = ..., partitionby: Union[List["TransformField"], "TransformField"] = ..., range: Union["ParamRef", List[Union[float, Any]]] = ..., rows: Union["ParamRef", List[Union[float, Any]]] = ...):
        self.nth_value = nth_value
        self.orderby = orderby
        self.partitionby = partitionby
        self.range = range
        self.rows = rows


class ParamValue(SchemaBase):
    def __init__(self, value: Union[List[Union["ParamRef", "ParamLiteral"]], "ParamLiteral"]):
        self.value = value


class ParamDate(SchemaBase):
    def __init__(self, date: str, select: str = ...):
        self.date = date
        self.select = select


class ParamDefinition(SchemaBase):
    def __init__(self, value: Union["ParamDate", "Selection", "ParamValue", "Param"]):
        self.value = value


class ParamLiteral(SchemaBase):
    def __init__(self, value: Union[float, bool, str]):
        self.value = value


class PercentRank(SchemaBase):
    def __init__(self, percent_rank: Any, orderby: Union[List["TransformField"], "TransformField"] = ..., partitionby: Union[List["TransformField"], "TransformField"] = ..., range: Union["ParamRef", List[Union[float, Any]]] = ..., rows: Union["ParamRef", List[Union[float, Any]]] = ...):
        self.orderby = orderby
        self.partitionby = partitionby
        self.percent_rank = percent_rank
        self.range = range
        self.rows = rows


class Plot(SchemaBase):
    def __init__(self, plot: List[Union["PlotLegend", "PlotMark", "PlotInteractor"]], align: Union[float, "ParamRef"] = ..., aspectRatio: Union[float, "ParamRef", bool, Any] = ..., axis: Union["ParamRef", bool, str, Any] = ..., colorBase: Union[float, "ParamRef"] = ..., colorClamp: Union["ParamRef", bool] = ..., colorConstant: Union[float, "ParamRef"] = ..., colorDomain: Union["ParamRef", List[Any], "Fixed"] = ..., colorExponent: Union[float, "ParamRef"] = ..., colorInterpolate: Union["ParamRef", "Interpolate"] = ..., colorLabel: Union["ParamRef", str, Any] = ..., colorN: Union[float, "ParamRef"] = ..., colorNice: Union[float, "ParamRef", bool, "Interval"] = ..., colorPercent: Union["ParamRef", bool] = ..., colorPivot: Union["ParamRef", Any] = ..., colorRange: Union["ParamRef", List[Any], "Fixed"] = ..., colorReverse: Union["ParamRef", bool] = ..., colorScale: Union["ColorScaleType", "ParamRef", Any] = ..., colorScheme: Union["ParamRef", "ColorScheme"] = ..., colorSymmetric: Union["ParamRef", bool] = ..., colorTickFormat: Union["ParamRef", str, Any] = ..., colorZero: Union["ParamRef", bool] = ..., facetGrid: Union[str, "Interval", "ParamRef", bool, List[Any]] = ..., facetLabel: Union["ParamRef", str, Any] = ..., facetMargin: Union[float, "ParamRef"] = ..., facetMarginBottom: Union[float, "ParamRef"] = ..., facetMarginLeft: Union[float, "ParamRef"] = ..., facetMarginRight: Union[float, "ParamRef"] = ..., facetMarginTop: Union[float, "ParamRef"] = ..., fxAlign: Union[float, "ParamRef"] = ..., fxAriaDescription: Union["ParamRef", str] = ..., fxAriaLabel: Union["ParamRef", str] = ..., fxAxis: Union["ParamRef", bool, str, Any] = ..., fxDomain: Union["ParamRef", List[Any], "Fixed"] = ..., fxFontVariant: Union["ParamRef", str] = ..., fxGrid: Union[str, "Interval", "ParamRef", bool, List[Any]] = ..., fxInset: Union[float, "ParamRef"] = ..., fxInsetLeft: Union[float, "ParamRef"] = ..., fxInsetRight: Union[float, "ParamRef"] = ..., fxLabel: Union["ParamRef", str, Any] = ..., fxLabelAnchor: Union["ParamRef", str] = ..., fxLabelOffset: Union[float, "ParamRef"] = ..., fxLine: Union["ParamRef", bool] = ..., fxPadding: Union[float, "ParamRef"] = ..., fxPaddingInner: Union[float, "ParamRef"] = ..., fxPaddingOuter: Union[float, "ParamRef"] = ..., fxRange: Union["ParamRef", List[Any], "Fixed"] = ..., fxReverse: Union["ParamRef", bool] = ..., fxRound: Union["ParamRef", bool] = ..., fxTickFormat: Union["ParamRef", str, Any] = ..., fxTickPadding: Union[float, "ParamRef"] = ..., fxTickRotate: Union[float, "ParamRef"] = ..., fxTickSize: Union[float, "ParamRef"] = ..., fxTickSpacing: Union[float, "ParamRef"] = ..., fxTicks: Union[float, "ParamRef", List[Any], "Interval"] = ..., fyAlign: Union[float, "ParamRef"] = ..., fyAriaDescription: Union["ParamRef", str] = ..., fyAriaLabel: Union["ParamRef", str] = ..., fyAxis: Union["ParamRef", bool, str, Any] = ..., fyDomain: Union["ParamRef", List[Any], "Fixed"] = ..., fyFontVariant: Union["ParamRef", str] = ..., fyGrid: Union[str, "Interval", "ParamRef", bool, List[Any]] = ..., fyInset: Union[float, "ParamRef"] = ..., fyInsetBottom: Union[float, "ParamRef"] = ..., fyInsetTop: Union[float, "ParamRef"] = ..., fyLabel: Union["ParamRef", str, Any] = ..., fyLabelAnchor: Union["ParamRef", str] = ..., fyLabelOffset: Union[float, "ParamRef"] = ..., fyLine: Union["ParamRef", bool] = ..., fyPadding: Union[float, "ParamRef"] = ..., fyPaddingInner: Union[float, "ParamRef"] = ..., fyPaddingOuter: Union[float, "ParamRef"] = ..., fyRange: Union["ParamRef", List[Any], "Fixed"] = ..., fyReverse: Union["ParamRef", bool] = ..., fyRound: Union["ParamRef", bool] = ..., fyTickFormat: Union["ParamRef", str, Any] = ..., fyTickPadding: Union[float, "ParamRef"] = ..., fyTickRotate: Union[float, "ParamRef"] = ..., fyTickSize: Union[float, "ParamRef"] = ..., fyTickSpacing: Union[float, "ParamRef"] = ..., fyTicks: Union[float, "ParamRef", List[Any], "Interval"] = ..., grid: Union["ParamRef", bool, str] = ..., height: Union[float, "ParamRef"] = ..., inset: Union[float, "ParamRef"] = ..., label: Union["ParamRef", str, Any] = ..., lengthBase: Union[float, "ParamRef"] = ..., lengthClamp: Any = ..., lengthConstant: Union[float, "ParamRef"] = ..., lengthDomain: Union["ParamRef", List[Any], "Fixed"] = ..., lengthExponent: Union[float, "ParamRef"] = ..., lengthNice: Union[float, "ParamRef", bool, "Interval"] = ..., lengthPercent: Union["ParamRef", bool] = ..., lengthRange: Union["ParamRef", List[Any], "Fixed"] = ..., lengthScale: Union["ParamRef", "ContinuousScaleType", Any] = ..., lengthZero: Union["ParamRef", bool] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., margins: Dict[str, Any] = ..., name: str = ..., opacityBase: Union[float, "ParamRef"] = ..., opacityClamp: Union["ParamRef", bool] = ..., opacityConstant: Union[float, "ParamRef"] = ..., opacityDomain: Union["ParamRef", List[Any], "Fixed"] = ..., opacityExponent: Union[float, "ParamRef"] = ..., opacityLabel: Union["ParamRef", str, Any] = ..., opacityNice: Union[float, "ParamRef", bool, "Interval"] = ..., opacityPercent: Union["ParamRef", bool] = ..., opacityRange: Union["ParamRef", List[Any], "Fixed"] = ..., opacityReverse: Union["ParamRef", bool] = ..., opacityScale: Union["ParamRef", "ContinuousScaleType", Any] = ..., opacityTickFormat: Union["ParamRef", str, Any] = ..., opacityZero: Union["ParamRef", bool] = ..., padding: Union[float, "ParamRef"] = ..., projectionClip: Union[str, "ParamRef", float, bool, Any] = ..., projectionDomain: Union[Dict[str, Any], "ParamRef"] = ..., projectionInset: Union[float, "ParamRef"] = ..., projectionInsetBottom: Union[float, "ParamRef"] = ..., projectionInsetLeft: Union[float, "ParamRef"] = ..., projectionInsetRight: Union[float, "ParamRef"] = ..., projectionInsetTop: Union[float, "ParamRef"] = ..., projectionParallels: Union["ParamRef", List[Any]] = ..., projectionPrecision: Union[float, "ParamRef"] = ..., projectionRotate: Union["ParamRef", List[Any]] = ..., projectionType: Union["ParamRef", "ProjectionName", Any] = ..., rBase: Union[float, "ParamRef"] = ..., rClamp: Any = ..., rConstant: Union[float, "ParamRef"] = ..., rDomain: Union["ParamRef", List[Any], "Fixed"] = ..., rExponent: Union[float, "ParamRef"] = ..., rLabel: Union["ParamRef", str, Any] = ..., rNice: Union[float, "ParamRef", bool, "Interval"] = ..., rPercent: Union["ParamRef", bool] = ..., rRange: Union["ParamRef", List[Any], "Fixed"] = ..., rScale: Union["ParamRef", "ContinuousScaleType", Any] = ..., rZero: Union["ParamRef", bool] = ..., style: Union["CSSStyles", "ParamRef", str, Any] = ..., symbolDomain: Union["ParamRef", List[Any], "Fixed"] = ..., symbolRange: Union["ParamRef", List[Any], "Fixed"] = ..., symbolScale: Union["ParamRef", "DiscreteScaleType", Any] = ..., width: Union[float, "ParamRef"] = ..., xAlign: Union[float, "ParamRef"] = ..., xAriaDescription: Union["ParamRef", str] = ..., xAriaLabel: Union["ParamRef", str] = ..., xAxis: Union["ParamRef", bool, str, Any] = ..., xBase: Union[float, "ParamRef"] = ..., xClamp: Union["ParamRef", bool] = ..., xConstant: Union[float, "ParamRef"] = ..., xDomain: Union["ParamRef", List[Any], "Fixed"] = ..., xExponent: Union[float, "ParamRef"] = ..., xFontVariant: Union["ParamRef", str] = ..., xGrid: Union[str, "Interval", "ParamRef", bool, List[Any]] = ..., xInset: Union[float, "ParamRef"] = ..., xInsetLeft: Union[float, "ParamRef"] = ..., xInsetRight: Union[float, "ParamRef"] = ..., xLabel: Union["ParamRef", str, Any] = ..., xLabelAnchor: Union["ParamRef", str] = ..., xLabelArrow: Union["ParamRef", "LabelArrow"] = ..., xLabelOffset: Union[float, "ParamRef"] = ..., xLine: Union["ParamRef", bool] = ..., xNice: Union[float, "ParamRef", bool, "Interval"] = ..., xPadding: Union[float, "ParamRef"] = ..., xPaddingInner: Union[float, "ParamRef"] = ..., xPaddingOuter: Union[float, "ParamRef"] = ..., xPercent: Union["ParamRef", bool] = ..., xRange: Union["ParamRef", List[Any], "Fixed"] = ..., xReverse: Union["ParamRef", bool] = ..., xRound: Union["ParamRef", bool] = ..., xScale: Union["PositionScaleType", "ParamRef", Any] = ..., xTickFormat: Union["ParamRef", str, Any] = ..., xTickPadding: Union[float, "ParamRef"] = ..., xTickRotate: Union[float, "ParamRef"] = ..., xTickSize: Union[float, "ParamRef"] = ..., xTickSpacing: Union[float, "ParamRef"] = ..., xTicks: Union[float, "ParamRef", List[Any], "Interval"] = ..., xZero: Union["ParamRef", bool] = ..., xyDomain: Union["ParamRef", List[Any], "Fixed"] = ..., yAlign: Union[float, "ParamRef"] = ..., yAriaDescription: Union["ParamRef", str] = ..., yAriaLabel: Union["ParamRef", str] = ..., yAxis: Union["ParamRef", bool, str, Any] = ..., yBase: Union[float, "ParamRef"] = ..., yClamp: Union["ParamRef", bool] = ..., yConstant: Union[float, "ParamRef"] = ..., yDomain: Union["ParamRef", List[Any], "Fixed"] = ..., yExponent: Union[float, "ParamRef"] = ..., yFontVariant: Union["ParamRef", str] = ..., yGrid: Union[str, "Interval", "ParamRef", bool, List[Any]] = ..., yInset: Union[float, "ParamRef"] = ..., yInsetBottom: Union[float, "ParamRef"] = ..., yInsetTop: Union[float, "ParamRef"] = ..., yLabel: Union["ParamRef", str, Any] = ..., yLabelAnchor: Union["ParamRef", str] = ..., yLabelArrow: Union["ParamRef", "LabelArrow"] = ..., yLabelOffset: Union[float, "ParamRef"] = ..., yLine: Union["ParamRef", bool] = ..., yNice: Union[float, "ParamRef", bool, "Interval"] = ..., yPadding: Union[float, "ParamRef"] = ..., yPaddingInner: Union[float, "ParamRef"] = ..., yPaddingOuter: Union[float, "ParamRef"] = ..., yPercent: Union["ParamRef", bool] = ..., yRange: Union["ParamRef", List[Any], "Fixed"] = ..., yReverse: Union["ParamRef", bool] = ..., yRound: Union["ParamRef", bool] = ..., yScale: Union["PositionScaleType", "ParamRef", Any] = ..., yTickFormat: Union["ParamRef", str, Any] = ..., yTickPadding: Union[float, "ParamRef"] = ..., yTickRotate: Union[float, "ParamRef"] = ..., yTickSize: Union[float, "ParamRef"] = ..., yTickSpacing: Union[float, "ParamRef"] = ..., yTicks: Union[float, "ParamRef", List[Any], "Interval"] = ..., yZero: Union["ParamRef", bool] = ...):
        self.align = align
        self.aspectRatio = aspectRatio
        self.axis = axis
        self.colorBase = colorBase
        self.colorClamp = colorClamp
        self.colorConstant = colorConstant
        self.colorDomain = colorDomain
        self.colorExponent = colorExponent
        self.colorInterpolate = colorInterpolate
        self.colorLabel = colorLabel
        self.colorN = colorN
        self.colorNice = colorNice
        self.colorPercent = colorPercent
        self.colorPivot = colorPivot
        self.colorRange = colorRange
        self.colorReverse = colorReverse
        self.colorScale = colorScale
        self.colorScheme = colorScheme
        self.colorSymmetric = colorSymmetric
        self.colorTickFormat = colorTickFormat
        self.colorZero = colorZero
        self.facetGrid = facetGrid
        self.facetLabel = facetLabel
        self.facetMargin = facetMargin
        self.facetMarginBottom = facetMarginBottom
        self.facetMarginLeft = facetMarginLeft
        self.facetMarginRight = facetMarginRight
        self.facetMarginTop = facetMarginTop
        self.fxAlign = fxAlign
        self.fxAriaDescription = fxAriaDescription
        self.fxAriaLabel = fxAriaLabel
        self.fxAxis = fxAxis
        self.fxDomain = fxDomain
        self.fxFontVariant = fxFontVariant
        self.fxGrid = fxGrid
        self.fxInset = fxInset
        self.fxInsetLeft = fxInsetLeft
        self.fxInsetRight = fxInsetRight
        self.fxLabel = fxLabel
        self.fxLabelAnchor = fxLabelAnchor
        self.fxLabelOffset = fxLabelOffset
        self.fxLine = fxLine
        self.fxPadding = fxPadding
        self.fxPaddingInner = fxPaddingInner
        self.fxPaddingOuter = fxPaddingOuter
        self.fxRange = fxRange
        self.fxReverse = fxReverse
        self.fxRound = fxRound
        self.fxTickFormat = fxTickFormat
        self.fxTickPadding = fxTickPadding
        self.fxTickRotate = fxTickRotate
        self.fxTickSize = fxTickSize
        self.fxTickSpacing = fxTickSpacing
        self.fxTicks = fxTicks
        self.fyAlign = fyAlign
        self.fyAriaDescription = fyAriaDescription
        self.fyAriaLabel = fyAriaLabel
        self.fyAxis = fyAxis
        self.fyDomain = fyDomain
        self.fyFontVariant = fyFontVariant
        self.fyGrid = fyGrid
        self.fyInset = fyInset
        self.fyInsetBottom = fyInsetBottom
        self.fyInsetTop = fyInsetTop
        self.fyLabel = fyLabel
        self.fyLabelAnchor = fyLabelAnchor
        self.fyLabelOffset = fyLabelOffset
        self.fyLine = fyLine
        self.fyPadding = fyPadding
        self.fyPaddingInner = fyPaddingInner
        self.fyPaddingOuter = fyPaddingOuter
        self.fyRange = fyRange
        self.fyReverse = fyReverse
        self.fyRound = fyRound
        self.fyTickFormat = fyTickFormat
        self.fyTickPadding = fyTickPadding
        self.fyTickRotate = fyTickRotate
        self.fyTickSize = fyTickSize
        self.fyTickSpacing = fyTickSpacing
        self.fyTicks = fyTicks
        self.grid = grid
        self.height = height
        self.inset = inset
        self.label = label
        self.lengthBase = lengthBase
        self.lengthClamp = lengthClamp
        self.lengthConstant = lengthConstant
        self.lengthDomain = lengthDomain
        self.lengthExponent = lengthExponent
        self.lengthNice = lengthNice
        self.lengthPercent = lengthPercent
        self.lengthRange = lengthRange
        self.lengthScale = lengthScale
        self.lengthZero = lengthZero
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.margins = margins
        self.name = name
        self.opacityBase = opacityBase
        self.opacityClamp = opacityClamp
        self.opacityConstant = opacityConstant
        self.opacityDomain = opacityDomain
        self.opacityExponent = opacityExponent
        self.opacityLabel = opacityLabel
        self.opacityNice = opacityNice
        self.opacityPercent = opacityPercent
        self.opacityRange = opacityRange
        self.opacityReverse = opacityReverse
        self.opacityScale = opacityScale
        self.opacityTickFormat = opacityTickFormat
        self.opacityZero = opacityZero
        self.padding = padding
        self.plot = plot
        self.projectionClip = projectionClip
        self.projectionDomain = projectionDomain
        self.projectionInset = projectionInset
        self.projectionInsetBottom = projectionInsetBottom
        self.projectionInsetLeft = projectionInsetLeft
        self.projectionInsetRight = projectionInsetRight
        self.projectionInsetTop = projectionInsetTop
        self.projectionParallels = projectionParallels
        self.projectionPrecision = projectionPrecision
        self.projectionRotate = projectionRotate
        self.projectionType = projectionType
        self.rBase = rBase
        self.rClamp = rClamp
        self.rConstant = rConstant
        self.rDomain = rDomain
        self.rExponent = rExponent
        self.rLabel = rLabel
        self.rNice = rNice
        self.rPercent = rPercent
        self.rRange = rRange
        self.rScale = rScale
        self.rZero = rZero
        self.style = style
        self.symbolDomain = symbolDomain
        self.symbolRange = symbolRange
        self.symbolScale = symbolScale
        self.width = width
        self.xAlign = xAlign
        self.xAriaDescription = xAriaDescription
        self.xAriaLabel = xAriaLabel
        self.xAxis = xAxis
        self.xBase = xBase
        self.xClamp = xClamp
        self.xConstant = xConstant
        self.xDomain = xDomain
        self.xExponent = xExponent
        self.xFontVariant = xFontVariant
        self.xGrid = xGrid
        self.xInset = xInset
        self.xInsetLeft = xInsetLeft
        self.xInsetRight = xInsetRight
        self.xLabel = xLabel
        self.xLabelAnchor = xLabelAnchor
        self.xLabelArrow = xLabelArrow
        self.xLabelOffset = xLabelOffset
        self.xLine = xLine
        self.xNice = xNice
        self.xPadding = xPadding
        self.xPaddingInner = xPaddingInner
        self.xPaddingOuter = xPaddingOuter
        self.xPercent = xPercent
        self.xRange = xRange
        self.xReverse = xReverse
        self.xRound = xRound
        self.xScale = xScale
        self.xTickFormat = xTickFormat
        self.xTickPadding = xTickPadding
        self.xTickRotate = xTickRotate
        self.xTickSize = xTickSize
        self.xTickSpacing = xTickSpacing
        self.xTicks = xTicks
        self.xZero = xZero
        self.xyDomain = xyDomain
        self.yAlign = yAlign
        self.yAriaDescription = yAriaDescription
        self.yAriaLabel = yAriaLabel
        self.yAxis = yAxis
        self.yBase = yBase
        self.yClamp = yClamp
        self.yConstant = yConstant
        self.yDomain = yDomain
        self.yExponent = yExponent
        self.yFontVariant = yFontVariant
        self.yGrid = yGrid
        self.yInset = yInset
        self.yInsetBottom = yInsetBottom
        self.yInsetTop = yInsetTop
        self.yLabel = yLabel
        self.yLabelAnchor = yLabelAnchor
        self.yLabelArrow = yLabelArrow
        self.yLabelOffset = yLabelOffset
        self.yLine = yLine
        self.yNice = yNice
        self.yPadding = yPadding
        self.yPaddingInner = yPaddingInner
        self.yPaddingOuter = yPaddingOuter
        self.yPercent = yPercent
        self.yRange = yRange
        self.yReverse = yReverse
        self.yRound = yRound
        self.yScale = yScale
        self.yTickFormat = yTickFormat
        self.yTickPadding = yTickPadding
        self.yTickRotate = yTickRotate
        self.yTickSize = yTickSize
        self.yTickSpacing = yTickSpacing
        self.yTicks = yTicks
        self.yZero = yZero


class PlotAttributes(SchemaBase):
    def __init__(self, align: Union[float, "ParamRef"] = ..., aspectRatio: Union[float, "ParamRef", bool, Any] = ..., axis: Union["ParamRef", bool, str, Any] = ..., colorBase: Union[float, "ParamRef"] = ..., colorClamp: Union["ParamRef", bool] = ..., colorConstant: Union[float, "ParamRef"] = ..., colorDomain: Union["ParamRef", List[Any], "Fixed"] = ..., colorExponent: Union[float, "ParamRef"] = ..., colorInterpolate: Union["ParamRef", "Interpolate"] = ..., colorLabel: Union["ParamRef", str, Any] = ..., colorN: Union[float, "ParamRef"] = ..., colorNice: Union[float, "ParamRef", bool, "Interval"] = ..., colorPercent: Union["ParamRef", bool] = ..., colorPivot: Union["ParamRef", Any] = ..., colorRange: Union["ParamRef", List[Any], "Fixed"] = ..., colorReverse: Union["ParamRef", bool] = ..., colorScale: Union["ColorScaleType", "ParamRef", Any] = ..., colorScheme: Union["ParamRef", "ColorScheme"] = ..., colorSymmetric: Union["ParamRef", bool] = ..., colorTickFormat: Union["ParamRef", str, Any] = ..., colorZero: Union["ParamRef", bool] = ..., facetGrid: Union[str, "Interval", "ParamRef", bool, List[Any]] = ..., facetLabel: Union["ParamRef", str, Any] = ..., facetMargin: Union[float, "ParamRef"] = ..., facetMarginBottom: Union[float, "ParamRef"] = ..., facetMarginLeft: Union[float, "ParamRef"] = ..., facetMarginRight: Union[float, "ParamRef"] = ..., facetMarginTop: Union[float, "ParamRef"] = ..., fxAlign: Union[float, "ParamRef"] = ..., fxAriaDescription: Union["ParamRef", str] = ..., fxAriaLabel: Union["ParamRef", str] = ..., fxAxis: Union["ParamRef", bool, str, Any] = ..., fxDomain: Union["ParamRef", List[Any], "Fixed"] = ..., fxFontVariant: Union["ParamRef", str] = ..., fxGrid: Union[str, "Interval", "ParamRef", bool, List[Any]] = ..., fxInset: Union[float, "ParamRef"] = ..., fxInsetLeft: Union[float, "ParamRef"] = ..., fxInsetRight: Union[float, "ParamRef"] = ..., fxLabel: Union["ParamRef", str, Any] = ..., fxLabelAnchor: Union["ParamRef", str] = ..., fxLabelOffset: Union[float, "ParamRef"] = ..., fxLine: Union["ParamRef", bool] = ..., fxPadding: Union[float, "ParamRef"] = ..., fxPaddingInner: Union[float, "ParamRef"] = ..., fxPaddingOuter: Union[float, "ParamRef"] = ..., fxRange: Union["ParamRef", List[Any], "Fixed"] = ..., fxReverse: Union["ParamRef", bool] = ..., fxRound: Union["ParamRef", bool] = ..., fxTickFormat: Union["ParamRef", str, Any] = ..., fxTickPadding: Union[float, "ParamRef"] = ..., fxTickRotate: Union[float, "ParamRef"] = ..., fxTickSize: Union[float, "ParamRef"] = ..., fxTickSpacing: Union[float, "ParamRef"] = ..., fxTicks: Union[float, "ParamRef", List[Any], "Interval"] = ..., fyAlign: Union[float, "ParamRef"] = ..., fyAriaDescription: Union["ParamRef", str] = ..., fyAriaLabel: Union["ParamRef", str] = ..., fyAxis: Union["ParamRef", bool, str, Any] = ..., fyDomain: Union["ParamRef", List[Any], "Fixed"] = ..., fyFontVariant: Union["ParamRef", str] = ..., fyGrid: Union[str, "Interval", "ParamRef", bool, List[Any]] = ..., fyInset: Union[float, "ParamRef"] = ..., fyInsetBottom: Union[float, "ParamRef"] = ..., fyInsetTop: Union[float, "ParamRef"] = ..., fyLabel: Union["ParamRef", str, Any] = ..., fyLabelAnchor: Union["ParamRef", str] = ..., fyLabelOffset: Union[float, "ParamRef"] = ..., fyLine: Union["ParamRef", bool] = ..., fyPadding: Union[float, "ParamRef"] = ..., fyPaddingInner: Union[float, "ParamRef"] = ..., fyPaddingOuter: Union[float, "ParamRef"] = ..., fyRange: Union["ParamRef", List[Any], "Fixed"] = ..., fyReverse: Union["ParamRef", bool] = ..., fyRound: Union["ParamRef", bool] = ..., fyTickFormat: Union["ParamRef", str, Any] = ..., fyTickPadding: Union[float, "ParamRef"] = ..., fyTickRotate: Union[float, "ParamRef"] = ..., fyTickSize: Union[float, "ParamRef"] = ..., fyTickSpacing: Union[float, "ParamRef"] = ..., fyTicks: Union[float, "ParamRef", List[Any], "Interval"] = ..., grid: Union["ParamRef", bool, str] = ..., height: Union[float, "ParamRef"] = ..., inset: Union[float, "ParamRef"] = ..., label: Union["ParamRef", str, Any] = ..., lengthBase: Union[float, "ParamRef"] = ..., lengthClamp: Any = ..., lengthConstant: Union[float, "ParamRef"] = ..., lengthDomain: Union["ParamRef", List[Any], "Fixed"] = ..., lengthExponent: Union[float, "ParamRef"] = ..., lengthNice: Union[float, "ParamRef", bool, "Interval"] = ..., lengthPercent: Union["ParamRef", bool] = ..., lengthRange: Union["ParamRef", List[Any], "Fixed"] = ..., lengthScale: Union["ParamRef", "ContinuousScaleType", Any] = ..., lengthZero: Union["ParamRef", bool] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., margins: Dict[str, Any] = ..., name: str = ..., opacityBase: Union[float, "ParamRef"] = ..., opacityClamp: Union["ParamRef", bool] = ..., opacityConstant: Union[float, "ParamRef"] = ..., opacityDomain: Union["ParamRef", List[Any], "Fixed"] = ..., opacityExponent: Union[float, "ParamRef"] = ..., opacityLabel: Union["ParamRef", str, Any] = ..., opacityNice: Union[float, "ParamRef", bool, "Interval"] = ..., opacityPercent: Union["ParamRef", bool] = ..., opacityRange: Union["ParamRef", List[Any], "Fixed"] = ..., opacityReverse: Union["ParamRef", bool] = ..., opacityScale: Union["ParamRef", "ContinuousScaleType", Any] = ..., opacityTickFormat: Union["ParamRef", str, Any] = ..., opacityZero: Union["ParamRef", bool] = ..., padding: Union[float, "ParamRef"] = ..., projectionClip: Union[str, "ParamRef", float, bool, Any] = ..., projectionDomain: Union[Dict[str, Any], "ParamRef"] = ..., projectionInset: Union[float, "ParamRef"] = ..., projectionInsetBottom: Union[float, "ParamRef"] = ..., projectionInsetLeft: Union[float, "ParamRef"] = ..., projectionInsetRight: Union[float, "ParamRef"] = ..., projectionInsetTop: Union[float, "ParamRef"] = ..., projectionParallels: Union["ParamRef", List[Any]] = ..., projectionPrecision: Union[float, "ParamRef"] = ..., projectionRotate: Union["ParamRef", List[Any]] = ..., projectionType: Union["ParamRef", "ProjectionName", Any] = ..., rBase: Union[float, "ParamRef"] = ..., rClamp: Any = ..., rConstant: Union[float, "ParamRef"] = ..., rDomain: Union["ParamRef", List[Any], "Fixed"] = ..., rExponent: Union[float, "ParamRef"] = ..., rLabel: Union["ParamRef", str, Any] = ..., rNice: Union[float, "ParamRef", bool, "Interval"] = ..., rPercent: Union["ParamRef", bool] = ..., rRange: Union["ParamRef", List[Any], "Fixed"] = ..., rScale: Union["ParamRef", "ContinuousScaleType", Any] = ..., rZero: Union["ParamRef", bool] = ..., style: Union["CSSStyles", "ParamRef", str, Any] = ..., symbolDomain: Union["ParamRef", List[Any], "Fixed"] = ..., symbolRange: Union["ParamRef", List[Any], "Fixed"] = ..., symbolScale: Union["ParamRef", "DiscreteScaleType", Any] = ..., width: Union[float, "ParamRef"] = ..., xAlign: Union[float, "ParamRef"] = ..., xAriaDescription: Union["ParamRef", str] = ..., xAriaLabel: Union["ParamRef", str] = ..., xAxis: Union["ParamRef", bool, str, Any] = ..., xBase: Union[float, "ParamRef"] = ..., xClamp: Union["ParamRef", bool] = ..., xConstant: Union[float, "ParamRef"] = ..., xDomain: Union["ParamRef", List[Any], "Fixed"] = ..., xExponent: Union[float, "ParamRef"] = ..., xFontVariant: Union["ParamRef", str] = ..., xGrid: Union[str, "Interval", "ParamRef", bool, List[Any]] = ..., xInset: Union[float, "ParamRef"] = ..., xInsetLeft: Union[float, "ParamRef"] = ..., xInsetRight: Union[float, "ParamRef"] = ..., xLabel: Union["ParamRef", str, Any] = ..., xLabelAnchor: Union["ParamRef", str] = ..., xLabelArrow: Union["ParamRef", "LabelArrow"] = ..., xLabelOffset: Union[float, "ParamRef"] = ..., xLine: Union["ParamRef", bool] = ..., xNice: Union[float, "ParamRef", bool, "Interval"] = ..., xPadding: Union[float, "ParamRef"] = ..., xPaddingInner: Union[float, "ParamRef"] = ..., xPaddingOuter: Union[float, "ParamRef"] = ..., xPercent: Union["ParamRef", bool] = ..., xRange: Union["ParamRef", List[Any], "Fixed"] = ..., xReverse: Union["ParamRef", bool] = ..., xRound: Union["ParamRef", bool] = ..., xScale: Union["PositionScaleType", "ParamRef", Any] = ..., xTickFormat: Union["ParamRef", str, Any] = ..., xTickPadding: Union[float, "ParamRef"] = ..., xTickRotate: Union[float, "ParamRef"] = ..., xTickSize: Union[float, "ParamRef"] = ..., xTickSpacing: Union[float, "ParamRef"] = ..., xTicks: Union[float, "ParamRef", List[Any], "Interval"] = ..., xZero: Union["ParamRef", bool] = ..., xyDomain: Union["ParamRef", List[Any], "Fixed"] = ..., yAlign: Union[float, "ParamRef"] = ..., yAriaDescription: Union["ParamRef", str] = ..., yAriaLabel: Union["ParamRef", str] = ..., yAxis: Union["ParamRef", bool, str, Any] = ..., yBase: Union[float, "ParamRef"] = ..., yClamp: Union["ParamRef", bool] = ..., yConstant: Union[float, "ParamRef"] = ..., yDomain: Union["ParamRef", List[Any], "Fixed"] = ..., yExponent: Union[float, "ParamRef"] = ..., yFontVariant: Union["ParamRef", str] = ..., yGrid: Union[str, "Interval", "ParamRef", bool, List[Any]] = ..., yInset: Union[float, "ParamRef"] = ..., yInsetBottom: Union[float, "ParamRef"] = ..., yInsetTop: Union[float, "ParamRef"] = ..., yLabel: Union["ParamRef", str, Any] = ..., yLabelAnchor: Union["ParamRef", str] = ..., yLabelArrow: Union["ParamRef", "LabelArrow"] = ..., yLabelOffset: Union[float, "ParamRef"] = ..., yLine: Union["ParamRef", bool] = ..., yNice: Union[float, "ParamRef", bool, "Interval"] = ..., yPadding: Union[float, "ParamRef"] = ..., yPaddingInner: Union[float, "ParamRef"] = ..., yPaddingOuter: Union[float, "ParamRef"] = ..., yPercent: Union["ParamRef", bool] = ..., yRange: Union["ParamRef", List[Any], "Fixed"] = ..., yReverse: Union["ParamRef", bool] = ..., yRound: Union["ParamRef", bool] = ..., yScale: Union["PositionScaleType", "ParamRef", Any] = ..., yTickFormat: Union["ParamRef", str, Any] = ..., yTickPadding: Union[float, "ParamRef"] = ..., yTickRotate: Union[float, "ParamRef"] = ..., yTickSize: Union[float, "ParamRef"] = ..., yTickSpacing: Union[float, "ParamRef"] = ..., yTicks: Union[float, "ParamRef", List[Any], "Interval"] = ..., yZero: Union["ParamRef", bool] = ...):
        self.align = align
        self.aspectRatio = aspectRatio
        self.axis = axis
        self.colorBase = colorBase
        self.colorClamp = colorClamp
        self.colorConstant = colorConstant
        self.colorDomain = colorDomain
        self.colorExponent = colorExponent
        self.colorInterpolate = colorInterpolate
        self.colorLabel = colorLabel
        self.colorN = colorN
        self.colorNice = colorNice
        self.colorPercent = colorPercent
        self.colorPivot = colorPivot
        self.colorRange = colorRange
        self.colorReverse = colorReverse
        self.colorScale = colorScale
        self.colorScheme = colorScheme
        self.colorSymmetric = colorSymmetric
        self.colorTickFormat = colorTickFormat
        self.colorZero = colorZero
        self.facetGrid = facetGrid
        self.facetLabel = facetLabel
        self.facetMargin = facetMargin
        self.facetMarginBottom = facetMarginBottom
        self.facetMarginLeft = facetMarginLeft
        self.facetMarginRight = facetMarginRight
        self.facetMarginTop = facetMarginTop
        self.fxAlign = fxAlign
        self.fxAriaDescription = fxAriaDescription
        self.fxAriaLabel = fxAriaLabel
        self.fxAxis = fxAxis
        self.fxDomain = fxDomain
        self.fxFontVariant = fxFontVariant
        self.fxGrid = fxGrid
        self.fxInset = fxInset
        self.fxInsetLeft = fxInsetLeft
        self.fxInsetRight = fxInsetRight
        self.fxLabel = fxLabel
        self.fxLabelAnchor = fxLabelAnchor
        self.fxLabelOffset = fxLabelOffset
        self.fxLine = fxLine
        self.fxPadding = fxPadding
        self.fxPaddingInner = fxPaddingInner
        self.fxPaddingOuter = fxPaddingOuter
        self.fxRange = fxRange
        self.fxReverse = fxReverse
        self.fxRound = fxRound
        self.fxTickFormat = fxTickFormat
        self.fxTickPadding = fxTickPadding
        self.fxTickRotate = fxTickRotate
        self.fxTickSize = fxTickSize
        self.fxTickSpacing = fxTickSpacing
        self.fxTicks = fxTicks
        self.fyAlign = fyAlign
        self.fyAriaDescription = fyAriaDescription
        self.fyAriaLabel = fyAriaLabel
        self.fyAxis = fyAxis
        self.fyDomain = fyDomain
        self.fyFontVariant = fyFontVariant
        self.fyGrid = fyGrid
        self.fyInset = fyInset
        self.fyInsetBottom = fyInsetBottom
        self.fyInsetTop = fyInsetTop
        self.fyLabel = fyLabel
        self.fyLabelAnchor = fyLabelAnchor
        self.fyLabelOffset = fyLabelOffset
        self.fyLine = fyLine
        self.fyPadding = fyPadding
        self.fyPaddingInner = fyPaddingInner
        self.fyPaddingOuter = fyPaddingOuter
        self.fyRange = fyRange
        self.fyReverse = fyReverse
        self.fyRound = fyRound
        self.fyTickFormat = fyTickFormat
        self.fyTickPadding = fyTickPadding
        self.fyTickRotate = fyTickRotate
        self.fyTickSize = fyTickSize
        self.fyTickSpacing = fyTickSpacing
        self.fyTicks = fyTicks
        self.grid = grid
        self.height = height
        self.inset = inset
        self.label = label
        self.lengthBase = lengthBase
        self.lengthClamp = lengthClamp
        self.lengthConstant = lengthConstant
        self.lengthDomain = lengthDomain
        self.lengthExponent = lengthExponent
        self.lengthNice = lengthNice
        self.lengthPercent = lengthPercent
        self.lengthRange = lengthRange
        self.lengthScale = lengthScale
        self.lengthZero = lengthZero
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.margins = margins
        self.name = name
        self.opacityBase = opacityBase
        self.opacityClamp = opacityClamp
        self.opacityConstant = opacityConstant
        self.opacityDomain = opacityDomain
        self.opacityExponent = opacityExponent
        self.opacityLabel = opacityLabel
        self.opacityNice = opacityNice
        self.opacityPercent = opacityPercent
        self.opacityRange = opacityRange
        self.opacityReverse = opacityReverse
        self.opacityScale = opacityScale
        self.opacityTickFormat = opacityTickFormat
        self.opacityZero = opacityZero
        self.padding = padding
        self.projectionClip = projectionClip
        self.projectionDomain = projectionDomain
        self.projectionInset = projectionInset
        self.projectionInsetBottom = projectionInsetBottom
        self.projectionInsetLeft = projectionInsetLeft
        self.projectionInsetRight = projectionInsetRight
        self.projectionInsetTop = projectionInsetTop
        self.projectionParallels = projectionParallels
        self.projectionPrecision = projectionPrecision
        self.projectionRotate = projectionRotate
        self.projectionType = projectionType
        self.rBase = rBase
        self.rClamp = rClamp
        self.rConstant = rConstant
        self.rDomain = rDomain
        self.rExponent = rExponent
        self.rLabel = rLabel
        self.rNice = rNice
        self.rPercent = rPercent
        self.rRange = rRange
        self.rScale = rScale
        self.rZero = rZero
        self.style = style
        self.symbolDomain = symbolDomain
        self.symbolRange = symbolRange
        self.symbolScale = symbolScale
        self.width = width
        self.xAlign = xAlign
        self.xAriaDescription = xAriaDescription
        self.xAriaLabel = xAriaLabel
        self.xAxis = xAxis
        self.xBase = xBase
        self.xClamp = xClamp
        self.xConstant = xConstant
        self.xDomain = xDomain
        self.xExponent = xExponent
        self.xFontVariant = xFontVariant
        self.xGrid = xGrid
        self.xInset = xInset
        self.xInsetLeft = xInsetLeft
        self.xInsetRight = xInsetRight
        self.xLabel = xLabel
        self.xLabelAnchor = xLabelAnchor
        self.xLabelArrow = xLabelArrow
        self.xLabelOffset = xLabelOffset
        self.xLine = xLine
        self.xNice = xNice
        self.xPadding = xPadding
        self.xPaddingInner = xPaddingInner
        self.xPaddingOuter = xPaddingOuter
        self.xPercent = xPercent
        self.xRange = xRange
        self.xReverse = xReverse
        self.xRound = xRound
        self.xScale = xScale
        self.xTickFormat = xTickFormat
        self.xTickPadding = xTickPadding
        self.xTickRotate = xTickRotate
        self.xTickSize = xTickSize
        self.xTickSpacing = xTickSpacing
        self.xTicks = xTicks
        self.xZero = xZero
        self.xyDomain = xyDomain
        self.yAlign = yAlign
        self.yAriaDescription = yAriaDescription
        self.yAriaLabel = yAriaLabel
        self.yAxis = yAxis
        self.yBase = yBase
        self.yClamp = yClamp
        self.yConstant = yConstant
        self.yDomain = yDomain
        self.yExponent = yExponent
        self.yFontVariant = yFontVariant
        self.yGrid = yGrid
        self.yInset = yInset
        self.yInsetBottom = yInsetBottom
        self.yInsetTop = yInsetTop
        self.yLabel = yLabel
        self.yLabelAnchor = yLabelAnchor
        self.yLabelArrow = yLabelArrow
        self.yLabelOffset = yLabelOffset
        self.yLine = yLine
        self.yNice = yNice
        self.yPadding = yPadding
        self.yPaddingInner = yPaddingInner
        self.yPaddingOuter = yPaddingOuter
        self.yPercent = yPercent
        self.yRange = yRange
        self.yReverse = yReverse
        self.yRound = yRound
        self.yScale = yScale
        self.yTickFormat = yTickFormat
        self.yTickPadding = yTickPadding
        self.yTickRotate = yTickRotate
        self.yTickSize = yTickSize
        self.yTickSpacing = yTickSpacing
        self.yTicks = yTicks
        self.yZero = yZero


class PlotDataInline(SchemaBase):
    def __init__(self, value: List[Any]):
        self.value = value


class PlotInteractor(SchemaBase):
    def __init__(self, value: Union["Highlight", "PanZoomY", "NearestY", "IntervalX", "ToggleColor", "Pan", "PanZoom", "NearestX", "PanZoomX", "PanX", "Toggle", "ToggleY", "PanY", "IntervalXY", "ToggleX", "IntervalY"]):
        self.value = value


class PlotMark(SchemaBase):
    def __init__(self, value: Union["Arrow", "RectX", "DotX", "Frame", "RectY", "GridFy", "Graticule", "GridX", "Rect", "ErrorBarX", "Hexgrid", "TickX", "LineY", "DenseLine", "Cell", "Line", "AxisY", "RasterTile", "DotY", "Dot", "RuleY", "Heatmap", "Density", "Hull", "Raster", "Geo", "Spike", "CellY", "GridFx", "Sphere", "TextY", "Contour", "AreaY", "Circle", "VoronoiMesh", "Voronoi", "VectorX", "LineX", "Link", "RegressionY", "BarX", "TextX", "AreaX", "AxisFy", "Text", "Vector", "Area", "VectorY", "DelaunayLink", "AxisFx", "DensityY", "GridY", "ErrorBarY", "Hexagon", "BarY", "Hexbin", "CellX", "TickY", "DensityX", "AxisX", "DelaunayMesh", "RuleX", "Image"]):
        self.value = value


class PositionScaleType(SchemaBase):
    enum_options = ['linear', 'pow', 'sqrt', 'log', 'symlog', 'utc', 'time', 'point', 'band', 'threshold', 'quantile', 'quantize', 'identity']

    def __init__(self, value: str):
        if value not in self.enum_options:
            raise ValueError(f"Value of enum not in allowed values: {self.enum_options}")
        self.value = value


class Product(SchemaBase):
    def __init__(self, product: Union[Union[float, bool, str], List[Union[float, bool, str]]], distinct: bool = ..., orderby: Union[List["TransformField"], "TransformField"] = ..., partitionby: Union[List["TransformField"], "TransformField"] = ..., range: Union["ParamRef", List[Union[float, Any]]] = ..., rows: Union["ParamRef", List[Union[float, Any]]] = ...):
        self.distinct = distinct
        self.orderby = orderby
        self.partitionby = partitionby
        self.product = product
        self.range = range
        self.rows = rows


class ProjectionName(SchemaBase):
    enum_options = ['albers-usa', 'albers', 'azimuthal-equal-area', 'azimuthal-equidistant', 'conic-conformal', 'conic-equal-area', 'conic-equidistant', 'equal-earth', 'equirectangular', 'gnomonic', 'identity', 'reflect-y', 'mercator', 'orthographic', 'stereographic', 'transverse-mercator']

    def __init__(self, value: str):
        if value not in self.enum_options:
            raise ValueError(f"Value of enum not in allowed values: {self.enum_options}")
        self.value = value


class Quantile(SchemaBase):
    def __init__(self, quantile: List[Union[float, bool, str]], distinct: bool = ..., orderby: Union[List["TransformField"], "TransformField"] = ..., partitionby: Union[List["TransformField"], "TransformField"] = ..., range: Union["ParamRef", List[Union[float, Any]]] = ..., rows: Union["ParamRef", List[Union[float, Any]]] = ...):
        self.distinct = distinct
        self.orderby = orderby
        self.partitionby = partitionby
        self.quantile = quantile
        self.range = range
        self.rows = rows


class Rank(SchemaBase):
    def __init__(self, rank: Any, orderby: Union[List["TransformField"], "TransformField"] = ..., partitionby: Union[List["TransformField"], "TransformField"] = ..., range: Union["ParamRef", List[Union[float, Any]]] = ..., rows: Union["ParamRef", List[Union[float, Any]]] = ...):
        self.orderby = orderby
        self.partitionby = partitionby
        self.range = range
        self.rank = rank
        self.rows = rows


class Reducer(SchemaBase):
    def __init__(self, value: Union["ReducerPercentile", str]):
        self.value = value


class ReducerPercentile(SchemaBase):
    enum_options = ['p00', 'p01', 'p02', 'p03', 'p04', 'p05', 'p06', 'p07', 'p08', 'p09', 'p10', 'p11', 'p12', 'p13', 'p14', 'p15', 'p16', 'p17', 'p18', 'p19', 'p20', 'p21', 'p22', 'p23', 'p24', 'p25', 'p26', 'p27', 'p28', 'p29', 'p30', 'p31', 'p32', 'p33', 'p34', 'p35', 'p36', 'p37', 'p38', 'p39', 'p40', 'p41', 'p42', 'p43', 'p44', 'p45', 'p46', 'p47', 'p48', 'p49', 'p50', 'p51', 'p52', 'p53', 'p54', 'p55', 'p56', 'p57', 'p58', 'p59', 'p60', 'p61', 'p62', 'p63', 'p64', 'p65', 'p66', 'p67', 'p68', 'p69', 'p70', 'p71', 'p72', 'p73', 'p74', 'p75', 'p76', 'p77', 'p78', 'p79', 'p80', 'p81', 'p82', 'p83', 'p84', 'p85', 'p86', 'p87', 'p88', 'p89', 'p90', 'p91', 'p92', 'p93', 'p94', 'p95', 'p96', 'p97', 'p98', 'p99']

    def __init__(self, value: str):
        if value not in self.enum_options:
            raise ValueError(f"Value of enum not in allowed values: {self.enum_options}")
        self.value = value


class RowNumber(SchemaBase):
    def __init__(self, row_number: Any, orderby: Union[List["TransformField"], "TransformField"] = ..., partitionby: Union[List["TransformField"], "TransformField"] = ..., range: Union["ParamRef", List[Union[float, Any]]] = ..., rows: Union["ParamRef", List[Union[float, Any]]] = ...):
        self.orderby = orderby
        self.partitionby = partitionby
        self.range = range
        self.row_number = row_number
        self.rows = rows


class SQLExpression(SchemaBase):
    def __init__(self, sql: str, label: str = ...):
        self.label = label
        self.sql = sql


class ScaleName(SchemaBase):
    enum_options = ['x', 'y', 'fx', 'fy', 'r', 'color', 'opacity', 'symbol', 'length']

    def __init__(self, value: str):
        if value not in self.enum_options:
            raise ValueError(f"Value of enum not in allowed values: {self.enum_options}")
        self.value = value


class Selection(SchemaBase):
    def __init__(self, select: str, cross: bool = ..., empty: bool = ...):
        self.cross = cross
        self.empty = empty
        self.select = select


class SortOrder(SchemaBase):
    def __init__(self, value: Union[Dict[str, Any], "ChannelValue"]):
        self.value = value


class Spec(SchemaBase):
    def __init__(self, value: Dict[str, Any]):
        self.value = value


class StackOffsetName(SchemaBase):
    enum_options = ['center', 'normalize', 'wiggle']

    def __init__(self, value: str):
        if value not in self.enum_options:
            raise ValueError(f"Value of enum not in allowed values: {self.enum_options}")
        self.value = value


class StackOrder(SchemaBase):
    def __init__(self, value: Union[List[Any], str, "StackOrderName"]):
        self.value = value


class StackOrderName(SchemaBase):
    enum_options = ['value', 'x', 'y', 'z', 'sum', 'appearance', 'inside-out']

    def __init__(self, value: str):
        if value not in self.enum_options:
            raise ValueError(f"Value of enum not in allowed values: {self.enum_options}")
        self.value = value


class Stddev(SchemaBase):
    def __init__(self, stddev: Union[Union[float, bool, str], List[Union[float, bool, str]]], distinct: bool = ..., orderby: Union[List["TransformField"], "TransformField"] = ..., partitionby: Union[List["TransformField"], "TransformField"] = ..., range: Union["ParamRef", List[Union[float, Any]]] = ..., rows: Union["ParamRef", List[Union[float, Any]]] = ...):
        self.distinct = distinct
        self.orderby = orderby
        self.partitionby = partitionby
        self.range = range
        self.rows = rows
        self.stddev = stddev


class StddevPop(SchemaBase):
    def __init__(self, stddevPop: Union[Union[float, bool, str], List[Union[float, bool, str]]], distinct: bool = ..., orderby: Union[List["TransformField"], "TransformField"] = ..., partitionby: Union[List["TransformField"], "TransformField"] = ..., range: Union["ParamRef", List[Union[float, Any]]] = ..., rows: Union["ParamRef", List[Union[float, Any]]] = ...):
        self.distinct = distinct
        self.orderby = orderby
        self.partitionby = partitionby
        self.range = range
        self.rows = rows
        self.stddevPop = stddevPop


class Sum(SchemaBase):
    def __init__(self, sum: Union[Union[float, bool, str], List[Union[float, bool, str]]], distinct: bool = ..., orderby: Union[List["TransformField"], "TransformField"] = ..., partitionby: Union[List["TransformField"], "TransformField"] = ..., range: Union["ParamRef", List[Union[float, Any]]] = ..., rows: Union["ParamRef", List[Union[float, Any]]] = ...):
        self.distinct = distinct
        self.orderby = orderby
        self.partitionby = partitionby
        self.range = range
        self.rows = rows
        self.sum = sum


class SymbolType(SchemaBase):
    enum_options = ['asterisk', 'circle', 'cross', 'diamond', 'diamond2', 'hexagon', 'plus', 'square', 'square2', 'star', 'times', 'triangle', 'triangle2', 'wye']

    def __init__(self, value: str):
        if value not in self.enum_options:
            raise ValueError(f"Value of enum not in allowed values: {self.enum_options}")
        self.value = value


class TimeIntervalName(SchemaBase):
    enum_options = ['second', 'minute', 'hour', 'day', 'week', 'month', 'quarter', 'half', 'year', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

    def __init__(self, value: str):
        if value not in self.enum_options:
            raise ValueError(f"Value of enum not in allowed values: {self.enum_options}")
        self.value = value


class TipPointer(SchemaBase):
    enum_options = ['x', 'y', 'xy']

    def __init__(self, value: str):
        if value not in self.enum_options:
            raise ValueError(f"Value of enum not in allowed values: {self.enum_options}")
        self.value = value


class Transform(SchemaBase):
    def __init__(self, value: Union["ColumnTransform", "AggregateTransform", "WindowTransform"]):
        self.value = value


class TransformField(SchemaBase):
    def __init__(self, value: Union["ParamRef", str]):
        self.value = value


class VSpace(SchemaBase):
    def __init__(self, vspace: Union[float, str]):
        self.vspace = vspace


class VarPop(SchemaBase):
    def __init__(self, varPop: Union[Union[float, bool, str], List[Union[float, bool, str]]], distinct: bool = ..., orderby: Union[List["TransformField"], "TransformField"] = ..., partitionby: Union[List["TransformField"], "TransformField"] = ..., range: Union["ParamRef", List[Union[float, Any]]] = ..., rows: Union["ParamRef", List[Union[float, Any]]] = ...):
        self.distinct = distinct
        self.orderby = orderby
        self.partitionby = partitionby
        self.range = range
        self.rows = rows
        self.varPop = varPop


class Variance(SchemaBase):
    def __init__(self, variance: Union[Union[float, bool, str], List[Union[float, bool, str]]], distinct: bool = ..., orderby: Union[List["TransformField"], "TransformField"] = ..., partitionby: Union[List["TransformField"], "TransformField"] = ..., range: Union["ParamRef", List[Union[float, Any]]] = ..., rows: Union["ParamRef", List[Union[float, Any]]] = ...):
        self.distinct = distinct
        self.orderby = orderby
        self.partitionby = partitionby
        self.range = range
        self.rows = rows
        self.variance = variance


class VectorShapeName(SchemaBase):
    enum_options = ['arrow', 'spike']

    def __init__(self, value: str):
        if value not in self.enum_options:
            raise ValueError(f"Value of enum not in allowed values: {self.enum_options}")
        self.value = value


class WindowTransform(SchemaBase):
    def __init__(self, value: Union["Lag", "Lead", "NthValue", "Rank", "LastValue", "NTile", "FirstValue", "CumeDist", "DenseRank", "RowNumber", "PercentRank"]):
        self.value = value


class Area(SchemaBase):
    def __init__(self, data: "PlotMarkData", mark: str, ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., clip: Union["ParamRef", bool, str, Any] = ..., curve: Union["ParamRef", "Curve"] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., mixBlendMode: Union["ParamRef", str] = ..., offset: Union["StackOffset", "ParamRef", Any] = ..., opacity: "ChannelValueSpec" = ..., order: Union["ParamRef", "StackOrder", Any] = ..., paintOrder: Union["ParamRef", str] = ..., pointerEvents: Union["ParamRef", str] = ..., reverse: Union["ParamRef", bool] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., target: Union["ParamRef", str] = ..., tension: Union[float, "ParamRef"] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., x1: "ChannelValueSpec" = ..., x2: "ChannelValueSpec" = ..., y1: "ChannelValueSpec" = ..., y2: "ChannelValueSpec" = ..., z: "ChannelValue" = ...):
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.clip = clip
        self.curve = curve
        self.data = data
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.fx = fx
        self.fy = fy
        self.href = href
        self.imageFilter = imageFilter
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.mixBlendMode = mixBlendMode
        self.offset = offset
        self.opacity = opacity
        self.order = order
        self.paintOrder = paintOrder
        self.pointerEvents = pointerEvents
        self.reverse = reverse
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.target = target
        self.tension = tension
        self.tip = tip
        self.title = title
        self.x1 = x1
        self.x2 = x2
        self.y1 = y1
        self.y2 = y2
        self.z = z


class AreaX(SchemaBase):
    def __init__(self, data: "PlotMarkData", mark: str, ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., clip: Union["ParamRef", bool, str, Any] = ..., curve: Union["ParamRef", "Curve"] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., mixBlendMode: Union["ParamRef", str] = ..., offset: Union["StackOffset", "ParamRef", Any] = ..., opacity: "ChannelValueSpec" = ..., order: Union["ParamRef", "StackOrder", Any] = ..., paintOrder: Union["ParamRef", str] = ..., pointerEvents: Union["ParamRef", str] = ..., reverse: Union["ParamRef", bool] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., target: Union["ParamRef", str] = ..., tension: Union[float, "ParamRef"] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., x: "ChannelValueSpec" = ..., x1: "ChannelValueSpec" = ..., x2: "ChannelValueSpec" = ..., y: "ChannelValueSpec" = ..., z: "ChannelValue" = ...):
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.clip = clip
        self.curve = curve
        self.data = data
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.fx = fx
        self.fy = fy
        self.href = href
        self.imageFilter = imageFilter
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.mixBlendMode = mixBlendMode
        self.offset = offset
        self.opacity = opacity
        self.order = order
        self.paintOrder = paintOrder
        self.pointerEvents = pointerEvents
        self.reverse = reverse
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.target = target
        self.tension = tension
        self.tip = tip
        self.title = title
        self.x = x
        self.x1 = x1
        self.x2 = x2
        self.y = y
        self.z = z


class AreaY(SchemaBase):
    def __init__(self, data: "PlotMarkData", mark: str, ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., clip: Union["ParamRef", bool, str, Any] = ..., curve: Union["ParamRef", "Curve"] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., mixBlendMode: Union["ParamRef", str] = ..., offset: Union["StackOffset", "ParamRef", Any] = ..., opacity: "ChannelValueSpec" = ..., order: Union["ParamRef", "StackOrder", Any] = ..., paintOrder: Union["ParamRef", str] = ..., pointerEvents: Union["ParamRef", str] = ..., reverse: Union["ParamRef", bool] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., target: Union["ParamRef", str] = ..., tension: Union[float, "ParamRef"] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., x: "ChannelValueSpec" = ..., y: "ChannelValueSpec" = ..., y1: "ChannelValueSpec" = ..., y2: "ChannelValueSpec" = ..., z: "ChannelValue" = ...):
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.clip = clip
        self.curve = curve
        self.data = data
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.fx = fx
        self.fy = fy
        self.href = href
        self.imageFilter = imageFilter
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.mixBlendMode = mixBlendMode
        self.offset = offset
        self.opacity = opacity
        self.order = order
        self.paintOrder = paintOrder
        self.pointerEvents = pointerEvents
        self.reverse = reverse
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.target = target
        self.tension = tension
        self.tip = tip
        self.title = title
        self.x = x
        self.y = y
        self.y1 = y1
        self.y2 = y2
        self.z = z


class Arrow(SchemaBase):
    def __init__(self, data: "PlotMarkData", mark: str, ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., bend: Union[float, "ParamRef", bool] = ..., clip: Union["ParamRef", bool, str, Any] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., headAngle: Union[float, "ParamRef"] = ..., headLength: Union[float, "ParamRef"] = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., inset: Union[float, "ParamRef"] = ..., insetEnd: Union[float, "ParamRef"] = ..., insetStart: Union[float, "ParamRef"] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., mixBlendMode: Union["ParamRef", str] = ..., opacity: "ChannelValueSpec" = ..., paintOrder: Union["ParamRef", str] = ..., pointerEvents: Union["ParamRef", str] = ..., reverse: Union["ParamRef", bool] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., sweep: Union[float, "ParamRef", str] = ..., target: Union["ParamRef", str] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., x: "ChannelValueSpec" = ..., x1: "ChannelValueSpec" = ..., x2: "ChannelValueSpec" = ..., y: "ChannelValueSpec" = ..., y1: "ChannelValueSpec" = ..., y2: "ChannelValueSpec" = ...):
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.bend = bend
        self.clip = clip
        self.data = data
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.fx = fx
        self.fy = fy
        self.headAngle = headAngle
        self.headLength = headLength
        self.href = href
        self.imageFilter = imageFilter
        self.inset = inset
        self.insetEnd = insetEnd
        self.insetStart = insetStart
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.mixBlendMode = mixBlendMode
        self.opacity = opacity
        self.paintOrder = paintOrder
        self.pointerEvents = pointerEvents
        self.reverse = reverse
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.sweep = sweep
        self.target = target
        self.tip = tip
        self.title = title
        self.x = x
        self.x1 = x1
        self.x2 = x2
        self.y = y
        self.y1 = y1
        self.y2 = y2


class AxisFx(SchemaBase):
    def __init__(self, mark: str, anchor: Union["ParamRef", str] = ..., ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., clip: Union["ParamRef", bool, str, Any] = ..., color: Union["ParamRef", "ChannelValueSpec"] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., fontFamily: Union["ParamRef", str] = ..., fontSize: Union["ParamRef", "ChannelValue"] = ..., fontStyle: Union["ParamRef", str] = ..., fontVariant: Union["ParamRef", str] = ..., fontWeight: Union[float, "ParamRef", str] = ..., frameAnchor: Union["ParamRef", "FrameAnchor"] = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., inset: Union[float, "ParamRef"] = ..., insetBottom: Union[float, "ParamRef"] = ..., insetTop: Union[float, "ParamRef"] = ..., interval: Union["ParamRef", "Interval"] = ..., label: Union["ParamRef", str, Any] = ..., labelAnchor: Union["ParamRef", str] = ..., labelArrow: Union["ParamRef", bool, str, Any] = ..., labelOffset: Union[float, "ParamRef"] = ..., lineAnchor: Union["ParamRef", str] = ..., lineHeight: Union[float, "ParamRef"] = ..., lineWidth: Union[float, "ParamRef"] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., marker: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerEnd: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerMid: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerStart: Union["MarkerName", str, "ParamRef", bool, Any] = ..., mixBlendMode: Union["ParamRef", str] = ..., monospace: Union["ParamRef", bool] = ..., opacity: "ChannelValueSpec" = ..., paintOrder: Union["ParamRef", str] = ..., pointerEvents: Union["ParamRef", str] = ..., reverse: Union["ParamRef", bool] = ..., rotate: Union["ParamRef", "ChannelValue"] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., target: Union["ParamRef", str] = ..., text: "ChannelValue" = ..., textAnchor: Union["ParamRef", str] = ..., textOverflow: Union["ParamRef", str, Any] = ..., textStroke: Union["ParamRef", "ChannelValueSpec"] = ..., textStrokeOpacity: "ChannelValueSpec" = ..., textStrokeWidth: "ChannelValueSpec" = ..., tickFormat: Union["ParamRef", str, Any] = ..., tickPadding: Union[float, "ParamRef"] = ..., tickRotate: Union[float, "ParamRef"] = ..., tickSize: Union[float, "ParamRef"] = ..., tickSpacing: Union[float, "ParamRef"] = ..., ticks: Union[float, "ParamRef", List[Any], "Interval"] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., x: "ChannelValueSpec" = ..., y: "ChannelValueSpec" = ..., z: "ChannelValue" = ...):
        self.anchor = anchor
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.clip = clip
        self.color = color
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.fontFamily = fontFamily
        self.fontSize = fontSize
        self.fontStyle = fontStyle
        self.fontVariant = fontVariant
        self.fontWeight = fontWeight
        self.frameAnchor = frameAnchor
        self.fx = fx
        self.fy = fy
        self.href = href
        self.imageFilter = imageFilter
        self.inset = inset
        self.insetBottom = insetBottom
        self.insetTop = insetTop
        self.interval = interval
        self.label = label
        self.labelAnchor = labelAnchor
        self.labelArrow = labelArrow
        self.labelOffset = labelOffset
        self.lineAnchor = lineAnchor
        self.lineHeight = lineHeight
        self.lineWidth = lineWidth
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.marker = marker
        self.markerEnd = markerEnd
        self.markerMid = markerMid
        self.markerStart = markerStart
        self.mixBlendMode = mixBlendMode
        self.monospace = monospace
        self.opacity = opacity
        self.paintOrder = paintOrder
        self.pointerEvents = pointerEvents
        self.reverse = reverse
        self.rotate = rotate
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.target = target
        self.text = text
        self.textAnchor = textAnchor
        self.textOverflow = textOverflow
        self.textStroke = textStroke
        self.textStrokeOpacity = textStrokeOpacity
        self.textStrokeWidth = textStrokeWidth
        self.tickFormat = tickFormat
        self.tickPadding = tickPadding
        self.tickRotate = tickRotate
        self.tickSize = tickSize
        self.tickSpacing = tickSpacing
        self.ticks = ticks
        self.tip = tip
        self.title = title
        self.x = x
        self.y = y
        self.z = z


class AxisFy(SchemaBase):
    def __init__(self, mark: str, anchor: Union["ParamRef", str] = ..., ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., clip: Union["ParamRef", bool, str, Any] = ..., color: Union["ParamRef", "ChannelValueSpec"] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., fontFamily: Union["ParamRef", str] = ..., fontSize: Union["ParamRef", "ChannelValue"] = ..., fontStyle: Union["ParamRef", str] = ..., fontVariant: Union["ParamRef", str] = ..., fontWeight: Union[float, "ParamRef", str] = ..., frameAnchor: Union["ParamRef", "FrameAnchor"] = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., inset: Union[float, "ParamRef"] = ..., insetLeft: Union[float, "ParamRef"] = ..., insetRight: Union[float, "ParamRef"] = ..., interval: Union["ParamRef", "Interval"] = ..., label: Union["ParamRef", str, Any] = ..., labelAnchor: Union["ParamRef", str] = ..., labelArrow: Union["ParamRef", bool, str, Any] = ..., labelOffset: Union[float, "ParamRef"] = ..., lineAnchor: Union["ParamRef", str] = ..., lineHeight: Union[float, "ParamRef"] = ..., lineWidth: Union[float, "ParamRef"] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., marker: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerEnd: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerMid: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerStart: Union["MarkerName", str, "ParamRef", bool, Any] = ..., mixBlendMode: Union["ParamRef", str] = ..., monospace: Union["ParamRef", bool] = ..., opacity: "ChannelValueSpec" = ..., paintOrder: Union["ParamRef", str] = ..., pointerEvents: Union["ParamRef", str] = ..., reverse: Union["ParamRef", bool] = ..., rotate: Union["ParamRef", "ChannelValue"] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., target: Union["ParamRef", str] = ..., text: "ChannelValue" = ..., textAnchor: Union["ParamRef", str] = ..., textOverflow: Union["ParamRef", str, Any] = ..., textStroke: Union["ParamRef", "ChannelValueSpec"] = ..., textStrokeOpacity: "ChannelValueSpec" = ..., textStrokeWidth: "ChannelValueSpec" = ..., tickFormat: Union["ParamRef", str, Any] = ..., tickPadding: Union[float, "ParamRef"] = ..., tickRotate: Union[float, "ParamRef"] = ..., tickSize: Union[float, "ParamRef"] = ..., tickSpacing: Union[float, "ParamRef"] = ..., ticks: Union[float, "ParamRef", List[Any], "Interval"] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., x: "ChannelValueSpec" = ..., y: "ChannelValueSpec" = ..., z: "ChannelValue" = ...):
        self.anchor = anchor
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.clip = clip
        self.color = color
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.fontFamily = fontFamily
        self.fontSize = fontSize
        self.fontStyle = fontStyle
        self.fontVariant = fontVariant
        self.fontWeight = fontWeight
        self.frameAnchor = frameAnchor
        self.fx = fx
        self.fy = fy
        self.href = href
        self.imageFilter = imageFilter
        self.inset = inset
        self.insetLeft = insetLeft
        self.insetRight = insetRight
        self.interval = interval
        self.label = label
        self.labelAnchor = labelAnchor
        self.labelArrow = labelArrow
        self.labelOffset = labelOffset
        self.lineAnchor = lineAnchor
        self.lineHeight = lineHeight
        self.lineWidth = lineWidth
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.marker = marker
        self.markerEnd = markerEnd
        self.markerMid = markerMid
        self.markerStart = markerStart
        self.mixBlendMode = mixBlendMode
        self.monospace = monospace
        self.opacity = opacity
        self.paintOrder = paintOrder
        self.pointerEvents = pointerEvents
        self.reverse = reverse
        self.rotate = rotate
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.target = target
        self.text = text
        self.textAnchor = textAnchor
        self.textOverflow = textOverflow
        self.textStroke = textStroke
        self.textStrokeOpacity = textStrokeOpacity
        self.textStrokeWidth = textStrokeWidth
        self.tickFormat = tickFormat
        self.tickPadding = tickPadding
        self.tickRotate = tickRotate
        self.tickSize = tickSize
        self.tickSpacing = tickSpacing
        self.ticks = ticks
        self.tip = tip
        self.title = title
        self.x = x
        self.y = y
        self.z = z


class AxisX(SchemaBase):
    def __init__(self, mark: str, anchor: Union["ParamRef", str] = ..., ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., clip: Union["ParamRef", bool, str, Any] = ..., color: Union["ParamRef", "ChannelValueSpec"] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., fontFamily: Union["ParamRef", str] = ..., fontSize: Union["ParamRef", "ChannelValue"] = ..., fontStyle: Union["ParamRef", str] = ..., fontVariant: Union["ParamRef", str] = ..., fontWeight: Union[float, "ParamRef", str] = ..., frameAnchor: Union["ParamRef", "FrameAnchor"] = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., inset: Union[float, "ParamRef"] = ..., insetBottom: Union[float, "ParamRef"] = ..., insetTop: Union[float, "ParamRef"] = ..., interval: Union["ParamRef", "Interval"] = ..., label: Union["ParamRef", str, Any] = ..., labelAnchor: Union["ParamRef", str] = ..., labelArrow: Union["ParamRef", bool, str, Any] = ..., labelOffset: Union[float, "ParamRef"] = ..., lineAnchor: Union["ParamRef", str] = ..., lineHeight: Union[float, "ParamRef"] = ..., lineWidth: Union[float, "ParamRef"] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., marker: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerEnd: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerMid: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerStart: Union["MarkerName", str, "ParamRef", bool, Any] = ..., mixBlendMode: Union["ParamRef", str] = ..., monospace: Union["ParamRef", bool] = ..., opacity: "ChannelValueSpec" = ..., paintOrder: Union["ParamRef", str] = ..., pointerEvents: Union["ParamRef", str] = ..., reverse: Union["ParamRef", bool] = ..., rotate: Union["ParamRef", "ChannelValue"] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., target: Union["ParamRef", str] = ..., text: "ChannelValue" = ..., textAnchor: Union["ParamRef", str] = ..., textOverflow: Union["ParamRef", str, Any] = ..., textStroke: Union["ParamRef", "ChannelValueSpec"] = ..., textStrokeOpacity: "ChannelValueSpec" = ..., textStrokeWidth: "ChannelValueSpec" = ..., tickFormat: Union["ParamRef", str, Any] = ..., tickPadding: Union[float, "ParamRef"] = ..., tickRotate: Union[float, "ParamRef"] = ..., tickSize: Union[float, "ParamRef"] = ..., tickSpacing: Union[float, "ParamRef"] = ..., ticks: Union[float, "ParamRef", List[Any], "Interval"] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., x: "ChannelValueSpec" = ..., y: "ChannelValueSpec" = ..., z: "ChannelValue" = ...):
        self.anchor = anchor
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.clip = clip
        self.color = color
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.fontFamily = fontFamily
        self.fontSize = fontSize
        self.fontStyle = fontStyle
        self.fontVariant = fontVariant
        self.fontWeight = fontWeight
        self.frameAnchor = frameAnchor
        self.fx = fx
        self.fy = fy
        self.href = href
        self.imageFilter = imageFilter
        self.inset = inset
        self.insetBottom = insetBottom
        self.insetTop = insetTop
        self.interval = interval
        self.label = label
        self.labelAnchor = labelAnchor
        self.labelArrow = labelArrow
        self.labelOffset = labelOffset
        self.lineAnchor = lineAnchor
        self.lineHeight = lineHeight
        self.lineWidth = lineWidth
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.marker = marker
        self.markerEnd = markerEnd
        self.markerMid = markerMid
        self.markerStart = markerStart
        self.mixBlendMode = mixBlendMode
        self.monospace = monospace
        self.opacity = opacity
        self.paintOrder = paintOrder
        self.pointerEvents = pointerEvents
        self.reverse = reverse
        self.rotate = rotate
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.target = target
        self.text = text
        self.textAnchor = textAnchor
        self.textOverflow = textOverflow
        self.textStroke = textStroke
        self.textStrokeOpacity = textStrokeOpacity
        self.textStrokeWidth = textStrokeWidth
        self.tickFormat = tickFormat
        self.tickPadding = tickPadding
        self.tickRotate = tickRotate
        self.tickSize = tickSize
        self.tickSpacing = tickSpacing
        self.ticks = ticks
        self.tip = tip
        self.title = title
        self.x = x
        self.y = y
        self.z = z


class AxisY(SchemaBase):
    def __init__(self, mark: str, anchor: Union["ParamRef", str] = ..., ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., clip: Union["ParamRef", bool, str, Any] = ..., color: Union["ParamRef", "ChannelValueSpec"] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., fontFamily: Union["ParamRef", str] = ..., fontSize: Union["ParamRef", "ChannelValue"] = ..., fontStyle: Union["ParamRef", str] = ..., fontVariant: Union["ParamRef", str] = ..., fontWeight: Union[float, "ParamRef", str] = ..., frameAnchor: Union["ParamRef", "FrameAnchor"] = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., inset: Union[float, "ParamRef"] = ..., insetLeft: Union[float, "ParamRef"] = ..., insetRight: Union[float, "ParamRef"] = ..., interval: Union["ParamRef", "Interval"] = ..., label: Union["ParamRef", str, Any] = ..., labelAnchor: Union["ParamRef", str] = ..., labelArrow: Union["ParamRef", bool, str, Any] = ..., labelOffset: Union[float, "ParamRef"] = ..., lineAnchor: Union["ParamRef", str] = ..., lineHeight: Union[float, "ParamRef"] = ..., lineWidth: Union[float, "ParamRef"] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., marker: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerEnd: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerMid: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerStart: Union["MarkerName", str, "ParamRef", bool, Any] = ..., mixBlendMode: Union["ParamRef", str] = ..., monospace: Union["ParamRef", bool] = ..., opacity: "ChannelValueSpec" = ..., paintOrder: Union["ParamRef", str] = ..., pointerEvents: Union["ParamRef", str] = ..., reverse: Union["ParamRef", bool] = ..., rotate: Union["ParamRef", "ChannelValue"] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., target: Union["ParamRef", str] = ..., text: "ChannelValue" = ..., textAnchor: Union["ParamRef", str] = ..., textOverflow: Union["ParamRef", str, Any] = ..., textStroke: Union["ParamRef", "ChannelValueSpec"] = ..., textStrokeOpacity: "ChannelValueSpec" = ..., textStrokeWidth: "ChannelValueSpec" = ..., tickFormat: Union["ParamRef", str, Any] = ..., tickPadding: Union[float, "ParamRef"] = ..., tickRotate: Union[float, "ParamRef"] = ..., tickSize: Union[float, "ParamRef"] = ..., tickSpacing: Union[float, "ParamRef"] = ..., ticks: Union[float, "ParamRef", List[Any], "Interval"] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., x: "ChannelValueSpec" = ..., y: "ChannelValueSpec" = ..., z: "ChannelValue" = ...):
        self.anchor = anchor
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.clip = clip
        self.color = color
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.fontFamily = fontFamily
        self.fontSize = fontSize
        self.fontStyle = fontStyle
        self.fontVariant = fontVariant
        self.fontWeight = fontWeight
        self.frameAnchor = frameAnchor
        self.fx = fx
        self.fy = fy
        self.href = href
        self.imageFilter = imageFilter
        self.inset = inset
        self.insetLeft = insetLeft
        self.insetRight = insetRight
        self.interval = interval
        self.label = label
        self.labelAnchor = labelAnchor
        self.labelArrow = labelArrow
        self.labelOffset = labelOffset
        self.lineAnchor = lineAnchor
        self.lineHeight = lineHeight
        self.lineWidth = lineWidth
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.marker = marker
        self.markerEnd = markerEnd
        self.markerMid = markerMid
        self.markerStart = markerStart
        self.mixBlendMode = mixBlendMode
        self.monospace = monospace
        self.opacity = opacity
        self.paintOrder = paintOrder
        self.pointerEvents = pointerEvents
        self.reverse = reverse
        self.rotate = rotate
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.target = target
        self.text = text
        self.textAnchor = textAnchor
        self.textOverflow = textOverflow
        self.textStroke = textStroke
        self.textStrokeOpacity = textStrokeOpacity
        self.textStrokeWidth = textStrokeWidth
        self.tickFormat = tickFormat
        self.tickPadding = tickPadding
        self.tickRotate = tickRotate
        self.tickSize = tickSize
        self.tickSpacing = tickSpacing
        self.ticks = ticks
        self.tip = tip
        self.title = title
        self.x = x
        self.y = y
        self.z = z


class Cell(SchemaBase):
    def __init__(self, data: "PlotMarkData", mark: str, ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., clip: Union["ParamRef", bool, str, Any] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., inset: Union[float, "ParamRef"] = ..., insetBottom: Union[float, "ParamRef"] = ..., insetLeft: Union[float, "ParamRef"] = ..., insetRight: Union[float, "ParamRef"] = ..., insetTop: Union[float, "ParamRef"] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., mixBlendMode: Union["ParamRef", str] = ..., opacity: "ChannelValueSpec" = ..., paintOrder: Union["ParamRef", str] = ..., pointerEvents: Union["ParamRef", str] = ..., reverse: Union["ParamRef", bool] = ..., rx: Union[float, "ParamRef", str] = ..., ry: Union[float, "ParamRef", str] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., target: Union["ParamRef", str] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., x: "ChannelValueSpec" = ..., y: "ChannelValueSpec" = ...):
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.clip = clip
        self.data = data
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.fx = fx
        self.fy = fy
        self.href = href
        self.imageFilter = imageFilter
        self.inset = inset
        self.insetBottom = insetBottom
        self.insetLeft = insetLeft
        self.insetRight = insetRight
        self.insetTop = insetTop
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.mixBlendMode = mixBlendMode
        self.opacity = opacity
        self.paintOrder = paintOrder
        self.pointerEvents = pointerEvents
        self.reverse = reverse
        self.rx = rx
        self.ry = ry
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.target = target
        self.tip = tip
        self.title = title
        self.x = x
        self.y = y


class CellX(SchemaBase):
    def __init__(self, data: "PlotMarkData", mark: str, ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., clip: Union["ParamRef", bool, str, Any] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., inset: Union[float, "ParamRef"] = ..., insetBottom: Union[float, "ParamRef"] = ..., insetLeft: Union[float, "ParamRef"] = ..., insetRight: Union[float, "ParamRef"] = ..., insetTop: Union[float, "ParamRef"] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., mixBlendMode: Union["ParamRef", str] = ..., opacity: "ChannelValueSpec" = ..., paintOrder: Union["ParamRef", str] = ..., pointerEvents: Union["ParamRef", str] = ..., reverse: Union["ParamRef", bool] = ..., rx: Union[float, "ParamRef", str] = ..., ry: Union[float, "ParamRef", str] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., target: Union["ParamRef", str] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., x: "ChannelValueSpec" = ..., y: "ChannelValueSpec" = ...):
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.clip = clip
        self.data = data
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.fx = fx
        self.fy = fy
        self.href = href
        self.imageFilter = imageFilter
        self.inset = inset
        self.insetBottom = insetBottom
        self.insetLeft = insetLeft
        self.insetRight = insetRight
        self.insetTop = insetTop
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.mixBlendMode = mixBlendMode
        self.opacity = opacity
        self.paintOrder = paintOrder
        self.pointerEvents = pointerEvents
        self.reverse = reverse
        self.rx = rx
        self.ry = ry
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.target = target
        self.tip = tip
        self.title = title
        self.x = x
        self.y = y


class CellY(SchemaBase):
    def __init__(self, data: "PlotMarkData", mark: str, ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., clip: Union["ParamRef", bool, str, Any] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., inset: Union[float, "ParamRef"] = ..., insetBottom: Union[float, "ParamRef"] = ..., insetLeft: Union[float, "ParamRef"] = ..., insetRight: Union[float, "ParamRef"] = ..., insetTop: Union[float, "ParamRef"] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., mixBlendMode: Union["ParamRef", str] = ..., opacity: "ChannelValueSpec" = ..., paintOrder: Union["ParamRef", str] = ..., pointerEvents: Union["ParamRef", str] = ..., reverse: Union["ParamRef", bool] = ..., rx: Union[float, "ParamRef", str] = ..., ry: Union[float, "ParamRef", str] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., target: Union["ParamRef", str] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., x: "ChannelValueSpec" = ..., y: "ChannelValueSpec" = ...):
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.clip = clip
        self.data = data
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.fx = fx
        self.fy = fy
        self.href = href
        self.imageFilter = imageFilter
        self.inset = inset
        self.insetBottom = insetBottom
        self.insetLeft = insetLeft
        self.insetRight = insetRight
        self.insetTop = insetTop
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.mixBlendMode = mixBlendMode
        self.opacity = opacity
        self.paintOrder = paintOrder
        self.pointerEvents = pointerEvents
        self.reverse = reverse
        self.rx = rx
        self.ry = ry
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.target = target
        self.tip = tip
        self.title = title
        self.x = x
        self.y = y


class Circle(SchemaBase):
    def __init__(self, data: "PlotMarkData", mark: str, ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., clip: Union["ParamRef", bool, str, Any] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., frameAnchor: Union["ParamRef", "FrameAnchor"] = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., mixBlendMode: Union["ParamRef", str] = ..., opacity: "ChannelValueSpec" = ..., paintOrder: Union["ParamRef", str] = ..., pointerEvents: Union["ParamRef", str] = ..., r: Union[float, "ParamRef", "ChannelValueSpec"] = ..., reverse: Union["ParamRef", bool] = ..., rotate: Union[float, "ParamRef", "ChannelValue"] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., symbol: Union["ParamRef", "SymbolType", "ChannelValueSpec"] = ..., target: Union["ParamRef", str] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., x: "ChannelValueSpec" = ..., y: "ChannelValueSpec" = ..., z: "ChannelValue" = ...):
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.clip = clip
        self.data = data
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.frameAnchor = frameAnchor
        self.fx = fx
        self.fy = fy
        self.href = href
        self.imageFilter = imageFilter
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.mixBlendMode = mixBlendMode
        self.opacity = opacity
        self.paintOrder = paintOrder
        self.pointerEvents = pointerEvents
        self.r = r
        self.reverse = reverse
        self.rotate = rotate
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.symbol = symbol
        self.target = target
        self.tip = tip
        self.title = title
        self.x = x
        self.y = y
        self.z = z


class Contour(SchemaBase):
    def __init__(self, data: "PlotMarkData", mark: str, ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., bandwidth: Union[float, "ParamRef"] = ..., clip: Union["ParamRef", bool, str, Any] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., height: Union[float, "ParamRef"] = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., interpolate: Union["GridInterpolate", "ParamRef", Any] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., mixBlendMode: Union["ParamRef", str] = ..., opacity: "ChannelValueSpec" = ..., pad: Union[float, "ParamRef"] = ..., paintOrder: Union["ParamRef", str] = ..., pixelSize: Union[float, "ParamRef"] = ..., pointerEvents: Union["ParamRef", str] = ..., reverse: Union["ParamRef", bool] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., target: Union["ParamRef", str] = ..., thresholds: Union[float, "ParamRef", List[float]] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., width: Union[float, "ParamRef"] = ..., x: "ChannelValueSpec" = ..., y: "ChannelValueSpec" = ...):
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.bandwidth = bandwidth
        self.clip = clip
        self.data = data
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.fx = fx
        self.fy = fy
        self.height = height
        self.href = href
        self.imageFilter = imageFilter
        self.interpolate = interpolate
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.mixBlendMode = mixBlendMode
        self.opacity = opacity
        self.pad = pad
        self.paintOrder = paintOrder
        self.pixelSize = pixelSize
        self.pointerEvents = pointerEvents
        self.reverse = reverse
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.target = target
        self.thresholds = thresholds
        self.tip = tip
        self.title = title
        self.width = width
        self.x = x
        self.y = y


class DelaunayLink(SchemaBase):
    def __init__(self, data: "PlotMarkData", mark: str, ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., clip: Union["ParamRef", bool, str, Any] = ..., curve: Union["ParamRef", "Curve"] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., marker: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerEnd: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerMid: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerStart: Union["MarkerName", str, "ParamRef", bool, Any] = ..., mixBlendMode: Union["ParamRef", str] = ..., opacity: "ChannelValueSpec" = ..., paintOrder: Union["ParamRef", str] = ..., pointerEvents: Union["ParamRef", str] = ..., reverse: Union["ParamRef", bool] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., target: Union["ParamRef", str] = ..., tension: Union[float, "ParamRef"] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., x: "ChannelValueSpec" = ..., y: "ChannelValueSpec" = ..., z: "ChannelValue" = ...):
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.clip = clip
        self.curve = curve
        self.data = data
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.fx = fx
        self.fy = fy
        self.href = href
        self.imageFilter = imageFilter
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.marker = marker
        self.markerEnd = markerEnd
        self.markerMid = markerMid
        self.markerStart = markerStart
        self.mixBlendMode = mixBlendMode
        self.opacity = opacity
        self.paintOrder = paintOrder
        self.pointerEvents = pointerEvents
        self.reverse = reverse
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.target = target
        self.tension = tension
        self.tip = tip
        self.title = title
        self.x = x
        self.y = y
        self.z = z


class DelaunayMesh(SchemaBase):
    def __init__(self, data: "PlotMarkData", mark: str, ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., clip: Union["ParamRef", bool, str, Any] = ..., curve: Union["ParamRef", "Curve"] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., marker: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerEnd: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerMid: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerStart: Union["MarkerName", str, "ParamRef", bool, Any] = ..., mixBlendMode: Union["ParamRef", str] = ..., opacity: "ChannelValueSpec" = ..., paintOrder: Union["ParamRef", str] = ..., pointerEvents: Union["ParamRef", str] = ..., reverse: Union["ParamRef", bool] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., target: Union["ParamRef", str] = ..., tension: Union[float, "ParamRef"] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., x: "ChannelValueSpec" = ..., y: "ChannelValueSpec" = ..., z: "ChannelValue" = ...):
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.clip = clip
        self.curve = curve
        self.data = data
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.fx = fx
        self.fy = fy
        self.href = href
        self.imageFilter = imageFilter
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.marker = marker
        self.markerEnd = markerEnd
        self.markerMid = markerMid
        self.markerStart = markerStart
        self.mixBlendMode = mixBlendMode
        self.opacity = opacity
        self.paintOrder = paintOrder
        self.pointerEvents = pointerEvents
        self.reverse = reverse
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.target = target
        self.tension = tension
        self.tip = tip
        self.title = title
        self.x = x
        self.y = y
        self.z = z


class DenseLine(SchemaBase):
    def __init__(self, data: "PlotMarkData", mark: str, ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., bandwidth: Union[float, "ParamRef"] = ..., clip: Union["ParamRef", bool, str, Any] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., height: Union[float, "ParamRef"] = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., imageRendering: Union["ParamRef", str] = ..., interpolate: Union["GridInterpolate", "ParamRef", Any] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., mixBlendMode: Union["ParamRef", str] = ..., normalize: Union["ParamRef", bool] = ..., opacity: "ChannelValueSpec" = ..., pad: Union[float, "ParamRef"] = ..., paintOrder: Union["ParamRef", str] = ..., pixelSize: Union[float, "ParamRef"] = ..., pointerEvents: Union["ParamRef", str] = ..., reverse: Union["ParamRef", bool] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., target: Union["ParamRef", str] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., width: Union[float, "ParamRef"] = ..., x: "ChannelValueSpec" = ..., y: "ChannelValueSpec" = ..., z: "ChannelValue" = ...):
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.bandwidth = bandwidth
        self.clip = clip
        self.data = data
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.fx = fx
        self.fy = fy
        self.height = height
        self.href = href
        self.imageFilter = imageFilter
        self.imageRendering = imageRendering
        self.interpolate = interpolate
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.mixBlendMode = mixBlendMode
        self.normalize = normalize
        self.opacity = opacity
        self.pad = pad
        self.paintOrder = paintOrder
        self.pixelSize = pixelSize
        self.pointerEvents = pointerEvents
        self.reverse = reverse
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.target = target
        self.tip = tip
        self.title = title
        self.width = width
        self.x = x
        self.y = y
        self.z = z


class Density(SchemaBase):
    def __init__(self, data: "PlotMarkData", mark: str, ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., bandwidth: Union[float, "ParamRef"] = ..., clip: Union["ParamRef", bool, str, Any] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., fontFamily: Union["ParamRef", str] = ..., fontSize: Union["ParamRef", "ChannelValue"] = ..., fontStyle: Union["ParamRef", str] = ..., fontVariant: Union["ParamRef", str] = ..., fontWeight: Union[float, "ParamRef", str] = ..., frameAnchor: Union["ParamRef", "FrameAnchor"] = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., height: Union[float, "ParamRef"] = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., interpolate: Union["GridInterpolate", "ParamRef", Any] = ..., lineHeight: Union[float, "ParamRef"] = ..., lineWidth: Union[float, "ParamRef"] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., mixBlendMode: Union["ParamRef", str] = ..., monospace: Union["ParamRef", bool] = ..., opacity: "ChannelValueSpec" = ..., pad: Union[float, "ParamRef"] = ..., paintOrder: Union["ParamRef", str] = ..., pixelSize: Union[float, "ParamRef"] = ..., pointerEvents: Union["ParamRef", str] = ..., r: Union[float, "ParamRef", "ChannelValueSpec"] = ..., reverse: Union["ParamRef", bool] = ..., rotate: Union[float, "ParamRef", "ChannelValue"] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., symbol: Union["ParamRef", "SymbolType", "ChannelValueSpec"] = ..., target: Union["ParamRef", str] = ..., textAnchor: Union["ParamRef", str] = ..., textOverflow: Union["ParamRef", str, Any] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., type: Union["ParamRef", str] = ..., width: Union[float, "ParamRef"] = ..., x: "ChannelValueSpec" = ..., y: "ChannelValueSpec" = ..., z: "ChannelValue" = ...):
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.bandwidth = bandwidth
        self.clip = clip
        self.data = data
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.fontFamily = fontFamily
        self.fontSize = fontSize
        self.fontStyle = fontStyle
        self.fontVariant = fontVariant
        self.fontWeight = fontWeight
        self.frameAnchor = frameAnchor
        self.fx = fx
        self.fy = fy
        self.height = height
        self.href = href
        self.imageFilter = imageFilter
        self.interpolate = interpolate
        self.lineHeight = lineHeight
        self.lineWidth = lineWidth
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.mixBlendMode = mixBlendMode
        self.monospace = monospace
        self.opacity = opacity
        self.pad = pad
        self.paintOrder = paintOrder
        self.pixelSize = pixelSize
        self.pointerEvents = pointerEvents
        self.r = r
        self.reverse = reverse
        self.rotate = rotate
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.symbol = symbol
        self.target = target
        self.textAnchor = textAnchor
        self.textOverflow = textOverflow
        self.tip = tip
        self.title = title
        self.type = type
        self.width = width
        self.x = x
        self.y = y
        self.z = z


class Dot(SchemaBase):
    def __init__(self, data: "PlotMarkData", mark: str, ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., clip: Union["ParamRef", bool, str, Any] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., frameAnchor: Union["ParamRef", "FrameAnchor"] = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., mixBlendMode: Union["ParamRef", str] = ..., opacity: "ChannelValueSpec" = ..., paintOrder: Union["ParamRef", str] = ..., pointerEvents: Union["ParamRef", str] = ..., r: Union[float, "ParamRef", "ChannelValueSpec"] = ..., reverse: Union["ParamRef", bool] = ..., rotate: Union[float, "ParamRef", "ChannelValue"] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., symbol: Union["ParamRef", "SymbolType", "ChannelValueSpec"] = ..., target: Union["ParamRef", str] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., x: "ChannelValueSpec" = ..., y: "ChannelValueSpec" = ..., z: "ChannelValue" = ...):
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.clip = clip
        self.data = data
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.frameAnchor = frameAnchor
        self.fx = fx
        self.fy = fy
        self.href = href
        self.imageFilter = imageFilter
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.mixBlendMode = mixBlendMode
        self.opacity = opacity
        self.paintOrder = paintOrder
        self.pointerEvents = pointerEvents
        self.r = r
        self.reverse = reverse
        self.rotate = rotate
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.symbol = symbol
        self.target = target
        self.tip = tip
        self.title = title
        self.x = x
        self.y = y
        self.z = z


class ErrorBarX(SchemaBase):
    def __init__(self, data: "PlotMarkData", mark: str, x: "ChannelValueSpec", ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., ci: Union[float, "ParamRef"] = ..., clip: Union["ParamRef", bool, str, Any] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., marker: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerEnd: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerMid: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerStart: Union["MarkerName", str, "ParamRef", bool, Any] = ..., mixBlendMode: Union["ParamRef", str] = ..., opacity: "ChannelValueSpec" = ..., paintOrder: Union["ParamRef", str] = ..., pointerEvents: Union["ParamRef", str] = ..., reverse: Union["ParamRef", bool] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., target: Union["ParamRef", str] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., y: "ChannelValueSpec" = ..., z: "ChannelValue" = ...):
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.ci = ci
        self.clip = clip
        self.data = data
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.fx = fx
        self.fy = fy
        self.href = href
        self.imageFilter = imageFilter
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.marker = marker
        self.markerEnd = markerEnd
        self.markerMid = markerMid
        self.markerStart = markerStart
        self.mixBlendMode = mixBlendMode
        self.opacity = opacity
        self.paintOrder = paintOrder
        self.pointerEvents = pointerEvents
        self.reverse = reverse
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.target = target
        self.tip = tip
        self.title = title
        self.x = x
        self.y = y
        self.z = z


class ErrorBarY(SchemaBase):
    def __init__(self, data: "PlotMarkData", mark: str, y: "ChannelValueSpec", ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., ci: Union[float, "ParamRef"] = ..., clip: Union["ParamRef", bool, str, Any] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., marker: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerEnd: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerMid: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerStart: Union["MarkerName", str, "ParamRef", bool, Any] = ..., mixBlendMode: Union["ParamRef", str] = ..., opacity: "ChannelValueSpec" = ..., paintOrder: Union["ParamRef", str] = ..., pointerEvents: Union["ParamRef", str] = ..., reverse: Union["ParamRef", bool] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., target: Union["ParamRef", str] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., x: "ChannelValueSpec" = ..., z: "ChannelValue" = ...):
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.ci = ci
        self.clip = clip
        self.data = data
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.fx = fx
        self.fy = fy
        self.href = href
        self.imageFilter = imageFilter
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.marker = marker
        self.markerEnd = markerEnd
        self.markerMid = markerMid
        self.markerStart = markerStart
        self.mixBlendMode = mixBlendMode
        self.opacity = opacity
        self.paintOrder = paintOrder
        self.pointerEvents = pointerEvents
        self.reverse = reverse
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.target = target
        self.tip = tip
        self.title = title
        self.x = x
        self.y = y
        self.z = z


class Frame(SchemaBase):
    def __init__(self, mark: str, anchor: Union["ParamRef", str, Any] = ..., ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., clip: Union["ParamRef", bool, str, Any] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., inset: Union[float, "ParamRef"] = ..., insetBottom: Union[float, "ParamRef"] = ..., insetLeft: Union[float, "ParamRef"] = ..., insetRight: Union[float, "ParamRef"] = ..., insetTop: Union[float, "ParamRef"] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., mixBlendMode: Union["ParamRef", str] = ..., opacity: "ChannelValueSpec" = ..., paintOrder: Union["ParamRef", str] = ..., pointerEvents: Union["ParamRef", str] = ..., reverse: Union["ParamRef", bool] = ..., rx: Union[float, "ParamRef", str] = ..., ry: Union[float, "ParamRef", str] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., target: Union["ParamRef", str] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ...):
        self.anchor = anchor
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.clip = clip
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.fx = fx
        self.fy = fy
        self.href = href
        self.imageFilter = imageFilter
        self.inset = inset
        self.insetBottom = insetBottom
        self.insetLeft = insetLeft
        self.insetRight = insetRight
        self.insetTop = insetTop
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.mixBlendMode = mixBlendMode
        self.opacity = opacity
        self.paintOrder = paintOrder
        self.pointerEvents = pointerEvents
        self.reverse = reverse
        self.rx = rx
        self.ry = ry
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.target = target
        self.tip = tip
        self.title = title


class Geo(SchemaBase):
    def __init__(self, data: "PlotMarkData", mark: str, ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., clip: Union["ParamRef", bool, str, Any] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., geometry: "ChannelValue" = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., mixBlendMode: Union["ParamRef", str] = ..., opacity: "ChannelValueSpec" = ..., paintOrder: Union["ParamRef", str] = ..., pointerEvents: Union["ParamRef", str] = ..., r: Union["ParamRef", "ChannelValueSpec"] = ..., reverse: Union["ParamRef", bool] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., target: Union["ParamRef", str] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ...):
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.clip = clip
        self.data = data
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.fx = fx
        self.fy = fy
        self.geometry = geometry
        self.href = href
        self.imageFilter = imageFilter
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.mixBlendMode = mixBlendMode
        self.opacity = opacity
        self.paintOrder = paintOrder
        self.pointerEvents = pointerEvents
        self.r = r
        self.reverse = reverse
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.target = target
        self.tip = tip
        self.title = title


class Graticule(SchemaBase):
    def __init__(self, mark: str, ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., clip: Union["ParamRef", bool, str, Any] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., mixBlendMode: Union["ParamRef", str] = ..., opacity: "ChannelValueSpec" = ..., paintOrder: Union["ParamRef", str] = ..., pointerEvents: Union["ParamRef", str] = ..., reverse: Union["ParamRef", bool] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., target: Union["ParamRef", str] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ...):
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.clip = clip
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.fx = fx
        self.fy = fy
        self.href = href
        self.imageFilter = imageFilter
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.mixBlendMode = mixBlendMode
        self.opacity = opacity
        self.paintOrder = paintOrder
        self.pointerEvents = pointerEvents
        self.reverse = reverse
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.target = target
        self.tip = tip
        self.title = title


class Heatmap(SchemaBase):
    def __init__(self, data: "PlotMarkData", mark: str, ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., bandwidth: Union[float, "ParamRef"] = ..., clip: Union["ParamRef", bool, str, Any] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., height: Union[float, "ParamRef"] = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., imageRendering: Union["ParamRef", str] = ..., interpolate: Union["GridInterpolate", "ParamRef", Any] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., mixBlendMode: Union["ParamRef", str] = ..., opacity: "ChannelValueSpec" = ..., pad: Union[float, "ParamRef"] = ..., paintOrder: Union["ParamRef", str] = ..., pixelSize: Union[float, "ParamRef"] = ..., pointerEvents: Union["ParamRef", str] = ..., reverse: Union["ParamRef", bool] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., target: Union["ParamRef", str] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., width: Union[float, "ParamRef"] = ..., x: "ChannelValueSpec" = ..., y: "ChannelValueSpec" = ...):
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.bandwidth = bandwidth
        self.clip = clip
        self.data = data
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.fx = fx
        self.fy = fy
        self.height = height
        self.href = href
        self.imageFilter = imageFilter
        self.imageRendering = imageRendering
        self.interpolate = interpolate
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.mixBlendMode = mixBlendMode
        self.opacity = opacity
        self.pad = pad
        self.paintOrder = paintOrder
        self.pixelSize = pixelSize
        self.pointerEvents = pointerEvents
        self.reverse = reverse
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.target = target
        self.tip = tip
        self.title = title
        self.width = width
        self.x = x
        self.y = y


class Hexagon(SchemaBase):
    def __init__(self, data: "PlotMarkData", mark: str, ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., clip: Union["ParamRef", bool, str, Any] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., frameAnchor: Union["ParamRef", "FrameAnchor"] = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., mixBlendMode: Union["ParamRef", str] = ..., opacity: "ChannelValueSpec" = ..., paintOrder: Union["ParamRef", str] = ..., pointerEvents: Union["ParamRef", str] = ..., r: Union[float, "ParamRef", "ChannelValueSpec"] = ..., reverse: Union["ParamRef", bool] = ..., rotate: Union[float, "ParamRef", "ChannelValue"] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., symbol: Union["ParamRef", "SymbolType", "ChannelValueSpec"] = ..., target: Union["ParamRef", str] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., x: "ChannelValueSpec" = ..., y: "ChannelValueSpec" = ..., z: "ChannelValue" = ...):
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.clip = clip
        self.data = data
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.frameAnchor = frameAnchor
        self.fx = fx
        self.fy = fy
        self.href = href
        self.imageFilter = imageFilter
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.mixBlendMode = mixBlendMode
        self.opacity = opacity
        self.paintOrder = paintOrder
        self.pointerEvents = pointerEvents
        self.r = r
        self.reverse = reverse
        self.rotate = rotate
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.symbol = symbol
        self.target = target
        self.tip = tip
        self.title = title
        self.x = x
        self.y = y
        self.z = z


class Hexbin(SchemaBase):
    def __init__(self, data: "PlotMarkData", mark: str, ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., binWidth: Union[float, "ParamRef"] = ..., clip: Union["ParamRef", bool, str, Any] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., fontFamily: Union["ParamRef", str] = ..., fontSize: Union["ParamRef", "ChannelValue"] = ..., fontStyle: Union["ParamRef", str] = ..., fontVariant: Union["ParamRef", str] = ..., fontWeight: Union[float, "ParamRef", str] = ..., frameAnchor: Union["ParamRef", "FrameAnchor"] = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., lineHeight: Union[float, "ParamRef"] = ..., lineWidth: Union[float, "ParamRef"] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., mixBlendMode: Union["ParamRef", str] = ..., monospace: Union["ParamRef", bool] = ..., opacity: "ChannelValueSpec" = ..., paintOrder: Union["ParamRef", str] = ..., pointerEvents: Union["ParamRef", str] = ..., r: Union[float, "ParamRef", "ChannelValueSpec"] = ..., reverse: Union["ParamRef", bool] = ..., rotate: Union[float, "ParamRef", "ChannelValue"] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., symbol: Union["ParamRef", "SymbolType", "ChannelValueSpec"] = ..., target: Union["ParamRef", str] = ..., textAnchor: Union["ParamRef", str] = ..., textOverflow: Union["ParamRef", str, Any] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., type: Union["ParamRef", str] = ..., x: "ChannelValueSpec" = ..., y: "ChannelValueSpec" = ..., z: "ChannelValue" = ...):
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.binWidth = binWidth
        self.clip = clip
        self.data = data
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.fontFamily = fontFamily
        self.fontSize = fontSize
        self.fontStyle = fontStyle
        self.fontVariant = fontVariant
        self.fontWeight = fontWeight
        self.frameAnchor = frameAnchor
        self.fx = fx
        self.fy = fy
        self.href = href
        self.imageFilter = imageFilter
        self.lineHeight = lineHeight
        self.lineWidth = lineWidth
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.mixBlendMode = mixBlendMode
        self.monospace = monospace
        self.opacity = opacity
        self.paintOrder = paintOrder
        self.pointerEvents = pointerEvents
        self.r = r
        self.reverse = reverse
        self.rotate = rotate
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.symbol = symbol
        self.target = target
        self.textAnchor = textAnchor
        self.textOverflow = textOverflow
        self.tip = tip
        self.title = title
        self.type = type
        self.x = x
        self.y = y
        self.z = z


class Hexgrid(SchemaBase):
    def __init__(self, mark: str, ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., binWidth: Union[float, "ParamRef"] = ..., clip: Union["ParamRef", bool, str, Any] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., mixBlendMode: Union["ParamRef", str] = ..., opacity: "ChannelValueSpec" = ..., paintOrder: Union["ParamRef", str] = ..., pointerEvents: Union["ParamRef", str] = ..., reverse: Union["ParamRef", bool] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., target: Union["ParamRef", str] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ...):
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.binWidth = binWidth
        self.clip = clip
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.fx = fx
        self.fy = fy
        self.href = href
        self.imageFilter = imageFilter
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.mixBlendMode = mixBlendMode
        self.opacity = opacity
        self.paintOrder = paintOrder
        self.pointerEvents = pointerEvents
        self.reverse = reverse
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.target = target
        self.tip = tip
        self.title = title


class Hull(SchemaBase):
    def __init__(self, data: "PlotMarkData", mark: str, ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., clip: Union["ParamRef", bool, str, Any] = ..., curve: Union["ParamRef", "Curve"] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., marker: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerEnd: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerMid: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerStart: Union["MarkerName", str, "ParamRef", bool, Any] = ..., mixBlendMode: Union["ParamRef", str] = ..., opacity: "ChannelValueSpec" = ..., paintOrder: Union["ParamRef", str] = ..., pointerEvents: Union["ParamRef", str] = ..., reverse: Union["ParamRef", bool] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., target: Union["ParamRef", str] = ..., tension: Union[float, "ParamRef"] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., x: "ChannelValueSpec" = ..., y: "ChannelValueSpec" = ..., z: "ChannelValue" = ...):
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.clip = clip
        self.curve = curve
        self.data = data
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.fx = fx
        self.fy = fy
        self.href = href
        self.imageFilter = imageFilter
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.marker = marker
        self.markerEnd = markerEnd
        self.markerMid = markerMid
        self.markerStart = markerStart
        self.mixBlendMode = mixBlendMode
        self.opacity = opacity
        self.paintOrder = paintOrder
        self.pointerEvents = pointerEvents
        self.reverse = reverse
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.target = target
        self.tension = tension
        self.tip = tip
        self.title = title
        self.x = x
        self.y = y
        self.z = z


class Image(SchemaBase):
    def __init__(self, data: "PlotMarkData", mark: str, ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., clip: Union["ParamRef", bool, str, Any] = ..., crossOrigin: Union["ParamRef", str] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., frameAnchor: Union["ParamRef", "FrameAnchor"] = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., height: Union["ParamRef", "ChannelValue"] = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., imageRendering: Union["ParamRef", str] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., mixBlendMode: Union["ParamRef", str] = ..., opacity: "ChannelValueSpec" = ..., paintOrder: Union["ParamRef", str] = ..., pointerEvents: Union["ParamRef", str] = ..., preserveAspectRatio: Union["ParamRef", str] = ..., r: Union["ParamRef", "ChannelValue"] = ..., reverse: Union["ParamRef", bool] = ..., rotate: Union["ParamRef", "ChannelValue"] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., src: Union["ParamRef", "ChannelValue"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., target: Union["ParamRef", str] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., width: Union["ParamRef", "ChannelValue"] = ..., x: "ChannelValueSpec" = ..., y: "ChannelValueSpec" = ...):
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.clip = clip
        self.crossOrigin = crossOrigin
        self.data = data
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.frameAnchor = frameAnchor
        self.fx = fx
        self.fy = fy
        self.height = height
        self.href = href
        self.imageFilter = imageFilter
        self.imageRendering = imageRendering
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.mixBlendMode = mixBlendMode
        self.opacity = opacity
        self.paintOrder = paintOrder
        self.pointerEvents = pointerEvents
        self.preserveAspectRatio = preserveAspectRatio
        self.r = r
        self.reverse = reverse
        self.rotate = rotate
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.src = src
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.target = target
        self.tip = tip
        self.title = title
        self.width = width
        self.x = x
        self.y = y


class Line(SchemaBase):
    def __init__(self, data: "PlotMarkData", mark: str, ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., clip: Union["ParamRef", bool, str, Any] = ..., curve: Union["ParamRef", "Curve", str] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., marker: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerEnd: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerMid: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerStart: Union["MarkerName", str, "ParamRef", bool, Any] = ..., mixBlendMode: Union["ParamRef", str] = ..., opacity: "ChannelValueSpec" = ..., paintOrder: Union["ParamRef", str] = ..., pointerEvents: Union["ParamRef", str] = ..., reverse: Union["ParamRef", bool] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., target: Union["ParamRef", str] = ..., tension: Union[float, "ParamRef"] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., x: "ChannelValueSpec" = ..., y: "ChannelValueSpec" = ..., z: "ChannelValue" = ...):
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.clip = clip
        self.curve = curve
        self.data = data
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.fx = fx
        self.fy = fy
        self.href = href
        self.imageFilter = imageFilter
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.marker = marker
        self.markerEnd = markerEnd
        self.markerMid = markerMid
        self.markerStart = markerStart
        self.mixBlendMode = mixBlendMode
        self.opacity = opacity
        self.paintOrder = paintOrder
        self.pointerEvents = pointerEvents
        self.reverse = reverse
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.target = target
        self.tension = tension
        self.tip = tip
        self.title = title
        self.x = x
        self.y = y
        self.z = z


class LineX(SchemaBase):
    def __init__(self, data: "PlotMarkData", mark: str, ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., clip: Union["ParamRef", bool, str, Any] = ..., curve: Union["ParamRef", "Curve", str] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., marker: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerEnd: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerMid: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerStart: Union["MarkerName", str, "ParamRef", bool, Any] = ..., mixBlendMode: Union["ParamRef", str] = ..., opacity: "ChannelValueSpec" = ..., paintOrder: Union["ParamRef", str] = ..., pointerEvents: Union["ParamRef", str] = ..., reverse: Union["ParamRef", bool] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., target: Union["ParamRef", str] = ..., tension: Union[float, "ParamRef"] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., x: "ChannelValueSpec" = ..., y: "ChannelValueSpec" = ..., z: "ChannelValue" = ...):
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.clip = clip
        self.curve = curve
        self.data = data
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.fx = fx
        self.fy = fy
        self.href = href
        self.imageFilter = imageFilter
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.marker = marker
        self.markerEnd = markerEnd
        self.markerMid = markerMid
        self.markerStart = markerStart
        self.mixBlendMode = mixBlendMode
        self.opacity = opacity
        self.paintOrder = paintOrder
        self.pointerEvents = pointerEvents
        self.reverse = reverse
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.target = target
        self.tension = tension
        self.tip = tip
        self.title = title
        self.x = x
        self.y = y
        self.z = z


class LineY(SchemaBase):
    def __init__(self, data: "PlotMarkData", mark: str, ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., clip: Union["ParamRef", bool, str, Any] = ..., curve: Union["ParamRef", "Curve", str] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., marker: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerEnd: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerMid: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerStart: Union["MarkerName", str, "ParamRef", bool, Any] = ..., mixBlendMode: Union["ParamRef", str] = ..., opacity: "ChannelValueSpec" = ..., paintOrder: Union["ParamRef", str] = ..., pointerEvents: Union["ParamRef", str] = ..., reverse: Union["ParamRef", bool] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., target: Union["ParamRef", str] = ..., tension: Union[float, "ParamRef"] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., x: "ChannelValueSpec" = ..., y: "ChannelValueSpec" = ..., z: "ChannelValue" = ...):
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.clip = clip
        self.curve = curve
        self.data = data
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.fx = fx
        self.fy = fy
        self.href = href
        self.imageFilter = imageFilter
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.marker = marker
        self.markerEnd = markerEnd
        self.markerMid = markerMid
        self.markerStart = markerStart
        self.mixBlendMode = mixBlendMode
        self.opacity = opacity
        self.paintOrder = paintOrder
        self.pointerEvents = pointerEvents
        self.reverse = reverse
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.target = target
        self.tension = tension
        self.tip = tip
        self.title = title
        self.x = x
        self.y = y
        self.z = z


class Link(SchemaBase):
    def __init__(self, data: "PlotMarkData", mark: str, ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., clip: Union["ParamRef", bool, str, Any] = ..., curve: Union["ParamRef", Union["ParamRef", "Curve", str]] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., marker: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerEnd: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerMid: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerStart: Union["MarkerName", str, "ParamRef", bool, Any] = ..., mixBlendMode: Union["ParamRef", str] = ..., opacity: "ChannelValueSpec" = ..., paintOrder: Union["ParamRef", str] = ..., pointerEvents: Union["ParamRef", str] = ..., reverse: Union["ParamRef", bool] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., target: Union["ParamRef", str] = ..., tension: Union[float, "ParamRef"] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., x: "ChannelValueSpec" = ..., x1: "ChannelValueSpec" = ..., x2: "ChannelValueSpec" = ..., y: "ChannelValueSpec" = ..., y1: "ChannelValueSpec" = ..., y2: "ChannelValueSpec" = ...):
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.clip = clip
        self.curve = curve
        self.data = data
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.fx = fx
        self.fy = fy
        self.href = href
        self.imageFilter = imageFilter
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.marker = marker
        self.markerEnd = markerEnd
        self.markerMid = markerMid
        self.markerStart = markerStart
        self.mixBlendMode = mixBlendMode
        self.opacity = opacity
        self.paintOrder = paintOrder
        self.pointerEvents = pointerEvents
        self.reverse = reverse
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.target = target
        self.tension = tension
        self.tip = tip
        self.title = title
        self.x = x
        self.x1 = x1
        self.x2 = x2
        self.y = y
        self.y1 = y1
        self.y2 = y2


class Raster(SchemaBase):
    def __init__(self, data: "PlotMarkData", mark: str, ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., bandwidth: Union[float, "ParamRef"] = ..., clip: Union["ParamRef", bool, str, Any] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., height: Union[float, "ParamRef"] = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., imageRendering: Union["ParamRef", str] = ..., interpolate: Union["GridInterpolate", "ParamRef", Any] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., mixBlendMode: Union["ParamRef", str] = ..., opacity: "ChannelValueSpec" = ..., pad: Union[float, "ParamRef"] = ..., paintOrder: Union["ParamRef", str] = ..., pixelSize: Union[float, "ParamRef"] = ..., pointerEvents: Union["ParamRef", str] = ..., reverse: Union["ParamRef", bool] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., target: Union["ParamRef", str] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., width: Union[float, "ParamRef"] = ..., x: "ChannelValueSpec" = ..., y: "ChannelValueSpec" = ...):
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.bandwidth = bandwidth
        self.clip = clip
        self.data = data
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.fx = fx
        self.fy = fy
        self.height = height
        self.href = href
        self.imageFilter = imageFilter
        self.imageRendering = imageRendering
        self.interpolate = interpolate
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.mixBlendMode = mixBlendMode
        self.opacity = opacity
        self.pad = pad
        self.paintOrder = paintOrder
        self.pixelSize = pixelSize
        self.pointerEvents = pointerEvents
        self.reverse = reverse
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.target = target
        self.tip = tip
        self.title = title
        self.width = width
        self.x = x
        self.y = y


class RasterTile(SchemaBase):
    def __init__(self, data: "PlotMarkData", mark: str, ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., bandwidth: Union[float, "ParamRef"] = ..., clip: Union["ParamRef", bool, str, Any] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., height: Union[float, "ParamRef"] = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., imageRendering: Union["ParamRef", str] = ..., interpolate: Union["GridInterpolate", "ParamRef", Any] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., mixBlendMode: Union["ParamRef", str] = ..., opacity: "ChannelValueSpec" = ..., origin: Union["ParamRef", List[float]] = ..., pad: Union[float, "ParamRef"] = ..., paintOrder: Union["ParamRef", str] = ..., pixelSize: Union[float, "ParamRef"] = ..., pointerEvents: Union["ParamRef", str] = ..., reverse: Union["ParamRef", bool] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., target: Union["ParamRef", str] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., width: Union[float, "ParamRef"] = ..., x: "ChannelValueSpec" = ..., y: "ChannelValueSpec" = ...):
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.bandwidth = bandwidth
        self.clip = clip
        self.data = data
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.fx = fx
        self.fy = fy
        self.height = height
        self.href = href
        self.imageFilter = imageFilter
        self.imageRendering = imageRendering
        self.interpolate = interpolate
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.mixBlendMode = mixBlendMode
        self.opacity = opacity
        self.origin = origin
        self.pad = pad
        self.paintOrder = paintOrder
        self.pixelSize = pixelSize
        self.pointerEvents = pointerEvents
        self.reverse = reverse
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.target = target
        self.tip = tip
        self.title = title
        self.width = width
        self.x = x
        self.y = y


class RegressionY(SchemaBase):
    def __init__(self, data: "PlotMarkData", mark: str, ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., ci: Union[float, "ParamRef"] = ..., clip: Union["ParamRef", bool, str, Any] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., mixBlendMode: Union["ParamRef", str] = ..., opacity: "ChannelValueSpec" = ..., paintOrder: Union["ParamRef", str] = ..., pointerEvents: Union["ParamRef", str] = ..., precision: Union[float, "ParamRef"] = ..., reverse: Union["ParamRef", bool] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., target: Union["ParamRef", str] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., x: "ChannelValueSpec" = ..., y: "ChannelValueSpec" = ..., z: "ChannelValue" = ...):
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.ci = ci
        self.clip = clip
        self.data = data
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.fx = fx
        self.fy = fy
        self.href = href
        self.imageFilter = imageFilter
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.mixBlendMode = mixBlendMode
        self.opacity = opacity
        self.paintOrder = paintOrder
        self.pointerEvents = pointerEvents
        self.precision = precision
        self.reverse = reverse
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.target = target
        self.tip = tip
        self.title = title
        self.x = x
        self.y = y
        self.z = z


class Sphere(SchemaBase):
    def __init__(self, mark: str, ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., clip: Union["ParamRef", bool, str, Any] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., mixBlendMode: Union["ParamRef", str] = ..., opacity: "ChannelValueSpec" = ..., paintOrder: Union["ParamRef", str] = ..., pointerEvents: Union["ParamRef", str] = ..., reverse: Union["ParamRef", bool] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., target: Union["ParamRef", str] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ...):
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.clip = clip
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.fx = fx
        self.fy = fy
        self.href = href
        self.imageFilter = imageFilter
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.mixBlendMode = mixBlendMode
        self.opacity = opacity
        self.paintOrder = paintOrder
        self.pointerEvents = pointerEvents
        self.reverse = reverse
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.target = target
        self.tip = tip
        self.title = title


class Spike(SchemaBase):
    def __init__(self, data: "PlotMarkData", mark: str, anchor: Union["ParamRef", str] = ..., ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., clip: Union["ParamRef", bool, str, Any] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., frameAnchor: Union["ParamRef", "FrameAnchor"] = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., length: "ChannelValueSpec" = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., mixBlendMode: Union["ParamRef", str] = ..., opacity: "ChannelValueSpec" = ..., paintOrder: Union["ParamRef", str] = ..., pointerEvents: Union["ParamRef", str] = ..., r: Union[float, "ParamRef"] = ..., reverse: Union["ParamRef", bool] = ..., rotate: "ChannelValue" = ..., select: "SelectFilter" = ..., shape: Union["ParamRef", "VectorShape"] = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., target: Union["ParamRef", str] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., x: "ChannelValueSpec" = ..., y: "ChannelValueSpec" = ...):
        self.anchor = anchor
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.clip = clip
        self.data = data
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.frameAnchor = frameAnchor
        self.fx = fx
        self.fy = fy
        self.href = href
        self.imageFilter = imageFilter
        self.length = length
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.mixBlendMode = mixBlendMode
        self.opacity = opacity
        self.paintOrder = paintOrder
        self.pointerEvents = pointerEvents
        self.r = r
        self.reverse = reverse
        self.rotate = rotate
        self.select = select
        self.shape = shape
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.target = target
        self.tip = tip
        self.title = title
        self.x = x
        self.y = y


class Text(SchemaBase):
    def __init__(self, mark: str, ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., clip: Union["ParamRef", bool, str, Any] = ..., data: "PlotMarkData" = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., fontFamily: Union["ParamRef", str] = ..., fontSize: Union["ParamRef", "ChannelValue"] = ..., fontStyle: Union["ParamRef", str] = ..., fontVariant: Union["ParamRef", str] = ..., fontWeight: Union[float, "ParamRef", str] = ..., frameAnchor: Union["ParamRef", "FrameAnchor"] = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., lineAnchor: Union["ParamRef", str] = ..., lineHeight: Union[float, "ParamRef"] = ..., lineWidth: Union[float, "ParamRef"] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., mixBlendMode: Union["ParamRef", str] = ..., monospace: Union["ParamRef", bool] = ..., opacity: "ChannelValueSpec" = ..., paintOrder: Union["ParamRef", str] = ..., pointerEvents: Union["ParamRef", str] = ..., reverse: Union["ParamRef", bool] = ..., rotate: Union["ParamRef", "ChannelValue"] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., target: Union["ParamRef", str] = ..., text: "ChannelValue" = ..., textAnchor: Union["ParamRef", str] = ..., textOverflow: Union["ParamRef", str, Any] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., x: "ChannelValueSpec" = ..., y: "ChannelValueSpec" = ..., z: "ChannelValue" = ...):
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.clip = clip
        self.data = data
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.fontFamily = fontFamily
        self.fontSize = fontSize
        self.fontStyle = fontStyle
        self.fontVariant = fontVariant
        self.fontWeight = fontWeight
        self.frameAnchor = frameAnchor
        self.fx = fx
        self.fy = fy
        self.href = href
        self.imageFilter = imageFilter
        self.lineAnchor = lineAnchor
        self.lineHeight = lineHeight
        self.lineWidth = lineWidth
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.mixBlendMode = mixBlendMode
        self.monospace = monospace
        self.opacity = opacity
        self.paintOrder = paintOrder
        self.pointerEvents = pointerEvents
        self.reverse = reverse
        self.rotate = rotate
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.target = target
        self.text = text
        self.textAnchor = textAnchor
        self.textOverflow = textOverflow
        self.tip = tip
        self.title = title
        self.x = x
        self.y = y
        self.z = z


class TickX(SchemaBase):
    def __init__(self, data: "PlotMarkData", mark: str, ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., clip: Union["ParamRef", bool, str, Any] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., inset: Union[float, "ParamRef"] = ..., insetBottom: Union[float, "ParamRef"] = ..., insetTop: Union[float, "ParamRef"] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., marker: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerEnd: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerMid: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerStart: Union["MarkerName", str, "ParamRef", bool, Any] = ..., mixBlendMode: Union["ParamRef", str] = ..., opacity: "ChannelValueSpec" = ..., paintOrder: Union["ParamRef", str] = ..., pointerEvents: Union["ParamRef", str] = ..., reverse: Union["ParamRef", bool] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., target: Union["ParamRef", str] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., x: "ChannelValueSpec" = ..., y: "ChannelValueSpec" = ...):
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.clip = clip
        self.data = data
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.fx = fx
        self.fy = fy
        self.href = href
        self.imageFilter = imageFilter
        self.inset = inset
        self.insetBottom = insetBottom
        self.insetTop = insetTop
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.marker = marker
        self.markerEnd = markerEnd
        self.markerMid = markerMid
        self.markerStart = markerStart
        self.mixBlendMode = mixBlendMode
        self.opacity = opacity
        self.paintOrder = paintOrder
        self.pointerEvents = pointerEvents
        self.reverse = reverse
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.target = target
        self.tip = tip
        self.title = title
        self.x = x
        self.y = y


class TickY(SchemaBase):
    def __init__(self, data: "PlotMarkData", mark: str, ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., clip: Union["ParamRef", bool, str, Any] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., inset: Union[float, "ParamRef"] = ..., insetLeft: Union[float, "ParamRef"] = ..., insetRight: Union[float, "ParamRef"] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., marker: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerEnd: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerMid: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerStart: Union["MarkerName", str, "ParamRef", bool, Any] = ..., mixBlendMode: Union["ParamRef", str] = ..., opacity: "ChannelValueSpec" = ..., paintOrder: Union["ParamRef", str] = ..., pointerEvents: Union["ParamRef", str] = ..., reverse: Union["ParamRef", bool] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., target: Union["ParamRef", str] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., x: "ChannelValueSpec" = ..., y: "ChannelValueSpec" = ...):
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.clip = clip
        self.data = data
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.fx = fx
        self.fy = fy
        self.href = href
        self.imageFilter = imageFilter
        self.inset = inset
        self.insetLeft = insetLeft
        self.insetRight = insetRight
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.marker = marker
        self.markerEnd = markerEnd
        self.markerMid = markerMid
        self.markerStart = markerStart
        self.mixBlendMode = mixBlendMode
        self.opacity = opacity
        self.paintOrder = paintOrder
        self.pointerEvents = pointerEvents
        self.reverse = reverse
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.target = target
        self.tip = tip
        self.title = title
        self.x = x
        self.y = y


class Vector(SchemaBase):
    def __init__(self, data: "PlotMarkData", mark: str, anchor: Union["ParamRef", str] = ..., ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., clip: Union["ParamRef", bool, str, Any] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., frameAnchor: Union["ParamRef", "FrameAnchor"] = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., length: "ChannelValueSpec" = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., mixBlendMode: Union["ParamRef", str] = ..., opacity: "ChannelValueSpec" = ..., paintOrder: Union["ParamRef", str] = ..., pointerEvents: Union["ParamRef", str] = ..., r: Union[float, "ParamRef"] = ..., reverse: Union["ParamRef", bool] = ..., rotate: "ChannelValue" = ..., select: "SelectFilter" = ..., shape: Union["ParamRef", "VectorShape"] = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., target: Union["ParamRef", str] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., x: "ChannelValueSpec" = ..., y: "ChannelValueSpec" = ...):
        self.anchor = anchor
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.clip = clip
        self.data = data
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.frameAnchor = frameAnchor
        self.fx = fx
        self.fy = fy
        self.href = href
        self.imageFilter = imageFilter
        self.length = length
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.mixBlendMode = mixBlendMode
        self.opacity = opacity
        self.paintOrder = paintOrder
        self.pointerEvents = pointerEvents
        self.r = r
        self.reverse = reverse
        self.rotate = rotate
        self.select = select
        self.shape = shape
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.target = target
        self.tip = tip
        self.title = title
        self.x = x
        self.y = y


class VectorX(SchemaBase):
    def __init__(self, data: "PlotMarkData", mark: str, anchor: Union["ParamRef", str] = ..., ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., clip: Union["ParamRef", bool, str, Any] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., frameAnchor: Union["ParamRef", "FrameAnchor"] = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., length: "ChannelValueSpec" = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., mixBlendMode: Union["ParamRef", str] = ..., opacity: "ChannelValueSpec" = ..., paintOrder: Union["ParamRef", str] = ..., pointerEvents: Union["ParamRef", str] = ..., r: Union[float, "ParamRef"] = ..., reverse: Union["ParamRef", bool] = ..., rotate: "ChannelValue" = ..., select: "SelectFilter" = ..., shape: Union["ParamRef", "VectorShape"] = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., target: Union["ParamRef", str] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., x: "ChannelValueSpec" = ..., y: "ChannelValueSpec" = ...):
        self.anchor = anchor
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.clip = clip
        self.data = data
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.frameAnchor = frameAnchor
        self.fx = fx
        self.fy = fy
        self.href = href
        self.imageFilter = imageFilter
        self.length = length
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.mixBlendMode = mixBlendMode
        self.opacity = opacity
        self.paintOrder = paintOrder
        self.pointerEvents = pointerEvents
        self.r = r
        self.reverse = reverse
        self.rotate = rotate
        self.select = select
        self.shape = shape
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.target = target
        self.tip = tip
        self.title = title
        self.x = x
        self.y = y


class VectorY(SchemaBase):
    def __init__(self, data: "PlotMarkData", mark: str, anchor: Union["ParamRef", str] = ..., ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., clip: Union["ParamRef", bool, str, Any] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., frameAnchor: Union["ParamRef", "FrameAnchor"] = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., length: "ChannelValueSpec" = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., mixBlendMode: Union["ParamRef", str] = ..., opacity: "ChannelValueSpec" = ..., paintOrder: Union["ParamRef", str] = ..., pointerEvents: Union["ParamRef", str] = ..., r: Union[float, "ParamRef"] = ..., reverse: Union["ParamRef", bool] = ..., rotate: "ChannelValue" = ..., select: "SelectFilter" = ..., shape: Union["ParamRef", "VectorShape"] = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., target: Union["ParamRef", str] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., x: "ChannelValueSpec" = ..., y: "ChannelValueSpec" = ...):
        self.anchor = anchor
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.clip = clip
        self.data = data
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.frameAnchor = frameAnchor
        self.fx = fx
        self.fy = fy
        self.href = href
        self.imageFilter = imageFilter
        self.length = length
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.mixBlendMode = mixBlendMode
        self.opacity = opacity
        self.paintOrder = paintOrder
        self.pointerEvents = pointerEvents
        self.r = r
        self.reverse = reverse
        self.rotate = rotate
        self.select = select
        self.shape = shape
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.target = target
        self.tip = tip
        self.title = title
        self.x = x
        self.y = y


class Voronoi(SchemaBase):
    def __init__(self, data: "PlotMarkData", mark: str, ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., clip: Union["ParamRef", bool, str, Any] = ..., curve: Union["ParamRef", "Curve"] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., marker: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerEnd: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerMid: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerStart: Union["MarkerName", str, "ParamRef", bool, Any] = ..., mixBlendMode: Union["ParamRef", str] = ..., opacity: "ChannelValueSpec" = ..., paintOrder: Union["ParamRef", str] = ..., pointerEvents: Union["ParamRef", str] = ..., reverse: Union["ParamRef", bool] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., target: Union["ParamRef", str] = ..., tension: Union[float, "ParamRef"] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., x: "ChannelValueSpec" = ..., y: "ChannelValueSpec" = ..., z: "ChannelValue" = ...):
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.clip = clip
        self.curve = curve
        self.data = data
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.fx = fx
        self.fy = fy
        self.href = href
        self.imageFilter = imageFilter
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.marker = marker
        self.markerEnd = markerEnd
        self.markerMid = markerMid
        self.markerStart = markerStart
        self.mixBlendMode = mixBlendMode
        self.opacity = opacity
        self.paintOrder = paintOrder
        self.pointerEvents = pointerEvents
        self.reverse = reverse
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.target = target
        self.tension = tension
        self.tip = tip
        self.title = title
        self.x = x
        self.y = y
        self.z = z


class VoronoiMesh(SchemaBase):
    def __init__(self, data: "PlotMarkData", mark: str, ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., clip: Union["ParamRef", bool, str, Any] = ..., curve: Union["ParamRef", "Curve"] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., marker: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerEnd: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerMid: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerStart: Union["MarkerName", str, "ParamRef", bool, Any] = ..., mixBlendMode: Union["ParamRef", str] = ..., opacity: "ChannelValueSpec" = ..., paintOrder: Union["ParamRef", str] = ..., pointerEvents: Union["ParamRef", str] = ..., reverse: Union["ParamRef", bool] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., target: Union["ParamRef", str] = ..., tension: Union[float, "ParamRef"] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., x: "ChannelValueSpec" = ..., y: "ChannelValueSpec" = ..., z: "ChannelValue" = ...):
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.clip = clip
        self.curve = curve
        self.data = data
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.fx = fx
        self.fy = fy
        self.href = href
        self.imageFilter = imageFilter
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.marker = marker
        self.markerEnd = markerEnd
        self.markerMid = markerMid
        self.markerStart = markerStart
        self.mixBlendMode = mixBlendMode
        self.opacity = opacity
        self.paintOrder = paintOrder
        self.pointerEvents = pointerEvents
        self.reverse = reverse
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.target = target
        self.tension = tension
        self.tip = tip
        self.title = title
        self.x = x
        self.y = y
        self.z = z


class BarX(SchemaBase):
    def __init__(self, data: "PlotMarkData", mark: str, ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., clip: Union["ParamRef", bool, str, Any] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., inset: Union[float, "ParamRef"] = ..., insetBottom: Union[float, "ParamRef"] = ..., insetLeft: Union[float, "ParamRef"] = ..., insetRight: Union[float, "ParamRef"] = ..., insetTop: Union[float, "ParamRef"] = ..., interval: Union["ParamRef", "Interval"] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., mixBlendMode: Union["ParamRef", str] = ..., offset: Union["StackOffset", "ParamRef", Any] = ..., opacity: "ChannelValueSpec" = ..., order: Union["ParamRef", "StackOrder", Any] = ..., paintOrder: Union["ParamRef", str] = ..., pointerEvents: Union["ParamRef", str] = ..., reverse: Union["ParamRef", bool] = ..., rx: Union[float, "ParamRef", str] = ..., ry: Union[float, "ParamRef", str] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., target: Union["ParamRef", str] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., x: "ChannelValueIntervalSpec" = ..., x1: "ChannelValueSpec" = ..., x2: "ChannelValueSpec" = ..., y: "ChannelValueSpec" = ..., z: "ChannelValue" = ...):
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.clip = clip
        self.data = data
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.fx = fx
        self.fy = fy
        self.href = href
        self.imageFilter = imageFilter
        self.inset = inset
        self.insetBottom = insetBottom
        self.insetLeft = insetLeft
        self.insetRight = insetRight
        self.insetTop = insetTop
        self.interval = interval
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.mixBlendMode = mixBlendMode
        self.offset = offset
        self.opacity = opacity
        self.order = order
        self.paintOrder = paintOrder
        self.pointerEvents = pointerEvents
        self.reverse = reverse
        self.rx = rx
        self.ry = ry
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.target = target
        self.tip = tip
        self.title = title
        self.x = x
        self.x1 = x1
        self.x2 = x2
        self.y = y
        self.z = z


class BarY(SchemaBase):
    def __init__(self, data: "PlotMarkData", mark: str, ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., clip: Union["ParamRef", bool, str, Any] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., inset: Union[float, "ParamRef"] = ..., insetBottom: Union[float, "ParamRef"] = ..., insetLeft: Union[float, "ParamRef"] = ..., insetRight: Union[float, "ParamRef"] = ..., insetTop: Union[float, "ParamRef"] = ..., interval: Union["ParamRef", "Interval"] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., mixBlendMode: Union["ParamRef", str] = ..., offset: Union["StackOffset", "ParamRef", Any] = ..., opacity: "ChannelValueSpec" = ..., order: Union["ParamRef", "StackOrder", Any] = ..., paintOrder: Union["ParamRef", str] = ..., pointerEvents: Union["ParamRef", str] = ..., reverse: Union["ParamRef", bool] = ..., rx: Union[float, "ParamRef", str] = ..., ry: Union[float, "ParamRef", str] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., target: Union["ParamRef", str] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., x: "ChannelValueSpec" = ..., y: "ChannelValueIntervalSpec" = ..., y1: "ChannelValueSpec" = ..., y2: "ChannelValueSpec" = ..., z: "ChannelValue" = ...):
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.clip = clip
        self.data = data
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.fx = fx
        self.fy = fy
        self.href = href
        self.imageFilter = imageFilter
        self.inset = inset
        self.insetBottom = insetBottom
        self.insetLeft = insetLeft
        self.insetRight = insetRight
        self.insetTop = insetTop
        self.interval = interval
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.mixBlendMode = mixBlendMode
        self.offset = offset
        self.opacity = opacity
        self.order = order
        self.paintOrder = paintOrder
        self.pointerEvents = pointerEvents
        self.reverse = reverse
        self.rx = rx
        self.ry = ry
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.target = target
        self.tip = tip
        self.title = title
        self.x = x
        self.y = y
        self.y1 = y1
        self.y2 = y2
        self.z = z


class DotX(SchemaBase):
    def __init__(self, data: "PlotMarkData", mark: str, ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., clip: Union["ParamRef", bool, str, Any] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., frameAnchor: Union["ParamRef", "FrameAnchor"] = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., interval: Union["ParamRef", "Interval"] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., mixBlendMode: Union["ParamRef", str] = ..., opacity: "ChannelValueSpec" = ..., paintOrder: Union["ParamRef", str] = ..., pointerEvents: Union["ParamRef", str] = ..., r: Union[float, "ParamRef", "ChannelValueSpec"] = ..., reverse: Union["ParamRef", bool] = ..., rotate: Union[float, "ParamRef", "ChannelValue"] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., symbol: Union["ParamRef", "SymbolType", "ChannelValueSpec"] = ..., target: Union["ParamRef", str] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., x: "ChannelValueSpec" = ..., y: "ChannelValueIntervalSpec" = ..., z: "ChannelValue" = ...):
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.clip = clip
        self.data = data
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.frameAnchor = frameAnchor
        self.fx = fx
        self.fy = fy
        self.href = href
        self.imageFilter = imageFilter
        self.interval = interval
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.mixBlendMode = mixBlendMode
        self.opacity = opacity
        self.paintOrder = paintOrder
        self.pointerEvents = pointerEvents
        self.r = r
        self.reverse = reverse
        self.rotate = rotate
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.symbol = symbol
        self.target = target
        self.tip = tip
        self.title = title
        self.x = x
        self.y = y
        self.z = z


class DotY(SchemaBase):
    def __init__(self, data: "PlotMarkData", mark: str, ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., clip: Union["ParamRef", bool, str, Any] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., frameAnchor: Union["ParamRef", "FrameAnchor"] = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., interval: Union["ParamRef", "Interval"] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., mixBlendMode: Union["ParamRef", str] = ..., opacity: "ChannelValueSpec" = ..., paintOrder: Union["ParamRef", str] = ..., pointerEvents: Union["ParamRef", str] = ..., r: Union[float, "ParamRef", "ChannelValueSpec"] = ..., reverse: Union["ParamRef", bool] = ..., rotate: Union[float, "ParamRef", "ChannelValue"] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., symbol: Union["ParamRef", "SymbolType", "ChannelValueSpec"] = ..., target: Union["ParamRef", str] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., x: "ChannelValueIntervalSpec" = ..., y: "ChannelValueSpec" = ..., z: "ChannelValue" = ...):
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.clip = clip
        self.data = data
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.frameAnchor = frameAnchor
        self.fx = fx
        self.fy = fy
        self.href = href
        self.imageFilter = imageFilter
        self.interval = interval
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.mixBlendMode = mixBlendMode
        self.opacity = opacity
        self.paintOrder = paintOrder
        self.pointerEvents = pointerEvents
        self.r = r
        self.reverse = reverse
        self.rotate = rotate
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.symbol = symbol
        self.target = target
        self.tip = tip
        self.title = title
        self.x = x
        self.y = y
        self.z = z


class GridFx(SchemaBase):
    def __init__(self, mark: str, anchor: Union["ParamRef", str] = ..., ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., clip: Union["ParamRef", bool, str, Any] = ..., color: Union["ParamRef", "ChannelValueSpec"] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., inset: Union[float, "ParamRef"] = ..., insetBottom: Union[float, "ParamRef"] = ..., insetTop: Union[float, "ParamRef"] = ..., interval: Union["ParamRef", "Interval"] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., marker: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerEnd: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerMid: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerStart: Union["MarkerName", str, "ParamRef", bool, Any] = ..., mixBlendMode: Union["ParamRef", str] = ..., opacity: "ChannelValueSpec" = ..., paintOrder: Union["ParamRef", str] = ..., pointerEvents: Union["ParamRef", str] = ..., reverse: Union["ParamRef", bool] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., target: Union["ParamRef", str] = ..., tickSpacing: Union[float, "ParamRef"] = ..., ticks: Union[float, "ParamRef", List[Any], "Interval"] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., x: "ChannelValueSpec" = ..., y: "ChannelValueIntervalSpec" = ..., y1: "ChannelValueSpec" = ..., y2: "ChannelValueSpec" = ...):
        self.anchor = anchor
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.clip = clip
        self.color = color
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.fx = fx
        self.fy = fy
        self.href = href
        self.imageFilter = imageFilter
        self.inset = inset
        self.insetBottom = insetBottom
        self.insetTop = insetTop
        self.interval = interval
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.marker = marker
        self.markerEnd = markerEnd
        self.markerMid = markerMid
        self.markerStart = markerStart
        self.mixBlendMode = mixBlendMode
        self.opacity = opacity
        self.paintOrder = paintOrder
        self.pointerEvents = pointerEvents
        self.reverse = reverse
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.target = target
        self.tickSpacing = tickSpacing
        self.ticks = ticks
        self.tip = tip
        self.title = title
        self.x = x
        self.y = y
        self.y1 = y1
        self.y2 = y2


class GridFy(SchemaBase):
    def __init__(self, mark: str, anchor: Union["ParamRef", str] = ..., ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., clip: Union["ParamRef", bool, str, Any] = ..., color: Union["ParamRef", "ChannelValueSpec"] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., inset: Union[float, "ParamRef"] = ..., insetLeft: Union[float, "ParamRef"] = ..., insetRight: Union[float, "ParamRef"] = ..., interval: Union["ParamRef", "Interval"] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., marker: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerEnd: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerMid: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerStart: Union["MarkerName", str, "ParamRef", bool, Any] = ..., mixBlendMode: Union["ParamRef", str] = ..., opacity: "ChannelValueSpec" = ..., paintOrder: Union["ParamRef", str] = ..., pointerEvents: Union["ParamRef", str] = ..., reverse: Union["ParamRef", bool] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., target: Union["ParamRef", str] = ..., tickSpacing: Union[float, "ParamRef"] = ..., ticks: Union[float, "ParamRef", List[Any], "Interval"] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., x: "ChannelValueIntervalSpec" = ..., x1: "ChannelValueSpec" = ..., x2: "ChannelValueSpec" = ..., y: "ChannelValueSpec" = ...):
        self.anchor = anchor
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.clip = clip
        self.color = color
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.fx = fx
        self.fy = fy
        self.href = href
        self.imageFilter = imageFilter
        self.inset = inset
        self.insetLeft = insetLeft
        self.insetRight = insetRight
        self.interval = interval
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.marker = marker
        self.markerEnd = markerEnd
        self.markerMid = markerMid
        self.markerStart = markerStart
        self.mixBlendMode = mixBlendMode
        self.opacity = opacity
        self.paintOrder = paintOrder
        self.pointerEvents = pointerEvents
        self.reverse = reverse
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.target = target
        self.tickSpacing = tickSpacing
        self.ticks = ticks
        self.tip = tip
        self.title = title
        self.x = x
        self.x1 = x1
        self.x2 = x2
        self.y = y


class GridX(SchemaBase):
    def __init__(self, mark: str, anchor: Union["ParamRef", str] = ..., ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., clip: Union["ParamRef", bool, str, Any] = ..., color: Union["ParamRef", "ChannelValueSpec"] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., inset: Union[float, "ParamRef"] = ..., insetBottom: Union[float, "ParamRef"] = ..., insetTop: Union[float, "ParamRef"] = ..., interval: Union["ParamRef", "Interval"] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., marker: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerEnd: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerMid: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerStart: Union["MarkerName", str, "ParamRef", bool, Any] = ..., mixBlendMode: Union["ParamRef", str] = ..., opacity: "ChannelValueSpec" = ..., paintOrder: Union["ParamRef", str] = ..., pointerEvents: Union["ParamRef", str] = ..., reverse: Union["ParamRef", bool] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., target: Union["ParamRef", str] = ..., tickSpacing: Union[float, "ParamRef"] = ..., ticks: Union[float, "ParamRef", List[Any], "Interval"] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., x: "ChannelValueSpec" = ..., y: "ChannelValueIntervalSpec" = ..., y1: "ChannelValueSpec" = ..., y2: "ChannelValueSpec" = ...):
        self.anchor = anchor
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.clip = clip
        self.color = color
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.fx = fx
        self.fy = fy
        self.href = href
        self.imageFilter = imageFilter
        self.inset = inset
        self.insetBottom = insetBottom
        self.insetTop = insetTop
        self.interval = interval
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.marker = marker
        self.markerEnd = markerEnd
        self.markerMid = markerMid
        self.markerStart = markerStart
        self.mixBlendMode = mixBlendMode
        self.opacity = opacity
        self.paintOrder = paintOrder
        self.pointerEvents = pointerEvents
        self.reverse = reverse
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.target = target
        self.tickSpacing = tickSpacing
        self.ticks = ticks
        self.tip = tip
        self.title = title
        self.x = x
        self.y = y
        self.y1 = y1
        self.y2 = y2


class GridY(SchemaBase):
    def __init__(self, mark: str, anchor: Union["ParamRef", str] = ..., ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., clip: Union["ParamRef", bool, str, Any] = ..., color: Union["ParamRef", "ChannelValueSpec"] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., inset: Union[float, "ParamRef"] = ..., insetLeft: Union[float, "ParamRef"] = ..., insetRight: Union[float, "ParamRef"] = ..., interval: Union["ParamRef", "Interval"] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., marker: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerEnd: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerMid: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerStart: Union["MarkerName", str, "ParamRef", bool, Any] = ..., mixBlendMode: Union["ParamRef", str] = ..., opacity: "ChannelValueSpec" = ..., paintOrder: Union["ParamRef", str] = ..., pointerEvents: Union["ParamRef", str] = ..., reverse: Union["ParamRef", bool] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., target: Union["ParamRef", str] = ..., tickSpacing: Union[float, "ParamRef"] = ..., ticks: Union[float, "ParamRef", List[Any], "Interval"] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., x: "ChannelValueIntervalSpec" = ..., x1: "ChannelValueSpec" = ..., x2: "ChannelValueSpec" = ..., y: "ChannelValueSpec" = ...):
        self.anchor = anchor
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.clip = clip
        self.color = color
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.fx = fx
        self.fy = fy
        self.href = href
        self.imageFilter = imageFilter
        self.inset = inset
        self.insetLeft = insetLeft
        self.insetRight = insetRight
        self.interval = interval
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.marker = marker
        self.markerEnd = markerEnd
        self.markerMid = markerMid
        self.markerStart = markerStart
        self.mixBlendMode = mixBlendMode
        self.opacity = opacity
        self.paintOrder = paintOrder
        self.pointerEvents = pointerEvents
        self.reverse = reverse
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.target = target
        self.tickSpacing = tickSpacing
        self.ticks = ticks
        self.tip = tip
        self.title = title
        self.x = x
        self.x1 = x1
        self.x2 = x2
        self.y = y


class Rect(SchemaBase):
    def __init__(self, data: "PlotMarkData", mark: str, ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., clip: Union["ParamRef", bool, str, Any] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., inset: Union[float, "ParamRef"] = ..., insetBottom: Union[float, "ParamRef"] = ..., insetLeft: Union[float, "ParamRef"] = ..., insetRight: Union[float, "ParamRef"] = ..., insetTop: Union[float, "ParamRef"] = ..., interval: Union["ParamRef", "Interval"] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., mixBlendMode: Union["ParamRef", str] = ..., offset: Union["StackOffset", "ParamRef", Any] = ..., opacity: "ChannelValueSpec" = ..., order: Union["ParamRef", "StackOrder", Any] = ..., paintOrder: Union["ParamRef", str] = ..., pointerEvents: Union["ParamRef", str] = ..., reverse: Union["ParamRef", bool] = ..., rx: Union[float, "ParamRef", str] = ..., ry: Union[float, "ParamRef", str] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., target: Union["ParamRef", str] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., x: "ChannelValueIntervalSpec" = ..., x1: "ChannelValueSpec" = ..., x2: "ChannelValueSpec" = ..., y: "ChannelValueIntervalSpec" = ..., y1: "ChannelValueSpec" = ..., y2: "ChannelValueSpec" = ..., z: "ChannelValue" = ...):
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.clip = clip
        self.data = data
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.fx = fx
        self.fy = fy
        self.href = href
        self.imageFilter = imageFilter
        self.inset = inset
        self.insetBottom = insetBottom
        self.insetLeft = insetLeft
        self.insetRight = insetRight
        self.insetTop = insetTop
        self.interval = interval
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.mixBlendMode = mixBlendMode
        self.offset = offset
        self.opacity = opacity
        self.order = order
        self.paintOrder = paintOrder
        self.pointerEvents = pointerEvents
        self.reverse = reverse
        self.rx = rx
        self.ry = ry
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.target = target
        self.tip = tip
        self.title = title
        self.x = x
        self.x1 = x1
        self.x2 = x2
        self.y = y
        self.y1 = y1
        self.y2 = y2
        self.z = z


class RectX(SchemaBase):
    def __init__(self, data: "PlotMarkData", mark: str, ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., clip: Union["ParamRef", bool, str, Any] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., inset: Union[float, "ParamRef"] = ..., insetBottom: Union[float, "ParamRef"] = ..., insetLeft: Union[float, "ParamRef"] = ..., insetRight: Union[float, "ParamRef"] = ..., insetTop: Union[float, "ParamRef"] = ..., interval: Union["ParamRef", "Interval"] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., mixBlendMode: Union["ParamRef", str] = ..., offset: Union["StackOffset", "ParamRef", Any] = ..., opacity: "ChannelValueSpec" = ..., order: Union["ParamRef", "StackOrder", Any] = ..., paintOrder: Union["ParamRef", str] = ..., pointerEvents: Union["ParamRef", str] = ..., reverse: Union["ParamRef", bool] = ..., rx: Union[float, "ParamRef", str] = ..., ry: Union[float, "ParamRef", str] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., target: Union["ParamRef", str] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., x: "ChannelValueSpec" = ..., x1: "ChannelValueSpec" = ..., x2: "ChannelValueSpec" = ..., y: "ChannelValueIntervalSpec" = ..., y1: "ChannelValueSpec" = ..., y2: "ChannelValueSpec" = ..., z: "ChannelValue" = ...):
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.clip = clip
        self.data = data
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.fx = fx
        self.fy = fy
        self.href = href
        self.imageFilter = imageFilter
        self.inset = inset
        self.insetBottom = insetBottom
        self.insetLeft = insetLeft
        self.insetRight = insetRight
        self.insetTop = insetTop
        self.interval = interval
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.mixBlendMode = mixBlendMode
        self.offset = offset
        self.opacity = opacity
        self.order = order
        self.paintOrder = paintOrder
        self.pointerEvents = pointerEvents
        self.reverse = reverse
        self.rx = rx
        self.ry = ry
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.target = target
        self.tip = tip
        self.title = title
        self.x = x
        self.x1 = x1
        self.x2 = x2
        self.y = y
        self.y1 = y1
        self.y2 = y2
        self.z = z


class RectY(SchemaBase):
    def __init__(self, data: "PlotMarkData", mark: str, ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., clip: Union["ParamRef", bool, str, Any] = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., inset: Union[float, "ParamRef"] = ..., insetBottom: Union[float, "ParamRef"] = ..., insetLeft: Union[float, "ParamRef"] = ..., insetRight: Union[float, "ParamRef"] = ..., insetTop: Union[float, "ParamRef"] = ..., interval: Union["ParamRef", "Interval"] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., mixBlendMode: Union["ParamRef", str] = ..., offset: Union["StackOffset", "ParamRef", Any] = ..., opacity: "ChannelValueSpec" = ..., order: Union["ParamRef", "StackOrder", Any] = ..., paintOrder: Union["ParamRef", str] = ..., pointerEvents: Union["ParamRef", str] = ..., reverse: Union["ParamRef", bool] = ..., rx: Union[float, "ParamRef", str] = ..., ry: Union[float, "ParamRef", str] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., target: Union["ParamRef", str] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., x: "ChannelValueIntervalSpec" = ..., x1: "ChannelValueSpec" = ..., x2: "ChannelValueSpec" = ..., y: "ChannelValueSpec" = ..., y1: "ChannelValueSpec" = ..., y2: "ChannelValueSpec" = ..., z: "ChannelValue" = ...):
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.clip = clip
        self.data = data
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.fx = fx
        self.fy = fy
        self.href = href
        self.imageFilter = imageFilter
        self.inset = inset
        self.insetBottom = insetBottom
        self.insetLeft = insetLeft
        self.insetRight = insetRight
        self.insetTop = insetTop
        self.interval = interval
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.mixBlendMode = mixBlendMode
        self.offset = offset
        self.opacity = opacity
        self.order = order
        self.paintOrder = paintOrder
        self.pointerEvents = pointerEvents
        self.reverse = reverse
        self.rx = rx
        self.ry = ry
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.target = target
        self.tip = tip
        self.title = title
        self.x = x
        self.x1 = x1
        self.x2 = x2
        self.y = y
        self.y1 = y1
        self.y2 = y2
        self.z = z


class RuleX(SchemaBase):
    def __init__(self, mark: str, ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., clip: Union["ParamRef", bool, str, Any] = ..., data: "PlotMarkData" = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., inset: Union[float, "ParamRef"] = ..., insetBottom: Union[float, "ParamRef"] = ..., insetTop: Union[float, "ParamRef"] = ..., interval: Union["ParamRef", "Interval"] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., marker: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerEnd: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerMid: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerStart: Union["MarkerName", str, "ParamRef", bool, Any] = ..., mixBlendMode: Union["ParamRef", str] = ..., opacity: "ChannelValueSpec" = ..., paintOrder: Union["ParamRef", str] = ..., pointerEvents: Union["ParamRef", str] = ..., reverse: Union["ParamRef", bool] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., target: Union["ParamRef", str] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., x: "ChannelValueSpec" = ..., y: "ChannelValueIntervalSpec" = ..., y1: "ChannelValueSpec" = ..., y2: "ChannelValueSpec" = ...):
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.clip = clip
        self.data = data
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.fx = fx
        self.fy = fy
        self.href = href
        self.imageFilter = imageFilter
        self.inset = inset
        self.insetBottom = insetBottom
        self.insetTop = insetTop
        self.interval = interval
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.marker = marker
        self.markerEnd = markerEnd
        self.markerMid = markerMid
        self.markerStart = markerStart
        self.mixBlendMode = mixBlendMode
        self.opacity = opacity
        self.paintOrder = paintOrder
        self.pointerEvents = pointerEvents
        self.reverse = reverse
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.target = target
        self.tip = tip
        self.title = title
        self.x = x
        self.y = y
        self.y1 = y1
        self.y2 = y2


class RuleY(SchemaBase):
    def __init__(self, mark: str, ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., clip: Union["ParamRef", bool, str, Any] = ..., data: "PlotMarkData" = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., inset: Union[float, "ParamRef"] = ..., insetBottom: Union[float, "ParamRef"] = ..., insetTop: Union[float, "ParamRef"] = ..., interval: Union["ParamRef", "Interval"] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., marker: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerEnd: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerMid: Union["MarkerName", str, "ParamRef", bool, Any] = ..., markerStart: Union["MarkerName", str, "ParamRef", bool, Any] = ..., mixBlendMode: Union["ParamRef", str] = ..., opacity: "ChannelValueSpec" = ..., paintOrder: Union["ParamRef", str] = ..., pointerEvents: Union["ParamRef", str] = ..., reverse: Union["ParamRef", bool] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., target: Union["ParamRef", str] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., x: "ChannelValueSpec" = ..., y: "ChannelValueIntervalSpec" = ..., y1: "ChannelValueSpec" = ..., y2: "ChannelValueSpec" = ...):
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.clip = clip
        self.data = data
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.fx = fx
        self.fy = fy
        self.href = href
        self.imageFilter = imageFilter
        self.inset = inset
        self.insetBottom = insetBottom
        self.insetTop = insetTop
        self.interval = interval
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.marker = marker
        self.markerEnd = markerEnd
        self.markerMid = markerMid
        self.markerStart = markerStart
        self.mixBlendMode = mixBlendMode
        self.opacity = opacity
        self.paintOrder = paintOrder
        self.pointerEvents = pointerEvents
        self.reverse = reverse
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.target = target
        self.tip = tip
        self.title = title
        self.x = x
        self.y = y
        self.y1 = y1
        self.y2 = y2


class TextX(SchemaBase):
    def __init__(self, mark: str, ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., clip: Union["ParamRef", bool, str, Any] = ..., data: "PlotMarkData" = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., fontFamily: Union["ParamRef", str] = ..., fontSize: Union["ParamRef", "ChannelValue"] = ..., fontStyle: Union["ParamRef", str] = ..., fontVariant: Union["ParamRef", str] = ..., fontWeight: Union[float, "ParamRef", str] = ..., frameAnchor: Union["ParamRef", "FrameAnchor"] = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., interval: Union["ParamRef", "Interval"] = ..., lineAnchor: Union["ParamRef", str] = ..., lineHeight: Union[float, "ParamRef"] = ..., lineWidth: Union[float, "ParamRef"] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., mixBlendMode: Union["ParamRef", str] = ..., monospace: Union["ParamRef", bool] = ..., opacity: "ChannelValueSpec" = ..., paintOrder: Union["ParamRef", str] = ..., pointerEvents: Union["ParamRef", str] = ..., reverse: Union["ParamRef", bool] = ..., rotate: Union["ParamRef", "ChannelValue"] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., target: Union["ParamRef", str] = ..., text: "ChannelValue" = ..., textAnchor: Union["ParamRef", str] = ..., textOverflow: Union["ParamRef", str, Any] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., x: "ChannelValueSpec" = ..., y: "ChannelValueIntervalSpec" = ..., z: "ChannelValue" = ...):
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.clip = clip
        self.data = data
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.fontFamily = fontFamily
        self.fontSize = fontSize
        self.fontStyle = fontStyle
        self.fontVariant = fontVariant
        self.fontWeight = fontWeight
        self.frameAnchor = frameAnchor
        self.fx = fx
        self.fy = fy
        self.href = href
        self.imageFilter = imageFilter
        self.interval = interval
        self.lineAnchor = lineAnchor
        self.lineHeight = lineHeight
        self.lineWidth = lineWidth
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.mixBlendMode = mixBlendMode
        self.monospace = monospace
        self.opacity = opacity
        self.paintOrder = paintOrder
        self.pointerEvents = pointerEvents
        self.reverse = reverse
        self.rotate = rotate
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.target = target
        self.text = text
        self.textAnchor = textAnchor
        self.textOverflow = textOverflow
        self.tip = tip
        self.title = title
        self.x = x
        self.y = y
        self.z = z


class Bin(SchemaBase):
    def __init__(self, bin: Union[Union[float, bool, str], List[Union[float, bool, str]]], interval: "BinInterval" = ..., minstep: float = ..., nice: bool = ..., offset: float = ..., step: float = ..., steps: float = ...):
        self.bin = bin
        self.interval = interval
        self.minstep = minstep
        self.nice = nice
        self.offset = offset
        self.step = step
        self.steps = steps


class ChannelDomainSort(SchemaBase):
    def __init__(self, color: "ChannelDomainValueSpec" = ..., fx: "ChannelDomainValueSpec" = ..., fy: "ChannelDomainValueSpec" = ..., length: "ChannelDomainValueSpec" = ..., limit: Union[float, List[Any]] = ..., opacity: "ChannelDomainValueSpec" = ..., order: Union[str, Any] = ..., r: "ChannelDomainValueSpec" = ..., reduce: Union[bool, "Reducer", Any] = ..., reverse: bool = ..., symbol: "ChannelDomainValueSpec" = ..., x: "ChannelDomainValueSpec" = ..., y: "ChannelDomainValueSpec" = ...):
        self.color = color
        self.fx = fx
        self.fy = fy
        self.length = length
        self.limit = limit
        self.opacity = opacity
        self.order = order
        self.r = r
        self.reduce = reduce
        self.reverse = reverse
        self.symbol = symbol
        self.x = x
        self.y = y


class HConcat(SchemaBase):
    def __init__(self, hconcat: List["Component"]):
        self.hconcat = hconcat


class VConcat(SchemaBase):
    def __init__(self, vconcat: List["Component"]):
        self.vconcat = vconcat



class Curve(CurveName):
    pass  # This is a reference to 'CurveName'


class Data(SchemaBase):
    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            if not isinstance(value, DataDefinition):
                raise ValueError(f"Value for key '{key}' must be an instance of DataDefinition.")
        self.additional_params = kwargs



class Highlight(SchemaBase):
    def __init__(self, by: "ParamRef", select: str, fill: str = ..., fillOpacity: float = ..., opacity: float = ..., stroke: str = ..., strokeOpacity: float = ...):
        self.by = by
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.opacity = opacity
        self.select = select
        self.stroke = stroke
        self.strokeOpacity = strokeOpacity


class IntervalX(SchemaBase):
    def __init__(self, select: str, as_: "ParamRef" = ..., brush: "BrushStyles" = ..., field: str = ..., peers: bool = ..., pixelSize: float = ...):
        self.as_ = as_
        self.brush = brush
        self.field = field
        self.peers = peers
        self.pixelSize = pixelSize
        self.select = select


class IntervalXY(SchemaBase):
    def __init__(self, select: str, as_: "ParamRef" = ..., brush: "BrushStyles" = ..., peers: bool = ..., pixelSize: float = ..., xfield: str = ..., yfield: str = ...):
        self.as_ = as_
        self.brush = brush
        self.peers = peers
        self.pixelSize = pixelSize
        self.select = select
        self.xfield = xfield
        self.yfield = yfield


class IntervalY(SchemaBase):
    def __init__(self, select: str, as_: "ParamRef" = ..., brush: "BrushStyles" = ..., field: str = ..., peers: bool = ..., pixelSize: float = ...):
        self.as_ = as_
        self.brush = brush
        self.field = field
        self.peers = peers
        self.pixelSize = pixelSize
        self.select = select


class Legend(SchemaBase):
    def __init__(self, legend: str, as_: "ParamRef" = ..., columns: float = ..., field: str = ..., for_: str = ..., height: float = ..., label: str = ..., marginBottom: float = ..., marginLeft: float = ..., marginRight: float = ..., marginTop: float = ..., tickSize: float = ..., width: float = ...):
        self.as_ = as_
        self.columns = columns
        self.field = field
        self.for_ = for_
        self.height = height
        self.label = label
        self.legend = legend
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.tickSize = tickSize
        self.width = width


class Menu(SchemaBase):
    def __init__(self, input: str, as_: "ParamRef" = ..., column: str = ..., field: str = ..., filterBy: "ParamRef" = ..., from_: str = ..., label: str = ..., options: List[Union[Dict[str, Any], Any]] = ..., value: Any = ...):
        self.as_ = as_
        self.column = column
        self.field = field
        self.filterBy = filterBy
        self.from_ = from_
        self.input = input
        self.label = label
        self.options = options
        self.value = value


class NearestX(SchemaBase):
    def __init__(self, select: str, as_: "ParamRef" = ..., channels: List[str] = ..., fields: List[str] = ..., maxRadius: float = ...):
        self.as_ = as_
        self.channels = channels
        self.fields = fields
        self.maxRadius = maxRadius
        self.select = select


class NearestY(SchemaBase):
    def __init__(self, select: str, as_: "ParamRef" = ..., channels: List[str] = ..., fields: List[str] = ..., maxRadius: float = ...):
        self.as_ = as_
        self.channels = channels
        self.fields = fields
        self.maxRadius = maxRadius
        self.select = select


class Pan(SchemaBase):
    def __init__(self, select: str, x: "ParamRef" = ..., xfield: str = ..., y: "ParamRef" = ..., yfield: str = ...):
        self.select = select
        self.x = x
        self.xfield = xfield
        self.y = y
        self.yfield = yfield


class PanX(SchemaBase):
    def __init__(self, select: str, x: "ParamRef" = ..., xfield: str = ..., y: "ParamRef" = ..., yfield: str = ...):
        self.select = select
        self.x = x
        self.xfield = xfield
        self.y = y
        self.yfield = yfield


class PanY(SchemaBase):
    def __init__(self, select: str, x: "ParamRef" = ..., xfield: str = ..., y: "ParamRef" = ..., yfield: str = ...):
        self.select = select
        self.x = x
        self.xfield = xfield
        self.y = y
        self.yfield = yfield


class PanZoom(SchemaBase):
    def __init__(self, select: str, x: "ParamRef" = ..., xfield: str = ..., y: "ParamRef" = ..., yfield: str = ...):
        self.select = select
        self.x = x
        self.xfield = xfield
        self.y = y
        self.yfield = yfield


class PanZoomX(SchemaBase):
    def __init__(self, select: str, x: "ParamRef" = ..., xfield: str = ..., y: "ParamRef" = ..., yfield: str = ...):
        self.select = select
        self.x = x
        self.xfield = xfield
        self.y = y
        self.yfield = yfield


class PanZoomY(SchemaBase):
    def __init__(self, select: str, x: "ParamRef" = ..., xfield: str = ..., y: "ParamRef" = ..., yfield: str = ...):
        self.select = select
        self.x = x
        self.xfield = xfield
        self.y = y
        self.yfield = yfield


class PlotFrom(SchemaBase):
    def __init__(self, filterBy: "ParamRef" = ..., from_: str = ..., optimize: bool = ...):
        self.filterBy = filterBy
        self.from_ = from_
        self.optimize = optimize


class PlotLegend(SchemaBase):
    def __init__(self, legend: str, as_: "ParamRef" = ..., columns: float = ..., field: str = ..., height: float = ..., label: str = ..., marginBottom: float = ..., marginLeft: float = ..., marginRight: float = ..., marginTop: float = ..., tickSize: float = ..., width: float = ...):
        self.as_ = as_
        self.columns = columns
        self.field = field
        self.height = height
        self.label = label
        self.legend = legend
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.tickSize = tickSize
        self.width = width


class Search(SchemaBase):
    def __init__(self, input: str, as_: "ParamRef" = ..., column: str = ..., field: str = ..., filterBy: "ParamRef" = ..., from_: str = ..., label: str = ..., type: str = ...):
        self.as_ = as_
        self.column = column
        self.field = field
        self.filterBy = filterBy
        self.from_ = from_
        self.input = input
        self.label = label
        self.type = type


class Slider(SchemaBase):
    def __init__(self, input: str, as_: "ParamRef" = ..., column: str = ..., field: str = ..., filterBy: "ParamRef" = ..., from_: str = ..., label: str = ..., max: float = ..., min: float = ..., select: str = ..., step: float = ..., value: float = ..., width: float = ...):
        self.as_ = as_
        self.column = column
        self.field = field
        self.filterBy = filterBy
        self.from_ = from_
        self.input = input
        self.label = label
        self.max = max
        self.min = min
        self.select = select
        self.step = step
        self.value = value
        self.width = width


class Table(SchemaBase):
    def __init__(self, input: str, align: Dict[str, Any] = ..., as_: "ParamRef" = ..., columns: List[str] = ..., filterBy: "ParamRef" = ..., from_: str = ..., height: float = ..., maxWidth: float = ..., rowBatch: float = ..., width: Union[float, Dict[str, Any]] = ...):
        self.align = align
        self.as_ = as_
        self.columns = columns
        self.filterBy = filterBy
        self.from_ = from_
        self.height = height
        self.input = input
        self.maxWidth = maxWidth
        self.rowBatch = rowBatch
        self.width = width


class Toggle(SchemaBase):
    def __init__(self, channels: List[str], select: str, as_: "ParamRef" = ..., peers: bool = ...):
        self.as_ = as_
        self.channels = channels
        self.peers = peers
        self.select = select


class ToggleColor(SchemaBase):
    def __init__(self, select: str, as_: "ParamRef" = ..., peers: bool = ...):
        self.as_ = as_
        self.peers = peers
        self.select = select


class ToggleX(SchemaBase):
    def __init__(self, select: str, as_: "ParamRef" = ..., peers: bool = ...):
        self.as_ = as_
        self.peers = peers
        self.select = select


class ToggleY(SchemaBase):
    def __init__(self, select: str, as_: "ParamRef" = ..., peers: bool = ...):
        self.as_ = as_
        self.peers = peers
        self.select = select



class Interval(LiteralTimeInterval):
    pass  # This is a reference to 'LiteralTimeInterval'


class Param(SchemaBase):
    def __init__(self, value: "ParamValue", select: str = ...):
        self.select = select
        self.value = value


class Params(SchemaBase):
    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            if not isinstance(value, ParamDefinition):
                raise ValueError(f"Value for key '{key}' must be an instance of ParamDefinition.")
        self.additional_params = kwargs




class StackOffset(StackOffsetName):
    pass  # This is a reference to 'StackOffsetName'



class VectorShape(VectorShapeName):
    pass  # This is a reference to 'VectorShapeName'


class TextY(SchemaBase):
    def __init__(self, mark: str, ariaDescription: Union["ParamRef", str] = ..., ariaHidden: Union["ParamRef", str] = ..., ariaLabel: "ChannelValue" = ..., clip: Union["ParamRef", bool, str, Any] = ..., data: "PlotMarkData" = ..., dx: Union[float, "ParamRef"] = ..., dy: Union[float, "ParamRef"] = ..., facet: Union["ParamRef", bool, str, Any] = ..., facetAnchor: Union["ParamRef", str, Any] = ..., fill: Union["ParamRef", "ChannelValueSpec"] = ..., fillOpacity: Union["ParamRef", "ChannelValueSpec"] = ..., filter: "ChannelValue" = ..., fontFamily: Union["ParamRef", str] = ..., fontSize: Union["ParamRef", "ChannelValue"] = ..., fontStyle: Union["ParamRef", str] = ..., fontVariant: Union["ParamRef", str] = ..., fontWeight: Union[float, "ParamRef", str] = ..., frameAnchor: Union["ParamRef", "FrameAnchor"] = ..., fx: "ChannelValue" = ..., fy: "ChannelValue" = ..., href: "ChannelValue" = ..., imageFilter: Union["ParamRef", str] = ..., interval: "Interval" = ..., lineAnchor: Union["ParamRef", str] = ..., lineHeight: Union[float, "ParamRef"] = ..., lineWidth: Union[float, "ParamRef"] = ..., margin: Union[float, "ParamRef"] = ..., marginBottom: Union[float, "ParamRef"] = ..., marginLeft: Union[float, "ParamRef"] = ..., marginRight: Union[float, "ParamRef"] = ..., marginTop: Union[float, "ParamRef"] = ..., mixBlendMode: Union["ParamRef", str] = ..., monospace: Union["ParamRef", bool] = ..., opacity: "ChannelValueSpec" = ..., paintOrder: Union["ParamRef", str] = ..., pointerEvents: Union["ParamRef", str] = ..., reverse: Union["ParamRef", bool] = ..., rotate: Union["ParamRef", "ChannelValue"] = ..., select: "SelectFilter" = ..., shapeRendering: Union["ParamRef", str] = ..., sort: Union["SortOrder", "ChannelDomainSort"] = ..., stroke: Union["ParamRef", "ChannelValueSpec"] = ..., strokeDasharray: Union[float, "ParamRef", str] = ..., strokeDashoffset: Union[float, "ParamRef", str] = ..., strokeLinecap: Union["ParamRef", str] = ..., strokeLinejoin: Union["ParamRef", str] = ..., strokeMiterlimit: Union[float, "ParamRef"] = ..., strokeOpacity: "ChannelValueSpec" = ..., strokeWidth: "ChannelValueSpec" = ..., target: Union["ParamRef", str] = ..., text: "ChannelValue" = ..., textAnchor: Union["ParamRef", str] = ..., textOverflow: Union["ParamRef", str, Any] = ..., tip: Union[Dict[str, Any], "ParamRef", bool, "TipPointer"] = ..., title: "ChannelValue" = ..., x: "ChannelValueIntervalSpec" = ..., y: "ChannelValueSpec" = ..., z: "ChannelValue" = ...):
        self.ariaDescription = ariaDescription
        self.ariaHidden = ariaHidden
        self.ariaLabel = ariaLabel
        self.clip = clip
        self.data = data
        self.dx = dx
        self.dy = dy
        self.facet = facet
        self.facetAnchor = facetAnchor
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.filter = filter
        self.fontFamily = fontFamily
        self.fontSize = fontSize
        self.fontStyle = fontStyle
        self.fontVariant = fontVariant
        self.fontWeight = fontWeight
        self.frameAnchor = frameAnchor
        self.fx = fx
        self.fy = fy
        self.href = href
        self.imageFilter = imageFilter
        self.interval = interval
        self.lineAnchor = lineAnchor
        self.lineHeight = lineHeight
        self.lineWidth = lineWidth
        self.margin = margin
        self.marginBottom = marginBottom
        self.marginLeft = marginLeft
        self.marginRight = marginRight
        self.marginTop = marginTop
        self.mark = mark
        self.mixBlendMode = mixBlendMode
        self.monospace = monospace
        self.opacity = opacity
        self.paintOrder = paintOrder
        self.pointerEvents = pointerEvents
        self.reverse = reverse
        self.rotate = rotate
        self.select = select
        self.shapeRendering = shapeRendering
        self.sort = sort
        self.stroke = stroke
        self.strokeDasharray = strokeDasharray
        self.strokeDashoffset = strokeDashoffset
        self.strokeLinecap = strokeLinecap
        self.strokeLinejoin = strokeLinejoin
        self.strokeMiterlimit = strokeMiterlimit
        self.strokeOpacity = strokeOpacity
        self.strokeWidth = strokeWidth
        self.target = target
        self.text = text
        self.textAnchor = textAnchor
        self.textOverflow = textOverflow
        self.tip = tip
        self.title = title
        self.x = x
        self.y = y
        self.z = z
