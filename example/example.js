var vm = new Vue({
  el: '#app',
  data: {
    msg: 'Hello JSX'
  },
  methods: {
    hello () {
      alert('Hello Vue 2.0')
    }
  },
  render (h) {
    const attrs = { id: 'hoho' }
    return (
      <div id="hi">
        <span
          class={{ a: true, b: true }}
          style={{fontSize: '15px'}}
          on-click={this.hello}
          {...{ attrs }}>
          {this.msg}
        </span>
      </div>
    )
  }
})
