'use strict';

var vm = new Vue({
  el: '#app',
  data: {
    msg: 'Hello JSX'
  },
  methods: {
    hello: function hello() {
      alert('Hello Vue 2.0');
    }
  },
  render: function render(h) {
    return h(
      'div',
      {
        attrs: { id: 'hi' }
      },
      [h(
        'span',
        {
          'class': { a: true, b: true },
          style: { fontSize: '15px' },
          on: {
            click: this.hello
          }
        },
        [this.msg]
      )]
    );
  }
});
