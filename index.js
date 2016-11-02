const esutils = require('esutils')
const groupJSXProps = require('./lib/groupJSXProps')
const mergeJSXProps = require('./lib/mergeJSXProps')

const IDENTIFIER = 'Vue.createElement'

function convertJSXIdentifier (babelTypes, node, parent) {
  if (babelTypes.isJSXIdentifier(node)) {
    if (node.name === 'this' && babelTypes.isReferenced(node, parent)) {
      return babelTypes.thisExpression()
    } else if (esutils.keyword.isIdentifierNameES6(node.name)) {
      node.type = 'Identifier'
    } else {
      return babelTypes.stringLiteral(node.name)
    }
  } else if (babelTypes.isJSXMemberExpression(node)) {
    return babelTypes.memberExpression(
      convertJSXIdentifier(babelTypes, node.object, node),
      convertJSXIdentifier(babelTypes, node.property, node)
    )
  }
  return node
}

/**
 * The logic for this is quite terse. It's because we need to
 * support spread elements. We loop over all attributes,
 * breaking on spreads, we then push a new object containing
 * all prior attributes to an array for later processing.
 */

function convertAttribute (babelTypes, node) {
  var nodeValue = node.value || babelTypes.booleanLiteral(true)

  var value = babelTypes.isJSXExpressionContainer(nodeValue)
    ? nodeValue.expression
    : nodeValue

  if (babelTypes.isStringLiteral(value) && !babelTypes.isJSXExpressionContainer(node.value)) {
    value.value = value.value.replace(/\n\s+/g, ' ')
  }

  if (babelTypes.isValidIdentifier(node.name.name)) {
    node.name.type = 'Identifier'
  } else {
    node.name = babelTypes.stringLiteral(node.name.name)
  }

  return babelTypes.inherits(
    babelTypes.objectProperty(node.name, value),
    node
  )
}

function buildOpeningElementAttributes (babelTypes, attributes, file) {
  var _props = []
  var objs = []

  function pushProps () {
    if (!_props.length) return
    objs.push(babelTypes.objectExpression(_props))
    _props = []
  }

  while (attributes.length) {
    var prop = attributes.shift()
    if (babelTypes.isJSXSpreadAttribute(prop)) {
      pushProps()
      prop.argument._isSpread = true
      objs.push(prop.argument)
    } else {
      _props.push(convertAttribute(babelTypes, prop))
    }
  }

  pushProps()

  objs = objs.map(function (o) {
    return o._isSpread ? o : groupJSXProps(o.properties, babelTypes)
  })

  if (objs.length === 1) {
    // only one object
    attributes = objs[0]
  } else if (objs.length) {
    // spread it
    attributes = mergeJSXProps(
      babelTypes.arrayExpression(objs)
    )
  }
  return attributes
}

function buildCallExp (babelTypes, path, file) {
  var attributes = path.node.attributes
  var tagExpr = convertJSXIdentifier(babelTypes, path.node.name, path.node)
  var args = []
  var tagName

  path.parent.children = babelTypes.react.buildChildren(path.parent)

  if (babelTypes.isIdentifier(tagExpr)) {
    tagName = tagExpr.name
  } else if (babelTypes.isLiteral(tagExpr)) {
    tagName = tagExpr.value
  }

  if (babelTypes.react.isCompatTag(tagName)) {
    args.push(babelTypes.stringLiteral(tagName))
  } else {
    args.push(tagExpr)
  }

  if (attributes.length) {
    attributes = buildOpeningElementAttributes(babelTypes, attributes, file)
  } else {
    attributes = babelTypes.nullLiteral()
  }

  args.push(attributes)

  return babelTypes.callExpression(
    babelTypes.identifier(IDENTIFIER),
    args
  )
}

module.exports = function (babel) {
  console.log('starting transform')
  var babelTypes = babel.types

  return {
    inherits: require('babel-plugin-syntax-jsx'),
    visitor: {
      JSXNamespacedName (path) {
        throw path.buildCodeFrameError('Namespace tags are not supported. JSX is not XML.')
      },
      JSXElement: {
        exit (path, file) {
          console.log('building')
          // turn tag into createElement call
          var callExpr = buildCallExp(babelTypes, path.get('openingElement'), file)
          var children = babelTypes.arrayExpression(path.node.children)

          if (callExpr.arguments[1].properties) {
            console.log(callExpr.arguments[1].properties)
          }

          // add children array as 3rd arg
          callExpr.arguments.push(children)

          if (callExpr.arguments.length >= 3) {
            callExpr._prettyCall = true
          }

          path.replaceWith(
            babelTypes.inherits(callExpr, path.node)
          )
        }
      }
    }
  }
}
