# Param

A `Param` is a reactive variable for an individual value.

## isParam

`isParam(value)`

Returns `true` if the input value is a `Param`, false otherwise.

## Param.value

`Param.value(value)`

Create a new Param with the given initial _value_.

## Param.array

`Param.array(values)`

Create a new Param over an array of initial _values_, which may contain nested Params.

## value

`param.value`

Retrieves the current value of a Param instance.

## update

`param.update(value, options)`

Update the Param with a new _value_.
The _options_ object may include a _force_ flag indicating if the Param
should emit a 'value' event even if the internal value is unchanged.

## addEventListener

`param.addEventListener(type, callback)`

Add an event listener _callback_ function for the specified event _type_.
Params support `"value"` type events only.

## removeEventListener

`param.removeEventListener(type, callback)`

Remove an event listener _callback_ function for the specified event _type_.
