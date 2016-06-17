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

  it('should handle top-level special attrs', () => {
    const vnode = render(h => (
      <div
        class="foo"
        style="bar"
        key="key"
        ref="ref"
        slot="slot"
        transition>
      </div>
    ))
    expect(vnode.data.class).to.equal('foo')
    expect(vnode.data.style).to.equal('bar')
    expect(vnode.data.key).to.equal('key')
    expect(vnode.data.ref).to.equal('ref')
    expect(vnode.data.slot).to.equal('slot')
    expect(vnode.data.transition).to.equal(true)
  })

  it('should handle nested properties', () => {
    const noop = _ => _
    const vnode = render(h => (
      <div
        on-click={noop}
        prop-innerHTML="<p>hi</p>"
        hook-insert={noop}
        directive-hello={{  }}>
      </div>
    ))
    expect(vnode.data.on.click).to.equal(noop)
    expect(vnode.data.props.innerHTML).to.equal('<p>hi</p>')
    expect(vnode.data.hook.insert).to.equal(noop)
  })

  it('should handle identifier tag name as components', () => {
    const Test = {}
    const vnode = render(h => <Test/>)
    expect(vnode.tag).to.contain('vue-component')
  })

  it('should thunkify component children', () => {
    const Test = {}
    const vnode = render(h => <Test><div>hi</div></Test>)
    const children = vnode.componentOptions.children
    expect(children).to.be.a('function')
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
