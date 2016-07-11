# babel-plugin-transform-vue-jsx [![CircleCI](https://img.shields.io/circleci/project/vuejs/babel-plugin-transform-vue-jsx.svg?maxAge=2592000)](https://circleci.com/gh/vuejs/babel-plugin-transform-vue-jsx)

> Babel plugin for Vue 2.0 JSX

### Requirements

- Assumes you are using Babel with a module bundler e.g. Webpack, because the spread merge helper is imported as a module to avoid duplication.

### Usage

``` bash
npm install
  babel-plugin-syntax-jsx\
  babel-plugin-transform-vue-jsx\
  babel-helper-vue-jsx-merge-props\
  --save-dev
```

In your `.babelrc`:

``` json
{
  "presets": ["es2015"],
  "plugins": ["transform-vue-jsx"]
}
```

The plugin transpiles the following JSX:

``` jsx
<div id="foo">{this.text}</div>
```

To the following JavaScript:

``` js
h('div', {
  attrs: {
    id: 'foo'
  }
}, [this.text])
```

Note the `h` function, which is a shorthand for a Vue instance's `$createElement` method, must be in the scope where the JSX is. Since this method is passed to component render functions as the first argument, in most cases you'd do this:

``` js
Vue.component('jsx-example', {
  render (h) { // <-- h must be in scope
    return <div id="foo">bar</div>
  }
})
```

### Difference from React JSX

First, Vue 2.0's vnode format is different from React's. The second argument to the `createElement` call is a "data object" that accepts nested objects. Each nested object will be then processed by corresponding modules:

``` js
render (h) {
  return h('div', {
    // normal HTML attributes
    attrs: {
      id: 'foo'
    },
    // DOM properties
    props: {
      innerHTML: 'bar'
    },
    // event handlers are nested under "on"
    on: {
      click: this.onClick
    },
    // class is a special module, same API as `v-bind:class`
    class: {
      foo: true,
      bar: false
    },
    // style is also same as `v-bind:style`
    style: {
      color: 'red',
      fontSize: '14px'
    },
    // other special top-level properties
    key: 'key',
    ref: 'ref',
    transition: 'fade'
  })
}
```

The equivalent of the above in Vue 2.0 JSX is:

``` jsx
render (h) {
  return (
    <div
      // normal attributes
      id="foo"
      // DOM properties are prefixed with prop-
      prop-innerHTML="bar"
      // event listeners are prefixed with on-
      on-click={this.onClick}
      // other special top-level properties
      class={{ foo: true, bar: false }}
      style={{ color: 'red', fontSize: '14px' }}
      key="key"
      ref="ref"
      transition="fade">
    </div>
  )
}
```

### JSX Spread

JSX spread is supported, and this plugin will intelligently merge nested data properties. For example:

``` jsx
const data = {
  class: ['b', 'c']
}
const vnode = <div class="a" {...data}/>
```

The merged data will be:

``` js
{ class: ['a', 'b', 'c'] }
```
