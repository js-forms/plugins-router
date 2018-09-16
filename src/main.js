
const defaultOptions = {
    routes: {},
    className: '',
    nextText: 'Next',
    previousText: 'Previous',
    finishText: 'Finish',
    wrapHeader: true
}

class RouterPlugin {
    constructor (options) {
        this.options = Object.assign({}, defaultOptions, options)
    }
    apply (proxy) {

        proxy.routes = Object.keys(this.options.routes || {}).reduce( (routes, current) => {
            routes[current] = this.options.routes[current]
            return routes
        }, {})

        proxy.formData = {}

        return {
            route: this.route.bind(this, proxy)
        }
    }
    route (proxy, name, data, direction) {

        let fromRoute = proxy.currentRouteName
        let toRoute = name

        if (!this.options.routes.hasOwnProperty(name)) {
            if (this.options.routes.hasOwnProperty('404')) {
                this.route(proxy, '404')
                return
            }
            // check for URL or hash route
            if (name.slice(0, 1) === '#' 
                    || name.slice(0, 1) === '\/' 
                    || name.slice(0, 7) === 'http:\/\/' 
                    || name.slice(0, 8) === 'https:\/\/' ) {
                if (this.options.onRouted && typeof this.options.onRouted === 'function') {
                    if (this.options.onRouted(fromRoute, toRoute)) {
                        window.location.href = name
                    }
                } else {
                    window.location.href = name
                }
                return
            }
            
            throw `Unknown route '${name}'`
        }

        let newRoute = this.options.routes[name]

        let controller = newRoute.controller || {}

        Object.keys(data || {}).forEach( key => {
            controller[key] = data[key]
        })
        console.log('new route', newRoute, data)

        proxy.currentRouteName = name

        const getHtml = (prop) => {
            if (typeof prop === 'function') {
                return prop = prop(controller)
            }
            return prop || ''
        }

        let content = getHtml(newRoute.content)
        let header = getHtml(newRoute.header)

        if (header && this.options.wrapHeader) {
            header = `<div class="form-header">${header}</div>`
        }

        let previousIcon = getHtml(newRoute.previousIcon)
        let nextIcon = getHtml(newRoute.nextIcon)

        let emptyAction = (dir) => `<button class="form-action form-action-${dir}">&nbsp;</button>`
        let prevAction = newRoute.previous ? `<button class="form-action form-action-previous" on="click:routePrevious">${previousIcon}${newRoute.previousText || this.options.previousText}</button>` : emptyAction('previous')
        let nextAction = newRoute.next ? `<button class="form-action form-action-next" type="submit" on="click:routeNext">${newRoute.nextText || this.options.nextText}${nextIcon}</button>` : emptyAction('next')
        
        if (prevAction) {
            controller.routePrevious = () => {
                proxy.route(newRoute.previous, proxy.formData, 'previous')
            }
        }
       
        if (nextAction) {
            controller.routeNext = () => {
                if ('validate' in proxy) {
                    proxy.validate()
                    if (!proxy.form.checkValidity()) {
                        return
                    }
                }                
                if (proxy.serialize && typeof proxy.serialize === 'function') {
                    proxy.formData = Object.assign({}, proxy.formData || {}, proxy.serialize(proxy.form).data)
                }
                proxy.route(newRoute.next, proxy.formData, 'next')
            }
        }   
        
        let formActions = `<div class="form-actions">${prevAction}${nextAction}</div>`
        
        if (!newRoute.previous && !newRoute.next) {
            formActions = ''
        }

        let classNames = `${this.options.className}`
        
        newRoute.refs = proxy.loadHTML(`
            <div ref="route" class="${classNames}" data-route="${name}">${header || ''}<div class="form-content">${content}</div>${formActions}</div>`, controller)
        proxy.currentRoute = newRoute        
        
        proxy.form.innerHTML = ''
        proxy.form.appendChild(proxy.currentRoute.refs.route)
        
        Array.prototype.forEach.call(newRoute.plugins || [], plugin => {
            proxy.use(plugin)
        })
        
        if (this.options.onRouted && typeof this.options.onRouted === 'function') {
            this.options.onRouted(fromRoute, toRoute, direction || 'next')
        }
    }
}

export default RouterPlugin