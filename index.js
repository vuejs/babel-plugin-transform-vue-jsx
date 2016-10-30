const esutils = require('esutils')
const groupProps = require('./lib/groupProps')

const IDENTIFIER = 'createElement'

module.exports = function (babel) {
  var babelTypes = babel.types

  return {
    inherits: require('babel-plugin-syntax-jsx'),
    visitor: {
      JSXNamespacedName (path) {
        throw path.buildCodeFrameError('Namespace tags are not supported. JSX is not XML.')
      },
      JSXElement: {
        exit (path, file) {
          // turn tag into createElement call
          var callExpr = buildElementCall(path.get('openingElement'), file)
          // add children array as 3rd arg
          callExpr.arguments.push(babelTypes.arrayExpression(path.node.children))
          if (callExpr.arguments.length >= 3) {
            callExpr._prettyCall = true
          }
          path.replaceWith(babelTypes.inherits(callExpr, path.node))
        }
      }
    }
  }

  function buildElementCall (path, file) {
    path.parent.children = babelTypes.react.buildChildren(path.parent)
    var tagExpr = convertJSXIdentifier(path.node.name, path.node)
    var args = []

    var tagName
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

    var attribs = path.node.attributes
    if (attribs.length) {
      attribs = buildOpeningElementAttributes(attribs, file)
    } else {
      attribs = babelTypes.nullLiteral()
    }
    args.push(attribs)

    return babelTypes.callExpression(
      babelTypes.identifier(IDENTIFIER),
      args
    )
  }

  function convertJSXIdentifier (node, parent) {
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
        convertJSXIdentifier(node.object, node),
        convertJSXIdentifier(node.property, node)
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

  function buildOpeningElementAttributes (attribs, file) {
    var _props = []
    var objs = []

    function pushProps () {
      if (!_props.length) return
      objs.push(babelTypes.objectExpression(_props))
      _props = []
    }

    while (attribs.length) {
      var prop = attribs.shift()
      if (babelTypes.isJSXSpreadAttribute(prop)) {
        pushProps()
        prop.argument._isSpread = true
        objs.push(prop.argument)
      } else {
        _props.push(convertAttribute(prop))
      }
    }

    pushProps()

    objs = objs.map(function (o) {
      return o._isSpread ? o : groupProps(o.properties, babelTypes)
    })

    if (objs.length === 1) {
      // only one object
      attribs = objs[0]
    } else if (objs.length) {
      // add prop merging helper
      file.addImport('babel-helper-vue-jsx-merge-props', 'default', '_mergeJSXProps')
      // spread it
      attribs = babelTypes.callExpression(
        babelTypes.identifier('_mergeJSXProps'),
        [babelTypes.arrayExpression(objs)]
      )
    }
    return attribs
  }

  function convertAttribute (node) {
    var value = convertAttributeValue(node.value || babelTypes.booleanLiteral(true))
    if (babelTypes.isStringLiteral(value) && !babelTypes.isJSXExpressionContainer(node.value)) {
      value.value = value.value.replace(/\n\s+/g, ' ')
    }
    if (babelTypes.isValidIdentifier(node.name.name)) {
      node.name.type = 'Identifier'
    } else {
      node.name = babelTypes.stringLiteral(node.name.name)
    }
    return babelTypes.inherits(babelTypes.objectProperty(node.name, value), node)
  }

  function convertAttributeValue (node) {
    if (babelTypes.isJSXExpressionContainer(node)) {
      return node.expression
    } else {
      return node
    }
  }
}
