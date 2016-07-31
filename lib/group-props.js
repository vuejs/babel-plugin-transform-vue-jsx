var makeMap = require('./make-map')
var isTopLevel = makeMap('class,staticClass,style,key,ref,slot')

module.exports = function groupProps (props, t) {
  var newProps = []
  var currentNestedObjects = Object.create(null)
  props.forEach(function (prop) {
    var name = prop.key.value || prop.key.name
    var prefixIndex
    if (isTopLevel(name)) {
      // top-level special props
      newProps.push(prop)
    } else if ((prefixIndex = name.indexOf('-')) > 0) {
      // nested
      var prefix = name.slice(0, prefixIndex)
      var suffix = name.slice(prefixIndex + 1)
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
        attrs = currentNestedObjects.attrs = t.objectProperty(
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
