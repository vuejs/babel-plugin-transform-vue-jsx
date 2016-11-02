const NEST_EXPRESSION = /^(attrs|props|on|nativeOn|className|style|hook)$/

const NESTED_LIST = [
  'on',
  'nativeOn',
  'key'
]

function mergeFn (a, b) {
  return function () {
    var i = 0
    var n = arguments.length
    var args = []

    // This is an optimization specific to the V8 engine and how it handles
    // the arguments object
    // https://github.com/petkaantonov/bluebird/wiki/Optimization-killers
    for (; i < n; i++) {
      args[i] = arguments[i]
    }

    a.apply(this, args)
    b.apply(this, args)
  }
}

function normalizeClassName () {
  let temp

  if (typeof aProperty === 'string') {
    temp = aProperty
    a[key] = aProperty = {}
    aProperty[temp] = true
  }

  if (typeof bProperty === 'string') {
    temp = bProperty
    b[key] = bProperty = {}
    bProperty[temp] = true
  }
}

function setNestedProps(key, a, b) {
  const aProperty = a[key] = {}
  const bProperty = b[key] = {}
  // normalize class
  if (key === 'className') {
    normalizeClassName(aProperty, bProperty)
  }
  if (NESTED_LIST.includes(key)) {
    // merge functions
    for (nestedKey in bProperty) {
      aProperty[nestedKey] = mergeFn(aProperty[nestedKey], bProperty[nestedKey])
    }
  } else if (Array.isArray(aProperty)) {
    a[key] = aProperty.concat(bProperty)
  } else if (Array.isArray(bProperty)) {
    a[key] = [aProperty].concat(bProperty)
  } else {
    for (nestedKey in bProperty) {
      aProperty[nestedKey] = bProperty[nestedKey]
    }
  }
}

module.exports = function mergeJSXProps (objs) {
  console.log(objs);
  return objs.reduce(function (a, b) {
    var key, nestedKey
    for (key in b) {
      if (a[key] && NEST_EXPRESSION.test(key)) {
        setNestedProps(key, a, b)
      } else {
        a[key] = b[key]
      }
    }
    return a
  }, {})
}
