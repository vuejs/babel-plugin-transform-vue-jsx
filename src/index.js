import esutils from 'esutils'

module.exports = function (babel) {
  const t = babel.types

  return {
    inherits: require('babel-plugin-syntax-jsx'),
    visitor: {
      JSXNamespacedName (path) {
        throw path.buildCodeFrameError('Namespace tags are not supported. JSX is not XML.')
      },
      JSXElement: {
        exit (path, file) {
          const callExpr = buildElementCall(path.get('openingElement'), file)
          callExpr.arguments = callExpr.arguments.concat(path.node.children)
          if (callExpr.arguments.length >= 3) {
            callExpr._prettyCall = true
          }
          path.replaceWith(t.inherits(callExpr, path.node))
        }
      }
    }
  }

  function convertJSXIdentifier (node, parent) {
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
        convertJSXIdentifier(node.object, node),
        convertJSXIdentifier(node.property, node)
      )
    }

    return node
  }

  function convertAttributeValue (node) {
    if (t.isJSXExpressionContainer(node)) {
      return node.expression
    } else {
      return node
    }
  }

  function convertAttribute (node) {
    const value = convertAttributeValue(node.value || t.booleanLiteral(true))

    if (t.isStringLiteral(value) && !t.isJSXExpressionContainer(node.value)) {
      value.value = value.value.replace(/\n\s+/g, ' ')
    }

    if (t.isValidIdentifier(node.name.name)) {
      node.name.type = 'Identifier'
    } else {
      node.name = t.stringLiteral(node.name.name)
    }

    return t.inherits(t.objectProperty(node.name, value), node)
  }

  function buildElementCall (path, file) {
    path.parent.children = t.react.buildChildren(path.parent)

    const tagExpr = convertJSXIdentifier(path.node.name, path.node)
    const args = []

    let tagName
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

    let attribs = path.node.attributes
    if (attribs.length) {
      attribs = buildOpeningElementAttributes(attribs, file)
    } else {
      attribs = t.nullLiteral()
    }

    args.push(attribs)

    return t.callExpression(t.identifier('h'), args)
  }

  /**
   * The logic for this is quite terse. It's because we need to
   * support spread elements. We loop over all attributes,
   * breaking on spreads, we then push a new object containg
   * all prior attributes to an array for later processing.
   */

  function buildOpeningElementAttributes (attribs, file) {
    let _props = []
    const objs = []

    function pushProps () {
      if (!_props.length) return

      objs.push(t.objectExpression(_props))
      _props = []
    }

    while (attribs.length) {
      const prop = attribs.shift()
      if (t.isJSXSpreadAttribute(prop)) {
        pushProps()
        objs.push(prop.argument)
      } else {
        _props.push(convertAttribute(prop))
      }
    }

    pushProps()

    if (objs.length === 1) {
      // only one object
      attribs = objs[0]
    } else {
      // looks like we have multiple objects
      if (!t.isObjectExpression(objs[0])) {
        objs.unshift(t.objectExpression([]))
      }

      // spread it
      attribs = t.callExpression(
        file.addHelper('extends'),
        objs
      )
    }

    return attribs
  }
}
