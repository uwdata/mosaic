from typing import Any, Union

class AggregateExpression:
    def __init__(self, agg: str, label: str = None):
        self.agg = agg
        self.label = label


class AggregateTransform:
    def __init__(self, value: Union["Argmax", "Argmin", "Avg", "Count", "Max", "Min", "First", "Last", "Median", "Mode", "Product", "Quantile", "Stddev", "StddevPop", "Sum", "Variance", "VarPop"]):
        self.value = value


class ChannelValue:
    def __init__(self, value: Union["Any", "str", "Any", "bool", "Any", "Transform", "SQLExpression", "AggregateExpression"]):
        self.value = value


class PlotMarkData:
    def __init__(self, value: Union["PlotDataInline", "PlotFrom"]):
        self.value = value


class ChannelValueSpec:
    def __init__(self, value: Union["ChannelValue", "Dict[str, Any]"]):
        self.value = value


class SelectFilter:
    def __init__(self):
        pass


class Argmax:
    def __init__(self, argmax: Any, distinct: Union[, 'Any', 'ParamRef'] = None, orderby: Union[, 'Any', 'ParamRef'] = None, partitionby: Union[, 'Any', 'ParamRef'] = None, range: Union[, 'Any', 'ParamRef'] = None, rows: Union[, 'Any', 'ParamRef'] = None):
        self.argmax = argmax
        self.distinct = distinct
        self.orderby = orderby
        self.partitionby = partitionby
        self.range = range
        self.rows = rows


class Argmin:
    def __init__(self, argmin: Any, distinct: Union[, 'Any', 'ParamRef'] = None, orderby: Union[, 'Any', 'ParamRef'] = None, partitionby: Union[, 'Any', 'ParamRef'] = None, range: Union[, 'Any', 'ParamRef'] = None, rows: Union[, 'Any', 'ParamRef'] = None):
        self.argmin = argmin
        self.distinct = distinct
        self.orderby = orderby
        self.partitionby = partitionby
        self.range = range
        self.rows = rows


class Avg:
    def __init__(self, avg: Union[, 'Any', 'Any'], distinct: Union[, 'Any', 'ParamRef'] = None, orderby: Union[, 'Any', 'ParamRef'] = None, partitionby: Union[, 'Any', 'ParamRef'] = None, range: Union[, 'Any', 'ParamRef'] = None, rows: Union[, 'Any', 'ParamRef'] = None):
        self.avg = avg
        self.distinct = distinct
        self.orderby = orderby
        self.partitionby = partitionby
        self.range = range
        self.rows = rows


class ChannelValueIntervalSpec:
    def __init__(self, value: Union["ChannelValueSpec", "Dict[str, Any]"]):
        self.value = value


class BinInterval:
    def __init__(self):
        pass


class BrushStyles:
    def __init__(self, fill: Any = None, fillOpacity: Any = None, opacity: Any = None, stroke: Any = None, strokeOpacity: Any = None):
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.opacity = opacity
        self.stroke = stroke
        self.strokeOpacity = strokeOpacity


class CSSStyles:
    def __init__(self, accentColor: str = None, alignContent: str = None, alignItems: str = None, alignSelf: str = None, alignmentBaseline: str = None, all: str = None, animation: str = None, animationComposition: str = None, animationDelay: str = None, animationDirection: str = None, animationDuration: str = None, animationFillMode: str = None, animationIterationCount: str = None, animationName: str = None, animationPlayState: str = None, animationTimingFunction: str = None, appearance: str = None, aspectRatio: str = None, backdropFilter: str = None, backfaceVisibility: str = None, background: str = None, backgroundAttachment: str = None, backgroundBlendMode: str = None, backgroundClip: str = None, backgroundColor: str = None, backgroundImage: str = None, backgroundOrigin: str = None, backgroundPosition: str = None, backgroundPositionX: str = None, backgroundPositionY: str = None, backgroundRepeat: str = None, backgroundSize: str = None, baselineShift: str = None, baselineSource: str = None, blockSize: str = None, border: str = None, borderBlock: str = None, borderBlockColor: str = None, borderBlockEnd: str = None, borderBlockEndColor: str = None, borderBlockEndStyle: str = None, borderBlockEndWidth: str = None, borderBlockStart: str = None, borderBlockStartColor: str = None, borderBlockStartStyle: str = None, borderBlockStartWidth: str = None, borderBlockStyle: str = None, borderBlockWidth: str = None, borderBottom: str = None, borderBottomColor: str = None, borderBottomLeftRadius: str = None, borderBottomRightRadius: str = None, borderBottomStyle: str = None, borderBottomWidth: str = None, borderCollapse: str = None, borderColor: str = None, borderEndEndRadius: str = None, borderEndStartRadius: str = None, borderImage: str = None, borderImageOutset: str = None, borderImageRepeat: str = None, borderImageSlice: str = None, borderImageSource: str = None, borderImageWidth: str = None, borderInline: str = None, borderInlineColor: str = None, borderInlineEnd: str = None, borderInlineEndColor: str = None, borderInlineEndStyle: str = None, borderInlineEndWidth: str = None, borderInlineStart: str = None, borderInlineStartColor: str = None, borderInlineStartStyle: str = None, borderInlineStartWidth: str = None, borderInlineStyle: str = None, borderInlineWidth: str = None, borderLeft: str = None, borderLeftColor: str = None, borderLeftStyle: str = None, borderLeftWidth: str = None, borderRadius: str = None, borderRight: str = None, borderRightColor: str = None, borderRightStyle: str = None, borderRightWidth: str = None, borderSpacing: str = None, borderStartEndRadius: str = None, borderStartStartRadius: str = None, borderStyle: str = None, borderTop: str = None, borderTopColor: str = None, borderTopLeftRadius: str = None, borderTopRightRadius: str = None, borderTopStyle: str = None, borderTopWidth: str = None, borderWidth: str = None, bottom: str = None, boxShadow: str = None, boxSizing: str = None, breakAfter: str = None, breakBefore: str = None, breakInside: str = None, captionSide: str = None, caretColor: str = None, clear: str = None, clip: str = None, clipPath: str = None, clipRule: str = None, color: str = None, colorInterpolation: str = None, colorInterpolationFilters: str = None, colorScheme: str = None, columnCount: str = None, columnFill: str = None, columnGap: str = None, columnRule: str = None, columnRuleColor: str = None, columnRuleStyle: str = None, columnRuleWidth: str = None, columnSpan: str = None, columnWidth: str = None, columns: str = None, contain: str = None, containIntrinsicBlockSize: str = None, containIntrinsicHeight: str = None, containIntrinsicInlineSize: str = None, containIntrinsicSize: str = None, containIntrinsicWidth: str = None, container: str = None, containerName: str = None, containerType: str = None, content: str = None, contentVisibility: str = None, counterIncrement: str = None, counterReset: str = None, counterSet: str = None, cssFloat: str = None, cssText: str = None, cursor: str = None, cx: str = None, cy: str = None, d: str = None, direction: str = None, display: str = None, dominantBaseline: str = None, emptyCells: str = None, fill: str = None, fillOpacity: str = None, fillRule: str = None, filter: str = None, flex: str = None, flexBasis: str = None, flexDirection: str = None, flexFlow: str = None, flexGrow: str = None, flexShrink: str = None, flexWrap: str = None, float: str = None, floodColor: str = None, floodOpacity: str = None, font: str = None, fontFamily: str = None, fontFeatureSettings: str = None, fontKerning: str = None, fontOpticalSizing: str = None, fontPalette: str = None, fontSize: str = None, fontSizeAdjust: str = None, fontStretch: str = None, fontStyle: str = None, fontSynthesis: str = None, fontSynthesisSmallCaps: str = None, fontSynthesisStyle: str = None, fontSynthesisWeight: str = None, fontVariant: str = None, fontVariantAlternates: str = None, fontVariantCaps: str = None, fontVariantEastAsian: str = None, fontVariantLigatures: str = None, fontVariantNumeric: str = None, fontVariantPosition: str = None, fontVariationSettings: str = None, fontWeight: str = None, forcedColorAdjust: str = None, gap: str = None, grid: str = None, gridArea: str = None, gridAutoColumns: str = None, gridAutoFlow: str = None, gridAutoRows: str = None, gridColumn: str = None, gridColumnEnd: str = None, gridColumnGap: str = None, gridColumnStart: str = None, gridGap: str = None, gridRow: str = None, gridRowEnd: str = None, gridRowGap: str = None, gridRowStart: str = None, gridTemplate: str = None, gridTemplateAreas: str = None, gridTemplateColumns: str = None, gridTemplateRows: str = None, height: str = None, hyphenateCharacter: str = None, hyphens: str = None, imageOrientation: str = None, imageRendering: str = None, inlineSize: str = None, inset: str = None, insetBlock: str = None, insetBlockEnd: str = None, insetBlockStart: str = None, insetInline: str = None, insetInlineEnd: str = None, insetInlineStart: str = None, isolation: str = None, justifyContent: str = None, justifyItems: str = None, justifySelf: str = None, left: str = None, length: str = None, letterSpacing: str = None, lightingColor: str = None, lineBreak: str = None, lineHeight: str = None, listStyle: str = None, listStyleImage: str = None, listStylePosition: str = None, listStyleType: str = None, margin: str = None, marginBlock: str = None, marginBlockEnd: str = None, marginBlockStart: str = None, marginBottom: str = None, marginInline: str = None, marginInlineEnd: str = None, marginInlineStart: str = None, marginLeft: str = None, marginRight: str = None, marginTop: str = None, marker: str = None, markerEnd: str = None, markerMid: str = None, markerStart: str = None, mask: str = None, maskClip: str = None, maskComposite: str = None, maskImage: str = None, maskMode: str = None, maskOrigin: str = None, maskPosition: str = None, maskRepeat: str = None, maskSize: str = None, maskType: str = None, mathDepth: str = None, mathStyle: str = None, maxBlockSize: str = None, maxHeight: str = None, maxInlineSize: str = None, maxWidth: str = None, minBlockSize: str = None, minHeight: str = None, minInlineSize: str = None, minWidth: str = None, mixBlendMode: str = None, objectFit: str = None, objectPosition: str = None, offset: str = None, offsetAnchor: str = None, offsetDistance: str = None, offsetPath: str = None, offsetPosition: str = None, offsetRotate: str = None, opacity: str = None, order: str = None, orphans: str = None, outline: str = None, outlineColor: str = None, outlineOffset: str = None, outlineStyle: str = None, outlineWidth: str = None, overflow: str = None, overflowAnchor: str = None, overflowClipMargin: str = None, overflowWrap: str = None, overflowX: str = None, overflowY: str = None, overscrollBehavior: str = None, overscrollBehaviorBlock: str = None, overscrollBehaviorInline: str = None, overscrollBehaviorX: str = None, overscrollBehaviorY: str = None, padding: str = None, paddingBlock: str = None, paddingBlockEnd: str = None, paddingBlockStart: str = None, paddingBottom: str = None, paddingInline: str = None, paddingInlineEnd: str = None, paddingInlineStart: str = None, paddingLeft: str = None, paddingRight: str = None, paddingTop: str = None, page: str = None, pageBreakAfter: str = None, pageBreakBefore: str = None, pageBreakInside: str = None, paintOrder: str = None, perspective: str = None, perspectiveOrigin: str = None, placeContent: str = None, placeItems: str = None, placeSelf: str = None, pointerEvents: str = None, position: str = None, printColorAdjust: str = None, quotes: str = None, r: str = None, resize: str = None, right: str = None, rotate: str = None, rowGap: str = None, rubyPosition: str = None, rx: str = None, ry: str = None, scale: str = None, scrollBehavior: str = None, scrollMargin: str = None, scrollMarginBlock: str = None, scrollMarginBlockEnd: str = None, scrollMarginBlockStart: str = None, scrollMarginBottom: str = None, scrollMarginInline: str = None, scrollMarginInlineEnd: str = None, scrollMarginInlineStart: str = None, scrollMarginLeft: str = None, scrollMarginRight: str = None, scrollMarginTop: str = None, scrollPadding: str = None, scrollPaddingBlock: str = None, scrollPaddingBlockEnd: str = None, scrollPaddingBlockStart: str = None, scrollPaddingBottom: str = None, scrollPaddingInline: str = None, scrollPaddingInlineEnd: str = None, scrollPaddingInlineStart: str = None, scrollPaddingLeft: str = None, scrollPaddingRight: str = None, scrollPaddingTop: str = None, scrollSnapAlign: str = None, scrollSnapStop: str = None, scrollSnapType: str = None, scrollbarColor: str = None, scrollbarGutter: str = None, scrollbarWidth: str = None, shapeImageThreshold: str = None, shapeMargin: str = None, shapeOutside: str = None, shapeRendering: str = None, stopColor: str = None, stopOpacity: str = None, stroke: str = None, strokeDasharray: str = None, strokeDashoffset: str = None, strokeLinecap: str = None, strokeLinejoin: str = None, strokeMiterlimit: str = None, strokeOpacity: str = None, strokeWidth: str = None, tabSize: str = None, tableLayout: str = None, textAlign: str = None, textAlignLast: str = None, textAnchor: str = None, textCombineUpright: str = None, textDecoration: str = None, textDecorationColor: str = None, textDecorationLine: str = None, textDecorationSkipInk: str = None, textDecorationStyle: str = None, textDecorationThickness: str = None, textEmphasis: str = None, textEmphasisColor: str = None, textEmphasisPosition: str = None, textEmphasisStyle: str = None, textIndent: str = None, textOrientation: str = None, textOverflow: str = None, textRendering: str = None, textShadow: str = None, textTransform: str = None, textUnderlineOffset: str = None, textUnderlinePosition: str = None, textWrap: str = None, textWrapMode: str = None, textWrapStyle: str = None, top: str = None, touchAction: str = None, transform: str = None, transformBox: str = None, transformOrigin: str = None, transformStyle: str = None, transition: str = None, transitionBehavior: str = None, transitionDelay: str = None, transitionDuration: str = None, transitionProperty: str = None, transitionTimingFunction: str = None, translate: str = None, unicodeBidi: str = None, userSelect: str = None, vectorEffect: str = None, verticalAlign: str = None, visibility: str = None, webkitAlignContent: str = None, webkitAlignItems: str = None, webkitAlignSelf: str = None, webkitAnimation: str = None, webkitAnimationDelay: str = None, webkitAnimationDirection: str = None, webkitAnimationDuration: str = None, webkitAnimationFillMode: str = None, webkitAnimationIterationCount: str = None, webkitAnimationName: str = None, webkitAnimationPlayState: str = None, webkitAnimationTimingFunction: str = None, webkitAppearance: str = None, webkitBackfaceVisibility: str = None, webkitBackgroundClip: str = None, webkitBackgroundOrigin: str = None, webkitBackgroundSize: str = None, webkitBorderBottomLeftRadius: str = None, webkitBorderBottomRightRadius: str = None, webkitBorderRadius: str = None, webkitBorderTopLeftRadius: str = None, webkitBorderTopRightRadius: str = None, webkitBoxAlign: str = None, webkitBoxFlex: str = None, webkitBoxOrdinalGroup: str = None, webkitBoxOrient: str = None, webkitBoxPack: str = None, webkitBoxShadow: str = None, webkitBoxSizing: str = None, webkitFilter: str = None, webkitFlex: str = None, webkitFlexBasis: str = None, webkitFlexDirection: str = None, webkitFlexFlow: str = None, webkitFlexGrow: str = None, webkitFlexShrink: str = None, webkitFlexWrap: str = None, webkitJustifyContent: str = None, webkitLineClamp: str = None, webkitMask: str = None, webkitMaskBoxImage: str = None, webkitMaskBoxImageOutset: str = None, webkitMaskBoxImageRepeat: str = None, webkitMaskBoxImageSlice: str = None, webkitMaskBoxImageSource: str = None, webkitMaskBoxImageWidth: str = None, webkitMaskClip: str = None, webkitMaskComposite: str = None, webkitMaskImage: str = None, webkitMaskOrigin: str = None, webkitMaskPosition: str = None, webkitMaskRepeat: str = None, webkitMaskSize: str = None, webkitOrder: str = None, webkitPerspective: str = None, webkitPerspectiveOrigin: str = None, webkitTextFillColor: str = None, webkitTextSizeAdjust: str = None, webkitTextStroke: str = None, webkitTextStrokeColor: str = None, webkitTextStrokeWidth: str = None, webkitTransform: str = None, webkitTransformOrigin: str = None, webkitTransformStyle: str = None, webkitTransition: str = None, webkitTransitionDelay: str = None, webkitTransitionDuration: str = None, webkitTransitionProperty: str = None, webkitTransitionTimingFunction: str = None, webkitUserSelect: str = None, whiteSpace: str = None, whiteSpaceCollapse: str = None, widows: str = None, width: str = None, willChange: str = None, wordBreak: str = None, wordSpacing: str = None, wordWrap: str = None, writingMode: str = None, x: str = None, y: str = None, zIndex: str = None, zoom: str = None):
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


class Centroid:
    def __init__(self, centroid: Union[, 'Any', 'Any']):
        self.centroid = centroid


class CentroidX:
    def __init__(self, centroidX: Union[, 'Any', 'Any']):
        self.centroidX = centroidX


class CentroidY:
    def __init__(self, centroidY: Union[, 'Any', 'Any']):
        self.centroidY = centroidY


class ChannelDomainValueSpec:
    def __init__(self, value: Union["ChannelDomainValue", "Dict[str, Any]"]):
        self.value = value


class ChannelDomainValue:
    def __init__(self, value: Union["Union[, 'ChannelName', 'str', 'str', 'str']", "str", "str", "str", "str", "str", "str", "str", "str", "str", "str", "str", "str", "str", "str", "str", "str", "str", "str", "str", "str", "str", "str", "str", "str", "str", "str", "str", "str", "str", "str", "str", "Any"]):
        self.value = value


class ChannelName:
    def __init__(self):
        pass


class ColorScaleType:
    def __init__(self):
        pass


class ColorScheme:
    def __init__(self, value: Union["str", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]"]):
        self.value = value


class ColumnTransform:
    def __init__(self, value: Union["Bin", "DateMonth", "DateMonthDay", "DateDay", "Centroid", "CentroidX", "CentroidY", "GeoJSON"]):
        self.value = value


class Component:
    def __init__(self, value: Union["HConcat", "VConcat", "HSpace", "VSpace", "Menu", "Search", "Slider", "Table", "Plot", "PlotMark", "Legend"]):
        self.value = value


class Config:
    def __init__(self, extensions: Union[, 'str', 'Any'] = None):
        self.extensions = extensions


class ContinuousScaleType:
    def __init__(self):
        pass


class Count:
    def __init__(self, count: Union[, 'Union[, 'Any', 'Any']', 'Union[, 'Any', 'Any']'], distinct: Union[, 'Any', 'ParamRef'] = None, orderby: Union[, 'Any', 'ParamRef'] = None, partitionby: Union[, 'Any', 'ParamRef'] = None, range: Union[, 'Any', 'ParamRef'] = None, rows: Union[, 'Any', 'ParamRef'] = None):
        self.count = count
        self.distinct = distinct
        self.orderby = orderby
        self.partitionby = partitionby
        self.range = range
        self.rows = rows


class CumeDist:
    def __init__(self, cume_dist: Union[, 'Any', 'Any'], orderby: Union[, 'Any', 'ParamRef'] = None, partitionby: Union[, 'Any', 'ParamRef'] = None, range: Union[, 'Any', 'ParamRef'] = None, rows: Union[, 'Any', 'ParamRef'] = None):
        self.cume_dist = cume_dist
        self.orderby = orderby
        self.partitionby = partitionby
        self.range = range
        self.rows = rows


class CurveName:
    def __init__(self):
        pass


class DataDefinition:
    def __init__(self, value: Union["DataQuery", "DataArray", "DataFile", "DataTable", "DataParquet", "DataCSV", "DataSpatial", "DataJSON", "DataJSONObjects"]):
        self.value = value


class DataArray:
    def __init__(self):
        pass


class DataCSV:
    def __init__(self, file: str, type: str, delimiter: Union[, 'str', 'Any'] = None, replace: Union[, 'str', 'Any'] = None, sample_size: Union[, 'str', 'Any'] = None, select: Union[, 'str', 'Any'] = None, temp: Union[, 'str', 'Any'] = None, view: Union[, 'str', 'Any'] = None, where: Union[, 'str', 'Any'] = None):
        self.delimiter = delimiter
        self.file = file
        self.replace = replace
        self.sample_size = sample_size
        self.select = select
        self.temp = temp
        self.type = type
        self.view = view
        self.where = where


class DataFile:
    def __init__(self, file: Any, replace: Union[, 'str', 'Any'] = None, select: Union[, 'str', 'Any'] = None, temp: Union[, 'str', 'Any'] = None, view: Union[, 'str', 'Any'] = None, where: Union[, 'str', 'Any'] = None):
        self.file = file
        self.replace = replace
        self.select = select
        self.temp = temp
        self.view = view
        self.where = where


class DataJSON:
    def __init__(self, file: str, type: str, replace: Union[, 'str', 'Any'] = None, select: Union[, 'str', 'Any'] = None, temp: Union[, 'str', 'Any'] = None, view: Union[, 'str', 'Any'] = None, where: Union[, 'str', 'Any'] = None):
        self.file = file
        self.replace = replace
        self.select = select
        self.temp = temp
        self.type = type
        self.view = view
        self.where = where


class DataJSONObjects:
    def __init__(self, data: Any, replace: Union[, 'str', 'Any'] = None, select: Union[, 'str', 'Any'] = None, temp: Union[, 'str', 'Any'] = None, type: Union[, 'str', 'Any'] = None, view: Union[, 'str', 'Any'] = None, where: Union[, 'str', 'Any'] = None):
        self.data = data
        self.replace = replace
        self.select = select
        self.temp = temp
        self.type = type
        self.view = view
        self.where = where


class DataParquet:
    def __init__(self, file: str, type: str, replace: Union[, 'str', 'Any'] = None, select: Union[, 'str', 'Any'] = None, temp: Union[, 'str', 'Any'] = None, view: Union[, 'str', 'Any'] = None, where: Union[, 'str', 'Any'] = None):
        self.file = file
        self.replace = replace
        self.select = select
        self.temp = temp
        self.type = type
        self.view = view
        self.where = where


class DataQuery:
    def __init__(self):
        pass


class DataSpatial:
    def __init__(self, file: str, type: str, layer: Union[, 'str', 'Any'] = None, replace: Union[, 'str', 'Any'] = None, select: Union[, 'str', 'Any'] = None, temp: Union[, 'str', 'Any'] = None, view: Union[, 'str', 'Any'] = None, where: Union[, 'str', 'Any'] = None):
        self.file = file
        self.layer = layer
        self.replace = replace
        self.select = select
        self.temp = temp
        self.type = type
        self.view = view
        self.where = where


class DataTable:
    def __init__(self, query: str, type: str, replace: Union[, 'str', 'Any'] = None, select: Union[, 'str', 'Any'] = None, temp: Union[, 'str', 'Any'] = None, view: Union[, 'str', 'Any'] = None, where: Union[, 'str', 'Any'] = None):
        self.query = query
        self.replace = replace
        self.select = select
        self.temp = temp
        self.type = type
        self.view = view
        self.where = where


class DateDay:
    def __init__(self, dateDay: Union[, 'Any', 'Any']):
        self.dateDay = dateDay


class DateMonth:
    def __init__(self, dateMonth: Union[, 'Any', 'Any']):
        self.dateMonth = dateMonth


class DateMonthDay:
    def __init__(self, dateMonthDay: Union[, 'Any', 'Any']):
        self.dateMonthDay = dateMonthDay


class DenseRank:
    def __init__(self, dense_rank: Union[, 'Any', 'Any'], orderby: Union[, 'Any', 'ParamRef'] = None, partitionby: Union[, 'Any', 'ParamRef'] = None, range: Union[, 'Any', 'ParamRef'] = None, rows: Union[, 'Any', 'ParamRef'] = None):
        self.dense_rank = dense_rank
        self.orderby = orderby
        self.partitionby = partitionby
        self.range = range
        self.rows = rows


class DensityX:
    def __init__(self, value: Union["Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]"]):
        self.value = value


class DensityY:
    def __init__(self, value: Union["Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]"]):
        self.value = value


class DiscreteScaleType:
    def __init__(self):
        pass


class First:
    def __init__(self, first: Union[, 'Any', 'Any'], distinct: Union[, 'Any', 'ParamRef'] = None, orderby: Union[, 'Any', 'ParamRef'] = None, partitionby: Union[, 'Any', 'ParamRef'] = None, range: Union[, 'Any', 'ParamRef'] = None, rows: Union[, 'Any', 'ParamRef'] = None):
        self.distinct = distinct
        self.first = first
        self.orderby = orderby
        self.partitionby = partitionby
        self.range = range
        self.rows = rows


class FirstValue:
    def __init__(self, first_value: Union[, 'Any', 'Any'], orderby: Union[, 'Any', 'ParamRef'] = None, partitionby: Union[, 'Any', 'ParamRef'] = None, range: Union[, 'Any', 'ParamRef'] = None, rows: Union[, 'Any', 'ParamRef'] = None):
        self.first_value = first_value
        self.orderby = orderby
        self.partitionby = partitionby
        self.range = range
        self.rows = rows


class Fixed:
    def __init__(self):
        pass


class FrameAnchor:
    def __init__(self):
        pass


class GeoJSON:
    def __init__(self, geojson: Union[, 'Any', 'Any']):
        self.geojson = geojson


class GridInterpolate:
    def __init__(self):
        pass


class HSpace:
    def __init__(self, hspace: Any):
        self.hspace = hspace


class ParamRef:
    def __init__(self):
        pass


class Interpolate:
    def __init__(self):
        pass


class LiteralTimeInterval:
    def __init__(self, value: Union["str", "str", "TimeIntervalName", "str", "str", "str", "str", "str", "str", "str", "str", "str", "str", "str", "str", "str", "str", "str", "str", "str"]):
        self.value = value


class LabelArrow:
    def __init__(self):
        pass


class Lag:
    def __init__(self, lag: Union[, 'Any', 'Any'], orderby: Union[, 'Any', 'ParamRef'] = None, partitionby: Union[, 'Any', 'ParamRef'] = None, range: Union[, 'Any', 'ParamRef'] = None, rows: Union[, 'Any', 'ParamRef'] = None):
        self.lag = lag
        self.orderby = orderby
        self.partitionby = partitionby
        self.range = range
        self.rows = rows


class Last:
    def __init__(self, last: Union[, 'Any', 'Any'], distinct: Union[, 'Any', 'ParamRef'] = None, orderby: Union[, 'Any', 'ParamRef'] = None, partitionby: Union[, 'Any', 'ParamRef'] = None, range: Union[, 'Any', 'ParamRef'] = None, rows: Union[, 'Any', 'ParamRef'] = None):
        self.distinct = distinct
        self.last = last
        self.orderby = orderby
        self.partitionby = partitionby
        self.range = range
        self.rows = rows


class LastValue:
    def __init__(self, last_value: Union[, 'Any', 'Any'], orderby: Union[, 'Any', 'ParamRef'] = None, partitionby: Union[, 'Any', 'ParamRef'] = None, range: Union[, 'Any', 'ParamRef'] = None, rows: Union[, 'Any', 'ParamRef'] = None):
        self.last_value = last_value
        self.orderby = orderby
        self.partitionby = partitionby
        self.range = range
        self.rows = rows


class Lead:
    def __init__(self, lag: Union[, 'Any', 'Any'], orderby: Union[, 'Any', 'ParamRef'] = None, partitionby: Union[, 'Any', 'ParamRef'] = None, range: Union[, 'Any', 'ParamRef'] = None, rows: Union[, 'Any', 'ParamRef'] = None):
        self.lag = lag
        self.orderby = orderby
        self.partitionby = partitionby
        self.range = range
        self.rows = rows


class MarkerName:
    def __init__(self):
        pass


class Max:
    def __init__(self, max: Union[, 'Any', 'Any'], distinct: Union[, 'Any', 'ParamRef'] = None, orderby: Union[, 'Any', 'ParamRef'] = None, partitionby: Union[, 'Any', 'ParamRef'] = None, range: Union[, 'Any', 'ParamRef'] = None, rows: Union[, 'Any', 'ParamRef'] = None):
        self.distinct = distinct
        self.max = max
        self.orderby = orderby
        self.partitionby = partitionby
        self.range = range
        self.rows = rows


class Median:
    def __init__(self, median: Union[, 'Any', 'Any'], distinct: Union[, 'Any', 'ParamRef'] = None, orderby: Union[, 'Any', 'ParamRef'] = None, partitionby: Union[, 'Any', 'ParamRef'] = None, range: Union[, 'Any', 'ParamRef'] = None, rows: Union[, 'Any', 'ParamRef'] = None):
        self.distinct = distinct
        self.median = median
        self.orderby = orderby
        self.partitionby = partitionby
        self.range = range
        self.rows = rows


class Meta:
    def __init__(self, credit: str = None, description: str = None, title: str = None):
        self.credit = credit
        self.description = description
        self.title = title


class Min:
    def __init__(self, min: Union[, 'Any', 'Any'], distinct: Union[, 'Any', 'ParamRef'] = None, orderby: Union[, 'Any', 'ParamRef'] = None, partitionby: Union[, 'Any', 'ParamRef'] = None, range: Union[, 'Any', 'ParamRef'] = None, rows: Union[, 'Any', 'ParamRef'] = None):
        self.distinct = distinct
        self.min = min
        self.orderby = orderby
        self.partitionby = partitionby
        self.range = range
        self.rows = rows


class Mode:
    def __init__(self, mode: Union[, 'Any', 'Any'], distinct: Union[, 'Any', 'ParamRef'] = None, orderby: Union[, 'Any', 'ParamRef'] = None, partitionby: Union[, 'Any', 'ParamRef'] = None, range: Union[, 'Any', 'ParamRef'] = None, rows: Union[, 'Any', 'ParamRef'] = None):
        self.distinct = distinct
        self.mode = mode
        self.orderby = orderby
        self.partitionby = partitionby
        self.range = range
        self.rows = rows


class NTile:
    def __init__(self, ntile: Union[, 'Any', 'Any'], orderby: Union[, 'Any', 'ParamRef'] = None, partitionby: Union[, 'Any', 'ParamRef'] = None, range: Union[, 'Any', 'ParamRef'] = None, rows: Union[, 'Any', 'ParamRef'] = None):
        self.ntile = ntile
        self.orderby = orderby
        self.partitionby = partitionby
        self.range = range
        self.rows = rows


class NthValue:
    def __init__(self, nth_value: Union[, 'Any', 'Any'], orderby: Union[, 'Any', 'ParamRef'] = None, partitionby: Union[, 'Any', 'ParamRef'] = None, range: Union[, 'Any', 'ParamRef'] = None, rows: Union[, 'Any', 'ParamRef'] = None):
        self.nth_value = nth_value
        self.orderby = orderby
        self.partitionby = partitionby
        self.range = range
        self.rows = rows


class ParamValue:
    def __init__(self, value: Union["ParamLiteral", "Any"]):
        self.value = value


class ParamDate:
    def __init__(self, date: str, select: str = None):
        self.date = date
        self.select = select


class ParamDefinition:
    def __init__(self, value: Union["ParamValue", "Param", "ParamDate", "Selection"]):
        self.value = value


class ParamLiteral:
    def __init__(self):
        pass


class PercentRank:
    def __init__(self, percent_rank: Union[, 'Any', 'Any'], orderby: Union[, 'Any', 'ParamRef'] = None, partitionby: Union[, 'Any', 'ParamRef'] = None, range: Union[, 'Any', 'ParamRef'] = None, rows: Union[, 'Any', 'ParamRef'] = None):
        self.orderby = orderby
        self.partitionby = partitionby
        self.percent_rank = percent_rank
        self.range = range
        self.rows = rows


class Plot:
    def __init__(self, plot: Any, align: Union[, 'bool', 'ParamRef'] = None, aspectRatio: Union[, 'bool', 'ParamRef'] = None, axis: Union[, 'bool', 'ParamRef'] = None, colorBase: Union[, 'bool', 'ParamRef'] = None, colorClamp: Union[, 'bool', 'ParamRef'] = None, colorConstant: Union[, 'bool', 'ParamRef'] = None, colorDomain: Union[, 'bool', 'ParamRef'] = None, colorExponent: Union[, 'bool', 'ParamRef'] = None, colorInterpolate: Union[, 'bool', 'ParamRef'] = None, colorLabel: Union[, 'bool', 'ParamRef'] = None, colorN: Union[, 'bool', 'ParamRef'] = None, colorNice: Union[, 'bool', 'ParamRef'] = None, colorPercent: Union[, 'bool', 'ParamRef'] = None, colorPivot: Union[, 'bool', 'ParamRef'] = None, colorRange: Union[, 'bool', 'ParamRef'] = None, colorReverse: Union[, 'bool', 'ParamRef'] = None, colorScale: Union[, 'bool', 'ParamRef'] = None, colorScheme: Union[, 'bool', 'ParamRef'] = None, colorSymmetric: Union[, 'bool', 'ParamRef'] = None, colorTickFormat: Union[, 'bool', 'ParamRef'] = None, colorZero: Union[, 'bool', 'ParamRef'] = None, facetGrid: Union[, 'bool', 'ParamRef'] = None, facetLabel: Union[, 'bool', 'ParamRef'] = None, facetMargin: Union[, 'bool', 'ParamRef'] = None, facetMarginBottom: Union[, 'bool', 'ParamRef'] = None, facetMarginLeft: Union[, 'bool', 'ParamRef'] = None, facetMarginRight: Union[, 'bool', 'ParamRef'] = None, facetMarginTop: Union[, 'bool', 'ParamRef'] = None, fxAlign: Union[, 'bool', 'ParamRef'] = None, fxAriaDescription: Union[, 'bool', 'ParamRef'] = None, fxAriaLabel: Union[, 'bool', 'ParamRef'] = None, fxAxis: Union[, 'bool', 'ParamRef'] = None, fxDomain: Union[, 'bool', 'ParamRef'] = None, fxFontVariant: Union[, 'bool', 'ParamRef'] = None, fxGrid: Union[, 'bool', 'ParamRef'] = None, fxInset: Union[, 'bool', 'ParamRef'] = None, fxInsetLeft: Union[, 'bool', 'ParamRef'] = None, fxInsetRight: Union[, 'bool', 'ParamRef'] = None, fxLabel: Union[, 'bool', 'ParamRef'] = None, fxLabelAnchor: Union[, 'bool', 'ParamRef'] = None, fxLabelOffset: Union[, 'bool', 'ParamRef'] = None, fxLine: Union[, 'bool', 'ParamRef'] = None, fxPadding: Union[, 'bool', 'ParamRef'] = None, fxPaddingInner: Union[, 'bool', 'ParamRef'] = None, fxPaddingOuter: Union[, 'bool', 'ParamRef'] = None, fxRange: Union[, 'bool', 'ParamRef'] = None, fxReverse: Union[, 'bool', 'ParamRef'] = None, fxRound: Union[, 'bool', 'ParamRef'] = None, fxTickFormat: Union[, 'bool', 'ParamRef'] = None, fxTickPadding: Union[, 'bool', 'ParamRef'] = None, fxTickRotate: Union[, 'bool', 'ParamRef'] = None, fxTickSize: Union[, 'bool', 'ParamRef'] = None, fxTickSpacing: Union[, 'bool', 'ParamRef'] = None, fxTicks: Union[, 'bool', 'ParamRef'] = None, fyAlign: Union[, 'bool', 'ParamRef'] = None, fyAriaDescription: Union[, 'bool', 'ParamRef'] = None, fyAriaLabel: Union[, 'bool', 'ParamRef'] = None, fyAxis: Union[, 'bool', 'ParamRef'] = None, fyDomain: Union[, 'bool', 'ParamRef'] = None, fyFontVariant: Union[, 'bool', 'ParamRef'] = None, fyGrid: Union[, 'bool', 'ParamRef'] = None, fyInset: Union[, 'bool', 'ParamRef'] = None, fyInsetBottom: Union[, 'bool', 'ParamRef'] = None, fyInsetTop: Union[, 'bool', 'ParamRef'] = None, fyLabel: Union[, 'bool', 'ParamRef'] = None, fyLabelAnchor: Union[, 'bool', 'ParamRef'] = None, fyLabelOffset: Union[, 'bool', 'ParamRef'] = None, fyLine: Union[, 'bool', 'ParamRef'] = None, fyPadding: Union[, 'bool', 'ParamRef'] = None, fyPaddingInner: Union[, 'bool', 'ParamRef'] = None, fyPaddingOuter: Union[, 'bool', 'ParamRef'] = None, fyRange: Union[, 'bool', 'ParamRef'] = None, fyReverse: Union[, 'bool', 'ParamRef'] = None, fyRound: Union[, 'bool', 'ParamRef'] = None, fyTickFormat: Union[, 'bool', 'ParamRef'] = None, fyTickPadding: Union[, 'bool', 'ParamRef'] = None, fyTickRotate: Union[, 'bool', 'ParamRef'] = None, fyTickSize: Union[, 'bool', 'ParamRef'] = None, fyTickSpacing: Union[, 'bool', 'ParamRef'] = None, fyTicks: Union[, 'bool', 'ParamRef'] = None, grid: Union[, 'bool', 'ParamRef'] = None, height: Union[, 'bool', 'ParamRef'] = None, inset: Union[, 'bool', 'ParamRef'] = None, label: Union[, 'bool', 'ParamRef'] = None, lengthBase: Union[, 'bool', 'ParamRef'] = None, lengthClamp: Union[, 'bool', 'ParamRef'] = None, lengthConstant: Union[, 'bool', 'ParamRef'] = None, lengthDomain: Union[, 'bool', 'ParamRef'] = None, lengthExponent: Union[, 'bool', 'ParamRef'] = None, lengthNice: Union[, 'bool', 'ParamRef'] = None, lengthPercent: Union[, 'bool', 'ParamRef'] = None, lengthRange: Union[, 'bool', 'ParamRef'] = None, lengthScale: Union[, 'bool', 'ParamRef'] = None, lengthZero: Union[, 'bool', 'ParamRef'] = None, margin: Union[, 'bool', 'ParamRef'] = None, marginBottom: Union[, 'bool', 'ParamRef'] = None, marginLeft: Union[, 'bool', 'ParamRef'] = None, marginRight: Union[, 'bool', 'ParamRef'] = None, marginTop: Union[, 'bool', 'ParamRef'] = None, margins: Union[, 'bool', 'ParamRef'] = None, name: Union[, 'bool', 'ParamRef'] = None, opacityBase: Union[, 'bool', 'ParamRef'] = None, opacityClamp: Union[, 'bool', 'ParamRef'] = None, opacityConstant: Union[, 'bool', 'ParamRef'] = None, opacityDomain: Union[, 'bool', 'ParamRef'] = None, opacityExponent: Union[, 'bool', 'ParamRef'] = None, opacityLabel: Union[, 'bool', 'ParamRef'] = None, opacityNice: Union[, 'bool', 'ParamRef'] = None, opacityPercent: Union[, 'bool', 'ParamRef'] = None, opacityRange: Union[, 'bool', 'ParamRef'] = None, opacityReverse: Union[, 'bool', 'ParamRef'] = None, opacityScale: Union[, 'bool', 'ParamRef'] = None, opacityTickFormat: Union[, 'bool', 'ParamRef'] = None, opacityZero: Union[, 'bool', 'ParamRef'] = None, padding: Union[, 'bool', 'ParamRef'] = None, projectionClip: Union[, 'bool', 'ParamRef'] = None, projectionDomain: Union[, 'bool', 'ParamRef'] = None, projectionInset: Union[, 'bool', 'ParamRef'] = None, projectionInsetBottom: Union[, 'bool', 'ParamRef'] = None, projectionInsetLeft: Union[, 'bool', 'ParamRef'] = None, projectionInsetRight: Union[, 'bool', 'ParamRef'] = None, projectionInsetTop: Union[, 'bool', 'ParamRef'] = None, projectionParallels: Union[, 'bool', 'ParamRef'] = None, projectionPrecision: Union[, 'bool', 'ParamRef'] = None, projectionRotate: Union[, 'bool', 'ParamRef'] = None, projectionType: Union[, 'bool', 'ParamRef'] = None, rBase: Union[, 'bool', 'ParamRef'] = None, rClamp: Union[, 'bool', 'ParamRef'] = None, rConstant: Union[, 'bool', 'ParamRef'] = None, rDomain: Union[, 'bool', 'ParamRef'] = None, rExponent: Union[, 'bool', 'ParamRef'] = None, rLabel: Union[, 'bool', 'ParamRef'] = None, rNice: Union[, 'bool', 'ParamRef'] = None, rPercent: Union[, 'bool', 'ParamRef'] = None, rRange: Union[, 'bool', 'ParamRef'] = None, rScale: Union[, 'bool', 'ParamRef'] = None, rZero: Union[, 'bool', 'ParamRef'] = None, style: Union[, 'bool', 'ParamRef'] = None, symbolDomain: Union[, 'bool', 'ParamRef'] = None, symbolRange: Union[, 'bool', 'ParamRef'] = None, symbolScale: Union[, 'bool', 'ParamRef'] = None, width: Union[, 'bool', 'ParamRef'] = None, xAlign: Union[, 'bool', 'ParamRef'] = None, xAriaDescription: Union[, 'bool', 'ParamRef'] = None, xAriaLabel: Union[, 'bool', 'ParamRef'] = None, xAxis: Union[, 'bool', 'ParamRef'] = None, xBase: Union[, 'bool', 'ParamRef'] = None, xClamp: Union[, 'bool', 'ParamRef'] = None, xConstant: Union[, 'bool', 'ParamRef'] = None, xDomain: Union[, 'bool', 'ParamRef'] = None, xExponent: Union[, 'bool', 'ParamRef'] = None, xFontVariant: Union[, 'bool', 'ParamRef'] = None, xGrid: Union[, 'bool', 'ParamRef'] = None, xInset: Union[, 'bool', 'ParamRef'] = None, xInsetLeft: Union[, 'bool', 'ParamRef'] = None, xInsetRight: Union[, 'bool', 'ParamRef'] = None, xLabel: Union[, 'bool', 'ParamRef'] = None, xLabelAnchor: Union[, 'bool', 'ParamRef'] = None, xLabelArrow: Union[, 'bool', 'ParamRef'] = None, xLabelOffset: Union[, 'bool', 'ParamRef'] = None, xLine: Union[, 'bool', 'ParamRef'] = None, xNice: Union[, 'bool', 'ParamRef'] = None, xPadding: Union[, 'bool', 'ParamRef'] = None, xPaddingInner: Union[, 'bool', 'ParamRef'] = None, xPaddingOuter: Union[, 'bool', 'ParamRef'] = None, xPercent: Union[, 'bool', 'ParamRef'] = None, xRange: Union[, 'bool', 'ParamRef'] = None, xReverse: Union[, 'bool', 'ParamRef'] = None, xRound: Union[, 'bool', 'ParamRef'] = None, xScale: Union[, 'bool', 'ParamRef'] = None, xTickFormat: Union[, 'bool', 'ParamRef'] = None, xTickPadding: Union[, 'bool', 'ParamRef'] = None, xTickRotate: Union[, 'bool', 'ParamRef'] = None, xTickSize: Union[, 'bool', 'ParamRef'] = None, xTickSpacing: Union[, 'bool', 'ParamRef'] = None, xTicks: Union[, 'bool', 'ParamRef'] = None, xZero: Union[, 'bool', 'ParamRef'] = None, xyDomain: Union[, 'bool', 'ParamRef'] = None, yAlign: Union[, 'bool', 'ParamRef'] = None, yAriaDescription: Union[, 'bool', 'ParamRef'] = None, yAriaLabel: Union[, 'bool', 'ParamRef'] = None, yAxis: Union[, 'bool', 'ParamRef'] = None, yBase: Union[, 'bool', 'ParamRef'] = None, yClamp: Union[, 'bool', 'ParamRef'] = None, yConstant: Union[, 'bool', 'ParamRef'] = None, yDomain: Union[, 'bool', 'ParamRef'] = None, yExponent: Union[, 'bool', 'ParamRef'] = None, yFontVariant: Union[, 'bool', 'ParamRef'] = None, yGrid: Union[, 'bool', 'ParamRef'] = None, yInset: Union[, 'bool', 'ParamRef'] = None, yInsetBottom: Union[, 'bool', 'ParamRef'] = None, yInsetTop: Union[, 'bool', 'ParamRef'] = None, yLabel: Union[, 'bool', 'ParamRef'] = None, yLabelAnchor: Union[, 'bool', 'ParamRef'] = None, yLabelArrow: Union[, 'bool', 'ParamRef'] = None, yLabelOffset: Union[, 'bool', 'ParamRef'] = None, yLine: Union[, 'bool', 'ParamRef'] = None, yNice: Union[, 'bool', 'ParamRef'] = None, yPadding: Union[, 'bool', 'ParamRef'] = None, yPaddingInner: Union[, 'bool', 'ParamRef'] = None, yPaddingOuter: Union[, 'bool', 'ParamRef'] = None, yPercent: Union[, 'bool', 'ParamRef'] = None, yRange: Union[, 'bool', 'ParamRef'] = None, yReverse: Union[, 'bool', 'ParamRef'] = None, yRound: Union[, 'bool', 'ParamRef'] = None, yScale: Union[, 'bool', 'ParamRef'] = None, yTickFormat: Union[, 'bool', 'ParamRef'] = None, yTickPadding: Union[, 'bool', 'ParamRef'] = None, yTickRotate: Union[, 'bool', 'ParamRef'] = None, yTickSize: Union[, 'bool', 'ParamRef'] = None, yTickSpacing: Union[, 'bool', 'ParamRef'] = None, yTicks: Union[, 'bool', 'ParamRef'] = None, yZero: Union[, 'bool', 'ParamRef'] = None):
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


class PlotAttributes:
    def __init__(self, align: Union[, 'bool', 'ParamRef'] = None, aspectRatio: Union[, 'bool', 'ParamRef'] = None, axis: Union[, 'bool', 'ParamRef'] = None, colorBase: Union[, 'bool', 'ParamRef'] = None, colorClamp: Union[, 'bool', 'ParamRef'] = None, colorConstant: Union[, 'bool', 'ParamRef'] = None, colorDomain: Union[, 'bool', 'ParamRef'] = None, colorExponent: Union[, 'bool', 'ParamRef'] = None, colorInterpolate: Union[, 'bool', 'ParamRef'] = None, colorLabel: Union[, 'bool', 'ParamRef'] = None, colorN: Union[, 'bool', 'ParamRef'] = None, colorNice: Union[, 'bool', 'ParamRef'] = None, colorPercent: Union[, 'bool', 'ParamRef'] = None, colorPivot: Union[, 'bool', 'ParamRef'] = None, colorRange: Union[, 'bool', 'ParamRef'] = None, colorReverse: Union[, 'bool', 'ParamRef'] = None, colorScale: Union[, 'bool', 'ParamRef'] = None, colorScheme: Union[, 'bool', 'ParamRef'] = None, colorSymmetric: Union[, 'bool', 'ParamRef'] = None, colorTickFormat: Union[, 'bool', 'ParamRef'] = None, colorZero: Union[, 'bool', 'ParamRef'] = None, facetGrid: Union[, 'bool', 'ParamRef'] = None, facetLabel: Union[, 'bool', 'ParamRef'] = None, facetMargin: Union[, 'bool', 'ParamRef'] = None, facetMarginBottom: Union[, 'bool', 'ParamRef'] = None, facetMarginLeft: Union[, 'bool', 'ParamRef'] = None, facetMarginRight: Union[, 'bool', 'ParamRef'] = None, facetMarginTop: Union[, 'bool', 'ParamRef'] = None, fxAlign: Union[, 'bool', 'ParamRef'] = None, fxAriaDescription: Union[, 'bool', 'ParamRef'] = None, fxAriaLabel: Union[, 'bool', 'ParamRef'] = None, fxAxis: Union[, 'bool', 'ParamRef'] = None, fxDomain: Union[, 'bool', 'ParamRef'] = None, fxFontVariant: Union[, 'bool', 'ParamRef'] = None, fxGrid: Union[, 'bool', 'ParamRef'] = None, fxInset: Union[, 'bool', 'ParamRef'] = None, fxInsetLeft: Union[, 'bool', 'ParamRef'] = None, fxInsetRight: Union[, 'bool', 'ParamRef'] = None, fxLabel: Union[, 'bool', 'ParamRef'] = None, fxLabelAnchor: Union[, 'bool', 'ParamRef'] = None, fxLabelOffset: Union[, 'bool', 'ParamRef'] = None, fxLine: Union[, 'bool', 'ParamRef'] = None, fxPadding: Union[, 'bool', 'ParamRef'] = None, fxPaddingInner: Union[, 'bool', 'ParamRef'] = None, fxPaddingOuter: Union[, 'bool', 'ParamRef'] = None, fxRange: Union[, 'bool', 'ParamRef'] = None, fxReverse: Union[, 'bool', 'ParamRef'] = None, fxRound: Union[, 'bool', 'ParamRef'] = None, fxTickFormat: Union[, 'bool', 'ParamRef'] = None, fxTickPadding: Union[, 'bool', 'ParamRef'] = None, fxTickRotate: Union[, 'bool', 'ParamRef'] = None, fxTickSize: Union[, 'bool', 'ParamRef'] = None, fxTickSpacing: Union[, 'bool', 'ParamRef'] = None, fxTicks: Union[, 'bool', 'ParamRef'] = None, fyAlign: Union[, 'bool', 'ParamRef'] = None, fyAriaDescription: Union[, 'bool', 'ParamRef'] = None, fyAriaLabel: Union[, 'bool', 'ParamRef'] = None, fyAxis: Union[, 'bool', 'ParamRef'] = None, fyDomain: Union[, 'bool', 'ParamRef'] = None, fyFontVariant: Union[, 'bool', 'ParamRef'] = None, fyGrid: Union[, 'bool', 'ParamRef'] = None, fyInset: Union[, 'bool', 'ParamRef'] = None, fyInsetBottom: Union[, 'bool', 'ParamRef'] = None, fyInsetTop: Union[, 'bool', 'ParamRef'] = None, fyLabel: Union[, 'bool', 'ParamRef'] = None, fyLabelAnchor: Union[, 'bool', 'ParamRef'] = None, fyLabelOffset: Union[, 'bool', 'ParamRef'] = None, fyLine: Union[, 'bool', 'ParamRef'] = None, fyPadding: Union[, 'bool', 'ParamRef'] = None, fyPaddingInner: Union[, 'bool', 'ParamRef'] = None, fyPaddingOuter: Union[, 'bool', 'ParamRef'] = None, fyRange: Union[, 'bool', 'ParamRef'] = None, fyReverse: Union[, 'bool', 'ParamRef'] = None, fyRound: Union[, 'bool', 'ParamRef'] = None, fyTickFormat: Union[, 'bool', 'ParamRef'] = None, fyTickPadding: Union[, 'bool', 'ParamRef'] = None, fyTickRotate: Union[, 'bool', 'ParamRef'] = None, fyTickSize: Union[, 'bool', 'ParamRef'] = None, fyTickSpacing: Union[, 'bool', 'ParamRef'] = None, fyTicks: Union[, 'bool', 'ParamRef'] = None, grid: Union[, 'bool', 'ParamRef'] = None, height: Union[, 'bool', 'ParamRef'] = None, inset: Union[, 'bool', 'ParamRef'] = None, label: Union[, 'bool', 'ParamRef'] = None, lengthBase: Union[, 'bool', 'ParamRef'] = None, lengthClamp: Union[, 'bool', 'ParamRef'] = None, lengthConstant: Union[, 'bool', 'ParamRef'] = None, lengthDomain: Union[, 'bool', 'ParamRef'] = None, lengthExponent: Union[, 'bool', 'ParamRef'] = None, lengthNice: Union[, 'bool', 'ParamRef'] = None, lengthPercent: Union[, 'bool', 'ParamRef'] = None, lengthRange: Union[, 'bool', 'ParamRef'] = None, lengthScale: Union[, 'bool', 'ParamRef'] = None, lengthZero: Union[, 'bool', 'ParamRef'] = None, margin: Union[, 'bool', 'ParamRef'] = None, marginBottom: Union[, 'bool', 'ParamRef'] = None, marginLeft: Union[, 'bool', 'ParamRef'] = None, marginRight: Union[, 'bool', 'ParamRef'] = None, marginTop: Union[, 'bool', 'ParamRef'] = None, margins: Union[, 'bool', 'ParamRef'] = None, name: Union[, 'bool', 'ParamRef'] = None, opacityBase: Union[, 'bool', 'ParamRef'] = None, opacityClamp: Union[, 'bool', 'ParamRef'] = None, opacityConstant: Union[, 'bool', 'ParamRef'] = None, opacityDomain: Union[, 'bool', 'ParamRef'] = None, opacityExponent: Union[, 'bool', 'ParamRef'] = None, opacityLabel: Union[, 'bool', 'ParamRef'] = None, opacityNice: Union[, 'bool', 'ParamRef'] = None, opacityPercent: Union[, 'bool', 'ParamRef'] = None, opacityRange: Union[, 'bool', 'ParamRef'] = None, opacityReverse: Union[, 'bool', 'ParamRef'] = None, opacityScale: Union[, 'bool', 'ParamRef'] = None, opacityTickFormat: Union[, 'bool', 'ParamRef'] = None, opacityZero: Union[, 'bool', 'ParamRef'] = None, padding: Union[, 'bool', 'ParamRef'] = None, projectionClip: Union[, 'bool', 'ParamRef'] = None, projectionDomain: Union[, 'bool', 'ParamRef'] = None, projectionInset: Union[, 'bool', 'ParamRef'] = None, projectionInsetBottom: Union[, 'bool', 'ParamRef'] = None, projectionInsetLeft: Union[, 'bool', 'ParamRef'] = None, projectionInsetRight: Union[, 'bool', 'ParamRef'] = None, projectionInsetTop: Union[, 'bool', 'ParamRef'] = None, projectionParallels: Union[, 'bool', 'ParamRef'] = None, projectionPrecision: Union[, 'bool', 'ParamRef'] = None, projectionRotate: Union[, 'bool', 'ParamRef'] = None, projectionType: Union[, 'bool', 'ParamRef'] = None, rBase: Union[, 'bool', 'ParamRef'] = None, rClamp: Union[, 'bool', 'ParamRef'] = None, rConstant: Union[, 'bool', 'ParamRef'] = None, rDomain: Union[, 'bool', 'ParamRef'] = None, rExponent: Union[, 'bool', 'ParamRef'] = None, rLabel: Union[, 'bool', 'ParamRef'] = None, rNice: Union[, 'bool', 'ParamRef'] = None, rPercent: Union[, 'bool', 'ParamRef'] = None, rRange: Union[, 'bool', 'ParamRef'] = None, rScale: Union[, 'bool', 'ParamRef'] = None, rZero: Union[, 'bool', 'ParamRef'] = None, style: Union[, 'bool', 'ParamRef'] = None, symbolDomain: Union[, 'bool', 'ParamRef'] = None, symbolRange: Union[, 'bool', 'ParamRef'] = None, symbolScale: Union[, 'bool', 'ParamRef'] = None, width: Union[, 'bool', 'ParamRef'] = None, xAlign: Union[, 'bool', 'ParamRef'] = None, xAriaDescription: Union[, 'bool', 'ParamRef'] = None, xAriaLabel: Union[, 'bool', 'ParamRef'] = None, xAxis: Union[, 'bool', 'ParamRef'] = None, xBase: Union[, 'bool', 'ParamRef'] = None, xClamp: Union[, 'bool', 'ParamRef'] = None, xConstant: Union[, 'bool', 'ParamRef'] = None, xDomain: Union[, 'bool', 'ParamRef'] = None, xExponent: Union[, 'bool', 'ParamRef'] = None, xFontVariant: Union[, 'bool', 'ParamRef'] = None, xGrid: Union[, 'bool', 'ParamRef'] = None, xInset: Union[, 'bool', 'ParamRef'] = None, xInsetLeft: Union[, 'bool', 'ParamRef'] = None, xInsetRight: Union[, 'bool', 'ParamRef'] = None, xLabel: Union[, 'bool', 'ParamRef'] = None, xLabelAnchor: Union[, 'bool', 'ParamRef'] = None, xLabelArrow: Union[, 'bool', 'ParamRef'] = None, xLabelOffset: Union[, 'bool', 'ParamRef'] = None, xLine: Union[, 'bool', 'ParamRef'] = None, xNice: Union[, 'bool', 'ParamRef'] = None, xPadding: Union[, 'bool', 'ParamRef'] = None, xPaddingInner: Union[, 'bool', 'ParamRef'] = None, xPaddingOuter: Union[, 'bool', 'ParamRef'] = None, xPercent: Union[, 'bool', 'ParamRef'] = None, xRange: Union[, 'bool', 'ParamRef'] = None, xReverse: Union[, 'bool', 'ParamRef'] = None, xRound: Union[, 'bool', 'ParamRef'] = None, xScale: Union[, 'bool', 'ParamRef'] = None, xTickFormat: Union[, 'bool', 'ParamRef'] = None, xTickPadding: Union[, 'bool', 'ParamRef'] = None, xTickRotate: Union[, 'bool', 'ParamRef'] = None, xTickSize: Union[, 'bool', 'ParamRef'] = None, xTickSpacing: Union[, 'bool', 'ParamRef'] = None, xTicks: Union[, 'bool', 'ParamRef'] = None, xZero: Union[, 'bool', 'ParamRef'] = None, xyDomain: Union[, 'bool', 'ParamRef'] = None, yAlign: Union[, 'bool', 'ParamRef'] = None, yAriaDescription: Union[, 'bool', 'ParamRef'] = None, yAriaLabel: Union[, 'bool', 'ParamRef'] = None, yAxis: Union[, 'bool', 'ParamRef'] = None, yBase: Union[, 'bool', 'ParamRef'] = None, yClamp: Union[, 'bool', 'ParamRef'] = None, yConstant: Union[, 'bool', 'ParamRef'] = None, yDomain: Union[, 'bool', 'ParamRef'] = None, yExponent: Union[, 'bool', 'ParamRef'] = None, yFontVariant: Union[, 'bool', 'ParamRef'] = None, yGrid: Union[, 'bool', 'ParamRef'] = None, yInset: Union[, 'bool', 'ParamRef'] = None, yInsetBottom: Union[, 'bool', 'ParamRef'] = None, yInsetTop: Union[, 'bool', 'ParamRef'] = None, yLabel: Union[, 'bool', 'ParamRef'] = None, yLabelAnchor: Union[, 'bool', 'ParamRef'] = None, yLabelArrow: Union[, 'bool', 'ParamRef'] = None, yLabelOffset: Union[, 'bool', 'ParamRef'] = None, yLine: Union[, 'bool', 'ParamRef'] = None, yNice: Union[, 'bool', 'ParamRef'] = None, yPadding: Union[, 'bool', 'ParamRef'] = None, yPaddingInner: Union[, 'bool', 'ParamRef'] = None, yPaddingOuter: Union[, 'bool', 'ParamRef'] = None, yPercent: Union[, 'bool', 'ParamRef'] = None, yRange: Union[, 'bool', 'ParamRef'] = None, yReverse: Union[, 'bool', 'ParamRef'] = None, yRound: Union[, 'bool', 'ParamRef'] = None, yScale: Union[, 'bool', 'ParamRef'] = None, yTickFormat: Union[, 'bool', 'ParamRef'] = None, yTickPadding: Union[, 'bool', 'ParamRef'] = None, yTickRotate: Union[, 'bool', 'ParamRef'] = None, yTickSize: Union[, 'bool', 'ParamRef'] = None, yTickSpacing: Union[, 'bool', 'ParamRef'] = None, yTicks: Union[, 'bool', 'ParamRef'] = None, yZero: Union[, 'bool', 'ParamRef'] = None):
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


class PlotDataInline:
    def __init__(self):
        pass


class PlotInteractor:
    def __init__(self, value: Union["Highlight", "IntervalX", "IntervalY", "IntervalXY", "NearestX", "NearestY", "Toggle", "ToggleX", "ToggleY", "ToggleColor", "Pan", "PanX", "PanY", "PanZoom", "PanZoomX", "PanZoomY"]):
        self.value = value


class PlotMark:
    def __init__(self, value: Union["Area", "AreaX", "AreaY", "Arrow", "AxisX", "AxisY", "AxisFx", "AxisFy", "GridX", "GridY", "GridFx", "GridFy", "BarX", "BarY", "Cell", "CellX", "CellY", "Contour", "DelaunayLink", "DelaunayMesh", "Hull", "Voronoi", "VoronoiMesh", "DenseLine", "Density", "DensityX", "DensityY", "Dot", "DotX", "DotY", "Circle", "Hexagon", "ErrorBarX", "ErrorBarY", "Frame", "Geo", "Graticule", "Sphere", "Hexbin", "Hexgrid", "Image", "Line", "LineX", "LineY", "Link", "Raster", "Heatmap", "RasterTile", "Rect", "RectX", "RectY", "RegressionY", "RuleX", "RuleY", "Text", "TextX", "TextY", "TickX", "TickY", "Vector", "VectorX", "VectorY", "Spike"]):
        self.value = value


class PositionScaleType:
    def __init__(self):
        pass


class Product:
    def __init__(self, product: Union[, 'Any', 'Any'], distinct: Union[, 'Any', 'ParamRef'] = None, orderby: Union[, 'Any', 'ParamRef'] = None, partitionby: Union[, 'Any', 'ParamRef'] = None, range: Union[, 'Any', 'ParamRef'] = None, rows: Union[, 'Any', 'ParamRef'] = None):
        self.distinct = distinct
        self.orderby = orderby
        self.partitionby = partitionby
        self.product = product
        self.range = range
        self.rows = rows


class ProjectionName:
    def __init__(self):
        pass


class Quantile:
    def __init__(self, quantile: Any, distinct: Union[, 'Any', 'ParamRef'] = None, orderby: Union[, 'Any', 'ParamRef'] = None, partitionby: Union[, 'Any', 'ParamRef'] = None, range: Union[, 'Any', 'ParamRef'] = None, rows: Union[, 'Any', 'ParamRef'] = None):
        self.distinct = distinct
        self.orderby = orderby
        self.partitionby = partitionby
        self.quantile = quantile
        self.range = range
        self.rows = rows


class Rank:
    def __init__(self, rank: Union[, 'Any', 'Any'], orderby: Union[, 'Any', 'ParamRef'] = None, partitionby: Union[, 'Any', 'ParamRef'] = None, range: Union[, 'Any', 'ParamRef'] = None, rows: Union[, 'Any', 'ParamRef'] = None):
        self.orderby = orderby
        self.partitionby = partitionby
        self.range = range
        self.rank = rank
        self.rows = rows


class Reducer:
    def __init__(self, value: Union["str", "str", "str", "str", "str", "str", "str", "str", "str", "str", "str", "str", "str", "str", "str", "str", "str", "ReducerPercentile"]):
        self.value = value


class ReducerPercentile:
    def __init__(self):
        pass


class RowNumber:
    def __init__(self, row_number: Union[, 'Any', 'Any'], orderby: Union[, 'Any', 'ParamRef'] = None, partitionby: Union[, 'Any', 'ParamRef'] = None, range: Union[, 'Any', 'ParamRef'] = None, rows: Union[, 'Any', 'ParamRef'] = None):
        self.orderby = orderby
        self.partitionby = partitionby
        self.range = range
        self.row_number = row_number
        self.rows = rows


class SQLExpression:
    def __init__(self, sql: str, label: str = None):
        self.label = label
        self.sql = sql


class ScaleName:
    def __init__(self):
        pass


class Selection:
    def __init__(self, select: str, cross: str = None, empty: str = None):
        self.cross = cross
        self.empty = empty
        self.select = select


class SortOrder:
    def __init__(self, value: Union["ChannelValue", "Dict[str, Any]", "Dict[str, Any]"]):
        self.value = value


class Spec:
    def __init__(self, value: Union["Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]", "Dict[str, Any]"]):
        self.value = value


class StackOffsetName:
    def __init__(self):
        pass


class StackOrder:
    def __init__(self, value: Union["StackOrderName", "str", "str", "str", "str", "str", "str", "str", "str", "Any"]):
        self.value = value


class StackOrderName:
    def __init__(self):
        pass


class Stddev:
    def __init__(self, stddev: Union[, 'Any', 'Any'], distinct: Union[, 'Any', 'Any'] = None, orderby: Union[, 'Any', 'Any'] = None, partitionby: Union[, 'Any', 'Any'] = None, range: Union[, 'Any', 'Any'] = None, rows: Union[, 'Any', 'Any'] = None):
        self.distinct = distinct
        self.orderby = orderby
        self.partitionby = partitionby
        self.range = range
        self.rows = rows
        self.stddev = stddev


class StddevPop:
    def __init__(self, stddevPop: Union[, 'Any', 'Any'], distinct: Union[, 'Any', 'Any'] = None, orderby: Union[, 'Any', 'Any'] = None, partitionby: Union[, 'Any', 'Any'] = None, range: Union[, 'Any', 'Any'] = None, rows: Union[, 'Any', 'Any'] = None):
        self.distinct = distinct
        self.orderby = orderby
        self.partitionby = partitionby
        self.range = range
        self.rows = rows
        self.stddevPop = stddevPop


class Sum:
    def __init__(self, sum: Union[, 'Any', 'Any'], distinct: Union[, 'Any', 'Any'] = None, orderby: Union[, 'Any', 'Any'] = None, partitionby: Union[, 'Any', 'Any'] = None, range: Union[, 'Any', 'Any'] = None, rows: Union[, 'Any', 'Any'] = None):
        self.distinct = distinct
        self.orderby = orderby
        self.partitionby = partitionby
        self.range = range
        self.rows = rows
        self.sum = sum


class SymbolType:
    def __init__(self):
        pass


class TimeIntervalName:
    def __init__(self):
        pass


class TipPointer:
    def __init__(self):
        pass


class Transform:
    def __init__(self, value: Union["ColumnTransform", "AggregateTransform", "WindowTransform"]):
        self.value = value


class TransformField:
    def __init__(self, value: Union["str", "ParamRef"]):
        self.value = value


class VSpace:
    def __init__(self, vspace: Any):
        self.vspace = vspace


class VarPop:
    def __init__(self, varPop: Union[, 'Any', 'Any'], distinct: Union[, 'Any', 'Any'] = None, orderby: Union[, 'Any', 'Any'] = None, partitionby: Union[, 'Any', 'Any'] = None, range: Union[, 'Any', 'Any'] = None, rows: Union[, 'Any', 'Any'] = None):
        self.distinct = distinct
        self.orderby = orderby
        self.partitionby = partitionby
        self.range = range
        self.rows = rows
        self.varPop = varPop


class Variance:
    def __init__(self, variance: Union[, 'Any', 'Any'], distinct: Union[, 'Any', 'Any'] = None, orderby: Union[, 'Any', 'Any'] = None, partitionby: Union[, 'Any', 'Any'] = None, range: Union[, 'Any', 'Any'] = None, rows: Union[, 'Any', 'Any'] = None):
        self.distinct = distinct
        self.orderby = orderby
        self.partitionby = partitionby
        self.range = range
        self.rows = rows
        self.variance = variance


class VectorShapeName:
    def __init__(self):
        pass


class WindowTransform:
    def __init__(self, value: Union["RowNumber", "Rank", "DenseRank", "PercentRank", "CumeDist", "NTile", "Lag", "Lead", "FirstValue", "LastValue", "NthValue"]):
        self.value = value


class Area:
    def __init__(self, data: PlotMarkData, mark: str, ariaDescription: ChannelValue = None, ariaHidden: ChannelValue = None, ariaLabel: ChannelValue = None, clip: ChannelValue = None, curve: ChannelValue = None, dx: ChannelValue = None, dy: ChannelValue = None, facet: ChannelValue = None, facetAnchor: ChannelValue = None, fill: ChannelValue = None, fillOpacity: ChannelValue = None, filter: ChannelValue = None, fx: ChannelValue = None, fy: ChannelValue = None, href: ChannelValue = None, imageFilter: ChannelValue = None, margin: ChannelValue = None, marginBottom: ChannelValue = None, marginLeft: ChannelValue = None, marginRight: ChannelValue = None, marginTop: ChannelValue = None, mixBlendMode: ChannelValue = None, offset: ChannelValue = None, opacity: ChannelValue = None, order: ChannelValue = None, paintOrder: ChannelValue = None, pointerEvents: ChannelValue = None, reverse: ChannelValue = None, select: ChannelValue = None, shapeRendering: ChannelValue = None, sort: ChannelValue = None, stroke: ChannelValue = None, strokeDasharray: ChannelValue = None, strokeDashoffset: ChannelValue = None, strokeLinecap: ChannelValue = None, strokeLinejoin: ChannelValue = None, strokeMiterlimit: ChannelValue = None, strokeOpacity: ChannelValue = None, strokeWidth: ChannelValue = None, target: ChannelValue = None, tension: ChannelValue = None, tip: ChannelValue = None, title: ChannelValue = None, x1: ChannelValue = None, x2: ChannelValue = None, y1: ChannelValue = None, y2: ChannelValue = None, z: ChannelValue = None):
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


class AreaX:
    def __init__(self, data: PlotMarkData, mark: str, ariaDescription: ChannelValue = None, ariaHidden: ChannelValue = None, ariaLabel: ChannelValue = None, clip: ChannelValue = None, curve: ChannelValue = None, dx: ChannelValue = None, dy: ChannelValue = None, facet: ChannelValue = None, facetAnchor: ChannelValue = None, fill: ChannelValue = None, fillOpacity: ChannelValue = None, filter: ChannelValue = None, fx: ChannelValue = None, fy: ChannelValue = None, href: ChannelValue = None, imageFilter: ChannelValue = None, margin: ChannelValue = None, marginBottom: ChannelValue = None, marginLeft: ChannelValue = None, marginRight: ChannelValue = None, marginTop: ChannelValue = None, mixBlendMode: ChannelValue = None, offset: ChannelValue = None, opacity: ChannelValue = None, order: ChannelValue = None, paintOrder: ChannelValue = None, pointerEvents: ChannelValue = None, reverse: ChannelValue = None, select: ChannelValue = None, shapeRendering: ChannelValue = None, sort: ChannelValue = None, stroke: ChannelValue = None, strokeDasharray: ChannelValue = None, strokeDashoffset: ChannelValue = None, strokeLinecap: ChannelValue = None, strokeLinejoin: ChannelValue = None, strokeMiterlimit: ChannelValue = None, strokeOpacity: ChannelValue = None, strokeWidth: ChannelValue = None, target: ChannelValue = None, tension: ChannelValue = None, tip: ChannelValue = None, title: ChannelValue = None, x: ChannelValue = None, x1: ChannelValue = None, x2: ChannelValue = None, y: ChannelValue = None, z: ChannelValue = None):
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


class AreaY:
    def __init__(self, data: PlotMarkData, mark: str, ariaDescription: ChannelValue = None, ariaHidden: ChannelValue = None, ariaLabel: ChannelValue = None, clip: ChannelValue = None, curve: ChannelValue = None, dx: ChannelValue = None, dy: ChannelValue = None, facet: ChannelValue = None, facetAnchor: ChannelValue = None, fill: ChannelValue = None, fillOpacity: ChannelValue = None, filter: ChannelValue = None, fx: ChannelValue = None, fy: ChannelValue = None, href: ChannelValue = None, imageFilter: ChannelValue = None, margin: ChannelValue = None, marginBottom: ChannelValue = None, marginLeft: ChannelValue = None, marginRight: ChannelValue = None, marginTop: ChannelValue = None, mixBlendMode: ChannelValue = None, offset: ChannelValue = None, opacity: ChannelValue = None, order: ChannelValue = None, paintOrder: ChannelValue = None, pointerEvents: ChannelValue = None, reverse: ChannelValue = None, select: ChannelValue = None, shapeRendering: ChannelValue = None, sort: ChannelValue = None, stroke: ChannelValue = None, strokeDasharray: ChannelValue = None, strokeDashoffset: ChannelValue = None, strokeLinecap: ChannelValue = None, strokeLinejoin: ChannelValue = None, strokeMiterlimit: ChannelValue = None, strokeOpacity: ChannelValue = None, strokeWidth: ChannelValue = None, target: ChannelValue = None, tension: ChannelValue = None, tip: ChannelValue = None, title: ChannelValue = None, x: ChannelValue = None, y: ChannelValue = None, y1: ChannelValue = None, y2: ChannelValue = None, z: ChannelValue = None):
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


class Arrow:
    def __init__(self, data: PlotMarkData, mark: str, ariaDescription: ChannelValueSpec = None, ariaHidden: ChannelValueSpec = None, ariaLabel: ChannelValueSpec = None, bend: ChannelValueSpec = None, clip: ChannelValueSpec = None, dx: ChannelValueSpec = None, dy: ChannelValueSpec = None, facet: ChannelValueSpec = None, facetAnchor: ChannelValueSpec = None, fill: ChannelValueSpec = None, fillOpacity: ChannelValueSpec = None, filter: ChannelValueSpec = None, fx: ChannelValueSpec = None, fy: ChannelValueSpec = None, headAngle: ChannelValueSpec = None, headLength: ChannelValueSpec = None, href: ChannelValueSpec = None, imageFilter: ChannelValueSpec = None, inset: ChannelValueSpec = None, insetEnd: ChannelValueSpec = None, insetStart: ChannelValueSpec = None, margin: ChannelValueSpec = None, marginBottom: ChannelValueSpec = None, marginLeft: ChannelValueSpec = None, marginRight: ChannelValueSpec = None, marginTop: ChannelValueSpec = None, mixBlendMode: ChannelValueSpec = None, opacity: ChannelValueSpec = None, paintOrder: ChannelValueSpec = None, pointerEvents: ChannelValueSpec = None, reverse: ChannelValueSpec = None, select: ChannelValueSpec = None, shapeRendering: ChannelValueSpec = None, sort: ChannelValueSpec = None, stroke: ChannelValueSpec = None, strokeDasharray: ChannelValueSpec = None, strokeDashoffset: ChannelValueSpec = None, strokeLinecap: ChannelValueSpec = None, strokeLinejoin: ChannelValueSpec = None, strokeMiterlimit: ChannelValueSpec = None, strokeOpacity: ChannelValueSpec = None, strokeWidth: ChannelValueSpec = None, sweep: ChannelValueSpec = None, target: ChannelValueSpec = None, tip: ChannelValueSpec = None, title: ChannelValueSpec = None, x: ChannelValueSpec = None, x1: ChannelValueSpec = None, x2: ChannelValueSpec = None, y: ChannelValueSpec = None, y1: ChannelValueSpec = None, y2: ChannelValueSpec = None):
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


class AxisFx:
    def __init__(self, mark: str, anchor: ChannelValue = None, ariaDescription: ChannelValue = None, ariaHidden: ChannelValue = None, ariaLabel: ChannelValue = None, clip: ChannelValue = None, color: ChannelValue = None, dx: ChannelValue = None, dy: ChannelValue = None, facet: ChannelValue = None, facetAnchor: ChannelValue = None, fill: ChannelValue = None, fillOpacity: ChannelValue = None, filter: ChannelValue = None, fontFamily: ChannelValue = None, fontSize: ChannelValue = None, fontStyle: ChannelValue = None, fontVariant: ChannelValue = None, fontWeight: ChannelValue = None, frameAnchor: ChannelValue = None, fx: ChannelValue = None, fy: ChannelValue = None, href: ChannelValue = None, imageFilter: ChannelValue = None, inset: ChannelValue = None, insetBottom: ChannelValue = None, insetTop: ChannelValue = None, interval: ChannelValue = None, label: ChannelValue = None, labelAnchor: ChannelValue = None, labelArrow: ChannelValue = None, labelOffset: ChannelValue = None, lineAnchor: ChannelValue = None, lineHeight: ChannelValue = None, lineWidth: ChannelValue = None, margin: ChannelValue = None, marginBottom: ChannelValue = None, marginLeft: ChannelValue = None, marginRight: ChannelValue = None, marginTop: ChannelValue = None, marker: ChannelValue = None, markerEnd: ChannelValue = None, markerMid: ChannelValue = None, markerStart: ChannelValue = None, mixBlendMode: ChannelValue = None, monospace: ChannelValue = None, opacity: ChannelValue = None, paintOrder: ChannelValue = None, pointerEvents: ChannelValue = None, reverse: ChannelValue = None, rotate: ChannelValue = None, select: ChannelValue = None, shapeRendering: ChannelValue = None, sort: ChannelValue = None, stroke: ChannelValue = None, strokeDasharray: ChannelValue = None, strokeDashoffset: ChannelValue = None, strokeLinecap: ChannelValue = None, strokeLinejoin: ChannelValue = None, strokeMiterlimit: ChannelValue = None, strokeOpacity: ChannelValue = None, strokeWidth: ChannelValue = None, target: ChannelValue = None, text: ChannelValue = None, textAnchor: ChannelValue = None, textOverflow: ChannelValue = None, textStroke: ChannelValue = None, textStrokeOpacity: ChannelValue = None, textStrokeWidth: ChannelValue = None, tickFormat: ChannelValue = None, tickPadding: ChannelValue = None, tickRotate: ChannelValue = None, tickSize: ChannelValue = None, tickSpacing: ChannelValue = None, ticks: ChannelValue = None, tip: ChannelValue = None, title: ChannelValue = None, x: ChannelValue = None, y: ChannelValue = None, z: ChannelValue = None):
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


class AxisFy:
    def __init__(self, mark: str, anchor: ChannelValue = None, ariaDescription: ChannelValue = None, ariaHidden: ChannelValue = None, ariaLabel: ChannelValue = None, clip: ChannelValue = None, color: ChannelValue = None, dx: ChannelValue = None, dy: ChannelValue = None, facet: ChannelValue = None, facetAnchor: ChannelValue = None, fill: ChannelValue = None, fillOpacity: ChannelValue = None, filter: ChannelValue = None, fontFamily: ChannelValue = None, fontSize: ChannelValue = None, fontStyle: ChannelValue = None, fontVariant: ChannelValue = None, fontWeight: ChannelValue = None, frameAnchor: ChannelValue = None, fx: ChannelValue = None, fy: ChannelValue = None, href: ChannelValue = None, imageFilter: ChannelValue = None, inset: ChannelValue = None, insetLeft: ChannelValue = None, insetRight: ChannelValue = None, interval: ChannelValue = None, label: ChannelValue = None, labelAnchor: ChannelValue = None, labelArrow: ChannelValue = None, labelOffset: ChannelValue = None, lineAnchor: ChannelValue = None, lineHeight: ChannelValue = None, lineWidth: ChannelValue = None, margin: ChannelValue = None, marginBottom: ChannelValue = None, marginLeft: ChannelValue = None, marginRight: ChannelValue = None, marginTop: ChannelValue = None, marker: ChannelValue = None, markerEnd: ChannelValue = None, markerMid: ChannelValue = None, markerStart: ChannelValue = None, mixBlendMode: ChannelValue = None, monospace: ChannelValue = None, opacity: ChannelValue = None, paintOrder: ChannelValue = None, pointerEvents: ChannelValue = None, reverse: ChannelValue = None, rotate: ChannelValue = None, select: ChannelValue = None, shapeRendering: ChannelValue = None, sort: ChannelValue = None, stroke: ChannelValue = None, strokeDasharray: ChannelValue = None, strokeDashoffset: ChannelValue = None, strokeLinecap: ChannelValue = None, strokeLinejoin: ChannelValue = None, strokeMiterlimit: ChannelValue = None, strokeOpacity: ChannelValue = None, strokeWidth: ChannelValue = None, target: ChannelValue = None, text: ChannelValue = None, textAnchor: ChannelValue = None, textOverflow: ChannelValue = None, textStroke: ChannelValue = None, textStrokeOpacity: ChannelValue = None, textStrokeWidth: ChannelValue = None, tickFormat: ChannelValue = None, tickPadding: ChannelValue = None, tickRotate: ChannelValue = None, tickSize: ChannelValue = None, tickSpacing: ChannelValue = None, ticks: ChannelValue = None, tip: ChannelValue = None, title: ChannelValue = None, x: ChannelValue = None, y: ChannelValue = None, z: ChannelValue = None):
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


class AxisX:
    def __init__(self, mark: str, anchor: ChannelValue = None, ariaDescription: ChannelValue = None, ariaHidden: ChannelValue = None, ariaLabel: ChannelValue = None, clip: ChannelValue = None, color: ChannelValue = None, dx: ChannelValue = None, dy: ChannelValue = None, facet: ChannelValue = None, facetAnchor: ChannelValue = None, fill: ChannelValue = None, fillOpacity: ChannelValue = None, filter: ChannelValue = None, fontFamily: ChannelValue = None, fontSize: ChannelValue = None, fontStyle: ChannelValue = None, fontVariant: ChannelValue = None, fontWeight: ChannelValue = None, frameAnchor: ChannelValue = None, fx: ChannelValue = None, fy: ChannelValue = None, href: ChannelValue = None, imageFilter: ChannelValue = None, inset: ChannelValue = None, insetBottom: ChannelValue = None, insetTop: ChannelValue = None, interval: ChannelValue = None, label: ChannelValue = None, labelAnchor: ChannelValue = None, labelArrow: ChannelValue = None, labelOffset: ChannelValue = None, lineAnchor: ChannelValue = None, lineHeight: ChannelValue = None, lineWidth: ChannelValue = None, margin: ChannelValue = None, marginBottom: ChannelValue = None, marginLeft: ChannelValue = None, marginRight: ChannelValue = None, marginTop: ChannelValue = None, marker: ChannelValue = None, markerEnd: ChannelValue = None, markerMid: ChannelValue = None, markerStart: ChannelValue = None, mixBlendMode: ChannelValue = None, monospace: ChannelValue = None, opacity: ChannelValue = None, paintOrder: ChannelValue = None, pointerEvents: ChannelValue = None, reverse: ChannelValue = None, rotate: ChannelValue = None, select: ChannelValue = None, shapeRendering: ChannelValue = None, sort: ChannelValue = None, stroke: ChannelValue = None, strokeDasharray: ChannelValue = None, strokeDashoffset: ChannelValue = None, strokeLinecap: ChannelValue = None, strokeLinejoin: ChannelValue = None, strokeMiterlimit: ChannelValue = None, strokeOpacity: ChannelValue = None, strokeWidth: ChannelValue = None, target: ChannelValue = None, text: ChannelValue = None, textAnchor: ChannelValue = None, textOverflow: ChannelValue = None, textStroke: ChannelValue = None, textStrokeOpacity: ChannelValue = None, textStrokeWidth: ChannelValue = None, tickFormat: ChannelValue = None, tickPadding: ChannelValue = None, tickRotate: ChannelValue = None, tickSize: ChannelValue = None, tickSpacing: ChannelValue = None, ticks: ChannelValue = None, tip: ChannelValue = None, title: ChannelValue = None, x: ChannelValue = None, y: ChannelValue = None, z: ChannelValue = None):
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


class AxisY:
    def __init__(self, mark: str, anchor: ChannelValue = None, ariaDescription: ChannelValue = None, ariaHidden: ChannelValue = None, ariaLabel: ChannelValue = None, clip: ChannelValue = None, color: ChannelValue = None, dx: ChannelValue = None, dy: ChannelValue = None, facet: ChannelValue = None, facetAnchor: ChannelValue = None, fill: ChannelValue = None, fillOpacity: ChannelValue = None, filter: ChannelValue = None, fontFamily: ChannelValue = None, fontSize: ChannelValue = None, fontStyle: ChannelValue = None, fontVariant: ChannelValue = None, fontWeight: ChannelValue = None, frameAnchor: ChannelValue = None, fx: ChannelValue = None, fy: ChannelValue = None, href: ChannelValue = None, imageFilter: ChannelValue = None, inset: ChannelValue = None, insetLeft: ChannelValue = None, insetRight: ChannelValue = None, interval: ChannelValue = None, label: ChannelValue = None, labelAnchor: ChannelValue = None, labelArrow: ChannelValue = None, labelOffset: ChannelValue = None, lineAnchor: ChannelValue = None, lineHeight: ChannelValue = None, lineWidth: ChannelValue = None, margin: ChannelValue = None, marginBottom: ChannelValue = None, marginLeft: ChannelValue = None, marginRight: ChannelValue = None, marginTop: ChannelValue = None, marker: ChannelValue = None, markerEnd: ChannelValue = None, markerMid: ChannelValue = None, markerStart: ChannelValue = None, mixBlendMode: ChannelValue = None, monospace: ChannelValue = None, opacity: ChannelValue = None, paintOrder: ChannelValue = None, pointerEvents: ChannelValue = None, reverse: ChannelValue = None, rotate: ChannelValue = None, select: ChannelValue = None, shapeRendering: ChannelValue = None, sort: ChannelValue = None, stroke: ChannelValue = None, strokeDasharray: ChannelValue = None, strokeDashoffset: ChannelValue = None, strokeLinecap: ChannelValue = None, strokeLinejoin: ChannelValue = None, strokeMiterlimit: ChannelValue = None, strokeOpacity: ChannelValue = None, strokeWidth: ChannelValue = None, target: ChannelValue = None, text: ChannelValue = None, textAnchor: ChannelValue = None, textOverflow: ChannelValue = None, textStroke: ChannelValue = None, textStrokeOpacity: ChannelValue = None, textStrokeWidth: ChannelValue = None, tickFormat: ChannelValue = None, tickPadding: ChannelValue = None, tickRotate: ChannelValue = None, tickSize: ChannelValue = None, tickSpacing: ChannelValue = None, ticks: ChannelValue = None, tip: ChannelValue = None, title: ChannelValue = None, x: ChannelValue = None, y: ChannelValue = None, z: ChannelValue = None):
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


class Cell:
    def __init__(self, data: PlotMarkData, mark: str, ariaDescription: ChannelValueSpec = None, ariaHidden: ChannelValueSpec = None, ariaLabel: ChannelValueSpec = None, clip: ChannelValueSpec = None, dx: ChannelValueSpec = None, dy: ChannelValueSpec = None, facet: ChannelValueSpec = None, facetAnchor: ChannelValueSpec = None, fill: ChannelValueSpec = None, fillOpacity: ChannelValueSpec = None, filter: ChannelValueSpec = None, fx: ChannelValueSpec = None, fy: ChannelValueSpec = None, href: ChannelValueSpec = None, imageFilter: ChannelValueSpec = None, inset: ChannelValueSpec = None, insetBottom: ChannelValueSpec = None, insetLeft: ChannelValueSpec = None, insetRight: ChannelValueSpec = None, insetTop: ChannelValueSpec = None, margin: ChannelValueSpec = None, marginBottom: ChannelValueSpec = None, marginLeft: ChannelValueSpec = None, marginRight: ChannelValueSpec = None, marginTop: ChannelValueSpec = None, mixBlendMode: ChannelValueSpec = None, opacity: ChannelValueSpec = None, paintOrder: ChannelValueSpec = None, pointerEvents: ChannelValueSpec = None, reverse: ChannelValueSpec = None, rx: ChannelValueSpec = None, ry: ChannelValueSpec = None, select: ChannelValueSpec = None, shapeRendering: ChannelValueSpec = None, sort: ChannelValueSpec = None, stroke: ChannelValueSpec = None, strokeDasharray: ChannelValueSpec = None, strokeDashoffset: ChannelValueSpec = None, strokeLinecap: ChannelValueSpec = None, strokeLinejoin: ChannelValueSpec = None, strokeMiterlimit: ChannelValueSpec = None, strokeOpacity: ChannelValueSpec = None, strokeWidth: ChannelValueSpec = None, target: ChannelValueSpec = None, tip: ChannelValueSpec = None, title: ChannelValueSpec = None, x: ChannelValueSpec = None, y: ChannelValueSpec = None):
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


class CellX:
    def __init__(self, data: PlotMarkData, mark: str, ariaDescription: ChannelValueSpec = None, ariaHidden: ChannelValueSpec = None, ariaLabel: ChannelValueSpec = None, clip: ChannelValueSpec = None, dx: ChannelValueSpec = None, dy: ChannelValueSpec = None, facet: ChannelValueSpec = None, facetAnchor: ChannelValueSpec = None, fill: ChannelValueSpec = None, fillOpacity: ChannelValueSpec = None, filter: ChannelValueSpec = None, fx: ChannelValueSpec = None, fy: ChannelValueSpec = None, href: ChannelValueSpec = None, imageFilter: ChannelValueSpec = None, inset: ChannelValueSpec = None, insetBottom: ChannelValueSpec = None, insetLeft: ChannelValueSpec = None, insetRight: ChannelValueSpec = None, insetTop: ChannelValueSpec = None, margin: ChannelValueSpec = None, marginBottom: ChannelValueSpec = None, marginLeft: ChannelValueSpec = None, marginRight: ChannelValueSpec = None, marginTop: ChannelValueSpec = None, mixBlendMode: ChannelValueSpec = None, opacity: ChannelValueSpec = None, paintOrder: ChannelValueSpec = None, pointerEvents: ChannelValueSpec = None, reverse: ChannelValueSpec = None, rx: ChannelValueSpec = None, ry: ChannelValueSpec = None, select: ChannelValueSpec = None, shapeRendering: ChannelValueSpec = None, sort: ChannelValueSpec = None, stroke: ChannelValueSpec = None, strokeDasharray: ChannelValueSpec = None, strokeDashoffset: ChannelValueSpec = None, strokeLinecap: ChannelValueSpec = None, strokeLinejoin: ChannelValueSpec = None, strokeMiterlimit: ChannelValueSpec = None, strokeOpacity: ChannelValueSpec = None, strokeWidth: ChannelValueSpec = None, target: ChannelValueSpec = None, tip: ChannelValueSpec = None, title: ChannelValueSpec = None, x: ChannelValueSpec = None, y: ChannelValueSpec = None):
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


class CellY:
    def __init__(self, data: PlotMarkData, mark: str, ariaDescription: ChannelValueSpec = None, ariaHidden: ChannelValueSpec = None, ariaLabel: ChannelValueSpec = None, clip: ChannelValueSpec = None, dx: ChannelValueSpec = None, dy: ChannelValueSpec = None, facet: ChannelValueSpec = None, facetAnchor: ChannelValueSpec = None, fill: ChannelValueSpec = None, fillOpacity: ChannelValueSpec = None, filter: ChannelValueSpec = None, fx: ChannelValueSpec = None, fy: ChannelValueSpec = None, href: ChannelValueSpec = None, imageFilter: ChannelValueSpec = None, inset: ChannelValueSpec = None, insetBottom: ChannelValueSpec = None, insetLeft: ChannelValueSpec = None, insetRight: ChannelValueSpec = None, insetTop: ChannelValueSpec = None, margin: ChannelValueSpec = None, marginBottom: ChannelValueSpec = None, marginLeft: ChannelValueSpec = None, marginRight: ChannelValueSpec = None, marginTop: ChannelValueSpec = None, mixBlendMode: ChannelValueSpec = None, opacity: ChannelValueSpec = None, paintOrder: ChannelValueSpec = None, pointerEvents: ChannelValueSpec = None, reverse: ChannelValueSpec = None, rx: ChannelValueSpec = None, ry: ChannelValueSpec = None, select: ChannelValueSpec = None, shapeRendering: ChannelValueSpec = None, sort: ChannelValueSpec = None, stroke: ChannelValueSpec = None, strokeDasharray: ChannelValueSpec = None, strokeDashoffset: ChannelValueSpec = None, strokeLinecap: ChannelValueSpec = None, strokeLinejoin: ChannelValueSpec = None, strokeMiterlimit: ChannelValueSpec = None, strokeOpacity: ChannelValueSpec = None, strokeWidth: ChannelValueSpec = None, target: ChannelValueSpec = None, tip: ChannelValueSpec = None, title: ChannelValueSpec = None, x: ChannelValueSpec = None, y: ChannelValueSpec = None):
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


class Circle:
    def __init__(self, data: PlotMarkData, mark: str, ariaDescription: ChannelValue = None, ariaHidden: ChannelValue = None, ariaLabel: ChannelValue = None, clip: ChannelValue = None, dx: ChannelValue = None, dy: ChannelValue = None, facet: ChannelValue = None, facetAnchor: ChannelValue = None, fill: ChannelValue = None, fillOpacity: ChannelValue = None, filter: ChannelValue = None, frameAnchor: ChannelValue = None, fx: ChannelValue = None, fy: ChannelValue = None, href: ChannelValue = None, imageFilter: ChannelValue = None, margin: ChannelValue = None, marginBottom: ChannelValue = None, marginLeft: ChannelValue = None, marginRight: ChannelValue = None, marginTop: ChannelValue = None, mixBlendMode: ChannelValue = None, opacity: ChannelValue = None, paintOrder: ChannelValue = None, pointerEvents: ChannelValue = None, r: ChannelValue = None, reverse: ChannelValue = None, rotate: ChannelValue = None, select: ChannelValue = None, shapeRendering: ChannelValue = None, sort: ChannelValue = None, stroke: ChannelValue = None, strokeDasharray: ChannelValue = None, strokeDashoffset: ChannelValue = None, strokeLinecap: ChannelValue = None, strokeLinejoin: ChannelValue = None, strokeMiterlimit: ChannelValue = None, strokeOpacity: ChannelValue = None, strokeWidth: ChannelValue = None, symbol: ChannelValue = None, target: ChannelValue = None, tip: ChannelValue = None, title: ChannelValue = None, x: ChannelValue = None, y: ChannelValue = None, z: ChannelValue = None):
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


class Contour:
    def __init__(self, data: PlotMarkData, mark: str, ariaDescription: ChannelValueSpec = None, ariaHidden: ChannelValueSpec = None, ariaLabel: ChannelValueSpec = None, bandwidth: ChannelValueSpec = None, clip: ChannelValueSpec = None, dx: ChannelValueSpec = None, dy: ChannelValueSpec = None, facet: ChannelValueSpec = None, facetAnchor: ChannelValueSpec = None, fill: ChannelValueSpec = None, fillOpacity: ChannelValueSpec = None, filter: ChannelValueSpec = None, fx: ChannelValueSpec = None, fy: ChannelValueSpec = None, height: ChannelValueSpec = None, href: ChannelValueSpec = None, imageFilter: ChannelValueSpec = None, interpolate: ChannelValueSpec = None, margin: ChannelValueSpec = None, marginBottom: ChannelValueSpec = None, marginLeft: ChannelValueSpec = None, marginRight: ChannelValueSpec = None, marginTop: ChannelValueSpec = None, mixBlendMode: ChannelValueSpec = None, opacity: ChannelValueSpec = None, pad: ChannelValueSpec = None, paintOrder: ChannelValueSpec = None, pixelSize: ChannelValueSpec = None, pointerEvents: ChannelValueSpec = None, reverse: ChannelValueSpec = None, select: ChannelValueSpec = None, shapeRendering: ChannelValueSpec = None, sort: ChannelValueSpec = None, stroke: ChannelValueSpec = None, strokeDasharray: ChannelValueSpec = None, strokeDashoffset: ChannelValueSpec = None, strokeLinecap: ChannelValueSpec = None, strokeLinejoin: ChannelValueSpec = None, strokeMiterlimit: ChannelValueSpec = None, strokeOpacity: ChannelValueSpec = None, strokeWidth: ChannelValueSpec = None, target: ChannelValueSpec = None, thresholds: ChannelValueSpec = None, tip: ChannelValueSpec = None, title: ChannelValueSpec = None, width: ChannelValueSpec = None, x: ChannelValueSpec = None, y: ChannelValueSpec = None):
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


class DelaunayLink:
    def __init__(self, data: PlotMarkData, mark: str, ariaDescription: ChannelValue = None, ariaHidden: ChannelValue = None, ariaLabel: ChannelValue = None, clip: ChannelValue = None, curve: ChannelValue = None, dx: ChannelValue = None, dy: ChannelValue = None, facet: ChannelValue = None, facetAnchor: ChannelValue = None, fill: ChannelValue = None, fillOpacity: ChannelValue = None, filter: ChannelValue = None, fx: ChannelValue = None, fy: ChannelValue = None, href: ChannelValue = None, imageFilter: ChannelValue = None, margin: ChannelValue = None, marginBottom: ChannelValue = None, marginLeft: ChannelValue = None, marginRight: ChannelValue = None, marginTop: ChannelValue = None, marker: ChannelValue = None, markerEnd: ChannelValue = None, markerMid: ChannelValue = None, markerStart: ChannelValue = None, mixBlendMode: ChannelValue = None, opacity: ChannelValue = None, paintOrder: ChannelValue = None, pointerEvents: ChannelValue = None, reverse: ChannelValue = None, select: ChannelValue = None, shapeRendering: ChannelValue = None, sort: ChannelValue = None, stroke: ChannelValue = None, strokeDasharray: ChannelValue = None, strokeDashoffset: ChannelValue = None, strokeLinecap: ChannelValue = None, strokeLinejoin: ChannelValue = None, strokeMiterlimit: ChannelValue = None, strokeOpacity: ChannelValue = None, strokeWidth: ChannelValue = None, target: ChannelValue = None, tension: ChannelValue = None, tip: ChannelValue = None, title: ChannelValue = None, x: ChannelValue = None, y: ChannelValue = None, z: ChannelValue = None):
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


class DelaunayMesh:
    def __init__(self, data: PlotMarkData, mark: str, ariaDescription: ChannelValue = None, ariaHidden: ChannelValue = None, ariaLabel: ChannelValue = None, clip: ChannelValue = None, curve: ChannelValue = None, dx: ChannelValue = None, dy: ChannelValue = None, facet: ChannelValue = None, facetAnchor: ChannelValue = None, fill: ChannelValue = None, fillOpacity: ChannelValue = None, filter: ChannelValue = None, fx: ChannelValue = None, fy: ChannelValue = None, href: ChannelValue = None, imageFilter: ChannelValue = None, margin: ChannelValue = None, marginBottom: ChannelValue = None, marginLeft: ChannelValue = None, marginRight: ChannelValue = None, marginTop: ChannelValue = None, marker: ChannelValue = None, markerEnd: ChannelValue = None, markerMid: ChannelValue = None, markerStart: ChannelValue = None, mixBlendMode: ChannelValue = None, opacity: ChannelValue = None, paintOrder: ChannelValue = None, pointerEvents: ChannelValue = None, reverse: ChannelValue = None, select: ChannelValue = None, shapeRendering: ChannelValue = None, sort: ChannelValue = None, stroke: ChannelValue = None, strokeDasharray: ChannelValue = None, strokeDashoffset: ChannelValue = None, strokeLinecap: ChannelValue = None, strokeLinejoin: ChannelValue = None, strokeMiterlimit: ChannelValue = None, strokeOpacity: ChannelValue = None, strokeWidth: ChannelValue = None, target: ChannelValue = None, tension: ChannelValue = None, tip: ChannelValue = None, title: ChannelValue = None, x: ChannelValue = None, y: ChannelValue = None, z: ChannelValue = None):
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


class DenseLine:
    def __init__(self, data: PlotMarkData, mark: str, ariaDescription: ChannelValue = None, ariaHidden: ChannelValue = None, ariaLabel: ChannelValue = None, bandwidth: ChannelValue = None, clip: ChannelValue = None, dx: ChannelValue = None, dy: ChannelValue = None, facet: ChannelValue = None, facetAnchor: ChannelValue = None, fill: ChannelValue = None, fillOpacity: ChannelValue = None, filter: ChannelValue = None, fx: ChannelValue = None, fy: ChannelValue = None, height: ChannelValue = None, href: ChannelValue = None, imageFilter: ChannelValue = None, imageRendering: ChannelValue = None, interpolate: ChannelValue = None, margin: ChannelValue = None, marginBottom: ChannelValue = None, marginLeft: ChannelValue = None, marginRight: ChannelValue = None, marginTop: ChannelValue = None, mixBlendMode: ChannelValue = None, normalize: ChannelValue = None, opacity: ChannelValue = None, pad: ChannelValue = None, paintOrder: ChannelValue = None, pixelSize: ChannelValue = None, pointerEvents: ChannelValue = None, reverse: ChannelValue = None, select: ChannelValue = None, shapeRendering: ChannelValue = None, sort: ChannelValue = None, stroke: ChannelValue = None, strokeDasharray: ChannelValue = None, strokeDashoffset: ChannelValue = None, strokeLinecap: ChannelValue = None, strokeLinejoin: ChannelValue = None, strokeMiterlimit: ChannelValue = None, strokeOpacity: ChannelValue = None, strokeWidth: ChannelValue = None, target: ChannelValue = None, tip: ChannelValue = None, title: ChannelValue = None, width: ChannelValue = None, x: ChannelValue = None, y: ChannelValue = None, z: ChannelValue = None):
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


class Density:
    def __init__(self, data: PlotMarkData, mark: str, ariaDescription: ChannelValue = None, ariaHidden: ChannelValue = None, ariaLabel: ChannelValue = None, bandwidth: ChannelValue = None, clip: ChannelValue = None, dx: ChannelValue = None, dy: ChannelValue = None, facet: ChannelValue = None, facetAnchor: ChannelValue = None, fill: ChannelValue = None, fillOpacity: ChannelValue = None, filter: ChannelValue = None, fontFamily: ChannelValue = None, fontSize: ChannelValue = None, fontStyle: ChannelValue = None, fontVariant: ChannelValue = None, fontWeight: ChannelValue = None, frameAnchor: ChannelValue = None, fx: ChannelValue = None, fy: ChannelValue = None, height: ChannelValue = None, href: ChannelValue = None, imageFilter: ChannelValue = None, interpolate: ChannelValue = None, lineHeight: ChannelValue = None, lineWidth: ChannelValue = None, margin: ChannelValue = None, marginBottom: ChannelValue = None, marginLeft: ChannelValue = None, marginRight: ChannelValue = None, marginTop: ChannelValue = None, mixBlendMode: ChannelValue = None, monospace: ChannelValue = None, opacity: ChannelValue = None, pad: ChannelValue = None, paintOrder: ChannelValue = None, pixelSize: ChannelValue = None, pointerEvents: ChannelValue = None, r: ChannelValue = None, reverse: ChannelValue = None, rotate: ChannelValue = None, select: ChannelValue = None, shapeRendering: ChannelValue = None, sort: ChannelValue = None, stroke: ChannelValue = None, strokeDasharray: ChannelValue = None, strokeDashoffset: ChannelValue = None, strokeLinecap: ChannelValue = None, strokeLinejoin: ChannelValue = None, strokeMiterlimit: ChannelValue = None, strokeOpacity: ChannelValue = None, strokeWidth: ChannelValue = None, symbol: ChannelValue = None, target: ChannelValue = None, textAnchor: ChannelValue = None, textOverflow: ChannelValue = None, tip: ChannelValue = None, title: ChannelValue = None, type: ChannelValue = None, width: ChannelValue = None, x: ChannelValue = None, y: ChannelValue = None, z: ChannelValue = None):
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


class Dot:
    def __init__(self, data: PlotMarkData, mark: str, ariaDescription: ChannelValue = None, ariaHidden: ChannelValue = None, ariaLabel: ChannelValue = None, clip: ChannelValue = None, dx: ChannelValue = None, dy: ChannelValue = None, facet: ChannelValue = None, facetAnchor: ChannelValue = None, fill: ChannelValue = None, fillOpacity: ChannelValue = None, filter: ChannelValue = None, frameAnchor: ChannelValue = None, fx: ChannelValue = None, fy: ChannelValue = None, href: ChannelValue = None, imageFilter: ChannelValue = None, margin: ChannelValue = None, marginBottom: ChannelValue = None, marginLeft: ChannelValue = None, marginRight: ChannelValue = None, marginTop: ChannelValue = None, mixBlendMode: ChannelValue = None, opacity: ChannelValue = None, paintOrder: ChannelValue = None, pointerEvents: ChannelValue = None, r: ChannelValue = None, reverse: ChannelValue = None, rotate: ChannelValue = None, select: ChannelValue = None, shapeRendering: ChannelValue = None, sort: ChannelValue = None, stroke: ChannelValue = None, strokeDasharray: ChannelValue = None, strokeDashoffset: ChannelValue = None, strokeLinecap: ChannelValue = None, strokeLinejoin: ChannelValue = None, strokeMiterlimit: ChannelValue = None, strokeOpacity: ChannelValue = None, strokeWidth: ChannelValue = None, symbol: ChannelValue = None, target: ChannelValue = None, tip: ChannelValue = None, title: ChannelValue = None, x: ChannelValue = None, y: ChannelValue = None, z: ChannelValue = None):
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


class ErrorBarX:
    def __init__(self, data: PlotMarkData, mark: str, x: ChannelValueSpec, ariaDescription: ChannelValue = None, ariaHidden: ChannelValue = None, ariaLabel: ChannelValue = None, ci: ChannelValue = None, clip: ChannelValue = None, dx: ChannelValue = None, dy: ChannelValue = None, facet: ChannelValue = None, facetAnchor: ChannelValue = None, fill: ChannelValue = None, fillOpacity: ChannelValue = None, filter: ChannelValue = None, fx: ChannelValue = None, fy: ChannelValue = None, href: ChannelValue = None, imageFilter: ChannelValue = None, margin: ChannelValue = None, marginBottom: ChannelValue = None, marginLeft: ChannelValue = None, marginRight: ChannelValue = None, marginTop: ChannelValue = None, marker: ChannelValue = None, markerEnd: ChannelValue = None, markerMid: ChannelValue = None, markerStart: ChannelValue = None, mixBlendMode: ChannelValue = None, opacity: ChannelValue = None, paintOrder: ChannelValue = None, pointerEvents: ChannelValue = None, reverse: ChannelValue = None, select: ChannelValue = None, shapeRendering: ChannelValue = None, sort: ChannelValue = None, stroke: ChannelValue = None, strokeDasharray: ChannelValue = None, strokeDashoffset: ChannelValue = None, strokeLinecap: ChannelValue = None, strokeLinejoin: ChannelValue = None, strokeMiterlimit: ChannelValue = None, strokeOpacity: ChannelValue = None, strokeWidth: ChannelValue = None, target: ChannelValue = None, tip: ChannelValue = None, title: ChannelValue = None, y: ChannelValue = None, z: ChannelValue = None):
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


class ErrorBarY:
    def __init__(self, data: PlotMarkData, mark: str, y: ChannelValueSpec, ariaDescription: ChannelValue = None, ariaHidden: ChannelValue = None, ariaLabel: ChannelValue = None, ci: ChannelValue = None, clip: ChannelValue = None, dx: ChannelValue = None, dy: ChannelValue = None, facet: ChannelValue = None, facetAnchor: ChannelValue = None, fill: ChannelValue = None, fillOpacity: ChannelValue = None, filter: ChannelValue = None, fx: ChannelValue = None, fy: ChannelValue = None, href: ChannelValue = None, imageFilter: ChannelValue = None, margin: ChannelValue = None, marginBottom: ChannelValue = None, marginLeft: ChannelValue = None, marginRight: ChannelValue = None, marginTop: ChannelValue = None, marker: ChannelValue = None, markerEnd: ChannelValue = None, markerMid: ChannelValue = None, markerStart: ChannelValue = None, mixBlendMode: ChannelValue = None, opacity: ChannelValue = None, paintOrder: ChannelValue = None, pointerEvents: ChannelValue = None, reverse: ChannelValue = None, select: ChannelValue = None, shapeRendering: ChannelValue = None, sort: ChannelValue = None, stroke: ChannelValue = None, strokeDasharray: ChannelValue = None, strokeDashoffset: ChannelValue = None, strokeLinecap: ChannelValue = None, strokeLinejoin: ChannelValue = None, strokeMiterlimit: ChannelValue = None, strokeOpacity: ChannelValue = None, strokeWidth: ChannelValue = None, target: ChannelValue = None, tip: ChannelValue = None, title: ChannelValue = None, x: ChannelValue = None, z: ChannelValue = None):
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


class Frame:
    def __init__(self, mark: str, anchor: ChannelValue = None, ariaDescription: ChannelValue = None, ariaHidden: ChannelValue = None, ariaLabel: ChannelValue = None, clip: ChannelValue = None, dx: ChannelValue = None, dy: ChannelValue = None, facet: ChannelValue = None, facetAnchor: ChannelValue = None, fill: ChannelValue = None, fillOpacity: ChannelValue = None, filter: ChannelValue = None, fx: ChannelValue = None, fy: ChannelValue = None, href: ChannelValue = None, imageFilter: ChannelValue = None, inset: ChannelValue = None, insetBottom: ChannelValue = None, insetLeft: ChannelValue = None, insetRight: ChannelValue = None, insetTop: ChannelValue = None, margin: ChannelValue = None, marginBottom: ChannelValue = None, marginLeft: ChannelValue = None, marginRight: ChannelValue = None, marginTop: ChannelValue = None, mixBlendMode: ChannelValue = None, opacity: ChannelValue = None, paintOrder: ChannelValue = None, pointerEvents: ChannelValue = None, reverse: ChannelValue = None, rx: ChannelValue = None, ry: ChannelValue = None, select: ChannelValue = None, shapeRendering: ChannelValue = None, sort: ChannelValue = None, stroke: ChannelValue = None, strokeDasharray: ChannelValue = None, strokeDashoffset: ChannelValue = None, strokeLinecap: ChannelValue = None, strokeLinejoin: ChannelValue = None, strokeMiterlimit: ChannelValue = None, strokeOpacity: ChannelValue = None, strokeWidth: ChannelValue = None, target: ChannelValue = None, tip: ChannelValue = None, title: ChannelValue = None):
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


class Geo:
    def __init__(self, data: PlotMarkData, mark: str, ariaDescription: ChannelValue = None, ariaHidden: ChannelValue = None, ariaLabel: ChannelValue = None, clip: ChannelValue = None, dx: ChannelValue = None, dy: ChannelValue = None, facet: ChannelValue = None, facetAnchor: ChannelValue = None, fill: ChannelValue = None, fillOpacity: ChannelValue = None, filter: ChannelValue = None, fx: ChannelValue = None, fy: ChannelValue = None, geometry: ChannelValue = None, href: ChannelValue = None, imageFilter: ChannelValue = None, margin: ChannelValue = None, marginBottom: ChannelValue = None, marginLeft: ChannelValue = None, marginRight: ChannelValue = None, marginTop: ChannelValue = None, mixBlendMode: ChannelValue = None, opacity: ChannelValue = None, paintOrder: ChannelValue = None, pointerEvents: ChannelValue = None, r: ChannelValue = None, reverse: ChannelValue = None, select: ChannelValue = None, shapeRendering: ChannelValue = None, sort: ChannelValue = None, stroke: ChannelValue = None, strokeDasharray: ChannelValue = None, strokeDashoffset: ChannelValue = None, strokeLinecap: ChannelValue = None, strokeLinejoin: ChannelValue = None, strokeMiterlimit: ChannelValue = None, strokeOpacity: ChannelValue = None, strokeWidth: ChannelValue = None, target: ChannelValue = None, tip: ChannelValue = None, title: ChannelValue = None):
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


class Graticule:
    def __init__(self, mark: str, ariaDescription: ChannelValue = None, ariaHidden: ChannelValue = None, ariaLabel: ChannelValue = None, clip: ChannelValue = None, dx: ChannelValue = None, dy: ChannelValue = None, facet: ChannelValue = None, facetAnchor: ChannelValue = None, fill: ChannelValue = None, fillOpacity: ChannelValue = None, filter: ChannelValue = None, fx: ChannelValue = None, fy: ChannelValue = None, href: ChannelValue = None, imageFilter: ChannelValue = None, margin: ChannelValue = None, marginBottom: ChannelValue = None, marginLeft: ChannelValue = None, marginRight: ChannelValue = None, marginTop: ChannelValue = None, mixBlendMode: ChannelValue = None, opacity: ChannelValue = None, paintOrder: ChannelValue = None, pointerEvents: ChannelValue = None, reverse: ChannelValue = None, select: ChannelValue = None, shapeRendering: ChannelValue = None, sort: ChannelValue = None, stroke: ChannelValue = None, strokeDasharray: ChannelValue = None, strokeDashoffset: ChannelValue = None, strokeLinecap: ChannelValue = None, strokeLinejoin: ChannelValue = None, strokeMiterlimit: ChannelValue = None, strokeOpacity: ChannelValue = None, strokeWidth: ChannelValue = None, target: ChannelValue = None, tip: ChannelValue = None, title: ChannelValue = None):
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


class Heatmap:
    def __init__(self, data: PlotMarkData, mark: str, ariaDescription: ChannelValueSpec = None, ariaHidden: ChannelValueSpec = None, ariaLabel: ChannelValueSpec = None, bandwidth: ChannelValueSpec = None, clip: ChannelValueSpec = None, dx: ChannelValueSpec = None, dy: ChannelValueSpec = None, facet: ChannelValueSpec = None, facetAnchor: ChannelValueSpec = None, fill: ChannelValueSpec = None, fillOpacity: ChannelValueSpec = None, filter: ChannelValueSpec = None, fx: ChannelValueSpec = None, fy: ChannelValueSpec = None, height: ChannelValueSpec = None, href: ChannelValueSpec = None, imageFilter: ChannelValueSpec = None, imageRendering: ChannelValueSpec = None, interpolate: ChannelValueSpec = None, margin: ChannelValueSpec = None, marginBottom: ChannelValueSpec = None, marginLeft: ChannelValueSpec = None, marginRight: ChannelValueSpec = None, marginTop: ChannelValueSpec = None, mixBlendMode: ChannelValueSpec = None, opacity: ChannelValueSpec = None, pad: ChannelValueSpec = None, paintOrder: ChannelValueSpec = None, pixelSize: ChannelValueSpec = None, pointerEvents: ChannelValueSpec = None, reverse: ChannelValueSpec = None, select: ChannelValueSpec = None, shapeRendering: ChannelValueSpec = None, sort: ChannelValueSpec = None, stroke: ChannelValueSpec = None, strokeDasharray: ChannelValueSpec = None, strokeDashoffset: ChannelValueSpec = None, strokeLinecap: ChannelValueSpec = None, strokeLinejoin: ChannelValueSpec = None, strokeMiterlimit: ChannelValueSpec = None, strokeOpacity: ChannelValueSpec = None, strokeWidth: ChannelValueSpec = None, target: ChannelValueSpec = None, tip: ChannelValueSpec = None, title: ChannelValueSpec = None, width: ChannelValueSpec = None, x: ChannelValueSpec = None, y: ChannelValueSpec = None):
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


class Hexagon:
    def __init__(self, data: PlotMarkData, mark: str, ariaDescription: ChannelValue = None, ariaHidden: ChannelValue = None, ariaLabel: ChannelValue = None, clip: ChannelValue = None, dx: ChannelValue = None, dy: ChannelValue = None, facet: ChannelValue = None, facetAnchor: ChannelValue = None, fill: ChannelValue = None, fillOpacity: ChannelValue = None, filter: ChannelValue = None, frameAnchor: ChannelValue = None, fx: ChannelValue = None, fy: ChannelValue = None, href: ChannelValue = None, imageFilter: ChannelValue = None, margin: ChannelValue = None, marginBottom: ChannelValue = None, marginLeft: ChannelValue = None, marginRight: ChannelValue = None, marginTop: ChannelValue = None, mixBlendMode: ChannelValue = None, opacity: ChannelValue = None, paintOrder: ChannelValue = None, pointerEvents: ChannelValue = None, r: ChannelValue = None, reverse: ChannelValue = None, rotate: ChannelValue = None, select: ChannelValue = None, shapeRendering: ChannelValue = None, sort: ChannelValue = None, stroke: ChannelValue = None, strokeDasharray: ChannelValue = None, strokeDashoffset: ChannelValue = None, strokeLinecap: ChannelValue = None, strokeLinejoin: ChannelValue = None, strokeMiterlimit: ChannelValue = None, strokeOpacity: ChannelValue = None, strokeWidth: ChannelValue = None, symbol: ChannelValue = None, target: ChannelValue = None, tip: ChannelValue = None, title: ChannelValue = None, x: ChannelValue = None, y: ChannelValue = None, z: ChannelValue = None):
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


class Hexbin:
    def __init__(self, data: PlotMarkData, mark: str, ariaDescription: ChannelValue = None, ariaHidden: ChannelValue = None, ariaLabel: ChannelValue = None, binWidth: ChannelValue = None, clip: ChannelValue = None, dx: ChannelValue = None, dy: ChannelValue = None, facet: ChannelValue = None, facetAnchor: ChannelValue = None, fill: ChannelValue = None, fillOpacity: ChannelValue = None, filter: ChannelValue = None, fontFamily: ChannelValue = None, fontSize: ChannelValue = None, fontStyle: ChannelValue = None, fontVariant: ChannelValue = None, fontWeight: ChannelValue = None, frameAnchor: ChannelValue = None, fx: ChannelValue = None, fy: ChannelValue = None, href: ChannelValue = None, imageFilter: ChannelValue = None, lineHeight: ChannelValue = None, lineWidth: ChannelValue = None, margin: ChannelValue = None, marginBottom: ChannelValue = None, marginLeft: ChannelValue = None, marginRight: ChannelValue = None, marginTop: ChannelValue = None, mixBlendMode: ChannelValue = None, monospace: ChannelValue = None, opacity: ChannelValue = None, paintOrder: ChannelValue = None, pointerEvents: ChannelValue = None, r: ChannelValue = None, reverse: ChannelValue = None, rotate: ChannelValue = None, select: ChannelValue = None, shapeRendering: ChannelValue = None, sort: ChannelValue = None, stroke: ChannelValue = None, strokeDasharray: ChannelValue = None, strokeDashoffset: ChannelValue = None, strokeLinecap: ChannelValue = None, strokeLinejoin: ChannelValue = None, strokeMiterlimit: ChannelValue = None, strokeOpacity: ChannelValue = None, strokeWidth: ChannelValue = None, symbol: ChannelValue = None, target: ChannelValue = None, textAnchor: ChannelValue = None, textOverflow: ChannelValue = None, tip: ChannelValue = None, title: ChannelValue = None, type: ChannelValue = None, x: ChannelValue = None, y: ChannelValue = None, z: ChannelValue = None):
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


class Hexgrid:
    def __init__(self, mark: str, ariaDescription: ChannelValue = None, ariaHidden: ChannelValue = None, ariaLabel: ChannelValue = None, binWidth: ChannelValue = None, clip: ChannelValue = None, dx: ChannelValue = None, dy: ChannelValue = None, facet: ChannelValue = None, facetAnchor: ChannelValue = None, fill: ChannelValue = None, fillOpacity: ChannelValue = None, filter: ChannelValue = None, fx: ChannelValue = None, fy: ChannelValue = None, href: ChannelValue = None, imageFilter: ChannelValue = None, margin: ChannelValue = None, marginBottom: ChannelValue = None, marginLeft: ChannelValue = None, marginRight: ChannelValue = None, marginTop: ChannelValue = None, mixBlendMode: ChannelValue = None, opacity: ChannelValue = None, paintOrder: ChannelValue = None, pointerEvents: ChannelValue = None, reverse: ChannelValue = None, select: ChannelValue = None, shapeRendering: ChannelValue = None, sort: ChannelValue = None, stroke: ChannelValue = None, strokeDasharray: ChannelValue = None, strokeDashoffset: ChannelValue = None, strokeLinecap: ChannelValue = None, strokeLinejoin: ChannelValue = None, strokeMiterlimit: ChannelValue = None, strokeOpacity: ChannelValue = None, strokeWidth: ChannelValue = None, target: ChannelValue = None, tip: ChannelValue = None, title: ChannelValue = None):
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


class Hull:
    def __init__(self, data: PlotMarkData, mark: str, ariaDescription: ChannelValue = None, ariaHidden: ChannelValue = None, ariaLabel: ChannelValue = None, clip: ChannelValue = None, curve: ChannelValue = None, dx: ChannelValue = None, dy: ChannelValue = None, facet: ChannelValue = None, facetAnchor: ChannelValue = None, fill: ChannelValue = None, fillOpacity: ChannelValue = None, filter: ChannelValue = None, fx: ChannelValue = None, fy: ChannelValue = None, href: ChannelValue = None, imageFilter: ChannelValue = None, margin: ChannelValue = None, marginBottom: ChannelValue = None, marginLeft: ChannelValue = None, marginRight: ChannelValue = None, marginTop: ChannelValue = None, marker: ChannelValue = None, markerEnd: ChannelValue = None, markerMid: ChannelValue = None, markerStart: ChannelValue = None, mixBlendMode: ChannelValue = None, opacity: ChannelValue = None, paintOrder: ChannelValue = None, pointerEvents: ChannelValue = None, reverse: ChannelValue = None, select: ChannelValue = None, shapeRendering: ChannelValue = None, sort: ChannelValue = None, stroke: ChannelValue = None, strokeDasharray: ChannelValue = None, strokeDashoffset: ChannelValue = None, strokeLinecap: ChannelValue = None, strokeLinejoin: ChannelValue = None, strokeMiterlimit: ChannelValue = None, strokeOpacity: ChannelValue = None, strokeWidth: ChannelValue = None, target: ChannelValue = None, tension: ChannelValue = None, tip: ChannelValue = None, title: ChannelValue = None, x: ChannelValue = None, y: ChannelValue = None, z: ChannelValue = None):
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


class Image:
    def __init__(self, data: PlotMarkData, mark: str, ariaDescription: ChannelValueSpec = None, ariaHidden: ChannelValueSpec = None, ariaLabel: ChannelValueSpec = None, clip: ChannelValueSpec = None, crossOrigin: ChannelValueSpec = None, dx: ChannelValueSpec = None, dy: ChannelValueSpec = None, facet: ChannelValueSpec = None, facetAnchor: ChannelValueSpec = None, fill: ChannelValueSpec = None, fillOpacity: ChannelValueSpec = None, filter: ChannelValueSpec = None, frameAnchor: ChannelValueSpec = None, fx: ChannelValueSpec = None, fy: ChannelValueSpec = None, height: ChannelValueSpec = None, href: ChannelValueSpec = None, imageFilter: ChannelValueSpec = None, imageRendering: ChannelValueSpec = None, margin: ChannelValueSpec = None, marginBottom: ChannelValueSpec = None, marginLeft: ChannelValueSpec = None, marginRight: ChannelValueSpec = None, marginTop: ChannelValueSpec = None, mixBlendMode: ChannelValueSpec = None, opacity: ChannelValueSpec = None, paintOrder: ChannelValueSpec = None, pointerEvents: ChannelValueSpec = None, preserveAspectRatio: ChannelValueSpec = None, r: ChannelValueSpec = None, reverse: ChannelValueSpec = None, rotate: ChannelValueSpec = None, select: ChannelValueSpec = None, shapeRendering: ChannelValueSpec = None, sort: ChannelValueSpec = None, src: ChannelValueSpec = None, stroke: ChannelValueSpec = None, strokeDasharray: ChannelValueSpec = None, strokeDashoffset: ChannelValueSpec = None, strokeLinecap: ChannelValueSpec = None, strokeLinejoin: ChannelValueSpec = None, strokeMiterlimit: ChannelValueSpec = None, strokeOpacity: ChannelValueSpec = None, strokeWidth: ChannelValueSpec = None, target: ChannelValueSpec = None, tip: ChannelValueSpec = None, title: ChannelValueSpec = None, width: ChannelValueSpec = None, x: ChannelValueSpec = None, y: ChannelValueSpec = None):
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


class Line:
    def __init__(self, data: PlotMarkData, mark: str, ariaDescription: ChannelValue = None, ariaHidden: ChannelValue = None, ariaLabel: ChannelValue = None, clip: ChannelValue = None, curve: ChannelValue = None, dx: ChannelValue = None, dy: ChannelValue = None, facet: ChannelValue = None, facetAnchor: ChannelValue = None, fill: ChannelValue = None, fillOpacity: ChannelValue = None, filter: ChannelValue = None, fx: ChannelValue = None, fy: ChannelValue = None, href: ChannelValue = None, imageFilter: ChannelValue = None, margin: ChannelValue = None, marginBottom: ChannelValue = None, marginLeft: ChannelValue = None, marginRight: ChannelValue = None, marginTop: ChannelValue = None, marker: ChannelValue = None, markerEnd: ChannelValue = None, markerMid: ChannelValue = None, markerStart: ChannelValue = None, mixBlendMode: ChannelValue = None, opacity: ChannelValue = None, paintOrder: ChannelValue = None, pointerEvents: ChannelValue = None, reverse: ChannelValue = None, select: ChannelValue = None, shapeRendering: ChannelValue = None, sort: ChannelValue = None, stroke: ChannelValue = None, strokeDasharray: ChannelValue = None, strokeDashoffset: ChannelValue = None, strokeLinecap: ChannelValue = None, strokeLinejoin: ChannelValue = None, strokeMiterlimit: ChannelValue = None, strokeOpacity: ChannelValue = None, strokeWidth: ChannelValue = None, target: ChannelValue = None, tension: ChannelValue = None, tip: ChannelValue = None, title: ChannelValue = None, x: ChannelValue = None, y: ChannelValue = None, z: ChannelValue = None):
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


class LineX:
    def __init__(self, data: PlotMarkData, mark: str, ariaDescription: ChannelValue = None, ariaHidden: ChannelValue = None, ariaLabel: ChannelValue = None, clip: ChannelValue = None, curve: ChannelValue = None, dx: ChannelValue = None, dy: ChannelValue = None, facet: ChannelValue = None, facetAnchor: ChannelValue = None, fill: ChannelValue = None, fillOpacity: ChannelValue = None, filter: ChannelValue = None, fx: ChannelValue = None, fy: ChannelValue = None, href: ChannelValue = None, imageFilter: ChannelValue = None, margin: ChannelValue = None, marginBottom: ChannelValue = None, marginLeft: ChannelValue = None, marginRight: ChannelValue = None, marginTop: ChannelValue = None, marker: ChannelValue = None, markerEnd: ChannelValue = None, markerMid: ChannelValue = None, markerStart: ChannelValue = None, mixBlendMode: ChannelValue = None, opacity: ChannelValue = None, paintOrder: ChannelValue = None, pointerEvents: ChannelValue = None, reverse: ChannelValue = None, select: ChannelValue = None, shapeRendering: ChannelValue = None, sort: ChannelValue = None, stroke: ChannelValue = None, strokeDasharray: ChannelValue = None, strokeDashoffset: ChannelValue = None, strokeLinecap: ChannelValue = None, strokeLinejoin: ChannelValue = None, strokeMiterlimit: ChannelValue = None, strokeOpacity: ChannelValue = None, strokeWidth: ChannelValue = None, target: ChannelValue = None, tension: ChannelValue = None, tip: ChannelValue = None, title: ChannelValue = None, x: ChannelValue = None, y: ChannelValue = None, z: ChannelValue = None):
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


class LineY:
    def __init__(self, data: PlotMarkData, mark: str, ariaDescription: ChannelValue = None, ariaHidden: ChannelValue = None, ariaLabel: ChannelValue = None, clip: ChannelValue = None, curve: ChannelValue = None, dx: ChannelValue = None, dy: ChannelValue = None, facet: ChannelValue = None, facetAnchor: ChannelValue = None, fill: ChannelValue = None, fillOpacity: ChannelValue = None, filter: ChannelValue = None, fx: ChannelValue = None, fy: ChannelValue = None, href: ChannelValue = None, imageFilter: ChannelValue = None, margin: ChannelValue = None, marginBottom: ChannelValue = None, marginLeft: ChannelValue = None, marginRight: ChannelValue = None, marginTop: ChannelValue = None, marker: ChannelValue = None, markerEnd: ChannelValue = None, markerMid: ChannelValue = None, markerStart: ChannelValue = None, mixBlendMode: ChannelValue = None, opacity: ChannelValue = None, paintOrder: ChannelValue = None, pointerEvents: ChannelValue = None, reverse: ChannelValue = None, select: ChannelValue = None, shapeRendering: ChannelValue = None, sort: ChannelValue = None, stroke: ChannelValue = None, strokeDasharray: ChannelValue = None, strokeDashoffset: ChannelValue = None, strokeLinecap: ChannelValue = None, strokeLinejoin: ChannelValue = None, strokeMiterlimit: ChannelValue = None, strokeOpacity: ChannelValue = None, strokeWidth: ChannelValue = None, target: ChannelValue = None, tension: ChannelValue = None, tip: ChannelValue = None, title: ChannelValue = None, x: ChannelValue = None, y: ChannelValue = None, z: ChannelValue = None):
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


class Link:
    def __init__(self, data: PlotMarkData, mark: str, ariaDescription: ChannelValueSpec = None, ariaHidden: ChannelValueSpec = None, ariaLabel: ChannelValueSpec = None, clip: ChannelValueSpec = None, curve: ChannelValueSpec = None, dx: ChannelValueSpec = None, dy: ChannelValueSpec = None, facet: ChannelValueSpec = None, facetAnchor: ChannelValueSpec = None, fill: ChannelValueSpec = None, fillOpacity: ChannelValueSpec = None, filter: ChannelValueSpec = None, fx: ChannelValueSpec = None, fy: ChannelValueSpec = None, href: ChannelValueSpec = None, imageFilter: ChannelValueSpec = None, margin: ChannelValueSpec = None, marginBottom: ChannelValueSpec = None, marginLeft: ChannelValueSpec = None, marginRight: ChannelValueSpec = None, marginTop: ChannelValueSpec = None, marker: ChannelValueSpec = None, markerEnd: ChannelValueSpec = None, markerMid: ChannelValueSpec = None, markerStart: ChannelValueSpec = None, mixBlendMode: ChannelValueSpec = None, opacity: ChannelValueSpec = None, paintOrder: ChannelValueSpec = None, pointerEvents: ChannelValueSpec = None, reverse: ChannelValueSpec = None, select: ChannelValueSpec = None, shapeRendering: ChannelValueSpec = None, sort: ChannelValueSpec = None, stroke: ChannelValueSpec = None, strokeDasharray: ChannelValueSpec = None, strokeDashoffset: ChannelValueSpec = None, strokeLinecap: ChannelValueSpec = None, strokeLinejoin: ChannelValueSpec = None, strokeMiterlimit: ChannelValueSpec = None, strokeOpacity: ChannelValueSpec = None, strokeWidth: ChannelValueSpec = None, target: ChannelValueSpec = None, tension: ChannelValueSpec = None, tip: ChannelValueSpec = None, title: ChannelValueSpec = None, x: ChannelValueSpec = None, x1: ChannelValueSpec = None, x2: ChannelValueSpec = None, y: ChannelValueSpec = None, y1: ChannelValueSpec = None, y2: ChannelValueSpec = None):
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


class Raster:
    def __init__(self, data: PlotMarkData, mark: str, ariaDescription: ChannelValueSpec = None, ariaHidden: ChannelValueSpec = None, ariaLabel: ChannelValueSpec = None, bandwidth: ChannelValueSpec = None, clip: ChannelValueSpec = None, dx: ChannelValueSpec = None, dy: ChannelValueSpec = None, facet: ChannelValueSpec = None, facetAnchor: ChannelValueSpec = None, fill: ChannelValueSpec = None, fillOpacity: ChannelValueSpec = None, filter: ChannelValueSpec = None, fx: ChannelValueSpec = None, fy: ChannelValueSpec = None, height: ChannelValueSpec = None, href: ChannelValueSpec = None, imageFilter: ChannelValueSpec = None, imageRendering: ChannelValueSpec = None, interpolate: ChannelValueSpec = None, margin: ChannelValueSpec = None, marginBottom: ChannelValueSpec = None, marginLeft: ChannelValueSpec = None, marginRight: ChannelValueSpec = None, marginTop: ChannelValueSpec = None, mixBlendMode: ChannelValueSpec = None, opacity: ChannelValueSpec = None, pad: ChannelValueSpec = None, paintOrder: ChannelValueSpec = None, pixelSize: ChannelValueSpec = None, pointerEvents: ChannelValueSpec = None, reverse: ChannelValueSpec = None, select: ChannelValueSpec = None, shapeRendering: ChannelValueSpec = None, sort: ChannelValueSpec = None, stroke: ChannelValueSpec = None, strokeDasharray: ChannelValueSpec = None, strokeDashoffset: ChannelValueSpec = None, strokeLinecap: ChannelValueSpec = None, strokeLinejoin: ChannelValueSpec = None, strokeMiterlimit: ChannelValueSpec = None, strokeOpacity: ChannelValueSpec = None, strokeWidth: ChannelValueSpec = None, target: ChannelValueSpec = None, tip: ChannelValueSpec = None, title: ChannelValueSpec = None, width: ChannelValueSpec = None, x: ChannelValueSpec = None, y: ChannelValueSpec = None):
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


class RasterTile:
    def __init__(self, data: PlotMarkData, mark: str, ariaDescription: ChannelValueSpec = None, ariaHidden: ChannelValueSpec = None, ariaLabel: ChannelValueSpec = None, bandwidth: ChannelValueSpec = None, clip: ChannelValueSpec = None, dx: ChannelValueSpec = None, dy: ChannelValueSpec = None, facet: ChannelValueSpec = None, facetAnchor: ChannelValueSpec = None, fill: ChannelValueSpec = None, fillOpacity: ChannelValueSpec = None, filter: ChannelValueSpec = None, fx: ChannelValueSpec = None, fy: ChannelValueSpec = None, height: ChannelValueSpec = None, href: ChannelValueSpec = None, imageFilter: ChannelValueSpec = None, imageRendering: ChannelValueSpec = None, interpolate: ChannelValueSpec = None, margin: ChannelValueSpec = None, marginBottom: ChannelValueSpec = None, marginLeft: ChannelValueSpec = None, marginRight: ChannelValueSpec = None, marginTop: ChannelValueSpec = None, mixBlendMode: ChannelValueSpec = None, opacity: ChannelValueSpec = None, origin: ChannelValueSpec = None, pad: ChannelValueSpec = None, paintOrder: ChannelValueSpec = None, pixelSize: ChannelValueSpec = None, pointerEvents: ChannelValueSpec = None, reverse: ChannelValueSpec = None, select: ChannelValueSpec = None, shapeRendering: ChannelValueSpec = None, sort: ChannelValueSpec = None, stroke: ChannelValueSpec = None, strokeDasharray: ChannelValueSpec = None, strokeDashoffset: ChannelValueSpec = None, strokeLinecap: ChannelValueSpec = None, strokeLinejoin: ChannelValueSpec = None, strokeMiterlimit: ChannelValueSpec = None, strokeOpacity: ChannelValueSpec = None, strokeWidth: ChannelValueSpec = None, target: ChannelValueSpec = None, tip: ChannelValueSpec = None, title: ChannelValueSpec = None, width: ChannelValueSpec = None, x: ChannelValueSpec = None, y: ChannelValueSpec = None):
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


class RegressionY:
    def __init__(self, data: PlotMarkData, mark: str, ariaDescription: ChannelValue = None, ariaHidden: ChannelValue = None, ariaLabel: ChannelValue = None, ci: ChannelValue = None, clip: ChannelValue = None, dx: ChannelValue = None, dy: ChannelValue = None, facet: ChannelValue = None, facetAnchor: ChannelValue = None, fill: ChannelValue = None, fillOpacity: ChannelValue = None, filter: ChannelValue = None, fx: ChannelValue = None, fy: ChannelValue = None, href: ChannelValue = None, imageFilter: ChannelValue = None, margin: ChannelValue = None, marginBottom: ChannelValue = None, marginLeft: ChannelValue = None, marginRight: ChannelValue = None, marginTop: ChannelValue = None, mixBlendMode: ChannelValue = None, opacity: ChannelValue = None, paintOrder: ChannelValue = None, pointerEvents: ChannelValue = None, precision: ChannelValue = None, reverse: ChannelValue = None, select: ChannelValue = None, shapeRendering: ChannelValue = None, sort: ChannelValue = None, stroke: ChannelValue = None, strokeDasharray: ChannelValue = None, strokeDashoffset: ChannelValue = None, strokeLinecap: ChannelValue = None, strokeLinejoin: ChannelValue = None, strokeMiterlimit: ChannelValue = None, strokeOpacity: ChannelValue = None, strokeWidth: ChannelValue = None, target: ChannelValue = None, tip: ChannelValue = None, title: ChannelValue = None, x: ChannelValue = None, y: ChannelValue = None, z: ChannelValue = None):
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


class Sphere:
    def __init__(self, mark: str, ariaDescription: ChannelValue = None, ariaHidden: ChannelValue = None, ariaLabel: ChannelValue = None, clip: ChannelValue = None, dx: ChannelValue = None, dy: ChannelValue = None, facet: ChannelValue = None, facetAnchor: ChannelValue = None, fill: ChannelValue = None, fillOpacity: ChannelValue = None, filter: ChannelValue = None, fx: ChannelValue = None, fy: ChannelValue = None, href: ChannelValue = None, imageFilter: ChannelValue = None, margin: ChannelValue = None, marginBottom: ChannelValue = None, marginLeft: ChannelValue = None, marginRight: ChannelValue = None, marginTop: ChannelValue = None, mixBlendMode: ChannelValue = None, opacity: ChannelValue = None, paintOrder: ChannelValue = None, pointerEvents: ChannelValue = None, reverse: ChannelValue = None, select: ChannelValue = None, shapeRendering: ChannelValue = None, sort: ChannelValue = None, stroke: ChannelValue = None, strokeDasharray: ChannelValue = None, strokeDashoffset: ChannelValue = None, strokeLinecap: ChannelValue = None, strokeLinejoin: ChannelValue = None, strokeMiterlimit: ChannelValue = None, strokeOpacity: ChannelValue = None, strokeWidth: ChannelValue = None, target: ChannelValue = None, tip: ChannelValue = None, title: ChannelValue = None):
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


class Spike:
    def __init__(self, data: PlotMarkData, mark: str, anchor: ChannelValueSpec = None, ariaDescription: ChannelValueSpec = None, ariaHidden: ChannelValueSpec = None, ariaLabel: ChannelValueSpec = None, clip: ChannelValueSpec = None, dx: ChannelValueSpec = None, dy: ChannelValueSpec = None, facet: ChannelValueSpec = None, facetAnchor: ChannelValueSpec = None, fill: ChannelValueSpec = None, fillOpacity: ChannelValueSpec = None, filter: ChannelValueSpec = None, frameAnchor: ChannelValueSpec = None, fx: ChannelValueSpec = None, fy: ChannelValueSpec = None, href: ChannelValueSpec = None, imageFilter: ChannelValueSpec = None, length: ChannelValueSpec = None, margin: ChannelValueSpec = None, marginBottom: ChannelValueSpec = None, marginLeft: ChannelValueSpec = None, marginRight: ChannelValueSpec = None, marginTop: ChannelValueSpec = None, mixBlendMode: ChannelValueSpec = None, opacity: ChannelValueSpec = None, paintOrder: ChannelValueSpec = None, pointerEvents: ChannelValueSpec = None, r: ChannelValueSpec = None, reverse: ChannelValueSpec = None, rotate: ChannelValueSpec = None, select: ChannelValueSpec = None, shape: ChannelValueSpec = None, shapeRendering: ChannelValueSpec = None, sort: ChannelValueSpec = None, stroke: ChannelValueSpec = None, strokeDasharray: ChannelValueSpec = None, strokeDashoffset: ChannelValueSpec = None, strokeLinecap: ChannelValueSpec = None, strokeLinejoin: ChannelValueSpec = None, strokeMiterlimit: ChannelValueSpec = None, strokeOpacity: ChannelValueSpec = None, strokeWidth: ChannelValueSpec = None, target: ChannelValueSpec = None, tip: ChannelValueSpec = None, title: ChannelValueSpec = None, x: ChannelValueSpec = None, y: ChannelValueSpec = None):
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


class Text:
    def __init__(self, mark: str, ariaDescription: ChannelValue = None, ariaHidden: ChannelValue = None, ariaLabel: ChannelValue = None, clip: ChannelValue = None, data: ChannelValue = None, dx: ChannelValue = None, dy: ChannelValue = None, facet: ChannelValue = None, facetAnchor: ChannelValue = None, fill: ChannelValue = None, fillOpacity: ChannelValue = None, filter: ChannelValue = None, fontFamily: ChannelValue = None, fontSize: ChannelValue = None, fontStyle: ChannelValue = None, fontVariant: ChannelValue = None, fontWeight: ChannelValue = None, frameAnchor: ChannelValue = None, fx: ChannelValue = None, fy: ChannelValue = None, href: ChannelValue = None, imageFilter: ChannelValue = None, lineAnchor: ChannelValue = None, lineHeight: ChannelValue = None, lineWidth: ChannelValue = None, margin: ChannelValue = None, marginBottom: ChannelValue = None, marginLeft: ChannelValue = None, marginRight: ChannelValue = None, marginTop: ChannelValue = None, mixBlendMode: ChannelValue = None, monospace: ChannelValue = None, opacity: ChannelValue = None, paintOrder: ChannelValue = None, pointerEvents: ChannelValue = None, reverse: ChannelValue = None, rotate: ChannelValue = None, select: ChannelValue = None, shapeRendering: ChannelValue = None, sort: ChannelValue = None, stroke: ChannelValue = None, strokeDasharray: ChannelValue = None, strokeDashoffset: ChannelValue = None, strokeLinecap: ChannelValue = None, strokeLinejoin: ChannelValue = None, strokeMiterlimit: ChannelValue = None, strokeOpacity: ChannelValue = None, strokeWidth: ChannelValue = None, target: ChannelValue = None, text: ChannelValue = None, textAnchor: ChannelValue = None, textOverflow: ChannelValue = None, tip: ChannelValue = None, title: ChannelValue = None, x: ChannelValue = None, y: ChannelValue = None, z: ChannelValue = None):
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


class TickX:
    def __init__(self, data: PlotMarkData, mark: str, ariaDescription: ChannelValueSpec = None, ariaHidden: ChannelValueSpec = None, ariaLabel: ChannelValueSpec = None, clip: ChannelValueSpec = None, dx: ChannelValueSpec = None, dy: ChannelValueSpec = None, facet: ChannelValueSpec = None, facetAnchor: ChannelValueSpec = None, fill: ChannelValueSpec = None, fillOpacity: ChannelValueSpec = None, filter: ChannelValueSpec = None, fx: ChannelValueSpec = None, fy: ChannelValueSpec = None, href: ChannelValueSpec = None, imageFilter: ChannelValueSpec = None, inset: ChannelValueSpec = None, insetBottom: ChannelValueSpec = None, insetTop: ChannelValueSpec = None, margin: ChannelValueSpec = None, marginBottom: ChannelValueSpec = None, marginLeft: ChannelValueSpec = None, marginRight: ChannelValueSpec = None, marginTop: ChannelValueSpec = None, marker: ChannelValueSpec = None, markerEnd: ChannelValueSpec = None, markerMid: ChannelValueSpec = None, markerStart: ChannelValueSpec = None, mixBlendMode: ChannelValueSpec = None, opacity: ChannelValueSpec = None, paintOrder: ChannelValueSpec = None, pointerEvents: ChannelValueSpec = None, reverse: ChannelValueSpec = None, select: ChannelValueSpec = None, shapeRendering: ChannelValueSpec = None, sort: ChannelValueSpec = None, stroke: ChannelValueSpec = None, strokeDasharray: ChannelValueSpec = None, strokeDashoffset: ChannelValueSpec = None, strokeLinecap: ChannelValueSpec = None, strokeLinejoin: ChannelValueSpec = None, strokeMiterlimit: ChannelValueSpec = None, strokeOpacity: ChannelValueSpec = None, strokeWidth: ChannelValueSpec = None, target: ChannelValueSpec = None, tip: ChannelValueSpec = None, title: ChannelValueSpec = None, x: ChannelValueSpec = None, y: ChannelValueSpec = None):
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


class TickY:
    def __init__(self, data: PlotMarkData, mark: str, ariaDescription: ChannelValueSpec = None, ariaHidden: ChannelValueSpec = None, ariaLabel: ChannelValueSpec = None, clip: ChannelValueSpec = None, dx: ChannelValueSpec = None, dy: ChannelValueSpec = None, facet: ChannelValueSpec = None, facetAnchor: ChannelValueSpec = None, fill: ChannelValueSpec = None, fillOpacity: ChannelValueSpec = None, filter: ChannelValueSpec = None, fx: ChannelValueSpec = None, fy: ChannelValueSpec = None, href: ChannelValueSpec = None, imageFilter: ChannelValueSpec = None, inset: ChannelValueSpec = None, insetLeft: ChannelValueSpec = None, insetRight: ChannelValueSpec = None, margin: ChannelValueSpec = None, marginBottom: ChannelValueSpec = None, marginLeft: ChannelValueSpec = None, marginRight: ChannelValueSpec = None, marginTop: ChannelValueSpec = None, marker: ChannelValueSpec = None, markerEnd: ChannelValueSpec = None, markerMid: ChannelValueSpec = None, markerStart: ChannelValueSpec = None, mixBlendMode: ChannelValueSpec = None, opacity: ChannelValueSpec = None, paintOrder: ChannelValueSpec = None, pointerEvents: ChannelValueSpec = None, reverse: ChannelValueSpec = None, select: ChannelValueSpec = None, shapeRendering: ChannelValueSpec = None, sort: ChannelValueSpec = None, stroke: ChannelValueSpec = None, strokeDasharray: ChannelValueSpec = None, strokeDashoffset: ChannelValueSpec = None, strokeLinecap: ChannelValueSpec = None, strokeLinejoin: ChannelValueSpec = None, strokeMiterlimit: ChannelValueSpec = None, strokeOpacity: ChannelValueSpec = None, strokeWidth: ChannelValueSpec = None, target: ChannelValueSpec = None, tip: ChannelValueSpec = None, title: ChannelValueSpec = None, x: ChannelValueSpec = None, y: ChannelValueSpec = None):
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


class Vector:
    def __init__(self, data: PlotMarkData, mark: str, anchor: ChannelValueSpec = None, ariaDescription: ChannelValueSpec = None, ariaHidden: ChannelValueSpec = None, ariaLabel: ChannelValueSpec = None, clip: ChannelValueSpec = None, dx: ChannelValueSpec = None, dy: ChannelValueSpec = None, facet: ChannelValueSpec = None, facetAnchor: ChannelValueSpec = None, fill: ChannelValueSpec = None, fillOpacity: ChannelValueSpec = None, filter: ChannelValueSpec = None, frameAnchor: ChannelValueSpec = None, fx: ChannelValueSpec = None, fy: ChannelValueSpec = None, href: ChannelValueSpec = None, imageFilter: ChannelValueSpec = None, length: ChannelValueSpec = None, margin: ChannelValueSpec = None, marginBottom: ChannelValueSpec = None, marginLeft: ChannelValueSpec = None, marginRight: ChannelValueSpec = None, marginTop: ChannelValueSpec = None, mixBlendMode: ChannelValueSpec = None, opacity: ChannelValueSpec = None, paintOrder: ChannelValueSpec = None, pointerEvents: ChannelValueSpec = None, r: ChannelValueSpec = None, reverse: ChannelValueSpec = None, rotate: ChannelValueSpec = None, select: ChannelValueSpec = None, shape: ChannelValueSpec = None, shapeRendering: ChannelValueSpec = None, sort: ChannelValueSpec = None, stroke: ChannelValueSpec = None, strokeDasharray: ChannelValueSpec = None, strokeDashoffset: ChannelValueSpec = None, strokeLinecap: ChannelValueSpec = None, strokeLinejoin: ChannelValueSpec = None, strokeMiterlimit: ChannelValueSpec = None, strokeOpacity: ChannelValueSpec = None, strokeWidth: ChannelValueSpec = None, target: ChannelValueSpec = None, tip: ChannelValueSpec = None, title: ChannelValueSpec = None, x: ChannelValueSpec = None, y: ChannelValueSpec = None):
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


class VectorX:
    def __init__(self, data: PlotMarkData, mark: str, anchor: ChannelValueSpec = None, ariaDescription: ChannelValueSpec = None, ariaHidden: ChannelValueSpec = None, ariaLabel: ChannelValueSpec = None, clip: ChannelValueSpec = None, dx: ChannelValueSpec = None, dy: ChannelValueSpec = None, facet: ChannelValueSpec = None, facetAnchor: ChannelValueSpec = None, fill: ChannelValueSpec = None, fillOpacity: ChannelValueSpec = None, filter: ChannelValueSpec = None, frameAnchor: ChannelValueSpec = None, fx: ChannelValueSpec = None, fy: ChannelValueSpec = None, href: ChannelValueSpec = None, imageFilter: ChannelValueSpec = None, length: ChannelValueSpec = None, margin: ChannelValueSpec = None, marginBottom: ChannelValueSpec = None, marginLeft: ChannelValueSpec = None, marginRight: ChannelValueSpec = None, marginTop: ChannelValueSpec = None, mixBlendMode: ChannelValueSpec = None, opacity: ChannelValueSpec = None, paintOrder: ChannelValueSpec = None, pointerEvents: ChannelValueSpec = None, r: ChannelValueSpec = None, reverse: ChannelValueSpec = None, rotate: ChannelValueSpec = None, select: ChannelValueSpec = None, shape: ChannelValueSpec = None, shapeRendering: ChannelValueSpec = None, sort: ChannelValueSpec = None, stroke: ChannelValueSpec = None, strokeDasharray: ChannelValueSpec = None, strokeDashoffset: ChannelValueSpec = None, strokeLinecap: ChannelValueSpec = None, strokeLinejoin: ChannelValueSpec = None, strokeMiterlimit: ChannelValueSpec = None, strokeOpacity: ChannelValueSpec = None, strokeWidth: ChannelValueSpec = None, target: ChannelValueSpec = None, tip: ChannelValueSpec = None, title: ChannelValueSpec = None, x: ChannelValueSpec = None, y: ChannelValueSpec = None):
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


class VectorY:
    def __init__(self, data: PlotMarkData, mark: str, anchor: ChannelValueSpec = None, ariaDescription: ChannelValueSpec = None, ariaHidden: ChannelValueSpec = None, ariaLabel: ChannelValueSpec = None, clip: ChannelValueSpec = None, dx: ChannelValueSpec = None, dy: ChannelValueSpec = None, facet: ChannelValueSpec = None, facetAnchor: ChannelValueSpec = None, fill: ChannelValueSpec = None, fillOpacity: ChannelValueSpec = None, filter: ChannelValueSpec = None, frameAnchor: ChannelValueSpec = None, fx: ChannelValueSpec = None, fy: ChannelValueSpec = None, href: ChannelValueSpec = None, imageFilter: ChannelValueSpec = None, length: ChannelValueSpec = None, margin: ChannelValueSpec = None, marginBottom: ChannelValueSpec = None, marginLeft: ChannelValueSpec = None, marginRight: ChannelValueSpec = None, marginTop: ChannelValueSpec = None, mixBlendMode: ChannelValueSpec = None, opacity: ChannelValueSpec = None, paintOrder: ChannelValueSpec = None, pointerEvents: ChannelValueSpec = None, r: ChannelValueSpec = None, reverse: ChannelValueSpec = None, rotate: ChannelValueSpec = None, select: ChannelValueSpec = None, shape: ChannelValueSpec = None, shapeRendering: ChannelValueSpec = None, sort: ChannelValueSpec = None, stroke: ChannelValueSpec = None, strokeDasharray: ChannelValueSpec = None, strokeDashoffset: ChannelValueSpec = None, strokeLinecap: ChannelValueSpec = None, strokeLinejoin: ChannelValueSpec = None, strokeMiterlimit: ChannelValueSpec = None, strokeOpacity: ChannelValueSpec = None, strokeWidth: ChannelValueSpec = None, target: ChannelValueSpec = None, tip: ChannelValueSpec = None, title: ChannelValueSpec = None, x: ChannelValueSpec = None, y: ChannelValueSpec = None):
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


class Voronoi:
    def __init__(self, data: PlotMarkData, mark: str, ariaDescription: ChannelValue = None, ariaHidden: ChannelValue = None, ariaLabel: ChannelValue = None, clip: ChannelValue = None, curve: ChannelValue = None, dx: ChannelValue = None, dy: ChannelValue = None, facet: ChannelValue = None, facetAnchor: ChannelValue = None, fill: ChannelValue = None, fillOpacity: ChannelValue = None, filter: ChannelValue = None, fx: ChannelValue = None, fy: ChannelValue = None, href: ChannelValue = None, imageFilter: ChannelValue = None, margin: ChannelValue = None, marginBottom: ChannelValue = None, marginLeft: ChannelValue = None, marginRight: ChannelValue = None, marginTop: ChannelValue = None, marker: ChannelValue = None, markerEnd: ChannelValue = None, markerMid: ChannelValue = None, markerStart: ChannelValue = None, mixBlendMode: ChannelValue = None, opacity: ChannelValue = None, paintOrder: ChannelValue = None, pointerEvents: ChannelValue = None, reverse: ChannelValue = None, select: ChannelValue = None, shapeRendering: ChannelValue = None, sort: ChannelValue = None, stroke: ChannelValue = None, strokeDasharray: ChannelValue = None, strokeDashoffset: ChannelValue = None, strokeLinecap: ChannelValue = None, strokeLinejoin: ChannelValue = None, strokeMiterlimit: ChannelValue = None, strokeOpacity: ChannelValue = None, strokeWidth: ChannelValue = None, target: ChannelValue = None, tension: ChannelValue = None, tip: ChannelValue = None, title: ChannelValue = None, x: ChannelValue = None, y: ChannelValue = None, z: ChannelValue = None):
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


class VoronoiMesh:
    def __init__(self, data: PlotMarkData, mark: str, ariaDescription: ChannelValue = None, ariaHidden: ChannelValue = None, ariaLabel: ChannelValue = None, clip: ChannelValue = None, curve: ChannelValue = None, dx: ChannelValue = None, dy: ChannelValue = None, facet: ChannelValue = None, facetAnchor: ChannelValue = None, fill: ChannelValue = None, fillOpacity: ChannelValue = None, filter: ChannelValue = None, fx: ChannelValue = None, fy: ChannelValue = None, href: ChannelValue = None, imageFilter: ChannelValue = None, margin: ChannelValue = None, marginBottom: ChannelValue = None, marginLeft: ChannelValue = None, marginRight: ChannelValue = None, marginTop: ChannelValue = None, marker: ChannelValue = None, markerEnd: ChannelValue = None, markerMid: ChannelValue = None, markerStart: ChannelValue = None, mixBlendMode: ChannelValue = None, opacity: ChannelValue = None, paintOrder: ChannelValue = None, pointerEvents: ChannelValue = None, reverse: ChannelValue = None, select: ChannelValue = None, shapeRendering: ChannelValue = None, sort: ChannelValue = None, stroke: ChannelValue = None, strokeDasharray: ChannelValue = None, strokeDashoffset: ChannelValue = None, strokeLinecap: ChannelValue = None, strokeLinejoin: ChannelValue = None, strokeMiterlimit: ChannelValue = None, strokeOpacity: ChannelValue = None, strokeWidth: ChannelValue = None, target: ChannelValue = None, tension: ChannelValue = None, tip: ChannelValue = None, title: ChannelValue = None, x: ChannelValue = None, y: ChannelValue = None, z: ChannelValue = None):
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


class BarX:
    def __init__(self, data: PlotMarkData, mark: str, ariaDescription: ChannelValue = None, ariaHidden: ChannelValue = None, ariaLabel: ChannelValue = None, clip: ChannelValue = None, dx: ChannelValue = None, dy: ChannelValue = None, facet: ChannelValue = None, facetAnchor: ChannelValue = None, fill: ChannelValue = None, fillOpacity: ChannelValue = None, filter: ChannelValue = None, fx: ChannelValue = None, fy: ChannelValue = None, href: ChannelValue = None, imageFilter: ChannelValue = None, inset: ChannelValue = None, insetBottom: ChannelValue = None, insetLeft: ChannelValue = None, insetRight: ChannelValue = None, insetTop: ChannelValue = None, interval: ChannelValue = None, margin: ChannelValue = None, marginBottom: ChannelValue = None, marginLeft: ChannelValue = None, marginRight: ChannelValue = None, marginTop: ChannelValue = None, mixBlendMode: ChannelValue = None, offset: ChannelValue = None, opacity: ChannelValue = None, order: ChannelValue = None, paintOrder: ChannelValue = None, pointerEvents: ChannelValue = None, reverse: ChannelValue = None, rx: ChannelValue = None, ry: ChannelValue = None, select: ChannelValue = None, shapeRendering: ChannelValue = None, sort: ChannelValue = None, stroke: ChannelValue = None, strokeDasharray: ChannelValue = None, strokeDashoffset: ChannelValue = None, strokeLinecap: ChannelValue = None, strokeLinejoin: ChannelValue = None, strokeMiterlimit: ChannelValue = None, strokeOpacity: ChannelValue = None, strokeWidth: ChannelValue = None, target: ChannelValue = None, tip: ChannelValue = None, title: ChannelValue = None, x: ChannelValue = None, x1: ChannelValue = None, x2: ChannelValue = None, y: ChannelValue = None, z: ChannelValue = None):
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


class BarY:
    def __init__(self, data: PlotMarkData, mark: str, ariaDescription: ChannelValue = None, ariaHidden: ChannelValue = None, ariaLabel: ChannelValue = None, clip: ChannelValue = None, dx: ChannelValue = None, dy: ChannelValue = None, facet: ChannelValue = None, facetAnchor: ChannelValue = None, fill: ChannelValue = None, fillOpacity: ChannelValue = None, filter: ChannelValue = None, fx: ChannelValue = None, fy: ChannelValue = None, href: ChannelValue = None, imageFilter: ChannelValue = None, inset: ChannelValue = None, insetBottom: ChannelValue = None, insetLeft: ChannelValue = None, insetRight: ChannelValue = None, insetTop: ChannelValue = None, interval: ChannelValue = None, margin: ChannelValue = None, marginBottom: ChannelValue = None, marginLeft: ChannelValue = None, marginRight: ChannelValue = None, marginTop: ChannelValue = None, mixBlendMode: ChannelValue = None, offset: ChannelValue = None, opacity: ChannelValue = None, order: ChannelValue = None, paintOrder: ChannelValue = None, pointerEvents: ChannelValue = None, reverse: ChannelValue = None, rx: ChannelValue = None, ry: ChannelValue = None, select: ChannelValue = None, shapeRendering: ChannelValue = None, sort: ChannelValue = None, stroke: ChannelValue = None, strokeDasharray: ChannelValue = None, strokeDashoffset: ChannelValue = None, strokeLinecap: ChannelValue = None, strokeLinejoin: ChannelValue = None, strokeMiterlimit: ChannelValue = None, strokeOpacity: ChannelValue = None, strokeWidth: ChannelValue = None, target: ChannelValue = None, tip: ChannelValue = None, title: ChannelValue = None, x: ChannelValue = None, y: ChannelValue = None, y1: ChannelValue = None, y2: ChannelValue = None, z: ChannelValue = None):
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


class DotX:
    def __init__(self, data: PlotMarkData, mark: str, ariaDescription: ChannelValue = None, ariaHidden: ChannelValue = None, ariaLabel: ChannelValue = None, clip: ChannelValue = None, dx: ChannelValue = None, dy: ChannelValue = None, facet: ChannelValue = None, facetAnchor: ChannelValue = None, fill: ChannelValue = None, fillOpacity: ChannelValue = None, filter: ChannelValue = None, frameAnchor: ChannelValue = None, fx: ChannelValue = None, fy: ChannelValue = None, href: ChannelValue = None, imageFilter: ChannelValue = None, interval: ChannelValue = None, margin: ChannelValue = None, marginBottom: ChannelValue = None, marginLeft: ChannelValue = None, marginRight: ChannelValue = None, marginTop: ChannelValue = None, mixBlendMode: ChannelValue = None, opacity: ChannelValue = None, paintOrder: ChannelValue = None, pointerEvents: ChannelValue = None, r: ChannelValue = None, reverse: ChannelValue = None, rotate: ChannelValue = None, select: ChannelValue = None, shapeRendering: ChannelValue = None, sort: ChannelValue = None, stroke: ChannelValue = None, strokeDasharray: ChannelValue = None, strokeDashoffset: ChannelValue = None, strokeLinecap: ChannelValue = None, strokeLinejoin: ChannelValue = None, strokeMiterlimit: ChannelValue = None, strokeOpacity: ChannelValue = None, strokeWidth: ChannelValue = None, symbol: ChannelValue = None, target: ChannelValue = None, tip: ChannelValue = None, title: ChannelValue = None, x: ChannelValue = None, y: ChannelValue = None, z: ChannelValue = None):
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


class DotY:
    def __init__(self, data: PlotMarkData, mark: str, ariaDescription: ChannelValue = None, ariaHidden: ChannelValue = None, ariaLabel: ChannelValue = None, clip: ChannelValue = None, dx: ChannelValue = None, dy: ChannelValue = None, facet: ChannelValue = None, facetAnchor: ChannelValue = None, fill: ChannelValue = None, fillOpacity: ChannelValue = None, filter: ChannelValue = None, frameAnchor: ChannelValue = None, fx: ChannelValue = None, fy: ChannelValue = None, href: ChannelValue = None, imageFilter: ChannelValue = None, interval: ChannelValue = None, margin: ChannelValue = None, marginBottom: ChannelValue = None, marginLeft: ChannelValue = None, marginRight: ChannelValue = None, marginTop: ChannelValue = None, mixBlendMode: ChannelValue = None, opacity: ChannelValue = None, paintOrder: ChannelValue = None, pointerEvents: ChannelValue = None, r: ChannelValue = None, reverse: ChannelValue = None, rotate: ChannelValue = None, select: ChannelValue = None, shapeRendering: ChannelValue = None, sort: ChannelValue = None, stroke: ChannelValue = None, strokeDasharray: ChannelValue = None, strokeDashoffset: ChannelValue = None, strokeLinecap: ChannelValue = None, strokeLinejoin: ChannelValue = None, strokeMiterlimit: ChannelValue = None, strokeOpacity: ChannelValue = None, strokeWidth: ChannelValue = None, symbol: ChannelValue = None, target: ChannelValue = None, tip: ChannelValue = None, title: ChannelValue = None, x: ChannelValue = None, y: ChannelValue = None, z: ChannelValue = None):
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


class GridFx:
    def __init__(self, mark: str, anchor: ChannelValueSpec = None, ariaDescription: ChannelValueSpec = None, ariaHidden: ChannelValueSpec = None, ariaLabel: ChannelValueSpec = None, clip: ChannelValueSpec = None, color: ChannelValueSpec = None, dx: ChannelValueSpec = None, dy: ChannelValueSpec = None, facet: ChannelValueSpec = None, facetAnchor: ChannelValueSpec = None, fill: ChannelValueSpec = None, fillOpacity: ChannelValueSpec = None, filter: ChannelValueSpec = None, fx: ChannelValueSpec = None, fy: ChannelValueSpec = None, href: ChannelValueSpec = None, imageFilter: ChannelValueSpec = None, inset: ChannelValueSpec = None, insetBottom: ChannelValueSpec = None, insetTop: ChannelValueSpec = None, interval: ChannelValueSpec = None, margin: ChannelValueSpec = None, marginBottom: ChannelValueSpec = None, marginLeft: ChannelValueSpec = None, marginRight: ChannelValueSpec = None, marginTop: ChannelValueSpec = None, marker: ChannelValueSpec = None, markerEnd: ChannelValueSpec = None, markerMid: ChannelValueSpec = None, markerStart: ChannelValueSpec = None, mixBlendMode: ChannelValueSpec = None, opacity: ChannelValueSpec = None, paintOrder: ChannelValueSpec = None, pointerEvents: ChannelValueSpec = None, reverse: ChannelValueSpec = None, select: ChannelValueSpec = None, shapeRendering: ChannelValueSpec = None, sort: ChannelValueSpec = None, stroke: ChannelValueSpec = None, strokeDasharray: ChannelValueSpec = None, strokeDashoffset: ChannelValueSpec = None, strokeLinecap: ChannelValueSpec = None, strokeLinejoin: ChannelValueSpec = None, strokeMiterlimit: ChannelValueSpec = None, strokeOpacity: ChannelValueSpec = None, strokeWidth: ChannelValueSpec = None, target: ChannelValueSpec = None, tickSpacing: ChannelValueSpec = None, ticks: ChannelValueSpec = None, tip: ChannelValueSpec = None, title: ChannelValueSpec = None, x: ChannelValueSpec = None, y: ChannelValueSpec = None, y1: ChannelValueSpec = None, y2: ChannelValueSpec = None):
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


class GridFy:
    def __init__(self, mark: str, anchor: ChannelValueSpec = None, ariaDescription: ChannelValueSpec = None, ariaHidden: ChannelValueSpec = None, ariaLabel: ChannelValueSpec = None, clip: ChannelValueSpec = None, color: ChannelValueSpec = None, dx: ChannelValueSpec = None, dy: ChannelValueSpec = None, facet: ChannelValueSpec = None, facetAnchor: ChannelValueSpec = None, fill: ChannelValueSpec = None, fillOpacity: ChannelValueSpec = None, filter: ChannelValueSpec = None, fx: ChannelValueSpec = None, fy: ChannelValueSpec = None, href: ChannelValueSpec = None, imageFilter: ChannelValueSpec = None, inset: ChannelValueSpec = None, insetLeft: ChannelValueSpec = None, insetRight: ChannelValueSpec = None, interval: ChannelValueSpec = None, margin: ChannelValueSpec = None, marginBottom: ChannelValueSpec = None, marginLeft: ChannelValueSpec = None, marginRight: ChannelValueSpec = None, marginTop: ChannelValueSpec = None, marker: ChannelValueSpec = None, markerEnd: ChannelValueSpec = None, markerMid: ChannelValueSpec = None, markerStart: ChannelValueSpec = None, mixBlendMode: ChannelValueSpec = None, opacity: ChannelValueSpec = None, paintOrder: ChannelValueSpec = None, pointerEvents: ChannelValueSpec = None, reverse: ChannelValueSpec = None, select: ChannelValueSpec = None, shapeRendering: ChannelValueSpec = None, sort: ChannelValueSpec = None, stroke: ChannelValueSpec = None, strokeDasharray: ChannelValueSpec = None, strokeDashoffset: ChannelValueSpec = None, strokeLinecap: ChannelValueSpec = None, strokeLinejoin: ChannelValueSpec = None, strokeMiterlimit: ChannelValueSpec = None, strokeOpacity: ChannelValueSpec = None, strokeWidth: ChannelValueSpec = None, target: ChannelValueSpec = None, tickSpacing: ChannelValueSpec = None, ticks: ChannelValueSpec = None, tip: ChannelValueSpec = None, title: ChannelValueSpec = None, x: ChannelValueSpec = None, x1: ChannelValueSpec = None, x2: ChannelValueSpec = None, y: ChannelValueSpec = None):
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


class GridX:
    def __init__(self, mark: str, anchor: ChannelValueSpec = None, ariaDescription: ChannelValueSpec = None, ariaHidden: ChannelValueSpec = None, ariaLabel: ChannelValueSpec = None, clip: ChannelValueSpec = None, color: ChannelValueSpec = None, dx: ChannelValueSpec = None, dy: ChannelValueSpec = None, facet: ChannelValueSpec = None, facetAnchor: ChannelValueSpec = None, fill: ChannelValueSpec = None, fillOpacity: ChannelValueSpec = None, filter: ChannelValueSpec = None, fx: ChannelValueSpec = None, fy: ChannelValueSpec = None, href: ChannelValueSpec = None, imageFilter: ChannelValueSpec = None, inset: ChannelValueSpec = None, insetBottom: ChannelValueSpec = None, insetTop: ChannelValueSpec = None, interval: ChannelValueSpec = None, margin: ChannelValueSpec = None, marginBottom: ChannelValueSpec = None, marginLeft: ChannelValueSpec = None, marginRight: ChannelValueSpec = None, marginTop: ChannelValueSpec = None, marker: ChannelValueSpec = None, markerEnd: ChannelValueSpec = None, markerMid: ChannelValueSpec = None, markerStart: ChannelValueSpec = None, mixBlendMode: ChannelValueSpec = None, opacity: ChannelValueSpec = None, paintOrder: ChannelValueSpec = None, pointerEvents: ChannelValueSpec = None, reverse: ChannelValueSpec = None, select: ChannelValueSpec = None, shapeRendering: ChannelValueSpec = None, sort: ChannelValueSpec = None, stroke: ChannelValueSpec = None, strokeDasharray: ChannelValueSpec = None, strokeDashoffset: ChannelValueSpec = None, strokeLinecap: ChannelValueSpec = None, strokeLinejoin: ChannelValueSpec = None, strokeMiterlimit: ChannelValueSpec = None, strokeOpacity: ChannelValueSpec = None, strokeWidth: ChannelValueSpec = None, target: ChannelValueSpec = None, tickSpacing: ChannelValueSpec = None, ticks: ChannelValueSpec = None, tip: ChannelValueSpec = None, title: ChannelValueSpec = None, x: ChannelValueSpec = None, y: ChannelValueSpec = None, y1: ChannelValueSpec = None, y2: ChannelValueSpec = None):
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


class GridY:
    def __init__(self, mark: str, anchor: ChannelValueSpec = None, ariaDescription: ChannelValueSpec = None, ariaHidden: ChannelValueSpec = None, ariaLabel: ChannelValueSpec = None, clip: ChannelValueSpec = None, color: ChannelValueSpec = None, dx: ChannelValueSpec = None, dy: ChannelValueSpec = None, facet: ChannelValueSpec = None, facetAnchor: ChannelValueSpec = None, fill: ChannelValueSpec = None, fillOpacity: ChannelValueSpec = None, filter: ChannelValueSpec = None, fx: ChannelValueSpec = None, fy: ChannelValueSpec = None, href: ChannelValueSpec = None, imageFilter: ChannelValueSpec = None, inset: ChannelValueSpec = None, insetLeft: ChannelValueSpec = None, insetRight: ChannelValueSpec = None, interval: ChannelValueSpec = None, margin: ChannelValueSpec = None, marginBottom: ChannelValueSpec = None, marginLeft: ChannelValueSpec = None, marginRight: ChannelValueSpec = None, marginTop: ChannelValueSpec = None, marker: ChannelValueSpec = None, markerEnd: ChannelValueSpec = None, markerMid: ChannelValueSpec = None, markerStart: ChannelValueSpec = None, mixBlendMode: ChannelValueSpec = None, opacity: ChannelValueSpec = None, paintOrder: ChannelValueSpec = None, pointerEvents: ChannelValueSpec = None, reverse: ChannelValueSpec = None, select: ChannelValueSpec = None, shapeRendering: ChannelValueSpec = None, sort: ChannelValueSpec = None, stroke: ChannelValueSpec = None, strokeDasharray: ChannelValueSpec = None, strokeDashoffset: ChannelValueSpec = None, strokeLinecap: ChannelValueSpec = None, strokeLinejoin: ChannelValueSpec = None, strokeMiterlimit: ChannelValueSpec = None, strokeOpacity: ChannelValueSpec = None, strokeWidth: ChannelValueSpec = None, target: ChannelValueSpec = None, tickSpacing: ChannelValueSpec = None, ticks: ChannelValueSpec = None, tip: ChannelValueSpec = None, title: ChannelValueSpec = None, x: ChannelValueSpec = None, x1: ChannelValueSpec = None, x2: ChannelValueSpec = None, y: ChannelValueSpec = None):
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


class Rect:
    def __init__(self, data: PlotMarkData, mark: str, ariaDescription: ChannelValue = None, ariaHidden: ChannelValue = None, ariaLabel: ChannelValue = None, clip: ChannelValue = None, dx: ChannelValue = None, dy: ChannelValue = None, facet: ChannelValue = None, facetAnchor: ChannelValue = None, fill: ChannelValue = None, fillOpacity: ChannelValue = None, filter: ChannelValue = None, fx: ChannelValue = None, fy: ChannelValue = None, href: ChannelValue = None, imageFilter: ChannelValue = None, inset: ChannelValue = None, insetBottom: ChannelValue = None, insetLeft: ChannelValue = None, insetRight: ChannelValue = None, insetTop: ChannelValue = None, interval: ChannelValue = None, margin: ChannelValue = None, marginBottom: ChannelValue = None, marginLeft: ChannelValue = None, marginRight: ChannelValue = None, marginTop: ChannelValue = None, mixBlendMode: ChannelValue = None, offset: ChannelValue = None, opacity: ChannelValue = None, order: ChannelValue = None, paintOrder: ChannelValue = None, pointerEvents: ChannelValue = None, reverse: ChannelValue = None, rx: ChannelValue = None, ry: ChannelValue = None, select: ChannelValue = None, shapeRendering: ChannelValue = None, sort: ChannelValue = None, stroke: ChannelValue = None, strokeDasharray: ChannelValue = None, strokeDashoffset: ChannelValue = None, strokeLinecap: ChannelValue = None, strokeLinejoin: ChannelValue = None, strokeMiterlimit: ChannelValue = None, strokeOpacity: ChannelValue = None, strokeWidth: ChannelValue = None, target: ChannelValue = None, tip: ChannelValue = None, title: ChannelValue = None, x: ChannelValue = None, x1: ChannelValue = None, x2: ChannelValue = None, y: ChannelValue = None, y1: ChannelValue = None, y2: ChannelValue = None, z: ChannelValue = None):
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


class RectX:
    def __init__(self, data: PlotMarkData, mark: str, ariaDescription: ChannelValue = None, ariaHidden: ChannelValue = None, ariaLabel: ChannelValue = None, clip: ChannelValue = None, dx: ChannelValue = None, dy: ChannelValue = None, facet: ChannelValue = None, facetAnchor: ChannelValue = None, fill: ChannelValue = None, fillOpacity: ChannelValue = None, filter: ChannelValue = None, fx: ChannelValue = None, fy: ChannelValue = None, href: ChannelValue = None, imageFilter: ChannelValue = None, inset: ChannelValue = None, insetBottom: ChannelValue = None, insetLeft: ChannelValue = None, insetRight: ChannelValue = None, insetTop: ChannelValue = None, interval: ChannelValue = None, margin: ChannelValue = None, marginBottom: ChannelValue = None, marginLeft: ChannelValue = None, marginRight: ChannelValue = None, marginTop: ChannelValue = None, mixBlendMode: ChannelValue = None, offset: ChannelValue = None, opacity: ChannelValue = None, order: ChannelValue = None, paintOrder: ChannelValue = None, pointerEvents: ChannelValue = None, reverse: ChannelValue = None, rx: ChannelValue = None, ry: ChannelValue = None, select: ChannelValue = None, shapeRendering: ChannelValue = None, sort: ChannelValue = None, stroke: ChannelValue = None, strokeDasharray: ChannelValue = None, strokeDashoffset: ChannelValue = None, strokeLinecap: ChannelValue = None, strokeLinejoin: ChannelValue = None, strokeMiterlimit: ChannelValue = None, strokeOpacity: ChannelValue = None, strokeWidth: ChannelValue = None, target: ChannelValue = None, tip: ChannelValue = None, title: ChannelValue = None, x: ChannelValue = None, x1: ChannelValue = None, x2: ChannelValue = None, y: ChannelValue = None, y1: ChannelValue = None, y2: ChannelValue = None, z: ChannelValue = None):
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


class RectY:
    def __init__(self, data: PlotMarkData, mark: str, ariaDescription: ChannelValue = None, ariaHidden: ChannelValue = None, ariaLabel: ChannelValue = None, clip: ChannelValue = None, dx: ChannelValue = None, dy: ChannelValue = None, facet: ChannelValue = None, facetAnchor: ChannelValue = None, fill: ChannelValue = None, fillOpacity: ChannelValue = None, filter: ChannelValue = None, fx: ChannelValue = None, fy: ChannelValue = None, href: ChannelValue = None, imageFilter: ChannelValue = None, inset: ChannelValue = None, insetBottom: ChannelValue = None, insetLeft: ChannelValue = None, insetRight: ChannelValue = None, insetTop: ChannelValue = None, interval: ChannelValue = None, margin: ChannelValue = None, marginBottom: ChannelValue = None, marginLeft: ChannelValue = None, marginRight: ChannelValue = None, marginTop: ChannelValue = None, mixBlendMode: ChannelValue = None, offset: ChannelValue = None, opacity: ChannelValue = None, order: ChannelValue = None, paintOrder: ChannelValue = None, pointerEvents: ChannelValue = None, reverse: ChannelValue = None, rx: ChannelValue = None, ry: ChannelValue = None, select: ChannelValue = None, shapeRendering: ChannelValue = None, sort: ChannelValue = None, stroke: ChannelValue = None, strokeDasharray: ChannelValue = None, strokeDashoffset: ChannelValue = None, strokeLinecap: ChannelValue = None, strokeLinejoin: ChannelValue = None, strokeMiterlimit: ChannelValue = None, strokeOpacity: ChannelValue = None, strokeWidth: ChannelValue = None, target: ChannelValue = None, tip: ChannelValue = None, title: ChannelValue = None, x: ChannelValue = None, x1: ChannelValue = None, x2: ChannelValue = None, y: ChannelValue = None, y1: ChannelValue = None, y2: ChannelValue = None, z: ChannelValue = None):
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


class RuleX:
    def __init__(self, mark: str, ariaDescription: ChannelValueSpec = None, ariaHidden: ChannelValueSpec = None, ariaLabel: ChannelValueSpec = None, clip: ChannelValueSpec = None, data: ChannelValueSpec = None, dx: ChannelValueSpec = None, dy: ChannelValueSpec = None, facet: ChannelValueSpec = None, facetAnchor: ChannelValueSpec = None, fill: ChannelValueSpec = None, fillOpacity: ChannelValueSpec = None, filter: ChannelValueSpec = None, fx: ChannelValueSpec = None, fy: ChannelValueSpec = None, href: ChannelValueSpec = None, imageFilter: ChannelValueSpec = None, inset: ChannelValueSpec = None, insetBottom: ChannelValueSpec = None, insetTop: ChannelValueSpec = None, interval: ChannelValueSpec = None, margin: ChannelValueSpec = None, marginBottom: ChannelValueSpec = None, marginLeft: ChannelValueSpec = None, marginRight: ChannelValueSpec = None, marginTop: ChannelValueSpec = None, marker: ChannelValueSpec = None, markerEnd: ChannelValueSpec = None, markerMid: ChannelValueSpec = None, markerStart: ChannelValueSpec = None, mixBlendMode: ChannelValueSpec = None, opacity: ChannelValueSpec = None, paintOrder: ChannelValueSpec = None, pointerEvents: ChannelValueSpec = None, reverse: ChannelValueSpec = None, select: ChannelValueSpec = None, shapeRendering: ChannelValueSpec = None, sort: ChannelValueSpec = None, stroke: ChannelValueSpec = None, strokeDasharray: ChannelValueSpec = None, strokeDashoffset: ChannelValueSpec = None, strokeLinecap: ChannelValueSpec = None, strokeLinejoin: ChannelValueSpec = None, strokeMiterlimit: ChannelValueSpec = None, strokeOpacity: ChannelValueSpec = None, strokeWidth: ChannelValueSpec = None, target: ChannelValueSpec = None, tip: ChannelValueSpec = None, title: ChannelValueSpec = None, x: ChannelValueSpec = None, y: ChannelValueSpec = None, y1: ChannelValueSpec = None, y2: ChannelValueSpec = None):
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


class RuleY:
    def __init__(self, mark: str, ariaDescription: ChannelValueSpec = None, ariaHidden: ChannelValueSpec = None, ariaLabel: ChannelValueSpec = None, clip: ChannelValueSpec = None, data: ChannelValueSpec = None, dx: ChannelValueSpec = None, dy: ChannelValueSpec = None, facet: ChannelValueSpec = None, facetAnchor: ChannelValueSpec = None, fill: ChannelValueSpec = None, fillOpacity: ChannelValueSpec = None, filter: ChannelValueSpec = None, fx: ChannelValueSpec = None, fy: ChannelValueSpec = None, href: ChannelValueSpec = None, imageFilter: ChannelValueSpec = None, inset: ChannelValueSpec = None, insetBottom: ChannelValueSpec = None, insetTop: ChannelValueSpec = None, interval: ChannelValueSpec = None, margin: ChannelValueSpec = None, marginBottom: ChannelValueSpec = None, marginLeft: ChannelValueSpec = None, marginRight: ChannelValueSpec = None, marginTop: ChannelValueSpec = None, marker: ChannelValueSpec = None, markerEnd: ChannelValueSpec = None, markerMid: ChannelValueSpec = None, markerStart: ChannelValueSpec = None, mixBlendMode: ChannelValueSpec = None, opacity: ChannelValueSpec = None, paintOrder: ChannelValueSpec = None, pointerEvents: ChannelValueSpec = None, reverse: ChannelValueSpec = None, select: ChannelValueSpec = None, shapeRendering: ChannelValueSpec = None, sort: ChannelValueSpec = None, stroke: ChannelValueSpec = None, strokeDasharray: ChannelValueSpec = None, strokeDashoffset: ChannelValueSpec = None, strokeLinecap: ChannelValueSpec = None, strokeLinejoin: ChannelValueSpec = None, strokeMiterlimit: ChannelValueSpec = None, strokeOpacity: ChannelValueSpec = None, strokeWidth: ChannelValueSpec = None, target: ChannelValueSpec = None, tip: ChannelValueSpec = None, title: ChannelValueSpec = None, x: ChannelValueSpec = None, y: ChannelValueSpec = None, y1: ChannelValueSpec = None, y2: ChannelValueSpec = None):
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


class TextX:
    def __init__(self, mark: str, ariaDescription: ChannelValue = None, ariaHidden: ChannelValue = None, ariaLabel: ChannelValue = None, clip: ChannelValue = None, data: ChannelValue = None, dx: ChannelValue = None, dy: ChannelValue = None, facet: ChannelValue = None, facetAnchor: ChannelValue = None, fill: ChannelValue = None, fillOpacity: ChannelValue = None, filter: ChannelValue = None, fontFamily: ChannelValue = None, fontSize: ChannelValue = None, fontStyle: ChannelValue = None, fontVariant: ChannelValue = None, fontWeight: ChannelValue = None, frameAnchor: ChannelValue = None, fx: ChannelValue = None, fy: ChannelValue = None, href: ChannelValue = None, imageFilter: ChannelValue = None, interval: ChannelValue = None, lineAnchor: ChannelValue = None, lineHeight: ChannelValue = None, lineWidth: ChannelValue = None, margin: ChannelValue = None, marginBottom: ChannelValue = None, marginLeft: ChannelValue = None, marginRight: ChannelValue = None, marginTop: ChannelValue = None, mixBlendMode: ChannelValue = None, monospace: ChannelValue = None, opacity: ChannelValue = None, paintOrder: ChannelValue = None, pointerEvents: ChannelValue = None, reverse: ChannelValue = None, rotate: ChannelValue = None, select: ChannelValue = None, shapeRendering: ChannelValue = None, sort: ChannelValue = None, stroke: ChannelValue = None, strokeDasharray: ChannelValue = None, strokeDashoffset: ChannelValue = None, strokeLinecap: ChannelValue = None, strokeLinejoin: ChannelValue = None, strokeMiterlimit: ChannelValue = None, strokeOpacity: ChannelValue = None, strokeWidth: ChannelValue = None, target: ChannelValue = None, text: ChannelValue = None, textAnchor: ChannelValue = None, textOverflow: ChannelValue = None, tip: ChannelValue = None, title: ChannelValue = None, x: ChannelValue = None, y: ChannelValue = None, z: ChannelValue = None):
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


class Bin:
    def __init__(self, bin: Union[, 'Any', 'Any'], interval: Any = None, minstep: Any = None, nice: Any = None, offset: Any = None, step: Any = None, steps: Any = None):
        self.bin = bin
        self.interval = interval
        self.minstep = minstep
        self.nice = nice
        self.offset = offset
        self.step = step
        self.steps = steps


class ChannelDomainSort:
    def __init__(self, color: ChannelDomainValueSpec = None, fx: ChannelDomainValueSpec = None, fy: ChannelDomainValueSpec = None, length: ChannelDomainValueSpec = None, limit: ChannelDomainValueSpec = None, opacity: ChannelDomainValueSpec = None, order: ChannelDomainValueSpec = None, r: ChannelDomainValueSpec = None, reduce: ChannelDomainValueSpec = None, reverse: ChannelDomainValueSpec = None, symbol: ChannelDomainValueSpec = None, x: ChannelDomainValueSpec = None, y: ChannelDomainValueSpec = None):
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


class HConcat:
    def __init__(self, hconcat: Any):
        self.hconcat = hconcat


class VConcat:
    def __init__(self, vconcat: Any):
        self.vconcat = vconcat



class Curve:
    pass  # This is a reference to CurveName


class Data:
    def __init__(self):
        pass


class Highlight:
    def __init__(self, by: ParamRef, select: str, fill: Any = None, fillOpacity: Any = None, opacity: Any = None, stroke: Any = None, strokeOpacity: Any = None):
        self.by = by
        self.fill = fill
        self.fillOpacity = fillOpacity
        self.opacity = opacity
        self.select = select
        self.stroke = stroke
        self.strokeOpacity = strokeOpacity


class IntervalX:
    def __init__(self, select: str, brush: ParamRef = None, field: ParamRef = None, peers: ParamRef = None, pixelSize: ParamRef = None, as_: ParamRef = None):
        self.brush = brush
        self.field = field
        self.peers = peers
        self.pixelSize = pixelSize
        self.select = select
        self.as_ = as_


class IntervalXY:
    def __init__(self, select: str, brush: ParamRef = None, peers: ParamRef = None, pixelSize: ParamRef = None, xfield: ParamRef = None, yfield: ParamRef = None, as_: ParamRef = None):
        self.brush = brush
        self.peers = peers
        self.pixelSize = pixelSize
        self.select = select
        self.xfield = xfield
        self.yfield = yfield
        self.as_ = as_


class IntervalY:
    def __init__(self, select: str, brush: ParamRef = None, field: ParamRef = None, peers: ParamRef = None, pixelSize: ParamRef = None, as_: ParamRef = None):
        self.brush = brush
        self.field = field
        self.peers = peers
        self.pixelSize = pixelSize
        self.select = select
        self.as_ = as_


class Legend:
    def __init__(self, legend: str, columns: str = None, field: str = None, height: str = None, label: str = None, marginBottom: str = None, marginLeft: str = None, marginRight: str = None, marginTop: str = None, tickSize: str = None, width: str = None, as_: str = None, for_: str = None):
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
        self.as_ = as_
        self.for_ = for_


class Menu:
    def __init__(self, input: str, column: str = None, field: str = None, filterBy: str = None, label: str = None, options: str = None, value: str = None, as_: str = None, from_: str = None):
        self.column = column
        self.field = field
        self.filterBy = filterBy
        self.input = input
        self.label = label
        self.options = options
        self.value = value
        self.as_ = as_
        self.from_ = from_


class NearestX:
    def __init__(self, select: str, channels: ParamRef = None, fields: ParamRef = None, maxRadius: ParamRef = None, as_: ParamRef = None):
        self.channels = channels
        self.fields = fields
        self.maxRadius = maxRadius
        self.select = select
        self.as_ = as_


class NearestY:
    def __init__(self, select: str, channels: ParamRef = None, fields: ParamRef = None, maxRadius: ParamRef = None, as_: ParamRef = None):
        self.channels = channels
        self.fields = fields
        self.maxRadius = maxRadius
        self.select = select
        self.as_ = as_


class Pan:
    def __init__(self, select: str, x: str = None, xfield: str = None, y: str = None, yfield: str = None):
        self.select = select
        self.x = x
        self.xfield = xfield
        self.y = y
        self.yfield = yfield


class PanX:
    def __init__(self, select: str, x: str = None, xfield: str = None, y: str = None, yfield: str = None):
        self.select = select
        self.x = x
        self.xfield = xfield
        self.y = y
        self.yfield = yfield


class PanY:
    def __init__(self, select: str, x: str = None, xfield: str = None, y: str = None, yfield: str = None):
        self.select = select
        self.x = x
        self.xfield = xfield
        self.y = y
        self.yfield = yfield


class PanZoom:
    def __init__(self, select: str, x: str = None, xfield: str = None, y: str = None, yfield: str = None):
        self.select = select
        self.x = x
        self.xfield = xfield
        self.y = y
        self.yfield = yfield


class PanZoomX:
    def __init__(self, select: str, x: str = None, xfield: str = None, y: str = None, yfield: str = None):
        self.select = select
        self.x = x
        self.xfield = xfield
        self.y = y
        self.yfield = yfield


class PanZoomY:
    def __init__(self, select: str, x: str = None, xfield: str = None, y: str = None, yfield: str = None):
        self.select = select
        self.x = x
        self.xfield = xfield
        self.y = y
        self.yfield = yfield


class PlotFrom:
    def __init__(self, filterBy: str = None, optimize: str = None, from_: str = None):
        self.filterBy = filterBy
        self.optimize = optimize
        self.from_ = from_


class PlotLegend:
    def __init__(self, legend: str, columns: ParamRef = None, field: ParamRef = None, height: ParamRef = None, label: ParamRef = None, marginBottom: ParamRef = None, marginLeft: ParamRef = None, marginRight: ParamRef = None, marginTop: ParamRef = None, tickSize: ParamRef = None, width: ParamRef = None, as_: ParamRef = None):
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
        self.as_ = as_


class Search:
    def __init__(self, input: str, column: str = None, field: str = None, filterBy: str = None, label: str = None, type: str = None, as_: str = None, from_: str = None):
        self.column = column
        self.field = field
        self.filterBy = filterBy
        self.input = input
        self.label = label
        self.type = type
        self.as_ = as_
        self.from_ = from_


class Slider:
    def __init__(self, input: str, column: str = None, field: str = None, filterBy: str = None, label: str = None, max: str = None, min: str = None, select: str = None, step: str = None, value: str = None, width: str = None, as_: str = None, from_: str = None):
        self.column = column
        self.field = field
        self.filterBy = filterBy
        self.input = input
        self.label = label
        self.max = max
        self.min = min
        self.select = select
        self.step = step
        self.value = value
        self.width = width
        self.as_ = as_
        self.from_ = from_


class Table:
    def __init__(self, input: str, align: str = None, columns: str = None, filterBy: str = None, height: str = None, maxWidth: str = None, rowBatch: str = None, width: str = None, as_: str = None, from_: str = None):
        self.align = align
        self.columns = columns
        self.filterBy = filterBy
        self.height = height
        self.input = input
        self.maxWidth = maxWidth
        self.rowBatch = rowBatch
        self.width = width
        self.as_ = as_
        self.from_ = from_


class Toggle:
    def __init__(self, channels: Any, select: str, peers: ParamRef = None, as_: ParamRef = None):
        self.channels = channels
        self.peers = peers
        self.select = select
        self.as_ = as_


class ToggleColor:
    def __init__(self, select: str, peers: ParamRef = None, as_: ParamRef = None):
        self.peers = peers
        self.select = select
        self.as_ = as_


class ToggleX:
    def __init__(self, select: str, peers: ParamRef = None, as_: ParamRef = None):
        self.peers = peers
        self.select = select
        self.as_ = as_


class ToggleY:
    def __init__(self, select: str, peers: ParamRef = None, as_: ParamRef = None):
        self.peers = peers
        self.select = select
        self.as_ = as_



class Interval:
    pass  # This is a reference to LiteralTimeInterval


class Param:
    def __init__(self, value: ParamValue, select: ParamValue = None):
        self.select = select
        self.value = value


class Params:
    def __init__(self):
        pass



class StackOffset:
    pass  # This is a reference to StackOffsetName



class VectorShape:
    pass  # This is a reference to VectorShapeName


class TextY:
    def __init__(self, mark: str, ariaDescription: ChannelValue = None, ariaHidden: ChannelValue = None, ariaLabel: ChannelValue = None, clip: ChannelValue = None, data: ChannelValue = None, dx: ChannelValue = None, dy: ChannelValue = None, facet: ChannelValue = None, facetAnchor: ChannelValue = None, fill: ChannelValue = None, fillOpacity: ChannelValue = None, filter: ChannelValue = None, fontFamily: ChannelValue = None, fontSize: ChannelValue = None, fontStyle: ChannelValue = None, fontVariant: ChannelValue = None, fontWeight: ChannelValue = None, frameAnchor: ChannelValue = None, fx: ChannelValue = None, fy: ChannelValue = None, href: ChannelValue = None, imageFilter: ChannelValue = None, interval: ChannelValue = None, lineAnchor: ChannelValue = None, lineHeight: ChannelValue = None, lineWidth: ChannelValue = None, margin: ChannelValue = None, marginBottom: ChannelValue = None, marginLeft: ChannelValue = None, marginRight: ChannelValue = None, marginTop: ChannelValue = None, mixBlendMode: ChannelValue = None, monospace: ChannelValue = None, opacity: ChannelValue = None, paintOrder: ChannelValue = None, pointerEvents: ChannelValue = None, reverse: ChannelValue = None, rotate: ChannelValue = None, select: ChannelValue = None, shapeRendering: ChannelValue = None, sort: ChannelValue = None, stroke: ChannelValue = None, strokeDasharray: ChannelValue = None, strokeDashoffset: ChannelValue = None, strokeLinecap: ChannelValue = None, strokeLinejoin: ChannelValue = None, strokeMiterlimit: ChannelValue = None, strokeOpacity: ChannelValue = None, strokeWidth: ChannelValue = None, target: ChannelValue = None, text: ChannelValue = None, textAnchor: ChannelValue = None, textOverflow: ChannelValue = None, tip: ChannelValue = None, title: ChannelValue = None, x: ChannelValue = None, y: ChannelValue = None, z: ChannelValue = None):
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
