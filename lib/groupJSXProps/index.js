const getNestedProp = require('./getNestedProp')

var isTopLevel = [
  'class',
  'staticClass',
  'style',
  'key',
  'ref',
  'slot'
]

module.exports = function groupJSXProps (props, t) {
  var newProps = []
  var nestedProps = Object.create(null)

  props.forEach(function (prop) {
    var name = prop.key.value || prop.key.name
    if (isTopLevel.includes(name)) {
      newProps.push(prop)
    } else {
      getNestedProp({
        newProps: newProps,
        nestedProps: nestedProps,
        name: name,
        t: t,
        prop: prop
      })
    }
  })
  return t.objectExpression(newProps)
}
