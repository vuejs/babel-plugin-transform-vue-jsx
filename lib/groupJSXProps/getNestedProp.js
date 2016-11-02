function formatPrefixAndSuffix (prefix, name) {
  var n = prefix.length
  return {
    prefix: prefix,
    suffix: name.slice(n)[0].toLowerCase() + name.slice(n + 1)
  }
}

function getPrefixAndSuffix (name) {
  if (name.startsWith('domProps')) {
    return formatPrefixAndSuffix('domProps', name)
  } else if (name.startsWith('once')) {
    return formatPrefixAndSuffix('once', name)
  } else if (name.startsWith('on')) {
    return formatPrefixAndSuffix('on', name)
  } else if (name.startsWith('nativeOn')) {
    return formatPrefixAndSuffix('nativeOn', name)
  } else if (name.startsWith('hook')) {
    return formatPrefixAndSuffix('hook', name)
  } else if (name[0] === 'v' && name[1] === '-') {
    return {
      prefix: 'v',
      suffix: name.slice(2)
    }
  }
  return false
}

function pushNested (opt, prefixAndSuffix) {
  const nestedProps = opt.nestedProps
  const newProps = opt.newProps
  const babelTypes = opt.babelTypes
  const prop = opt.prop

  const prefix = prefixAndSuffix.prefix
  const suffix = prefixAndSuffix.suffix
  const nestedProp = babelTypes.objectProperty(babelTypes.stringLiteral(suffix), prop.value)

  let nestedObject = nestedProps[prefix]

  if (!nestedObject) {
    nestedObject = nestedProps[prefix] = babelTypes.objectProperty(
      babelTypes.identifier(prefix),
      babelTypes.objectExpression([nestedProp])
    )
    newProps.push(nestedObject)
  } else {
    nestedObject.value.properties.push(nestedProp)
  }
}

function pushCustomDirective (opt, prefixAndSuffix) {
  const nestedProps = opt.nestedProps
  const newProps = opt.newProps
  const babelTypes = opt.babelTypes
  const name = opt.name
  const prop = opt.prop

  let directives = nestedProps.directives

  if (!directives) {
    directives = nestedProps.directives = babelTypes.objectProperty(
      babelTypes.identifier('directives'),
      babelTypes.arrayExpression([])
    )
    newProps.push(directives)
  }

  directives.value.elements.push(babelTypes.objectExpression([
    babelTypes.objectProperty(
      babelTypes.identifier('name'),
      babelTypes.stringLiteral(name)
    ),
    babelTypes.objectProperty(
      babelTypes.identifier('value'),
      prop.value
    )
  ]))
}

function pushAttributes (opt) {
  const nestedProps = opt.nestedProps
  const newProps = opt.newProps
  const babelTypes = opt.babelTypes
  const prop = opt.prop

  let attrs = nestedProps.attrs

  if (!attrs) {
    attrs = nestedProps.attrs = babelTypes.objectProperty(
      babelTypes.identifier('attrs'),
      babelTypes.objectExpression([prop])
    )
    newProps.push(attrs)
  } else {
    attrs.value.properties.push(prop)
  }
}

// {
//   newProps: newProps,
//   nestedProps: nestedProps,
//   name: name,
//   babelTypes: babelTypes,
//   prop: prop
// }

function getNestedProps (opt) {
  // nested modules
  const prefixAndSuffix = getPrefixAndSuffix(opt.name)

  if (prefixAndSuffix && prefixAndSuffix.prefix === 'v') {
    pushCustomDirective(opt, prefixAndSuffix)
  } else if (prefixAndSuffix) {
    pushNested(opt, prefixAndSuffix)
  } else {
    pushAttributes(opt)
  }
}

module.exports = getNestedProps
