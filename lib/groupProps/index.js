const filterProp = require('./filterProp')
const getNestedProp = require('./getNestedProp')

var isTopLevel = [
  'className',
  'staticClass',
  'style',
  'key',
  'ref',
  'slot'
]

module.exports = function groupProps (props, babelTypes) {
  var newProps = []
  var nestedProps = Object.create(null)

  props.forEach(function (prop) {
    var name = prop.key.value || prop.key.name
    if (isTopLevel.includes(name)) {
      // top-level special props
      newProps.push(
        filterProp(prop)
      )
    } else {
      getNestedProp({
        newProps: newProps,
        nestedProps: nestedProps,
        name: name,
        babelTypes: babelTypes,
        prop: prop
      })
    }
  })
  return babelTypes.objectExpression(newProps)
}
