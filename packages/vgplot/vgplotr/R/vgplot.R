#' Create a Mosaic vgplot widget
#'
#' Creates an interactive visualization widget using the Mosaic framework.
#' This function renders Mosaic specifications as htmlwidgets that work in
#' Quarto documents, RMarkdown, and Shiny applications.
#'
#' @param spec A Mosaic specification created with \code{\link{mosaic_spec}} or
#'   a plot element created with vgplot functions.
#' @param width Width of the widget (optional)
#' @param height Height of the widget (optional)
#' @param elementId Element ID for the widget (optional)
#'
#' @return An htmlwidget object
#' @export
#'
#' @importFrom htmlwidgets createWidget sizingPolicy
#'
#' @examples
#' \dontrun{
#' # Create a simple plot
#' library(vgplotr)
#'
#' spec <- mosaic_spec(
#'   plot(
#'     rectY(
#'       from("mtcars"),
#'       list(x = bin("mpg"), y = count(), fill = "steelblue")
#'     )
#'   )
#' )
#'
#' vgplot(spec)
#' }
vgplot <- function(spec, width = NULL, height = NULL, elementId = NULL) {
  # Convert R specification to JSON-serializable format
  if (inherits(spec, "vgplot_element")) {
    spec <- mosaic_spec(spec)
  }

  # Ensure spec is properly formatted
  if (!inherits(spec, "vgplot_spec")) {
    stop("spec must be a vgplot_spec object created with mosaic_spec()")
  }

  # Forward options using x
  x <- list(
    spec = spec$spec
  )

  # Create widget
  createWidget(
    name = "vgplot",
    x = x,
    width = width,
    height = height,
    package = "vgplotr",
    elementId = elementId,
    sizingPolicy = sizingPolicy(
      defaultWidth = "100%",
      defaultHeight = 400,
      padding = 0,
      viewer.padding = 0,
      browser.fill = TRUE,
      viewer.fill = TRUE,
      knitr.figure = FALSE
    )
  )
}

#' Shiny bindings for vgplot
#'
#' Output and render functions for using vgplot within Shiny
#' applications and interactive Rmd documents.
#'
#' @param outputId output variable to read from
#' @param width,height Must be a valid CSS unit (like \code{'100\%'},
#'   \code{'400px'}, \code{'auto'}) or a number, which will be coerced to a
#'   string and have \code{'px'} appended.
#' @param expr An expression that generates a vgplot
#' @param env The environment in which to evaluate \code{expr}.
#' @param quoted Is \code{expr} a quoted expression (with \code{quote()})? This
#'   is useful if you want to save an expression in a variable.
#'
#' @name vgplot-shiny
#'
#' @export
#' @importFrom htmlwidgets shinyWidgetOutput shinyRenderWidget
vgplotOutput <- function(outputId, width = "100%", height = "400px") {
  htmlwidgets::shinyWidgetOutput(outputId, "vgplot", width, height, package = "vgplotr")
}

#' @rdname vgplot-shiny
#' @export
renderVgplot <- function(expr, env = parent.frame(), quoted = FALSE) {
  if (!quoted) {
    expr <- substitute(expr)
  }
  htmlwidgets::shinyRenderWidget(expr, vgplotOutput, env, quoted = TRUE)
}

#' Create a Mosaic specification
#'
#' Creates a Mosaic specification object that can be rendered by \code{\link{vgplot}}.
#'
#' @param ... Plot elements, coordinator setup, or other Mosaic components
#'
#' @return A vgplot_spec object
#' @export
#'
#' @examples
#' \dontrun{
#' mosaic_spec(
#'   plot(
#'     rectY(from("mtcars"), list(x = bin("mpg"), y = count()))
#'   )
#' )
#' }
mosaic_spec <- function(...) {
  elements <- list(...)

  # Convert elements to specification format
  spec <- list()

  for (elem in elements) {
    if (inherits(elem, "vgplot_element")) {
      spec_part <- elem$spec
      spec <- c(spec, if (is.list(spec_part) && !is.null(names(spec_part))) list(spec_part) else spec_part)
    } else if (is.list(elem)) {
      spec <- c(spec, list(elem))
    }
  }

  structure(
    list(spec = spec),
    class = "vgplot_spec"
  )
}
