function formatPrefixAndSuffix(prefix, name) {
  var n = prefix.length;
  return {
    prefix : prefix,
    suffix : name.slice(n)[0].toLowerCase() + name.slice(n + 1)
  }
}

function getPrefixAndSuffix(name) {
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
  } else if (name[0] === 'v' && name[1] === name[1].toUpperCase()) {
    return formatPrefixAndSuffix('v', name)
  }
  return false
}

function pushNested(opt, prefixAndSuffix) {
  let nestedProps = opt.nestedProps
  let newProps = opt.newProps
  let t = opt.t
  let name = opt.name

  let prefix = prefixAndSuffix.prefix
  let suffix = prefixAndSuffix.suffix
  let nestedProp = t.objectProperty(t.stringLiteral(suffix), prop.value)
  let nestedObject = nestedProps[prefix]

  if (!nestedObject) {
    nestedObject = nestedProps[prefix] = t.objectProperty(
      t.identifier(prefix),
      t.objectExpression([nestedProp])
    )
    newProps.push(nestedObject)
  } else {
    nestedObject.value.properties.push(nestedProp)
  }
}

function pushCustomDirective(opt, prefixAndSuffix) {
  let nestedProps = opt.nestedProps
  let newProps = opt.newProps
  let t = opt.t
  let name = opt.name
  let directives = nestedProps.directives

  if (!directives) {
    directives = nestedProps.directives = t.objectProperty(
      t.identifier('directives'),
      t.arrayExpression([])
    )
    newProps.push(directives)
  }

  directives.value.elements.push(t.objectExpression([
    t.objectProperty(
      t.identifier('name'),
      t.stringLiteral(name)
    ),
    t.objectProperty(
      t.identifier('value'),
      prop.value
    )
  ]))
}

function pushAttributes(opt) {
  let nestedProps = opt.nestedProps
  let newProps = opt.newProps
  let t = opt.t
  let attrs = nestedProps.attrs

  if (!attrs) {
    attrs = nestedProps.attrs = t.objectProperty(
      t.identifier('attrs'),
      t.objectExpression([prop])
    )
    newProps.push(attrs)
  } else {
    attrs.value.properties.push(prop)
  }
}

// {
//   nestedProps : nestedProps,
//   name : name,
//   t : t
// }

function getNestedProps(opt) {
  // nested modules
  let prefixAndSuffix = getPrefixAndSuffix(opt.name);

  if (prefixAndSuffix && prefixAndSuffix.prefix === 'v') {
    pushCustomDirective(opt, prefixAndSuffix)
  } else if (prefixAndSuffix) {
    pushNested(opt, prefixAndSuffix)
  } else {
    pushAttributes(opt)
  }
}