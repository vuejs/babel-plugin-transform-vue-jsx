import { expect } from 'chai'
import Vue from 'vue'

describe('babel-plugin-transform-vue-jsx', () => {
  it('should contain text', () => {
    const vnode = render(h => <div>test</div>)
    expect(vnode.tag).to.equal('div')
    expect(vnode.children[0].text).to.equal('test')
  })

  it('should bind text', () => {
    const text = 'foo'
    const vnode = render(h => <div>{text}</div>)
    expect(vnode.tag).to.equal('div')
    expect(vnode.children[0].text).to.equal('foo')
  })

  it('should extract attrs', () => {
    const vnode = render(h => <div id="hi" dir="ltr"></div>)
    expect(vnode.data.attrs.id).to.equal('hi')
    expect(vnode.data.attrs.dir).to.equal('ltr')
  })

  it('should bind attr', () => {
    const id = 'foo'
    const vnode = render(h => <div id={id}></div>)
    expect(vnode.data.attrs.id).to.equal('foo')
  })

  it('should omit children argument if possible', () => {
    const vnode = render(h => <div />)
    const children = vnode.children
    expect(children).to.equal(undefined)
  })

  it('should handle top-level special attrs', () => {
    const vnode = render(h => (
      <div
        class="foo"
        style="bar"
        key="key"
        ref="ref"
        refInFor
        slot="slot">
      </div>
    ))
    expect(vnode.data.class).to.equal('foo')
    expect(vnode.data.style).to.equal('bar')
    expect(vnode.data.key).to.equal('key')
    expect(vnode.data.ref).to.equal('ref')
    expect(vnode.data.refInFor).to.be.true
    expect(vnode.data.slot).to.equal('slot')
  })

  it('should handle nested properties', () => {
    const noop = _ => _
    const vnode = render(h => (
      <div
        props-on-success={noop}
        on-click={noop}
        on-kebab-case={noop}
        domProps-innerHTML="<p>hi</p>"
        hook-insert={noop}>
      </div>
    ))
    expect(vnode.data.props['on-success']).to.equal(noop)
    expect(vnode.data.on.click).to.equal(noop)
    expect(vnode.data.on['kebab-case']).to.equal(noop)
    expect(vnode.data.domProps.innerHTML).to.equal('<p>hi</p>')
    expect(vnode.data.hook.insert).to.equal(noop)
  })

  it('should handle nested properties (camelCase)', () => {
    const noop = _ => _
    const vnode = render(h => (
      <div
        propsOnSuccess={noop}
        onClick={noop}
        onCamelCase={noop}
        domPropsInnerHTML="<p>hi</p>"
        hookInsert={noop}>
      </div>
    ))
    expect(vnode.data.props.onSuccess).to.equal(noop)
    expect(vnode.data.on.click).to.equal(noop)
    expect(vnode.data.on.camelCase).to.equal(noop)
    expect(vnode.data.domProps.innerHTML).to.equal('<p>hi</p>')
    expect(vnode.data.hook.insert).to.equal(noop)
  })

  it('should support data attributes', () => {
    const vnode = render(h => (
      <div data-id="1"></div>
    ))
    expect(vnode.data.attrs['data-id']).to.equal('1')
  })

  it('should handle identifier tag name as components', () => {
    const Test = {}
    const vnode = render(h => <Test/>)
    expect(vnode.tag).to.contain('vue-component')
  })

  it('should work for components with children', () => {
    const Test = {}
    const vnode = render(h => <Test><div>hi</div></Test>)
    const children = vnode.componentOptions.children
    expect(children[0].tag).to.equal('div')
  })

  it('should bind things in thunk with correct this context', () => {
    const Test = {
      render (h) {
        return <div>{this.$slots.default}</div>
      }
    }
    const context = { test: 'foo' }
    const vnode = render((function (h) {
      return <Test>{this.test}</Test>
    }).bind(context))
    const vm = createComponentInstanceForVnode(vnode)
    const childVnode = vm._render()
    expect(childVnode.tag).to.equal('div')
    expect(childVnode.children[0].text).to.equal('foo')
  })

  it('spread (single object expression)', () => {
    const props = {
      innerHTML: 2
    }
    const vnode = render(h => (
      <div {...{ props }}/>
    ))
    expect(vnode.data.props.innerHTML).to.equal(2)
  })

  it('spread (mixed)', () => {
    const calls = []
    const data = {
      attrs: {
        id: 'hehe'
      },
      on: {
        click: function () {
          calls.push(1)
        }
      },
      props: {
        innerHTML: 2
      },
      hook: {
        insert: function () {
          calls.push(3)
        }
      },
      class: ['a', 'b']
    }
    const vnode = render(h => (
      <div href="huhu"
        {...data}
        class={{ c: true }}
        on-click={() => calls.push(2)}
        hook-insert={() => calls.push(4)} />
    ))

    expect(vnode.data.attrs.id).to.equal('hehe')
    expect(vnode.data.attrs.href).to.equal('huhu')
    expect(vnode.data.props.innerHTML).to.equal(2)
    expect(vnode.data.class).to.deep.equal(['a', 'b', { c: true }])
    // merge handlers properly for on
    vnode.data.on.click()
    expect(calls).to.deep.equal([1, 2])
    // merge hooks properly
    vnode.data.hook.insert()
    expect(calls).to.deep.equal([1, 2, 3, 4])
  })

  it('custom directives', () => {
    const vnode = render(h => (
      <div v-test={ 123 } v-other={ 234 } />
    ))

    expect(vnode.data.directives.length).to.equal(2)
    expect(vnode.data.directives[0]).to.deep.equal({ name: 'test', value: 123 })
    expect(vnode.data.directives[1]).to.deep.equal({ name: 'other', value: 234 })
  })

  it('xlink:href', () => {
    const vnode = render(h => (
      <use xlinkHref={'#name'}></use>
    ))

    expect(vnode.data.attrs['xlink:href']).to.equal('#name')
  })

  it('merge class', () => {
    const vnode = render(h => (
      <div class="a" {...{ class: 'b' }}/>
    ))

    expect(vnode.data.class).to.deep.equal({ a: true, b: true })
  })

  it('h self-defining in object methods', () => {
    const obj = {
      method () {
        return <div>test</div>
      }
    }
    const vnode = render(h => obj.method.call({ $createElement: h }))
    expect(vnode.tag).to.equal('div')
    expect(vnode.children[0].text).to.equal('test')
  })

  it('h self-defining in object getters', () => {
    const obj = {
      get computed () {
        return <div>test</div>
      }
    }
    const vnode = render(h => {
      obj.$createElement = h
      return obj.computed
    })
    expect(vnode.tag).to.equal('div')
    expect(vnode.children[0].text).to.equal('test')
  })

  it('h self-defining in multi-level object getters', () => {
    const obj = {
      inherited: {
        get computed () {
          return <div>test</div>
        }
      }
    }
    const vnode = render(h => {
      obj.inherited.$createElement = h
      return obj.inherited.computed
    })
    expect(vnode.tag).to.equal('div')
    expect(vnode.children[0].text).to.equal('test')
  })

  it('h self-defining in class methods', () => {
    class Test {
      constructor (h) {
        this.$createElement = h
      }
      render () {
        return <div>test</div>
      }
    }
    const vnode = render(h => (new Test(h)).render(h))
    expect(vnode.tag).to.equal('div')
    expect(vnode.children[0].text).to.equal('test')
  })

  it('h self-defining in class getters', () => {
    class Test {
      constructor (h) {
        this.$createElement = h
      }
      get computed () {
        return <div>test</div>
      }
    }
    const vnode = render(h => (new Test(h)).computed)
    expect(vnode.tag).to.equal('div')
    expect(vnode.children[0].text).to.equal('test')
  })

  it('h self-defining in methods with parameters', () => {
    class Test {
      constructor (h) {
        this.$createElement = h
      }
      notRender (notH) {
        return <div>{notH}</div>
      }
    }
    const vnode = render(h => (new Test(h)).notRender('test'))
    expect(vnode.tag).to.equal('div')
    expect(vnode.children[0].text).to.equal('test')
  })

  it('should handle special attrs properties', () => {
    const vnode = render(h => (
      <input value="value" />
    ))
    expect(vnode.data.attrs.value).to.equal('value')
  })

  it('should handle special domProps properties', () => {
    const vnode = render(h => (
      <input value={'some jsx expression'} />
    ))
    expect(vnode.data.domProps.value).to.equal('some jsx expression')
  })
})

// helpers

function render (render) {
  return new Vue({
    render
  })._render()
}

function createComponentInstanceForVnode (vnode) {
  const opts = vnode.componentOptions
  return new opts.Ctor({
    _isComponent: true,
    parent: opts.parent,
    propsData: opts.propsData,
    _componentTag: opts.tag,
    _parentVnode: vnode,
    _parentListeners: opts.listeners,
    _renderChildren: opts.children
  })
}
