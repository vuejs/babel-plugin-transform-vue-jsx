var makeMap = require('./make-map')
var isTopLevel = makeMap(
  'class,style,staticClass,staticAttrs,' +
  'key,ref,slot,transition,keepAlive'
)

function normalizePrefix (prefix) {
  if (prefix === 'prop' || prefix === 'directive') {
    return prefix + 's'
  } else {
    return prefix
  }
}

module.exports = function groupProps (props, t) {
  var newProps = []
  var currentNestedObjects = Object.create(null)
  props.forEach(function (prop) {
    var name = prop.key.value || prop.key.name
    if (isTopLevel(name)) {
      // top-level special props
      newProps.push(prop)
    } else if (name.indexOf('-') > 0) {
      // nested
      var split = name.split('-')
      var prefix = normalizePrefix(split[0])
      var suffix = split[1]
      var nestedProp = t.objectProperty(t.identifier(suffix), prop.value)
      var nestedObject = currentNestedObjects[prefix]
      if (!nestedObject) {
        nestedObject = currentNestedObjects[prefix] = t.objectProperty(
          t.identifier(prefix),
          t.objectExpression([nestedProp])
        )
        newProps.push(nestedObject)
      } else {
        nestedObject.value.properties.push(nestedProp)
      }
    } else {
      // rest are nested under attrs
      var attrs = currentNestedObjects.attrs
      if (!attrs) {
        attrs = t.objectProperty(
          t.identifier('attrs'),
          t.objectExpression([prop])
        )
        newProps.push(attrs)
      } else {
        attrs.value.properties.push(prop)
      }
    }
  })
  return t.objectExpression(newProps)
}
