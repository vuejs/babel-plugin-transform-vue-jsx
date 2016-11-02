/*
  This is really only to unify the className attribute between the JSX flavours
*/
const filter = {
  'className': 'class'
}

function filterProp (prop, name) {
  // A new object to avoid side effects
  return filter[name]
    ? Object.assign(
      {},
      prop,
      {
        key: {
          name: filter[name]
        }
      }
    )
    : prop
}

module.exports = filterProp
