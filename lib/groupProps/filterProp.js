var filter = {
  'className': 'class',
  'staticClass': 'staticClass',
  'style': 'style',
  'key': 'key',
  'ref': 'ref',
  'slot': 'slot'
}

// If the actual prop for 'class' was changed to 'className', we could
// deprecate the filter
function filterProp (prop) {
  if (prop.key.value) {
    // returning a new object to avoid side effects
    return Object.assign(
      {},
      prop,
      {
        key: {
          value: filter[prop.key.value]
        }
      }
    )
  }
  return Object.assign(
    {},
    prop,
    {
      key: {
        name: filter[prop.key.name]
      }
    }
  )
}

module.exports = filterProp
