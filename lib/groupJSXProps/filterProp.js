/*
  This is really only to unify the className attribute between the JSX flavours
*/
const filter = {
  'className': 'class'
}

function filterProp (opt) {
  const babelTypes = opt.babelTypes
  const name = opt.name
  const prop = opt.prop
  // A new object to avoid side effects
  return filter[name]
    ? Object.assign(
      {},
      prop,
      {
        key: babelTypes.identifier(filter[name])
      }
    )
    : prop
}

module.exports = filterProp
