#' Get or create the Mosaic coordinator
#'
#' Returns a reference to the Mosaic coordinator singleton that manages
#' all interactive clients and database connections.
#'
#' @return A coordinator reference object
#' @export
#'
#' @examples
#' \dontrun{
#' # Execute SQL in the coordinator's database
#' coord <- coordinator()
#' coord$exec("CREATE TABLE test AS SELECT 1 as id")
#' }
coordinator <- function() {
  structure(
    list(type = "coordinator"),
    class = "vgplot_element"
  )
}

#' Create a Mosaic Selection
#'
#' Creates a selection that can be used for interactive filtering and linking.
#'
#' @param ... Selection configuration
#'
#' @return A selection object
#' @export
#'
#' @examples
#' \dontrun{
#' # Create a crossfilter selection
#' brush <- Selection$crossfilter()
#' }
Selection <- list(
  crossfilter = function() {
    structure(
      list(
        type = "selection",
        select = "crossfilter"
      ),
      class = c("vgplot_selection", "vgplot_element")
    )
  },
  single = function() {
    structure(
      list(
        type = "selection",
        select = "single"
      ),
      class = c("vgplot_selection", "vgplot_element")
    )
  },
  intersect = function() {
    structure(
      list(
        type = "selection",
        select = "intersect"
      ),
      class = c("vgplot_selection", "vgplot_element")
    )
  },
  union = function() {
    structure(
      list(
        type = "selection",
        select = "union"
      ),
      class = c("vgplot_selection", "vgplot_element")
    )
  }
)

#' Create a plot
#'
#' Creates a plot specification with marks and interactors.
#'
#' @param ... Marks, interactors, and plot options
#'
#' @return A plot specification
#' @export
#'
#' @examples
#' \dontrun{
#' plot(
#'   rectY(from("mtcars"), list(x = bin("mpg"), y = count())),
#'   width = 600,
#'   height = 400
#' )
#' }
plot <- function(...) {
  args <- list(...)

  # Separate marks/interactors from options
  elements <- list()
  options <- list()

  for (i in seq_along(args)) {
    arg <- args[[i]]
    name <- names(args)[i]

    if (inherits(arg, "vgplot_mark") || inherits(arg, "vgplot_interactor") ||
        inherits(arg, "vgplot_option")) {
      elements <- c(elements, list(arg$spec))
    } else if (!is.null(name) && name != "") {
      options[[name]] <- arg
    } else if (is.numeric(arg) || is.character(arg)) {
      # Unnamed scalar options
      options <- c(options, list(arg))
    }
  }

  spec <- c(list(plot = elements), options)

  structure(
    list(spec = spec),
    class = c("vgplot_plot", "vgplot_element")
  )
}

#' Specify a data source
#'
#' Creates a data source reference for marks.
#'
#' @param table Table name or query
#' @param filterBy Optional selection to filter by
#'
#' @return A data source specification
#' @export
#'
#' @examples
#' \dontrun{
#' brush <- Selection$crossfilter()
#' from("flights", filterBy = brush)
#' }
from <- function(table, filterBy = NULL) {
  spec <- list(from = table)

  if (!is.null(filterBy)) {
    if (inherits(filterBy, "vgplot_selection")) {
      spec$filterBy <- filterBy$spec
    } else {
      spec$filterBy <- filterBy
    }
  }

  structure(
    list(spec = spec),
    class = c("vgplot_from", "vgplot_element")
  )
}

#' Create a rectY mark (histogram/bar chart)
#'
#' Creates a rectangular mark with vertical bars.
#'
#' @param data Data source created with \code{\link{from}}
#' @param channels Channel mappings (x, y, fill, etc.)
#'
#' @return A mark specification
#' @export
#'
#' @examples
#' \dontrun{
#' rectY(from("mtcars"), list(x = bin("mpg"), y = count()))
#' }
rectY <- function(data, channels) {
  spec <- list(mark = "rectY")

  if (inherits(data, "vgplot_from")) {
    spec <- c(spec, data$spec)
  }

  # Process channels
  for (name in names(channels)) {
    channel <- channels[[name]]
    if (inherits(channel, "vgplot_element")) {
      spec[[name]] <- channel$spec
    } else {
      spec[[name]] <- channel
    }
  }

  structure(
    list(spec = spec),
    class = c("vgplot_mark", "vgplot_element")
  )
}

#' Bin a continuous variable
#'
#' Creates a binning specification for aggregating continuous data.
#'
#' @param column Column name to bin
#' @param ... Additional binning options (step, extent, etc.)
#'
#' @return A binning specification
#' @export
#'
#' @examples
#' \dontrun{
#' bin("mpg")
#' bin("mpg", step = 5)
#' }
bin <- function(column, ...) {
  spec <- list(
    type = "bin",
    column = column,
    ...
  )

  structure(
    list(spec = spec),
    class = c("vgplot_bin", "vgplot_element")
  )
}

#' Count aggregation
#'
#' Creates a count aggregation specification.
#'
#' @return A count specification
#' @export
#'
#' @examples
#' \dontrun{
#' rectY(from("mtcars"), list(x = bin("mpg"), y = count()))
#' }
count <- function() {
  structure(
    list(spec = list(type = "count")),
    class = c("vgplot_agg", "vgplot_element")
  )
}

#' Count distinct values
#'
#' Creates a count distinct aggregation specification.
#'
#' @param column Column to count distinct values of
#'
#' @return A distinct count specification
#' @export
distinct <- function(column) {
  structure(
    list(spec = list(type = "distinct", column = column)),
    class = c("vgplot_agg", "vgplot_element")
  )
}

#' Descending sort order
#'
#' Creates a descending sort specification.
#'
#' @param column Column to sort by
#'
#' @return A sort specification
#' @export
desc <- function(column) {
  structure(
    list(spec = list(type = "desc", column = column)),
    class = c("vgplot_sort", "vgplot_element")
  )
}

#' Create an interval X interactor
#'
#' Creates an interactive interval brush for the x-axis.
#'
#' @param as Selection to populate
#' @param ... Additional options
#'
#' @return An interactor specification
#' @export
#'
#' @examples
#' \dontrun{
#' brush <- Selection$crossfilter()
#' intervalX(as = brush)
#' }
intervalX <- function(as = NULL, ...) {
  spec <- list(select = "intervalX", ...)

  if (!is.null(as) && inherits(as, "vgplot_selection")) {
    spec$as <- as$spec
  }

  structure(
    list(spec = spec),
    class = c("vgplot_interactor", "vgplot_element")
  )
}

#' Create an interval Y interactor
#'
#' Creates an interactive interval brush for the y-axis.
#'
#' @param as Selection to populate
#' @param ... Additional options
#'
#' @return An interactor specification
#' @export
intervalY <- function(as = NULL, ...) {
  spec <- list(select = "intervalY", ...)

  if (!is.null(as) && inherits(as, "vgplot_selection")) {
    spec$as <- as$spec
  }

  structure(
    list(spec = spec),
    class = c("vgplot_interactor", "vgplot_element")
  )
}

#' Create an interval XY interactor
#'
#' Creates an interactive 2D interval brush.
#'
#' @param as Selection to populate
#' @param ... Additional options
#'
#' @return An interactor specification
#' @export
intervalXY <- function(as = NULL, ...) {
  spec <- list(select = "intervalXY", ...)

  if (!is.null(as) && inherits(as, "vgplot_selection")) {
    spec$as <- as$spec
  }

  structure(
    list(spec = spec),
    class = c("vgplot_interactor", "vgplot_element")
  )
}

#' Fixed domain
#'
#' Constant that indicates a domain should remain fixed during updates.
#'
#' @export
Fixed <- structure(
  list(spec = "Fixed"),
  class = c("vgplot_constant", "vgplot_element")
)

#' Set X domain
#'
#' Sets the x-axis domain behavior.
#'
#' @param domain Domain specification (e.g., \code{Fixed}, or a vector of min/max)
#'
#' @return A domain specification
#' @export
#'
#' @examples
#' \dontrun{
#' xDomain(Fixed)
#' xDomain(c(0, 100))
#' }
xDomain <- function(domain) {
  spec <- if (inherits(domain, "vgplot_constant")) {
    list(xDomain = domain$spec)
  } else {
    list(xDomain = domain)
  }

  structure(
    list(spec = spec),
    class = c("vgplot_option", "vgplot_element")
  )
}

#' Set Y domain
#'
#' Sets the y-axis domain behavior.
#'
#' @param domain Domain specification (e.g., \code{Fixed}, or a vector of min/max)
#'
#' @return A domain specification
#' @export
yDomain <- function(domain) {
  spec <- if (inherits(domain, "vgplot_constant")) {
    list(yDomain = domain$spec)
  } else {
    list(yDomain = domain)
  }

  structure(
    list(spec = spec),
    class = c("vgplot_option", "vgplot_element")
  )
}

#' Vertical concatenation
#'
#' Arranges plots vertically.
#'
#' @param ... Plots to concatenate
#'
#' @return A concatenation specification
#' @export
#'
#' @examples
#' \dontrun{
#' vconcat(plot1, plot2, plot3)
#' }
vconcat <- function(...) {
  plots <- list(...)

  spec <- list(
    vconcat = lapply(plots, function(p) {
      if (inherits(p, "vgplot_element")) p$spec else p
    })
  )

  structure(
    list(spec = spec),
    class = c("vgplot_concat", "vgplot_element")
  )
}

#' Horizontal concatenation
#'
#' Arranges plots horizontally.
#'
#' @param ... Plots to concatenate
#'
#' @return A concatenation specification
#' @export
hconcat <- function(...) {
  plots <- list(...)

  spec <- list(
    hconcat = lapply(plots, function(p) {
      if (inherits(p, "vgplot_element")) p$spec else p
    })
  )

  structure(
    list(spec = spec),
    class = c("vgplot_concat", "vgplot_element")
  )
}

#' Create a legend
#'
#' Creates a legend specification.
#'
#' @param channel Channel to create legend for (e.g., "color", "opacity")
#' @param ... Additional legend options
#'
#' @return A legend specification
#' @export
legend <- function(channel, ...) {
  structure(
    list(spec = list(legend = channel, ...)),
    class = c("vgplot_legend", "vgplot_element")
  )
}

#' Convert specification to ESM code
#'
#' Converts a Mosaic specification to ECMAScript module code.
#'
#' @param spec A Mosaic specification
#'
#' @return ESM code specification
#' @export
astToESM <- function(spec) {
  structure(
    list(spec = list(astToESM = if (inherits(spec, "vgplot_element")) spec$spec else spec)),
    class = c("vgplot_transform", "vgplot_element")
  )
}
