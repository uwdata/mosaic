# Legends

Legends can be added to `plot` specifications or created as standalone elements.

The `name` directive gives a `plot` a unique name.
A standalone legend can reference a named plot (`colorLegend({ for: 'name' })`) to avoid respecifying scale domains and ranges.

Legends also act as interactors, taking a bound Selection as a parameter.
For example, discrete legends use the logic of the `toggle` interactor to enable point selections.
Two-way binding is supported for Selections using _single_ resolution, enabling legends and other interactors to share state.
