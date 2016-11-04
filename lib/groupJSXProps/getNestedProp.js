const affixList = [
  'domProps',
  'once',
  'on',
  'nativeOn',
  'hook'
]

function formatPrefixAndSuffix (prefix, name) {
  const n = prefix.length
  return {
    prefix: prefix,
    suffix: name.slice(n)[0].toLowerCase() + name.slice(n + 1)
  }
}

function getAffix (name) {
  const n = affixList.length
  let i = 0

  for (; i < n; i++) {
    if (name.startsWith(affixList[i])) {
      return formatPrefixAndSuffix(affixList[i])
    }
  }

  return name.startsWith('v-')
    ? { prefix: 'v', suffix: name.slice(2) }
    : false
}

function pushNested (opt, affix) {
  const nestedProps = opt.nestedProps
  const newProps = opt.newProps
  const t = opt.t
  const prop = opt.prop

  const prefix = affix.prefix
  const suffix = affix.suffix
  const nestedProp = t.objectProperty(t.stringLiteral(suffix), prop.value)

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

function pushCustomDirective (opt, affix) {
  const nestedProps = opt.nestedProps
  const newProps = opt.newProps
  const t = opt.t

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
      t.stringLiteral(affix.suffix)
    ),
    t.objectProperty(
      t.identifier('value'),
      opt.prop.value
    )
  ]))
}

function pushAttributes (opt) {
  const nestedProps = opt.nestedProps
  const newProps = opt.newProps
  const t = opt.t
  const prop = opt.prop

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
//   newProps: newProps,
//   nestedProps: nestedProps,
//   name: name,
//   t: t,
//   prop: prop
// }

function getNestedProps (opt) {
  // nested modules
  const affix = getAffix(opt.name)

  if (affix && affix.prefix === 'v') {
    pushCustomDirective(opt, affix)
  } else if (affix) {
    pushNested(opt, affix)
  } else {
    pushAttributes(opt)
  }
}

module.exports = getNestedProps
