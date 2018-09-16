# Router plugin for js-forms

Router plugin for navigating to different sections of a form. Makes multi-step forms possible.

# Install 

```bash
    npm install @js-forms/router-plugin
```

# Usage

Import the plugin

```js
import Router from '@js-forms/router-plugin'

```

Define your routes

```js
let routes = {
    start: {
        content: '<div><h1>Welcome</h1></div>',
        controller: {},
        next: 'account'
    },
    account: {
        content: `<div>
            <label for="firstName">First name</label>
            <input type="text" name="firstName" />
        </div>`,
        controller: {},
        plugins: [validator()],
        next: 'finish',
        previous: 'start'
    },
    finish: {
        content: function (data) {
            return `<h1>Thank you ${data.firstName}</h1>`;
        },
        controller: {},
        previous: 'start',
        previousText: 'Start Over'
    }
}
```

Use the plugin in the init callback of the form

```js
...
init (proxy) {
    proxy.use(new Router({
        routes: routes,
        onRouted: function (from, to, direction) {
            // do something here
            // from - 'start'
            // to - 'account'
            // direction - 'next'
        }
    }))
}
...
```

## License

[MIT](LICENSE).
