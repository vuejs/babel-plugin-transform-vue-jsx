const esutils = require('esutils')
const groupJSXProps = require('./lib/groupJSXProps')
const IDENTIFIER = 'Vue.createElement'

function convertJSXIdentifier (t, node, parent) {
  if (t.isJSXIdentifier(node)) {
    if (node.name === 'this' && t.isReferenced(node, parent)) {
      return t.thisExpression()
    } else if (esutils.keyword.isIdentifierNameES6(node.name)) {
      node.type = 'Identifier'
    } else {
      return t.stringLiteral(node.name)
    }
  } else if (t.isJSXMemberExpression(node)) {
    return t.memberExpression(
      convertJSXIdentifier(t, node.object, node),
      convertJSXIdentifier(t, node.property, node)
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

function convertAttribute (t, node) {
  var nodeValue = node.value || t.booleanLiteral(true)

  var value = t.isJSXExpressionContainer(nodeValue)
    ? nodeValue.expression
    : nodeValue

  if (t.isStringLiteral(value) && !t.isJSXExpressionContainer(node.value)) {
    value.value = value.value.replace(/\n\s+/g, ' ')
  }

  if (t.isValidIdentifier(node.name.name)) {
    node.name.type = 'Identifier'
  } else {
    node.name = t.stringLiteral(node.name.name)
  }

  return t.inherits(
    t.objectProperty(node.name, value),
    node
  )
}

function buildOpeningElementAttributes (t, attributes, file) {
  var _props = []
  var objectExpressionList = []

  function pushProps () {
    if (_props.length) {
      objectExpressionList.push(t.objectExpression(_props))
      _props = []
    }
  }

  while (attributes.length) {
    var prop = attributes.shift()
    if (t.isJSXSpreadAttribute(prop)) {
      pushProps()
      prop.argument._isSpread = true
      objectExpressionList.push(prop.argument)
    } else {
      _props.push(convertAttribute(t, prop))
    }
  }

  pushProps()

  objectExpressionList = objectExpressionList.map(function (objectExpression) {
    return objectExpression._isSpread
      ? objectExpression
      : groupJSXProps(objectExpression.properties, t)
  })

  if (objectExpressionList.length === 1) {
    // only one object
    attributes = objectExpressionList[0]
  } else if (objectExpressionList.length) {
    // add prop merging helper
    file.addImport('babel-helper-vue-jsx-merge-props', 'default', '_mergeJSXProps')
    // spread it
    attributes = t.callExpression(
      t.identifier('_mergeJSXProps'),
      [t.arrayExpression(objectExpressionList)]
    )
  }

  return attributes
}

function buildCallExp (t, path, file) {
  var attributes = path.node.attributes
  var tagExpr = convertJSXIdentifier(t, path.node.name, path.node)
  var args = []
  var tagName

  path.parent.children = t.react.buildChildren(path.parent)

  if (t.isIdentifier(tagExpr)) {
    tagName = tagExpr.name
  } else if (t.isLiteral(tagExpr)) {
    tagName = tagExpr.value
  }

  if (t.react.isCompatTag(tagName)) {
    args.push(t.stringLiteral(tagName))
  } else {
    args.push(tagExpr)
  }

  if (attributes.length) {
    attributes = buildOpeningElementAttributes(t, attributes, file)
  } else {
    attributes = t.nullLiteral()
  }

  args.push(attributes)

  return t.callExpression(
    t.identifier(IDENTIFIER),
    args
  )
}

module.exports = function (babel) {
  var t = babel.types

  return {
    inherits: require('babel-plugin-syntax-jsx'),
    visitor: {
      JSXNamespacedName (path) {
        throw path.buildCodeFrameError('Namespace tags are not supported. JSX is not XML.')
      },
      JSXElement: {
        exit (path, file) {
          // turn tag into createElement call
          var callExpr = buildCallExp(t, path.get('openingElement'), file)
          var children = t.arrayExpression(path.node.children)

          // add children array as 3rd arg
          callExpr.arguments.push(children)

          if (callExpr.arguments.length >= 3) {
            callExpr._prettyCall = true
          }

          path.replaceWith(
            t.inherits(callExpr, path.node)
          )
        }
      }
    }
  }
}
