var makeMap = require('./make-map')
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

module.exports = function groupProps (props, t) {
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
        newProps : newProps,
        nestedProps : nestedProps,
        name : name,
        t : t
      })
    }
  })
  return t.objectExpression(newProps)
}
